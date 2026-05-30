import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PREFLIGHT_URL = new URL("../data/production-environment-preflight.json", import.meta.url);
const DEPLOYMENT_URL = new URL("../docs/deployment-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const PACKAGE_URL = new URL("../package.json", import.meta.url);

const REQUIRED_ENV = [
  "API_HOST",
  "API_PORT",
  "GUGU_FLASH_REQUIRE_AUTH",
  "GUGU_FLASH_ALLOW_DEMO_AUTH",
  "GUGU_FLASH_CORS_ORIGIN",
  "GUGU_FLASH_IDENTITY_ISSUER",
  "GUGU_FLASH_IDENTITY_AUDIENCE",
];
const REQUIRED_SECRETS = [
  "GUGU_FLASH_OPERATOR_INVITE_SECRET",
  "GUGU_FLASH_IDENTITY_TOKEN_SECRET",
  "GUGU_FLASH_PAYMENT_CALLBACK_SECRET",
  "PRODUCTION_DATABASE_URL",
];
const REQUIRED_PROBES = ["health", "readiness", "ops_metrics"];
const REQUIRED_SMOKE = [
  "web_http_publish_listing_claim_sync",
  "required_auth_session_issue_refresh_revoke",
  "payment_callback_signature_idempotency",
  "support_diagnostics_lookup",
  "monitoring_alert_delivery",
  "pre_deploy_backup_restore",
  "rollback_to_previous_release",
];
const REQUIRED_EXTERNAL_BLOCKERS = [
  "production_api_hosting",
  "production_database",
  "secrets_management",
  "backup_restore_drill",
  "rollback_drill",
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

const preflight = JSON.parse(await readFile(PREFLIGHT_URL, "utf8"));
const deployment = JSON.parse(await readFile(DEPLOYMENT_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const pkg = JSON.parse(await readFile(PACKAGE_URL, "utf8"));
const errors = [];

if (preflight.schemaVersion !== "gugu_production_environment_preflight_v1") {
  errors.push("preflight.schemaVersion must be gugu_production_environment_preflight_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(preflight.updatedAt || "")) errors.push("preflight.updatedAt must be YYYY-MM-DD");
if (preflight.status !== "draft_pending_production_hosting") {
  errors.push("preflight.status must remain draft_pending_production_hosting until production hosting exists");
}
if (preflight.environment !== "public_mvp_production") errors.push("preflight.environment must be public_mvp_production");
if (preflight.appVersion !== pkg.version) errors.push(`preflight.appVersion must match package.json version ${pkg.version}`);

const service = preflight.service || {};
for (const field of ["name", "apiBaseUrl", "webOrigin"]) {
  if (!service[field]) errors.push(`service.${field} is required`);
}
if (service.tlsRequired !== true) errors.push("service.tlsRequired must be true");
if (service.readinessRequiredBeforeTraffic !== true) errors.push("service.readinessRequiredBeforeTraffic must be true");
if (service.apiBaseUrl !== "pending_production_api_host") {
  errors.push("service.apiBaseUrl must remain pending_production_api_host until production hosting is configured");
}

const envRows = new Map(asArray(preflight.requiredEnv).map((item) => [item.name, item]));
for (const name of REQUIRED_ENV) {
  const row = envRows.get(name);
  if (!row) {
    errors.push(`requiredEnv missing ${name}`);
    continue;
  }
  if (row.required !== true) errors.push(`requiredEnv.${name} must be required`);
  if (row.status !== "pending_external") errors.push(`requiredEnv.${name} must remain pending_external`);
  if (!row.expected) errors.push(`requiredEnv.${name} missing expected`);
}
if (envRows.get("GUGU_FLASH_REQUIRE_AUTH")?.expected !== "1") {
  errors.push("GUGU_FLASH_REQUIRE_AUTH expected value must be 1");
}
if (envRows.get("GUGU_FLASH_ALLOW_DEMO_AUTH")?.expected !== "0") {
  errors.push("GUGU_FLASH_ALLOW_DEMO_AUTH expected value must be 0");
}

const secretRows = new Map(asArray(preflight.requiredSecrets).map((item) => [item.name, item]));
for (const name of REQUIRED_SECRETS) {
  const row = secretRows.get(name);
  if (!row) {
    errors.push(`requiredSecrets missing ${name}`);
    continue;
  }
  if (row.source !== "secrets_manager") errors.push(`requiredSecrets.${name} must come from secrets_manager`);
  if (row.status !== "pending_external") errors.push(`requiredSecrets.${name} must remain pending_external`);
  if (!row.rotation) errors.push(`requiredSecrets.${name} missing rotation`);
}

const probeRows = new Map(asArray(preflight.probes).map((item) => [item.id, item]));
for (const probeId of REQUIRED_PROBES) {
  const probe = probeRows.get(probeId);
  if (!probe) {
    errors.push(`probes missing ${probeId}`);
    continue;
  }
  if (probe.method !== "GET") errors.push(`probes.${probeId} must use GET`);
  if (!String(probe.path || "").startsWith("/flash/")) errors.push(`probes.${probeId} path must stay inside /flash`);
  if (probe.expectedStatus !== 200) errors.push(`probes.${probeId} expectedStatus must be 200`);
}
const readinessProbe = probeRows.get("readiness");
for (const field of ["status", "checks.api", "checks.runtimeState", "checks.persistence", "deployment.authMode"]) {
  if (!asArray(readinessProbe?.requiredFields).includes(field)) errors.push(`readiness probe missing field ${field}`);
}

for (const smoke of REQUIRED_SMOKE) {
  if (!asArray(preflight.smokeScenarios).includes(smoke)) errors.push(`smokeScenarios missing ${smoke}`);
}

const dataControls = preflight.dataControls || {};
for (const flag of ["preDeployBackupRequired", "productionDatabaseRequired", "pointInTimeRecoveryRequired", "rollbackSnapshotRequired"]) {
  if (dataControls[flag] !== true) errors.push(`dataControls.${flag} must be true`);
}
if (dataControls.backupSchema !== "gugu_flash_json_backup_v1") {
  errors.push("dataControls.backupSchema must be gugu_flash_json_backup_v1 while Alpha backup drill is the local proof");
}

const blockerRows = new Map(asArray(preflight.externalBlockers).map((item) => [item.id, item]));
const deploymentExternal = new Set(asArray(deployment.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
  if (!deploymentExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from deployment externalAcceptance`);
}

const deploymentArtifacts = new Map(asArray(deployment.dataArtifacts).map((item) => [item.id, item]));
if (!deploymentArtifacts.has("production_environment_preflight")) {
  errors.push("deployment-readiness.dataArtifacts missing production_environment_preflight");
}
const deploymentControls = new Map(asArray(deployment.codeControls).map((item) => [item.id, item]));
if (!deploymentControls.has("production_environment_preflight_gate")) {
  errors.push("deployment-readiness.codeControls missing production_environment_preflight_gate");
}
if (!asArray(deployment.releaseCommands).includes("npm run check:production-preflight")) {
  errors.push("deployment-readiness.releaseCommands missing npm run check:production-preflight");
}
if (!(await pathExists("data/production-environment-preflight.json"))) {
  errors.push("data/production-environment-preflight.json must exist");
}

const productionDeployment = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "production_deployment");
if (!productionDeployment) {
  errors.push("release-readiness.public_mvp missing production_deployment");
} else {
  for (const evidence of ["data/production-environment-preflight.json", "scripts/check-production-environment-preflight.mjs"]) {
    if (!asArray(productionDeployment.evidence).includes(evidence)) {
      errors.push(`release-readiness.production_deployment evidence missing ${evidence}`);
    }
  }
  if (productionDeployment.status !== "in_progress") {
    errors.push("production_deployment must remain in_progress until production hosting and drills are complete");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Production environment preflight gate ${preflight.schemaVersion}: env=${envRows.size}, secrets=${secretRows.size}, probes=${probeRows.size}, smoke=${asArray(preflight.smokeScenarios).length}, pending_external=${blockerRows.size}`);
