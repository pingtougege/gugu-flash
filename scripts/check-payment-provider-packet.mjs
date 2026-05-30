import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PACKET_URL = new URL("../data/payment-provider-integration-packet.json", import.meta.url);
const PAYMENT_URL = new URL("../docs/payment-provider-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const SUPPORT_MACROS_URL = new URL("../docs/support-ticket-macros.md", import.meta.url);

const REQUIRED_WEBHOOKS = ["payment_success_or_failure", "refund_success_or_failure"];
const REQUIRED_REPLAY_SCENARIOS = [
  "payment_provider_sandbox_success",
  "payment_provider_duplicate_event",
  "payment_provider_invalid_signature",
  "payment_provider_amount_mismatch",
  "payment_provider_failed_payment",
  "payment_provider_refund_success",
  "payment_provider_refund_duplicate",
];
const REQUIRED_EXTERNAL_BLOCKERS = [
  "payment_sandbox_credentials",
  "provider_webhook_configuration",
  "production_merchant_approval",
  "key_rotation_runbook",
  "settlement_reconciliation",
];
const REQUIRED_SETTLEMENT_BUCKETS = [
  "provider_paid_missing_order",
  "provider_paid_missing_entitlement",
  "amount_or_currency_mismatch",
  "refund_without_revoke",
  "duplicate_provider_event",
  "settlement_fee_unmapped",
];
const REQUIRED_GUGU_SOURCES = ["orders", "payment_callbacks", "refund_callbacks", "device_entitlements", "settlement_records"];

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
const payment = JSON.parse(await readFile(PAYMENT_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const supportMacros = await readFile(SUPPORT_MACROS_URL, "utf8");
const errors = [];

if (packet.schemaVersion !== "gugu_payment_provider_integration_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_payment_provider_integration_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_real_provider") {
  errors.push("packet.status must remain draft_pending_real_provider until real provider evidence is recorded");
}
if (packet.launchMode !== "free_only_until_provider_approval") {
  errors.push("packet.launchMode must keep paid checkout disabled until provider approval");
}

const provider = packet.provider || {};
for (const field of ["selectedProvider", "merchantId", "sandboxEnvironment", "productionEnvironment", "callbackSecretEnv", "signatureHeader", "idempotencyKey"]) {
  if (!provider[field]) errors.push(`provider.${field} is required`);
}
if (provider.callbackSecretEnv !== "GUGU_FLASH_PAYMENT_CALLBACK_SECRET") errors.push("provider.callbackSecretEnv must be GUGU_FLASH_PAYMENT_CALLBACK_SECRET");
if (provider.signatureHeader !== "X-Gugu-Payment-Signature") errors.push("provider.signatureHeader must be X-Gugu-Payment-Signature");
if (provider.idempotencyKey !== "providerEventId") errors.push("provider.idempotencyKey must be providerEventId");

const webhookRows = new Map(asArray(packet.webhooks).map((item) => [item.id, item]));
for (const webhookId of REQUIRED_WEBHOOKS) {
  const webhook = webhookRows.get(webhookId);
  if (!webhook) {
    errors.push(`webhooks missing ${webhookId}`);
    continue;
  }
  if (webhook.method !== "POST") errors.push(`${webhookId}: method must be POST`);
  if (!String(webhook.path || "").startsWith("/flash/operator/")) errors.push(`${webhookId}: path must be an operator route`);
  for (const field of ["providerEventId", "orderId", "status"]) {
    if (!asArray(webhook.requiredFields).includes(field)) errors.push(`${webhookId}: requiredFields missing ${field}`);
  }
  if (!asArray(webhook.controls).includes("idempotent_provider_event")) errors.push(`${webhookId}: controls missing idempotent_provider_event`);
}
if (!asArray(webhookRows.get("payment_success_or_failure")?.controls).includes("amount_currency_match")) {
  errors.push("payment_success_or_failure: controls missing amount_currency_match");
}
if (!asArray(webhookRows.get("payment_success_or_failure")?.controls).includes("no_entitlement_on_mismatch")) {
  errors.push("payment_success_or_failure: controls missing no_entitlement_on_mismatch");
}
if (!asArray(webhookRows.get("refund_success_or_failure")?.controls).includes("entitlement_revoke_on_success")) {
  errors.push("refund_success_or_failure: controls missing entitlement_revoke_on_success");
}

if (packet.sandboxReplay?.command !== "npm run check:payment-replay") {
  errors.push("sandboxReplay.command must be npm run check:payment-replay");
}
if (packet.sandboxReplay?.version !== "gugu_flash_payment_provider_replay_v1") {
  errors.push("sandboxReplay.version must match the replay script output version");
}
for (const scenarioId of REQUIRED_REPLAY_SCENARIOS) {
  if (!asArray(packet.sandboxReplay?.requiredScenarios).includes(scenarioId)) {
    errors.push(`sandboxReplay.requiredScenarios missing ${scenarioId}`);
  }
}

const settlement = packet.settlementReconciliation || {};
if (!settlement.owner) errors.push("settlementReconciliation.owner is required");
for (const source of REQUIRED_GUGU_SOURCES) {
  if (!asArray(settlement.guguRecordSources).includes(source)) errors.push(`settlementReconciliation.guguRecordSources missing ${source}`);
}
for (const bucket of REQUIRED_SETTLEMENT_BUCKETS) {
  if (!asArray(settlement.mismatchBuckets).includes(bucket)) errors.push(`settlementReconciliation.mismatchBuckets missing ${bucket}`);
}
for (const column of ["providerEventId", "providerPaymentId", "providerRefundId", "merchantOrderId", "grossAmount", "currency", "settlementDate", "status"]) {
  if (!asArray(settlement.providerExportRequiredColumns).includes(column)) {
    errors.push(`settlementReconciliation.providerExportRequiredColumns missing ${column}`);
  }
}
if (!asArray(settlement.requiredActions).includes("open_support_diagnostic_bundle")) {
  errors.push("settlementReconciliation.requiredActions missing open_support_diagnostic_bundle");
}

const rotation = packet.keyRotation || {};
if (rotation.secretEnv !== "GUGU_FLASH_PAYMENT_CALLBACK_SECRET") errors.push("keyRotation.secretEnv must be GUGU_FLASH_PAYMENT_CALLBACK_SECRET");
for (const evidence of ["old_secret_reject_after_cutover", "new_secret_acceptance", "webhook_retry_no_duplicate_entitlement", "rollback_secret_documented"]) {
  if (!asArray(rotation.requiredEvidence).includes(evidence)) errors.push(`keyRotation.requiredEvidence missing ${evidence}`);
}

const handoff = packet.supportHandoff || {};
if (handoff.diagnosticEndpoint !== "/flash/operator/support-diagnostics") errors.push("supportHandoff.diagnosticEndpoint must be /flash/operator/support-diagnostics");
for (const lookup of ["orderId", "providerEventId", "providerPaymentId", "providerRefundId", "deviceId", "entitlementId"]) {
  if (!asArray(handoff.requiredLookupFields).includes(lookup)) errors.push(`supportHandoff.requiredLookupFields missing ${lookup}`);
}
for (const macro of asArray(handoff.requiredMacros)) {
  if (!supportMacros.includes(macro)) errors.push(`supportHandoff.requiredMacros missing from support macros: ${macro}`);
}

const externalRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
const paymentExternal = new Set(asArray(payment.externalAcceptance).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = externalRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
  if (!paymentExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from payment-provider externalAcceptance`);
}

const artifacts = new Map(asArray(payment.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("payment_provider_integration_packet")) {
  errors.push("payment-provider-readiness.dataArtifacts missing payment_provider_integration_packet");
}
const controls = new Map(asArray(payment.codeControls).map((item) => [item.id, item]));
if (!controls.has("payment_provider_packet_gate")) {
  errors.push("payment-provider-readiness.codeControls missing payment_provider_packet_gate");
}
if (!asArray(payment.releaseCommands).includes("npm run check:payment-provider-packet")) {
  errors.push("payment-provider-readiness.releaseCommands missing npm run check:payment-provider-packet");
}
if (!(await pathExists("data/payment-provider-integration-packet.json"))) {
  errors.push("data/payment-provider-integration-packet.json must exist");
}

const paymentItem = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "payment_provider");
if (!paymentItem) {
  errors.push("release-readiness.public_mvp missing payment_provider");
} else {
  for (const evidence of ["data/payment-provider-integration-packet.json", "scripts/check-payment-provider-packet.mjs"]) {
    if (!asArray(paymentItem.evidence).includes(evidence)) errors.push(`release-readiness.payment_provider evidence missing ${evidence}`);
  }
  if (paymentItem.status !== "in_progress") errors.push("payment_provider must remain in_progress until real provider approval exists");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Payment provider packet gate ${packet.schemaVersion}: webhooks=${webhookRows.size}, replay=${asArray(packet.sandboxReplay?.requiredScenarios).length}, blockers=${externalRows.size}`);
