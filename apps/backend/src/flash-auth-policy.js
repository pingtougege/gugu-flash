export const FLASH_AUTH_POLICY_VERSION = "gugu_flash_auth_rbac_v1";

export const FLASH_AUTH_ROLES = [
  "guest",
  "creator",
  "reviewer",
  "hardware_operator",
  "support",
  "operator",
  "admin",
  "super_admin",
];

export const FLASH_OPERATOR_PERMISSIONS = [
  "operator:read",
  "ops:read",
  "review:write",
  "governance:write",
  "store_review:write",
  "hardware:write",
  "content_ops:write",
  "payment:read",
  "payment:write",
  "super_admin",
];

export const FLASH_ROLE_PERMISSIONS = {
  guest: [],
  creator: ["user:write"],
  reviewer: ["operator:read", "review:write", "governance:write", "store_review:write"],
  hardware_operator: ["operator:read", "hardware:write"],
  support: ["operator:read", "payment:read"],
  operator: [
    "operator:read",
    "ops:read",
    "review:write",
    "governance:write",
    "store_review:write",
    "hardware:write",
    "content_ops:write",
    "payment:read",
    "payment:write",
  ],
  admin: [
    "operator:read",
    "ops:read",
    "review:write",
    "governance:write",
    "store_review:write",
    "hardware:write",
    "content_ops:write",
    "payment:read",
    "payment:write",
  ],
  super_admin: ["super_admin"],
};

export const FLASH_OPERATOR_ROUTE_RULE_IDS = [
  "operator_dashboard_read",
  "operator_ops_metrics_read",
  "operator_review_write",
  "operator_governance_write",
  "operator_store_review_write",
  "operator_hardware_write",
  "operator_payment_write",
  "operator_content_ops_write",
];

export function normalizeFlashRole(role = "guest") {
  return FLASH_AUTH_ROLES.includes(role) ? role : "guest";
}

export function permissionsForRole(role = "guest") {
  const normalizedRole = normalizeFlashRole(role);
  const permissions = FLASH_ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes("super_admin")
    ? [...FLASH_OPERATOR_PERMISSIONS]
    : [...permissions];
}

export function hasFlashPermission(role = "guest", permission = "") {
  if (!permission) return true;
  const normalizedRole = normalizeFlashRole(role);
  const permissions = FLASH_ROLE_PERMISSIONS[normalizedRole] || [];
  return permissions.includes("super_admin") || permissions.includes(permission);
}

export function requiresOperatorInvite(role = "guest") {
  return !["guest", "creator"].includes(normalizeFlashRole(role));
}

export function staticDemoRoleFromToken(token = "") {
  return {
    "demo-user": "creator",
    "demo-reviewer": "reviewer",
    "demo-operator": "operator",
    "demo-hardware": "hardware_operator",
    "demo-admin": "super_admin",
  }[token] || null;
}

export function operatorPermissionForRoute(pathname = "", method = "GET") {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "flash" || parts[1] !== "operator") return null;
  const resource = parts[2] || "";
  const action = parts[4] || "";

  if (resource === "payment-callbacks" && method === "POST") return null;
  if (resource === "ops-metrics") return "ops:read";
  if (method === "GET") {
    if (resource === "settlements") return "payment:read";
    return "operator:read";
  }
  if (resource === "review-tasks") return "review:write";
  if (["reports", "rights-claims", "appeals"].includes(resource)) return "governance:write";
  if (resource === "store-listings") return "store_review:write";
  if (resource === "hardware-packs") return "hardware:write";
  if (resource === "refund-callbacks" || resource === "settlements") return "payment:write";
  if (resource === "anime-ip-collection") return "content_ops:write";
  if (action === "freeze" || action === "delist") return "governance:write";
  return "operator:read";
}
