import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PACKET_URL = new URL("../data/beta-operations-launch-packet.json", import.meta.url);
const SUPPORT_URL = new URL("../docs/support-readiness.json", import.meta.url);
const ONCALL_URL = new URL("../data/support-oncall-packet.json", import.meta.url);
const TRAINING_URL = new URL("../data/support-training-handoff-drill.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_SOURCE_PACKETS = [
  "docs/support-readiness.json",
  "data/support-oncall-packet.json",
  "data/support-training-handoff-drill.json",
  "docs/support-diagnostics-readiness.json",
  "data/review-operations-certification-packet.json",
  "data/device-sync-regression-drill.json",
  "data/payment-settlement-reconciliation-drill.json",
  "data/legal-release-signoff-packet.json",
];

const REQUIRED_CHANNELS = [
  "closed_beta_support_queue",
  "closed_beta_ops_room",
  "closed_beta_s0_room",
];

const REQUIRED_CALENDAR_WINDOWS = [
  "day_0_launch_watch",
  "day_1_to_day_3_stabilization",
  "day_4_to_day_7_sustained_support",
  "s0_s1_after_hours",
];

const REQUIRED_DAILY_RHYTHM = [
  "morning_queue_review",
  "midday_cross_function_check",
  "end_of_day_handoff",
];

const REQUIRED_GO_NO_GO = [
  "support_roster_confirmed",
  "channels_created",
  "training_replay_complete",
  "diagnostic_access_verified",
  "payment_sync_rights_handoffs_verified",
];

const REQUIRED_METRICS = [
  "first_response_sla",
  "failed_sync_jobs",
  "payment_entitlement_mismatches",
  "rights_and_appeal_backlog",
  "operator_reason_audit",
];

const REQUIRED_COMMANDS = [
  "npm run check:support",
  "npm run check:support-oncall",
  "npm run check:support-training-handoff",
  "npm run check:beta-operations",
  "npm run check:support-diagnostics",
  "node scripts/check-release-readiness.mjs --gate=closed_beta",
];

