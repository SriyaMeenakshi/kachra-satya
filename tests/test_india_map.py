"""web/app/india.js: the simplified outlines match the dataset's 36 names and stay a sensible size."""
import json
import os
import pandas as pd


def test_india_outlines():
    js = open("web/app/india.js", encoding="utf-8").read()
    d = json.loads(js[len("window.KS_INDIA = "):].rstrip().rstrip(";"))
    ours = set(pd.read_csv("data/waste_clean.csv").state)
    assert set(d["states"]) == ours and len(ours) == 36
    assert all(s["d"].startswith("M") and s["d"].count("L") > 8 for s in d["states"].values())     # no state collapsed to a sliver
    assert all(len(s["c"]) == 2 for s in d["states"].values())
    vb = d["vb"]
    assert 25 < vb[2] < 32 and 28 < vb[3] < 35                          # about 28 by 31 degrees
    assert os.path.getsize("web/app/india.js") < 300_000
    assert "not an authoritative boundary" in d["source"].lower() or "Not an authoritative boundary" in d["source"]
