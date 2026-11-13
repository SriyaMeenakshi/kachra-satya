/* Sign-in with Google and the shared ward total. Talks to agent/accounts.py on the same server as the Ask page.
   Nothing here runs until a person chooses to share: Google's script is loaded only after they press "Turn on sharing".
   Kept on this device: the session token and the first name Google shows (for the "Signed in as" line). The server stores neither name nor email.
   If the site has no server (a static copy) or sign-in is not switched on, KSAccount.available() is false and the ward page says so. */
(function (root) {
  var TOKEN = "ks-token", NAME = "ks-name", cfg = null;
  function base() { var e = (root.KS_CONFIG && root.KS_CONFIG.agentEndpoint) || ""; return e ? e.replace(/\/ask\/?$/, "") : null; }      /* null: no server at all */
  function get(k) { try { return localStorage.getItem(k) || ""; } catch (e) { return ""; } }
  function set(k, v) { try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch (e) {} }
  function token() { return get(TOKEN); }
  function name() { return get(NAME); }
  function signedIn() { return !!token(); }
  function signOut() { set(TOKEN, ""); set(NAME, ""); try { if (root.google && root.google.accounts) root.google.accounts.id.disableAutoSelect(); } catch (e) {} }

  function call(method, path, body, auth) {
    var b = base(); if (b === null) return Promise.reject(new Error("no server"));
    var h = {}; if (body) h["Content-Type"] = "application/json"; if (auth) h.Authorization = "Bearer " + token();
    return fetch(b + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (r.status === 401 && auth) signOut();      /* the session ended: go back to signed out */
        if (!r.ok) { var e = new Error(j.error || "The server did not accept that."); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  /* is sign-in switched on for this site? resolves to { signIn, clientId } and remembers it */
  function config() {
    if (cfg) return Promise.resolve(cfg);
    return call("GET", "/api/config").then(function (c) { cfg = c; return c; }, function () { cfg = { signIn: false, clientId: "" }; return cfg; });
  }
  function available() { return !!(cfg && cfg.signIn); }

  /* the first name in a Google ID token, for display on this device only */
  function firstName(credential) {
    try { var p = credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"); var j = JSON.parse(decodeURIComponent(escape(atob(p)))); return String(j.given_name || j.name || "").slice(0, 40); } catch (e) { return ""; }
  }
  var gsi = null;
  function loadGoogle() {
    if (gsi) return gsi;
    gsi = new Promise(function (ok, bad) { var s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = ok; s.onerror = function () { gsi = null; bad(new Error("Could not reach Google.")); }; document.head.appendChild(s); });
    return gsi;
  }
  /* draw Google's own button inside el; done(err) is called after a sign-in attempt */
  function button(el, done) {
    return config().then(function (c) {
      if (!c.signIn) throw new Error("Sign-in is not switched on for this site.");
      return loadGoogle().then(function () {
        root.google.accounts.id.initialize({ client_id: c.clientId, auto_select: false, callback: function (resp) {
          call("POST", "/api/signin", { credential: resp.credential }).then(function (j) { set(TOKEN, j.token); set(NAME, firstName(resp.credential)); done(null); }, function (e) { done(e); });
        } });
        root.google.accounts.id.renderButton(el, { theme: "outline", size: "large", text: "signin_with", shape: "pill" });
      });
    });
  }

  function report(ward, date, status) { return call("POST", "/api/ward/report", { ward: ward, date: date, status: status }, true); }
  function summary(ward) { return call("GET", "/api/ward/summary?ward=" + encodeURIComponent(ward)); }
  function deleteMine() { return call("DELETE", "/api/me", null, true); }

  /* totals for the ward page, from a summary: pure, so the tests can run it */
  function tally(s) {
    var days = (s && s.days) || [], c = 0, n = 0, contested = 0;
    days.forEach(function (d) { c += d.collected || 0; n += d.not_collected || 0; if (d.collected && d.not_collected) contested++; });
    return { reporters: (s && s.reporters) || 0, days: days.length, collected: c, notCollected: n, contested: contested };
  }

  var api = { base: base, config: config, available: available, signedIn: signedIn, name: name, signOut: signOut, button: button, report: report, summary: summary, deleteMine: deleteMine, tally: tally, firstName: firstName };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSAccount = api;
})(typeof window !== "undefined" ? window : this);
