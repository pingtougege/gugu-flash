import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createStoryProjectFromH5Pack,
  createDraftFromPrompt,
  createDraftQualityChecks,
  validatePack,
} from "../../../packages/core/src/index.js";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(moduleDir, "../../..");

let envLoaded = false;

function loadEnvFile(path) {
  if (!path || !existsSync(path)) return false;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key || process.env[key]) continue;
    process.env[key] = rest.join("=").replace(/^['"]|['"]$/g, "");
  }
  return true;
}

function ensureAiEnvLoaded() {
  if (envLoaded) return;
  envLoaded = true;
  loadEnvFile(process.env.GUGU_FLASH_AI_ENV_FILE);
  loadEnvFile(join(repoRoot, "apps/backend/.env"));
}

function providerOrder() {
  ensureAiEnvLoaded();
  const preferred = String(process.env.GUGU_FLASH_AI_PROVIDER || process.env.STORY_IMPORT_LLM_PROVIDER || "").toLowerCase();
  if (preferred === "openai") return ["openai", "deepseek"];
  if (preferred === "deepseek") return ["deepseek", "openai"];
  return process.env.DEEPSEEK_API_KEY ? ["deepseek", "openai"] : ["openai", "deepseek"];
}

function hasAiKey() {
  ensureAiEnvLoaded();
  if (process.env.GUGU_FLASH_AI_DISABLED === "1") return false;
  return Boolean(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY);
}

function draftResponseSchema() {
  const scene = {
    type: "object",
    additionalProperties: false,
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      speaker: { type: "string" },
      character: { type: "string" },
      text: { type: "string" },
      backgroundHint: { type: "string" },
      actions: {
        type: "array",
        minItems: 0,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            label: { type: "string" },
            goto: { type: "string" },
          },
          required: ["label", "goto"],
        },
      },
    },
    required: ["id", "title", "speaker", "character", "text", "actions"],
  };

  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      logline: { type: "string" },
      setting: { type: "string" },
      conflict: { type: "string" },
      stakes: { type: "string" },
      twist: { type: "string" },
      characters: {
        type: "array",
        minItems: 2,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            role: { type: "string" },
            motivation: { type: "string" },
            voice: { type: "string" },
            avatar: { type: "string" },
            visualPrompt: { type: "string" },
          },
          required: ["id", "name", "role", "motivation", "voice", "visualPrompt"],
        },
      },
      scenes: {
        type: "array",
        minItems: 5,
        maxItems: 10,
        items: scene,
      },
      assetPlan: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            type: { type: "string" },
            name: { type: "string" },
            usage: { type: "string" },
            prompt: { type: "string" },
            source: { type: "string" },
          },
          required: ["type", "name", "usage", "prompt", "source"],
        },
      },
      tags: {
        type: "array",
        minItems: 3,
        maxItems: 8,
        items: { type: "string" },
      },
    },
    required: ["title", "logline", "setting", "conflict", "stakes", "twist", "characters", "scenes", "assetPlan", "tags"],
  };
}

function aiInstructions() {
  return `
你是 Gugu Flash 的文字游戏主创。把用户的一段中文描述改写成可玩的短篇互动文字游戏。
只返回 JSON，不要 Markdown。
必须遵守：
- 不要套空泛模板；每一幕都要使用用户描述中的具体地点、事件、角色或 IP。
- 当前分身是社区身份，也是故事主角；用户通过选择操作当前分身。
- 生成 5-10 个场景，必须有入口、分岔和至少两个结局。
- 场景 id 使用稳定英文 snake_case，例如 start、investigate、approach、decision、resolve_end、open_end。
- 每个选项 goto 必须指向已有场景 id。
- 单场 text 控制在 35-100 个中文字符，适合手机阅读。
- 二创作品只做同人归属和剧情草稿，不声称官方授权。
- 素材计划只给 prompt 和来源，不生成外链。
`.trim();
}

function buildAiInput({ prompt, template, options, skeleton }) {
  return {
    prompt,
    template,
    originType: options.originType || "original",
    ipName: options.ipName || skeleton.ipName || "",
    persona: skeleton.persona,
    personaUsage: skeleton.personaUsage,
    targetSchema: draftResponseSchema(),
  };
}

function parseJsonText(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function extractOpenAiText(data = {}) {
  if (data.output_text) return data.output_text;
  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) chunks.push(content.text);
    }
  }
  return chunks.join("\n");
}

