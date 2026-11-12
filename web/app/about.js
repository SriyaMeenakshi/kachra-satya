/* About and methodology: how the figures are checked, what the site does not do, where the numbers come from, the licence.
   Moved off the Home page so Home can stay short. Every count is read from the data (nothing typed in). Route #/about. */
(function (root) {
  var KS = root.KS, $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var GH = "https://github.com/SriyaMeenakshi/kachra-satya";

  function render() {
    var states = Array.from(new Set(KS.waste.map(function (r) { return r.state; }))).length;
    var reported = KS.waste.filter(function (r) { return r.value_tpd != null; }).length + KS.national.filter(function (r) { return r.value != null; }).length;
    var rc = Object.keys(KS.receipts).map(function (k) { return KS.receipts[k]; }), withPage = rc.filter(function (r) { return r.image; }).length, boxed = rc.filter(function (r) { return r.bbox; }).length;
    $("view").innerHTML = '<h2>About and methodology</h2><p class="sub">Kachra Satya (&ldquo;the truth about garbage&rdquo;) puts India&rsquo;s published waste figures side by side, shows the source page behind each, and helps a person act on what they find. It is a demonstration built for a hackathon, not an official site.</p>' +
      '<div class="card pad"><h3 style="margin-top:0">How we check</h3><ol class="steps">' +
      '<li><strong>Every figure is copied from a published document</strong> and opens on the page it came from, with its number boxed where we could place it.</li>' +
      '<li><strong>Where sources disagree, we say so.</strong> We compare, we do not pick a winner, and we never accuse a source.</li>' +
      '<li><strong>Blank means &ldquo;not reported&rdquo;.</strong> We never fill gaps in or estimate a missing figure.</li>' +
      '<li><strong>Reported and computed are kept apart.</strong> A computed share is one we worked out from two printed figures, and it is labelled.</li>' +
      '<li><strong>All figures are self-reported</strong> by states, cities and boards. We check consistency, not what is on your street.</li></ol></div>' +
      '<h3>By the numbers</h3><div class="kpis"><div class="kpi"><div class="v">' + states + '</div><div class="l">states and UTs</div></div><div class="kpi"><div class="v">' + reported + '</div><div class="l">reported figures</div></div>' +
      '<div class="kpi"><div class="v">' + withPage + '</div><div class="l">open on a source page</div></div><div class="kpi"><div class="v">' + boxed + '</div><div class="l">with the number boxed</div></div><div class="kpi"><div class="v">' + KS.flags.length + '</div><div class="l">flags: figures that cannot all be true</div></div></div>' +
      '<p class="note">Data built ' + esc(KS.built) + '. A flag means two reported figures cannot both be true; it does not say which to trust.</p>' +
      '<h3>What we won&rsquo;t do</h3><div class="card pad"><ul><li>We draft complaints and letters. We never send them.</li><li>Reports from your own street (Your ward) stay in your browser and are unverified; the site has no shared server.</li>' +
      '<li>We do not say which official figure is right, and the difference between two reports is not an amount of missing waste.</li><li>We do not cover route optimisation, recycling prices or plastic tracking.</li></ul></div>' +
      '<h3>Where the numbers come from</h3><div class="card pad"><p style="margin-top:0">Lok Sabha and Rajya Sabha answers, CPCB annual reports, MoHUA documents and the Swachh Bharat Mission dashboard. Each row of the data names its document, page and the date we retrieved it. The list is in <a href="' + GH + '/blob/main/SOURCES.md" target="_blank" rel="noopener">SOURCES.md</a>, and the words each source uses are on the <a href="#/explore/defs">Definitions</a> tab.</p>' +
      '<p class="note" style="margin-bottom:0">The source documents are public government records, reproduced unchanged with the source named. Rights stay with each publisher, and we will remove any document on its publisher&rsquo;s request. We are not affiliated with or endorsed by any ministry, board or secretariat.</p></div>' +
      '<h3>Licence and code</h3><p>Our code and our compiled data are released under the MIT licence. The full method, the checks and the tests are open: <a href="' + GH + '" target="_blank" rel="noopener">github.com/SriyaMeenakshi/kachra-satya</a>, with the method in <a href="' + GH + '/blob/main/docs/methodology.md" target="_blank" rel="noopener">docs/methodology.md</a>.</p>' +
      '<h3>Who built it</h3><p>Yasaswini, Sriya Meenakshi Chalamalasetty and Likhitha, for the Code for a Billion hackathon, Waste Management track.</p>' +
      '<p><a class="alt" href="#/start" style="text-decoration:none;display:inline-block;padding:10px 18px;border:1.5px solid var(--ink);border-radius:999px">Back to the start</a></p>';
  }
  root.KSAbout = { render: render };
})(window);
