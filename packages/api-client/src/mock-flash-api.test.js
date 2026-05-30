import assert from "node:assert/strict";
import test from "node:test";

import {
  GUGU_COMIC_EPISODE_SCHEMA_VERSION,
  GUGU_H5_SCHEMA_VERSION,
  GUGU_IP_POOL,
  GUGU_STORY_PROJECT_SCHEMA_VERSION,
  ROLE_PERSONAS,
  validateDeviceSyncEvidence,
  validateStoryProject,
} from "../../core/src/index.js";
import { createMockFlashApi } from "./mock-flash-api.js";

function makePack(id, overrides = {}) {
  return {
    id,
    schemaVersion: GUGU_H5_SCHEMA_VERSION,
    title: overrides.title || `作品 ${id}`,
    author: { id: "user_local", name: "你" },
    capabilities: ["scene_graph", "branching"],
    status: "public_h5",
    hardwareStatus: "h5_only",
    storeStatus: "not_applied",
    contentOrigin: "original",
    ipId: "rain_gugu_universe",
    ipName: null,
    zoneId: "healing",
    zoneName: "情绪陪伴区",
    persona: {
      id: "rain_gugu",
      name: "雨天咕咕",
      avatar: "☔",
      roleType: "official",
      tagline: "轻声陪你把今天过完。",
      cloneOf: null,
    },
    fanworkOf: null,
    rightsAcknowledgedAt: null,
    cover: { background: "#111827", character: "☔" },
    tags: ["原创"],
    metrics: { plays: 0, likes: 0, saves: 0, comments: 0, remixes: 0, completionRate: 0 },
    entrySceneId: "start",
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
    remixOf: null,
    scenes: [
      {
        id: "start",
        background: "#111827",
        character: "☔",
        speaker: "雨天咕咕",
        text: "开始。",
        actions: [{ label: "结束", goto: "end" }],
      },
      {
        id: "end",
        background: "#020617",
        character: "💫",
        speaker: "雨天咕咕",
        text: "结束。",
        actions: [{ label: "重来", goto: "start" }],
      },
    ],
    ...overrides,
  };
}

function createMemoryApi(seedPacks, options = {}) {
  let stored = structuredClone(seedPacks);
  return {
    api: createMockFlashApi({
      async loadPacks() {
        return structuredClone(stored);
      },
      async savePacks(nextPacks) {
        stored = structuredClone(nextPacks);
      },
      ...options,
    }),
    getStored() {
      return stored;
    },
  };
}

test("mock AI draft generation also returns a StoryProject", async () => {
  const { api } = createMemoryApi([]);
  const response = await api.createAiDraft("一个雨夜便利店分支故事", "adventure");
  const listed = await api.listStoryProjects();

  assert.equal(response.item.storyProjectId, response.storyProject.id);
  assert.equal(response.storyProject.schemaVersion, GUGU_STORY_PROJECT_SCHEMA_VERSION);
  assert.equal(response.storyProject.status, "ready_to_preview");
  assert.deepEqual(validateStoryProject(response.storyProject), []);
  assert.equal(listed.items.some((item) => item.id === response.storyProject.id), true);
});

test("mock StoryProject update persists a single scene body edit", async () => {
  const { api } = createMemoryApi([]);
  const created = await api.createAiDraft("一间深夜修理铺遇到会说话的旧钟", "healing");
  const project = structuredClone(created.storyProject);
  const scene = project.script.scenes.find((item) => item.id === project.storyGraph.entryNodeId) || project.script.scenes[0];
  scene.text = "改过的单场景正文会被专业工作台读回。";

  const updated = await api.updateStoryProject(project.id, project);
  const fetched = await api.getStoryProject(project.id);
  const updatedScene = updated.item.script.scenes.find((item) => item.id === scene.id);
  const fetchedScene = fetched.item.script.scenes.find((item) => item.id === scene.id);

  assert.equal(updatedScene.text, "改过的单场景正文会被专业工作台读回。");
  assert.equal(fetchedScene.text, "改过的单场景正文会被专业工作台读回。");
});

test("mock StoryProject comic compile returns a ComicEpisode", async () => {
  const { api } = createMemoryApi([]);
  const created = await api.createAiDraft("一间深夜修理铺遇到会说话的旧钟", "healing");
  const project = structuredClone(created.storyProject);
  project.title = "修理铺漫剧分镜";
  project.script.scenes[0].shotType = "mock_wide_shot";
  project.script.scenes[0].caption = "Mock edited storyboard caption.";
  project.script.scenes[0].visualPrompt = "mock storyboard visual prompt";
  project.script.scenes[0].generatedImage = {
    id: "asset_mock_panel_start",
    imageUrl: "https://cdn.example.test/mock/start.png",
  };

  const compiled = await api.compileStoryProjectComic(project.id, {
    project,
    episodeId: "comic_mock_story_project",
  });

  assert.equal(compiled.item.id, "comic_mock_story_project");
  assert.equal(compiled.item.schemaVersion, GUGU_COMIC_EPISODE_SCHEMA_VERSION);
  assert.equal(compiled.item.targetType, "ComicEpisode");
  assert.equal(compiled.item.storyProjectId, project.id);
  assert.equal(compiled.item.title, "修理铺漫剧分镜");
  assert.equal(compiled.item.panelCount, project.storyGraph.nodes.length);
  assert.equal(compiled.item.panels[0].shotType, "mock_wide_shot");
  assert.equal(compiled.item.panels[0].caption, "Mock edited storyboard caption.");
  assert.equal(compiled.item.panels[0].visualPrompt, "mock storyboard visual prompt");
  assert.equal(compiled.item.panels[0].imageUrl, "https://cdn.example.test/mock/start.png");
  assert.equal(compiled.episode.id, compiled.item.id);
  assert.equal(compiled.project.title, "修理铺漫剧分镜");
  assert.deepEqual(compiled.item.validationErrors, []);
});

