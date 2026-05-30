import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { FLASH_AUTH_ROLES, requiresOperatorInvite } from "../apps/backend/src/flash-auth-policy.js";

const DRILL_URL = new URL("../data/identity-access-recovery-drill.json", import.meta.url);
const OPS_PACKET_URL = new URL("../data/identity-operations-certification-packet.json", import.meta.url);
const IDENTITY_URL = new URL("../docs/identity-provider-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_ROLES = ["reviewer", "hardware_operator", "support", "operator", "admin", "super_admin"];
const REQUIRED_DRILLS = [
  "joiner_operator_invite",
  "mover_role_change",
  "leaver_offboarding",
  "break_glass_super_admin_review",
];
const REQUIRED_COMMANDS = [
  "npm run check:identity-access-recovery",
  "npm run check:identity-operations",
  "npm run check:identity-provider",
];
const REQUIRED_BLOCKERS = [
  "identity_provider_selection",
  "provider_bound_account_recovery",
  "named_operator_roster",
  "provider_group_replay",
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
const opsPacket = JSON.parse(await readFile(OPS_PACKET_URL, "utf8"));
const identity = JSON.parse(await readFile(IDENTITY_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (drill.schemaVersion !== "gugu_identity_access_recovery_drill_v1") {
  errors.push("drill.schemaVersion must be gugu_identity_access_recovery_drill_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(drill.updatedAt || "")) errors.push("drill.updatedAt must be YYYY-MM-DD");
if (drill.status !== "draft_ready_for_real_provider_replay") {
  errors.push("drill.status must remain draft_ready_for_real_provider_replay");
}
if (drill.environment !== opsPacket.environment) errors.push("drill.environment must match identity operations environment");
if (drill.scope !== "credential_recovery_and_operator_lifecycle") {
  errors.push("drill.scope must be credential_recovery_and_operator_lifecycle");
}

const policy = drill.recoveryPolicy || {};
if (policy.accountRecoveryPolicyStatus !== "defined_pending_provider_binding") {
  errors.push("recoveryPolicy.accountRecoveryPolicyStatus must be defined_pending_provider_binding");
}
if (policy.mfaResetPolicyStatus !== "defined_pending_provider_binding") {
  errors.push("recoveryPolicy.mfaResetPolicyStatus must be defined_pending_provider_binding");
}
for (const flag of [
  "identityProofingRequired",
  "supportEscalationRequired",
  "auditTrailRequired",
  "operatorRecoveryRequiresLeadApproval",
  "superAdminRecoveryRequiresProductAndSecurityApproval",
]) {
  if (policy[flag] !== true) errors.push(`recoveryPolicy.${flag} must be true`);
}
if (!Number.isInteger(policy.maxRecoverySlaHours) || policy.maxRecoverySlaHours > 24) {
  errors.push("recoveryPolicy.maxRecoverySlaHours must be an integer <= 24");
}
for (const listName of ["customerAccountRecoverySteps", "operatorAccountRecoverySteps", "mfaResetSteps"]) {
  if (asArray(policy[listName]).length < 4) errors.push(`recoveryPolicy.${listName} must include at least 4 steps`);
}

const roleGroups = new Map(asArray(opsPacket.roleAccessReviews).map((row) => [row.role, row.providerGroup]));
const drillRows = new Map(asArray(drill.operatorLifecycleDrills).map((row) => [row.id, row]));
for (const drillId of REQUIRED_DRILLS) {
  const row = drillRows.get(drillId);
  if (!row) {
    errors.push(`operatorLifecycleDrills missing ${drillId}`);
    continue;
  }
  if (row.status !== "ready_for_provider_replay") errors.push(`operatorLifecycleDrills.${drillId}.status must be ready_for_provider_replay`);
  if (!FLASH_AUTH_ROLES.includes(row.role)) errors.push(`operatorLifecycleDrills.${drillId}.role is not in FLASH_AUTH_ROLES`);
  if (requiresOperatorInvite(row.role) !== true) errors.push(`operatorLifecycleDrills.${drillId}.role must require an operator invite`);
  if (row.providerGroup !== roleGroups.get(row.role)) {
    errors.push(`operatorLifecycleDrills.${drillId}.providerGroup must match identity operations packet`);
  }
  if (asArray(row.requiredEvidence).length < 3) errors.push(`operatorLifecycleDrills.${drillId}.requiredEvidence must include at least 3 items`);
  if (!row.trigger) errors.push(`operatorLifecycleDrills.${drillId}.trigger is required`);
  if (!row.expectedOutcome) errors.push(`operatorLifecycleDrills.${drillId}.expectedOutcome is required`);
}

for (const role of REQUIRED_ROLES) {
  if (!asArray(drill.roleCoverage).includes(role)) errors.push(`roleCoverage missing ${role}`);
}
for (const command of REQUIRED_COMMANDS) {
  if (!asArray(drill.releasePolicy?.requiredCommands).includes(command)) {
    errors.push(`releasePolicy.requiredCommands missing ${command}`);
  }
}
for (const blockerId of REQUIRED_BLOCKERS) {
  if (!asArray(drill.releasePolicy?.mustRemainInProgressUntil).includes(blockerId)) {
    errors.push(`releasePolicy.mustRemainInProgressUntil missing ${blockerId}`);
  }
}
const blockerRows = new Map(asArray(drill.externalBlockers).map((row) => [row.id, row]));
for (const blockerId of REQUIRED_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId}.status must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (asArray(blocker.exitCriteria).length < 3) errors.push(`externalBlockers.${blockerId}.exitCriteria must include at least 3 items`);
}

const artifacts = new Map(asArray(identity.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("identity_access_recovery_drill")) {
  errors.push("identity-provider-readiness.dataArtifacts missing identity_access_recovery_drill");
}
const controls = new Map(asArray(identity.codeControls).map((item) => [item.id, item]));
if (!controls.has("identity_access_recovery_gate")) {
  errors.push("identity-provider-readiness.codeControls missing identity_access_recovery_gate");
}
if (!asArray(identity.releaseCommands).includes("npm run check:identity-access-recovery")) {
  errors.push("identity-provider-readiness.releaseCommands missing npm run check:identity-access-recovery");
}

if (!(await pathExists("data/identity-access-recovery-drill.json"))) {
  errors.push("data/identity-access-recovery-drill.json must exist");
}

const realAuthItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "real_auth_session");
if (!realAuthItem) {
  errors.push("release-readiness.closed_beta missing real_auth_session");
} else {
  for (const evidence of ["data/identity-access-recovery-drill.json", "scripts/check-identity-access-recovery.mjs"]) {
    if (!asArray(realAuthItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.real_auth_session evidence missing ${evidence}`);
    }
  }
  if (realAuthItem.status !== "in_progress") {
    errors.push("real_auth_session must remain in_progress until production identity provider is configured");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Identity access recovery drill ${drill.schemaVersion}: drills=${drillRows.size}, blockers=${blockerRows.size}`);
