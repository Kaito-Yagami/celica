# -*- coding: utf-8 -*-
"""
Write the API out as static JSON files.

serve.py only listens on your own machine. A cloud service — Gemini, or
anything else that is not running locally — cannot reach 127.0.0.1, and
--host 0.0.0.0 only gets you as far as your own LAN. So this mirrors every
read-only endpoint to a file under docs/api/, which means the whole thing can
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



def write_landing(idx, base):
    """
    An index.html for /api/.

    A static host has no route for a bare `/api` - it looks for `/api/index.html`
    and 404s otherwise. Anything fetching the obvious URL therefore concludes
    there is no API here at all, which is exactly the wrong lesson: the API is
    two thousand JSON files sitting right next to this page. So `/api/` answers
    with a page that says so and lists them.
    """
    base = base.rstrip("/")
    rows = []
    for ep in idx["endpoints"]:
        route, does = ep["route"], ep["does"]
        path = route.split(" ", 1)[1] if " " in route else route
        if "{" in path or "?" in path or path.startswith("assets"):
            rows.append((path, does, None))
            continue
        href = (path[4:] or "/index").lstrip("/") or "index"
        if not href.endswith(".json"):
            href += ".json"
        # only link it if the export actually produced that file - search and
        # the wheel calculator compute per request and have no static form
        if not os.path.exists(os.path.join(OUT, *href.split("/"))):
            rows.append((path, does + " &mdash; <b>live server only</b>", None))
            continue
        rows.append((path, does, href))

    items = "\n".join(
        '<tr><td>%s</td><td class="d">%s</td></tr>' % (
            ('<a href="%s"><code>%s</code></a>' % (href, href)) if href
            else '<code class="dim">%s</code>' % path.replace("<", "&lt;"),
            does)
        for path, does, href in rows)

    html = """<!doctype html>
<html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>API — Celica T-Sport</title>
<link rel="stylesheet" href="../assets/css/app.css">
<style>
body{padding:0 0 60px}
main{max-width:900px;margin:0 auto;padding:40px 20px}
table{width:100%%;border-collapse:collapse;font-size:13.5px}
td{padding:9px 12px;border-bottom:1px solid var(--ink-3);vertical-align:top}
td.d{color:var(--tx-dim)}
code{font-family:var(--mono);font-size:12.5px;color:var(--ember)}
code.dim{color:var(--tx-faint)}
a code{color:var(--ember)}
</style></head><body><main>
<p class="eyebrow">Read-only JSON API</p>
<h1 style="font-size:30px;margin-bottom:14px">%(name)s</h1>
<p class="lede">%(desc)s</p>

<div class="note red">
<div class="hd">Every endpoint is a .json file</div>
<p>This is static hosting, so there are no dynamic routes. <code>/api</code> on its own is
this page; the machine-readable index is
<a href="index.json"><code>index.json</code></a>. Append <code>.json</code> to everything
below.</p>
</div>

<p class="muted" style="font-size:13.5px">Base: <code>%(base)s/api/</code></p>

<table><tbody>
%(rows)s
</tbody></table>

<div class="note amber" style="margin-top:24px">
<div class="hd">Two endpoints are not here</div>
<p><code>/api/manual/search</code> and <code>/api/wheel</code> compute per request, so they
cannot be static. Use <a href="manual/pages.json"><code>manual/pages.json</code></a> to
locate a page by heading or code, or run <code>python tools/serve.py</code> locally to get
both back.</p>
</div>

<div class="note cool">
<div class="hd">What this is a reference to</div>
<p>%(src)s</p>
<p>%(caveat)s</p>
<p>%(text)s</p>
</div>

<p style="margin-top:26px"><a href="../">← the site itself</a> ·
<a href="openapi.json">OpenAPI 3.1 description</a></p>
</main></body></html>
""" % {
        "name": idx["name"],
        "desc": idx["description"],
        "base": base or "",
        "rows": items,
        "src": idx["provenance"]["manual"],
        "caveat": idx["provenance"]["caveat"],
        "text": idx["provenance"]["textLayer"],
    }

    path = os.path.join(OUT, "index.html")
    with io.open(path, "w", encoding="utf-8") as fh:
        fh.write(html)


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

    # last, so it can link only the endpoints that actually got written
    write_landing(idx, args.base)
    files += 1

    print("\n%d files, %.1f MB in docs/api/" % (files, total / 1048576.0))
    print("figures stay where they are: docs/assets/fig/pNNNN.png")


if __name__ == "__main__":
    main()
