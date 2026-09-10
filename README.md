# Celica T230 — service reference and build record

A local, offline site for a 2003 Toyota Celica T-Sport (ZZT231, 2ZZ-GE, C60, RHD): the
factory manual made searchable, the fusebox as it actually is on this car, the ten
modifications with the manual pages for each job, and an electrical load planner.

**Open `site/index.html` by double-clicking it.** No server, no build step, no network.

---

## Why it is built the way it is

`file://` blocks `fetch()` and ES modules, so there is no bundler, no imports and no JSON
loading. Data ships as plain scripts that assign to `window.CELICA`, pulled in with
`<script src>`. Everything is vanilla ES5-flavoured JavaScript in classic scripts. That is
a deliberate constraint, not a shortcut: the acceptance test for this site is that it works
on a phone, in a garage, with no signal.

---

## Layout

```
site/
  index.html        the car, spec sheet, entry points
  issues.html       open faults, mapped on the car
  mods.html         ten mod dossiers, each with manual references
  electrical.html   interactive fusebox, circuit classes, load budget
  manual.html       figure browser + full-text search over all 1,972 pages
  specs.html        torque, service limits, fluids, wheel/speedo calculator
  garage.html       inspection checklist, service log, pre-MOT
  projects.html     project hub — index plus a detail view per project
  assets/
    css/app.css         one stylesheet
    js/*.js             app.js is shared; one file per page
    js/vendor/          three.min.js, vendored so it works offline
    fig/p####.png       all 1,972 manual pages, 1-bit, 51 MB
    img/hero-line.png   generated fallback hero
    img/car/            drop your own photos here
  data/*.js             manual.js and model.js are generated
  api/                  generated static API — see below
tools/build.py          manual extractor
tools/model.py          STL packer for the model
tools/serve.py          static server + live read-only JSON API
tools/export_api.py     writes that API out as static JSON under site/api/
tools/dump.js           evaluates the data files for the two above
```

Total about 55 MB.

---

## What the source material is, and what that costs

The bundled manual is **Toyota RM744U1/U2 — the 2000 US-market Celica book (ZZT230/231),
first printed July 1999.** Four things follow from that, and the site says all four out loud
rather than papering over them:

1. **The body electrical does not match this car.** The manual's instrument panel junction
   block has 23 fuses; the 2003 UK facelift has 35. Everything on `electrical.html` is
   transcribed from the label on *this* car. The manual's box is shown for context only,
   clearly labelled as the wrong one.

2. **There are no wiring diagrams.** Circuit diagrams were a separate publication, the EWD
   `EW0399U`. What this manual gives is component locations, removal sequences and
   specifications.

3. **The PDF's text layer has a damaged character map.** Glyphs paint correctly but the
   extracted codepoints are mangled — "thickness" comes out as "thk:kfless", "SS-49" as
   "S5-49". So the text is used for search only, always labelled as such, and **every
   published specification was read off the rendered figure by eye.**

4. **Only two thirds of pages print their own page code.** 1,312 of 1,972 do; the rest are
   inferred by counting forward from the nearest numbered page, which drifts wherever the
   book has an unnumbered plate or a section divider. Inferred codes are shown as `≈ BE-26`
   in a muted chip; printed ones are shown solid. The PDF page number is always exact.

   Two things worth knowing if you ever touch `CODE_RE`: the scan renders plenty of headers
   with a lowercase second letter (`Ac-48`) and plenty with a doubled dash (`AC--47`). Both
   used to fall through to a drifting guess. The regex is case-insensitive and accepts one
   or two dashes for exactly that reason — tightening it silently degrades every citation
   on the site.

---

## Rebuilding the figures

```bash
python tools/build.py
```

Needs `pymupdf`, `pillow` and `numpy`. Renders **every page** — about five minutes and 51 MB
— and writes `site/assets/fig/*.png` plus `site/data/manual.js`. Flags: `--curated` renders
only the shortlist in `CURATED` for a quick small build, `--no-fig` does metadata only in
seconds, `--limit N` is a smoke test.

Two things worth knowing before touching the extractor:

- **The PDF is not uniform.** Most pages are 1-bit Flate scans with no text layer, but 114
  of them — including the entire Service Specifications section — are an 8-bit JPEG of the
  table rules with the *text drawn as real PDF text on top*. Pulling the largest image
  XObject silently loses all the text on those pages. The page has to be properly
  rasterised, which is why this uses pymupdf rather than unpacking streams by hand.

