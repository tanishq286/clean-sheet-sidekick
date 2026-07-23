## Problem

- In the Lovable editor (iframe), Google sign-in uses a popup + `web_message` flow and works.
- When the live preview is opened directly in a browser tab, the broker uses a full-page redirect. After Google completes, the browser lands back on `/auth` with no session — meaning either `/auth/callback` is never reached, or the tokens/code in the URL never become a session, so `AuthCallback` falls back to `/auth`.

## Likely root cause

Two things compound:

1. `redirect_uri` is set to `${window.location.origin}/auth/callback`. The Lovable OAuth broker’s default allowlist for a project is the origin itself, and on full-page redirects the broker can normalize back to the registered origin — so tokens land on `/` (Landing), not `/auth/callback`. Landing then renders without ever hydrating the session from the URL because `useAuth` only runs hydration once at mount and the tokens-in-hash arrive after the redirect.
2. Even when the URL does carry `#access_token=…` or `?code=…`, `Auth.tsx` short-circuits with `if (user) return <Navigate to="/app" replace />;` but never *triggers* hydration itself. If the redirect happens to land on `/auth` (e.g. because the user opened the tab there), the hash is dropped on the `Navigate` and the session is lost.

## Fix plan

1. **Use the broker-safe redirect target.** Change Google `redirect_uri` to `window.location.origin` (root) — this is what the managed broker reliably accepts on full-page redirects and on custom domains.

2. **Move OAuth URL hydration to a top-level effect that runs on every public route.** Create a small `OAuthRedirectHandler` mounted inside `AuthProvider` (or run inside `AuthProvider` itself) that:
   - On mount and on every `location` change, checks for `access_token` / `refresh_token` / `code` / `error` in the URL hash or query.
   - If present, calls `hydrateSessionFromRedirectUrl()`, clears the URL, and navigates to `consumePostAuthRedirect()` (default `/app`).
   - This makes Landing (`/`), `/auth`, and `/auth/callback` all able to complete the handoff — so it doesn’t matter which path the broker returns to.

3. **Stop `Auth.tsx` from racing the hydration.** Replace the immediate `if (user) <Navigate to="/app" />` with: if the URL contains OAuth params, render a “Finishing sign-in…” state and let the top-level handler run; otherwise behave as today.

4. **Keep `/auth/callback` as a fallback** (no behavior change) so any link that points there still works.

5. **Verify.**
   - Open the live preview URL directly in a browser tab, click “Continue with Google”, complete sign-in, and confirm the tab lands on `/app` with a session.
   - Re-check the editor iframe flow still works (popup + `web_message`).
   - Check console/network for any `exchangeCodeForSession` errors.

## Files to touch

- `src/pages/Auth.tsx` — change `redirect_uri` to `window.location.origin`; add OAuth-params guard before the `Navigate`.
- `src/hooks/useAuth.tsx` (or a new `src/components/OAuthRedirectHandler.tsx` rendered inside `AuthProvider`) — run `hydrateSessionFromRedirectUrl` whenever the URL carries OAuth params, then navigate to the remembered destination.
- No DB or backend changes.

## What I will NOT change

- The Lovable-managed OAuth broker config, Supabase auth settings, or `src/integrations/lovable/*` (auto-generated).
- The email/password flow.
