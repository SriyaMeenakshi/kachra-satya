# Validation summary

Run `python scripts/validate.py`. 65 flags in `data/flags.csv`.

| Rule | Flags |
|---|---|
| 2_collected_gt_generated | 1 |
| 3_sources_differ_gt_10pct | 53 |
| 4_metric_missing | 6 |
| 5_national_vs_state_sum | 1 |
| 6_treated_gt_collected | 4 |

- 12 flags come from rules 2, 4, 5 and 6: data-quality problems inside or between source tables.
- Rule 3 flags 32 states whose CPCB 2023-24 and MoHUA 2025-26 figures differ by more than 10%. These are different years, so some of the difference may be real change.
- Rule 1 has no state landfilled data and runs on national figures only (0 flags).
- Unfilled: state landfilled, CPCB 2022-23 state table, MoHUA Dec 2023 state table.
