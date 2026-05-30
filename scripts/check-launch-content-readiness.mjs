import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  LAUNCH_CONTENT_REQUIRED_SMOKE_CASES,
  buildLaunchHardwarePackCandidate,
  validateLaunchHardwareManifest,
  validatePacks,
} from "../packages/core/src/index.js";

const SEED_URL = new URL("../data/seed-packs.json", import.meta.url);
const MANIFEST_URL = new URL("../data/launch-hardware-packs.json", import.meta.url);
const LAUNCH_READINESS_URL = new URL("../docs/launch-content-readiness.json", import.meta.url);
const RELEASE_READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

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

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function payloadChecksum(payload) {
  return `sha256:${createHash("sha256").update(JSON.stringify(stable(payload))).digest("hex")}`;
}

const seedPacks = JSON.parse(await readFile(SEED_URL, "utf8"));
const manifest = JSON.parse(await readFile(MANIFEST_URL, "utf8"));
const readiness = JSON.parse(await readFile(LAUNCH_READINESS_URL, "utf8"));
const releaseReadiness = JSON.parse(await readFile(RELEASE_READINESS_URL, "utf8"));
const errors = [];

errors.push(...validatePacks(seedPacks).map((error) => `seed-packs: ${error}`));
errors.push(...validateLaunchHardwareManifest(manifest, seedPacks).map((error) => `launch-manifest: ${error}`));

if (!readiness.version) errors.push("launch-content-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(readiness.updatedAt || "")) {
  errors.push("launch-content-readiness: updatedAt must be YYYY-MM-DD");
}
if (readiness.status !== "ready_for_public_mvp_seed") {
  errors.push("launch-content-readiness: status must be ready_for_public_mvp_seed");
}

for (const section of ["documents", "dataArtifacts", "codeControls"]) {
  for (const item of asArray(readiness[section])) {
    if (!item.id) errors.push(`${section}: missing id`);
    if (!item.file) errors.push(`${item.id}: missing file`);
    if (!(await pathExists(item.file))) {
      errors.push(`${item.id}: file does not exist: ${item.file}`);
      continue;
    }
    const content = await readFile(resolve(item.file), "utf8");
    for (const heading of asArray(item.requiredHeadings)) {
      if (!content.includes(heading)) errors.push(`${item.id}: missing heading ${heading}`);
    }
    for (const marker of asArray(item.requiredMarkers)) {
      if (!content.includes(marker)) errors.push(`${item.id}: missing marker ${marker}`);
    }
    for (const clause of asArray(item.requiredClauses)) {
      if (!content.toLowerCase().includes(String(clause).toLowerCase())) {
        errors.push(`${item.id}: missing clause marker ${clause}`);
      }
    }
  }
}

const seedById = new Map(seedPacks.map((pack) => [pack.id, pack]));
for (const item of asArray(manifest.hardwarePacks)) {
  const source = seedById.get(item.sourcePackId);
  if (!source) continue;
  const expectedChecksum = payloadChecksum(item.payload);
  if (item.hardwarePack?.checksum !== expectedChecksum) {
    errors.push(`${item.id}: checksum does not match payload`);
  }
  const rebuilt = buildLaunchHardwarePackCandidate(source, {
    checksum: item.hardwarePack?.checksum,
    timestamp: item.payload?.generatedAt,
    createdAt: item.compatibilityReport?.createdAt,
    updatedAt: item.compatibilityReport?.updatedAt,
    generatedAt: item.payload?.generatedAt,
  });
  if (!rebuilt) {
    errors.push(`${item.id}: cannot rebuild launch hardware pack candidate from seed`);
  } else {
    if (rebuilt.compatibilityReport.status !== "passed") {
      errors.push(`${item.id}: rebuilt compatibility report must pass`);
    }
    if (rebuilt.payload.sceneCount !== item.payload?.sceneCount) {
      errors.push(`${item.id}: rebuilt payload sceneCount differs from manifest`);
    }
  }
  for (const smokeCase of LAUNCH_CONTENT_REQUIRED_SMOKE_CASES) {
    if (!asArray(item.smokeCases).includes(smokeCase)) errors.push(`${item.id}: missing smoke case ${smokeCase}`);
  }
}

if (asArray(manifest.hardwarePacks).length < (manifest.launchCriteria?.minimumAvailableHardwarePacks || 1)) {
  errors.push("launch-manifest: not enough available hardware packs");
}

for (const fallback of asArray(manifest.fallbackH5Packs)) {
  if (!seedById.has(fallback.id)) errors.push(`fallbackH5Packs: unknown seed pack ${fallback.id}`);
}

const launchReadinessItem = asArray(releaseReadiness.gates?.public_mvp?.items).find((item) => item.id === "launch_content");
if (!launchReadinessItem) {
  errors.push("release-readiness.public_mvp: missing launch_content item");
} else {
  for (const evidence of [
    "data/seed-packs.json",
    "data/launch-hardware-packs.json",
    "docs/launch-content-plan.md",
    "docs/launch-content-readiness.json",
    "scripts/check-launch-content-readiness.mjs",
    "packages/core/src/gugu-launch-content.js",
    "packages/core/src/gugu-launch-content.test.js",
  ]) {
    if (!asArray(launchReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.launch_content: evidence must include ${evidence}`);
    }
  }
  if (launchReadinessItem.status !== "ready") {
    errors.push("release-readiness.launch_content: status must be ready after launch manifest passes");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Launch content readiness gate ${readiness.version}: hardware_packs=${manifest.hardwarePacks.length}, fallback_h5=${asArray(manifest.fallbackH5Packs).length}, smoke_cases=${LAUNCH_CONTENT_REQUIRED_SMOKE_CASES.length}`);
