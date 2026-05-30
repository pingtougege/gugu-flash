import { createFlashApi } from "../../../packages/api-client/src/index.js";
import {
  AI_TEXT_GAME_PIPELINE_STAGES,
  CONTENT_ORIGIN_LABELS,
  TEMPLATE_PRESETS,
  contentOriginLabel,
  createAiEditProposalPreview,
  createDraftQualityChecks,
  createPublishChecklist,
  createTextGamePlaytestReport,
  formatNumber,
  getDefaultIpForOrigin,
  getIpEntriesForOrigin,
  getIpEntry,
  getPersona,
  getPersonasForIp,
  getZone,
  hardwarePackStatusLabel,
  hardwareStatusLabel,
  scorePack,
  storeStatusLabel,
} from "../../../packages/core/src/index.js";
import { loadPacks, savePacks } from "./adapters/local-pack-store.js";

const flashApi = createFlashApi({ loadPacks, savePacks });
const apiRuntime = flashApi.runtime || { mode: "mock", baseUrl: "" };

const state = {
  packs: [],
  activeIndex: 0,
  activeSceneId: null,
  selectedTemplate: "healing",
  selectedOrigin: "original",
  selectedIpId: "rain_gugu_universe",
  selectedPersona: "rain_gugu",
  useCustomPersona: false,
  customPersonaName: "",
  customPersonaTagline: "",
  customPersonaPolishCount: 0,
  fanworkRightsAccepted: false,
  selectedIpPoolId: "rain_gugu_universe",
  createIpSearchQuery: "",
  ipSearchQuery: "",
  animeCollectionResult: null,
  draft: null,
  draftPlaySceneId: null,
  storeApplyPackId: null,
  storeTermsAccepted: false,
  deviceSyncTermsAccepted: false,
  commentPackId: null,
  toastTimer: null,
  loopStep: "feed",
  lastPublishedPackId: null,
  feedAnimating: false,
  draftGenerating: false,
  draftPublishing: false,
  editingWorkId: null,
  publishedDraftKeys: new Set(),
  createWizardStep: "prompt",
  createGuideAdvanced: false,
  generationWorkbench: {
    visible: false,
    status: "idle",
    stageIndex: 0,
    errorMessage: "",
  },
  aiEdit: {
    status: "idle",
    prompt: "",
    scopeType: "work",
    proposal: null,
    undoStack: [],
  },
  promptEdit: {
    proposal: null,
  },
  selectedScriptSceneId: null,
  personaPickerSelectedIds: new Set(),
};

const $ = (id) => document.getElementById(id);
let generationStageTimer = null;
let createDeckScrollTimer = null;
let suppressCreateDeckSyncUntil = 0;
const DRAFT_GENERATION_TIMEOUT_MS = 120000;
const FEED_SWIPE_MIN_DISTANCE = 48;
const FEED_SWIPE_MIN_DOMINANCE = 1.2;
const FEED_SWIPE_MIN_VELOCITY = 0.45;
const FEED_WHEEL_THRESHOLD = 80;
const FEED_WHEEL_RESET_MS = 180;
const FEED_KEY_DELTAS = {
  ArrowDown: 1,
  PageDown: 1,
  ArrowUp: -1,
  PageUp: -1,
};

const CREATE_WIZARD_STEPS = [
  { id: "prompt", label: "创意" },
  { id: "making", label: "制作中" },
  { id: "settings", label: "角色" },
  { id: "preview", label: "总览" },
  { id: "script", label: "剧本" },
  { id: "views", label: "立绘" },
  { id: "assets", label: "场景" },
  { id: "playtest", label: "试玩" },
  { id: "publish", label: "检查" },
];

const MOBILE_CREATE_GUIDE_STEPS = [
  { id: "prompt", label: "创意", hint: "写一句" },
  { id: "settings", label: "角色/IP", hint: "选归属" },
  { id: "making", label: "生成", hint: "AI 制作" },
  { id: "playtest", label: "试玩", hint: "能玩" },
  { id: "publish", label: "发布检查", hint: "过检查" },
];

const CREATE_STEP_AI_SCOPES = {
  preview: "work",
  views: "character",
  script: "scene",
  assets: "assets",
  playtest: "scene",
  publish: "work",
};

const TEMPLATE_HINTS = {
  healing: "少分支 · 重对话 · 情绪收束",
  adventure: "多分支 · 多结局 · 探索推进",
  energy: "短节奏 · 挑战节点 · 成败反馈",
};

const PROMPT_EXAMPLES = {
  original: {
    prompt: "一个雨夜便利店里，主角遇到会预言明天的猫",
    template: "adventure",
    origin: "original",
    ipId: "rain_gugu_universe",
    personaId: "rain_gugu",
    toast: "已填入原创示例，可继续改写。",
  },
  fanwork: {
    prompt: "分支冒险文字游戏：主角皮卡丘在宝可梦中心雨夜值班，玩家目标是找回走丢的伊布并查清停电原因；加入值班护士和陌生训练家；设计4场、2个关键选择、2个结局；每场要有背景、对白、选项跳转和情绪标签；结尾有轻微反转。",
    template: "adventure",
    origin: "fanwork",
    ipId: "mainstream_pokemon",
    personaId: "pokemon_pikachu",
    toast: "已切换为二创示例，下一步请确认 IP 归属。",
  },
};

const CREATE_IP_SEARCH_ALIASES = {
  mainstream_pokemon: ["pokemon", "pocket monster", "宝可梦", "bao ke meng", "baokemeng", "nao ke meng", "naokemeng", "皮卡丘", "pikachu", "伊布", "eevee"],
  mainstream_demon_slayer: ["demon slayer", "kimetsu", "鬼灭", "鬼灭之刃", "gui mie", "guimie", "炭治郎", "祢豆子"],
  mainstream_one_piece: ["one piece", "海贼王", "hai zei wang", "haizeiwang", "路飞", "索隆"],
  mainstream_naruto: ["naruto", "火影", "火影忍者", "huo ying", "huoying", "鸣人", "佐助"],
  mainstream_jujutsu_kaisen: ["jujutsu", "咒术", "咒术回战", "zhou shu", "zhoushu", "五条悟"],
  mainstream_attack_on_titan: ["attack on titan", "进击的巨人", "jin ji de ju ren", "jinjidejuren"],
  soda_planet_fan: ["汽水", "qi shui", "qishui"],
  rain_gugu_universe: ["雨天", "yu tian", "yutian", "咕咕", "gugu"],
  midnight_train_project: ["零点列车", "ling dian lie che", "lingdianlieche"],
  midnight_train_fan: ["零点列车", "ling dian lie che", "lingdianlieche"],
};

const screens = [
  "feedScreen",
  "playerScreen",
  "commentScreen",
  "friendsScreen",
  "ipScreen",
  "badgeScreen",
  "storeScreen",
  "profileScreen",
  "createScreen",
  "operatorScreen",
];

async function reloadPacks(preferredPackId = null) {
  const feed = await flashApi.getFeed();
  state.packs = uniqueWorks(feed.items || []);
  state.publishedDraftKeys = new Set(state.packs.map(workFingerprint));
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

function packOriginText(pack) {
  const ipName = packIpName(pack);
  return pack.contentOrigin === "fanwork"
    ? `${contentOriginLabel(pack.contentOrigin)} · ${ipName || "未填写 IP"}`
    : `${contentOriginLabel(pack.contentOrigin)}${ipName ? ` · ${ipName}` : ""}`;
}

function packIpName(pack) {
  return pack.ipName || getIpEntry(pack.ipId)?.name || "";
}

function displayWorkTitle(pack = {}) {
  return String(pack.title || "未命名作品")
    .replace(/(\s+Remix){2,}$/i, " Remix")
    .trim();
}

function packTagList(pack, limit = 5) {
  const ipName = packIpName(pack);
  return Array.from(new Set([
    contentOriginLabel(pack.contentOrigin),
    getZone(pack.zoneId).shortName,
    ...(ipName ? [ipName] : []),
    ...(pack.tags || []),
  ])).slice(0, limit);
}

function storyTagList(pack = {}, limit = 5) {
  const metadata = new Set([
    contentOriginLabel(pack.contentOrigin),
    packIpName(pack),
    getZone(pack.zoneId).name,
    getZone(pack.zoneId).shortName,
    "AI草稿",
    "可二创",
    "可Remix",
  ].filter(Boolean));
  return Array.from(new Set((pack.tags || [])
    .map((tag) => String(tag || "").trim())
    .filter((tag) => tag && tag.length <= 8 && !metadata.has(tag))
    .filter((tag) => !/完整文字游戏|提示词|玩家目标|素材要求|限制条件|归属\/?IP|玩法模板|背景|对白|选项|情绪标签|结尾|场景到?\d+个|设计\d*场/.test(tag))))
    .slice(0, limit);
}

const USER_STORE_STATUS_LABELS = {
  not_applied: "未申请上架",
  submitted: "上架审核中",
  rights_review: "上架审核中",
  production_queued: "等待制作设备包",
  producing: "正在制作设备包",
  pack_review: "设备包复核中",
  listed: "商店可购买",
  rejected: "上架未通过",
  delisted: "已下架",
  frozen: "权利争议处理中",
};

const USER_HARDWARE_PACK_STATUS_LABELS = {
  draft: "等待制作",
  building: "制作中",
  reviewing: "复核中",
  ready: "等待开放下载",
  available: "可下载到设备",
  paused: "暂停下载",
  deprecated: "需要更新",
  removed: "已下架",
};

function userStoreStatusLabel(status) {
  return USER_STORE_STATUS_LABELS[status] || storeStatusLabel(status);
}

function userHardwarePackStatusLabel(status) {
  return USER_HARDWARE_PACK_STATUS_LABELS[status] || hardwarePackStatusLabel(status) || "未制作";
}

function userDistributionLabel(pack) {
  const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
  const hardwarePackStatus = pack.hardwarePack?.status || null;
  if (hardwarePackStatus === "available") return "可下载到设备";
  if (["production_queued", "producing", "pack_review"].includes(storeStatus)) return "设备包制作中";
  if (["submitted", "rights_review"].includes(storeStatus)) return "上架审核中";
  if (storeStatus === "listed") return "可下载到设备";
  if (storeStatus === "rejected") return "上架未通过";
  if (storeStatus === "delisted") return "已下架";
  if (storeStatus === "frozen") return "权利争议处理中";
  return "H5 已发布";
}

function createOptionsFromForm() {
  const ipEntry = getIpEntry(state.selectedIpId);
  const preset = TEMPLATE_PRESETS[state.selectedTemplate] || TEMPLATE_PRESETS.healing;
  const customName = state.customPersonaName.trim();
  const customTagline = state.customPersonaTagline.trim();
  return {
    originType: state.selectedOrigin,
    ipId: ipEntry?.id || "",
    ipName: ipEntry?.name || "",
    personaId: state.useCustomPersona && customName ? "custom_persona" : state.selectedPersona,
    customPersona: state.useCustomPersona && customName ? {
      id: `custom_${customName.slice(0, 12)}`,
      name: customName,
      avatar: customName.slice(0, 1) || "原",
      roleType: "creator_original",
      tagline: customTagline || "用户原创社区分身",
    } : null,
    zoneId: preset.zoneId,
    rightsAcknowledgedAt: state.selectedOrigin === "fanwork" && state.fanworkRightsAccepted ? Date.now() : null,
  };
}

function updateCreateSettingsSummary() {
  const selectedIp = getIpEntry(state.selectedIpId);
  const selectedPersona = state.useCustomPersona && state.customPersonaName.trim()
    ? { name: state.customPersonaName.trim() }
    : getPersona(state.selectedPersona);
  $("createSettingsSummary").textContent = [
    contentOriginLabel(state.selectedOrigin),
    selectedIp?.name,
    selectedPersona?.name,
  ].filter(Boolean).join(" · ") || "使用默认设置";
}

function normalizeCreateSearchText(value = "") {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}\u4e00-\u9fff]+/gu, " ")
    .trim();
}

function createIpSearchHaystack(entry, personas = []) {
  return [
    entry.id,
    entry.name,
    entry.description,
    entry.rightsNotice,
    entry.zoneStatus,
    ...(CREATE_IP_SEARCH_ALIASES[entry.id] || []),
    ...personas.flatMap((persona) => [persona.id, persona.name, persona.tagline]),
  ].filter(Boolean).map(normalizeCreateSearchText).join(" ");
}

function showCreateError(message = "") {
  $("createError").textContent = message;
  $("createError").classList.toggle("hidden", !message);
}

function pulseButton(button) {
  button.classList.remove("just-pressed");
  void button.offsetWidth;
  button.classList.add("just-pressed");
  setTimeout(() => button.classList.remove("just-pressed"), 380);
}

function setButtonBusy(button, busy, busyText = "处理中") {
  if (!button.dataset.idleText) button.dataset.idleText = button.textContent;
  button.disabled = busy;
  button.classList.toggle("is-busy", busy);
  button.textContent = busy ? busyText : button.dataset.idleText;
}

function setCreateProgress(message = "", tone = "info") {
  const progress = $("createProgress");
  if (!progress) return;
  progress.textContent = message;
  progress.className = `create-progress ${message ? "" : "hidden"} ${tone}`.trim();
}

function renderGenerationWorkbench() {
  const workbench = $("generationWorkbench");
  if (!workbench) return;
  const currentStage = AI_TEXT_GAME_PIPELINE_STAGES[state.generationWorkbench.stageIndex] || AI_TEXT_GAME_PIPELINE_STAGES[0];
  const failed = state.generationWorkbench.status === "failed";
  const succeeded = state.generationWorkbench.status === "succeeded";
  workbench.classList.toggle("hidden", !state.generationWorkbench.visible);
  workbench.classList.toggle("failed", failed);
  workbench.classList.toggle("succeeded", succeeded);
  document.querySelector(".phone-stage")?.classList.toggle("is-generating", state.generationWorkbench.visible && !failed);
  $("generationWorkbenchEyebrow").textContent = failed ? "制作中断" : succeeded ? "制作完成" : "AI 制作管线";
  $("generationWorkbenchTitle").textContent = failed ? "生成失败，描述已保留" : succeeded ? "草稿已生成，可以试玩" : "正在制作文字游戏草稿";
  $("generationWorkbenchDetail").textContent = failed
    ? state.generationWorkbench.errorMessage || "请稍后重试。"
    : currentStage.detail;
  $("generationWorkbenchNote").textContent = failed
    ? "你可以直接重试，或回到编辑调整描述。"
    : "请保持在本页，系统会完成企划、角色、剧本、素材和检查。";
  $("generationProgressBar").style.width = `${failed ? 100 : currentStage.progress}%`;
  $("generationStageList").innerHTML = AI_TEXT_GAME_PIPELINE_STAGES.map((stage, index) => `
    <article class="${index < state.generationWorkbench.stageIndex || succeeded ? "complete" : ""} ${index === state.generationWorkbench.stageIndex && !failed && !succeeded ? "active" : ""}">
      <span>${index < state.generationWorkbench.stageIndex || succeeded ? "✓" : index + 1}</span>
      <div>
        <strong>${escapeHtml(stage.label)}</strong>
        <small>${escapeHtml(stage.detail)}</small>
      </div>
    </article>
  `).join("");
  $("generationWorkbenchActions").classList.toggle("hidden", !failed);
}

function clearGenerationTimer() {
  if (generationStageTimer) window.clearInterval(generationStageTimer);
  generationStageTimer = null;
}

function startGenerationWorkbench() {
  clearGenerationTimer();
  state.generationWorkbench = { visible: true, status: "running", stageIndex: 0, errorMessage: "" };
  renderGenerationWorkbench();
  generationStageTimer = window.setInterval(() => {
    if (!state.generationWorkbench.visible || state.generationWorkbench.status !== "running") {
      clearGenerationTimer();
      return;
    }
    state.generationWorkbench.stageIndex = Math.min(
      AI_TEXT_GAME_PIPELINE_STAGES.length - 1,
      state.generationWorkbench.stageIndex + 1,
    );
    renderGenerationWorkbench();
  }, 900);
}

function finishGenerationWorkbench() {
  clearGenerationTimer();
  state.generationWorkbench = {
    visible: false,
    status: "succeeded",
    stageIndex: AI_TEXT_GAME_PIPELINE_STAGES.length - 1,
    errorMessage: "",
  };
  renderGenerationWorkbench();
}

function failGenerationWorkbench(error) {
  clearGenerationTimer();
  state.generationWorkbench = {
    visible: true,
    status: "failed",
    stageIndex: state.generationWorkbench.stageIndex || 0,
    errorMessage: error?.message || "生成失败，请稍后重试。",
  };
  renderGenerationWorkbench();
}

function resetGenerationWorkbench() {
  clearGenerationTimer();
  state.generationWorkbench = { visible: false, status: "idle", stageIndex: 0, errorMessage: "" };
  renderGenerationWorkbench();
}

function withGenerationTimeout(task) {
  let timeoutId = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error("AI 制作超时，请重试或缩短描述后再试。"));
    }, DRAFT_GENERATION_TIMEOUT_MS);
  });
  return Promise.race([task, timeout]).finally(() => window.clearTimeout(timeoutId));
}

