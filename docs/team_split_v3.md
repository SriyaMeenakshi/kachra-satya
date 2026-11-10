# Team split v3: the central idea, 11 new ideas and the remaining work (proposal, 10 to 15 Nov 2026)

Replaces `docs/team_split_v2.md`. Hours are rough estimates, not measurements. Each person owns their items end to end (data, logic and screen). Totals: Yasaswini 41 h, Sriya 40 h, Likitha 39 h.

## The central idea
**A receipt for every waste promise.** Anyone in India can see what was promised, what was delivered, and what to do next. See `docs/central_idea.md`. The loop: **Promise** (what the government says) → **Proof** (the source page and whether sources agree) → **Reality** (is it true on my street) → **Action** (complain, segregate, escalate, brief someone with leverage) → back to Promise (what changed).

## Three tiers, with a cut line
- **MUST** (20 h each): needed for the 15 Nov submission.
- **SHOULD** (about 16 h each): clickable prototypes, built in tier order if time allows.
- **ROADMAP** (about 4 h each): a one-page spec only (who, what data is needed, what we would not claim). No building.
- If time slips, drop SHOULD items from the bottom of each person's list first. Never drop MUST. Freeze the scope at the end of 12 Nov.

## The 11 ideas and where each sits
| ID | Idea | Loop step | Tier | Owner |
|---|---|---|---|---|
| O1 | Garbage uptime page for a ward ("truck came" taps, shown beside the official claim) | Reality | SHOULD | Sriya |
| O2 | Sell, don't bin: dry waste into income | Action | ROADMAP (no price data) | Sriya |
| O3 | Compost or biogas calculator for apartment complexes | Action | ROADMAP (needs benchmarks and the real bulk-generator threshold) | Yasaswini |
| O4 | Briefing for people with leverage (MP, MLA, councillor) | Action | SHOULD | Yasaswini |
| O5 | Dumpsite watch (is the dump near me on the remediation list) | Reality | ROADMAP (no site-level data found) | Yasaswini |
| M1 | QR on the bin or truck, one-tap reporting | Reality | SHOULD | Sriya |
| M2 | Green ward badge | Reality | SHOULD | Sriya |
| M3 | School and college waste audit challenge | Proof | SHOULD | Yasaswini |
| M4 | Nearest drop-off for special items (OpenStreetMap, one city first) | Action | SHOULD | Likitha |
| M5 | WhatsApp and voice in Hindi, Tamil, Telugu | Action | ROADMAP (needs the agent live first) | Likitha |
| M6 | Waste-picker recognition | Action | ROADMAP (research first, no numbers claimed) | Likitha |
Saathi basics (complaint writer, dated log, escalation letter, four-stream guide) are MUST items, listed under Yasaswini.

## Yasaswini: Promise and Proof, plus Action tools (41 h)
| Tier | Item | h | Done means |
|---|---|---|---|
| MUST | Central loop home page | 6 | One flow from the headline claim to the receipt to "what can I do"; reuses the mock hero and the trust pages |
| MUST | Saathi: complaint writer | 4 | Garbage-not-collected form producing a clear complaint text with a reminder to attach a photo and add a landmark, for the official Swachhata-MoHUA app |
| MUST | Saathi: dated log | 3 | Downloadable log of complaints (date, ticket number, status) kept in the user's own browser |
| MUST | Saathi: escalation letter | 3 | Letter to the municipal commissioner after an unresolved complaint, citing the state's official claim and source page; we only draft it |
| MUST | Saathi: four-stream guide | 4 | Wet, dry, sanitary and special care, checked against the official notification (not only news summaries); Hindi, Tamil, Telugu text provided by the team |
| SHOULD | Leverage briefing (O4) | 6 | One page for an MP, MLA or councillor: the gap with source pages and a suggested follow-up question |
| SHOULD | Plain-language state cards | 4 | "Out of every 100 kg" wording; per-person figures labelled computed |
| SHOULD | School audit challenge (M3) | 5 | Template, weighing guide and a report card using `scripts/audit_city.py` |
| SHOULD | Human spot-check | 2 | 5 to 10 rows checked by hand against the PDFs; update `SOURCES.md` |
| ROADMAP | Compost calculator spec (O3), dumpsite watch spec (O5) | 4 | Two one-page specs |
By-hand publishing steps stay with you: choose the data licence, fill author names, send the permission requests (`docs/permission_requests.md`), upload to Zenodo.

