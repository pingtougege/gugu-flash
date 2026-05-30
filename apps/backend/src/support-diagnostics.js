export const SUPPORT_DIAGNOSTIC_BUNDLE_VERSION = "gugu_flash_support_diagnostic_v1";

export const SUPPORT_DIAGNOSTIC_QUERY_FIELDS = [
  "caseId",
  "deviceId",
  "orderId",
  "providerEventId",
  "providerPaymentId",
  "providerRefundId",
  "syncJobId",
  "diagnosticCode",
  "targetId",
  "storeId",
  "hardwarePackId",
  "entitlementId",
  "settlementId",
  "reportId",
  "claimId",
  "appealId",
  "operationLogId",
];

export const SUPPORT_DIAGNOSTIC_MACROS = {
  sync_low_battery: {
    severity: "S2",
    owner: "Support",
    requiredFields: ["diagnosticCode", "deviceId", "batteryLevel", "firmwareVersion", "storeId"],
  },
  sync_write_failed: {
    severity: "S1",
    owner: "Hardware Lead",
    requiredFields: ["diagnosticCode", "failureReason", "rollbackStatus", "transport.events", "firmwareVersion", "previousStoreId"],
  },
  payment_no_entitlement: {
    severity: "S1",
    owner: "Commerce Lead",
    requiredFields: ["orderId", "providerPaymentId", "providerEventId", "deviceId", "storeId"],
  },
  refund_provider_mismatch: {
    severity: "S1",
    owner: "Commerce Lead",
    requiredFields: ["orderId", "providerEventId", "providerRefundId", "entitlementId", "settlementId"],
  },
  takedown_legacy_use: {
    severity: "S2",
    owner: "Trust Lead",
    requiredFields: ["targetId", "storeStatus", "hardwarePack.status", "deviceInstall.status", "sourceCaseId"],
  },
  rights_claim_received: {
    severity: "S1",
    owner: "Trust Lead",
    requiredFields: ["claimId", "targetType", "targetId", "claimType", "sourceEvidence", "settlementStatus"],
  },
  appeal_received: {
    severity: "S2",
    owner: "Support Lead",
    requiredFields: ["appealId", "sourceActionId", "targetId", "appellantUserId", "supplementalEvidence"],
  },
  operator_reason_missing: {
    severity: "S1",
    owner: "Operator Lead",
    requiredFields: ["operationLogId", "operatorId", "targetType", "targetId", "missingReason"],
  },
};

const CLOSED_STATUSES = new Set(["resolved", "rejected", "closed", "cancelled"]);
const PAYMENT_SUCCESS_RESULTS = new Set(["paid", "succeeded", "success"]);
const REFUND_SUCCESS_STATUSES = new Set(["succeeded", "success", "refunded"]);
const SYNC_FAILURE_STATUSES = new Set(["failed", "blocked", "rollback_required", "checksum_failed"]);

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function flattenRuntimeRecords(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === "object");
  if (typeof value !== "object") return [];
  if (hasValue(value.id) || hasValue(value.orderId) || hasValue(value.deviceId) || hasValue(value.storeId)) {
    return [value];
  }
  return Object.values(value).flatMap((entry) => flattenRuntimeRecords(entry));
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function normalizeSupportDiagnosticQuery(query = {}) {
  const normalized = {};
  for (const field of SUPPORT_DIAGNOSTIC_QUERY_FIELDS) {
    if (hasValue(query[field])) normalized[field] = String(query[field]).trim();
  }
  if (!normalized.providerEventId && hasValue(query.eventId)) normalized.providerEventId = String(query.eventId).trim();
  if (!normalized.caseId && hasValue(query.sourceCaseId)) normalized.caseId = String(query.sourceCaseId).trim();
  return normalized;
}

function valueSet(...values) {
  return new Set(values.filter(hasValue).map((value) => String(value)));
}

function setHas(set, value) {
  return hasValue(value) && set.has(String(value));
}

function uniqueRecords(records) {
  const seen = new Set();
  const result = [];
  for (const record of asArray(records)) {
    const key = record?.id || JSON.stringify(record);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(record);
  }
  return result;
}

