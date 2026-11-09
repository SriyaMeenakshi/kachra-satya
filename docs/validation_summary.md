# Validation summary

Run `python scripts/validate.py`. 66 flags in `data/flags.csv`.

| Rule | Flags |
|---|---|
| 1_treated_plus_landfilled_gt_generated | 1 |
| 2_collected_gt_generated | 1 |
| 3_sources_differ_gt_10pct | 53 |
| 4_metric_missing | 6 |
| 5_national_vs_state_sum | 1 |
| 6_treated_gt_collected | 4 |

- 13 flags come from rules 1, 2, 4, 5 and 6: data-quality problems inside or between source tables.
- Rule 3 flags 32 states whose CPCB 2023-24 and MoHUA 2025-26 figures differ by more than 10%. These are different years, so some of the difference may be real change. MoHUA's Dec 2023 table (no financial year stated) is shown as an extra column in `gap_ranking.csv`.
- Rule 1 runs on national figures and on state rows where landfilled is reported. State landfilled exists only for CPCB 2021-22 (1 flag: Chandigarh, whose report footnote explains the carried-over waste).
- Still missing: state landfilled for other years, the CPCB 2022-23 state table.
