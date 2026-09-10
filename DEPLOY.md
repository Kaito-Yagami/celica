# Deployment

**Live: https://kaito-yagami.github.io/celica/**

Repository: https://github.com/Kaito-Yagami/celica — public, GitHub Pages serving `main`
branch, `/docs` folder. Free, permanent, no sleep, nothing running on your machine.

## Why the folder is called `docs`

GitHub Pages will only publish from the repository root or a folder named exactly `docs`.
It refuses anything else, including `/site`. The alternative was a GitHub Actions workflow,
which needs a token with `workflow` scope that this one does not have. So `site/` became
`docs/`. Nothing else about it changed.

## Updating it

```bash
python tools/build.py                                              # only if the manual changed
python tools/export_api.py --base https://kaito-yagami.github.io/celica
git add -A && git commit -m "update" && git push
```

Pages rebuilds on push, live in about thirty seconds. The `--base` flag matters: the OpenAPI
`servers` entry is the only value in the whole site that cannot be a relative path.

## What is live, and what is not

Everything the site does in a browser works: the manual browser and its search (that runs in
your browser off `data/manual.js`, not on a server), the fusebox, load budget, wheel
calculator, issues dashboard, 3D model. Checkbox state is per-browser, as always.

The JSON API is there as static files — `/api/index.json`, `/api/issues.json`,
`/api/manual/pages/1939.json` and so on.

Two endpoints cannot survive going static, because they compute per request:

| Endpoint | Instead |
|---|---|
| `/api/manual/search?q=` | `/api/manual/pages.json` lists every page with code and heading; the site's own search page works fine |
| `/api/wheel?width=…` | The calculator on `specs.html`, or run `serve.py` locally |

`python tools/serve.py` brings both back on your own machine.

## Pointing Gemini at it

> This is a read-only API about my car: https://kaito-yagami.github.io/celica/api/
> Fetch that first — it lists every endpoint. Then tell me what is wrong with the car and what
> the manual says about fixing the air conditioning.

For tool or function calling, give it
`https://kaito-yagami.github.io/celica/api/openapi.json` instead.

## Taking it down again

The repository is public, so **all 1,972 pages of Toyota's service manual are on an open
URL**, along with your number plate on the home page. That is republishing a copyrighted
work, which is a different thing from keeping a copy on your own machine. You chose this
knowingly; it is recorded here so the decision is not buried.

- **Everything private:** `gh repo edit --visibility private`. This also turns Pages off —
  private Pages needs a paid plan.
- **Site up, manual images gone:** delete `docs/assets/fig/` and push.
- **Site up, no manual content at all:** also delete `docs/data/manual.js` and
  `docs/api/manual/`.
