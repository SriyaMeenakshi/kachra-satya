"""The Q&A agent's data-only fallback (agent/app.py, no model key): the six run-sheet questions must give the answers the real tools give, not just contain the right keywords.
Compares each answer with docs/agentfoundry_run_sheet.md. Skipped when the agent's web dependencies are not installed."""
import importlib.util
import os

import pytest

pytest.importorskip("flask")
pytest.importorskip("flask_cors")
pytest.importorskip("pandas")

os.environ["MODEL_PROVIDER"] = ""
os.environ["MODEL_API_KEY"] = ""
_spec = importlib.util.spec_from_file_location("agent_app", os.path.join("agent", "app.py"))
agent = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(agent)


def ask(q, lang="en"):
    return agent.call_fallback_tools_only(q, lang)


def test_kerala_treated_above_collected_in_four_years_same_source_only():
    a, s = ask("Kerala treated vs collected")
    assert a.count("treated is above collected") == 4                  # 2019-20 to 2022-23, as the data says (not three)
    for y in ("2019-20", "2020-21", "2021-22", "2022-23"):
        assert y in a
    assert "1,837.0 vs collected 880.0" in a and "3,231.0 vs collected 2,096.19" in a
    assert "does not say which figure to trust" in a
    assert "mohua" not in a.lower()                                      # a MoHUA figure is never set against a CPCB one here
    assert {d["document"] for d in s} <= {"rs_q358_2025-02-06.pdf", "cpcb_2022-23.pdf", "ls_au50_2025-12-01.pdf"}


def test_bihar_blank_is_not_reported_with_the_source_note_and_no_unit():
    a, s = ask("Bihar treated waste 2019-20", "hi")
    assert "not reported (source says 'Not Provided')" in a and "tpd." not in a.split("\n")[1]
    assert s == [{"document": "rs_q358_2025-02-06.pdf"}]


def test_tamil_nadu_generated_has_figure_source_and_page():
    a, s = ask("Tamil Nadu generated 2023-24", "ta")
    assert "17,843.455 tpd" in a and "ls_au50_2025-12-01.pdf" in a and "3" in a


def test_gap_ranking_shows_real_numbers_and_the_different_years_caveat():
    a, s = ask("Which states have the largest CPCB vs MoHUA gap?", "te")
    assert "None" not in a
    assert "Chandigarh: gap 77.5 points" in a and "Jammu and Kashmir: gap 67.4" in a and "Punjab: gap 51.6" in a
    assert "different years" in a and s


def test_landfilled_not_in_data_then_found_for_2021_22():
    a, _ = ask("Maharashtra landfilled 2023-24")
    assert "Not in the data" in a
    a, s = ask("Maharashtra landfilled 2021-22")
    assert "2,067.0 tpd" in a and "cpcb_2021-22.pdf" in a and "page 7" in a


def test_claim_check_lists_who_agrees_and_who_does_not_without_accusing():
    a, s = ask("A minister said 81% of India's waste is processed. Is that true?")
    assert "SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS" in a
    assert "4 source figures match this claim and 10 do not" in a and "The sources disagree" in a
    assert "mohua_81pct_answer.pdf, page 4" in a and "different years" in a
    assert "Matches: 0" not in a and "wrong" not in a.lower() and "lying" not in a.lower()
    assert any(d["document"] == "mohua_81pct_answer.pdf" for d in s)
