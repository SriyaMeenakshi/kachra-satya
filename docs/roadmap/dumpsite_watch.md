# Roadmap spec O5: Dumpsite watch

Status: ROADMAP (spec only, not built). Owner: Yasaswini. Written 2026-11-10.

## Who and why
A resident, councillor or reporter near an old dump asks: is this dump counted, and is it being cleaned up? Legacy dumpsites mean smoke, smell, groundwater and fires near homes. The government publishes counts and a target, but a person cannot see whether their dump is on the list.

## What the data we already hold says
- **National, Lok Sabha Q682 (28 Nov 2024), part (b):** 2,417 dumpsites (each with more than 1,000 tonnes of waste) holding 24.88 crore tonnes were identified for remediation; 641 were remediated completely and 1,144 were in progress; 12.66 crore tonnes (51%) of waste remediated and 5,694.86 acres (39%) of land reclaimed. (`data/raw/ls_au682_2024-11-28.docx`)
- **State-wise, CPCB annual reports, Table 8 "State wise details of dumpsites":** the 2021-22 report (PDF pages 75 to 76) prints a total of 2,452 existing dumpsites, 366 reclaimed or capped and 27 converted to sanitary landfill; the 2022-23 report (PDF pages 85 to 86) prints 2,474, 377 and 44. Both PDFs are in `data/raw/`. Per state the counts move between the two reports (for example Madhya Pradesh 159 dumpsites with 114 reclaimed or capped in 2021-22, 136 with 50 in 2022-23), and the tables are formatted differently: the 2022-23 table uses words such as "NIL", "Under progress" and "All dumpsites have been closed" in cells that are numbers elsewhere.
- **The 2026 rules:** the Solid Waste Management Rules, 2026 provide for a centralised online portal to track biomining and bioremediation of legacy dumpsites, annual landfill audits by State Pollution Control Boards, and District Collectors overseeing landfill performance (PIB release of 28 Jan 2026).

## What we do not have
Locations or site-level status of any dumpsite. The Q682 reply and CPCB Table 8 give counts, not sites. The SBM-U dashboard page we opened is a national summary for 2022 with no site list.

## A version we could build (state level)
A page per state with: dumpsites counted in each CPCB report, how many reclaimed or capped, how many converted to sanitary landfill, and a plain reading ("X dumpsites were counted in 2022-23, Y of them reclaimed or capped"). Each count links to its source page (the receipts viewer already supports this). It would also show that the national counts of CPCB (about 2,450) and MoHUA (2,417, with a 1,000-tonne cut-off) are different definitions, and say so. Estimated 5 to 6 hours including extraction and tests.

## What we would not claim
- That any particular dump near a user is on the list, or is being cleaned.
- That the CPCB and MoHUA counts conflict: they may use different definitions. We would show both and say they differ.
- Any health or risk statement about a site.

## Before building
1. Parse Table 8 for both years, handling the "NIL" and text cells, and check the column sums against the printed totals.
2. Check whether the new national portal publishes site-level data once live, and prefer it if it does.
3. Show one state to a resident group and ask whether a count helps them or whether they need a map.
