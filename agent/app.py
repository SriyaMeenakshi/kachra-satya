"""Kachra Satya Q&A web API agent.

Exposes POST /ask with {"question": "...", "language": "en"}
that returns {"answer": "...", "sources": [...]}.

Uses Google Gemini or Anthropic Claude based on MODEL_PROVIDER env var.
Fallback mode (no API key): answers with tools only, in English.

Setup:
    pip install flask flask-cors google-genai anthropic pandas
    
    For Google Gemini:
        set MODEL_PROVIDER=gemini
        set MODEL_API_KEY=<your-gemini-key>
    
    For Anthropic Claude:
        set MODEL_PROVIDER=anthropic
        set MODEL_API_KEY=<your-anthropic-key>
    
    For fallback (no model):
        (no keys needed; answers with tools only)

Run:
    python agent/app.py

Test:
    curl -X POST http://localhost:5000/ask \
      -H "Content-Type: application/json" \
      -d '{"question": "Kerala treated vs collected", "language": "en"}'
"""
import json
import logging
import os
import sys
import time
import pandas as pd
from typing import Any
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

# Add scripts folder to path to import qa_agent
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

app = Flask(__name__)
# Configure CORS from environment variable ALLOWED_ORIGINS (comma-separated). If unset, default to localhost only.
allowed = os.environ.get("ALLOWED_ORIGINS", "").strip()
if allowed:
    origins = [o.strip() for o in allowed.split(",") if o.strip()]
else:
    origins = ["http://localhost", "http://127.0.0.1"]
CORS(app, origins=origins)

MODEL_PROVIDER = os.environ.get("MODEL_PROVIDER", "").lower()
MODEL_API_KEY = os.environ.get("MODEL_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash").strip() or "gemini-3.8-flash"
MODEL_TIMEOUT_S = float(os.environ.get("MODEL_TIMEOUT_S", "15"))   # total budget for all model calls in one /ask
GEMINI_MAX_TOOL_ROUNDS = int(os.environ.get("GEMINI_MAX_TOOL_ROUNDS", "5"))
GEMINI_COOLDOWN_S = float(os.environ.get("GEMINI_COOLDOWN_S", "60"))           # skip Gemini after a failure
_gemini_down_until = 0.0
log = logging.getLogger("kachra.gemini")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")


FALLBACK_NOTE = "\n\n(AI model unavailable, showing data-only answer)"

# Fixed translations for the tools-only fallback. Only labels and short phrases
# are translated; numbers, state names, file names and metric names are always
# printed exactly as the tools return them.
TEXT = {
    "en": {
        "generated": "generated", "treated": "treated", "collected": "collected",
        "landfilled": "landfilled", "source": "source", "page": "page",
        "not_reported": "not reported", "not_in_data": "Not in the data",
        "sources_disagree": "The sources disagree",
        "fallback_note": "AI model unavailable, showing data-only answer",
    },
    "hi": {
        "generated": "उत्पन्न", "treated": "उपचारित", "collected": "एकत्रित",
        "landfilled": "लैंडफिल किया गया", "source": "स्रोत", "page": "पृष्ठ",
        "not_reported": "रिपोर्ट नहीं किया गया", "not_in_data": "डेटा में नहीं है",
        "sources_disagree": "स्रोत आपस में असहमत हैं",
        "fallback_note": "AI मॉडल उपलब्ध नहीं है, केवल डेटा-आधारित उत्तर दिखाया जा रहा है",
    },
    "ta": {
        "generated": "உருவாக்கப்பட்டது", "treated": "பதப்படுத்தப்பட்டது",
        "collected": "சேகரிக்கப்பட்டது", "landfilled": "நிலத்தில் புதைக்கப்பட்டது",
        "source": "ஆதாரம்", "page": "பக்கம்",
        "not_reported": "அறிக்கையிடப்படவில்லை", "not_in_data": "தரவில் இல்லை",
        "sources_disagree": "ஆதாரங்கள் ஒன்றுக்கொன்று முரண்படுகின்றன",
        "fallback_note": "AI மாதிரி கிடைக்கவில்லை, தரவு மட்டும் அடிப்படையிலான பதில் காட்டப்படுகிறது",
    },
    "te": {
        "generated": "ఉత్పత్తి అయినది", "treated": "శుద్ధి చేసినది",
        "collected": "సేకరించినది", "landfilled": "ల్యాండ్‌ఫిల్‌కు పంపినది",
        "source": "మూలం", "page": "పేజీ",
        "not_reported": "నివేదించబడలేదు", "not_in_data": "డేటాలో లేదు",
        "sources_disagree": "మూలాలు ఒకదానికొకటి విభేదిస్తున్నాయి",
        "fallback_note": "AI మోడల్ అందుబాటులో లేదు, డేటా ఆధారిత సమాధానం చూపబడుతోంది",
    },
}


