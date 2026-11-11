/* Nearest drop-off (route #/dropoff). Data: window.KS_DROPOFF (web/app/dropoff_data.js, built by tools/fetch_osm_dropoff.py from OpenStreetMap, ODbL).
   Rules: nothing is invented or verified; OpenStreetMap is volunteer-edited, so the page says first, and shows with numbers, how incomplete it is; a missing place is not a missing service.
   "Sort by distance" uses the browser's location only when tapped, and the position stays in the page: it is never sent anywhere. */
(function (root) {
  var D = root.KS_DROPOFF, $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var LABEL = { paper: "Paper", plastic: "Plastic", plastic_bottles: "Plastic bottles", glass_bottles: "Glass bottles", glass: "Glass", cans: "Cans", scrap_metal: "Scrap metal", aluminium: "Aluminium", batteries: "Batteries", electrical_appliances: "Electrical appliances",
    small_appliances: "Small appliances", computers: "Computers", mobile_phones: "Mobile phones", light_bulbs: "Light bulbs", fluorescent_tubes: "Fluorescent tubes", paint: "Paint", clothes: "Clothes", shoes: "Shoes", cardboard: "Cardboard", green_waste: "Garden waste", food_waste: "Food waste" };
  var SPECIAL = { batteries: 1, electrical_appliances: 1, small_appliances: 1, computers: 1, mobile_phones: 1, light_bulbs: 1, fluorescent_tubes: 1, paint: 1 };
  function lab(k) { return LABEL[k] || k.replace(/_/g, " "); }
  var S = { city: null, kind: "", q: "", here: null, all: false, msg: "" };

  function ok() { return Object.keys(D.cities).filter(function (c) { return D.cities[c].status === "ok"; }); }
  function stats(c) { var p = D.cities[c].points; return { n: p.length, named: p.filter(function (x) { return x.name; }).length, kinds: p.filter(function (x) { return x.kinds.length; }).length, hours: p.filter(function (x) { return x.hours; }).length, special: p.filter(function (x) { return x.kinds.some(function (k) { return SPECIAL[k]; }); }).length }; }
  function km(a, b) { var R = 6371, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r, h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2); return 2 * R * Math.asin(Math.sqrt(h)); }

  function filtered() {
    var c = D.cities[S.city], q = S.q.toLowerCase();
    var rows = c.points.filter(function (p) {
      if (S.kind === "__special" && !p.kinds.some(function (k) { return SPECIAL[k]; })) return false;
      if (S.kind && S.kind !== "__special" && p.kinds.indexOf(S.kind) < 0) return false;
      if (q && ((p.name || "") + " " + (p.operator || "") + " " + p.kinds.map(lab).join(" ")).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).map(function (p) { return { p: p, d: S.here ? km(S.here, p) : null }; });
    rows.sort(function (a, b) { return S.here ? a.d - b.d : (b.p.name ? 1 : 0) - (a.p.name ? 1 : 0) || String(a.p.name).localeCompare(String(b.p.name)); });
    return rows;
  }

  function render() {
    var view = $("view");
    if (!D) { view.innerHTML = '<h2>Nearest drop-off</h2><p class="sub">The drop-off data could not be loaded.</p>'; return; }
    var cities = ok();
    if (!S.city || cities.indexOf(S.city) < 0) S.city = cities.sort(function (a, b) { return stats(b).n - stats(a).n; })[0];
    var st = Object.keys(D.cities).map(function (c) { return { c: c, ok: D.cities[c].status === "ok", s: D.cities[c].status === "ok" ? stats(c) : null, why: D.cities[c].reason }; }).sort(function (a, b) { return (b.s ? b.s.n : -1) - (a.s ? a.s.n : -1); });
    view.innerHTML = '<h2>Nearest drop-off</h2><p class="sub">Find a recycling point near you, including for batteries and electronics. It comes from OpenStreetMap, which is incomplete: read how incomplete before you travel.</p>' +
      '<div class="notice"><strong>Treat this as a starting point, not a directory.</strong> OpenStreetMap is edited by volunteers. A place missing here may exist, and a place listed here may have closed or changed. We have not visited or checked any of them. Check before you travel, and add or fix places on OpenStreetMap so the next person finds them.</div>' +
      '<h3>How complete is it? Same rectangle around each city centre</h3><div class="card pad tw"><table><caption class="sr">Recycling points listed on OpenStreetMap, by city</caption><thead><tr><th scope="col">City</th><th scope="col" class="num">Points</th><th scope="col" class="num">With a name</th><th scope="col" class="num">Say what they take</th><th scope="col" class="num">Take batteries or electronics</th><th scope="col" class="num">List opening hours</th></tr></thead><tbody>' +
      st.map(function (r) { return r.ok ? "<tr><td>" + esc(r.c) + '</td><td class="num">' + r.s.n + '</td><td class="num">' + r.s.named + '</td><td class="num">' + r.s.kinds + '</td><td class="num">' + r.s.special + '</td><td class="num">' + r.s.hours + "</td></tr>" : "<tr><td>" + esc(r.c) + '</td><td colspan="5" class="note">not checked: the server did not answer (' + esc(r.why) + ")</td></tr>"; }).join("") + "</tbody></table>" +
      '<p class="note">Counted from OpenStreetMap on ' + esc(D.retrieved) + ". A very low count for a big city means OpenStreetMap is sparse there, not that the city has few drop-off points.</p></div>" +
      '<h3>Look in one city</h3><div class="card pad"><div class="grid2"><div><label for="dp-city">City</label><select id="dp-city">' + cities.map(function (c) { return '<option' + (c === S.city ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + '</select></div><div><label for="dp-q">Search name, operator or material</label><input id="dp-q" type="search" value="' + esc(S.q) + '" autocomplete="off"></div></div>' +
      '<div class="chips" id="dp-kinds" role="group" aria-label="What do you want to drop off"></div>' +
      '<p><button class="alt" id="dp-here" type="button">' + (S.here ? "Sorted by distance from you" : "Sort by distance from me") + '</button> <span class="note" id="dp-msg" role="status">' + esc(S.msg) + '</span></p><p class="note">Your position is used only in this page to sort the list. It is not sent or stored anywhere.</p>' +
      '<div id="dp-list" aria-live="polite"></div></div>' +
      '<p class="note">Data © OpenStreetMap contributors, Open Database Licence 1.0 (<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">openstreetmap.org/copyright</a>). ' + esc(D.method) + " Retrieved " + esc(D.retrieved) + ".</p>";
    $("dp-city").onchange = function () { S.city = this.value; S.kind = ""; S.all = false; render(); };
    $("dp-q").oninput = function () { S.q = this.value; S.all = false; list(); };
    $("dp-here").onclick = locate;
    list();
  }

  function kinds() {
    var c = D.cities[S.city], count = {}, special = 0;
    c.points.forEach(function (p) { p.kinds.forEach(function (k) { count[k] = (count[k] || 0) + 1; }); if (p.kinds.some(function (k) { return SPECIAL[k]; })) special++; });
    var top = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 8), nolabel = c.points.filter(function (p) { return !p.kinds.length; }).length;
    var h = ['<button class="chip" type="button" data-k="" aria-pressed="' + (S.kind === "") + '">All (' + c.points.length + ")</button>"];
    if (special) h.push('<button class="chip" type="button" data-k="__special" aria-pressed="' + (S.kind === "__special") + '">Batteries and electronics (' + special + ")</button>");
    top.forEach(function (k) { h.push('<button class="chip" type="button" data-k="' + esc(k) + '" aria-pressed="' + (S.kind === k) + '">' + esc(lab(k)) + " (" + count[k] + ")</button>"); });
    $("dp-kinds").innerHTML = h.join("") + (nolabel ? '<span class="note"> ' + nolabel + " points do not say what they take.</span>" : "");
    $("dp-kinds").querySelectorAll(".chip").forEach(function (b) { b.onclick = function () { S.kind = b.dataset.k; S.all = false; kinds(); list(); }; });
  }

  function list() {
    if (!$("dp-kinds").innerHTML) kinds();
    var rows = filtered(), shown = S.all ? rows : rows.slice(0, 15), box = $("dp-list");
    box.innerHTML = '<p class="note">' + rows.length + " of " + D.cities[S.city].points.length + " points" + (S.here ? ", nearest first" : "") + ".</p>" +
      (rows.length ? '<ul class="dplist">' + shown.map(function (r) {
        var p = r.p, id = p.id.split("/");
        return '<li class="dp"><div><b>' + esc(p.name || "Unnamed recycling point") + "</b>" + (r.d != null ? ' <span class="note">· ' + (r.d < 10 ? r.d.toFixed(1) : Math.round(r.d)) + " km away (straight line)</span>" : "") +
          '<div class="dpk">' + (p.kinds.length ? p.kinds.map(function (k) { return '<span class="tag">' + esc(lab(k)) + "</span>"; }).join("") : '<span class="note">materials not listed</span>') + "</div>" +
          '<div class="note">' + (p.operator ? "Run by " + esc(p.operator) + ". " : "") + (p.hours ? "Hours: " + esc(p.hours) + "." : "Opening hours not listed.") + "</div></div>" +
          '<div class="dpl"><a href="https://www.openstreetmap.org/' + esc(id[0]) + "/" + esc(id[1]) + '" target="_blank" rel="noopener">On OpenStreetMap</a><a href="https://www.openstreetmap.org/?mlat=' + p.lat + "&mlon=" + p.lon + "#map=18/" + p.lat + "/" + p.lon + '" target="_blank" rel="noopener">Map</a></div></li>';
      }).join("") + "</ul>" + (rows.length > 15 ? '<p><button class="link" id="dp-more" type="button">' + (S.all ? "Show fewer" : "Show all " + rows.length) + "</button></p>" : "") : '<p class="note">No point matches. That does not mean there is none: OpenStreetMap may simply not have it.</p>');
    var m = $("dp-more"); if (m) m.onclick = function () { S.all = !S.all; list(); };
  }

  function locate() {
    var msg = $("dp-msg");
    if (!navigator.geolocation) { S.msg = "This browser cannot share a location. The list stays in name order."; msg.textContent = S.msg; return; }
    msg.textContent = "Asking your browser for your location…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      var c = D.cities[S.city].bbox, lat = pos.coords.latitude, lon = pos.coords.longitude;
      S.here = { lat: lat, lon: lon };
      S.msg = (lat < c[0] || lat > c[2] || lon < c[1] || lon > c[3]) ? "You appear to be outside this city's rectangle, so these distances are to a city you are not in." : "";
      render();
    }, function () { S.msg = "Location was not shared, so the list stays in name order. Nothing was stored."; msg.textContent = S.msg; }, { timeout: 10000, maximumAge: 600000 });
  }

  root.KSDropoff = { render: render };
})(window);
