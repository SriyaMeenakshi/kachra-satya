"""Sign-in with Google and the shared ward store: residents' "did the truck come?" taps, added up per ward.

What is stored, and what is not
- Stored: an anonymous id (a one-way hash of the Google account id, salted with KS_SECRET), the ward, the day, and "collected" or "not_collected".
- Also stored, so the site can say how many people have signed in: the same anonymous id and the date it first signed in (a day, not a time). Nothing else.
- Never stored: name, email address, picture, location, device, or the Google account id itself.
- One report per person per ward per day: a later tap replaces the earlier one. A person can delete everything they shared.
- Totals are public and unverified: "reported by N people". A day where people disagree shows both counts, never one winner.
- /api/stats gives one public number: how many anonymous ids have signed in. It counts sign-ins, not visits, and a person with two Google accounts counts twice.

Switched on only when GOOGLE_CLIENT_ID and KS_SECRET are both set; otherwise /api/config says sign-in is off and nothing is stored.
Database: DATABASE_URL (PostgreSQL, needs psycopg2) if set, else a SQLite file at KS_DB_PATH (default agent/ward_reports.sqlite).
A free Render web service loses its disk on every deploy, so use DATABASE_URL there.
"""
import hashlib
import os
import re
import sqlite3
import time
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

bp = Blueprint("accounts", __name__)

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "").strip()
KS_SECRET = os.environ.get("KS_SECRET", "").strip()
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()
DB_PATH = os.environ.get("KS_DB_PATH", "").strip() or os.path.join(os.path.dirname(os.path.abspath(__file__)), "ward_reports.sqlite")
TOKEN_DAYS = 30
MAX_BACK_DAYS = 59                      # the same window the ward page allows
SUMMARY_DAYS = 30
WRITES_PER_MIN = int(os.environ.get("WARD_WRITES_PER_MIN", "30"))
STATUSES = ("collected", "not_collected")
_writes: dict = {}                      # user id -> recent write times (in memory, one worker)


def enabled() -> bool:
    return bool(GOOGLE_CLIENT_ID and KS_SECRET)


# ---------- database (SQLite or PostgreSQL behind the same few calls) ----------
def _pg() -> bool:
    return DATABASE_URL.startswith(("postgres://", "postgresql://"))


def _connect():
    if _pg():
        import psycopg2                                   # only needed when DATABASE_URL is set
        # connect_timeout: a serverless database such as Neon may need a moment to wake after idle; wait up to 10 seconds instead of forever
        return psycopg2.connect(DATABASE_URL.replace("postgres://", "postgresql://", 1), connect_timeout=10)
    return sqlite3.connect(DB_PATH, timeout=10)


def _run(sql: str, args: tuple = (), fetch: bool = False):
    """Run one statement. SQL is written with ? placeholders; PostgreSQL gets %s."""
    con = _connect()
    try:
        cur = con.cursor()
        cur.execute(sql.replace("?", "%s") if _pg() else sql, args)
        rows = cur.fetchall() if fetch else None
        n = cur.rowcount
        con.commit()
        return rows if fetch else n
    finally:
        con.close()


_ready = False


def init_db() -> None:
    global _ready
    if _ready:
        return
    _run("CREATE TABLE IF NOT EXISTS ward_reports (user_id TEXT NOT NULL, ward TEXT NOT NULL, day TEXT NOT NULL, status TEXT NOT NULL, saved_at TEXT NOT NULL, PRIMARY KEY (user_id, ward, day))")
    _run("CREATE TABLE IF NOT EXISTS signups (email TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL, state TEXT NOT NULL, city TEXT NOT NULL, language TEXT NOT NULL, source TEXT NOT NULL, joined_at TEXT NOT NULL)")
    _run("CREATE TABLE IF NOT EXISTS signup_links (user_id TEXT PRIMARY KEY, email TEXT NOT NULL)")      # which signed-in person owns which Join row, set only when Google vouched for the email
    _run("CREATE TABLE IF NOT EXISTS people (user_id TEXT PRIMARY KEY, first_seen TEXT NOT NULL)")
    _ready = True


