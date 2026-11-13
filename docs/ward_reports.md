# Your ward: garbage uptime, QR one-tap and green ward badge

Files: `web/app/ward.js`, `web/app/ward.css`, `web/app/vendor/qrcode.js` (QR generator), wired into `web/app/app.js` (route `#/ward`) and `web/app/index.html`. Tests: `tests/test_ward.py`.
Covers items O1 (garbage uptime page), M1 (QR one-tap flow) and M2 (green ward badge) of `docs/team_split_v3.md`.

## What it does
- **`#/ward`:** choose a state, city and ward (free text, we have no ward list) and open that ward's page. Wards with reports on this device are listed.
- **Ward page `#/ward/<State>~<City>~<Ward>`:**
  - **Tap:** "The truck came" or "The truck did not come", for today or any of the last 7 days (the code accepts up to 60 days back). Reports are labelled unverified.
  - **Calendar:** the last 30 days, each day ✓ collected, ✗ not collected or – no report. Empty says "No reports yet". Days with no report are unknown, never counted as missed.
  - **Official figures beside it:** CPCB 2023-24 collected as a share of generated for the state (computed from `data/waste_clean.csv`, with a link to the source pages), the Housing Ministry's 97% door-to-door figure (`data/mohua_statements.csv`) and the dashboard's 86.2% of wards (`data/national_segregation.csv`). These describe a state or the country, so we do not score one ward against them.
  - **Badge:** see rules below.
  - **QR code:** an SVG QR code for the ward page, with a caption and a print button. The address defaults to the current page; it warns if that is a local address, because a printed code pointing at localhost works only on this computer.
  - **Download** the reports as CSV, or **delete** them from this device.

## Shared total (new)
A resident can now sign in with Google and add their taps to a total for the ward that everyone sees. It is off until the server is given a Google client ID and a database, it stores no name or email, and it is described in docs/sign_in.md. The sections below describe the device-only behaviour, which is still what happens for anyone who does not sign in.

## What is real and what is not
- Reports live in this browser (localStorage). **There is no shared server**, so a ward page shows only the taps made on this device. A neighbour who scans the QR code sees their own calendar, not yours. We say this on every ward page.
- No tap is ever created by the code. The tests check that an empty ward shows zero reports and "not enough reports", never a failure.
- Nothing is sent anywhere.

## Duplicate taps
- **On a device (built):** one report per ward per day. A later tap for the same day replaces the earlier one, and the page says so.
- **Across devices (a plan, not built):** each browser gets a random device id (already stored with each report). A shared version would keep one report per device per ward per day and count distinct devices. If devices disagree for a day, show the day as "contested" with both counts, never a single winner. Limit how often one device can write. Collect no names or phone numbers. Show every shared number as "reported by N devices, unverified". Residents can still tap twice from two phones, so counts are a signal for questions, not proof.
- **What would make a report more than unverified:** confirmation by the urban local body or a trusted volunteer for a day. We do not have that, so the app never says "verified".

## Green ward badge (a proposal for the team to confirm)
- A ward is **green** when, over the last 30 days, residents reported on **at least 20 days** and **at least 90%** of the reported days were collected.
- With fewer than 20 reported days the state is **"not enough reports yet"**, with the number of days still needed. It is never shown as a failure.
- Between 20 reported days and 90% the state is "not yet a green ward".
- The 90% mark echoes the ">90%" door-to-door threshold on the Swachh Bharat Mission dashboard. The thresholds are ours and were not tested with residents.
- **Framing:** recognition for a ward, not a government award. There is no league table, no ranking and no comparison between wards, because the reports are unverified and from different numbers of people.

## Limits to say out loud
- A single phone's taps cannot tell the ward's story. The page is a prototype of the loop's "Reality" step.
- Ward names are free text, so two people can spell the same ward differently and get two different pages.
- The QR code generator is a library (see `web/app/vendor/NOTICE.md`). We tested that it produces a valid-sized symbol; scanning a printed code with a phone has not been tested yet.
- The badge thresholds are a proposal. No resident has used them.
