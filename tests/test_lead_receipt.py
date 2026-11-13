"""The lead finding on Home is chosen by rule from the CSVs; the shareable receipt carries only the sentence and never a verdict."""
import json
import subprocess

import pandas as pd


def read(p):
    return open(p, encoding="utf-8").read()


def node(code):
    out = subprocess.run(["node", "-e", code], capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


PRE = "global.window={};require('./web/trust/data.js');var L=require('./web/app/lead.js'),R=require('./web/app/receipt.js'),KS=window.KS;"


def expected_lead():
    """The same rule, worked out again from the CSV with pandas."""
    w = pd.read_csv("data/waste_clean.csv")
    w = w[w.value_tpd.notna()]
    out = []
    my, cy = w[w.source_name == "MoHUA"].year.max(), w[w.source_name == "CPCB"].year.max()
    for st in w.state.unique():
        def val(src, y, m):
            r = w[(w.state == st) & (w.source_name == src) & (w.year == y) & (w.metric == m)]
            return float(r.value_tpd.iloc[0]) if len(r) else None
        mg, mt, cg, ct = val("MoHUA", my, "generated"), val("MoHUA", my, "treated"), val("CPCB", cy, "generated"), val("CPCB", cy, "treated")
        if mg and cg and mt is not None and ct is not None:
            out.append((st, mt / mg * 100, ct / cg * 100, mt, mg, ct, cg))
    out.sort(key=lambda x: (-abs(x[1] - x[2]), x[0]))
    return out


def test_lead_is_the_widest_difference_in_the_csv():
    exp = expected_lead()
    got = node(PRE + "console.log(JSON.stringify(L.pick(KS)))")
    st, mp, cp, mt, mg, ct, cg = exp[0]
    assert got["state"] == st
    assert abs(got["mohua"]["pct"] - mp) < 1e-9 and abs(got["cpcb"]["pct"] - cp) < 1e-9
    assert (got["mohua"]["treated"], got["mohua"]["generated"], got["cpcb"]["treated"], got["cpcb"]["generated"]) == (mt, mg, ct, cg)
    assert len(node(PRE + "console.log(JSON.stringify(L.rank(KS).map(function(x){return x.state})))")) == len(exp)


def test_lead_figures_open_on_a_source_page():
    got = node(PRE + "var p=L.pick(KS);console.log(JSON.stringify([KS.receipts[p.mohua.key],KS.receipts[p.cpcb.key]]))")
    assert all(r and r.get("image") for r in got)


def test_lead_wording_does_not_pick_a_winner():
    js = read("web/app/opening.js")
    assert "lead() +" in js and "The documents do not say which, and neither do we." in js
    assert "picked by that rule and not by hand" in js
    i = js.index("function lead()")
    block = js[i:js.index("view.innerHTML", i)].lower()
    for word in ("wrong", "false", "lie", "fake", "inflat", "missing waste"):
        assert word not in block


def test_lead_pct_format():
    assert node(PRE + "console.log(JSON.stringify([L.pct(100),L.pct(22.4913),L.pct(86.66)]))") == ["100%", "22.5%", "86.7%"]


def test_receipt_link_round_trips_the_sentence():
    for s in ("81% of India's urban waste is processed", "Delhi treated 7,542 tonnes per day in 2023-24", "50/50 split & more #1"):
        got = node(PRE + "var s=%s,u=R.link('https://x.org/a/#/map',s);console.log(JSON.stringify([u,R.fromArgs(decodeURIComponent(u.split('#/claim/')[1]).split('/'))]))" % json.dumps(s))
        assert got[0].startswith("https://x.org/a/#/claim/") and got[1] == s


def test_receipt_link_is_capped_and_empty_is_plain():
    got = node(PRE + "console.log(JSON.stringify([R.fromArgs([new Array(900).join('a')]).length,R.link('https://x.org/','  ')]))")
    assert got == [300, "https://x.org/#/claim"]


def test_receipt_text_names_document_and_page_and_no_winner():
    t = node(PRE + "console.log(JSON.stringify(R.text({claim:'81% processed',verdict:'The sources disagree',figures:[{source:'MoHUA',year:'2025-26',figure:'80.9%',doc:'Rajya Sabha Q2433',page:3},{source:'CPCB',year:'2023-24',figure:'62%',computed:true,doc:'Lok Sabha Q50',page:3}],matches:1,total:4,built:'2026-11-13',url:'https://x.org/#/claim/81'})))")
    for part in ("Claim: 81% processed", "Result: The sources disagree", "MoHUA 2025-26: 80.9%. Rajya Sabha Q2433, page 3", "CPCB 2023-24: 62% (computed by us). Lok Sabha Q50, page 3", "1 of 4 source figures match", "We do not say which source is right.", "https://x.org/#/claim/81"):
        assert part in t


def test_claim_page_wires_the_receipt():
    js, html = read("web/app/app.js"), read("web/app/index.html")
    assert "function renderClaim(tab, args)" in js and "KSReceipt.fromArgs(args)" in js
    assert "shareRow(r, sentence, heads, fig, na, T(V[0]), said)" in js
    assert 'check(true)' in js      # adjusted values are never tied to the typed sentence
    assert html.index("receipt.js") < html.index('src="app.js"') and html.index("lead.js") < html.index("opening.js")


def test_hero_is_the_map_with_no_switch_or_autoplay():
    js, html = read("web/app/opening.js"), read("web/app/index.html")
    assert '<div class="op-mapwrap"><div id="op-mapbox">' in js and 'id="op-map"' in js      # the India map is the hero again, shown at once
    for gone in ("board()", "story()", "op-view", "setInterval"):
        assert gone not in js, gone
    assert "board.css" not in html and "story.css" not in html


def test_ward_qr_on_a_test_copy_points_at_the_live_site():
    cfg, ward = read("web/app/config.js"), read("web/app/ward.js")
    assert 'publicBase: "https://kachra-satya.onrender.com/web/app/index.html"' in cfg
    assert "local && pub ? pub : location.href" in ward
