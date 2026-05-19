import { createMockFlashApi } from "../../../packages/api-client/src/index.js";
import { formatNumber, hardwareStatusLabel, scorePack } from "../../../packages/core/src/index.js";
import { loadPacks, savePacks } from "./adapters/local-pack-store.js";

const flashApi = createMockFlashApi({ loadPacks, savePacks });

const state = {
  packs: [],
  activeIndex: 0,
  activeSceneId: null,
  selectedTemplate: "healing",
  draft: null,
};

const $ = (id) => document.getElementById(id);

const screens = [
  "feedScreen",
  "playerScreen",
  "friendsScreen",
  "badgeScreen",
  "storeScreen",
  "profileScreen",
  "createScreen",
  "operatorScreen",
];

async function reloadPacks(preferredPackId = null) {
  const feed = await flashApi.getFeed();
  state.packs = feed.items;
  if (preferredPackId) {
    const nextIndex = state.packs.findIndex((pack) => pack.id === preferredPackId);
    if (nextIndex >= 0) state.activeIndex = nextIndex;
  }
  if (state.activeIndex >= state.packs.length) state.activeIndex = 0;
  renderFeed();
}

function activePack() {
  return state.packs[state.activeIndex];
}

function showScreen(screenId) {
  document.querySelector(".phone-stage").dataset.screen = screenId;
  for (const id of screens) $(id).classList.toggle("active", id === screenId);
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.target === screenId);
  });
  renderScreenData(screenId);
  renderChrome(screenId);
}

function renderChrome(screenId) {
  const chrome = {
    friendsScreen: { left: "铃", title: "好友", right: "+" },
    feedScreen: { left: "我", title: "咕咕闪", right: "选" },
    badgeScreen: { left: "链", title: "吧唧", right: "店" },
    storeScreen: { left: "返", title: "商店", right: "吧" },
    profileScreen: { left: "+", title: "我的", right: "写" },
    createScreen: { left: "返", title: "创作", right: "我" },
    operatorScreen: { left: "我", title: "精选", right: "关" },
    playerScreen: { left: "我", title: "互动", right: "选" },
  }[screenId] || { left: "我", title: "咕咕闪", right: "选" };

  $("profileButton").textContent = chrome.left;
  $("brandText").textContent = chrome.title;
  $("operatorButton").textContent = chrome.right;
}

function renderFeed() {
  const pack = activePack();
  if (!pack) return;
  const scene = pack.scenes.find((item) => item.id === pack.entrySceneId) || pack.scenes[0];

  $("feedVisual").style.background = pack.cover?.background || scene.background;
  $("feedCharacter").textContent = pack.cover?.character || scene.character || "✨";
  $("feedTitle").textContent = pack.title;
  $("feedText").textContent = scene.text;
  $("feedAuthor").textContent = `@${pack.author?.name || "Gugu Creator"} · 完播率 ${Math.round((pack.metrics?.completionRate || 0) * 100)}% · ${pack.hardwareStatusLabel || hardwareStatusLabel(pack.hardwareStatus)}`;
  $("feedTags").innerHTML = (pack.tags || []).map((tag) => `<span>${tag}</span>`).join("");
  $("likeCount").textContent = formatNumber(pack.metrics?.likes);
  $("saveCount").textContent = formatNumber(pack.metrics?.saves);
  $("remixCount").textContent = formatNumber(pack.metrics?.remixes);
  $("commentCount").textContent = formatNumber(pack.metrics?.comments);
}

function moveFeed(delta) {
  state.activeIndex = (state.activeIndex + delta + state.packs.length) % state.packs.length;
  renderFeed();
}

function openPlayer(pack = activePack()) {
  state.activeIndex = state.packs.findIndex((item) => item.id === pack.id);
  state.activeSceneId = pack.entrySceneId || pack.scenes[0]?.id;
  renderScene();
  showScreen("playerScreen");
}

function renderScene() {
  const pack = activePack();
  const scene = pack.scenes.find((item) => item.id === state.activeSceneId) || pack.scenes[0];
  $("playerScene").style.background = scene.background || pack.cover?.background;
  $("sceneCharacter").textContent = scene.character || pack.cover?.character || "✨";
  $("sceneSpeaker").textContent = scene.speaker || pack.title;
  $("sceneText").textContent = scene.text || "";
  $("choiceList").innerHTML = "";
  for (const action of scene.actions || []) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.addEventListener("click", () => {
      state.activeSceneId = action.goto;
      renderScene();
    });
    $("choiceList").appendChild(button);
  }
  $("completionActions").classList.toggle("hidden", !isCompletionScene(pack, scene));
}