test("mock StoryProject version restore replaces the current project", async () => {
  const { api } = createMemoryApi([]);
  const created = await api.createAiDraft("一间深夜修理铺遇到会说话的旧钟", "healing");
  const originalProject = structuredClone(created.storyProject);
  originalProject.title = "修理铺初版";
  const version = await api.createStoryProjectVersion(originalProject.id, {
    project: originalProject,
    label: "初版快照",
  });
  const editedProject = structuredClone(version.project);
  editedProject.title = "修理铺改写版";
  editedProject.script.scenes[0].text = "这段文字应该会被版本恢复覆盖。";
  await api.updateStoryProject(editedProject.id, editedProject);

  const restored = await api.restoreStoryProjectVersion(originalProject.id, version.item.id, {
    reason: "恢复初版。",
  });

  assert.equal(restored.item.title, "修理铺初版");
  assert.equal(restored.item.script.scenes[0].text, originalProject.script.scenes[0].text);
  assert.notEqual(restored.item.versionId, version.item.id);
  assert.equal(restored.item.restoredFromVersionId, version.item.id);
  assert.equal(restored.version.id, restored.item.versionId);
  assert.equal(restored.version.status, "restored");
  assert.equal(restored.version.projectSnapshot.versionId, restored.item.versionId);
  assert.equal(restored.restoredFromVersion.id, version.item.id);
  const fetched = await api.getStoryProject(originalProject.id);
  assert.equal(fetched.item.title, "修理铺初版");
  assert.equal(fetched.item.versionId, restored.version.id);

  const publishedSnapshotProject = {
    ...fetched.item,
    title: "修理铺已发布快照",
    status: "published",
    outputWorkId: "h5_previous_publish",
    publishedAt: 1760000001000,
  };
  const publishedVersion = await api.createStoryProjectVersion(originalProject.id, {
    project: publishedSnapshotProject,
    label: "已发布快照",
    status: "published",
  });
  const restoredPublished = await api.restoreStoryProjectVersion(originalProject.id, publishedVersion.item.id);
  assert.equal(restoredPublished.item.title, "修理铺已发布快照");
  assert.equal(restoredPublished.item.status, "ready_to_preview");
  assert.equal(restoredPublished.item.outputWorkId, null);
  assert.equal(restoredPublished.item.publishedAt, null);
  assert.equal(restoredPublished.item.restoredFromVersionId, publishedVersion.item.id);
  assert.equal(restoredPublished.version.status, "restored");

  const other = await api.createAiDraft("另一间店的独立故事", "healing");
  const mismatch = await api.restoreStoryProjectVersion(other.storyProject.id, version.item.id);
  assert.equal(mismatch.reason, "version_mismatch");
  assert.equal(mismatch.item, null);
});

test("mock AI image generation returns a safe PNG preview with source statement", async () => {
  const { api } = createMemoryApi([]);
  const generated = await api.generateAiImage({
    id: "comic_panel_visual",
    prompt: "rainy neon storefront panel",
  });

  assert.match(generated.item.imageUrl, /^data:image\/png;base64,/);
  assert.equal(generated.item.mediaType, "image/png");
  assert.equal(generated.item.filename, "comic_panel_visual.png");
  assert.equal(generated.item.sourceStatement.sourceType, "ai_generated");
  assert.equal(generated.item.sourceStatement.rightsAcknowledged, true);
  assert.match(generated.item.id, /^asset_/);
  assert.equal(generated.item.kind, "image");
  assert.equal(generated.item.usage, "comic_panel_visual");
  assert.equal(generated.item.securityPolicyVersion, "gugu_flash_asset_security_v1");
  assert.equal(generated.renderJob, null);
});

test("mock asset library registers and filters StoryProject assets", async () => {
  const { api } = createMemoryApi([]);
  const created = await api.createAiDraft("一间深夜修理铺遇到会说话的旧钟", "healing");
  const asset = await api.createAsset({
    storyProjectId: created.storyProject.id,
    kind: "image",
    usage: "comic_panel_visual",
    filename: "panel-start.png",
    mediaType: "image/png",
    sizeBytes: 1024,
    imageUrl: "https://cdn.example.test/panels/start.png",
    sourceStatement: {
      sourceType: "original",
      creatorUserId: "user_local",
      rightsAcknowledged: true,
    },
  });
  const fetched = await api.getAsset(asset.item.id);
  const updated = await api.updateAssetSourceStatement(asset.item.id, {
    sourceType: "ai_generated",
    provider: "mock_preview",
    model: "mock_preview",
    prompt: "panel repaint",
    rightsAcknowledged: true,
  });
  const review = await api.submitAssetReview(asset.item.id);
  const listed = await api.listAssets({ storyProjectId: created.storyProject.id });
  const projectListed = await api.listStoryProjectAssets(created.storyProject.id);
  const unrelated = await api.listAssets({ storyProjectId: "story_project_other" });

  assert.match(asset.item.id, /^asset_/);
  assert.equal(asset.item.storyProjectId, created.storyProject.id);
  assert.equal(asset.item.kind, "image");
  assert.equal(asset.item.usage, "comic_panel_visual");
  assert.equal(asset.item.status, "uploaded");
  assert.equal(asset.item.uploaderUserId, "user_local");
  assert.equal(asset.item.securityPolicyVersion, "gugu_flash_asset_security_v1");
  assert.equal(asset.item.securityReport.status, "passed");
  assert.ok(asset.item.createdAt <= asset.item.updatedAt);
  assert.equal(fetched.item.id, asset.item.id);
  assert.equal(updated.item.sourceStatement.sourceType, "ai_generated");
  assert.equal(updated.item.sourceStatementStatus, "accepted");
  assert.equal(review.item.targetId, asset.item.id);
  assert.ok(review.item.requiredChecks.includes("source_statement"));
  assert.deepEqual(listed.items.map((item) => item.id), [asset.item.id]);
  assert.deepEqual(projectListed.items.map((item) => item.id), [asset.item.id]);
  assert.deepEqual(unrelated.items, []);
});

test("mock comic panel visual generation tracks render job and registered asset", async () => {
  const { api } = createMemoryApi([]);
  const created = await api.createAiDraft("一间深夜修理铺遇到会说话的旧钟", "healing");
  const sceneId = created.storyProject.script.scenes[0].id;
  const generated = await api.generateAiImage({
    storyProjectId: created.storyProject.id,
    panelId: "panel_start",
    sceneId,
    usage: "comic_panel_visual",
    prompt: "rainy repair shop establishing shot",
  });
  const fetchedJob = await api.getAiGenerationJob(generated.renderJob.id);
  const fetchedAsset = await api.getAsset(generated.item.id);
  const listed = await api.listAssets({
    storyProjectId: created.storyProject.id,
    usage: "comic_panel_visual",
  });
  const projectListed = await api.listStoryProjectAssets(created.storyProject.id);
  const runtime = api.exportRuntimeState();

  assert.match(generated.item.id, /^asset_/);
  assert.equal(generated.item.storyProjectId, created.storyProject.id);
  assert.equal(generated.item.panelId, "panel_start");
  assert.equal(generated.item.sceneId, sceneId);
  assert.equal(generated.item.createdByJobId, generated.renderJob.id);
  assert.equal(generated.item.renderJobId, generated.renderJob.id);
  assert.equal(generated.renderJob.stage, "comic_panel_visual_render");
  assert.equal(generated.renderJob.status, "succeeded");
  assert.equal(generated.renderJob.result.assetId, generated.item.id);
  assert.equal(generated.renderJob.result.panelId, "panel_start");
  assert.equal(fetchedJob.item.id, generated.renderJob.id);
  assert.equal(fetchedJob.item.result.assetId, generated.item.id);
  assert.equal(fetchedAsset.item.id, generated.item.id);
  assert.equal(fetchedAsset.item.sourceStatement.sourceType, "ai_generated");
  assert.ok(listed.items.some((item) => item.id === generated.item.id));
  assert.ok(projectListed.items.some((item) => item.id === generated.item.id));
  assert.ok(runtime.assets.some((item) => item.id === generated.item.id));
  assert.ok(runtime.aiGenerationJobs.some((item) => item.id === generated.renderJob.id));
});

