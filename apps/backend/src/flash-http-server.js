import { createServer } from "node:http";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createMockFlashApi } from "../../../packages/api-client/src/mock-flash-api.js";
import {
  GUGU_STORY_PROJECT_SCHEMA_VERSION,
  compileStoryProjectToComicEpisode,
  compileStoryProjectToH5Pack,
  createDraftQualityChecks,
  createAiEditProposalPreview,
  createHardwareStudioExportBundle,
  createPublishChecklist,
  createStoryProjectPlayabilityReport,
  validateStoryProject,
} from "../../../packages/core/src/index.js";
import { createAiDraftFromPrompt } from "./ai-draft-generator.js";
import { generateAiImage, getGeneratedAiImage } from "./ai-image-generator.js";
import {
  ASSET_SECURITY_POLICY_VERSION,
  createAssetSecurityReport,
  validateAssetSourceStatement,
} from "./asset-security.js";
import {
  hasFlashPermission,
  normalizeFlashRole,
  operatorPermissionForRoute,
  permissionsForRole,
  requiresOperatorInvite,
  staticDemoRoleFromToken,
} from "./flash-auth-policy.js";
import {
  DEFAULT_IDENTITY_AUDIENCE,
  DEFAULT_IDENTITY_ISSUER,
  verifyIdentityToken,
} from "./flash-identity-token.js";
import { createJsonFlashStore } from "./json-flash-store.js";
import { evaluateMonitoringAlerts } from "./monitoring-alerts.js";
import { evaluateReviewSla } from "./review-sla.js";
import { createSupportDiagnosticBundle } from "./support-diagnostics.js";

const root = new URL("../../..", import.meta.url).pathname;
const defaultSeedPath = join(root, "data/seed-packs.json");
const defaultDataPath = join(root, ".gugu-flash-api/packs.json");
const defaultStatePath = join(root, ".gugu-flash-api/runtime-state.json");
const defaultGovernancePolicyPath = join(root, "docs/review-governance-policy.json");
const governancePolicy = JSON.parse(readFileSync(defaultGovernancePolicyPath, "utf8"));
export const DEFAULT_PAYMENT_CALLBACK_SECRET = "gugu_flash_alpha_payment_secret";
export const DEFAULT_MAX_JSON_BODY_BYTES = 256 * 1024;

class PayloadTooLargeError extends Error {
  constructor(maxBytes) {
    super("payload_too_large");
    this.maxBytes = maxBytes;
  }
}

export function flashSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    ...flashSecurityHeaders(),
    "Access-Control-Allow-Origin": process.env.GUGU_FLASH_CORS_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Gugu-Payment-Signature",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(payload));
}

function ok(res, data = {}, message = "ok") {
  sendJson(res, 200, { code: 200, message, data });
}

function notFound(res, message = "route_not_found") {
  sendJson(res, 404, { code: 404, message, data: null });
}

function badRequest(res, message = "bad_request") {
  sendJson(res, 400, { code: 400, message, data: null });
}

function unauthorized(res, message = "auth_required") {
  sendJson(res, 401, { code: 401, message, data: null });
}

function forbidden(res, message = "permission_denied") {
  sendJson(res, 403, { code: 403, message, data: null });
}

function payloadTooLarge(res, message = "payload_too_large") {
  sendJson(res, 413, { code: 413, message, data: null });
}

async function readJsonBody(req, maxBytes = DEFAULT_MAX_JSON_BODY_BYTES) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > maxBytes) throw new PayloadTooLargeError(maxBytes);
  }
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function splitPath(pathname) {
  return pathname.split("/").filter(Boolean);
}

function decodePart(value) {
  return decodeURIComponent(value || "");
}

function normalizeHeaderValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function requestIdFromRequest(req) {
  const raw = normalizeHeaderValue(req.headers["x-request-id"] || req.headers["x-gugu-request-id"]);
  const value = String(raw || "").trim();
  if (/^[a-zA-Z0-9._:-]{8,96}$/.test(value)) return value;
  return `req_${randomUUID()}`;
}

export function paymentCallbackSignaturePayload(payload = {}) {
  const amount = payload.amount === undefined || payload.amount === null ? "" : Number(payload.amount);
  return JSON.stringify({
    providerEventId: String(payload.providerEventId || payload.eventId || payload.id || ""),
    providerPaymentId: String(payload.providerPaymentId || payload.paymentId || ""),
    orderId: String(payload.orderId || ""),
    status: String(payload.status || ""),
    amount,
    currency: String(payload.currency || ""),
    provider: String(payload.provider || "mock_pay"),
  });
}

export function createPaymentCallbackSignature(payload = {}, secret = process.env.GUGU_FLASH_PAYMENT_CALLBACK_SECRET || DEFAULT_PAYMENT_CALLBACK_SECRET) {
  return `sha256=${createHmac("sha256", secret).update(paymentCallbackSignaturePayload(payload)).digest("hex")}`;
}

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyPaymentCallbackSignature(payload = {}, signature = "", secret = process.env.GUGU_FLASH_PAYMENT_CALLBACK_SECRET || DEFAULT_PAYMENT_CALLBACK_SECRET) {
  const expected = createPaymentCallbackSignature(payload, secret);
  const provided = String(signature || "");
  return timingSafeEqualString(provided, expected) || timingSafeEqualString(provided, expected.replace(/^sha256=/, ""));
}

function tokenFromRequest(req) {
  return String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
}

function roleFromStaticToken(token) {
  return staticDemoRoleFromToken(token);
}

function roleFromRequest(req, session = null, { allowDemoAuth = false } = {}) {
  if (session?.role) return normalizeFlashRole(session.role);
  if (!allowDemoAuth) return "guest";
  const staticRole = roleFromStaticToken(tokenFromRequest(req));
  if (staticRole) return normalizeFlashRole(staticRole);
  const roleHeader = normalizeHeaderValue(req.headers["x-gugu-role"]);
  return normalizeFlashRole(String(roleHeader || "guest"));
}

function canUseOperatorRoute(role, pathname, method) {
  return hasFlashPermission(role, operatorPermissionForRoute(pathname, method));
}

function isProviderSignedRoute(pathname) {
  return pathname === "/flash/operator/payment-callbacks";
}

function needsUserSession(req, pathname) {
  if (pathname === "/flash/session" || pathname.startsWith("/flash/auth/")) return false;
  if (req.method !== "GET") return true;
  return (
    pathname === "/flash/me" ||
    pathname.startsWith("/flash/me/") ||
    pathname.startsWith("/flash/device/") ||
    pathname.startsWith("/flash/devices") ||
    pathname.startsWith("/flash/orders")
  );
}

function authFailure(req, pathname, requireAuth, session = null, { allowDemoAuth = false } = {}) {
  if (!requireAuth) return null;
  if (req.method === "POST" && isProviderSignedRoute(pathname)) return null;
  const role = roleFromRequest(req, session, { allowDemoAuth });
  if (pathname.startsWith("/flash/operator") && !canUseOperatorRoute(role, pathname, req.method)) {
    return role === "guest" ? "auth_required" : "permission_denied";
  }
  if (needsUserSession(req, pathname) && role === "guest") return "auth_required";
  return null;
}

function createPackPersistence({
  dataPath = process.env.GUGU_FLASH_API_DATA || defaultDataPath,
  statePath = process.env.GUGU_FLASH_API_STATE || defaultStatePath,
  seedPath = defaultSeedPath,
} = {}) {
  return createJsonFlashStore({ dataPath, statePath, seedPath });
}

function publicSession(session) {
  if (!session) return null;
  const { accessToken, refreshToken, ...item } = session;
  return {
    ...item,
    permissions: permissionsForRole(item.role),
  };
}

function sessionResponse(session, { includeTokens = true } = {}) {
  if (!session) return { item: null };
  return {
    item: publicSession(session),
    ...(includeTokens ? {
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    } : {}),
  };
}

function demoSession(role = "creator") {
  const now = Date.now();
  return {
    item: {
      id: "session_demo",
      userId: "user_local",
      displayName: "Demo User",
      role,
      status: "active",
      createdAt: now,
      updatedAt: now,
      expiresAt: now + 1000 * 60 * 60,
    },
  };
}

