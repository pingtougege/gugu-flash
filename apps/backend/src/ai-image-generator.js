import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SEEDREAM_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const moduleDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(moduleDir, "../../..");
const generatedImageDir = join(repoRoot, ".gugu-flash-api/generated-images");
const generatedImages = new Map();

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

function fallbackImage(prompt, reason = "missing_api_key") {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#0ea5e9"/><stop offset="0.58" stop-color="#8b5cf6"/><stop offset="1" stop-color="#fb7185"/></linearGradient></defs><rect width="1024" height="1024" rx="96" fill="url(#g)"/><circle cx="780" cy="220" r="130" fill="rgba(255,255,255,.22)"/><circle cx="220" cy="780" r="180" fill="rgba(255,255,255,.16)"/><text x="96" y="476" fill="white" font-family="Arial, sans-serif" font-size="62" font-weight="800">素材预览</text><text x="96" y="560" fill="rgba(255,255,255,.86)" font-family="Arial, sans-serif" font-size="34">${String(prompt || "AI image").slice(0, 24)}</text></svg>`;
  return {
    item: {
      id: `ai_image_${Date.now()}`,
      status: "fallback",
      provider: "local_preview",
      reason,
      prompt,
      imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      generatedAt: Date.now(),
    },
  };
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
  if (process.env.GUGU_FLASH_IMAGE_AI_DISABLED === "1") return fallbackImage(asset.prompt || asset.usage || "", "disabled");
  if (!process.env.SEEDREAM_API_KEY) return fallbackImage(asset.prompt || asset.usage || "", "missing_api_key");

  const prompt = String(asset.prompt || asset.usage || asset.name || "").trim();
  if (!prompt) return fallbackImage("", "empty_prompt");

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
    return fallbackImage(prompt, data?.error?.message || response.statusText || "provider_failed");
  }
  const image = extractImage(data, outputFormat);
  const id = `ai_image_${Date.now()}`;
  const imageUrl = image.imageUrl || storeGeneratedImage(id, image.b64Json, outputFormat);
  if (!imageUrl) return fallbackImage(prompt, "empty_provider_image");

  return {
    item: {
      id,
      status: "used",
      provider: "seedream",
      model,
      prompt,
      imageUrl,
      revisedPrompt: image.revisedPrompt,
      sourceStatement: {
        sourceType: "ai_generated",
        provider: "seedream",
        model,
        prompt,
        generatedAt: Date.now(),
      },
      generatedAt: Date.now(),
    },
  };
}
