/* Your ward: garbage uptime calendar (O1), QR one-tap flow (M1) and green ward badge (M2). Route #/ward and #/ward/<ward id>.
   Rules: never invent a tap or a report. Residents' taps are labelled UNVERIFIED and are stored in this browser (localStorage).
   A tap leaves the device only when the person has signed in to share it (account.js): then it is added to the ward's shared total,
   which is shown as counts of reports, never as "verified". See docs/ward_reports.md.
   The official figures are shown beside the calendar for context; they describe a state or the country, so they are not compared with one ward.
   The pure functions at the top are exported for tests (tests/test_ward.py runs them in Node). Needs window.KS and vendor/qrcode.js in the browser. */
(function (root) {
  var WINDOW = 30, MIN_REPORTED = 20, MIN_COLLECTED_PCT = 90, MAX_BACK = 59, KEY = "ks-ward-reports-v1";
  var STATUS = { collected: "Collected", not_collected: "Not collected" };

  /* ---------- pure logic ---------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getFullYear() === +m[1] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[3] ? d : null;
  }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return ymd(d); }
  function lastDays(today, n) { var out = []; for (var i = n - 1; i >= 0; i--) out.push(addDays(today, -i)); return out; }
  function cleanPart(s) { return String(s == null ? "" : s).replace(/[\/?#%~\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60); }
  function wardId(state, city, ward) { return [cleanPart(state), cleanPart(city), cleanPart(ward)].join("~"); }
  function parseWardId(id) {
    var p = String(id || "").split("~"); if (p.length !== 3 || !p[0] || !p[1] || !p[2]) return null;
    return { state: p[0], city: p[1], ward: p[2], id: id };
  }

  /* One report per ward per day per device: a later tap for the same day replaces the earlier one (our duplicate-tap rule on this device). */
  function recordTap(list, t) {
    var st = t.status, today = t.today;
    if (!parseWardId(t.ward)) return { error: "Choose a ward first." };
    if (!STATUS[st]) return { error: "Choose collected or not collected." };
    if (!parse(t.date)) return { error: "That date is not valid." };
    if (t.date > today) return { error: "You cannot report a day that has not happened yet." };
    if (t.date < addDays(today, -MAX_BACK)) return { error: "Reports can go back " + (MAX_BACK + 1) + " days at most." };
    var replaced = false, out = list.filter(function (r) { if (r.ward === t.ward && r.date === t.date) { replaced = true; return false; } return true; });
    out.push({ ward: t.ward, date: t.date, status: st, saved_at: t.now || new Date().toISOString(), device: t.device || "" });
    return { list: out, replaced: replaced };
  }

  function summarise(list, ward, today, n) {
    n = n || WINDOW;
    var by = {}; list.forEach(function (r) { if (r.ward === ward) by[r.date] = r.status; });
    var days = lastDays(today, n).map(function (d) { return { date: d, status: by[d] || null }; });
    var c = days.filter(function (d) { return d.status === "collected"; }).length, nc = days.filter(function (d) { return d.status === "not_collected"; }).length;
    return { days: days, window: n, reported: c + nc, collected: c, notCollected: nc, noReport: n - c - nc };
  }

  /* Badge rules (a proposal for the team to confirm). Recognition, never a ranking:
     a ward is "green" when, over the last 30 days, residents reported on at least 20 days and at least 90% of the reported days were collected.
     Fewer than 20 reported days is "not enough reports", not a fail: an empty ward is never marked as failing. The 90% mark echoes the ">90%"
     door-to-door threshold used by the Swachh Bharat Mission dashboard. */
  function badge(s) {
    var pct = s.reported ? s.collected / s.reported * 100 : null;
    if (s.reported < MIN_REPORTED) return { state: "not_enough", pct: pct, need: MIN_REPORTED - s.reported };
    return { state: pct >= MIN_COLLECTED_PCT ? "green" : "not_yet", pct: pct, need: 0 };
  }

  function csvCell(v) { v = String(v == null ? "" : v); return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function toCSV(list, ward) {
    var w = parseWardId(ward) || { state: "", city: "", ward: "" }, rows = list.filter(function (r) { return !ward || r.ward === ward; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    return ["state", "city", "ward", "date", "status", "saved_at", "note"].join(",") + "\n" + rows.map(function (r) {
      var p = parseWardId(r.ward) || w; return [p.state, p.city, p.ward, r.date, r.status, r.saved_at, "unverified resident report, one device"].map(csvCell).join(",");
    }).join("\n") + (rows.length ? "\n" : "");
  }

  /* Official figures shown beside the calendar. Read from the loaded data, never typed in. */
  function officialFor(KS, state) {
    var g = null, c = null;
    (KS.waste || []).forEach(function (r) { if (r.state === state && r.year === "2023-24" && r.source_name === "CPCB") { if (r.metric === "generated") g = r; if (r.metric === "collected") c = r; } });
    var st = (KS.statements || []).filter(function (r) { return r.door_to_door_collection_pct != null; }).pop();
    var seg = (KS.segregation || []).filter(function (r) { return r.indicator.indexOf("D2D") >= 0; })[0];
    return {
      state: g && c && g.value_tpd != null && c.value_tpd != null && g.value_tpd > 0 ? { pct: Math.round(c.value_tpd / g.value_tpd * 1000) / 10, doc: c.source_doc, page: c.source_page } : null,
      mohua: st ? { pct: st.door_to_door_collection_pct, doc: st.source_doc, page: st.source_page } : null,
      wards: seg ? { pct: seg.share_pct_computed, count: seg.count, base: seg.base_stated, year: seg.year } : null
    };
  }

  var api = { ymd: ymd, parse: parse, addDays: addDays, lastDays: lastDays, cleanPart: cleanPart, wardId: wardId, parseWardId: parseWardId, recordTap: recordTap, summarise: summarise, badge: badge, toCSV: toCSV, officialFor: officialFor,
              RULES: { window: WINDOW, minReported: MIN_REPORTED, minCollectedPct: MIN_COLLECTED_PCT } };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }

  /* ---------- screens (browser only) ---------- */
  var KS = root.KS, $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function view() { return $("view"); }
  function nice(s) { return parse(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
  function states() { return Array.from(new Set(KS.waste.map(function (r) { return r.state; }))).sort(); }

  var mem = { device: "", reports: [] }, storeOK = true;
  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && Array.isArray(s.reports)) { mem = s; } storeOK = true; } catch (e) { storeOK = false; }
    if (!mem.device) mem.device = "d" + Math.random().toString(36).slice(2, 10);
    return mem;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(mem)); storeOK = true; } catch (e) { storeOK = false; } }
  function storeNote() { return storeOK ? "" : '<div class="notice">Your browser is blocking storage, so reports will be lost when you close this page. Download them to keep them.</div>'; }
  function download(name, text) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); }
  function today() { return ymd(new Date()); }

  var NOTE = '<div class="notice"><strong>Reports here are unverified.</strong> The calendar below is one resident\'s taps, kept only in this browser. A tap leaves this device only if you sign in to share it with your ward\'s total, further down; shared reports are stored without your name or email. How duplicate taps are handled: <a href="https://github.com/SriyaMeenakshi/kachra-satya/blob/main/docs/ward_reports.md" target="_blank" rel="noopener">the plan is written down</a>. Nothing is sent anywhere.</div>';

  function render(args) {
    load();
    var id = args && args[0], w = id ? parseWardId(id) : null;
    if (id && !w) { view().innerHTML = '<h2>Your ward</h2><p class="sub">That ward link is not valid.</p><p><a href="#/ward">Choose a ward</a></p>'; return; }
    if (w) wardPage(w); else wardHome();
  }

  function wardHome() {
    var st = states(), known = {};
    mem.reports.forEach(function (r) { known[r.ward] = (known[r.ward] || 0) + 1; });
    var list = Object.keys(known).map(parseWardId).filter(Boolean);
    view().innerHTML = '<h2>Your ward</h2><p class="sub">Did the garbage truck come? Tap once a day and build a calendar of what actually happened on your street, next to what the official figures say. You can also make a QR code for a ward, so neighbours can tap from their phones.</p>' + NOTE + storeNote() +
      '<div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Open or create a ward page</h3><div class="grid2"><div><label for="wst">State or UT</label><select id="wst"><option value="">Choose</option>' + st.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + '</select></div>' +
      '<div><label for="wci">City or town</label><input id="wci" maxlength="60"></div><div><label for="wwa">Ward name or number</label><input id="wwa" maxlength="60"></div></div><p><button class="go" id="wgo" type="button">Open ward page</button> <span class="err" id="werr" role="alert"></span></p></div>' +
      (list.length ? '<h3>Wards with reports on this device</h3><div class="card pad">' + list.map(function (x) { return '<p style="margin:6px 0"><a href="#/ward/' + encodeURIComponent(x.id) + '">' + esc(x.ward) + ", " + esc(x.city) + ", " + esc(x.state) + '</a> <span class="note">' + known[x.id] + " reported day" + (known[x.id] > 1 ? "s" : "") + "</span></p>"; }).join("") + "</div>" : "");
    $("wgo").onclick = function () {
      var s = $("wst").value, c = cleanPart($("wci").value), wa = cleanPart($("wwa").value);
      if (!s || !c || !wa) { $("werr").textContent = "Choose a state and fill in the city and the ward."; return; }
      location.hash = "#/ward/" + encodeURIComponent(wardId(s, c, wa));
    };
  }

  function wardPage(w) {
    var s = summarise(mem.reports, w.id, today()), b = badge(s), off = officialFor(KS, w.state), v = view();
    var official = '<div class="card pad"><h3 style="margin-top:0">What the official figures say</h3><ul class="plain">' +
      (off.state ? "<li>For <strong>" + esc(w.state) + "</strong>, CPCB's 2023-24 figures give <strong>" + off.state.pct + "%</strong> of the waste generated as collected (computed: collected divided by generated; " + esc(off.state.doc) + ", p." + esc(off.state.page) + '; <a href="#/explore/receipts/' + encodeURIComponent(w.state) + '">source pages</a>).</li>' : "<li>No collected and generated figures are reported for " + esc(w.state) + " in the CPCB 2023-24 table we hold.</li>") +
      (off.mohua ? "<li>The Housing Ministry says door-to-door collection has reached <strong>" + off.mohua.pct + "%</strong> (" + esc(off.mohua.doc) + ", p." + esc(off.mohua.page) + ").</li>" : "") +
      (off.wards ? "<li>On the Swachh Bharat Mission dashboard for " + esc(off.wards.year) + ", " + Number(off.wards.count).toLocaleString("en-IN") + " of " + Number(off.wards.base).toLocaleString("en-IN") + " wards covered (" + off.wards.pct + "%) report more than 90% door-to-door collection.</li>" : "") +
      '</ul><p class="note" style="margin-bottom:0">These describe a state or the whole country. One ward\'s taps are not directly comparable, so we do not score one against the other.</p></div>';
    var back = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return addDays(today(), -i); });
    v.innerHTML = '<p class="note"><a href="#/ward">All wards</a></p><h2>' + esc(w.ward) + '</h2><p class="sub">' + esc(w.city) + ", " + esc(w.state) + "</p>" + NOTE + storeNote() +
      '<div class="section"><h3>Did the truck come?</h3><div class="card pad"><div class="grid2" style="max-width:260px"><div><label for="wdate">Day</label><select id="wdate">' + back.map(function (d, i) { return '<option value="' + d + '">' + (i === 0 ? "Today, " : i === 1 ? "Yesterday, " : "") + nice(d) + "</option>"; }).join("") + '</select></div></div>' +
      '<p style="margin-bottom:6px"><button class="go" id="wyes" type="button">✓ The truck came</button> <button class="alt" id="wno" type="button">✗ The truck did not come</button></p><div id="wmsg" class="note" role="status" aria-live="polite"></div></div></div>' +
      '<div class="section"><h3>Last ' + WINDOW + ' days</h3><div id="wcal"></div></div>' +
      '<div class="section"><h3>Your ward&rsquo;s shared total</h3><div id="wshare"></div></div>' +
      '<div class="section"><h3>Official figures, for context</h3>' + official + "</div>" +
      '<div class="section"><h3>Green ward badge</h3><div id="wbadge"></div></div>' +
      '<div class="section" id="qrcard"><h3>QR code for this ward</h3><div class="card pad" id="wqr"></div></div>' +
      '<p><button class="alt" id="wdl" type="button">Download these reports (CSV)</button> <button class="alt" id="wclear" type="button">Delete this ward\'s reports from this device</button></p>';
    drawCal(s); drawBadge(s, b); drawQR(w); drawShare(w);
    function tap(status) {
      var r = recordTap(mem.reports, { ward: w.id, date: $("wdate").value, status: status, today: today(), device: mem.device });
      if (r.error) { $("wmsg").textContent = r.error; return; }
      mem.reports = r.list; save();
      var s2 = summarise(mem.reports, w.id, today()); drawCal(s2); drawBadge(s2, badge(s2));
      var day = $("wdate").value, said = "Saved on this device as an unverified report: " + STATUS[status].toLowerCase() + ", " + nice(day) + "." + (r.replaced ? " It replaced your earlier report for that day." : "");
      $("wmsg").textContent = said;
      var A = root.KSAccount;      /* sharing is on: the same tap also goes to the ward's total */
      if (A && A.available() && A.signedIn()) A.report(w.id, day, status).then(function () { if ($("wmsg")) $("wmsg").textContent = said + " Added to your ward's shared total."; if (drawShare.refresh) drawShare.refresh(""); }, function (e) { if ($("wmsg")) $("wmsg").textContent = said + " It could not be shared: " + e.message; if (drawShare.refresh) drawShare.refresh(""); });
    }
    $("wyes").onclick = function () { tap("collected"); }; $("wno").onclick = function () { tap("not_collected"); };
    $("wdl").onclick = function () { download("ward_reports.csv", toCSV(mem.reports, w.id)); };
    $("wclear").onclick = function () {
      if (!confirm("Delete all reports for this ward from this device? This cannot be undone.")) return;
      mem.reports = mem.reports.filter(function (r) { return r.ward !== w.id; }); save(); wardPage(w);
    };
  }

  /* The ward's shared total (account.js, agent/accounts.py). Off until a person turns it on: nothing is sent, and Google's script is not loaded, before that. */
  function drawShare(w) {
    var A = root.KSAccount, box = $("wshare"); if (!box) return;
    if (!A || A.base() === null) { box.innerHTML = '<div class="card pad"><p class="note" style="margin:0">Shared ward totals need the site&rsquo;s server, and this copy has none. Your taps stay on this device.</p></div>'; return; }
    box.innerHTML = '<div class="card pad"><p class="note" style="margin:0">Checking for a shared total&hellip;</p></div>';
    A.config().then(function (c) {
      if (!$("wshare")) return;
      if (!c.signIn) { box.innerHTML = '<div class="card pad"><p class="note" style="margin:0">Shared ward totals are not switched on for this site yet. Your taps stay on this device.</p></div>'; return; }
      paint();
    });
    function total(cb) {
      A.summary(w.id).then(function (s) { cb(A.tally(s)); }, function () { cb(null); });
    }
    function paint(msg) {
      total(function (t) {
        if (!$("wshare")) return;
        var head = t === null ? '<p class="note">The shared total could not be loaded just now.</p>'
          : t.reporters === 0 ? '<p style="margin-top:0"><strong>No one has shared a report for this ward yet.</strong> Be the first.</p>'
          : '<div class="kpis"><div class="kpi"><div class="v">' + t.reporters + '</div><div class="l">' + (t.reporters === 1 ? "person has" : "people have") + ' reported in the last 30 days</div></div><div class="kpi"><div class="v">' + t.collected + '</div><div class="l">reports that the truck came</div></div><div class="kpi"><div class="v">' + t.notCollected + '</div><div class="l">reports that it did not come</div></div></div>' +
            (t.contested ? '<p class="note">On ' + t.contested + (t.contested === 1 ? " day" : " days") + ' people disagreed. We show both counts and do not pick one.</p>' : "") +
            '<p class="note">Unverified: one report per signed-in person per day. These are counts of reports, not a measurement of the service.</p>';
        var body;
        if (A.signedIn()) {
          body = '<p><strong>Sharing is on' + (A.name() ? " for " + esc(A.name()) : "") + '.</strong> Your taps for this ward are added to the total above.</p>' +
            '<p><button class="alt" id="wsync" type="button">Share my earlier taps for this ward</button> <button class="alt" id="wout" type="button">Sign out</button> <button class="alt" id="wdelme" type="button">Delete everything I shared</button></p>';
        } else {
          body = '<p style="margin-bottom:6px"><strong>Add your taps to your ward&rsquo;s total.</strong> Sign in with Google so each person counts once.</p>' +
            '<details class="more" id="wwhat"><summary>What is stored if I sign in</summary><div><ul><li><strong>Stored:</strong> an anonymous code made from your Google account, this ward, the day, and whether the truck came.</li><li><strong>Not stored:</strong> your name, your email address, your picture or your location.</li><li>You can delete everything you shared at any time.</li><li>Google&rsquo;s sign-in script is loaded only after you press the button below.</li></ul></div></details>' +
            '<p><button class="go" id="wshareon" type="button">Turn on sharing</button></p><div id="wgbtn"></div>';
        }
        box.innerHTML = '<div class="card pad">' + head + body + '<p class="note" id="wsmsg" role="status" aria-live="polite" style="margin-bottom:0">' + esc(msg || "") + "</p></div>";
        var say = function (m) { if ($("wsmsg")) $("wsmsg").textContent = m; };
        if ($("wshareon")) $("wshareon").onclick = function () {
          this.disabled = true; say("Loading Google sign-in…");
          A.button($("wgbtn"), function (err) { if (err) say(err.message); else sync("You are signed in. "); }).then(function () { say("Press the Google button to sign in."); }, function (e) { say(e.message); if ($("wshareon")) $("wshareon").disabled = false; });
        };
        if ($("wout")) $("wout").onclick = function () { A.signOut(); paint("Signed out. Your taps stay on this device."); };
        if ($("wsync")) $("wsync").onclick = function () { sync(""); };
        if ($("wdelme")) $("wdelme").onclick = function () {
          if (!confirm("Delete every report you have shared, for all wards? This cannot be undone. Your taps on this device are kept.")) return;
          A.deleteMine().then(function (j) { paint("Deleted " + j.deleted + (j.deleted === 1 ? " shared report." : " shared reports.")); }, function (e) { paint(e.message); });
        };
      });
    }
    /* send this device's taps for this ward (the last 60 days) one by one; the server keeps one per person per day */
    function sync(prefix) {
      var mine = mem.reports.filter(function (r) { return r.ward === w.id && r.date >= addDays(today(), -MAX_BACK); }), ok = 0, i = 0;
      if (!mine.length) { paint(prefix + "You have no taps for this ward on this device yet."); return; }
      (function next() {
        if (i >= mine.length) { paint(prefix + "Shared " + ok + " of " + mine.length + (mine.length === 1 ? " tap." : " taps.")); return; }
        var r = mine[i++]; A.report(r.ward, r.date, r.status).then(function () { ok++; next(); }, function (e) { paint(prefix + "Shared " + ok + " of " + mine.length + ". " + e.message); });
      })();
    }
    drawShare.refresh = function (m) { paint(m); };
  }

  function drawCal(s) {
    var first = parse(s.days[0].date), lead = (first.getDay() + 6) % 7, cells = "";
    for (var i = 0; i < lead; i++) cells += '<div class="cd pad0" aria-hidden="true"></div>';
    s.days.forEach(function (d) {
      var cls = d.status === "collected" ? "ok" : d.status === "not_collected" ? "bad" : "no", sym = d.status === "collected" ? "✓" : d.status === "not_collected" ? "✗" : "–", lab = nice(d.date) + ": " + (d.status ? "reported " + STATUS[d.status].toLowerCase() : "no report");
      cells += '<div class="cd ' + cls + '" role="img" aria-label="' + esc(lab) + '" title="' + esc(lab) + '"><small>' + parse(d.date).getDate() + "</small><b>" + sym + "</b></div>";
    });
    $("wcal").innerHTML = '<div class="card pad">' + (s.reported ? "" : '<p style="margin-top:0"><strong>No reports yet</strong> for this ward on this device. Tap above to add the first.</p>') +
      '<div class="cal" aria-label="Calendar of reported days, oldest first"><div class="dn">Mon</div><div class="dn">Tue</div><div class="dn">Wed</div><div class="dn">Thu</div><div class="dn">Fri</div><div class="dn">Sat</div><div class="dn">Sun</div>' + cells + '</div>' +
      '<p class="note" style="margin-bottom:0">✓ reported collected · ✗ reported not collected · – no report. <strong>' + s.reported + " of " + s.window + " days have a report</strong>" + (s.reported ? " (" + s.collected + " collected, " + s.notCollected + " not collected)." : ".") + " Days without a report are unknown, not counted as missed.</p></div>";
  }

  function drawBadge(s, b) {
    var head = b.state === "green" ? "Green ward" : b.state === "not_yet" ? "Not yet a green ward" : "Not enough reports yet";
    var line = b.state === "not_enough" ? "Reports are needed on " + b.need + " more day" + (b.need === 1 ? "" : "s") + " in the last " + WINDOW + " before this ward can be assessed. A ward with few reports is not marked as failing."
      : "Over the last " + WINDOW + " days, " + s.collected + " of " + s.reported + " reported days (" + Math.round(b.pct) + "%) were collected.";
    $("wbadge").innerHTML = '<div class="card pad badgebox ' + b.state + '"><svg class="bdg" viewBox="0 0 64 72" aria-hidden="true"><path d="M32 3 59 13v22c0 17-11 29-27 34C16 64 5 52 5 35V13z" style="fill:var(--badge-fill);stroke:var(--badge-line);stroke-width:3"/><path d="M20 36l8 8 17-18" fill="none" style="stroke:var(--badge-line);stroke-width:5;stroke-linecap:round;stroke-linejoin:round;opacity:' + (b.state === "green" ? 1 : .25) + '"/></svg>' +
      '<div><div class="bt">' + head + '</div><div>' + line + '</div><details class="more"><summary>How the badge works</summary><div>A ward earns the badge when, over the last ' + WINDOW + ' days, residents reported on at least ' + MIN_REPORTED + ' days and at least ' + MIN_COLLECTED_PCT + '% of those days were collected. The 90% mark echoes the ">90%" door-to-door threshold on the Swachh Bharat Mission dashboard. This is a proposal, not a government award. It rests on unverified resident reports, so it is recognition for a ward, never a ranking: we show no league table and never compare wards.</div></details></div></div>';
  }

  function drawQR(w) {
    var host = location.hostname, local = !host || /^(localhost|127\.|\[::1\])/.test(host) || location.protocol === "file:", pub = (root.KS_CONFIG && root.KS_CONFIG.publicBase) || "";
    $("wqr").innerHTML = '<p style="margin-top:0">Print this and put it on a bin or a truck. A neighbour who scans it lands on this ward page and can tap whether the truck came. <strong>Each scan is a separate device. Their taps stay on their own phone unless they sign in to share them with the ward&rsquo;s total.</strong></p>' +
      '<label for="wbase">Public address of the site</label><input id="wbase" value="' + esc(local && pub ? pub : location.href.split("#")[0]) + '">' +
      (local ? (pub ? '<p class="note">You are on a test copy of the site, so the QR code points to the live site instead of this computer.</p>' : '<p class="err">This address only works on this computer. Replace it with the public address of the deployed site before printing.</p>') : "") +
      '<div id="wsvg" class="qrbox"></div><p class="note" id="wlink"></p><p><button class="alt" id="wprint" type="button">Print this QR code</button></p>';
    function draw() {
      var url = $("wbase").value.trim().split("#")[0] + "#/ward/" + encodeURIComponent(w.id);
      try { var q = root.qrcode(0, "M"); q.addData(url); q.make(); $("wsvg").innerHTML = q.createSvgTag({ cellSize: 6, margin: 4, scalable: true, title: "QR code for the ward page of " + w.ward, alt: "Opens " + url }) + '<div class="qrcap"><strong>Did the truck come?</strong><br>' + esc(w.ward) + ", " + esc(w.city) + '<br><span>Scan to tap collected or not collected. Reports are unverified.</span></div>'; $("wlink").textContent = url; }
      catch (e) { $("wsvg").textContent = "Could not make a QR code for that address."; }
    }
    $("wbase").oninput = draw; draw();
    $("wprint").onclick = function () { document.body.classList.add("print-qr"); window.print(); setTimeout(function () { document.body.classList.remove("print-qr"); }, 500); };
  }

  root.KSWard = { render: render };
  Object.keys(api).forEach(function (k) { root.KSWard[k] = api[k]; });
})(typeof window !== "undefined" ? window : this);
