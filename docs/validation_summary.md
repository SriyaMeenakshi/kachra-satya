# Validation summary

Run `python scripts/validate.py`. 72 flags in `data/flags.csv`.

| Rule | Flags |
|---|---|
| 1_treated_plus_landfilled_gt_generated | 1 |
| 2_collected_gt_generated | 1 |
| 3_sources_differ_gt_10pct | 53 |
| 4_metric_missing | 10 |
| 5_national_vs_state_sum | 1 |
| 6_treated_gt_collected | 6 |

- 19 flags come from rules 1, 2, 4, 5 and 6: data-quality problems inside or between source tables.
- Rule 3 flags 32 states whose CPCB 2023-24 and MoHUA 2025-26 figures differ by more than 10%. These are different years, so some of the difference may be real change. MoHUA's Dec 2023 table (no financial year stated) and CPCB 2022-23 are extra columns in `gap_ranking.csv`.
- Rule 1 runs on national figures and on state rows where landfilled is reported (CPCB 2021-22 and 2022-23): 1 flag, Chandigarh 2021-22, explained by the report's footnote on carried-over waste.
- Rule 6 now flags Kerala in 2019-20 to 2022-23 and Manipur in 2022-23 and 2023-24 (treated above collected).
- Still missing: state landfilled for 2019-20, 2020-21 and 2023-24, and city-level data.
