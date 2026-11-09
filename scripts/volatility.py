"""Number volatility: how much a state's own reported GENERATED waste moves between official documents.

Waste generation should not change by half from one report to the next. Large swings mean the figure is an estimate
that was revised, a different definition, or a reporting error; the data cannot say which.
Inputs: data/waste_clean.csv, data/waste_mohua_2023-12.csv (MoHUA Dec 2023, year stored as "as on 21-12-2023").
Output: data/volatility.csv, one row per state, ranked by swing_ratio (max / min of reported generated, all values):
  n_values, min_tpd, max_tpd, swing_ratio, max_in, min_in (year and source of the highest and lowest), cpcb_only_swing_ratio.
Blank (not reported) values are ignored, and states with fewer than 3 reported values are not ranked.
Run from repo root: python scripts/volatility.py
"""
import pandas as pd

w = pd.read_csv("data/waste_clean.csv")
m = pd.read_csv("data/waste_mohua_2023-12.csv")
g = pd.concat([w[w.metric == "generated"], m[m.metric == "generated"]])
g = g[g.value_tpd.notna() & (g.value_tpd > 0)]
rows = []
for st, x in g.groupby("state"):
    x = x.sort_values("value_tpd")
    lo, hi = x.iloc[0], x.iloc[-1]
    c = x[x.source_name == "CPCB"]
    rows.append(dict(state=st, n_values=len(x), min_tpd=lo.value_tpd, max_tpd=hi.value_tpd,
                     swing_ratio=round(hi.value_tpd / lo.value_tpd, 2),
                     min_in=f"{lo.year} {lo.source_name}", max_in=f"{hi.year} {hi.source_name}",
                     cpcb_only_swing_ratio=round(c.value_tpd.max() / c.value_tpd.min(), 2) if len(c) >= 2 else "",
                     ranked="yes" if len(x) >= 3 else "no (fewer than 3 values)"))
out = pd.DataFrame(rows).sort_values(["ranked", "swing_ratio"], ascending=[False, False])
out.insert(0, "rank", [i + 1 if r == "yes" else "" for i, r in enumerate(out.ranked)])
out.to_csv("data/volatility.csv", index=False)
print(out.head(8)[["rank", "state", "n_values", "min_tpd", "max_tpd", "swing_ratio", "min_in", "max_in"]].to_string(index=False))
