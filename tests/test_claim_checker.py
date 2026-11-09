"""Claim checker verdicts on the claims at the heart of the project."""
import json, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from claim_checker import check_claim
import qa_agent


def test_81_and_62_are_both_partly_supported():
    for v in (81, 62):
        r = check_claim("processed_pct", v)
        assert r["verdict"] == "SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS"
    assert any(x["source_name"] == "CPCB" and x["matches"] for x in check_claim("processed_pct", 62)["records"])
    assert any(x["source_name"] == "MoHUA" and x["matches"] for x in check_claim("processed_pct", 81)["records"])


def test_supported_contradicted_cannot_verify():
    assert check_claim("treated", 7542, state="Delhi", year="2023-24")["verdict"] == "SUPPORTED"
    assert check_claim("processed_pct", 90, state="Bihar")["verdict"] == "CONTRADICTED"
    assert check_claim("landfilled", 100, state="Kerala", year="2023-24")["verdict"] == "CANNOT_VERIFY"
    assert check_claim("treated", 5, unit="percent")["verdict"] == "CANNOT_VERIFY"      # unit does not fit


def test_agent_tool_wired():
    out = json.loads(qa_agent.run_tool("check_claim", {"metric": "processed_pct", "value": 81}))
    assert out["verdict"] == "SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS"
