# Roadmap spec: Plastic audit (requirements)

Status: ROADMAP (spec only, not built). Owner: Sriya. Written 2026-11-10. The track text says "plastic tracking"; today we hold no plastic data (`docs/track_coverage.md`).

## Who and why
A reporter, a state board officer or a recycler asks: how much plastic waste do states report generating and managing, and do the official sources agree? The same consistency checks we run on municipal waste (generated against managed, one source against another, a state against its own earlier reports) could apply, but only once the figures are in hand.

## What we have
- The repo already shows that India's plastic rules exist: Rajya Sabha Q358 (`data/raw/rs_q358_2025-02-06.pdf`, answer part (a)) lists the Plastic Waste Management Rules, 2016 among the waste rules notified by the Environment Ministry.
- Plastic is one of the dry-waste items in the four-stream guide (`docs/saathi.md`). Nothing in the repo gives plastic tonnage, recycling rates or producer obligations.

## What we need, downloaded by hand
Government sites block scripts, so a person must download these in a browser and save them in `data/raw/` with the file name shown, then log the URL and date in `SOURCES.md`:
1. **CPCB's annual report on the implementation of the Plastic Waste Management Rules.** Look on cpcb.gov.in under the plastic waste pages. Save as `cpcb_plastic_<year>.pdf`. We have not seen the document, so we do not yet know its table layout or years.
2. **One or more Parliament answers on plastic waste** (Lok Sabha or Rajya Sabha, Environment Ministry), ideally with a state-wise annexure. Search sansad.in for "plastic waste". Save as `ls_<question>_<date>.pdf` or `rs_<question>_<date>.pdf`.
3. **Optional, to be confirmed:** whatever official portal or dashboard publishes extended producer responsibility (EPR) data for plastic packaging. We do not know what it publishes or whether it is open, so we make no claim about it until someone opens it.

## What we would build once the files exist (about 8 hours)
1. Extract the state tables with the same method as the municipal data (parse, then check column sums against printed totals, then a human spot-check against the PDF).
2. Add rows to the long file with `metric` values such as `plastic_generated`; keep blanks blank.
3. Run the same checks that apply: a managed figure above generated, two reports for one state and year that differ by more than a threshold, a state that disappears between years.
4. One screen in the Gaps tab, with the source page on every number.

## What we would not claim
- Any plastic figure, recycling rate or ban outcome before a document has been opened and the number found on its page.
- That the plastic and municipal-waste figures overlap or add up: they come from different reporting systems and may count different things.
- Anything about plastic pollution in rivers or at sea, which is outside these documents.

## Before building
1. Someone downloads files 1 and 2 and confirms they contain state-wise tables.
2. If they do not arrive by the 12 Nov scope freeze, drop this item and spend the time on user tests (`docs/user_tests.md`), as `docs/team_split_v3.md` says.
