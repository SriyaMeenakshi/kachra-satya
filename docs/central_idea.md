# The central idea: a receipt for every waste promise

> Kachra Satya gives every promise about India's waste a receipt, so anyone can see what was promised, what was delivered, and what to do next.

India's waste story is a chain of promises: "81% processed", "97% of wards have door-to-door collection", rupees allocated. Each one is a number nobody can check, and each stops at a PDF. We turn the chain into a loop a person can walk through.

| Step | A person asks | We show | Where it lives in the repo |
|---|---|---|---|
| **Promise** | What did they say? | The official claim in plain words ("out of every 100 kg, 81 kg processed") | Hero duel in `web/mock/`, `data/mohua_statements.csv`, Claim Checker |
| **Proof** | Is it true on paper? | The source page, whether sources agree, what cannot all be true | `receipts/`, `data/flags.csv`, `data/definition_crosswalk.csv`, `data/phantom_tonnes.csv`, `data/volatility.csv` |
| **Reality** | Is it true on my street? | A one-tap "did the truck come" beside the claim; city audits | Garbage uptime page, QR flow, Audit Your City |
| **Action** | What can I do? | A complaint for the Swachhata-MoHUA app, an escalation letter, a bin guide, a briefing for someone with leverage | Saathi pages, Action Briefs |
| **Back to Promise** | Did anything change? | Claims and reality updated side by side | Statements over time, the ward pages |

## Why this centre
- It answers "so what?": a number becomes a receipt, and a receipt becomes an action.
- A stranger understands it in ten seconds.
- Every feature is one stop on the loop; none stands alone. The audit is Proof, Saathi is Action, the uptime tap is Reality, and the money gap (states had used about 16% of their solid-waste allocation by 25 Nov 2024, from Lok Sabha Q682) feeds Promise and Proof.

## What is honest to say
- At launch we have strong Promise, Proof and Action. Reality starts empty and says "no reports yet in your ward".
- Our data is what governments report, not what is on a given street. It adds weight to a complaint; it does not replace one.
- The app drafts complaints and letters; it files and sends nothing. Complaint resolution on the Swachhata app is counted when the civic body closes the ticket, not when residents are satisfied.
- The four-stream segregation rule (wet, dry, sanitary, special care; SWM Rules 2026, in force 1 April 2026) was learned from news and law-firm summaries and must be checked against the official notification before we publish it as fact.

## A three-minute demo along the loop
Use a clearly labelled illustrative resident, never a real person:
1. Promise: she reads "81% processed" and "97% of wards covered".
2. Proof: she opens the receipt; the Housing Ministry says 81%, the pollution board's reports give about 62%; the sources disagree.
3. Reality: her street was not collected for four days; she logs it.
4. Action: the app drafts her complaint, shows where sanitary waste goes, and drafts an escalation letter that cites the source line.
5. Loop: the page shows the claim, the proof and her ward's reported days side by side.
