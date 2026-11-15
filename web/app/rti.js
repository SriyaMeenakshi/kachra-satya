/* Turn a flag into a ready-to-send RTI application and a Parliament question. A flag means two reported figures cannot both be true (data/flags.csv).
   The drafts name the figures, the year, the document and the page, so the office can find them. We write them; the person sends them: nothing leaves this page.
   They are plain English and are not translated, like the other drafted letters. They are drafts, not legal advice: the person checks the current RTI rules and fee for the office.
   draft() is pure, so the tests can run it in Node. The part that draws it on the page is browser only. */
(function (root) {
  /* where each source's figures come from: the body that publishes them, and the ministry a Parliament question goes to */
  var BODY = {
    CPCB: { office: "the Central Public Information Officer, Central Pollution Control Board (CPCB)", ministry: "Environment, Forest and Climate Change", name: "the Central Pollution Control Board" },
    MoHUA: { office: "the Central Public Information Officer, Ministry of Housing and Urban Affairs", ministry: "Housing and Urban Affairs", name: "the Ministry of Housing and Urban Affairs" }
  };
  var LABEL = { generated: "waste generated", collected: "waste collected", treated: "waste treated", landfilled: "waste landfilled" };

  /* "treated=83; landfilled=486; source=CPCB" -> { treated: "83", landfilled: "486", source: "CPCB" } */
  function parse(values) { var o = {}; String(values || "").split(";").forEach(function (p) { var i = p.indexOf("="); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); }); return o; }
  function n(v) { var x = parseFloat(String(v).replace(/,/g, "")); return isNaN(x) ? v : x.toLocaleString("en-US", { maximumFractionDigits: 2 }); }

  /* The sentence at the heart of each flag, and what to ask for. f: { state, year, rule, values, explanation }.
     rows: the data rows the flag rests on, [{ metric, value_tpd, source_name, source_doc, source_page }], so each figure can be given with its page. docName(file) -> a plain document name. */
  function core(f) {
    var v = parse(f.values), rule = String(f.rule || ""), S = f.state, Y = f.year;
    if (rule.indexOf("6_") === 0) return { src: v.source || "CPCB", facts: ["treated", "collected"], issue: S + " reports " + n(v.treated) + " tonnes per day of waste treated, which is more than the " + n(v.collected) + " tonnes per day it reports collected, for " + Y + ".", short: "more waste treated than collected" };
    if (rule.indexOf("2_") === 0) return { src: v.source || "CPCB", facts: ["collected", "generated"], issue: S + " reports " + n(v.collected) + " tonnes per day of waste collected, which is more than the " + n(v.generated) + " tonnes per day it reports generated, for " + Y + ".", short: "more waste collected than generated" };
    if (rule.indexOf("1_") === 0) return { src: v.source || "CPCB", facts: ["treated", "landfilled", "generated"], issue: S + " reports " + n(v.treated) + " tonnes per day treated plus " + n(v.landfilled) + " landfilled, which together are more than the " + n(v.generated) + " generated, for " + Y + ".", short: "treated plus landfilled above generated" };
    if (rule.indexOf("5_") === 0) {
      var sum = /sum of states=([\d.,]+)/.exec(f.values || ""), nat = /stated national=([\d.,]+)/.exec(f.values || ""), dif = /difference=([^;]+)/.exec(f.values || ""), what = /^(\w+):/.exec(f.values || "");
      return { src: v.source || "MoHUA", facts: [], issue: "the state figures for " + (what ? what[1] + " in " : "") + Y + " add up to " + (sum ? n(sum[1]) : "a different number") + " tonnes per day, but the national total printed in the same source is " + (nat ? n(nat[1]) : "another number") + (dif ? " (difference " + dif[1].trim() + ")" : "") + ".", short: "state figures do not add up to the national total" };
    }
    if (rule.indexOf("4_") === 0) return { src: "CPCB", facts: [], issue: S + " has no figure for " + (String(f.values).split(" ")[0] || "one measure") + " in " + Y + ", although the same source reports it in other years.", short: "a figure left out in " + Y };
    return null;
  }
  function figLines(c, rows, docName) {
    var out = [];
    (c.facts || []).forEach(function (m) {
      var r = (rows || []).filter(function (x) { return x.metric === m; })[0];
      if (r) out.push("   - " + (LABEL[m] || m) + ": " + (r.value_tpd == null || r.value_tpd === "" ? "not reported" : n(r.value_tpd) + " tonnes per day") + " (" + (docName ? docName(r.source_doc) : r.source_doc) + ", page " + r.source_page + ")");
    });
    return out;
  }

  /* -> { ok, short, rti, question } ; ok is false for a flag we cannot draft (the two sources differing is not one body's error) */
  function draft(f, rows, docName, today) {
    var c = core(f); if (!c) return { ok: false };
    var B = BODY[c.src] || BODY.CPCB, S = f.state, Y = f.year, facts = figLines(c, rows, docName), d = today || "";
    var rti = [
      "To", "   " + B.office, "",
      "Subject: Request for information under the Right to Information Act, 2005: inconsistent waste figures for " + S + ", " + Y, "",
      "Sir or Madam,", "",
      "1. I am a citizen of India and I seek the information below under Section 6(1) of the Right to Information Act, 2005.", "",
      "2. In the published figures for municipal solid waste, " + c.issue + (facts.length ? " The figures and the pages they are printed on are:" : ""),
    ].concat(facts, [
      "",
      "3. Please give me:",
      "   (a) the record, return or data sheet that was received for " + S + " for " + Y + " and from which these figures were taken, with the name of the office that sent it;",
      "   (b) the definition used for each of the figures above, and how " + B.name + " checks that they are consistent with each other before they are published;",
      "   (c) whether this inconsistency has been noticed, and if so the date, the correspondence and any corrected figures; and",
      "   (d) the action taken, or proposed, to correct the published figures.", "",
      "4. I will pay the application fee in the way the office requires. If any part of this request is held by another public authority, please transfer it under Section 6(3) and tell me.", "",
      "Date: " + d, "Name and address of the applicant: ______________________", "Yours faithfully,"
    ]).join("\n");
    var question = [
      "Draft question to the Minister of " + B.ministry + " (for a Member of Parliament to table)", "",
      "Will the Minister of " + B.ministry.toUpperCase() + " be pleased to state:", "",
      "(a) whether the Government is aware that the data published by " + B.name + " show that " + c.issue,
    ].concat(facts, [
      "",
      "(b) if so, the reasons for the inconsistency, and whether the figures have been verified with the State concerned;",
      "(c) the checks the Government applies to State-reported waste figures before they are published or given to Parliament, and how often they find errors; and",
      "(d) the steps taken or proposed to correct the figures and to prevent this in future."
    ]).join("\n");
    return { ok: true, short: c.short, rti: rti, question: question };
  }
  var api = { parse: parse, core: core, draft: draft };
  if (typeof document === "undefined") { if (typeof module !== "undefined" && module.exports) module.exports = api; return; }

  /* ---------- on the page: a button under a flag that opens both drafts ---------- */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function rowsFor(f) { return (root.KS && KS.waste || []).filter(function (x) { return x.state === f.state && x.year === f.year && (x.source_name === (parse(f.values).source || x.source_name)); }); }
  function button(i) { return ' <button type="button" class="link" data-rti="' + i + '">Draft an RTI or a question for your MP</button>'; }
  function wire(box, flags) {
    [].forEach.call(box.querySelectorAll("[data-rti]"), function (b) {
      b.onclick = function () {
        var f = flags[+b.dataset.rti], host = b.closest(".flag"); if (!f || !host) return;
        var old = host.nextElementSibling; if (old && old.classList.contains("rti-panel")) { old.remove(); return; }
        var d = draft(f, rowsFor(f), root.KSAnswer ? KSAnswer.docName : null, new Date().toLocaleDateString("en-IN"));
        if (!d.ok) return;
        var id = "rti" + Math.random().toString(36).slice(2, 7);
        host.insertAdjacentHTML("afterend", '<div class="rti-panel card" role="group" aria-label="Draft"><div class="seg" role="group" aria-label="Which draft"><button type="button" class="on" data-w="rti" aria-pressed="true">RTI application</button><button type="button" data-w="question" aria-pressed="false">Question for Parliament</button></div>' +
          '<label for="' + id + '" class="rti-l">Edit it before you use it</label><textarea id="' + id + '" rows="16"></textarea>' +
          '<div class="rti-acts"><button type="button" class="go" data-a="copy">Copy</button><a class="alt" data-a="wa" target="_blank" rel="noopener">WhatsApp</a><button type="button" class="alt" data-a="txt">Download .txt</button><button type="button" class="alt" data-a="close">Close</button></div>' +
          '<p class="note" role="status" data-a="msg"></p><p class="note">A draft, not legal advice. We write it; you send it. Check the office\'s current RTI rules and fee. Nothing leaves this page until you choose to send it.</p></div>');
        var p = host.nextElementSibling, ta = p.querySelector("textarea"), cur = "rti";
        function show(w) { cur = w; ta.value = d[w]; [].forEach.call(p.querySelectorAll("[data-w]"), function (x) { var on = x.dataset.w === w; x.classList.toggle("on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); }); p.querySelector("[data-a=wa]").href = "https://wa.me/?text=" + encodeURIComponent(ta.value); }
        ta.addEventListener("input", function () { p.querySelector("[data-a=wa]").href = "https://wa.me/?text=" + encodeURIComponent(ta.value); });
        [].forEach.call(p.querySelectorAll("[data-w]"), function (x) { x.onclick = function () { show(x.dataset.w); }; });
        p.querySelector("[data-a=close]").onclick = function () { p.remove(); b.focus(); };
        p.querySelector("[data-a=copy]").onclick = function () { var m = p.querySelector("[data-a=msg]"); ta.select(); var ok = false; try { ok = document.execCommand("copy"); } catch (e) {} if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(function () { m.textContent = "Copied."; }, function () { m.textContent = ok ? "Copied." : "Select the text and copy it."; }); else m.textContent = ok ? "Copied." : "Select the text and copy it."; };
        p.querySelector("[data-a=txt]").onclick = function () { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ta.value], { type: "text/plain" })); a.download = (cur === "rti" ? "rti-" : "parliament-question-") + f.state.toLowerCase().replace(/[^a-z]+/g, "-") + "-" + f.year + ".txt"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500); };
        show("rti"); ta.focus();
      };
    });
  }
  root.KSRti = { parse: parse, core: core, draft: draft, button: button, wire: wire };
})(typeof window !== "undefined" ? window : this);
