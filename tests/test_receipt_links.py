"""Every number links to its receipt: the headline figures and the swing table open their source pages (web/app/app.js)."""
import json
import re

JS = open("web/app/app.js", encoding="utf-8").read()
_d = open("web/trust/data.js", encoding="utf-8").read()
KS = json.loads(_d[_d.index("=") + 1:].rstrip().rstrip(";"))


def test_map_headline_figures_have_source_page_buttons():
    assert 'rbtn("India|2025-26|treated|" + mt.source_doc, "source page")' in JS
    assert 'rbtn("India|2023-24|treated|" + ct.source_doc, "source page")' in JS


def test_swing_table_lowest_and_highest_open_their_pages():
    assert "genKey(r.state, r.min_in)" in JS and "genKey(r.state, r.max_in)" in JS


def test_the_receipts_those_buttons_need_exist_for_the_top_swing():
    top = [r for r in KS["volatility"] if r["ranked"] == "yes"][0]
    for tag in (top["min_in"], top["max_in"]):
        year, src = tag.split(" ")[:2]
        rows = [x for x in KS["waste"] if x["state"] == top["state"] and x["year"] == year and x["source_name"] == src and x["metric"] == "generated"]
        assert rows, tag
        assert KS["receipts"][re.sub(r"\s+", " ", "|".join([top["state"], year, "generated", rows[0]["source_doc"]]))]["image"], tag
