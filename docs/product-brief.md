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
   Creation starts with lightweight rights metadata: original or derivative work. Derivative works must select an IP from the platform IP pool before a draft can be generated or published.

4. Remix
   Any public work can be remixed into a new draft while preserving ancestry.
   Remix creates a derivative work by default and stores the source work title or source IP as the derivative IP reference.

5. Signals
   Like, save, comment count, completion, share, remix count.

6. Operator Console
   Trending list and hardware candidate marking.

7. IP Zones, Personas, And Genres
   Works belong to an IP from the platform IP pool, such as a platform original universe, user original project, authorized IP, or community fan IP. Users pick a persona inside that IP before creation. An IP zone is opened later only after the IP reaches community thresholds and a user applies for the zone. Emotional companion, workday, duo-sync, and pixel adventure are genre channels/template tags, not IP zones.

8. Store Listing
   Publishing an H5 work is separate from store listing. Store listing is a later application step where the user acknowledges originality/IP authorization responsibility, then the work enters rights review before it can become purchasable/downloadable.

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

Store listing is a parallel commercial lifecycle:

```text
public_h5
  -> store_application
  -> rights_review
  -> listed
  -> downloaded
  -> synced_to_device
```

Rights rules:

- `original`: can be published, recommended, remixed, and submitted for store or hardware review.
- `fanwork`: must select an IP from the platform IP pool. Any IP-pool work can enter recommendation, store listing, and hardware review if the IP is not restricted or blocked and the work passes the relevant review.
- User acknowledgement lowers ambiguity but does not replace platform takedown, complaint, and review obligations.

## Relation To Legacy Projects

- `guguclub`: deprecated legacy project. It can provide migration references for device identity, BLE flow, historical device constraints, and content download experience, but it is not a runtime dependency.
- `guguclub-ui`: deprecated legacy tooling. Useful StoryPack, LVGL preview, and packaging ideas should be migrated into Gugu Flash Hardware Studio.
- `gugu-flash`: new main product replacing guguclub, including account, device, content, store, hardware download, native app, Web/H5, and mini program clients.

Recommended direction:

1. Keep Gugu Flash H5 content independent from device code.
2. Build the Gugu Flash backend and `GuguH5Pack` protocol as the source of truth.
3. Ship clients from the same product surface: native app first for daily use, Web/H5 for sharing, mini program for WeChat distribution.
4. Build Gugu Flash Hardware Studio for official hardware adaptation.
5. Let official operators adapt selected packs in Hardware Studio.
6. Publish hardware-ready content through Gugu Flash backend.
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
- Operator web console: review, ranking, hardware candidate selection, export to Gugu Flash Hardware Studio.
