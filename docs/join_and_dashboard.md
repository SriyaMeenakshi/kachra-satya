# Join, My details and the team dashboard

Added 2026-11-15. Code: `agent/accounts.py` (server), `web/app/signup.js` (pages), `web/app/signin.js` (header button), `tests/test_signup.py`.

## What it is for
Two things at once: the team can **count its users and write back to them**, and a person gets **one place to sign in and keep their details**. It is optional. Everything else on the site works without it.

## What a person sees
1. The header has one button. Signed out it says **Join**.
2. Join (`#/join`) has a Google button at the top, an "or", and a short form: name, email, role (resident, student or teacher, journalist, ward or city official, researcher, NGO or waste worker, other), state, city or ward, preferred language, how they heard about us (optional) and a required consent box.
3. When it is submitted they see a short thank-you and land on Home. The header button now shows their first name instead of Join.
4. That button opens **My details** (`#/me`): change any detail except the email, sign out, or delete the details.

## How it works
| Part | Behaviour |
|---|---|
| Google on the form | The server checks Google's token and keeps the email Google confirms, so the email cannot be faked. The Google button also signs the person in |
| By hand | Allowed. The entry can be edited later only after the person signs in with the same verified Google email: every Google sign-in looks for a Join entry with that email and links it |
| One entry per email | Joining again with the same email updates the entry, it does not add a person |
| Linking | A separate table (`signup_links`) ties a signed-in anonymous id to the email. Nobody can read or change another person's entry |
| Deleting | **Delete my details** removes the entry and the link. **Delete everything I shared** (ward taps) also removes the Join entry. Neither removes the other's data unless asked |
| Spam | A hidden trap field (filled in: pretend it worked, store nothing) and a limit per connection, `SIGNUPS_PER_HOUR` (default 6, memory of one worker) |
| What the header remembers | The first name, in the browser's local storage (`ks-joined`), so the button can show it. Clearing site data brings Join back |

## What is stored, and what is not
- **Join list (table `signups`):** email, name, role, state, city, language, how they heard, the time. Given with consent, for counting users and for writing to them about this project. **Never shown to anyone, never sold.**
- **Ward store (table `ward_reports`):** an anonymous code, the ward, the day and the answer. **No name or email.** The two lists are never joined, and the ward store is described in [sign_in.md](sign_in.md).
- **Sign-in count (table `people`):** an anonymous code and the day it first signed in.

## The team dashboard (`#/team`)
Not linked from any menu. Open it by address, then type the admin key. It shows: how many people joined with details, how many signed in with Google, breakdowns by role, state and language, the ten latest sign-ups, and a **Download full list (CSV)** button. The key is held in the page's memory only and is sent as the `X-Admin-Key` header; it is never stored in the browser.

| Endpoint | Who | Returns |
|---|---|---|
| `POST /api/signup` | anyone | Saves an entry (`{saved, already, count}`) |
| `GET /api/signup/count` | anyone | `{count}`, the one public number |
| `GET /api/signups` | `X-Admin-Key` | The full list as CSV; `?format=json` gives the dashboard numbers. Cells that start with `=`, `+`, `-` or `@` are prefixed so a spreadsheet never runs them |
| `GET`, `PUT`, `DELETE /api/me/profile` | signed-in person | Own entry only. The email cannot be changed |

## Settings
| Variable | What it does |
|---|---|
| `KS_ADMIN_KEY` | The admin key. Case-sensitive. Empty: `/api/signups` answers "not found" and the dashboard cannot open. Set it only in Render's Environment, never in the repo |
| `SIGNUPS_PER_HOUR` | Sign-ups allowed per connection per hour (default 6) |
| `DATABASE_URL` | PostgreSQL (the live site uses Neon). Without it a free host loses the list on every deploy |

## Limits
- The Join list is personal data. Keep the admin key private, use a long random one, and change it after the hackathon.
- Counts are of entries, not of verified people: someone can join with an email they own twice under two addresses.
- A person who joined by hand and never signs in with Google cannot edit or delete their entry from the site; they would have to ask the team.
- The Join list is a count of interest, not proof the app helped anyone ([impact_evidence.md](impact_evidence.md)).
