export const AI_TEXT_GAME_PIPELINE_VERSION = "ai_text_game_pipeline_v1";

export const AI_TEXT_GAME_PIPELINE_STAGES = [
  {
    id: "understand_story",
    label: "正在理解你的故事",
    shortLabel: "理解",
    progress: 12,
    detail: "识别主题、情绪、玩法和权利边界。",
  },
  {
    id: "design_cast",
    label: "正在设计主角和人物",
    shortLabel: "角色",
    progress: 26,
    detail: "把社区分身、关键角色和口吻定下来。",
  },
  {
    id: "outline_scenes",
    label: "正在拆分剧本场景",
    shortLabel: "剧本",
    progress: 42,
    detail: "整理入口、分岔、结局和每一幕的作用。",
  },
  {
    id: "plan_backgrounds",
    label: "正在生成场景背景",
    shortLabel: "背景",
    progress: 58,
    detail: "为封面、背景和关键道具准备素材计划。",
  },
  {
    id: "plan_portraits",
    label: "正在生成人物立绘",
    shortLabel: "立绘",
    progress: 72,
    detail: "准备主角、配角和表情的视觉提示词。",
  },
  {
    id: "check_branches",
    label: "正在检查分支是否可玩",
    shortLabel: "检查",
    progress: 86,
    detail: "检查不可达场景、死路、无效跳转和结局差异。",
  },
  {
    id: "assemble_draft",
    label: "正在整理成文字游戏草稿",
    shortLabel: "草稿",
    progress: 100,
    detail: "把企划、角色、剧本、素材和检查结果装成作品。",
  },
];

export const AI_TEXT_GAME_WORKSPACE_SECTIONS = [
  { id: "brief", label: "企划", description: "标题、卖点、世界观、玩家目标和玩法说明。" },
  { id: "characters", label: "角色", description: "主角分身、关键人物、口吻、动机和立绘计划。" },
  { id: "script", label: "剧本", description: "场景、对话、旁白、选项和分支跳转。" },
  { id: "assets", label: "素材", description: "封面、背景、立绘、道具和素材来源。" },
  { id: "playtest", label: "试玩", description: "像玩家一样走完整个分支图。" },
  { id: "publish", label: "发布检查", description: "确认可玩性、完整度、权利和素材状态。" },
];

export const AI_TEXT_GAME_QUALITY_CHECK_IDS = [
  "schema",
  "ending",
  "ending_payoff",
  "reachability",
  "branch_depth",
  "mobile_copy",
  "copy_repetition",
  "prompt_specificity",
  "persona_voice",
  "assets",
  "creative_provenance",
  "review_readiness",
  "hardware",
];

export const TEXT_GAME_CHECK_STATUSES = ["passed", "warning", "blocked", "waived"];

export const AI_TEXT_GAME_JOB_STATUSES = [
  "queued",
  "running",
  "waiting_user",
  "succeeded",
  "failed",
  "canceled",
];

export const AI_EDIT_PROPOSAL_STATUSES = [
  "drafting",
  "proposed",
  "applied",
  "discarded",
  "failed",
];

export const AI_ASSET_GENERATION_STATUSES = [
  "draft_prompt",
  "local_preview",
  "queued",
  "generating",
  "ai_generated",
  "usable_h5",
  "failed",
  "optional",
];

const ENDING_TEXT_PATTERN = /结局|尾声|结束|终章|end|ending/i;
const RESTART_ACTION_PATTERN = /重新|再玩|重来|回到入口|从头|restart|replay/i;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compactText(value = "") {
  return String(value || "").trim();
}

function makeCheck(id, group, label, status, detail, fix = null, targetId = null) {
  return {
    id,
    group,
    label,
    status,
    detail,
    fix,
    targetId,
  };
}

function sceneEndingIntent(scene = {}, entrySceneId = "") {
  const actions = asArray(scene.actions);
  if (actions.some((action) => action.goto === entrySceneId && RESTART_ACTION_PATTERN.test(action.label || ""))) return true;
  if (ENDING_TEXT_PATTERN.test([scene.id, scene.title, scene.speaker, scene.text].filter(Boolean).join(" "))) return true;
  return false;
}