# ---------- who is asking ----------
def verify_google(credential: str) -> dict:
    """Check a Google ID token and return its claims. Raises ValueError if it is not a valid token for this site."""
    try:
        from google.auth.transport import requests as g_requests
        from google.oauth2 import id_token
        claims = id_token.verify_oauth2_token(credential, g_requests.Request(), GOOGLE_CLIENT_ID)
    except ImportError:                                   # google-auth not installed: ask Google to check the token
        import requests
        r = requests.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": credential}, timeout=8)
        if r.status_code != 200:
            raise ValueError("token rejected")
        claims = r.json()
        if claims.get("aud") != GOOGLE_CLIENT_ID or float(claims.get("exp", 0)) < time.time():
            raise ValueError("token is not for this site or has expired")
    if claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com") or not claims.get("sub"):
        raise ValueError("token is not from Google")
    return claims


def user_id_for(sub: str) -> str:
    """An anonymous id: the Google account id cannot be worked back from it without KS_SECRET."""
    return hashlib.sha256((KS_SECRET + ":" + str(sub)).encode("utf-8")).hexdigest()[:32]


def _signer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(KS_SECRET, salt="ks-session")


def _current_user():
    """The anonymous id behind the request's Bearer token, or None."""
    if not enabled():
        return None
    h = request.headers.get("Authorization", "")
    if not h.startswith("Bearer "):
        return None
    try:
        data = _signer().loads(h[7:].strip(), max_age=TOKEN_DAYS * 86400)
    except (BadSignature, SignatureExpired):
        return None
    uid = data.get("u") if isinstance(data, dict) else None
    return uid if isinstance(uid, str) and re.fullmatch(r"[0-9a-f]{32}", uid) else None


def _too_many(uid: str) -> bool:
    now = time.monotonic()
    recent = [t for t in _writes.get(uid, []) if now - t < 60]
    if len(recent) >= WRITES_PER_MIN:
        _writes[uid] = recent
        return True
    recent.append(now)
    _writes[uid] = recent
    return False


# ---------- what may be written ----------
_BAD = re.compile(r"[/?#%\x00-\x1f]")


def clean_ward(ward) -> str | None:
    """A ward id is State~City~Ward, as the ward page builds it. Returns it, or None if it is not one."""
    if not isinstance(ward, str) or len(ward) > 190 or _BAD.search(ward):
        return None
    parts = ward.split("~")
    if len(parts) != 3 or not all(p.strip() and len(p) <= 60 for p in parts):
        return None
    return ward


def clean_day(day) -> str | None:
    """A day within the reporting window. One day of slack at each end, because the server clock is UTC and residents are not."""
    if not isinstance(day, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day):
        return None
    try:
        d = datetime.strptime(day, "%Y-%m-%d").date()
    except ValueError:
        return None
    today = datetime.now(timezone.utc).date()
    if d > today + timedelta(days=1) or d < today - timedelta(days=MAX_BACK_DAYS + 1):
        return None
    return day


# ---------- routes ----------
@bp.route("/api/config", methods=["GET"])
def api_config():
    return jsonify({"signIn": enabled(), "clientId": GOOGLE_CLIENT_ID if enabled() else ""})


@bp.route("/api/stats", methods=["GET"])
def api_stats():
    """One public number: how many people (anonymous ids) have signed in. Counts only; it says nothing about any one person or about visits."""
    if not enabled():
        return jsonify({"signIn": False, "people": 0})
    init_db()
    rows = _run("SELECT COUNT(*) FROM people", fetch=True)
    return jsonify({"signIn": True, "people": int(rows[0][0]) if rows else 0,
                    "note": "Counts anonymous sign-ins, not visits. One person with two Google accounts counts twice."})


