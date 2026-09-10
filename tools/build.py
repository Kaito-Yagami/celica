# -*- coding: utf-8 -*-
"""
Celica T230 site - one-shot asset builder.

Reads the scanned Toyota service manual PDF (RM744U1/U2) and emits:

    site/assets/fig/p####.png   1-bit line-art figures for curated pages
    site/data/manual.js         section tree + per-page metadata + page text

Run:  python tools/build.py            every page, ~5 min
      python tools/build.py --curated  only the shortlist in CURATED
      python tools/build.py --no-fig   metadata only, seconds
      python tools/build.py --limit 20 smoke test

Notes on the source, learned the hard way:

* The PDF is not uniform. 427 of the curated pages are 1-bit Flate scans with
  no text layer; 114 (including the whole SS specifications section) are an
  8-bit JPEG of the table rules only, with the *text drawn as real PDF text*
  on top. Pulling the largest image XObject therefore silently loses all the
  text on those pages - the page has to be properly rasterised instead.

* That text layer has a broken ToUnicode map. Glyphs paint correctly but the
  extracted codepoints are mangled ("thickness" -> "thk:kfless", "SS" -> "S5").
  Layout is trustworthy, characters are not. So the text here is only ever used
  for search and is always labelled as such in the UI; every published spec
  figure is read off the rendered page by hand.
"""
import io
import json
import os
import re
import sys
import time

import fitz
import numpy as np
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "site")
FIGDIR = os.path.join(SITE, "assets", "fig")
DATADIR = os.path.join(SITE, "data")

PDF = r"C:\Users\kadeb\Downloads\2000-2006 Celica Service Manual.pdf"

LONG_EDGE = 1800      # px, long edge of the rendered page before trimming
THRESHOLD = 150       # bilevel cut after autocontrast
PAD_FRAC = 0.032      # padding added back around the content box; must exceed the 0.025 inset

# The shortlist: the sections that actually touch this car. Everything is
# rendered by default now - all 1,972 pages - so this only matters when
# rebuilding with --curated for a quick, small output.
CURATED = [
    (4, 22),        # IN  introduction, identification, lift + support points
    (47, 56),       # MA  maintenance schedule
    (57, 148),      # PP  preparation - fluid capacities and grades, SSTs per job
    (149, 208),     # SS  service specifications - the whole spec goldmine
    (813, 824),     # ID  index vol 1, vol 2 foreword
    (825, 840),     # EM  compression, valve clearance, ignition timing, idle
    (1032, 1044),   # CO  coolant, water pump, thermostat
    (1066, 1071),   # LU  oil and filter
    (1086, 1097),   # IG  ignition system, coils, sensors
    (1104, 1107),   # ST  starting system
    (1124, 1130),   # CH  charging - alternator output for the load budget
    (1278, 1281),   # MX  shift lever and control cable (C60) - LED shift knob
    (1362, 1441),   # SA  complete - wheels, alignment, hubs, driveshafts, arms, dampers
    (1442, 1451),   # BR  brake fluid, pedal, parking lever
    (1460, 1490),   # BR  pads, calipers, discs, drums, parking brake
    (1506, 1528),   # SR  steering system, belt, fluid, wheel, column
    (1562, 1639),   # RS  complete - side airbags live in the seats, so all of it
    (1640, 1769),   # BE  body electrical, complete
    (1770, 1889),   # BO  body, complete - every trim mod on this car is in here
    (1890, 1914),   # AC  air conditioning system, refrigerant line
    (1956, 1965),   # AC  heater control assembly, filter
    (1966, 1971),   # ID  index vol 2
]

SECTION_NAMES = {
    "IN": "Introduction", "MA": "Maintenance", "PP": "Preparation",
    "SS": "Service Specifications", "DI": "Diagnostics", "ID": "Index",
    "EM": "Engine Mechanical", "EC": "Emission Control", "SF": "SFI Fuel Injection",
    "CO": "Cooling", "LU": "Lubrication", "IG": "Ignition", "ST": "Starting",
    "CH": "Charging", "CL": "Clutch", "MX": "Manual Transaxle",
    "AX": "Automatic Transaxle", "SA": "Suspension and Axle", "BR": "Brake",
    "SR": "Steering", "RS": "Supplemental Restraint System",
    "BE": "Body Electrical", "BO": "Body", "AC": "Air Conditioning",
}
# Case-insensitive on purpose: the scan renders plenty of these headers with a
# lowercase second letter ("Ac-48" for AC-48). Demanding uppercase silently
# drops the page's own printed code and falls back to a drifting interpolation.
CODE_RE = re.compile(
    r"\b(IN|MA|PP|SS|DI|ID|EM|EC|SF|CO|LU|IG|ST|CH|CL|MX|AX|SA|BR|SR|RS|BE|BO|AC)"
    r"\s?-{1,2}\s?(\d{1,3})\b",       # the scan renders the dash as - or --
    re.IGNORECASE
)