def _norm_lang(language: str) -> str:
    """'hi', 'ta', 'te' (also 'hi-IN', 'ta_IN'); anything else -> 'en'."""
    code = (language or "en").lower().replace("_", "-").split("-")[0]
    return code if code in TEXT else "en"


def _fmt_tpd(v) -> str:
    """Thousands separators, all decimals kept: 17843.455 -> '17,843.455'.
    Anything that isn't a plain number is returned unchanged."""
    s = str(v).strip().replace(",", "")
    intpart, dot, frac = s.partition(".")
    sign = "-" if intpart.startswith("-") else ""
    digits = intpart.lstrip("+-")
    if digits.isdigit() and (not dot or frac.isdigit()):
        return f"{sign}{int(digits):,}{dot}{frac}"
    return str(v)


def fallback_note(language: str) -> str:
    return f"\n\n({TEXT[_norm_lang(language)]['fallback_note']})"


def _redact(msg: str) -> str:
    """Strip the API key from any text before logging."""
    return msg.replace(MODEL_API_KEY, "***") if MODEL_API_KEY else msg
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# Load the system prompt and tools from qa_agent
from qa_agent import SYSTEM, TOOLS, run_tool

# Cache for DataFrames
_cache = {}


def _df(name: str) -> pd.DataFrame:
    """Load CSV from data/ folder."""
    if name not in _cache:
        path = os.path.join(DATA_DIR, name)
        _cache[name] = pd.read_csv(path).fillna("")
    return _cache[name]


def extract_sources(text: str) -> list[dict]:
    """Extract source citations from agent reply text.
    
    Looks for mentions of source_name, source_doc, source_page in the text.
    This is a simple heuristic; a full implementation might use structured output.
    """
    sources = []
    docs = set()
    
    # Look for document patterns like "cpcb_2021-22.pdf" or "mohua_..."
    import re
    doc_pattern = r"([a-z0-9_-]+\.pdf)"
    for match in re.finditer(doc_pattern, text, re.IGNORECASE):
        docs.add(match.group(1))
    
    # Look for source names like "CPCB", "MoHUA"
    for source in ["CPCB", "MoHUA"]:
        if source in text:
            docs.add(source)
    
    for doc in sorted(docs):
        sources.append({"document": doc})
    
    return sources if sources else []


def _gemini_client(timeout_s: float = MODEL_TIMEOUT_S):
    from google import genai
    from google.genai import types
    return genai.Client(api_key=MODEL_API_KEY, http_options=types.HttpOptions(
        timeout=int(timeout_s * 1000),                        # milliseconds
        retry_options=types.HttpRetryOptions(attempts=1),     # no hidden retries
    ))


def check_gemini_model() -> bool:
    """Startup check: is GEMINI_MODEL available to this key and does it support generateContent?"""
    try:
        m = _gemini_client().models.get(model=GEMINI_MODEL)
        actions = list(getattr(m, "supported_actions", None) or [])
        ok = (not actions) or "generateContent" in actions
        log.info("model check: %s name=%s supported_actions=%s -> %s",
                 GEMINI_MODEL, m.name, actions, "OK" if ok else "NOT usable")
        return ok
    except Exception as e:
        log.error("model check FAILED for %r: %s: %s", GEMINI_MODEL, type(e).__name__, _redact(str(e))[:300])
        return False


