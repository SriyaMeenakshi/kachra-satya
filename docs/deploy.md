# Deploy to a public URL

Status: **not deployed.** Nothing here has been published. This page is the plan and the checks to make before pressing the button.

## What gets published
`python scripts/build_site.py` writes `dist/` with `web/` and `receipts/` only (page images, `index.json`, `NOTICE.md`) plus a root `index.html` that redirects to the app. It does **not** copy `data/raw/` (the source documents) or the CSVs: the app reads everything from `web/trust/data.js`. All paths are relative, so it works at a domain root or under a project path such as `https://<owner>.github.io/kachra-satya/`.

## Option A: GitHub Pages from this repo (set up, not run)
`.github/workflows/pages.yml` builds and deploys `dist/`. It is **manual only** (`workflow_dispatch`), so merging it publishes nothing.
1. A repository admin opens **Settings, Pages** and sets the source to **GitHub Actions** (one time).
2. After the change is on `main`: **Actions, Deploy site (manual), Run workflow.**
3. The run prints the URL. Put it in the README and the video.
Not tested: this workflow has never run, and Pages has not been enabled. The repository owner is `SriyaMeenakshi`, so the admin step is theirs.

## Option B: any static host
Run `python scripts/build_site.py`, then upload `dist/` (Netlify drop, Cloudflare Pages, a school server). No `_redirects` or server config is needed: the root `index.html` redirect is plain HTML and keeps `#/route` links.

## Check before publishing (these are decisions for people, not code)
1. **Page images.** `receipts/pages/` are unchanged copies of pages from published government documents. Publishing them on a public site is a release of that material. `docs/licences.md` says reuse terms for most sources are not confirmed, and `docs/permission_requests.md` (drafts, not sent) is the plan. Decide, with the team, whether to publish now with the attribution notices (`receipts/NOTICE.md`) or wait for replies. The site's footer already says rights stay with each publisher and that we are not affiliated with any of them.
2. **The Q&A agent** is not connected, so the Ask page shows "not connected yet". That is honest and fine for a first deploy; see `docs/agentfoundry_run_sheet.md`.
3. **Run `python -m pytest -q tests` and `python scripts/build_site.py`** on the commit you deploy.
4. **Open the deployed URL** on a phone, in light and dark, and click through Start, Map, Check a claim and one source page.
5. **User reports** (ward taps, logs, drafts) stay in each person's own browser; there is no server. Say that if asked.
