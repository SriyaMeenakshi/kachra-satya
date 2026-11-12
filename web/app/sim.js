/* "Try it" simulation cards on the Home page: three small things to touch, so the numbers make sense before any page is opened.
   1. Out of every 100 tonnes: the two official shares drawn as 100 dots each, for India or any state. Plain arithmetic on the published figures.
   2. Slide a number, see the verdict: the real Claim Checker (KSClaim) run live as you move the slider.
   3. If the truck does not come: a suggested order of steps against days missed. It is an illustration of what this site helps with, not a legal deadline.
   Nothing here is stored or sent. Needs window.KS and window.KSClaim. */
(function (root) {
  var KS = root.KS, $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* percent of the generated waste that a source reports as processed or treated, for India or a state; null when either figure is not reported */
  function share(place, src) {
    var y = src === "MoHUA" ? "2025-26" : "2023-24", g, t;
    if (place === "India") {
      var n = function (m) { var r = KS.national.filter(function (x) { return x.state === "India" && x.year === y && x.source_name === src && x.metric === m; })[0]; return r && r.value != null ? +r.value : null; };
      g = n("generated"); t = n("treated");
    } else {
      var w = function (m) { var r = KS.waste.filter(function (x) { return x.state === place && x.year === y && x.source_name === src && x.metric === m; })[0]; return r && r.value_tpd != null ? +r.value_tpd : null; };
      g = w("generated"); t = w("treated");
    }
    return g && t != null ? Math.max(0, Math.min(100, t / g * 100)) : null;
  }
  function dots(pct) {
    var n = pct == null ? 0 : Math.round(pct), h = "";
    for (var i = 0; i < 100; i++) h += '<i class="' + (i < n ? "on" : "") + '"></i>';
    return '<div class="sim-dots" role="img" aria-label="' + (pct == null ? "not reported" : n + " of 100 tonnes") + '">' + h + "</div>";
  }
  function verdictFor(v) {
    var r = root.KSClaim.checkClaim(KS, { metric: "processed_pct", value: v, unit: "percent", state: null, year: null });
    var m = r.records.filter(function (x) { return x.matches; }).length, tot = r.records.length;
    var label = { SUPPORTED: ["Every source agrees", "ok"], CONTRADICTED: ["No source supports this", "bad"], SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS: ["The sources disagree", "mix"], CANNOT_VERIFY: ["Can't check this", "mute"] }[r.verdict];
    return { label: label[0], cls: label[1], m: m, tot: tot, reason: r.reason };
  }
  var STEPS = [
    [0, "Write the complaint", "#/help/complain", "Say where, since when, add a photo taken from a safe distance. File it on the official Swachhata-MoHUA app."],
    [3, "Keep a log", "#/help/log", "Note the complaint number and the day. Days open is your evidence."],
    [7, "Escalate", "#/help/escalate", "Send a letter to the Municipal Commissioner. We draft it with the official figures; you send it."],
    [14, "Tell others", "#/ward", "Tap the days the truck did not come on Your ward, so there is a record beside the official numbers."]
  ];

  function html() {
    var states = Array.from(new Set((KS.waste || []).map(function (r) { return r.state; }))).sort();
    return '<section class="op-sec sim" aria-labelledby="sim-h"><p class="op-eyebrow">Try it</p><h2 class="op-h2" id="sim-h">Touch the numbers.</h2>' +
      '<p class="op-p">Three small things to try. Nothing is saved or sent.</p><div class="sim-cards">' +
      /* 1 */ '<article class="sim-card" id="sim1"><h3>Out of every 100 tonnes</h3><p class="sim-q">Pick a place. Each dot is one tonne of waste.</p>' +
      '<label class="sim-l" for="sim-place">Place</label><select id="sim-place"><option>India</option>' + states.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + '</select>' +
      '<div class="sim-two"><div><div id="sim-m"></div></div><div><div id="sim-c"></div></div></div>' +
      '<p class="sim-note" id="sim-n1" role="status"></p></article>' +
      /* 2 */ '<article class="sim-card" id="sim2"><h3>Slide a number, see the verdict</h3><p class="sim-q">Someone says &ldquo;<b id="sim-v">70</b>% of India&rsquo;s waste is processed.&rdquo; Move the slider.</p>' +
      '<label class="sim-l" for="sim-range">Claimed share processed</label><input id="sim-range" type="range" min="30" max="100" step="1" value="70">' +
      '<div class="sim-verdict"><span class="sim-badge" id="sim-badge"></span><span id="sim-count" class="sim-fine"></span></div><p class="sim-note" id="sim-why"></p>' +
      '<p class="sim-more"><a href="#/claim">Check a real sentence &rarr;</a></p></article>' +
      /* 3 */ '<article class="sim-card" id="sim3"><h3>If the truck doesn&rsquo;t come</h3><p class="sim-q">Days without a pickup: <b id="sim-d">5</b></p>' +
      '<label class="sim-l" for="sim-days">Days missed</label><input id="sim-days" type="range" min="0" max="16" step="1" value="5">' +
      '<ol class="sim-steps" id="sim-steps"></ol><p class="sim-fine">A suggested order, not a legal deadline. We only write drafts; you send them.</p></article>' +
      "</div></section>";
  }

  function wire(scope) {
    var s = scope || document;
    if (!$("sim1")) return;
    function one() {
      var place = $("sim-place").value, a = share(place, "MoHUA"), b = share(place, "CPCB");
      var p = function (x) { return x == null ? "not reported" : Math.round(x) + "%"; };
      $("sim-m").innerHTML = '<div class="sim-who">MoHUA, 2025-26</div>' + dots(a) + '<div class="sim-pct">' + (a == null ? "not reported" : '<span class="sim-big">' + Math.round(a) + "%</span> processed") + "</div>";
      $("sim-c").innerHTML = '<div class="sim-who">CPCB, 2023-24</div>' + dots(b) + '<div class="sim-pct">' + (b == null ? "not reported" : '<span class="sim-big">' + Math.round(b) + "%</span> treated") + "</div>";
      $("sim-n1").textContent = a != null && b != null ? "For " + place + ", the two sources differ by " + Math.abs(Math.round(a) - Math.round(b)) + " points. They are different years, and &ldquo;processed&rdquo; and &ldquo;treated&rdquo; may not mean the same thing.".replace(/&ldquo;|&rdquo;/g, '"') : "For " + place + ", one of the two figures is not reported, so we do not compare them.";
      if (root.KSCountUp) { root.KSCountUp.scan(); }
    }
    function two() {
      var v = +$("sim-range").value, r = verdictFor(v);
      $("sim-v").textContent = v; $("sim-badge").textContent = r.label; $("sim-badge").className = "sim-badge " + r.cls;
      $("sim-count").textContent = r.m + " of " + r.tot + " source figures match";
      $("sim-why").textContent = r.reason.charAt(0).toUpperCase() + r.reason.slice(1).replace(/\.? The figures cover different years.*$/, ".");
    }
    function three() {
      var d = +$("sim-days").value; $("sim-d").textContent = d;
      $("sim-steps").innerHTML = STEPS.map(function (st) {
        var on = d >= st[0];
        return '<li class="' + (on ? "on" : "") + '"><span class="sim-day">Day ' + st[0] + '</span><span><a href="' + st[2] + '"><b>' + esc(st[1]) + "</b></a><br><span class=\"sim-fine\">" + esc(st[3]) + "</span></span></li>";
      }).join("");
    }
    $("sim-place").onchange = one; $("sim-range").oninput = two; $("sim-days").oninput = three;
    one(); two(); three();
  }

  root.KSSim = { html: html, wire: wire, _share: share, _verdictFor: verdictFor };
})(window);
