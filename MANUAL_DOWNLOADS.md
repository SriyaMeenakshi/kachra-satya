# Manual downloads still needed

These could not be fetched by script from the build machine (eparlib.sansad.in and eparlib.nic.in time out, cpcb.gov.in/cpcb.nic.in must not be scraped, the sbmurban.org result dashboard has no download file). Open each page in a browser, save the file under `data/raw/` with the exact name, then tell the team so the extraction can be run.

| # | What it adds | Page to open | Save as |
|---|---|---|---|
| 1 (DONE 2026-11-10, Word copy) | State-wise SBM-U 2.0 allocation and funds utilised (funds in the Action Brief; Lok Sabha Q682, 28 Nov 2024, Annexure) | https://eparlib.sansad.in/bitstream/123456789/2983719/1/AU682_ribIdc.pdf, or search sansad.in for Lok Sabha unstarred question 682 of 28 Nov 2024 | `data/raw/ls_au682_2024-11-28.pdf` |
| 2 (DONE 2026-11-10, Word copy AU3198.docx; AU3198_YMGvM7 is a different question and is not used) | Same-year MoHUA state table for 2022-23 / 2023-24 (gives a same-year CPCB vs MoHUA pair; Lok Sabha USQ 3198, 21 Dec 2023, "Waste Processing Rates") | https://eparlib.nic.in/bitstream/123456789/2972782/1/AU3198.pdf, or search sansad.in for Lok Sabha unstarred question 3198 of 21 Dec 2023 | `data/raw/ls_au3198_2023-12-21.pdf` |
| 3 | State-wise landfilled and the CPCB 2021-22 state tables (rule 1 at state level) | CPCB annual report 2021-22 on SWM Rules: https://cpcb.nic.in/uploads/MSW/MSW_AnnualReport_2021-22.pdf (open in a browser; do not script it) | `data/raw/cpcb_2021-22.pdf` |
| 4 | CPCB 2022-23 state table | CPCB website, Solid Waste Management annual reports section; or a Lok Sabha / Rajya Sabha answer that annexes it | `data/raw/cpcb_2022-23.pdf` |
| 5 | City-level (ULB) results, optional | https://sbmurban.org/gfc-result-dashboard (dashboard, no file found; skip unless a download button exists) | `data/raw/gfc_2024-25_results.<ext>` |

## Rules for when they arrive
- Add each file to `SOURCES.md` with URL, publisher, document date and retrieval date.
- Confirm column order and units from the PDF text before extracting. If a table extracts badly, list the pages for manual entry instead of guessing.
- Missing values stay blank with the note "not reported".
- Dataful (datasets 19386 and 19387) is still unchecked: terms and any login or payment requirement must be recorded before use.
