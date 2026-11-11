/* Deployment settings. Leave agentEndpoint empty until a Q&A agent is reachable from the browser: the Ask page then shows "not connected yet".
   Contract (askAgent() in app.js): POST JSON {question, message, language: "en"|"hi"|"ta"|"te"} -> JSON {answer, sources: [{document}]}; "reply" or "response" are read too, and plain text works.
   The agent in agent/ (see agent/README.md) uses this contract; it must allow this site's origin through ALLOWED_ORIGINS. A static host cannot run it: it needs its own host. */
window.KS_CONFIG = { agentEndpoint: "" };