function isCompletionScene(pack, scene) {
  if (!scene) return false;
  if (scene.id === "end") return true;
  const actions = scene.actions || [];
  if (!actions.length) return true;
  return actions.some((action) => action.goto === pack.entrySceneId || action.label.includes("重新"));
}

function renderDraft(draft) {
  $("draftPreview").classList.remove("hidden");
  $("draftTitle").textContent = draft.title;
  $("draftSummary").textContent = draft.scenes[0]?.text || "";
  $("draftTitleInput").value = draft.title;
  $("draftTagsInput").value = (draft.tags || []).join(" / ");
  $("draftSceneList").innerHTML = (draft.scenes || []).map((scene, index) => `
    <article class="scene-mini-item">
      <span>${scene.character || draft.cover?.character || "✨"}</span>
      <div>
        <strong>${index + 1}. ${scene.speaker || draft.title}</strong>
        <small>${scene.text || "空场景"}</small>
      </div>
    </article>
  `).join("");
}

function applyDraftEdits(draft) {
  const title = $("draftTitleInput").value.trim();
  const tags = $("draftTagsInput").value
    .split(/[、,/，|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  if (title) draft.title = title;
  if (tags.length) draft.tags = Array.from(new Set(tags));
  draft.updatedAt = Date.now();
  draft.cover = draft.cover || {};
  return draft;
}

async function remixActivePack() {
  const source = activePack();
  const response = await flashApi.remixWork(source.id);
  await reloadPacks(response.item?.id);
}

function renderScreenData(screenId) {
  if (screenId === "friendsScreen") renderFriends();
  if (screenId === "badgeScreen") renderBadge();
  if (screenId === "storeScreen") renderStore();
  if (screenId === "profileScreen") renderProfile();
  if (screenId === "operatorScreen") renderOperator();
}

function packSubtitle(pack) {
  const completion = Math.round((pack.metrics?.completionRate || 0) * 100);
  return `${pack.tags?.join(" / ") || "咕咕内容"} · 完播率 ${completion}% · 热度 ${Math.round(scorePack(pack))}`;
}

async function renderFriends() {
  const response = await flashApi.getFriends();

  $("friendStats").innerHTML = `
    <div><strong>${response.stats.friends}</strong><span>好友</span></div>
    <div><strong>${response.stats.coCreates}</strong><span>共创</span></div>
    <div><strong>${response.stats.unread}</strong><span>新动态</span></div>
  `;

  $("friendList").innerHTML = response.items.map((item) => `
    <article class="message-item">
      <div class="message-badge">${item.badge}</div>
      <div>
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </div>
      <span>${item.meta}</span>
    </article>
  `).join("");
}

async function renderDevice() {
  const dashboard = await flashApi.getDeviceDashboard();
  return dashboard;
}

async function renderBadge() {
  const dashboard = await renderDevice();
  const { library, summary, devices, activeDeviceId } = dashboard;
  document.querySelector(".device-hero strong").textContent = dashboard.device.name;
  document.querySelector(".device-hero p").textContent = `${dashboard.device.status} · 电量 ${dashboard.device.battery}% · ${dashboard.device.currentPackTitle}`;
  $("ownedPackCount").textContent = summary.owned;
  $("downloadedPackCount").textContent = summary.downloaded;
  $("syncedPackCount").textContent = summary.synced;

  const installed = library.find((item) => item.syncStatus === "synced");
  $("installedPackName").textContent = installed ? installed.title : "未同步";
  $("installedPack").innerHTML = installed ? `
    <div class="mini-visual" style="background:${installed.cover?.background || "#111827"}">${installed.cover?.character || "✨"}</div>
    <div>
      <h3>${installed.title}</h3>
      <p>${installed.description}</p>
    </div>
    <span>运行中</span>
  ` : `<div class="empty-state">还没有同步到设备的内容包。</div>`;

  $("deviceCount").textContent = `${devices.length} 台已绑定`;
  $("deviceList").innerHTML = devices.map((device) => {
    const content = library.find((item) => item.id === device.currentStoreId);
    const active = device.id === activeDeviceId;
    return `
      <article class="device-card ${active ? "active" : ""}">
        <div>
          <h3>${device.name}</h3>
          <p>${device.model} · ${device.status} · 电量 ${device.battery}%</p>
          <span>${content ? `运行：${content.title}` : "未同步内容"}</span>
        </div>
        <footer>
          <button data-device-action="select" data-device-id="${device.id}" type="button">${active ? "当前" : "切换"}</button>
          <button data-device-action="unbind" data-device-id="${device.id}" type="button">解绑</button>
        </footer>
      </article>
    `;
  }).join("");

  document.querySelectorAll("[data-device-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.deviceId;
      if (button.dataset.deviceAction === "select") await flashApi.selectDevice(id);
      if (button.dataset.deviceAction === "unbind") await flashApi.unbindDevice(id);
      renderBadge();
    });
  });
}

