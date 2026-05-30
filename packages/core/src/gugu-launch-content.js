import { buildHardwarePackFromReport, createCompatibilityReport } from "./gugu-hardware-compat.js";

export const LAUNCH_HARDWARE_PACK_MANIFEST_VERSION = "gugu_launch_hardware_packs_v1";
export const LAUNCH_HARDWARE_PAYLOAD_VERSION = "gugu_hardware_payload_v1";

export const LAUNCH_CONTENT_REQUIRED_SMOKE_CASES = [
  "launch_pack_schema_valid",
  "circle185_compatibility_passed",
  "checksum_matches_payload",
  "offline_use_allowed",
  "support_copy_ready",
];

export function isLaunchHardwareCandidate(pack = {}, report = createCompatibilityReport(pack)) {
  return pack.status === "public_h5"
    && pack.contentOrigin !== "fanwork"
    && pack.rightsAcknowledgedAt
    && ["listed", "production_queued", "producing", "pack_review"].includes(pack.storeStatus || pack.storeListing?.status)
    && pack.persona?.roleType === "official"
    && report?.canCreateHardwarePack === true;
}

export function createLaunchHardwarePayload(pack = {}, hardwarePack = {}, options = {}) {
  const scenes = (pack.scenes || []).map((scene) => ({
    id: scene.id,
    speaker: scene.speaker || pack.persona?.name || pack.title,
    text: scene.text || "",
    character: scene.character || pack.cover?.character || "",
    actionCount: (scene.actions || []).length,
    actions: (scene.actions || []).map((action) => ({
      label: action.label,
      goto: action.goto,
    })),
  }));

  return {
    payloadVersion: LAUNCH_HARDWARE_PAYLOAD_VERSION,
    sourcePackId: pack.id,
    title: pack.title,
    personaId: pack.persona?.id || null,
    personaName: pack.persona?.name || null,
    hardwarePackId: hardwarePack.id,
    hardwarePackVersion: hardwarePack.version,
    entrySceneId: pack.entrySceneId,
    sceneCount: scenes.length,
    actionCount: scenes.reduce((sum, scene) => sum + scene.actionCount, 0),
    renderMode: options.renderMode || "static_scene_graph",
    offlineUseAllowed: true,
    generatedAt: options.generatedAt || pack.updatedAt || pack.createdAt || null,
    scenes,
  };
}

export function buildLaunchHardwarePackCandidate(pack = {}, options = {}) {
  const report = createCompatibilityReport(pack, {
    id: options.compatibilityReportId || `compat_${pack.id}_launch`,
    timestamp: options.timestamp,
    createdAt: options.createdAt,
    updatedAt: options.updatedAt,
    targetProfileId: options.targetProfileId,
  });

  if (!isLaunchHardwareCandidate(pack, report)) return null;

  const hardwarePack = buildHardwarePackFromReport(pack, report, {
    id: options.hardwarePackId || pack.hardwarePack?.id || `hw_${pack.id}`,
    status: "available",
    version: options.version || "1.0.0",
    checksum: options.checksum || "sha256:pending",
    downloadUrl: options.downloadUrl || `/packs/${options.hardwarePackId || pack.hardwarePack?.id || `hw_${pack.id}`}-1.0.0.json`,
    updatedAt: options.updatedAt || report.updatedAt,
  });
  const payload = createLaunchHardwarePayload(pack, hardwarePack, {
    generatedAt: options.generatedAt || report.updatedAt,
  });

  return {
    id: hardwarePack.id,
    sourcePackId: pack.id,
    title: pack.title,
    pricingType: options.pricingType || "official_free",
    status: "available",
    reviewStatus: "approved",
    compatibilityReport: report,
    hardwarePack,
    payload,
    smokeCases: [...LAUNCH_CONTENT_REQUIRED_SMOKE_CASES],
  };
}

export function validateLaunchHardwareManifest(manifest = {}, seedPacks = []) {
  const errors = [];
  const seedById = new Map(seedPacks.map((pack) => [pack.id, pack]));

  if (manifest.schemaVersion !== LAUNCH_HARDWARE_PACK_MANIFEST_VERSION) {
    errors.push(`manifest.schemaVersion must be ${LAUNCH_HARDWARE_PACK_MANIFEST_VERSION}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(manifest.updatedAt || "")) {
    errors.push("manifest.updatedAt must be YYYY-MM-DD");
  }
  if (!Array.isArray(manifest.hardwarePacks) || !manifest.hardwarePacks.length) {
    errors.push("manifest.hardwarePacks must include at least one launch hardware pack");
  }

  for (const item of manifest.hardwarePacks || []) {
    const source = seedById.get(item.sourcePackId);
    if (!source) {
      errors.push(`${item.id}: sourcePackId not found in seed packs`);
      continue;
    }
    if (source.contentOrigin === "fanwork") errors.push(`${item.id}: fanwork cannot be official launch hardware content`);
    if (!source.rightsAcknowledgedAt) errors.push(`${item.id}: source pack must have rights acknowledgement`);
    if (item.pricingType !== "official_free") errors.push(`${item.id}: pricingType must be official_free for Public MVP seed launch`);
    if (item.status !== "available") errors.push(`${item.id}: status must be available`);
    if (item.reviewStatus !== "approved") errors.push(`${item.id}: reviewStatus must be approved`);
    if (!/^sha256:[a-f0-9]{64}$/.test(item.hardwarePack?.checksum || "")) {
      errors.push(`${item.id}: hardwarePack.checksum must be a sha256 hex digest`);
    }
    if (item.payload?.payloadVersion !== LAUNCH_HARDWARE_PAYLOAD_VERSION) {
      errors.push(`${item.id}: payload.payloadVersion must be ${LAUNCH_HARDWARE_PAYLOAD_VERSION}`);
    }
    if (item.payload?.offlineUseAllowed !== true) {
      errors.push(`${item.id}: payload.offlineUseAllowed must be true`);
    }
    for (const smokeCase of LAUNCH_CONTENT_REQUIRED_SMOKE_CASES) {
      if (!Array.isArray(item.smokeCases) || !item.smokeCases.includes(smokeCase)) {
        errors.push(`${item.id}: smokeCases missing ${smokeCase}`);
      }
    }
  }

  return errors;
}