async function requestDeepSeek(input) {
  if (!process.env.DEEPSEEK_API_KEY) return { ok: false, reason: "missing_api_key", provider: "deepseek" };
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";
  const response = await fetch(process.env.DEEPSEEK_API_URL || DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: aiInstructions() },
        { role: "user", content: JSON.stringify(input) },
      ],
      response_format: { type: "json_object" },
      temperature: Number(process.env.GUGU_FLASH_AI_TEMPERATURE || 0.35),
    }),
  });
  const data = await response.json();
  if (!response.ok) return { ok: false, provider: "deepseek", model, reason: "http_error", detail: data?.error?.message || response.statusText };
  return {
    ok: true,
    provider: "deepseek",
    model,
    draft: parseJsonText(data?.choices?.[0]?.message?.content || ""),
  };
}

async function requestOpenAi(input) {
  if (!process.env.OPENAI_API_KEY) return { ok: false, reason: "missing_api_key", provider: "openai" };
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await fetch(process.env.OPENAI_API_URL || OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      instructions: aiInstructions(),
      input: JSON.stringify(input),
      text: {
        format: {
          type: "json_schema",
          name: "gugu_flash_text_game_draft",
          strict: true,
          schema: draftResponseSchema(),
        },
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) return { ok: false, provider: "openai", model, reason: "http_error", detail: data?.error?.message || response.statusText };
  return {
    ok: true,
    provider: "openai",
    model,
    draft: parseJsonText(extractOpenAiText(data)),
  };
}

function sceneBackground(index, skeleton) {
  const palette = [
    skeleton.cover?.background || "linear-gradient(160deg, #111827, #0e7490)",
    "linear-gradient(160deg, #11324d 0%, #1f7a8c 58%, #bfdbf7 135%)",
    "linear-gradient(160deg, #12372a 0%, #436850 58%, #fbfada 135%)",
    "linear-gradient(160deg, #2f184b 0%, #6247aa 62%, #ffcad4 145%)",
    "linear-gradient(160deg, #020617 0%, #155e75 70%, #a7f3d0 150%)",
    "linear-gradient(160deg, #111827 0%, #be123c 70%, #fde68a 150%)",
  ];
  return palette[index % palette.length];
}

function sanitizeSceneId(value, fallback) {
  const cleaned = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  return cleaned || fallback;
}

function mergeAiDraft(skeleton, aiDraft, meta) {
  const rawScenes = Array.isArray(aiDraft.scenes) ? aiDraft.scenes : [];
  const sceneIds = new Set();
  const scenes = rawScenes.slice(0, 10).map((scene, index) => {
    let id = sanitizeSceneId(scene.id, index === 0 ? "start" : `scene_${index + 1}`);
    while (sceneIds.has(id)) id = `${id}_${index + 1}`;
    sceneIds.add(id);
    return {
      id,
      title: String(scene.title || `第 ${index + 1} 幕`).slice(0, 24),
      background: sceneBackground(index, skeleton),
      character: String(scene.character || skeleton.persona?.avatar || "✨").slice(0, 4),
      speaker: String(scene.speaker || skeleton.persona?.name || "旁白").slice(0, 20),
      text: String(scene.text || "").slice(0, 160),
      actions: Array.isArray(scene.actions) ? scene.actions.slice(0, 3).map((action) => ({
        label: String(action.label || "继续").slice(0, 12),
        goto: sanitizeSceneId(action.goto, "start"),
      })) : [],
    };
  });
  const validSceneIds = new Set(scenes.map((scene) => scene.id));
  for (const scene of scenes) {
    scene.actions = (scene.actions || []).filter((action) => validSceneIds.has(action.goto));
  }
  if (scenes.length && !scenes.some((scene) => scene.id === "start")) scenes[0].id = "start";

  const merged = {
    ...skeleton,
    title: String(aiDraft.title || skeleton.title).slice(0, 18),
    creationBrief: {
      ...skeleton.creationBrief,
      title: String(aiDraft.title || skeleton.title).slice(0, 18),
      logline: aiDraft.logline || skeleton.creationBrief?.logline,
    },
    world: {
      ...skeleton.world,
      setting: aiDraft.setting || skeleton.world?.setting,
      conflict: aiDraft.conflict || skeleton.world?.conflict,
      stakes: aiDraft.stakes || skeleton.world?.stakes,
      twist: aiDraft.twist || skeleton.world?.twist,
    },
    characters: Array.isArray(aiDraft.characters) && aiDraft.characters.length ? aiDraft.characters.map((character, index) => ({
      id: sanitizeSceneId(character.id, index === 0 ? skeleton.persona?.id || "persona" : `character_${index + 1}`),
      name: String(character.name || (index === 0 ? skeleton.persona?.name : "角色")).slice(0, 20),
      role: String(character.role || (index === 0 ? "社区分身 / 主角" : "配角")).slice(0, 20),
      motivation: String(character.motivation || "").slice(0, 120),
      voice: String(character.voice || "").slice(0, 80),
      avatar: String(character.avatar || (index === 0 ? skeleton.persona?.avatar : "角")).slice(0, 4),
      visualPrompt: String(character.visualPrompt || "").slice(0, 160),
    })) : skeleton.characters,
    assetPlan: Array.isArray(aiDraft.assetPlan) && aiDraft.assetPlan.length ? aiDraft.assetPlan.map((asset, index) => ({
      id: `ai_asset_${index + 1}`,
      type: String(asset.type || "background"),
      name: String(asset.name || "素材").slice(0, 24),
      usage: String(asset.usage || "").slice(0, 80),
      source: String(asset.source || "ai_prompt"),
      prompt: String(asset.prompt || "").slice(0, 220),
      status: "draft_prompt",
    })) : skeleton.assetPlan,
    tags: Array.from(new Set([...(aiDraft.tags || []), ...(skeleton.tags || [])])).slice(0, 8),
    scenes: scenes.length >= 3 ? scenes : skeleton.scenes,
    aiProvider: {
      status: "used",
      provider: meta.provider,
      model: meta.model,
      generatedAt: Date.now(),
    },
  };
  merged.qualityChecks = createDraftQualityChecks(merged);
  return merged;
}

function fallbackDraft(prompt, template, options, reason = "missing_api_key") {
  const item = createDraftFromPrompt(prompt, template, options);
  if (item.contentOrigin === "fanwork" && options.rightsAcknowledgedAt) {
    item.rightsAcknowledgedAt = options.rightsAcknowledgedAt;
  }
  item.aiProvider = {
    status: "fallback",
    provider: "local_rules",
    reason,
    generatedAt: Date.now(),
  };
  item.qualityChecks = createDraftQualityChecks(item);
  const storyProject = createStoryProjectFromH5Pack(item, {
    projectId: `story_project_${String(item.id || "").replace(/^h5_/, "")}`,
    status: "ready_to_preview",
  });
  item.sourceProjectId = storyProject.id;
  item.storyProjectId = storyProject.id;
  return { item, storyProject, meta: item.aiProvider };
}

export async function createAiDraftFromPrompt(prompt, template = "healing", options = {}) {
  ensureAiEnvLoaded();
  if (!hasAiKey()) return fallbackDraft(prompt, template, options, "missing_api_key");

  const skeleton = createDraftFromPrompt(prompt, template, options);
  const input = buildAiInput({ prompt, template, options, skeleton });
  const attempts = [];

  for (const provider of providerOrder()) {
    try {
      const result = provider === "deepseek" ? await requestDeepSeek(input) : await requestOpenAi(input);
      attempts.push({ provider, ok: result.ok, reason: result.reason || null });
      if (!result.ok) continue;
      const item = mergeAiDraft(skeleton, result.draft, result);
      if (item.contentOrigin === "fanwork" && options.rightsAcknowledgedAt) {
        item.rightsAcknowledgedAt = options.rightsAcknowledgedAt;
      }
      const errors = validatePack(item);
      if (errors.length) {
        attempts.push({ provider, ok: false, reason: "invalid_pack", errors });
        continue;
      }
      const storyProject = createStoryProjectFromH5Pack(item, {
        projectId: `story_project_${String(item.id || "").replace(/^h5_/, "")}`,
        status: "ready_to_preview",
      });
      item.sourceProjectId = storyProject.id;
      item.storyProjectId = storyProject.id;
      return { item, storyProject, meta: item.aiProvider, attempts };
    } catch (error) {
      attempts.push({ provider, ok: false, reason: "exception", detail: String(error.message || error).slice(0, 240) });
    }
  }

  const fallback = fallbackDraft(prompt, template, options, "provider_failed");
  fallback.attempts = attempts;
  fallback.item.aiProvider.attempts = attempts;
  return fallback;
}
