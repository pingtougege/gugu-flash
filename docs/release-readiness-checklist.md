# Gugu Flash Release Readiness Checklist

This checklist is the release gate for moving from prototype to internal beta, then to public MVP.

The machine-readable source of truth lives at:

```text
docs/release-readiness.json
```

Validate the current internal prototype gate:

```bash
npm run check:release
```

Validate review and governance SOP coverage:

```bash
npm run check:governance
```

Validate review operations certification coverage:

```bash
npm run check:review-operations-certification
```

Validate legal draft coverage:

```bash
npm run check:legal
```

Validate legal approval packet coverage:

```bash
npm run check:legal-approval
```

Validate legal release signoff packet coverage:

```bash
npm run check:legal-release-signoff
```

Validate support readiness coverage:

```bash
npm run check:support
```

Validate support on-call coverage:

```bash
npm run check:support-oncall
```

Validate support training and handoff drill coverage:

```bash
npm run check:support-training-handoff
```

Validate closed-beta operations launch packet coverage:

```bash
npm run check:beta-operations
```

Validate auth/RBAC readiness coverage:

```bash
npm run check:auth-rbac
```

Validate identity provider bridge readiness coverage:

```bash
npm run check:identity-provider
```

Validate identity provider integration packet coverage:

```bash
npm run check:identity-provider-packet
```

Validate identity operations certification coverage:

```bash
npm run check:identity-operations
```

Validate identity access recovery and operator lifecycle replay coverage:

```bash
npm run check:identity-access-recovery
```

Validate backend persistence readiness coverage:

```bash
npm run check:backend-persistence
```

Validate production database migration packet coverage:

```bash
npm run check:production-database
```

Validate production database drill packet coverage:

```bash
npm run check:production-database-drill
```

Validate security readiness coverage:

```bash
npm run check:security
```

Validate monitoring readiness coverage:

```bash
npm run check:monitoring
```

Validate production monitoring packet coverage:

```bash
npm run check:production-monitoring
```

Validate Alpha backup/restore drill:

```bash
npm run check:alpha-backup-restore
```

Validate deployment readiness coverage:

```bash
npm run check:deployment
```

Validate production environment preflight coverage:

```bash
npm run check:production-preflight
```

Validate production rollout packet coverage:

```bash
npm run check:production-rollout
```

Validate moderation staffing readiness coverage:

```bash
npm run check:moderation-staffing
```

Validate moderation rota coverage:

```bash
npm run check:moderation-rota
```

Validate real device matrix readiness coverage:

```bash
npm run check:device-matrix
```

Validate device lab evidence packet coverage:

```bash
npm run check:device-lab-evidence
```

Validate device sync certification packet coverage:

```bash
npm run check:device-sync-certification
```

Validate device sync regression drill coverage:

```bash
npm run check:device-sync-regression
```

Validate payment provider readiness coverage:

```bash
npm run check:payment-provider
```

Validate payment provider integration packet coverage:

```bash
npm run check:payment-provider-packet
```

Validate payment settlement reconciliation drill coverage:

```bash
npm run check:payment-settlement-reconciliation
```

Validate security review packet coverage:

```bash
npm run check:security-review-packet
```

Validate security infrastructure and upload storage replay coverage:

```bash
npm run check:security-infrastructure
```

Validate app distribution readiness coverage:

```bash
npm run check:app-distribution
```

Validate app release packet coverage:

```bash
npm run check:app-release-packet
```

Validate native build certification packet coverage:

```bash
npm run check:native-build-certification
```

Validate native store assets packet coverage:

```bash
npm run check:native-store-assets
```

Validate launch content readiness coverage:

```bash
npm run check:launch-content
```

Status values:

```text
blocked
in_progress
ready
waived
```

## Internal Prototype Gate

| Area | Status | Evidence |
| --- | --- | --- |
| Content schema validation | ready | `npm run check:content` |
| Unit and contract tests | ready | `npm test` |
| Browser smoke tests | ready | `npm run test:e2e` |
| Backend Alpha health | ready | `GET /flash/health` |
| Web HTTP-mode main flow | ready | `tests/e2e/gugu-flash-http-api.spec.js` |
| Backend Alpha route coverage | ready | `apps/backend/src/alpha-route-coverage.test.js` |
| CI gate | ready | `.github/workflows/ci.yml` |
| Pages deploy gate | ready | `.github/workflows/pages.yml` |

## Closed Beta Gate

