"""Phantom tonnes: reported tonnage that cannot all be true at once, kept in clearly separate counters.

Writes data/phantom_tonnes.csv with columns: counter, scope, year, tpd, values, source, explanation.
Counters (never added together, they measure different things):
  A_treated_above_collected      CPCB states where treated > collected (excess = treated - collected)
  B_collected_above_generated    CPCB states where collected > generated
  C_treated_plus_landfilled_above_generated   state rows where treated + landfilled > generated
  D_national_treated_sources     two official national "treated/processed" figures that disagree
  E_state_treated_sources        state-level difference MoHUA 2025-26 processed minus CPCB 2023-24 treated (D, split by state)
Wording rule: these are reported figures that cannot both be true. The data cannot say which figure is wrong.
Where a source gives a reason (for example Kerala's decentralised processing), it is quoted in the explanation.
Run from repo root: python scripts/phantom_tonnes.py
"""
import pandas as pd

w = pd.read_csv("data/waste_clean.csv")
nat = pd.read_csv("data/national_stated.csv")
mdec = pd.read_csv("data/waste_mohua_2023-12.csv")
rows = []


def add(counter, scope, year, tpd, values, source, why):
    rows.append(dict(counter=counter, scope=scope, year=year, tpd=round(float(tpd), 2), values=values, source=source, explanation=why))


p = w[w.source_name == "CPCB"].pivot_table(index=["state", "year"], columns="metric", values="value_tpd", aggfunc="first").reset_index()
notes = w[(w.source_name == "CPCB") & w.note.notna()].set_index(["state", "year", "metric"]).note.to_dict()
for r in p.itertuples():
    if pd.notna(r.treated) and pd.notna(r.collected) and r.treated > r.collected:
        why = "More waste is reported treated than collected."
        n = notes.get((r.state, r.year, "collected"))
        if n:
            why += f" Source note: {n}."
        add("A_treated_above_collected", r.state, r.year, r.treated - r.collected, f"treated={r.treated:g}; collected={r.collected:g}", "CPCB", why)
    if pd.notna(r.collected) and pd.notna(r.generated) and r.collected > r.generated:
        add("B_collected_above_generated", r.state, r.year, r.collected - r.generated, f"collected={r.collected:g}; generated={r.generated:g}", "CPCB",
            "More waste is reported collected than generated.")
    if "landfilled" in p and pd.notna(getattr(r, "landfilled", None)) and pd.notna(r.treated) and pd.notna(r.generated):
        over = r.treated + r.landfilled - r.generated
        if over > 0.5:
            add("C_treated_plus_landfilled_above_generated", r.state, r.year, over,
                f"treated={r.treated:g}; landfilled={r.landfilled:g}; generated={r.generated:g}", "CPCB",
                "Treated plus landfilled is more than generated. Chandigarh 2021-22: the report footnote says last year's unprocessed waste (+29 TPD) is included this year.")

g = nat[nat.state == "India"].pivot_table(index=["year", "source_name"], columns="metric", values="value", aggfunc="first")
cpcb = {y: g.loc[(y, "CPCB"), "treated"] for y in ("2022-23", "2023-24")}
mohua26 = g.loc[("2025-26", "MoHUA"), "treated"]
mohua_dec = mdec[mdec.metric == "treated"].value_tpd.sum()
add("D_national_treated_sources", "India", "MoHUA 2025-26 vs CPCB 2023-24", mohua26 - cpcb["2023-24"],
    f"MoHUA processed={mohua26:g}; CPCB treated={cpcb['2023-24']:g}", "MoHUA vs CPCB",
    "Different years (2025-26 against 2023-24), so part of the gap may be real progress.")
add("D_national_treated_sources", "India", "MoHUA as on 21-12-2023 vs CPCB 2023-24", mohua_dec - cpcb["2023-24"],
    f"MoHUA processed (sum of 35 states)={mohua_dec:g}; CPCB treated={cpcb['2023-24']:g}", "MoHUA vs CPCB",
    "Closest in time. MoHUA's table gives no financial year ('as on date', 21 Dec 2023); CPCB's year ends March 2024.")
add("D_national_treated_sources", "India", "MoHUA as on 21-12-2023 vs CPCB 2022-23", mohua_dec - cpcb["2022-23"],
    f"MoHUA processed={mohua_dec:g}; CPCB treated={cpcb['2022-23']:g}", "MoHUA vs CPCB",
    "MoHUA's table gives no financial year; shown against CPCB 2022-23 for comparison.")

c = w[(w.source_name == "CPCB") & (w.year == "2023-24") & (w.metric == "treated")].set_index("state").value_tpd
m = w[(w.source_name == "MoHUA") & (w.year == "2025-26") & (w.metric == "treated")].set_index("state").value_tpd
for st in sorted(set(c.index) & set(m.index)):
    if pd.notna(c[st]) and pd.notna(m[st]):
        add("E_state_treated_sources", st, "MoHUA 2025-26 vs CPCB 2023-24", m[st] - c[st],
            f"MoHUA processed={m[st]:g}; CPCB treated={c[st]:g}", "MoHUA vs CPCB",
            "Different years. Positive = MoHUA reports more processed than CPCB reports treated.")

out = pd.DataFrame(rows)
out.to_csv("data/phantom_tonnes.csv", index=False)
print(out.groupby("counter").size().rename("rows").to_string())   # tonnes are NOT summed across rows: years and comparisons overlap
print("E positive states:", int((out[out.counter == "E_state_treated_sources"].tpd > 0).sum()), "of", int((out.counter == "E_state_treated_sources").sum()))
print(out[out.counter == "E_state_treated_sources"].sort_values("tpd", ascending=False).head(5)[["scope", "tpd"]].to_string(index=False))
