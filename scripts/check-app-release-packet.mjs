import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { GUGU_FLASH_CLIENT_TARGETS } from "../packages/core/src/index.js";

const PACKET_URL = new URL("../data/app-release-packet.json", import.meta.url);
const DISTRIBUTION_URL = new URL("../docs/app-distribution-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const PAYMENT_URL = new URL("../docs/payment-provider-readiness.json", import.meta.url);
const PACKAGE_URL = new URL("../package.json", import.meta.url);

const REQUIRED_CHANNELS = ["ios_testflight_internal", "android_internal_testing", "web_h5_fallback"];
const REQUIRED_SCREENSHOTS = ["feed", "creator", "store", "device_dashboard", "support_or_settings"];
const REQUIRED_PERMISSIONS = ["bluetooth", "notifications", "photo_media", "camera"];
const REQUIRED_EXTERNAL_BLOCKERS = [
  "apple_developer_access",
  "google_play_console_access",
  "native_shell_build",
  "store_review_packet",
  "release_manager_signoff",
];
const REQUIRED_SMOKE = [
  "login_session",
  "feed_load",
  "create_original_h5",
  "store_claim_or_purchase",
  "device_dashboard",
  "device_sync_handoff",
  "support_diagnostics",
  "legal_links",
  "support_legal_links",
];
const REQUIRED_SIGNOFF = ["product", "qa", "legal", "support", "releaseManager"];

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
const distribution = JSON.parse(await readFile(DISTRIBUTION_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const payment = JSON.parse(await readFile(PAYMENT_URL, "utf8"));
const pkg = JSON.parse(await readFile(PACKAGE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_app_release_packet_v1") errors.push("packet.schemaVersion must be gugu_app_release_packet_v1");
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (!packet.releaseName) errors.push("packet.releaseName is required");
if (!packet.versionName) errors.push("packet.versionName is required");
if (!packet.buildNumber) errors.push("packet.buildNumber is required");
if (packet.versionName !== pkg.version) errors.push(`packet.versionName must match package.json version ${pkg.version}`);
if (packet.releaseMode !== "free_only_until_payment_approval") errors.push("packet.releaseMode must disable paid checkout until payment approval");
if (packet.gitRevisionRequired !== true) errors.push("packet.gitRevisionRequired must be true");

const app = packet.app || {};
for (const field of ["name", "bundleId", "androidPackage", "versionName", "versionCode", "buildNumber", "apiBaseUrl"]) {
  if (app[field] === undefined || app[field] === "") errors.push(`packet.app.${field} is required`);
}
if (app.name !== "Gugu Flash") errors.push("packet.app.name must be Gugu Flash");
if (app.versionName !== packet.versionName) errors.push("packet.app.versionName must match packet.versionName");
if (!Number.isInteger(app.versionCode) || app.versionCode < 1) errors.push("packet.app.versionCode must be a positive integer");
if (app.apiBaseUrl !== "pending_production_api") errors.push("packet.app.apiBaseUrl must remain pending_production_api until production API hosting exists");
for (const [field, value] of [["bundleId", app.bundleId], ["androidPackage", app.androidPackage]]) {
  if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(value || "")) {
    errors.push(`packet.app.${field} must be a reverse-DNS identifier`);
  }
}

if (!(await pathExists(packet.api?.contract || ""))) errors.push("packet.api.contract must point to an existing API contract");
for (const target of ["native", "web"]) {
  if (!asArray(packet.api?.targets).includes(target)) errors.push(`packet.api.targets missing ${target}`);
  if (!GUGU_FLASH_CLIENT_TARGETS.includes(target)) errors.push(`GUGU_FLASH_CLIENT_TARGETS missing ${target}`);
}
if (packet.api?.requiresProductionBaseUrl !== true) errors.push("packet.api.requiresProductionBaseUrl must be true");

const channels = new Map(asArray(packet.channels).map((item) => [item.id, item]));
for (const channelId of REQUIRED_CHANNELS) {
  const channel = channels.get(channelId);
  if (!channel) {
    errors.push(`channels missing ${channelId}`);
    continue;
  }
  if (!channel.platform) errors.push(`${channelId}: missing platform`);
  if (!channel.status) errors.push(`${channelId}: missing status`);
  if (!asArray(channel.requiredArtifacts).length) errors.push(`${channelId}: missing requiredArtifacts`);
}

const store = packet.storeReview || {};
for (const field of ["appName", "subtitle", "supportContact", "privacyPolicyUrl", "termsUrl"]) {
  if (!store[field]) errors.push(`storeReview.${field} is required`);
}
if (store.appName !== app.name) errors.push("storeReview.appName must match packet.app.name");
if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(store.supportContact || "")) {
  errors.push("storeReview.supportContact must be an email address");
}
for (const urlField of ["privacyPolicyUrl", "termsUrl"]) {
  if (!/^https:\/\//.test(store[urlField] || "")) errors.push(`storeReview.${urlField} must be an HTTPS URL`);
}
if (store.paidContentCopy !== "disabled_until_payment_provider_approval") {
  errors.push("storeReview.paidContentCopy must be disabled_until_payment_provider_approval");
}
for (const flag of ["ugcModerationDisclosure", "rightsClaimDisclosure", "refundSupportDisclosure"]) {
  if (store[flag] !== true) errors.push(`storeReview.${flag} must be true`);
}
for (const screenshot of REQUIRED_SCREENSHOTS) {
  if (!asArray(store.requiredScreenshots).includes(screenshot)) errors.push(`storeReview.requiredScreenshots missing ${screenshot}`);
}

const permissions = new Map(asArray(packet.permissions).map((item) => [item.id, item]));
for (const permissionId of REQUIRED_PERMISSIONS) {
  const permission = permissions.get(permissionId);
  if (!permission) {
    errors.push(`permissions missing ${permissionId}`);
    continue;
  }
  if (!asArray(permission.platforms).includes("ios") || !asArray(permission.platforms).includes("android")) {
    errors.push(`permissions.${permissionId}: must cover ios and android`);
  }
  if (!permission.rationale) errors.push(`permissions.${permissionId}: missing rationale`);
}

if (packet.featureFlags?.paidCheckout !== false) errors.push("featureFlags.paidCheckout must be false until payment approval");
if (packet.featureFlags?.paidContentEnabled !== false) errors.push("featureFlags.paidContentEnabled must be false until payment approval");
if (packet.featureFlags?.demoAuthEnabled !== false) errors.push("featureFlags.demoAuthEnabled must be false for a release candidate");
if (packet.featureFlags?.externalIdentityProvider !== true) errors.push("featureFlags.externalIdentityProvider must be true");
if (asArray(payment.externalAcceptance).some((item) => item.status === "pending_external") && packet.featureFlags?.paidCheckout !== false) {
  errors.push("featureFlags.paidCheckout must stay false while payment provider external acceptance is pending");
}
for (const smoke of REQUIRED_SMOKE) {
  if (!asArray(packet.qaSmoke).includes(smoke)) errors.push(`qaSmoke missing ${smoke}`);
}
for (const role of REQUIRED_SIGNOFF) {
  if (packet.releaseSignoff?.[role] !== "pending_external") errors.push(`releaseSignoff.${role} must remain pending_external until signed`);
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
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
  if (!distributionExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from app-distribution externalAcceptance`);
}

const distributionArtifacts = new Map(asArray(distribution.dataArtifacts).map((item) => [item.id, item]));
if (!distributionArtifacts.has("app_release_packet")) errors.push("app-distribution-readiness.dataArtifacts missing app_release_packet");
const distributionControls = new Map(asArray(distribution.codeControls).map((item) => [item.id, item]));
if (!distributionControls.has("app_release_packet_gate")) errors.push("app-distribution-readiness.codeControls missing app_release_packet_gate");
for (const command of ["npm run check:app-release-packet"]) {
  if (!asArray(distribution.releaseCommands).includes(command)) errors.push(`app-distribution-readiness.releaseCommands missing ${command}`);
}

const appDistribution = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "app_distribution");
if (!appDistribution) {
  errors.push("release-readiness.public_mvp missing app_distribution");
} else {
  for (const evidence of ["data/app-release-packet.json", "scripts/check-app-release-packet.mjs"]) {
    if (!asArray(appDistribution.evidence).includes(evidence)) errors.push(`release-readiness.app_distribution evidence missing ${evidence}`);
  }
  if (appDistribution.status !== "in_progress") errors.push("app_distribution must remain in_progress until signed native builds exist");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`App release packet gate ${packet.schemaVersion}: channels=${channels.size}, permissions=${permissions.size}, smoke=${asArray(packet.qaSmoke).length}, pending_external=${blockerRows.size}`);
