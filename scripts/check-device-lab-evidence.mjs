import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  DEVICE_SYNC_EVIDENCE_VERSION,
  DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION,
  DEVICE_SYNC_REAL_DEVICE_EXTERNAL_ACCEPTANCE_IDS,
  DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS,
} from "../packages/core/src/index.js";

const PACKET_URL = new URL("../data/device-lab-evidence-packet.json", import.meta.url);
const MATRIX_URL = new URL("../docs/device-matrix-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

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
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (packet.schemaVersion !== "gugu_real_device_lab_evidence_packet_v1") {
  errors.push("packet.schemaVersion must be gugu_real_device_lab_evidence_packet_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(packet.updatedAt || "")) errors.push("packet.updatedAt must be YYYY-MM-DD");
if (packet.status !== "draft_pending_real_ble_captures") {
  errors.push("packet.status must remain draft_pending_real_ble_captures until real BLE captures are attached");
}
if (packet.targetDeviceModel !== "Circle 185") errors.push("packet.targetDeviceModel must be Circle 185");
if (packet.minimumPhysicalDevices < 2) errors.push("packet.minimumPhysicalDevices must be at least 2");
if (packet.evidenceSchema !== DEVICE_SYNC_EVIDENCE_VERSION) {
  errors.push(`packet.evidenceSchema must be ${DEVICE_SYNC_EVIDENCE_VERSION}`);
}
if (packet.transportContract !== DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION) {
  errors.push(`packet.transportContract must be ${DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION}`);
}
for (const band of ["current_shipping", "previous_supported_or_nearest_available"]) {
  if (!asArray(packet.requiredFirmwareBands).includes(band)) errors.push(`requiredFirmwareBands missing ${band}`);
}

const deviceSlots = new Map(asArray(packet.deviceSlots).map((item) => [item.id, item]));
if (deviceSlots.size < packet.minimumPhysicalDevices) {
  errors.push("deviceSlots must cover minimumPhysicalDevices");
}
for (const [slotId, slot] of deviceSlots) {
  if (slot.model !== "Circle 185") errors.push(`deviceSlots.${slotId}.model must be Circle 185`);
  if (slot.status !== "pending_external") errors.push(`deviceSlots.${slotId}.status must remain pending_external`);
  if (!asArray(packet.requiredFirmwareBands).includes(slot.firmwareBand)) {
    errors.push(`deviceSlots.${slotId}.firmwareBand is not in requiredFirmwareBands`);
  }
  for (const field of ["serialNumber", "firmwareVersion"]) {
    if (!slot[field]) errors.push(`deviceSlots.${slotId}.${field} is required`);
  }
}

const matrixCases = new Map(asArray(matrix.matrixCases).map((item) => [item.id, item]));
const captureRows = new Map(asArray(packet.captureRequirements).map((item) => [item.caseId, item]));
for (const caseId of DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS) {
  const matrixCase = matrixCases.get(caseId);
  if (!matrixCase) errors.push(`matrixCases missing ${caseId}`);
  const capture = captureRows.get(caseId);
  if (!capture) {
    errors.push(`captureRequirements missing ${caseId}`);
    continue;
  }
  if (!capture.owner) errors.push(`captureRequirements.${caseId}.owner is required`);
  if (!deviceSlots.has(capture.deviceSlot)) errors.push(`captureRequirements.${caseId}.deviceSlot references unknown device slot`);
  for (const artifact of asArray(matrixCase?.requiredEvidence)) {
    if (!asArray(capture.requiredArtifacts).includes(artifact)) {
      errors.push(`captureRequirements.${caseId}.requiredArtifacts missing matrix artifact ${artifact}`);
    }
  }
  for (const artifact of ["real_ble_session_capture", "native_client_log", "test_operator"]) {
    if (!asArray(capture.requiredArtifacts).includes(artifact)) {
      errors.push(`captureRequirements.${caseId}.requiredArtifacts missing ${artifact}`);
    }
  }
}

if (packet.qaReplay?.command !== "npm run check:device-lab-evidence") {
  errors.push("qaReplay.command must be npm run check:device-lab-evidence");
}
for (const validator of ["validateDeviceSyncEvidence", "validateFakeBleTransportContract", "DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS"]) {
  if (!asArray(packet.qaReplay?.requiredValidators).includes(validator)) {
    errors.push(`qaReplay.requiredValidators missing ${validator}`);
  }
}
if (packet.qaReplay?.status !== "ready_for_real_capture") {
  errors.push("qaReplay.status must be ready_for_real_capture");
}

if (packet.supportHandoff?.diagnosticCodePattern !== "GFS-*") {
  errors.push("supportHandoff.diagnosticCodePattern must be GFS-*");
}
for (const flag of ["macroMappingRequired", "supportDiagnosticBundleRequired", "legacyUseDisclosureRequired"]) {
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

const matrixArtifacts = new Map(asArray(matrix.dataArtifacts).map((item) => [item.id, item]));
if (!matrixArtifacts.has("device_lab_evidence_packet")) {
  errors.push("device-matrix-readiness.dataArtifacts missing device_lab_evidence_packet");
}
const matrixControls = new Map(asArray(matrix.codeControls).map((item) => [item.id, item]));
if (!matrixControls.has("device_lab_evidence_gate")) {
  errors.push("device-matrix-readiness.codeControls missing device_lab_evidence_gate");
}
if (!asArray(matrix.releaseCommands).includes("npm run check:device-lab-evidence")) {
  errors.push("device-matrix-readiness.releaseCommands missing npm run check:device-lab-evidence");
}
if (!(await pathExists("data/device-lab-evidence-packet.json"))) {
  errors.push("data/device-lab-evidence-packet.json must exist");
}

const deviceReadinessItem = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "real_device_matrix");
if (!deviceReadinessItem) {
  errors.push("release-readiness.public_mvp missing real_device_matrix");
} else {
  for (const evidence of ["data/device-lab-evidence-packet.json", "scripts/check-device-lab-evidence.mjs"]) {
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

console.log(`Device lab evidence gate ${packet.schemaVersion}: devices=${deviceSlots.size}, cases=${captureRows.size}, blockers=${blockerRows.size}`);
