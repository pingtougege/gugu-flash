# GuguH5Pack Schema v0.1

`GuguH5Pack` is the consumer-facing interactive H5 format. It is intentionally more flexible than device `story.json`, but still structured enough to support review, analytics, remix, and future hardware adaptation.

```json
{
  "id": "h5_rain_room",
  "schemaVersion": "gugu_h5_pack_v1",
  "title": "Rain Room",
  "author": {
    "id": "user_mika",
    "name": "Mika"
  },
  "capabilities": ["scene_graph", "branching", "uploaded_assets", "basic_audio"],
  "status": "public_h5",
  "hardwareStatus": "h5_only",
  "storeStatus": "not_applied",
  "contentOrigin": "original",
  "ipName": null,
  "zoneId": "healing",
  "zoneName": "情绪陪伴区",
  "persona": {
    "id": "rain_gugu",
    "name": "雨天咕咕",
    "avatar": "☔",
    "roleType": "official",
    "tagline": "轻声陪你把今天过完。",
    "cloneOf": null
  },
  "fanworkOf": null,
  "rightsAcknowledgedAt": null,
  "cover": {
    "background": "linear-gradient(160deg, #0f172a, #155e75)",
    "character": "☔"
  },
  "tags": ["healing", "rain", "companion"],
  "metrics": {
    "plays": 1280,
    "likes": 320,
    "saves": 96,
    "comments": 41,
    "remixes": 12,
    "completionRate": 0.72
  },
  "scenes": [
    {
      "id": "start",
      "background": "linear-gradient(160deg, #0f172a, #155e75)",
      "character": "☔",
      "speaker": "Gugu",
      "text": "The rain sounds softer when you are here.",
      "actions": [
        {
          "label": "Tap the window",
          "goto": "window"
        }
      ]
    }
  ],
  "entrySceneId": "start",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000,
  "remixOf": null
}
```

## Status Values

These values are prototype/view-model values. In the backend, `Work.status`, `WorkVersion.status`, `StoreListing.status`, and `HardwarePack.status` should be separated. A published H5 work does not automatically become a store listing or a downloadable device pack.

- `draft`
- `pending_review`
- `public_h5`
- `hardware_candidate`
- `official_adapting`
- `hardware_ready`
- `device_available`

## Hardware Status Values

- `h5_only`
- `hardware_candidate`
- `hardware_ready`

## Content Origin Values

- `original`: user/platform original work.
- `fanwork`: derivative work. `ipName` is required before creation/publishing.

Remix creates `fanwork` by default and stores the source work id in `fanworkOf`/`remixOf`.

## Store Status Values

- `not_applied`: published H5, not submitted to the store.
- `rights_review`: user has signed the listing acknowledgement and the work is awaiting review.
- `listed`: visible in the store.
- `rejected`
- `delisted`

Publishing to the H5 feed does not imply store listing. Store listing is a separate commercial lifecycle and requires user rights acknowledgement plus platform review.

## Schema Version And Capabilities

- `schemaVersion`: required. It identifies the H5 content structure version, for example `gugu_h5_pack_v1`.
- `capabilities`: required. It lists the capabilities actually used by this work, such as `scene_graph`, `branching`, `uploaded_assets`, `basic_audio`, `timed_events`, `variables`, or `animation`.
- `schemaVersion` is locked after the content is published as a `WorkVersion`.
- If old content is migrated, create a new `WorkVersion` or migrated snapshot instead of mutating the locked source.

## Role Persona And Zone Fields

- `persona`: the role clone presented in feed/player. Official personas are safe defaults for creation.
- `zoneId`/`zoneName`: the social context for browsing, discovery, and future zone pages.

## Hardware Adaptation Rule

Only official tooling converts H5 content into hardware content. The conversion result should be produced in Gugu Flash Hardware Studio or a dedicated adaptation service, then published through Gugu Flash backend.

Hardware adaptation must use a fixed `WorkVersion` as source and produce an independent `HardwarePack`.

```json
{
  "formatVersion": "hw_pack_v1",
  "sourceWorkVersionId": "work_version_123",
  "sourceSchemaVersion": "gugu_h5_pack_v1",
  "compatibilityReportId": "compat_report_123"
}
```

H5 may use capabilities that current hardware does not support. Unsupported capabilities do not block H5 publishing; they only affect hardware adaptation. Before producing a `HardwarePack`, the backend should generate a compatibility report with one of these levels:

- `compatible`
- `degrade_required`
- `manual_adaptation_required`
- `incompatible`
