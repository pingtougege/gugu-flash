export const PERSISTENCE_CONTRACT_VERSION = "gugu_flash_persistence_contract_v1";

export const REQUIRED_PRODUCTION_TABLES = [
  "users",
  "sessions",
  "ip_entries",
  "personas",
  "ip_zones",
  "zone_applications",
  "works",
  "work_versions",
  "work_drafts",
  "assets",
  "uploads",
  "comments",
  "interactions",
  "block_relations",
  "review_tasks",
  "store_listings",
  "compatibility_reports",
  "hardware_packs",
  "devices",
  "orders",
  "payment_callbacks",
  "refund_callbacks",
  "settlements",
  "device_entitlements",
  "device_installs",
  "device_sync_jobs",
  "reports",
  "rights_claims",
  "appeals",
  "moderation_actions",
  "operation_logs",
];

export const REQUIRED_PRODUCTION_INDEXES = [
  "idx_works_status_created_at",
  "idx_work_versions_work_id",
  "idx_store_listings_status",
  "idx_hardware_packs_status",
  "idx_orders_buyer_user_id",
  "idx_payment_callbacks_provider_event_id",
  "idx_refund_callbacks_provider_event_id",
  "idx_settlements_status",
  "idx_device_entitlements_device_id",
  "idx_device_installs_device_id",
  "idx_device_sync_jobs_device_id",
  "idx_review_tasks_status",
  "idx_reports_status",
  "idx_rights_claims_status",
  "idx_appeals_status",
  "idx_operation_logs_created_at",
];

export const JSON_STORE_REPOSITORY_CONTRACTS = [
  { id: "packs", requiredMethods: ["loadPacks", "savePacks"], productionTables: ["works", "work_versions", "store_listings", "hardware_packs"] },
  { id: "runtimeState", requiredMethods: ["loadRuntimeState", "saveRuntimeState"], productionTables: ["operation_logs"] },
  { id: "sessions", requiredMethods: ["list", "get", "getByToken", "create", "refreshByToken", "revokeByToken"], productionTables: ["sessions", "users"] },
  { id: "orders", requiredMethods: ["list", "get", "save"], productionTables: ["orders"] },
  { id: "deviceEntitlements", requiredMethods: ["listForDevice", "get", "save"], productionTables: ["device_entitlements"] },
  { id: "deviceInstalls", requiredMethods: ["listForDevice", "get", "save"], productionTables: ["device_installs"] },
  { id: "deviceSyncJobs", requiredMethods: ["list", "listForDevice", "get", "save"], productionTables: ["device_sync_jobs"] },
  { id: "comments", requiredMethods: ["list", "listForWork", "get", "save"], productionTables: ["comments"] },
  { id: "blockRelations", requiredMethods: ["list", "listForBlocker", "get", "save"], productionTables: ["block_relations"] },
  { id: "reports", requiredMethods: ["list", "listForReporter", "get", "save"], productionTables: ["reports"] },
  { id: "rightsClaims", requiredMethods: ["list", "get", "save"], productionTables: ["rights_claims"] },
  { id: "appeals", requiredMethods: ["list", "listForAppellant", "get", "save"], productionTables: ["appeals"] },
  { id: "moderationActions", requiredMethods: ["list", "get", "save"], productionTables: ["moderation_actions"] },
  { id: "operationLogs", requiredMethods: ["list", "get", "save"], productionTables: ["operation_logs"] },
  { id: "paymentCallbacks", requiredMethods: ["list", "get", "save"], productionTables: ["payment_callbacks"] },
  { id: "refundCallbacks", requiredMethods: ["list", "get", "save"], productionTables: ["refund_callbacks"] },
];

function extractSqlNames(sql, pattern) {
  return Array.from(sql.matchAll(pattern)).map((match) => match[1].toLowerCase());
}

export function parseSqlSchemaSummary(sql = "") {
  return {
    tables: extractSqlNames(sql, /CREATE\s+TABLE\s+([a-zA-Z0-9_]+)/gi),
    indexes: extractSqlNames(sql, /CREATE\s+(?:UNIQUE\s+)?INDEX\s+([a-zA-Z0-9_]+)/gi),
  };
}

export function validateSqlSchema(sql = "") {
  const summary = parseSqlSchemaSummary(sql);
  const tableSet = new Set(summary.tables);
  const indexSet = new Set(summary.indexes);
  const errors = [];

  for (const table of REQUIRED_PRODUCTION_TABLES) {
    if (!tableSet.has(table)) errors.push(`schema missing table ${table}`);
  }
  for (const index of REQUIRED_PRODUCTION_INDEXES) {
    if (!indexSet.has(index)) errors.push(`schema missing index ${index}`);
  }
  for (const contract of JSON_STORE_REPOSITORY_CONTRACTS) {
    for (const table of contract.productionTables) {
      if (!tableSet.has(table)) errors.push(`${contract.id}: production table missing ${table}`);
    }
  }
  return errors;
}

export function validateRepositoryContract(store = {}) {
  const errors = [];
  for (const contract of JSON_STORE_REPOSITORY_CONTRACTS) {
    const target = contract.id === "packs" || contract.id === "runtimeState" ? store : store[contract.id];
    if (!target) {
      errors.push(`repository missing ${contract.id}`);
      continue;
    }
    for (const method of contract.requiredMethods) {
      if (typeof target[method] !== "function") {
        errors.push(`${contract.id}.${method} must be implemented`);
      }
    }
  }
  return errors;
}
