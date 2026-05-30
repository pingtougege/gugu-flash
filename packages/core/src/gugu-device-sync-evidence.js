export const DEVICE_SYNC_EVIDENCE_VERSION = "gugu_device_sync_evidence_v1";
export const DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION = "fake_ble_transport_v1";

export const DEVICE_SYNC_JOB_STATUSES = [
  "created",
  "compatibility_checking",
  "blocked",
  "downloading",
  "downloaded",
  "checksum_failed",
  "syncing",
  "verifying",
  "installed",
  "failed",
  "rollback_required",
  "cancelled",
];

export const DEVICE_SYNC_FAILURE_REASONS = [
  "device_offline",
  "ble_disconnected",
  "firmware_too_low",
  "unsupported_device_model",
  "insufficient_storage",
  "low_battery",
  "download_failed",
  "checksum_failed",
  "package_expired",
  "entitlement_missing",
  "hardware_pack_unavailable",
  "write_failed",
  "verify_failed",
  "timeout",
  "unknown",
];

export const DEVICE_SYNC_ROLLBACK_STATUSES = [
  "not_needed",
  "restored_previous",
  "no_previous_content",
  "rollback_required",
  "rollback_failed",
];

export const DEVICE_SYNC_FAKE_TRANSPORT_EVENTS = [
  "connect",
  "read_capability",
  "download_package",
  "verify_checksum",
  "write_package",
  "activate_package",
  "readback_current_package",
  "rollback_previous_package",
  "disconnect",
];

export const DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS = [
  "circle185_current_firmware_nominal",
  "circle185_low_battery_block",
  "circle185_low_storage_block",
  "circle185_ble_disconnect_retry",
  "circle185_write_failed_rollback",
  "circle185_verify_success",
  "circle185_legacy_delisted_use",
];

export const DEVICE_SYNC_REAL_DEVICE_EXTERNAL_ACCEPTANCE_IDS = [
  "two_physical_devices",
  "firmware_spread",
  "real_ble_session_capture",
  "hardware_lead_signoff",
];

export const DEVICE_SYNC_EVIDENCE_REQUIRED_FIELDS = [
  "schemaVersion",
  "jobId",
  "deviceId",
  "storeId",
  "packId",
  "hardwarePackId",
  "status",
  "diagnosticCode",
  "rollbackStatus",
  "steps",
  "transport",
  "createdAt",
  "updatedAt",
];

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function makeCheckpoints(syncJob) {
  const steps = Array.isArray(syncJob.steps) && syncJob.steps.length ? syncJob.steps : [syncJob.status].filter(Boolean);
  return steps.map((status, index) => ({
    status,
    order: index + 1,
    at: index === steps.length - 1 ? syncJob.updatedAt : syncJob.createdAt || syncJob.updatedAt,
  }));
}

export function createFakeBleTransportContract(overrides = {}) {
  return {
    kind: "fake_ble",
    version: DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION,
    requiredEvents: DEVICE_SYNC_FAKE_TRANSPORT_EVENTS,
    failureInjectionReasons: DEVICE_SYNC_FAILURE_REASONS,
    requiredReadbacks: ["deviceId", "firmwareVersion", "currentStoreId", "currentHardwarePackId", "checksum"],
    preservesPreviousContentOnFailure: true,
    supportsRetryOf: true,
    supportsRollbackEvidence: true,
    ...overrides,
  };
}

export function validateFakeBleTransportContract(contract = {}) {
  const errors = [];
  if (contract.kind !== "fake_ble") errors.push("transport.kind must be fake_ble");
  if (contract.version !== DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION) {
    errors.push(`transport.version must be ${DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION}`);
  }
  for (const event of DEVICE_SYNC_FAKE_TRANSPORT_EVENTS) {
    if (!Array.isArray(contract.requiredEvents) || !contract.requiredEvents.includes(event)) {
      errors.push(`transport.requiredEvents missing ${event}`);
    }
  }
  for (const reason of ["low_battery", "write_failed", "checksum_failed", "ble_disconnected"]) {
    if (!Array.isArray(contract.failureInjectionReasons) || !contract.failureInjectionReasons.includes(reason)) {
      errors.push(`transport.failureInjectionReasons missing ${reason}`);
    }
  }
  if (contract.preservesPreviousContentOnFailure !== true) errors.push("transport must preserve previous content on failure");
  if (contract.supportsRetryOf !== true) errors.push("transport must support retryOf evidence");
  if (contract.supportsRollbackEvidence !== true) errors.push("transport must support rollback evidence");
  return errors;
}

