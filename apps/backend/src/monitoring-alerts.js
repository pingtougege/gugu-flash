export const MONITORING_ALERT_RULES_VERSION = "gugu_flash_monitoring_alert_rules_v1";

export const MONITORING_ALERT_RULES = [
  {
    id: "api_5xx_spike",
    severity: "S1",
    owner: "Backend Lead",
    input: "fiveHundredCount",
    threshold: 1,
    summary: "Backend API 5xx responses detected.",
  },
  {
    id: "auth_denied_spike",
    severity: "S1",
    owner: "Security / Backend Lead",
    input: "authDeniedCount",
    threshold: 3,
    summary: "Auth/session failures or operator permission denials spiked.",
  },
  {
    id: "payment_callback_failure",
    severity: "S1",
    owner: "Commerce Lead",
    input: "paymentCallbackFailureCount",
    threshold: 1,
    summary: "Payment callback failures or mismatches detected.",
  },
  {
    id: "refund_mismatch",
    severity: "S1",
    owner: "Commerce Lead",
    input: "refundMismatchCount",
    threshold: 1,
    summary: "Refund callback/platform state mismatch detected.",
  },
  {
    id: "sync_failure_spike",
    severity: "S1",
    owner: "Hardware Lead",
    input: "syncFailureCount",
    threshold: 1,
    summary: "Device sync failures detected.",
  },
  {
    id: "review_queue_aging",
    severity: "S1",
    owner: "Trust Lead",
    input: "reviewQueueOldestAgeMs",
    threshold: 24 * 60 * 60 * 1000,
    summary: "Review/report/appeal queue item exceeded SLA.",
  },
  {
    id: "frozen_settlement_aging",
    severity: "S1",
    owner: "Commerce Lead",
    input: "frozenSettlementOldestAgeMs",
    threshold: 24 * 60 * 60 * 1000,
    summary: "Frozen settlement exceeded review SLA.",
  },
  {
    id: "web_smoke_failure",
    severity: "S1",
    owner: "QA Lead",
    input: "webSmokeFailure",
    equals: true,
    summary: "Web HTTP-mode smoke failed.",
  },
];

export function evaluateMonitoringAlerts({ alertInputs = {}, now = Date.now() } = {}) {
  const active = [];
  for (const rule of MONITORING_ALERT_RULES) {
    const value = alertInputs[rule.input];
    const triggered = Object.hasOwn(rule, "equals")
      ? value === rule.equals
      : Number(value || 0) >= rule.threshold;
    if (!triggered) continue;
    active.push({
      id: rule.id,
      severity: rule.severity,
      owner: rule.owner,
      status: "triggered",
      input: rule.input,
      value,
      threshold: Object.hasOwn(rule, "equals") ? rule.equals : rule.threshold,
      summary: rule.summary,
      triggeredAt: now,
    });
  }
  return active;
}
