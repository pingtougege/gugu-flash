import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  JSON_STORE_REPOSITORY_CONTRACTS,
  parseSqlSchemaSummary,
  validateSqlSchema,
} from "../apps/backend/src/persistence-contract.js";

const DRILL_URL = new URL("../data/production-database-drill-packet.json", import.meta.url);
const MIGRATION_URL = new URL("../data/production-database-migration-packet.json", import.meta.url);
const PERSISTENCE_URL = new URL("../docs/backend-persistence-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const SCHEMA_URL = new URL("../apps/backend/db/schema.sql", import.meta.url);

const REQUIRED_REHEARSALS = [
  "pre_migration_snapshot",
  "schema_apply_rehearsal",
  "repository_contract_rehearsal",
  "restore_to_staging_rehearsal",
  "rollback_snapshot_rehearsal",
];
const REQUIRED_RESTORE_VERIFICATION = ["row_counts", "repository_contract", "support_diagnostics", "web_http_smoke"];
const REQUIRED_EXTERNAL = [
  "production_database_provisioned",
  "repository_implementation",
  "migration_execution",
  "database_backup_restore_drill",
];
const REQUIRED_COMMANDS = [
  "npm run check:backend-persistence",
  "npm run check:production-database",
  "npm run check:production-database-drill",
  "npm run check:alpha-backup-restore",
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
const migration = JSON.parse(await readFile(MIGRATION_URL, "utf8"));
const persistence = JSON.parse(await readFile(PERSISTENCE_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const schema = await readFile(SCHEMA_URL, "utf8");
const errors = [];

if (drill.schemaVersion !== "gugu_production_database_drill_packet_v1") {
  errors.push("drill.schemaVersion must be gugu_production_database_drill_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(drill.updatedAt || "")) errors.push("drill.updatedAt must be YYYY-MM-DD");
if (drill.status !== "draft_ready_for_production_database_replay") {
  errors.push("drill.status must remain draft_ready_for_production_database_replay");
}
if (drill.environment !== migration.targetDatabase?.environment) errors.push("drill.environment must match migration target environment");
if (drill.sourcePacket !== "data/production-database-migration-packet.json") errors.push("drill.sourcePacket must point to migration packet");

const target = drill.targetDatabase || {};
if (target.connectionSecret !== migration.targetDatabase?.connectionSecret) {
  errors.push("targetDatabase.connectionSecret must match migration packet");
}
for (const flag of ["managedBackupsRequired", "pointInTimeRecoveryRequired"]) {
  if (target[flag] !== true) errors.push(`targetDatabase.${flag} must be true`);
}
if (target.productionDatabaseStatus !== "pending_external") {
  errors.push("targetDatabase.productionDatabaseStatus must remain pending_external");
}

errors.push(...validateSqlSchema(schema).map((error) => `schema: ${error}`));
const summary = parseSqlSchemaSummary(schema);
if (summary.tables.length < migration.schema?.minimumTables) errors.push("schema table count is below migration minimum");
if (summary.indexes.length < migration.schema?.minimumIndexes) errors.push("schema index count is below migration minimum");

const migrationSteps = new Set(asArray(migration.migrationPlan).map((item) => item.id));
const rehearsalRows = new Map(asArray(drill.rehearsalMatrix).map((item) => [item.id, item]));
for (const rehearsalId of REQUIRED_REHEARSALS) {
  const row = rehearsalRows.get(rehearsalId);
  if (!row) {
    errors.push(`rehearsalMatrix missing ${rehearsalId}`);
    continue;
  }
  if (!row.owner) errors.push(`rehearsalMatrix.${rehearsalId}.owner is required`);
  if (row.replayStatus !== "pending_external") {
    errors.push(`rehearsalMatrix.${rehearsalId}.replayStatus must remain pending_external`);
  }
  if (!migrationSteps.has(row.sourceStep) && row.sourceStep !== "database_backup_restore_drill") {
    errors.push(`rehearsalMatrix.${rehearsalId}.sourceStep must reference migrationPlan`);
  }
  if (asArray(row.requiredEvidence).length < 3) {
    errors.push(`rehearsalMatrix.${rehearsalId}.requiredEvidence must include at least 3 items`);
  }
  if (asArray(row.verification).length < 2) {
    errors.push(`rehearsalMatrix.${rehearsalId}.verification must include at least 2 items`);
  }
}

for (const verification of REQUIRED_RESTORE_VERIFICATION) {
  if (!asArray(drill.restoreVerification).includes(verification)) {
    errors.push(`restoreVerification missing ${verification}`);
  }
  if (!asArray(migration.backupRestore?.restoreVerification).includes(verification)) {
    errors.push(`migration backupRestore.restoreVerification missing ${verification}`);
  }
}

const repositoryIds = new Set(JSON_STORE_REPOSITORY_CONTRACTS.map((contract) => contract.id));
const criticalTables = new Set(asArray(migration.criticalTables));
for (const dataSet of asArray(drill.criticalDataSets)) {
  if (!repositoryIds.has(dataSet) && !criticalTables.has(dataSet)) {
    errors.push(`criticalDataSets.${dataSet} must map to repository contract or critical table`);
  }
}
for (const table of ["payment_callbacks", "refund_callbacks", "settlements", "device_sync_jobs", "operation_logs"]) {
  if (!asArray(drill.criticalDataSets).includes(table)) errors.push(`criticalDataSets missing ${table}`);
}

const localProof = drill.localProof || {};
if (localProof.alphaBackupSchema !== "gugu_flash_json_backup_v1") {
  errors.push("localProof.alphaBackupSchema must be gugu_flash_json_backup_v1");
}
if (localProof.automatedCommand !== "npm run check:alpha-backup-restore") {
  errors.push("localProof.automatedCommand must be npm run check:alpha-backup-restore");
}
if (!(await pathExists(localProof.backupUtility || ""))) {
  errors.push(`localProof.backupUtility missing: ${localProof.backupUtility}`);
}
if (localProof.status !== "ready_as_local_proof_only") {
  errors.push("localProof.status must be ready_as_local_proof_only");
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
const migrationBlockers = new Set(asArray(migration.externalBlockers).map((item) => item.id));
const persistenceExternal = new Set(asArray(persistence.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId}.status must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (asArray(blocker.exitCriteria).length < 3) errors.push(`externalBlockers.${blockerId}.exitCriteria must include at least 3 items`);
  if (!migrationBlockers.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from migration packet`);
  if (!persistenceExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from persistence readiness`);
}

const artifacts = new Map(asArray(persistence.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("production_database_drill_packet")) {
  errors.push("backend-persistence-readiness.dataArtifacts missing production_database_drill_packet");
}
const controls = new Map(asArray(persistence.codeControls).map((item) => [item.id, item]));
if (!controls.has("production_database_drill_gate")) {
  errors.push("backend-persistence-readiness.codeControls missing production_database_drill_gate");
}
if (!asArray(persistence.releaseCommands).includes("npm run check:production-database-drill")) {
  errors.push("backend-persistence-readiness.releaseCommands missing npm run check:production-database-drill");
}
if (!(await pathExists("data/production-database-drill-packet.json"))) {
  errors.push("data/production-database-drill-packet.json must exist");
}

const backendPersistenceItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "backend_persistence");
if (!backendPersistenceItem) {
  errors.push("release-readiness.closed_beta missing backend_persistence");
} else {
  for (const evidence of ["data/production-database-drill-packet.json", "scripts/check-production-database-drill.mjs"]) {
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

console.log(`Production database drill gate ${drill.schemaVersion}: rehearsals=${rehearsalRows.size}, dataSets=${asArray(drill.criticalDataSets).length}, blockers=${blockerRows.size}`);
