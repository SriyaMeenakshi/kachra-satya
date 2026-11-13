/* "See it working": four short demo screens on the Home page, one per door. Each plays a few steps with MADE-UP inputs (labelled "Example"),
   but the figures, verdicts, document names and sentences come from the real data and the real functions (KSClaim, KSSaathi, KSAnswer).
   Back, Next, Replay and Pause always work; steps advance by themselves only while the section is on screen, and not at all for people who prefer
   reduced motion (they get the finished screen and the buttons). Nothing here is stored or sent. Needs window.KS, KSClaim, KSSaathi, KSAnswer. */
(function (root) {
  var KS = root.KS, $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var reduce = false; try { reduce = root.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  function ymd(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return d; }
  function nice(d) { return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
  function fmt(v) { return v == null ? "not reported" : Math.round(v * 100) / 100; }
  function docName(d) { return root.KSAnswer ? root.KSAnswer.docName(d) : d; }

  var WARD = "Telangana~Hyderabad~Ward 12";
  function fakeTaps() { var out = []; for (var i = 1; i <= 14; i++) out.push({ ward: WARD, date: ymd(daysAgo(i)), status: i <= 5 ? "not_collected" : (i % 3 === 0 ? "" : "collected") }); return out.filter(function (r) { return r.status; }); }

  /* ---------- the four demos: each step is {cap, html(), type?} ---------- */
  function garbage() {
    var taps = fakeTaps(), since = nice(daysAgo(5));
    return { label: "My garbage isn't collected", url: "Your ward", link: ["#/ward", "Open Your ward"], steps: [
      { stage: "reality", cap: "1. Tap the days the truck did not come. It stays on your device and is marked unverified.", html: function () {
        var cells = ""; for (var i = 13; i >= 0; i--) { var d = daysAgo(i), t = taps.filter(function (r) { return r.date === ymd(d); })[0], st = i === 0 ? "" : t ? t.status : "";
          cells += '<div class="dm-day ' + (st === "not_collected" ? "bad" : st === "collected" ? "ok" : "") + '" style="--i:' + (13 - i) + '"><b>' + d.getDate() + '</b><span>' + (st === "not_collected" ? "&#10007; missed" : st === "collected" ? "&#10003; came" : "&ndash;") + "</span></div>"; }
        return '<p class="dm-h">Ward 12, Hyderabad <span class="dm-chip">example ward</span></p><div class="dm-cal">' + cells + '</div><p class="dm-note">Last 14 days. Unverified: one resident\'s own taps, kept only in this browser.</p>'; } },
      { stage: "action", cap: "2. We write the complaint. You file it yourself on the official Swachhata-MoHUA app.", type: "Garbage has not been collected near the water tank, Ward 12, Hyderabad, since " + since + ". It has now been 5 days. A photo taken from a safe distance is attached. Please clear it and tell me what action was taken.",
        html: function (t) { return '<p class="dm-h">Complaint draft <span class="dm-chip">nothing is sent</span></p><div class="dm-text" id="dm-typed">' + esc(t || "") + '</div><p class="dm-note">Place and details are made up for this example.</p>'; } },
      { stage: "action", cap: "3. Keep a log: the complaint number and how many days it has stayed open.", html: function () {
        return '<p class="dm-h">Your log</p><div class="tw"><table class="dm-tbl"><thead><tr><th>Filed</th><th>Where</th><th>Problem</th><th>Complaint no.</th><th>Status</th><th>Days open</th></tr></thead><tbody><tr><td>' + nice(daysAgo(5)) + '</td><td>Ward 12, Hyderabad</td><td>Garbage not collected</td><td>EX-1234 (example)</td><td>Open</td><td><b>5</b></td></tr></tbody></table></div>'; } },
      { stage: "action", cap: "4. If it stays unfixed, the letter to the Municipal Commissioner carries your tally and the official figures, with page numbers.", html: function () {
        var S = root.KSSaathi || {}, claim = S._claimLine ? S._claimLine("Telangana") : "", ward = S._wardLine ? S._wardLine(taps, WARD, ymd(new Date())) : "";
        return '<p class="dm-h">Escalation letter <span class="dm-chip">draft, you send it</span></p><div class="dm-letter"><p>To, The Municipal Commissioner, Hyderabad</p><p>Subject: Unresolved solid waste complaint at Ward 12</p><p>' + esc(claim) + '</p><p class="dm-hl">' + esc(ward) + '</p><p>I request that the waste be cleared within 7 days, and that I be told in writing what action was taken.</p></div>'; } }
    ] };
  }

  function claim() {
    var SENT = "81% of India's urban waste is processed";
    function result() { return root.KSClaim.checkClaim(KS, { metric: "processed_pct", value: 81, unit: "percent", state: null, year: null }); }
    function newest(r, src) { return r.records.filter(function (x) { return x.source_name === src; }).sort(function (p, q) { return (q.year > p.year ? 1 : q.year < p.year ? -1 : 0) || (p.kind === "stated" ? -1 : 1); })[0]; }
    return { label: "Someone quoted a number", url: "Check a claim", link: ["#/claim", "Check a real number"], steps: [
      { stage: "promise", cap: "1. Type or paste the number someone quoted.", type: SENT, html: function (t) { return '<p class="dm-h">Check a claim</p><div class="dm-input"><span id="dm-typed">' + esc(t || "") + '</span><i class="dm-caret"></i></div><p class="dm-note">Example sentence.</p>'; } },
      { stage: "proof", cap: "2. We compare it with every source we hold. When they disagree, we say so, and never pick a winner.", html: function () {
        var r = result(), m = newest(r, "MoHUA"), c = newest(r, "CPCB"), lab = { SUPPORTED: "Every source agrees", CONTRADICTED: "No source supports this", SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS: "The sources disagree", CANNOT_VERIFY: "Can't check this" }[r.verdict];
        return '<p class="dm-h">Claim: ' + esc(SENT) + '</p><p><span class="dm-verdict">' + esc(lab) + '</span></p><div class="dm-figs">' + [m, c].filter(Boolean).map(function (x) { return '<div class="dm-fig"><div class="dm-n">' + fmt(x.value) + '%</div><div class="dm-s"><b>' + esc(x.source_name) + "</b><br>" + esc(x.year) + " " + (x.kind === "computed" ? "computed by us" : "reported figure") + "</div></div>"; }).join("") + '</div><p class="dm-note">Different years and possibly different words, so this is not a like-for-like comparison.</p>'; } },
      { stage: "proof", cap: "3. Every figure opens on the page it came from, so nobody has to trust us.", html: function () {
        var r = result(), rows = [newest(r, "MoHUA"), newest(r, "CPCB")].filter(Boolean);
        return '<p class="dm-h">Evidence</p><ul class="dm-ev">' + rows.map(function (x) { return "<li><b>" + esc(docName(x.source_doc)) + "</b>, page " + esc(x.source_page) + " <span class=\"dm-chip\">open the page</span></li>"; }).join("") + '</ul><p class="dm-note">' + r.records.length + ' source figures are listed behind "See all source records".</p>'; } }
    ] };
  }

  function brief(state) {
    state = state || "Kerala";
    function row(y, s, m) { return KS.waste.filter(function (x) { return x.state === state && x.year === y && x.source_name === s && x.metric === m; })[0]; }
    function pct(y, s) { var g = row(y, s, "generated"), t = row(y, s, "treated"); return g && t && g.value_tpd && t.value_tpd != null ? Math.round(t.value_tpd / g.value_tpd * 1000) / 10 : null; }
    return { label: "I'm preparing a briefing", url: "Briefing", link: ["#/brief/card", "Open the state card"], steps: [
      { stage: "proof", cap: "1. Pick a state.", html: function () { var st = Array.from(new Set(KS.waste.map(function (r) { return r.state; }))).sort();
        return '<p class="dm-h">State card</p><label class="dm-l" for="dm-state">State</label><select id="dm-state">' + st.map(function (s) { return "<option" + (s === state ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") + '</select><p class="dm-note">Any of the 36 states and UTs works. This demo opens on ' + esc(state) + ".</p>"; } },
      { stage: "proof", cap: "2. A plain-words card with both official figures and where they come from.", html: function () {
        var c = pct("2023-24", "CPCB"), m = pct("2025-26", "MoHUA"), au = KS.audit.filter(function (a) { return a.state === state; })[0], fl = KS.flags.filter(function (f) { return f.state === state; }).length;
        return '<p class="dm-h">' + esc(state) + '</p><div class="dm-figs"><div class="dm-fig"><div class="dm-n">' + (c == null ? "n/a" : c + "%") + '</div><div class="dm-s"><b>CPCB</b><br>2023-24 treated</div></div><div class="dm-fig"><div class="dm-n">' + (m == null ? "n/a" : m + "%") + '</div><div class="dm-s"><b>MoHUA</b><br>2025-26 processed</div></div></div>' +
          '<p class="dm-note">' + (c != null && m != null ? "The two differ by " + Math.abs(Math.round((m - c) * 10) / 10) + " points; different years, so part may be real change. " : "One of the two figures is not reported, so no comparison is made. ") + (au ? "Audit priority #" + au.rank + " of 36. " : "") + fl + " consistency flag" + (fl === 1 ? "" : "s") + " in this state's reports.</p>"; } },
      { stage: "action", cap: "3. A one-page briefing with questions that could be put, written only from what the data shows.", html: function () {
        var rec = KS.recurrence.filter(function (r) { return r.state === state; })[0], mo = (KS.money || []).filter(function (r) { return r.state === state; })[0], c = pct("2023-24", "CPCB"), m = pct("2025-26", "MoHUA"), qs = [];
        if (rec) qs.push("In " + rec.n_years + " reporting years " + state + " reported more waste treated than collected (" + String(rec.years).split("; ").join(", ") + "). Which figure is right, and how is each measured?");
        if (c != null && m != null) qs.push("Why do the two official figures for " + state + " differ by " + Math.abs(Math.round((m - c) * 10) / 10) + " points, and do CPCB and MoHUA use the same definition of treated and processed?");
        if (mo && mo.allocation_swm) qs.push("About " + Math.round(mo.funds_swm / mo.allocation_swm * 100) + "% of the solid-waste money set aside for " + state + " had been used by 25 Nov 2024. What is holding up the rest?");
        if (!qs.length) qs.push("Which of the figures for " + state + " are not reported, and when will they be?");
        return '<p class="dm-h">Briefing <span class="dm-chip">draft</span></p><ol class="dm-q">' + qs.map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") + '</ol><p class="dm-note">Check your House\'s rules on form and timing before using any of it.</p>'; } }
    ], pick: function (s) { return brief(s); } };
  }

  function school() {
    var G = [["Mon", 4, 6, 1, 0], ["Tue", 3, 7, 1, 0], ["Wed", 5, 6, 2, 0], ["Thu", 4, 8, 1, 1], ["Fri", 3, 5, 1, 0]];
    return { label: "Our school", url: "Schools", link: ["#/school", "Open Schools"], steps: [
      { stage: "action", cap: "1. Learn the four streams before weighing anything.", html: function () {
        return '<p class="dm-h">The four streams</p><div class="dm-streams"><div><b>Wet</b><span>food and garden waste</span></div><div><b>Dry</b><span>paper, plastic, metal, glass</span></div><div><b>Sanitary</b><span>diapers, pads, bandages</span></div><div><b>Special care</b><span>batteries, bulbs, medicines</span></div></div><p class="dm-note">Special care waste is never opened. Gloves and sealed bags for everything.</p>'; } },
      { stage: "reality", cap: "2. Weigh a school week and fill in the grid (kilograms).", html: function () {
        return '<p class="dm-h">One week <span class="dm-chip">made-up numbers</span></p><div class="tw"><table class="dm-tbl"><thead><tr><th>Day</th><th>Wet</th><th>Dry</th><th>Sanitary</th><th>Special</th></tr></thead><tbody>' + G.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td><td>" + r[4] + "</td></tr>"; }).join("") + "</tbody></table></div>"; } },
      { stage: "action", cap: "3. The grid becomes a report card.", html: function () {
        var t = [0, 0, 0, 0]; G.forEach(function (r) { for (var i = 0; i < 4; i++) t[i] += r[i + 1]; }); var all = t[0] + t[1] + t[2] + t[3];
        return '<p class="dm-h">Report card <span class="dm-chip">made-up numbers</span></p><div class="dm-figs"><div class="dm-fig"><div class="dm-n">' + all + ' kg</div><div class="dm-s">weighed this week</div></div><div class="dm-fig"><div class="dm-n">' + Math.round((t[0] + t[1]) / all * 100) + '%</div><div class="dm-s">wet and dry, easy to recycle or compost</div></div></div><p class="dm-note">Institutions making 100 kg a day or more have extra duties under the 2026 rules; a school this size does not.</p>'; } }
    ] };
  }

  /* ---------- the player: plays like a short video, on its own ---------- */
  var STEP_MS = 5200;                                           /* time on each step: long enough to read the caption */
  var DEMOS = null, cur = 0, step = 0, timer = null, typer = null, paused = false, playing = false, started = false;
  function build() { DEMOS = [garbage(), claim(), brief(), school()]; }

  function html() {
    build();
    return '<section class="op-sec demo" id="demo" aria-labelledby="demo-h2"><p class="op-eyebrow">See it working</p><h2 class="op-h2" id="demo-h2">Watch it do the job.</h2>' +
      '<p class="op-p">A short film that plays by itself: four walk-throughs, one after another. The inputs are made up and marked <span class="dm-chip">example</span>; the figures, verdicts and documents are the real ones. You can pause it or jump to any part.</p>' +
      '<div class="dm-tabs" role="tablist" aria-label="Parts of the film">' + DEMOS.map(function (d, i) { return '<button type="button" role="tab" class="dm-tab" id="dm-t' + i + '" data-i="' + i + '" aria-selected="' + (i === 0) + '" aria-controls="dm-panel"><span class="dm-num">' + (i + 1) + "</span> " + esc(d.label) + "</button>"; }).join("") + "</div>" +
      '<div class="dm-frame" role="tabpanel" id="dm-panel" aria-labelledby="dm-t0"><div class="dm-bar" aria-hidden="true"><i></i><i></i><i></i><span id="dm-url"></span><span class="dm-stage" id="dm-stage"></span><b class="dm-rec" id="dm-rec">&#9679; playing</b></div><div class="dm-screen" id="dm-screen"></div><div class="dm-tl" aria-hidden="true"><i id="dm-tlbar"></i></div></div>' +
      '<p class="dm-cap" id="dm-cap" role="status" aria-live="polite"></p>' +
      '<div class="dm-ctl"><button type="button" class="alt" id="dm-back">&larr; Back</button><span class="dm-prog" id="dm-prog" aria-hidden="true"></span><button type="button" class="alt" id="dm-next">Next &rarr;</button><button type="button" class="alt" id="dm-play" aria-pressed="false">Pause</button><a class="dm-open" id="dm-open" href="#/ward">Open the real page &rarr;</a></div></section>';
  }

  function stopTimers() { if (timer) { clearTimeout(timer); timer = null; } if (typer) { clearInterval(typer); typer = null; } }
  function restartBar() {
    var b = $("dm-tlbar"); if (!b) return;
    b.style.animation = "none"; void b.offsetWidth;
    b.style.animation = (playing && !paused && !reduce) ? "dm-fill " + STEP_MS + "ms linear forwards" : "none";
    b.style.width = (playing && !paused && !reduce) ? "" : "0";
  }
  function setRec() { var r = $("dm-rec"); if (!r) return; var on = playing && !paused && !reduce; r.textContent = on ? "\u25CF playing" : "\u275A\u275A paused"; r.className = "dm-rec" + (on ? " on" : ""); var pl = $("dm-play"); if (pl) { pl.textContent = on ? "Pause" : "Play"; pl.setAttribute("aria-pressed", String(!on)); } }

  function show(animate) {
    var d = DEMOS[cur], s = d.steps[step];
    $("dm-url").textContent = "trashtally / " + d.url; $("dm-cap").textContent = s.cap; $("dm-stage").innerHTML = root.KSLoop ? root.KSLoop.chip(s.stage) : "";
    $("dm-prog").innerHTML = d.steps.map(function (x, i) { return "<i" + (i === step ? ' class="on"' : "") + "></i>"; }).join("");
    $("dm-back").disabled = cur === 0 && step === 0;
    $("dm-open").setAttribute("href", d.link[0]); $("dm-open").textContent = d.link[1] + " \u2192";
    [].slice.call(document.querySelectorAll(".dm-tab")).forEach(function (b, k) { b.setAttribute("aria-selected", String(k === cur)); }); $("dm-panel").setAttribute("aria-labelledby", "dm-t" + cur);
    var scr = $("dm-screen"); if (typer) { clearInterval(typer); typer = null; }
    if (s.type) {
      if (animate && !reduce) { var n = 0; scr.innerHTML = s.html(""); typer = setInterval(function () { n += 2; var el = $("dm-typed"); if (el) el.textContent = s.type.slice(0, n); if (n >= s.type.length) { clearInterval(typer); typer = null; } }, 30); }
      else scr.innerHTML = s.html(s.type);
    } else scr.innerHTML = s.html();
    if (animate && !reduce) { scr.classList.remove("enter"); void scr.offsetWidth; scr.classList.add("enter"); }
    var sel = $("dm-state"); if (sel) sel.onchange = function () { stopPlay(); DEMOS[cur] = brief(sel.value); step = 1; show(false); };
    restartBar(); setRec();
  }

  /* go to the next step; at the end of a part go to the next part; after the last part start again (a loop) */
  function advance() {
    var d = DEMOS[cur];
    if (step < d.steps.length - 1) step++; else { cur = (cur + 1) % DEMOS.length; step = 0; if (cur === 0) DEMOS[2] = brief(); }
    show(true); schedule();
  }
  function schedule() { if (timer) clearTimeout(timer); timer = null; if (playing && !paused && !reduce) timer = setTimeout(advance, STEP_MS); }
  function stopPlay() { paused = true; stopTimers(); restartBar(); setRec(); }
  function startPlay() { paused = false; playing = true; show(false); restartBar(); setRec(); schedule(); }

  function visible() { var e = $("demo"); if (!e) return false; var r = e.getBoundingClientRect(), vh = root.innerHeight || 800, h = Math.max(1, r.height), seen = Math.min(r.bottom, vh) - Math.max(r.top, 0); return seen > Math.min(h, vh) * 0.35; }

  function wire() {
    if (!$("demo")) return;
    if (!DEMOS) build();
    cur = 0; step = 0; paused = false; playing = false; started = false; stopTimers();
    [].slice.call(document.querySelectorAll(".dm-tab")).forEach(function (b) {
      b.onclick = function () { cur = +b.dataset.i; step = 0; DEMOS[2] = DEMOS[2]; playing = true; paused = false; show(true); schedule(); };
      b.onkeydown = function (e) { var k = +b.dataset.i, n = e.key === "ArrowRight" ? (k + 1) % DEMOS.length : e.key === "ArrowLeft" ? (k + DEMOS.length - 1) % DEMOS.length : null; if (n != null) { e.preventDefault(); $("dm-t" + n).focus(); $("dm-t" + n).click(); } };
    });
    $("dm-next").onclick = function () { stopPlay(); var d = DEMOS[cur]; if (step < d.steps.length - 1) step++; else { cur = (cur + 1) % DEMOS.length; step = 0; } show(true); };
    $("dm-back").onclick = function () { stopPlay(); if (step > 0) step--; else if (cur > 0) { cur--; step = DEMOS[cur].steps.length - 1; } show(false); };
    $("dm-play").onclick = function () { if (paused || !playing || reduce) { if (reduce) { return; } startPlay(); } else stopPlay(); };
    show(false);                                                  /* the first screen is there at once, even if nothing ever plays */
    function begin() { if (started || reduce) return; started = true; playing = true; paused = false; step = 0; show(true); schedule(); }
    if (!reduce) {
      if ("IntersectionObserver" in root) { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); begin(); } }); }, { threshold: 0.35 }); io.observe($("demo")); }
      var onScroll = function () { if (!started && visible()) { root.removeEventListener("scroll", onScroll); begin(); } };       /* fallback where IntersectionObserver is unavailable or silent */
      root.addEventListener("scroll", onScroll, { passive: true }); setTimeout(onScroll, 600);
    }
    /* leaving Home removes the section; make sure no timer keeps running behind it */
    root.addEventListener("hashchange", function once() { if (!$("demo")) { stopTimers(); root.removeEventListener("hashchange", once); } });
  }
  root.KSDemo = { html: html, wire: wire, _build: function () { build(); return DEMOS; } };
})(window);