def call_gemini_tool_use(question: str) -> tuple[str, list[dict]]:
    """Call Google Gemini (google-genai SDK) with function calling.

    Bounded: GEMINI_MAX_TOOL_ROUNDS model calls and MODEL_TIMEOUT_S in total
    (each HTTP call gets only the time that remains). Raises on any failure so
    the caller can fall back.
    """
    from google.genai import types

    client = _gemini_client()
    declarations = [
        types.FunctionDeclaration(
            name=t["name"],
            description=t["description"],
            parameters_json_schema=t["input_schema"],
        )
        for t in TOOLS
    ]
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM,
        tools=[types.Tool(function_declarations=declarations)],
        max_output_tokens=2000,
        # We run the tool loop ourselves.
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
    )
    contents = [types.Content(role="user", parts=[types.Part(text=question)])]
    start = time.monotonic()

    for rnd in range(1, GEMINI_MAX_TOOL_ROUNDS + 1):
        remaining = MODEL_TIMEOUT_S - (time.monotonic() - start)
        if remaining <= 0.5:
            raise TimeoutError(f"model budget {MODEL_TIMEOUT_S}s exhausted before round {rnd}")
        config.http_options = types.HttpOptions(
            timeout=int(remaining * 1000), retry_options=types.HttpRetryOptions(attempts=1))
        t0 = time.monotonic()
        response = client.models.generate_content(model=GEMINI_MODEL, contents=contents, config=config)
        if not response.candidates or not response.candidates[0].content:
            raise RuntimeError(f"Gemini returned no content (prompt_feedback={response.prompt_feedback})")
        cand = response.candidates[0]
        parts = cand.content.parts or []
        calls = [p.function_call for p in parts if p.function_call]
        log.info("round %d model=%s %.1fs finish=%s tool_calls=%s", rnd, GEMINI_MODEL,
                 time.monotonic() - t0, cand.finish_reason, [c.name for c in calls])

        if not calls:
            text = "".join(p.text for p in parts if p.text)
            if not text:
                raise RuntimeError(f"Gemini returned empty text (finish_reason={cand.finish_reason})")
            return text, extract_sources(text)

        contents.append(cand.content)
        result_parts = []
        for fc in calls:
            raw = run_tool(fc.name, dict(fc.args or {}))
            try:
                payload = json.loads(raw)
            except Exception:
                payload = raw
            # function_response.response must be a dict
            if not isinstance(payload, dict):
                payload = {"result": payload}
            result_parts.append(types.Part.from_function_response(name=fc.name, response=payload))
        contents.append(types.Content(role="user", parts=result_parts))

    raise RuntimeError(f"no final answer after {GEMINI_MAX_TOOL_ROUNDS} tool rounds")


def call_anthropic_tool_use(question: str) -> tuple[str, list[dict]]:
    """Call Anthropic Claude with tool use."""
    import anthropic
    
    start = time.monotonic()
    messages = [{"role": "user", "content": question}]
    max_steps = 5
    
    for _ in range(max_steps):
        remaining = MODEL_TIMEOUT_S - (time.monotonic() - start)
        if remaining <= 0.5:
            raise TimeoutError(f"model budget {MODEL_TIMEOUT_S}s exhausted")
        client = anthropic.Anthropic(api_key=MODEL_API_KEY, timeout=remaining, max_retries=0)
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1500,
            system=SYSTEM,
            tools=TOOLS,
            messages=messages,
        )
        
        messages.append({"role": "assistant", "content": response.content})
        
        if response.stop_reason != "tool_use":
            text = "".join(b.text for b in response.content if b.type == "text")
            sources = extract_sources(text)
            return text, sources
        
        # Process tool calls
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                tool_result = run_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": tool_result,
                })
        
        if tool_results:
            messages.append({"role": "user", "content": tool_results})
    
    raise RuntimeError(f"no final answer after {max_steps} tool rounds")


def _parse_state_from(text: str) -> str | None:
    """Try to find a state name from the question by matching known states."""
    try:
        lst = json.loads(run_tool("list_states", {}))
    except Exception:
        lst = []
    text_low = text.lower()
    # Prefer longest match
    best = None
    for s in lst:
        if s and s.lower() in text_low:
            if best is None or len(s) > len(best):
                best = s
    return best


