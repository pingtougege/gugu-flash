import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export function createJsonFlashStore({ dataPath, statePath, seedPath }) {
  let packsCache = null;
  let runtimeStateCache = null;

  async function loadFromFile(path) {
    return JSON.parse(await readFile(path, "utf8"));
  }

  async function loadRuntimeState() {
    if (runtimeStateCache) return structuredClone(runtimeStateCache);
    try {
      runtimeStateCache = await loadFromFile(statePath);
    } catch {
      runtimeStateCache = {};
    }
    return structuredClone(runtimeStateCache);
  }

  async function saveRuntimeState(nextState) {
    const previousState = runtimeStateCache || {};
    const mergedState = {
      ...previousState,
      ...structuredClone(nextState),
    };
    if (!Object.hasOwn(nextState, "sessions") && previousState.sessions) {
      mergedState.sessions = previousState.sessions;
    }
    runtimeStateCache = mergedState;
    await mkdir(dirname(statePath), { recursive: true });
    await writeFile(statePath, `${JSON.stringify(runtimeStateCache, null, 2)}\n`);
  }

  async function updateRuntimeState(mutator) {
    const state = await loadRuntimeState();
    const result = await mutator(state);
    await saveRuntimeState(state);
    return structuredClone(result);
  }

  function createArrayRepository(collectionName, { filter = null } = {}) {
    return {
      async list(query = {}) {
        const state = await loadRuntimeState();
        const items = state[collectionName] || [];
        const filtered = typeof filter === "function" ? items.filter((item) => filter(item, query)) : items;
        return structuredClone(filtered);
      },

      async get(id) {
        const state = await loadRuntimeState();
        return structuredClone((state[collectionName] || []).find((item) => item.id === id) || null);
      },

      async save(item) {
        return updateRuntimeState((state) => {
          state[collectionName] = state[collectionName] || [];
          const index = state[collectionName].findIndex((entry) => entry.id === item.id);
          if (index >= 0) state[collectionName][index] = structuredClone(item);
          else state[collectionName].unshift(structuredClone(item));
          return item;
        });
      },
    };
  }

  const orders = {
    async list() {
      const state = await loadRuntimeState();
      return structuredClone(state.orders || []);
    },

    async get(orderId) {
      const state = await loadRuntimeState();
      return structuredClone((state.orders || []).find((order) => order.id === orderId) || null);
    },

    async save(order) {
      return updateRuntimeState((state) => {
        state.orders = state.orders || [];
        const index = state.orders.findIndex((item) => item.id === order.id);
        if (index >= 0) state.orders[index] = structuredClone(order);
        else state.orders.unshift(structuredClone(order));
        return order;
      });
    },
  };

  const deviceEntitlements = {
    async listForDevice(deviceId) {
      const state = await loadRuntimeState();
      return structuredClone(Object.values(state.deviceEntitlements?.[deviceId] || {}));
    },

    async get(deviceId, storeId) {
      const state = await loadRuntimeState();
      return structuredClone(state.deviceEntitlements?.[deviceId]?.[storeId] || null);
    },

    async save(deviceId, storeId, entitlement) {
      return updateRuntimeState((state) => {
        state.deviceEntitlements = state.deviceEntitlements || {};
        state.deviceEntitlements[deviceId] = state.deviceEntitlements[deviceId] || {};
        state.deviceEntitlements[deviceId][storeId || entitlement.storeId] = structuredClone(entitlement);
        return entitlement;
      });
    },
  };

  const deviceInstalls = {
    async listForDevice(deviceId) {
      const state = await loadRuntimeState();
      return structuredClone(Object.values(state.deviceInstalls?.[deviceId] || {}));
    },

    async get(deviceId, storeId) {
      const state = await loadRuntimeState();
      return structuredClone(state.deviceInstalls?.[deviceId]?.[storeId] || null);
    },

    async save(deviceId, storeId, install) {
      return updateRuntimeState((state) => {
        state.deviceInstalls = state.deviceInstalls || {};
        state.deviceInstalls[deviceId] = state.deviceInstalls[deviceId] || {};
        state.deviceInstalls[deviceId][storeId] = structuredClone(install);
        return install;
      });
    },
  };

  const deviceSyncJobs = {
    ...createArrayRepository("deviceSyncJobs", {
      filter: (item, query) => !query.deviceId || item.deviceId === query.deviceId,
    }),
    listForDevice(deviceId) {
      return this.list({ deviceId });
    },
  };

  const sessions = {
    async list() {
      const state = await loadRuntimeState();
      return structuredClone(state.sessions || []);
    },

    async get(sessionId) {
      const state = await loadRuntimeState();
      return structuredClone((state.sessions || []).find((session) => session.id === sessionId) || null);
    },

    async getByToken(token) {
      if (!token) return null;
      const state = await loadRuntimeState();
      const now = Date.now();
      const session = (state.sessions || []).find((item) => (
        item.status === "active" &&
        item.expiresAt > now &&
        (item.accessToken === token || item.refreshToken === token)
      ));
      return structuredClone(session || null);
    },

    async create({ userId = "user_local", role = "creator", displayName = "你", ttlMs = 1000 * 60 * 60 * 24 * 7 } = {}) {
      return updateRuntimeState((state) => {
        const now = Date.now();
        const session = {
          id: `session_${randomUUID()}`,
          userId,
          displayName,
          role,
          status: "active",
          accessToken: `gfs_access_${randomUUID()}`,
          refreshToken: `gfs_refresh_${randomUUID()}`,
          createdAt: now,
          updatedAt: now,
          expiresAt: now + ttlMs,
        };
        state.sessions = state.sessions || [];
        state.sessions.unshift(session);
        return session;
      });
    },

    async refreshByToken(token, ttlMs = 1000 * 60 * 60 * 24 * 7) {
      return updateRuntimeState((state) => {
        const now = Date.now();
        const session = (state.sessions || []).find((item) => (
          item.status === "active" &&
          item.expiresAt > now &&
          (item.accessToken === token || item.refreshToken === token)
        ));
        if (!session) return null;
        session.accessToken = `gfs_access_${randomUUID()}`;
        session.refreshToken = `gfs_refresh_${randomUUID()}`;
        session.updatedAt = now;
        session.expiresAt = now + ttlMs;
        return session;
      });
    },

    async revokeByToken(token) {
      return updateRuntimeState((state) => {
        const session = (state.sessions || []).find((item) => item.accessToken === token || item.refreshToken === token);
        if (!session) return null;
        session.status = "revoked";
        session.revokedAt = Date.now();
        session.updatedAt = session.revokedAt;
        return session;
      });
    },
  };

  const comments = {
    ...createArrayRepository("comments", {
      filter: (item, query) => !query.workId || item.workId === query.workId,
    }),
    listForWork(workId) {
      return this.list({ workId });
    },
  };

  const blockRelations = {
    ...createArrayRepository("blockRelations", {
      filter: (item, query) => !query.blockerUserId || item.blockerUserId === query.blockerUserId,
    }),
    listForBlocker(blockerUserId) {
      return this.list({ blockerUserId });
    },
  };

  const reports = {
    ...createArrayRepository("reports", {
      filter: (item, query) => !query.reporterUserId || item.reporterUserId === query.reporterUserId,
    }),
    listForReporter(reporterUserId) {
      return this.list({ reporterUserId });
    },
  };

  const appeals = {
    ...createArrayRepository("appeals", {
      filter: (item, query) => !query.appellantUserId || item.appellantUserId === query.appellantUserId,
    }),
    listForAppellant(appellantUserId) {
      return this.list({ appellantUserId });
    },
  };

  const rightsClaims = createArrayRepository("rightsClaims");
  const moderationActions = createArrayRepository("moderationActions");
  const operationLogs = createArrayRepository("operationLogs");
  const paymentCallbacks = createArrayRepository("paymentCallbacks");
  const refundCallbacks = createArrayRepository("refundCallbacks");
  const storyProjects = createArrayRepository("storyProjects", {
    filter: (item, query) => !query.authorUserId || item.authorUserId === query.authorUserId,
  });
  const storyProjectVersions = {
    ...createArrayRepository("storyProjectVersions", {
      filter: (item, query) => !query.storyProjectId || item.storyProjectId === query.storyProjectId,
    }),
    listForProject(storyProjectId) {
      return this.list({ storyProjectId });
    },
  };
  const aiGenerationJobs = {
    ...createArrayRepository("aiGenerationJobs", {
      filter: (item, query) => !query.storyProjectId || item.storyProjectId === query.storyProjectId,
    }),
    listForProject(storyProjectId) {
      return this.list({ storyProjectId });
    },
  };

  return {
    async loadPacks() {
      if (packsCache) return structuredClone(packsCache);
      try {
        packsCache = await loadFromFile(dataPath);
      } catch {
        packsCache = await loadFromFile(seedPath);
      }
      return structuredClone(packsCache);
    },

    async savePacks(nextPacks) {
      packsCache = structuredClone(nextPacks);
      await mkdir(dirname(dataPath), { recursive: true });
      await writeFile(dataPath, `${JSON.stringify(packsCache, null, 2)}\n`);
    },

    loadRuntimeState,
    saveRuntimeState,
    sessions,
    orders,
    deviceEntitlements,
    deviceInstalls,
    deviceSyncJobs,
    comments,
    blockRelations,
    reports,
    rightsClaims,
    appeals,
    moderationActions,
    operationLogs,
    paymentCallbacks,
    refundCallbacks,
    storyProjects,
    storyProjectVersions,
    aiGenerationJobs,
  };
}
