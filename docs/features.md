# Features: what each part of the app does

This page explains every feature of the Kachra Satya web app (`web/app/`) in plain words: what it is for, what you do, what you get, and what it does not do. The idea behind all of it is a receipt for every waste promise: **Promise, Proof, Reality, Action** ([central_idea.md](central_idea.md)).

Two rules hold everywhere: we never invent a figure (a blank says "not reported"), and when the sources disagree we say "the sources disagree" instead of picking one.

## 1. Home (`#/start`)
**For:** anyone arriving cold.
- **Goal chooser:** "What brings you here?" offers five goals plus "just look around". Each goal starts a guided path (section 12).
- **Why this matters:** four stakes computed from the data, not typed in: the share of solid-waste money used, tonnes a day CPCB found neither treated nor landfilled, door-to-door collection against source segregation, and the gap between the two national "treated" totals.
- **The main parts as one road:** Hear it, Check it, See your street, Do something, each with a real number and links to the pages.

## 2. Map (`#/map`)
**For:** seeing where the two official sources differ.
- A geographic map of 36 states and UTs coloured by the MoHUA figure, the CPCB figure, or the gap between them. A Tiles switch gives an equal-size tile map.
- Tap a state to see both figures, their years, and the source page.
- Limits: the two sources cover different years; the boundary has not been checked against the Survey of India map ([map.md](map.md)).

## 3. Check a claim (`#/claim`)
**For:** a number you heard in a speech, a news story or a post.
- Type a sentence such as "81% of India's urban waste is processed".
- The checker compares it with every source we hold and shows who agrees and who does not. The verdict can be "the sources disagree".
- The browser checker gives the same verdicts as the Python one (a test enforces it).
- If no source gives your figure but the sources themselves disagree (for example 70% when the sources range from 47% to 81%), it says the sources disagree instead of calling you wrong. Outside every figure we hold, it says nothing supports it.
- It refuses what it cannot check and says why: a place we hold no figures for, or a collection or segregation percentage (we hold no such percentage in that form).
- It does not say which source is correct.

## 4. Gaps (`#/gaps`)
**For:** where the money and the tonnes go missing.
- **Phantom tonnes:** waste reported generated but not accounted as treated or landfilled.
- **Money vs mess:** share of solid-waste funds used against percent treated, per state.
- **Collection and trucks:** the collection gap and a truck priority list with landfill share.
- **Segregation gap:** door-to-door collection against source segregation.
- **Completeness:** how much of each state's data is reported.
- Limit: the funds table prints no unit, so only ratios are used.

## 5. Your city (`#/city`)
**For:** a municipality, journalist or student with ward-level data.
- Upload a table and the checker shows which figures cannot all be true (for example, treated above collected).
- The file is read in your browser; nothing is uploaded to a server.

## 6. Ask (`#/ask`)
**For:** questions in your own words and language.
- English, Hindi, Tamil or Telugu, answered from the data, with the source named.
- Voice: speak a question and hear the answer where the browser has speech tools. Typing always works.
- Your question is sent to our server and may go to Google Gemini; the page says so and asks you not to type personal details. Questions are limited to 500 characters and 20 a minute per visitor.
- Needs the Q&A agent (`agent/`). Without it the page says "not connected yet". See [../agent/README.md](../agent/README.md) and [deploy.md](deploy.md).

## 7. Explore (`#/explore`)
**For:** checking our work and finding what to audit.
- **Audit first:** a transparent ranking of states where an audit would learn most.
- **Receipts:** open the source page for a figure with the number boxed. 605 of 706 figures are located; the rest show the page or say there is no page image.
- **Swings:** how much a state's own reported figure changes between reports (Nagaland: 664 tpd in one CPCB report, 29 tpd in a MoHUA answer).
- **Definitions:** "processed" and "treated" may not mean the same thing; the crosswalk shows why we do not say who is right.

## 8. Get help (`#/help`)
**For:** a resident whose garbage is not being collected, or who is unsure what to do with it. See [saathi.md](saathi.md).
- **Complain:** writes a clear complaint with a landmark and photo prompt, for you to file on the official Swachhata-MoHUA app.
- **Log:** a dated log of complaint numbers and days open, kept in your browser.
- **Escalate:** a letter to the Municipal Commissioner citing the 2026 rules and official figures.
- **Which bin:** the four streams under the Solid Waste Management Rules 2026.
- **Bulk generator check:** whether an institution is over the 100 kg a day threshold.
- Everything is a draft. The app never sends anything for you.

## 9. State card and Briefing (`#/brief`)
**For:** a reporter, councillor, MLA or MP.
- **State card:** both official numbers for a state in plain words, with source pages, copyable as a message.
- **Briefing:** a one-page text with questions that could be put, generated only from what the data shows. Check your House's rules on form and timing ([leaders_schools_spotcheck.md](leaders_schools_spotcheck.md)).

## 10. Schools (`#/school`)
**For:** a class or eco-club.
- Weigh a week of school waste in a grid and get a report card. Safety notes (gloves, sealed bags, no opening special care waste) are on the page.

## 11. Your ward (`#/ward`) and Nearest drop-off (`#/dropoff`)
**For:** seeing whether it is true on your street.
- **Ward:** tap whether the garbage truck came today, keep a 30-day calendar beside the official figures, print a QR code for a ward, and see a green-ward badge ([ward_reports.md](ward_reports.md)).
- Reports are unverified and stay in your own browser; no shared server exists yet. Scanning a printed QR on a real phone is not yet tested.
- **Drop-off:** where to take batteries, e-waste and other special items.

## 12. Guided paths
**For:** a visitor who does not know where to start ([guided_paths.md](guided_paths.md)).
- Five goals, each a short path of existing pages with a bar showing the step, why it matters, and Back and Next:
  1. Get my garbage collected: complain, log, escalate, check bins.
  2. Check a number someone quoted: claim, source pages, state map, state card.
  3. Understand the problem in 3 minutes: two numbers, map, gaps, definitions.
  4. Prepare something to cite or ask: state card, briefing, claim, source pages.
  5. Run a school waste challenge: bins, school grid, bulk generators.
- Pages outside a path end with a "What next?" row. If browser storage is blocked, the pages still work without the bar.

## 13. Across the app
- **Languages:** English, with Hindi, Tamil and Telugu partly translated. The Hindi, Tamil and Telugu stream names are provisional until a native speaker checks them.
- **Design:** the "Eco-Intelligence Observatory" system, light and dark ([ui_theme.md](ui_theme.md)).
- **Privacy:** logs, ward reports and uploads stay in your browser.
- **Honesty:** every figure keeps its source document and page; see [methodology.md](methodology.md) and [track_coverage.md](track_coverage.md) for limits.
