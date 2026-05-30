import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PACKET_URL = new URL("../data/security-review-packet.json", import.meta.url);
const SECURITY_URL = new URL("../docs/security-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_SCOPE = [
  "identity_and_session",
  "operator_rbac_and_audit",
  "payment_and_refund_callbacks",
  "asset_upload_and_storage",
  "production_infrastructure",
  "privacy_logs_and_support",
];
const REQUIRED_EXTERNAL = [
  "production_identity_review",
  "payment_provider_review",
  "upload_storage_review",
  "infrastructure_review",
  "external_security_signoff",
];
const REQUIRED_COMMANDS = [
  "npm run check:security",
  "npm run check:security-review-packet",
  "npm run check:asset-security",
  "npm run check:auth-rbac",
  "npm run check:identity-provider",
  "npm run check:payment-provider-packet",
  "npm run check:production-preflight",
  "npm run check:production-monitoring",
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

const packet = JSON.parse(await readFile(PACKET_URL, "utf8"));
const security = JSON.parse(await readFile(SECURITY_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_security_review_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_security_review_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_external_security_signoff") {
  errors.push("packet.status must remain draft_pending_external_security_signoff until real signoff is recorded");
}
if (packet.reviewMode !== "public_mvp_security_review") errors.push("packet.reviewMode must be public_mvp_security_review");

const scopeRows = new Map(asArray(packet.scope).map((item) => [item.id, item]));
for (const scopeId of REQUIRED_SCOPE) {
  const row = scopeRows.get(scopeId);
  if (!row) {
    errors.push(`scope missing ${scopeId}`);
    continue;
  }
  if (!row.owner) errors.push(`scope.${scopeId}: missing owner`);
  if (!asArray(row.requiredControls).length) errors.push(`scope.${scopeId}: missing requiredControls`);
  if (!asArray(row.evidence).length) errors.push(`scope.${scopeId}: missing evidence`);
  for (const evidence of asArray(row.evidence)) {
    if (!(await pathExists(evidence))) errors.push(`scope.${scopeId}: evidence path does not exist: ${evidence}`);
  }
}

for (const [scopeId, control] of [
  ["identity_and_session", "demo_auth_disabled_for_release"],
  ["operator_rbac_and_audit", "route_level_permissions"],
  ["payment_and_refund_callbacks", "secret_rotation_drill"],
  ["asset_upload_and_storage", "storage_isolation_review"],
  ["production_infrastructure", "secret_manager_required"],
  ["privacy_logs_and_support", "privacy_owner_approval"],
]) {
  if (!asArray(scopeRows.get(scopeId)?.requiredControls).includes(control)) {
    errors.push(`scope.${scopeId}: requiredControls missing ${control}`);
  }
}

const externalRows = new Map(asArray(packet.externalReviewChecklist).map((item) => [item.id, item]));
const securityExternal = new Set(asArray(security.externalAcceptance).map((item) => item.id));
for (const reviewId of REQUIRED_EXTERNAL) {
  const row = externalRows.get(reviewId);
  if (!row) {
    errors.push(`externalReviewChecklist missing ${reviewId}`);
    continue;
  }
  if (row.status !== "pending_external") errors.push(`externalReviewChecklist.${reviewId} must remain pending_external`);
  if (!row.owner) errors.push(`externalReviewChecklist.${reviewId}: missing owner`);
  if (!asArray(row.exitCriteria).length) errors.push(`externalReviewChecklist.${reviewId}: missing exitCriteria`);
  if (!securityExternal.has(reviewId)) errors.push(`externalReviewChecklist.${reviewId} missing from security-readiness externalAcceptance`);
}

for (const risk of asArray(packet.riskRegister)) {
  if (!risk.id) errors.push("riskRegister: missing id");
  if (!["critical", "high", "medium", "low"].includes(risk.severity)) errors.push(`${risk.id}: invalid severity`);
  if (!String(risk.status || "").startsWith("open_")) errors.push(`${risk.id}: risk must remain open until real review closes it`);
  if (!risk.mitigation) errors.push(`${risk.id}: missing mitigation`);
}
if (!asArray(packet.riskRegister).some((risk) => risk.severity === "high")) {
  errors.push("riskRegister must include at least one high severity risk");
}

for (const command of REQUIRED_COMMANDS) {
  if (!asArray(packet.releasePolicy?.publicMvpRequires).includes(command)) {
    errors.push(`releasePolicy.publicMvpRequires missing ${command}`);
  }
}
for (const reviewId of REQUIRED_EXTERNAL) {
  if (!asArray(packet.releasePolicy?.mustRemainInProgressUntil).includes(reviewId)) {
    errors.push(`releasePolicy.mustRemainInProgressUntil missing ${reviewId}`);
  }
}

const artifacts = new Map(asArray(security.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("security_review_packet")) {
  errors.push("security-readiness.dataArtifacts missing security_review_packet");
}
const controls = new Map(asArray(security.codeControls).map((item) => [item.id, item]));
if (!controls.has("security_review_packet_gate")) {
  errors.push("security-readiness.codeControls missing security_review_packet_gate");
}
if (!asArray(security.releaseCommands).includes("npm run check:security-review-packet")) {
  errors.push("security-readiness.releaseCommands missing npm run check:security-review-packet");
}

const securityItem = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "security_review");
if (!securityItem) {
  errors.push("release-readiness.public_mvp missing security_review");
} else {
  for (const evidence of ["data/security-review-packet.json", "scripts/check-security-review-packet.mjs"]) {
    if (!asArray(securityItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.security_review evidence missing ${evidence}`);
    }
  }
  if (securityItem.status !== "in_progress") errors.push("security_review must remain in_progress until external signoff is complete");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Security review packet gate ${packet.schemaVersion}: scope=${scopeRows.size}, reviews=${externalRows.size}, risks=${asArray(packet.riskRegister).length}`);
