"""CPCB 2021-22 Table 1 landfilled column: known values and column sums."""
import pandas as pd


def test_landfilled_2021_22():
    w = pd.read_csv("data/waste_clean.csv")
    lf = w[(w.metric == "landfilled") & (w.year == "2021-22")].set_index("state")
    assert len(lf) == 36
    assert lf.loc["Maharashtra", "value_tpd"] == 2067 and lf.loc["Delhi", "value_tpd"] == 5828
    assert pd.isna(lf.loc["Bihar", "value_tpd"]) and "not reported" in lf.loc["Bihar", "note"]
    assert round(lf.value_tpd.sum()) == 41455          # report total