@bp.route("/api/signin", methods=["POST"])
def api_signin():
    if not enabled():
        return jsonify({"error": "Sign-in is not switched on for this site."}), 503
    body = request.get_json(silent=True) or {}
    cred = body.get("credential")
    if not isinstance(cred, str) or not cred or len(cred) > 4096:
        return jsonify({"error": "No sign-in token was sent."}), 400
    try:
        claims = verify_google(cred)
    except Exception:
        return jsonify({"error": "Google did not confirm that sign-in. Please try again."}), 401
    init_db()
    uid = user_id_for(claims["sub"])
    # count this person once: the anonymous id and the day it first signed in, nothing else
    _run("INSERT INTO people (user_id, first_seen) VALUES (?, ?) ON CONFLICT (user_id) DO NOTHING",
         (uid, datetime.now(timezone.utc).date().isoformat()))
    return jsonify({"token": _signer().dumps({"u": uid}), "days": TOKEN_DAYS})


@bp.route("/api/ward/report", methods=["POST"])
def api_ward_report():
    uid = _current_user()
    if not uid:
        return jsonify({"error": "Sign in to share a report."}), 401
    if _too_many(uid):
        return jsonify({"error": "Too many reports in a minute. Please wait and try again."}), 429
    body = request.get_json(silent=True) or {}
    ward, day, status = clean_ward(body.get("ward")), clean_day(body.get("date")), body.get("status")
    if not ward:
        return jsonify({"error": "That ward is not valid."}), 400
    if not day:
        return jsonify({"error": "That day is outside the last %d days." % (MAX_BACK_DAYS + 1)}), 400
    if status not in STATUSES:
        return jsonify({"error": "Choose collected or not collected."}), 400
    init_db()
    _run("INSERT INTO ward_reports (user_id, ward, day, status, saved_at) VALUES (?, ?, ?, ?, ?) "
         "ON CONFLICT (user_id, ward, day) DO UPDATE SET status = excluded.status, saved_at = excluded.saved_at",
         (uid, ward, day, status, datetime.now(timezone.utc).isoformat(timespec="seconds")))
    return jsonify({"saved": True})


@bp.route("/api/ward/summary", methods=["GET"])
def api_ward_summary():
    """Public totals for one ward over the last 30 days. Counts only: no ids, nothing about any one person."""
    ward = clean_ward(request.args.get("ward"))
    if not ward:
        return jsonify({"error": "That ward is not valid."}), 400
    if not enabled():
        return jsonify({"shared": False, "ward": ward, "reporters": 0, "days": []})
    init_db()
    since = (datetime.now(timezone.utc).date() - timedelta(days=SUMMARY_DAYS)).isoformat()
    rows = _run("SELECT day, status, COUNT(*) FROM ward_reports WHERE ward = ? AND day >= ? GROUP BY day, status ORDER BY day", (ward, since), fetch=True)
    who = _run("SELECT COUNT(DISTINCT user_id) FROM ward_reports WHERE ward = ? AND day >= ?", (ward, since), fetch=True)
    days: dict = {}
    for day, status, n in rows:
        days.setdefault(day, {"date": day, "collected": 0, "not_collected": 0})[status] = int(n)
    return jsonify({"shared": True, "ward": ward, "window_days": SUMMARY_DAYS, "reporters": int(who[0][0]) if who else 0, "days": list(days.values()),
                    "note": "Unverified reports from signed-in residents. One report per person per day."})


# ---------- the sign-up page: a separate, optional list so the team can count its users ----------
# Unlike the ward store above, this one keeps contact details, because a person chose to hand them over on the Join page and ticked the consent box.
# It is never joined to ward reports. Public: only the number of people. Private: the list, behind KS_ADMIN_KEY.
ADMIN_KEY = os.environ.get("KS_ADMIN_KEY", "").strip()
ROLES = ("resident", "student", "journalist", "official", "researcher", "ngo", "other")
LANGS = ("en", "hi", "te", "other")
SIGNUPS_PER_HOUR = int(os.environ.get("SIGNUPS_PER_HOUR", "6"))
_signups: dict = {}                                       # client address -> recent sign-up times (in memory, one worker)
_EMAIL = re.compile(r"[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,24}")


