# -*- coding: utf-8 -*-
"""
Serve the Celica site, and a read-only JSON API over everything in it.

The site itself needs no server — that is the whole point of it. This is for
when you want an agent (Gemini, or anything else that speaks HTTP) to be able
to query the car rather than read the pages.

    python tools/serve.py                 http://127.0.0.1:8777
    python tools/serve.py --port 9000
    python tools/serve.py --host 0.0.0.0  reachable from your own network
    python tools/serve.py --tunnel        reachable from the internet

Point a tool at /api/openapi.json and it can discover the rest on its own.
GET /api lists every endpoint in plain JSON.

Reaching this from a cloud service:

  127.0.0.1 is your machine and nothing outside it can connect, and
  --host 0.0.0.0 only gets as far as your own LAN. So something like Gemini
  cannot call this server as it stands. Two ways round that:

    --tunnel        starts a Cloudflare quick tunnel and prints a public
                    https:// address that forwards here. Needs cloudflared
                    installed, and your machine has to stay on.

    export_api.py   writes every endpoint out as static JSON under site/api/,
                    which can go on any static host and be fetched from
                    anywhere. Everything works except search and the wheel
                    calculator, which have to compute per request.

Read-only by design. Nothing here writes to your data.
"""
import argparse
import io
import json
import math
import os
import re
import shutil
import socket
import subprocess
import sys
import threading
import time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SITE = os.path.join(ROOT, "site")
DATA = os.path.join(SITE, "data")

# manual.js is 1.8 MB of page text and is already pure JSON after the marker,
# so it is parsed directly. Everything else goes through node.
JS_FILES = ["mods.js", "fuses.js", "specs.js", "maint.js", "issues.js", "projects.js"]

DB = {}


# ------------------------------------------------------------------ loading

def load_manual():
    path = os.path.join(DATA, "manual.js")
    src = io.open(path, encoding="utf-8").read()
    marker = "window.CELICA.manual="
    body = src[src.index(marker) + len(marker):].rstrip().rstrip(";")
    return json.loads(body)


def load_via_node():
    files = [os.path.join(DATA, f) for f in JS_FILES]
    missing = [f for f in files if not os.path.exists(f)]
    if missing:
        sys.exit("missing data file: %s" % missing[0])
    try:
        out = subprocess.run(
            ["node", os.path.join(HERE, "dump.js")] + files,
            capture_output=True, check=True,
        )
    except FileNotFoundError:
        sys.exit("node is not on PATH.\n"
                 "The data files are JavaScript, not JSON, so a real engine has to\n"
                 "evaluate them. Install Node, or run the site without the API —\n"
                 "site/index.html works on its own.")
    except subprocess.CalledProcessError as exc:
        sys.exit("node failed reading the data files:\n" +
                 exc.stderr.decode("utf-8", "replace"))
    return json.loads(out.stdout.decode("utf-8"))


def load_all():
    db = load_via_node()
    db["manual"] = load_manual()
    # a lowercased haystack per page, built once, for search
    db["_lower"] = [
        ((p.get("t") or "") + " " + (p.get("h") or "") + " " +
         (p.get("c") or "") + " " + (p.get("ci") or "")).lower()
        for p in db["manual"]["pages"]
    ]
    return db


# ------------------------------------------------------------------- search

def search_manual(q, limit=25, figures_only=False):
    term = (q or "").strip().lower()
    if len(term) < 2:
        return []
    pages = DB["manual"]["pages"]
    low = DB["_lower"]
    hits = []
    for i, hay in enumerate(low):
        if figures_only and not pages[i].get("f"):
            continue
        at = hay.find(term)
        if at < 0:
            continue
        n = hay.count(term)
        pg = pages[i]
        score = n + (3 if pg.get("f") else 0)
        if term in (pg.get("h") or "").lower():
            score += 12
        if term in (pg.get("c") or "").lower():
            score += 8
        text = pg.get("t") or ""
        lo = max(0, at - 90)
        snippet = re.sub(r"\s+", " ", text[lo:at + len(term) + 120]).strip()
        hits.append({
            "page": i,
            "code": pg.get("c") or "",
            "codeApprox": pg.get("ci") or "",
            "heading": pg.get("h") or "",
            "hasFigure": bool(pg.get("f")),
            "figure": "assets/fig/p%04d.png" % i if pg.get("f") else None,
            "matches": n,
            "snippet": snippet,
            "_score": score,
        })
    hits.sort(key=lambda x: (-x["_score"], x["page"]))
    for h in hits:
        del h["_score"]
    return hits[:limit]


