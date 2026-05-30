# Gugu Flash Backend Alpha

This app is the first backend-shaped runtime for Gugu Flash.

It intentionally reuses the current shared mock facade so Web, Native, Mini Program, and Operator clients can begin integrating against real `/flash/**` HTTP routes before the production database and service stack are finalized.

## Run

```bash
npm run dev:api
```

Default URL:

```text
http://127.0.0.1:4188/flash/health
```

Deployment readiness URL:

```text
http://127.0.0.1:4188/flash/ready
```

Run Web and API together:

```bash
npm run dev:all
```

Open the Web app in HTTP mode:

```text
http://127.0.0.1:4177/apps/web/?api=http&apiBase=http%3A%2F%2F127.0.0.1%3A4188
```

Development data is persisted to:

```text
.gugu-flash-api/packs.json
.gugu-flash-api/runtime-state.json
```

Set `GUGU_FLASH_API_DATA` to use another JSON file.
Set `GUGU_FLASH_API_STATE` to use another runtime state file.
Set `GUGU_FLASH_CORS_ORIGIN` to restrict the allowed Web origin outside local development.
Set `GUGU_FLASH_PAYMENT_CALLBACK_SECRET` before replaying payment provider callbacks.

The JSON store implementation lives in:

```text
apps/backend/src/json-flash-store.js
```

This is the repository boundary that will later be replaced by the production database layer.
It now exposes first-cut repositories for `orders`, `deviceEntitlements`, `deviceInstalls`, `deviceSyncJobs`, `reports`, `rightsClaims`, `appeals`, `moderationActions`, and `operationLogs` so read routes can move off raw runtime-state access before the full database layer lands.

Production deployment readiness is tracked in:

```text
docs/production-deployment-runbook.md
docs/deployment-readiness.json
scripts/check-deployment-readiness.mjs
```

## Auth Gate

Development mode is permissive by default so the Web prototype can keep moving.
To test permission enforcement:

```bash
GUGU_FLASH_REQUIRE_AUTH=1 npm run dev:api
```

Demo bearer tokens:

```text
demo-user      -> creator
demo-reviewer  -> reviewer
demo-operator  -> operator
demo-hardware  -> hardware_operator
demo-admin     -> super_admin
```

HTTP clients can also pass the token via `createHttpFlashApi({ token })` or Web config:

```text
?api=http&apiBase=http%3A%2F%2F127.0.0.1%3A4188&apiToken=demo-user
```

Operator routes under `/flash/operator/**` require an operator-capable role when auth is enforced.

Backend Alpha also supports persisted development sessions:

```text
POST /flash/auth/login
POST /flash/auth/refresh
POST /flash/auth/logout
GET  /flash/session
```

`login` returns an `accessToken` and `refreshToken`; `refresh` rotates both tokens; `logout` revokes the session in `.gugu-flash-api/runtime-state.json`.

## Scope

Current Alpha responsibilities:

- shared response envelope `{ code, message, data }`
- `/flash/feed`, `/flash/works/:id`
- draft creation and publishing
- IP pool and zone application routes
- device dashboard and store lifecycle routes
- operator dashboard and listing advancement routes
- order, purchase, download, and sync routes

Not production-ready yet:

- real authentication and permissions
- database persistence for every entity
- object storage and uploads
- payment gateway integration
- real BLE/device transport

## Production Database Boundary

The first relational schema draft lives at:

```text
apps/backend/db/schema.sql
```

Backend Alpha still uses JSON persistence so product flows can move quickly, but the schema fixes the entity boundary for the production service layer.

## Route Coverage

Backend Alpha route coverage is tracked in:

```text
apps/backend/src/alpha-route-coverage.js
```

The coverage test requires every route in `FLASH_API_ROUTES` to be classified as available in Backend Alpha. Routes that are intentionally present as Alpha stubs are listed in `BACKEND_ALPHA_STUB_ROUTE_IDS`, so production gaps stay visible instead of becoming hidden 404s.
