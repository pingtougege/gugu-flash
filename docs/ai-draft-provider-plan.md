# AI Draft Provider Plan

Gugu Flash uses a backend-only AI provider for text-game draft generation.
The same backend boundary also owns optional image generation for draft assets.

## Provider Order

The backend follows the same provider env convention as `guguclub-ui`, but it only reads environment files inside this project unless an explicit env-file path is provided:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
STORY_IMPORT_LLM_PROVIDER=deepseek

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
STORY_IMPORT_LLM_PROVIDER=openai

SEEDREAM_API_KEY=your_seedream_key
SEEDREAM_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
SEEDREAM_MODEL=doubao-seedream-5-0-260128
```

For local development, the backend reads env vars from:

1. Current process environment.
2. `GUGU_FLASH_AI_ENV_FILE`, if set.
3. `apps/backend/.env`, if present.

Real keys must never be committed.

## API

```text
POST /flash/ai/create-draft
POST /flash/ai/generate-image
```

Request:

```json
{
  "prompt": "雨夜便利店里，主角遇到会预言明天的猫",
  "template": "adventure",
  "options": {
    "originType": "original",
    "ipId": "rain_gugu_universe",
    "personaId": "rain_gugu"
  }
}
```

Response data:

```json
{
  "item": "GuguH5Pack",
  "meta": {
    "status": "used",
    "provider": "deepseek",
    "model": "deepseek-chat"
  }
}
```

If no key is configured or the provider fails, the endpoint returns a valid local-rule draft with:

```json
{
  "meta": {
    "status": "fallback",
    "provider": "local_rules"
  }
}
```

Image generation accepts one asset prompt from the draft `assetPlan` and returns an asset preview:

```json
{
  "item": {
    "status": "used",
    "provider": "seedream",
    "model": "doubao-seedream-5-0-260128",
    "imageUrl": "data:image/jpeg;base64,...",
    "sourceStatement": {
      "sourceType": "ai_generated",
      "provider": "seedream"
    }
  }
}
```

If image generation is disabled, missing a key, or provider output is empty, the endpoint returns a local preview image with `status: "fallback"` so the creator UI still has a visible placeholder.

## Safety Boundary

- API keys stay in the backend process.
- The browser never receives provider keys.
- AI output is merged into a `GuguH5Pack` skeleton.
- The merged pack must pass `validatePack`.
- If validation fails, the backend falls back to local rules.
- Generated image previews carry AI source statements for later storage and review.
