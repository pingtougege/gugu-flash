import {
  compileStoryProjectToH5Pack,
  createStoryProjectPlayabilityReport,
  validateStoryProject,
} from "./gugu-story-project.js";
import { validatePack } from "./gugu-h5-pack.js";

export const GUGU_STORY_AGENT_PIPELINE_VERSION = "gugu_story_agent_pipeline_v1";

export const GUGU_STORY_AGENT_STAGES = [
  {
    id: "brief_from_prompt",
    label: "企划理解",
    agentRole: "story_architect",
    inputSections: ["author_intent", "current_focus"],
    outputContract: "title, logline, audience, tone, rights context",
  },
  {
    id: "cast_design",
    label: "角色与分身",
    agentRole: "cast_designer",
    inputSections: ["author_intent", "world_state", "character_matrix"],
    outputContract: "persona usage, characters, voice, motivations",
  },
  {
    id: "scene_graph",
    label: "场景图",
    agentRole: "game_systems",
    inputSections: ["current_focus", "branch_hook_ledger", "choice_ledger"],
    outputContract: "entry, nodes, edges, reachable endings",
  },
  {
    id: "script_draft",
    label: "剧本正文",
    agentRole: "writer",
    inputSections: ["scene_summaries", "character_matrix", "world_state"],
    outputContract: "mobile-readable scenes, speakers, beats, choices",
  },
  {
    id: "asset_prompt_plan",
    label: "素材计划",
    agentRole: "asset_planner",
    inputSections: ["asset_rights", "scene_summaries", "character_matrix"],
    outputContract: "cover, background, character prompts and source statements",
  },
  {
    id: "quality_audit",
    label: "质量审计",
    agentRole: "auditor",
    inputSections: ["all_truth_sections"],
    outputContract: "playability, rights, copy, branch, asset and hardware checks",
  },
  {
    id: "quality_repair",
    label: "修复提案",
    agentRole: "reviser",
    inputSections: ["quality_audit", "all_truth_sections"],
    outputContract: "ordered repair actions without silent overwrite",
  },
];

export const GUGU_STORY_TRUTH_SECTIONS = [
  { id: "author_intent", authority: "direction", label: "长期作者意图" },
  { id: "current_focus", authority: "direction", label: "当前创作焦点" },
  { id: "world_state", authority: "foundation", label: "世界状态" },
  { id: "character_matrix", authority: "foundation", label: "角色矩阵" },
  { id: "branch_hook_ledger", authority: "runtime_truth", label: "分支伏笔账本" },
  { id: "choice_ledger", authority: "runtime_truth", label: "选项跳转账本" },
  { id: "scene_summaries", authority: "memory", label: "场景摘要" },
  { id: "asset_rights", authority: "rights", label: "素材与权利" },
];

export const GUGU_STORY_AUDIT_DIMENSIONS = [
  { id: "schema", label: "StoryProject 契约" },
  { id: "playability", label: "可玩性" },
  { id: "ending_payoff", label: "结局反馈" },
  { id: "branch_hook_ledger", label: "分支伏笔账本" },
  { id: "choice_ledger", label: "选项跳转账本" },
  { id: "mobile_copy", label: "手机阅读" },
  { id: "copy_repetition", label: "文本重复" },
  { id: "persona_voice", label: "分身出场" },
  { id: "asset_rights", label: "素材与权利" },
  { id: "creative_provenance", label: "AI 溯源" },
  { id: "hardware_adaptation", label: "硬件适配" },
];

