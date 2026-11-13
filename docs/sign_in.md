# Sign-in with Google and the shared ward total

Files: `agent/accounts.py` (server), `web/app/account.js` and the "Your ward's shared total" section of `web/app/ward.js` (page). Tests: `tests/test_accounts.py`.

## What it is for
On Your ward a resident taps whether the garbage truck came. Until now those taps stayed on one phone, so a ward page could never show more than one person's record. With sign-in, a resident can add their taps to a total for the ward that everyone who opens the ward page (or scans its QR code) sees: how many people reported in the last 30 days, how many reports said the truck came, and how many said it did not.

## What is stored
- **Stored:** an anonymous code (a one-way hash of the Google account id, salted with `KS_SECRET`), the ward, the day, and `collected` or `not_collected`.
- **Never stored:** name, email address, picture, location, device, or the Google account id itself. A test opens the database file and checks none of these are in it.
- **On the phone only:** the session token and the first name Google shows, used for the "Sharing is on for ..." line.
- One report per person per ward per day. A later tap for the same day replaces the earlier one.
- "Delete everything I shared" removes all of a person's rows. Signing out keeps the taps on the device.

## What the page promises
- Nothing is sent, and Google's script is not loaded, until a person presses "Turn on sharing". The page says what is stored before that.
- Totals are counts of reports from signed-in residents. They are labelled unverified and are never called a measurement of the service.
- If people disagree about a day, both counts are shown. The page does not pick one.
- If sign-in is not configured, or the site is a static copy with no server, the section says so and everything else works as before.

## Switching it on
It is off unless both `GOOGLE_CLIENT_ID` and `KS_SECRET` are set on the server.

1. **Google client ID.** In the Google Cloud console create an OAuth client of type "Web application". Under "Authorised JavaScript origins" add the site's address (for the live site, `https://kachra-satya.onrender.com`; for local testing, `http://localhost:8777`). No redirect address and no client secret are needed. Set the client ID as `GOOGLE_CLIENT_ID`.
2. **`KS_SECRET`.** Any long random string. `render.yaml` asks Render to generate one. Changing it signs everyone out and breaks the link between a person and their earlier reports.
3. **Database.** Set `DATABASE_URL` to a PostgreSQL connection string. A free Render web service loses its own disk on every deploy, so the default SQLite file (`agent/ward_reports.sqlite`, or `KS_DB_PATH`) is only for local use.

## Endpoints
| Method and path | Who | What |
|---|---|---|
| `GET /api/config` | anyone | `{signIn, clientId}` |
| `POST /api/signin` `{credential}` | anyone | checks the Google ID token, returns a session token (30 days) |
| `POST /api/ward/report` `{ward, date, status}` | signed in | saves or replaces that person's report for that day |
| `GET /api/ward/summary?ward=` | anyone | counts per day and the number of people, last 30 days; no ids |
| `DELETE /api/me` | signed in | deletes everything that person shared |

Writes are limited to 30 a minute per person (`WARD_WRITES_PER_MIN`).

## Limits to say out loud
- Not run against a real Google client or a real PostgreSQL database yet: the tests use a stand-in for Google's check and a SQLite file.
- One Google account is one person as far as the count goes. Someone with two accounts counts twice.
- Ward names are free text, so two spellings of one ward are two wards.
- A total is a signal for a question to the municipality, not proof.
