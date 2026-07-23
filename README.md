# Clean Sheet Sidekick

A pitch-dark, production-grade **Fantasy Premier League** dashboard that forecasts
**clean-sheet probabilities** across upcoming gameweeks, overlays bookmaker-style
market odds, and helps you plan budget-defender rotations.

Built with **Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
shadcn-style UI · Framer Motion · TanStack Query v5**.

---

## Features

- **Clean Sheet Heatmap Matrix** — teams down the rows, gameweeks across the columns,
  every fixture colour-coded by clean-sheet probability with animated cells, sticky
  team column, and horizontal scroll on mobile.
- **Model vs Market toggle** — switch between the Poisson xGC model and an odds-implied
  (de-vigged) market overlay.
- **Defender Rotation Finder** — pick up to four defenders and get the optimal ones to
  start each gameweek, with expected-clean-sheet coverage.
- **Interactive filters** — price range, team, home/away, and Fixture Difficulty Rating.
- **Live gameweek deadline countdown** in a sticky header, with auto-refresh on expiry.
- **One-click export** to CSV and PNG.
- **Resilient by design** — server-side API proxies with caching, and a full mock
  dataset fallback so the UI **never renders blank**, even when the FPL API is
  rate-limited, blocked, or offline.
- **Error boundaries + Suspense skeletons + toast notifications** throughout.

## Architecture

```
app/
  api/fpl/route.ts     Server proxy for the FPL API (caching + mock fallback)
  api/odds/route.ts    Server proxy for the clean-sheet odds overlay
  layout.tsx           Root layout, metadata, providers
  page.tsx             Dashboard entry
  loading.tsx          Suspense skeleton
  error.tsx            Route error boundary
  global-error.tsx     App-level error boundary
  globals.css          Tailwind v4 theme (pitch-dark, glassmorphism, emerald accents)
components/
  ui/                  shadcn-style primitives (button, card, dialog, drawer, …)
  features/            HeatmapMatrix, RotationPlanner, TeamCard, OddsToggle, Filters, …
lib/
  fpl-api.ts           Server-side FPL fetch + transform (+ graceful fallback)
  odds-source.ts       Odds overlay source (bookmaker hook + model fallback)
  odds-calculator.ts   Poisson xGC clean-sheet model + odds helpers
  clean-sheet.ts       Pure matrix builders + odds merge
  rotation.ts          Rotation-planner optimiser
  mock-data.ts         20-team resilient mock dataset
  types.ts             Strict domain + API types (no `any`)
  hooks.ts             TanStack Query hooks
```

## How the clean-sheet model works

For each fixture we estimate expected goals conceded (xGC) from the FPL strength
ratings — scaling by the opponent's attack, the team's own defence, and a home/away
adjustment — then treat goals conceded as a Poisson process:

```
P(clean sheet) = P(0 conceded) = e^(-xGC)
```

The market overlay converts (mock or live) decimal odds into implied probabilities and
removes the bookmaker margin (de-vig) so the two outcomes sum to 1.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build (zero type/lint errors)
npm run start    # serve the production build
npm run lint     # eslint
npm run typecheck
```

### Optional environment variables

| Variable        | Purpose                                                            |
| --------------- | ----------------------------------------------------------------- |
| `ODDS_API_KEY`  | Enables a live bookmaker odds feed. Falls back to the model overlay when unset. |

No key is required — the app is fully functional offline via the mock dataset.

## Data & disclaimer

Fixture and strength data come from the public Fantasy Premier League API. Clean-sheet
probabilities are model estimates for entertainment/analysis, **not betting advice**.
