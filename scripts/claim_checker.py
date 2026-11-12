"""Claim Checker: test a numeric claim against every figure in the dataset.

Deterministic on purpose. A language model (the Q&A agent) turns a pasted sentence into the arguments below;
this module decides the verdict, so the verdict never depends on model memory.

    check_claim(metric="processed_pct", value=81)                 # national, any year
    check_claim(metric="treated", value=114110, unit="tpd", state="India", year="2023-24")
    check_claim(metric="processed_pct", value=73, state="Maharashtra", year="2023-24")

metric: generated | collected | treated | landfilled | processed_pct
Verdicts:
  SUPPORTED                    at least one comparable figure matches and none disagree
  CONTRADICTED                 comparable figures exist and none match
  SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS   sources disagree with each other (the interesting case)
  CANNOT_VERIFY                nothing comparable in the data ("not reported")
A match is within PCT_TOLERANCE percentage points (for percentages) or TPD_TOLERANCE_PCT per cent (for tonnes).
processed_pct figures are either "stated" (printed in a document) or "computed" (treated divided by generated, from rows).
CPCB and MoHUA figures often describe different years: every record carries its year, and the result says when years differ.

CLI (repo root):  python scripts/claim_checker.py processed_pct 81 [--state Kerala] [--year 2023-24] [--unit tpd]
"""
import argparse
import json
import os
import sys
import pandas as pd

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PCT_TOLERANCE = 1.0        # percentage points
TPD_TOLERANCE_PCT = 1.0    # per cent of the figure


def _load():
    w = pd.read_csv(os.path.join(ROOT, "data", "waste_clean.csv"))
    n = pd.read_csv(os.path.join(ROOT, "data", "national_stated.csv"))
    return w, n


def _records(metric, state, year):
    """Every comparable figure, as dicts with scope, year, source, doc, page, kind, value."""
    w, n = _load()
    out = []
    nat = state is None or str(state).strip().lower() in ("india", "national", "country")
    if nat:
        nn = n[n.state == "India"]
        if year:
            nn = nn[nn.year == year]
        sub = nn[nn.metric == metric]
        for r in sub.itertuples():
            if pd.notna(r.value):
                out.append(dict(scope="India", year=r.year, source_name=r.source_name, source_doc=r.source_doc,
                                source_page=r.source_page, kind="stated", value=float(r.value), note=r.note if pd.notna(r.note) else ""))
        if metric == "processed_pct":
            piv = nn.pivot_table(index=["year", "source_name", "source_doc", "source_page"], columns="metric", values="value", aggfunc="first")
            for (yr, sn, doc, pg), r in piv.iterrows():
                if pd.notna(r.get("treated")) and pd.notna(r.get("generated")) and r["generated"]:
                    out.append(dict(scope="India", year=yr, source_name=sn, source_doc=doc, source_page=pg, kind="computed",
                                    value=round(r["treated"] / r["generated"] * 100, 2),
                                    note=f"treated {r['treated']:g} / generated {r['generated']:g}"))
    else:
        ww = w[w.state.str.lower() == str(state).strip().lower()]
        if year:
            ww = ww[ww.year == year]
        if metric == "processed_pct":
            piv = ww.pivot_table(index=["year", "source_name", "source_doc", "source_page"], columns="metric", values="value_tpd", aggfunc="first")
            for (yr, sn, doc, pg), r in piv.iterrows():
                if "generated" in r and "treated" in r and pd.notna(r["treated"]) and pd.notna(r["generated"]) and r["generated"]:
                    out.append(dict(scope=state, year=yr, source_name=sn, source_doc=doc, source_page=pg, kind="computed",
                                    value=round(r["treated"] / r["generated"] * 100, 2),
                                    note=f"treated {r['treated']:g} / generated {r['generated']:g}"))
        else:
            for r in ww[(ww.metric == metric) & ww.value_tpd.notna()].itertuples():
                out.append(dict(scope=state, year=r.year, source_name=r.source_name, source_doc=r.source_doc,
                                source_page=r.source_page, kind="stated", value=float(r.value_tpd), note=r.note if pd.notna(r.note) else ""))
    return out


def _num(v):
    """Two decimals at most, no trailing zeros (the browser version prints the same text)."""
    return ("%.2f" % v).rstrip("0").rstrip(".")


def check_claim(metric, value, unit=None, state=None, year=None):
    metric = metric.strip().lower()
    if metric not in ("generated", "collected", "treated", "landfilled", "processed_pct"):
        return {"verdict": "CANNOT_VERIFY", "reason": f"unknown metric '{metric}'", "records": []}
    if unit is None:
        unit = "percent" if metric == "processed_pct" else "tpd"
    if (metric == "processed_pct") != (unit == "percent"):
        return {"verdict": "CANNOT_VERIFY", "reason": "unit does not fit the metric: processed_pct is a percent, the others are tpd", "records": []}
    recs = _records(metric, state, year)
    if not recs:
        return {"verdict": "CANNOT_VERIFY", "reason": "not reported: no figure for this metric, place and year in the dataset",
                "claim": dict(metric=metric, value=value, unit=unit, state=state or "India", year=year), "records": []}
    for r in recs:
        gap = abs(r["value"] - value)
        r["difference"] = round(gap, 2) if unit == "percent" else round(gap / r["value"] * 100, 2) if r["value"] else None
        tol = PCT_TOLERANCE if unit == "percent" else TPD_TOLERANCE_PCT
        r["matches"] = bool(r["difference"] is not None and r["difference"] <= tol)
    m = [r for r in recs if r["matches"]]
    x = [r for r in recs if not r["matches"]]
    lo, hi = min(r["value"] for r in recs), max(r["value"] for r in recs)
    # No figure matches, but the claim sits between the lowest and the highest figure we hold: the sources disagree with each other,
    # so "contradicted" would pick a side. Say the sources disagree. Outside the whole range, nothing supports it: CONTRADICTED.
    between = bool(x and not m and lo < value < hi)
    verdict = ("SUPPORTED" if m and not x else "CONTRADICTED" if x and not m and not between
               else "SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS")
    years = sorted({r["year"] for r in recs})
    reason = {"SUPPORTED": "every comparable figure in the dataset agrees with the claim",
              "CONTRADICTED": "comparable figures exist but none agree with the claim",
              "SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS": "some sources agree with the claim and others do not; the sources disagree with each other"}[verdict]
    if between:
        reason = f"no source gives this figure, and the sources disagree with each other (they range from {_num(lo)} to {_num(hi)})"
    if len(years) > 1:
        reason += f". The figures cover different years ({', '.join(years)}), so part of any difference may be real change."
    return {"verdict": verdict, "reason": reason, "claim": dict(metric=metric, value=value, unit=unit, state=state or "India", year=year),
            "tolerance": f"{PCT_TOLERANCE} percentage points" if unit == "percent" else f"{TPD_TOLERANCE_PCT}% of the figure",
            "records": sorted(recs, key=lambda r: (not r["matches"], r["year"]))}


def main():
    a = argparse.ArgumentParser()
    a.add_argument("metric")
    a.add_argument("value", type=float)
    a.add_argument("--state")
    a.add_argument("--year")
    a.add_argument("--unit", choices=["percent", "tpd"])
    x = a.parse_args()
    print(json.dumps(check_claim(x.metric, x.value, x.unit, x.state, x.year), indent=2, default=str))


if __name__ == "__main__":
    main()
