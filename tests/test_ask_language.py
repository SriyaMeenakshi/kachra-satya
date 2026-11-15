"""Ask: the language chosen on the page reaches the AI model, so the answer comes back in that language whatever the question was typed in."""
import os
import sys

import pytest

pytest.importorskip("flask")
pytest.importorskip("flask_cors")
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from test_agent_serves_site import load_app


def test_hindi_tamil_and_telugu_are_asked_for_by_name():
    app = load_app("ask_lang_app")
    for code, name in (("hi", "Hindi"), ("ta", "Tamil"), ("te", "Telugu"), ("te-IN", "Telugu")):
        out = app.with_language("How much waste does Kerala treat?", code)
        assert out.startswith("How much waste does Kerala treat?") and "in " + name in out and "exactly as it appears" in out


def test_english_or_unknown_languages_leave_the_question_alone():
    app = load_app("ask_lang_app")
    for code in ("en", "", "fr", None):
        assert app.with_language("Kerala?", code) == "Kerala?"


def test_the_model_call_receives_the_language_instruction(monkeypatch):
    app = load_app("ask_lang_app")
    seen = []
    monkeypatch.setattr(app, "MODEL_PROVIDER", "gemini")
    monkeypatch.setattr(app, "MODEL_API_KEY", "k")
    monkeypatch.setattr(app, "_gemini_down_until", 0)
    monkeypatch.setattr(app, "_rate_limited", lambda v: False)
    monkeypatch.setattr(app, "call_gemini_tool_use", lambda q, model=None: (seen.append(q) or ("ok", [])))
    r = app.app.test_client().post("/ask", json={"question": "Kerala?", "language": "te"})
    assert r.status_code == 200 and "Telugu" in seen[0]
