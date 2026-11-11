# Demo video script (2 to 3 minutes)

Status: **script only, not recorded.** Every figure below was checked against `web/trust/data.js` on 2026-11-11; re-check it on the day you record, because the data can change. Narration is about 330 words, which is roughly 2 minutes 30 seconds at a calm pace.

## Before you record
1. Deploy first (or run `python -m http.server 8777` and open `http://127.0.0.1:8777/web/app/index.html`). Say in the video which one it is.
2. Use light mode for the first half and switch to dark once. Keep the browser at about 1280 by 720, zoom 100%.
3. Clear the site's storage so the "New here? Three steps" strip is open on screen.
4. Have a second, narrow window ready to show a phone-width view. Do not use a real person's complaint or ward data. Everything personal on screen must be the fictional example the app provides.
5. If you show Hindi or Telugu, say they are a first draft awaiting a native-speaker check.

## The beats (follow the loop: Promise, Proof, Reality, Action)
| Time | On screen | Narration |
|---|---|---|
| 0:00 | Start page, hero and map | "India's waste story doesn't always add up. The Housing Ministry says 81 percent of urban waste is processed. The pollution board's figures give about 62 percent treated." |
| 0:15 | Click the 81% card's source page, red box on the number | "Both are from government documents, and every number opens the page it came from. These are different years, 2025-26 and 2023-24, and the two bodies may not mean the same thing by processed and treated. We don't say which is right." |
| 0:40 | Scroll to the dot charts and the "17,420 tonnes a day apart" band | "About seventeen thousand four hundred tonnes a day apart. We call it a difference, never an error." |
| 0:55 | Check a claim: paste "81% of India's urban waste is processed", press Check | "Proof. Type a claim someone made. Here the sources disagree: some match, some don't. We show who, with the page for each." |
| 1:20 | Map: pick Kerala, open the flags | "Kerala reported more waste treated than collected, four years in a row. Both can't be true. A flag doesn't say which figure to trust." |
| 1:40 | Map: open a state with a blank (Ladakh), show "not reported" and the reason | "Where a figure is missing we say not reported, and why. We never fill gaps." |
| 1:55 | Your ward (`#/ward`), fictional ward only | "Reality. Does the truck actually come? Residents tap a day. These are unverified reports kept on your own device, and the page says no reports yet when there are none." (Label: **illustrative, fictional ward**.) |
| 2:15 | Get help: complaint writer, fictional example | "Action. We draft the complaint and the escalation letter. We never send them: you do." |
| 2:30 | Switch language to Hindi, then back; show phone view | "It works in English, Hindi and Telugu, on a phone." |
| 2:40 | Start page footer, counts | "Thirty-six states and UTs, six hundred ninety-seven reported figures, six hundred ninety-six open on a source page. All self-reported; we check consistency, not truth." |

## Numbers to confirm on the day
81% MoHUA 2025-26 and 62% CPCB 2023-24 (61.6% computed); 17,420 tonnes a day apart; Kerala four years; 36 states and UTs; 697 reported figures; 696 open on a source page; 72 flags.

## Say, and do not say
- Say "the sources disagree", "not reported", "unverified", "illustrative".
- Do not say a figure is wrong or fake; do not say the app proves anything on a street; do not claim the Q&A assistant works unless it is connected and its six acceptance questions pass (`docs/agentfoundry_run_sheet.md`); do not mention user-test results (none have been run: `docs/user_tests.md`).
