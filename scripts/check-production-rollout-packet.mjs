import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PACKET_URL = new URL("../data/production-rollout-packet.json", import.meta.url);
const DEPLOYMENT_URL = new URL("../docs/deployment-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const PACKAGE_URL = new URL("../package.json", import.meta.url);

const REQUIRED_OWNERS = ["Release Manager", "DevOps Lead", "Backend Lead", "QA Lead", "Support Lead"];
const REQUIRED_PREFLIGHT = [
  "npm test",
  "npm run test:e2e",
  "npm run check:deployment",
  "npm run check:production-preflight",
  "npm run check:production-database",
  "npm run check:production-monitoring",
  "npm run check:security-review-packet",
  "npm run check:payment-provider-packet",
  "node scripts/check-release-readiness.mjs --gate=public_mvp",
];
const REQUIRED_STAGES = [
  "freeze_release_candidate",
  "take_pre_deploy_backup",
  "apply_database_migration",
  "deploy_api_without_traffic",
  "run_production_smoke",
  "shift_canary_traffic",
  "promote_full_traffic",
  "post_deploy_reconciliation",
];
const REQUIRED_SMOKE = [
  "web_http_publish_listing_claim_sync",
  "required_auth_session_issue_refresh_revoke",
  "payment_callback_signature_idempotency",
  "support_diagnostics_lookup",
  "monitoring_alert_delivery",
  "rollback_to_previous_release",
];
const REQUIRED_BLOCKERS = [
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

const packet = JSON.parse(await readFile(PACKET_URL, "utf8"));
const deployment = JSON.parse(await readFile(DEPLOYMENT_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const pkg = JSON.parse(await readFile(PACKAGE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_production_rollout_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_production_rollout_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_production_execution") {
  errors.push("packet.status must remain draft_pending_production_execution until production rollout runs");
}

const candidate = packet.releaseCandidate || {};
if (candidate.version !== pkg.version) errors.push(`releaseCandidate.version must match package.json version ${pkg.version}`);
if (candidate.gitRevision !== "pending_release_commit") errors.push("releaseCandidate.gitRevision must remain pending_release_commit until release commit is selected");
if (candidate.apiBaseUrl !== "pending_production_api_host") errors.push("releaseCandidate.apiBaseUrl must remain pending_production_api_host");
if (candidate.releaseMode !== "free_only_until_payment_approval") errors.push("releaseCandidate.releaseMode must keep paid checkout disabled");

const ownerRows = new Map(asArray(packet.owners).map((item) => [item.role, item]));
for (const role of REQUIRED_OWNERS) {
  const row = ownerRows.get(role);
  if (!row) {
    errors.push(`owners missing ${role}`);
    continue;
  }
  if (!row.owner) errors.push(`owners.${role}: missing owner`);
  if (!asArray(row.responsibilities).length) errors.push(`owners.${role}: missing responsibilities`);
}

for (const command of REQUIRED_PREFLIGHT) {
  if (!asArray(packet.preflightGates).includes(command)) errors.push(`preflightGates missing ${command}`);
}

const stageRows = new Map(asArray(packet.deploymentStages).map((item) => [item.id, item]));
for (const stageId of REQUIRED_STAGES) {
  const row = stageRows.get(stageId);
  if (!row) {
    errors.push(`deploymentStages missing ${stageId}`);
    continue;
  }
  if (!row.ownerRole) errors.push(`deploymentStages.${stageId}: missing ownerRole`);
  if (!ownerRows.has(row.ownerRole)) errors.push(`deploymentStages.${stageId}: unknown ownerRole ${row.ownerRole}`);
  if (!asArray(row.requiredEvidence).length) errors.push(`deploymentStages.${stageId}: missing requiredEvidence`);
}
if (!asArray(stageRows.get("take_pre_deploy_backup")?.requiredEvidence).includes("restore_target")) {
  errors.push("take_pre_deploy_backup must require restore_target evidence");
}
if (!asArray(stageRows.get("shift_canary_traffic")?.requiredEvidence).includes("error_budget_check")) {
  errors.push("shift_canary_traffic must require error_budget_check evidence");
}

const rollback = packet.rollbackPlan || {};
for (const trigger of ["health_probe_failure", "readiness_probe_failure", "database_migration_data_loss_risk", "support_severity_1_incident"]) {
  if (!asArray(rollback.triggerConditions).includes(trigger)) errors.push(`rollbackPlan.triggerConditions missing ${trigger}`);
}
for (const step of ["shift_traffic_to_previous_release", "verify_health_and_readiness", "run_web_and_api_smoke", "record_incident_and_followup_owner"]) {
  if (!asArray(rollback.steps).includes(step)) errors.push(`rollbackPlan.steps missing ${step}`);
}
for (const evidence of ["previous_release_available", "health_ready_after_rollback", "data_integrity_decision", "support_handoff_note"]) {
  if (!asArray(rollback.requiredEvidence).includes(evidence)) errors.push(`rollbackPlan.requiredEvidence missing ${evidence}`);
}

const smokeRows = new Map(asArray(packet.smokeScenarios).map((item) => [item.id, item]));
for (const smokeId of REQUIRED_SMOKE) {
  const row = smokeRows.get(smokeId);
  if (!row) {
    errors.push(`smokeScenarios missing ${smokeId}`);
    continue;
  }
  if (!row.surface) errors.push(`smokeScenarios.${smokeId}: missing surface`);
  if (!row.expected) errors.push(`smokeScenarios.${smokeId}: missing expected`);
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
const deploymentExternal = new Set(asArray(deployment.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_BLOCKERS) {
  const row = blockerRows.get(blockerId);
  if (!row) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (row.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!row.owner) errors.push(`externalBlockers.${blockerId}: missing owner`);
  if (!asArray(row.exitCriteria).length) errors.push(`externalBlockers.${blockerId}: missing exitCriteria`);
  if (!deploymentExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from deployment externalAcceptance`);
}

const artifacts = new Map(asArray(deployment.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("production_rollout_packet")) {
  errors.push("deployment-readiness.dataArtifacts missing production_rollout_packet");
}
const controls = new Map(asArray(deployment.codeControls).map((item) => [item.id, item]));
if (!controls.has("production_rollout_packet_gate")) {
  errors.push("deployment-readiness.codeControls missing production_rollout_packet_gate");
}
if (!asArray(deployment.releaseCommands).includes("npm run check:production-rollout")) {
  errors.push("deployment-readiness.releaseCommands missing npm run check:production-rollout");
}
if (!(await pathExists("data/production-rollout-packet.json"))) {
  errors.push("data/production-rollout-packet.json must exist");
}

const productionDeployment = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "production_deployment");
if (!productionDeployment) {
  errors.push("release-readiness.public_mvp missing production_deployment");
} else {
  for (const evidence of ["data/production-rollout-packet.json", "scripts/check-production-rollout-packet.mjs"]) {
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

console.log(`Production rollout packet gate ${packet.schemaVersion}: stages=${stageRows.size}, smoke=${smokeRows.size}, blockers=${blockerRows.size}`);
