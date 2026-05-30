import assert from "node:assert/strict";
import test from "node:test";

import {
  GUGU_H5_SCHEMA_VERSION,
  buildHardwarePackFromReport,
  createCompatibilityReport,
} from "./index.js";

function makePack(overrides = {}) {
  return {
    id: "h5_compat",
    schemaVersion: GUGU_H5_SCHEMA_VERSION,
    title: "兼容测试",
    capabilities: ["scene_graph", "branching"],
    status: "public_h5",
    storeStatus: "production_queued",
    contentOrigin: "original",
    work: { id: "work_h5_compat" },
    workVersion: { id: "wv_h5_compat_1" },
    storeListing: { id: "listing_h5_compat", status: "production_queued" },
    cover: { background: "#111827", character: "G" },
    entrySceneId: "start",
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
    scenes: [
      {
        id: "start",
        text: "开始。",
        actions: [{ label: "继续", goto: "end" }],
      },
      {
        id: "end",
        text: "结束。",
        actions: [{ label: "重来", goto: "start" }],
      },
    ],
    ...overrides,
  };
}

test("compatible H5 pack can build an independent hardware pack", () => {
  const pack = makePack();
  const report = createCompatibilityReport(pack, { timestamp: 1760000000001 });
  const hardwarePack = buildHardwarePackFromReport(pack, report, { status: "building" });

  assert.equal(report.status, "passed");
  assert.equal(report.compatibilityLevel, "compatible");
  assert.equal(report.canCreateHardwarePack, true);
  assert.equal(report.sourceWorkVersionId, "wv_h5_compat_1");
  assert.equal(hardwarePack.status, "building");
  assert.equal(hardwarePack.sourceWorkVersionId, "wv_h5_compat_1");
  assert.equal(hardwarePack.compatibilityReportId, report.id);
  assert.match(hardwarePack.checksum, /^sha256:h5_compat:wv_h5_compat_1:circle_185:1\.0\.0$/);
});

test("degradable H5 capabilities create explicit degradation records", () => {
  const pack = makePack({
    capabilities: ["scene_graph", "timed_events", "variables", "animation"],
  });
  const report = createCompatibilityReport(pack);
  const hardwarePack = buildHardwarePackFromReport(pack, report);

  assert.equal(report.status, "passed");
  assert.equal(report.compatibilityLevel, "degrade_required");
  assert.deepEqual(report.degradableCapabilities, ["timed_events", "variables", "animation"]);
  assert.equal(report.degradeActions.length, 3);
  assert.equal(hardwarePack.degradationRecords.length, 3);
});

test("blocked H5 capabilities cannot create a hardware pack", () => {
  const pack = makePack({
    capabilities: ["scene_graph", "network_asset", "external_link"],
  });
  const report = createCompatibilityReport(pack);
  const hardwarePack = buildHardwarePackFromReport(pack, report);

  assert.equal(report.status, "failed");
  assert.equal(report.compatibilityLevel, "incompatible");
  assert.deepEqual(report.unsupportedCapabilities, ["network_asset", "external_link"]);
  assert.equal(report.canCreateHardwarePack, false);
  assert.equal(hardwarePack, null);
});
