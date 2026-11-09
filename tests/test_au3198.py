"""MoHUA Q3198 (21 Dec 2023) extraction: known values read from the annexure."""
import pandas as pd


def test_au3198_known_values():
    d = pd.read_csv("data/waste_mohua_2023-12.csv")
    v = lambda s, m: float(d[(d.state == s) & (d.metric == m)].value_tpd.iloc[0])
    assert d.state.nunique() == 35 and len(d) == 70
    assert v("Maharashtra", "generated") == 23563 and v("Maharashtra", "treated") == 22384.85
    assert v("Bihar", "treated") == 1365.51 and v("Ladakh", "treated") == 0
    assert v("Dadra and Nagar Haveli and Daman and Diu", "generated") == 60
    assert (d[d.metric == "treated"].value_tpd.values <= d[d.metric == "generated"].value_tpd.values).all()
