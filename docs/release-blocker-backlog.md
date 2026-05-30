# Gugu Flash Release Blocker Backlog

This backlog is generated from the release readiness gate. It keeps the AI team focused on what still blocks Closed Beta and Public MVP.

## Closed Beta Blockers

| ID | Owner | Status | Required Evidence |
| --- | --- | --- | --- |
| `real_auth_session` | Backend Lead | in_progress | Backend Alpha sessions, refresh rotation, revoke, invite-protected non-creator roles, required-auth demo-token shutdown, signed external identity token bridge, identity provider integration packet, identity operations certification packet, and identity access recovery drill exist; production identity provider, provider-bound recovery replay, named operator roster, provider group replay, and real credential verification pending |
| `operator_permissions` | Backend Lead / Trust Lead | ready | Route-level RBAC policy, role-specific operator permissions, invite-protected role issuance, denied-route tests, and readiness gate |
| `backend_persistence` | Backend Lead | in_progress | JSON repositories, repository contract, production schema coverage, production database migration packet, production database drill packet, Alpha backup/restore proof, and persistence readiness gates exist; production DB provisioning, repository implementation, migration execution, and real database backup/restore/rollback replay pending |
| `h5_publish_review` | Trust Lead / Operator Lead | in_progress | Machine-checked SOP, Alpha SLA evaluator, operator SLA endpoint, review operations certification packet, and route tests exist; production H5 review ownership and staffed reviewer rota pending |
| `store_listing_review` | Trust Lead / Commerce Lead | in_progress | Machine-checked rights/materials SOP, policy-bound HTTP validation, Alpha SLA evaluator, operator SLA endpoint, and review operations certification packet exist; production store listing reviewer workflow pending |
| `hardware_pack_production` | Hardware Studio Lead | in_progress | Compatibility builder, launch HardwarePack manifest, deterministic Hardware Studio export bundle, checksum gate, and backend export route exist; real Hardware Studio binary packaging, native install packaging, and device signoff pending |
| `payment_claim_flow` | Commerce Lead / Backend Lead | in_progress | HTTP Alpha payment callback signature, success/failure, idempotency tests, local replay drill, and settlement reconciliation drill exist; real payment sandbox and provider export replay pending |
| `refund_revoke_flow` | Commerce Lead / Backend Lead | in_progress | HTTP Alpha refund revoke, provider callback idempotency tests, local refund replay drill, and refund mismatch reconciliation drill exist; payment sandbox and provider export replay pending |
| `device_sync_failure_handling` | Native/Hardware Lead | in_progress | HTTP Alpha failure/retry tests, fake BLE evidence contract, and local device sync regression drill exist; real BLE device matrix pending |
| `content_reports_rights_claims` | Trust Lead | in_progress | Machine-checked SOP, policy-bound HTTP Alpha governance tests, SLA evaluator, escalation owner calculation, second-reviewer conflict detection, and review operations certification packet exist; production staffing and escalation rota |
| `legal_terms` | Legal / Product Owner | in_progress | Closed-beta legal drafts, legal approval packet, legal release signoff packet, machine-readable coverage, and in-app acceptance UX exist; counsel/privacy/product/commerce signoffs pending |
| `support_playbook` | Ops Lead / Support Lead | in_progress | Closed-beta support runbook, ticket macros, escalation matrix, support on-call packet, training/handoff drill packet, beta operations launch packet, daily checklist, diagnostic bundle endpoint, and readiness gates exist; named staffing, beta on-call calendar, launch channels, training completion evidence, and staffed handoff drill replay pending |

## Public MVP Blockers

| ID | Owner | Status | Required Evidence |
| --- | --- | --- | --- |
| `production_deployment` | DevOps Lead | in_progress | Alpha readiness probe, deployment runbook, production environment preflight manifest, production rollout packet, backup/restore utility, automated Alpha backup/restore drill, rollback checklist, and readiness gates exist; production API hosting, production database drill, and rollback drill execution pending |
| `monitoring_alerts` | DevOps Lead / QA Lead | in_progress | Alpha request correlation, ops metrics endpoint, status-code counters, alert inputs, alert evaluator, production monitoring packet, and readiness gates exist; hosted observability, alert routing, synthetic checks, and incident drill pending |
| `real_device_matrix` | Native/Hardware Lead / QA Lead | in_progress | Matrix plan, device lab evidence packet, device sync certification packet, device sync regression drill, required case IDs, evidence JSON, and readiness gates exist; two or more real Circle 185 devices, firmware spread, BLE captures, and hardware lead signoff pending |
| `payment_provider` | Commerce Lead / Backend Lead | in_progress | Provider contract, replay matrix, local payment/refund replay drill, Alpha callback controls, support macros, payment provider integration packet, settlement reconciliation drill packet, and readiness gates exist; sandbox credentials, webhook configuration, production approval, key rotation, and real settlement reconciliation execution pending |
| `app_distribution` | Native Lead / Product Owner | in_progress | Distribution plan, TestFlight/Android internal testing checklist, store-review release packet manifest, native build certification packet, native store assets packet, shared native API targets, readiness gate, and release packet gates exist; signed native shell, developer accounts, final screenshot capture/assets, and release manager signoff pending |
| `security_review` | Security / Backend Lead | in_progress | Alpha HTTP security controls, asset upload policy validation, source statement validation, security review packet, security infrastructure/upload storage replay packet, and readiness gates exist; production auth, real upload scanning/storage isolation, TLS/secret/alert/backup replay, infrastructure, and external signoff pending |
| `moderation_staffing` | Trust Lead / Ops Lead | in_progress | Staffing model, rota packet, review operations certification packet, queue coverage, SLA/escalation matrix, Alpha SLA dashboard endpoint, and readiness gates exist; named human rota, training completion, escalation drill, and production dashboard wiring pending |
| `launch_content` | Content Ops Lead | ready | Official free launch HardwarePack manifest, checksum, payload, support handoff, and H5 fallback content |

## Immediate AI-Team Work Queue

1. DevOps Lead: replace production preflight placeholders with real hosting, database, secret-manager, backup, and rollback evidence.
2. Ops Lead: create closed-beta support/ops/S0 channels, assign named support owners, and approve the 7-day on-call calendar from the beta operations launch packet.
3. Legal/Product Owner: route the legal approval packet for counsel approval, privacy owner approval, product copy signoff, and commerce refund terms signoff.
4. Native/Hardware Lead: fill the device lab evidence packet with real Circle 185 serials, firmware versions, BLE captures, QA replay output, and hardware signoff.
5. Commerce Lead: connect a real payment sandbox and replay pay/refund callbacks against the Alpha signature contracts.
6. Native Lead: create signed iOS/Android internal builds, replace release-packet placeholders with final store assets, and submit for release manager signoff.

## Current Gate Verdict

```text
Internal prototype: ready
Closed beta: not ready
Public MVP: not ready
```
