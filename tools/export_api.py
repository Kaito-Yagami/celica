# -*- coding: utf-8 -*-
"""
Write the API out as static JSON files.

serve.py only listens on your own machine. A cloud service — Gemini, or
anything else that is not running locally — cannot reach 127.0.0.1, and
--host 0.0.0.0 only gets you as far as your own LAN. So this mirrors every
read-only endpoint to a file under site/api/, which means the whole thing can
be dropped on any static host and fetched over HTTPS from anywhere.

The payloads come from serve.py's own route() function, so there is exactly
one implementation of what each endpoint returns and the two cannot drift.

    python tools/export_api.py

Every path works with or without the .json suffix on the live server, so a URL
written against the static export also works against serve.py and vice versa.

What cannot be static: free-text search and the wheel calculator both compute
per-request. Those stay on serve.py. Everything else — the car, faults,
projects, modifications, fuses, specifications, maintenance, the section tree
and all 1,972 manual pages — is a file.
"""
import argparse
import io
import json
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import serve                                     # noqa: E402

OUT = os.path.join(serve.SITE, "api")


def write(rel, payload):
    path = os.path.join(OUT, *rel.split("/"))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with io.open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, separators=(",", ":"))
    return os.path.getsize(path)


def payload(route_path, qs=None):
    status, body = serve.route(route_path, qs or {})
    if status != 200 or body is None:
        raise RuntimeError("route %s returned %s" % (route_path, status))
    return body


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--base", default="/",
                    help="where this will be hosted, e.g. "
                         "https://user.github.io/celica . Written into the "
                         "OpenAPI servers entry, which is the one thing that "
                         "cannot be relative.")
    args = ap.parse_args()

    print("loading data ...")
    serve.DB = serve.load_all()
    db = serve.DB

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(OUT)

    total = 0
    files = 0

    def emit(rel, route_path, qs=None):
        nonlocal total, files
        total += write(rel, payload(route_path, qs))
        files += 1

    # ---- index, with a note about what a static copy cannot do -------------
    idx = payload("/api")
    idx["static"] = True
    idx["staticNote"] = (
        "This is a static export. Every route below is a file, and also works "
        "with a .json suffix. Free-text search (/api/manual/search) and the "
        "wheel calculator (/api/wheel) compute per request and are only "
        "available from tools/serve.py."
    )
    idx["pageList"] = "manual/pages.json"
    idx["figures"] = (
        "Figure paths in these files are relative to the site root, e.g. "
        "assets/fig/p1939.png. Resolve them against wherever this is hosted "
        "rather than assuming a leading slash - a project page on GitHub "
        "Pages sits at a subpath."
    )
    total += write("index.json", idx)
    files += 1

    spec = payload("/api/openapi.json")
    spec["servers"] = [{"url": args.base.rstrip("/") or "/"}]
    total += write("openapi.json", spec)
    files += 1
    emit("car.json", "/api/car")
    emit("maintenance.json", "/api/maintenance")
    emit("specs.json", "/api/specs")
    emit("specs/torque.json", "/api/specs/torque")
    emit("manual/sections.json", "/api/manual/sections")

    # ---- collections and their members ------------------------------------
    for coll in ("issues", "projects", "mods"):
        emit("%s.json" % coll, "/api/%s" % coll)
        for item in db[coll]:
            emit("%s/%s.json" % (coll, item["id"]), "/api/%s/%s" % (coll, item["id"]))

    emit("fuses.json", "/api/fuses")
    for slot in db["fuses"]["slots"]:
        emit("fuses/%d.json" % slot["n"], "/api/fuses/%d" % slot["n"])

    # ---- a compact map of every page, so an agent can locate things -------
    pages = db["manual"]["pages"]
    total += write("manual/pages.json", {
        "count": len(pages),
        "note": "Compact index. Fetch /api/manual/pages/<n>.json for the full "
                "text of one page.",
        "pages": [{
            "page": i,
            "code": p.get("c") or p.get("ci") or "",
            "codeIsPrinted": bool(p.get("c")),
            "heading": p.get("h") or "",
        } for i, p in enumerate(pages) if p.get("h") or p.get("c")],
    })
    files += 1

    print("writing %d manual pages ..." % len(pages))
    for i in range(len(pages)):
        emit("manual/pages/%d.json" % i, "/api/manual/pages/%d" % i)

    print("\n%d files, %.1f MB in site/api/" % (files, total / 1048576.0))
    print("figures stay where they are: site/assets/fig/pNNNN.png")


if __name__ == "__main__":
    main()
