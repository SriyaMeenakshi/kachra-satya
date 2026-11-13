/* The ward case file: one page that joins what a resident already has on this site.
   What happened (their own truck record), who else says so (the ward's shared total, if sharing is on), what was done (complaints in their log),
   what the official figures say (with the document and page), and what is asked. It is for a councillor, a ward officer or a reporter.
   Rules: nothing is invented. A part with no data says so in plain words. Every line about residents is labelled unverified.
   build() is pure (the tests run it in Node); the ward page (ward.js) gathers the inputs and shows the result. */
(function (root) {
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function d(s, long) { var x = new Date(s + "T00:00:00"); return isNaN(x) ? String(s) : x.toLocaleDateString("en-IN", long ? { day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short" }); }
  function pl(n, one, many) { return n + " " + (n === 1 ? one : many); }

  /* o: { ward: {state, city, ward}, today, own: { window, days: [{date, status}] }, shared: { reporters, collected, notCollected, contested } | null,
          complaints: [{ filed, ticket, issue, status, city }], official: { pct, doc, page } | null, url }
     returns { title, place, sections: [{ h, lines: [..] }], foot, text } */
  function build(o) {
    var w = o.ward, days = (o.own && o.own.days) || [], win = (o.own && o.own.window) || 30;
    var came = days.filter(function (x) { return x.status === "collected"; }), missed = days.filter(function (x) { return x.status === "not_collected"; }), n = came.length + missed.length;
    var S = [];

    var a = [];
    if (!n) a.push("No days are recorded for this ward on this device yet. Tap whether the truck came for a few days first.");
    else {
      a.push("In the last " + win + " days I recorded the garbage truck on " + pl(n, "day", "days") + ": it came on " + came.length + " and did not come on " + missed.length + ".");
      if (missed.length) a.push("Days it did not come: " + missed.map(function (x) { return d(x.date); }).join(", ") + ".");
      a.push("Days with no record are unknown. They are not counted as missed.");
    }
    S.push({ h: "What happened", lines: a });

    var b = [], sh = o.shared;
    if (sh && sh.reporters > 0) {
      b.push(pl(sh.reporters, "signed-in resident has", "signed-in residents have") + " reported on this ward in the last 30 days: " + pl(sh.collected, "report", "reports") + " that the truck came and " + sh.notCollected + " that it did not.");
      if (sh.contested) b.push("On " + pl(sh.contested, "day", "days") + " residents disagreed; both counts are kept.");
      b.push("One report per person per day. These are counts of reports, not a measurement.");
    } else b.push(n ? "No one else has shared a report for this ward yet, so this is one resident's record." : "No one has shared a report for this ward yet.");
    S.push({ h: "Who else says so", lines: b });

    var c = [], cs = (o.complaints || []).filter(function (r) { return r && String(r.city || "").trim().toLowerCase() === String(w.city).trim().toLowerCase(); });
    if (!cs.length) c.push("No complaint for " + w.city + " is saved in my log yet.");
    cs.slice(0, 5).forEach(function (r) { c.push("Complaint filed on " + d(r.filed, true) + (r.ticket ? ", number " + r.ticket : ", number not yet noted") + " (" + (r.status || "Open") + "): " + (r.issue || "garbage problem") + "."); });
    S.push({ h: "What was done", lines: c });

    var e = [], of = o.official;
    if (of) { e.push("For " + w.state + ", the official figures give " + of.pct + "% of the waste generated as collected (CPCB 2023-24; " + of.doc + ", page " + of.page + "; the share is worked out from two printed figures)."); e.push("That figure describes the whole state, not this ward. It is here to show what is officially reported, not to score the ward against it."); }
    else e.push("No collected and generated figures are reported for " + w.state + " in the documents we hold.");
    S.push({ h: "What the official figures say", lines: e });

    var f = missed.length ? ["A written reply on why collection was missed on the days listed, and the date from which daily collection will be regular."] : ["A written confirmation of the collection days and times for this ward."];
    if (cs.length && cs[0].ticket) f.push("An update on complaint number " + cs[0].ticket + ".");
    S.push({ h: "What is asked", lines: f });

    var out = { title: "Ward case file", place: w.ward + ", " + w.city + ", " + w.state, prepared: "Prepared on " + d(o.today, true) + ".", sections: S,
      foot: "The resident records here are unverified: they are taps made by residents, not an official finding. The official figure opens on its source page" + (o.url ? ": " + o.url : "."), ready: n > 0 };
    out.text = [out.title.toUpperCase(), out.place, out.prepared, ""].concat(S.map(function (s, i) { return (i + 1) + ". " + s.h + "\n" + s.lines.join("\n") + "\n"; })).concat([out.foot]).join("\n");
    return out;
  }

  function html(cf) {
    return '<div class="cf" id="cf-sheet"><p class="cf-k">' + esc(cf.title) + '</p><h4 class="cf-p">' + esc(cf.place) + '</h4><p class="cf-d">' + esc(cf.prepared) + "</p>" +
      cf.sections.map(function (s, i) { return '<div class="cf-s"><h5><span aria-hidden="true">' + (i + 1) + "</span>" + esc(s.h) + "</h5>" + s.lines.map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") + "</div>"; }).join("") +
      '<p class="cf-f">' + esc(cf.foot) + "</p></div>";
  }

  var api = { build: build, html: html };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSCase = api;
})(typeof window !== "undefined" ? window : this);
