"""State indicators for the Waste Management track: collection gap, landfill dependence, unaccounted share, truck priority.

Reads data/waste_clean.csv (CPCB rows only: CPCB reports collected and landfilled; MoHUA's table has neither).
Writes
  data/state_indicators.csv   state, year, generated_tpd, collected_tpd, treated_tpd, landfilled_tpd,
                              collection_pct, uncollected_tpd, treated_pct, landfill_pct, unaccounted_pct, note
  data/truck_priority.csv     states ranked by uncollected_tpd in the latest CPCB year with collected data (2023-24)
Definitions (all from the reported figures, nothing estimated):
  collection_pct   = collected / generated * 100
  uncollected_tpd  = generated - collected   (blank if collected > generated, flagged in the note)
  treated_pct      = treated / generated * 100
  landfill_pct     = landfilled / generated * 100        (blank where landfilled is not reported: 2019-20, 2020-21, 2023-24 states)
  unaccounted_pct  = 100 - treated_pct - landfill_pct    (blank unless both are reported; negative means treated + landfilled > generated)
Blank inputs give blank outputs. "Priority" ranks tonnage left uncollected; it is not route optimisation, which needs ward and vehicle data.
Run from repo root: python scripts/state_indicators.py
"""
import pandas as pd

w = pd.read_csv("data/waste_clean.csv")
p = (w[w.source_name == "CPCB"].pivot_table(index=["state", "year"], columns="metric", values="value_tpd", aggfunc="first").reset_index())
for c in ("generated", "collected", "treated", "landfilled"):
    if c not in p:
        p[c] = float("nan")


def pct(a, b):
    return (a / b * 100).round(1).where(b > 0)


o = p[["state", "year", "generated", "collected", "treated", "landfilled"]].copy()
o.columns = ["state", "year", "generated_tpd", "collected_tpd", "treated_tpd", "landfilled_tpd"]
o["collection_pct"] = pct(o.collected_tpd, o.generated_tpd)
unc = o.generated_tpd - o.collected_tpd
o["uncollected_tpd"] = unc.round(2).where(unc >= 0)
o["treated_pct"] = pct(o.treated_tpd, o.generated_tpd)
o["landfill_pct"] = pct(o.landfilled_tpd, o.generated_tpd)
o["unaccounted_pct"] = (100 - o.treated_pct - o.landfill_pct).round(1)
notes = []
for r in o.itertuples():
    n = []
    if pd.notna(r.collected_tpd) and pd.notna(r.generated_tpd) and r.collected_tpd > r.generated_tpd:
        n.append("collected exceeds generated in the source: uncollected not computed")
    if pd.notna(r.unaccounted_pct) and r.unaccounted_pct < -0.5:
        n.append("treated plus landfilled exceeds generated in the source")
    if pd.isna(r.landfilled_tpd):
        n.append("landfilled not reported")
    notes.append("; ".join(n))
o["note"] = notes
o.sort_values(["year", "state"]).to_csv("data/state_indicators.csv", index=False)

latest = o[(o.year == "2023-24") & o.uncollected_tpd.notna()].sort_values("uncollected_tpd", ascending=False).copy()
latest.insert(0, "rank", range(1, len(latest) + 1))
latest[["rank", "state", "year", "generated_tpd", "collected_tpd", "uncollected_tpd", "collection_pct"]].assign(
    source="CPCB 2023-24, ls_au50_2025-12-01.pdf p.3-4; ranking by tonnage left uncollected, not route optimisation").to_csv(
    "data/truck_priority.csv", index=False)
print(len(o), "indicator rows;", len(latest), "states ranked")
print(latest.head(5)[["rank", "state", "uncollected_tpd", "collection_pct"]].to_string(index=False))
print(o[(o.year == "2022-23")].sort_values("landfill_pct", ascending=False).head(5)[["state", "landfill_pct"]].to_string(index=False))
