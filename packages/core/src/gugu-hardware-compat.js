import { GUGU_H5_SCHEMA_VERSION } from "./gugu-h5-pack.js";

export const HARDWARE_DEVICE_PROFILES = {
  circle_185: {
    id: "circle_185",
    model: "Circle 185",
    minFirmwareVersion: "1.2.0",
    formatVersion: "hw_pack_v1",
    supportedCapabilities: ["scene_graph", "branching", "uploaded_assets", "basic_audio"],
    degradableCapabilities: ["timed_events", "variables", "animation"],
    blockedCapabilities: ["network_asset", "external_link"],
    resourceBudget: {
      maxScenes: 30,
      maxNodes: 80,
      maxSizeKb: 512,
      maxImageCount: 24,
      maxAudioCount: 6,
    },
  },
};

export const HARDWARE_COMPATIBILITY_LEVEL_LABELS = {
  compatible: "可直接制作",
  degrade_required: "需降级制作",
  incompatible: "暂不支持制作",
};

export const HARDWARE_COMPATIBILITY_STATUS_LABELS = {
  pending: "等待检测",
  running: "检测中",
  passed: "检测通过",
  failed: "检测失败",
  waived: "人工豁免",
};

const HARDWARE_DEGRADE_ACTIONS = {
  timed_events: {
    action: "定时事件改为点击推进或固定帧序列。",
    impact: "保留叙事节奏，但设备端不依赖后台计时器。",
  },
  variables: {
    action: "变量和条件判断展开为静态分支。",
    impact: "保留主要选择路径，减少运行时状态依赖。",
  },
  animation: {
    action: "动画效果降级为关键帧或静态帧。",
    impact: "保留视觉重点，降低设备端渲染压力。",
  },
};

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getProfile(profileId) {
  return HARDWARE_DEVICE_PROFILES[profileId] || HARDWARE_DEVICE_PROFILES.circle_185;
}

function sceneActionCount(pack) {
  return (pack.scenes || []).reduce((sum, scene) => sum + (scene.actions || []).length, 0);
}

export function estimateHardwareResources(pack) {
  const capabilities = new Set(pack.capabilities || []);
  const sceneCount = (pack.scenes || []).length;
  const actionCount = sceneActionCount(pack);
  const imageCount = sceneCount + (pack.cover ? 1 : 0);
  const audioCount = capabilities.has("basic_audio") ? 1 : 0;
  const estimatedSizeKb = Math.round(
    64 +
    sceneCount * 24 +
    actionCount * 4 +
    (capabilities.has("uploaded_assets") ? 80 : 0) +
    (capabilities.has("basic_audio") ? 96 : 0) +
    (capabilities.has("animation") ? 72 : 0),
  );

  return {
    sceneCount,
    actionCount,
    nodeCount: sceneCount + actionCount,
    imageCount,
    audioCount,
    estimatedSizeKb,
  };
}

