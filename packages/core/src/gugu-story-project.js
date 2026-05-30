import {
  GUGU_H5_SCHEMA_VERSION,
  getIpEntry,
  getPersona,
  getZone,
  validatePack,
} from "./gugu-h5-pack.js";
import {
  createPublishChecklist,
  createTextGamePlaytestReport,
} from "./ai-text-game-contract.js";

export const GUGU_STORY_PROJECT_SCHEMA_VERSION = "gugu_story_project_v1";

export const GUGU_STORY_PROJECT_STATUSES = [
  "draft",
  "validating",
  "ready_to_preview",
  "ready_to_publish",
  "published",
  "archived",
];

export const GUGU_STORY_NODE_TYPES = ["scene", "ending"];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function compactText(value = "", fallback = "") {
  return String(value || fallback || "").trim();
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function makeError(code, message, path = "") {
  return path ? `${code}: ${path} ${message}` : `${code}: ${message}`;
}

function normalizeId(value, fallback) {
  return compactText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || fallback;
}

function projectOrigin(project = {}) {
  const origin = project.origin || {};
  return {
    contentOrigin: origin.contentOrigin === "fanwork" ? "fanwork" : "original",
    ipId: origin.ipId || null,
    ipName: origin.ipName || getIpEntry(origin.ipId)?.name || null,
    fanworkOf: origin.fanworkOf || null,
    remixOf: origin.remixOf || null,
    rightsAcknowledgedAt: origin.rightsAcknowledgedAt || null,
  };
}

function projectPersona(project = {}) {
  const persona = project.persona || {};
  const ipEntry = getIpEntry(projectOrigin(project).ipId);
  return persona.id || persona.name
    ? {
        id: persona.id || normalizeId(persona.name, "custom_persona"),
        name: persona.name || "原创分身",
        avatar: persona.avatar || String(persona.name || "原").slice(0, 1),
        roleType: persona.roleType || "creator_original",
        tagline: persona.tagline || "用户原创社区分身",
        cloneOf: persona.cloneOf || null,
      }
    : getPersona(ipEntry?.personaIds?.[0] || "rain_gugu");
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

function nodeRuntimeId(node = {}) {
  return normalizeId(node.sceneId || node.id, "scene");
}

function sceneById(project = {}) {
  const map = new Map();
  for (const scene of scriptScenes(project)) {
    const id = normalizeId(scene.id, "");
    if (id) map.set(id, scene);
  }
  return map;
}

function reachableNodeIds(project = {}, nodeIds = new Set()) {
  const entryNodeId = project.storyGraph?.entryNodeId;
  const edges = graphEdges(project);
  const reachable = new Set();
  const stack = entryNodeId && nodeIds.has(entryNodeId) ? [entryNodeId] : [];

  while (stack.length) {
    const nodeId = stack.pop();
    if (!nodeId || reachable.has(nodeId)) continue;
    reachable.add(nodeId);
    for (const edge of edges) {
      if (edge.fromNodeId === nodeId && nodeIds.has(edge.toNodeId) && !reachable.has(edge.toNodeId)) {
        stack.push(edge.toNodeId);
      }
    }
  }

  return reachable;
}

export function validateStoryProject(project = {}) {
  const errors = [];
  if (!project || typeof project !== "object") return ["project must be an object"];
  if (!project.id) errors.push(makeError("missing_id", "project missing id"));
  if (project.schemaVersion !== GUGU_STORY_PROJECT_SCHEMA_VERSION) {
    errors.push(makeError("invalid_schema_version", `expected ${GUGU_STORY_PROJECT_SCHEMA_VERSION}`));
  }
  if (!project.title) errors.push(makeError("missing_title", "project missing title"));
  if (!GUGU_STORY_PROJECT_STATUSES.includes(project.status || "draft")) {
    errors.push(makeError("invalid_status", `unsupported status ${project.status}`));
  }

  const origin = projectOrigin(project);
  if (origin.contentOrigin === "fanwork" && !origin.ipId) {
    errors.push(makeError("missing_ip", "fanwork project requires origin.ipId", "origin.ipId"));
  }
  if (origin.ipId && !getIpEntry(origin.ipId)) {
    errors.push(makeError("invalid_ip", `unknown ipId ${origin.ipId}`, "origin.ipId"));
  }

  const nodes = graphNodes(project);
  const edges = graphEdges(project);
  const scenes = scriptScenes(project);
  const nodeIds = new Set();
  const duplicateNodeIds = [];
  const sceneIds = new Set();
  const duplicateSceneIds = [];

  if (!nodes.length) errors.push(makeError("missing_nodes", "storyGraph.nodes must contain at least one node"));
  if (!project.storyGraph?.entryNodeId) errors.push(makeError("missing_entry", "storyGraph.entryNodeId is required"));

  for (const node of nodes) {
    if (!node.id) errors.push(makeError("missing_node_id", "node missing id", "storyGraph.nodes"));
    if (node.id && nodeIds.has(node.id)) duplicateNodeIds.push(node.id);
    if (node.id) nodeIds.add(node.id);
    if (!GUGU_STORY_NODE_TYPES.includes(node.type || "scene")) {
      errors.push(makeError("invalid_node_type", `node ${node.id || "(missing)"} has invalid type ${node.type}`));
    }
  }
  for (const id of duplicateNodeIds) errors.push(makeError("duplicate_node", `duplicate node id ${id}`));
  if (project.storyGraph?.entryNodeId && !nodeIds.has(project.storyGraph.entryNodeId)) {
    errors.push(makeError("entry_not_found", `entry node ${project.storyGraph.entryNodeId} not found`));
  }

  for (const scene of scenes) {
    const id = normalizeId(scene.id, "");
    if (!id) errors.push(makeError("missing_scene_id", "scene missing id", "script.scenes"));
    if (id && sceneIds.has(id)) duplicateSceneIds.push(id);
    if (id) sceneIds.add(id);
    if (!compactText(scene.text)) errors.push(makeError("missing_scene_text", `scene ${id || "(missing)"} missing text`));
  }
  for (const id of duplicateSceneIds) errors.push(makeError("duplicate_scene", `duplicate scene id ${id}`));

  const validRuntimeSceneIds = new Set(nodes.map(nodeRuntimeId));
  for (const edge of edges) {
    if (!edge.id) errors.push(makeError("missing_edge_id", "edge missing id", "storyGraph.edges"));
    if (!edge.fromNodeId || !nodeIds.has(edge.fromNodeId)) {
      errors.push(makeError("invalid_edge_source", `edge ${edge.id || "(missing)"} has invalid source ${edge.fromNodeId}`));
    }
    if (!edge.toNodeId || !nodeIds.has(edge.toNodeId)) {
      errors.push(makeError("invalid_edge_target", `edge ${edge.id || "(missing)"} has invalid target ${edge.toNodeId}`));
    }
    if (!compactText(edge.label)) errors.push(makeError("missing_edge_label", `edge ${edge.id || "(missing)"} missing label`));
  }

  for (const node of nodes) {
    const runtimeSceneId = nodeRuntimeId(node);
    if (!sceneIds.has(runtimeSceneId)) {
      errors.push(makeError("missing_node_scene", `node ${node.id} maps to missing scene ${runtimeSceneId}`));
    }
  }

  const reachable = reachableNodeIds(project, nodeIds);
  const unreachable = nodes.filter((node) => node.id && !reachable.has(node.id));
  for (const node of unreachable) {
    errors.push(makeError("unreachable_node", `node ${node.id} is not reachable from entry`));
  }

  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) outgoing.get(edge.fromNodeId)?.push(edge);
  const reachableNonEndingDeadEnds = nodes.filter((node) => (
    reachable.has(node.id) &&
    (node.type || "scene") !== "ending" &&
    !outgoing.get(node.id)?.length
  ));
  for (const node of reachableNonEndingDeadEnds) {
    errors.push(makeError("dead_end_node", `node ${node.id} has no outgoing choices and is not an ending`));
  }

  if (!nodes.some((node) => reachable.has(node.id) && node.type === "ending")) {
    errors.push(makeError("missing_reachable_ending", "project requires at least one reachable ending node"));
  }

  if (!validRuntimeSceneIds.size) errors.push(makeError("missing_runtime_scenes", "project has no runtime scenes"));

  return errors;
}

export function compileStoryProjectToH5Pack(project = {}, options = {}) {
  const timestamp = options.timestamp || Date.now();
  const origin = projectOrigin(project);
  const persona = projectPersona(project);
  const ipEntry = getIpEntry(origin.ipId);
  const zone = getZone(project.zoneId || ipEntry?.defaultZoneId || project.brief?.zoneId || "healing");
  const scenesById = sceneById(project);
  const nodes = graphNodes(project);
  const edges = graphEdges(project);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const cover = project.cover || {};

  const scenes = nodes.map((node, index) => {
    const id = nodeRuntimeId(node);
    const source = scenesById.get(id) || {};
    const actions = edges
      .filter((edge) => edge.fromNodeId === node.id)
      .map((edge) => {
        const targetNode = nodeById.get(edge.toNodeId);
        return {
          label: compactText(edge.label, "继续").slice(0, 16),
          goto: nodeRuntimeId(targetNode || { id: edge.toNodeId }),
          trackingKey: edge.trackingKey || edge.id || null,
        };
      });

    return {
      id,
      title: compactText(source.title || node.title || `第 ${index + 1} 幕`).slice(0, 24),
      background: source.background || cover.background || "linear-gradient(160deg, #111827 0%, #0e7490 60%, #a7f3d0 140%)",
      character: source.character || persona.avatar || cover.character || "✨",
      speaker: source.speaker || persona.name || "旁白",
      text: compactText(source.text || node.summary || node.title, "这一幕还没有正文。").slice(0, 180),
      stageDirection: source.stageDirection || node.stageDirection || "",
      dialogue: asArray(source.dialogue),
      beat: source.beat || node.beat || "",
      actions,
      ending: node.type === "ending",
    };
  });

  const entryNode = nodeById.get(project.storyGraph?.entryNodeId) || nodes[0] || {};
  const tags = unique([
    project.brief?.genre,
    project.brief?.tone,
    zone.shortName,
    ...(project.tags || []),
  ]).slice(0, 8);
  const assetPlan = asArray(project.assets).map((asset, index) => ({
    id: asset.id || `asset_${index + 1}`,
    type: asset.type || asset.kind || "background",
    name: asset.name || `素材 ${index + 1}`,
    usage: asset.usage || "story_project",
    source: asset.source || asset.sourceStatement || "project_asset",
    sourceStatement: asset.sourceStatement || asset.source || "",
    prompt: asset.prompt || asset.visualPrompt || "",
    status: asset.status || "draft_prompt",
  }));

  const pack = {
    id: options.packId || project.outputWorkId || project.id?.replace(/^story_project_/, "h5_") || `h5_${Math.random().toString(36).slice(2, 9)}`,
    schemaVersion: GUGU_H5_SCHEMA_VERSION,
    title: compactText(project.title, "未命名作品").slice(0, 24),
    author: project.author || { id: "user_local", name: "你" },
    capabilities: unique(["scene_graph", "branching", ...(project.capabilities || [])]),
    status: options.status || "public_h5",
    hardwareStatus: "h5_only",
    storeStatus: "not_applied",
    contentOrigin: origin.contentOrigin,
    ipId: origin.ipId,
    ipName: origin.contentOrigin === "fanwork" ? origin.ipName : null,
    zoneId: zone.id,
    zoneName: zone.name,
    persona: {
      id: persona.id,
      name: persona.name,
      avatar: persona.avatar,
      roleType: persona.roleType,
      tagline: persona.tagline,
      cloneOf: persona.cloneOf || null,
    },
    fanworkOf: origin.fanworkOf,
    rightsAcknowledgedAt: origin.rightsAcknowledgedAt,
    cover: {
      background: cover.background || scenes[0]?.background || "linear-gradient(160deg, #111827, #0e7490)",
      character: cover.character || persona.avatar || scenes[0]?.character || "✨",
      imageUrl: cover.imageUrl || null,
    },
    creationBrief: {
      title: project.title,
      logline: project.brief?.logline || project.summary || scenes[0]?.text || project.title,
      genre: project.brief?.genre || "互动文字游戏",
      audience: project.brief?.audience || "mobile_short_play",
      tone: project.brief?.tone || "",
    },
    world: project.world || {},
    personaUsage: project.personaUsage || {
      label: "社区分身 / 故事主角",
      description: `${persona.name} 是玩家在作品中的操作身份。`,
    },
    characters: asArray(project.characters),
    assetPlan,
    aiAssistance: {
      assisted: Boolean(asArray(project.aiProvenance).length),
      provider: project.aiProvenance?.[0]?.provider || "gugu_story_project",
      generatedFields: project.aiProvenance?.[0]?.generatedFields || [],
      prompt: project.aiProvenance?.[0]?.prompt || project.brief?.sourcePrompt || "",
      generatedAt: project.aiProvenance?.[0]?.generatedAt || timestamp,
    },
    tags,
    metrics: { plays: 0, likes: 0, saves: 0, comments: 0, remixes: 0, completionRate: 0 },
    entrySceneId: nodeRuntimeId(entryNode),
    createdAt: project.createdAt || timestamp,
    updatedAt: timestamp,
    remixOf: origin.remixOf,
    sourceProjectId: project.id || null,
    sourceProjectVersionId: project.versionId || null,
    scenes,
  };

  const validationErrors = validatePack(pack);
  if (validationErrors.length && options.throwOnInvalid) {
    throw new Error(validationErrors.join("\n"));
  }
  return pack;
}

export function createStoryProjectPlayabilityReport(project = {}, options = {}) {
  const projectErrors = validateStoryProject(project);
  const pack = compileStoryProjectToH5Pack(project, options);
  const packErrors = validatePack(pack);
  const playtest = createTextGamePlaytestReport(pack);
  const publishChecklist = createPublishChecklist(pack, options);
  const errors = [...projectErrors, ...packErrors.map((error) => `compiled_pack: ${error}`)];

  return {
    id: `story_project_report_${project.id || "draft"}`,
    status: errors.length || playtest.status === "blocked" || publishChecklist.status === "blocked"
      ? "blocked"
      : playtest.status === "warning" || publishChecklist.status === "warning" ? "warning" : "passed",
    projectId: project.id || null,
    errors,
    compiledPackId: pack.id,
    playtest,
    publishChecklist,
    generatedAt: options.generatedAt || Date.now(),
  };
}

export function createStoryProjectFromH5Pack(pack = {}, options = {}) {
  const nodes = asArray(pack.scenes).map((scene) => ({
    id: scene.id,
    type: asArray(scene.actions).length ? "scene" : "ending",
    sceneId: scene.id,
    title: scene.title || scene.id,
  }));
  const edges = asArray(pack.scenes).flatMap((scene) => asArray(scene.actions).map((action, index) => ({
    id: `${scene.id}_${index + 1}_${action.goto}`,
    fromNodeId: scene.id,
    toNodeId: action.goto,
    label: action.label,
    trackingKey: action.trackingKey || null,
  })));

  return {
    id: options.projectId || `story_project_${pack.id || Math.random().toString(36).slice(2, 9)}`,
    schemaVersion: GUGU_STORY_PROJECT_SCHEMA_VERSION,
    title: pack.title || "未命名作品",
    status: options.status || "ready_to_preview",
    author: pack.author || { id: "user_local", name: "你" },
    origin: {
      contentOrigin: pack.contentOrigin || "original",
      ipId: pack.ipId || null,
      ipName: pack.ipName || null,
      fanworkOf: pack.fanworkOf || null,
      remixOf: pack.remixOf || null,
      rightsAcknowledgedAt: pack.rightsAcknowledgedAt || null,
    },
    brief: {
      logline: pack.creationBrief?.logline || pack.scenes?.[0]?.text || pack.title || "",
      genre: pack.creationBrief?.genre || pack.tags?.[0] || "互动文字游戏",
      audience: "mobile_short_play",
      tone: pack.creationBrief?.tone || "",
    },
    world: pack.world || {},
    zoneId: pack.zoneId || null,
    persona: pack.persona || null,
    characters: asArray(pack.characters),
    cover: pack.cover || {},
    storyGraph: {
      entryNodeId: pack.entrySceneId || pack.scenes?.[0]?.id || "",
      nodes,
      edges,
    },
    script: {
      scenes: asArray(pack.scenes).map((scene) => ({
        id: scene.id,
        title: scene.title || scene.id,
        background: scene.background,
        character: scene.character,
        speaker: scene.speaker,
        text: scene.text,
        dialogue: asArray(scene.dialogue),
        stageDirection: scene.stageDirection || "",
        beat: scene.beat || "",
      })),
    },
    comicPanels: [],
    assets: asArray(pack.assetPlan),
    aiProvenance: pack.aiAssistance ? [{
      provider: pack.aiAssistance.provider || "unknown",
      generatedFields: pack.aiAssistance.generatedFields || [],
      prompt: pack.aiAssistance.prompt || "",
      generatedAt: pack.aiAssistance.generatedAt || pack.createdAt || Date.now(),
    }] : [],
    qualityReports: asArray(pack.qualityChecks),
    outputs: [{ type: "gugu_h5_pack", id: pack.id || null }],
    createdAt: pack.createdAt || Date.now(),
    updatedAt: pack.updatedAt || Date.now(),
  };
}
