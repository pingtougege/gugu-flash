# Gugu Flash Production Deployment Runbook

This runbook is the first production-deployment skeleton for Gugu Flash. It does not claim that production hosting is live; it defines the checks, rollback path, and external work required before public MVP.

## Scope

Deployment readiness covers:

- Web static deployment.
- Backend API deployment.
- Health and readiness probes.
- Runtime configuration and secrets.
- Data backup and restore.
- Rollback.
- Smoke tests and release gates.
- Incident handoff.

## Runtime Configuration

Backend Alpha uses these environment variables:

| Variable | Purpose | Required For Production |
| --- | --- | --- |
| `API_HOST` / `HOST` | API bind host | yes |
| `API_PORT` / `PORT` | API port | yes |
| `GUGU_FLASH_API_DATA` | JSON data path during Alpha | replaced by production DB |
| `GUGU_FLASH_API_STATE` | JSON runtime-state path during Alpha | replaced by production DB |
| `GUGU_FLASH_REQUIRE_AUTH` | Require auth and role checks | yes |
| `GUGU_FLASH_ALLOW_DEMO_AUTH` | Disable demo-token auth in production | yes, set to `0` |
| `GUGU_FLASH_CORS_ORIGIN` | Restrict allowed Web origin | yes |
| `GUGU_FLASH_OPERATOR_INVITE_SECRET` | Issue non-creator operator roles | yes |
| `GUGU_FLASH_IDENTITY_TOKEN_SECRET` | Verify identity-provider bridge token signatures | yes |
| `GUGU_FLASH_IDENTITY_ISSUER` | Verify identity-provider issuer | yes |
| `GUGU_FLASH_IDENTITY_AUDIENCE` | Verify identity-provider audience | yes |
| `GUGU_FLASH_PAYMENT_CALLBACK_SECRET` | Payment callback HMAC secret | yes |

The production environment packet lives at `data/production-environment-preflight.json` and is validated with `npm run check:production-preflight`.

## Probes

Public health probe:

```text
GET /flash/health
```

Deployment readiness probe:

```text
GET /flash/ready
```

Readiness must report:

- `status = ready`
- `checks.api = ok`
- `checks.runtimeState = ok`
- `checks.persistence = json_alpha` during Alpha, production DB after migration
- `checks.securityHeaders = ok`
- `checks.requestMetrics = ok`

## Deploy Steps

1. Run `npm test`.
2. Run `npm run test:e2e`.
3. Run `npm run check:deployment`.
4. Run `npm run check:production-preflight`.
5. Confirm release readiness gate status and open external blockers.
6. Build or publish the Web static artifact through the Pages workflow.
7. Deploy Backend API to the target hosting platform.
8. Set production env vars and secrets.
9. Check `/flash/health` from outside the hosting region.
10. Check `/flash/ready` from the load balancer or runtime platform.
11. Run Web HTTP-mode smoke against the production API base URL.
12. Watch request metrics and alert delivery for the first beta window.

## Backup And Restore

Alpha JSON storage:

- Back up `GUGU_FLASH_API_DATA`.
- Back up `GUGU_FLASH_API_STATE`.
- Keep a timestamped backup before every deploy.
- Restore by stopping the API, replacing the JSON files, and restarting.
- Run the local Alpha drill with `npm run check:alpha-backup-restore`.
- Alpha backups use `gugu_flash_json_backup_v1` and verify the backup checksum before restore.

Production database target:

- Automated daily backups.
- Pre-deploy backup snapshot.
- Restore drill before public MVP.
- Point-in-time recovery plan for orders, entitlements, payments, reports, claims, appeals, and device sync jobs.

## Rollback

Rollback criteria:

- Health or readiness fails after deploy.
- Web HTTP-mode smoke fails.
- 5xx spike persists after mitigation.
- Payment callback mismatch appears.
- Device sync failures spike across devices.

Rollback steps:

1. Stop rollout or drain the new API instance.
2. Repoint traffic to the previous known-good API version.
3. Restore the pre-deploy data snapshot if schema or state was mutated incompatibly.
4. Re-run `/flash/health`, `/flash/ready`, and Web HTTP-mode smoke.
5. Record incident notes, request ids, and affected users/orders/devices.

## External Work

Production deployment remains incomplete until:

- Production API hosting is selected and configured.
- Production database replaces Alpha JSON persistence.
- Secrets management is configured.
- Hosted logging/metrics/alerts are connected.
- Backup/restore is tested on the production database.
- Rollback drill is completed.
- Production preflight placeholders are replaced with real hosting, origin, database, and secret-manager evidence.
