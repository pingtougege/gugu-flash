import { readFile } from "node:fs/promises";

import {
  AI_TEXT_GAME_QUALITY_CHECK_IDS,
  createDraftFromPrompt,
  createDraftQualityChecks,
  validatePack,
  validatePacks,
} from "../packages/core/src/index.js";
import { validateBackendAlphaRouteCoverage } from "../apps/backend/src/alpha-route-coverage.js";

const ROSTER_URL = new URL("../data/ai-creation-team-roster.json", import.meta.url);
const SEED_URL = new URL("../data/seed-packs.json", import.meta.url);
const MATURITY_DOC_URL = new URL("../docs/ai-text-game-creation-maturity.md", import.meta.url);
const TEAM_DOC_URL = new URL("../docs/ai-team-operating-system.md", import.meta.url);
const RELEASE_READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);

const REQUIRED_SQUADS = [
  "product_strategy",
  "narrative_design",
  "game_systems",
  "ai_prompt_model_ops",
  "frontend_experience",
  "backend_platform",
  "safety_rights_moderation",
  "native_hardware",
  "commerce_support_ops",
  "qa_release",
  "content_ops",
];

const REQUIRED_QUALITY_CHECKS = AI_TEXT_GAME_QUALITY_CHECK_IDS;

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function requireIncludes(errors, haystack, needle, label) {
  if (!haystack.includes(needle)) errors.push(`${label}: missing ${needle}`);
}

function validateRoster(errors, roster) {
  if (roster.version !== "ai_creation_team_roster_v1") errors.push("roster: invalid version");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(roster.updatedAt || "")) errors.push("roster: updatedAt must be YYYY-MM-DD");
  if (!roster.lead?.name || !roster.lead?.mandate) errors.push("roster: missing project lead mandate");

  const squads = new Map(asArray(roster.squads).map((squad) => [squad.id, squad]));
  for (const squadId of REQUIRED_SQUADS) {
    const squad = squads.get(squadId);
    if (!squad) {
      errors.push(`roster: missing squad ${squadId}`);
      continue;
    }
    if (!squad.name) errors.push(`roster.${squadId}: missing name`);
    if (!squad.mission) errors.push(`roster.${squadId}: missing mission`);
    if (asArray(squad.members).length < roster.minimumMembersPerSquad) {
      errors.push(`roster.${squadId}: must have at least ${roster.minimumMembersPerSquad} members`);
    }
    for (const member of asArray(squad.members)) {
      if (!member.name || !member.role) errors.push(`roster.${squadId}: every member needs name and role`);
    }
    if (!asArray(squad.reviewSignals).length) errors.push(`roster.${squadId}: missing review signals`);
  }
}

function validateShowcaseContent(errors, packs) {
  errors.push(...validatePacks(packs).map((error) => `seed-packs: ${error}`));
  if (packs.length < 6) errors.push("seed-packs: expected at least 6 showcase packs");

  const longFormPacks = packs.filter((pack) => asArray(pack.scenes).length >= 6);
  if (longFormPacks.length < 3) errors.push("seed-packs: expected at least 3 packs with 6 or more scenes");

  const officialOriginals = packs.filter((pack) => pack.contentOrigin === "original" && pack.ipId);
  if (officialOriginals.length < 3) errors.push("seed-packs: expected at least 3 platform-original or creator-original showcase packs");

  const maturePacks = packs.filter((pack) => {
    const checks = createDraftQualityChecks(pack);
    return checks.some((check) => check.id === "branch_depth" && check.status === "passed") &&
      checks.some((check) => check.id === "ending_payoff" && check.status === "passed");
  });
  if (maturePacks.length < 3) errors.push("seed-packs: expected at least 3 packs to pass branch depth and ending payoff checks");
}

function validateGeneratedDraft(errors) {
  const draft = createDraftFromPrompt(
    "雨夜便利店里，当前分身遇到会预言明天的猫，必须在两条路线里选择要不要改变预言",
    "adventure",
    { originType: "original", ipId: "rain_gugu_universe", personaId: "rain_gugu" },
    1760000000000,
  );
  errors.push(...validatePack(draft).map((error) => `generated-draft: ${error}`));

  const checks = createDraftQualityChecks(draft);
  const ids = checks.map((check) => check.id);
  for (const id of REQUIRED_QUALITY_CHECKS) {
    if (!ids.includes(id)) errors.push(`quality-checks: missing ${id}`);
  }
  for (const check of checks) {
    if (check.status === "blocked") errors.push(`generated-draft: blocked quality check ${check.id}`);
  }
}

function validateReadiness(errors, readiness) {
  const internalGate = readiness.gates?.internal_prototype;
  if (internalGate?.verdict !== "ready") errors.push("release-readiness: internal_prototype gate must stay ready");
  const maturityItem = asArray(internalGate?.items).find((item) => item.id === "ai_text_game_creation_maturity");
  if (!maturityItem) {
    errors.push("release-readiness.internal_prototype: missing ai_text_game_creation_maturity item");
    return;
  }
  if (maturityItem.status !== "ready") errors.push("release-readiness.ai_text_game_creation_maturity: status must be ready");
  for (const evidence of [
    "npm run check:ai-creation-maturity",
    "data/ai-creation-team-roster.json",
    "docs/ai-text-game-creation-maturity.md",
    "scripts/check-ai-creation-maturity.mjs",
    "packages/core/src/gugu-h5-pack.test.js",
  ]) {
    if (!asArray(maturityItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.ai_text_game_creation_maturity: evidence must include ${evidence}`);
    }
  }
}

const [
  roster,
  seedPacks,
  maturityDoc,
  teamDoc,
  releaseReadiness,
] = await Promise.all([
  readFile(ROSTER_URL, "utf8").then(JSON.parse),
  readFile(SEED_URL, "utf8").then(JSON.parse),
  readFile(MATURITY_DOC_URL, "utf8"),
  readFile(TEAM_DOC_URL, "utf8"),
  readFile(RELEASE_READINESS_URL, "utf8").then(JSON.parse),
]);

const errors = [];

validateRoster(errors, roster);
validateShowcaseContent(errors, seedPacks);
validateGeneratedDraft(errors);
validateReadiness(errors, releaseReadiness);
errors.push(...validateBackendAlphaRouteCoverage().map((error) => `route-coverage: ${error}`));

for (const marker of [
  "data/ai-creation-team-roster.json",
  "Mature Internal-Creation Definition",
  "Next External Gates",
]) {
  requireIncludes(errors, maturityDoc, marker, "maturity-doc");
}
for (const marker of [
  "Rebuilt Creation Organization",
  "scripts/check-ai-creation-maturity.mjs",
]) {
  requireIncludes(errors, teamDoc, marker, "team-doc");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`AI creation maturity gate ${roster.version}: squads=${roster.squads.length}, seed_packs=${seedPacks.length}, quality_checks=${REQUIRED_QUALITY_CHECKS.length}`);
