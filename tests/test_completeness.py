"""Reporting-completeness score (scripts/completeness.py)."""
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import completeness  # noqa: E402


def test_counts_match_independent_count():
    w = pd.read_csv("data/waste_clean.csv")
    d = pd.read_csv("data/completeness.csv")
    assert len(d) == 36 and (d.expected_cells == 17).all()
    # independent count of reported core cells straight from the long file
    cp = w[(w.source_name == "CPCB") & w.year.isin(completeness.CPCB_YEARS) & w.metric.isin(completeness.CPCB_METRICS)].dropna(subset=["value_tpd"])
    mo = w[(w.source_name == "MoHUA") & (w.year == "2025-26") & w.metric.isin(completeness.MOHUA_METRICS)].dropna(subset=["value_tpd"])
    assert d.reported_cells.sum() == len(cp) + len(mo)


def test_known_states():
    d = pd.read_csv("data/completeness.csv").set_index("state")
    # Ladakh is absent from the CPCB 2019-20 and 2020-21 tables, so six core cells are missing
    assert d.loc["Ladakh", "reported_cells"] == 11 and "CPCB 2019-20 generated" in d.loc["Ladakh", "not_reported"]
    # Bihar reports no collected or treated in 2021-22 ("Not provided")
    assert "CPCB 2021-22 collected" in d.loc["Bihar", "not_reported"] and d.loc["Bihar", "completeness_pct"] < 100
    # Lakshadweep has no row in the MoHUA 2025-26 table
    assert "MoHUA 2025-26 generated" in d.loc["Lakshadweep", "not_reported"]


def test_scores_are_bounded_and_sorted():
    d = pd.read_csv("data/completeness.csv")
    assert d.completeness_pct.between(0, 100).all() and d.completeness_pct.is_monotonic_increasing
    assert (d.completeness_pct == (d.reported_cells / d.expected_cells * 100).round(1)).all()


def test_gaps_screens_data_is_exported():
    """The Gaps screens read these tables from web/trust/data.js; each must match its CSV row for row."""
    import json
    js = open("web/trust/data.js", encoding="utf-8").read()
    ks = json.loads(js[len("window.KS = "):].rstrip().rstrip(";"))
    for key, path in [("phantom", "phantom_tonnes"), ("money", "money_vs_mess"), ("indicators", "state_indicators"),
                      ("trucks", "truck_priority"), ("segregation", "national_segregation"), ("completeness", "completeness")]:
        assert len(ks[key]) == len(pd.read_csv(f"data/{path}.csv")), key
    # blanks stay null so the screens print "not reported" and never fill them in
    assert any(r["mohua_pct_processed"] is None for r in ks["money"])
    assert any(r["landfill_pct"] is None for r in ks["indicators"])
