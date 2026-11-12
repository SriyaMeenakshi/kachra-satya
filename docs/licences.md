# Reuse terms for our sources (checked 2026-11-10)

This is a working note, not legal advice. The findings come from web searches; most are secondary copies of policy text and are marked. Check the official page before relying on any line.

## What each source says
| Source | Publisher | Terms found | Confidence | What it means for us |
|---|---|---|---|---|
| Lok Sabha answers (Q50, Q682, Q3198) | Lok Sabha Secretariat | The copyright policy says copyright for reproducing debates and ancillary publications vests with the Lok Sabha Secretariat; copyright questions go to its Editorial Branch (https://elibrary.sansad.in/copyright-policy). | Found in a search result snippet of the official page | Reproducing whole pages (our `receipts/` images, the raw files) needs permission to be safe. Quoting figures with the source named is the lower-risk use. |
| Rajya Sabha answers (Q358, Q855, Q2433) | Rajya Sabha Secretariat | A terms page exists (https://sansad.in/rs/termsAndConditions) but the search did not return its reproduction rules. | Not confirmed | Ask, or read the full page, before republishing pages. |
| CPCB annual reports (2021-22, 2022-23, 2024-25) | Central Pollution Control Board | Not found. | Not confirmed | CPCB's site must not be scripted; read its copyright policy by hand and ask if unclear. |
| MoHUA Annual Report 2025-26 | Ministry of Housing and Urban Affairs | Not found. mohua.gov.in/robots.txt allows crawling, which is not a licence. | Not confirmed | Same as CPCB. |
| data.gov.in copy of Q358 (cross-check only) | NIC / data.gov.in | Datasets there normally carry the Government Open Data License - India (GODL-India), described by secondary sources as allowing use, adaptation and publication, including commercial use, with attribution, no implied endorsement and no liability. The licence page itself was not reached. | Secondary source | We did not copy values from it; it was used only to cross-check the PDF (104 of 105 cells matched). |
| SBM-U dashboard (GFC 2022) | MoHUA / SBM-U | Not found. | Not confirmed | We stored only 6 national counts from the page text, with the URL and date. |
| Dataful (datasets 19386, 19387) | Dataful | Not checked. | n/a | We did not use any Dataful file. Keep it that way unless its terms are recorded in `SOURCES.md` first. |

## The general government template
The Guidelines for Indian Government Websites describe a "liberal" copyright policy under which material may be reproduced free of charge in any format without specific permission, provided it is reproduced accurately, not in a misleading context, and the source is acknowledged; departments may instead choose a stricter wording that requires permission. Each department chooses its own wording, so the template does not settle any single source. Source: https://guidelines.india.gov.in/?p=10447 (secondary copies found via search). A 2016 critique argues that Indian government works are not freely licensed for remixing or commercial use (https://cis-india.org/a2k/blogs/free-knowledge-and-indian-government-work).

## Decision (2026-11-10)
For the public repo we **keep** the raw documents and the receipt page images, with attribution: `data/raw/NOTICE.md` and `receipts/NOTICE.md` state that they are unchanged copies with the source named, that rights stay with each publisher, that we are not affiliated or endorsed, and that we will remove any document on its publisher's request. The web page footer says the same. The permission risk described below for Lok Sabha pages, and for the unconfirmed sources, remains. The Zenodo release still excludes `data/raw/` and `receipts/pages/`.

## Decision (2026-11-12): licence
Our code **and our compiled data** are released under the MIT licence (`LICENSE`, `CITATION.cff`, `.zenodo.json` agree). The licence covers our extraction, checks, flags and derived tables. It does not cover `data/raw/` or `receipts/pages/`, and it does not change anyone's rights in the underlying figures, which come from the cited government documents under their own terms. Item 1 below (a CC BY 4.0 data licence) is therefore replaced by MIT; the rest of this page still applies.

## Decision (2026-11-12): source documents
Team decision: the source documents are public government records (Lok Sabha and Rajya Sabha answers, CPCB reports, MoHUA documents), and this is an Indian national hackathon, so we keep `data/raw/` and `receipts/pages/` in the public repo and use them with full attribution. No permission emails are being sent. We keep the protections that cost nothing: the attribution notices (`data/raw/NOTICE.md`, `receipts/NOTICE.md`), the no-endorsement line, the promise to remove any document on its publisher's request, and the Zenodo release that excludes `data/raw/` and `receipts/pages/`. This is a team decision, not legal advice; the publishers' own terms still apply to their documents.

## What we recommend
1. **Publish our own work under an open licence, and say the figures are not ours.** Our additions are the compilation, the checks and flags, the derived indicators, the crosswalk and the code. The code is already MIT (`LICENSE`). A data licence such as CC BY 4.0 for our compilation, with a clear line that the underlying figures come from the cited government documents under their own terms, is a team decision; no data licence file has been added yet.
2. **Publish figures with citations, not the documents.** A Zenodo release should hold the CSVs (each row already has document, page and retrieval date) and exclude `data/raw/` and `receipts/pages/`.
3. **Decide about the public repo.** The repo currently contains the raw PDFs and Word copies and page images. The hackathon asks for a public repo. Options: keep them with source attribution (accurate reproduction, source named) and accept the risk; ask the Lok Sabha Secretariat, Rajya Sabha Secretariat, CPCB and MoHUA for permission; or replace the files with URLs and checksums and keep only the extracted figures. The lowest-risk option is the last.
4. **Never imply endorsement.** The app and README should say the figures are reproduced from published documents, we are not affiliated with the ministries or CPCB, and we do not claim any source is wrong.
5. **Facts versus layout.** Individual figures are facts; our extraction keeps them as printed. We have not taken legal advice on database or compilation rights, so a lawyer or the organisers should confirm before a formal release.

## Draft permission request (not sent)
> Subject: Permission to reproduce solid waste data tables with source citation
>
> We are a student team building an open-source tool that checks India's municipal solid waste figures against each other. We would like to reproduce page images and tables from [document, date] with full citation and a link to the original, and publish our extracted figures with the document and page for each. We do not claim affiliation with or endorsement by [organisation]. Please let us know whether this is permitted or what conditions apply.
