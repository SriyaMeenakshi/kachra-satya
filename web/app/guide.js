/* Guided paths and "what next" for people who know nothing about the data.
   A visitor picks a goal on the Start page ("My garbage isn't being collected", "Someone quoted a number", ...). The goal becomes a short path of existing pages:
   a bar at the top of each page says which step you are on, why it matters, and offers Back and Next. Pages outside a path get a small "What next?" row.
   State lives in sessionStorage (a path is a convenience, never required; if storage is blocked the pages still work, just without the bar).
   It only reads the page that app.js rendered into #view and adds one bar; it changes no data and no other page logic. */
(function (root) {
  var $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* Each step is an existing page. route is matched as a prefix of location.hash. */
  var PATHS = {
    garbage: { title: "Get my garbage collected", goal: "My garbage isn't being collected", sub: "Write a complaint, keep a log, escalate if it stays unfixed.", steps: [
      { route: "#/help/complain", title: "Write your complaint", why: "A clear complaint with a landmark and a photo is far more likely to be read. We write the text; you file it on the official Swachhata-MoHUA app." },
      { route: "#/help/log", title: "Keep a log", why: "Note the complaint number and the date. Days open is your evidence if you need to escalate." },
      { route: "#/help/escalate", title: "If it is not fixed, escalate", why: "A letter to the Municipal Commissioner that cites the 2026 rules and the official figures. We draft it; you send it." },
      { route: "#/help/bins", title: "Check your own bins", why: "Four streams are now required at source. Getting yours right removes an easy excuse." } ] },
    claim: { title: "Check a number someone quoted", goal: "Someone quoted a number. Is it true?", sub: "Test it, open the source pages, share what you found.", steps: [
      { route: "#/claim", title: "Check the number", why: "We compare it with every source we hold and show who agrees and who does not." },
      { route: "#/explore/receipts", title: "Open the source pages", why: "Every figure opens on the page it came from, with the number boxed. Check it yourself." },
      { route: "#/map", title: "See your state", why: "The national total hides large differences between states. Tap yours." },
      { route: "#/brief/card", title: "Share it in plain words", why: "A state card you can copy as a message, with the sources attached." } ] },
    understand: { title: "Understand the problem in 3 minutes", goal: "I want to understand the problem", sub: "Two numbers, where they differ, why it matters.", steps: [
      { route: "#/start", title: "The two numbers", why: "The Housing Ministry and the pollution board publish different figures for the same waste. Start with the two numbers on the Home page." },
      { route: "#/map", title: "Where they differ", why: "Colour the map by the difference to see which states disagree most. Different years, so part may be real change." },
      { route: "#/gaps", title: "Money and gaps", why: "Where solid-waste money has not been used, and where waste goes uncollected." },
      { route: "#/explore/defs", title: "What the words mean", why: "'Processed' and 'treated' may not mean the same thing. This is why we never say who is right." } ] },
    official: { title: "Prepare something to cite or ask", goal: "I'm a reporter, councillor or MP", sub: "A state card, a briefing, and the sources to back it.", steps: [
      { route: "#/brief/card", title: "Pick a state, read its card", why: "The two official numbers for a state in plain words, with source pages." },
      { route: "#/brief/briefing", title: "Get the briefing", why: "A one-page text with questions that could be put, generated only from what the data shows. Check your House's rules on form and timing." },
      { route: "#/claim", title: "Check anything you will quote", why: "Test a figure before you repeat it." },
      { route: "#/explore/receipts", title: "Keep the source pages", why: "Cite the document and page, not our site." } ] },
    school: { title: "Run a school waste challenge", goal: "Our school wants to do something", sub: "Weigh a week of waste, learn the bins, get a report card.", steps: [
      { route: "#/help/bins", title: "Learn the four streams", why: "Wet, dry, sanitary and special care. Students should know them before weighing." },
      { route: "#/school", title: "Weigh and fill in the grid", why: "A week of weighing becomes a report card. Safety first: gloves, sealed bags, no opening of special care waste." },
      { route: "#/help/bulk", title: "Are you a bulk generator?", why: "Institutions with 100 kg a day or more have extra duties under the 2026 rules." } ] }
  };
  var ORDER = ["garbage", "claim", "understand", "official", "school"];

  /* "What next?" for pages outside a path: routes without a hash tail match by name. */
  var NEXT = {
    claim: [["#/explore/receipts", "Open the source pages"], ["#/map", "See your state on the map"], ["#/help/complain", "My garbage isn't being collected"]],
    map: [["#/brief/card", "Explain a state in plain words"], ["#/claim", "Check a number you heard"], ["#/gaps/money", "Where is the money not moving?"]],
    gaps: [["#/map", "Open the map"], ["#/brief/briefing", "Get a briefing for an MP or councillor"], ["#/help/complain", "Get my garbage collected"]],
    explore: [["#/claim", "Check a number"], ["#/map", "Open the map"], ["#/help", "Get help with garbage"]],
    city: [["#/ward", "Report on your own ward"], ["#/help/complain", "Write a complaint"], ["#/claim", "Check a number"]],
    ward: [["#/help/complain", "Write a complaint"], ["#/city", "Audit your city's data"], ["#/start", "Back to the start"]],
    ask: [["#/claim", "Check a number yourself"], ["#/map", "Open the map"], ["#/start", "Back to the start"]],
    dropoff: [["#/help/bins", "Which bin does it go in?"], ["#/help/complain", "Garbage not collected?"], ["#/start", "Back to the start"]],
    help: [["#/claim", "Check a number someone quoted"], ["#/ward", "Report on your own ward"], ["#/dropoff", "Nearest drop-off for special waste"]],
    school: [["#/help/bins", "Learn the four streams"], ["#/map", "Open the map"], ["#/start", "Back to the start"]],
    brief: [["#/claim", "Check a figure before you quote it"], ["#/explore/receipts", "Open the source pages"], ["#/map", "Open the map"]]
  };

  var KEY = "ks-path";
  function load() { try { var v = JSON.parse(sessionStorage.getItem(KEY) || "null"); return v && PATHS[v.id] ? v : null; } catch (e) { return null; } }
  function save(v) { try { if (v) sessionStorage.setItem(KEY, JSON.stringify(v)); else sessionStorage.removeItem(KEY); } catch (e) {} }
  function stepOf(path, hash) {
    var best = -1, len = 0; hash = (hash || "").replace(/\/$/, "");
    path.steps.forEach(function (s, i) { if ((hash === s.route || hash.indexOf(s.route + "/") === 0) && s.route.length > len) { best = i; len = s.route.length; } });
    return best;
  }
  function routeName(hash) { return (hash || "#/start").replace(/^#\/?/, "").split("/")[0] || "start"; }

  function start(id) { if (!PATHS[id]) return; save({ id: id, at: Date.now() }); location.hash = PATHS[id].steps[0].route; }
  function leave() { save(null); decorate(); }

  function bar(id, i) {
    var P = PATHS[id], S = P.steps[i], n = P.steps.length, last = i === n - 1, prev = i > 0 ? P.steps[i - 1] : null, next = last ? null : P.steps[i + 1];
    var dots = P.steps.map(function (s, k) { return '<li class="' + (k < i ? "done" : k === i ? "now" : "") + '"' + (k === i ? ' aria-current="step"' : "") + '><span class="sr">' + (k < i ? "Done: " : k === i ? "Current: " : "Next: ") + esc(s.title) + "</span></li>"; }).join("");
    return '<aside class="gd-bar" data-gd="1" role="region" aria-label="Guided path"><div class="gd-top"><span class="gd-name">Your path: ' + esc(P.title) + '</span><span class="gd-step">Step ' + (i + 1) + " of " + n + '</span><button type="button" class="gd-x" id="gd-leave">Leave this path</button></div>' +
      '<ol class="gd-dots" aria-hidden="false">' + dots + '</ol><p class="gd-why"><strong>' + esc(S.title) + ".</strong> " + esc(S.why) + '</p><div class="gd-nav">' +
      (prev ? '<a class="gd-b" href="' + prev.route + '">&larr; Back</a>' : '<a class="gd-b" href="#/start">&larr; Start</a>') +
      (next ? '<a class="gd-n" href="' + next.route + '">Next: ' + esc(next.title) + " &rarr;</a>" : '<a class="gd-n" id="gd-fin" href="#/start">Finish: back to the start &rarr;</a>') + "</div></aside>";
  }
  function nextRow(name) {
    var N = NEXT[name]; if (!N) return "";
    return '<nav class="gd-next" data-gd="1" aria-label="What next?"><h2>What next?</h2><ul>' + N.map(function (x) { return '<li><a href="' + x[0] + '">' + esc(x[1]) + " &rarr;</a></li>"; }).join("") + "</ul></nav>";
  }

  var busy = false, obs = null;
  function decorate() {
    var view = $("view"); if (!view || busy) return;
    busy = true; if (obs) obs.disconnect();          /* our own inserts must not wake the observer: that would loop forever */
    try {
      [].slice.call(view.querySelectorAll("[data-gd]")).forEach(function (n) { n.remove(); });
      var hash = location.hash || "#/start", st = load();
      if (st) {
        var i = stepOf(PATHS[st.id], hash);
        if (i >= 0) {
          view.insertAdjacentHTML("afterbegin", bar(st.id, i));
          var lv = $("gd-leave"); if (lv) lv.onclick = leave;
          var fin = $("gd-fin"); if (fin) fin.onclick = function () { save(null); };
          return;
        }
        if (routeName(hash) !== "start") {
          var cont = PATHS[st.id].steps[0].route;
          view.insertAdjacentHTML("afterbegin", '<aside class="gd-away" data-gd="1" role="note">You are on a guided path: <strong>' + esc(PATHS[st.id].title) + '</strong>. <a href="' + cont + '">Go back to it</a> &middot; <button type="button" class="gd-x" id="gd-leave2">Leave the path</button></aside>');
          var l2 = $("gd-leave2"); if (l2) l2.onclick = leave;
        }
      }
      if (!st) view.insertAdjacentHTML("beforeend", nextRow(routeName(hash)));
    } finally { busy = false; if (obs && $("view")) obs.observe($("view"), { childList: true }); }
  }

  function chooser() {
    return '<div class="gd-goals" role="list">' + ORDER.map(function (id) { var P = PATHS[id];
      return '<button type="button" class="gd-goal" role="listitem" data-path="' + id + '"><b>' + esc(P.goal) + '</b><span>' + esc(P.sub) + '</span><i aria-hidden="true">' + P.steps.length + " steps &rarr;</i></button>"; }).join("") +
      '<a class="gd-goal gd-look" href="#/map" role="listitem"><b>I just want to look around</b><span>Open the map and tap a state.</span><i aria-hidden="true">no steps &rarr;</i></a></div>';
  }
  function wireGoals(scope) { [].slice.call((scope || document).querySelectorAll("[data-path]")).forEach(function (b) { b.onclick = function () { start(b.dataset.path); }; }); }

  function init() {
    var view = $("view"); if (!view) return;
    obs = new MutationObserver(function () { if (!busy) decorate(); }); obs.observe(view, { childList: true });
    window.addEventListener("hashchange", function () { setTimeout(decorate, 0); });
    decorate();
  }
  root.KSGuide = { start: start, leave: leave, chooser: chooser, wireGoals: wireGoals, init: init, _PATHS: PATHS, _NEXT: NEXT, _stepOf: stepOf };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(window);
