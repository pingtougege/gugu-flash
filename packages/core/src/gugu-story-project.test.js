import assert from "node:assert/strict";
import test from "node:test";

import {
  GUGU_COMIC_EPISODE_SCHEMA_VERSION,
  GUGU_H5_SCHEMA_VERSION,
  GUGU_STORY_PROJECT_SCHEMA_VERSION,
  compileStoryProjectToComicEpisode,
  compileStoryProjectToH5Pack,
  createStoryProjectFromH5Pack,
  createStoryProjectFromPrompt,
  createStoryProjectPlayabilityReport,
  validatePack,
  validateStoryProject,
} from "./index.js";

function makeStoryProject(overrides = {}) {
  return {
    id: "story_project_rain_store",
    schemaVersion: GUGU_STORY_PROJECT_SCHEMA_VERSION,
    title: "雨夜便利店",
    status: "draft",
    author: { id: "user_local", name: "你" },
    origin: {
      contentOrigin: "original",
      ipId: "rain_gugu_universe",
      fanworkOf: null,
      remixOf: null,
      rightsAcknowledgedAt: null,
    },
    brief: {
      logline: "雨夜便利店里，主角遇到一只会预言明天的猫。",
      genre: "adventure",
      audience: "mobile_short_play",
      tone: "warm_mystery",
    },
    world: {
      setting: "雨夜便利店",
      rules: ["猫能预言明天", "停电后货架会改变顺序"],
      stakes: "主角必须在天亮前确认预言真假。",
    },
    zoneId: "adventure",
    persona: {
      id: "night_conductor",
      name: "零点列车长",
      avatar: "🚃",
      roleType: "official",
      tagline: "负责把犹豫检票进明天。",
    },
    characters: [
      {
        id: "night_conductor",
        name: "零点列车长",
        role: "社区分身 / 主角",
        motivation: "查清预言来源。",
        voice: "温和但有行动力。",
      },
      {
        id: "prophet_cat",
        name: "预言猫",
        role: "线索提供者",
        motivation: "阻止错误的明天发生。",
        voice: "短句、神秘。",
      },
    ],
    cover: {
      background: "linear-gradient(160deg, #111827 0%, #7c2d12 60%, #fde68a 140%)",
      character: "🚃",
    },
    storyGraph: {
      entryNodeId: "start",
      nodes: [
        { id: "start", type: "scene", sceneId: "start", title: "雨夜开门" },
        { id: "ask_cat", type: "scene", sceneId: "ask_cat", title: "询问猫" },
        { id: "follow_shelf", type: "scene", sceneId: "follow_shelf", title: "跟随货架" },
        { id: "truth_end", type: "ending", sceneId: "truth_end", title: "真相结局" },
        { id: "warm_end", type: "ending", sceneId: "warm_end", title: "温柔结局" },
      ],
      edges: [
        { id: "start_ask", fromNodeId: "start", toNodeId: "ask_cat", label: "询问黑猫" },
        { id: "start_shelf", fromNodeId: "start", toNodeId: "follow_shelf", label: "检查货架" },
        { id: "ask_truth", fromNodeId: "ask_cat", toNodeId: "truth_end", label: "相信预言" },
        { id: "shelf_warm", fromNodeId: "follow_shelf", toNodeId: "warm_end", label: "留下纸条" },
      ],
    },
    script: {
      scenes: [
        {
          id: "start",
          title: "雨夜开门",
          background: "linear-gradient(160deg, #111827, #7c2d12)",
          character: "🚃",
          speaker: "零点列车长",
          text: "雨夜便利店的门铃响了三次，一只黑猫蹲在收银台上，盯着明天的报纸。",
        },
        {
          id: "ask_cat",
          title: "询问猫",
          background: "linear-gradient(160deg, #1f2937, #0f766e)",
          character: "🐈",
          speaker: "预言猫",
          text: "黑猫把尾巴压在日期上：如果你现在相信我，明天会少一场遗憾。",
        },
        {
          id: "follow_shelf",
          title: "跟随货架",
          background: "linear-gradient(160deg, #12372a, #436850)",
          character: "🧃",
          speaker: "零点列车长",
          text: "货架自己挪开半步，露出一张写给未来顾客的便签。",
        },
        {
          id: "truth_end",
          title: "真相结局",
          background: "linear-gradient(160deg, #312e81, #4338ca)",
          character: "🌌",
          speaker: "预言猫",
          text: "结局：你把报纸藏起，天亮后才发现那其实是你写给自己的提醒。",
        },
        {
          id: "warm_end",
          title: "温柔结局",
          background: "linear-gradient(160deg, #164e63, #99f6e4)",
          character: "💙",
          speaker: "零点列车长",
          text: "结局：你留下便签，明天进店的人因此绕过了一场沉默的难过。",
        },
      ],
    },
    comicPanels: [],
    assets: [
      {
        id: "asset_cover",
        type: "cover",
        name: "雨夜便利店封面",
        usage: "cover",
        source: "ai_prompt",
        prompt: "雨夜便利店，暖光，黑猫，轻悬疑",
      },
    ],
    aiProvenance: [
      {
        provider: "local_rules",
        generatedFields: ["brief", "storyGraph", "script", "assets"],
        prompt: "雨夜便利店里遇到会预言明天的猫",
        generatedAt: 1760000000000,
      },
    ],
    tags: ["雨夜", "便利店", "预言"],
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
    ...overrides,
  };
}

