# Roadmap spec O3: Compost and biogas calculator for apartment complexes

Status: ROADMAP (spec only, not built). Owner: Yasaswini. Written 2026-11-10.

## Who and why
The secretary of a residents' society, a facilities manager, or a school or hospital administrator who has to decide what to do with a large amount of wet waste. Under the Solid Waste Management Rules, 2026, a bulk waste generator must process wet waste on site as far as possible, or obtain an extended bulk waste generator responsibility (EBWGR) certificate where on-site processing is not feasible. A first question is simply "are we a bulk generator, and how much wet waste is that?"

## What is verified
- The bulk waste generator definition: floor area of 20,000 square metres or more, or water use of 40,000 litres a day or more, or solid waste of 100 kg a day or more. The "Bulk generator?" check in the app already applies it (`web/app/saathi.js`).
- Wet waste is kitchen waste, vegetables, fruit peels, meat and flowers, and it "shall be composted or processed through bio-methanation at the nearest facility". Bulk generators account for nearly 30 per cent of total solid waste generation. (PIB release of 28 Jan 2026.)
- India's average waste generation is about 155.87 grams per person per day (CPCB Annual Report 2022-23, page 8). That is all waste, not wet waste only, and it is an average across very different places.

## What we do not have (and must not invent)
- The wet share of waste for a society or city, from a source we trust.
- Capacity, floor area, running time, cost and output of composting and biogas units.
- The procedure, fee and timeline for an EBWGR certificate.
- Any figure for savings or income.

## What the calculator could do once those are sourced
1. Take flats and people per flat, or a measured week of weighing (the school challenge template works for this), and show kilograms a day, labelled "computed" when it uses the national average.
2. Say whether the society meets the bulk definition and cite the rule.
3. Show what a vendor would need to handle (kilograms of wet waste a day), without recommending a product or promising a cost.

## What we would not claim
That on-site composting is feasible, cheap or profitable for a given society; that any equipment performs at a stated rate; or any legal conclusion beyond quoting the rule.

## Before building
1. Find primary sources for the wet share and for unit capacities and costs, for example CPHEEO or MoHUA manuals and toolkits, and CPCB guidance. Record each in `SOURCES.md`.
2. Pilot with one society: weigh for a week, compare with the estimate, and get two vendor quotes in the vendor's own words.
3. Check the official notification (not only the PIB summary) for what "as far as possible" means and when a certificate is required.