function selectRecords(records, selected, predicate) {
  const next = uniqueRecords([...selected, ...records.filter(predicate)]);
  return next;
}

function selectedChanged(before, after) {
  return Object.keys(after).some((key) => asArray(before[key]).length !== asArray(after[key]).length);
}

function buildRuntimeRecords(runtimeState = {}) {
  return {
    devices: asArray(runtimeState.devices),
    deviceEntitlements: flattenRuntimeRecords(runtimeState.deviceEntitlements),
    deviceInstalls: flattenRuntimeRecords(runtimeState.deviceInstalls),
    deviceSyncJobs: asArray(runtimeState.deviceSyncJobs),
    orders: asArray(runtimeState.orders),
    settlements: asArray(runtimeState.settlements),
    paymentCallbacks: asArray(runtimeState.paymentCallbacks),
    refundCallbacks: asArray(runtimeState.refundCallbacks),
    reports: asArray(runtimeState.reports),
    rightsClaims: asArray(runtimeState.rightsClaims),
    appeals: asArray(runtimeState.appeals),
    moderationActions: asArray(runtimeState.moderationActions),
    operationLogs: asArray(runtimeState.operationLogs),
  };
}

function createSeedIds(query) {
  return {
    caseIds: valueSet(query.caseId),
    deviceIds: valueSet(query.deviceId),
    orderIds: valueSet(query.orderId),
    providerEventIds: valueSet(query.providerEventId),
    providerPaymentIds: valueSet(query.providerPaymentId),
    providerRefundIds: valueSet(query.providerRefundId),
    syncJobIds: valueSet(query.syncJobId),
    diagnosticCodes: valueSet(query.diagnosticCode),
    targetIds: valueSet(query.targetId),
    storeIds: valueSet(query.storeId),
    hardwarePackIds: valueSet(query.hardwarePackId),
    entitlementIds: valueSet(query.entitlementId),
    settlementIds: valueSet(query.settlementId),
    reportIds: valueSet(query.reportId),
    claimIds: valueSet(query.claimId),
    appealIds: valueSet(query.appealId),
    operationLogIds: valueSet(query.operationLogId),
  };
}

function addToSet(set, value) {
  if (hasValue(value)) set.add(String(value));
}

