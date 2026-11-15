/* The Join page (#/join): one short form so the team can count its users and write back. Optional, and separate from the ward taps.
   It posts to agent/accounts.py (/api/signup) on the same server as the Ask page, and shows the public count from /api/signup/count.
   On a static copy with no server the page says so and sends nothing. Nothing is sent until the person presses Join. */
(function (root) {
  var ROLES = [["resident", "Resident"], ["student", "Student or teacher"], ["journalist", "Journalist"], ["official", "Ward or city official"], ["researcher", "Researcher"], ["ngo", "NGO or waste worker"], ["other", "Other"]];
  function base() { var e = (root.KS_CONFIG && root.KS_CONFIG.agentEndpoint) || ""; return e ? e.replace(/\/ask\/?$/, "") : null; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function t(k, d) { return root.KSi18n ? root.KSi18n.t(k, d) : d; }

  /* what the form must have before it is sent: pure, so the tests can run it. Returns a message, or "" when fine. */
  function problem(v) {
    if (!v || String(v.name || "").trim().length < 2) return "Please enter your name.";
    if (!/^[^@\s]{1,64}@[^@\s]{1,190}\.[^@\s]{2,24}$/.test(String(v.email || "").trim())) return "That email address does not look right.";
    if (v.consent !== true) return "Please tick the box to say we may keep these details.";
    return "";
  }

  /* the details fields, shared by the Join form and the My details form */
  function detailFields(v) {
    v = v || {};
    var opts = ROLES.map(function (r) { return '<option value="' + r[0] + '"' + (v.role === r[0] ? " selected" : "") + ">" + esc(r[1]) + "</option>"; }).join("");
    var lg = ["en", "hi", "te", "other"], ln = ["English", "हिन्दी", "తెలుగు", "Other"];
    return '<label for="jn">Your name</label><input id="jn" name="name" type="text" autocomplete="name" maxlength="80" required value="' + esc(v.name) + '">' +
      '<label for="jr">I am a</label><select id="jr" name="role">' + opts + '</select>' +
      '<div class="join-two"><div><label for="js">State</label><input id="js" name="state" type="text" autocomplete="address-level1" maxlength="60" value="' + esc(v.state) + '"></div>' +
      '<div><label for="jc">City or ward</label><input id="jc" name="city" type="text" autocomplete="address-level2" maxlength="80" value="' + esc(v.city) + '"></div></div>' +
      '<label for="jl">Language I prefer</label><select id="jl" name="language">' + lg.map(function (c, i) { return '<option value="' + c + '"' + (v.language === c ? " selected" : "") + ">" + ln[i] + "</option>"; }).join("") + "</select>" +
      '<label for="jh">How did you hear about us? (optional)</label><input id="jh" name="source" type="text" maxlength="120" value="' + esc(v.source) + '">';
  }

  /* ---------- My details (#/me): a signed-in person edits what they gave on the Join page ---------- */
  function renderMe() {
    var view = document.getElementById("view"), A = root.KSAccount;
    function say(html) {
      view.innerHTML = '<div class="join"><h2>My details</h2>' + html + (A && A.signedIn() ? '<p><button type="button" class="alt" id="msignout">Sign out</button></p>' : "") + "</div>";
      var so = document.getElementById("msignout");
      if (so) so.onclick = function () { A.signOut(); try { localStorage.removeItem("ks-joined"); } catch (e) {} try { root.dispatchEvent(new Event("ks-auth")); } catch (e2) {} location.hash = "#/start"; };
    }
    if (base() === null) { say('<div class="card"><p>This copy of the site has no server.</p></div>'); return; }
    if (!A || !A.signedIn()) { say('<p class="sub">Sign in to see and change the details you gave us.</p><div class="card"><p><a class="go" href="#/join">Sign in or join</a></p></div>'); return; }
    say('<p class="sub">Loading your details&hellip;</p>');
    A.profile().then(function (p) {
      say('<p class="sub">These are the details you gave on the Join page. Change them any time.</p>' +
        '<form class="card join-form" id="mform" novalidate><label>Email (from Google, cannot be changed)</label><p class="join-em">' + esc(p.email) + "</p>" + detailFields(p) +
        '<p class="join-err" id="merr" role="alert" hidden></p><p class="join-ok-msg" id="mok" role="status" hidden>Saved.</p>' +
        '<div class="join-acts"><button type="submit" class="go">Save</button><button type="button" class="alt" id="mdel">Delete my details</button></div></form>');
      var f = document.getElementById("mform");
      f.addEventListener("submit", function (e) {
        e.preventDefault(); var x = f.elements, v = { name: x.name.value, role: x.role.value, state: x.state.value, city: x.city.value, language: x.language.value, source: x.source.value };
        var m = document.getElementById("merr"), ok = document.getElementById("mok"); m.hidden = ok.hidden = true;
        if (v.name.trim().length < 2) { m.hidden = false; m.textContent = "Please enter your name."; return; }
        A.saveProfile(v).then(function () { ok.hidden = false; }, function (er) { m.hidden = false; m.textContent = er.message; });
      });
      document.getElementById("mdel").onclick = function () {
        if (!confirm("Delete the details you gave on the Join page? Your sign-in and ward taps are not affected.")) return;
        A.deleteProfile().then(function () { say('<div class="card"><h3>Your details are deleted.</h3><p><a href="#/start">Back to Home</a></p></div>'); }, function (er) { var m = document.getElementById("merr"); m.hidden = false; m.textContent = er.message; });
      };
    }, function (er) {
      if (er.status === 404) say('<p class="sub">You are signed in, but you have not joined yet.</p><div class="card"><p>Fill in the Join form, using the Google button, and your details will appear here.</p><p><a class="go" href="#/join">Go to the Join page</a></p></div>');
      else say('<div class="card"><p>' + esc(er.message) + "</p></div>");
    });
  }

  function render() {
    var view = document.getElementById("view"), b = base(), lang = root.KSi18n ? root.KSi18n.lang() : "en";
    view.innerHTML = '<div class="join"><h2>Join Kachra Satya</h2>' +
      '<p class="sub">Tell us who you are so we can count the people using this and write back when something changes. It takes under a minute.</p>' +
            (b === null ? '<div class="card"><p>This copy of the site has no server, so it cannot take sign-ups. The live site can: <a href="https://kachra-satya.onrender.com/web/app/index.html#/join">kachra-satya.onrender.com</a>.</p></div>' :
      '<form class="card join-form" id="jform" novalidate>' +
        '<div class="join-g" id="jgw"><div id="jg"></div></div><p class="join-or" id="jgn" hidden>or</p>' +
        '<label for="je">Email</label><input id="je" name="email" type="email" autocomplete="email" maxlength="254" required>' + detailFields() +
        '<div class="join-hp" aria-hidden="true"><label for="jw">Leave this empty</label><input id="jw" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
        '<label class="join-ok"><input id="jok" type="checkbox"> <span>I agree that Kachra Satya may keep these details to count its users and to email me about this project. They are never shown to anyone, never sold, and not linked to my ward taps. I can ask for them to be deleted.</span></label>' +
        '<p class="join-err" id="jerr" role="alert" hidden></p>' +
        '<button type="submit" class="go" id="jgo">Join</button></form>' +
        '<div class="card" id="jdone" hidden><h3>You are in. Thank you.</h3><p id="jdonet"></p><p><a href="#/start">Back to Home</a></p></div>') +
      "</div>";
    if (b === null) return;
    var sel = document.getElementById("jl"); if (sel && ["en", "hi", "te"].indexOf(lang) >= 0) sel.value = lang;
    var cred = "", form = document.getElementById("jform"), err = document.getElementById("jerr");
    if (root.KSAccount) KSAccount.button(document.getElementById("jg"), function () {}, function (c) {
      var g = KSAccount.claims(c); cred = c; if (g.name) form.elements.name.value = g.name; if (g.email) { form.elements.email.value = g.email; form.elements.email.readOnly = true; }
    }).then(function () { document.getElementById("jgn").hidden = false; }, function () { var g = document.getElementById("jgw"); if (g) g.hidden = true; });      /* no Google on this site: just the form */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements, v = { name: f.name.value, email: f.email.value, role: f.role.value, state: f.state.value, city: f.city.value, language: f.language.value, source: f.source.value, website: f.website.value, credential: cred, consent: document.getElementById("jok").checked };
      var p = problem(v); err.hidden = !p; err.textContent = p; if (p) return;
      var go = document.getElementById("jgo"); go.disabled = true;
      fetch(b + "/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "The server did not accept that."); return j; }); })
        .then(function (j) {
          try { localStorage.setItem("ks-joined", String(v.name || "").trim().split(/\s+/)[0].slice(0, 30)); } catch (e2) {}      /* the header now shows this name instead of Join */
          try { root.dispatchEvent(new Event("ks-auth")); } catch (e3) {}
          setTimeout(function () { if (location.hash === "#/join") location.hash = "#/start"; }, 1500);      /* then back to Home */
          form.hidden = true; document.getElementById("jdone").hidden = false;
          document.getElementById("jdonet").textContent = j.already ? "That email was already on the list, so we updated your details." : "We have your details.";
          document.getElementById("jdone").querySelector("h3").setAttribute("tabindex", "-1"); document.getElementById("jdone").querySelector("h3").focus();
        })
        .catch(function (x) { err.hidden = false; err.textContent = x.message || "Could not reach the server. Please try again."; go.disabled = false; });
    });
  }

  /* ---------- the team dashboard (#/team): the numbers, behind the admin key. The key is typed in, kept only in this tab's memory, and sent as a header. ---------- */
  function bars(obj) {
    var k = Object.keys(obj), max = Math.max.apply(null, k.map(function (x) { return obj[x]; }).concat([1]));
    return k.length ? '<ul class="tm-bars">' + k.map(function (x) { return '<li><span>' + esc(x) + '</span><i style="width:' + Math.round(obj[x] / max * 100) + '%"></i><b>' + obj[x] + "</b></li>"; }).join("") + "</ul>" : "<p>No one yet.</p>";
  }
  function dash(d) {
    return '<div class="tm-stats"><div class="card"><b>' + d.count + '</b><span>joined with details</span></div><div class="card"><b>' + d.signed_in + '</b><span>signed in with Google</span></div></div>' +
      '<div class="tm-grid"><div class="card"><h3>By role</h3>' + bars(d.by_role) + '</div><div class="card"><h3>By state</h3>' + bars(d.by_state) + '</div><div class="card"><h3>By language</h3>' + bars(d.by_language) + '</div></div>' +
      '<div class="card"><h3>Latest sign-ups</h3><table class="tm-t"><thead><tr><th>When</th><th>Name</th><th>Role</th><th>Where</th></tr></thead><tbody>' +
      (d.recent || []).map(function (r) { return "<tr><td>" + esc(r.joined_at.slice(0, 16).replace("T", " ")) + "</td><td>" + esc(r.name) + "</td><td>" + esc(r.role) + "</td><td>" + esc([r.city, r.state].filter(Boolean).join(", ")) + "</td></tr>"; }).join("") + '</tbody></table><p><button type="button" class="alt" id="tcsv">Download full list (CSV)</button></p></div>';
  }
  function renderTeam() {
    var view = document.getElementById("view"), b = base(), key = "";
    view.innerHTML = '<div class="team"><h2>Team dashboard</h2><p class="sub">How many people have joined, and who they are. For the team only: enter the admin key.</p>' +
      (b === null ? '<div class="card"><p>This copy of the site has no server.</p></div>' : '<form class="card join-form" id="tform"><label for="tk">Admin key</label><input id="tk" type="password" autocomplete="off"><p class="join-err" id="terr" role="alert" hidden></p><button type="submit" class="go">Show the numbers</button></form><div id="tout"></div>') + "</div>";
    if (b === null) return;
    function load() {
      return fetch(b + "/api/signups?format=json", { headers: { "X-Admin-Key": key } }).then(function (r) { if (!r.ok) throw new Error("That key was not accepted, or the team list is not switched on."); return r.json(); });
    }
    document.getElementById("tform").addEventListener("submit", function (e) {
      e.preventDefault(); key = document.getElementById("tk").value; var err = document.getElementById("terr"); err.hidden = true;
      load().then(function (d) {
        document.getElementById("tform").hidden = true; document.getElementById("tout").innerHTML = dash(d);
        document.getElementById("tcsv").onclick = function () {
          fetch(b + "/api/signups", { headers: { "X-Admin-Key": key } }).then(function (r) { return r.blob(); }).then(function (bl) { var a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = "kachra-satya-signups.csv"; a.click(); });
        };
      }).catch(function (x) { err.hidden = false; err.textContent = x.message; });
    });
  }

  var api = { render: render, renderTeam: renderTeam, renderMe: renderMe, problem: problem, ROLES: ROLES };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSJoin = api;
})(typeof window !== "undefined" ? window : this);
