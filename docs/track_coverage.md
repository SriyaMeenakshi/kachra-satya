# How the project covers the Waste Management track

Track text: "Segregation, collection routing, recycling markets, landfill and plastic tracking."
TrashTally is the data-integrity layer for those decisions. This page says what each segment has and what it does not.

| Segment | What we provide | Files | Limit |
|---|---|---|---|
| Landfill | A dedicated **Landfill** tab under Insights: national landfilled tonnes and share for three years, a state table for two, MoHUA's national legacy-dumpsite statements side by side (Nov 2024 and Nov 2025), and the 214 priority dumpsites by state and by city from the MoHUA DRAP annexure (189 itemised, 179 cities, 30 states; Maharashtra and Bihar printed as Reserved). No site coordinates, and no progress per site, are published in these documents. Landfill dependence by state (landfilled / generated) for 2021-22 and 2022-23, the unaccounted share, national landfilled 2021-22 to 2023-24, legacy dumpsite counts in the Q682 reply | `data/state_indicators.csv`, `data/national_stated.csv` | State landfilled is not reported for 2019-20, 2020-21 and 2023-24 |
| Collection | Collection percentage and uncollected tonnage by state and year | `data/state_indicators.csv` | State level only |
| Collection routing | A truck-priority list: states ranked by tonnage left uncollected (CPCB 2023-24), and a ward-level ranking for any city that uploads its own data | `data/truck_priority.csv`, `scripts/audit_city.py` | Prioritisation, not route optimisation. Real routing needs ward geography and vehicle data we do not have |
| Segregation | National segregation indicators from the GFC 2022 dashboard: 22,180 wards (86.2% of 25,726 covered) have over 90% door-to-door collection, but only 9,031 wards (35.1%) have over 90% source segregation. City-level segregation checks (segregated above collected) in the uploader | `data/national_segregation.csv`, `scripts/audit_city.py` | National only, 2022 only, on-field validation. No state table is published on that page |
| Tracking | Every figure traced to a source page; flags for figures that cannot both be true; claim checker; phantom tonnes; volatility | `receipts/`, `data/flags.csv`, `scripts/claim_checker.py`, `data/phantom_tonnes.csv`, `data/volatility.csv` | Tracks reported figures, not physical waste |
| Recycling markets | Not covered | none | No recycling or price data in the repo, and none is estimated |
| Plastic tracking | Not covered yet | none | Would need the CPCB plastic waste annual report and Parliament answers, downloaded by hand |

## Audit Your City
`scripts/audit_city.py` runs five consistency rules on a CSV a city supplies (`data/city_audit_template.csv` has the columns): collected above generated, segregated above collected, treated above collected, treated plus landfilled above generated, and a metric missing in some periods. It also ranks wards by tonnage left uncollected. Blank cells stay "not reported". The test fixture `tests/fixtures/city_FICTIONAL_example.csv` is fictional and exists only for tests.
