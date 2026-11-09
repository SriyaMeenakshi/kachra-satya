# Three features for the app

All three run on files already in the repo. None needs new data.

## 1. Claim Checker (`scripts/claim_checker.py`)
`check_claim(metric, value, unit, state, year)` returns a verdict and the evidence.
Verdicts: SUPPORTED, CONTRADICTED, SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS, CANNOT_VERIFY.
Each record carries source, document, page, year, and whether it is `stated` or `computed` (treated divided by generated).
The Q&A agent has it as a tool, so a pasted sentence becomes a call. Example: "81% processed" is supported by MoHUA (80.26 to 81%) and not by CPCB 2023-24 (61.6% computed), and the years differ.
UI idea: a text box, a verdict badge, and a list of the sources that agree and disagree. Never say "wrong" or "lying": say "the sources disagree".

## 2. Receipts (`scripts/make_receipts.py`, output in `receipts/`)
`receipts/index.json` maps `"State|year|metric|source_doc"` to the page image and a highlight box.
`bbox` is [x0, y0, x1, y1] as fractions of the image width and height. Draw a rectangle at those fractions over `receipts/<image>`.
Status: `located` (605 figures, each checked: the text inside the box equals the value), `page_only` (91, show the page without a box), `no_page_image` (10, Word copies or blank values: show the source name and say so).
UI idea: click any number on the map, open a side panel with the page image and the red box.

## 3. Phantom tonnes (`scripts/phantom_tonnes.py`, output `data/phantom_tonnes.csv`)
Reported figures that cannot all be true, in separate counters that must not be added together:
- A: treated above collected (Kerala 2019-20 to 2022-23, Manipur 2022-23 and 2023-24).
- B, C: collected above generated (1 row), treated plus landfilled above generated (Chandigarh 2021-22, explained by the report's footnote).
- D: national "treated" disagreement. MoHUA 2025-26 processed (131,530 tpd) minus CPCB 2023-24 treated (114,110 tpd) = 17,420 tpd. Against MoHUA's Dec 2023 table (no financial year given) the gap to CPCB 2023-24 is 5,599 tpd.
- E: the 17,420 split by state. 16 of 35 states have MoHUA above CPCB; Uttar Pradesh +7,494, Gujarat +3,981, Rajasthan +3,011, Maharashtra +2,818, Delhi +1,819 tpd.
Wording for the UI: "figures that cannot both be true". The data cannot say which source is wrong. Different years are labelled in every row.

## 4. Money vs mess (`scripts/money_vs_mess.py`, output `data/money_vs_mess.csv`)
One row per state (35): SWM allocation 2021-2026 and SWM funds utilised or released to 25.11.2024 (Lok Sabha Q682), their ratio, CPCB 2023-24 percent treated, MoHUA 2025-26 percent processed, and a quadrant.
Quadrants split at the median of each axis, so they are relative, not targets. Example: West Bengal has used 0.4% of its SWM allocation and CPCB 2023-24 has 23.5% of its waste treated; Bihar 0.8% and 25.3%.
UI idea: a scatter plot with utilisation on x, percent treated on y, and the quadrant as colour. Caveats go on the chart: funds are cumulative to Nov 2024, the Q682 table prints no unit (the ratio does not need one), and a low utilisation share prompts a question, it does not prove an execution problem.

## 5. Number volatility (`scripts/volatility.py`, output `data/volatility.csv`)
How much a state's own reported generated waste moves between documents (CPCB 2019-20 to 2023-24, MoHUA Dec 2023 and 2025-26). `swing_ratio` is the highest value divided by the lowest; `min_in` and `max_in` say where each came from. States with fewer than 3 values are not ranked.
Top of the list: Nagaland 22.9x (664 tpd in CPCB 2021-22, 29 in MoHUA 2025-26, both confirmed on the source page), Ladakh 5.8x, Dadra and Nagar Haveli and Daman and Diu 4.7x, Kerala 2.8x (3,543 to 1,253).
UI idea: a ranked bar or a small line chart per state with the source of each point. Wording: "reported figures swing by", not "wrong"; the data cannot say whether it is revision, definition or error.

## 6. Voice questions (not built here)
Speaking a question and hearing the answer is a front-end feature (browser speech recognition and synthesis) layered on the existing Q&A agent. It depends on how well the browser handles Hindi, Tamil and Telugu, so test it on the target devices before promising it in the demo.
