# App Distribution Plan

This plan turns the Public MVP `app_distribution` blocker into a measurable native release track. It does not claim that iOS or Android builds exist yet; it defines the channels, artifacts, store-review checklist, and signoffs required before Public MVP.

## Scope

Gugu Flash can keep using the Web/H5 prototype for product and backend validation, but Public MVP needs a native app distribution path because device management, push, deep links, and BLE/hardware installation are native-first experiences.

Native Lead owns app build and signing. Product Owner owns store positioning and release scope. QA owns smoke verification. Legal owns privacy/terms readiness. Support owns store support contact and escalation paths.

## Channels

The first distribution plan covers:

- iOS internal TestFlight for team, QA, and closed-beta validation.
- Android internal testing or internal app sharing for team, QA, and closed-beta validation.
- Public App Store / Google Play release only after store review materials, payment scope, privacy labels, and support operations are ready.
- Web/H5 fallback while native store review is pending.

## Release Artifacts

Every release candidate must include:

- A machine-readable release packet at `data/app-release-packet.json`, validated by `npm run check:app-release-packet`.
- Signed iOS build or documented iOS build blocker.
- Signed Android build or documented Android build blocker.
- Version number, build number, git revision, API base URL, and feature flags.
- Store screenshots, app icon, app name, subtitle/short description, long description, privacy policy URL, terms URL, and support contact.
- QA smoke record for login/session, feed, create, store listing, claim/purchase, device dashboard, sync handoff, and support/legal links.

## Store Review

Store review materials must explicitly cover:

- BLE/device permission rationale.
- Push notification rationale.
- Photo/media upload rationale.
- Paid content disabled unless payment provider approval is complete.
- User-generated content moderation, reports, rights claims, appeals, and blocking.
- Refund and support contact paths.

## Rollout

The rollout must use staged exposure:

```text
internal team -> closed beta allowlist -> limited public cohort -> public MVP
```

Rollout should pause if crash rate, login failures, payment callback failures, device sync failure rate, or content moderation backlog exceeds the monitoring thresholds.

## External Work

The AI team can maintain the plan, shared client contracts, gate scripts, and store checklist. Apple Developer access, Google Play Console access, signing certificates, native shell implementation, store submission, review feedback handling, and release manager signoff remain external acceptance work.
