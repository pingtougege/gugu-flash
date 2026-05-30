import assert from "node:assert/strict";
import test from "node:test";

import {
  REVIEW_SLA_VERSION,
  evaluateReviewSla,
  validateReviewSlaSnapshot,
} from "./review-sla.js";

test("review SLA snapshot marks breached governance and store queues", () => {
  const now = 1767225600000;
  const snapshot = evaluateReviewSla({
    requestId: "req_review_sla_001",
    now,
    dashboard: {
      reviewTasks: [
        {
          id: "review_pack_001",
          reviewType: "hardware_pack_review",
          targetType: "HardwarePack",
          targetId: "hw_001",
          title: "硬件复核",
          status: "open",
          riskLevel: "medium",
          createdAt: now - 80 * 60 * 60 * 1000,
        },
      ],
      storeListings: [
        {
          id: "listing_001",
          title: "商店审核",
          status: "rights_review",
          updatedAt: now - 49 * 60 * 60 * 1000,
        },
      ],
      governanceCases: [
        {
          id: "claim_001",
          caseType: "rights_claim",
          targetType: "Work",
          targetId: "h5_001",
          title: "权利投诉",
          status: "action_taken",
          createdAt: now - 74 * 60 * 60 * 1000,
        },
      ],
      settlements: [
        {
          id: "settlement_001",
          status: "frozen",
          hardwarePackTitle: "冻结收益",
          updatedAt: now - 75 * 60 * 60 * 1000,
        },
      ],
    },
  });

  assert.equal(snapshot.schemaVersion, REVIEW_SLA_VERSION);
  assert.deepEqual(validateReviewSlaSnapshot(snapshot), []);
  assert.equal(snapshot.summary.totalOpen, 4);
  assert.ok(snapshot.summary.breached >= 3);
  assert.ok(snapshot.items.some((item) => item.queueId === "hardware_adaptation_review" && item.breached));
  assert.ok(snapshot.items.some((item) => item.queueId === "store_listing_review" && item.breached));
  assert.ok(snapshot.items.some((item) => item.queueId === "rights_claim_governance" && item.escalationRequired));
});

test("review SLA snapshot detects appeal separation-of-duty conflicts", () => {
  const now = 1767225600000;
  const snapshot = evaluateReviewSla({
    now,
    dashboard: {
      governanceCases: [
        {
          id: "appeal_001",
          caseType: "appeal",
          targetType: "Work",
          targetId: "h5_001",
          title: "申诉复核",
          status: "open",
          createdAt: now - 4 * 60 * 60 * 1000,
          assignedReviewerId: "operator_same",
          sourceOperatorId: "operator_same",
        },
      ],
    },
  });

  const appeal = snapshot.items.find((item) => item.id === "appeal_001");
  assert.equal(appeal.queueId, "appeal_review");
  assert.equal(appeal.secondReviewerConflict, true);
  assert.equal(appeal.escalationRequired, true);
  assert.equal(snapshot.summary.secondReviewerConflicts, 1);
});

test("review SLA validation rejects malformed snapshots", () => {
  assert.ok(validateReviewSlaSnapshot({}).some((error) => error.includes("schemaVersion")));
});
