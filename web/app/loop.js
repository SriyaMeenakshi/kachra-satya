/* The central idea, made visible: a receipt for every waste promise. Four stops on a loop: Promise, Proof, Reality, Action.
   One definition, used by the Home strip (opening.js), the step chip on every page (app.js) and the demo film (demo.js), so the three never disagree.
   Which page belongs to which stop is in ROUTE; changing it here changes it everywhere. It only labels pages: it changes no data and no page logic. */
(function (root) {
  var STAGES = [
    { id: "promise", n: 1, name: "Promise", q: "What did they say?", line: "A number someone quoted, or one in an official document.", home: "#/claim", cta: "Check a claim" },
    { id: "proof", n: 2, name: "Proof", q: "Is it true on paper?", line: "The source page, whether the sources agree, and what cannot all be true.", home: "#/map", cta: "Open the map" },
    { id: "reality", n: 3, name: "Reality", q: "Is it true on my street?", line: "Your own record of the truck, and your city's ward figures.", home: "#/ward", cta: "Your ward" },
    { id: "action", n: 4, name: "Action", q: "What can I do about it?", line: "A complaint, a log, a letter, a briefing, a lesson.", home: "#/help", cta: "Get help" }
  ];
  /* route name (the first part of the hash) -> stage id */
  var ROUTE = { claim: "promise", ask: "promise", map: "proof", gaps: "proof", explore: "proof", about: "proof", ward: "reality", city: "reality", help: "action", brief: "action", school: "action", dropoff: "action" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function stage(id) { for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i]; return null; }
  function stageOfRoute(name) { return stage(ROUTE[name]); }

  /* the strip on Home: all four stops, each a way in */
  function strip() {
    return '<section class="op-sec loop-strip" aria-labelledby="loop-h"><p class="op-eyebrow">The idea</p><h2 class="op-h2" id="loop-h">A receipt for every waste promise.</h2>' +
      '<p class="op-p">Every number about India\'s waste is a promise. We turn each one into a receipt you can follow: what was said, the proof, whether it is true where you live, and what you can do.</p>' +
      '<ol class="loop-steps">' + STAGES.map(function (s, i) {
        return '<li class="loop-step"><a href="' + s.home + '"><span class="loop-n" aria-hidden="true">' + s.n + '</span><span class="loop-t"><b>' + esc(s.name) + '</b><span class="loop-q">' + esc(s.q) + '</span><span class="loop-l">' + esc(s.line) + '</span></span><span class="loop-go">' + esc(s.cta) + ' &rarr;</span></a></li>';
      }).join("") + '</ol><p class="loop-back">&#8635; Then it loops: you check the next promise, or see whether the last one changed.</p></section>';
  }

  /* the bar on every other page: where this page sits, and the next stop */
  function bar(routeName) {
    var cur = stageOfRoute(routeName); if (!cur) return "";
    var next = STAGES[cur.n % STAGES.length];
    return '<nav class="loop-bar" data-lp="1" aria-label="Where this page sits in the loop: a receipt for every waste promise"><ol>' + STAGES.map(function (s) {
      return '<li' + (s.id === cur.id ? ' class="on" aria-current="step"' : "") + '><a href="' + s.home + '"><span class="loop-n" aria-hidden="true">' + s.n + "</span>" + esc(s.name) + "</a></li>"; }).join("") + '</ol>' +
      '<p class="loop-here"><b>Step ' + cur.n + " of 4, " + esc(cur.name) + ".</b> " + esc(cur.q) + ' <a href="' + next.home + '">Next: ' + esc(next.name) + " &rarr;</a></p></nav>";
  }

  /* a small chip for the demo film and other places that name a stage */
  function chip(id) { var s = stage(id); return s ? '<span class="loop-chip loop-' + s.id + '">' + s.n + " &middot; " + esc(s.name) + "</span>" : ""; }

  var api = { STAGES: STAGES, ROUTE: ROUTE, stage: stage, stageOfRoute: stageOfRoute, strip: strip, bar: bar, chip: chip };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KSLoop = api;
})(typeof window !== "undefined" ? window : this);