def section_for(page):
    for sec in DB["manual"]["tree"]:
        if sec["a"] <= page <= sec["b"]:
            return sec
    return None


# --------------------------------------------------------------- calculator

def wheel(width, profile, rim):
    oem = DB["specs"]["wheels"]["oem"]
    oem_d = oem["r"] * 25.4 + 2 * (oem["w"] * oem["p"] / 100.0)
    d = rim * 25.4 + 2 * (width * profile / 100.0)
    ratio = d / oem_d
    band = []
    for b in DB["specs"]["wheels"]["band"]:
        reads = b["t"] / ratio
        band.append({
            "trueSpeedKph": b["t"],
            "manualAllows": [b["lo"], b["hi"]],
            "yoursReads": round(reads, 1),
            "inSpec": b["lo"] <= reads <= b["hi"],
        })
    return {
        "tyre": "%d/%dR%d" % (width, profile, rim),
        "diameterMm": round(d, 1),
        "circumferenceMm": round(math.pi * d, 1),
        "oem": "%d/%dR%d" % (oem["w"], oem["p"], oem["r"]),
        "oemDiameterMm": round(oem_d, 1),
        "differencePct": round((ratio - 1) * 100, 2),
        "speedoReadsLow": ratio > 1,
        "atIndicated70mphTrueMph": round(70 * ratio, 1),
        "manualTolerance": band,
        "allInSpec": all(b["inSpec"] for b in band),
        "note": "A speedometer may over-read but must never under-read. "
                "A larger rolling diameter pushes it the wrong way.",
    }


# -------------------------------------------------------------------- index

ENDPOINTS = [
    ("GET /api", "This index."),
    ("GET /api/openapi.json", "OpenAPI 3.1 description of everything below."),
    ("GET /api/car", "Identity and factory specification."),
    ("GET /api/issues", "Open faults. Filters: status, area, severity."),
    ("GET /api/issues/{id}", "One fault in full, with diagnosis steps."),
    ("GET /api/projects", "Planned work. Filters: status, cat."),
    ("GET /api/projects/{id}", "One project in full."),
    ("GET /api/mods", "Modifications already done."),
    ("GET /api/mods/{id}", "One modification."),
    ("GET /api/fuses", "Instrument panel J/B. Filters: cls, tapped."),
    ("GET /api/fuses/{n}", "One fuse position, 1-35."),
    ("GET /api/specs", "Service data groups and fluid capacities."),
    ("GET /api/specs/torque", "Tightening torques. Filter: q."),
    ("GET /api/maintenance", "Inspection checklist and pre-MOT list."),
    ("GET /api/manual/sections", "Section tree of the service manual."),
    ("GET /api/manual/search", "Full-text search. Params: q, limit, figures."),
    ("GET /api/manual/pages/{n}", "One page: code, heading, text, figure link."),
    ("GET assets/fig/pNNNN.png", "The rendered page image, four-digit zero-padded."),
    ("GET /api/wheel", "Rolling radius and speedo error. Params: width, profile, rim."),
]


