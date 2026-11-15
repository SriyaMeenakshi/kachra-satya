"""The Join page: consent is required, the count is public, the list is private, and the nav is centred."""
import json
import os
import re
import subprocess
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "agent"))
GOOD = {"name": "Asha Rao", "email": "Asha@Example.com", "role": "resident", "state": "Kerala", "city": "Kochi", "language": "te", "source": "a friend", "consent": True}


def read(p):
    return open(p, encoding="utf-8").read()


@pytest.fixture()
def sg(tmp_path, monkeypatch):
    import accounts
    monkeypatch.setattr(accounts, "DATABASE_URL", "")
    monkeypatch.setattr(accounts, "DB_PATH", str(tmp_path / "s.sqlite"))
    monkeypatch.setattr(accounts, "_ready", False)
    monkeypatch.setattr(accounts, "_signups", {})
    monkeypatch.setattr(accounts, "ADMIN_KEY", "team-key")
    from flask import Flask
    app = Flask(__name__)
    app.register_blueprint(accounts.bp)
    return accounts, app.test_client()


def test_signup_needs_consent_a_name_and_a_real_email(sg):
    _, c = sg
    assert c.post("/api/signup", json=dict(GOOD, consent=False)).status_code == 400
    assert c.post("/api/signup", json=dict(GOOD, name="A")).status_code == 400
    assert c.post("/api/signup", json=dict(GOOD, email="not-an-email")).status_code == 400
    assert c.get("/api/signup/count").get_json() == {"count": 0}


def test_signup_is_counted_once_per_email_and_updates_on_repeat(sg):
    _, c = sg
    a = c.post("/api/signup", json=GOOD).get_json()
    assert a == {"saved": True, "already": False, "count": 1}
    b = c.post("/api/signup", json=dict(GOOD, email="asha@example.com", city="Thrissur")).get_json()
    assert b["already"] is True and b["count"] == 1
    c.post("/api/signup", json=dict(GOOD, email="b@example.com"))
    assert c.get("/api/signup/count").get_json() == {"count": 2}


def test_a_filled_honeypot_saves_nothing(sg):
    _, c = sg
    c.post("/api/signup", json=dict(GOOD, website="http://spam"))
    assert c.get("/api/signup/count").get_json() == {"count": 0}


def test_signups_are_rate_limited_per_connection(sg):
    acc, c = sg
    codes = [c.post("/api/signup", json=dict(GOOD, email="p%d@example.com" % i)).status_code for i in range(acc.SIGNUPS_PER_HOUR + 1)]
    assert codes[-1] == 429 and set(codes[:-1]) == {200}


def test_the_list_is_private_and_safe_in_a_spreadsheet(sg):
    _, c = sg
    c.post("/api/signup", json=dict(GOOD, name="=HYPERLINK(1)"))
    assert c.get("/api/signups").status_code == 404
    assert c.get("/api/signups", headers={"X-Admin-Key": "wrong"}).status_code == 404
    r = c.get("/api/signups", headers={"X-Admin-Key": "team-key"})
    assert r.status_code == 200 and "asha@example.com" in r.get_data(as_text=True) and "'=HYPERLINK" in r.get_data(as_text=True)
    d = c.get("/api/signups?format=json", headers={"X-Admin-Key": "team-key"}).get_json()
    assert d["count"] == 1 and d["by_role"] == {"resident": 1} and d["by_state"] == {"Kerala": 1} and d["signed_in"] == 0 and len(d["recent"]) == 1 and "email" not in d["recent"][0]


def test_the_list_is_off_when_no_admin_key_is_set(sg, monkeypatch):
    acc, c = sg
    monkeypatch.setattr(acc, "ADMIN_KEY", "")
    assert c.get("/api/signups", headers={"X-Admin-Key": ""}).status_code == 404


def test_the_join_form_check_matches_the_server():
    out = subprocess.run(["node", "-e", "var S=require('./web/app/signup.js');console.log(JSON.stringify([S.problem({name:'A',email:'a@b.in',consent:true}),S.problem({name:'Asha',email:'x',consent:true}),S.problem({name:'Asha',email:'a@b.in',consent:false}),S.problem({name:'Asha',email:'a@b.in',consent:true})]))"], capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    a, b, c, d = json.loads(out.stdout)
    assert a and b and c and d == ""


def test_the_join_page_is_wired_in_and_sends_nothing_until_join_is_pressed():
    html, app, js = read("web/app/index.html"), read("web/app/app.js"), read("web/app/signup.js")
    assert html.count("signup.js") == 1 and html.count("signup.css") == 1 and 'href="#/join"' in html
    assert "join: function () { KSJoin.render(); }" in app and 'join: "Join"' in app
    assert js.count('"/api/signup"') == 1 and js.index('addEventListener("submit"') < js.index('"/api/signup"')



def test_the_header_has_a_join_button_and_the_team_dashboard_is_routed():
    html, app, js = read("web/app/index.html"), read("web/app/app.js"), read("web/app/signup.js")
    assert 'id="joinlink" href="#/join"' in html and "team: function () { KSJoin.renderTeam(); }" in app
    assert "X-Admin-Key" in js and "sessionStorage" not in js and "localStorage" not in js      # the key is never kept


def test_google_on_the_join_form_takes_the_verified_email_from_the_token(sg, monkeypatch):
    acc, c = sg
    monkeypatch.setattr(acc, "GOOGLE_CLIENT_ID", "x.apps.googleusercontent.com")
    monkeypatch.setattr(acc, "KS_SECRET", "s")
    monkeypatch.setattr(acc, "verify_google", lambda cred: {"sub": "1", "iss": "accounts.google.com", "email": "real@example.com", "email_verified": True, "name": "Real Person"})
    assert c.post("/api/signup", json=dict(GOOD, email="fake@example.com", credential="tok")).get_json()["saved"]
    assert "real@example.com" in c.get("/api/signups", headers={"X-Admin-Key": "team-key"}).get_data(as_text=True)
    monkeypatch.setattr(acc, "verify_google", lambda cred: (_ for _ in ()).throw(ValueError("bad")))
    assert c.post("/api/signup", json=dict(GOOD, credential="bad")).status_code == 401
