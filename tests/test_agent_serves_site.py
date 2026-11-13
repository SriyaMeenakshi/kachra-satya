"""One-service hosting: the Flask agent also serves the built website (agent/app.py, SERVE_SITE).

Builds dist/ with scripts/build_site.py, then drives the Flask app with its test client.
Skipped if Flask or the agent's other dependencies are not installed."""
import importlib.util
import os
import shutil
import subprocess
import sys

import pytest

pytest.importorskip("flask")
pytest.importorskip("flask_cors")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DIST = os.path.join(ROOT, "dist")


def load_app(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, "agent", "app.py"))
    mod = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(mod)
    except ImportError as e:                                    # e.g. the model client libraries are not installed
        pytest.skip(f"agent dependencies missing: {e}")
    return mod


@pytest.fixture(scope="module")
def built():
    existed = os.path.isdir(DIST)
    subprocess.run([sys.executable, "scripts/build_site.py"], cwd=ROOT, check=True, capture_output=True, timeout=120)
    yield
    if not existed:
        shutil.rmtree(DIST, ignore_errors=True)


@pytest.fixture()
def client(built, monkeypatch):
    monkeypatch.delenv("SERVE_SITE", raising=False)
    monkeypatch.delenv("MODEL_API_KEY", raising=False)           # fallback mode: lookup tools only, no model call
    return load_app("kachra_agent_app_on").app.test_client()


def test_site_pages_are_served(client):
    for path in ["/", "/web/app/index.html", "/web/app/app.js", "/web/trust/data.js", "/receipts/NOTICE.md"]:
        assert client.get(path).status_code == 200, path
    assert b"TrashTally" in client.get("/web/app/index.html").data


def test_config_points_the_ask_page_at_the_same_server(client):
    r = client.get("/web/app/config.js")
    assert r.status_code == 200 and "javascript" in r.content_type
    assert b'agentEndpoint: "/ask"' in r.data


def test_only_dist_is_published(client):
    for path in ["/data/waste_clean.csv", "/data/raw/ls_au50_2025-12-01.pdf", "/agent/app.py", "/.env", "/scripts/build_site.py"]:
        assert client.get(path).status_code == 404, path
    assert client.get("/../data/waste_clean.csv").status_code == 404
    assert client.get("/web/../../data/waste_clean.csv").status_code == 404


def test_agent_endpoints_still_work(client):
    assert client.get("/health").status_code == 200
    r = client.post("/ask", json={"question": "Kerala treated vs collected", "language": "en"})
    assert r.status_code == 200 and "answer" in r.get_json()


def test_site_serving_can_be_switched_off(built, monkeypatch):
    monkeypatch.setenv("SERVE_SITE", "0")
    c = load_app("kachra_agent_app_off").app.test_client()
    assert c.get("/").status_code == 404 and c.get("/health").status_code == 200
