"""State indicators, truck priority and national segregation indicators."""
import pandas as pd


def test_state_indicators():
    o = pd.read_csv("data/state_indicators.csv")
    p = o[(o.state == "Puducherry") & (o.year == "2022-23")].iloc[0]
    assert p.landfill_pct == 84.8                       # the CPCB report text says Puducherry (85%)
    h = pd.read_csv("data/truck_priority.csv").iloc[0]
    assert h.state == "Haryana" and h["rank"] == 1 and round(h.uncollected_tpd) == 2413


def test_segregation_gap():
    s = pd.read_csv("data/national_segregation.csv").set_index("indicator")
    assert s.loc[">90% D2D Collection", "count"] == 22180 and s.loc[">90% Source Segregation", "count"] == 9031
    assert s.loc[">90% Source Segregation", "share_pct_computed"] == 35.1
