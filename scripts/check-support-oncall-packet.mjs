import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PACKET_URL = new URL("../data/support-oncall-packet.json", import.meta.url);
const SUPPORT_URL = new URL("../docs/support-readiness.json", import.meta.url);
const DIAGNOSTICS_URL = new URL("../docs/support-diagnostics-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_ROLE_SLOTS = [
  "support_agent_primary",
  "support_agent_backup",
  "support_lead",
  "on_call_operator",
  "commerce_escalation",
  "hardware_escalation",
  "trust_escalation",
  "product_s0_owner",
];
const REQUIRED_SEVERITIES = ["S0", "S1", "S2", "S3"];
const REQUIRED_DAILY_CHECKS = [
  "open_reports",
  "open_rights_claims",
  "open_appeals",
  "payment_callbacks",
  "refund_callbacks",
  "failed_sync_jobs",
  "frozen_settlements",
  "operator_actions_without_reason",
];
const REQUIRED_DIAGNOSTICS = [
  "diagnosticCode",
  "providerEventId",
  "orderId",
  "deviceId",
  "targetId",
  "requestId",
  "operationLogId",
];
const REQUIRED_DRILLS = [
  "payment_no_entitlement_s1",
  "sync_write_failed_s1",
  "rights_claim_store_freeze_s1",
];
const REQUIRED_EXTERNAL_BLOCKERS = [
  "real_staffing_assignment",
  "beta_oncall_calendar",
  "support_training_completion",
  "support_handoff_drill",
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
const support = JSON.parse(await readFile(SUPPORT_URL, "utf8"));
const diagnostics = JSON.parse(await readFile(DIAGNOSTICS_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_support_oncall_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_support_oncall_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_real_staffing") {
  errors.push("packet.status must remain draft_pending_real_staffing until named staffing is assigned");
}
if (packet.launchWindow?.timezone !== "Asia/Shanghai") errors.push("launchWindow.timezone must be Asia/Shanghai");
if (!packet.launchWindow?.coverageDays || packet.launchWindow.coverageDays < 7) {
  errors.push("launchWindow.coverageDays must cover at least 7 days");
}
if (packet.launchWindow?.s0s1Escalation !== "24x7") errors.push("launchWindow.s0s1Escalation must be 24x7");

const roleSlots = new Map(asArray(packet.roleSlots).map((item) => [item.id, item]));
for (const roleId of REQUIRED_ROLE_SLOTS) {
  const role = roleSlots.get(roleId);
  if (!role) {
    errors.push(`roleSlots missing ${roleId}`);
    continue;
  }
  if (!role.title) errors.push(`roleSlots.${roleId}.title is required`);
  if (!Number.isInteger(role.minimumNamedHumans) || role.minimumNamedHumans < 1) {
    errors.push(`roleSlots.${roleId}.minimumNamedHumans must be a positive integer`);
  }
  if (role.assignmentStatus !== "pending_external") errors.push(`roleSlots.${roleId}.assignmentStatus must remain pending_external`);
  if (!asArray(role.requiredTraining).length) errors.push(`roleSlots.${roleId}.requiredTraining is required`);
}

const severityRows = new Map(asArray(packet.severityCoverage).map((item) => [item.severity, item]));
const supportEscalations = new Map(asArray(support.escalationMatrix).map((item) => [item.severity, item]));
for (const severity of REQUIRED_SEVERITIES) {
  const row = severityRows.get(severity);
  const supportRow = supportEscalations.get(severity);
  if (!row) {
    errors.push(`severityCoverage missing ${severity}`);
    continue;
  }
  if (row.status !== "pending_external") errors.push(`severityCoverage.${severity}.status must remain pending_external`);
  for (const roleField of ["primaryRole", "backupRole"]) {
    if (!roleSlots.has(row[roleField])) errors.push(`severityCoverage.${severity}.${roleField} references unknown role`);
  }
  if (supportRow && row.responseTarget !== supportRow.responseTarget) {
    errors.push(`severityCoverage.${severity}.responseTarget must match support readiness`);
  }
  if (supportRow && row.handoffChannel !== supportRow.handoffChannel) {
    errors.push(`severityCoverage.${severity}.handoffChannel must match support readiness`);
  }
}

const supportMacros = new Set(asArray(support.ticketMacros).map((item) => item.id));
const macroRows = new Map(asArray(packet.macroCoverage).map((item) => [item.macroId, item]));
for (const macroId of supportMacros) {
  const row = macroRows.get(macroId);
  if (!row) {
    errors.push(`macroCoverage missing ${macroId}`);
    continue;
  }
  for (const roleField of ["primaryRole", "escalationRole"]) {
    if (!roleSlots.has(row[roleField])) errors.push(`macroCoverage.${macroId}.${roleField} references unknown role`);
  }
}

for (const checkId of REQUIRED_DAILY_CHECKS) {
  if (!asArray(packet.dailyReviewChecklist).includes(checkId)) errors.push(`dailyReviewChecklist missing ${checkId}`);
}
for (const checkId of asArray(support.dailyReviewChecklist)) {
  if (!asArray(packet.dailyReviewChecklist).includes(checkId)) errors.push(`dailyReviewChecklist missing support readiness check ${checkId}`);
}

const diagnosticsContent = JSON.stringify(diagnostics);
for (const field of REQUIRED_DIAGNOSTICS) {
  if (!asArray(packet.diagnosticRequirements).includes(field)) errors.push(`diagnosticRequirements missing ${field}`);
  if (!diagnosticsContent.includes(field)) errors.push(`support diagnostics readiness does not mention ${field}`);
}

const drillRows = new Map(asArray(packet.handoffDrills).map((item) => [item.id, item]));
for (const drillId of REQUIRED_DRILLS) {
  const drill = drillRows.get(drillId);
  if (!drill) {
    errors.push(`handoffDrills missing ${drillId}`);
    continue;
  }
  if (drill.status !== "pending_external") errors.push(`handoffDrills.${drillId}.status must remain pending_external`);
  if (!supportMacros.has(drill.macroId)) errors.push(`handoffDrills.${drillId}.macroId references unknown macro`);
  if (!REQUIRED_SEVERITIES.includes(drill.severity)) errors.push(`handoffDrills.${drillId}.severity is invalid`);
  if (!asArray(drill.requiredEvidence).length) errors.push(`handoffDrills.${drillId}.requiredEvidence is required`);
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
}

const supportArtifacts = new Map(asArray(support.dataArtifacts).map((item) => [item.id, item]));
if (!supportArtifacts.has("support_oncall_packet")) {
  errors.push("support-readiness.dataArtifacts missing support_oncall_packet");
}
const supportControls = new Map(asArray(support.codeControls).map((item) => [item.id, item]));
if (!supportControls.has("support_oncall_packet_gate")) {
  errors.push("support-readiness.codeControls missing support_oncall_packet_gate");
}
if (!asArray(support.releaseCommands).includes("npm run check:support-oncall")) {
  errors.push("support-readiness.releaseCommands missing npm run check:support-oncall");
}
if (!(await pathExists("data/support-oncall-packet.json"))) {
  errors.push("data/support-oncall-packet.json must exist");
}

const supportReadinessItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "support_playbook");
if (!supportReadinessItem) {
  errors.push("release-readiness.closed_beta missing support_playbook");
} else {
  for (const evidence of ["data/support-oncall-packet.json", "scripts/check-support-oncall-packet.mjs"]) {
    if (!asArray(supportReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.support_playbook evidence missing ${evidence}`);
    }
  }
  if (supportReadinessItem.status !== "in_progress") {
    errors.push("support_playbook must remain in_progress until real staffing is assigned");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Support on-call packet gate ${packet.schemaVersion}: roles=${roleSlots.size}, severities=${severityRows.size}, macros=${macroRows.size}, drills=${drillRows.size}, blockers=${blockerRows.size}`);
