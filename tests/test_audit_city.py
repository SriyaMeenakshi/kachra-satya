"""City audit rules on a clearly fictional fixture (tests/fixtures/city_FICTIONAL_example.csv). No real city data."""
import os
import sys
import pandas as pd
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from audit_city import audit


def test_city_rules_and_ranking():
    flags, rank = audit(pd.read_csv("tests/fixtures/city_FICTIONAL_example.csv"))
    r = flags.groupby("rule").size().to_dict()
    assert r == {"C1_collected_gt_generated": 1, "C2_segregated_gt_collected": 1, "C3_treated_gt_collected": 1,
                 "C4_treated_plus_landfilled_gt_generated": 2, "C5_metric_missing": 1}, r
    assert rank.iloc[0].ward == "Ward B" and rank.iloc[0].uncollected_tpd_avg == 8   # only its 2024-01 row has both values; Ward C also trips C4 (treated 9 > generated 8)
    assert "Ward C" in set(rank.ward)


def test_template_headers():
    assert open("data/city_audit_template.csv").readline().strip().split(",") == [
        "ulb", "ward", "period", "generated_tpd", "collected_tpd", "segregated_tpd", "treated_tpd", "landfilled_tpd", "notes"]