async function renderStore() {
  const dashboard = await renderDevice();
  const { library } = dashboard;
  $("storeTarget").innerHTML = `
    <div>
      <span>同步目标</span>
      <strong>${dashboard.device.name}</strong>
      <p>${dashboard.device.status} · 当前内容：${dashboard.device.currentPackTitle}</p>
    </div>
  `;

  if (!library.length) {
    $("storeList").innerHTML = `<div class="empty-state">商店还没有可用内容。官方精选后会出现在这里。</div>`;
    return;
  }

  $("storeList").innerHTML = "";
  for (const itemData of library) {
    const item = document.createElement("article");
    item.className = "store-item";
    item.innerHTML = `
      <div class="mini-visual" style="background:${itemData.cover?.background || "#111827"}">${itemData.cover?.character || "✨"}</div>
      <div>
        <h3>${itemData.title}</h3>
        <p>${itemData.description}</p>
        <span>${badgeStoreLabel(itemData)}</span>
      </div>
      <button type="button">${badgeStoreActionLabel(itemData)}</button>
    `;
    item.querySelector("button").addEventListener("click", async () => {
      await runBadgeStoreAction(itemData);
      renderStore();
    });
    $("storeList").appendChild(item);
  }
}

function badgeStoreLabel(item) {
  if (item.syncStatus === "synced") return "已同步到设备";
  if (item.downloadStatus === "downloaded") return "已下载";
  if (item.ownership === "owned") return "已购买";
  return item.price ? `￥${item.price}` : "免费";
}

function badgeStoreActionLabel(item) {
  if (item.syncStatus === "synced") return "已同步";
  if (item.downloadStatus === "downloaded") return "同步";
  if (item.ownership === "owned") return "下载";
  return item.price ? "购买" : "领取";
}

async function runBadgeStoreAction(item) {
  if (item.syncStatus === "synced") return;
  if (item.downloadStatus === "downloaded") {
    await flashApi.syncBadgePack(item.id);
    return;
  }
  if (item.ownership === "owned") {
    await flashApi.downloadBadgePack(item.id);
    return;
  }
  await flashApi.purchaseBadgePack(item.id);
}

async function renderProfile() {
  const response = await flashApi.getProfile();
  const { profile, stats, myWorks } = response;

  document.querySelector(".profile-card h3").textContent = profile.name;
  document.querySelector(".profile-card p").textContent = profile.bio;
  $("profileStats").innerHTML = `
    <div><strong>${stats.works}</strong><span>我的作品</span></div>
    <div><strong>${formatNumber(stats.likes)}</strong><span>全站点赞</span></div>
    <div><strong>${formatNumber(stats.remixes)}</strong><span>二创次数</span></div>
    <div><strong>${stats.hardwareWins}</strong><span>硬件高光</span></div>
  `;
  $("myWorkCount").textContent = `${myWorks.length} 个作品`;

  if (!myWorks.length) {
    $("myWorkGrid").innerHTML = `<div class="empty-state">还没有发布作品。在上面的快速创作里输入一句话，先做一个 H5 吧唧。</div>`;
    return;
  }

  $("myWorkGrid").innerHTML = "";
  for (const pack of myWorks) {
    const card = document.createElement("article");
    card.className = "work-card";
    card.innerHTML = `
      <div class="work-cover" style="background:${pack.cover?.background || "#111827"}">${pack.cover?.character || "✨"}</div>
      <h3>${pack.title}</h3>
      <p>${hardwareStatusLabel(pack.hardwareStatus)} · ${formatNumber(pack.metrics?.likes)} 赞</p>
    `;
    card.addEventListener("click", () => openPlayer(pack));
    $("myWorkGrid").appendChild(card);
  }
}

