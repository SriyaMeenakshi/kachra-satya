/* Kachra Saathi: the Start page (the loop) and Get help (complaint writer, log, escalation letter, which bin, bulk generator).
   app.js calls KSSaathi.renderStart and KSSaathi.renderHelp; this file only needs window.KS (the data) and the #view element.
   Rules: never invent data; we draft text, we never send anything; the log lives only in this browser (localStorage).
   Official facts used: PIB release of 28 Jan 2026 (SWM Rules, 2026) and MoHUA Annual Report 2025-26 p.29 (via data/mohua_statements.csv). */
(function (root) {
  var KS = root.KS, $ = function (i) { return document.getElementById(i); };
  var PIB = "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2219676&reg=3&lang=1";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function view() { return $("view"); }
  function today() { return new Date().toISOString().slice(0, 10); }
  function daysBetween(a, b) { var d = (new Date(b) - new Date(a)) / 86400000; return isFinite(d) ? Math.max(0, Math.round(d)) : null; }
  function fmtDate(s) { return s ? new Date(s + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""; }

  /* ---------- storage: the log stays in this browser; if storage is blocked we keep it in memory and say so ---------- */
  var KEY = "ks-complaints", mem = [], storeOK = true;
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { storeOK = false; return mem; } }
  function save(list) { mem = list; try { localStorage.setItem(KEY, JSON.stringify(list)); storeOK = true; } catch (e) { storeOK = false; } }
  function storeNote() { return storeOK ? "" : '<div class="notice">Your browser is blocking storage, so this log will be lost when you close the page. Download it as a file to keep it.</div>'; }
  function download(name, text, type) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: type || "text/plain" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function copy(text, btn) { var done = function () { var o = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = o; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {}); else { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} t.remove(); } }

  /* ---------- the official facts (PIB, 28 Jan 2026) ---------- */
  var STREAMS = [
    { id: "wet", name: "Wet waste", hi: "गीला कचरा", ta: "ஈரக் கழிவு", te: "తడి వ్యర్థాలు", cls: "wet",
      items: ["kitchen waste", "vegetables", "fruit peels", "meat", "flowers"], handle: "Composted or processed through bio-methanation at the nearest facility." },
    { id: "dry", name: "Dry waste", hi: "सूखा कचरा", ta: "உலர் கழிவு", te: "పొడి వ్యర్థాలు", cls: "dry",
      items: ["plastic", "paper", "metal", "glass", "wood", "rubber"], handle: "Taken to a Material Recovery Facility (MRF) for sorting and recycling." },
    { id: "sanitary", name: "Sanitary waste", hi: "सैनिटरी कचरा", ta: "சுகாதாரக் கழிவு", te: "శానిటరీ వ్యర్థాలు", cls: "sanitary",
      items: ["used diapers", "sanitary towels", "tampons", "condoms"], handle: "Securely wrapped and stored separately." },
    { id: "special", name: "Special care waste", hi: "विशेष देखभाल वाला कचरा", ta: "சிறப்பு கவனிப்பு கழிவு", te: "ప్రత్యేక శ్రద్ధ వ్యర్థాలు", cls: "special",
      items: ["paint cans", "bulbs", "mercury thermometers", "medicines"], handle: "Collected by authorised agencies or deposited at designated collection centres." }
  ];
  var ALIAS = { "diaper": "used diapers", "diapers": "used diapers", "nappy": "used diapers", "sanitary pad": "sanitary towels", "sanitary pads": "sanitary towels", "pad": "sanitary towels",
    "tablet": "medicines", "medicine": "medicines", "tablets": "medicines", "bulb": "bulbs", "light bulb": "bulbs", "thermometer": "mercury thermometers", "paint": "paint cans", "paint can": "paint cans",
    "peel": "fruit peels", "vegetable": "vegetables", "flower": "flowers", "bottle": "plastic", "plastic bottle": "plastic", "newspaper": "paper", "cardboard": "paper", "tin": "metal", "can": "metal" };
  /* Which stream does a typed item belong to? Only items the official notice lists (or a plain alias of one) match; whole words only; otherwise null. */
  function wordIn(needle, hay) { return new RegExp("(^|[^a-z])" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(s|es)?($|[^a-z])").test(hay); }
  function match(q) {
    q = String(q || "").trim().toLowerCase(); if (q.length < 3) return null;
    var items = []; STREAMS.forEach(function (s) { s.items.forEach(function (i) { items.push([i, s]); }); });
    var term = ALIAS[q];
    if (term) { for (var a = 0; a < items.length; a++) if (items[a][0] === term) return items[a]; }
    for (var i = 0; i < items.length; i++) if (items[i][0] === q || wordIn(items[i][0], q)) return items[i];          /* "plastic bottle" contains "plastic" */
    var keys = Object.keys(ALIAS).sort(function (x, y) { return y.length - x.length; });
    for (var k = 0; k < keys.length; k++) if (wordIn(keys[k], q)) { for (var b = 0; b < items.length; b++) if (items[b][0] === ALIAS[keys[k]]) return items[b]; }
    for (var j = 0; j < items.length; j++) if (q.length >= 4 && wordIn(q, items[j][0])) return items[j];                 /* "diapers" inside "used diapers" */
    return null;
  }
  var ISSUES = ["Garbage dump (waste lying uncollected)", "Garbage vehicle did not arrive", "Dustbin not cleaned or overflowing", "Other garbage problem"];

  /* ---------- Start: the loop ---------- */
  function natVal(y, src, m) { var r = KS.national.filter(function (x) { return x.year === y && x.source_name === src && x.metric === m && x.state === "India"; })[0]; return r ? r.value : null; }
  function renderStart() {
    if (root.KSOpening) return root.KSOpening.render();      /* the receipt-themed opening (opening.js); the plain version below is the fallback */
    var cg = natVal("2023-24", "CPCB", "generated"), ct = natVal("2023-24", "CPCB", "treated"), cp = cg && ct ? Math.round(ct / cg * 100) : null;
    var st = KS.statements[KS.statements.length - 1], mp = st && st.processed_pct_stated != null ? Math.round(st.processed_pct_stated) : null;
    view().innerHTML = '<div class="start-hero"><h1>A receipt for every waste promise</h1><p class="sub">See what was promised, what was delivered, and what to do about it.</p></div>' +
      '<div class="card pad"><p style="margin:0;font-size:1.1rem"><strong>Out of every 100 kg</strong> of urban waste, the Housing Ministry says <strong>' + (mp == null ? "not reported" : mp + " kg") + '</strong> is processed. The pollution control board\'s state records show about <strong>' + (cp == null ? "not reported" : cp + " kg") + '</strong> treated. <span class="mini">Different years, and the two may not define the word the same way. We do not say which is right.</span></p></div>' +
      '<div class="loop">' +
      step(1, "Promise", "What did they say? Check any number someone quoted against every source we hold.", "#/claim", "Check a claim") +
      step(2, "Proof", "Every figure opens the page it came from. Where sources disagree, we say so.", "#/explore/receipts", "Open a receipt") +
      step(3, "Reality", "Is it true on your street? Audit your own ward or city data. Daily \"did the truck come\" reporting is not built yet, so no reports exist.", "#/city", "Audit your city") +
      step(4, "Action", "Get garbage moving: write the complaint, keep a log, send an escalation letter, learn which bin.", "#/help", "Get help") + "</div>" +
      '<h2 style="margin-top:8px">Start with what you need</h2><div class="quick">' +
      '<a href="#/help/complain">My garbage is not being collected<span>Write a clear complaint and keep track of it</span></a>' +
      '<a href="#/help/bins">Which bin does this go in?<span>The four streams under the 2026 rules</span></a>' +
      '<a href="#/claim">Someone quoted a number<span>See who agrees and who does not</span></a>' +
      '<a href="#/brief/card">Explain my state in plain words<span>A shareable card and a briefing for an MP, MLA or councillor</span></a>' +
      '<a href="#/school">Our school wants to weigh its waste<span>A week of weighing becomes a report card</span></a>' +
      '<a href="#/map">How is my state doing?<span>The map, with the source for every figure</span></a></div>' +
      '<p class="note">We draft complaints and letters; we never send anything, and your log stays in your browser. This site checks consistency between reports, not what is on your street.</p>';
  }
  function step(n, t, p, href, label) { return '<div class="card step"><span class="n" aria-hidden="true">' + n + "</span><h3>" + t + "</h3><p>" + p + '</p><a class="go2" href="' + href + '">' + label + " &rarr;</a></div>"; }

  /* ---------- Get help ---------- */
  var TABS = [["complain", "Write a complaint"], ["log", "My log"], ["escalate", "Escalation letter"], ["bins", "Which bin"], ["bulk", "Bulk generator?"]];
  function renderHelp(tab, args) {
    tab = TABS.some(function (t) { return t[0] === tab; }) ? tab : "complain";
    view().innerHTML = '<h2>Get help</h2><p class="sub">Practical steps when waste is not being handled. We draft the text; you send it.</p><nav class="tabs" aria-label="Help sections">' +
      TABS.map(function (t) { return '<a href="#/help/' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : "") + ">" + t[1] + "</a>"; }).join("") + '</nav><div id="htab"></div>';
    ({ complain: tabComplain, log: tabLog, escalate: tabEscalate, bins: tabBins, bulk: tabBulk })[tab]($("htab"), (args || []).slice(1));
    view().insertAdjacentHTML("beforeend", '<div class="card pad noprint" style="margin-top:18px"><h3 style="margin-top:0">More tools</h3><div class="quick" style="margin:0"><a href="#/brief/card">State card<span>The two official numbers for a state in plain words, to share</span></a><a href="#/brief/briefing">Briefing for an MP, MLA or councillor<span>One page with sourced questions to put</span></a><a href="#/school">School waste challenge<span>Weigh a week of waste and get a report card</span></a></div></div>');
  }

  function tabComplain(el) {
    el.innerHTML = '<div class="card pad"><div class="grid2"><div><label for="c-city">City or town</label><input id="c-city" type="text" autocomplete="off"></div>' +
      '<div><label for="c-area">Area, street or landmark</label><input id="c-area" type="text" autocomplete="off"></div>' +
      '<div><label for="c-issue">What is the problem</label><select id="c-issue">' + ISSUES.map(function (i) { return "<option>" + i + "</option>"; }).join("") + '</select></div>' +
      '<div><label for="c-since">Since when (date)</label><input id="c-since" type="date" max="' + today() + '"></div></div>' +
      '<label for="c-det" style="margin-top:10px">Anything else (optional)</label><textarea id="c-det" rows="2" placeholder="For example: the truck used to come before 8 am"></textarea>' +
      '<div class="rowbtn"><button class="go" id="c-go" type="button">Write my complaint</button></div><div id="c-out" aria-live="polite"></div></div>' +
      '<div class="card pad" style="margin-top:14px"><h3 style="margin-top:0">Where to file it</h3><p>The official citizen complaint channel is the <a href="https://sbmurban.org/swachhtha-app">Swachhata-MoHUA app</a>. Public descriptions say you post a photo and location, the complaint goes to the local civic body, the official uploads a photo as proof when it is resolved, and you can reopen it if you are not satisfied.</p>' +
      '<ol class="steps"><li>Open the app and choose the garbage-related category that fits.</li><li>Take a photo of the problem in the app and add the landmark.</li><li>Paste the text we wrote into the description.</li><li>Note the complaint number, then save it in <a href="#/help/log">your log</a>.</li></ol>' +
      '<p class="mini">Check the app for its exact category names and how long it says resolution takes; we have not verified those. The ministry\'s resolution figures count tickets closed by the civic body, not residents satisfied.</p></div>';
    $("c-go").onclick = function () {
      var city = $("c-city").value.trim(), area = $("c-area").value.trim(), since = $("c-since").value, det = $("c-det").value.trim(), issue = $("c-issue").value;
      if (!city || !area) { $("c-out").innerHTML = '<p class="note" role="alert">Please add the city and the area or landmark.</p>'; return; }
      var n = since ? daysBetween(since, today()) : null;
      var text = "Complaint: " + issue + "\nLocation: " + area + ", " + city + "\n" + (since ? "Problem since: " + fmtDate(since) + " (" + n + " day" + (n === 1 ? "" : "s") + " so far)\n" : "") +
        (det ? "Details: " + det + "\n" : "") + "\nWaste has not been dealt with at this location. A photo taken at the spot is attached. Please arrange collection or cleaning, and update the complaint status with a photo showing it was resolved.\n\nDate: " + fmtDate(today());
      $("c-out").innerHTML = '<label for="c-text" style="margin-top:12px">Your complaint text (edit it if you like)</label><textarea class="out" id="c-text">' + esc(text) + '</textarea>' +
        '<div class="rowbtn"><button class="alt" id="c-copy" type="button">Copy text</button><button class="alt" id="c-save" type="button">Save to my log</button></div><div id="c-msg" class="mini" role="status"></div>';
      $("c-copy").onclick = function () { copy($("c-text").value, this); };
      $("c-save").onclick = function () { var l = load(); l.push({ id: String(Date.now()), filed: today(), since: since || "", city: city, area: area, issue: issue, ticket: "", status: "Open", notes: "" }); save(l); $("c-msg").innerHTML = "Saved. <a href=\"#/help/log\">Open your log</a> to add the complaint number once you have filed it." + storeNote(); };
    };
  }

  function tabLog(el) {
    var l = load();
    el.innerHTML = storeNote() + '<div class="card pad"><p class="mini" style="margin-top:0">Stays in this browser only; we do not upload it. Download it to keep a copy or share it.</p>' +
      (l.length ? '<div class="tw"><table class="logtbl"><thead><tr><th>Filed</th><th>Where</th><th>Problem</th><th>Complaint no.</th><th>Status</th><th class="num">Days open</th><th></th></tr></thead><tbody>' +
        l.map(function (r) { var open = r.status !== "Resolved", age = open ? daysBetween(r.filed, today()) : null;
          return '<tr data-id="' + esc(r.id) + '"><td>' + esc(r.filed) + "</td><td>" + esc(r.area) + ", " + esc(r.city) + "</td><td>" + esc(r.issue) + '</td><td><input class="tk" type="text" value="' + esc(r.ticket) + '" aria-label="Complaint number" style="width:9em"></td>' +
            '<td><select class="st" aria-label="Status">' + ["Open", "Resolved", "Reopened"].map(function (s) { return "<option" + (s === r.status ? " selected" : "") + ">" + s + "</option>"; }).join("") + '</select></td><td class="num age">' + (age == null ? "&ndash;" : age) + '</td><td><a href="#/help/escalate/' + esc(r.id) + '">Write letter</a> <button class="link del" type="button">Delete</button></td></tr>'; }).join("") +
        '</tbody></table></div><div class="rowbtn"><button class="alt" id="l-csv" type="button">Download as CSV</button></div>'
        : '<p class="note">Nothing here yet. <a href="#/help/complain">Write a complaint</a> and save it, and it will appear here.</p>') + "</div>";
    el.querySelectorAll("tr[data-id]").forEach(function (tr) {
      var id = tr.dataset.id;
      function upd(f) { var l2 = load(); l2.forEach(function (r) { if (r.id === id) f(r); }); save(l2); }
      tr.querySelector(".tk").onchange = function () { var v = this.value; upd(function (r) { r.ticket = v; }); };
      tr.querySelector(".st").onchange = function () { var v = this.value; upd(function (r) { r.status = v; }); renderHelp("log"); };
      tr.querySelector(".del").onclick = function () { if (confirm("Delete this entry from your log?")) { save(load().filter(function (r) { return r.id !== id; })); renderHelp("log"); } };
    });
    if ($("l-csv")) $("l-csv").onclick = function () {
      var q = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
      download("kachra_complaint_log.csv", ["filed,city,area,problem,complaint_number,status,notes"].concat(load().map(function (r) { return [r.filed, r.city, r.area, r.issue, r.ticket, r.status, r.notes].map(q).join(","); })).join("\n") + "\n", "text/csv");
    };
  }

  function claimLine(state) {
    if (!state) return "";
    function f(y, s, m) { var r = KS.waste.filter(function (x) { return x.state === state && x.year === y && x.source_name === s && x.metric === m; })[0]; return r && r.value_tpd != null ? r.value_tpd : null; }
    var cg = f("2023-24", "CPCB", "generated"), ct = f("2023-24", "CPCB", "treated"), mg = f("2025-26", "MoHUA", "generated"), mt = f("2025-26", "MoHUA", "treated");
    if (!(cg && ct != null && mg && mt != null)) return "For " + state + ", the figures we hold are incomplete (not reported by one of the sources), so we do not quote a comparison.";
    return "For " + state + ", the Ministry of Housing and Urban Affairs reports about " + Math.round(mt / mg * 100) + " kg of every 100 kg of waste processed (2025-26, Rajya Sabha Unstarred Question 2433), while the Central Pollution Control Board's figures for 2023-24 show about " + Math.round(ct / cg * 100) + " kg treated (Lok Sabha Unstarred Question 50, 1 December 2025). These two sources describe different years and disagree.";
  }

  function tabEscalate(el, args) {
    var l = load(), pre = args && args[0] ? l.filter(function (r) { return r.id === args[0]; })[0] : null;
    var states = Array.from(new Set(KS.waste.map(function (r) { return r.state; }))).sort();
    el.innerHTML = '<div class="card pad"><p class="mini" style="margin-top:0">For a complaint that stays unresolved. This is a draft for you to review and send yourself, by post, email or the municipal office. It is not legal advice.</p>' +
      '<label for="e-pick">Use an entry from your log</label><select id="e-pick"><option value="">(or fill in below)</option>' + l.map(function (r) { return '<option value="' + esc(r.id) + '"' + (pre && pre.id === r.id ? " selected" : "") + ">" + esc(r.filed + ": " + r.area + ", " + r.city) + "</option>"; }).join("") + "</select>" +
      '<div class="grid2" style="margin-top:10px"><div><label for="e-city">City or town</label><input id="e-city" type="text"></div><div><label for="e-area">Area or landmark</label><input id="e-area" type="text"></div>' +
      '<div><label for="e-issue">Problem</label><select id="e-issue">' + ISSUES.map(function (i) { return "<option>" + i + "</option>"; }).join("") + '</select></div><div><label for="e-date">Date you filed</label><input id="e-date" type="date" max="' + today() + '"></div>' +
      '<div><label for="e-since">Problem since (optional)</label><input id="e-since" type="date" max="' + today() + '"></div><div><label for="e-tk">Complaint number</label><input id="e-tk" type="text"></div><div><label for="e-days">Ask for action within (days)</label><input id="e-days" type="number" min="1" value="7"></div>' +
      '<div><label for="e-state">State (to cite the official figures)</label><select id="e-state"><option value="">Do not include</option>' + states.map(function (s) { return "<option>" + esc(s) + "</option>"; }).join("") + '</select></div><div><label for="e-name">Your name</label><input id="e-name" type="text"></div></div>' +
      '<div class="rowbtn"><button class="go" id="e-go" type="button">Write the letter</button></div><div id="e-out" aria-live="polite"></div></div>';
    function fill(r) { if (!r) return; $("e-city").value = r.city; $("e-area").value = r.area; $("e-issue").value = r.issue; $("e-date").value = r.filed; $("e-tk").value = r.ticket || ""; $("e-since").value = r.since || ""; }
    fill(pre); $("e-pick").onchange = function () { fill(l.filter(function (r) { return r.id === $("e-pick").value; })[0]); };
    $("e-go").onclick = function () {
      var since = $("e-since").value, city = $("e-city").value.trim(), area = $("e-area").value.trim(), date = $("e-date").value, tk = $("e-tk").value.trim(), days = $("e-days").value || "7", name = $("e-name").value.trim(), issue = $("e-issue").value;
      if (!city || !area || !date) { $("e-out").innerHTML = '<p class="note" role="alert">Please add the city, the area and the date you filed.</p>'; return; }
      var n = daysBetween(date, today()), cl = claimLine($("e-state").value);
      var text = "To,\nThe Municipal Commissioner,\n" + city + "\n\nDate: " + fmtDate(today()) + "\n\nSubject: Unresolved solid waste complaint" + (tk ? " no. " + tk : "") + " at " + area + "\n\nSir or Madam,\n\n" +
        "I filed a complaint about \"" + issue.toLowerCase() + "\" at " + area + ", " + city + " on " + fmtDate(date) + (tk ? " (complaint number " + tk + ", Swachhata-MoHUA app)" : "") + ". " + (n > 0 ? "It has remained unresolved for " + n + " day" + (n === 1 ? "" : "s") + "." : "It has not yet been resolved.") + (since ? " The problem itself has existed since " + fmtDate(since) + "." : "") + "\n\n" +
        "The Solid Waste Management Rules, 2026, which came into force on 1 April 2026, make local bodies responsible for the collection, segregation and transportation of solid waste (Ministry of Environment, Forest and Climate Change, press release of 28 January 2026). " +
        "The Ministry of Housing and Urban Affairs reports that door-to-door collection has reached 97% (MoHUA Annual Report 2025-26, section 4.13)." + (cl ? " " + cl : "") + "\n\n" +
        "I request that the waste at this location be cleared within " + days + " days, and that I be told in writing what action was taken.\n\nYours faithfully,\n" + (name || "[your name]") + "\n[your address and phone number]";
      $("e-out").innerHTML = '<label for="e-text" style="margin-top:12px">Your letter (edit before sending)</label><textarea class="out" id="e-text" style="min-height:330px">' + esc(text) + '</textarea><div class="rowbtn"><button class="alt" id="e-copy" type="button">Copy text</button><button class="alt" id="e-dl" type="button">Download as .txt</button></div>' +
        '<p class="mini">We cite published sources only; check each line is true for your case before you send it. We do not send anything.</p>';
      $("e-copy").onclick = function () { copy($("e-text").value, this); }; $("e-dl").onclick = function () { download("escalation_letter.txt", $("e-text").value); };
    };
  }

  function tabBins(el) {
    var all = []; STREAMS.forEach(function (s) { s.items.forEach(function (i) { all.push([i, s]); }); });
    el.innerHTML = '<p class="sub" style="margin-top:0">Since 1 April 2026, waste must be separated at source into four streams (SWM Rules, 2026). Source: <a href="' + PIB + '">Press Information Bureau, 28 January 2026</a>.</p>' +
      '<div class="streams">' + STREAMS.map(function (s) { return '<div class="stream ' + s.cls + '"><h4>' + s.name + '</h4><div class="loc" lang="hi">' + s.hi + ' · <span lang="ta">' + s.ta + '</span> · <span lang="te">' + s.te + '</span></div><p><strong>Examples:</strong> ' + s.items.join(", ") + '.</p><p>' + s.handle + "</p></div>"; }).join("") + "</div>" +
      '<p class="mini">Hindi, Tamil and Telugu names are provisional and need checking by a native speaker before wide use.</p>' +
      '<div class="card pad"><label for="b-q">Which bin does this go in?</label><div class="ask"><input id="b-q" type="text" placeholder="e.g. used diapers, bulb, plastic bottle" autocomplete="off"><button class="go" id="b-go" type="button">Find</button></div><div id="b-out" aria-live="polite"></div></div>';
    function find() {
      var q = $("b-q").value.trim().toLowerCase(); if (!q) return;
      var hit = match(q);
      $("b-out").innerHTML = hit ? '<div class="answer"><strong>' + esc(q) + "</strong> goes in <strong>" + hit[1].name + "</strong> (the notice lists \"" + esc(hit[0]) + "\" there). " + hit[1].handle + "</div>"
        : '<div class="answer no"><strong>"' + esc(q) + '" is not in the list we have from the official notice.</strong> We do not guess. Ask your local body or its helpline which stream it belongs to.</div>';
    }
    $("b-go").onclick = find; $("b-q").onkeydown = function (e) { if (e.key === "Enter") find(); };
  }

  function tabBulk(el) {
    el.innerHTML = '<p class="sub" style="margin-top:0">Under the SWM Rules, 2026 a bulk waste generator has extra duties. Check the definition for your building, institution or business. Source: <a href="' + PIB + '">PIB, 28 January 2026</a>.</p>' +
      '<div class="card pad"><div class="grid2"><div><label for="k-area">Floor area (square metres)</label><input id="k-area" type="number" min="0"></div><div><label for="k-water">Water use (litres per day)</label><input id="k-water" type="number" min="0"></div><div><label for="k-waste">Solid waste (kg per day)</label><input id="k-waste" type="number" min="0"></div></div>' +
      '<div class="rowbtn"><button class="go" id="k-go" type="button">Check</button></div><div id="k-out" aria-live="polite"></div></div>' +
      '<p class="mini">Leave a box empty if you do not know it. We do not estimate it for you.</p>';
    $("k-go").onclick = function () {
      var a = parseFloat($("k-area").value), w = parseFloat($("k-water").value), s = parseFloat($("k-waste").value), why = [];
      if (a >= 20000) why.push("floor area of 20,000 square metres or more"); if (w >= 40000) why.push("water use of 40,000 litres a day or more"); if (s >= 100) why.push("solid waste of 100 kg a day or more");
      var known = [a, w, s].some(function (x) { return !isNaN(x); });
      $("k-out").innerHTML = !known ? '<p class="note" role="alert">Enter at least one figure.</p>' : why.length
        ? '<div class="answer"><strong>This meets the bulk waste generator definition</strong>: ' + why.join("; ") + ". The notice says bulk generators must make sure their waste is collected, transported and processed in an environmentally sound way, process wet waste on site as far as possible or obtain an EBWGR certificate where that is not feasible, and may be charged user fees under local bye-laws. Read the notification itself for the exact duties before acting.</div>"
        : '<div class="answer no"><strong>Not on the figures you gave.</strong> The definition is any one of: 20,000 square metres of floor area, 40,000 litres of water a day, or 100 kg of solid waste a day. If you left a box empty, one of those may still apply.</div>';
    };
  }

  root.KSSaathi = { renderStart: renderStart, renderHelp: renderHelp, _claimLine: claimLine, _STREAMS: STREAMS, _match: match };
})(window);
