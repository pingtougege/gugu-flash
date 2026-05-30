import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const MONITORING_URL = new URL("../docs/monitoring-readiness.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);
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

const monitoring = JSON.parse(await readFile(MONITORING_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!monitoring.version) errors.push("monitoring-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(monitoring.updatedAt || "")) {
  errors.push("monitoring-readiness: updatedAt must be YYYY-MM-DD");
}
if (monitoring.status !== "draft_pending_production_observability") {
  errors.push("monitoring-readiness: status must remain draft_pending_production_observability until production wiring is complete");
}

for (const document of asArray(monitoring.documents)) {
  if (!document.id) errors.push("monitoring document missing id");
  if (!document.file) errors.push(`${document.id}: missing file`);
  if (!(await pathExists(document.file))) {
    errors.push(`${document.id}: file does not exist: ${document.file}`);
    continue;
  }
  const content = await readFile(resolve(document.file), "utf8");
  for (const heading of asArray(document.requiredHeadings)) {
    if (!content.includes(heading)) errors.push(`${document.id}: missing heading ${heading}`);
  }
  for (const clause of asArray(document.requiredClauses)) {
    if (!content.toLowerCase().includes(String(clause).toLowerCase())) {
      errors.push(`${document.id}: missing clause marker ${clause}`);
    }
  }
}

for (const control of asArray(monitoring.codeControls)) {
  if (!control.id) errors.push("codeControls: missing id");
  if (!control.file) errors.push(`${control.id}: missing file`);
  if (!(await pathExists(control.file))) {
    errors.push(`${control.id}: file does not exist: ${control.file}`);
    continue;
  }
  const content = await readFile(resolve(control.file), "utf8");
  for (const marker of asArray(control.requiredMarkers)) {
    if (!content.includes(marker)) errors.push(`${control.id}: missing marker ${marker}`);
  }
}

for (const artifact of asArray(monitoring.dataArtifacts)) {
  if (!artifact.id) errors.push("dataArtifacts: missing id");
  if (!artifact.file) errors.push(`${artifact.id}: missing file`);
  if (!(await pathExists(artifact.file))) {
    errors.push(`${artifact.id}: file does not exist: ${artifact.file}`);
    continue;
  }
  const content = await readFile(resolve(artifact.file), "utf8");
  for (const marker of asArray(artifact.requiredMarkers)) {
    if (!content.includes(marker)) errors.push(`${artifact.id}: missing marker ${marker}`);
  }
  for (const clause of asArray(artifact.requiredClauses)) {
    if (!content.toLowerCase().includes(String(clause).toLowerCase())) {
      errors.push(`${artifact.id}: missing clause marker ${clause}`);
    }
  }
}

const alertDrafts = new Map(asArray(monitoring.alertDrafts).map((item) => [item.id, item]));
for (const alertId of REQUIRED_ALERTS) {
  const alert = alertDrafts.get(alertId);
  if (!alert) {
    errors.push(`alertDrafts: missing ${alertId}`);
    continue;
  }
  for (const field of ["severity", "owner", "signal"]) {
    if (!alert[field]) errors.push(`alertDrafts.${alertId}: missing ${field}`);
  }
}

for (const item of asArray(monitoring.externalAcceptance)) {
  if (!item.id) errors.push("externalAcceptance: missing id");
  if (item.status !== "pending_external") errors.push(`${item.id}: must remain pending_external until production observability exists`);
  if (!item.needed) errors.push(`${item.id}: missing needed`);
}

for (const command of asArray(monitoring.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const monitoringReadinessItem = asArray(readiness.gates?.public_mvp?.items).find((item) => item.id === "monitoring_alerts");
if (!monitoringReadinessItem) {
  errors.push("release-readiness.public_mvp: missing monitoring_alerts item");
} else {
  for (const evidence of ["docs/monitoring-alerts-plan.md", "docs/monitoring-readiness.json", "data/production-monitoring-alerting-packet.json", "scripts/check-monitoring-readiness.mjs", "scripts/check-production-monitoring-packet.mjs", "apps/backend/src/flash-http-server.js", "apps/backend/src/monitoring-alerts.js", "apps/backend/src/monitoring-alerts.test.js", "packages/api-client/src/http-flash-api.test.js"]) {
    if (!asArray(monitoringReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.monitoring_alerts: evidence must include ${evidence}`);
    }
  }
  if (monitoringReadinessItem.status === "ready") {
    errors.push("release-readiness.monitoring_alerts: cannot be ready until production observability is wired");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const controls = asArray(monitoring.codeControls).length;
const artifacts = asArray(monitoring.dataArtifacts).length;
const pending = asArray(monitoring.externalAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`Monitoring readiness gate ${monitoring.version}: alerts=${alertDrafts.size}, controls=${controls}, artifacts=${artifacts}, pending_external=${pending}`);
