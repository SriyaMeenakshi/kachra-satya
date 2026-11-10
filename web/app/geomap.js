/* Geographic map of India's states and union territories, drawn as SVG from window.KS_INDIA (web/app/india.js, built by scripts/build_india_map.py).
   KSGeo.draw(container, {value, colour, ink, label, selected, flagged, abb, onSelect, tip}) paints each unit by value(state); a missing value is hatched ("not reported").
   Tiny units (Delhi, Chandigarh, Goa, Puducherry, Lakshadweep, the two Dadra and Daman units, the Andaman and Nicobar Islands) also get a round pin so they can be seen and tapped.
   Keyboard: one unit is in the tab order; the arrow keys move to the nearest unit in that direction; Enter or Space selects.
   The outlines are simplified, from a community dataset whose origin is not stated: not an authoritative boundary (see docs/map.md). */
(function (root) {
  var NS = "http://www.w3.org/2000/svg", PIN = { "Delhi": 1, "Chandigarh": 1, "Goa": 1, "Puducherry": 1, "Lakshadweep": 1, "Dadra and Nagar Haveli and Daman and Diu": 1, "Andaman and Nicobar Islands": 1 };
  function el(tag, attrs, parent) { var e = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (parent) parent.appendChild(e); return e; }

  function draw(box, o) {
    var G = root.KS_INDIA, names = Object.keys(G.states), vb = G.vb;
    box.innerHTML = "";
    var svg = el("svg", { viewBox: vb.join(" "), role: "group", "aria-label": "Map of India's states and union territories", preserveAspectRatio: "xMidYMid meet" }, box);
    var defs = el("defs", {}, svg), pat = el("pattern", { id: "hatch", width: ".5", height: ".5", patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    el("rect", { width: ".5", height: ".5", fill: "var(--none)" }, pat); el("rect", { width: ".22", height: ".5", fill: "var(--hair)" }, pat);
    var layer = el("g", {}, svg), pins = el("g", {}, svg), marks = el("g", {}, svg), texts = el("g", { "aria-hidden": "true" }, svg), items = {};

    function attach(node, s, lab, v) {
      node.setAttribute("class", "geo-s"); node.setAttribute("data-s", s); node.setAttribute("role", "button"); node.setAttribute("aria-label", lab);
      node.setAttribute("aria-pressed", o.selected === s ? "true" : "false"); node.setAttribute("tabindex", (o.selected ? o.selected === s : s === "Delhi") ? "0" : "-1");
      if (v == null) node.setAttribute("fill", "url(#hatch)"); else { var bg = o.colour(v); node.setAttribute("fill", bg); }
      node.addEventListener("click", function () { o.onSelect(s); });
      node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); o.onSelect(s); return; }
        var dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!dir) return; e.preventDefault();
        var c = G.states[s].c, best = null, bd = 1e9;
        names.forEach(function (n) { if (n === s) return; var q = G.states[n].c, dx = q[0] - c[0], dy = q[1] - c[1];
          if (dir[0] && Math.sign(dx) !== dir[0]) return; if (dir[1] && Math.sign(dy) !== dir[1]) return;
          var d = dir[0] ? Math.abs(dx) + 2.5 * Math.abs(dy) : Math.abs(dy) + 2.5 * Math.abs(dx); if (d < bd) { bd = d; best = n; } });
        if (best) { items[best].setAttribute("tabindex", "0"); node.setAttribute("tabindex", "-1"); items[best].focus(); }
      });
      if (o.tip) { node.addEventListener("mousemove", function (e) { o.tip(lab, e); }); node.addEventListener("mouseleave", function () { o.tip(null); }); }
      items[s] = node;
    }
    names.forEach(function (s) {
      var v = o.value(s), lab = o.label(s), p = el("path", { d: G.states[s].d }, layer); attach(p, s, lab, v); p.setAttribute("fill-rule", "evenodd");
    });
    names.forEach(function (s) {
      var c = G.states[s].c, big = G.states[s].a > 2.2, v = o.value(s);
      if (PIN[s]) {
        var pin = el("circle", { cx: c[0], cy: c[1], r: .42 }, pins); attach(pin, s, o.label(s), v); pin.setAttribute("class", "geo-s geo-pin");
        if (s === "Lakshadweep") { pin.setAttribute("cx", c[0] - 0.9); }
      }
      if (o.flagged && o.flagged[s]) el("circle", { cx: c[0] + (PIN[s] ? .38 : big ? .85 : 0), cy: c[1] - (PIN[s] ? .38 : big ? .42 : 0), r: .2, class: "geo-flag" }, marks);    /* beside the label, not on it */
      if (big && o.abb && o.abb[s]) { var bg = v == null ? null : o.colour(v), t = el("text", { x: c[0], y: c[1] + .22, "text-anchor": "middle" }, texts); t.textContent = o.abb[s]; t.setAttribute("fill", bg ? o.ink(bg) : "var(--ink2)"); }
    });
    return { items: items };
  }
  root.KSGeo = { draw: draw };
})(window);
