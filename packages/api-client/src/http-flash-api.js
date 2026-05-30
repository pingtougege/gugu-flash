export function createHttpFlashApi({ baseUrl = "", token = "", getToken = null } = {}) {
  function buildUrl(path, query = {}) {
    const url = new URL(path, baseUrl || "http://gugu-flash.local");
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    }
    if (baseUrl) return url;
    return `${url.pathname}${url.search}`;
  }

  async function request(path, { method = "GET", body, query } = {}) {
    const authToken = typeof getToken === "function" ? getToken() : token;
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    const response = await fetch(buildUrl(path, query), {
      method,
      headers: Object.keys(headers).length ? headers : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json();
    if (!response.ok || payload.code >= 400) {
      const error = new Error(payload.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload.data;
  }

  const post = (path, body = {}) => request(path, { method: "POST", body });
  const encode = (value) => encodeURIComponent(value);

  return {
    getReadiness: () => request("/flash/ready"),
    getSession: () => request("/flash/session"),
    login: (credentials = {}) => post("/flash/auth/login", credentials),
    logout: () => post("/flash/auth/logout"),
    refreshSession: () => post("/flash/auth/refresh"),
    getFeed: () => request("/flash/feed"),
    getWork: (id) => request(`/flash/works/${encode(id)}`),
    updateWork: (id, pack = {}) => request(`/flash/works/${encode(id)}`, { method: "PATCH", body: { pack } }),
    deleteWork: (id) => request(`/flash/works/${encode(id)}`, { method: "DELETE" }),
    getWorkVersions: (id) => request(`/flash/works/${encode(id)}/versions`),
    createDraft: (prompt, template, options = {}) => post("/flash/drafts", { prompt, template, options }),
    createAiDraft: (prompt, template, options = {}) => post("/flash/ai/create-draft", { prompt, template, options }),
    createAiEditProposal: (payload = {}) => post("/flash/ai/edit-proposals", payload),
    generateAiImage: (asset = {}) => post("/flash/ai/generate-image", asset),
    getDraft: (id) => request(`/flash/drafts/${encode(id)}`),
    updateDraft: (id, draft = {}) => request(`/flash/drafts/${encode(id)}`, { method: "PATCH", body: draft }),
    saveDraftEdit: (id, draft = {}) => post(`/flash/drafts/${encode(id)}/save-edit`, draft),
    publishDraft: (pack) => post(`/flash/drafts/${encode(pack.id || "draft")}/publish`, { pack }),
    publishDraftUpdate: (id, pack) => post(`/flash/drafts/${encode(id)}/publish-update`, { pack }),
    validateDraft: (id, draft = {}) => post(`/flash/drafts/${encode(id)}/validate`, draft),
    previewDraft: (id, draft = {}) => post(`/flash/drafts/${encode(id)}/preview`, draft),
    remixWork: (id) => post(`/flash/works/${encode(id)}/remix`),
    recordInteraction: (id, type) => post(`/flash/works/${encode(id)}/interactions`, { type }),
    getComments: (workId) => request(`/flash/works/${encode(workId)}/comments`),
    postComment: (workId, body = "", options = {}) => post(`/flash/works/${encode(workId)}/comments`, { body, options }),
    deleteComment: (commentId, reason) => request(`/flash/comments/${encode(commentId)}`, { method: "DELETE", body: { reason } }),
    hideComment: (commentId, reason) => post(`/flash/comments/${encode(commentId)}/hide`, { reason }),
    reportComment: (commentId, reason, description) => post(`/flash/comments/${encode(commentId)}/report`, { reason, description }),
    blockUser: (payload = {}) => post("/flash/blocks", payload),
    unblockUser: (blockIdOrUserId) => request(`/flash/blocks/${encode(blockIdOrUserId)}`, { method: "DELETE" }),
    getMyBlocks: () => request("/flash/me/blocks"),
    getFriends: () => request("/flash/friends"),
    submitReport: (targetTypeOrPayload = "Work", targetId, reason = "other", description = "") => {
      const payload = typeof targetTypeOrPayload === "object"
        ? targetTypeOrPayload
        : { targetType: targetTypeOrPayload, targetId, reason, description };
      return post("/flash/reports", payload);
    },
    getMyReports: () => request("/flash/me/reports"),
    submitRightsClaim: (payload = {}) => post("/flash/rights-claims", payload),
    getRightsClaims: () => request("/flash/operator/rights-claims"),
    resolveRightsClaim: (claimId, result = "close", reason) => post(`/flash/operator/rights-claims/${encode(claimId)}/resolve`, { result, reason }),
    submitAppeal: (payload = {}) => post("/flash/appeals", payload),
    getMyAppeals: () => request("/flash/me/appeals"),
    getAppeals: () => request("/flash/operator/appeals"),
    resolveAppeal: (appealId, result = "restore", reason) => post(`/flash/operator/appeals/${encode(appealId)}/resolve`, { result, reason }),
    getOperatorReports: () => request("/flash/operator/reports"),
    resolveReport: (reportId, action = "limit_recommend", reason) => post(`/flash/operator/reports/${encode(reportId)}/resolve`, { action, reason }),
    getModerationActions: () => request("/flash/operator/moderation-actions"),
    getProfile: () => request("/flash/me"),
    getIpPool: (options = {}) => request("/flash/ips", { query: typeof options === "string" ? { query: options } : options }),
    getIpDetail: (ipId) => request(`/flash/ips/${encode(ipId)}`),
    getIpPersonas: (ipId) => request(`/flash/ips/${encode(ipId)}/personas`),
    createIpPersona: (ipId, persona = {}) => post(`/flash/ips/${encode(ipId)}/personas`, persona),
    getIpZoneEligibility: (ipId) => request(`/flash/ips/${encode(ipId)}/zone-eligibility`),
    applyZoneApplication: (ipId, reason) => post("/flash/zone-applications", { ipId, reason }),
    applyIpEntry: (name, description) => post("/flash/ip-applications", { name, description }),
    getZone: (zoneId) => request(`/flash/zones/${encode(zoneId)}`),
    updateZone: (zoneId, fields = {}) => request(`/flash/zones/${encode(zoneId)}`, { method: "PATCH", body: fields }),
    createAsset: (asset = {}) => post("/flash/assets", asset),
    getAsset: (assetId) => request(`/flash/assets/${encode(assetId)}`),
    updateAssetSourceStatement: (assetId, statement = {}) => request(`/flash/assets/${encode(assetId)}/source-statement`, { method: "PATCH", body: statement }),
    submitAssetReview: (assetId) => post(`/flash/assets/${encode(assetId)}/submit-review`),
    searchAnimeIpCandidates: (options = {}) => request("/flash/operator/anime-ip-candidates", { query: options }),
    collectAnimeIpPool: (options = {}) => post("/flash/operator/anime-ip-collection", options),
    searchAnimeIpCharacters: (ipId, options = {}) => request(`/flash/operator/anime-ip-characters/${encode(ipId)}`, { query: options }),
    collectAnimeIpCharacters: (ipId, options = {}) => post(`/flash/operator/anime-ip-characters/${encode(ipId)}/collect`, options),
    getDeviceDashboard: () => request("/flash/device/dashboard"),
    getDevices: () => request("/flash/devices"),
    selectDevice: (deviceId) => post(`/flash/devices/${encode(deviceId)}/select`),
    bindDevice: (options = {}) => post("/flash/devices/bind", options),
    unbindDevice: (deviceId) => post(`/flash/devices/${encode(deviceId)}/unbind`),
    getDeviceEntitlements: (deviceId) => request(`/flash/devices/${encode(deviceId)}/entitlements`),
    getDeviceInstalls: (deviceId) => request(`/flash/devices/${encode(deviceId)}/installs`),
    getDeviceSyncJobs: (deviceId) => request(`/flash/devices/${encode(deviceId)}/sync-jobs`),
    syncDevice: (deviceId, payload = {}) => post(`/flash/devices/${encode(deviceId)}/sync`, payload),
    getStore: () => request("/flash/store"),
    getStoreListing: (id) => request(`/flash/store-listings/${encode(id)}`),
    applyStoreListing: (id, rightsAccepted = false) => post("/flash/store-listings", { id, rightsAccepted }),
    approveStoreListing: (id) => post(`/flash/operator/store-listings/${encode(id)}/advance`),
    rejectStoreListing: (id, reason) => post(`/flash/operator/store-listings/${encode(id)}/reject`, { reason }),
    delistStoreListing: (id, reason) => post(`/flash/operator/store-listings/${encode(id)}/delist`, { reason }),
    freezeStoreListing: (id, reason) => post(`/flash/operator/store-listings/${encode(id)}/freeze`, { reason }),
    getHardwarePack: (id) => request(`/flash/hardware-packs/${encode(id)}`),
    getCompatibilityReport: (id) => request(`/flash/hardware-packs/${encode(id)}/compatibility-report`),
    purchaseBadgePack: (storeOrHardwarePackId) => post(`/flash/hardware-packs/${encode(storeOrHardwarePackId)}/purchase`),
    downloadBadgePack: (storeOrHardwarePackId) => post(`/flash/hardware-packs/${encode(storeOrHardwarePackId)}/download`),
    syncBadgePack: (storeOrHardwarePackId, options = {}) => post(`/flash/hardware-packs/${encode(storeOrHardwarePackId)}/sync`, options),
    getOrders: () => request("/flash/orders"),
    createOrder: (storeId) => post("/flash/orders", { storeId }),
    getOrder: (orderId) => request(`/flash/orders/${encode(orderId)}`),
    payOrder: (orderId) => post(`/flash/orders/${encode(orderId)}/pay`),
    refundOrder: (orderId, options = {}) => post(`/flash/orders/${encode(orderId)}/refund`, options),
    processPaymentCallback: (payload = {}) => post("/flash/operator/payment-callbacks", payload),
    processRefundCallback: (payload = {}) => post("/flash/operator/refund-callbacks", payload),
    getSettlements: () => request("/flash/operator/settlements"),
    releaseSettlement: (settlementId, reason) => post(`/flash/operator/settlements/${encode(settlementId)}/release`, { reason }),
    getOperatorDashboard: () => request("/flash/operator/dashboard"),
    getOperatorOpsMetrics: () => request("/flash/operator/ops-metrics"),
    getOperatorSupportDiagnostics: (query = {}) => request("/flash/operator/support-diagnostics", { query }),
    getOperatorReviewSla: () => request("/flash/operator/review-sla"),
    getOperatorTrending: () => request("/flash/operator/trending"),
    getOperationLogs: () => request("/flash/operator/operation-logs"),
    getReviewTasks: () => request("/flash/operator/review-tasks"),
    approveReviewTask: (taskId, reason) => post(`/flash/operator/review-tasks/${encode(taskId)}/approve`, { reason }),
    rejectReviewTask: (taskId, reason) => post(`/flash/operator/review-tasks/${encode(taskId)}/reject`, { reason }),
    getOperatorStoreListings: () => request("/flash/operator/store-listings"),
    createHardwarePack: (pack = {}) => post("/flash/operator/hardware-packs", pack),
    markHardwareCandidate: (id) => post(`/flash/operator/hardware-packs/${encode(id)}/mark-candidate`),
    markHardwareReady: (id) => post(`/flash/operator/hardware-packs/${encode(id)}/mark-ready`),
    approveHardwarePack: (id) => post(`/flash/operator/hardware-packs/${encode(id)}/approve`),
    publishHardwarePack: (id) => post(`/flash/operator/hardware-packs/${encode(id)}/publish`),
    exportHardwarePack: (id) => post(`/flash/operator/hardware-packs/${encode(id)}/export-to-hardware-studio`),
  };
}
