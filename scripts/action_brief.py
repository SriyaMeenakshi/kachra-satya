"""Action Brief generator.

For a chosen state it writes a one-page markdown brief: the gap between the two official sources,
the likely causes (only those the data supports, each marked as a hypothesis) and a draft
SBM-U 2.0 ask. It uses only data/waste_clean.csv and data/flags.csv. Missing data stays
"not reported"; no money amounts are invented (the repo has no state funds table).

Usage (repo root):
    python scripts/action_brief.py "Maharashtra"
    python scripts/action_brief.py --all        # one file per state in briefs/
"""
import os
import sys
import pandas as pd

CPCB_YEAR, MOHUA_YEAR = "2023-24", "2025-26"
NR = "not reported"


def val(w, state, year, source, metric):
    r = w[(w.state == state) & (w.year == year) & (w.source_name == source) & (w.metric == metric)]
    if r.empty or pd.isna(r.value_tpd.iloc[0]):
        return None
    return float(r.value_tpd.iloc[0])


def src(w, state, year, source, metric):
    r = w[(w.state == state) & (w.year == year) & (w.source_name == source) & (w.metric == metric)]
    if r.empty:
        return NR
    r = r.iloc[0]
    return f"{r.source_doc}, p.{r.source_page}"


def fmt(v, unit="tpd"):
    return NR if v is None else f"{v:,.0f} {unit}"


def pct(a, b):
    return None if a is None or b in (None, 0) else a / b * 100


def causes(c, m, state_flags):
    """Each cause is stated only when the data shows it, and is labelled a hypothesis."""
    out = []
    cg, cc, ct = c["generated"], c["collected"], c["treated"]
    mg, mt = m["generated"], m["treated"]
    if cg and mg and abs(mg - cg) / cg > 0.10:
        out.append(f"**Different denominators.** Generated waste is {fmt(cg)} in CPCB {CPCB_YEAR} and {fmt(mg)} "
                   f"in MoHUA {MOHUA_YEAR} ({(mg - cg) / cg * 100:+.0f}%). A percentage built on a different base "
                   "will differ even if treatment were identical. Hypothesis: the state revised its generation estimate.")
    if ct is not None and mt is not None and ct and mt / ct > 1.10:
        out.append(f"**Treatment reported much higher in the newer source.** Treated/processed rose from "
                   f"{fmt(ct)} to {fmt(mt)}. Hypothesis: real capacity added between years, or a looser definition "
                   "(MoHUA 'processed' is stored as treated here and may not mean the same as CPCB 'treated').")
    if cg and cc is not None and cc < 0.85 * cg:
        out.append(f"**A collection gap.** Only {pct(cc, cg):.0f}% of generated waste is reported collected "
                   f"({fmt(cc)} of {fmt(cg)}), so waste cannot reach treatment. Hypothesis: door-to-door coverage gaps.")
    if cc is not None and ct is not None and ct > cc:
        out.append(f"**Treated exceeds collected.** CPCB reports {fmt(ct)} treated but only {fmt(cc)} collected, "
                   "which is not possible; one of the two figures is likely wrong.")
    if any(f.rule.startswith("4_") for f in state_flags.itertuples()):
        out.append("**Missing reporting in earlier years.** At least one metric is blank in some years (see flags below).")
    if not out:
        out.append("No cause can be read from the data alone. Ask the state/SPCB for its reconciliation of the two figures.")
    return out


def brief(w, flags, state):
    c = {k: val(w, state, CPCB_YEAR, "CPCB", k) for k in ("generated", "collected", "treated")}
    m = {k: val(w, state, MOHUA_YEAR, "MoHUA", k) for k in ("generated", "treated")}
    pc, pm = pct(c["treated"], c["generated"]), pct(m["treated"], m["generated"])
    sf = flags[flags.state == state]

    L = [f"# Action Brief: {state}", "",
         "_Data only from the Kachra Satya dataset. The CPCB and MoHUA figures are for different years; "
         "no same-year pair exists yet. Anything not in the data is marked 'not reported'._", "",
         "## 1. The gap", "",
         "| | CPCB " + CPCB_YEAR + " | MoHUA " + MOHUA_YEAR + " |", "|---|---|---|",
         f"| Generated | {fmt(c['generated'])} | {fmt(m['generated'])} |",
         f"| Collected | {fmt(c['collected'])} | not reported by MoHUA |",
         f"| Treated / processed | {fmt(c['treated'])} | {fmt(m['treated'])} |",
         f"| % of generated treated | {NR if pc is None else f'{pc:.1f}%'} | {NR if pm is None else f'{pm:.1f}%'} |",
         f"| Source | {src(w, state, CPCB_YEAR, 'CPCB', 'treated')} | {src(w, state, MOHUA_YEAR, 'MoHUA', 'treated')} |", ""]
    if pc is not None and pm is not None:
        L += [f"**Gap: {pm - pc:+.1f} percentage points** (MoHUA minus CPCB).", ""]
    else:
        L += ["**Gap: cannot be computed, one source does not report this state.**", ""]

    L += ["## 2. Likely causes (hypotheses from the data)", ""]
    L += [f"- {x}" for x in causes(c, m, sf)] + [""]

    L += ["## 3. Flags raised for this state", ""]
    if sf.empty:
        L += ["None."]
    else:
        L += [f"- `{r.rule}` ({r.year}): {r['values']}. {r.explanation}" for _, r in sf.iterrows()]
    L += [""]

    L += ["## 4. Draft SBM-U 2.0 ask", ""]
    if c["generated"] and c["treated"] is not None:
        short = c["generated"] - c["treated"]
        L += [f"On the CPCB figures for {CPCB_YEAR}, about **{short:,.0f} tpd** of {c['generated']:,.0f} tpd generated "
              "is not reported as treated. We request:", ""]
    else:
        L += ["The CPCB figures for this state are incomplete. We request:", ""]
    L += ["1. A joint CPCB-MoHUA-state reconciliation of generated and treated tonnage for the same financial year, "
          "so the two published figures can be explained.",
          "2. Central assistance under SBM-U 2.0 (solid waste component) for processing capacity, sized to the "
          "reconciled untreated quantity.",
          "3. Support for weighbridge-based data reporting by urban local bodies so future returns pass basic checks.",
          "",
          "_Amount: not stated. The dataset has no state-wise allocation or utilisation figures for this state; "
          "add them from the Lok Sabha Q682 annexure before submitting._", ""]
    return "\n".join(L)


def main():
    w = pd.read_csv("data/waste_clean.csv")
    flags = pd.read_csv("data/flags.csv")
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    if sys.argv[1] == "--all":
        os.makedirs("briefs", exist_ok=True)
        for s in sorted(w.state.unique()):
            open(f"briefs/{s.replace(' ', '_')}.md", "w", encoding="utf-8").write(brief(w, flags, s))
        print("wrote", w.state.nunique(), "briefs")
        return
    state = " ".join(sys.argv[1:])
    if state not in set(w.state):
        sys.exit(f"Unknown state '{state}'. Use the names in data/waste_clean.csv.")
    print(brief(w, flags, state))


if __name__ == "__main__":
    main()