def clean_signup(body) -> tuple[dict | None, str]:
    """Check what the Join page sent. Returns (row, "") or (None, a message for the person)."""
    if not isinstance(body, dict):
        return None, "Nothing was sent."
    if body.get("consent") is not True:
        return None, "Please tick the box to say we may keep these details."
    def text(k, n):
        v = body.get(k)
        return " ".join(v.split())[:n] if isinstance(v, str) else ""
    name, email, state, city, source = text("name", 80), text("email", 254).lower(), text("state", 60), text("city", 80), text("source", 120)
    if len(name) < 2:
        return None, "Please enter your name."
    if not _EMAIL.fullmatch(email) or len(email) > 254:
        return None, "That email address does not look right."
    if re.search(r"[\x00-\x1f]", name + email + state + city + source):
        return None, "Please use plain text."
    role = body.get("role") if body.get("role") in ROLES else "other"
    lang = body.get("language") if body.get("language") in LANGS else "en"
    return {"email": email, "name": name, "role": role, "state": state, "city": city, "language": lang, "source": source}, ""


def _client() -> str:
    return (request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or request.remote_addr or "?")[:64]


def _signup_limited(who: str) -> bool:
    now = time.monotonic()
    recent = [t for t in _signups.get(who, []) if now - t < 3600]
    limited = len(recent) >= SIGNUPS_PER_HOUR
    if not limited:
        recent.append(now)
    _signups[who] = recent
    return limited


