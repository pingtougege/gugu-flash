import assert from "node:assert/strict";
import test from "node:test";

import {
  FLASH_IDENTITY_TOKEN_VERSION,
  createIdentityToken,
  verifyIdentityToken,
} from "./flash-identity-token.js";

test("identity token verifies signed issuer, audience, expiry, and role claims", () => {
  const token = createIdentityToken({
    sub: "user_identity",
    displayName: "Identity User",
    role: "reviewer",
    jti: "identity_test_1",
  }, {
    secret: "identity-secret",
    issuer: "issuer-a",
    audience: "audience-a",
    now: 1760000000000,
  });
  const result = verifyIdentityToken(token, {
    secret: "identity-secret",
    issuer: "issuer-a",
    audience: "audience-a",
    now: 1760000001000,
  });

  assert.equal(result.valid, true);
  assert.equal(result.claims.sub, "user_identity");
  assert.equal(result.session.source, "external_identity");
  assert.equal(result.session.role, "reviewer");
  assert.ok(result.session.permissions.includes("governance:write"));
  assert.equal(token.split(".").length, 3);
  assert.equal(FLASH_IDENTITY_TOKEN_VERSION, "gugu_flash_identity_token_v1");
});

test("identity token rejects bad signatures, expired claims, and wrong audience", () => {
  const token = createIdentityToken({ sub: "user_identity" }, {
    secret: "identity-secret",
    audience: "audience-a",
    now: 1760000000000,
    ttlMs: 1000,
  });
  const tampered = `${token.slice(0, -1)}x`;

  assert.equal(verifyIdentityToken(tampered, {
    secret: "identity-secret",
    audience: "audience-a",
    now: 1760000000000,
  }).reason, "identity_token_signature_invalid");
  assert.equal(verifyIdentityToken(token, {
    secret: "identity-secret",
    audience: "audience-a",
    now: 1760000002000,
  }).reason, "identity_token_expired");
  assert.equal(verifyIdentityToken(token, {
    secret: "identity-secret",
    audience: "audience-b",
    now: 1760000000000,
  }).reason, "identity_token_audience_invalid");
});
