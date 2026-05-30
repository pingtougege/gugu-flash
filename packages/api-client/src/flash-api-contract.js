import { DOMAIN_ENTITY_SCHEMAS, GUGU_FLASH_CLIENT_TARGETS } from "../../core/src/index.js";

export const FLASH_API_PREFIX = "/flash";

export const FLASH_API_RESPONSE_SHAPE = {
  code: "number",
  message: "string",
  data: "object",
};

export const FLASH_API_ROUTES = [
  { id: "health.ready", method: "GET", path: "/flash/ready", auth: "guest" },
  { id: "auth.login", method: "POST", path: "/flash/auth/login", auth: "guest", responseEntity: "Session" },
  { id: "auth.logout", method: "POST", path: "/flash/auth/logout", auth: "user", responseEntity: "Session" },
  { id: "auth.refresh", method: "POST", path: "/flash/auth/refresh", auth: "user", responseEntity: "Session" },
  { id: "session.get", method: "GET", path: "/flash/session", auth: "guest", responseEntity: "Session" },
  { id: "me.get", method: "GET", path: "/flash/me", auth: "user", responseEntity: "User" },
  { id: "me.profile.update", method: "PATCH", path: "/flash/me/profile", auth: "user", requestEntity: "User", responseEntity: "User" },

  { id: "feed.list", method: "GET", path: "/flash/feed", auth: "guest", responseEntity: "Work" },
  { id: "works.get", method: "GET", path: "/flash/works/:id", auth: "guest", responseEntity: "Work" },
  { id: "works.update", method: "PATCH", path: "/flash/works/:id", auth: "user", requestEntity: "WorkDraft", responseEntity: "Work" },
  { id: "works.delete", method: "DELETE", path: "/flash/works/:id", auth: "user", responseEntity: "Work" },
  { id: "works.versions", method: "GET", path: "/flash/works/:id/versions", auth: "guest", responseEntity: "WorkVersion" },
  { id: "works.interact", method: "POST", path: "/flash/works/:id/interactions", auth: "user", requestEntity: "Interaction", responseEntity: "Interaction" },
  { id: "works.comments.list", method: "GET", path: "/flash/works/:id/comments", auth: "guest", responseEntity: "Comment" },
  { id: "works.comments.create", method: "POST", path: "/flash/works/:id/comments", auth: "user", requestEntity: "Comment", responseEntity: "Comment" },
  { id: "comments.delete", method: "DELETE", path: "/flash/comments/:id", auth: "user", responseEntity: "Comment" },
  { id: "comments.hide", method: "POST", path: "/flash/comments/:id/hide", auth: "user", responseEntity: "Comment" },
  { id: "comments.report", method: "POST", path: "/flash/comments/:id/report", auth: "user", requestEntity: "Report", responseEntity: "Report" },
  { id: "works.remix", method: "POST", path: "/flash/works/:id/remix", auth: "user", requestEntity: "WorkDraft", responseEntity: "Work" },
  { id: "me.works", method: "GET", path: "/flash/me/works", auth: "user", responseEntity: "Work" },
  { id: "friends.list", method: "GET", path: "/flash/friends", auth: "user", responseEntity: "Interaction" },
  { id: "blocks.create", method: "POST", path: "/flash/blocks", auth: "user", requestEntity: "BlockRelation", responseEntity: "BlockRelation" },
  { id: "blocks.delete", method: "DELETE", path: "/flash/blocks/:id", auth: "user", responseEntity: "BlockRelation" },
  { id: "blocks.mine", method: "GET", path: "/flash/me/blocks", auth: "user", responseEntity: "BlockRelation" },
  { id: "reports.create", method: "POST", path: "/flash/reports", auth: "user", requestEntity: "Report", responseEntity: "Report" },
  { id: "reports.mine", method: "GET", path: "/flash/me/reports", auth: "user", responseEntity: "Report" },
  { id: "rightsClaims.create", method: "POST", path: "/flash/rights-claims", auth: "user", requestEntity: "RightsClaim", responseEntity: "RightsClaim" },
  { id: "appeals.create", method: "POST", path: "/flash/appeals", auth: "user", requestEntity: "Appeal", responseEntity: "Appeal" },
  { id: "appeals.mine", method: "GET", path: "/flash/me/appeals", auth: "user", responseEntity: "Appeal" },

  { id: "storyProjects.list", method: "GET", path: "/flash/story-projects", auth: "user", responseEntity: "StoryProject" },
  { id: "storyProjects.create", method: "POST", path: "/flash/story-projects", auth: "user", requestEntity: "StoryProject", responseEntity: "StoryProject" },
  { id: "storyProjects.get", method: "GET", path: "/flash/story-projects/:id", auth: "user", responseEntity: "StoryProject" },
  { id: "storyProjects.update", method: "PATCH", path: "/flash/story-projects/:id", auth: "user", requestEntity: "StoryProject", responseEntity: "StoryProject" },
  { id: "storyProjects.versions.list", method: "GET", path: "/flash/story-projects/:id/versions", auth: "user", responseEntity: "StoryProjectVersion" },
  { id: "storyProjects.versions.create", method: "POST", path: "/flash/story-projects/:id/versions", auth: "user", requestEntity: "StoryProject", responseEntity: "StoryProjectVersion" },
  { id: "storyProjects.compileH5", method: "POST", path: "/flash/story-projects/:id/compile/h5", auth: "user", requestEntity: "StoryProject", responseEntity: "WorkDraft" },
  { id: "storyProjects.compileComic", method: "POST", path: "/flash/story-projects/:id/compile/comic", auth: "user", requestEntity: "StoryProject", responseEntity: "ComicEpisode" },
  { id: "storyProjects.publish", method: "POST", path: "/flash/story-projects/:id/publish", auth: "user", requestEntity: "StoryProject", responseEntity: "Work" },
  { id: "ai.storyProjectJobs.create", method: "POST", path: "/flash/ai/story-projects/:id/jobs", auth: "user", requestEntity: "AiGenerationJob", responseEntity: "AiGenerationJob" },
  { id: "ai.storyProjectJobs.get", method: "GET", path: "/flash/ai/jobs/:id", auth: "user", responseEntity: "AiGenerationJob" },
  { id: "ai.storyProjectJobs.apply", method: "POST", path: "/flash/ai/jobs/:id/apply", auth: "user", requestEntity: "AiGenerationJob", responseEntity: "StoryProject" },
  { id: "ai.storyProjectJobs.discard", method: "POST", path: "/flash/ai/jobs/:id/discard", auth: "user", requestEntity: "AiGenerationJob", responseEntity: "AiGenerationJob" },

  { id: "drafts.create", method: "POST", path: "/flash/drafts", auth: "user", requestEntity: "WorkDraft", responseEntity: "WorkDraft" },
  { id: "ai.createDraft", method: "POST", path: "/flash/ai/create-draft", auth: "user", requestEntity: "WorkDraft", responseEntity: "WorkDraft" },
  { id: "ai.editProposals.create", method: "POST", path: "/flash/ai/edit-proposals", auth: "user", requestEntity: "WorkDraft", responseEntity: "WorkDraft" },
  { id: "ai.generateImage", method: "POST", path: "/flash/ai/generate-image", auth: "user", requestEntity: "Asset", responseEntity: "Asset" },
  { id: "ai.generatedImages.get", method: "GET", path: "/flash/ai/generated-images/:id", auth: "user", responseEntity: "Asset" },
  { id: "drafts.get", method: "GET", path: "/flash/drafts/:id", auth: "user", responseEntity: "WorkDraft" },
  { id: "drafts.update", method: "PATCH", path: "/flash/drafts/:id", auth: "user", requestEntity: "WorkDraft", responseEntity: "WorkDraft" },
  { id: "drafts.saveEdit", method: "POST", path: "/flash/drafts/:id/save-edit", auth: "user", requestEntity: "WorkDraft", responseEntity: "WorkDraft" },
  { id: "drafts.publish", method: "POST", path: "/flash/drafts/:id/publish", auth: "user", requestEntity: "WorkDraft", responseEntity: "Work" },
  { id: "drafts.publishUpdate", method: "POST", path: "/flash/drafts/:id/publish-update", auth: "user", requestEntity: "WorkDraft", responseEntity: "WorkVersion" },
  { id: "drafts.validate", method: "POST", path: "/flash/drafts/:id/validate", auth: "user", requestEntity: "WorkDraft", responseEntity: "ReviewTask" },
  { id: "drafts.preview", method: "POST", path: "/flash/drafts/:id/preview", auth: "user", requestEntity: "WorkDraft", responseEntity: "WorkDraft" },

  { id: "assets.create", method: "POST", path: "/flash/assets", auth: "user", requestEntity: "Upload", responseEntity: "Asset" },
  { id: "assets.get", method: "GET", path: "/flash/assets/:id", auth: "user", responseEntity: "Asset" },
  { id: "assets.source.update", method: "PATCH", path: "/flash/assets/:id/source-statement", auth: "user", requestEntity: "Asset", responseEntity: "Asset" },
  { id: "assets.review.submit", method: "POST", path: "/flash/assets/:id/submit-review", auth: "user", responseEntity: "ReviewTask" },

  { id: "ips.list", method: "GET", path: "/flash/ips", auth: "guest", responseEntity: "IPEntry" },
  { id: "ips.get", method: "GET", path: "/flash/ips/:id", auth: "guest", responseEntity: "IPEntry" },
  { id: "ipApplications.create", method: "POST", path: "/flash/ip-applications", auth: "user", requestEntity: "IPEntry", responseEntity: "ReviewTask" },
  { id: "ips.personas.list", method: "GET", path: "/flash/ips/:id/personas", auth: "guest", responseEntity: "Persona" },
  { id: "ips.personas.create", method: "POST", path: "/flash/ips/:id/personas", auth: "user", requestEntity: "Persona", responseEntity: "ReviewTask" },
  { id: "ips.zoneEligibility", method: "GET", path: "/flash/ips/:id/zone-eligibility", auth: "user", responseEntity: "ZoneApplication" },
  { id: "zoneApplications.create", method: "POST", path: "/flash/zone-applications", auth: "user", requestEntity: "ZoneApplication", responseEntity: "ZoneApplication" },
  { id: "zones.get", method: "GET", path: "/flash/zones/:id", auth: "guest", responseEntity: "IPZone" },
  { id: "zones.update", method: "PATCH", path: "/flash/zones/:id", auth: "zone_admin", requestEntity: "IPZone", responseEntity: "IPZone" },
  { id: "operator.animeIpCandidates.list", method: "GET", path: "/flash/operator/anime-ip-candidates", auth: "operator", responseEntity: "IPEntry" },
  { id: "operator.animeIpCollection.create", method: "POST", path: "/flash/operator/anime-ip-collection", auth: "operator", requestEntity: "IPEntry", responseEntity: "IPEntry" },
  { id: "operator.animeIpCharacters.list", method: "GET", path: "/flash/operator/anime-ip-characters/:id", auth: "operator", responseEntity: "Persona" },
  { id: "operator.animeIpCharacters.collect", method: "POST", path: "/flash/operator/anime-ip-characters/:id/collect", auth: "operator", requestEntity: "Persona", responseEntity: "IPEntry" },

  { id: "storeListings.create", method: "POST", path: "/flash/store-listings", auth: "user", requestEntity: "StoreListing", responseEntity: "StoreListing" },
  { id: "storeListings.get", method: "GET", path: "/flash/store-listings/:id", auth: "user", responseEntity: "StoreListing" },
  { id: "store.list", method: "GET", path: "/flash/store", auth: "guest", responseEntity: "HardwarePack" },
  { id: "hardwarePacks.get", method: "GET", path: "/flash/hardware-packs/:id", auth: "guest", responseEntity: "HardwarePack" },
  { id: "hardwarePacks.compatibilityReport", method: "GET", path: "/flash/hardware-packs/:id/compatibility-report", auth: "user", responseEntity: "CompatibilityReport" },
  { id: "hardwarePacks.purchase", method: "POST", path: "/flash/hardware-packs/:id/purchase", auth: "user", requestEntity: "Order", responseEntity: "DeviceEntitlement" },
  { id: "hardwarePacks.download", method: "POST", path: "/flash/hardware-packs/:id/download", auth: "user", requestEntity: "DeviceEntitlement", responseEntity: "DeviceEntitlement" },
  { id: "hardwarePacks.sync", method: "POST", path: "/flash/hardware-packs/:id/sync", auth: "user", requestEntity: "DeviceInstall", responseEntity: "DeviceInstall" },

  { id: "devices.dashboard", method: "GET", path: "/flash/device/dashboard", auth: "user", responseEntity: "Device" },
  { id: "devices.list", method: "GET", path: "/flash/devices", auth: "user", responseEntity: "Device" },
  { id: "devices.bind", method: "POST", path: "/flash/devices/bind", auth: "user", requestEntity: "Device", responseEntity: "Device" },
  { id: "devices.select", method: "POST", path: "/flash/devices/:id/select", auth: "user", responseEntity: "Device" },
  { id: "devices.unbind", method: "POST", path: "/flash/devices/:id/unbind", auth: "user", responseEntity: "Device" },
  { id: "devices.entitlements", method: "GET", path: "/flash/devices/:id/entitlements", auth: "user", responseEntity: "DeviceEntitlement" },
  { id: "devices.installs", method: "GET", path: "/flash/devices/:id/installs", auth: "user", responseEntity: "DeviceInstall" },
  { id: "devices.syncJobs", method: "GET", path: "/flash/devices/:id/sync-jobs", auth: "user", responseEntity: "DeviceSyncJob" },
  { id: "devices.sync", method: "POST", path: "/flash/devices/:id/sync", auth: "user", requestEntity: "DeviceInstall", responseEntity: "DeviceInstall" },

  { id: "orders.list", method: "GET", path: "/flash/orders", auth: "user", responseEntity: "Order" },
  { id: "orders.create", method: "POST", path: "/flash/orders", auth: "user", requestEntity: "Order", responseEntity: "Order" },
  { id: "orders.get", method: "GET", path: "/flash/orders/:id", auth: "user", responseEntity: "Order" },
  { id: "orders.pay", method: "POST", path: "/flash/orders/:id/pay", auth: "user", responseEntity: "Order" },
  { id: "orders.refund", method: "POST", path: "/flash/orders/:id/refund", auth: "operator", responseEntity: "Order" },
  { id: "operator.paymentCallbacks.create", method: "POST", path: "/flash/operator/payment-callbacks", auth: "provider_signature", requestEntity: "PaymentCallback", responseEntity: "PaymentCallback" },
  { id: "operator.refundCallbacks.create", method: "POST", path: "/flash/operator/refund-callbacks", auth: "operator", requestEntity: "Refund", responseEntity: "Refund" },
  { id: "operator.settlements.list", method: "GET", path: "/flash/operator/settlements", auth: "operator", responseEntity: "Settlement" },
  { id: "operator.settlements.release", method: "POST", path: "/flash/operator/settlements/:id/release", auth: "operator", responseEntity: "Settlement" },
  { id: "operator.reports.list", method: "GET", path: "/flash/operator/reports", auth: "reviewer", responseEntity: "Report" },
  { id: "operator.reports.resolve", method: "POST", path: "/flash/operator/reports/:id/resolve", auth: "reviewer", responseEntity: "Report" },
  { id: "operator.rightsClaims.list", method: "GET", path: "/flash/operator/rights-claims", auth: "reviewer", responseEntity: "RightsClaim" },
  { id: "operator.rightsClaims.resolve", method: "POST", path: "/flash/operator/rights-claims/:id/resolve", auth: "reviewer", responseEntity: "RightsClaim" },
  { id: "operator.appeals.list", method: "GET", path: "/flash/operator/appeals", auth: "reviewer", responseEntity: "Appeal" },
  { id: "operator.appeals.resolve", method: "POST", path: "/flash/operator/appeals/:id/resolve", auth: "reviewer", responseEntity: "Appeal" },
  { id: "operator.moderationActions.list", method: "GET", path: "/flash/operator/moderation-actions", auth: "reviewer", responseEntity: "ModerationAction" },

  { id: "operator.dashboard", method: "GET", path: "/flash/operator/dashboard", auth: "operator" },
  { id: "operator.opsMetrics", method: "GET", path: "/flash/operator/ops-metrics", auth: "operator" },
  { id: "operator.supportDiagnostics.get", method: "GET", path: "/flash/operator/support-diagnostics", auth: "support" },
  { id: "operator.reviewSla.get", method: "GET", path: "/flash/operator/review-sla", auth: "operator" },
  { id: "operator.trending", method: "GET", path: "/flash/operator/trending", auth: "operator", responseEntity: "Work" },
  { id: "operator.reviewTasks.list", method: "GET", path: "/flash/operator/review-tasks", auth: "reviewer", responseEntity: "ReviewTask" },
  { id: "operator.reviewTasks.approve", method: "POST", path: "/flash/operator/review-tasks/:id/approve", auth: "reviewer", responseEntity: "ReviewTask" },
  { id: "operator.reviewTasks.reject", method: "POST", path: "/flash/operator/review-tasks/:id/reject", auth: "reviewer", responseEntity: "ReviewTask" },
  { id: "operator.storeListings.list", method: "GET", path: "/flash/operator/store-listings", auth: "operator", responseEntity: "StoreListing" },
  { id: "operator.storeListings.advance", method: "POST", path: "/flash/operator/store-listings/:id/advance", auth: "operator", responseEntity: "StoreListing" },
  { id: "operator.storeListings.reject", method: "POST", path: "/flash/operator/store-listings/:id/reject", auth: "operator", responseEntity: "StoreListing" },
  { id: "operator.storeListings.delist", method: "POST", path: "/flash/operator/store-listings/:id/delist", auth: "operator", responseEntity: "StoreListing" },
  { id: "operator.storeListings.freeze", method: "POST", path: "/flash/operator/store-listings/:id/freeze", auth: "operator", responseEntity: "StoreListing" },
  { id: "operator.hardwarePacks.create", method: "POST", path: "/flash/operator/hardware-packs", auth: "hardware_operator", requestEntity: "HardwarePack", responseEntity: "HardwarePack" },
  { id: "operator.hardwarePacks.markCandidate", method: "POST", path: "/flash/operator/hardware-packs/:id/mark-candidate", auth: "hardware_operator", responseEntity: "Work" },
  { id: "operator.hardwarePacks.markReady", method: "POST", path: "/flash/operator/hardware-packs/:id/mark-ready", auth: "hardware_operator", responseEntity: "HardwarePack" },
  { id: "operator.hardwarePacks.approve", method: "POST", path: "/flash/operator/hardware-packs/:id/approve", auth: "hardware_operator", responseEntity: "HardwarePack" },
  { id: "operator.hardwarePacks.publish", method: "POST", path: "/flash/operator/hardware-packs/:id/publish", auth: "hardware_operator", responseEntity: "HardwarePack" },
  { id: "operator.hardwarePacks.export", method: "POST", path: "/flash/operator/hardware-packs/:id/export-to-hardware-studio", auth: "hardware_operator" },
  { id: "operator.operationLogs.list", method: "GET", path: "/flash/operator/operation-logs", auth: "operator", responseEntity: "OperationLog" },
];

