# Submission checklist (15 Nov 2026)

Status as of 2026-11-12. Tick an item only when you have done it and seen it with your own eyes. "Not done" is the honest default.

## Must be true before you submit
- [ ] **Re-read the hackathon's current track list and rules** (Code for a Billion, Waste Management track) and confirm the submission format and deadline. Nobody on the team has recorded the rules in this repo, so do it from the official page and paste the link here: ______
- [ ] **Public URL is live** and opens on a phone: Start, Map, Check a claim, one source page. Live at https://kachra-satya.onrender.com since 2026-11-12 and checked in a desktop browser (`docs/deploy.md`, "What was checked on the live site"). **Not yet opened on a phone**, so this stays unticked.
- [ ] **Decide about publishing the page images** (`receipts/pages/`, copies of pages from government documents). **They are already live** on the Render site. Reuse terms are not confirmed (`docs/licences.md`). The team decided to use these public records with attribution; no permission requests were sent. Decide to keep them (with the attribution notices) or take them down.
- [ ] **Demo video** recorded, 2 to 3 minutes, along the loop; any persona labelled illustrative (`docs/demo_video_script.md`). Not recorded yet.
- [ ] **Run the tests and the build on the commit you submit:** `python -m pytest -q tests` and `python scripts/build_site.py`.
- [ ] **README is accurate.** Check these against the repo on the day: the "Status" section (updated 2026-11-11; recheck it on the day) and the counts it quotes (676 sourced rows, 72 flags, 605 of 706 located).

## Say plainly, or do not say at all
- [ ] **Q&A agent:** the data-only fallback in `agent/` was run through all six questions on 2026-11-11 and its answers were read and checked (`docs/agentfoundry_run_sheet.md`, `tests/test_agent_fallback.py`). **Model mode (Gemini) has now run on the live site** (2026-11-12): a Kerala question in Hindi, Tamil and Telugu was answered in each language with sources and page numbers, and an off-topic question was refused. The six acceptance questions were **not** re-run in model mode, and AgentFoundry itself was not used. Do not call it an "AI assistant" until those six answers are read; "answers from the data, with sources" is accurate today. The agent is hosted on Render in the same service as the site (`docs/deploy.md`). Google returned 503 "high demand" for the default model that day, so keep the data-only fallback in mind during a demo. (The setup doc still says Kerala has three flagged years; the data has four.)
- [ ] **User tests:** report the real number of sessions run (today **0**, `docs/user_tests.md`). If fewer than 20, say the real number.
- [ ] **Ward reports and badges** are unverified, stored only on each person's device. Not tested: scanning a printed QR code on a phone.
- [ ] **Translations** (Hindi, Telugu) are a first draft, not reviewed by a native speaker.
- [ ] **Map outlines** are simplified and not an authoritative boundary (`docs/map.md`).
- [ ] **Nearest drop-off** comes from OpenStreetMap, which is incomplete; the page shows the counts.

## Team and process
- [ ] Everyone has pushed under their own git identity; agree before pushing to the shared repo.
- [ ] Whoever owns each MUST item has confirmed it in the deployed app, not only locally.
- [ ] By-hand publishing steps that stay with the team: choose the data licence, fill author names, upload to Zenodo (permission requests are optional; see docs/licences.md).
