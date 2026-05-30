# Gugu Flash Review SLA Readiness

This gate turns the review and governance SOP into a machine-readable queue health snapshot for Trust, Commerce, Hardware, Support, and Ops leads.

## Scope

The Alpha SLA dashboard covers H5 publish review, store listing review, hardware adaptation review, comment/report governance, rights claim governance, appeal review, and frozen settlement follow-up.

## Endpoint

- Route: `GET /flash/operator/review-sla`
- Auth: operator-readable roles.
- Response schema: `gugu_flash_review_sla_v1`
- Request correlation: returns the incoming request id in `requestId`.

## SLA Rules

Queue targets mirror the moderation staffing plan:

- `h5_publish_review`: 24h
- `store_listing_review`: 48h
- `hardware_adaptation_review`: 72h
- `comment_report_governance`: 24h
- `rights_claim_governance`: 72h
- `appeal_review`: 72h and second-reviewer separation of duties

Each item includes queue owner, backup owner, escalation owner, age, remaining time, breach status, severity, and whether escalation is required.

## Daily Review

The snapshot supports daily queue health review for review tasks, open reports, rights claims, appeals, frozen settlements, and operator actions without reason.

## External Boundary

The AI team can maintain the evaluator, backend route, tests, and readiness checks. Public MVP still needs named human rota, training completion, escalation drill evidence, and production dashboard wiring.
