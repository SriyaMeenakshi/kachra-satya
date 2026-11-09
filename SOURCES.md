# Sources

Every row in `data/waste_clean.csv` comes from one of the documents below. Files are kept exactly as downloaded in `data/raw/`.
All were downloaded by hand in a browser; `retrieved_on` is the download date.

| File in `data/raw/` | Document | Where from | Used for |
|---|---|---|---|
| `ls_au50_2025-12-01.pdf` | Lok Sabha Unstarred Question 50, answered 1 Dec 2025, Ministry of Environment, Forest and Climate Change. Annexure: CPCB annual report 2023-24 as submitted by 36 SPCBs/PCCs. | sansad.in | CPCB 2023-24 state rows (pdf pages 3 and 4) and national totals (page 1, including landfilled 39,629 tpd) |
| `rs_q358_2025-02-06.pdf` | Rajya Sabha Unstarred Question 358, answered 6 Feb 2025, Ministry of Environment, Forest and Climate Change. Annexure: CPCB annual reports, 2017-18 to 2021-22. | sansad.in | CPCB state rows for 2019-20 (pages 5 and 6), 2020-21 (pages 4 and 5), 2021-22 (pages 3 and 4) |
| `datagov_swm_cpcb_annual.csv` | data.gov.in copy of the Q358 table. It holds the 2020-21 table, not 2021-22. | data.gov.in | Cross-check only. 104 of 105 cells match the PDF; the 105th (Rajasthan collected) is rounded to 6,720.48 against 6,720.476 in the PDF. |
| `mohua_81pct_answer.pdf` | Rajya Sabha Unstarred Question 2433, answered 10 Aug 2026, Ministry of Housing and Urban Affairs. Annexure I: state-wise generation and processing. Annexure II: year-wise processing percentage. | sansad.in | MoHUA 2025-26 state rows (page 3); the 81% figure (162,372 generated, 131,530 processed); national percentages for 2021-22 to 2025-26 (page 4) |
| `mohua_state_answer.pdf` | Rajya Sabha Unstarred Question 855, answered 28 Jul 2025, Ministry of Housing and Urban Affairs. | sansad.in | National figure only: 80.26% processed (128,842 of 161,163 tpd). It has no state table. |
| `ls_au682_2024-11-28.docx` | Lok Sabha Unstarred Question 682, answered 28 Nov 2024, Ministry of Housing and Urban Affairs, "Solid Waste Management Challenges". Annexure: state-wise SBM-U 2.0 allocation (2021-2026) and funds utilised/released till 25.11.2024. Word copy supplied by a team member; the annexure table prints no unit. | sansad.in (Word copy of the PDF) | `data/funds.csv` (35 states); funds position in the Action Briefs |
| `ls_au3198_2023-12-21.docx` | Lok Sabha Unstarred Question 3198, answered 21 Dec 2023, Ministry of Housing and Urban Affairs, "Waste Processing Rates". Annexure: state/UT waste generation and waste processed (TPD), source line "Reports by ULBs on Swachhatam Portal, of MoHUA". Word copy supplied by a team member. The reply says "as on date" and gives no financial year. | sansad.in (Word copy of the PDF) | `data/waste_mohua_2023-12.csv` (35 states; year stored as "as on 21-12-2023"). Its states sum to 156,536 generated and 119,708.89 processed (76.47%); the reply text says 76.49% of 1.5 lakh MT/D. |
| `cpcb_2021-22.pdf` | CPCB Annual Report on Solid Waste Management 2021-22, Table 1 (PDF pages 6-7, report pages 2-3): state-wise generated, collected, processed/treated, landfilled and gap (TPD). Saved by a team member from the CPCB website. | cpcb.nic.in | `landfilled` rows for 36 states in `waste_clean.csv` (added by `scripts/add_cpcb_2021_22_landfilled.py`). Its generated, collected and treated columns match the Q358 rows exactly and sum to the report totals (170,339 / 156,449 / 91,511 / 41,455; gap 37,373). Landfilled is sanitary landfill only; Bihar's, Andhra Pradesh's, Arunachal Pradesh's and Kerala's are not reported. |
| `cpcb_2023-24.pdf` | CPCB annual report 2023-24 | cpcb.gov.in | National 2021-22 totals, including landfilled (PDF page 69, report page 59). No state-wise MSW table. |
| `cpcb_2024-25.pdf` | CPCB annual report 2024-25 | cpcb.gov.in | National 2022-23 totals, including landfilled (PDF page 66, report page 54). No state-wise MSW table. |

