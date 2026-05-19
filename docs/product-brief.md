# Gugu Flash Product Brief

## Positioning

Gugu Flash is a full-platform social content app for electronic badge fans. Users browse, play, co-create, remix, and publish interactive H5 badge stories across native apps, Web/H5, and mini program channels. Hardware output is not user-generated directly. Instead, popular and compliant H5 works enter an official adaptation pipeline and become downloadable device content.

## Why This Shape Works

Direct user-to-device code generation has high risk:

- Hardware resources are constrained.
- Runtime protocol support is limited.
- User-generated assets need copyright and safety review.
- Device crashes harm trust more than H5 rendering bugs.

The safer funnel is:

```text
UGC H5 creation
  -> feed distribution
  -> data and community validation
  -> official curation
  -> hardware adaptation
  -> device download
```

## Primary Roles

- Viewer: swipes through interactive badge content.
- Creator: starts from a prompt, template, or remix.
- Co-creator: joins a shared draft and edits dialogue/assets.
- Operator: reviews trending works and marks hardware candidates.
- Hardware user: downloads official adapted packs to a bound device.

## MVP Modules

1. Feed
   Full-screen swipe-style stream of interactive H5 works.

2. H5 Player
   Scene-based interaction with text, character, background, and choices.

3. Creator
   Template-first creation. User enters a theme sentence, the system creates a structured H5 draft.

4. Remix
   Any public work can be remixed into a new draft while preserving ancestry.

5. Signals
   Like, save, comment count, completion, share, remix count.

6. Operator Console
   Trending list and hardware candidate marking.

## Content Lifecycle

```text
draft
  -> pending_review
  -> public_h5
  -> trending
  -> hardware_candidate
  -> official_adapting
  -> hardware_ready
  -> device_available
```

## Relation To Existing Projects

- `guguclub`: user account, device binding, BLE, social graph, IM, resonance, hardware download.
- `guguclub-ui`: advanced authoring, StoryPack editing, LVGL preview, hardware adaptation tooling.
- `gugu-flash`: consumer-facing feed and lightweight H5 co-creation experience for native app, Web/H5, and mini program clients.

Recommended integration:

1. Keep Gugu Flash H5 content independent from device code.
2. Build the product backend and `GuguH5Pack` protocol as the source of truth.
3. Ship clients from the same product surface: native app first for daily use, Web/H5 for sharing, mini program for WeChat distribution.
4. Add publish/export adapters from Gugu Flash to `guguclub-ui`.
5. Let official operators adapt selected packs in `guguclub-ui`.
6. Publish hardware-ready content to `guguclub/backend`.
7. Expose download/install in every device-capable client, with mini program support as one channel rather than the whole product.

## Platform Strategy

The platform should not be designed around a single client. Keep these layers separate:

```text
GuguH5Pack protocol and backend APIs
  -> shared feed/player/creator domain logic
  -> native app client
  -> Web/H5 sharing client
  -> WeChat mini program client
  -> official operation and hardware adaptation tools
```

Suggested client responsibilities:

- Native app: primary consumer app, content feed, creation, social, push, device management, future BLE/native capabilities.
- Web/H5: share landing, embedded player, lightweight browsing, campaign pages, creator preview.
- Mini program: WeChat acquisition, quick browsing, account/device bridge, lightweight creation where platform limits allow.
- Operator web console: review, ranking, hardware candidate selection, export to `guguclub-ui`.
