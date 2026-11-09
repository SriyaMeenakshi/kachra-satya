"""Kachra Satya Q&A agent (Claude API, tool use over the CSVs).

The model has no waste data of its own: every number must come from a tool call that reads
data/waste_clean.csv, data/national_stated.csv, data/flags.csv or data/gap_ranking.csv.
It answers in the language of the question (English, Hindi, Tamil, Telugu).

Setup (the key stays in your environment, never in the repo):
    pip install anthropic pandas
    set ANTHROPIC_API_KEY=...        (PowerShell: $env:ANTHROPIC_API_KEY = "...")
Use:
    python scripts/qa_agent.py                      # interactive chat
    python scripts/qa_agent.py "Is Kerala's treated waste consistent?"
    from qa_agent import answer; answer("...")       # for the web app backend
"""
import json
import os
import sys
import pandas as pd

MODEL = os.environ.get("KACHRA_MODEL", "claude-sonnet-5-5")
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")

SYSTEM = """You are the Kachra Satya assistant. You answer questions about India's municipal solid waste \
figures using ONLY what the lookup tools return. You have no other knowledge of these numbers.

Rules:
1. Never state a waste figure, year, source or flag that did not come from a tool result in this conversation. \
If you did not look it up, look it up first.
2. Every figure you give must carry its source (source_name, source_doc, source_page) and its year, in tonnes per day (tpd).
3. If a tool shows a value as blank / not reported, say "not reported" and quote the note. Never estimate or fill it in.
4. If the data has a flag for the state or year you are discussing, mention it and what it means.
5. CPCB and MoHUA figures are different years (CPCB 2023-24, MoHUA 2025-26). Say so whenever you compare them. \
Do not call a gap an error: say which source reports what and that the two disagree.
6. If the data cannot answer the question (for example state-wise landfilled, or a year not in the data), say so plainly.
7. Reply in the language of the user's question: English, Hindi, Tamil or Telugu. Keep numbers, source file names \
and metric names (generated, collected, treated) exactly as in the data.
8. You may compute a simple ratio or difference from figures a tool returned (for example treated divided by generated). Label it "computed", show the two inputs with their sources, and never present it as a stated figure.
9. Be brief. No advice beyond what the data supports."""

TOOLS = [
    {"name": "lookup_state",
     "description": "State-level rows from waste_clean.csv: state, year, metric (generated|collected|treated), value_tpd, source_name, source_doc, source_page, note. Blank value_tpd means not reported. Filters are optional.",
     "input_schema": {"type": "object", "properties": {
         "state": {"type": "string", "description": "State or UT name, e.g. 'Tamil Nadu'"},
         "year": {"type": "string", "description": "Financial year like '2023-24'"},
         "metric": {"type": "string", "enum": ["generated", "collected", "treated"]}},
         "required": ["state"]}},
    {"name": "get_flags",
     "description": "Validation flags from flags.csv (rule, values, explanation). Filter by state and/or rule prefix such as '6_'.",
     "input_schema": {"type": "object", "properties": {
         "state": {"type": "string"}, "rule": {"type": "string"}}}},
    {"name": "national_figures",
     "description": "National totals exactly as stated in the source documents, optionally for one year.",
     "input_schema": {"type": "object", "properties": {"year": {"type": "string"}}}},
    {"name": "gap_ranking",
     "description": "States ranked by gap between CPCB 2023-24 percent treated and MoHUA 2025-26 percent processed (different years).",
     "input_schema": {"type": "object", "properties": {"top_n": {"type": "integer"}}}},
    {"name": "list_states",
     "description": "All state/UT names in the dataset.",
     "input_schema": {"type": "object", "properties": {}}},
]

_cache = {}


def _df(name):
    if name not in _cache:
        _cache[name] = pd.read_csv(os.path.join(DATA, name)).fillna("")
    return _cache[name]


def _out(df, limit=200):
    return json.dumps(df.head(limit).to_dict("records"), ensure_ascii=False)


def run_tool(name, args):
    if name == "lookup_state":
        d = _df("waste_clean.csv")
        d = d[d.state.str.lower() == args["state"].strip().lower()]
        if args.get("year"):
            d = d[d.year == args["year"]]
        if args.get("metric"):
            d = d[d.metric == args["metric"]]
        if d.empty:
            return json.dumps({"result": "no rows", "hint": "check list_states for the exact name"})
        return _out(d[["state", "year", "metric", "value_tpd", "source_name", "source_doc", "source_page", "note"]])
    if name == "get_flags":
        d = _df("flags.csv")
        if args.get("state"):
            d = d[d.state.str.lower() == args["state"].strip().lower()]
        if args.get("rule"):
            d = d[d.rule.str.startswith(args["rule"])]
        return _out(d) if not d.empty else json.dumps({"result": "no flags"})
    if name == "national_figures":
        d = _df("national_stated.csv")
        if args.get("year"):
            d = d[d.year == args["year"]]
        return _out(d)
    if name == "gap_ranking":
        d = _df("gap_ranking.csv")
        return _out(d, int(args.get("top_n") or 10))
    if name == "list_states":
        return json.dumps(sorted(_df("waste_clean.csv").state.unique()))
    return json.dumps({"error": f"unknown tool {name}"})


def answer(question, history=None, max_steps=8):
    """Return (reply_text, updated_history). history is a list of API messages."""
    import anthropic
    client = anthropic.Anthropic()          # reads ANTHROPIC_API_KEY
    msgs = list(history or []) + [{"role": "user", "content": question}]
    for _ in range(max_steps):
        r = client.messages.create(model=MODEL, max_tokens=1500, system=SYSTEM, tools=TOOLS, messages=msgs)
        msgs.append({"role": "assistant", "content": r.content})
        if r.stop_reason != "tool_use":
            return "".join(b.text for b in r.content if b.type == "text"), msgs
        results = [{"type": "tool_result", "tool_use_id": b.id, "content": run_tool(b.name, b.input)}
                   for b in r.content if b.type == "tool_use"]
        msgs.append({"role": "user", "content": results})
    return "I could not finish looking this up. Please ask a narrower question.", msgs


def main():
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("Set ANTHROPIC_API_KEY in your environment first (do not put it in the repo).")
    if len(sys.argv) > 1:
        print(answer(" ".join(sys.argv[1:]))[0])
        return
    hist = []
    print("Kachra Satya Q&A (blank line to quit)")
    while True:
        q = input("> ").strip()
        if not q:
            break
        reply, hist = answer(q, hist)
        print(reply, "\n")


if __name__ == "__main__":
    main()