def curated_pages():
    out = set()
    for a, b in CURATED:
        out.update(range(a, b + 1))
    return out


def pages_to_render(total, curated_only):
    """Every page by default. --curated renders only the shortlist above."""
    return sorted(curated_pages()) if curated_only else list(range(total))


# ---------------------------------------------------------------- figures

def content_box(mask):
    """Bounding box of True cells, or None."""
    rows = np.flatnonzero(mask.any(axis=1))
    cols = np.flatnonzero(mask.any(axis=0))
    if not rows.size or not cols.size:
        return None
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1


def trim_box(ink):
    """
    Find the real content box: scanner margin off, printed page frame off.

    Two passes. The first catches everything including the frame rule that
    borders most pages; the second looks strictly inside that frame, so the
    very common half-empty page collapses down to just its diagram.
    """
    outer = content_box(ink)
    if outer is None:
        return None
    x0, y0, x1, y1 = outer
    fw, fh = x1 - x0, y1 - y0
    if fw < 40 or fh < 40:
        return outer

    ix = max(4, int(fw * 0.025))
    iy = max(4, int(fh * 0.025))
    inner = content_box(ink[y0 + iy:y1 - iy, x0 + ix:x1 - ix])
    if inner is None:
        return outer
    a0, b0, a1, b1 = inner
    box = (x0 + ix + a0, y0 + iy + b0, x0 + ix + a1, y0 + iy + b1)

    # speckle-only result means trust the frame instead
    if (box[2] - box[0]) * (box[3] - box[1]) < 0.04 * fw * fh:
        return outer

    px, py = int(fw * PAD_FRAC), int(fh * PAD_FRAC)
    return (
        max(x0, box[0] - px), max(y0, box[1] - py),
        min(x1, box[2] + px), min(y1, box[3] + py),
    )


def render(page, dest):
    """Rasterise a whole page - image layer and text layer - to a 1-bit PNG."""
    rect = page.rect
    zoom = LONG_EDGE / float(max(rect.width, rect.height))
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom),
                          colorspace=fitz.csGRAY, alpha=False)
    img = Image.frombytes("L", (pix.width, pix.height), pix.samples)
    img = ImageOps.autocontrast(img, cutoff=0.5)

    ink = np.asarray(img) < THRESHOLD
    box = trim_box(ink)
    if box is not None:
        img = img.crop(box)

    img = img.point(lambda v: 255 if v > THRESHOLD else 0).convert("1")
    img.save(dest, "PNG", optimize=True, bits=1)
    return True



def hero_line_art(src_png, dest):
    """
    Crop the rear three-quarter drawing of the car out of the Back-Up Light
    page and save it as the home page's fallback hero.

    It is a nicer answer than a placeholder box: the site already renders 1-bit
    line art as white-on-black, so this drops straight into the design, and it
    is the manual drawing the car. Replaced the moment a real photo is dropped
    at assets/img/car/hero.jpg.
    """
    im = Image.open(src_png)
    w, h = im.size
    box = (int(w * 0.12), int(h * 0.625), int(w * 0.79), int(h * 0.935))
    im.crop(box).save(dest, "PNG", optimize=True, bits=1)


# ---------------------------------------------------------------- structure

def read_outline(doc):
    """[(depth, page0, title)] from the PDF bookmarks."""
    flat = []
    for level, title, page1 in doc.get_toc(simple=True):
        if page1 is None or page1 < 1:
            continue
        flat.append({
            "d": max(0, int(level) - 1),
            "p": int(page1) - 1,
            "t": re.sub(r"\s+", " ", str(title)).strip(),
        })
    flat.sort(key=lambda e: (e["p"], e["d"]))
    return flat


