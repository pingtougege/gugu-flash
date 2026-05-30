import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DOMAIN_ENTITY_TYPES,
  getDomainEntitySchema,
  listDomainEntityTypes,
  validateDomainEntity,
} from "./index.js";

test("domain schemas cover the P1 backend entity set", () => {
  const requiredTypes = [
    "User",
    "Session",
    "StoryProject",
    "StoryProjectVersion",
    "AiGenerationJob",
    "WorkDraft",
    "Work",
    "WorkVersion",
    "IPEntry",
    "Persona",
    "IPZone",
    "Asset",
    "Upload",
    "ReviewTask",
    "StoreListing",
    "CompatibilityReport",
    "HardwarePack",
    "Order",
    "PaymentCallback",
    "Refund",
    "Settlement",
    "Device",
    "DeviceEntitlement",
    "DeviceInstall",
    "DeviceSyncJob",
    "Interaction",
    "Comment",
    "BlockRelation",
    "Report",
    "RightsClaim",
    "Appeal",
    "ModerationAction",
    "OperationLog",
  ];

  assert.equal(DOMAIN_ENTITY_TYPES.User, "User");
  for (const type of requiredTypes) {
    assert.ok(listDomainEntityTypes().includes(type), `${type} schema should exist`);
    assert.ok(getDomainEntitySchema(type).required.length > 0, `${type} should define required fields`);
  }
});

test("domain validation covers story projects and AI generation jobs", () => {
  const project = {
    id: "story_project_001",
    authorUserId: "user_001",
    schemaVersion: "gugu_story_project_v1",
    title: "雨夜便利店",
    contentOrigin: "original",
    status: "ready_to_preview",
    updatedAt: 1760000000000,
  };
  const version = {
    id: "spv_001",
    storyProjectId: "story_project_001",
    schemaVersion: "gugu_story_project_v1",
    projectSnapshot: { id: "story_project_001" },
    status: "locked",
    createdAt: 1760000000000,
  };
  const aiJob = {
    id: "ai_job_001",
    storyProjectId: "story_project_001",
    stage: "scene_graph",
    status: "queued",
    inputSnapshotId: "spv_001",
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
  };

  assert.deepEqual(validateDomainEntity("StoryProject", project), []);
  assert.deepEqual(validateDomainEntity("StoryProjectVersion", version), []);
  assert.deepEqual(validateDomainEntity("AiGenerationJob", aiJob), []);
  assert.deepEqual(validateDomainEntity("AiGenerationJob", { ...aiJob, status: "pretending" }), [
    "AiGenerationJob.status invalid: pretending",
  ]);
});

test("domain validation keeps hardware packs bound to immutable work versions", () => {
  const valid = {
    id: "hw_pack_001",
    storeListingId: "listing_001",
    sourceWorkVersionId: "wv_work_001_1",
    formatVersion: "hw_pack_v1",
    compatibilityReportId: "compat_001",
    status: "available",
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
  };

  assert.deepEqual(validateDomainEntity("HardwarePack", valid), []);
  assert.deepEqual(
    validateDomainEntity("HardwarePack", { ...valid, sourceWorkVersionId: "" }),
    ["HardwarePack.sourceWorkVersionId is required"],
  );
});

test("domain validation enforces device-scoped entitlements", () => {
  const valid = {
    id: "entitlement_001",
    deviceId: "device_001",
    hardwarePackId: "hw_pack_001",
    orderId: "order_001",
    status: "active",
    createdAt: 1760000000000,
  };

  assert.deepEqual(validateDomainEntity("DeviceEntitlement", valid), []);
  assert.deepEqual(validateDomainEntity("DeviceEntitlement", { ...valid, accountWide: true }), [
    "DeviceEntitlement must be scoped to one device, not an account-wide grant",
  ]);
});

test("domain validation enforces persona and store listing boundaries", () => {
  const persona = {
    id: "persona_rain",
    ipId: "ip_rain",
    name: "雨天咕咕",
    roleType: "official",
    status: "active",
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
  };
  const listing = {
    id: "listing_001",
    workId: "work_001",
    workVersionId: "wv_001",
    applicantUserId: "user_001",
    status: "rights_review",
    rightsAcknowledgedAt: 1760000000000,
    createdAt: 1760000000000,
    updatedAt: 1760000000000,
  };

  assert.deepEqual(validateDomainEntity("Persona", persona), []);
  assert.deepEqual(validateDomainEntity("StoreListing", listing), []);
  assert.deepEqual(validateDomainEntity("StoreListing", { ...listing, rightsAcknowledgedAt: null }), [
    "StoreListing.rightsAcknowledgedAt is required",
    "StoreListing requires rightsAcknowledgedAt after application",
  ]);
});
