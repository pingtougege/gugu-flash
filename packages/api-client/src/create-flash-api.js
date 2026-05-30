import { createHttpFlashApi } from "./http-flash-api.js";
import { createMockFlashApi } from "./mock-flash-api.js";

const API_MODE_KEY = "gugu-flash:api-mode";
const API_BASE_KEY = "gugu-flash:api-base-url";
const API_TOKEN_KEY = "gugu-flash:api-token";

function browserConfig() {
  const globalConfig = globalThis.window?.GUGU_FLASH_CONFIG || {};
  const storage = globalThis.window?.localStorage || globalThis.localStorage;
  const locationSearch = globalThis.window?.location?.search || globalThis.location?.search || "";
  const search = new URLSearchParams(locationSearch);
  const searchMode = search.get("api");
  const searchBaseUrl = search.get("apiBase");
  const searchToken = search.get("apiToken");
  if (storage && (searchMode || searchBaseUrl || searchToken)) {
    if (searchMode) storage.setItem(API_MODE_KEY, searchMode);
    if (searchBaseUrl !== null) storage.setItem(API_BASE_KEY, searchBaseUrl);
    if (searchToken !== null) storage.setItem(API_TOKEN_KEY, searchToken);
  }
  const mode = searchMode || globalConfig.apiMode || storage?.getItem(API_MODE_KEY) || "mock";
  const baseUrl = searchBaseUrl || globalConfig.apiBaseUrl || storage?.getItem(API_BASE_KEY) || "";
  const token = searchToken || globalConfig.apiToken || storage?.getItem(API_TOKEN_KEY) || "";
  return { mode, baseUrl, token };
}

export function createFlashApi(options = {}) {
  const config = {
    ...browserConfig(),
    ...options,
  };
  const mode = config.mode === "http" ? "http" : "mock";

  if (mode === "http") {
    const api = createHttpFlashApi({
      baseUrl: config.baseUrl || "",
      token: config.token || "",
      getToken: config.getToken,
    });
    api.runtime = { mode, baseUrl: config.baseUrl || "" };
    return api;
  }

  const api = createMockFlashApi({
    loadPacks: config.loadPacks,
    savePacks: config.savePacks,
    ipPool: config.ipPool,
    rolePersonas: config.rolePersonas,
  });
  api.runtime = { mode: "mock", baseUrl: "" };
  return api;
}

export function setFlashApiRuntime({ mode, baseUrl = "", token = "" }) {
  const storage = globalThis.localStorage;
  if (!storage) return;
  if (mode) storage.setItem(API_MODE_KEY, mode);
  storage.setItem(API_BASE_KEY, baseUrl);
  if (token) storage.setItem(API_TOKEN_KEY, token);
}

export function clearFlashApiRuntime() {
  const storage = globalThis.localStorage;
  if (!storage) return;
  storage.removeItem(API_MODE_KEY);
  storage.removeItem(API_BASE_KEY);
  storage.removeItem(API_TOKEN_KEY);
}
