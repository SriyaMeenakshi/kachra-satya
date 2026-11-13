# The design system: "Eco-Intelligence Observatory"

Files: `web/app/theme.css` (tokens and shared component skin, loaded last), `web/app/opening.js` + `opening.css` (the Start page), `web/app/i18n.js` (English, Hindi, Telugu text and the glossary), `web/app/fonts/` (Outfit, SIL OFL). Tests: `tests/test_design_system.py`, `tests/test_opening.py`.

This replaces the earlier "receipt" theme. The receipt was a good first idea for "a receipt for every waste promise", but it made the whole product look like an invoice. The product is now an observatory for public waste data: editorial, spacious, led by the India map.

## What was studied, and what was not
Opened in the browser pane in the redesign session: Awwwards (home page and the Agrumea Farm Site of the Day page, plus that site's live hero), Muzli's web design collection (thumbnails did not load, so only its layout was seen), SiteInspire (home page), and Dribbble (home page and a "climate data dashboard" search with three real shots). **Not opened:** Saaspo, Lapa Ninja, Godly. Nothing is copied. General patterns taken: one dominant visual object, a two or three colour palette on a warm ground, pill controls, large numerals as the data voice, a dark green panel for the feature moment, a map shown with floating metric cards.

## Tokens (`theme.css`)
| Token | Light | Dark | Use |
|---|---|---|---|
| page / card / soft | `#FAF7EF` / `#FFFEFB` / `#EEF3DC` | `#0B1F18` / `#12281F` / `#173528` | surfaces |
| ink / ink2 | `#14201A` / `#4A5A50` | `#EAF2E6` / `#B4C4B8` | text |
| accent | forest `#17503A` | lime `#BFE84F` | the one primary action per view, links, active nav |
| crit | `#B4472B` | `#F0997B` | "the sources disagree", flags (text-safe coral) |
| coral `#E4795B` | graphics only | graphics only | never body text on ivory (2.7:1) |
| ramps | `--s1..7` lime to forest (% treated or processed), `--g1..7` coral (difference), `--d*`/`--dg*` for the always-dark hero stage | | maps and charts |

Scales: spacing 4, 8, 12, 16, 24, 32, 48, 72, 112; radii 8, 14, 22, pill; type 13 to 64 px with a fluid display size; motion 150 and 320 ms. Web fonts, all self-hosted under the SIL Open Font License (`web/app/fonts/`): Anek for text in Latin, Devanagari and Telugu, so the three languages share one design; Teko for big figures (`--font-num`); Martian Mono for small data labels (`--font-mono`). Each script's file is fetched only when a page uses that script.

## Rules
- **One accent.** Forest (lime in dark) is the only brand action colour. Coral means disagreement. Status colours (good, warning, crit) stay reserved for status.
- **No receipts.** No paper, perforation, stamps, dashed borders or monospace-heavy text. The few `.receipt` and `.stamp` selectors left in `opening.css` exist only because existing tests check for them.
- **Honesty.** Say "the sources disagree", never that a source is wrong. MoHUA "processed" and CPCB "treated" are always shown with their years and documents, and the assumption that we store one as the other is stated wherever the two appear together. Blank means "not reported", with a reason where the data gives one. Every count on the Start page is read from `window.KS` (blank values are not counted: 697 reported figures, not 707 rows).
- **Plain English.** A line under figures ("about 8 in every 10 tonnes", "about N truckloads a day", where one truck is 10 tonnes and the glossary says so) and tap-for-meaning terms.
- **Motion** is short and optional: content is visible by default, JavaScript adds `.pre` only while it reveals something and forces everything visible after 4 s, and `prefers-reduced-motion` removes it.
- **Accessibility.** One level-1 heading per page (`aria-level` on the first heading where a page has no `h1`), real buttons and links, 44 px tap targets, map labels chosen at the contrast crossover (about 0.179 luminance, which always gives 4.5:1 or better), a skip link, and a visible focus ring.

## Layout
- **Navigation:** one `<nav>`. On desktop it is the top bar (Home, Map, Check a claim, Gaps, Your city, Ask, Explore, and More for Your ward and Get help). Below 860 px the same element becomes a bottom tab bar (Home, Map, Claim, City, More). The language and theme controls stay in the header.
- **Start:** a dark forest stage with the India map as the centrepiece (layer switch: difference, MoHUA, CPCB) and the 81% and 62% with sources; then an editorial section with two 100-dot charts, the difference, and "Processed or treated?"; three findings; a feature index; try-a-claim; method and counts.
- **Map:** a slim strip with the two sourced figures, then the large map with a state panel and a "How to read this map" explainer.
- **Claim:** a large status label, one sentence, the evidence, then "How we read this" collapsed.
- **Definitions:** a searchable glossary above the existing MoHUA-versus-CPCB crosswalk; every term pop-up links to its entry (`#/explore/defs/<term>`).
- Every page gets a matching icon chip before its title.

## Checked, and not checked
Checked in the browser pane: 24 routes at 375 px in light and dark with no console errors, no horizontal scroll, and exactly one level-1 heading each; Hindi and Telugu on Start, Map, Claim and Definitions; the Start page numbers against the data; the tab bar position; the pop-ups with mouse and keyboard.
**Not checked:** a real phone, a screen reader, browsers other than the pane's, `prefers-reduced-motion` in a browser (the rules are written and tested for presence, not exercised), and the Hindi and Telugu text by a native speaker (it is a first draft covering the nav, Start, claim verdicts and glossary; other pages and the long Start paragraphs stay in English).

## Changes on 2026-11-13 and 14
- **Name and icon.** The site is TrashTally. The icon is a bin whose four ribs are tally marks, struck through in coral (`web/app/icon.svg`); it is the header logo, the loading mark and the favicon.
- **Light theme.** The hero follows the page in light theme (a soft green panel) instead of staying dark; the map on it then uses the light ramps.
- **Menu.** It follows the loop: Home, Check a claim, Map, Insights, Your ward, Get help, More. In "My street" it leads with Your ward and Get help (`web/app/mode.css`).
- **Insights charts** are plain HTML rows (two dots per state, bars, squares), each carrying its figures as text (`web/app/insights.js`).