def api_index():
    return {
        "name": "Celica T-Sport ZZT231",
        "description": "Read-only API over a 2003 Toyota Celica T-Sport: its faults, "
                       "modifications, planned work, fusebox, specifications, and the "
                       "full 1,972-page factory service manual.",
        "readOnly": True,
        "counts": {
            "issues": len(DB.get("issues", [])),
            "projects": len(DB.get("projects", [])),
            "mods": len(DB.get("mods", [])),
            "fuses": len(DB.get("fuses", {}).get("slots", [])),
            "manualPages": DB["manual"]["total"],
            "manualFigures": DB["manual"]["figures"],
        },
        "provenance": {
            "manual": DB["manual"]["source"],
            "caveat": DB["manual"]["note"],
            "wiringDiagrams": DB["manual"]["ewd"],
            "textLayer": DB["manual"]["textwarn"],
        },
        "endpoints": [{"route": r, "does": d} for r, d in ENDPOINTS],
    }


def openapi():
    def op(summary, params=None):
        o = {"summary": summary,
             "responses": {"200": {"description": "OK"}}}
        if params:
            o["parameters"] = params
        return {"get": o}

    def q(name, desc, typ="string"):
        return {"name": name, "in": "query", "required": False,
                "schema": {"type": typ}, "description": desc}

    def path_p(name, desc, typ="string"):
        return {"name": name, "in": "path", "required": True,
                "schema": {"type": typ}, "description": desc}

    return {
        "openapi": "3.1.0",
        "info": {
            "title": "Celica T-Sport ZZT231",
            "version": "1.0.0",
            "description": api_index()["description"],
        },
        "servers": [{"url": "/"}],
        "paths": {
            "/api": op("Index of endpoints and provenance"),
            "/api/car": op("Identity and factory specification"),
            "/api/issues": op("Open faults on the car", [
                q("status", "open, diagnosing, scheduled or fixed"),
                q("area", "Climate, Body, Exhaust, Engine"),
                q("severity", "urgent, attention or watch")]),
            "/api/issues/{id}": op("One fault in full", [path_p("id", "Issue id")]),
            "/api/projects": op("Planned work", [
                q("status", "planned, active, done, proposed or parked"),
                q("cat", "Category")]),
            "/api/projects/{id}": op("One project", [path_p("id", "Project id")]),
            "/api/mods": op("Modifications already carried out"),
            "/api/mods/{id}": op("One modification", [path_p("id", "Mod id")]),
            "/api/fuses": op("Instrument panel junction block", [
                q("cls", "bat, acc, ig or ill"),
                q("tapped", "true to list only tapped positions")]),
            "/api/fuses/{n}": op("One fuse position", [
                path_p("n", "Fuse number 1-35", "integer")]),
            "/api/specs": op("Service data and fluid capacities"),
            "/api/specs/torque": op("Tightening torques", [
                q("q", "Substring filter on the part name")]),
            "/api/maintenance": op("Inspection checklist and pre-MOT list"),
            "/api/manual/sections": op("Section tree of the service manual"),
            "/api/manual/search": op("Full-text search across all pages", [
                q("q", "Search term, two characters or more"),
                q("limit", "Maximum hits, default 25", "integer"),
                q("figures", "true to return only pages with a figure")]),
            "/api/manual/pages/{n}": op("One manual page", [
                path_p("n", "0-indexed PDF page", "integer")]),
            "/api/manual/figures/{n}.png": op("Rendered page image", [
                path_p("n", "0-indexed PDF page", "integer")]),
            "/api/wheel": op("Rolling radius and speedometer error", [
                q("width", "Section width in mm, e.g. 215", "integer"),
                q("profile", "Aspect ratio, e.g. 40", "integer"),
                q("rim", "Rim diameter in inches, e.g. 17", "integer")]),
        },
    }


# ------------------------------------------------------------------ routing

def pick(items, key, val):
    if not val:
        return items
    val = val.lower()
    return [i for i in items if str(i.get(key, "")).lower() == val]


