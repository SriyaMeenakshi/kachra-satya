"""Money-vs-mess and volatility outputs."""
import pandas as pd


def test_money_vs_mess():
    d = pd.read_csv("data/money_vs_mess.csv").set_index("state")
    assert len(d) == 35
    assert d.loc["Bihar", "swm_utilisation_pct"] == 0.8 and d.loc["Bihar", "quadrant"] == "slow_money_low_treatment"
    assert round(d.loc["Delhi", "swm_utilisation_pct"], 1) == round(409.75 / 1152.6 * 100, 1)


def test_volatility():
    d = pd.read_csv("data/volatility.csv")
    top = d.iloc[0]
    assert top.state == "Nagaland" and top.swing_ratio == 22.9 and top["rank"] == 1   # 664 (CPCB 2021-22) vs 29 (MoHUA 2025-26)
    k = d[d.state == "Kerala"].iloc[0]
    assert k.max_tpd == 3543 and k.min_tpd == 1253
