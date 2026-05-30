# Gugu Flash AI Team Operating System

This document defines how the AI project team will operate like a real product team while pushing Gugu Flash from prototype to released product.

## 0. Rebuilt Creation Organization

The AI text-game creation team has been rebuilt under the machine-readable roster in:

```text
data/ai-creation-team-roster.json
```

Rules:

- Every required squad must have at least 3 named members.
- The roster must cover product strategy, narrative design, game systems, AI prompt/model ops, frontend experience, backend platform, safety/rights/moderation, native/hardware, commerce/support/ops, QA/release, and content operations.
- `scripts/check-ai-creation-maturity.mjs` is the executable takeover check for team coverage, creation quality gates, showcase content, and route-contract health.
- No squad may mark its area mature unless the related signal appears in tests, readiness packets, or explicit external signoff.

## 1. Command Structure

### Product Owner

Role:

- Own product direction, MVP scope, release gates, and tradeoffs.
- Decide when teams disagree.
- Keep the project moving without waiting for ad hoc next-step confirmation.

Current priority:

- Turn the current Mock/Web prototype into a backend-backed, test-gated, device-ready product.

### AI Technical Lead

Role:

- Own architecture across Web, API, Native, hardware sync, data model, and tests.
- Keep shared rules in `packages/core`.
- Keep clients behind `packages/api-client`.

Current priority:

- Move from localStorage mock to `/flash/**` HTTP API.

### AI Backend Lead

Role:

- Own `/flash/**` API, persistence, auth/session, permissions, orders, review, device entitlements, and operator workflows.

Current priority:

- Evolve `apps/backend` from Alpha mock-backed HTTP server to real repository/service layers.

### AI Frontend Lead

Role:

- Own Web/H5 client, share pages, creator, store, IP community, and operator UI.

Current priority:

- Split `apps/web/src/app.js` into API, state, router, page modules, and components.

### AI Native And Hardware Lead

Role:

- Own app-side device binding, BLE/sync, device capability checks, checksum, install, retry, and rollback.

Current priority:

- Define the first real-device sync contract and test matrix before implementation.

### AI Trust And Safety Lead

Role:

- Own content review, rights claims, reports, appeals, minor protection, comments, blocks, and takedowns.

Current priority:

- Turn prototype governance states into operator-ready review SOP and API requirements.

### AI QA And Release Lead

Role:

- Own CI, automated regression, release checklist, test evidence, and launch gates.

Current priority:

- Make `npm test` and Playwright smoke mandatory for CI and Pages deploy.

### AI Content And Ops Lead

Role:

- Own official starter content, IP pool quality, seed creators, help center, and launch operations.

Current priority:

- Prepare official free HardwarePack candidates and internal beta workflows.

## 2. Decision Rules

- Product safety beats feature breadth.
- Shared backend/API rules beat client-only shortcuts.
- H5 publishing, store listing, hardware packaging, and device install remain separate lifecycles.
- Device entitlements stay scoped to `deviceId + hardwarePackId`.
- User UGC can create H5; official tooling adapts hardware content.
- MVP excludes real co-creation, creator cash-out, complex personalization, and full mini program parity.

## 3. Weekly Cadence

### Monday Planning

Output:

- Sprint goal.
- P0/P1 task list.
- Explicit non-goals.
- Risk owner for each launch blocker.

### Wednesday Integration Review

Output:

- API and Web integration status.
- Test failures and flaky tests.
- Cross-team blockers.
- Demoable increment.

### Friday Demo And Gate

Output:

- Working demo.
- Test evidence.
- Risk delta.
- Next sprint carryover.

### Release Blocker Review

Source:

```text
docs/release-readiness.json
docs/release-blocker-backlog.md
```

Rule:

- Every `blocked` or `in_progress` gate item must have an owner and required evidence.
- AI leads should pull work from the blocker backlog before adding non-critical polish.
- A gate item can only move to `ready` after the evidence exists in the repo or in verified external release systems.

## 4. Daily AI Team Loop

Each work cycle follows this loop:

1. Product Owner picks the next highest-impact release blocker.
2. Relevant AI leads inspect code and docs.
3. Technical Lead chooses the smallest shippable slice.
4. Implementation happens in repo files.
5. QA runs tests and updates the release risk list.
6. Product Owner records what changed and the next target.

## 5. Current Sprint

Sprint name:

```text
Sprint 01 - Backend Alpha And Release Gate
```

Goal:

```text
Make Gugu Flash callable through backend-shaped /flash HTTP APIs and protect that path in CI.
```

In scope:

- Backend Alpha HTTP server.
- HTTP API client adapter.
- API flow test.
- CI unit and Playwright smoke.
- Pages deploy gated by tests.
- Web API mode switch next.

Out of scope:

- Real auth provider.
- Production database.
- Payment provider.
- Native BLE implementation.
- Full frontend refactor.

## 6. Release Gates

Internal prototype gate:

- `npm test` passes.
- `npm run test:e2e` passes.
- Web prototype main flows pass locally.
- Backend Alpha health and critical API flow pass.

Closed beta gate:

- Real auth and permissions.
- Backend persistence beyond packs.
- Operator review actions with audit logs.
- Device sync contract tested against at least one real device.
- Payment sandbox or explicit free-only scope.

Public MVP gate:

- Production deployment and monitoring.
- Content review and rights complaint SOP live.
- Refund/takedown/sync failure paths verified.
- Customer support and rollback plan ready.
- Legal terms approved.
