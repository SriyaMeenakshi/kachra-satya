# Kachra Saathi: the Start page and Get help

Files: `web/app/saathi.js`, `web/app/saathi.css`, wired into `web/app/app.js` (routes `#/start` and `#/help`) and `web/app/index.html` (two nav links). Start is now the default page.

## What it does
- **Start (`#/start`):** the central loop (Promise, Proof, Reality, Action) with the headline figures read from the data ("out of every 100 kg"), and four shortcuts for what a person needs.
- **Write a complaint (`#/help/complain`):** a short form (city, area or landmark, problem, since when) that writes a clear complaint text to paste into the official Swachhata-MoHUA app, with steps for filing it. Nothing is sent.
- **My log (`#/help/log`):** complaints saved in the user's own browser (localStorage) with complaint number, status (open, resolved, reopened) and days open. Download as CSV. If the browser blocks storage it says so.
- **Escalation letter (`#/help/escalate`):** a letter to the Municipal Commissioner for a complaint that stays unresolved, citing the SWM Rules 2026 duty of local bodies, the MoHUA 97% door-to-door figure, and, if a state is chosen, the two official figures for that state in plain words ("kg out of every 100 kg") with the sources and the note that they disagree. Copy it or download it as text.
- **Which bin (`#/help/bins`):** the four streams under the SWM Rules, 2026, with examples and what happens to each. A search box matches only items the official notice lists (and plain aliases of them). Anything else gets "not in the list we have", never a guess.
- **Bulk generator? (`#/help/bulk`):** checks the three official thresholds (20,000 square metres of floor area, 40,000 litres of water a day, 100 kg of solid waste a day).

## Sources
- Press Information Bureau, Ministry of Environment, Forest and Climate Change, 28 January 2026, "New Solid Waste Management Rules Notified; To Come into Force from April 1, 2026": https://www.pib.gov.in/PressReleasePage.aspx?PRID=2219676&reg=3&lang=1 . Read in full on 2026-11-10. This is the official summary of the four streams, what each contains, how each is handled, the bulk generator definition and extended responsibility. The notification itself in the Gazette was not read.
- MoHUA Annual Report 2025-26, section 4.13 (PDF page 29): 97% door-to-door collection (`data/mohua_statements.csv`).
- Swachhata-MoHUA app description: https://sbmurban.org/swachhtha-app and public descriptions of its photo, location and resolution flow.

## Limits and honesty
- The log and the letters are drafts. We never send, file or upload anything. The text says to check every line before sending.
- The four-stream and bulk-generator facts come from the PIB release, not the Gazette notification. Penalty amounts and the full bulk generator duties are not stated because we have not seen them in a primary source.
- Hindi, Tamil and Telugu stream names are provisional machine-assisted translations and need a native speaker's check before wide use. The rest of the page is English only for now.
- We have not verified the app's category names or how long it says resolution takes; the page says so. The ministry's resolution percentages count tickets closed by the civic body, not residents satisfied.
- "Reality" on the Start page links to Your ward (`docs/ward_reports.md`). Those taps are stored on the resident's own device, so no one else's reports are shown, and they are unverified.
- The medicines example comes from the PIB list (special care waste). Items the notice does not list return "not in the list we have".
