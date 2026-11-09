"""Audit Your City: run the Kachra Satya consistency rules on a ward-level (or ULB-level) CSV supplied by the user.

Input columns (see data/city_audit_template.csv): ulb, ward, period, generated_tpd, collected_tpd, segregated_tpd,
treated_tpd, landfilled_tpd, notes. Any numeric cell may be blank: blank means "not reported" and is never filled in or guessed.
Rules (each a plain function returning flag rows):
  C1 collected above generated            C2 segregated above collected
  C3 treated above collected              C4 treated plus landfilled above generated
  C5 metric missing for a ward that reports it in other periods
Output: flags (ulb, ward, period, rule, values, explanation) and a priority ranking of wards by tonnage left uncollected
(generated - collected; rows with a blank or with collected above generated are left out of the ranking).
The ranking says where uncollected waste is largest in the data supplied. It is prioritisation, not route optimisation.
Usage (repo root):  python scripts/audit_city.py my_city.csv [out_dir]
"""
import os
import sys
import pandas as pd

NUM = ["generated_tpd", "collected_tpd", "segregated_tpd", "treated_tpd", "landfilled_tpd"]
TOL = 0.05          # tonnes per day of tolerance for rounding in user data


def _flag(r, rule, values, why):
    return dict(ulb=r.ulb, ward=r.ward, period=r.period, rule=rule, values=values, explanation=why)


def c1(d):
    return [_flag(r, "C1_collected_gt_generated", f"collected={r.collected_tpd:g}; generated={r.generated_tpd:g}",
                  "More waste is reported collected than generated.")
            for r in d.dropna(subset=["collected_tpd", "generated_tpd"]).itertuples() if r.collected_tpd > r.generated_tpd + TOL]


def c2(d):
    return [_flag(r, "C2_segregated_gt_collected", f"segregated={r.segregated_tpd:g}; collected={r.collected_tpd:g}",
                  "More waste is reported segregated than collected.")
            for r in d.dropna(subset=["segregated_tpd", "collected_tpd"]).itertuples() if r.segregated_tpd > r.collected_tpd + TOL]


def c3(d):
    return [_flag(r, "C3_treated_gt_collected", f"treated={r.treated_tpd:g}; collected={r.collected_tpd:g}",
                  "More waste is reported treated than collected. Either collection is under-reported or treatment is over-reported.")
            for r in d.dropna(subset=["treated_tpd", "collected_tpd"]).itertuples() if r.treated_tpd > r.collected_tpd + TOL]


def c4(d):
    out = []
    for r in d.dropna(subset=["treated_tpd", "landfilled_tpd", "generated_tpd"]).itertuples():
        if r.treated_tpd + r.landfilled_tpd > r.generated_tpd + TOL:
            out.append(_flag(r, "C4_treated_plus_landfilled_gt_generated",
                             f"treated={r.treated_tpd:g}; landfilled={r.landfilled_tpd:g}; generated={r.generated_tpd:g}",
                             "Treated plus landfilled is more than generated, so some waste is counted twice."))
    return out


def c5(d):
    out = []
    for (ulb, ward), g in d.groupby(["ulb", "ward"], dropna=False):
        for m in NUM:
            if g[m].notna().any():
                have = ", ".join(sorted(g[g[m].notna()].period.astype(str)))
                for r in g[g[m].isna()].itertuples():
                    out.append(_flag(r, "C5_metric_missing", f"{m} blank in {r.period}; reported in {have}",
                                     f"{m} is not reported for this period although the same ward reports it in other periods."))
    return out


def ranking(d):
    r = d.dropna(subset=["generated_tpd", "collected_tpd"]).copy()
    r["uncollected_tpd"] = (r.generated_tpd - r.collected_tpd).round(3)
    r = r[r.uncollected_tpd >= 0]
    r = (r.groupby(["ulb", "ward"], dropna=False)
          .agg(periods=("period", "nunique"), uncollected_tpd_avg=("uncollected_tpd", "mean"),
               uncollected_tpd_max=("uncollected_tpd", "max")).reset_index())
    r = r.sort_values("uncollected_tpd_avg", ascending=False)
    r.insert(0, "rank", range(1, len(r) + 1))
    return r.round(3)


def audit(d):
    need = {"ulb", "ward", "period"} | set(NUM)
    missing = need - set(d.columns)
    if missing:
        raise ValueError(f"missing columns: {sorted(missing)}; use data/city_audit_template.csv")
    d = d.copy()
    d["ward"] = d["ward"].astype(object).where(d["ward"].notna(), "")
    for c in NUM:
        d[c] = pd.to_numeric(d[c], errors="coerce")
    flags = c1(d) + c2(d) + c3(d) + c4(d) + c5(d)
    return pd.DataFrame(flags, columns=["ulb", "ward", "period", "rule", "values", "explanation"]), ranking(d)


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    flags, rank = audit(pd.read_csv(sys.argv[1]))
    out = sys.argv[2] if len(sys.argv) > 2 else "."
    os.makedirs(out, exist_ok=True)
    flags.to_csv(os.path.join(out, "city_flags.csv"), index=False)
    rank.to_csv(os.path.join(out, "city_priority.csv"), index=False)
    print(len(flags), "flags;", len(rank), "wards ranked")


if __name__ == "__main__":
    main()
