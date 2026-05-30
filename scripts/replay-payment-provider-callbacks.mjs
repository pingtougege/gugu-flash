import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createFlashHttpServer,
  createPaymentCallbackSignature,
} from "../apps/backend/src/flash-http-server.js";
import { createHttpFlashApi } from "../packages/api-client/src/http-flash-api.js";

const REPLAY_VERSION = "gugu_flash_payment_provider_replay_v1";

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function postRaw(baseUrl, path, body = {}, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function createListedHttpWork(api, prompt) {
  const draft = await api.createDraft(prompt, "gentle", {
    originType: "original",
    ipId: "rain_gugu_universe",
    personaId: "rain_gugu",
  });
  const published = await api.publishDraft(draft.item);
  await api.applyStoreListing(published.item.id, true);
  for (let index = 0; index < 4; index += 1) await api.approveStoreListing(published.item.id);
  return (await api.getWork(published.item.id)).item;
}

async function createPendingPaymentOrder(api, prompt) {
  for (let index = 0; index < 5; index += 1) {
    const work = await createListedHttpWork(api, `${prompt} ${index + 1}`);
    const dashboard = await api.getDeviceDashboard();
    const item = dashboard.library.find((entry) => entry.packId === work.id);
    if (!item || item.price <= 0) continue;
    const order = await api.createOrder(item.id);
    if (order.item?.status === "pending_payment") return { work, item, order: order.item };
  }
  throw new Error("could_not_create_pending_payment_order");
}

function paymentPayload(order, fields = {}) {
  const payload = {
    providerEventId: fields.providerEventId,
    providerPaymentId: fields.providerPaymentId,
    orderId: order.id,
    status: fields.status || "succeeded",
    amount: fields.amount ?? order.amount,
    currency: fields.currency || order.currency,
    provider: fields.provider || "mock_pay",
    reason: fields.reason || "provider_replay",
  };
  return {
    ...payload,
    signature: createPaymentCallbackSignature(payload),
  };
}

function scenario(id, result, evidence = {}) {
  return { id, result, evidence };
}

const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-payment-replay-"));
const dataPath = join(tempDir, "packs.json");
const statePath = join(tempDir, "runtime-state.json");
const { server } = createFlashHttpServer({ dataPath, statePath });
const baseUrl = await listen(server);
const api = createHttpFlashApi({ baseUrl });
const scenarios = [];

try {
  const successOrder = (await createPendingPaymentOrder(api, "Payment replay success")).order;
  const invalid = await postRaw(baseUrl, "/flash/operator/payment-callbacks", {
    ...paymentPayload(successOrder, {
      providerEventId: "evt_replay_invalid_signature",
      providerPaymentId: "pay_replay_invalid_signature",
    }),
    signature: "sha256=bad-signature",
  });
  assert.equal(invalid.code, 400);
  assert.equal(invalid.message, "invalid_payment_signature");
  scenarios.push(scenario("payment_provider_invalid_signature", "invalid_payment_signature", {
    httpCode: invalid.code,
  }));

  const successPayload = paymentPayload(successOrder, {
    providerEventId: "evt_replay_payment_success",
    providerPaymentId: "pay_replay_success",
  });
  const success = await api.processPaymentCallback(successPayload);
  const duplicate = await api.processPaymentCallback(successPayload);
  const paidOrder = await api.getOrder(successOrder.id);
  assert.equal(success.item.result, "paid");
  assert.equal(success.order.status, "paid");
  assert.equal(success.entitlement.status, "active");
  assert.equal(duplicate.idempotent, true);
  assert.equal(duplicate.item.id, success.item.id);
  assert.equal(paidOrder.item.status, "paid");
  scenarios.push(scenario("payment_provider_sandbox_success", "paid_entitlement_granted", {
    providerEventId: successPayload.providerEventId,
    orderId: successOrder.id,
    entitlementId: success.entitlement.id,
  }));
  scenarios.push(scenario("payment_provider_duplicate_event", "idempotent_same_event", {
    providerEventId: successPayload.providerEventId,
    callbackId: duplicate.item.id,
  }));

  const mismatchOrder = (await createPendingPaymentOrder(api, "Payment replay mismatch")).order;
  const mismatchPayload = paymentPayload(mismatchOrder, {
    providerEventId: "evt_replay_amount_mismatch",
    providerPaymentId: "pay_replay_mismatch",
    amount: mismatchOrder.amount + 10,
  });
  const mismatch = await api.processPaymentCallback(mismatchPayload);
  const mismatchOrderAfter = await api.getOrder(mismatchOrder.id);
  assert.equal(mismatch.blocked, true);
  assert.equal(mismatch.reason, "amount_mismatch");
  assert.equal(mismatch.entitlement, undefined);
  assert.equal(mismatchOrderAfter.item.status, "pending_payment");
  scenarios.push(scenario("payment_provider_amount_mismatch", "blocked_no_entitlement", {
    providerEventId: mismatchPayload.providerEventId,
    orderId: mismatchOrder.id,
  }));

  const failedOrder = (await createPendingPaymentOrder(api, "Payment replay failed")).order;
  const failedPayload = paymentPayload(failedOrder, {
    providerEventId: "evt_replay_payment_failed",
    providerPaymentId: "pay_replay_failed",
    status: "failed",
    reason: "card_declined",
  });
  const failed = await api.processPaymentCallback(failedPayload);
  assert.equal(failed.item.result, "failed");
  assert.equal(failed.order.status, "failed");
  assert.equal(failed.entitlement, null);
  scenarios.push(scenario("payment_provider_failed_payment", "failed_no_entitlement", {
    providerEventId: failedPayload.providerEventId,
    orderId: failedOrder.id,
  }));

  const refund = await api.processRefundCallback({
    providerEventId: "evt_replay_refund_success",
    providerRefundId: "refund_replay_success",
    orderId: successOrder.id,
    status: "succeeded",
    reason: "replay_refund_success",
  });
  const duplicateRefund = await api.processRefundCallback({
    providerEventId: "evt_replay_refund_success",
    providerRefundId: "refund_replay_success",
    orderId: successOrder.id,
    status: "succeeded",
    reason: "replay_refund_duplicate",
  });
  const operationLogs = await api.getOperationLogs();
  assert.equal(refund.item.result, "refunded");
  assert.equal(refund.order.status, "refunded");
  assert.equal(refund.entitlement.status, "revoked");
  assert.equal(duplicateRefund.idempotent, true);
  assert.equal(duplicateRefund.item.id, refund.item.id);
  assert.equal(operationLogs.items.filter((log) => log.action === "refund_order" && log.targetId === successOrder.id).length, 1);
  scenarios.push(scenario("payment_provider_refund_success", "refunded_entitlement_revoked", {
    providerEventId: "evt_replay_refund_success",
    orderId: successOrder.id,
    entitlementId: refund.entitlement.id,
  }));
  scenarios.push(scenario("payment_provider_refund_duplicate", "idempotent_same_refund_event", {
    providerEventId: "evt_replay_refund_success",
    callbackId: duplicateRefund.item.id,
  }));

  const summary = {
    version: REPLAY_VERSION,
    status: "passed",
    scenarioCount: scenarios.length,
    scenarios,
  };
  console.log(JSON.stringify(summary, null, 2));
} finally {
  await close(server);
  await rm(tempDir, { recursive: true, force: true });
}
