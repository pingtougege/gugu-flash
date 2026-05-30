import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  DEVICE_SYNC_EVIDENCE_VERSION,
  DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION,
  DEVICE_SYNC_FAKE_TRANSPORT_EVENTS,
  DEVICE_SYNC_REAL_DEVICE_EXTERNAL_ACCEPTANCE_IDS,
  DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS,
  createDeviceSyncEvidence,
  validateDeviceSyncEvidence,
} from "../packages/core/src/index.js";

const DRILL_URL = new URL("../data/device-sync-regression-drill.json", import.meta.url);
const MATRIX_URL = new URL("../docs/device-matrix-readiness.json", import.meta.url);
const LAB_URL = new URL("../data/device-lab-evidence-packet.json", import.meta.url);
const CERT_URL = new URL("../data/device-sync-certification-packet.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);
const SUPPORT_MACROS_URL = new URL("../docs/support-ticket-macros.md", import.meta.url);

const REQUIRED_COMMANDS = [
  "npm run check:device-matrix",
  "npm run check:device-lab-evidence",
  "npm run check:device-sync-certification",
  "npm run check:device-sync-regression",
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

function makeJob(caseId, row) {
  const steps = row.simulatedStatus === "installed"
    ? ["created", "downloading", "downloaded", "syncing", "verifying", "installed"]
    : row.simulatedStatus === "blocked"
      ? ["created", "compatibility_checking", "blocked"]
      : ["created", "downloading", "downloaded", "syncing", "failed"];

  return {
    id: `sync_${caseId}`,
    deviceId: "circle185_fake_lab",
    deviceName: "Circle 185 fake BLE lab",
    storeId: `store_${caseId}`,
    packId: `pack_${caseId}`,
    hardwarePackId: `hw_${caseId}`,
    status: row.simulatedStatus,
    failureReason: row.failureReason || null,
    diagnosticCode: row.diagnosticCode,
    previousStoreId: row.rollbackStatus === "restored_previous" ? "store_previous_content" : null,
    retryOf: row.retryOfRequired ? `sync_${caseId}_first_attempt` : null,
    rollbackStatus: row.rollbackStatus,
    steps,
    clientVersion: "native-regression-drill",
    firmwareVersion: "fake-current-or-previous",
    bleProtocolVersion: "fake_ble_v1",
    createdAt: 1760000000000,
    updatedAt: 1760000001000,
  };
}

const drill = JSON.parse(await readFile(DRILL_URL, "utf8"));
const matrix = JSON.parse(await readFile(MATRIX_URL, "utf8"));
const lab = JSON.parse(await readFile(LAB_URL, "utf8"));
const cert = JSON.parse(await readFile(CERT_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const supportMacros = await readFile(SUPPORT_MACROS_URL, "utf8");
const errors = [];

if (drill.schemaVersion !== "gugu_device_sync_regression_drill_v1") {
  errors.push("drill.schemaVersion must be gugu_device_sync_regression_drill_v1");
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(drill.updatedAt || "")) errors.push("drill.updatedAt must be YYYY-MM-DD");
if (drill.status !== "draft_ready_for_real_device_replay") {
  errors.push("drill.status must remain draft_ready_for_real_device_replay");
}
if (drill.targetDeviceModel !== "Circle 185") errors.push("drill.targetDeviceModel must be Circle 185");
if (drill.evidenceSchema !== DEVICE_SYNC_EVIDENCE_VERSION) errors.push(`drill.evidenceSchema must be ${DEVICE_SYNC_EVIDENCE_VERSION}`);
if (drill.transportContract !== DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION) {
  errors.push(`drill.transportContract must be ${DEVICE_SYNC_FAKE_TRANSPORT_CONTRACT_VERSION}`);
}
for (const packetPath of ["data/device-lab-evidence-packet.json", "data/device-sync-certification-packet.json"]) {
  if (!asArray(drill.sourcePackets).includes(packetPath)) errors.push(`sourcePackets missing ${packetPath}`);
  if (!(await pathExists(packetPath))) errors.push(`source packet missing ${packetPath}`);
}

const matrixCases = new Map(asArray(matrix.matrixCases).map((item) => [item.id, item]));
const labCases = new Map(asArray(lab.captureRequirements).map((item) => [item.caseId, item]));
const certCases = new Map(asArray(cert.certificationCases).map((item) => [item.id, item]));
const regressionCases = new Map(asArray(drill.localRegressionCases).map((item) => [item.caseId, item]));
for (const caseId of DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS) {
  const row = regressionCases.get(caseId);
  const matrixCase = matrixCases.get(caseId);
  const labCase = labCases.get(caseId);
  const certCase = certCases.get(caseId);
  if (!row) {
    errors.push(`localRegressionCases missing ${caseId}`);
    continue;
  }
  if (!matrixCase) errors.push(`matrixCases missing ${caseId}`);
  if (!labCase) errors.push(`lab captureRequirements missing ${caseId}`);
  if (!certCase) errors.push(`certificationCases missing ${caseId}`);
  if (row.localReplayStatus !== "ready_as_local_proof") {
    errors.push(`localRegressionCases.${caseId}.localReplayStatus must be ready_as_local_proof`);
  }
  if (matrixCase?.failureReason && row.failureReason !== matrixCase.failureReason) {
    errors.push(`localRegressionCases.${caseId}.failureReason must match matrix`);
  }
  if (!/^GFS-[A-Z0-9-]+$/.test(row.diagnosticCode || "")) {
    errors.push(`localRegressionCases.${caseId}.diagnosticCode must use GFS-* format`);
  }
  for (const event of asArray(row.requiredTransportEvents)) {
    if (!DEVICE_SYNC_FAKE_TRANSPORT_EVENTS.includes(event)) {
      errors.push(`localRegressionCases.${caseId}.requiredTransportEvents includes unknown event ${event}`);
    }
  }
  for (const assertion of asArray(certCase?.passCriteria)) {
    if (!asArray(row.requiredAssertions).includes(assertion)) {
      errors.push(`localRegressionCases.${caseId}.requiredAssertions missing certification passCriteria ${assertion}`);
    }
  }
  const evidence = createDeviceSyncEvidence(makeJob(caseId, row), {
    transport: {
      requiredEventsObserved: row.requiredTransportEvents,
    },
  });
  for (const error of validateDeviceSyncEvidence(evidence)) {
    errors.push(`localRegressionCases.${caseId}.evidence: ${error}`);
  }
}

for (const macro of asArray(drill.supportHandoff?.requiredMacros)) {
  if (!supportMacros.includes(macro)) errors.push(`supportHandoff.requiredMacros missing from support macros: ${macro}`);
  if (!asArray(cert.supportHandoff?.requiredMacros).includes(macro)) {
    errors.push(`supportHandoff.requiredMacros missing from certification packet: ${macro}`);
  }
}
if (drill.supportHandoff?.diagnosticCodePattern !== "GFS-*") errors.push("supportHandoff.diagnosticCodePattern must be GFS-*");
for (const flag of ["supportDiagnosticBundleRequired", "knownLimitationsRequired"]) {
  if (drill.supportHandoff?.[flag] !== true) errors.push(`supportHandoff.${flag} must be true`);
}

for (const command of REQUIRED_COMMANDS) {
  if (!asArray(drill.releasePolicy?.requiredCommands).includes(command)) {
    errors.push(`releasePolicy.requiredCommands missing ${command}`);
  }
}
for (const blockerId of DEVICE_SYNC_REAL_DEVICE_EXTERNAL_ACCEPTANCE_IDS) {
  if (!asArray(drill.releasePolicy?.mustRemainInProgressUntil).includes(blockerId)) {
    errors.push(`releasePolicy.mustRemainInProgressUntil missing ${blockerId}`);
  }
}

const blockerRows = new Map(asArray(drill.externalBlockers).map((item) => [item.id, item]));
const matrixExternal = new Set(asArray(matrix.externalAcceptance).map((item) => item.id));
for (const blockerId of DEVICE_SYNC_REAL_DEVICE_EXTERNAL_ACCEPTANCE_IDS) {
  const blocker = blockerRows.get(blockerId);
  if (!blocker) {
    errors.push(`externalBlockers missing ${blockerId}`);
    continue;
  }
  if (blocker.status !== "pending_external") errors.push(`externalBlockers.${blockerId}.status must remain pending_external`);
  if (!blocker.owner) errors.push(`externalBlockers.${blockerId}.owner is required`);
  if (asArray(blocker.exitCriteria).length < 3) errors.push(`externalBlockers.${blockerId}.exitCriteria must include at least 3 items`);
  if (!matrixExternal.has(blockerId)) errors.push(`externalBlockers.${blockerId} missing from device matrix externalAcceptance`);
}

const artifacts = new Map(asArray(matrix.dataArtifacts).map((item) => [item.id, item]));
if (!artifacts.has("device_sync_regression_drill")) {
  errors.push("device-matrix-readiness.dataArtifacts missing device_sync_regression_drill");
}
const controls = new Map(asArray(matrix.codeControls).map((item) => [item.id, item]));
if (!controls.has("device_sync_regression_gate")) {
  errors.push("device-matrix-readiness.codeControls missing device_sync_regression_gate");
}
if (!asArray(matrix.releaseCommands).includes("npm run check:device-sync-regression")) {
  errors.push("device-matrix-readiness.releaseCommands missing npm run check:device-sync-regression");
}

const publicItem = asArray(release.gates?.public_mvp?.items).find((item) => item.id === "real_device_matrix");
if (!publicItem) {
  errors.push("release-readiness.public_mvp missing real_device_matrix");
} else {
  for (const evidence of ["data/device-sync-regression-drill.json", "scripts/check-device-sync-regression.mjs"]) {
    if (!asArray(publicItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.real_device_matrix evidence missing ${evidence}`);
    }
  }
}
const closedBetaItem = asArray(release.gates?.closed_beta?.items).find((item) => item.id === "device_sync_failure_handling");
if (!closedBetaItem) {
  errors.push("release-readiness.closed_beta missing device_sync_failure_handling");
} else {
  for (const evidence of ["data/device-sync-regression-drill.json", "scripts/check-device-sync-regression.mjs"]) {
    if (!asArray(closedBetaItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.device_sync_failure_handling evidence missing ${evidence}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Device sync regression gate ${drill.schemaVersion}: cases=${regressionCases.size}, blockers=${blockerRows.size}`);
