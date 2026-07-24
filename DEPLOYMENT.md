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
- [ ] **Environment variables** (Site settings → Environment variables):

      | Key                              | Value                                                        |
      | -------------------------------- | ------------------------------------------------------------ |
      | `VITE_SUPABASE_URL`              | `https://lnhsiiqbkoncatxlriss.supabase.co`                   |
      | `VITE_SUPABASE_PUBLISHABLE_KEY`  | the project's anon / publishable key (also in the repo `.env`) |

      Optional (leave unset unless you use them): `VITE_SUPABASE_PROJECT_ID`,
      `VITE_PROFILE_DOMAIN`, `VITE_HABITS_API_BASE`.

- [ ] After changing settings, **Deploys → Trigger deploy → Clear cache and
      deploy site**, then hard-refresh the browser.

## 3. Supabase — required for Google sign-in on this domain ⚠️

Google/OAuth login only works on domains that are explicitly allow-listed.
In the Supabase dashboard for project `lnhsiiqbkoncatxlriss`:

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
