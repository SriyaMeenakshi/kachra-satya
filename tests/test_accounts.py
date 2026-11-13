"""Sign-in with Google and the shared ward total: off by default, anonymous ids only, one report per person per day, deletable."""
import datetime as dt
import json
import os
import subprocess
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "agent"))
TODAY = dt.datetime.now(dt.timezone.utc).date()
WARD = "Kerala~Kochi~Ward 4"


def read(p):
    return open(p, encoding="utf-8").read()


@pytest.fixture()
def acc(tmp_path, monkeypatch):
    import accounts
    monkeypatch.setattr(accounts, "GOOGLE_CLIENT_ID", "test.apps.googleusercontent.com")
    monkeypatch.setattr(accounts, "KS_SECRET", "test-secret")
    monkeypatch.setattr(accounts, "DATABASE_URL", "")
    monkeypatch.setattr(accounts, "DB_PATH", str(tmp_path / "w.sqlite"))
    monkeypatch.setattr(accounts, "_ready", False)
    monkeypatch.setattr(accounts, "_writes", {})
    monkeypatch.setattr(accounts, "verify_google", lambda cred: {"sub": cred, "iss": "accounts.google.com", "email": cred + "@example.com", "name": "Asha"})
    from flask import Flask
    app = Flask(__name__)
    app.register_blueprint(accounts.bp)
    return accounts, app.test_client()


def signin(c, who):
    return {"Authorization": "Bearer " + c.post("/api/signin", json={"credential": who}).get_json()["token"]}


def test_sign_in_is_off_unless_configured(tmp_path, monkeypatch):
    import accounts
    monkeypatch.setattr(accounts, "GOOGLE_CLIENT_ID", "")
    monkeypatch.setattr(accounts, "DB_PATH", str(tmp_path / "w.sqlite"))
    monkeypatch.setattr(accounts, "_ready", False)
    from flask import Flask
    app = Flask(__name__)
    app.register_blueprint(accounts.bp)
    c = app.test_client()
    assert c.get("/api/config").get_json() == {"signIn": False, "clientId": ""}
    assert c.post("/api/signin", json={"credential": "x"}).status_code == 503
    assert c.post("/api/ward/report", json={"ward": WARD, "date": TODAY.isoformat(), "status": "collected"}).status_code == 401
    assert c.get("/api/ward/summary?ward=" + WARD).get_json()["shared"] is False
    assert not os.path.exists(tmp_path / "w.sqlite")      # nothing is stored while it is off


def test_a_report_needs_a_session_and_a_bad_token_is_refused(acc):
    _, c = acc
    body = {"ward": WARD, "date": TODAY.isoformat(), "status": "collected"}
    assert c.post("/api/ward/report", json=body).status_code == 401
    assert c.post("/api/ward/report", json=body, headers={"Authorization": "Bearer nonsense"}).status_code == 401
    assert c.delete("/api/me").status_code == 401


def test_google_rejection_is_a_401_and_says_nothing_internal(acc, monkeypatch):
    accounts, c = acc

    def boom(cred):
        raise ValueError("Wrong recipient, secret detail")

    monkeypatch.setattr(accounts, "verify_google", boom)
    r = c.post("/api/signin", json={"credential": "x"})
    assert r.status_code == 401 and "secret detail" not in r.get_data(as_text=True)


def test_one_report_per_person_per_day_and_totals_count_people(acc):
    _, c = acc
    a, b = signin(c, "asha"), signin(c, "bala")
    day, y = TODAY.isoformat(), (TODAY - dt.timedelta(days=1)).isoformat()
    # asha changes her mind: the later tap replaces the earlier one
    for h, d, s in ((a, day, "collected"), (a, day, "not_collected"), (b, day, "collected"), (b, y, "collected")):
        assert c.post("/api/ward/report", json={"ward": WARD, "date": d, "status": s}, headers=h).status_code == 200
    s = c.get("/api/ward/summary?ward=" + WARD).get_json()
    assert s["reporters"] == 2 and s["shared"] is True
    days = {d["date"]: d for d in s["days"]}
    assert days[day] == {"date": day, "collected": 1, "not_collected": 1}      # a contested day keeps both counts
    assert days[y] == {"date": y, "collected": 1, "not_collected": 0}
    assert c.get("/api/ward/summary?ward=Kerala~Kochi~Ward 5").get_json()["reporters"] == 0


