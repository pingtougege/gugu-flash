import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { GUGU_FLASH_CLIENT_TARGETS } from "../packages/core/src/index.js";

const PACKET_URL = new URL("../data/native-build-certification-packet.json", import.meta.url);
const APP_RELEASE_URL = new URL("../data/app-release-packet.json", import.meta.url);
const DISTRIBUTION_URL = new URL("../docs/app-distribution-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const PACKAGE_URL = new URL("../package.json", import.meta.url);

const REQUIRED_TARGETS = ["ios_testflight_internal", "android_internal_testing", "web_h5_fallback"];
const REQUIRED_PERMISSIONS = ["bluetooth", "notifications", "photo_media", "camera"];
const REQUIRED_SCREENSHOTS = ["feed", "creator", "store", "device_dashboard", "support_or_settings"];
const REQUIRED_SMOKE = [
  "login_session",
  "feed_load",
  "create_original_h5",
  "store_claim_or_purchase",
  "device_dashboard",
  "device_sync_handoff",
  "support_diagnostics",
  "legal_links",
];
const REQUIRED_SIGNOFF = ["product", "qa", "legal", "support", "nativeLead", "releaseManager"];
const REQUIRED_EXTERNAL_BLOCKERS = [
  "apple_developer_access",
  "google_play_console_access",
  "native_shell_build",
  "store_review_packet",
  "release_manager_signoff",
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
const appRelease = JSON.parse(await readFile(APP_RELEASE_URL, "utf8"));
const distribution = JSON.parse(await readFile(DISTRIBUTION_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const pkg = JSON.parse(await readFile(PACKAGE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_native_build_certification_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_native_build_certification_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_signed_native_builds") {
  errors.push("packet.status must remain draft_pending_signed_native_builds until signed builds exist");
}

const candidate = packet.releaseCandidate || {};
if (candidate.versionName !== pkg.version) errors.push(`releaseCandidate.versionName must match package.json version ${pkg.version}`);
if (candidate.versionName !== appRelease.versionName) errors.push("releaseCandidate.versionName must match app release packet");
if (candidate.buildNumber !== appRelease.buildNumber) errors.push("releaseCandidate.buildNumber must match app release packet");
if (candidate.releaseMode !== "free_only_until_payment_approval") errors.push("releaseCandidate.releaseMode must disable paid checkout");
if (candidate.apiBaseUrl !== "pending_production_api") errors.push("releaseCandidate.apiBaseUrl must remain pending_production_api");

const targetRows = new Map(asArray(packet.buildTargets).map((item) => [item.id, item]));
const appChannels = new Map(asArray(appRelease.channels).map((item) => [item.id, item]));
for (const targetId of REQUIRED_TARGETS) {
  const target = targetRows.get(targetId);
  const channel = appChannels.get(targetId);
  if (!target) {
    errors.push(`buildTargets missing ${targetId}`);
    continue;
  }
  if (!channel) errors.push(`app release channels missing ${targetId}`);
  if (target.platform !== channel?.platform) errors.push(`buildTargets.${targetId}.platform must match app release channel`);
  if (!target.artifact) errors.push(`buildTargets.${targetId}.artifact is required`);
  if (!asArray(target.requiredEvidence).length) errors.push(`buildTargets.${targetId}.requiredEvidence is required`);
  if (targetId !== "web_h5_fallback" && target.status !== "pending_external") {
    errors.push(`buildTargets.${targetId}.status must remain pending_external until signed build exists`);
  }
}
if (targetRows.get("ios_testflight_internal")?.bundleId !== appRelease.app?.bundleId) {
  errors.push("ios_testflight_internal.bundleId must match app release packet");
}
if (targetRows.get("android_internal_testing")?.packageName !== appRelease.app?.androidPackage) {
  errors.push("android_internal_testing.packageName must match app release packet");
}

const runtime = packet.sharedRuntimeContract || {};
if (!(await pathExists(runtime.corePackage || ""))) errors.push("sharedRuntimeContract.corePackage must exist");
if (!(await pathExists(runtime.apiClientPackage || ""))) errors.push("sharedRuntimeContract.apiClientPackage must exist");
for (const target of ["web", "native"]) {
  if (!asArray(runtime.requiredTargets).includes(target)) errors.push(`sharedRuntimeContract.requiredTargets missing ${target}`);
  if (!GUGU_FLASH_CLIENT_TARGETS.includes(target)) errors.push(`GUGU_FLASH_CLIENT_TARGETS missing ${target}`);
}
for (const [flag, expected] of Object.entries({
  paidCheckout: false,
  paidContentEnabled: false,
  demoAuthEnabled: false,
  hardwareSync: true,
  externalIdentityProvider: true,
})) {
  if (runtime.requiredFeatureFlags?.[flag] !== expected) {
    errors.push(`sharedRuntimeContract.requiredFeatureFlags.${flag} must be ${expected}`);
  }
  if (appRelease.featureFlags?.[flag] !== expected) {
    errors.push(`appRelease.featureFlags.${flag} must be ${expected}`);
  }
}

const permissionRows = new Map(asArray(packet.permissionsAndPrivacy).map((item) => [item.id, item]));
const appPermissions = new Map(asArray(appRelease.permissions).map((item) => [item.id, item]));
for (const permissionId of REQUIRED_PERMISSIONS) {
  const permission = permissionRows.get(permissionId);
  if (!permission) {
    errors.push(`permissionsAndPrivacy missing ${permissionId}`);
    continue;
  }
  if (!appPermissions.has(permissionId)) errors.push(`app release permissions missing ${permissionId}`);
  if (permission.storeDisclosureRequired !== true) errors.push(`permissionsAndPrivacy.${permissionId}.storeDisclosureRequired must be true`);
  if (!asArray(permission.platforms).includes("ios") || !asArray(permission.platforms).includes("android")) {
    errors.push(`permissionsAndPrivacy.${permissionId}.platforms must include ios and android`);
  }
  if (!permission.rationale) errors.push(`permissionsAndPrivacy.${permissionId}.rationale is required`);
}

const store = packet.storeSubmissionMaterials || {};
if (store.supportContact !== appRelease.storeReview?.supportContact) errors.push("storeSubmissionMaterials.supportContact must match app release packet");
if (store.privacyPolicyUrl !== appRelease.storeReview?.privacyPolicyUrl) errors.push("storeSubmissionMaterials.privacyPolicyUrl must match app release packet");
if (store.termsUrl !== appRelease.storeReview?.termsUrl) errors.push("storeSubmissionMaterials.termsUrl must match app release packet");
if (store.paidContentCopy !== "disabled_until_payment_provider_approval") errors.push("storeSubmissionMaterials.paidContentCopy must disable paid content copy");
for (const flag of ["ugcModerationDisclosure", "rightsClaimDisclosure", "refundSupportDisclosure"]) {
  if (store[flag] !== true) errors.push(`storeSubmissionMaterials.${flag} must be true`);
}
for (const screenshot of REQUIRED_SCREENSHOTS) {
  if (!asArray(store.requiredScreenshots).includes(screenshot)) {
    errors.push(`storeSubmissionMaterials.requiredScreenshots missing ${screenshot}`);
  }
}
for (const asset of ["app_icon", "release_notes", "privacy_labels"]) {
  if (!asArray(store.requiredAssets).includes(asset)) errors.push(`storeSubmissionMaterials.requiredAssets missing ${asset}`);
}

const smokeRows = new Map(asArray(packet.nativeSmokeScenarios).map((item) => [item.id, item]));
for (const smokeId of REQUIRED_SMOKE) {
  const row = smokeRows.get(smokeId);
  if (!row) {
    errors.push(`nativeSmokeScenarios missing ${smokeId}`);
    continue;
  }
  if (!asArray(appRelease.qaSmoke).includes(smokeId)) errors.push(`appRelease.qaSmoke missing ${smokeId}`);
  if (!row.surface) errors.push(`nativeSmokeScenarios.${smokeId}.surface is required`);
  if (!asArray(row.requiredEvidence).length) errors.push(`nativeSmokeScenarios.${smokeId}.requiredEvidence is required`);
}

for (const role of REQUIRED_SIGNOFF) {
  if (packet.releaseSignoff?.[role] !== "pending_external") {
    errors.push(`releaseSignoff.${role} must remain pending_external`);
  }
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
const distributionExternal = new Set(asArray(distribution.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId}.exitCriteria is required`);
  if (!distributionExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from distribution externalAcceptance`);
}

const artifacts = new Map(asArray(distribution.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("native_build_certification_packet")) {
  errors.push("app-distribution-readiness.dataArtifacts missing native_build_certification_packet");
}
const controls = new Map(asArray(distribution.codeControls).map((item) => [item.id, item]));
if (!controls.has("native_build_certification_gate")) {
  errors.push("app-distribution-readiness.codeControls missing native_build_certification_gate");
}
if (!asArray(distribution.releaseCommands).includes("npm run check:native-build-certification")) {
  errors.push("app-distribution-readiness.releaseCommands missing npm run check:native-build-certification");
}
if (!(await pathExists("data/native-build-certification-packet.json"))) {
  errors.push("data/native-build-certification-packet.json must exist");
}

const appDistribution = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "app_distribution");
if (!appDistribution) {
  errors.push("release-readiness.public_mvp missing app_distribution");
} else {
  for (const evidence of ["data/native-build-certification-packet.json", "scripts/check-native-build-certification.mjs"]) {
    if (!asArray(appDistribution.evidence).includes(evidence)) {
      errors.push(`release-readiness.app_distribution evidence missing ${evidence}`);
    }
  }
  if (appDistribution.status !== "in_progress") {
    errors.push("app_distribution must remain in_progress until signed native builds exist");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Native build certification gate ${packet.schemaVersion}: targets=${targetRows.size}, permissions=${permissionRows.size}, smoke=${smokeRows.size}, blockers=${blockerRows.size}`);
