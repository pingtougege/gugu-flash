import assert from "node:assert/strict";
import test from "node:test";

import {
  LAUNCH_CONTENT_REQUIRED_SMOKE_CASES,
  LAUNCH_HARDWARE_PACK_MANIFEST_VERSION,
  buildLaunchHardwarePackCandidate,
  isLaunchHardwareCandidate,
  validateLaunchHardwareManifest,
} from "./index.js";

function makeLaunchPack(overrides = {}) {
  return {
    id: "h5_launch",
    schemaVersion: "gugu_h5_pack_v1",
    title: "启动内容",
    author: { id: "official", name: "Gugu" },
    capabilities: ["scene_graph", "branching"],
    status: "public_h5",
    storeStatus: "listed",
    contentOrigin: "original",
    rightsAcknowledgedAt: 1760000000000,
    persona: {
      id: "rain_gugu",
      name: "雨天咕咕",
      avatar: "G",
      roleType: "official",
    },
    cover: { background: "#0f172a", character: "G" },
    entrySceneId: "start",
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
    scenes: [
      { id: "start", text: "开始", actions: [{ label: "继续", goto: "end" }] },
      { id: "end", text: "结束", actions: [{ label: "重来", goto: "start" }] },
    ],
    ...overrides,
  };
}

test("official launch H5 can become an available launch hardware pack candidate", () => {
  const pack = makeLaunchPack();
  const candidate = buildLaunchHardwarePackCandidate(pack, {
    checksum: "sha256:".padEnd(71, "a"),
    timestamp: 1760000000001,
  });

  assert.equal(isLaunchHardwareCandidate(pack, candidate.compatibilityReport), true);
  assert.equal(candidate.status, "available");
  assert.equal(candidate.pricingType, "official_free");
  assert.equal(candidate.hardwarePack.status, "available");
  assert.equal(candidate.payload.offlineUseAllowed, true);
  assert.deepEqual(candidate.smokeCases, LAUNCH_CONTENT_REQUIRED_SMOKE_CASES);
});

test("launch hardware candidate rejects fanwork and missing rights acknowledgement", () => {
  assert.equal(buildLaunchHardwarePackCandidate(makeLaunchPack({ contentOrigin: "fanwork" })), null);
  assert.equal(buildLaunchHardwarePackCandidate(makeLaunchPack({ rightsAcknowledgedAt: null })), null);
});

test("launch hardware manifest validates source, checksum, payload, and smoke cases", () => {
  const pack = makeLaunchPack();
  const candidate = buildLaunchHardwarePackCandidate(pack, {
    checksum: "sha256:".padEnd(71, "b"),
    timestamp: 1760000000001,
  });
  const manifest = {
    schemaVersion: LAUNCH_HARDWARE_PACK_MANIFEST_VERSION,
    updatedAt: "2026-05-27",
    hardwarePacks: [candidate],
  };

  assert.deepEqual(validateLaunchHardwareManifest(manifest, [pack]), []);

  const invalid = structuredClone(manifest);
  invalid.hardwarePacks[0].hardwarePack.checksum = "sha256:pending";
  assert.ok(validateLaunchHardwareManifest(invalid, [pack]).some((error) => error.includes("checksum")));
});
