"""Guided paths (web/app/guide.js): every step and every "what next" link points at a page that exists; paths are short; text stays honest. Needs node."""
import json
import re
import shutil
import subprocess
import pytest

NODE = r"""
global.window = global; global.document = {readyState: 'complete', getElementById: () => null, addEventListener() {}};
require(process.cwd() + '/web/app/guide.js');
const G = global.KSGuide;
console.log(JSON.stringify({paths: G._PATHS, next: G._NEXT, s1: G._stepOf(G._PATHS.garbage, '#/help/escalate'), s2: G._stepOf(G._PATHS.claim, '#/explore/receipts/Kerala'), s3: G._stepOf(G._PATHS.claim, '#/gaps')}));
"""


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_guide_paths_point_at_real_pages():
    out = subprocess.run(["node", "-e", NODE], capture_output=True, text=True, check=True).stdout
    d = json.loads(out.strip().splitlines()[-1])
    app = open("web/app/app.js", encoding="utf-8").read()
    titles = set(re.findall(r"(\w+): \"", re.search(r"var TITLES = \{(.*?)\};", app, re.S).group(1)))
    routes = [s["route"] for p in d["paths"].values() for s in p["steps"]] + [r for n in d["next"].values() for r, _ in n]
    for r in routes:
        assert r.startswith("#/") and r[2:].split("/")[0] in titles, r
    assert all(2 <= len(p["steps"]) <= 4 for p in d["paths"].values())          # short paths: nobody is walked through a manual
    assert all(s["why"] and s["title"] for p in d["paths"].values() for s in p["steps"])
    assert d["s1"] == 2 and d["s2"] == 1 and d["s3"] == -1                       # prefix matching; off-path pages match nothing


def test_guide_wiring_and_safety():
    js = open("web/app/guide.js", encoding="utf-8").read()
    assert "obs.disconnect()" in js                                              # our own inserts must not re-trigger the observer (this once hung the page)
    assert "sessionStorage" in js and "catch (e)" in js                          # works if storage is blocked
    html = open("web/app/index.html", encoding="utf-8").read()
    assert "guide.js" in html and "guide.css" in html
    css = open("web/app/guide.css", encoding="utf-8").read()
    assert ".sr" in css and "@media print" in css
    op = open("web/app/opening.js", encoding="utf-8").read()
    assert "What brings you here?" in op and "KSGuide" in op