function showToast(message) {
  const toast = $("appToast");
  clearTimeout(state.toastTimer);
  toast.textContent = message;
  toast.classList.remove("hidden");
  state.toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

function displayMediaUrl(url = "") {
  if (!url) return "";
  if (url.startsWith("/")) return `${apiRuntime.baseUrl || ""}${url}`;
  return url;
}

function stripLargeInlineImages(value) {
  if (Array.isArray(value)) {
    value.forEach(stripLargeInlineImages);
    return value;
  }
  if (!value || typeof value !== "object") return value;
  for (const [key, item] of Object.entries(value)) {
    if (key === "imageUrl" && typeof item === "string" && item.startsWith("data:image/") && item.length > 20000) {
      value[key] = "";
      value.imagePublishNote = "large_inline_image_removed";
    } else {
      stripLargeInlineImages(item);
    }
  }
  return value;
}

function prepareDraftForPublish(draft) {
  const editedDraft = applyDraftEdits(draft);
  return stripLargeInlineImages(structuredClone(editedDraft));
}

const LOOP_STEPS = ["feed", "play", "create", "device"];

function setLoopStep(step) {
  if (LOOP_STEPS.includes(step)) state.loopStep = step;
  renderLoopRail();
}

function renderLoopRail() {
  const rail = $("loopRail");
  if (!rail) return;
  const activeIndex = LOOP_STEPS.indexOf(state.loopStep);
  rail.querySelectorAll("[data-loop-target]").forEach((button) => {
    const index = LOOP_STEPS.indexOf(button.dataset.loopTarget);
    button.classList.toggle("complete", index >= 0 && index < activeIndex);
    button.classList.toggle("active", button.dataset.loopTarget === state.loopStep);
  });
}

function getCreateStepState() {
  const prompt = $("promptInput")?.value || "";
  const hasPrompt = Boolean(prompt.trim());
  const hasOrigin = state.selectedOrigin === "fanwork"
    ? Boolean(state.selectedIpId)
    : Boolean(state.selectedOrigin && state.selectedIpId);
  const hasPersona = state.useCustomPersona
    ? Boolean(state.customPersonaName.trim())
    : Boolean(state.selectedPersona);

  const stepState = {
    prompt: hasPrompt,
    origin: hasOrigin,
    persona: hasPersona,
    template: Boolean(state.selectedTemplate),
    publish: Boolean(state.draft),
  };
  const currentStep = Object.entries(stepState).find(([, done]) => !done)?.[0] || "publish";
  const missingMessages = {
    prompt: "先写一句主题。",
    origin: state.selectedOrigin === "fanwork" ? "选择二创 IP 后再生成。" : "选择作品归属后再生成。",
    persona: "选择主角后再生成。",
    template: "选择题材模板后再生成。",
  };
  const canGenerate = stepState.prompt && stepState.origin && stepState.persona && stepState.template;
  return {
    prompt,
    stepState,
    currentStep,
    missingMessages,
    canGenerate,
  };
}

function canEnterCreateWizardStep(stepId) {
  const { stepState } = getCreateStepState();
  if (stepId === "prompt") return true;
  if (stepId === "making") return state.draftGenerating;
  if (stepId === "settings") return stepState.prompt;
  return Boolean(state.draft);
}

function createWizardStepIndex(stepId = state.createWizardStep) {
  return Math.max(0, createVisibleWizardSteps().findIndex((step) => step.id === stepId));
}

function createStepsByIds(stepIds) {
  return stepIds
    .map((stepId) => CREATE_WIZARD_STEPS.find((step) => step.id === stepId))
    .filter(Boolean);
}

function createVisibleWizardSteps() {
  if (state.draftGenerating) {
    return createStepsByIds(["prompt", "making"]);
  }
  if (!state.draft) return createStepsByIds(["prompt", "settings"]);
  return state.createGuideAdvanced
    ? createStepsByIds(["preview", "settings", "script", "views", "assets", "playtest", "publish"])
    : createStepsByIds(["preview", "playtest", "publish"]);
}

function mobileGuideActiveStep(activeStep) {
  if (state.draftGenerating || activeStep === "making") return "making";
  if (!state.draft) return activeStep === "settings" ? "settings" : "prompt";
  if (activeStep === "publish") return "publish";
  if (activeStep === "playtest") return "playtest";
  if (activeStep === "settings") return "settings";
  return "making";
}

function mobileGuideTarget(stepId) {
  if (state.draft && state.createGuideAdvanced) return "";
  if (stepId === "prompt") return !state.draft && !state.draftGenerating ? "prompt" : "";
  if (stepId === "settings") {
    if (!state.draft && !state.draftGenerating) return "settings";
    return "";
  }
  if (stepId === "making") {
    if (state.draftGenerating) return "making";
    return state.draft ? "preview" : "";
  }
  if (stepId === "playtest") return state.draft ? "playtest" : "";
  if (stepId === "publish") return state.draft ? "publish" : "";
  return "";
}

function renderMobileGuide(activeStep, visibleSteps) {
  const activeGuideStep = mobileGuideActiveStep(activeStep);
  const activeGuideIndex = MOBILE_CREATE_GUIDE_STEPS.findIndex((step) => step.id === activeGuideStep);
  const guideSteps = MOBILE_CREATE_GUIDE_STEPS.map((step, index) => {
    const target = mobileGuideTarget(step.id);
    const disabled = !target || !canEnterCreateWizardStep(target);
    const classes = [
      "create-guide-step",
      step.id === activeGuideStep ? "active" : "",
      index < activeGuideIndex ? "complete" : "",
    ].filter(Boolean).join(" ");
    return `
      <button class="${classes}" ${target ? `data-create-step-target="${target}"` : ""} data-mobile-guide-step="${step.id}" type="button" ${disabled ? "disabled" : ""}>
        <span>${index + 1}</span>
        <strong>${step.label}</strong>
        <small>${step.hint}</small>
      </button>
    `;
  }).join("");
  const professionalRail = state.draft && state.createGuideAdvanced ? `
    <div class="create-professional-rail" aria-label="高级编辑步骤">
      ${visibleSteps.map((step) => `
        <button class="${step.id === activeStep ? "active" : ""}" data-create-step-target="${step.id}" type="button">
          ${step.label}
        </button>
      `).join("")}
    </div>
  ` : "";
  const advancedToggle = state.draft ? `
    <button class="create-advanced-toggle ${state.createGuideAdvanced ? "active" : ""}" data-create-advanced-toggle type="button">
      ${state.createGuideAdvanced ? "收起高级编辑" : "高级编辑"}
    </button>
  ` : "";
  return `
    <div class="create-guide-steps">${guideSteps}</div>
    ${state.draft ? `<div class="create-guide-tools">${advancedToggle}</div>` : ""}
    ${professionalRail}
  `;
}

function setCreateWizardStep(stepId, { scroll = true } = {}) {
  const nextStep = CREATE_WIZARD_STEPS.some((step) => step.id === stepId) ? stepId : "prompt";
  if (!canEnterCreateWizardStep(nextStep)) return false;
  state.createWizardStep = nextStep;
  renderCreateWizard();
  if (scroll) $("createScreen")?.querySelector(".panel-page")?.scrollTo({ top: 0, behavior: "auto" });
  return true;
}

function scrollCreateCardIntoView(stepId) {
  const deck = $("createCardDeck");
  const card = deck?.querySelector(`[data-create-step="${stepId}"]`);
  if (!deck || !card || card.classList.contains("hidden")) return;
  window.clearTimeout(createDeckScrollTimer);
  suppressCreateDeckSyncUntil = Date.now() + 240;
  card.scrollIntoView({ block: "nearest", inline: "center", behavior: "auto" });
}

function syncCreateStepFromDeck() {
  if (Date.now() < suppressCreateDeckSyncUntil) return;
  const deck = $("createCardDeck");
  if (!deck) return;
  const cards = Array.from(deck.querySelectorAll("[data-create-step]:not(.hidden)"));
  if (!cards.length) return;
  const deckRect = deck.getBoundingClientRect();
  const deckCenter = deckRect.left + deckRect.width / 2;
  const nearest = cards
    .map((card) => ({
      card,
      distance: Math.abs(card.getBoundingClientRect().left + card.getBoundingClientRect().width / 2 - deckCenter),
    }))
    .sort((left, right) => left.distance - right.distance)[0]?.card;
  const stepId = nearest?.dataset.createStep;
  if (!stepId || stepId === state.createWizardStep || !canEnterCreateWizardStep(stepId)) return;
  state.createWizardStep = stepId;
  renderCreateWizard({ syncCard: false });
}

function renderCreateWizard({ syncCard = true } = {}) {
  const visibleSteps = createVisibleWizardSteps();
  let activeStep = state.createWizardStep || visibleSteps[0]?.id || "prompt";
  if (!visibleSteps.some((step) => step.id === activeStep)) {
    activeStep = visibleSteps[0]?.id || "prompt";
    state.createWizardStep = activeStep;
  }
  const { canGenerate, stepState } = getCreateStepState();
  const visibleStepIds = new Set(visibleSteps.map((step) => step.id));
  const createWizardNav = $("createWizardNav");
  const isPreDraftFlow = !state.draft && !state.draftGenerating;
  const isDraftFlow = Boolean(state.draft);
  $("createAdvanced")?.classList.toggle("draft-character-only", Boolean(state.draft));
  document.querySelector('[data-create-step="settings"]')?.classList.toggle("draft-character-only", Boolean(state.draft));
  createWizardNav.className = "create-flow mobile-guide-flow";
  createWizardNav.classList.toggle("pre-draft-flow", isPreDraftFlow);
  createWizardNav.classList.toggle("draft-flow", isDraftFlow);
  createWizardNav.classList.toggle("making-flow", state.draftGenerating);
  createWizardNav.classList.toggle("advanced-flow", state.createGuideAdvanced);
  createWizardNav.innerHTML = renderMobileGuide(activeStep, visibleSteps);
  requestAnimationFrame(() => {
    createWizardNav.querySelector(".active")?.scrollIntoView({ block: "nearest", inline: "center" });
  });

  document.querySelectorAll("[data-create-step]").forEach((card) => {
    const visible = visibleStepIds.has(card.dataset.createStep);
    card.classList.toggle("hidden", !visible);
    card.classList.toggle("active", card.dataset.createStep === activeStep);
    card.setAttribute("aria-hidden", String(!visible));
  });
  const settingsTitle = document.querySelector('[data-create-step="settings"] .create-step-title');
  if (settingsTitle) {
    settingsTitle.querySelector("span").textContent = state.draft ? "分区编辑" : "第 2 步";
    settingsTitle.querySelector("h3").textContent = state.draft ? "角色" : "归属和主角";
    settingsTitle.querySelector("p").textContent = state.draft
      ? "只管理会进入故事的出场角色。归属和 IP 已在生成前确认。"
      : "这里决定作品权利归属，并选择原创角色或 IP 角色作为故事主角。";
  }
  $("draftPreview").classList.toggle("hidden", !state.draft);
  if (syncCard) requestAnimationFrame(() => scrollCreateCardIntoView(activeStep));

  const flow = visibleSteps.map((step) => step.id);
  const flowIndex = flow.indexOf(activeStep);
  const previous = flowIndex > 0 ? CREATE_WIZARD_STEPS.find((step) => step.id === flow[flowIndex - 1]) : null;
  let next = flowIndex >= 0 && flowIndex < flow.length - 1
    ? CREATE_WIZARD_STEPS.find((step) => step.id === flow[flowIndex + 1])
    : null;
  const publishTerminalStep = activeStep === "publish" && Boolean(state.draft);
  $("createWizardActions").classList.toggle("single-action", !previous || publishTerminalStep);
  $("createWizardPrevButton").disabled = !previous;
  $("createWizardPrevButton").classList.toggle("hidden", !previous);
  $("createWizardNextButton").classList.toggle("hidden", publishTerminalStep);
  $("createWizardNextButton").disabled = activeStep === "prompt"
    ? !stepState.prompt
    : activeStep === "settings" && !state.draft
      ? !canGenerate || state.draftGenerating
      : !next || (next.id !== "settings" && !canEnterCreateWizardStep(next.id));
  $("createWizardNextButton").textContent = next
    ? (activeStep === "prompt" ? "下一步：归属和主角" : `去${next.label}`)
    : activeStep === "settings" && !state.draft
      ? "启动 AI 制作"
      : "完成";
  $("generateButton").classList.toggle("hidden", Boolean(state.draft));
  $("createReadinessHint").classList.toggle("hidden", Boolean(state.draft));
}

function updateCreateReadiness() {
  const { prompt, stepState, currentStep, missingMessages, canGenerate } = getCreateStepState();

  const promptMaxLength = Number($("promptInput")?.maxLength) || 220;
  $("promptCount").textContent = `${prompt.length} / ${promptMaxLength}`;
  resizePromptInput();
  $("generateButton").disabled = !canGenerate || state.draftGenerating;
  $("createReadinessHint").textContent = canGenerate
    ? "信息已齐，可以启动 AI 制作。"
    : missingMessages[currentStep] || "";
  $("createReadinessHint").classList.toggle("ready", canGenerate);

  renderCreateWizard();
}

function resizePromptInput() {
  const promptInput = $("promptInput");
  if (!promptInput) return;
  const viewportHeight = window.visualViewport?.height || window.innerHeight || 720;
  const minHeight = 230;
  const maxHeight = Math.max(260, Math.min(420, Math.floor(viewportHeight * 0.58)));
  promptInput.style.height = "auto";
  const nextHeight = Math.max(promptInput.scrollHeight, minHeight);
  promptInput.style.height = `${Math.min(nextHeight, maxHeight)}px`;
  promptInput.style.overflowY = nextHeight > maxHeight ? "auto" : "hidden";
}

function validateCreateOptions(options) {
  if (options.originType === "fanwork" && !options.ipId) {
    showCreateError("选择二创时，需要先从 IP 池选择对应 IP。");
    $("ipSelector").scrollIntoView({ block: "center" });
    return false;
  }
  if (!options.personaId || (state.useCustomPersona && !options.customPersona?.name)) {
    showCreateError("需要先选择 IP 角色，或填写原创角色名。");
    return false;
  }
  showCreateError();
  return true;
}

function showScreen(screenId) {
  document.querySelector(".phone-stage").dataset.screen = screenId;
  for (const id of screens) $(id).classList.toggle("active", id === screenId);
  if (screenId === "createScreen") state.loopStep = "create";
  if (screenId === "badgeScreen" || screenId === "storeScreen") state.loopStep = "device";
  const activePanel = $(screenId).querySelector(".panel-page");
  if (activePanel) activePanel.scrollTop = 0;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.target === screenId);
  });
  renderScreenData(screenId);
  renderChrome(screenId);
  renderLoopRail();
}

function renderChrome(screenId) {
  const chrome = {
    friendsScreen: { left: "我的", leftLabel: "打开我的", title: "好友", right: "添加", rightLabel: "添加好友" },
    feedScreen: { left: "我的", leftLabel: "打开我的", title: "咕咕闪", right: "创作", rightLabel: "开始创作" },
    ipScreen: { left: "我的", leftLabel: "打开我的", title: "IP 池", right: "创作", rightLabel: "开始创作" },
    badgeScreen: { left: "设备", leftLabel: "设备链路", title: "我的设备", right: "商店", rightLabel: "打开商店" },
    storeScreen: { left: "设备", leftLabel: "查看当前设备", title: "商店", right: "我的", rightLabel: "打开我的" },
    profileScreen: { left: "我的", leftLabel: "打开我的", title: "我的", right: "创作", rightLabel: "开始创作" },
    createScreen: { left: "返回", leftLabel: "返回我的", title: "创作", right: "我的", rightLabel: "返回我的" },
    operatorScreen: { left: "我的", leftLabel: "打开我的", title: "运营", right: "关闭", rightLabel: "关闭运营台" },
    playerScreen: { left: "我的", leftLabel: "打开我的", title: "互动", right: "创作", rightLabel: "开始创作" },
    commentScreen: { left: "返回", leftLabel: "返回内容流", title: "评论", right: "创作", rightLabel: "开始创作" },
  }[screenId] || { left: "我的", leftLabel: "打开我的", title: "咕咕闪", right: "创作", rightLabel: "开始创作" };

  $("profileButton").textContent = chrome.left;
  $("profileButton").title = chrome.leftLabel;
  $("profileButton").setAttribute("aria-label", chrome.leftLabel);
  $("brandText").textContent = chrome.title;
  $("runtimeBadge").textContent = apiRuntime.mode === "http" ? "API" : "Mock";
  $("runtimeBadge").title = apiRuntime.mode === "http"
    ? `Backend Alpha${apiRuntime.baseUrl ? ` · ${apiRuntime.baseUrl}` : ""}`
    : "Local mock data";
  $("runtimeBadge").classList.toggle("http-mode", apiRuntime.mode === "http");
  $("operatorButton").textContent = chrome.right;
  $("operatorButton").title = chrome.rightLabel;
  $("operatorButton").setAttribute("aria-label", chrome.rightLabel);
}

function renderFeed() {
  const pack = activePack();
  if (!pack) return;
  const scene = pack.scenes.find((item) => item.id === pack.entrySceneId) || pack.scenes[0];

  const coverImageUrl = displayMediaUrl(pack.cover?.imageUrl || "");
  $("feedVisual").style.background = coverImageUrl
    ? `${pack.cover?.background || scene.background} center / cover no-repeat`
    : pack.cover?.background || scene.background;
  $("feedVisual").style.backgroundImage = coverImageUrl ? `url("${coverImageUrl}")` : "";
  $("feedCharacter").textContent = coverImageUrl ? "" : pack.persona?.avatar || pack.cover?.character || scene.character || "✨";
  $("feedCharacter").classList.toggle("hidden", Boolean(coverImageUrl));
  $("feedPersona").textContent = pack.persona?.name || "咕咕分身";
  $("feedTitle").textContent = displayWorkTitle(pack);
  $("feedText").textContent = scene.text;
  $("feedAuthor").textContent = `@${pack.author?.name || "Gugu Creator"} · 完播率 ${Math.round((pack.metrics?.completionRate || 0) * 100)}% · ${userDistributionLabel(pack)}`;
  $("feedTags").innerHTML = packTagList(pack, 1).map((tag) => `<span>${tag}</span>`).join("");
  $("likeCount").textContent = formatNumber(pack.metrics?.likes);
  $("saveCount").textContent = formatNumber(pack.metrics?.saves);
  if ($("remixCount")) $("remixCount").textContent = formatNumber(pack.metrics?.remixes);
  $("commentCount").textContent = formatNumber(pack.metrics?.comments);
  if ($("feedPosition")) $("feedPosition").textContent = `${state.activeIndex + 1} / ${state.packs.length}`;
  if ($("feedProgressBar")) $("feedProgressBar").style.width = `${((state.activeIndex + 1) / state.packs.length) * 100}%`;
  renderLoopRail();
  renderPostPublishPanel();
}

function workFingerprint(pack = {}) {
  const titleFamily = String(pack.title || "")
    .replace(/(\s+Remix)+$/i, "")
    .trim();
  const sceneText = (pack.scenes || []).slice(0, 3).map((scene) => `${scene.text || ""}|${scene.stageScriptText || ""}`).join("|");
  return [
    titleFamily || pack.title || "",
    pack.contentOrigin || "",
    pack.ipName || "",
    pack.persona?.name || "",
    sceneText,
  ].join("::").toLowerCase();
}

