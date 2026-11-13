"""Sign-in with Google and the shared ward store: residents' "did the truck come?" taps, added up per ward.

What is stored, and what is not
- Stored: an anonymous id (a one-way hash of the Google account id, salted with KS_SECRET), the ward, the day, and "collected" or "not_collected".
- Never stored: name, email address, picture, location, device, or the Google account id itself.
- One report per person per ward per day: a later tap replaces the earlier one. A person can delete everything they shared.
- Totals are public and unverified: "reported by N people". A day where people disagree shows both counts, never one winner.

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
        return psycopg2.connect(DATABASE_URL.replace("postgres://", "postgresql://", 1))
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
    return jsonify({"token": _signer().dumps({"u": user_id_for(claims["sub"])}), "days": TOKEN_DAYS})


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


@bp.route("/api/me", methods=["DELETE"])
def api_delete_me():
    uid = _current_user()
    if not uid:
        return jsonify({"error": "Sign in first."}), 401
    init_db()
    n = _run("DELETE FROM ward_reports WHERE user_id = ?", (uid,))
    return jsonify({"deleted": int(n or 0)})
