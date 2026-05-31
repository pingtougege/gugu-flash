import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  createFlashHttpServer,
  createPaymentCallbackSignature,
} from "../../../apps/backend/src/flash-http-server.js";
import { createIdentityToken } from "../../../apps/backend/src/flash-identity-token.js";
import { createHttpFlashApi } from "./http-flash-api.js";

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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createListedHttpWork(api, prompt = "HTTP 发布测试") {
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

async function createPendingPaymentHttpOrder(api, prompt = "HTTP 支付回调测试") {
  for (let index = 0; index < 4; index += 1) {
    const work = await createListedHttpWork(api, `${prompt} ${index + 1}`);
    const dashboard = await api.getDeviceDashboard();
    const item = dashboard.library.find((entry) => entry.packId === work.id);
    if (!item || item.price <= 0) continue;
    const order = await api.createOrder(item.id);
    if (order.item?.status === "pending_payment") return { work, item, order };
  }
  throw new Error("could_not_create_pending_payment_order");
}

async function withHttpApi(prefix, callback) {
  const tempDir = await mkdtemp(join(tmpdir(), prefix));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  const { server } = createFlashHttpServer({ dataPath, statePath });
  const baseUrl = await listen(server);
  const api = createHttpFlashApi({ baseUrl });

  try {
    await callback(api, baseUrl, { tempDir, dataPath, statePath });
  } finally {
    await close(server);
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function postRaw(baseUrl, path, body = {}, headers = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  }).then((response) => response.json());
}

async function readJsonFileEventually(path) {
  let lastError = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      const raw = await readFile(path, "utf8");
      if (raw.trim()) return JSON.parse(raw);
    } catch (error) {
      lastError = error;
    }
    await delay(5);
  }
  if (lastError) throw lastError;
  return JSON.parse(await readFile(path, "utf8"));
}

