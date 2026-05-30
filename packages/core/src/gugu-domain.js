export const GUGU_FLASH_CLIENT_TARGETS = ["web", "native", "miniprogram", "operator"];

export const DOMAIN_ENTITY_TYPES = {
  User: "User",
  Session: "Session",
  StoryProject: "StoryProject",
  StoryProjectVersion: "StoryProjectVersion",
  AiGenerationJob: "AiGenerationJob",
  ComicEpisode: "ComicEpisode",
  WorkDraft: "WorkDraft",
  Work: "Work",
  WorkVersion: "WorkVersion",
  Asset: "Asset",
  Upload: "Upload",
  IPEntry: "IPEntry",
  Persona: "Persona",
  ZoneApplication: "ZoneApplication",
  IPZone: "IPZone",
  ReviewTask: "ReviewTask",
  StoreListing: "StoreListing",
  CompatibilityReport: "CompatibilityReport",
  HardwarePack: "HardwarePack",
  Order: "Order",
  PaymentCallback: "PaymentCallback",
  Refund: "Refund",
  Settlement: "Settlement",
  Device: "Device",
  DeviceEntitlement: "DeviceEntitlement",
  DeviceInstall: "DeviceInstall",
  DeviceSyncJob: "DeviceSyncJob",
  Interaction: "Interaction",
  Comment: "Comment",
  BlockRelation: "BlockRelation",
  Report: "Report",
  RightsClaim: "RightsClaim",
  Appeal: "Appeal",
  ModerationAction: "ModerationAction",
  OperationLog: "OperationLog",
};

export const DOMAIN_STATUS = {
  User: ["active", "limited", "suspended", "deleted"],
  Session: ["active", "expired", "revoked"],
  StoryProject: ["draft", "validating", "ready_to_preview", "ready_to_publish", "published", "archived"],
  StoryProjectVersion: ["draft", "locked", "published", "archived"],
  AiGenerationJob: ["queued", "running", "waiting_user", "succeeded", "failed", "canceled"],
  ComicEpisode: ["draft_storyboard", "ready_to_render", "published", "archived"],
  WorkDraft: ["editing", "validating", "ready_to_publish", "archived"],
  Work: ["public_limited", "public", "taken_down", "deleted"],
  WorkVersion: ["active", "locked", "replaced", "removed"],
  Asset: ["uploading", "uploaded", "reviewing", "approved", "rejected", "removed"],
  Upload: ["requested", "uploading", "completed", "failed", "expired"],
  IPEntry: ["pending", "active", "restricted", "removed"],
  Persona: ["draft", "active", "restricted", "removed"],
  ZoneApplication: ["draft", "submitted", "reviewing", "approved", "rejected", "cancelled"],
  IPZone: ["pending", "open", "restricted", "closed"],
  ReviewTask: ["open", "in_review", "approved", "rejected", "cancelled"],
  StoreListing: [
    "not_applied",
    "submitted",
    "rights_review",
    "production_queued",
    "producing",
    "pack_review",
    "listed",
    "rejected",
    "delisted",
    "frozen",
  ],
  CompatibilityReport: ["pending", "running", "passed", "failed", "waived"],
  HardwarePack: ["draft", "building", "reviewing", "ready", "available", "paused", "deprecated", "removed"],
  Order: ["draft", "pending_payment", "paid", "cancelled", "refunded", "failed"],
  PaymentCallback: ["received", "paid", "already_paid", "failed", "amount_mismatch", "order_not_found", "ignored"],
  Refund: ["received", "refunded", "already_refunded", "order_not_found", "ignored", "failed"],
  Settlement: ["pending", "no_cash", "frozen", "refunded", "released", "cancelled"],
  Device: ["bound", "unbound", "lost", "blocked"],
  DeviceEntitlement: ["active", "revoked", "refunded", "expired"],
  DeviceInstall: ["stored", "installed", "removed", "failed"],
  DeviceSyncJob: [
    "created",
    "blocked",
    "downloading",
    "downloaded",
    "syncing",
    "verifying",
    "installed",
    "failed",
    "rollback_required",
    "cancelled",
  ],
  Interaction: ["active", "removed"],
  Comment: ["visible", "hidden_by_author", "hidden_by_platform", "pending_review", "deleted_by_user", "removed"],
  BlockRelation: ["active", "revoked"],
  Report: ["submitted", "triage", "action_taken", "resolved", "rejected", "closed", "escalated"],
  RightsClaim: ["submitted", "triage", "action_taken", "counter_notice_waiting", "restored", "closed", "rejected", "escalated"],
  Appeal: ["submitted", "reviewing", "resolved", "rejected", "escalated"],
  ModerationAction: ["recorded", "reverted"],
  OperationLog: ["recorded"],
};

