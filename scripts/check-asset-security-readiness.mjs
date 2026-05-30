import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  ASSET_ALLOWED_MEDIA_TYPES,
  ASSET_SECURITY_POLICY_VERSION,
} from "../apps/backend/src/asset-security.js";

const ASSET_URL = new URL("../docs/asset-security-readiness.json", import.meta.url);
const SECURITY_URL = new URL("../docs/security-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_EVIDENCE = [
  "docs/asset-security-readiness.md",
  "docs/asset-security-readiness.json",
  "scripts/check-asset-security-readiness.mjs",
  "apps/backend/src/asset-security.js",
  "apps/backend/src/asset-security.test.js",
  "apps/backend/src/flash-http-server.js",
  "packages/api-client/src/http-flash-api.test.js",
];

async function pathExists(path) {
  try {
    await access(resolve(path));
    return true;
  } catch {
    return false;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const asset = JSON.parse(await readFile(ASSET_URL, "utf8"));
const security = JSON.parse(await readFile(SECURITY_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (!asset.version) errors.push("asset-security-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(asset.updatedAt || "")) errors.push("asset-security-readiness: updatedAt must be YYYY-MM-DD");
if (asset.status !== "alpha_policy_ready_pending_storage_review") {
  errors.push("asset-security-readiness: status must be alpha_policy_ready_pending_storage_review");
}
if (asset.policy?.schemaVersion !== ASSET_SECURITY_POLICY_VERSION) {
  errors.push(`policy.schemaVersion must be ${ASSET_SECURITY_POLICY_VERSION}`);
}
for (const mediaType of ASSET_ALLOWED_MEDIA_TYPES) {
  if (!asArray(asset.policy?.allowedMediaTypes).includes(mediaType)) errors.push(`allowedMediaTypes missing ${mediaType}`);
}
for (const control of ["executable_media_type", "blocked_extension", "private_source_url", "oversized_file", "missing_source_statement"]) {
  if (!asArray(asset.policy?.blockedControls).includes(control)) errors.push(`blockedControls missing ${control}`);
}
for (const check of ["malware_scan", "content_type_validation", "source_statement", "storage_isolation"]) {
  if (!asArray(asset.policy?.requiredReviewChecks).includes(check)) errors.push(`requiredReviewChecks missing ${check}`);
}

const endpoints = new Map(asArray(asset.endpointControls).map((item) => [`${item.method} ${item.path}`, item]));
for (const route of [
  "POST /flash/assets",
  "PATCH /flash/assets/:id/source-statement",
  "POST /flash/assets/:id/submit-review",
]) {
  if (!endpoints.has(route)) errors.push(`endpointControls missing ${route}`);
}

for (const control of asArray(asset.codeControls)) {
  if (!control.id) errors.push("codeControls: missing id");
  if (!control.file) errors.push(`${control.id}: missing file`);
  if (!(await pathExists(control.file))) {
    errors.push(`${control.id}: file does not exist: ${control.file}`);
    continue;
  }
  const content = await readFile(resolve(control.file), "utf8");
  for (const marker of asArray(control.requiredMarkers)) {
    if (!content.includes(marker)) errors.push(`${control.id}: missing marker ${marker}`);
  }
}

for (const evidence of REQUIRED_EVIDENCE) {
  if (!(await pathExists(evidence))) errors.push(`asset security evidence path does not exist: ${evidence}`);
}

const doc = await readFile(resolve("docs/asset-security-readiness.md"), "utf8");
for (const heading of ["## Scope", "## Upload Policy", "## Source Statement", "## Backend Enforcement", "## External Boundary"]) {
  if (!doc.includes(heading)) errors.push(`asset-security-readiness.md missing heading ${heading}`);
}
for (const marker of [ASSET_SECURITY_POLICY_VERSION, "asset_security_violation", "malware scanning"]) {
  if (!doc.includes(marker)) errors.push(`asset-security-readiness.md missing ${marker}`);
}

for (const item of asArray(asset.externalAcceptance)) {
  if (!item.id) errors.push("externalAcceptance: missing id");
  if (item.status !== "pending_external") errors.push(`${item.id}: must remain pending_external`);
  if (!item.needed) errors.push(`${item.id}: missing needed`);
}

const securityControls = new Map(asArray(security.codeControls).map((item) => [item.id, item]));
for (const controlId of ["asset_upload_security_policy", "asset_upload_http_enforcement"]) {
  if (!securityControls.has(controlId)) errors.push(`security-readiness.codeControls missing ${controlId}`);
}

const uploadReview = asArray(security.externalAcceptance).find((item) => item.id === "upload_storage_review");
if (!uploadReview) {
  errors.push("security-readiness.externalAcceptance missing upload_storage_review");
} else if (!String(uploadReview.needed || "").includes("Alpha upload policy")) {
  errors.push("upload_storage_review needed must mention Alpha upload policy");
}

const securityReadinessItem = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "security_review");
if (!securityReadinessItem) {
  errors.push("release-readiness.public_mvp missing security_review");
} else {
  for (const evidence of REQUIRED_EVIDENCE) {
    if (!asArray(securityReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.security_review: evidence must include ${evidence}`);
    }
  }
  if (securityReadinessItem.status === "ready") errors.push("security_review cannot be ready before external signoff");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const pending = asArray(asset.externalAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`Asset security readiness gate ${asset.version}: mediaTypes=${ASSET_ALLOWED_MEDIA_TYPES.length}, controls=${asArray(asset.codeControls).length}, pendingExternal=${pending}`);
