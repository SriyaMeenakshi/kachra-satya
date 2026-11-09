# Action Brief: Gujarat

_Data only from the Kachra Satya dataset. The CPCB and MoHUA figures are for different years; no same-year pair exists yet. Anything not in the data is marked 'not reported'._

## 1. The gap

| | CPCB 2023-24 | MoHUA 2025-26 |
|---|---|---|
| Generated | 12,000 tpd | 11,808 tpd |
| Collected | 12,000 tpd | not reported by MoHUA |
| Treated / processed | 7,572 tpd | 11,553 tpd |
| % of generated treated | 63.1% | 97.8% |
| Source | ls_au50_2025-12-01.pdf, p.3 | mohua_81pct_answer.pdf, p.3 |

**Gap: +34.7 percentage points** (MoHUA minus CPCB).

## 2. Likely causes (hypotheses from the data)

- **Treatment reported much higher in the newer source.** Treated/processed rose from 7,572 tpd to 11,553 tpd. Hypothesis: real capacity added between years, or a looser definition (MoHUA 'processed' is stored as treated here and may not mean the same as CPCB 'treated').
- **Missing reporting in earlier years.** At least one metric is blank in some years (see flags below).

## 3. Flags raised for this state

- `3_sources_differ_gt_10pct` (2023-24 vs 2025-26): treated: CPCB 2023-24=7571.83; MoHUA 2025-26=11553; change=+52.6%. CPCB and MoHUA treated figures differ by more than 10%. These are different years (no same-year pair exists yet), so part of the gap may be real change.
- `4_metric_missing` (2019-20): generated blank in 2019-20 (not reported (source says '-')); reported in 2020-21, 2021-22, 2023-24. Generated is not reported for this year although the same source reports it in other years.

## 4. Draft SBM-U 2.0 ask

On the CPCB figures for 2023-24, about **4,428 tpd** of 12,000 tpd generated is not reported as treated. We request:

1. A joint CPCB-MoHUA-state reconciliation of generated and treated tonnage for the same financial year, so the two published figures can be explained.
2. Central assistance under SBM-U 2.0 (solid waste component) for processing capacity, sized to the reconciled untreated quantity.
3. Support for weighbridge-based data reporting by urban local bodies so future returns pass basic checks.

_Amount: not stated. The dataset has no state-wise allocation or utilisation figures for this state; add them from the Lok Sabha Q682 annexure before submitting._
