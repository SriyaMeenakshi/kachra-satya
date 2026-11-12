"""Extract the Dumpsite Remediation Accelerator Programme (DRAP) annexure: the 214 highest-impact legacy dumpsites, by state and urban local body.

Source: MoHUA, "Concept note on Dumpsite Remediation Accelerator Programme" (PIB, Nov 2025), annexure on pages 6 to 9.
Input : data/raw/mohua_drap_concept_note_2025-11.pdf
Output: data/dumpsites_drap.csv  (one row per urban local body; blank means the cell is not printed in the annexure, never filled in)

Numbers in the PDF are right-aligned in six columns and some carry stray spaces ("1 ,35,397"), so each number is rebuilt from the words whose right edge
falls in that column. Checks printed at the end: every printed row is captured (checked against the plain-text reading of the same pages) and the printed Grand Total is compared with the sum of the rows. The two differ: the annexure itemises 189 of its 214 dumpsites, and says nothing about the rest. The gap is recorded, not filled in.
Run from the repo root:  python scripts/extract_drap.py
"""
import csv
import os
import re
import sys
import pdfplumber

PDF = "data/raw/mohua_drap_concept_note_2025-11.pdf"
OUT = "data/dumpsites_drap.csv"
OUT_TOTAL = "data/dumpsites_drap_total.csv"
DOC = os.path.basename(PDF)
RETRIEVED = "2026-11-12"
PAGES = [6, 7, 8, 9]
BOUNDS = [255, 316, 390, 455, 510]          # right-edge x of the six numeric columns fall between these
COLS = ["dumpsites", "legacy_waste_tonnes", "waste_to_remediate_tonnes", "approved_legacy_waste_lmt", "approved_total_cost_cr", "approved_aca_cr"]
STATE_FIX = {"GUJRAT": "Gujarat", "DAMAN DIU AND DADRA NAGAR HAVELI": "Dadra and Nagar Haveli and Daman and Diu", "ORISSA": "Odisha", "JAMMU AND KASHMIR": "Jammu and Kashmir",
             "NCT OF DELHI": "Delhi", "PONDICHERRY": "Puducherry"}


def col_of(x1):
    for i, b in enumerate(BOUNDS):
        if x1 < b:
            return i
    return 5


def num(text):
    t = text.replace(",", "").replace(" ", "")
    if t in ("", "-", "–"):
        return None
    return float(t)


def norm_state(s):
    s = re.sub(r"\s+", " ", s).strip()
    if s.upper() in STATE_FIX:
        return STATE_FIX[s.upper()]
    return s.title().replace(" And ", " and ").replace(" Of ", " of ")


def lines_of(page):
    words = page.extract_words(x_tolerance=1.5)
    lines = []
    for w in sorted(words, key=lambda w: (w["top"], w["x0"])):
        if lines and abs(lines[-1]["top"] - w["top"]) <= 2:
            lines[-1]["w"].append(w)
        else:
            lines.append({"top": w["top"], "w": [w]})
    return lines