export function createDeviceSyncEvidence(syncJob = {}, overrides = {}) {
  const transport = {
    kind: "fake_ble",
    contractVersion: DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION,
    protocolVersion: syncJob.bleProtocolVersion || "mock_ble_v1",
    clientVersion: syncJob.clientVersion || "web-prototype",
    firmwareVersion: syncJob.firmwareVersion || "unknown",
    ...(overrides.transport || {}),
  };
  const evidence = {
    schemaVersion: DEVICE_SYNC_EVIDENCE_VERSION,
    jobId: syncJob.id,
    deviceId: syncJob.deviceId,
    deviceName: syncJob.deviceName || null,
    storeId: syncJob.storeId,
    packId: syncJob.packId,
    hardwarePackId: syncJob.hardwarePackId,
    status: syncJob.status,
    failureReason: syncJob.failureReason || null,
    message: syncJob.message || "",
    diagnosticCode: syncJob.diagnosticCode,
    previousStoreId: syncJob.previousStoreId || null,
    retryOf: syncJob.retryOf || null,
    rollbackStatus: syncJob.rollbackStatus || "not_needed",
    steps: Array.isArray(syncJob.steps) ? [...syncJob.steps] : [],
    checkpoints: makeCheckpoints(syncJob),
    transport,
    createdAt: syncJob.createdAt,
    updatedAt: syncJob.updatedAt,
  };
  return {
    ...evidence,
    ...overrides,
    transport,
  };
}

export function validateDeviceSyncEvidence(evidence = {}) {
  const errors = [];

  for (const field of DEVICE_SYNC_EVIDENCE_REQUIRED_FIELDS) {
    if (!hasValue(evidence[field])) errors.push(`evidence.${field} is required`);
  }
  if (evidence.schemaVersion !== DEVICE_SYNC_EVIDENCE_VERSION) {
    errors.push(`evidence.schemaVersion must be ${DEVICE_SYNC_EVIDENCE_VERSION}`);
  }
  if (!DEVICE_SYNC_JOB_STATUSES.includes(evidence.status)) {
    errors.push(`evidence.status is invalid: ${evidence.status}`);
  }
  if (evidence.failureReason && !DEVICE_SYNC_FAILURE_REASONS.includes(evidence.failureReason)) {
    errors.push(`evidence.failureReason is invalid: ${evidence.failureReason}`);
  }
  if (["failed", "blocked", "rollback_required", "checksum_failed"].includes(evidence.status) && !evidence.failureReason) {
    errors.push("evidence.failureReason is required for failed or blocked sync jobs");
  }
  if (evidence.status === "installed" && evidence.failureReason) {
    errors.push("evidence.failureReason must be empty for installed sync jobs");
  }
  if (!DEVICE_SYNC_ROLLBACK_STATUSES.includes(evidence.rollbackStatus)) {
    errors.push(`evidence.rollbackStatus is invalid: ${evidence.rollbackStatus}`);
  }
  if (!/^GFS-[A-Z0-9-]+-[A-Z0-9]+$/.test(String(evidence.diagnosticCode || ""))) {
    errors.push("evidence.diagnosticCode must use GFS-* diagnostic format");
  }
  if (!Array.isArray(evidence.steps) || !evidence.steps.length) {
    errors.push("evidence.steps must include at least one step");
  } else if (evidence.status && !evidence.steps.includes(evidence.status)) {
    errors.push("evidence.steps must include the final status");
  }
  if (!Array.isArray(evidence.checkpoints) || evidence.checkpoints.length !== (evidence.steps || []).length) {
    errors.push("evidence.checkpoints must match steps");
  }

  const transport = evidence.transport || {};
  if (transport.kind !== "fake_ble") errors.push("evidence.transport.kind must be fake_ble");
  if (transport.contractVersion !== DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION) {
    errors.push(`evidence.transport.contractVersion must be ${DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION}`);
  }
  for (const field of ["protocolVersion", "clientVersion", "firmwareVersion"]) {
    if (!hasValue(transport[field])) errors.push(`evidence.transport.${field} is required`);
  }

  return errors;
}

export function assertValidDeviceSyncEvidence(evidence) {
  const errors = validateDeviceSyncEvidence(evidence);
  if (errors.length) throw new Error(errors.join("\n"));
  return evidence;
}
