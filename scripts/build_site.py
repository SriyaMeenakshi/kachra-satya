"""Build the static site for deployment into dist/ (any static host: GitHub Pages, Netlify, Cloudflare Pages).

Copies web/ and receipts/ (page images, index.json, NOTICE.md) and adds a root index.html that opens the app.
It does NOT copy data/raw/ (source documents) or the CSVs: the pages read everything from web/trust/data.js.
Never copies .pytest_cache or __pycache__.
Usage (repo root):  python scripts/build_site.py [out_dir]     then upload out_dir, or serve it:  python -m http.server -d dist
"""
import os
import shutil
import stat
import sys
import time

IGNORE = shutil.ignore_patterns(".pytest_cache", "__pycache__", "*.pyc")


def _on_error(func, path, exc_info):
    """rmtree error handler (Windows): clear the read-only flag and retry a few times; skip what still cannot be deleted."""
    for _ in range(5):
        try:
            os.chmod(path, stat.S_IWRITE)
            func(path)
            return
        except FileNotFoundError:
            return
        except OSError:
            time.sleep(0.2)
    print("could not delete, skipping:", path)


def clean(path):
    if os.path.exists(path):
        # Python 3.12 renamed onerror to onexc; the handler's third argument differs but is unused.
        if sys.version_info >= (3, 12):
            shutil.rmtree(path, onexc=_on_error)
        else:
            shutil.rmtree(path, onerror=_on_error)


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "dist"
    clean(out)
    shutil.copytree("web", os.path.join(out, "web"), ignore=IGNORE, dirs_exist_ok=True)
    shutil.copytree("receipts", os.path.join(out, "receipts"), ignore=IGNORE, dirs_exist_ok=True)
    # Root page: redirect to the app. Relative path, so it works at a domain root or in a sub-folder (GitHub Pages).
    # The script keeps a #/route from the URL; the meta refresh and link are the no-JavaScript fallback.
    # No _redirects or netlify.toml is needed: a plain static index.html redirect works on every static host.
    with open(os.path.join(out, "index.html"), "w", encoding="utf8") as f:
        f.write('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>Kachra Satya</title>\n'
                '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
                '<link rel="canonical" href="web/app/index.html">\n'
                '<meta http-equiv="refresh" content="0; url=web/app/index.html">\n'
                '<script>location.replace("web/app/index.html" + location.hash);</script>\n'
                '</head><body><p><a href="web/app/index.html">Open Kachra Satya</a></p></body></html>\n')
    open(os.path.join(out, ".nojekyll"), "w").close()
    print("built", out, "->", sum(len(fs) for _, _, fs in os.walk(out)), "files")


if __name__ == "__main__":
    main()
