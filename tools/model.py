# -*- coding: utf-8 -*-
"""
Turn the printable Celica STL into something the home page can load.

The site runs from file://, where fetch() and XHR are blocked for local files,
so the mesh cannot be a .stl or .bin sitting next to the page - it has to
arrive as a plain <script>. This packs it down and base64s it into
site/data/model.js.

Packing: weld duplicate vertices (a printable STL repeats every one three
times), quantise positions to a uint16 grid across the bounding box, and index
the triangles with uint16. 44,462 triangles come out around 400 KB raw,
roughly 540 KB as base64 - about the size of a large photo, for a real model
you can spin.

Run:  python tools/model.py
"""
import base64
import io
import json
import os
import struct
import sys
import zipfile

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATADIR = os.path.join(ROOT, "site", "data")

ZIP = r"C:\Users\kadeb\Downloads\toyota-celica-gen7-scale1-70-for-3d-printing (1).zip"
INNER = "source/toyota celica serie 2000 ca1zu70.zip"
# the two members differ only in a small detail; the larger one has more of it
PREFER = "hsw auf"
EDGE_DEGREES = 22.0        # dihedral threshold for a line worth drawing


def read_stl_from_zip():
    outer = zipfile.ZipFile(ZIP)
    inner = zipfile.ZipFile(io.BytesIO(outer.read(INNER)))
    names = inner.namelist()
    pick = next((n for n in names if PREFER in n), names[0])
    print("using %s" % pick)
    return inner.read(pick)


def triangles(blob):
    """(n, 3, 3) float array of triangle corners from a binary STL."""
    n = struct.unpack("<I", blob[80:84])[0]
    rec = np.frombuffer(blob[84:84 + n * 50], dtype=np.uint8).reshape(n, 50)
    # each 50-byte record: 12B normal, 36B three vertices, 2B attribute
    verts = rec[:, 12:48].copy().view(np.float32).reshape(n * 3, 3)
    return verts.astype(np.float64), n


def feature_edges(pts, faces, degrees=22.0):
    """
    Edges worth drawing: the car's creases and silhouette, not every triangle.

    A full triangle wireframe of 44k faces is visual noise. What reads as a
    technical drawing - and matches the manual line art the rest of the site is
    built from - is the same thing three.js EdgesGeometry produces: keep an
    edge only where the two faces meeting along it turn by more than a
    threshold, plus any edge with just one face (a boundary or a hole).

    Precomputed here rather than in the browser so the page has nothing to
    grind through on load.
    """
    a = faces[:, [0, 1, 2]].ravel()
    b = faces[:, [1, 2, 0]].ravel()
    pairs = np.sort(np.stack([a, b], axis=1), axis=1)
    face_of = np.repeat(np.arange(len(faces)), 3)

    order = np.lexsort((pairs[:, 1], pairs[:, 0]))
    pairs, face_of = pairs[order], face_of[order]

    # face normals, unit length
    v0, v1, v2 = pts[faces[:, 0]], pts[faces[:, 1]], pts[faces[:, 2]]
    nrm = np.cross(v1 - v0, v2 - v0)
    ln = np.linalg.norm(nrm, axis=1, keepdims=True)
    nrm = nrm / np.maximum(ln, 1e-12)

    same = np.all(pairs[1:] == pairs[:-1], axis=1)
    dup = np.flatnonzero(same)                 # first index of each shared pair
    cos_lim = np.cos(np.radians(degrees))

    dots = np.einsum("ij,ij->i", nrm[face_of[dup]], nrm[face_of[dup + 1]])
    creased = dup[dots < cos_lim]

    # edges appearing exactly once are boundaries - always keep them
    seen_twice = np.zeros(len(pairs), bool)
    seen_twice[dup] = True
    seen_twice[dup + 1] = True
    boundary = np.flatnonzero(~seen_twice)

    keep = np.concatenate([creased, boundary])
    return np.unique(pairs[keep], axis=0)


def main():
    blob = read_stl_from_zip()
    verts, ntri = triangles(blob)
    print("  %d triangles, %d loose vertices" % (ntri, len(verts)))

    uniq, inv = np.unique(verts, axis=0, return_inverse=True)
    print("  %d unique vertices after welding" % len(uniq))
    if len(uniq) > 65535:
        sys.exit("too many vertices for uint16 indices - decimate first")

    lo = uniq.min(axis=0)
    hi = uniq.max(axis=0)
    span = np.maximum(hi - lo, 1e-9)

    # quantise to a uint16 grid; at this size a step is well under a tenth of
    # a millimetre on the real car, so nothing visible is lost
    q = np.round((uniq - lo) / span * 65535.0).astype(np.uint16)
    idx = inv.astype(np.uint16).reshape(ntri, 3)

    edges = feature_edges(uniq, idx.astype(np.int64), EDGE_DEGREES).astype(np.uint16)
    print("  %d feature edges at %.0f degrees" % (len(edges), EDGE_DEGREES))

    # The STL is Z-up and X-along-the-length. three.js is Y-up, so the page
    # rotates it; the axis order is recorded here rather than hard-coded there.
    payload = {
        "source": "toyota celica gen7, 1:70 printable STL",
        "tris": int(ntri),
        "verts": int(len(uniq)),
        "up": "z",
        "lengthAxis": "x",
        "min": [round(float(v), 4) for v in lo],
        "span": [round(float(v), 4) for v in span],
        "edges": int(len(edges)),
        "edgeAngle": EDGE_DEGREES,
        "pos": base64.b64encode(q.tobytes()).decode("ascii"),
        "idx": base64.b64encode(idx.tobytes()).decode("ascii"),
        "edg": base64.b64encode(edges.tobytes()).decode("ascii"),
    }

    os.makedirs(DATADIR, exist_ok=True)
    out = os.path.join(DATADIR, "model.js")
    with io.open(out, "w", encoding="utf-8") as fh:
        fh.write("window.CELICA=window.CELICA||{};\nwindow.CELICA.model=")
        json.dump(payload, fh, separators=(",", ":"))
        fh.write(";\n")

    print("  positions %s KB, faces %s KB, edges %s KB"
          % (len(payload["pos"]) // 1024, len(payload["idx"]) // 1024,
             len(payload["edg"]) // 1024))
    print("model.js  %.2f MB" % (os.path.getsize(out) / 1048576.0))


if __name__ == "__main__":
    main()
