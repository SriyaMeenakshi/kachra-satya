"""Extract the Q682 annexure (state-wise SBM-U 2.0 allocation and funds) to data/funds.csv.

Source: data/raw/ls_au682_2024-11-28.docx (Word copy of Lok Sabha Unstarred Q682, 28 Nov 2024).
Column order was read from the table header, not assumed:
  1 Mission Allocation 2021-2026: Total | 2 Mission Allocation: SWM component |
  3 Funds utilized/released till 25.11.2024: SWM component | 4 Funds ...: Total
The table prints no unit. Other parts of the same reply give money in Rs crore, so the unit column says
"not stated in table" and the note records this. Run from repo root: python scripts/extract_funds.py
"""
import csv
import docx

SRC = "ls_au682_2024-11-28.docx"
RETRIEVED = "2026-11-10"
NAMES = {"A&N Islands": "Andaman and Nicobar Islands"}   # every other "&" becomes "and"

t = docx.Document("data/raw/" + SRC).tables[0]
assert [c.text.strip() for c in t.rows[1].cells][:2] == ["State/UT", "Total"]
rows = []
for r in t.rows[2:]:
    c = [x.text.strip() for x in r.cells]
    name = " ".join(c[0].split())
    name = NAMES.get(name, name.replace(" & ", " and "))
    rows.append({"state": name, "allocation_total": c[1], "allocation_swm": c[2], "funds_swm": c[3], "funds_total": c[4],
                 "unit": "not stated in table",
                 "source_name": "MoHUA", "source_doc": SRC, "source_page": "Annexure (Word copy, no page number)",
                 "retrieved_on": RETRIEVED,
                 "note": "allocation is 2021-2026; funds utilized/released till 25.11.2024; the reply text gives other sums in Rs crore"})
with open("data/funds.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)
print(len(rows), "states written")