| Area | Status | Evidence Needed |
| --- | --- | --- |
| Real auth/session | in_progress | Backend Alpha sessions, refresh rotation, revoke, invite-protected non-creator roles, required-auth demo-token shutdown, signed external identity token bridge, identity provider integration packet, identity operations certification packet, and identity access recovery drill exist; production identity provider, provider-bound recovery replay, named roster, provider group replay, and real credentials pending |
| Operator permissions | ready | Route-level RBAC policy, role-specific operator permissions, invite-protected role issuance, denied-route tests, and readiness gate |
| Backend persistence | in_progress | JSON repositories, repository contract, production schema coverage, production database migration packet, production database drill packet, Alpha backup/restore proof, and persistence readiness gates exist; production DB provisioning, repository implementation, migration execution, and real database backup/restore/rollback replay pending |
| H5 publish review | in_progress | Machine-checked SOP, Alpha SLA evaluator, operator SLA endpoint, review operations certification packet, and route tests exist; production queue ownership and staffed reviewer rota pending |
| Store listing review | in_progress | Machine-checked rights/materials SOP, policy-bound HTTP validation, Alpha SLA evaluator, operator SLA endpoint, and review operations certification packet exist; production reviewer workflow pending |
| HardwarePack production | in_progress | Compatibility builder, launch manifest, deterministic Hardware Studio export bundle, checksum gate, and backend export route exist; real Hardware Studio binary packaging, native install packaging, and device signoff pending |
| Payment/claim flow | in_progress | HTTP Alpha payment callback signature, success/failure, idempotency, entitlement grant tests, local replay drill, and settlement reconciliation drill exist; payment sandbox and real provider export replay pending |
| Refund/revoke flow | in_progress | Mock and HTTP Alpha refund revoke, provider callback idempotency tests, local refund replay drill, and refund mismatch reconciliation drill exist; payment sandbox and real provider export replay pending |
| Device sync failure handling | in_progress | HTTP failure/retry tests, fake BLE evidence contract, and local device sync regression drill exist; real BLE evidence pending |
| Takedown and legacy use | ready | Unit and HTTP tests cover delist installed-device behavior |
| Content reports and rights claims | in_progress | Machine-checked SOP, policy-bound HTTP Alpha governance tests, SLA evaluator, escalation owner calculation, second-reviewer conflict detection, and review operations certification packet exist; staffing pending |
| Legal terms | in_progress | Closed-beta legal drafts, legal approval packet, legal release signoff packet, machine-readable coverage, and in-app acceptance UX exist; counsel/privacy/product/commerce signoffs pending |
| Support playbook | in_progress | Closed-beta runbook, ticket macros, escalation matrix, support on-call packet, training/handoff drill packet, daily review checklist, support diagnostics endpoint, and machine-readable readiness gates exist; named staffing, beta on-call calendar, training completion evidence, and staffed handoff drill replay pending |

## Public MVP Gate

| Area | Status | Evidence Needed |
| --- | --- | --- |
| Production deployment | in_progress | Alpha readiness probe, deployment runbook, production environment preflight manifest, production rollout packet, backup/restore utility, automated Alpha backup/restore drill, rollback checklist, and readiness gates exist; production API hosting, production database drill, and rollback drill execution pending |
| Monitoring and alerts | in_progress | Alpha request correlation, ops metrics endpoint, status-code counters, alert inputs, alert evaluator, production monitoring packet, and readiness gates exist; hosted observability, alert routing, synthetic checks, and incident drill pending |
| Real device matrix | in_progress | Matrix plan, device lab evidence packet, device sync certification packet, device sync regression drill, required case IDs, evidence JSON, and readiness gates exist; two or more real Circle 185 devices, firmware spread, BLE captures, and hardware lead signoff pending |
| Payment provider | in_progress | Provider contract, replay matrix, local payment/refund replay drill, Alpha callback controls, support macros, payment provider integration packet, settlement reconciliation drill packet, and readiness gates exist; sandbox credentials, webhook configuration, production approval, key rotation, and real settlement reconciliation execution pending |
| App distribution | in_progress | Distribution plan, TestFlight/Android internal testing checklist, store-review release packet manifest, native build certification packet, native store assets packet, shared native API targets, readiness gate, and release packet gates exist; signed native shell, developer accounts, final screenshot capture/assets, and release manager signoff pending |
| Security review | in_progress | Alpha HTTP security controls, invite-protected RBAC, route-level operator permissions, signed external identity bridge, asset upload policy validation, source statement validation, security review packet, and readiness gates exist; production identity provider, real upload scanning/storage isolation, infrastructure review, and external signoff pending |
| Content moderation staffing | in_progress | Staffing model, rota packet, review operations certification packet, queue coverage, SLA/escalation matrix, daily queue review checklist, training modules, Alpha SLA dashboard endpoint, and readiness gates exist; named rota, drills, and production dashboard wiring pending |
| Launch content | ready | Official free launch HardwarePack manifest, checksum, payload, support handoff, and H5 fallback content |

## Current Verdict

```text
Internal prototype: ready
Closed beta: not ready
Public MVP: not ready
```

Reason:

Gugu Flash now has a backend-shaped integration path, CI gates, legal draft coverage, legal release signoff packet coverage, support macros, support training/handoff drill coverage, route-level auth/RBAC coverage, signed identity-provider bridge coverage, identity operations certification coverage, identity access recovery drill coverage, backend persistence contract coverage, production database drill coverage, security readiness coverage, security review packet coverage, monitoring readiness coverage, production monitoring packet coverage, deployment readiness coverage, production preflight coverage, production rollout packet coverage, moderation staffing readiness coverage, moderation rota coverage, review operations certification coverage, real device matrix readiness coverage, device lab evidence packet coverage, device sync certification packet coverage, device sync regression drill coverage, payment provider readiness coverage, payment provider integration packet coverage, payment settlement reconciliation drill coverage, app distribution readiness coverage, app release packet coverage, native build certification packet coverage, native store assets packet coverage, launch content readiness coverage, and operational runbooks, but still needs production auth provider configuration, provider-bound identity recovery replay, production database repositories and real backup/restore replay, real payment provider credentials and settlement export replay, real device BLE captures, signed native builds, developer console access, final screenshot capture/assets, legal approval, named support/moderation staffing, staffed support drill replay, external security signoff, hosted observability, real production hosting, and production operations before external users or paid hardware distribution.
