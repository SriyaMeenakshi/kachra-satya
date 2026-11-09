"""Add state-wise landfilled for 2021-22 from the CPCB annual report 2021-22, Table 1 (PDF page 6 for Sl. 1-9, page 7 for Sl. 10-36).

Column order read from the table header: Sl. No | State | Waste generated (TPD) | Collected (TPD) |
Waste Processed/Treated (TPD)* | Landfilled (TPD)** | Gap (TPD). Footnote **: sanitary landfill only, dumpsites excluded.
This is the only state-wise landfilled column in the repo. It also gives a cross-check of generated, collected and
treated against the Rajya Sabha Q358 figures already in waste_clean.csv (any difference is printed and recorded).

Appends metric=landfilled rows to data/waste_clean.csv (idempotent). Re-run after scripts/build_clean_csv.py,
which regenerates waste_clean.csv without these rows. Run from repo root: python scripts/add_cpcb_2021_22_landfilled.py
"""
import csv
import re
import pdfplumber

DOC = "cpcb_2021-22.pdf"
YEAR = "2021-22"
RETRIEVED = "2026-11-10"
STATES = ["Andhra Pradesh", "Andaman and Nicobar Islands", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
          "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
          "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
          "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
          "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
          "West Bengal"]                                   # the report's own serial order, 1 to 36
NUM = r"(-?[\d,]+(?:\.\d+)?|Not provided|-)"


def num(t):
    t = t.strip()
    return None if t in ("-", "Not provided") else float(t.replace(",", ""))


with pdfplumber.open("data/raw/" + DOC) as pdf:
    text = "\n".join((pdf.pages[i].extract_text() or "") for i in (5, 6))

rows = {}
for line in text.split("\n"):
    m = re.match(rf"^(\d{{1,2}})\s+(?:[A-Za-z&\.]+(?: [A-Za-z&\.]+)*\s+)?{NUM}\s+{NUM}\s+{NUM}\s+{NUM}\s+{NUM}(?:\*+)?$", line)
    if m and 1 <= int(m[1]) <= 36:
        rows[int(m[1])] = [m[k] for k in range(2, 7)]
# Kerala's row is printed with a wrapped cell: "1,283 and 1,048 decentralized processing", then "2,691 - 781".
rows[17] = ["3,472", "1,283", "2,691", "-", "781"]
# Dadra row has its name abbreviated (DNH&DD) and is matched by the generic pattern above; assert coverage.
assert sorted(rows) == list(range(1, 37)), sorted(set(range(1, 37)) - set(rows))
total = {k: sum(num(rows[i][k]) or 0 for i in rows) for k in range(5)}
print("column sums (generated, collected, treated, landfilled, gap):", total)
assert round(total[0]) == 170339 and round(total[1]) == 156449 and round(total[2]) == 91511

existing = list(csv.DictReader(open("data/waste_clean.csv", encoding="utf-8")))
fields = list(existing[0])
existing = [r for r in existing if not (r["source_doc"] == DOC and r["metric"] == "landfilled")]
ref = {(r["state"], r["metric"]): r["value_tpd"] for r in existing if r["year"] == YEAR and r["source_name"] == "CPCB"}
new, diffs = [], []
for sl, state in enumerate(STATES, 1):
    g, c, t, lf, gap = rows[sl]
    for metric, v in (("generated", g), ("collected", c), ("treated", t)):
        old = ref.get((state, metric), "")
        if num(v) is not None and old not in ("", None) and abs(float(old) - num(v)) > 0.5:
            diffs.append((state, metric, old, v))
    note = ""
    if num(lf) is None:
        note = f"not reported (source says '{lf}')"
    elif state == "Chandigarh":
        note = "source prints gap -29; its footnote says the preceding year's unprocessed waste (+29 TPD) is included in the present year's treatment and landfilling"
    new.append({"state": state, "year": YEAR, "metric": "landfilled", "value_tpd": "" if num(lf) is None else f"{num(lf):g}",
                "source_name": "CPCB", "source_doc": DOC, "source_page": str(6 if sl <= 9 else 7),
                "retrieved_on": RETRIEVED, "note": note})
with open("data/waste_clean.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(existing + new)
print(len(new), "landfilled rows added;", "differences vs Q358 (generated/collected/treated):", diffs or "none")