export const MOCK_FLASH_API_METHOD_ROUTES = {
  getFeed: "feed.list",
  getWork: "works.get",
  updateWork: "works.update",
  deleteWork: "works.delete",
  createDraft: "drafts.create",
  createAiDraft: "ai.createDraft",
  createAiEditProposal: "ai.editProposals.create",
  generateAiImage: "ai.generateImage",
  validateDraft: "drafts.validate",
  publishDraft: "drafts.publish",
  remixWork: "works.remix",
  recordInteraction: "works.interact",
  getComments: "works.comments.list",
  postComment: "works.comments.create",
  deleteComment: "comments.delete",
  hideComment: "comments.hide",
  reportComment: "comments.report",
  blockUser: "blocks.create",
  unblockUser: "blocks.delete",
  getMyBlocks: "blocks.mine",
  getFriends: "friends.list",
  submitReport: "reports.create",
  getMyReports: "reports.mine",
  submitRightsClaim: "rightsClaims.create",
  submitAppeal: "appeals.create",
  getMyAppeals: "appeals.mine",
  listStoryProjects: "storyProjects.list",
  createStoryProject: "storyProjects.create",
  getStoryProject: "storyProjects.get",
  updateStoryProject: "storyProjects.update",
  listStoryProjectVersions: "storyProjects.versions.list",
  createStoryProjectVersion: "storyProjects.versions.create",
  compileStoryProjectH5: "storyProjects.compileH5",
  compileStoryProjectComic: "storyProjects.compileComic",
  publishStoryProject: "storyProjects.publish",
  createStoryProjectAiJob: "ai.storyProjectJobs.create",
  getAiGenerationJob: "ai.storyProjectJobs.get",
  applyAiGenerationJob: "ai.storyProjectJobs.apply",
  getDeviceDashboard: "devices.dashboard",
  purchaseBadgePack: "hardwarePacks.purchase",
  downloadBadgePack: "hardwarePacks.download",
  syncBadgePack: "hardwarePacks.sync",
  getCompatibilityReport: "hardwarePacks.compatibilityReport",
  selectDevice: "devices.select",
  bindDevice: "devices.bind",
  unbindDevice: "devices.unbind",
  getDeviceSyncJobs: "devices.syncJobs",
  getOrders: "orders.list",
  createOrder: "orders.create",
  payOrder: "orders.pay",
  refundOrder: "orders.refund",
  processPaymentCallback: "operator.paymentCallbacks.create",
  processRefundCallback: "operator.refundCallbacks.create",
  getSettlements: "operator.settlements.list",
  releaseSettlement: "operator.settlements.release",
  getOperatorReports: "operator.reports.list",
  resolveReport: "operator.reports.resolve",
  getRightsClaims: "operator.rightsClaims.list",
  resolveRightsClaim: "operator.rightsClaims.resolve",
  getAppeals: "operator.appeals.list",
  resolveAppeal: "operator.appeals.resolve",
  getModerationActions: "operator.moderationActions.list",
  getProfile: "me.get",
  getIpPool: "ips.list",
  getIpDetail: "ips.get",
  getIpZoneEligibility: "ips.zoneEligibility",
  applyZoneApplication: "zoneApplications.create",
  applyIpEntry: "ipApplications.create",
  searchAnimeIpCandidates: "operator.animeIpCandidates.list",
  collectAnimeIpPool: "operator.animeIpCollection.create",
  searchAnimeIpCharacters: "operator.animeIpCharacters.list",
  collectAnimeIpCharacters: "operator.animeIpCharacters.collect",
  getOperatorDashboard: "operator.dashboard",
  getOperatorTrending: "operator.trending",
  getOperationLogs: "operator.operationLogs.list",
  approveReviewTask: "operator.reviewTasks.approve",
  rejectReviewTask: "operator.reviewTasks.reject",
  markHardwareCandidate: "operator.hardwarePacks.markCandidate",
  markHardwareReady: "operator.hardwarePacks.markReady",
  applyStoreListing: "storeListings.create",
  approveStoreListing: "operator.storeListings.advance",
  rejectStoreListing: "operator.storeListings.reject",
  delistStoreListing: "operator.storeListings.delist",
  freezeStoreListing: "operator.storeListings.freeze",
};

