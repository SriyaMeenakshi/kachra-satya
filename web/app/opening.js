/* The Start page ("Eco-Intelligence Observatory"): route #/start. Everything is read from window.KS at render time; only wording is typed in.
   Rules: never invent data; say "the sources disagree" and never accuse a source; MoHUA "processed" and CPCB "treated" are kept apart and their years and sources are always shown;
   the map reuses KSMapKit (app.js) and KSGeo (geomap.js); motion respects prefers-reduced-motion (see opening.css). Receipt buttons carry data-rkey and are wired by app.js after render. */
(function (root) {
  var KS = root.KS, $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function n0(v) { return v == null ? "not reported" : Math.round(v).toLocaleString("en-IN"); }
  function T(k, fb, v) { if (root.KSi18n) return root.KSi18n.t(k, fb, v); var s = fb; if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); }); return s; }
  function term(k, label) { return root.KSi18n ? root.KSi18n.term(k, label) : esc(label || k); }
  function nat(y, src, m) { var r = KS.national.filter(function (x) { return x.state === "India" && x.year === y && x.source_name === src && x.metric === m; })[0]; return r || null; }
  function rbtn(key, label) { var r = KS.receipts[key]; return r && r.image ? ' <button type="button" class="srcbtn" data-rkey="' + esc(key) + '">' + esc(label || "source page") + "</button>" : ""; }
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function r3(n) { return n >= 1000 ? Math.round(n / 100) * 100 : n >= 100 ? Math.round(n / 10) * 10 : Math.max(1, Math.round(n)); }
  var DOCS = { "ls_au50_2025-12-01.pdf": "Lok Sabha Q50", "rs_q358_2025-02-06.pdf": "Rajya Sabha Q358", "mohua_81pct_answer.pdf": "Rajya Sabha Q2433", "cpcb_2022-23.pdf": "CPCB report 2022-23", "cpcb_2021-22.pdf": "CPCB report 2021-22" };
  function nm(d) { return DOCS[d] || (root.KSAnswer ? root.KSAnswer.docName(d) : d); }      /* plain document name for a file name */
  var EXAMPLES = ["81% of India's urban waste is processed", "62% of India's waste is treated", "Delhi treated 7,542 tonnes per day in 2023-24"];
  var LBL = { SUPPORTED: ["Supported", "ok", "v_sup", "v_sup_s"], CONTRADICTED: ["Contradicted", "bad", "v_con", "v_con_s"], SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS: ["The sources disagree", "", "v_mix", "v_mix_s"], CANNOT_VERIFY: ["Can't verify", "mute", "v_cant", "v_cant_s"] };
  var LAYER = "gap", startOpen = true;
  try { var seen = localStorage.getItem("ks-start"); startOpen = seen === null || seen === "open"; if (seen === null) localStorage.setItem("ks-start", "closed"); } catch (e) {}   /* first visit: steps open; afterwards remembered */

  function ticker() {
    var r = rng(20261110), pool = KS.waste.filter(function (x) { return x.value_tpd != null && DOCS[x.source_doc] && KS.receipts[[x.state, x.year, x.metric, x.source_doc].join("|")] && KS.receipts[[x.state, x.year, x.metric, x.source_doc].join("|")].image; }), items = [];
    while (items.length < 14 && pool.length) { var x = pool.splice(Math.floor(r() * pool.length), 1)[0]; items.push(x.state + " " + x.metric + " " + n0(x.value_tpd) + " t/day · " + DOCS[x.source_doc] + " · p." + x.source_page); }
    var html = items.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("");
    return '<div class="ticker" aria-hidden="true"><div class="tr">' + html + html + "</div></div>";
  }
  function dots(n) { var h = '<div class="g" aria-hidden="true">'; for (var i = 0; i < 100; i++) h += '<i style="--i:' + i + '"' + (i < n ? ' class="f"' : "") + "></i>"; return h + "</div>"; }
  function icon(id) { return '<svg class="ic" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function row(href, id, name, desc, chip) { return '<a class="op-row" href="' + href + '">' + icon(id) + "<span><b>" + esc(name) + (chip ? ' <span class="op-chip">' + esc(chip) + "</span>" : "") + '</b><span class="d">' + esc(desc) + '</span></span><span class="ar" aria-hidden="true">&rarr;</span></a>'; }

  function jy(n, name, q, big, cap, links) {
    return '<li class="jy-step"><span class="jy-n" aria-hidden="true">' + n + '</span><h3>' + esc(name) + '</h3><p class="jy-q">' + esc(q) + '</p><div class="jy-proof"><b>' + big + '</b><span>' + esc(cap) + '</span></div><div class="jy-links">' +
      links.map(function (l) { return '<a class="jy-btn' + (l[2] ? " primary" : "") + '" href="' + l[0] + '">' + esc(l[1]) + (l[3] ? ' <span class="op-chip">' + esc(l[3]) + "</span>" : "") + ' <span aria-hidden="true">&rarr;</span></a>'; }).join("") + "</div></li>";
  }
  function grp(n, name, q, rows) { return '<div class="op-grp"><div class="op-grp-h"><span class="n" aria-hidden="true">' + n + '</span><div><h3>' + esc(name) + '</h3><p>' + esc(q) + '</p></div></div><div class="op-index">' + rows + "</div></div>"; }
  function drawMap() {
    var Kit = root.KSMapKit, box = $("op-map"); if (!box) return;
    if (!(Kit && root.KSGeo && root.KS_INDIA)) { box.innerHTML = '<p class="note">The map could not load. Use the Map page from the menu.</p>'; return; }
    root.KSGeo.draw(box, { value: function (s) { return Kit.value(s, LAYER); }, colour: function (v) { return Kit.colour(LAYER, v, true); }, ink: Kit.ink, label: function (s) { return Kit.label(s, LAYER); }, selected: null, flagged: Kit.flagged, abb: Kit.abb,
      onSelect: function (s) { location.hash = "#/map/" + encodeURIComponent(s); },
      tip: function (lab, e) { var t = $("tip"); if (!t) return; if (!lab) { t.style.display = "none"; return; } t.textContent = lab; t.style.display = "block"; t.style.left = Math.min(e.clientX + 14, innerWidth - 250) + "px"; t.style.top = (e.clientY + 14) + "px"; } });
    var d = Kit.dom[LAYER], gap = LAYER === "gap", steps = (gap ? ["dg1", "dg2", "dg3", "dg4", "dg5", "dg6", "dg7"] : ["d1", "d2", "d3", "d4", "d5", "d6", "d7"]);
    $("op-legend").innerHTML = "<span>" + d[0] + (gap ? " pts" : "%") + '</span><span class="ramp" aria-hidden="true">' + steps.map(function (s) { return '<i style="background:var(--' + s + ')"></i>'; }).join("") + "</span><span>" + d[1] + (gap ? "+ pts" : "%") + "</span><span>" +
      (gap ? "Darker coral: MoHUA's figure sits further above CPCB's (different years)." : LAYER === "mohua" ? "MoHUA 2025-26: share of generated waste reported processed." : "CPCB 2023-24: share of generated waste reported treated.") + "</span>";
  }

  function render() {
    var view = $("view"), mp = nat("2025-26", "MoHUA", "processed_pct"), mt = nat("2025-26", "MoHUA", "treated"), mg = nat("2025-26", "MoHUA", "generated"), cg = nat("2023-24", "CPCB", "generated"), ct = nat("2023-24", "CPCB", "treated");
    var mpct = mp ? Math.round(mp.value) : null, cpct = cg && ct ? Math.round(ct.value / cg.value * 100) : null, cexact = cg && ct ? (ct.value / cg.value * 100).toFixed(1) : null, gap = mt && ct ? mt.value - ct.value : null;
    var boxed = Object.keys(KS.receipts).filter(function (k) { return KS.receipts[k].bbox; }).length;      /* figures where the number itself is boxed on the page */
    var withPage = Object.keys(KS.receipts).filter(function (k) { return KS.receipts[k].image; }).length, states = Array.from(new Set(KS.waste.map(function (r) { return r.state; }))).length;
    var reported = KS.waste.filter(function (r) { return r.value_tpd != null; }).length + KS.national.filter(function (r) { return r.value != null; }).length;     /* blanks ("not reported") are not counted */
    var kerala = KS.recurrence.filter(function (r) { return r.rule.indexOf("6_") === 0; }).sort(function (a, b) { return b.n_years - a.n_years; })[0], vol = KS.volatility.filter(function (r) { return r.ranked === "yes"; })[0];
    var diffPairs = KS.flags.filter(function (f) { return f.rule.indexOf("3_") === 0; }).length;
    var mKey = mp ? "India|2025-26|processed_pct|" + mp.source_doc : "", cKey = ct ? "India|2023-24|treated|" + ct.source_doc : "";
    var fAlloc = KS.money.reduce(function (a, m) { return a + (m.allocation_swm || 0); }, 0), fUsed = KS.money.reduce(function (a, m) { return a + (m.funds_swm || 0); }, 0), fPct = fAlloc ? Math.round(fUsed / fAlloc * 100) : null;
    var unacc = nat("2022-23", "CPCB", "unaccounted"), uKey = unacc ? "India|2022-23|unaccounted|" + unacc.source_doc : "";
    var segC = KS.segregation.filter(function (x) { return x.indicator.indexOf("D2D") >= 0; })[0], segS = KS.segregation.filter(function (x) { return x.indicator.indexOf("Segregation") >= 0; })[0];
    var agentOn = !!(root.KS_CONFIG && root.KS_CONFIG.agentEndpoint);
    var taps = 0; try { var wr = JSON.parse(localStorage.getItem("ks-ward-reports-v1") || "null"); taps = wr && Array.isArray(wr.reports) ? wr.reports.length : 0; } catch (e) { taps = 0; }   /* this device only; storage may be blocked */
    function doors() {      /* "What brings you here?": four doors, one per kind of visitor. Each starts a guided path (guide.js). */
      return '<div class="op-doors" role="group" aria-labelledby="op-go-h"><h2 id="op-go-h" class="op-doors-h">' + esc(T("goal_h", "What brings you here?")) + '</h2>' + (root.KSGuide ? root.KSGuide.chooser() : "") + '<p class="op-explore"><a href="#/map">' + esc(T("cta_explore", "Explore the data")) + ' &rarr;</a></p></div>';
    }
    function lead() {      /* one concrete case, chosen by rule (lead.js): the state where the two newest figures are furthest apart */
      var L = root.KSLead ? root.KSLead.pick(KS) : null; if (!L) return "";
      var P = root.KSLead.pct, m = L.mohua, c = L.cpcb, up = m.treated > c.treated, times = c.treated > 0 ? Math.round(m.treated / c.treated * 10) / 10 : null;
      function card(x, cls, who, word) { return '<div class="op-lead-c ' + cls + '"><span class="who">' + esc(who) + '</span><span class="big">' + P(x.pct) + '</span><span class="sm">' + esc(T("lead_card_" + cls, "{t} of {g} tonnes a day reported " + word + ", {y}.", { t: n0(x.treated), g: n0(x.generated), y: x.year })) + "<br>" + esc(nm(x.doc)) + ", p." + esc(x.page) + rbtn(x.key) + "</span></div>"; }
      return '<section class="op-sec op-lead" aria-labelledby="op-lead-h"><p class="op-eyebrow">' + esc(T("lead_k", "One place, two receipts")) + '</p>' +
        '<h2 class="op-h2" id="op-lead-h">' + esc(T("lead_h", "{state}: is {m} of its waste processed, or {c}?", { state: L.state, m: P(m.pct), c: P(c.pct) })) + "</h2>" +
        '<div class="op-lead-g">' + card(m, "m", T("stat_mohua_who", "MoHUA says"), "processed") + '<span class="op-lead-vs" aria-hidden="true">&ne;</span>' + card(c, "c", T("stat_cpcb_who", "CPCB figures give"), "treated") + "</div>" +
        '<p class="op-p">' + esc(up && times ? T("lead_either", "Both are government figures for the same place. Either the waste handled rose from {a} to {b} tonnes a day ({x} times) between {y1} and {y2}, or the two bodies are not counting the same thing.", { a: n0(c.treated), b: n0(m.treated), x: times, y1: c.year, y2: m.year }) : T("lead_years", "Both are government figures for the same place. The years differ ({y1} and {y2}) and the two bodies may not be counting the same thing.", { y1: c.year, y2: m.year })) + " <strong>" + esc(T("lead_neither", "The documents do not say which, and neither do we.")) + "</strong></p>" +
        '<p class="op-lead-note">' + esc(T("lead_how", "How we chose this: it is the widest difference of any state in our data, picked by that rule and not by hand. The CPCB share is computed by us from two printed figures.")) + '</p>' +
        '<div class="op-why3-cta"><a class="op-btn primary" href="#/map/' + encodeURIComponent(L.state) + '">' + esc(T("lead_map", "Open {state} on the map", { state: L.state })) + '</a><a class="op-btn ghost" href="#/ward">' + esc(T("lead_street", "Is it true on your street?")) + '</a></div></section>';
    }
    view.innerHTML = '<div class="op">' +
      '<section class="op-stage stage" aria-labelledby="op-h1"><div class="op-stage-in"><div class="op-copy"><p class="op-kicker">' + esc(T("kicker", "Waste data observatory · India")) + '</p>' +
      '<h1 class="op-h1" id="op-h1">' + (root.KSi18n && root.KSi18n.lang() !== "en" ? esc(T("h1", "")) : 'Every waste promise <span class="mark">deserves a receipt.</span>') + '</h1><p class="op-lede">' + esc(T("lede", "India's two official numbers for the waste it processes disagree. Check the promise, open the proof, test it on your street, then do something about it.")) + '</p>' +
      doors() +
      '<p class="op-what">' + esc(T("what", "Kachra Satya puts India's two official waste numbers side by side (from the Housing Ministry, MoHUA, and the pollution control board, CPCB), shows the source page behind each, and flags figures that can't all be true.")) + "</p></div>" +
      '<div class="op-mapwrap"><div id="op-mapbox"><div class="seg op-layers" role="group" aria-label="' + esc(T("layer_label", "Colour the map by")) + '">' +
      [["gap", T("layer_gap", "Difference")], ["mohua", T("layer_mohua", "MoHUA processed")], ["cpcb", T("layer_cpcb", "CPCB treated")]].map(function (m) { return '<button type="button" data-l="' + m[0] + '" aria-pressed="' + (LAYER === m[0]) + '">' + esc(m[1]) + "</button>"; }).join("") + "</div>" +
      '<div class="geo op-map" id="op-map"></div><div class="op-legend" id="op-legend"></div><p class="op-maphint">' + esc(T("map_hint", "Select a state to open its figures")) + "</p>" +
      '<div class="op-floats"><div class="op-float m op-f1"><span class="who">' + esc(T("stat_mohua_who", "MoHUA says")) + '</span><span class="big">' + (mpct == null ? "&ndash;" : mpct + "%") + '</span><span class="sm">' + term("processed") + " · 2025-26 · " + (mp ? esc(nm(mp.source_doc)) + ", p." + esc(mp.source_page) + rbtn(mKey) : "") + "</span></div>" +
      '<div class="op-float c op-f2"><span class="who">' + esc(T("stat_cpcb_who", "CPCB figures give")) + '</span><span class="big">' + (cpct == null ? "&ndash;" : cpct + "%") + '</span><span class="sm">' + term("treated") + " · 2023-24 · " + (ct ? esc(nm(ct.source_doc)) + ", p." + esc(ct.source_page) + rbtn(cKey) : "") + "</span></div></div></div></div></div>" + ticker() + "</section>" +

      lead() +
      (root.KSLoop ? root.KSLoop.strip() : "") +
      '<section class="op-sec op-two" aria-labelledby="op-two-h"><div><p class="op-eyebrow">' + esc(T("kicker2", "The two official figures")) + '</p><h2 class="op-h2" id="op-two-h">' + esc(T("two_h", "Two official numbers. One country.")) + '</h2>' +
      '<p class="op-p">' + esc(T("two_p", "Both come from government documents and answer a similar question, for different years, and the two bodies may not mean the same thing by their words.")) + '</p>' +
      '<ul class="op-why3" aria-label="Three reasons the two numbers differ"><li><b>Different years</b><span>MoHUA 2025-26, CPCB 2023-24.</span></li><li><b>Different words</b><span>&ldquo;Processed&rdquo; and &ldquo;treated&rdquo; are not defined the same way.</span></li><li><b>Different totals</b><span>' + (mg ? n0(mg.value) : "&ndash;") + ' and ' + (cg ? n0(cg.value) : "&ndash;") + ' tonnes a day to start from.</span></li></ul>' +
      '<p class="op-why3-note">We do not say which number is right.</p><div class="op-why3-cta"><a class="op-btn primary" href="#/claim">Check a number</a><a class="op-btn ghost" href="#/map">See it by state</a></div></div>' +
      '<div><div class="op-charts"><div class="dots m"><div class="num">' + (mpct == null ? "&ndash;" : mpct + "%") + "</div>" + dots(mpct || 0) +
      '<p class="cap">' + esc(T("mo_cap", "MoHUA: processed, 2025-26")) + '</p><p class="meta">' + (mt && mg ? n0(mt.value) + " of " + n0(mg.value) + " tonnes a day, as MoHUA reports." : "") + (mp ? " " + esc(nm(mp.source_doc)) + ", p." + esc(mp.source_page) : "") + rbtn(mKey) + (mt ? '<span class="mean">≈ ' + r3(mt.value / 10).toLocaleString("en-IN") + " " + term("truckload") + "s a day</span>" : "") + "</p></div>" +
      '<div class="dots c"><div class="num">' + (cpct == null ? "&ndash;" : cpct + "%") + "</div>" + dots(cpct || 0) +
      '<p class="cap">' + esc(T("cp_cap", "CPCB: treated, 2023-24")) + '</p><p class="meta">' + (ct && cg ? n0(ct.value) + " of " + n0(cg.value) + " tonnes a day (" + cexact + "%, computed by us)." : "") + (ct ? " " + esc(nm(ct.source_doc)) + ", p." + esc(ct.source_page) : "") + rbtn(cKey) + (ct ? '<span class="mean">≈ ' + r3(ct.value / 10).toLocaleString("en-IN") + " " + term("truckload") + "s a day</span>" : "") + "</p></div></div>" +
      '<div class="op-apart"><b>' + esc(T("apart", "{n} tonnes a day between two reports", { n: n0(gap) })) + '</b><span class="s">A numerical difference between two reports: MoHUA 2025-26 processed minus CPCB 2023-24 treated. The years differ and the definitions may too, so <strong>this is not an amount of waste that went missing.</strong></span><span class="stamp">The sources disagree</span></div>' +
      '<div class="op-pt"><h3 class="full">' + esc(T("proc_h", "Processed or treated?")) + '</h3><p>' + term("mohua") + ' reports ' + term("processed") + ' (column "Total Waste Processed"). The documents we hold do not define the word.</p>' +
      '<p>' + term("cpcb") + ' reports ' + term("treated") + ' (column "Treated"). Its report defines treatment as a method that changes waste to reduce its volume and harm.</p>' +
      '<p class="op-assume">To compare them we store MoHUA\'s "processed" as "treated". That is our assumption, not a stated equivalence. The years differ (2025-26 and 2023-24), and so do the totals each percentage is divided by (' + (mg ? n0(mg.value) : "") + ' and ' + (cg ? n0(cg.value) : "") + ' tonnes a day), so our data holds no same-year, same-definition comparison. <a href="#/explore/defs">Read the definitions</a></p>' +
      '<dl class="op-words" aria-label="What the words mean"><dt>Generated</dt><dd>Waste produced, as reported by states and cities. Nobody here weighs it.</dd><dt>Collected</dt><dd>Waste picked up from homes and streets.</dd>' +
      '<dt>Treated or processed</dt><dd>Waste sent through a plant or method. The two bodies use different words and we cannot show they mean the same.</dd><dt>Landfilled</dt><dd>Waste sent to a landfill.</dd>' +
      '<dt>Reported or computed</dt><dd><b>Reported</b> is printed in a document. <b>Computed</b> is a share we worked out from two printed figures, and is labelled that way.</dd></dl></div></div></section>' +

      '<section class="op-sec" aria-labelledby="op-why-h"><p class="op-eyebrow">' + esc(T("why_k", "Why this matters")) + '</p><h2 class="op-h2" id="op-why-h">' + esc(T("why_h", "Plans and money start from these numbers.")) + '</h2>' +
      '<p class="op-p">' + esc(T("why_p", "Plants, landfills and funding are planned from reported figures. When the figures do not agree, nobody can tell where the waste goes, or whether the money is working. Three things the published records show:")) + '</p><div class="op-finds">' +
      (fPct == null ? "" : '<div class="op-find"><span class="n">' + fPct + '%</span><p>of the solid-waste money set aside for states for 2021-2026 had been used by 25 Nov 2024.<small>Lok Sabha Q682. The table prints no unit, so we use only the share.</small></p><a href="#/gaps/money">See which states &rarr;</a></div>') +
      (unacc ? '<div class="op-find"><span class="n">' + n0(unacc.value) + '</span><p>tonnes a day in 2022-23 that CPCB found neither treated nor landfilled.<small>CPCB report, ' + esc(nm(unacc.source_doc)) + ", p." + esc(unacc.source_page) + ".</small>" + rbtn(uKey) + '</p><a href="#/gaps">Where the gaps are &rarr;</a></div>' : "") +
      (segC && segS ? '<div class="op-find"><span class="n">' + Math.round(segC.share_pct_computed) + '% vs ' + Math.round(segS.share_pct_computed) + '%</span><p>of wards had over 90% door-to-door collection, but only that many had over 90% source segregation (2022).<small>MoHUA Garbage Free Cities 2022 dashboard; shares computed against the wards covered.</small></p><a href="#/help/bins">Which bin does it go in? &rarr;</a></div>' : "") +
      '</div></section>' +

      (root.KSDemo ? root.KSDemo.html() : "") +
      '<section class="op-sec op-close" aria-labelledby="op-c-h"><h2 class="op-h2" id="op-c-h">' + esc(T("close_h", "Want to see how it is checked?")) + '</h2><p class="op-p">' + esc(T("close_p", "Every figure is copied from a published document and opens on its source page. Where sources disagree, we say so and never pick a winner.")) + '</p>' +
      '<div class="op-cta"><a class="op-btn primary" href="#/claim">' + esc(T("check", "Check a number")) + '</a><a class="op-btn ghost" href="#/about">How we check</a><a class="op-btn ghost" href="#/gaps">See the insights</a></div>' +
      '<p class="op-honest">Data built ' + esc(KS.built) + ". This is a demonstration; we draft complaints and letters and never send them.</p></section></div>";

    drawMap();
    view.querySelectorAll(".op-layers button").forEach(function (b) { b.onclick = function () { LAYER = b.dataset.l; view.querySelectorAll(".op-layers button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); drawMap(); }; });
    if (root.KSGuide) root.KSGuide.wireGoals(view);
    if (root.KSDemo) root.KSDemo.wire(view);
    /* reveal: content is visible by default; .pre hides it only while it is about to be revealed, and everything is forced visible after 4 s so a throttled tab never stays blank */
    var targets = [].slice.call(view.querySelectorAll(".dots .g, .op-find, .stamp"));
    if (!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches) && "IntersectionObserver" in root) {
      targets.forEach(function (n) { n.classList.add("pre"); });
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); } }); }, { threshold: .2 });
      targets.forEach(function (n) { io.observe(n); });
      setTimeout(function () { targets.forEach(function (n) { n.classList.remove("pre"); }); }, 4000);
    }
  }
  root.KSOpening = { render: render };
})(window);
