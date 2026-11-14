# Deploy to a public URL

Status: **live on Render** at https://kachra-satya.onrender.com (Option C below), deployed from `main` at commit `49890a0` (merge of pull request 8). First checked 2026-11-12; see "What was checked on the live site". The GitHub Pages workflow (Option A) has not been run and is not needed while Render serves the site.

**Open decision:** the live site already serves the receipt page images (`/receipts/pages/...`), which are copies of pages from government documents, while the licence decision in `docs/licences.md` is still open and no permission request has been sent. See "Check before publishing", item 1.

## What gets published
On Render the build first runs `python scripts/export_web_data.py`, which rebuilds `web/trust/data.js` from the CSVs, so a CSV edit always reaches the site (a test also fails if the committed `data.js` drifts). `python scripts/build_site.py` writes `dist/` with `web/` and `receipts/` only (page images, `index.json`, `NOTICE.md`) plus a root `index.html` that redirects to the app. It does **not** copy `data/raw/` (the source documents) or the CSVs: the app reads everything from `web/trust/data.js`. All paths are relative, so it works at a domain root or under a project path such as `https://<owner>.github.io/kachra-satya/`.

## Option A: GitHub Pages from this repo (set up, not run)
`.github/workflows/pages.yml` builds and deploys `dist/`. It is **manual only** (`workflow_dispatch`), so merging it publishes nothing.
1. A repository admin opens **Settings, Pages** and sets the source to **GitHub Actions** (one time).
2. After the change is on `main`: **Actions, Deploy site (manual), Run workflow.**
3. The run prints the URL. Put it in the README and the video.
Checked on 2026-11-11: the built `dist/` served under a sub-path (`/kachra-satya/`) loads every file with no 4xx errors, keeps `#/route` links through the root redirect, and does not publish `data/`, `agent/` or any `.env`. Not tested: this workflow has never run, and Pages has not been enabled. The repository owner is `SriyaMeenakshi`, so the admin step is theirs.

## Option B: any static host
Run `python scripts/build_site.py`, then upload `dist/` (Netlify drop, Cloudflare Pages, a school server). No `_redirects` or server config is needed: the root `index.html` redirect is plain HTML and keeps `#/route` links.

## Option C: everything as one service on Render (live)
`agent/app.py` can also serve the built website. If `dist/` exists next to it, the same Flask server answers `POST /ask` and serves the pages, so there is one address, no CORS setting and no second service. It serves only the files inside `dist/` (no CSVs, no source documents, no `agent/` code, no `.env`), and it answers `/web/app/config.js` itself with `agentEndpoint: "/ask"`, so the Ask page connects without editing `config.js`. `SERVE_SITE=0` turns this off. `tests/test_agent_serves_site.py` checks all of this.
`render.yaml` describes the service. Steps:
1. Render dashboard, **New, Blueprint**, pick this repo and the branch to deploy. When asked for `MODEL_API_KEY`, paste your key (or leave it empty for lookup-only mode).
2. Render runs `pip install -r agent/requirements.txt && python scripts/build_site.py`, then `gunicorn --chdir agent app:app`. The first build takes a few minutes.
3. Open `https://<name>.onrender.com/health`, then the root address, then the Ask page.
The Blueprint ran on Render on 2026-11-12 and created the web service `kachra-satya` on the free plan, with `PYTHON_VERSION` 3.12.7, `MODEL_PROVIDER` gemini and `MODEL_API_KEY` entered in the dashboard (never in git). Each push to `main` redeploys it.
**Model name.** The agent's default model is `gemini-3.8-flash`. On 2026-11-12 Google returned `503 UNAVAILABLE ... high demand` for it, and the agent fell back to data-only answers for 60 seconds at a time (`kachra.gemini ... cooldown` in the Render logs). The service answered in model mode again after the owner set a `GEMINI_MODEL` environment variable in Render (service, **Environment**) to another model that the key can use. Look the current value up in Render, not here. To list the models a key can use, run `genai.Client(api_key=...).models.list()` in your own terminal and keep the key out of chat and out of git.
Trade-off: a free Render web service sleeps after about 15 minutes idle, so the first visit afterwards can take around a minute for the whole site. Open `https://kachra-satya.onrender.com/health` just before a demo or a user test. In the 2026-11-12 checks a model answer took about 5 to 13 seconds and a data lookup under a second.
To change the settings later (for example the key or provider): the service, **Environment**, edit, **Save**; Render redeploys.

