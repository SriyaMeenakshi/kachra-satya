# Impact and evidence: what we can show, and what we cannot

Written 2026-11-12. This page keeps two things apart on purpose, because mixing them is how projects overclaim.

1. **Evidence of the problem.** What the published documents we hold show about the waste figures. This is real, sourced, and checkable now.
2. **Evidence of impact.** Whether people used the tool and whether it helped them. **We have none yet.** There are 0 recorded user sessions (`data/user_tests.csv` does not exist yet; the template is `data/user_tests_template.csv`). Nothing below is a user result.

## 1. Evidence of the problem (from the documents in `data/raw/`)
Every line is computed from the data in this repo and opens on its source page in the app.

| What the documents show | Figure | Source |
|---|---|---|
| The two national "treated" totals are far apart | 17,420 tonnes a day (MoHUA 2025-26 processed 131,530 minus CPCB 2023-24 treated 114,110) | MoHUA answer Q2433; Lok Sabha Q50 |
| Waste CPCB found neither treated nor landfilled | 28,576 tonnes a day, 2022-23 | CPCB report 2024-25, p.66 |
| Money set aside for solid waste that had been used | 16% (1,751.96 of 10,930.12) by 25 Nov 2024; the table prints no unit, so only the share is used | Lok Sabha Q682 |
| Wards with over 90% door-to-door collection, against over 90% source segregation (2022) | 86.2% against 35.1% | MoHUA Garbage Free Cities 2022 dashboard |
| A state reporting more waste treated than collected | Kerala, 4 years | CPCB reports |
| The same state's generated waste, in different reports | Nagaland 664 tonnes a day in one CPCB report, 29 in a MoHUA answer (22.9 times) | CPCB report; MoHUA answer |
| Consistency flags raised by our six rules | 72 | `data/flags.csv` |

What this does and does not mean: these figures are self-reported by states, cities and boards. They show that the published numbers cannot all be true. They do not show which are wrong, and they are not a measure of anyone being helped.

## 2. Evidence of impact: how we will get it, honestly
Do not invent or estimate any of this. Report the real count, even if it is small, and say plainly that it is a usability check, not a pilot.

1. **Run sessions.** Use the six tasks and the consent wording in [user_tests.md](user_tests.md). Record one row per person in `data/user_tests.csv` (copy `data/user_tests_template.csv`). Then `python scripts/user_tests_summary.py` prints the real counts.
2. **Anonymous usage summary.** Get help, Log tab, has a button "Copy my anonymous summary". It copies counts only (complaints logged, open and resolved, ward days tapped, days the truck did not come), with no names, places or text. A tester can paste it into a shared form. It is a convenience, not tracking: nothing is sent anywhere.
3. **Server counts, if wanted.** The live host's own request log can give the number of page loads and Ask questions for a date range. Report them as page loads, not as people.
4. **Say what it is.** In the README and the video: "N people tried it; this shows usability, not impact on garbage collection."

## A quicker route to one real case (added 2026-11-14)
The ward case file makes one real example cheap to get. Ask one person (a family member, a neighbour) to open their ward page, tap whether the truck came for three or more days, and press "Copy as text" on the case file. With their consent, that text is a real resident's record set beside their state's official figure. Report it as one person's unverified record, not as a finding. If sign-in is switched on, the ward's shared total gives a second real number: how many people reported.

## What goes in the submission
- The problem evidence above, with the source pages.
- The real number of sessions and what they found, even if it is 5.
- A plain line that field impact (garbage actually collected after a complaint) has not been measured.
