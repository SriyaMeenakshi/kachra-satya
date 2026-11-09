"""Build data/waste_clean.csv from the raw parliamentary answers in data/raw/.

Run from the repo root:  python scripts/build_clean_csv.py
Needs: pip install pdfplumber

Outputs
  data/waste_clean.csv       one row per state, year, metric, source
  data/national_stated.csv   national totals and percentages as stated in the documents
  data/reconciliation.csv    sum of state rows vs the stated national total, per table

Nothing is filled in. A value the source does not give stays blank and the note says why.
"""
import csv
import re
from collections import defaultdict
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
RETRIEVED = "2026-11-09"

# Canonical state names ("and", not "&"). Orders below follow the order printed in each table.
AP, AN, AR, AS, BR = "Andhra Pradesh", "Andaman and Nicobar Islands", "Arunachal Pradesh", "Assam", "Bihar"
CH, CG, DD, DL = "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi"
GA, GJ, HR, HP, JK = "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir"
JH, KA, KL, LA, LD = "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep"
MP, MH, MN, ML, MZ = "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram"
NL, OD, PY, PB, RJ = "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan"
SK, TN, TG, TR, UP, UK, WB = "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"

ORDER_36 = [AP, AN, AR, AS, BR, CH, CG, DD, DL, GA, GJ, HR, HP, JK, JH, KA, KL, LA, LD, MP, MH, MN, ML, MZ,
            NL, OD, PY, PB, RJ, SK, TN, TG, TR, UP, UK, WB]
ORDER_35_OLD = [AP, AR, AS, BR, CG, GA, GJ, HR, HP, JK, JH, KA, KL, MP, MH, MN, ML, MZ, NL, OD, PB, RJ, SK,
                TN, TG, TR, UK, UP, WB, AN, CH, DD, DL, LD, PY]
ORDER_35_MOHUA = [AP, AN, AR, AS, BR, CH, CG, DD, DL, GA, GJ, HR, HP, JK, JH, KA, KL, LA, MP, MH, MN, ML, MZ,
                  NL, OD, PY, PB, RJ, SK, TN, TG, TR, UP, UK, WB]

TOKEN = re.compile(r"Not provided|Not|Yes|\d[\d,]*(?:\.\d+)?|Nil|(?<=\s)-(?=\s|$)", re.I)


def parse_value(tok):
    """Return (value or None, note)."""
    t = tok.strip()
    if re.fullmatch(r"\d[\d,]*(?:\.\d+)?", t):
        return float(t.replace(",", "")), ""
    if t.lower() == "not":  # "Not provided" wrapped over two lines in the PDF text
        t = "Not provided"
    if t.lower() == "nil":
        return 0.0, "reported as Nil"
    return None, f"not reported (source says '{t}')"


def serial_lines(text):
    """Yield (serial, rest_of_line) for lines that start with a serial number."""
    for line in text.splitlines():
        m = re.match(r"^(\d{1,2})\s+(.*)$", line.strip())
        if m:
            yield int(m.group(1)), m.group(2)


def numbers_after_name(rest, want):
    """Pull the value tokens off a table line, skipping the (possibly wrapped) state name."""
    m = re.search(r"(?:(?<=\s)|^)(Not provided|Not|Yes|Nil|-|\d)", rest, re.I)
    if not m:
        return []
    toks = TOKEN.findall(" " + rest[m.start():])
    return toks[:want] if len(toks) >= want else toks


def extract_table(pdf, pages, order, want, stop_before=None):
    """Return {state: [tok, ...]} and {state: page} for one table spread over the given pages."""
    out, page_of = {}, {}
    for pno in pages:
        text = pdf.pages[pno - 1].extract_text() or ""
        if stop_before:
            idx = text.find(stop_before)
            if idx != -1:
                text = text[:idx]
        for serial, rest in serial_lines(text):
            if 1 <= serial <= len(order):
                toks = numbers_after_name(rest, want)
                if toks and order[serial - 1] not in out:
                    out[order[serial - 1]] = toks
                    page_of[order[serial - 1]] = pno
    return out, page_of


