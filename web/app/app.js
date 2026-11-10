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
  function rbtn(key, label) { return hasR(key) ? '<button class="link" data-rkey="' + esc(key) + '" type="button">' + (label || "page") + "</button>" : ""; }
  function wireR(el) { el.querySelectorAll("[data-rkey]").forEach(function (b) { b.onclick = function () { openReceipt(b.dataset.rkey); }; }); }

  /* ---------- routing ---------- */
  var TITLES = { map: "Map", claim: "Check a claim", gaps: "Gaps", city: "Your city", ask: "Ask", explore: "Explore" };
  function route() {
    var h = decodeURIComponent((location.hash || "#/map").replace(/^#\/?/, "")).split("/"), n = h[0], a = h.slice(1);
    if (n === "audit") { n = "explore"; a = ["audit"]; } else if (n === "receipts") { n = "explore"; a = ["receipts"].concat(a); } else if (n === "definitions") { n = "explore"; a = ["defs"]; }
    return { name: TITLES[n] ? n : "map", args: a };
  }
  function go() {
    var r = route(); document.title = TITLES[r.name] + " | Kachra Satya";
    document.querySelectorAll("#nav a").forEach(function (a) { if (a.dataset.r === r.name) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    ({ map: renderMap, claim: renderClaim, gaps: renderGaps, city: renderCity, ask: renderAsk, explore: renderExplore })[r.name](r.args[0], r.args);
    wireR(view);
    if (!(r.name === "map" && r.args[0])) { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
  }
  window.addEventListener("hashchange", go);

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
  var VERD = { SUPPORTED: ["Supported", "Every source we hold agrees."], CONTRADICTED: ["Not supported", "No source we hold agrees."], SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS: ["The sources disagree", "Some sources agree with this claim and others do not."], CANNOT_VERIFY: ["Cannot verify", ""] };
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
      var h = '<div class="verdict v-' + r.verdict + '"><div class="b">' + V[0] + "</div><div>" + esc(V[1] || r.reason) + (yrs.length > 1 ? " The figures cover different years (" + yrs[0] + " to " + yrs[yrs.length - 1] + "), so part of any difference may be real change." : "") + "</div>" +
        (r.claim ? '<div class="note" style="margin-top:6px">Read as: ' + esc($("metric").selectedOptions[0].text) + " = " + esc(r.claim.value) + (pct ? "%" : " tpd") + ", " + esc(r.claim.state) + ", " + (r.claim.year ? esc(r.claim.year) : "any year") + ". Counts as agreeing within " + esc(r.tolerance) + ".</div>" : "") + "</div>";
      if (r.records.length) h += '<div class="recs">' + r.records.map(function (x) {
        var key = [x.scope, x.year, r.claim.metric, x.source_doc].join("|");
        return '<div class="rec"><span class="mk ' + (x.matches ? "y" : "n") + '" aria-label="' + (x.matches ? "agrees" : "does not agree") + '">' + (x.matches ? "✓" : "✗") + "</span><div><strong>" + esc(x.source_name) + " " + esc(x.year) + '</strong> <span class="note">' + esc(x.source_doc) + ", p." + esc(x.source_page) + (x.kind === "computed" ? " · computed: " + esc(x.note) : "") + '</span></div><div><span class="fig">' + fmt(x.value) + (pct ? "%" : "") + "</span> " + rbtn(key, "page") + "</div></div>";
      }).join("") + "</div>";
      $("cres").innerHTML = h; wireR($("cres"));
    }
    function fromSentence() {
      var p = KSClaim.parseSentence(KS, $("cin").value);
      if (p.metric) $("metric").value = p.metric; if (p.value != null) $("value").value = p.value; else $("value").value = "";
      $("cstate").value = p.state || "India (national)"; $("cyear").value = p.year && years.indexOf(p.year) >= 0 ? p.year : ""; check();
    }
    $("cgo").onclick = fromSentence; $("cagain").onclick = check;
    $("cin").onkeydown = function (e) { if (e.key === "Enter") fromSentence(); };
    $("cex").querySelectorAll(".chip").forEach(function (b) { b.onclick = function () { $("cin").value = EXAMPLES[+b.dataset.i]; fromSentence(); }; });
    if (o.focus) $("cin").focus();
  }
  function renderClaim() {
    view.innerHTML = '<h2>Check a claim</h2><p class="sub">Type or paste a number someone quoted. We compare it with every source we hold and show who agrees.</p><div class="card pad" id="cbox"></div>';
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
  var STEPS = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7"], MODE = "cpcb", QUERY = "", DOM = { cpcb: [0, 100], mohua: [0, 100], gap: [0, 80] };
  function css(v) { return getComputedStyle(root).getPropertyValue(v).trim(); }
  function lum(hex) { var m = hex.replace("#", ""); if (m.length === 3) m = m.replace(/./g, "$&$&"); var c = [0, 2, 4].map(function (i) { var x = parseInt(m.substr(i, 2), 16) / 255; return x <= .03928 ? x / 12.92 : Math.pow((x + .055) / 1.055, 2.4); }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
  function colourFor(v) { var d = DOM[MODE], k = Math.max(0, Math.min(6, Math.floor((v - d[0]) / (d[1] - d[0]) * 7))); return css(STEPS[k]); }
  var MODES = [["cpcb", "CPCB % treated"], ["mohua", "MoHUA % processed"], ["gap", "Gap"]];
  var NOTE = { cpcb: "CPCB 2023-24: treated / generated", mohua: "MoHUA 2025-26: processed / generated", gap: "MoHUA minus CPCB, percentage points (different years)" };

  function renderMap(sel) {
    if (sel && !GRID[sel]) sel = "";
    var cg = natrow("2023-24", "CPCB", "generated").value, ct = natrow("2023-24", "CPCB", "treated"), mg = natrow("2025-26", "MoHUA", "generated").value, mt = natrow("2025-26", "MoHUA", "treated");
    view.innerHTML = '<div class="hero"><div><h1>Two official numbers for India\'s waste. They don\'t match.</h1><p class="sub">Check a claim, tap a state, or open the source page behind any figure.</p><div id="cbox"></div></div>' +
      '<div class="pair"><div class="stat"><div class="big">' + Math.round(mt.value / mg * 100) + '%</div><div class="who">MoHUA: processed</div><div class="meta">2025-26 · ' + esc(mt.source_doc) + ', p.' + esc(mt.source_page) + '</div></div>' +
      '<div class="stat b"><div class="big">' + Math.round(ct.value / cg * 100) + '%</div><div class="who">CPCB figures: treated</div><div class="meta">2023-24 · ' + esc(ct.source_doc) + ', p.' + esc(ct.source_page) + '</div></div>' +
      '<div class="gapnote"><span><strong>' + n0(mt.value - ct.value) + ' tpd</strong> apart</span><details class="more"><summary>Why can\'t we say who is right?</summary><div>The two figures are for different years, and the two bodies may not define "treated" and "processed" the same way. <a href="#/explore/defs">See the definitions</a>.</div></details></div></div></div>' +
      '<div class="section"><h2>Tap a state</h2><div class="maprow"><div class="card"><div class="maptools"><input class="find" id="find" list="stl" type="search" placeholder="Find a state" aria-label="Find a state" value="' + esc(QUERY) + '"><datalist id="stl">' + states.map(function (s) { return '<option value="' + esc(s) + '">'; }).join("") + '</datalist><div class="seg" role="group" aria-label="Colour by">' +
      MODES.map(function (m) { return '<button type="button" data-m="' + m[0] + '" aria-pressed="' + (MODE === m[0]) + '">' + m[1] + "</button>"; }).join("") + '</div></div><div class="tiles" id="tiles" role="group" aria-label="States and union territories"></div><div class="legend" id="legend"></div></div>' +
      '<aside class="card pad sp" id="detail" aria-live="polite"></aside></div></div>';
    mountClaim($("cbox"));
    var el = $("tiles");
    Object.keys(GRID).forEach(function (s) {
      var p = GRID[s], v = D[s][MODE], b = document.createElement("button"); b.type = "button"; b.dataset.s = s; b.className = "tile" + (v == null ? " none" : "") + (flagged[s] ? " fl" : "");
      b.style.gridRow = p[0] + 1; b.style.gridColumn = p[1] + 1; b.setAttribute("aria-pressed", sel === s);
      var lab = s + ": " + (v == null ? "not reported" : MODE === "gap" ? v.toFixed(1) + " points" : v.toFixed(1) + "%") + (flagged[s] ? ", has data flags" : ""); b.setAttribute("aria-label", lab);
      if (v != null) { var bg = colourFor(v); b.style.background = bg; b.style.color = lum(bg) > .36 ? "#0b0b0b" : "#fff"; }
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
    $("legend").innerHTML = "<span>" + d[0] + (MODE === "gap" ? " pts" : "%") + '</span><span class="ramp" aria-hidden="true">' + STEPS.map(function (s) { return '<i style="background:var(' + s + ')"></i>'; }).join("") + "</span><span>" + d[1] + (MODE === "gap" ? "+ pts" : "%") + "</span><span>· " + NOTE[MODE] + "</span><span>· red corner = flagged</span><span>· hatched = not reported</span>";
    document.querySelectorAll(".seg button").forEach(function (b) { b.onclick = function () { MODE = b.dataset.m; renderMap(sel); }; });
    function dim() { var q = QUERY.toLowerCase(); el.querySelectorAll(".tile").forEach(function (t) { t.classList.toggle("dim", !!q && t.dataset.s.toLowerCase().indexOf(q) < 0); }); }
    $("find").oninput = function () {
      QUERY = this.value.trim(); dim();
      var exact = states.filter(function (s) { return s.toLowerCase() === QUERY.toLowerCase(); })[0];
      if (exact) { history.replaceState(null, "", "#/map/" + encodeURIComponent(exact)); QUERY = ""; renderMap(exact); }
    };
    dim(); stateDetail(sel); wireR($("detail"));
    if (sel && document.activeElement === document.body) { var t = el.querySelector('[data-s="' + sel + '"]'); if (t) t.focus({ preventScroll: true }); }
  }

  function meter(label, v, cls) {
    return '<div class="meter"><div class="top"><span>' + label + "</span><b>" + (v == null ? "not reported" : v.toFixed(1) + "%") + '</b></div><div class="track"><div class="fill ' + cls + '" style="width:' + (v == null ? 0 : Math.min(100, v)) + '%"></div></div></div>';
  }
  function numcard(label, s, y, src, m) {
    var r = row(s, y, src, m); if (!r) return "";
    return '<div class="num3"><div class="v">' + n0(val(r)) + '</div><div class="l">' + label + "</div>" + (val(r) != null ? rbtn([s, y, m, r.source_doc].join("|"), "source page") : "") + "</div>";
  }
  function stateDetail(s) {
    var box = $("detail");
    if (!s) { box.innerHTML = '<div class="empty"><div class="big">👆</div><p>Pick a state on the map, or type its name, to see both figures side by side with the source pages.</p></div>'; return; }
    var fl = KS.flags.filter(function (f) { return f.state === s && f.rule.indexOf("3_") !== 0; }), au = KS.audit.filter(function (a) { return a.state === s; })[0], x = D[s];
    var h = "<h3>" + esc(s) + "</h3>" + (au ? '<a class="rank" href="#/explore/audit" style="text-decoration:none">Audit priority #' + au.rank + " of 36</a>" : "") +
      meter("CPCB 2023-24 treated", x.cpcb, "c") + meter("MoHUA 2025-26 processed", x.mohua, "") +
      (x.gap != null ? '<p class="note">MoHUA is ' + Math.abs(x.gap).toFixed(1) + " points " + (x.gap >= 0 ? "higher" : "lower") + " than CPCB. Different years.</p>" : '<p class="note">Not enough reported to compare.</p>') +
      '<p class="note" style="margin-bottom:0"><strong>CPCB 2023-24</strong>, tonnes per day</p><div class="nums">' + numcard("generated", s, "2023-24", "CPCB", "generated") + numcard("collected", s, "2023-24", "CPCB", "collected") + numcard("treated", s, "2023-24", "CPCB", "treated") + "</div>" +
      '<p class="note" style="margin-bottom:0"><strong>MoHUA 2025-26</strong>, tonnes per day</p><div class="nums">' + numcard("generated", s, "2025-26", "MoHUA", "generated") + numcard("processed", s, "2025-26", "MoHUA", "treated") + "</div>" +
      (fl.length ? '<details class="more"><summary>' + fl.length + " flag" + (fl.length > 1 ? "s" : "") + " in this state's own reports</summary><div>" + fl.map(function (f) { return '<div class="flag"><span class="pill">' + esc(f.year) + "</span><span>" + esc(f.explanation) + ' <span class="note">(' + esc(f.values) + ")</span></span></div>"; }).join("") + "</div></details>" : '<p class="note">No flags in this state\'s own reports.</p>') +
      '<p><a class="alt" style="display:inline-block;text-decoration:none" href="#/explore/receipts/' + encodeURIComponent(s) + '">All years and source pages</a></p>';
    box.innerHTML = h;
  }

  /* ---------- Explore: audit first, receipts, swings, definitions ---------- */
  var TABS = [["audit", "Audit first"], ["receipts", "Receipts"], ["swings", "Swings"], ["defs", "Definitions"]];
  function renderExplore(tab, args) {
    if (!TABS.some(function (t) { return t[0] === tab; })) tab = "audit";
    view.innerHTML = '<h2>Explore</h2><nav class="tabs" aria-label="Explore sections">' + TABS.map(function (t) { return '<a href="#/explore/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : "") + ">" + t[1] + "</a>"; }).join("") + '</nav><div id="tab"></div>';
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
  function tabSwings(el) {
    el.innerHTML = '<p class="sub">How much a state\'s own reported generated waste differs from one report to the next.</p><div class="card pad" id="vt"></div>';
    var rows = KS.volatility.filter(function (r) { return r.ranked === "yes"; }), mx = Math.max.apply(null, rows.map(function (r) { return r.swing_ratio; }));
    mountTable($("vt"), [
      { label: "#", k: "rank", num: true }, { label: "State", k: "state" },
      { label: "Swing", k: "swing_ratio", html: function (r) { return '<div class="bar10" style="width:' + Math.max(2, r.swing_ratio / mx * 100) + '%;max-width:160px"></div>' + r.swing_ratio + "x"; } },
      { label: "Lowest", k: "min_tpd", num: true, html: function (r) { return fmt(r.min_tpd) + '<br><span class="note">' + esc(r.min_in) + "</span>"; } },
      { label: "Highest", k: "max_tpd", num: true, html: function (r) { return fmt(r.max_tpd) + '<br><span class="note">' + esc(r.max_in) + "</span>"; } }
    ], rows, { sort: "#", ph: "Search states" });
  }
  function tabReceipts(el, rest) {
    el.innerHTML = '<p class="sub">Every figure with the page it came from. Open a page to see the number boxed in red.</p><div class="card pad"><div class="grid2"><div><label for="rstate">Place</label><select id="rstate">' + opts(["India"].concat(states)) + '</select></div><div><label for="ryear">Year</label><select id="ryear">' + opts(years, "all") + '</select></div><div><label for="rmetric">Figure</label><select id="rmetric"><option value="">all</option><option>generated</option><option>collected</option><option>treated</option><option>landfilled</option></select></div></div><div id="rtab" style="margin-top:12px"></div></div>';
    if (rest[0] && states.indexOf(rest[0]) >= 0) $("rstate").value = rest[0];
    function draw() {
      var s = $("rstate").value, y = $("ryear").value, m = $("rmetric").value;
      var src = s === "India" ? KS.national.map(function (r) { return { state: "India", year: r.year, metric: r.metric, value: r.value, source_name: r.source_name, source_doc: r.source_doc, source_page: r.source_page }; })
        : KS.waste.map(function (r) { return { state: r.state, year: r.year, metric: r.metric, value: r.value_tpd, source_name: r.source_name, source_doc: r.source_doc, source_page: r.source_page }; });
      mountTable($("rtab"), [
        { label: "Year", k: "year" }, { label: "Figure", k: "metric" }, { label: "Value", k: "value", num: true, html: function (r) { return fmt(r.value); } },
        { label: "Source", k: "source_doc", html: function (r) { return esc(r.source_name) + ' <span class="note">' + esc(r.source_doc) + ", p." + esc(r.source_page) + "</span>"; }, text: function (r) { return r.source_name + " " + r.source_doc; } },
        { label: "Page", k: "x", html: function (r) { var key = [r.state, r.year, r.metric, r.source_doc].join("|"); return rbtn(key, "open page") || '<span class="note">' + (r.value == null ? "not reported" : "no page image") + "</span>"; }, val: function (r) { return hasR([r.state, r.year, r.metric, r.source_doc].join("|")) ? 0 : 1; }, text: function () { return ""; } }
      ], src.filter(function (r) { return r.state === s && (!y || r.year === y) && (!m || r.metric === m); }), { limit: 12, ph: "Search this list" });
    }
    ["rstate", "ryear", "rmetric"].forEach(function (id) { $(id).onchange = draw; }); draw();
  }
  function tabDefs(el) {
    el.innerHTML = '<p class="sub">The two sources may not mean the same thing by the same word. We store MoHUA "processed" as "treated" to compare them; that is our assumption.</p><div class="defs">' +
      KS.crosswalk.map(function (r, i) { return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(r.concept) + '</summary><div class="cols"><div><strong>CPCB</strong><br>' + esc(r.cpcb_says) + "</div><div><strong>MoHUA</strong><br>" + esc(r.mohua_says) + '</div></div><p class="note"><strong>Why it matters:</strong> ' + esc(r.why_it_matters) + "<br>" + esc(r.sources) + "</p></details>"; }).join("") +
      '</div><h3>What MoHUA has said over time</h3><div class="card pad" id="st"></div>';
    mountTable($("st"), [{ label: "Date", k: "statement_date" }, { label: "Generated", k: "generated_tpd", num: true, html: function (r) { return fmt(r.generated_tpd); } }, { label: "Processed", k: "processed_tpd", num: true, html: function (r) { return fmt(r.processed_tpd); } },
      { label: "%", k: "processed_pct_stated", num: true, html: function (r) { return fmt(r.processed_pct_stated); } }, { label: "Source", k: "source_doc", html: function (r) { return esc(r.source_doc) + ", p." + esc(r.source_page) + '<br><span class="note">' + esc(r.note) + "</span>"; } }], KS.statements, { search: false });
  }

  /* ---------- Gaps: phantom tonnes, money vs mess, collection and trucks, segregation, completeness ---------- */
  var GTABS = [["phantom", "Phantom tonnes"], ["money", "Money vs mess"], ["trucks", "Collection and trucks"], ["segregation", "Segregation"], ["complete", "Completeness"]];
  function renderGaps(tab) {
    if (!GTABS.some(function (t) { return t[0] === tab; })) tab = "phantom";
    view.innerHTML = '<h2>Gaps</h2><p class="sub">Where reported figures cannot all be true, where money and results do not line up, and what states leave unreported. These are prompts for questions, not findings that any state is at fault.</p><nav class="tabs" aria-label="Gaps sections">' +
      GTABS.map(function (t) { return '<a href="#/gaps/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : "") + ">" + t[1] + "</a>"; }).join("") + '</nav><div id="gtab"></div>';
    ({ phantom: gPhantom, money: gMoney, trucks: gTrucks, segregation: gSeg, complete: gComplete })[tab]($("gtab"));
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
      (head ? '<div class="kpis"><div class="kpi"><div class="v">' + n0(head.tpd) + '</div><div class="l">tonnes per day apart: ' + esc(head.values) + "<br>" + esc(head.year) + "</div></div></div>" : "") +
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
      var c = css(QCOL[r.quadrant]), tc = lum(c) > .36 ? "#0b0b0b" : "#fff", lab = r.state + ": " + r.swm_utilisation_pct + "% of funds used, " + r.cpcb_pct_treated + "% treated. " + QLAB[r.quadrant];
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
      '<h3>How much waste ends up in landfill</h3><p class="note">Landfilled as a share of generated waste. CPCB reports state-wise landfilled for ' + ly.join(" and ") + ' only. "Neither" is what is left after treated and landfilled (negative means the two add to more than was generated).</p><div class="grid2" style="max-width:260px;margin-bottom:10px"><div><label for="lfy">Year</label><select id="lfy">' + opts(ly.slice().reverse()) + '</select></div></div><div class="card pad" id="lf"></div>';
    var mx = Math.max.apply(null, KS.trucks.map(function (r) { return r.uncollected_tpd || 0; })) || 1;
    mountTable($("tr"), [
      { label: "#", k: "rank", num: true }, { label: "State", k: "state", html: function (r) { return stateLink(r.state); } },
      { label: "Uncollected (tpd)", k: "uncollected_tpd", html: function (r) { return '<div class="bar10" style="width:' + Math.max(2, r.uncollected_tpd / mx * 100) + '%;max-width:200px"></div>' + fmt(r.uncollected_tpd); } },
      { label: "Collected (%)", k: "collection_pct", num: true, html: function (r) { return fmt(r.collection_pct); } },
      { label: "Generated (tpd)", k: "generated_tpd", num: true, html: function (r) { return fmt(r.generated_tpd); } },
      { label: "Page", k: "x", html: function (r) { return rbtn([r.state, r.year, "collected", "ls_au50_2025-12-01.pdf"].join("|"), "source page") || '<span class="note">' + esc(r.year) + "</span>"; }, text: function () { return ""; }, val: function () { return 0; } }
    ], KS.trucks, { sort: "#", ph: "Search states" });
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
    view.innerHTML = '<h2>Audit your city</h2><p class="sub">Drop a ward-level CSV and see which figures cannot all be true, and which wards leave the most waste uncollected. It runs in your browser; nothing is uploaded.</p>' +
      '<label class="drop" id="drop" for="file" style="display:block;cursor:pointer"><div class="big" aria-hidden="true">📄</div><p style="margin:8px 0 2px"><strong>Drop a CSV here</strong> or click to choose</p><p class="note" style="margin:0">Blank cells mean "not reported" and are never filled in.</p><input type="file" id="file" accept=".csv,text/csv"></label>' +
      '<p style="margin-top:12px"><button class="alt" id="ex" type="button">Try a fictional example</button> <button class="alt" id="tpl" type="button">Get the empty template</button></p><div id="cerr" class="err" role="alert"></div><div id="cres" aria-live="polite"></div>';
    $("tpl").onclick = function () { download("city_audit_template.csv", TEMPLATE); };
    $("ex").onclick = function () { run(EXAMPLE, "Fictional example (not real data)"); };
    $("file").onchange = function () { read(this.files[0]); };
    var dz = $("drop");
    ["dragenter", "dragover"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("over"); }); });
    dz.addEventListener("drop", function (e) { read(e.dataTransfer.files[0]); });
    function read(f) { if (!f) return; var rd = new FileReader(); rd.onload = function () { run(String(rd.result), f.name); }; rd.onerror = function () { $("cerr").textContent = "Could not read that file."; }; rd.readAsText(f); }
    function run(text, name) {
      $("cerr").textContent = ""; $("cres").innerHTML = "";
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
        { label: "Uncollected (avg tpd)", k: "uncollected_tpd_avg", html: function (x) { return '<div class="bar10" style="width:' + Math.max(2, x.uncollected_tpd_avg / mx * 100) + '%;max-width:180px"></div>' + fmt(x.uncollected_tpd_avg); } },
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
  function askAgent(message, language) {
    return fetch(CFG.agentEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message, language: language }) })
      .then(function (r) { if (!r.ok) throw new Error("The assistant returned an error (" + r.status + ")."); var ct = r.headers.get("content-type") || ""; return ct.indexOf("json") >= 0 ? r.json().then(function (j) { return j.reply || j.response || j.answer || JSON.stringify(j); }) : r.text(); });
  }
  function renderAsk() {
    var live = !!CFG.agentEndpoint;
    view.innerHTML = '<h2>Ask</h2><p class="sub">Ask in English, Hindi, Tamil or Telugu. Answers come only from the dataset, with the source and page for every figure.</p>' +
      (live ? "" : '<div class="notice"><strong>The assistant isn\'t connected yet.</strong> Meanwhile, <a href="#/claim">check a claim</a> or <a href="#/explore/receipts">browse the figures</a>.</div>') +
      '<div class="chat" id="chat" aria-live="polite"></div><div class="chips">' + SUGGEST.map(function (s) { return '<button class="chip" type="button"' + (live ? "" : " disabled") + ">" + esc(s) + "</button>"; }).join("") + '</div>' +
      '<div class="ask"><input id="q" type="text" aria-label="Your question" placeholder="Ask about a state, a year or a claim"' + (live ? "" : " disabled") + '><select id="lang" aria-label="Language" style="width:auto"><option>English</option><option>Hindi</option><option>Tamil</option><option>Telugu</option></select><button class="go" id="send" type="button"' + (live ? "" : " disabled") + ">Ask</button></div>" +
      '<div class="voice"><button class="alt" id="mic" type="button" aria-pressed="false"' + (live && SR ? "" : " disabled") + '>🎤 Speak</button><label class="chk"><input type="checkbox" id="speak"' + (live && window.speechSynthesis ? "" : " disabled") + "> Read answers aloud</label>" +
      '<span class="note" id="vnote" role="status">' + (SR ? "" : "Voice input is not available in this browser (Chrome or Edge work best). You can still type.") + "</span></div>" +
      '<p class="note">Voice uses your browser\'s own speech tools. How well it handles Hindi, Tamil and Telugu depends on your browser and device. Typing always works.</p>';
    if (!live) return;
    function send(q) {
      q = (q || $("q").value).trim(); if (!q) return; var chat = $("chat");
      chat.insertAdjacentHTML("beforeend", '<div class="msg u">' + esc(q) + "</div>"); $("q").value = "";
      var pend = document.createElement("div"); pend.className = "msg a"; pend.textContent = "Looking it up…"; chat.appendChild(pend); $("send").disabled = true;
      askAgent(q, $("lang").value).then(function (t) { pend.textContent = t; if ($("speak") && $("speak").checked) speak(t, $("lang").value); }, function (e) { pend.textContent = e.message + " Try Check a claim instead."; pend.classList.add("bad"); }).then(function () { $("send").disabled = false; });
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
    view.querySelectorAll(".chips .chip").forEach(function (b) { b.onclick = function () { send(b.textContent); }; });
  }

  go();
})();
