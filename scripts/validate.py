"""Kachra Satya validation engine.

Reads data/waste_clean.csv and data/national_stated.csv, runs six plain-function rules and writes
  data/flags.csv        (state, year, rule, values, explanation)
  data/gap_ranking.csv  (states ranked by CPCB-vs-MoHUA processing gap, for the Source Conflict Report)

Nothing is filled in: a blank value stays blank and is never used in a comparison.
Run from the repo root:  python scripts/validate.py
"""
import pandas as pd

WASTE = "data/waste_clean.csv"
NATIONAL = "data/national_stated.csv"
FLAGS = "data/flags.csv"
GAPS = "data/gap_ranking.csv"

SOURCE_DIFF_PCT = 10.0      # rule 3 threshold
ROUNDING_TPD = 0.5          # rule 5: below this a difference is source rounding
CPCB_YEAR, MOHUA_YEAR = "2023-24", "2025-26"   # closest-year pair (no same-year data from both)


def load():
    return pd.read_csv(WASTE), pd.read_csv(NATIONAL)


def wide(w):
    """One row per state, year, source_name with generated/collected/treated columns."""
    p = w.pivot_table(index=["state", "year", "source_name"], columns="metric",
                      values="value_tpd", aggfunc="first", dropna=False).reset_index()
    for c in ("generated", "collected", "treated"):
        if c not in p:
            p[c] = float("nan")
    return p


def flag(state, year, rule, values, why):
    return {"state": state, "year": year, "rule": rule, "values": values, "explanation": why}


def rule1_treated_plus_landfilled_exceeds_generated(n):
    """State landfilled data is not available, so this rule runs on national figures only."""
    out = []
    nat = n[n.state == "India"].pivot_table(index="year", columns="metric", values="value", aggfunc="first")
    for yr, r in nat.iterrows():
        if pd.notna(r.get("treated")) and pd.notna(r.get("landfilled")) and pd.notna(r.get("generated")):
            tot = r["treated"] + r["landfilled"]
            if tot > r["generated"]:
                out.append(flag("India", yr, "1_treated_plus_landfilled_gt_generated",
                                f"treated={r['treated']:g}; landfilled={r['landfilled']:g}; generated={r['generated']:g}",
                                f"Treated plus landfilled ({tot:g} tpd) is more than the waste generated, so some waste is counted twice."))
    return out


def rule2_collected_exceeds_generated(p):
    out = []
    for _, r in p.dropna(subset=["collected", "generated"]).iterrows():
        if r.collected > r.generated:
            out.append(flag(r.state, r.year, "2_collected_gt_generated",
                            f"collected={r.collected:g}; generated={r.generated:g}; source={r.source_name}",
                            "More waste is reported collected than generated, which is not possible."))
    return out


def rule3_sources_differ(p):
    """CPCB 2023-24 vs MoHUA 2025-26: different years, so this is a closest-year comparison, not same-year."""
    out = []
    a = p[(p.source_name == "CPCB") & (p.year == CPCB_YEAR)].set_index("state")
    b = p[(p.source_name == "MoHUA") & (p.year == MOHUA_YEAR)].set_index("state")
    for st in sorted(a.index.intersection(b.index)):
        for m in ("generated", "treated"):
            x, y = a.at[st, m], b.at[st, m]
            if pd.isna(x) or pd.isna(y) or x == 0:
                continue
            diff = (y - x) / x * 100
            if abs(diff) > SOURCE_DIFF_PCT:
                out.append(flag(st, f"{CPCB_YEAR} vs {MOHUA_YEAR}", "3_sources_differ_gt_10pct",
                                f"{m}: CPCB {CPCB_YEAR}={x:g}; MoHUA {MOHUA_YEAR}={y:g}; change={diff:+.1f}%",
                                f"CPCB and MoHUA {m} figures differ by more than {SOURCE_DIFF_PCT:g}%. "
                                "These are different years (no same-year pair exists yet), so part of the gap may be real change."))
    return out