function uniqueWorks(works = []) {
  const seen = new Set();
  return works.filter((pack) => {
    const key = workFingerprint(pack);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderPostPublishPanel() {
  const panel = $("postPublishPanel");
  const pack = state.lastPublishedPackId
    ? state.packs.find((item) => item.id === state.lastPublishedPackId)
    : null;
  panel.classList.toggle("hidden", !pack);
  document.querySelector(".feed-controls")?.classList.toggle("hidden", Boolean(pack));
  if (pack) $("postPublishTitle").textContent = displayWorkTitle(pack);
}

function isFeedScreenVisible() {
  return document.querySelector(".phone-stage")?.dataset.screen === "feedScreen";
}

function getVerticalFeedDelta(deltaX, deltaY, elapsedMs) {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  const isVertical = absY > absX * FEED_SWIPE_MIN_DOMINANCE;
  const velocity = absY / Math.max(elapsedMs, 1);
  const isIntentional = absY > FEED_SWIPE_MIN_DISTANCE || velocity > FEED_SWIPE_MIN_VELOCITY;
  if (!isVertical || !isIntentional) return 0;
  return deltaY < 0 ? 1 : -1;
}

function moveFeed(delta) {
  if (!state.packs.length || state.feedAnimating || !delta) return;
  const step = delta > 0 ? 1 : -1;
  const card = $("feedCard");
  const direction = step > 0 ? "next" : "prev";
  state.feedAnimating = true;
  card.classList.remove("is-entering-next", "is-entering-prev", "is-leaving-next", "is-leaving-prev");
  card.classList.add(`is-leaving-${direction}`);
  window.setTimeout(() => {
    state.activeIndex = (state.activeIndex + step + state.packs.length) % state.packs.length;
    renderFeed();
    card.classList.remove(`is-leaving-${direction}`);
    card.classList.add(`is-entering-${direction}`);
    window.setTimeout(() => {
      card.classList.remove(`is-entering-${direction}`);
      state.feedAnimating = false;
    }, 260);
  }, 150);
}

function jumpFeed(delta) {
  state.activeIndex = (state.activeIndex + delta + state.packs.length) % state.packs.length;
  renderFeed();
}

function openPlayer(pack = activePack()) {
  state.activeIndex = state.packs.findIndex((item) => item.id === pack.id);
  state.activeSceneId = pack.entrySceneId || pack.scenes[0]?.id;
  setLoopStep("play");
  renderScene();
  showScreen("playerScreen");
}

function renderScene() {
  const pack = activePack();
  const scene = pack.scenes.find((item) => item.id === state.activeSceneId) || pack.scenes[0];
  $("playerScene").style.background = scene.background || pack.cover?.background;
  $("sceneCharacter").textContent = scene.character || pack.persona?.avatar || pack.cover?.character || "✨";
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
  if (isCompletionScene(pack, scene)) setLoopStep("create");
}

function isCompletionScene(pack, scene) {
  if (!scene) return false;
  if (scene.id === "end") return true;
  const actions = scene.actions || [];
  if (!actions.length) return true;
  return actions.some((action) => action.goto === pack.entrySceneId || action.label.includes("重新"));
}

function sceneLocationLabel(scene, index) {
  const title = String(scene?.title || scene?.id || `场景 ${index + 1}`).trim();
  return title.length > 8 ? `${title.slice(0, 8)}…` : title;
}

function scriptSceneLocation(scene, index) {
  if (scene?.location) return scene.location;
  const title = sceneLocationLabel(scene, index);
  return /入口|开场/.test(title) ? `${title}附近` : title;
}

function scriptSceneTime(scene, index) {
  if (scene?.time) return scene.time;
  const text = `${scene?.title || ""}${scene?.text || ""}`;
  if (/雨夜|夜|深夜/.test(text)) return index < 3 ? "雨夜 22:40" : "深夜 23:30";
  if (/黄昏|傍晚/.test(text)) return "黄昏 18:10";
  return index < 2 ? "当日 下午" : "当日 傍晚";
}

function scriptSceneCast(scene, draft, index) {
  const sceneNames = new Set((scene?.characters || []).map((name) => String(name || "").trim()).filter(Boolean));
  const storyCharacters = filterDisplayableStoryCharacters(draft.characters || [])
    .filter((character) => character.enabled !== false);
  const supportingCharacters = storyCharacters.filter((character) => (
    character.name !== draft.persona?.name && !sceneNames.has(character.name)
  ));
  const selectedSupport = supportingCharacters.length
    ? supportingCharacters.filter((_, characterIndex) => (
      index === 0 ||
      /decision|分岔|选择|end|结局/.test(`${scene?.id || ""}${scene?.title || ""}`) ||
      characterIndex % Math.max(1, Math.min(2, supportingCharacters.length)) === index % Math.max(1, Math.min(2, supportingCharacters.length))
    ))
    : [];
  const names = [
    ...(scene?.characters || []),
    scene?.speaker,
    draft.persona?.name,
    ...selectedSupport.map((character) => character.name),
  ]
    .map((name) => String(name || "").trim())
    .filter((name) => name && !["旁白", "提示", "线索", "挑战", "结局", "尾声", "反馈"].includes(name));
  return Array.from(new Set(names));
}

function scriptSceneCharacters(scene, draft, index) {
  return scriptSceneCast(scene, draft, index).join("、") || draft.persona?.name || "待定角色";
}

function supportingDialogueForScene(scene, draft, index) {
  const existingSpeakers = new Set((scene?.dialogue || []).map((line) => line.speaker).filter(Boolean));
  const castNames = scriptSceneCast(scene, draft, index)
    .filter((name) => name && name !== draft.persona?.name && !existingSpeakers.has(name));
  if (!castNames.length) return [];
  const beat = scene?.beat || "推进剧情";
  const location = scriptSceneLocation(scene, index);
  return castNames.slice(0, 2).map((name) => {
    const character = (draft.characters || []).find((item) => item.name === name) || {};
    const motive = character.motivation || character.voice || "不想让线索被误读";
    const text = /关键选择/.test(beat)
      ? `如果现在选错，${location}里留下的不是线索，是新的麻烦。`
      : /收集线索/.test(beat)
        ? `我刚才看见${location}有个细节不对，先别把它当成巧合。`
        : /结局/.test(beat)
          ? `所以这就是答案吗？${motive}这件事，终于说得通了。`
          : `我可以帮你确认一件事：${motive}，但你得先决定要不要相信我。`;
    return { speaker: name, text };
  });
}

function invalidateAutoStageScript(draft) {
  if ($("draftScriptText")?.dataset.userEdited) return;
  delete draft.stageScriptText;
  for (const scene of draft.scenes || []) {
    if (!scene.userEditedScript) delete scene.stageScriptText;
  }
}

function makeStageScriptText(draft) {
  const scenes = draft.scenes || [];
  const lines = [
    `# ${draft.title || "未命名文字游戏"}`,
    "",
    `简介：${draft.creationBrief?.logline || draft.scenes?.[0]?.text || "一句话创意生成的互动剧本。"}`,
    "",
  ];
  scenes.forEach((scene, index) => {
    const sceneText = scene.stageScriptText || makeSceneScriptText(draft, scene, index);
    lines.push(sceneText);
    lines.push("");
  });
  return lines.join("\n").trim();
}

function makeSceneScriptText(draft, scene, index) {
  if (!scene) return "";
  const sceneTitleById = new Map((draft.scenes || []).map((item, sceneIndex) => [item.id, sceneLocationLabel(item, sceneIndex)]));
  const lines = [
    `## 第${index + 1}场：${sceneLocationLabel(scene, index)}`,
    "",
    `地点：${scriptSceneLocation(scene, index)}`,
    `时间：${scriptSceneTime(scene, index)}`,
    `出场角色：${scriptSceneCharacters(scene, draft, index)}`,
    `戏剧问题：${scene.dramaticQuestion || "这一场必须让玩家确认一个新信息。"}`,
    `阻碍：${scene.obstacle || "线索不完整，角色也没有完全说真话。"}`,
    `转折：${scene.turningPoint || "本场结束时，信息或关系发生改变。"}`,
    "",
    "【场面】",
  ];
  lines.push(scene.stageDirection || "角色移动到能看见关键线索的位置，画面里必须有一个可记住的动作或道具。");
  lines.push("");
  lines.push("【正文】");
  const dialogue = scene.dialogue?.length
    ? scene.dialogue
    : [{ speaker: scene.speaker || draft.persona?.name || "旁白", text: scene.text || "待补充正文" }];
  for (const line of [...dialogue, ...supportingDialogueForScene(scene, draft, index)]) {
    lines.push(`${line.speaker || "旁白"}：${line.text || "待补充正文"}`);
  }
  if ((scene.actions || []).length) {
    lines.push("");
    lines.push(`【选择前压力】${scene.obstacle || "现在必须选择，因为拖延会让线索失效。"}`);
    lines.push("");
    lines.push("【选择】");
    for (const action of scene.actions || []) {
      lines.push(`- ${action.label || "继续"}：${action.stakes || "会改变下一场的信息焦点。"} / 反馈：${action.feedback || "选择后立刻进入下一场。"} / 去：${sceneTitleById.get(action.goto) || action.goto || "未指定"}`);
    }
  }
  return lines.join("\n").trim();
}

function parseSceneScriptEdit(text = "", scene) {
  const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
  const bodyStart = lines.findIndex((line) => line === "【正文】");
  const pressureStart = lines.findIndex((line) => line.startsWith("【选择前压力】"));
  const choiceStart = lines.findIndex((line) => line === "【选择】");
  const bodyEndCandidates = [pressureStart, choiceStart].filter((index) => index > bodyStart);
  const bodyEnd = bodyEndCandidates.length ? Math.min(...bodyEndCandidates) : lines.length;
  const bodyLines = bodyStart >= 0 ? lines.slice(bodyStart + 1, bodyEnd) : [];
  const dialogue = bodyLines
    .map((line) => {
      const match = line.match(/^([^：:]{1,16})[：:](.+)$/);
      return match ? { speaker: match[1].trim(), text: match[2].trim() } : null;
    })
    .filter(Boolean);
  if (dialogue.length) {
    scene.dialogue = dialogue;
    scene.speaker = dialogue[0].speaker;
    scene.text = dialogue.map((line) => line.text).join(" ");
  }
  if (choiceStart >= 0 && scene.actions?.length) {
    const choiceLines = lines.slice(choiceStart + 1).filter((line) => line.startsWith("- "));
    choiceLines.forEach((line, index) => {
      const action = scene.actions[index];
      if (!action) return;
      const cleaned = line.replace(/^- /, "");
      const [labelPart, rest = ""] = cleaned.split("：");
      if (labelPart?.trim()) action.label = labelPart.trim();
      const feedbackMatch = rest.match(/反馈：([^/]+)/);
      const stakes = rest.split("/")[0]?.trim();
      if (stakes) action.stakes = stakes;
      if (feedbackMatch?.[1]) action.feedback = feedbackMatch[1].trim();
    });
  }
}

function renderScriptSceneReadable(draft, scene, index) {
  const dialogue = scene.dialogue?.length
    ? scene.dialogue
    : [{ speaker: scene.speaker || draft.persona?.name || "旁白", text: scene.text || "待补充正文" }];
  const support = supportingDialogueForScene(scene, draft, index);
  const choices = scene.actions || [];
  return `
    <div class="scene-readable-meta">
      <span>${escapeHtml(scriptSceneLocation(scene, index))}</span>
      <span>${escapeHtml(scriptSceneTime(scene, index))}</span>
      <span>${escapeHtml(scene.emotion || "情绪待定")}</span>
    </div>
    <section>
      <strong>这场要解决什么</strong>
      <p>${escapeHtml(scene.dramaticQuestion || "这一场必须让玩家确认一个新信息。")}</p>
    </section>
    <section>
      <strong>阻碍和转折</strong>
      <p>${escapeHtml(scene.obstacle || "线索不完整，角色也没有完全说真话。")}</p>
      <p>${escapeHtml(scene.turningPoint || "本场结束时，信息或关系发生改变。")}</p>
    </section>
    <section>
      <strong>场面</strong>
      <p>${escapeHtml(scene.stageDirection || "角色移动到能看见关键线索的位置。")}</p>
    </section>
    <section>
      <strong>对白</strong>
      <div class="scene-readable-lines">
        ${[...dialogue, ...support].map((line) => `
          <p><span>${escapeHtml(line.speaker || "旁白")}</span>${escapeHtml(line.text || "待补充正文")}</p>
        `).join("")}
      </div>
    </section>
    ${choices.length ? `<section>
      <strong>选择压力</strong>
      <p>${escapeHtml(scene.obstacle || "现在必须选择，因为拖延会让线索失效。")}</p>
      <div class="scene-readable-choices">
        ${choices.map((action) => `<p><b>${escapeHtml(action.label || "继续")}</b><span>${escapeHtml(action.stakes || "会改变下一场的信息焦点。")}</span><small>${escapeHtml(action.feedback || "选择后立刻进入下一场。")}</small></p>`).join("")}
      </div>
    </section>` : ""}
  `;
}

function syncHiddenStageScript(draft) {
  if (!$("draftScriptText")) return;
  if (!$("draftScriptText").dataset.userEdited) {
    $("draftScriptText").value = draft.stageScriptText || makeStageScriptText(draft);
  }
}

function renderScriptSceneWorkspace(draft) {
  const scenes = draft.scenes || [];
  if (!state.selectedScriptSceneId || !scenes.some((scene) => scene.id === state.selectedScriptSceneId)) {
    state.selectedScriptSceneId = scenes[0]?.id || null;
  }
  const activeScene = scenes.find((scene) => scene.id === state.selectedScriptSceneId) || scenes[0];
  const activeIndex = scenes.findIndex((scene) => scene.id === activeScene?.id);
  $("scriptSceneTabs").innerHTML = scenes.map((scene, index) => `
    <button class="${scene.id === activeScene?.id ? "active" : ""}" data-script-scene-open="${escapeHtml(scene.id)}" type="button">
      <span>${index + 1}</span>
      ${escapeHtml(sceneLocationLabel(scene, index))}
    </button>
  `).join("");
  $("scriptScenePreview").innerHTML = activeScene ? `
    <div>
      <strong>${escapeHtml(sceneLocationLabel(activeScene, activeIndex))}</strong>
      <span>${escapeHtml(scriptSceneLocation(activeScene, activeIndex))} · ${escapeHtml(scriptSceneTime(activeScene, activeIndex))}</span>
    </div>
    <p>${escapeHtml((activeScene.dialogue?.[0]?.text || activeScene.text || "").slice(0, 110))}</p>
    <button class="ghost-light-button" data-script-scene-open="${escapeHtml(activeScene.id)}" type="button">打开本场剧本</button>
  ` : `<div class="empty-state compact-empty">还没有剧本场景。</div>`;
  syncHiddenStageScript(draft);
}

function openScriptSceneModal(sceneId) {
  if (!state.draft) return;
  const scenes = state.draft.scenes || [];
  const scene = scenes.find((item) => item.id === sceneId) || scenes[0];
  if (!scene) return;
  const index = scenes.findIndex((item) => item.id === scene.id);
  state.selectedScriptSceneId = scene.id;
  $("scriptSceneModalTitle").textContent = `第${index + 1}场：${sceneLocationLabel(scene, index)}`;
  $("scriptSceneModalMeta").textContent = `${scriptSceneLocation(scene, index)} · ${scriptSceneTime(scene, index)}`;
  $("scriptSceneReadable").innerHTML = renderScriptSceneReadable(state.draft, scene, index);
  $("scriptSceneEditor").value = scene.stageScriptText || makeSceneScriptText(state.draft, scene, index);
  $("scriptSceneModal").classList.remove("hidden");
  renderScriptSceneWorkspace(state.draft);
}

function closeScriptSceneModal() {
  $("scriptSceneModal")?.classList.add("hidden");
}

function saveScriptSceneModal() {
  if (!state.draft || !state.selectedScriptSceneId) return;
  const scene = (state.draft.scenes || []).find((item) => item.id === state.selectedScriptSceneId);
  if (!scene) return;
  scene.stageScriptText = $("scriptSceneEditor").value.trim();
  parseSceneScriptEdit(scene.stageScriptText, scene);
  scene.userEditedScript = true;
  state.draft.stageScriptText = makeStageScriptText(state.draft);
  state.draft.updatedAt = Date.now();
  $("draftScriptText").dataset.userEdited = "true";
  $("draftScriptText").value = state.draft.stageScriptText;
  renderScriptSceneWorkspace(state.draft);
  renderDraftPlaytest(state.draft);
  renderDraftSceneEditor(state.draft);
  renderDraftQuality(state.draft);
  closeScriptSceneModal();
}

function renderCharacterViews(draft) {
  const storyCharacters = filterDisplayableStoryCharacters(draft.characters || []);
  const characters = storyCharacters.length
    ? storyCharacters
    : [{
      name: draft.persona?.name || "主角",
      avatar: draft.persona?.avatar || "原",
      role: "主角",
      voice: draft.persona?.tagline || "等待补充角色设定。",
    }];
  return characters.map((character) => {
    const avatar = escapeHtml(character.avatar || "角");
    const name = escapeHtml(character.name || "未命名角色");
    return `
      <article class="character-view-card">
        <header>
          <span>${avatar}</span>
          <strong>${name}</strong>
        </header>
        <div class="character-view-strip" aria-label="${name} 多视图">
          <button type="button">正面</button>
          <button type="button">侧面</button>
          <button type="button">开心</button>
          <button type="button">紧张</button>
        </div>
        <small>${escapeHtml(character.voice || character.motivation || "用于后续立绘、表情和设备展示。")}</small>
      </article>
    `;
  }).join("");
}

function draftCharacterKey(character) {
  return character?.id || character?.name || "";
}

function isDisplayableStoryCharacter(character) {
  const name = String(character?.name || "").trim();
  const id = String(character?.id || "").trim();
  if (!name) return false;
  return !new Set(["player", "user"]).has(id) &&
    !new Set([
      "玩家",
      "用户",
      "主角",
      "主角们",
      "当前分身",
      "分身",
      "他们",
      "她们",
      "他",
      "她",
      "关键角色",
      "关键同伴",
      "同行伙伴",
      "线索提供者",
    ]).has(name);
}

function filterDisplayableStoryCharacters(characters = []) {
  return characters.filter(isDisplayableStoryCharacter);
}

function makeDraftCharacterFromPersona(persona, role = "出场角色") {
  return {
    id: persona.id,
    name: persona.name,
    avatar: persona.avatar,
    role,
    voice: persona.tagline,
    motivation: persona.tagline,
    enabled: true,
  };
}

function addDraftCharacter(character) {
  if (!state.draft || !character?.name) return false;
  if (!isDisplayableStoryCharacter(character)) {
    showToast("请选择具体人物，不能添加玩家或主角们这类占位角色。");
    return false;
  }
  const key = draftCharacterKey(character);
  const exists = (state.draft.characters || []).some((item) => (
    draftCharacterKey(item) === key || item.name === character.name
  ));
  if (exists) {
    showToast("这个角色已经在故事出场角色里。");
    return false;
  }
  state.draft.characters = [
    ...(state.draft.characters || []),
    {
      ...character,
      role: character.role || "出场角色",
      enabled: character.enabled !== false,
    },
  ];
  state.draft.updatedAt = Date.now();
  invalidateAutoStageScript(state.draft);
  renderDraft(state.draft);
  showToast(`已加入「${character.name}」。`);
  return true;
}

function removeDraftCharacter(characterKey) {
  if (!state.draft) return;
  const before = state.draft.characters || [];
  const removed = before.find((item) => draftCharacterKey(item) === characterKey || item.name === characterKey);
  state.draft.characters = before.filter((item) => draftCharacterKey(item) !== characterKey && item.name !== characterKey);
  state.draft.updatedAt = Date.now();
  invalidateAutoStageScript(state.draft);
  renderDraft(state.draft);
  if (removed?.name) showToast(`已从出场角色移除「${removed.name}」。`);
}

function renderDraft(draft) {
  const checks = createDraftQualityChecks(draft);
  draft.qualityChecks = checks;
  if (!state.draftPlaySceneId || !(draft.scenes || []).some((scene) => scene.id === state.draftPlaySceneId)) {
    state.draftPlaySceneId = draft.entrySceneId || draft.scenes?.[0]?.id || null;
  }
  $("draftPreview").classList.remove("hidden");
  $("draftTitle").textContent = draft.title || "未命名作品";
  $("draftSummary").textContent = draft.creationBrief?.logline || draft.scenes[0]?.text || "";
  $("draftMeta").innerHTML = `
    <span>归属：${packOriginText(draft)} · ${packIpName(draft) || "未选择 IP"}</span>
    <span>主角：${draft.persona?.avatar || "✨"} ${draft.persona?.name || "咕咕分身"}</span>
  `;
  $("draftTitleInput").value = draft.title;
  const displayTags = storyTagList(draft, 6);
  $("draftTagsInput").value = displayTags.join(" / ");
  renderCreateControls();
  $("draftOverviewGrid").innerHTML = `
    <article>
      <span>主角</span>
      <strong>${escapeHtml(`${draft.persona?.avatar || "✨"} ${draft.persona?.name || "未设置"}`)}</strong>
    </article>
    <article>
      <span>标签</span>
      <strong>${escapeHtml(displayTags.slice(0, 4).join(" / ") || "未设置")}</strong>
    </article>
    <article>
      <span>归属</span>
      <strong>${escapeHtml(packOriginText(draft))}</strong>
      <small>${escapeHtml(packIpName(draft) || "未选择 IP")}</small>
    </article>
  `;
  $("generatedCharacterSection")?.classList.toggle("hidden", !state.draft);
  const displayCharacters = filterDisplayableStoryCharacters(draft.characters || []);
  $("characterCardGrid").innerHTML = displayCharacters.length ? displayCharacters.map((character) => {
    const key = escapeHtml(draftCharacterKey(character));
    return `
    <article class="character-card story-character-card">
      <label>
        <input type="checkbox" data-character-enabled="${key}" ${character.enabled === false ? "" : "checked"} />
        <span>${character.enabled === false ? "备用" : "出场"}</span>
      </label>
      <span>${escapeHtml(character.avatar || (character.role === "主角" ? "你" : "角"))}</span>
      <div>
        <strong>${escapeHtml(character.name || "未命名角色")}</strong>
        <small>${escapeHtml(character.role || "角色")}</small>
        <p>${escapeHtml(character.motivation || character.voice || "等待补充人物动机。")}</p>
      </div>
      <button class="ghost-button compact character-delete-button" data-character-delete="${key}" type="button">删除</button>
    </article>
  `;
  }).join("") : `<div class="empty-state compact-empty">还没有故事出场角色。用上方入口创建原创角色，或从当前 IP 选择原著角色。</div>`;
  $("characterViewGrid").innerHTML = renderCharacterViews(draft);
  renderDraftPlaytest(draft);
  $("scriptSceneCountLabel").textContent = `${(draft.scenes || []).length} 个场景`;
  renderScriptSceneWorkspace(draft);
  $("sceneCountLabel").textContent = `${(draft.scenes || []).length} 个场景`;
  renderDraftSceneEditor(draft);
  $("assetCountLabel").textContent = `${(draft.assetPlan || []).length} 项素材`;
  $("assetPlanList").innerHTML = (draft.assetPlan || []).map((asset, index) => `
    <article class="asset-plan-item">
      ${asset.generatedImage?.imageUrl ? `<img class="asset-preview-image" src="${escapeHtml(displayMediaUrl(asset.generatedImage.imageUrl))}" alt="${escapeHtml(asset.name || "素材预览")}">` : ""}
      <div>
        <strong>${escapeHtml(asset.name || "素材")}</strong>
        <small>${escapeHtml(asset.type || "asset")} · ${escapeHtml(asset.source || "unknown")} · ${escapeHtml(asset.status || "draft")}</small>
      </div>
      <p>${escapeHtml(asset.usage || asset.prompt || "")}</p>
      ${asset.prompt ? `<small class="asset-prompt">${escapeHtml(asset.prompt)}</small>` : ""}
      <button class="ghost-button asset-generate-button" data-generate-asset="${index}" type="button">${asset.generatedImage?.imageUrl ? "重新生图" : "生成图片"}</button>
    </article>
  `).join("");
  renderAiEditPanel();
  renderDraftQuality(draft);
  $("publishDraftButton").textContent = state.editingWorkId ? "保存更新" : "发布";
  updateCreateReadiness();
}

function renderDraftQuality(draft) {
  const checks = createDraftQualityChecks(draft);
  draft.qualityChecks = checks;
  const checklist = createPublishChecklist(draft, { qualityChecks: checks });
  const checklistChecks = checklist.checks;
  const blocked = checklistChecks.filter((check) => check.status === "blocked");
  const warnings = checklistChecks.filter((check) => check.status === "warning");
  $("publishChecklistSummary").textContent = blocked.length
    ? `${blocked.length} 个阻塞项需要修复`
    : warnings.length
      ? `${warnings.length} 个提醒项，可继续发布`
      : "全部通过";
  $("qualityCheckList").innerHTML = checklistChecks.map((check) => `
    <article class="quality-check ${check.status}">
      <strong>${escapeHtml(check.label)}</strong>
      <span>${check.status === "passed" ? "通过" : check.status === "blocked" ? "阻塞" : check.status === "waived" ? "已豁免" : "提醒"}</span>
      <small>${escapeHtml(check.detail)}</small>
      ${check.fix ? `<em>${escapeHtml(check.fix)}</em>` : ""}
    </article>
  `).join("");
  $("publishBlockerList").innerHTML = blocked.length ? `
    <strong>发布前必须修复</strong>
    ${blocked.map((check) => `<p>${escapeHtml(check.label)}：${escapeHtml(check.detail)}</p>`).join("")}
  ` : "";
  $("publishBlockerList").classList.toggle("hidden", !blocked.length);
  $("publishDraftButton").disabled = blocked.length > 0;
}

async function generateDraftAssetImage(index, button) {
  if (!state.draft?.assetPlan?.[index]) return;
  const draft = applyDraftEdits(state.draft);
  const asset = draft.assetPlan[index];
  setCreateProgress(`正在生成「${asset.name || "素材"}」图片，通常需要十几秒。`, "info");
  setButtonBusy(button, true, "生图中");
  try {
    const response = await flashApi.generateAiImage({
      ...asset,
      draftId: draft.id,
      draftTitle: draft.title,
      persona: draft.persona,
      world: draft.world,
      contentOrigin: draft.contentOrigin,
      ipName: draft.ipName,
    });
    asset.generatedImage = response.item;
    asset.status = response.item?.status === "used" ? "ai_generated" : "preview";
    if (response.item?.imageUrl && (asset.type === "cover" || !draft.cover?.imageUrl)) {
      draft.cover = {
        ...(draft.cover || {}),
        imageUrl: response.item.imageUrl,
        imageProvider: response.item.provider,
        imageAssetId: asset.id,
        sourceStatement: response.item.sourceStatement || null,
      };
    }
    state.draft = draft;
    renderDraft(state.draft);
    setCreateProgress(response.item?.status === "used"
      ? `「${asset.name || "素材"}」图片已生成，并已用于作品封面预览。`
      : "已生成本地预览；检查生图配置后可以重新生图。",
    response.item?.status === "used" ? "success" : "warning");
    showToast(response.item?.status === "used" ? "AI 图片已生成。" : "已生成本地预览，检查生图配置后可重试。");
  } finally {
    setButtonBusy(button, false);
  }
}

function renderDraftPlaytest(draft) {
  const scenes = draft.scenes || [];
  const scene = scenes.find((item) => item.id === state.draftPlaySceneId) || scenes[0];
  const report = createTextGamePlaytestReport(draft);
  const blocked = report.checks.filter((check) => check.status === "blocked").length;
  const warnings = report.checks.filter((check) => check.status === "warning").length;
  if ($("playtestReportPanel")) {
    $("playtestReportPanel").innerHTML = `
      <div class="playtest-report-summary ${report.status}">
        <strong>${report.status === "passed" ? "全路径可玩" : report.status === "blocked" ? "发现阻塞问题" : "有优化建议"}</strong>
        <span>${report.summary.reachableCount}/${report.summary.sceneCount} 场景可达 · ${report.summary.endingCount} 个结局 · ${report.summary.pathCount} 条路径</span>
      </div>
      <div class="playtest-report-grid">
        <div><strong>${blocked}</strong><span>阻塞</span></div>
        <div><strong>${warnings}</strong><span>提醒</span></div>
        <div><strong>${report.summary.endingCount}</strong><span>结局</span></div>
      </div>
      ${report.fixes.length ? `<div class="playtest-fix-list">${report.fixes.map((fix) => `<small>${escapeHtml(fix.label)}：${escapeHtml((fix.targetIds || []).join("、"))}</small>`).join("")}</div>` : ""}
    `;
  }
  if (!scene) {
    $("draftPlaytestPanel").innerHTML = `<div class="empty-state compact-empty">还没有可试玩的场景。</div>`;
    return;
  }
  const index = scenes.findIndex((item) => item.id === scene.id);
  $("draftPlayPosition").textContent = `${index + 1} / ${scenes.length}`;
  $("draftPlaytestPanel").innerHTML = `
    <div class="draft-play-scene" style="background: ${escapeHtml(scene.background || draft.cover?.background || "#111827")}">
      <div class="draft-play-character">${escapeHtml(scene.character || draft.persona?.avatar || "✨")}</div>
      <div class="draft-play-copy">
        <strong>${escapeHtml(scene.speaker || draft.persona?.name || "旁白")}</strong>
        <p>${escapeHtml(scene.text || "空场景")}</p>
      </div>
    </div>
    <div class="draft-play-actions">
      ${(scene.actions || []).map((action, actionIndex) => `
        <button type="button" data-play-goto="${escapeHtml(action.goto || "")}">${escapeHtml(action.label || `选项 ${actionIndex + 1}`)}</button>
      `).join("") || `<button type="button" data-play-goto="${escapeHtml(draft.entrySceneId || scenes[0]?.id || "")}">重新开始</button>`}
      <button type="button" data-play-restart="true">从头试玩</button>
    </div>
  `;
  $("draftPlaytestPanel").querySelectorAll("[data-play-goto]").forEach((button) => {
    button.addEventListener("click", () => {
      state.draftPlaySceneId = button.dataset.playGoto || draft.entrySceneId || scenes[0]?.id;
      renderDraftPlaytest(draft);
    });
  });
  $("draftPlaytestPanel").querySelector("[data-play-restart]")?.addEventListener("click", () => {
    state.draftPlaySceneId = draft.entrySceneId || scenes[0]?.id;
    renderDraftPlaytest(draft);
  });
}

function renderDraftSceneEditor(draft) {
  const scenes = draft.scenes || [];
  const report = createTextGamePlaytestReport(draft);
  const unreachableIds = new Set(report.unreachableSceneIds || []);
  const deadEndIds = new Set(report.deadEndSceneIds || []);
  const endingIds = new Set(report.endingSceneIds || []);
  const sceneOptions = scenes.map((scene) => `
    <option value="${escapeHtml(scene.id)}">${escapeHtml(scene.title || scene.id)}</option>
  `).join("");
  $("draftSceneList").innerHTML = scenes.map((scene, index) => `
    <article class="scene-editor-item" data-scene-id="${escapeHtml(scene.id)}">
      <header>
        <span>${escapeHtml(scene.character || draft.cover?.character || "✨")}</span>
        <div>
          <strong>${index + 1}. ${escapeHtml(scene.title || scene.id)}</strong>
          <small>${escapeHtml(scene.id)} · ${(scene.actions || []).length} 个选项</small>
        </div>
      </header>
      <div class="scene-health-row">
        ${scene.id === draft.entrySceneId ? `<span class="good">入口</span>` : ""}
        ${endingIds.has(scene.id) ? `<span class="good">结局</span>` : ""}
        ${unreachableIds.has(scene.id) ? `<span class="bad">不可达</span>` : ""}
        ${deadEndIds.has(scene.id) ? `<span class="bad">死路</span>` : ""}
        ${!unreachableIds.has(scene.id) && !deadEndIds.has(scene.id) ? `<span>可玩</span>` : ""}
      </div>
      <div class="scene-background-row">
        <div class="scene-background-preview" style="background: ${escapeHtml(scene.background || draft.cover?.background || "#f8fafc")}"></div>
        <label><small>背景图 / 背景提示</small><input data-scene-field="background" value="${escapeHtml(scene.background || "")}" placeholder="可填图片 URL、渐变或背景提示词" /></label>
      </div>
      <div class="scene-editor-grid">
        <label><small>标题</small><input data-scene-field="title" value="${escapeHtml(scene.title || "")}" /></label>
        <label><small>说话人</small><input data-scene-field="speaker" value="${escapeHtml(scene.speaker || "")}" /></label>
        <label><small>表情</small><input data-scene-field="character" maxlength="4" value="${escapeHtml(scene.character || "")}" /></label>
      </div>
      <label class="scene-editor-text"><small>正文</small><textarea data-scene-field="text" rows="3">${escapeHtml(scene.text || "")}</textarea></label>
      <div class="scene-action-editor">
        ${(scene.actions || []).map((action, actionIndex) => `
          <div class="scene-action-row" data-action-index="${actionIndex}">
            <input data-action-field="label" value="${escapeHtml(action.label || "")}" placeholder="选项文案" />
            <select data-action-field="goto">
              ${sceneOptions}
            </select>
            <button type="button" data-scene-action="delete-action">删</button>
          </div>
        `).join("")}
      </div>
      <footer>
        <button type="button" data-scene-action="add-action">加选项</button>
        <button type="button" data-scene-action="duplicate-scene">复制</button>
        <button type="button" data-scene-action="delete-scene" ${scenes.length <= 2 ? "disabled" : ""}>删除</button>
      </footer>
    </article>
  `).join("");

  $("draftSceneList").querySelectorAll("[data-action-field='goto']").forEach((select) => {
    const sceneId = select.closest("[data-scene-id]")?.dataset.sceneId;
    const actionIndex = Number(select.closest("[data-action-index]")?.dataset.actionIndex);
    const scene = scenes.find((item) => item.id === sceneId);
    select.value = scene?.actions?.[actionIndex]?.goto || draft.entrySceneId || scenes[0]?.id || "";
  });

  wireDraftSceneEditor(draft);
}

function findDraftScene(draft, sceneId) {
  return (draft.scenes || []).find((scene) => scene.id === sceneId);
}

function nextDraftSceneId(draft) {
  const ids = new Set((draft.scenes || []).map((scene) => scene.id));
  let index = (draft.scenes || []).length + 1;
  while (ids.has(`scene_${index}`)) index += 1;
  return `scene_${index}`;
}

function refreshDraftAfterStructureChange(draft) {
  draft.updatedAt = Date.now();
  renderDraftPlaytest(draft);
  renderDraftSceneEditor(draft);
  renderDraftQuality(draft);
  $("sceneCountLabel").textContent = `${(draft.scenes || []).length} 个场景`;
}

function wireDraftSceneEditor(draft) {
  $("addDraftSceneButton").onclick = () => {
    const id = nextDraftSceneId(draft);
    draft.scenes.push({
      id,
      title: "新场景",
      background: draft.cover?.background || "#111827",
      character: draft.persona?.avatar || "✨",
      speaker: draft.persona?.name || "旁白",
      text: "写下这一幕发生了什么。",
      actions: [{ label: "继续", goto: draft.entrySceneId || draft.scenes[0]?.id || id }],
    });
    refreshDraftAfterStructureChange(draft);
  };

  $("draftSceneList").querySelectorAll("[data-scene-field]").forEach((field) => {
    field.addEventListener("change", () => {
      const scene = findDraftScene(draft, field.closest("[data-scene-id]")?.dataset.sceneId);
      if (!scene) return;
      scene[field.dataset.sceneField] = field.value.trim();
      draft.updatedAt = Date.now();
      renderDraftPlaytest(draft);
      renderDraftQuality(draft);
    });
  });

  $("draftSceneList").querySelectorAll("[data-action-field]").forEach((field) => {
    field.addEventListener("change", () => {
      const scene = findDraftScene(draft, field.closest("[data-scene-id]")?.dataset.sceneId);
      const actionIndex = Number(field.closest("[data-action-index]")?.dataset.actionIndex);
      const action = scene?.actions?.[actionIndex];
      if (!action) return;
      action[field.dataset.actionField] = field.value.trim();
      draft.updatedAt = Date.now();
      renderDraftPlaytest(draft);
      renderDraftQuality(draft);
    });
  });

  $("draftSceneList").querySelectorAll("[data-scene-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const sceneId = button.closest("[data-scene-id]")?.dataset.sceneId;
      const scene = findDraftScene(draft, sceneId);
      if (!scene) return;

      if (button.dataset.sceneAction === "add-action") {
        scene.actions = scene.actions || [];
        scene.actions.push({ label: "新选项", goto: draft.entrySceneId || draft.scenes[0]?.id || scene.id });
      }

      if (button.dataset.sceneAction === "delete-action") {
        const actionIndex = Number(button.closest("[data-action-index]")?.dataset.actionIndex);
        scene.actions.splice(actionIndex, 1);
      }

      if (button.dataset.sceneAction === "duplicate-scene") {
        const copy = structuredClone(scene);
        copy.id = nextDraftSceneId(draft);
        copy.title = `${scene.title || "场景"}副本`;
        draft.scenes.splice(draft.scenes.indexOf(scene) + 1, 0, copy);
      }

      if (button.dataset.sceneAction === "delete-scene" && draft.scenes.length > 2) {
        draft.scenes = draft.scenes.filter((item) => item.id !== scene.id);
        for (const item of draft.scenes) {
          for (const action of item.actions || []) {
            if (action.goto === scene.id) action.goto = draft.entrySceneId || draft.scenes[0]?.id;
          }
        }
        if (draft.entrySceneId === scene.id) draft.entrySceneId = draft.scenes[0]?.id;
        if (state.draftPlaySceneId === scene.id) state.draftPlaySceneId = draft.entrySceneId;
      }

      refreshDraftAfterStructureChange(draft);
    });
  });
}

