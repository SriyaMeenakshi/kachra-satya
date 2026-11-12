Kachra Satya Q&A Web API Agent

One endpoint: POST /ask with {"question": "...", "language": "en"} that returns {"answer": "...", "sources": [...]}.

Requirements

- Python 3.10+
- See agent/requirements.txt

Setup

1. Install dependencies:
    python -m pip install -r agent/requirements.txt

2. Configure environment variables (either export them or create agent/.env):
    MODEL_PROVIDER=gemini  # or grok (xAI) or anthropic
    # for Grok also optionally: GROK_MODEL (default grok-4; use a model your key can access) and GROK_BASE_URL (default https://api.x.ai/v1)
    MODEL_API_KEY=your_api_key_here

   If you do not set MODEL_API_KEY, the server runs in fallback mode and will only use the lookup tools (no model).

Run locally

    python agent/app.py

This starts a Flask server on http://localhost:5000.

Test with curl

    curl -X POST http://localhost:5000/ask \
      -H "Content-Type: application/json" \
      -d '{"question": "Kerala treated vs collected", "language": "en"}'

Connect the web app

1. Start the agent (above) and note its URL, for example `http://127.0.0.1:5000/ask`.
2. Put that URL in `web/app/config.js` (`agentEndpoint`). Leave it empty to keep the Ask page's honest "not connected yet" notice.
3. The Ask page sends `{"question", "message", "language": "en"|"hi"|"ta"|"te"}` and shows `answer` plus a "Sources:" line from `sources`.
4. **One service:** if `dist/` exists (`python scripts/build_site.py`), this server also serves the website and the Ask page uses `/ask` on the same address with no extra setting. `render.yaml` and `docs/deploy.md` (Option C) describe hosting it that way on Render.
5. A static site (GitHub Pages) cannot run this server. For a public Ask page the agent must be hosted somewhere (any host that runs Flask, behind a production server such as gunicorn, with `ALLOWED_ORIGINS` set to the public site). Until then keep `agentEndpoint` empty on the deployed site.

Acceptance test

Follow docs/agentfoundry_run_sheet.md. The six questions are listed in docs/agentfoundry_setup.md. Use the same phrasing and language when testing.

Notes

- The system prompt is taken verbatim from docs/agentfoundry_setup.md (via scripts/qa_agent.py).
- The existing tools from scripts/qa_agent.py are used (run_tool import). Do not modify scripts/ or data/.
- CORS is **restricted**: by default only `http://localhost` and `http://127.0.0.1` (no port) may call the API from a browser. Set `ALLOWED_ORIGINS` (comma-separated, exact origins including the port) to the site that hosts the web app, for example `ALLOWED_ORIGINS=http://127.0.0.1:8777` when the app is served with `python -m http.server 8777`, or `https://<owner>.github.io` for GitHub Pages. An origin not on the list is refused.
- No API keys are written to disk by this code.

If you want changes, tell me which piece to adjust.
