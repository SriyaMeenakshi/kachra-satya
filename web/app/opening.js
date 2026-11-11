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
    var withPage = Object.keys(KS.receipts).filter(function (k) { return KS.receipts[k].image; }).length, states = Array.from(new Set(KS.waste.map(function (r) { return r.state; }))).length;
    var reported = KS.waste.filter(function (r) { return r.value_tpd != null; }).length + KS.national.filter(function (r) { return r.value != null; }).length;     /* blanks ("not reported") are not counted */
    var kerala = KS.recurrence.filter(function (r) { return r.rule.indexOf("6_") === 0; }).sort(function (a, b) { return b.n_years - a.n_years; })[0], vol = KS.volatility.filter(function (r) { return r.ranked === "yes"; })[0];
    var diffPairs = KS.flags.filter(function (f) { return f.rule.indexOf("3_") === 0; }).length;
    var mKey = mp ? "India|2025-26|processed_pct|" + mp.source_doc : "", cKey = ct ? "India|2023-24|treated|" + ct.source_doc : "";
    var fAlloc = KS.money.reduce(function (a, m) { return a + (m.allocation_swm || 0); }, 0), fUsed = KS.money.reduce(function (a, m) { return a + (m.funds_swm || 0); }, 0), fPct = fAlloc ? Math.round(fUsed / fAlloc * 100) : null;
    var unacc = nat("2022-23", "CPCB", "unaccounted"), uKey = unacc ? "India|2022-23|unaccounted|" + unacc.source_doc : "";
    var segC = KS.segregation.filter(function (x) { return x.indicator.indexOf("D2D") >= 0; })[0], segS = KS.segregation.filter(function (x) { return x.indicator.indexOf("Segregation") >= 0; })[0];
    var agentOn = !!(root.KS_CONFIG && root.KS_CONFIG.agentEndpoint);
    function steps(open) {
      return '<section class="op-start' + (open ? "" : " min") + '" id="op-start" aria-label="' + esc(T("newhere", "New here? Three steps")) + '"><h2>' + esc(T("newhere", "New here? Three steps")) + "</h2><ol>" +
        '<li><a href="#/claim"><span class="n">1</span><span><b>' + esc(T("step1", "Type a claim")) + '</b><span class="d">' + esc(T("step1d", "Paste a number someone quoted")) + "</span></span></a></li>" +
        '<li><a href="#/map"><span class="n">2</span><span><b>' + esc(T("step2", "Tap your state")) + '</b><span class="d">' + esc(T("step2d", "See both official figures")) + "</span></span></a></li>" +
        '<li>' + (cKey && KS.receipts[cKey] && KS.receipts[cKey].image ? '<button type="button" class="stepbtn" data-rkey="' + esc(cKey) + '">' : '<a href="#/explore/receipts">') + '<span class="n">3</span><span><b>' + esc(T("step3", "Open the source page")) + '</b><span class="d">' + esc(T("step3d", "See the number boxed on the document")) + "</span></span>" + (cKey && KS.receipts[cKey] && KS.receipts[cKey].image ? "</button>" : "</a>") + "</li></ol>" +
        '<button type="button" class="chip x" id="op-sx" aria-expanded="' + open + '">' + esc(open ? T("hide", "Hide") : T("show3", "Show the 3 steps")) + "</button></section>";
    }
    view.innerHTML = '<div class="op">' +
      '<section class="op-stage stage" aria-labelledby="op-h1"><div class="op-stage-in"><div class="op-copy"><p class="op-kicker">' + esc(T("kicker", "Waste data observatory · India")) + '</p>' +
      '<h1 class="op-h1" id="op-h1">' + (root.KSi18n && root.KSi18n.lang() !== "en" ? esc(T("h1", "")) : 'India\'s waste story <span class="mark">doesn\'t always</span> add up.') + '</h1><p class="op-lede">' + esc(T("lede", "Follow the numbers, compare official claims and uncover what India's waste data actually says.")) + '</p>' +
      '<div class="op-cta"><a class="op-btn primary" href="#/map">' + esc(T("cta_explore", "Explore the data")) + '</a><a class="op-btn ghost" href="#/claim">' + esc(T("cta_claim", "Check a claim")) + '</a></div>' +
      '<p class="op-what">' + esc(T("what", "Kachra Satya puts India's two official waste numbers side by side, shows the source page behind each, and flags figures that can't all be true.")) + "</p></div>" +
      '<div class="op-mapwrap"><div class="seg op-layers" role="group" aria-label="' + esc(T("layer_label", "Colour the map by")) + '">' +
      [["gap", T("layer_gap", "Difference")], ["mohua", T("layer_mohua", "MoHUA processed")], ["cpcb", T("layer_cpcb", "CPCB treated")]].map(function (m) { return '<button type="button" data-l="' + m[0] + '" aria-pressed="' + (LAYER === m[0]) + '">' + esc(m[1]) + "</button>"; }).join("") + "</div>" +
      '<div class="geo op-map" id="op-map"></div><div class="op-legend" id="op-legend"></div><p class="op-maphint">' + esc(T("map_hint", "Select a state to open its figures")) + "</p>" +
      '<div class="op-floats"><div class="op-float m op-f1"><span class="who">' + esc(T("stat_mohua_who", "MoHUA says")) + '</span><span class="big">' + (mpct == null ? "&ndash;" : mpct + "%") + '</span><span class="sm">' + term("processed") + " · 2025-26 · " + (mp ? esc(DOCS[mp.source_doc] || mp.source_doc) + ", p." + esc(mp.source_page) + rbtn(mKey) : "") + "</span></div>" +
      '<div class="op-float c op-f2"><span class="who">' + esc(T("stat_cpcb_who", "CPCB figures give")) + '</span><span class="big">' + (cpct == null ? "&ndash;" : cpct + "%") + '</span><span class="sm">' + term("treated") + " · 2023-24 · " + (ct ? esc(DOCS[ct.source_doc] || ct.source_doc) + ", p." + esc(ct.source_page) + rbtn(cKey) : "") + "</span></div></div></div></div>" + ticker() + "</section>" +
      steps(startOpen) +

      '<section class="op-sec" aria-labelledby="op-why-h"><p class="op-eyebrow">' + esc(T("why_k", "Why this matters")) + '</p><h2 class="op-h2" id="op-why-h">' + esc(T("why_h", "Plans and money start from these numbers.")) + '</h2>' +
      '<p class="op-p">' + esc(T("why_p", "Plants, landfills and funding are planned from reported figures. When the figures do not agree, nobody can tell where the waste goes, or whether the money is working. Four things the published records show:")) + '</p><div class="op-finds">' +
      (fPct == null ? "" : '<div class="op-find"><span class="n">' + fPct + '%</span><p>of the solid-waste money set aside for states for 2021-2026 had been used by 25 Nov 2024.<small>Lok Sabha Q682. The table prints no unit, so we use only the share.</small></p><a href="#/gaps/money">See which states &rarr;</a></div>') +
      (unacc ? '<div class="op-find"><span class="n">' + n0(unacc.value) + '</span><p>tonnes a day in 2022-23 that CPCB found neither treated nor landfilled.<small>CPCB report, ' + esc(unacc.source_doc) + ", p." + esc(unacc.source_page) + ".</small>" + rbtn(uKey) + '</p><a href="#/gaps">Where the gaps are &rarr;</a></div>' : "") +
      (segC && segS ? '<div class="op-find"><span class="n">' + Math.round(segC.share_pct_computed) + '% vs ' + Math.round(segS.share_pct_computed) + '%</span><p>of wards had over 90% door-to-door collection, but only that many had over 90% source segregation (2022).<small>MoHUA Garbage Free Cities 2022 dashboard; shares computed against the wards covered.</small></p><a href="#/help/bins">Which bin does it go in? &rarr;</a></div>' : "") +
      (gap != null ? '<div class="op-find"><span class="n">' + n0(gap) + '</span><p>tonnes a day apart: the two official national &ldquo;treated&rdquo; totals.<small>Different years, so part of it may be real progress.</small></p><a href="#/claim">Check a number &rarr;</a></div>' : "") +
      '</div></section>' +

      '<section class="op-sec" aria-labelledby="op-p-h"><p class="op-eyebrow">' + esc(T("parts_k", "The main parts")) + '</p><h2 class="op-h2" id="op-p-h">' + esc(T("parts_h", "From what was said to what you can do.")) + '</h2>' +
      '<p class="op-p">' + esc(T("parts_p", "Four steps. Each part opens on real data, and every figure keeps its source page.")) + '</p>' +
      grp("1", "Promise", "What did they say?", row("#/claim", "i-claim", T("idx_claim", "Check a claim"), T("idx_claim_d", "Test a number you heard against every source we hold.")) + row("#/ask", "i-ask", T("idx_ask", "Ask"), T("idx_ask_d", "Questions in English, Hindi, Tamil or Telugu, answered from the data."), agentOn ? "" : "assistant not connected")) +
      grp("2", "Proof", "Is it true on paper?", row("#/map", "i-map", T("idx_map", "Map"), T("idx_map_d", "Both official figures for every state, with the source page.")) + row("#/gaps", "i-gaps", T("idx_gaps", "Gaps"), T("idx_gaps_d", "Money, trucks and reporting gaps, state by state.")) + row("#/explore", "i-explore", T("idx_explore", "Explore"), T("idx_explore_d", "Audit order, source pages, swings and definitions."))) +
      grp("3", "Reality", "Is it true on my street?", row("#/ward", "i-ward", "Your ward", "Tap whether the truck came; it stays on your device.", "prototype") + row("#/city", "i-city", T("idx_city", "Your city"), T("idx_city_d", "Upload ward data and see which figures cannot all be true.")) + row("#/school", "i-more", "Schools", "Weigh a week of school waste and get a report card.")) +
      grp("4", "Action", "What can I do?", row("#/help/complain", "i-help", "Get help", "Write a complaint, keep a log, send an escalation letter.") + row("#/help/bins", "i-bin", "Which bin?", "The four streams under the 2026 rules.") + row("#/dropoff", "i-bin", "Nearest drop-off", "Where to take batteries, e-waste and other special items.") + row("#/brief/card", "i-more", "Explain my state", "A shareable card and a briefing for an MP, MLA or councillor.")) +
      '</section>' +

      '<section class="op-sec op-two" aria-labelledby="op-two-h"><div><p class="op-eyebrow">' + esc(T("kicker2", "The two official figures")) + '</p><h2 class="op-h2" id="op-two-h">' + esc(T("two_h", "Two official numbers. One country.")) + '</h2>' +
      '<p class="op-p">' + esc(T("two_p", "Both come from government documents and answer a similar question, for different years, and the two bodies may not mean the same thing by their words.")) + '</p></div>' +
      '<div><div class="op-charts"><div class="dots m"><div class="num">' + (mpct == null ? "&ndash;" : mpct + "%") + "</div>" + dots(mpct || 0) +
      '<p class="cap">' + esc(T("mo_cap", "MoHUA: processed, 2025-26")) + '</p><p class="meta">' + (mt && mg ? n0(mt.value) + " of " + n0(mg.value) + " tonnes a day, as MoHUA reports." : "") + (mp ? " " + esc(DOCS[mp.source_doc] || mp.source_doc) + ", p." + esc(mp.source_page) : "") + rbtn(mKey) + (mt ? '<span class="mean">≈ ' + r3(mt.value / 10).toLocaleString("en-IN") + " " + term("truckload") + "s a day</span>" : "") + "</p></div>" +
      '<div class="dots c"><div class="num">' + (cpct == null ? "&ndash;" : cpct + "%") + "</div>" + dots(cpct || 0) +
      '<p class="cap">' + esc(T("cp_cap", "CPCB: treated, 2023-24")) + '</p><p class="meta">' + (ct && cg ? n0(ct.value) + " of " + n0(cg.value) + " tonnes a day (" + cexact + "%, computed by us)." : "") + (ct ? " " + esc(DOCS[ct.source_doc] || ct.source_doc) + ", p." + esc(ct.source_page) : "") + rbtn(cKey) + (ct ? '<span class="mean">≈ ' + r3(ct.value / 10).toLocaleString("en-IN") + " " + term("truckload") + "s a day</span>" : "") + "</p></div></div>" +
      '<div class="op-apart"><b>' + esc(T("apart", "{n} tonnes a day apart", { n: n0(gap) })) + '</b><span class="s">MoHUA 2025-26 processed minus CPCB 2023-24 treated. Different years.</span><span class="stamp">The sources disagree</span></div>' +
      '<div class="op-pt"><h3 class="full">' + esc(T("proc_h", "Processed or treated?")) + '</h3><p>' + term("mohua") + ' reports ' + term("processed") + ' (column "Total Waste Processed"). The documents we hold do not define the word.</p>' +
      '<p>' + term("cpcb") + ' reports ' + term("treated") + ' (column "Treated"). Its report defines treatment as a method that changes waste to reduce its volume and harm.</p>' +
      '<p class="op-assume">To compare them we store MoHUA\'s "processed" as "treated". That is our assumption, not a stated equivalence. The years differ (2025-26 and 2023-24), and so do the totals each percentage is divided by (' + (mg ? n0(mg.value) : "") + ' and ' + (cg ? n0(cg.value) : "") + ' tonnes a day), so our data holds no same-year, same-definition comparison. <a href="#/explore/defs">Read the definitions</a></p></div></div></section>' +

      '<section class="op-sec" aria-labelledby="op-f-h"><p class="op-eyebrow">' + esc(T("findings_h", "What the numbers show")) + '</p><h2 class="op-h2" id="op-f-h">' + esc(T("findings_t", "Three places to look first")) + '</h2><div class="op-finds">' +
      (kerala ? '<div class="op-find"><span class="n">' + kerala.n_years + ' years</span><p>' + esc(kerala.state) + ' reported more waste treated than collected, in ' + esc(kerala.years.split("; ").join(", ")) + '.<small>CPCB figures. Both cannot be true.</small></p><a href="#/map/' + encodeURIComponent(kerala.state) + '">Open ' + esc(kerala.state) + ' &rarr;</a></div>' : "") +
      (vol ? '<div class="op-find"><span class="n">' + vol.swing_ratio + '&times;</span><p>' + esc(vol.state) + '\'s reported generated waste is ' + n0(vol.max_tpd) + ' tonnes a day in ' + esc(vol.max_in) + ' and ' + n0(vol.min_tpd) + ' in ' + esc(vol.min_in) + '.<small>The same state, in different reports.</small></p><a href="#/explore/swings">See the swings &rarr;</a></div>' : "") +
      '<div class="op-find"><span class="n">' + diffPairs + '</span><p>state-and-metric pairs where MoHUA and CPCB differ by more than 10%.<small>Different years, so part of the difference may be real change.</small></p><a href="#/map">See them on the map &rarr;</a></div></div></section>' +

      '<section class="op-sec" aria-labelledby="op-t-h"><h2 class="op-h2" id="op-t-h">' + esc(T("try_h", "Heard a number? Check it.")) + '</h2><div class="try"><div class="ask"><input id="op-in" type="text" aria-label="A claim about India\'s waste figures" placeholder="e.g. 81% of India\'s urban waste is processed" autocomplete="off"><button class="go" id="op-go" type="button">' + esc(T("check", "Check")) + '</button></div>' +
      '<div class="ex">' + EXAMPLES.map(function (x, i) { return '<button class="chip" type="button" data-i="' + i + '">' + esc(x) + "</button>"; }).join("") + '</div><div class="res" id="op-res" aria-live="polite"></div></div></section>' +

      '<section class="op-sec" aria-labelledby="op-m-h"><div class="op-method"><div><h2 class="op-h2" id="op-m-h">' + esc(T("method_h", "How we check")) + '</h2></div><div><ol>' +
      '<li><span><strong>Every figure is copied from a published document</strong> and opens on the page it came from, with its number boxed where we could place it.</span></li>' +
      '<li><span><strong>Where sources disagree, we say so.</strong> We compare, we do not pick a winner, and we never accuse a source.</span></li>' +
      '<li><span><strong>Blank means "not reported".</strong> We never fill gaps in or estimate a missing figure.</span></li>' +
      '<li><span><strong>All figures are self-reported</strong> by states, cities and boards. We check consistency, not what is on your street.</span></li></ol></div></div>' +
      '<div class="op-nums"><div><b>' + states + '</b><span>' + esc(T("trust_states", "states and UTs")) + '</span></div><div><b>' + reported + '</b><span>' + esc(T("trust_figs", "reported figures")) + '</span></div><div><b>' + withPage + '</b><span>' + esc(T("trust_pages", "open on a source page")) + '</span></div><div><b>' + KS.flags.length + '</b><span>' + esc(T("trust_flags", "flags: figures that cannot all be true")) + '</span></div></div>' +
      '<p class="op-honest"><strong>What we won\'t do.</strong> We draft complaints and letters, we never send them. The Reality step of the loop, reports from your own street, has No reports yet: it only fills as people tap in their ward. Data built ' + esc(KS.built) + ".</p></section></div>";

    drawMap();
    view.querySelectorAll(".op-layers button").forEach(function (b) { b.onclick = function () { LAYER = b.dataset.l; view.querySelectorAll(".op-layers button").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); drawMap(); }; });
    $("op-sx").onclick = function () {
      startOpen = !startOpen; try { localStorage.setItem("ks-start", startOpen ? "open" : "closed"); } catch (e) {}
      $("op-start").classList.toggle("min", !startOpen); this.setAttribute("aria-expanded", startOpen); this.textContent = startOpen ? T("hide", "Hide") : T("show3", "Show the 3 steps");
    };

    /* reveal: content is visible by default; .pre hides it only while it is about to be revealed, and everything is forced visible after 4 s so a throttled tab never stays blank */
    var targets = [].slice.call(view.querySelectorAll(".dots .g, .op-find, .stamp"));
    if (!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches) && "IntersectionObserver" in root) {
      targets.forEach(function (n) { n.classList.add("pre"); });
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); } }); }, { threshold: .2 });
      targets.forEach(function (n) { io.observe(n); });
      setTimeout(function () { targets.forEach(function (n) { n.classList.remove("pre"); }); }, 4000);
    }
    function check(text) {
      var p = root.KSClaim.parseSentence(KS, text), res = $("op-res");
      if (p.value == null || !p.metric) { res.innerHTML = '<p class="note">We could not find a number in that sentence. Try a figure with % or &ldquo;tonnes per day&rdquo;, or use <a href="#/claim">Check a claim</a>.</p>'; return; }
      var r = root.KSClaim.checkClaim(KS, { metric: p.metric, value: p.value, unit: p.unit, state: p.state || null, year: p.year || null }), V = LBL[r.verdict], pct = r.claim && r.claim.unit === "percent";
      res.innerHTML = '<span class="vrd ' + V[1] + '">' + esc(T(V[2], V[0])) + '</span><p class="vs">' + esc(T(V[3], "")) + "</p>" + (r.records.length ? r.records.slice(0, 6).map(function (x) {
        return '<div class="rec2"><span><span class="' + (x.matches ? "y" : "nn") + '">' + (x.matches ? "&#10003;" : "&#10007;") + "</span> " + esc(x.source_name) + " " + esc(x.year) + (x.kind === "computed" ? " (computed)" : "") + '</span><span>' + (+x.value).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + (pct ? "%" : " t/day") + "</span></div>"; }).join("") +
        '<p class="note"><a href="#/claim">See every source and open the pages</a>. Figures cover ' + Array.from(new Set(r.records.map(function (x) { return x.year; }))).sort().join(", ") + "; part of any difference may be real change.</p>" : '<p class="note">' + esc(r.reason) + "</p>");
    }
    $("op-go").onclick = function () { check($("op-in").value); }; $("op-in").onkeydown = function (e) { if (e.key === "Enter") check(this.value); };
    view.querySelectorAll(".try .chip").forEach(function (b) { b.onclick = function () { $("op-in").value = EXAMPLES[+b.dataset.i]; check($("op-in").value); }; });
  }
  root.KSOpening = { render: render };
})(window);
