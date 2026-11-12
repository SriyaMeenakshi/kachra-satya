"""Readable Ask answers (web/app/answer.js), the count-up effect (countup.js) and the Home simulation cards (sim.js). All run in Node."""
import json
import shutil
import subprocess
import pytest

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")


def node(js):
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    return json.loads(out.strip().splitlines()[-1])


ANSWER = """Treated vs collected for Kerala (from tools):
2019-20: treated 1,837.0 vs collected 880.0 tpd (source: CPCB, rs_q358_2025-02-06.pdf, page 5) <- treated is above collected
2023-24: treated 2,595.225 vs collected 2,595.225 tpd (source: CPCB, ls_au50_2025-12-01.pdf, page 3)
In 4 year(s) more waste is reported treated than collected. Both cannot be true; the data does not say which figure to trust.
Flags:
2019-20 6_treated_gt_collected: treated=1837; collected=880; source=CPCB"""


def test_answer_becomes_cards_without_losing_or_adding_figures():
    r = node("const A=require(process.cwd()+'/web/app/answer.js');console.log(JSON.stringify({h:A.format(%s,['ls_au50_2025-12-01.pdf']),x:A.format('<script>alert(1)</script> **bold** fine',[])}))" % json.dumps(ANSWER))
    h = r["h"]
    assert '<h4 class="ans-h">Treated vs collected for Kerala</h4>' in h
    assert h.count("<li>") == 3                                                           # two data rows and one flag
    assert "Treated is above collected" in h and "Lok Sabha Q50" not in h.split("ans-rows")[0]
    assert "Rajya Sabha Q358, p.5" in h and "Lok Sabha Q50, p.3" in h                     # file names become document names with the page
    assert "1,837.0" in h and "880.0" in h and "2,595.225" in h                           # every figure is still there, unchanged
    assert 'class="ans-key"' in h and "Why these were flagged (1)" in h and "More waste is treated than collected" in h
    assert "6_treated_gt_collected" not in h and "<-" not in h and "&lt;-" not in h        # no rule codes or arrows shown to people
    assert "<script>" not in r["x"] and "&lt;script&gt;" in r["x"] and "<strong>bold</strong>" in r["x"]   # escaped; only bold is allowed


def test_model_prose_still_reads_well():
    r = node("const A=require(process.cwd()+'/web/app/answer.js');console.log(JSON.stringify(A.format('Kerala processes more than it collects.\\n\\nSources:\\nCPCB: ls_au50_2025-12-01.pdf', ['cpcb_2023-24.pdf'])))")
    assert "<p>Kerala processes more than it collects.</p>" in r and "Lok Sabha Q50" in r and "CPCB report 2023-24" in r and "Sources:" not in r.replace("Sources</span>", "")


def test_count_up_keeps_format_and_ends_on_the_real_text():
    r = node("""const C=require(process.cwd()+'/web/app/countup.js');
console.log(JSON.stringify({a:C.frame('17,420',0.5),b:C.frame('86% vs 35%',0.5),c:C.frame('61.62%',0.5),d:C.frame('131,530',1),e:C.frame('Your turn',0.5),f:C.frame('28,576',0)}))""")
    assert r["a"] == "8,710" and r["b"] == "43% vs 17%" and r["c"] == "30.81%"
    assert r["d"] == "1,31,530"                                          # the final frame is the same number (Indian grouping, as the site prints it)
    assert r["e"] == "Your turn" and r["f"] == "0"


def test_demo_screens_use_the_real_data_and_functions():
    r = node("""global.window={};require(process.cwd()+'/web/trust/data.js');window.KSClaim=require(process.cwd()+'/web/trust/claim.js');
window.KSAnswer=require(process.cwd()+'/web/app/answer.js');require(process.cwd()+'/web/app/saathi.js');window.matchMedia=()=>({matches:true});
require(process.cwd()+'/web/app/demo.js');
const D=window.KSDemo, html=D.html(), demos=D._build();
const steps=demos.map(d=>d.steps.map(s=>s.html(s.type||undefined)));
console.log(JSON.stringify({tabs:(html.match(/role="tab"/g)||[]).length,labels:demos.map(d=>d.label),counts:steps.map(x=>x.length),all:steps.map(x=>x.join('||'))}))""")
    assert r["tabs"] == 4 and r["counts"] == [4, 3, 3, 3]
    assert r["labels"][0] == "My garbage isn't collected" and r["labels"][1] == "Someone quoted a number"
    garbage, claim, brief, school = r["all"]
    assert "not collected on 5 days" in garbage and "page" in garbage and "unverified" in garbage and "example" in garbage      # the real letter functions, with made-up taps
    assert "81%" in claim and "61.62%" in claim and "Lok Sabha Q50" in claim and "The sources disagree" in claim            # the real checker, with real documents
    assert "Kerala" in brief and "Audit priority #" in brief and "86.2%" in brief and "97.7%" in brief                       # Kerala's real figures from the data
    assert "made-up numbers" in school and "Special care" in school
