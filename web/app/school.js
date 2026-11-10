/* School and college waste audit challenge. Route #/school. Students weigh their institution's waste for a week and get a report card.
   Everything runs in the browser; nothing is uploaded. Blank cells mean "not reported" and are never filled in or guessed.
   School-specific rules (not the city rules: waste processed on site is not "collected", so treated-above-collected would misfire here):
     S1 collected plus processed on site above generated   S2 sorted correctly above generated   S3 a figure blank on a day when the same block reports it on other days */
(function (root) {
  var $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var NUM = ["generated", "collected", "segregated", "onsite"], TOL = 0.5;     /* kg */
  var COLS = [["block", "Block or class"], ["date", "Date"], ["generated", "Waste weighed (kg)"], ["collected", "Picked up by the municipal vehicle (kg)"], ["segregated", "Sorted correctly before pick-up or processing (kg)"], ["onsite", "Processed on site, e.g. composted (kg)"]];
  var EXAMPLE = [["FICTIONAL Block A", "2026-01-12", 20, 14, 12, 4], ["FICTIONAL Block A", "2026-01-13", 22, 15, 10, 5], ["FICTIONAL Block B", "2026-01-12", 30, 28, 9, 0], ["FICTIONAL Block B", "2026-01-13", 28, 33, 8, 0],
    ["FICTIONAL Canteen", "2026-01-12", 40, 10, 38, 30], ["FICTIONAL Canteen", "2026-01-13", 41, "", 36, 31]];
  var rows = [];

  function num(x) { var v = parseFloat(x); return isNaN(v) ? null : v; }
  function clean() { return rows.map(function (r) { var o = { block: String(r[0] || "").trim(), date: String(r[1] || "").trim() }; NUM.forEach(function (k, i) { o[k] = num(r[2 + i]); }); return o; }).filter(function (o) { return o.block || o.date || NUM.some(function (k) { return o[k] != null; }); }); }

  function audit(d) {
    var flags = [], by = {};
    d.forEach(function (r) { (by[r.block || "(no name)"] = by[r.block || "(no name)"] || []).push(r); });
    d.forEach(function (r) {
      var w = (r.block || "(no name)") + (r.date ? ", " + r.date : "");
      if (r.generated != null && r.collected != null && r.collected + (r.onsite || 0) > r.generated + TOL) flags.push({ where: w, rule: "S1", text: "More waste is accounted for (picked up " + r.collected + " kg plus processed on site " + (r.onsite || 0) + " kg) than was weighed (" + r.generated + " kg). Re-weigh, or check the same waste was not counted twice." });
      if (r.generated != null && r.segregated != null && r.segregated > r.generated + TOL) flags.push({ where: w, rule: "S2", text: "More waste is reported correctly sorted (" + r.segregated + " kg) than was weighed (" + r.generated + " kg)." });
    });
    Object.keys(by).forEach(function (b) { NUM.forEach(function (k) {
      if (by[b].some(function (r) { return r[k] != null; })) by[b].forEach(function (r) { if (r[k] == null) flags.push({ where: b + (r.date ? ", " + r.date : ""), rule: "S3", text: "The " + k + " figure is blank on this day, although this block reports it on other days." }); }); }); });
    var rank = Object.keys(by).map(function (b) {
      var rs = by[b], sum = function (k, pair) { var t = 0, n = 0, g = 0; rs.forEach(function (r) { if (r[k] != null && (!pair || r[pair] != null)) { t += r[k]; n++; if (pair) g += r[pair]; } }); return { t: t, n: n, g: g }; };
      var gen = sum("generated"), sg = sum("segregated", "generated"), os = sum("onsite", "generated");
      return { block: b, days: gen.n, avg: gen.n ? gen.t / gen.n : null, seg: sg.g ? sg.t / sg.g * 100 : null, onsite: os.g ? os.t / os.g * 100 : null };
    }).sort(function (a, b) { return (b.avg == null ? -1 : b.avg) - (a.avg == null ? -1 : a.avg); });
    return { flags: flags, rank: rank, rows: d.length };
  }

  function rowHTML(r, i) {
    return "<tr>" + COLS.map(function (c, k) { return '<td><input data-i="' + i + '" data-k="' + k + '" type="' + (k === 1 ? "date" : k === 0 ? "text" : "number") + '" ' + (k > 1 ? 'min="0" step="any" ' : "") + 'value="' + esc(r[k]) + '" aria-label="' + esc(COLS[k][1]) + ", row " + (i + 1) + '" style="min-width:' + (k === 0 ? "9em" : k === 1 ? "9em" : "6em") + '"></td>'; }).join("") + '<td><button class="link" data-del="' + i + '" type="button" aria-label="Remove row ' + (i + 1) + '">Remove</button></td></tr>';
  }
  function draw() {
    var t = $("sgrid"); t.innerHTML = "<thead><tr>" + COLS.map(function (c) { return '<th scope="col">' + c[1] + "</th>"; }).join("") + "<th></th></tr></thead><tbody>" + rows.map(rowHTML).join("") + "</tbody>";
    t.querySelectorAll("input").forEach(function (inp) { inp.oninput = function () { rows[+inp.dataset.i][+inp.dataset.k] = inp.value; }; });
    t.querySelectorAll("[data-del]").forEach(function (b) { b.onclick = function () { rows.splice(+b.dataset.del, 1); draw(); }; });
  }
  function fmt1(v) { return v == null ? "not reported" : (Math.round(v * 10) / 10).toLocaleString("en-IN"); }

  function result() {
    var d = clean(); if (!d.length) { $("sres").innerHTML = '<p class="note" role="alert">Add at least one row.</p>'; return; }
    var r = audit(d), tot = d.reduce(function (a, x) { return a + (x.generated || 0); }, 0), nameless = d.filter(function (x) { return !x.block; }).length;
    var allGen = d.filter(function (x) { return x.generated != null; }), per = allGen.length ? tot / allGen.length : null;
    $("sres").innerHTML = '<div class="card pad" id="rcard"><h3 style="margin-top:0">Report card</h3><div class="kpis"><div class="kpi"><div class="v">' + r.rows + '</div><div class="l">rows read</div></div>' +
      '<div class="kpi"><div class="v">' + fmt1(tot) + '</div><div class="l">kg weighed in total</div></div><div class="kpi"><div class="v">' + r.flags.length + '</div><div class="l">figures to recheck</div></div></div>' +
      (per != null && per >= 100 ? '<div class="notice" style="margin-top:12px">The average weighed per row is ' + fmt1(per) + ' kg. If this is a whole-campus daily figure of 100 kg or more, the institution meets the bulk waste generator threshold in the SWM Rules, 2026: see <a href="#/help/bulk">Bulk generator?</a></div>' : "") +
      (nameless ? '<p class="mini">' + nameless + " row(s) have no block name.</p>" : "") +
      '<h4>By block</h4><div class="tw"><table><thead><tr><th>Block</th><th class="num">Days weighed</th><th class="num">Average kg a day</th><th class="num">Sorted correctly (% of weighed)</th><th class="num">Processed on site (% of weighed)</th></tr></thead><tbody>' +
      r.rank.map(function (b) { return "<tr><td>" + esc(b.block) + '</td><td class="num">' + b.days + '</td><td class="num">' + fmt1(b.avg) + '</td><td class="num">' + (b.seg == null ? "not reported" : Math.round(b.seg) + "%") + '</td><td class="num">' + (b.onsite == null ? "not reported" : Math.round(b.onsite) + "%") + "</td></tr>"; }).join("") + "</tbody></table></div>" +
      '<h4>Figures to recheck</h4>' + (r.flags.length ? '<p class="mini">These are figures that cannot all be true as entered. They do not say which figure is wrong.</p>' + r.flags.map(function (f) { return '<div class="flagrow"><span class="pill">' + f.rule + "</span><span><strong>" + esc(f.where) + ":</strong> " + esc(f.text) + "</span></div>"; }).join("") : '<p class="note">Nothing to recheck in the figures you entered.</p>') +
      '<p class="mini">Percentages use only the days where both figures were entered. Blank cells are not guessed. A report card describes the week you weighed, not the whole year.</p></div>' +
      '<div class="rowbtn noprint"><button class="alt" id="s-csv" type="button">Download your entries (CSV)</button><button class="alt" id="s-print" type="button">Print the report card</button></div>';
    $("s-print").onclick = function () { window.print(); };
    $("s-csv").onclick = function () { var q = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([["block,date,waste_weighed_kg,picked_up_kg,sorted_correctly_kg,processed_on_site_kg"].concat(d.map(function (x) { return [x.block, x.date, x.generated, x.collected, x.segregated, x.onsite].map(q).join(","); })).join("\n") + "\n"], { type: "text/csv" })); a.download = "school_waste_week.csv"; document.body.appendChild(a); a.click(); a.remove(); };
  }

  function render() {
    rows = [["", "", "", "", "", ""]];
    $("view").innerHTML = '<h2>School waste challenge</h2><p class="sub">Students weigh their school or college waste for a week. The app checks the numbers and gives a report card. It runs in your browser; nothing is uploaded.</p>' +
      '<div class="card pad"><h3 style="margin-top:0">How to weigh</h3><ol class="steps"><li>Pick one school week. Weigh each block, class or the canteen every day, using a kitchen or luggage scale.</li><li>Keep the four streams apart: wet (food, peels), dry (paper, plastic, metal, glass), sanitary and special care (see <a href="#/help/bins">Which bin</a>).</li><li><strong>Safety:</strong> wear gloves, wash hands, and let a teacher handle weighing of sanitary waste in sealed bags. Do not open or weigh special care waste such as bulbs, medicines or thermometers; note the count instead and leave that column blank.</li><li>Enter what you weighed below. Leave a box empty if you do not know it; we never fill it in.</li></ol></div>' +
      '<div class="card pad" style="margin-top:14px"><div class="tw"><table id="sgrid"></table></div><div class="rowbtn"><button class="alt" id="s-add" type="button">Add a row</button><button class="alt" id="s-ex" type="button">Try a fictional example (not real data)</button><button class="go" id="s-go" type="button">Make my report card</button></div></div><div id="sres" aria-live="polite" style="margin-top:14px"></div>';
    $("s-add").onclick = function () { rows.push(["", "", "", "", "", ""]); draw(); };
    $("s-ex").onclick = function () { rows = EXAMPLE.map(function (r) { return r.slice(); }); draw(); result(); };
    $("s-go").onclick = result; draw();
  }
  root.KSSchool = { render: render, _audit: audit };
})(window);
