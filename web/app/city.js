/* Audit Your City: browser port of scripts/audit_city.py (tests/test_web_parity.py checks both give the same flags and ranking).
   Blank or non-numeric cells mean "not reported" and are never filled in. All work happens in the browser; nothing is uploaded. */
(function (root) {
  var NUM = ["generated_tpd", "collected_tpd", "segregated_tpd", "treated_tpd", "landfilled_tpd"];
  var TOL = 0.05;

  function g(x) { return String(parseFloat(Number(x).toPrecision(6))); }   /* Python's {:g} */
  function r3(x) { return Math.round(x * 1000) / 1000; }

  /* Minimal RFC 4180 CSV reader (quoted fields, doubled quotes, CRLF). Returns array of objects keyed by header. */
  function parseCSV(text) {
    var rows = [], row = [], f = "", q = false, i = 0, c;
    text = String(text).replace(/^﻿/, "");
    for (; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(f); f = ""; rows.push(row); row = []; }
      else f += c;
    }
    if (f !== "" || row.length) { row.push(f); rows.push(row); }
    rows = rows.filter(function (r) { return r.some(function (x) { return x.trim() !== ""; }); });
    if (!rows.length) return { columns: [], data: [] };
    var cols = rows[0].map(function (h) { return h.trim(); });
    return { columns: cols, data: rows.slice(1).map(function (r) { var o = {}; cols.forEach(function (h, k) { o[h] = r[k] == null ? "" : r[k]; }); return o; }) };
  }

  function num(v) { var s = String(v == null ? "" : v).trim(); if (s === "") return null; var n = Number(s.replace(/,/g, "")); return isFinite(n) ? n : null; }
  function flag(r, rule, values, why) { return { ulb: r.ulb, ward: r.ward, period: r.period, rule: rule, values: values, explanation: why }; }
  function has(r) { for (var i = 1; i < arguments.length; i++) if (r[arguments[i]] == null) return false; return true; }

  function audit(parsed) {
    var need = ["ulb", "ward", "period"].concat(NUM), miss = need.filter(function (c) { return parsed.columns.indexOf(c) < 0; });
    if (miss.length) throw new Error("missing columns: " + miss.join(", ") + ". Use the template.");
    var d = parsed.data.map(function (r) {
      var o = { ulb: (r.ulb || "").trim(), ward: (r.ward || "").trim(), period: (r.period || "").trim(), notes: r.notes || "" };
      NUM.forEach(function (c) { o[c] = num(r[c]); }); return o;
    });
    var f = [];
    d.forEach(function (r) {
      if (has(r, "collected_tpd", "generated_tpd") && r.collected_tpd > r.generated_tpd + TOL)
        f.push(flag(r, "C1_collected_gt_generated", "collected=" + g(r.collected_tpd) + "; generated=" + g(r.generated_tpd), "More waste is reported collected than generated."));
    });
    d.forEach(function (r) {
      if (has(r, "segregated_tpd", "collected_tpd") && r.segregated_tpd > r.collected_tpd + TOL)
        f.push(flag(r, "C2_segregated_gt_collected", "segregated=" + g(r.segregated_tpd) + "; collected=" + g(r.collected_tpd), "More waste is reported segregated than collected."));
    });
    d.forEach(function (r) {
      if (has(r, "treated_tpd", "collected_tpd") && r.treated_tpd > r.collected_tpd + TOL)
        f.push(flag(r, "C3_treated_gt_collected", "treated=" + g(r.treated_tpd) + "; collected=" + g(r.collected_tpd), "More waste is reported treated than collected. Either collection is under-reported or treatment is over-reported."));
    });
    d.forEach(function (r) {
      if (has(r, "treated_tpd", "landfilled_tpd", "generated_tpd") && r.treated_tpd + r.landfilled_tpd > r.generated_tpd + TOL)
        f.push(flag(r, "C4_treated_plus_landfilled_gt_generated", "treated=" + g(r.treated_tpd) + "; landfilled=" + g(r.landfilled_tpd) + "; generated=" + g(r.generated_tpd), "Treated plus landfilled is more than generated, so some waste is counted twice."));
    });
    var groups = {}, order = [];
    d.forEach(function (r) { var k = r.ulb + "\u0001" + r.ward; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(r); });
    order.forEach(function (k) {
      var rows = groups[k];
      NUM.forEach(function (m) {
        var have = rows.filter(function (r) { return r[m] != null; });
        if (!have.length) return;
        var list = have.map(function (r) { return r.period; }).sort().join(", ");
        rows.filter(function (r) { return r[m] == null; }).forEach(function (r) {
          f.push(flag(r, "C5_metric_missing", m + " blank in " + r.period + "; reported in " + list, m + " is not reported for this period although the same ward reports it in other periods."));
        });
      });
    });
    var rk = order.map(function (k) {
      var u = groups[k].filter(function (r) { return has(r, "generated_tpd", "collected_tpd"); }).map(function (r) { return r3(r.generated_tpd - r.collected_tpd); }).filter(function (x) { return x >= 0; });
      if (!u.length) return null;
      var per = {}; groups[k].forEach(function (r) { if (has(r, "generated_tpd", "collected_tpd") && r3(r.generated_tpd - r.collected_tpd) >= 0) per[r.period] = 1; });
      return { ulb: groups[k][0].ulb, ward: groups[k][0].ward, periods: Object.keys(per).length,
               uncollected_tpd_avg: r3(u.reduce(function (a, b) { return a + b; }, 0) / u.length), uncollected_tpd_max: Math.max.apply(null, u) };
    }).filter(Boolean).sort(function (a, b) { return b.uncollected_tpd_avg - a.uncollected_tpd_avg; });
    rk.forEach(function (r, i) { r.rank = i + 1; });
    return { flags: f, ranking: rk, rows: d.length };
  }

  var api = { parseCSV: parseCSV, audit: audit };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSCity = api;
})(typeof window !== "undefined" ? window : this);