async function renderOperator() {
  const trending = await flashApi.getOperatorTrending();
  $("opsPublicCount").textContent = trending.counts.public;
  $("opsCandidateCount").textContent = trending.counts.candidate;
  $("opsReadyCount").textContent = trending.counts.ready;

  $("opsList").innerHTML = "";
  for (const pack of trending.items) {
    const card = document.createElement("article");
    card.className = "ops-card";
    card.innerHTML = `
      <h3>${pack.title}</h3>
      <p>${pack.tags.join(" / ")} · 热度 ${Math.round(scorePack(pack))} · ${hardwareStatusLabel(pack.hardwareStatus)}</p>
      <footer>
        <button class="candidate" type="button">标为候选</button>
        <button class="ready" type="button">标为可下载</button>
      </footer>
    `;
    card.querySelector(".candidate").addEventListener("click", async () => {
      await flashApi.markHardwareCandidate(pack.id);
      await reloadPacks(pack.id);
      renderOperator();
    });
    card.querySelector(".ready").addEventListener("click", async () => {
      await flashApi.markHardwareReady(pack.id);
      await reloadPacks(pack.id);
      renderOperator();
    });
    $("opsList").appendChild(card);
  }
}

function wireEvents() {
  $("prevButton").addEventListener("click", () => moveFeed(-1));
  $("nextButton").addEventListener("click", () => moveFeed(1));
  $("playButton").addEventListener("click", () => openPlayer());
  $("backToFeedButton").addEventListener("click", () => showScreen("feedScreen"));
  $("playerSaveButton").addEventListener("click", async () => {
    const packId = activePack().id;
    await flashApi.recordInteraction(packId, "save");
    await reloadPacks(packId);
    renderScene();
  });
  $("playerRemixButton").addEventListener("click", async () => {
    await remixActivePack();
    showScreen("feedScreen");
  });
  $("closeOperatorButton").addEventListener("click", () => showScreen("feedScreen"));
  $("closeStoreButton").addEventListener("click", () => showScreen("badgeScreen"));
  $("openStoreButton").addEventListener("click", () => showScreen("storeScreen"));
  $("closeCreateButton").addEventListener("click", () => showScreen("profileScreen"));
  $("openCreateButton").addEventListener("click", () => showScreen("createScreen"));
  $("bindDeviceButton").addEventListener("click", async () => {
    await flashApi.bindDevice();
    renderBadge();
  });
  $("operatorButton").addEventListener("click", () => {
    const screen = document.querySelector(".phone-stage").dataset.screen;
    if (screen === "badgeScreen") {
      showScreen("storeScreen");
      return;
    }
    if (screen === "storeScreen") {
      showScreen("badgeScreen");
      return;
    }
    if (screen === "profileScreen") {
      showScreen("createScreen");
      return;
    }
    if (screen === "createScreen") {
      showScreen("profileScreen");
      return;
    }
    showScreen("operatorScreen");
  });
  $("profileButton").addEventListener("click", () => {
    const screen = document.querySelector(".phone-stage").dataset.screen;
    if (screen === "storeScreen") {
      showScreen("badgeScreen");
    } else if (screen === "createScreen") {
      showScreen("profileScreen");
    } else if (screen !== "friendsScreen") {
      showScreen("profileScreen");
    }
  });

  $("likeButton").addEventListener("click", async () => {
    const packId = activePack().id;
    await flashApi.recordInteraction(packId, "like");
    await reloadPacks(packId);
  });
  $("saveButton").addEventListener("click", async () => {
    const packId = activePack().id;
    await flashApi.recordInteraction(packId, "save");
    await reloadPacks(packId);
  });
  $("commentButton").addEventListener("click", async () => {
    const packId = activePack().id;
    await flashApi.recordInteraction(packId, "comment");
    await reloadPacks(packId);
  });
  $("remixButton").addEventListener("click", remixActivePack);

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      showScreen(tab.dataset.target);
    });
  });

  document.querySelectorAll(".template").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedTemplate = button.dataset.template;
      document.querySelectorAll(".template").forEach((item) => item.classList.toggle("active", item === button));
    });
  });

  $("generateButton").addEventListener("click", async () => {
    const response = await flashApi.createDraft($("promptInput").value, state.selectedTemplate);
    state.draft = response.item;
    renderDraft(state.draft);
  });

  $("publishDraftButton").addEventListener("click", async () => {
    if (!state.draft) return;
    const response = await flashApi.publishDraft(applyDraftEdits(state.draft));
    state.draft = null;
    $("draftPreview").classList.add("hidden");
    $("promptInput").value = "";
    await reloadPacks(response.item?.id);
    showScreen("feedScreen");
  });
}

async function init() {
  await reloadPacks();
  wireEvents();
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre>${error.stack || error.message}</pre>`;
});
