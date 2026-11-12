"""Write data/dumpsites_national.csv: MoHUA's national statements on legacy dumpsites, each typed from its source and kept with the page.

Three documents, all public MoHUA / Lok Sabha texts already in data/raw/:
  - ls_au682_2024-11-28.docx            Lok Sabha Q682, 28 Nov 2024, reply to part (b)   (Word copy, no page number)
  - mohua_drap_concept_note_2025-11.pdf Concept note on the Dumpsite Remediation Accelerator Programme, page 1
  - mohua_drap_launch_faq_2025-11.pdf   DRAP launch FAQ for the Urban Conclave, 8-9 Nov 2025, page 1
Nothing is computed. Where two statements use different words or denominators we keep both and say so in the note; we do not reconcile them.
Run from the repo root:  python scripts/build_dumpsite_national.py
"""
import csv

OUT = "data/dumpsites_national.csv"
Q = ("2024-11-28", "Lok Sabha", "ls_au682_2024-11-28.docx", "Reply to part (b), Word copy, no page number")
C = ("2025-11", "MoHUA", "mohua_drap_concept_note_2025-11.pdf", "1")
F = ("2025-11-08", "MoHUA", "mohua_drap_launch_faq_2025-11.pdf", "1")
ROWS = [
    (Q, "dumpsites_identified", 2417, "count", "Dumpsites with more than 1000 tonnes of waste, in major urban centres including Delhi and Mumbai"),
    (Q, "legacy_waste_identified", 24.88, "crore tonnes", "Printed as 24.88 Cr. MT"),
    (Q, "area_identified", 14732.66, "acres", "Printed as 14,732.66 Ac."),
    (Q, "dumpsites_remediated_completely", 641, "count", ""),
    (Q, "dumpsites_in_progress", 1144, "count", "Printed as sites under progress"),
    (Q, "legacy_waste_remediated", 12.66, "crore tonnes", "Cumulative; printed as 12.66 Cr. MT (51%)"),
    (Q, "land_reclaimed", 5694.86, "acres", "Printed as 5694.86 Ac. (39%)"),
    (C, "dumpsites_identified", 2476, "count", "Printed as 'out of 2476 dumpsites'; the FAQ says they were identified at the launch of SBM-U 2.0 in 2021"),
    (C, "legacy_waste_identified", 25, "crore tonnes", "Printed as 'nearly 25 Cr MT'"),
    (C, "dumpsites_remediated_completely", 1048, "count", "Printed as 'fully remediated'"),
    (C, "legacy_waste_remediated", 14.33, "crore tonnes", "Printed as processed: '14.33 crore metric tons of legacy waste have been processed'"),
    (C, "land_reclaimed", 7580, "acres", "Printed as 'nearly 7,580 acres (50%) of land'"),
    (C, "dumpsites_in_progress", 1428, "count", "Printed as 'sites are undergoing remediation'"),
    (C, "priority_dumpsites", 214, "count", "Hold about 80% of the legacy waste, across 202 ULBs; the annexure on pages 6 to 9 lists them"),
    (C, "priority_legacy_waste", 8.8, "crore tonnes", "Printed as 'approximately 8.8 crore MT' for the priority sites; the annexure's Grand Total (page 9) is 13,02,73,139 tonnes of legacy waste, a different figure we do not reconcile"),
    (C, "target_date", "2026-09", "month", "Lakshya Zero Dumpsites by September 2026, as printed in the concept note"),
    (F, "dumpsites_identified", 2476, "count", "Printed as '2,476 dumpsites containing vast quantities of legacy waste were identified across urban India'"),
    (F, "dumpsites_remediated_completely", 1048, "count", "Printed as 'fully remediated' over the past four years"),
    (F, "legacy_waste_remediated", 14.33, "crore tonnes", "Printed as processed: 14.33 crore metric tonnes"),
    (F, "land_reclaimed", 7580, "acres", "Printed as 'nearly 7,580 acres of land'; the FAQ attaches '50%' to the identified sites, the concept note attaches it to the land. We keep both wordings"),
]


def main():
    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["statement_date", "source_name", "metric", "value", "unit", "source_doc", "source_page", "retrieved_on", "note"])
        for (date, src, doc, page), metric, value, unit, note in ROWS:
            w.writerow([date, src, metric, value, unit, doc, page, "2026-11-12", note])
    print("wrote", OUT, len(ROWS), "rows")


if __name__ == "__main__":
    main()