function collectIdsFromSelection(ids, selected) {
  for (const order of selected.orders) {
    addToSet(ids.orderIds, order.id);
    addToSet(ids.deviceIds, order.deviceId);
    addToSet(ids.storeIds, order.storeId);
    addToSet(ids.hardwarePackIds, order.hardwarePackId);
    addToSet(ids.providerEventIds, order.paymentProviderEventId);
    addToSet(ids.providerEventIds, order.refundProviderEventId);
    addToSet(ids.providerPaymentIds, order.providerPaymentId);
    addToSet(ids.providerRefundIds, order.providerRefundId);
  }
  for (const entitlement of selected.deviceEntitlements) {
    addToSet(ids.entitlementIds, entitlement.id);
    addToSet(ids.deviceIds, entitlement.deviceId);
    addToSet(ids.storeIds, entitlement.storeId);
    addToSet(ids.hardwarePackIds, entitlement.hardwarePackId);
    addToSet(ids.orderIds, entitlement.orderId);
  }
  for (const install of selected.deviceInstalls) {
    addToSet(ids.deviceIds, install.deviceId);
    addToSet(ids.storeIds, install.storeId);
    addToSet(ids.hardwarePackIds, install.hardwarePackId);
    addToSet(ids.diagnosticCodes, install.diagnosticCode);
  }
  for (const job of selected.deviceSyncJobs) {
    addToSet(ids.syncJobIds, job.id);
    addToSet(ids.deviceIds, job.deviceId);
    addToSet(ids.storeIds, job.storeId);
    addToSet(ids.storeIds, job.previousStoreId);
    addToSet(ids.hardwarePackIds, job.hardwarePackId);
    addToSet(ids.diagnosticCodes, job.diagnosticCode);
    addToSet(ids.syncJobIds, job.retryOf);
  }
  for (const callback of selected.paymentCallbacks) {
    addToSet(ids.providerEventIds, callback.providerEventId);
    addToSet(ids.providerPaymentIds, callback.providerPaymentId);
    addToSet(ids.orderIds, callback.orderId);
  }
  for (const callback of selected.refundCallbacks) {
    addToSet(ids.providerEventIds, callback.providerEventId);
    addToSet(ids.providerRefundIds, callback.providerRefundId);
    addToSet(ids.orderIds, callback.orderId);
  }
  for (const settlement of selected.settlements) {
    addToSet(ids.settlementIds, settlement.id);
    addToSet(ids.orderIds, settlement.orderId);
    addToSet(ids.storeIds, settlement.storeId);
    addToSet(ids.hardwarePackIds, settlement.hardwarePackId);
  }
  for (const report of selected.reports) {
    addToSet(ids.reportIds, report.id);
    addToSet(ids.caseIds, report.id);
    addToSet(ids.targetIds, report.targetId);
  }
  for (const claim of selected.rightsClaims) {
    addToSet(ids.claimIds, claim.id);
    addToSet(ids.caseIds, claim.id);
    addToSet(ids.targetIds, claim.targetId);
  }
  for (const appeal of selected.appeals) {
    addToSet(ids.appealIds, appeal.id);
    addToSet(ids.caseIds, appeal.id);
    addToSet(ids.caseIds, appeal.sourceCaseId);
    addToSet(ids.targetIds, appeal.targetId);
    addToSet(ids.operationLogIds, appeal.sourceActionId);
  }
  for (const action of selected.moderationActions) {
    addToSet(ids.caseIds, action.id);
    addToSet(ids.caseIds, action.sourceId);
    addToSet(ids.targetIds, action.targetId);
  }
  for (const log of selected.operationLogs) {
    addToSet(ids.operationLogIds, log.id);
    addToSet(ids.targetIds, log.targetId);
  }
}

