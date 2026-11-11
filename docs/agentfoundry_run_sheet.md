# AgentFoundry run sheet (for Likitha)

Use this with `docs/agentfoundry_setup.md`. The expected answers below were produced on 2026-11-11 by running the real lookup tools (`python scripts/qa_tool_cli.py <tool> '<json>'`) against the current data, so you can compare the agent's reply with what the data says. **Status (2026-11-11).** The team built the agent as a small Flask web API in `agent/` (`POST /ask`, see `agent/README.md`) with a data-only fallback that needs no model key. Nothing here has been run against AgentFoundry itself, and **model mode (Gemini or Anthropic) has not been tested**: no API key was available. What was run is the fallback, below.

## Before you start
1. Create the agent, paste the system prompt from `docs/agentfoundry_setup.md`, and give it the six tools (or upload `data/waste_clean.csv`, `national_stated.csv`, `flags.csv`, `gap_ranking.csv` as its only knowledge, as the setup doc explains).
2. Put the agent's URL in `web/app/config.js` (`agentEndpoint`). The Ask page sends `{question, message, language: "en"|"hi"|"ta"|"te"}` and reads `answer` (or `reply`, `response`, or plain text) plus `sources`. That shape is tested against the agent in `agent/`. If AgentFoundry's shape differs, change `askAgent()` in `web/app/app.js` to match.
3. Ask each question below in the Ask page (and once in AgentFoundry's own test chat). A reply passes only if every figure comes with its source document and page, blanks are called "not reported", and it never says a source is wrong.

## Known mismatch in the setup doc: question 1
`docs/agentfoundry_setup.md` says to expect "the three rule-6 flags (2019-20 to 2021-22)". **The data has four**: 2019-20, 2020-21, 2021-22 and 2022-23 (`get_flags` with rule `6_` returns four rows; `data/recurrence.csv` also says four years). A correct agent should therefore mention four years. The text lives in `scripts/qa_agent.py`, which is generated into the setup doc; fixing it needs a change in that script (not made here, because `scripts/` was off limits).

## The six questions and what the data says
| # | Ask (language) | Expected, from the tools |
|---|---|---|
| 1 | "Kerala treated vs collected" (English) | Rule 6, treated above collected, in **four** years, all CPCB: 2019-20 treated 1,837 vs collected 880; 2020-21 2,550 vs 964.76; 2021-22 2,691 vs 1,283; 2022-23 3,231 vs 2,096.19. Should say these cannot both be true and not say which is wrong. |
| 2 | Bihar treated waste 2019-20 (Hindi) | **Not reported.** Source note: "not reported (source says 'Not Provided')", CPCB, `rs_q358_2025-02-06.pdf`, page 5. No estimate. |
| 3 | Tamil Nadu generated 2023-24 (Tamil) | 17,843.455 tonnes per day, CPCB, `ls_au50_2025-12-01.pdf`, page 3. |
| 4 | Largest CPCB versus MoHUA gaps (Telugu) | Chandigarh 77.5 points (CPCB 22.5% treated vs MoHUA 100% processed), Jammu and Kashmir 67.4, Punjab 51.6. Must say CPCB is 2023-24 and MoHUA is 2025-26, different years. |
| 5a | Maharashtra landfilled, 2023-24 (English) | "no rows": not in the data. The agent must say so plainly. |
| 5b | Then Maharashtra landfilled, 2021-22 | 2,067 tonnes per day, CPCB, `cpcb_2021-22.pdf`, page 7. |
| 6 | "A minister said 81% of India's waste is processed. Is that true?" | Verdict `SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS` in plain words, no accusation: 14 records, 4 match. MoHUA 2025-26 stated 81.0% (`mohua_81pct_answer.pdf` p.4) and computed 81.01% (p.3) match; CPCB 2023-24 computed 61.62% (`ls_au50_2025-12-01.pdf` p.1) does not; MoHUA 2023-24 stated 78% does not. Different years. |

## Record the result
For each question write: asked in which language, the reply (paste it), pass or fail, and what was fixed. Do not claim the agent works until all six have been run and the endpoint is set. If a question fails, fix the system prompt or the tool, not the data.

## What was run on 2026-11-11 (fallback mode, no model key)
The six questions (seven asks, because question 5 has two parts) were sent to the local agent, first with `agent/test_acceptance.py`, then through the real Ask page in the browser in English, Hindi, Tamil and Telugu. The script passed on its first run, **but its checks are keyword checks, and reading the answers showed two of them were wrong**:
- **Largest CPCB vs MoHUA gap:** every row said "gap None (CPCB None vs MoHUA None)". The fallback read field names the tool does not return.
- **Claim 81%:** it said "Matches: 0; Non-matching: 0" and listed no figures, when the tool returns 4 matching and 10 non-matching records.
Both are fixed in `agent/app.py` (it now reads `gap_pct_points`, `cpcb_pct_treated`, `mohua_pct_processed` and the `records` list). Also fixed: the Kerala answer now compares treated and collected only within the same source and year, says treated is above collected in four years, and no longer lists a MoHUA document it does not cite; "not reported" no longer gets "tpd" after it.
`tests/test_agent_fallback.py` now checks the content of every answer against this sheet (the four Kerala years, 77.5 / 67.4 / 51.6, 4 versus 10 records, 2,067.0 tpd on `cpcb_2021-22.pdf` page 7, and so on), so those two mistakes cannot return unnoticed.

**One web-app bug (two symptoms) found and fixed while connecting it:** the Ask page sent `{message, language: "Hindi"}` while the agent needs `{question, language: "hi"}`, so every real request would have failed with "question is required" and the language labels would never have been used. It now sends both field names and a language code.

**Known limits of fallback mode:** the replies for gap ranking, claim checks and the Kerala comparison are in English whatever the language chosen (only the short labels in the single-figure answers are translated); it recognises only the question patterns in this sheet, and anything else gets a polite "I don't recognise that" message. A real language-aware answer needs model mode.
**Browser access:** the agent refuses browser calls from any site not listed in `ALLOWED_ORIGINS` (default: `http://localhost` and `http://127.0.0.1`, no port), which is a good default. Set it to the site that serves the app.
