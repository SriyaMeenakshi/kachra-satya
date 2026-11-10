"""Score a human spot-check file downloaded from web/trust/spotcheck.html and append it to data/human_spot_check.csv.

The page shows ten cells (fixed seed) and the checker types the number they read. This script re-checks each typed value against
data/waste_clean.csv itself (it does not trust the page's own match column), prints the match rate, and records it so SOURCES.md can say how many cells a
person checked. It never edits waste_clean.csv: a mismatch is a prompt to look at the source page together, not an automatic correction.

Usage (repo root):  python scripts/score_human_spot_check.py path/to/human_spot_check_<name>.csv
"""
import csv
import os
import sys

import pandas as pd


def norm(t):
    t = str(t).replace(",", "").strip().lower()
    try:
        f = float(t)
        return str(int(f)) if f == int(f) else repr(f).rstrip("0")
    except ValueError:
        return t


def score(path):
    w = pd.read_csv("data/waste_clean.csv")
    stored = {(r.state, r.year, r.metric, r.source_doc): r.value_tpd for r in w.itertuples()}
    rows = list(csv.DictReader(open(path, encoding="utf-8")))
    out = []
    for r in rows:
        key = (r["state"], r["year"], r["metric"], r["source_doc"])
        v = stored.get(key)
        ok = v is not None and not pd.isna(v) and norm(r["value_read_by_human"]) == norm(v)
        out.append({**r, "rescored_match": "yes" if ok else "no"})
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    out = score(sys.argv[1])
    yes = sum(r["rescored_match"] == "yes" for r in out)
    print(f"{yes} of {len(out)} cells match (checker: {out[0]['checker'] if out else 'n/a'}, date: {out[0]['date'] if out else 'n/a'})")
    for r in out:
        if r["rescored_match"] == "no":
            print("  look at:", r["state"], r["year"], r["metric"], r["source_doc"], "page", r["page"], "stored", r["stored_value"], "read", r["value_read_by_human"])
    dest = "data/human_spot_check.csv"
    exists = os.path.exists(dest)
    with open(dest, "a", newline="", encoding="utf-8") as f:
        wr = csv.DictWriter(f, fieldnames=list(out[0]))
        if not exists:
            wr.writeheader()
        wr.writerows(out)
    print("appended to", dest)


if __name__ == "__main__":
    main()