function selectRelatedRecords(records, ids, includeOpenSnapshot) {
  const selected = Object.fromEntries(Object.keys(records).map((key) => [key, []]));

  if (includeOpenSnapshot) {
    selected.deviceSyncJobs = records.deviceSyncJobs.filter((job) => SYNC_FAILURE_STATUSES.has(job.status)).slice(0, 20);
    selected.paymentCallbacks = records.paymentCallbacks.filter((item) => ["failed", "amount_mismatch", "order_not_found"].includes(item.result)).slice(0, 20);
    selected.refundCallbacks = records.refundCallbacks.filter((item) => ["failed", "order_not_found"].includes(item.result)).slice(0, 20);
    selected.settlements = records.settlements.filter((item) => item.status === "frozen").slice(0, 20);
    selected.reports = records.reports.filter((item) => !CLOSED_STATUSES.has(item.status)).slice(0, 20);
    selected.rightsClaims = records.rightsClaims.filter((item) => !CLOSED_STATUSES.has(item.status)).slice(0, 20);
    selected.appeals = records.appeals.filter((item) => !CLOSED_STATUSES.has(item.status)).slice(0, 20);
    selected.operationLogs = records.operationLogs.filter((log) => !hasValue(log.detail)).slice(0, 20);
    collectIdsFromSelection(ids, selected);
  }

  for (let pass = 0; pass < 4; pass += 1) {
    const before = clone(selected);

    selected.devices = selectRecords(records.devices, selected.devices, (device) => setHas(ids.deviceIds, device.id));
    selected.orders = selectRecords(records.orders, selected.orders, (order) => (
      setHas(ids.orderIds, order.id) ||
      setHas(ids.deviceIds, order.deviceId) ||
      setHas(ids.storeIds, order.storeId) ||
      setHas(ids.hardwarePackIds, order.hardwarePackId) ||
      setHas(ids.providerEventIds, order.paymentProviderEventId) ||
      setHas(ids.providerEventIds, order.refundProviderEventId) ||
      setHas(ids.providerPaymentIds, order.providerPaymentId) ||
      setHas(ids.providerRefundIds, order.providerRefundId)
    ));
    selected.deviceEntitlements = selectRecords(records.deviceEntitlements, selected.deviceEntitlements, (entitlement) => (
      setHas(ids.entitlementIds, entitlement.id) ||
      setHas(ids.orderIds, entitlement.orderId) ||
      setHas(ids.deviceIds, entitlement.deviceId) ||
      setHas(ids.storeIds, entitlement.storeId) ||
      setHas(ids.hardwarePackIds, entitlement.hardwarePackId)
    ));
    selected.deviceInstalls = selectRecords(records.deviceInstalls, selected.deviceInstalls, (install) => (
      setHas(ids.deviceIds, install.deviceId) ||
      setHas(ids.storeIds, install.storeId) ||
      setHas(ids.hardwarePackIds, install.hardwarePackId) ||
      setHas(ids.diagnosticCodes, install.diagnosticCode)
    ));
    selected.deviceSyncJobs = selectRecords(records.deviceSyncJobs, selected.deviceSyncJobs, (job) => (
      setHas(ids.syncJobIds, job.id) ||
      setHas(ids.syncJobIds, job.retryOf) ||
      setHas(ids.deviceIds, job.deviceId) ||
      setHas(ids.storeIds, job.storeId) ||
      setHas(ids.storeIds, job.previousStoreId) ||
      setHas(ids.hardwarePackIds, job.hardwarePackId) ||
      setHas(ids.diagnosticCodes, job.diagnosticCode)
    ));
    selected.paymentCallbacks = selectRecords(records.paymentCallbacks, selected.paymentCallbacks, (callback) => (
      setHas(ids.providerEventIds, callback.providerEventId) ||
      setHas(ids.providerPaymentIds, callback.providerPaymentId) ||
      setHas(ids.orderIds, callback.orderId)
    ));
    selected.refundCallbacks = selectRecords(records.refundCallbacks, selected.refundCallbacks, (callback) => (
      setHas(ids.providerEventIds, callback.providerEventId) ||
      setHas(ids.providerRefundIds, callback.providerRefundId) ||
      setHas(ids.orderIds, callback.orderId)
    ));
    selected.settlements = selectRecords(records.settlements, selected.settlements, (settlement) => (
      setHas(ids.settlementIds, settlement.id) ||
      setHas(ids.orderIds, settlement.orderId) ||
      setHas(ids.storeIds, settlement.storeId) ||
      setHas(ids.hardwarePackIds, settlement.hardwarePackId)
    ));
    selected.reports = selectRecords(records.reports, selected.reports, (report) => (
      setHas(ids.reportIds, report.id) ||
      setHas(ids.caseIds, report.id) ||
      setHas(ids.targetIds, report.targetId)
    ));
    selected.rightsClaims = selectRecords(records.rightsClaims, selected.rightsClaims, (claim) => (
      setHas(ids.claimIds, claim.id) ||
      setHas(ids.caseIds, claim.id) ||
      setHas(ids.targetIds, claim.targetId)
    ));
    selected.appeals = selectRecords(records.appeals, selected.appeals, (appeal) => (
      setHas(ids.appealIds, appeal.id) ||
      setHas(ids.caseIds, appeal.id) ||
      setHas(ids.caseIds, appeal.sourceCaseId) ||
      setHas(ids.targetIds, appeal.targetId) ||
      setHas(ids.operationLogIds, appeal.sourceActionId)
    ));
    selected.moderationActions = selectRecords(records.moderationActions, selected.moderationActions, (action) => (
      setHas(ids.caseIds, action.id) ||
      setHas(ids.caseIds, action.sourceId) ||
      setHas(ids.targetIds, action.targetId)
    ));
    selected.operationLogs = selectRecords(records.operationLogs, selected.operationLogs, (log) => (
      setHas(ids.operationLogIds, log.id) ||
      setHas(ids.targetIds, log.targetId)
    ));

    collectIdsFromSelection(ids, selected);
    if (!selectedChanged(before, selected)) break;
  }

  return selected;
}

function activeEntitlementForOrder(order, entitlements) {
  return entitlements.find((entitlement) => entitlement.orderId === order.id && entitlement.status === "active") || null;
}