test("applyStoreListing requires the rights acknowledgement", async () => {
  const { api, getStored } = createMemoryApi([makePack("h5_terms")]);

  const rejected = await api.applyStoreListing("h5_terms", false);

  assert.equal(rejected.accepted, false);
  assert.equal(getStored()[0].storeStatus, "not_applied");

  const accepted = await api.applyStoreListing("h5_terms", true);

  assert.equal(accepted.accepted, true);
  assert.equal(getStored()[0].storeStatus, "rights_review");
  assert.equal(typeof getStored()[0].rightsAcknowledgedAt, "number");
});

test("approveStoreListing makes an approved work visible in the store library", async () => {
  const { api, getStored } = createMemoryApi([makePack("h5_store")]);

  await api.applyStoreListing("h5_store", true);
  await api.approveStoreListing("h5_store");
  assert.equal(getStored()[0].storeStatus, "production_queued");
  assert.equal(getStored()[0].compatibilityReport.status, "passed");
  assert.equal(getStored()[0].compatibilityReport.compatibilityLevel, "compatible");
  assert.equal(getStored()[0].hardwarePack.compatibilityReportId, getStored()[0].compatibilityReport.id);
  assert.equal(getStored()[0].hardwarePack.status, "draft");
  await api.approveStoreListing("h5_store");
  assert.equal(getStored()[0].storeStatus, "producing");
  assert.equal(getStored()[0].hardwarePack.status, "building");
  await api.approveStoreListing("h5_store");
  assert.equal(getStored()[0].storeStatus, "pack_review");
  assert.equal(getStored()[0].hardwarePack.status, "reviewing");
  await api.approveStoreListing("h5_store");
  assert.equal(getStored()[0].storeStatus, "listed");
  assert.equal(getStored()[0].hardwarePack.status, "available");
  assert.equal(getStored()[0].hardwarePack.formatVersion, "hw_pack_v1");
  assert.equal(getStored()[0].hardwarePack.sourceWorkVersionId, getStored()[0].workVersion.id);
  assert.equal(getStored()[0].hardwarePack.compatibilityReportId, "compat_h5_store");
  assert.equal(getStored()[0].hardwarePack.packageSizeKb, getStored()[0].compatibilityReport.resourceBudget.actual.estimatedSizeKb);
  assert.match(getStored()[0].hardwarePack.checksum, /^sha256:h5_store:/);
  const dashboard = await api.getDeviceDashboard();

  assert.ok(dashboard.library.some((item) => item.packId === "h5_store"));
});

test("incompatible H5 can publish but cannot advance into hardware production", async () => {
  const { api, getStored } = createMemoryApi([
    makePack("h5_remote_asset", {
      capabilities: ["scene_graph", "network_asset"],
    }),
  ]);

  await api.applyStoreListing("h5_remote_asset", true);
  await api.approveStoreListing("h5_remote_asset");

  assert.equal(getStored()[0].storeStatus, "production_queued");
  assert.equal(getStored()[0].compatibilityReport.status, "failed");
  assert.equal(getStored()[0].compatibilityReport.compatibilityLevel, "incompatible");
  assert.equal(getStored()[0].hardwarePack, null);

  const blocked = await api.approveStoreListing("h5_remote_asset");
  const dashboard = await api.getOperatorDashboard();
  const report = await api.getCompatibilityReport("h5_remote_asset");

  assert.equal(blocked.blocked, true);
  assert.equal(blocked.reason, "hardware_compatibility_failed");
  assert.equal(getStored()[0].storeStatus, "production_queued");
  assert.equal(dashboard.hardwareQueue[0].stageLabel, "兼容未通过");
  assert.equal(dashboard.hardwareQueue[0].compatibilityLevel, "incompatible");
  assert.equal(dashboard.hardwareQueue[0].checksum, null);
  assert.equal(report.item.status, "failed");
});

test("operator dashboard exposes review queue, store queue, hardware queue, and logs", async () => {
  const { api } = createMemoryApi([makePack("h5_ops")]);

  await api.applyStoreListing("h5_ops", true);
  let dashboard = await api.getOperatorDashboard();

  assert.equal(dashboard.counts.reviewOpen, 1);
  assert.equal(dashboard.reviewTasks[0].targetType, "StoreListing");
  assert.equal(dashboard.reviewTasks[0].reviewType, "store_rights");
  assert.equal(dashboard.storeListings[0].status, "rights_review");
  assert.ok(dashboard.operationLogs.some((log) => log.action === "submit_store_listing"));

  const approved = await api.approveReviewTask(dashboard.reviewTasks[0].id, "材料完整");
  assert.equal(approved.item.status, "approved");

  dashboard = await api.getOperatorDashboard();
  assert.equal(dashboard.storeListings[0].status, "production_queued");
  assert.equal(dashboard.hardwareQueue[0].stageLabel, "等待制作");
  assert.ok(dashboard.operationLogs.some((log) => log.action === "approve_review_task"));
});

test("review rejection records a reason and migrates the target listing status", async () => {
  const { api, getStored } = createMemoryApi([makePack("h5_reject")]);

  await api.applyStoreListing("h5_reject", true);
  const dashboard = await api.getOperatorDashboard();
  const rejected = await api.rejectReviewTask(dashboard.reviewTasks[0].id, "素材来源不完整");
  const logs = await api.getOperationLogs();

  assert.equal(rejected.item.status, "rejected");
  assert.equal(rejected.item.reason, "素材来源不完整");
  assert.equal(getStored()[0].storeStatus, "rejected");
  assert.ok(logs.items.some((log) => log.action === "reject_review_task"));
});

test("IP pool separates IP entries from zone opening eligibility", async () => {
  const { api } = createMemoryApi([
    makePack("h5_workday_extra", {
      title: "工位额外作品",
      ipId: "workday_flash_project",
      zoneId: "workday",
      zoneName: "摸鱼上班区",
      persona: {
        id: "office_sprite",
        name: "工位小闪",
        avatar: "💡",
        roleType: "official",
        tagline: "上班时低调发光，下班时大胆逃跑。",
        cloneOf: null,
      },
    }),
  ]);

  const pool = await api.getIpPool();
  const rain = pool.items.find((item) => item.id === "rain_gugu_universe");
  const workday = pool.items.find((item) => item.id === "workday_flash_project");
  const soda = pool.items.find((item) => item.id === "soda_planet_fan");

  assert.equal(rain.hasZone, true);
  assert.equal(workday.hasZone, false);
  assert.equal(workday.zoneEligibility.eligible, true);
  assert.equal(soda.zoneEligibility.eligible, false);
  assert.ok(workday.personas.some((persona) => persona.id === "office_sprite"));

  const search = await api.getIpPool({ query: "汽水" });
  assert.deepEqual(search.items.map((item) => item.id), ["soda_planet_fan"]);
});

