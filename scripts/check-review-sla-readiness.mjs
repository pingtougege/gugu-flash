import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  REVIEW_SLA_QUEUE_TARGETS,
  REVIEW_SLA_VERSION,
} from "../apps/backend/src/review-sla.js";

const SLA_URL = new URL("../docs/review-sla-readiness.json", import.meta.url);
const STAFFING_URL = new URL("../docs/moderation-staffing-readiness.json", import.meta.url);
const RELEASE_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_EVIDENCE = [
  "docs/review-sla-readiness.md",
  "docs/review-sla-readiness.json",
  "data/review-operations-certification-packet.json",
  "scripts/check-review-sla-readiness.mjs",
  "scripts/check-review-operations-certification.mjs",
  "apps/backend/src/review-sla.js",
  "apps/backend/src/review-sla.test.js",
  "apps/backend/src/flash-http-server.js",
  "apps/backend/src/alpha-route-coverage.js",
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

const sla = JSON.parse(await readFile(SLA_URL, "utf8"));
const staffing = JSON.parse(await readFile(STAFFING_URL, "utf8"));
const release = JSON.parse(await readFile(RELEASE_URL, "utf8"));
const errors = [];

if (!sla.version) errors.push("review-sla-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(sla.updatedAt || "")) errors.push("review-sla-readiness: updatedAt must be YYYY-MM-DD");
if (sla.status !== "alpha_sla_ready_pending_named_rota") {
  errors.push("review-sla-readiness: status must be alpha_sla_ready_pending_named_rota");
}

if (sla.endpoint?.method !== "GET") errors.push("endpoint.method must be GET");
if (sla.endpoint?.path !== "/flash/operator/review-sla") errors.push("endpoint.path must be /flash/operator/review-sla");
if (sla.endpoint?.auth !== "operator") errors.push("endpoint.auth must be operator");
if (sla.endpoint?.responseSchemaVersion !== REVIEW_SLA_VERSION) {
  errors.push(`endpoint.responseSchemaVersion must be ${REVIEW_SLA_VERSION}`);
}

const staffingQueues = new Map(asArray(staffing.queueCoverage).map((item) => [item.queueId, item]));
const readinessQueues = new Map(asArray(sla.queueTargets).map((item) => [item.queueId, item]));
for (const [queueId, target] of Object.entries(REVIEW_SLA_QUEUE_TARGETS)) {
  const readinessQueue = readinessQueues.get(queueId);
  const staffingQueue = staffingQueues.get(queueId);
  if (!readinessQueue) {
    errors.push(`queueTargets missing ${queueId}`);
    continue;
  }
  if (!staffingQueue) errors.push(`moderation-staffing queueCoverage missing ${queueId}`);
  if (readinessQueue.slaHours !== target.slaHours) errors.push(`${queueId}: slaHours must be ${target.slaHours}`);
  if (staffingQueue && readinessQueue.slaHours !== staffingQueue.slaHours) {
    errors.push(`${queueId}: slaHours must match moderation staffing readiness`);
  }
  if (target.requiresSecondReviewer && readinessQueue.requiresSecondReviewer !== true) {
    errors.push(`${queueId}: requiresSecondReviewer must be true`);
  }
}

for (const item of asArray(sla.codeControls)) {
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

for (const artifact of asArray(sla.dataArtifacts)) {
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
}

for (const evidence of REQUIRED_EVIDENCE) {
  if (!(await pathExists(evidence))) errors.push(`review SLA evidence path does not exist: ${evidence}`);
}

const doc = await readFile(resolve("docs/review-sla-readiness.md"), "utf8");
for (const heading of ["## Scope", "## Endpoint", "## SLA Rules", "## Daily Review", "## External Boundary"]) {
  if (!doc.includes(heading)) errors.push(`review-sla-readiness.md missing heading ${heading}`);
}
for (const marker of [REVIEW_SLA_VERSION, "appeal_review", "second-reviewer"]) {
  if (!doc.includes(marker)) errors.push(`review-sla-readiness.md missing ${marker}`);
}

for (const item of asArray(sla.acceptance)) {
  if (!item.id) errors.push("acceptance: missing id");
  if (item.status === "pending_external" && !item.needed) errors.push(`${item.id}: pending external item must describe needed work`);
  for (const evidence of asArray(item.evidence)) {
    if (!(await pathExists(evidence))) errors.push(`${item.id}: evidence path does not exist: ${evidence}`);
  }
}

const releaseItems = [
  ["closed_beta", "h5_publish_review"],
  ["closed_beta", "store_listing_review"],
  ["closed_beta", "content_reports_rights_claims"],
  ["public_mvp", "moderation_staffing"],
];
for (const [gate, itemId] of releaseItems) {
  const item = asArray(release.gates?.[gate]?.items).find((entry) => entry.id === itemId);
  if (!item) {
    errors.push(`release-readiness.${gate}: missing ${itemId}`);
    continue;
  }
  for (const evidence of REQUIRED_EVIDENCE) {
    if (!asArray(item.evidence).includes(evidence)) {
      errors.push(`release-readiness.${itemId}: evidence must include ${evidence}`);
    }
  }
  if (item.status === "ready") {
    errors.push(`release-readiness.${itemId}: cannot be ready until named staffing and drills are complete`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const pending = asArray(sla.acceptance).filter((item) => item.status === "pending_external").length;
console.log(`Review SLA readiness gate ${sla.version}: queues=${Object.keys(REVIEW_SLA_QUEUE_TARGETS).length}, controls=${asArray(sla.codeControls).length}, artifacts=${asArray(sla.dataArtifacts).length}, pendingExternal=${pending}`);
