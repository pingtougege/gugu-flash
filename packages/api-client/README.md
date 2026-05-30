# @gugu-flash/api-client

Future shared API client package.

Primary responsibilities:

- shared `/flash/**` API route contract
- mock facade to future backend route mapping
- feed and work APIs
- creation, remix, comments, interactions
- auth/session adapters per platform
- upload and asset APIs
- operator and hardware candidate APIs

Keep transport details here so clients do not call backend endpoints directly from UI components.

Current implementation:

- `src/flash-api-contract.js` defines the first route contract for Web, Native, Mini Program, and Operator clients.
- `src/mock-flash-api.js` exposes the first API facade.
- It uses injected persistence functions, so Web can use `localStorage` now and a real HTTP backend later.
- Method names mirror the future backend route plan in `docs/full-platform-execution-plan.md`.
- The main social entry now uses `getFriends()`; creator and device data live under Mine/Profile surfaces.
- The operator surface now exposes dashboard queues, review task actions, and operation logs as backend-shaped mock APIs.
- IP and zone APIs expose IP pool search, IP details, zone eligibility, zone applications, and IP entry applications.
- Device sync jobs now expose validated `syncJob.evidence` for QA, support diagnostics, and future BLE transport parity.
- Payment callbacks use `processPaymentCallback()` with Alpha HMAC signature verification at the HTTP boundary and provider-event idempotency in the commerce state machine.
- Refund callbacks use `processRefundCallback()` with provider-event idempotency before real payment provider integration.
