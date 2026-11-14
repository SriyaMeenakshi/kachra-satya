"""Build web/app/i18n_dict.js from the plain-text translation files in web/app/i18n/*.txt.

Each entry in a .txt file is three lines, then a blank line:
    = the English text exactly as the page shows it (numbers written as #)
    the Hindi text
    the Telugu text
A line starting with ";" between entries is a comment. "#" in a translation takes the next number from the English; "#2" takes the second.
Run: python scripts/build_i18n.py
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "web", "app", "i18n")
OUT = os.environ.get("KS_I18N_OUT", os.path.join(ROOT, "web", "app", "i18n_dict.js"))


def norm_key(s):
    s = re.sub(r"[\s ]+", " ", s).strip()
    return re.sub(r"\d+(?:,\d+)*(?:\.\d+)?", "#", s)


def load():
    entries, problems = {}, []
    for path in sorted(glob.glob(os.path.join(SRC, "*.txt"))):
        name = os.path.basename(path)
        lines = [l.rstrip("\n") for l in open(path, encoding="utf-8")]
        block = []
        for ln, line in enumerate(lines + [""], 1):
            if line.startswith(";") and not block:      # a comment, unless it is the Hindi or Telugu line of an entry
                continue
            if line.strip():
                block.append(line)
                continue
            if not block:
                continue
            if len(block) != 3 or not block[0].startswith("= "):
                problems.append("%s line %d: an entry needs '= English', Hindi, Telugu (got %d lines)" % (name, ln, len(block)))
            else:
                key, hi, te = norm_key(block[0][2:]), block[1].strip(), block[2].strip()
                want = key.count("#")
                for lang, t in (("hi", hi), ("te", te)):
                    if "#" in re.sub(r"#\d", "", t) and re.search(r"#\d", t):
                        problems.append("%s line %d: %s mixes # and #n; use one style: %s" % (name, ln, lang, block[0][:60]))
                    if any(int(n) > want for n in re.findall(r"#(\d)", t)):
                        problems.append("%s line %d: %s uses a number position the English does not have: %s" % (name, ln, lang, block[0][:60]))
                    if "##" not in key and len(re.findall(r"#\d?", t)) != want:      # "##" is a literal # before a number ("#12 of 36")
                        problems.append("%s line %d: %s has a different number of # than the English: %s" % (name, ln, lang, block[0][:60]))
                    if set(re.findall(r"</?[a-z]+>", t)) - {"<b>", "</b>", "<i>", "</i>"}:
                        problems.append("%s line %d: %s has a tag other than <b> or <i>" % (name, ln, lang))
                entries[key] = [hi, te]
            block = []
    return entries, problems


def main():
    entries, problems = load()
    if problems:
        print("\n".join(problems)); sys.exit(1)
    body = json.dumps(entries, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    with open(OUT, "w", encoding="utf-8", newline="") as f:
        f.write("/* Built by scripts/build_i18n.py from web/app/i18n/*.txt. Do not edit by hand. English text -> [Hindi, Telugu]. */\n")
        f.write("if (window.KSDom) window.KSDom.add(" + body + ");\n")
    try:
        shown = os.path.relpath(OUT, ROOT)
    except ValueError:                      # Windows: the output folder is on another drive than the repo (for example a temp folder on C:)
        shown = OUT
    print("wrote %s: %d entries" % (shown, len(entries)))


if __name__ == "__main__":
    main()
