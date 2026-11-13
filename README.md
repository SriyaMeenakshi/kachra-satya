# Kachra Satya

*Kachra satya* means "the truth about garbage". India's Housing Ministry (MoHUA) and the pollution control board (CPCB) publish different numbers for the same municipal solid waste, and nothing checks them against each other. This project puts them side by side, shows the source page behind every figure, flags the ones that cannot all be true, and helps an ordinary person do something about it.

**The idea: a receipt for every waste promise.** Promise, Proof, Reality, Action. Someone says a number; you check it on the page it came from; you see whether it holds on your street; you get a complaint, a log and a letter you can send. Details: [docs/central_idea.md](docs/central_idea.md).

Built for the Code for a Billion hackathon, Waste Management track (submissions close 15 Nov 2026).

## The idea in one loop
Every page is one stop on the same loop, and each page says which one:

| Stop | A person asks | Pages |
|---|---|---|
| **1. Promise** | What did they say? | Check a claim, Ask |
| **2. Proof** | Is it true on paper? | Map, Insights (gaps, landfill, receipts, definitions), About |
| **3. Reality** | Is it true on my street? | Your ward, Your city |
| **4. Action** | What can I do about it? | Get help, Briefing, Schools, Nearest drop-off |

The Home page shows the loop, every other page carries a step bar with a link to the next stop, and the demo film labels each step with its stop. The definition is in `web/app/loop.js`.

## The problem in two numbers
| | Figure | Source |
|---|---|---|
| Housing Ministry (MoHUA) | 81% processed: 131,530 of 162,372 tonnes per day, 2025-26 | Rajya Sabha Q2433 (MoHUA answer, p.3) |
| CPCB | 114,110 of 185,195 tonnes per day treated, 61.6% | Lok Sabha Q50, 1 Dec 2025 (CPCB 2023-24) |
| Difference between the two national "treated" totals (a difference between reports, not missing waste) | 17,420 tonnes per day | MoHUA 2025-26 against CPCB 2023-24 |

These are different years, and CPCB says "treated" where MoHUA says "processed". We do not know that the two words mean the same thing ([data/definition_crosswalk.csv](data/definition_crosswalk.csv)), so we never say which figure is right.

## What the app does
Open it and the Home page asks "What brings you here?". Pick a goal and the app walks you through a short path of pages (see Guided paths). Everything below is reachable from the top bar; on narrow screens some pages sit in the **More** menu.

