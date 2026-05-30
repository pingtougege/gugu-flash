import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const COVERAGE_URL = new URL("../docs/legal-terms-coverage.json", import.meta.url);
const READINESS_URL = new URL("../docs/release-readiness.json", import.meta.url);
const OFFICIAL_SOURCE_DOMAINS = [
  "npc.gov.cn",
  "cac.gov.cn",
  "samr.gov.cn",
  "gov.cn",
  "moj.gov.cn",
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

function sourceDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function sourceRefIds(coverage) {
  return new Set(asArray(coverage.sourceRefs).map((item) => item.id));
}

const coverage = JSON.parse(await readFile(COVERAGE_URL, "utf8"));
const readiness = JSON.parse(await readFile(READINESS_URL, "utf8"));
const errors = [];

if (!coverage.version) errors.push("coverage: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(coverage.updatedAt || "")) errors.push("coverage: updatedAt must be YYYY-MM-DD");
if (coverage.status !== "draft_pending_legal_approval") {
  errors.push("coverage: status must remain draft_pending_legal_approval until counsel approves");
}

if (!asArray(coverage.sourceRefs).length) errors.push("coverage: missing sourceRefs");
for (const source of asArray(coverage.sourceRefs)) {
  if (!source.id) errors.push("sourceRef missing id");
  if (!source.name) errors.push(`${source.id}: missing name`);
  if (!source.url?.startsWith("https://")) errors.push(`${source.id}: source URL must be https`);
  const domain = sourceDomain(source.url);
  if (!OFFICIAL_SOURCE_DOMAINS.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`))) {
    errors.push(`${source.id}: source URL should be an official domain, got ${domain}`);
  }
}

const knownRefs = sourceRefIds(coverage);
for (const document of asArray(coverage.documents)) {
  if (!document.id) errors.push("document missing id");
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
  for (const sourceRef of asArray(document.sourceRefs)) {
    if (!knownRefs.has(sourceRef)) errors.push(`${document.id}: unknown sourceRef ${sourceRef}`);
  }
}

for (const control of asArray(coverage.codeControls)) {
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

for (const artifact of asArray(coverage.dataArtifacts)) {
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

const acceptance = new Map(asArray(coverage.closedBetaAcceptance).map((item) => [item.id, item]));
for (const itemId of [
  "user_agreement_draft",
  "creator_terms_draft",
  "store_listing_terms_draft",
  "privacy_notice_checklist",
  "legal_counsel_approval",
  "in_app_acceptance_ux",
]) {
  const item = acceptance.get(itemId);
  if (!item) {
    errors.push(`closedBetaAcceptance: missing ${itemId}`);
    continue;
  }
  if (item.status === "pending_external" && !item.needed) {
    errors.push(`${itemId}: pending external items must describe needed work`);
  }
  for (const evidence of asArray(item.evidence)) {
    if (!(await pathExists(evidence))) errors.push(`${itemId}: evidence path does not exist: ${evidence}`);
  }
}

for (const command of asArray(coverage.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const legalReadinessItem = asArray(readiness.gates?.closed_beta?.items).find((item) => item.id === "legal_terms");
if (!legalReadinessItem) {
  errors.push("release-readiness.closed_beta: missing legal_terms item");
} else {
  for (const evidence of ["docs/legal-terms-draft.md", "docs/legal-terms-coverage.json", "data/legal-approval-packet.json", "data/legal-release-signoff-packet.json", "scripts/check-legal-readiness.mjs", "scripts/check-legal-approval-packet.mjs", "scripts/check-legal-release-signoff.mjs"]) {
    if (!asArray(legalReadinessItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.legal_terms: evidence must include ${evidence}`);
    }
  }
  if (legalReadinessItem.status === "ready") {
    errors.push("release-readiness.legal_terms: cannot be ready until counsel approval is recorded");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const drafted = asArray(coverage.closedBetaAcceptance).filter((item) => item.status === "drafted").length;
const pending = asArray(coverage.closedBetaAcceptance).filter((item) => item.status.startsWith("pending")).length;
console.log(`Legal terms draft gate ${coverage.version}: drafted=${drafted}, pending=${pending}`);
