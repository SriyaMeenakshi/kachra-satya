# State card, briefing, school challenge and the human spot-check

## State card and briefing (`#/brief/card/<state>`, `#/brief/briefing/<state>`; `web/app/leaders.js`)
- **Card:** the two official numbers for a state in plain words ("out of every 100 kg"), with source-page links, the collection share, within-source flags, the share of the solid-waste allocation used (Lok Sabha Q682), and a household scale line from CPCB's national average of 155.87 grams per person per day (2022-23, page 8; the family-of-four figure is our arithmetic and labelled so). Copy it as a plain-text message for WhatsApp or email, download it, or print it.
- **Briefing:** a one-page text for a Member of Parliament, a Member of a Legislative Assembly, a councillor or a reporter: the two figures with sources, what cannot all be true, the money share, and up to four questions that could be put, generated only from conditions present in the data (a CPCB/MoHUA difference, treated above collected, collected above generated, a low funds share, a collection gap below 90%). It says what it does not say and that the user must check their House's rules on the form and timing of questions.
- It drafts text. It never sends or submits anything. Wording stays "the sources disagree"; it never says a figure is wrong.

## School and college waste challenge (`#/school`; `web/app/school.js`)
Students weigh each block, class or the canteen for a week. The page gives a weighing guide (with a safety note: gloves, sealed bags for sanitary waste, no opening of special care waste), a data grid, and a report card: totals, a by-block table (average kg a day, share sorted correctly, share processed on site) and figures to recheck. It uses three school rules, not the city rules (processed-on-site waste is not "collected"): S1 picked up plus processed on site above weighed, S2 sorted correctly above weighed, S3 a figure blank on a day when the block reports it on others. Blank cells are never filled. It points to the bulk-generator check if the average per row is 100 kg or more. The example is labelled fictional. Nothing is uploaded; entries can be downloaded as CSV; the report card can be printed.

## Human spot-check (`web/trust/spotcheck.html`; `scripts/score_human_spot_check.py`)
The earlier 30-cell spot-check was an AI-assisted read. This page is for a person. It shows ten cells (fixed seed 20261110, so everyone sees the same ten) as page images with the figure boxed in red; the person types what they read and only then sees whether it matches. At the end they download a CSV. Then run:

```bash
python scripts/score_human_spot_check.py path/to/human_spot_check_<name>.csv
```
The script re-checks each typed value against `data/waste_clean.csv` itself, prints the match rate and which cells to look at, and appends the rows to `data/human_spot_check.csv`. A mismatch is a prompt to look at the source page together, not an automatic correction. No human result has been recorded yet; `SOURCES.md` must not say a human checked the data until one has.

## Roadmap specs (not built)
`docs/roadmap/compost_calculator.md` and `docs/roadmap/dumpsite_watch.md`. The dumpsite spec notes that state-level counts exist in CPCB Table 8 (2021-22 and 2022-23) even though site-level data does not.
