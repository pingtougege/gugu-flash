import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  JSON_STORE_REPOSITORY_CONTRACTS,
  parseSqlSchemaSummary,
  validateSqlSchema,
} from "../apps/backend/src/persistence-contract.js";

const PACKET_URL = new URL("../data/production-database-migration-packet.json", import.meta.url);
const PERSISTENCE_URL = new URL("../docs/backend-persistence-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_MIGRATION_STEPS = [
  "freeze_alpha_writes",
  "create_pre_migration_backup",
  "apply_schema",
  "import_seed_and_runtime_state",
  "run_repository_contract",
  "switch_runtime_to_database",
  "post_migration_reconciliation",
];
const REQUIRED_EXTERNAL_BLOCKERS = [
  "production_database_provisioned",
  "repository_implementation",
  "migration_execution",
  "database_backup_restore_drill",
];
const REQUIRED_CRITICAL_TABLES = [
  "sessions",
  "orders",
  "payment_callbacks",
  "refund_callbacks",
  "settlements",
  "device_entitlements",
  "device_sync_jobs",
  "reports",
  "rights_claims",
  "appeals",
  "operation_logs",
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
const persistence = JSON.parse(await readFile(PERSISTENCE_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_production_database_migration_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_production_database_migration_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_production_database") {
  errors.push("packet.status must remain draft_pending_production_database until production DB is live");
}

const target = packet.targetDatabase || {};
if (!["postgres_or_managed_sqlite", "postgres"].includes(target.engine)) errors.push("targetDatabase.engine must be postgres_or_managed_sqlite or postgres");
if (target.connectionSecret !== "PRODUCTION_DATABASE_URL") errors.push("targetDatabase.connectionSecret must be PRODUCTION_DATABASE_URL");
if (target.managedBackupsRequired !== true) errors.push("targetDatabase.managedBackupsRequired must be true");
if (target.pointInTimeRecoveryRequired !== true) errors.push("targetDatabase.pointInTimeRecoveryRequired must be true");
if (target.status !== "pending_external") errors.push("targetDatabase.status must remain pending_external");

if (!(await pathExists(packet.schema?.file))) errors.push(`schema.file does not exist: ${packet.schema?.file}`);
const schema = await readFile(resolve(packet.schema?.file || ""), "utf8");
errors.push(...validateSqlSchema(schema).map((error) => `schema: ${error}`));
const summary = parseSqlSchemaSummary(schema);
if (summary.tables.length < packet.schema.minimumTables) errors.push("schema.minimumTables exceeds actual schema table count");
if (summary.indexes.length < packet.schema.minimumIndexes) errors.push("schema.minimumIndexes exceeds actual schema index count");
if (packet.schema.validator !== "validateSqlSchema") errors.push("schema.validator must be validateSqlSchema");
if (packet.schema.status !== "ready_for_migration") errors.push("schema.status must be ready_for_migration");

const repositoryIds = new Set(JSON_STORE_REPOSITORY_CONTRACTS.map((contract) => contract.id));
for (const repositoryId of asArray(persistence.requiredRepositories)) {
  if (!asArray(packet.repositoryContract?.requiredRepositories).includes(repositoryId)) {
    errors.push(`repositoryContract.requiredRepositories missing ${repositoryId}`);
  }
  if (!repositoryIds.has(repositoryId)) errors.push(`persistence contract missing ${repositoryId}`);
}
if (packet.repositoryContract?.validator !== "validateRepositoryContract") errors.push("repositoryContract.validator must be validateRepositoryContract");
if (packet.repositoryContract?.contractVersion !== "gugu_flash_persistence_contract_v1") {
  errors.push("repositoryContract.contractVersion must be gugu_flash_persistence_contract_v1");
}
if (packet.repositoryContract?.productionImplementationStatus !== "pending_external") {
  errors.push("repositoryContract.productionImplementationStatus must remain pending_external");
}

const migrationRows = new Map(asArray(packet.migrationPlan).map((item) => [item.id, item]));
for (const stepId of REQUIRED_MIGRATION_STEPS) {
  const step = migrationRows.get(stepId);
  if (!step) {
    errors.push(`migrationPlan missing ${stepId}`);
    continue;
  }
  if (step.status !== "pending_external") errors.push(`migrationPlan.${stepId}.status must remain pending_external`);
  if (!step.owner) errors.push(`migrationPlan.${stepId}.owner is required`);
  if (!asArray(step.requiredEvidence).length) errors.push(`migrationPlan.${stepId}.requiredEvidence is required`);
}

const tables = new Set(summary.tables);
for (const table of REQUIRED_CRITICAL_TABLES) {
  if (!asArray(packet.criticalTables).includes(table)) errors.push(`criticalTables missing ${table}`);
  if (!tables.has(table)) errors.push(`schema missing critical table ${table}`);
}

const backup = packet.backupRestore || {};
if (backup.alphaBackupSchema !== "gugu_flash_json_backup_v1") errors.push("backupRestore.alphaBackupSchema must be gugu_flash_json_backup_v1");
for (const flag of ["productionBackupRequired", "restoreDrillRequired", "rollbackDrillRequired"]) {
  if (backup[flag] !== true) errors.push(`backupRestore.${flag} must be true`);
}
for (const check of ["row_counts", "repository_contract", "support_diagnostics", "web_http_smoke"]) {
  if (!asArray(backup.restoreVerification).includes(check)) errors.push(`backupRestore.restoreVerification missing ${check}`);
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
const persistenceExternal = new Set(asArray(persistence.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
  if (!persistenceExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from persistence externalAcceptance`);
}

const persistenceArtifacts = new Map(asArray(persistence.dataArtifacts).map((item) => [item.id, item]));
if (!persistenceArtifacts.has("production_database_migration_packet")) {
  errors.push("backend-persistence-readiness.dataArtifacts missing production_database_migration_packet");
}
const persistenceControls = new Map(asArray(persistence.codeControls).map((item) => [item.id, item]));
if (!persistenceControls.has("production_database_packet_gate")) {
  errors.push("backend-persistence-readiness.codeControls missing production_database_packet_gate");
}
if (!asArray(persistence.releaseCommands).includes("npm run check:production-database")) {
  errors.push("backend-persistence-readiness.releaseCommands missing npm run check:production-database");
}
if (!(await pathExists("data/production-database-migration-packet.json"))) {
  errors.push("data/production-database-migration-packet.json must exist");
}

const backendPersistenceItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "backend_persistence");
if (!backendPersistenceItem) {
  errors.push("release-readiness.closed_beta missing backend_persistence");
} else {
  for (const evidence of ["data/production-database-migration-packet.json", "scripts/check-production-database-packet.mjs"]) {
    if (!asArray(backendPersistenceItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.backend_persistence evidence missing ${evidence}`);
    }
  }
  if (backendPersistenceItem.status !== "in_progress") {
    errors.push("backend_persistence must remain in_progress until production database is live");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Production database packet gate ${packet.schemaVersion}: tables=${summary.tables.length}, indexes=${summary.indexes.length}, repositories=${asArray(packet.repositoryContract.requiredRepositories).length}, blockers=${blockerRows.size}`);
