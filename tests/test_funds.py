"""Q682 funds extraction: known values read from the annexure table."""
import pandas as pd


def test_funds_known_rows():
    f = pd.read_csv("data/funds.csv").set_index("state")
    assert len(f) == 35
    assert f.loc["Delhi", "allocation_swm"] == 1152.6 and f.loc["Delhi", "funds_swm"] == 409.75
    assert f.loc["Bihar", "funds_swm"] == 2.86 and f.loc["Bihar", "allocation_total"] == 1204.8
    assert (f.funds_swm <= f.funds_total).all() and (f.allocation_swm <= f.allocation_total).all()
