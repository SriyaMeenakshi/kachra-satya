/* Whole-site Hindi and Telugu. The pages are written in English; this layer swaps the text on the page for its translation after every render.
   It looks each piece of text up by its English wording (numbers taken out, so "22 of 33" and "4 of 36" are one entry, "# of #"), and puts the numbers back.
   What it never touches: figures, state names, document names, anything a person typed, the text of a drafted letter, and the source pages.
   Text with no entry stays in English, so a page is never blank or wrong; KSDom.misses() lists what is still English.
   The dictionary is built from web/app/i18n/*.txt by scripts/build_i18n.py into i18n_dict.js. First draft: a native speaker should review it. */
(function (root) {
  var D = {}, COL = { hi: 0, te: 1 }, busy = false, miss = {}, hit = 0, lost = 0;
  var SKIP = "script,style,noscript,svg,textarea,pre,code,.out,.ticker,#splash,#gl,[data-notr],input";
  var FMT = { STRONG: 1, B: 1, EM: 1, I: 1 };
  var NUM = /\d+(?:,\d+)*(?:\.\d+)?/g;      /* a number, with its thousands commas and decimals, but not a comma that follows it */
  var origText = new WeakMap(), origHTML = new WeakMap(), origAttr = new WeakMap();

  function lang() { return root.KSi18n ? root.KSi18n.lang() : "en"; }
  function squash(s) { return String(s).replace(/[\s ]+/g, " ").trim(); }
  /* English text -> { key, nums }: the lookup key and the numbers taken out of it */
  function norm(s) { var nums = []; return { key: squash(s).replace(NUM, function (m) { nums.push(m); return "#"; }), nums: nums }; }
  /* put the numbers back: "#" takes the next one, "#2" takes the second */
  function fill(t, nums) { var i = 0; return t.replace(/#(\d)?/g, function (_, n) { var v = n ? nums[+n - 1] : nums[i++]; return v == null ? "" : v; }); }
  function look(key) { var e = D[key], c = COL[lang()]; return e && c != null && e[c] ? e[c] : null; }
  function english(s) { return /[A-Za-z]{2}/.test(s); }

  /* a block whose only inner tags are plain bold or italics is translated as one sentence, so the word order can change */
  function simpleBlock(el) {
    if (!el.children.length || el.children.length > 6) return false;
    for (var i = 0; i < el.children.length; i++) { var c = el.children[i]; if (!FMT[c.tagName] || c.attributes.length || c.children.length) return false; }
    return true;
  }
  function htmlKey(el) { return el.innerHTML.replace(/<(\/?)(strong|b)>/gi, "<$1b>").replace(/<(\/?)(em|i)>/gi, "<$1i>").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&"); }
  function escKeep(s) { return s.replace(/&/g, "&amp;").replace(/<(?!\/?[bi]>)/g, "&lt;"); }

  function doBlock(el) {
    if (origHTML.has(el)) return true;
    var n = norm(htmlKey(el)), t = look(n.key);
    if (!t) return false;
    origHTML.set(el, el.innerHTML); el.innerHTML = escKeep(fill(t, n.nums)).replace(/<(\/?)b>/g, "<$1strong>").replace(/<(\/?)i>/g, "<$1em>"); hit++; return true;
  }
  function doText(node) {
    if (origText.has(node)) return;
    var raw = node.nodeValue; if (!raw || raw.length < 2 || !english(raw)) return;
    var n = norm(raw), t = look(n.key);
    if (!t) { if (n.key.length > 1) { miss[n.key] = 1; lost++; } return; }
    origText.set(node, raw); node.nodeValue = raw.match(/^\s*/)[0] + fill(t, n.nums) + raw.match(/\s*$/)[0]; hit++;
  }
  var ATTRS = ["placeholder", "aria-label", "title"];
  function doAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a); if (!v || !english(v)) continue;
      var n = norm(v), t = look(n.key); if (!t) continue;
      var o = origAttr.get(el) || {}; if (o[a] == null) { o[a] = v; origAttr.set(el, o); } el.setAttribute(a, fill(t, n.nums));
    }
  }
  function walk(el) {
    if (el.nodeType === 3) { doText(el); return; }
    if (el.nodeType !== 1 || (el.matches && el.matches(SKIP))) { if (el.nodeType === 1 && el.tagName === "INPUT") doAttrs(el); return; }
    if (el.tagName === "OPTION" && !el.hasAttribute("value")) return;      /* an option with no value attribute uses its text as its value: leave it */
    doAttrs(el);
    if (simpleBlock(el) && doBlock(el)) return;
    for (var c = el.firstChild; c; c = c.nextSibling) walk(c);
  }
  function restore(el) {      /* back to English for anything outside the page view (the view itself is rendered again) */
    var w = document.createTreeWalker(el, 5), n;      /* elements and text */
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { if (origText.has(n)) { n.nodeValue = origText.get(n); origText.delete(n); } }
      else { if (origHTML.has(n)) { n.innerHTML = origHTML.get(n); origHTML.delete(n); } var o = origAttr.get(n); if (o) { Object.keys(o).forEach(function (a) { n.setAttribute(a, o[a]); }); origAttr.delete(n); } }
    }
  }
  function apply(scope) {
    if (busy || !document.body) return; busy = true;
    try {
      if (lang() === "en") restore(document.body);
      else { hit = 0; lost = 0; walk(scope || document.body); note(); }
    } finally { busy = false; }
  }
  /* the "partly in English" line stays only while a real share of the page is still English */
  function note() {
    var v = document.getElementById("view"), n = v && v.querySelector(".lang-note"); if (!n) return;
    var left = 0, all = 0, w = document.createTreeWalker(v, 4), x;
    while ((x = w.nextNode())) { var p = x.parentElement; if (!p || p.closest(SKIP) || p.closest("tbody,.lang-note")) continue; var s = squash(x.nodeValue); if (s.length < 4) continue; all++; if (english(s) && /^[\x00-\x7f‘-”→←·]+$/.test(s) && /[a-z]{3}/.test(s)) left++; }
    n.hidden = !all || left / all < 0.2;
  }
  function add(o) { Object.keys(o).forEach(function (k) { D[k] = o[k]; }); }

  var pending = false;
  function later() { if (pending) return; pending = true; setTimeout(function () { pending = false; apply(); }, 0); }
  function start() {
    new MutationObserver(function () { if (!busy) later(); }).observe(document.body, { childList: true, subtree: true, characterData: true });
    root.addEventListener("ks-lang", function () { setTimeout(apply, 0); });
    apply();
  }
  if (typeof document !== "undefined") { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start(); }

  var api = { add: add, apply: apply, norm: norm, fill: fill, misses: function () { return Object.keys(miss); }, clearMisses: function () { miss = {}; }, size: function () { return Object.keys(D).length; }, _look: look };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSDom = api;
})(typeof window !== "undefined" ? window : this);
