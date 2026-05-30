import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PAYMENT_URL = new URL("../docs/payment-provider-readiness.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_REPLAY_SCENARIOS = [
  "payment_provider_sandbox_success",
  "payment_provider_duplicate_event",
  "payment_provider_invalid_signature",
  "payment_provider_amount_mismatch",
  "payment_provider_failed_payment",
  "payment_provider_refund_success",
  "payment_provider_refund_duplicate",
];

const REQUIRED_EXTERNAL_ACCEPTANCE = [
  "payment_sandbox_credentials",
  "provider_webhook_configuration",
  "production_merchant_approval",
  "key_rotation_runbook",
  "settlement_reconciliation",
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

const payment = JSON.parse(await readFile(PAYMENT_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!payment.version) errors.push("payment-provider-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(payment.updatedAt || "")) {
  errors.push("payment-provider-readiness: updatedAt must be YYYY-MM-DD");
}
if (payment.status !== "draft_pending_provider_approval") {
  errors.push("payment-provider-readiness: status must remain draft_pending_provider_approval until sandbox and production approval are recorded");
}

for (const document of asArray(payment.documents)) {
  if (!document.id) errors.push("payment document missing id");
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

for (const control of asArray(payment.codeControls)) {
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

for (const artifact of asArray(payment.dataArtifacts)) {
  if (!artifact.id) errors.push("dataArtifacts: missing id");
  if (!artifact.file) errors.push(`${artifact.id}: missing file`);
  if (!(await pathExists(artifact.file))) {
    errors.push(`${artifact.id}: file does not exist: ${artifact.file}`);
    continue;
  }
  const content = await readFile(resolve(artifact.file), "utf8");
  const parsed = JSON.parse(content);
  for (const field of asArray(artifact.requiredFields)) {
    if (parsed[field] === undefined) errors.push(`${artifact.id}: missing field ${field}`);
  }
}

const replayRows = new Map(asArray(payment.replayScenarios).map((item) => [item.id, item]));
for (const scenarioId of REQUIRED_REPLAY_SCENARIOS) {
  const row = replayRows.get(scenarioId);
  if (!row) {
    errors.push(`replayScenarios: missing ${scenarioId}`);
    continue;
  }
  for (const field of ["owner", "providerEnvironment", "callbackType", "expectedResult"]) {
    if (!row[field]) errors.push(`replayScenarios.${scenarioId}: missing ${field}`);
  }
  if (!asArray(row.requiredEvidence).length) errors.push(`replayScenarios.${scenarioId}: missing requiredEvidence`);
}

for (const command of asArray(payment.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const externalRows = new Map(asArray(payment.externalAcceptance).map((item) => [item.id, item]));
for (const itemId of REQUIRED_EXTERNAL_ACCEPTANCE) {
  const item = externalRows.get(itemId);
  if (!item) {
    errors.push(`externalAcceptance: missing ${itemId}`);
    continue;
  }
  if (item.status !== "pending_external") errors.push(`${itemId}: must remain pending_external until provider work is complete`);
  if (!item.needed) errors.push(`${itemId}: missing needed`);
}

const paymentReadinessItem = asArray(readiness.gates?.public_mvp?.items).find((item) => item.id === "payment_provider");
if (!paymentReadinessItem) {
  errors.push("release-readiness.public_mvp: missing payment_provider item");
} else {
  for (const evidence of [
    "docs/monetization-plan.md",
    "docs/payment-provider-readiness-plan.md",
    "docs/payment-provider-readiness.json",
    "data/payment-provider-integration-packet.json",
    "scripts/check-payment-provider-readiness.mjs",
    "scripts/check-payment-provider-packet.mjs",
    "scripts/replay-payment-provider-callbacks.mjs",
    "apps/backend/src/flash-http-server.js",
    "packages/api-client/src/http-flash-api.test.js",
    "docs/support-ticket-macros.md",
  ]) {
    if (!asArray(paymentReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.payment_provider: evidence must include ${evidence}`);
    }
  }
  if (paymentReadinessItem.status !== "in_progress") {
    errors.push("release-readiness.payment_provider: status must be in_progress until provider approval and sandbox replay are complete");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const pending = asArray(payment.externalAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`Payment provider readiness gate ${payment.version}: scenarios=${replayRows.size}, controls=${asArray(payment.codeControls).length}, artifacts=${asArray(payment.dataArtifacts).length}, pending_external=${pending}`);
