"""Add the CPCB 2022-23 state table (Annual Report 2022-23, Table 1) to data/waste_clean.csv.

Source: data/raw/cpcb_2022-23.pdf, Table 1 "Overall Solid Waste Management Status", PDF page 6 (Sl. 1-7) and page 7 (Sl. 8-36).
Column order read from the table header: Sl. No | State | Generated (TPD) | Collected (TPD) | Treated (TPD) | Landfilled (TPD) | Gap (TPD).
The report prints 0 where it elsewhere says Nil; 0 is stored with a note. The Gap column is not stored (not one of the project metrics).
Column sums must match the report's printed total row (170,939 / 164,621 / 104,216 / 38,147 / 28,576) to within 0.6 TPD of rounding, or the script stops.
Idempotent. Re-run after scripts/build_clean_csv.py, which regenerates waste_clean.csv without these rows.
Run from repo root: python scripts/add_cpcb_2022_23.py
"""
import csv
import re
import pdfplumber

DOC, YEAR, RETRIEVED = "cpcb_2022-23.pdf", "2022-23", "2026-11-10"
STATES = ["Andhra Pradesh", "Andaman and Nicobar Islands", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
          "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
          "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
          "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
          "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
          "West Bengal"]                                     # the report's serial order, 1 to 36
N = r"(\d[\d.]*)"
LINE = re.compile(rf"^(\d{{1,2}})\s+(?:[A-Za-z&\.]+(?: [A-Za-z&\.]+)*\s+)?{N}\s+{N}\s+{N}\s+{N}\s+{N}$")

with pdfplumber.open("data/raw/" + DOC) as pdf:
    text = "\n".join(pdf.pages[i].extract_text() or "" for i in (5, 6))
rows = {}
for line in text.split("\n"):
    m = LINE.match(line.strip())
    if m and 1 <= int(m[1]) <= 36:
        rows[int(m[1])] = [m[k] for k in range(2, 7)]      # keep the printed text, never reformat a number
assert sorted(rows) == list(range(1, 37)), sorted(set(range(1, 37)) - set(rows))
sums = [round(sum(float(rows[i][k]) for i in rows), 1) for k in range(5)]
print("column sums (generated, collected, treated, landfilled, gap):", sums)
TOTAL = [170939, 164621, 104216, 38147, 28576]
assert all(abs(a - b) <= 0.6 for a, b in zip(sums, TOTAL)), "column sums differ from the report's total row by more than rounding"

existing = list(csv.DictReader(open("data/waste_clean.csv", encoding="utf-8")))
fields = list(existing[0])
existing = [r for r in existing if r["source_doc"] != DOC]
new = []
for sl, state in enumerate(STATES, 1):
    g, c, t, lf, _gap = rows[sl]
    for metric, v in (("generated", g), ("collected", c), ("treated", t), ("landfilled", lf)):
        note = "printed as 0 in the report (it calls these states Nil in the landfilling text)" if metric == "landfilled" and float(v) == 0 else ""
        new.append({"state": state, "year": YEAR, "metric": metric, "value_tpd": v, "source_name": "CPCB",
                    "source_doc": DOC, "source_page": 6 if sl <= 7 else 7, "retrieved_on": RETRIEVED, "note": note})
with open("data/waste_clean.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(existing + new)
print(len(new), "rows added")
