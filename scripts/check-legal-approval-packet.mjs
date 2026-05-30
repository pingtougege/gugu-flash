import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const PACKET_URL = new URL("../data/legal-approval-packet.json", import.meta.url);
const COVERAGE_URL = new URL("../docs/legal-terms-coverage.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_DOCUMENTS = [
  "user_agreement",
  "creator_terms",
  "store_listing_terms",
  "rights_claim_appeal_policy",
  "privacy_notice_checklist",
];
const REQUIRED_RISK_DISCLOSURES = [
  "device_scoped_entitlement",
  "refund_revokes_new_rights",
  "sync_failure_preserves_content",
  "ugc_rights_and_ip_pool",
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
const coverage = JSON.parse(await readFile(COVERAGE_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_legal_approval_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_legal_approval_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_legal_counsel_approval") {
  errors.push("packet.status must remain draft_pending_legal_counsel_approval until counsel approves");
}
if (packet.reviewScope !== "closed_beta_external_users") errors.push("packet.reviewScope must be closed_beta_external_users");
if (!String(packet.disclaimer || "").toLowerCase().includes("not legal advice")) {
  errors.push("packet.disclaimer must state not legal advice");
}

const knownSourceRefs = new Set(asArray(coverage.sourceRefs).map((item) => item.id));
for (const sourceRef of asArray(packet.sourceRefs)) {
  if (!knownSourceRefs.has(sourceRef)) errors.push(`packet.sourceRefs includes unknown source ${sourceRef}`);
}
for (const sourceRef of knownSourceRefs) {
  if (!asArray(packet.sourceRefs).includes(sourceRef)) errors.push(`packet.sourceRefs missing ${sourceRef}`);
}

const documentRows = new Map(asArray(packet.documentsForCounsel).map((item) => [item.id, item]));
for (const documentId of REQUIRED_DOCUMENTS) {
  const document = documentRows.get(documentId);
  if (!document) {
    errors.push(`documentsForCounsel missing ${documentId}`);
    continue;
  }
  if (!(await pathExists(document.sourceFile))) errors.push(`documentsForCounsel.${documentId}.sourceFile missing: ${document.sourceFile}`);
  if (!document.section) errors.push(`documentsForCounsel.${documentId}.section is required`);
  if (document.approvalStatus !== "pending_external") {
    errors.push(`documentsForCounsel.${documentId}.approvalStatus must remain pending_external`);
  }
  const content = await readFile(resolve(document.sourceFile), "utf8");
  if (!content.includes(document.section)) errors.push(`documentsForCounsel.${documentId}.section missing from source file`);
}

const riskRows = new Map(asArray(packet.riskDisclosures).map((item) => [item.id, item]));
for (const riskId of REQUIRED_RISK_DISCLOSURES) {
  const risk = riskRows.get(riskId);
  if (!risk) {
    errors.push(`riskDisclosures missing ${riskId}`);
    continue;
  }
  if (risk.approvalStatus !== "pending_external") errors.push(`riskDisclosures.${riskId}.approvalStatus must remain pending_external`);
  if (!risk.requiredCopyMarker) errors.push(`riskDisclosures.${riskId}.requiredCopyMarker is required`);
  const evidence = asArray(risk.uiEvidence);
  if (!evidence.length) errors.push(`riskDisclosures.${riskId}.uiEvidence is required`);
  let markerFound = false;
  for (const file of evidence) {
    if (!(await pathExists(file))) {
      errors.push(`riskDisclosures.${riskId}.uiEvidence missing: ${file}`);
      continue;
    }
    const content = await readFile(resolve(file), "utf8");
    markerFound ||= content.includes(risk.requiredCopyMarker);
  }
  if (!markerFound) errors.push(`riskDisclosures.${riskId}.requiredCopyMarker not found in evidence files`);
}

for (const category of REQUIRED_DATA_CATEGORIES) {
  if (!asArray(packet.privacyReview?.requiredDataCategories).includes(category)) {
    errors.push(`privacyReview.requiredDataCategories missing ${category}`);
  }
}
for (const item of REQUIRED_SPECIAL_HANDLING) {
  if (!asArray(packet.privacyReview?.specialHandling).includes(item)) {
    errors.push(`privacyReview.specialHandling missing ${item}`);
  }
}
if (packet.privacyReview?.approvalStatus !== "pending_external") {
  errors.push("privacyReview.approvalStatus must remain pending_external");
}

if (packet.acceptanceUx?.storeTermsCheckbox !== "storeTermsAccepted") {
  errors.push("acceptanceUx.storeTermsCheckbox must be storeTermsAccepted");
}
if (packet.acceptanceUx?.deviceSyncTermsCheckbox !== "deviceSyncTermsAccepted") {
  errors.push("acceptanceUx.deviceSyncTermsCheckbox must be deviceSyncTermsAccepted");
}
if (packet.acceptanceUx?.approvalStatus !== "drafted") errors.push("acceptanceUx.approvalStatus must be drafted");
for (const file of asArray(packet.acceptanceUx?.e2eEvidence)) {
  if (!(await pathExists(file))) errors.push(`acceptanceUx.e2eEvidence missing: ${file}`);
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
for (const blockerId of REQUIRED_EXTERNAL_BLOCKERS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
}

const coverageArtifacts = new Map(asArray(coverage.dataArtifacts).map((item) => [item.id, item]));
if (!coverageArtifacts.has("legal_approval_packet")) {
  errors.push("legal-terms-coverage.dataArtifacts missing legal_approval_packet");
}
const coverageControls = new Map(asArray(coverage.codeControls).map((item) => [item.id, item]));
if (!coverageControls.has("legal_approval_packet_gate")) {
  errors.push("legal-terms-coverage.codeControls missing legal_approval_packet_gate");
}
if (!asArray(coverage.releaseCommands).includes("npm run check:legal-approval")) {
  errors.push("legal-terms-coverage.releaseCommands missing npm run check:legal-approval");
}
if (!(await pathExists("data/legal-approval-packet.json"))) {
  errors.push("data/legal-approval-packet.json must exist");
}

const legalReadinessItem = asArray(readiness.gates?.closed_beta?.items).find((item) => item.id === "legal_terms");
if (!legalReadinessItem) {
  errors.push("release-readiness.closed_beta missing legal_terms");
} else {
  for (const evidence of ["data/legal-approval-packet.json", "scripts/check-legal-approval-packet.mjs"]) {
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

console.log(`Legal approval packet gate ${packet.schemaVersion}: documents=${documentRows.size}, risks=${riskRows.size}, blockers=${blockerRows.size}`);
