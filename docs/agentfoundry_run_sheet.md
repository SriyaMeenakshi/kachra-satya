# AgentFoundry run sheet (for Likitha)

Use this with `docs/agentfoundry_setup.md`. The expected answers below were produced on 2026-11-11 by running the real lookup tools (`python scripts/qa_tool_cli.py <tool> '<json>'`) against the current data, so you can compare the agent's reply with what the data says. Nothing here has been run against AgentFoundry: the agent is **not** created or connected yet.

## Before you start
1. Create the agent, paste the system prompt from `docs/agentfoundry_setup.md`, and give it the six tools (or upload `data/waste_clean.csv`, `national_stated.csv`, `flags.csv`, `gap_ranking.csv` as its only knowledge, as the setup doc explains).
2. Put the agent's URL in `web/app/config.js` (`agentEndpoint`). The Ask page assumes it accepts `POST {message, language}` and answers with `{reply}` or plain text. If AgentFoundry's request or response shape differs, change `askAgent()` in `web/app/app.js` to match. This shape is an assumption, not something tested.
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
