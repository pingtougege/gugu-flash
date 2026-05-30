import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  FLASH_AUTH_ROLES,
  FLASH_OPERATOR_PERMISSIONS,
  FLASH_ROLE_PERMISSIONS,
  hasFlashPermission,
  operatorPermissionForRoute,
  requiresOperatorInvite,
} from "../apps/backend/src/flash-auth-policy.js";

const AUTH_RBAC_URL = new URL("../docs/auth-rbac-readiness.json", import.meta.url);
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

const readiness = JSON.parse(await readFile(AUTH_RBAC_URL, "utf8"));
const releaseReadiness = JSON.parse(await readFile(RELEASE_READINESS_URL, "utf8"));
const errors = [];

if (!readiness.version) errors.push("auth-rbac-readiness: missing version");
if (!/^\d{4}-\d{2}-\d{2}$/.test(readiness.updatedAt || "")) {
  errors.push("auth-rbac-readiness: updatedAt must be YYYY-MM-DD");
}
if (readiness.status !== "ready_for_closed_beta_rbac") {
  errors.push("auth-rbac-readiness: status must be ready_for_closed_beta_rbac");
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

for (const role of asArray(readiness.requiredRoles)) {
  if (!FLASH_AUTH_ROLES.includes(role)) errors.push(`requiredRoles: unknown role ${role}`);
  if (!Object.hasOwn(FLASH_ROLE_PERMISSIONS, role)) errors.push(`FLASH_ROLE_PERMISSIONS missing ${role}`);
}

for (const permission of asArray(readiness.requiredPermissions)) {
  if (!FLASH_OPERATOR_PERMISSIONS.includes(permission)) errors.push(`requiredPermissions: unknown permission ${permission}`);
}

const requiredRoutePermissions = [
  ["/flash/operator/dashboard", "GET", "operator:read"],
  ["/flash/operator/ops-metrics", "GET", "ops:read"],
  ["/flash/operator/reports/report_1/resolve", "POST", "governance:write"],
  ["/flash/operator/store-listings/listing_1/reject", "POST", "store_review:write"],
  ["/flash/operator/hardware-packs/hw_1/export-to-hardware-studio", "POST", "hardware:write"],
  ["/flash/operator/refund-callbacks", "POST", "payment:write"],
  ["/flash/operator/payment-callbacks", "POST", null],
];
for (const [path, method, permission] of requiredRoutePermissions) {
  if (operatorPermissionForRoute(path, method) !== permission) {
    errors.push(`operatorPermissionForRoute ${method} ${path}: expected ${permission}`);
  }
}

if (hasFlashPermission("creator", "operator:read")) errors.push("creator must not have operator:read");
if (!hasFlashPermission("reviewer", "governance:write")) errors.push("reviewer must have governance:write");
if (hasFlashPermission("reviewer", "hardware:write")) errors.push("reviewer must not have hardware:write");
if (!hasFlashPermission("hardware_operator", "hardware:write")) errors.push("hardware_operator must have hardware:write");
if (hasFlashPermission("hardware_operator", "governance:write")) errors.push("hardware_operator must not have governance:write");
if (!requiresOperatorInvite("operator")) errors.push("operator role must require invite");
if (requiresOperatorInvite("creator")) errors.push("creator role must not require invite");

for (const command of asArray(readiness.releaseCommands)) {
  if (!/^(npm|node)\b/.test(command)) errors.push(`releaseCommands: invalid command ${command}`);
}

const closedBetaItems = asArray(releaseReadiness.gates?.closed_beta?.items);
const operatorPermissions = closedBetaItems.find((item) => item.id === "operator_permissions");
if (!operatorPermissions) {
  errors.push("release-readiness.closed_beta: missing operator_permissions item");
} else {
  for (const evidence of [
    "docs/auth-rbac-plan.md",
    "docs/auth-rbac-readiness.json",
    "scripts/check-auth-rbac-readiness.mjs",
    "apps/backend/src/flash-auth-policy.js",
    "apps/backend/src/flash-auth-policy.test.js",
    "apps/backend/src/flash-http-server.js",
    "packages/api-client/src/http-flash-api.test.js",
  ]) {
    if (!asArray(operatorPermissions.evidence).includes(evidence)) {
      errors.push(`release-readiness.operator_permissions: evidence must include ${evidence}`);
    }
  }
  if (operatorPermissions.status !== "ready") {
    errors.push("release-readiness.operator_permissions: status must be ready after RBAC gate passes");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Auth RBAC readiness gate ${readiness.version}: roles=${asArray(readiness.requiredRoles).length}, permissions=${asArray(readiness.requiredPermissions).length}, route_checks=${requiredRoutePermissions.length}`);
