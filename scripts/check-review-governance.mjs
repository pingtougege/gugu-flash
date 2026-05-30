import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const POLICY_URL = new URL("../docs/review-governance-policy.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);
const REQUIRED_RELEASE_ITEMS = [
  "h5_publish_review",
  "store_listing_review",
  "content_reports_rights_claims",
];
const REQUIRED_REVIEW_LAYERS = {
  h5_publish_review: {
    actions: ["approve", "reject", "limit_recommend", "take_down"],
    states: ["draft", "publish_submitted", "public_limited", "public", "rejected", "taken_down"],
  },
  store_listing_review: {
    actions: ["approve", "reject", "freeze_store", "delist"],
    states: ["not_applied", "listing_submitted", "rights_review", "listed", "rejected", "delisted", "frozen"],
  },
  hardware_adaptation_review: {
    actions: ["approve", "reject", "publish"],
    states: ["not_candidate", "hardware_candidate", "adaptation_review", "adapting", "hardware_ready", "device_available", "hardware_rejected"],
  },
};
const REQUIRED_GOVERNANCE_QUEUES = {
  comment_report_governance: ["hide", "limit_recommend", "take_down", "reject", "escalate"],
  rights_claim_governance: ["freeze_store", "take_down", "restore", "reject", "close", "escalate"],
  appeal_review: ["restore", "keep_action", "modify_required", "escalate"],
};
const REQUIRED_RISK_LEVELS = ["low", "medium", "high", "blocked"];
const REQUIRED_RISK_TYPES = [
  "harassment_or_bullying",
  "minor_risk",
  "ip_or_copyright",
  "external_contact_or_transaction",
  "unsafe_hardware_content",
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

function stateValues(stateMachine) {
  return new Set(Object.values(stateMachine || {}));
}

function actionIds(record) {
  return new Set(asArray(record.actions).map((action) => action.id));
}

function evidenceIds(record) {
  return new Set(asArray(record.requiredEvidence).map((item) => item.id));
}

function requireEvery(errors, values, required, label) {
  const available = new Set(values);
  for (const item of required) {
    if (!available.has(item)) errors.push(`${label}: missing ${item}`);
  }
}

function validateSla(errors, record, label) {
  const sla = record.sla || {};
  for (const key of ["triageHours", "decisionHours", "escalationHours"]) {
    if (!Number.isFinite(sla[key]) || sla[key] <= 0) {
      errors.push(`${label}: SLA ${key} must be a positive number`);
    }
  }
  if (Number.isFinite(sla.triageHours) && Number.isFinite(sla.decisionHours) && sla.triageHours > sla.decisionHours) {
    errors.push(`${label}: triageHours cannot be greater than decisionHours`);
  }
}

function validateEvidenceAndActions(errors, record, label) {
  const knownEvidence = evidenceIds(record);
  if (!knownEvidence.size) errors.push(`${label}: missing requiredEvidence`);

  for (const evidence of asArray(record.requiredEvidence)) {
    if (!evidence.id) errors.push(`${label}: evidence missing id`);
    if (!evidence.label) errors.push(`${label}.${evidence.id}: evidence missing label`);
    if (!asArray(evidence.requiredFor).length) errors.push(`${label}.${evidence.id}: evidence must name requiredFor actions`);
  }

  for (const action of asArray(record.actions)) {
    if (!action.id) errors.push(`${label}: action missing id`);
    if (action.auditLog !== true) errors.push(`${label}.${action.id}: action must require auditLog`);
    if (typeof action.notifiesUser !== "boolean") errors.push(`${label}.${action.id}: action must define notifiesUser`);
    if (typeof action.requiresReason !== "boolean") errors.push(`${label}.${action.id}: action must define requiresReason`);
    if (typeof action.appealable !== "boolean") errors.push(`${label}.${action.id}: action must define appealable`);
    if (!asArray(action.requiresEvidence).length) errors.push(`${label}.${action.id}: action must require evidence`);
    for (const evidenceId of asArray(action.requiresEvidence)) {
      if (!knownEvidence.has(evidenceId)) errors.push(`${label}.${action.id}: unknown evidence ${evidenceId}`);
    }
  }
}

async function validateLocalPaths(errors, record, label) {
  for (const path of [...asArray(record.sourceDocs), ...asArray(record.behaviorEvidence)]) {
    if (!(await pathExists(path))) errors.push(`${label}: missing referenced path ${path}`);
  }
}

const policy = JSON.parse(await readFile(POLICY_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!policy.version) errors.push("policy: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(policy.updatedAt || "")) errors.push("policy: updatedAt must be YYYY-MM-DD");

requireEvery(errors, policy.riskTaxonomy?.levels || [], REQUIRED_RISK_LEVELS, "riskTaxonomy.levels");
requireEvery(errors, policy.riskTaxonomy?.types || [], REQUIRED_RISK_TYPES, "riskTaxonomy.types");

const releaseCoverage = new Map(asArray(policy.releaseGateCoverage).map((item) => [item.itemId, item]));
for (const itemId of REQUIRED_RELEASE_ITEMS) {
  const coverage = releaseCoverage.get(itemId);
  if (!coverage) {
    errors.push(`releaseGateCoverage: missing ${itemId}`);
    continue;
  }
  if (coverage.gate !== "closed_beta") errors.push(`releaseGateCoverage.${itemId}: expected closed_beta gate`);
  if (!asArray(coverage.coveredBy).length) errors.push(`releaseGateCoverage.${itemId}: missing coveredBy`);
}

const readinessItems = new Map(asArray(readiness.gates?.closed_beta?.items).map((item) => [item.id, item]));
for (const itemId of REQUIRED_RELEASE_ITEMS) {
  const item = readinessItems.get(itemId);
  if (!item) {
    errors.push(`release-readiness.closed_beta: missing ${itemId}`);
    continue;
  }
  for (const requiredEvidence of ["docs/review-governance-policy.json", "scripts/check-review-governance.mjs"]) {
    if (!asArray(item.evidence).includes(requiredEvidence)) {
      errors.push(`release-readiness.${itemId}: evidence must include ${requiredEvidence}`);
    }
  }
}

const reviewLayers = new Map(asArray(policy.reviewLayers).map((layer) => [layer.id, layer]));
for (const [layerId, requirements] of Object.entries(REQUIRED_REVIEW_LAYERS)) {
  const layer = reviewLayers.get(layerId);
  if (!layer) {
    errors.push(`reviewLayers: missing ${layerId}`);
    continue;
  }
  const label = `reviewLayers.${layerId}`;
  if (!layer.ownerRole) errors.push(`${label}: missing ownerRole`);
  if (!asArray(layer.operatorRoles).length) errors.push(`${label}: missing operatorRoles`);
  if (!asArray(layer.targetTypes).length) errors.push(`${label}: missing targetTypes`);
  if (!asArray(layer.triggers).length) errors.push(`${label}: missing triggers`);
  requireEvery(errors, stateValues(layer.stateMachine), requirements.states, `${label}.stateMachine`);
  requireEvery(errors, actionIds(layer), requirements.actions, `${label}.actions`);
  requireEvery(errors, layer.riskLevels || [], REQUIRED_RISK_LEVELS, `${label}.riskLevels`);
  validateSla(errors, layer, label);
  validateEvidenceAndActions(errors, layer, label);
  await validateLocalPaths(errors, layer, label);
}

const governanceQueues = new Map(asArray(policy.governanceQueues).map((queue) => [queue.id, queue]));
for (const [queueId, requiredActions] of Object.entries(REQUIRED_GOVERNANCE_QUEUES)) {
  const queue = governanceQueues.get(queueId);
  if (!queue) {
    errors.push(`governanceQueues: missing ${queueId}`);
    continue;
  }
  const label = `governanceQueues.${queueId}`;
  if (!queue.ownerRole) errors.push(`${label}: missing ownerRole`);
  if (!asArray(queue.operatorRoles).length) errors.push(`${label}: missing operatorRoles`);
  if (!asArray(queue.targetTypes).length) errors.push(`${label}: missing targetTypes`);
  if (!asArray(queue.statuses).includes("submitted")) errors.push(`${label}: statuses must include submitted`);
  requireEvery(errors, actionIds(queue), requiredActions, `${label}.actions`);
  validateSla(errors, queue, label);
  validateEvidenceAndActions(errors, queue, label);
  await validateLocalPaths(errors, queue, label);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Review governance policy ${policy.version}: ${policy.reviewLayers.length} review layers, ${policy.governanceQueues.length} governance queues.`);
