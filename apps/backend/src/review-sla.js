export const REVIEW_SLA_VERSION = "gugu_flash_review_sla_v1";

export const REVIEW_SLA_QUEUE_TARGETS = {
  h5_publish_review: {
    label: "H5 publish review",
    primaryOwner: "Trust Lead",
    backupOwner: "Operator Lead",
    escalationOwner: "Trust Lead",
    slaHours: 24,
    requiresSecondReviewer: false,
  },
  store_listing_review: {
    label: "Store listing review",
    primaryOwner: "Commerce Lead",
    backupOwner: "Trust Lead",
    escalationOwner: "Commerce Lead",
    slaHours: 48,
    requiresSecondReviewer: false,
  },
  hardware_adaptation_review: {
    label: "Hardware adaptation review",
    primaryOwner: "Hardware Lead",
    backupOwner: "Operator Lead",
    escalationOwner: "Hardware Lead",
    slaHours: 72,
    requiresSecondReviewer: false,
  },
  comment_report_governance: {
    label: "Comment/report governance",
    primaryOwner: "Trust Lead",
    backupOwner: "Operator Lead",
    escalationOwner: "Trust Lead",
    slaHours: 24,
    requiresSecondReviewer: false,
  },
  rights_claim_governance: {
    label: "Rights claim governance",
    primaryOwner: "Trust Lead",
    backupOwner: "Commerce Lead",
    escalationOwner: "Trust Lead",
    slaHours: 72,
    requiresSecondReviewer: false,
  },
  appeal_review: {
    label: "Appeal review",
    primaryOwner: "Trust Lead",
    backupOwner: "Product Owner",
    escalationOwner: "Product Owner",
    slaHours: 72,
    requiresSecondReviewer: true,
  },
};

