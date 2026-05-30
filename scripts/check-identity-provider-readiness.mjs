import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  createIdentityToken,
  verifyIdentityToken,
} from "../apps/backend/src/flash-identity-token.js";

const IDENTITY_URL = new URL("../docs/identity-provider-readiness.json", import.meta.url);
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

const readiness = JSON.parse(await readFile(IDENTITY_URL, "utf8"));
const releaseReadiness = JSON.parse(await readFile(RELEASE_READINESS_URL, "utf8"));
const errors = [];

if (!readiness.version) errors.push("identity-provider-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(readiness.updatedAt || "")) {
  errors.push("identity-provider-readiness: updatedAt must be YYYY-MM-DD");
}
if (readiness.status !== "draft_pending_real_identity_provider") {
  errors.push("identity-provider-readiness: status must remain draft_pending_real_identity_provider until a real provider is configured");
}

for (const section of ["documents", "codeControls"]) {
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

for (const artifact of asArray(readiness.dataArtifacts)) {
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

const token = createIdentityToken({
  sub: "identity_gate",
  displayName: "Identity Gate",
  role: "reviewer",
  jti: "identity_gate_token",
}, {
  secret: "identity-gate-secret",
  issuer: "https://idp.gate.test",
  audience: "gugu-flash-api",
  now: 1760000000000,
});
const valid = verifyIdentityToken(token, {
  secret: "identity-gate-secret",
  issuer: "https://idp.gate.test",
  audience: "gugu-flash-api",
  now: 1760000001000,
});
if (!valid.valid) errors.push(`identity token verifier rejected valid token: ${valid.reason}`);
if (valid.session?.source !== "external_identity") errors.push("identity token session source must be external_identity");
if (!valid.session?.permissions?.includes("governance:write")) errors.push("identity reviewer session must include governance:write");

const wrongAudience = verifyIdentityToken(token, {
  secret: "identity-gate-secret",
  issuer: "https://idp.gate.test",
  audience: "wrong-audience",
  now: 1760000001000,
});
if (wrongAudience.reason !== "identity_token_audience_invalid") {
  errors.push("identity token verifier must reject wrong audience");
}
const expired = verifyIdentityToken(token, {
  secret: "identity-gate-secret",
  issuer: "https://idp.gate.test",
  audience: "gugu-flash-api",
  now: 1760000000000 + 1000 * 60 * 31,
});
if (expired.reason !== "identity_token_expired") {
  errors.push("identity token verifier must reject expired tokens");
}

for (const claim of asArray(readiness.requiredClaims)) {
  if (!valid.claims || !Object.hasOwn(valid.claims, claim)) {
    errors.push(`requiredClaims: verified token missing ${claim}`);
  }
}

for (const item of asArray(readiness.externalAcceptance)) {
  if (!item.id) errors.push("externalAcceptance: missing id");
  if (item.status !== "pending_external") errors.push(`${item.id}: must remain pending_external until real identity provider work is recorded`);
  if (!item.needed) errors.push(`${item.id}: missing needed`);
}

for (const command of asArray(readiness.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const realAuthItem = asArray(releaseReadiness.gates?.closed_beta?.items).find((item) => item.id === "real_auth_session");
if (!realAuthItem) {
  errors.push("release-readiness.closed_beta: missing real_auth_session item");
} else {
  for (const evidence of [
    "docs/identity-provider-readiness.md",
    "docs/identity-provider-readiness.json",
    "data/identity-provider-integration-packet.json",
    "data/identity-operations-certification-packet.json",
    "scripts/check-identity-provider-readiness.mjs",
    "scripts/check-identity-provider-packet.mjs",
    "scripts/check-identity-operations.mjs",
    "apps/backend/src/flash-identity-token.js",
    "apps/backend/src/flash-identity-token.test.js",
  ]) {
    if (!asArray(realAuthItem.evidence).includes(evidence)) {
      errors.push(`release-readiness.real_auth_session: evidence must include ${evidence}`);
    }
  }
  if (realAuthItem.status === "ready") {
    errors.push("release-readiness.real_auth_session: cannot be ready until production identity provider is configured");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const pending = asArray(readiness.externalAcceptance).filter((item) => item.status === "pending_external").length;
console.log(`Identity provider readiness gate ${readiness.version}: claims=${asArray(readiness.requiredClaims).length}, controls=${asArray(readiness.codeControls).length}, artifacts=${asArray(readiness.dataArtifacts).length}, pending_external=${pending}`);
