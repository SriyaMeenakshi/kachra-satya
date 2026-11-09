"""Extract the state table from Lok Sabha Unstarred Q3198 (21 Dec 2023, MoHUA, "Waste Processing Rates").

Source: data/raw/ls_au3198_2023-12-21.docx. The Word copy is a PDF conversion: the annexure table is a set of
positioned text boxes, not a Word table, so cells are rebuilt from their x/y position:
  x < 1.1M = Sl. No | x about 1.4M = State/UT | 4.1M-4.5M = Waste Generation (in TPD) | x > 5.7M = Waste Processed (in TPD)
Column headers read from the file: "Waste Generation (in TPD)", "Waste Processed (in TPD)".
The reply says "as on date" and gives no financial year, so year = "as on 21-12-2023" (the reply date), not a FY.
Output: data/waste_mohua_2023-12.csv, same columns as waste_clean.csv. "Processed" is stored as treated, as in waste_clean.csv.
Run from repo root: python scripts/extract_au3198.py
"""
import csv, html, re, zipfile

SRC = "ls_au3198_2023-12-21.docx"
YEAR = "as on 21-12-2023"
CANON = {"A&N Islands": "Andaman and Nicobar Islands", "Ladakh UT": "Ladakh",
         "Dadra Nagar Haveli and Daman & Diu": "Dadra and Nagar Haveli and Daman and Diu"}

x = zipfile.ZipFile("data/raw/" + SRC).read("word/document.xml").decode("utf8")
text = re.sub(r"<[^>]+>", " ", re.sub(r"</w:p>", "\n", x))
items = []
for line in text.split("\n"):
    m = re.match(r"\s*(\d+)\s+(\d+)\s+(.*)$", line)
    if m:
        items.append((int(m[1]), int(m[2]), html.unescape(m[3]).strip()))
start = [k for k, i in enumerate(items) if i[2].startswith("(in TPD)")][-1]
body = [i for i in items[start + 1:] if not i[2].startswith(("(Source", "*"))]

sl = sorted([(y, t) for a, y, t in body if a < 1_100_000 and t.isdigit()])
names = sorted([(y, t) for a, y, t in body if 1_300_000 < a < 1_500_000])
gen = {y: t for a, y, t in body if 4_100_000 < a < 4_600_000}
pro = {y: t for a, y, t in body if a > 5_700_000}
assert len(sl) == 35 and len(gen) == 35 and len(pro) == 35, (len(sl), len(gen), len(pro))

# assign every name text box to its nearest row (the Dadra row wraps over two lines, above and below the row y)
by_row = {y: [] for y, _ in sl}
for ny, t in names:
    by_row[min(by_row, key=lambda ry: abs(ry - ny))].append((ny, t))
rows = []
for y, n in sl:
    name = " ".join(t for _, t in sorted(by_row[y]))
    name = CANON.get(name, name)
    for metric, val in (("generated", gen[y]), ("treated", pro[y])):
        rows.append({"state": name, "year": YEAR, "metric": metric, "value_tpd": val.replace(",", ""),
                     "source_name": "MoHUA", "source_doc": SRC, "source_page": "Annexure (Word copy, page 3 of the reply)",
                     "retrieved_on": "2026-11-10",
                     "note": "MoHUA 'Waste Processed' stored as treated; reply gives no financial year (says 'as on date'); "
                             "source line: Reports by ULBs on Swachhatam Portal, of MoHUA" if metric == "treated" else
                             "reply gives no financial year (says 'as on date')"})
with open("data/waste_mohua_2023-12.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)
print(len(rows) // 2, "states,", len(rows), "rows")
