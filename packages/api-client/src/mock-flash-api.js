import {
  cloneAsRemix,
  createDraftFromPrompt,
  scorePack,
} from "../../core/src/index.js";

export function createMockFlashApi({ loadPacks, savePacks }) {
  let packsCache = null;
  let badgeLibraryCache = null;
  let devicesCache = null;
  let activeDeviceId = "badge_s3_01";

  async function getPacks() {
    if (!packsCache) packsCache = await loadPacks();
    return packsCache;
  }

  async function commit(packs) {
    packsCache = packs;
    await savePacks(packs);
    return packs;
  }

  async function findPack(id) {
    const packs = await getPacks();
    return packs.find((pack) => pack.id === id);
  }

  async function getBadgeLibrary() {
    if (badgeLibraryCache) return badgeLibraryCache;
    const packs = await getPacks();
    badgeLibraryCache = packs
      .sort((a, b) => scorePack(b) - scorePack(a))
      .map((pack, index) => ({
        id: `store_${pack.id}`,
        packId: pack.id,
        title: pack.title,
        description: `${pack.tags?.slice(0, 3).join(" / ") || "官方精选"} · 由 H5 作品适配`,
        price: index === 0 ? 0 : (index === 1 ? 6 : 3),
        status: "downloadable",
        ownership: index === 1 ? "not_owned" : "owned",
        downloadStatus: index === 0 ? "downloaded" : "not_downloaded",
        syncStatus: index === 0 ? "synced" : "not_synced",
        cover: pack.cover,
      }));
    if (!badgeLibraryCache.length && packs[0]) {
      badgeLibraryCache = [{
        id: `store_${packs[0].id}`,
        packId: packs[0].id,
        title: packs[0].title,
        description: "示例内容包 · 等官方精选后进入商店",
        price: 0,
        status: "candidate",
        ownership: "owned",
        downloadStatus: "not_downloaded",
        syncStatus: "not_synced",
        cover: packs[0].cover,
      }];
    }
    return badgeLibraryCache;
  }

  async function getDevices() {
    if (devicesCache) return devicesCache;
    const library = await getBadgeLibrary();
    devicesCache = [
      {
        id: "badge_s3_01",
        name: "Gugu Badge S3",
        model: "Circle 185",
        status: "在线",
        battery: 82,
        boundAt: "2026-05-19",
        currentStoreId: library[0]?.id || null,
      },
      {
        id: "badge_s3_02",
        name: "备用吧唧",
        model: "Circle 185",
        status: "离线",
        battery: 41,
        boundAt: "2026-05-12",
        currentStoreId: null,
      },
    ];
    return devicesCache;
  }

  return {
    async getFeed() {
      return { items: await getPacks() };
    },

    async getWork(id) {
      return { item: await findPack(id) };
    },

    async createDraft(prompt, template) {
      return { item: createDraftFromPrompt(prompt, template) };
    },

    async publishDraft(pack) {
      const packs = await getPacks();
      packs.unshift(pack);
      await commit(packs);
      return { item: pack };
    },

    async remixWork(id) {
      const packs = await getPacks();
      const source = packs.find((pack) => pack.id === id);
      if (!source) return { item: null };
      const remix = cloneAsRemix(source);
      source.metrics = source.metrics || {};
      source.metrics.remixes = (source.metrics.remixes || 0) + 1;
      packs.unshift(remix);
      await commit(packs);
      return { item: remix };
    },

    async recordInteraction(id, type) {
      const packs = await getPacks();
      const pack = packs.find((item) => item.id === id);
      if (!pack) return { item: null };
      pack.metrics = pack.metrics || {};
      const metricByType = {
        like: "likes",
        save: "saves",
        comment: "comments",
        play: "plays",
      };
      const metric = metricByType[type];
      if (metric) pack.metrics[metric] = (pack.metrics[metric] || 0) + 1;
      await commit(packs);
      return { item: pack };
    },

    async getFriends() {
      const packs = await getPacks();
      const hotPack = [...packs].sort((a, b) => scorePack(b) - scorePack(a))[0];
      const remixPack = packs.find((pack) => pack.remixOf) || packs[0];
      return {
        stats: {
          friends: 12,
          coCreates: packs.filter((pack) => pack.author?.id === "user_local").length,
          unread: 3,
        },
        items: [
          {
            id: "friend_mika",
            badge: "M",
            title: "Mika 刚玩完一个 H5 吧唧",
            text: hotPack ? `她收藏了「${hotPack.title}」，可以邀请她一起改一个结局。` : "她收藏了一个作品。",
            meta: "刚刚",
          },
          {
            id: "friend_noa",
            badge: "N",
            title: "Noa 发来共创邀请",
            text: "想一起做一个夜晚列车主题的电子吧唧短剧。",
            meta: "共创",
          },
          {
            id: "friend_yu",
            badge: "Y",
            title: "Yu Remix 了你的灵感",
            text: remixPack ? `来源作品：${remixPack.title}` : "新的二创会出现在这里。",
            meta: "二创",
          },
        ],
      };
    },

    async getDeviceDashboard() {
      const packs = await getPacks();
      const baseLibrary = await getBadgeLibrary();
      const devices = await getDevices();
      const activeDevice = devices.find((device) => device.id === activeDeviceId) || devices[0] || null;
      activeDeviceId = activeDevice?.id || activeDeviceId;
      const library = baseLibrary.map((item) => ({
        ...item,
        syncStatus: activeDevice?.currentStoreId === item.id ? "synced" : "not_synced",
      }));
      const officialPicks = packs
        .filter((pack) => pack.hardwareStatus === "hardware_candidate" || pack.hardwareStatus === "hardware_ready")
        .sort((a, b) => scorePack(b) - scorePack(a));
      const installed = library.find((item) => item.syncStatus === "synced");
      return {
        device: {
          ...(activeDevice || {
            name: "未绑定设备",
            status: "未绑定",
            battery: 0,
          }),
          currentPackTitle: installed?.title || "未同步内容",
        },
        activeDeviceId,
        devices,
        officialPicks,
        library,
        summary: {
          owned: library.filter((item) => item.ownership === "owned").length,
          downloaded: library.filter((item) => item.downloadStatus === "downloaded").length,
          synced: devices.filter((device) => device.currentStoreId).length,
        },
      };
    },

    async purchaseBadgePack(storeId) {
      const library = await getBadgeLibrary();
      const item = library.find((entry) => entry.id === storeId);
      if (!item) return { item: null };
      item.ownership = "owned";
      return { item };
    },

    async downloadBadgePack(storeId) {
      const library = await getBadgeLibrary();
      const item = library.find((entry) => entry.id === storeId);
      if (!item || item.ownership !== "owned") return { item: null };
      item.downloadStatus = "downloaded";
      return { item };
    },

    async syncBadgePack(storeId) {
      const library = await getBadgeLibrary();
      const devices = await getDevices();
      const item = library.find((entry) => entry.id === storeId);
      if (!item || item.downloadStatus !== "downloaded") return { item: null };
      const activeDevice = devices.find((device) => device.id === activeDeviceId) || devices[0];
      if (activeDevice) {
        activeDeviceId = activeDevice.id;
        activeDevice.currentStoreId = storeId;
      }
      return { item };
    },

    async selectDevice(deviceId) {
      const devices = await getDevices();
      const device = devices.find((entry) => entry.id === deviceId);
      if (!device) return { item: null };
      activeDeviceId = device.id;
      return { item: device };
    },

    async bindDevice() {
      const devices = await getDevices();
      const index = devices.length + 1;
      const device = {
        id: `badge_s3_${String(index).padStart(2, "0")}`,
        name: `新吧唧 ${index}`,
        model: "Circle 185",
        status: "在线",
        battery: 100,
        boundAt: "2026-05-19",
        currentStoreId: null,
      };
      devices.unshift(device);
      activeDeviceId = device.id;
      return { item: device };
    },

    async unbindDevice(deviceId) {
      const devices = await getDevices();
      const index = devices.findIndex((entry) => entry.id === deviceId);
      if (index < 0) return { item: null };
      const [removed] = devices.splice(index, 1);
      if (activeDeviceId === deviceId) activeDeviceId = devices[0]?.id || null;
      return { item: removed };
    },

    async getProfile() {
      const packs = await getPacks();
      const myWorks = packs.filter((pack) => pack.author?.id === "user_local" || pack.author?.name === "你");
      return {
        profile: {
          name: "咕咕创作者",
          bio: "刷到喜欢的电子吧唧，也可以自己做一个。",
        },
        stats: {
          works: myWorks.length,
          likes: packs.reduce((sum, pack) => sum + (pack.metrics?.likes || 0), 0),
          remixes: packs.reduce((sum, pack) => sum + (pack.metrics?.remixes || 0), 0),
          hardwareWins: packs.filter((pack) => pack.hardwareStatus === "hardware_ready").length,
        },
        myWorks,
      };
    },

    async getOperatorTrending() {
      const packs = await getPacks();
      const publicPacks = packs.filter((pack) => (
        pack.status === "public_h5" ||
        pack.status === "hardware_candidate" ||
        pack.status === "hardware_ready"
      ));
      return {
        items: [...publicPacks].sort((a, b) => scorePack(b) - scorePack(a)),
        counts: {
          public: publicPacks.length,
          candidate: packs.filter((pack) => pack.hardwareStatus === "hardware_candidate").length,
          ready: packs.filter((pack) => pack.hardwareStatus === "hardware_ready").length,
        },
      };
    },

    async markHardwareCandidate(id) {
      const pack = await findPack(id);
      if (!pack) return { item: null };
      pack.hardwareStatus = "hardware_candidate";
      pack.status = "hardware_candidate";
      await commit(await getPacks());
      return { item: pack };
    },

    async markHardwareReady(id) {
      const pack = await findPack(id);
      if (!pack) return { item: null };
      pack.hardwareStatus = "hardware_ready";
      pack.status = "hardware_ready";
      await commit(await getPacks());
      return { item: pack };
    },
  };
}
