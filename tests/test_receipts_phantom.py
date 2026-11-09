"""Receipts index and phantom-tonnes counters."""
import json
import os
import pandas as pd


def test_receipts_index():
    idx = json.load(open("receipts/index.json", encoding="utf-8"))
    k = "Maharashtra|2022-23|landfilled|cpcb_2022-23.pdf"
    e = idx[k]
    assert e["status"] == "located" and e["page"] == 7 and os.path.exists("receipts/" + e["image"])
    assert all(0 <= x <= 1 for x in e["bbox"]) and e["bbox"][0] < e["bbox"][2] and e["bbox"][1] < e["bbox"][3]
    assert idx["Delhi|2023-24|treated|ls_au50_2025-12-01.pdf"]["status"] == "located"
    # Word copies have no page image and say so
    assert idx.get("Delhi|2023-24|generated|ls_au50_2025-12-01.pdf") is not None
    assert sum(v["status"] == "located" for v in idx.values()) > 550


def test_phantom_tonnes():
    d = pd.read_csv("data/phantom_tonnes.csv")
    nat = d[(d.counter == "D_national_treated_sources") & (d.year == "MoHUA 2025-26 vs CPCB 2023-24")].tpd.iloc[0]
    assert nat == 17420
    st = d[d.counter == "E_state_treated_sources"].tpd.sum()
    assert abs(st - nat) < 30                      # state split adds up to the national difference, within source rounding
    k = d[(d.counter == "A_treated_above_collected") & (d.scope == "Kerala") & (d.year == "2020-21")].tpd.iloc[0]
    assert k == 1585.24