function buildGraph(pack = {}) {
  const scenes = asArray(pack.scenes);
  const sceneIds = new Set(scenes.map((scene) => scene.id).filter(Boolean));
  const entrySceneId = pack.entrySceneId && sceneIds.has(pack.entrySceneId)
    ? pack.entrySceneId
    : scenes[0]?.id || "";
  const reachable = new Set();
  const incoming = new Map(scenes.map((scene) => [scene.id, []]));
  const brokenBranches = [];
  const duplicateActionLabels = [];
  const selfLoops = [];
  const stack = entrySceneId ? [entrySceneId] : [];

  for (const scene of scenes) {
    const seenLabels = new Set();
    for (const action of asArray(scene.actions)) {
      const label = compactText(action.label);
      if (!label) brokenBranches.push({ sceneId: scene.id, reason: "missing_label", action });
      if (!action.goto || !sceneIds.has(action.goto)) {
        brokenBranches.push({ sceneId: scene.id, reason: "missing_target", action });
      } else {
        incoming.get(action.goto)?.push(scene.id);
      }
      if (label && seenLabels.has(label)) duplicateActionLabels.push({ sceneId: scene.id, label });
      if (label) seenLabels.add(label);
      if (action.goto === scene.id) selfLoops.push({ sceneId: scene.id, label });
    }
  }

  while (stack.length) {
    const sceneId = stack.pop();
    if (!sceneId || reachable.has(sceneId)) continue;
    reachable.add(sceneId);
    const scene = scenes.find((item) => item.id === sceneId);
    for (const action of asArray(scene?.actions)) {
      if (sceneIds.has(action.goto) && !reachable.has(action.goto)) stack.push(action.goto);
    }
  }

  const unreachable = scenes.filter((scene) => scene.id && !reachable.has(scene.id));
  const endingScenes = scenes.filter((scene) => reachable.has(scene.id) && sceneEndingIntent(scene, entrySceneId));
  const deadEnds = scenes.filter((scene) => (
    reachable.has(scene.id) &&
    !asArray(scene.actions).length &&
    !sceneEndingIntent(scene, entrySceneId)
  ));

  return {
    scenes,
    sceneIds,
    entrySceneId,
    reachable,
    incoming,
    brokenBranches,
    duplicateActionLabels,
    selfLoops,
    unreachable,
    endingScenes,
    deadEnds,
  };
}

function enumeratePaths(pack = {}, graph = buildGraph(pack), maxDepth = 18) {
  const paths = [];
  if (!graph.entrySceneId) return paths;

  function walk(sceneId, path) {
    const scene = graph.scenes.find((item) => item.id === sceneId);
    const nextPath = [...path, sceneId];
    const actions = asArray(scene?.actions).filter((action) => graph.sceneIds.has(action.goto));
    const isEnding = sceneEndingIntent(scene, graph.entrySceneId);
    const isDeadEnd = !actions.length && !isEnding;
    const isCycle = path.includes(sceneId);

    if (isEnding || isDeadEnd || isCycle || nextPath.length >= maxDepth) {
      paths.push({
        sceneIds: nextPath,
        endSceneId: sceneId,
        outcome: isEnding ? "ending" : isDeadEnd ? "dead_end" : isCycle ? "cycle" : "max_depth",
      });
      return;
    }

    for (const action of actions) walk(action.goto, nextPath);
  }

  walk(graph.entrySceneId, []);
  return paths;
}

function uniqueEndingTexts(scenes = []) {
  return new Set(scenes.map((scene) => compactText(scene.text).replace(/\s+/g, "").slice(0, 48)).filter(Boolean));
}

