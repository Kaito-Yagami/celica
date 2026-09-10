# -*- coding: utf-8 -*-
"""
App icons, generated from the car itself.

The silhouette is the real mesh projected side-on and filled, not a drawn
approximation - the same STL the model viewer uses. Everything else matches the
site's palette: near-black ground, brick red accent, warm off-white body.

    python tools/icons.py

Writes into docs/assets/icons/ and docs/site.webmanifest. Rerun after changing
the palette or the model.
"""
import io
import json
import os
import struct
import sys
import zipfile

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "docs")
OUT = os.path.join(SITE, "assets", "icons")

ZIP = r"C:\Users\kadeb\Downloads\toyota-celica-gen7-scale1-70-for-3d-printing (1).zip"
INNER = "source/toyota celica serie 2000 ca1zu70.zip"
PREFER = "hsw auf"

INK = (14, 13, 15)          # --ink-0
RED = (192, 80, 74)         # --red
BODY = (230, 225, 222)      # --tx


def triangles():
    outer = zipfile.ZipFile(ZIP)
    inner = zipfile.ZipFile(io.BytesIO(outer.read(INNER)))
    names = inner.namelist()
    blob = inner.read(next((n for n in names if PREFER in n), names[0]))
    n = struct.unpack("<I", blob[80:84])[0]
    rec = np.frombuffer(blob[84:84 + n * 50], dtype=np.uint8).reshape(n, 50)
    return rec[:, 12:48].copy().view(np.float32).reshape(n, 3, 3).astype(np.float64)


def silhouette(width, supersample=4):
    """
    Side-on filled outline of the car, white on transparent, sized to `width`
    with its own aspect ratio kept.

    Every triangle is projected onto the length/height plane and filled. Overlap
    does the work - the union of 44,000 filled triangles is exactly the
    silhouette, with no outline extraction needed.
    """
    tris = triangles()
    xz = tris[:, :, [0, 2]]                    # STL: X along the car, Z up

    lo = xz.reshape(-1, 2).min(axis=0)
    hi = xz.reshape(-1, 2).max(axis=0)
    span = hi - lo

    W = int(width * supersample)
    H = max(1, int(round(W * span[1] / span[0])))
    scale = W / span[0]

    img = Image.new("L", (W, H), 0)
    dr = ImageDraw.Draw(img)
    for t in xz:
        dr.polygon([((p[0] - lo[0]) * scale, H - (p[1] - lo[1]) * scale) for p in t],
                   fill=255)

    return img.resize((int(width), max(1, int(round(width * span[1] / span[0])))),
                      Image.LANCZOS)


def compose(size, maskable=False):
    """Car on the site's ground, with the red rule the headings use."""
    img = Image.new("RGB", (size, size), INK)

    # the faint red wash the pages have behind everything
    glow = Image.new("L", (size, size), 0)
    ImageDraw.Draw(glow).ellipse(
        [-size * 0.35, -size * 0.5, size * 0.95, size * 0.6], fill=95)
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.18))
    img = Image.composite(Image.new("RGB", (size, size), (60, 25, 23)), img, glow)

    # draw AFTER the composite - it returns a new image, so a Draw bound to the
    # old one paints into something that gets thrown away
    dr = ImageDraw.Draw(img)

    # maskable icons are cropped to a circle or squircle, so the car has to sit
    # well inside the safe zone rather than filling the square
    car_w = int(size * (0.62 if maskable else 0.92))
    car = silhouette(car_w)
    body = Image.new("RGB", car.size, BODY)
    cx = (size - car_w) // 2
    cy = int(size * 0.5 - car.size[1] * 0.70)
    img.paste(body, (cx, cy), car)

    bar_y = cy + car.size[1] + int(size * 0.045)
    bar_w = car_w * 0.42
    dr.rounded_rectangle(
        [size / 2 - bar_w / 2, bar_y, size / 2 + bar_w / 2,
         bar_y + max(2, size * 0.030)],
        radius=size * 0.02, fill=RED)
    return img


def main():
    if not os.path.exists(ZIP):
        sys.exit("model archive not found: %s" % ZIP)
    os.makedirs(OUT, exist_ok=True)

    print("rendering silhouette ...")
    jobs = [
        ("icon-512.png", 512, False),
        ("icon-192.png", 192, False),
        ("apple-touch-icon.png", 180, False),
        ("icon-maskable-512.png", 512, True),
        ("favicon-32.png", 32, False),
        ("favicon-16.png", 16, False),
    ]
    for name, size, maskable in jobs:
        compose(size, maskable).save(os.path.join(OUT, name), "PNG", optimize=True)
        print("  %-24s %d px" % (name, size))

    # a single .ico covering the sizes Windows and older browsers ask for
    ico = compose(256)
    ico.save(os.path.join(SITE, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])
    print("  favicon.ico              16/32/48")

    manifest = {
        "name": "Celica T-Sport — ZZT231",
        "short_name": "Celica",
        "description": "Service reference, mod record and issue tracker for a 2003 "
                       "Toyota Celica T-Sport.",
        # relative on purpose: this is served from a subpath on GitHub Pages,
        # and an absolute start_url would send the installed app to the domain root
        "start_url": ".",
        "scope": ".",
        "display": "standalone",
        "orientation": "any",
        "background_color": "#0E0D0F",
        "theme_color": "#0E0D0F",
        "icons": [
            {"src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "assets/icons/icon-maskable-512.png", "sizes": "512x512",
             "type": "image/png", "purpose": "maskable"},
        ],
        "shortcuts": [
            {"name": "Issues", "url": "issues.html"},
            {"name": "Fusebox", "url": "electrical.html"},
            {"name": "Manual", "url": "manual.html"},
        ],
    }
    with io.open(os.path.join(SITE, "site.webmanifest"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1)
    print("  site.webmanifest")


if __name__ == "__main__":
    main()
