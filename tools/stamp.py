# -*- coding: utf-8 -*-
"""
Stamp every local CSS/JS reference with a content hash.

The problem this solves is real and was hiding a fix for a while: a phone that
has visited the site before will happily keep serving the stylesheet and script
it already has. GitHub Pages sends a ten minute max-age, but Safari's memory and
back/forward caches hold assets far longer than that, so a change that is live
on the server can stay invisible on the one device you are trying to fix.

Appending ?v=<hash of the file> makes the URL change whenever the file does, so
a stale copy can never be reused - and, because the hash is per file, nothing
that did not change gets re-downloaded. manual.js alone is 1.8 MB, so a single
site-wide version string would be the wrong trade.

    python tools/stamp.py

Idempotent: run it after every asset change, before committing. An existing
?v= is replaced, not stacked.
"""
import glob
import hashlib
import io
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "docs")

# src="..." or href="..." pointing at a local .js/.css, with an optional stamp
REF = re.compile(
    r'((?:src|href)=")([^"?#:]+\.(?:js|css))(\?v=[0-9a-f]+)?(")'
)

_cache = {}


def digest(path):
    if path not in _cache:
        with io.open(path, "rb") as fh:
            _cache[path] = hashlib.md5(fh.read()).hexdigest()[:8]
    return _cache[path]


def stamp(html_path):
    base = os.path.dirname(html_path)
    changed = [0]

    def sub(m):
        pre, url, old, post = m.groups()
        target = os.path.normpath(os.path.join(base, url.replace("/", os.sep)))
        if not os.path.isfile(target):
            print("  missing, left alone: %s" % url)
            return m.group(0)
        new = "?v=" + digest(target)
        if new != old:
            changed[0] += 1
        return pre + url + new + post

    s = io.open(html_path, encoding="utf-8").read()
    out = REF.sub(sub, s)
    if out != s:
        io.open(html_path, "w", encoding="utf-8").write(out)
    return changed[0]


def main():
    pages = sorted(glob.glob(os.path.join(SITE, "*.html")))
    pages += sorted(glob.glob(os.path.join(SITE, "api", "*.html")))

    total = 0
    for path in pages:
        n = stamp(path)
        total += n
        print("%-22s %s" % (os.path.basename(path),
                            "%d updated" % n if n else "up to date"))

    print("\n%d reference(s) restamped across %d pages" % (total, len(pages)))
    if total:
        print("commit these - a phone will otherwise keep the files it has")


if __name__ == "__main__":
    main()
