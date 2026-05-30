import assert from "node:assert/strict";
import test from "node:test";

import {
  FLASH_AUTH_POLICY_VERSION,
  FLASH_OPERATOR_ROUTE_RULE_IDS,
  hasFlashPermission,
  operatorPermissionForRoute,
  permissionsForRole,
  requiresOperatorInvite,
} from "./flash-auth-policy.js";

test("flash auth policy exposes route-level RBAC for release gates", () => {
  assert.equal(FLASH_AUTH_POLICY_VERSION, "gugu_flash_auth_rbac_v1");
  assert.ok(FLASH_OPERATOR_ROUTE_RULE_IDS.includes("operator_hardware_write"));
  assert.ok(FLASH_OPERATOR_ROUTE_RULE_IDS.includes("operator_governance_write"));
});

test("role permissions keep reviewer, hardware, support, and creator boundaries separate", () => {
  assert.equal(hasFlashPermission("creator", "operator:read"), false);
  assert.equal(hasFlashPermission("reviewer", "governance:write"), true);
  assert.equal(hasFlashPermission("reviewer", "hardware:write"), false);
  assert.equal(hasFlashPermission("hardware_operator", "hardware:write"), true);
  assert.equal(hasFlashPermission("hardware_operator", "governance:write"), false);
  assert.equal(hasFlashPermission("support", "payment:read"), true);
  assert.equal(hasFlashPermission("support", "payment:write"), false);
  assert.equal(hasFlashPermission("super_admin", "hardware:write"), true);
  assert.deepEqual(permissionsForRole("guest"), []);
});

test("operator route policy maps sensitive routes to specific permissions", () => {
  assert.equal(operatorPermissionForRoute("/flash/operator/dashboard", "GET"), "operator:read");
  assert.equal(operatorPermissionForRoute("/flash/operator/ops-metrics", "GET"), "ops:read");
  assert.equal(operatorPermissionForRoute("/flash/operator/reports/report_1/resolve", "POST"), "governance:write");
  assert.equal(operatorPermissionForRoute("/flash/operator/store-listings/listing_1/freeze", "POST"), "store_review:write");
  assert.equal(operatorPermissionForRoute("/flash/operator/hardware-packs/hw_1/export-to-hardware-studio", "POST"), "hardware:write");
  assert.equal(operatorPermissionForRoute("/flash/operator/refund-callbacks", "POST"), "payment:write");
  assert.equal(operatorPermissionForRoute("/flash/operator/payment-callbacks", "POST"), null);
});

test("non-creator roles require operator invite issuance", () => {
  assert.equal(requiresOperatorInvite("creator"), false);
  assert.equal(requiresOperatorInvite("reviewer"), true);
  assert.equal(requiresOperatorInvite("operator"), true);
});
