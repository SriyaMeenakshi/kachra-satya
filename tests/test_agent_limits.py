"""The Ask endpoint refuses bad input politely (400 or 429), never with a Python error, and limits how fast one visitor can ask.
No model key is set here, so the agent answers from its built-in fallback; nothing leaves the machine."""
import os
import sys

import pytest

pytest.importorskip("flask")
pytest.importorskip("flask_cors")
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from test_agent_serves_site import load_app


@pytest.fixture()
def agent(monkeypatch):
    for k in ("MODEL_PROVIDER", "MODEL_API_KEY"):
        monkeypatch.delenv(k, raising=False)
    mod = load_app("agent_app_limits")
    mod._hits.clear()
    return mod


def test_bad_input_is_a_400_not_a_500(agent):
    c = agent.app.test_client()
    for body in ({"question": 123}, {"question": None}, {"question": ["a"]}, {"question": "   "}, {}, [1, 2]):
        r = c.post("/ask", json=body)
        assert r.status_code == 400, body
        assert "Traceback" not in r.get_data(as_text=True) and "object has no attribute" not in r.get_data(as_text=True)
    r = c.post("/ask", data="not json", content_type="text/plain")          # was a 500 with Flask's own text
    assert r.status_code == 400


def test_long_question_is_refused(agent):
    r = agent.app.test_client().post("/ask", json={"question": "x" * (agent.MAX_QUESTION_CHARS + 1)})
    assert r.status_code == 400 and "too long" in r.get_json()["error"]


def test_a_normal_question_still_works(agent):
    r = agent.app.test_client().post("/ask", json={"question": "What is the biggest gap?", "language": "en"})
    assert r.status_code == 200 and r.get_json()["answer"]
    r = agent.app.test_client().post("/ask", json={"question": "hello", "language": 5})     # a wrong-typed language falls back to English
    assert r.status_code == 200


def test_rate_limit_per_visitor(agent, monkeypatch):
    monkeypatch.setattr(agent, "RATE_LIMIT_PER_MIN", 3)
    c = agent.app.test_client()
    codes = [c.post("/ask", json={"question": "hi"}, headers={"X-Forwarded-For": "1.2.3.4"}).status_code for _ in range(5)]
    assert codes == [200, 200, 200, 429, 429]
    other = c.post("/ask", json={"question": "hi"}, headers={"X-Forwarded-For": "5.6.7.8"})   # another visitor is not affected
    assert other.status_code == 200


def test_sources_come_from_what_the_tools_returned(agent):
    used = set()
    agent._note_docs('{"records": [{"source_doc": "mohua_81pct_answer.pdf", "source_page": 4}, {"source_doc": "ls_au50_2025-12-01.pdf"}], "x": {"source_doc": "cpcb_2023-24.pdf"}}', used)
    agent._note_docs("not json at all", used)                                   # a bad tool result must not break the answer
    assert used == {"mohua_81pct_answer.pdf", "ls_au50_2025-12-01.pdf", "cpcb_2023-24.pdf"}
    # model mode: only documents a tool returned, including .docx files the old text guess missed
    assert agent.extract_sources("The answer mentions CPCB and other.pdf", used) == [{"document": d} for d in sorted(used)]
    # no tool documents (fallback path): the old text heuristic still applies
    assert {"document": "CPCB"} in agent.extract_sources("CPCB says so", set())
