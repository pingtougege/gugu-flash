import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { MONITORING_ALERT_RULES, MONITORING_ALERT_RULES_VERSION } from "../apps/backend/src/monitoring-alerts.js";

const PACKET_URL = new URL("../data/production-monitoring-alerting-packet.json", import.meta.url);
const MONITORING_URL = new URL("../docs/monitoring-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_ALERTS = [
  "api_down",
  "api_5xx_spike",
  "auth_denied_spike",
  "payment_callback_failure",
  "refund_mismatch",
  "sync_failure_spike",
  "review_queue_aging",
  "frozen_settlement_aging",
  "web_smoke_failure",
];
const REQUIRED_SIGNALS = ["api_health", "api_readiness", "ops_metrics", "request_correlation", "web_http_smoke"];
const REQUIRED_SYNTHETICS = ["external_api_health", "external_api_readiness", "web_http_core_loop"];
const REQUIRED_PANELS = [
  "api_status_uptime",
  "request_status_classes",
  "request_status_codes",
  "last_5xx_path",
  "active_alerts",
  "payment_refund_callbacks",
  "device_sync_failures",
  "review_queue_aging",
  "frozen_settlement_aging",
  "web_smoke_status",
];
const REQUIRED_EXTERNAL_BLOCKERS = [
  "hosted_metrics_backend",
  "alert_delivery",
  "synthetic_checks",
  "incident_drill",
];

