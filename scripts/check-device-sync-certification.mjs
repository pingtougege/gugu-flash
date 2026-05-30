import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  DEVICE_SYNC_EVIDENCE_VERSION,
  DEVICE_SYNC_REAL_DEVICE_EXTERNAL_ACCEPTANCE_IDS,
  DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS,
} from "../packages/core/src/index.js";

const PACKET_URL = new URL("../data/device-sync-certification-packet.json", import.meta.url);
const MATRIX_URL = new URL("../docs/device-matrix-readiness.json", import.meta.url);
const LAB_URL = new URL("../data/device-lab-evidence-packet.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const SUPPORT_MACROS_URL = new URL("../docs/support-ticket-macros.md", import.meta.url);

const REQUIRED_LOG_FIELDS = [
  "deviceId",
  "deviceModel",
  "firmwareVersion",
  "batteryPercent",
  "availableStorageBytes",
  "packId",
  "hardwarePackId",
  "syncJobId",
  "transportSessionId",
  "rollbackStatus",
  "diagnosticCode",
];
const REQUIRED_CRITICAL_FAILURES = [
  "checksum_mismatch",
  "rollback_missing_after_write_failed",
  "previous_content_lost",
  "new_sync_allowed_for_delisted_pack",
  "missing_support_diagnostic",
];
const REQUIRED_COMMANDS = [
  "npm run check:device-matrix",
  "npm run check:device-lab-evidence",
  "npm run check:device-sync-certification",
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
const matrix = JSON.parse(await readFile(MATRIX_URL, "utf8"));
const lab = JSON.parse(await readFile(LAB_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const supportMacros = await readFile(SUPPORT_MACROS_URL, "utf8");
const errors = [];

if (packet.schemaVersion !== "gugu_device_sync_certification_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_device_sync_certification_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_real_device_certification") {
  errors.push("packet.status must remain draft_pending_real_device_certification until real device certification is signed");
}
if (packet.targetDeviceModel !== "Circle 185") errors.push("packet.targetDeviceModel must be Circle 185");
if (packet.evidenceSchema !== DEVICE_SYNC_EVIDENCE_VERSION) {
  errors.push(`packet.evidenceSchema must be ${DEVICE_SYNC_EVIDENCE_VERSION}`);
}
if (packet.minimumPhysicalDevices < 2) errors.push("packet.minimumPhysicalDevices must be at least 2");

const deviceRows = new Map(asArray(packet.requiredDevices).map((item) => [item.slot, item]));
if (deviceRows.size < packet.minimumPhysicalDevices) errors.push("requiredDevices must cover minimumPhysicalDevices");
for (const [slot, device] of deviceRows) {
  if (device.model !== "Circle 185") errors.push(`requiredDevices.${slot}.model must be Circle 185`);
  if (!asArray(lab.deviceSlots).some((labSlot) => labSlot.id === slot)) {
    errors.push(`requiredDevices.${slot} must map to a lab evidence deviceSlot`);
  }
  for (const field of ["firmwareBand", "serialNumber", "role"]) {
    if (!device[field]) errors.push(`requiredDevices.${slot}.${field} is required`);
  }
}

const matrixCases = new Map(asArray(matrix.matrixCases).map((item) => [item.id, item]));
const labCases = new Map(asArray(lab.captureRequirements).map((item) => [item.caseId, item]));
const certificationCases = new Map(asArray(packet.certificationCases).map((item) => [item.id, item]));
for (const caseId of DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS) {
  const row = certificationCases.get(caseId);
  if (!row) {
    errors.push(`certificationCases missing ${caseId}`);
    continue;
  }
  const matrixCase = matrixCases.get(caseId);
  const labCase = labCases.get(caseId);
  if (!matrixCase) errors.push(`matrixCases missing ${caseId}`);
  if (!labCase) errors.push(`lab captureRequirements missing ${caseId}`);
  if (row.requiredOutcome !== matrixCase?.expectedStatus) {
    errors.push(`certificationCases.${caseId}.requiredOutcome must match matrix expectedStatus`);
  }
  if (matrixCase?.failureReason && row.requiredFailureReason !== matrixCase.failureReason) {
    errors.push(`certificationCases.${caseId}.requiredFailureReason must be ${matrixCase.failureReason}`);
  }
  for (const artifact of asArray(labCase?.requiredArtifacts)) {
    if (!asArray(row.requiredArtifacts).includes(artifact)) {
      errors.push(`certificationCases.${caseId}.requiredArtifacts missing lab artifact ${artifact}`);
    }
  }
  if (!asArray(row.passCriteria).length) errors.push(`certificationCases.${caseId}.passCriteria is required`);
}

for (const field of REQUIRED_LOG_FIELDS) {
  if (!asArray(packet.nativeClientCapture?.requiredLogFields).includes(field)) {
    errors.push(`nativeClientCapture.requiredLogFields missing ${field}`);
  }
}
for (const rule of ["no_raw_auth_tokens", "no_payment_secrets", "hash_device_serial_in_support_exports"]) {
  if (!asArray(packet.nativeClientCapture?.redactionRules).includes(rule)) {
    errors.push(`nativeClientCapture.redactionRules missing ${rule}`);
  }
}
for (const event of ["connect", "preflight", "write_start", "verify", "rollback", "disconnect"]) {
  if (!asArray(packet.nativeClientCapture?.transportEvents).includes(event)) {
    errors.push(`nativeClientCapture.transportEvents missing ${event}`);
  }
}

if (packet.releaseAcceptance?.allCasesRequired !== true) errors.push("releaseAcceptance.allCasesRequired must be true");
for (const failure of REQUIRED_CRITICAL_FAILURES) {
  if (!asArray(packet.releaseAcceptance?.criticalFailuresBlockRelease).includes(failure)) {
    errors.push(`releaseAcceptance.criticalFailuresBlockRelease missing ${failure}`);
  }
}
for (const command of REQUIRED_COMMANDS) {
  if (!asArray(packet.releaseAcceptance?.requiredCommands).includes(command)) {
    errors.push(`releaseAcceptance.requiredCommands missing ${command}`);
  }
}

for (const macro of asArray(packet.supportHandoff?.requiredMacros)) {
  if (!supportMacros.includes(macro)) errors.push(`supportHandoff.requiredMacros missing from support macros: ${macro}`);
}
if (packet.supportHandoff?.diagnosticCodePattern !== "GFS-*") errors.push("supportHandoff.diagnosticCodePattern must be GFS-*");
for (const flag of ["bundleRequired", "knownLimitationsRequired"]) {
  if (packet.supportHandoff?.[flag] !== true) errors.push(`supportHandoff.${flag} must be true`);
}
for (const role of ["nativeHardwareLead", "qaLead", "supportLead", "releaseManager"]) {
  if (packet.signoff?.[role] !== "pending_external") errors.push(`signoff.${role} must remain pending_external`);
}

const blockerRows = new Map(asArray(packet.externalBlockers).map((item) => [item.id, item]));
const matrixExternal = new Set(asArray(matrix.externalAcceptance).map((item) => item.id));
for (const blockerId of DEVICE_SYNC_REAL_DEVICE_EXTERNAL_ACCEPTANCE_IDS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId} must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId} missing owner`);
  if (!asArray(blocker.exitCriteria).length) errors.push(`externalBlockers.${blockerId} missing exitCriteria`);
  if (!matrixExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from device matrix externalAcceptance`);
}

const artifacts = new Map(asArray(matrix.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("device_sync_certification_packet")) {
  errors.push("device-matrix-readiness.dataArtifacts missing device_sync_certification_packet");
}
const controls = new Map(asArray(matrix.codeControls).map((item) => [item.id, item]));
if (!controls.has("device_sync_certification_gate")) {
  errors.push("device-matrix-readiness.codeControls missing device_sync_certification_gate");
}
if (!asArray(matrix.releaseCommands).includes("npm run check:device-sync-certification")) {
  errors.push("device-matrix-readiness.releaseCommands missing npm run check:device-sync-certification");
}
if (!(await pathExists("data/device-sync-certification-packet.json"))) {
  errors.push("data/device-sync-certification-packet.json must exist");
}

const deviceReadinessItem = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "real_device_matrix");
if (!deviceReadinessItem) {
  errors.push("release-readiness.public_mvp missing real_device_matrix");
} else {
  for (const evidence of ["data/device-sync-certification-packet.json", "scripts/check-device-sync-certification.mjs"]) {
    if (!asArray(deviceReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.real_device_matrix evidence missing ${evidence}`);
    }
  }
  if (deviceReadinessItem.status !== "in_progress") {
    errors.push("real_device_matrix must remain in_progress until real hardware evidence is signed off");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Device sync certification gate ${packet.schemaVersion}: devices=${deviceRows.size}, cases=${certificationCases.size}, blockers=${blockerRows.size}`);
