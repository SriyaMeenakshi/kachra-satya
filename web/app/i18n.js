/* Interface language (English, Hindi, Telugu) and the plain-English glossary. Shared by the shell, the Start page and the claim result.
   API: KSi18n.t(key, englishFallback, vars)  -> text;  KSi18n.th(key, fallback, vars) -> escaped HTML where [[term]] becomes a tap-for-meaning button;
        KSi18n.term(key, label) -> button HTML;  KSi18n.lang() -> "en" | "hi" | "te".
   Anything without a Hindi or Telugu string shows the English string, so a page is never blank. Data (state names, document names) is never translated.
   Hindi and Telugu are a first draft for the nav, the Start page, the claim verdicts and the glossary: a native speaker should review them before launch. */
(function (root) {
  var LANGS = { en: "English", hi: "हिन्दी", te: "తెలుగు" }, L = "en";
  try { var saved = localStorage.getItem("ks-lang"); if (saved && LANGS[saved]) L = saved; } catch (e) {}
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var UI = {
    en: {
      nav_home: "Home", nav_map: "Map", nav_claim: "Check a claim", nav_claim_m: "Claim", nav_gaps: "Gaps", nav_city: "Your city", nav_city_m: "City", nav_ask: "Ask", nav_explore: "Explore", nav_more: "More", nav_ward: "Your ward", nav_help: "Get help", nav_dropoff: "Nearest drop-off", theme: "Theme", language: "Language",
      kicker: "Waste data observatory · India", h1: "India's waste story doesn't always add up.", lede: "Follow the numbers, compare official claims and uncover what India's waste data actually says.",
      cta_explore: "Explore the data", cta_claim: "Check a claim",
      what: "Kachra Satya puts India's two official waste numbers side by side, shows the source page behind each, and flags figures that can't all be true.",
      layer_label: "Colour the map by", layer_mohua: "MoHUA processed", layer_cpcb: "CPCB treated", layer_gap: "Difference", map_hint: "Select a state to open its figures",
      stat_mohua_who: "MoHUA says", stat_cpcb_who: "CPCB figures give",
      newhere: "New here? Three steps", hide: "Hide", show3: "Show the 3 steps",
      step1: "Type a claim", step1d: "Paste a number someone quoted", step2: "Tap your state", step2d: "See both official figures", step3: "Open the source page", step3d: "See the number boxed on the document",
      two_h: "Two official numbers. One country.", apart: "{n} tonnes a day apart", proc_h: "Processed or treated?", findings_h: "What the numbers show", index_h: "Where to go next",
      idx_map: "Map", idx_map_d: "Both official figures for every state, with the source page.", idx_claim: "Check a claim", idx_claim_d: "Test a number you heard against every source we hold.",
      idx_gaps: "Gaps", idx_gaps_d: "Money, trucks and reporting gaps, state by state.", idx_city: "Your city", idx_city_d: "Upload ward data and see which figures cannot all be true.",
      idx_ask: "Ask", idx_ask_d: "Questions in English, Hindi, Tamil or Telugu, answered from the data.", idx_explore: "Explore", idx_explore_d: "Audit order, source pages, swings and definitions.",
      try_h: "Heard a number? Check it.", check: "Check", method_h: "How we check",
      trust_states: "states and UTs", trust_figs: "reported figures", trust_pages: "open on a source page", trust_flags: "flags: figures that cannot all be true",
      v_sup: "Supported", v_con: "Contradicted", v_mix: "Sources disagree", v_cant: "Can't verify",
      v_sup_s: "Every source we hold gives a figure that matches this claim.", v_con_s: "No source we hold gives a figure that matches this claim.",
      v_mix_s: "Some official sources match this claim and others don't. The sources disagree with each other.", v_cant_s: "We have no figure to compare this with, and we don't guess."
    },
    hi: {
      nav_home: "होम", nav_map: "नक्शा", nav_claim: "दावा जाँचें", nav_claim_m: "दावा", nav_gaps: "अंतर", nav_city: "आपका शहर", nav_city_m: "शहर", nav_ask: "पूछें", nav_explore: "खोजें", nav_more: "और", nav_ward: "आपका वार्ड", nav_help: "मदद", nav_dropoff: "नज़दीकी ड्रॉप-ऑफ़", theme: "थीम", language: "भाषा",
      kicker: "कचरा डेटा वेधशाला · भारत", h1: "भारत की कचरा कहानी हमेशा मेल नहीं खाती।", lede: "आँकड़ों का पीछा करें, सरकारी दावों की तुलना करें और जानें कि भारत का कचरा-डेटा असल में क्या कहता है।",
      cta_explore: "डेटा देखें", cta_claim: "दावा जाँचें",
      what: "कचरा सत्य भारत के कचरे के दो सरकारी आँकड़े साथ-साथ रखता है, हर आँकड़े के पीछे का स्रोत पृष्ठ दिखाता है, और उन आँकड़ों को चिह्नित करता है जो सब एक साथ सही नहीं हो सकते।",
      layer_label: "नक्शे का रंग", layer_mohua: "MoHUA प्रसंस्कृत", layer_cpcb: "CPCB उपचारित", layer_gap: "अंतर", map_hint: "आँकड़े देखने के लिए राज्य चुनें",
      stat_mohua_who: "MoHUA के अनुसार", stat_cpcb_who: "CPCB के आँकड़े",
      newhere: "नए हैं? तीन कदम", hide: "छिपाएँ", show3: "3 कदम दिखाएँ",
      step1: "कोई दावा लिखें", step1d: "किसी का बताया आँकड़ा चिपकाएँ", step2: "अपना राज्य चुनें", step2d: "दोनों सरकारी आँकड़े देखें", step3: "स्रोत पृष्ठ खोलें", step3d: "दस्तावेज़ में आँकड़ा बॉक्स में देखें",
      two_h: "दो सरकारी आँकड़े। एक देश।", apart: "{n} टन प्रतिदिन का अंतर", proc_h: "प्रसंस्कृत या उपचारित?", findings_h: "आँकड़े क्या बताते हैं", index_h: "आगे कहाँ जाएँ",
      idx_map: "नक्शा", idx_map_d: "हर राज्य के दोनों सरकारी आँकड़े, स्रोत पृष्ठ के साथ।", idx_claim: "दावा जाँचें", idx_claim_d: "कोई सुना हुआ आँकड़ा हमारे सभी स्रोतों से जाँचें।",
      idx_gaps: "अंतर", idx_gaps_d: "पैसा, ट्रक और रिपोर्टिंग के अंतर, राज्य-दर-राज्य।", idx_city: "आपका शहर", idx_city_d: "वार्ड का डेटा अपलोड करें और देखें कि कौन-से आँकड़े साथ में सही नहीं हो सकते।",
      idx_ask: "पूछें", idx_ask_d: "अंग्रेज़ी, हिन्दी, तमिल या तेलुगु में सवाल पूछें; जवाब डेटा से।", idx_explore: "खोजें", idx_explore_d: "ऑडिट क्रम, स्रोत पृष्ठ, उतार-चढ़ाव और परिभाषाएँ।",
      try_h: "कोई आँकड़ा सुना? जाँचें।", check: "जाँचें", method_h: "हम कैसे जाँचते हैं",
      trust_states: "राज्य और केंद्रशासित प्रदेश", trust_figs: "दर्ज आँकड़े", trust_pages: "स्रोत पृष्ठ पर खुलते हैं", trust_flags: "फ़्लैग: जो आँकड़े सब सही नहीं हो सकते",
      v_sup: "समर्थित", v_con: "खंडित", v_mix: "स्रोत सहमत नहीं", v_cant: "जाँच नहीं हो सकी",
      v_sup_s: "हमारे पास के हर स्रोत का आँकड़ा इस दावे से मेल खाता है।", v_con_s: "हमारे पास के किसी भी स्रोत का आँकड़ा इस दावे से मेल नहीं खाता।",
      v_mix_s: "कुछ सरकारी स्रोत इस दावे से मेल खाते हैं और कुछ नहीं। स्रोत आपस में सहमत नहीं हैं।", v_cant_s: "तुलना के लिए हमारे पास कोई आँकड़ा नहीं है, और हम अंदाज़ा नहीं लगाते।"
    },
    te: {
      nav_home: "హోమ్", nav_map: "మ్యాప్", nav_claim: "క్లెయిమ్ తనిఖీ", nav_claim_m: "క్లెయిమ్", nav_gaps: "తేడాలు", nav_city: "మీ నగరం", nav_city_m: "నగరం", nav_ask: "అడగండి", nav_explore: "అన్వేషించండి", nav_more: "మరిన్ని", nav_ward: "మీ వార్డు", nav_help: "సహాయం", nav_dropoff: "దగ్గరి డ్రాప్-ఆఫ్", theme: "థీమ్", language: "భాష",
      kicker: "చెత్త డేటా పరిశీలనశాల · భారతదేశం", h1: "భారత చెత్త కథ ఎప్పుడూ సరిపోలదు.", lede: "సంఖ్యలను అనుసరించండి, అధికారిక వాదనలను పోల్చండి, భారత చెత్త డేటా నిజంగా ఏమి చెబుతోందో తెలుసుకోండి.",
      cta_explore: "డేటా చూడండి", cta_claim: "క్లెయిమ్ తనిఖీ",
      what: "కచ్రా సత్య భారత చెత్తపై రెండు అధికారిక సంఖ్యలను పక్కపక్కన ఉంచి, ప్రతి సంఖ్య వెనుక ఉన్న మూల పేజీని చూపి, అన్నీ ఒకేసారి నిజం కాలేని సంఖ్యలను గుర్తిస్తుంది.",
      layer_label: "మ్యాప్ రంగు", layer_mohua: "MoHUA ప్రాసెస్", layer_cpcb: "CPCB శుద్ధి", layer_gap: "తేడా", map_hint: "సంఖ్యలు చూడటానికి రాష్ట్రాన్ని ఎంచుకోండి",
      stat_mohua_who: "MoHUA ప్రకారం", stat_cpcb_who: "CPCB సంఖ్యలు",
      newhere: "కొత్తవారా? మూడు దశలు", hide: "దాచు", show3: "3 దశలు చూపు",
      step1: "ఒక క్లెయిమ్ టైప్ చేయండి", step1d: "ఎవరో చెప్పిన సంఖ్యను పేస్ట్ చేయండి", step2: "మీ రాష్ట్రాన్ని ఎంచుకోండి", step2d: "రెండు అధికారిక సంఖ్యలను చూడండి", step3: "మూల పేజీని తెరవండి", step3d: "పత్రంలో సంఖ్యను పెట్టెలో చూడండి",
      two_h: "రెండు అధికారిక సంఖ్యలు. ఒకే దేశం.", apart: "రోజుకు {n} టన్నుల తేడా", proc_h: "ప్రాసెస్ లేదా శుద్ధి?", findings_h: "సంఖ్యలు ఏమి చెబుతున్నాయి", index_h: "తరువాత ఎక్కడికి",
      idx_map: "మ్యాప్", idx_map_d: "ప్రతి రాష్ట్రానికి రెండు అధికారిక సంఖ్యలు, మూల పేజీతో.", idx_claim: "క్లెయిమ్ తనిఖీ", idx_claim_d: "మీరు విన్న సంఖ్యను మా వద్ద ఉన్న అన్ని మూలాలతో పోల్చండి.",
      idx_gaps: "తేడాలు", idx_gaps_d: "డబ్బు, ట్రక్కులు, నివేదికల లోపాలు, రాష్ట్రాల వారీగా.", idx_city: "మీ నగరం", idx_city_d: "వార్డు డేటాను అప్‌లోడ్ చేసి, ఏ సంఖ్యలు ఒకేసారి నిజం కాలేవో చూడండి.",
      idx_ask: "అడగండి", idx_ask_d: "ఇంగ్లీష్, హిందీ, తమిళం లేదా తెలుగులో ప్రశ్నలు; జవాబులు డేటా నుంచే.", idx_explore: "అన్వేషించండి", idx_explore_d: "ఆడిట్ క్రమం, మూల పేజీలు, హెచ్చుతగ్గులు, నిర్వచనాలు.",
      try_h: "ఒక సంఖ్య విన్నారా? తనిఖీ చేయండి.", check: "తనిఖీ", method_h: "మేము ఎలా తనిఖీ చేస్తాం",
      trust_states: "రాష్ట్రాలు, కేంద్రపాలిత ప్రాంతాలు", trust_figs: "నమోదైన సంఖ్యలు", trust_pages: "మూల పేజీలో తెరుచుకుంటాయి", trust_flags: "ఫ్లాగ్‌లు: ఒకేసారి నిజం కాలేని సంఖ్యలు",
      v_sup: "మద్దతు ఉంది", v_con: "విరుద్ధం", v_mix: "మూలాలు ఏకీభవించలేదు", v_cant: "ధృవీకరించలేం",
      v_sup_s: "మా వద్ద ఉన్న ప్రతి మూలం ఇచ్చిన సంఖ్య ఈ క్లెయిమ్‌తో సరిపోతుంది.", v_con_s: "మా వద్ద ఉన్న ఏ మూలం ఇచ్చిన సంఖ్య కూడా ఈ క్లెయిమ్‌తో సరిపోదు.",
      v_mix_s: "కొన్ని అధికారిక మూలాలు ఈ క్లెయిమ్‌తో సరిపోతాయి, కొన్ని సరిపోవు. మూలాలు ఒకదానితో ఒకటి ఏకీభవించవు.", v_cant_s: "పోల్చడానికి మా వద్ద సంఖ్య లేదు, మేము ఊహించం."
    }
  };

  /* glossary: key -> {lang: [term, one-line meaning]} */
  var GL = {
    tpd: { en: ["tonnes per day", "How many tonnes of waste in a day. One tonne is 1,000 kg, about the weight of a small car."], hi: ["टन प्रतिदिन", "एक दिन में कितने टन कचरा। एक टन = 1,000 किलो, लगभग एक छोटी कार के वज़न के बराबर।"], te: ["రోజుకు టన్నులు", "ఒక రోజులో ఎన్ని టన్నుల చెత్త. ఒక టన్ను = 1,000 కిలోలు, సుమారు ఒక చిన్న కారు బరువు."] },
    generated: { en: ["generated", "Waste produced by homes, shops and offices in a day."], hi: ["उत्पन्न", "घरों, दुकानों और दफ़्तरों से एक दिन में निकलने वाला कचरा।"], te: ["ఉత్పత్తి", "ఇళ్లు, దుకాణాలు, కార్యాలయాల నుంచి రోజుకు వచ్చే చెత్త."] },
    collected: { en: ["collected", "Waste that city workers actually pick up."], hi: ["एकत्र", "जो कचरा नगर कर्मचारी सच में उठाते हैं।"], te: ["సేకరణ", "పురపాలక సిబ్బంది నిజంగా తీసుకెళ్లే చెత్త."] },
    treated: { en: ["treated", "CPCB's word: waste sent to be composted, recycled or otherwise treated instead of dumped. Its report defines treatment as a method that changes waste to reduce its volume and harm."], hi: ["उपचारित (treated)", "CPCB का शब्द: वह कचरा जिसे फेंकने की बजाय खाद, रीसाइक्लिंग या अन्य उपचार के लिए भेजा गया।"], te: ["శుద్ధి (treated)", "CPCB వాడే పదం: పారేయకుండా కంపోస్ట్, రీసైక్లింగ్ లేదా ఇతర శుద్ధి కోసం పంపిన చెత్త."] },
    processed: { en: ["processed", "MoHUA's word (\"Total Waste Processed\"). The documents we hold do not define it, so it may not mean exactly the same as \"treated\"."], hi: ["प्रसंस्कृत (processed)", "MoHUA का शब्द (\"Total Waste Processed\")। हमारे दस्तावेज़ों में इसकी परिभाषा नहीं है, इसलिए हो सकता है यह \"treated\" से ठीक वही न हो।"], te: ["ప్రాసెస్ (processed)", "MoHUA పదం (\"Total Waste Processed\"). మా వద్ద ఉన్న పత్రాల్లో దీని నిర్వచనం లేదు, కాబట్టి \"treated\"తో సరిగ్గా ఒకటే కాకపోవచ్చు."] },
    landfilled: { en: ["landfilled", "Waste dumped in a landfill (a large rubbish dump)."], hi: ["लैंडफ़िल", "जो कचरा लैंडफ़िल (कचरे के बड़े ढेर) में डाला गया।"], te: ["ల్యాండ్‌ఫిల్", "ల్యాండ్‌ఫిల్‌లో (పెద్ద చెత్త దిబ్బ) పడేసిన చెత్త."] },
    mohua: { en: ["MoHUA", "Ministry of Housing and Urban Affairs, the central government ministry for cities."], hi: ["MoHUA", "आवासन और शहरी कार्य मंत्रालय, शहरों के लिए केंद्र सरकार का मंत्रालय।"], te: ["MoHUA", "గృహ నిర్మాణ, పట్టణ వ్యవహారాల మంత్రిత్వ శాఖ; నగరాల కోసం కేంద్ర మంత్రిత్వ శాఖ."] },
    cpcb: { en: ["CPCB", "Central Pollution Control Board, which compiles waste figures reported by the states."], hi: ["CPCB", "केंद्रीय प्रदूषण नियंत्रण बोर्ड, जो राज्यों से मिले कचरे के आँकड़े संकलित करता है।"], te: ["CPCB", "కేంద్ర కాలుష్య నియంత్రణ మండలి; రాష్ట్రాలు నివేదించిన చెత్త గణాంకాలను సంకలనం చేస్తుంది."] },
    flag: { en: ["flag", "A place where reported figures cannot all be true at once, for example more waste treated than collected. It does not say which figure to trust."], hi: ["फ़्लैग", "वह जगह जहाँ दर्ज आँकड़े एक साथ सही नहीं हो सकते, जैसे एकत्र से ज़्यादा कचरा उपचारित। यह नहीं बताता कि किस पर भरोसा करें।"], te: ["ఫ్లాగ్", "నమోదైన సంఖ్యలు అన్నీ ఒకేసారి నిజం కాలేని చోటు, ఉదా. సేకరించిన దానికంటే ఎక్కువ శుద్ధి. దేన్ని నమ్మాలో ఇది చెప్పదు."] },
    truckload: { en: ["truckload", "To make numbers easier to picture we count 10 tonnes as one truck. Real trucks vary."], hi: ["ट्रक भार", "आँकड़ों को समझना आसान बनाने के लिए हम 10 टन को एक ट्रक मानते हैं। असली ट्रक अलग-अलग होते हैं।"], te: ["ట్రక్కు లోడ్", "సంఖ్యలను ఊహించడం సులభంగా ఉండేందుకు 10 టన్నులను ఒక ట్రక్కుగా లెక్కిస్తాం. నిజమైన ట్రక్కులు మారుతాయి."] },
    notreported: { en: ["not reported", "The source left this blank. We never fill gaps in."], hi: ["रिपोर्ट नहीं", "स्रोत ने यह खाना खाली छोड़ा है। हम कभी खाली जगह नहीं भरते।"], te: ["నివేదించలేదు", "మూలం ఈ గడిని ఖాళీగా వదిలింది. మేము ఖాళీలను ఎప్పుడూ నింపం."] },
    ulb: { en: ["ULB", "Urban local body: the municipal corporation or council of a city or town."], hi: ["ULB", "शहरी स्थानीय निकाय: किसी शहर या कस्बे की नगर निगम या परिषद।"], te: ["ULB", "పట్టణ స్థానిక సంస్థ: నగరం లేదా పట్టణ మున్సిపల్ కార్పొరేషన్ లేదా కౌన్సిల్."] }
  };

  function t(k, fb, v) {
    var s = (UI[L] && UI[L][k]) || (fb != null ? fb : UI.en[k]) || k;
    if (v) Object.keys(v).forEach(function (x) { s = s.split("{" + x + "}").join(v[x]); });
    return s;
  }
  function gl(k) { var g = GL[k]; return g[L] || g.en; }
  function term(k, label) { return '<button class="term" type="button" data-g="' + k + '" aria-expanded="false">' + esc(label || gl(k)[0]) + "</button>"; }
  function th(k, fb, v) { return esc(t(k, fb, v)).replace(/\[\[(\w+)\]\]/g, function (_, g) { return term(g); }); }

  /* one pop-up for every glossary term on the site: tap to open, Escape or tapping elsewhere to close */
  var pop = document.createElement("div"); pop.className = "gl"; pop.id = "gl"; pop.setAttribute("role", "note"); pop.hidden = true; document.body.appendChild(pop);
  var cur = null;
  function closePop() { pop.hidden = true; if (cur) { cur.setAttribute("aria-expanded", "false"); cur.removeAttribute("aria-describedby"); } cur = null; }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".term");
    if (!b) { if (!pop.contains(e.target)) closePop(); return; }
    if (cur === b && !pop.hidden) { closePop(); return; }
    closePop(); cur = b; var g = gl(b.dataset.g);
    pop.innerHTML = "<strong>" + esc(g[0]) + "</strong><br>" + esc(g[1]) + '<br><a href="#/explore/defs/' + b.dataset.g + '">All definitions</a>';
    pop.hidden = false; b.setAttribute("aria-expanded", "true"); b.setAttribute("aria-describedby", "gl");
    var r = b.getBoundingClientRect(), w = Math.min(320, innerWidth - 24);
    pop.style.width = w + "px"; pop.style.left = Math.max(12, Math.min(r.left, innerWidth - w - 12)) + "px"; pop.style.top = (r.bottom + 8) + "px";
    if (r.bottom + 8 + pop.offsetHeight > innerHeight - 8) pop.style.top = Math.max(8, r.top - pop.offsetHeight - 8) + "px";
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var b = cur; closePop(); if (b) b.focus(); } });
  window.addEventListener("hashchange", closePop);

  /* the shell: nav labels and the language select */
  function chrome() {
    document.documentElement.lang = L;
    var th0 = document.getElementById("theme"); if (th0) th0.textContent = t("theme");
    document.querySelectorAll("[data-i]").forEach(function (n) { n.textContent = t(n.getAttribute("data-i")); });
    var sel = document.getElementById("uilang"); if (sel) sel.setAttribute("aria-label", t("language"));
  }
  var sel = document.getElementById("uilang");
  if (sel) {
    sel.innerHTML = Object.keys(LANGS).map(function (k) { return '<option value="' + k + '" lang="' + k + '">' + esc(LANGS[k]) + "</option>"; }).join(""); sel.value = L;
    sel.onchange = function () { L = this.value; try { localStorage.setItem("ks-lang", L); } catch (e) {} chrome(); closePop(); window.dispatchEvent(new Event("ks-lang")); };
  }
  chrome();
  root.KSi18n = { t: t, th: th, term: term, gl: gl, lang: function () { return L; }, langs: LANGS, glossary: GL, chrome: chrome };
})(window);
