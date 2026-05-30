import assert from "node:assert/strict";
import test from "node:test";

import {
  ASSET_SECURITY_POLICY_VERSION,
  createAssetSecurityReport,
  validateAssetSourceStatement,
  validateAssetUploadSecurity,
} from "./asset-security.js";

test("asset security policy accepts safe image uploads with source statements", () => {
  const asset = {
    filename: "cover.png",
    mediaType: "image/png",
    sizeBytes: 128 * 1024,
    sourceUrl: "https://cdn.example.test/cover.png",
    sourceStatement: {
      sourceType: "original",
      creatorUserId: "user_local",
      rightsAcknowledged: true,
    },
  };
  const report = createAssetSecurityReport(asset);

  assert.deepEqual(validateAssetUploadSecurity(asset), []);
  assert.equal(report.policyVersion, ASSET_SECURITY_POLICY_VERSION);
  assert.equal(report.status, "passed");
  assert.equal(report.mediaKind, "image");
});

test("asset security policy blocks executable, svg, private url, and oversized files", () => {
  const errors = validateAssetUploadSecurity({
    filename: "payload.svg",
    mediaType: "image/svg+xml",
    sizeBytes: 9 * 1024 * 1024,
    sourceUrl: "http://127.0.0.1/payload.svg",
    sourceStatement: {
      sourceType: "licensed",
      rightsAcknowledged: false,
    },
  });

  assert.ok(errors.some((error) => error.includes("not allowed")));
  assert.ok(errors.some((error) => error.includes("blocked")));
  assert.ok(errors.some((error) => error.includes("https")));
  assert.ok(errors.some((error) => error.includes("private")));
  assert.ok(errors.some((error) => error.includes("licenseUrl")));
  assert.ok(errors.some((error) => error.includes("rightsAcknowledged")));
});

test("asset source statements reject external contact links", () => {
  const errors = validateAssetSourceStatement({
    sourceType: "original",
    creatorName: "Creator",
    rightsAcknowledged: true,
    note: "联系微信 vx123 交易。",
  });

  assert.ok(errors.some((error) => error.includes("external contact")));
});
