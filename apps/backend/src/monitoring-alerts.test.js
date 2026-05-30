import assert from "node:assert/strict";
import test from "node:test";

import {
  MONITORING_ALERT_RULES,
  MONITORING_ALERT_RULES_VERSION,
  evaluateMonitoringAlerts,
} from "./monitoring-alerts.js";

test("monitoring alert rules cover release-critical alert inputs", () => {
  const ruleIds = MONITORING_ALERT_RULES.map((rule) => rule.id);

  assert.equal(MONITORING_ALERT_RULES_VERSION, "gugu_flash_monitoring_alert_rules_v1");
  assert.ok(ruleIds.includes("api_5xx_spike"));
  assert.ok(ruleIds.includes("auth_denied_spike"));
  assert.ok(ruleIds.includes("payment_callback_failure"));
  assert.ok(ruleIds.includes("refund_mismatch"));
  assert.ok(ruleIds.includes("sync_failure_spike"));
  assert.ok(ruleIds.includes("review_queue_aging"));
  assert.ok(ruleIds.includes("frozen_settlement_aging"));
  assert.ok(ruleIds.includes("web_smoke_failure"));
});

test("monitoring alert evaluator returns active alerts with owner and severity", () => {
  const active = evaluateMonitoringAlerts({
    now: 1760000000000,
    alertInputs: {
      fiveHundredCount: 2,
      authDeniedCount: 3,
      paymentCallbackFailureCount: 1,
      syncFailureCount: 0,
      reviewQueueOldestAgeMs: 25 * 60 * 60 * 1000,
      webSmokeFailure: true,
    },
  });

  assert.ok(active.some((alert) => alert.id === "api_5xx_spike" && alert.owner === "Backend Lead"));
  assert.ok(active.some((alert) => alert.id === "auth_denied_spike" && alert.severity === "S1"));
  assert.ok(active.some((alert) => alert.id === "payment_callback_failure"));
  assert.ok(active.some((alert) => alert.id === "review_queue_aging"));
  assert.ok(active.some((alert) => alert.id === "web_smoke_failure"));
  assert.equal(active.some((alert) => alert.id === "sync_failure_spike"), false);
});