def build_tree(flat, total, have_fig):
    """Section > subsection, each with a page span and a figure count."""
    tops = [e for e in flat if e["d"] <= 1 and re.match(r"^[A-Z]{2} ", e["t"])]
    tree = []
    for i, sec in enumerate(tops):
        code = sec["t"][:2]
        nxt = tops[i + 1]["p"] if i + 1 < len(tops) else total
        kids = [e for e in flat if e["d"] == sec["d"] + 1 and sec["p"] <= e["p"] < nxt]
        subs = []
        for j, k in enumerate(kids):
            b = max(k["p"], kids[j + 1]["p"] - 1 if j + 1 < len(kids) else nxt - 1)
            subs.append({
                "t": k["t"], "a": k["p"], "b": b,
                "f": sum(1 for p in range(k["p"], b + 1) if p in have_fig),
            })
        tree.append({
            "code": code,
            "name": SECTION_NAMES.get(code, sec["t"][3:]),
            "a": sec["p"], "b": nxt - 1,
            "f": sum(1 for p in range(sec["p"], nxt) if p in have_fig),
            "subs": subs,
        })
    return tree


# ---------------------------------------------------------------- text

JUNK_LINE = re.compile(r"^[^0-9A-Za-z]+$")


def clean(text):
    text = text.replace("\ufffd", "")
    lines = []
    for ln in text.split("\n"):
        ln = re.sub(r"[ \t]{2,}", " ", ln).strip()
        if not ln or JUNK_LINE.match(ln):
            continue
        lines.append(ln)
    return "\n".join(lines)


def header_footer(page):
    """
    Text from the top and bottom eighth of a page.

    Toyota prints the page code (BE-25, SS-49) in a running header or footer.
    Searching the whole page instead picks up cross-references in the body
    text - "see page IN-20" - and maps the page to the wrong code.
    """
    rect = page.rect
    top = rect.height * 0.11
    bot = rect.height * 0.89
    head, foot = [], []
    for w in page.get_text("words"):
        x0, y0, x1, y1, word = w[0], w[1], w[2], w[3], w[4]
        if y1 <= top:
            head.append((x0, word))
        elif y0 >= bot:
            foot.append((x0, word))
    head.sort(); foot.sort()
    return (" ".join(t for _, t in head), " ".join(t for _, t in foot))


def find_code(text):
    m = CODE_RE.search(text or "")
    return "%s-%s" % (m.group(1).upper(), m.group(2)) if m else None


def page_codes(texts, bands):
    """
    Manual page code per PDF page, interpolated forward where none was printed.

    Header first, then footer, then the body as a last resort - the body is
    where the false positives live.
    """
    found = {}
    for i, t in enumerate(texts):
        head, foot = bands[i]
        code = (find_code(head) or find_code(head.replace(" ", ""))
                or find_code(foot) or find_code(foot.replace(" ", ""))
                or find_code(t))
        if code:
            found[i] = code
    codes = [found.get(i) for i in range(len(texts))]
    keys = sorted(found)
    for idx, k in enumerate(keys):
        sec, num = found[k].split("-")
        nxt = keys[idx + 1] if idx + 1 < len(keys) else len(texts)
        for step, p in enumerate(range(k + 1, nxt), start=1):
            codes[p] = "%s-%d" % (sec, int(num) + step)
    return codes, found



def verify(codes, found, want, have_fig):
    """
    Sanity-check the mapping before anyone trusts a page citation.

    The interesting failure is drift: a page whose own printed code disagrees
    with what walking forward from the previous anchor predicts. A handful is
    normal (section breaks, unnumbered plates); a lot would mean the page
    mapping is wrong, and every reference on the site with it.
    """
    keys = sorted(found)
    drift = []
    for idx in range(1, len(keys)):
        prev, here = keys[idx - 1], keys[idx]
        psec, pnum = found[prev].split("-")
        hsec, hnum = found[here].split("-")
        if psec != hsec:
            continue                      # a section change is not drift
        predicted = int(pnum) + (here - prev)
        if predicted != int(hnum):
            drift.append((here, found[here], "%s-%d" % (psec, predicted)))

    missing = [p for p in want if p not in have_fig]
    steps = max(1, len(keys) - 1)

    print("")
    print("verification")
    print("  page codes    %d printed, %d interpolated"
          % (len(found), sum(1 for c in codes if c) - len(found)))
    print("  code drift    %d of %d in-section steps disagree (%.1f%%)"
          % (len(drift), steps, 100.0 * len(drift) / steps))
    for pg, got, exp in drift[:5]:
        print("                p.%-5d prints %-9s walk predicts %s" % (pg, got, exp))
    exact = sum(1 for p in want if p in found)
    print("  cited codes   %d of %d curated pages print their own code (%.1f%%);"
          % (exact, len(want), 100.0 * exact / max(1, len(want))))
    print("                the remaining %d are published as approximate"
          % (len(want) - exact))
    print("  figures       %d of %d curated pages rendered" % (len(have_fig), len(want)))
    if missing:
        print("  MISSING       %s" % missing[:12])
    return not missing


