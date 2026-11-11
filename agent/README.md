Kachra Satya Q&A Web API Agent

One endpoint: POST /ask with {"question": "...", "language": "en"} that returns {"answer": "...", "sources": [...]}.

Requirements

- Python 3.10+
- See agent/requirements.txt

Setup

1. Install dependencies:
    python -m pip install -r agent/requirements.txt

2. Configure environment variables (either export them or create agent/.env):
    MODEL_PROVIDER=gemini  # or anthropic
    MODEL_API_KEY=your_api_key_here

   If you do not set MODEL_API_KEY, the server runs in fallback mode and will only use the lookup tools (no model).

Run locally

    python agent/app.py

This starts a Flask server on http://localhost:5000.

Test with curl

    curl -X POST http://localhost:5000/ask \
      -H "Content-Type: application/json" \
      -d '{"question": "Kerala treated vs collected", "language": "en"}'

Acceptance test

Follow docs/agentfoundry_run_sheet.md. The six questions are listed in docs/agentfoundry_setup.md. Use the same phrasing and language when testing.

Notes

- The system prompt is taken verbatim from docs/agentfoundry_setup.md (via scripts/qa_agent.py).
- The existing tools from scripts/qa_agent.py are used (run_tool import). Do not modify scripts/ or data/.
- CORS allows all origins. Change CORS(app, origins="*") in agent/app.py to restrict it to your website.
- No API keys are written to disk by this code.

If you want changes, tell me which piece to adjust.
