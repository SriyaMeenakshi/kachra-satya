"""Licence files agree; the web data file matches the CSVs; scripts are deferred; the anonymous summary holds counts only."""
import json
import os
import re
import shutil
import subprocess
import sys
import pytest


def read(p):
    return open(p, encoding="utf-8").read()


def test_licence_is_mit_everywhere():
    assert read("LICENSE").startswith("MIT License")
    assert re.search(r'^license:\s*"MIT"', read("CITATION.cff"), re.M)
    assert json.loads(read(".zenodo.json"))["license"] == "mit"
    assert "Code and our compiled data are MIT" in read("README.md")
    assert "CC-BY" not in read("CITATION.cff") and "cc-by" not in read(".zenodo.json")


def test_web_data_file_matches_the_csvs(tmp_path):
    """web/trust/data.js is built from the CSVs by scripts/export_web_data.py; the live site must not serve stale figures."""
    out = tmp_path / "data.js"
    env = dict(os.environ, KS_DATA_OUT=str(out), PYTHONIOENCODING="utf-8")
    subprocess.run([sys.executable, "scripts/export_web_data.py"], check=True, capture_output=True, env=env)
    strip = lambda s: re.sub(r'"built":"[^"]*"', '"built":"x"', s.replace("\r\n", "\n"))
    assert strip(read(str(out))) == strip(read("web/trust/data.js")), "run: python scripts/export_web_data.py and commit web/trust/data.js"


def test_scripts_are_deferred_and_new_icons_exist():
    html = read("web/app/index.html")
    tags = re.findall(r"<script\b[^>]*>", html)
    assert tags and all(" defer" in t for t in tags if "src=" in t)
    for icon in ("i-brief", "i-school"):
        assert f'id="{icon}"' in html and f'href="#{icon}"' in html


@pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")
def test_anonymous_summary_is_counts_only():
    js = r"""global.window={};require(process.cwd()+'/web/trust/data.js');require(process.cwd()+'/web/app/saathi.js');
const t=window.KSSaathi._summary([{status:'Open',area:'Secret Lane',city:'Hyderabad'},{status:'Resolved',area:'X',city:'Y'}],[{status:'not_collected'},{status:'collected'},{status:'not_collected'}],'2026-11-12');
console.log(JSON.stringify(t))"""
    t = json.loads(subprocess.run(["node", "-e", js], capture_output=True, text=True, encoding="utf-8", check=True).stdout.strip().splitlines()[-1])
    assert "complaints logged 2 (open 1, resolved 1)" in t and "ward days tapped 3 (truck did not come 2)" in t
    assert "Secret" not in t and "Hyderabad" not in t                       # no names, places or text


def test_loading_screen_and_demo_notice_are_wired_and_safe():
    html = read("web/app/index.html")
    assert 'id="splash"' in html and 'href="splash.css"' in html and 'src="splash.js" defer' in html
    assert "<noscript><style>#splash{display:none}</style></noscript>" in html            # never covers a visitor without JavaScript
    css = read("web/app/splash.css")
    assert "animation:sp-away .01s 8s forwards" in css and "prefers-reduced-motion" in css  # CSS removes it even if the script fails
    js = read("web/app/splash.js")
    assert 'role="dialog"' in js and 'aria-modal="true"' in js and "Escape" in js and "This site is for demonstration" in js
    assert "not an official government site" in js and "sessionStorage" in js               # honest wording; works when storage is blocked


def test_plain_document_names_and_honest_counts_and_render_rebuilds_data():
    app = read("web/app/app.js")
    assert "KSAnswer.docName" in app and app.count("dn(") >= 4                              # file names are shown as document names
    from_answer = read("web/app/answer.js")
    for doc in ("ls_au682_2024-11-28.docx", "mohua_annual_report_2025-26.pdf", "sbm_gfc2022_dashboard_snapshot.txt"):
        assert doc in from_answer
    op = read("web/app/opening.js")
    assert "with the number boxed" in op and "KS.receipts[k].bbox" in op                    # 696 open on a page vs 605 boxed: both said, neither inflated
    assert "the Housing Ministry, MoHUA" in op and "pollution control board, CPCB" in op     # acronyms explained once, in the hero
    assert "scripts/export_web_data.py && python scripts/build_site.py" in read("render.yaml")
