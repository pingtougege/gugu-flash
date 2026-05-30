import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { REVIEW_SLA_QUEUE_TARGETS } from "../apps/backend/src/review-sla.js";

const PACKET_URL = new URL("../data/review-operations-certification-packet.json", import.meta.url);
const SLA_URL = new URL("../docs/review-sla-readiness.json", import.meta.url);
const STAFFING_URL = new URL("../docs/moderation-staffing-readiness.json", import.meta.url);
const ROTA_URL = new URL("../data/moderation-staffing-rota.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const SUPPORT_MACROS_URL = new URL("../docs/support-ticket-macros.md", import.meta.url);

const REQUIRED_QUEUES = [
  "h5_publish_review",
  "store_listing_review",
  "comment_report_governance",
  "rights_claim_governance",
  "appeal_review",
];
const REQUIRED_DAILY_CHECKS = [
  "oldest_case_age",
  "sla_breach_count",
  "operator_actions_without_reason",
  "appeals_with_reviewer_conflict",
  "frozen_settlements",
  "support_handoff_needed",
];
const REQUIRED_TRAINING = [
  "content_safety_basics",
  "ip_rights_and_store_freeze",
  "appeal_second_review",
  "s1_rights_store_freeze",
  "queue_sla_dashboard_review",
];
const REQUIRED_COMMANDS = [
  "npm run check:governance",
  "npm run check:review-sla",
  "npm run check:review-operations-certification",
  "npm run check:moderation-staffing",
  "npm run check:moderation-rota",
];
const REQUIRED_EXTERNAL = [
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

const packet = JSON.parse(await readFile(PACKET_URL, "utf8"));
const sla = JSON.parse(await readFile(SLA_URL, "utf8"));
const staffing = JSON.parse(await readFile(STAFFING_URL, "utf8"));
const rota = JSON.parse(await readFile(ROTA_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const supportMacros = await readFile(SUPPORT_MACROS_URL, "utf8");
const errors = [];

if (packet.schemaVersion !== "gugu_review_operations_certification_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_review_operations_certification_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_named_review_ops") {
  errors.push("packet.status must remain draft_pending_named_review_ops until named humans and drills are complete");
}

const queueRows = new Map(asArray(packet.queues).map((item) => [item.id, item]));
const slaRows = new Map(asArray(sla.queueTargets).map((item) => [item.queueId, item]));
const staffingRows = new Map(asArray(staffing.queueCoverage).map((item) => [item.queueId, item]));
const rotaRows = new Map(asArray(rota.queueAssignments).map((item) => [item.queueId, item]));
for (const queueId of REQUIRED_QUEUES) {
  const row = queueRows.get(queueId);
  const slaRow = slaRows.get(queueId);
  const staffingRow = staffingRows.get(queueId);
  const rotaRow = rotaRows.get(queueId);
  if (!row) {
    errors.push(`queues missing ${queueId}`);
    continue;
  }
  if (!slaRow) errors.push(`review-sla queueTargets missing ${queueId}`);
  if (!staffingRow) errors.push(`moderation-staffing queueCoverage missing ${queueId}`);
  if (!rotaRow) errors.push(`moderation rota queueAssignments missing ${queueId}`);
  if (row.slaHours !== REVIEW_SLA_QUEUE_TARGETS[queueId]?.slaHours) {
    errors.push(`queues.${queueId}.slaHours must match REVIEW_SLA_QUEUE_TARGETS`);
  }
  if (staffingRow && row.minimumReviewers !== staffingRow.minimumReviewers) {
    errors.push(`queues.${queueId}.minimumReviewers must match moderation staffing readiness`);
  }
  if (!asArray(row.requiredEvidence).includes("operation_log")) {
    errors.push(`queues.${queueId}.requiredEvidence missing operation_log`);
  }
  if (!asArray(row.releaseGateItems).length) errors.push(`queues.${queueId}.releaseGateItems is required`);
}
if (queueRows.get("appeal_review")?.requiresSecondReviewer !== true) {
  errors.push("appeal_review must require a second reviewer");
}

const loop = packet.dailyOperatingLoop || {};
if (loop.timezone !== "Asia/Shanghai") errors.push("dailyOperatingLoop.timezone must be Asia/Shanghai");
if (loop.dashboardEndpoint !== "/flash/operator/review-sla") {
  errors.push("dailyOperatingLoop.dashboardEndpoint must be /flash/operator/review-sla");
}
if (loop.requiresDailySignoff !== true) errors.push("dailyOperatingLoop.requiresDailySignoff must be true");
for (const check of REQUIRED_DAILY_CHECKS) {
  if (!asArray(loop.requiredChecks).includes(check)) errors.push(`dailyOperatingLoop.requiredChecks missing ${check}`);
}

for (const [field, expected] of Object.entries({
  appealSecondReviewerRequired: true,
  sameReviewerCannotResolveOwnAppeal: true,
  rightsClaimPaidContentRequiresLeadReview: true,
  operatorReasonRequiredForSensitiveActions: true,
})) {
  if (packet.separationOfDuties?.[field] !== expected) {
    errors.push(`separationOfDuties.${field} must be ${expected}`);
  }
}

const trainingRows = new Map(asArray(packet.trainingAndDrills).map((item) => [item.id, item]));
for (const trainingId of REQUIRED_TRAINING) {
  const row = trainingRows.get(trainingId);
  if (!row) {
    errors.push(`trainingAndDrills missing ${trainingId}`);
    continue;
  }
  if (!asArray(row.requiredFor).length && !asArray(row.requiredEvidence).length) {
    errors.push(`trainingAndDrills.${trainingId} must include requiredFor or requiredEvidence`);
  }
}

for (const macro of asArray(packet.supportHandoff?.macros)) {
  if (!supportMacros.includes(macro)) errors.push(`supportHandoff.macros missing from support macros: ${macro}`);
}
for (const flag of ["diagnosticBundleRequired", "paidContentEscalatesToCommerce", "hardwareContentEscalatesToHardwareLead"]) {
  if (packet.supportHandoff?.[flag] !== true) errors.push(`supportHandoff.${flag} must be true`);
}

for (const command of REQUIRED_COMMANDS) {
  if (!asArray(packet.releasePolicy?.requiredCommands).includes(command)) {
    errors.push(`releasePolicy.requiredCommands missing ${command}`);
  }
}
for (const blockerId of REQUIRED_EXTERNAL) {
  if (!asArray(packet.releasePolicy?.mustRemainInProgressUntil).includes(blockerId)) {
    errors.push(`releasePolicy.mustRemainInProgressUntil missing ${blockerId}`);
  }
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
const staffingExternal = new Set(asArray(staffing.externalAcceptance).map((item) => item.id));
const rotaExternal = new Set(asArray(rota.externalBlockers).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL) {
  const row = blockerRows.get(blockerId);
  if (!row) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (row.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!row.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (!asArray(row.exitCriteria).length) errors.push(`externalBlockers.${blockerId}.exitCriteria is required`);
  if (!staffingExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from staffing externalAcceptance`);
  if (!rotaExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from rota externalBlockers`);
}

const artifacts = new Map(asArray(sla.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("review_operations_certification_packet")) {
  errors.push("review-sla-readiness.dataArtifacts missing review_operations_certification_packet");
}
const controls = new Map(asArray(sla.codeControls).map((item) => [item.id, item]));
if (!controls.has("review_operations_certification_gate")) {
  errors.push("review-sla-readiness.codeControls missing review_operations_certification_gate");
}
if (!asArray(sla.releaseCommands).includes("npm run check:review-operations-certification")) {
  errors.push("review-sla-readiness.releaseCommands missing npm run check:review-operations-certification");
}
if (!(await pathExists("data/review-operations-certification-packet.json"))) {
  errors.push("data/review-operations-certification-packet.json must exist");
}

const releaseItems = [
  ["closed_beta", "h5_publish_review"],
  ["closed_beta", "store_listing_review"],
  ["closed_beta", "content_reports_rights_claims"],
  ["public_mvp", "moderation_staffing"],
];
for (const [gate, itemId] of releaseItems) {
  const item = asArray(release.gates?.[gate]?.items).find((entry) => entry.id === itemId);
  if (!item) {
    errors.push(`release-readiness.${gate} missing ${itemId}`);
    continue;
  }
  for (const evidence of ["data/review-operations-certification-packet.json", "scripts/check-review-operations-certification.mjs"]) {
    if (!asArray(item.evidence).includes(evidence)) {
      errors.push(`release-readiness.${itemId} evidence missing ${evidence}`);
    }
  }
  if (item.status === "ready") errors.push(`release-readiness.${itemId} must remain non-ready until named review ops are complete`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Review operations certification gate ${packet.schemaVersion}: queues=${queueRows.size}, drills=${trainingRows.size}, blockers=${blockerRows.size}`);