async function storeIdForHardwareIdentifier(api, id) {
  if (id.startsWith("store_")) return id;
  const dashboard = await api.getDeviceDashboard();
  const item = dashboard.library.find((entry) => (
    entry.id === id ||
    entry.packId === id ||
    entry.hardwarePackId === id ||
    entry.hardwarePack?.id === id
  ));
  return item?.id || id;
}

async function findPackForHttp(api, id) {
  const feed = await api.getFeed();
  return feed.items.find((item) => (
    item.id === id ||
    item.work?.id === id ||
    item.workVersion?.id === id ||
    item.storeListing?.id === id ||
    item.hardwarePack?.id === id ||
    item.compatibilityReport?.id === id ||
    `store_${item.id}` === id
  )) || null;
}

async function getOperatorDashboardField(api, field) {
  const dashboard = await api.getOperatorDashboard();
  return { items: dashboard[field] || [] };
}

function alphaStub(id, fields = {}) {
  return {
    item: {
      id,
      status: "alpha_stub",
      message: "Backend Alpha route is available; production persistence is pending.",
      ...fields,
    },
  };
}

function prefixedId(prefix) {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function validationFailed(res, message, errors = []) {
  sendJson(res, 400, {
    code: 400,
    message,
    data: { errors },
  });
}

function notImplemented(res, message, data = {}) {
  sendJson(res, 501, {
    code: 501,
    message,
    data,
  });
}

function storyProjectFromBody(body = {}) {
  return body.project || body.item || body.storyProject || body;
}

function normalizeStoryProjectForPersistence(project = {}, {
  id = null,
  existing = null,
  session = null,
  timestamp = Date.now(),
} = {}) {
  const author = project.author || existing?.author || {
    id: project.authorUserId || existing?.authorUserId || session?.userId || "user_local",
    name: session?.displayName || "你",
  };
  const authorUserId = project.authorUserId || author.id || existing?.authorUserId || session?.userId || "user_local";
  const contentOrigin = project.contentOrigin || project.origin?.contentOrigin || existing?.contentOrigin || existing?.origin?.contentOrigin || "original";

  return {
    ...structuredClone(existing || {}),
    ...structuredClone(project),
    id: id || project.id || existing?.id || prefixedId("story_project"),
    schemaVersion: project.schemaVersion || existing?.schemaVersion || GUGU_STORY_PROJECT_SCHEMA_VERSION,
    title: project.title || existing?.title || project.brief?.title || "未命名故事工程",
    status: project.status || existing?.status || "draft",
    author,
    authorUserId,
    contentOrigin,
    origin: {
      ...(existing?.origin || {}),
      ...(project.origin || {}),
      contentOrigin,
    },
    createdAt: existing?.createdAt || project.createdAt || timestamp,
    updatedAt: timestamp,
  };
}

function createStoryProjectVersionSnapshot(project, {
  id = prefixedId("spv"),
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

function createCompiledStoryDraft(project, pack, {
  draftId = prefixedId("draft"),
  timestamp = Date.now(),
  report = null,
} = {}) {
  const qualityChecks = createDraftQualityChecks(pack);
  const checklist = createPublishChecklist(pack, { qualityChecks, target: "h5" });
  const personaId = pack.persona?.id || project.persona?.id || null;

  return {
    id: draftId,
    targetType: "WorkDraft",
    storyProjectId: project.id,
    storyProjectVersionId: project.versionId || null,
    authorUserId: project.authorUserId || project.author?.id || "user_local",
    contentOrigin: pack.contentOrigin || project.contentOrigin || "original",
    ipId: pack.ipId || null,
    personaId,
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

function storyProjectPackIdFromRequest(project = {}, body = {}) {
  const packIdSuffix = String(project.id || "")
    .replace(/^story_project_/, "")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .slice(0, 40) || randomUUID().slice(0, 8);
  return body.packId || body.h5PackId || project.outputWorkId || `h5_${packIdSuffix}`;
}

function storyProjectDraftIdFromRequest(project = {}, body = {}) {
  const safeProjectId = String(project.id || "story_project")
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .slice(0, 64);
  return body.draftId || project.sourceDraftId || project.draftId || `draft_${safeProjectId}`;
}

function storyProjectPublishBlockers(report = {}) {
  const checks = Array.isArray(report.publishChecklist?.checks) ? report.publishChecklist.checks : [];
  return checks
    .filter((check) => check.status === "blocked")
    .map((check) => `${check.id || "publish_check"}: ${check.detail || check.label || "blocked"}`);
}

function policyRecord(collection, id) {
  return (governancePolicy[collection] || []).find((item) => item.id === id) || null;
}

function policyAction(collection, recordId, actionId) {
  return policyRecord(collection, recordId)?.actions?.find((item) => item.id === actionId) || null;
}

function validatePolicyAction(res, { collection, recordId, actionId, reason, invalidMessage = "invalid_operator_action" }) {
  const action = policyAction(collection, recordId, actionId);
  if (!action) {
    badRequest(res, invalidMessage);
    return false;
  }
  if (action.requiresReason && !String(reason || "").trim()) {
    badRequest(res, "operator_reason_required");
    return false;
  }
  return true;
}

export function createFlashBackendApp(options = {}) {
  const persistence = createPackPersistence(options);
  const api = createMockFlashApi(persistence);
  const requireAuth = options.requireAuth ?? process.env.GUGU_FLASH_REQUIRE_AUTH === "1";
  const allowDemoAuth = options.allowDemoAuth ?? (process.env.GUGU_FLASH_ALLOW_DEMO_AUTH === "1" || !requireAuth);
  const operatorInviteSecret = options.operatorInviteSecret ?? process.env.GUGU_FLASH_OPERATOR_INVITE_SECRET ?? "";
  const identityTokenSecret = options.identityTokenSecret ?? process.env.GUGU_FLASH_IDENTITY_TOKEN_SECRET ?? "";
  const identityIssuer = options.identityIssuer ?? process.env.GUGU_FLASH_IDENTITY_ISSUER ?? DEFAULT_IDENTITY_ISSUER;
  const identityAudience = options.identityAudience ?? process.env.GUGU_FLASH_IDENTITY_AUDIENCE ?? DEFAULT_IDENTITY_AUDIENCE;
  const paymentCallbackSecret = options.paymentCallbackSecret ?? process.env.GUGU_FLASH_PAYMENT_CALLBACK_SECRET ?? DEFAULT_PAYMENT_CALLBACK_SECRET;
  const deploymentDataPath = options.dataPath ?? process.env.GUGU_FLASH_API_DATA ?? defaultDataPath;
  const deploymentStatePath = options.statePath ?? process.env.GUGU_FLASH_API_STATE ?? defaultStatePath;
  const startedAt = Date.now();
  const requestMetrics = {
    total: 0,
    byStatusClass: {},
    byStatusCode: {},
    byPath: {},
    lastRequestAt: null,
    lastRequestId: null,
    last5xxAt: null,
    last5xxPath: null,
    maxDurationMs: 0,
  };
  let runtimeStateLoaded = false;

  function recordRequestMetric({ pathname, statusCode, durationMs, requestId }) {
    requestMetrics.total += 1;
    const statusClass = `${Math.floor(statusCode / 100)}xx`;
    requestMetrics.byStatusClass[statusClass] = (requestMetrics.byStatusClass[statusClass] || 0) + 1;
    requestMetrics.byStatusCode[statusCode] = (requestMetrics.byStatusCode[statusCode] || 0) + 1;
    requestMetrics.byPath[pathname] = (requestMetrics.byPath[pathname] || 0) + 1;
    requestMetrics.lastRequestAt = Date.now();
    requestMetrics.lastRequestId = requestId;
    requestMetrics.maxDurationMs = Math.max(requestMetrics.maxDurationMs, durationMs);
    if (statusCode >= 500) {
      requestMetrics.last5xxAt = requestMetrics.lastRequestAt;
      requestMetrics.last5xxPath = pathname;
    }
  }

  function opsMetricsSnapshot() {
    const uptimeMs = Date.now() - startedAt;
    const runtimeState = api.exportRuntimeState ? api.exportRuntimeState() : {};
    const openQueueItems = [
      ...(runtimeState.reviewTasks || []),
      ...(runtimeState.reports || []),
      ...(runtimeState.rightsClaims || []),
      ...(runtimeState.appeals || []),
    ].filter((item) => !["resolved", "rejected", "closed", "cancelled"].includes(item.status));
    const queueAges = openQueueItems
      .map((item) => Date.now() - Number(item.createdAt || item.updatedAt || Date.now()))
      .filter((age) => Number.isFinite(age) && age >= 0);
    const frozenSettlements = (runtimeState.settlements || []).filter((item) => item.status === "frozen");
    const frozenAges = frozenSettlements
      .map((item) => Date.now() - Number(item.updatedAt || item.createdAt || Date.now()))
      .filter((age) => Number.isFinite(age) && age >= 0);
    const alertInputs = {
      fiveHundredCount: requestMetrics.byStatusClass["5xx"] || 0,
      authDeniedCount: (requestMetrics.byStatusCode[401] || 0) + (requestMetrics.byStatusCode[403] || 0),
      paymentCallbackFailureCount: (runtimeState.paymentCallbacks || []).filter((item) => (
        ["failed", "amount_mismatch", "order_not_found"].includes(item.result)
      )).length,
      refundMismatchCount: (runtimeState.refundCallbacks || []).filter((item) => (
        ["failed", "order_not_found"].includes(item.result)
      )).length,
      syncFailureCount: (runtimeState.deviceSyncJobs || []).filter((item) => (
        ["failed", "blocked", "rollback_required", "checksum_failed"].includes(item.status)
      )).length,
      reviewQueueOldestAgeMs: queueAges.length ? Math.max(...queueAges) : 0,
      frozenSettlementCount: frozenSettlements.length,
      frozenSettlementOldestAgeMs: frozenAges.length ? Math.max(...frozenAges) : 0,
      webSmokeFailure: false,
      last5xxAt: requestMetrics.last5xxAt,
      last5xxPath: requestMetrics.last5xxPath,
      maxDurationMs: requestMetrics.maxDurationMs,
    };
    const activeAlerts = evaluateMonitoringAlerts({ alertInputs });
    return {
      service: "gugu-flash-backend-alpha",
      status: "ok",
      uptimeMs,
      startedAt,
      runtimeStateLoaded,
      requests: structuredClone(requestMetrics),
      healthChecks: {
        api: "ok",
        persistence: "json_alpha",
        authMode: requireAuth ? "required" : "demo_open",
        demoAuth: allowDemoAuth ? "enabled" : "disabled",
        identityBridge: identityTokenSecret ? "enabled" : "disabled",
      },
      alertInputs: {
        ...alertInputs,
      },
      alerts: activeAlerts,
    };
  }

  function readinessSnapshot(requestId) {
    return {
      service: "gugu-flash-backend-alpha",
      status: runtimeStateLoaded ? "ready" : "starting",
      requestId,
      uptimeMs: Date.now() - startedAt,
      checks: {
        api: "ok",
        runtimeState: runtimeStateLoaded ? "ok" : "loading",
        persistence: "json_alpha",
        securityHeaders: "ok",
        requestMetrics: "ok",
      },
      deployment: {
        dataPath: deploymentDataPath,
        statePath: deploymentStatePath,
        corsOrigin: process.env.GUGU_FLASH_CORS_ORIGIN || "*",
        authMode: requireAuth ? "required" : "demo_open",
        demoAuth: allowDemoAuth ? "enabled" : "disabled",
        identityBridge: identityTokenSecret ? "enabled" : "disabled",
      },
    };
  }

  async function ensureRuntimeStateLoaded() {
    if (runtimeStateLoaded) return;
    api.importRuntimeState(await persistence.loadRuntimeState());
    runtimeStateLoaded = true;
  }

  async function sessionFromRequest(req) {
    const token = tokenFromRequest(req);
    if (!token || (allowDemoAuth && roleFromStaticToken(token))) return null;
    if (identityTokenSecret && token.includes(".")) {
      const identity = verifyIdentityToken(token, {
        secret: identityTokenSecret,
        issuer: identityIssuer,
        audience: identityAudience,
      });
      if (identity.valid) return identity.session;
      return null;
    }
    return persistence.sessions.getByToken(token);
  }

  async function persistRuntimeRecord(collectionName, repository, recordId) {
    if (!recordId || !repository?.save) return;
    const records = api.exportRuntimeState()?.[collectionName] || [];
    const record = records.find((item) => item.id === recordId);
    if (record) await repository.save(record);
  }

  async function persistCommentWrite(result, fallbackCommentId = null) {
    await persistRuntimeRecord("comments", persistence.comments, result?.comment?.id || result?.item?.id || fallbackCommentId);
    if (result?.item?.targetType === "Comment") {
      await persistRuntimeRecord("reports", persistence.reports, result.item.id);
    }
  }

  async function persistBlockWrite(result, fallbackBlockId = null) {
    await persistRuntimeRecord("blockRelations", persistence.blockRelations, result?.item?.id || fallbackBlockId);
  }

  async function persistProviderCallback(collectionName, repository, result) {
    await persistRuntimeRecord(collectionName, repository, result?.item?.id);
  }

  async function handle(req, res) {
    const requestUrl = new URL(req.url || "/", "http://127.0.0.1");
    const parts = splitPath(requestUrl.pathname);
    const requestId = requestIdFromRequest(req);
    const requestStartedAt = Date.now();
    res.setHeader("X-Gugu-Request-Id", requestId);
    res.setHeader("X-Gugu-Service", "gugu-flash-backend-alpha");
    res.once("finish", () => {
      recordRequestMetric({
        pathname: requestUrl.pathname,
        statusCode: res.statusCode,
        durationMs: Date.now() - requestStartedAt,
        requestId,
      });
    });

    if (req.method === "OPTIONS") {
      sendJson(res, 204, null);
      return;
    }

    try {
      await ensureRuntimeStateLoaded();
      res.once("finish", () => {
        if (res.statusCode < 500) {
          persistence.saveRuntimeState(api.exportRuntimeState()).catch(() => {});
        }
      });

      if (requestUrl.pathname === "/flash/health" && req.method === "GET") {
        ok(res, {
          status: "ok",
          service: "gugu-flash-backend-alpha",
          requestId,
          uptimeMs: Date.now() - startedAt,
        });
        return;
      }

      if (requestUrl.pathname === "/flash/ready" && req.method === "GET") {
        ok(res, readinessSnapshot(requestId));
        return;
      }

      const requestSession = await sessionFromRequest(req);
      const failure = authFailure(req, requestUrl.pathname, requireAuth, requestSession, { allowDemoAuth });
      if (failure === "auth_required") {
        unauthorized(res);
        return;
      }
      if (failure === "permission_denied") {
        forbidden(res);
        return;
      }

      if (requestUrl.pathname === "/flash/session" && req.method === "GET") {
        const staticRole = allowDemoAuth ? roleFromStaticToken(tokenFromRequest(req)) : null;
        ok(res, staticRole ? demoSession(staticRole) : sessionResponse(requestSession, { includeTokens: false }));
        return;
      }

      if (requestUrl.pathname === "/flash/auth/login" && req.method === "POST") {
        const body = await readJsonBody(req);
        const role = normalizeFlashRole(body.role || "creator");
        if (requiresOperatorInvite(role) && body.operatorInviteCode !== operatorInviteSecret) {
          forbidden(res, "operator_invite_required");
          return;
        }
        const session = await persistence.sessions.create({
          userId: body.userId || "user_local",
          role,
          displayName: body.displayName || body.username || "你",
        });
        ok(res, sessionResponse(session));
        return;
      }

      if (requestUrl.pathname === "/flash/auth/logout" && req.method === "POST") {
        const revoked = await persistence.sessions.revokeByToken(tokenFromRequest(req));
        ok(res, { item: revoked ? publicSession(revoked) : { status: "logged_out" } });
        return;
      }

      if (requestUrl.pathname === "/flash/auth/refresh" && req.method === "POST") {
        const refreshed = await persistence.sessions.refreshByToken(tokenFromRequest(req));
        if (!refreshed) {
          unauthorized(res, "session_expired_or_revoked");
          return;
        }
        ok(res, sessionResponse(refreshed));
        return;
      }

      if (requestUrl.pathname === "/flash/me" && req.method === "GET") {
        ok(res, await api.getProfile());
        return;
      }

      if (requestUrl.pathname === "/flash/me/works" && req.method === "GET") {
        const profile = await api.getProfile();
        ok(res, { items: profile.myWorks || [] });
        return;
      }

      if (requestUrl.pathname === "/flash/me/profile" && req.method === "PATCH") {
        const body = await readJsonBody(req);
        ok(res, {
          ...(await api.getProfile()),
          updatedProfile: body,
        });
        return;
      }

      if (requestUrl.pathname === "/flash/feed" && req.method === "GET") {
        ok(res, await api.getFeed());
        return;
      }

      if (parts[0] === "flash" && parts[1] === "works" && parts[2] && !parts[3] && req.method === "GET") {
        ok(res, await api.getWork(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "works" && parts[2] && !parts[3] && req.method === "PATCH") {
        const body = await readJsonBody(req);
        ok(res, await api.updateWork(decodePart(parts[2]), body.pack || body));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "works" && parts[2] && !parts[3] && req.method === "DELETE") {
        ok(res, await api.deleteWork(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "works" && parts[2] && parts[3] === "versions" && req.method === "GET") {
        const pack = await findPackForHttp(api, decodePart(parts[2]));
        ok(res, { items: pack?.workVersion ? [pack.workVersion] : [] });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "works" && parts[2] && parts[3] === "remix" && req.method === "POST") {
        ok(res, await api.remixWork(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "works" && parts[2] && parts[3] === "interactions" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.recordInteraction(decodePart(parts[2]), body.type));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "works" && parts[2] && parts[3] === "comments" && req.method === "GET") {
        ok(res, await api.getComments(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "works" && parts[2] && parts[3] === "comments" && req.method === "POST") {
        const body = await readJsonBody(req);
        const result = await api.postComment(decodePart(parts[2]), body.body || body.comment || "", body.options || {});
        await persistCommentWrite(result);
        ok(res, result);
        return;
      }

      if (parts[0] === "flash" && parts[1] === "comments" && parts[2] && !parts[3] && req.method === "DELETE") {
        const body = await readJsonBody(req);
        const commentId = decodePart(parts[2]);
        const result = await api.deleteComment(commentId, body.reason);
        await persistCommentWrite(result, commentId);
        ok(res, result);
        return;
      }

      if (parts[0] === "flash" && parts[1] === "comments" && parts[2] && parts[3] === "hide" && req.method === "POST") {
        const body = await readJsonBody(req);
        const commentId = decodePart(parts[2]);
        const result = await api.hideComment(commentId, body.reason);
        await persistCommentWrite(result, commentId);
        ok(res, result);
        return;
      }

      if (parts[0] === "flash" && parts[1] === "comments" && parts[2] && parts[3] === "report" && req.method === "POST") {
        const body = await readJsonBody(req);
        const commentId = decodePart(parts[2]);
        const result = await api.reportComment(commentId, body.reason, body.description);
        await persistCommentWrite(result, commentId);
        ok(res, result);
        return;
      }

      if (requestUrl.pathname === "/flash/blocks" && req.method === "POST") {
        const result = await api.blockUser(await readJsonBody(req));
        await persistBlockWrite(result);
        ok(res, result);
        return;
      }

      if (parts[0] === "flash" && parts[1] === "blocks" && parts[2] && req.method === "DELETE") {
        const blockId = decodePart(parts[2]);
        const result = await api.unblockUser(blockId);
        await persistBlockWrite(result, blockId);
        ok(res, result);
        return;
      }

      if (requestUrl.pathname === "/flash/me/blocks" && req.method === "GET") {
        ok(res, { items: await persistence.blockRelations.listForBlocker("user_local") });
        return;
      }

      if (requestUrl.pathname === "/flash/friends" && req.method === "GET") {
        ok(res, await api.getFriends());
        return;
      }

      if (requestUrl.pathname === "/flash/reports" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.submitReport(body));
        return;
      }

      if (requestUrl.pathname === "/flash/me/reports" && req.method === "GET") {
        ok(res, { items: await persistence.reports.listForReporter("user_local") });
        return;
      }

      if (requestUrl.pathname === "/flash/rights-claims" && req.method === "POST") {
        const body = await readJsonBody(req);
        const action = body.action || "freeze_store";
        if (body.preliminaryAction !== false && !validatePolicyAction(res, {
          collection: "governanceQueues",
          recordId: "rights_claim_governance",
          actionId: action,
          reason: body.summary || "权利投诉提交后先行处理。",
        })) return;
        ok(res, await api.submitRightsClaim(body));
        return;
      }

      if (requestUrl.pathname === "/flash/appeals" && req.method === "POST") {
        ok(res, await api.submitAppeal(await readJsonBody(req)));
        return;
      }

      if (requestUrl.pathname === "/flash/me/appeals" && req.method === "GET") {
        ok(res, { items: await persistence.appeals.listForAppellant("user_local") });
        return;
      }

      if (requestUrl.pathname === "/flash/story-projects" && req.method === "GET") {
        ok(res, { items: await persistence.storyProjects.list() });
        return;
      }

      if (requestUrl.pathname === "/flash/story-projects" && req.method === "POST") {
        const body = await readJsonBody(req);
        const project = normalizeStoryProjectForPersistence(storyProjectFromBody(body), {
          session: requestSession,
        });
        const errors = validateStoryProject(project);
        if (errors.length) {
          validationFailed(res, "story_project_invalid", errors);
          return;
        }
        await persistence.storyProjects.save(project);
        ok(res, { item: project });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "story-projects" && parts[2] && !parts[3] && req.method === "GET") {
        const project = await persistence.storyProjects.get(decodePart(parts[2]));
        if (!project) {
          notFound(res, "story_project_not_found");
          return;
        }
        ok(res, { item: project });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "story-projects" && parts[2] && !parts[3] && req.method === "PATCH") {
        const projectId = decodePart(parts[2]);
        const existing = await persistence.storyProjects.get(projectId);
        if (!existing) {
          notFound(res, "story_project_not_found");
          return;
        }
        const body = await readJsonBody(req);
        const project = normalizeStoryProjectForPersistence(storyProjectFromBody(body), {
          id: projectId,
          existing,
          session: requestSession,
        });
        const errors = validateStoryProject(project);
        if (errors.length) {
          validationFailed(res, "story_project_invalid", errors);
          return;
        }
        await persistence.storyProjects.save(project);
        ok(res, { item: project });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "story-projects" && parts[2] && parts[3] === "versions" && req.method === "GET") {
        ok(res, { items: await persistence.storyProjectVersions.listForProject(decodePart(parts[2])) });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "story-projects" && parts[2] && parts[3] === "assets" && req.method === "GET") {
        const project = await persistence.storyProjects.get(decodePart(parts[2]));
        if (!project) {
          notFound(res, "story_project_not_found");
          return;
        }
        ok(res, { items: Array.isArray(project.assets) ? project.assets : [] });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "story-projects" && parts[2] && parts[3] === "versions" && parts[4] && parts[5] === "restore" && req.method === "POST") {
        const projectId = decodePart(parts[2]);
        const versionId = decodePart(parts[4]);
        const body = await readJsonBody(req);
        const existing = await persistence.storyProjects.get(projectId);
        if (!existing) {
          notFound(res, "story_project_not_found");
          return;
        }
        const version = await persistence.storyProjectVersions.get(versionId);
        if (!version) {
          notFound(res, "story_project_version_not_found");
          return;
        }
        if (version.storyProjectId !== projectId) {
          badRequest(res, "story_project_version_mismatch");
          return;
        }
        const timestamp = Date.now();
        const restoredProject = normalizeStoryProjectForPersistence(version.projectSnapshot || {}, {
          id: projectId,
          existing,
          session: requestSession,
          timestamp,
        });
        const errors = validateStoryProject(restoredProject);
        if (errors.length) {
          validationFailed(res, "story_project_invalid", errors);
          return;
        }
        const restoreVersionId = prefixedId("spv");
        const restoredStatus = restoredProject.status === "published"
          ? "ready_to_preview"
          : restoredProject.status || "ready_to_preview";
        const savedProject = {
          ...restoredProject,
          status: restoredStatus,
          versionId: restoreVersionId,
          restoredFromVersionId: version.id,
          updatedAt: timestamp,
          ...(restoredProject.status === "published" ? {
            outputWorkId: null,
            publishedAt: null,
          } : {}),
        };
        const restoreVersion = createStoryProjectVersionSnapshot(savedProject, {
          id: restoreVersionId,
          status: "restored",
          label: body.label || `恢复：${version.label || version.id}`,
          reason: body.reason || `StoryProject restored from version ${version.id}.`,
          timestamp,
        });
        await persistence.storyProjectVersions.save(restoreVersion);
        await persistence.storyProjects.save(savedProject);
        ok(res, { item: savedProject, project: savedProject, version: restoreVersion, restoredFromVersion: version });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "story-projects" && parts[2] && parts[3] === "versions" && req.method === "POST") {
        const projectId = decodePart(parts[2]);
        const existing = await persistence.storyProjects.get(projectId);
        if (!existing) {
          notFound(res, "story_project_not_found");
          return;
        }
        const body = await readJsonBody(req);
        const timestamp = Date.now();
        const snapshotProject = body.project
          ? normalizeStoryProjectForPersistence(body.project, { id: projectId, existing, session: requestSession, timestamp })
          : normalizeStoryProjectForPersistence(existing, { id: projectId, existing, session: requestSession, timestamp });
        const errors = validateStoryProject(snapshotProject);
        if (errors.length) {
          validationFailed(res, "story_project_invalid", errors);
          return;
        }
        const version = createStoryProjectVersionSnapshot(snapshotProject, {
          status: body.status || "locked",
          label: body.label || "",
          reason: body.reason || "",
          timestamp,
        });
        const savedProject = {
          ...snapshotProject,
          versionId: version.id,
          updatedAt: timestamp,
        };
        await persistence.storyProjectVersions.save(version);
        await persistence.storyProjects.save(savedProject);
        ok(res, { item: version, project: savedProject });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "story-projects" && parts[2] && parts[3] === "compile" && parts[4] === "h5" && req.method === "POST") {
        const projectId = decodePart(parts[2]);
        const existing = await persistence.storyProjects.get(projectId);
        if (!existing) {
          notFound(res, "story_project_not_found");
          return;
        }
        const body = await readJsonBody(req);
        const timestamp = Date.now();
        const project = body.project
          ? normalizeStoryProjectForPersistence(body.project, { id: projectId, existing, session: requestSession, timestamp })
          : normalizeStoryProjectForPersistence(existing, { id: projectId, existing, session: requestSession, timestamp });
        const errors = validateStoryProject(project);
        if (errors.length) {
          validationFailed(res, "story_project_invalid", errors);
          return;
        }
        const packId = storyProjectPackIdFromRequest(project, body);
        const report = createStoryProjectPlayabilityReport(project, {
          packId,
          generatedAt: timestamp,
          timestamp,
        });
        if (report.errors.length) {
          validationFailed(res, "story_project_compile_failed", report.errors);
          return;
        }
        const pack = compileStoryProjectToH5Pack(project, {
          packId,
          status: "draft_h5",
          timestamp,
          throwOnInvalid: true,
        });
        const draft = createCompiledStoryDraft(project, pack, {
          draftId: body.draftId || prefixedId("draft"),
          report,
          timestamp,
        });
        ok(res, {
          item: draft,
          pack,
          h5Pack: pack,
          report,
        });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "story-projects" && parts[2] && parts[3] === "compile" && parts[4] === "comic" && req.method === "POST") {
        const projectId = decodePart(parts[2]);
        const existing = await persistence.storyProjects.get(projectId);
        if (!existing) {
          notFound(res, "story_project_not_found");
          return;
        }
        const body = await readJsonBody(req);
        const timestamp = Date.now();
        const project = body.project
          ? normalizeStoryProjectForPersistence(body.project, { id: projectId, existing, session: requestSession, timestamp })
          : normalizeStoryProjectForPersistence(existing, { id: projectId, existing, session: requestSession, timestamp });
        const errors = validateStoryProject(project);
        if (errors.length) {
          validationFailed(res, "story_project_invalid", errors);
          return;
        }
        let episode;
        try {
          episode = compileStoryProjectToComicEpisode(project, {
            episodeId: body.episodeId || body.comicEpisodeId,
            status: body.status || "draft_storyboard",
            timestamp,
            throwOnInvalid: true,
          });
        } catch (error) {
          validationFailed(res, "story_project_comic_compile_failed", String(error?.message || error).split("\n").filter(Boolean));
          return;
        }
        ok(res, {
          item: episode,
          episode,
          project,
        });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "story-projects" && parts[2] && parts[3] === "publish" && req.method === "POST") {
        const projectId = decodePart(parts[2]);
        const existing = await persistence.storyProjects.get(projectId);
        if (!existing) {
          notFound(res, "story_project_not_found");
          return;
        }
        const body = await readJsonBody(req);
        const timestamp = Date.now();
        const candidate = body.project
          ? normalizeStoryProjectForPersistence(body.project, { id: projectId, existing, session: requestSession, timestamp })
          : normalizeStoryProjectForPersistence(existing, { id: projectId, existing, session: requestSession, timestamp });
        const errors = validateStoryProject(candidate);
        if (errors.length) {
          validationFailed(res, "story_project_invalid", errors);
          return;
        }

        const versionId = prefixedId("spv");
        const packId = storyProjectPackIdFromRequest(candidate, body);
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
        const publishBlockers = storyProjectPublishBlockers(report);
        if (report.errors.length || publishBlockers.length) {
          sendJson(res, 400, {
            code: 400,
            message: "story_project_publish_blocked",
            data: {
              errors: [...report.errors, ...publishBlockers],
              report,
            },
          });
          return;
        }

        let pack;
        try {
          pack = compileStoryProjectToH5Pack(project, {
            packId,
            status: "public_h5",
            timestamp,
            throwOnInvalid: true,
          });
        } catch (error) {
          validationFailed(res, "story_project_compile_failed", [error.message || String(error)]);
          return;
        }

        const published = await api.publishDraft({
          ...pack,
          sourceDraftId: storyProjectDraftIdFromRequest(project, body),
        });
        const publishedWork = published.item;
        const savedProject = {
          ...project,
          outputWorkId: publishedWork.id,
          publishedAt: project.publishedAt || timestamp,
          updatedAt: timestamp,
        };
        const version = createStoryProjectVersionSnapshot(savedProject, {
          id: versionId,
          status: "published",
          label: body.label || "Published H5",
          reason: body.reason || "StoryProject published as H5 Work.",
          timestamp,
        });
        await persistence.storyProjectVersions.save(version);
        await persistence.storyProjects.save(savedProject);
        ok(res, {
          item: publishedWork,
          project: savedProject,
          version,
          report,
        });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "ai" && parts[2] === "story-projects" && parts[3] && parts[4] === "jobs" && req.method === "POST") {
        const projectId = decodePart(parts[3]);
        const project = await persistence.storyProjects.get(projectId);
        if (!project) {
          notFound(res, "story_project_not_found");
          return;
        }
        const body = await readJsonBody(req);
        const timestamp = Date.now();
        let inputSnapshot = null;
        let inputSnapshotId = body.inputSnapshotId || project.versionId || null;
        if (!inputSnapshotId) {
          inputSnapshot = createStoryProjectVersionSnapshot(project, {
            status: "draft",
            label: "AI job input",
            reason: body.stage || body.prompt || "",
            timestamp,
          });
          inputSnapshotId = inputSnapshot.id;
          await persistence.storyProjectVersions.save(inputSnapshot);
        }
        const job = {
          id: body.id || prefixedId("ai_job"),
          storyProjectId: project.id,
          stage: body.stage || body.kind || "story_project_generation",
          status: body.status || "queued",
          inputSnapshotId,
          outputSnapshotId: body.outputSnapshotId || null,
          prompt: body.prompt || body.instruction || "",
          request: structuredClone(body),
          result: body.result || null,
          errors: Array.isArray(body.errors) ? body.errors : [],
          authorUserId: project.authorUserId || project.author?.id || "user_local",
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        await persistence.aiGenerationJobs.save(job);
        ok(res, { item: job, inputSnapshot });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "ai" && parts[2] === "jobs" && parts[3] && !parts[4] && req.method === "GET") {
        const job = await persistence.aiGenerationJobs.get(decodePart(parts[3]));
        if (!job) {
          notFound(res, "ai_job_not_found");
          return;
        }
        ok(res, { item: job });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "ai" && parts[2] === "jobs" && parts[3] && parts[4] === "apply" && req.method === "POST") {
        const jobId = decodePart(parts[3]);
        const job = await persistence.aiGenerationJobs.get(jobId);
        if (!job) {
          notFound(res, "ai_job_not_found");
          return;
        }
        const existing = job.storyProjectId
          ? await persistence.storyProjects.get(job.storyProjectId)
          : null;
        if (!existing) {
          notFound(res, "story_project_not_found");
          return;
        }
        const body = await readJsonBody(req);
        const outputProject = body.project || job.result?.project;
        if (!outputProject) {
          badRequest(res, "ai_job_output_project_missing");
          return;
        }
        const timestamp = Date.now();
        const project = normalizeStoryProjectForPersistence(outputProject, {
          id: existing.id,
          existing,
          session: requestSession,
          timestamp,
        });
        const errors = validateStoryProject(project);
        if (errors.length) {
          validationFailed(res, "story_project_invalid", errors);
          return;
        }
        const versionId = prefixedId("spv");
        const savedProject = {
          ...project,
          versionId,
          updatedAt: timestamp,
        };
        const version = createStoryProjectVersionSnapshot(savedProject, {
          id: versionId,
          status: body.versionStatus || "locked",
          label: body.label || "AI job output",
          reason: body.reason || job.prompt || job.stage || "",
          timestamp,
        });
        const updatedJob = {
          ...job,
          status: "applied",
          outputSnapshotId: version.id,
          appliedAt: timestamp,
          updatedAt: timestamp,
          result: {
            ...(job.result || {}),
            project: structuredClone(savedProject),
          },
        };
        await persistence.storyProjectVersions.save(version);
        await persistence.storyProjects.save(savedProject);
        await persistence.aiGenerationJobs.save(updatedJob);
        ok(res, { item: savedProject, job: updatedJob, version });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "ai" && parts[2] === "jobs" && parts[3] && parts[4] === "discard" && req.method === "POST") {
        const jobId = decodePart(parts[3]);
        const job = await persistence.aiGenerationJobs.get(jobId);
        if (!job) {
          notFound(res, "ai_job_not_found");
          return;
        }
        const updated = {
          ...job,
          status: "canceled",
          discardedAt: Date.now(),
          updatedAt: Date.now(),
        };
        await persistence.aiGenerationJobs.save(updated);
        ok(res, { item: updated });
        return;
      }

      if (requestUrl.pathname === "/flash/ai/create-draft" && req.method === "POST") {
        const body = await readJsonBody(req);
        const response = await createAiDraftFromPrompt(body.prompt || "", body.template || "healing", body.options || {});
        if (response.storyProject) {
          const timestamp = Date.now();
          const project = normalizeStoryProjectForPersistence(response.storyProject, {
            session: requestSession,
            timestamp,
          });
          const errors = validateStoryProject(project);
          if (errors.length) {
            validationFailed(res, "story_project_invalid", errors);
            return;
          }
          await persistence.storyProjects.save(project);
          response.storyProject = project;
          if (response.item) {
            response.item.sourceProjectId = project.id;
            response.item.storyProjectId = project.id;
          }
        }
        ok(res, response);
        return;
      }

      if (requestUrl.pathname === "/flash/ai/edit-proposals" && req.method === "POST") {
        const body = await readJsonBody(req);
        const proposal = createAiEditProposalPreview(
          body.draft || {},
          body.instruction || "",
          body.scope || { type: "work", ids: [] },
        );
        proposal.qualityChecks = createDraftQualityChecks(proposal.previewDraft);
        ok(res, { item: proposal });
        return;
      }

      if (requestUrl.pathname === "/flash/ai/generate-image" && req.method === "POST") {
        ok(res, await generateAiImage(await readJsonBody(req)));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "ai" && parts[2] === "generated-images" && parts[3] && req.method === "GET") {
        const image = getGeneratedAiImage(decodePart(parts[3]));
        if (!image) {
          notFound(res, "image_not_found");
          return;
        }
        res.writeHead(200, {
          ...flashSecurityHeaders(),
          "Access-Control-Allow-Origin": process.env.GUGU_FLASH_CORS_ORIGIN || "*",
          "Cache-Control": "no-store",
          "Content-Type": image.contentType,
        });
        res.end(image.body);
        return;
      }

      if (requestUrl.pathname === "/flash/drafts" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.createDraft(body.prompt || "", body.template || "gentle", body.options || {}));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "drafts" && parts[2] && !parts[3] && req.method === "GET") {
        ok(res, alphaStub(decodePart(parts[2]), { targetType: "WorkDraft" }));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "drafts" && parts[2] && !parts[3] && req.method === "PATCH") {
        const body = await readJsonBody(req);
        ok(res, { item: { ...body, id: decodePart(parts[2]), status: body.status || "draft" } });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "drafts" && parts[2] && parts[3] === "save-edit" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, { item: { ...body, id: decodePart(parts[2]), status: "draft_saved" } });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "drafts" && parts[2] && parts[3] === "publish" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.publishDraft(body.pack || body));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "drafts" && parts[2] && parts[3] === "publish-update" && req.method === "POST") {
        const body = await readJsonBody(req);
        const published = await api.publishDraft(body.pack || body);
        ok(res, { item: published.item?.workVersion || null, work: published.item || null });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "drafts" && parts[2] && parts[3] === "validate" && req.method === "POST") {
        const body = await readJsonBody(req);
        const draft = body.pack || body.draft || body;
        const qualityChecks = createDraftQualityChecks(draft);
        const checklist = createPublishChecklist(draft, { qualityChecks, target: "h5" });
        ok(res, {
          item: {
            id: `review_draft_${decodePart(parts[2])}`,
            targetType: "WorkDraft",
            targetId: decodePart(parts[2]),
            reviewType: "draft_validation",
            status: checklist.status === "blocked" ? "failed" : "passed",
            checks: checklist.checks,
            checklist,
          },
        });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "drafts" && parts[2] && parts[3] === "preview" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, { item: { ...body, id: decodePart(parts[2]), status: "preview" } });
        return;
      }

      if (requestUrl.pathname === "/flash/assets" && req.method === "GET") {
        ok(res, {
          items: [],
          filters: {
            storyProjectId: requestUrl.searchParams.get("storyProjectId") || null,
            usage: requestUrl.searchParams.get("usage") || null,
            kind: requestUrl.searchParams.get("kind") || null,
            status: requestUrl.searchParams.get("status") || null,
            panelId: requestUrl.searchParams.get("panelId") || null,
          },
        });
        return;
      }

      if (requestUrl.pathname === "/flash/assets" && req.method === "POST") {
        const body = await readJsonBody(req);
        const securityReport = createAssetSecurityReport(body);
        if (securityReport.errors.length) {
          badRequest(res, "asset_security_violation");
          return;
        }
        ok(res, alphaStub(`asset_${Date.now()}`, {
          targetType: "Asset",
          status: "pending_review",
          securityPolicyVersion: ASSET_SECURITY_POLICY_VERSION,
          securityReport,
          ...body,
        }));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "assets" && parts[2] && !parts[3] && req.method === "GET") {
        ok(res, alphaStub(decodePart(parts[2]), {
          targetType: "Asset",
          securityPolicyVersion: ASSET_SECURITY_POLICY_VERSION,
        }));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "assets" && parts[2] && parts[3] === "source-statement" && req.method === "PATCH") {
        const body = await readJsonBody(req);
        const errors = validateAssetSourceStatement(body);
        if (errors.length) {
          badRequest(res, "asset_source_statement_invalid");
          return;
        }
        ok(res, alphaStub(decodePart(parts[2]), {
          targetType: "Asset",
          securityPolicyVersion: ASSET_SECURITY_POLICY_VERSION,
          sourceStatement: body,
          sourceStatementStatus: "accepted",
        }));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "assets" && parts[2] && parts[3] === "submit-review" && req.method === "POST") {
        ok(res, alphaStub(`review_asset_${decodePart(parts[2])}`, {
          targetType: "Asset",
          targetId: decodePart(parts[2]),
          reviewType: "asset_safety",
          securityPolicyVersion: ASSET_SECURITY_POLICY_VERSION,
          requiredChecks: ["malware_scan", "content_type_validation", "source_statement", "storage_isolation"],
        }));
        return;
      }

      if (requestUrl.pathname === "/flash/ips" && req.method === "GET") {
        ok(res, await api.getIpPool({ query: requestUrl.searchParams.get("query") || "" }));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "ips" && parts[2] && !parts[3] && req.method === "GET") {
        ok(res, await api.getIpDetail(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "ips" && parts[2] && parts[3] === "zone-eligibility" && req.method === "GET") {
        ok(res, await api.getIpZoneEligibility(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "ips" && parts[2] && parts[3] === "personas" && req.method === "GET") {
        const detail = await api.getIpDetail(decodePart(parts[2]));
        ok(res, { items: detail.item?.personas || [] });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "ips" && parts[2] && parts[3] === "personas" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, alphaStub(`review_persona_${Date.now()}`, { targetType: "Persona", ipId: decodePart(parts[2]), request: body }));
        return;
      }

      if (requestUrl.pathname === "/flash/zone-applications" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.applyZoneApplication(body.ipId, body.reason));
        return;
      }

      if (requestUrl.pathname === "/flash/ip-applications" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.applyIpEntry(body.name, body.description));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "zones" && parts[2] && req.method === "GET") {
        const pool = await api.getIpPool();
        const zoneId = decodePart(parts[2]);
        const zone = pool.items.map((item) => item.zone).find((item) => item?.id === zoneId) || null;
        ok(res, { item: zone });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "zones" && parts[2] && req.method === "PATCH") {
        const body = await readJsonBody(req);
        ok(res, { item: { ...body, id: decodePart(parts[2]), status: body.status || "open" } });
        return;
      }

      if (requestUrl.pathname === "/flash/operator/anime-ip-candidates" && req.method === "GET") {
        ok(res, await api.searchAnimeIpCandidates({
          query: requestUrl.searchParams.get("query") || "",
          limit: requestUrl.searchParams.get("limit") || undefined,
          includeExisting: requestUrl.searchParams.get("includeExisting") === "true",
          sweepAll: requestUrl.searchParams.get("sweepAll") === "true",
          online: requestUrl.searchParams.get("online") === "true" || requestUrl.searchParams.get("liveWeb") === "true",
        }));
        return;
      }

      if (requestUrl.pathname === "/flash/operator/anime-ip-collection" && req.method === "POST") {
        ok(res, await api.collectAnimeIpPool(await readJsonBody(req)));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "anime-ip-characters" && parts[3] && !parts[4] && req.method === "GET") {
        ok(res, await api.searchAnimeIpCharacters(decodePart(parts[3]), {
          limit: requestUrl.searchParams.get("limit") || "all",
        }));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "anime-ip-characters" && parts[3] && parts[4] === "collect" && req.method === "POST") {
        ok(res, await api.collectAnimeIpCharacters(decodePart(parts[3]), await readJsonBody(req)));
        return;
      }

      if (requestUrl.pathname === "/flash/device/dashboard" && req.method === "GET") {
        ok(res, await api.getDeviceDashboard());
        return;
      }

      if (requestUrl.pathname === "/flash/store" && req.method === "GET") {
        const dashboard = await api.getDeviceDashboard();
        ok(res, { items: dashboard.library, device: dashboard.device, activeDeviceId: dashboard.activeDeviceId });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "store-listings" && parts[2] && req.method === "GET") {
        const pack = await findPackForHttp(api, decodePart(parts[2]));
        ok(res, { item: pack?.storeListing || null });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "hardware-packs" && parts[2] && !parts[3] && req.method === "GET") {
        const pack = await findPackForHttp(api, decodePart(parts[2]));
        ok(res, { item: pack?.hardwarePack || null, work: pack || null });
        return;
      }

      if (requestUrl.pathname === "/flash/devices" && req.method === "GET") {
        const dashboard = await api.getDeviceDashboard();
        ok(res, { items: dashboard.devices || [] });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "devices" && parts[2] === "bind" && req.method === "POST") {
        ok(res, await api.bindDevice(await readJsonBody(req)));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "devices" && parts[2] && parts[3] === "select" && req.method === "POST") {
        ok(res, await api.selectDevice(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "devices" && parts[2] && parts[3] === "unbind" && req.method === "POST") {
        ok(res, await api.unbindDevice(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "devices" && parts[2] && parts[3] === "sync-jobs" && req.method === "GET") {
        ok(res, { items: await persistence.deviceSyncJobs.listForDevice(decodePart(parts[2])) });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "devices" && parts[2] && parts[3] === "entitlements" && req.method === "GET") {
        ok(res, { items: await persistence.deviceEntitlements.listForDevice(decodePart(parts[2])) });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "devices" && parts[2] && parts[3] === "installs" && req.method === "GET") {
        ok(res, { items: await persistence.deviceInstalls.listForDevice(decodePart(parts[2])) });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "devices" && parts[2] && parts[3] === "sync" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.syncBadgePack(body.storeId || body.hardwarePackId || body.id, body.options || body));
        return;
      }

      if (requestUrl.pathname === "/flash/store-listings" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.applyStoreListing(body.workId || body.packId || body.id, Boolean(body.rightsAccepted)));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "dashboard" && req.method === "GET") {
        ok(res, await api.getOperatorDashboard());
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "ops-metrics" && req.method === "GET") {
        ok(res, opsMetricsSnapshot());
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "support-diagnostics" && req.method === "GET") {
        ok(res, createSupportDiagnosticBundle({
          runtimeState: api.exportRuntimeState ? api.exportRuntimeState() : {},
          query: Object.fromEntries(requestUrl.searchParams.entries()),
          requestId,
        }));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "review-sla" && req.method === "GET") {
        ok(res, evaluateReviewSla({
          dashboard: await api.getOperatorDashboard(),
          runtimeState: api.exportRuntimeState ? api.exportRuntimeState() : {},
          requestId,
        }));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "trending" && req.method === "GET") {
        ok(res, await api.getOperatorTrending());
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "operation-logs" && req.method === "GET") {
        ok(res, { items: await persistence.operationLogs.list() });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "review-tasks" && !parts[3] && req.method === "GET") {
        ok(res, await getOperatorDashboardField(api, "reviewTasks"));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "review-tasks" && parts[3] && parts[4] === "approve" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.approveReviewTask(decodePart(parts[3]), body.reason));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "review-tasks" && parts[3] && parts[4] === "reject" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.rejectReviewTask(decodePart(parts[3]), body.reason));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "reports" && !parts[3] && req.method === "GET") {
        ok(res, { items: await persistence.reports.list() });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "reports" && parts[3] && parts[4] === "resolve" && req.method === "POST") {
        const body = await readJsonBody(req);
        const action = body.action || "limit_recommend";
        if (!validatePolicyAction(res, {
          collection: "governanceQueues",
          recordId: "comment_report_governance",
          actionId: action,
          reason: body.reason,
        })) return;
        ok(res, await api.resolveReport(decodePart(parts[3]), action, body.reason));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "rights-claims" && !parts[3] && req.method === "GET") {
        ok(res, { items: await persistence.rightsClaims.list() });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "rights-claims" && parts[3] && parts[4] === "resolve" && req.method === "POST") {
        const body = await readJsonBody(req);
        const result = body.result || "close";
        if (!validatePolicyAction(res, {
          collection: "governanceQueues",
          recordId: "rights_claim_governance",
          actionId: result,
          reason: body.reason,
        })) return;
        ok(res, await api.resolveRightsClaim(decodePart(parts[3]), result, body.reason));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "appeals" && !parts[3] && req.method === "GET") {
        ok(res, { items: await persistence.appeals.list() });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "appeals" && parts[3] && parts[4] === "resolve" && req.method === "POST") {
        const body = await readJsonBody(req);
        const result = body.result || "restore";
        if (!validatePolicyAction(res, {
          collection: "governanceQueues",
          recordId: "appeal_review",
          actionId: result,
          reason: body.reason,
        })) return;
        ok(res, await api.resolveAppeal(decodePart(parts[3]), result, body.reason));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "moderation-actions" && req.method === "GET") {
        ok(res, { items: await persistence.moderationActions.list() });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "payment-callbacks" && req.method === "POST") {
        const body = await readJsonBody(req);
        const signature = normalizeHeaderValue(req.headers["x-gugu-payment-signature"]) || body.signature;
        if (!verifyPaymentCallbackSignature(body, signature, paymentCallbackSecret)) {
          badRequest(res, "invalid_payment_signature");
          return;
        }
        const result = await api.processPaymentCallback({ ...body, signatureVerified: true });
        await persistProviderCallback("paymentCallbacks", persistence.paymentCallbacks, result);
        ok(res, result);
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "refund-callbacks" && req.method === "POST") {
        const result = await api.processRefundCallback(await readJsonBody(req));
        await persistProviderCallback("refundCallbacks", persistence.refundCallbacks, result);
        ok(res, result);
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "settlements" && !parts[3] && req.method === "GET") {
        ok(res, await api.getSettlements());
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "settlements" && parts[3] && parts[4] === "release" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.releaseSettlement(decodePart(parts[3]), body.reason));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "store-listings" && parts[3] && parts[4] === "advance" && req.method === "POST") {
        ok(res, await api.approveStoreListing(decodePart(parts[3])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "store-listings" && !parts[3] && req.method === "GET") {
        ok(res, await getOperatorDashboardField(api, "storeListings"));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "store-listings" && parts[3] && parts[4] === "reject" && req.method === "POST") {
        const body = await readJsonBody(req);
        if (!validatePolicyAction(res, {
          collection: "reviewLayers",
          recordId: "store_listing_review",
          actionId: "reject",
          reason: body.reason,
        })) return;
        ok(res, await api.rejectStoreListing(decodePart(parts[3]), body.reason));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "store-listings" && parts[3] && parts[4] === "delist" && req.method === "POST") {
        const body = await readJsonBody(req);
        if (!validatePolicyAction(res, {
          collection: "reviewLayers",
          recordId: "store_listing_review",
          actionId: "delist",
          reason: body.reason,
        })) return;
        ok(res, await api.delistStoreListing(decodePart(parts[3]), body.reason));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "store-listings" && parts[3] && parts[4] === "freeze" && req.method === "POST") {
        const body = await readJsonBody(req);
        if (!validatePolicyAction(res, {
          collection: "reviewLayers",
          recordId: "store_listing_review",
          actionId: "freeze_store",
          reason: body.reason,
        })) return;
        ok(res, await api.freezeStoreListing(decodePart(parts[3]), body.reason));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "hardware-packs" && parts[2] && parts[3] === "compatibility-report" && req.method === "GET") {
        ok(res, await api.getCompatibilityReport(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "hardware-packs" && parts[3] && parts[4] === "mark-candidate" && req.method === "POST") {
        ok(res, await api.markHardwareCandidate(decodePart(parts[3])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "hardware-packs" && !parts[3] && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, alphaStub(body.id || `hw_${Date.now()}`, { targetType: "HardwarePack", ...body }));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "hardware-packs" && parts[3] && parts[4] === "mark-ready" && req.method === "POST") {
        ok(res, await api.markHardwareReady(decodePart(parts[3])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "hardware-packs" && parts[3] && parts[4] === "approve" && req.method === "POST") {
        ok(res, await api.markHardwareReady(decodePart(parts[3])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "hardware-packs" && parts[3] && parts[4] === "publish" && req.method === "POST") {
        ok(res, await api.markHardwareReady(decodePart(parts[3])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "operator" && parts[2] === "hardware-packs" && parts[3] && parts[4] === "export-to-hardware-studio" && req.method === "POST") {
        const hardwarePackId = decodePart(parts[3]);
        const pack = await findPackForHttp(api, hardwarePackId);
        if (!pack) {
          ok(res, { item: null, blocked: true, reason: "hardware_pack_not_found" });
          return;
        }
        const compatibility = await api.getCompatibilityReport(hardwarePackId);
        const bundle = createHardwareStudioExportBundle(pack, {
          compatibilityReport: compatibility.item || pack.compatibilityReport,
          hardwarePack: pack.hardwarePack,
          generatedAt: compatibility.item?.updatedAt || pack.updatedAt,
        });
        ok(res, {
          item: bundle,
          compatibilityReport: bundle.compatibilityReport,
          hardwarePack: bundle.hardwarePack,
          payload: bundle.payload,
        });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "hardware-packs" && parts[2] && parts[3] === "purchase" && req.method === "POST") {
        const storeId = await storeIdForHardwareIdentifier(api, decodePart(parts[2]));
        ok(res, await api.purchaseBadgePack(storeId));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "hardware-packs" && parts[2] && parts[3] === "download" && req.method === "POST") {
        const storeId = await storeIdForHardwareIdentifier(api, decodePart(parts[2]));
        ok(res, await api.downloadBadgePack(storeId));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "hardware-packs" && parts[2] && parts[3] === "sync" && req.method === "POST") {
        const body = await readJsonBody(req);
        const storeId = await storeIdForHardwareIdentifier(api, decodePart(parts[2]));
        ok(res, await api.syncBadgePack(storeId, body.options || body));
        return;
      }

      if (requestUrl.pathname === "/flash/orders" && req.method === "GET") {
        ok(res, { items: await persistence.orders.list() });
        return;
      }

      if (requestUrl.pathname === "/flash/orders" && req.method === "POST") {
        const body = await readJsonBody(req);
        ok(res, await api.createOrder(body.storeId || body.hardwarePackId));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "orders" && parts[2] && parts[3] === "pay" && req.method === "POST") {
        ok(res, await api.payOrder(decodePart(parts[2])));
        return;
      }

      if (parts[0] === "flash" && parts[1] === "orders" && parts[2] && !parts[3] && req.method === "GET") {
        ok(res, { item: await persistence.orders.get(decodePart(parts[2])) });
        return;
      }

      if (parts[0] === "flash" && parts[1] === "orders" && parts[2] && parts[3] === "refund" && req.method === "POST") {
        ok(res, await api.refundOrder(decodePart(parts[2]), await readJsonBody(req)));
        return;
      }

      notFound(res);
    } catch (error) {
      if (error instanceof PayloadTooLargeError) {
        payloadTooLarge(res);
        return;
      }
      if (error instanceof SyntaxError) {
        badRequest(res, "invalid_json");
        return;
      }
      sendJson(res, 500, {
        code: 500,
        message: error?.message || "internal_error",
        data: null,
      });
    }
  }

  return { api, handle };
}

export function createFlashHttpServer(options = {}) {
  const app = createFlashBackendApp(options);
  const server = createServer(app.handle);
  return { ...app, server };
}
