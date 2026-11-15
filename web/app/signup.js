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

  function render() {
    var view = document.getElementById("view"), b = base(), lang = root.KSi18n ? root.KSi18n.lang() : "en";
    var opts = ROLES.map(function (r) { return '<option value="' + r[0] + '">' + esc(r[1]) + "</option>"; }).join("");
    view.innerHTML = '<div class="join"><h2>Join Kachra Satya</h2>' +
      '<p class="sub">Tell us who you are so we can count the people using this and write back when something changes. It takes under a minute.</p>' +
      '<p class="join-count" id="jcount" aria-live="polite" hidden></p>' +
      (b === null ? '<div class="card"><p>This copy of the site has no server, so it cannot take sign-ups. The live site can: <a href="https://kachra-satya.onrender.com/web/app/index.html#/join">kachra-satya.onrender.com</a>.</p></div>' :
      '<form class="card join-form" id="jform" novalidate>' +
        '<label for="jn">Your name</label><input id="jn" name="name" type="text" autocomplete="name" maxlength="80" required>' +
        '<label for="je">Email</label><input id="je" name="email" type="email" autocomplete="email" maxlength="254" required>' +
        '<label for="jr">I am a</label><select id="jr" name="role">' + opts + '</select>' +
        '<div class="join-two"><div><label for="js">State</label><input id="js" name="state" type="text" autocomplete="address-level1" maxlength="60"></div>' +
        '<div><label for="jc">City or ward</label><input id="jc" name="city" type="text" autocomplete="address-level2" maxlength="80"></div></div>' +
        '<label for="jl">Language I prefer</label><select id="jl" name="language"><option value="en">English</option><option value="hi">हिन्दी</option><option value="te">తెలుగు</option><option value="other">Other</option></select>' +
        '<label for="jh">How did you hear about us? (optional)</label><input id="jh" name="source" type="text" maxlength="120">' +
        '<div class="join-hp" aria-hidden="true"><label for="jw">Leave this empty</label><input id="jw" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
        '<label class="join-ok"><input id="jok" type="checkbox"> <span>I agree that Kachra Satya may keep these details to count its users and to email me about this project. They are never shown to anyone, never sold, and not linked to my ward taps. I can ask for them to be deleted.</span></label>' +
        '<p class="join-err" id="jerr" role="alert" hidden></p>' +
        '<button type="submit" class="go" id="jgo">Join</button></form>' +
        '<div class="card" id="jdone" hidden><h3>You are in. Thank you.</h3><p id="jdonet"></p><p><a href="#/start">Back to Home</a></p></div>') +
      "</div>";
    if (b === null) return;
    var sel = document.getElementById("jl"); if (sel && ["en", "hi", "te"].indexOf(lang) >= 0) sel.value = lang;
    fetch(b + "/api/signup/count").then(function (r) { return r.json(); }).then(function (j) {
      var el = document.getElementById("jcount"); if (el && typeof j.count === "number" && j.count > 0) { el.hidden = false; el.textContent = j.count + (j.count === 1 ? " person has joined" : " people have joined"); }
    }).catch(function () {});
    var form = document.getElementById("jform"), err = document.getElementById("jerr");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements, v = { name: f.name.value, email: f.email.value, role: f.role.value, state: f.state.value, city: f.city.value, language: f.language.value, source: f.source.value, website: f.website.value, consent: document.getElementById("jok").checked };
      var p = problem(v); err.hidden = !p; err.textContent = p; if (p) return;
      var go = document.getElementById("jgo"); go.disabled = true;
      fetch(b + "/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || "The server did not accept that."); return j; }); })
        .then(function (j) {
          form.hidden = true; document.getElementById("jdone").hidden = false;
          document.getElementById("jdonet").textContent = j.already ? "That email was already on the list, so we updated your details." : (j.count ? "You are person number " + j.count + "." : "We have your details.");
          document.getElementById("jdone").querySelector("h3").setAttribute("tabindex", "-1"); document.getElementById("jdone").querySelector("h3").focus();
        })
        .catch(function (x) { err.hidden = false; err.textContent = x.message || "Could not reach the server. Please try again."; go.disabled = false; });
    });
  }

  var api = { render: render, problem: problem, ROLES: ROLES };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSJoin = api;
})(typeof window !== "undefined" ? window : this);
