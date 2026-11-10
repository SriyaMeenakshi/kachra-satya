"""Count the user-test sessions honestly (docs/user_tests.md).

Reads data/user_tests.csv (copy data/user_tests_template.csv and add one row per person).
Prints: sessions against the 20 to 30 target, per-task results (alone / hint / stuck / not attempted), closing answers, and the confusion notes.
It never invents a result: with no file, or no rows, it says 0 sessions.
Run from repo root: python scripts/user_tests_summary.py
"""
import os
import sys

import pandas as pd

TASKS = [f"task{i}" for i in range(1, 6)]
LABELS = {1: "Two numbers", 2: "Check a claim", 3: "Your state", 4: "Complaint", 5: "Ward and badge"}
TARGET = (20, 30)


def summarise(df):
    n = len(df)
    out = {"sessions": n, "target": TARGET, "meets_minimum": n >= TARGET[0], "tasks": {}, "would_use_again": {}, "notes": []}
    for i, t in enumerate(TASKS, 1):
        col = df[t].fillna("").astype(str).str.strip().str.lower() if t in df else pd.Series([""] * n)
        out["tasks"][i] = {"label": LABELS[i], "alone": int((col == "alone").sum()), "hint": int((col == "hint").sum()),
                           "stuck": int((col == "stuck").sum()), "not_attempted": int((col == "").sum())}
    c = df["would_use_again"].fillna("").astype(str).str.strip().str.lower() if "would_use_again" in df else pd.Series([""] * n)
    out["would_use_again"] = {k: int((c == k).sum()) for k in ("yes", "maybe", "no")}
    if "confusion_notes" in df:
        out["notes"] = [x.strip() for x in df["confusion_notes"].dropna().astype(str) if x.strip()]
    return out


def load(path="data/user_tests.csv"):
    if not os.path.exists(path):
        return pd.DataFrame(columns=["session_id"] + TASKS + ["confusion_notes", "would_use_again"])
    return pd.read_csv(path, dtype=str)


def show(s):
    lo, hi = s["target"]
    print(f"{s['sessions']} session(s) done; target {lo} to {hi}." + ("" if s["meets_minimum"] else f" Below the minimum of {lo}: report the real number."))
    for i, t in s["tasks"].items():
        print(f"  Task {i} ({t['label']}): alone {t['alone']}, hint {t['hint']}, stuck {t['stuck']}, not attempted {t['not_attempted']}")
    print("  Would use again:", s["would_use_again"])
    print(f"  Confusion notes: {len(s['notes'])}")
    for n in s["notes"]:
        print("   -", n)


if __name__ == "__main__":
    show(summarise(load(sys.argv[1] if len(sys.argv) > 1 else "data/user_tests.csv")))
