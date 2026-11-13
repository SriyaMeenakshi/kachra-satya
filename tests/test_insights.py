"""Insights for a first-time reader: the overview numbers and the charts come from the data, and the tables stay one tap away."""
import json
import re
import subprocess

import pandas as pd


def read(p):
    return open(p, encoding="utf-8").read()


def node(code):
    out = subprocess.run(["node", "-e", code], capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


PRE = "global.window={};require('./web/trust/data.js');var I=require('./web/app/insights.js'),KS=window.KS;"


def test_overview_has_six_questions_each_linking_to_its_tab():
    cards = node(PRE + "console.log(JSON.stringify(I.overview(KS)))")
    assert [c["id"] for c in cards] == ["phantom", "money", "trucks", "landfill", "segregation", "complete"]
    for c in cards:
        assert c["q"].endswith("?") and c["href"] == "#/gaps/" + c["id"] and c["big"] and c["line"]
    app = read("web/app/app.js")
    for c in cards:      # every card lands on a tab that exists
        assert '["%s", ' % c["id"] in app
    tools = node(PRE + "console.log(JSON.stringify(I.tools(KS)))")
    assert [t["href"] for t in tools] == ["#/explore/audit", "#/explore/receipts", "#/explore/swings", "#/explore/defs"]


def test_overview_numbers_match_the_csvs():
    cards = {c["id"]: c for c in node(PRE + "console.log(JSON.stringify(I.overview(KS)))")}
    money = pd.read_csv("data/money_vs_mess.csv")
    assert cards["money"]["big"] == "%d%%" % round(money.funds_swm.sum() / money.allocation_swm.sum() * 100)
    comp = pd.read_csv("data/completeness.csv")
    assert cards["complete"]["big"] == "%d of %d" % ((comp.completeness_pct < 100).sum(), len(comp))
    tot = pd.read_csv("data/dumpsites_drap_total.csv").set_index("metric")
    assert cards["landfill"]["big"] == str(int(tot.loc["dumpsites", "printed_grand_total"]))
    assert str(int(tot.loc["dumpsites", "sum_of_printed_rows"])) in cards["landfill"]["line"]
    nat = pd.read_csv("data/national_stated.csv")
    nat = nat[(nat.source_name == "CPCB") & (nat.year == "2023-24")].set_index("metric").value
    got = int(cards["trucks"]["big"].replace(",", ""))
    assert got == round(nat["generated"] - nat["collected"])
    trucks = pd.read_csv("data/truck_priority.csv")
    assert abs(trucks.uncollected_tpd.sum() - got) < 1      # the state rows add up to the national subtraction
    seg = pd.read_csv("data/national_segregation.csv")
    assert cards["segregation"]["big"] == "%d%%" % round(float(seg[seg.indicator.str.contains("Source Segregation")].share_pct_computed.iloc[0]))


def test_far_apart_count_uses_the_same_threshold_as_the_flags():
    got = node(PRE + "var R=I.shares(KS);console.log(JSON.stringify([I.FAR,I.farApart(KS),R.length,R.filter(function(r){return Math.abs(r.diff)>10}).length]))")
    assert got[0] == 10 and got[1] == got[3] and 0 < got[1] <= got[2]


def test_completeness_grid_agrees_with_the_completeness_scores():
    g = node(PRE + "var G=I.cells(KS);console.log(JSON.stringify({n:G.cols.length,rows:G.rows.map(function(r){return [r.state,r.n]})}))")
    comp = pd.read_csv("data/completeness.csv").set_index("state")
    assert g["n"] == int(comp.expected_cells.iloc[0]) == 17
    for state, n in g["rows"]:
        assert n == int(comp.loc[state, "reported_cells"]), state


def test_charts_carry_their_figures_as_text():
    h = node(PRE + "console.log(JSON.stringify({d:I.dumbbell(I.shares(KS).slice(0,3)),g:I.grid(I.cells(KS)),b:I.hbar([{label:'A & B',value:2,text:'2 t/day'},{label:'C',value:1,text:'1 t/day',href:'#/map/C'}]),s:I.split(189,25,'itemised: 189','not itemised: 25')}))")
    top = node(PRE + "var r=I.shares(KS)[0];console.log(JSON.stringify([r.state,I.p1(r.cpcb.pct),I.p1(r.mohua.pct)]))")
    assert top[0] in h["d"] and "%s and %s" % (top[1], top[2]) in h["d"] and "CPCB treated" in h["d"] and "MoHUA processed" in h["d"]
    assert "A &amp; B" in h["b"] and "2 t/day" in h["b"] and 'href="#/map/C"' in h["b"]
    assert "Not reported:" in h["g"] and "of 17" in h["g"]
    assert "itemised: 189" in h["s"] and "not itemised: 25" in h["s"]
    for part in h.values():      # positions never run off the track
        for v in re.findall(r"(?:left|width):(-?[\d.]+)%", part):
            assert 0 <= float(v) <= 100


def test_tabs_are_plain_questions_and_tables_are_folded():
    app = read("web/app/app.js")
    for old in ('"Phantom tonnes"]', '"Money vs mess"]', '"Audit first"]', '"Swings"]'):
        assert old not in app
    for new in ("Do the numbers agree?", "Is the money used?", "What goes uncollected?", "What ends up dumped?", "Is waste kept separate?", "What goes unreported?", "Where to look first", "Figures that jump"):
        assert new in app
    assert app.count("I.lead(") >= 8 and app.count("I.fold(") >= 14
    assert 'if (!tab) {' in app and "I.overviewHTML(KS)" in app      # #/gaps opens on the overview
    for tid in ("phD", "mt", "tr", "lf", "dss", "dsc", "sg", "cp", "at", "rt", "vt"):      # every table still exists
        assert 'id="%s' % tid in app or "id=\"ph' + k" in app
    html = read("web/app/index.html")
    assert html.index("lead.js") < html.index("insights.js") < html.index('src="app.js"')


def test_insights_wording_does_not_accuse():
    js = read("web/app/insights.js").lower()
    for word in ("fraud", "fake", "lying", "cooked", "manipulat", "missing waste"):
        assert word not in js