async function pathExists(path) {
  try {
    await access(resolve(path));
    return true;
  } catch {
    return false;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const packet = JSON.parse(await readFile(PACKET_URL, "utf8"));
const monitoring = JSON.parse(await readFile(MONITORING_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_production_monitoring_alerting_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_production_monitoring_alerting_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_production_observability") {
  errors.push("packet.status must remain draft_pending_production_observability until production observability is wired");
}
if (packet.alertRulesVersion !== MONITORING_ALERT_RULES_VERSION) {
  errors.push(`packet.alertRulesVersion must be ${MONITORING_ALERT_RULES_VERSION}`);
}
if (packet.environment !== "public_mvp_production") errors.push("packet.environment must be public_mvp_production");

const serviceTargets = new Map(asArray(packet.serviceTargets).map((item) => [item.id, item]));
for (const serviceId of ["web_h5", "backend_api"]) {
  const service = serviceTargets.get(serviceId);
  if (!service) {
    errors.push(`serviceTargets missing ${serviceId}`);
    continue;
  }
  if (service.status !== "pending_external") errors.push(`serviceTargets.${serviceId}.status must remain pending_external`);
  if (!service.url) errors.push(`serviceTargets.${serviceId}.url is required`);
}
const api = serviceTargets.get("backend_api");
for (const [field, expected] of [["healthPath", "/flash/health"], ["readinessPath", "/flash/ready"], ["metricsPath", "/flash/operator/ops-metrics"]]) {
  if (api?.[field] !== expected) errors.push(`serviceTargets.backend_api.${field} must be ${expected}`);
}

const signalRows = new Map(asArray(packet.signalSources).map((item) => [item.id, item]));
for (const signalId of REQUIRED_SIGNALS) {
  const signal = signalRows.get(signalId);
  if (!signal) {
    errors.push(`signalSources missing ${signalId}`);
    continue;
  }
  if (signal.required !== true) errors.push(`signalSources.${signalId}.required must be true`);
  if (!signal.source || !signal.backendField) errors.push(`signalSources.${signalId} missing source/backendField`);
}

const monitoringAlertDrafts = new Map(asArray(monitoring.alertDrafts).map((item) => [item.id, item]));
const evaluatorAlerts = new Map(MONITORING_ALERT_RULES.map((item) => [item.id, item]));
const alertRoutes = new Map(asArray(packet.alertRoutes).map((item) => [item.id, item]));
for (const alertId of REQUIRED_ALERTS) {
  const route = alertRoutes.get(alertId);
  const draft = monitoringAlertDrafts.get(alertId);
  if (!route) {
    errors.push(`alertRoutes missing ${alertId}`);
    continue;
  }
  if (!draft) errors.push(`monitoring.alertDrafts missing ${alertId}`);
  if (route.status !== "pending_external") errors.push(`alertRoutes.${alertId}.status must remain pending_external`);
  if (!route.owner || !route.severity) errors.push(`alertRoutes.${alertId} missing owner/severity`);
  if (draft && route.owner !== draft.owner) errors.push(`alertRoutes.${alertId}.owner must match monitoring alert draft`);
  if (draft && route.severity !== draft.severity) errors.push(`alertRoutes.${alertId}.severity must match monitoring alert draft`);
  if (!asArray(route.delivery).length) errors.push(`alertRoutes.${alertId}.delivery is required`);
  if (alertId !== "api_down" && !evaluatorAlerts.has(alertId)) {
    errors.push(`alertRoutes.${alertId} missing from MONITORING_ALERT_RULES evaluator`);
  }
}

const syntheticRows = new Map(asArray(packet.syntheticChecks).map((item) => [item.id, item]));
for (const checkId of REQUIRED_SYNTHETICS) {
  const check = syntheticRows.get(checkId);
  if (!check) {
    errors.push(`syntheticChecks missing ${checkId}`);
    continue;
  }
  if (check.status !== "pending_external") errors.push(`syntheticChecks.${checkId}.status must remain pending_external`);
  if (!serviceTargets.has(check.target)) errors.push(`syntheticChecks.${checkId}.target references unknown service`);
  if (!check.method || !check.path || !check.frequency) errors.push(`syntheticChecks.${checkId} missing method/path/frequency`);
}

for (const panelId of REQUIRED_PANELS) {
  if (!asArray(packet.dashboardPanels).includes(panelId)) errors.push(`dashboardPanels missing ${panelId}`);
}

const drillRows = new Map(asArray(packet.incidentDrills).map((item) => [item.id, item]));
for (const drillId of ["api_down_s0_drill", "payment_callback_s1_drill"]) {
  const drill = drillRows.get(drillId);
  if (!drill) {
    errors.push(`incidentDrills missing ${drillId}`);
    continue;
  }
  if (drill.status !== "pending_external") errors.push(`incidentDrills.${drillId}.status must remain pending_external`);
  if (!drill.owner || !drill.severity) errors.push(`incidentDrills.${drillId} missing owner/severity`);
  if (!asArray(drill.requiredEvidence).length) errors.push(`incidentDrills.${drillId}.requiredEvidence is required`);
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
const monitoringExternal = new Set(asArray(monitoring.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
  if (!monitoringExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from monitoring externalAcceptance`);
}

const monitoringArtifacts = new Map(asArray(monitoring.dataArtifacts).map((item) => [item.id, item]));
if (!monitoringArtifacts.has("production_monitoring_alerting_packet")) {
  errors.push("monitoring-readiness.dataArtifacts missing production_monitoring_alerting_packet");
}
const monitoringControls = new Map(asArray(monitoring.codeControls).map((item) => [item.id, item]));
if (!monitoringControls.has("production_monitoring_packet_gate")) {
  errors.push("monitoring-readiness.codeControls missing production_monitoring_packet_gate");
}
if (!asArray(monitoring.releaseCommands).includes("npm run check:production-monitoring")) {
  errors.push("monitoring-readiness.releaseCommands missing npm run check:production-monitoring");
}
if (!(await pathExists("data/production-monitoring-alerting-packet.json"))) {
  errors.push("data/production-monitoring-alerting-packet.json must exist");
}

const monitoringReadinessItem = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "monitoring_alerts");
if (!monitoringReadinessItem) {
  errors.push("release-readiness.public_mvp missing monitoring_alerts");
} else {
  for (const evidence of ["data/production-monitoring-alerting-packet.json", "scripts/check-production-monitoring-packet.mjs"]) {
    if (!asArray(monitoringReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.monitoring_alerts evidence missing ${evidence}`);
    }
  }
  if (monitoringReadinessItem.status !== "in_progress") {
    errors.push("monitoring_alerts must remain in_progress until production observability is wired");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Production monitoring packet gate ${packet.schemaVersion}: alerts=${alertRoutes.size}, synthetics=${syntheticRows.size}, drills=${drillRows.size}, blockers=${blockerRows.size}`);
