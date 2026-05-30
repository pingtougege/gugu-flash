import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  createJsonFlashStoreBackup,
  restoreJsonFlashStoreBackup,
  validateJsonFlashStoreBackup,
} from "../apps/backend/src/json-flash-store-backup.js";
import { createJsonFlashStore } from "../apps/backend/src/json-flash-store.js";

const tempDir = await mkdtemp(join(tmpdir(), "gugu-flash-alpha-backup-drill-"));
const seedPath = join(tempDir, "seed.json");
const dataPath = join(tempDir, "packs.json");
const statePath = join(tempDir, "state.json");
const backupPath = join(tempDir, "backup", "pre-deploy.json");

try {
  const store = createJsonFlashStore({ dataPath, statePath, seedPath });
  const expectedPacks = [
    {
      id: "hw_launch_drill",
      status: "available",
      checksum: "sha256:drill",
    },
  ];
  const expectedState = {
    activeDeviceId: "device_drill",
    orders: [{ id: "order_drill", status: "paid" }],
    deviceEntitlements: {
      device_drill: {
        store_launch: {
          id: "entitlement_drill",
          status: "active",
        },
      },
    },
    paymentCallbacks: [{ id: "payment_callback_drill", providerEventId: "evt_drill" }],
  };

  await store.savePacks(expectedPacks);
  await store.saveRuntimeState(expectedState);

  const backup = await createJsonFlashStoreBackup({
    dataPath,
    statePath,
    backupPath,
    label: "alpha-pre-deploy-drill",
    createdAt: "2026-05-27T00:00:00.000Z",
  });
  assert.deepEqual(validateJsonFlashStoreBackup(backup), []);

  await store.savePacks([{ id: "mutated" }]);
  await store.saveRuntimeState({ activeDeviceId: "mutated", orders: [] });

  await restoreJsonFlashStoreBackup({ backupPath, dataPath, statePath });

  const restored = createJsonFlashStore({ dataPath, statePath, seedPath });
  assert.deepEqual(await restored.loadPacks(), expectedPacks);
  assert.deepEqual(await restored.loadRuntimeState(), expectedState);

  console.log(`Alpha backup/restore drill passed: files=2, checksum=${backup.checksum}`);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
