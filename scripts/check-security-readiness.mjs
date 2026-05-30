import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SECURITY_URL = new URL("../docs/security-readiness.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

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

const security = JSON.parse(await readFile(SECURITY_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!security.version) errors.push("security-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(security.updatedAt || "")) {
  errors.push("security-readiness: updatedAt must be YYYY-MM-DD");
}
if (security.status !== "draft_pending_external_security_review") {
  errors.push("security-readiness: status must remain draft_pending_external_security_review until signoff is recorded");
}

for (const document of asArray(security.documents)) {
  if (!document.id) errors.push("security-readiness document missing id");
  if (!document.file) errors.push(`${document.id}: missing file`);
  if (!(await pathExists(document.file))) {
    errors.push(`${document.id}: file does not exist: ${document.file}`);
    continue;
  }
  const content = await readFile(resolve(document.file), "utf8");
  for (const heading of asArray(document.requiredHeadings)) {
    if (!content.includes(heading)) errors.push(`${document.id}: missing heading ${heading}`);
  }
  for (const clause of asArray(document.requiredClauses)) {
    if (!content.toLowerCase().includes(String(clause).toLowerCase())) {
      errors.push(`${document.id}: missing clause marker ${clause}`);
    }
  }
}

for (const control of asArray(security.codeControls)) {
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

for (const artifact of asArray(security.dataArtifacts)) {
  if (!artifact.id) errors.push("dataArtifacts: missing id");
  if (!artifact.file) errors.push(`${artifact.id}: missing file`);
  if (!(await pathExists(artifact.file))) {
    errors.push(`${artifact.id}: file does not exist: ${artifact.file}`);
    continue;
  }
  const parsed = JSON.parse(await readFile(resolve(artifact.file), "utf8"));
  for (const field of asArray(artifact.requiredFields)) {
    if (parsed[field] === undefined) errors.push(`${artifact.id}: missing field ${field}`);
  }
}

for (const item of asArray(security.externalAcceptance)) {
  if (!item.id) errors.push("externalAcceptance: missing id");
  if (item.status !== "pending_external") errors.push(`${item.id}: must remain pending_external until real review is complete`);
  if (!item.needed) errors.push(`${item.id}: missing needed`);
}

const securityReadinessItem = asArray(readiness.gates?.public_mvp?.items).find((item) => item.id === "security_review");
if (!securityReadinessItem) {
  errors.push("release-readiness.public_mvp: missing security_review item");
} else {
  for (const evidence of [
    "docs/security-review-plan.md",
    "docs/security-readiness.json",
    "data/security-review-packet.json",
    "docs/asset-security-readiness.md",
    "docs/asset-security-readiness.json",
    "docs/auth-rbac-readiness.json",
    "docs/identity-provider-readiness.json",
    "scripts/check-security-readiness.mjs",
    "scripts/check-security-review-packet.mjs",
    "scripts/check-asset-security-readiness.mjs",
    "scripts/check-auth-rbac-readiness.mjs",
    "scripts/check-identity-provider-readiness.mjs",
    "apps/backend/src/flash-http-server.js",
    "apps/backend/src/asset-security.js",
    "apps/backend/src/asset-security.test.js",
    "apps/backend/src/flash-auth-policy.js",
    "apps/backend/src/flash-identity-token.js",
    "packages/api-client/src/http-flash-api.test.js",
  ]) {
    if (!asArray(securityReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.security_review: evidence must include ${evidence}`);
    }
  }
  if (securityReadinessItem.status === "ready") {
    errors.push("release-readiness.security_review: cannot be ready until external signoff is recorded");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const controls = asArray(security.codeControls).length;
const pending = asArray(security.externalAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`Security readiness gate ${security.version}: controls=${controls}, artifacts=${asArray(security.dataArtifacts).length}, pending_external=${pending}`);
