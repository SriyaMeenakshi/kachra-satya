/* The opening page: "a receipt for every waste promise". Route #/start. Everything is read from window.KS; nothing is typed in by hand except wording.
   Rules: never invent data; "the sources disagree", never "wrong"; the ticker shows real citations; motion respects prefers-reduced-motion (see opening.css).
   Receipt buttons carry data-rkey and are wired by app.js after render. */
(function (root) {
  var KS = root.KS, $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function n0(v) { return v == null ? "not reported" : Math.round(v).toLocaleString("en-IN"); }
  function nat(y, src, m) { var r = KS.national.filter(function (x) { return x.state === "India" && x.year === y && x.source_name === src && x.metric === m; })[0]; return r || null; }
  function rbtn(key) { var r = KS.receipts[key]; return r && r.image ? ' <button type="button" data-rkey="' + esc(key) + '">source page</button>' : ""; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var DOCS = { "ls_au50_2025-12-01.pdf": "Lok Sabha Q50", "rs_q358_2025-02-06.pdf": "Rajya Sabha Q358", "mohua_81pct_answer.pdf": "Rajya Sabha Q2433", "cpcb_2022-23.pdf": "CPCB report 2022-23", "cpcb_2021-22.pdf": "CPCB report 2021-22" };
  var EXAMPLES = ["81% of India's urban waste is processed", "62% of India's waste is treated", "Delhi treated 7,542 tonnes per day in 2023-24"];
  var LBL = { SUPPORTED: ["Supported", "ok"], CONTRADICTED: ["Not supported", ""], SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS: ["The sources disagree", ""], CANNOT_VERIFY: ["Cannot verify", "mute"] };

  function ticker() {
    var r = rng(20261110), pool = KS.waste.filter(function (x) { return x.value_tpd != null && DOCS[x.source_doc] && KS.receipts[[x.state, x.year, x.metric, x.source_doc].join("|")] && KS.receipts[[x.state, x.year, x.metric, x.source_doc].join("|")].image; }), items = [];
    while (items.length < 14 && pool.length) { var x = pool.splice(Math.floor(r() * pool.length), 1)[0]; items.push(x.state + " " + x.metric + " " + n0(x.value_tpd) + " t/day · " + DOCS[x.source_doc] + " · p." + x.source_page); }
    var html = items.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
    return '<div class="ticker" aria-hidden="true"><div class="tr">' + html + html + "</div></div>";
  }

  function render() {
    var view = $("view"), mp = nat("2025-26", "MoHUA", "processed_pct"), mt = nat("2025-26", "MoHUA", "treated"), cg = nat("2023-24", "CPCB", "generated"), ct = nat("2023-24", "CPCB", "treated");
    var mpct = mp ? Math.round(mp.value) : null, cpct = cg && ct ? Math.round(ct.value / cg.value * 100) : null, gap = mt && ct ? mt.value - ct.value : null;
    var withPage = Object.keys(KS.receipts).filter(function (k) { return KS.receipts[k].image; }).length, states = Array.from(new Set(KS.waste.map(function (r) { return r.state; }))).length;
    view.innerHTML = '<div class="op">' +
      '<div class="op-hero"><div><p class="op-kicker">Kachra Satya &middot; the truth about garbage</p><h1 class="op-h1">A receipt for every <span class="mark">waste promise.</span></h1>' +
      '<p class="op-lede">India\'s two official waste numbers don\'t match. See what was promised, what the records show, and what you can do about it.</p>' +
      '<div class="op-cta"><a class="op-btn" href="#/claim">Check a number</a><a class="op-btn ghost" href="#/help/complain">My garbage isn\'t being collected</a></div></div>' +
      '<figure class="receipt" aria-label="A receipt comparing the two official figures" style="margin:0 auto"><div class="rh"><b>KACHRA SATYA</b><span>RECEIPT &middot; DATA BUILT ' + esc(KS.built) + '</span></div>' +
      '<div class="ln"><span class="rtag">Promised</span><span class="who">Housing Ministry (MoHUA)</span><div class="big">' + (mpct == null ? "&ndash;" : mpct) + '<small> kg of every 100 processed</small></div><div class="src">2025-26' + (mp ? " &middot; " + esc(mp.source_doc) + ", p." + esc(mp.source_page) : "") + (mp ? rbtn("India|2025-26|processed_pct|" + mp.source_doc) : "") + '</div></div>' +
      '<div class="ln"><span class="rtag">Recorded</span><span class="who">Pollution board (CPCB)</span><div class="big">' + (cpct == null ? "&ndash;" : cpct) + '<small> kg of every 100 treated</small></div><div class="src">2023-24' + (ct ? " &middot; " + esc(ct.source_doc) + ", p." + esc(ct.source_page) : "") + (ct ? rbtn("India|2023-24|treated|" + ct.source_doc) : "") + '</div></div>' +
      '<hr><div class="ln"><div class="diff"><span>DIFFERENCE</span><span>' + n0(gap) + ' t/day</span></div><p class="note">between the two national &ldquo;treated&rdquo; totals. Different years; the two bodies may not define the word the same way. We do not say which is right.</p></div>' +
      '<div class="bars" aria-hidden="true"></div><div class="stamp" aria-hidden="true">The sources disagree</div></figure></div>' +
      ticker() +
      '<div class="op-nums"><div><b>' + states + '</b><span>states and UTs, each with its own record</span></div><div><b>' + (KS.waste.length + KS.national.length) + '</b><span>figures copied from published documents</span></div><div><b>' + withPage + '</b><span>figures you can open on their source page</span></div><div><b>' + KS.flags.length + '</b><span>places where reported figures cannot all be true</span></div></div>' +
      '<h2 class="op-h2">How a promise gets its receipt</h2><p class="op-sub">Four steps, from what was said to what you can do about it.</p>' +
      '<div class="stubs">' + stub("01", "Promise", "What did they say? Check any number against every source we hold.", "#/claim", "Check a claim", "") +
      stub("02", "Proof", "Every figure opens the page it came from. Where sources disagree, we say so.", "#/explore/receipts", "Open a receipt", "") +
      stub("03", "Reality", "Is it true on your street? Audit your own ward or school data.", "#/city", "Audit your city", "No reports yet") +
      stub("04", "Action", "Write the complaint, keep a log, send the escalation letter, learn which bin.", "#/help", "Get help", "") + "</div>" +
      '<h2 class="op-h2">Try it</h2><p class="op-sub">Paste a number you heard. We compare it with every source and show who agrees.</p>' +
      '<div class="try"><div class="ask"><input id="op-in" type="text" aria-label="A claim about India\'s waste figures" placeholder="e.g. 81% of India\'s urban waste is processed" autocomplete="off"><button class="go" id="op-go" type="button">Check</button></div>' +
      '<div class="ex">' + EXAMPLES.map(function (x, i) { return '<button class="chip" type="button" data-i="' + i + '">' + esc(x) + "</button>"; }).join("") + '</div><div class="res" id="op-res" aria-live="polite"></div></div>' +
      '<h2 class="op-h2">Start with what you need</h2><div class="quick">' +
      '<a href="#/help/complain">My garbage is not being collected<span>Write a clear complaint and keep track of it</span></a><a href="#/help/bins">Which bin does this go in?<span>The four streams under the 2026 rules</span></a>' +
      '<a href="#/brief/card">Explain my state in plain words<span>A shareable card and a briefing for an MP, MLA or councillor</span></a><a href="#/school">Our school wants to weigh its waste<span>A week of weighing becomes a report card</span></a>' +
      '<a href="#/map">How is my state doing?<span>The map, with the source for every figure</span></a></div>' +
      '<div class="op-honest"><strong>What we won\'t do.</strong> We don\'t say a figure is wrong, only that sources disagree. We don\'t fill gaps: blank means &ldquo;not reported&rdquo;. We draft complaints and letters, we never send them. All figures are self-reported by states and cities; we check consistency, not what is on your street.</div></div>';

    /* print the receipt line by line; everything is visible by default and forced visible after 4 s, so a throttled tab never leaves it blank */
    var lines = [].slice.call(view.querySelectorAll(".receipt .ln")), stamp = view.querySelector(".stamp");
    if (!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      lines.forEach(function (l) { l.classList.add("pre"); }); stamp.classList.add("pre");
      lines.forEach(function (l, i) { setTimeout(function () { l.classList.remove("pre"); }, 250 + 550 * i); });
      setTimeout(function () { stamp.classList.remove("pre"); }, 2000);
      setTimeout(function () { lines.forEach(function (l) { l.classList.remove("pre"); }); stamp.classList.remove("pre"); }, 4000);
    }
    function check(text) {
      var p = root.KSClaim.parseSentence(KS, text), res = $("op-res");
      if (p.value == null || !p.metric) { res.innerHTML = '<p class="note">We could not find a number in that sentence. Try a figure with % or &ldquo;tonnes per day&rdquo;, or use <a href="#/claim">Check a claim</a>.</p>'; return; }
      var r = root.KSClaim.checkClaim(KS, { metric: p.metric, value: p.value, unit: p.unit, state: p.state || null, year: p.year || null }), V = LBL[r.verdict], pct = r.claim && r.claim.unit === "percent";
      res.innerHTML = '<span class="vrd ' + V[1] + '">' + V[0] + "</span>" + (r.records.length ? r.records.slice(0, 6).map(function (x) {
        return '<div class="rec2"><span><span class="' + (x.matches ? "y" : "nn") + '">' + (x.matches ? "&#10003;" : "&#10007;") + "</span> " + esc(x.source_name) + " " + esc(x.year) + (x.kind === "computed" ? " (computed)" : "") + '</span><span>' + (+x.value).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + (pct ? "%" : " t/day") + "</span></div>"; }).join("") +
        '<p class="note"><a href="#/claim">See every source and open the pages</a>. Figures cover ' + Array.from(new Set(r.records.map(function (x) { return x.year; }))).sort().join(", ") + "; part of any difference may be real change.</p>" : '<p class="note">' + esc(r.reason) + "</p>");
    }
    $("op-go").onclick = function () { check($("op-in").value); }; $("op-in").onkeydown = function (e) { if (e.key === "Enter") check(this.value); };
    view.querySelectorAll(".try .chip").forEach(function (b) { b.onclick = function () { $("op-in").value = EXAMPLES[+b.dataset.i]; check($("op-in").value); }; });
  }
  function stub(n, t, p, href, label, chip) { return '<div class="stub"><span class="n" aria-hidden="true">' + n + "</span><h3>" + t + "</h3><p>" + p + "</p>" + (chip ? '<span class="chip2">' + chip + "</span>" : "") + '<a href="' + href + '">' + label + " &rarr;</a></div>"; }
  root.KSOpening = { render: render };
})(window);