def route(path, qs):
    """Return (status, payload) for an /api path. payload None means 404."""
    parts = [p for p in path.strip("/").split("/") if p]
    # parts[0] == 'api'
    rest = parts[1:]
    # A static export writes these as .json files. Accept both spellings so the
    # same URL works against this server and against a static host.
    if rest and rest[-1].endswith(".json") and rest[-1] != "openapi.json":
        rest = rest[:-1] + [rest[-1][:-5]]
    if rest and rest[-1] == "index":
        rest = rest[:-1]

    def one(coll, ident, key="id"):
        for it in DB.get(coll, []):
            if str(it.get(key)) == ident:
                return it
        return None

    if not rest:
        return 200, api_index()

    if rest == ["openapi.json"]:
        return 200, openapi()

    if rest == ["car"]:
        return 200, DB["car"]

    if rest[0] == "issues":
        if len(rest) == 1:
            out = DB["issues"]
            out = pick(out, "status", qs.get("status", [None])[0])
            out = pick(out, "area", qs.get("area", [None])[0])
            out = pick(out, "severity", qs.get("severity", [None])[0])
            return 200, {"count": len(out), "issues": out}
        it = one("issues", rest[1])
        return (200, it) if it else (404, None)

    if rest[0] == "projects":
        if len(rest) == 1:
            out = DB["projects"]
            out = pick(out, "status", qs.get("status", [None])[0])
            out = pick(out, "cat", qs.get("cat", [None])[0])
            return 200, {"count": len(out), "projects": out}
        it = one("projects", rest[1])
        return (200, it) if it else (404, None)

    if rest[0] == "mods":
        if len(rest) == 1:
            return 200, {"count": len(DB["mods"]), "mods": DB["mods"]}
        it = one("mods", rest[1])
        return (200, it) if it else (404, None)

    if rest[0] == "fuses":
        box = DB["fuses"]
        if len(rest) == 1:
            slots = box["slots"]
            cls = qs.get("cls", [None])[0]
            if cls:
                slots = [s for s in slots if s.get("cls") == cls]
            if (qs.get("tapped", [""])[0] or "").lower() in ("1", "true", "yes"):
                slots = [s for s in slots if s["n"] in box["taps"]]
            return 200, {
                "box": box["box"], "classes": box["classes"],
                "taps": box["taps"], "count": len(slots), "slots": slots,
            }
        try:
            n = int(rest[1])
        except ValueError:
            return 404, None
        for s in box["slots"]:
            if s["n"] == n:
                out = dict(s)
                out["tapped"] = n in box["taps"]
                return 200, out
        return 404, None

    if rest[0] == "specs":
        sp = DB["specs"]
        if len(rest) == 1:
            return 200, {"groups": sp["groups"], "fluids": sp["fluids"],
                         "wheels": sp["wheels"]}
        if rest[1] == "torque":
            term = (qs.get("q", [""])[0] or "").lower()
            rows = [t for t in sp["torque"]
                    if not term or term in (t["k"] + " " + t["grp"]).lower()]
            return 200, {"count": len(rows), "torque": rows}
        return 404, None

    if rest[0] == "maintenance":
        return 200, DB["maint"]

    if rest[0] == "manual":
        if len(rest) >= 2 and rest[1] == "sections":
            return 200, {"source": DB["manual"]["source"],
                         "sections": DB["manual"]["tree"]}
        if len(rest) >= 2 and rest[1] == "search":
            term = qs.get("q", [""])[0]
            try:
                limit = max(1, min(200, int(qs.get("limit", ["25"])[0])))
            except ValueError:
                limit = 25
            figs = (qs.get("figures", [""])[0] or "").lower() in ("1", "true", "yes")
            hits = search_manual(term, limit, figs)
            return 200, {"query": term, "count": len(hits),
                         "warning": DB["manual"]["textwarn"], "results": hits}
        if len(rest) == 3 and rest[1] == "pages":
            try:
                n = int(rest[2])
            except ValueError:
                return 404, None
            pages = DB["manual"]["pages"]
            if not (0 <= n < len(pages)):
                return 404, None
            pg = pages[n]
            sec = section_for(n)
            return 200, {
                "page": n,
                "code": pg.get("c") or "",
                "codeApprox": pg.get("ci") or "",
                "codeIsPrinted": bool(pg.get("c")),
                "section": {"code": sec["code"], "name": sec["name"]} if sec else None,
                "heading": pg.get("h") or "",
                "hasFigure": bool(pg.get("f")),
                "figure": "assets/fig/p%04d.png" % n if pg.get("f") else None,
                "text": pg.get("t") or "",
                "textWarning": DB["manual"]["textwarn"],
            }
        return 404, None

    if rest[0] == "wheel":
        try:
            w = int(qs.get("width", ["215"])[0])
            p = int(qs.get("profile", ["40"])[0])
            r = int(qs.get("rim", ["17"])[0])
        except ValueError:
            return 400, {"error": "width, profile and rim must be integers"}
        return 200, wheel(w, p, r)

    return 404, None


