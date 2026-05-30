import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ASSETS_URL = new URL("../data/native-store-assets-packet.json", import.meta.url);
const APP_RELEASE_URL = new URL("../data/app-release-packet.json", import.meta.url);
const NATIVE_CERT_URL = new URL("../data/native-build-certification-packet.json", import.meta.url);
const DISTRIBUTION_URL = new URL("../docs/app-distribution-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const PACKAGE_URL = new URL("../package.json", import.meta.url);

const REQUIRED_SCREENSHOTS = ["feed", "creator", "store", "device_dashboard", "support_or_settings"];
const REQUIRED_PERMISSIONS = ["bluetooth", "notifications", "photo_media", "camera"];
const REQUIRED_PRIVACY_LABELS = ["account_identity", "user_generated_content", "device_sync_diagnostics", "commerce_records"];
const REQUIRED_EXTERNAL = [
  "apple_developer_access",
  "google_play_console_access",
  "native_shell_build",
  "store_review_packet",
  "release_manager_signoff",
];
const REQUIRED_COMMANDS = [
  "npm run check:app-distribution",
  "npm run check:app-release-packet",
  "npm run check:native-build-certification",
  "npm run check:native-store-assets",
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

const assets = JSON.parse(await readFile(ASSETS_URL, "utf8"));
const appRelease = JSON.parse(await readFile(APP_RELEASE_URL, "utf8"));
const nativeCert = JSON.parse(await readFile(NATIVE_CERT_URL, "utf8"));
const distribution = JSON.parse(await readFile(DISTRIBUTION_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const pkg = JSON.parse(await readFile(PACKAGE_URL, "utf8"));
const errors = [];

if (assets.schemaVersion !== "gugu_native_store_assets_packet_v1") {
  errors.push("assets.schemaVersion must be gugu_native_store_assets_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(assets.updatedAt || "")) errors.push("assets.updatedAt must be YYYY-MM-DD");
if (assets.status !== "draft_ready_for_final_store_asset_capture") {
  errors.push("assets.status must remain draft_ready_for_final_store_asset_capture");
}
if (assets.releaseCandidate !== appRelease.releaseName) errors.push("assets.releaseCandidate must match app release packet");

const identity = assets.appIdentity || {};
if (identity.appName !== appRelease.app?.name) errors.push("appIdentity.appName must match app release packet");
if (identity.bundleId !== appRelease.app?.bundleId) errors.push("appIdentity.bundleId must match app release packet");
if (identity.androidPackage !== appRelease.app?.androidPackage) errors.push("appIdentity.androidPackage must match app release packet");
if (identity.versionName !== pkg.version) errors.push(`appIdentity.versionName must match package.json version ${pkg.version}`);
if (identity.releaseMode !== "free_only_until_payment_approval") errors.push("appIdentity.releaseMode must disable paid checkout");

const copy = assets.storeListingCopy || {};
if (copy.subtitle !== appRelease.storeReview?.subtitle) errors.push("storeListingCopy.subtitle must match app release packet");
if (!copy.shortDescription) errors.push("storeListingCopy.shortDescription is required");
if (copy.paidContentCopy !== "disabled_until_payment_provider_approval") {
  errors.push("storeListingCopy.paidContentCopy must be disabled_until_payment_provider_approval");
}
for (const flag of ["ugcModerationDisclosure", "rightsClaimDisclosure", "refundSupportDisclosure", "deviceScopedEntitlementDisclosure"]) {
  if (copy[flag] !== true) errors.push(`storeListingCopy.${flag} must be true`);
}

const screenshots = new Map(asArray(assets.screenshots).map((item) => [item.id, item]));
for (const screenshotId of REQUIRED_SCREENSHOTS) {
  const row = screenshots.get(screenshotId);
  if (!row) {
    errors.push(`screenshots missing ${screenshotId}`);
    continue;
  }
  if (!asArray(appRelease.storeReview?.requiredScreenshots).includes(screenshotId)) {
    errors.push(`screenshots.${screenshotId} missing from app release packet required screenshots`);
  }
  if (!asArray(nativeCert.storeSubmissionMaterials?.requiredScreenshots).includes(screenshotId)) {
    errors.push(`screenshots.${screenshotId} missing from native certification required screenshots`);
  }
  if (!row.surface) errors.push(`screenshots.${screenshotId}.surface is required`);
  if (!row.requiredState) errors.push(`screenshots.${screenshotId}.requiredState is required`);
  if (row.captureStatus !== "pending_final_native_capture") {
    errors.push(`screenshots.${screenshotId}.captureStatus must remain pending_final_native_capture`);
  }
}

const privacyLabels = new Map(asArray(assets.privacyLabels).map((item) => [item.id, item]));
for (const labelId of REQUIRED_PRIVACY_LABELS) {
  const label = privacyLabels.get(labelId);
  if (!label) {
    errors.push(`privacyLabels missing ${labelId}`);
    continue;
  }
  if (!asArray(label.dataTypes).length) errors.push(`privacyLabels.${labelId}.dataTypes is required`);
  if (!label.purpose) errors.push(`privacyLabels.${labelId}.purpose is required`);
  if (label.linkedToUser !== true) errors.push(`privacyLabels.${labelId}.linkedToUser must be true`);
  if (label.tracking !== false) errors.push(`privacyLabels.${labelId}.tracking must be false`);
}

const permissionRows = new Map(asArray(assets.permissionRationales).map((item) => [item.id, item]));
const appPermissions = new Map(asArray(appRelease.permissions).map((item) => [item.id, item]));
const nativePermissions = new Map(asArray(nativeCert.permissionsAndPrivacy).map((item) => [item.id, item]));
for (const permissionId of REQUIRED_PERMISSIONS) {
  const row = permissionRows.get(permissionId);
  if (!row) {
    errors.push(`permissionRationales missing ${permissionId}`);
    continue;
  }
  if (!appPermissions.has(permissionId)) errors.push(`permissionRationales.${permissionId} missing from app release permissions`);
  if (!nativePermissions.has(permissionId)) errors.push(`permissionRationales.${permissionId} missing from native certification permissions`);
  if (row.storeDisclosureRequired !== true) errors.push(`permissionRationales.${permissionId}.storeDisclosureRequired must be true`);
  if (!asArray(row.platforms).includes("ios") || !asArray(row.platforms).includes("android")) {
    errors.push(`permissionRationales.${permissionId}.platforms must include ios and android`);
  }
  if (!row.userFacingCopy) errors.push(`permissionRationales.${permissionId}.userFacingCopy is required`);
}

const links = assets.linksAndContacts || {};
if (links.supportContact !== appRelease.storeReview?.supportContact) errors.push("linksAndContacts.supportContact must match app release packet");
if (links.privacyPolicyUrl !== appRelease.storeReview?.privacyPolicyUrl) errors.push("linksAndContacts.privacyPolicyUrl must match app release packet");
if (links.termsUrl !== appRelease.storeReview?.termsUrl) errors.push("linksAndContacts.termsUrl must match app release packet");
for (const path of [links.legalDraft, links.supportPlaybook]) {
  if (!(await pathExists(path || ""))) errors.push(`linksAndContacts file missing: ${path}`);
}

if (assets.reviewNotes?.paidCheckout !== "disabled_until_payment_provider_approval") {
  errors.push("reviewNotes.paidCheckout must document disabled paid checkout");
}
for (const field of ["ugcModeration", "hardwareSync", "betaDisclosure"]) {
  if (!assets.reviewNotes?.[field]) errors.push(`reviewNotes.${field} is required`);
}

for (const command of REQUIRED_COMMANDS) {
  if (!asArray(assets.releasePolicy?.requiredCommands).includes(command)) {
    errors.push(`releasePolicy.requiredCommands missing ${command}`);
  }
}
for (const blockerId of REQUIRED_EXTERNAL) {
  if (!asArray(assets.releasePolicy?.mustRemainInProgressUntil).includes(blockerId)) {
    errors.push(`releasePolicy.mustRemainInProgressUntil missing ${blockerId}`);
  }
}

const blockerRows = new Map(asArray(assets.externalBlockers).map((item) => [item.id, item]));
const releaseBlockers = new Set(asArray(appRelease.externalBlockers).map((item) => item.id));
const nativeBlockers = new Set(asArray(nativeCert.externalBlockers).map((item) => item.id));
const distributionExternal = new Set(asArray(distribution.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId}.status must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (asArray(blocker.exitCriteria).length < 3) errors.push(`externalBlockers.${blockerId}.exitCriteria must include at least 3 items`);
  if (!releaseBlockers.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from app release packet`);
  if (!nativeBlockers.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from native certification packet`);
  if (!distributionExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from app distribution readiness`);
}

const artifacts = new Map(asArray(distribution.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("native_store_assets_packet")) {
  errors.push("app-distribution-readiness.dataArtifacts missing native_store_assets_packet");
}
const controls = new Map(asArray(distribution.codeControls).map((item) => [item.id, item]));
if (!controls.has("native_store_assets_gate")) {
  errors.push("app-distribution-readiness.codeControls missing native_store_assets_gate");
}
if (!asArray(distribution.releaseCommands).includes("npm run check:native-store-assets")) {
  errors.push("app-distribution-readiness.releaseCommands missing npm run check:native-store-assets");
}
if (!(await pathExists("data/native-store-assets-packet.json"))) {
  errors.push("data/native-store-assets-packet.json must exist");
}

const appDistribution = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "app_distribution");
if (!appDistribution) {
  errors.push("release-readiness.public_mvp missing app_distribution");
} else {
  for (const evidence of ["data/native-store-assets-packet.json", "scripts/check-native-store-assets.mjs"]) {
    if (!asArray(appDistribution.evidence).includes(evidence)) {
      errors.push(`release-readiness.app_distribution evidence missing ${evidence}`);
    }
  }
  if (appDistribution.status !== "in_progress") {
    errors.push("app_distribution must remain in_progress until signed native builds and store assets are complete");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Native store assets gate ${assets.schemaVersion}: screenshots=${screenshots.size}, privacyLabels=${privacyLabels.size}, permissions=${permissionRows.size}, blockers=${blockerRows.size}`);