function addMacro(macros, id, sourceIds = []) {
  const spec = SUPPORT_DIAGNOSTIC_MACROS[id];
  if (!spec) return;
  const existing = macros.get(id);
  const nextSourceIds = new Set([...(existing?.sourceIds || []), ...sourceIds.filter(hasValue).map(String)]);
  macros.set(id, {
    id,
    severity: spec.severity,
    owner: spec.owner,
    sourceIds: [...nextSourceIds],
    requiredFields: [...spec.requiredFields],
  });
}

function recommendMacros(selected) {
  const macros = new Map();

  for (const job of selected.deviceSyncJobs) {
    if (!SYNC_FAILURE_STATUSES.has(job.status)) continue;
    if (job.failureReason === "low_battery") {
      addMacro(macros, "sync_low_battery", [job.id, job.deviceId, job.diagnosticCode]);
    } else {
      addMacro(macros, "sync_write_failed", [job.id, job.deviceId, job.diagnosticCode]);
    }
  }

  for (const callback of selected.paymentCallbacks) {
    const order = selected.orders.find((item) => item.id === callback.orderId);
    const successLike = PAYMENT_SUCCESS_RESULTS.has(callback.result) || PAYMENT_SUCCESS_RESULTS.has(callback.status);
    const missingEntitlement = order && !activeEntitlementForOrder(order, selected.deviceEntitlements);
    if (successLike && missingEntitlement) {
      addMacro(macros, "payment_no_entitlement", [callback.id, callback.providerEventId, order.id]);
    }
    if (["failed", "amount_mismatch", "order_not_found"].includes(callback.result)) {
      addMacro(macros, "payment_no_entitlement", [callback.id, callback.providerEventId, callback.orderId]);
    }
  }

  for (const order of selected.orders) {
    const hasProviderSuccess = hasValue(order.paymentProviderEventId) && order.status === "paid";
    if (hasProviderSuccess && !activeEntitlementForOrder(order, selected.deviceEntitlements)) {
      addMacro(macros, "payment_no_entitlement", [order.id, order.paymentProviderEventId]);
    }
  }

  for (const callback of selected.refundCallbacks) {
    const order = selected.orders.find((item) => item.id === callback.orderId);
    const succeeded = REFUND_SUCCESS_STATUSES.has(callback.status);
    const orderNotRefunded = order && order.status !== "refunded" && callback.result !== "ignored";
    if (["failed", "order_not_found"].includes(callback.result) || (succeeded && orderNotRefunded)) {
      addMacro(macros, "refund_provider_mismatch", [callback.id, callback.providerEventId, callback.orderId]);
    }
  }

  for (const settlement of selected.settlements) {
    if (settlement.status === "refunded" || settlement.status === "frozen") {
      const refundCallback = selected.refundCallbacks.find((item) => item.orderId === settlement.orderId);
      if (refundCallback && settlement.status !== "refunded") {
        addMacro(macros, "refund_provider_mismatch", [settlement.id, refundCallback.providerEventId]);
      }
    }
  }

  for (const action of selected.moderationActions) {
    if (["delist", "freeze_store", "take_down", "limit_recommend"].includes(action.action)) {
      addMacro(macros, "takedown_legacy_use", [action.id, action.sourceId, action.targetId]);
    }
  }

  for (const claim of selected.rightsClaims) {
    addMacro(macros, "rights_claim_received", [claim.id, claim.targetId]);
  }

  for (const appeal of selected.appeals) {
    addMacro(macros, "appeal_received", [appeal.id, appeal.sourceActionId, appeal.targetId]);
  }

  for (const log of selected.operationLogs) {
    if (!hasValue(log.detail)) addMacro(macros, "operator_reason_missing", [log.id, log.targetId]);
  }

  return [...macros.values()].sort((left, right) => left.id.localeCompare(right.id));
}

function setField(fields, field, value) {
  if (!fields.has(field) && hasValue(value)) fields.set(field, value);
}

