/* The lead finding on Home: one concrete case instead of a general gap.
   It is chosen by a rule, not by hand: the state where the newest MoHUA "processed" share and the newest CPCB "treated" share are furthest apart.
   Nothing is typed in: every number comes from KS.waste, and each has a receipt key so the page behind it can be opened.
   It never says which figure is right. Used by opening.js; pure, so the tests can run it in Node. */
(function (root) {
  function newest(rows, src) { var y = null; rows.forEach(function (r) { if (r.source_name === src && (y === null || r.year > y)) y = r.year; }); return y; }
  function side(rows, state, src, year) {
    function get(m) { for (var i = 0; i < rows.length; i++) { var r = rows[i]; if (r.state === state && r.source_name === src && r.year === year && r.metric === m && r.value_tpd != null) return r; } return null; }
    var g = get("generated"), t = get("treated"); if (!g || !t || !(g.value_tpd > 0)) return null;
    return { source: src, year: year, treated: t.value_tpd, generated: g.value_tpd, pct: t.value_tpd / g.value_tpd * 100, doc: t.source_doc, page: t.source_page, key: [state, year, "treated", t.source_doc].join("|") };
  }
  /* every state that has both sides, widest difference first (ties: A to Z) */
  function rank(KS) {
    var rows = KS.waste, my = newest(rows, "MoHUA"), cy = newest(rows, "CPCB"), seen = {}, out = [];
    if (!my || !cy) return out;
    rows.forEach(function (r) {
      if (seen[r.state]) return; seen[r.state] = 1;
      var m = side(rows, r.state, "MoHUA", my), c = side(rows, r.state, "CPCB", cy);
      if (m && c) out.push({ state: r.state, mohua: m, cpcb: c, diff: m.pct - c.pct });
    });
    return out.sort(function (a, b) { return Math.abs(b.diff) - Math.abs(a.diff) || (a.state < b.state ? -1 : 1); });
  }
  function pick(KS) { return rank(KS)[0] || null; }
  function pct(v) { var r = Math.round(v * 10) / 10; return (r === Math.round(r) ? String(Math.round(r)) : r.toFixed(1)) + "%"; }

  var api = { rank: rank, pick: pick, pct: pct };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSLead = api;
})(typeof window !== "undefined" ? window : this);
