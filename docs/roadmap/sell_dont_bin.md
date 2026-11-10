# Roadmap spec O2: Sell, don't bin (dry waste into income)

Status: ROADMAP (spec only, not built). Owner: Sriya. Written 2026-11-10. Not buildable now: we hold no price data.

## Who and why
A household, a housing society or a small shop sorts its dry waste (paper, plastic, metal, glass, wood, rubber, the dry stream in `docs/saathi.md`) and asks: who will take this, and for how much? Dry waste that is sold or handed to a recycler does not need to go to a landfill, and it gives the people who collect it a living. The idea turns "segregate" from a duty into a reason.

## What we do not have
- **No prices.** We have no scrap or recyclable rates for any city, material or date. Not one number about earnings may appear in the app until a dated, public source is in `SOURCES.md`.
- **No list of buyers.** We have no register of scrap dealers, aggregators, recyclers or Material Recovery Facilities. The nearest-drop-off idea (M4, `docs/team_split_v3.md`) would use OpenStreetMap recycling points for one city and says "may be incomplete".
- **No evidence about who benefits.** Whether sellers, middlemen or collectors keep the value is not in any document we hold.

## What a first version could show without prices
1. The dry-waste stream and what goes in it (from the official notice via `docs/saathi.md`).
2. How to prepare it so a buyer will take it (clean, dry, separated by material). Source needed before we publish a how-to; do not write it from memory.
3. Nearby places that may take it, from M4, labelled "may be incomplete, call before you go".
4. A blank "ask for the rate" prompt: what to ask a buyer (rate per kilogram by material, pickup or drop-off, payment terms), so a person can compare offers themselves.

## Data needed before showing any money
- A published municipal or state rate card, or a dated survey of buyers, for at least one city.
- Who published it, the date, and the unit. Rates change with the market, so every rate shows its date and "may have changed".
- A way for the city's buyers to correct their own entry, or a clear statement that the entry is a snapshot.

## What we would not claim
- That a household will earn any amount.
- That selling is better than any other route for every material or every city.
- Anything about waste pickers' or dealers' incomes without a source (see the waste-picker research item, M6).
- That the app arranges a sale: it only helps a person find who to ask.

## Before building
1. Find one city with a published rate card or survey, and read it.
2. Ask two housing societies or dealers what they would want to see, and note the answers as notes, not data.
3. Decide with the M4 owner whether the nearest-drop-off page can carry the "ask for the rate" prompt.
