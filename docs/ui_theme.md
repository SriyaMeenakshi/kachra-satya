# The opening and the central theme: "the receipt"

Files: `web/app/opening.js`, `web/app/opening.css`, hooked into the Start route in `web/app/saathi.js` (the plain Start page stays as the fallback).

## What I looked at (and what I did not)
You gave a list of inspiration sites. In the time available I opened the Awwwards home page and the Muzli web design collection, and I read the DEV article's ten-site list as text. I did not study Dribbble or the other eight sites in the article, so nothing below claims anything about them.
What I saw, in general terms:
- **Awwwards (Site of the Day, 10 Nov 2026):** very large, tightly set sans headlines in near-black on a flat light ground; its collections include "Black and White Websites" and "Text Marquee animation", so monochrome plus moving text is a current direction.
- **Muzli's web design examples:** bold flat colour blocks, a single accent colour against a mono base, product screens shown as clean cards, and playful texture (halftone or line art with one coloured line).
- **The DEV article's advice:** study patterns, layouts and flows that solve a problem, not trends for their own sake.
Nothing here is copied from any of these sites; I took only the general direction: big type, a monochrome base, one hot accent, a moving text strip, and a strong single object on the page.

### The rest of the list (second pass, same day)
I then opened the others in the browser pane. What each gave me, and what it did not:
- **Dribbble:** rendered blank in my pane, so I saw nothing and say nothing about it.
- **Godly:** it now redirects to recent.design: a card grid of experimental poster, branding and interface work, with ASCII and halftone texture, pill filters and a "Recent" sort.
- **Land-book:** soft grey tiles with a large radius, a green accent, a cookie dialog (I did not accept it; the page loaded anyway).
- **SiteInspire:** very quiet chrome, a small red dot as the only brand colour, pill tabs (Popular Categories, Styles, Types), thumbnails with title, date and credit on one line.
- **Refero and Mobbin:** a serif display headline on a warm off-white page (Mobbin's styles did not fully load for me, so I only read its copy: "Where teams and agents find designs that work").
- **Lapa Ninja:** a screenshot-first grid with title and small grey category tags under each card.
- **One Page Love:** a warm beige page, headline words underlined in red by hand, mono captions, red pill buttons.
- **Not opened:** SaaSpo and Landingfolio.
Across all of them: warm off-white grounds, one red or orange accent, pill chips and tabs, mono captions, and a strong single headline. That agrees with the receipt direction, so the second pass changed one thing (warm paper instead of cool grey) and applied the theme to every page.

## The theme across the whole app (`web/app/theme.css`)
A small layer loaded last, so it only adjusts tokens and shared components:
- Light mode gets a warm paper page and cards; dark mode keeps the app's own dark tokens.
- Page titles are tighter and heavier with a dashed "tear line" under the first line of text.
- Cards get a thin ink border and no shadow; primary and secondary buttons are pills; tabs and notices get printed-ticket borders (dashed for notices).
- Claim verdicts read like a rubber stamp (uppercase, outlined, slightly rotated; no rotation under reduced motion or print).
- The brand gets a tiny torn-receipt mark. Footer gets a dashed rule.
It changes no behaviour. Checked in the browser on the claim, help, map and state card pages in dark and light.

## The central theme: a receipt
Our idea is "a receipt for every waste promise" (`docs/central_idea.md`), so the opening makes the idea literal. The hero is a thermal-paper receipt that prints two lines and stamps the result:
- Line 1, "Promised": Housing Ministry, 81 kg of every 100 processed (2025-26).
- Line 2, "Recorded": pollution board, 62 kg of every 100 treated (2023-24).
- A dashed rule, the difference in tonnes a day, and a rubber stamp: THE SOURCES DISAGREE.
Every number is read from the data, with its document and page and a "source page" button that opens the page image.

Below it: a ticker of real citations (state, figure, document, page), four numbers read from the data (36 states and UTs, 707 figures, 696 with a source page, 72 flags), the four-step loop as perforated stubs (Promise, Proof, Reality, Action; Reality is marked "No reports yet"), a Try it box wired to the Claim Checker, the shortcuts for what a person needs, and a "What we won't do" note.

## Rules for the theme (hand these to anyone extending it)
- **Colour:** the page keeps the app tokens (light and dark). The receipt is always paper-coloured so its ink has contrast in both modes. One accent only (warm orange-red) for the headline highlight, the step numbers and the stamp. Status colours stay reserved for status.
- **Type:** system fonts only; no external requests. Headline: 800 weight, tight tracking, mixed case (not shouting). Numerals and the receipt: the system monospace, with tabular figures.
- **Motion:** the receipt prints line by line and the stamp lands; the ticker scrolls and pauses on hover. Everything is visible by default, JS only adds a short "printing" effect and forces everything visible after 4 seconds. Under `prefers-reduced-motion` there is no printing, no stamp animation, and the ticker becomes a static wrapped list.
- **Honesty:** the stamp says "the sources disagree", never "wrong". The Reality step admits nothing is reported yet. The footer note says what we will not do.
- **Accessibility:** one `h1`, the receipt is a labelled figure with real text, the ticker is `aria-hidden` (decorative; the same citations are on the receipt buttons and the Receipts page), focus rings are the app's, and links and buttons are real links and buttons.

## Checked, and not checked
Checked in the browser pane: light and dark, desktop width and a narrow width, the printing effect and stamp landing in a visible tab, the Try it box ("81%" gives "The sources disagree" with the four agreeing and two disagreeing records), no console errors, no horizontal scroll.
Not checked: a true 375 px phone (the pane resized during the test), a real screen reader, `prefers-reduced-motion` behaviour in a browser (the rules are written but not exercised), and browsers other than the pane's.
