"""Hindi and Telugu: the extra strings cover the same keys in both languages, the menu is fully translatable and follows the loop."""
import json
import re
import subprocess


def read(p):
    return open(p, encoding="utf-8").read()


def extra():
    code = "var got;global.window={KSi18n:{extend:function(o){got=o}}};require('./web/app/i18n_pages.js');console.log(JSON.stringify(got))"
    out = subprocess.run(["node", "-e", code], capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    return json.loads(out.stdout)


def test_hindi_and_telugu_extra_strings_cover_the_same_keys():
    x = extra()
    assert set(x["hi"]) == set(x["te"]), sorted(set(x["hi"]) ^ set(x["te"]))
    assert set(x["en"]) <= set(x["hi"])
    for lang in ("hi", "te"):
        for k, v in x[lang].items():
            assert v.strip(), (lang, k)


def test_placeholders_survive_translation():
    x = extra()
    for k in x["hi"]:
        assert set(re.findall(r"\{(\w+)\}", x["hi"][k])) == set(re.findall(r"\{(\w+)\}", x["te"][k])), k
    for k, need in (("lead_h", {"state", "m", "c"}), ("lead_either", {"a", "b", "x", "y1", "y2"}), ("lp_step", {"n", "name"}), ("ins_of", {"a", "b"}), ("door_steps", {"n"})):
        assert set(re.findall(r"\{(\w+)\}", x["te"][k])) == need, k


def test_every_page_and_stage_and_tab_has_a_translation():
    x = extra()["te"]
    for page in ("map", "claim", "gaps", "explore", "city", "ask", "ward", "help", "brief", "school", "dropoff", "about"):
        assert "pg_" + page in x, page
    for stage in ("promise", "proof", "reality", "action"):
        for suffix in ("", "_q", "_l", "_c"):
            assert "lp_" + stage + suffix in x
    for tab in ("phantom", "money", "trucks", "landfill", "segregation", "complete", "audit", "receipts", "swings", "defs"):
        assert "tab_" + tab in x
    for door in ("garbage", "claim", "official", "school"):
        assert "door_" + door in x and "door_" + door + "_s" in x


def test_headline_is_the_same_idea_in_all_three_languages():
    i18n = read("web/app/i18n.js")
    assert "भारत की कचरा कहानी" not in i18n and "భారత చెత్త కథ" not in i18n      # the old headline is gone
    assert "रसीद" in i18n and "రసీదు" in i18n                                      # "receipt", as in the English headline


def test_menu_follows_the_loop_and_every_label_is_translatable():
    html = read("web/app/index.html")
    nav = html[html.index('<nav aria-label="Main"'):html.index("</nav>", html.index('<nav aria-label="Main"'))]
    top = nav[:nav.index('<details class="more">')]
    order = [top.index('href="#/%s"' % r) for r in ("start", "claim", "map", "gaps", "ward", "help")]      # Home, Promise, Proof, Proof, Reality, Action
    assert order == sorted(order)
    assert len(re.findall(r"<span(?![^>]*data-i=)[^>]*>", nav)) == 0      # no label without a translation key
    assert html.index('src="i18n.js"') < html.index("i18n_pages.js") < html.index("loop.js")
    app = read("web/app/app.js")
    assert 'window.addEventListener("ks-lang", go)' in app and "lang-note" in app


def test_whole_site_dictionary_is_built_from_the_text_files_and_is_current(tmp_path):
    import os, sys
    out = tmp_path / "i18n_dict.js"
    env = dict(os.environ, KS_I18N_OUT=str(out))
    r = subprocess.run([sys.executable, "scripts/build_i18n.py"], capture_output=True, text=True, env=env)
    assert r.returncode == 0, r.stdout + r.stderr
    assert out.read_text(encoding="utf-8") == read("web/app/i18n_dict.js"), "run: python scripts/build_i18n.py and commit web/app/i18n_dict.js"


def test_dom_translation_puts_numbers_back_in_the_right_place():
    code = ("global.window={};var K=require('./web/app/i18n_dom.js');"
            "var a=K.norm('4 of 14 source figures'),b=K.norm('Since 1 April 2026, waste of 1,234.5 kg (SWM Rules, 2026).');"
            "console.log(JSON.stringify([a.key,a.nums,K.fill('#2 में से #1',a.nums),b.key,K.fill('# अप्रैल # (#)',b.nums)]))")
    out = subprocess.run(["node", "-e", code], capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    got = json.loads(out.stdout)
    assert got == ["# of # source figures", ["4", "14"], "14 में से 4", "Since # April #, waste of # kg (SWM Rules, #).", "1 अप्रैल 2026 (1,234.5)"]


def test_translation_never_touches_typed_text_letters_or_inputs():
    js = read("web/app/i18n_dom.js")
    for skipped in ("textarea", "pre", ".out", "input", "script"):
        assert skipped in js.split("var SKIP = ")[1].split(";")[0]
    assert 'el.tagName === "OPTION" && !el.hasAttribute("value")' in js      # an option whose text is its value is left alone
    html = read("web/app/index.html")
    assert html.index("i18n_pages.js") < html.index("i18n_dom.js") < html.index("i18n_dict.js")