const CLOSED_STATUSES = new Set(["resolved", "rejected", "closed", "restored", "cancelled", "listed"]);
const STORE_PENDING_STATUSES = new Set(["rights_review", "production_queued", "producing", "pack_review"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function timestamp(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function queueIdForReviewTask(task = {}) {
  if (task.reviewType === "store_rights" || task.targetType === "StoreListing") return "store_listing_review";
  if (task.reviewType === "hardware_pack_review" || task.targetType === "HardwarePack") return "hardware_adaptation_review";
  return "h5_publish_review";
}

function queueIdForStoreListing(listing = {}) {
  if (["production_queued", "producing", "pack_review"].includes(listing.status)) return "hardware_adaptation_review";
  return "store_listing_review";
}

function queueIdForGovernanceCase(item = {}) {
  if (item.caseType === "rights_claim") return "rights_claim_governance";
  if (item.caseType === "appeal") return "appeal_review";
  return "comment_report_governance";
}

function normalizeQueueItems({ dashboard = {}, runtimeState = {}, now = Date.now() } = {}) {
  const reviewTasks = asArray(dashboard.reviewTasks)
    .filter((item) => !CLOSED_STATUSES.has(item.status))
    .map((item) => ({
      queueId: queueIdForReviewTask(item),
      source: "review_task",
      id: item.id,
      targetType: item.targetType,
      targetId: item.targetId || item.packId,
      title: item.title,
      status: item.status,
      riskLevel: item.riskLevel || "medium",
      createdAt: timestamp(item.createdAt, now),
      assignedReviewerId: item.assignedReviewerId || null,
      sourceOperatorId: item.sourceOperatorId || null,
    }));
  const storeListings = asArray(dashboard.storeListings)
    .filter((item) => STORE_PENDING_STATUSES.has(item.status))
    .map((item) => ({
      queueId: queueIdForStoreListing(item),
      source: "store_listing",
      id: item.id,
      targetType: "StoreListing",
      targetId: item.id,
      title: item.title,
      status: item.status,
      riskLevel: item.status === "rights_review" ? "medium" : "low",
      createdAt: timestamp(item.updatedAt, now),
      assignedReviewerId: item.assignedReviewerId || null,
      sourceOperatorId: item.sourceOperatorId || null,
    }));
  const governanceCases = asArray(dashboard.governanceCases)
    .filter((item) => !CLOSED_STATUSES.has(item.status))
    .map((item) => ({
      queueId: queueIdForGovernanceCase(item),
      source: "governance_case",
      id: item.id,
      targetType: item.targetType,
      targetId: item.targetId,
      title: item.title,
      status: item.status,
      riskLevel: item.caseType === "rights_claim" ? "high" : (item.caseType === "appeal" ? "medium" : "medium"),
      createdAt: timestamp(item.createdAt, now),
      assignedReviewerId: item.assignedReviewerId || null,
      sourceOperatorId: item.sourceOperatorId || item.originalOperatorId || null,
    }));
  const frozenSettlements = asArray(dashboard.settlements || runtimeState.settlements)
    .filter((item) => item.status === "frozen")
    .map((item) => ({
      queueId: "rights_claim_governance",
      source: "frozen_settlement",
      id: item.id,
      targetType: "Settlement",
      targetId: item.id,
      title: item.hardwarePackTitle || item.id,
      status: item.status,
      riskLevel: "high",
      createdAt: timestamp(item.updatedAt || item.createdAt, now),
      assignedReviewerId: null,
      sourceOperatorId: null,
    }));

  return [...reviewTasks, ...storeListings, ...governanceCases, ...frozenSettlements];
}

function severityForItem(ageMs, targetMs, riskLevel) {
  if (ageMs >= targetMs * 2 || riskLevel === "blocked") return "S0";
  if (ageMs >= targetMs || riskLevel === "high") return "S1";
  if (ageMs >= targetMs * 0.75) return "S2";
  return "S3";
}

function evaluateItem(item, now) {
  const target = REVIEW_SLA_QUEUE_TARGETS[item.queueId] || REVIEW_SLA_QUEUE_TARGETS.h5_publish_review;
  const targetMs = target.slaHours * 60 * 60 * 1000;
  const ageMs = Math.max(0, now - timestamp(item.createdAt, now));
  const remainingMs = Math.max(0, targetMs - ageMs);
  const breached = ageMs >= targetMs;
  const urgent = ageMs >= targetMs * 0.75;
  const secondReviewerConflict = target.requiresSecondReviewer
    && hasValue(item.assignedReviewerId)
    && item.assignedReviewerId === item.sourceOperatorId;

  return {
    ...item,
    queueLabel: target.label,
    primaryOwner: target.primaryOwner,
    backupOwner: target.backupOwner,
    escalationOwner: target.escalationOwner,
    slaHours: target.slaHours,
    ageMs,
    remainingMs,
    breached,
    urgent,
    severity: severityForItem(ageMs, targetMs, item.riskLevel),
    escalationRequired: breached || secondReviewerConflict,
    requiresSecondReviewer: target.requiresSecondReviewer,
    secondReviewerConflict,
  };
}

function summarize(items) {
  const byQueue = {};
  for (const item of items) {
    byQueue[item.queueId] = byQueue[item.queueId] || {
      queueId: item.queueId,
      queueLabel: item.queueLabel,
      open: 0,
      breached: 0,
      urgent: 0,
      oldestAgeMs: 0,
      escalationOwner: item.escalationOwner,
    };
    byQueue[item.queueId].open += 1;
    if (item.breached) byQueue[item.queueId].breached += 1;
    if (item.urgent) byQueue[item.queueId].urgent += 1;
    byQueue[item.queueId].oldestAgeMs = Math.max(byQueue[item.queueId].oldestAgeMs, item.ageMs);
  }
  const oldest = items.reduce((winner, item) => (item.ageMs > (winner?.ageMs || -1) ? item : winner), null);
  return {
    totalOpen: items.length,
    breached: items.filter((item) => item.breached).length,
    urgent: items.filter((item) => item.urgent).length,
    secondReviewerConflicts: items.filter((item) => item.secondReviewerConflict).length,
    oldestItemId: oldest?.id || null,
    oldestQueueId: oldest?.queueId || null,
    oldestAgeMs: oldest?.ageMs || 0,
    byQueue: Object.values(byQueue).sort((left, right) => left.queueId.localeCompare(right.queueId)),
  };
}

export function evaluateReviewSla({ dashboard = {}, runtimeState = {}, requestId = "", now = Date.now() } = {}) {
  const items = normalizeQueueItems({ dashboard, runtimeState, now })
    .map((item) => evaluateItem(item, now))
    .sort((left, right) => {
      if (left.escalationRequired !== right.escalationRequired) return left.escalationRequired ? -1 : 1;
      return right.ageMs - left.ageMs;
    });

  return {
    schemaVersion: REVIEW_SLA_VERSION,
    generatedAt: now,
    requestId,
    summary: summarize(items),
    queues: Object.values(REVIEW_SLA_QUEUE_TARGETS),
    items,
    dailyReviewChecklist: [
      "review_tasks",
      "open_reports",
      "open_rights_claims",
      "open_appeals",
      "frozen_settlements",
      "operator_actions_without_reason",
    ],
  };
}

export function validateReviewSlaSnapshot(snapshot = {}) {
  const errors = [];
  if (snapshot.schemaVersion !== REVIEW_SLA_VERSION) errors.push(`schemaVersion must be ${REVIEW_SLA_VERSION}`);
  if (!Number.isFinite(snapshot.generatedAt)) errors.push("generatedAt must be a timestamp");
  if (!snapshot.summary || typeof snapshot.summary !== "object") errors.push("summary is required");
  if (!Array.isArray(snapshot.items)) errors.push("items must be an array");
  for (const item of asArray(snapshot.items)) {
    if (!REVIEW_SLA_QUEUE_TARGETS[item.queueId]) errors.push(`${item.id}: unknown queueId ${item.queueId}`);
    if (!Number.isFinite(item.ageMs)) errors.push(`${item.id}: ageMs must be numeric`);
    if (typeof item.breached !== "boolean") errors.push(`${item.id}: breached must be boolean`);
    if (!["S0", "S1", "S2", "S3"].includes(item.severity)) errors.push(`${item.id}: severity must be S0-S3`);
  }
  return errors;
}
