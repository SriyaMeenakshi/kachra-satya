/* Kachra Satya app: one page, hash routes. Reuses ../trust/data.js (window.KS), ../trust/claim.js (KSClaim) and city.js (KSCity).
   Rules: never fill in missing data ("not reported"); every number links to its source page; say "the sources disagree", never "wrong". */
(function () {
  var KS = window.KS, CFG = window.KS_CONFIG || {}, $ = function (i) { return document.getElementById(i); };
  var RB = "../../receipts/";                               /* page images; change if deployed elsewhere */
  var root = document.documentElement, view = $("view");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function n0(v) { return v == null ? "not reported" : Math.round(v).toLocaleString("en-IN"); }
  function fmt(v) { return v == null ? "not reported" : (+v).toLocaleString("en-IN", { maximumFractionDigits: 3 }); }
  function opts(list, first) { return (first ? '<option value="">' + first + "</option>" : "") + list.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join(""); }
  $("built").textContent = KS.built;
  var states = Array.from(new Set(KS.waste.map(function (r) { return r.state; }))).sort();
  var years = Array.from(new Set(KS.waste.map(function (r) { return r.year; }))).sort();

  /* ---------- theme ---------- */
  try { var th = localStorage.getItem("ks-theme"); if (th) root.setAttribute("data-theme", th); } catch (e) {}
  $("theme").onclick = function () {
    var dark = root.getAttribute("data-theme") === "dark" || (!root.getAttribute("data-theme") && matchMedia("(prefers-color-scheme:dark)").matches);
    var next = dark ? "light" : "dark"; root.setAttribute("data-theme", next);
    try { localStorage.setItem("ks-theme", next); } catch (e) {}
    if (route().name === "map") renderMap(route().args[0]);
    else if (route().name === "start") go();
    else if (route().name === "gaps" && route().args[0] === "money") renderGaps("money");   /* the scatter reads theme colours */
  };

  /* ---------- receipts: every number links to its source page ---------- */
  function receiptHTML(key) {
    var rc = KS.receipts[key], p = key.split("|");
    if (!rc || !rc.image) return '<p class="note">No page image for this figure.</p>';
    var b = rc.bbox ? '<div class="box" style="left:' + rc.bbox[0] * 100 + "%;top:" + rc.bbox[1] * 100 + "%;width:" + (rc.bbox[2] - rc.bbox[0]) * 100 + "%;height:" + (rc.bbox[3] - rc.bbox[1]) * 100 + '%"></div>' : "";
    return "<p><strong>" + esc(p[0]) + ", " + esc(p[1]) + ", " + esc(p[2]) + '</strong><br><span class="note">' + esc(p[3]) + ", page " + esc(rc.page) + ". " +
      (rc.status === "located" ? "The red box marks the figure." : "The figure is on this page; we could not mark its exact position.") + '</span></p><div class="img"><img alt="Page ' + esc(rc.page) + " of " + esc(p[3]) + '" src="' + RB + esc(rc.image) + '">' + b + "</div>";
  }
  function openReceipt(key) { $("dlgbody").innerHTML = receiptHTML(key); $("dlg").showModal(); }
  $("dlgx").onclick = function () { $("dlg").close(); };
  $("dlg").addEventListener("click", function (e) { if (e.target === this) this.close(); });
  function hasR(key) { return KS.receipts[key] && KS.receipts[key].image; }
  function dn(d) { return window.KSAnswer ? KSAnswer.docName(d) : d; }      /* plain document name for a file name (Lok Sabha Q50, not ls_au50_2025-12-01.pdf) */
  function rbtn(key, label) { return hasR(key) ? '<button class="link" data-rkey="' + esc(key) + '" type="button">' + (label || "page") + "</button>" : ""; }
  function wireR(el) { el.querySelectorAll("[data-rkey]").forEach(function (b) { b.onclick = function () { openReceipt(b.dataset.rkey); }; }); }

  /* ---------- routing ---------- */
  var TITLES = { start: "Start", help: "Get help", brief: "Briefing", school: "Schools", dropoff: "Nearest drop-off", ward: "Your ward", map: "Map", claim: "Check a claim", gaps: "Insights", city: "Your city", ask: "Ask", explore: "Insights", about: "About" };
  function route() {
    var h = decodeURIComponent((location.hash || "#/start").replace(/^#\/?/, "")).split("/"), n = h[0], a = h.slice(1);
    if (n === "insights") { n = "gaps"; } else if (n === "audit") { n = "explore"; a = ["audit"]; } else if (n === "receipts") { n = "explore"; a = ["receipts"].concat(a); } else if (n === "definitions") { n = "explore"; a = ["defs"]; }
    return { name: TITLES[n] ? n : "start", args: a };
  }
  function go() {
    var r = route(); document.title = TITLES[r.name] + " | Kachra Satya"; var mm = document.querySelector("#nav .more"); if (mm) mm.open = false;
    document.querySelectorAll("#nav a").forEach(function (a) { if ((a.dataset.r || "").split(" ").indexOf(r.name) >= 0) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    ({ start: function () { KSSaathi.renderStart(); }, help: function (tab, args) { KSSaathi.renderHelp(tab, args); }, brief: function (tab, args) { KSLeaders.render(args); }, school: function () { KSSchool.render(); }, dropoff: function () { KSDropoff.render(); }, ward: function (tab, args) { KSWard.render(args); }, map: renderMap, claim: renderClaim, gaps: renderGaps, city: renderCity, ask: renderAsk, explore: renderExplore, about: function () { KSAbout.render(); } })[r.name](r.args[0], r.args);
    wireR(view);
    /* every page gets one level-1 heading (so a screen reader announces the page) and a matching icon (so the pages read as one product) */
    var PG = { map: "i-map", claim: "i-claim", gaps: "i-gaps", city: "i-city", ask: "i-ask", explore: "i-explore", ward: "i-ward", help: "i-help", dropoff: "i-bin" }, hh = view.querySelector("h1, h2");
    if (hh && !view.querySelector("h1")) hh.setAttribute("aria-level", "1");
    if (hh && PG[r.name] && hh.parentNode === view && !hh.querySelector(".pg-ic")) hh.insertAdjacentHTML("afterbegin", '<svg class="pg-ic" aria-hidden="true"><use href="#' + PG[r.name] + '"/></svg>');
    if (!(r.name === "map" && r.args[0])) { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
  }
  window.addEventListener("hashchange", go);
  window.addEventListener("ks-lang", function () { var n = route().name; if (n === "start" || n === "claim" || n === "map") go(); });   /* only pages that are translated; others keep what the person typed */
  document.addEventListener("click", function (e) { var m = document.querySelector("#nav .more"); if (m && m.open && !m.contains(e.target)) m.open = false; });

  /* ---------- sortable, searchable table ---------- */
  function mountTable(el, cols, rows, o) {
    o = o || {}; var st = { q: "", k: o.sort || null, d: o.dir || 1, all: false }, limit = o.limit || 10;
    el.innerHTML = '<div class="tools">' + (o.search === false ? "" : '<input type="search" placeholder="' + (o.ph || "Search") + '" aria-label="Search this table">') + '<span class="note" data-c></span></div><div class="tw"><table></table></div><p><button class="link" data-m type="button" hidden></button></p>';
    var tbl = el.querySelector("table"), more = el.querySelector("[data-m]"), cnt = el.querySelector("[data-c]"), inp = el.querySelector("input");
    function text(r) { return cols.map(function (c) { return String(c.text ? c.text(r) : c.val ? c.val(r) : r[c.k]); }).join(" ").toLowerCase(); }
    function draw() {
      var rs = rows.filter(function (r) { return !st.q || text(r).indexOf(st.q) >= 0; });
      if (st.k) { var c = cols.filter(function (x) { return x.label === st.k; })[0]; var g = function (r) { return c.val ? c.val(r) : r[c.k]; };
        rs = rs.slice().sort(function (a, b) { var x = g(a), y = g(b); return (x == null ? 1 : y == null ? -1 : x < y ? -1 : x > y ? 1 : 0) * st.d; }); }
      var shown = st.all || st.q ? rs : rs.slice(0, limit);
      tbl.innerHTML = "<thead><tr>" + cols.map(function (c) { return '<th class="s' + (c.num ? " num" : "") + '" data-k="' + esc(c.label) + '" scope="col" aria-sort="' + (st.k === c.label ? (st.d > 0 ? "ascending" : "descending") : "none") + '" tabindex="0">' + esc(c.label) + (st.k === c.label ? (st.d > 0 ? " ↑" : " ↓") : "") + "</th>"; }).join("") + "</tr></thead><tbody>" +
        (shown.length ? shown.map(function (r) { return "<tr>" + cols.map(function (c) { return "<td" + (c.num ? ' class="num"' : "") + ">" + (c.html ? c.html(r) : esc(r[c.k])) + "</td>"; }).join("") + "</tr>"; }).join("") : '<tr><td colspan="' + cols.length + '" class="note">Nothing matches.</td></tr>') + "</tbody>";
      cnt.textContent = rs.length + " of " + rows.length;
      more.hidden = st.q || rs.length <= limit; more.textContent = st.all ? "Show fewer" : "Show all " + rs.length;
      tbl.querySelectorAll("th.s").forEach(function (h) { var f = function () { st.d = st.k === h.dataset.k ? -st.d : 1; st.k = h.dataset.k; draw(); }; h.onclick = f; h.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } }; });
      wireR(tbl);
    }
    if (inp) inp.oninput = function () { st.q = inp.value.trim().toLowerCase(); draw(); };
    more.onclick = function () { st.all = !st.all; draw(); }; draw();
  }

  /* ---------- claim checker widget (used on the map page and the Check a claim page) ---------- */
  var VERD = { SUPPORTED: ["v_sup", "v_sup_s"], CONTRADICTED: ["v_con", "v_con_s"], SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS: ["v_mix", "v_mix_s"], CANNOT_VERIFY: ["v_cant", "v_cant_s"] };
  var VICON = { SUPPORTED: "\u2713", CONTRADICTED: "\u2715", SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS: "\u2260", CANNOT_VERIFY: "?" };
  var EXAMPLES = ["81% of India's urban waste is processed", "62% of India's waste is treated", "Delhi treated 7,542 tonnes per day in 2023-24", "Maharashtra landfilled 2,067 tonnes per day in 2021-22"];
  function mountClaim(el, o) {
    o = o || {};
    el.innerHTML = '<div class="ask"><input id="cin" type="text" aria-label="A claim about India\'s waste figures" placeholder="Paste a claim, e.g. 81% of India\'s urban waste is processed" autocomplete="off"><button class="go" id="cgo" type="button">Check</button></div>' +
      '<div class="chips" id="cex" aria-label="Examples">' + EXAMPLES.map(function (x, i) { return '<button class="chip" type="button" data-i="' + i + '">' + esc(x) + "</button>"; }).join("") + "</div>" +
      '<div id="cres" aria-live="polite"></div><details class="more" id="cadj"><summary>Adjust what we read</summary><div><div class="grid2"><div><label for="metric">Claim</label><select id="metric"><option value="processed_pct">Share processed (%)</option><option value="generated">Generated (tpd)</option><option value="collected">Collected (tpd)</option><option value="treated">Treated (tpd)</option><option value="landfilled">Landfilled (tpd)</option></select></div>' +
      '<div><label for="value">Value</label><input id="value" type="number" step="any"></div><div><label for="cstate">Place</label><select id="cstate">' + opts(["India (national)"].concat(states)) + '</select></div><div><label for="cyear">Year</label><select id="cyear">' + opts(years, "any") + '</select></div></div><p><button class="alt" id="cagain" type="button">Check these values</button></p></div></details>';
    function check() {
      var st = $("cstate").value, v = parseFloat($("value").value);
      if (isNaN(v)) { $("cres").innerHTML = '<p class="note">We could not find a number in that sentence. Try a figure with % or "tonnes per day", or open "Adjust what we read".</p>'; return; }
      var r = KSClaim.checkClaim(KS, { metric: $("metric").value, value: v, state: st.indexOf("India") === 0 ? null : st, year: $("cyear").value || null }), V = VERD[r.verdict];
      var yrs = Array.from(new Set(r.records.map(function (x) { return x.year; }))).sort(), pct = r.claim && r.claim.unit === "percent";
      var na = r.records.filter(function (x) { return x.matches; }).length, nd = r.records.length - na, T = KSi18n.t;
      /* Conclusion first: the claim, the verdict, the headline figure from each source, what it means, the evidence. Every source record stays one tap away. */
      function newest(src) {
        var rs = r.records.filter(function (x) { return x.source_name === src; }).sort(function (p, q) { return (q.year > p.year ? 1 : q.year < p.year ? -1 : 0) || (p.kind === "stated" ? -1 : 1); });
        return rs[0] || null;
      }
      var heads = ["MoHUA", "CPCB"].map(newest).filter(Boolean);
      if (heads.length < 2) heads = heads.concat(r.records.filter(function (x) { return heads.indexOf(x) < 0; }).slice(0, 2 - heads.length));
      function fig(x) { return fmt(x.value) + (pct ? "%" : " tonnes a day"); }
      function recRow(x) {
        var key = [x.scope, x.year, r.claim.metric, x.source_doc].join("|");
        return '<div class="rec"><span class="mk ' + (x.matches ? "y" : "n") + '" aria-label="' + (x.matches ? "matches" : "does not match") + '">' + (x.matches ? "✓" : "✗") + "</span><div><strong>" + esc(x.source_name) + " " + esc(x.year) + '</strong> <span class="note">' + esc(dn(x.source_doc)) + ", p." + esc(x.source_page) + (x.kind === "computed" ? " · computed by us: " + esc(x.note) : "") + '</span></div><div><span class="fig">' + fig(x) + "</span> " + rbtn(key, "page") + (pct ? meanPct(x.value) : mean(x.value)) + "</div></div>";
      }
      var said = ($("cin").value || "").trim(), sentence = said || (r.claim ? $("metric").selectedOptions[0].text + " = " + r.claim.value + (pct ? "%" : " tpd") + ", " + r.claim.state : "");
      var h = '<div class="claimcard"><p class="cc-claim"><span class="cc-l">Claim</span> ' + esc(sentence) + "</p>" +
        '<div class="verdict v-' + r.verdict + '"><div class="b"><span aria-hidden="true">' + VICON[r.verdict] + "</span> " + esc(T(V[0])) + '</div><div class="vsent">' + esc(T(V[1])) + "</div></div>";
      if (heads.length) h += '<div class="cc-figs">' + heads.map(function (x) {
        return '<div class="cc-fig"><div class="cc-n">' + fig(x) + '</div><div class="cc-s"><b>' + esc(x.source_name) + "</b><br>" + esc(x.year) + " " + (x.kind === "computed" ? "computed by us" : "reported figure") + "</div></div>"; }).join("") + "</div>";
      h += '<h3 class="cc-h">What does this mean?</h3><p class="cc-p">' + (r.records.length ? na + " of " + r.records.length + " source figures match the claim. " : "") +
        (yrs.length > 1 || heads.length > 1 ? "The reports cover different years" + (yrs.length > 1 ? " (" + yrs[0] + " to " + yrs[yrs.length - 1] + ")" : "") + " and may use different words (&ldquo;processed&rdquo;, &ldquo;treated&rdquo;), so these figures should not be read as a like-for-like comparison of the same period. " : "") +
        "We do not say which source is right.</p>";
      if (heads.length) h += '<h3 class="cc-h">Evidence</h3><ul class="cc-ev">' + heads.map(function (x) { var key = [x.scope, x.year, r.claim.metric, x.source_doc].join("|"); return "<li>" + esc(dn(x.source_doc)) + ", page " + esc(x.source_page) + " " + rbtn(key, "open the page") + "</li>"; }).join("") + "</ul>";
      if (r.records.length) h += '<details class="more cc-all"><summary>See all source records (' + r.records.length + ')</summary><div class="recs">' + r.records.map(recRow).join("") + "</div></details>";
      h += '<details class="more"><summary>How we read this</summary><div>' + (r.claim ? "<p>Read as: " + esc($("metric").selectedOptions[0].text) + " = " + esc(r.claim.value) + (pct ? "%" : " tpd") + ", " + esc(r.claim.state) + ", " + (r.claim.year ? esc(r.claim.year) : "any year") + ". Counts as matching within " + esc(r.tolerance) + ".</p>" : "") + "<p>" + esc(r.reason) + ".</p></div></details></div>";
      $("cres").innerHTML = h; wireR($("cres"));
    }
    function fromSentence() {
      var p = KSClaim.parseSentence(KS, $("cin").value);
      if (p.reason) { $("cres").innerHTML = '<p class="note" role="alert">' + esc(p.reason) + "</p>"; return; }   /* a sentence we cannot check: say why, check nothing */
      if (p.year && years.indexOf(p.year) < 0) { $("cres").innerHTML = '<p class="note" role="alert">We hold no figures for ' + esc(p.year) + ". Our years run from " + esc(years[0]) + " to " + esc(years[years.length - 1]) + ". Remove the year to check every year, or pick one of ours.</p>"; return; }   /* never quietly drop the year and check something else */
      if (p.metric) $("metric").value = p.metric; if (p.value != null) $("value").value = p.value; else $("value").value = "";
      $("cstate").value = p.state || "India (national)"; $("cyear").value = p.year && years.indexOf(p.year) >= 0 ? p.year : ""; check();
    }
    $("cgo").onclick = fromSentence; $("cagain").onclick = check;
    $("cin").onkeydown = function (e) { if (e.key === "Enter") fromSentence(); };
    $("cex").querySelectorAll(".chip").forEach(function (b) { b.onclick = function () { $("cin").value = EXAMPLES[+b.dataset.i]; fromSentence(); }; });
    if (o.focus) $("cin").focus();
  }
  function renderClaim() {
    view.innerHTML = '<h2>Check a claim</h2><p class="sub">Type or paste a number someone quoted. We compare it with every source we hold and show who agrees.</p><div class="card pad" id="cbox"></div><p class="note">Prefer your own words, or Hindi, Tamil or Telugu? <a href="#/ask">Ask a question instead</a>.</p>';
    mountClaim($("cbox"), { focus: true }); $("cin").value = EXAMPLES[0]; $("cgo").click();
  }

  /* ---------- Map (home) ---------- */
  var GRID = { "Ladakh": [0, 3], "Jammu and Kashmir": [1, 2], "Himachal Pradesh": [1, 3], "Punjab": [2, 2], "Chandigarh": [2, 3], "Uttarakhand": [2, 4], "Rajasthan": [3, 1], "Haryana": [3, 2], "Delhi": [3, 3], "Uttar Pradesh": [3, 4], "Bihar": [3, 5], "Sikkim": [3, 6], "Arunachal Pradesh": [3, 8], "Gujarat": [4, 0], "Madhya Pradesh": [4, 3], "Chhattisgarh": [4, 4], "Jharkhand": [4, 5], "West Bengal": [4, 6], "Assam": [4, 7], "Nagaland": [4, 8], "Dadra and Nagar Haveli and Daman and Diu": [5, 1], "Maharashtra": [5, 2], "Telangana": [5, 3], "Odisha": [5, 5], "Meghalaya": [5, 7], "Manipur": [5, 8], "Goa": [6, 1], "Karnataka": [6, 2], "Andhra Pradesh": [6, 4], "Tripura": [6, 7], "Mizoram": [6, 8], "Kerala": [7, 2], "Tamil Nadu": [7, 3], "Puducherry": [7, 4], "Andaman and Nicobar Islands": [8, 7], "Lakshadweep": [7, 0] };
  var ABB = { "Ladakh": "LA", "Jammu and Kashmir": "JK", "Himachal Pradesh": "HP", "Punjab": "PB", "Chandigarh": "CH", "Uttarakhand": "UK", "Rajasthan": "RJ", "Haryana": "HR", "Delhi": "DL", "Uttar Pradesh": "UP", "Bihar": "BR", "Sikkim": "SK", "Arunachal Pradesh": "AR", "Gujarat": "GJ", "Madhya Pradesh": "MP", "Chhattisgarh": "CG", "Jharkhand": "JH", "West Bengal": "WB", "Assam": "AS", "Nagaland": "NL", "Dadra and Nagar Haveli and Daman and Diu": "DD", "Maharashtra": "MH", "Telangana": "TS", "Odisha": "OD", "Meghalaya": "ML", "Manipur": "MN", "Goa": "GA", "Karnataka": "KA", "Andhra Pradesh": "AP", "Tripura": "TR", "Mizoram": "MZ", "Kerala": "KL", "Tamil Nadu": "TN", "Puducherry": "PY", "Andaman and Nicobar Islands": "AN", "Lakshadweep": "LD" };
  function row(state, year, src, metric) { return KS.waste.filter(function (x) { return x.state === state && x.year === year && x.source_name === src && x.metric === metric; })[0] || null; }
  function val(r) { return r && r.value_tpd != null ? r.value_tpd : null; }
  function natrow(y, s, m) { return KS.national.filter(function (x) { return x.state === "India" && x.year === y && x.source_name === s && x.metric === m; })[0] || {}; }
  var D = {};
  Object.keys(GRID).forEach(function (s) {
    var cg = val(row(s, "2023-24", "CPCB", "generated")), ct = val(row(s, "2023-24", "CPCB", "treated")), mg = val(row(s, "2025-26", "MoHUA", "generated")), mt = val(row(s, "2025-26", "MoHUA", "treated"));
    D[s] = { cpcb: cg && ct != null ? ct / cg * 100 : null, mohua: mg && mt != null ? mt / mg * 100 : null };
    D[s].gap = D[s].cpcb != null && D[s].mohua != null ? D[s].mohua - D[s].cpcb : null;
  });
  var flagged = {}; KS.flags.forEach(function (f) { if (f.rule.indexOf("3_") !== 0) flagged[f.state] = 1; });
  var STEPS = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7"], MODE = "cpcb", VIEW = (function () { try { return localStorage.getItem("ks-mapview") || "geo"; } catch (e) { return "geo"; } })(), QUERY = "", DOM = { cpcb: [0, 100], mohua: [0, 100], gap: [0, 80] };
  function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
  function lum(hex) { var m = hex.replace("#", ""); if (m.length === 3) m = m.replace(/./g, "$&$&"); var c = [0, 2, 4].map(function (i) { var x = parseInt(m.substr(i, 2), 16) / 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function colourFor(v) { return rampColour(MODE, v, false); }
  var MODES = [["cpcb", "CPCB % treated"], ["mohua", "MoHUA % processed"], ["gap", "Gap"]];
  var NOTE = { cpcb: "CPCB 2023-24: treated / generated", mohua: "MoHUA 2025-26: processed / generated", gap: "MoHUA minus CPCB, percentage points (different years)" };
  /* ramps: % treated or processed is lime to forest, the difference is coral; on the always-dark hero stage the ramps run dark to bright (tokens in theme.css) */
  var GSTEPS = ["--g1", "--g2", "--g3", "--g4", "--g5", "--g6", "--g7"], DSTEPS = ["--d1", "--d2", "--d3", "--d4", "--d5", "--d6", "--d7"], DGSTEPS = ["--dg1", "--dg2", "--dg3", "--dg4", "--dg5", "--dg6", "--dg7"];
  function rampColour(mode, v, onDark) { var d = DOM[mode], k = Math.max(0, Math.min(6, Math.floor((v - d[0]) / (d[1] - d[0]) * 7))); return css((mode === "gap" ? (onDark ? DGSTEPS : GSTEPS) : (onDark ? DSTEPS : STEPS))[k]); }
  /* shared with opening.js so the Start page map reads the same numbers, colours and flags as the Map page */
  window.KSMapKit = { states: Object.keys(GRID), dom: DOM, value: function (s, mode) { return D[s] ? D[s][mode] : null; }, colour: rampColour, ink: function (bg) { return lum(bg) > .179 ? "#0b0b0b" : "#fff"; }, flagged: flagged, abb: ABB,
    label: function (s, mode) { var v = D[s][mode]; return s + ": " + (v == null ? "not reported" : mode === "gap" ? v.toFixed(1) + " points" : v.toFixed(1) + "%") + (flagged[s] ? ", has data flags" : ""); } };

  function renderMap(sel) {
    if (sel && !GRID[sel]) sel = "";
    var cg = natrow("2023-24", "CPCB", "generated").value, ct = natrow("2023-24", "CPCB", "treated"), mg = natrow("2025-26", "MoHUA", "generated").value, mt = natrow("2025-26", "MoHUA", "treated");
    var I = KSi18n, mp = Math.round(mt.value / mg * 100), cp = Math.round(ct.value / cg * 100);
    view.innerHTML = '<h2>' + esc(I.t("nav_map")) + '</h2><p class="sub">Both official figures for every state and union territory, with the source page behind each. Select a state to open it.</p>' +
      '<div class="mapfacts"><div><b>' + mp + '%</b><span>' + I.term("mohua") + " says " + I.term("processed") + ", 2025-26 · " + esc(dn(mt.source_doc)) + ", p." + esc(mt.source_page) + " " + rbtn("India|2025-26|treated|" + mt.source_doc, "source page") + '</span></div>' +
      '<div><b>' + cp + '%</b><span>' + I.term("cpcb") + " figures give " + I.term("treated") + ", 2023-24, computed by us · " + esc(dn(ct.source_doc)) + ", p." + esc(ct.source_page) + " " + rbtn("India|2023-24|treated|" + ct.source_doc, "source page") + '</span></div>' +
      '<div><b>' + n0(mt.value - ct.value) + '</b><span>tonnes a day between the two reports: a difference between reports, not missing waste. The years differ, and we compare MoHUA\'s "processed" with CPCB\'s "treated" as our assumption, not a stated equivalence. <a href="#/explore/defs">Definitions</a></span></div></div>' +
      '<div class="section" id="mapsec"><div class="maprow"><div class="card"><div class="maptools"><input class="find" id="find" list="stl" type="search" placeholder="Find a state" aria-label="Find a state" value="' + esc(QUERY) + '"><datalist id="stl">' + states.map(function (s) { return '<option value="' + esc(s) + '">'; }).join("") + '</datalist><div class="seg" role="group" aria-label="Colour by">' +
      MODES.map(function (m) { return '<button type="button" data-m="' + m[0] + '" aria-pressed="' + (MODE === m[0]) + '">' + m[1] + "</button>"; }).join("") + '</div><div class="seg" role="group" aria-label="Map style">' +
      [["geo", "Map"], ["tiles", "Tiles"]].map(function (m) { return '<button type="button" data-v="' + m[0] + '" aria-pressed="' + (VIEW === m[0]) + '">' + m[1] + "</button>"; }).join("") + '</div></div><div class="tiles" id="tiles" role="group" aria-label="States and union territories"></div><div class="legend" id="legend"></div>' +
      '<details class="more readmap"><summary>How to read this map</summary><div><p><strong>Colour.</strong> Each state is coloured by the share of the waste it reports generating that it also reports treated (CPCB, 2023-24) or processed (MoHUA, 2025-26). Lighter is less, darker is more. The "Gap" layer is the difference between the two, in coral.</p><p><strong>Red dot or corner.</strong> A <button class="term" type="button" data-g="flag">flag</button>: figures in that state\'s own reports cannot all be true, for example more waste treated than collected. It does not say which figure to trust.</p><p><strong>Hatched.</strong> <button class="term" type="button" data-g="notreported">Not reported</button>: the source left the figure blank, or reports generated waste as 0 so no percentage can be worked out. We never fill gaps in.</p><p class="note">The two layers are different years and the two bodies may define their words differently, so a gap is a reason to look at the source pages, not a verdict.</p></div></details></div>' +
      '<aside class="card pad sp" id="detail" aria-live="polite"></aside></div></div>';
    var el = $("tiles"), geo = VIEW === "geo" && window.KS_INDIA && window.KSGeo;
    function slab(s) { var v = D[s][MODE]; return s + ": " + (v == null ? "not reported" : MODE === "gap" ? v.toFixed(1) + " points" : v.toFixed(1) + "%") + (flagged[s] ? ", has data flags" : ""); }
    if (geo) {
      el.className = "geo";
      KSGeo.draw(el, { value: function (s) { return D[s][MODE]; }, colour: colourFor, ink: function (bg) { return lum(bg) > .179 ? "#0b0b0b" : "#fff"; }, label: slab, selected: sel, flagged: flagged, abb: ABB,
        onSelect: function (s) { history.replaceState(null, "", "#/map/" + encodeURIComponent(s)); renderMap(s); if (matchMedia("(max-width:900px)").matches) $("detail").scrollIntoView({ behavior: "smooth", block: "start" }); },
        tip: function (lab, e) { var t = $("tip"); if (!lab) { t.style.display = "none"; return; } t.textContent = lab; t.style.display = "block"; t.style.left = Math.min(e.clientX + 14, innerWidth - 250) + "px"; t.style.top = (e.clientY + 14) + "px"; } });
    }
    (geo ? [] : Object.keys(GRID)).forEach(function (s) {
      var p = GRID[s], v = D[s][MODE], b = document.createElement("button"); b.type = "button"; b.dataset.s = s; b.className = "tile" + (v == null ? " none" : "") + (flagged[s] ? " fl" : "");
      b.style.gridRow = p[0] + 1; b.style.gridColumn = p[1] + 1; b.setAttribute("aria-pressed", sel === s);
      var lab = s + ": " + (v == null ? "not reported" : MODE === "gap" ? v.toFixed(1) + " points" : v.toFixed(1) + "%") + (flagged[s] ? ", has data flags" : ""); b.setAttribute("aria-label", lab);
      if (v != null) { var bg = colourFor(v); b.style.background = bg; b.style.color = lum(bg) > .179 ? "#0b0b0b" : "#fff"; }
      b.innerHTML = "<b>" + ABB[s] + "</b><small>" + (v == null ? "n/r" : Math.round(v)) + "</small>";
      b.onclick = function () { history.replaceState(null, "", "#/map/" + encodeURIComponent(s)); renderMap(s); if (matchMedia("(max-width:900px)").matches) $("detail").scrollIntoView({ behavior: "smooth", block: "start" }); };
      b.onmousemove = function (e) { var t = $("tip"); t.textContent = lab; t.style.display = "block"; t.style.left = Math.min(e.clientX + 14, innerWidth - 250) + "px"; t.style.top = (e.clientY + 14) + "px"; };
      b.onmouseleave = function () { $("tip").style.display = "none"; };
      b.tabIndex = (sel ? sel === s : s === "Delhi") ? 0 : -1;
      b.onkeydown = function (e) {
        var dir = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key]; if (!dir) return; e.preventDefault();
        var best = null, bd = 1e9;
        Object.keys(GRID).forEach(function (o) { if (o === s) return; var q = GRID[o], dr = q[0] - p[0], dc = q[1] - p[1];
          if (dir[0] && Math.sign(dr) !== dir[0]) return; if (dir[1] && Math.sign(dc) !== dir[1]) return;
          var d = dir[0] ? Math.abs(dr) * 3 + Math.abs(dc) : Math.abs(dc) * 3 + Math.abs(dr); if (d < bd) { bd = d; best = o; } });
        if (best) { var t = el.querySelector('[data-s="' + best.replace(/"/g, "") + '"]'); if (t) { t.tabIndex = 0; b.tabIndex = -1; t.focus(); } }
      };
      el.appendChild(b);
    });
    var d = DOM[MODE];
    $("legend").innerHTML = "<span>" + d[0] + (MODE === "gap" ? " pts" : "%") + '</span><span class="ramp" aria-hidden="true">' + (MODE === "gap" ? GSTEPS : STEPS).map(function (s) { return '<i style="background:var(' + s + ')"></i>'; }).join("") + "</span><span>" + d[1] + (MODE === "gap" ? "+ pts" : "%") + "</span><span>· " + NOTE[MODE] + "</span><span>· " + (geo ? "red dot" : "red corner") + " = flagged</span><span>· hatched = not reported</span>" + (geo ? '<span>· outlines simplified, not an authoritative boundary</span>' : "");
    document.querySelectorAll(".seg button[data-m]").forEach(function (b) { b.onclick = function () { MODE = b.dataset.m; renderMap(sel); }; });
    document.querySelectorAll(".seg button[data-v]").forEach(function (b) { b.onclick = function () { VIEW = b.dataset.v; try { localStorage.setItem("ks-mapview", VIEW); } catch (e) {} renderMap(sel); }; });
    function dim() { var q = QUERY.toLowerCase(); el.querySelectorAll(".tile,.geo-s").forEach(function (t) { t.classList.toggle("dim", !!q && t.dataset.s.toLowerCase().indexOf(q) < 0); }); }
    $("find").oninput = function () {
      QUERY = this.value.trim(); dim();
      var exact = states.filter(function (s) { return s.toLowerCase() === QUERY.toLowerCase(); })[0];
      if (exact) { history.replaceState(null, "", "#/map/" + encodeURIComponent(exact)); QUERY = ""; renderMap(exact); }
    };
    dim(); stateDetail(sel); wireR($("detail"));
    if (sel && document.activeElement === document.body) { var t = el.querySelector('[data-s="' + sel + '"]'); if (t) t.focus({ preventScroll: true }); }
  }

  /* plain-English lines and "not reported" reasons (shared by the state panel, claim evidence and the tables) */
  function r3(n) { return n >= 1000 ? Math.round(n / 100) * 100 : n >= 100 ? Math.round(n / 10) * 10 : Math.max(1, Math.round(n)); }
  function mean(tpd) {          /* 10 tonnes = one truck: an everyday picture, defined in the glossary */
    if (tpd == null || tpd === 0) return "";
    var n = tpd / 10; return '<div class="mean">' + (n < 1 ? "less than one " : n < 1.5 ? "≈ 1 " : "≈ " + r3(n).toLocaleString("en-IN") + " ") + KSi18n.term("truckload") + (n < 1 ? " a day" : n < 1.5 ? " a day" : "s a day") + ' <span class="note">(a picture, not a fleet count)</span></div>';
  }
  function meanPct(p) { if (p == null) return ""; return '<div class="mean">' + (p < 5 ? "almost none of it" : p > 95 ? "almost all of it" : "about " + Math.round(p / 10) + " in every 10 tonnes") + "</div>"; }
  function nr(reason) { return '<span class="nr">' + KSi18n.term("notreported") + '</span><div class="note">' + esc(reason || "the source gives no figure") + "</div>"; }
  function meter(label, v, cls, reason) {
    return '<div class="meter"><div class="top"><span>' + label + "</span><b>" + (v == null ? "" : v.toFixed(1) + "%") + "</b></div>" +
      (v == null ? nr(reason) : '<div class="track"><div class="fill ' + cls + '" style="width:' + Math.min(100, v) + '%"></div></div>' + meanPct(v)) + "</div>";
  }
  function numcard(termKey, s, y, src, m) {
    var r = row(s, y, src, m); if (!r) return "";
    var v = val(r);
    return '<div class="num3">' + (v == null ? nr(r.note) : '<div class="v">' + n0(v) + "</div>" + mean(v)) + '<div class="l">' + KSi18n.term(termKey) + "</div>" + (v != null ? rbtn([s, y, m, r.source_doc].join("|"), "source page") : "") + "</div>";
  }
  function stateDetail(s) {
    var box = $("detail");
    if (!s) {            /* nothing selected: show India as a whole, so the panel is useful before the first tap */
      var ng = natrow("2023-24", "CPCB", "generated").value, nt = natrow("2023-24", "CPCB", "treated").value, mg2 = natrow("2025-26", "MoHUA", "generated").value, mt2 = natrow("2025-26", "MoHUA", "treated").value;
      var withGap = states.filter(function (x) { return D[x] && D[x].gap != null; }), none = states.length - withGap.length;
      var top3 = withGap.slice().sort(function (a, b) { return Math.abs(D[b].gap) - Math.abs(D[a].gap); }).slice(0, 3);
      box.innerHTML = '<h3>India, nationally</h3><p class="note" style="margin-top:0">Pick a state on the map, or type its name, to replace this with the figures and source pages of that state.</p>' +
        meter("CPCB 2023-24 " + KSi18n.term("treated"), ng ? Math.round(nt / ng * 1000) / 10 : null, "c", "needs both a generated and a treated figure") + meter("MoHUA 2025-26 " + KSi18n.term("processed"), mg2 ? Math.round(mt2 / mg2 * 1000) / 10 : null, "", "needs both a generated and a treated figure") +
        '<p class="note">Different years, and the two bodies may not mean the same thing by their words. We do not say which is right.</p>' +
        '<h3>How to read the map</h3><ul class="note" style="margin:0;padding-left:1.2em"><li>Colour shows the chosen figure, or in Difference mode how far MoHUA sits above CPCB. Darker means a bigger difference between the two reports.</li><li>Grey means not enough is reported to compare: ' + none + ' of ' + states.length + ' states and UTs.</li></ul>' +
        (top3.length ? '<h3>Largest differences between the reports</h3><ol class="note" style="margin:0;padding-left:1.2em">' + top3.map(function (x) { return '<li><a href="#/map/' + encodeURIComponent(x) + '">' + esc(x) + "</a> (" + Math.abs(D[x].gap).toFixed(1) + " points)</li>"; }).join("") + "</ol>" : ""); return; }
    var fl = KS.flags.filter(function (f) { return f.state === s && f.rule.indexOf("3_") !== 0; }), au = KS.audit.filter(function (a) { return a.state === s; })[0], x = D[s];
    function why(y, src) { var g = val(row(s, y, src, "generated")); return g === 0 ? "generated waste is reported as 0, so no percentage can be worked out" : "needs both a generated and a treated figure"; }
    var h = "<h3>" + esc(s) + "</h3>" + (au ? '<a class="rank" href="#/explore/audit" style="text-decoration:none">Audit priority #' + au.rank + " of 36</a>" : "") +
      meter("CPCB 2023-24 " + KSi18n.term("treated"), x.cpcb, "c", why("2023-24", "CPCB")) + meter("MoHUA 2025-26 " + KSi18n.term("processed"), x.mohua, "", why("2025-26", "MoHUA")) +
      (x.gap != null ? '<p class="note">MoHUA is ' + Math.abs(x.gap).toFixed(1) + " points " + (x.gap >= 0 ? "higher" : "lower") + " than CPCB. Different years.</p>" : '<p class="note">Not enough is reported to compare the two.</p>') +
      '<p class="note" style="margin-bottom:0"><strong>CPCB 2023-24</strong>, ' + KSi18n.term("tpd") + '</p><div class="nums">' + numcard("generated", s, "2023-24", "CPCB", "generated") + numcard("collected", s, "2023-24", "CPCB", "collected") + numcard("treated", s, "2023-24", "CPCB", "treated") + "</div>" +
      '<p class="note" style="margin-bottom:0"><strong>MoHUA 2025-26</strong>, ' + KSi18n.term("tpd") + '</p><div class="nums">' + numcard("generated", s, "2025-26", "MoHUA", "generated") + numcard("processed", s, "2025-26", "MoHUA", "treated") + "</div>" +
      (fl.length ? '<details class="more"><summary>' + fl.length + " flag" + (fl.length > 1 ? "s" : "") + " in this state's own reports</summary><div><p>A " + KSi18n.term("flag") + " means two reported figures cannot both be true. It does not say which one to trust.</p>" + fl.map(function (f) { return '<div class="flag"><span class="pill">' + esc(f.year) + "</span><span>" + esc(f.explanation) + ' <span class="note">(' + esc(f.values) + ")</span></span></div>"; }).join("") + "</div></details>" : '<p class="note">No flags in this state\'s own reports.</p>') +
      '<p><a class="alt" style="display:inline-block;text-decoration:none" href="#/explore/receipts/' + encodeURIComponent(s) + '">All years and source pages</a></p>';
    box.innerHTML = h;
  }

  /* ---------- Explore: audit first, receipts, swings, definitions ---------- */
  var TABS = [["audit", "Audit first"], ["receipts", "Receipts"], ["swings", "Swings"], ["defs", "Definitions"]];
  /* Insights = the old Gaps and Explore pages under one heading and one tab strip. Their routes (#/gaps/..., #/explore/...) are unchanged. */
  function insightsNav(page, tab) {
    function strip(label, list, base, on) { return '<p class="ins-l">' + label + '</p><nav class="tabs" aria-label="' + label + '">' + list.map(function (t) { return '<a href="#/' + base + "/" + t[0] + '"' + (page === base && t[0] === tab ? ' aria-current="page"' : "") + ">" + t[1] + "</a>"; }).join("") + "</nav>"; }
    return '<div class="ins">' + strip("Money and gaps", GTABS, "gaps") + strip("Sources and checks", TABS, "explore") + "</div>";
  }
  function renderExplore(tab, args) {
    if (!TABS.some(function (t) { return t[0] === tab; })) tab = "audit";
    view.innerHTML = '<h2>Insights</h2><p class="sub">Where the figures disagree, where money and results do not line up, and the source pages behind every number.</p>' + insightsNav("explore", tab) + '<div id="tab"></div>';
    ({ audit: tabAudit, receipts: tabReceipts, swings: tabSwings, defs: tabDefs })[tab]($("tab"), args ? args.slice(1) : []);
  }
  function tabAudit(el) {
    el.innerHTML = '<p class="sub">Where an audit would learn most. This is a ranking, not a finding that any state\'s data is wrong. It blends the CPCB-vs-MoHUA gap, swings between reports, within-source flags, repeat flags and missing figures.</p><div class="card pad" id="at"></div><h3>Same problem in several years</h3><div class="card pad tw" id="rt"></div>';
    mountTable($("at"), [
      { label: "#", k: "rank", num: true },
      { label: "State", k: "state", html: function (r) { return '<a href="#/map/' + encodeURIComponent(r.state) + '">' + esc(r.state) + "</a>"; } },
      { label: "Score", k: "priority_score", num: true, html: function (r) { return '<div class="bar10" style="width:' + Math.round(r.priority_score * 100) + 'px"></div>' + r.priority_score.toFixed(2); } },
      { label: "Why", k: "main_reasons", html: function (r) { return String(r.main_reasons).split(";").map(function (t) { return '<span class="tag">' + esc(t.trim()) + "</span>"; }).join(""); } }
    ], KS.audit, { sort: "#", ph: "Search states or reasons" });
    mountTable($("rt"), [{ label: "State", k: "state" }, { label: "Rule", k: "rule" }, { label: "Years", k: "n_years", num: true }, { label: "Which", k: "years" }], KS.recurrence, { search: false });
  }
  function genKey(state, tag) { var p = String(tag || "").split(" "), r = row(state, p[0], p[1], "generated"); return r ? [state, p[0], "generated", r.source_doc].join("|") : ""; }
  function tabSwings(el) {
    el.innerHTML = '<p class="sub">How much a state\'s own reported generated waste differs from one report to the next.</p><div class="card pad" id="vt"></div>';
    var rows = KS.volatility.filter(function (r) { return r.ranked === "yes"; }), mx = Math.max.apply(null, rows.map(function (r) { return r.swing_ratio; }));
    mountTable($("vt"), [
      { label: "#", k: "rank", num: true }, { label: "State", k: "state" },
      { label: "Swing", k: "swing_ratio", html: function (r) { return '<div class="bar10" style="width:' + Math.max(2, r.swing_ratio / mx * 100) + '%;max-width:160px"></div>' + r.swing_ratio + "x"; } },
      { label: "Lowest", k: "min_tpd", num: true, html: function (r) { return fmt(r.min_tpd) + mean(r.min_tpd) + '<span class="note">' + esc(r.min_in) + "</span> " + rbtn(genKey(r.state, r.min_in), "page"); } },
      { label: "Highest", k: "max_tpd", num: true, html: function (r) { return fmt(r.max_tpd) + mean(r.max_tpd) + '<span class="note">' + esc(r.max_in) + "</span> " + rbtn(genKey(r.state, r.max_in), "page"); } }
    ], rows, { sort: "#", ph: "Search states" });
  }
  function tabReceipts(el, rest) {
    el.innerHTML = '<p class="sub">Every figure with the page it came from. Open a page to see the number boxed in red.</p><div class="card pad"><div class="grid2"><div><label for="rstate">Place</label><select id="rstate">' + opts(["India"].concat(states)) + '</select></div><div><label for="ryear">Year</label><select id="ryear">' + opts(years, "all") + '</select></div><div><label for="rmetric">Figure</label><select id="rmetric"><option value="">all</option><option>generated</option><option>collected</option><option>treated</option><option>landfilled</option></select></div></div><div id="rtab" style="margin-top:12px"></div></div>';
    if (rest[0] && states.indexOf(rest[0]) >= 0) $("rstate").value = rest[0];
    function draw() {
      var s = $("rstate").value, y = $("ryear").value, m = $("rmetric").value;
      var src = s === "India" ? KS.national.map(function (r) { return { state: "India", year: r.year, metric: r.metric, value: r.value, source_name: r.source_name, source_doc: r.source_doc, source_page: r.source_page, note: r.note }; })
        : KS.waste.map(function (r) { return { state: r.state, year: r.year, metric: r.metric, value: r.value_tpd, source_name: r.source_name, source_doc: r.source_doc, source_page: r.source_page, note: r.note }; });
      mountTable($("rtab"), [
        { label: "Year", k: "year" }, { label: "Figure", k: "metric" }, { label: "Value", k: "value", num: true, html: function (r) { return r.value == null ? nr(r.note) : fmt(r.value) + (r.metric === "processed_pct" ? meanPct(r.value) : mean(r.value)); } },
        { label: "Source", k: "source_doc", html: function (r) { return esc(r.source_name) + ' <span class="note">' + esc(dn(r.source_doc)) + ", p." + esc(r.source_page) + "</span>"; }, text: function (r) { return r.source_name + " " + r.source_doc; } },
        { label: "Page", k: "x", html: function (r) { var key = [r.state, r.year, r.metric, r.source_doc].join("|"); return rbtn(key, "open page") || '<span class="note">' + (r.value == null ? "not reported" : "no page image") + "</span>"; }, val: function (r) { return hasR([r.state, r.year, r.metric, r.source_doc].join("|")) ? 0 : 1; }, text: function () { return ""; } }
      ], src.filter(function (r) { return r.state === s && (!y || r.year === y) && (!m || r.metric === m); }), { limit: 12, ph: "Search this list" });
    }
    ["rstate", "ryear", "rmetric"].forEach(function (id) { $(id).onchange = draw; }); draw();
  }
  function glossaryHTML() {
    var I = KSi18n;
    return '<h3 style="margin-top:0">Glossary</h3><p class="sub">Plain-English meanings. You can also tap any dotted-underlined word on the site.</p><div class="tools"><input id="gsearch" type="search" placeholder="Search terms" aria-label="Search the glossary"></div><div class="defs" id="glist">' +
      Object.keys(I.glossary).map(function (k) { var g = I.gl(k); return '<details data-k="' + k + '" id="g-' + k + '"><summary>' + esc(g[0]) + "</summary><p>" + esc(g[1]) + "</p></details>"; }).join("") + "</div>";
  }
  function wireGlossary(el, rest) {
    var inp = el.querySelector("#gsearch"); if (!inp) return;
    inp.oninput = function () { var q = this.value.trim().toLowerCase(); el.querySelectorAll("#glist details").forEach(function (d) { d.hidden = !!q && d.textContent.toLowerCase().indexOf(q) < 0; }); };
    if (rest && rest[0]) { var d = el.querySelector("#g-" + rest[0]); if (d) { d.open = true; d.scrollIntoView({ block: "center" }); } }
  }
  function tabDefs(el, rest) {
    el.innerHTML = glossaryHTML() + '<h3>How the two sources define their words</h3><p class="sub">The two sources may not mean the same thing by the same word. We store MoHUA "processed" as "treated" to compare them; that is our assumption.</p><div class="defs">' +
      KS.crosswalk.map(function (r, i) { return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(r.concept) + '</summary><div class="cols"><div><strong>CPCB</strong><br>' + esc(r.cpcb_says) + "</div><div><strong>MoHUA</strong><br>" + esc(r.mohua_says) + '</div></div><p class="note"><strong>Why it matters:</strong> ' + esc(r.why_it_matters) + "<br>" + esc(r.sources) + "</p></details>"; }).join("") +
      '</div><h3>What MoHUA has said over time</h3><div class="card pad" id="st"></div>';
    wireGlossary(el, rest);
    mountTable($("st"), [{ label: "Date", k: "statement_date" }, { label: "Generated", k: "generated_tpd", num: true, html: function (r) { return fmt(r.generated_tpd); } }, { label: "Processed", k: "processed_tpd", num: true, html: function (r) { return fmt(r.processed_tpd); } },
      { label: "%", k: "processed_pct_stated", num: true, html: function (r) { return fmt(r.processed_pct_stated); } }, { label: "Source", k: "source_doc", html: function (r) { return esc(dn(r.source_doc)) + ", p." + esc(r.source_page) + '<br><span class="note">' + esc(r.note) + "</span>"; } }], KS.statements, { search: false });
  }

  /* ---------- Gaps: phantom tonnes, money vs mess, collection and trucks, segregation, completeness ---------- */
  var GTABS = [["phantom", "Phantom tonnes"], ["money", "Money vs mess"], ["trucks", "Collection and trucks"], ["landfill", "Landfill"], ["segregation", "Segregation"], ["complete", "Completeness"]];
  function renderGaps(tab) {
    if (!GTABS.some(function (t) { return t[0] === tab; })) tab = "phantom";
    view.innerHTML = '<h2>Insights</h2><p class="sub">Where reported figures cannot all be true, where money and results do not line up, and what states leave unreported. These are prompts for questions, not findings that any state is at fault.</p>' + insightsNav("gaps", tab) + '<div id="gtab"></div>';
    ({ phantom: gPhantom, money: gMoney, trucks: gTrucks, landfill: gLandfill, segregation: gSeg, complete: gComplete })[tab]($("gtab"));
  }
  function stateLink(s) { return states.indexOf(s) >= 0 ? '<a href="#/map/' + encodeURIComponent(s) + '">' + esc(s) + "</a>" : esc(s); }
  function pagesLink(s) { return states.indexOf(s) >= 0 ? '<a href="#/explore/receipts/' + encodeURIComponent(s) + '">source pages</a>' : '<span class="note">see Why</span>'; }

  /* Phantom tonnes: separate counters, never summed */
  var PH = {
    D: ["The two national totals", "Two official national figures for the waste that is treated or processed."],
    E: ["The same gap, state by state", "Positive means MoHUA 2025-26 reports more processed than CPCB 2023-24 reports treated. Different years, and the words may not mean the same thing."],
    A: ["Treated is more than collected", "The tonnes column is the excess. Where a report gives a reason, it is quoted in the last column."],
    B: ["Collected is more than generated", "The tonnes column is the excess."],
    C: ["Treated plus landfilled is more than generated", "The tonnes column is the excess. Where the report footnotes a reason, it is quoted."]
  };
  function gPhantom(el) {
    var by = {}; KS.phantom.forEach(function (r) { var k = r.counter.charAt(0); (by[k] = by[k] || []).push(r); });
    var head = (by.D || []).filter(function (r) { return r.year === "MoHUA 2025-26 vs CPCB 2023-24"; })[0];
    el.innerHTML = '<p class="sub">Reported figures that cannot all be true, in separate counters. <strong>Do not add the counters together:</strong> each measures something different, and every row names its years. The data cannot say which figure is wrong.</p>' +
      (head ? '<div class="kpis"><div class="kpi"><div class="v">' + n0(head.tpd) + '</div><div class="l">tonnes per day, the difference between two reports for one figure (not a measure of missing waste): ' + esc(head.values) + "<br>" + esc(head.year) + "</div></div></div>" : "") +
      ["D", "E", "A", "B", "C"].filter(function (k) { return by[k]; }).map(function (k) {
        return '<h3>' + PH[k][0] + ' <span class="note">(' + by[k].length + ")</span></h3><p class=\"note\">" + PH[k][1] + '</p><div class="card pad" id="ph' + k + '"></div>';
      }).join("");
    ["D", "E", "A", "B", "C"].forEach(function (k) {
      if (!by[k]) return;
      var cols = [
        { label: "Place", k: "scope", html: function (r) { return stateLink(r.scope); } },
        { label: k === "D" || k === "E" ? "Compared" : "Year", k: "year" },
        { label: k === "A" || k === "B" || k === "C" ? "Excess (tpd)" : "Difference (tpd)", k: "tpd", num: true, html: function (r) { return fmt(r.tpd); } },
        { label: "Figures", k: "values" },
        { label: "Why", k: "explanation", html: function (r) { return (k === "E" ? "" : '<span class="note">' + esc(r.explanation) + "</span> ") + pagesLink(r.scope); }, text: function (r) { return r.explanation; } }
      ];
      mountTable($("ph" + k), cols, by[k], k === "E" ? { sort: "Difference (tpd)", dir: -1, ph: "Search states", limit: 8 } : { search: false });
    });
  }

  /* Money vs mess: SWM fund utilisation against percent treated */
  var QCOL = { slow_money_low_treatment: "--crit", slow_money_high_treatment: "--warn", fast_money_low_treatment: "--s4", fast_money_high_treatment: "--good" };
  var QLAB = { slow_money_low_treatment: "Slow spending, low treatment", slow_money_high_treatment: "Slow spending, high treatment", fast_money_low_treatment: "Fast spending, low treatment", fast_money_high_treatment: "Fast spending, high treatment" };
  function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
  function gMoney(el) {
    var rows = KS.money.filter(function (r) { return r.swm_utilisation_pct != null && r.cpcb_pct_treated != null; });
    var mu = median(rows.map(function (r) { return r.swm_utilisation_pct; })), mt = median(rows.map(function (r) { return r.cpcb_pct_treated; }));
    var W = 640, H = 440, L = 54, R = 16, T = 16, B = 48, XM = 70;
    function X(v) { return L + v / XM * (W - L - R); } function Y(v) { return H - B - v / 100 * (H - T - B); }
    var svg = '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="group" aria-label="Scatter plot: share of solid waste management funds used, against percent of waste treated, by state">';
    for (var gx = 0; gx <= XM; gx += 10) svg += '<line x1="' + X(gx) + '" x2="' + X(gx) + '" y1="' + T + '" y2="' + (H - B) + '" style="stroke:var(--hair)"/><text x="' + X(gx) + '" y="' + (H - B + 16) + '" text-anchor="middle" style="fill:var(--ink2);font-size:11px">' + gx + "</text>";
    for (var gy = 0; gy <= 100; gy += 20) svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(gy) + '" y2="' + Y(gy) + '" style="stroke:var(--hair)"/><text x="' + (L - 8) + '" y="' + (Y(gy) + 4) + '" text-anchor="end" style="fill:var(--ink2);font-size:11px">' + gy + "</text>";
    svg += '<line x1="' + X(mu) + '" x2="' + X(mu) + '" y1="' + T + '" y2="' + (H - B) + '" stroke-dasharray="5 4" style="stroke:var(--ink2)"/><line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(mt) + '" y2="' + Y(mt) + '" stroke-dasharray="5 4" style="stroke:var(--ink2)"/>' +
      '<text x="' + (X(mu) + 4) + '" y="' + (H - B - 6) + '" style="fill:var(--ink2);font-size:10px">median ' + mu.toFixed(1) + "%</text><text x=\"" + (W - R - 4) + '" y="' + (Y(mt) - 5) + '" text-anchor="end" style="fill:var(--ink2);font-size:10px">median ' + mt.toFixed(1) + "%</text>" +
      '<text x="' + (L + (W - L - R) / 2) + '" y="' + (H - 6) + '" text-anchor="middle" style="fill:var(--ink);font-size:12px;font-weight:600">Share of SWM funds used, to 25 Nov 2024 (%)</text><text transform="rotate(-90)" x="' + (-(T + (H - T - B) / 2)) + '" y="14" text-anchor="middle" style="fill:var(--ink);font-size:12px;font-weight:600">Waste treated, CPCB 2023-24 (%)</text>';
    rows.forEach(function (r) {
      var c = css(QCOL[r.quadrant]), tc = lum(c) > .179 ? "#0b0b0b" : "#fff", lab = r.state + ": " + r.swm_utilisation_pct + "% of funds used, " + r.cpcb_pct_treated + "% treated. " + QLAB[r.quadrant];
      svg += '<g class="dot" role="button" tabindex="0" data-s="' + esc(r.state) + '" aria-label="' + esc(lab) + '"><title>' + esc(lab) + '</title><circle cx="' + X(r.swm_utilisation_pct) + '" cy="' + Y(r.cpcb_pct_treated) + '" r="9.5" fill="' + c + '" style="stroke:var(--card);stroke-width:2"/><text x="' + X(r.swm_utilisation_pct) + '" y="' + (Y(r.cpcb_pct_treated) + 3) + '" text-anchor="middle" style="fill:' + tc + ';font-size:7.5px;font-weight:700;pointer-events:none">' + (ABB[r.state] || "") + "</text></g>";
    });
    svg += "</svg>";
    var cnt = {}; rows.forEach(function (r) { cnt[r.quadrant] = (cnt[r.quadrant] || 0) + 1; });
    el.innerHTML = '<p class="sub">Does spending track results? Each dot is a state: how much of its solid waste management allocation (2021 to 2026) has been used, against how much of its waste CPCB reports treated. Tap a dot for the figures.</p>' +
      '<div class="card pad"><div class="legend2">' + Object.keys(QLAB).map(function (q) { return '<span><i class="kd" style="background:var(' + QCOL[q] + ')"></i>' + QLAB[q] + " (" + (cnt[q] || 0) + ")</span>"; }).join("") + "</div>" + svg + '<div id="mdet" aria-live="polite" class="note">Tap or focus a dot to see that state.</div></div>' +
      '<div class="notice" style="margin-top:14px"><strong>Read with care.</strong> Funds are cumulative to 25 Nov 2024 and the Lok Sabha table (Q682) prints no unit, so only the ratio is used. Treated is CPCB 2023-24. The quadrants split at the median of the ' + rows.length + ' states, so they are relative, not targets. A low share used is a prompt for a question, not proof of an execution problem; a high share is not proof of success.</div>' +
      '<h3>All states</h3><div class="card pad" id="mt"></div>';
    function show(s) {
      var r = KS.money.filter(function (x) { return x.state === s; })[0]; if (!r) return;
      $("mdet").innerHTML = "<strong>" + esc(s) + "</strong> · " + esc(QLAB[r.quadrant] || r.quadrant) + "<br>Allocation " + fmt(r.allocation_swm) + ", funds used " + fmt(r.funds_swm) + " (unit not stated), <strong>" + fmt(r.swm_utilisation_pct) + "%</strong> used. CPCB 2023-24 treated <strong>" + fmt(r.cpcb_pct_treated) + "%</strong>; MoHUA 2025-26 processed <strong>" + fmt(r.mohua_pct_processed) + "%</strong>. <a href=\"#/map/" + encodeURIComponent(s) + "\">State page</a> · <a href=\"#/explore/receipts/" + encodeURIComponent(s) + "\">source pages</a> · funds: Lok Sabha Q682, 28 Nov 2024";
    }
    el.querySelectorAll(".dot").forEach(function (g) {
      g.onclick = function () { show(g.dataset.s); };
      g.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(g.dataset.s); } };
    });
    mountTable($("mt"), [
      { label: "State", k: "state", html: function (r) { return stateLink(r.state); } },
      { label: "Funds used (%)", k: "swm_utilisation_pct", num: true, html: function (r) { return fmt(r.swm_utilisation_pct); } },
      { label: "CPCB treated (%)", k: "cpcb_pct_treated", num: true, html: function (r) { return fmt(r.cpcb_pct_treated); } },
      { label: "MoHUA processed (%)", k: "mohua_pct_processed", num: true, html: function (r) { return fmt(r.mohua_pct_processed); } },
      { label: "Quadrant", k: "quadrant", html: function (r) { return esc(QLAB[r.quadrant] || r.quadrant); } }
    ], KS.money, { sort: "Funds used (%)", ph: "Search states" });
  }

  /* Collection gap, truck priority and landfill dependence */
  function gTrucks(el) {
    var ly = Array.from(new Set(KS.indicators.filter(function (r) { return r.landfill_pct != null; }).map(function (r) { return r.year; }))).sort();
    el.innerHTML = '<h3>Where the most waste goes uncollected</h3><p class="note">States ranked by the tonnes per day left uncollected (generated minus collected), CPCB 2023-24. This is prioritisation by tonnage, not route optimisation, which needs ward and vehicle data.</p><div class="card pad" id="tr"></div>' +
      '<p class="note">How much waste ends up in landfill, nationally and by state, is on the <a href="#/gaps/landfill">Landfill</a> tab.</p>';
    var mx = Math.max.apply(null, KS.trucks.map(function (r) { return r.uncollected_tpd || 0; })) || 1;
    mountTable($("tr"), [
      { label: "#", k: "rank", num: true }, { label: "State", k: "state", html: function (r) { return stateLink(r.state); } },
      { label: "Uncollected (tpd)", k: "uncollected_tpd", html: function (r) { return '<div class="bar10" style="width:' + Math.max(2, r.uncollected_tpd / mx * 100) + '%;max-width:200px"></div>' + fmt(r.uncollected_tpd); } },
      { label: "Collected (%)", k: "collection_pct", num: true, html: function (r) { return fmt(r.collection_pct); } },
      { label: "Generated (tpd)", k: "generated_tpd", num: true, html: function (r) { return fmt(r.generated_tpd); } },
      { label: "Page", k: "x", html: function (r) { return rbtn([r.state, r.year, "collected", "ls_au50_2025-12-01.pdf"].join("|"), "source page") || '<span class="note">' + esc(r.year) + "</span>"; }, text: function () { return ""; }, val: function () { return 0; } }
    ], KS.trucks, { sort: "#", ph: "Search states" });
  }

  /* Landfill: national share for three years, the state table for two, and what we do not hold. All from the CPCB tables we already have. */
  function gLandfill(el) {
    var ly = Array.from(new Set(KS.indicators.filter(function (r) { return r.landfill_pct != null; }).map(function (r) { return r.year; }))).sort();
    var nat = ["2021-22", "2022-23", "2023-24"].map(function (y) {
      var g = KS.national.filter(function (r) { return r.state === "India" && r.year === y && r.source_name === "CPCB" && r.metric === "generated"; })[0], l = KS.national.filter(function (r) { return r.state === "India" && r.year === y && r.source_name === "CPCB" && r.metric === "landfilled"; })[0];
      return { y: y, g: g, l: l };
    }).filter(function (x) { return x.g && x.l && x.g.value && x.l.value != null; });
    el.innerHTML = '<h3>Landfill, nationally</h3><p class="note">Tonnes of municipal waste a day that CPCB reports as landfilled, and the share of the waste generated. Three CPCB reports, three different years.</p>' +
      '<div class="kpis">' + nat.map(function (x) { return '<div class="kpi"><div class="v">' + fmt(x.l.value) + '</div><div class="l">tonnes a day landfilled, ' + esc(x.y) + " (" + (Math.round(x.l.value / x.g.value * 1000) / 10) + "% of generated)<br>" + esc(dn(x.l.source_doc)) + ", p." + esc(x.l.source_page) + " " + rbtn(["India", x.y, "landfilled", x.l.source_doc].join("|"), "page") + "</div></div>"; }).join("") + "</div>" +
      '<p class="note">The three years come from different reports and may not be measured the same way, so do not read the change between them as a trend.</p>' +
      '<h3>By state</h3><p class="note">Landfilled as a share of generated waste. CPCB reports state-wise landfilled for ' + ly.join(" and ") + ' only. "Neither" is what is left after treated and landfilled (negative means the two add to more than was generated).</p><div class="grid2" style="max-width:260px;margin-bottom:10px"><div><label for="lfy">Year</label><select id="lfy">' + opts(ly.slice().reverse()) + '</select></div></div><div class="card pad" id="lf"></div>' +
      '<h3>Legacy dumpsites: what MoHUA says, nationally</h3><p class="note">Two sets of national statements a year apart. They use different dates, a different count of dumpsites and different words (&ldquo;remediated&rdquo; in 2024, &ldquo;processed&rdquo; in 2025), so do not read the difference as a precise rate of progress.</p><div class="card pad" id="dsn"></div>' +
      '<h3>The 214 priority dumpsites, by state</h3><p class="note" id="dsnote"></p><div class="card pad" id="dss"></div>' +
      '<h3>The same list, city by city</h3><p class="note">One row per urban local body, as printed. A blank means the annexure prints nothing in that cell; we never fill it in.</p><div class="card pad" id="dsc"></div>' +
      '<h3>What we do not have</h3><div class="card pad"><ul style="margin:0"><li><strong>Where each dumpsite is.</strong> The annexure names the city, not the site, and gives no coordinates or boundaries.</li><li><strong>The other 25 priority sites.</strong> The annexure\'s Grand Total says 214, but it itemises 189; Maharashtra and Bihar are printed as &ldquo;Reserved&rdquo; with no rows. The document does not say the gap is theirs.</li><li><strong>How much has been cleared at each site since November 2025</strong>, and anything about fires or people nearby.</li></ul><p class="note" style="margin-bottom:0">Every figure here is from a published MoHUA or Lok Sabha document, with its page. If you hold or know of a document with site-level figures, <a href="https://github.com/SriyaMeenakshi/kachra-satya/issues/new/choose" target="_blank" rel="noopener">tell us</a>.</p></div>';
    function lf() {
      var y = $("lfy").value, rows = KS.indicators.filter(function (r) { return r.year === y && r.landfill_pct != null; });
      mountTable($("lf"), [
        { label: "State", k: "state", html: function (r) { return stateLink(r.state); } },
        { label: "Landfill share (%)", k: "landfill_pct", html: function (r) { return '<div class="bar10" style="width:' + Math.max(2, Math.min(100, r.landfill_pct)) + '%;max-width:160px"></div>' + fmt(r.landfill_pct); } },
        { label: "Landfilled (tpd)", k: "landfilled_tpd", num: true, html: function (r) { return fmt(r.landfilled_tpd); } },
        { label: "Treated (%)", k: "treated_pct", num: true, html: function (r) { return fmt(r.treated_pct); } },
        { label: "Neither (%)", k: "unaccounted_pct", num: true, html: function (r) { return fmt(r.unaccounted_pct); } }
      ], rows, { sort: "Landfill share (%)", dir: -1, ph: "Search states" });
    }
    $("lfy").onchange = lf; lf();
    dumpsites();
  }

  function dumpsites() {
    var N = KS.dumpsite_national || [], D = KS.dumpsites || [], T = KS.dumpsite_total || [];
    function nv(date, metric) { return N.filter(function (r) { return r.statement_date === date && r.metric === metric; })[0]; }
    var metrics = [["dumpsites_identified", "Dumpsites identified", ""], ["legacy_waste_identified", "Legacy waste in them", " crore tonnes"], ["dumpsites_remediated_completely", "Remediated completely", ""], ["dumpsites_in_progress", "Under remediation", ""],
      ["legacy_waste_remediated", "Legacy waste remediated or processed", " crore tonnes"], ["land_reclaimed", "Land reclaimed", " acres"]];
    function cell(r, unit) { return r ? '<strong>' + fmt(r.value) + esc(unit) + '</strong>' + (r.note && /\(\d+%\)|nearly|approximately/.test(r.note) ? '<br><span class="note">' + esc(r.note) + "</span>" : "") : '<span class="note">not stated</span>'; }
    var q = "2024-11-28", c = "2025-11";
    var dq = N.filter(function (r) { return r.statement_date === q; })[0], dc = N.filter(function (r) { return r.statement_date === c; })[0];
    $("dsn").innerHTML = '<div class="tw"><table><thead><tr><th scope="col">Statement</th><th scope="col">Lok Sabha Q682, 28 Nov 2024<br><span class="note">' + (dq ? esc(dq.source_page) : "") + '</span></th><th scope="col">MoHUA DRAP concept note, Nov 2025<br><span class="note">page ' + (dc ? esc(dc.source_page) : "") + '</span></th></tr></thead><tbody>' +
      metrics.map(function (m) { return "<tr><td>" + esc(m[1]) + "</td><td>" + cell(nv(q, m[0]), m[2]) + "</td><td>" + cell(nv(c, m[0]), m[2]) + "</td></tr>"; }).join("") + '</tbody></table></div>' +
      '<p class="note" style="margin-bottom:0">Also in the concept note: 214 priority dumpsites in 202 urban local bodies hold about 80% of the legacy waste (about 8.8 crore tonnes), and the target is &ldquo;Lakshya Zero Dumpsites&rdquo; by September 2026. The launch FAQ repeats the 2025 figures and attaches &ldquo;50%&rdquo; to the identified sites where the concept note attaches it to the land; we show both wordings in the data.</p>';
    var rows = D.filter(function (r) { return r.ulb; }), by = {};
    rows.forEach(function (r) { var o = by[r.state] = by[r.state] || { state: r.state, ulbs: 0, sites: 0, legacy: 0, remediate: 0, cost: 0, costN: 0 }; o.ulbs++; o.sites += r.dumpsites || 0; o.legacy += r.legacy_waste_tonnes || 0; o.remediate += r.waste_to_remediate_tonnes || 0; if (r.approved_total_cost_cr != null) { o.cost += r.approved_total_cost_cr; o.costN++; } });
    var st = Object.keys(by).map(function (k) { return by[k]; }), sum = function (f) { return st.reduce(function (a, o) { return a + o[f]; }, 0); };
    var printed = T.filter(function (r) { return r.metric === "dumpsites"; })[0];
    $("dsnote").innerHTML = "The annexure itemises <strong>" + fmt(sum("sites")) + " of " + (printed ? fmt(printed.printed_grand_total) : "214") + "</strong> priority dumpsites in " + fmt(sum("ulbs")) + " urban local bodies in " + st.length + " states and UTs (" + esc(dn("mohua_drap_concept_note_2025-11.pdf")) + ", pages 6 to 9). Tonnes are the legacy waste as printed, not a measure of danger or of progress.";
    mountTable($("dss"), [
      { label: "State", k: "state", html: function (r) { return stateLink(r.state); } },
      { label: "Cities listed", k: "ulbs", num: true },
      { label: "Dumpsites", k: "sites", num: true },
      { label: "Legacy waste (tonnes)", k: "legacy", num: true, html: function (r) { return fmt(r.legacy); } },
      { label: "To remediate (tonnes)", k: "remediate", num: true, html: function (r) { return fmt(r.remediate); } },
      { label: "Approved cost (Rs crore)", k: "cost", num: true, html: function (r) { return r.costN ? fmt(Math.round(r.cost * 100) / 100) + (r.costN < r.ulbs ? ' <span class="note">(' + r.costN + " of " + r.ulbs + " cities print it)</span>" : "") : '<span class="note">not printed</span>'; } }
    ], st, { sort: "Legacy waste (tonnes)", dir: -1, ph: "Search states" });
    mountTable($("dsc"), [
      { label: "City or body", k: "ulb" },
      { label: "State", k: "state", html: function (r) { return stateLink(r.state); } },
      { label: "Dumpsites", k: "dumpsites", num: true },
      { label: "Legacy waste (tonnes)", k: "legacy_waste_tonnes", num: true, html: function (r) { return fmt(r.legacy_waste_tonnes); } },
      { label: "To remediate (tonnes)", k: "waste_to_remediate_tonnes", num: true, html: function (r) { return fmt(r.waste_to_remediate_tonnes); } },
      { label: "Approved cost (Rs crore)", k: "approved_total_cost_cr", num: true, html: function (r) { return r.approved_total_cost_cr == null ? '<span class="note">not printed</span>' : fmt(r.approved_total_cost_cr); } },
      { label: "Page", k: "source_page", num: true, html: function (r) { return "p." + esc(r.source_page); } }
    ], rows, { sort: "Legacy waste (tonnes)", dir: -1, ph: "Search cities" });
  }

  /* Segregation gap (national only) */
  function gSeg(el) {
    var S = KS.segregation, d2d = S.filter(function (r) { return r.indicator.indexOf("D2D") >= 0; })[0], seg = S.filter(function (r) { return r.indicator.indexOf("Source Segregation") >= 0; })[0];
    el.innerHTML = '<p class="sub">Collecting waste door to door is not the same as keeping it segregated. These are national figures for 2022 from the Swachh Bharat Mission dashboard; there is no state-wise table.</p>' +
      (d2d && seg ? '<div class="card pad"><div class="meter"><div class="top"><span>Wards with more than 90% door-to-door collection</span><b>' + d2d.share_pct_computed + "%</b></div><div class=\"track\"><div class=\"fill c\" style=\"width:" + d2d.share_pct_computed + '%"></div></div><div class="note">' + n0(d2d.count) + " of " + n0(d2d.base_stated) + " wards covered</div></div>" +
        '<div class="meter"><div class="top"><span>Wards with more than 90% source segregation</span><b>' + seg.share_pct_computed + "%</b></div><div class=\"track\"><div class=\"fill\" style=\"width:" + seg.share_pct_computed + '%"></div></div><div class="note">' + n0(seg.count) + " of " + n0(seg.base_stated) + " wards covered</div></div></div>" : "") +
      '<p class="note" style="margin-top:12px">Source: MoHUA, Swachh Bharat Mission (Urban) Garbage Free Cities 2022 dashboard, <a href="https://sbmurban.org/gfc-result-dashboard" target="_blank" rel="noopener">sbmurban.org/gfc-result-dashboard</a> (copied ' + esc(S[0] ? S[0].retrieved_on : "") + '). The page says the figures are "on the basis of on field validation". The shares are ours (count divided by the coverage the page states) and are indicative, because the page does not say every indicator was measured on every ward.</p>' +
      '<h3>All indicators on that page</h3><div class="card pad" id="sg"></div>';
    mountTable($("sg"), [
      { label: "Indicator", k: "indicator" }, { label: "Count", k: "count", num: true, html: function (r) { return n0(r.count); } }, { label: "Unit", k: "unit" },
      { label: "Out of", k: "base_stated", num: true, html: function (r) { return r.base_stated == null ? '<span class="note">not stated</span>' : n0(r.base_stated); } },
      { label: "Share (%)", k: "share_pct_computed", num: true, html: function (r) { return r.share_pct_computed == null ? '<span class="note">not computed</span>' : r.share_pct_computed; } }
    ], S, { search: false });
  }

  /* Reporting completeness */
  function gComplete(el) {
    var C = KS.completeness, full = C.filter(function (r) { return r.completeness_pct === 100; }).length;
    el.innerHTML = '<p class="sub">How much of what a state could have reported did it report? A score is the share of 17 core figures given: generated, collected and treated for each CPCB year 2019-20 to 2023-24, and generated and treated for MoHUA 2025-26. A blank, or a state missing from a table, counts as not reported. Thin reporting does not mean the figures are wrong.</p>' +
      '<div class="kpis"><div class="kpi"><div class="v">' + full + " of " + C.length + '</div><div class="l">report all 17 figures</div></div><div class="kpi"><div class="v">' + (C.length - full) + '</div><div class="l">have gaps, listed below</div></div></div><div class="card pad" id="cp"></div>';
    mountTable($("cp"), [
      { label: "State", k: "state", html: function (r) { return stateLink(r.state); } },
      { label: "Score (%)", k: "completeness_pct", html: function (r) { return '<div class="bar10" style="width:' + r.completeness_pct + '%;max-width:160px"></div>' + r.completeness_pct; } },
      { label: "Figures given", k: "reported_cells", num: true, html: function (r) { return r.reported_cells + " of " + r.expected_cells; } },
      { label: "CPCB years with all three", k: "years_all_three", num: true, html: function (r) { return r.years_all_three + " of " + r.years_possible; } },
      { label: "Landfilled years", k: "landfilled_years", num: true, html: function (r) { return r.landfilled_years + " of " + r.landfilled_years_possible; } },
      { label: "Not reported", k: "not_reported", html: function (r) { return r.not_reported === "none" ? '<span class="note">none</span>' : String(r.not_reported).split(";").map(function (t) { return '<span class="tag">' + esc(t.trim()) + "</span>"; }).join(""); } },
      { label: "Reported as 0", k: "zero_reported_cells", num: true }
    ], C, { sort: "Score (%)", ph: "Search states" });
  }

  /* ---------- Your city ---------- */
  var TEMPLATE = "ulb,ward,period,generated_tpd,collected_tpd,segregated_tpd,treated_tpd,landfilled_tpd,notes\n";
  var EXAMPLE = TEMPLATE + "FICTIONAL CITY,Ward A,2024-01,10,9,5,4,3,fictional test data\nFICTIONAL CITY,Ward A,2024-02,10,11,5,4,3,collected above generated\nFICTIONAL CITY,Ward B,2024-01,20,12,13,9,8,segregated above collected\nFICTIONAL CITY,Ward B,2024-02,20,,6,5,4,collected blank\nFICTIONAL CITY,Ward C,2024-01,8,8,4,9,0,treated above collected\nFICTIONAL CITY,Ward D,2024-01,6,5,3,4,3,treated plus landfilled above generated\n";
  function download(name, text) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  function toCSV(cols, rows) { var q = function (v) { v = String(v == null ? "" : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }; return cols.join(",") + "\n" + rows.map(function (r) { return cols.map(function (c) { return q(r[c]); }).join(","); }).join("\n") + "\n"; }
  var RULES = { C1: "Collected > generated", C2: "Segregated > collected", C3: "Treated > collected", C4: "Treated + landfilled > generated", C5: "Not reported" };
  function renderCity() {
    view.innerHTML = '<h2>Audit your city</h2><p class="sub">Check a city\'s ward-level waste figures for numbers that cannot all be true, and see which wards leave the most waste uncollected. The example below is fictional, so you can see what you get before using any real file.</p>' +
      '<div class="card pad"><h3 style="margin-top:0">What goes in the file</h3><p class="note" style="margin-top:0">One row per ward per month, in tonnes per day. Leave a cell blank if it was not reported: blanks are never filled in. Ask your municipal office for these figures, or start with the empty template.</p>' +
      '<div class="tw"><table class="fmt"><thead><tr><th scope="col">Column</th><th scope="col">Meaning</th><th scope="col">Example</th></tr></thead><tbody>' +
      '<tr><td>ulb, ward</td><td>City or town, and the ward</td><td>Hyderabad, Ward 12</td></tr><tr><td>period</td><td>Year and month</td><td>2024-01</td></tr>' +
      '<tr><td>generated_tpd</td><td>Waste produced</td><td>10</td></tr><tr><td>collected_tpd</td><td>Waste picked up</td><td>9</td></tr><tr><td>segregated_tpd</td><td>Waste separated at source</td><td>5</td></tr>' +
      '<tr><td>treated_tpd, landfilled_tpd</td><td>Waste treated, waste landfilled</td><td>4, 3</td></tr></tbody></table></div>' +
      '<p style="margin:12px 0 0"><button class="alt" id="tpl" type="button">Get the empty template</button> <button class="alt" id="ex" type="button">Show the fictional example again</button></p>' +
      '<p class="note" style="margin-bottom:0">Your file is read in this browser. Nothing is uploaded or stored.</p></div>' +
      '<div id="cbanner" class="notice" role="status" style="margin-top:16px"><strong>You are looking at a fictional example</strong>, not real data. It shows the kind of result you get.</div>' +
      '<div id="cerr" class="err" role="alert"></div><div id="cres" aria-live="polite"></div>' +
      '<h3 style="margin-top:28px">Now try your own file</h3><label class="drop" id="drop" for="file" style="display:block;cursor:pointer"><div class="big" aria-hidden="true">📄</div><p style="margin:8px 0 2px"><strong>Drop a CSV here</strong> or click to choose</p><p class="note" style="margin:0">Up to 5 MB. Blank cells mean "not reported".</p><input type="file" id="file" accept=".csv,text/csv"></label>';
    $("tpl").onclick = function () { download("city_audit_template.csv", TEMPLATE); };
    $("ex").onclick = function () { run(EXAMPLE, "Fictional example (not real data)"); };
    setTimeout(function () { if ($("cres") && !$("cres").innerHTML) run(EXAMPLE, "Fictional example (not real data)"); }, 0);        /* show a worked example at once; an empty upload box teaches nothing */
    $("file").onchange = function () { read(this.files[0]); };
    var dz = $("drop");
    ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("over"); }); });
    dz.addEventListener("drop", function (e) { read(e.dataTransfer.files[0]); });
    function read(f) { if (!f) return; if (f.size > 5 * 1024 * 1024) { $("cerr").textContent = "That file is over 5 MB. Please send one city at a time, or fewer rows."; return; } var rd = new FileReader(); rd.onload = function () { run(String(rd.result), f.name); }; rd.onerror = function () { $("cerr").textContent = "Could not read that file."; }; rd.readAsText(f); }
    function run(text, name) {
      $("cerr").textContent = ""; $("cres").innerHTML = "";
      if ($("cbanner")) $("cbanner").innerHTML = name.indexOf("Fictional") === 0 ? "<strong>You are looking at a fictional example</strong>, not real data. It shows the kind of result you get." : "<strong>Results for your file:</strong> " + esc(name) + ". Nothing was uploaded.";
      var r; try { r = KSCity.audit(KSCity.parseCSV(text)); } catch (e) { $("cerr").textContent = e.message; return; }
      if (!r.rows) { $("cerr").textContent = "The file has no data rows."; return; }
      var present = Object.keys(RULES).filter(function (k) { return r.flags.some(function (f) { return f.rule.indexOf(k) === 0; }); }), pick = "";
      $("cres").innerHTML = '<p class="note" style="margin-top:16px">' + esc(name) + '</p><div class="kpis"><div class="kpi"><div class="v">' + r.rows + '</div><div class="l">rows read</div></div><div class="kpi"><div class="v">' + r.flags.length + '</div><div class="l">flags</div></div><div class="kpi"><div class="v">' + r.ranking.length + '</div><div class="l">wards ranked</div></div></div>' +
        '<h3>Flags</h3><p class="note">Figures that cannot all be true as reported. They do not say which figure is wrong.</p><div class="chips" id="rf" role="group" aria-label="Filter flags by rule"></div><div class="card pad" id="ft"></div>' +
        '<h3>Uncollected waste, ranked</h3><p class="note">Where uncollected waste is largest in the data you supplied. This is prioritisation, not route optimisation.</p><div class="card pad" id="rk"></div>' +
        '<p><button class="alt" id="dlf" type="button">Download flags (CSV)</button> <button class="alt" id="dlr" type="button">Download ranking (CSV)</button></p>';
      function flags() {
        var rows = r.flags.filter(function (f) { return !pick || f.rule.indexOf(pick) === 0; });
        mountTable($("ft"), [{ label: "Ward", k: "ward", html: function (f) { return esc(f.ulb) + " · " + esc(f.ward); }, text: function (f) { return f.ulb + " " + f.ward; } }, { label: "Period", k: "period" }, { label: "Rule", k: "rule", html: function (f) { return esc(RULES[f.rule.slice(0, 2)] || f.rule); } }, { label: "Values", k: "values" }], rows, { ph: "Search flags" });
      }
      $("rf").innerHTML = ['<button class="chip" type="button" data-r="" aria-pressed="true">All</button>'].concat(present.map(function (k) { return '<button class="chip" type="button" data-r="' + k + '" aria-pressed="false">' + RULES[k] + " (" + r.flags.filter(function (f) { return f.rule.indexOf(k) === 0; }).length + ")</button>"; })).join("");
      $("rf").querySelectorAll(".chip").forEach(function (b) { b.onclick = function () { pick = b.dataset.r; $("rf").querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); flags(); }; });
      flags();
      var mx = r.ranking.length ? r.ranking[0].uncollected_tpd_avg || 1 : 1;
      if (r.ranking.length) mountTable($("rk"), [{ label: "#", k: "rank", num: true }, { label: "Ward", k: "ward", html: function (x) { return esc(x.ulb) + " · " + esc(x.ward); }, text: function (x) { return x.ulb + " " + x.ward; } },
        { label: "Uncollected (avg tpd)", k: "uncollected_tpd_avg", html: function (x) { return '<div class="bar10" style="width:' + Math.max(2, x.uncollected_tpd_avg / mx * 100) + '%;max-width:180px"></div>' + fmt(x.uncollected_tpd_avg) + mean(x.uncollected_tpd_avg); } },
        { label: "Worst period", k: "uncollected_tpd_max", num: true, html: function (x) { return fmt(x.uncollected_tpd_max); } }], r.ranking, { sort: "#", ph: "Search wards" });
      else $("rk").innerHTML = '<p class="note">No ward has both generated and collected reported, so nothing can be ranked.</p>';
      $("dlf").onclick = function () { download("city_flags.csv", toCSV(["ulb", "ward", "period", "rule", "values", "explanation"], r.flags)); };
      $("dlr").onclick = function () { download("city_priority.csv", toCSV(["rank", "ulb", "ward", "periods", "uncollected_tpd_avg", "uncollected_tpd_max"], r.ranking)); };
    }
  }

  /* ---------- Ask (Q&A agent on AgentFoundry) ---------- */
  var SUGGEST = ["Kerala treated vs collected", "Which states have the biggest gap?", "Maharashtra landfilled 2021-22"];
  /* Voice: browser speech recognition (in) and speech synthesis (out). Support for Hindi, Tamil and Telugu depends on the browser and device. */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, LANGTAG = { English: "en-IN", Hindi: "hi-IN", Tamil: "ta-IN", Telugu: "te-IN" };
  function speak(text, language) {
    if (!window.speechSynthesis) return;
    try {                                                   /* speech must never block the written answer or the Ask button */
      var tag = LANGTAG[language] || "en-IN", u = new SpeechSynthesisUtterance(text), vs = speechSynthesis.getVoices();
      u.lang = tag; speechSynthesis.cancel(); speechSynthesis.speak(u);
      var has = vs.some(function (v) { return v.lang.replace("_", "-").toLowerCase().indexOf(tag.slice(0, 2)) === 0; }), n = $("vnote");
      if (n) n.textContent = vs.length && !has ? "This device may not have a " + language + " voice, so the spoken answer may be silent or in another language. The written answer is always shown." : "";
    } catch (e) { var m = $("vnote"); if (m) m.textContent = "Could not read the answer aloud on this device. The written answer is shown above."; }
  }
  /* The agent (agent/app.py) takes POST {question, language: "en"|"hi"|"ta"|"te"} and answers {answer, sources: [{document}]}. "message" is sent too, and
     "reply"/"response" are also read, so a different back end (for example AgentFoundry) that uses those names still works. Resolves to {text, sources}. */
  var LANGCODE = { English: "en", Hindi: "hi", Tamil: "ta", Telugu: "te" };
  function askAgent(message, language) {
    return fetch(CFG.agentEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: message, message: message, language: LANGCODE[language] || "en" }) })
      .then(function (r) {
        if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.error ? "The assistant said: " + j.error : "The assistant returned an error (" + r.status + ")."); });
        var ct = r.headers.get("content-type") || "";
        return ct.indexOf("json") >= 0 ? r.json().then(function (j) { return { text: j.answer || j.reply || j.response || JSON.stringify(j), sources: Array.isArray(j.sources) ? j.sources : [] }; }) : r.text().then(function (t) { return { text: t, sources: [] }; });
      });
  }
  function renderAsk() {
    var live = !!CFG.agentEndpoint;
    view.innerHTML = '<h2>Ask</h2><p class="sub">Ask in English, Hindi, Tamil or Telugu. Answers come only from the dataset, with the source and page for every figure.</p>' +
      (live ? "" : '<div class="notice"><strong>The assistant isn\'t connected yet.</strong> Meanwhile, <a href="#/claim">check a claim</a> or <a href="#/explore/receipts">browse the figures</a>.</div>') +
      '<div class="chips">' + SUGGEST.map(function (s) { return '<button class="chip" type="button"' + (live ? "" : " disabled") + ">" + esc(s) + "</button>"; }).join("") + '</div>' +
      '<div class="ask"><input id="q" type="text" maxlength="500" aria-label="Your question" placeholder="Ask about a state, a year or a claim"' + (live ? "" : " disabled") + '><select id="lang" aria-label="Language" style="width:auto"><option>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option></select><button class="go" id="send" type="button"' + (live ? "" : " disabled") + ">Ask</button></div>" +
      '<div class="chat" id="chat" aria-live="polite" style="margin-top:var(--sp-4)"></div>' +
      '<div class="voice"><button class="alt" id="mic" type="button" aria-pressed="false"' + (live && SR ? "" : " disabled") + '>🎤 Speak</button><label class="chk"><input type="checkbox" id="speak"' + (live && window.speechSynthesis ? "" : " disabled") + "> Read answers aloud</label>" +
      '<span class="note" id="vnote" role="status">' + (SR ? "" : "Voice input is not available in this browser (Chrome or Edge work best). You can still type.") + "</span></div>" +
      (live ? '<p class="note"><strong>Privacy:</strong> your question is sent to our server, and may be sent to an AI service (Google Gemini) to write the answer. Do not type names, addresses or other personal details. Everything else on this site stays in your browser.</p>' : "") +
      '<p class="note">Voice uses your browser\'s own speech tools. How well it handles Hindi, Tamil and Telugu depends on your browser and device. Typing always works.</p>';
    if (!live) return;
    function send(q) {
      q = (q || $("q").value).trim(); if (!q) return; var chat = $("chat");
      chat.insertAdjacentHTML("beforeend", '<div class="msg u">' + esc(q) + "</div>"); $("q").value = "";
      var pend = document.createElement("div"); pend.className = "msg a"; pend.textContent = "Looking it up…"; chat.appendChild(pend); $("send").disabled = true;
      askAgent(q, $("lang").value).then(function (res) {
        var t = res.text, docs = Array.from(new Set(res.sources.map(function (x) { return x.document || x.source_doc || x; }))).filter(Boolean);
        if (window.KSAnswer) { pend.innerHTML = KSAnswer.format(t, docs); pend.classList.add("rich"); }          /* cards, badges and source chips; the same words, re-arranged */
        else pend.textContent = t + (docs.length ? String.fromCharCode(10, 10) + "Sources: " + docs.join(", ") : "");        /* the sources are shown, but only the answer is read aloud */
        if ($("speak") && $("speak").checked) speak(t, $("lang").value);
      }, function (e) { pend.textContent = e.message + " Try Check a claim instead."; pend.classList.add("bad"); }).then(function () { $("send").disabled = false; });
    }
    $("send").onclick = function () { send(); }; $("q").onkeydown = function (e) { if (e.key === "Enter") send(); };
    $("mic").onclick = function () {
      if (!SR) return;
      var rec = new SR(), btn = $("mic"), note = $("vnote");
      rec.lang = LANGTAG[$("lang").value] || "en-IN"; rec.interimResults = false; rec.maxAlternatives = 1;
      btn.setAttribute("aria-pressed", "true"); btn.textContent = "Listening…"; note.textContent = "";
      rec.onresult = function (e) { var t = e.results[0][0].transcript; $("q").value = t; send(t); };
      rec.onerror = function (e) { note.textContent = "Could not hear that (" + e.error + "). Check microphone permission for this site, or type your question."; };
      rec.onend = function () { btn.setAttribute("aria-pressed", "false"); btn.textContent = "🎤 Speak"; };
      try { rec.start(); } catch (err) { note.textContent = "Could not start the microphone. Type your question instead."; rec.onend(); }
    };
    view.querySelectorAll(".chips .chip").forEach(function (b) { b.onclick = function () { var q = $("q"); q.value = b.textContent; q.focus(); }; });   /* a suggestion fills the question bar; the person presses Ask */
  }

  go();
})();
