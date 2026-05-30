import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SEEDREAM_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(moduleDir, "../../..");
const generatedImageDir = join(repoRoot, ".gugu-flash-api/generated-images");
const generatedImages = new Map();
const ASSET_SECURITY_POLICY_VERSION = "gugu_flash_asset_security_v1";
const FALLBACK_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

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

function ensureImageEnvLoaded() {
  if (envLoaded) return;
  envLoaded = true;
  loadEnvFile(process.env.GUGU_FLASH_AI_ENV_FILE);
  loadEnvFile(join(repoRoot, "apps/backend/.env"));
}

function seedreamSize() {
  const width = Number(process.env.SEEDREAM_WIDTH || 1024);
  const height = Number(process.env.SEEDREAM_HEIGHT || 1024);
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) return `${width}x${height}`;
  return undefined;
}

function mimeForFormat(outputFormat = "jpeg") {
  const mime = outputFormat === "png" ? "image/png" : outputFormat === "webp" ? "image/webp" : "image/jpeg";
  return mime;
}

function extensionForFormat(outputFormat = "jpeg") {
  if (outputFormat === "png") return "png";
  if (outputFormat === "webp") return "webp";
  return "jpg";
}

function storeGeneratedImage(id, b64Json, outputFormat = "jpeg") {
  if (!b64Json) return "";
  const image = {
    body: Buffer.from(b64Json, "base64"),
    contentType: mimeForFormat(outputFormat),
    createdAt: Date.now(),
  };
  const ext = extensionForFormat(outputFormat);
  mkdirSync(generatedImageDir, { recursive: true });
  writeFileSync(join(generatedImageDir, `${id}.${ext}`), image.body);
  writeFileSync(join(generatedImageDir, `${id}.json`), JSON.stringify({
    id,
    ext,
    contentType: image.contentType,
    createdAt: image.createdAt,
  }));
  generatedImages.set(id, image);
  return `/flash/ai/generated-images/${id}`;
}

function makeAssetId(asset = {}, fallbackPrefix = "asset_ai_image") {
  const candidate = String(asset.assetId || asset.id || "");
  if (candidate.startsWith("asset_")) return candidate;
  return `${fallbackPrefix}_${Date.now()}`;
}

function generatedImageAsset(asset = {}, {
  id = makeAssetId(asset),
  status = "used",
  provider = "seedream",
  model = "",
  prompt = "",
  imageUrl = "",
  mediaType = "image/png",
  filename = "",
  sizeBytes = 68,
  reason = "",
  revisedPrompt = "",
} = {}) {
  const now = Date.now();
  return {
    item: {
      id,
      assetId: id,
      targetType: "Asset",
      kind: "image",
      usage: asset.usage || "comic_panel_visual",
      status,
      provider,
      model,
      prompt,
      reason: reason || undefined,
      storyProjectId: asset.storyProjectId || asset.projectId || null,
      storyProjectVersionId: asset.storyProjectVersionId || asset.projectVersionId || null,
      panelId: asset.panelId || null,
      sceneId: asset.sceneId || null,
      renderJobId: asset.renderJobId || asset.jobId || null,
      filename: filename || `${id}.png`,
      mediaType,
      sizeBytes,
      imageUrl,
      revisedPrompt,
      securityPolicyVersion: ASSET_SECURITY_POLICY_VERSION,
      sourceStatement: {
        sourceType: "ai_generated",
        provider,
        model: model || provider,
        prompt,
        rightsAcknowledged: true,
        policyVersion: ASSET_SECURITY_POLICY_VERSION,
        generatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
      generatedAt: now,
    },
  };
}

function fallbackImage(assetOrPrompt = {}, reason = "missing_api_key") {
  const asset = typeof assetOrPrompt === "object" ? assetOrPrompt : { prompt: assetOrPrompt };
  const prompt = String(asset.prompt || asset.usage || asset.name || "").trim();
  const id = makeAssetId(asset, "asset_ai_fallback");
  return generatedImageAsset(asset, {
    id,
    status: "fallback",
    provider: "local_preview",
    model: "local_preview",
    prompt,
    reason,
    imageUrl: `data:image/png;base64,${FALLBACK_PNG_BASE64}`,
    mediaType: "image/png",
    filename: asset.filename || `${id}.png`,
    sizeBytes: 68,
  });
}

function extractImage(data = {}, outputFormat = "jpeg") {
  const first = Array.isArray(data.data) ? data.data[0] : null;
  const b64Json = first?.b64_json || first?.b64Json || "";
  const url = first?.url || "";
  return {
    imageUrl: url,
    b64Json,
    revisedPrompt: first?.revised_prompt || first?.revisedPrompt || "",
  };
}

export function getGeneratedAiImage(id = "") {
  const memoryImage = generatedImages.get(id);
  if (memoryImage) return memoryImage;
  const metadataPath = join(generatedImageDir, `${id}.json`);
  if (!existsSync(metadataPath)) return null;
  const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
  const imagePath = join(generatedImageDir, `${id}.${metadata.ext}`);
  if (!existsSync(imagePath)) return null;
  const image = {
    body: readFileSync(imagePath),
    contentType: metadata.contentType,
    createdAt: metadata.createdAt,
  };
  generatedImages.set(id, image);
  return image;
}

export async function generateAiImage(asset = {}) {
  ensureImageEnvLoaded();
  if (process.env.GUGU_FLASH_IMAGE_AI_DISABLED === "1") return fallbackImage(asset, "disabled");
  if (!process.env.SEEDREAM_API_KEY) return fallbackImage(asset, "missing_api_key");

  const prompt = String(asset.prompt || asset.usage || asset.name || "").trim();
  if (!prompt) return fallbackImage(asset, "empty_prompt");

  const model = process.env.SEEDREAM_MODEL || "doubao-seedream-5-0-260128";
  const outputFormat = process.env.SEEDREAM_OUTPUT_FORMAT || "jpeg";
  const body = {
    model,
    prompt,
    response_format: "b64_json",
    size: seedreamSize(),
    quality: process.env.SEEDREAM_QUALITY || undefined,
    watermark: process.env.SEEDREAM_WATERMARK === "true",
    aspect_ratio: process.env.SEEDREAM_ASPECT_RATIO || undefined,
    sequential_image_generation: process.env.SEEDREAM_SEQUENTIAL_IMAGE_GENERATION || undefined,
    max_images: Number(process.env.SEEDREAM_MAX_IMAGES || 1),
    output_format: outputFormat,
  };
  for (const key of Object.keys(body)) {
    if (body[key] === undefined || body[key] === "") delete body[key];
  }

  const response = await fetch(process.env.SEEDREAM_API_URL || SEEDREAM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SEEDREAM_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    return fallbackImage({ ...asset, prompt }, data?.error?.message || response.statusText || "provider_failed");
  }
  const image = extractImage(data, outputFormat);
  const id = makeAssetId(asset);
  const imageUrl = image.imageUrl || storeGeneratedImage(id, image.b64Json, outputFormat);
  if (!imageUrl) return fallbackImage({ ...asset, prompt }, "empty_provider_image");
  const mediaType = mimeForFormat(outputFormat);
  const sizeBytes = image.b64Json
    ? Buffer.byteLength(image.b64Json, "base64")
    : Number(asset.sizeBytes || 1);

  return generatedImageAsset(asset, {
    id,
    status: "used",
    provider: "seedream",
    model,
    prompt,
    imageUrl,
    revisedPrompt: image.revisedPrompt,
    mediaType,
    filename: asset.filename || `${id}.${extensionForFormat(outputFormat)}`,
    sizeBytes,
  });
}