export function createTextGamePlaytestReport(pack = {}) {
  const graph = buildGraph(pack);
  const paths = enumeratePaths(pack, graph);
  const checks = [];
  const fixes = [];
  const scenes = graph.scenes;
  const assetPlan = asArray(pack.assetPlan);
  const persona = pack.persona || {};
  const cover = pack.cover || {};
  const missingBackgroundScenes = scenes.filter((scene) => !scene.background && !cover.background);
  const missingPortraitScenes = scenes.filter((scene) => !scene.character && !persona.avatar && !cover.character);
  const assetSourceMissing = assetPlan.filter((asset) => !asset.source || (!asset.prompt && !asset.sourceStatement));
  const logline = compactText(pack.creationBrief?.logline || pack.summary || pack.description || "");
  const title = compactText(pack.title);
  const personaInCharacters = asArray(pack.characters).some((character) => (
    character.id === persona.id ||
    character.name === persona.name ||
    /主角|分身/.test(character.role || "")
  ));
  const personaInScenes = scenes.some((scene) => (
    scene.speaker === persona.name ||
    scene.character === persona.avatar ||
    compactText(scene.text).includes(persona.name || "__missing_persona__")
  ));
  const coverReady = Boolean(cover.imageUrl || (cover.background && (cover.character || persona.avatar)));
  const allSceneIds = new Set(scenes.map((scene) => scene.id).filter(Boolean));

  if (!graph.entrySceneId) {
    checks.push(makeCheck("entry_scene", "playability", "入口场景", "blocked", "缺少可用入口场景。", "让 AI 指定入口场景或把第一幕设为入口。"));
  } else {
    checks.push(makeCheck("entry_scene", "playability", "入口场景", "passed", `入口是「${graph.entrySceneId}」。`));
  }

  if (allSceneIds.size !== scenes.length) {
    checks.push(makeCheck("scene_ids", "playability", "场景 ID", "blocked", "存在重复或空场景 ID。", "让 AI 重排场景 ID，并同步更新所有选项跳转。"));
  } else {
    checks.push(makeCheck("scene_ids", "playability", "场景 ID", "passed", "每个场景都有唯一 ID。"));
  }

  if (graph.brokenBranches.length) {
    checks.push(makeCheck("branch_targets", "playability", "选项跳转", "blocked", `${graph.brokenBranches.length} 个选项缺少文案或目标。`, "让 AI 修复全部无效跳转。"));
    fixes.push({ id: "repair_branch_targets", label: "修复无效跳转", targetIds: graph.brokenBranches.map((item) => item.sceneId) });
  } else {
    checks.push(makeCheck("branch_targets", "playability", "选项跳转", "passed", "所有选项都有有效跳转。"));
  }

  if (graph.unreachable.length) {
    checks.push(makeCheck("unreachable_scenes", "playability", "不可达场景", "blocked", `${graph.unreachable.length} 个场景从入口无法到达。`, "把孤立场景接到最近的分岔。"));
    fixes.push({ id: "connect_unreachable", label: "接入不可达场景", targetIds: graph.unreachable.map((scene) => scene.id) });
  } else {
    checks.push(makeCheck("unreachable_scenes", "playability", "不可达场景", "passed", "所有场景都能从入口到达。"));
  }

  if (graph.deadEnds.length) {
    checks.push(makeCheck("dead_ends", "playability", "意外死路", "blocked", `${graph.deadEnds.length} 个可达场景没有选项，也不是明确结局。`, "把死路标为结局或补一个继续选项。"));
    fixes.push({ id: "repair_dead_ends", label: "补齐死路选项", targetIds: graph.deadEnds.map((scene) => scene.id) });
  } else {
    checks.push(makeCheck("dead_ends", "playability", "意外死路", "passed", "没有意外死路。"));
  }

  const uniqueEndings = uniqueEndingTexts(graph.endingScenes);
  if (graph.endingScenes.length < 2 || uniqueEndings.size < 2) {
    checks.push(makeCheck("ending_coverage", "playability", "结局覆盖", "warning", "建议至少准备 2 个有差异的结局。", "让 AI 给每个结局增加独立反馈。"));
  } else {
    checks.push(makeCheck("ending_coverage", "playability", "结局覆盖", "passed", `已有 ${graph.endingScenes.length} 个结局，${uniqueEndings.size} 个独立反馈。`));
  }

  if (graph.duplicateActionLabels.length) {
    checks.push(makeCheck("choice_labels", "playability", "选项文案", "warning", `${graph.duplicateActionLabels.length} 组同场景选项文案重复。`, "让 AI 重写重复选项。"));
  } else {
    checks.push(makeCheck("choice_labels", "playability", "选项文案", "passed", "同场景选项没有明显重复。"));
  }

  if (!coverReady) {
    checks.push(makeCheck("cover", "assets", "封面", "blocked", "缺少可用于首页的封面背景或角色。", "生成封面或指定现有背景为封面。"));
    fixes.push({ id: "create_cover_asset", label: "补封面素材", targetIds: ["cover"] });
  } else {
    checks.push(makeCheck("cover", "assets", "封面", "passed", "封面可用于首页展示。"));
  }

  if (missingBackgroundScenes.length) {
    checks.push(makeCheck("scene_backgrounds", "assets", "场景背景", "blocked", `${missingBackgroundScenes.length} 个场景缺少背景。`, "批量补齐场景背景或继承封面背景。"));
    fixes.push({ id: "fill_scene_backgrounds", label: "补齐场景背景", targetIds: missingBackgroundScenes.map((scene) => scene.id) });
  } else {
    checks.push(makeCheck("scene_backgrounds", "assets", "场景背景", "passed", "每个场景都有背景或可继承背景。"));
  }

  if (missingPortraitScenes.length) {
    checks.push(makeCheck("character_portraits", "assets", "人物立绘", "warning", `${missingPortraitScenes.length} 个场景缺少人物表情或立绘。`, "为主角和关键角色补立绘。"));
  } else {
    checks.push(makeCheck("character_portraits", "assets", "人物立绘", "passed", "场景里有可显示的人物或表情。"));
  }

  if (!assetPlan.length || assetSourceMissing.length) {
    checks.push(makeCheck("asset_sources", "assets", "素材来源", assetPlan.length ? "warning" : "blocked", assetPlan.length ? `${assetSourceMissing.length} 项素材缺少来源或提示词。` : "缺少封面、背景、角色等素材计划。", "让 AI 生成素材清单并补齐来源声明。"));
  } else {
    checks.push(makeCheck("asset_sources", "assets", "素材来源", "passed", `${assetPlan.length} 项素材都有来源或提示词。`));
  }

  if (!logline || logline === title) {
    checks.push(makeCheck("summary", "content", "作品简介", "blocked", "缺少可发布的作品简介。", "让 AI 根据企划生成一句话简介。"));
  } else {
    checks.push(makeCheck("summary", "content", "作品简介", "passed", "作品简介完整。"));
  }

  if (!persona.id || !persona.name || !persona.avatar || !persona.roleType) {
    checks.push(makeCheck("persona_profile", "identity", "主角分身", "blocked", "主角分身缺少 ID、名字、头像或类型。", "重新选择或补全主角分身。"));
  } else if (!personaInCharacters || !personaInScenes) {
    checks.push(makeCheck("persona_presence", "identity", "分身登场", "warning", "主角分身需要更明确地出现在角色卡和剧本中。", "让 AI 把分身写入关键场景。"));
  } else {
    checks.push(makeCheck("persona_profile", "identity", "主角分身", "passed", `「${persona.name}」已作为故事主角和社区形象。`));
  }

  if (pack.contentOrigin === "fanwork" && (!pack.ipId || !pack.ipName)) {
    checks.push(makeCheck("rights_origin", "rights", "权利归属", "blocked", "二创作品缺少 IP 归属。", "选择 IP 池条目后再发布。"));
  } else {
    checks.push(makeCheck("rights_origin", "rights", "权利归属", "passed", pack.contentOrigin === "fanwork" ? `二创归属：${pack.ipName}` : "原创归属完整。"));
  }

  const blockedCount = checks.filter((check) => check.status === "blocked").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;
  const passedCount = checks.filter((check) => check.status === "passed").length;

  return {
    version: AI_TEXT_GAME_PIPELINE_VERSION,
    status: blockedCount ? "blocked" : warningCount ? "warning" : "passed",
    summary: {
      blockedCount,
      warningCount,
      passedCount,
      sceneCount: scenes.length,
      reachableCount: graph.reachable.size,
      pathCount: paths.length,
      endingCount: graph.endingScenes.length,
    },
    paths,
    unreachableSceneIds: graph.unreachable.map((scene) => scene.id),
    deadEndSceneIds: graph.deadEnds.map((scene) => scene.id),
    endingSceneIds: graph.endingScenes.map((scene) => scene.id),
    checks,
    fixes,
  };
}

