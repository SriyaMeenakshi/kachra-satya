/* Readable Ask answers. The agent answers in plain text with data lines such as
     "2019-20: treated 1,837.0 vs collected 880.0 tpd (source: CPCB, rs_q358_2025-02-06.pdf, page 5) <- treated is above collected"
   and "Flags:" lines with rule codes. This turns that text into small cards: a heading, one row per figure with a badge and a source chip, the
   takeaway highlighted, rule codes in plain words, and the sources as chips. It only re-arranges the words the agent returned; it adds no figure.
   format(text, docs) -> HTML string (everything escaped). Pure, so tests/test_answer_format.py runs it in Node. */
(function (root) {
  var DOCNAME = {
    "ls_au50_2025-12-01.pdf": "Lok Sabha Q50", "rs_q358_2025-02-06.pdf": "Rajya Sabha Q358", "mohua_81pct_answer.pdf": "Rajya Sabha Q2433 (MoHUA)",
    "mohua_state_answer.pdf": "Rajya Sabha Q855 (MoHUA)", "cpcb_2021-22.pdf": "CPCB report 2021-22", "cpcb_2022-23.pdf": "CPCB report 2022-23",
    "cpcb_2023-24.pdf": "CPCB report 2023-24", "cpcb_2024-25.pdf": "CPCB report 2024-25", "ls_au3198_2023-12-21.docx": "Lok Sabha Q3198", "ls_au682_2024-11-28.docx": "Lok Sabha Q682", "mohua_annual_report_2025-26.pdf": "MoHUA Annual Report 2025-26", "sbm_gfc2022_dashboard_snapshot.txt": "SBM-U Garbage Free Cities 2022 dashboard"
  };
  var RULE = {
    "3_sources_differ_gt_10pct": "The two sources differ by more than 10%", "4_metric_missing": "A figure is not reported",
    "6_treated_gt_collected": "More waste is treated than collected", "1_treated_plus_landfilled_gt_generated": "Treated plus landfilled is more than generated",
    "2_collected_gt_generated": "More waste is collected than generated", "5_national_vs_state_sum": "The national total does not equal the sum of the states"
  };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function name(doc) { return DOCNAME[doc] || doc; }
  function inline(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"); }
  function cap(s) { s = String(s || "").trim(); return s.charAt(0).toUpperCase() + s.slice(1); }

  var SRC = /\s*\((?:source:\s*)?(?:[A-Za-z]+,\s*)?([\w.\-]+\.(?:pdf|docx)),\s*(?:page|p\.)\s*(\d+)\)/;
  var ARROW = /\s*<-\s*(.+)$/;
  var ROW = /^(?:[-*•]\s+|\d{4}-\d{2}\b|[A-Z][A-Za-z .&']+:\s.*\bgap\b)/;

  function row(line) {
    var s = line.replace(/^[-*•]\s+/, ""), badge = "", chip = "", m = ARROW.exec(s);
    if (m) { badge = cap(m[1]); s = s.replace(ARROW, ""); }
    var sm = SRC.exec(s);
    if (sm) { chip = '<span class="ans-src">' + esc(name(sm[1])) + ", p." + esc(sm[2]) + "</span>"; s = s.replace(SRC, ""); }
    return '<li><span class="ans-t">' + inline(s) + "</span>" + (badge ? '<span class="ans-badge">' + esc(badge) + "</span>" : "") + chip + "</li>";
  }
  function flag(line) {
    var m = /^(\S+)\s+(\d_[a-z0-9_]+):\s*(.*)$/.exec(line.trim()), w = m ? (RULE[m[2]] || m[2].replace(/_/g, " ")) : line;
    return "<li><span class=\"ans-t\">" + (m ? "<strong>" + esc(m[1]) + "</strong> " : "") + esc(w) + (m && m[3] ? '<span class="ans-fine"> (' + esc(m[3].replace(/;\s*source=.*$/, "").replace(/=/g, " ").replace(/;/g, ",")) + ")</span>" : "") + "</span></li>";
  }

  function format(text, docs) {
    var lines = String(text == null ? "" : text).split(/\r?\n/), out = [], rows = [], flags = [], mode = "", srcLines = [];
    function flushRows() { if (rows.length) { out.push('<ul class="ans-rows">' + rows.join("") + "</ul>"); rows = []; } }
    lines.forEach(function (raw) {
      var line = raw.trim(); if (!line) { flushRows(); return; }
      if (/^flags:?$/i.test(line)) { flushRows(); mode = "flags"; return; }
      if (/^sources?:?$/i.test(line)) { flushRows(); mode = "src"; return; }
      var sm = /^sources?:\s*(.+)$/i.exec(line);
      if (sm) { flushRows(); mode = "src"; srcLines.push(sm[1]); return; }
      if (mode === "flags") { flags.push(flag(line)); return; }
      if (mode === "src") { srcLines.push(line); return; }
      if (ROW.test(line) || SRC.test(line)) { rows.push(row(line)); return; }
      flushRows();
      if (/:$/.test(line) && line.length < 100) { out.push('<h4 class="ans-h">' + inline(line.replace(/:$/, "").replace(/\s*\((?:from tools|tool data)\)/i, "")) + "</h4>"); return; }
      var key = /cannot be true|sources disagree|do not match|does not say which/i.test(line);
      out.push('<p' + (key ? ' class="ans-key"' : "") + ">" + inline(line) + "</p>");
    });
    flushRows();
    if (flags.length) out.push('<details class="ans-more"><summary>Why these were flagged (' + flags.length + ")</summary><ul class=\"ans-rows plain\">" + flags.join("") + "</ul></details>");
    var seen = {}, chips = [];
    (docs || []).forEach(function (d) { if (d && !seen[d]) { seen[d] = 1; chips.push('<span class="ans-src">' + esc(name(d)) + "</span>"); } });
    srcLines.forEach(function (l) { (String(l).match(/[\w.\-]+\.(?:pdf|docx)/g) || []).forEach(function (d) { if (!seen[d]) { seen[d] = 1; chips.push('<span class="ans-src">' + esc(name(d)) + "</span>"); } }); });
    if (chips.length) out.push('<div class="ans-srcs"><span class="ans-l">Sources</span>' + chips.join("") + "</div>");
    return out.join("");
  }

  var api = { format: format, docName: name };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSAnswer = api;
})(typeof window !== "undefined" ? window : this);
