import assert from "node:assert/strict";
import test from "node:test";

import {
  GUGU_H5_SCHEMA_VERSION,
  MAX_H5_SCENES,
  cloneAsRemix,
  createPublishChecklist,
  createDraftQualityChecks,
  createDraftFromPrompt,
  createTextGamePlaytestReport,
  getIpEntriesForOrigin,
  getPersonasForIp,
  validatePack,
} from "./index.js";

function makeValidPack(overrides = {}) {
  return {
    id: "h5_test",
    schemaVersion: GUGU_H5_SCHEMA_VERSION,
    title: "测试作品",
    author: { id: "user_test", name: "Tester" },
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
    cover: { background: "#111827", character: "☔" },
    tags: ["原创"],
    metrics: { plays: 0, likes: 0, saves: 0, comments: 0, remixes: 0, completionRate: 0 },
    entrySceneId: "start",
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
    remixOf: null,
    fanworkOf: null,
    rightsAcknowledgedAt: null,
    scenes: [
      {
        id: "start",
        background: "#111827",
        character: "☔",
        speaker: "雨天咕咕",
        text: "测试开始。",
        actions: [{ label: "结束", goto: "end" }],
      },
      {
        id: "end",
        background: "#020617",
        character: "💫",
        speaker: "雨天咕咕",
        text: "测试结束。",
        actions: [{ label: "重来", goto: "start" }],
      },
    ],
    ...overrides,
  };
}

test("createDraftFromPrompt creates a valid original H5 pack", () => {
  const draft = createDraftFromPrompt("做一个下班路上的小剧场", "healing", {}, 1760000000000);

  assert.equal(draft.schemaVersion, GUGU_H5_SCHEMA_VERSION);
  assert.deepEqual(draft.capabilities, ["scene_graph", "branching"]);
  assert.equal(draft.contentOrigin, "original");
  assert.equal(draft.storeStatus, "not_applied");
  assert.equal(draft.hardwareStatus, "h5_only");
  assert.deepEqual(validatePack(draft), []);
});

test("createDraftFromPrompt creates a structured text-game workspace", () => {
  const draft = createDraftFromPrompt("一个雨夜便利店里，主角遇到会预言明天的猫", "adventure", {}, 1760000000000);

  assert.equal(draft.creationBrief.genre, "选择冒险");
  assert.ok(draft.creationBrief.logline.includes("雨夜便利店"));
  assert.equal(draft.personaUsage.label, "社区分身 / 故事主角");
  assert.equal(draft.characters[0].role, "社区分身 / 主角");
  assert.equal(draft.characters.length, 2);
  assert.ok(draft.characters.every((character) => !["玩家", "主角们"].includes(character.name)));
  assert.ok(draft.assetPlan.some((asset) => asset.type === "cover"));
  assert.ok(draft.scenes.length >= 5);
  assert.ok(draft.scenes.some((scene) => scene.id === "resolve_end"));
  assert.ok(draft.scenes.some((scene) => scene.text.includes("雨夜便利店")));
  assert.ok(draft.scenes.every((scene) => scene.title.length <= 6));
  assert.ok(draft.scenes.every((scene) => scene.location && scene.location !== scene.title));
  assert.ok(draft.scenes.every((scene) => scene.time && scene.time !== "未定"));
  assert.ok(draft.scenes.every((scene) => scene.beat && scene.stageDirection && scene.dialogue?.length));
  assert.ok(draft.qualityChecks.every((check) => check.status !== "blocked"));
  assert.deepEqual(validatePack(draft), []);
});

test("createDraftFromPrompt keeps overview title and tags story focused", () => {
  const draft = createDraftFromPrompt(
    "完整文字游戏向文字游戏：主角在一个有明确视觉记忆点的地点经历“穿越到鬼灭之刃世界和主角们一起冒险的故事”；玩家目标是查清异常任务线索的来源并决定是否相信它；设计4场、2个关键选择、2个结局；每场要有背景、对白、选项跳转和情绪标签；结尾有轻微反转。",
    "adventure",
    { originType: "fanwork", ipName: "Demon Slayer / 鬼灭之刃" },
    1760000000000,
  );

  assert.equal(draft.title, "鬼灭之刃冒险");
  assert.ok(draft.tags.includes("鬼灭"));
  assert.ok(draft.tags.includes("反转"));
  assert.ok(draft.tags.every((tag) => tag.length <= 8));
  assert.ok(!draft.tags.some((tag) => /完整文字游戏|玩家目标|背景|对白|AI草稿|二创|Demon Slayer/.test(tag)));
});

