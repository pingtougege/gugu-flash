import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { normalizeFlashRole, permissionsForRole } from "./flash-auth-policy.js";

export const FLASH_IDENTITY_TOKEN_VERSION = "gugu_flash_identity_token_v1";
export const DEFAULT_IDENTITY_ISSUER = "gugu-flash-alpha-idp";
export const DEFAULT_IDENTITY_AUDIENCE = "gugu-flash-api";
export const DEFAULT_IDENTITY_TOKEN_TTL_MS = 1000 * 60 * 30;

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(String(value || ""), "base64url").toString("utf8"));
}

function timingSafeEqualString(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signTokenParts(headerPart, payloadPart, secret) {
  return createHmac("sha256", secret).update(`${headerPart}.${payloadPart}`).digest("base64url");
}

export function createIdentityToken(claims = {}, {
  secret,
  issuer = DEFAULT_IDENTITY_ISSUER,
  audience = DEFAULT_IDENTITY_AUDIENCE,
  now = Date.now(),
  ttlMs = DEFAULT_IDENTITY_TOKEN_TTL_MS,
} = {}) {
  if (!secret) throw new Error("identity token secret is required");
  const header = {
    alg: "HS256",
    typ: FLASH_IDENTITY_TOKEN_VERSION,
  };
  const payload = {
    iss: issuer,
    aud: audience,
    sub: claims.sub || claims.userId || "user_local",
    displayName: claims.displayName || claims.name || "你",
    role: normalizeFlashRole(claims.role || "creator"),
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + ttlMs) / 1000),
    jti: claims.jti || `identity_${randomUUID()}`,
    ...claims,
  };
  const headerPart = base64UrlEncode(header);
  const payloadPart = base64UrlEncode(payload);
  const signature = signTokenParts(headerPart, payloadPart, secret);
  return `${headerPart}.${payloadPart}.${signature}`;
}

export function verifyIdentityToken(token = "", {
  secret,
  issuer = DEFAULT_IDENTITY_ISSUER,
  audience = DEFAULT_IDENTITY_AUDIENCE,
  now = Date.now(),
} = {}) {
  if (!secret) return { valid: false, reason: "identity_secret_missing" };
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return { valid: false, reason: "identity_token_malformed" };

  try {
    const [headerPart, payloadPart, signature] = parts;
    const header = base64UrlDecode(headerPart);
    const payload = base64UrlDecode(payloadPart);
    const expectedSignature = signTokenParts(headerPart, payloadPart, secret);
    if (header.typ !== FLASH_IDENTITY_TOKEN_VERSION || header.alg !== "HS256") {
      return { valid: false, reason: "identity_token_header_invalid" };
    }
    if (!timingSafeEqualString(signature, expectedSignature)) {
      return { valid: false, reason: "identity_token_signature_invalid" };
    }
    if (payload.iss !== issuer) return { valid: false, reason: "identity_token_issuer_invalid" };
    if (payload.aud !== audience) return { valid: false, reason: "identity_token_audience_invalid" };
    if (!payload.sub) return { valid: false, reason: "identity_token_subject_required" };
    if (!payload.exp || payload.exp * 1000 <= now) return { valid: false, reason: "identity_token_expired" };

    const role = normalizeFlashRole(payload.role || "creator");
    return {
      valid: true,
      claims: payload,
      session: {
        id: payload.jti || `identity_${payload.sub}`,
        userId: payload.sub,
        displayName: payload.displayName || payload.name || payload.sub,
        role,
        status: "active",
        source: "external_identity",
        issuer: payload.iss,
        audience: payload.aud,
        createdAt: payload.iat ? payload.iat * 1000 : null,
        updatedAt: payload.iat ? payload.iat * 1000 : null,
        expiresAt: payload.exp * 1000,
        permissions: permissionsForRole(role),
      },
    };
  } catch {
    return { valid: false, reason: "identity_token_invalid_json" };
  }
}
