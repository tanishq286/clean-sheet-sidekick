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
