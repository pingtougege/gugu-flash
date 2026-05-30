export const ASSET_SECURITY_POLICY_VERSION = "gugu_flash_asset_security_v1";

export const ASSET_ALLOWED_MEDIA_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "application/json",
];

export const ASSET_BLOCKED_MEDIA_TYPES = [
  "application/x-msdownload",
  "application/x-sh",
  "application/x-msdos-program",
  "application/vnd.microsoft.portable-executable",
  "text/html",
  "image/svg+xml",
];

export const ASSET_SECURITY_MAX_BYTES = {
  image: 5 * 1024 * 1024,
  audio: 10 * 1024 * 1024,
  json: 512 * 1024,
};

const BLOCKED_EXTENSIONS = new Set(["exe", "dll", "dmg", "pkg", "sh", "bat", "cmd", "js", "html", "svg"]);
const ALLOWED_SOURCE_TYPES = new Set(["original", "licensed", "public_domain", "ai_generated", "platform_seed"]);

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function mediaKind(mediaType = "") {
  if (mediaType.startsWith("image/")) return "image";
  if (mediaType.startsWith("audio/")) return "audio";
  if (mediaType === "application/json") return "json";
  return "unknown";
}

function extensionFromName(name = "") {
  const clean = String(name).split(/[?#]/)[0];
  const match = /\.([a-z0-9]+)$/i.exec(clean);
  return match ? match[1].toLowerCase() : "";
}

function isPrivateHost(hostname = "") {
  const host = hostname.toLowerCase();
  if (!host) return false;
  if (host === "localhost" || host.endsWith(".local") || host === "::1" || host === "[::1]") return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  const match = /^172\.(\d+)\./.exec(host);
  if (match && Number(match[1]) >= 16 && Number(match[1]) <= 31) return true;
  return false;
}

function sourceUrlErrors(sourceUrl) {
  if (!hasValue(sourceUrl)) return [];
  try {
    const url = new URL(String(sourceUrl));
    const errors = [];
    if (url.protocol !== "https:") errors.push("sourceUrl must use https");
    if (isPrivateHost(url.hostname)) errors.push("sourceUrl must not point to private or localhost hosts");
    return errors;
  } catch {
    return ["sourceUrl must be a valid URL"];
  }
}

export function validateAssetSourceStatement(statement = {}) {
  const errors = [];
  if (!statement || typeof statement !== "object") {
    return ["sourceStatement is required"];
  }
  if (!ALLOWED_SOURCE_TYPES.has(statement.sourceType)) {
    errors.push("sourceStatement.sourceType is invalid");
  }
  if (statement.sourceType === "licensed" && !hasValue(statement.licenseUrl)) {
    errors.push("sourceStatement.licenseUrl is required for licensed assets");
  }
  if (statement.sourceType === "original" && !hasValue(statement.creatorUserId || statement.creatorName)) {
    errors.push("sourceStatement creator identity is required for original assets");
  }
  if (statement.rightsAcknowledged !== true) {
    errors.push("sourceStatement.rightsAcknowledged must be true");
  }
  const note = String(statement.note || statement.description || "");
  if (/https?:\/\/|微信|vx|qq|telegram|whatsapp/i.test(note)) {
    errors.push("sourceStatement.note must not include external contact or transaction links");
  }
  return errors;
}

export function validateAssetUploadSecurity(asset = {}) {
  const errors = [];
  const mediaType = String(asset.mediaType || asset.contentType || "").toLowerCase();
  const filename = String(asset.filename || asset.name || asset.originalName || "");
  const sizeBytes = Number(asset.sizeBytes ?? asset.byteLength ?? asset.fileSizeBytes ?? 0);
  const kind = mediaKind(mediaType);
  const extension = extensionFromName(filename || asset.sourceUrl || "");

  if (!hasValue(filename)) errors.push("filename is required");
  if (!ASSET_ALLOWED_MEDIA_TYPES.includes(mediaType)) errors.push("mediaType is not allowed");
  if (ASSET_BLOCKED_MEDIA_TYPES.includes(mediaType)) errors.push("mediaType is blocked");
  if (BLOCKED_EXTENSIONS.has(extension)) errors.push("file extension is blocked");
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) errors.push("sizeBytes must be positive");
  const maxBytes = ASSET_SECURITY_MAX_BYTES[kind];
  if (maxBytes && sizeBytes > maxBytes) errors.push(`sizeBytes exceeds ${kind} limit`);
  errors.push(...sourceUrlErrors(asset.sourceUrl));
  errors.push(...validateAssetSourceStatement(asset.sourceStatement));

  return errors;
}

export function createAssetSecurityReport(asset = {}, options = {}) {
  const errors = validateAssetUploadSecurity(asset);
  const mediaType = String(asset.mediaType || asset.contentType || "").toLowerCase();
  const kind = mediaKind(mediaType);

  return {
    policyVersion: ASSET_SECURITY_POLICY_VERSION,
    status: errors.length ? "blocked" : "passed",
    mediaType,
    mediaKind: kind,
    sizeBytes: Number(asset.sizeBytes ?? asset.byteLength ?? asset.fileSizeBytes ?? 0),
    maxBytes: ASSET_SECURITY_MAX_BYTES[kind] || null,
    storageIsolation: options.storageIsolation || "private_object_store_required",
    malwareScan: options.malwareScan || "required_before_public_delivery",
    sourceStatementRequired: true,
    errors,
  };
}