test("creation templates produce different playable structures", () => {
  const prompt = "宝可梦中心雨夜值班，主角和皮卡丘一起找回走丢的伊布";
  const healing = createDraftFromPrompt(prompt, "healing", {}, 1760000000000);
  const adventure = createDraftFromPrompt(prompt, "adventure", {}, 1760000000000);
  const energy = createDraftFromPrompt(prompt, "energy", {}, 1760000000000);

  assert.equal(healing.creationBrief.genre, "陪伴小剧场");
  assert.ok(healing.scenes.some((scene) => scene.id === "warm_end"));
  assert.ok(healing.scenes.some((scene) => scene.id === "quiet_end"));
  assert.ok(!healing.scenes.some((scene) => scene.id === "decision"));

  assert.equal(adventure.creationBrief.genre, "选择冒险");
  assert.ok(adventure.scenes.some((scene) => scene.id === "decision"));
  assert.ok(adventure.scenes.some((scene) => scene.id === "secret_end"));
  assert.equal(adventure.scenes.find((scene) => scene.id === "decision").actions.length, 3);

  assert.equal(energy.creationBrief.genre, "反应挑战");
  assert.ok(energy.scenes.some((scene) => scene.challenge?.type === "quick_choice"));
  assert.ok(energy.scenes.some((scene) => scene.id === "retry_end"));

  for (const draft of [healing, adventure, energy]) {
    assert.ok(draft.qualityChecks.every((check) => check.status !== "blocked"));
    assert.deepEqual(validatePack(draft), []);
  }
});

test("createDraftFromPrompt honors requested scene count in the prompt", () => {
  const draft = createDraftFromPrompt(
    "完整文字游戏：雨夜便利店遇到会预言的猫，场景到10个，2个关键选择，2个结局",
    "adventure",
    {},
    1760000000000,
  );
  const report = createTextGamePlaytestReport(draft);

  assert.equal(draft.scenes.length, 10);
  assert.equal(report.summary.sceneCount, 10);
  assert.equal(report.unreachableSceneIds.length, 0);
  assert.deepEqual(validatePack(draft), []);
});

test("createDraftQualityChecks includes narrative maturity checks", () => {
  const draft = createDraftFromPrompt("一个雨夜便利店里，主角遇到会预言明天的猫", "adventure", {}, 1760000000000);
  const checks = createDraftQualityChecks(draft);
  const ids = checks.map((check) => check.id);

  for (const id of [
    "branch_depth",
    "ending_payoff",
    "prompt_specificity",
    "persona_voice",
    "copy_repetition",
    "creative_provenance",
    "review_readiness",
  ]) {
    assert.ok(ids.includes(id), `${id} quality check should be present`);
  }
  assert.equal(checks.find((check) => check.id === "branch_depth").status, "passed");
  assert.equal(checks.find((check) => check.id === "ending_payoff").status, "passed");
  assert.equal(checks.find((check) => check.id === "persona_voice").status, "passed");
});

test("createDraftQualityChecks reports unreachable scenes and missing asset plans", () => {
  const draft = createDraftFromPrompt("做一个断裂分支测试", "healing", {}, 1760000000000);
  draft.scenes.push({
    id: "orphan",
    background: "#111827",
    character: "？",
    speaker: "旁白",
    text: "这个场景暂时没有入口。",
    actions: [],
  });
  draft.assetPlan = [];

  const checks = createDraftQualityChecks(draft);

  assert.equal(checks.find((check) => check.id === "reachability").status, "warning");
  assert.equal(checks.find((check) => check.id === "assets").status, "warning");
  assert.deepEqual(validatePack(draft), []);
});

test("text-game playtest report blocks unreachable scenes and accidental dead ends", () => {
  const draft = createDraftFromPrompt("一个雨夜便利店里，主角遇到会预言明天的猫", "adventure", {}, 1760000000000);
  draft.scenes.push({
    id: "orphan",
    title: "孤立场景",
    background: "#111827",
    character: "？",
    speaker: "旁白",
    text: "这个场景暂时没有入口。",
    actions: [],
  });
  draft.scenes.find((scene) => scene.id === "investigate").actions = [];

  const report = createTextGamePlaytestReport(draft);

  assert.equal(report.status, "blocked");
  assert.ok(report.unreachableSceneIds.includes("orphan"));
  assert.ok(report.deadEndSceneIds.includes("investigate"));
  assert.ok(report.fixes.some((fix) => fix.id === "connect_unreachable"));
});

