# Team split v2: three equal pods (proposal for 10 to 15 Nov 2026)

Hours are rough estimates, not measurements. Each pod owns its features end to end (data, logic and screen), which cuts hand-offs. Totals: 32, 30, 30.
Where a feature's data and logic already exist in the repo, the hours are mostly the screen and the wiring. See `docs/new_features.md` and `docs/track_coverage.md`.

## Pod 1: Trust layer (Yasaswini) , 32 h
| Item | h | What |
|---|---|---|
| Claim Checker screen | 6 | Text box, verdict badge, sources that agree and disagree (`scripts/claim_checker.py`) |
| Receipts viewer | 5 | Click a number, show the page image with the highlight box (`receipts/index.json`) |
| Volatility page | 3 | Ranked swings with source of min and max (`data/volatility.csv`) |
| Definition crosswalk | 3 | MoHUA "processed" vs CPCB "treated": a short table the app can show next to any comparison |
| Risk-based audit list | 3 | "Audit these states first" from flags, volatility and the CPCB-vs-MoHUA gap |
| Recurrence flags | 2 | States that trip the same rule in several years (Kerala treated above collected, four years) |
| MoHUA statements series | 2 | `data/mohua_statements.csv` into the app: MoHUA's own national figure over time |
| Q&A agent on AgentFoundry | 5 | Paste `docs/agentfoundry_setup.md`, run the 6 acceptance questions, fix what breaks |
| Publish dataset | 3 | Methodology note, licence check, Zenodo record |

## Pod 2: Money, gaps and track coverage (Sriya) , 30 h
| Item | h | What |
|---|---|---|
| Phantom tonnes page | 4 | Counters kept separate, years labelled (`data/phantom_tonnes.csv`) |
| Money vs mess scatter | 4 | Utilisation against percent treated, quadrants (`data/money_vs_mess.csv`) |
| State indicators and truck priority | 4 | Collection gap, landfill dependence, uncollected-tonnage ranking |
| Segregation gap panel | 2 | 86.2% of wards collect door to door, 35.1% segregate at source (national, 2022) |
| Reporting-completeness score | 3 | Per state: how many metrics and years are reported |
| Voice questions | 5 | Browser speech in and out for Hindi, Tamil, Telugu on top of the agent; test on real devices |
| Plastic audit | 8 | Needs the CPCB plastic waste annual report and a Parliament answer downloaded by hand; if they do not arrive, drop it and take a share of user tests |

## Pod 3: Platform and delivery (Likitha) , 30 h
| Item | h | What |
|---|---|---|
| App shell, map and navigation | 6 | Truth Gap Map base, state pages, links from every number to its receipt |
| Audit Your City page | 6 | Upload a CSV (`data/city_audit_template.csv`), show flags and the uncollected ranking (`scripts/audit_city.py`) |
| Deploy to a public URL | 4 | |
| README | 3 | Include validation numbers and the honest scope note (`docs/track_coverage.md`) |
| Demo video | 4 | 2 to 3 minutes |
| 20 to 30 user tests | 6 | |
| Recheck the track list, submit | 1 | 15 Nov |

## Timeline
- 10 to 11 Nov: each pod builds its first screens against the CSVs already in the repo; plastic files requested.
- 12 Nov: screens merged into the shell; the agent endpoint available.
- 13 Nov: deploy, then user tests start.
- 14 Nov: final check together; anything unverifiable is marked "unverified" in the app; README and video.
- 15 Nov: submit.

## Rules for everyone
- Never fill in missing data; show "not reported".
- Every number links to its source document and page.
- Wording: "the sources disagree" and "figures that cannot both be true", never "wrong" or "fraud".
- Commit with your own git identity, and agree before pushing to the shared repo.
- If time slips, drop in this order: plastic, voice, publish dataset.
