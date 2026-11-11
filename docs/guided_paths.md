# Guided paths: how a first-time visitor finds their way

## The problem
The app has many pages (Map, Check a claim, Gaps, Your city, Ask, Explore, Get help, Briefing, Schools, Your ward, Drop-off). A person who knows nothing about waste data does not know which one to open, or in what order, or what to do with the result.

## What we added (`web/app/guide.js`, `web/app/guide.css`)
1. **A goal chooser on the Home page: "What brings you here?"** Six plain-language goals instead of tool names:
   - My garbage isn't being collected (4 steps)
   - Someone quoted a number. Is it true? (4 steps)
   - I want to understand the problem (4 steps)
   - I'm a reporter, councillor or MP (4 steps)
   - Our school wants to do something (3 steps)
   - I just want to look around (no steps; opens the map)
2. **A path bar** on every page of a chosen path: the path name, "Step 2 of 4", a progress line, one sentence on why this step matters, and Back and Next buttons that name the next step. The last step says "Finish: back to the start". "Leave this path" is always there.
3. **"Go back to your path"** note if you wander off to another page mid-path.
4. **"What next?"** links at the bottom of pages that are not on a path (Map, Check a claim, Gaps, Explore, Your city, Your ward, Ask, Drop-off, Briefing), so no page is a dead end.

The paths use only existing pages; nothing about them changes the data or the pages themselves. State is kept in the browser tab (sessionStorage). If storage is blocked, the pages work as before without the bar.

## Why paths and not a bigger menu
A new visitor can answer "what do I want?" but cannot answer "which of eleven tools do I need?". Each path turns a goal into a short order of pages, says why each step matters, and ends. Every path is 3 or 4 steps so nobody is walked through a manual.

## Checked
In the browser pane: the six goals render; the garbage path ran through all four steps with Back and Next, the last step offers Finish; leaving a path from another page clears it and shows "What next?"; no console errors. `tests/test_guide.py` checks that every step and every "what next" link points at a real page, paths stay at 4 steps or fewer, and the observer that adds the bar cannot re-trigger itself (a first version did, and hung the page).

## Not done
- The top navigation still has the same items. A further simplification (fewer top-level tabs, plain-language labels) would touch Likitha's navigation and mobile bottom bar, so it needs her agreement.
- The new text is English only. The app's Hindi, Tamil and Telugu strings do not cover it yet.
- Not tested with a screen reader or on a real phone. The progress segments carry hidden "Done / Current / Next" labels for screen readers, untested.
- The paths have not been tried by real first-time users; the user-test kit in `docs/user_tests.md` should include "pick a goal and finish a path".

## The main parts section (second version)
The first version was a plain grouped list and had little impact. It is now one road on a deep-forest stage: the headline "Hear it. Check it. See your street. Do something.", and four large numbered steps (01 to 04). Each step has a verb title, the question a person is asking, one proof number read from the data (the two official figures, 696 figures with a source page, 0 street reports so far, complaint to log to letter), and one lime primary button plus the other pages for that step. Dashed connectors join the steps on wide screens; on tablet it is two columns and on a phone one. Hover lift and the connectors switch off under reduced motion. "0 street reports so far" is deliberate: the Reality step admits it is empty until people use it.