test("eligible IP can apply for zone and applicant becomes zone admin", async () => {
  const { api } = createMemoryApi([]);

  const before = await api.getIpZoneEligibility("workday_flash_project");
  assert.equal(before.item.eligible, true);
  assert.equal(before.item.hasZone, false);

  const result = await api.applyZoneApplication("workday_flash_project", "摸鱼宇宙已经有稳定作品和创作者。");
  assert.equal(result.accepted, true);
  assert.equal(result.item.status, "approved");
  assert.deepEqual(result.zone.adminUserIds, ["user_local"]);

  const after = await api.getIpDetail("workday_flash_project");
  assert.equal(after.item.hasZone, true);
  assert.equal(after.item.zone.adminNames[0], "你");

  const rejected = await api.applyZoneApplication("soda_planet_fan");
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.reason, "zone_not_eligible");
});

test("anime IP collector imports candidate IP and personas into the pool", async () => {
  const ipPool = structuredClone(GUGU_IP_POOL);
  const rolePersonas = structuredClone(ROLE_PERSONAS);
  const { api } = createMemoryApi([], { ipPool, rolePersonas });

  const preview = await api.searchAnimeIpCandidates({ query: "孤独摇滚" });
  assert.equal(preview.items[0].ipId, "mainstream_bocchi_the_rock");
  assert.equal(preview.items[0].importable, true);

  const result = await api.collectAnimeIpPool({ query: "孤独摇滚" });
  assert.equal(result.addedIpCount, 1);
  assert.equal(result.addedPersonaCount, 4);
  assert.equal(result.imported[0].id, "mainstream_bocchi_the_rock");
  assert.ok(result.imported[0].personas.some((persona) => persona.name === "后藤一里"));

  const pool = await api.getIpPool({ query: "波奇" });
  assert.equal(pool.items[0].id, "mainstream_bocchi_the_rock");
  assert.ok(pool.items[0].personas.some((persona) => persona.id === "bocchi_hitori"));

  const secondRun = await api.collectAnimeIpPool({ query: "孤独摇滚" });
  assert.equal(secondRun.addedIpCount, 0);
});

test("anime IP collector can sweep all web-wide candidates and complete existing roles", async () => {
  const ipPool = structuredClone(GUGU_IP_POOL);
  const rolePersonas = structuredClone(ROLE_PERSONAS);
  const { api } = createMemoryApi([], { ipPool, rolePersonas });

  const result = await api.collectAnimeIpPool({ sweepAll: true, limit: "all" });

  assert.ok(result.addedIpCount >= 7);
  assert.ok(result.supplementedIpCount >= 7);
  assert.ok(result.addedPersonaCount >= 70);
  const onePiece = (await api.getIpPool({ query: "海贼王" })).items[0];
  assert.ok(onePiece.personas.some((persona) => persona.id === "one_piece_robin"));
  const dragonBall = (await api.getIpPool({ query: "龙珠" })).items[0];
  assert.ok(dragonBall.personas.some((persona) => persona.id === "dragon_ball_bulma"));
});

test("anime IP collector can one-click import a large IP-only catalog", async () => {
  const ipPool = structuredClone(GUGU_IP_POOL);
  const rolePersonas = structuredClone(ROLE_PERSONAS);
  const { api } = createMemoryApi([], { ipPool, rolePersonas });

  const result = await api.collectAnimeIpPool({ sweepAll: true, limit: "all", ipOnly: true });

  assert.ok(result.addedIpCount >= 180);
  assert.equal(result.addedPersonaCount, 0);
  const spongeBob = result.imported.find((item) => item.id === "oneclick_screen_001_spongebob_squarepants");
  assert.equal(spongeBob.name, "SpongeBob SquarePants / 海绵宝宝");
  assert.equal(spongeBob.personas.length, 0);
});

test("anime IP collector can deepen characters for one IP", async () => {
  const ipPool = structuredClone(GUGU_IP_POOL);
  const rolePersonas = structuredClone(ROLE_PERSONAS);
  const { api } = createMemoryApi([], { ipPool, rolePersonas });

  const preview = await api.searchAnimeIpCharacters("mainstream_pokemon");
  assert.ok(preview.characterCount >= 1000);
  assert.ok(preview.missingPersonaCount >= 1000);
  assert.ok(preview.item.personas.some((persona) => persona.id === "pokemon_lucario"));

  const result = await api.collectAnimeIpCharacters("mainstream_pokemon");
  assert.equal(result.addedIpCount, 0);
  assert.equal(result.supplementedIpCount, 1);
  assert.ok(result.addedPersonaCount >= 1000);

  const pool = await api.getIpPool({ query: "路卡利欧" });
  assert.equal(pool.items[0].id, "mainstream_pokemon");
  assert.ok(pool.items[0].personas.some((persona) => persona.id === "pokemon_lucario"));
  const lateDexPool = await api.getIpPool({ query: "铁臂膀" });
  assert.equal(lateDexPool.items[0].id, "mainstream_pokemon");

  const secondRun = await api.collectAnimeIpCharacters("mainstream_pokemon");
  assert.equal(secondRun.addedPersonaCount, 0);
});

test("fanwork cannot be marked hardware ready before store listing review passes", async () => {
  const { api, getStored } = createMemoryApi([
    makePack("h5_fanwork", {
      contentOrigin: "fanwork",
      ipId: "soda_planet_fan",
      ipName: "汽水星球原创企划",
      tags: ["二创", "汽水星球原创企划"],
      storeStatus: "rights_review",
    }),
  ]);

  const result = await api.markHardwareReady("h5_fanwork");

  assert.equal(result.blocked, true);
  assert.equal(result.reason, "fanwork_requires_store_review");
  assert.equal(getStored()[0].hardwareStatus, "h5_only");
});

