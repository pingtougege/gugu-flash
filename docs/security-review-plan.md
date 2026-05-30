# Gugu Flash Security Review Plan

This is the Alpha security-readiness plan for moving from a prototype to closed beta and then public MVP. It is not a completed external security review.

## Scope

Security review must cover:

- Auth and session handling.
- Operator permissions and role boundaries.
- Payment and refund callback signature verification.
- UGC, comment, report, rights claim, and appeal data handling.
- Upload and asset safety before public file uploads are enabled.
- Device sync diagnostics and device identifiers.
- HTTP response hardening, CORS policy, request size limits, logging, and rollback.

## Alpha Controls

The Backend Alpha currently provides these controls:

- JSON API security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and API-only CSP.
- Configurable CORS origin through `GUGU_FLASH_CORS_ORIGIN`; local development defaults to `*`.
- JSON request body size limit with `payload_too_large` response.
- Optional route auth via `GUGU_FLASH_REQUIRE_AUTH=1`.
- Demo and persisted sessions with issue, refresh, revoke, and revoked-token tests.
- Provider payment callback HMAC signature validation.
- Governance policy validation for sensitive operator actions that require reasons.
- Asset upload policy validation for allowed media types, file size, source statements, private URL blocking, and review handoff checks.
- Machine-checked support, legal, governance, content, API contract, and release gates.

## Required External Review

Before public MVP, named reviewers must complete:

- Production identity provider review.
- Production database and backup/restore review.
- Payment provider callback replay and key-rotation review.
- Upload and asset malware/content-safety review.
- Privacy and personal-data handling review.
- Operator permission and audit-log review.
- Dependency and deployment configuration review.

## Open Risks

- Production auth provider is not connected.
- Production database implementation is pending.
- Real payment provider sandbox and production approval are pending.
- Real upload scanning, signed delivery URLs, retention/deletion workflow, and production storage isolation are pending.
- Real monitoring, alerts, and incident response are pending.
- External security review is pending.

## Exit Criteria

Public MVP cannot pass security review until:

- Security readiness gate passes in CI.
- Production auth, database, storage, payment, and monitoring are configured.
- External security reviewer signs off on the risk register.
- Critical and high findings are fixed or formally accepted by the Product Owner.