def _json_run_tool(name: str, args: dict) -> Any:
    """Call run_tool and parse its JSON result."""
    res = run_tool(name, args)
    try:
        return json.loads(res)
    except Exception:
        return res


def call_fallback_tools_only(question: str, language: str = "en") -> tuple[str, list[dict]]:
    """Fallback mode: answer with tools only, no AI model.

    Labels and short phrases are in the request's language (hi, ta, te; else
    English); all data values come straight from the tools.

    This is a small rule-based handler that uses the provided tools to answer
    common question patterns from the acceptance tests. It is not a full
    replacement for the model-based agent but should handle the six run-sheet
    questions when no model key is present.
    """
    lang = _norm_lang(language)
    t = TEXT[lang]
    q = question.strip()
    ql = q.lower()
    sources = []

    # 6: Claim checks like "81%" -> use check_claim
    import re
    pct_match = re.search(r"(\d{1,3}(?:\.\d+)?)\s*%", q)
    if pct_match and "minister" in ql or (pct_match and "%" in q):
        val = float(pct_match.group(1))
        # default metric processed_pct for percent claims
        args = {"metric": "processed_pct", "value": val, "unit": "percent"}
        if "india" not in ql:
            # try to extract state
            state = _parse_state_from(q)
            if state:
                args["state"] = state
        res = _json_run_tool("check_claim", args)
        # Build a readable reply in English
        verdict = res.get("verdict") if isinstance(res, dict) else None
        details = res.get("details") if isinstance(res, dict) else None
        answer = "Claim check: "
        if verdict:
            answer += verdict + ". "
        if isinstance(res, dict):
            # Summarize counts if available
            recs = res.get("records") or []
            matches = [r for r in recs if r.get("matches")]
            nonmatches = [r for r in recs if not r.get("matches")]
            unit = "%" if (res.get("claim") or {}).get("unit") == "percent" else " tpd"
            if recs:
                answer += f"{len(matches)} source figures match this claim and {len(nonmatches)} do not."
            else:
                answer += str(res.get("reason") or "No comparable figure in the data.")
            if verdict == "SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS":
                answer += f" {t['sources_disagree']}."
            years = sorted({r.get("year") for r in recs if r.get("year")})
            if len(years) > 1:
                answer += f" The figures cover different years ({years[0]} to {years[-1]}), so part of any difference may be real change."
            for r in recs[:8]:   # the tool lists matching records first; every figure carries its source and page
                answer += (f"{chr(10)}- {r.get('source_name')} {r.get('year')} ({r.get('kind')}): {_fmt_tpd(r.get('value'))}{unit}, "
                           f"{'matches' if r.get('matches') else 'does not match'} ({r.get('source_doc')}, {t['page']} {r.get('source_page')})")
            for r in recs:
                doc = r.get("source_doc")
                if doc and {"document": doc} not in sources:
                    sources.append({"document": doc})
        else:
            answer += str(res)
        return answer, sources

    # 1: "<State> treated vs collected"
    if "treated vs collected" in ql or ("treated" in ql and "collected" in ql):
        state = _parse_state_from(q) or q.split()[0].title()
        treated = _json_run_tool("lookup_state", {"state": state, "metric": "treated"})
        collected = _json_run_tool("lookup_state", {"state": state, "metric": "collected"})
        flags = _json_run_tool("get_flags", {"state": state, "rule": "6_"})
        if lang == "en":
            answer_lines = [f"Treated vs collected for {state} (from tools):"]
        else:
            answer_lines = [f"{state}: {t['treated']} / {t['collected']}"]
        def fmt_rows(rows):
            if isinstance(rows, dict) and rows.get("result") == "no rows":
                return ["no rows"]
            if not rows:
                return ["no rows"]
            out = []
            for r in rows:
                v = _fmt_tpd(r["value_tpd"]) if r.get("value_tpd") else t["not_reported"]
                out.append(f"{r.get('year')}: {r.get('metric')} {v} tpd ({t['source']}: {r.get('source_name')}, {r.get('source_doc')}, {t['page']} {r.get('source_page')})")
            return out
        try:
            t_rows = treated if isinstance(treated, list) else []
            c_rows = collected if isinstance(collected, list) else []
        except Exception:
            t_rows, c_rows = treated, collected
        by = {}
        for r in t_rows:
            by.setdefault((r.get("year"), r.get("source_name")), {})["t"] = r
        for r in c_rows:
            by.setdefault((r.get("year"), r.get("source_name")), {})["c"] = r
        def num(r):
            try:
                return float(str(r.get("value_tpd")).replace(",", ""))
            except Exception:
                return None
        above = 0
        for (yr, src), d in sorted(by.items(), key=lambda kv: (str(kv[0][1]), str(kv[0][0]))):
            if "t" not in d or "c" not in d:
                continue   # compare only when both figures come from the same source and year
            tv, cv = num(d["t"]), num(d["c"])
            tt = (_fmt_tpd(tv) if tv is not None else t["not_reported"])
            cc = (_fmt_tpd(cv) if cv is not None else t["not_reported"])
            mark = ""
            if tv is not None and cv is not None and tv > cv:
                above += 1
                mark = "  <- treated is above collected"
            for rr in (d["t"], d["c"]):   # only documents the answer actually cites
                if rr.get("source_doc") and {"document": rr["source_doc"]} not in sources:
                    sources.append({"document": rr["source_doc"]})
            answer_lines.append(f"{yr}: {t['treated']} {tt} vs {t['collected']} {cc} tpd ({t['source']}: {src}, {d['t'].get('source_doc')}, {t['page']} {d['t'].get('source_page')}){mark}")
        if above:
            answer_lines.append(f"In {above} year(s) more waste is reported treated than collected. Both cannot be true; the data does not say which figure to trust.")
        # flags
        if flags:
            if isinstance(flags, dict) and flags.get("result") == "no flags":
                pass
            else:
                answer_lines += ["Flags:"]
                for f in (flags if isinstance(flags, list) else []):
                    answer_lines.append(f"{f.get('year')} {f.get('rule')}: {f.get('values')}")
        return "\n".join(answer_lines), sources

    # 2 & 3 & 5: state metric year queries, e.g. "Bihar treated waste 2019-20"
    year_match = re.search(r"(20\d{2}-\d{2})", q)
    year = year_match.group(1) if year_match else None
    # detect metric keywords
    metric = None
    if "generated" in ql:
        metric = "generated"
    elif "collected" in ql:
        metric = "collected"
    elif "treated" in ql and "processed" not in ql:
        metric = "treated"
    elif "landfill" in ql or "landfilled" in ql or "landfill" in ql:
        metric = "landfilled"
    # check state mention
    state = _parse_state_from(q)
    if state and metric:
        args = {"state": state, "metric": metric}
        if year:
            args["year"] = year
        rows = _json_run_tool("lookup_state", args)
        if isinstance(rows, dict) and rows.get("result") == "no rows":
            if lang == "en":
                return f"No rows found for {state} {metric} {year or ''}. Not in the data.", []
            return f"{state} {t[metric]} {year or ''}: {t['not_in_data']}.", []
        # Format single-row responses
        metric_label = metric if lang == "en" else t[metric]
        lines = [f"{state} {metric_label} {year if year else ''}:"]
        for r in (rows if isinstance(rows, list) else []):
            v = _fmt_tpd(r["value_tpd"]) + " tpd" if r.get("value_tpd") else t["not_reported"]
            note =r.get("note") or ""
            lines.append(f"{v}. {t['source'].capitalize()}: {r.get('source_name')}, {r.get('source_doc')}, {t['page']} {r.get('source_page')}")
            if not r.get("value_tpd"):
                # The note text comes from the data as-is; only English gets the "Note:" label.
                lines.append(f"Note: {note}" if lang == "en" else note)
            doc = r.get("source_doc")
            if doc:
                sources.append({"document": doc})
        return "\n".join(lines), sources

    # 4: largest CPCB vs MoHUA gap -> use gap_ranking
    if "gap" in ql or ("largest" in ql and ("gap" in ql or "difference" in ql)):
        rows = _json_run_tool("gap_ranking", {"top_n": 10})
        lines = ["Top gaps between CPCB 2023-24 and MoHUA 2025-26 (tool data):"]
        if isinstance(rows, list):
            for r in rows[:10]:
                lines.append(f"{r.get('state')}: gap {r.get('gap_pct_points')} points (CPCB 2023-24 {r.get('cpcb_pct_treated')}% treated vs MoHUA 2025-26 {r.get('mohua_pct_processed')}% processed)")
                for doc in re.findall(r"[\w\-]+\.(?:pdf|docx)", str(r.get("sources") or "")):
                    if {"document": doc} not in sources:
                        sources.append({"document": doc})
            lines.append("Note: CPCB is 2023-24 and MoHUA is 2025-26 (different years).")
            return "\n".join(lines), sources
        return "No gap ranking available.", []

    # Default fallback: return a short helper message and list_states
    states = _json_run_tool("list_states", {})
    s_preview = ", ".join(states[:6]) if isinstance(states, list) else ""
    answer = (
        "Fallback mode: I can run lookup tools but I don't have a model to reason.\n"
        "I recognized none of the specific patterns. If you ask e.g. 'Kerala treated vs collected' or 'Tamil Nadu generated 2023-24' I can look those up.\n"
        f"Some known states: {s_preview}..."
    )
    return answer, []


