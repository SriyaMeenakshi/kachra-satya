/* Insights for a first-time reader: an overview of six plain questions, and one simple chart per tab.
   Every number is worked out from window.KS (nothing typed in), and the tables with every row and source page stay on each tab, folded closed.
   The charts are plain HTML (no library): each row carries its figures as text, so a screen reader gets the same content as the picture.
   Nothing here says which source is right. Pure string builders, so the tests can run them in Node. Used by app.js. */
(function (root) {
  var Lead = root.KSLead || (typeof require !== "undefined" ? require("./lead.js") : null);
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function n0(v) { return v == null ? "not reported" : Math.round(v).toLocaleString("en-IN"); }
  function p1(v) { return Lead.pct(v); }
  function mapLink(s) { return '<a href="#/map/' + encodeURIComponent(s) + '">' + esc(s) + "</a>"; }
  function T(k, fb, v) { if (root.KSi18n) return root.KSi18n.t(k, fb, v); var s = fb; if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); }); return s; }
  function newest(rows, f) { var y = null; rows.forEach(function (r) { if (f(r) && (y === null || r.year > y)) y = r.year; }); return y; }
  function natv(KS, src, y, m) { var r = KS.national.filter(function (x) { return x.state === "India" && x.source_name === src && x.year === y && x.metric === m && x.value != null; })[0]; return r || null; }

  /* ---------- the figures behind the answers ---------- */
  var FAR = 10;      /* percentage points: the same threshold as flag rule 3 */
  function shares(KS) { return Lead.rank(KS); }
  function farApart(KS) { return shares(KS).filter(function (r) { return Math.abs(r.diff) > FAR; }).length; }
  function money(KS) {
    var a = 0, u = 0; KS.money.forEach(function (m) { a += m.allocation_swm || 0; u += m.funds_swm || 0; });
    var rows = KS.money.filter(function (m) { return m.swm_utilisation_pct != null; }).sort(function (x, y) { return x.swm_utilisation_pct - y.swm_utilisation_pct || (x.state < y.state ? -1 : 1); });
    return { pct: a ? u / a * 100 : null, rows: rows };
  }
  function uncollected(KS) {
    var y = newest(KS.national, function (r) { return r.source_name === "CPCB" && r.metric === "collected" && r.value != null; }), g = y && natv(KS, "CPCB", y, "generated"), c = y && natv(KS, "CPCB", y, "collected");
    var rows = KS.trucks.filter(function (r) { return r.uncollected_tpd != null; }).sort(function (a, b) { return b.uncollected_tpd - a.uncollected_tpd || (a.state < b.state ? -1 : 1); });
    return { year: y, tpd: g && c ? g.value - c.value : null, generated: g ? g.value : null, rows: rows, all: rows.filter(function (r) { return r.uncollected_tpd === 0; }).length };
  }
  function landfill(KS) {
    var y = newest(KS.national, function (r) { return r.source_name === "CPCB" && r.metric === "landfilled" && r.value != null; }), g = y && natv(KS, "CPCB", y, "generated"), l = y && natv(KS, "CPCB", y, "landfilled");
    var t = (KS.dumpsite_total || []).filter(function (r) { return r.metric === "dumpsites"; })[0], w = (KS.dumpsite_total || []).filter(function (r) { return r.metric === "legacy_waste_tonnes"; })[0], by = {};
    (KS.dumpsites || []).forEach(function (r) { if (!r.ulb) return; var o = by[r.state] = by[r.state] || { state: r.state, sites: 0, legacy: 0 }; o.sites += r.dumpsites || 0; o.legacy += r.legacy_waste_tonnes || 0; });
    var st = Object.keys(by).map(function (k) { return by[k]; }).sort(function (a, b) { return b.legacy - a.legacy || (a.state < b.state ? -1 : 1); });
    return { year: y, tpd: l ? l.value : null, pct: g && l ? l.value / g.value * 100 : null, printed: t ? t.printed_grand_total : null, itemised: t ? t.sum_of_printed_rows : null, missing: t ? t.not_itemised : null, tonnes: w || null, states: st };
  }
  function separate(KS) {
    var d = KS.segregation.filter(function (r) { return r.indicator.indexOf("D2D") >= 0; })[0], s = KS.segregation.filter(function (r) { return r.indicator.indexOf("Source Segregation") >= 0; })[0];
    return d && s ? { d2d: d.share_pct_computed, seg: s.share_pct_computed, year: s.year } : null;
  }
  /* the 17 core figures per state, one cell each: the same list scripts/completeness.py uses */
  function cells(KS) {
    var cy = Array.from(new Set(KS.waste.filter(function (r) { return r.source_name === "CPCB"; }).map(function (r) { return r.year; }))).sort(), my = newest(KS.waste, function (r) { return r.source_name === "MoHUA"; }), cols = [], has = {};
    cy.forEach(function (y) { ["generated", "collected", "treated"].forEach(function (m) { cols.push({ src: "CPCB", year: y, metric: m }); }); });
    ["generated", "treated"].forEach(function (m) { cols.push({ src: "MoHUA", year: my, metric: m }); });
    KS.waste.forEach(function (r) { if (r.value_tpd != null) has[[r.state, r.source_name, r.year, r.metric].join("|")] = 1; });
    return { cols: cols, rows: KS.completeness.map(function (c) { var on = cols.map(function (k) { return !!has[[c.state, k.src, k.year, k.metric].join("|")]; }); return { state: c.state, on: on, n: on.filter(Boolean).length }; }) };
  }
  function unreported(KS) { var C = KS.completeness, full = C.filter(function (r) { return r.completeness_pct === 100; }).length; return { full: full, gaps: C.length - full, total: C.length }; }

  /* ---------- the overview: six questions, then four ways to check the sources ---------- */
  function overview(KS) {
    var R = shares(KS), M = money(KS), U = uncollected(KS), L = landfill(KS), S = separate(KS), C = unreported(KS), out = [];
    out.push({ id: "phantom", href: "#/gaps/phantom", q: "Do the two official numbers agree?", big: farApart(KS) + " of " + R.length, line: "states and UTs where the newest MoHUA share and the newest CPCB share are more than " + FAR + " points apart.", vars: { n: FAR } });
    if (M.pct != null) out.push({ id: "money", href: "#/gaps/money", q: "Is the money being used?", big: Math.round(M.pct) + "%", line: "of the solid-waste money set aside for states for 2021 to 2026 had been used by 25 Nov 2024." });
    if (U.tpd != null) out.push({ id: "trucks", href: "#/gaps/trucks", q: "What goes uncollected?", big: n0(U.tpd), line: "tonnes a day reported generated but not collected, CPCB " + U.year + " (our subtraction of two printed totals).", vars: { y: U.year } });
    if (L.printed != null) out.push({ id: "landfill", href: "#/gaps/landfill", q: "What ends up dumped?", big: n0(L.printed), line: "priority legacy dumpsites in MoHUA's list. Its tables itemise " + n0(L.itemised) + " of them.", vars: { n: n0(L.itemised) } });
    if (S) out.push({ id: "segregation", href: "#/gaps/segregation", q: "Is waste kept separate?", big: Math.round(S.seg) + "%", line: "of wards keep over 90% of their waste separated at source, though " + Math.round(S.d2d) + "% have door-to-door collection (" + S.year + ").", vars: { d: Math.round(S.d2d), y: S.year } });
    out.push({ id: "complete", href: "#/gaps/complete", q: "What goes unreported?", big: C.gaps + " of " + C.total, line: "states and UTs leave at least one of 17 core figures blank." });
    return out;
  }
  function tools(KS) {
    var a = KS.audit.slice().sort(function (x, y) { return x.rank - y.rank; })[0], v = KS.volatility.filter(function (r) { return r.ranked === "yes"; }).sort(function (x, y) { return x.rank - y.rank; })[0];
    var pages = Object.keys(KS.receipts).filter(function (k) { return KS.receipts[k].image; }).length;
    return [
      { id: "audit", href: "#/explore/audit", q: "Where to look first", line: a ? "A ranking of where an audit would learn most. It starts with " + a.state + "." : "A ranking of where an audit would learn most.", vars: { s: a ? a.state : "" } },
      { id: "receipts", href: "#/explore/receipts", q: "Every source page", line: n0(pages) + " figures open on the page they were copied from.", vars: { n: n0(pages) } },
      { id: "swings", href: "#/explore/swings", q: "Figures that jump", line: v ? v.state + " is reported at " + n0(v.min_tpd) + " and at " + n0(v.max_tpd) + " tonnes a day, depending on the report." : "How far a state's own figure moves between reports.", vars: v ? { s: v.state, a: n0(v.min_tpd), b: n0(v.max_tpd) } : null },
      { id: "defs", href: "#/explore/defs", q: "What the words mean", line: "Processed, treated, collected, landfilled: plain meanings, and how each source defines them." }
    ];
  }
  function overviewHTML(KS) {
    return '<ol class="ins-cards">' + overview(KS).map(function (c) {
      var of = /^(\d+) of (\d+)$/.exec(c.big), big = of ? T("ins_of", "{a} of {b}", { a: of[1], b: of[2] }) : c.big;
      return '<li><a class="ins-card" href="' + c.href + '"><span class="ins-cq">' + esc(T("ins_q_" + c.id, c.q)) + '</span><span class="ins-cb">' + esc(big) + '</span><span class="ins-cl">' + esc(T("ins_l_" + c.id, c.line, c.vars)) + '</span><span class="ins-cgo">' + esc(T("ins_see", "See the chart")) + ' &rarr;</span></a></li>';
    }).join("") + '</ol><h3>' + esc(T("ins_tools_h", "Check the sources yourself")) + '</h3><ul class="ins-tools">' + tools(KS).map(function (t) {
      return '<li><a href="' + t.href + '"><b>' + esc(T("tab_" + t.id, t.q)) + "</b><span>" + esc(T("tool_" + t.id + "_l", t.line, t.vars)) + "</span></a></li>";
    }).join("") + "</ul>";
  }

  /* ---------- the pieces each tab uses ---------- */
  /* the question and its short answer; a is trusted HTML built by the caller from escaped parts */
  function lead(q, a) { return '<div class="ins-lead"><p class="ins-q">' + esc(q) + '</p><p class="ins-a">' + a + "</p></div>"; }
  function fold(title, inner) { return '<details class="ins-fold"><summary>' + title + '</summary><div class="ins-fold-b">' + inner + "</div></details>"; }
  function clamp(v) { return Math.max(0, Math.min(100, v)); }
  /* two dots per state on one 0 to 100% line: CPCB treated (ring) and MoHUA processed (filled) */
  function dumbbell(rows) {
    if (!rows.length) return "";
    var m = rows[0].mohua, c = rows[0].cpcb;
    return '<div class="viz"><p class="viz-leg"><span><i class="vd c"></i>CPCB treated, ' + esc(c.year) + '</span><span><i class="vd m"></i>MoHUA processed, ' + esc(m.year) + '</span></p><ul class="dumb">' + rows.map(function (r) {
      var a = clamp(r.cpcb.pct), b = clamp(r.mohua.pct), lo = Math.min(a, b), hi = Math.max(a, b);
      return '<li><span class="vn">' + mapLink(r.state) + '</span><span class="dumb-t" aria-hidden="true"><i class="dumb-l" style="left:' + lo.toFixed(1) + "%;width:" + (hi - lo).toFixed(1) + '%"></i><i class="vd c" style="left:' + a.toFixed(1) + '%"></i><i class="vd m" style="left:' + b.toFixed(1) + '%"></i></span><span class="vv">' + p1(r.cpcb.pct) + " and " + p1(r.mohua.pct) + "</span></li>";
    }).join("") + '</ul><p class="viz-ax" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></p></div>';
  }
  /* one bar per row. items: { label, href, value, text } */
  function hbar(items, cls) {
    var mx = Math.max.apply(null, items.map(function (x) { return x.value || 0; })) || 1;
    return '<ul class="viz hbar' + (cls ? " " + cls : "") + '">' + items.map(function (x) {
      return '<li><span class="vn">' + (x.href ? '<a href="' + x.href + '">' + esc(x.label) + "</a>" : esc(x.label)) + '</span><span class="hb-t" aria-hidden="true"><i style="width:' + Math.max(1, (x.value || 0) / mx * 100).toFixed(1) + '%"></i></span><span class="vv">' + esc(x.text) + "</span></li>";
    }).join("") + "</ul>";
  }
  /* one bar split in two parts */
  function split(a, b, la, lb) {
    var t = a + b || 1, w = a / t * 100;
    return '<div class="viz split"><div class="split-t" aria-hidden="true"><i class="a" style="width:' + w.toFixed(1) + '%"></i><i class="b" style="width:' + (100 - w).toFixed(1) + '%"></i></div><p class="viz-leg"><span><i class="sq a"></i>' + la + '</span><span><i class="sq b"></i>' + lb + "</span></p></div>";
  }
  /* one square per core figure, for the states with a blank */
  function grid(G) {
    var rows = G.rows.filter(function (r) { return r.n < G.cols.length; }).sort(function (a, b) { return a.n - b.n || (a.state < b.state ? -1 : 1); });
    if (!rows.length) return "";
    var groups = []; G.cols.forEach(function (c, i) { var k = c.src + " " + c.year; if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k: k, idx: [] }); groups[groups.length - 1].idx.push(i); });
    return '<div class="viz"><p class="viz-leg"><span><i class="sq on"></i>reported</span><span><i class="sq off"></i>not reported</span><span>Each group is one report: ' + groups.map(function (g) { return esc(g.k); }).join(", ") + '.</span></p><ul class="cgrid">' + rows.map(function (r) {
      var miss = G.cols.filter(function (c, i) { return !r.on[i]; }).map(function (c) { return c.src + " " + c.year + " " + c.metric; });
      return '<li><span class="vn">' + mapLink(r.state) + '</span><span class="cg-t" aria-hidden="true">' + groups.map(function (g) { return '<span class="cg-g">' + g.idx.map(function (i) { return '<i class="sq ' + (r.on[i] ? "on" : "off") + '" title="' + esc(G.cols[i].src + " " + G.cols[i].year + " " + G.cols[i].metric + (r.on[i] ? "" : ": not reported")) + '"></i>'; }).join("") + "</span>"; }).join("") +
        '</span><span class="vv">' + r.n + " of " + G.cols.length + '<span class="vh">. Not reported: ' + esc(miss.join("; ")) + "</span></span></li>";
    }).join("") + "</ul></div>";
  }

  var api = { FAR: FAR, shares: shares, farApart: farApart, money: money, uncollected: uncollected, landfill: landfill, separate: separate, cells: cells, unreported: unreported, overview: overview, tools: tools, overviewHTML: overviewHTML, lead: lead, fold: fold, dumbbell: dumbbell, hbar: hbar, split: split, grid: grid, n0: n0, p1: p1 };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSInsights = api;
})(typeof window !== "undefined" ? window : this);