export function createPublishChecklist(pack = {}, options = {}) {
  const playtest = createTextGamePlaytestReport(pack);
  const qualityChecks = asArray(options.qualityChecks || pack.qualityChecks);
  const rightsCheck = pack.contentOrigin === "fanwork" ? [{
    id: "fanwork_rights_acknowledgement",
    group: "rights",
    label: "二创权利声明",
    status: pack.rightsAcknowledgedAt ? "passed" : "blocked",
    detail: pack.rightsAcknowledgedAt
      ? "已确认二创来源和权利声明，发布后仍需保留归属信息。"
      : "二创作品必须确认来源和权利声明，不代表获得官方授权；上架或硬件分发需单独证明。",
    fix: pack.rightsAcknowledgedAt ? null : "回到归属和主角卡，勾选二创权利声明。",
    targetId: "rightsAcknowledgedAt",
  }] : [];
  const checks = [
    ...rightsCheck,
    ...playtest.checks,
    ...qualityChecks.map((check) => ({
      id: `quality_${check.id}`,
      group: "quality",
      label: check.label || check.id,
      status: check.status || "warning",
      detail: check.detail || "",
      fix: null,
      targetId: check.id,
    })),
  ];
  const blockedCount = checks.filter((check) => check.status === "blocked").length;
  const warningCount = checks.filter((check) => check.status === "warning").length;

  return {
    id: `publish_check_${pack.id || "draft"}`,
    version: AI_TEXT_GAME_PIPELINE_VERSION,
    target: options.target || "h5",
    status: blockedCount ? "blocked" : warningCount ? "warning" : "passed",
    checks,
    playtest,
    generatedAt: options.generatedAt || Date.now(),
  };
}

