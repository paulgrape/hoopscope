# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Coverage thresholds for both workspaces, enforced in CI
- Security jobs on pull requests: dependency audit (`audit-ci`)
- Standalone CodeQL workflow (advanced setup) so code scanning can enable on
  the public repository
- Deployment configuration for Vercel (frontend) and Render (backend)
- `CHANGELOG.md`, `CODEOWNERS`, and `.nvmrc`
- `/.well-known/security.txt` disclosure endpoint referenced by `SECURITY.md`

### Security

- Resolved 11 advisories via in-range dependency upgrades, including a critical
  `shell-quote` issue and memory-exhaustion denial-of-service bugs in `ws` and
  `socket.io-parser` that affect the replay WebSocket path
- One remaining `js-yaml` advisory reachable only through `@nestjs/swagger` is
  allowlisted with a rationale and review trigger in
  [`audit-ci.jsonc`](audit-ci.jsonc)

### Changed

- README now leads with a live demo section, screenshots, and engineering highlights
- Node engine requirement pinned to `>=22`, matching CI and `.nvmrc`

### Fixed

- Removed stray `@nestjs/common` and `@nestjs/core` runtime dependencies from the
  workspace root; they belong to `apps/backend`
- Moved `shadcn` (a CLI) out of the frontend's production dependency graph
- Build-generated `llms.txt` / `llms-full.txt` are no longer tracked, so a build
  no longer dirties the working tree
- `apps/frontend/.env.example` is now committed. A blanket `.env*` ignore rule
  had been silently excluding it, so the `cp apps/frontend/.env.example ...`
  step in the setup instructions failed on a fresh clone
