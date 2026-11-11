"""Run the 6 acceptance tests from docs/agentfoundry_run_sheet.md

This script calls the running server at http://localhost:5000 by default and
prints PASS/FAIL for each of the six tests using simple heuristics based on the
expected content notes in the run sheet.

Usage:
    python agent/test_acceptance.py

It assumes the server is running locally. Adjust SERVER_URL if different.
"""
import requests
import os

SERVER_URL = os.environ.get("AGENT_URL", "http://localhost:5000")
ASK = SERVER_URL.rstrip("/") + "/ask"

TESTS = []

# 1. English: Kerala treated vs collected. Expect mention of four rule-6 flags and treated vs collected numbers.
TESTS.append({
    "name": "Kerala treated vs collected (en)",
    "payload": {"question": "Kerala treated vs collected", "language": "en"},
    "check": lambda r: (
        r and isinstance(r, dict) and "answer" in r and (
            ("treated" in r["answer"].lower() and "collected" in r["answer"].lower())
            # Expect four flagged years: check the four year strings explicitly.
            and all(y in r["answer"] for y in ["2019-20", "2020-21", "2021-22", "2022-23"])
        )
    )
})

# 2. Hindi: Bihar treated waste 2019-20. Expect "not reported" and a note.
TESTS.append({
    "name": "Bihar treated 2019-20 (hi)",
    "payload": {"question": "Bihar treated waste 2019-20", "language": "hi"},
    "check": lambda r: (
        r and "not reported" in r.get("answer", "").lower()
    )
})

# 3. Tamil: Tamil Nadu generated 2023-24, expect number and CPCB and page
TESTS.append({
    "name": "Tamil Nadu generated 2023-24 (ta)",
    "payload": {"question": "Tamil Nadu generated 2023-24", "language": "ta"},
    "check": lambda r: (
        r and "17,843" in r.get("answer", "") or (r and "17,843" in r.get("answer", ""))
    )
})

# 4. Telugu: largest CPCB vs MoHUA gap must mention CPCB and MoHUA and different years
TESTS.append({
    "name": "Largest CPCB vs MoHUA gap (te)",
    "payload": {"question": "Which states have the largest CPCB vs MoHUA gap?", "language": "te"},
    "check": lambda r: (
        r and "cpcb" in r.get("answer", "").lower() and "mohua" in r.get("answer", "").lower() and "2023-24" in r.get("answer", "") and "2025-26" in r.get("answer", "")
    )
})

# 5a. Maharashtra landfilled 2023-24 -> not in the data
TESTS.append({
    "name": "Maharashtra landfilled 2023-24 (en)",
    "payload": {"question": "Maharashtra landfilled 2023-24", "language": "en"},
    "check": lambda r: (
        r and ("not in the data" in r.get("answer", "").lower() or "no rows" in r.get("answer", "").lower())
    )
})

# 5b. Maharashtra landfilled 2021-22 -> expect 2,067 tpd and cpcb_2021-22.pdf
TESTS.append({
    "name": "Maharashtra landfilled 2021-22 (en)",
    "payload": {"question": "Maharashtra landfilled 2021-22", "language": "en"},
    "check": lambda r: (
        r and ("2,067" in r.get("answer", "") or "2067" in r.get("answer", "")) and ("cpcb_2021-22.pdf" in str(r.get("answer", "")).lower())
    )
})

# 6. Claim check 81% -> expect SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS in plain words (or similar phrasing)
TESTS.append({
    "name": "Claim: 81% processed (en)",
    "payload": {"question": "A minister said 81% of India's waste is processed. Is that true?", "language": "en"},
    "check": lambda r: (
        r and ("supported_by_some" in r.get("answer", "").lower() or "supported by some" in r.get("answer", "").lower() or "contradict" in r.get("answer", "").lower())
    )
})


if __name__ == "__main__":
    print("Running acceptance tests against", ASK)
    for t in TESTS:
        try:
            resp = requests.post(ASK, json=t["payload"], timeout=60)
            ok = False
            if resp.status_code == 200:
                j = resp.json()
                ok = t["check"](j)
            else:
                j = resp.text
            print(f"{t['name']}: { 'PASS' if ok else 'FAIL' }")
            if not ok:
                print("  Response:", j)
        except Exception as e:
            print(f"{t['name']}: ERROR - {e}")

