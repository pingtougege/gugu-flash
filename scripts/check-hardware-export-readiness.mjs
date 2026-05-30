import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  HARDWARE_STUDIO_EXPORT_REQUIRED_FILES,
  HARDWARE_STUDIO_EXPORT_VERSION,
} from "../packages/core/src/index.js";

const READINESS_URL = new URL("../docs/hardware-studio-export-readiness.json", import.meta.url);
const RELEASE_READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_EVIDENCE = [
  "docs/hardware-studio-export-readiness.md",
  "docs/hardware-studio-export-readiness.json",
  "scripts/check-hardware-export-readiness.mjs",
  "packages/core/src/gugu-hardware-export.js",
  "packages/core/src/gugu-hardware-export.test.js",
  "packages/core/src/index.js",
  "apps/backend/src/flash-http-server.js",
  "packages/api-client/src/flash-api-contract.js",
  "packages/api-client/src/http-flash-api.js",
  "packages/api-client/src/http-flash-api.test.js",
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

const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const releaseReadiness = JSON.parse(await readFile(RELEASE_READINESS_URL, "utf8"));
const errors = [];

if (!readiness.version) errors.push("hardware-export-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(readiness.updatedAt || "")) {
  errors.push("hardware-export-readiness: updatedAt must be YYYY-MM-DD");
}
if (readiness.status !== "alpha_export_ready_pending_native_packaging") {
  errors.push("hardware-export-readiness: status must remain alpha_export_ready_pending_native_packaging");
}

if (readiness.endpoint?.method !== "POST") errors.push("endpoint.method must be POST");
if (readiness.endpoint?.path !== "/flash/operator/hardware-packs/:id/export-to-hardware-studio") {
  errors.push("endpoint.path must be /flash/operator/hardware-packs/:id/export-to-hardware-studio");
}
if (readiness.endpoint?.auth !== "hardware_operator") errors.push("endpoint.auth must be hardware_operator");
if (readiness.endpoint?.responseSchemaVersion !== HARDWARE_STUDIO_EXPORT_VERSION) {
  errors.push(`endpoint.responseSchemaVersion must be ${HARDWARE_STUDIO_EXPORT_VERSION}`);
}

if (readiness.bundle?.schemaVersion !== HARDWARE_STUDIO_EXPORT_VERSION) {
  errors.push(`bundle.schemaVersion must be ${HARDWARE_STUDIO_EXPORT_VERSION}`);
}
for (const file of HARDWARE_STUDIO_EXPORT_REQUIRED_FILES) {
  if (!asArray(readiness.bundle?.requiredFiles).includes(file)) errors.push(`bundle.requiredFiles missing ${file}`);
}
if (readiness.bundle?.requiredStatus !== "ready_for_hardware_studio") {
  errors.push("bundle.requiredStatus must be ready_for_hardware_studio");
}
if (readiness.bundle?.blockedStatus !== "blocked") errors.push("bundle.blockedStatus must be blocked");

for (const item of asArray(readiness.codeControls)) {
  if (!item.id) errors.push("codeControls: missing id");
  if (!item.file) errors.push(`${item.id}: missing file`);
  if (!(await pathExists(item.file))) {
    errors.push(`${item.id}: file does not exist: ${item.file}`);
    continue;
  }
  const content = await readFile(resolve(item.file), "utf8");
  for (const marker of asArray(item.requiredMarkers)) {
    if (!content.includes(marker)) errors.push(`${item.id}: missing marker ${marker}`);
  }
}

for (const evidence of REQUIRED_EVIDENCE) {
  if (!(await pathExists(evidence))) errors.push(`hardware export evidence path does not exist: ${evidence}`);
}

const doc = await readFile(resolve("docs/hardware-studio-export-readiness.md"), "utf8");
for (const heading of ["## Scope", "## Export Bundle", "## Backend Route", "## QA Acceptance", "## External Boundary"]) {
  if (!doc.includes(heading)) errors.push(`hardware-studio-export-readiness.md missing heading ${heading}`);
}
for (const marker of [HARDWARE_STUDIO_EXPORT_VERSION, "checksums.sha256", "Hardware Studio binary"]) {
  if (!doc.includes(marker)) errors.push(`hardware-studio-export-readiness.md missing ${marker}`);
}

const acceptance = new Map(asArray(readiness.closedBetaAcceptance).map((item) => [item.id, item]));
for (const itemId of ["deterministic_export_bundle", "backend_export_route", "real_hardware_studio_binary", "real_device_signoff"]) {
  const item = acceptance.get(itemId);
  if (!item) {
    errors.push(`closedBetaAcceptance missing ${itemId}`);
    continue;
  }
  if (item.status === "pending_external" && !item.needed) errors.push(`${itemId}: pending external item must describe needed work`);
  for (const evidence of asArray(item.evidence)) {
    if (!(await pathExists(evidence))) errors.push(`${itemId}: evidence path does not exist: ${evidence}`);
  }
}

const hardwareReadinessItem = asArray(releaseReadiness.gates?.closed_beta?.items).find((item) => item.id === "hardware_pack_production");
if (!hardwareReadinessItem) {
  errors.push("release-readiness.closed_beta: missing hardware_pack_production item");
} else {
  for (const evidence of REQUIRED_EVIDENCE) {
    if (!asArray(hardwareReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.hardware_pack_production: evidence must include ${evidence}`);
    }
  }
  if (hardwareReadinessItem.status === "ready") {
    errors.push("release-readiness.hardware_pack_production: cannot be ready before real Hardware Studio binary and device signoff");
  }
  if (!String(hardwareReadinessItem.needed || "").includes("Hardware Studio export bundle")) {
    errors.push("release-readiness.hardware_pack_production: needed must mention Hardware Studio export bundle");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const pending = asArray(readiness.closedBetaAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`Hardware Studio export readiness gate ${readiness.version}: requiredFiles=${HARDWARE_STUDIO_EXPORT_REQUIRED_FILES.length}, controls=${asArray(readiness.codeControls).length}, pendingExternal=${pending}`);