@bp.route("/api/signup", methods=["POST"])
def api_signup():
    body = request.get_json(silent=True) or {}
    if isinstance(body, dict) and body.get("website"):        # a hidden field only a bot fills in: pretend it worked
        return jsonify({"saved": True, "count": 0})
    cred = body.get("credential") if isinstance(body, dict) else None
    link_uid = None
    if isinstance(cred, str) and cred and enabled() and len(cred) <= 4096:      # signed in with Google on the form: use the name and email Google vouches for
        try:
            g = verify_google(cred)
            if g.get("email") and g.get("email_verified") in (True, "true"):
                body = dict(body, email=g["email"], name=g.get("name") or body.get("name") or "")
                link_uid = user_id_for(g["sub"])
        except Exception:
            return jsonify({"error": "Google did not confirm that sign-in. Please sign in again or fill the form by hand."}), 401
    row, why = clean_signup(body)
    if not row:
        return jsonify({"error": why}), 400
    if _signup_limited(_client()):
        return jsonify({"error": "Too many sign-ups from this connection. Please try again later."}), 429
    init_db()
    row["joined_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    existing = _run("SELECT 1 FROM signups WHERE email = ?", (row["email"],), fetch=True)
    _run("INSERT INTO signups (email, name, role, state, city, language, source, joined_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) "
         "ON CONFLICT (email) DO UPDATE SET name = excluded.name, role = excluded.role, state = excluded.state, city = excluded.city, language = excluded.language, source = excluded.source",
         (row["email"], row["name"], row["role"], row["state"], row["city"], row["language"], row["source"], row["joined_at"]))
    if link_uid:
        _run("INSERT INTO signup_links (user_id, email) VALUES (?, ?) ON CONFLICT (user_id) DO UPDATE SET email = excluded.email", (link_uid, row["email"]))
    n = _run("SELECT COUNT(*) FROM signups", fetch=True)
    return jsonify({"saved": True, "already": bool(existing), "count": int(n[0][0])})


@bp.route("/api/signup/count", methods=["GET"])
def api_signup_count():
    """Public: how many people have joined, and nothing about any of them."""
    init_db()
    n = _run("SELECT COUNT(*) FROM signups", fetch=True)
    return jsonify({"count": int(n[0][0])})


@bp.route("/api/signups", methods=["GET"])
def api_signups_export():
    """For the team: the full list as CSV, or the counts as JSON with ?format=json. Needs KS_ADMIN_KEY in the X-Admin-Key header; off if that is not set."""
    import hmac
    sent = request.headers.get("X-Admin-Key", "")
    if not ADMIN_KEY or not hmac.compare_digest(sent.encode("utf-8"), ADMIN_KEY.encode("utf-8")):
        return jsonify({"error": "Not found."}), 404
    init_db()
    rows = _run("SELECT joined_at, name, email, role, state, city, language, source FROM signups ORDER BY joined_at", fetch=True)
    if request.args.get("format") == "json":
        def tally(i):
            d: dict = {}
            for r in rows:
                k = (r[i] or "(not given)")
                d[k] = d.get(k, 0) + 1
            return dict(sorted(d.items(), key=lambda kv: -kv[1]))
        by_day: dict = {}
        for r in rows:
            by_day[r[0][:10]] = by_day.get(r[0][:10], 0) + 1
        ppl = _run("SELECT COUNT(*) FROM people", fetch=True)
        return jsonify({"count": len(rows), "signed_in": int(ppl[0][0]) if ppl else 0, "by_role": tally(3), "by_state": tally(4), "by_language": tally(6),
                        "by_day": by_day, "recent": [{"joined_at": r[0], "name": r[1], "role": r[3], "state": r[4], "city": r[5]} for r in rows[-10:][::-1]]})
    import csv
    import io
    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(["joined_at", "name", "email", "role", "state", "city", "language", "source"])
    for r in rows:
        w.writerow([("'" + c if isinstance(c, str) and c[:1] in "=+-@" else c) for c in r])      # a spreadsheet must not run a typed formula
    return out.getvalue(), 200, {"Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=kachra-satya-signups.csv"}


_PROFILE = ("name", "role", "state", "city", "language", "source")


@bp.route("/api/me/profile", methods=["GET", "PUT"])
def api_my_profile():
    """A signed-in person sees and edits the details they gave on the Join page. The email cannot be changed here: it is what Google confirmed."""
    uid = _current_user()
    if not uid:
        return jsonify({"error": "Sign in first."}), 401
    init_db()
    link = _run("SELECT email FROM signup_links WHERE user_id = ?", (uid,), fetch=True)
    if not link:
        return jsonify({"joined": False}), 404
    email = link[0][0]
    if request.method == "PUT":
        body = request.get_json(silent=True) or {}
        row, why = clean_signup(dict(body if isinstance(body, dict) else {}, email=email, consent=True))
        if not row:
            return jsonify({"error": why}), 400
        _run("UPDATE signups SET name = ?, role = ?, state = ?, city = ?, language = ?, source = ? WHERE email = ?",
             (row["name"], row["role"], row["state"], row["city"], row["language"], row["source"], email))
    r = _run("SELECT name, role, state, city, language, source, joined_at FROM signups WHERE email = ?", (email,), fetch=True)
    if not r:
        return jsonify({"joined": False}), 404
    d = dict(zip(_PROFILE + ("joined_at",), r[0]))
    d.update({"joined": True, "email": email})
    return jsonify(d)


@bp.route("/api/me/profile", methods=["DELETE"])
def api_delete_my_profile():
    uid = _current_user()
    if not uid:
        return jsonify({"error": "Sign in first."}), 401
    init_db()
    link = _run("SELECT email FROM signup_links WHERE user_id = ?", (uid,), fetch=True)
    if link:
        _run("DELETE FROM signups WHERE email = ?", (link[0][0],))
        _run("DELETE FROM signup_links WHERE user_id = ?", (uid,))
    return jsonify({"deleted": bool(link)})


@bp.route("/api/me", methods=["DELETE"])
def api_delete_me():
    uid = _current_user()
    if not uid:
        return jsonify({"error": "Sign in first."}), 401
    init_db()
    n = _run("DELETE FROM ward_reports WHERE user_id = ?", (uid,))
    link = _run("SELECT email FROM signup_links WHERE user_id = ?", (uid,), fetch=True)
    if link:
        _run("DELETE FROM signups WHERE email = ?", (link[0][0],))
        _run("DELETE FROM signup_links WHERE user_id = ?", (uid,))
    _run("DELETE FROM people WHERE user_id = ?", (uid,))      # deleting everything also takes this person out of the sign-in count
    return jsonify({"deleted": int(n or 0)})