- **Figures are 1-bit on purpose.** At 1,800 px a bilevel PNG is ~22 KB against ~150 KB for
  greyscale, and because it is pure line art it inverts cleanly. The site renders every
  figure with `filter: invert(1)` and `mix-blend-mode: screen`, so the diagram floats as
  white lines on the page background with no white plate around it.

The build ends with a verification pass: how many pages print their own code, how far the
inferred ones drift, and whether every curated page produced a figure. It exits non-zero if
any figure is missing.

---

## The turnable model

Below the entry tiles on the home page, the car renders as a **wireframe of feature edges** —
not a shaded model. `tools/model.py` keeps only edges where the two faces meeting along them
turn by more than 22°, plus every boundary edge: 15,760 lines out of 44,462 triangles. That is
the same thing the manual's illustrations are, which is why it sits in this site without
looking pasted in. A solid mesh painted the colour of the page sits behind the lines writing
depth, so far-side edges are hidden and it reads as a drawing rather than a wire cage.

Same offline constraint as everything else: `file://` blocks XHR, so the mesh cannot sit next
to the page as an `.stl`. The script welds the duplicate vertices out of the printable STL (a
print file repeats every vertex three times), quantises positions to a uint16 grid, indexes
faces and edges with uint16, and base64s all of it into `site/data/model.js` — about 590 KB.
three.js is vendored at `site/assets/js/vendor/three.min.js` for the same reason.

```bash
python tools/model.py
```

The camera sits at **one fixed distance**, worked out once by sweeping the whole range of
viewing angles and taking the worst case. Re-fitting per frame — which is what it did at
first — makes the car breathe in and out as it turns, because a long low shape needs far less
room head-on than broadside. Five preset views, drag to orbit, hidden-line removal and
auto-turn are all toggleable, and the render loop idles when nothing is moving rather than
repainting a static image forever. No WebGL, or any failure
building the mesh, and the section says so rather than showing an empty box;
`prefers-reduced-motion` stops the auto-turn while leaving it draggable; rendering pauses when
the section scrolls out of view.

The hero image at the top of the page is the manual's own line drawing of the car, cropped out
of the Back-Up Light page by `build.py`.

---

## Data files you may want to edit

| File | What it holds |
|---|---|
| `data/fuses.js` | All 35 slots from this car's label, circuit classes, estimated existing loads, and the four fitted taps |
| `data/mods.js` | The car's spec, and one dossier per modification |
| `data/specs.js` | Torque, service limits, fluids, wheel presets — every row carries the page it was read from |
| `data/maint.js` | Inspection checklist and pre-MOT list |
| `data/projects.js` | One entry per project — id, status, sections of HTML, checklists. Append to it and the projects page builds the rest |
| `data/issues.js` | One entry per fault, each with a hotspot placing it on the 3D model, diagnosis steps and manual references |
| `data/manual.js` | **Generated** by `build.py`. Do not hand-edit |
| `data/model.js` | **Generated** by `model.py`. The 3D mesh |

Every `fig:`, `ref:` and `p:` in those files is a 0-indexed PDF page and must have a
matching `site/assets/fig/pNNNN.png`.

---

## Issues, and the map

`issues.html` is a dashboard over `data/issues.js`. Each issue carries a `hot: {x, y, z}` in
the model's own coordinate space, and the page marks it on the wireframe car — X runs from
about -33 at the tail to +33 at the nose, Y from 0 at the ground to ~20 at the roof, Z from
-15 to +15 across it. RHD, so the driver's side is +Z.

Each marker is drawn as a callout in the manual's own idiom: a red dot on the part, a grey
leader that kinks once, and the label held clear of the bodywork. The kink direction is chosen
per frame from which quadrant the anchor lands in, so labels are always pushed away from the
centre of the frame rather than sitting on top of the car. Anything whose point is behind the
bodywork dims.

Statuses (open / diagnosing / scheduled / fixed) and the per-issue diagnosis checkboxes are
stored locally, so the dashboard counts reflect where you actually are.

---

## The API, and reaching it from outside

There are two forms of the same read-only API. They return byte-identical payloads, because
the static export is generated by calling the live server's own route handler.

### Static — a folder of JSON

```bash
python tools/export_api.py      # writes site/api/, ~2,040 files, 2.6 MB
```

Every endpoint becomes a file. No server, no Node at runtime, works from `file://` and from
any static host. **This is the form a cloud service can actually reach** — put `site/` on
GitHub Pages, Cloudflare Pages, Netlify or anything else that serves files, and hand out the
URL.

