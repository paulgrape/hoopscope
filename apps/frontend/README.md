# Hoopscope Frontend

Next.js 16 (App Router) frontend for [Hoopscope](../../README.md) — scores, standings, teams, players, shot heatmaps, news, and historic game replays.

## Development

From the repo root (starts backend + frontend):

```bash
npm run dev
```

Or just this workspace (requires the backend on port 3000):

```bash
npm run dev -w apps/frontend
```

Open [http://localhost:3001](http://localhost:3001).

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (also used for the Socket.IO replay connection) |
| `API_URL` | Optional server-side backend URL override |
| `NEXT_PUBLIC_SITE_URL` | Absolute URL base for SEO (sitemap, OG, JSON-LD) |
| `GTM_ID` | Google Tag Manager ID (loaded in production only) |

## Structure

```
src/
├── app/            # App Router: (hub) route group, api/ proxies, SEO routes
├── components/     # Feature components (grouped) + ui/ primitives (shadcn/Base UI)
└── lib/            # API client, domain *-api modules, SEO, analytics, utils
```

Key patterns:

- **RSC-first** — pages are async Server Components fetching from the backend; client components (`'use client'`) only for interactivity (theme, consent, polling, replay simulator)
- **Single API client** — `src/lib/api-client.ts` owns base-URL resolution; domain modules (`teams-api`, `games-api`, ...) build on it
- **BFF proxies** — `app/api/games/*` route handlers proxy client-side refreshes to the backend
- **Tailwind CSS v4** — CSS-first theme in `app/globals.css`, dark mode via `next-themes`

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Generate llms.txt, then production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test` | Vitest + React Testing Library |
