import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { FLASH_AUTH_ROLES, requiresOperatorInvite } from "../apps/backend/src/flash-auth-policy.js";

const PACKET_URL = new URL("../data/identity-operations-certification-packet.json", import.meta.url);
const IDENTITY_URL = new URL("../docs/identity-provider-readiness.json", import.meta.url);
const IDP_PACKET_URL = new URL("../data/identity-provider-integration-packet.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_OPERATOR_ROLES = ["reviewer", "hardware_operator", "support", "operator", "admin", "super_admin"];
const REQUIRED_COMMANDS = [
  "npm run check:identity-provider",
  "npm run check:identity-provider-packet",
  "npm run check:identity-operations",
  "npm run check:identity-access-recovery",
  "npm run check:auth-rbac",
  "node --test apps/backend/src/flash-identity-token.test.js",
];
const REQUIRED_EXTERNAL = [
  "identity_provider_selection",
  "credential_recovery_policy",
  "operator_roster_lifecycle",
  "security_privacy_review",
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
const idpPacket = JSON.parse(await readFile(IDP_PACKET_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_identity_operations_certification_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_identity_operations_certification_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_production_identity_ops") {
  errors.push("packet.status must remain draft_pending_production_identity_ops until real provider ops are complete");
}
if (packet.environment !== idpPacket.environment) errors.push("packet.environment must match identity provider packet environment");

const provider = packet.identityProvider || {};
if (provider.selectionStatus !== "pending_external") errors.push("identityProvider.selectionStatus must remain pending_external");
if (provider.audience !== "gugu-flash-api") errors.push("identityProvider.audience must be gugu-flash-api");
if (provider.tokenContract !== "gugu_flash_identity_token_v1") errors.push("identityProvider.tokenContract must be gugu_flash_identity_token_v1");
if (provider.secretSource !== "secrets_manager") errors.push("identityProvider.secretSource must be secrets_manager");
if (provider.mfaRequiredForOperators !== true) errors.push("identityProvider.mfaRequiredForOperators must be true");
if (provider.demoAuthDisabled !== true) errors.push("identityProvider.demoAuthDisabled must be true");

for (const field of ["accountRecovery", "mfaReset"]) {
  if (packet.credentialRecoveryPolicy?.[field] !== "defined_pending_provider_binding") {
    errors.push(`credentialRecoveryPolicy.${field} must be defined_pending_provider_binding`);
  }
}
if (packet.credentialRecoveryPolicy?.drillPacket !== "data/identity-access-recovery-drill.json") {
  errors.push("credentialRecoveryPolicy.drillPacket must be data/identity-access-recovery-drill.json");
}
for (const flag of [
  "supportEscalationRequired",
  "identityProofingRequired",
  "auditTrailRequired",
  "operatorRecoveryRequiresLeadApproval",
  "superAdminRecoveryRequiresProductAndSecurityApproval",
]) {
  if (packet.credentialRecoveryPolicy?.[flag] !== true) {
    errors.push(`credentialRecoveryPolicy.${flag} must be true`);
  }
}

const lifecycle = packet.operatorLifecycle || {};
if (lifecycle.namedRosterRequired !== true) errors.push("operatorLifecycle.namedRosterRequired must be true");
if (lifecycle.joinerMoverLeaverProcess !== "defined_pending_provider_replay") {
  errors.push("operatorLifecycle.joinerMoverLeaverProcess must be defined_pending_provider_replay");
}
if (lifecycle.drillPacket !== "data/identity-access-recovery-drill.json") {
  errors.push("operatorLifecycle.drillPacket must be data/identity-access-recovery-drill.json");
}
if (lifecycle.leastPrivilegeReviewCadence !== "weekly_during_beta") {
  errors.push("operatorLifecycle.leastPrivilegeReviewCadence must be weekly_during_beta");
}
if (!Number.isInteger(lifecycle.offboardingSlaHours) || lifecycle.offboardingSlaHours > 24) {
  errors.push("operatorLifecycle.offboardingSlaHours must be an integer <= 24");
}
if (lifecycle.breakGlassSuperAdminReviewRequired !== true) {
  errors.push("operatorLifecycle.breakGlassSuperAdminReviewRequired must be true");
}

const integrationMappings = new Map(asArray(idpPacket.roleGroupMapping).map((item) => [item.role, item]));
const reviewRows = new Map(asArray(packet.roleAccessReviews).map((item) => [item.role, item]));
for (const role of REQUIRED_OPERATOR_ROLES) {
  const row = reviewRows.get(role);
  const mapping = integrationMappings.get(role);
  if (!row) {
    errors.push(`roleAccessReviews missing ${role}`);
    continue;
  }
  if (!FLASH_AUTH_ROLES.includes(role)) errors.push(`roleAccessReviews.${role} is not in FLASH_AUTH_ROLES`);
  if (!mapping) errors.push(`identity provider roleGroupMapping missing ${role}`);
  if (row.providerGroup !== mapping?.providerGroup) errors.push(`roleAccessReviews.${role}.providerGroup must match integration packet`);
  if (row.requiresOperatorInvite !== requiresOperatorInvite(role)) {
    errors.push(`roleAccessReviews.${role}.requiresOperatorInvite must match auth policy`);
  }
  if (row.reviewCadence !== "weekly_during_beta") {
    errors.push(`roleAccessReviews.${role}.reviewCadence must be weekly_during_beta`);
  }
}
if (reviewRows.get("super_admin")?.breakGlass !== true) errors.push("super_admin roleAccessReviews must mark breakGlass=true");

const session = packet.sessionReleasePolicy || {};
if (session.requireAuthEnv !== "GUGU_FLASH_REQUIRE_AUTH=1") errors.push("sessionReleasePolicy.requireAuthEnv must be GUGU_FLASH_REQUIRE_AUTH=1");
if (session.allowDemoAuthEnv !== "GUGU_FLASH_ALLOW_DEMO_AUTH=0") errors.push("sessionReleasePolicy.allowDemoAuthEnv must be GUGU_FLASH_ALLOW_DEMO_AUTH=0");
for (const flag of [
  "operatorInviteSecretRequired",
  "refreshRotationRequired",
  "revokedTokenRejectionRequired",
  "signedExternalIdentityRequired",
]) {
  if (session[flag] !== true) errors.push(`sessionReleasePolicy.${flag} must be true`);
}
if (!Number.isInteger(session.accessTokenTtlMinutesMax) || session.accessTokenTtlMinutesMax > 30) {
  errors.push("sessionReleasePolicy.accessTokenTtlMinutesMax must be an integer <= 30");
}

for (const field of ["providerLogsReviewed", "retentionPolicyReviewed", "privacyNoticeUpdated", "securitySignoff"]) {
  if (packet.privacySecurityReview?.[field] !== "pending_external") {
    errors.push(`privacySecurityReview.${field} must remain pending_external`);
  }
}
if (packet.privacySecurityReview?.incidentResponseLinked !== true) {
  errors.push("privacySecurityReview.incidentResponseLinked must be true");
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
const identityExternal = new Set(asArray(identity.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId}.exitCriteria is required`);
  if (!identityExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from identity externalAcceptance`);
}

const artifacts = new Map(asArray(identity.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("identity_operations_certification_packet")) {
  errors.push("identity-provider-readiness.dataArtifacts missing identity_operations_certification_packet");
}
const controls = new Map(asArray(identity.codeControls).map((item) => [item.id, item]));
if (!controls.has("identity_operations_gate")) {
  errors.push("identity-provider-readiness.codeControls missing identity_operations_gate");
}
if (!asArray(identity.releaseCommands).includes("npm run check:identity-operations")) {
  errors.push("identity-provider-readiness.releaseCommands missing npm run check:identity-operations");
}
if (!(await pathExists("data/identity-operations-certification-packet.json"))) {
  errors.push("data/identity-operations-certification-packet.json must exist");
}

const realAuthItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "real_auth_session");
if (!realAuthItem) {
  errors.push("release-readiness.closed_beta missing real_auth_session");
} else {
  for (const evidence of ["data/identity-operations-certification-packet.json", "scripts/check-identity-operations.mjs"]) {
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

console.log(`Identity operations gate ${packet.schemaVersion}: roles=${reviewRows.size}, blockers=${blockerRows.size}`);
