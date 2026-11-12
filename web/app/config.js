/* Deployment settings. Leave agentEndpoint empty until a Q&A agent is reachable from the browser: the Ask page then shows "not connected yet".
   Contract (askAgent() in app.js): POST JSON {question, message, language: "en"|"hi"|"ta"|"te"} -> JSON {answer, sources: [{document}]}; "reply" or "response" are read too, and plain text works.
   The agent in agent/ (see agent/README.md) uses this contract; it must allow this site's origin through ALLOWED_ORIGINS. A static host cannot run it: it needs its own host.
   On your own computer (the page opened from 127.0.0.1 or localhost, not served by the agent itself) it points at the agent's default address, so Ask works as soon as you
   run:  ALLOWED_ORIGINS=http://127.0.0.1:8777 python agent/app.py   (set it as an environment variable first on Windows). Any deployed site keeps the empty default. */
(function () {
  var h = location.hostname, local = h === "127.0.0.1" || h === "localhost" || h === "[::1]";
  window.KS_CONFIG = { agentEndpoint: local && location.port !== "5000" ? "http://127.0.0.1:5000/ask" : "" };
})();