export const DOMAIN_ENTITY_SCHEMAS = {
  User: {
    idPrefix: "user_",
    required: ["id", "displayName", "role", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  Session: {
    idPrefix: "session_",
    required: ["id", "userId", "status", "createdAt", "expiresAt"],
    statusField: "status",
  },
  StoryProject: {
    idPrefix: "story_project_",
    required: ["id", "authorUserId", "schemaVersion", "title", "contentOrigin", "status", "updatedAt"],
    statusField: "status",
  },
  StoryProjectVersion: {
    idPrefix: "spv_",
    required: ["id", "storyProjectId", "schemaVersion", "projectSnapshot", "status", "createdAt"],
    statusField: "status",
  },
  AiGenerationJob: {
    idPrefix: "ai_job_",
    required: ["id", "storyProjectId", "stage", "status", "inputSnapshotId", "createdAt", "updatedAt"],
    statusField: "status",
  },
  ComicEpisode: {
    idPrefix: "comic_",
    required: ["id", "storyProjectId", "schemaVersion", "title", "status", "updatedAt"],
    statusField: "status",
  },
  WorkDraft: {
    idPrefix: "draft_",
    required: ["id", "authorUserId", "contentOrigin", "ipId", "personaId", "status", "updatedAt"],
    statusField: "status",
  },
  Work: {
    idPrefix: "work_",
    required: ["id", "authorUserId", "currentVersionId", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  WorkVersion: {
    idPrefix: "wv_",
    required: ["id", "workId", "schemaVersion", "contentSnapshot", "status", "createdAt"],
    statusField: "status",
  },
  Asset: {
    idPrefix: "asset_",
    required: ["id", "uploaderUserId", "kind", "usage", "sourceStatement", "status", "createdAt"],
    statusField: "status",
  },
  Upload: {
    idPrefix: "upload_",
    required: ["id", "assetId", "status", "uploadUrl", "createdAt"],
    statusField: "status",
  },
  IPEntry: {
    idPrefix: "ip_",
    required: ["id", "name", "type", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  Persona: {
    idPrefix: "persona_",
    required: ["id", "ipId", "name", "roleType", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  ZoneApplication: {
    idPrefix: "zone_app_",
    required: ["id", "ipId", "applicantUserId", "invitedUserIds", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  IPZone: {
    idPrefix: "zone_",
    required: ["id", "ipId", "name", "adminUserIds", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  ReviewTask: {
    idPrefix: "review_",
    required: ["id", "targetType", "targetId", "reviewType", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  StoreListing: {
    idPrefix: "listing_",
    required: ["id", "workId", "workVersionId", "applicantUserId", "status", "rightsAcknowledgedAt", "createdAt", "updatedAt"],
    statusField: "status",
  },
  CompatibilityReport: {
    idPrefix: "compat_",
    required: ["id", "hardwarePackId", "targetDeviceModels", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  HardwarePack: {
    idPrefix: "hw_",
    required: ["id", "storeListingId", "sourceWorkVersionId", "formatVersion", "compatibilityReportId", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  Order: {
    idPrefix: "order_",
    required: ["id", "buyerUserId", "deviceId", "hardwarePackId", "amount", "currency", "status", "createdAt"],
    statusField: "status",
  },
  PaymentCallback: {
    idPrefix: "payment_callback_",
    required: ["id", "providerEventId", "orderId", "result", "amount", "currency", "receivedAt"],
    statusField: "result",
  },
  Refund: {
    idPrefix: "refund_callback_",
    required: ["id", "providerEventId", "orderId", "result", "amount", "currency", "receivedAt"],
    statusField: "result",
  },
  Settlement: {
    idPrefix: "settlement_",
    required: ["id", "orderId", "storeListingId", "hardwarePackId", "amount", "currency", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  Device: {
    idPrefix: "device_",
    required: ["id", "ownerUserId", "deviceIdHex", "model", "status", "personaId", "boundAt"],
    statusField: "status",
  },
  DeviceEntitlement: {
    idPrefix: "entitlement_",
    required: ["id", "deviceId", "hardwarePackId", "orderId", "status", "createdAt"],
    statusField: "status",
  },
  DeviceInstall: {
    idPrefix: "install_",
    required: ["id", "deviceId", "hardwarePackId", "status", "installedVersion", "updatedAt"],
    statusField: "status",
  },
  DeviceSyncJob: {
    idPrefix: "sync_",
    required: ["id", "deviceId", "hardwarePackId", "storeId", "status", "diagnosticCode", "createdAt", "updatedAt"],
    statusField: "status",
  },
  Interaction: {
    idPrefix: "interaction_",
    required: ["id", "userId", "workId", "type", "status", "createdAt"],
    statusField: "status",
  },
  Comment: {
    idPrefix: "comment_",
    required: ["id", "userId", "workId", "body", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  BlockRelation: {
    idPrefix: "block_",
    required: ["id", "blockerUserId", "blockedUserId", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  Report: {
    idPrefix: "report_",
    required: ["id", "reporterUserId", "targetType", "targetId", "reason", "status", "createdAt"],
    statusField: "status",
  },
  RightsClaim: {
    idPrefix: "claim_",
    required: ["id", "claimantName", "targetType", "targetId", "claimType", "summary", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  Appeal: {
    idPrefix: "appeal_",
    required: ["id", "appellantUserId", "targetType", "targetId", "reason", "status", "createdAt", "updatedAt"],
    statusField: "status",
  },
  ModerationAction: {
    idPrefix: "mod_action_",
    required: ["id", "targetType", "targetId", "action", "reason", "operatorId", "status", "createdAt"],
    statusField: "status",
  },
  OperationLog: {
    idPrefix: "op_",
    required: ["id", "actorUserId", "action", "targetType", "targetId", "status", "createdAt"],
    statusField: "status",
  },
};

export function listDomainEntityTypes() {
  return Object.keys(DOMAIN_ENTITY_SCHEMAS);
}

export function getDomainEntitySchema(entityType) {
  return DOMAIN_ENTITY_SCHEMAS[entityType] || null;
}

export function validateDomainEntity(entityType, entity) {
  const schema = getDomainEntitySchema(entityType);
  if (!schema) return [`unknown entity type: ${entityType}`];
  if (!entity || typeof entity !== "object" || Array.isArray(entity)) return [`${entityType} must be an object`];

  const errors = [];
  for (const field of schema.required) {
    if (entity[field] === undefined || entity[field] === null || entity[field] === "") {
      errors.push(`${entityType}.${field} is required`);
    }
  }

  if (schema.statusField && entity[schema.statusField]) {
    const allowed = DOMAIN_STATUS[entityType] || [];
    if (!allowed.includes(entity[schema.statusField])) {
      errors.push(`${entityType}.${schema.statusField} invalid: ${entity[schema.statusField]}`);
    }
  }

  if (schema.idPrefix && entity.id && !String(entity.id).startsWith(schema.idPrefix)) {
    errors.push(`${entityType}.id must start with ${schema.idPrefix}`);
  }

  if (entityType === "DeviceEntitlement" && entity.accountWide === true) {
    errors.push("DeviceEntitlement must be scoped to one device, not an account-wide grant");
  }

  if (entityType === "HardwarePack" && entity.sourceWorkId && !entity.sourceWorkVersionId) {
    errors.push("HardwarePack must bind a fixed sourceWorkVersionId");
  }

  if (entityType === "StoreListing" && entity.status !== "not_applied" && !entity.rightsAcknowledgedAt) {
    errors.push("StoreListing requires rightsAcknowledgedAt after application");
  }

  if (entityType === "Persona" && entity.ipId === entity.id) {
    errors.push("Persona.ipId must point to an IPEntry, not itself");
  }

  return errors;
}

export function validateDomainEntities(records) {
  return records.flatMap((record) => validateDomainEntity(record.type, record.entity));
}
