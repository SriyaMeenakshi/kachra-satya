# Submission checklist (15 Nov 2026)

Status as of 2026-11-15 (submission day). Tick an item only when you have done it and seen it with your own eyes. "Not done" is the honest default. Items ticked on 2026-11-15 below were reported by the team or run by the assistant, as each line says.

## Must be true before you submit
- [ ] **Re-read the hackathon's current track list and rules** (Code for a Billion, Waste Management track) and confirm the submission format and deadline. Nobody on the team has recorded the rules in this repo, so do it from the official page and paste the link here: ______
- [x] **Public URL is live** and opens on a phone (team reported a phone test on 2026-11-15): Start, Map, Check a claim, one source page. Live at https://kachra-satya.onrender.com since 2026-11-12 and checked in a desktop browser (`docs/deploy.md`, "What was checked on the live site"). On 2026-11-14 eleven routes also loaded cleanly at phone width in a browser emulation. Opened on a real phone by the team on 2026-11-15.
- [ ] **Decide about publishing the page images** (`receipts/pages/`, copies of pages from government documents). **They are already live** on the Render site. Reuse terms are not confirmed (`docs/licences.md`). The team decided to use these public records with attribution; no permission requests were sent. Decide to keep them (with the attribution notices) or take them down.
- [x] **Demo video** recorded, 2 to 3 minutes, along the loop; any persona labelled illustrative (`docs/demo_video_script.md`). The team reported on 2026-11-15 that it is recorded; put its link here: ______
- [x] **Run the tests and the build on the commit you submit:** `python -m pytest -q tests` and `python scripts/build_site.py`. Run on 2026-11-15 on `main` after the AgentFoundry docs merge: 191 passed, and the build wrote 95 files. Run them again if anything is pushed after this.
- [x] **README is accurate.** Rewritten on 2026-11-15 (the Status section was removed); the counts it quotes are 676 sourced rows, 72 flags, 605 of 706 located, 191 tests. Recheck them if the data changes.

## Say plainly, or do not say at all
- [ ] **Q&A agent:** the data-only fallback in `agent/` was run through all six questions on 2026-11-11 and its answers were read and checked (`docs/agentfoundry_run_sheet.md`, `tests/test_agent_fallback.py`). **All six acceptance questions were run in model mode on the live site on 2026-11-14 and every answer was read: 5 clean passes, and question 1 (Kerala) gives the figures but does not say treated is above collected. One Tamil-script gap question fell back to data-only mode every time (`docs/agentfoundry_run_sheet.md`).** Earlier, on 2026-11-12: a Kerala question in Hindi, Tamil and Telugu was answered in each language with sources and page numbers, and an off-topic question was refused. The six acceptance questions were **not** re-run in model mode, and AgentFoundry itself was not used. Do not call it an "AI assistant" until those six answers are read; "answers from the data, with sources" is accurate today. The agent is hosted on Render in the same service as the site (`docs/deploy.md`). Google returned 503 "high demand" for the default model that day, so keep the data-only fallback in mind during a demo. (The setup doc still says Kerala has three flagged years; the data has four.)
- [ ] **User tests:** report the real number. The team counts **about 35 people** who tried the app (reported 2026-11-15, including on phones), but the per-session notes are not yet in `data/user_tests.csv`, so `docs/user_tests.md` still shows 0 recorded sessions. Say "about 35 people tried it", not "35 recorded sessions", until the notes are entered.
- [ ] **Ward reports and badges** are unverified, stored only on each person's device. Not tested: scanning a printed QR code on a phone.
- [x] **Translations:** Hindi read by Yasaswini and Telugu by Sriya on 2026-11-15, both found good; a teammate's read, not an independent or professional review. Tamil (bin-guide stream names and Ask answers) was reviewed by the team on 2026-11-15 as well. Say this, not "professionally translated".
- [ ] **Map outlines** are simplified and not an authoritative boundary (`docs/map.md`).
- [ ] **Nearest drop-off** comes from OpenStreetMap, which is incomplete; the page shows the counts.

## Added 2026-11-15
- [x] **Join page, My details and the team dashboard** are live; 15 people had joined and 15 had signed in with Google when the dashboard was last read (`docs/join_and_dashboard.md`).
- [x] **Neon PostgreSQL** holds the ward store and the Join list, and the admin key is set (reported by the team; the assistant confirmed from outside that the key opens `/api/signups`).
- [ ] **Change the admin key after judging.** It protects real names and emails.
- [ ] **Say plainly** that the Join list holds contact details given with consent, separate from the ward store, which holds none.

## Team and process
- [ ] Everyone has pushed under their own git identity; agree before pushing to the shared repo.
- [ ] Whoever owns each MUST item has confirmed it in the deployed app, not only locally.
- [ ] By-hand publishing steps that stay with the team: choose the data licence, fill author names, upload to Zenodo (permission requests are optional; see docs/licences.md).
