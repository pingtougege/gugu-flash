import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  SUPPORT_DIAGNOSTIC_BUNDLE_VERSION,
  SUPPORT_DIAGNOSTIC_MACROS,
  SUPPORT_DIAGNOSTIC_QUERY_FIELDS,
} from "../apps/backend/src/support-diagnostics.js";

const DIAGNOSTICS_URL = new URL("../docs/support-diagnostics-readiness.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_EVIDENCE = [
  "apps/backend/src/support-diagnostics.js",
  "apps/backend/src/support-diagnostics.test.js",
  "apps/backend/src/flash-http-server.js",
  "apps/backend/src/alpha-route-coverage.js",
  "packages/api-client/src/flash-api-contract.js",
  "packages/api-client/src/http-flash-api.js",
  "packages/api-client/src/http-flash-api.test.js",
  "docs/support-diagnostics-readiness.md",
  "docs/support-diagnostics-readiness.json",
  "scripts/check-support-diagnostics-readiness.mjs",
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

async function readWorkspaceFile(path) {
  return readFile(resolve(path), "utf8");
}

const diagnostics = JSON.parse(await readFile(DIAGNOSTICS_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!diagnostics.version) errors.push("support-diagnostics-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(diagnostics.updatedAt || "")) {
  errors.push("support-diagnostics-readiness: updatedAt must be YYYY-MM-DD");
}
if (diagnostics.status !== "alpha_ready_pending_real_staffing") {
  errors.push("support-diagnostics-readiness: status must remain alpha_ready_pending_real_staffing until staffing is assigned");
}

if (diagnostics.endpoint?.method !== "GET") errors.push("endpoint.method must be GET");
if (diagnostics.endpoint?.path !== "/flash/operator/support-diagnostics") {
  errors.push("endpoint.path must be /flash/operator/support-diagnostics");
}
if (diagnostics.endpoint?.auth !== "support") errors.push("endpoint.auth must be support");
if (diagnostics.endpoint?.responseSchemaVersion !== SUPPORT_DIAGNOSTIC_BUNDLE_VERSION) {
  errors.push(`endpoint.responseSchemaVersion must be ${SUPPORT_DIAGNOSTIC_BUNDLE_VERSION}`);
}
for (const header of ["X-Request-Id", "X-Gugu-Request-Id"]) {
  if (!asArray(diagnostics.endpoint?.requestIdHeaders).includes(header)) {
    errors.push(`endpoint.requestIdHeaders missing ${header}`);
  }
}

for (const field of SUPPORT_DIAGNOSTIC_QUERY_FIELDS) {
  if (!asArray(diagnostics.queryFields).includes(field)) errors.push(`queryFields missing ${field}`);
}

const macroCoverage = new Map(asArray(diagnostics.macroCoverage).map((item) => [item.id, item]));
for (const [macroId, macro] of Object.entries(SUPPORT_DIAGNOSTIC_MACROS)) {
  const coverage = macroCoverage.get(macroId);
  if (!coverage) {
    errors.push(`macroCoverage missing ${macroId}`);
    continue;
  }
  for (const field of macro.requiredFields) {
    if (!asArray(coverage.requiredFields).includes(field)) {
      errors.push(`${macroId}: requiredFields missing ${field}`);
    }
  }
}

for (const evidence of REQUIRED_EVIDENCE) {
  if (!asArray(diagnostics.codeEvidence).includes(evidence) && !asArray(diagnostics.closedBetaAcceptance).some((item) => asArray(item.evidence).includes(evidence))) {
    errors.push(`support diagnostics evidence missing ${evidence}`);
  }
  if (!(await pathExists(evidence))) errors.push(`support diagnostics evidence path does not exist: ${evidence}`);
}

const source = await readWorkspaceFile("apps/backend/src/support-diagnostics.js");
for (const marker of [
  "createSupportDiagnosticBundle",
  "validateSupportDiagnosticBundle",
  SUPPORT_DIAGNOSTIC_BUNDLE_VERSION,
  ...Object.keys(SUPPORT_DIAGNOSTIC_MACROS),
]) {
  if (!source.includes(marker)) errors.push(`support-diagnostics.js missing marker ${marker}`);
}

const server = await readWorkspaceFile("apps/backend/src/flash-http-server.js");
if (!server.includes("support-diagnostics") || !server.includes("createSupportDiagnosticBundle")) {
  errors.push("flash-http-server.js must expose /flash/operator/support-diagnostics with createSupportDiagnosticBundle");
}

const contract = await readWorkspaceFile("packages/api-client/src/flash-api-contract.js");
if (!contract.includes("operator.supportDiagnostics.get") || !contract.includes("/flash/operator/support-diagnostics")) {
  errors.push("flash-api-contract.js must include operator.supportDiagnostics.get");
}

const httpClient = await readWorkspaceFile("packages/api-client/src/http-flash-api.js");
if (!httpClient.includes("getOperatorSupportDiagnostics")) {
  errors.push("http-flash-api.js must expose getOperatorSupportDiagnostics");
}

const httpTest = await readWorkspaceFile("packages/api-client/src/http-flash-api.test.js");
for (const marker of ["getOperatorSupportDiagnostics", "sync_write_failed", "req_http_support_diag_001", "support-session"]) {
  if (!httpTest.includes(marker)) errors.push(`http-flash-api.test.js missing ${marker}`);
}

const supportReadinessItem = asArray(readiness.gates?.closed_beta?.items).find((item) => item.id === "support_playbook");
if (!supportReadinessItem) {
  errors.push("release-readiness.closed_beta: missing support_playbook item");
} else {
  for (const evidence of REQUIRED_EVIDENCE) {
    if (!asArray(supportReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.support_playbook: evidence must include ${evidence}`);
    }
  }
  if (supportReadinessItem.status === "ready") {
    errors.push("release-readiness.support_playbook: cannot be ready until real staffing is assigned");
  }
  if (!String(supportReadinessItem.needed || "").includes("diagnostic bundle")) {
    errors.push("release-readiness.support_playbook: needed must mention diagnostic bundle");
  }
}

const pendingExternal = asArray(diagnostics.closedBetaAcceptance).filter((item) => item.status === "pending_external");
for (const item of pendingExternal) {
  if (!item.needed) errors.push(`${item.id}: pending external items must describe needed work`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Support diagnostics readiness gate ${diagnostics.version}: macros=${macroCoverage.size}, queryFields=${diagnostics.queryFields.length}, pendingExternal=${pendingExternal.length}`);
