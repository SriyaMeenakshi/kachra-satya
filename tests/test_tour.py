"""The step-by-step tour: its steps point at parts that exist, it never opens by itself, and the note is placed where it will not cover the boxed part."""
import json
import re
import subprocess


def read(p):
    return open(p, encoding="utf-8").read()


def node(code):
    out = subprocess.run(["node", "-e", code], capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


SOURCES = {"start": ["web/app/opening.js", "web/app/mode.js", "web/app/loop.js"], "claim": ["web/app/app.js"], "ward": ["web/app/ward.js", "web/app/casefile.js"]}


def tours():
    return node("var T=require('./web/app/tour.js');console.log(JSON.stringify(T.TOURS))")


def test_every_step_has_a_title_text_and_a_selector():
    t = tours()
    assert set(t) == {"start", "claim", "ward"}
    for name, tour in t.items():
        assert 4 <= len(tour["steps"]) <= 8, name      # short enough to finish in about a minute
        titles = [s["title"] for s in tour["steps"]]
        assert len(set(titles)) == len(titles), name
        for s in tour["steps"]:
            assert s["title"] and s["text"] and s["sel"] and len(s["text"]) < 260, (name, s["title"])


def test_every_selector_matches_something_the_page_actually_builds():
    t = tours()
    for name, tour in t.items():
        src = "\n".join(read(f) for f in SOURCES[name])
        for s in tour["steps"]:
            for sel in s["sel"]:
                for kind, word in re.findall(r"([#.])([A-Za-z][\w-]*)", sel):
                    if kind == "#":
                        assert ('id="%s"' % word in src) or ('id=\\"%s\\"' % word in src) or ('"%s"' % word in src), (name, sel)
                    else:
                        assert word in src, (name, sel)
            if s.get("up"):
                assert s["up"] in (".card", ".ask", "p"), s


def test_the_tour_only_starts_when_a_person_presses_the_button():
    js, app, opening, html = read("web/app/tour.js"), read("web/app/app.js"), read("web/app/opening.js"), read("web/app/index.html")
    assert js.count("start(") >= 1 and "[data-tour]" in js
    assert not re.search(r"setTimeout\([^)]*start\(", js) and "KSTour.start(" not in app + opening      # nothing calls start() on its own
    assert "KSTour.mount(r.name, view)" in app and 'KSTour.button("start")' in opening
    assert html.count("tour.js") == 1 and html.count("tour.css") == 1


def test_the_tour_can_be_used_without_a_mouse_and_with_a_screen_reader():
    js, css = read("web/app/tour.js"), read("web/app/tour.css")
    for needed in ('role", "dialog"', 'aria-modal", "true"', "aria-labelledby", "aria-describedby", '"Escape"', '"ArrowRight"', '"ArrowLeft"', '"Tab"', "opener.focus()", 'addEventListener("hashchange", close)'):
        assert needed in js, needed
    rules = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    assert "animation" not in rules and "transition" not in rules      # nothing moves, so reduced motion needs no special case
    assert "@media print" in css and "outline" in css


def test_the_note_is_placed_below_above_or_docked():
    code = ("var T=require('./web/app/tour.js');console.log(JSON.stringify([T.place({left:20,top:100,h:100},{w:440,h:200},800,700),"
            "T.place({left:20,top:400,h:200},{w:440,h:200},800,700),T.place({left:20,top:80,h:600},{w:440,h:200},800,700),"
            "T.place({left:700,top:100,h:100},{w:440,h:200},800,700)]))")
    a, b, c, d = node(code)
    assert a == {"mode": "below", "top": 212, "left": 20}
    assert b["mode"] == "above" and b["top"] == 188      # no room below, so above the boxed part
    assert c["mode"] == "dock"                           # a tall part: dock at the bottom of the window
    assert d["left"] == 800 - 440 - 12                   # never off the right edge


def test_steps_for_a_part_that_is_hidden_are_skipped():
    js = read("web/app/tour.js")
    assert "function shown(el)" in js and "r.width > 0 && r.height > 0" in js and ".filter(function (x) { return x.el; })" in js
