"""Receipts: for every figure in waste_clean.csv and national_stated.csv, find where it sits on its cited PDF page.

Outputs (repo root):
  receipts/pages/<doc>_p<page>.png   one image per cited PDF page (rendered at 110 dpi)
  receipts/index.json                {key: {image, page, bbox, status, ...}} for the web app to draw a highlight
key = "state|year|metric|source_doc" (national rows use state "India").
bbox = [x0, y0, x1, y1] as fractions of page width/height (0 to 1, origin top left) around the value on the page.
status: located | page_only (value is on the page but its row could not be pinned down) | no_page_image (Word copy or blank value)
Honest by design: a figure whose row cannot be matched is reported page_only, never given a guessed box.
Run from repo root: python scripts/make_receipts.py
"""
import io
import json
import os
import re
import pandas as pd
import pdfplumber

RAW, OUT = "data/raw/", "receipts/"
DPI = 110


def open_pdf(doc):
    """Some CPCB files arrive wrapped in a small HTML shell (see SOURCES.md): open from the first %PDF byte."""
    data = open(RAW + doc, "rb").read()
    return pdfplumber.open(io.BytesIO(data[max(data.find(b"%PDF"), 0):]))


def norm(t):
    t = t.replace(",", "").strip()
    return t.rstrip("0").rstrip(".") if "." in t else t


def first_token(state):
    return {"Andaman and Nicobar Islands": "Andaman", "Dadra and Nagar Haveli and Daman and Diu": "Dadra",
            "Jammu and Kashmir": "Jammu", "India": "TOTAL"}.get(state, state.split()[0])


def locate(page, state, value):
    """Return (bbox_pts or None, status) for the cell with this value on the row of this state."""
    words = page.extract_words(keep_blank_chars=False, use_text_flow=False)
    v = norm(value)
    cands = [w for w in words if norm(re.sub(r"[^\d.,]", "", w["text"]) or "x") == v]
    if not cands:
        return None, "not_found"
    tok = first_token(state).lower()
    anchors = [w for w in words if w["text"].lower().startswith(tok[:5])]
    if len(cands) == 1 and not anchors:
        return cands[0], "page_only"
    best, bd = None, 1e9
    for c in cands:
        for a in anchors:
            d = abs(((c["top"] + c["bottom"]) / 2) - ((a["top"] + a["bottom"]) / 2))
            if d < bd:
                best, bd = c, d
    if best is not None and bd < 14:          # within about one table row of the state name
        return best, "located"
    return (cands[0], "page_only") if len(cands) == 1 else (None, "page_only")


def main():
    w = pd.read_csv("data/waste_clean.csv")
    n = pd.read_csv("data/national_stated.csv")
    rows = [(r.state, r.year, r.metric, r.value_tpd, r.source_doc, r.source_page) for r in w.itertuples()]
    rows += [("India", r.year, r.metric, r.value, r.source_doc, r.source_page) for r in n.itertuples()]
    os.makedirs(OUT + "pages", exist_ok=True)
    index, opened, rendered = {}, {}, set()
    for state, year, metric, value, doc, page in rows:
        key = f"{state}|{year}|{metric}|{doc}"
        if pd.isna(value) or not str(doc).endswith(".pdf") or not str(page).strip().isdigit():
            index[key] = {"image": None, "page": None if pd.isna(page) else str(page), "bbox": None, "status": "no_page_image"}
            continue
        page = int(page)
        if doc not in opened:
            opened[doc] = open_pdf(doc)
        pg = opened[doc].pages[page - 1]
        img = f"pages/{os.path.splitext(doc)[0]}_p{page}.png"
        if (doc, page) not in rendered:
            pg.to_image(resolution=DPI).save(OUT + img)
            rendered.add((doc, page))
        box, status = locate(pg, state, f"{value:g}" if isinstance(value, float) else str(value))
        entry = {"image": img, "page": page, "status": status if box else "page_only", "bbox": None}
        if box and status == "located":
            entry["bbox"] = [round(box["x0"] / pg.width, 4), round(box["top"] / pg.height, 4),
                             round(box["x1"] / pg.width, 4), round(box["bottom"] / pg.height, 4)]
        elif status == "not_found":
            entry["status"] = "page_only"
        index[key] = entry
    json.dump(index, open(OUT + "index.json", "w", encoding="utf-8"), indent=1)
    c = pd.Series([v["status"] for v in index.values()]).value_counts().to_dict()
    print(len(index), "figures;", c, "; page images:", len(rendered))


if __name__ == "__main__":
    main()
