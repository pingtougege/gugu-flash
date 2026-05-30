import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const SUPPORT_URL = new URL("../docs/support-readiness.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_MACROS = [
  "sync_low_battery",
  "sync_write_failed",
  "payment_no_entitlement",
  "refund_provider_mismatch",
  "takedown_legacy_use",
  "rights_claim_received",
  "appeal_received",
  "operator_reason_missing",
];
const REQUIRED_SEVERITIES = ["S0", "S1", "S2", "S3"];
const REQUIRED_DAILY_CHECKS = [
  "open_reports",
  "open_rights_claims",
  "open_appeals",
  "payment_callbacks",
  "refund_callbacks",
  "failed_sync_jobs",
  "frozen_settlements",
  "operator_actions_without_reason",
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

const support = JSON.parse(await readFile(SUPPORT_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!support.version) errors.push("support-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(support.updatedAt || "")) {
  errors.push("support-readiness: updatedAt must be YYYY-MM-DD");
}
if (support.status !== "draft_pending_real_staffing") {
  errors.push("support-readiness: status must remain draft_pending_real_staffing until named humans are assigned");
}

for (const document of asArray(support.documents)) {
  if (!document.id) errors.push("support-readiness document missing id");
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

for (const control of asArray(support.codeControls)) {
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

for (const artifact of asArray(support.dataArtifacts)) {
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

const macros = new Map(asArray(support.ticketMacros).map((item) => [item.id, item]));
for (const macroId of REQUIRED_MACROS) {
  const macro = macros.get(macroId);
  if (!macro) {
    errors.push(`ticketMacros: missing ${macroId}`);
    continue;
  }
  if (!macro.severity) errors.push(`${macroId}: missing severity`);
  if (!macro.owner) errors.push(`${macroId}: missing owner`);
  if (!asArray(macro.requiredFields).length) errors.push(`${macroId}: missing requiredFields`);
}

const escalationMatrix = new Map(asArray(support.escalationMatrix).map((item) => [item.severity, item]));
for (const severity of REQUIRED_SEVERITIES) {
  const row = escalationMatrix.get(severity);
  if (!row) {
    errors.push(`escalationMatrix: missing ${severity}`);
    continue;
  }
  for (const field of ["responseTarget", "primaryOwner", "backupOwner", "handoffChannel"]) {
    if (!row[field]) errors.push(`escalationMatrix.${severity}: missing ${field}`);
  }
}

const dailyChecks = new Set(asArray(support.dailyReviewChecklist));
for (const checkId of REQUIRED_DAILY_CHECKS) {
  if (!dailyChecks.has(checkId)) errors.push(`dailyReviewChecklist: missing ${checkId}`);
}

const acceptance = new Map(asArray(support.closedBetaAcceptance).map((item) => [item.id, item]));
for (const itemId of ["support_playbook", "ticket_macros", "escalation_matrix", "support_diagnostic_bundle", "real_staffing_assignment"]) {
  const item = acceptance.get(itemId);
  if (!item) {
    errors.push(`closedBetaAcceptance: missing ${itemId}`);
    continue;
  }
  if (item.status === "pending_external" && !item.needed) {
    errors.push(`${itemId}: pending external items must describe needed work`);
  }
  for (const evidence of asArray(item.evidence)) {
    if (!(await pathExists(evidence))) errors.push(`${itemId}: evidence path does not exist: ${evidence}`);
  }
}

for (const command of asArray(support.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const supportReadinessItem = asArray(readiness.gates?.closed_beta?.items).find((item) => item.id === "support_playbook");
if (!supportReadinessItem) {
  errors.push("release-readiness.closed_beta: missing support_playbook item");
} else {
  for (const evidence of [
    "docs/support-playbook.md",
    "docs/support-ticket-macros.md",
    "docs/support-readiness.json",
    "data/support-oncall-packet.json",
    "docs/support-diagnostics-readiness.md",
    "docs/support-diagnostics-readiness.json",
    "apps/backend/src/support-diagnostics.js",
    "apps/backend/src/support-diagnostics.test.js",
    "scripts/check-support-readiness.mjs",
    "scripts/check-support-oncall-packet.mjs",
    "scripts/check-support-diagnostics-readiness.mjs",
  ]) {
    if (!asArray(supportReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.support_playbook: evidence must include ${evidence}`);
    }
  }
  if (supportReadinessItem.status === "ready") {
    errors.push("release-readiness.support_playbook: cannot be ready until real staffing is assigned");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const drafted = asArray(support.closedBetaAcceptance).filter((item) => item.status === "drafted").length;
const pending = asArray(support.closedBetaAcceptance).filter((item) => item.status.startsWith("pending")).length;
console.log(`Support readiness gate ${support.version}: macros=${macros.size}, severities=${escalationMatrix.size}, artifacts=${asArray(support.dataArtifacts).length}, drafted=${drafted}, pending=${pending}`);
