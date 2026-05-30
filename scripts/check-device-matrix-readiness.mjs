import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const MATRIX_URL = new URL("../docs/device-matrix-readiness.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_CASES = [
  "circle185_current_firmware_nominal",
  "circle185_low_battery_block",
  "circle185_low_storage_block",
  "circle185_ble_disconnect_retry",
  "circle185_write_failed_rollback",
  "circle185_verify_success",
  "circle185_legacy_delisted_use",
];

const REQUIRED_EXTERNAL_ACCEPTANCE = [
  "two_physical_devices",
  "firmware_spread",
  "real_ble_session_capture",
  "hardware_lead_signoff",
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

const matrix = JSON.parse(await readFile(MATRIX_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!matrix.version) errors.push("device-matrix-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(matrix.updatedAt || "")) {
  errors.push("device-matrix-readiness: updatedAt must be YYYY-MM-DD");
}
if (matrix.status !== "draft_pending_real_devices") {
  errors.push("device-matrix-readiness: status must remain draft_pending_real_devices until real device evidence is signed off");
}

for (const document of asArray(matrix.documents)) {
  if (!document.id) errors.push("device matrix document missing id");
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

for (const control of asArray(matrix.codeControls)) {
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

for (const artifact of asArray(matrix.dataArtifacts)) {
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

const caseRows = new Map(asArray(matrix.matrixCases).map((item) => [item.id, item]));
for (const caseId of REQUIRED_CASES) {
  const row = caseRows.get(caseId);
  if (!row) {
    errors.push(`matrixCases: missing ${caseId}`);
    continue;
  }
  if (row.deviceModel !== "Circle 185") errors.push(`matrixCases.${caseId}: deviceModel must be Circle 185`);
  for (const field of ["owner", "firmwareBand", "batteryBand", "storageBand", "expectedStatus"]) {
    if (!row[field]) errors.push(`matrixCases.${caseId}: missing ${field}`);
  }
  if (!asArray(row.requiredEvidence).length) errors.push(`matrixCases.${caseId}: missing requiredEvidence`);
}

const expectedFailureReasons = new Map([
  ["circle185_low_battery_block", "low_battery"],
  ["circle185_low_storage_block", "insufficient_storage"],
  ["circle185_ble_disconnect_retry", "ble_disconnected"],
  ["circle185_write_failed_rollback", "write_failed"],
  ["circle185_legacy_delisted_use", "hardware_pack_unavailable"],
]);
for (const [caseId, failureReason] of expectedFailureReasons) {
  if (caseRows.get(caseId)?.failureReason !== failureReason) {
    errors.push(`matrixCases.${caseId}: failureReason must be ${failureReason}`);
  }
}

for (const command of asArray(matrix.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const externalRows = new Map(asArray(matrix.externalAcceptance).map((item) => [item.id, item]));
for (const itemId of REQUIRED_EXTERNAL_ACCEPTANCE) {
  const item = externalRows.get(itemId);
  if (!item) {
    errors.push(`externalAcceptance: missing ${itemId}`);
    continue;
  }
  if (item.status !== "pending_external") errors.push(`${itemId}: must remain pending_external until real hardware work is recorded`);
  if (!item.needed) errors.push(`${itemId}: missing needed`);
}

const deviceReadinessItem = asArray(readiness.gates?.public_mvp?.items).find((item) => item.id === "real_device_matrix");
if (!deviceReadinessItem) {
  errors.push("release-readiness.public_mvp: missing real_device_matrix item");
} else {
  for (const evidence of [
    "docs/device-sync-plan.md",
    "docs/real-device-matrix-plan.md",
    "docs/device-matrix-readiness.json",
    "data/device-lab-evidence-packet.json",
    "data/device-sync-certification-packet.json",
    "scripts/check-device-matrix-readiness.mjs",
    "scripts/check-device-lab-evidence.mjs",
    "scripts/check-device-sync-certification.mjs",
    "packages/core/src/gugu-device-sync-evidence.js",
    "packages/core/src/gugu-device-sync-evidence.test.js",
  ]) {
    if (!asArray(deviceReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.real_device_matrix: evidence must include ${evidence}`);
    }
  }
  if (deviceReadinessItem.status !== "in_progress") {
    errors.push("release-readiness.real_device_matrix: status must be in_progress until real devices are signed off");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const pending = asArray(matrix.externalAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`Device matrix readiness gate ${matrix.version}: cases=${caseRows.size}, controls=${asArray(matrix.codeControls).length}, artifacts=${asArray(matrix.dataArtifacts).length}, pending_external=${pending}`);
