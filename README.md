# Kachra Satya

*Kachra satya* means "the truth about garbage". We audit India's municipal solid waste figures: the Housing Ministry and the pollution control board publish different numbers, and nothing checks them against each other. This project puts them side by side, shows the source page behind every figure, and flags the ones that cannot all be true.

**The idea: a receipt for every waste promise.** Anyone can see what was promised, what was delivered, and what to do next: Promise, Proof, Reality, Action. See `docs/central_idea.md`.

Built for the Code for a Billion hackathon, Waste Management track (submissions close 15 Nov 2026).

## The problem in two numbers
| | Figure | Source |
|---|---|---|
| Housing Ministry (MoHUA) | 80.26% of 161,910 tonnes per day processed | Lok Sabha Q682, 28 Nov 2024 |
| CPCB | 114,110 of 185,195 tonnes per day treated, 61.6% | Lok Sabha Q50, 1 Dec 2025 (CPCB 2023-24) |
| Gap between the two national "treated" totals | 17,420 tonnes per day | MoHUA 2025-26 against CPCB 2023-24 |

These are different years, and CPCB says "treated" where MoHUA says "processed"; we do not know that they mean the same thing (`data/definition_crosswalk.csv`). We do not say which figure is right.

## What it does
- **Dataset:** 676 sourced rows for 36 states and UTs (tonnes per day, 2019-20 to 2025-26). Every row carries its source document, page and retrieval date. Missing values stay blank and say "not reported".
- **Checks:** six rules flag figures that cannot all be true (72 flags). Examples: Kerala reports more waste treated than collected in four years; MoHUA and CPCB differ by more than 10% for 53 state-and-metric pairs.
- **Map:** a geographic map of India's 36 states and UTs coloured by either source or the gap, with a tile-map switch (`docs/map.md`; the boundary has not been verified against the official map).
- **Claim Checker:** test a sentence such as "81% of India's urban waste is processed" against every source. Result: the sources disagree, with who agrees and who does not.
- **Receipts:** open the source page for a figure with the number boxed (605 of 706 figures located; the rest show the page or say there is no page image).
- **Audit first:** a transparent ranking of states where an audit would learn most, plus how much each state's own reported generation swings between reports (Nagaland: 664 tpd in one CPCB report, 29 tpd in a MoHUA answer).
- **Get help:** a complaint writer for the official Swachhata-MoHUA app, a dated log, an escalation letter, a which-bin guide under the 2026 rules, and a bulk-generator check (`docs/saathi.md`). **State card and briefing** for an MP, MLA or councillor, and a **school waste challenge** (`docs/leaders_schools_spotcheck.md`).
- **Phantom tonnes, money vs mess, truck priority, Audit Your City:** supporting analyses and a city-level checker; see `docs/new_features.md`.
- **Gaps screens (app, Gaps tab):** phantom-tonnes counters, a money-vs-mess scatter (share of SWM funds used against percent treated), collection gap and truck priority with landfill share, the national segregation gap, and a per-state reporting-completeness score (`data/completeness.csv`).
- **Voice:** on the Ask tab, speak a question and hear the answer in English, Hindi, Tamil or Telugu using the browser's own speech tools. Support depends on the browser and device; typing always works.

## Try it
Needs Python 3.12 (pandas, pdfplumber, python-docx) and optionally Node for one parity test.

```bash
python -m http.server 8777
```
Then open http://127.0.0.1:8777/web/app/index.html (the integrated app: map, claim checker, gaps, receipts, audit and city audit; the Ask tab works once the Q&A agent endpoint is set), http://127.0.0.1:8777/web/trust/index.html (trust pages alone) or http://127.0.0.1:8777/web/mock/index.html (design mock).

Build a static site for deployment with `python scripts/build_site.py` (writes `dist/`; no source documents or CSVs included). Set the Q&A agent endpoint in `web/app/config.js` once it is live.

