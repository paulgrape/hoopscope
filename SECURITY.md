# Security Policy

## Supported versions

Only the latest version on the `main` branch is supported with security updates.

| Version       | Supported |
| ------------- | --------- |
| `main`        | Yes       |
| anything else | No        |

## Reporting a vulnerability

Please **do not open a public issue** for security vulnerabilities.

Instead, report privately via one of:

- GitHub's [private vulnerability reporting](https://github.com/paulgrape/hoopscope/security/advisories/new) for this repository
- Email: vin.pavel13@gmail.com (include "SECURITY" in the subject)

Please include:

- A description of the vulnerability and its impact
- Steps to reproduce (proof of concept if possible)
- Affected component (`apps/frontend`, `apps/backend`, or tooling)

You can expect an acknowledgement within 72 hours and a status update within 7 days. Please allow a reasonable disclosure window before publishing details.

## Scope

In scope:

- The NestJS API (`apps/backend`): injection, SSRF via upstream URL overrides, denial of service, data exposure
- The Next.js app (`apps/frontend`): XSS, CSP bypasses, sensitive data leaks
- CI/CD and dependency supply-chain issues in this repository

Out of scope:

- Vulnerabilities in third-party upstream services (ESPN, stats.nba.com)
- Rate limiting of public, read-only endpoints beyond the configured throttler
- Issues requiring physical access or compromised developer machines

## Dependency policy

- Dependencies are monitored via Dependabot and updated regularly
- `npm audit` findings of high or critical severity are addressed before release
