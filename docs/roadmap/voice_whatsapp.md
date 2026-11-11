# Roadmap spec M5: WhatsApp and voice in Hindi, Tamil and Telugu

Status: ROADMAP (spec only, not built). Owner: Likitha. Written 2026-11-11. **It depends on the Q&A agent being live first, and it is not.**

## Who and why
Many people who would benefit from checking a waste claim or writing a complaint do not use a browser tab for it. They use WhatsApp, voice notes, or a phone call, in their own language. A resident could send "my garbage is not collected in Ward 12" or "is it true 81% is processed?" and get a plain answer with the source, in Hindi, Tamil or Telugu.

## What exists today
- **The Ask page** (`#/ask`) has an English, Hindi, Tamil and Telugu language choice, suggestion chips, and browser speech input and output (browser speech recognition and synthesis; support for Indian languages depends on the browser and device, and the page says so). The agent endpoint in `web/app/config.js` is **empty**, so the page shows "not connected yet".
- **The agent** is specified in `docs/agentfoundry_setup.md` (system prompt, six lookup tools, six acceptance questions) and has **not** been created or run. See `docs/agentfoundry_run_sheet.md`.
- **The interface** has English, Hindi and Telugu text for the main pages (first draft, not reviewed by a native speaker). The four-stream bin guide has Hindi, Tamil and Telugu names that still need a native-speaker check.

## What we would build, in order
1. **Finish the web agent first.** Create the agent, run its six questions, set the endpoint. Nothing below is worth building until answers are correct in the browser.
2. **WhatsApp text.** An official WhatsApp Business account through a provider, one number, and a small server that forwards each message to the same agent and returns its reply. It needs a business account, a verified number, provider terms and message templates for first contact. We have none of these, and **we have not checked current pricing or approval rules**: check the provider's own pages before promising anything.
3. **WhatsApp voice notes.** Speech to text before the agent and, optionally, text to speech after it. Quality for Tamil and Telugu is unknown and must be tested with native speakers on real voice notes before any claim.
4. **A phone call (interactive voice).** Only if there is demand: it needs a telephony provider and has the same speech-quality question.

## What data and people we would need
- A working agent endpoint and a place to run a small server, which today means an account and a budget we do not have.
- Native speakers of Hindi, Tamil and Telugu to test questions and replies, including how place names and figures are read aloud.
- A privacy plan: a WhatsApp message carries a phone number. Decide what we keep (ideally nothing), say so up front, and never store or share numbers or message text without consent.

## What we would not claim
- That any of this works in a language until native speakers have tested it.
- That the assistant is correct on anything the data does not contain. It must say "not in the data", as the agent prompt already requires.
- That voice or WhatsApp reaches any number of people. We would report only real usage numbers, with the date.
- Any pricing, limits or approval timeline for WhatsApp or telephony that we have not read on the provider's own page.

## Before building
1. Get the web agent live and pass its six acceptance questions, in three languages, with native speakers reading the answers.
2. Choose a provider and read its current terms, pricing and approval process; write the one-page cost and privacy plan.
3. Prototype with five real people in one language and record what confused them, honestly, before adding a second language.
