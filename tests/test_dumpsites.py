"""The legacy-dumpsite data: extracted from MoHUA's public DRAP annexure, kept honest about what it does not itemise. No figure is invented."""
import csv
import os
import re
import pytest

ROOT = os.path.join(os.path.dirname(__file__), "..")


def rows(name):
    return list(csv.DictReader(open(os.path.join(ROOT, "data", name), encoding="utf-8")))


def f(x):
    return float(x) if x not in ("", None) else None


def test_drap_rows_match_the_printed_pages():
    d = rows("dumpsites_drap.csv")
    ulb = [r for r in d if r["ulb"]]
    assert len(ulb) == 179 and len({r["state"] for r in ulb}) == 30
    by = {r["ulb"]: r for r in ulb}
    c = by["CHITTOOR"]
    assert (c["state"], c["dumpsites"], c["legacy_waste_tonnes"], c["waste_to_remediate_tonnes"], c["approved_legacy_waste_lmt"], c["approved_total_cost_cr"], c["approved_aca_cr"]) == ("Andhra Pradesh", "1", "135397", "133897", "1.35", "7.45", "2.46")
    dl = by["MUNICIPAL CORPORATION OF DELHI"]                       # stray spaces in the PDF ("1 93.75", "1 ,395.63") must not split the numbers
    assert (dl["dumpsites"], dl["legacy_waste_tonnes"], dl["waste_to_remediate_tonnes"], dl["approved_legacy_waste_lmt"], dl["approved_total_cost_cr"], dl["approved_aca_cr"]) == ("2", "15800000", "6712000", "193.75", "1395.63", "1116.5")
    b = by["BRUHAT BENGALURU MAHANAGARA PALIKE"]
    assert (b["dumpsites"], b["legacy_waste_tonnes"]) == ("5", "9782000")
    a = by["DIBRUGARH MC"]                                          # the annexure prints nothing for the last three columns: they stay blank
    assert a["legacy_waste_tonnes"] == "80000" and a["approved_total_cost_cr"] == "" and a["approved_aca_cr"] == ""
    assert all(r["source_doc"] == "mohua_drap_concept_note_2025-11.pdf" and 6 <= int(r["source_page"]) <= 9 and r["retrieved_on"] for r in d)
    res = [r for r in d if not r["ulb"]]
    assert {r["state"] for r in res} == {"Maharashtra", "Bihar"} and all(r["dumpsites"] == "" and "Reserved" in r["note"] for r in res)


def test_itemised_sums_and_the_printed_total_are_both_kept_and_never_forced():
    d = [r for r in rows("dumpsites_drap.csv") if r["ulb"]]
    t = {r["metric"]: r for r in rows("dumpsites_drap_total.csv")}
    s = lambda c: sum(f(r[c]) for r in d if f(r[c]) is not None)
    assert s("dumpsites") == 189 and s("legacy_waste_tonnes") == 90037487 and s("waste_to_remediate_tonnes") == 61327444
    assert float(t["dumpsites"]["printed_grand_total"]) == 214 and float(t["legacy_waste_tonnes"]["printed_grand_total"]) == 130273139
    for m, r in t.items():
        assert abs(float(r["printed_grand_total"]) - float(r["sum_of_printed_rows"]) - float(r["not_itemised"])) < 0.011, m      # the gap is printed total minus rows, exactly
    assert float(t["dumpsites"]["not_itemised"]) == 25 and "Reserved" in t["dumpsites"]["note"]
    assert all(r["source_page"] == "9" for r in t.values())


def test_the_pdf_really_says_these_things():
    pdfplumber = pytest.importorskip("pdfplumber")
    path = os.path.join(ROOT, "data", "raw", "mohua_drap_concept_note_2025-11.pdf")
    with pdfplumber.open(path) as pdf:
        last = pdf.pages[8].extract_text()
        first = pdf.pages[0].extract_text().replace(chr(10), " ")
        n = sum(1 for p in (5, 6, 7, 8) for ln in pdf.pages[p].extract_text().split(chr(10))[4:] if re.search(r"\d", ln) and not ln.startswith("Grand Total"))
    assert "Grand Total 214" in last and "13,02,73,139" in last and "Maharashtra Reserved" in last and "Bihar Reserved" in last
    assert "1,048 out of 2476 dumpsites" in first and "7,580 acres" in first
    assert n == 179                                                                    # every printed data line is in our CSV


def test_national_statements_are_exact_and_sourced():
    n = rows("dumpsites_national.csv")
    assert all(os.path.exists(os.path.join(ROOT, "data", "raw", r["source_doc"])) and r["source_page"] and r["retrieved_on"] for r in n)
    g = lambda date, metric: [r for r in n if r["statement_date"] == date and r["metric"] == metric][0]
    q = "2024-11-28"
    assert [g(q, m)["value"] for m in ("dumpsites_identified", "dumpsites_remediated_completely", "dumpsites_in_progress")] == ["2417", "641", "1144"]
    assert g(q, "legacy_waste_identified")["value"] == "24.88" and g(q, "land_reclaimed")["value"] == "5694.86" and "(51%)" in g(q, "legacy_waste_remediated")["note"]
    c = "2025-11"
    assert [g(c, m)["value"] for m in ("dumpsites_identified", "dumpsites_remediated_completely", "dumpsites_in_progress", "priority_dumpsites")] == ["2476", "1048", "1428", "214"]
    assert g(c, "legacy_waste_remediated")["value"] == "14.33" and g(c, "land_reclaimed")["value"] == "7580"
    assert "50%" in g("2025-11-08", "land_reclaimed")["note"]                          # the FAQ's different wording is kept, not merged


def test_landfill_tab_shows_dumpsites_honestly():
    app = open(os.path.join(ROOT, "web", "app", "app.js"), encoding="utf-8").read()
    for s in ("function dumpsites()", "The 214 priority dumpsites, by state", "The same list, city by city", "The other 25 priority sites", "not printed", "do not read the difference as a precise rate of progress"):
        assert s in app, s
    assert "dumpsites" in open(os.path.join(ROOT, "scripts", "export_web_data.py"), encoding="utf-8").read()
