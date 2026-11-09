"""CPCB 2022-23 Table 1: known values, exact printed decimals and national sums."""
import pandas as pd


def test_cpcb_2022_23():
    w = pd.read_csv("data/waste_clean.csv")
    d = w[(w.year == "2022-23") & (w.source_name == "CPCB")]
    v = lambda s, m: float(d[(d.state == s) & (d.metric == m)].value_tpd.iloc[0])
    assert d.state.nunique() == 36 and len(d) == 144
    assert v("Maharashtra", "generated") == 23448.46 and v("Rajasthan", "landfilled") == 4828.763
    assert v("Kerala", "treated") == 3231 and v("Kerala", "collected") == 2096.19
    for m, total in (("generated", 170939), ("collected", 164621), ("treated", 104216), ("landfilled", 38147)):
        assert abs(d[d.metric == m].value_tpd.sum() - total) <= 0.6
