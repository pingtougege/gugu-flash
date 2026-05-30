import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PACKET_URL = new URL("../data/security-infrastructure-review-packet.json", import.meta.url);
const SECURITY_REVIEW_URL = new URL("../data/security-review-packet.json", import.meta.url);
const SECURITY_READINESS_URL = new URL("../docs/security-readiness.json", import.meta.url);
const ASSET_READINESS_URL = new URL("../docs/asset-security-readiness.json", import.meta.url);
const RELEASE_READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_INFRA_CONTROLS = [
  "tls_and_hosting_review",
  "secret_manager_required",
  "production_alert_delivery",
  "database_backup_restore_drill",
  "rollback_drill",
];

const REQUIRED_UPLOAD_CONTROLS = [
  "malware_scan_before_delivery",
  "storage_isolation_review",
  "signed_delivery_url_policy",
  "retention_and_deletion_workflow",
  "quarantine_before_review",
];

const REQUIRED_SCANNER_SCENARIOS = [
  "safe_image_allowed",
  "executable_blocked",
  "private_source_blocked",
  "oversized_blocked",
  "malware_positive_quarantined",
  "public_delivery_requires_scan_and_signed_url",
];

const REQUIRED_PRIVACY_LOG_CONTROLS = [
  "no_raw_auth_tokens",
  "no_payment_secrets",
  "hash_device_serial_in_support_exports",
  "support_diagnostic_minimum_fields",
  "request_id_correlation",
];

const REQUIRED_EXTERNAL_BLOCKERS = [
  "production_identity_review",
  "payment_provider_review",
  "upload_storage_review",
  "infrastructure_review",
  "external_security_signoff",
];

const REQUIRED_COMMANDS = [
  "npm run check:security",
  "npm run check:security-review-packet",
  "npm run check:security-infrastructure",
  "npm run check:asset-security",
  "npm run check:production-preflight",
  "npm run check:production-monitoring",
  "npm run check:production-database-drill",
];

