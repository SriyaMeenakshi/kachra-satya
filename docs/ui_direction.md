# UI direction and design mock

Mock: `web/mock/index.html` (run `python -m http.server 8777` from the repo root, open http://127.0.0.1:8777/web/mock/index.html). It is built on the real data in this repo, so the numbers are real. It is a design reference for the app, not the app.

## Four directions considered
| Direction | Feels like | Good for us | Risk |
|---|---|---|---|
| **1. Editorial audit** (chosen) | Data journalism: big numbers, plain headline, one chart per idea, generous white space. References to look at: Our World in Data, the Financial Times and Reuters graphics desks, The Pudding. | Our story is a contradiction between two numbers. A big-number duel plus one map tells it in five seconds. | Needs discipline: few colours, short copy. |
| **2. Government service** | GOV.UK Design System or US Web Design System: plain, accessible, form-first. | Credible with officials and judges; strong accessibility defaults. | Reads as a form, not a finding; weak for the map. |
| **3. Analyst dashboard** | Dense multi-panel BI tool. | Powerful for the audit list. | Too many numbers at once buries the headline; harder on phones. |
| **4. Forensic / evidence board** | Case-file look: stamps, receipts, red strings. | Matches the "receipts" idea. | Easy to overdo; risks sounding like an accusation, which we must avoid. |

Chosen: direction 1, with one idea borrowed from 4 (the source page shown beside every number as a receipt) and the accessibility discipline of 2.

## What the mock shows
1. **Hero duel:** MoHUA 81% against CPCB 62%, the 17,420 tpd between the two national treated totals, and the caveat in plain words (different years, possibly different definitions, we do not say which is right). Numbers are read from the data, not typed in.
2. **Truth Gap Map:** a tile-grid cartogram, one tile per state or UT laid out roughly by geography. It needs no map file, never hides small states such as Chandigarh or Goa, and works at phone width. A switch colours by CPCB % treated, MoHUA % processed, or the gap in points. A red corner marks states flagged within a single source. Selecting a state opens a panel with its figures, flags and the source page with the figure boxed. "View as table" gives the same data as text.
3. **Check a claim:** paste a sentence, get a verdict ("The sources disagree"), who agrees and who does not.
4. **Findings:** three cards: the 17,420 tpd gap, Kerala treated above collected in four years, Nagaland's 22.9x swing.

## Design rules used (hand these to whoever builds the real app)
- **Palette:** surfaces, ink and the blue ramp come from the validated reference palette of the data-viz guidance. One hue for magnitude, seven steps. Status red appears only as the flag corner and pills, and always with a word ("flagged", the year), never alone.
- **Dark mode is selected, not inverted:** the ramp is re-ordered so "more" is brighter on dark, and ink and surfaces use the dark tokens. A Theme button remembers the choice and falls back cleanly if storage is blocked.
- **Type:** system sans, large tabular numbers for figures, one weight step for emphasis. No decorative fonts, no external requests.
- **Honesty in the interface:** "not reported" and hatched tiles for blanks; "the sources disagree", never "wrong"; the year of every figure beside it; attribution footer.
- **Accessibility:** every tile is a button with a full-sentence label; focus rings; table view; colour is never the only carrier of meaning; layout checked with no horizontal scroll at 375 px.

## Components adopted from design systems, and native elements used
I read the GOV.UK Design System pages for [Summary list](https://design-system.service.gov.uk/components/summary-list/), [Warning text](https://design-system.service.gov.uk/components/warning-text/), [Details](https://design-system.service.gov.uk/components/details/) and [Tag](https://design-system.service.gov.uk/components/tag/) and applied their rules. Nothing was copied from their code or styling, and the mock deliberately does not look like an official government site; we are not one.
| Pattern | Rule taken | Where in the mock |
|---|---|---|
| Summary list | A `<dl>` of key and value for key facts; not for tabular data (use a table for that). | The state panel: figures are key/value rows. The "view as table" and the audit list stay real tables. |
| Warning text | Icon, bold text, and a visually hidden "Warning" so a screen reader announces it. | The caveat under the hero: different years, possibly different definitions. |
| Details | For information only some readers need; short descriptive summary; not for what most readers need. | "How we compare the two numbers" (the crosswalk rows for definitions, year and base). |
| Tag | Status only, adjectives, never a link or button. | The flag pills ("flagged" plus the year) are plain text, not interactive. |
Native HTML used instead of scripts: `<details>`, `<dialog>` (the enlarged source page opens with `showModal()`, so Esc and focus handling come from the browser), the `popover` attribute (the glossary on "treated"), `<dl>`, and `aria-pressed` buttons for the colour switch. Map tiles use a roving tabindex: one tile is in the tab order and the arrow keys move to the nearest tile in that direction.
Checked in the browser pane: no console errors, 3 definition entries, popover text present, hidden "Warning" text present, one tabbable tile with arrow keys moving Delhi to Uttar Pradesh and then down to Chhattisgarh, the state panel as a 6-row summary list, and the dialog opening with the page image.

## Not done or not verified
- The colour ramp was taken from the reference palette; I did not run the palette validator on it (it checks categorical palettes), and I did not measure text contrast on every tile. Tile text switches between black and white by luminance.
- No light-mode screenshot of the full page was reviewed beyond the hero and map section; dark mode and the 375 px layout were looked at.
- The real app still needs: the Audit Your City upload, the phantom tonnes and money-vs-mess pages, the deployed Q&A agent. Not tested with a real screen reader, and the popover and dialog elements need a current browser.
- The page images need the repo's `receipts/` folder served at `../../receipts/`; change `RB` in the script if the app is hosted elsewhere.