## What was checked on the live site (2026-11-12, desktop browser pane)
- `/health` returned `ok` with `gemini` as the model provider.
- Nine routes loaded with no console errors: Start, Map, Check a claim, Gaps (money vs mess), Your city, Your ward, Get help (complaint), Explore (audit) and Ask. A receipt page image loaded.
- Not published (each returned 404): `/data/waste_clean.csv`, `/data/raw/...` source PDFs, `/agent/app.py`, `/.env`, `/render.yaml`, `/scripts/build_site.py`.
- The Ask page connects by itself (`agentEndpoint` is `/ask`). In model mode it answered a question about Kerala in Hindi, Tamil and Telugu, each time in that language, with sources and page numbers. A data lookup ("which states have the biggest gap") answered from the tools. An off-topic question was refused ("I only answer questions about India's municipal solid waste figures").
- **Not checked:** a phone, light and dark themes, the printed ward QR code, the six acceptance questions in `docs/agentfoundry_run_sheet.md` run in model mode, answers in a language read by a native speaker, and behaviour under many visitors at once.

## Check before publishing (these are decisions for people, not code)
1. **Page images.** `receipts/pages/` are unchanged copies of pages from published government documents. Publishing them on a public site is a release of that material. `docs/licences.md` says reuse terms for most sources are not confirmed, and the team decided to keep publishing them with attribution (`docs/licences.md`). Decide, with the team, whether to keep publishing them with the attribution notices (`receipts/NOTICE.md`) or take them down until replies arrive. **They are already live on https://kachra-satya.onrender.com**, so this is now a decision to keep or reverse, not one to make in advance. The site's footer already says rights stay with each publisher and that we are not affiliated with any of them.
2. **The Q&A agent** (`agent/`) is a Flask server, so GitHub Pages cannot run it. On Render it runs in the same service as the site (Option C). On a static host the Ask page shows "not connected yet" until `agentEndpoint` in `web/app/config.js` points at a hosted agent whose `ALLOWED_ORIGINS` includes the site. Never put an API key in the web files or the repo: keys belong only in the agent's environment (Render's Environment tab). **If a key ever appears in chat, a commit or a screenshot, revoke it in Google AI Studio and enter a new one in Render.**
3. **Run `python -m pytest -q tests` and `python scripts/build_site.py`** on the commit you deploy.
4. **Open the deployed URL** on a phone, in light and dark, and click through Start, Map, Check a claim and one source page. (Not done yet; see "What was checked on the live site".)
5. **User reports** (ward taps, logs, drafts) stay in each person's own browser; there is no server. Say that if asked.

## Sign-in and shared ward totals (added 2026-11-13, not switched on)
`render.yaml` now lists three more settings. Sign-in stays off until the first is filled in.
- `GOOGLE_CLIENT_ID`: an OAuth client of type "Web application" from the Google Cloud console, with `https://kachra-satya.onrender.com` as an authorised JavaScript origin.
- `KS_SECRET`: generated by Render.
- `DATABASE_URL`: a PostgreSQL connection string. The free web service's own disk is wiped on every deploy, so the default SQLite file would lose every report.
`agent/requirements.txt` adds `psycopg2-binary` for PostgreSQL. Steps and limits: [sign_in.md](sign_in.md). Not yet run against a real Google client or database.

## After the next push
The live site is built from `main`. This round changes the icon, the fonts, the languages and the ward page. After a push, open the live site, hard-refresh, and check: the header shows the new bin icon, Telugu changes the whole page, a ward page shows "Case file for this ward", and the ward's shared total says it is not switched on.

