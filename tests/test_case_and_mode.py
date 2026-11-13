"""The ward case file is written only from what exists; the My street / The numbers switch changes order and removes nothing."""
import json
import re
import subprocess


def read(p):
    return open(p, encoding="utf-8").read()


def node(code):
    out = subprocess.run(["node", "-e", code], capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


W = "{state:'Kerala',city:'Kochi',ward:'Ward 4'}"
FULL = ("{ward:" + W + ",today:'2026-11-13',own:{window:30,days:[{date:'2026-11-02',status:'not_collected'},{date:'2026-11-03',status:'collected'},{date:'2026-11-05',status:'not_collected'}]},"
        "shared:{reporters:9,collected:31,notCollected:14,contested:2},"
        "complaints:[{filed:'2026-11-03',ticket:'SWM123',issue:'Garbage vehicle did not arrive',status:'Open',city:'kochi'},{filed:'2026-10-01',ticket:'X9',issue:'Other',status:'Open',city:'Chennai'}],"
        "official:{pct:86.2,doc:'Lok Sabha Q50',page:3},url:'https://x/#/explore/receipts/Kerala'}")


def build(arg):
    return node("var C=require('./web/app/casefile.js');console.log(JSON.stringify(C.build(" + arg + ")))")


def test_case_file_joins_the_record_the_neighbours_the_complaint_and_the_official_figure():
    cf = build(FULL)
    assert [s["h"] for s in cf["sections"]] == ["What happened", "Who else says so", "What was done", "What the official figures say", "What is asked"]
    t = cf["text"]
    for part in ("Ward 4, Kochi, Kerala", "on 3 days: it came on 1 and did not come on 2", "2 Nov, 5 Nov", "9 signed-in residents have reported",
                 "31 reports that the truck came and 14 that it did not", "On 2 days residents disagreed; both counts are kept",
                 "number SWM123", "86.2%", "Lok Sabha Q50, page 3", "describes the whole state, not this ward", "An update on complaint number SWM123", "unverified"):
        assert part in t, part
    assert "X9" not in t and "Chennai" not in t      # a complaint from another city is not this ward's
    assert cf["ready"] is True


def test_case_file_says_so_when_a_part_is_missing_and_never_invents_it():
    cf = build("{ward:" + W + ",today:'2026-11-13',own:{window:30,days:[]},shared:null,complaints:[],official:null}")
    t = cf["text"]
    assert cf["ready"] is False
    for part in ("No days are recorded for this ward on this device yet", "No one has shared a report for this ward yet", "No complaint for Kochi is saved in my log yet", "No collected and generated figures are reported for Kerala"):
        assert part in t, part
    assert not re.search(r"\d+ signed-in resident", t) and "%" not in t
    one = build("{ward:" + W + ",today:'2026-11-13',own:{window:30,days:[{date:'2026-11-03',status:'collected'}]},shared:{reporters:0,collected:0,notCollected:0,contested:0},complaints:[],official:null}")
    assert "this is one resident's record" in one["text"] and "A written confirmation of the collection days" in one["text"]


def test_case_file_html_escapes_what_a_person_typed():
    h = node("var C=require('./web/app/casefile.js');console.log(JSON.stringify(C.html(C.build({ward:{state:'Kerala',city:'Kochi',ward:'<img src=x onerror=1>'},today:'2026-11-13',own:{window:30,days:[]},complaints:[{filed:'2026-11-03',ticket:'<b>',issue:'<script>',status:'Open',city:'Kochi'}]}))))")
    assert "<img" not in h and "<script>" not in h and "&lt;img" in h


def test_ward_page_offers_the_case_file_and_never_sends_it():
    ward, html, css = read("web/app/ward.js"), read("web/app/index.html"), read("web/app/ward.css")
    i = ward.index("function drawCase(w)")
    block = ward[i:ward.index("function drawCal(s)", i)]
    for said in ("Copy as text", "WhatsApp", "Print or save as PDF", "We write it; you send it.", "Record a few days first"):
        assert said in block, said
    assert "fetch(" not in block and 'id="wcase"' in ward and "drawCase(w)" in ward
    assert html.index("casefile.js") < html.index('src="ward.js"') and "body.print-case" in css


def test_mode_defaults_to_numbers_and_doors_map_to_modes():
    got = node("var M=require('./web/app/mode.js');var a=M.get();M.set('street');var b=M.get();M.set('nonsense');console.log(JSON.stringify([a,b,M.get(),M.forDoor('garbage'),M.forDoor('school'),M.forDoor('claim'),M.forDoor('official'),M.forDoor('x')]))")
    assert got == ["numbers", "street", "street", "street", "street", "numbers", "numbers", None]


def test_mode_changes_order_and_removes_nothing():
    css, html, js = read("web/app/mode.css"), read("web/app/index.html"), read("web/app/opening.js")
    nav = html[html.index('<nav aria-label="Main"'):html.index("</nav>", html.index('<nav aria-label="Main"'))]
    menu = nav[nav.index('<div class="menu">'):]
    # every page a mode takes out of the top bar is put in More for that mode
    assert 'class="s-only" href="#/map"' in menu and 'class="s-only s-ins" href="#/gaps"' in menu
    assert 'body.mode-street #nav>a[href="#/gaps"]{display:none}' in css and "body.mode-street #nav .more .menu a.s-only.s-ins{display:flex}" in css
    assert 'body.mode-street #nav>a[href="#/map"]{display:none}' in css and "body.mode-street #nav .more .menu a.s-only{display:flex}" in css
    hidden = re.findall(r"body\.mode-street[^{]*\{display:none\}", css)
    assert len(hidden) == 4, hidden      # the map box on Home, Insights and Map in the top bar, and the phone copies they replace
    assert "body.mode-numbers" not in css      # the default mode is the site as it was
    for route in ("start", "claim", "map", "gaps", "ward", "help", "ask", "city", "brief/card", "school", "dropoff", "about"):
        assert 'href="#/%s"' % route in nav, route
    assert html.index("mode.js") < html.index('src="i18n.js"') and html.index("theme.css") < html.index("mode.css")
    assert "modeSwitch()" in js and "streetPanel()" in js and 'id="op-mapbox"' in js
    assert "root.KSMode.forDoor(b.dataset.path)" in js
    assert "location.hash" not in read("web/app/mode.js")      # choosing a mode never moves the reader to another page
