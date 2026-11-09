"""Recurrence flags, audit priority, definition crosswalk, MoHUA statements and the web data export."""
import json
import pandas as pd


def test_recurrence():
    r = pd.read_csv("data/recurrence.csv")
    k = r[(r.state == "Kerala") & (r.rule == "6_treated_gt_collected")].iloc[0]
    assert k.n_years == 4 and k.years == "2019-20; 2020-21; 2021-22; 2022-23"
    assert not r.rule.str.startswith("3_").any()                       # cross-source rule never "recurs"


def test_audit_priority():
    a = pd.read_csv("data/audit_priority.csv")
    assert len(a) == 36 and list(a["rank"]) == list(range(1, 37))
    assert a.priority_score.between(0, 1).all() and a.priority_score.is_monotonic_decreasing
    assert a.iloc[0].state == "Kerala"
    assert "not a finding" in a.iloc[0].note


def test_crosswalk_and_statements():
    c = pd.read_csv("data/definition_crosswalk.csv")
    assert {"Processed vs treated", "Landfilled", "Year"} <= set(c.concept)
    assert c.sources.notna().all()
    s = pd.read_csv("data/mohua_statements.csv")
    assert list(s.statement_date) == ["2024-11-28", "2025-07-28", "2025-12", "2026-08-10"]
    assert s.loc[s.statement_date == "2025-12", "processed_pct_stated"].iloc[0] == 80.31


def test_web_data_export():
    js = open("web/trust/data.js", encoding="utf-8").read()
    assert js.startswith("window.KS = ")
    ks = json.loads(js[len("window.KS = "):].rstrip().rstrip(";"))
    assert len(ks["waste"]) == len(pd.read_csv("data/waste_clean.csv"))
    assert len(ks["receipts"]) == len(json.load(open("receipts/index.json", encoding="utf-8")))
    assert any(r["value_tpd"] is None for r in ks["waste"])             # blanks stay null, shown as "not reported"
