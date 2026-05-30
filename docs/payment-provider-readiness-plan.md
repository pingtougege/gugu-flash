# Payment Provider Readiness Plan

This plan turns the Public MVP `payment_provider` blocker into a measurable commerce integration track. It does not claim provider approval yet; it defines the sandbox, webhook, replay, reconciliation, and signoff evidence required before paid public launch.

## Scope

Public MVP can continue with free official packs while provider approval is pending. Paid official low-price packs require a real payment provider sandbox replay, production merchant approval, callback signing, refund callback replay, and settlement reconciliation evidence.

Commerce Lead owns provider enrollment and settlement rules. Backend Lead owns callback verification, idempotency, and entitlement state transitions. Support Lead owns payment/refund macros. Security owns secret handling and key rotation.

## Provider Contract

The Alpha contract already requires payment callbacks to pass `X-Gugu-Payment-Signature` or body `signature` verification using `GUGU_FLASH_PAYMENT_CALLBACK_SECRET`. Every provider event must carry a stable `providerEventId` that acts as the idempotency key.

Before Public MVP, the selected provider contract must document:

- Payment success, payment failure, expired payment, and amount mismatch payloads.
- Refund success, refund duplicate, refund failed, and processing payloads.
- Signature algorithm, timestamp tolerance if used, and key rotation process.
- Currency, amount unit, merchant order id, provider payment id, and provider refund id mappings.
- Webhook retry behavior and maximum replay window.

## Callback Replay Matrix

| Case ID | Scenario | Expected Result |
| --- | --- | --- |
| `payment_provider_sandbox_success` | Valid sandbox payment success callback. | Order becomes `paid`, one device entitlement is granted. |
| `payment_provider_duplicate_event` | Same `providerEventId` replayed. | Same callback event is returned; no duplicate entitlement or operation log. |
| `payment_provider_invalid_signature` | Callback signed with the wrong secret. | Request is rejected with `invalid_payment_signature`. |
| `payment_provider_amount_mismatch` | Provider success amount or currency differs from order. | Callback records mismatch and entitlement is not granted. |
| `payment_provider_failed_payment` | Provider reports failed, cancelled, or expired payment. | Pending order becomes failed and no entitlement is granted. |
| `payment_provider_refund_success` | Valid refund success callback. | Order becomes `refunded`, entitlement is revoked according to policy. |
| `payment_provider_refund_duplicate` | Same refund `providerEventId` replayed. | Same refund callback is returned; no duplicate revoke or settlement operation. |

Run `npm run check:payment-replay` before connecting real sandbox credentials. The replay drill starts a temporary Backend Alpha server, creates paid orders, submits signed callbacks, rejects a bad signature, verifies amount mismatch behavior, and checks refund idempotency.

## Settlement And Refund Controls

Before enabling paid Public MVP, Commerce Lead must confirm:

- Settlement reconciliation can match provider transactions to Gugu Flash orders.
- Refund callback idempotency works for repeated provider notifications.
- Rights complaints can freeze listings and settlement records.
- Support can inspect `providerEventId`, provider payment id, provider refund id, order id, device id, and entitlement id.
- Failed or disputed callbacks have a manual escalation path.

## Launch Mode

If provider approval is not complete, Public MVP must run in free-only mode:

- `official_free` packs can be claimed with amount `0`.
- Paid packs remain hidden or disabled.
- Product copy must not imply paid checkout availability.
- Support macros still cover payment edge cases for closed sandbox testers.

## External Work

The AI team can maintain the callback contract, HMAC verification, idempotency tests, support macros, and readiness gates. Provider sandbox credentials, webhook configuration, production merchant approval, real settlement exports, and finance signoff remain external acceptance work.