# ------------------------------------------------------------------ handler

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=SITE, **kw)

    def log_message(self, fmt, *args):
        sys.stderr.write("  %s\n" % (fmt % args))

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False, indent=1).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        if path == "/api" or path.startswith("/api/"):
            qs = parse_qs(parsed.query)

            # figures are served as images, not JSON
            m = re.match(r"^/api/manual/figures/(\d+)\.png$", path)
            if m:
                n = int(m.group(1))
                src = os.path.join(SITE, "assets", "fig", "p%04d.png" % n)
                if not os.path.exists(src):
                    return self._json(404, {"error": "no figure for page %d" % n})
                data = open(src, "rb").read()
                self.send_response(200)
                self.send_header("Content-Type", "image/png")
                self.send_header("Content-Length", str(len(data)))
                self._cors()
                self.end_headers()
                self.wfile.write(data)
                return

            try:
                status, payload = route(path, qs)
            except Exception as exc:                      # never 500 silently
                return self._json(500, {"error": str(exc)})
            if payload is None:
                return self._json(404, {"error": "no such endpoint", "see": "/api"})
            return self._json(status, payload)

        # everything else is the static site
        super().do_GET()


TUNNEL_URL = re.compile(r"https://[-a-z0-9]+\.trycloudflare\.com")


def find_cloudflared():
    """
    Locate cloudflared without trusting PATH.

    An installer updates the PATH for *new* processes. A terminal that was
    already open when you ran `winget install` keeps the old environment, so
    the binary is on disk, works fine, and is still invisible to `where`.
    Checking the handful of places installers actually use avoids sending
    people away to reopen a shell for no reason.
    """
    found = shutil.which("cloudflared")
    if found:
        return found

    candidates = []
    if os.name == "nt":
        local = os.environ.get("LOCALAPPDATA", "")
        candidates += [
            os.path.join(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)"),
                         "cloudflared", "cloudflared.exe"),
            os.path.join(os.environ.get("ProgramFiles", r"C:\Program Files"),
                         "cloudflared", "cloudflared.exe"),
            os.path.join(local, "Microsoft", "WinGet", "Links", "cloudflared.exe"),
        ]
        pkgs = os.path.join(local, "Microsoft", "WinGet", "Packages")
        if os.path.isdir(pkgs):
            for name in os.listdir(pkgs):
                if "cloudflared" in name.lower():
                    for root, _dirs, files in os.walk(os.path.join(pkgs, name)):
                        for f in files:
                            if f.lower().startswith("cloudflared") and f.lower().endswith(".exe"):
                                candidates.append(os.path.join(root, f))
    else:
        candidates += [
            "/opt/homebrew/bin/cloudflared",
            "/usr/local/bin/cloudflared",
            "/usr/bin/cloudflared",
        ]

    for c in candidates:
        if c and os.path.exists(c):
            return c
    return None


