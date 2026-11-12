"""The design system (web/app/theme.css, i18n.js, fonts/): colour contrast of the text pairs, language coverage, safety rules and wording. No browser needed."""
import os
import re

CSS = open("web/app/theme.css", encoding="utf-8").read()
I18N = open("web/app/i18n.js", encoding="utf-8").read()


def lum(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]


def ratio(a, b):
    hi, lo = sorted([lum(a), lum(b)], reverse=True)
    return (hi + .05) / (lo + .05)


def tokens(block):
    return dict(re.findall(r"--([a-z0-9-]+):(#[0-9A-Fa-f]{6})", block))


LIGHT = tokens(re.search(r":root\{(.*?)\n\}", CSS, re.S).group(1))
DARK = tokens(re.search(r':root\[data-theme="dark"\]\{(.*?)\}\n', CSS, re.S).group(1))


def test_text_contrast_light_and_dark():
    pairs = [("ink", "page"), ("ink2", "page"), ("ink", "card"), ("ink2", "soft"), ("crit", "page"), ("crit", "crit-soft"), ("good", "good-soft"), ("warn", "warn-soft"), ("accent-ink", "accent"), ("link", "page")]
    for name, tk in (("light", LIGHT), ("dark", {**LIGHT, **DARK})):
        for fg, bg in pairs:
            assert ratio(tk[fg], tk[bg]) >= 4.5, (name, fg, bg, round(ratio(tk[fg], tk[bg]), 2))


def test_brand_palette_is_the_approved_one():
    assert LIGHT["forest-900"].upper() == "#0E2A20" and LIGHT["lime"].upper() == "#BFE84F" and LIGHT["ivory"].upper() == "#FAF7EF"
    assert ratio(LIGHT["lime"], LIGHT["forest-900"]) >= 7          # lime on the dark stage
    assert ratio(LIGHT["coral"], LIGHT["ivory"]) < 4.5             # coral is for graphics only; text uses --crit (checked above)


def test_theme_is_safe():
    assert "prefers-reduced-motion" in CSS and "@media print" in CSS
    assert "@keyframes" not in CSS and "100vw" not in CSS and "50vw" not in CSS
    assert 'font-display:swap' in CSS and "fonts/outfit-latin-wght-normal.woff2" in CSS


def test_font_is_self_hosted_with_its_licence():
    f = open("web/app/fonts/outfit-latin-wght-normal.woff2", "rb").read()
    assert f[:4] == b"wOF2" and 10_000 < len(f) < 120_000
    assert "SIL Open Font License" in open("web/app/fonts/OFL.txt", encoding="utf-8").read()
    assert "fonts.googleapis" not in CSS and "fonts.gstatic" not in CSS     # no third-party font requests


def _keys(lang):
    m = re.search(r"\n    %s: \{(.*?)\n    \}" % lang, I18N, re.S)
    return set(re.findall(r"\b([a-z0-9_]+): \"", m.group(1)))


def test_hindi_and_telugu_cover_the_same_keys_and_no_unknown_keys():
    en, hi, te = _keys("en"), _keys("hi"), _keys("te")
    assert hi == te, sorted(hi ^ te)
    assert hi <= en, sorted(hi - en)
    assert {"nav_map", "h1", "cta_explore", "v_mix", "v_mix_s", "trust_flags"} <= hi


def test_glossary_has_all_three_languages():
    gl = re.search(r"var GL = \{(.*?)\n  \};", I18N, re.S).group(1)
    terms = re.findall(r"\n    (\w+): \{ en: \[", gl)
    assert {"processed", "treated", "mohua", "cpcb", "flag", "notreported"} <= set(terms)
    assert gl.count(" hi: [") == len(terms) and gl.count(" te: [") == len(terms)


def test_wording_never_accuses_a_source():
    for f in ("web/app/i18n.js", "web/app/opening.js", "web/app/theme.css", "web/app/opening.css"):
        txt = open(f, encoding="utf-8").read().lower()
        assert "fraud" not in txt and "fake" not in txt, f
        assert not re.search(r"(is|are|was|were) wrong", txt), f


def test_start_page_counts_come_from_the_data_not_typed_in():
    js = open("web/app/opening.js", encoding="utf-8").read()
    about = open("web/app/about.js", encoding="utf-8").read()                  # the platform counts moved from Home to the About page
    for typed in ("697", "696", "36 states", "72 flags", "17,420", "114,110", "131,530"):
        assert typed not in js and typed not in about, typed
    assert "value_tpd != null" in js and "KS.flags.length" in about and "KS.receipts" in about


def _ramp(tk, prefix):
    return [tk["%s%d" % (prefix, i)] for i in range(1, 8)]


def test_map_ramps_run_in_one_direction_in_both_themes():
    dark = {**LIGHT, **DARK}
    for prefix, tk, darker_is_more in (("s", LIGHT, True), ("g", LIGHT, True), ("s", dark, False), ("g", dark, False)):
        lums = [lum(h) for h in _ramp(tk, prefix)]
        ordered = sorted(lums, reverse=darker_is_more)
        assert lums == ordered, (prefix, "light" if tk is LIGHT else "dark", [round(x, 3) for x in lums])
    stage = [lum(h) for h in _ramp(LIGHT, "d")]
    assert stage == sorted(stage)                                    # on the dark stage, brighter means more
    stage_g = [lum(h) for h in _ramp(LIGHT, "dg")]
    assert stage_g == sorted(stage_g)


def test_map_labels_are_readable_on_every_ramp_step():
    js = open("web/app/app.js", encoding="utf-8").read()
    assert "> .36" not in js and "> .179" in js                       # label colour is chosen at the contrast crossover, not a loose cut
    dark = {**LIGHT, **DARK}
    for tk in (LIGHT, dark):
        for prefix in ("s", "g", "d", "dg"):
            for hexv in _ramp(tk, prefix):
                ink = "#0b0b0b" if lum(hexv) > .179 else "#ffffff"
                assert ratio(ink, hexv) >= 4.5, (prefix, hexv, round(ratio(ink, hexv), 2))


def test_every_page_gets_a_level_one_heading_and_an_icon():
    js = open("web/app/app.js", encoding="utf-8").read()
    assert 'setAttribute("aria-level", "1")' in js and "pg-ic" in js
    html = open("web/app/index.html", encoding="utf-8").read()
    for sym in ("i-map", "i-claim", "i-gaps", "i-city", "i-ask", "i-explore", "i-ward", "i-help"):
        assert 'id="%s"' % sym in html, sym