rows, national, recon = [], [], []


def add_rows(table, pages_of, year, metrics, source_name, source_doc, extra_notes):
    sums = defaultdict(float)
    for state, toks in table.items():
        if len(toks) != len(metrics):
            raise SystemExit(f"{source_doc} {year} {state}: expected {len(metrics)} values, got {toks}")
        for metric, tok in zip(metrics, toks):
            val, note = parse_value(tok)
            extra = extra_notes.get((state, metric), "")
            note = "; ".join(x for x in (note, extra) if x)
            rows.append([state, year, metric, "" if val is None else f"{val:.6f}".rstrip("0").rstrip("."), source_name, source_doc,
                         pages_of[state], RETRIEVED, note])
            if val is not None:
                sums[metric] += val
    return sums


def reconcile(year, source_doc, sums, stated):
    for metric, stated_val in stated.items():
        got = sums.get(metric, 0.0)
        recon.append([year, source_doc, metric, f"{got:.2f}", f"{stated_val:g}",
                      f"{got - stated_val:.2f}", "match" if abs(got - stated_val) < 0.5 else "MISMATCH"])


# ---- CPCB 2023-24 via Lok Sabha AU 50, 1 Dec 2025 (pdf pages 3-4) --------------------------------------------
doc = "ls_au50_2025-12-01.pdf"
with pdfplumber.open(RAW / doc) as pdf:
    t, pg = extract_table(pdf, [3, 4], ORDER_36, 3, stop_before="* legacy")
    # The PDF text prints Andaman and Nicobar's values on a line above its name; read them off the page text.
    p3 = pdf.pages[2].extract_text()
    m = re.search(r"^77\.3 77\.3 72\.22$", p3, re.M)
    assert m, "A&N Island values not found where expected"
    t[AN] = ["77.3", "77.3", "72.22"]
    pg[AN] = 3
notes = {(MN, "treated"): "source footnote: legacy waste has been accounted",
         (AN, "generated"): "values are printed above the state name in the PDF text layer",
         (AP, "generated"): "generated, collected and treated are identical in source",
         (PY, "generated"): "generated, collected and treated are identical in source",
         (TR, "generated"): "generated, collected and treated are identical in source",
         (LD, "generated"): "generated, collected and treated are identical in source"}
s = add_rows(t, pg, "2023-24", ["generated", "collected", "treated"], "CPCB", doc, notes)
reconcile("2023-24", doc, s, {"generated": 185195, "collected": 179479, "treated": 114110})

# ---- CPCB 2017-18 to 2021-22 via Rajya Sabha Q358, 6 Feb 2025 ------------------------------------------------
doc = "rs_q358_2025-02-06.pdf"
with pdfplumber.open(RAW / doc) as pdf:
    t, pg = extract_table(pdf, [3, 4], ORDER_36, 3, stop_before="TOTAL")
    notes = {(KL, "collected"): "source also reports 1,048 TPD decentralized processing in this cell",
             (BR, "collected"): "", (BR, "treated"): ""}
    s = add_rows(t, pg, "2021-22", ["generated", "collected", "treated"], "CPCB", doc, notes)
    reconcile("2021-22", doc, s, {"generated": 170339, "collected": 156449, "treated": 91511})

    t, pg = extract_table(pdf, [4, 5], ORDER_35_OLD, 3, stop_before="TOTAL")
    # page 4 also holds the end of the 2021-22 table (serials 29-36); keep only the 2020-21 block
    p4 = pdf.pages[3].extract_text()
    t, pg = {}, {}
    for pno, marker in ((4, "2020-21"), (5, None)):
        text = pdf.pages[pno - 1].extract_text()
        if marker:
            text = text[text.index(marker):]
        text = text.split("TOTAL")[0] if marker is None else text
        for serial, rest in serial_lines(text):
            if 1 <= serial <= 35:
                toks = numbers_after_name(rest, 3)
                name = ORDER_35_OLD[serial - 1]
                if toks and name not in t:
                    t[name], pg[name] = toks, pno
    notes = {(AR, "treated"): "datagov copy shows NA; Rajya Sabha PDF says Nil"}
    s = add_rows(t, pg, "2020-21", ["generated", "collected", "treated"], "CPCB", doc, notes)
    reconcile("2020-21", doc, s, {"generated": 160038.9, "collected": 152749.5, "treated": 79956.3})

    t, pg = {}, {}
    for pno, marker in ((5, "2019-20"), (6, None)):
        text = pdf.pages[pno - 1].extract_text()
        if marker:
            text = text[text.index(marker):]
        else:
            text = text.split("2018-19")[0]
        text = text.split("TOTAL")[0]
        for serial, rest in serial_lines(text):
            if 1 <= serial <= 35:
                toks = numbers_after_name(rest, 3)
                name = ORDER_35_OLD[serial - 1]
                if toks and name not in t:
                    t[name], pg[name] = toks, pno
    s = add_rows(t, pg, "2019-20", ["generated", "collected", "treated"], "CPCB", doc, {})
    reconcile("2019-20", doc, s, {"generated": 150847.1, "collected": 146053.8, "treated": 70973.2})

