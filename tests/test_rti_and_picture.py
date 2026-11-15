"""A flag becomes an RTI application and a Parliament question; a claim check becomes a square picture. Both are drafts the person sends."""
import csv
import json
import subprocess


def read(p):
    return open(p, encoding="utf-8").read()


def node(code, data=None):
    out = subprocess.run(["node", "-e", code], input=json.dumps(data) if data is not None else None, capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


def flags():
    return list(csv.DictReader(open("data/flags.csv", encoding="utf-8")))


def waste():
    return list(csv.DictReader(open("data/waste_clean.csv", encoding="utf-8")))


DRAFT_ALL = ("var R=require('./web/app/rti.js');var d=JSON.parse(require('fs').readFileSync(0,'utf8'));"
             "console.log(JSON.stringify(d.flags.map(function(f){var rows=d.waste.filter(function(x){return x.state===f.state&&x.year===f.year&&x.source_name===(R.parse(f.values).source||x.source_name)});"
             "return {f:f,d:R.draft(f,rows,null,'15/11/2026')}})))")


def test_kerala_treated_above_collected_is_drafted_with_figures_and_pages():
    f = [x for x in flags() if x["state"] == "Kerala" and x["year"] == "2019-20" and x["rule"].startswith("6_")][0]
    out = node(DRAFT_ALL, {"flags": [f], "waste": waste()})[0]["d"]
    assert out["ok"]
    rti, q = out["rti"], out["question"]
    assert "Section 6(1) of the Right to Information Act, 2005" in rti and "Central Pollution Control Board" in rti
    assert "1,837 tonnes per day" in rti and "880 tonnes per day" in rti and ", page " in rti and "Kerala" in rti and "2019-20" in rti
    assert "Name and address of the applicant" in rti and "Section 6(3)" in rti
    assert "ENVIRONMENT, FOREST AND CLIMATE CHANGE" in q and "be pleased to state" in q and "(d)" in q


def test_every_single_source_flag_makes_a_clean_draft_and_a_difference_between_bodies_does_not():
    rows = node(DRAFT_ALL, {"flags": flags(), "waste": waste()})
    made = [r for r in rows if r["d"]["ok"]]
    assert len(made) == sum(1 for f in flags() if not f["rule"].startswith("3_")) > 0
    for r in rows:
        if r["f"]["rule"].startswith("3_"):
            assert not r["d"]["ok"]
        else:
            t = r["d"]["rti"] + r["d"]["question"]
            assert "undefined" not in t and "NaN" not in t and "null" not in t, r["f"]
            assert r["f"]["state"] in t
    mohua = [r for r in made if r["f"]["rule"].startswith("5_")]
    assert mohua and "Housing and Urban Affairs" in mohua[0]["d"]["rti"]


def test_the_drafts_are_never_sent_or_translated_and_the_page_is_wired():
    js, app, html = read("web/app/rti.js"), read("web/app/app.js"), read("web/app/index.html")
    assert "fetch(" not in js and "XMLHttpRequest" not in js and "sendBeacon" not in js      # nothing leaves the page
    assert "We write it; you send it" in js and "not legal advice" in js
    assert html.count("rti.js") == 1 and "KSRti.wire(box, fl)" in app and "KSRti.button(i)" in app
    assert "data-notr" not in js and 'aria-pressed' in js and "textarea" in js


CARD = ("var R=require('./web/app/receipt.js');var m=function(t,s,w){return t.length*(s||20)*0.5};"
        "var o={claim:'81% of India urban waste is processed '.repeat(8),verdict:'Sources disagree',built:'2026-11-15',"
        "figures:[1,2,3,4,5,6].map(function(i){return {source:'CPCB',year:'2023-24',figure:'61.6% treated',computed:false,doc:'Lok Sabha Q50',page:i}})};"
        "var c=R.cardModel(o,m);console.log(JSON.stringify({c:c,w:R.wrap('aa bb cc dd ee',60,function(t){return t.length*10}),w2:R.wrap('one two three four five six',60,function(t){return t.length*10},2)}))")


def test_the_picture_is_square_fits_and_keeps_the_honest_line():
    out = node(CARD)
    c = out["c"]
    assert c["w"] == c["h"] == 1080
    for it in c["items"]:
        assert 0 <= it["y"] <= 1080 and 0 <= it["x"] <= 1080, it
    texts = [i["t"] for i in c["items"]]
    assert "We do not say which source is right." in texts and "kachra-satya.onrender.com" in texts
    assert "Sources disagree" in texts
    assert sum(1 for t in texts if t.endswith(", page 1") or ", page " in t) <= 4      # no more than four figures on a card
    claim_lines = [i for i in c["items"] if i["size"] == 46]
    assert 1 <= len(claim_lines) <= 4 and claim_lines[-1]["t"].endswith("...")          # a long claim is cut, not overflowed
    assert out["w"] == ["aa bb", "cc dd", "ee"] and len(out["w2"]) == 2 and out["w2"][1].endswith("...")


def test_the_picture_button_is_wired_and_works_without_share_support():
    app, rc = read("web/app/app.js"), read("web/app/receipt.js")
    assert 'id="ccpic"' in app and "R.image(rcpt)" in app and "navigator.canShare" in app and 'a.download = "kachra-satya-receipt.png"' in app
    assert "toBlob" in rc and "document.fonts" in rc
