"""The browser sentence reader must refuse what it cannot check instead of checking the wrong thing. Needs node."""
import json
import shutil
import subprocess
import pytest

NODE = r"""
global.window = {};
require(process.cwd() + '/web/trust/data.js');
const KS = global.window.KS, C = require(process.cwd() + '/web/trust/claim.js');
const out = {};
JSON.parse(process.argv[1]).forEach(s => { const p = C.parseSentence(KS, s); out[s] = { metric: p.metric, value: p.value, state: p.state, reason: p.reason || "" }; });
console.log(JSON.stringify(out));
"""

OK = ["81% of India's urban waste is processed", "Kerala processes 95%", "Delhi generates 11000 tpd in 2019-20",
      "Our cities process 80% of waste", "A minister said 81% of India's waste is processed", "Cities generate 150,000 tonnes per day"]
NO_PLACE = ["Atlantis processes 80%"]
NO_PERCENT = ["Maharashtra collects 100%", "Over 90% of wards have door-to-door collection"]


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_parser_guards():
    out = subprocess.run(["node", "-e", NODE, json.dumps(OK + NO_PLACE + NO_PERCENT)], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    r = json.loads(out.strip().splitlines()[-1])
    for s in OK:
        assert r[s]["metric"] and r[s]["reason"] == "", s                  # still checked as before
    assert r["Kerala processes 95%"]["state"] == "Kerala"
    for s in NO_PLACE:
        assert r[s]["metric"] is None and "Atlantis" in r[s]["reason"] and "36 states" in r[s]["reason"], s    # an unknown place is never turned into India
    for s in NO_PERCENT:
        assert r[s]["metric"] is None and "no percentage figure" in r[s]["reason"], s                          # collection or segregation is not read as processed
