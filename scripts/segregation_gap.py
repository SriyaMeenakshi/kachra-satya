"""National segregation indicators from the GFC 2022 dashboard snapshot (data/raw/sbm_gfc2022_dashboard_snapshot.txt).

Output: data/national_segregation.csv with the figures exactly as printed, plus ratios computed against the stated base.
Bases: wards figures are divided by the 25,726 wards covered; ULB figures by the 1,228 ULBs covered. The page does not say
that every indicator is measured on all covered units, so the computed shares are labelled "computed" and are indicative.
The page is national and for 2022 only ("on the basis of on field validation"); there is no state-wise table.
Run from repo root: python scripts/segregation_gap.py
"""
import csv
import re

txt = open("data/raw/sbm_gfc2022_dashboard_snapshot.txt", encoding="utf-8").read()
cov_ulbs = int(re.search(r"([\d,]+)\s*\nULBs", txt)[1].replace(",", ""))
cov_wards = int(re.search(r"([\d,]+)\s*\nWards", txt)[1].replace(",", ""))
rows = []
status = txt.split("STATUS OF SWACHHATA IN URBAN INDIA - 2022*\n")[1]
for m in re.finditer(r"^([\d,]+) (Wards|Cities|ULBs)\n(.+)$", status, flags=re.M):
    n, unit, label = int(m[1].replace(",", "")), m[2], m[3].strip()
    base = cov_wards if unit == "Wards" else cov_ulbs if unit == "ULBs" else cov_ulbs     # cities: the page does not state a base; ULBs shown for scale
    comp = round(n / base * 100, 1) if unit != "Cities" else ""
    rows.append(dict(indicator=label, count=n, unit=unit, base_stated=base if unit != "Cities" else "", share_pct_computed=comp,
                     year="2022", source_name="MoHUA", source_doc="sbm_gfc2022_dashboard_snapshot.txt",
                     source_url="https://sbmurban.org/gfc-result-dashboard", retrieved_on="2026-11-10",
                     note="on the basis of on field validation; national only" + ("; no base stated for cities, share not computed" if unit == "Cities" else "")))
with open("data/national_segregation.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)
for r in rows:
    print(r["indicator"], r["count"], r["unit"], r["share_pct_computed"])
