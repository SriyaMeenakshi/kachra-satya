"""State card and briefing (web/app/leaders.js), school challenge (web/app/school.js) and the human spot-check scorer."""
import json
import os
import shutil
import subprocess
import sys
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

NODE = r"""
global.window = {};
require(process.cwd() + '/web/trust/data.js');
require(process.cwd() + '/web/app/leaders.js');
require(process.cwd() + '/web/app/school.js');
const L = global.window.KSLeaders, S = global.window.KSSchool;
const k = L._facts('Kerala'), b = L._facts('Bihar');
const ex = [["A", "2026-01-12", 20, 14, 12, 4], ["A", "2026-01-13", 22, 15, 10, 5], ["B", "2026-01-12", 30, 28, 9, 0], ["B", "2026-01-13", 28, 33, 8, 0], ["C", "2026-01-12", 40, 10, 38, 30], ["C", "2026-01-13", 41, "", 36, 31]]
  .map(r => ({block: r[0], date: r[1], generated: r[2], collected: r[3] === "" ? null : r[3], segregated: r[4], onsite: r[5]}));
const sa = S._audit(ex);
console.log(JSON.stringify({
  kerala_q: L._questions(k, 'mp').length, kerala_card: L._cardText(k, 'LINK'), brief: L._briefText(k, 'mla'), bihar_brief: L._briefText(b, 'mp'),
  school_rules: sa.flags.map(f => f.rule).sort(), school_rank0: sa.rank[0].block, school_a_seg: Math.round(sa.rank.filter(x => x.block === 'A')[0].seg)
}));
"""


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_leaders_and_school():
    out = subprocess.run(["node", "-e", NODE], capture_output=True, text=True, check=True).stdout
    r = json.loads(out.strip().splitlines()[-1])
    assert r["kerala_q"] == 4
    assert "98 kg" in r["kerala_card"] and "86 kg" in r["kerala_card"] and "disagree" in r["kerala_card"]
    assert "Member of the Legislative Assembly" in r["brief"] and "WHAT THIS DOES NOT SAY" in r["brief"] and "wrong" in r["brief"]
    assert "13.8%" in r["brief"]                                   # Kerala SWM funds used, Lok Sabha Q682
    assert "0.8%" in r["bihar_brief"]
    assert r["school_rules"] == ["S1", "S3"] and r["school_rank0"] == "C" and r["school_a_seg"] == 52


def test_human_spot_check_scorer():
    from score_human_spot_check import score
    out = score("tests/fixtures/human_spot_check_FIXTURE.csv")
    assert [r["rescored_match"] for r in out] == ["yes", "yes", "no"]      # the third read 23448.5 for 23448.46
