import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DRILL_URL = new URL("../data/support-training-handoff-drill.json", import.meta.url);
const SUPPORT_URL = new URL("../docs/support-readiness.json", import.meta.url);
const ONCALL_URL = new URL("../data/support-oncall-packet.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_MODULES = [
  "support_playbook",
  "support_diagnostics",
  "ticket_macros",
  "payment_callbacks",
  "device_sync",
  "rights_claims",
  "appeals",
  "s0_incident_handoff",
  "escalation_matrix",
  "operation_log",
  "review_sla",
  "refund_policy",
  "device_lab_evidence",
  "takedowns",
  "legal_packet",
];
const REQUIRED_DRILLS = [
  "payment_no_entitlement_s1",
  "sync_write_failed_s1",
  "rights_claim_store_freeze_s1",
];
const REQUIRED_COMMANDS = [
  "npm run check:support",
  "npm run check:support-oncall",
  "npm run check:support-training-handoff",
  "npm run check:support-diagnostics",
];
const REQUIRED_EXTERNAL = [
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

const drill = JSON.parse(await readFile(DRILL_URL, "utf8"));
const support = JSON.parse(await readFile(SUPPORT_URL, "utf8"));
const oncall = JSON.parse(await readFile(ONCALL_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (drill.schemaVersion !== "gugu_support_training_handoff_drill_v1") {
  errors.push("drill.schemaVersion must be gugu_support_training_handoff_drill_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(drill.updatedAt || "")) errors.push("drill.updatedAt must be YYYY-MM-DD");
if (drill.status !== "draft_ready_for_named_staff_replay") {
  errors.push("drill.status must remain draft_ready_for_named_staff_replay");
}
if (drill.environment !== "closed_beta_support") errors.push("drill.environment must be closed_beta_support");

const modules = new Map(asArray(drill.trainingModules).map((item) => [item.id, item]));
for (const moduleId of REQUIRED_MODULES) {
  const module = modules.get(moduleId);
  if (!module) {
    errors.push(`trainingModules missing ${moduleId}`);
    continue;
  }
  if (!module.title) errors.push(`trainingModules.${moduleId}.title is required`);
  if (asArray(module.requiredEvidence).length < 3) {
    errors.push(`trainingModules.${moduleId}.requiredEvidence must include at least 3 items`);
  }
}

const roleSlots = new Map(asArray(oncall.roleSlots).map((item) => [item.id, item]));
const matrix = new Map(asArray(drill.roleTrainingMatrix).map((item) => [item.roleSlot, item]));
for (const roleId of roleSlots.keys()) {
  const row = matrix.get(roleId);
  if (!row) {
    errors.push(`roleTrainingMatrix missing ${roleId}`);
    continue;
  }
  if (row.completionStatus !== "pending_named_staff") {
    errors.push(`roleTrainingMatrix.${roleId}.completionStatus must remain pending_named_staff`);
  }
  for (const moduleId of asArray(row.requiredModules)) {
    if (!modules.has(moduleId)) errors.push(`roleTrainingMatrix.${roleId} references unknown module ${moduleId}`);
  }
  for (const moduleId of asArray(roleSlots.get(roleId)?.requiredTraining)) {
    if (!asArray(row.requiredModules).includes(moduleId)) {
      errors.push(`roleTrainingMatrix.${roleId} missing on-call required training ${moduleId}`);
    }
  }
}

const supportMacros = new Set(asArray(support.ticketMacros).map((item) => item.id));
const oncallDrills = new Map(asArray(oncall.handoffDrills).map((item) => [item.id, item]));
const scripts = new Map(asArray(drill.handoffDrillScripts).map((item) => [item.id, item]));
for (const drillId of REQUIRED_DRILLS) {
  const row = scripts.get(drillId);
  const oncallRow = oncallDrills.get(drillId);
  if (!row) {
    errors.push(`handoffDrillScripts missing ${drillId}`);
    continue;
  }
  if (!oncallRow) errors.push(`on-call handoffDrills missing ${drillId}`);
  if (row.replayStatus !== "pending_named_staff") {
    errors.push(`handoffDrillScripts.${drillId}.replayStatus must remain pending_named_staff`);
  }
  if (!supportMacros.has(row.macroId)) errors.push(`handoffDrillScripts.${drillId}.macroId references unknown macro`);
  if (row.macroId !== oncallRow?.macroId) errors.push(`handoffDrillScripts.${drillId}.macroId must match support on-call packet`);
  if (row.severity !== oncallRow?.severity) errors.push(`handoffDrillScripts.${drillId}.severity must match support on-call packet`);
  for (const roleField of ["primaryRole", "supportRole"]) {
    if (!roleSlots.has(row[roleField])) errors.push(`handoffDrillScripts.${drillId}.${roleField} references unknown role`);
  }
  for (const evidence of asArray(oncallRow?.requiredEvidence)) {
    if (!asArray(row.requiredEvidence).includes(evidence)) {
      errors.push(`handoffDrillScripts.${drillId}.requiredEvidence missing on-call evidence ${evidence}`);
    }
  }
}

for (const command of REQUIRED_COMMANDS) {
  if (!asArray(drill.releasePolicy?.requiredCommands).includes(command)) {
    errors.push(`releasePolicy.requiredCommands missing ${command}`);
  }
}
for (const blockerId of REQUIRED_EXTERNAL) {
  if (!asArray(drill.releasePolicy?.mustRemainInProgressUntil).includes(blockerId)) {
    errors.push(`releasePolicy.mustRemainInProgressUntil missing ${blockerId}`);
  }
}
const blockerRows = new Map(asArray(drill.externalBlockers).map((item) => [item.id, item]));
for (const blockerId of REQUIRED_EXTERNAL) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId}.status must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (asArray(blocker.exitCriteria).length < 3) errors.push(`externalBlockers.${blockerId}.exitCriteria must include at least 3 items`);
}

const supportArtifacts = new Map(asArray(support.dataArtifacts).map((item) => [item.id, item]));
if (!supportArtifacts.has("support_training_handoff_drill")) {
  errors.push("support-readiness.dataArtifacts missing support_training_handoff_drill");
}
const supportControls = new Map(asArray(support.codeControls).map((item) => [item.id, item]));
if (!supportControls.has("support_training_handoff_gate")) {
  errors.push("support-readiness.codeControls missing support_training_handoff_gate");
}
if (!asArray(support.releaseCommands).includes("npm run check:support-training-handoff")) {
  errors.push("support-readiness.releaseCommands missing npm run check:support-training-handoff");
}
if (!(await pathExists("data/support-training-handoff-drill.json"))) {
  errors.push("data/support-training-handoff-drill.json must exist");
}

const supportReadinessItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "support_playbook");
if (!supportReadinessItem) {
  errors.push("release-readiness.closed_beta missing support_playbook");
} else {
  for (const evidence of ["data/support-training-handoff-drill.json", "scripts/check-support-training-handoff.mjs"]) {
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

console.log(`Support training handoff gate ${drill.schemaVersion}: modules=${modules.size}, roles=${matrix.size}, drills=${scripts.size}, blockers=${blockerRows.size}`);