test("publish checklist aggregates playability and quality gates", () => {
  const draft = createDraftFromPrompt("做一个完整发布检查", "healing", {}, 1760000000000);
  const checklist = createPublishChecklist(draft, {
    qualityChecks: createDraftQualityChecks(draft),
    generatedAt: 1760000000000,
  });

  assert.equal(checklist.status, "passed");
  assert.ok(checklist.checks.some((check) => check.id === "cover" && check.status === "passed"));
  assert.ok(checklist.playtest.summary.endingCount >= 2);
});

test("createDraftFromPrompt keeps fanwork IP metadata", () => {
  const draft = createDraftFromPrompt(
    "做一个汽水星球支线",
    "energy",
    { originType: "fanwork", ipId: "soda_planet_fan" },
    1760000000000,
  );

  assert.equal(draft.contentOrigin, "fanwork");
  assert.equal(draft.ipId, "soda_planet_fan");
  assert.equal(draft.ipName, "汽水星球原创企划");
  assert.ok(!draft.tags.includes("汽水星球原创企划"));
  assert.deepEqual(validatePack(draft), []);
});

test("fanwork publish checklist requires rights acknowledgement", () => {
  const draft = createDraftFromPrompt(
    "宝可梦中心雨夜值班，主角和皮卡丘一起找回走丢的伊布",
    "adventure",
    { originType: "fanwork", ipId: "mainstream_pokemon", personaId: "pokemon_pikachu" },
    1760000000000,
  );

  const blocked = createPublishChecklist(draft);
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.checks.find((check) => check.id === "fanwork_rights_acknowledgement").status, "blocked");

  draft.rightsAcknowledgedAt = 1760000000001;
  const acknowledged = createPublishChecklist(draft);
  assert.notEqual(acknowledged.status, "blocked");
  assert.equal(acknowledged.checks.find((check) => check.id === "fanwork_rights_acknowledgement").status, "passed");
});

test("fanwork protagonist is not duplicated as the supporting character", () => {
  const draft = createDraftFromPrompt(
    "宝可梦中心雨夜值班，主角和皮卡丘一起找回走丢的伊布",
    "adventure",
    { originType: "fanwork", ipId: "mainstream_pokemon", personaId: "pokemon_pikachu" },
    1760000000000,
  );
  const npc = draft.characters.find((character) => character.id === "story_npc");

  assert.notEqual(npc.name, "皮卡丘");
  assert.ok(draft.scenes.every((scene) => !String(scene.text).includes("皮卡丘提醒皮卡丘")));
  assert.deepEqual(validatePack(draft), []);
});

test("story characters do not include player or generic protagonist placeholders", () => {
  const draft = createDraftFromPrompt(
    "完整文字游戏向文字游戏：主角在一个地点穿越到鬼灭之刃世界和主角们一起冒险的故事",
    "adventure",
    { originType: "fanwork", ipId: "mainstream_demon_slayer", personaId: "demon_slayer_tanjiro" },
    1760000000000,
  );

  assert.ok(draft.characters.every((character) => !["玩家", "主角们", "主角", "用户", "关键同伴", "线索提供者"].includes(character.name)));
  assert.ok(draft.characters.some((character) => character.name === "藤花信使"));
  assert.deepEqual(validatePack(draft), []);
});

test("local anime IP pool exposes characters for fanwork creation", () => {
  const fanworkIds = getIpEntriesForOrigin("fanwork").map((entry) => entry.id);

  assert.ok(fanworkIds.includes("anime_starlight_academy"));
  assert.ok(fanworkIds.includes("anime_mecha_tide"));
  assert.ok(fanworkIds.includes("anime_cat_ear_town"));
  assert.ok(fanworkIds.includes("anime_dragon_sleep_agency"));

  assert.deepEqual(
    getPersonasForIp("anime_starlight_academy").map((persona) => persona.name),
    ["露娜", "诺艾"],
  );
  assert.deepEqual(
    getPersonasForIp("anime_mecha_tide").map((persona) => persona.name),
    ["莲", "米卡"],
  );
  assert.deepEqual(
    getPersonasForIp("anime_cat_ear_town").map((persona) => persona.name),
    ["桃桃", "白羽"],
  );
  assert.deepEqual(
    getPersonasForIp("anime_dragon_sleep_agency").map((persona) => persona.name),
    ["秋也", "凛"],
  );
});

