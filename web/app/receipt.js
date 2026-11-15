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

  /* ---------- the picture: a square card for WhatsApp, drawn on a canvas in the browser ---------- */
  var W = 1080, H = 1080, PAD = 72;
  /* split text into lines no wider than maxW. measure(str) gives a width in pixels, so this is pure and the tests can pass a fake one */
  function wrap(str, maxW, measure, maxLines) {
    var words = clean(str).split(" "), lines = [], cur = "";
    words.forEach(function (w) {
      var t = cur ? cur + " " + w : w;
      if (!cur || measure(t) <= maxW) cur = t; else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    if (maxLines && lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "..."; }
    return lines;
  }
  /* what to draw, as plain data: { w, h, items: [{ t, x, y, size, weight, color, font }], bars: [...] } */
  function cardModel(o, measure) {
    var items = [], y = PAD + 6, maxW = W - PAD * 2, LH = 1.28;
    function add(t, size, weight, color, font, gapAfter) { items.push({ t: t, x: PAD, y: y + size, size: size, weight: weight, color: color, font: font || "text" }); y += size * LH + (gapAfter || 0); }
    add("KACHRA SATYA  ·  RECEIPT", 30, 700, "#BFE84F", "mono", 30);
    wrap(o.claim, maxW, function (t) { return measure(t, 46, 700); }, 4).forEach(function (l) { add(l, 46, 700, "#F4F1E6", "text", 0); });
    y += 18;
    add(o.verdict, 36, 700, "#E4795B", "text", 24);
    var figs = (o.figures || []).slice(0, 4), room = H - 150 - y;
    figs.forEach(function (f) {
      if (y + 112 > H - 150) return;
      add(f.source + " " + f.year + (f.computed ? " (computed by us)" : ""), 26, 500, "#B9C9BF", "text", 0);
      add(String(f.figure), 50, 800, "#F4F1E6", "num", 0);
      add(f.doc + ", page " + f.page, 24, 400, "#B9C9BF", "text", 16);
    });
    add("We do not say which source is right.", 28, 600, "#BFE84F", "text", 0);
    items.push({ t: "kachra-satya.onrender.com", x: PAD, y: H - PAD, size: 28, weight: 600, color: "#F4F1E6", font: "mono" });
    if (o.built) items.push({ t: "Data built " + o.built, x: W - PAD, y: H - PAD, size: 24, weight: 400, color: "#B9C9BF", font: "mono", right: true });
    return { w: W, h: H, items: items, room: room };
  }
  var FONTS = { text: '"Anek", "Segoe UI", Arial, sans-serif', num: '"Teko", "Anek", "Segoe UI", Arial, sans-serif', mono: '"Martian Mono", Consolas, monospace' };
  /* draw the card; resolves to a PNG Blob. Browser only. */
  function image(o) {
    return new Promise(function (ok, bad) {
      try {
        var c = document.createElement("canvas"); c.width = W; c.height = H; var g = c.getContext("2d");
        var go = function () {
          var m = cardModel(o, function (t, size, weight) { g.font = (weight || 400) + " " + size + "px " + FONTS.text; return g.measureText(t).width; });
          var bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#0A1F17"); bg.addColorStop(1, "#12382A"); g.fillStyle = bg; g.fillRect(0, 0, W, H);
          g.fillStyle = "#BFE84F"; g.fillRect(0, 0, 14, H);
          m.items.forEach(function (it) { g.font = it.weight + " " + it.size + "px " + FONTS[it.font]; g.fillStyle = it.color; g.textAlign = it.right ? "right" : "left"; g.fillText(it.t, it.right ? it.x : it.x, it.y); });
          c.toBlob(function (b) { if (b) ok(b); else bad(new Error("Could not make the picture.")); }, "image/png");
        };
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(go, go); else go();
      } catch (e) { bad(e); }
    });
  }
  var api = { MAX: MAX, clean: clean, link: link, fromArgs: fromArgs, text: text, wrap: wrap, cardModel: cardModel, image: image };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSReceipt = api;
})(typeof window !== "undefined" ? window : this);
