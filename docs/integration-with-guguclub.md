# Integration With Existing GuguClub Projects

## Existing Assets

`guguclub`

- WeChat mini program
- login and token flow
- BLE device binding
- device identity via `deviceIdHex`
- social radar
- friends and IM
- resonance history
- Spring Cloud backend with story content import and delivery

`guguclub-ui`

- React/FastAPI authoring environment
- `StoryPack` model
- story import pipeline
- image AI
- LVGL preview
- device bundle/codegen scripts

`gugu-flash`

- user-facing H5 content feed
- lightweight creation and remix loop
- operator hardware candidate funnel
- `GuguH5Pack` schema
- shared product surface for native app, Web/H5, and mini program clients

## Boundary

Do not make `GuguH5Pack` equal to device `story.json`.

`GuguH5Pack` is for social consumption and fast UGC iteration.

Device `story.json` is an official compiled artifact with hard runtime constraints.

## Recommended Data Flow

```text
User creates in Gugu Flash
  -> GuguH5Pack saved as public H5
  -> feed distribution and interaction data
  -> operator marks hardware candidate
  -> candidate exported/imported into guguclub-ui
  -> official adaptation to StoryPack/device story
  -> publish to guguclub backend
  -> device-capable clients download/install
```

## Full-Platform Client Plan

Do not make the mini program the product center. Treat it as one client that consumes the same backend and `GuguH5Pack` protocol as the native app and Web/H5 clients.

Shared product routes:

```text
feed
player
create
work-detail
my-works
official-picks
notifications
profile
device-install
```

Client-specific shells:

```text
apps/native
  iOS and Android app shell, push, upload, device capabilities, deep links

apps/web
  public H5 player, share pages, creator preview, SEO/campaign pages

apps/miniprogram
  WeChat distribution, login bridge, quick browse/create, device bridge

apps/operator
  review queue, ranking, hardware candidate workflow, export to guguclub-ui
```

If this is embedded into `guguclub/miniprogram` later, the likely pages are:

```text
subpackages/flash/feed
subpackages/flash/player
subpackages/flash/create
subpackages/flash/work-detail
subpackages/flash/my-works
subpackages/flash/official-picks
subpackages/flash/device-install
```

Reuse from `guguclub`:

- login token from current app storage
- user profile from `smartgoods/user`
- device list from current device APIs
- social relationship/IM from current social modules

## First Backend Adapter

Until a full backend exists, this repo can export/import JSON. The first real adapter should be HTTP-first so every client can use it.

When adding real publish APIs, start with:

```text
POST /api/h5-packs
GET  /api/feed
POST /api/h5-packs/:id/remix
POST /api/operator/hardware-candidates
```

Then add a bridge:

```text
POST /api/operator/hardware-candidates/:id/export-to-guguclub-ui
```

That endpoint should create a draft in `guguclub-ui`, not publish to hardware directly.