export function listApiRoutes() {
  return FLASH_API_ROUTES;
}

export function getApiRoute(routeId) {
  return FLASH_API_ROUTES.find((route) => route.id === routeId) || null;
}

export function routeForMockMethod(methodName) {
  return getApiRoute(MOCK_FLASH_API_METHOD_ROUTES[methodName]);
}

export function validateApiContract() {
  const errors = [];
  const routeIds = new Set();
  const routeKeys = new Set();

  for (const route of FLASH_API_ROUTES) {
    if (!route.id) errors.push("route missing id");
    if (!route.method) errors.push(`${route.id || "route"} missing method`);
    if (!route.path?.startsWith(FLASH_API_PREFIX)) errors.push(`${route.id} must live under ${FLASH_API_PREFIX}`);
    if (route.path?.includes("guguclub")) errors.push(`${route.id} must not depend on guguclub`);
    if (routeIds.has(route.id)) errors.push(`duplicate route id: ${route.id}`);
    routeIds.add(route.id);

    const routeKey = `${route.method} ${route.path}`;
    if (routeKeys.has(routeKey)) errors.push(`duplicate route: ${routeKey}`);
    routeKeys.add(routeKey);

    for (const entityField of ["requestEntity", "responseEntity"]) {
      const entityType = route[entityField];
      if (entityType && !DOMAIN_ENTITY_SCHEMAS[entityType]) {
        errors.push(`${route.id}.${entityField} references unknown entity ${entityType}`);
      }
    }
  }

  for (const [methodName, routeId] of Object.entries(MOCK_FLASH_API_METHOD_ROUTES)) {
    if (!routeIds.has(routeId)) errors.push(`mock method ${methodName} maps to missing route ${routeId}`);
  }

  if (!GUGU_FLASH_CLIENT_TARGETS.includes("native") || !GUGU_FLASH_CLIENT_TARGETS.includes("miniprogram")) {
    errors.push("API contract must target shared web/native/miniprogram clients");
  }

  return errors;
}
