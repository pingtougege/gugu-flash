import assert from "node:assert/strict";
import { test } from "node:test";
import { createHttpFlashApi } from "./http-flash-api.js";
import { createMockFlashApi } from "./mock-flash-api.js";
import {
  FLASH_API_PREFIX,
  FLASH_API_RESPONSE_SHAPE,
  MOCK_FLASH_API_METHOD_ROUTES,
  getApiRoute,
  routeForMockMethod,
  validateApiContract,
} from "./index.js";

function createMemoryApi() {
  let packs = [];
  return createMockFlashApi({
    async loadPacks() {
      return structuredClone(packs);
    },
    async savePacks(next) {
      packs = structuredClone(next);
    },
  });
}

test("flash API contract uses the shared response shape and /flash prefix", () => {
  assert.equal(FLASH_API_RESPONSE_SHAPE.code, "number");
  assert.equal(FLASH_API_RESPONSE_SHAPE.message, "string");
  assert.equal(FLASH_API_RESPONSE_SHAPE.data, "object");
  assert.deepEqual(validateApiContract(), []);

  const feedRoute = getApiRoute("feed.list");
  assert.equal(feedRoute.method, "GET");
  assert.equal(feedRoute.path.startsWith(FLASH_API_PREFIX), true);
  assert.equal(feedRoute.path.includes("guguclub"), false);
});

test("mock facade methods map to future backend routes", () => {
  const api = createMemoryApi();
  const internalMethods = new Set(["exportRuntimeState", "importRuntimeState"]);
  const methods = Object.keys(api).filter((key) => typeof api[key] === "function" && !internalMethods.has(key));

  for (const method of methods) {
    assert.ok(MOCK_FLASH_API_METHOD_ROUTES[method], `${method} should map to a backend route`);
    assert.ok(routeForMockMethod(method), `${method} route should exist`);
  }

  assert.equal(routeForMockMethod("purchaseBadgePack").path, "/flash/hardware-packs/:id/purchase");
  assert.equal(routeForMockMethod("syncBadgePack").responseEntity, "DeviceInstall");
  assert.equal(routeForMockMethod("applyStoreListing").requestEntity, "StoreListing");
  assert.equal(routeForMockMethod("collectAnimeIpPool").path, "/flash/operator/anime-ip-collection");
  assert.equal(routeForMockMethod("collectAnimeIpCharacters").path, "/flash/operator/anime-ip-characters/:id/collect");
  assert.equal(routeForMockMethod("restoreStoryProjectVersion").path, "/flash/story-projects/:id/versions/:versionId/restore");
});

test("story project API routes are reserved for Creator Studio", () => {
  assert.equal(getApiRoute("storyProjects.create").path, "/flash/story-projects");
  assert.equal(getApiRoute("storyProjects.create").requestEntity, "StoryProject");
  assert.equal(getApiRoute("storyProjects.versions.list").method, "GET");
  assert.equal(getApiRoute("storyProjects.versions.create").responseEntity, "StoryProjectVersion");
  assert.equal(getApiRoute("storyProjects.versions.restore").method, "POST");
  assert.equal(getApiRoute("storyProjects.versions.restore").responseEntity, "StoryProject");
  assert.equal(getApiRoute("storyProjects.compileH5").responseEntity, "WorkDraft");
  assert.equal(getApiRoute("storyProjects.compileComic").responseEntity, "ComicEpisode");
  assert.equal(getApiRoute("ai.storyProjectJobs.create").responseEntity, "AiGenerationJob");
});

test("HTTP facade exposes the same public method surface as the mock facade", () => {
  const mockApi = createMemoryApi();
  const httpApi = createHttpFlashApi({ baseUrl: "http://127.0.0.1:4188" });
  const internalMethods = new Set(["exportRuntimeState", "importRuntimeState"]);
  const mockMethods = Object.keys(mockApi).filter((key) => typeof mockApi[key] === "function" && !internalMethods.has(key));

  for (const method of mockMethods) {
    assert.equal(typeof httpApi[method], "function", `${method} should exist on HTTP facade`);
  }
});

test("operator and client routes share the same Gugu Flash API namespace", () => {
  assert.equal(getApiRoute("operator.storeListings.advance").path, "/flash/operator/store-listings/:id/advance");
  assert.equal(getApiRoute("devices.dashboard").path, "/flash/device/dashboard");
  assert.equal(getApiRoute("ips.personas.list").responseEntity, "Persona");
  assert.equal(getApiRoute("operator.supportDiagnostics.get").auth, "support");
  assert.equal(getApiRoute("operator.reviewSla.get").path, "/flash/operator/review-sla");
});
