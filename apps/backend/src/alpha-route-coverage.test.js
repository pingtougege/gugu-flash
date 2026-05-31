import assert from "node:assert/strict";
import test from "node:test";

import {
  BACKEND_ALPHA_ROUTE_IDS,
  BACKEND_ALPHA_STUB_ROUTE_IDS,
  validateBackendAlphaRouteCoverage,
} from "./alpha-route-coverage.js";

test("Backend Alpha route coverage stays aligned with the shared API contract", () => {
  assert.deepEqual(validateBackendAlphaRouteCoverage(), []);
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("feed.list"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("ai.createDraft"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("storyProjects.create"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("storyProjects.assets.list"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("ai.storyProjectJobs.list"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("ai.storyProjectJobs.create"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("ai.renderJobs.run"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("ai.generateImage"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("assets.list"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("devices.sync"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("operator.supportDiagnostics.get"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("operator.reviewSla.get"));
  assert.ok(BACKEND_ALPHA_ROUTE_IDS.has("operator.hardwarePacks.export"));
});

test("Backend Alpha keeps stubbed production routes explicit", () => {
  assert.equal(BACKEND_ALPHA_STUB_ROUTE_IDS.has("assets.create"), false);
  assert.ok(BACKEND_ALPHA_STUB_ROUTE_IDS.has("drafts.validate"));
  assert.ok(BACKEND_ALPHA_STUB_ROUTE_IDS.has("storyProjects.compileH5"));
  assert.ok(BACKEND_ALPHA_STUB_ROUTE_IDS.has("ai.storyProjectJobs.create"));
  assert.ok(BACKEND_ALPHA_STUB_ROUTE_IDS.has("operator.hardwarePacks.create"));
});