The two CPCB files arrive wrapped in a small HTML shell from cpcb.gov.in. Open them with a PDF reader that finds the PDF inside, or strip everything before `%PDF`.

## Files produced

| File | Contents |
|---|---|
| `data/waste_clean.csv` | 496 state rows: state, year, metric, value_tpd, source_name, source_doc, source_page, retrieved_on, note |
| `data/national_stated.csv` | National totals and percentages exactly as stated in the documents (not computed by us) |
| `data/reconciliation.csv` | Sum of the state rows against the stated national total for each table |
| `data/spot_check.csv` | 30 random cells with the source page, for a person to check against the PDF |
| `data/funds.csv` | 35 states: allocation_total, allocation_swm, funds_swm, funds_total, unit (not stated in table), source columns |
| `scripts/extract_funds.py` | Rebuilds `data/funds.csv` from the Q682 docx |
| `data/waste_mohua_2023-12.csv` | MoHUA Q3198 state table, same columns as waste_clean.csv, kept separate because it has no financial year |
| `scripts/extract_au3198.py` | Rebuilds it from the Q3198 docx |
| `scripts/add_cpcb_2021_22_landfilled.py` | Appends the 2021-22 landfilled rows to `waste_clean.csv`. Run it after `build_clean_csv.py`, which regenerates the file without them |
| `scripts/build_clean_csv.py` | Rebuilds the three generated files from `data/raw/` |

## Conventions

- `year` is the financial year the figures describe (2023-24 means April 2023 to March 2024).
- `source_name` is who produced the figures (CPCB or MoHUA). `source_doc` is the document we read them from.
- State names use "and", not "&" ("Jammu and Kashmir", "Andaman and Nicobar Islands").
- MoHUA's "processed" column is stored as `treated`, with a note.
- A value the source does not give is left blank and the note says what the source printed. "Nil" is stored as 0 with a note.

## Checks run

- State rows sum to the stated national total in every table except one. Differences under 0.5 tpd are source rounding.
- **2025-26 MoHUA treated: the 35 states sum to 131,532, but the document states 131,530.** All 35 rows match the PDF, so the 2 tpd gap is in the source. It is a rule-5 flag.
- 2023-24 CPCB: states sum to 185,195.4 generated, 179,478.9 collected, 114,110.2 treated, against 185,195, 179,479 and 114,110 stated.
- data.gov.in CSV against our 2020-21 rows: 104 of 105 cells identical; one rounding difference.
- **Spot-check: 30 of 30 random cells match the PDFs (100%).** The cells were drawn with a fixed random seed from the 496 state rows (`data/spot_check.csv`). Each value was read from a rendered image of the PDF page, not from the text layer the script uses, then compared with the CSV. The check was an AI-assisted visual read, so a second look by a team member on a few rows is still worthwhile. It covers extraction accuracy only, and does not check that the source documents themselves are right.

## Known gaps (not filled in)

- **No same-year state comparison yet.** CPCB state data ends at 2023-24 and MoHUA state data exists only for 2025-26. Rule 3 can only compare nearest years and must say so.
- **No state-wise landfilled figures.** Only national landfilled: 41,455 tpd (2021-22), 38,147 (2022-23), 39,629 (2023-24). Rule 1 cannot run at state level.
- **No CPCB 2022-23 state table.** The 2024-25 report gives national totals only.
- **2017-18 and 2018-19 are left out.** The Q358 tables for those years are mostly "information not received" and have split cells that do not extract reliably.
- **Ladakh is missing from CPCB 2019-20 and 2020-21,** and **Lakshadweep from the MoHUA 2025-26 table,** because the source tables omit them.
- **Mizoram and Ladakh report 0 generated in MoHUA 2025-26,** while CPCB tables show non-zero values. Kept as reported and noted.
- **MoHUA state data from December 2023 is not included.** It was in an earlier working file that is not available. If someone downloads that Rajya Sabha answer, add it here.
- **Not obtained:** Dataful files, SBM-U Garbage Free Cities data.
- Several 2023-24 states report identical generated, collected and treated values (Andhra Pradesh, Puducherry, Tripura, Lakshadweep). They are marked in the note. Manipur 2023-24 treated (230.4) exceeds collected (197.27); the source footnote says legacy waste is included.
