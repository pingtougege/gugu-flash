# Implementation Roadmap

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

- FastAPI or Spring Boot, whichever is easier to integrate with the current GuguClub deployment.
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

## Milestone 4: GuguClub Integration

Use existing `guguclub` capabilities:

- WeChat login and user identity
- device binding
- friend graph
- IM
- resonance history

Integration options should be treated as channels, not mutually exclusive product directions:

1. Native app uses GuguClub identity, social, and device APIs directly.
2. Web/H5 uses public share pages plus login when the user wants to create, remix, comment, or install.
3. Mini program embeds the same product loop where WeChat distribution matters.

Preferred MVP path:

Build the backend and shared domain layer first, then ship a native-app-shaped Web prototype before implementing client-specific shells. The mini program should reuse the same APIs and content schema instead of becoming the architectural center.

## Milestone 5: Official Hardware Adaptation

Selected H5 packs enter official adaptation:

```text
GuguH5Pack
  -> operator review
  -> import into guguclub-ui
  -> adapt into StoryPack
  -> LVGL/device preview
  -> compile/export hardware story.json or bundle
  -> publish to guguclub/backend
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
2. Mini program: use existing GuguClub device routes where available.
3. Web/H5: show hardware-ready content and hand off to app or mini program for installation when browser capabilities are insufficient.

Use `guguclub/backend` content delivery endpoints where possible:

- `/content/check`
- `/content/pull`
- `/content/import`

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