test("HTTP backend alpha exposes the release-critical mock facade flow", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-api-"));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  const { server } = createFlashHttpServer({ dataPath, statePath });
  const baseUrl = await listen(server);
  const api = createHttpFlashApi({ baseUrl });

  try {
    const health = await fetch(`${baseUrl}/flash/health`).then((response) => response.json());
    assert.equal(health.code, 200);
    assert.equal(health.data.status, "ok");

    const feed = await api.getFeed();
    assert.ok(feed.items.length >= 3);

    const draft = await api.createDraft("HTTP 后端 Alpha 小剧场", "gentle", {
      originType: "original",
      ipId: "rain_gugu_universe",
      personaId: "rain_gugu",
    });
    assert.equal(draft.item.title, "HTTP");

    const published = await api.publishDraft(draft.item);
    assert.equal(published.item.status, "public_h5");

    const applied = await api.applyStoreListing(published.item.id, true);
    assert.equal(applied.accepted, true);

    for (let index = 0; index < 4; index += 1) {
      await api.approveStoreListing(published.item.id);
    }

    const dashboard = await api.getDeviceDashboard();
    const storeItem = dashboard.library.find((item) => item.packId === published.item.id);
    assert.ok(storeItem);
    assert.equal(storeItem.syncStatus, "not_synced");

    const purchased = await api.purchaseBadgePack(storeItem.id);
    assert.equal(purchased.item.ownership, "owned");
    assert.ok(purchased.order.id);

    const downloaded = await api.downloadBadgePack(storeItem.id);
    assert.equal(downloaded.item.downloadStatus, "downloaded");

    const synced = await api.syncBadgePack(storeItem.id);
    assert.equal(synced.item.syncStatus, "synced");

    const orders = await api.getOrders();
    assert.ok(orders.items.some((order) => order.id === purchased.order.id));
  } finally {
    await close(server);
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("HTTP backend alpha exposes per-IP anime character deep collection", async () => {
  await withHttpApi("gugu-flash-api-http-anime-characters-", async (api) => {
    const preview = await api.searchAnimeIpCharacters("mainstream_pokemon");
    assert.ok(preview.characterCount >= 1000);
    assert.ok(preview.item.personas.some((persona) => persona.id === "pokemon_lucario"));

    const result = await api.collectAnimeIpCharacters("mainstream_pokemon");
    assert.equal(result.supplementedIpCount, 1);
    assert.ok(result.addedPersonaCount >= 1000);

    const pool = await api.getIpPool({ query: "路卡利欧" });
    assert.equal(pool.items[0].id, "mainstream_pokemon");
    assert.ok(pool.items[0].personas.some((persona) => persona.id === "pokemon_lucario"));
    const lateDexPool = await api.getIpPool({ query: "铁臂膀" });
    assert.equal(lateDexPool.items[0].id, "mainstream_pokemon");
  });
});

test("HTTP backend alpha sends security headers and rejects oversized JSON bodies", async () => {
  await withHttpApi("gugu-flash-api-http-security-", async (_api, baseUrl) => {
    const healthResponse = await fetch(`${baseUrl}/flash/health`);
    const health = await healthResponse.json();
    const oversized = await fetch(`${baseUrl}/flash/drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "x".repeat(300 * 1024), template: "gentle" }),
    }).then((response) => response.json());

    assert.equal(health.code, 200);
    assert.equal(healthResponse.headers.get("x-content-type-options"), "nosniff");
    assert.equal(healthResponse.headers.get("x-frame-options"), "DENY");
    assert.equal(healthResponse.headers.get("referrer-policy"), "no-referrer");
    assert.match(healthResponse.headers.get("content-security-policy"), /default-src 'none'/);
    assert.match(healthResponse.headers.get("permissions-policy"), /camera=\(\)/);
    assert.equal(oversized.code, 413);
    assert.equal(oversized.message, "payload_too_large");
  });
});

test("HTTP backend alpha enforces asset upload security policy", async () => {
  await withHttpApi("gugu-flash-api-http-asset-security-", async (api, baseUrl, { statePath }) => {
    const safeAsset = await api.createAsset({
      filename: "cover.png",
      mediaType: "image/png",
      sizeBytes: 128 * 1024,
      sourceUrl: "https://cdn.example.test/cover.png",
      sourceStatement: {
        sourceType: "original",
        creatorUserId: "user_local",
        rightsAcknowledged: true,
      },
    });
    const invalidAsset = await postRaw(baseUrl, "/flash/assets", {
      filename: "payload.svg",
      mediaType: "image/svg+xml",
      sizeBytes: 9 * 1024 * 1024,
      sourceUrl: "http://127.0.0.1/payload.svg",
      sourceStatement: {
        sourceType: "licensed",
        rightsAcknowledged: false,
      },
    });
    const badSourceStatement = await fetch(`${baseUrl}/flash/assets/${safeAsset.item.id}/source-statement`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceType: "original",
        creatorName: "Creator",
        rightsAcknowledged: true,
        note: "微信交易 vx123",
      }),
    }).then((response) => response.json());
    const updatedStatement = await api.updateAssetSourceStatement(safeAsset.item.id, {
      sourceType: "original",
      creatorName: "Creator",
      rightsAcknowledged: true,
      note: "owned source file",
    });
    const fetched = await api.getAsset(safeAsset.item.id);
    const listed = await api.listAssets({ status: safeAsset.item.status });
    const review = await api.submitAssetReview(safeAsset.item.id);
    const state = await readJsonFileEventually(statePath);

    assert.equal(safeAsset.item.securityPolicyVersion, "gugu_flash_asset_security_v1");
    assert.equal(safeAsset.item.securityReport.status, "passed");
    assert.equal(fetched.item.id, safeAsset.item.id);
    assert.ok(listed.items.some((item) => item.id === safeAsset.item.id));
    assert.equal(updatedStatement.item.sourceStatement.sourceType, "original");
    assert.equal(updatedStatement.item.sourceStatementStatus, "accepted");
    assert.equal(invalidAsset.code, 400);
    assert.equal(invalidAsset.message, "asset_security_violation");
    assert.equal(badSourceStatement.code, 400);
    assert.equal(badSourceStatement.message, "asset_source_statement_invalid");
    assert.equal(review.item.status, "open");
    assert.ok(review.item.requiredChecks.includes("malware_scan"));
    assert.ok(state.assets.some((item) => item.id === safeAsset.item.id));
  });
});

test("HTTP backend alpha exposes a deployment readiness probe", async () => {
  await withHttpApi("gugu-flash-api-http-readiness-", async (api, baseUrl, { dataPath, statePath }) => {
    const readyResponse = await fetch(`${baseUrl}/flash/ready`, {
      headers: { "X-Request-Id": "req_test_readiness_001" },
    });
    const ready = await readyResponse.json();
    const readyFromClient = await api.getReadiness();

    assert.equal(ready.code, 200);
    assert.equal(ready.data.status, "ready");
    assert.equal(ready.data.requestId, "req_test_readiness_001");
    assert.equal(ready.data.checks.api, "ok");
    assert.equal(ready.data.checks.runtimeState, "ok");
    assert.equal(ready.data.checks.persistence, "json_alpha");
    assert.equal(ready.data.checks.securityHeaders, "ok");
    assert.equal(ready.data.deployment.dataPath, dataPath);
    assert.equal(ready.data.deployment.statePath, statePath);
    assert.equal(readyResponse.headers.get("x-gugu-request-id"), "req_test_readiness_001");
    assert.equal(readyFromClient.status, "ready");
  });
});

test("HTTP backend alpha exposes request ids and operator ops metrics", async () => {
  await withHttpApi("gugu-flash-api-http-ops-metrics-", async (api, baseUrl) => {
    const healthResponse = await fetch(`${baseUrl}/flash/health`, {
      headers: { "X-Request-Id": "req_test_observability_001" },
    });
    const health = await healthResponse.json();
    await api.getFeed();
    const metrics = await api.getOperatorOpsMetrics();

    assert.equal(health.data.requestId, "req_test_observability_001");
    assert.equal(healthResponse.headers.get("x-gugu-request-id"), "req_test_observability_001");
    assert.equal(healthResponse.headers.get("x-gugu-service"), "gugu-flash-backend-alpha");
    assert.equal(metrics.status, "ok");
    assert.equal(metrics.service, "gugu-flash-backend-alpha");
    assert.ok(metrics.uptimeMs >= 0);
    assert.ok(metrics.requests.total >= 2);
    assert.ok(metrics.requests.byPath["/flash/health"] >= 1);
    assert.ok(metrics.requests.byPath["/flash/feed"] >= 1);
    assert.ok(metrics.requests.byStatusCode[200] >= 2);
    assert.equal(metrics.healthChecks.api, "ok");
    assert.equal(metrics.healthChecks.persistence, "json_alpha");
    assert.equal(metrics.alertInputs.fiveHundredCount, 0);
    assert.equal(metrics.alertInputs.authDeniedCount, 0);
    assert.equal(Array.isArray(metrics.alerts), true);
  });
});

test("HTTP backend alpha exposes active alert inputs for auth and device sync failures", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-api-http-alert-inputs-"));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  const { server } = createFlashHttpServer({
    dataPath,
    statePath,
    requireAuth: true,
    operatorInviteSecret: "closed-beta-invite",
  });
  const baseUrl = await listen(server);

  try {
    await fetch(`${baseUrl}/flash/drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "missing auth" }),
    });
    await fetch(`${baseUrl}/flash/operator/dashboard`, {
      headers: { Authorization: "Bearer demo-user" },
    });
    await fetch(`${baseUrl}/flash/operator/ops-metrics`, {
      headers: { Authorization: "Bearer demo-operator" },
    });

    const baseApi = createHttpFlashApi({ baseUrl });
    const login = await baseApi.login({ username: "operator-session", role: "operator", operatorInviteCode: "closed-beta-invite" });
    const api = createHttpFlashApi({ baseUrl, token: login.accessToken });
    const work = await createListedHttpWork(api, "HTTP 监控告警输入");
    const dashboard = await api.getDeviceDashboard();
    const item = dashboard.library.find((entry) => entry.packId === work.id);
    await api.purchaseBadgePack(item.id);
    await api.downloadBadgePack(item.id);
    await api.syncBadgePack(item.id, { forceFailureReason: "write_failed" });

    const metrics = await api.getOperatorOpsMetrics();
    assert.ok(metrics.alertInputs.authDeniedCount >= 2);
    assert.ok(metrics.alertInputs.syncFailureCount >= 1);
    assert.ok(metrics.alerts.some((alert) => alert.id === "sync_failure_spike"));
  } finally {
    await close(server);
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("HTTP backend alpha enforces delist and sync failure release rules", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-api-risk-"));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  const { server } = createFlashHttpServer({ dataPath, statePath });
  const baseUrl = await listen(server);
  const api = createHttpFlashApi({ baseUrl });

  try {
    const work = await createListedHttpWork(api, "下架低电量测试");
    let dashboard = await api.getDeviceDashboard();
    let storeItem = dashboard.library.find((item) => item.packId === work.id);

    await api.purchaseBadgePack(storeItem.id);
    await api.downloadBadgePack(storeItem.id);
    await api.syncBadgePack(storeItem.id);

    await api.delistStoreListing(work.id, "发布前验证下架保留使用权。");
    dashboard = await api.getDeviceDashboard();
    storeItem = dashboard.library.find((item) => item.packId === work.id);
    assert.equal(storeItem.syncStatus, "synced");
    assert.equal(storeItem.legacyUsable, true);

    const lowBatteryDevice = await api.bindDevice({
      name: "低电量测试吧唧",
      personaId: "rain_gugu",
      battery: 5,
    });
    assert.equal(lowBatteryDevice.item.battery, 5);
    dashboard = await api.getDeviceDashboard();
    assert.equal(dashboard.library.some((item) => item.packId === work.id), false);

    const blockedPurchase = await api.purchaseBadgePack(storeItem.id);
    assert.equal(blockedPurchase.blocked, true);
    assert.equal(blockedPurchase.reason, "hardware_pack_unavailable");

    const secondWork = await createListedHttpWork(api, "低电量同步测试");
    dashboard = await api.getDeviceDashboard();
    const secondStoreItem = dashboard.library.find((item) => item.packId === secondWork.id);
    await api.purchaseBadgePack(secondStoreItem.id);
    await api.downloadBadgePack(secondStoreItem.id);
    const blockedSync = await api.syncBadgePack(secondStoreItem.id);
    assert.equal(blockedSync.blocked, true);
    assert.equal(blockedSync.reason, "low_battery");
    assert.match(blockedSync.syncJob.diagnosticCode, /^GFS-LOW-BATTERY-/);
  } finally {
    await close(server);
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("HTTP backend alpha covers comment governance and moderation actions", async () => {
  await withHttpApi("gugu-flash-api-http-governance-", async (api) => {
    const work = await createListedHttpWork(api, "HTTP 评论治理测试");
    const posted = await api.postComment(work.id, "这条评论需要被举报。", {
      userId: "user_bad",
      authorName: "Bad User",
    });
    assert.equal(posted.item.status, "visible");

    const report = await api.reportComment(posted.item.id, "harassment", "评论存在骚扰或引战内容。");
    let dashboard = await api.getOperatorDashboard();
    assert.equal(report.item.targetType, "Comment");
    assert.equal(report.comment.status, "pending_review");
    assert.ok(dashboard.governanceCases.some((item) => item.id === report.item.id && item.targetType === "Comment"));

    await api.resolveReport(report.item.id, "hide", "评论举报成立，平台隐藏。");
    const comments = await api.getComments(work.id);
    const actions = await api.getModerationActions();
    dashboard = await api.getOperatorDashboard();
    const block = await api.blockUser({ blockedUserId: "user_bad", blockedUserName: "Bad User", reason: "评论骚扰。" });
    const blocks = await api.getMyBlocks();
    const unblock = await api.unblockUser(block.item.id);
    const blocksAfterUnblock = await api.getMyBlocks();

    assert.equal(comments.items.some((item) => item.id === posted.item.id), false);
    assert.ok(actions.items.some((action) => action.targetType === "Comment" && action.action === "hide" && action.sourceId === report.item.id));
    assert.ok(dashboard.operationLogs.some((log) => log.action === "resolve_report"));
    assert.equal(block.item.status, "active");
    assert.ok(blocks.items.some((item) => item.id === block.item.id && item.status === "active"));
    assert.equal(unblock.item.status, "revoked");
    assert.ok(blocksAfterUnblock.items.some((item) => item.id === block.item.id && item.status === "revoked"));
  });
});

test("HTTP backend alpha covers refund revoke and rights freeze flows", async () => {
  await withHttpApi("gugu-flash-api-http-commerce-risk-", async (api, _baseUrl, { statePath }) => {
    const refundWork = await createListedHttpWork(api, "HTTP 退款测试");
    let dashboard = await api.getDeviceDashboard();
    let refundItem = dashboard.library.find((item) => item.packId === refundWork.id);
    const purchase = await api.purchaseBadgePack(refundItem.id);
    const refund = await api.refundOrder(purchase.order.id, { reason: "HTTP 退款撤销权益测试" });

    assert.equal(refund.item.status, "refunded");
    assert.equal(refund.entitlement.status, "revoked");
    assert.equal(refund.settlement.status, "refunded");

    dashboard = await api.getDeviceDashboard();
    refundItem = dashboard.library.find((item) => item.packId === refundWork.id);
    assert.equal(refundItem.ownership, "not_owned");
    assert.equal(refundItem.entitlementStatus, "revoked");

    const callbackWork = await createListedHttpWork(api, "HTTP 服务商退款回调测试");
    dashboard = await api.getDeviceDashboard();
    const callbackItem = dashboard.library.find((item) => item.packId === callbackWork.id);
    const callbackPurchase = await api.purchaseBadgePack(callbackItem.id);
    const callback = await api.processRefundCallback({
      providerEventId: "evt_http_refund_1",
      providerRefundId: "refund_http_1",
      orderId: callbackPurchase.order.id,
      status: "succeeded",
      reason: "HTTP 服务商退款成功回调",
    });
    const duplicateCallback = await api.processRefundCallback({
      providerEventId: "evt_http_refund_1",
      providerRefundId: "refund_http_1",
      orderId: callbackPurchase.order.id,
      status: "succeeded",
      reason: "重复回调不应二次退款",
    });
    const operationLogs = await api.getOperationLogs();
    await delay(30);
    const refundRuntimeState = JSON.parse(await readFile(statePath, "utf8"));

    assert.equal(callback.item.result, "refunded");
    assert.equal(callback.order.status, "refunded");
    assert.equal(callback.entitlement.status, "revoked");
    assert.equal(duplicateCallback.idempotent, true);
    assert.equal(duplicateCallback.item.id, callback.item.id);
    assert.ok(refundRuntimeState.refundCallbacks.some((item) => item.id === callback.item.id));
    assert.equal(operationLogs.items.filter((log) => log.action === "refund_order" && log.targetId === callbackPurchase.order.id).length, 1);

    const claimWork = await createListedHttpWork(api, "HTTP 权利冻结测试");
    dashboard = await api.getDeviceDashboard();
    const claimItem = dashboard.library.find((item) => item.packId === claimWork.id);
    const claimPurchase = await api.purchaseBadgePack(claimItem.id);
    const claim = await api.submitRightsClaim({
      targetType: "Work",
      targetId: claimWork.id,
      claimantName: "HTTP 权利人",
      summary: "HTTP 权利争议，先冻结商店分发和收益。",
    });
    const workAfterClaim = await api.getWork(claimWork.id);
    const settlements = await api.getSettlements();
    const actions = await api.getModerationActions();

    assert.equal(claim.item.status, "action_taken");
    assert.equal(workAfterClaim.item.storeStatus, "frozen");
    assert.ok(settlements.items.some((settlement) => (
      settlement.orderId === claimPurchase.order.id &&
      settlement.status === "frozen"
    )));
    assert.ok(actions.items.some((action) => action.action === "freeze_store" && action.sourceId === claim.item.id));
  });
});

test("HTTP backend alpha validates payment callback signatures and idempotently grants entitlement", async () => {
  await withHttpApi("gugu-flash-api-http-payment-callback-", async (api, baseUrl, { statePath }) => {
    const { order } = await createPendingPaymentHttpOrder(api, "HTTP 服务商支付回调测试");
    const payload = {
      providerEventId: "evt_http_payment_1",
      providerPaymentId: "pay_http_1",
      orderId: order.item.id,
      status: "succeeded",
      amount: order.item.amount,
      currency: order.item.currency,
      provider: "mock_pay",
    };
    const invalid = await postRaw(baseUrl, "/flash/operator/payment-callbacks", {
      ...payload,
      signature: "sha256=bad-signature",
    });
    const signature = createPaymentCallbackSignature(payload);
    const rawCallback = await postRaw(baseUrl, "/flash/operator/payment-callbacks", payload, {
      "X-Gugu-Payment-Signature": signature,
    });
    const duplicateCallback = await api.processPaymentCallback({ ...payload, signature });
    const operationLogs = await api.getOperationLogs();
    const orderAfterPayment = await api.getOrder(order.item.id);
    await delay(30);
    const paymentRuntimeState = JSON.parse(await readFile(statePath, "utf8"));

    assert.equal(order.item.status, "pending_payment");
    assert.equal(invalid.code, 400);
    assert.equal(invalid.message, "invalid_payment_signature");
    assert.equal(rawCallback.code, 200);
    assert.equal(rawCallback.data.item.result, "paid");
    assert.equal(rawCallback.data.order.status, "paid");
    assert.equal(rawCallback.data.entitlement.status, "active");
    assert.equal(rawCallback.data.settlement.status, "pending");
    assert.equal(duplicateCallback.idempotent, true);
    assert.equal(duplicateCallback.item.id, rawCallback.data.item.id);
    assert.ok(paymentRuntimeState.paymentCallbacks.some((item) => item.id === rawCallback.data.item.id));
    assert.equal(orderAfterPayment.item.providerPaymentId, "pay_http_1");
    assert.equal(operationLogs.items.filter((log) => log.action === "payment_callback_paid" && log.targetId === order.item.id).length, 1);
  });
});

test("HTTP backend alpha exposes operator support diagnostic bundles", async () => {
  await withHttpApi("gugu-flash-api-http-support-diagnostics-", async (api, baseUrl) => {
    const { order } = await createPendingPaymentHttpOrder(api, "HTTP 支持诊断测试");
    const paymentPayload = {
      providerEventId: "evt_http_support_diag_payment_1",
      providerPaymentId: "pay_http_support_diag_1",
      orderId: order.item.id,
      status: "succeeded",
      amount: order.item.amount,
      currency: order.item.currency,
      provider: "mock_pay",
    };
    const signature = createPaymentCallbackSignature(paymentPayload);
    const payment = await api.processPaymentCallback({ ...paymentPayload, signature });
    const dashboard = await api.getDeviceDashboard();
    const storeItem = dashboard.library.find((item) => item.id === order.item.storeId);

    await api.downloadBadgePack(storeItem.id);
    const failedSync = await api.syncBadgePack(storeItem.id, { forceFailureReason: "write_failed" });

    const rawDiagnosticsResponse = await fetch(`${baseUrl}/flash/operator/support-diagnostics?orderId=${encodeURIComponent(order.item.id)}&providerEventId=${encodeURIComponent(paymentPayload.providerEventId)}&syncJobId=${encodeURIComponent(failedSync.syncJob.id)}&deviceId=${encodeURIComponent(dashboard.activeDeviceId)}`, {
      headers: { "X-Request-Id": "req_http_support_diag_001" },
    });
    const rawDiagnostics = await rawDiagnosticsResponse.json();
    const clientDiagnostics = await api.getOperatorSupportDiagnostics({
      orderId: order.item.id,
      syncJobId: failedSync.syncJob.id,
    });

    assert.equal(payment.item.result, "paid");
    assert.equal(rawDiagnostics.code, 200);
    assert.equal(rawDiagnosticsResponse.headers.get("x-gugu-request-id"), "req_http_support_diag_001");
    assert.equal(rawDiagnostics.data.requestId, "req_http_support_diag_001");
    assert.equal(rawDiagnostics.data.query.orderId, order.item.id);
    assert.ok(rawDiagnostics.data.records.orders.some((item) => item.id === order.item.id));
    assert.ok(rawDiagnostics.data.records.paymentCallbacks.some((item) => item.providerEventId === paymentPayload.providerEventId));
    assert.ok(rawDiagnostics.data.records.deviceSyncJobs.some((item) => item.id === failedSync.syncJob.id));
    assert.ok(rawDiagnostics.data.summary.recommendedMacroIds.includes("sync_write_failed"));
    assert.equal(clientDiagnostics.schemaVersion, rawDiagnostics.data.schemaVersion);
  });
});

test("HTTP backend alpha exposes operator review SLA dashboard", async () => {
  await withHttpApi("gugu-flash-api-http-review-sla-", async (api, baseUrl) => {
    const work = await createListedHttpWork(api, "HTTP 审核 SLA 测试");
    const report = await api.submitReport({
      targetType: "Work",
      targetId: work.id,
      reason: "hardware_unsuitable",
      description: "SLA dashboard should include this governance case.",
    });
    const rawResponse = await fetch(`${baseUrl}/flash/operator/review-sla`, {
      headers: { "X-Request-Id": "req_http_review_sla_001" },
    });
    const raw = await rawResponse.json();
    const sla = await api.getOperatorReviewSla();

    assert.equal(raw.code, 200);
    assert.equal(raw.data.schemaVersion, "gugu_flash_review_sla_v1");
    assert.equal(raw.data.requestId, "req_http_review_sla_001");
    assert.ok(raw.data.items.some((item) => item.id === report.item.id && item.queueId === "comment_report_governance"));
    assert.ok(raw.data.summary.totalOpen >= 1);
    assert.ok(sla.summary.byQueue.some((queue) => queue.queueId === "comment_report_governance"));
  });
});

test("HTTP backend alpha rejects operator actions outside the governance policy", async () => {
  await withHttpApi("gugu-flash-api-http-policy-", async (api, baseUrl) => {
    const work = await createListedHttpWork(api, "HTTP 策略校验测试");
    const report = await api.submitReport({
      targetType: "Work",
      targetId: work.id,
      reason: "hardware_unsuitable",
      description: "测试未知运营动作必须被拒绝。",
    });

    const invalidReportAction = await postRaw(baseUrl, `/flash/operator/reports/${report.item.id}/resolve`, {
      action: "unknown_report_action",
      reason: "这个动作没有写进治理策略。",
    });
    assert.equal(invalidReportAction.code, 400);
    assert.equal(invalidReportAction.message, "invalid_operator_action");

    const missingReportReason = await postRaw(baseUrl, `/flash/operator/reports/${report.item.id}/resolve`, {
      action: "hide",
    });
    assert.equal(missingReportReason.code, 400);
    assert.equal(missingReportReason.message, "operator_reason_required");

    const validReportAction = await api.resolveReport(report.item.id, "limit_recommend", "举报成立，限制推荐。");
    assert.equal(validReportAction.item.status, "action_taken");

    const invalidIntakeAction = await postRaw(baseUrl, "/flash/rights-claims", {
      targetType: "Work",
      targetId: work.id,
      claimantName: "HTTP 权利人",
      summary: "用户提交权利投诉时不能指定未知先行动作。",
      action: "unknown_claim_action",
    });
    assert.equal(invalidIntakeAction.code, 400);
    assert.equal(invalidIntakeAction.message, "invalid_operator_action");

    const claim = await api.submitRightsClaim({
      targetType: "Work",
      targetId: work.id,
      claimantName: "HTTP 权利人",
      summary: "等待运营按策略处理的权利投诉。",
      preliminaryAction: false,
    });
    const invalidClaimResult = await postRaw(baseUrl, `/flash/operator/rights-claims/${claim.item.id}/resolve`, {
      result: "unknown_claim_result",
      reason: "这个结果没有写进治理策略。",
    });
    assert.equal(invalidClaimResult.code, 400);
    assert.equal(invalidClaimResult.message, "invalid_operator_action");

    const missingClaimReason = await postRaw(baseUrl, `/flash/operator/rights-claims/${claim.item.id}/resolve`, {
      result: "freeze_store",
    });
    assert.equal(missingClaimReason.code, 400);
    assert.equal(missingClaimReason.message, "operator_reason_required");

    const validClaimResult = await api.resolveRightsClaim(claim.item.id, "freeze_store", "权利争议先冻结分发。");
    assert.equal(validClaimResult.item.status, "action_taken");

    const appeal = await api.submitAppeal({
      targetType: "Work",
      targetId: work.id,
      sourceCaseId: claim.item.id,
      reason: "创作者提交补充说明，要求复核。",
    });
    const invalidAppealResult = await postRaw(baseUrl, `/flash/operator/appeals/${appeal.item.id}/resolve`, {
      result: "unknown_appeal_result",
      reason: "这个结果没有写进申诉策略。",
    });
    assert.equal(invalidAppealResult.code, 400);
    assert.equal(invalidAppealResult.message, "invalid_operator_action");

    const missingStoreReason = await postRaw(baseUrl, `/flash/operator/store-listings/${work.id}/freeze`, {});
    assert.equal(missingStoreReason.code, 400);
    assert.equal(missingStoreReason.message, "operator_reason_required");

    const validAppealResult = await api.resolveAppeal(appeal.item.id, "keep_action", "维持原处置，等待更多授权材料。");
    assert.equal(validAppealResult.item.status, "resolved");
    assert.equal(validAppealResult.item.result, "keep_action");
  });
});

test("HTTP backend alpha records failed sync jobs and accepts retry", async () => {
  await withHttpApi("gugu-flash-api-http-sync-retry-", async (api) => {
    const firstWork = await createListedHttpWork(api, "HTTP 同步基线");
    let dashboard = await api.getDeviceDashboard();
    const firstItem = dashboard.library.find((item) => item.packId === firstWork.id);
    await api.purchaseBadgePack(firstItem.id);
    await api.downloadBadgePack(firstItem.id);
    await api.syncBadgePack(firstItem.id);

    const secondWork = await createListedHttpWork(api, "HTTP 同步重试");
    dashboard = await api.getDeviceDashboard();
    const secondItem = dashboard.library.find((item) => item.packId === secondWork.id);
    await api.purchaseBadgePack(secondItem.id);
    await api.downloadBadgePack(secondItem.id);

    const failed = await api.syncBadgePack(secondItem.id, { forceFailureReason: "write_failed" });
    assert.equal(failed.failed, true);
    assert.equal(failed.reason, "write_failed");
    assert.equal(failed.syncJob.rollbackStatus, "restored_previous");

    const jobsAfterFailure = await api.getDeviceSyncJobs(dashboard.activeDeviceId);
    assert.ok(jobsAfterFailure.items.some((job) => job.id === failed.syncJob.id && job.failureReason === "write_failed"));

    const retry = await api.syncBadgePack(secondItem.id, { retryOf: failed.syncJob.id });
    const afterRetry = await api.getDeviceDashboard();
    const jobsAfterRetry = await api.getDeviceSyncJobs(dashboard.activeDeviceId);

    assert.equal(retry.syncJob.retryOf, failed.syncJob.id);
    assert.equal(retry.syncJob.status, "installed");
    assert.equal(afterRetry.device.currentPackTitle, secondWork.title);
    assert.ok(jobsAfterRetry.items.some((job) => job.retryOf === failed.syncJob.id && job.status === "installed"));
  });
});

test("HTTP backend alpha covers baseline contract read and operator list routes", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-api-routes-"));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  const { server } = createFlashHttpServer({ dataPath, statePath });
  const baseUrl = await listen(server);
  const api = createHttpFlashApi({ baseUrl });

  async function get(path) {
    const payload = await fetch(`${baseUrl}${path}`).then((response) => response.json());
    assert.equal(payload.code, 200, `${path} should return 200`);
    return payload.data;
  }

  try {
    const work = await createListedHttpWork(api, "契约覆盖测试");
    const dashboard = await api.getDeviceDashboard();
    const deviceId = dashboard.activeDeviceId;
    const storeItem = dashboard.library.find((item) => item.packId === work.id);

    const versions = await get(`/flash/works/${work.id}/versions`);
    assert.equal(versions.items[0].id, work.workVersion.id);
    assert.equal((await api.getWorkVersions(work.id)).items[0].id, work.workVersion.id);

    const storeListing = await get(`/flash/store-listings/${work.storeListing.id}`);
    assert.equal(storeListing.item.id, work.storeListing.id);
    assert.equal((await api.getStoreListing(work.storeListing.id)).item.id, work.storeListing.id);

    const hardwarePack = await get(`/flash/hardware-packs/${work.hardwarePack.id}`);
    assert.equal(hardwarePack.item.id, work.hardwarePack.id);
    assert.equal((await api.getHardwarePack(work.hardwarePack.id)).item.id, work.hardwarePack.id);

    const devices = await get("/flash/devices");
    assert.ok(devices.items.some((item) => item.id === deviceId));
    assert.ok((await api.getDevices()).items.some((item) => item.id === deviceId));

    await api.purchaseBadgePack(storeItem.id);
    const entitlements = await get(`/flash/devices/${deviceId}/entitlements`);
    assert.ok(entitlements.items.some((item) => item.hardwarePackId === work.hardwarePack.id));
    assert.ok((await api.getDeviceEntitlements(deviceId)).items.some((item) => item.hardwarePackId === work.hardwarePack.id));

    const installs = await get(`/flash/devices/${deviceId}/installs`);
    assert.equal(Array.isArray(installs.items), true);
    assert.equal(Array.isArray((await api.getDeviceInstalls(deviceId)).items), true);

    const orders = await api.getOrders();
    const order = orders.items.find((item) => item.hardwarePackId === work.hardwarePack.id);
    const orderDetail = await get(`/flash/orders/${order.id}`);
    assert.equal(orderDetail.item.id, order.id);
    assert.equal((await api.getOrder(order.id)).item.id, order.id);

    const reviewTasks = await get("/flash/operator/review-tasks");
    assert.equal(Array.isArray(reviewTasks.items), true);
    assert.equal(Array.isArray((await api.getReviewTasks()).items), true);

    const storeListings = await get("/flash/operator/store-listings");
    assert.ok(storeListings.items.some((item) => item.packId === work.id));
    assert.ok((await api.getOperatorStoreListings()).items.some((item) => item.packId === work.id));

    const exportReport = await fetch(`${baseUrl}/flash/operator/hardware-packs/${work.hardwarePack.id}/export-to-hardware-studio`, {
      method: "POST",
    }).then((response) => response.json());
    assert.equal(exportReport.code, 200);
    assert.equal(exportReport.data.item.schemaVersion, "gugu_hardware_studio_export_v1");
    assert.equal(exportReport.data.item.hardwarePackId, work.hardwarePack.id);
    assert.ok(exportReport.data.item.files.some((file) => file.path === "checksums.sha256"));
    const clientExport = await api.exportHardwarePack(work.hardwarePack.id);
    assert.equal(clientExport.item.exportId, exportReport.data.item.exportId);
    assert.equal(clientExport.item.payload.payloadVersion, "gugu_hardware_payload_v1");
    assert.equal(clientExport.hardwarePack.checksum, clientExport.item.hardwarePack.checksum);
  } finally {
    await close(server);
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("HTTP backend alpha can enforce user and operator permissions", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-api-auth-"));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  const { server } = createFlashHttpServer({
    dataPath,
    statePath,
    requireAuth: true,
    operatorInviteSecret: "closed-beta-invite",
  });
  const baseUrl = await listen(server);

  try {
    const feed = await fetch(`${baseUrl}/flash/feed`).then((response) => response.json());
    assert.equal(feed.code, 200);

    const createWithoutUser = await fetch(`${baseUrl}/flash/drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "未登录创作" }),
    }).then((response) => response.json());
    assert.equal(createWithoutUser.code, 401);

    const staticDemoTokenDenied = await fetch(`${baseUrl}/flash/operator/dashboard`, {
      headers: { Authorization: "Bearer demo-operator" },
    }).then((response) => response.json());
    assert.equal(staticDemoTokenDenied.code, 401);

    const requestedOperatorWithoutInvite = await postRaw(baseUrl, "/flash/auth/login", {
      username: "reviewer-no-invite",
      role: "reviewer",
    });
    assert.equal(requestedOperatorWithoutInvite.code, 403);
    assert.equal(requestedOperatorWithoutInvite.message, "operator_invite_required");

    const baseApi = createHttpFlashApi({ baseUrl });
    const login = await baseApi.login({ username: "session-user", role: "creator" });
    assert.equal(login.item.status, "active");
    assert.equal(login.item.role, "creator");
    assert.ok(login.item.permissions.includes("user:write"));
    assert.ok(login.accessToken.startsWith("gfs_access_"));

    const userApi = createHttpFlashApi({ baseUrl, token: login.accessToken });
    const userDraft = await userApi.createDraft("token 创作", "gentle");
    assert.equal(userDraft.item.title, "token");

    const operatorAsCreator = await fetch(`${baseUrl}/flash/operator/dashboard`, {
      headers: { Authorization: `Bearer ${login.accessToken}` },
    }).then((response) => response.json());
    assert.equal(operatorAsCreator.code, 403);

    const forgedRoleHeader = await fetch(`${baseUrl}/flash/operator/dashboard`, {
      headers: {
        Authorization: `Bearer ${login.accessToken}`,
        "X-Gugu-Role": "super_admin",
      },
    }).then((response) => response.json());
    assert.equal(forgedRoleHeader.code, 403);

    const sessionInfo = await userApi.getSession();
    assert.equal(sessionInfo.item.id, login.item.id);
    assert.equal(sessionInfo.accessToken, undefined);

    const reviewerLogin = await baseApi.login({
      username: "reviewer-session",
      role: "reviewer",
      operatorInviteCode: "closed-beta-invite",
    });
    assert.ok(reviewerLogin.item.permissions.includes("governance:write"));
    assert.equal(reviewerLogin.item.permissions.includes("hardware:write"), false);
    const reviewerApi = createHttpFlashApi({ baseUrl, token: reviewerLogin.accessToken });
    const reviewerDashboard = await reviewerApi.getOperatorDashboard();
    assert.ok(reviewerDashboard.counts);

    await assert.rejects(
      () => reviewerApi.getOperatorOpsMetrics(),
      (error) => error.payload?.code === 403,
    );
    const reviewerHardwareDenied = await fetch(`${baseUrl}/flash/operator/hardware-packs/hw_test/export-to-hardware-studio`, {
      method: "POST",
      headers: { Authorization: `Bearer ${reviewerLogin.accessToken}` },
    }).then((response) => response.json());
    assert.equal(reviewerHardwareDenied.code, 403);

    const supportLogin = await baseApi.login({
      username: "support-session",
      role: "support",
      operatorInviteCode: "closed-beta-invite",
    });
    const supportApi = createHttpFlashApi({ baseUrl, token: supportLogin.accessToken });
    const supportDiagnostics = await supportApi.getOperatorSupportDiagnostics({ targetId: "h5_rain_gugu" });
    assert.equal(supportDiagnostics.schemaVersion, "gugu_flash_support_diagnostic_v1");
    await assert.rejects(
      () => supportApi.getOperatorOpsMetrics(),
      (error) => error.payload?.code === 403,
    );

    const report = await userApi.submitReport({
      targetType: "Work",
      targetId: "h5_rain_gugu",
      reason: "hardware_unsuitable",
      description: "RBAC reviewer resolve test.",
    });
    const reviewedReport = await reviewerApi.resolveReport(report.item.id, "limit_recommend", "RBAC reviewer can resolve governance cases.");
    assert.equal(reviewedReport.item.status, "action_taken");

    const hardwareLogin = await baseApi.login({
      username: "hardware-session",
      role: "hardware_operator",
      operatorInviteCode: "closed-beta-invite",
    });
    assert.ok(hardwareLogin.item.permissions.includes("hardware:write"));
    assert.equal(hardwareLogin.item.permissions.includes("governance:write"), false);
    const hardwareExport = await fetch(`${baseUrl}/flash/operator/hardware-packs/hw_h5_rain_gugu/export-to-hardware-studio`, {
      method: "POST",
      headers: { Authorization: `Bearer ${hardwareLogin.accessToken}` },
    }).then((response) => response.json());
    assert.equal(hardwareExport.code, 200);
    const hardwareGovernanceDenied = await fetch(`${baseUrl}/flash/operator/reports/${report.item.id}/resolve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hardwareLogin.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "hide", reason: "hardware operator should not resolve reports" }),
    }).then((response) => response.json());
    assert.equal(hardwareGovernanceDenied.code, 403);

    const operatorLogin = await baseApi.login({
      username: "operator-session",
      role: "operator",
      operatorInviteCode: "closed-beta-invite",
    });
    const operatorApi = createHttpFlashApi({ baseUrl, token: operatorLogin.accessToken });
    const operatorMetrics = await operatorApi.getOperatorOpsMetrics();
    assert.equal(operatorMetrics.status, "ok");

    const refreshed = await userApi.refreshSession();
    assert.equal(refreshed.item.id, login.item.id);
    assert.notEqual(refreshed.accessToken, login.accessToken);

    await assert.rejects(
      () => userApi.createDraft("旧 token 应失效", "gentle"),
      (error) => error.payload?.code === 401,
    );

    const refreshedApi = createHttpFlashApi({ baseUrl, token: refreshed.accessToken });
    const refreshedDraft = await refreshedApi.createDraft("refreshed token 创作", "gentle");
    assert.equal(refreshedDraft.item.title, "refreshed");
    const logout = await refreshedApi.logout();
    assert.equal(logout.item.status, "revoked");

    await assert.rejects(
      () => refreshedApi.createDraft("登出后应拒绝", "gentle"),
      (error) => error.payload?.code === 401,
    );
  } finally {
    await close(server);
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("HTTP backend alpha accepts signed external identity tokens in required auth mode", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-api-identity-"));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  const { server } = createFlashHttpServer({
    dataPath,
    statePath,
    requireAuth: true,
    identityTokenSecret: "identity-bridge-secret",
    identityIssuer: "https://idp.gugu.test",
    identityAudience: "gugu-flash-api",
  });
  const baseUrl = await listen(server);

  try {
    const now = Date.now();
    const creatorToken = createIdentityToken({
      sub: "identity_creator",
      displayName: "Identity Creator",
      role: "creator",
      jti: "identity_creator_token",
    }, {
      secret: "identity-bridge-secret",
      issuer: "https://idp.gugu.test",
      audience: "gugu-flash-api",
      now,
    });
    const creatorApi = createHttpFlashApi({ baseUrl, token: creatorToken });
    const session = await creatorApi.getSession();
    const draft = await creatorApi.createDraft("identity token 创作", "gentle");

    assert.equal(session.item.source, "external_identity");
    assert.equal(session.item.userId, "identity_creator");
    assert.equal(session.item.role, "creator");
    assert.equal(session.item.accessToken, undefined);
    assert.equal(draft.item.title, "identity");

    await assert.rejects(
      () => creatorApi.getOperatorDashboard(),
      (error) => error.payload?.code === 403,
    );

    const reviewerToken = createIdentityToken({
      sub: "identity_reviewer",
      displayName: "Identity Reviewer",
      role: "reviewer",
      jti: "identity_reviewer_token",
    }, {
      secret: "identity-bridge-secret",
      issuer: "https://idp.gugu.test",
      audience: "gugu-flash-api",
      now,
    });
    const reviewerApi = createHttpFlashApi({ baseUrl, token: reviewerToken });
    const reviewerDashboard = await reviewerApi.getOperatorDashboard();
    assert.ok(reviewerDashboard.counts);

    const wrongAudienceToken = createIdentityToken({ sub: "identity_wrong", role: "creator" }, {
      secret: "identity-bridge-secret",
      issuer: "https://idp.gugu.test",
      audience: "wrong-audience",
      now,
    });
    const wrongAudienceApi = createHttpFlashApi({ baseUrl, token: wrongAudienceToken });
    await assert.rejects(
      () => wrongAudienceApi.createDraft("wrong audience", "gentle"),
      (error) => error.payload?.code === 401,
    );

    const expiredToken = createIdentityToken({ sub: "identity_expired", role: "creator" }, {
      secret: "identity-bridge-secret",
      issuer: "https://idp.gugu.test",
      audience: "gugu-flash-api",
      now: now - 2000,
      ttlMs: 1000,
    });
    const expiredApi = createHttpFlashApi({ baseUrl, token: expiredToken });
    await assert.rejects(
      () => expiredApi.createDraft("expired", "gentle"),
      (error) => error.payload?.code === 401,
    );
  } finally {
    await close(server);
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("HTTP backend alpha restores runtime state after server restart", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-api-state-"));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  let server = createFlashHttpServer({ dataPath, statePath }).server;
  let baseUrl = await listen(server);
  let api = createHttpFlashApi({ baseUrl });

  try {
    const draft = await api.createDraft("重启后仍保留", "gentle", {
      originType: "original",
      ipId: "rain_gugu_universe",
      personaId: "rain_gugu",
    });
    const published = await api.publishDraft(draft.item);
    await api.applyStoreListing(published.item.id, true);
    for (let index = 0; index < 4; index += 1) await api.approveStoreListing(published.item.id);
    const postedComment = await api.postComment(published.item.id, "重启后评论仍然在。");

    const dashboard = await api.getDeviceDashboard();
    const storeItem = dashboard.library.find((item) => item.packId === published.item.id);
    await api.purchaseBadgePack(storeItem.id);
    await api.downloadBadgePack(storeItem.id);
    await api.syncBadgePack(storeItem.id);
    await delay(30);
    await close(server);

    server = createFlashHttpServer({ dataPath, statePath }).server;
    baseUrl = await listen(server);
    api = createHttpFlashApi({ baseUrl });

    const restored = await api.getDeviceDashboard();
    const restoredItem = restored.library.find((item) => item.packId === published.item.id);
    const comments = await api.getComments(published.item.id);
    assert.equal(restoredItem.syncStatus, "synced");
    assert.equal(restored.device.currentPackTitle, published.item.title);
    assert.ok(comments.items.some((item) => item.id === postedComment.item.id));
  } finally {
    await close(server).catch(() => {});
    await rm(tempDir, { recursive: true, force: true });
  }
});
