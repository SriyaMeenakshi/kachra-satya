"""Recurrence flags and the risk-based audit list.

Reads data/flags.csv, data/volatility.csv, data/gap_ranking.csv, data/waste_clean.csv (run validate.py, volatility.py first).
Writes
  data/recurrence.csv       state, rule, n_years, years: the same within-source rule tripped in 2 or more years
                            (cross-source rule 3 is excluded: it compares two sources once, it does not recur)
  data/audit_priority.csv   one row per state, ranked "audit these states first"
Priority method (transparent, no hidden weights): five factors, each turned into a percentile rank (0 to 1, higher = more concerning),
then averaged with equal weight.
  gap        absolute gap in percentage points between CPCB 2023-24 percent treated and MoHUA 2025-26 percent processed
  swing      swing_ratio from volatility.csv (highest / lowest reported generated waste)
  flags      count of within-source flags (rules 1, 2, 4, 5, 6)
  recurrence longest run of years for one rule from recurrence.csv
  blanks     count of blank (not reported) cells in waste_clean.csv
States missing a factor get that factor left out of their average (not guessed), and the row says how many factors were used.
This ranks where an audit would learn most. It is not a finding that any state's data is wrong.
Run from repo root: python scripts/recurrence_and_priority.py
"""
import pandas as pd

flags = pd.read_csv("data/flags.csv")
vol = pd.read_csv("data/volatility.csv")
gap = pd.read_csv("data/gap_ranking.csv")
w = pd.read_csv("data/waste_clean.csv")

within = flags[~flags.rule.str.startswith("3_")]
rows = []
for (st, rule), g in within[within.state != "India"].groupby(["state", "rule"]):
    years = sorted(set(g.year.astype(str)))
    if len(years) >= 2:
        rows.append(dict(state=st, rule=rule, n_years=len(years), years="; ".join(years)))
rec = pd.DataFrame(rows, columns=["state", "rule", "n_years", "years"]).sort_values(["n_years", "state"], ascending=[False, True])
rec.to_csv("data/recurrence.csv", index=False)

states = sorted(w.state.unique())
f = pd.DataFrame({"state": states}).set_index("state")
f["gap_pct_points_abs"] = gap.set_index("state").gap_pct_points.abs().reindex(f.index)
f["swing_ratio"] = vol.set_index("state").swing_ratio.reindex(f.index)
f["flag_count"] = within[within.state != "India"].groupby("state").size().reindex(f.index).fillna(0).astype(int)
f["recurrence_years"] = rec.groupby("state").n_years.max().reindex(f.index).fillna(0).astype(int)
f["blank_cells"] = w[w.value_tpd.isna()].groupby("state").size().reindex(f.index).fillna(0).astype(int)
factors = ["gap_pct_points_abs", "swing_ratio", "flag_count", "recurrence_years", "blank_cells"]
pr = f[factors].rank(pct=True, method="average")
f["factors_used"] = f[factors].notna().sum(axis=1)
f["priority_score"] = pr.mean(axis=1, skipna=True).round(3)


def why(r):
    top = sorted(((pr.at[r.name, c], c) for c in factors if pd.notna(pr.at[r.name, c])), reverse=True)[:2]
    label = {"gap_pct_points_abs": "CPCB-MoHUA gap {:.1f} points", "swing_ratio": "generated swings {:.1f}x between reports",
             "flag_count": "{:.0f} within-source flags", "recurrence_years": "same rule tripped in {:.0f} years",
             "blank_cells": "{:.0f} figures not reported"}
    return "; ".join(label[c].format(r[c]) for _, c in top)


f["main_reasons"] = f.apply(why, axis=1)
out = f.sort_values("priority_score", ascending=False).reset_index()
out.insert(0, "rank", range(1, len(out) + 1))
out["note"] = "ranks where an audit would learn most; not a finding that a state's data is wrong"
out.to_csv("data/audit_priority.csv", index=False)
print(len(rec), "recurrence rows")
print(rec.head(5).to_string(index=False))
print(out.head(8)[["rank", "state", "priority_score", "main_reasons"]].to_string(index=False))
