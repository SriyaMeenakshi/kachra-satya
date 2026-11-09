# Methodology note: Kachra Satya waste dataset

Version: 2026-11-10 (draft for the hackathon submission and a later public release). Counts below are from the files in this repo on that date.

## What the dataset is
State and UT figures for municipal solid waste in India, in tonnes per day (tpd), copied from published government documents, plus checks that flag figures that cannot all be true. We do not estimate, fill in or correct any figure. A blank cell means the source did not report it, and the note column says what the source printed.

`data/waste_clean.csv`: 676 rows, 36 states and UTs, columns `state, year, metric, value_tpd, source_name, source_doc, source_page, retrieved_on, note`. 10 cells are blank (not reported).

| Source | Years | Rows |
|---|---|---|
| CPCB, via Rajya Sabha Unstarred Q358 (6 Feb 2025) | 2019-20, 2020-21, 2021-22 | 318 |
| CPCB Annual Report on SWM 2021-22, Table 1 | 2021-22 landfilled | 36 |
| CPCB Annual Report on SWM 2022-23, Table 1 | 2022-23 | 144 |
| CPCB 2023-24, via Lok Sabha Unstarred Q50 (1 Dec 2025) | 2023-24 | 108 |
| MoHUA, via Rajya Sabha Unstarred Q2433 (10 Aug 2026) | 2025-26 | 70 |

Other files: `data/national_stated.csv` (national totals exactly as printed), `data/funds.csv` (Lok Sabha Q682, 35 states), `data/waste_mohua_2023-12.csv` (MoHUA Lok Sabha Q3198, 21 Dec 2023, 35 states, no financial year stated), `data/mohua_statements.csv`, `data/national_segregation.csv` and the derived files listed in `SOURCES.md`.

## How figures were extracted
- PDFs with a text layer: `pdfplumber` text and word positions. Tables were rebuilt by row and column, with the column order read from each table's header, never assumed.
- Word copies (Q682, Q3198): `python-docx` for a real table (Q682). Q3198 is a PDF conversion in which the table is positioned text boxes, so cells were rebuilt from their x and y position.
- Numbers are stored as printed (commas removed), never reformatted. "Nil" is stored as 0 with a note; "Not provided", "-" and similar are stored blank with a note.
- State names are normalised to one spelling (for example "and" instead of "&").

## Checks
1. Each state column sums to the table's printed total (differences under 0.6 tpd are source rounding). Known exception: MoHUA 2025-26 processed sums to 131,532 against a printed 131,530.
2. Every stored value is looked up on its cited PDF page: 664 of 666 numeric cells were found; the other 2 are "Nil" cells stored as 0.
3. CPCB 2021-22 (Table 1) agrees with Rajya Sabha Q358's 2021-22 figures with no differences, an independent check on both extractions.
4. A 30-cell spot check by visual read of the rendered PDF pages matched 30 of 30; it was AI-assisted, not a manual hand check.
5. The page images and boxes in `receipts/` were generated from the same PDFs and each located figure's text was verified to equal its stored value (605 of 706 figures located; 91 page-only; 10 without a page image).

## Rules that raise flags (`scripts/validate.py`, `data/flags.csv`, 72 flags)
1 treated plus landfilled above generated (national, and state where landfilled exists); 2 collected above generated; 3 CPCB 2023-24 and MoHUA 2025-26 differ by more than 10% (different years); 4 a metric blank for a state that reports it in other years; 5 national total differs from the sum of the states; 6 treated above collected. A flag says two reported figures cannot both be true. It does not say which one is wrong.

## What the numbers do not tell you
- CPCB and MoHUA figures are mostly for different years. MoHUA's Dec 2023 table has no financial year.
- CPCB says "treated" and MoHUA says "processed". We store MoHUA's as "treated" to compare; the documents we hold do not say the two mean the same thing (`data/definition_crosswalk.csv`).
- All figures are self-reported by states, cities and pollution control boards. We checked extraction accuracy and internal consistency, not whether the source documents are right.
- State landfilled exists only for 2021-22 and 2022-23. The funds table prints no unit.
- Generation estimates differ widely between reports for some states (Nagaland 664 tpd in CPCB 2021-22, 29 tpd in MoHUA 2025-26, both confirmed on the source page).

## Reproduce
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
python scripts/make_receipts.py
python scripts/export_web_data.py
python -m pytest -q tests
```

## Citing
Kachra Satya team (2026). Kachra Satya: an audit of India's municipal solid waste figures. Version 2026-11-10. Source documents and pages are in every row; see `SOURCES.md` and `docs/licences.md` for reuse terms.
