# Action Brief: Kerala

_Data only from the Kachra Satya dataset. The CPCB and MoHUA figures are for different years; no same-year pair exists yet. Anything not in the data is marked 'not reported'._

## 1. The gap

| | CPCB 2023-24 | MoHUA 2025-26 |
|---|---|---|
| Generated | 3,011 tpd | 1,253 tpd |
| Collected | 2,595 tpd | not reported by MoHUA |
| Treated / processed | 2,595 tpd | 1,224 tpd |
| % of generated treated | 86.2% | 97.7% |
| Source | ls_au50_2025-12-01.pdf, p.3 | mohua_81pct_answer.pdf, p.3 |

**Gap: +11.5 percentage points** (MoHUA minus CPCB).

## 2. Likely causes (hypotheses from the data)

- **Different denominators.** Generated waste is 3,011 tpd in CPCB 2023-24 and 1,253 tpd in MoHUA 2025-26 (-58%). A percentage built on a different base will differ even if treatment were identical. Hypothesis: the state revised its generation estimate.

## 3. Flags raised for this state

- `3_sources_differ_gt_10pct` (2023-24 vs 2025-26): generated: CPCB 2023-24=3011.23; MoHUA 2025-26=1253; change=-58.4%. CPCB and MoHUA generated figures differ by more than 10%. These are different years (no same-year pair exists yet), so part of the gap may be real change.
- `3_sources_differ_gt_10pct` (2023-24 vs 2025-26): treated: CPCB 2023-24=2595.22; MoHUA 2025-26=1224; change=-52.8%. CPCB and MoHUA treated figures differ by more than 10%. These are different years (no same-year pair exists yet), so part of the gap may be real change.
- `6_treated_gt_collected` (2019-20): treated=1837; collected=880; source=CPCB. More waste is reported treated than collected. Either collection is under-reported or treatment is over-reported.
- `6_treated_gt_collected` (2020-21): treated=2550; collected=964.76; source=CPCB. More waste is reported treated than collected. Either collection is under-reported or treatment is over-reported.
- `6_treated_gt_collected` (2021-22): treated=2691; collected=1283; source=CPCB. More waste is reported treated than collected. Either collection is under-reported or treatment is over-reported.

## 4. Draft SBM-U 2.0 ask

On the CPCB figures for 2023-24, about **416 tpd** of 3,011 tpd generated is not reported as treated. We request:

1. A joint CPCB-MoHUA-state reconciliation of generated and treated tonnage for the same financial year, so the two published figures can be explained.
2. Central assistance under SBM-U 2.0 (solid waste component) for processing capacity, sized to the reconciled untreated quantity.
3. Support for weighbridge-based data reporting by urban local bodies so future returns pass basic checks.

_Amount: not stated. The dataset has no state-wise allocation or utilisation figures for this state; add them from the Lok Sabha Q682 annexure before submitting._