export function createCompatibilityReport(pack, options = {}) {
  const profile = getProfile(options.targetProfileId);
  const capabilities = uniq(pack.capabilities?.length ? pack.capabilities : ["scene_graph"]);
  const profileCapabilitySet = new Set([
    ...profile.supportedCapabilities,
    ...profile.degradableCapabilities,
    ...profile.blockedCapabilities,
  ]);
  const supportedCapabilities = capabilities.filter((capability) => profile.supportedCapabilities.includes(capability));
  const degradableCapabilities = capabilities.filter((capability) => profile.degradableCapabilities.includes(capability));
  const blockedCapabilities = capabilities.filter((capability) => profile.blockedCapabilities.includes(capability));
  const unknownCapabilities = capabilities.filter((capability) => !profileCapabilitySet.has(capability));
  const unsupportedCapabilities = uniq([...blockedCapabilities, ...unknownCapabilities]);
  const actual = estimateHardwareResources(pack);
  const budget = profile.resourceBudget;
  const budgetFindings = [
    actual.sceneCount > budget.maxScenes ? `场景数 ${actual.sceneCount}/${budget.maxScenes} 超出设备上限。` : null,
    actual.nodeCount > budget.maxNodes ? `节点数 ${actual.nodeCount}/${budget.maxNodes} 超出设备上限。` : null,
    actual.estimatedSizeKb > budget.maxSizeKb ? `预估体积 ${actual.estimatedSizeKb}/${budget.maxSizeKb} KB 超出设备上限。` : null,
    actual.imageCount > budget.maxImageCount ? `图片资源 ${actual.imageCount}/${budget.maxImageCount} 超出设备上限。` : null,
    actual.audioCount > budget.maxAudioCount ? `音频资源 ${actual.audioCount}/${budget.maxAudioCount} 超出设备上限。` : null,
  ].filter(Boolean);
  const degradeActions = degradableCapabilities.map((capability) => ({
    capability,
    ...HARDWARE_DEGRADE_ACTIONS[capability],
  }));
  const compatibilityLevel = unsupportedCapabilities.length || budgetFindings.length
    ? "incompatible"
    : (degradeActions.length ? "degrade_required" : "compatible");
  const status = compatibilityLevel === "incompatible" ? "failed" : "passed";
  const sourceWorkId = pack.work?.id || `work_${pack.id}`;
  const sourceWorkVersionId = pack.workVersion?.id || `wv_${pack.id}_${pack.updatedAt || pack.createdAt || 0}`;
  const now = options.timestamp || Date.now();

  return {
    id: options.id || `compat_${pack.id}`,
    hardwarePackId: options.hardwarePackId || pack.hardwarePack?.id || `hw_${pack.id}`,
    workId: sourceWorkId,
    workVersionId: sourceWorkVersionId,
    sourceWorkVersionId,
    sourceSchemaVersion: pack.schemaVersion || GUGU_H5_SCHEMA_VERSION,
    targetProfileId: profile.id,
    targetDeviceModels: [profile.model],
    minFirmwareVersion: profile.minFirmwareVersion,
    formatVersion: profile.formatVersion,
    status,
    statusLabel: HARDWARE_COMPATIBILITY_STATUS_LABELS[status],
    compatibilityLevel,
    compatibilityLevelLabel: HARDWARE_COMPATIBILITY_LEVEL_LABELS[compatibilityLevel],
    supportedCapabilities,
    degradableCapabilities,
    unsupportedCapabilities,
    degradeActions,
    resourceBudget: {
      ...budget,
      actual,
    },
    findings: [
      ...unsupportedCapabilities.map((capability) => `设备端暂不支持 ${capability}。`),
      ...budgetFindings,
      ...(degradeActions.length ? degradeActions.map((item) => item.action) : ["可按当前内容结构直接制作设备包。"]),
    ],
    canCreateHardwarePack: status !== "failed",
    createdAt: options.createdAt || pack.storeListing?.updatedAt || pack.updatedAt || now,
    updatedAt: options.updatedAt || now,
  };
}

export function buildHardwarePackFromReport(pack, report = createCompatibilityReport(pack), options = {}) {
  if (!report.canCreateHardwarePack) return null;
  const status = options.status || pack.hardwarePack?.status || "draft";
  const version = options.version || pack.hardwarePack?.version || "1.0.0";
  const sourceWorkId = report.workId || pack.work?.id || `work_${pack.id}`;
  const sourceWorkVersionId = report.sourceWorkVersionId || report.workVersionId;
  const hardwarePackId = options.id || pack.hardwarePack?.id || `hw_${pack.id}`;

  return {
    id: hardwarePackId,
    sourceWorkId,
    sourceWorkVersionId,
    sourceSchemaVersion: report.sourceSchemaVersion || pack.schemaVersion || GUGU_H5_SCHEMA_VERSION,
    storeListingId: pack.storeListing?.id || `listing_${pack.id}`,
    version,
    formatVersion: report.formatVersion,
    compatibilityReportId: report.id,
    status,
    targetDeviceModels: report.targetDeviceModels,
    minFirmwareVersion: report.minFirmwareVersion,
    checksum: options.checksum || `sha256:${pack.id}:${sourceWorkVersionId}:${report.targetProfileId}:${version}`,
    downloadUrl: options.downloadUrl || `/packs/${hardwarePackId}-${version}.bin`,
    resourceBudget: report.resourceBudget,
    packageSizeKb: report.resourceBudget.actual.estimatedSizeKb,
    degradationRecords: report.degradeActions.map((item) => ({
      capability: item.capability,
      action: item.action,
      impact: item.impact,
      recordedAt: report.updatedAt,
    })),
    reviewStatus: status === "available" ? "approved" : "pending",
    createdAt: pack.hardwarePack?.createdAt || report.createdAt,
    updatedAt: options.updatedAt || report.updatedAt,
  };
}
