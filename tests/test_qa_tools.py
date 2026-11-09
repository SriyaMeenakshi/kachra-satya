"""Tool-layer tests for the Q&A agent. They need no API key."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import qa_agent as q


def test_known_value_with_source():
    rows = json.loads(q.run_tool("lookup_state", {"state": "Delhi", "year": "2023-24", "metric": "treated"}))
    assert rows[0]["value_tpd"] == 7542 and rows[0]["source_doc"] == "ls_au50_2025-12-01.pdf"


def test_missing_stays_blank():
    rows = json.loads(q.run_tool("lookup_state", {"state": "Bihar", "year": "2019-20", "metric": "treated"}))
    assert rows[0]["value_tpd"] == "" and "not reported" in rows[0]["note"]


def test_flags_and_national():
    fl = json.loads(q.run_tool("get_flags", {"state": "Kerala", "rule": "6_"}))
    assert len(fl) == 3
    nat = json.loads(q.run_tool("national_figures", {"year": "2023-24"}))
    assert any(r["metric"] == "generated" and r["value"] == 185195 for r in nat)


def test_unknown_state():
    assert "no rows" in q.run_tool("lookup_state", {"state": "Atlantis"})
