import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const DEPLOYMENT_URL = new URL("../docs/deployment-readiness.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

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

const deployment = JSON.parse(await readFile(DEPLOYMENT_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!deployment.version) errors.push("deployment-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(deployment.updatedAt || "")) {
  errors.push("deployment-readiness: updatedAt must be YYYY-MM-DD");
}
if (deployment.status !== "draft_pending_production_hosting") {
  errors.push("deployment-readiness: status must remain draft_pending_production_hosting until production hosting is configured");
}

for (const document of asArray(deployment.documents)) {
  if (!document.id) errors.push("deployment document missing id");
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

for (const control of asArray(deployment.codeControls)) {
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

for (const artifact of asArray(deployment.dataArtifacts)) {
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

for (const command of asArray(deployment.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

for (const item of asArray(deployment.externalAcceptance)) {
  if (!item.id) errors.push("externalAcceptance: missing id");
  if (item.status !== "pending_external") errors.push(`${item.id}: must remain pending_external until production deployment exists`);
  if (!item.needed) errors.push(`${item.id}: missing needed`);
}

const deploymentReadinessItem = asArray(readiness.gates?.public_mvp?.items).find((item) => item.id === "production_deployment");
if (!deploymentReadinessItem) {
  errors.push("release-readiness.public_mvp: missing production_deployment item");
} else {
  for (const evidence of ["docs/production-deployment-runbook.md", "docs/deployment-readiness.json", "data/production-environment-preflight.json", "data/production-rollout-packet.json", "scripts/check-deployment-readiness.mjs", "scripts/check-production-environment-preflight.mjs", "scripts/check-production-rollout-packet.mjs", "apps/backend/src/flash-http-server.js", "packages/api-client/src/http-flash-api.test.js", ".github/workflows/pages.yml", "apps/backend/src/json-flash-store-backup.js", "scripts/check-alpha-backup-restore.mjs"]) {
    if (!asArray(deploymentReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.production_deployment: evidence must include ${evidence}`);
    }
  }
  if (deploymentReadinessItem.status === "ready") {
    errors.push("release-readiness.production_deployment: cannot be ready until production hosting and drills are complete");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const controls = asArray(deployment.codeControls).length;
const artifacts = asArray(deployment.dataArtifacts).length;
const pending = asArray(deployment.externalAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`Deployment readiness gate ${deployment.version}: controls=${controls}, artifacts=${artifacts}, commands=${asArray(deployment.releaseCommands).length}, pending_external=${pending}`);
