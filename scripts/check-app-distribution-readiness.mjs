import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DISTRIBUTION_URL = new URL("../docs/app-distribution-readiness.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_RELEASE_SCENARIOS = [
  "ios_testflight_internal",
  "android_internal_testing",
  "store_review_materials",
  "permission_privacy_review",
  "native_smoke_critical_paths",
  "web_h5_fallback",
];

const REQUIRED_EXTERNAL_ACCEPTANCE = [
  "apple_developer_access",
  "google_play_console_access",
  "native_shell_build",
  "store_review_packet",
  "release_manager_signoff",
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

const distribution = JSON.parse(await readFile(DISTRIBUTION_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!distribution.version) errors.push("app-distribution-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(distribution.updatedAt || "")) {
  errors.push("app-distribution-readiness: updatedAt must be YYYY-MM-DD");
}
if (distribution.status !== "draft_pending_native_release_channel") {
  errors.push("app-distribution-readiness: status must remain draft_pending_native_release_channel until native release channels exist");
}

for (const document of asArray(distribution.documents)) {
  if (!document.id) errors.push("app distribution document missing id");
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

for (const control of asArray(distribution.codeControls)) {
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

for (const artifact of asArray(distribution.dataArtifacts)) {
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

const scenarioRows = new Map(asArray(distribution.releaseScenarios).map((item) => [item.id, item]));
for (const scenarioId of REQUIRED_RELEASE_SCENARIOS) {
  const row = scenarioRows.get(scenarioId);
  if (!row) {
    errors.push(`releaseScenarios: missing ${scenarioId}`);
    continue;
  }
  for (const field of ["owner", "channel", "expectedResult"]) {
    if (!row[field]) errors.push(`releaseScenarios.${scenarioId}: missing ${field}`);
  }
  if (!asArray(row.requiredEvidence).length) errors.push(`releaseScenarios.${scenarioId}: missing requiredEvidence`);
}

for (const command of asArray(distribution.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const externalRows = new Map(asArray(distribution.externalAcceptance).map((item) => [item.id, item]));
for (const itemId of REQUIRED_EXTERNAL_ACCEPTANCE) {
  const item = externalRows.get(itemId);
  if (!item) {
    errors.push(`externalAcceptance: missing ${itemId}`);
    continue;
  }
  if (item.status !== "pending_external") errors.push(`${itemId}: must remain pending_external until native distribution work is complete`);
  if (!item.needed) errors.push(`${itemId}: missing needed`);
}

const distributionReadinessItem = asArray(readiness.gates?.public_mvp?.items).find((item) => item.id === "app_distribution");
if (!distributionReadinessItem) {
  errors.push("release-readiness.public_mvp: missing app_distribution item");
} else {
  for (const evidence of [
    "apps/native/README.md",
    "docs/app-distribution-plan.md",
    "docs/app-distribution-readiness.json",
    "data/app-release-packet.json",
    "data/native-build-certification-packet.json",
    "scripts/check-app-distribution-readiness.mjs",
    "scripts/check-app-release-packet.mjs",
    "scripts/check-native-build-certification.mjs",
    "packages/core/src/gugu-domain.js",
    "packages/api-client/src/flash-api-contract.js",
  ]) {
    if (!asArray(distributionReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.app_distribution: evidence must include ${evidence}`);
    }
  }
  if (distributionReadinessItem.status !== "in_progress") {
    errors.push("release-readiness.app_distribution: status must be in_progress until native build channels and store review packet are complete");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const pending = asArray(distribution.externalAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`App distribution readiness gate ${distribution.version}: scenarios=${scenarioRows.size}, controls=${asArray(distribution.codeControls).length}, pending_external=${pending}`);
