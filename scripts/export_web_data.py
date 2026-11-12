"""Export the CSV and JSON files the trust pages need into web/trust/data.js (one script tag, works from file:// too).

Run from repo root after the other scripts:  python scripts/export_web_data.py
Output: web/trust/data.js defining  window.KS = {waste, national, flags, volatility, audit, recurrence, crosswalk, receipts, ...}
Blank cells stay null (shown as "not reported" by the pages).
"""
import json
import os
import pandas as pd

def tbl(path, cols=None):
    d = pd.read_csv(path)
    if cols:
        d = d[cols]
    return json.loads(d.to_json(orient="records", force_ascii=False))

ks = {
    "built": pd.Timestamp.now().strftime("%Y-%m-%d"),
    "waste": tbl("data/waste_clean.csv", ["state", "year", "metric", "value_tpd", "source_name", "source_doc", "source_page", "note"]),
    "national": tbl("data/national_stated.csv", ["state", "year", "metric", "value", "unit", "source_name", "source_doc", "source_page", "note"]),
    "flags": tbl("data/flags.csv"),
    "volatility": tbl("data/volatility.csv"),
    "audit": tbl("data/audit_priority.csv"),
    "recurrence": tbl("data/recurrence.csv"),
    "crosswalk": tbl("data/definition_crosswalk.csv"),
    "statements": tbl("data/mohua_statements.csv"),
    "phantom": tbl("data/phantom_tonnes.csv"),
    "money": tbl("data/money_vs_mess.csv"),
    "indicators": tbl("data/state_indicators.csv"),
    "trucks": tbl("data/truck_priority.csv"),
    "segregation": tbl("data/national_segregation.csv"),
    "completeness": tbl("data/completeness.csv"),
    "receipts": json.load(open("receipts/index.json", encoding="utf-8")),
}
open(os.environ.get("KS_DATA_OUT", "web/trust/data.js"), "w", encoding="utf-8").write("window.KS = " + json.dumps(ks, ensure_ascii=False, separators=(",", ":")) + ";\n")
print({k: (len(v) if hasattr(v, "__len__") else v) for k, v in ks.items()})
