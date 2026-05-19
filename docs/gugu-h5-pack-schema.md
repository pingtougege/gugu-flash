# GuguH5Pack Schema v0.1

`GuguH5Pack` is the consumer-facing interactive H5 format. It is intentionally more flexible than device `story.json`, but still structured enough to support review, analytics, remix, and future hardware adaptation.

```json
{
  "id": "h5_rain_room",
  "title": "Rain Room",
  "author": {
    "id": "user_mika",
    "name": "Mika"
  },
  "status": "public_h5",
  "hardwareStatus": "h5_only",
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

## Hardware Adaptation Rule

Only official tooling converts H5 content into hardware content. The conversion result should be produced in `guguclub-ui` or a dedicated adaptation service, then published into `guguclub/backend`.
