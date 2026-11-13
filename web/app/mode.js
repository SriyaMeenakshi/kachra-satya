/* Two ways in: "My street" (a resident with a garbage problem) and "The numbers" (someone checking official figures).
   The choice changes what comes first: the Home page, and the order of the menu. It never changes how a page works, and it removes nothing:
   every page is still in the menu and every link opens the same page for everyone, so a shared link or a QR code behaves the same in both.
   Remembered on this device (localStorage "ks-mode"). The default is "numbers". The styles are in mode.css. */
(function (root) {
  var KEY = "ks-mode", MODES = ["street", "numbers"], cur = "numbers";
  /* which mode a door on Home belongs to (guide.js path ids) */
  var DOOR = { garbage: "street", school: "street", claim: "numbers", official: "numbers" };
  function valid(m) { return MODES.indexOf(m) >= 0; }
  function apply() { if (typeof document === "undefined" || !document.body) return; MODES.forEach(function (m) { document.body.classList.toggle("mode-" + m, m === cur); }); }
  function get() { return cur; }
  function set(m) { if (!valid(m)) return cur; cur = m; try { localStorage.setItem(KEY, m); } catch (e) {} apply(); return cur; }
  function forDoor(id) { return DOOR[id] || null; }
  try { var saved = localStorage.getItem(KEY); if (valid(saved)) cur = saved; } catch (e) {}
  apply();
  var api = { get: get, set: set, forDoor: forDoor, MODES: MODES, DOOR: DOOR };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSMode = api;
})(typeof window !== "undefined" ? window : this);
