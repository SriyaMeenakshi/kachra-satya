"""The header Sign in button: hidden until the server says sign-in is on, loads Google only when opened, and every word has a Hindi and Telugu entry."""
import json
import re
import shutil
import subprocess

import pytest


def read(p):
    return open(p, encoding="utf-8").read()


def test_button_panel_and_footer_count_are_in_the_page_and_hidden_by_default():
    html = read("web/app/index.html")
    btn = re.search(r'<button[^>]*id="signin"[^>]*>', html).group(0)
    assert " hidden" in btn and 'aria-haspopup="dialog"' in btn and 'aria-expanded="false"' in btn and "aria-label=" in btn
    assert re.search(r'<div class="signin-pop" id="signin-pop" role="dialog"[^>]*hidden', html)
    assert re.search(r'<p class="signed-count" id="signed-count" hidden>', html)
    # it sits with the language and theme controls, in the header
    tools = html[html.index('<div class="tools">'):html.index("</header>")]
    assert tools.index('id="uilang"') < tools.index('id="signin"') < tools.index('id="theme"')
    assert html.index("account.js") < html.index("signin.js") and "signin.css" in html


def test_google_is_never_loaded_with_the_page_or_by_the_header_script():
    assert "accounts.google.com" not in read("web/app/index.html")
    assert "accounts.google.com" not in read("web/app/signin.js")                      # only KSAccount.button loads it, on demand
    assert read("web/app/signin.js").count("A.button(") == 1
    assert read("web/app/account.js").count("accounts.google.com/gsi/client") == 1


def test_header_button_stays_hidden_when_sign_in_is_off():
    js = read("web/app/signin.js")
    assert "if (!c || !c.signIn) return;" in js and "btn.hidden = false" in js
    assert "if (n > 0)" in js                                                          # the footer count is hidden while it is 0


def test_every_word_has_hindi_and_telugu():
    ui = read("web/app/i18n.js")
    for key in ("signin", "signedin"):
        assert len(re.findall(r"\b%s: \"" % key, ui)) == 3, key                       # English, Hindi and Telugu
    entries = read("web/app/i18n/75_signin.txt")
    js = read("web/app/signin.js") + read("web/app/ward.js")
    for english in ("Sign in with Google", "We store only an anonymous code, never your name or email.", "Everything else on this site works without signing in.",
                    "Signed in as", "Open Your ward", "Could not reach Google. Check your connection and try again."):
        assert "= " + english + "\n" in entries, english
        assert english in js, english                                                    # the entry is not stale
    assert "= Optional. Signing in lets you add your ward taps to a shared total, and counts you once as a person who used this site.\n" in entries
    assert "Optional. Signing in lets you add your ward taps to a shared total, and counts you once as a person who used this site." in js
    d = read("web/app/i18n_dict.js")
    for needle in ("# people have signed in with Google", "# person has signed in with Google"):
        assert needle in d, needle


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_footer_sentence_uses_singular_and_plural():
    code = ("global.window={};global.document={readyState:'complete',getElementById:()=>null,addEventListener(){}};"
            "require(process.cwd()+'/web/app/signin.js');var S=window.KSSignin;console.log(JSON.stringify([S.countText(1),S.countText(7)]))")
    out = subprocess.run(["node", "-e", code], capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    one, seven = json.loads(out.stdout)
    assert one.startswith("1 person has signed in with Google.") and seven.startswith("7 people have signed in with Google.")
    assert "not visits" in one and "anonymous codes" in seven


def test_the_ward_page_says_what_the_count_stores():
    ward = read("web/app/ward.js")
    assert "the day it first signed in" in ward and "counts sign-ins, not visits" in ward and "takes you out of the count" in ward
