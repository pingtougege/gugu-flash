import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { FLASH_AUTH_ROLES, requiresOperatorInvite } from "../apps/backend/src/flash-auth-policy.js";

const PACKET_URL = new URL("../data/identity-provider-integration-packet.json", import.meta.url);
const IDENTITY_URL = new URL("../docs/identity-provider-readiness.json", import.meta.url);
const AUTH_URL = new URL("../docs/auth-rbac-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_EXTERNAL_BLOCKERS = [
  "identity_provider_selection",
  "credential_recovery_policy",
  "operator_roster_lifecycle",
  "security_privacy_review",
];
const REQUIRED_ACCEPTANCE_CHECKS = [
  "valid_external_identity_token",
  "wrong_audience_rejected",
  "expired_token_rejected",
  "demo_auth_disabled_in_required_mode",
  "operator_roster_lifecycle",
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
const identity = JSON.parse(await readFile(IDENTITY_URL, "utf8"));
const auth = JSON.parse(await readFile(AUTH_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_identity_provider_integration_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_identity_provider_integration_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_real_identity_provider") {
  errors.push("packet.status must remain draft_pending_real_identity_provider until provider work is complete");
}
if (packet.tokenContract !== "gugu_flash_identity_token_v1") errors.push("packet.tokenContract must be gugu_flash_identity_token_v1");
if (packet.environment !== "closed_beta_production_auth") errors.push("packet.environment must be closed_beta_production_auth");

const provider = packet.provider || {};
if (provider.selectionStatus !== "pending_external") errors.push("provider.selectionStatus must remain pending_external");
if (provider.audience !== "gugu-flash-api") errors.push("provider.audience must be gugu-flash-api");
if (provider.jwksOrSharedSecretSource !== "secrets_manager") errors.push("provider.jwksOrSharedSecretSource must be secrets_manager");
if (provider.mfaRequiredForOperators !== true) errors.push("provider.mfaRequiredForOperators must be true");
if (provider.demoAuthDisabled !== true) errors.push("provider.demoAuthDisabled must be true");
for (const field of ["providerName", "issuer"]) {
  if (!provider[field]) errors.push(`provider.${field} is required`);
}

for (const claim of asArray(identity.requiredClaims)) {
  if (!asArray(packet.requiredClaims).includes(claim)) errors.push(`packet.requiredClaims missing identity readiness claim ${claim}`);
}

const roles = new Set(asArray(auth.requiredRoles));
const mappingRows = new Map(asArray(packet.roleGroupMapping).map((item) => [item.role, item]));
for (const role of roles) {
  const row = mappingRows.get(role);
  if (!row) {
    errors.push(`roleGroupMapping missing ${role}`);
    continue;
  }
  if (!FLASH_AUTH_ROLES.includes(role)) errors.push(`roleGroupMapping.${role} is not in FLASH_AUTH_ROLES`);
  if (!row.providerGroup) errors.push(`roleGroupMapping.${role}.providerGroup is required`);
  if (row.status !== "pending_external") errors.push(`roleGroupMapping.${role}.status must remain pending_external`);
  if (row.requiresOperatorInvite !== requiresOperatorInvite(role)) {
    errors.push(`roleGroupMapping.${role}.requiresOperatorInvite must match auth policy`);
  }
}

const sessionPolicy = packet.sessionPolicy || {};
if (sessionPolicy.requireAuthEnv !== "GUGU_FLASH_REQUIRE_AUTH=1") errors.push("sessionPolicy.requireAuthEnv must be GUGU_FLASH_REQUIRE_AUTH=1");
if (sessionPolicy.allowDemoAuthEnv !== "GUGU_FLASH_ALLOW_DEMO_AUTH=0") errors.push("sessionPolicy.allowDemoAuthEnv must be GUGU_FLASH_ALLOW_DEMO_AUTH=0");
if (sessionPolicy.operatorInviteSecretRequired !== true) errors.push("sessionPolicy.operatorInviteSecretRequired must be true");
if (sessionPolicy.refreshRotationRequired !== true) errors.push("sessionPolicy.refreshRotationRequired must be true");
if (sessionPolicy.revokedTokenRejectionRequired !== true) errors.push("sessionPolicy.revokedTokenRejectionRequired must be true");
if (!Number.isInteger(sessionPolicy.accessTokenTtlMinutes) || sessionPolicy.accessTokenTtlMinutes > 60) {
  errors.push("sessionPolicy.accessTokenTtlMinutes must be an integer <= 60");
}

for (const field of ["accountRecovery", "mfaReset"]) {
  if (packet.credentialRecovery?.[field] !== "defined_pending_provider_binding") {
    errors.push(`credentialRecovery.${field} must be defined_pending_provider_binding`);
  }
}
if (packet.credentialRecovery?.drillPacket !== "data/identity-access-recovery-drill.json") {
  errors.push("credentialRecovery.drillPacket must be data/identity-access-recovery-drill.json");
}
for (const flag of ["supportEscalationRequired", "identityProofingRequired", "auditTrailRequired"]) {
  if (packet.credentialRecovery?.[flag] !== true) errors.push(`credentialRecovery.${flag} must be true`);
}

if (packet.operatorLifecycle?.joinerMoverLeaverProcess !== "defined_pending_provider_replay") {
  errors.push("operatorLifecycle.joinerMoverLeaverProcess must be defined_pending_provider_replay");
}
if (packet.operatorLifecycle?.drillPacket !== "data/identity-access-recovery-drill.json") {
  errors.push("operatorLifecycle.drillPacket must be data/identity-access-recovery-drill.json");
}
if (packet.operatorLifecycle?.namedRosterRequired !== true) errors.push("operatorLifecycle.namedRosterRequired must be true");
if (packet.operatorLifecycle?.leastPrivilegeReviewCadence !== "weekly_during_beta") {
  errors.push("operatorLifecycle.leastPrivilegeReviewCadence must be weekly_during_beta");
}
if (!Number.isInteger(packet.operatorLifecycle?.offboardingSlaHours) || packet.operatorLifecycle.offboardingSlaHours > 24) {
  errors.push("operatorLifecycle.offboardingSlaHours must be an integer <= 24");
}
if (packet.operatorLifecycle?.breakGlassSuperAdminReviewRequired !== true) {
  errors.push("operatorLifecycle.breakGlassSuperAdminReviewRequired must be true");
}

for (const field of ["providerLogsReviewed", "retentionPolicyReviewed", "privacyNoticeUpdated", "securitySignoff"]) {
  if (packet.privacySecurityReview?.[field] !== "pending_external") {
    errors.push(`privacySecurityReview.${field} must remain pending_external`);
  }
}
if (packet.privacySecurityReview?.incidentResponseLinked !== true) {
  errors.push("privacySecurityReview.incidentResponseLinked must be true");
}

const acceptanceRows = new Map(asArray(packet.acceptanceChecks).map((item) => [item.id, item]));
for (const checkId of REQUIRED_ACCEPTANCE_CHECKS) {
  const check = acceptanceRows.get(checkId);
  if (!check) {
    errors.push(`acceptanceChecks missing ${checkId}`);
    continue;
  }
  if (!["ready_for_provider", "ready_for_provider_replay", "pending_external"].includes(check.status)) {
    errors.push(`acceptanceChecks.${checkId}.status is invalid`);
  }
  for (const evidence of asArray(check.evidence)) {
    if (!(await pathExists(evidence))) errors.push(`acceptanceChecks.${checkId}.evidence missing: ${evidence}`);
  }
}
if (acceptanceRows.get("operator_roster_lifecycle")?.status !== "ready_for_provider_replay") {
  errors.push("acceptanceChecks.operator_roster_lifecycle must be ready_for_provider_replay");
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
const identityExternal = new Set(asArray(identity.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
  if (!identityExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from identity externalAcceptance`);
}

const identityArtifacts = new Map(asArray(identity.dataArtifacts).map((item) => [item.id, item]));
if (!identityArtifacts.has("identity_provider_integration_packet")) {
  errors.push("identity-provider-readiness.dataArtifacts missing identity_provider_integration_packet");
}
const identityControls = new Map(asArray(identity.codeControls).map((item) => [item.id, item]));
if (!identityControls.has("identity_provider_packet_gate")) {
  errors.push("identity-provider-readiness.codeControls missing identity_provider_packet_gate");
}
if (!asArray(identity.releaseCommands).includes("npm run check:identity-provider-packet")) {
  errors.push("identity-provider-readiness.releaseCommands missing npm run check:identity-provider-packet");
}
if (!(await pathExists("data/identity-provider-integration-packet.json"))) {
  errors.push("data/identity-provider-integration-packet.json must exist");
}

const realAuthItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "real_auth_session");
if (!realAuthItem) {
  errors.push("release-readiness.closed_beta missing real_auth_session");
} else {
  for (const evidence of ["data/identity-provider-integration-packet.json", "scripts/check-identity-provider-packet.mjs"]) {
    if (!asArray(realAuthItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.real_auth_session evidence missing ${evidence}`);
    }
  }
  if (realAuthItem.status !== "in_progress") {
    errors.push("real_auth_session must remain in_progress until real identity provider is configured");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Identity provider packet gate ${packet.schemaVersion}: roles=${mappingRows.size}, claims=${asArray(packet.requiredClaims).length}, blockers=${blockerRows.size}`);
