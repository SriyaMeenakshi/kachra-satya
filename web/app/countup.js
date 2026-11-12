/* Count-up for headline numbers: when a number scrolls into view it climbs from 0 to its real value (about 1.2 s).
   The real text is always in the page first and is restored at the end (and at once for people who prefer reduced motion, in print, or if
   anything goes wrong), so the count-up is decoration only: it never changes, hides or invents a figure.
   frame(text, t) -> the text with every number scaled by t (0..1), keeping commas, decimals and the % sign. Pure, so tests/test_countup.py runs it in Node. */
(function (root) {
  var NUM = /\d[\d,]*(?:\.\d+)?/g;
  function frame(text, t) {
    return String(text).replace(NUM, function (tok) {
      var dec = (tok.split(".")[1] || "").length, grouped = tok.indexOf(",") >= 0, v = parseFloat(tok.replace(/,/g, ""));
      if (!isFinite(v)) return tok;
      var x = t >= 1 ? v : v * t;
      if (!dec) x = t >= 1 ? v : Math.floor(x);
      var s = grouped ? x.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) : x.toFixed(dec);
      return s;
    });
  }
  var api = { frame: frame };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  var SEL = ".op-find .n,.op-float .big,.jy-proof b,.kpi .v";
  var reduce = false; try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var io = null, busy = false;
  function run(el) {
    var final = el.getAttribute("data-final") || el.textContent;
    if (!/\d/.test(final)) return;
    el.setAttribute("data-final", final);
    var start = null, dur = 1200;
    function step(ts) {
      try {
        if (start == null) start = ts;
        var p = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - p, 3);          /* ease-out */
        el.textContent = p >= 1 ? final : frame(final, e);
        if (p < 1) requestAnimationFrame(step);
      } catch (err) { el.textContent = final; }
    }
    requestAnimationFrame(step);
    setTimeout(function () { if (el.textContent !== final && !el.isConnected) return; el.textContent = final; }, dur + 600);   /* fail-safe: always end on the real text */
  }
  function scan() {
    if (busy || reduce) return; busy = true;
    try {
      var view = document.getElementById("view"); if (!view) return;
      [].slice.call(view.querySelectorAll(SEL)).forEach(function (el) {
        if (el.getAttribute("data-cu")) return; el.setAttribute("data-cu", "1");
        if (!/\d/.test(el.textContent)) return;
        if (!io) io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } }); }, { threshold: 0.4 });
        io.observe(el);
      });
    } catch (e) {} finally { busy = false; }
  }
  function init() {
    var view = document.getElementById("view"); if (!view || !("IntersectionObserver" in window)) return;
    new MutationObserver(function () { scan(); }).observe(view, { childList: true, subtree: true });
    scan();
  }
  root.KSCountUp = { frame: frame, scan: scan, init: init, run: run };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : this);
