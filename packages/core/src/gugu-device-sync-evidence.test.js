import assert from "node:assert/strict";
import test from "node:test";

import {
  DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION,
  DEVICE_SYNC_REAL_DEVICE_EXTERNAL_ACCEPTANCE_IDS,
  DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS,
  assertValidDeviceSyncEvidence,
  createDeviceSyncEvidence,
  createFakeBleTransportContract,
  validateDeviceSyncEvidence,
  validateFakeBleTransportContract,
} from "./gugu-device-sync-evidence.js";

function makeSyncJob(overrides = {}) {
  return {
    id: "sync_123",
    deviceId: "device_123",
    deviceName: "测试吧唧",
    storeId: "store_h5_pack",
    packId: "h5_pack",
    hardwarePackId: "hw_h5_pack",
    status: "installed",
    failureReason: null,
    message: "同步完成。",
    diagnosticCode: "GFS-INSTALLED-ABCD",
    previousStoreId: null,
    retryOf: null,
    rollbackStatus: "not_needed",
    steps: ["created", "downloading", "downloaded", "syncing", "verifying", "installed"],
    clientVersion: "web-prototype",
    firmwareVersion: "1.2.3",
    bleProtocolVersion: "mock_ble_v1",
    createdAt: 1760000000000,
    updatedAt: 1760000001000,
    ...overrides,
  };
}

test("device sync evidence validates successful fake BLE sync jobs", () => {
  const evidence = createDeviceSyncEvidence(makeSyncJob());

  assert.deepEqual(validateDeviceSyncEvidence(evidence), []);
  assert.equal(assertValidDeviceSyncEvidence(evidence), evidence);
  assert.equal(evidence.schemaVersion, "gugu_device_sync_evidence_v1");
  assert.equal(evidence.transport.contractVersion, DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION);
  assert.equal(evidence.checkpoints.length, evidence.steps.length);
});

test("device sync evidence captures failure, rollback, retry, and diagnostic fields", () => {
  const evidence = createDeviceSyncEvidence(makeSyncJob({
    id: "sync_failed",
    status: "failed",
    failureReason: "write_failed",
    message: "写入失败，已恢复原内容。",
    diagnosticCode: "GFS-WRITE-FAILED-WXYZ",
    previousStoreId: "store_previous",
    retryOf: "sync_previous_failed",
    rollbackStatus: "restored_previous",
    steps: ["created", "downloading", "downloaded", "syncing", "failed"],
  }));

  assert.deepEqual(validateDeviceSyncEvidence(evidence), []);
  assert.equal(evidence.failureReason, "write_failed");
  assert.equal(evidence.rollbackStatus, "restored_previous");
  assert.equal(evidence.retryOf, "sync_previous_failed");
});

test("device sync evidence rejects unknown statuses, failure reasons, and missing transport data", () => {
  const evidence = createDeviceSyncEvidence(makeSyncJob({
    status: "teleported",
    failureReason: "mystery_failure",
    diagnosticCode: "BAD-CODE",
  }), {
    transport: {
      kind: "unknown_transport",
      contractVersion: "bad_contract",
      protocolVersion: "",
      clientVersion: "",
      firmwareVersion: "",
    },
  });
  const errors = validateDeviceSyncEvidence(evidence);

  assert.ok(errors.some((error) => error.includes("status is invalid")));
  assert.ok(errors.some((error) => error.includes("failureReason is invalid")));
  assert.ok(errors.some((error) => error.includes("diagnosticCode")));
  assert.ok(errors.some((error) => error.includes("transport.kind")));
  assert.ok(errors.some((error) => error.includes("transport.contractVersion")));
});

test("fake BLE transport contract exposes required events and failure injection points", () => {
  const contract = createFakeBleTransportContract();

  assert.deepEqual(validateFakeBleTransportContract(contract), []);
  assert.ok(contract.requiredEvents.includes("write_package"));
  assert.ok(contract.requiredEvents.includes("readback_current_package"));
  assert.ok(contract.failureInjectionReasons.includes("low_battery"));
  assert.ok(contract.failureInjectionReasons.includes("write_failed"));
});

test("real device matrix IDs cover Public MVP hardware acceptance", () => {
  assert.deepEqual(DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS, [
    "circle185_current_firmware_nominal",
    "circle185_low_battery_block",
    "circle185_low_storage_block",
    "circle185_ble_disconnect_retry",
    "circle185_write_failed_rollback",
    "circle185_verify_success",
    "circle185_legacy_delisted_use",
  ]);
  assert.deepEqual(DEVICE_SYNC_REAL_DEVICE_EXTERNAL_ACCEPTANCE_IDS, [
    "two_physical_devices",
    "firmware_spread",
    "real_ble_session_capture",
    "hardware_lead_signoff",
  ]);
});