const REQUIRED_EXTERNAL = [
  "real_staffing_assignment",
  "beta_oncall_calendar",
  "support_training_completion",
  "support_handoff_drill",
  "launch_channels_created",
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function ids(items) {
  return new Set(asArray(items).map((item) => item.id));
}

async function pathExists(path) {
  try {
    await access(resolve(path));
    return true;
  } catch {
    return false;
  }
}

function requireIds(errors, label, items, requiredIds) {
  const present = ids(items);
  for (const id of requiredIds) {
    if (!present.has(id)) errors.push(`${label} missing ${id}`);
  }
}

const packet = JSON.parse(await readFile(PACKET_URL, "utf8"));
const support = JSON.parse(await readFile(SUPPORT_URL, "utf8"));
const oncall = JSON.parse(await readFile(ONCALL_URL, "utf8"));
const training = JSON.parse(await readFile(TRAINING_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_beta_operations_launch_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_beta_operations_launch_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) {
  errors.push("packet.updatedAt must be YYYY-MM-DD");
}
if (packet.status !== "draft_ready_for_named_launch_rehearsal") {
  errors.push("packet.status must remain draft_ready_for_named_launch_rehearsal until named launch rehearsal is complete");
}
if (packet.launchMode !== "closed_beta_operations") {
  errors.push("packet.launchMode must be closed_beta_operations");
}

for (const source of REQUIRED_SOURCE_PACKETS) {
  if (!asArray(packet.sourcePackets).includes(source)) errors.push(`sourcePackets missing ${source}`);
  if (!(await pathExists(source))) errors.push(`source packet path does not exist: ${source}`);
}

const roleSlots = ids(oncall.roleSlots);
const supportChannels = new Set(asArray(support.escalationMatrix).map((item) => item.handoffChannel));
requireIds(errors, "launchChannels", packet.launchChannels, REQUIRED_CHANNELS);
for (const channel of asArray(packet.launchChannels)) {
  if (!supportChannels.has(channel.id)) errors.push(`launchChannels.${channel.id} is not in support escalation matrix`);
  for (const roleField of ["ownerRole", "backupRole"]) {
    if (!roleSlots.has(channel[roleField])) errors.push(`launchChannels.${channel.id}.${roleField} references unknown role`);
  }
  if (channel.status !== "pending_external_channel") {
    errors.push(`launchChannels.${channel.id}.status must remain pending_external_channel`);
  }
}

requireIds(errors, "calendarTemplate", packet.calendarTemplate, REQUIRED_CALENDAR_WINDOWS);
for (const row of asArray(packet.calendarTemplate)) {
  if (row.status !== "pending_named_staff") errors.push(`calendarTemplate.${row.id}.status must remain pending_named_staff`);
  if (!row.window) errors.push(`calendarTemplate.${row.id}.window is required`);
  for (const role of asArray(row.requiredRoles)) {
    if (!roleSlots.has(role)) errors.push(`calendarTemplate.${row.id}.requiredRoles references unknown role ${role}`);
  }
}

const supportDailyChecks = new Set(asArray(support.dailyReviewChecklist));
requireIds(errors, "dailyOperatingRhythm", packet.dailyOperatingRhythm, REQUIRED_DAILY_RHYTHM);
for (const row of asArray(packet.dailyOperatingRhythm)) {
  if (!row.time) errors.push(`dailyOperatingRhythm.${row.id}.time is required`);
  if (!roleSlots.has(row.ownerRole)) errors.push(`dailyOperatingRhythm.${row.id}.ownerRole references unknown role`);
  if (!row.output) errors.push(`dailyOperatingRhythm.${row.id}.output is required`);
  for (const input of asArray(row.requiredInputs)) {
    if (!supportDailyChecks.has(input) && !["open_s0_s1_cases", "pending_user_replies", "pending_owner_acknowledgements"].includes(input)) {
      errors.push(`dailyOperatingRhythm.${row.id}.requiredInputs references unknown check ${input}`);
    }
  }
}

requireIds(errors, "goNoGoChecklist", packet.goNoGoChecklist, REQUIRED_GO_NO_GO);
for (const item of asArray(packet.goNoGoChecklist)) {
  if (item.status !== "pending_external") errors.push(`goNoGoChecklist.${item.id}.status must remain pending_external`);
  if (!item.ownerRole) errors.push(`goNoGoChecklist.${item.id}.ownerRole is required`);
  if (item.ownerRole !== "ops_lead" && item.ownerRole !== "release_manager" && !roleSlots.has(item.ownerRole)) {
    errors.push(`goNoGoChecklist.${item.id}.ownerRole references unknown role`);
  }
  if (asArray(item.requiredEvidence).length < 3) {
    errors.push(`goNoGoChecklist.${item.id}.requiredEvidence must include at least 3 items`);
  }
}

requireIds(errors, "launchMetrics", packet.launchMetrics, REQUIRED_METRICS);
for (const metric of asArray(packet.launchMetrics)) {
  if (!metric.source) errors.push(`launchMetrics.${metric.id}.source is required`);
  if (!metric.threshold) errors.push(`launchMetrics.${metric.id}.threshold is required`);
  if (!roleSlots.has(metric.ownerRole)) errors.push(`launchMetrics.${metric.id}.ownerRole references unknown role`);
}

for (const command of REQUIRED_COMMANDS) {
  if (!asArray(packet.releasePolicy?.requiredCommands).includes(command)) {
    errors.push(`packet.releasePolicy.requiredCommands missing ${command}`);
  }
}
for (const blockerId of REQUIRED_EXTERNAL) {
  if (!asArray(packet.releasePolicy?.mustRemainInProgressUntil).includes(blockerId)) {
    errors.push(`packet.releasePolicy.mustRemainInProgressUntil missing ${blockerId}`);
  }
}

const external = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
for (const blockerId of REQUIRED_EXTERNAL) {
  const blocker = external.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId}.status must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (asArray(blocker.exitCriteria).length < 3) errors.push(`externalBlockers.${blockerId}.exitCriteria must include at least 3 items`);
}

const supportArtifacts = ids(support.dataArtifacts);
if (!supportArtifacts.has("beta_operations_launch_packet")) {
  errors.push("support-readiness.dataArtifacts missing beta_operations_launch_packet");
}
const supportControls = ids(support.codeControls);
if (!supportControls.has("beta_operations_launch_gate")) {
  errors.push("support-readiness.codeControls missing beta_operations_launch_gate");
}
if (!asArray(support.releaseCommands).includes("npm run check:beta-operations")) {
  errors.push("support-readiness.releaseCommands missing npm run check:beta-operations");
}

for (const blockerId of ["real_staffing_assignment", "beta_oncall_calendar", "support_training_completion", "support_handoff_drill"]) {
  if (!asArray(oncall.externalBlockers).some((item) => item.id === blockerId)) {
    errors.push(`support-oncall externalBlockers missing ${blockerId}`);
  }
  if (!asArray(training.externalBlockers).some((item) => item.id === blockerId)) {
    errors.push(`support-training externalBlockers missing ${blockerId}`);
  }
}

const supportReadinessItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "support_playbook");
if (!supportReadinessItem) {
  errors.push("release-readiness.closed_beta missing support_playbook");
} else {
  for (const evidence of [
    "data/beta-operations-launch-packet.json",
    "scripts/check-beta-operations-launch.mjs",
  ]) {
    if (!asArray(supportReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.support_playbook evidence missing ${evidence}`);
    }
  }
  if (supportReadinessItem.status !== "in_progress") {
    errors.push("support_playbook must remain in_progress until real staffing and launch rehearsal complete");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Beta operations launch gate ${packet.schemaVersion}: channels=${asArray(packet.launchChannels).length}, calendar=${asArray(packet.calendarTemplate).length}, rhythm=${asArray(packet.dailyOperatingRhythm).length}, metrics=${asArray(packet.launchMetrics).length}, blockers=${asArray(packet.externalBlockers).length}`,
);
