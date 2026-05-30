# Implementation Roadmap

This is the high-level roadmap. The concrete MVP execution order is now tracked in [MVP Execution Roadmap](/Users/xulei/projects/gugu-flash/docs/mvp-execution-roadmap.md).

Immediate next implementation target:

```text
P0-01 规则和测试底座
  -> add schemaVersion / capabilities validation
  -> add Node node:test scripts
  -> add core and mock API tests
  -> keep npm run check:content and npm run test passing
```

## Milestone 0: Prototype

Current repo state.

- Static mobile-first app
- Full-screen H5 content feed
- Interactive scene player
- Prompt-to-draft mock creator
- Remix flow
- Operator candidate console
- Local `GuguH5Pack` seed data

## Milestone 1: Real Product Backend

Add a backend with these domains:

- users
- h5_packs
- h5_pack_versions
- reviews
- interactions
- comments
- remixes
- hardware_candidates

Recommended first implementation:

- FastAPI or Spring Boot, chosen for the new Gugu Flash backend rather than legacy deployment compatibility.
- PostgreSQL/MySQL for core entities.
- OSS for image/video/audio assets.
- Redis for feed ranking cache and rate limits.

Core APIs:

```text
GET    /api/feed
GET    /api/h5-packs/:id
POST   /api/h5-packs
POST   /api/h5-packs/:id/remix
POST   /api/h5-packs/:id/interactions
POST   /api/h5-packs/:id/comments
GET    /api/me/works
GET    /api/operator/trending
POST   /api/operator/hardware-candidates
```

## Milestone 2: Cross-Platform Client Foundation

Move from the static prototype to a product client architecture that can support native app, Web/H5, and mini program clients.

Recommended shape:

- shared `GuguH5Pack` schema and validators
- shared feed/player/creator domain modules
- API client layer with replaceable adapters
- design tokens and interaction rules that can be implemented consistently across clients
- route model for feed, player, create, work detail, profile, notifications, device install, and operator surfaces

Client targets:

- Native app: primary long-term client for iOS and Android.
- Web/H5: shareable player and public work pages.
- Mini program: WeChat distribution channel and device/account bridge.
- Operator web: internal review and hardware candidate management.

Avoid binding product logic to WeChat-only APIs. Wrap platform features such as login, share, push, storage, upload, and BLE behind adapters.

## Milestone 3: AI Authoring

Replace the local mock generator with an AI adapter.

Capabilities:

- prompt to H5 pack
- remix rewrite
- dialogue expansion
- branch generation
- title/tag generation
- review risk explanation

The AI output must be JSON and validated against `GuguH5Pack` before saving.

## Milestone 4: Legacy Migration And Native Capabilities

Gugu Flash replaces the deprecated guguclub project. Legacy code and data can be used only as migration references:

- historical device identity fields
- BLE binding/sync flow experience
- friend graph and IM product references
- resonance history ideas
- reusable hardware packaging scripts

Gugu Flash must own:

- login and user identity
- device binding
- BLE and device sync
- payment/order
- content download
- social/community backend

Preferred MVP path:

Build the backend and shared domain layer first, then ship a native-app-shaped Web prototype before implementing client-specific shells. The mini program should reuse the same Gugu Flash APIs and content schema instead of becoming the architectural center.

## Milestone 5: Official Hardware Adaptation

Selected H5 packs enter official adaptation:

```text
GuguH5Pack
  -> operator review
  -> import into Gugu Flash Hardware Studio
  -> adapt into HardwarePack / device story
  -> LVGL/device preview
  -> compile/export hardware story.json or bundle
  -> publish through Gugu Flash backend
```

The ordinary user never generates device code directly.

## Milestone 6: Device Download

In device-capable clients, add:

- official content library
- hardware-ready detail page
- compatible device check
- install to bound device
- installed content management

Priority by client:

1. Native app: full device management and download.
2. Mini program: use Gugu Flash device APIs where platform capabilities allow.
3. Web/H5: show hardware-ready content and hand off to app or mini program for installation when browser capabilities are insufficient.

Gugu Flash should own the replacement content delivery endpoints for check, download, install, rollback, and status reporting.

## Ranking Signals

First-pass score:

```text
score =
  likes * 1.2
  + saves * 2
  + remixes * 4
  + plays * completionRate * 0.15
  - reports * 20
```

This is enough for operator triage. Personalized recommendations can come later.

## Review Rules

Separate two review layers:

- H5 publish review: community safety and copyright screen.
- Hardware candidate review: strict device compatibility, asset ownership, performance, and brand quality.

Hardware candidate review must be manual at first.
