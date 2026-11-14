/* The receipt a person can take away: a link that reopens a checked claim, and the same result as plain text for a message.
   The link carries only the sentence that was checked (route #/claim/<sentence>); the page checks it again against the data it holds, so a link can never carry a made-up verdict.
   Pure functions, so the tests can run them in Node. Used by the Check a claim page (app.js). */
(function (root) {
  var MAX = 300;      /* longest sentence a link may carry */
  function clean(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, MAX); }
  /* base is the page address without its hash */
  function link(base, sentence) { var s = clean(sentence); return String(base || "").split("#")[0] + "#/claim" + (s ? "/" + encodeURIComponent(s) : ""); }
  /* the sentence a link carries (args are the hash parts after "claim", already decoded) */
  function fromArgs(args) { return clean((args || []).join("/")); }
  /* o: { claim, verdict, figures: [{ source, year, figure, computed, doc, page }], matches, total, built, url } */
  function text(o) {
    var L = ["Kachra Satya receipt", "Claim: " + clean(o.claim), "Result: " + o.verdict];
    (o.figures || []).forEach(function (f) { L.push("- " + f.source + " " + f.year + ": " + f.figure + (f.computed ? " (computed by us)" : "") + ". " + f.doc + ", page " + f.page); });
    if (o.total) L.push(o.matches + " of " + o.total + " source figures match the claim.");
    L.push("We do not say which source is right.");
    if (o.built) L.push("Data built " + o.built + ".");
    if (o.url) L.push("Open the source pages: " + o.url);
    return L.join("\n");
  }
  var api = { MAX: MAX, clean: clean, link: link, fromArgs: fromArgs, text: text };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSReceipt = api;
})(typeof window !== "undefined" ? window : this);
