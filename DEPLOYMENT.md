# Deployment checklist (Netlify)

Live site: https://portfoliobuildersiev.netlify.app/

Work top to bottom. Everything in **Repo** is already committed; the **Netlify**
and **Supabase** steps are one-time dashboard actions only you can do.

## 1. Repo (done — no action needed)

- [x] `public/_redirects` — SPA fallback (`/* /index.html 200`) so deep links /
      refresh on `/app`, `/app/edit`, `/u/:slug` don't 404.
- [x] `netlify.toml` — build command `npm run build`, publish dir `dist`, same
      SPA redirect as a backup.
- [x] `public/og-image.jpg` — social preview image referenced by `index.html`.
- [x] `index.html` — canonical + OG + Twitter tags point at the Netlify URL.

## 2. Netlify site settings

- [ ] **Build command:** `npm run build`
- [ ] **Publish directory:** `dist`
      (auto-detected from `netlify.toml`; confirm they match.)
- [x] **Environment variables** (Site settings → Environment variables) —
      set to project `ytymuqlajzmysujgrksc` (your own account, not the
      earlier friend-owned project):

      | Key                              | Value                                                        |
      | -------------------------------- | ------------------------------------------------------------ |
      | `VITE_SUPABASE_URL`              | `https://ytymuqlajzmysujgrksc.supabase.co`                   |
      | `VITE_SUPABASE_PROJECT_ID`       | `ytymuqlajzmysujgrksc`                                        |
      | `VITE_SUPABASE_PUBLISHABLE_KEY`  | the project's publishable key (also in the repo `.env`)      |

      ⚠️ **Netlify's own site-level env vars override the repo's `.env` file
      at build time.** If you ever change the Supabase project again, update
      it in **both** places — Site settings → Environment variables **and**
      the repo `.env` — or the site will silently keep building against the
      old project.

- [ ] After changing settings, **Deploys → Trigger deploy → Clear cache and
      deploy site**, then hard-refresh the browser (env var changes only take
      effect on the *next* build, never retroactively).

## 3. Supabase — required for Google sign-in on this domain ⚠️

Google/OAuth login only works on domains that are explicitly allow-listed.
In the Supabase dashboard for project `ytymuqlajzmysujgrksc`:

- [ ] **Authentication → URL Configuration → Site URL:**
      set to `https://portfoliobuildersiev.netlify.app`
- [ ] **Authentication → URL Configuration → Redirect URLs:** add both
      - `https://portfoliobuildersiev.netlify.app`
      - `https://portfoliobuildersiev.netlify.app/**`
- [ ] If you later add a custom domain, add it here too.

> Email/password sign-in and all public pages (landing, `/u/:slug`, 404) work
> **without** this step. Only Google sign-in needs the redirect URL added.

## 4. Smoke test after deploy

- [ ] Landing page loads; no horizontal scroll on a phone (test at 320–414px).
- [ ] Open a deep link directly, e.g. `/style-guide` — it loads (no 404).
- [ ] Refresh while on `/app` — stays on the page (no 404).
- [ ] Sign in (Google + email) → lands on `/app`.
- [ ] Publish a profile, open `/u/<your-slug>` in a new tab.
- [ ] Paste the site URL into a link-preview tool (or a chat) — title, description,
      and OG image render.

## 5. AI discoverability (GEO / AEO) — how to verify

**Everything here only kicks in for profiles with the "Published" toggle on.**
A draft profile is deliberately `noindex`, is excluded from `llms.txt`, and is
not prerendered. If nothing below shows data, check that first.

What ships, and what each piece is for:

| URL | Served as | Needs JS? | Purpose |
| --- | --- | --- | --- |
| `/llms.txt` | plain Markdown | no | Site index for AI crawlers (llmstxt.org) |
| `/llms-full.txt` | plain Markdown | no | Expanded site description |
| `/llms/<slug>.txt` | plain Markdown | no | One file per published profile |
| `/u/<slug>` | HTML + JSON-LD | no | Profile page, `<head>` prerendered at the edge |
| `/api/og?...` | PNG 1200×630 | no | Link-preview card |

- [ ] `curl https://<site>/llms.txt` returns Markdown (not the HTML shell). Once a
      profile is published, a `## Founder profiles` section lists it.
- [ ] `curl https://<site>/u/<slug> | grep ld+json` shows the JSON-LD **in the raw
      HTML** — that is `netlify/edge-functions/profile-seo.ts` doing its job, and
      it's what makes the profile readable by crawlers that don't run JavaScript.
- [ ] Paste `https://<site>/u/<slug>` into <https://validator.schema.org> —
      expect `Person`, `ProfessionalService`, and `ItemPage`.

> Point the schema validator at a **profile URL**, never at `/llms.txt`.
> `llms.txt` is plain Markdown by design, so a structured-data validator
> correctly reports "No items detected" for it. That is a pass, not a failure.

### How the two halves stay in sync

