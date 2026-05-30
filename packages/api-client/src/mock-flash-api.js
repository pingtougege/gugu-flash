import {
  buildHardwarePackFromReport,
  cloneAsRemix,
  collectAnimeIpCandidates,
  collectAnimeIpCharacterCandidates,
  createAiEditProposalPreview,
  createDeviceSyncEvidence,
  createCompatibilityReport,
  createDraftQualityChecks,
  createPublishChecklist,
  compileStoryProjectToComicEpisode,
  compileStoryProjectToH5Pack,
  createStoryProjectFromPrompt,
  createStoryProjectPlayabilityReport,
  contentOriginLabel,
  discoverWebwideIpCandidates,
  formatNumber,
  importAnimeIpCandidates,
  mergeCandidateLists,
  getZone,
  GUGU_STORY_PROJECT_SCHEMA_VERSION,
  GUGU_IP_POOL,
  ROLE_PERSONAS,
  normalizePack,
  scorePack,
  STORE_STATUS_ADVANCE,
  validateStoryProject,
  ZONE_APPLICATION_THRESHOLDS,
} from "../../core/src/index.js";

const HARDWARE_PRODUCTION_STATUSES = new Set(["production_queued", "producing", "pack_review", "listed"]);
const MIN_SYNC_BATTERY_LEVEL = 20;
const SYNC_FAILURE_MESSAGES = {
  device_offline: "设备离线，请靠近设备并重新连接。",
  ble_disconnected: "连接中断，请靠近设备后重试。",
  firmware_too_low: "设备固件版本过低，请升级后重试。",
  unsupported_device_model: "当前设备型号暂不支持这个内容包。",
  insufficient_storage: "设备空间不足，请清理后重试。",
  low_battery: "设备电量过低，请充电后重试。",
  download_failed: "下载失败，请检查网络后重试。",
  checksum_failed: "文件校验失败，请重新下载。",
  package_expired: "内容包版本已过期，请等待新版。",
  entitlement_missing: "当前设备还没有购买或领取这个内容包。",
  hardware_pack_unavailable: "内容已下架或暂停下载，不能同步到新设备。",
  write_failed: "写入设备失败，已尝试恢复原内容。",
  verify_failed: "设备校验失败，已保留原内容。",
  timeout: "同步超时，请重新连接设备后重试。",
  unknown: "同步失败，请稍后重试。",
};
const PAYMENT_SUCCESS_STATUSES = new Set(["succeeded", "success", "paid"]);
const PAYMENT_FAILURE_STATUSES = new Set(["failed", "cancelled", "canceled", "expired"]);
const LIVE_IP_DISCOVERY_TIMEOUT_MS = 12000;