test("validateStoryProject accepts a playable story graph", () => {
  const project = makeStoryProject();

  assert.deepEqual(validateStoryProject(project), []);
});

test("compileStoryProjectToH5Pack creates a valid playable GuguH5Pack", () => {
  const project = makeStoryProject();
  const pack = compileStoryProjectToH5Pack(project, {
    packId: "h5_rain_store_project",
    timestamp: 1760000000001,
  });

  assert.equal(pack.schemaVersion, GUGU_H5_SCHEMA_VERSION);
  assert.equal(pack.title, "雨夜便利店");
  assert.equal(pack.entrySceneId, "start");
  assert.equal(pack.sourceProjectId, "story_project_rain_store");
  assert.equal(pack.scenes.length, 5);
  assert.deepEqual(
    pack.scenes.find((scene) => scene.id === "start").actions.map((action) => action.goto),
    ["ask_cat", "follow_shelf"],
  );
  assert.deepEqual(validatePack(pack), []);
});

test("createStoryProjectPlayabilityReport passes compiled playable projects", () => {
  const project = makeStoryProject();
  const report = createStoryProjectPlayabilityReport(project, {
    packId: "h5_rain_store_project",
    generatedAt: 1760000000002,
  });

  assert.equal(report.status, "passed");
  assert.equal(report.errors.length, 0);
  assert.equal(report.playtest.summary.endingCount, 2);
});

test("compileStoryProjectToComicEpisode creates a storyboard contract", () => {
  const project = makeStoryProject();
  const episode = compileStoryProjectToComicEpisode(project, {
    episodeId: "comic_rain_store",
    timestamp: 1760000000000,
  });

  assert.equal(episode.schemaVersion, GUGU_COMIC_EPISODE_SCHEMA_VERSION);
  assert.equal(episode.targetType, "ComicEpisode");
  assert.equal(episode.storyProjectId, project.id);
  assert.equal(episode.panelCount, project.storyGraph.nodes.length);
  assert.equal(episode.panels[0].sceneId, "start");
  assert.equal(episode.panels[0].id, "panel_start");
  assert.equal(episode.panels[0].nextBeats[0].targetPanelId, "panel_ask_cat");
  assert.equal(episode.panels[0].shotType, "establishing");
  assert.equal(episode.panels.some((panel) => panel.ending), true);
  assert.deepEqual(episode.validationErrors, []);
});