def test_only_an_anonymous_id_is_stored(acc):
    accounts, c = acc
    h = signin(c, "asha-google-id-123")
    c.post("/api/ward/report", json={"ward": WARD, "date": TODAY.isoformat(), "status": "collected"}, headers=h)
    raw = open(accounts.DB_PATH, "rb").read()
    for secret in (b"asha-google-id-123", b"example.com", b"Asha"):
        assert secret not in raw
    rows = accounts._run("SELECT user_id, ward, day, status FROM ward_reports", fetch=True)
    assert len(rows) == 1 and len(rows[0][0]) == 32 and rows[0][0] == accounts.user_id_for("asha-google-id-123")
    assert "user_id" not in c.get("/api/ward/summary?ward=" + WARD).get_data(as_text=True)      # the public total carries no ids


def test_bad_input_is_refused(acc):
    _, c = acc
    h = signin(c, "asha")
    ok = {"ward": WARD, "date": TODAY.isoformat(), "status": "collected"}
    changes = ({"ward": "Kerala"}, {"ward": "a~b~" + "x" * 80}, {"ward": "a~b/..~c"}, {"date": "2020-01-01"},
               {"date": (TODAY + dt.timedelta(days=5)).isoformat()}, {"date": "13-11-2026"}, {"status": "maybe"}, {"ward": 7})
    for change in changes:
        assert c.post("/api/ward/report", json={**ok, **change}, headers=h).status_code == 400, change
    assert c.get("/api/ward/summary?ward=nope").status_code == 400


def test_a_person_can_delete_everything_they_shared(acc):
    _, c = acc
    a, b = signin(c, "asha"), signin(c, "bala")
    for h in (a, b):
        c.post("/api/ward/report", json={"ward": WARD, "date": TODAY.isoformat(), "status": "collected"}, headers=h)
    assert c.delete("/api/me", headers=a).get_json() == {"deleted": 1}
    assert c.get("/api/ward/summary?ward=" + WARD).get_json()["reporters"] == 1      # the other person's report is untouched


def test_writes_are_rate_limited_per_person(acc, monkeypatch):
    accounts, c = acc
    monkeypatch.setattr(accounts, "WRITES_PER_MIN", 3)
    h = signin(c, "asha")
    codes = [c.post("/api/ward/report", json={"ward": WARD, "date": TODAY.isoformat(), "status": "collected"}, headers=h).status_code for _ in range(5)]
    assert codes == [200, 200, 200, 429, 429]


def test_ward_page_asks_before_loading_google_and_says_what_is_stored():
    acc_js, ward = read("web/app/account.js"), read("web/app/ward.js")
    assert acc_js.count("accounts.google.com/gsi/client") == 1 and "function loadGoogle()" in acc_js
    assert "accounts.google.com" not in read("web/app/index.html")                       # Google's script is never loaded with the page
    i = ward.index("function drawShare(w)")
    block = ward[i:ward.index("function drawCal(s)", i)]
    for said in ("Turn on sharing", "What is stored if I sign in", "Not stored:", "your name, your email address", "Delete everything I shared", "Sign out", "Unverified", "do not pick one"):
        assert said in block, said
    html = read("web/app/index.html")
    assert html.index("account.js") < html.index('src="ward.js"')
    assert "*.sqlite" in read(".gitignore")


def test_tally_counts_contested_days():
    code = "var A=require('./web/app/account.js');console.log(JSON.stringify(A.tally({reporters:3,days:[{date:'a',collected:2,not_collected:1},{date:'b',collected:1,not_collected:0}]})))"
    out = subprocess.run(["node", "-e", code], capture_output=True, text=True, encoding="utf-8")
    assert out.returncode == 0, out.stderr
    assert json.loads(out.stdout) == {"reporters": 3, "days": 2, "collected": 3, "notCollected": 1, "contested": 1}
