# Kachra Satya: AgentFoundry note

AgentFoundry was used as the IDE (SMART-CODE and CLAUDE CODE panels). AgentFoundry's own agent platform (Build, Replay, Agent21) was not used.

## What was built

The `agent/` folder contains a Python web Q&A API that answers questions about India's municipal solid waste figures using data tools and, when a key is set on the host, an AI model.

**Built in AgentFoundry** (SMART-CODE and CLAUDE CODE panels, used as the IDE):
- `agent/app.py`: Flask web server with a `POST /ask` endpoint
- `agent/requirements.txt`: Python package versions
- `agent/README.md`: setup and run instructions
- `agent/ENV_EXAMPLE.txt`: environment variable template
- `agent/test_acceptance.py`: runs the acceptance questions from `docs/agentfoundry_run_sheet.md`

**Fixed in the AgentFoundry CLAUDE CODE panel:**
- Moved the Gemini calls from `google-generativeai` to the `google-genai` SDK, with a total time limit per request.
- Added a data-only fallback: a rule-based handler that answers from the data tools without an AI model, using simple pattern matching on the question.
- Added Hindi, Tamil and Telugu labels in fallback mode (fixed translated labels for key terms; numbers, state names and file names are never translated). These translations are a first draft and have not been reviewed by native speakers.
- Added thousands separators to numbers in answers (for example 17,843.455).

**Test and build results (FILL IN from your own run before committing):**
- `python -m pytest -q tests`: 188 passed
- `python scripts/build_site.py`: built dist -> 95 files
- Date of the run: 2026-11-15

Later changes to `agent/` (accounts and sign-in, Render deployment settings and their packages) were made by teammates outside AgentFoundry.

## How a request is answered

1. The client sends `POST /ask` with `{"question": "...", "language": "en"}`.
2. If `MODEL_PROVIDER` and `MODEL_API_KEY` are set in the host's environment, the agent calls the model with the system prompt and the data tools. The system prompt tells the model to reply in the language of the question. If the model call fails or times out, the agent falls back to data-only mode.
3. If no model key is set, the agent answers with the data tools only, using rule-based pattern matching. Labels and short phrases use the requested language (hi, ta, te, or en). Data values are always printed as the tools return them.
4. The reply is `{"answer": "...", "sources": [...], "timestamp": "..."}`.

## Data tools

All tools read CSV files in `data/`:
- `lookup_state`: state-level metrics (generated, collected, treated, landfilled)
- `get_flags`: validation flags
- `national_figures`: national totals as stated in the source documents
- `gap_ranking`: states ranked by the CPCB vs MoHUA gap (different years)
- `check_claim`: checks a numeric claim against every figure in the data
- `list_states`: all state and UT names

## Fallback mode

When no model key is present, `call_fallback_tools_only()` answers these patterns:
- "State treated vs collected": looks up both and compares them
- "State metric year" (for example "Tamil Nadu generated 2023-24")
- "Largest CPCB vs MoHUA gap"
- A numeric claim such as "81% processed": runs `check_claim` and reports the verdict in plain words
- Anything else: a short help message

Only fixed labels and phrases are translated. Gap-ranking text, claim interpretations and flag explanations come back in English.

## Hosting and model mode

- The web UI was built in the Claude desktop app's Code tab, outside AgentFoundry.
- The live site is hosted on Render at https://kachra-satya.onrender.com, set up by Sriya.
- On 2026-11-14, `/health` on the live site showed `gemini`, and 5 of 6 acceptance questions passed in model mode (see `docs/agentfoundry_run_sheet.md`). Answers followed the question's language (Hindi, Tamil, Telugu).
- Open problems from that run: the Kerala answer did not say treated is above collected, and a gap question typed in Tamil script fell back to data-only mode.
- Model mode depends on the host's key and falls back to data-only mode if the provider is unavailable.

## Configuration

Environment variables:
- `MODEL_PROVIDER`: "gemini", "grok" or "anthropic" (empty means fallback mode)
- `MODEL_API_KEY`: API key for the chosen provider (never commit this)
- `ALLOWED_ORIGINS`: comma-separated list of allowed browser origins (default: http://localhost, http://127.0.0.1)
- `DEBUG`: "1" turns on Flask debug mode (default: off)
- `GEMINI_MODEL`, `GROK_MODEL`, `ANTHROPIC_MODEL`: model names (see the defaults in `agent/app.py`)
- `MODEL_TIMEOUT_S`: total time budget in seconds for model calls per request (default: 15)

## Test suite

`agent/test_acceptance.py` runs seven checks (six questions; question 5 has two parts) against a running `/ask` endpoint:

1. Kerala treated vs collected (en): expect the four flagged years (2019-20 to 2022-23)
2. Bihar treated 2019-20 (hi): expect "not reported"
3. Tamil Nadu generated 2023-24 (ta): expect 17,843.455 tpd
4. Largest CPCB vs MoHUA gap (te): expect the different-years caveat (2023-24 vs 2025-26)
5. Maharashtra landfilled 2023-24 (en): expect "not in the data"
6. Maharashtra landfilled 2021-22 (en): expect 2,067 tpd and `cpcb_2021-22.pdf`
7. Claim "81% processed" (en): expect "supported by some, contradicted by others"

The script checks keywords only, so read the answers too. Run it with the server started:

```
python agent/test_acceptance.py
```

## Known limits

- Fallback labels in Hindi, Tamil and Telugu are first drafts, not reviewed by native speakers.
- Fallback mode handles only the question patterns above.
- Model-mode answers can be slow on the first call (up to about 17 seconds in the 2026-11-14 run).

## Not changed by the AgentFoundry session

- `data/`: all CSVs
- `scripts/`: not edited in the AgentFoundry session
- `claim.js` and the web UI in `web/app/`: built outside AgentFoundry