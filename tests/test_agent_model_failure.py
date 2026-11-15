"""When the model fails, Ask says so honestly and /health says why (no key shown); an optional second Gemini model is tried once for temporary failures.
The Gemini call is replaced by a stand-in, so nothing leaves the machine."""
import os
import sys

import pytest

pytest.importorskip("flask")
pytest.importorskip("flask_cors")
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "agent"))   # the agent imports its sibling module accounts
from test_agent_serves_site import load_app

KEY = "secretkey123"


@pytest.fixture()
def agent(monkeypatch):
    for k in ("MODEL_PROVIDER", "MODEL_API_KEY", "GEMINI_FALLBACK_MODEL"):
        monkeypatch.delenv(k, raising=False)
    mod = load_app("agent_app_model_failure")
    mod.MODEL_PROVIDER, mod.MODEL_API_KEY = "gemini", KEY
    mod._hits.clear()
    mod._gemini_down_until = 0.0
    mod._last_model_error = None
    mod._last_model_ok = None
    return mod


def ask(mod, q="tell about andhra pradesh waste"):
    return mod.app.test_client().post("/ask", json={"question": q, "language": "en"}).get_json()


def health(mod):
    return mod.app.test_client().get("/health").get_json()


def test_health_keeps_its_old_fields_and_starts_clean(agent):
    h = health(agent)
    assert h["status"] == "ok" and h["model_provider"] == "gemini" and "timestamp" in h
    assert h["model"]["last_error"] is None and h["model"]["last_ok"] is None and h["model"]["in_cooldown"] is False


def test_failure_is_reported_without_the_key(agent, monkeypatch):
    def boom(question, model=None):
        raise RuntimeError(f"503 UNAVAILABLE. This model is currently experiencing high demand. key={KEY}\nmore text")
    monkeypatch.setattr(agent, "call_gemini_tool_use", boom)
    r = ask(agent)
    assert "AI model unavailable" in r["answer"]                          # the visitor is told it is data-only
    h = health(agent)["model"]
    assert h["in_cooldown"] is True and h["last_error"]["type"] == "RuntimeError"
    assert "503" in h["last_error"]["message"] and KEY not in str(h) and "\n" not in h["last_error"]["message"]
    assert len(h["last_error"]["message"]) <= 160


def test_a_second_model_is_tried_once_for_a_temporary_failure(agent, monkeypatch):
    calls = []

    def fake(question, model=None):
        calls.append(model)
        if model is None:
            raise RuntimeError("503 UNAVAILABLE high demand")
        return "Andhra Pradesh figures from the second model.", []
    monkeypatch.setattr(agent, "call_gemini_tool_use", fake)
    monkeypatch.setattr(agent, "GEMINI_FALLBACK_MODEL", "second-model")
    r = ask(agent)
    assert calls == [None, "second-model"]
    assert r["answer"] == "Andhra Pradesh figures from the second model."     # no data-only note: the model did answer
    h = health(agent)["model"]
    assert h["in_cooldown"] is False and h["last_ok"] and h["last_error"]["message"].startswith("503") and h["fallback_model"] == "second-model"


def test_both_models_failing_falls_back_to_data_only(agent, monkeypatch):
    calls = []

    def fake(question, model=None):
        calls.append(model)
        raise RuntimeError("429 RESOURCE_EXHAUSTED quota")
    monkeypatch.setattr(agent, "call_gemini_tool_use", fake)
    monkeypatch.setattr(agent, "GEMINI_FALLBACK_MODEL", "second-model")
    r = ask(agent)
    assert calls == [None, "second-model"] and "AI model unavailable" in r["answer"]
    h = health(agent)["model"]
    assert h["in_cooldown"] is True and h["last_error"]["provider"] == "gemini (fallback model)"
    assert len(calls) == 2
    ask(agent)                                                             # in cooldown now: no more model calls
    assert len(calls) == 2


def test_a_wrong_key_or_model_name_is_not_retried(agent, monkeypatch):
    calls = []

    def fake(question, model=None):
        calls.append(model)
        raise RuntimeError("400 INVALID_ARGUMENT. API key not valid. Please pass a valid API key.")
    monkeypatch.setattr(agent, "call_gemini_tool_use", fake)
    monkeypatch.setattr(agent, "GEMINI_FALLBACK_MODEL", "second-model")
    ask(agent)
    assert calls == [None]                                                 # another model cannot fix a bad key


def test_no_fallback_model_means_one_call(agent, monkeypatch):
    calls = []

    def fake(question, model=None):
        calls.append(model)
        raise RuntimeError("503 UNAVAILABLE")
    monkeypatch.setattr(agent, "call_gemini_tool_use", fake)
    ask(agent)
    assert calls == [None]