function buildAvailableFields(selected) {
  const fields = new Map();
  const firstDevice = selected.devices[0];
  const firstOrder = selected.orders[0];
  const firstEntitlement = selected.deviceEntitlements[0];
  const firstInstall = selected.deviceInstalls[0];
  const firstJob = selected.deviceSyncJobs[0];
  const firstPayment = selected.paymentCallbacks[0];
  const firstRefund = selected.refundCallbacks[0];
  const firstSettlement = selected.settlements[0];
  const firstReport = selected.reports[0];
  const firstClaim = selected.rightsClaims[0];
  const firstAppeal = selected.appeals[0];
  const firstAction = selected.moderationActions[0];
  const firstLog = selected.operationLogs[0];

  setField(fields, "deviceId", firstDevice?.id || firstJob?.deviceId || firstOrder?.deviceId || firstEntitlement?.deviceId);
  setField(fields, "batteryLevel", firstDevice?.battery);
  setField(fields, "firmwareVersion", firstDevice?.firmwareVersion || firstJob?.firmwareVersion || firstJob?.evidence?.transport?.firmwareVersion);
  setField(fields, "diagnosticCode", firstJob?.diagnosticCode || firstInstall?.diagnosticCode);
  setField(fields, "failureReason", firstJob?.failureReason || firstInstall?.failureReason);
  setField(fields, "rollbackStatus", firstJob?.rollbackStatus);
  setField(fields, "previousStoreId", firstJob?.previousStoreId);
  setField(fields, "storeId", firstOrder?.storeId || firstJob?.storeId || firstEntitlement?.storeId || firstInstall?.storeId || firstSettlement?.storeId);
  setField(fields, "hardwarePackId", firstOrder?.hardwarePackId || firstJob?.hardwarePackId || firstEntitlement?.hardwarePackId || firstSettlement?.hardwarePackId);
  setField(fields, "orderId", firstOrder?.id || firstPayment?.orderId || firstRefund?.orderId || firstEntitlement?.orderId || firstSettlement?.orderId);
  setField(fields, "providerEventId", firstPayment?.providerEventId || firstRefund?.providerEventId || firstOrder?.paymentProviderEventId || firstOrder?.refundProviderEventId);
  setField(fields, "providerPaymentId", firstPayment?.providerPaymentId || firstOrder?.providerPaymentId);
  setField(fields, "providerRefundId", firstRefund?.providerRefundId || firstOrder?.providerRefundId);
  setField(fields, "entitlementId", firstEntitlement?.id);
  setField(fields, "settlementId", firstSettlement?.id);
  setField(fields, "settlementStatus", firstSettlement?.status);
  setField(fields, "deviceInstall.status", firstInstall?.status);
  setField(fields, "storeStatus", firstAction?.action === "freeze_store" ? "frozen" : (firstAction?.action === "delist" ? "delisted" : null));
  setField(fields, "hardwarePack.status", firstAction?.action ? "review_action_taken" : null);
  setField(fields, "sourceCaseId", firstAction?.sourceId || firstAppeal?.sourceCaseId);
  setField(fields, "claimId", firstClaim?.id);
  setField(fields, "claimType", firstClaim?.claimType || firstClaim?.type || (firstClaim ? "rights" : null));
  setField(fields, "sourceEvidence", firstClaim?.sourceEvidence || firstClaim?.summary || firstReport?.description);
  setField(fields, "appealId", firstAppeal?.id);
  setField(fields, "sourceActionId", firstAppeal?.sourceActionId || firstAppeal?.sourceCaseId);
  setField(fields, "appellantUserId", firstAppeal?.appellantUserId || firstAppeal?.userId);
  setField(fields, "supplementalEvidence", firstAppeal?.supplementalEvidence || firstAppeal?.reason);
  setField(fields, "operationLogId", firstLog?.id);
  setField(fields, "operatorId", firstLog?.actorUserId);
  setField(fields, "targetType", firstReport?.targetType || firstClaim?.targetType || firstAppeal?.targetType || firstAction?.targetType || firstLog?.targetType);
  setField(fields, "targetId", firstReport?.targetId || firstClaim?.targetId || firstAppeal?.targetId || firstAction?.targetId || firstLog?.targetId);
  setField(fields, "missingReason", firstLog && !hasValue(firstLog.detail) ? "operation_log_detail_missing" : null);

  const transportEvents = firstJob?.evidence?.transport?.events || firstJob?.transport?.events;
  if (Array.isArray(transportEvents) && transportEvents.length) setField(fields, "transport.events", transportEvents);

  return fields;
}

