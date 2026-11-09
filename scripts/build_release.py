"""Build the public data release (Zenodo-ready zip) without any raw documents or page images.

Contents: the CSV files in data/ (not data/raw/), docs/methodology.md, docs/licences.md, docs/data_dictionary.md, SOURCES.md,
CITATION.cff, LICENSE (the code licence, for reference), plus CHECKSUMS.sha256 for every file.
Excluded on purpose: data/raw/ (copies of government documents), receipts/pages/ (page images), briefs/, web/. See docs/licences.md.
Output: dist/kachra-satya-data-<version>.zip and dist/CHECKSUMS.sha256 (dist/ is git-ignored).
Run from repo root: python scripts/build_release.py
"""
import glob
import hashlib
import os
import zipfile

VERSION = "2026-11-10"
FILES = sorted(glob.glob("data/*.csv")) + ["docs/methodology.md", "docs/licences.md", "docs/data_dictionary.md",
                                           "SOURCES.md", "CITATION.cff", "LICENSE"]
os.makedirs("dist", exist_ok=True)
name = f"dist/kachra-satya-data-{VERSION}.zip"
sums = []
with zipfile.ZipFile(name, "w", zipfile.ZIP_DEFLATED) as z:
    for f in FILES:
        assert not f.startswith("data/raw") and "receipts" not in f, f
        z.write(f, arcname=f"kachra-satya-data-{VERSION}/{f}")
        sums.append(f"{hashlib.sha256(open(f, 'rb').read()).hexdigest()}  {f}")
    z.writestr(f"kachra-satya-data-{VERSION}/CHECKSUMS.sha256", "\n".join(sums) + "\n")
open("dist/CHECKSUMS.sha256", "w").write("\n".join(sums) + "\n")
print(name, f"{os.path.getsize(name) / 1024:.0f} KB,", len(FILES), "files")