# ---------------------------------------------------------------- main

def main():
    args = sys.argv[1:]
    do_fig = "--no-fig" not in args
    curated_only = "--curated" in args
    limit = int(args[args.index("--limit") + 1]) if "--limit" in args else None

    os.makedirs(FIGDIR, exist_ok=True)
    os.makedirs(DATADIR, exist_ok=True)

    print("opening pdf ...")
    doc = fitz.open(PDF)
    total = doc.page_count
    print("  %d pages" % total)

    print("extracting text ...")
    texts = [clean(doc[p].get_text("text", sort=True)) for p in range(total)]
    bands = [header_footer(doc[p]) for p in range(total)]
    codes, found = page_codes(texts, bands)
    print("  %d pages carry an explicit page code" % len(found))

    want = pages_to_render(total, curated_only)
    if limit:
        want = want[:limit]
    print("  rendering %d pages (%s)"
          % (len(want), "shortlist" if curated_only else "everything"))

    have_fig = set()
    if do_fig:
        print("rendering %d figures ..." % len(want))
        t0 = time.time()
        for n, p in enumerate(want, 1):
            dest = os.path.join(FIGDIR, "p%04d.png" % p)
            try:
                if render(doc[p], dest):
                    have_fig.add(p)
            except Exception as exc:
                print("  ! page %d: %s: %s" % (p, type(exc).__name__, exc))
            if n % 50 == 0 or n == len(want):
                el = time.time() - t0
                print("  %4d/%d  %5.1fs  eta %5.1fs"
                      % (n, len(want), el, el / n * (len(want) - n)))
    else:
        for p in want:
            if os.path.exists(os.path.join(FIGDIR, "p%04d.png" % p)):
                have_fig.add(p)

    src = os.path.join(FIGDIR, "p1671.png")
    if os.path.exists(src):
        imgdir = os.path.join(SITE, "assets", "img")
        os.makedirs(imgdir, exist_ok=True)
        hero_line_art(src, os.path.join(imgdir, "hero-line.png"))

    flat = read_outline(doc)
    tree = build_tree(flat, total, have_fig)

    heads = {}
    for e in flat:
        heads.setdefault(e["p"], e["t"])

    # "c" is a code actually printed on the page. "ci" is one inferred by
    # walking forward from the nearest anchor, which drifts wherever the book
    # has an unnumbered plate or divider - so it is published separately and
    # the UI shows it as approximate rather than asserting it.
    pages = [{
        "p": p,
        "c": found.get(p, ""),
        "ci": "" if p in found else (codes[p] or ""),
        "f": 1 if p in have_fig else 0,
        "h": heads.get(p, ""),
        "t": texts[p],
    } for p in range(total)]

    payload = {
        "source": "Toyota RM744U1/U2 - 2000 Celica (ZZT230/231) repair manual, vols 1 and 2",
        "note": "US-market 2000 manual. Mechanicals carry over to a 2003 UK facelift T-Sport; "
                "body electrical, combination meter and some trim do not.",
        "ewd": "Wiring diagrams are a separate publication (EW0399U) and are NOT in this manual.",
        "textwarn": "Page text comes from the PDF's own text layer, whose character map is "
                    "damaged. Words are often mangled. Use it to find a page, then read the figure.",
        "total": total,
        "figures": len(have_fig),
        "tree": tree,
        "pages": pages,
    }

    out = os.path.join(DATADIR, "manual.js")
    with io.open(out, "w", encoding="utf-8") as fh:
        fh.write("window.CELICA=window.CELICA||{};\nwindow.CELICA.manual=")
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
        fh.write(";\n")

    figbytes = sum(
        os.path.getsize(os.path.join(FIGDIR, f))
        for f in os.listdir(FIGDIR) if f.endswith(".png")
    ) / 1048576.0
    print("\nmanual.js  %.2f MB" % (os.path.getsize(out) / 1048576.0))
    print("figures    %d files, %.1f MB" % (len(have_fig), figbytes))
    ok = verify(codes, found, want, have_fig)
    if not ok:
        sys.exit(1)


if __name__ == "__main__":
    main()
