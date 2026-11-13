/* Loading screen and demo notice.
   1. #splash (in index.html) covers the page while it starts. This script fades it out once the page has loaded and the first screen is drawn,
      after at least 450 ms so it does not flash. If this script never runs, CSS removes it after 8 s (see splash.css), so it can never trap anyone.
   2. A notice says this site is a demonstration. It opens once per browser (remembered in localStorage, then sessionStorage; if neither works it
      shows on each visit). It is a real dialog: focus moves into it, Tab stays inside, Escape or the button closes it, focus goes back.
   Nothing here is sent anywhere. */
(function () {
  var KEY = "ks-demo-ack", t0 = Date.now(), done = false;
  function seen() { try { if (localStorage.getItem(KEY)) return true; } catch (e) {} try { return !!sessionStorage.getItem(KEY); } catch (e) { return false; } }
  function remember() { try { localStorage.setItem(KEY, String(Date.now())); return; } catch (e) {} try { sessionStorage.setItem(KEY, "1"); } catch (e) {} }

  function notice() {
    if (seen() || document.getElementById("demo-back")) return;
    var prev = document.activeElement;
    var back = document.createElement("div"); back.className = "demo-back"; back.id = "demo-back";
    back.innerHTML = '<div class="demo-box" role="dialog" aria-modal="true" aria-labelledby="demo-h" aria-describedby="demo-d"><span class="demo-tag">Demo</span>' +
      '<h2 id="demo-h">This site is for demonstration</h2>' +
      '<div id="demo-d"><p>TrashTally was built for a hackathon to show how India\'s published waste figures can be checked against each other. It is not an official government site and is not run by any ministry or board.</p>' +
      '<ul><li>The figures are copied from published government documents. We show where they disagree and do not say which is right.</li>' +
      '<li>Complaints, logs and letters are drafts only. Nothing is sent for you.</li>' +
      '<li>Ward reports stay in your own browser and are unverified.</li></ul></div>' +
      '<button type="button" class="demo-ok" id="demo-ok">I understand</button></div>';
    document.body.appendChild(back);
    var ok = document.getElementById("demo-ok"); ok.focus();
    function close() { remember(); document.removeEventListener("keydown", key, true); back.remove(); try { if (prev && prev.focus) prev.focus(); } catch (e) {} }
    function key(e) { if (e.key === "Escape") { e.preventDefault(); close(); } else if (e.key === "Tab") { e.preventDefault(); ok.focus(); } }   /* the button is the only control, so Tab stays on it */
    ok.onclick = close; document.addEventListener("keydown", key, true);
  }

  function hide() {
    if (done) return; done = true;
    var s = document.getElementById("splash");
    var go = function () { if (s) { s.classList.add("out"); setTimeout(function () { try { s.remove(); } catch (e) {} }, 600); } notice(); };
    var wait = Math.max(0, 450 - (Date.now() - t0));
    setTimeout(function () { (window.requestAnimationFrame || function (f) { f(); })(go); }, wait);
  }
  if (document.readyState === "complete") hide(); else window.addEventListener("load", hide);
  setTimeout(hide, 6000);                                     /* a slow font or image must not keep the loading screen up */
  window.KSSplash = { hide: hide, notice: notice, _KEY: KEY };
})();