function renderCreationBrief(draft) {
  const brief = draft.creationBrief || {};
  const world = draft.world || {};
  const personaUsage = draft.personaUsage || {};
  return `
    <article class="creation-brief-card">
      <div>
        <span>创作蓝图</span>
        <strong>${escapeHtml(brief.genre || "互动短剧")}</strong>
        <p>${escapeHtml(brief.logline || "AI 已生成可发布 H5 草稿。")}</p>
      </div>
      <dl>
        <div><dt>互动目标</dt><dd>${escapeHtml(brief.playerGoal || "完成一次轻量互动")}</dd></div>
        <div><dt>分身用途</dt><dd>${escapeHtml(personaUsage.summary || "这个角色会作为故事主角和社区形象。")}</dd></div>
        <div><dt>世界规则</dt><dd>${escapeHtml(world.rule || "点击选择推进场景")}</dd></div>
        <div><dt>素材氛围</dt><dd>${escapeHtml(world.visualMood || brief.tone || "适合手机阅读")}</dd></div>
      </dl>
    </article>
  `;
}

function aiEditScope() {
  if (state.aiEdit.scopeType === "scene") {
    return {
      type: "scene",
      ids: [state.draftPlaySceneId || state.draft?.entrySceneId || state.draft?.scenes?.[0]?.id].filter(Boolean),
    };
  }
  return { type: state.aiEdit.scopeType || "work", ids: [] };
}

function renderAiEditPanel() {
  if (!$("aiEditPanel")) return;
  $("aiEditStatusLabel").textContent = state.aiEdit.status === "proposed"
    ? "有修改提案"
    : state.aiEdit.status === "applied"
      ? "已应用"
      : state.aiEdit.status === "failed"
        ? "生成失败"
        : "未修改";
  $("aiEditInput").value = state.aiEdit.prompt || "";
  $("undoAiEditButton").disabled = !state.aiEdit.undoStack.length;
  $("aiEditScopes").querySelectorAll("[data-ai-edit-scope]").forEach((button) => {
    button.classList.toggle("active", button.dataset.aiEditScope === state.aiEdit.scopeType);
  });
  const panel = $("aiEditProposalPanel");
  const proposal = state.aiEdit.proposal;
  panel.classList.toggle("hidden", !proposal);
  if (!proposal) {
    panel.innerHTML = "";
    return;
  }
  const affected = [
    proposal.affected?.scenes?.length ? `场景 ${proposal.affected.scenes.join("、")}` : "",
    proposal.affected?.characters?.length ? `角色 ${proposal.affected.characters.join("、")}` : "",
    proposal.affected?.assets?.length ? `素材 ${proposal.affected.assets.join("、")}` : "",
  ].filter(Boolean).join(" · ") || "全作品";
  panel.innerHTML = `
    <strong>${escapeHtml(proposal.summary || "AI 修改提案已生成。")}</strong>
    <small>影响范围：${escapeHtml(affected)}</small>
    <div class="ai-edit-proposal-actions">
      <button class="primary-button" id="applyAiEditButton" type="button">应用提案</button>
      <button class="ghost-light-button" id="discardAiEditButton" type="button">放弃</button>
    </div>
  `;
  $("applyAiEditButton")?.addEventListener("click", applyAiEditProposal);
  $("discardAiEditButton")?.addEventListener("click", discardAiEditProposal);
}

function setStepAiResult(panel, message = "", tone = "info") {
  const result = panel?.querySelector("[data-step-ai-result]");
  if (!result) return;
  result.textContent = message;
  result.className = `step-ai-result ${message ? "" : "hidden"} ${tone}`.trim();
}

function renderStepAiProposalResult(panel, proposal) {
  const result = panel?.querySelector("[data-step-ai-result]");
  if (!result || !proposal) return;
  const affected = [
    proposal.affected?.scenes?.length ? `场景 ${proposal.affected.scenes.join("、")}` : "",
    proposal.affected?.characters?.length ? `角色 ${proposal.affected.characters.join("、")}` : "",
    proposal.affected?.assets?.length ? `素材 ${proposal.affected.assets.join("、")}` : "",
  ].filter(Boolean).join(" · ") || "本步内容";
  result.className = "step-ai-result success";
  result.innerHTML = `
    <strong>${escapeHtml(proposal.summary || "AI 修改提案已生成。")}</strong>
    <span>${escapeHtml(affected)}</span>
    <div>
      <button class="primary-button" data-step-ai-accept type="button">应用提案</button>
      <button class="ghost-light-button" data-step-ai-discard type="button">放弃</button>
    </div>
  `;
}

function inferPromptMood(text) {
  if (/悬疑|谜|不安|反转|紧张|调查|真相/.test(text)) return "悬疑";
  if (/治愈|温柔|睡前|陪伴|放松|低电量/.test(text)) return "治愈";
  if (/热血|挑战|刺激|快节奏|反应|倒计时/.test(text)) return "挑战";
  if (/搞笑|轻松|可爱/.test(text)) return "轻喜剧";
  return "";
}

function inferPromptConstraint(text) {
  const constraints = [];
  if (/不要太恐怖|不要恐怖|不恐怖|别太恐怖|别恐怖|不能恐怖/.test(text)) constraints.push("不走恐怖路线");
  if (/不要太幼稚|不幼稚|成熟/.test(text)) constraints.push("表达更成熟");
  if (/低龄|儿童|全年龄|适合小孩/.test(text)) constraints.push("适合低龄和全年龄阅读");
  if (/不要战斗|不战斗|少战斗|无战斗/.test(text)) constraints.push("避免战斗解决问题");
  if (/睡前/.test(text)) constraints.push("适合睡前阅读");
  if (/短|简短|压缩/.test(text)) constraints.push("节奏更紧凑");
  if (/反转/.test(text)) constraints.push("结尾保留反转");
  const lineLimit = text.match(/(?:每幕|每场|单场|每段)(?:不超过|少于|控制在)?\s*(\d{1,3})\s*(?:字|个字)/);
  if (lineLimit) constraints.push(`每场正文不超过${lineLimit[1]}字`);
  return constraints;
}

function inferTemplateFromPrompt(text) {
  if (/反应|挑战|倒计时|快节奏|限时|节拍/.test(text)) return "energy";
  if (/分支|多结局|调查|悬疑|真相|迷宫|选择|关键选择/.test(text)) return "adventure";
  if (/陪伴|治愈|睡前|温柔|低电量|放松/.test(text)) return "healing";
  return "";
}

function templateLabel(template) {
  return {
    healing: "陪伴短剧",
    adventure: "分支冒险",
    energy: "快节奏挑战",
  }[template] || "";
}

function inferIpSuggestionFromPrompt(text) {
  const suggestions = [
    { id: "mainstream_pokemon", name: "Pokémon / 宝可梦", pattern: /宝可梦|皮卡丘|伊布|pokemon|pikachu|eevee/i },
    { id: "mainstream_demon_slayer", name: "Demon Slayer / 鬼灭之刃", pattern: /鬼灭|炭治郎|祢豆子|demon slayer|kimetsu/i },
    { id: "mainstream_one_piece", name: "One Piece / 海贼王", pattern: /海贼王|路飞|索隆|one piece/i },
    { id: "mainstream_naruto", name: "Naruto / 火影忍者", pattern: /火影|鸣人|佐助|naruto/i },
  ];
  return suggestions.find((item) => item.pattern.test(text)) || null;
}

function inferPromptSetting(prompt) {
  const match = prompt.match(/(雨夜便利店|便利店|宝可梦中心|列车|学校|学院|神社|森林|小镇|房间|商店|车站|医院|海边|宇宙|山路)/);
  return match?.[1] || "一个有明确视觉记忆点的地点";
}

function inferPromptStoryObject(prompt) {
  if (/猫/.test(prompt)) return "会预言的猫";
  if (/伊布/.test(prompt)) return "走丢的伊布";
  if (/鬼|鬼灭/.test(prompt)) return "异常任务线索";
  if (/信|邮件|邮差/.test(prompt)) return "一封必须送达的信";
  return "一个会改变故事走向的异常线索";
}

function inferPromptSupportRole(prompt) {
  if (/猫/.test(prompt)) return "店员或陌生顾客";
  if (/宝可梦|皮卡丘|伊布/.test(prompt)) return "值班护士或训练家";
  if (/鬼|鬼灭/.test(prompt)) return "引导者或任务委托人";
  return "一个能提供线索的关键角色";
}

function parseSimpleChineseNumber(value = "") {
  const digits = {
    一: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };
  if (/^\d+$/.test(value)) return Number(value);
  if (value === "十") return 10;
  const tenParts = value.split("十");
  if (tenParts.length === 2) {
    const tens = tenParts[0] ? digits[tenParts[0]] || 0 : 1;
    const ones = tenParts[1] ? digits[tenParts[1]] || 0 : 0;
    return tens * 10 + ones;
  }
  return digits[value] || 0;
}

function extractPromptCount(prompt, unitPattern) {
  const numberPattern = "(\\d{1,2}|[一二两三四五六七八九十]{1,3})";
  const beforeUnit = new RegExp(`${numberPattern}\\s*(?:个|条)?\\s*(?:${unitPattern})`);
  const afterUnit = new RegExp(`(?:${unitPattern})\\s*(?:到|加到|扩到|扩展到|做成|生成|设为|设置为)?\\s*${numberPattern}\\s*(?:个|条)?`);
  const match = prompt.match(beforeUnit) || prompt.match(afterUnit);
  if (!match) return 0;
  const raw = match[1] || match[2];
  return parseSimpleChineseNumber(raw);
}

function promptHasBranchRequirement(prompt) {
  return /分支|选择|选项|结局|多结局|路线/.test(prompt);
}

function promptAuditItems({ base, fullText, setting, goal, supportRole, sceneCount, choiceCount, endingCount, constraints, ipSuggestion, suggestedTemplate }) {
  const originalHas = (pattern) => pattern.test(base);
  return [
    {
      label: "地点",
      status: originalHas(/雨夜便利店|便利店|宝可梦中心|列车|学校|学院|神社|森林|小镇|房间|商店|车站|医院|海边|宇宙|山路/) ? "已识别" : "AI补充",
      detail: setting,
    },
    {
      label: "玩家目标",
      status: originalHas(/玩家目标|找|救|逃|调查|守护|寻找|解开|完成|查清|发现/) ? "已识别" : "AI补充",
      detail: goal,
    },
    {
      label: "关键角色",
      status: originalHas(/角色|主角|伙伴|店员|护士|训练家|猫|伊布|皮卡丘|炭治郎|祢豆子/) ? "已识别" : "AI补充",
      detail: supportRole,
    },
    {
      label: "结构",
      status: originalHas(/\d{1,2}\s*(?:个)?(?:场景|场|幕)|[一二两三四五六七八九十]{1,3}\s*(?:个)?(?:场景|场|幕)/) ? "用户指定" : "AI补充",
      detail: `${sceneCount}场 · ${choiceCount}个关键选择 · ${endingCount}个结局`,
    },
    {
      label: "素材要求",
      status: /背景|立绘|素材|图片|情绪标签|对白|跳转/.test(fullText) ? "已识别" : "AI补充",
      detail: "每场背景、对白、选项跳转、情绪标签",
    },
    {
      label: "限制条件",
      status: constraints.length ? "已识别" : "建议补充",
      detail: constraints.length ? constraints.join("、") : "未写限制，先按安全默认生成",
    },
    {
      label: "归属/IP",
      status: ipSuggestion ? "建议二创" : "待确认",
      detail: ipSuggestion ? `下一步建议选择 ${ipSuggestion.name}` : "下一步确认原创或二创归属",
    },
    {
      label: "玩法模板",
      status: suggestedTemplate ? "建议切换" : "保持当前",
      detail: suggestedTemplate ? templateLabel(suggestedTemplate) : templateLabel(state.selectedTemplate),
    },
  ];
}

function rewritePromptWithInstruction(currentPrompt, instruction) {
  const base = (currentPrompt || "").trim();
  const request = instruction.trim();
  const fullText = `${base} ${request}`;
  const mood = inferPromptMood(fullText);
  const constraints = inferPromptConstraint(fullText);
  const hasPlayerGoal = /玩家目标|找|救|逃|调查|守护|选择|寻找|解开|完成|查清|发现/.test(base);
  const core = base || "一个主角进入陌生地点，遇到需要选择的事件";
  const setting = inferPromptSetting(core);
  const storyObject = inferPromptStoryObject(core);
  const supportRole = inferPromptSupportRole(core);
  const goal = hasPlayerGoal ? "玩家目标保留原事件并推进真相" : `玩家目标是查清${storyObject}的来源并决定是否相信它`;
  const moodPrefix = mood ? `${mood}向` : "完整文字游戏向";
  const constraintText = constraints.length ? `；限制：${constraints.join("，")}` : "";
  const countSource = `${core} ${request}`;
  const requestedSceneCount = extractPromptCount(countSource, "场景|场|幕");
  const requestedChoiceCount = extractPromptCount(countSource, "关键选择|选择|选项|分支");
  const requestedEndingCount = extractPromptCount(countSource, "结局|结尾");
  const sceneCount = requestedSceneCount || 4;
  const choiceCount = requestedChoiceCount || Math.max(2, Math.ceil(sceneCount / 4));
  const endingCount = requestedEndingCount || 2;
  const branchText = `设计${sceneCount}场、${choiceCount}个关键选择、${endingCount}个结局`;
  const rewritten = `${moodPrefix}文字游戏：主角在${setting}经历“${core}”；${goal}；加入${supportRole}；${branchText}；每场要有背景、对白、选项跳转和情绪标签；结尾有轻微反转${constraintText}。`;
  const maxLength = Number($("promptInput")?.maxLength) || 220;
  const trimmed = rewritten.length <= maxLength ? rewritten : `${rewritten.slice(0, maxLength - 1)}…`;
  const suggestedTemplate = inferTemplateFromPrompt(fullText);
  const ipSuggestion = inferIpSuggestionFromPrompt(fullText);
  const auditItems = promptAuditItems({
    base,
    fullText,
    setting,
    goal,
    supportRole,
    sceneCount,
    choiceCount,
    endingCount,
    constraints,
    ipSuggestion,
    suggestedTemplate,
  });
  return {
    before: base,
    after: trimmed,
    suggestedTemplate,
    ipSuggestion,
    auditItems,
    summary: [
      mood ? `强化${mood}氛围` : "补足文字游戏方向",
      hasPlayerGoal ? "保留原始目标" : "补入玩家目标",
      `补入地点、关键角色、场景数、分支和结局`,
      constraints.length ? `加入限制：${constraints.join("、")}` : "补入背景、对白、选项和情绪标签要求",
    ].join("；"),
  };
}

function renderPromptRewriteProposal(panel, proposal) {
  const result = panel?.querySelector("[data-step-ai-result]");
  if (!result || !proposal) return;
  $("promptPolishModal")?.classList.add("has-result");
  const auditItems = (proposal.auditItems || []).map((item) => `
    <li title="${escapeHtml(`${item.label}：${item.detail}`)}">
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(item.status)}</strong>
    </li>
  `).join("");
  result.className = "step-ai-result success prompt-rewrite-proposal";
  result.innerHTML = `
    <strong>AI 已重写故事提示词</strong>
    <span>${escapeHtml(proposal.summary)}</span>
    <section class="prompt-audit-panel" aria-label="提示词体检">
      <ul>${auditItems}</ul>
    </section>
    <dl>
      <div><dt>修改前</dt><dd>${escapeHtml(proposal.before || "空")}</dd></div>
      <div><dt>修改后</dt><dd>${escapeHtml(proposal.after)}</dd></div>
    </dl>
    <div>
      <button class="primary-button" data-step-ai-accept type="button">应用提案</button>
      <button class="ghost-light-button" data-step-ai-discard type="button">放弃</button>
    </div>
  `;
}

function openPromptPolishModal() {
  const modal = $("promptPolishModal");
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.classList.remove("has-result");
  const input = modal.querySelector("[data-step-ai-input]");
  requestAnimationFrame(() => input?.focus());
}

function openPromptPolishResult() {
  const modal = $("promptPolishModal");
  const panel = modal?.querySelector("[data-step-ai-panel='prompt']");
  if (!modal || !panel) return;
  openPromptPolishModal();
  if (!$("promptInput").value.trim()) {
    setStepAiResult(panel, "先写一句故事创意，再让 AI 润色。", "warning");
    return;
  }
  applyPreDraftStepAiEdit("prompt", "", panel);
}

function closePromptPolishModal() {
  $("promptPolishModal")?.classList.add("hidden");
}

function openPersonaPickerModal() {
  state.personaPickerSelectedIds = new Set();
  $("personaPickerModal")?.classList.remove("hidden");
  renderCreateControls();
}

function closePersonaPickerModal() {
  $("personaPickerModal")?.classList.add("hidden");
  state.personaPickerSelectedIds = new Set();
}

function rewriteCustomPersonaTagline() {
  const name = state.customPersonaName.trim() || "原创主角";
  const base = state.customPersonaTagline.trim();
  const prompt = $("promptInput")?.value || "";
  const ipName = getIpEntry(state.selectedIpId)?.name || "";
  const context = `${base} ${prompt} ${ipName}`;
  const role = state.selectedOrigin === "fanwork" && ipName ? `在${ipName}世界中` : "在原创故事中";
  const traitPool = [];
  if (/冷静|理性|引导/.test(context)) traitPool.push("冷静判断", "像引导者一样说话", "遇事先观察");
  if (/温柔|陪伴|亲情|守护/.test(context)) traitPool.push("温柔护短", "重视同伴", "把亲情藏在行动里");
  if (/悬疑|调查|真相|线索|任务/.test(context)) traitPool.push("擅长追踪线索", "对异常任务敏感", "会追问真相");
  if (/修行|战斗|冒险|鬼灭|Demon Slayer/i.test(context)) traitPool.push("适合修行桥段", "不靠蛮力解题", "能承受冒险压力");
  if (/活泼|轻松|搞笑|可爱/.test(context)) traitPool.push("口吻轻快", "会缓和紧张气氛");
  const traits = Array.from(new Set(traitPool.length ? traitPool : ["有明确目标", "有独特口吻", "能推动选择"]));
  const variants = [
    `${name}${role}作为原创主角，${traits[0]}，${traits[1] || "能推动选择"}。`,
    `${name}是${role}登场的原创角色，${traits[1] || traits[0]}，${traits[2] || "遇事有自己的判断"}。`,
    `${name}${role}承担玩家视角，${traits[2] || traits[0]}，对白克制但有记忆点。`,
    `${name}负责推进主线选择，${traits[0]}，${traits[3] || traits[1] || "关键时刻会保护同伴"}。`,
  ];
  const start = state.customPersonaPolishCount % variants.length;
  const picked = variants.slice(start).concat(variants.slice(0, start)).find((item) => item !== base) || variants[start];
  return picked.slice(0, 48);
}