def start_tunnel(port):
    """
    Bring up a Cloudflare quick tunnel and report the public address.

    Quick tunnels need no account and no DNS. The address is random and lasts
    only as long as the process, which is the right trade for handing a URL to
    an agent for one session.
    """
    exe = find_cloudflared()
    if not exe:
        sys.stderr.write(
            "\ncloudflared was not found, so --tunnel cannot run.\n\n"
            "  If you just installed it, open a NEW terminal - an installer only\n"
            "  updates the PATH for processes started afterwards.\n\n"
            "  Otherwise:\n"
            "    winget install --id Cloudflare.cloudflared\n"
            "    brew install cloudflared\n"
            "    https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/\n"
            "\n  Or skip the tunnel: python tools/export_api.py writes the API as\n"
            "  static files that can be hosted anywhere.\n\n")
        return

    if not shutil.which("cloudflared"):
        sys.stderr.write("  using %s\n"
                         "  (not on this shell's PATH - reopen the terminal to fix that)\n"
                         % exe)

    try:
        proc = subprocess.Popen(
            [exe, "tunnel", "--url", "http://127.0.0.1:%d" % port],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, bufsize=1,
        )
    except OSError as err:
        sys.stderr.write("\ncould not start %s: %s\n\n" % (exe, err))
        return

    def announce(url):
        """
        Wait for the hostname to exist before calling the tunnel usable.

        cloudflared prints the address the moment it has been allocated one,
        which is well before that name is in public DNS - measured at around
        48 seconds here, and sometimes it never publishes at all. Announcing it
        immediately sends you off to a browser that says ERR_NAME_NOT_RESOLVED,
        which looks like a broken tunnel rather than one that is not ready.
        """
        host = url.split("//", 1)[1]
        sys.stderr.write("\n  address  %s\n"
                         "  waiting for DNS to publish it ...\n" % url)
        deadline = time.time() + 150
        while time.time() < deadline:
            try:
                socket.getaddrinfo(host, 443)
            except socket.gaierror:
                time.sleep(3)
                continue
            sys.stderr.write(
                "\n  LIVE     %s\n"
                "  api      %s/api\n"
                "  spec     %s/api/openapi.json\n\n"
                "  Anyone with that address can read the whole site and API.\n"
                "  It dies when this process does.\n\n" % (url, url, url))
            return
        sys.stderr.write(
            "\n  %s never appeared in DNS.\n\n"
            "  The connection to Cloudflare is up, but the hostname was never\n"
            "  published - quick tunnels do this occasionally and there is\n"
            "  nothing to fix locally. Stop this and run it again for a fresh\n"
            "  address, or skip tunnels altogether:\n"
            "      python tools/export_api.py\n\n" % url)

    def watch():
        seen = False
        for line in proc.stdout:
            # echo cloudflared verbatim. Swallowing it hides the failures that
            # matter - a tunnel can print its address and still never register
            # with the edge, and you would have no way to tell.
            sys.stderr.write("  cf| %s\n" % line.rstrip())
            m = TUNNEL_URL.search(line)
            if m and not seen:
                seen = True
                threading.Thread(target=announce, args=(m.group(0),),
                                 daemon=True).start()

    threading.Thread(target=watch, daemon=True).start()
    return proc


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--port", type=int, default=8777)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--tunnel", action="store_true",
                    help="expose this server on a public https address via cloudflared")
    args = ap.parse_args()

    global DB
    sys.stderr.write("loading data ...\n")
    DB = load_all()
    idx = api_index()
    c = idx["counts"]
    sys.stderr.write(
        "  %d issues, %d projects, %d mods, %d fuses, %d manual pages\n"
        % (c["issues"], c["projects"], c["mods"], c["fuses"], c["manualPages"]))

    base = "http://%s:%d" % (args.host, args.port)
    sys.stderr.write("\nsite   %s/\n" % base)
    sys.stderr.write("api    %s/api\n" % base)
    sys.stderr.write("spec   %s/api/openapi.json\n" % base)

    static = os.path.join(SITE, "api", "index.json")
    if os.path.exists(static):
        sys.stderr.write("       (a static export also exists in site/api/)\n")
    sys.stderr.write("\n")

    if args.tunnel:
        sys.stderr.write("opening a public tunnel ...\n")
        start_tunnel(args.port)

    srv = ThreadingHTTPServer((args.host, args.port), Handler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        sys.stderr.write("\nstopped\n")


if __name__ == "__main__":
    main()
