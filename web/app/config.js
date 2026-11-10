/* Deployment settings. Leave agentEndpoint empty until the Q&A agent is live on AgentFoundry (see docs/agentfoundry_setup.md).
   Assumed contract (change askAgent() in app.js if AgentFoundry differs): POST JSON {message, language} -> JSON {reply}, or plain text. */
window.KS_CONFIG = { agentEndpoint: "" };
