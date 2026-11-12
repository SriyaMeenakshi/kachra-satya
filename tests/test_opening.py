"""The opening page (web/app/opening.js, opening.css): structural checks that guard accessibility and honesty. No browser needed."""
import re


def test_opening_css_is_safe():
    css = open("web/app/opening.css", encoding="utf-8").read()
    assert "prefers-reduced-motion" in css                       # motion is switched off for people who ask
    assert css.count("@keyframes") == 1 and "@keyframes tick" in css   # only the ticker animates by keyframes
    assert ".receipt .ln.pre" in css and ".stamp.pre" in css       # content is visible by default; "pre" hides it only while printing
    assert "100vw" not in css and "50vw" not in css                # no full-bleed trick that causes horizontal scroll


def test_opening_js_is_honest():
    js = open("web/app/opening.js", encoding="utf-8").read()
    assert "setTimeout" in js and "4000" in js                     # fail-safe: everything forced visible after 4 s
    assert "The sources disagree" in js
    assert "wrong" not in re.search(r"var LBL = .*", js).group(0)   # verdict labels never say a source is wrong (the page may say "we don't say a figure is wrong")
    about = open("web/app/about.js", encoding="utf-8").read()
    assert "unverified" in about and "no shared server" in about   # the site admits street reports stay on the device and are unverified
    assert 'aria-hidden="true"><div class="tr">' in js            # the ticker is decorative
    assert re.search(r"KS\.national", js) and "KS.waste" in js     # numbers come from the data
    assert "Math.round(mp.value)" in js


def test_theme_layer_is_safe():
    css = open("web/app/theme.css", encoding="utf-8").read()
    assert "prefers-reduced-motion" in css and "@media print" in css       # the stamp tilt is removed for reduced motion and print
    assert "@keyframes" not in css and "100vw" not in css                   # no animation or overflow tricks
    html = open("web/app/index.html", encoding="utf-8").read()
    assert html.index("theme.css") > html.index("app.css")                  # loaded after app.css so it can adjust it