function attachFieldCoverage(recommendedMacros, selected) {
  const fields = buildAvailableFields(selected);
  return recommendedMacros.map((macro) => {
    const missingFields = macro.requiredFields.filter((field) => !fields.has(field));
    return {
      ...macro,
      missingFields,
      ready: missingFields.length === 0,
    };
  });
}

function createSummary(records, selected, recommendedMacros, query) {
  return {
    queryFields: Object.keys(query),
    totalMatches: Object.values(selected).reduce((sum, items) => sum + items.length, 0),
    totalRecordsScanned: Object.values(records).reduce((sum, items) => sum + items.length, 0),
    failedSyncJobs: selected.deviceSyncJobs.filter((job) => SYNC_FAILURE_STATUSES.has(job.status)).length,
    openReports: selected.reports.filter((item) => !CLOSED_STATUSES.has(item.status)).length,
    openRightsClaims: selected.rightsClaims.filter((item) => !CLOSED_STATUSES.has(item.status)).length,
    openAppeals: selected.appeals.filter((item) => !CLOSED_STATUSES.has(item.status)).length,
    frozenSettlements: selected.settlements.filter((item) => item.status === "frozen").length,
    recommendedMacroIds: recommendedMacros.map((macro) => macro.id),
  };
}

export function createSupportDiagnosticBundle({
  runtimeState = {},
  query = {},
  requestId = "",
  now = Date.now(),
} = {}) {
  const normalizedQuery = normalizeSupportDiagnosticQuery(query);
  const records = buildRuntimeRecords(runtimeState);
  const ids = createSeedIds(normalizedQuery);
  const selected = selectRelatedRecords(records, ids, Object.keys(normalizedQuery).length === 0);
  const recommendedMacros = attachFieldCoverage(recommendMacros(selected), selected);

  return {
    schemaVersion: SUPPORT_DIAGNOSTIC_BUNDLE_VERSION,
    generatedAt: now,
    requestId,
    query: normalizedQuery,
    summary: createSummary(records, selected, recommendedMacros, normalizedQuery),
    records: clone(selected),
    recommendedMacros,
    missingFields: [...new Set(recommendedMacros.flatMap((macro) => macro.missingFields))],
  };
}

export function validateSupportDiagnosticBundle(bundle = {}) {
  const errors = [];
  if (bundle.schemaVersion !== SUPPORT_DIAGNOSTIC_BUNDLE_VERSION) {
    errors.push(`schemaVersion must be ${SUPPORT_DIAGNOSTIC_BUNDLE_VERSION}`);
  }
  if (!Number.isFinite(bundle.generatedAt)) errors.push("generatedAt must be a timestamp");
  if (!hasValue(bundle.requestId)) errors.push("requestId is required");
  if (!bundle.summary || typeof bundle.summary !== "object") errors.push("summary is required");
  if (!bundle.records || typeof bundle.records !== "object") errors.push("records is required");
  for (const key of Object.keys(buildRuntimeRecords())) {
    if (!Array.isArray(bundle.records?.[key])) errors.push(`records.${key} must be an array`);
  }
  for (const macro of asArray(bundle.recommendedMacros)) {
    if (!SUPPORT_DIAGNOSTIC_MACROS[macro.id]) errors.push(`unknown macro id ${macro.id}`);
    if (!Array.isArray(macro.requiredFields)) errors.push(`${macro.id}: requiredFields must be an array`);
    if (!Array.isArray(macro.missingFields)) errors.push(`${macro.id}: missingFields must be an array`);
    if (typeof macro.ready !== "boolean") errors.push(`${macro.id}: ready must be boolean`);
  }
  return errors;
}
