# Backend Persistence Readiness

This readiness track moves Gugu Flash from ad hoc Alpha JSON files toward a production database boundary. It does not claim that production Postgres, MySQL, or another managed database is live; it proves the repository contract, schema coverage, and migration scope are explicit and machine-checked.

The production database migration packet lives at `data/production-database-migration-packet.json` and is validated with `npm run check:production-database`.

## Scope

Backend Alpha currently persists runtime state through `createJsonFlashStore`. The production database must preserve the same behavioral contracts for:

- sessions
- orders
- device entitlements
- device installs
- device sync jobs
- comments
- block relations
- reports
- rights claims
- appeals
- moderation actions
- operation logs
- payment callbacks
- refund callbacks
- launch HardwarePack records

## Repository Contract

The machine-readable repository contract lives in `apps/backend/src/persistence-contract.js`.

Each repository declares:

- required methods
- production table coverage
- migration target relationship

The Alpha JSON store must pass `validateRepositoryContract()`.

## Schema Coverage

The production schema draft lives at `apps/backend/db/schema.sql`. It now covers the core product tables:

- content and versions
- assets and uploads
- review tasks
- store listings
- HardwarePacks
- orders, payment callbacks, refund callbacks, and settlements
- devices, entitlements, installs, and sync jobs
- comments, block relations, reports, rights claims, appeals, moderation actions, and operation logs

Schema coverage is verified by `validateSqlSchema()`.

## Migration Path

The production migration path is:

```text
JSON Alpha runtime state
  -> repository contract snapshot
  -> SQL schema migration
  -> production database repository implementation
  -> backup/restore drill
  -> rollback drill
```

The existing Alpha backup/restore drill protects JSON state while the production database is not connected.

## External Boundary

This readiness gate proves repository and schema coverage. It does not replace production database provisioning, managed backups, point-in-time recovery, query performance testing, migration execution, or operational ownership.
The migration packet records target database requirements, schema validation, repository contract coverage, migration steps, critical tables, backup/restore verification, and pending external blockers.
