# Action Brief: Manipur

_Data only from the Kachra Satya dataset. The CPCB and MoHUA figures are for different years; no same-year pair exists yet. Anything not in the data is marked 'not reported'._

## 1. The gap

| | CPCB 2023-24 | MoHUA 2025-26 |
|---|---|---|
| Generated | 290 tpd | 127 tpd |
| Collected | 197 tpd | not reported by MoHUA |
| Treated / processed | 230 tpd | 68 tpd |
| % of generated treated | 79.4% | 53.5% |
| Source | ls_au50_2025-12-01.pdf, p.3 | mohua_81pct_answer.pdf, p.3 |

**Gap: -25.9 percentage points** (MoHUA minus CPCB).

## 2. Likely causes (hypotheses from the data)

- **Different denominators.** Generated waste is 290 tpd in CPCB 2023-24 and 127 tpd in MoHUA 2025-26 (-56%). A percentage built on a different base will differ even if treatment were identical. Hypothesis: the state revised its generation estimate.
- **A collection gap.** Only 68% of generated waste is reported collected (197 tpd of 290 tpd), so waste cannot reach treatment. Hypothesis: door-to-door coverage gaps.
- **Treated exceeds collected.** CPCB reports 230 tpd treated but only 197 tpd collected, which is not possible; one of the two figures is likely wrong.

## 3. Flags raised for this state

- `3_sources_differ_gt_10pct` (2023-24 vs 2025-26): generated: CPCB 2023-24=290; MoHUA 2025-26=127; change=-56.2%. CPCB and MoHUA generated figures differ by more than 10%. These are different years (no same-year pair exists yet), so part of the gap may be real change.
- `3_sources_differ_gt_10pct` (2023-24 vs 2025-26): treated: CPCB 2023-24=230.4; MoHUA 2025-26=68; change=-70.5%. CPCB and MoHUA treated figures differ by more than 10%. These are different years (no same-year pair exists yet), so part of the gap may be real change.
- `6_treated_gt_collected` (2023-24): treated=230.4; collected=197.27; source=CPCB. More waste is reported treated than collected. Either collection is under-reported or treatment is over-reported.

## 4. Draft SBM-U 2.0 ask

On the CPCB figures for 2023-24, about **60 tpd** of 290 tpd generated is not reported as treated. We request:

1. A joint CPCB-MoHUA-state reconciliation of generated and treated tonnage for the same financial year, so the two published figures can be explained.
2. Central assistance under SBM-U 2.0 (solid waste component) for processing capacity, sized to the reconciled untreated quantity.
3. Support for weighbridge-based data reporting by urban local bodies so future returns pass basic checks.

_Amount: not stated. The dataset has no state-wise allocation or utilisation figures for this state; add them from the Lok Sabha Q682 annexure before submitting._
