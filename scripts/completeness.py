"""Reporting-completeness score: how much of what a state could have reported did it report?

Input:  data/waste_clean.csv
Output: data/completeness.csv, one row per state (36)

Definition (kept simple on purpose):
  Core cells = generated, collected and treated for each CPCB year 2019-20 to 2023-24 (5 years x 3 = 15),
               plus generated and treated in MoHUA 2025-26 (2). That is 17 cells for every state.
  A cell counts as reported when it holds a number. A blank value, or a state missing from that year's table, is "not reported".
  completeness_pct = reported cells / 17 * 100.
Also given, not scored:
  zero_reported_cells  cells reported as 0 (a real report of zero, or an unfilled field; the source does not say which)
  landfilled_years     how many of the 2 years with state-wise landfilled figures (2021-22, 2022-23) the state reported
  years_all_three      CPCB years (of 5) in which generated, collected and treated are all reported
A low score means the state's figures are thin, not that anything is wrong with them. Never filled in.
Run from repo root: python scripts/completeness.py
"""
import pandas as pd

CPCB_YEARS = ["2019-20", "2020-21", "2021-22", "2022-23", "2023-24"]
CPCB_METRICS = ["generated", "collected", "treated"]
MOHUA_YEAR, MOHUA_METRICS = "2025-26", ["generated", "treated"]
LANDFILL_YEARS = ["2021-22", "2022-23"]


def build(w):
    states = sorted(w.state.unique())
    rep = w.dropna(subset=["value_tpd"])
    rows = []
    for s in states:
        r = rep[rep.state == s]
        core = [("CPCB", y, m) for y in CPCB_YEARS for m in CPCB_METRICS] + [("MoHUA", MOHUA_YEAR, m) for m in MOHUA_METRICS]
        have = {(a, b, c) for a, b, c in zip(r.source_name, r.year, r.metric)}
        missing = [c for c in core if c not in have]
        zeros = int(((r.value_tpd == 0) & r.apply(lambda x: (x.source_name, x.year, x.metric) in core, axis=1)).sum())
        years_all = sum(all(("CPCB", y, m) in have for m in CPCB_METRICS) for y in CPCB_YEARS)
        lf = sum(("CPCB", y, "landfilled") in have for y in LANDFILL_YEARS)
        miss_txt = "; ".join(f"{a} {b} {c}" for a, b, c in missing)
        rows.append(dict(state=s, expected_cells=len(core), reported_cells=len(core) - len(missing),
                         completeness_pct=round((len(core) - len(missing)) / len(core) * 100, 1),
                         years_all_three=years_all, years_possible=len(CPCB_YEARS), zero_reported_cells=zeros,
                         landfilled_years=lf, landfilled_years_possible=len(LANDFILL_YEARS), not_reported=miss_txt or "none",
                         note="share of 17 core cells reported (CPCB 2019-20 to 2023-24: generated, collected, treated; MoHUA 2025-26: generated, treated). "
                              "A low score means thin reporting, not that the figures are wrong."))
    return pd.DataFrame(rows).sort_values(["completeness_pct", "state"]).reset_index(drop=True)


if __name__ == "__main__":
    d = build(pd.read_csv("data/waste_clean.csv"))
    d.to_csv("data/completeness.csv", index=False)
    print(len(d), "states;", int((d.completeness_pct == 100).sum()), "fully reported")
    print(d.head(6)[["state", "reported_cells", "completeness_pct", "not_reported"]].to_string(index=False))
