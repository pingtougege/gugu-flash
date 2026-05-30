import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createJsonFlashStore } from "./json-flash-store.js";
import {
  createJsonFlashStoreBackup,
  restoreJsonFlashStoreBackup,
  validateJsonFlashStoreBackup,
} from "./json-flash-store-backup.js";

test("JSON flash store persists packs and runtime state across instances", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-store-"));
  const seedPath = join(tempDir, "seed.json");
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "state.json");

  try {
    await createJsonFlashStore({
      dataPath: seedPath,
      statePath: join(tempDir, "seed-state.json"),
      seedPath,
    }).savePacks([{ id: "seed_pack" }]);

    const first = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.deepEqual(await first.loadPacks(), [{ id: "seed_pack" }]);

    await first.savePacks([{ id: "saved_pack" }]);
    await first.saveRuntimeState({ activeDeviceId: "badge_test", orders: [{ id: "order_test" }] });

    const second = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.deepEqual(await second.loadPacks(), [{ id: "saved_pack" }]);
    assert.deepEqual(await second.loadRuntimeState(), {
      activeDeviceId: "badge_test",
      orders: [{ id: "order_test" }],
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("JSON flash store exposes order and device entitlement repositories", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-store-repo-"));
  const seedPath = join(tempDir, "seed.json");
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "state.json");

  try {
    const store = createJsonFlashStore({ dataPath, statePath, seedPath });
    const order = {
      id: "order_repo_1",
      buyerUserId: "user_local",
      deviceId: "device_repo",
      hardwarePackId: "hw_repo",
      amount: 6,
      currency: "CNY",
      status: "paid",
      createdAt: 1760000000000,
    };
    const entitlement = {
      id: "entitlement_repo_1",
      deviceId: "device_repo",
      storeId: "store_repo",
      hardwarePackId: "hw_repo",
      orderId: order.id,
      status: "active",
      acquiredAt: 1760000000000,
    };
    const install = {
      status: "installed",
      installedAt: 1760000000100,
      lastSyncJobId: "sync_repo_1",
    };
    const syncJob = {
      id: "sync_repo_1",
      deviceId: "device_repo",
      storeId: "store_repo",
      packId: "pack_repo",
      hardwarePackId: "hw_repo",
      status: "installed",
      diagnosticCode: "GFS-INSTALLED-REPO",
      createdAt: 1760000000000,
      updatedAt: 1760000000100,
    };

    await store.orders.save(order);
    await store.deviceEntitlements.save("device_repo", "store_repo", entitlement);
    await store.deviceInstalls.save("device_repo", "store_repo", install);
    await store.deviceSyncJobs.save(syncJob);

    const second = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.deepEqual(await second.orders.get(order.id), order);
    assert.deepEqual(await second.orders.list(), [order]);
    assert.deepEqual(await second.deviceEntitlements.get("device_repo", "store_repo"), entitlement);
    assert.deepEqual(await second.deviceEntitlements.listForDevice("device_repo"), [entitlement]);
    assert.deepEqual(await second.deviceInstalls.get("device_repo", "store_repo"), install);
    assert.deepEqual(await second.deviceInstalls.listForDevice("device_repo"), [install]);
    assert.deepEqual(await second.deviceSyncJobs.listForDevice("device_repo"), [syncJob]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("JSON flash store creates, refreshes, and revokes sessions", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-store-session-"));
  const seedPath = join(tempDir, "seed.json");
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "state.json");

  try {
    const store = createJsonFlashStore({ dataPath, statePath, seedPath });
    const session = await store.sessions.create({ userId: "user_alpha", role: "operator", displayName: "Alpha" });

    assert.equal(session.status, "active");
    assert.equal(session.role, "operator");
    assert.ok(session.accessToken.startsWith("gfs_access_"));
    assert.deepEqual(await store.sessions.getByToken(session.accessToken), session);

    const refreshed = await store.sessions.refreshByToken(session.refreshToken);
    assert.equal(refreshed.id, session.id);
    assert.notEqual(refreshed.accessToken, session.accessToken);
    assert.equal(await store.sessions.getByToken(session.accessToken), null);
    assert.deepEqual(await store.sessions.getByToken(refreshed.accessToken), refreshed);

    const revoked = await store.sessions.revokeByToken(refreshed.accessToken);
    assert.equal(revoked.status, "revoked");
    assert.equal(await store.sessions.getByToken(refreshed.accessToken), null);

    const second = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.equal((await second.sessions.get(session.id)).status, "revoked");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("JSON flash store exposes StoryProject repositories", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-store-story-projects-"));
  const seedPath = join(tempDir, "seed.json");
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "state.json");

  try {
    const store = createJsonFlashStore({ dataPath, statePath, seedPath });
    const project = {
      id: "story_project_repo_1",
      authorUserId: "user_local",
      schemaVersion: "gugu_story_project_v1",
      title: "仓库里的雨夜",
      contentOrigin: "original",
      status: "draft",
      updatedAt: 1760000000000,
    };
    const version = {
      id: "spv_repo_1",
      storyProjectId: project.id,
      schemaVersion: "gugu_story_project_v1",
      projectSnapshot: project,
      status: "locked",
      createdAt: 1760000000100,
    };
    const job = {
      id: "ai_job_repo_1",
      storyProjectId: project.id,
      stage: "outline",
      status: "queued",
      inputSnapshotId: version.id,
      createdAt: 1760000000200,
      updatedAt: 1760000000200,
    };
    const asset = {
      id: "asset_repo_scene_background",
      storyProjectId: project.id,
      renderJobId: job.id,
      kind: "image",
      usage: "scene_background",
      sceneId: "start",
      status: "ready",
      createdAt: 1760000000300,
      updatedAt: 1760000000300,
    };

    await store.storyProjects.save(project);
    await store.storyProjectVersions.save(version);
    await store.aiGenerationJobs.save(job);
    await store.assets.save(asset);

    const second = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.deepEqual(await second.storyProjects.get(project.id), project);
    assert.deepEqual(await second.storyProjects.list({ authorUserId: "user_local" }), [project]);
    assert.deepEqual(await second.storyProjectVersions.listForProject(project.id), [version]);
    assert.deepEqual(await second.aiGenerationJobs.get(job.id), job);
    assert.deepEqual(await second.aiGenerationJobs.listForProject(project.id), [job]);
    assert.deepEqual(await second.assets.get(asset.id), asset);
    assert.deepEqual(await second.assets.listForProject(project.id, { usage: "scene_background" }), [asset]);
    assert.deepEqual(await second.assets.list({ renderJobId: job.id }), [asset]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("JSON flash store exposes comment repositories", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-store-comments-"));
  const seedPath = join(tempDir, "seed.json");
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "state.json");

  try {
    const store = createJsonFlashStore({ dataPath, statePath, seedPath });
    const comment = {
      id: "comment_repo_1",
      userId: "user_local",
      workId: "work_repo",
      body: "保存在评论仓库里。",
      status: "visible",
      createdAt: 1760000000000,
      updatedAt: 1760000000000,
    };
    const hidden = {
      ...comment,
      id: "comment_repo_2",
      status: "hidden_by_author",
      hiddenReason: "作者隐藏。",
    };

    await store.comments.save(hidden);
    await store.comments.save(comment);

    const second = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.deepEqual(await second.comments.get(comment.id), comment);
    assert.deepEqual(await second.comments.listForWork("work_repo"), [comment, hidden]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("JSON flash store exposes block relation repositories", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-store-blocks-"));
  const seedPath = join(tempDir, "seed.json");
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "state.json");

  try {
    const store = createJsonFlashStore({ dataPath, statePath, seedPath });
    const relation = {
      id: "block_repo_1",
      blockerUserId: "user_local",
      blockedUserId: "user_bad",
      blockedUserName: "Bad User",
      reason: "骚扰评论。",
      status: "active",
      createdAt: 1760000000000,
      updatedAt: 1760000000000,
    };
    const otherRelation = { ...relation, id: "block_repo_2", blockerUserId: "other_user" };

    await store.blockRelations.save(otherRelation);
    await store.blockRelations.save(relation);

    const second = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.deepEqual(await second.blockRelations.get(relation.id), relation);
    assert.deepEqual(await second.blockRelations.listForBlocker("user_local"), [relation]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("JSON flash store exposes provider callback repositories", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-store-callbacks-"));
  const seedPath = join(tempDir, "seed.json");
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "state.json");

  try {
    const store = createJsonFlashStore({ dataPath, statePath, seedPath });
    const payment = {
      id: "payment_callback_evt_repo_1",
      providerEventId: "evt_payment_repo_1",
      orderId: "order_repo_1",
      result: "paid",
      amount: 6,
      currency: "CNY",
      receivedAt: 1760000000000,
    };
    const refund = {
      id: "refund_callback_evt_repo_1",
      providerEventId: "evt_refund_repo_1",
      orderId: "order_repo_1",
      result: "refunded",
      amount: 6,
      currency: "CNY",
      receivedAt: 1760000000100,
    };

    await store.paymentCallbacks.save(payment);
    await store.refundCallbacks.save(refund);

    const second = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.deepEqual(await second.paymentCallbacks.get(payment.id), payment);
    assert.deepEqual(await second.refundCallbacks.get(refund.id), refund);
    assert.deepEqual(await second.paymentCallbacks.list(), [payment]);
    assert.deepEqual(await second.refundCallbacks.list(), [refund]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("JSON flash store exposes governance repositories", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-store-governance-"));
  const seedPath = join(tempDir, "seed.json");
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "state.json");

  try {
    const store = createJsonFlashStore({ dataPath, statePath, seedPath });
    const report = {
      id: "report_repo_1",
      reporterUserId: "user_local",
      targetType: "Work",
      targetId: "work_repo",
      reason: "copyright_ip",
      status: "submitted",
      createdAt: 1760000000000,
    };
    const otherReport = { ...report, id: "report_repo_2", reporterUserId: "other_user" };
    const claim = {
      id: "claim_repo_1",
      claimantName: "权利人",
      targetType: "Work",
      targetId: "work_repo",
      claimType: "copyright",
      summary: "权利投诉",
      status: "triage",
      createdAt: 1760000000000,
      updatedAt: 1760000000000,
    };
    const appeal = {
      id: "appeal_repo_1",
      appellantUserId: "user_local",
      targetType: "Work",
      targetId: "work_repo",
      reason: "补充授权材料",
      status: "submitted",
      createdAt: 1760000000000,
      updatedAt: 1760000000000,
    };
    const action = {
      id: "mod_action_repo_1",
      targetType: "Work",
      targetId: "work_repo",
      action: "freeze_store",
      reason: "权利争议",
      operatorId: "operator_demo",
      status: "recorded",
      createdAt: 1760000000000,
    };
    const log = {
      id: "op_repo_1",
      actorUserId: "operator_demo",
      action: "resolve_report",
      targetType: "Report",
      targetId: report.id,
      status: "recorded",
      createdAt: 1760000000000,
    };

    await store.reports.save(otherReport);
    await store.reports.save(report);
    await store.rightsClaims.save(claim);
    await store.appeals.save(appeal);
    await store.moderationActions.save(action);
    await store.operationLogs.save(log);

    const second = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.deepEqual(await second.reports.listForReporter("user_local"), [report]);
    assert.deepEqual(await second.reports.list(), [report, otherReport]);
    assert.deepEqual(await second.rightsClaims.get(claim.id), claim);
    assert.deepEqual(await second.appeals.listForAppellant("user_local"), [appeal]);
    assert.deepEqual(await second.moderationActions.list(), [action]);
    assert.deepEqual(await second.operationLogs.list(), [log]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("JSON flash store backup restores packs and runtime state after mutation", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-store-backup-"));
  const seedPath = join(tempDir, "seed.json");
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "state.json");
  const backupPath = join(tempDir, "backups", "alpha-backup.json");

  try {
    const store = createJsonFlashStore({ dataPath, statePath, seedPath });
    await store.savePacks([{ id: "launch_pack", title: "Launch" }]);
    await store.saveRuntimeState({
      activeDeviceId: "device_alpha",
      orders: [{ id: "order_alpha", status: "paid" }],
      deviceSyncJobs: [{ id: "sync_alpha", status: "installed" }],
    });

    const backup = await createJsonFlashStoreBackup({
      dataPath,
      statePath,
      backupPath,
      label: "pre-deploy",
      createdAt: "2026-05-27T00:00:00.000Z",
    });

    assert.deepEqual(validateJsonFlashStoreBackup(backup), []);
    assert.match(backup.checksum, /^sha256:[a-f0-9]{64}$/);

    await store.savePacks([{ id: "mutated_pack" }]);
    await store.saveRuntimeState({ activeDeviceId: "device_mutated", orders: [] });

    await restoreJsonFlashStoreBackup({ backupPath, dataPath, statePath });

    const restored = createJsonFlashStore({ dataPath, statePath, seedPath });
    assert.deepEqual(await restored.loadPacks(), [{ id: "launch_pack", title: "Launch" }]);
    assert.deepEqual(await restored.loadRuntimeState(), {
      activeDeviceId: "device_alpha",
      orders: [{ id: "order_alpha", status: "paid" }],
      deviceSyncJobs: [{ id: "sync_alpha", status: "installed" }],
    });

    const corrupt = JSON.parse(await readFile(backupPath, "utf8"));
    corrupt.files.state.json.activeDeviceId = "corrupt";
    await writeFile(backupPath, `${JSON.stringify(corrupt, null, 2)}\n`);
    await assert.rejects(
      () => restoreJsonFlashStoreBackup({ backupPath, dataPath, statePath }),
      /checksum does not match payload/,
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
