# User tests: 20 to 30 people, reported honestly

**Status: 0 sessions done.** Nothing in this file is a result. The count comes from `data/user_tests.csv`; run `python scripts/user_tests_summary.py` to see it. If we reach fewer than 20 sessions, we say the real number.

What this is: a short usability check of the deployed app with people who did not build it. It is **not** a field pilot and does not show impact. We say that plainly in the README and the video.

## Who
Aim for 20 to 30 people, mixed: residents of different ages, students, and a few people who work near waste or civic issues (a ward volunteer, a journalist, a councillor's office, if reachable). Record only a group label, never a name, phone number or address.

## How (about 10 minutes each, in person or on a call)
1. Say: "We are testing the site, not you. If something confuses you, that is our fault. You can stop any time." Get a yes before you start. Do not record audio or video unless the person agrees; we keep only the notes below.
2. Give the five tasks one at a time. Do not explain the page. Wait, then note whether they finished alone, needed a hint, or got stuck.
3. Write down what confused them, in their own words.
4. Ask the closing question: "Would you use this again?"

## The five tasks (along the loop)
| # | Task | What "done alone" means |
|---|---|---|
| 1 | "What two numbers does India have for how much waste is processed, and can we say which is right?" (Start or Map page) | Names both figures and says the sources disagree and we cannot say which is right |
| 2 | "Someone says 81% of India's waste is processed. Find out whether that holds up, and open the page it comes from." (Check a claim) | Gets a verdict and opens a source page |
| 3 | "Find your state. How different are the two figures there?" (Map) | Opens their state and reads the gap |
| 4 | "Your street's garbage was not collected for three days. Write a complaint." (Get help) | Reaches the complaint text and knows it is a draft they must file themselves |
| 5 | "Say the truck came today, then tell me what the badge on that page means." (Your ward) | Records a day and explains that the badge needs enough reports and is not an award |

## What to record (`data/user_tests_template.csv`)
One row per person: `session_id` (S01, S02, ...), `date`, `group` (resident, student, civic worker, other), `device` (phone, laptop), `language` (the language the person used), `task1` to `task5` (`alone`, `hint` or `stuck`), `confusion_notes` (their words, no names), `would_use_again` (`yes`, `maybe`, `no`), `logged_by`.
Copy the template to `data/user_tests.csv` and add rows. Leave a cell blank if a task was not attempted.

## What we report
- The number of sessions against the 20 to 30 target, as a plain count.
- For each task: how many did it alone, with a hint, or got stuck.
- The confusion notes, grouped by the screen they were about, with the changes we made.
- The closing answers as counts. No averages, and no quotes that could identify anyone.
- That the group is a convenience sample and the results do not describe all of India.

## Rules
- Never write a test result we did not observe. A blank is a blank.
- If a person is a minor, test only with a parent's or teacher's permission and keep no personal details.
- Change the app only after a pattern appears in two or more sessions, and note the change next to the notes.
