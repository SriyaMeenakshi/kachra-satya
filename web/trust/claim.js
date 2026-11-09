/* Claim Checker logic, a port of scripts/claim_checker.py (tests/test_web_parity.py checks they agree).
   checkClaim(KS, {metric, value, unit, state, year}) -> {verdict, reason, claim, tolerance, records[]}
   Verdicts: SUPPORTED | CONTRADICTED | SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS | CANNOT_VERIFY */
(function (root) {
  var PCT_TOL = 1.0, TPD_TOL_PCT = 1.0;
  var METRICS = ["generated", "collected", "treated", "landfilled", "processed_pct"];

  function r2(x) { return Math.round(x * 100) / 100; }

  function computedPct(rows, valueKey, scope) {
    var groups = {}, out = [];
    rows.forEach(function (r) {
      var k = [r.year, r.source_name, r.source_doc, r.source_page].join("\u0001");
      (groups[k] = groups[k] || { r: r, m: {} }).m[r.metric] = r[valueKey];
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], t = g.m.treated, ge = g.m.generated;
      if (t != null && ge != null && ge) {
        out.push({ scope: scope, year: g.r.year, source_name: g.r.source_name, source_doc: g.r.source_doc,
                   source_page: g.r.source_page, kind: "computed", value: r2(t / ge * 100),
                   note: "treated " + t + " / generated " + ge });
      }
    });
    return out;
  }

  function records(KS, metric, state, year) {
    var out = [], s = (state || "").trim().toLowerCase();
    var nat = !s || s === "india" || s === "national" || s === "country";
    if (nat) {
      var nn = KS.national.filter(function (r) { return r.state === "India" && (!year || r.year === year); });
      nn.filter(function (r) { return r.metric === metric && r.value != null; }).forEach(function (r) {
        out.push({ scope: "India", year: r.year, source_name: r.source_name, source_doc: r.source_doc,
                   source_page: r.source_page, kind: "stated", value: +r.value, note: r.note || "" });
      });
      if (metric === "processed_pct") out = out.concat(computedPct(nn, "value", "India"));
    } else {
      var ww = KS.waste.filter(function (r) { return r.state.toLowerCase() === s && (!year || r.year === year); });
      if (metric === "processed_pct") out = computedPct(ww.filter(function (r) { return r.value_tpd != null; }), "value_tpd", state);
      else ww.filter(function (r) { return r.metric === metric && r.value_tpd != null; }).forEach(function (r) {
        out.push({ scope: state, year: r.year, source_name: r.source_name, source_doc: r.source_doc,
                   source_page: r.source_page, kind: "stated", value: +r.value_tpd, note: r.note || "" });
      });
    }
    return out;
  }

  function checkClaim(KS, a) {
    var metric = (a.metric || "").trim().toLowerCase(), value = +a.value, unit = a.unit || null;
    if (METRICS.indexOf(metric) < 0) return { verdict: "CANNOT_VERIFY", reason: "unknown metric '" + metric + "'", records: [] };
    if (!unit) unit = metric === "processed_pct" ? "percent" : "tpd";
    if ((metric === "processed_pct") !== (unit === "percent"))
      return { verdict: "CANNOT_VERIFY", reason: "unit does not fit the metric: processed_pct is a percent, the others are tpd", records: [] };
    var recs = records(KS, metric, a.state, a.year);
    var claim = { metric: metric, value: value, unit: unit, state: a.state || "India", year: a.year || null };
    if (!recs.length) return { verdict: "CANNOT_VERIFY", reason: "not reported: no figure for this metric, place and year in the dataset", claim: claim, records: [] };
    recs.forEach(function (r) {
      var gap = Math.abs(r.value - value);
      r.difference = unit === "percent" ? r2(gap) : (r.value ? r2(gap / r.value * 100) : null);
      r.matches = r.difference != null && r.difference <= (unit === "percent" ? PCT_TOL : TPD_TOL_PCT);
    });
    var m = recs.filter(function (r) { return r.matches; }), x = recs.filter(function (r) { return !r.matches; });
    var verdict = m.length && !x.length ? "SUPPORTED" : x.length && !m.length ? "CONTRADICTED" : "SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS";
    var years = Array.from(new Set(recs.map(function (r) { return r.year; }))).sort();
    var reason = { SUPPORTED: "every comparable figure in the dataset agrees with the claim",
                   CONTRADICTED: "comparable figures exist but none agree with the claim",
                   SUPPORTED_BY_SOME_CONTRADICTED_BY_OTHERS: "some sources agree with the claim and others do not; the sources disagree with each other" }[verdict];
    if (years.length > 1) reason += ". The figures cover different years (" + years.join(", ") + "), so part of any difference may be real change.";
    recs.sort(function (p, q) { return (p.matches === q.matches ? 0 : p.matches ? -1 : 1) || (p.year < q.year ? -1 : p.year > q.year ? 1 : 0); });
    return { verdict: verdict, reason: reason, claim: claim,
             tolerance: unit === "percent" ? PCT_TOL + " percentage points" : TPD_TOL_PCT + "% of the figure", records: recs };
  }

  /* Best-effort reading of a pasted sentence into form fields. Always shown to the user so they can correct it. */
  function parseSentence(KS, text) {
    var t = text || "", low = t.toLowerCase(), out = { metric: null, value: null, unit: null, state: "", year: "" };
    var pct = t.match(/(\d+(?:\.\d+)?)\s*(?:%|per\s*cent|percent)/i);
    var num = t.match(/(\d{1,3}(?:,\d{2,3})+|\d+(?:\.\d+)?)\s*(?:tonnes?|tpd|tons?|t\/d|tonnes per day)/i);
    if (pct) { out.value = parseFloat(pct[1]); out.unit = "percent"; out.metric = "processed_pct"; }
    else if (num) { out.value = parseFloat(num[1].replace(/,/g, "")); out.unit = "tpd"; }
    if (out.unit === "tpd" || !out.metric) {
      if (/landfill/.test(low)) out.metric = "landfilled";
      else if (/collect/.test(low)) out.metric = "collected";
      else if (/generat|produc/.test(low)) out.metric = "generated";
      else if (/treat|process/.test(low)) out.metric = out.unit === "percent" ? "processed_pct" : "treated";
    }
    var y = t.match(/(20\d\d)\s*[-–/]\s*(\d\d)/);
    if (y) out.year = y[1] + "-" + y[2];
    var names = Array.from(new Set(KS.waste.map(function (r) { return r.state; })));
    names.sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < names.length; i++) if (low.indexOf(names[i].toLowerCase()) >= 0) { out.state = names[i]; break; }
    return out;
  }

  var api = { checkClaim: checkClaim, parseSentence: parseSentence, records: records };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSClaim = api;
})(typeof window !== "undefined" ? window : this);
