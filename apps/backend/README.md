# Hoopscope Backend

NestJS backend-for-frontend (BFF) for [Hoopscope](../../README.md). Aggregates public ESPN and stats.nba.com data behind a resilient HTTP layer and streams historic game replays over Socket.IO.

## Development

```bash
npm run dev -w apps/backend
```

- API: [http://localhost:3000](http://localhost:3000)
- Swagger docs: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

## Environment

Copy `.env.example` to `.env`. All variables are optional and default to sensible local values; see the [root README](../../README.md#environment-variables) for the full table.

## Architecture

```
src/
├── espn/         # Global ESPN client: cache, dedupe, throttle, retry, stale fallback
├── nba-stats/    # Global stats.nba.com client (shot charts)
├── cache/        # In-process TTL cache
├── logging/      # pino logger + per-request correlation ids
├── teams/        # Teams, rosters, season player averages
├── players/      # Profiles, season/career stats, player news
├── games/        # Scoreboard, schedule, summaries + historic replay gateway
├── news/         # League news
├── standings/    # Conference standings with playoff seeding
├── shots/        # Shot heatmap data
└── health/       # Terminus health check
```

The core design decision is a **single resilient entry point** (`EspnService.fetchJson`) for every upstream call, layering:

1. Fresh-cache read
2. In-flight de-duplication (shared promise per cache key)
3. Global concurrency throttle + minimum gap between dispatches
4. Retry with exponential backoff and jitter (honoring `Retry-After`)
5. Stale-cache fallback when all retries fail

"Live" games are **historic play-by-play replays** streamed tick-by-tick by `SimulationService` through a Socket.IO gateway — not real-time NBA data.

## Logging

pino via `nestjs-pino`: JSON in production, `pino-pretty` elsewhere, level from `LOG_LEVEL`.

Every request gets an id (inbound `x-request-id` is reused, otherwise a UUID). The id is echoed in the `x-request-id` response header, returned as `requestId` in error bodies, and bound as `requestId` to every log line made while handling that request — including `EspnService` fetch and retry logs. Health probes are excluded from request logging.

## Data scripts

| Script | Description |
|--------|-------------|
| `npm run seed:historic-games -w apps/backend` | Seed historic play-by-play JSON |
| `npm run download:shot-heatmaps -w apps/backend` | Download per-player shot chart data |
| `npm run build:espn-nba-player-map -w apps/backend` | Build the ESPN ↔ NBA player ID map |

## Testing

```bash
npm run test -w apps/backend       # unit tests
npm run test:cov -w apps/backend   # with coverage
npm run test:e2e -w apps/backend   # e2e
```
