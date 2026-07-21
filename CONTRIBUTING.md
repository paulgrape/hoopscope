# Contributing to Hoopscope

Thanks for your interest in contributing! This document covers the workflow and conventions used in this repository.

## Getting started

```bash
git clone https://github.com/paulgrape/nba-hub.git
cd nba-hub
npm install
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local
npm run dev
```

- Backend: [http://localhost:3000](http://localhost:3000) (Swagger at `/api/docs`)
- Frontend: [http://localhost:3001](http://localhost:3001)

## Branching

- Create feature branches off `main`: `feat/<short-description>`, `fix/<short-description>`, `chore/<short-description>`
- Keep branches focused — one logical change per pull request

## Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint via a `commit-msg` hook:

```
<type>(<optional scope>): <description>

feat(frontend): add player search page
fix(backend): handle empty ESPN scoreboard response
chore: bump dependencies
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `perf`.

## Quality gates

Git hooks (installed automatically via `npm install` / Husky):

- **pre-commit** — lint-staged runs ESLint and Prettier on staged files
- **commit-msg** — commitlint validates the commit message

CI (GitHub Actions) runs on every pull request and must pass before merge:

- Lint, typecheck, tests, and build for both workspaces

Run locally before pushing:

```bash
npm run lint -w apps/backend
npm run lint -w apps/frontend
npm run test
npm run build
```

## Code style

- TypeScript everywhere; avoid `any` where practical
- Formatting is owned by Prettier (each workspace has its own config) — don't hand-format
- Frontend: prefer React Server Components; add `'use client'` only when interactivity is required
- Backend: keep domain modules thin; shared upstream logic lives in `EspnService` / `NbaStatsService`

## Pull requests

1. Ensure CI is green and the PR template checklist is complete
2. Describe **what** changed and **why**; link related issues
3. Include screenshots for UI changes
4. Keep PRs small enough to review in one sitting
