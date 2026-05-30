# Gugu Flash Native

Future iOS and Android app shell.

## Scope

The native client is the primary Public MVP distribution target for daily use, push, account/device management, deep links, and hardware content installation where platform BLE capabilities allow.

Primary responsibilities:

- daily content feed and player
- creation, remix, comments, notifications, and social graph
- upload, push, deep links, and native sharing
- device management and hardware content installation where platform capabilities allow

The native client should consume `packages/core` and backend APIs rather than owning product logic directly.

## Release Channels

Public MVP requires a signed native shell and at least one controlled release channel before public launch:

- iOS internal TestFlight for team and closed beta validation.
- Android internal testing or internal app sharing for team and closed beta validation.
- Store review package for public release, including privacy labels, permission rationale, screenshots, and support contact.
- Web/H5 fallback for sharing and lightweight review flows while native app distribution is pending.

## Build Inputs

The native build must reference the same Gugu Flash API contract and shared domain package as the Web prototype:

- `packages/core`
- `packages/api-client`
- `FLASH_API_ROUTES`
- `GUGU_FLASH_CLIENT_TARGETS` with `native`
- `data/app-release-packet.json`, checked by `npm run check:app-release-packet`, for version, channels, feature flags, store-review fields, smoke paths, and external blockers

## Store Review Checklist

Before Public MVP:

- App name, icon, screenshots, and preview copy match Gugu Flash positioning.
- Privacy policy and terms are linked from the store listing and in-app settings.
- BLE, notification, photo/media, camera, and deep-link permissions have user-facing explanations.
- Paid content copy is disabled unless payment provider approval is complete.
- Support contact, complaint path, and refund path are visible.
- Release packet manifest records the privacy/terms URLs, support contact, permission rationales, disabled paid-content copy, QA smoke paths, and pending release-manager signoff.

## External Work

The AI team can maintain product requirements, shared API contracts, readiness gates, and store-review checklists. Apple Developer account access, Google Play Console access, signing certificates, native shell implementation, store review submission, and release manager signoff remain external acceptance work.
