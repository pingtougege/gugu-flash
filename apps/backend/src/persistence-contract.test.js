import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { createJsonFlashStore } from "./json-flash-store.js";
import {
  PERSISTENCE_CONTRACT_VERSION,
  REQUIRED_PRODUCTION_TABLES,
  parseSqlSchemaSummary,
  validateRepositoryContract,
  validateSqlSchema,
} from "./persistence-contract.js";

test("persistence contract validates JSON store repository methods", () => {
  const store = createJsonFlashStore({
    dataPath: "/tmp/gugu-flash-contract-packs.json",
    statePath: "/tmp/gugu-flash-contract-state.json",
    seedPath: "/tmp/gugu-flash-contract-seed.json",
  });

  assert.equal(PERSISTENCE_CONTRACT_VERSION, "gugu_flash_persistence_contract_v1");
  assert.deepEqual(validateRepositoryContract(store), []);
});

test("production schema covers persistence contract tables and indexes", async () => {
  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  const summary = parseSqlSchemaSummary(schema);

  assert.ok(summary.tables.includes("payment_callbacks"));
  assert.ok(summary.tables.includes("refund_callbacks"));
  assert.ok(summary.tables.includes("settlements"));
  assert.ok(summary.tables.includes("block_relations"));
  assert.ok(REQUIRED_PRODUCTION_TABLES.every((table) => summary.tables.includes(table)));
  assert.deepEqual(validateSqlSchema(schema), []);
});
