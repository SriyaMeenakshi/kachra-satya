/* State card (plain language, shareable) and Briefing for people with leverage (MP, MLA, councillor, reporter).
   Route #/brief/<card|briefing>/<state>. Uses window.KS only. Rules: figures only from the data; "not reported" when missing; "the sources disagree",
   never "wrong"; we draft text, we never send. Receipt buttons carry data-rkey and are wired by app.js after render. */
(function (root) {
  var KS = root.KS, $ = function (i) { return document.getElementById(i); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function n0(v) { return v == null ? "not reported" : Math.round(v).toLocaleString("en-IN"); }
  function download(name, text) { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function copy(text, btn) { var done = function () { var o = btn.textContent; btn.textContent = "Copied"; setTimeout(function () { btn.textContent = o; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {}); else { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} t.remove(); } }
  var STATES = Array.from(new Set(KS.waste.map(function (r) { return r.state; }))).sort();
  var PER_PERSON_G = 155.87;   /* grams per person per day, India average, CPCB Annual Report 2022-23, page 8 (cpcb_2022-23.pdf) */

  function val(state, year, src, metric) { var r = KS.waste.filter(function (x) { return x.state === state && x.year === year && x.source_name === src && x.metric === metric; })[0]; return r && r.value_tpd != null ? r.value_tpd : null; }
  function facts(state) {
    var cg = val(state, "2023-24", "CPCB", "generated"), cc = val(state, "2023-24", "CPCB", "collected"), ct = val(state, "2023-24", "CPCB", "treated"),
        mg = val(state, "2025-26", "MoHUA", "generated"), mt = val(state, "2025-26", "MoHUA", "treated");
    var money = KS.money.filter(function (m) { return m.state === state; })[0] || null;
    var fl = KS.flags.filter(function (f) { return f.state === state && f.rule.indexOf("3_") !== 0; });
    var ind = KS.indicators.filter(function (i) { return i.state === state && i.year === "2023-24"; })[0] || null;
    return { state: state, cg: cg, cc: cc, ct: ct, mg: mg, mt: mt, cpcb: cg && ct != null ? ct / cg * 100 : null, mohua: mg && mt != null ? mt / mg * 100 : null,
             coll: cg && cc != null ? cc / cg * 100 : null, money: money, flags: fl, ind: ind };
  }
  function kg(p) { return p == null ? "not reported" : Math.round(p) + " kg"; }
  function rk(key) { var r = KS.receipts[key]; return r && r.image ? ' <button class="link" type="button" data-rkey="' + esc(key) + '">source page</button>' : ""; }
  function ranges(fl) { var rules = {}; fl.forEach(function (f) { (rules[f.rule] = rules[f.rule] || []).push(f.year); }); return rules; }
  var RULETXT = { "6_treated_gt_collected": "reports more waste treated than collected", "2_collected_gt_generated": "reports more waste collected than generated",
    "1_treated_plus_landfilled_gt_generated": "reports treated plus landfilled waste above the waste generated", "4_metric_missing": "leaves a figure unreported that it reports in other years", "5_national_vs_state_sum": "has state figures that do not add up to the printed national total" };

  /* ---------- plain-language card ---------- */
  function cardText(f, link) {
    var t = f.state + ": the two official waste numbers\n\nOut of every 100 kg of waste in " + f.state + ":\n" +
      "- Housing Ministry (MoHUA, 2025-26): " + kg(f.mohua) + " processed\n- Pollution Control Board (CPCB, 2023-24): " + kg(f.cpcb) + " treated\n" +
      "These are different years and the two may define the word differently. The sources disagree; we do not say which is right.\n";
    if (f.coll != null) t += "\nCollection (CPCB 2023-24): " + kg(f.coll) + " of every 100 kg is collected.\n";
    var kinds = Object.keys(ranges(f.flags)).filter(function (k) { return RULETXT[k]; });
    if (kinds.length) t += "\nWithin CPCB's own reports, " + f.state + " " + kinds.map(function (k) { return RULETXT[k] + " (" + Array.from(new Set(ranges(f.flags)[k])).sort().join(", ") + ")"; }).join("; ") + ".\n";
    if (f.money) t += "\nMoney: about " + f.money.swm_utilisation_pct + "% of the solid-waste allocation (2021-2026) had been used by 25 Nov 2024 (Lok Sabha Q682).\n";
    return t + "\nEvery figure has a source page: " + link;
  }
  function renderCard(el, state) {
    var f = facts(state), link = location.origin && location.origin !== "null" ? location.origin + location.pathname + "#/brief/card/" + encodeURIComponent(state) : "(link to this page)";
    var txt = cardText(f, link), kinds = Object.keys(ranges(f.flags)).filter(function (k) { return RULETXT[k]; });
    el.innerHTML = '<div class="card pad scard" id="scard"><div class="mini">State card</div><h2 style="margin:2px 0 10px">' + esc(state) + '</h2>' +
      '<p class="plain">Out of every <strong>100 kg</strong> of waste in ' + esc(state) + ':</p>' +
      '<div class="duo"><div><div class="big">' + (f.mohua == null ? "&ndash;" : Math.round(f.mohua)) + '<small> kg</small></div><div>processed, says the Housing Ministry</div><div class="mini">2025-26' + rk(state + "|2025-26|treated|mohua_81pct_answer.pdf") + '</div></div>' +
      '<div><div class="big b">' + (f.cpcb == null ? "&ndash;" : Math.round(f.cpcb)) + '<small> kg</small></div><div>treated, in the pollution board\'s records</div><div class="mini">2023-24' + rk(state + "|2023-24|treated|ls_au50_2025-12-01.pdf") + '</div></div></div>' +
      '<p class="mini">Different years, and the two may not define the word the same way. The sources disagree; we do not say which is right.</p>' +
      (f.coll != null ? '<p><strong>' + Math.round(f.coll) + ' kg</strong> of every 100 kg is collected (CPCB 2023-24).</p>' : "") +
      (kinds.length ? '<p>Within CPCB\'s own reports, ' + esc(state) + " " + kinds.map(function (k) { return esc(RULETXT[k]) + " (" + esc(Array.from(new Set(ranges(f.flags)[k])).sort().join(", ")) + ")"; }).join("; ") + ".</p>" : "") +
      (f.money ? '<p>Money: about <strong>' + f.money.swm_utilisation_pct + '%</strong> of its solid-waste allocation (2021-2026) was used by 25 Nov 2024. <span class="mini">The table prints no unit; we use only the share.</span></p>' : "") +
      '<p class="mini">For scale: India\'s average is about ' + Math.round(PER_PERSON_G) + ' grams of waste per person per day (CPCB 2022-23, page 8), so a family of four throws away roughly ' + (4 * PER_PERSON_G / 1000).toFixed(1) + ' kg a day (our arithmetic).</p></div>' +
      '<div class="rowbtn noprint"><button class="go" id="k-copy" type="button">Copy as a message</button><button class="alt" id="k-dl" type="button">Download as text</button><button class="alt" id="k-print" type="button">Print or save as PDF</button></div><p class="mini noprint">The message is plain text for WhatsApp or email. We never send anything for you.</p>';
    $("k-copy").onclick = function () { copy(txt, this); }; $("k-dl").onclick = function () { download("kachra_satya_" + state.replace(/\s+/g, "_") + ".txt", txt); }; $("k-print").onclick = function () { window.print(); };
  }

  /* ---------- briefing ---------- */
  var AUD = { mp: "Member of Parliament", mla: "Member of the Legislative Assembly", cllr: "Councillor", other: "Reporter or other reader" };
  function questions(f, aud) {
    var q = [];
    if (f.mohua != null && f.cpcb != null)
      q.push("The Ministry of Housing and Urban Affairs reports about " + Math.round(f.mohua) + "% of " + f.state + "'s waste processed (2025-26), while the Central Pollution Control Board's figures show about " + Math.round(f.cpcb) + "% treated (2023-24). Will the Government reconcile the two for the same financial year, and state how each body defines \"processed\" and \"treated\"?");
    var r = ranges(f.flags);
    if (r["6_treated_gt_collected"]) q.push("CPCB's reports show more waste treated than collected for " + f.state + " in " + Array.from(new Set(r["6_treated_gt_collected"])).sort().join(", ") + ". What explains this, and does the reported treatment include waste that was never collected, such as processing at source?");
    if (r["2_collected_gt_generated"]) q.push("A CPCB report shows more waste collected than generated for " + f.state + " (" + Array.from(new Set(r["2_collected_gt_generated"])).sort().join(", ") + "). Which figure will be corrected or explained?");
    if (f.money && f.money.swm_utilisation_pct != null)
      q.push("About " + f.money.swm_utilisation_pct + "% of " + f.state + "'s solid-waste allocation under SBM-U 2.0 (2021-2026) had been used by 25 November 2024 (Lok Sabha Unstarred Question 682). What are the reasons, and what is the plan to use the remainder?");
    if (f.ind && f.ind.uncollected_tpd != null && f.coll != null && f.coll < 90)
      q.push("CPCB's 2023-24 figures show about " + n0(f.ind.uncollected_tpd) + " tonnes a day of waste generated in " + f.state + " not collected (" + Math.round(f.coll) + "% collected). What steps are planned to close this gap, and by when?");
    return q;
  }
  function briefText(f, aud) {
    var qs = questions(f, aud), L = [];
    L.push("BRIEFING: solid waste figures for " + f.state, "For: " + AUD[aud] + ". Prepared from published government documents; every figure below has a source page in the Kachra Satya app.", "");
    L.push("1. THE TWO OFFICIAL FIGURES", "- MoHUA, 2025-26 (Rajya Sabha Q2433): generated " + n0(f.mg) + " tonnes/day, processed " + n0(f.mt) + " tonnes/day (" + kg(f.mohua) + " per 100 kg).",
      "- CPCB, 2023-24 (Lok Sabha Q50): generated " + n0(f.cg) + " tonnes/day, collected " + n0(f.cc) + ", treated " + n0(f.ct) + " tonnes/day (" + kg(f.cpcb) + " per 100 kg).",
      "- The years differ, and CPCB says \"treated\" where MoHUA says \"processed\". The sources disagree; this briefing does not say which is right.", "");
    var kinds = Object.keys(ranges(f.flags)).filter(function (k) { return RULETXT[k]; });
    L.push("2. WHAT CANNOT ALL BE TRUE");
    L.push(kinds.length ? kinds.map(function (k) { return "- " + f.state + " " + RULETXT[k] + " (" + Array.from(new Set(ranges(f.flags)[k])).sort().join(", ") + ")."; }).join("\n") : "- No contradiction within a single source for " + f.state + " in the data we hold.", "");
    L.push("3. MONEY", f.money ? "- About " + f.money.swm_utilisation_pct + "% of the solid-waste allocation (2021-2026) had been used by 25 Nov 2024 (Lok Sabha Q682). The table prints no unit, so only the share is quoted." : "- Not reported for " + f.state + ".", "");
    L.push("4. QUESTIONS THAT COULD BE PUT", qs.length ? qs.map(function (x, i) { return (i + 1) + ". " + x; }).join("\n") : "- None generated: the data we hold shows no gap for " + f.state + ".", "");
    L.push("WHAT THIS DOES NOT SAY", "- It does not say any figure is wrong or that anyone acted improperly. All figures are self-reported by states and cities; we checked consistency, not truth.", "- Check your House's or body's rules on the form and timing of questions before using any of this text.");
    return L.join("\n");
  }
  function renderBriefing(el, state, aud) {
    aud = AUD[aud] ? aud : "mp"; var f = facts(state), txt = briefText(f, aud);
    el.innerHTML = '<div class="card pad"><div class="grid2"><div><label for="b-aud">Prepared for</label><select id="b-aud">' + Object.keys(AUD).map(function (k) { return '<option value="' + k + '"' + (k === aud ? " selected" : "") + ">" + AUD[k] + "</option>"; }).join("") + '</select></div></div>' +
      '<label for="b-text" style="margin-top:12px">Your briefing (edit before using)</label><textarea class="out" id="b-text" style="min-height:420px">' + esc(txt) + '</textarea>' +
      '<div class="rowbtn noprint"><button class="alt" id="b-copy" type="button">Copy text</button><button class="alt" id="b-dl" type="button">Download as .txt</button><button class="alt" id="b-print" type="button">Print</button></div>' +
      '<p class="mini noprint">A draft for you to review. Source pages: ' + rk(state + "|2023-24|treated|ls_au50_2025-12-01.pdf").replace(" <button", "<button") + ' ' + rk(state + "|2025-26|treated|mohua_81pct_answer.pdf") + '</p></div>';
    $("b-aud").onchange = function () { renderBriefing(el, state, this.value); };
    $("b-copy").onclick = function () { copy($("b-text").value, this); }; $("b-dl").onclick = function () { download("briefing_" + state.replace(/\s+/g, "_") + ".txt", $("b-text").value); }; $("b-print").onclick = function () { window.print(); };
  }

  /* ---------- page ---------- */
  function render(args) {
    var view = $("view"), tab = args[0] === "briefing" ? "briefing" : "card", state = STATES.indexOf(args[1]) >= 0 ? args[1] : "";
    view.innerHTML = '<h2>State card and briefing</h2><p class="sub">The two official numbers for a state in plain words, and a one-page briefing for someone who can ask the question: a Member of Parliament or of an Assembly, a councillor, or a reporter.</p>' +
      '<div class="card pad noprint"><label for="b-state">State or union territory</label><select id="b-state"><option value="">Choose one</option>' + STATES.map(function (s) { return "<option" + (s === state ? " selected" : "") + ">" + esc(s) + "</option>"; }).join("") + "</select></div>" +
      '<nav class="tabs noprint" aria-label="Card or briefing" style="margin-top:14px"><a href="#/brief/card/' + encodeURIComponent(state) + '"' + (tab === "card" ? ' aria-current="page"' : "") + '>State card</a><a href="#/brief/briefing/' + encodeURIComponent(state) + '"' + (tab === "briefing" ? ' aria-current="page"' : "") + ">Briefing</a></nav><div id=\"btab\"></div>";
    $("b-state").onchange = function () { location.hash = "#/brief/" + tab + "/" + encodeURIComponent(this.value); };
    if (!state) { $("btab").innerHTML = '<p class="note">Choose a state to see its card.</p>'; return; }
    (tab === "card" ? renderCard : renderBriefing)($("btab"), state);
  }
  root.KSLeaders = { render: render, _facts: facts, _questions: questions, _cardText: cardText, _briefText: briefText };
})(window);