# ---- MoHUA 2025-26 via Rajya Sabha Q2433, 10 Aug 2026 (pdf page 3) -------------------------------------------
doc = "mohua_81pct_answer.pdf"
with pdfplumber.open(RAW / doc) as pdf:
    t, pg = extract_table(pdf, [3], ORDER_35_MOHUA, 2, stop_before="Total 162")
notes = {(LA, "generated"): "reported as 0 in source; Ladakh has non-zero values in CPCB tables",
         (LA, "treated"): "reported as 0 in source",
         (MZ, "generated"): "reported as 0 in source; Mizoram has non-zero values in CPCB tables",
         (MZ, "treated"): "reported as 0 in source"}
s = add_rows(t, pg, "2025-26", ["generated", "treated"], "MoHUA", doc, notes)
reconcile("2025-26", doc, s, {"generated": 162372, "treated": 131530})
for r in rows:
    if r[5] == doc and r[2] == "treated":
        r[8] = "; ".join(x for x in (r[8], "MoHUA column 'Total Waste Processed' mapped to treated") if x)

# ---- National figures as stated (not derived) ---------------------------------------------------------------
N = [  # year, metric, value, unit, source_name, source_doc, page, note
    ("2023-24", "generated", 185195, "tpd", "CPCB", "ls_au50_2025-12-01.pdf", 1, ""),
    ("2023-24", "collected", 179479, "tpd", "CPCB", "ls_au50_2025-12-01.pdf", 1, ""),
    ("2023-24", "treated", 114110, "tpd", "CPCB", "ls_au50_2025-12-01.pdf", 1, ""),
    ("2023-24", "landfilled", 39629, "tpd", "CPCB", "ls_au50_2025-12-01.pdf", 1, ""),
    ("2022-23", "generated", 170939, "tpd", "CPCB", "cpcb_2024-25.pdf", 66, "report page 54"),
    ("2022-23", "collected", 164621, "tpd", "CPCB", "cpcb_2024-25.pdf", 66, "report page 54"),
    ("2022-23", "treated", 104216, "tpd", "CPCB", "cpcb_2024-25.pdf", 66, "report page 54"),
    ("2022-23", "landfilled", 38147, "tpd", "CPCB", "cpcb_2024-25.pdf", 66, "report page 54"),
    ("2022-23", "unaccounted", 28576, "tpd", "CPCB", "cpcb_2024-25.pdf", 66, "report page 54"),
    ("2021-22", "generated", 170339, "tpd", "CPCB", "cpcb_2023-24.pdf", 69, "report page 59; same figures in rs_q358 p4"),
    ("2021-22", "collected", 156449, "tpd", "CPCB", "cpcb_2023-24.pdf", 69, "report page 59"),
    ("2021-22", "treated", 91511, "tpd", "CPCB", "cpcb_2023-24.pdf", 69, "report page 59"),
    ("2021-22", "landfilled", 41455, "tpd", "CPCB", "cpcb_2023-24.pdf", 69, "report page 59"),
    ("2021-22", "unaccounted", 37373, "tpd", "CPCB", "cpcb_2023-24.pdf", 69, "report page 59"),
    ("2020-21", "generated", 160038.9, "tpd", "CPCB", "rs_q358_2025-02-06.pdf", 5, ""),
    ("2020-21", "collected", 152749.5, "tpd", "CPCB", "rs_q358_2025-02-06.pdf", 5, ""),
    ("2020-21", "treated", 79956.3, "tpd", "CPCB", "rs_q358_2025-02-06.pdf", 5, ""),
    ("2019-20", "generated", 150847.1, "tpd", "CPCB", "rs_q358_2025-02-06.pdf", 6, ""),
    ("2019-20", "collected", 146053.8, "tpd", "CPCB", "rs_q358_2025-02-06.pdf", 6, ""),
    ("2019-20", "treated", 70973.2, "tpd", "CPCB", "rs_q358_2025-02-06.pdf", 6, ""),
    ("2025-26", "generated", 162372, "tpd", "MoHUA", "mohua_81pct_answer.pdf", 3, ""),
    ("2025-26", "treated", 131530, "tpd", "MoHUA", "mohua_81pct_answer.pdf", 3, "'Total Waste Processed'"),
    ("2024-25", "generated", 161163, "tpd", "MoHUA", "mohua_state_answer.pdf", 2, "RS Q855, 28 Jul 2025; as reported by States/UTs"),
    ("2024-25", "treated", 128842, "tpd", "MoHUA", "mohua_state_answer.pdf", 2, "stated as 80.26% processed"),
    ("2024-25", "processed_pct", 80.26, "percent", "MoHUA", "mohua_state_answer.pdf", 2, "stated"),
    ("2021-22", "processed_pct", 73, "percent", "MoHUA", "mohua_81pct_answer.pdf", 4, "Swachhattam portal MIS"),
    ("2022-23", "processed_pct", 76, "percent", "MoHUA", "mohua_81pct_answer.pdf", 4, "Swachhattam portal MIS"),
    ("2023-24", "processed_pct", 78, "percent", "MoHUA", "mohua_81pct_answer.pdf", 4, "Swachhattam portal MIS"),
    ("2024-25", "processed_pct", 81, "percent", "MoHUA", "mohua_81pct_answer.pdf", 4, "Swachhattam portal MIS"),
    ("2025-26", "processed_pct", 81, "percent", "MoHUA", "mohua_81pct_answer.pdf", 4, "Swachhattam portal MIS"),
    ("2024-25", "processed_pct", 67, "percent", "MoHUA", "mohua_81pct_answer.pdf", 2, "Swachh Survekshan 2024-25 national average, a different measure"),
]
for y, m, v, u, sn, sd, p, n in N:
    national.append(["India", y, m, v, u, sn, sd, p, RETRIEVED, n])

# ---- Write ---------------------------------------------------------------------------------------------------
rows.sort(key=lambda r: (r[1], r[0], r[2]))
with open(ROOT / "data" / "waste_clean.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["state", "year", "metric", "value_tpd", "source_name", "source_doc", "source_page", "retrieved_on", "note"])
    w.writerows(rows)
with open(ROOT / "data" / "national_stated.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["state", "year", "metric", "value", "unit", "source_name", "source_doc", "source_page", "retrieved_on", "note"])
    w.writerows(national)
with open(ROOT / "data" / "reconciliation.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f)
    w.writerow(["year", "source_doc", "metric", "sum_of_states", "stated_total", "difference", "result"])
    w.writerows(recon)

print(f"{len(rows)} state rows written")
for r in recon:
    print(r)