function extractPersonaName(instruction) {
  const match = instruction.match(/(?:主角|分身|角色|我)(?:叫|名叫|改成|设为|设置为)?[「“"]?([\u4e00-\u9fa5A-Za-z0-9]{2,12})/);
  return match?.[1]?.replace(/[」”"，。,.].*$/, "") || "";
}

function ownershipSettingsSnapshot() {
  return {
    selectedOrigin: state.selectedOrigin,
    selectedIpId: state.selectedIpId,
    selectedPersona: state.selectedPersona,
    useCustomPersona: state.useCustomPersona,
    customPersonaName: state.customPersonaName,
    customPersonaTagline: state.customPersonaTagline,
    createIpSearchQuery: state.createIpSearchQuery,
  };
}

function nextOwnershipSettingsFromInstruction(settings, instruction) {
  const next = { ...settings };
  if (/二创|同人|fanwork|ip/i.test(instruction)) {
    next.selectedOrigin = "fanwork";
    next.selectedIpId = "";
    next.selectedPersona = "";
    next.useCustomPersona = false;
    next.createIpSearchQuery = "";
  } else if (/原创|original/i.test(instruction)) {
    next.selectedOrigin = "original";
    next.selectedIpId = getDefaultIpForOrigin("original")?.id || "";
    next.selectedPersona = getPersonasForIp(next.selectedIpId)[0]?.id || "";
    next.useCustomPersona = false;
    next.createIpSearchQuery = "";
  }

  const personaName = extractPersonaName(instruction);
  if (personaName) {
    next.useCustomPersona = true;
    next.selectedPersona = "";
    next.customPersonaName = personaName;
  }
  if (/冷静|引导|向导/.test(instruction)) {
    next.customPersonaTagline = "冷静的故事引导者";
    next.useCustomPersona = true;
  } else if (/活泼|元气|开朗/.test(instruction)) {
    next.customPersonaTagline = "活泼的同行伙伴";
    next.useCustomPersona = true;
  } else if (/治愈|温柔|睡前/.test(instruction)) {
    next.customPersonaTagline = "温柔的陪伴型主角";
    next.useCustomPersona = true;
  }
  if (next.useCustomPersona && !next.customPersonaName.trim()) {
    const currentPersona = getPersona(next.selectedPersona);
    next.customPersonaName = currentPersona?.name || "原创分身";
  }
  return next;
}

function applyOwnershipSettings(settings) {
  state.selectedOrigin = settings.selectedOrigin;
  state.selectedIpId = settings.selectedIpId;
  state.selectedPersona = settings.selectedPersona;
  state.useCustomPersona = settings.useCustomPersona;
  state.customPersonaName = settings.customPersonaName;
  state.customPersonaTagline = settings.customPersonaTagline;
  state.createIpSearchQuery = settings.createIpSearchQuery;
}

function applyOwnershipSettingsToDraft(draft, settings) {
  const nextDraft = structuredClone(draft);
  const ipEntry = getIpEntry(settings.selectedIpId);
  const preset = TEMPLATE_PRESETS[state.selectedTemplate] || TEMPLATE_PRESETS.healing;
  const customName = settings.customPersonaName.trim();
  const customTagline = settings.customPersonaTagline.trim();
  const persona = settings.useCustomPersona && customName
    ? {
      id: `custom_${customName.slice(0, 12)}`,
      name: customName,
      avatar: customName.slice(0, 1) || "原",
      roleType: "creator_original",
      tagline: customTagline || "用户原创社区分身",
    }
    : getPersona(settings.selectedPersona) || nextDraft.persona || getPersonasForIp(settings.selectedIpId)[0] || getPersona("rain_gugu");
  const zone = getZone(preset.zoneId);
  nextDraft.contentOrigin = settings.selectedOrigin;
  nextDraft.ipId = ipEntry?.id || null;
  nextDraft.ipName = settings.selectedOrigin === "fanwork" ? ipEntry?.name || null : null;
  nextDraft.zoneId = zone.id;
  nextDraft.zoneName = zone.name;
  nextDraft.persona = {
    id: persona.id,
    name: persona.name,
    avatar: persona.avatar,
    roleType: persona.roleType,
    tagline: persona.tagline,
    cloneOf: settings.useCustomPersona ? null : nextDraft.persona?.cloneOf || null,
  };
  nextDraft.personaUsage = {
    role: "community_avatar",
    label: "社区分身 / 故事主角",
    summary: `「${persona.name}」会作为这个故事的主角，也可以成为你在社区、好友动态和设备里的当前形象。`,
    communityUse: "评论、好友动态、共创邀请和个人展示会优先使用这个分身形象。",
    deviceUse: "当设备选择这个故事时，你在社区内会以这个分身出现和活动。",
    originScope: nextDraft.contentOrigin === "fanwork" ? `分身归属所选 IP：${nextDraft.ipName || "未填写 IP"}。` : "分身归属原创企划，可随作品进入社区身份体系。",
  };
  nextDraft.cover = nextDraft.cover || {};
  nextDraft.cover.character = persona.avatar;
  nextDraft.tags = Array.from(new Set([
    contentOriginLabel(nextDraft.contentOrigin),
    ...(ipEntry?.name ? [ipEntry.name] : []),
    zone.name,
    ...(nextDraft.tags || []),
  ]));
  nextDraft.updatedAt = Date.now();
  nextDraft.qualityChecks = createDraftQualityChecks(nextDraft);
  return nextDraft;
}

function createOwnershipEditProposal(instruction) {
  const baseDraft = applyDraftEdits(state.draft);
  const nextSettings = nextOwnershipSettingsFromInstruction(ownershipSettingsSnapshot(), instruction);
  const previewDraft = applyOwnershipSettingsToDraft(baseDraft, nextSettings);
  const affectedPersona = previewDraft.persona?.name || "主角分身";
  const affectedOrigin = previewDraft.contentOrigin === "fanwork"
    ? previewDraft.ipName || "二创 IP"
    : getIpEntry(previewDraft.ipId)?.name || "原创企划";
  return {
    id: `ai_ownership_${Date.now()}`,
    draftId: baseDraft.id || null,
    status: "proposed",
    instruction,
    scope: { type: "identity", ids: [previewDraft.persona?.id, previewDraft.ipId].filter(Boolean) },
    summary: `已生成归属和主角修改提案：${contentOriginLabel(previewDraft.contentOrigin)} · ${affectedOrigin} · ${affectedPersona}。`,
    affected: {
      scenes: [],
      characters: [affectedPersona],
      assets: ["封面角色", "发布归属"],
    },
    previewDraft,
    ownershipSettings: nextSettings,
    qualityChecks: createDraftQualityChecks(previewDraft),
    createdAt: Date.now(),
  };
}

function applyPreDraftStepAiEdit(stepId, instruction, panel) {
  if (stepId === "prompt") {
    const current = $("promptInput").value.trim();
    const proposal = rewritePromptWithInstruction(current, instruction);
    state.promptEdit.proposal = proposal;
    renderPromptRewriteProposal(panel, proposal);
    return;
  }

  if (stepId !== "settings") return;
  applyOwnershipSettings(nextOwnershipSettingsFromInstruction(ownershipSettingsSnapshot(), instruction));
  renderCreateControls();
  updateCreateReadiness();
  setStepAiResult(panel, "已调整本步设置。还可以直接选择归属、IP 和主角。", "success");
}

async function requestStepAiEdit(stepId, button) {
  const panel = button.closest("[data-step-ai-panel]");
  const input = panel?.querySelector("[data-step-ai-input]");
  const instruction = input?.value.trim() || "";
  if (!instruction && stepId !== "prompt") {
    setStepAiResult(panel, "先写一句想让 AI 怎么改。", "warning");
    input?.focus();
    return;
  }
  if (!state.draft || stepId === "prompt") {
    applyPreDraftStepAiEdit(stepId, instruction, panel);
    return;
  }

  if (stepId === "settings") {
    setButtonBusy(button, true, "生成中");
    try {
      const proposal = createOwnershipEditProposal(instruction);
      state.aiEdit.proposal = proposal;
      state.aiEdit.status = "proposed";
      state.aiEdit.scopeType = "character";
      state.aiEdit.prompt = instruction;
      renderAiEditPanel();
      renderStepAiProposalResult(panel, proposal);
      setCreateProgress("AI 已生成归属和主角修改提案，确认后才会应用。", "success");
    } finally {
      setButtonBusy(button, false);
    }
    return;
  }

  const scopeType = CREATE_STEP_AI_SCOPES[stepId] || "work";
  const targetSceneId = stepId === "script"
    ? state.selectedScriptSceneId
    : state.draftPlaySceneId || state.draft?.entrySceneId || state.draft?.scenes?.[0]?.id;
  const scope = scopeType === "scene"
    ? {
      type: "scene",
      ids: [targetSceneId].filter(Boolean),
    }
    : { type: scopeType, ids: [] };
  state.aiEdit.scopeType = scope.type;
  state.aiEdit.prompt = instruction;
  if ($("aiEditInput")) $("aiEditInput").value = instruction;
  await requestAiEditProposal({ instruction, scope, button, resultPanel: panel });
}

async function requestAiEditProposal({ instruction: instructionOverride, scope: scopeOverride, button: buttonOverride, resultPanel } = {}) {
  if (!state.draft || state.aiEdit.status === "requesting") return;
  const instruction = instructionOverride || $("aiEditInput").value.trim();
  if (!instruction) {
    if (resultPanel) {
      setStepAiResult(resultPanel, "先写一句想让 AI 怎么改。", "warning");
      resultPanel.querySelector("[data-step-ai-input]")?.focus();
    } else {
      showToast("先写一句想让 AI 怎么改。");
      $("aiEditInput").focus();
    }
    return;
  }
  const button = buttonOverride || $("askAiEditButton");
  const baseDraft = applyDraftEdits(state.draft);
  state.aiEdit.status = "requesting";
  state.aiEdit.prompt = instruction;
  if (resultPanel) setStepAiResult(resultPanel, "AI 正在生成本步修改提案。", "info");
  setButtonBusy(button, true, "生成中");
  try {
    const scope = scopeOverride || aiEditScope();
    const proposalResponse = flashApi.createAiEditProposal
      ? await flashApi.createAiEditProposal({
        draft: baseDraft,
        instruction,
        scope,
        styleLock: {
          visualMood: baseDraft.world?.visualMood || baseDraft.creationBrief?.tone || "",
          preserve: ["contentOrigin", "ipId", "persona.id"],
        },
      })
      : { item: createAiEditProposalPreview(baseDraft, instruction, scope) };
    const proposal = proposalResponse.item || proposalResponse;
    proposal.previewDraft = proposal.previewDraft || baseDraft;
    proposal.qualityChecks = createDraftQualityChecks(proposal.previewDraft);
    state.aiEdit.proposal = proposal;
    state.aiEdit.status = "proposed";
    renderAiEditPanel();
    renderStepAiProposalResult(resultPanel, proposal);
    setCreateProgress("AI 已生成修改提案，确认后才会应用到草稿。", "success");
  } catch (error) {
    state.aiEdit.status = "failed";
    if (resultPanel) setStepAiResult(resultPanel, "AI 修改提案生成失败，请稍后重试。", "error");
    setCreateProgress("AI 修改提案生成失败，请稍后重试。", "error");
  } finally {
    setButtonBusy(button, false);
    renderAiEditPanel();
  }
}

function applyAiEditProposal() {
  const proposal = state.aiEdit.proposal;
  if (!proposal?.previewDraft) return;
  state.aiEdit.undoStack.push(structuredClone(state.draft));
  if (proposal.ownershipSettings) {
    applyOwnershipSettings(proposal.ownershipSettings);
  }
  state.draft = {
    ...proposal.previewDraft,
    aiEditSummary: proposal.summary,
    qualityChecks: createDraftQualityChecks(proposal.previewDraft),
  };
  state.aiEdit.status = "applied";
  state.aiEdit.proposal = null;
  if (proposal.ownershipSettings) renderCreateControls();
  renderDraft(state.draft);
  setCreateProgress("AI 修改已应用，发布前检查已重新计算。", "success");
}

function discardAiEditProposal() {
  state.aiEdit.status = "idle";
  state.aiEdit.proposal = null;
  renderAiEditPanel();
}

function undoAiEdit() {
  const previous = state.aiEdit.undoStack.pop();
  if (!previous) return;
  state.draft = previous;
  state.aiEdit.status = "idle";
  state.aiEdit.proposal = null;
  renderDraft(state.draft);
  setCreateProgress("已撤销上次 AI 修改。", "info");
}

function applyDraftEdits(draft) {
  const title = $("draftTitleInput").value.trim();
  const tags = $("draftTagsInput").value
    .split(/[、,/，|]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  const options = createOptionsFromForm();
  const ipEntry = getIpEntry(options.ipId);
  const zone = getZone(options.zoneId);
  const persona = options.customPersona || getPersona(options.personaId);

  draft.title = title;
  if (draft.creationBrief) draft.creationBrief.title = draft.title;
  if ($("draftScriptText")?.dataset.userEdited) {
    draft.stageScriptText = $("draftScriptText").value.trim();
  } else if (!draft.stageScriptText) {
    draft.stageScriptText = makeStageScriptText(draft);
  }
  draft.contentOrigin = options.originType;
  draft.ipId = ipEntry?.id || null;
  draft.ipName = options.originType === "fanwork" ? ipEntry?.name || null : null;
  draft.rightsAcknowledgedAt = options.originType === "fanwork" ? options.rightsAcknowledgedAt : null;
  draft.zoneId = zone.id;
  draft.zoneName = zone.name;
  draft.persona = {
    id: persona.id,
    name: persona.name,
    avatar: persona.avatar,
    roleType: persona.roleType,
    tagline: persona.tagline,
    cloneOf: options.customPersona ? null : draft.persona?.cloneOf || null,
  };
  draft.personaUsage = {
    role: "community_avatar",
    label: "社区分身 / 故事主角",
    summary: `「${persona.name}」会作为这个故事的主角，也可以成为你在社区、好友动态和设备里的当前形象。`,
    communityUse: "评论、好友动态、共创邀请和个人展示会优先使用这个分身形象。",
    deviceUse: "当设备选择这个故事时，你在社区内会以这个分身出现和活动。",
    originScope: draft.contentOrigin === "fanwork" ? `分身归属所选 IP：${draft.ipName || "未填写 IP"}。` : "分身归属原创企划，可随作品进入社区身份体系。",
  };
  draft.cover = draft.cover || {};
  draft.cover.character = persona.avatar;
  draft.sourceDraftId = draft.sourceDraftId || draft.id || `draft_${Date.now()}`;
  draft.publishFingerprint = workFingerprint(draft);
  const fallbackTags = storyTagList(draft, 6);
  draft.tags = Array.from(new Set(tags.length ? tags : fallbackTags));
  draft.updatedAt = Date.now();
  draft.qualityChecks = createDraftQualityChecks(draft);
  return draft;
}

function renderTemplateControls() {
  document.querySelectorAll(".template").forEach((button) => {
    button.classList.toggle("active", button.dataset.template === state.selectedTemplate);
  });
  const hint = $("templateHint");
  if (hint) hint.textContent = TEMPLATE_HINTS[state.selectedTemplate] || TEMPLATE_HINTS.healing;
}

function applyPromptExample(exampleType) {
  const example = PROMPT_EXAMPLES[exampleType] || PROMPT_EXAMPLES.original;
  $("promptInput").value = example.prompt;
  state.selectedTemplate = example.template;
  state.selectedOrigin = example.origin;
  state.selectedIpId = example.ipId;
  state.selectedPersona = example.personaId;
      state.useCustomPersona = false;
      state.customPersonaName = "";
      state.customPersonaTagline = "";
      state.customPersonaPolishCount = 0;
      state.fanworkRightsAccepted = false;
  state.createIpSearchQuery = "";
  renderTemplateControls();
  renderCreateControls();
  showCreateError();
  updateCreateReadiness();
  showToast(example.toast);
  $("promptInput").focus();
}

function renderCreateControls() {
  renderTemplateControls();
  ensureCreateSelection();
  const createIpQuery = normalizeCreateSearchText(state.createIpSearchQuery);
  const compactCreateIpQuery = createIpQuery.replace(/\s+/g, "");
  updateCreateSettingsSummary();

  $("originSelector").innerHTML = Object.entries(CONTENT_ORIGIN_LABELS).map(([id, label]) => `
    <button class="${state.selectedOrigin === id ? "active" : ""}" data-origin="${id}" data-testid="create-origin-${id}" type="button">${label}</button>
  `).join("");

  const ipEntries = getIpEntriesForOrigin(state.selectedOrigin);
  const compactOwnershipSelection = state.selectedOrigin === "fanwork" && Boolean(state.selectedIpId && !state.createIpSearchQuery);
  const recentCollectedIpIds = new Set(state.animeCollectionResult?.importedIpIds || []);
  const recentCollectedIpEntries = state.selectedOrigin === "fanwork" && !createIpQuery
    ? ipEntries.filter((entry) => recentCollectedIpIds.has(entry.id)).slice(0, 3)
    : [];
  const visibleIpEntries = createIpQuery
    ? ipEntries.filter((entry) => {
      const personas = getPersonasForIp(entry.id);
      const haystack = createIpSearchHaystack(entry, personas);
      const compactHaystack = haystack.replace(/\s+/g, "");
      return haystack.includes(createIpQuery) || compactHaystack.includes(compactCreateIpQuery);
    })
    : state.selectedIpId
      ? ipEntries.filter((entry) => entry.id === state.selectedIpId)
      : state.selectedOrigin === "fanwork" ? recentCollectedIpEntries : ipEntries;
  $("ipHeadingTitle").textContent = state.selectedOrigin === "fanwork" ? "二创 IP" : "原创企划";
  $("ipHeadingHint").textContent = state.selectedIpId
    ? "当前已选，可搜索更换"
    : state.selectedOrigin === "fanwork" ? "必须从 IP 池选择" : "选择作品归属企划";
  $("requestIpButton").textContent = state.selectedOrigin === "fanwork" ? "申请添加 IP" : "创建原创企划";
  $("createAdvanced").classList.toggle("selection-compact", compactOwnershipSelection);
  $("createAdvanced").classList.toggle("fanwork-origin", state.selectedOrigin === "fanwork");
  $("createAdvanced").classList.toggle("draft-character-only", Boolean(state.draft));
  document.querySelector('[data-create-step="settings"]')?.classList.toggle("draft-character-only", Boolean(state.draft));
  $("createRightsNotice").classList.toggle("hidden", state.selectedOrigin !== "fanwork");
  $("createRightsAccepted").checked = state.fanworkRightsAccepted;
  $("createRightsNoticeText").textContent = state.selectedOrigin === "fanwork"
    ? getIpEntry(state.selectedIpId)?.rightsNotice || "二创仅用于归属和审核演示，不代表获得官方授权；发布、上架或硬件分发前需要权利声明。"
    : "";
  $("createIpSearchInput").value = state.createIpSearchQuery;
  $("createIpSearchInput").placeholder = state.selectedOrigin === "fanwork" ? "输入动漫、角色或关键词" : "输入企划、角色或关键词";
  $("ipSelector").innerHTML = visibleIpEntries.length ? visibleIpEntries.map((entry) => `
    <button class="ip-option ${state.selectedIpId === entry.id ? "active" : ""}" data-ip="${entry.id}" data-testid="create-ip-option-${entry.id}" type="button">
      <strong>${entry.name}</strong>
      <small>${entry.description}</small>
      <span>${entry.zoneStatus === "open" ? "已开专区" : "未开专区"}</span>
    </button>
  `).join("") : `<div class="empty-state compact-empty create-ip-empty">${
    state.selectedOrigin === "fanwork" && !state.createIpSearchQuery
      ? "搜索 IP、角色或关键词后选择归属。"
      : "没有匹配的 IP，可以换个关键词或申请添加。"
  }</div>`;

  const personas = state.selectedIpId ? getPersonasForIp(state.selectedIpId) : [];
  const customPersonaLabel = state.customPersonaName.trim() || "原创角色";
  const selectedIpPersona = !state.useCustomPersona && state.selectedPersona ? getPersona(state.selectedPersona) : null;
  const personaPickerHint = personas.length
    ? `${personas.length} 个可选原著角色`
    : "当前 IP 暂无可用角色";
  const isEditingCast = Boolean(state.draft);
  const personaHeading = document.querySelector('[data-create-step="settings"] .section-heading.compact-heading:not(.ownership-config):not(.ip-config) h3');
  const personaHeadingHint = document.querySelector('[data-create-step="settings"] .section-heading.compact-heading:not(.ownership-config):not(.ip-config) span');
  if (personaHeading) personaHeading.textContent = isEditingCast ? "添加故事角色" : "主角设置";
  if (personaHeadingHint) personaHeadingHint.textContent = isEditingCast
    ? "创建原创角色，或从当前 IP 选择原著角色加入出场名单"
    : "创建原创角色，或选取当前 IP 中的角色作为主角";
  const customPersonaButton = `<button class="persona-option custom-persona-option ${state.useCustomPersona ? "active" : ""}" data-persona-mode="custom" type="button">
      <span>${escapeHtml(customPersonaLabel.slice(0, 1) || "原")}</span>
      <strong>创建原创角色</strong>
      <small>${state.customPersonaTagline.trim() || (isEditingCast ? "自己命名新角色，添加到故事出场角色" : "自己命名故事主角，可作为社区形象")}</small>
    </button>`;
  const ipPersonaButton = `<button class="persona-option ip-persona-picker-option ${!isEditingCast && !state.useCustomPersona && state.selectedPersona ? "active" : ""}" data-persona-picker-open type="button" ${personas.length ? "" : "disabled"}>
      <span>${escapeHtml(isEditingCast ? "IP" : selectedIpPersona?.avatar || "IP")}</span>
      <strong>${escapeHtml(isEditingCast ? "选择原著角色" : selectedIpPersona?.name || "选择原著角色")}</strong>
      <small>${escapeHtml(isEditingCast ? `${personaPickerHint} · 点击加入故事出场角色` : selectedIpPersona ? `${personaPickerHint} · 点击选取 IP 角色 · 当前为 ${selectedIpPersona.tagline}` : personas.length ? `${personaPickerHint} · 从当前 IP 选择主角` : personaPickerHint)}</small>
    </button>`;
  $("personaSelector").innerHTML = `${customPersonaButton}${ipPersonaButton}`;
  $("personaPickerHint").textContent = state.selectedIpId
    ? `从「${getIpEntry(state.selectedIpId)?.name || "当前 IP"}」中${isEditingCast ? "多选故事出场角色。" : "选择故事主角。"}`
    : "先选择 IP，下面会出现可用角色。";
  $("personaPickerList").innerHTML = personas.length
    ? personas.map((persona) => {
      const isSelectedForCast = isEditingCast && state.personaPickerSelectedIds.has(persona.id);
      return `
      <button class="persona-option ${isSelectedForCast || (!isEditingCast && !state.useCustomPersona && state.selectedPersona === persona.id) ? "active" : ""}" data-persona="${persona.id}" type="button" aria-pressed="${isSelectedForCast ? "true" : "false"}">
        <span>${persona.avatar}</span>
        <strong>${persona.name}</strong>
        <small>${persona.tagline}</small>
        ${isEditingCast ? `<em>${isSelectedForCast ? "已选" : "可选"}</em>` : ""}
      </button>
    `;
    }).join("")
    : `<div class="empty-state compact-empty">这个 IP 暂无可用角色，请申请补充角色或创建原创角色。</div>`;
  $("personaPickerActions")?.classList.toggle("hidden", !isEditingCast);
  $("addSelectedPersonasButton").textContent = state.personaPickerSelectedIds.size
    ? `添加 ${state.personaPickerSelectedIds.size} 个角色`
    : "添加选中角色";
  $("addSelectedPersonasButton").disabled = !state.personaPickerSelectedIds.size;
  $("customPersonaPanel").classList.toggle("hidden", !state.useCustomPersona);
  $("customPersonaNameInput").value = state.customPersonaName;
  $("customPersonaTaglineInput").value = state.customPersonaTagline;
  $("addCustomCharacterButton")?.classList.toggle("hidden", !isEditingCast);

  document.querySelectorAll("[data-origin]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedOrigin = button.dataset.origin;
      state.selectedIpId = state.selectedOrigin === "fanwork" ? "" : getDefaultIpForOrigin("original")?.id || "";
      state.selectedPersona = "";
      state.useCustomPersona = false;
      state.fanworkRightsAccepted = false;
      state.createIpSearchQuery = "";
      showCreateError();
      renderCreateControls();
      if (state.draft) renderDraft(applyDraftEdits(state.draft));
      updateCreateReadiness();
    });
  });

  if (!$("createIpSearchInput").dataset.bound) {
    $("createIpSearchInput").dataset.bound = "true";
    $("createIpSearchInput").addEventListener("input", (event) => {
      state.createIpSearchQuery = event.target.value;
      renderCreateControls();
    });
  }

  if (!$("createRightsAccepted").dataset.bound) {
    $("createRightsAccepted").dataset.bound = "true";
    $("createRightsAccepted").addEventListener("change", (event) => {
      state.fanworkRightsAccepted = event.target.checked;
      if (state.draft) renderDraft(applyDraftEdits(state.draft));
      updateCreateReadiness();
    });
  }

  document.querySelectorAll("[data-ip]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedIpId = button.dataset.ip;
      state.selectedPersona = "";
      state.useCustomPersona = false;
      state.customPersonaPolishCount = 0;
      state.fanworkRightsAccepted = false;
      showCreateError();
      renderCreateControls();
      if (state.draft) renderDraft(applyDraftEdits(state.draft));
      updateCreateReadiness();
    });
  });

  document.querySelectorAll("[data-persona-mode='custom']").forEach((button) => {
    button.addEventListener("click", () => {
      state.useCustomPersona = true;
      state.customPersonaPolishCount = 0;
      closePersonaPickerModal();
      showCreateError();
      renderCreateControls();
      $("customPersonaNameInput").focus();
      updateCreateReadiness();
    });
  });

  document.querySelectorAll("[data-persona]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.draft) {
        if (state.personaPickerSelectedIds.has(button.dataset.persona)) {
          state.personaPickerSelectedIds.delete(button.dataset.persona);
        } else {
          state.personaPickerSelectedIds.add(button.dataset.persona);
        }
        renderCreateControls();
        return;
      }
      state.selectedPersona = button.dataset.persona;
      state.useCustomPersona = false;
      state.customPersonaPolishCount = 0;
      closePersonaPickerModal();
      showCreateError();
      renderCreateControls();
      if (state.draft) renderDraft(applyDraftEdits(state.draft));
      updateCreateReadiness();
    });
  });

  $("addSelectedPersonasButton").onclick = () => {
    if (!state.draft || !state.personaPickerSelectedIds.size) return;
    let addedCount = 0;
    for (const personaId of state.personaPickerSelectedIds) {
      const persona = getPersona(personaId);
      if (persona && addDraftCharacter(makeDraftCharacterFromPersona(persona))) addedCount += 1;
    }
    closePersonaPickerModal();
    renderCreateControls();
    if (addedCount) showToast(`已添加 ${addedCount} 个原著角色。`);
  };

  $("addCustomCharacterButton").onclick = () => {
    const name = state.customPersonaName.trim();
    if (!state.draft || !name) {
      $("customPersonaAiHint").textContent = "先写原创角色名，再添加到出场角色。";
      $("customPersonaAiHint").classList.remove("hidden");
      return;
    }
    const character = {
      id: `custom_${name}_${Date.now()}`,
      name,
      avatar: name.slice(0, 1) || "原",
      role: "原创角色",
      voice: state.customPersonaTagline.trim() || "等待补充角色设定。",
      motivation: state.customPersonaTagline.trim() || "等待补充角色设定。",
      enabled: true,
    };
    if (addDraftCharacter(character)) {
      state.customPersonaName = "";
      state.customPersonaTagline = "";
      state.customPersonaPolishCount = 0;
      state.useCustomPersona = false;
      $("customPersonaAiHint").classList.add("hidden");
      renderCreateControls();
    }
  };

  document.querySelectorAll("[data-persona-picker-open]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!personas.length) return;
      openPersonaPickerModal();
    });
  });

  if (!$("customPersonaNameInput").dataset.bound) {
    $("customPersonaNameInput").dataset.bound = "true";
    $("customPersonaNameInput").addEventListener("input", (event) => {
      state.customPersonaName = event.target.value;
      state.customPersonaPolishCount = 0;
      showCreateError();
      updateCreateSettingsSummary();
      updateCreateReadiness();
    });
  }

  if (!$("customPersonaTaglineInput").dataset.bound) {
    $("customPersonaTaglineInput").dataset.bound = "true";
    $("customPersonaTaglineInput").addEventListener("input", (event) => {
      state.customPersonaTagline = event.target.value;
      state.customPersonaPolishCount = 0;
      updateCreateSettingsSummary();
    });
  }

  if (!$("aiPolishPersonaButton").dataset.bound) {
    $("aiPolishPersonaButton").dataset.bound = "true";
    $("aiPolishPersonaButton").addEventListener("click", () => {
      state.customPersonaTagline = rewriteCustomPersonaTagline();
      state.customPersonaPolishCount += 1;
      $("customPersonaTaglineInput").value = state.customPersonaTagline;
      $("customPersonaAiHint").textContent = `已生成第 ${state.customPersonaPolishCount} 版角色设定，可继续点击换角度。`;
      $("customPersonaAiHint").classList.remove("hidden");
      updateCreateSettingsSummary();
      updateCreateReadiness();
    });
  }

  updateCreateReadiness();
}

