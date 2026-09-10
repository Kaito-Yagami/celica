# Putting this on GitHub Pages

Free, permanent, never sleeps. The end result is a public URL like
`https://<your-username>.github.io/celica/` that both you and Gemini can reach, with no
tunnel and nothing left running on your machine.

**I cannot create accounts or sign in as you.** That part is yours — it is two commands.
Everything after it I can do.

---

## Your bit

### 1. A GitHub account

If you already have one, skip this. Otherwise sign up at **https://github.com/signup** —
you can use `kadebergin@gmail.com`, or "Continue with Google".

### 2. Install the GitHub CLI

```bash
winget install --id GitHub.cli
```

**Then close that terminal and open a new one.** The installer only puts `gh` on the PATH
for processes started afterwards — the same thing that caught out cloudflared.

### 3. Sign in

```bash
gh auth login
```

Answer: **GitHub.com** → **HTTPS** → **Yes** (authenticate Git) → **Login with a web
browser**. It shows an eight-character code, opens your browser, you paste the code.

Check it worked:

```bash
gh auth status
```

### 4. Tell me it's done

That's you finished. I'll create the repository, push, turn Pages on, and verify the live
URL actually serves.

---

## What I do after that

```bash
gh repo create celica --public --source=. --remote=origin --push
gh api -X POST repos/:owner/celica/pages -f source[branch]=main -f source[path]=/site
python tools/export_api.py --base https://<username>.github.io/celica
```

The last one rewrites the OpenAPI `servers` entry, which is the only thing in the whole site
that cannot be a relative path.

---

## What works once it is live

Everything the site does in a browser: the manual browser and its search (that search runs in
your browser off `data/manual.js`, not on a server), the fusebox, the load budget, the wheel
calculator, the issues dashboard, the 3D model. Checkbox state is per-browser as always.

The JSON API is there too, as static files — `/api`, `/api/issues.json`,
`/api/manual/pages/1939.json` and so on. Hand Gemini the `/api` URL and it can discover the
rest.

**Two API endpoints do not survive going static**, because they compute per request:

| Endpoint | Instead |
|---|---|
| `/api/manual/search?q=` | `/api/manual/pages.json` lists every page with its code and heading, and the site's own search page works fine in a browser |
| `/api/wheel?width=…` | The calculator on `specs.html` works; or run `serve.py` locally |

Run `python tools/serve.py` locally whenever you want those back.

---

## Updating it later

```bash
python tools/build.py          # only if the manual changed
python tools/export_api.py --base https://<username>.github.io/celica
git add -A && git commit -m "update" && git push
```

Pages redeploys on push, usually within a minute.

---

## Worth knowing before it goes public

The repository is public, so **all 1,972 pages of Toyota's service manual are on an open
URL**. That is republishing a copyrighted work, which is a different thing from keeping a
copy on your own machine for reference. You chose this knowingly; it is recorded here so the
decision is not buried.

If you want it reversed later, the least disruptive route is `gh repo edit --visibility
private` — which also turns Pages off, since private Pages needs a paid plan. Deleting just
`docs/assets/fig/` and re-pushing keeps the site up and takes the manual images down.

Your number plate is on the home page too, if that matters to you.