| Page | Route | What it gives you |
|---|---|---|
| **Home** | `#/start` | Four doors by visitor (garbage not collected, a quoted number, a briefing, a school), one lead case chosen by rule (the state where the two newest figures are furthest apart, each with its source page), the two official numbers with the three reasons they differ and the five words, three stakes computed from the data, and "See it working": a short self-playing film of four demo screens (one per door) with made-up inputs and the real figures, verdicts and documents; it can be paused |
| **Map** | `#/map` | Geographic map of 36 states and UTs, coloured by MoHUA, CPCB or the gap, with a Tiles switch. It opens on an India summary with how to read the colours; tap a state for both figures and the source page ([docs/map.md](docs/map.md)) |
| **Check a claim** | `#/claim` | Type a sentence such as "81% of India's urban waste is processed". Each result is a receipt you can take away: a link that reopens the check (`#/claim/<sentence>`, checked again on open), plain text to copy, or WhatsApp. Result: the verdict, the headline figure from each source, what it means and the evidence first; every source record is one tap away. Never "true" or "false" when sources disagree |
| **Insights** | `#/gaps`, `#/explore` | One page, two tab rows. It opens on six plain questions, each with one number; every tab then gives the short answer, one simple chart, and every row folded below. Money and gaps: phantom tonnes, money vs mess (share of SWM funds used against percent treated), collection gap and trucks, landfill (national and by state, MoHUA's national dumpsite statements, and the 214 priority dumpsites by state and city), the national segregation gap, reporting completeness per state. Sources and checks: audit-first ranking, receipts (source pages with the figure boxed), year-to-year swings, definitions |
| **Your city** | `#/city` | Opens on a fictional worked example and a guide to the file format; then upload ward-level data (read in the browser) and see which figures cannot all be true |
| **Ask** | `#/ask` | Questions in English, Hindi, Tamil or Telugu, answered from the data, with voice in and out where the browser supports it. Needs the Q&A agent (see Run it) |
| **About** | `#/about` | How we check, the numbers behind the site, what we will not do, where the figures come from, the licence |
| **Get help** | `#/help` | Complaint writer for the official Swachhata-MoHUA app, a dated log, an escalation letter, which-bin guide under the 2026 rules, bulk-generator check ([docs/saathi.md](docs/saathi.md)) |
| **Briefing / State card** | `#/brief` | A shareable plain-words card per state and a one-page briefing for an MP, MLA or councillor |
| **Schools** | `#/school` | A school waste challenge: weigh a week, get a report card |
| **Your ward** | `#/ward` | Tap whether the garbage truck came, keep a 30-day calendar, print a QR code for a ward, green-ward badge ([docs/ward_reports.md](docs/ward_reports.md)). Reports are unverified and stay in the user's own browser; there is no shared server |
| **Nearest drop-off** | `#/dropoff` | Where to take batteries, e-waste and other special items |

Design: the "Eco-Intelligence Observatory" system ([docs/ui_theme.md](docs/ui_theme.md)), light and dark. The interface is in English, with Hindi and Telugu partly translated (a native speaker has not reviewed them). Ask answers in English, Hindi, Tamil and Telugu.

### Guided paths
For a visitor who knows nothing about the data, five goals each become a short path of existing pages with a bar showing the step, why it matters, and Back/Next: get my garbage collected, check a number someone quoted, understand the problem in 3 minutes, prepare something to cite or ask, run a school waste challenge. Pages outside a path show a "What next?" row. State lives in `sessionStorage`; if storage is blocked the pages still work ([docs/guided_paths.md](docs/guided_paths.md)).

## The data
- **676 sourced rows** for 36 states and UTs, in tonnes per day, 2019-20 to 2025-26. Every row carries its source document, page and retrieval date. Missing values stay blank and say "not reported"; nothing is estimated or filled in.
- **72 flags** from six consistency rules. Examples: Kerala reports more waste treated than collected in four years; MoHUA and CPCB differ by more than 10% for 53 state-and-metric pairs.
- **Receipts:** 605 of 706 figures are placed on their source page; the rest show the page or say there is no page image.
- Supporting tables: funds, MoHUA statements, definition crosswalk, audit priority, recurrence, phantom tonnes, money vs mess, volatility, state indicators, truck priority, segregation, completeness. Column meanings: [docs/data_dictionary.md](docs/data_dictionary.md).
- Every document is listed with publisher, URL and retrieval date in [SOURCES.md](SOURCES.md).

## Run it
Needs Python 3.12 (pandas, pdfplumber, python-docx). Node is optional, for the browser/Python parity tests.

```bash
python -m http.server 8777
```
Then open http://127.0.0.1:8777/web/app/index.html (the app), http://127.0.0.1:8777/web/trust/index.html (trust pages alone) or http://127.0.0.1:8777/web/mock/index.html (design mock).

**Ask (optional).** The Q&A agent in `agent/` is a Flask server, so a static host cannot run it. Without it the Ask page says "not connected yet". To run it locally, follow [agent/README.md](agent/README.md), then:
```bash
ALLOWED_ORIGINS=http://127.0.0.1:8777 python agent/app.py
```
and set `agentEndpoint` in `web/app/config.js` to `http://127.0.0.1:5000/ask`. Without `MODEL_API_KEY` the agent answers in a fallback mode from the data. Do not commit a key.

**Live site.** https://kachra-satya.onrender.com runs the whole project as one Render web service: the Flask agent serves the built site and answers Ask (`render.yaml`, [docs/deploy.md](docs/deploy.md)). It is on a free plan, so the first visit after a quiet spell can take about a minute; `/health` wakes it. **Static build.** `python scripts/build_site.py` writes `dist/` (the web app and receipts only; no source documents or CSVs). A manual GitHub Pages workflow exists (`.github/workflows/pages.yml`) and has not been run.

### Rebuild from the source documents in `data/raw/`
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
python scripts/build_india_map.py
python -m pytest -q tests
```

## How we know the extraction is right
- Each state column sums to the table's printed total (differences under 0.6 tpd are source rounding; one 2 tpd gap in MoHUA 2025-26 is in the source itself).
- 664 of 666 numeric cells were found on their cited PDF page; the other 2 are "Nil" cells stored as 0.
- CPCB 2021-22 Table 1 agrees exactly with Rajya Sabha Q358, an independent cross-check.
- A 30-cell visual spot check matched 30 of 30, but it was AI-assisted, not a manual hand check. A human check is set up (`web/trust/spotcheck.html`, scored by `scripts/score_human_spot_check.py`) and has **not** been recorded yet.
- **96 automated tests pass** (`python -m pytest -q tests`), including that the browser Claim Checker gives the same verdicts as the Python one, design-system contrast and language coverage, no typed-in counts, and guided-path and opening-page structure. They test extraction and consistency, not whether a source is correct.

Details: [docs/methodology.md](docs/methodology.md), [docs/validation_summary.md](docs/validation_summary.md).

## Limits and honesty
- **Truth.** All figures are self-reported by states, cities and boards. We check extraction and consistency, not correctness.
- **Definitions.** Storing MoHUA "processed" as CPCB-style "treated" is our assumption.
- **Coverage.** Segregation, collection routing, recycling markets and plastic tracking are partly covered or not covered ([docs/track_coverage.md](docs/track_coverage.md)). No route optimisation, no recycling price data. The plastic audit is a requirements spec only ([docs/roadmap/plastic_audit.md](docs/roadmap/plastic_audit.md)).
- **State landfilled** is reported only for 2021-22 and 2022-23. The funds table (Lok Sabha Q682) prints no unit, so only ratios are used.
- **Map.** The state boundaries have not been checked against the Survey of India official map.
- **Languages.** Hindi, Tamil and Telugu stream names are provisional until a native speaker checks them. Voice has been tested only with stubbed speech engines, not on real phones.
- **Drafts only.** The complaint, log and letters are text for the user to send. The app sends nothing.
- **Rules.** Four waste streams and bulk-generator thresholds come from the SWM Rules 2026 PIB release of 28 Jan 2026; the Gazette notification itself has not been read.

## Data, sources and attribution
- `data/raw/` and `receipts/pages/` are unchanged copies of published government documents, kept so a figure can be checked against its page. Rights stay with each publisher ([data/raw/NOTICE.md](data/raw/NOTICE.md), [receipts/NOTICE.md](receipts/NOTICE.md)). We are not affiliated with or endorsed by the Lok Sabha or Rajya Sabha Secretariat, CPCB or MoHUA.
- Reuse terms for most sources are not confirmed: read [docs/licences.md](docs/licences.md) before any public data release. No permission requests have been sent; the team decided to use the public records with attribution.
- Code and our compiled data are MIT ([LICENSE](LICENSE), chosen 2026-11-12). That covers our compilation, checks and derived tables, not the source documents, whose rights stay with their publishers. Citation: [CITATION.cff](CITATION.cff). Release package: `scripts/build_release.py` (no documents or page images included).

## Repository map
| Folder | What is in it |
|---|---|
| `data/` | The CSVs; `data/raw/` holds the source documents |
| `scripts/` | Extraction, validation, analysis, map, site build and release scripts |
| `web/app/` | The integrated app (routes, Home, map, Get help, guided paths, ward, i18n, theme) |
| `web/trust/`, `web/mock/` | Trust pages with the inlined data, and the design mock |
| `agent/` | The Q&A agent (Flask) and its acceptance test |
| `receipts/` | Source page images and the index placing each figure on its page |
| `briefs/` | One-page Action Briefs per state |
| `docs/` | Methodology, licences, track coverage, UI, team plan, deploy, demo script, submission checklist, user tests, roadmap |
| `tests/` | The 96 automated tests |

## Reply or report an error
A state, city or department can reply to a figure, and anyone can report a mismatch with its source page, through the issue forms in `.github/ISSUE_TEMPLATE/`. We show replies beside the figure, never delete a published figure, and fix and log our own mistakes.

## Team
- **Yasaswini (Yasaswini-ch):** trust layer (claim checker, receipts, audit list, definitions), data publishing, Home page and guided paths.
- **Sriya Meenakshi Chalamalasetty:** data sourcing and extraction, money and gaps, Your ward pages, user tests.
- **Likhitha:** platform and design system, Q&A agent setup, deployment, demo and submission.

Features explained page by page: [docs/features.md](docs/features.md). Plan: [docs/team_split_v3.md](docs/team_split_v3.md).

## Status (2026-11-12)
The data, the checks, the integrated app and its Home page, guided paths and More menu are in the repo and pass 96 tests, and the site is live at https://kachra-satya.onrender.com with the Q&A agent connected. Not done yet:
- **Page images and source documents are public.** The live site serves the receipt page images (copies of government document pages). The team decided to use these public records with attribution and a remove-on-request promise; no permission request has been sent, and reuse terms were not confirmed with the publishers ([docs/licences.md](docs/licences.md)).
- **Live site checks still open.** Done on 2026-11-12 in a desktop browser: pages load, data files are not exposed, Ask answers in Hindi, Tamil and Telugu with sources ([docs/deploy.md](docs/deploy.md)). Not done: a phone, light and dark themes, the six acceptance questions in model mode, a native-speaker read of the translations.
- **Demo video and submission** ([docs/demo_video_script.md](docs/demo_video_script.md), [docs/submission_checklist.md](docs/submission_checklist.md)).
- **Impact evidence:** what we can and cannot show is written down in [docs/impact_evidence.md](docs/impact_evidence.md): the problem is documented from the sources, but no people have used it yet in recorded sessions.
- **User tests:** none run, count 0 ([docs/user_tests.md](docs/user_tests.md)). Ward QR scanning on a real phone, 375 px and screen-reader checks are also pending.
- **By hand:** confirm author names in `CITATION.cff` and `.zenodo.json`, record the human spot check, verify the map boundary.
