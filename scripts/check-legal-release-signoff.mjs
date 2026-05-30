import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PACKET_URL = new URL("../data/legal-release-signoff-packet.json", import.meta.url);
const APPROVAL_URL = new URL("../data/legal-approval-packet.json", import.meta.url);
const COVERAGE_URL = new URL("../docs/legal-terms-coverage.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_DOCUMENTS = [
  "user_agreement",
  "creator_terms",
  "store_listing_terms",
  "rights_claim_appeal_policy",
  "privacy_notice",
];
const REQUIRED_COPY_CHECKS = [
  "device_scoped_entitlement",
  "refund_revokes_new_rights",
  "sync_failure_preserves_content",
  "fanwork_ip_pool_required",
  "personal_information_notice",
];
const REQUIRED_DATA_CATEGORIES = [
  "account_session",
  "ugc_content",
  "comments_reports_claims_appeals",
  "device_sync_diagnostics",
  "orders_entitlements_payments_refunds",
  "support_cases",
  "operation_logs",
];
const REQUIRED_SPECIAL_HANDLING = [
  "minors_information",
  "sensitive_personal_information",
  "cross_border_data",
  "third_party_processors",
  "retention_and_deletion",
];
const REQUIRED_EXTERNAL_BLOCKERS = [
  "legal_counsel_approval",
  "privacy_owner_approval",
  "product_acceptance_copy_signoff",
  "commerce_refund_terms_signoff",
];
const REQUIRED_COMMANDS = [
  "npm run check:legal",
  "npm run check:legal-approval",
  "npm run check:legal-release-signoff",
  "npm run test:e2e",
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
const approval = JSON.parse(await readFile(APPROVAL_URL, "utf8"));
const coverage = JSON.parse(await readFile(COVERAGE_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_legal_release_signoff_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_legal_release_signoff_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_external_legal_signoff") {
  errors.push("packet.status must remain draft_pending_external_legal_signoff until signoff is complete");
}
if (packet.releaseScope !== approval.reviewScope) errors.push("packet.releaseScope must match legal approval reviewScope");
if (packet.sourcePacket !== "data/legal-approval-packet.json") errors.push("packet.sourcePacket must be data/legal-approval-packet.json");

const approvalDocuments = new Map(asArray(approval.documentsForCounsel).map((item) => [item.id, item]));
const documentRows = new Map(asArray(packet.finalDocumentSet).map((item) => [item.id, item]));
for (const documentId of REQUIRED_DOCUMENTS) {
  const row = documentRows.get(documentId);
  const source = approvalDocuments.get(documentId === "privacy_notice" ? "privacy_notice_checklist" : documentId);
  if (!row) {
    errors.push(`finalDocumentSet missing ${documentId}`);
    continue;
  }
  if (!source) errors.push(`legal approval packet missing source document for ${documentId}`);
  if (!(await pathExists(row.sourceFile))) errors.push(`finalDocumentSet.${documentId}.sourceFile missing: ${row.sourceFile}`);
  const content = await readFile(resolve(row.sourceFile), "utf8");
  if (!content.includes(row.section)) errors.push(`finalDocumentSet.${documentId}.section missing from source file`);
  if (row.versionFrozen !== false) errors.push(`finalDocumentSet.${documentId}.versionFrozen must remain false until external approval`);
  if (!row.requiredApprover) errors.push(`finalDocumentSet.${documentId}.requiredApprover is required`);
}

const copyRows = new Map(asArray(packet.copyConsistencyChecks).map((item) => [item.id, item]));
for (const copyId of REQUIRED_COPY_CHECKS) {
  const row = copyRows.get(copyId);
  if (!row) {
    errors.push(`copyConsistencyChecks missing ${copyId}`);
    continue;
  }
  if (!row.requiredCopyMarker) errors.push(`copyConsistencyChecks.${copyId}.requiredCopyMarker is required`);
  let found = false;
  for (const evidence of asArray(row.evidence)) {
    if (!(await pathExists(evidence))) {
      errors.push(`copyConsistencyChecks.${copyId}.evidence missing: ${evidence}`);
      continue;
    }
    const content = await readFile(resolve(evidence), "utf8");
    found ||= content.includes(row.requiredCopyMarker);
  }
  if (!found) errors.push(`copyConsistencyChecks.${copyId}.requiredCopyMarker not found in evidence`);
}

for (const category of REQUIRED_DATA_CATEGORIES) {
  if (!asArray(packet.privacySignoff?.requiredDataCategories).includes(category)) {
    errors.push(`privacySignoff.requiredDataCategories missing ${category}`);
  }
  if (!asArray(approval.privacyReview?.requiredDataCategories).includes(category)) {
    errors.push(`approval.privacyReview.requiredDataCategories missing ${category}`);
  }
}
for (const item of REQUIRED_SPECIAL_HANDLING) {
  if (!asArray(packet.privacySignoff?.specialHandling).includes(item)) {
    errors.push(`privacySignoff.specialHandling missing ${item}`);
  }
}
if (packet.privacySignoff?.approvalStatus !== "pending_external") {
  errors.push("privacySignoff.approvalStatus must remain pending_external");
}

if (packet.commerceSignoff?.paidCheckoutEnabled !== false) errors.push("commerceSignoff.paidCheckoutEnabled must be false");
if (packet.commerceSignoff?.paidContentCopy !== "disabled_until_payment_provider_approval") {
  errors.push("commerceSignoff.paidContentCopy must be disabled_until_payment_provider_approval");
}
for (const field of ["refundTermsApproval", "providerCallbackCopyApproval", "settlementDisclosureApproval"]) {
  if (packet.commerceSignoff?.[field] !== "pending_external") {
    errors.push(`commerceSignoff.${field} must remain pending_external`);
  }
}

if (packet.acceptanceUx?.storeTermsCheckbox !== approval.acceptanceUx?.storeTermsCheckbox) {
  errors.push("acceptanceUx.storeTermsCheckbox must match approval packet");
}
if (packet.acceptanceUx?.deviceSyncTermsCheckbox !== approval.acceptanceUx?.deviceSyncTermsCheckbox) {
  errors.push("acceptanceUx.deviceSyncTermsCheckbox must match approval packet");
}
if (packet.acceptanceUx?.mustBlockStoreListingWithoutTerms !== true) {
  errors.push("acceptanceUx.mustBlockStoreListingWithoutTerms must be true");
}
if (packet.acceptanceUx?.mustShowDeviceSyncWarning !== true) {
  errors.push("acceptanceUx.mustShowDeviceSyncWarning must be true");
}
for (const evidence of asArray(packet.acceptanceUx?.e2eEvidence)) {
  if (!(await pathExists(evidence))) errors.push(`acceptanceUx.e2eEvidence missing: ${evidence}`);
}

for (const command of REQUIRED_COMMANDS) {
  if (!asArray(packet.releasePolicy?.requiredCommands).includes(command)) {
    errors.push(`releasePolicy.requiredCommands missing ${command}`);
  }
}
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  if (!asArray(packet.releasePolicy?.mustRemainInProgressUntil).includes(blockerId)) {
    errors.push(`releasePolicy.mustRemainInProgressUntil missing ${blockerId}`);
  }
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
const approvalBlockers = new Set(asArray(approval.externalBlockers).map((item) => item.id));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId}.exitCriteria is required`);
  if (!approvalBlockers.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from approval packet`);
}