function ensureCreateSelection() {
  const currentIp = getIpEntry(state.selectedIpId);
  if (state.selectedOrigin === "fanwork") {
    if (!currentIp?.supportedOrigins.includes("fanwork")) {
      state.selectedIpId = "";
      state.selectedPersona = "";
      return;
    }
  } else if (!currentIp?.supportedOrigins.includes("original")) {
    state.selectedIpId = getDefaultIpForOrigin("original")?.id || "";
  }

  const personas = state.selectedIpId ? getPersonasForIp(state.selectedIpId) : [];
  if (!personas.some((persona) => persona.id === state.selectedPersona)) {
    state.selectedPersona = state.selectedOrigin === "fanwork" ? "" : personas[0]?.id || "";
  }
}

async function runDraftGeneration() {
  if (state.draftGenerating) return;
  const options = createOptionsFromForm();
  if (!validateCreateOptions(options)) return;
  const button = $("generateButton");
  state.draftGenerating = true;
  state.createGuideAdvanced = false;
  state.createWizardStep = "making";
  setCreateProgress("AI 正在制作完整文字游戏：企划、角色、场景、素材和检查会一起完成。", "info");
  setButtonBusy(button, true, "制作中");
  startGenerationWorkbench();
  renderCreateWizard();
  try {
    const createDraft = flashApi.createAiDraft || flashApi.createDraft;
    const response = await withGenerationTimeout(createDraft($("promptInput").value, state.selectedTemplate, options));
    state.draft = response.item;
    if (state.draft?.contentOrigin === "fanwork" && state.fanworkRightsAccepted) {
      state.draft.rightsAcknowledgedAt = options.rightsAcknowledgedAt || Date.now();
    }
    state.draftPlaySceneId = state.draft?.entrySceneId || state.draft?.scenes?.[0]?.id || null;
    state.aiEdit = {
      status: "idle",
      prompt: "",
      scopeType: "work",
      proposal: null,
      undoStack: [],
    };
    renderDraft(state.draft);
    setCreateWizardStep("preview");
    finishGenerationWorkbench();
    setCreateProgress(state.draft.aiProvider?.status === "used"
      ? `AI 作品已生成：${state.draft.aiProvider.provider}。现在可以查看总览、编辑分区、试玩和发布检查。`
      : "作品已生成，本次使用本地规则兜底；可以继续编辑、试玩和发布。",
    state.draft.aiProvider?.status === "used" ? "success" : "warning");
    showToast(state.draft.aiProvider?.status === "used"
      ? `AI 作品已生成：${state.draft.aiProvider.provider}`
      : "文字游戏草稿已生成。");
  } catch (error) {
    state.createWizardStep = "prompt";
    failGenerationWorkbench(error);
    setCreateProgress("生成失败，刚才的描述已保留。", "error");
    showToast("生成失败，描述已保留。");
  } finally {
    state.draftGenerating = false;
    setButtonBusy(button, false);
    updateCreateReadiness();
  }
}

async function remixActivePack() {
  const source = activePack();
  const response = await flashApi.remixWork(source.id);
  await reloadPacks(response.item?.id);
}

function renderScreenData(screenId) {
  if (screenId === "friendsScreen") renderFriends();
  if (screenId === "commentScreen") renderComments();
  if (screenId === "ipScreen") renderIpCommunity();
  if (screenId === "badgeScreen") renderBadge();
  if (screenId === "storeScreen") renderStore();
  if (screenId === "profileScreen") renderProfile();
  if (screenId === "operatorScreen") renderOperator();
  if (screenId === "createScreen") updateCreateReadiness();
}

function packSubtitle(pack) {
  const completion = Math.round((pack.metrics?.completionRate || 0) * 100);
  return `${pack.persona?.name || "咕咕分身"} · ${getZone(pack.zoneId).name} · ${packOriginText(pack)} · 完播率 ${completion}% · 热度 ${Math.round(scorePack(pack))}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showCommentMessage(message = "") {
  $("commentMessage").textContent = message;
  $("commentMessage").classList.toggle("hidden", !message);
}

function commentPack() {
  return state.packs.find((pack) => pack.id === state.commentPackId) || activePack();
}

async function openComments(pack = activePack()) {
  state.commentPackId = pack.id;
  showCommentMessage();
  $("commentInput").value = "";
  await renderComments();
  showScreen("commentScreen");
}

async function renderComments() {
  const pack = commentPack();
  if (!pack) return;
  state.commentPackId = pack.id;
  const response = await flashApi.getComments(pack.id);
  $("commentContext").innerHTML = `
    <div>
      <span>${pack.persona?.avatar || "✨"} ${pack.persona?.name || "咕咕分身"}</span>
      <strong>${escapeHtml(pack.title)}</strong>
      <small>${response.items.length} 条可见评论 · ${response.moderatedCount} 条处理中 · ${response.blockedCount} 条已屏蔽</small>
    </div>
  `;

  if (!response.items.length) {
    $("commentList").innerHTML = `<div class="empty-state compact-empty">还没有可见评论，或者已被你屏蔽。</div>`;
    return;
  }

  $("commentList").innerHTML = "";
  for (const comment of response.items) {
    const card = document.createElement("article");
    card.className = "comment-item";
    card.innerHTML = `
      <div class="comment-avatar">${escapeHtml((comment.authorName || "咕").slice(0, 1))}</div>
      <div class="comment-body">
        <div class="comment-meta">
          <strong>${escapeHtml(comment.authorName || comment.userId)}</strong>
          <span>${comment.statusLabel}</span>
        </div>
        <p>${escapeHtml(comment.body)}</p>
        <footer></footer>
      </div>
    `;
    const footer = card.querySelector("footer");
    const addAction = (label, className, handler) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = label;
      button.addEventListener("click", handler);
      footer.appendChild(button);
    };
    if (comment.canReport) {
      addAction("举报", "text-action danger-text", async () => {
        await flashApi.reportComment(comment.id, "harassment", "评论存在骚扰、引战或不适合展示的内容。");
        showCommentMessage("已提交举报，评论进入复核。");
        await reloadPacks(pack.id);
        await renderComments();
      });
    }
    if (comment.canHide) {
      addAction("隐藏", "text-action", async () => {
        await flashApi.hideComment(comment.id, "作者隐藏自己作品下的不适评论。");
        showCommentMessage("已隐藏评论，并留下治理记录。");
        await reloadPacks(pack.id);
        await renderComments();
      });
    }
    if (comment.canDelete) {
      addAction("删除", "text-action", async () => {
        await flashApi.deleteComment(comment.id);
        showCommentMessage("已删除你的评论。");
        await reloadPacks(pack.id);
        await renderComments();
      });
    }
    if (comment.canBlock) {
      addAction("拉黑", "text-action danger-text", async () => {
        await flashApi.blockUser({
          blockedUserId: comment.userId,
          blockedUserName: comment.authorName,
          reason: "从评论区拉黑，屏蔽对方评论和后续互动。",
        });
        showCommentMessage("已拉黑该用户，TA 的评论会从你的视角隐藏。");
        await renderComments();
      });
    }
    $("commentList").appendChild(card);
  }
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

function ipStatusClass(item) {
  if (item.hasZone) return "open";
  if (item.zoneEligibility?.eligible) return "eligible";
  return "locked";
}

function showIpMessage(message = "") {
  $("ipRequestMessage").textContent = message;
  $("ipRequestMessage").classList.toggle("hidden", !message);
}

function renderAnimeCollectorResult() {
  const panel = $("animeCollectorResult");
  const result = state.animeCollectionResult;
  if (!result) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  const items = result.items || [];
  const importedIds = new Set(result.importedIpIds || []);
  const summary = result.addedIpCount
    ? `已入池 ${result.addedIpCount} 个 IP · ${result.addedPersonaCount} 个角色`
    : "没有新的可入池候选";
  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="collector-summary">
      <strong>${summary}</strong>
      <span>${result.query ? `关键词：${escapeHtml(result.query)}` : "热度推荐"}</span>
    </div>
    <div class="collector-candidates">
      ${items.length ? items.map((item) => `
        <article class="${importedIds.has(item.ipId) ? "imported" : ""}">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(item.matchedBy || item.duplicateReason || "候选")}</small>
          </div>
          <span>${importedIds.has(item.ipId) ? "已入池" : (item.duplicateReason ? "已存在" : "候选")}</span>
          <em>${(item.characters || []).slice(0, 3).map((character) => `${character.avatar || "✨"} ${escapeHtml(character.name)}`).join(" / ")}</em>
        </article>
      `).join("") : `<div class="empty-state compact-empty">没有匹配到新的动漫 IP 候选。</div>`}
    </div>
  `;
}

async function renderIpCommunity() {
  const response = await flashApi.getIpPool({ query: state.ipSearchQuery });
  const items = response.items;
  if ($("ipSearchInput").value !== state.ipSearchQuery) $("ipSearchInput").value = state.ipSearchQuery;
  $("animeCollectorHint").textContent = state.ipSearchQuery ? `当前：${state.ipSearchQuery}` : "热度推荐";
  renderAnimeCollectorResult();
  if (!items.some((item) => item.id === state.selectedIpPoolId)) {
    state.selectedIpPoolId = items[0]?.id || "";
  }

  $("ipPoolList").innerHTML = items.length ? items.map((item) => `
    <button class="ip-pool-card ${state.selectedIpPoolId === item.id ? "active" : ""}" data-ip-pool-id="${item.id}" type="button">
      <span class="ip-status-pill ${ipStatusClass(item)}">${item.statusLabel}</span>
      <strong>${item.name}</strong>
      <small>${item.description}</small>
      <em>${item.stats.works} 作品 · ${item.stats.creators} 创作者 · ${formatNumber(item.stats.heatScore)} 热度</em>
    </button>
  `).join("") : `<div class="empty-state">没有找到匹配的 IP。可以申请添加 IP，审核通过后进入 IP 池。</div>`;

  document.querySelectorAll("[data-ip-pool-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedIpPoolId = button.dataset.ipPoolId;
      showIpMessage();
      renderIpCommunity();
    });
  });

  if (!state.selectedIpPoolId) {
    $("ipDetailPanel").innerHTML = `<div class="empty-state">先选择一个 IP。</div>`;
    return;
  }

  const detail = await flashApi.getIpDetail(state.selectedIpPoolId);
  renderIpDetail(detail.item);
}

function renderIpDetail(item) {
  if (!item) {
    $("ipDetailPanel").innerHTML = `<div class="empty-state">这个 IP 暂时不存在。</div>`;
    return;
  }

  const eligibility = item.zoneEligibility;
  const zone = eligibility.zone;
  $("ipDetailPanel").innerHTML = `
    <section class="ip-detail-hero">
      <span class="ip-status-pill ${ipStatusClass(item)}">${item.statusLabel}</span>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
    </section>
    <div class="ip-stats-grid">
      <div><strong>${item.stats.works}</strong><span>作品</span></div>
      <div><strong>${item.stats.creators}</strong><span>创作者</span></div>
      <div><strong>${formatNumber(item.stats.heatScore)}</strong><span>热度</span></div>
      <div><strong>${item.stats.hardwarePacks}</strong><span>硬件包</span></div>
    </div>
    <section class="ip-detail-section">
      <div class="section-heading">
        <h3>角色分身</h3>
        <span>${item.personas.length} 个角色</span>
      </div>
      <div class="persona-strip">
        ${item.personas.map((persona) => `
          <article>
            <span>${persona.avatar}</span>
            <strong>${persona.name}</strong>
            <small>${persona.tagline}</small>
          </article>
        `).join("")}
      </div>
    </section>
    <section class="ip-detail-section zone-application-card">
      <div class="section-heading">
        <h3>${zone ? "专区已开通" : "专区开通资格"}</h3>
        <span>${eligibility.statusLabel}</span>
      </div>
      <p>${zone ? `${zone.name} 已开通，管理员：${(zone.adminNames || []).join(" / ")}` : eligibility.reason}</p>
      <div class="eligibility-list">
        ${eligibility.checks.map((check) => `
          <div class="${check.passed ? "passed" : ""}">
            <strong>${check.passed ? "通过" : "待补齐"}</strong>
            <span>${check.label}</span>
            <em>${check.current}</em>
          </div>
        `).join("")}
      </div>
      ${zone ? `<button class="ghost-light-button wide" type="button" disabled>已开专区</button>` : `
        <button class="primary-button wide" id="applyZoneButton" type="button" ${eligibility.eligible ? "" : "disabled"}>${eligibility.eligible ? "申请开通专区" : "暂未达标"}</button>
      `}
    </section>
    <section class="ip-detail-section">
      <div class="section-heading">
        <h3>专区内容</h3>
        <span>已适配设备的内容包</span>
      </div>
      <div class="zone-hardware-list">
        ${item.hardwarePacks.length ? item.hardwarePacks.map((pack) => `
          <article>
            <strong>${pack.title}</strong>
            <small>${pack.description}</small>
            <span>${pack.persona?.name || "咕咕分身"} · ${userHardwarePackStatusLabel(pack.status)}</span>
          </article>
        `).join("") : `<div class="empty-state compact-empty">该专区还没有已适配设备的内容包，已发布 H5 不会自动出现在这里。</div>`}
      </div>
    </section>
  `;

  const applyZoneButton = $("applyZoneButton");
  if (applyZoneButton) {
    applyZoneButton.addEventListener("click", async () => {
      const result = await flashApi.applyZoneApplication(item.id);
      showIpMessage(result.accepted
        ? `${result.zone.name} 已开通，你已成为专区管理员。`
        : "当前 IP 还没有达到开区门槛。");
      await renderIpCommunity();
    });
  }
}

async function renderDevice() {
  const dashboard = await flashApi.getDeviceDashboard();
  return dashboard;
}