def rule4_missing_metric(w):
    out = []
    for (st, src, m), g in w.groupby(["state", "source_name", "metric"]):
        has = g[g.value_tpd.notna()]
        if has.empty:
            continue                       # source never reports it for this state: not flagged
        for _, r in g[g.value_tpd.isna()].iterrows():
            out.append(flag(st, r.year, "4_metric_missing",
                            f"{m} blank in {r.year} ({r.note}); reported in {', '.join(sorted(has.year))}",
                            f"{m.capitalize()} is not reported for this year although the same source reports it in other years."))
    return out


def rule5_national_vs_state_sum(w, n):
    out = []
    nat = n[n.state == "India"]
    for (src_name, yr, m), g in w.groupby(["source_name", "year", "metric"]):
        s = g.value_tpd.sum(min_count=1)
        t = nat[(nat.source_name == src_name) & (nat.year == yr) & (nat.metric == m)]
        if t.empty or pd.isna(s):
            continue
        stated = t.value.iloc[0]
        d = s - stated
        if abs(d) > ROUNDING_TPD:
            out.append(flag("India", yr, "5_national_vs_state_sum",
                            f"{m}: sum of states={s:.1f}; stated national={stated:g}; difference={d:+.1f} tpd; source={src_name}",
                            "The state figures do not add up to the national total printed in the same source."))
    return out


def rule6_treated_exceeds_collected(p):
    out = []
    for _, r in p.dropna(subset=["collected", "treated"]).iterrows():
        if r.treated > r.collected:
            out.append(flag(r.state, r.year, "6_treated_gt_collected",
                            f"treated={r.treated:g}; collected={r.collected:g}; source={r.source_name}",
                            "More waste is reported treated than collected. Either collection is under-reported or treatment is over-reported."))
    return out


def gap_ranking(p):
    a = p[(p.source_name == "CPCB") & (p.year == CPCB_YEAR)].set_index("state")
    b = p[(p.source_name == "MoHUA") & (p.year == MOHUA_YEAR)].set_index("state")
    rows = []
    for st in sorted(a.index.intersection(b.index)):
        ga, ta, gb, tb = a.at[st, "generated"], a.at[st, "treated"], b.at[st, "generated"], b.at[st, "treated"]
        if pd.isna(ga) or pd.isna(gb) or ga == 0 or gb == 0 or pd.isna(ta) or pd.isna(tb):
            rows.append({"state": st, "cpcb_pct_treated": "", "mohua_pct_processed": "", "gap_pct_points": "",
                         "note": "not reported in one of the sources; no gap computed"})
            continue
        pc, pm = ta / ga * 100, tb / gb * 100
        rows.append({"state": st, "cpcb_pct_treated": round(pc, 1), "mohua_pct_processed": round(pm, 1),
                     "gap_pct_points": round(pm - pc, 1),
                     "note": f"CPCB {CPCB_YEAR} vs MoHUA {MOHUA_YEAR}: different years"})
    g = pd.DataFrame(rows)
    ok = g[g.gap_pct_points != ""].copy()
    ok["gap_pct_points"] = ok.gap_pct_points.astype(float)
    ok = ok.sort_values("gap_pct_points", ascending=False)
    ok.insert(0, "rank", range(1, len(ok) + 1))
    rest = g[g.gap_pct_points == ""].copy()
    rest.insert(0, "rank", "")
    return pd.concat([ok, rest])


def main():
    w, n = load()
    p = wide(w)
    flags = (rule1_treated_plus_landfilled_exceeds_generated(n) + rule2_collected_exceeds_generated(p)
             + rule3_sources_differ(p) + rule4_missing_metric(w) + rule5_national_vs_state_sum(w, n)
             + rule6_treated_exceeds_collected(p))
    f = pd.DataFrame(flags, columns=["state", "year", "rule", "values", "explanation"])
    f.to_csv(FLAGS, index=False)
    gap_ranking(p).to_csv(GAPS, index=False)
    print("flags written:", len(f))
    print(f.rule.value_counts().sort_index().to_string() if len(f) else "none")
    print("Rule 1 ran on national figures only (no state landfilled data).")
    print(f"Rule 3 compares CPCB {CPCB_YEAR} with MoHUA {MOHUA_YEAR} (different years).")


if __name__ == "__main__":
    main()