const artifacts = new Map(asArray(coverage.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("legal_release_signoff_packet")) {
  errors.push("legal-terms-coverage.dataArtifacts missing legal_release_signoff_packet");
}
const controls = new Map(asArray(coverage.codeControls).map((item) => [item.id, item]));
if (!controls.has("legal_release_signoff_gate")) {
  errors.push("legal-terms-coverage.codeControls missing legal_release_signoff_gate");
}
if (!asArray(coverage.releaseCommands).includes("npm run check:legal-release-signoff")) {
  errors.push("legal-terms-coverage.releaseCommands missing npm run check:legal-release-signoff");
}
if (!(await pathExists("data/legal-release-signoff-packet.json"))) {
  errors.push("data/legal-release-signoff-packet.json must exist");
}

const legalReadinessItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "legal_terms");
if (!legalReadinessItem) {
  errors.push("release-readiness.closed_beta missing legal_terms");
} else {
  for (const evidence of ["data/legal-release-signoff-packet.json", "scripts/check-legal-release-signoff.mjs"]) {
    if (!asArray(legalReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.legal_terms evidence missing ${evidence}`);
    }
  }
  if (legalReadinessItem.status !== "in_progress") {
    errors.push("legal_terms must remain in_progress until counsel approval is recorded");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Legal release signoff gate ${packet.schemaVersion}: documents=${documentRows.size}, copy=${copyRows.size}, blockers=${blockerRows.size}`);