async function renderBadge() {
  const dashboard = await renderDevice();
  const { library, summary, devices, activeDeviceId, syncJobs = [] } = dashboard;
  document.querySelector(".device-hero strong").textContent = dashboard.device.name;
  document.querySelector(".device-hero p").textContent = `${dashboard.device.status} · 分身 ${dashboard.device.persona?.name || "咕咕分身"} · 电量 ${dashboard.device.battery}% · ${dashboard.device.currentPackTitle}`;
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
    <span>${installed.legacyUsable ? "已下架仍可用" : "运行中"}</span>
  ` : `<div class="empty-state">这个分身还没有同步到设备的内容包。</div>`;

  const latestFailedSync = syncJobs.find((job) => ["failed", "blocked", "rollback_required"].includes(job.status));
  $("syncJobPanel").innerHTML = latestFailedSync ? `
    <strong>最近同步失败</strong>
    <p>${latestFailedSync.message || "同步失败，请稍后重试。"} · ${latestFailedSync.diagnosticCode}</p>
    <span>已保留原运行内容，重试会重新做设备检查。</span>
  ` : "";

  $("deviceCount").textContent = `${devices.length} 台已绑定`;
  $("deviceList").innerHTML = devices.map((device) => {
    const active = device.id === activeDeviceId;
    return `
      <article class="device-card ${active ? "active" : ""}">
        <div>
          <h3>${device.name}</h3>
          <p>${device.model} · 分身 ${device.persona?.name || "咕咕分身"} · ${device.status} · 电量 ${device.battery}%</p>
          <span>${device.currentPackTitle ? `运行：${device.currentPackTitle}` : "未同步内容"}</span>
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
      <span>适用于</span>
      <strong>${dashboard.device.name}</strong>
      <p>${dashboard.device.persona?.name || "咕咕分身"} · 当前内容：${dashboard.device.currentPackTitle}</p>
    </div>
  `;
  renderStoreLegalPanel();

  if (!library.length) {
    $("storeList").innerHTML = `<div class="empty-state">这台设备当前角色分身暂无可安装内容。切换设备后，商店内容会变化。</div>`;
    return;
  }

  $("storeList").innerHTML = "";
  for (const itemData of library) {
    const item = document.createElement("article");
    item.className = "store-item";
    item.dataset.testid = `store-item-${itemData.id}`;
    item.innerHTML = `
      <div class="mini-visual" style="background:${itemData.cover?.background || "#111827"}">${itemData.cover?.character || "✨"}</div>
      <div>
        <h3>${itemData.title}</h3>
        <p>${itemData.persona?.name || "咕咕分身"}的新玩法，适合当前吧唧。</p>
        <span>${itemData.persona?.name || "咕咕分身"} · ${badgeStoreLabel(itemData)}</span>
        ${itemData.syncStatus === "failed" ? `<small class="sync-failure-note">${itemData.syncFailureMessage || "同步失败，请重试。"} · ${itemData.syncDiagnosticCode || "等待诊断码"}</small>` : ""}
        ${badgeStoreBlockedReason(itemData) ? `<small class="store-blocked-reason">${badgeStoreBlockedReason(itemData)}</small>` : ""}
      </div>
      <button data-testid="store-primary-action-${itemData.id}" type="button" ${badgeStoreActionDisabled(itemData) ? "disabled" : ""}>${badgeStoreActionLabel(itemData)}</button>
    `;
    item.querySelector("button").addEventListener("click", async () => {
      const button = item.querySelector("button");
      const originalText = button.textContent;
      setButtonBusy(button, true);
      button.textContent = "处理中";
      try {
        await runBadgeStoreAction(itemData);
        setLoopStep("device");
        showToast("设备内容状态已更新。");
        await renderStore();
      } finally {
        button.textContent = originalText;
        setButtonBusy(button, false);
      }
    });
    $("storeList").appendChild(item);
  }
}

function renderStoreLegalPanel() {
  $("storeLegalPanel").innerHTML = `
    <div class="consent-summary">
      <strong>购买与同步确认</strong>
      <span>按当前步骤勾选，按钮会自动解锁。</span>
    </div>
    <label class="terms-line legal-checkbox">
      <input id="storeTermsAccepted" data-testid="store-terms" type="checkbox" ${state.storeTermsAccepted ? "checked" : ""} />
      <span>购买/领取权益按当前设备生效；退款会撤销新下载和新同步权益。</span>
    </label>
    <label class="terms-line legal-checkbox">
      <input id="deviceSyncTermsAccepted" data-testid="device-sync-terms" type="checkbox" ${state.deviceSyncTermsAccepted ? "checked" : ""} />
      <span>同步前检查电量、固件、空间和兼容性；失败会保留原运行内容。</span>
    </label>
  `;
  $("storeTermsAccepted").addEventListener("change", (event) => {
    state.storeTermsAccepted = event.target.checked;
    renderStore();
  });
  $("deviceSyncTermsAccepted").addEventListener("change", (event) => {
    state.deviceSyncTermsAccepted = event.target.checked;
    renderStore();
  });
}

function badgeStoreBlockedReason(item) {
  return "";
}

function badgeStoreLabel(item) {
  if (item.entitlementStatus === "revoked" && item.syncStatus === "synced") return "已退款，设备内仍可使用";
  if (item.entitlementStatus === "revoked") return "已退款，权益已撤销";
  if (!item.availableForNewUse && item.syncStatus === "synced") return "已装本设备，可继续使用";
  if (!item.availableForNewUse) return item.availabilityLabel || "已下架，不能新下载";
  if (item.syncStatus === "failed") return "同步失败，原内容已保留";
  if (item.syncStatus === "synced") return "使用中";
  if (item.downloadStatus === "downloaded") return "已拥有";
  if (item.ownership === "owned") return "已拥有";
  return item.price ? `￥${item.price}` : "免费";
}

function badgeStoreActionLabel(item) {
  if (item.entitlementStatus === "revoked" && item.syncStatus === "synced") return "使用中";
  if (item.entitlementStatus === "revoked") return "获取";
  if (!item.availableForNewUse && item.syncStatus === "synced") return "使用中";
  if (!item.availableForNewUse && item.downloadStatus === "downloaded") return "已下架";
  if (!item.availableForNewUse && item.ownership === "owned") return "已下架";
  if (!item.availableForNewUse) return "已下架";
  if (item.syncStatus === "failed") return "重试";
  if (item.syncStatus === "synced") return "使用中";
  if (item.downloadStatus === "downloaded") return "装到设备";
  if (item.ownership === "owned") return "装到设备";
  return "获取";
}

function badgeStoreActionDisabled(item) {
  if (item.entitlementStatus === "revoked" && item.syncStatus !== "synced") return false;
  return item.syncStatus === "synced" || !item.availableForNewUse;
}

function storeLegalAcceptedForAction(item) {
  if (item.syncStatus === "synced") return true;
  if (item.downloadStatus === "downloaded" || item.syncStatus === "failed") return state.deviceSyncTermsAccepted;
  if (item.ownership === "owned") return state.deviceSyncTermsAccepted;
  return state.storeTermsAccepted;
}

function storeAdvanceActionLabel(status) {
  return {
    rights_review: "初审通过",
    production_queued: "开始制作",
    producing: "提交复核",
    pack_review: "正式上架",
  }[status] || storeStatusLabel(status);
}

function canAdvanceStore(status) {
  return ["rights_review", "production_queued", "producing", "pack_review"].includes(status);
}

function workLifecycleItems(pack) {
  const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
  const hardwarePackStatus = pack.hardwarePack?.status || null;
  if (hardwarePackStatus === "available") return [{ label: "状态", value: "设备可用" }];
  if (storeStatus === "listed") return [{ label: "状态", value: "商店中" }];
  if (["submitted", "rights_review", "production_queued", "producing", "pack_review"].includes(storeStatus)) {
    return [{ label: "状态", value: "进商店中" }];
  }
  if (storeStatus === "rejected") return [{ label: "状态", value: "可重新提交" }];
  if (storeStatus === "delisted") return [{ label: "状态", value: "已下架" }];
  if (storeStatus === "frozen") return [{ label: "状态", value: "处理中" }];
  return [{ label: "状态", value: "已发布" }];
}

function workNextStepText(pack) {
  const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
  const hardwarePackStatus = pack.hardwarePack?.status || null;
  if (storeStatus === "not_applied") return "喜欢这个作品的话，可以申请进商店。";
  if (["submitted", "rights_review"].includes(storeStatus)) return "已提交，审核通过后会继续适配吧唧。";
  if (["production_queued", "producing", "pack_review"].includes(storeStatus)) return "正在准备可装到吧唧的版本。";
  if (storeStatus === "listed" && hardwarePackStatus === "available") return "已在商店开放，可以装到吧唧。";
  if (storeStatus === "listed") return "已进商店，等待开放安装。";
  if (storeStatus === "rejected") return "可以调整后重新申请。";
  if (storeStatus === "delisted") return "已下架，已安装的内容仍可继续用。";
  if (storeStatus === "frozen") return "有争议正在处理。";
  return "可以继续创作或预览。";
}

async function runBadgeStoreAction(item) {
  if (item.syncStatus === "synced") return;
  if (!item.availableForNewUse) return;
  if (item.downloadStatus === "downloaded") {
    state.deviceSyncTermsAccepted = true;
    await flashApi.syncBadgePack(item.id);
    return;
  }
  if (item.ownership === "owned") {
    state.deviceSyncTermsAccepted = true;
    await flashApi.downloadBadgePack(item.id);
    return;
  }
  state.storeTermsAccepted = true;
  await flashApi.purchaseBadgePack(item.id);
}

function usePackAsCreateSettings(pack) {
  state.selectedOrigin = pack.contentOrigin === "fanwork" ? "fanwork" : "original";
  state.selectedIpId = pack.ipId || getDefaultIpForOrigin(state.selectedOrigin)?.id || "";
  const knownPersona = pack.persona?.id ? getPersona(pack.persona.id) : null;
  const usesCustomPersona = Boolean(
    pack.persona?.name &&
    (pack.persona.roleType === "creator_original" || knownPersona?.id !== pack.persona.id)
  );
  state.useCustomPersona = usesCustomPersona;
  state.selectedPersona = usesCustomPersona ? "" : pack.persona?.id || state.selectedPersona;
  state.customPersonaName = usesCustomPersona ? pack.persona.name || "" : "";
  state.customPersonaTagline = usesCustomPersona ? pack.persona.tagline || "" : "";
  state.fanworkRightsAccepted = Boolean(pack.rightsAcknowledgedAt);
  state.createIpSearchQuery = "";
}

function startEditingWork(pack) {
  const draft = structuredClone(pack);
  state.editingWorkId = pack.id;
  state.createGuideAdvanced = false;
  state.draft = {
    ...draft,
    sourceDraftId: draft.sourceDraftId || draft.id,
  };
  state.draftPlaySceneId = state.draft.entrySceneId || state.draft.scenes?.[0]?.id || null;
  usePackAsCreateSettings(state.draft);
  $("promptInput").value = state.draft.aiAssistance?.prompt || state.draft.creationBrief?.prompt || state.draft.title || "";
  renderCreateControls();
  renderDraft(state.draft);
  setCreateWizardStep("preview", { scroll: false });
  showScreen("createScreen");
  showToast("已进入编辑模式，保存后会更新原作品。");
}

async function deleteMyWork(pack) {
  const confirmed = window.confirm(`删除「${displayWorkTitle(pack)}」？删除后会从首页和我的作品移除。`);
  if (!confirmed) return;
  const response = await flashApi.deleteWork(pack.id);
  if (!response.deleted && !response.item) {
    showToast("删除失败，作品可能已经不存在。");
    return;
  }
  if (state.storeApplyPackId === pack.id) state.storeApplyPackId = null;
  await reloadPacks();
  await renderProfile();
  showToast("作品已删除。");
}

async function renderProfile() {
  const response = await flashApi.getProfile();
  const { profile, stats } = response;
  const myWorks = uniqueWorks(response.myWorks || []);

  document.querySelector(".profile-card h3").textContent = profile.name;
  document.querySelector(".profile-card p").textContent = profile.bio;
  $("profileStats").innerHTML = `
    <div><strong>${myWorks.length}</strong><span>我的作品</span></div>
    <div><strong>${formatNumber(stats.likes)}</strong><span>全站点赞</span></div>
    <div><strong>${stats.storePending}</strong><span>上架进行中</span></div>
    <div><strong>${stats.storeListed}</strong><span>已上架</span></div>
  `;
  $("myWorkCount").textContent = `${myWorks.length} 个作品`;

  if (!myWorks.length) {
    $("myWorkGrid").innerHTML = `<div class="empty-state">还没有发布作品。在上面的快速创作里输入一句话，先做一个 H5 吧唧。</div>`;
    $("listingApplication").classList.add("hidden");
    return;
  }

  $("myWorkGrid").innerHTML = "";
  for (const pack of myWorks) {
    const card = document.createElement("article");
    card.className = "work-card";
    card.dataset.testid = `work-card-${pack.id}`;
    const storeStatus = pack.storeListing?.status || pack.storeStatus || "not_applied";
    const canApply = storeStatus === "not_applied" || storeStatus === "rejected";
    card.innerHTML = `
      <div class="work-cover" style="background:${pack.cover?.background || "#111827"}">
        ${pack.cover?.imageUrl ? `<img src="${escapeHtml(displayMediaUrl(pack.cover.imageUrl))}" alt="${escapeHtml(pack.title)}封面">` : `<span>${pack.cover?.character || "✨"}</span>`}
      </div>
      <h3>${escapeHtml(displayWorkTitle(pack))}</h3>
      <p>${packOriginText(pack)} · ${getZone(pack.zoneId).shortName}</p>
      <div class="work-status-strip">
        ${workLifecycleItems(pack).map((item) => `
          <span><strong>${item.label}</strong>${item.value}</span>
        `).join("")}
      </div>
      <small class="work-next-step">${workNextStepText(pack)}</small>
      <footer class="work-actions">
        <button data-work-action="play" type="button">预览</button>
        <button data-work-action="edit" data-testid="work-edit-${pack.id}" type="button">编辑</button>
        <button data-work-action="delete" class="danger" data-testid="work-delete-${pack.id}" type="button">删除</button>
        <button data-work-action="apply-store" data-testid="work-apply-store-${pack.id}" type="button" ${canApply ? "" : "disabled"}>${canApply ? "申请上架" : userStoreStatusLabel(storeStatus)}</button>
      </footer>
    `;
    card.querySelector('[data-work-action="play"]').addEventListener("click", () => openPlayer(pack));
    card.querySelector('[data-work-action="edit"]').addEventListener("click", () => startEditingWork(pack));
    card.querySelector('[data-work-action="delete"]').addEventListener("click", () => deleteMyWork(pack));
    card.querySelector('[data-work-action="apply-store"]').addEventListener("click", () => {
      state.storeApplyPackId = pack.id;
      renderProfile();
      $("listingApplication").scrollIntoView({ block: "start", behavior: "smooth" });
    });
    $("myWorkGrid").appendChild(card);
  }

  renderListingApplication(myWorks);
}

function renderListingApplication(myWorks) {
  const panel = $("listingApplication");
  const pack = myWorks.find((item) => item.id === state.storeApplyPackId);
  if (!pack) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div>
      <span>商店上架申请</span>
      <h3>${pack.title}</h3>
      <p>${packOriginText(pack)} · ${pack.persona?.name || "咕咕分身"} · ${getZone(pack.zoneId).name}</p>
    </div>
    <div class="listing-timeline" aria-label="商店申请流程">
      <span class="active">平台审核</span>
      <span>设备内容包适配</span>
      <span>开放购买 / 领取</span>
    </div>
    <label class="terms-line">
      <input id="listingTermsAccepted" type="checkbox" />
      <span>我确认已阅读闭测创作者条款和商店上架条款；该作品为原创，或我已取得/自行承担相关 IP 与素材授权风险；如发生权利投诉，我同意配合提供证明并接受平台下架、冻结收益等处理。</span>
    </label>
    <div class="listing-actions">
      <button class="ghost-light-button" id="cancelListingButton" type="button">取消</button>
      <button class="primary-button" id="submitListingButton" type="button" disabled>提交审核</button>
    </div>
  `;

  $("listingTermsAccepted").addEventListener("change", (event) => {
    $("submitListingButton").disabled = !event.target.checked;
  });
  $("cancelListingButton").addEventListener("click", () => {
    state.storeApplyPackId = null;
    renderProfile();
  });
  $("submitListingButton").addEventListener("click", async () => {
    await flashApi.applyStoreListing(pack.id, $("listingTermsAccepted").checked);
    state.storeApplyPackId = null;
    await reloadPacks(pack.id);
    renderProfile();
  });
}

async function renderOperator() {
  const dashboard = await flashApi.getOperatorDashboard();
  $("opsPublicCount").textContent = dashboard.counts.public;
  $("opsCandidateCount").textContent = dashboard.counts.reviewOpen;
  $("opsGovernanceCount").textContent = dashboard.counts.governanceOpen;
  $("opsReadyCount").textContent = dashboard.counts.hardwareQueue;
  $("opsStorePendingCount").textContent = dashboard.counts.storePending;
  $("opsSettlementFrozenCount").textContent = dashboard.counts.settlementFrozen;

  renderReviewQueue(dashboard.reviewTasks);
  renderGovernanceCases(dashboard.governanceCases || []);
  renderStoreQueue(dashboard.storeListings);
  renderHardwareQueue(dashboard.hardwareQueue);
  renderSettlements(dashboard.settlements || []);
  renderOperationLogs(dashboard.operationLogs);
}

function renderOpsEmpty(containerId, message) {
  $(containerId).innerHTML = `<div class="empty-state compact-empty">${message}</div>`;
}

function renderReviewQueue(reviewTasks) {
  if (!reviewTasks.length) {
    renderOpsEmpty("opsReviewList", "当前没有待处理审核任务。");
    return;
  }

  $("opsReviewList").innerHTML = "";
  for (const task of reviewTasks) {
    const card = document.createElement("article");
    card.className = "ops-card review-task-card";
    card.innerHTML = `
      <h3>${task.title}</h3>
      <p>${task.reviewTypeLabel} · ${task.riskLabel}</p>
      <div class="ops-note">${task.reason}</div>
      <div class="ops-evidence">
        ${(task.evidence || []).map((item) => `<span>${item}</span>`).join("")}
      </div>
      <footer>
        <button class="store-approve" type="button">审核通过</button>
        <button class="danger" type="button">驳回</button>
      </footer>
    `;
    card.querySelector(".store-approve").addEventListener("click", async () => {
      await flashApi.approveReviewTask(task.id, "材料完整，允许进入下一状态。");
      await reloadPacks(task.packId);
      renderOperator();
    });
    card.querySelector(".danger").addEventListener("click", async () => {
      await flashApi.rejectReviewTask(task.id, "材料不足，需要创作者补充证明。");
      await reloadPacks(task.packId);
      renderOperator();
    });
    $("opsReviewList").appendChild(card);
  }
}

function governancePrimaryLabel(item) {
  if (item.caseType === "appeal") return "恢复";
  if (item.caseType === "rights_claim") return item.status === "action_taken" ? "维持处置" : "先冻结";
  if (item.targetType === "Comment") return "隐藏评论";
  return "限流处理";
}

function governanceSecondaryLabel(item) {
  if (item.caseType === "appeal") return "维持";
  if (item.caseType === "rights_claim") return "恢复";
  return "驳回";
}

async function handleGovernancePrimary(item) {
  if (item.caseType === "appeal") {
    await flashApi.resolveAppeal(item.id, "restore", "申诉材料通过，恢复内容和商店状态。");
    return;
  }
  if (item.caseType === "rights_claim") {
    if (item.status === "action_taken") {
      await flashApi.resolveRightsClaim(item.id, "closed", "维持已采取的权利争议处置。");
    } else {
      await flashApi.resolveRightsClaim(item.id, "freeze_store", "权利投诉进入先行冻结处理。");
    }
    return;
  }
  if (item.targetType === "Comment") {
    await flashApi.resolveReport(item.id, "hide", "评论举报成立，平台隐藏该评论。");
    return;
  }
  await flashApi.resolveReport(item.id, "limit_recommend", "举报成立，先限制推荐并进入复核。");
}

async function handleGovernanceSecondary(item) {
  if (item.caseType === "appeal") {
    await flashApi.resolveAppeal(item.id, "keep_action", "申诉材料不足，维持原处置。");
    return;
  }
  if (item.caseType === "rights_claim") {
    await flashApi.resolveRightsClaim(item.id, "restore", "权利材料不足，恢复相关状态。");
    return;
  }
  await flashApi.resolveReport(item.id, "reject", "举报材料不足，暂不采取处置。");
}

function renderGovernanceCases(cases) {
  if (!cases.length) {
    renderOpsEmpty("opsGovernanceList", "当前没有举报、投诉或申诉。");
    return;
  }

  $("opsGovernanceList").innerHTML = "";
  for (const item of cases) {
    const card = document.createElement("article");
    card.className = "ops-card governance-case-card";
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.caseTypeLabel} · ${item.statusLabel} · ${item.riskLabel}</p>
      <div class="ops-note">${item.reason}</div>
      <div class="ops-evidence">
        <span>${item.targetType}</span>
        <span>${item.targetId}</span>
        <span>${item.caseTypeLabel}</span>
      </div>
      <footer>
        <button class="store-approve" type="button">${governancePrimaryLabel(item)}</button>
        <button class="danger" type="button">${governanceSecondaryLabel(item)}</button>
      </footer>
    `;
    card.querySelector(".store-approve").addEventListener("click", async () => {
      await handleGovernancePrimary(item);
      await reloadPacks(item.targetId);
      renderOperator();
    });
    card.querySelector(".danger").addEventListener("click", async () => {
      await handleGovernanceSecondary(item);
      await reloadPacks(item.targetId);
      renderOperator();
    });
    $("opsGovernanceList").appendChild(card);
  }
}

function renderStoreQueue(storeListings) {
  if (!storeListings.length) {
    renderOpsEmpty("opsStoreList", "还没有商店上架申请。");
    return;
  }

  $("opsStoreList").innerHTML = "";
  for (const listing of storeListings) {
    const canAdvance = canAdvanceStore(listing.status);
    const dangerLabel = listing.status === "listed" ? "下架" : "驳回";
    const dangerDisabled = ["rejected", "delisted"].includes(listing.status);
    const canFreeze = listing.status === "listed";
    const card = document.createElement("article");
    card.className = "ops-card store-listing-card";
    card.innerHTML = `
      <h3>${listing.title}</h3>
      <p>${listing.originLabel}${listing.ipName ? ` · ${listing.ipName}` : ""} · ${listing.personaName} · ${listing.statusLabel}</p>
      <div class="ops-note">${listing.rightsAcknowledgedAt ? "权利承诺已签署，可以记录审核意见后推进。" : "缺少权利承诺，不能进入商店流程。"}</div>
      <footer>
        <button class="store-approve" type="button" ${canAdvance ? "" : "disabled"}>${canAdvance ? storeAdvanceActionLabel(listing.status) : listing.statusLabel}</button>
        <button class="freeze" type="button" ${canFreeze ? "" : "disabled"}>冻结</button>
        <button class="danger" type="button" ${dangerDisabled ? "disabled" : ""}>${dangerLabel}</button>
      </footer>
    `;
    card.querySelector(".store-approve").addEventListener("click", async () => {
      await flashApi.approveStoreListing(listing.packId);
      await reloadPacks(listing.packId);
      renderOperator();
    });
    card.querySelector(".freeze").addEventListener("click", async () => {
      await flashApi.freezeStoreListing(listing.packId, "权利争议处理中，先冻结商店和收益。");
      await reloadPacks(listing.packId);
      renderOperator();
    });
    card.querySelector(".danger").addEventListener("click", async () => {
      if (listing.status === "listed") {
        await flashApi.delistStoreListing(listing.packId, "运营下架，停止新增下载和同步，已安装设备继续可用。");
      } else {
        await flashApi.rejectStoreListing(listing.packId);
      }
      await reloadPacks(listing.packId);
      renderOperator();
    });
    $("opsStoreList").appendChild(card);
  }
}

function renderHardwareQueue(hardwareQueue) {
  if (!hardwareQueue.length) {
    renderOpsEmpty("opsHardwareList", "还没有进入设备包制作的作品。");
    return;
  }

  $("opsHardwareList").innerHTML = "";
  for (const item of hardwareQueue) {
    const report = item.compatibilityReport || {};
    const budget = item.resourceBudget || {};
    const actual = budget.actual || {};
    const degradeActions = item.degradeActions || [];
    const compatibilityText = report.compatibilityLevelLabel || "等待兼容报告";
    const reportText = item.compatibilityReportId || "等待生成";
    const sizeText = item.packageSizeKb && budget.maxSizeKb
      ? `${item.packageSizeKb}/${budget.maxSizeKb} KB`
      : "待估算";
    const degradeNote = report.status === "failed"
      ? `阻断原因：${(report.findings || ["设备端暂不支持当前内容结构。"]).join("；")}`
      : (degradeActions.length
        ? `降级记录：${degradeActions.map((action) => action.action).join("；")}`
        : "无需降级，可直接制作设备内容包。");
    const card = document.createElement("article");
    card.className = "ops-card hardware-queue-card";
    card.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.stageLabel} · ${hardwareStatusLabel(item.hardwareStatus)} · ${compatibilityText}</p>
      <div class="ops-progress" aria-label="制作进度">
        <span style="width:${item.progress}%"></span>
      </div>
      <div class="ops-note">${degradeNote}</div>
      <div class="ops-evidence">
        <span>报告：${reportText}</span>
        <span>内容包版本：${item.hardwarePackVersion || "待定"}</span>
        <span>格式：${item.formatVersion || "待定"}</span>
        <span>资源：${sizeText}</span>
        <span>节点：${actual.nodeCount || 0}/${budget.maxNodes || "-"}</span>
        <span>目标设备：${(item.targetDeviceModels || []).join(" / ")}</span>
        <span>校验：${item.checksum || "待生成"}</span>
        <span>进度：${item.progress}%</span>
      </div>
      <footer>
        <button class="candidate" type="button">标为候选</button>
        <button class="ready" type="button" ${report.status === "failed" ? "disabled" : ""}>标为可下载</button>
      </footer>
    `;
    card.querySelector(".candidate").addEventListener("click", async () => {
      await flashApi.markHardwareCandidate(item.packId);
      await reloadPacks(item.packId);
      renderOperator();
    });
    card.querySelector(".ready").addEventListener("click", async () => {
      await flashApi.markHardwareReady(item.packId);
      await reloadPacks(item.packId);
      renderOperator();
    });
    $("opsHardwareList").appendChild(card);
  }
}

