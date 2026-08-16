<!-- Banner: docs/screenshots/banner.png (1200×300, 4:1). -->
<p align="center">
  <img src="docs/screenshots/banner.png" alt="Hoopscope — live scores, standings, shot heatmaps, and historic game replays" width="100%" />
</p>

# Hoopscope

[![CI](https://github.com/paulgrape/nba-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/paulgrape/nba-hub/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org)

Pro basketball hub: live scores, standings, teams, player profiles, shot heatmaps, news, and play-by-play replays of historic NBA games.

Built as a full-stack TypeScript monorepo: a **Next.js 16** frontend backed by a **NestJS** backend-for-frontend (BFF) that aggregates public ESPN and stats.nba.com data with a resilient HTTP layer (caching, request de-duplication, retry with backoff, stale-data fallback).

## Live demo

<!-- TODO: fill in after the first deploy (see Deployment below). -->

| Surface  | URL                |
| -------- | ------------------ |
| Web app  | _not yet deployed_ |
| API docs | _not yet deployed_ |

> The backend is intended for a free hosting tier, so the first request after a
> period of inactivity may take a few seconds to cold-start.

## Screenshots

| Match center | Historic replay |
| --- | --- |
| ![Match center](docs/screenshots/match-center.png) | ![Replay](docs/screenshots/replay.gif) |

| Shot heatmap | Standings |
| --- | --- |
| ![Shot heatmap](docs/screenshots/shot-heatmap.png) | ![Standings](docs/screenshots/standings.png) |

## Features

- **Match center** — daily scoreboard and per-game summaries with box scores
- **Historic game replays** — play-by-play streamed over WebSocket (Socket.IO), simulating a live game
- **Teams** — rosters, season player averages, team detail pages
- **Players** — profiles, season and career stats, injuries, player news
- **Shot heatmaps** — per-player shot charts vs. league-wide zone averages
- **Standings** — conference standings with playoff / play-in seeding
- **News** — paginated league news feed with RSS output
- **SEO / analytics** — JSON-LD structured data, sitemap, robots, OG metadata, GTM with Consent Mode and a cookie banner

## Architecture

```mermaid
flowchart LR
  Browser --> NextJS["Next.js 16 (RSC + client islands)"]
  NextJS -->|"server-side fetch"| Nest["NestJS BFF"]
  NextJS -->|"/api/* proxy (client refresh)"| Nest
  Browser -->|"Socket.IO (historic replays)"| Nest
  Nest --> Cache["In-memory TTL cache"]
  Nest --> ESPN["ESPN public APIs"]
  Nest --> NBA["stats.nba.com"]
```

- **Frontend** (`apps/frontend`) — App Router, React Server Components first; client components only where interactivity is needed (theme, cookie consent, live polling, replay simulator). Domain API modules in `src/lib` share a single typed API client.
- **Backend** (`apps/backend`) — thin domain modules (teams, players, games, news, standings, shots) over two global data-source services:
  - `EspnService` — single resilient entry point for every ESPN call: fresh-cache read, in-flight de-duplication, concurrency throttling, retry with exponential backoff and jitter, stale-cache fallback.
  - `NbaStatsService` — shot chart data from stats.nba.com with the same cache/fallback strategy.
- **Replays** — historic play-by-play is seeded to JSON and streamed tick-by-tick via a Socket.IO gateway.

## Engineering highlights

The interesting problems in this codebase, and how they were solved:

**Surviving flaky third-party APIs.** ESPN and stats.nba.com are undocumented,
unversioned, and rate-limited without notice. Every upstream call goes through
one layered path in `EspnService`: fresh-cache read → in-flight request
de-duplication → concurrency throttle → retry with exponential backoff and
jitter (honouring `Retry-After`) → stale-cache fallback → circuit breaker. The
practical result is that an ESPN outage degrades the site to slightly stale data
instead of taking it down. The retry, breaker, and stale-fallback paths are unit
tested by driving real 500/429/503 and network failures.

**Liveness that does not cascade.** `/health/live` deliberately checks only the
process heap while `/health/ready` also checks ESPN reachability. Folding the
upstream check into liveness would let a third-party outage trigger an infinite
restart loop — a failure mode that is easy to ship and painful to debug.

**A single-instance decision, made explicitly.** The response cache, replay
sessions, and rate limiter are all in-process, so the backend is scoped to one
replica and that constraint is documented in `render.yaml`, `docker-compose.yml`,
and below. Choosing a constraint and writing it down beats discovering it in
production.

**Server-first rendering with narrow client islands.** Pages are React Server
Components; client components are limited to what genuinely needs interactivity
(theme, cookie consent, schedule polling, the replay simulator). Each domain has
a typed API module over one shared fetch client with per-resource ISR windows.

**Replay as a state-machine UI.** Historic games stream tick-by-tick over
Socket.IO with transport controls (play/pause, seek, pace). The timeline is a
keyboard-operable `role="slider"` and score changes are announced via
`aria-live`, so the most dynamic screen is also the most accessible one.

## Tech stack

| Layer    | Technologies                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/Base UI, next-themes, socket.io-client                                   |
| Backend  | NestJS 11, TypeScript, Axios, Socket.IO, Swagger, Throttler, Terminus                                                              |
| Tooling  | npm workspaces, ESLint 9, Prettier, Jest, Vitest + React Testing Library, Husky + lint-staged + commitlint, GitHub Actions, Docker |

## Monorepo layout

```
nba-hub/
├── apps/
│   ├── frontend/   # Next.js app (port 3001), vercel.json
│   └── backend/    # NestJS API (port 3000, Swagger at /api/docs), Dockerfile
├── docs/           # screenshots used by this README
├── .github/        # CI workflow, PR/issue templates, dependabot, CODEOWNERS
├── docker-compose.yml
├── render.yaml     # backend deployment blueprint
└── package.json    # npm workspaces root
```

## Getting started

### Prerequisites

- Node.js >= 22 (see [`.nvmrc`](.nvmrc); CI runs the same version)
- npm >= 10

### Setup

```bash
git clone https://github.com/paulgrape/nba-hub.git
cd nba-hub
npm install

# environment
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# run both apps (backend :3000, frontend :3001)
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). Swagger API docs are at [http://localhost:3000/api/docs](http://localhost:3000/api/docs).

### Docker (backend)

```bash
docker compose up --build
```

Runs the backend in a container on port 3000; run the frontend locally with `npm run dev -w apps/frontend`.

## Environment variables

Backend variables are validated at startup, so a malformed value fails the boot with a clear message instead of surfacing later as a runtime error.

### Backend (`apps/backend/.env`)

| Variable                                                                                                      | Default                 | Description                            |
| ------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------- |
| `PORT`                                                                                                        | `3000`                  | HTTP port                              |
| `FRONTEND_URL`                                                                                                | `http://localhost:3001` | Allowed CORS origin (HTTP + WebSocket) |
| `HISTORIC_GAME_TICK_MS`                                                                                       | `1000`                  | Replay tick interval                   |
| `LOG_LEVEL`                                                                                                   | `info` (prod), `debug`  | pino level: `trace`…`fatal`, `silent`  |
| `ESPN_BASE_URL`, `ESPN_WEB_API_BASE_URL`, `ESPN_CORE_BASE_URL`, `ESPN_NOW_API_URL`, `ESPN_STANDINGS_BASE_URL` | ESPN defaults           | Override upstream API bases            |
| `ESPN_RETRY_ATTEMPTS`                                                                                         | `3`                     | Retry attempts per upstream call       |
| `ESPN_RETRY_BASE_DELAY_MS` / `ESPN_RETRY_MAX_DELAY_MS`                                                        | `500` / `8000`          | Backoff window                         |
| `ESPN_MAX_CONCURRENCY`                                                                                        | `5`                     | Max concurrent upstream requests       |
| `ESPN_REQUEST_GAP_MS`                                                                                         | `0`                     | Minimum gap between dispatches         |

### Frontend (`apps/frontend/.env.local`)

| Variable               | Default                 | Description                                              |
| ---------------------- | ----------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:3000` | Backend URL (also used for Socket.IO)                    |
| `API_URL`              | —                       | Server-side backend URL override (e.g. internal network) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3001` | Absolute URL base for SEO                                |
| `GTM_ID`               | —                       | Google Tag Manager container ID (production only)        |

## Scripts

Run from the repo root:

| Script                                              | Description                             |
| --------------------------------------------------- | --------------------------------------- |
| `npm run dev`                                       | Start backend and frontend concurrently |
| `npm run build`                                     | Build both workspaces                   |
| `npm run test`                                      | Run test suites in both workspaces      |
| `npm run lint -w apps/backend` / `-w apps/frontend` | Lint a workspace                        |

Backend data scripts (run with `-w apps/backend`): `seed:historic-games`, `download:shot-heatmaps`, `build:espn-nba-player-map`.

## Deployment

Deployment is handled by platform-native pipelines; GitHub Actions provides the quality gate (lint, typecheck, test with coverage, build, audit, CodeQL) on every pull request.

- **Frontend — Vercel**: import the repo and set the root directory to `apps/frontend`; [`vercel.json`](apps/frontend/vercel.json) supplies the framework, install, and build commands. Configure `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, and (optionally) `GTM_ID`.
- **Backend — Render**: [`render.yaml`](render.yaml) is a blueprint — point Render at the repo and it provisions the Web Service, health check, and env vars. Set `FRONTEND_URL` to the Vercel origin (it gates both HTTP CORS and Socket.IO) plus any `ESPN_*` overrides.

The two are mutually dependent on first deploy: the backend needs `FRONTEND_URL` and the frontend needs `NEXT_PUBLIC_API_URL`. Deploy the backend first, then the frontend, then update `FRONTEND_URL` and redeploy the backend.

### Backend runs as a single instance

The response cache, replay sessions, and rate limiter all live in process memory, so the backend is deliberately scoped to **one replica**. Running several would split replay state across processes and multiply the effective rate limit. Moving past one replica requires a shared cache and a Socket.IO Redis adapter first.

### Health probes

| Endpoint        | Checks                      | Use for                                       |
| --------------- | --------------------------- | --------------------------------------------- |
| `/health/live`  | Process heap only           | Liveness — an ESPN outage must not restart it |
| `/health/ready` | Heap plus ESPN reachability | Readiness and traffic gating                  |
| `/health`       | Alias of `/health/ready`    | Backwards compatibility                       |

## Testing

```bash
npm run test                      # both workspaces
npm run test -w apps/backend      # Jest unit tests
npm run test:cov -w apps/backend  # with coverage thresholds
npm run test:e2e -w apps/backend  # Jest e2e
npm run test -w apps/frontend     # Vitest + React Testing Library
npm run test:cov -w apps/frontend # with coverage thresholds
```

250 tests across the two workspaces (100 Jest, 150 Vitest). Both suites enforce
coverage thresholds in CI, so a regression in covered code fails the build.

## Roadmap

- Runtime response validation (Zod) at the API boundaries, replacing structural casts
- Per-connection limits on replay WebSocket sessions
- Extract the shared schedule-state hook behind the match center and scoreboard
- Replace the in-process TTL cache with Redis for multi-instance deployments
- Real-time NBA game data (current "live" mode replays historic play-by-play)
- E2E browser tests (Playwright)

## Data sources & disclaimer

This project consumes **unofficial, public** ESPN and stats.nba.com endpoints for educational/portfolio purposes. It is not affiliated with, endorsed by, or sponsored by the NBA, ESPN, or any of their partners. Upstream endpoints may change or rate-limit without notice; the backend degrades gracefully by serving stale cached data when possible.

## License

[MIT](LICENSE) © Pavel Vinogradov
