/* A step-by-step tour: a box around one part of the page, a short note about it, and Back / Next. Used on Home, Check a claim and Your ward.
   Rules: it only starts when a person presses "Take a 1-minute tour" (it never opens by itself). A step whose part is not on the page right now
   (for example the map in "My street" mode) is skipped. Escape or Skip closes it; the arrow keys move between steps; focus stays inside the box and returns to the
   button afterwards. It uses no animation, so reduced motion needs no special case, and it is hidden when printing. The text is plain English, translated by i18n_dom.js.
   TOURS is data, and place() is a pure function, so the tests can check both in Node. Styles: tour.css. */
(function (root) {
  /* sel: the first selector in the list that is visible on the page is the part we box. up: climb to that ancestor, so a button's whole card is boxed. */
  var TOURS = {
    start: { steps: [
      { sel: [".op-mode"], title: "Choose how to start", text: "Pick My street if your garbage is not collected, or The numbers if you want to check an official figure. You can change this any time." },
      { sel: [".op-doors"], title: "Four doors", text: "Each door starts a short guided path, with the pages in the right order." },
      { sel: ["#op-mapbox"], title: "The map", text: "Tap a state to see both official figures for it and the page each one is printed on." },
      { sel: [".op-street"], title: "On your street", text: "Things you can do today: tap whether the truck came, write a complaint, make a case file." },
      { sel: [".loop-strip"], title: "The loop", text: "Every page is one stop on a loop: Promise, Proof, Reality, Action. Each page says which stop you are on." }
    ] },
    claim: { steps: [
      { sel: ["#cin"], up: ".ask", title: "Type a claim", text: "Paste or type a number someone quoted, for example: 81% of India's urban waste is processed." },
      { sel: ["#cex"], title: "Or try an example", text: "Tap one of these to see how the checker answers." },
      { sel: ["#cres .verdict"], title: "The result", text: "We show which sources agree. When they disagree we say so and never pick a winner." },
      { sel: ["#cres .cc-share"], title: "Take it with you", text: "Copy the result as text, send it on WhatsApp, or copy a link that reopens this check." }
    ] },
    ward: { steps: [
      { sel: ["#wyes"], up: ".card", title: "Tap whether the truck came", text: "Each day, press the tick if the truck came or the cross if it did not. You can fill in the last 7 days." },
      { sel: ["#wcal"], title: "Your calendar", text: "Every tap becomes a square. Days with no tap stay blank: they are unknown, not counted as missed." },
      { sel: ["#wshare"], title: "Your ward's shared total", text: "When sharing is switched on, you can sign in with Google and add your taps to the ward's total, so neighbours count together. Nothing is sent until you press Turn on sharing." },
      { sel: ["#wcase"], title: "The case file", text: "After a few days this writes one page for a councillor, a ward officer or a reporter. Copy it, send it on WhatsApp or print it. We write it; you send it." },
      { sel: ["#casecard + .section"], title: "Official figures, for context", text: "This is what the government reports for your state, with the page it is printed on. It describes the state, not your ward." },
      { sel: ["#qrcard"], title: "QR code for the ward", text: "Print this and put it on a bin or a truck, so neighbours can open this ward page by scanning it." },
      { sel: ["#wdl"], up: "p", title: "Your data stays yours", text: "Download your taps as a spreadsheet, or delete them from this device." }
    ] }
  };

  /* Where the note goes, given the boxed part's rectangle, the note's size and the window: below the part, else above it, else docked at the bottom of the window. */
  function place(hole, pop, vw, vh) {
    var gap = 12, edge = 12, left = Math.max(edge, Math.min(hole.left, vw - pop.w - edge)), below = vh - (hole.top + hole.h), above = hole.top;
    if (below >= pop.h + gap + edge) return { mode: "below", top: hole.top + hole.h + gap, left: left };
    if (above >= pop.h + gap + edge) return { mode: "above", top: hole.top - pop.h - gap, left: left };
    return { mode: "dock", top: null, left: null };
  }
  var api = { TOURS: TOURS, place: place };
  if (typeof document === "undefined") { if (typeof module !== "undefined" && module.exports) module.exports = api; return; }

  /* ---------- the tour itself (browser only) ---------- */
  var cur = null, steps = [], i = 0, shade, hole, pop, opener = null, raf = 0;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function shown(el) { if (!el) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function target(step) {
    var v = document.getElementById("view");
    for (var k = 0; k < step.sel.length; k++) { var el = v.querySelector(step.sel[k]); if (el && step.up) el = el.closest(step.up) || el; if (shown(el)) return el; }
    return null;
  }
  function button(id) { return TOURS[id] ? '<button type="button" class="tour-btn" data-tour="' + id + '"><span aria-hidden="true">?</span> Take a 1-minute tour</button>' : ""; }
  /* put the button under the heading (and the loop bar), once */
  function mount(id, view) {
    if (!TOURS[id] || !view) return;
    [].forEach.call(view.querySelectorAll(".tour-row"), function (e) { e.remove(); });
    var ref = view.querySelector(".loop-bar") || view.querySelector(".sub") || view.querySelector("h1, h2"); if (!ref) return;
    ref.insertAdjacentHTML("afterend", '<p class="tour-row">' + button(id) + "</p>");
  }

  function build() {
    shade = document.createElement("div"); shade.className = "tour-shade";
    hole = document.createElement("div"); hole.className = "tour-hole"; hole.setAttribute("aria-hidden", "true");
    pop = document.createElement("div"); pop.className = "tour-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "true"); pop.setAttribute("aria-labelledby", "tour-t"); pop.setAttribute("aria-describedby", "tour-x");
    pop.innerHTML = '<p class="tour-n" id="tour-n"></p><h3 class="tour-t" id="tour-t"></h3><p class="tour-x" id="tour-x"></p><div class="tour-acts"><button type="button" class="alt" id="tour-skip">Skip the tour</button><span class="tour-sp"></span><button type="button" class="alt" id="tour-back">Back</button><button type="button" class="go" id="tour-next">Next</button></div>';
    document.body.appendChild(shade); document.body.appendChild(hole); document.body.appendChild(pop);
    $("tour-skip").onclick = close; $("tour-back").onclick = function () { go(-1); }; $("tour-next").onclick = function () { go(1); };
  }
  function $(id) { return document.getElementById(id); }

  function draw() {
    raf = 0; if (!cur) return;
    var el = steps[i].el; if (!shown(el)) return;
    var r = el.getBoundingClientRect(), pad = 8, h = { left: r.left - pad, top: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
    hole.style.cssText = "left:" + h.left + "px;top:" + h.top + "px;width:" + h.w + "px;height:" + h.h + "px";
    var p = place({ left: h.left, top: h.top, h: h.h }, { w: pop.offsetWidth, h: pop.offsetHeight }, innerWidth, innerHeight);
    pop.classList.toggle("dock", p.mode === "dock");
    pop.style.top = p.mode === "dock" ? "" : p.top + "px"; pop.style.left = p.mode === "dock" ? "" : p.left + "px";
  }
  function later() { if (!raf) raf = requestAnimationFrame(draw); }

  function show() {
    var s = steps[i], last = i === steps.length - 1;
    $("tour-n").textContent = "Step " + (i + 1) + " of " + steps.length; $("tour-t").textContent = s.title; $("tour-x").textContent = s.text;
    $("tour-back").hidden = i === 0; $("tour-next").textContent = last ? "Done" : "Next";
    var r = s.el.getBoundingClientRect(); window.scrollTo(0, Math.max(0, r.top + window.pageYOffset - 84));      /* the boxed part near the top, the note below or beside it */
    draw(); setTimeout(function () { draw(); }, 60);      /* once more after the page has settled and the translation layer has run */
    $("tour-next").focus({ preventScroll: true });
  }
  function go(d) { if (i + d >= steps.length) { close(); return; } if (i + d < 0) return; i += d; show(); }

  function keys(e) {
    if (!cur) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "Tab") {      /* keep focus inside the note */
      var f = [].filter.call(pop.querySelectorAll("button"), function (b) { return !b.hidden; }), a = document.activeElement, k = f.indexOf(a);
      if (k < 0) { e.preventDefault(); f[0].focus(); } else if (e.shiftKey && k === 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && k === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }
  function start(id, from) {
    if (cur || !TOURS[id]) return;
    steps = TOURS[id].steps.map(function (s) { return { s: s, el: target(s) }; }).filter(function (x) { return x.el; }).map(function (x) { return { sel: x.s.sel, title: x.s.title, text: x.s.text, el: x.el }; });
    if (!steps.length) return;
    cur = id; i = 0; opener = from || null; if (!shade) build();
    shade.hidden = hole.hidden = pop.hidden = false; document.body.classList.add("tour-on"); show();
  }
  function close() {
    if (!cur) return; cur = null; shade.hidden = hole.hidden = pop.hidden = true; document.body.classList.remove("tour-on");
    if (opener && document.body.contains(opener)) opener.focus(); opener = null;
  }
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest("[data-tour]"); if (b) { e.preventDefault(); start(b.dataset.tour, b); } });
  document.addEventListener("keydown", keys, true);
  window.addEventListener("scroll", later, true); window.addEventListener("resize", later); window.addEventListener("hashchange", close);

  root.KSTour = { TOURS: TOURS, place: place, button: button, mount: mount, start: start, close: close };
})(typeof window !== "undefined" ? window : this);