function renderSettlements(settlements) {
  if (!settlements.length) {
    renderOpsEmpty("opsSettlementList", "还没有订单结算记录。");
    return;
  }

  $("opsSettlementList").innerHTML = "";
  for (const settlement of settlements.slice(0, 8)) {
    const canRelease = settlement.status === "frozen";
    const card = document.createElement("article");
    card.className = "ops-card settlement-card";
    card.innerHTML = `
      <h3>${settlement.hardwarePackTitle || settlement.hardwarePackId}</h3>
      <p>${settlement.statusLabel} · ${settlement.amountLabel} · ${settlement.orderId}</p>
      <div class="ops-note">${settlement.freezeReason || "MVP 阶段仅预留结算记录，不开放现金分成。"}</div>
      <div class="ops-evidence">
        <span>Listing：${settlement.storeListingId}</span>
        <span>来源：${settlement.riskSource || "normal"}</span>
        <span>创作者：${settlement.creatorUserId || "待确认"}</span>
      </div>
      <footer>
        <button class="store-approve" type="button" ${canRelease ? "" : "disabled"}>释放冻结</button>
      </footer>
    `;
    card.querySelector(".store-approve").addEventListener("click", async () => {
      await flashApi.releaseSettlement(settlement.id);
      renderOperator();
    });
    $("opsSettlementList").appendChild(card);
  }
}

function renderOperationLogs(operationLogs) {
  if (!operationLogs.length) {
    renderOpsEmpty("opsLogList", "还没有操作记录。");
    return;
  }

  $("opsLogList").innerHTML = operationLogs.slice(0, 8).map((log) => `
    <article class="ops-log-item">
      <div>
        <strong>${log.actorName || log.actorUserId}</strong>
        <span>${log.action} · ${log.targetTitle || log.targetId}</span>
      </div>
      <p>${log.detail}</p>
    </article>
  `).join("");
}

function wireEvents() {
  $("playButton").addEventListener("click", () => openPlayer());
  $("feedRemixButton").addEventListener("click", async () => {
    await remixActivePack();
    showScreen("createScreen");
  });
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
  $("continueFeedButton").addEventListener("click", () => {
    setLoopStep("feed");
    showScreen("feedScreen");
  });
  $("playerReportButton").addEventListener("click", async () => {
    const button = $("playerReportButton");
    const packId = activePack().id;
    await flashApi.submitReport({
      targetType: "Work",
      targetId: packId,
      reason: "hardware_unsuitable",
      description: "用户在互动完成页举报该内容不适合继续推荐或硬件展示。",
    });
    button.textContent = "已提交";
    setTimeout(() => {
      button.textContent = "举报";
    }, 1200);
    await reloadPacks(packId);
    renderScene();
  });
  $("closeOperatorButton").addEventListener("click", () => showScreen("feedScreen"));
  $("closeStoreButton").addEventListener("click", () => showScreen("badgeScreen"));
  $("closeCommentsButton").addEventListener("click", () => showScreen("feedScreen"));
  $("openStoreButton").addEventListener("click", () => showScreen("storeScreen"));
  $("closeCreateButton").addEventListener("click", () => showScreen("profileScreen"));
  $("openCreateButton").addEventListener("click", () => showScreen("createScreen"));
  $("dismissPostPublishButton").addEventListener("click", () => {
    state.lastPublishedPackId = null;
    renderFeed();
  });
  $("viewPublishedWorkButton").addEventListener("click", () => {
    state.storeApplyPackId = null;
    showScreen("profileScreen");
  });
  if ($("applyPublishedWorkButton")) {
    $("applyPublishedWorkButton").addEventListener("click", () => {
      if (!state.lastPublishedPackId) return;
      state.storeApplyPackId = state.lastPublishedPackId;
      showScreen("profileScreen");
      setTimeout(() => $("listingApplication").scrollIntoView({ block: "start", behavior: "smooth" }), 80);
    });
  }
  document.querySelectorAll("[data-loop-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.loopTarget;
      if (target === "feed") showScreen("feedScreen");
      if (target === "play") openPlayer();
      if (target === "create") showScreen("createScreen");
      if (target === "device") showScreen("badgeScreen");
      setLoopStep(target);
    });
  });
  $("bindDeviceButton").addEventListener("click", async () => {
    await flashApi.bindDevice();
    renderBadge();
  });
  $("operatorButton").addEventListener("click", (event) => {
    const screen = document.querySelector(".phone-stage").dataset.screen;
    if (event.altKey) {
      showScreen("operatorScreen");
      return;
    }
    if (screen === "feedScreen") {
      showScreen("createScreen");
      return;
    }
    if (screen === "badgeScreen") {
      showScreen("storeScreen");
      return;
    }
    if (screen === "storeScreen") {
      showScreen("profileScreen");
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
    if (screen === "ipScreen") {
      showScreen("createScreen");
      return;
    }
    showScreen("operatorScreen");
  });
  $("profileButton").addEventListener("click", () => {
    const screen = document.querySelector(".phone-stage").dataset.screen;
    if (screen === "storeScreen") {
      showScreen("badgeScreen");
    } else if (screen === "commentScreen") {
      showScreen("feedScreen");
    } else if (screen === "createScreen") {
      showScreen("profileScreen");
    } else if (screen !== "friendsScreen") {
      showScreen("profileScreen");
    }
  });

  $("likeButton").addEventListener("click", async () => {
    const button = $("likeButton");
    const packId = activePack().id;
    setButtonBusy(button, true);
    try {
      await flashApi.recordInteraction(packId, "like");
      await reloadPacks(packId);
      pulseButton(button);
    } finally {
      setButtonBusy(button, false);
    }
  });
  $("saveButton").addEventListener("click", async () => {
    const button = $("saveButton");
    const packId = activePack().id;
    setButtonBusy(button, true);
    try {
      await flashApi.recordInteraction(packId, "save");
      await reloadPacks(packId);
      pulseButton(button);
    } finally {
      setButtonBusy(button, false);
    }
  });
  $("commentButton").addEventListener("click", async () => {
    await openComments(activePack());
  });
  let feedTouchStartX = 0;
  let feedTouchStartY = 0;
  let feedTouchStartAt = 0;
  let feedWheelDeltaY = 0;
  let feedWheelResetTimer = null;
  $("feedCard").addEventListener("touchstart", (event) => {
    if (event.target.closest("button, textarea, input")) return;
    const touch = event.changedTouches[0];
    feedTouchStartX = touch.clientX;
    feedTouchStartY = touch.clientY;
    feedTouchStartAt = Date.now();
  }, { passive: true });
  $("feedCard").addEventListener("touchend", (event) => {
    if (!feedTouchStartAt || state.feedAnimating) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - feedTouchStartX;
    const deltaY = touch.clientY - feedTouchStartY;
    const elapsed = Math.max(Date.now() - feedTouchStartAt, 1);
    moveFeed(getVerticalFeedDelta(deltaX, deltaY, elapsed));
    feedTouchStartAt = 0;
  }, { passive: true });
  $("feedCard").addEventListener("touchcancel", () => {
    feedTouchStartAt = 0;
  }, { passive: true });
  $("feedCard").addEventListener("wheel", (event) => {
    if (!isFeedScreenVisible()) return;
    if (event.target.closest("textarea, input, select")) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) * FEED_SWIPE_MIN_DOMINANCE) return;
    event.preventDefault();
    if (state.feedAnimating) return;
    feedWheelDeltaY += event.deltaY;
    if (feedWheelResetTimer) window.clearTimeout(feedWheelResetTimer);
    feedWheelResetTimer = window.setTimeout(() => {
      feedWheelDeltaY = 0;
      feedWheelResetTimer = null;
    }, FEED_WHEEL_RESET_MS);
    if (Math.abs(feedWheelDeltaY) < FEED_WHEEL_THRESHOLD) return;
    const nextDelta = feedWheelDeltaY > 0 ? 1 : -1;
    feedWheelDeltaY = 0;
    if (feedWheelResetTimer) window.clearTimeout(feedWheelResetTimer);
    feedWheelResetTimer = null;
    moveFeed(nextDelta);
  }, { passive: false });
  document.addEventListener("keydown", (event) => {
    if (!isFeedScreenVisible() || event.defaultPrevented) return;
    if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;
    const feedDelta = FEED_KEY_DELTAS[event.key];
    if (!feedDelta) return;
    event.preventDefault();
    moveFeed(feedDelta);
  });
  if ($("feedRecommendButton")) $("feedRecommendButton").addEventListener("click", () => showScreen("feedScreen"));
  if ($("feedZoneButton")) $("feedZoneButton").addEventListener("click", () => showScreen("ipScreen"));
  if ($("feedPersonaButton")) $("feedPersonaButton").addEventListener("click", () => showScreen("badgeScreen"));
  $("ipSearchInput").addEventListener("input", (event) => {
    state.ipSearchQuery = event.target.value;
    renderIpCommunity();
  });
  $("applyIpEntryButton").addEventListener("click", async () => {
    const result = await flashApi.applyIpEntry("用户申请的新 IP", "从专区页提交的 IP 入池申请。");
    showIpMessage(result.accepted ? "IP 入池申请已提交，审核通过后会出现在 IP 池。" : "IP 入池申请暂时无法提交。");
  });
  $("collectAnimeIpButton").addEventListener("click", async () => {
    const button = $("collectAnimeIpButton");
    setButtonBusy(button, true);
    try {
      const result = await flashApi.collectAnimeIpPool({
        query: state.ipSearchQuery,
        limit: state.ipSearchQuery ? 6 : 4,
      });
      state.animeCollectionResult = result;
      if (result.importedIpIds?.length) state.selectedIpPoolId = result.importedIpIds[0];
      showIpMessage(result.addedIpCount
        ? `已补充 ${result.addedIpCount} 个动漫 IP 和 ${result.addedPersonaCount} 个角色。`
        : "没有发现新的动漫 IP 候选。");
      renderCreateControls();
      await renderIpCommunity();
    } finally {
      setButtonBusy(button, false);
    }
  });
  $("postCommentButton").addEventListener("click", async () => {
    const button = $("postCommentButton");
    const pack = commentPack();
    const body = $("commentInput").value.trim();
    if (!body) {
      showCommentMessage("先写一句评论再发布。");
      return;
    }
    setButtonBusy(button, true);
    try {
      const result = await flashApi.postComment(pack.id, body);
      $("commentInput").value = "";
      showCommentMessage(result.item?.status === "pending_review" ? "评论已提交，因风险词进入复核。" : "评论已发布。");
      await reloadPacks(pack.id);
      await renderComments();
    } finally {
      setButtonBusy(button, false);
    }
  });

  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      if (state.draftGenerating) return;
      showScreen(tab.dataset.target);
    });
  });

  document.querySelectorAll(".template").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedTemplate = button.dataset.template;
      renderTemplateControls();
      renderCreateControls();
      if (state.draft) renderDraft(applyDraftEdits(state.draft));
      updateCreateReadiness();
    });
  });

  $("promptInput").addEventListener("input", () => {
    showCreateError();
    updateCreateReadiness();
  });

  $("promptExampleButton").addEventListener("click", () => {
    applyPromptExample("original");
  });

  $("promptFanworkExampleButton").addEventListener("click", () => {
    applyPromptExample("fanwork");
  });

  $("createWizardNav").addEventListener("click", (event) => {
    const advancedToggle = event.target.closest("[data-create-advanced-toggle]");
    if (advancedToggle) {
      state.createGuideAdvanced = !state.createGuideAdvanced;
      if (!createVisibleWizardSteps().some((step) => step.id === state.createWizardStep)) {
        state.createWizardStep = state.draft ? "preview" : "prompt";
      }
      renderCreateWizard();
      return;
    }
    const button = event.target.closest("[data-create-step-target]");
    if (!button) return;
    setCreateWizardStep(button.dataset.createStepTarget);
  });

  $("createCardDeck").addEventListener("scroll", () => {
    if (Date.now() < suppressCreateDeckSyncUntil) return;
    window.clearTimeout(createDeckScrollTimer);
    createDeckScrollTimer = window.setTimeout(syncCreateStepFromDeck, 120);
  }, { passive: true });

  $("createWizardPrevButton").addEventListener("click", () => {
    const visibleSteps = createVisibleWizardSteps();
    const previous = visibleSteps[createWizardStepIndex() - 1];
    if (previous) setCreateWizardStep(previous.id);
  });

  $("createWizardNextButton").addEventListener("click", () => {
    const current = state.createWizardStep;
    if (current === "prompt" && !$("promptInput").value.trim()) {
      $("promptInput").focus();
      updateCreateReadiness();
      return;
    }
    if (current === "prompt") {
      setCreateWizardStep("settings");
      return;
    }
    if (current === "settings" && !state.draft) {
      if (!validateCreateOptions(createOptionsFromForm())) return;
      runDraftGeneration();
      return;
    }
    const visibleSteps = createVisibleWizardSteps();
    const next = visibleSteps[createWizardStepIndex() + 1];
    if (next) setCreateWizardStep(next.id);
  });

  $("generateButton").addEventListener("click", runDraftGeneration);
  $("createScreen").addEventListener("click", async (event) => {
    if (event.target.closest("[data-prompt-polish-open]")) {
      openPromptPolishResult();
      return;
    }
    if (event.target.closest("[data-prompt-polish-close]")) {
      closePromptPolishModal();
      return;
    }
    if (event.target.closest("[data-persona-picker-close]")) {
      closePersonaPickerModal();
      return;
    }
    const scriptButton = event.target.closest("[data-script-scene-open]");
    if (scriptButton) {
      openScriptSceneModal(scriptButton.dataset.scriptSceneOpen);
      return;
    }
    if (event.target.closest("[data-script-scene-close]")) {
      closeScriptSceneModal();
      return;
    }
    const stepAiToggle = event.target.closest("[data-step-ai-toggle]");
    if (stepAiToggle) {
      const panel = stepAiToggle.closest("[data-step-ai-panel]");
      const collapsed = panel?.classList.toggle("collapsed");
      stepAiToggle.textContent = collapsed ? "展开" : "收起";
      return;
    }
    const stepAiButton = event.target.closest("[data-step-ai-apply]");
    if (stepAiButton) {
      await requestStepAiEdit(stepAiButton.dataset.stepAiApply, stepAiButton);
      return;
    }
    if (event.target.closest("[data-step-ai-accept]")) {
      const panel = event.target.closest("[data-step-ai-panel]");
      if (panel?.dataset.stepAiPanel === "prompt" && state.promptEdit.proposal) {
        const proposal = state.promptEdit.proposal;
        $("promptInput").value = proposal.after;
        if (proposal.suggestedTemplate && TEMPLATE_PRESETS[proposal.suggestedTemplate]) {
          state.selectedTemplate = proposal.suggestedTemplate;
          renderTemplateControls();
        }
        if (proposal.ipSuggestion?.id) {
          state.selectedOrigin = "fanwork";
          state.selectedIpId = proposal.ipSuggestion.id;
          state.selectedPersona = "";
          state.useCustomPersona = false;
          state.createIpSearchQuery = "";
          state.fanworkRightsAccepted = false;
          renderCreateControls();
        }
        state.promptEdit.proposal = null;
        showCreateError();
        updateCreateReadiness();
        closePromptPolishModal();
        setCreateWizardStep("settings");
        return;
      }
      applyAiEditProposal();
      setStepAiResult(panel, "已应用 AI 修改，发布检查已重新计算。", "success");
      return;
    }
    if (event.target.closest("[data-step-ai-discard]")) {
      const panel = event.target.closest("[data-step-ai-panel]");
      if (panel?.dataset.stepAiPanel === "prompt") state.promptEdit.proposal = null;
      discardAiEditProposal();
      setStepAiResult(panel, "已放弃这次修改提案。", "info");
    }
  });
  $("createScreen").addEventListener("input", (event) => {
    if ((event.target.id === "draftScriptText" || event.target.id === "scriptSceneEditor") && state.draft) {
      event.target.dataset.userEdited = "true";
      if (event.target.id === "draftScriptText") {
        state.draft.stageScriptText = event.target.value;
      }
      state.draft.updatedAt = Date.now();
      return;
    }
    if ((event.target.id === "draftTitleInput" || event.target.id === "draftTagsInput") && state.draft) {
      applyDraftEdits(state.draft);
      renderDraft(state.draft);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("promptPolishModal")?.classList.contains("hidden")) {
      closePromptPolishModal();
    }
    if (event.key === "Escape" && !$("personaPickerModal")?.classList.contains("hidden")) {
      closePersonaPickerModal();
    }
    if (event.key === "Escape" && !$("scriptSceneModal")?.classList.contains("hidden")) {
      closeScriptSceneModal();
    }
  });
  window.addEventListener("resize", resizePromptInput);
  $("createScreen").addEventListener("change", (event) => {
    const characterToggle = event.target.closest("[data-character-enabled]");
    if (!characterToggle || !state.draft) return;
    const key = characterToggle.dataset.characterEnabled;
    const character = (state.draft.characters || []).find((item) => draftCharacterKey(item) === key || item.name === key);
    if (!character) return;
    character.enabled = characterToggle.checked;
    characterToggle.closest("label")?.querySelector("span")?.replaceChildren(document.createTextNode(character.enabled ? "出场" : "备用"));
    state.draft.updatedAt = Date.now();
  });
  $("createScreen").addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-character-delete]");
    if (!deleteButton || !state.draft) return;
    removeDraftCharacter(deleteButton.dataset.characterDelete);
  });
  $("saveScriptSceneButton").addEventListener("click", saveScriptSceneModal);
  $("generationRetryButton").addEventListener("click", runDraftGeneration);
  $("generationBackButton").addEventListener("click", () => {
    resetGenerationWorkbench();
    state.createGuideAdvanced = false;
    state.createWizardStep = "prompt";
    renderCreateWizard();
    updateCreateReadiness();
  });
  $("aiEditInput").addEventListener("input", (event) => {
    state.aiEdit.prompt = event.target.value;
  });
  $("aiEditScopes").addEventListener("click", (event) => {
    const button = event.target.closest("[data-ai-edit-scope]");
    if (!button) return;
    state.aiEdit.scopeType = button.dataset.aiEditScope;
    renderAiEditPanel();
  });
  $("askAiEditButton").addEventListener("click", requestAiEditProposal);
  $("undoAiEditButton").addEventListener("click", undoAiEdit);

  $("assetPlanList").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-generate-asset]");
    if (!button) return;
    await generateDraftAssetImage(Number(button.dataset.generateAsset), button);
  });

  $("publishDraftButton").addEventListener("click", async () => {
    if (!state.draft || state.draftPublishing) return;
    const options = createOptionsFromForm();
    if (!validateCreateOptions(options)) return;
    const button = $("publishDraftButton");
    const draftToPublish = prepareDraftForPublish(state.draft);
    const checklist = createPublishChecklist(draftToPublish, { qualityChecks: createDraftQualityChecks(draftToPublish) });
    if (checklist.status === "blocked") {
      renderDraftQuality(draftToPublish);
      setCreateProgress("发布前检查未通过，请先修复阻塞项。", "error");
      showToast("发布检查未通过。");
      return;
    }
    const draftKey = draftToPublish.publishFingerprint || workFingerprint(draftToPublish);
    if (!state.editingWorkId && state.publishedDraftKeys.has(draftKey)) {
      setCreateProgress("这个草稿已经发布过了，避免生成重复作品。修改标题或剧本后可以再次发布。", "warning");
      showToast("这个草稿已经发布过了。");
      return;
    }
    state.draftPublishing = true;
    let publishSucceeded = false;
    setCreateProgress(state.editingWorkId ? "正在保存作品更新，请稍等。" : "正在发布到首页和我的作品，请稍等。", "info");
    button.dataset.idleText = state.editingWorkId ? "保存更新" : "发布";
    setButtonBusy(button, true, state.editingWorkId ? "保存中" : "发布中");
    try {
      const response = state.editingWorkId && flashApi.updateWork
        ? await flashApi.updateWork(state.editingWorkId, { ...draftToPublish, id: state.editingWorkId })
        : await flashApi.publishDraft(draftToPublish);
      state.publishedDraftKeys.add(draftKey);
      state.lastPublishedPackId = response.item?.id || null;
      state.draft = null;
      state.createGuideAdvanced = false;
      const wasEditing = Boolean(state.editingWorkId);
      state.editingWorkId = null;
      state.createWizardStep = "prompt";
      $("draftPreview").classList.add("hidden");
      $("promptInput").value = "";
      await reloadPacks(response.item?.id);
      showScreen(wasEditing ? "profileScreen" : "feedScreen");
      showToast(wasEditing ? "作品已更新。" : "已发布到内容流。");
      publishSucceeded = true;
    } catch (error) {
      setCreateProgress(state.editingWorkId ? "保存失败，请检查网络或稍后重试。" : "发布失败，请检查网络或稍后重试。", "error");
      showToast(state.editingWorkId ? "保存失败，请稍后重试。" : "发布失败，请稍后重试。");
    } finally {
      state.draftPublishing = false;
      setButtonBusy(button, false);
      $("publishDraftButton").textContent = state.editingWorkId ? "保存更新" : "发布";
      if (publishSucceeded) setCreateProgress();
      updateCreateReadiness();
    }
  });

  $("requestIpButton").addEventListener("click", () => {
    showScreen("ipScreen");
  });
}

async function init() {
  await reloadPacks();
  renderChrome(document.querySelector(".phone-stage").dataset.screen || "feedScreen");
  renderCreateControls();
  wireEvents();
}

init().catch((error) => {
  console.error(error);
  document.body.innerHTML = `<pre>${error.stack || error.message}</pre>`;
});