`netlify/lib/seo.generated.mjs` is compiled from `src/lib/geo/schema.ts` by
`scripts/build-edge-seo.mjs` (wired into `prebuild`). The edge prerender and the
in-app `<SeoHead>` therefore run the *same* code — they can't drift. The file is
committed so a deploy never depends on that step succeeding; run
`npm run generate:edge-seo` after editing the schema builders.

## 6. Moving to a custom domain (iev.mba)

Absolute URLs are no longer hardcoded. `vite.config.ts` substitutes
`__SITE_URL__` in `index.html` from `SITE_URL || URL`, and Netlify sets `URL`
to the project's **primary** domain — so canonical, `og:url`, and the Twitter
tags follow the domain automatically on the next deploy. `SeoHead`, the edge
prerender, and `/api/og` already derive their origin from the request, and
`scripts/generate-llms.mjs` reads the same env vars.

Order matters here — doing step 3 before step 2 publishes a canonical tag
pointing at a domain that isn't serving the site yet.

- [ ] **1. Netlify → Domain management → Add a domain** → `iev.mba`.
      Netlify shows the DNS records it wants.
- [ ] **2. At the registrar**, repoint the domain away from the old project:
      - apex `iev.mba` → `A` record to Netlify's load balancer IP (Netlify
        shows the current one), or `ALIAS`/`ANAME` if the registrar supports it
      - `www` → `CNAME` to `<project>.netlify.app`
      - delete the old project's A/CNAME records, or they'll keep winning
      Propagation is usually minutes, occasionally up to 48h.
- [ ] **3. Set `iev.mba` as the primary domain** in Netlify (not just an alias).
      `URL` follows the primary domain, so an alias alone won't change the tags.
- [ ] **4. Wait for the Let's Encrypt certificate** to provision (automatic).
- [ ] **5. Trigger a deploy** so `index.html` and `llms.txt` regenerate with the
      new host, then confirm:
      `curl -s https://iev.mba/llms.txt | head -5`
      `curl -s https://iev.mba/u/<slug> | grep -o 'rel="canonical"[^>]*'`
- [ ] **6. Supabase → Authentication → URL Configuration:** add
      `https://iev.mba` as Site URL and `https://iev.mba/**` to Redirect URLs,
      or Google sign-in breaks on the new domain.
- [ ] **7. Google Search Console:** add `iev.mba` as a property, verify it, and
      submit the sitemap/URLs. Nothing gets crawled faster than you ask for it.

## 7. Moving the site to a different Netlify account

Use this when the current team's free allowance runs out, or to hand ownership
to the founder's email. Today's setup:

| | |
| --- | --- |
| Team | `tanishq28` (slug `tanishq286`) — **Free** plan |
| Site name | `portfoliobuildersiev` |
| Site ID | `c0c8e5f5-be3a-458d-b2e3-7c92048806c3` |
| Source | GitHub `tanishq286/clean-sheet-sidekick`, branch `main` |

**Almost nothing lives in Netlify.** The build command, publish directory,
functions directory, edge-functions directory, the OG-image redirects and the
SPA fallback are all in `netlify.toml`, which is committed. A new site pointed
at this repo configures itself. Only four things are held outside the repo:

1. the three `VITE_SUPABASE_*` environment variables,
2. the custom domain,
3. the `portfoliobuildersiev` subdomain name,
4. the Supabase redirect allow-list (which names the domain, not the account).

> Netlify's free allowance resets at the start of each billing period.
> **Team → Usage** shows which resource ran out and when it comes back — if the
> reset is a few days away, waiting is less work than any of this.

### Option A — transfer the site (keeps everything, no downtime)

Preferred when your dashboard offers it, because the site ID, domain, deploy
history and env vars all come along: no DNS change, no Supabase change, and the
`.netlify.app` name is preserved.

- [ ] Create the new account at netlify.com using `founderid.help@gmail.com`.
- [ ] From the **old** team: Site settings → General → **Transfer site**, and
      pick the new team. Netlify requires you to be a member of both teams, so
      you may first need to invite one account to the other. Free teams cap the
      member count — if the invite is refused, that's the signal to use Option B.
- [ ] Confirm the site now appears under the new team, then trigger a deploy and
      re-run the checks in §7.3.

### Option B — rebuild on the new account (always works)

- [ ] **1. Create the account** at netlify.com with `founderid.help@gmail.com`.
- [ ] **2. Add new site → Import an existing project → GitHub**, authorise it,
      and pick `tanishq286/clean-sheet-sidekick`, branch `main`.
      Leave build command and publish directory as detected — `netlify.toml`
      already sets `npm run build` and `dist`.
      Accept whatever temporary name Netlify suggests; §7.2 renames it.
