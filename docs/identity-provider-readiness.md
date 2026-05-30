# Identity Provider Readiness

This document records the production identity bridge for Gugu Flash. It does not claim that a real identity provider has been contracted or configured; it proves the Backend Alpha can accept signed upstream identity tokens with issuer, audience, expiry, subject, and role claims.

The machine-readable production identity integration packet lives at `data/identity-provider-integration-packet.json` and is validated with `npm run check:identity-provider-packet`.

## Scope

Closed Beta identity readiness now has two layers:

- Local Alpha sessions for development and manual testing.
- External signed identity tokens for production identity provider integration.

When `GUGU_FLASH_REQUIRE_AUTH=1`, Backend Alpha can disable demo tokens, ignore `X-Gugu-Role`, and authenticate signed identity tokens through the identity bridge.

## Token Contract

The bridge token uses `gugu_flash_identity_token_v1`.

Required claims:

- `iss`
- `aud`
- `sub`
- `displayName`
- `role`
- `iat`
- `exp`
- `jti`

The server verifies:

- HMAC signature with `GUGU_FLASH_IDENTITY_TOKEN_SECRET`.
- Issuer from `GUGU_FLASH_IDENTITY_ISSUER`.
- Audience from `GUGU_FLASH_IDENTITY_AUDIENCE`.
- Expiry before accepting the session.
- Role normalization through the Auth/RBAC policy.

## Session Projection

A valid identity token becomes an in-request session with:

- `source = external_identity`
- `userId = sub`
- `displayName`
- `role`
- `permissions`
- `issuer`
- `audience`
- `expiresAt`

Raw token values are not returned by `GET /flash/session`.

## Failure Modes

The identity bridge rejects:

- malformed tokens
- invalid signatures
- wrong issuer
- wrong audience
- missing subject
- expired tokens
- unknown roles

Failure falls back to normal auth rejection, not to a privileged guest or demo role.

## External Boundary

This bridge is enough for Backend Alpha to integrate with an upstream identity provider or authenticated gateway. A real provider still must be selected, configured, tested with production credentials, and reviewed for account recovery, MFA, credential reset, logs, privacy, and operator roster lifecycle.

The integration packet records provider selection, issuer/audience, operator group mapping, session policy, credential recovery, operator joiner/mover/leaver lifecycle, privacy/security review, acceptance checks, and pending external blockers.
