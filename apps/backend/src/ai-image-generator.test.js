import assert from "node:assert/strict";
import test from "node:test";

import { generateAiImage, getGeneratedAiImage } from "./ai-image-generator.js";
import { validateAssetUploadSecurity } from "./asset-security.js";

test("AI image fallback returns a safe PNG Asset with source statement", async () => {
  const previousDisabled = process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
  process.env.GUGU_FLASH_IMAGE_AI_DISABLED = "1";
  try {
    const response = await generateAiImage({
      id: "comic_panel_visual",
      storyProjectId: "story_project_visuals",
      storyProjectVersionId: "spv_visuals",
      panelId: "panel_start",
      sceneId: "start",
      renderJobId: "ai_job_visuals",
      usage: "comic_panel_visual",
      prompt: "rainy neon storefront panel",
    });
    const asset = response.item;

    assert.match(asset.id, /^asset_/);
    assert.equal(asset.kind, "image");
    assert.equal(asset.usage, "comic_panel_visual");
    assert.equal(asset.storyProjectId, "story_project_visuals");
    assert.equal(asset.panelId, "panel_start");
    assert.equal(asset.renderJobId, "ai_job_visuals");
    assert.equal(asset.mediaType, "image/png");
    assert.equal(asset.filename.endsWith(".png"), true);
    assert.match(asset.imageUrl, /^data:image\/png;base64,/);
    assert.equal(asset.securityPolicyVersion, "gugu_flash_asset_security_v1");
    assert.equal(asset.sourceStatement.sourceType, "ai_generated");
    assert.equal(asset.sourceStatement.rightsAcknowledged, true);
    assert.deepEqual(validateAssetUploadSecurity(asset), []);
  } finally {
    if (previousDisabled === undefined) delete process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
    else process.env.GUGU_FLASH_IMAGE_AI_DISABLED = previousDisabled;
  }
});

test("AI image success preserves character metadata and sanitizes stored asset ids", async () => {
  const previousApiKey = process.env.SEEDREAM_API_KEY;
  const previousDisabled = process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
  const previousFormat = process.env.SEEDREAM_OUTPUT_FORMAT;
  const previousFetch = globalThis.fetch;
  process.env.SEEDREAM_API_KEY = "test_key";
  delete process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
  process.env.SEEDREAM_OUTPUT_FORMAT = "png";
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({
      data: [{
        b64_json: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        revised_prompt: "revised character portrait prompt",
      }],
    }),
  });

  try {
    const response = await generateAiImage({
      id: "asset_/../../portrait",
      storyProjectId: "story_project_visuals",
      storyProjectVersionId: "spv_visuals",
      sceneId: "start",
      characterId: "char_clockmaker",
      characterName: "旧钟匠",
      renderJobId: "ai_job_portrait",
      usage: "character_portrait",
      prompt: "gentle clockmaker portrait",
    });
    const asset = response.item;

    assert.equal(asset.usage, "character_portrait");
    assert.equal(asset.characterId, "char_clockmaker");
    assert.equal(asset.characterName, "旧钟匠");
    assert.equal(asset.renderJobId, "ai_job_portrait");
    assert.match(asset.id, /^asset_/);
    assert.equal(asset.id.includes(".."), false);
    assert.equal(asset.id.includes("/"), false);
    assert.equal(asset.mediaType, "image/png");
    assert.match(asset.imageUrl, /^\/flash\/ai\/generated-images\/asset_/);
    assert.equal(asset.imageUrl.includes(".."), false);
    assert.equal(getGeneratedAiImage(asset.id)?.contentType, "image/png");
    assert.equal(asset.sourceStatement.prompt, "gentle clockmaker portrait");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.SEEDREAM_API_KEY;
    else process.env.SEEDREAM_API_KEY = previousApiKey;
    if (previousDisabled === undefined) delete process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
    else process.env.GUGU_FLASH_IMAGE_AI_DISABLED = previousDisabled;
    if (previousFormat === undefined) delete process.env.SEEDREAM_OUTPUT_FORMAT;
    else process.env.SEEDREAM_OUTPUT_FORMAT = previousFormat;
  }
});

test("AI image provider failures fallback instead of throwing", async () => {
  const previousApiKey = process.env.SEEDREAM_API_KEY;
  const previousDisabled = process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
  const previousFetch = globalThis.fetch;
  process.env.SEEDREAM_API_KEY = "test_key";
  delete process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
  globalThis.fetch = async () => ({
    ok: false,
    statusText: "Bad Gateway",
    json: async () => {
      throw new Error("not json");
    },
  });

  try {
    const response = await generateAiImage({
      usage: "scene_background",
      sceneId: "start",
      prompt: "rainy storefront background",
    });
    const asset = response.item;

    assert.equal(asset.status, "fallback");
    assert.equal(asset.usage, "scene_background");
    assert.equal(asset.sceneId, "start");
    assert.equal(asset.reason, "provider_non_json_response");
    assert.match(asset.imageUrl, /^data:image\/png;base64,/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiKey === undefined) delete process.env.SEEDREAM_API_KEY;
    else process.env.SEEDREAM_API_KEY = previousApiKey;
    if (previousDisabled === undefined) delete process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
    else process.env.GUGU_FLASH_IMAGE_AI_DISABLED = previousDisabled;
  }
});