def parse():
    rows, state, state_as_printed, pending, anomalies, grand = [], None, None, "", [], None
    with pdfplumber.open(PDF) as pdf:
        for pno in PAGES:
            for ln in lines_of(pdf.pages[pno - 1]):
                if ln["top"] <= 90:                                   # the page header block
                    continue
                ws = sorted(ln["w"], key=lambda w: w["x0"])
                is_text = lambda w: re.search(r"\d", w["text"]) is None            # a word with no digit is part of a name, wherever it sits
                name_w = [w for w in ws if (w["x1"] < 232 and w["x0"] < 190) or (is_text(w) and w["text"] not in ("-", "–"))]
                num_w = [w for w in ws if w not in name_w]
                name = " ".join(w["text"] for w in name_w).strip()
                if not num_w:                                          # a text-only line: a state heading, a "Reserved" note, or a wrapped name
                    first_x = name_w[0]["x0"] if name_w else 0
                    if name.endswith("Reserved"):
                        s = name[: -len("Reserved")].strip()
                        rows.append(dict(state=norm_state(s), state_as_printed=s, ulb="", dumpsites=None, note="Annexure prints this state as Reserved, with no figures", page=pno))
                    elif first_x < 64:
                        state_as_printed = name; state = norm_state(name); pending = ""
                    else:
                        pending = (pending + " " + name).strip()
                    continue
                cells = {}
                for w in num_w:
                    cells.setdefault(col_of(w["x1"]), []).append(w)
                vals = {COLS[i]: num("".join(x["text"] for x in sorted(c, key=lambda x: x["x0"]))) for i, c in cells.items()}
                full = (pending + " " + name).strip(); pending = ""
                if full.lower().startswith("grand total"):
                    grand = vals; continue
                if not full:
                    anomalies.append(("no name", pno, round(ln["top"]), [w["text"] for w in ws])); continue
                row = dict(state=state, state_as_printed=state_as_printed, ulb=full, note="", page=pno)
                for c in COLS:
                    row[c] = vals.get(c)
                rows.append(row)
    return rows, grand, anomalies


def main():
    rows, grand, anomalies = parse()
    fields = ["state", "state_as_printed", "ulb"] + COLS + ["source_name", "source_doc", "source_page", "retrieved_on", "note"]
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        wr = csv.DictWriter(f, fieldnames=fields)
        wr.writeheader()
        for r in rows:
            wr.writerow({**{c: ("" if r.get(c) is None else (int(r[c]) if c in ("dumpsites", "legacy_waste_tonnes", "waste_to_remediate_tonnes") else r[c])) for c in COLS},
                         "state": r["state"], "state_as_printed": r["state_as_printed"], "ulb": r["ulb"], "source_name": "MoHUA", "source_doc": DOC,
                         "source_page": r["page"], "retrieved_on": RETRIEVED, "note": r["note"]})
    data = [r for r in rows if r["ulb"]]
    tot = lambda c: sum(r[c] for r in data if r.get(c) is not None)
    # independent cross-check: the plain-text reading of the same pages must show the same number of data lines (every printed row captured)
    text_lines = 0
    with pdfplumber.open(PDF) as pdf:
        for pno in PAGES:
            for l in pdf.pages[pno - 1].extract_text().split(chr(10))[4:]:
                if re.search(r"\d", l) and not l.startswith("Grand Total"):
                    text_lines += 1
    print("ULB rows:", len(data), "| data lines in the plain text:", text_lines, "| states:", len({r["state"] for r in data}), "| Reserved placeholders:", len(rows) - len(data))
    print("anomalies:", anomalies)
    sums = dict(dumpsites=tot("dumpsites"), legacy_waste_tonnes=tot("legacy_waste_tonnes"), waste_to_remediate_tonnes=tot("waste_to_remediate_tonnes"),
                approved_legacy_waste_lmt=round(tot("approved_legacy_waste_lmt"), 2), approved_total_cost_cr=round(tot("approved_total_cost_cr"), 2), approved_aca_cr=round(tot("approved_aca_cr"), 2))
    print("printed Grand Total:", grand)
    print("sum of the printed rows:", sums)
    gap = {k: round(grand[k] - sums[k], 2) for k in sums if grand.get(k) is not None}
    print("not itemised in the annexure (printed total minus rows):", gap)
    with open(OUT_TOTAL, "w", newline="", encoding="utf-8") as f:
        wr = csv.writer(f); wr.writerow(["metric", "printed_grand_total", "sum_of_printed_rows", "not_itemised", "source_doc", "source_page", "retrieved_on", "note"])
        for k in sums:
            wr.writerow([k, int(grand[k]) if float(grand[k]).is_integer() else grand[k], sums[k], gap[k], DOC, 9, RETRIEVED,
                         "Maharashtra and Bihar are printed as Reserved with no rows; the document does not say the difference is theirs" if k == "dumpsites" else ""])
    ok = anomalies == [] and len(data) == text_lines
    print("every printed row captured:", ok)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