const ISSUE_SCORE_COST = {
  critical: 18,
  warning: 7,
  info: 2,
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compactText(value = "", fallback = "") {
  return String(value || fallback || "").trim();
}

function normalizeText(value = "") {
  return compactText(value)
    .replace(/\s+/g, "")
    .toLowerCase();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function countCjkAwareChars(value = "") {
  return compactText(value).length;
}

function projectOrigin(project = {}) {
  const origin = project.origin || {};
  const contentOrigin = origin.contentOrigin || project.contentOrigin || "original";
  return {
    contentOrigin: contentOrigin === "fanwork" ? "fanwork" : "original",
    ipId: origin.ipId || project.ipId || null,
    ipName: origin.ipName || project.ipName || null,
    fanworkOf: origin.fanworkOf || project.fanworkOf || null,
    remixOf: origin.remixOf || project.remixOf || null,
    rightsAcknowledgedAt: origin.rightsAcknowledgedAt || project.rightsAcknowledgedAt || null,
  };
}

function graphNodes(project = {}) {
  return asArray(project.storyGraph?.nodes);
}

function graphEdges(project = {}) {
  return asArray(project.storyGraph?.edges);
}

function scriptScenes(project = {}) {
  return asArray(project.script?.scenes);
}

function sceneRuntimeId(node = {}) {
  return compactText(node.sceneId || node.id);
}

function sceneById(project = {}) {
  const map = new Map();
  for (const scene of scriptScenes(project)) {
    if (scene?.id) map.set(scene.id, scene);
  }
  return map;
}

function nodeById(project = {}) {
  return new Map(graphNodes(project).filter((node) => node?.id).map((node) => [node.id, node]));
}

function edgesBySource(project = {}) {
  const map = new Map(graphNodes(project).map((node) => [node.id, []]));
  for (const edge of graphEdges(project)) {
    if (!map.has(edge.fromNodeId)) map.set(edge.fromNodeId, []);
    map.get(edge.fromNodeId).push(edge);
  }
  return map;
}

function reachableNodeIds(project = {}) {
  const nodes = nodeById(project);
  const edges = graphEdges(project);
  const entry = project.storyGraph?.entryNodeId;
  const reachable = new Set();
  const stack = entry && nodes.has(entry) ? [entry] : [];

  while (stack.length) {
    const nodeId = stack.pop();
    if (!nodeId || reachable.has(nodeId)) continue;
    reachable.add(nodeId);
    for (const edge of edges) {
      if (edge.fromNodeId === nodeId && nodes.has(edge.toNodeId) && !reachable.has(edge.toNodeId)) {
        stack.push(edge.toNodeId);
      }
    }
  }

  return reachable;
}

function makeIssue(severity, dimensionId, category, message, suggestion, targetId = null) {
  return {
    severity,
    dimensionId,
    category,
    message,
    suggestion,
    targetId,
  };
}

function issueStatus(issues = []) {
  if (issues.some((issue) => issue.severity === "critical")) return "blocked";
  if (issues.some((issue) => issue.severity === "warning")) return "warning";
  return "passed";
}

function issueSummary(issues = []) {
  return {
    criticalCount: issues.filter((issue) => issue.severity === "critical").length,
    warningCount: issues.filter((issue) => issue.severity === "warning").length,
    infoCount: issues.filter((issue) => issue.severity === "info").length,
  };
}

function scoreIssues(issues = []) {
  const penalty = issues.reduce((total, issue) => total + (ISSUE_SCORE_COST[issue.severity] || 0), 0);
  return Math.max(0, 100 - penalty);
}

function makeDimension(id, issues = []) {
  const definition = GUGU_STORY_AUDIT_DIMENSIONS.find((item) => item.id === id) || { id, label: id };
  const scoped = issues.filter((issue) => issue.dimensionId === id);
  return {
    id,
    label: definition.label,
    status: issueStatus(scoped),
    ...issueSummary(scoped),
  };
}

function mapPlaytestCheckDimension(check = {}) {
  if (/ending/i.test(check.id || "")) return "ending_payoff";
  if (check.group === "assets" || check.id === "asset_sources" || check.id === "cover") return "asset_rights";
  if (check.group === "identity" || /^persona/.test(check.id || "")) return "persona_voice";
  if (check.group === "rights" || /^rights/.test(check.id || "")) return "asset_rights";
  if (/choice|branch/.test(check.id || "")) return "choice_ledger";
  return "playability";
}

function buildContextEntry(id, reason, excerpt) {
  const definition = GUGU_STORY_TRUTH_SECTIONS.find((item) => item.id === id) || { authority: "memory" };
  return {
    source: id,
    authority: definition.authority,
    reason,
    excerpt: compactText(excerpt).slice(0, 320),
  };
}

export function createStoryTruthBundle(project = {}, options = {}) {
  const generatedAt = options.generatedAt || Date.now();
  const origin = projectOrigin(project);
  const nodes = graphNodes(project);
  const edges = graphEdges(project);
  const scenes = sceneById(project);
  const nodeMap = nodeById(project);
  const outgoing = edgesBySource(project);
  const reachable = reachableNodeIds(project);
  const persona = project.persona || {};
  const worldRules = asArray(project.world?.rules).map((rule) => compactText(rule)).filter(Boolean);
  const branchNodes = nodes.filter((node) => (outgoing.get(node.id) || []).length > 1);
  const endingNodes = nodes.filter((node) => node.type === "ending");

  const sceneSummaries = nodes.map((node, index) => {
    const sceneId = sceneRuntimeId(node);
    const scene = scenes.get(sceneId) || {};
    const choices = asArray(outgoing.get(node.id)).map((edge) => ({
      edgeId: edge.id || `${node.id}_${edge.toNodeId}`,
      label: compactText(edge.label, "继续"),
      targetNodeId: edge.toNodeId,
      targetTitle: nodeMap.get(edge.toNodeId)?.title || edge.toNodeId,
    }));
    return {
      sceneId,
      nodeId: node.id || sceneId || `node_${index + 1}`,
      type: node.type || "scene",
      title: compactText(scene.title || node.title || `第 ${index + 1} 幕`),
      speaker: compactText(scene.speaker || persona.name || "旁白"),
      textExcerpt: compactText(scene.text || node.summary || node.title).slice(0, 120),
      reachable: node.id ? reachable.has(node.id) : false,
      choiceCount: choices.length,
      choices,
    };
  });

  const choiceLedger = edges.map((edge, index) => {
    const source = nodeMap.get(edge.fromNodeId) || {};
    const target = nodeMap.get(edge.toNodeId) || {};
    return {
      id: edge.id || `edge_${index + 1}`,
      fromNodeId: edge.fromNodeId || null,
      fromTitle: source.title || edge.fromNodeId || null,
      toNodeId: edge.toNodeId || null,
      toTitle: target.title || edge.toNodeId || null,
      targetType: target.type || "unknown",
      label: compactText(edge.label),
    };
  });

  const branchHookLedger = [
    ...branchNodes.map((node) => ({
      hookId: `branch_${node.id}`,
      type: "player_choice",
      status: "open",
      sourceNodeId: node.id,
      sourceTitle: node.title || node.id,
      expectedPayoff: `玩家在「${node.title || node.id}」的选择需要导向可区分反馈。`,
      payoffTargetIds: asArray(outgoing.get(node.id)).map((edge) => edge.toNodeId),
    })),
    ...endingNodes.map((node) => ({
      hookId: `ending_${node.id}`,
      type: "ending_payoff",
      status: reachable.has(node.id) ? "resolved" : "blocked",
      sourceNodeId: node.id,
      sourceTitle: node.title || node.id,
      expectedPayoff: `结局「${node.title || node.id}」需要兑现一个独立情绪或信息反馈。`,
      payoffTargetIds: [node.id],
    })),
  ];

  const characters = asArray(project.characters).map((character, index) => {
    const name = compactText(character.name || character.id || `角色 ${index + 1}`);
    const appearsInSceneIds = sceneSummaries
      .filter((scene) => (
        scene.speaker === name ||
        scene.textExcerpt.includes(name) ||
        (character.avatar && scene.textExcerpt.includes(character.avatar))
      ))
      .map((scene) => scene.sceneId);
    return {
      id: character.id || `character_${index + 1}`,
      name,
      role: compactText(character.role),
      motivation: compactText(character.motivation),
      voice: compactText(character.voice),
      avatar: character.avatar || null,
      appearsInSceneIds,
    };
  });

  const assets = asArray(project.assets).map((asset, index) => ({
    id: asset.id || asset.assetId || `asset_${index + 1}`,
    type: asset.type || asset.kind || "asset",
    name: asset.name || `素材 ${index + 1}`,
    usage: asset.usage || "",
    source: asset.source || asset.sourceStatement || "",
    sourceStatement: asset.sourceStatement || "",
    prompt: asset.prompt || asset.visualPrompt || "",
    status: asset.status || "draft_prompt",
  }));

  return {
    version: GUGU_STORY_AGENT_PIPELINE_VERSION,
    projectId: project.id || null,
    title: project.title || "",
    generatedAt,
    source: options.source || "gugu_story_project",
    sections: GUGU_STORY_TRUTH_SECTIONS,
    authorIntent: {
      title: project.title || "",
      logline: project.brief?.logline || project.summary || "",
      genre: project.brief?.genre || "",
      audience: project.brief?.audience || "mobile_short_play",
      tone: project.brief?.tone || "",
      sourcePrompt: project.brief?.sourcePrompt || "",
    },
    currentFocus: {
      stage: options.stage || project.status || "draft",
      goals: unique([
        project.brief?.logline,
        project.world?.stakes,
        "产出可试玩、可审核、可发布的互动短篇。",
      ]),
      mustKeep: unique([
        project.storyGraph?.entryNodeId ? `入口节点：${project.storyGraph.entryNodeId}` : "",
        persona.name ? `主角分身：${persona.name}` : "",
        origin.contentOrigin === "fanwork" && origin.ipName ? `二创归属：${origin.ipName}` : "",
      ]),
      mustAvoid: [
        "不要返回只有正文、没有节点和跳转的草稿。",
        "不要让二创作品暗示官方授权。",
        "不要让不可达场景或意外死路进入发布版本。",
      ],
    },
    worldState: {
      setting: project.world?.setting || "",
      stakes: project.world?.stakes || "",
      rules: worldRules,
      facts: [
        project.world?.setting ? { subject: "world", predicate: "setting", object: project.world.setting } : null,
        project.world?.stakes ? { subject: "world", predicate: "stakes", object: project.world.stakes } : null,
        ...worldRules.map((rule, index) => ({ subject: "world", predicate: `rule_${index + 1}`, object: rule })),
      ].filter(Boolean),
    },
    characterMatrix: {
      persona: {
        id: persona.id || null,
        name: persona.name || "",
        avatar: persona.avatar || "",
        roleType: persona.roleType || "",
        tagline: persona.tagline || "",
      },
      characters,
    },
    branchHookLedger,
    choiceLedger,
    sceneSummaries,
    assetRights: {
      contentOrigin: origin.contentOrigin,
      ipId: origin.ipId,
      ipName: origin.ipName,
      fanworkOf: origin.fanworkOf,
      remixOf: origin.remixOf,
      rightsAcknowledgedAt: origin.rightsAcknowledgedAt,
      assets,
      missingSourceAssetIds: assets
        .filter((asset) => !asset.source || (!asset.prompt && !asset.sourceStatement))
        .map((asset) => asset.id),
    },
  };
}

export function createStoryAgentRuntimePlan(project = {}, options = {}) {
  const truthBundle = options.truthBundle || createStoryTruthBundle(project, options);
  const context = [
    buildContextEntry(
      "author_intent",
      "Keep the long-horizon creator promise visible.",
      `${truthBundle.authorIntent.title} | ${truthBundle.authorIntent.logline}`,
    ),
    buildContextEntry(
      "current_focus",
      "Use the current project status and publish goal as the active task frame.",
      [...truthBundle.currentFocus.goals, ...truthBundle.currentFocus.mustKeep].join(" | "),
    ),
    buildContextEntry(
      "world_state",
      "Preserve setting, stakes and world rules while editing scenes.",
      [truthBundle.worldState.setting, truthBundle.worldState.stakes, ...truthBundle.worldState.rules].join(" | "),
    ),
    buildContextEntry(
      "character_matrix",
      "Keep persona, role motivation and voice consistent.",
      asArray(truthBundle.characterMatrix.characters).map((character) => (
        `${character.name}:${character.role || character.motivation || "角色"}`
      )).join(" | "),
    ),
    buildContextEntry(
      "branch_hook_ledger",
      "Make every player choice resolve into a distinct reachable payoff.",
      truthBundle.branchHookLedger.map((hook) => `${hook.hookId}:${hook.status}`).join(" | "),
    ),
    buildContextEntry(
      "asset_rights",
      "Keep source statements and fanwork rights visible before publish.",
      `${truthBundle.assetRights.contentOrigin} | ${truthBundle.assetRights.ipName || ""} | assets=${truthBundle.assetRights.assets.length}`,
    ),
  ].filter((entry) => entry.excerpt);

  return {
    version: GUGU_STORY_AGENT_PIPELINE_VERSION,
    projectId: project.id || null,
    stages: GUGU_STORY_AGENT_STAGES.map((stage, index) => ({
      ...stage,
      order: index + 1,
      status: "planned",
    })),
    selectedContext: context,
    ruleStack: {
      layers: [
        { id: "gugu_platform_contract", scope: "global", precedence: 100 },
        { id: "story_project_contract", scope: "project", precedence: 80 },
        { id: "current_story_focus", scope: "local", precedence: 60 },
      ],
      sections: {
        hard: [
          "schemaVersion must be gugu_story_project_v1.",
          "storyGraph.entryNodeId must point at an existing node.",
          "Every edge target must point at an existing node.",
          "Every node must map to a script scene.",
          "At least one reachable ending is required.",
          "Fanwork projects must keep IP identity and rights metadata.",
        ],
        soft: [
          "Prefer at least two reachable endings with different payoff text.",
          "Keep scene text short enough for phone reading.",
          "Make the selected persona visible in character cards and scenes.",
          "Every public asset should have a source or prompt statement.",
        ],
        diagnostic: [
          "Record provider, model, prompt and generated fields for AI output.",
          "Keep audit issues as repair proposals; do not silently overwrite user work.",
          "Compile to GuguH5Pack before preview or publish.",
        ],
      },
    },
    trace: {
      sourceProjectId: project.id || null,
      sourceSections: truthBundle.sections.map((section) => section.id),
      generatedAt: options.generatedAt || truthBundle.generatedAt,
      notes: [
        "Clean-room Gugu adaptation of staged fiction-agent architecture.",
        "No external source code or prompt text is embedded.",
      ],
    },
  };
}

export function auditStoryProjectWithTruth(project = {}, options = {}) {
  const generatedAt = options.generatedAt || Date.now();
  const target = options.target || "draft";
  const truthBundle = options.truthBundle || createStoryTruthBundle(project, { ...options, generatedAt });
  const issues = [];

  for (const error of validateStoryProject(project)) {
    issues.push(makeIssue(
      "critical",
      "schema",
      "story_project_validation",
      error,
      "修复 StoryProject 的节点、场景、跳转或权利字段后再生成预览。",
    ));
  }

  let pack = null;
  let playabilityReport = null;
  try {
    const packId = options.packId || project.outputWorkId || project.id?.replace(/^story_project_/, "h5_") || "h5_story_project_audit";
    pack = compileStoryProjectToH5Pack(project, {
      packId,
      status: "draft_h5",
      timestamp: generatedAt,
    });
    for (const error of validatePack(pack)) {
      issues.push(makeIssue(
        "critical",
        "schema",
        "compiled_pack_validation",
        error,
        "修复 StoryProject 后重新编译 GuguH5Pack。",
      ));
    }
    playabilityReport = createStoryProjectPlayabilityReport(project, {
      packId,
      generatedAt,
      timestamp: generatedAt,
    });
  } catch (error) {
    issues.push(makeIssue(
      "critical",
      "playability",
      "compile_exception",
      `StoryProject cannot compile: ${String(error.message || error)}`,
      "先修复结构错误，再运行 H5 编译。",
    ));
  }

  for (const check of asArray(playabilityReport?.playtest?.checks)) {
    if (check.status !== "blocked" && check.status !== "warning") continue;
    issues.push(makeIssue(
      check.status === "blocked" ? "critical" : "warning",
      mapPlaytestCheckDimension(check),
      check.id || "playtest_check",
      check.detail || check.label || "playtest check failed",
      check.fix || "按检查项修复后重新审计。",
      check.targetId || null,
    ));
  }

  const nodes = graphNodes(project);
  const edges = graphEdges(project);
  const outgoing = edgesBySource(project);
  const scenes = scriptScenes(project);
  const origin = projectOrigin(project);
  const persona = project.persona || {};
  const branchNodes = nodes.filter((node) => (outgoing.get(node.id) || []).length > 1);

  if (!branchNodes.length && nodes.length > 2) {
    issues.push(makeIssue(
      "warning",
      "branch_hook_ledger",
      "missing_meaningful_branch",
      "故事图没有明确分岔，互动感偏弱。",
      "至少给一个关键场景提供两个会导向不同反馈的选择。",
      "storyGraph.edges",
    ));
  }

  const longScenes = scenes.filter((scene) => countCjkAwareChars(scene.text) > (options.mobileTextMax || 120));
  const emptyOrTinyScenes = scenes.filter((scene) => countCjkAwareChars(scene.text) > 0 && countCjkAwareChars(scene.text) < 12);
  if (longScenes.length) {
    issues.push(makeIssue(
      "warning",
      "mobile_copy",
      "scene_text_too_long",
      `${longScenes.length} 个场景正文超过手机短篇建议长度。`,
      "把长段落拆成更短的场景正文或对话。",
      longScenes[0]?.id || "script.scenes",
    ));
  }
  if (emptyOrTinyScenes.length) {
    issues.push(makeIssue(
      "warning",
      "mobile_copy",
      "scene_text_too_thin",
      `${emptyOrTinyScenes.length} 个场景正文信息量过低。`,
      "补上可见动作、情绪变化或选择前因。",
      emptyOrTinyScenes[0]?.id || "script.scenes",
    ));
  }

  const fingerprints = new Map();
  for (const scene of scenes) {
    const key = normalizeText(scene.text).slice(0, 48);
    if (!key) continue;
    fingerprints.set(key, [...(fingerprints.get(key) || []), scene.id]);
  }
  const duplicateTextSceneIds = Array.from(fingerprints.values()).filter((ids) => ids.length > 1).flat();
  if (duplicateTextSceneIds.length) {
    issues.push(makeIssue(
      "warning",
      "copy_repetition",
      "duplicate_scene_copy",
      `${duplicateTextSceneIds.length} 个场景正文开头高度重复。`,
      "重写重复场景，让每个分支有独立信息或情绪反馈。",
      duplicateTextSceneIds[0],
    ));
  }

  const personaInCharacters = asArray(project.characters).some((character) => (
    character.id === persona.id ||
    character.name === persona.name ||
    /主角|分身/.test(character.role || "")
  ));
  const personaInScenes = scenes.some((scene) => (
    scene.speaker === persona.name ||
    scene.character === persona.avatar ||
    compactText(scene.text).includes(persona.name || "__missing_persona__")
  ));
  if (!persona.id || !persona.name) {
    issues.push(makeIssue(
      "critical",
      "persona_voice",
      "missing_persona",
      "缺少主角分身身份。",
      "为 StoryProject 绑定 persona，并让它进入角色矩阵。",
      "persona",
    ));
  } else if (!personaInCharacters || !personaInScenes) {
    issues.push(makeIssue(
      "warning",
      "persona_voice",
      "persona_not_visible",
      "主角分身没有同时出现在角色卡和剧本中。",
      "把分身写入关键角色和至少一个场景。",
      "persona",
    ));
  }

  const repeatedChoiceLabels = [];
  const longChoiceLabels = [];
  for (const node of nodes) {
    const seen = new Set();
    for (const edge of asArray(outgoing.get(node.id))) {
      const label = compactText(edge.label);
      if (label.length > 16) longChoiceLabels.push(edge.id || `${edge.fromNodeId}_${edge.toNodeId}`);
      if (label && seen.has(label)) repeatedChoiceLabels.push(edge.id || `${edge.fromNodeId}_${edge.toNodeId}`);
      if (label) seen.add(label);
    }
  }
  if (repeatedChoiceLabels.length) {
    issues.push(makeIssue(
      "warning",
      "choice_ledger",
      "duplicate_choice_labels",
      `${repeatedChoiceLabels.length} 个选项文案在同一场景内重复。`,
      "重写选项文案，让玩家能区分选择含义。",
      repeatedChoiceLabels[0],
    ));
  }
  if (longChoiceLabels.length) {
    issues.push(makeIssue(
      "warning",
      "choice_ledger",
      "choice_label_too_long",
      `${longChoiceLabels.length} 个选项文案偏长，不适合徽章或手机按钮。`,
      "压缩选项文案到 16 字以内。",
      longChoiceLabels[0],
    ));
  }

  const assets = asArray(project.assets);
  const missingSourceAssets = assets.filter((asset) => !asset.source || (!asset.prompt && !asset.sourceStatement && !asset.visualPrompt));
  if (!assets.length || missingSourceAssets.length) {
    issues.push(makeIssue(
      target === "publish" && !assets.length ? "critical" : "warning",
      "asset_rights",
      "asset_source_missing",
      assets.length ? `${missingSourceAssets.length} 项素材缺少来源或提示词。` : "缺少素材计划。",
      "补齐封面、背景、角色素材计划，并记录来源或 prompt。",
      missingSourceAssets[0]?.id || "assets",
    ));
  }
  if (origin.contentOrigin === "fanwork" && !origin.rightsAcknowledgedAt) {
    issues.push(makeIssue(
      target === "publish" ? "critical" : "warning",
      "asset_rights",
      "fanwork_rights_ack_missing",
      "二创作品尚未记录权利声明确认时间。",
      "发布前要求创作者确认二创来源和权利边界。",
      "origin.rightsAcknowledgedAt",
    ));
  }

  if (!asArray(project.aiProvenance).length) {
    issues.push(makeIssue(
      "warning",
      "creative_provenance",
      "ai_provenance_missing",
      "缺少 AI 生成或编辑溯源记录。",
      "记录 provider、model、prompt、stage 和 generatedFields。",
      "aiProvenance",
    ));
  }

  const actionHeavyScenes = nodes.filter((node) => asArray(outgoing.get(node.id)).length > 3);
  const hardwareLongScenes = scenes.filter((scene) => countCjkAwareChars(scene.text) > 96);
  if (actionHeavyScenes.length || hardwareLongScenes.length) {
    issues.push(makeIssue(
      "info",
      "hardware_adaptation",
      "badge_ui_pressure",
      "部分场景在低刷新徽章上可能需要压缩正文或选项数量。",
      "硬件候选阶段再生成兼容报告，并把长场景拆短。",
      actionHeavyScenes[0]?.id || hardwareLongScenes[0]?.id || "storyGraph",
    ));
  }

  const dimensions = GUGU_STORY_AUDIT_DIMENSIONS.map((dimension) => makeDimension(dimension.id, issues));
  const status = issueStatus(issues);
  const score = scoreIssues(issues);

  return {
    version: GUGU_STORY_AGENT_PIPELINE_VERSION,
    projectId: project.id || null,
    target,
    status,
    score,
    issues,
    dimensions,
    summary: {
      ...issueSummary(issues),
      sceneCount: scenes.length,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      branchNodeCount: branchNodes.length,
      endingCount: nodes.filter((node) => node.type === "ending").length,
    },
    truthDigest: {
      sectionCount: truthBundle.sections.length,
      branchHookCount: truthBundle.branchHookLedger.length,
      choiceCount: truthBundle.choiceLedger.length,
      assetCount: truthBundle.assetRights.assets.length,
    },
    playabilityReport,
    compiledPackId: pack?.id || playabilityReport?.compiledPackId || null,
    generatedAt,
  };
}

function repairActionForIssue(issue = {}, index = 0) {
  const actionByDimension = {
    schema: {
      stage: "quality_repair",
      type: "repair_contract",
      title: "修复 StoryProject 契约",
    },
    playability: {
      stage: "quality_repair",
      type: "repair_playability",
      title: "修复可玩性阻塞",
    },
    ending_payoff: {
      stage: "scene_graph",
      type: "differentiate_endings",
      title: "区分结局反馈",
    },
    branch_hook_ledger: {
      stage: "scene_graph",
      type: "strengthen_branch",
      title: "增强关键分岔",
    },
    choice_ledger: {
      stage: "scene_graph",
      type: "repair_choices",
      title: "修复选项账本",
    },
    mobile_copy: {
      stage: "script_draft",
      type: "rewrite_mobile_copy",
      title: "压缩手机正文",
    },
    copy_repetition: {
      stage: "script_draft",
      type: "rewrite_repeated_copy",
      title: "重写重复场景",
    },
    persona_voice: {
      stage: "cast_design",
      type: "restore_persona_voice",
      title: "补强分身出场",
    },
    asset_rights: {
      stage: "asset_prompt_plan",
      type: "complete_asset_rights",
      title: "补齐素材与权利",
    },
    creative_provenance: {
      stage: "quality_audit",
      type: "record_provenance",
      title: "补记录 AI 溯源",
    },
    hardware_adaptation: {
      stage: "quality_audit",
      type: "flag_hardware_adaptation",
      title: "标记硬件候选适配",
    },
  };
  const base = actionByDimension[issue.dimensionId] || actionByDimension.playability;
  return {
    id: `repair_${String(index + 1).padStart(2, "0")}_${issue.category || issue.dimensionId || "issue"}`,
    stage: base.stage,
    type: base.type,
    title: base.title,
    severity: issue.severity || "warning",
    targetId: issue.targetId || null,
    reason: issue.message || "",
    instruction: issue.suggestion || "修复后重新运行质量审计。",
    canAutoApply: false,
  };
}

export function createStoryRepairProposal(project = {}, audit = null, options = {}) {
  const generatedAt = options.generatedAt || audit?.generatedAt || Date.now();
  const result = audit || auditStoryProjectWithTruth(project, { ...options, generatedAt });
  const repairableIssues = asArray(result.issues).filter((issue) => issue.severity !== "info");
  const actions = repairableIssues.map(repairActionForIssue);

  return {
    id: `story_repair_${project.id || "draft"}`,
    version: GUGU_STORY_AGENT_PIPELINE_VERSION,
    projectId: project.id || null,
    status: actions.length ? "proposal_ready" : "no_action_needed",
    sourceAuditStatus: result.status,
    sourceAuditScore: result.score,
    actions,
    suggestedStageOrder: unique(actions.map((action) => action.stage)),
    blockingCount: actions.filter((action) => action.severity === "critical").length,
    generatedAt,
  };
}

export function createStoryProjectAgentWorkup(project = {}, options = {}) {
  const generatedAt = options.generatedAt || Date.now();
  const truthBundle = createStoryTruthBundle(project, { ...options, generatedAt });
  const runtimePlan = createStoryAgentRuntimePlan(project, { ...options, generatedAt, truthBundle });
  const audit = auditStoryProjectWithTruth(project, { ...options, generatedAt, truthBundle });
  const repairProposal = createStoryRepairProposal(project, audit, { ...options, generatedAt });

  return {
    version: GUGU_STORY_AGENT_PIPELINE_VERSION,
    projectId: project.id || null,
    generatedAt,
    truthBundle,
    runtimePlan,
    audit,
    repairProposal,
  };
}

export function enrichStoryProjectWithAgentWorkup(project = {}, options = {}) {
  const generatedAt = options.generatedAt || Date.now();
  const nextProject = structuredClone(project || {});
  const agentWorkup = createStoryProjectAgentWorkup(nextProject, { ...options, generatedAt });
  const existingReports = asArray(nextProject.qualityReports)
    .filter((report) => report?.type !== "story_agent_audit");

  return {
    ...nextProject,
    agentWorkup,
    qualityReports: [
      ...existingReports,
      {
        id: `story_agent_audit_${nextProject.id || "draft"}`,
        type: "story_agent_audit",
        version: GUGU_STORY_AGENT_PIPELINE_VERSION,
        status: agentWorkup.audit.status,
        score: agentWorkup.audit.score,
        summary: agentWorkup.audit.summary,
        generatedAt,
      },
    ],
  };
}
