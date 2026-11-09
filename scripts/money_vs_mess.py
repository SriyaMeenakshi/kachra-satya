"""Money vs mess: SWM fund utilisation against how much waste is reported treated, by state.

Inputs: data/funds.csv (Lok Sabha Q682: SWM allocation 2021-2026 and SWM funds utilised/released till 25.11.2024)
        data/waste_clean.csv (CPCB 2023-24 generated and treated; MoHUA 2025-26 generated and treated)
Output: data/money_vs_mess.csv
  swm_utilisation_pct   = funds_swm / allocation_swm * 100      (unit cancels; the Q682 table prints no unit)
  cpcb_pct_treated      = CPCB 2023-24 treated / generated * 100
  mohua_pct_processed   = MoHUA 2025-26 processed / generated * 100
  quadrant: split at the MEDIAN of utilisation and of CPCB percent treated (a relative split, not a target):
    slow_money_low_treatment | slow_money_high_treatment | fast_money_low_treatment | fast_money_high_treatment
Caveats stored in the file: funds are cumulative to 25 Nov 2024; CPCB figures are for 2023-24; MoHUA's for 2025-26.
A low utilisation share does not prove an execution problem and a high share does not prove success: it is a prompt for questions.
Run from repo root: python scripts/money_vs_mess.py
"""
import pandas as pd

f = pd.read_csv("data/funds.csv")
w = pd.read_csv("data/waste_clean.csv")


def pct_treated(source, year):
    p = w[(w.source_name == source) & (w.year == year)].pivot_table(index="state", columns="metric", values="value_tpd", aggfunc="first")
    return (p["treated"] / p["generated"] * 100).where(p["generated"] > 0)


d = f[["state", "allocation_swm", "funds_swm"]].set_index("state")
d["swm_utilisation_pct"] = (d.funds_swm / d.allocation_swm * 100).round(1)
d["cpcb_pct_treated"] = pct_treated("CPCB", "2023-24").round(1)
d["mohua_pct_processed"] = pct_treated("MoHUA", "2025-26").round(1)
mu, mt = d.swm_utilisation_pct.median(), d.cpcb_pct_treated.median()
d["quadrant"] = [("slow_money" if u < mu else "fast_money") + "_" + ("low_treatment" if t < mt else "high_treatment")
                 if pd.notna(u) and pd.notna(t) else "not_reported" for u, t in zip(d.swm_utilisation_pct, d.cpcb_pct_treated)]
d["note"] = ("funds cumulative to 25.11.2024; CPCB 2023-24; MoHUA 2025-26; quadrant split at the median utilisation "
             f"({mu:.1f}%) and median CPCB percent treated ({mt:.1f}%)")
d.reset_index().sort_values("swm_utilisation_pct").to_csv("data/money_vs_mess.csv", index=False)
print(d.quadrant.value_counts().to_string())
print(d.sort_values("swm_utilisation_pct").head(6)[["swm_utilisation_pct", "cpcb_pct_treated", "quadrant"]].to_string())