@app.route("/ask", methods=["POST"])
def ask():
    """
    POST /ask endpoint.
    
    Request: {"question": "...", "language": "en"}
    Response: {"answer": "...", "sources": [...]}
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400
        
        question = data.get("question", "").strip()
        language = data.get("language", "en").lower()
        
        if not question:
            return jsonify({"error": "question is required"}), 400
        
        # Check if we have API key and provider
        if not MODEL_PROVIDER or not MODEL_API_KEY:
            answer, sources = call_fallback_tools_only(question, language)
        elif MODEL_PROVIDER in ("gemini", "anthropic"):
            global _gemini_down_until
            if MODEL_PROVIDER == "gemini" and time.monotonic() < _gemini_down_until:
                log.info("gemini in cooldown; using tools-only fallback")
                answer, sources = call_fallback_tools_only(question, language)
                answer += fallback_note(language)
            else:
                call = call_gemini_tool_use if MODEL_PROVIDER == "gemini" else call_anthropic_tool_use
                try:
                    answer, sources = call(question)
                except Exception as e:
                    log.error("%s call failed: %s: %s", MODEL_PROVIDER, type(e).__name__, _redact(str(e))[:300])
                    if MODEL_PROVIDER == "gemini":
                        _gemini_down_until = time.monotonic() + GEMINI_COOLDOWN_S
                    answer, sources = call_fallback_tools_only(question, language)
                    answer += fallback_note(language)
        else:
            return jsonify({
                "error": f"Unknown MODEL_PROVIDER: {MODEL_PROVIDER}. Use 'gemini' or 'anthropic'."
            }), 400

        return jsonify({
            "answer": answer,
            "sources": sources,
            "timestamp": datetime.utcnow().isoformat(),
        }), 200

    except Exception as e:
        app.logger.exception("Error in /ask")
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_provider": MODEL_PROVIDER if MODEL_API_KEY else "none (fallback mode)",
        "timestamp": datetime.utcnow().isoformat(),
    }), 200


if __name__ == "__main__":
    print("Kachra Satya Q&A Web API Agent")
    print(f"Model Provider: {MODEL_PROVIDER if MODEL_API_KEY else 'NONE (fallback mode)'}")
    print(f"CORS allowed origins: {origins}")
    if MODEL_PROVIDER == "gemini" and MODEL_API_KEY:
        print(f"Gemini model: {GEMINI_MODEL}")
        if not check_gemini_model():
            _gemini_down_until = float("inf")
            print("WARNING: Gemini model not usable with this key; serving tools-only fallback. See log above.")
    print("Starting server on http://localhost:5000")
    print("POST /ask with {\"question\": \"...\", \"language\": \"en\"}")
    print("GET /health for status")
    debug = os.environ.get("DEBUG", "0") == "1"
    # Disable the reloader unless DEBUG=1 to avoid restarts from .venv changes
    use_reloader = debug
    app.run(debug=debug, port=5000, use_reloader=use_reloader)
