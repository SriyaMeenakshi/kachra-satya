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