const REQUIRED_SOURCE_PACKETS = [
  "data/security-review-packet.json",
  "data/production-environment-preflight.json",
  "data/production-monitoring-alerting-packet.json",
  "data/production-database-drill-packet.json",
  "data/production-rollout-packet.json",
  "docs/asset-security-readiness.json",
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

async function pathExists(path) {
  try {
    await access(resolve(path));
    return true;
  } catch {
    return false;
  }
}

function getScope(packet, id) {
  return asArray(packet.scope).find((item) => item.id === id);
}

function ids(items) {
  return new Set(asArray(items).map((item) => item.id));
}

function requireIds({ errors, label, items, requiredIds }) {
  const present = ids(items);
  for (const id of requiredIds) {
    if (!present.has(id)) errors.push(`${label}: missing ${id}`);
  }
}

function requireEvidence(control, errors, label) {
  if (!control.owner) errors.push(`${label}.${control.id}: missing owner`);
  if (control.replayStatus !== "pending_external" && control.replayStatus !== "ready_for_external_scanner_replay") {
    errors.push(`${label}.${control.id}: replayStatus must be pending_external or ready_for_external_scanner_replay`);
  }
  if (asArray(control.requiredEvidence).length < 3) {
    errors.push(`${label}.${control.id}: must include at least three requiredEvidence items`);
  }
}

const packet = JSON.parse(await readFile(PACKET_URL, "utf8"));
const securityReview = JSON.parse(await readFile(SECURITY_REVIEW_URL, "utf8"));
const securityReadiness = JSON.parse(await readFile(SECURITY_READINESS_URL, "utf8"));
const assetReadiness = JSON.parse(await readFile(ASSET_READINESS_URL, "utf8"));
const releaseReadiness = JSON.parse(await readFile(RELEASE_READINESS_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_security_infrastructure_review_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_security_infrastructure_review_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) {
  errors.push("packet.updatedAt must be YYYY-MM-DD");
}
if (packet.status !== "draft_ready_for_external_security_replay") {
  errors.push("packet.status must remain draft_ready_for_external_security_replay until real external replay is complete");
}
if (packet.reviewMode !== "public_mvp_infrastructure_and_upload_security") {
  errors.push("packet.reviewMode must be public_mvp_infrastructure_and_upload_security");
}

for (const source of REQUIRED_SOURCE_PACKETS) {
  if (!asArray(packet.sourcePackets).includes(source)) errors.push(`sourcePackets missing ${source}`);
  if (!(await pathExists(source))) errors.push(`source packet path does not exist: ${source}`);
}

requireIds({
  errors,
  label: "infrastructureControls",
  items: packet.infrastructureControls,
  requiredIds: REQUIRED_INFRA_CONTROLS,
});
for (const control of asArray(packet.infrastructureControls)) {
  requireEvidence(control, errors, "infrastructureControls");
}

requireIds({
  errors,
  label: "uploadStorageControls",
  items: packet.uploadStorageControls,
  requiredIds: REQUIRED_UPLOAD_CONTROLS,
});
for (const control of asArray(packet.uploadStorageControls)) {
  requireEvidence(control, errors, "uploadStorageControls");
}

requireIds({
  errors,
  label: "scannerReplayMatrix",
  items: packet.scannerReplayMatrix,
  requiredIds: REQUIRED_SCANNER_SCENARIOS,
});
for (const scenario of asArray(packet.scannerReplayMatrix)) {
  if (!scenario.input) errors.push(`scannerReplayMatrix.${scenario.id}: missing input`);
  if (!scenario.expected) errors.push(`scannerReplayMatrix.${scenario.id}: missing expected`);
  if (!["pending_external", "ready_for_external_scanner_replay"].includes(scenario.status)) {
    errors.push(`scannerReplayMatrix.${scenario.id}: status must be pending_external or ready_for_external_scanner_replay`);
  }
}

requireIds({
  errors,
  label: "privacyLogControls",
  items: packet.privacyLogControls,
  requiredIds: REQUIRED_PRIVACY_LOG_CONTROLS,
});
for (const control of asArray(packet.privacyLogControls)) {
  if (!control.owner) errors.push(`privacyLogControls.${control.id}: missing owner`);
  if (asArray(control.requiredEvidence).length < 2) {
    errors.push(`privacyLogControls.${control.id}: must include at least two requiredEvidence items`);
  }
}

const assetScope = getScope(securityReview, "asset_upload_and_storage");
if (!assetScope) {
  errors.push("security-review-packet.scope missing asset_upload_and_storage");
} else {
  for (const control of ["malware_scan_before_delivery", "storage_isolation_review"]) {
    if (!asArray(assetScope.requiredControls).includes(control)) {
      errors.push(`security-review-packet.asset_upload_and_storage.requiredControls missing ${control}`);
    }
  }
  if (!asArray(assetScope.evidence).includes("data/security-infrastructure-review-packet.json")) {
    errors.push("security-review-packet.asset_upload_and_storage.evidence must include data/security-infrastructure-review-packet.json");
  }
}

const infrastructureScope = getScope(securityReview, "production_infrastructure");
if (!infrastructureScope) {
  errors.push("security-review-packet.scope missing production_infrastructure");
} else {
  for (const control of REQUIRED_INFRA_CONTROLS) {
    if (!asArray(infrastructureScope.requiredControls).includes(control)) {
      errors.push(`security-review-packet.production_infrastructure.requiredControls missing ${control}`);
    }
  }
  for (const evidence of ["data/security-infrastructure-review-packet.json", "data/production-database-drill-packet.json"]) {
    if (!asArray(infrastructureScope.evidence).includes(evidence)) {
      errors.push(`security-review-packet.production_infrastructure.evidence must include ${evidence}`);
    }
  }
}

for (const check of ["malware_scan", "storage_isolation", "content_type_validation", "source_statement"]) {
  if (!asArray(assetReadiness.policy?.requiredReviewChecks).includes(check)) {
    errors.push(`asset-security-readiness.policy.requiredReviewChecks missing ${check}`);
  }
}

const securityControls = ids(securityReadiness.codeControls);
if (!securityControls.has("security_infrastructure_gate")) {
  errors.push("security-readiness.codeControls missing security_infrastructure_gate");
}

const securityArtifacts = ids(securityReadiness.dataArtifacts);
if (!securityArtifacts.has("security_infrastructure_review_packet")) {
  errors.push("security-readiness.dataArtifacts missing security_infrastructure_review_packet");
}
if (!asArray(securityReadiness.releaseCommands).includes("npm run check:security-infrastructure")) {
  errors.push("security-readiness.releaseCommands missing npm run check:security-infrastructure");
}

for (const command of REQUIRED_COMMANDS) {
  if (!asArray(packet.releasePolicy?.publicMvpRequires).includes(command)) {
    errors.push(`packet.releasePolicy.publicMvpRequires missing ${command}`);
  }
  if (!asArray(securityReview.releasePolicy?.publicMvpRequires).includes(command)) {
    errors.push(`security-review-packet.releasePolicy.publicMvpRequires missing ${command}`);
  }
}

for (const blocker of REQUIRED_EXTERNAL_BLOCKERS) {
  if (!asArray(packet.releasePolicy?.mustRemainInProgressUntil).includes(blocker)) {
    errors.push(`packet.releasePolicy.mustRemainInProgressUntil missing ${blocker}`);
  }
}
requireIds({
  errors,
  label: "externalBlockers",
  items: packet.externalBlockers,
  requiredIds: REQUIRED_EXTERNAL_BLOCKERS,
});
for (const blocker of asArray(packet.externalBlockers)) {
  if (blocker.status !== "pending_external") {
    errors.push(`externalBlockers.${blocker.id}: must remain pending_external`);
  }
}

const releaseSecurity = asArray(releaseReadiness.gates?.public_mvp?.items).find((item) => item.id === "security_review");
if (!releaseSecurity) {
  errors.push("release-readiness.public_mvp missing security_review");
} else {
  for (const evidence of [
    "data/security-infrastructure-review-packet.json",
    "scripts/check-security-infrastructure.mjs",
  ]) {
    if (!asArray(releaseSecurity.evidence).includes(evidence)) {
      errors.push(`release-readiness.security_review.evidence missing ${evidence}`);
    }
  }
  if (releaseSecurity.status === "ready") {
    errors.push("release-readiness.security_review cannot be ready before external security signoff");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Security infrastructure gate ${packet.schemaVersion}: infra=${asArray(packet.infrastructureControls).length}, upload=${asArray(packet.uploadStorageControls).length}, scanner=${asArray(packet.scannerReplayMatrix).length}, blockers=${asArray(packet.externalBlockers).length}`,
);
