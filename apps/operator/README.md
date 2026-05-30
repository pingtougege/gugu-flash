# Gugu Flash Operator

Standalone internal operations console for Gugu Flash.

Open:

```text
http://127.0.0.1:4177/apps/operator/
```

Default API:

```text
http://127.0.0.1:4188
```

Use a custom API base:

```text
http://127.0.0.1:4177/apps/operator/?apiBase=http%3A%2F%2F127.0.0.1%3A4188
```

Primary responsibilities:

- operations dashboard and Backend Alpha health
- full work library with heat, IP/persona attribution, search, filters, sorting, and pagination
- IP pool operations with heat, zone eligibility, personas, risk, and scale controls
- web-wide IP search intake for candidate search, candidate import, existing IP character completion, and full character/profile review
- H5/store/hardware review queues
- reports, rights claims, appeals, and moderation actions
- store listing advancement, freeze, reject, and delist flows
- hardware candidate, ready, publish, and Hardware Studio export flows
- settlements and frozen payout review
- trending content triage
- review SLA and monitoring alerts
- support diagnostics for user/device/order/content evidence
- immutable operation log review

Scale notes:

- Detailed large-content decisions are tracked in `docs/operator-console-scale-plan.md`.
- The E2E suite covers a 126-work trial for pagination, search, and page-size switching.
