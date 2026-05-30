import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DRILL_URL = new URL("../data/payment-settlement-reconciliation-drill.json", import.meta.url);
const PACKET_URL = new URL("../data/payment-provider-integration-packet.json", import.meta.url);
const PAYMENT_URL = new URL("../docs/payment-provider-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const SUPPORT_MACROS_URL = new URL("../docs/support-ticket-macros.md", import.meta.url);

const REQUIRED_BUCKETS = [
  "provider_paid_missing_order",
  "provider_paid_missing_entitlement",
  "amount_or_currency_mismatch",
  "refund_without_revoke",
  "duplicate_provider_event",
  "settlement_fee_unmapped",
];
const REQUIRED_SOURCES = ["orders", "payment_callbacks", "refund_callbacks", "device_entitlements", "settlement_records"];
const REQUIRED_ACTIONS = [
  "freeze_related_listing_on_rights_claim",
  "open_support_diagnostic_bundle",
  "record_manual_reconciliation_note",
  "escalate_unresolved_mismatch_to_commerce_and_backend",
];
const REQUIRED_EXTERNAL = [
  "payment_sandbox_credentials",
  "provider_webhook_configuration",
  "production_merchant_approval",
  "key_rotation_runbook",
  "settlement_reconciliation",
];
const REQUIRED_COMMANDS = [
  "npm run check:payment-provider",
  "npm run check:payment-provider-packet",
  "npm run check:payment-settlement-reconciliation",
  "npm run check:payment-replay",
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

const drill = JSON.parse(await readFile(DRILL_URL, "utf8"));
const packet = JSON.parse(await readFile(PACKET_URL, "utf8"));
const payment = JSON.parse(await readFile(PAYMENT_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const supportMacros = await readFile(SUPPORT_MACROS_URL, "utf8");
const errors = [];

if (drill.schemaVersion !== "gugu_payment_settlement_reconciliation_drill_v1") {
  errors.push("drill.schemaVersion must be gugu_payment_settlement_reconciliation_drill_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(drill.updatedAt || "")) errors.push("drill.updatedAt must be YYYY-MM-DD");
if (drill.status !== "draft_ready_for_provider_export_replay") {
  errors.push("drill.status must remain draft_ready_for_provider_export_replay");
}
if (drill.environment !== "closed_beta_and_public_mvp") errors.push("drill.environment must be closed_beta_and_public_mvp");
if (drill.sourcePacket !== "data/payment-provider-integration-packet.json") {
  errors.push("drill.sourcePacket must point to payment provider packet");
}

if (drill.cadence?.beta !== "daily") errors.push("cadence.beta must be daily");
if (!drill.cadence?.owner) errors.push("cadence.owner is required");
if (!drill.cadence?.backupOwner) errors.push("cadence.backupOwner is required");

const settlement = packet.settlementReconciliation || {};
for (const column of asArray(settlement.providerExportRequiredColumns)) {
  if (!asArray(drill.providerExportRequiredColumns).includes(column)) {
    errors.push(`providerExportRequiredColumns missing packet column ${column}`);
  }
}
for (const source of REQUIRED_SOURCES) {
  if (!asArray(drill.guguRecordSources).includes(source)) errors.push(`guguRecordSources missing ${source}`);
  if (!asArray(settlement.guguRecordSources).includes(source)) errors.push(`packet settlement guguRecordSources missing ${source}`);
}

const scenarios = new Map(asArray(drill.reconciliationScenarios).map((item) => [item.id, item]));
for (const bucket of REQUIRED_BUCKETS) {
  const scenario = scenarios.get(bucket);
  if (!scenario) {
    errors.push(`reconciliationScenarios missing ${bucket}`);
    continue;
  }
  if (!asArray(settlement.mismatchBuckets).includes(bucket)) errors.push(`packet settlement mismatchBuckets missing ${bucket}`);
  if (!["S1", "S2"].includes(scenario.severity)) errors.push(`reconciliationScenarios.${bucket}.severity must be S1 or S2`);
  if (scenario.replayStatus !== "pending_provider_export") {
    errors.push(`reconciliationScenarios.${bucket}.replayStatus must remain pending_provider_export`);
  }
  if (asArray(scenario.requiredEvidence).length < 3) {
    errors.push(`reconciliationScenarios.${bucket}.requiredEvidence must include at least 3 items`);
  }
  if (!REQUIRED_ACTIONS.includes(scenario.requiredAction)) {
    errors.push(`reconciliationScenarios.${bucket}.requiredAction is invalid`);
  }
}

for (const action of REQUIRED_ACTIONS) {
  if (!asArray(drill.requiredActions).includes(action)) errors.push(`requiredActions missing ${action}`);
  if (!asArray(settlement.requiredActions).includes(action)) errors.push(`packet settlement requiredActions missing ${action}`);
}

const handoff = drill.supportHandoff || {};
if (handoff.diagnosticEndpoint !== packet.supportHandoff?.diagnosticEndpoint) {
  errors.push("supportHandoff.diagnosticEndpoint must match payment provider packet");
}
for (const macro of asArray(handoff.requiredMacros)) {
  if (!supportMacros.includes(macro)) errors.push(`supportHandoff.requiredMacros missing from support macros: ${macro}`);
  if (!asArray(packet.supportHandoff?.requiredMacros).includes(macro)) {
    errors.push(`supportHandoff.requiredMacros missing from payment provider packet: ${macro}`);
  }
}
for (const field of asArray(packet.supportHandoff?.requiredLookupFields)) {
  if (!asArray(handoff.requiredLookupFields).includes(field)) {
    errors.push(`supportHandoff.requiredLookupFields missing packet field ${field}`);
  }
}

const localProof = drill.localProof || {};
if (localProof.paymentReplayCommand !== "npm run check:payment-replay") {
  errors.push("localProof.paymentReplayCommand must be npm run check:payment-replay");
}
for (const scenarioId of asArray(localProof.requiredReplayScenarios)) {
  if (!asArray(packet.sandboxReplay?.requiredScenarios).includes(scenarioId)) {
    errors.push(`localProof.requiredReplayScenarios references unknown replay scenario ${scenarioId}`);
  }
}
if (localProof.status !== "ready_as_local_proof_only") {
  errors.push("localProof.status must be ready_as_local_proof_only");
}

for (const command of REQUIRED_COMMANDS) {
  if (!asArray(drill.releasePolicy?.requiredCommands).includes(command)) {
    errors.push(`releasePolicy.requiredCommands missing ${command}`);
  }
}
for (const blockerId of REQUIRED_EXTERNAL) {
  if (!asArray(drill.releasePolicy?.mustRemainInProgressUntil).includes(blockerId)) {
    errors.push(`releasePolicy.mustRemainInProgressUntil missing ${blockerId}`);
  }
}

const blockerRows = new Map(asArray(drill.externalBlockers).map((item) => [item.id, item]));
const packetBlockers = new Set(asArray(packet.externalBlockers).map((item) => item.id));
const paymentExternal = new Set(asArray(payment.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId}.status must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (asArray(blocker.exitCriteria).length < 3) errors.push(`externalBlockers.${blockerId}.exitCriteria must include at least 3 items`);
  if (!packetBlockers.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from payment provider packet`);
  if (!paymentExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from payment readiness`);
}

const artifacts = new Map(asArray(payment.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("payment_settlement_reconciliation_drill")) {
  errors.push("payment-provider-readiness.dataArtifacts missing payment_settlement_reconciliation_drill");
}
const controls = new Map(asArray(payment.codeControls).map((item) => [item.id, item]));
if (!controls.has("payment_settlement_reconciliation_gate")) {
  errors.push("payment-provider-readiness.codeControls missing payment_settlement_reconciliation_gate");
}
if (!asArray(payment.releaseCommands).includes("npm run check:payment-settlement-reconciliation")) {
  errors.push("payment-provider-readiness.releaseCommands missing npm run check:payment-settlement-reconciliation");
}
if (!(await pathExists("data/payment-settlement-reconciliation-drill.json"))) {
  errors.push("data/payment-settlement-reconciliation-drill.json must exist");
}

const publicPaymentItem = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "payment_provider");
if (!publicPaymentItem) {
  errors.push("release-readiness.public_mvp missing payment_provider");
} else {
  for (const evidence of ["data/payment-settlement-reconciliation-drill.json", "scripts/check-payment-settlement-reconciliation.mjs"]) {
    if (!asArray(publicPaymentItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.payment_provider evidence missing ${evidence}`);
    }
  }
}

for (const itemId of ["payment_claim_flow", "refund_revoke_flow"]) {
  const item = asArray(release.gates?.closed_beta?.items).find((row) => row.id === itemId);
  if (!item) {
    errors.push(`release-readiness.closed_beta missing ${itemId}`);
    continue;
  }
  for (const evidence of ["data/payment-settlement-reconciliation-drill.json", "scripts/check-payment-settlement-reconciliation.mjs"]) {
    if (!asArray(item.evidence).includes(evidence)) {
      errors.push(`release-readiness.${itemId} evidence missing ${evidence}`);
    }
  }
  if (item.status !== "in_progress") errors.push(`${itemId} must remain in_progress until real payment provider is connected`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Payment settlement reconciliation gate ${drill.schemaVersion}: scenarios=${scenarios.size}, actions=${asArray(drill.requiredActions).length}, blockers=${blockerRows.size}`);