test("mainstream external IP pool exposes reference characters for fanwork creation", () => {
  const fanworkIds = getIpEntriesForOrigin("fanwork").map((entry) => entry.id);

  assert.ok(fanworkIds.includes("mainstream_pokemon"));
  assert.ok(fanworkIds.includes("mainstream_one_piece"));
  assert.ok(fanworkIds.includes("mainstream_naruto"));
  assert.ok(fanworkIds.includes("mainstream_demon_slayer"));
  assert.ok(fanworkIds.includes("mainstream_jujutsu_kaisen"));
  assert.ok(fanworkIds.includes("mainstream_attack_on_titan"));
  assert.ok(fanworkIds.includes("mainstream_dragon_ball"));
  assert.ok(fanworkIds.includes("mainstream_my_hero_academia"));

  assert.deepEqual(
    getPersonasForIp("mainstream_pokemon").map((persona) => persona.name),
    ["皮卡丘", "伊布"],
  );
  assert.deepEqual(
    getPersonasForIp("mainstream_one_piece").map((persona) => persona.name),
    ["路飞", "索隆"],
  );
  assert.deepEqual(
    getPersonasForIp("mainstream_jujutsu_kaisen").map((persona) => persona.name),
    ["虎杖悠仁", "五条悟"],
  );
  assert.deepEqual(
    getPersonasForIp("mainstream_demon_slayer").map((persona) => persona.name),
    ["灶门炭治郎", "灶门祢豆子", "我妻善逸", "嘴平伊之助", "富冈义勇", "胡蝶忍", "炼狱杏寿郎", "甘露寺蜜璃", "宇髄天元", "时透无一郎", "伊黑小芭内", "不死川实弥", "悲鸣屿行冥", "栗花落香奈乎", "不死川玄弥", "珠世", "愈史郎", "鬼舞辻无惨", "猗窝座", "童磨", "黑死牟", "累"],
  );
});

test("cloneAsRemix creates fanwork ancestry and clears store readiness", () => {
  const source = makeValidPack({ id: "h5_source", title: "源作品" });
  const remix = cloneAsRemix(source, 1760000000001);

  assert.equal(remix.contentOrigin, "fanwork");
  assert.equal(remix.ipId, "rain_gugu_universe");
  assert.equal(remix.ipName, "雨天咕咕宇宙");
  assert.equal(remix.fanworkOf, "h5_source");
  assert.equal(remix.remixOf, "h5_source");
  assert.equal(remix.storeStatus, "not_applied");
  assert.equal(remix.hardwareStatus, "h5_only");
  assert.equal(remix.rightsAcknowledgedAt, null);
  assert.deepEqual(validatePack(remix), []);
});

test("validatePack rejects fanwork without IP", () => {
  const errors = validatePack(makeValidPack({ contentOrigin: "fanwork", ipId: null, ipName: "" }));

  assert.ok(errors.includes("h5_test fanwork missing ipName"));
  assert.ok(errors.includes("h5_test fanwork missing ipId"));
});

test("validatePack rejects fanwork using an original-only IP", () => {
  const errors = validatePack(makeValidPack({
    contentOrigin: "fanwork",
    ipId: "workday_flash_project",
    ipName: "工位小闪原创企划",
  }));

  assert.ok(errors.includes("h5_test ipId does not support fanwork"));
});

test("validatePack rejects missing schemaVersion and invalid capabilities", () => {
  const errors = validatePack(makeValidPack({
    schemaVersion: undefined,
    capabilities: ["scene_graph", "teleport"],
  }));

  assert.ok(errors.includes("h5_test invalid schemaVersion"));
  assert.ok(errors.includes("h5_test invalid capability: teleport"));
});

test("validatePack enforces scene graph integrity and MVP scene cap", () => {
  const tooManyScenes = Array.from({ length: MAX_H5_SCENES + 1 }, (_, index) => ({
    id: `scene_${index}`,
    background: "#111827",
    character: "☔",
    speaker: "雨天咕咕",
    text: `第 ${index} 场`,
    actions: index === 0 ? [{ label: "缺失跳转", goto: "missing" }] : [],
  }));
  const errors = validatePack(makeValidPack({
    entrySceneId: "scene_0",
    scenes: tooManyScenes,
  }));

  assert.ok(errors.includes(`h5_test exceeds max scenes: ${MAX_H5_SCENES}`));
  assert.ok(errors.includes("h5_test/scene_0 action goto not found: missing"));
});
