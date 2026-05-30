import assert from "node:assert/strict";
import test from "node:test";

import { generateAiImage } from "./ai-image-generator.js";
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