## Sriya: Reality and the money story (40 h)
| Tier | Item | h | Done means |
|---|---|---|---|
| MUST | Phantom tonnes page | 4 | Counters kept separate, years labelled (`data/phantom_tonnes.csv`) |
| MUST | Money vs mess scatter | 4 | Utilisation against percent treated, with the caveats (`data/money_vs_mess.csv`) |
| MUST | Audit Your City page | 6 | Upload a CSV (`data/city_audit_template.csv`), show flags and the uncollected ranking |
| MUST | 20 to 30 user tests | 6 | Plain notes of what confused people; report the count honestly |
| SHOULD | Garbage uptime page (O1) | 6 | Per-ward calendar of reported days beside the official claim; says "no reports yet" when empty; never invented taps |
| SHOULD | QR one-tap flow (M1) | 6 | A QR links to a ward page with "collected / not collected"; resident reports labelled unverified; a plan for duplicate taps |
| SHOULD | Green ward badge (M2) | 4 | Badge rules and a page, framed as recognition, never as a shame ranking |
| ROADMAP | Plastic audit requirements, sell-don't-bin spec (O2) | 4 | Two one-page specs; the plastic work needs the CPCB plastic report downloaded by hand |

## Likitha: Platform and delivery (39 h)
| Tier | Item | h | Done means |
|---|---|---|---|
| MUST | App shell, map and navigation | 6 | The mock's map and navigation; every number links to its receipt |
| MUST | Q&A agent on AgentFoundry | 5 | Paste `docs/agentfoundry_setup.md`, run its 6 acceptance questions, give the app the agent endpoint |
| MUST | Deploy to a public URL | 4 | |
| MUST | Demo video | 4 | 2 to 3 minutes along the loop; any persona clearly labelled illustrative |
| MUST | Recheck the track list, submit | 1 | 15 Nov |
| SHOULD | State indicators and truck priority | 4 | Collection gap, landfill dependence, uncollected-tonnage ranking |
| SHOULD | Nearest drop-off (M4) | 5 | One city; check how complete the OpenStreetMap recycling points are first and say "may be incomplete" |
| SHOULD | Reporting-completeness score | 3 | How many metrics and years each state reports |
| SHOULD | Segregation gap panel | 2 | 86.2% of wards collect door to door, 35.1% segregate at source (national, 2022) |
| ROADMAP | Voice and WhatsApp spec (M5), waste-picker research (M6) | 5 | One-page spec and a research note; no figures about workers claimed without a source |

## Timeline
- **11 Nov:** MUST items start in parallel; each person publishes their page under `web/<name>/` so Likitha's shell can link to it.
- **12 Nov:** MUST items done; start SHOULD in the order listed; end-of-day scope freeze.
- **13 Nov:** integrate into the shell, deploy, start user tests.
- **14 Nov:** final check together; anything unverifiable is marked "unverified" in the app; video.
- **15 Nov:** submit.

## Rules for everyone
- Never fill in missing data; show "not reported". No invented taps, reports, prices or worker numbers.
- Every number links to its source document and page.
- Wording: "the sources disagree" and "figures that cannot both be true", never "wrong" or "fraud". The app drafts complaints and letters; it never sends them.
- Resident reports are labelled unverified.
- Commit with your own git identity, and agree before pushing to the shared repo.

## Progress (2026-11-10)
Yasaswini MUST items done and pushed for review: central loop home page (`#/start`), Saathi complaint writer, dated log, escalation letter and four-stream guide (`#/help/...`; see `docs/saathi.md`). The four-stream rule was checked against the official PIB release of 28 Jan 2026. Still to do for those items: native-speaker check of the Hindi, Tamil and Telugu stream names, and a read of the Gazette notification itself.