export function createAiEditProposalPreview(draft = {}, instruction = "", scope = { type: "work", ids: [] }, timestamp = Date.now()) {
  const previewDraft = structuredClone(draft);
  const cleanInstruction = compactText(instruction);
  const suffix = cleanInstruction ? `AI 修改建议：${cleanInstruction}` : "AI 修改建议";
  previewDraft.aiEditSummary = suffix;
  previewDraft.updatedAt = timestamp;

  if (scope.type === "scene" && scope.ids?.length) {
    previewDraft.scenes = asArray(previewDraft.scenes).map((scene) => (
      scope.ids.includes(scene.id)
        ? { ...scene, text: `${compactText(scene.text)} ${suffix}`.trim() }
        : scene
    ));
  } else if (cleanInstruction && previewDraft.creationBrief) {
    previewDraft.creationBrief = {
      ...previewDraft.creationBrief,
      logline: `${previewDraft.creationBrief.logline || previewDraft.title || "作品"}（${cleanInstruction}）`,
    };
  }

  return {
    id: `ai_edit_${timestamp}`,
    draftId: draft.id || null,
    status: "proposed",
    instruction: cleanInstruction,
    scope,
    summary: cleanInstruction ? `已根据「${cleanInstruction}」生成修改提案。` : "已生成修改提案。",
    affected: {
      scenes: scope.type === "scene" ? scope.ids || [] : asArray(previewDraft.scenes).map((scene) => scene.id).slice(0, 3),
      characters: scope.type === "character" ? asArray(previewDraft.characters).map((character) => character.id).slice(0, 3) : [],
      assets: scope.type === "assets" || scope.type === "image" ? asArray(previewDraft.assetPlan).map((asset) => asset.id).slice(0, 3) : [],
    },
    previewDraft,
    qualityChecks: [],
    createdAt: timestamp,
  };
}
