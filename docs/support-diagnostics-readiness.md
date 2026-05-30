# Gugu Flash Support Diagnostics Readiness

This document defines the closed-beta diagnostic bundle that Support, Commerce, Trust, and Hardware leads use before replying to users or escalating cases.

## Endpoint

- Route: `GET /flash/operator/support-diagnostics`
- Auth: operator-readable roles, including the `support` role.
- Request correlation: accepts `X-Request-Id` or `X-Gugu-Request-Id` and returns the same `requestId` in the bundle.
- Query fields: `caseId`, `deviceId`, `orderId`, `providerEventId`, `providerPaymentId`, `providerRefundId`, `syncJobId`, `diagnosticCode`, `targetId`, `storeId`, `hardwarePackId`, `entitlementId`, `settlementId`, `reportId`, `claimId`, `appealId`, and `operationLogId`.

## Bundle Contents

The bundle version is `gugu_flash_support_diagnostic_v1`. It includes a normalized query, summary counters, matched runtime records, recommended ticket macros, and missing required fields.

Matched records include:

- Devices, device entitlements, device installs, and device sync jobs.
- Orders, payment callbacks, refund callbacks, and settlements.
- Reports, rights claims, appeals, moderation actions, and operation logs.

The support workflow must collect `diagnosticCode`, `providerEventId`, `orderId`, `deviceId`, and source case ids before final user-facing responses.

## Macro Recommendation

The bundle recommends the existing ticket macros from `docs/support-ticket-macros.md`:

- `sync_low_battery`
- `sync_write_failed`
- `payment_no_entitlement`
- `refund_provider_mismatch`
- `takedown_legacy_use`
- `rights_claim_received`
- `appeal_received`
- `operator_reason_missing`

Each recommendation includes severity, owner, source ids, required fields, missing fields, and a `ready` flag so Support can see whether the case can be answered or must be escalated for more evidence.

## Closed-Beta Acceptance

- Support can retrieve one diagnostic bundle by order, provider event, sync job, device, target, or case id.
- Support role can read diagnostics without receiving ops metrics or write permissions.
- Diagnostic bundles preserve `requestId` for operation log and incident correlation.
- Payment, refund, device sync, rights claim, appeal, takedown, and operator-reason macros are all machine-covered.
- Production beta still requires named human staffing and on-call ownership from the support readiness gate.
