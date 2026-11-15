/* Sign in with Google, from the header. Optional: nothing here loads Google until a person opens the panel (KSAccount.button does that on demand).
   The button stays hidden unless the server says sign-in is switched on, so a static copy of the site (no server) never shows it.
   Stored on the server for a signed-in person: an anonymous code and the day it first signed in; see docs/sign_in.md. The first name Google shows stays on this device.
   The footer shows one public number from /api/stats: how many anonymous codes have signed in. It counts sign-ins, not visits. It stays hidden while the number is 0. */
(function (root) {
  var A = root.KSAccount, $ = function (i) { return document.getElementById(i); };
  var btn, pop, isOpen = false;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* the footer sentence; the number is replaced by the translation layer like any other number */
  function countText(n) {
    return n + (n === 1 ? " person has" : " people have") + " signed in with Google. This counts sign-ins, not visits, and uses anonymous codes.";
  }
  function showCount(n) {
    var el = $("signed-count"); if (!el) return;
    if (n > 0) { el.textContent = countText(n); el.hidden = false; } else { el.hidden = true; el.textContent = ""; }
  }
  function loadCount() {
    if (!A || !A.stats) return;
    A.stats().then(function (s) { showCount(s && s.signIn ? +s.people || 0 : 0); }, function () { showCount(0); });
  }

  /* the header button: icon plus a word; on very narrow screens the CSS keeps only the icon */
  function refresh() {
    if (!btn) return;
    var on = A.signedIn();
    btn.classList.toggle("on", on);
    var key = on ? "signedin" : "signin", label = on ? "Signed in" : "Sign in";
    var t = btn.querySelector(".si-t"); if (t) { t.setAttribute("data-i", key); t.textContent = root.KSi18n && root.KSi18n.t ? root.KSi18n.t(key, label) : label; }
    btn.setAttribute("aria-label", on ? "Signed in. Open the sign-in panel" : "Sign in with Google");
  }

  function close(back) {
    if (!isOpen) return;
    isOpen = false; pop.hidden = true; btn.setAttribute("aria-expanded", "false");
    if (back) btn.focus();
  }
  function afterChange() { refresh(); loadCount(); try { root.dispatchEvent(new Event("hashchange")); } catch (e) {} }   /* redraw the page, so a ward page picks up the new state */

  function draw() {
    if (A.signedIn()) {
      var n = A.name();
      pop.innerHTML = '<p class="si-h"><span>Signed in as</span> ' + (n ? '<strong data-notr>' + esc(n) + "</strong>" : "") + "</p>" +
        '<p class="si-l"><a href="#/ward">Open Your ward</a></p><p class="si-l"><a href="#/me">My details</a></p>' +
        '<div class="si-row"><button class="tg" id="si-out" type="button">Sign out</button><button class="tg" id="si-x" type="button">Close</button></div>';
      $("si-out").onclick = function () { A.signOut(); close(true); afterChange(); };
      $("si-x").onclick = function () { close(true); };
      [].forEach.call(pop.querySelectorAll("a"), function (lk) { lk.onclick = function () { close(false); }; });
    } else {
      pop.innerHTML = '<p class="si-h"><strong>Sign in with Google</strong></p>' +
        "<p>Optional. Signing in lets you add your ward taps to a shared total, and counts you once as a person who used this site.</p>" +
        '<div class="si-g" id="si-g" data-notr></div><p class="note" id="si-err" role="alert"></p>' +
        '<p class="note">We store only an anonymous code, never your name or email.</p>' +
        '<p class="note">Everything else on this site works without signing in.</p>' +
        '<div class="si-row"><button class="tg" id="si-x" type="button">Close</button></div>';
      $("si-x").onclick = function () { close(true); };
      A.button($("si-g"), function (err) {
        if (err) { $("si-err").textContent = err.message || "Could not sign in."; return; }
        close(true); afterChange();
      }).catch(function () { var e = $("si-err"); if (e) e.textContent = "Could not reach Google. Check your connection and try again."; });
    }
  }

  function open() {
    isOpen = true; draw(); pop.hidden = false; btn.setAttribute("aria-expanded", "true");
    var f = pop.querySelector("button, a, iframe, [tabindex]"); if (f && f.focus) { try { f.focus(); } catch (e) {} }
  }

  function init() {
    btn = $("signin"); pop = $("signin-pop");
    if (!A || !btn || !pop) return;
    A.config().then(function (c) {
      if (!c || !c.signIn) return;                          /* off, or no server: stay hidden */
      btn.hidden = false; refresh(); loadCount();
    });
    btn.onclick = function () { if (isOpen) close(false); else if (!A.signedIn()) location.hash = "#/join"; else open(); };      /* signed out: the Join page is the one place to sign in and give details; signed in: the small panel (sign out) */
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen) close(true); });
    document.addEventListener("click", function (e) { if (isOpen && !pop.contains(e.target) && !btn.contains(e.target)) close(false); });
    root.addEventListener("ks-auth", function () { refresh(); loadCount(); });   /* a sign-in made on the ward page */
    root.addEventListener("hashchange", function () { refresh(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();

  root.KSSignin = { countText: countText, refresh: refresh };
})(typeof window !== "undefined" ? window : this);
