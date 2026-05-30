import assert from "node:assert/strict";
import test from "node:test";

import {
  HARDWARE_STUDIO_EXPORT_REQUIRED_FILES,
  HARDWARE_STUDIO_EXPORT_VERSION,
  createHardwareStudioChecksum,
  createHardwareStudioExportBundle,
  validateHardwareStudioExportBundle,
} from "./index.js";

function makeHardwareExportPack(overrides = {}) {
  return {
    id: "h5_export_ready",
    schemaVersion: "gugu_h5_pack_v1",
    title: "硬件导出测试",
    author: { id: "official", name: "Gugu" },
    capabilities: ["scene_graph", "branching"],
    status: "public_h5",
    storeStatus: "pack_review",
    contentOrigin: "original",
    rightsAcknowledgedAt: 1760000000000,
    persona: {
      id: "rain_gugu",
      name: "雨天咕咕",
      roleType: "official",
    },
    cover: { character: "G" },
    entrySceneId: "start",
    work: { id: "work_h5_export_ready" },
    workVersion: { id: "wv_h5_export_ready_001" },
    storeListing: { id: "listing_h5_export_ready", status: "pack_review", updatedAt: 1760000000000 },
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
    scenes: [
      { id: "start", text: "开始", actions: [{ label: "继续", goto: "end" }] },
      { id: "end", text: "结束", actions: [{ label: "重来", goto: "start" }] },
    ],
    ...overrides,
  };
}

test("hardware studio checksum is stable sha256 over sorted JSON", () => {
  const left = createHardwareStudioChecksum({ b: 2, a: 1 });
  const right = createHardwareStudioChecksum({ a: 1, b: 2 });

  assert.equal(left, right);
  assert.match(left, /^sha256:[a-f0-9]{64}$/);
});

test("hardware studio export bundle contains manifest, payload, report, and checksums", () => {
  const bundle = createHardwareStudioExportBundle(makeHardwareExportPack(), {
    exportId: "hw_export_test_001",
    generatedAt: 1760000000001,
  });

  assert.equal(bundle.schemaVersion, HARDWARE_STUDIO_EXPORT_VERSION);
  assert.equal(bundle.status, "ready_for_hardware_studio");
  assert.equal(bundle.exportId, "hw_export_test_001");
  assert.equal(bundle.payload.offlineUseAllowed, true);
  assert.equal(bundle.hardwarePack.checksum, createHardwareStudioChecksum(bundle.payload));
  assert.deepEqual(validateHardwareStudioExportBundle(bundle), []);
  for (const path of HARDWARE_STUDIO_EXPORT_REQUIRED_FILES) {
    assert.ok(bundle.files.some((file) => file.path === path), `${path} should exist`);
  }
  assert.ok(bundle.checksumsSha256.includes("payload/story.json"));
  assert.equal(bundle.studioImport.requiresNativePackaging, true);
});

test("hardware studio export blocks incompatible packs with evidence", () => {
  const bundle = createHardwareStudioExportBundle(makeHardwareExportPack({
    capabilities: ["scene_graph", "network_asset"],
  }), {
    exportId: "hw_export_blocked_001",
  });

  assert.equal(bundle.status, "blocked");
  assert.equal(bundle.reason, "compatibility_failed");
  assert.equal(bundle.compatibilityReport.canCreateHardwarePack, false);
  assert.deepEqual(validateHardwareStudioExportBundle(bundle), []);
});
