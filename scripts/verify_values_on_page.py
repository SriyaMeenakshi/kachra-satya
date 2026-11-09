"""Independent check: every waste_clean.csv value must appear as a token on its cited PDF page.

This is a weaker test than a human reading the row (it does not tie a number to its state),
so it complements, not replaces, data/spot_check.csv. Run: python scripts/verify_values_on_page.py
"""
import csv, re, sys
import pdfplumber

RAW = "data/raw/"
rows = list(csv.DictReader(open("data/waste_clean.csv", encoding="utf-8")))
cache = {}

def tokens(doc, page):
    k = (doc, page)
    if k not in cache:
        with pdfplumber.open(RAW + doc) as pdf:
            txt = pdf.pages[page - 1].extract_text() or ""
        cache[k] = set(re.findall(r"\d[\d,]*\.?\d*", txt.replace(" ", " ")))
    return cache[k]

def norm(t):
    t = t.replace(",", "")
    return t.rstrip("0").rstrip(".") if "." in t else t

def present(value, toks):
    v = norm(value)
    return any(norm(t) == v for t in toks)

checked = miss = skipped = 0
misses = []
for r in rows:
    if r["value_tpd"] == "":
        skipped += 1
        continue
    if not r["source_doc"].endswith(".pdf"):
        skipped += 1
        continue
    checked += 1
    try:
        ok = present(r["value_tpd"], tokens(r["source_doc"], int(r["source_page"])))
    except Exception as e:
        ok = False
    if not ok:
        miss += 1
        misses.append(r)
print(f"rows={len(rows)} checked={checked} blank_or_nonpdf={skipped} value_not_found_on_page={miss}")
for r in misses:
    print(r["state"], r["year"], r["metric"], r["value_tpd"], r["source_doc"], "p", r["source_page"])
sys.exit(1 if miss else 0)
