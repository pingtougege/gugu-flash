import assert from "node:assert/strict";
import test from "node:test";

import {
  SUPPORT_DIAGNOSTIC_BUNDLE_VERSION,
  SUPPORT_DIAGNOSTIC_MACROS,
  SUPPORT_DIAGNOSTIC_QUERY_FIELDS,
  createSupportDiagnosticBundle,
  validateSupportDiagnosticBundle,
} from "./support-diagnostics.js";

test("support diagnostic bundle links payment, entitlement, sync, and governance evidence", () => {
  const bundle = createSupportDiagnosticBundle({
    now: 1767225600000,
    requestId: "req_support_diag_001",
    query: {
      orderId: "order_001",
      providerEventId: "evt_paid_001",
      syncJobId: "sync_001",
      targetId: "work_001",
    },
    runtimeState: {
      devices: [
        { id: "badge_s3_01", name: "Closed Beta Badge", battery: 76, firmwareVersion: "1.2.3" },
      ],
      orders: [
        {
          id: "order_001",
          deviceId: "badge_s3_01",
          storeId: "store_001",
          hardwarePackId: "hw_001",
          status: "paid",
          providerPaymentId: "pay_001",
          paymentProviderEventId: "evt_paid_001",
        },
      ],
      deviceEntitlements: {
        badge_s3_01: {
          store_001: {
            id: "entitlement_001",
            orderId: "order_001",
            deviceId: "badge_s3_01",
            storeId: "store_001",
            hardwarePackId: "hw_001",
            status: "active",
          },
        },
      },
      deviceInstalls: {
        badge_s3_01: {
          store_001: {
            id: "install_001",
            deviceId: "badge_s3_01",
            storeId: "store_001",
            hardwarePackId: "hw_001",
            status: "failed",
          },
        },
      },
      deviceSyncJobs: [
        {
          id: "sync_001",
          deviceId: "badge_s3_01",
          storeId: "store_001",
          hardwarePackId: "hw_001",
          status: "failed",
          failureReason: "write_failed",
          rollbackStatus: "restored_previous",
          diagnosticCode: "GFS-WRITE-FAILED-ABCD",
          previousStoreId: "store_previous",
          firmwareVersion: "1.2.3",
          evidence: { transport: { firmwareVersion: "1.2.3", events: ["connect", "write_package", "rollback_previous_package"] } },
        },
      ],
      paymentCallbacks: [
        {
          id: "payment_callback_evt_paid_001",
          providerEventId: "evt_paid_001",
          providerPaymentId: "pay_001",
          orderId: "order_001",
          status: "succeeded",
          result: "paid",
        },
      ],
      reports: [
        { id: "report_001", targetType: "Work", targetId: "work_001", status: "open", description: "Legacy use question." },
      ],
      rightsClaims: [
        { id: "claim_001", targetType: "Work", targetId: "work_001", status: "action_taken", summary: "Rights owner evidence." },
      ],
      moderationActions: [
        { id: "mod_001", sourceId: "claim_001", action: "freeze_store", targetType: "Work", targetId: "work_001" },
      ],
      operationLogs: [
        { id: "op_001", actorUserId: "operator_001", action: "freeze_store", targetType: "Work", targetId: "work_001", detail: "" },
      ],
    },
  });

  assert.equal(bundle.schemaVersion, SUPPORT_DIAGNOSTIC_BUNDLE_VERSION);
  assert.deepEqual(validateSupportDiagnosticBundle(bundle), []);
  assert.equal(bundle.query.orderId, "order_001");
  assert.equal(bundle.records.orders[0].id, "order_001");
  assert.equal(bundle.records.deviceEntitlements[0].id, "entitlement_001");
  assert.ok(bundle.records.deviceSyncJobs.some((job) => job.id === "sync_001"));
  assert.ok(bundle.records.paymentCallbacks.some((callback) => callback.providerEventId === "evt_paid_001"));
  assert.ok(bundle.records.rightsClaims.some((claim) => claim.id === "claim_001"));
  assert.ok(bundle.summary.recommendedMacroIds.includes("sync_write_failed"));
  assert.ok(bundle.summary.recommendedMacroIds.includes("rights_claim_received"));
  assert.ok(bundle.summary.recommendedMacroIds.includes("takedown_legacy_use"));
  assert.ok(bundle.summary.recommendedMacroIds.includes("operator_reason_missing"));
  assert.equal(bundle.recommendedMacros.find((macro) => macro.id === "sync_write_failed").ready, true);
});

test("support diagnostic bundle flags payment success without entitlement", () => {
  const bundle = createSupportDiagnosticBundle({
    requestId: "req_support_diag_002",
    query: { providerEventId: "evt_paid_missing_entitlement" },
    runtimeState: {
      orders: [
        {
          id: "order_missing_entitlement",
          deviceId: "badge_s3_02",
          storeId: "store_missing",
          hardwarePackId: "hw_missing",
          status: "paid",
          providerPaymentId: "pay_missing",
          paymentProviderEventId: "evt_paid_missing_entitlement",
        },
      ],
      paymentCallbacks: [
        {
          id: "payment_callback_evt_paid_missing_entitlement",
          providerEventId: "evt_paid_missing_entitlement",
          providerPaymentId: "pay_missing",
          orderId: "order_missing_entitlement",
          status: "succeeded",
          result: "paid",
        },
      ],
      deviceEntitlements: { badge_s3_02: {} },
    },
  });

  const macro = bundle.recommendedMacros.find((item) => item.id === "payment_no_entitlement");
  assert.ok(macro);
  assert.equal(macro.owner, SUPPORT_DIAGNOSTIC_MACROS.payment_no_entitlement.owner);
  assert.deepEqual(macro.missingFields, []);
  assert.equal(bundle.summary.failedSyncJobs, 0);
});

test("support diagnostic validation rejects malformed bundles", () => {
  assert.ok(SUPPORT_DIAGNOSTIC_QUERY_FIELDS.includes("providerEventId"));
  assert.ok(validateSupportDiagnosticBundle({}).some((error) => error.includes("schemaVersion")));
});
