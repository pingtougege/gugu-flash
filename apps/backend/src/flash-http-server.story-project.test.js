import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  GUGU_COMIC_EPISODE_SCHEMA_VERSION,
  GUGU_H5_SCHEMA_VERSION,
  GUGU_STORY_PROJECT_SCHEMA_VERSION,
} from "../../../packages/core/src/index.js";
import { createHttpFlashApi } from "../../../packages/api-client/src/http-flash-api.js";
import { createFlashHttpServer } from "./flash-http-server.js";

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function withStoryProjectBackend(callback) {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-story-project-api-"));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  const { server } = createFlashHttpServer({ dataPath, statePath });
  const baseUrl = await listen(server);
  const api = createHttpFlashApi({ baseUrl });

  try {
    await callback(api, baseUrl);
  } finally {
    await close(server);
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function postRaw(baseUrl, path, body = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((response) => response.json());
}

function makeStoryProject(overrides = {}) {
  return {
    id: "story_project_backend_slice",
    schemaVersion: GUGU_STORY_PROJECT_SCHEMA_VERSION,
    title: "Backend Slice Mystery",
    status: "draft",
    author: { id: "user_local", name: "Creator" },
    origin: {
      contentOrigin: "original",
      ipId: null,
      fanworkOf: null,
      remixOf: null,
      rightsAcknowledgedAt: null,
    },
    brief: {
      logline: "A small mystery with one meaningful choice.",
      genre: "mystery",
      audience: "mobile_short_play",
      tone: "warm",
    },
    zoneId: "adventure",
    persona: {
      id: "field_editor",
      name: "Field Editor",
      avatar: "F",
      roleType: "creator_original",
      tagline: "Keeps every branch playable.",
    },
    storyGraph: {
      entryNodeId: "start",
      nodes: [
        { id: "start", type: "scene", sceneId: "start", title: "Start" },
        { id: "inspect", type: "scene", sceneId: "inspect", title: "Inspect" },
        { id: "call", type: "scene", sceneId: "call", title: "Call" },
        { id: "solve_end", type: "ending", sceneId: "solve_end", title: "Solved" },
        { id: "quiet_end", type: "ending", sceneId: "quiet_end", title: "Quiet" },
      ],
      edges: [
        { id: "start_inspect", fromNodeId: "start", toNodeId: "inspect", label: "Inspect note" },
        { id: "start_call", fromNodeId: "start", toNodeId: "call", label: "Call friend" },
        { id: "inspect_solve", fromNodeId: "inspect", toNodeId: "solve_end", label: "Name truth" },
        { id: "call_quiet", fromNodeId: "call", toNodeId: "quiet_end", label: "Wait until dawn" },
      ],
    },
    script: {
      scenes: [
        {
          id: "start",
          title: "Start",
          background: "linear-gradient(160deg, #172554, #0f766e)",
          character: "F",
          speaker: "Field Editor",
          text: "A folded note waits under the studio door, already stamped with tomorrow's date.",
        },
        {
          id: "inspect",
          title: "Inspect",
          background: "linear-gradient(160deg, #1f2937, #155e75)",
          character: "N",
          speaker: "Narrator",
          text: "The ink is fresh, but the warning describes a mistake you have not made yet.",
        },
        {
          id: "call",
          title: "Call",
          background: "linear-gradient(160deg, #312e81, #075985)",
          character: "P",
          speaker: "Phone",
          text: "Your friend answers before the first ring finishes and asks why the lights are still on.",
        },
        {
          id: "solve_end",
          title: "Solved",
          background: "linear-gradient(160deg, #064e3b, #84cc16)",
          character: "T",
          speaker: "Field Editor",
          text: "Ending: you rewrite the note into a checklist, and the future loses its trap.",
        },
        {
          id: "quiet_end",
          title: "Quiet",
          background: "linear-gradient(160deg, #1e1b4b, #38bdf8)",
          character: "D",
          speaker: "Narrator",
          text: "Ending: you wait together until dawn, and the warning becomes only a story.",
        },
      ],
    },
    comicPanels: [],
    assets: [],
    tags: ["backend", "playable"],
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
    ...overrides,
  };
}

function makePublishableStoryProject(overrides = {}) {
  return makeStoryProject({
    assets: [
      {
        id: "asset_cover_background",
        type: "background",
        name: "Studio door cover",
        usage: "Cover and scene background",
        source: "original",
        prompt: "A warm mystery studio door with a folded note on the floor.",
      },
    ],
    characters: [
      {
        id: "field_editor",
        name: "Field Editor",
        role: "社区分身 / 主角",
        motivation: "Keep every branch playable.",
        voice: "Calm and curious.",
        avatar: "F",
      },
    ],
    ...overrides,
  });
}

test("StoryProject HTTP slice creates, fetches, snapshots, records jobs, and compiles H5", async () => {
  await withStoryProjectBackend(async (api) => {
    const created = await api.createStoryProject(makeStoryProject());
    assert.equal(created.item.id, "story_project_backend_slice");
    assert.equal(created.item.authorUserId, "user_local");
    assert.equal(created.item.contentOrigin, "original");

    const listed = await api.listStoryProjects();
    assert.equal(listed.items.some((item) => item.id === created.item.id), true);

    const fetched = await api.getStoryProject(created.item.id);
    assert.equal(fetched.item.title, "Backend Slice Mystery");

    const sceneEditedProject = structuredClone(fetched.item);
    sceneEditedProject.script.scenes[0].text = "The first scene was revised through the professional inspector.";
    const updated = await api.updateStoryProject(created.item.id, sceneEditedProject);
    assert.equal(updated.item.script.scenes[0].text, "The first scene was revised through the professional inspector.");
    assert.equal(updated.item.storyGraph.edges.length, 4);
    const refetched = await api.getStoryProject(created.item.id);
    assert.equal(refetched.item.script.scenes[0].text, "The first scene was revised through the professional inspector.");

    const version = await api.createStoryProjectVersion(created.item.id, {
      label: "Phase 0 snapshot",
      reason: "Prove project snapshots persist.",
    });
    assert.match(version.item.id, /^spv_/);
    assert.equal(version.item.storyProjectId, created.item.id);
    assert.equal(version.item.projectSnapshot.title, "Backend Slice Mystery");

    const job = await api.createStoryProjectAiJob(created.item.id, {
      stage: "outline",
      prompt: "Make the middle branch clearer.",
    });
    assert.match(job.item.id, /^ai_job_/);
    assert.equal(job.item.storyProjectId, created.item.id);
    assert.equal(job.item.inputSnapshotId, version.item.id);

    const fetchedJob = await api.getAiGenerationJob(job.item.id);
    assert.equal(fetchedJob.item.prompt, "Make the middle branch clearer.");

    const compiled = await api.compileStoryProjectH5(created.item.id);
    assert.equal(compiled.item.targetType, "WorkDraft");
    assert.equal(compiled.item.status, "ready_to_preview");
    assert.equal(compiled.item.pack.schemaVersion, GUGU_H5_SCHEMA_VERSION);
    assert.equal(compiled.h5Pack.sourceProjectId, created.item.id);
    assert.equal(compiled.h5Pack.entrySceneId, "start");
    assert.equal(compiled.h5Pack.scenes.length, 5);
    assert.deepEqual(compiled.report.errors, []);
    assert.equal(["blocked", "warning", "passed"].includes(compiled.item.publishStatus), true);
  });
});

test("StoryProject HTTP slice filters base visual assets by usage scene and character", async () => {
  await withStoryProjectBackend(async (api) => {
    const created = await api.createStoryProject(makeStoryProject({
      id: "story_project_asset_filters",
    }));
    const project = structuredClone(created.item);
    project.assets = [
      {
        id: "asset_scene_background_start",
        assetId: "asset_scene_background_start",
        kind: "image",
        usage: "scene_background",
        storyProjectId: project.id,
        sceneId: "start",
        imageUrl: "https://cdn.example.test/background/start.png",
        sourceStatement: { sourceType: "ai_generated", rightsAcknowledged: true },
      },
      {
        id: "asset_character_portrait_detective",
        assetId: "asset_character_portrait_detective",
        kind: "image",
        usage: "character_portrait",
        storyProjectId: project.id,
        characterId: "char_detective",
        characterName: "Detective",
        imageUrl: "https://cdn.example.test/character/detective.png",
        sourceStatement: { sourceType: "ai_generated", rightsAcknowledged: true },
      },
      {
        id: "asset_panel_visual_start",
        assetId: "asset_panel_visual_start",
        kind: "image",
        usage: "comic_panel_visual",
        storyProjectId: project.id,
        sceneId: "start",
        panelId: "panel_start",
        renderJobId: "ai_job_panel_visual_start",
        imageUrl: "https://cdn.example.test/panel/start.png",
        sourceStatement: { sourceType: "ai_generated", rightsAcknowledged: true },
      },
    ];
    project.renderJobs = [
      {
        id: "ai_job_panel_visual_start",
        storyProjectId: project.id,
        stage: "comic_panel_visual_render",
        kind: "comic_panel_visual",
        status: "succeeded",
        panelId: "panel_start",
        sceneId: "start",
        assetId: "asset_panel_visual_start",
      },
    ];
    await api.updateStoryProject(project.id, project);

    const sceneBackgrounds = await api.listStoryProjectAssets(project.id, {
      usage: "scene_background",
      sceneId: "start",
    });
    const portraits = await api.listAssets({
      storyProjectId: project.id,
      usage: "character_portrait",
      characterId: "char_detective",
    });
    const panelAssets = await api.listAssets({
      storyProjectId: project.id,
      panelId: "panel_start",
    });
    const indexedAsset = await api.createAsset({
      storyProjectId: project.id,
      kind: "image",
      usage: "scene_background",
      sceneId: "inspect",
      filename: "indexed-background.png",
      mediaType: "image/png",
      sizeBytes: 1024,
      imageUrl: "https://cdn.example.test/background/indexed.png",
      sourceStatement: {
        sourceType: "ai_generated",
        provider: "seedream",
        model: "seedream",
        prompt: "indexed scene background",
        rightsAcknowledged: true,
      },
    });
    const fetchedIndexedAsset = await api.getAsset(indexedAsset.item.id);
    const indexedSceneAssets = await api.listStoryProjectAssets(project.id, {
      usage: "scene_background",
      sceneId: "inspect",
    });
    const refetchedProject = await api.getStoryProject(project.id);
    const embeddedJob = await api.getAiGenerationJob("ai_job_panel_visual_start");

    assert.deepEqual(sceneBackgrounds.items.map((item) => item.id), ["asset_scene_background_start"]);
    assert.deepEqual(portraits.items.map((item) => item.id), ["asset_character_portrait_detective"]);
    assert.deepEqual(panelAssets.items.map((item) => item.id), ["asset_panel_visual_start"]);
    assert.equal(embeddedJob.item.result.assetId, "asset_panel_visual_start");
    assert.equal(embeddedJob.item.stage, "comic_panel_visual_render");
    assert.match(indexedAsset.item.id, /^asset_/);
    assert.equal(indexedAsset.item.storyProjectId, project.id);
    assert.equal(indexedAsset.item.securityReport.status, "passed");
    assert.equal(fetchedIndexedAsset.item.id, indexedAsset.item.id);
    assert.deepEqual(indexedSceneAssets.items.map((item) => item.id), [indexedAsset.item.id]);
    assert.ok(refetchedProject.item.assets.some((item) => item.id === indexedAsset.item.id));
  });
});

test("StoryProject HTTP image generation registers an indexed asset and render job", async () => {
  const previousDisabled = process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
  process.env.GUGU_FLASH_IMAGE_AI_DISABLED = "1";
  try {
    await withStoryProjectBackend(async (api) => {
      const created = await api.createStoryProject(makeStoryProject({
        id: "story_project_image_index",
      }));
      const generated = await api.generateAiImage({
        id: "asset_http_background_seed",
        storyProjectId: created.item.id,
        sceneId: "start",
        usage: "scene_background",
        prompt: "indexed rainy storefront background",
        renderJobId: "ai_job_http_background_seed",
        filename: "http-background.png",
      });
      const fetchedAsset = await api.getAsset(generated.item.id);
      const fetchedJob = await api.getAiGenerationJob("ai_job_http_background_seed");
      const listedAssets = await api.listAssets({
        storyProjectId: created.item.id,
        usage: "scene_background",
        sceneId: "start",
      });
      const projectAssets = await api.listStoryProjectAssets(created.item.id, {
        renderJobId: "ai_job_http_background_seed",
      });
      const refetchedProject = await api.getStoryProject(created.item.id);

      assert.equal(generated.item.id, "asset_http_background_seed");
      assert.equal(generated.item.storyProjectId, created.item.id);
      assert.equal(generated.item.sceneId, "start");
      assert.equal(generated.item.renderJobId, "ai_job_http_background_seed");
      assert.equal(generated.renderJob.id, "ai_job_http_background_seed");
      assert.equal(generated.renderJob.stage, "scene_background_render");
      assert.equal(generated.renderJob.status, "succeeded");
      assert.equal(generated.renderJob.result.assetId, generated.item.id);
      assert.equal(fetchedAsset.item.id, generated.item.id);
      assert.equal(fetchedAsset.item.sourceStatement.sourceType, "ai_generated");
      assert.equal(fetchedJob.item.result.assetId, generated.item.id);
      assert.ok(listedAssets.items.some((item) => item.id === generated.item.id));
      assert.deepEqual(projectAssets.items.map((item) => item.id), [generated.item.id]);
      assert.ok(refetchedProject.item.assets.some((item) => item.id === generated.item.id));
      assert.ok(refetchedProject.item.renderJobs.some((item) => item.id === "ai_job_http_background_seed"));
    });
  } finally {
    if (previousDisabled === undefined) delete process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
    else process.env.GUGU_FLASH_IMAGE_AI_DISABLED = previousDisabled;
  }
});

test("StoryProject HTTP slice publishes a playable project as a public H5 Work", async () => {
  await withStoryProjectBackend(async (api) => {
    const created = await api.createStoryProject(makePublishableStoryProject({
      id: "story_project_publish_success",
    }));

    const published = await api.publishStoryProject(created.item.id, {
      label: "Release candidate",
      reason: "Creator approved H5 release.",
    });

    assert.equal(published.item.status, "public_h5");
    assert.equal(published.item.sourceProjectId, created.item.id);
    assert.equal(published.project.status, "published");
    assert.equal(published.project.outputWorkId, published.item.id);
    assert.equal(published.version.status, "published");
    assert.equal(published.version.storyProjectId, created.item.id);
    assert.equal(published.report.errors.length, 0);
    assert.notEqual(published.report.publishChecklist.status, "blocked");

    const fetchedProject = await api.getStoryProject(created.item.id);
    assert.equal(fetchedProject.item.status, "published");
    assert.equal(fetchedProject.item.versionId, published.version.id);
    const fetchedWork = await api.getWork(published.item.id);
    assert.equal(fetchedWork.item.id, published.item.id);
  });
});

test("StoryProject HTTP slice compiles a project as a ComicEpisode", async () => {
  await withStoryProjectBackend(async (api) => {
    const created = await api.createStoryProject(makeStoryProject({
      id: "story_project_comic_success",
    }));
    const project = structuredClone(created.item);
    project.title = "Backend Slice Comic";
    project.script.scenes[0].text = "The first panel was revised for the comic compiler.";
    project.script.scenes[0].shotType = "backend_closeup";
    project.script.scenes[0].caption = "Backend edited panel caption.";
    project.script.scenes[0].visualPrompt = "backend slice comic visual prompt";
    project.script.scenes[0].generatedImage = {
      id: "asset_backend_panel_start",
      imageUrl: "https://cdn.example.test/backend/start.png",
    };

    const compiled = await api.compileStoryProjectComic(created.item.id, {
      project,
      episodeId: "comic_backend_slice_success",
    });

    assert.equal(compiled.item.id, "comic_backend_slice_success");
    assert.equal(compiled.item.schemaVersion, GUGU_COMIC_EPISODE_SCHEMA_VERSION);
    assert.equal(compiled.item.targetType, "ComicEpisode");
    assert.equal(compiled.item.storyProjectId, created.item.id);
    assert.equal(compiled.item.title, "Backend Slice Comic");
    assert.equal(compiled.item.panelCount, project.storyGraph.nodes.length);
    assert.equal(compiled.item.panels[0].shotType, "backend_closeup");
    assert.equal(compiled.item.panels[0].caption, "Backend edited panel caption.");
    assert.equal(compiled.item.panels[0].visualPrompt, "backend slice comic visual prompt");
    assert.equal(compiled.item.panels[0].imageUrl, "https://cdn.example.test/backend/start.png");
    assert.equal(compiled.episode.id, compiled.item.id);
    assert.equal(compiled.project.script.scenes[0].text, "The first panel was revised for the comic compiler.");
    assert.deepEqual(compiled.item.validationErrors, []);
  });
});

test("StoryProject HTTP slice restores a project from a saved version", async () => {
  await withStoryProjectBackend(async (api, baseUrl) => {
    const created = await api.createStoryProject(makeStoryProject({
      id: "story_project_restore_success",
      title: "Restorable First Cut",
    }));
    const version = await api.createStoryProjectVersion(created.item.id, {
      label: "Before rewrite",
      reason: "Keep a restorable branch.",
    });
    const editedProject = structuredClone(created.item);
    editedProject.title = "Restorable Rewrite";
    editedProject.script.scenes[0].text = "This rewrite should be replaced by the restored snapshot.";
    const updated = await api.updateStoryProject(created.item.id, editedProject);
    assert.equal(updated.item.title, "Restorable Rewrite");

    const restored = await api.restoreStoryProjectVersion(created.item.id, version.item.id, {
      reason: "Restore from first cut.",
    });

    assert.equal(restored.item.id, created.item.id);
    assert.equal(restored.item.title, "Restorable First Cut");
    assert.equal(restored.item.script.scenes[0].text, created.item.script.scenes[0].text);
    assert.equal(restored.item.storyGraph.edges.length, 4);
    assert.notEqual(restored.item.versionId, version.item.id);
    assert.equal(restored.item.restoredFromVersionId, version.item.id);
    assert.equal(restored.version.id, restored.item.versionId);
    assert.equal(restored.version.status, "restored");
    assert.equal(restored.version.projectSnapshot.versionId, restored.item.versionId);
    assert.equal(restored.restoredFromVersion.id, version.item.id);

    const fetchedProject = await api.getStoryProject(created.item.id);
    assert.equal(fetchedProject.item.title, "Restorable First Cut");
    assert.equal(fetchedProject.item.restoredFromVersionId, version.item.id);
    assert.equal(fetchedProject.item.versionId, restored.version.id);

    const publishedSnapshotProject = {
      ...fetchedProject.item,
      title: "Published Snapshot",
      status: "published",
      outputWorkId: "h5_previous_publish",
      publishedAt: 1760000001000,
    };
    const publishedVersion = await api.createStoryProjectVersion(created.item.id, {
      project: publishedSnapshotProject,
      label: "Published snapshot",
      status: "published",
    });
    const restoredPublished = await api.restoreStoryProjectVersion(created.item.id, publishedVersion.item.id);
    assert.equal(restoredPublished.item.title, "Published Snapshot");
    assert.equal(restoredPublished.item.status, "ready_to_preview");
    assert.equal(restoredPublished.item.outputWorkId, null);
    assert.equal(restoredPublished.item.publishedAt, null);
    assert.equal(restoredPublished.item.restoredFromVersionId, publishedVersion.item.id);
    assert.equal(restoredPublished.version.status, "restored");

    const missingVersion = await postRaw(baseUrl, `/flash/story-projects/${created.item.id}/versions/spv_missing/restore`);
    assert.equal(missingVersion.code, 404);
    assert.equal(missingVersion.message, "story_project_version_not_found");

    const otherProject = await api.createStoryProject(makeStoryProject({
      id: "story_project_restore_other",
      title: "Other Project",
    }));
    const mismatch = await postRaw(baseUrl, `/flash/story-projects/${otherProject.item.id}/versions/${version.item.id}/restore`);
    assert.equal(mismatch.code, 400);
    assert.equal(mismatch.message, "story_project_version_mismatch");
  });
});

test("StoryProject HTTP slice blocks publishing projects that fail publish checks", async () => {
  await withStoryProjectBackend(async (api, baseUrl) => {
    const created = await api.createStoryProject(makeStoryProject({
      id: "story_project_publish_blocked",
      assets: [],
    }));

    const blocked = await postRaw(baseUrl, `/flash/story-projects/${created.item.id}/publish`);

    assert.equal(blocked.code, 400);
    assert.equal(blocked.message, "story_project_publish_blocked");
    assert.ok(blocked.data.errors.some((error) => error.includes("asset_sources")));
    const fetchedProject = await api.getStoryProject(created.item.id);
    assert.equal(fetchedProject.item.status, "draft");
  });
});

test("StoryProject HTTP slice applies an AI job output project", async () => {
  await withStoryProjectBackend(async (api) => {
    const created = await api.createStoryProject(makePublishableStoryProject({
      id: "story_project_ai_apply",
    }));
    const outputProject = makePublishableStoryProject({
      ...created.item,
      title: "Backend Slice Mystery: Clearer AI Cut",
      brief: {
        ...created.item.brief,
        logline: "A clearer branch structure after AI revision.",
      },
    });
    const job = await api.createStoryProjectAiJob(created.item.id, {
      id: "ai_job_apply_story_project",
      stage: "rewrite",
      prompt: "Make the middle branch clearer.",
      status: "succeeded",
      result: { project: outputProject },
    });

    const applied = await api.applyAiGenerationJob(job.item.id);

    assert.equal(applied.item.id, created.item.id);
    assert.equal(applied.item.title, "Backend Slice Mystery: Clearer AI Cut");
    assert.equal(applied.job.status, "applied");
    assert.equal(applied.job.outputSnapshotId, applied.version.id);
    assert.equal(applied.version.storyProjectId, created.item.id);
    assert.equal(applied.version.projectSnapshot.title, "Backend Slice Mystery: Clearer AI Cut");

    const fetchedProject = await api.getStoryProject(created.item.id);
    assert.equal(fetchedProject.item.title, "Backend Slice Mystery: Clearer AI Cut");
    assert.equal(fetchedProject.item.versionId, applied.version.id);
  });
});

test("AI draft creation persists the generated StoryProject in HTTP mode", async () => {
  await withStoryProjectBackend(async (api) => {
    const previousAiDisabled = process.env.GUGU_FLASH_AI_DISABLED;
    process.env.GUGU_FLASH_AI_DISABLED = "1";
    let generated;
    try {
      generated = await api.createAiDraft("A lighthouse assistant finds a note from tomorrow.", "healing");
    } finally {
      if (previousAiDisabled === undefined) delete process.env.GUGU_FLASH_AI_DISABLED;
      else process.env.GUGU_FLASH_AI_DISABLED = previousAiDisabled;
    }

    assert.ok(generated.storyProject?.id);
    assert.equal(generated.item.storyProjectId, generated.storyProject.id);
    const fetchedProject = await api.getStoryProject(generated.storyProject.id);
    assert.equal(fetchedProject.item.id, generated.storyProject.id);
    assert.equal(fetchedProject.item.title, generated.storyProject.title);
  });
});

test("StoryProject HTTP slice rejects invalid project graphs with 400", async () => {
  await withStoryProjectBackend(async (api, baseUrl) => {
    const invalidCreate = await postRaw(baseUrl, "/flash/story-projects", {
      project: makeStoryProject({
        id: "story_project_invalid_create",
        storyGraph: {
          entryNodeId: "start",
          nodes: [{ id: "start", type: "scene", sceneId: "start", title: "Start" }],
          edges: [],
        },
        script: {
          scenes: [{
            id: "start",
            title: "Start",
            text: "This scene has no ending and should fail.",
          }],
        },
      }),
    });
    assert.equal(invalidCreate.code, 400);
    assert.equal(invalidCreate.message, "story_project_invalid");
    assert.ok(invalidCreate.data.errors.some((error) => error.includes("dead_end_node")));

    const created = await api.createStoryProject(makeStoryProject({ id: "story_project_compile_guard" }));
    const invalidCompile = await postRaw(baseUrl, `/flash/story-projects/${created.item.id}/compile/h5`, {
      project: {
        ...created.item,
        storyGraph: {
          ...created.item.storyGraph,
          edges: [
            ...created.item.storyGraph.edges,
            { id: "broken_edge", fromNodeId: "start", toNodeId: "missing", label: "Break graph" },
          ],
        },
      },
    });
    assert.equal(invalidCompile.code, 400);
    assert.equal(invalidCompile.message, "story_project_invalid");
    assert.ok(invalidCompile.data.errors.some((error) => error.includes("invalid_edge_target")));
  });
});
