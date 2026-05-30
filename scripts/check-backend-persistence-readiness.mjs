import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createJsonFlashStore } from "../apps/backend/src/json-flash-store.js";
import {
  JSON_STORE_REPOSITORY_CONTRACTS,
  parseSqlSchemaSummary,
  validateRepositoryContract,
  validateSqlSchema,
} from "../apps/backend/src/persistence-contract.js";

const PERSISTENCE_URL = new URL("../docs/backend-persistence-readiness.json", import.meta.url);
const SCHEMA_URL = new URL("../apps/backend/db/schema.sql", import.meta.url);
const RELEASE_READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

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

const readiness = JSON.parse(await readFile(PERSISTENCE_URL, "utf8"));
const schema = await readFile(SCHEMA_URL, "utf8");
const releaseReadiness = JSON.parse(await readFile(RELEASE_READINESS_URL, "utf8"));
const errors = [];

if (!readiness.version) errors.push("backend-persistence-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(readiness.updatedAt || "")) {
  errors.push("backend-persistence-readiness: updatedAt must be YYYY-MM-DD");
}
if (readiness.status !== "draft_pending_production_database") {
  errors.push("backend-persistence-readiness: status must remain draft_pending_production_database until production DB is live");
}

for (const section of ["documents", "codeControls"]) {
  for (const item of asArray(readiness[section])) {
    if (!item.id) errors.push(`${section}: missing id`);
    if (!item.file) errors.push(`${item.id}: missing file`);
    if (!(await pathExists(item.file))) {
      errors.push(`${item.id}: file does not exist: ${item.file}`);
      continue;
    }
    const content = await readFile(resolve(item.file), "utf8");
    for (const heading of asArray(item.requiredHeadings)) {
      if (!content.includes(heading)) errors.push(`${item.id}: missing heading ${heading}`);
    }
    for (const marker of asArray(item.requiredMarkers)) {
      if (!content.includes(marker)) errors.push(`${item.id}: missing marker ${marker}`);
    }
    for (const clause of asArray(item.requiredClauses)) {
      if (!content.toLowerCase().includes(String(clause).toLowerCase())) {
        errors.push(`${item.id}: missing clause marker ${clause}`);
      }
    }
  }
}

for (const artifact of asArray(readiness.dataArtifacts)) {
  if (!artifact.id) errors.push("dataArtifacts: missing id");
  if (!artifact.file) errors.push(`${artifact.id}: missing file`);
  if (!(await pathExists(artifact.file))) {
    errors.push(`${artifact.id}: file does not exist: ${artifact.file}`);
    continue;
  }
  const content = await readFile(resolve(artifact.file), "utf8");
  for (const marker of asArray(artifact.requiredMarkers)) {
    if (!content.includes(marker)) errors.push(`${artifact.id}: missing marker ${marker}`);
  }
  for (const clause of asArray(artifact.requiredClauses)) {
    if (!content.toLowerCase().includes(String(clause).toLowerCase())) {
      errors.push(`${artifact.id}: missing clause marker ${clause}`);
    }
  }
}

const store = createJsonFlashStore({
  dataPath: "/tmp/gugu-flash-readiness-packs.json",
  statePath: "/tmp/gugu-flash-readiness-state.json",
  seedPath: "/tmp/gugu-flash-readiness-seed.json",
});
errors.push(...validateRepositoryContract(store));
errors.push(...validateSqlSchema(schema));

const summary = parseSqlSchemaSummary(schema);
for (const repositoryId of asArray(readiness.requiredRepositories)) {
  if (!JSON_STORE_REPOSITORY_CONTRACTS.some((contract) => contract.id === repositoryId)) {
    errors.push(`requiredRepositories: missing contract for ${repositoryId}`);
  }
}

for (const item of asArray(readiness.externalAcceptance)) {
  if (!item.id) errors.push("externalAcceptance: missing id");
  if (item.status !== "pending_external") errors.push(`${item.id}: must remain pending_external until production database work is recorded`);
  if (!item.needed) errors.push(`${item.id}: missing needed`);
}

for (const command of asArray(readiness.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const backendPersistenceItem = asArray(releaseReadiness.gates?.closed_beta?.items).find((item) => item.id === "backend_persistence");
if (!backendPersistenceItem) {
  errors.push("release-readiness.closed_beta: missing backend_persistence item");
} else {
  for (const evidence of [
    "apps/backend/src/json-flash-store.js",
    "apps/backend/src/json-flash-store.test.js",
    "apps/backend/src/persistence-contract.js",
    "apps/backend/src/persistence-contract.test.js",
    "apps/backend/db/schema.sql",
    "data/production-database-migration-packet.json",
    "docs/backend-persistence-readiness.md",
    "docs/backend-persistence-readiness.json",
    "scripts/check-backend-persistence-readiness.mjs",
    "scripts/check-production-database-packet.mjs",
  ]) {
    if (!asArray(backendPersistenceItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.backend_persistence: evidence must include ${evidence}`);
    }
  }
  if (backendPersistenceItem.status === "ready") {
    errors.push("release-readiness.backend_persistence: cannot be ready until production database implementation is live");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Backend persistence readiness gate ${readiness.version}: repositories=${JSON_STORE_REPOSITORY_CONTRACTS.length}, tables=${summary.tables.length}, indexes=${summary.indexes.length}, artifacts=${asArray(readiness.dataArtifacts).length}, pending_external=${asArray(readiness.externalAcceptance).length}`);