Rebuild everything from the source documents in `data/raw/`:
```bash
python scripts/build_clean_csv.py
python scripts/add_cpcb_2021_22_landfilled.py
python scripts/add_cpcb_2022_23.py
python scripts/extract_funds.py
python scripts/extract_au3198.py
python scripts/validate.py
python scripts/volatility.py
python scripts/recurrence_and_priority.py
python scripts/phantom_tonnes.py
python scripts/state_indicators.py
python scripts/completeness.py
python scripts/make_receipts.py
python scripts/export_web_data.py
python -m pytest -q tests
```

## How we know the extraction is right
- Each state column sums to the table's printed total (differences under 0.6 tpd are source rounding; one 2 tpd gap in MoHUA 2025-26 is in the source itself).
- 664 of 666 numeric cells were found on their cited PDF page; the other 2 are "Nil" cells stored as 0.
- CPCB 2021-22 Table 1 agrees with Rajya Sabha Q358 exactly, an independent cross-check.
- A 30-cell spot check matched 30 of 30. It was an AI-assisted visual read, not a manual hand check; a human check of a few rows is still worthwhile.
- 29 automated tests, including a check that the browser Claim Checker gives the same verdicts as the Python one.
Details: `docs/methodology.md`.

## What it does not do
- **Segregation, collection routing, recycling markets, plastic tracking:** only partly covered or not covered. See `docs/track_coverage.md` for what each segment has and its limits. There is no route optimisation, no recycling price data, and no plastic data.
- **Truth:** it checks extraction accuracy and consistency between and within reports. All figures are self-reported by states, cities and boards; we cannot say whether a source is correct.
- **State landfilled:** reported only for 2021-22 and 2022-23.
- **The funds table** (Lok Sabha Q682) prints no unit; we only use ratios from it.

## Data, sources and attribution
- Every document is listed with publisher, URL and retrieval date in `SOURCES.md`.
- `data/raw/` and `receipts/pages/` are unchanged copies of published government documents, kept so a figure can be checked against its page. Rights stay with each publisher; see `data/raw/NOTICE.md` and `receipts/NOTICE.md`. We are not affiliated with or endorsed by the Lok Sabha or Rajya Sabha Secretariat, CPCB or MoHUA.
- Reuse terms for most sources are not confirmed: read `docs/licences.md` before any public data release. Draft permission requests are in `docs/permission_requests.md` (not yet sent).
- Code is MIT (`LICENSE`). A licence for our compiled data has not been chosen yet.
- Dataset release package: `scripts/build_release.py` (no documents or page images included).

## Repository map
| Folder | What is in it |
|---|---|
| `data/` | The CSVs (see `docs/data_dictionary.md`); `data/raw/` holds the source documents |
| `scripts/` | Extraction, validation, analysis and release scripts |
| `web/app/`, `web/trust/`, `web/mock/` | Integrated app, trust pages and the design mock |
| `receipts/` | Page images and the index that places each figure on its page |
| `briefs/` | One-page Action Briefs for each state |
| `docs/` | Methodology, licences, track coverage, UI direction, team split, ideas |
| `tests/` | Automated tests |

## Team (roles as proposed in `docs/team_split_v3.md`)
- Yasaswini-ch: trust layer (claim checker, receipts, audit list, definitions), dataset publishing
- Sriya Meenakshi Chalamalasetty: data extraction and sourcing; money, gaps and track coverage
- Likhitha: platform, deployment, Q&A agent setup, demo and submission

## Status (2026-11-10)
Gaps screens (phantom tonnes, money vs mess, collection and trucks, segregation, completeness) and voice questions are in the app. Voice has been tested only with stubbed speech engines, not yet on real phones in Hindi, Tamil and Telugu. The plastic audit is not started: it needs the CPCB plastic waste annual report downloaded by hand.

Data, checks, working trust pages and design mock are in the repo. Not yet done: the integrated deployed web app, the Q&A agent live on AgentFoundry (setup in `docs/agentfoundry_setup.md`), the demo video, and the public URL.