- [ ] **3. Set the environment variables** before the first deploy finishes
      (Site configuration → Environment variables). Copy the values from the
      repo's `.env`:

      | Key | Value |
      | --- | --- |
      | `VITE_SUPABASE_URL` | `https://ytymuqlajzmysujgrksc.supabase.co` |
      | `VITE_SUPABASE_PROJECT_ID` | `ytymuqlajzmysujgrksc` |
      | `VITE_SUPABASE_PUBLISHABLE_KEY` | the project's publishable key |

      ⚠️ Leave the scope as **"All scopes"**, not "Builds only".
      `netlify/edge-functions/profile-seo.ts` reads `VITE_SUPABASE_URL` and
      `VITE_SUPABASE_PUBLISHABLE_KEY` at *request* time. Scoped to builds only,
      the edge function silently stops prerendering JSON-LD — the pages still
      look fine in a browser, and every crawler stops seeing structured data.

      None of these are secrets: the publishable key is shipped to the browser
      and is safe in a public repo. RLS is what protects the data.
- [ ] **4. Deploy and test on the temporary URL** — work through §7.3 before
      touching the old site. Nothing is committed until the rename.

### 7.2 Reclaiming the `portfoliobuildersiev` name

`*.netlify.app` names are globally unique, so the new site cannot take the name
while the old site still holds it. Order matters:

- [ ] **1. Old site** → Site configuration → **Change site name** → something
      throwaway, e.g. `portfoliobuildersiev-old`. (Renaming, not deleting, keeps
      a way back for a few days.)
- [ ] **2. New site** → Change site name → `portfoliobuildersiev`.
- [ ] **3. Redeploy the new site.** `index.html` and `llms.txt` bake in the
      canonical host from Netlify's `URL` variable at build time, so they only
      pick up the new name on the *next* build.
- [ ] **4. Once the new site has served real traffic for a few days**, delete
      the old one. Leaving it live is what causes duplicate-content confusion.

If you are attaching `iev.mba` anyway (§6), the `.netlify.app` name stops
mattering — do §6 against the new site and skip this subsection.

### 7.3 Verify before switching the old site off

- [ ] `curl -s https://<new-site>.netlify.app/llms.txt | head -5` → Markdown,
      not the HTML shell.
- [ ] `curl -s https://<new-site>.netlify.app/u/yash-mishra | grep -c ld+json`
      → at least 1. **This is the check that catches a builds-only env-var
      scope**; the page renders fine either way.
- [ ] `curl -sI https://<new-site>.netlify.app/api/og?name=Test` → `200` and
      `content-type: image/png`. Proves the function bundled with its wasm.
- [ ] Open `/app` and sign in with **Google**. This fails until the next step —
      that is expected, and is the one thing a new domain always breaks.
- [ ] **Supabase → Authentication → URL Configuration** for project
      `ytymuqlajzmysujgrksc`: add the new origin to **Redirect URLs**
      (both `https://<host>` and `https://<host>/**`), and set **Site URL** to
      it once you're committed. Keep the old entries until the old site is
      deleted — extra redirect URLs are harmless.
- [ ] Retry Google sign-in, then publish/unpublish a profile to confirm writes.

### 7.4 Afterwards, in the repo

Two files carry the old host as a *fallback*, used only when neither `SITE_URL`
nor Netlify's `URL` is set — so builds on Netlify are already correct and this
is not urgent. Update them anyway once the final host is settled, or a local
`npm run build` will bake a canonical tag pointing at a site you deleted:

- `vite.config.ts:15`
- `scripts/generate-llms.mjs:39`

## 8. Verifying the app (automated)

Two commands. `verify` is the fast gate; `verify:full` adds a real browser.

```bash
npm run verify        # typecheck (tsc -b) + eslint + production build
npm run verify:full   # the above, then 73 browser checks
```

`verify:full` starts and stops its own preview server — a stale one silently
serving an old build had been producing results that looked real and weren't.

| Suite | Covers |
| --- | --- |
| `test:routes` | 12 public routes: blank screens, uncaught errors, failed same-origin requests, 390px overflow, expected content |
| `test:authed` | 25 signed-in checks: dashboard, editor, design, export, admin, college, plus the account-deletion and password-change gates |
| `test:templates` | all 36 designs: render, contrast, milestone toggle, portfolio drawer, Escape-close |

Notes:

- `npm run typecheck` runs `tsc -b`, **not** `tsc --noEmit`. The root tsconfig
  has `"files": []` with project references, so `--noEmit` type-checks nothing
  and always exits 0 — it once passed syntactically invalid JSX.
- `test:authed` stubs Supabase and injects a session, so it verifies the UI
  rather than the backend and runs with no network. Backend rules are covered
  by the RLS probes in `supabase/migrations/`.
- `test:routes` reports **SKIP**, not FAIL, for `/u/:slug` when the host cannot
  reach Supabase. A suite that cannot tell "app broken" from "no network here"
  is worse than none.
- First time on a machine: `npm install && npx playwright install chromium`.
  The browser is a separate download from the npm package.
- `Executable doesn't exist at …/chromium_headless_shell-<n>` means the npm
  package was upgraded past the browser build on disk. Either re-run
  `npx playwright install chromium`, or point at a browser you already have:
  `CHROMIUM_PATH=/path/to/chrome npm run preview:test`.
- The suites count their own assertions rather than hardcoding a total — the
  template sweep once reported 30/36 because the number was written by hand.
