# Submission checklist (15 Nov 2026)

Status as of 2026-11-11. Tick an item only when you have done it and seen it with your own eyes. "Not done" is the honest default.

## Must be true before you submit
- [ ] **Re-read the hackathon's current track list and rules** (Code for a Billion, Waste Management track) and confirm the submission format and deadline. Nobody on the team has recorded the rules in this repo, so do it from the official page and paste the link here: ______
- [ ] **Public URL is live** and opens on a phone: Start, Map, Check a claim, one source page. See `docs/deploy.md`. Not deployed yet.
- [ ] **Decide about publishing the page images** (`receipts/pages/`, copies of pages from government documents). Reuse terms are not confirmed (`docs/licences.md`); permission requests are drafts and **not sent** (`docs/permission_requests.md`).
- [ ] **Demo video** recorded, 2 to 3 minutes, along the loop; any persona labelled illustrative (`docs/demo_video_script.md`). Not recorded yet.
- [ ] **Run the tests and the build on the commit you submit:** `python -m pytest -q tests` and `python scripts/build_site.py`.
- [ ] **README is accurate.** Check these against the repo on the day: the "Status" section (updated 2026-11-11; recheck it on the day) and the counts it quotes (676 sourced rows, 72 flags, 605 of 706 located).

## Say plainly, or do not say at all
- [ ] **Q&A agent:** the data-only fallback in `agent/` was run through all six questions on 2026-11-11 and its answers were read and checked (`docs/agentfoundry_run_sheet.md`, `tests/test_agent_fallback.py`). **Model mode (Gemini or Anthropic) has not been tested** (no API key), and AgentFoundry itself was not used. Say "answers from the data, with sources", and do not say "AI assistant" unless model mode was run and its six answers read. It is **not hosted**: a static site cannot run it, so the deployed Ask page stays on "not connected yet" until someone hosts it and sets `ALLOWED_ORIGINS` (`agent/README.md`). (The setup doc still says Kerala has three flagged years; the data has four.)
- [ ] **User tests:** report the real number of sessions run (today **0**, `docs/user_tests.md`). If fewer than 20, say the real number.
- [ ] **Ward reports and badges** are unverified, stored only on each person's device. Not tested: scanning a printed QR code on a phone.
- [ ] **Translations** (Hindi, Telugu) are a first draft, not reviewed by a native speaker.
- [ ] **Map outlines** are simplified and not an authoritative boundary (`docs/map.md`).
- [ ] **Nearest drop-off** comes from OpenStreetMap, which is incomplete; the page shows the counts.

## Team and process
- [ ] Everyone has pushed under their own git identity; agree before pushing to the shared repo.
- [ ] Whoever owns each MUST item has confirmed it in the deployed app, not only locally.
- [ ] By-hand publishing steps that stay with the team: choose the data licence, fill author names, send the permission requests, upload to Zenodo.