export function createMockFlashApi({
  loadPacks,
  savePacks,
  ipPool = GUGU_IP_POOL,
  rolePersonas = ROLE_PERSONAS,
  initialState = null,
}) {
  let packsCache = null;
  let storeCatalogCache = null;
  let devicesCache = null;
  let deviceEntitlementsCache = null;
  let deviceInstallsCache = null;
  let deviceSyncJobsCache = null;
  let ordersCache = null;
  let settlementsCache = null;
  let commentsCache = null;
  let blockRelationsCache = null;
  let reportsCache = null;
  let rightsClaimsCache = null;
  let appealsCache = null;
  let moderationActionsCache = null;
  let operationLogsCache = null;
  let paymentCallbacksCache = null;
  let refundCallbacksCache = null;
  let zoneApplicationsCache = null;
  let ipZoneOverridesCache = null;
  let storyProjectsCache = null;
  let storyProjectVersionsCache = null;
  let aiGenerationJobsCache = null;
  let storyProjectsDirty = false;
  let storyProjectVersionsDirty = false;
  let aiGenerationJobsDirty = false;
  let activeDeviceId = "badge_s3_01";

  function importRuntimeState(state = {}) {
    if (!state || typeof state !== "object") return;
    devicesCache = state.devices ?? devicesCache;
    deviceEntitlementsCache = state.deviceEntitlements ?? deviceEntitlementsCache;
    deviceInstallsCache = state.deviceInstalls ?? deviceInstallsCache;
    deviceSyncJobsCache = state.deviceSyncJobs ?? deviceSyncJobsCache;
    ordersCache = state.orders ?? ordersCache;
    settlementsCache = state.settlements ?? settlementsCache;
    commentsCache = state.comments ?? commentsCache;
    blockRelationsCache = state.blockRelations ?? blockRelationsCache;
    reportsCache = state.reports ?? reportsCache;
    rightsClaimsCache = state.rightsClaims ?? rightsClaimsCache;
    appealsCache = state.appeals ?? appealsCache;
    moderationActionsCache = state.moderationActions ?? moderationActionsCache;
    operationLogsCache = state.operationLogs ?? operationLogsCache;
    paymentCallbacksCache = state.paymentCallbacks ?? paymentCallbacksCache;
    refundCallbacksCache = state.refundCallbacks ?? refundCallbacksCache;
    zoneApplicationsCache = state.zoneApplications ?? zoneApplicationsCache;
    ipZoneOverridesCache = state.ipZoneOverrides ?? ipZoneOverridesCache;
    storyProjectsCache = state.storyProjects ?? storyProjectsCache;
    storyProjectVersionsCache = state.storyProjectVersions ?? storyProjectVersionsCache;
    aiGenerationJobsCache = state.aiGenerationJobs ?? aiGenerationJobsCache;
    storyProjectsDirty = false;
    storyProjectVersionsDirty = false;
    aiGenerationJobsDirty = false;
    activeDeviceId = state.activeDeviceId ?? activeDeviceId;
  }

  async function runLiveIpDiscovery(options = {}) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), LIVE_IP_DISCOVERY_TIMEOUT_MS) : null;
    try {
      return await discoverWebwideIpCandidates({
        ...options,
        signal: controller?.signal,
      });
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function exportRuntimeState() {
    const state = {
      devices: devicesCache,
      deviceEntitlements: deviceEntitlementsCache,
      deviceInstalls: deviceInstallsCache,
      deviceSyncJobs: deviceSyncJobsCache,
      orders: ordersCache,
      settlements: settlementsCache,
      comments: commentsCache,
      blockRelations: blockRelationsCache,
      reports: reportsCache,
      rightsClaims: rightsClaimsCache,
      appeals: appealsCache,
      moderationActions: moderationActionsCache,
      operationLogs: operationLogsCache,
      paymentCallbacks: paymentCallbacksCache,
      refundCallbacks: refundCallbacksCache,
      zoneApplications: zoneApplicationsCache,
      ipZoneOverrides: ipZoneOverridesCache,
      activeDeviceId,
    };
    if (storyProjectsDirty) state.storyProjects = storyProjectsCache;
    if (storyProjectVersionsDirty) state.storyProjectVersions = storyProjectVersionsCache;
    if (aiGenerationJobsDirty) state.aiGenerationJobs = aiGenerationJobsCache;
    return structuredClone(state);
  }

  importRuntimeState(initialState);

  function localGetIpEntry(ipId) {
    return ipPool[ipId] || null;
  }

  function localGetPersona(personaId) {
    return rolePersonas[personaId] || ROLE_PERSONAS[personaId] || ROLE_PERSONAS.rain_gugu;
  }

  function localGetPersonasForIp(ipId) {
    const entry = localGetIpEntry(ipId);
    if (!entry) return [localGetPersona("rain_gugu")];
    const personaIds = entry.personaIds || [];
    return personaIds.map(localGetPersona);
  }

  async function getPacks() {
    if (!packsCache) packsCache = (await loadPacks()).map(normalizePack).map(ensureHardwareProductionState);
    return packsCache;
  }

  async function commit(packs) {
    packsCache = packs.map(normalizePack).map(ensureHardwareProductionState);
    await savePacks(packsCache);
    return packsCache;
  }

  async function findPack(id) {
    const packs = await getPacks();
    return packs.find((pack) => pack.id === id);
  }

  async function findPackForTarget(targetType, targetId) {
    const packs = await getPacks();
    if (targetType === "Comment") {
      await ensureCommunityState();
      const comment = commentsCache.find((item) => item.id === targetId);
      if (comment) return packs.find((pack) => pack.id === comment.workId) || null;
    }
    return packs.find((pack) => (
      pack.id === targetId ||
      pack.work?.id === targetId ||
      pack.storeListing?.id === targetId ||
      pack.hardwarePack?.id === targetId ||
      `store_${pack.id}` === targetId ||
      (targetType === "Work" && pack.id === targetId) ||
      (targetType === "StoreListing" && pack.storeListing?.id === targetId) ||
      (targetType === "HardwarePack" && pack.hardwarePack?.id === targetId)
    )) || null;
  }

  async function getStoreCatalog() {
    if (storeCatalogCache) return storeCatalogCache;
    const packs = await getPacks();
    storeCatalogCache = packs
      .filter((pack) => isStoreVisibleHardwarePack(pack))
      .sort((a, b) => scorePack(b) - scorePack(a))
      .map(makeStoreCatalogItem);
    return storeCatalogCache;
  }

  function invalidateBadgeLibrary() {
    storeCatalogCache = null;
  }

  function ensureGovernanceState() {
    if (!reportsCache) reportsCache = [];
    if (!rightsClaimsCache) rightsClaimsCache = [];
    if (!appealsCache) appealsCache = [];
    if (!moderationActionsCache) moderationActionsCache = [];
  }

  async function ensureCommunityState() {
    if (commentsCache && blockRelationsCache) return;
    const packs = await getPacks();
    blockRelationsCache = blockRelationsCache || [];
    if (!commentsCache) {
      commentsCache = packs.slice(0, 3).flatMap((pack, index) => [
        makeSeedComment(pack, {
          id: `comment_seed_${pack.id}_mika`,
          userId: "user_mika",
          authorName: "Mika",
          body: index === 0 ? "这个结尾很适合放进吧唧里，轻轻闪一下就够了。" : "这个分身好鲜活，想看更多分支。",
          createdAt: (pack.createdAt || Date.now()) + 1000,
        }),
        makeSeedComment(pack, {
          id: `comment_seed_${pack.id}_noa`,
          userId: "user_noa",
          authorName: "Noa",
          body: index === 0 ? "雨天咕咕这句台词可以做成循环待机。" : "我想 Remix 一个更元气的版本。",
          createdAt: (pack.createdAt || Date.now()) + 2000,
        }),
      ]);
    }
  }

  function hardwarePackAvailableForNewUse(pack) {
    return pack.storeListing?.status === "listed" && pack.hardwarePack?.status === "available";
  }

  function isStoreVisibleHardwarePack(pack) {
    const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
    const hardwareStatus = pack.hardwarePack?.status || null;
    return ["listed", "delisted", "frozen"].includes(storeStatus) &&
      ["available", "paused", "deprecated", "removed"].includes(hardwareStatus);
  }

  function hardwareAvailabilityReason(pack) {
    const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
    const hardwareStatus = pack.hardwarePack?.status || null;
    if (hardwarePackAvailableForNewUse(pack)) return "available";
    if (storeStatus === "delisted" || hardwareStatus === "removed") return "delisted";
    if (storeStatus === "frozen" || hardwareStatus === "paused") return "paused";
    if (hardwareStatus === "deprecated") return "deprecated";
    return "unavailable";
  }

  function hardwareAvailabilityLabel(reason) {
    return {
      available: "可购买 / 下载 / 同步",
      delisted: "已下架，停止新购买和下载",
      paused: "暂停下载和同步",
      deprecated: "已过期，等待新版",
      unavailable: "暂不可下载",
    }[reason] || "暂不可下载";
  }

  function makeStoreCatalogItem(pack, index = 0) {
    const availabilityReason = hardwareAvailabilityReason(pack);
    const availableForNewUse = availabilityReason === "available";
    return {
      id: `store_${pack.id}`,
      packId: pack.id,
      hardwarePackId: pack.hardwarePack?.id,
      title: pack.title,
      description: `${getZone(pack.zoneId).name} · ${contentOriginLabel(pack.contentOrigin)}${pack.ipName ? `《${pack.ipName}》` : ""} · 设备包 ${pack.hardwarePack?.formatVersion || "hw_pack_v1"}`,
      price: index === 0 ? 0 : (index === 1 ? 6 : 3),
      status: availableForNewUse ? "downloadable" : "unavailable",
      availableForNewUse,
      availabilityReason,
      availabilityLabel: hardwareAvailabilityLabel(availabilityReason),
      ownership: "not_owned",
      downloadStatus: "not_downloaded",
      syncStatus: "not_synced",
      cover: pack.cover,
      contentOrigin: pack.contentOrigin,
      ipId: pack.ipId,
      ipName: pack.ipName,
      zoneId: pack.zoneId,
      zoneName: pack.zoneName,
      persona: pack.persona,
      storeListing: pack.storeListing,
      hardwarePack: pack.hardwarePack,
      compatibilityReport: pack.compatibilityReport,
    };
  }

  function refreshPack(pack) {
    Object.assign(pack, normalizePack(pack));
    return pack;
  }

  function ensureHardwareProductionState(pack) {
    const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
    if (!HARDWARE_PRODUCTION_STATUSES.has(storeStatus)) return pack;

    const report = createCompatibilityReport(pack, {
      id: pack.compatibilityReport?.id || `compat_${pack.id}`,
      hardwarePackId: pack.hardwarePack?.id || `hw_${pack.id}`,
      createdAt: pack.compatibilityReport?.createdAt || pack.storeListing?.updatedAt || pack.updatedAt || pack.createdAt,
      updatedAt: pack.storeListing?.updatedAt || pack.updatedAt || Date.now(),
    });
    pack.compatibilityReport = report;

    if (!report.canCreateHardwarePack) {
      pack.hardwarePack = null;
      pack.hardwareStatus = "h5_only";
      pack.storeListing = {
        ...pack.storeListing,
        hardwarePackId: null,
      };
      return pack;
    }

    const hardwarePack = buildHardwarePackFromReport(pack, report, {
      id: pack.hardwarePack?.id,
      status: pack.hardwarePack?.status,
      version: pack.hardwarePack?.version,
      downloadUrl: pack.hardwarePack?.downloadUrl,
    });
    pack.hardwarePack = {
      ...pack.hardwarePack,
      ...hardwarePack,
    };
    pack.storeListing = {
      ...pack.storeListing,
      hardwarePackId: hardwarePack.id,
    };
    if (storeStatus === "listed") pack.hardwareStatus = "hardware_ready";
    return pack;
  }

  function makeMockId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  }

  function ensureStoryProjectState() {
    if (!storyProjectsCache) storyProjectsCache = [];
    if (!storyProjectVersionsCache) storyProjectVersionsCache = [];
    if (!aiGenerationJobsCache) aiGenerationJobsCache = [];
  }

  function storyProjectFromPayload(payload = {}) {
    return payload.project || payload.item || payload.storyProject || payload;
  }

  function normalizeStoryProjectForMock(project = {}, {
    id = null,
    existing = null,
    timestamp = Date.now(),
  } = {}) {
    const source = structuredClone(project || {});
    const author = source.author || existing?.author || {
      id: source.authorUserId || existing?.authorUserId || "user_local",
      name: "你",
    };
    const contentOrigin = source.contentOrigin ||
      source.origin?.contentOrigin ||
      existing?.contentOrigin ||
      existing?.origin?.contentOrigin ||
      "original";

    return {
      ...structuredClone(existing || {}),
      ...source,
      id: id || source.id || existing?.id || makeMockId("story_project"),
      schemaVersion: source.schemaVersion || existing?.schemaVersion || GUGU_STORY_PROJECT_SCHEMA_VERSION,
      title: source.title || existing?.title || source.brief?.title || "未命名故事工程",
      status: source.status || existing?.status || "draft",
      author,
      authorUserId: source.authorUserId || author.id || existing?.authorUserId || "user_local",
      contentOrigin,
      origin: {
        ...(existing?.origin || {}),
        ...(source.origin || {}),
        contentOrigin,
      },
      createdAt: existing?.createdAt || source.createdAt || timestamp,
      updatedAt: timestamp,
    };
  }

  function saveStoryProject(project = {}) {
    ensureStoryProjectState();
    const item = structuredClone(project);
    const index = storyProjectsCache.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) storyProjectsCache.splice(index, 1, item);
    else storyProjectsCache.unshift(item);
    storyProjectsDirty = true;
    return structuredClone(item);
  }

  function findStoryProject(id) {
    ensureStoryProjectState();
    const item = storyProjectsCache.find((project) => project.id === id);
    return item ? structuredClone(item) : null;
  }

  function createStoryProjectVersionSnapshot(project, {
    id = makeMockId("spv"),
    status = "locked",
    label = "",
    reason = "",
    timestamp = Date.now(),
  } = {}) {
    return {
      id,
      storyProjectId: project.id,
      schemaVersion: project.schemaVersion || GUGU_STORY_PROJECT_SCHEMA_VERSION,
      projectSnapshot: structuredClone(project),
      status,
      label,
      reason,
      createdAt: timestamp,
    };
  }

  function saveStoryProjectVersion(version = {}) {
    ensureStoryProjectState();
    const item = structuredClone(version);
    const index = storyProjectVersionsCache.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) storyProjectVersionsCache.splice(index, 1, item);
    else storyProjectVersionsCache.unshift(item);
    storyProjectVersionsDirty = true;
    return structuredClone(item);
  }

  function findStoryProjectVersion(id) {
    ensureStoryProjectState();
    const item = storyProjectVersionsCache.find((version) => version.id === id);
    return item ? structuredClone(item) : null;
  }

  function saveAiGenerationJob(job = {}) {
    ensureStoryProjectState();
    const item = structuredClone(job);
    const index = aiGenerationJobsCache.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) aiGenerationJobsCache.splice(index, 1, item);
    else aiGenerationJobsCache.unshift(item);
    aiGenerationJobsDirty = true;
    return structuredClone(item);
  }

  function storyProjectPackId(project = {}, payload = {}) {
    const suffix = String(project.id || "")
      .replace(/^story_project_/, "")
      .replace(/[^a-zA-Z0-9_]+/g, "_")
      .slice(0, 40) || Math.random().toString(36).slice(2, 8);
    return payload.packId || payload.h5PackId || project.outputWorkId || `h5_${suffix}`;
  }

  function createCompiledStoryDraft(project, pack, {
    draftId = makeMockId("draft"),
    timestamp = Date.now(),
    report = null,
  } = {}) {
    const qualityChecks = createDraftQualityChecks(pack);
    const checklist = createPublishChecklist(pack, { qualityChecks, target: "h5" });
    return {
      id: draftId,
      targetType: "WorkDraft",
      storyProjectId: project.id,
      storyProjectVersionId: project.versionId || null,
      authorUserId: project.authorUserId || project.author?.id || "user_local",
      contentOrigin: pack.contentOrigin || project.contentOrigin || project.origin?.contentOrigin || "original",
      ipId: pack.ipId || null,
      personaId: pack.persona?.id || project.persona?.id || null,
      status: "ready_to_preview",
      publishStatus: checklist.status,
      pack,
      h5Pack: pack,
      qualityChecks,
      checklist,
      playabilityReport: report,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  async function upsertGeneratedStoryProject(project = {}) {
    const saved = saveStoryProject(normalizeStoryProjectForMock(project, {
      timestamp: Date.now(),
    }));
    return saved;
  }

  function setStoreStatus(pack, status) {
    const now = Date.now();
    pack.storeStatus = status;
    pack.storeListing = {
      ...pack.storeListing,
      status,
      submittedAt: pack.storeListing?.submittedAt || (status === "rights_review" ? now : null),
      updatedAt: now,
    };
    if (status === "listed") {
      pack.hardwareStatus = "hardware_ready";
    }
    refreshPack(pack);
    ensureHardwareProductionState(pack);
    return pack;
  }

  function ensureOperationLogs() {
    if (!operationLogsCache) {
      operationLogsCache = [
        {
          id: "op_bootstrap_001",
          actorUserId: "operator_system",
          actorName: "系统",
          action: "bootstrap_operator_dashboard",
          targetType: "System",
          targetId: "operator_dashboard",
          targetTitle: "运营台初始化",
          detail: "已创建审核、商店和硬件制作队列。",
          status: "recorded",
          createdAt: Date.now(),
        },
      ];
    }
    return operationLogsCache;
  }

  function addOperationLog({ actorUserId = "operator_demo", actorName = "运营", action, targetType, targetId, targetTitle, detail }) {
    const logs = ensureOperationLogs();
    const log = {
      id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      actorUserId,
      actorName,
      action,
      targetType,
      targetId,
      targetTitle,
      detail,
      status: "recorded",
      createdAt: Date.now(),
    };
    logs.unshift(log);
    operationLogsCache = logs.slice(0, 20);
    return log;
  }

  function storeStatusTitle(status) {
    return {
      not_applied: "未申请上架",
      submitted: "已提交上架",
      rights_review: "权利审核中",
      production_queued: "等待制作设备包",
      producing: "设备包制作中",
      pack_review: "设备包复核中",
      listed: "已上架",
      rejected: "上架被拒",
      delisted: "已下架",
      frozen: "权利争议中",
    }[status] || status;
  }

  function hardwareQueueStage(pack) {
    const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
    if (pack.compatibilityReport?.status === "failed") {
      return { label: "兼容未通过", progress: 15 };
    }
    return {
      production_queued: { label: "等待制作", progress: 25 },
      producing: { label: "制作中", progress: 55 },
      pack_review: { label: "复核中", progress: 82 },
      listed: { label: "已开放下载", progress: 100 },
    }[storeStatus] || { label: "未进入制作", progress: 0 };
  }

  function makeReviewTask(pack) {
    const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
    const isFanwork = pack.contentOrigin === "fanwork";
    if (storeStatus === "rights_review") {
      return {
        id: `review_rights_${pack.id}`,
        packId: pack.id,
        title: pack.title,
        targetType: "StoreListing",
        targetId: pack.storeListing?.id || `listing_${pack.id}`,
        reviewType: "store_rights",
        reviewTypeLabel: "商店权利审核",
        status: "open",
        riskLevel: isFanwork ? "high" : "medium",
        riskLabel: isFanwork ? "二创 / 需确认 IP 风险" : "原创 / 常规权利承诺",
        reason: isFanwork ? "二创上架需要核对 IP 池归属和素材来源。" : "用户已签署商店上架权利承诺，等待运营初审。",
        evidence: [
          `作品归属：${pack.contentOrigin === "fanwork" ? `二创 · ${pack.ipName || "未命名 IP"}` : "原创"}`,
          `分身：${pack.persona?.name || "咕咕分身"}`,
          `权利承诺：${pack.rightsAcknowledgedAt ? "已签署" : "缺失"}`,
        ],
        createdAt: pack.storeListing?.submittedAt || pack.updatedAt || pack.createdAt || Date.now(),
      };
    }
    if (storeStatus === "pack_review") {
      return {
        id: `review_pack_${pack.id}`,
        packId: pack.id,
        title: pack.title,
        targetType: "HardwarePack",
        targetId: pack.hardwarePack?.id || `hw_${pack.id}`,
        reviewType: "hardware_pack_review",
        reviewTypeLabel: "设备包复核",
        status: "open",
        riskLevel: "medium",
        riskLabel: "硬件内容包 / 发布前复核",
        reason: "设备内容包已制作完成，需要确认兼容报告、版本和下载信息。",
        evidence: [
          `内容包：${pack.hardwarePack?.id || `hw_${pack.id}`}`,
          `兼容报告：${pack.hardwarePack?.compatibilityReportId || `compat_${pack.id}`}`,
          `兼容结论：${pack.compatibilityReport?.compatibilityLevelLabel || "等待报告"}`,
          `降级记录：${pack.compatibilityReport?.degradeActions?.length || 0} 条`,
          `格式版本：${pack.hardwarePack?.formatVersion || "hw_pack_v1"}`,
        ],
        createdAt: pack.storeListing?.updatedAt || Date.now(),
      };
    }
    return null;
  }

  function makeStoreListingRow(pack) {
    const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
    return {
      id: pack.storeListing?.id || `listing_${pack.id}`,
      packId: pack.id,
      title: pack.title,
      status: storeStatus,
      statusLabel: storeStatusTitle(storeStatus),
      originLabel: contentOriginLabel(pack.contentOrigin),
      ipName: pack.ipName,
      personaName: pack.persona?.name || "咕咕分身",
      rightsAcknowledgedAt: pack.rightsAcknowledgedAt || pack.storeListing?.rightsAcknowledgedAt || null,
      updatedAt: pack.storeListing?.updatedAt || pack.updatedAt || pack.createdAt || Date.now(),
      nextAction: STORE_STATUS_ADVANCE[storeStatus] || null,
    };
  }

  function makeHardwareQueueRow(pack) {
    ensureHardwareProductionState(pack);
    const stage = hardwareQueueStage(pack);
    const report = pack.compatibilityReport || null;
    const actualBudget = report?.resourceBudget?.actual || {};
    return {
      packId: pack.id,
      title: pack.title,
      storeStatus: pack.storeListing?.status || pack.storeStatus || "not_applied",
      stageLabel: stage.label,
      progress: stage.progress,
      hardwareStatus: pack.hardwareStatus,
      hardwarePack: pack.hardwarePack,
      compatibilityReportId: report?.id || pack.hardwarePack?.compatibilityReportId || (stage.progress ? `compat_${pack.id}` : null),
      compatibilityReport: report,
      compatibilityLevel: report?.compatibilityLevel || null,
      compatibilityLevelLabel: report?.compatibilityLevelLabel || null,
      degradeActions: report?.degradeActions || [],
      resourceBudget: report?.resourceBudget || null,
      targetDeviceModels: pack.hardwarePack?.targetDeviceModels || report?.targetDeviceModels || ["Circle 185"],
      hardwarePackVersion: pack.hardwarePack?.version || null,
      formatVersion: pack.hardwarePack?.formatVersion || report?.formatVersion || null,
      checksum: pack.hardwarePack?.checksum || null,
      packageSizeKb: pack.hardwarePack?.packageSizeKb || actualBudget.estimatedSizeKb || null,
    };
  }

  function makeSettlementRow(settlement) {
    return {
      ...settlement,
      statusLabel: {
        pending: "待结算",
        no_cash: "无现金收益",
        frozen: "已冻结",
        refunded: "已退款",
        released: "已释放",
        cancelled: "已取消",
      }[settlement.status] || settlement.status,
      amountLabel: `${settlement.amount || 0} ${settlement.currency || "CNY"}`,
    };
  }

  function makeSeedComment(pack, fields) {
    return {
      id: fields.id,
      userId: fields.userId,
      authorName: fields.authorName,
      workId: pack.id,
      workTitle: pack.title,
      body: fields.body,
      status: "visible",
      reportCount: 0,
      hiddenReason: null,
      createdAt: fields.createdAt,
      updatedAt: fields.createdAt,
    };
  }

  function commentStatusLabel(status) {
    return {
      visible: "公开",
      hidden_by_author: "作者已隐藏",
      hidden_by_platform: "平台已隐藏",
      pending_review: "待复核",
      deleted_by_user: "用户已删除",
      removed: "已移除",
    }[status] || status;
  }

  function isCommentVisible(comment) {
    return comment.status === "visible";
  }

  function isBlocked(blockerUserId, blockedUserId) {
    return (blockRelationsCache || []).some((relation) => (
      relation.blockerUserId === blockerUserId &&
      relation.blockedUserId === blockedUserId &&
      relation.status === "active"
    ));
  }

  function currentUserCanHideComment(comment, pack) {
    return pack?.author?.id === "user_local" && comment.userId !== "user_local";
  }

  function makeCommentRow(comment, pack = null) {
    return {
      ...comment,
      statusLabel: commentStatusLabel(comment.status),
      blockedByMe: isBlocked("user_local", comment.userId),
      canDelete: comment.userId === "user_local" && !["deleted_by_user", "removed"].includes(comment.status),
      canHide: currentUserCanHideComment(comment, pack) && isCommentVisible(comment),
      canReport: comment.userId !== "user_local" && isCommentVisible(comment),
      canBlock: comment.userId !== "user_local" && !isBlocked("user_local", comment.userId),
    };
  }

  async function adjustCommentMetric(workId, delta) {
    const pack = await findPack(workId);
    if (!pack) return null;
    pack.metrics = pack.metrics || {};
    pack.metrics.comments = Math.max(0, (pack.metrics.comments || 0) + delta);
    await commit(await getPacks());
    return pack;
  }

  function commentRisk(body = "") {
    const value = String(body).toLowerCase();
    if (/https?:\/\//.test(value) || value.includes("微信") || value.includes("vx") || value.includes("qq")) {
      return "external_contact";
    }
    if (value.includes("骂") || value.includes("滚") || value.includes("垃圾")) {
      return "harassment";
    }
    return null;
  }

  function makeGovernanceCaseRow(item, caseType) {
    const isReport = caseType === "report";
    const isClaim = caseType === "rights_claim";
    const isAppeal = caseType === "appeal";
    return {
      id: item.id,
      caseType,
      caseTypeLabel: isReport ? "用户举报" : (isClaim ? "权利投诉" : "用户申诉"),
      targetType: item.targetType,
      targetId: item.targetId,
      title: item.targetTitle || item.summary || item.reason || item.id,
      status: item.status,
      statusLabel: governanceStatusLabel(item.status),
      riskLabel: isClaim ? "IP / 版权风险" : (isAppeal ? "申诉复核" : reportReasonLabel(item.reason)),
      reason: item.summary || item.description || item.reason || "等待处理。",
      createdAt: item.createdAt,
      primaryAction: isAppeal ? "restore" : (isClaim ? "freeze_store" : "limit_recommend"),
    };
  }

  async function buildOperatorDashboard() {
    const packs = await getPacks();
    await ensureDeviceState();
    ensureGovernanceState();
    const pendingStoreStatuses = new Set(["rights_review", "production_queued", "producing", "pack_review"]);
    const publicPacks = packs.filter((pack) => (
      pack.status === "public_h5" ||
      pack.status === "hardware_candidate" ||
      pack.status === "hardware_ready"
    ));
    const storeListings = packs
      .filter((pack) => (pack.storeListing?.status || pack.storeStatus || "not_applied") !== "not_applied")
      .sort((a, b) => (b.storeListing?.updatedAt || b.updatedAt || 0) - (a.storeListing?.updatedAt || a.updatedAt || 0))
      .map(makeStoreListingRow);
    const reviewTasks = packs
      .map(makeReviewTask)
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);
    const hardwareQueue = packs
      .filter((pack) => ["production_queued", "producing", "pack_review", "listed"].includes(pack.storeListing?.status || pack.storeStatus))
      .sort((a, b) => hardwareQueueStage(b).progress - hardwareQueueStage(a).progress)
      .map(makeHardwareQueueRow);
    const governanceCases = [
      ...reportsCache.map((item) => makeGovernanceCaseRow(item, "report")),
      ...rightsClaimsCache.map((item) => makeGovernanceCaseRow(item, "rights_claim")),
      ...appealsCache.map((item) => makeGovernanceCaseRow(item, "appeal")),
    ].filter((item) => !["closed", "resolved", "rejected", "restored"].includes(item.status))
      .sort((a, b) => b.createdAt - a.createdAt);

    return {
      counts: {
        public: publicPacks.length,
        reviewOpen: reviewTasks.length,
        governanceOpen: governanceCases.length,
        hardwareQueue: hardwareQueue.length,
        storePending: packs.filter((pack) => pendingStoreStatuses.has(pack.storeListing?.status)).length,
        settlementFrozen: (settlementsCache || []).filter((settlement) => settlement.status === "frozen").length,
        candidate: packs.filter((pack) => pack.hardwareStatus === "hardware_candidate").length,
        ready: packs.filter((pack) => pack.hardwareStatus === "hardware_ready").length,
        storeListed: packs.filter((pack) => pack.storeListing?.status === "listed").length,
      },
      reviewTasks,
      governanceCases,
      storeListings,
      hardwareQueue,
      settlements: (settlementsCache || []).map(makeSettlementRow),
      operationLogs: ensureOperationLogs(),
      items: [...publicPacks].sort((a, b) => scorePack(b) - scorePack(a)),
    };
  }

  function ensureZoneState() {
    if (!zoneApplicationsCache) zoneApplicationsCache = [];
    if (!ipZoneOverridesCache) ipZoneOverridesCache = {};
  }

  function zoneIdForIp(ipId) {
    return `zone_${ipId}`;
  }

  function zoneForIp(entry) {
    ensureZoneState();
    if (ipZoneOverridesCache[entry.id]) return ipZoneOverridesCache[entry.id];
    if (entry.zoneStatus !== "open") return null;
    return {
      id: zoneIdForIp(entry.id),
      ipId: entry.id,
      name: `${entry.name}专区`,
      description: entry.description,
      status: "open",
      adminUserIds: ["operator_official"],
      adminNames: ["官方运营"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  function packsForIp(packs, entry) {
    return packs.filter((pack) => pack.ipId === entry.id || pack.ipName === entry.name);
  }

  function computeIpStats(entry, packs) {
    const related = packsForIp(packs, entry);
    const base = entry.communityStats || {};
    const creators = new Set(related.map((pack) => pack.author?.id || pack.author?.name).filter(Boolean));
    const hardwarePacks = related.filter((pack) => pack.hardwarePack?.status === "available").length;
    const heatScore = Math.round(related.reduce((sum, pack) => sum + scorePack(pack), 0));
    return {
      works: Math.max(base.works || 0, related.length),
      creators: Math.max(base.creators || 0, creators.size),
      personas: localGetPersonasForIp(entry.id).length,
      heatScore: Math.max(base.heatScore || 0, heatScore),
      hardwarePacks: Math.max(base.hardwarePacks || 0, hardwarePacks),
      recentViolationRate: base.recentViolationRate || 0,
      foundingInviteAcceptedCount: base.foundingInviteAcceptedCount || 0,
    };
  }

  function buildZoneEligibility(entry, packs) {
    const stats = computeIpStats(entry, packs);
    const zone = zoneForIp(entry);
    const governanceStatus = entry.governanceStatus || "active";
    const checks = [
      { id: "in_pool", label: "IP 已进入 IP 池", passed: true, current: "已入池" },
      { id: "active", label: "IP 状态正常", passed: governanceStatus === "active", current: governanceStatus },
      {
        id: "works",
        label: `作品数不少于 ${ZONE_APPLICATION_THRESHOLDS.works}`,
        passed: stats.works >= ZONE_APPLICATION_THRESHOLDS.works,
        current: `${stats.works} 个`,
      },
      {
        id: "creators",
        label: `创作者不少于 ${ZONE_APPLICATION_THRESHOLDS.creators}`,
        passed: stats.creators >= ZONE_APPLICATION_THRESHOLDS.creators,
        current: `${stats.creators} 位`,
      },
      {
        id: "heat",
        label: `热度不少于 ${formatNumber(ZONE_APPLICATION_THRESHOLDS.heatScore)}`,
        passed: stats.heatScore >= ZONE_APPLICATION_THRESHOLDS.heatScore,
        current: formatNumber(stats.heatScore),
      },
      {
        id: "risk",
        label: "近期风险低于门槛",
        passed: stats.recentViolationRate <= ZONE_APPLICATION_THRESHOLDS.maxRecentViolationRate,
        current: `${Math.round(stats.recentViolationRate * 100)}%`,
      },
      {
        id: "invites",
        label: `创始成员邀请不少于 ${ZONE_APPLICATION_THRESHOLDS.foundingInviteAcceptedCount}`,
        passed: stats.foundingInviteAcceptedCount >= ZONE_APPLICATION_THRESHOLDS.foundingInviteAcceptedCount,
        current: `${stats.foundingInviteAcceptedCount} 位`,
      },
    ];
    const eligible = !zone && checks.every((check) => check.passed);
    return {
      ipId: entry.id,
      hasZone: Boolean(zone),
      zone,
      eligible,
      statusLabel: zone ? "已开专区" : (eligible ? "可申请专区" : "未达标"),
      reason: zone
        ? "该 IP 已有正式专区。"
        : (eligible ? "已达到作品、创作者、热度和风险门槛，可以申请开通专区。" : "该 IP 仍在积累作品、创作者或热度。"),
      thresholds: ZONE_APPLICATION_THRESHOLDS,
      stats,
      checks,
    };
  }

  function makeIpPoolItem(entry, packs) {
    const eligibility = buildZoneEligibility(entry, packs);
    return {
      ...entry,
      governanceStatus: entry.governanceStatus || "active",
      personas: localGetPersonasForIp(entry.id),
      stats: eligibility.stats,
      hasZone: eligibility.hasZone,
      zone: eligibility.zone,
      zoneStatus: eligibility.hasZone ? "open" : "not_open",
      zoneEligibility: eligibility,
      statusLabel: eligibility.statusLabel,
    };
  }

  async function getDevices() {
    if (devicesCache) return devicesCache;
    devicesCache = [
      {
        id: "badge_s3_01",
        name: "雨天咕咕吧唧",
        model: "Circle 185",
        status: "在线",
        battery: 82,
        firmwareVersion: "1.2.3",
        availableStorageKb: 1024,
        boundAt: "2026-05-19",
        personaId: "rain_gugu",
        currentStoreId: null,
      },
      {
        id: "badge_s3_02",
        name: "汽水咕咕吧唧",
        model: "Circle 185",
        status: "在线",
        battery: 41,
        firmwareVersion: "1.2.3",
        availableStorageKb: 1024,
        boundAt: "2026-05-12",
        personaId: "soda_gugu",
        currentStoreId: null,
      },
    ];
    return devicesCache;
  }

  async function ensureDeviceState() {
    if (deviceEntitlementsCache && deviceInstallsCache && deviceSyncJobsCache && ordersCache && settlementsCache && refundCallbacksCache) {
      paymentCallbacksCache = paymentCallbacksCache || [];
      return;
    }
    const devices = await getDevices();
    const catalog = await getStoreCatalog();
    deviceEntitlementsCache = {};
    deviceInstallsCache = {};
    deviceSyncJobsCache = [];
    ordersCache = [];
    settlementsCache = [];
    paymentCallbacksCache = [];
    refundCallbacksCache = [];

    for (const device of devices) {
      deviceEntitlementsCache[device.id] = {};
      deviceInstallsCache[device.id] = {};
    }

    const primaryDevice = devices.find((device) => device.id === "badge_s3_01");
    const primaryItem = primaryDevice
      ? catalog.find((item) => item.availableForNewUse && item.persona?.id === primaryDevice.personaId)
      : null;
    if (primaryDevice && primaryItem) {
      const order = createOrderRecord({
        device: primaryDevice,
        item: primaryItem,
        status: "paid",
        paidAt: primaryItem.storeListing?.updatedAt || Date.now(),
      });
      ordersCache.unshift(order);
      ensureSettlementForOrder(order, primaryItem);
      deviceEntitlementsCache[primaryDevice.id][primaryItem.id] = {
        id: `entitlement_${primaryDevice.id}_${primaryItem.hardwarePackId}`,
        deviceId: primaryDevice.id,
        storeId: primaryItem.id,
        hardwarePackId: primaryItem.hardwarePackId,
        orderId: order.id,
        status: "active",
        downloadStatus: "downloaded",
        acquiredAt: primaryItem.storeListing?.updatedAt || Date.now(),
      };
      deviceInstallsCache[primaryDevice.id][primaryItem.id] = {
        status: "installed",
        installedAt: Date.now(),
      };
      primaryDevice.currentStoreId = primaryItem.id;
    }
  }

  function itemMatchesDevicePersona(item, device) {
    return !device?.personaId || item.persona?.id === device.personaId;
  }

  function attachDeviceState(item, device) {
    const entitlement = deviceEntitlementsCache?.[device.id]?.[item.id] || null;
    const install = deviceInstallsCache?.[device.id]?.[item.id] || null;
    const installed = install?.status === "installed";
    const owned = entitlement?.status === "active";
    const failed = install?.status === "failed";
    const lastSyncJob = latestSyncJob(device.id, item.id) || (install?.lastSyncJobId ? {
      id: install.lastSyncJobId,
      status: "failed",
      failureReason: install.failureReason,
      message: syncFailureMessage(install.failureReason),
      diagnosticCode: install.diagnosticCode,
    } : null);
    return {
      ...item,
      ownership: owned ? "owned" : "not_owned",
      downloadStatus: entitlement?.downloadStatus === "downloaded" ? "downloaded" : "not_downloaded",
      syncStatus: installed ? "synced" : (failed ? "failed" : "not_synced"),
      installStatus: install?.status || "not_installed",
      entitlementStatus: entitlement?.status || "none",
      refundStatus: entitlement?.status === "revoked" ? "refunded" : null,
      refundPolicy: install?.refundPolicy || entitlement?.refundPolicy || null,
      entitlementId: entitlement?.id || null,
      orderId: entitlement?.orderId || null,
      lastSyncJob,
      syncFailureReason: install?.failureReason || lastSyncJob?.failureReason || null,
      syncFailureMessage: install?.failureReason ? syncFailureMessage(install.failureReason) : (lastSyncJob?.message || null),
      syncDiagnosticCode: install?.diagnosticCode || lastSyncJob?.diagnosticCode || null,
      canPurchase: item.availableForNewUse && !owned,
      canDownload: item.availableForNewUse && owned && entitlement?.downloadStatus !== "downloaded",
      canSync: item.availableForNewUse && entitlement?.downloadStatus === "downloaded" && !installed,
      canRetrySync: failed && item.availableForNewUse && entitlement?.downloadStatus === "downloaded",
      legacyUsable: !item.availableForNewUse && installed,
    };
  }

  function deviceHasCatalogHistory(item, device) {
    return Boolean(deviceEntitlementsCache?.[device.id]?.[item.id] || deviceInstallsCache?.[device.id]?.[item.id]);
  }

  function createOrderRecord({ device, item, status = "pending_payment", paidAt = null }) {
    const now = Date.now();
    const amount = Number(item.price || 0);
    const paid = status === "paid" || amount === 0;
    return {
      id: `order_${now}_${Math.random().toString(36).slice(2, 6)}`,
      buyerUserId: "user_local",
      deviceId: device.id,
      deviceName: device.name,
      storeId: item.id,
      hardwarePackId: item.hardwarePackId,
      hardwarePackTitle: item.title,
      amount,
      currency: "CNY",
      status: paid ? "paid" : status,
      paymentProvider: amount > 0 ? "mock_pay" : "free_claim",
      paidAt: paid ? (paidAt || now) : null,
      createdAt: now,
      updatedAt: now,
    };
  }

  function orderCanGrantEntitlement(order) {
    return order?.status === "paid" && order.deviceId && order.hardwarePackId;
  }

  function grantDeviceEntitlementFromOrder(order, item, device) {
    if (!orderCanGrantEntitlement(order)) return null;
    const current = deviceEntitlementsCache[device.id][item.id] || {};
    const entitlement = {
      id: current.id || `entitlement_${device.id}_${item.hardwarePackId}`,
      deviceId: device.id,
      storeId: item.id,
      hardwarePackId: item.hardwarePackId,
      orderId: order.id,
      status: "active",
      downloadStatus: current.status === "active" ? (current.downloadStatus || "not_downloaded") : "not_downloaded",
      acquiredAt: current.status === "active" ? (current.acquiredAt || order.paidAt || Date.now()) : (order.paidAt || Date.now()),
      updatedAt: Date.now(),
    };
    deviceEntitlementsCache[device.id][item.id] = entitlement;
    return entitlement;
  }

  function findOrder(orderId) {
    return (ordersCache || []).find((order) => order.id === orderId) || null;
  }

  function findEntitlementForOrder(order) {
    const entitlementEntries = Object.entries(deviceEntitlementsCache?.[order.deviceId] || {});
    const [storeId, entitlement] = entitlementEntries.find(([, item]) => item.orderId === order.id) || [];
    return { storeId, entitlement };
  }

  function findSettlementForOrder(orderId) {
    return (settlementsCache || []).find((settlement) => settlement.orderId === orderId) || null;
  }

  function providerEventIdFromPayload(payload = {}) {
    return payload.providerEventId || payload.eventId || payload.id;
  }

  function amountMatchesOrder(order, amount) {
    return Number.isFinite(amount) && Math.abs(Number(order.amount || 0) - amount) < 0.000001;
  }

  function settlementStatusForOrder(order) {
    if (order.status === "refunded") return "refunded";
    if (order.amount <= 0) return "no_cash";
    return "pending";
  }

  function ensureSettlementForOrder(order, item) {
    if (!orderCanGrantEntitlement(order)) return null;
    const existing = (settlementsCache || []).find((settlement) => settlement.orderId === order.id);
    if (existing) return existing;
    const now = Date.now();
    const settlement = {
      id: `settlement_${order.id.replace(/^order_/, "")}`,
      orderId: order.id,
      storeId: item.id,
      storeListingId: item.storeListing?.id || `listing_${item.packId}`,
      packId: item.packId,
      hardwarePackId: order.hardwarePackId,
      hardwarePackTitle: order.hardwarePackTitle,
      creatorUserId: item.storeListing?.applicantUserId || "creator_pending",
      amount: order.amount,
      currency: order.currency,
      status: settlementStatusForOrder(order),
      riskSource: null,
      freezeReason: null,
      createdAt: now,
      updatedAt: now,
    };
    settlementsCache.unshift(settlement);
    return settlement;
  }

  async function payOrderRecord(order, options = {}) {
    const catalog = await getStoreCatalog();
    const devices = await getDevices();
    await ensureDeviceState();
    const device = devices.find((entry) => entry.id === order.deviceId);
    const item = catalog.find((entry) => entry.id === order.storeId);
    if (!device || !item) return { item: order, blocked: true, reason: "order_target_missing" };
    if (!item.availableForNewUse) {
      order.status = "failed";
      order.failureReason = "hardware_pack_unavailable";
      order.updatedAt = Date.now();
      return { item: order, blocked: true, reason: "hardware_pack_unavailable" };
    }
    order.status = "paid";
    order.paymentProvider = options.provider || order.paymentProvider;
    order.providerPaymentId = options.providerPaymentId || order.providerPaymentId || null;
    order.paymentProviderEventId = options.providerEventId || order.paymentProviderEventId || null;
    order.paidAt = order.paidAt || Date.now();
    order.updatedAt = Date.now();
    const entitlement = grantDeviceEntitlementFromOrder(order, item, device);
    const settlement = ensureSettlementForOrder(order, item);
    return { item: order, entitlement, settlement, storeItem: attachDeviceState(item, device) };
  }

  function findSettlement(settlementId) {
    return (settlementsCache || []).find((settlement) => settlement.id === settlementId) || null;
  }

  function updateSettlementForRefund(order) {
    const settlement = (settlementsCache || []).find((item) => item.orderId === order.id);
    if (!settlement) return null;
    settlement.status = "refunded";
    settlement.riskSource = "refund";
    settlement.freezeReason = order.refundReason || "用户退款";
    settlement.updatedAt = Date.now();
    return settlement;
  }

  async function applyRefundToOrder(order, options = {}) {
    const policy = options.installedPolicy || "keep_installed";
    const { storeId, entitlement } = findEntitlementForOrder(order);
    if (!storeId || !entitlement) return { item: order, blocked: true, reason: "entitlement_missing" };
    order.status = "refunded";
    order.refundReason = options.reason || "用户主动退款";
    order.refundedAt = Date.now();
    order.refundProviderEventId = options.providerEventId || order.refundProviderEventId || null;
    order.providerRefundId = options.providerRefundId || order.providerRefundId || null;
    order.updatedAt = order.refundedAt;
    const settlement = updateSettlementForRefund(order);
    entitlement.status = "revoked";
    entitlement.refundPolicy = policy;
    entitlement.revokedAt = order.refundedAt;
    entitlement.revokedReason = "refund";
    entitlement.updatedAt = order.refundedAt;
    const install = deviceInstallsCache[order.deviceId]?.[storeId];
    if (install?.status === "installed") {
      if (policy === "remove_from_device") {
        deviceInstallsCache[order.deviceId][storeId] = {
          ...install,
          status: "removed",
          refundPolicy: policy,
          removedAt: order.refundedAt,
        };
        const devices = await getDevices();
        const device = devices.find((entry) => entry.id === order.deviceId);
        if (device?.currentStoreId === storeId) device.currentStoreId = null;
      } else {
        deviceInstallsCache[order.deviceId][storeId] = {
          ...install,
          refundPolicy: policy,
          refundedAt: order.refundedAt,
        };
      }
    }
    addOperationLog({
      actorUserId: options.actorUserId || "operator_demo",
      actorName: options.actorName || "运营",
      action: "refund_order",
      targetType: "Order",
      targetId: order.id,
      targetTitle: order.hardwarePackTitle,
      detail: `${order.refundReason}，设备权益已撤销。已安装处理：${policy === "remove_from_device" ? "从设备移除" : "保留设备内已安装内容"}`,
    });
    const catalog = await getStoreCatalog();
    const devices = await getDevices();
    const device = devices.find((entry) => entry.id === order.deviceId);
    const item = catalog.find((entry) => entry.id === storeId);
    return {
      item: order,
      entitlement,
      settlement,
      storeItem: item && device ? attachDeviceState(item, device) : null,
    };
  }

  function freezeSettlementsForPack(pack, reason = "权利争议处理中", riskSource = "rights_dispute") {
    const hardwarePackId = pack.hardwarePack?.id || `hw_${pack.id}`;
    const frozen = [];
    for (const settlement of settlementsCache || []) {
      if (settlement.hardwarePackId !== hardwarePackId) continue;
      if (settlement.status === "refunded" || settlement.status === "cancelled") continue;
      settlement.status = "frozen";
      settlement.riskSource = riskSource;
      settlement.freezeReason = reason;
      settlement.updatedAt = Date.now();
      frozen.push(settlement);
    }
    return frozen;
  }

  function createModerationAction({ targetType, targetId, action, reason, operatorId = "operator_demo", appealable = true, sourceId = null }) {
    ensureGovernanceState();
    const now = Date.now();
    const item = {
      id: `mod_action_${now}_${Math.random().toString(36).slice(2, 6)}`,
      targetType,
      targetId,
      action,
      reason,
      operatorId,
      appealable,
      sourceId,
      status: "recorded",
      notifiedUser: true,
      createdAt: now,
    };
    moderationActionsCache.unshift(item);
    return item;
  }

  function reportReasonLabel(reason) {
    return {
      copyright_ip: "版权 / IP 侵权",
      harassment: "骚扰辱骂",
      minor_risk: "未成年人风险",
      impersonation: "冒充真人",
      privacy: "隐私泄露",
      spam: "垃圾广告",
      hardware_unsuitable: "不适合硬件展示",
      other: "其他",
    }[reason] || reason || "其他";
  }

  function governanceStatusLabel(status) {
    return {
      submitted: "已提交",
      triage: "分诊中",
      action_taken: "已处置",
      counter_notice_waiting: "等待申诉材料",
      restored: "已恢复",
      resolved: "已处理",
      rejected: "已驳回",
      closed: "已关闭",
      escalated: "已升级",
    }[status] || status;
  }

  async function applyGovernanceAction({ targetType, targetId, action, reason, sourceId }) {
    if (targetType === "Comment") {
      await ensureCommunityState();
      const comment = commentsCache.find((item) => item.id === targetId);
      if (!comment) return { pack: null, comment: null, settlements: [] };
      const wasVisible = isCommentVisible(comment);
      if (action === "take_down") {
        comment.status = "removed";
      } else {
        comment.status = "hidden_by_platform";
      }
      comment.hiddenReason = reason;
      comment.updatedAt = Date.now();
      if (wasVisible) await adjustCommentMetric(comment.workId, -1);
      const pack = await findPack(comment.workId);
      createModerationAction({ targetType, targetId, action, reason, sourceId });
      return { pack, comment, settlements: [] };
    }

    const pack = await findPackForTarget(targetType, targetId);
    if (!pack) return { pack: null, settlements: [] };
    pack.metrics = pack.metrics || {};
    pack.metrics.reports = (pack.metrics.reports || 0) + 1;

    if (action === "freeze_store") {
      await ensureDeviceState();
      const settlements = freezeSettlementsForPack(pack, reason, "rights_dispute");
      setStoreStatus(pack, "frozen");
      createModerationAction({ targetType, targetId, action, reason, sourceId });
      await commit(await getPacks());
      invalidateBadgeLibrary();
      return { pack, settlements };
    }

    if (action === "take_down") {
      pack.status = "taken_down";
      if (pack.storeListing?.status === "listed") setStoreStatus(pack, "delisted");
      createModerationAction({ targetType, targetId, action, reason, sourceId });
      await commit(await getPacks());
      invalidateBadgeLibrary();
      return { pack, settlements: [] };
    }

    if (action === "limit_recommend") {
      pack.status = "public_limited";
      createModerationAction({ targetType, targetId, action, reason, sourceId });
      await commit(await getPacks());
      return { pack, settlements: [] };
    }

    return { pack, settlements: [] };
  }

  async function restoreGovernanceTarget(targetType, targetId, reason = "申诉通过，恢复可见和商店状态。") {
    if (targetType === "Comment") {
      await ensureCommunityState();
      const comment = commentsCache.find((item) => item.id === targetId);
      if (!comment) return { pack: null, settlements: [] };
      const wasVisible = isCommentVisible(comment);
      comment.status = "visible";
      comment.hiddenReason = null;
      comment.updatedAt = Date.now();
      if (!wasVisible) await adjustCommentMetric(comment.workId, 1);
      const pack = await findPack(comment.workId);
      createModerationAction({ targetType, targetId, action: "restore", reason, appealable: false });
      return { pack, settlements: [] };
    }

    const pack = await findPackForTarget(targetType, targetId);
    if (!pack) return { pack: null, settlements: [] };
    if (pack.status === "taken_down" || pack.status === "public_limited") pack.status = "public_h5";
    if (["frozen", "delisted"].includes(pack.storeListing?.status || pack.storeStatus)) {
      setStoreStatus(pack, "listed");
    }
    const hardwarePackId = pack.hardwarePack?.id || `hw_${pack.id}`;
    const settlements = [];
    for (const settlement of settlementsCache || []) {
      if (settlement.hardwarePackId !== hardwarePackId || settlement.status !== "frozen") continue;
      settlement.status = settlement.amount > 0 ? "pending" : "no_cash";
      settlement.releaseReason = reason;
      settlement.updatedAt = Date.now();
      settlements.push(settlement);
    }
    createModerationAction({ targetType, targetId, action: "restore", reason, appealable: false });
    await commit(await getPacks());
    invalidateBadgeLibrary();
    return { pack, settlements };
  }

  function syncFailureMessage(reason = "unknown") {
    return SYNC_FAILURE_MESSAGES[reason] || SYNC_FAILURE_MESSAGES.unknown;
  }

  function latestSyncJob(deviceId, storeId) {
    return (deviceSyncJobsCache || []).find((job) => job.deviceId === deviceId && job.storeId === storeId) || null;
  }

  function makeDiagnosticCode(reason = "unknown") {
    return `GFS-${reason.toUpperCase().replaceAll("_", "-")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function createDeviceSyncJob({ device, item, previousStoreId, retryOf = null }) {
    const now = Date.now();
    const job = {
      id: `sync_${now}_${Math.random().toString(36).slice(2, 6)}`,
      deviceId: device.id,
      deviceName: device.name,
      storeId: item.id,
      packId: item.packId,
      hardwarePackId: item.hardwarePackId,
      status: "created",
      failureReason: null,
      message: "",
      diagnosticCode: makeDiagnosticCode("created"),
      previousStoreId: previousStoreId || null,
      retryOf,
      rollbackStatus: "not_needed",
      steps: ["created"],
      clientVersion: "web-prototype",
      firmwareVersion: device.firmwareVersion || "unknown",
      bleProtocolVersion: "mock_ble_v1",
      createdAt: now,
      updatedAt: now,
    };
    attachDeviceSyncEvidence(job);
    deviceSyncJobsCache.unshift(job);
    deviceSyncJobsCache = deviceSyncJobsCache.slice(0, 20);
    return job;
  }

  function attachDeviceSyncEvidence(job) {
    job.evidence = createDeviceSyncEvidence(job);
    return job;
  }

  function updateDeviceSyncJob(job, status, fields = {}) {
    Object.assign(job, {
      status,
      updatedAt: Date.now(),
      steps: [...(job.steps || []), status],
      ...fields,
    });
    return attachDeviceSyncEvidence(job);
  }

  function failDeviceSyncJob(job, reason, fields = {}) {
    return updateDeviceSyncJob(job, fields.status || "failed", {
      failureReason: reason,
      message: syncFailureMessage(reason),
      diagnosticCode: makeDiagnosticCode(reason),
      ...fields,
    });
  }

  function compareVersions(left = "0.0.0", right = "0.0.0") {
    const a = String(left).split(".").map((part) => Number(part) || 0);
    const b = String(right).split(".").map((part) => Number(part) || 0);
    for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
      if ((a[i] || 0) > (b[i] || 0)) return 1;
      if ((a[i] || 0) < (b[i] || 0)) return -1;
    }
    return 0;
  }

  function syncPreflightFailure({ item, activeDevice, entitlement, currentInstall }) {
    if (!item || !activeDevice || entitlement?.status !== "active") return "entitlement_missing";
    if (entitlement.downloadStatus !== "downloaded") return "download_failed";
    if (!item.availableForNewUse && currentInstall?.status !== "installed") return "hardware_pack_unavailable";
    if (activeDevice.status === "离线" || activeDevice.status === "offline") return "device_offline";
    if ((activeDevice.battery || 0) < MIN_SYNC_BATTERY_LEVEL) return "low_battery";
    const targetDeviceModels = item.hardwarePack?.targetDeviceModels || item.targetDeviceModels || [];
    if (targetDeviceModels.length && !targetDeviceModels.includes(activeDevice.model)) return "unsupported_device_model";
    if (item.hardwarePack?.minFirmwareVersion && compareVersions(activeDevice.firmwareVersion, item.hardwarePack.minFirmwareVersion) < 0) {
      return "firmware_too_low";
    }
    if (item.hardwarePack?.packageSizeKb && activeDevice.availableStorageKb && item.hardwarePack.packageSizeKb > activeDevice.availableStorageKb) {
      return "insufficient_storage";
    }
    if (!item.hardwarePack?.checksum) return "checksum_failed";
    return null;
  }

  function markInstallFailed(deviceId, storeId, job, previousStoreId) {
    const installs = deviceInstallsCache[deviceId] || {};
    installs[storeId] = {
      ...(installs[storeId] || {}),
      status: "failed",
      failureReason: job.failureReason,
      lastSyncJobId: job.id,
      diagnosticCode: job.diagnosticCode,
      previousStoreId: previousStoreId || null,
      failedAt: Date.now(),
    };
    deviceInstallsCache[deviceId] = installs;
  }

  function deviceWithPersona(device, catalog = []) {
    const persona = localGetPersona(device.personaId);
    const currentInstalled = device.currentStoreId
      ? catalog.find((item) => item.id === device.currentStoreId && deviceInstallsCache?.[device.id]?.[item.id]?.status === "installed")
      : null;
    const installed = currentInstalled || catalog.find((item) => deviceInstallsCache?.[device.id]?.[item.id]?.status === "installed");
    return {
      ...device,
      persona,
      currentPackTitle: installed?.title || "未同步内容",
      currentStoreId: installed?.id || device.currentStoreId || null,
    };
  }

  return {
    exportRuntimeState,
    importRuntimeState,

    async getFeed() {
      return { items: await getPacks() };
    },

    async getWork(id) {
      return { item: await findPack(id) };
    },

    async getCompatibilityReport(id) {
      const packs = await getPacks();
      const pack = packs.find((item) => (
        item.id === id ||
        item.hardwarePack?.id === id ||
        item.compatibilityReport?.id === id
      ));
      if (!pack) return { item: null };
      ensureHardwareProductionState(pack);
      return { item: pack.compatibilityReport || createCompatibilityReport(pack) };
    },

    async createDraft(prompt, template, options = {}) {
      const { draft, project } = createStoryProjectFromPrompt(prompt, template, options);
      const storyProject = await upsertGeneratedStoryProject(project);
      draft.sourceProjectId = storyProject.id;
      draft.storyProjectId = storyProject.id;
      return { item: draft, storyProject };
    },

    async createAiDraft(prompt, template, options = {}) {
      const { draft, project } = createStoryProjectFromPrompt(prompt, template, options);
      const storyProject = await upsertGeneratedStoryProject(project);
      draft.sourceProjectId = storyProject.id;
      draft.storyProjectId = storyProject.id;
      return { item: draft, storyProject };
    },

    async listStoryProjects() {
      ensureStoryProjectState();
      return { items: structuredClone(storyProjectsCache) };
    },

    async createStoryProject(project = {}) {
      const item = saveStoryProject(normalizeStoryProjectForMock(storyProjectFromPayload(project)));
      return { item };
    },

    async getStoryProject(id) {
      return { item: findStoryProject(id) };
    },

    async updateStoryProject(id, project = {}) {
      const existing = findStoryProject(id);
      if (!existing) return { item: null, reason: "not_found" };
      const item = saveStoryProject(normalizeStoryProjectForMock(storyProjectFromPayload(project), {
        id,
        existing,
      }));
      return { item };
    },

    async listStoryProjectVersions(id) {
      ensureStoryProjectState();
      return {
        items: structuredClone(storyProjectVersionsCache.filter((version) => version.storyProjectId === id)),
      };
    },

    async createStoryProjectVersion(id, payload = {}) {
      const existing = findStoryProject(id);
      if (!existing) return { item: null, project: null, reason: "not_found" };
      const timestamp = Date.now();
      const snapshotProject = payload.project
        ? normalizeStoryProjectForMock(payload.project, { id, existing, timestamp })
        : normalizeStoryProjectForMock(existing, { id, existing, timestamp });
      const version = saveStoryProjectVersion(createStoryProjectVersionSnapshot(snapshotProject, {
        status: payload.status || "locked",
        label: payload.label || "",
        reason: payload.reason || "",
        timestamp,
      }));
      const savedProject = saveStoryProject({
        ...snapshotProject,
        versionId: version.id,
        updatedAt: timestamp,
      });
      return { item: version, project: savedProject };
    },

    async restoreStoryProjectVersion(id, versionId, payload = {}) {
      const existing = findStoryProject(id);
      if (!existing) return { item: null, project: null, version: null, reason: "not_found" };
      const version = findStoryProjectVersion(versionId);
      if (!version) return { item: null, project: null, version: null, reason: "version_not_found" };
      if (version.storyProjectId !== id) {
        return { item: null, project: null, version, reason: "version_mismatch" };
      }
      const timestamp = Date.now();
      const restoredProject = normalizeStoryProjectForMock(version.projectSnapshot || {}, {
        id,
        existing,
        timestamp,
      });
      const errors = validateStoryProject(restoredProject);
      if (errors.length) {
        return {
          item: null,
          project: restoredProject,
          version,
          message: "story_project_invalid",
          errors,
        };
      }
      const restoreVersionId = makeMockId("spv");
      const restoredStatus = restoredProject.status === "published"
        ? "ready_to_preview"
        : restoredProject.status || "ready_to_preview";
      const savedProject = saveStoryProject({
        ...restoredProject,
        status: restoredStatus,
        versionId: restoreVersionId,
        restoredFromVersionId: version.id,
        updatedAt: timestamp,
        ...(restoredProject.status === "published" ? {
          outputWorkId: null,
          publishedAt: null,
        } : {}),
      });
      const restoreVersion = saveStoryProjectVersion(createStoryProjectVersionSnapshot(savedProject, {
        id: restoreVersionId,
        status: "restored",
        label: payload.label || `恢复：${version.label || version.id}`,
        reason: payload.reason || `StoryProject restored from version ${version.id}.`,
        timestamp,
      }));
      return { item: savedProject, project: savedProject, version: restoreVersion, restoredFromVersion: version };
    },

    async compileStoryProjectH5(id, payload = {}) {
      const existing = findStoryProject(id);
      if (!existing) return { item: null, reason: "not_found" };
      const timestamp = Date.now();
      const project = payload.project
        ? normalizeStoryProjectForMock(payload.project, { id, existing, timestamp })
        : normalizeStoryProjectForMock(existing, { id, existing, timestamp });
      const errors = validateStoryProject(project);
      const packId = storyProjectPackId(project, payload);
      const report = createStoryProjectPlayabilityReport(project, {
        packId,
        generatedAt: timestamp,
        timestamp,
      });
      if (errors.length || report.errors.length) {
        return {
          item: null,
          errors: [...errors, ...report.errors],
          report,
        };
      }
      const pack = compileStoryProjectToH5Pack(project, {
        packId,
        status: "draft_h5",
        timestamp,
        throwOnInvalid: true,
      });
      const draft = createCompiledStoryDraft(project, pack, {
        draftId: payload.draftId || makeMockId("draft"),
        report,
        timestamp,
      });
      return {
        item: draft,
        pack,
        h5Pack: pack,
        report,
      };
    },

    async compileStoryProjectComic(id, payload = {}) {
      const existing = findStoryProject(id);
      if (!existing) return { item: null, episode: null, project: null, reason: "not_found" };
      const timestamp = Date.now();
      const project = payload.project
        ? normalizeStoryProjectForMock(payload.project, { id, existing, timestamp })
        : normalizeStoryProjectForMock(existing, { id, existing, timestamp });
      const errors = validateStoryProject(project);
      if (errors.length) {
        return {
          item: null,
          episode: null,
          project,
          message: "story_project_invalid",
          errors,
        };
      }
      try {
        const episode = compileStoryProjectToComicEpisode(project, {
          episodeId: payload.episodeId || payload.comicEpisodeId,
          status: payload.status || "draft_storyboard",
          timestamp,
          throwOnInvalid: true,
        });
        return {
          item: episode,
          episode,
          project,
        };
      } catch (error) {
        return {
          item: null,
          episode: null,
          project,
          message: "story_project_comic_compile_failed",
          errors: String(error?.message || error).split("\n").filter(Boolean),
        };
      }
    },

    async publishStoryProject(id, payload = {}) {
      const existing = findStoryProject(id);
      if (!existing) return { item: null, project: null, reason: "not_found" };
      const timestamp = Date.now();
      const candidate = payload.project
        ? normalizeStoryProjectForMock(payload.project, { id, existing, timestamp })
        : normalizeStoryProjectForMock(existing, { id, existing, timestamp });
      const versionId = makeMockId("spv");
      const packId = storyProjectPackId(candidate, payload);
      const project = {
        ...candidate,
        status: "published",
        versionId,
        outputWorkId: packId,
        publishedAt: candidate.publishedAt || timestamp,
        updatedAt: timestamp,
      };
      const report = createStoryProjectPlayabilityReport(project, {
        packId,
        status: "public_h5",
        generatedAt: timestamp,
        timestamp,
        target: "h5",
      });
      if (report.errors.length || report.publishChecklist?.status === "blocked") {
        return {
          item: null,
          project: candidate,
          report,
          blocked: true,
          errors: report.errors,
        };
      }
      const pack = compileStoryProjectToH5Pack(project, {
        packId,
        status: "public_h5",
        timestamp,
        throwOnInvalid: true,
      });
      const packs = await getPacks();
      const existingPackIndex = packs.findIndex((packItem) => packItem.id === pack.id);
      if (existingPackIndex >= 0) packs.splice(existingPackIndex, 1);
      packs.unshift(normalizePack(pack));
      await commit(packs);
      const savedProject = saveStoryProject(project);
      const version = saveStoryProjectVersion(createStoryProjectVersionSnapshot(savedProject, {
        id: versionId,
        status: "published",
        label: payload.label || "Published H5",
        reason: payload.reason || "StoryProject published as H5 Work.",
        timestamp,
      }));
      return {
        item: packs[0],
        project: savedProject,
        version,
        report,
      };
    },

    async createStoryProjectAiJob(id, payload = {}) {
      const project = findStoryProject(id);
      if (!project) return { item: null, inputSnapshot: null, reason: "not_found" };
      const timestamp = Date.now();
      let inputSnapshot = null;
      let inputSnapshotId = payload.inputSnapshotId || project.versionId || null;
      if (!inputSnapshotId) {
        inputSnapshot = saveStoryProjectVersion(createStoryProjectVersionSnapshot(project, {
          status: "draft",
          label: "AI job input",
          reason: payload.stage || payload.prompt || "",
          timestamp,
        }));
        inputSnapshotId = inputSnapshot.id;
      }
      const job = saveAiGenerationJob({
        id: payload.id || makeMockId("ai_job"),
        storyProjectId: project.id,
        stage: payload.stage || payload.kind || "story_project_generation",
        status: payload.status || "queued",
        inputSnapshotId,
        outputSnapshotId: payload.outputSnapshotId || null,
        prompt: payload.prompt || payload.instruction || "",
        request: structuredClone(payload),
        result: payload.result || null,
        errors: Array.isArray(payload.errors) ? payload.errors : [],
        authorUserId: project.authorUserId || project.author?.id || "user_local",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      return { item: job, inputSnapshot };
    },

    async getAiGenerationJob(id) {
      ensureStoryProjectState();
      const job = aiGenerationJobsCache.find((item) => item.id === id);
      return { item: job ? structuredClone(job) : null };
    },

    async applyAiGenerationJob(id, payload = {}) {
      ensureStoryProjectState();
      const job = aiGenerationJobsCache.find((item) => item.id === id);
      if (!job) return { item: null, job: null, reason: "not_found" };
      const existing = findStoryProject(job.storyProjectId);
      if (!existing) return { item: null, job: structuredClone(job), reason: "story_project_not_found" };
      const outputProject = payload.project || job.result?.project;
      if (!outputProject) return { item: null, job: structuredClone(job), reason: "ai_job_output_project_missing" };
      const timestamp = Date.now();
      const project = normalizeStoryProjectForMock(outputProject, {
        id: existing.id,
        existing,
        timestamp,
      });
      const versionId = makeMockId("spv");
      const savedProject = saveStoryProject({
        ...project,
        versionId,
        updatedAt: timestamp,
      });
      const version = saveStoryProjectVersion(createStoryProjectVersionSnapshot(savedProject, {
        id: versionId,
        status: payload.versionStatus || "locked",
        label: payload.label || "AI job output",
        reason: payload.reason || job.prompt || job.stage || "",
        timestamp,
      }));
      const updatedJob = saveAiGenerationJob({
        ...job,
        status: "applied",
        outputSnapshotId: version.id,
        appliedAt: timestamp,
        updatedAt: timestamp,
        result: {
          ...(job.result || {}),
          project: structuredClone(savedProject),
        },
      });
      return { item: savedProject, job: updatedJob, version };
    },

    async createAiEditProposal(payload = {}) {
      const draft = payload.draft || {};
      const proposal = createAiEditProposalPreview(
        draft,
        payload.instruction || "",
        payload.scope || { type: "work", ids: [] },
      );
      proposal.qualityChecks = createDraftQualityChecks(proposal.previewDraft);
      return { item: proposal };
    },

    async validateDraft(id, draft = {}) {
      const qualityChecks = createDraftQualityChecks(draft);
      const checklist = createPublishChecklist(draft, { qualityChecks, target: "h5" });
      return {
        item: {
          id: `review_draft_${id}`,
          targetType: "WorkDraft",
          targetId: id,
          reviewType: "draft_validation",
          status: checklist.status === "blocked" ? "failed" : "passed",
          checks: checklist.checks,
          checklist,
        },
      };
    },

    async generateAiImage(asset = {}) {
      const prompt = asset.prompt || asset.usage || asset.name || "素材预览";
      const png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
      return {
        item: {
          id: `mock_ai_image_${Date.now()}`,
          status: "fallback",
          provider: "mock_preview",
          prompt,
          filename: `${asset.id || "mock_ai_image"}.png`,
          mediaType: "image/png",
          sizeBytes: 68,
          imageUrl: `data:image/png;base64,${png}`,
          sourceStatement: {
            sourceType: "ai_generated",
            provider: "mock_preview",
            model: "mock_preview",
            prompt,
            rightsAcknowledged: true,
            policyVersion: "gugu_flash_asset_security_v1",
          },
          generatedAt: Date.now(),
        },
      };
    },

    async publishDraft(pack) {
      const packs = await getPacks();
      const published = normalizePack({
        ...pack,
        status: "public_h5",
        storeStatus: pack.storeStatus || "not_applied",
      });
      const existingIndex = published.sourceDraftId
        ? packs.findIndex((item) => item.sourceDraftId === published.sourceDraftId)
        : -1;
      if (existingIndex >= 0) packs.splice(existingIndex, 1);
      packs.unshift(published);
      await commit(packs);
      return { item: packs[0] };
    },

    async updateWork(id, pack = {}) {
      const packs = await getPacks();
      const index = packs.findIndex((item) => item.id === id);
      if (index < 0) return { item: null, reason: "not_found" };
      const updated = normalizePack({
        ...packs[index],
        ...pack,
        id,
        author: packs[index].author || pack.author || { id: "user_local", name: "你" },
        status: pack.status || packs[index].status || "public_h5",
        updatedAt: Date.now(),
      });
      packs[index] = updated;
      await commit(packs);
      return { item: packs[index] };
    },

    async deleteWork(id) {
      const packs = await getPacks();
      const index = packs.findIndex((item) => item.id === id);
      if (index < 0) return { item: null, deleted: false, reason: "not_found" };
      const [deleted] = packs.splice(index, 1);
      await commit(packs);
      invalidateBadgeLibrary();
      return { item: deleted, deleted: true };
    },

    async remixWork(id) {
      const packs = await getPacks();
      const source = packs.find((pack) => pack.id === id);
      if (!source) return { item: null };
      const remix = cloneAsRemix(source);
      source.metrics = source.metrics || {};
      source.metrics.remixes = (source.metrics.remixes || 0) + 1;
      packs.unshift(remix);
      await commit(packs);
      return { item: remix };
    },

    async recordInteraction(id, type) {
      const packs = await getPacks();
      const pack = packs.find((item) => item.id === id);
      if (!pack) return { item: null };
      pack.metrics = pack.metrics || {};
      const metricByType = {
        like: "likes",
        save: "saves",
        comment: "comments",
        play: "plays",
      };
      const metric = metricByType[type];
      if (metric) pack.metrics[metric] = (pack.metrics[metric] || 0) + 1;
      await commit(packs);
      return { item: pack };
    },

    async getComments(workId) {
      await ensureCommunityState();
      const pack = await findPack(workId);
      const items = commentsCache
        .filter((comment) => comment.workId === workId)
        .filter((comment) => isCommentVisible(comment))
        .filter((comment) => !isBlocked("user_local", comment.userId))
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((comment) => makeCommentRow(comment, pack));
      return {
        items,
        moderatedCount: commentsCache.filter((comment) => (
          comment.workId === workId &&
          !isCommentVisible(comment) &&
          !["deleted_by_user", "removed"].includes(comment.status)
        )).length,
        blockedCount: commentsCache.filter((comment) => comment.workId === workId && isBlocked("user_local", comment.userId)).length,
      };
    },

    async postComment(workIdOrPayload, body = "", options = {}) {
      await ensureCommunityState();
      const payload = typeof workIdOrPayload === "object"
        ? workIdOrPayload
        : { workId: workIdOrPayload, body, ...options };
      const pack = await findPack(payload.workId);
      if (!pack) return { item: null, blocked: true, reason: "work_not_found" };
      const userId = payload.userId || "user_local";
      if (isBlocked(pack.author?.id, userId)) {
        return { item: null, blocked: true, reason: "blocked_by_author" };
      }
      const risk = commentRisk(payload.body);
      const now = Date.now();
      const comment = {
        id: `comment_${now}_${Math.random().toString(36).slice(2, 6)}`,
        userId,
        authorName: payload.authorName || (userId === "user_local" ? "你" : "访客用户"),
        workId: pack.id,
        workTitle: pack.title,
        body: String(payload.body || "").slice(0, 180),
        status: risk ? "pending_review" : "visible",
        risk,
        reportCount: 0,
        hiddenReason: risk ? "评论包含外部联系方式、辱骂或高风险词，等待复核。" : null,
        createdAt: now,
        updatedAt: now,
      };
      commentsCache.unshift(comment);
      if (comment.status === "visible") await adjustCommentMetric(pack.id, 1);
      addOperationLog({
        actorUserId: userId,
        actorName: comment.authorName,
        action: "post_comment",
        targetType: "Comment",
        targetId: comment.id,
        targetTitle: pack.title,
        detail: risk ? `评论进入复核：${comment.hiddenReason}` : `发布评论：${comment.body}`,
      });
      return { item: makeCommentRow(comment, pack), blocked: false };
    },

    async deleteComment(commentId, reason = "用户删除自己的评论。") {
      await ensureCommunityState();
      const comment = commentsCache.find((item) => item.id === commentId);
      if (!comment) return { item: null };
      const pack = await findPack(comment.workId);
      if (comment.userId !== "user_local") return { item: makeCommentRow(comment, pack), blocked: true, reason: "not_comment_owner" };
      const wasVisible = isCommentVisible(comment);
      comment.status = "deleted_by_user";
      comment.hiddenReason = reason;
      comment.updatedAt = Date.now();
      if (wasVisible) await adjustCommentMetric(comment.workId, -1);
      addOperationLog({
        actorUserId: "user_local",
        actorName: "你",
        action: "delete_comment",
        targetType: "Comment",
        targetId: comment.id,
        targetTitle: comment.workTitle,
        detail: reason,
      });
      return { item: makeCommentRow(comment, pack) };
    },

    async hideComment(commentId, reason = "作者隐藏了这条评论。") {
      await ensureCommunityState();
      const comment = commentsCache.find((item) => item.id === commentId);
      if (!comment) return { item: null };
      const pack = await findPack(comment.workId);
      if (!currentUserCanHideComment(comment, pack)) {
        return { item: makeCommentRow(comment, pack), blocked: true, reason: "not_work_author" };
      }
      const wasVisible = isCommentVisible(comment);
      comment.status = "hidden_by_author";
      comment.hiddenReason = reason;
      comment.updatedAt = Date.now();
      if (wasVisible) await adjustCommentMetric(comment.workId, -1);
      createModerationAction({
        targetType: "Comment",
        targetId: comment.id,
        action: "hide",
        reason,
        operatorId: "user_local",
        sourceId: comment.id,
      });
      addOperationLog({
        actorUserId: "user_local",
        actorName: "你",
        action: "hide_comment",
        targetType: "Comment",
        targetId: comment.id,
        targetTitle: comment.workTitle,
        detail: reason,
      });
      return { item: makeCommentRow(comment, pack) };
    },

    async reportComment(commentId, reason = "harassment", description = "用户举报这条评论需要平台复核。") {
      await ensureCommunityState();
      ensureGovernanceState();
      const comment = commentsCache.find((item) => item.id === commentId);
      if (!comment) return { item: null };
      const wasVisible = isCommentVisible(comment);
      comment.reportCount = (comment.reportCount || 0) + 1;
      comment.status = "pending_review";
      comment.hiddenReason = description;
      comment.updatedAt = Date.now();
      if (wasVisible) await adjustCommentMetric(comment.workId, -1);
      const pack = await findPack(comment.workId);
      const now = Date.now();
      const report = {
        id: `report_${now}_${Math.random().toString(36).slice(2, 6)}`,
        reporterUserId: "user_local",
        reporterName: "用户",
        targetType: "Comment",
        targetId: comment.id,
        targetTitle: `${pack?.title || comment.workTitle} 的评论`,
        reason,
        description,
        status: "submitted",
        createdAt: now,
        updatedAt: now,
      };
      reportsCache.unshift(report);
      addOperationLog({
        actorUserId: report.reporterUserId,
        actorName: report.reporterName,
        action: "report_comment",
        targetType: "Comment",
        targetId: comment.id,
        targetTitle: report.targetTitle,
        detail: `${reportReasonLabel(reason)}：${description}`,
      });
      return { item: report, comment: makeCommentRow(comment, pack) };
    },

    async blockUser(blockedUserIdOrPayload, reason = "用户主动拉黑。") {
      await ensureCommunityState();
      const payload = typeof blockedUserIdOrPayload === "object"
        ? blockedUserIdOrPayload
        : { blockedUserId: blockedUserIdOrPayload, reason };
      if (!payload.blockedUserId || payload.blockedUserId === "user_local") {
        return { item: null, blocked: true, reason: "invalid_block_target" };
      }
      const existing = blockRelationsCache.find((relation) => (
        relation.blockerUserId === "user_local" &&
        relation.blockedUserId === payload.blockedUserId
      ));
      if (existing) {
        existing.status = "active";
        existing.reason = payload.reason || reason;
        existing.updatedAt = Date.now();
        return { item: existing, alreadyExists: true };
      }
      const now = Date.now();
      const relation = {
        id: `block_${now}_${Math.random().toString(36).slice(2, 6)}`,
        blockerUserId: "user_local",
        blockedUserId: payload.blockedUserId,
        blockedUserName: payload.blockedUserName || "被拉黑用户",
        reason: payload.reason || reason,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      blockRelationsCache.unshift(relation);
      addOperationLog({
        actorUserId: "user_local",
        actorName: "你",
        action: "block_user",
        targetType: "User",
        targetId: relation.blockedUserId,
        targetTitle: relation.blockedUserName,
        detail: relation.reason,
      });
      return { item: relation };
    },

    async unblockUser(blockIdOrUserId) {
      await ensureCommunityState();
      const relation = blockRelationsCache.find((item) => (
        item.id === blockIdOrUserId ||
        (item.blockerUserId === "user_local" && item.blockedUserId === blockIdOrUserId)
      ));
      if (!relation) return { item: null };
      relation.status = "revoked";
      relation.updatedAt = Date.now();
      addOperationLog({
        actorUserId: "user_local",
        actorName: "你",
        action: "unblock_user",
        targetType: "User",
        targetId: relation.blockedUserId,
        targetTitle: relation.blockedUserName,
        detail: "用户解除拉黑。",
      });
      return { item: relation };
    },

    async getMyBlocks() {
      await ensureCommunityState();
      return { items: blockRelationsCache.filter((relation) => relation.blockerUserId === "user_local") };
    },

    async getFriends() {
      const packs = await getPacks();
      const hotPack = [...packs].sort((a, b) => scorePack(b) - scorePack(a))[0];
      const remixPack = packs.find((pack) => pack.remixOf) || packs[0];
      return {
        stats: {
          friends: 12,
          coCreates: packs.filter((pack) => pack.author?.id === "user_local").length,
          unread: 3,
        },
        items: [
          {
            id: "friend_mika",
            badge: "M",
            title: "Mika 在情绪陪伴区点亮了一个分身",
            text: hotPack ? `她收藏了「${hotPack.title}」，角色是 ${hotPack.persona?.name || "咕咕分身"}。` : "她收藏了一个作品。",
            meta: hotPack ? getZone(hotPack.zoneId).shortName : "刚刚",
          },
          {
            id: "friend_noa",
            badge: "N",
            title: "Noa 发来共创邀请",
            text: "想用「零点列车长」分身一起做一个夜晚列车主题的电子吧唧短剧。",
            meta: "分身",
          },
          {
            id: "friend_yu",
            badge: "Y",
            title: "Yu Remix 了你的灵感",
            text: remixPack ? `来源 IP：${remixPack.ipName || remixPack.title}` : "新的二创会出现在这里。",
            meta: "二创",
          },
        ],
      };
    },

    async submitReport(targetTypeOrPayload = "Work", targetId, reason = "other", description = "用户举报该内容需要平台复核。") {
      ensureGovernanceState();
      const payload = typeof targetTypeOrPayload === "object"
        ? targetTypeOrPayload
        : { targetType: targetTypeOrPayload, targetId, reason, description };
      const pack = await findPackForTarget(payload.targetType || "Work", payload.targetId);
      const now = Date.now();
      const report = {
        id: `report_${now}_${Math.random().toString(36).slice(2, 6)}`,
        reporterUserId: payload.reporterUserId || "user_local",
        reporterName: payload.reporterName || "用户",
        targetType: payload.targetType || "Work",
        targetId: payload.targetId,
        targetTitle: pack?.title || payload.targetTitle || payload.targetId,
        reason: payload.reason || "other",
        description: payload.description || description,
        status: "submitted",
        createdAt: now,
        updatedAt: now,
      };
      reportsCache.unshift(report);
      addOperationLog({
        actorUserId: report.reporterUserId,
        actorName: report.reporterName,
        action: "submit_report",
        targetType: report.targetType,
        targetId: report.targetId,
        targetTitle: report.targetTitle,
        detail: `${reportReasonLabel(report.reason)}：${report.description}`,
      });
      return { item: report };
    },

    async getMyReports() {
      ensureGovernanceState();
      return { items: reportsCache.filter((report) => report.reporterUserId === "user_local") };
    },

    async getOperatorReports() {
      ensureGovernanceState();
      return { items: reportsCache };
    },

    async resolveReport(reportId, action = "limit_recommend", reason = "举报成立，已采取治理动作。") {
      ensureGovernanceState();
      const report = reportsCache.find((item) => item.id === reportId);
      if (!report) return { item: null };
      if (action === "reject") {
        report.status = "rejected";
        report.resolution = "rejected";
        report.updatedAt = Date.now();
        addOperationLog({
          action: "reject_report",
          targetType: report.targetType,
          targetId: report.targetId,
          targetTitle: report.targetTitle,
          detail: `${reportReasonLabel(report.reason)} 举报被驳回：${reason}`,
        });
        return { item: report };
      }
      const result = await applyGovernanceAction({
        targetType: report.targetType,
        targetId: report.targetId,
        action,
        reason,
        sourceId: report.id,
      });
      report.status = "action_taken";
      report.resolution = action;
      report.updatedAt = Date.now();
      addOperationLog({
        action: "resolve_report",
        targetType: report.targetType,
        targetId: report.targetId,
        targetTitle: report.targetTitle,
        detail: `${reportReasonLabel(report.reason)} 举报处理：${action}。${reason}`,
      });
      return { item: report, target: result.pack };
    },

    async submitRightsClaim(payload = {}) {
      ensureGovernanceState();
      const pack = await findPackForTarget(payload.targetType || "Work", payload.targetId);
      const now = Date.now();
      const claim = {
        id: `claim_${now}_${Math.random().toString(36).slice(2, 6)}`,
        claimantName: payload.claimantName || "权利人",
        targetType: payload.targetType || "Work",
        targetId: payload.targetId,
        targetTitle: pack?.title || payload.targetTitle || payload.targetId,
        claimType: payload.claimType || "copyright",
        summary: payload.summary || "投诉该内容存在版权或 IP 授权争议。",
        evidenceFileIds: payload.evidenceFileIds || [],
        actions: [],
        status: "triage",
        createdAt: now,
        updatedAt: now,
      };
      rightsClaimsCache.unshift(claim);
      let actionResult = { pack: null, settlements: [] };
      if (payload.preliminaryAction !== false) {
        actionResult = await applyGovernanceAction({
          targetType: claim.targetType,
          targetId: claim.targetId,
          action: payload.action || "freeze_store",
          reason: claim.summary,
          sourceId: claim.id,
        });
        claim.status = "action_taken";
        claim.actions.push(payload.action || "freeze_store");
        claim.updatedAt = Date.now();
      }
      addOperationLog({
        actorUserId: "rights_claimant",
        actorName: claim.claimantName,
        action: "submit_rights_claim",
        targetType: claim.targetType,
        targetId: claim.targetId,
        targetTitle: claim.targetTitle,
        detail: claim.summary,
      });
      return { item: claim, target: actionResult.pack, settlements: actionResult.settlements.map(makeSettlementRow) };
    },

    async getRightsClaims() {
      ensureGovernanceState();
      return { items: rightsClaimsCache };
    },

    async resolveRightsClaim(claimId, result = "close", reason = "权利投诉处理完成。") {
      ensureGovernanceState();
      const claim = rightsClaimsCache.find((item) => item.id === claimId);
      if (!claim) return { item: null };
      if (result === "freeze_store" || result === "action_taken") {
        const actionResult = await applyGovernanceAction({
          targetType: claim.targetType,
          targetId: claim.targetId,
          action: "freeze_store",
          reason,
          sourceId: claim.id,
        });
        claim.status = "action_taken";
        claim.actions = Array.from(new Set([...(claim.actions || []), "freeze_store"]));
        claim.resolution = "freeze_store";
        claim.updatedAt = Date.now();
        addOperationLog({
          action: "resolve_rights_claim",
          targetType: claim.targetType,
          targetId: claim.targetId,
          targetTitle: claim.targetTitle,
          detail: `${claim.claimantName} 权利投诉先行冻结：${reason}`,
        });
        return { item: claim, target: actionResult.pack, settlements: actionResult.settlements.map(makeSettlementRow) };
      }
      if (result === "restore") {
        const restored = await restoreGovernanceTarget(claim.targetType, claim.targetId, reason);
        claim.status = "restored";
        claim.resolution = "restore";
        claim.updatedAt = Date.now();
        addOperationLog({
          action: "restore_rights_claim",
          targetType: claim.targetType,
          targetId: claim.targetId,
          targetTitle: claim.targetTitle,
          detail: `${claim.claimantName} 权利投诉恢复：${reason}`,
        });
        return { item: claim, target: restored.pack, settlements: restored.settlements.map(makeSettlementRow) };
      }
      claim.status = result === "reject" ? "rejected" : "closed";
      claim.resolution = result;
      claim.resolutionReason = reason;
      claim.updatedAt = Date.now();
      addOperationLog({
        action: "resolve_rights_claim",
        targetType: claim.targetType,
        targetId: claim.targetId,
        targetTitle: claim.targetTitle,
        detail: `${claim.claimantName} 权利投诉：${result}。${reason}`,
      });
      return { item: claim };
    },

    async submitAppeal(payload = {}) {
      ensureGovernanceState();
      const pack = await findPackForTarget(payload.targetType || "Work", payload.targetId);
      const now = Date.now();
      const appeal = {
        id: `appeal_${now}_${Math.random().toString(36).slice(2, 6)}`,
        appellantUserId: payload.appellantUserId || pack?.author?.id || "user_local",
        appellantName: payload.appellantName || pack?.author?.name || "创作者",
        targetType: payload.targetType || "Work",
        targetId: payload.targetId,
        targetTitle: pack?.title || payload.targetTitle || payload.targetId,
        sourceCaseId: payload.sourceCaseId || null,
        reason: payload.reason || "我拥有授权或该处置存在误判，请平台复核。",
        evidence: payload.evidence || [],
        status: "submitted",
        createdAt: now,
        updatedAt: now,
      };
      appealsCache.unshift(appeal);
      addOperationLog({
        actorUserId: appeal.appellantUserId,
        actorName: appeal.appellantName,
        action: "submit_appeal",
        targetType: appeal.targetType,
        targetId: appeal.targetId,
        targetTitle: appeal.targetTitle,
        detail: appeal.reason,
      });
      return { item: appeal };
    },

    async getMyAppeals() {
      ensureGovernanceState();
      return { items: appealsCache.filter((appeal) => appeal.appellantUserId === "user_local") };
    },

    async getAppeals() {
      ensureGovernanceState();
      return { items: appealsCache };
    },

    async resolveAppeal(appealId, result = "restore", reason = "申诉材料通过，恢复相关状态。") {
      ensureGovernanceState();
      const appeal = appealsCache.find((item) => item.id === appealId);
      if (!appeal) return { item: null };
      if (result === "restore") {
        const restored = await restoreGovernanceTarget(appeal.targetType, appeal.targetId, reason);
        appeal.status = "resolved";
        appeal.result = "restore";
        appeal.updatedAt = Date.now();
        for (const claim of rightsClaimsCache.filter((item) => item.targetId === appeal.targetId && item.status === "action_taken")) {
          claim.status = "restored";
          claim.resolution = "appeal_restore";
          claim.updatedAt = Date.now();
        }
        return { item: appeal, target: restored.pack, settlements: restored.settlements.map(makeSettlementRow) };
      }
      appeal.status = result === "escalate" ? "escalated" : "resolved";
      appeal.result = result;
      appeal.resolutionReason = reason;
      appeal.updatedAt = Date.now();
      addOperationLog({
        action: "resolve_appeal",
        targetType: appeal.targetType,
        targetId: appeal.targetId,
        targetTitle: appeal.targetTitle,
        detail: `申诉结果：${result}。${reason}`,
      });
      return { item: appeal };
    },

    async getModerationActions() {
      ensureGovernanceState();
      return { items: moderationActionsCache };
    },

    async getIpPool(options = {}) {
      const packs = await getPacks();
      const query = (typeof options === "string" ? options : options.query || "").trim().toLowerCase();
      const items = Object.values(ipPool)
        .map((entry) => makeIpPoolItem(entry, packs))
        .filter((entry) => {
          if (!query) return true;
          return [
            entry.name,
            entry.description,
            entry.type,
            entry.statusLabel,
            ...(entry.aliases || []),
            ...(entry.tags || []),
            ...(entry.personas || []).map((persona) => persona.name),
          ].filter(Boolean).some((text) => String(text).toLowerCase().includes(query));
        })
        .sort((a, b) => {
          if (a.hasZone !== b.hasZone) return a.hasZone ? -1 : 1;
          if (a.zoneEligibility.eligible !== b.zoneEligibility.eligible) return a.zoneEligibility.eligible ? -1 : 1;
          return b.stats.heatScore - a.stats.heatScore;
        });
      return { items, thresholds: ZONE_APPLICATION_THRESHOLDS };
    },

    async getIpZoneEligibility(ipId) {
      const packs = await getPacks();
      const entry = localGetIpEntry(ipId);
      if (!entry) return { item: null };
      return { item: buildZoneEligibility(entry, packs) };
    },

    async getIpDetail(ipId) {
      const packs = await getPacks();
      const entry = localGetIpEntry(ipId);
      if (!entry) return { item: null };
      const catalog = await getStoreCatalog();
      const poolItem = makeIpPoolItem(entry, packs);
      const relatedWorks = packsForIp(packs, entry)
        .sort((a, b) => scorePack(b) - scorePack(a))
        .slice(0, 6);
      const hardwarePacks = catalog
        .filter((item) => item.ipId === entry.id || item.ipName === entry.name)
        .map((item) => ({
          id: item.hardwarePackId,
          title: item.title,
          description: item.description,
          persona: item.persona,
          status: item.hardwarePack?.status,
          formatVersion: item.hardwarePack?.formatVersion,
        }));
      return {
        item: {
          ...poolItem,
          relatedWorks,
          hardwarePacks,
          zoneApplications: (zoneApplicationsCache || []).filter((application) => application.ipId === entry.id),
        },
      };
    },

    async applyZoneApplication(ipId, reason = "希望为这个 IP 开通专区，沉淀作品、角色和硬件内容。") {
      const packs = await getPacks();
      const entry = localGetIpEntry(ipId);
      if (!entry) return { accepted: false, item: null, reason: "ip_not_found" };
      const eligibility = buildZoneEligibility(entry, packs);
      if (!eligibility.eligible) {
        return { accepted: false, item: null, reason: "zone_not_eligible", eligibility };
      }
      ensureZoneState();
      const now = Date.now();
      const zone = {
        id: zoneIdForIp(entry.id),
        ipId: entry.id,
        name: `${entry.name}专区`,
        description: entry.description,
        status: "open",
        adminUserIds: ["user_local"],
        adminNames: ["你"],
        createdAt: now,
        updatedAt: now,
      };
      const application = {
        id: `zone_app_${entry.id}_${now}`,
        ipId: entry.id,
        applicantUserId: "user_local",
        applicantName: "你",
        invitedUserIds: ["user_mika", "user_noa"],
        status: "approved",
        reason,
        metricsSnapshot: eligibility.stats,
        createdAt: now,
        approvedAt: now,
        zoneId: zone.id,
      };
      ipZoneOverridesCache[entry.id] = zone;
      zoneApplicationsCache.unshift(application);
      addOperationLog({
        actorUserId: "user_local",
        actorName: "你",
        action: "apply_zone",
        targetType: "IPZone",
        targetId: zone.id,
        targetTitle: zone.name,
        detail: "专区申请已模拟通过，申请者成为 zone_admin。",
      });
      return { accepted: true, item: application, zone };
    },

    async applyIpEntry(name = "新的 IP 企划", description = "用户申请加入 IP 池的世界观。") {
      const now = Date.now();
      const task = {
        id: `review_ip_${now}`,
        targetType: "IPEntry",
        targetId: `ip_application_${now}`,
        reviewType: "ip_entry_application",
        status: "open",
        title: name,
        reason: description,
        createdAt: now,
      };
      addOperationLog({
        actorUserId: "user_local",
        actorName: "你",
        action: "apply_ip_entry",
        targetType: "IPEntry",
        targetId: task.targetId,
        targetTitle: name,
        detail: "用户提交 IP 入池申请，等待平台审核。",
      });
      return { accepted: true, item: task };
    },

    async searchAnimeIpCandidates(options = {}) {
      const query = typeof options === "string" ? options : options.query || "";
      const limit = typeof options === "object" ? options.limit : undefined;
      const fallbackItems = collectAnimeIpCandidates({
        query,
        limit,
        sweepAll: Boolean(options.sweepAll),
        existingIpPool: ipPool,
        existingPersonas: rolePersonas,
        includeExisting: Boolean(options.includeExisting),
      });
      let items = fallbackItems;
      let liveDiscovery = null;
      if (options.online || options.liveWeb) {
        try {
          liveDiscovery = await runLiveIpDiscovery({
            limit: limit === "all" ? 240 : limit,
            existingIpPool: ipPool,
            existingPersonas: rolePersonas,
          });
          items = mergeCandidateLists(liveDiscovery.items, fallbackItems);
        } catch (error) {
          liveDiscovery = {
            failed: true,
            message: error.message || "实时全网搜索失败，已回退本地候选目录。",
          };
        }
      }
      return {
        items,
        query,
        source: liveDiscovery?.source || items[0]?.sourceName || "动漫 IP 自动采集候选库",
        liveDiscovery,
        importableCount: items.filter((item) => item.importable).length,
        supplementableCount: items.filter((item) => item.supplementable).length,
      };
    },

    async collectAnimeIpPool(options = {}) {
      const packs = await getPacks();
      const query = typeof options === "string" ? options : options.query || "";
      const limit = typeof options === "object" ? options.limit : undefined;
      const fallbackItems = collectAnimeIpCandidates({
        query,
        limit,
        sweepAll: Boolean(options.sweepAll),
        existingIpPool: ipPool,
        existingPersonas: rolePersonas,
        includeExisting: true,
      });
      let items = fallbackItems;
      let liveDiscovery = null;
      if (options.online || options.liveWeb) {
        try {
          liveDiscovery = await runLiveIpDiscovery({
            limit: limit === "all" ? 240 : limit,
            existingIpPool: ipPool,
            existingPersonas: rolePersonas,
          });
          items = mergeCandidateLists(liveDiscovery.items, fallbackItems);
        } catch (error) {
          liveDiscovery = {
            failed: true,
            message: error.message || "实时全网搜索失败，已回退本地候选目录。",
          };
        }
      }
      const result = importAnimeIpCandidates(items, {
        targetIpPool: ipPool,
        targetPersonas: rolePersonas,
        ipOnly: Boolean(options.ipOnly),
      });
      const imported = result.importedIpIds.map((ipId) => makeIpPoolItem(ipPool[ipId], packs));
      const supplemented = result.supplementedIpIds.map((ipId) => makeIpPoolItem(ipPool[ipId], packs));

      addOperationLog({
        actorUserId: "operator_demo",
        actorName: "运营",
        action: "collect_anime_ip_pool",
        targetType: "IPEntry",
        targetId: result.importedIpIds[0] || result.supplementedIpIds[0] || "anime_ip_collection",
        targetTitle: imported.length || supplemented.length
          ? [...imported, ...supplemented].map((item) => item.name).join(" / ")
          : "动漫 IP 自动采集",
        detail: result.addedIpCount || result.supplementedIpCount
          ? `${options.online || options.liveWeb ? "实时全网搜索：" : options.sweepAll ? "一键全网扫库：" : ""}自动入池 ${result.addedIpCount} 个 IP，补全 ${result.supplementedIpCount} 个既有 IP，新增 ${result.addedPersonaCount} 个角色。`
          : "没有发现可新增或可补全的动漫 IP 候选。",
      });

      return {
        ...result,
        items,
        imported,
        supplemented,
        query,
        liveDiscovery,
      };
    },

    async searchAnimeIpCharacters(ipId, options = {}) {
      const item = collectAnimeIpCharacterCandidates(ipId, {
        limit: options.limit || "all",
        existingIpPool: ipPool,
        existingPersonas: rolePersonas,
      });
      return {
        item,
        items: item ? [item] : [],
        ipId,
        source: item?.sourceName || "全网 IP 搜索候选库",
        characterCount: item?.personas?.length || 0,
        missingPersonaCount: item?.missingPoolPersonaCount || item?.missingPersonaCount || 0,
      };
    },

    async collectAnimeIpCharacters(ipId, options = {}) {
      const packs = await getPacks();
      const item = collectAnimeIpCharacterCandidates(ipId, {
        limit: options.limit || "all",
        existingIpPool: ipPool,
        existingPersonas: rolePersonas,
      });
      const result = importAnimeIpCandidates(item ? [item] : [], {
        targetIpPool: ipPool,
        targetPersonas: rolePersonas,
      });
      const imported = result.importedIpIds.map((id) => makeIpPoolItem(ipPool[id], packs));
      const supplemented = result.supplementedIpIds.map((id) => makeIpPoolItem(ipPool[id], packs));

      addOperationLog({
        actorUserId: "operator_demo",
        actorName: "运营",
        action: "collect_anime_ip_characters",
        targetType: "IPEntry",
        targetId: ipId,
        targetTitle: item?.name || ipId,
        detail: result.addedIpCount || result.supplementedIpCount
          ? `二级角色深挖：入池 ${result.addedIpCount} 个 IP，补全 ${result.supplementedIpCount} 个既有 IP，新增 ${result.addedPersonaCount} 个角色。`
          : "二级角色深挖没有发现可补充角色。",
      });

      return {
        ...result,
        item,
        items: item ? [item] : [],
        imported,
        supplemented,
        ipId,
        characterCount: item?.personas?.length || 0,
        missingPersonaCount: item?.missingPoolPersonaCount || item?.missingPersonaCount || 0,
      };
    },

    async getDeviceDashboard() {
      const packs = await getPacks();
      const catalog = await getStoreCatalog();
      const devices = await getDevices();
      await ensureDeviceState();
      const devicesWithState = devices.map((device) => deviceWithPersona(device, catalog));
      const activeDevice = devicesWithState.find((device) => device.id === activeDeviceId) || devicesWithState[0] || null;
      activeDeviceId = activeDevice?.id || activeDeviceId;
      const library = activeDevice
        ? catalog
          .filter((item) => itemMatchesDevicePersona(item, activeDevice))
          .filter((item) => item.availableForNewUse || deviceHasCatalogHistory(item, activeDevice))
          .map((item) => attachDeviceState(item, activeDevice))
        : [];
      const officialPicks = packs
        .filter((pack) => pack.hardwareStatus === "hardware_candidate" || pack.hardwareStatus === "hardware_ready")
        .sort((a, b) => scorePack(b) - scorePack(a));
      const installed = library.find((item) => item.syncStatus === "synced");
      return {
        device: {
          ...(activeDevice || {
            name: "未绑定设备",
            status: "未绑定",
            battery: 0,
            persona: localGetPersona("rain_gugu"),
          }),
          currentPackTitle: installed?.title || "未同步内容",
        },
        activeDeviceId,
        devices: devicesWithState,
        officialPicks,
        library,
        syncJobs: activeDevice ? (deviceSyncJobsCache || []).filter((job) => job.deviceId === activeDevice.id) : [],
        summary: {
          owned: library.filter((item) => item.ownership === "owned").length,
          downloaded: library.filter((item) => item.downloadStatus === "downloaded").length,
          synced: library.filter((item) => item.syncStatus === "synced").length,
        },
      };
    },

    async getDeviceSyncJobs(deviceId = activeDeviceId) {
      await ensureDeviceState();
      return {
        items: (deviceSyncJobsCache || []).filter((job) => !deviceId || job.deviceId === deviceId),
      };
    },

    async createOrder(storeId) {
      const catalog = await getStoreCatalog();
      const devices = await getDevices();
      await ensureDeviceState();
      const activeDevice = devices.find((device) => device.id === activeDeviceId) || devices[0];
      const item = catalog.find((entry) => entry.id === storeId && itemMatchesDevicePersona(entry, activeDevice));
      if (!item || !activeDevice) return { item: null };
      if (!item.availableForNewUse) {
        return { item: null, blocked: true, reason: "hardware_pack_unavailable" };
      }
      const existingEntitlement = deviceEntitlementsCache[activeDevice.id][storeId];
      if (existingEntitlement?.status === "active") {
        return {
          item: findOrder(existingEntitlement.orderId),
          entitlement: existingEntitlement,
          alreadyOwned: true,
        };
      }
      const order = createOrderRecord({
        device: activeDevice,
        item,
        status: item.price ? "pending_payment" : "paid",
      });
      ordersCache.unshift(order);
      const entitlement = order.status === "paid"
        ? grantDeviceEntitlementFromOrder(order, item, activeDevice)
        : null;
      if (entitlement) ensureSettlementForOrder(order, item);
      return { item: order, entitlement, storeItem: entitlement ? attachDeviceState(item, activeDevice) : item };
    },

    async payOrder(orderId) {
      await ensureDeviceState();
      const order = findOrder(orderId);
      if (!order) return { item: null };
      return payOrderRecord(order);
    },

    async purchaseBadgePack(storeId) {
      const orderResult = await this.createOrder(storeId);
      if (!orderResult.item || orderResult.blocked) {
        const catalog = await getStoreCatalog();
        const devices = await getDevices();
        const activeDevice = devices.find((device) => device.id === activeDeviceId) || devices[0];
        const item = catalog.find((entry) => entry.id === storeId && itemMatchesDevicePersona(entry, activeDevice));
        return {
          item: item && activeDevice ? attachDeviceState(item, activeDevice) : null,
          order: orderResult.item,
          blocked: orderResult.blocked,
          reason: orderResult.reason,
        };
      }
      if (orderResult.alreadyOwned || orderResult.item.status === "paid") {
        const catalog = await getStoreCatalog();
        const devices = await getDevices();
        const activeDevice = devices.find((device) => device.id === activeDeviceId) || devices[0];
        const item = catalog.find((entry) => entry.id === storeId && itemMatchesDevicePersona(entry, activeDevice));
        return { item: attachDeviceState(item, activeDevice), order: orderResult.item, entitlement: orderResult.entitlement };
      }
      const paid = await this.payOrder(orderResult.item.id);
      return { item: paid.storeItem, order: paid.item, entitlement: paid.entitlement };
    },

    async getOrders() {
      await ensureDeviceState();
      return { items: ordersCache || [] };
    },

    async getSettlements() {
      await ensureDeviceState();
      return { items: (settlementsCache || []).map(makeSettlementRow) };
    },

    async releaseSettlement(settlementId, reason = "风险解除，释放结算占位。") {
      await ensureDeviceState();
      const settlement = findSettlement(settlementId);
      if (!settlement) return { item: null };
      if (settlement.status !== "frozen") return { item: settlement, blocked: true, reason: "settlement_not_frozen" };
      settlement.status = settlement.amount > 0 ? "pending" : "no_cash";
      settlement.releaseReason = reason;
      settlement.releasedAt = Date.now();
      settlement.updatedAt = settlement.releasedAt;
      addOperationLog({
        action: "release_settlement",
        targetType: "Settlement",
        targetId: settlement.id,
        targetTitle: settlement.hardwarePackTitle,
        detail: reason,
      });
      return { item: makeSettlementRow(settlement) };
    },

    async refundOrder(orderId, options = {}) {
      await ensureDeviceState();
      const order = findOrder(orderId);
      if (!order) return { item: null };
      if (order.status !== "paid") return { item: order, blocked: true, reason: "order_not_paid" };
      return applyRefundToOrder(order, options);
    },

    async processPaymentCallback(payload = {}) {
      await ensureDeviceState();
      const providerEventId = providerEventIdFromPayload(payload);
      if (!providerEventId) return { item: null, blocked: true, reason: "provider_event_id_required" };
      if (payload.signatureVerified !== true) return { item: null, blocked: true, reason: "invalid_payment_signature" };

      const existing = paymentCallbacksCache.find((item) => item.providerEventId === providerEventId);
      if (existing) {
        const order = findOrder(existing.orderId);
        const { entitlement } = order ? findEntitlementForOrder(order) : {};
        return {
          item: existing,
          order,
          entitlement: entitlement || null,
          settlement: order ? findSettlementForOrder(order.id) : null,
          idempotent: true,
        };
      }

      const order = findOrder(payload.orderId);
      const now = Date.now();
      const event = {
        id: `payment_callback_${providerEventId}`,
        providerEventId,
        provider: payload.provider || "mock_pay",
        providerPaymentId: payload.providerPaymentId || payload.paymentId || null,
        orderId: payload.orderId || null,
        status: payload.status || "succeeded",
        amount: Number(payload.amount ?? order?.amount ?? 0),
        currency: payload.currency || order?.currency || "CNY",
        reason: payload.reason || "provider_payment_callback",
        receivedAt: now,
        processedAt: null,
        result: "received",
      };
      paymentCallbacksCache.unshift(event);

      if (!order) {
        event.result = "order_not_found";
        event.processedAt = Date.now();
        return { item: event, blocked: true, reason: "order_not_found" };
      }

      if (!amountMatchesOrder(order, event.amount) || event.currency !== order.currency) {
        event.result = "amount_mismatch";
        event.processedAt = Date.now();
        return { item: event, order, blocked: true, reason: "amount_mismatch" };
      }

      if (PAYMENT_FAILURE_STATUSES.has(event.status)) {
        if (order.status === "pending_payment") {
          order.status = "failed";
          order.failureReason = event.reason || event.status;
          order.paymentProvider = event.provider;
          order.providerPaymentId = event.providerPaymentId;
          order.paymentProviderEventId = event.providerEventId;
          order.updatedAt = Date.now();
          addOperationLog({
            actorUserId: "payment_provider",
            actorName: event.provider,
            action: "payment_callback_failed",
            targetType: "Order",
            targetId: order.id,
            targetTitle: order.hardwarePackTitle,
            detail: event.reason,
          });
        }
        event.result = "failed";
        event.processedAt = Date.now();
        return { item: event, order, entitlement: null, settlement: findSettlementForOrder(order.id), idempotent: false };
      }

      if (!PAYMENT_SUCCESS_STATUSES.has(event.status)) {
        event.result = "ignored";
        event.ignoredStatus = event.status;
        event.processedAt = Date.now();
        return { item: event, order, ignored: true };
      }

      if (order.status === "paid") {
        const { entitlement } = findEntitlementForOrder(order);
        event.result = "already_paid";
        event.processedAt = Date.now();
        return {
          item: event,
          order,
          entitlement: entitlement || null,
          settlement: findSettlementForOrder(order.id),
          idempotent: true,
        };
      }

      if (order.status !== "pending_payment") {
        event.result = "ignored";
        event.ignoredStatus = order.status;
        event.processedAt = Date.now();
        return { item: event, order, blocked: true, reason: `order_${order.status}` };
      }

      const payment = await payOrderRecord(order, {
        provider: event.provider,
        providerEventId: event.providerEventId,
        providerPaymentId: event.providerPaymentId,
      });
      event.result = payment.blocked ? "failed" : "paid";
      event.processedAt = Date.now();
      if (!payment.blocked) {
        addOperationLog({
          actorUserId: "payment_provider",
          actorName: event.provider,
          action: "payment_callback_paid",
          targetType: "Order",
          targetId: order.id,
          targetTitle: order.hardwarePackTitle,
          detail: `支付回调 ${event.providerEventId} 已确认，设备权益已发放。`,
        });
      }
      return {
        item: event,
        order: payment.item,
        entitlement: payment.entitlement || null,
        settlement: payment.settlement || null,
        storeItem: payment.storeItem || null,
        blocked: payment.blocked,
        reason: payment.reason,
        idempotent: false,
      };
    },

    async processRefundCallback(payload = {}) {
      await ensureDeviceState();
      const providerEventId = payload.providerEventId || payload.eventId || payload.id;
      if (!providerEventId) return { item: null, blocked: true, reason: "provider_event_id_required" };
      const existing = refundCallbacksCache.find((item) => item.providerEventId === providerEventId);
      if (existing) {
        const order = findOrder(existing.orderId);
        const { entitlement } = order ? findEntitlementForOrder(order) : {};
        return {
          item: existing,
          order,
          entitlement: entitlement || null,
          settlement: order ? findSettlementForOrder(order.id) : null,
          idempotent: true,
        };
      }

      const order = findOrder(payload.orderId);
      const now = Date.now();
      const event = {
        id: `refund_callback_${providerEventId}`,
        providerEventId,
        provider: payload.provider || "mock_pay",
        providerRefundId: payload.providerRefundId || null,
        orderId: payload.orderId || null,
        status: payload.status || "succeeded",
        amount: Number(payload.amount ?? order?.amount ?? 0),
        currency: payload.currency || order?.currency || "CNY",
        reason: payload.reason || "provider_refund_callback",
        installedPolicy: payload.installedPolicy || "keep_installed",
        receivedAt: now,
        processedAt: null,
        result: "received",
      };
      refundCallbacksCache.unshift(event);

      if (!order) {
        event.result = "order_not_found";
        event.processedAt = Date.now();
        return { item: event, blocked: true, reason: "order_not_found" };
      }

      if (!["succeeded", "success", "refunded"].includes(event.status)) {
        event.result = "ignored";
        event.ignoredStatus = event.status;
        event.processedAt = Date.now();
        return { item: event, order, ignored: true };
      }

      if (order.status === "refunded") {
        const { entitlement } = findEntitlementForOrder(order);
        event.result = "already_refunded";
        event.processedAt = Date.now();
        return {
          item: event,
          order,
          entitlement: entitlement || null,
          settlement: findSettlementForOrder(order.id),
          idempotent: true,
        };
      }

      const refund = await applyRefundToOrder(order, {
        reason: event.reason,
        installedPolicy: event.installedPolicy,
        actorUserId: "payment_provider",
        actorName: event.provider,
        providerEventId: event.providerEventId,
        providerRefundId: event.providerRefundId,
      });
      event.result = refund.blocked ? refund.reason : "refunded";
      event.processedAt = Date.now();
      return {
        item: event,
        order: refund.item,
        entitlement: refund.entitlement,
        settlement: refund.settlement,
        storeItem: refund.storeItem,
        blocked: refund.blocked,
        reason: refund.reason,
        idempotent: false,
      };
    },

    async downloadBadgePack(storeId) {
      const catalog = await getStoreCatalog();
      const devices = await getDevices();
      await ensureDeviceState();
      const activeDevice = devices.find((device) => device.id === activeDeviceId) || devices[0];
      const item = catalog.find((entry) => entry.id === storeId && itemMatchesDevicePersona(entry, activeDevice));
      const entitlement = activeDevice ? deviceEntitlementsCache[activeDevice.id][storeId] : null;
      if (!item || !activeDevice || entitlement?.status !== "active") return { item: null };
      if (!item.availableForNewUse) {
        return { item: attachDeviceState(item, activeDevice), blocked: true, reason: "hardware_pack_unavailable" };
      }
      entitlement.downloadStatus = "downloaded";
      entitlement.downloadedAt = Date.now();
      return { item: attachDeviceState(item, activeDevice) };
    },

    async syncBadgePack(storeId, options = {}) {
      const catalog = await getStoreCatalog();
      const devices = await getDevices();
      await ensureDeviceState();
      const activeDevice = devices.find((device) => device.id === activeDeviceId) || devices[0];
      const item = catalog.find((entry) => entry.id === storeId && itemMatchesDevicePersona(entry, activeDevice));
      const entitlement = activeDevice ? deviceEntitlementsCache[activeDevice.id][storeId] : null;
      const currentInstall = deviceInstallsCache[activeDevice.id]?.[storeId] || null;
      const previousStoreId = activeDevice.currentStoreId || Object.entries(deviceInstallsCache[activeDevice.id] || {})
        .find(([, install]) => install.status === "installed")?.[0] || null;
      if (!item || !activeDevice) return { item: null };
      const job = createDeviceSyncJob({
        device: activeDevice,
        item,
        previousStoreId,
        retryOf: options.retryOf || currentInstall?.lastSyncJobId || null,
      });
      const preflightFailure = syncPreflightFailure({ item, activeDevice, entitlement, currentInstall });
      if (preflightFailure) {
        failDeviceSyncJob(job, preflightFailure, { status: "blocked" });
        if (currentInstall?.status !== "installed") markInstallFailed(activeDevice.id, storeId, job, previousStoreId);
        return {
          item: attachDeviceState(item, activeDevice),
          syncJob: job,
          blocked: true,
          reason: preflightFailure,
        };
      }
      updateDeviceSyncJob(job, "downloading");
      updateDeviceSyncJob(job, "downloaded");
      if (options.forceFailureReason === "checksum_failed") {
        failDeviceSyncJob(job, "checksum_failed");
        markInstallFailed(activeDevice.id, storeId, job, previousStoreId);
        return { item: attachDeviceState(item, activeDevice), syncJob: job, failed: true, reason: "checksum_failed" };
      }
      updateDeviceSyncJob(job, "syncing");
      if (options.forceFailureReason) {
        failDeviceSyncJob(job, options.forceFailureReason, {
          rollbackStatus: previousStoreId ? "restored_previous" : "no_previous_content",
        });
        markInstallFailed(activeDevice.id, storeId, job, previousStoreId);
        if (previousStoreId) activeDevice.currentStoreId = previousStoreId;
        return { item: attachDeviceState(item, activeDevice), syncJob: job, failed: true, reason: options.forceFailureReason };
      }
      updateDeviceSyncJob(job, "verifying");
      activeDeviceId = activeDevice.id;
      activeDevice.currentStoreId = storeId;
      const installs = deviceInstallsCache[activeDevice.id] || {};
      for (const id of Object.keys(installs)) {
        installs[id] = {
          ...installs[id],
          status: "stored",
          supersededAt: Date.now(),
        };
      }
      deviceInstallsCache[activeDevice.id] = installs;
      deviceInstallsCache[activeDevice.id][storeId] = {
        status: "installed",
        installedAt: Date.now(),
        installedVersion: item.hardwarePack?.version || "1.0.0",
        lastSyncJobId: job.id,
      };
      updateDeviceSyncJob(job, "installed", {
        message: "同步完成，设备当前运行内容已更新。",
        diagnosticCode: makeDiagnosticCode("installed"),
      });
      return { item: attachDeviceState(item, activeDevice), syncJob: job };
    },

    async selectDevice(deviceId) {
      const devices = await getDevices();
      const device = devices.find((entry) => entry.id === deviceId);
      if (!device) return { item: null };
      activeDeviceId = device.id;
      return { item: device };
    },

    async bindDevice(options = {}) {
      const devices = await getDevices();
      const index = devices.length + 1;
      const personaId = typeof options === "string" ? options : options.personaId;
      const device = {
        id: `badge_s3_${String(index).padStart(2, "0")}`,
        name: options.name || `新吧唧 ${index}`,
        model: options.model || "Circle 185",
        status: options.status || "在线",
        battery: options.battery ?? 100,
        firmwareVersion: options.firmwareVersion || "1.2.3",
        availableStorageKb: options.availableStorageKb ?? 1024,
        boundAt: "2026-05-19",
        personaId: personaId || ["rain_gugu", "soda_gugu", "night_conductor", "office_sprite"][index % 4],
        currentStoreId: null,
      };
      devices.unshift(device);
      if (deviceEntitlementsCache) deviceEntitlementsCache[device.id] = {};
      if (deviceInstallsCache) deviceInstallsCache[device.id] = {};
      activeDeviceId = device.id;
      return { item: device };
    },

    async unbindDevice(deviceId) {
      const devices = await getDevices();
      const index = devices.findIndex((entry) => entry.id === deviceId);
      if (index < 0) return { item: null };
      const [removed] = devices.splice(index, 1);
      if (deviceEntitlementsCache) delete deviceEntitlementsCache[removed.id];
      if (deviceInstallsCache) delete deviceInstallsCache[removed.id];
      if (activeDeviceId === deviceId) activeDeviceId = devices[0]?.id || null;
      return { item: removed };
    },

    async getProfile() {
      const packs = await getPacks();
      const myWorks = packs.filter((pack) => pack.author?.id === "user_local" || pack.author?.name === "你");
      const pendingStoreStatuses = new Set(["rights_review", "production_queued", "producing", "pack_review"]);
      return {
        profile: {
          name: "咕咕创作者",
          bio: "刷到喜欢的电子吧唧，也可以自己做一个。",
        },
        stats: {
          works: myWorks.length,
          likes: packs.reduce((sum, pack) => sum + (pack.metrics?.likes || 0), 0),
          remixes: packs.reduce((sum, pack) => sum + (pack.metrics?.remixes || 0), 0),
          hardwareWins: myWorks.filter((pack) => pack.hardwareStatus === "hardware_ready").length,
          storeListed: myWorks.filter((pack) => pack.storeListing?.status === "listed").length,
          storePending: myWorks.filter((pack) => pendingStoreStatuses.has(pack.storeListing?.status)).length,
        },
        myWorks,
      };
    },

    async getOperatorDashboard() {
      return buildOperatorDashboard();
    },

    async getOperationLogs() {
      return { items: ensureOperationLogs() };
    },

    async getOperatorTrending() {
      const dashboard = await buildOperatorDashboard();
      return {
        items: dashboard.items,
        counts: dashboard.counts,
      };
    },

    async approveReviewTask(taskId, reason = "审核通过") {
      const dashboard = await buildOperatorDashboard();
      const task = dashboard.reviewTasks.find((item) => item.id === taskId);
      if (!task) return { item: null };
      const pack = await findPack(task.packId);
      if (!pack) return { item: null };
      const currentStatus = pack.storeListing?.status || pack.storeStatus;
      const nextStatus = STORE_STATUS_ADVANCE[currentStatus] || currentStatus;
      setStoreStatus(pack, nextStatus);
      await commit(await getPacks());
      invalidateBadgeLibrary();
      addOperationLog({
        action: "approve_review_task",
        targetType: task.targetType,
        targetId: task.targetId,
        targetTitle: task.title,
        detail: `${task.reviewTypeLabel}通过：${reason}。${storeStatusTitle(currentStatus)} -> ${storeStatusTitle(nextStatus)}`,
      });
      return {
        item: {
          ...task,
          status: "approved",
          reviewerUserId: "operator_demo",
          reason,
          reviewedAt: Date.now(),
        },
      };
    },

    async rejectReviewTask(taskId, reason = "审核驳回") {
      const dashboard = await buildOperatorDashboard();
      const task = dashboard.reviewTasks.find((item) => item.id === taskId);
      if (!task) return { item: null };
      const pack = await findPack(task.packId);
      if (!pack) return { item: null };
      setStoreStatus(pack, "rejected");
      await commit(await getPacks());
      invalidateBadgeLibrary();
      addOperationLog({
        action: "reject_review_task",
        targetType: task.targetType,
        targetId: task.targetId,
        targetTitle: task.title,
        detail: `${task.reviewTypeLabel}驳回：${reason}`,
      });
      return {
        item: {
          ...task,
          status: "rejected",
          reviewerUserId: "operator_demo",
          reason,
          reviewedAt: Date.now(),
        },
      };
    },

    async markHardwareCandidate(id) {
      const pack = await findPack(id);
      if (!pack) return { item: null };
      if (pack.contentOrigin === "fanwork" && pack.storeStatus !== "listed") {
        return { item: pack, blocked: true, reason: "fanwork_requires_store_review" };
      }
      pack.hardwareStatus = "hardware_candidate";
      pack.status = "hardware_candidate";
      await commit(await getPacks());
      addOperationLog({
        action: "mark_hardware_candidate",
        targetType: "Work",
        targetId: pack.id,
        targetTitle: pack.title,
        detail: "已标记为硬件适配候选。",
      });
      return { item: pack };
    },

    async markHardwareReady(id) {
      const pack = await findPack(id);
      if (!pack) return { item: null };
      if (pack.contentOrigin === "fanwork" && pack.storeStatus !== "listed") {
        return { item: pack, blocked: true, reason: "fanwork_requires_store_review" };
      }
      ensureHardwareProductionState(pack);
      if (pack.compatibilityReport && !pack.compatibilityReport.canCreateHardwarePack) {
        return { item: pack, blocked: true, reason: "hardware_compatibility_failed" };
      }
      pack.hardwareStatus = "hardware_ready";
      pack.status = "hardware_ready";
      await commit(await getPacks());
      addOperationLog({
        action: "mark_hardware_ready",
        targetType: "HardwarePack",
        targetId: pack.hardwarePack?.id || `hw_${pack.id}`,
        targetTitle: pack.title,
        detail: "已标记为可下载设备内容包。",
      });
      return { item: pack };
    },

    async applyStoreListing(id, rightsAccepted = false) {
      const pack = await findPack(id);
      if (!pack || !rightsAccepted) return { item: pack || null, accepted: false };
      pack.rightsAcknowledgedAt = Date.now();
      setStoreStatus(pack, "rights_review");
      await commit(await getPacks());
      invalidateBadgeLibrary();
      addOperationLog({
        actorUserId: pack.author?.id || "user_local",
        actorName: pack.author?.name || "创作者",
        action: "submit_store_listing",
        targetType: "StoreListing",
        targetId: pack.storeListing?.id || `listing_${pack.id}`,
        targetTitle: pack.title,
        detail: "用户提交商店上架申请并签署权利承诺。",
      });
      return { item: pack, accepted: true };
    },

    async approveStoreListing(id) {
      const pack = await findPack(id);
      if (!pack) return { item: null };
      if (!pack.rightsAcknowledgedAt) pack.rightsAcknowledgedAt = Date.now();
      const currentStatus = pack.storeListing?.status || pack.storeStatus;
      const nextStatus = STORE_STATUS_ADVANCE[currentStatus] || currentStatus;
      setStoreStatus(pack, nextStatus);
      if (["producing", "pack_review", "listed"].includes(nextStatus) && pack.compatibilityReport && !pack.compatibilityReport.canCreateHardwarePack) {
        setStoreStatus(pack, "production_queued");
        await commit(await getPacks());
        addOperationLog({
          action: "block_store_listing_advance",
          targetType: "CompatibilityReport",
          targetId: pack.compatibilityReport.id,
          targetTitle: pack.title,
          detail: "兼容报告未通过，设备包不能继续制作。",
        });
        return { item: pack, blocked: true, reason: "hardware_compatibility_failed" };
      }
      await commit(await getPacks());
      invalidateBadgeLibrary();
      addOperationLog({
        action: "advance_store_listing",
        targetType: "StoreListing",
        targetId: pack.storeListing?.id || `listing_${pack.id}`,
        targetTitle: pack.title,
        detail: `${storeStatusTitle(currentStatus)} -> ${storeStatusTitle(nextStatus)}`,
      });
      return { item: pack };
    },

    async rejectStoreListing(id) {
      const pack = await findPack(id);
      if (!pack) return { item: null };
      setStoreStatus(pack, "rejected");
      await commit(await getPacks());
      invalidateBadgeLibrary();
      addOperationLog({
        action: "reject_store_listing",
        targetType: "StoreListing",
        targetId: pack.storeListing?.id || `listing_${pack.id}`,
        targetTitle: pack.title,
        detail: "运营驳回商店上架申请。",
      });
      return { item: pack };
    },

    async delistStoreListing(id, reason = "运营下架设备内容包，停止新增下载和同步。") {
      const pack = await findPack(id);
      if (!pack) return { item: null };
      await ensureDeviceState();
      const frozenSettlements = freezeSettlementsForPack(pack, reason, "delist");
      setStoreStatus(pack, "delisted");
      await commit(await getPacks());
      invalidateBadgeLibrary();
      addOperationLog({
        action: "delist_store_listing",
        targetType: "HardwarePack",
        targetId: pack.hardwarePack?.id || `hw_${pack.id}`,
        targetTitle: pack.title,
        detail: `${reason} 冻结结算记录 ${frozenSettlements.length} 条。`,
      });
      return { item: pack, settlements: frozenSettlements.map(makeSettlementRow) };
    },

    async freezeStoreListing(id, reason = "权利争议处理中，先冻结商店和收益。") {
      const pack = await findPack(id);
      if (!pack) return { item: null };
      await ensureDeviceState();
      const frozenSettlements = freezeSettlementsForPack(pack, reason, "rights_dispute");
      setStoreStatus(pack, "frozen");
      await commit(await getPacks());
      invalidateBadgeLibrary();
      addOperationLog({
        action: "freeze_store_listing",
        targetType: "StoreListing",
        targetId: pack.storeListing?.id || `listing_${pack.id}`,
        targetTitle: pack.title,
        detail: `${reason} 冻结结算记录 ${frozenSettlements.length} 条。`,
      });
      return { item: pack, settlements: frozenSettlements.map(makeSettlementRow) };
    },
  };
}
