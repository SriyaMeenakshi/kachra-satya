"""Kachra Saathi (web/app/saathi.js): bin matching only returns what the official notice lists; no guessing. Needs node."""
import json
import shutil
import subprocess
import pytest

NODE = r"""
global.window = {};
require(process.cwd() + '/web/trust/data.js');
require(process.cwd() + '/web/app/saathi.js');
const S = global.window.KSSaathi;
const m = q => { const r = S._match(q); return r ? r[1].id : null; };
console.log(JSON.stringify({
  diaper: m('diaper'), diapers: m('used diapers'), bulb: m('light bulb'), tablets: m('expired tablets'), plastic: m('plastic bottle'),
  tea: m('used tea bags'), scanner: m('scanner'), peel: m('banana peel'), short: m('ab'), meat: m('chicken meat'), paint: m('old paint'),
  kerala: S._claimLine('Kerala'), none: S._claimLine('')
}));
"""


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_saathi_matching_and_claim_line():
    out = subprocess.run(["node", "-e", NODE], capture_output=True, text=True, check=True).stdout
    r = json.loads(out.strip().splitlines()[-1])
    assert r["diaper"] == "sanitary" and r["diapers"] == "sanitary"
    assert r["bulb"] == "special" and r["tablets"] == "special" and r["paint"] == "special"
    assert r["plastic"] == "dry" and r["meat"] == "wet" and r["peel"] == "wet"
    assert r["tea"] is None and r["scanner"] is None and r["short"] is None     # not in the official list: no guess
    assert "98 kg of every 100 kg" in r["kerala"] and "86 kg treated" in r["kerala"] and "disagree" in r["kerala"]
    assert r["none"] == ""
