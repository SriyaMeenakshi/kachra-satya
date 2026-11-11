# Submission checklist (15 Nov 2026)

Status as of 2026-11-11. Tick an item only when you have done it and seen it with your own eyes. "Not done" is the honest default.

## Must be true before you submit
- [ ] **Re-read the hackathon's current track list and rules** (Code for a Billion, Waste Management track) and confirm the submission format and deadline. Nobody on the team has recorded the rules in this repo, so do it from the official page and paste the link here: ______
- [ ] **Public URL is live** and opens on a phone: Start, Map, Check a claim, one source page. See `docs/deploy.md`. Not deployed yet.
- [ ] **Decide about publishing the page images** (`receipts/pages/`, copies of pages from government documents). Reuse terms are not confirmed (`docs/licences.md`); permission requests are drafts and **not sent** (`docs/permission_requests.md`).
- [ ] **Demo video** recorded, 2 to 3 minutes, along the loop; any persona labelled illustrative (`docs/demo_video_script.md`). Not recorded yet.
- [ ] **Run the tests and the build on the commit you submit:** `python -m pytest -q tests` and `python scripts/build_site.py`.
- [ ] **README is accurate.** Check these against the repo on the day: the test count line, the "Status" section (it still says the integrated web app is not done), and the counts it quotes (676 sourced rows, 72 flags, 605 of 706 located).

## Say plainly, or do not say at all
- [ ] **Q&A agent:** say it is connected only if the six acceptance questions in `docs/agentfoundry_run_sheet.md` were run and passed. Today it is not created. (Also fix the Kerala question: the data has four flagged years, the setup doc says three.)
- [ ] **User tests:** report the real number of sessions run (today **0**, `docs/user_tests.md`). If fewer than 20, say the real number.
- [ ] **Ward reports and badges** are unverified, stored only on each person's device. Not tested: scanning a printed QR code on a phone.
- [ ] **Translations** (Hindi, Telugu) are a first draft, not reviewed by a native speaker.
- [ ] **Map outlines** are simplified and not an authoritative boundary (`docs/map.md`).
- [ ] **Nearest drop-off** comes from OpenStreetMap, which is incomplete; the page shows the counts.

## Team and process
- [ ] Everyone has pushed under their own git identity; agree before pushing to the shared repo.
- [ ] Whoever owns each MUST item has confirmed it in the deployed app, not only locally.
- [ ] By-hand publishing steps that stay with the team: choose the data licence, fill author names, send the permission requests, upload to Zenodo.
