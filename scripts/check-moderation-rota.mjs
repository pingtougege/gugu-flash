import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROTA_URL = new URL("../data/moderation-staffing-rota.json", import.meta.url);
const STAFFING_URL = new URL("../docs/moderation-staffing-readiness.json", import.meta.url);
const GOVERNANCE_URL = new URL("../docs/review-governance-policy.json", import.meta.url);
const REVIEW_SLA_URL = new URL("../docs/review-sla-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_ROLE_SLOTS = [
  "trust_lead",
  "operator_lead",
  "commerce_lead",
  "hardware_lead",
  "support_lead",
  "product_owner",
  "reviewer_l1",
  "reviewer_l2",
];
const REQUIRED_COVERAGE_WINDOWS = ["closed_beta_daytime", "public_mvp_daytime", "s0_s1_escalation"];
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
const REQUIRED_DRILLS = ["s1_rights_store_freeze", "appeal_second_reviewer", "queue_sla_dashboard_review"];
const REQUIRED_EXTERNAL_BLOCKERS = [
  "named_human_rota",
  "training_completion",
  "escalation_drill",
  "queue_sla_dashboard",
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

const rota = JSON.parse(await readFile(ROTA_URL, "utf8"));
const staffing = JSON.parse(await readFile(STAFFING_URL, "utf8"));
const governance = JSON.parse(await readFile(GOVERNANCE_URL, "utf8"));
const reviewSla = JSON.parse(await readFile(REVIEW_SLA_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (rota.schemaVersion !== "gugu_moderation_staffing_rota_v1") {
  errors.push("rota.schemaVersion must be gugu_moderation_staffing_rota_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(rota.updatedAt || "")) errors.push("rota.updatedAt must be YYYY-MM-DD");
if (rota.status !== "draft_pending_named_human_rota") {
  errors.push("rota.status must remain draft_pending_named_human_rota until named people are assigned");
}
if (rota.timezone !== "Asia/Shanghai") errors.push("rota.timezone must be Asia/Shanghai");
if (!rota.launchWindow?.coverageDays || rota.launchWindow.coverageDays < 7) {
  errors.push("launchWindow.coverageDays must cover at least 7 days");
}
if (rota.launchWindow?.s0s1Escalation !== "24x7") errors.push("launchWindow.s0s1Escalation must be 24x7");

const trainingIds = new Set(asArray(staffing.trainingModules).map((item) => item.id));
const roleSlots = new Map(asArray(rota.roleSlots).map((item) => [item.id, item]));
for (const roleId of REQUIRED_ROLE_SLOTS) {
  const slot = roleSlots.get(roleId);
  if (!slot) {
    errors.push(`roleSlots missing ${roleId}`);
    continue;
  }
  if (!slot.title) errors.push(`roleSlots.${roleId} missing title`);
  if (!Number.isInteger(slot.minimumNamedHumans) || slot.minimumNamedHumans < 1) {
    errors.push(`roleSlots.${roleId}.minimumNamedHumans must be a positive integer`);
  }
  if (slot.assignmentStatus !== "pending_external") {
    errors.push(`roleSlots.${roleId}.assignmentStatus must remain pending_external`);
  }
  for (const moduleId of asArray(slot.trainingRequired)) {
    if (!trainingIds.has(moduleId)) errors.push(`roleSlots.${roleId} references unknown training module ${moduleId}`);
  }
}
if ((roleSlots.get("reviewer_l1")?.minimumNamedHumans || 0) < 2) errors.push("reviewer_l1 must require at least 2 named humans");
if ((roleSlots.get("reviewer_l2")?.minimumNamedHumans || 0) < 2) errors.push("reviewer_l2 must require at least 2 named humans");

const policyQueueIds = [
  ...asArray(governance.reviewLayers).map((item) => item.id),
  ...asArray(governance.governanceQueues).map((item) => item.id),
];
const queueAssignments = new Map(asArray(rota.queueAssignments).map((item) => [item.queueId, item]));
const staffingQueueCoverage = new Map(asArray(staffing.queueCoverage).map((item) => [item.queueId, item]));
const slaTargets = new Map(asArray(reviewSla.queueTargets).map((item) => [item.queueId, item]));
for (const queueId of policyQueueIds) {
  const assignment = queueAssignments.get(queueId);
  if (!assignment) {
    errors.push(`queueAssignments missing ${queueId}`);
    continue;
  }
  for (const roleField of ["primaryRole", "backupRole", "reviewerPool"]) {
    if (!roleSlots.has(assignment[roleField])) errors.push(`queueAssignments.${queueId}.${roleField} references unknown role`);
  }
  const coverage = staffingQueueCoverage.get(queueId);
  if (coverage && assignment.minimumReviewers < coverage.minimumReviewers) {
    errors.push(`queueAssignments.${queueId}.minimumReviewers is below staffing readiness minimum`);
  }
  const target = slaTargets.get(queueId);
  if (target && assignment.slaHours !== target.slaHours) {
    errors.push(`queueAssignments.${queueId}.slaHours must match review SLA target`);
  }
}
if (queueAssignments.get("appeal_review")?.requiresSecondReviewer !== true) {
  errors.push("queueAssignments.appeal_review.requiresSecondReviewer must be true");
}

const coverageWindows = new Map(asArray(rota.coverageWindows).map((item) => [item.id, item]));
for (const windowId of REQUIRED_COVERAGE_WINDOWS) {
  const window = coverageWindows.get(windowId);
  if (!window) {
    errors.push(`coverageWindows missing ${windowId}`);
    continue;
  }
  if (window.status !== "pending_external") errors.push(`coverageWindows.${windowId}.status must remain pending_external`);
  if (window.minimumActiveReviewers < 1) errors.push(`coverageWindows.${windowId}.minimumActiveReviewers must be >= 1`);
  for (const queueId of asArray(window.queues)) {
    if (!policyQueueIds.includes(queueId)) errors.push(`coverageWindows.${windowId} references unknown queue ${queueId}`);
  }
  for (const roleId of asArray(window.requiredLeadRoles)) {
    if (!roleSlots.has(roleId)) errors.push(`coverageWindows.${windowId} references unknown role ${roleId}`);
  }
}

for (const checkId of REQUIRED_DAILY_CHECKS) {
  if (!asArray(rota.dailyQueueReview).includes(checkId)) errors.push(`dailyQueueReview missing ${checkId}`);
}
for (const moduleId of asArray(rota.trainingModules)) {
  if (!trainingIds.has(moduleId)) errors.push(`trainingModules references unknown module ${moduleId}`);
}
for (const moduleId of trainingIds) {
  if (!asArray(rota.trainingModules).includes(moduleId)) errors.push(`trainingModules missing ${moduleId}`);
}

const drills = new Map(asArray(rota.drills).map((item) => [item.id, item]));
for (const drillId of REQUIRED_DRILLS) {
  const drill = drills.get(drillId);
  if (!drill) {
    errors.push(`drills missing ${drillId}`);
    continue;
  }
  if (drill.status !== "pending_external") errors.push(`drills.${drillId}.status must remain pending_external`);
  if (!asArray(drill.requiredEvidence).length) errors.push(`drills.${drillId} missing requiredEvidence`);
}

const blockerRows = new Map(asArray(rota.externalBlockers).map((item) => [item.id, item]));
const staffingExternal = new Set(asArray(staffing.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
  if (!staffingExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from moderation staffing externalAcceptance`);
}

const staffingArtifacts = new Map(asArray(staffing.dataArtifacts).map((item) => [item.id, item]));
if (!staffingArtifacts.has("moderation_staffing_rota")) {
  errors.push("moderation-staffing-readiness.dataArtifacts missing moderation_staffing_rota");
}
const staffingControls = new Map(asArray(staffing.codeControls).map((item) => [item.id, item]));
if (!staffingControls.has("moderation_rota_gate")) {
  errors.push("moderation-staffing-readiness.codeControls missing moderation_rota_gate");
}
if (!asArray(staffing.releaseCommands).includes("npm run check:moderation-rota")) {
  errors.push("moderation-staffing-readiness.releaseCommands missing npm run check:moderation-rota");
}
if (!(await pathExists("data/moderation-staffing-rota.json"))) {
  errors.push("data/moderation-staffing-rota.json must exist");
}

const staffingReadinessItem = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "moderation_staffing");
if (!staffingReadinessItem) {
  errors.push("release-readiness.public_mvp missing moderation_staffing");
} else {
  for (const evidence of ["data/moderation-staffing-rota.json", "scripts/check-moderation-rota.mjs"]) {
    if (!asArray(staffingReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.moderation_staffing evidence missing ${evidence}`);
    }
  }
  if (staffingReadinessItem.status !== "in_progress") {
    errors.push("moderation_staffing must remain in_progress until real rota and drills are complete");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Moderation rota gate ${rota.schemaVersion}: roles=${roleSlots.size}, queues=${queueAssignments.size}, windows=${coverageWindows.size}, drills=${drills.size}, pending_external=${blockerRows.size}`);