test("compileStoryProjectToComicEpisode preserves edited storyboard fields and image bindings", () => {
  const project = makeStoryProject();
  const startScene = project.script.scenes.find((scene) => scene.id === "start");
  startScene.shotType = "dramatic_closeup";
  startScene.caption = "Rain beads on the counter while the cat watches tomorrow's paper.";
  startScene.visualPrompt = "cinematic closeup, rainy convenience store counter, black cat, warm neon";
  startScene.generatedImage = {
    id: "asset_panel_start",
    imageUrl: "https://cdn.example.test/panels/start.png",
    provider: "gugu_render",
  };

  const episode = compileStoryProjectToComicEpisode(project, {
    episodeId: "comic_storyboard_assets",
    timestamp: 1760000000000,
  });
  const panel = episode.panels.find((item) => item.sceneId === "start");

  assert.equal(panel.shotType, "dramatic_closeup");
  assert.equal(panel.caption, "Rain beads on the counter while the cat watches tomorrow's paper.");
  assert.equal(panel.visualPrompt, "cinematic closeup, rainy convenience store counter, black cat, warm neon");
  assert.equal(panel.imageUrl, "https://cdn.example.test/panels/start.png");
  assert.deepEqual(panel.generatedImage, startScene.generatedImage);
});

test("validateStoryProject blocks broken graph targets and accidental dead ends", () => {
  const project = makeStoryProject({
    storyGraph: {
      entryNodeId: "start",
      nodes: [
        { id: "start", type: "scene", sceneId: "start", title: "开始" },
        { id: "broken", type: "scene", sceneId: "broken", title: "断裂" },
        { id: "end", type: "ending", sceneId: "end", title: "结局" },
      ],
      edges: [
        { id: "start_missing", fromNodeId: "start", toNodeId: "missing", label: "去不存在的场景" },
        { id: "start_broken", fromNodeId: "start", toNodeId: "broken", label: "进入断裂场景" },
      ],
    },
    script: {
      scenes: [
        { id: "start", text: "开始。" },
        { id: "broken", text: "这个场景没有出口。" },
        { id: "end", text: "结局。" },
      ],
    },
  });
  const errors = validateStoryProject(project);

  assert.ok(errors.some((error) => error.includes("invalid_edge_target")));
  assert.ok(errors.some((error) => error.includes("dead_end_node")));
  assert.ok(errors.some((error) => error.includes("unreachable_node")));
  assert.ok(errors.some((error) => error.includes("missing_reachable_ending")));
});

test("createStoryProjectFromH5Pack preserves scene graph and can compile back", () => {
  const sourcePack = compileStoryProjectToH5Pack(makeStoryProject(), {
    packId: "h5_roundtrip",
    timestamp: 1760000000003,
  });
  const project = createStoryProjectFromH5Pack(sourcePack, {
    projectId: "story_project_roundtrip",
  });
  const compiled = compileStoryProjectToH5Pack(project, {
    packId: "h5_roundtrip_compiled",
    timestamp: 1760000000004,
  });

  assert.deepEqual(validateStoryProject(project), []);
  assert.deepEqual(validatePack(compiled), []);
  assert.equal(project.storyGraph.nodes.length, sourcePack.scenes.length);
  assert.equal(compiled.entrySceneId, sourcePack.entrySceneId);
});

test("createStoryProjectFromPrompt creates a project-backed mobile draft", () => {
  const { project, draft } = createStoryProjectFromPrompt(
    "一个雨夜便利店里，主角遇到会预言明天的猫",
    "adventure",
    {},
    1760000000000,
  );

  assert.equal(project.schemaVersion, GUGU_STORY_PROJECT_SCHEMA_VERSION);
  assert.equal(project.status, "ready_to_preview");
  assert.equal(project.brief.sourcePrompt, "一个雨夜便利店里，主角遇到会预言明天的猫");
  assert.equal(draft.sourceProjectId, project.id);
  assert.equal(draft.storyProjectId, project.id);
  assert.deepEqual(validateStoryProject(project), []);

  const compiled = compileStoryProjectToH5Pack(project, { packId: "h5_prompt_project" });
  assert.deepEqual(validatePack(compiled), []);
});

test("fanwork story projects require IP metadata before validation passes", () => {
  const project = makeStoryProject({
    origin: {
      contentOrigin: "fanwork",
      ipId: null,
      ipName: "",
      rightsAcknowledgedAt: null,
    },
  });
  const errors = validateStoryProject(project);

  assert.ok(errors.some((error) => error.includes("missing_ip")));
});
