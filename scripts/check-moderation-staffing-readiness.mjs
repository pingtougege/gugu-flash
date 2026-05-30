import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const STAFFING_URL = new URL("../docs/moderation-staffing-readiness.json", import.meta.url);
const GOVERNANCE_URL = new URL("../docs/review-governance-policy.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);
const REQUIRED_SEVERITIES = ["S0", "S1", "S2", "S3"];
const REQUIRED_DAILY_CHECKS = [
  "review_tasks",
  "open_reports",
  "open_rights_claims",
  "open_appeals",
  "frozen_settlements",
  "failed_sync_jobs",
  "payment_callbacks",
  "refund_callbacks",
  "operator_actions_without_reason",
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

const staffing = JSON.parse(await readFile(STAFFING_URL, "utf8"));
const governance = JSON.parse(await readFile(GOVERNANCE_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!staffing.version) errors.push("moderation-staffing: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(staffing.updatedAt || "")) {
  errors.push("moderation-staffing: updatedAt must be YYYY-MM-DD");
}
if (staffing.status !== "draft_pending_named_human_rota") {
  errors.push("moderation-staffing: status must remain draft_pending_named_human_rota until named staffing is assigned");
}

for (const document of asArray(staffing.documents)) {
  if (!document.id) errors.push("moderation-staffing document missing id");
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

for (const control of asArray(staffing.codeControls)) {
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

for (const artifact of asArray(staffing.dataArtifacts)) {
  if (!artifact.id) errors.push("dataArtifacts: missing id");
  if (!artifact.file) errors.push(`${artifact.id}: missing file`);
  if (!(await pathExists(artifact.file))) {
    errors.push(`${artifact.id}: file does not exist: ${artifact.file}`);
    continue;
  }
  const content = await readFile(resolve(artifact.file), "utf8");
  for (const marker of asArray(artifact.requiredMarkers)) {
    if (!content.includes(marker)) errors.push(`${artifact.id}: missing marker ${marker}`);
  }
  for (const clause of asArray(artifact.requiredClauses)) {
    if (!content.toLowerCase().includes(String(clause).toLowerCase())) {
      errors.push(`${artifact.id}: missing clause marker ${clause}`);
    }
  }
}

const policyQueueIds = [
  ...asArray(governance.reviewLayers).map((item) => item.id),
  ...asArray(governance.governanceQueues).map((item) => item.id),
];
const queueCoverage = new Map(asArray(staffing.queueCoverage).map((item) => [item.queueId, item]));
for (const queueId of policyQueueIds) {
  const coverage = queueCoverage.get(queueId);
  if (!coverage) {
    errors.push(`queueCoverage: missing ${queueId}`);
    continue;
  }
  for (const field of ["primaryOwner", "backupOwner", "minimumReviewers", "requiredReviewerLevel", "slaHours", "escalationOwner"]) {
    if (!coverage[field]) errors.push(`queueCoverage.${queueId}: missing ${field}`);
  }
  if (coverage.minimumReviewers < 1) errors.push(`queueCoverage.${queueId}: minimumReviewers must be >= 1`);
}

const appealCoverage = queueCoverage.get("appeal_review");
if (appealCoverage?.requiresSecondReviewer !== true) {
  errors.push("queueCoverage.appeal_review: requiresSecondReviewer must be true");
}

const escalationMatrix = new Map(asArray(staffing.escalationMatrix).map((item) => [item.severity, item]));
for (const severity of REQUIRED_SEVERITIES) {
  const row = escalationMatrix.get(severity);
  if (!row) {
    errors.push(`escalationMatrix: missing ${severity}`);
    continue;
  }
  for (const field of ["responseTarget", "primaryOwner", "backupOwner"]) {
    if (!row[field]) errors.push(`escalationMatrix.${severity}: missing ${field}`);
  }
}

const dailyChecks = new Set(asArray(staffing.dailyQueueReview));
for (const checkId of REQUIRED_DAILY_CHECKS) {
  if (!dailyChecks.has(checkId)) errors.push(`dailyQueueReview: missing ${checkId}`);
}

for (const module of asArray(staffing.trainingModules)) {
  if (!module.id) errors.push("trainingModules: missing id");
  if (!asArray(module.requiredFor).length) errors.push(`${module.id}: missing requiredFor`);
}

for (const item of asArray(staffing.externalAcceptance)) {
  if (!item.id) errors.push("externalAcceptance: missing id");
  if (item.status !== "pending_external") errors.push(`${item.id}: must remain pending_external until real staffing is recorded`);
  if (!item.needed) errors.push(`${item.id}: missing needed`);
}

for (const command of asArray(staffing.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const staffingReadinessItem = asArray(readiness.gates?.public_mvp?.items).find((item) => item.id === "moderation_staffing");
if (!staffingReadinessItem) {
  errors.push("release-readiness.public_mvp: missing moderation_staffing item");
} else {
  for (const evidence of ["docs/moderation-staffing-plan.md", "docs/moderation-staffing-readiness.json", "data/moderation-staffing-rota.json", "scripts/check-moderation-staffing-readiness.mjs", "scripts/check-moderation-rota.mjs", "docs/review-workflow-plan.md", "docs/review-governance-policy.json"]) {
    if (!asArray(staffingReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.moderation_staffing: evidence must include ${evidence}`);
    }
  }
  if (staffingReadinessItem.status === "ready") {
    errors.push("release-readiness.moderation_staffing: cannot be ready until named human rota and drills are complete");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const pending = asArray(staffing.externalAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`Moderation staffing readiness gate ${staffing.version}: queues=${queueCoverage.size}, severities=${escalationMatrix.size}, artifacts=${asArray(staffing.dataArtifacts).length}, pending_external=${pending}`);
