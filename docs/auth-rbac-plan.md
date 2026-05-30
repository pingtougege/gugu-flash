# Auth And RBAC Plan

This plan covers the Closed Beta authentication and operator permission model for Backend Alpha. It does not claim that a production identity provider is connected yet; it defines the session, role issuance, and route-level RBAC controls that must hold before operator workflows can be trusted.

## Scope

Closed Beta needs two separate controls:

- Real user sessions for user-facing write routes.
- Role-based operator permissions for review, governance, hardware, support, payment, and admin surfaces.

Backend Alpha now enforces sessions when `GUGU_FLASH_REQUIRE_AUTH=1`, disables demo static tokens unless `GUGU_FLASH_ALLOW_DEMO_AUTH=1`, and ignores `X-Gugu-Role` role spoofing in required-auth mode.

## Session Model

The Alpha session model supports:

- `POST /flash/auth/login`
- `POST /flash/auth/refresh`
- `POST /flash/auth/logout`
- `GET /flash/session`
- access token rotation on refresh
- revoked-token rejection
- public session responses that omit raw tokens

Production identity provider integration remains external. Before public launch, username/password, phone, OAuth, or another provider must replace Alpha self-issued creator sessions.

## Operator Role Issuance

Non-creator roles require an operator invite secret:

```text
GUGU_FLASH_OPERATOR_INVITE_SECRET
```

Roles above `creator` cannot be issued without the invite code. This is an Alpha closed-beta control, not a long-term identity product.

## RBAC Matrix

| Role | Allowed Areas |
| --- | --- |
| `creator` | User write routes only |
| `reviewer` | Operator read, review write, governance write, store review write |
| `hardware_operator` | Operator read and hardware write |
| `support` | Operator read and payment read |
| `operator` | Review, governance, store, hardware, content ops, payment, and ops metrics |
| `admin` | Full operational permissions |
| `super_admin` | Full operational permissions |

## Route Permissions

Backend Alpha maps operator routes to explicit permissions:

- `/flash/operator/ops-metrics` requires `ops:read`.
- `/flash/operator/review-tasks/*` writes require `review:write`.
- `/flash/operator/reports/*`, `/flash/operator/rights-claims/*`, and `/flash/operator/appeals/*` writes require `governance:write`.
- `/flash/operator/store-listings/*` writes require `store_review:write`.
- `/flash/operator/hardware-packs/*` writes require `hardware:write`.
- `/flash/operator/refund-callbacks` and settlement writes require `payment:write`.
- `/flash/operator/payment-callbacks` remains provider-signed and bypasses operator session auth only after HMAC verification.

## External Boundary

This RBAC gate proves route-level permission enforcement. It does not replace production identity provider review, named human operator roster assignment, credential reset policy, device trust, or external security signoff.
