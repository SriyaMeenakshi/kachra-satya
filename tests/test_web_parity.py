"""The browser Claim Checker (web/trust/claim.js) must give the same verdicts and records as scripts/claim_checker.py."""
import json
import os
import shutil
import subprocess
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from claim_checker import check_claim

CASES = [
    dict(metric="processed_pct", value=81),
    dict(metric="processed_pct", value=62),
    dict(metric="processed_pct", value=70),                    # no source gives 70, but the sources span 47 to 81
    dict(metric="processed_pct", value=95, state="Kerala"),
    dict(metric="treated", value=7542, unit="tpd", state="Delhi", year="2023-24"),
    dict(metric="processed_pct", value=90, state="Bihar"),
    dict(metric="landfilled", value=100, state="Kerala", year="2023-24"),
    dict(metric="treated", value=114110, unit="tpd", state="India", year="2023-24"),
    dict(metric="landfilled", value=2067, state="Maharashtra", year="2021-22"),
    dict(metric="treated", value=5, unit="percent"),
]

NODE = r"""
global.window = {};
require('./web/trust/data.js'.replace('./', process.cwd() + '/'));
const KS = global.window.KS || window.KS;
const {checkClaim} = require(process.cwd() + '/web/trust/claim.js');
const cases = JSON.parse(process.argv[1]);
console.log(JSON.stringify(cases.map(c => { const r = checkClaim(KS, c); return {verdict: r.verdict, reason: r.reason, n: r.records.length, matches: r.records.filter(x => x.matches).length}; })));
"""


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_js_matches_python():
    out = subprocess.run(["node", "-e", NODE, json.dumps(CASES)], capture_output=True, text=True, check=True).stdout
    js = json.loads(out.strip().splitlines()[-1])
    for case, j in zip(CASES, js):
        p = check_claim(case["metric"], case["value"], case.get("unit"), case.get("state"), case.get("year"))
        assert j["verdict"] == p["verdict"], case
        assert j["reason"] == p["reason"], case
        assert j["n"] == len(p["records"]), case
        assert j["matches"] == sum(r["matches"] for r in p["records"]), case


CITY_NODE = r"""
const fs = require('fs');
const {parseCSV, audit} = require(process.cwd() + '/web/app/city.js');
const r = audit(parseCSV(fs.readFileSync(process.argv[1], 'utf8')));
console.log(JSON.stringify({flags: r.flags.map(f => [f.ulb, f.ward, f.period, f.rule, f.values]), rank: r.ranking.map(x => [x.ward, x.uncollected_tpd_avg, x.uncollected_tpd_max])}));
"""


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_city_js_matches_python():
    import pandas as pd
    from audit_city import audit
    path = "tests/fixtures/city_FICTIONAL_example.csv"
    out = subprocess.run(["node", "-e", CITY_NODE, path], capture_output=True, text=True, check=True).stdout
    js = json.loads(out.strip().splitlines()[-1])
    flags, rank = audit(pd.read_csv(path))
    py_flags = sorted([str(r.ulb), "" if pd.isna(r.ward) else str(r.ward), str(r.period), r.rule, r.values] for r in flags.itertuples())
    assert sorted(js["flags"]) == py_flags
    assert {w[0]: (w[1], w[2]) for w in js["rank"]} == {r.ward: (r.uncollected_tpd_avg, r.uncollected_tpd_max) for r in rank.itertuples()}