### Live — `tools/serve.py`

```bash
python tools/serve.py                 # http://127.0.0.1:8777
python tools/serve.py --host 0.0.0.0  # your LAN as well
python tools/serve.py --tunnel        # a public https:// address
```

Adds the two things a static copy cannot do, because they compute per request:
`/api/manual/search?q=` and `/api/wheel?width=&profile=&rim=`.

> **`127.0.0.1` is your machine and nothing outside it can connect.** `--host 0.0.0.0` only
> reaches your own network. Neither is visible to Gemini or any other cloud service. Use
> `--tunnel` — which needs `cloudflared` installed and starts a Cloudflare quick tunnel — or
> host the static export. A tunnel means anyone holding the address can read the whole site,
> and it dies when the process does.

Two things about `--tunnel` worth knowing:

- **Just installed cloudflared and it still says not found?** An installer only updates the
  PATH for processes started *afterwards*, so a terminal that was already open keeps the old
  one. `serve.py` works around this by checking where installers actually put it — Program
  Files, the WinGet Links shim, the WinGet package tree, Homebrew — so it should find it
  anyway and tell you it is not on your PATH. Reopening the terminal fixes the underlying
  problem.
- **A quick tunnel takes a little while to become reachable.** cloudflared prints the address
  as soon as it has one, which is before DNS for that random hostname has propagated. If the
  first request fails, wait and try again. cloudflared'''s own log is streamed with a `cf|`
  prefix so you can see whether it actually registered — look for
  `Registered tunnel connection`.

### Pointing an assistant at it

Once a tunnel is up, the address self-describes — `/api` returns the endpoint list, the record
counts and the provenance caveats, so an assistant learns on its first fetch that the manual is
a 2000 US book and that its text layer is damaged. A prompt that works:

> This is a read-only API about my car: `https://<your-tunnel>/api`
> Fetch that first — it lists every endpoint. Then tell me what is wrong with the car and
> what the manual says about fixing the air conditioning.

For tool or function calling, hand it `/api/openapi.json` instead and let it bind the routes.

**The address changes every time you restart.** Quick tunnels are random and disposable, which
is fine for one session and annoying for repeated use. A free Cloudflare account gets you a
named tunnel with a stable hostname — `cloudflared tunnel login`, then
`cloudflared tunnel create` — at which point you are managing DNS, and the static export is
usually the easier answer.

### Routes

Every path works with or without a `.json` suffix, so a URL written against the static export
also works against the live server.

| Route | Returns |
|---|---|
| `/api` | Index, counts, provenance |
| `/api/openapi.json` | OpenAPI 3.1 description |
| `/api/car` | Identity and factory specification |
| `/api/issues` · `/api/issues/{id}` | Faults. Live filters: `status`, `area`, `severity` |
| `/api/projects` · `/api/projects/{id}` | Planned work. Live filters: `status`, `cat` |
| `/api/mods` · `/api/mods/{id}` | Modifications already done |
| `/api/fuses` · `/api/fuses/{n}` | The J/B. Live filters: `cls`, `tapped` |
| `/api/specs` · `/api/specs/torque` | Service data, fluids, torques |
| `/api/maintenance` | Inspection checklist and pre-MOT list |
| `/api/manual/sections` | Section tree |
| `/api/manual/pages.json` | Compact index of every page |
| `/api/manual/pages/{n}` | Code, heading, text, figure link |
| `assets/fig/pNNNN.png` | The rendered page image, four-digit zero-padded |
| `/api/manual/search?q=` | **Live only.** Full text across all 1,972 pages |
| `/api/wheel?width=&profile=&rim=` | **Live only.** Rolling radius and speedo error |

Figure paths are relative to the site root — resolve them against wherever it is hosted rather
than assuming a leading slash, since a GitHub Pages project site sits at a subpath.

**Read-only.** Nothing writes to your data. CORS is open.

`serve.py` needs **Node on PATH** — the data files are hand-written JavaScript, with comments
and template literals full of HTML, so they are not JSON. Rather than write a fragile
JS-subset parser in Python it shells out to `tools/dump.js` once at startup and lets a real
engine evaluate them. The static export needs Node for the same reason, but only when you
regenerate it; serving the result needs nothing.

---

## State

Checkboxes, the service log, probed fuse classes, the load budget and your tyre size are
stored in `localStorage` under `celica.*`, in that browser only. Nothing is uploaded.

---

Figures reproduced from Toyota RM744U1/U2 for personal reference.
