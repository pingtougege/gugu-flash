# Sprint 01 - Backend Alpha And Release Gate

## Goal

Move Gugu Flash from browser-only localStorage prototype toward a backend-backed product by adding a first `/flash/**` HTTP runtime, a matching HTTP API client, and CI release gates.

## AI Team Decisions

Backend Lead:

- Use Node for Alpha because the repo is already ESM JavaScript and can directly reuse `packages/core`.
- Reuse `createMockFlashApi` as the behavioral oracle while the real repository layer is being built.

Frontend Lead:

- Add `createHttpFlashApi` first, then split `apps/web/src/app.js` and make API mode switchable.
- Keep mock mode as the default until HTTP mode passes existing browser flows.

QA Lead:

- Treat current tests as prototype guardrails, not release QA.
- Add CI now so every later iteration has a gate.

Product Owner:

- This sprint does not claim production readiness.
- It creates the bridge from prototype to real product delivery.

## Done In This Sprint

- Added `apps/backend` as Backend Alpha.
- Added `GET /flash/health`.
- Added HTTP routes for feed, works, drafts, IP pool, device dashboard, store listing, operator dashboard, hardware purchase/download/sync, and orders.
- Added `createHttpFlashApi` with facade methods matching current mock usage.
- Exported `createHttpFlashApi` from `packages/api-client`.
- Added `npm run dev:api`.
- Added `npm run dev:all` for Web + API integration.
- Added runtime state persistence for devices, orders, installs, comments, reports, claims, appeals, settlements, and operation logs.
- Extracted JSON persistence into `apps/backend/src/json-flash-store.js` as the first repository boundary.
- Added order and device entitlement repositories on the JSON store and routed Backend Alpha reads through them.
- Added comment repositories on the JSON store and routed Backend Alpha comment writes through them.
- Added block relation repositories on the JSON store and routed Backend Alpha block reads/writes through them.
- Added payment/refund callback repositories on the JSON store and routed provider callback events through them.
- Added governance repositories on the JSON store and routed report, rights claim, appeal, moderation action, and operation log reads through them.
- Added device install and sync job repositories on the JSON store and routed Backend Alpha diagnostic reads through them.
- Added API flow test that runs the Backend Alpha server on a random local port.
- Added restart persistence test for Backend Alpha runtime state.
- Added release-risk HTTP tests for delist behavior and low-battery sync failure diagnostics.
- Added optional auth/role enforcement for user and operator routes.
- Added persisted Backend Alpha sessions with login, refresh, logout, and revoked-token tests.
- Added route-level Auth/RBAC policy, invite-protected non-creator role issuance, required-auth demo-token shutdown, and role-specific denied-route tests.
- Added signed external identity token bridge, issuer/audience/expiry validation, and identity-provider readiness gate.
- Added first production database schema draft in `apps/backend/db/schema.sql`.
- Added backend persistence contract, schema coverage verifier, and machine-checked persistence readiness gate.
- Added Backend Alpha route coverage table and tests so shared API contract routes do not silently 404.
- Added HTTP client methods for baseline read, operator list, device entitlement/install, asset, draft, and hardware export routes.
- Added Playwright HTTP-mode test for Web -> Backend Alpha integration.
- Added machine-checked review/governance SOP coverage and policy-bound operator action validation.
- Added machine-checked closed-beta support readiness, ticket macros, and escalation matrix coverage.
- Added HTTP Alpha security headers, request body size limit, and machine-checked security readiness coverage.
- Added request correlation, operator ops metrics, status-code counters, alert inputs, alert evaluator, and machine-checked monitoring readiness coverage.
- Added deployment readiness probe, production deployment runbook, rollback checklist, and machine-checked deployment readiness coverage.
- Added Alpha JSON backup/restore utility, checksum validation, and automated backup/restore drill.
- Added moderation staffing model, queue coverage, escalation matrix, and machine-checked moderation staffing readiness coverage.
- Added HTTP-mode coverage for comments, governance, refund revoke, rights freeze, write-failure sync, and retry sync.
- Added `DeviceSyncEvidence` and fake BLE transport contract validation for sync diagnostics.
- Added real device matrix plan, required case IDs, evidence checklist, and machine-checked readiness coverage.
- Added payment provider replay matrix, external acceptance checklist, and machine-checked readiness coverage.
- Added native app distribution plan, store-review checklist, release-channel acceptance checklist, and machine-checked readiness coverage.
- Added official free launch HardwarePack manifest, payload checksum validation, support handoff, and machine-checked launch content readiness coverage.
- Added payment provider callback route with HMAC signature validation, success/failure handling, and `providerEventId` idempotency tests.
- Added refund provider callback route with `providerEventId` idempotency tests.
- Added CI workflow for unit and Playwright smoke.
- Gated GitHub Pages deploy on unit and Playwright smoke passing.

## Next Slice

### P0

- Move comments runtime state behind repository-style interfaces and start replacing mock write paths.
- Add auth/session and permission enforcement for write routes.
- Connect a real payment sandbox and replay pay/refund callback signatures against the Alpha contracts.
- Capture the real Circle 185 device matrix BLE sessions and hardware lead signoff.
- Build signed iOS/Android internal releases and complete store-review packet signoff.
- Add a production database plan and first migration for core entities.
- Replace Alpha stubs in `BACKEND_ALPHA_STUB_ROUTE_IDS` with real persistence one area at a time.

### P1

- Split `apps/web/src/app.js` into `main`, `api`, `state`, `router`, `dom`, and page modules.
- Add centralized error, busy, and retry UI.
- Add XSS-safe rendering helpers for UGC data.

### P2

- Introduce repository interfaces behind Backend Alpha.
- Persist devices/orders/comments/governance state, not only packs.
- Generate an OpenAPI-like route manifest from `FLASH_API_ROUTES`.

## Verification

Required before ending the sprint:

```bash
npm test
npm run test:e2e
```
