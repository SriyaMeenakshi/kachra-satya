"""The user-test summary never invents results (scripts/user_tests_summary.py)."""
import io
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import user_tests_summary as u  # noqa: E402


def test_no_file_means_zero_sessions():
    s = u.summarise(u.load("data/does_not_exist.csv"))
    assert s["sessions"] == 0 and not s["meets_minimum"]
    assert all(t["alone"] == t["hint"] == t["stuck"] == 0 for t in s["tasks"].values())
    assert s["notes"] == [] and s["would_use_again"] == {"yes": 0, "maybe": 0, "no": 0}


def test_template_is_empty_and_has_all_columns():
    t = pd.read_csv("data/user_tests_template.csv", dtype=str)
    assert len(t) == 0 and {"session_id", "task1", "task5", "confusion_notes", "would_use_again"} <= set(t.columns)


def test_counts_and_blanks_are_kept_blank():
    csv = io.StringIO("session_id,task1,task2,task3,task4,task5,confusion_notes,would_use_again\n"
                      "S01,alone,hint,stuck,alone,,did not see the page link,yes\n"
                      "S02,Alone,alone,,alone,hint,,maybe\n")
    s = u.summarise(pd.read_csv(csv, dtype=str))
    assert s["sessions"] == 2 and s["tasks"][1]["alone"] == 2
    assert s["tasks"][3] == {"label": "Your state", "alone": 0, "hint": 0, "stuck": 1, "not_attempted": 1}
    assert s["tasks"][5]["not_attempted"] == 1                  # a blank is "not attempted", not a result
    assert s["notes"] == ["did not see the page link"] and s["would_use_again"] == {"yes": 1, "maybe": 1, "no": 0}