test("download and sync require the previous device-store step", async () => {
  const { api } = createMemoryApi([
    makePack("h5_top", {
      title: "高分包",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
    makePack("h5_not_owned", {
      title: "未拥有包",
      storeStatus: "listed",
      metrics: { plays: 800, likes: 80, saves: 20, comments: 0, remixes: 0, completionRate: 1 },
    }),
    makePack("h5_owned_not_downloaded", {
      title: "未下载包",
      storeStatus: "listed",
      metrics: { plays: 100, likes: 10, saves: 2, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);
  const dashboard = await api.getDeviceDashboard();
  const notOwned = dashboard.library.find((item) => item.packId === "h5_not_owned");
  const ownedNotDownloaded = dashboard.library.find((item) => item.packId === "h5_owned_not_downloaded");

  assert.equal(notOwned.ownership, "not_owned");
  assert.equal(ownedNotDownloaded.ownership, "not_owned");
  assert.equal(ownedNotDownloaded.downloadStatus, "not_downloaded");

  const downloadResult = await api.downloadBadgePack(notOwned.id);
  await api.purchaseBadgePack(ownedNotDownloaded.id);
  const syncResult = await api.syncBadgePack(ownedNotDownloaded.id);

  assert.equal(downloadResult.item, null);
  assert.equal(syncResult.blocked, true);
  assert.equal(syncResult.reason, "download_failed");
  assert.equal(syncResult.item.syncStatus, "failed");
});

test("purchase and free claim create orders before device entitlements", async () => {
  const { api } = createMemoryApi([
    makePack("h5_free_claim", {
      title: "免费包",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
    makePack("h5_paid_order", {
      title: "付费包",
      storeStatus: "listed",
      metrics: { plays: 700, likes: 80, saves: 20, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const initial = await api.getDeviceDashboard();
  const paidItem = initial.library.find((item) => item.packId === "h5_paid_order");
  const purchase = await api.purchaseBadgePack(paidItem.id);
  const orders = await api.getOrders();
  const settlements = await api.getSettlements();

  assert.equal(purchase.order.status, "paid");
  assert.equal(purchase.order.amount, paidItem.price);
  assert.equal(purchase.entitlement.status, "active");
  assert.equal(purchase.entitlement.deviceId, initial.activeDeviceId);
  assert.equal(purchase.entitlement.orderId, purchase.order.id);
  assert.ok(orders.items.some((order) => order.id === purchase.order.id));
  assert.ok(settlements.items.some((settlement) => settlement.orderId === purchase.order.id && settlement.status === "pending"));

  const orderOnly = await api.createOrder(paidItem.id);
  assert.equal(orderOnly.alreadyOwned, true);
  assert.equal(orderOnly.entitlement.orderId, purchase.order.id);

  await api.bindDevice({ personaId: "rain_gugu" });
  const nextDevice = await api.getDeviceDashboard();
  const freeItem = nextDevice.library.find((item) => item.packId === "h5_free_claim");
  const freeClaim = await api.purchaseBadgePack(freeItem.id);

  assert.equal(freeClaim.order.amount, 0);
  assert.equal(freeClaim.order.paymentProvider, "free_claim");
  assert.equal(freeClaim.order.status, "paid");
  assert.equal(freeClaim.entitlement.deviceId, nextDevice.activeDeviceId);

  const allSettlements = await api.getSettlements();
  assert.ok(allSettlements.items.some((settlement) => settlement.orderId === freeClaim.order.id && settlement.status === "no_cash"));
});

test("refund revokes device entitlement and allows a new order", async () => {
  const { api } = createMemoryApi([
    makePack("h5_refund_target", {
      title: "可退款包",
      storeStatus: "listed",
      metrics: { plays: 600, likes: 70, saves: 18, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const dashboard = await api.getDeviceDashboard();
  const item = dashboard.library.find((entry) => entry.packId === "h5_refund_target");
  const purchase = await api.purchaseBadgePack(item.id);
  const refund = await api.refundOrder(purchase.order.id, { reason: "用户未下载申请退款" });

  assert.equal(refund.item.status, "refunded");
  assert.equal(refund.entitlement.status, "revoked");
  assert.equal(refund.entitlement.revokedReason, "refund");
  assert.equal(refund.settlement.status, "refunded");

  const afterRefund = await api.getDeviceDashboard();
  const refundedItem = afterRefund.library.find((entry) => entry.packId === "h5_refund_target");
  assert.equal(refundedItem.ownership, "not_owned");
  assert.equal(refundedItem.entitlementStatus, "revoked");

  const downloadBlocked = await api.downloadBadgePack(item.id);
  assert.equal(downloadBlocked.item, null);

  const repurchase = await api.purchaseBadgePack(item.id);
  assert.equal(repurchase.order.status, "paid");
  assert.notEqual(repurchase.order.id, purchase.order.id);
  assert.equal(repurchase.entitlement.status, "active");
  assert.equal(repurchase.entitlement.downloadStatus, "not_downloaded");
});

test("provider payment callbacks require signature verification and grant entitlement once", async () => {
  const { api } = createMemoryApi([
    makePack("h5_payment_free", {
      title: "支付回调免费基线包",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
    makePack("h5_payment_callback", {
      title: "服务商支付回调包",
      storeStatus: "listed",
      metrics: { plays: 600, likes: 70, saves: 18, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const dashboard = await api.getDeviceDashboard();
  const item = dashboard.library.find((entry) => entry.packId === "h5_payment_callback");
  const orderOnly = await api.createOrder(item.id);
  assert.equal(orderOnly.item.status, "pending_payment");

  const invalid = await api.processPaymentCallback({
    providerEventId: "evt_payment_invalid",
    orderId: orderOnly.item.id,
    status: "succeeded",
    amount: orderOnly.item.amount,
    currency: orderOnly.item.currency,
  });
  const callback = await api.processPaymentCallback({
    signatureVerified: true,
    providerEventId: "evt_payment_callback_1",
    providerPaymentId: "pay_callback_1",
    orderId: orderOnly.item.id,
    status: "succeeded",
    amount: orderOnly.item.amount,
    currency: orderOnly.item.currency,
    reason: "支付服务商成功回调",
  });
  const duplicate = await api.processPaymentCallback({
    signatureVerified: true,
    providerEventId: "evt_payment_callback_1",
    providerPaymentId: "pay_callback_1",
    orderId: orderOnly.item.id,
    status: "succeeded",
    amount: orderOnly.item.amount,
    currency: orderOnly.item.currency,
    reason: "重复投递不应二次发放权益",
  });
  const logs = await api.getOperationLogs();

  assert.equal(invalid.blocked, true);
  assert.equal(invalid.reason, "invalid_payment_signature");
  assert.equal(callback.item.result, "paid");
  assert.equal(callback.order.status, "paid");
  assert.equal(callback.order.providerPaymentId, "pay_callback_1");
  assert.equal(callback.entitlement.status, "active");
  assert.equal(callback.settlement.status, "pending");
  assert.equal(duplicate.idempotent, true);
  assert.equal(duplicate.item.id, callback.item.id);
  assert.equal(logs.items.filter((log) => log.action === "payment_callback_paid" && log.targetId === orderOnly.item.id).length, 1);

  await api.bindDevice({ personaId: "rain_gugu" });
  const nextDashboard = await api.getDeviceDashboard();
  const nextItem = nextDashboard.library.find((entry) => entry.packId === "h5_payment_callback");
  const failedOrder = await api.createOrder(nextItem.id);
  const failed = await api.processPaymentCallback({
    signatureVerified: true,
    providerEventId: "evt_payment_callback_failed_1",
    providerPaymentId: "pay_callback_failed_1",
    orderId: failedOrder.item.id,
    status: "failed",
    amount: failedOrder.item.amount,
    currency: failedOrder.item.currency,
    reason: "card_declined",
  });

  assert.equal(failed.item.result, "failed");
  assert.equal(failed.order.status, "failed");
  assert.equal(failed.entitlement, null);
});

test("provider refund callbacks are idempotent and revoke entitlement once", async () => {
  const { api } = createMemoryApi([
    makePack("h5_refund_callback", {
      title: "服务商退款包",
      storeStatus: "listed",
      metrics: { plays: 600, likes: 70, saves: 18, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const dashboard = await api.getDeviceDashboard();
  const item = dashboard.library.find((entry) => entry.packId === "h5_refund_callback");
  const purchase = await api.purchaseBadgePack(item.id);
  const callback = await api.processRefundCallback({
    providerEventId: "evt_refund_callback_1",
    providerRefundId: "refund_callback_1",
    orderId: purchase.order.id,
    status: "succeeded",
    reason: "支付服务商退款成功回调",
  });
  const duplicate = await api.processRefundCallback({
    providerEventId: "evt_refund_callback_1",
    providerRefundId: "refund_callback_1",
    orderId: purchase.order.id,
    status: "succeeded",
    reason: "重复投递不应重复退款",
  });
  const logs = await api.getOperationLogs();
  const afterRefund = await api.getDeviceDashboard();
  const refundedItem = afterRefund.library.find((entry) => entry.packId === "h5_refund_callback");

  assert.equal(callback.item.result, "refunded");
  assert.equal(callback.order.status, "refunded");
  assert.equal(callback.entitlement.status, "revoked");
  assert.equal(callback.settlement.status, "refunded");
  assert.equal(duplicate.idempotent, true);
  assert.equal(duplicate.item.id, callback.item.id);
  assert.equal(duplicate.order.id, purchase.order.id);
  assert.equal(refundedItem.entitlementStatus, "revoked");
  assert.equal(logs.items.filter((log) => log.action === "refund_order" && log.targetId === purchase.order.id).length, 1);
});

test("rights freeze pauses listing and freezes related settlement records", async () => {
  const { api, getStored } = createMemoryApi([
    makePack("h5_freeze_target", {
      title: "待冻结包",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const before = await api.getDeviceDashboard();
  const item = before.library.find((entry) => entry.packId === "h5_freeze_target");
  const purchase = await api.purchaseBadgePack(item.id);
  const result = await api.freezeStoreListing("h5_freeze_target", "权利投诉初步成立，冻结收益。");
  const settlements = await api.getSettlements();
  const dashboard = await api.getOperatorDashboard();

  assert.equal(result.item.storeStatus, "frozen");
  assert.equal(getStored()[0].hardwarePack.status, "paused");
  assert.ok(result.settlements.some((settlement) => settlement.orderId === purchase.order.id && settlement.status === "frozen"));
  assert.ok(settlements.items.some((settlement) => settlement.orderId === purchase.order.id && settlement.freezeReason === "权利投诉初步成立，冻结收益。"));
  assert.equal(dashboard.counts.settlementFrozen >= 1, true);

  const frozen = settlements.items.find((settlement) => settlement.orderId === purchase.order.id);
  const released = await api.releaseSettlement(frozen.id, "申诉材料通过，释放冻结。");
  assert.equal(released.item.status, purchase.order.amount > 0 ? "pending" : "no_cash");
});

test("report resolution creates a moderation action and limits recommendation", async () => {
  const { api, getStored } = createMemoryApi([
    makePack("h5_report_target", {
      title: "被举报作品",
      metrics: { plays: 100, likes: 8, saves: 2, comments: 0, remixes: 0, completionRate: 0.8 },
    }),
  ]);

  const submitted = await api.submitReport({
    targetType: "Work",
    targetId: "h5_report_target",
    reason: "hardware_unsuitable",
    description: "用户认为该内容不适合继续推荐。",
  });
  let dashboard = await api.getOperatorDashboard();

  assert.equal(submitted.item.status, "submitted");
  assert.equal(dashboard.counts.governanceOpen, 1);
  assert.equal(dashboard.governanceCases[0].caseType, "report");

  const resolved = await api.resolveReport(submitted.item.id, "limit_recommend", "举报成立，限制推荐。");
  const actions = await api.getModerationActions();

  assert.equal(resolved.item.status, "action_taken");
  assert.equal(getStored()[0].status, "public_limited");
  assert.ok(actions.items.some((action) => action.sourceId === submitted.item.id && action.action === "limit_recommend"));

  dashboard = await api.getOperatorDashboard();
  assert.equal(dashboard.counts.governanceOpen, 1);
});

test("rights claim freezes listing and appeal restore releases the target", async () => {
  const { api, getStored } = createMemoryApi([
    makePack("h5_claim_target", {
      title: "被投诉作品",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  await api.getDeviceDashboard();
  const claim = await api.submitRightsClaim({
    targetType: "Work",
    targetId: "h5_claim_target",
    claimantName: "IP 权利人",
    summary: "该作品存在 IP 授权争议，先暂停商店分发。",
  });
  let settlements = await api.getSettlements();

  assert.equal(claim.item.status, "action_taken");
  assert.equal(getStored()[0].storeStatus, "frozen");
  assert.equal(getStored()[0].hardwarePack.status, "paused");
  assert.ok(settlements.items.some((settlement) => settlement.packId === "h5_claim_target" && settlement.status === "frozen"));

  const appeal = await api.submitAppeal({
    targetType: "Work",
    targetId: "h5_claim_target",
    sourceCaseId: claim.item.id,
    reason: "创作者补充了授权证明，请恢复商店状态。",
  });
  const restored = await api.resolveAppeal(appeal.item.id, "restore", "授权证明通过，恢复分发。");
  settlements = await api.getSettlements();
  const claims = await api.getRightsClaims();
  const actions = await api.getModerationActions();

  assert.equal(restored.item.status, "resolved");
  assert.equal(getStored()[0].storeStatus, "listed");
  assert.equal(getStored()[0].hardwarePack.status, "available");
  assert.ok(settlements.items.some((settlement) => (
    settlement.packId === "h5_claim_target" &&
    ["pending", "no_cash"].includes(settlement.status)
  )));
  assert.equal(claims.items.find((item) => item.id === claim.item.id).status, "restored");
  assert.ok(actions.items.some((action) => action.action === "freeze_store"));
  assert.ok(actions.items.some((action) => action.action === "restore"));
});

test("comment reporting enters governance and operator action hides the comment", async () => {
  const { api, getStored } = createMemoryApi([
    makePack("h5_comment_target", {
      title: "评论治理作品",
      author: { id: "user_local", name: "你" },
      metrics: { plays: 100, likes: 8, saves: 2, comments: 0, remixes: 0, completionRate: 0.8 },
    }),
  ]);

  const posted = await api.postComment({
    workId: "h5_comment_target",
    userId: "user_bad",
    authorName: "Bad User",
    body: "这条评论需要被举报。",
  });
  assert.equal(posted.item.status, "visible");
  assert.equal(getStored()[0].metrics.comments, 1);

  const report = await api.reportComment(posted.item.id, "harassment", "评论存在骚扰或引战内容。");
  let dashboard = await api.getOperatorDashboard();

  assert.equal(report.item.targetType, "Comment");
  assert.equal(report.comment.status, "pending_review");
  assert.equal(getStored()[0].metrics.comments, 0);
  assert.ok(dashboard.governanceCases.some((item) => item.targetType === "Comment" && item.id === report.item.id));

  await api.resolveReport(report.item.id, "hide", "评论举报成立，平台隐藏。");
  const actions = await api.getModerationActions();
  const comments = await api.getComments("h5_comment_target");
  dashboard = await api.getOperatorDashboard();

  assert.equal(comments.items.some((item) => item.id === posted.item.id), false);
  assert.ok(actions.items.some((action) => action.targetType === "Comment" && action.action === "hide"));
  assert.equal(dashboard.counts.governanceOpen, 1);
});

test("block relation hides comments and blocks future comments on my work", async () => {
  const { api } = createMemoryApi([
    makePack("h5_block_target", {
      title: "拉黑测试作品",
      author: { id: "user_local", name: "你" },
      metrics: { plays: 100, likes: 8, saves: 2, comments: 0, remixes: 0, completionRate: 0.8 },
    }),
  ]);

  const visible = await api.postComment({
    workId: "h5_block_target",
    userId: "user_yu",
    authorName: "Yu",
    body: "先留一条评论。",
  });
  let comments = await api.getComments("h5_block_target");
  assert.ok(comments.items.some((item) => item.id === visible.item.id));

  const block = await api.blockUser({
    blockedUserId: "user_yu",
    blockedUserName: "Yu",
    reason: "从评论区拉黑。",
  });
  comments = await api.getComments("h5_block_target");
  const blockedPost = await api.postComment({
    workId: "h5_block_target",
    userId: "user_yu",
    authorName: "Yu",
    body: "被拉黑后继续评论。",
  });
  const blocks = await api.getMyBlocks();

  assert.equal(block.item.status, "active");
  assert.equal(comments.items.some((item) => item.userId === "user_yu"), false);
  assert.equal(comments.blockedCount >= 1, true);
  assert.equal(blockedPost.blocked, true);
  assert.equal(blockedPost.reason, "blocked_by_author");
  assert.ok(blocks.items.some((item) => item.blockedUserId === "user_yu" && item.status === "active"));

  await api.unblockUser("user_yu");
  const afterUnblock = await api.getMyBlocks();
  assert.equal(afterUnblock.items.find((item) => item.blockedUserId === "user_yu").status, "revoked");
});

test("refund can keep installed content usable while revoking new download rights", async () => {
  const { api } = createMemoryApi([
    makePack("h5_refund_keep", {
      title: "已装退款保留包",
      storeStatus: "listed",
      metrics: { plays: 600, likes: 70, saves: 18, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const dashboard = await api.getDeviceDashboard();
  const item = dashboard.library.find((entry) => entry.packId === "h5_refund_keep");
  const purchase = await api.purchaseBadgePack(item.id);
  await api.downloadBadgePack(item.id);
  await api.syncBadgePack(item.id);
  await api.refundOrder(purchase.order.id, { reason: "已安装后人工退款", installedPolicy: "keep_installed" });

  const afterRefund = await api.getDeviceDashboard();
  const refundedItem = afterRefund.library.find((entry) => entry.packId === "h5_refund_keep");

  assert.equal(afterRefund.device.currentPackTitle, "已装退款保留包");
  assert.equal(refundedItem.syncStatus, "synced");
  assert.equal(refundedItem.entitlementStatus, "revoked");
  assert.equal(refundedItem.refundPolicy, "keep_installed");

  const syncBlocked = await api.syncBadgePack(item.id);
  assert.equal(syncBlocked.blocked, true);
  assert.equal(syncBlocked.reason, "entitlement_missing");
});

test("refund can remove installed content from the device", async () => {
  const { api } = createMemoryApi([
    makePack("h5_refund_remove", {
      title: "已装退款移除包",
      storeStatus: "listed",
      metrics: { plays: 600, likes: 70, saves: 18, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const dashboard = await api.getDeviceDashboard();
  const item = dashboard.library.find((entry) => entry.packId === "h5_refund_remove");
  const purchase = await api.purchaseBadgePack(item.id);
  await api.downloadBadgePack(item.id);
  await api.syncBadgePack(item.id);
  await api.refundOrder(purchase.order.id, { reason: "退款并移除设备内容", installedPolicy: "remove_from_device" });

  const afterRefund = await api.getDeviceDashboard();
  const refundedItem = afterRefund.library.find((entry) => entry.packId === "h5_refund_remove");

  assert.equal(afterRefund.device.currentPackTitle, "未同步内容");
  assert.equal(refundedItem.syncStatus, "not_synced");
  assert.equal(refundedItem.installStatus, "removed");
  assert.equal(refundedItem.entitlementStatus, "revoked");
});

test("device selection switches persona and keeps entitlements per device", async () => {
  const { api } = createMemoryApi([
    makePack("h5_rain_listed", {
      title: "雨天包",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
    makePack("h5_soda_listed", {
      title: "汽水包",
      storeStatus: "listed",
      contentOrigin: "fanwork",
      ipId: "soda_planet_fan",
      ipName: "汽水星球原创企划",
      zoneId: "duo",
      zoneName: "同频搭子区",
      persona: {
        id: "soda_gugu",
        name: "汽水咕咕",
        avatar: "🥤",
        roleType: "official",
        tagline: "把无聊摇到冒泡。",
        cloneOf: null,
      },
      tags: ["二创", "汽水星球原创企划"],
      metrics: { plays: 800, likes: 80, saves: 20, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const rainDashboard = await api.getDeviceDashboard();
  assert.equal(rainDashboard.device.persona.id, "rain_gugu");
  assert.deepEqual(rainDashboard.library.map((item) => item.packId), ["h5_rain_listed"]);
  assert.equal(rainDashboard.library[0].ownership, "owned");

  await api.selectDevice("badge_s3_02");
  const sodaDashboard = await api.getDeviceDashboard();
  assert.equal(sodaDashboard.device.persona.id, "soda_gugu");
  assert.deepEqual(sodaDashboard.library.map((item) => item.packId), ["h5_soda_listed"]);
  assert.equal(sodaDashboard.library[0].ownership, "not_owned");

  await api.purchaseBadgePack(sodaDashboard.library[0].id);
  await api.downloadBadgePack(sodaDashboard.library[0].id);
  await api.syncBadgePack(sodaDashboard.library[0].id);
  const syncedSodaDashboard = await api.getDeviceDashboard();
  assert.equal(syncedSodaDashboard.library[0].syncStatus, "synced");

  await api.selectDevice("badge_s3_01");
  const rainAgainDashboard = await api.getDeviceDashboard();
  assert.deepEqual(rainAgainDashboard.library.map((item) => item.packId), ["h5_rain_listed"]);
  assert.equal(rainAgainDashboard.library.some((item) => item.packId === "h5_soda_listed"), false);
});

test("syncing a pack makes it the current running device content", async () => {
  const { api } = createMemoryApi([
    makePack("h5_first_rain", {
      title: "旧运行包",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
    makePack("h5_second_rain", {
      title: "新运行包",
      storeStatus: "listed",
      metrics: { plays: 100, likes: 10, saves: 2, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const dashboard = await api.getDeviceDashboard();
  const second = dashboard.library.find((item) => item.packId === "h5_second_rain");
  assert.equal(dashboard.device.currentPackTitle, "旧运行包");

  await api.purchaseBadgePack(second.id);
  await api.downloadBadgePack(second.id);
  await api.syncBadgePack(second.id);

  const updated = await api.getDeviceDashboard();
  assert.equal(updated.device.currentPackTitle, "新运行包");
  assert.equal(updated.library.find((item) => item.packId === "h5_second_rain").syncStatus, "synced");
  assert.equal(updated.library.find((item) => item.packId === "h5_first_rain").syncStatus, "not_synced");
});

test("sync failure records a diagnostic job and retry preserves previous content", async () => {
  const { api } = createMemoryApi([
    makePack("h5_first_running", {
      title: "原运行包",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
    makePack("h5_retry_target", {
      title: "待重试包",
      storeStatus: "listed",
      metrics: { plays: 100, likes: 10, saves: 2, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const dashboard = await api.getDeviceDashboard();
  const target = dashboard.library.find((item) => item.packId === "h5_retry_target");
  await api.purchaseBadgePack(target.id);
  await api.downloadBadgePack(target.id);

  const failed = await api.syncBadgePack(target.id, { forceFailureReason: "write_failed" });
  assert.equal(failed.failed, true);
  assert.equal(failed.syncJob.failureReason, "write_failed");
  assert.match(failed.syncJob.diagnosticCode, /^GFS-WRITE-FAILED-/);
  assert.equal(failed.syncJob.rollbackStatus, "restored_previous");
  assert.deepEqual(validateDeviceSyncEvidence(failed.syncJob.evidence), []);

  const afterFailure = await api.getDeviceDashboard();
  assert.equal(afterFailure.device.currentPackTitle, "原运行包");
  assert.equal(afterFailure.library.find((item) => item.packId === "h5_retry_target").syncStatus, "failed");
  assert.equal(afterFailure.library.find((item) => item.packId === "h5_retry_target").canRetrySync, true);
  assert.equal(afterFailure.syncJobs[0].failureReason, "write_failed");

  const retry = await api.syncBadgePack(target.id);
  const afterRetry = await api.getDeviceDashboard();
  assert.equal(retry.syncJob.status, "installed");
  assert.deepEqual(validateDeviceSyncEvidence(retry.syncJob.evidence), []);
  assert.equal(afterRetry.device.currentPackTitle, "待重试包");
  assert.equal(afterRetry.library.find((item) => item.packId === "h5_retry_target").syncStatus, "synced");
});

test("sync preflight blocks low battery and returns a user-facing diagnostic", async () => {
  const { api } = createMemoryApi([
    makePack("h5_low_battery_pack", {
      title: "低电量测试包",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  await api.bindDevice({ personaId: "rain_gugu", battery: 9 });
  const dashboard = await api.getDeviceDashboard();
  const item = dashboard.library.find((entry) => entry.packId === "h5_low_battery_pack");
  await api.purchaseBadgePack(item.id);
  await api.downloadBadgePack(item.id);
  const blocked = await api.syncBadgePack(item.id);

  assert.equal(blocked.blocked, true);
  assert.equal(blocked.reason, "low_battery");
  assert.equal(blocked.syncJob.status, "blocked");
  assert.equal(blocked.syncJob.message, "设备电量过低，请充电后重试。");
  assert.match(blocked.syncJob.diagnosticCode, /^GFS-LOW-BATTERY-/);
  assert.deepEqual(validateDeviceSyncEvidence(blocked.syncJob.evidence), []);

  const after = await api.getDeviceDashboard();
  assert.equal(after.library.find((entry) => entry.packId === "h5_low_battery_pack").syncStatus, "failed");
  assert.equal(after.device.currentPackTitle, "未同步内容");
});

test("delisted hardware pack stays usable on installed devices and blocks new use", async () => {
  const { api, getStored } = createMemoryApi([
    makePack("h5_delisted_pack", {
      title: "会被下架的包",
      storeStatus: "listed",
      metrics: { plays: 1000, likes: 100, saves: 30, comments: 0, remixes: 0, completionRate: 1 },
    }),
  ]);

  const primaryBefore = await api.getDeviceDashboard();
  const installedBefore = primaryBefore.library.find((item) => item.packId === "h5_delisted_pack");
  assert.equal(installedBefore.syncStatus, "synced");

  const newDevice = await api.bindDevice({ personaId: "rain_gugu" });
  const newDeviceBefore = await api.getDeviceDashboard();
  const newDeviceItem = newDeviceBefore.library.find((item) => item.packId === "h5_delisted_pack");
  await api.purchaseBadgePack(newDeviceItem.id);
  await api.downloadBadgePack(newDeviceItem.id);

  await api.delistStoreListing("h5_delisted_pack", "权利投诉成立，停止新增下载和同步。");

  assert.equal(getStored()[0].storeStatus, "delisted");
  assert.equal(getStored()[0].hardwarePack.status, "removed");

  await api.selectDevice("badge_s3_01");
  const primaryAfter = await api.getDeviceDashboard();
  const installedAfter = primaryAfter.library.find((item) => item.packId === "h5_delisted_pack");
  assert.equal(installedAfter.syncStatus, "synced");
  assert.equal(installedAfter.legacyUsable, true);
  assert.equal(installedAfter.availableForNewUse, false);
  assert.equal(primaryAfter.device.currentPackTitle, "会被下架的包");

  await api.selectDevice(newDevice.item.id);
  const syncBlocked = await api.syncBadgePack(newDeviceItem.id);
  assert.equal(syncBlocked.blocked, true);
  assert.equal(syncBlocked.reason, "hardware_pack_unavailable");

  await api.bindDevice({ personaId: "rain_gugu" });
  const purchaseBlocked = await api.purchaseBadgePack(newDeviceItem.id);
  const noHistoryDashboard = await api.getDeviceDashboard();
  assert.equal(purchaseBlocked.blocked, true);
  assert.equal(purchaseBlocked.reason, "hardware_pack_unavailable");
  assert.equal(noHistoryDashboard.library.some((item) => item.packId === "h5_delisted_pack"), false);
});
