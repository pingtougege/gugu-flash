import { createHttpFlashApi } from "../../../packages/api-client/src/http-flash-api.js";
import {
  contentOriginLabel,
  formatNumber,
  hardwareStatusLabel,
  scorePack,
  storeStatusLabel,
} from "../../../packages/core/src/index.js";

const DEFAULT_API_BASE = "http://127.0.0.1:4188";
const STORAGE_KEYS = {
  apiBase: "gugu-flash:operator-api-base",
  token: "gugu-flash:operator-token",
};

const navItems = [
  ["overview", "总览", "⌂"],
  ["works", "作品", "▦"],
  ["ips", "IP池", "◇"],
  ["review", "审核", "✓"],
  ["governance", "治理", "!"],
  ["store", "商店", "¥"],
  ["hardware", "硬件", "⬡"],
  ["commerce", "结算", "≋"],
  ["trending", "趋势", "↗"],
  ["sla", "SLA", "⏱"],
  ["support", "支持", "?"],
  ["logs", "日志", "≡"],
];

const ipTabs = [
  { id: "overview", label: "概览", detail: "热度 / 风险", panelId: "ipOverviewPanel" },
  { id: "collect", label: "采集入池", detail: "搜索 / 扫库", panelId: "ipCollectorPanel" },
  { id: "inventory", label: "资产库", detail: "筛选 / 专区", panelId: "ipInventoryPanel" },
  { id: "candidates", label: "候选队列", detail: "导入 / 补全", panelId: "ipCandidatePanel" },
  { id: "personas", label: "角色目录", detail: "简介 / 权利", panelId: "ipPersonaPanel" },
];

const actionPendingLabels = {
  "inspect-ip": "查看中...",
  "collect-candidate": "收集中...",
  "deep-characters": "深挖中...",
  "collect-deep-characters": "补全中...",
  "deep-collect-characters": "深挖补全中...",
  "apply-zone": "申请中...",
  "approve-review": "通过中...",
  "reject-review": "驳回中...",
  "governance-primary": "处理中...",
  "governance-secondary": "处理中...",
  "advance-store": "推进中...",
  "freeze-store": "冻结中...",
  "delist-store": "下架中...",
  "reject-store": "驳回中...",
  "mark-candidate": "标记中...",
  "mark-ready": "标记中...",
  "approve-hardware": "复核中...",
  "publish-hardware": "发布中...",
  "export-hardware": "导出中...",
  "release-settlement": "释放中...",
};

const state = {
  activeSection: "overview",
  activeIpTab: "overview",
  focusedIpId: "",
  apiBase: initialApiBase(),
  token: localStorage.getItem(STORAGE_KEYS.token) || "demo-operator",
  dashboard: null,
  metrics: null,
  sla: null,
  moderationActions: [],
  trending: [],
  logs: [],
  works: [],
  ips: [],
  ipCollection: {
    query: "",
    limit: 6,
    includeExisting: true,
    loading: false,
    operation: "",
    source: "",
    candidates: [],
    feedback: {},
    message: "输入 IP、角色、别名或题材关键词，先预览完整角色与权利提示；也可以实时联网搜索公开知识库，把没有的 IP 入池、已有的 IP 补全角色。",
    lastResult: null,
  },
  pendingActions: new Set(),
  tables: {
    works: {
      query: "",
      origin: "all",
      status: "all",
      sort: "heat",
      page: 1,
      pageSize: 20,
    },
    ips: {
      query: "",
      type: "all",
      status: "all",
      sort: "heat",
      page: 1,
      pageSize: 20,
    },
  },
};

let api = createApi();
let toastTimer = null;

const $ = (id) => document.getElementById(id);

function initialApiBase() {
  const params = new URLSearchParams(window.location.search);
  return params.get("apiBase") || localStorage.getItem(STORAGE_KEYS.apiBase) || DEFAULT_API_BASE;
}

function createApi() {
  return createHttpFlashApi({
    baseUrl: state.apiBase,
    getToken: () => state.token || "",
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function statusClass(status = "") {
  if (["active", "listed", "available", "ready", "ok", "passed", "approved", "released"].includes(status)) return "good";
  if (["rights_review", "production_queued", "producing", "pack_review", "open", "pending"].includes(status)) return "warn";
  if (["rejected", "delisted", "frozen", "failed", "blocked", "breached"].includes(status)) return "bad";
  return "neutral";
}

function formatDate(value) {
  const ts = Number(value);
  if (!Number.isFinite(ts) || ts <= 0) return "未知时间";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function formatDuration(ms = 0) {
  const value = Number(ms) || 0;
  if (value < 60_000) return `${Math.round(value / 1000)} 秒`;
  if (value < 3_600_000) return `${Math.round(value / 60_000)} 分钟`;
  if (value < 86_400_000) return `${Math.round(value / 3_600_000)} 小时`;
  return `${Math.round(value / 86_400_000)} 天`;
}

function showToast(message, tone = "info") {
  clearTimeout(toastTimer);
  const toast = $("toast");
  toast.textContent = message;
  toast.className = `toast ${tone}`;
  toastTimer = setTimeout(() => toast.classList.add("hidden"), 2800);
}

function actionPendingLabel(action) {
  return actionPendingLabels[action] || "执行中...";
}

function actionKey(action, id) {
  return `${action}:${id}`;
}

function isActionPending(action, id) {
  return state.pendingActions.has(actionKey(action, id));
}

function actionButtonState(action, id, { disabled = false } = {}) {
  const pending = isActionPending(action, id);
  return {
    pending,
    attrs: `${disabled || pending ? "disabled" : ""} ${pending ? 'aria-busy="true"' : ""}`,
    className: pending ? "is-busy" : "",
  };
}

function setButtonBusy(button, pending, label = "执行中...") {
  if (!button) return;
  if (pending) {
    button.dataset.idleLabel = button.textContent;
    button.textContent = label;
    button.disabled = true;
    button.classList.add("is-busy");
    button.setAttribute("aria-busy", "true");
    return;
  }
  if (button.dataset.idleLabel) button.textContent = button.dataset.idleLabel;
  delete button.dataset.idleLabel;
  button.classList.remove("is-busy");
  button.removeAttribute("aria-busy");
  button.disabled = false;
}

function setIpCollectionOperation(operation, message) {
  state.ipCollection.operation = operation;
  state.ipCollection.loading = true;
  state.ipCollection.message = message;
}

function clearIpCollectionOperation() {
  state.ipCollection.loading = false;
  state.ipCollection.operation = "";
}

function setCandidateFeedback(ipId, tone, message) {
  if (!ipId) return;
  state.ipCollection.feedback = {
    ...state.ipCollection.feedback,
    [ipId]: { tone, message },
  };
}

function clearCandidateFeedback() {
  state.ipCollection.feedback = {};
}

function candidateFeedback(ipId) {
  return state.ipCollection.feedback?.[ipId] || null;
}

function setConnectionStatus(text, tone = "neutral") {
  const pill = $("connectionStatus");
  pill.textContent = text;
  pill.className = `status-pill ${tone}`;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function clampPage(page, totalPages) {
  return Math.max(1, Math.min(Number(page) || 1, Math.max(1, totalPages)));
}

function paginate(items, tableState) {
  const pageSize = Number(tableState.pageSize) || 20;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = clampPage(tableState.page, totalPages);
  tableState.page = page;
  const start = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    total: items.length,
    totalPages,
    start,
    end: Math.min(start + pageSize, items.length),
    items: items.slice(start, start + pageSize),
  };
}

function normalizeSearchText(value) {
  return String(value || "").trim().toLowerCase();
}

function includesQuery(values, query) {
  if (!query) return true;
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

function metricValue(pack, key) {
  return Number(pack?.metrics?.[key] || 0);
}

function packHeat(pack) {
  return Math.max(0, Math.round(scorePack(pack)));
}

function completionLabel(pack) {
  return `${Math.round((Number(pack?.metrics?.completionRate) || 0) * 100)}%`;
}

function packStoreStatus(pack) {
  return pack?.storeListing?.status || pack?.storeStatus || "not_applied";
}

function workStatusBucket(pack, bucket) {
  const pendingStoreStatuses = new Set(["rights_review", "production_queued", "producing", "pack_review"]);
  const storeStatus = packStoreStatus(pack);
  if (bucket === "all") return true;
  if (bucket === "listed") return storeStatus === "listed";
  if (bucket === "store_pending") return pendingStoreStatuses.has(storeStatus);
  if (bucket === "candidate") return pack.hardwareStatus === "hardware_candidate";
  if (bucket === "ready") return pack.hardwareStatus === "hardware_ready";
  if (bucket === "h5_only") return pack.hardwareStatus === "h5_only";
  if (bucket === "risk") return metricValue(pack, "reports") > 0 || ["frozen", "rejected", "delisted"].includes(storeStatus);
  return true;
}

function ipTypeLabel(type) {
  return {
    platform_original: "平台原创",
    community_fan_ip: "社区IP",
    local_anime_ip: "本地动漫",
    mainstream_external_ip: "主流外部",
  }[type] || type || "未分类";
}

function ipStatusBucket(item, bucket) {
  if (bucket === "all") return true;
  if (bucket === "open") return item.hasZone || item.zoneStatus === "open";
  if (bucket === "eligible") return Boolean(item.zoneEligibility?.eligible);
  if (bucket === "not_open") return !item.hasZone;
  if (bucket === "risk") return item.governanceStatus !== "active" || Number(item.stats?.recentViolationRate || 0) > 0.05;
  return true;
}

function personaIntro(persona = {}) {
  return persona.tagline || persona.description || persona.summary || "暂无角色简介，待运营补充。";
}

function isRouteNotFound(error) {
  return error?.status === 404 || error?.payload?.message === "route_not_found";
}

function candidateMatchesIp(candidate = {}, ipId = "") {
  return [candidate.id, candidate.ipId, candidate.duplicateIpId, candidate.ipEntry?.id]
    .filter(Boolean)
    .some((value) => value === ipId);
}

function candidatePersonaCount(candidate = {}) {
  return asArray(candidate.personas || candidate.characters).length;
}

function renderPersonaCards(personas = [], { compact = false } = {}) {
  const items = asArray(personas);
  if (!items.length) return `<div class="empty-state compact-empty">暂无角色，需补充角色和简介后再用于创作归属。</div>`;
  return items.map((persona) => `
    <article class="persona-card ${compact ? "compact" : ""}">
      <span class="persona-avatar">${escapeHtml(persona.avatar || "•")}</span>
      <div>
        <strong>${escapeHtml(persona.name || persona.id || "未命名角色")}</strong>
        <small>${escapeHtml(persona.id || "persona")}${persona.roleType ? ` · ${escapeHtml(persona.roleType)}` : ""}</small>
        <p>${escapeHtml(personaIntro(persona))}</p>
      </div>
    </article>
  `).join("");
}

function renderPersonaSummary(personas = []) {
  const items = asArray(personas).slice(0, 2);
  if (!items.length) return `<small>暂无角色简介</small>`;
  return `
    <div class="persona-summary-list">
      ${items.map((persona) => `
        <span><b>${escapeHtml(persona.avatar || "")} ${escapeHtml(persona.name || persona.id)}</b>：${escapeHtml(personaIntro(persona))}</span>
      `).join("")}
      ${asArray(personas).length > 2 ? `<span>另有 ${asArray(personas).length - 2} 个角色，见下方角色简介总览。</span>` : ""}
    </div>
  `;
}

function renderPersonaNamePreview(personas = []) {
  const items = asArray(personas);
  if (!items.length) return "无分身";
  const preview = items.slice(0, 4).map((persona) => persona.name || persona.id).filter(Boolean);
  const remaining = items.length - preview.length;
  return remaining > 0
    ? `${preview.join(" / ")} 等 ${formatNumber(items.length)} 个角色`
    : preview.join(" / ");
}

function syncTableControls(tableName) {
  const tableState = state.tables[tableName];
  for (const control of document.querySelectorAll(`[data-table="${tableName}"][data-field]`)) {
    const value = String(tableState[control.dataset.field] ?? "");
    if (control.value !== value) control.value = value;
  }
}

function renderTableFooter(tableName, pageInfo) {
  return `
    <div class="table-footer">
      <span>${pageInfo.total ? `${pageInfo.start + 1}-${pageInfo.end}` : "0-0"} / ${formatNumber(pageInfo.total)}</span>
      <div class="pagination-actions">
        <button data-page-table="${tableName}" data-page-action="prev" ${pageInfo.page <= 1 ? "disabled" : ""} type="button">上一页</button>
        <span>${pageInfo.page} / ${pageInfo.totalPages}</span>
        <button data-page-table="${tableName}" data-page-action="next" ${pageInfo.page >= pageInfo.totalPages ? "disabled" : ""} type="button">下一页</button>
      </div>
    </div>
  `;
}

function renderNav() {
  $("navList").innerHTML = navItems.map(([id, label, icon]) => `
    <button class="${state.activeSection === id ? "active" : ""}" data-section="${id}" type="button">
      <span>${icon}</span>
      <strong>${label}</strong>
    </button>
  `).join("");
}

function ipPersonaCount(items = state.ips) {
  return items.reduce((sum, item) => sum + asArray(item.personas).length, 0);
}

function ipTabBadge(tabId) {
  if (tabId === "overview") return formatNumber(state.ips.length);
  if (tabId === "collect") return state.ipCollection.loading ? "采集中" : "就绪";
  if (tabId === "inventory") return formatNumber(filteredIps().length);
  if (tabId === "candidates") return formatNumber(state.ipCollection.candidates.length);
  if (tabId === "personas") return formatNumber(ipPersonaCount(filteredIps()));
  return "";
}

function syncIpTab() {
  const activeTab = ipTabs.some((tab) => tab.id === state.activeIpTab) ? state.activeIpTab : ipTabs[0].id;
  state.activeIpTab = activeTab;
  for (const button of document.querySelectorAll("[data-ip-tab]")) {
    const selected = button.dataset.ipTab === activeTab;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.removeAttribute("tabindex");
  }
  for (const tab of ipTabs) {
    const panel = $(tab.panelId);
    if (!panel) continue;
    const selected = tab.id === activeTab;
    panel.hidden = !selected;
    panel.classList.toggle("active", selected);
  }
}

function renderIpTabs() {
  const container = $("ipTabList");
  if (!container) return;
  container.innerHTML = ipTabs.map((tab) => `
    <button
      class="${state.activeIpTab === tab.id ? "active" : ""}"
      id="ipTab-${tab.id}"
      data-ip-tab="${tab.id}"
      role="tab"
      aria-controls="${tab.panelId}"
      aria-selected="${state.activeIpTab === tab.id}"
      type="button"
    >
      <span>
        <strong>${escapeHtml(tab.label)}</strong>
        <small>${escapeHtml(tab.detail)}</small>
      </span>
      <em>${escapeHtml(ipTabBadge(tab.id))}</em>
    </button>
  `).join("");
  syncIpTab();
}

function showIpTab(tabId) {
  state.activeIpTab = ipTabs.some((tab) => tab.id === tabId) ? tabId : ipTabs[0].id;
  syncIpTab();
}

function focusIpPersona(item) {
  if (!item) return;
  state.focusedIpId = item.id;
  state.tables.ips.query = item.name || item.id;
  state.tables.ips.page = 1;
  renderIpPool();
  showIpTab("personas");
  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-persona-ip-id="${CSS.escape(item.id)}"]`);
    card?.scrollIntoView({ block: "start", behavior: "smooth" });
  });
}

function showSection(sectionId) {
  state.activeSection = sectionId;
  for (const section of document.querySelectorAll(".section")) {
    section.classList.toggle("active", section.id === `section-${sectionId}`);
  }
  const nav = navItems.find(([id]) => id === sectionId);
  $("pageTitle").textContent = nav ? `${nav[1]}管理` : "运营管理";
  if (sectionId === "overview") $("pageTitle").textContent = "运营总览";
  if (sectionId === "works") $("pageTitle").textContent = "作品库管理";
  if (sectionId === "ips") $("pageTitle").textContent = "IP池管理";
  if (sectionId === "ips") syncIpTab();
  renderNav();
}

function renderSummary() {
  const counts = state.dashboard?.counts || {};
  const cards = [
    ["公开内容", counts.public || 0, "H5 / 候选 / 硬件内容"],
    ["审核任务", counts.reviewOpen || 0, "权利审核与设备包复核"],
    ["治理工单", counts.governanceOpen || 0, "举报 / 投诉 / 申诉"],
    ["制作队列", counts.hardwareQueue || 0, "设备包生产链路"],
    ["上架中", counts.storePending || 0, "商店待推进状态"],
    ["冻结结算", counts.settlementFrozen || 0, "等待复核释放"],
    ["硬件候选", counts.candidate || 0, "可进入官方适配"],
    ["商店已上架", counts.storeListed || 0, "可购买 / 下载 / 同步"],
  ];
  $("summaryGrid").innerHTML = cards.map(([label, value, detail]) => `
    <article class="summary-card">
      <span>${escapeHtml(label)}</span>
      <strong>${formatNumber(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `).join("");
}

function renderPriority() {
  const review = asArray(state.dashboard?.reviewTasks).slice(0, 3);
  const governance = asArray(state.dashboard?.governanceCases).slice(0, 3);
  const hardware = asArray(state.dashboard?.hardwareQueue).filter((item) => item.progress < 100).slice(0, 2);
  const items = [
    ...review.map((item) => ({ kind: "审核", title: item.title, detail: item.reason, section: "review" })),
    ...governance.map((item) => ({ kind: item.caseTypeLabel, title: item.title, detail: item.reason, section: "governance" })),
    ...hardware.map((item) => ({ kind: "硬件", title: item.title, detail: `${item.stageLabel} · ${item.progress}%`, section: "hardware" })),
  ].slice(0, 8);
  $("priorityCount").textContent = `${items.length} 项`;
  $("priorityList").innerHTML = items.length ? items.map((item) => `
    <button class="priority-row" data-jump="${item.section}" type="button">
      <span>${escapeHtml(item.kind)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </button>
  `).join("") : emptyState("当前没有需要立即处置的事项。");
}

function renderHealth() {
  const metrics = state.metrics;
  if (!metrics) {
    $("serviceStatus").textContent = "未连接";
    $("opsHealth").innerHTML = emptyState("等待 Backend Alpha 指标。");
    return;
  }
  $("serviceStatus").textContent = metrics.status || "ok";
  const requestCount = Object.values(metrics.requests?.byStatusCode || {}).reduce((sum, value) => sum + value, 0);
  $("opsHealth").innerHTML = `
    <div><strong>${escapeHtml(metrics.healthChecks?.api || "unknown")}</strong><span>API</span></div>
    <div><strong>${escapeHtml(metrics.healthChecks?.persistence || "unknown")}</strong><span>持久化</span></div>
    <div><strong>${escapeHtml(metrics.healthChecks?.authMode || "unknown")}</strong><span>认证模式</span></div>
    <div><strong>${formatDuration(metrics.uptimeMs)}</strong><span>运行时长</span></div>
    <div><strong>${requestCount}</strong><span>请求数</span></div>
    <div><strong>${metrics.requests?.maxDurationMs || 0}ms</strong><span>最慢请求</span></div>
  `;
}

function filteredWorks() {
  const tableState = state.tables.works;
  const query = normalizeSearchText(tableState.query);
  const works = (state.works.length ? state.works : asArray(state.dashboard?.items))
    .filter((work) => includesQuery([
      work.id,
      work.title,
      work.author?.name,
      work.author?.id,
      work.ipName,
      work.ipId,
      work.persona?.name,
      work.zoneName,
      work.tags,
    ], query))
    .filter((work) => tableState.origin === "all" || work.contentOrigin === tableState.origin)
    .filter((work) => workStatusBucket(work, tableState.status));

  return [...works].sort((a, b) => {
    if (tableState.sort === "plays") return metricValue(b, "plays") - metricValue(a, "plays");
    if (tableState.sort === "updated") return (b.updatedAt || 0) - (a.updatedAt || 0);
    if (tableState.sort === "reports") return metricValue(b, "reports") - metricValue(a, "reports");
    if (tableState.sort === "completion") return (b.metrics?.completionRate || 0) - (a.metrics?.completionRate || 0);
    return packHeat(b) - packHeat(a);
  });
}

function renderWorkStats(works) {
  const listed = works.filter((work) => packStoreStatus(work) === "listed").length;
  const storePending = works.filter((work) => workStatusBucket(work, "store_pending")).length;
  const candidates = works.filter((work) => work.hardwareStatus === "hardware_candidate").length;
  const reported = works.filter((work) => metricValue(work, "reports") > 0).length;
  const totalHeat = works.reduce((sum, work) => sum + packHeat(work), 0);
  $("worksStats").innerHTML = [
    ["作品总量", works.length, "当前 feed 可运营作品"],
    ["总热度", totalHeat, "赞藏播放复合分"],
    ["商店上架", listed, "可购买 / 下载 / 同步"],
    ["制作候选", candidates, "可推进硬件适配"],
    ["上架流程", storePending, "权利 / 制作 / 复核中"],
    ["风险作品", reported, "举报或冻结状态"],
  ].map(([label, value, detail]) => `
    <article class="table-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${formatNumber(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `).join("");
}

function renderWorksLibrary() {
  syncTableControls("works");
  const sourceWorks = state.works.length ? state.works : asArray(state.dashboard?.items);
  renderWorkStats(sourceWorks);
  const pageInfo = paginate(filteredWorks(), state.tables.works);
  $("worksTable").innerHTML = pageInfo.total ? `
    <table>
      <thead>
        <tr>
          <th>作品</th>
          <th>IP / 分身</th>
          <th>热度</th>
          <th>互动信号</th>
          <th>运营状态</th>
          <th>更新时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${pageInfo.items.map((work) => {
          const storeStatus = packStoreStatus(work);
          return `
            <tr>
              <td>
                <strong>${escapeHtml(work.title)}</strong>
                <small>${escapeHtml(work.id)} · ${escapeHtml(contentOriginLabel(work.contentOrigin))}</small>
              </td>
              <td>
                <strong>${escapeHtml(work.ipName || work.ipId || "独立原创")}</strong>
                <small>${escapeHtml(work.persona?.name || "未绑定分身")} · ${escapeHtml(work.zoneName || work.zoneId || "未入专区")}</small>
              </td>
              <td>
                <strong class="heat-score">${formatNumber(packHeat(work))}</strong>
                <small>热度分</small>
              </td>
              <td>
                <div class="metric-stack">
                  <span>${formatNumber(metricValue(work, "plays"))} 播放</span>
                  <span>${formatNumber(metricValue(work, "likes"))} 赞 · ${formatNumber(metricValue(work, "saves"))} 藏</span>
                  <span>${formatNumber(metricValue(work, "remixes"))} 改编 · ${completionLabel(work)} 完播</span>
                  ${metricValue(work, "reports") ? `<span class="risk-text">${formatNumber(metricValue(work, "reports"))} 举报</span>` : ""}
                </div>
              </td>
              <td>
                <span class="state ${statusClass(storeStatus)}">${escapeHtml(storeStatusLabel(storeStatus))}</span>
                <small>${escapeHtml(hardwareStatusLabel(work.hardwareStatus))}</small>
              </td>
              <td>${formatDate(work.updatedAt || work.createdAt)}</td>
              <td>
                <button data-action="mark-candidate" data-id="${escapeHtml(work.id)}" ${work.hardwareStatus === "hardware_candidate" ? "disabled" : ""} type="button">标为候选</button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
    ${renderTableFooter("works", pageInfo)}
  ` : emptyState("没有符合筛选条件的作品。");
}

function filteredIps() {
  const tableState = state.tables.ips;
  const query = normalizeSearchText(tableState.query);
  const ips = state.ips
    .filter((item) => includesQuery([
      item.id,
      item.name,
      item.description,
      item.type,
      item.statusLabel,
      item.aliases,
      item.tags,
      item.personas?.map((persona) => persona.name),
    ], query))
    .filter((item) => tableState.type === "all" || item.type === tableState.type)
    .filter((item) => ipStatusBucket(item, tableState.status));

  return [...ips].sort((a, b) => {
    if (tableState.sort === "works") return (b.stats?.works || 0) - (a.stats?.works || 0);
    if (tableState.sort === "creators") return (b.stats?.creators || 0) - (a.stats?.creators || 0);
    if (tableState.sort === "hardware") return (b.stats?.hardwarePacks || 0) - (a.stats?.hardwarePacks || 0);
    if (tableState.sort === "risk") return (b.stats?.recentViolationRate || 0) - (a.stats?.recentViolationRate || 0);
    return (b.stats?.heatScore || 0) - (a.stats?.heatScore || 0);
  });
}

function renderIpStats(items) {
  const openZones = items.filter((item) => item.hasZone || item.zoneStatus === "open").length;
  const eligible = items.filter((item) => item.zoneEligibility?.eligible).length;
  const external = items.filter((item) => item.type === "mainstream_external_ip").length;
  const risk = items.filter((item) => ipStatusBucket(item, "risk")).length;
  const totalHeat = items.reduce((sum, item) => sum + (item.stats?.heatScore || 0), 0);
  $("ipStats").innerHTML = [
    ["IP总量", items.length, "池内可归属 IP"],
    ["总热度", totalHeat, "作品与社区热度"],
    ["已开专区", openZones, "有独立专区运营"],
    ["可申请专区", eligible, "达到门槛未开区"],
    ["外部IP", external, "权利边界需严审"],
    ["风险IP", risk, "治理或违规率异常"],
  ].map(([label, value, detail]) => `
    <article class="table-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${formatNumber(value)}</strong>
      <small>${escapeHtml(detail)}</small>
    </article>
  `).join("");
}

function renderIpCollection() {
  const collection = state.ipCollection;
  const queryInput = $("ipCollectorQuery");
  const limitInput = $("ipCollectorLimit");
  const includeInput = $("ipCollectorIncludeExisting");
  if (queryInput && queryInput.value !== collection.query) queryInput.value = collection.query;
  if (limitInput && limitInput.value !== String(collection.limit)) limitInput.value = String(collection.limit);
  if (includeInput) includeInput.checked = Boolean(collection.includeExisting);

  $("ipCollectorSource").textContent = collection.source || "候选库";
  $("ipCollectorMessage").textContent = collection.message;
  $("ipCandidateMessage").textContent = collection.message;
  [
    ["ipCandidateSearchButton", "search", "搜索候选", "搜索中..."],
    ["ipCollectButton", "collect", "收集入池", "收集中..."],
    ["ipSweepAllButton", "sweep", "一键全网IP入池", "全网IP入池中..."],
  ].forEach(([id, operation, idleLabel, busyLabel]) => {
    const button = $(id);
    const active = collection.loading && collection.operation === operation;
    button.textContent = active ? busyLabel : idleLabel;
    button.disabled = collection.loading;
    button.classList.toggle("is-busy", active);
    if (active) button.setAttribute("aria-busy", "true");
    else button.removeAttribute("aria-busy");
  });

  $("ipCandidateResults").innerHTML = collection.candidates.length ? collection.candidates.map((candidate) => {
    const entry = candidate.ipEntry || {};
    const personas = candidate.personas || candidate.characters || [];
    const candidateId = candidate.ipId || candidate.id;
    const deepCollectState = actionButtonState("deep-collect-characters", candidateId);
    const deepCollectLabel = candidate.importable ? "深挖并入池" : (candidate.supplementable ? "深挖并补全" : "重新深挖");
    const feedback = candidateFeedback(candidateId);
    return `
      <article class="candidate-card">
        <header>
          <div>
            <span class="type-label">${escapeHtml(candidate.matchedBy || candidate.sourceName || "候选")}</span>
            <h3>${escapeHtml(candidate.name)}</h3>
            <p>${escapeHtml(entry.description || candidate.description || "暂无 IP 简介。")}</p>
          </div>
          <div class="candidate-card-actions">
            <span class="state ${candidate.importable || candidate.supplementable ? "good" : "warn"}">${candidate.importable ? "可入池" : (candidate.supplementable ? "可补全" : "已完整")}</span>
            <button class="primary candidate-primary-action ${deepCollectState.className}" data-action="deep-collect-characters" data-id="${escapeHtml(candidateId)}" data-query="${escapeHtml(candidate.name)}" ${deepCollectState.attrs} type="button">${deepCollectState.pending ? actionPendingLabel("deep-collect-characters") : deepCollectLabel}</button>
          </div>
        </header>
        <div class="candidate-meta">
          <span>热度 ${formatNumber(candidate.score || entry.communityStats?.heatScore || 0)}</span>
          <span>${escapeHtml(candidate.sourceName || "候选库")}</span>
          ${candidate.duplicateReason ? `<span>${escapeHtml(candidate.duplicateReason)}</span>` : ""}
          ${candidate.missingPoolPersonaCount ? `<span>可补 ${formatNumber(candidate.missingPoolPersonaCount)} 个角色</span>` : ""}
        </div>
        <div class="tag-list">
          ${asArray(candidate.aliases).slice(0, 4).map((alias) => `<span>${escapeHtml(alias)}</span>`).join("")}
          ${asArray(candidate.tags).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
        </div>
        <div class="candidate-characters">
          <h4>候选角色与简介</h4>
          <div class="persona-grid-list">${renderPersonaCards(personas, { compact: true })}</div>
        </div>
        <p class="rights-note">${escapeHtml(candidate.rightsNotice || entry.rightsNotice || "外部 IP 仅用于二创归属；商店和硬件分发需单独权利证明。")}</p>
        ${feedback ? `<p class="candidate-action-status ${escapeHtml(feedback.tone || "info")}">${escapeHtml(feedback.message)}</p>` : ""}
      </article>
    `;
  }).join("") : emptyState("还没有候选结果。可以搜索“火影”“皮卡丘”“排球”“魔法少女”等关键词。");
  renderIpTabs();
}

function renderIpPersonaDirectory() {
  const items = filteredIps();
  const personaCount = items.reduce((sum, item) => sum + asArray(item.personas).length, 0);
  $("ipPersonaSummary").textContent = `${formatNumber(items.length)} IP · ${formatNumber(personaCount)} 角色`;
  $("ipPersonaDirectory").innerHTML = items.length ? items.map((item) => `
    <article class="persona-ip-card ${state.focusedIpId === item.id ? "focused" : ""}" data-persona-ip-id="${escapeHtml(item.id)}">
      <header>
        <div>
          <span class="type-label">${escapeHtml(ipTypeLabel(item.type))}</span>
          <h3>${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description || "暂无 IP 简介，待运营补充。")}</p>
        </div>
        <span class="state ${statusClass(item.governanceStatus)}">${escapeHtml(item.statusLabel || item.governanceStatus || "active")}</span>
      </header>
      <div class="persona-grid-list">
        ${renderPersonaCards(item.personas)}
      </div>
      ${item.rightsNotice ? `<p class="rights-note">${escapeHtml(item.rightsNotice)}</p>` : ""}
    </article>
  `).join("") : emptyState("当前筛选下没有 IP，清空搜索或切换筛选后查看角色简介。");
}

function renderIpPool() {
  syncTableControls("ips");
  renderIpStats(state.ips);
  renderIpCollection();
  renderIpPersonaDirectory();
  const pageInfo = paginate(filteredIps(), state.tables.ips);
  $("ipTable").innerHTML = pageInfo.total ? `
    <table>
      <thead>
        <tr>
          <th>IP</th>
          <th>类型 / 专区</th>
          <th>热度</th>
          <th>内容规模</th>
          <th>角色简介</th>
          <th>专区门槛</th>
          <th>风险</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${pageInfo.items.map((item) => {
          const stats = item.stats || {};
          const eligibility = item.zoneEligibility || {};
          const passed = asArray(eligibility.checks).filter((check) => check.passed).length;
          const checks = asArray(eligibility.checks).length;
          const riskRate = Number(stats.recentViolationRate || 0);
          return `
            <tr>
              <td>
                <button class="text-link ip-name-link" data-action="inspect-ip" data-id="${escapeHtml(item.id)}" type="button">${escapeHtml(item.name)}</button>
                <small>${escapeHtml(item.id)} · ${escapeHtml(item.description || "")}</small>
              </td>
              <td>
                <span class="state ${statusClass(item.governanceStatus)}">${escapeHtml(ipTypeLabel(item.type))}</span>
                <small>${escapeHtml(item.statusLabel || "未开专区")}</small>
              </td>
              <td>
                <strong class="heat-score">${formatNumber(stats.heatScore || 0)}</strong>
                <small>热度分</small>
              </td>
              <td>
                <div class="metric-stack">
                  <span>${formatNumber(stats.works || 0)} 作品 · ${formatNumber(stats.creators || 0)} 创作者</span>
                  <span>${formatNumber(stats.personas || 0)} 分身 · ${formatNumber(stats.hardwarePacks || 0)} 硬件包</span>
                  <span>${escapeHtml(renderPersonaNamePreview(item.personas))}</span>
                </div>
              </td>
              <td>${renderPersonaSummary(item.personas)}</td>
              <td>
                <span class="state ${eligibility.eligible ? "good" : item.hasZone ? "good" : "warn"}">${escapeHtml(eligibility.statusLabel || item.statusLabel || "未达标")}</span>
                <small>${checks ? `${passed}/${checks} 项达标` : "暂无门槛数据"}</small>
              </td>
              <td>
                <span class="state ${riskRate > 0.05 || item.governanceStatus !== "active" ? "bad" : "good"}">${Math.round(riskRate * 100)}%</span>
                <small>${escapeHtml(item.governanceStatus || "active")}</small>
              </td>
              <td>
                <button data-action="inspect-ip" data-id="${escapeHtml(item.id)}" type="button">查看</button>
                <button data-action="apply-zone" data-id="${escapeHtml(item.id)}" ${eligibility.eligible ? "" : "disabled"} type="button">申请专区</button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
    ${renderTableFooter("ips", pageInfo)}
  ` : emptyState("没有符合筛选条件的 IP。");
}

function renderReview() {
  const tasks = asArray(state.dashboard?.reviewTasks);
  $("reviewList").innerHTML = tasks.length ? tasks.map((task) => `
    <article class="record-card">
      <header>
        <div>
          <span class="type-label">${escapeHtml(task.reviewTypeLabel)}</span>
          <h3>${escapeHtml(task.title)}</h3>
          <p>${escapeHtml(task.riskLabel)} · ${escapeHtml(task.targetType)} · ${escapeHtml(task.targetId)}</p>
        </div>
        <span class="state ${statusClass(task.status)}">${escapeHtml(task.status)}</span>
      </header>
      <p class="record-note">${escapeHtml(task.reason)}</p>
      <div class="evidence-list">${asArray(task.evidence).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      <footer>
        <button data-action="approve-review" data-id="${escapeHtml(task.id)}" type="button">✓ 通过</button>
        <button class="danger" data-action="reject-review" data-id="${escapeHtml(task.id)}" type="button">! 驳回</button>
      </footer>
    </article>
  `).join("") : emptyState("当前没有待处理审核任务。");
}

function governancePrimaryLabel(item) {
  if (item.caseType === "appeal") return "恢复";
  if (item.caseType === "rights_claim") return item.status === "action_taken" ? "维持处置" : "先冻结";
  if (item.targetType === "Comment") return "隐藏评论";
  return "限流";
}

function governanceSecondaryLabel(item) {
  if (item.caseType === "appeal") return "维持";
  if (item.caseType === "rights_claim") return "恢复";
  return "驳回";
}

function renderGovernance() {
  const cases = asArray(state.dashboard?.governanceCases);
  $("governanceCount").textContent = String(cases.length);
  $("governanceList").innerHTML = cases.length ? cases.map((item) => `
    <article class="mini-card">
      <header>
        <span class="type-label">${escapeHtml(item.caseTypeLabel)}</span>
        <span class="state ${statusClass(item.status)}">${escapeHtml(item.statusLabel)}</span>
      </header>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.reason)}</p>
      <div class="inline-actions">
        <button data-action="governance-primary" data-id="${escapeHtml(item.id)}" type="button">${governancePrimaryLabel(item)}</button>
        <button class="danger" data-action="governance-secondary" data-id="${escapeHtml(item.id)}" type="button">${governanceSecondaryLabel(item)}</button>
      </div>
    </article>
  `).join("") : emptyState("当前没有举报、投诉或申诉。");

  const actions = state.moderationActions;
  $("moderationCount").textContent = String(actions.length);
  $("moderationList").innerHTML = actions.length ? actions.slice(0, 8).map((item) => `
    <article class="mini-card muted">
      <header>
        <span>${escapeHtml(item.action)}</span>
        <span>${formatDate(item.createdAt)}</span>
      </header>
      <h3>${escapeHtml(item.targetTitle || item.targetId)}</h3>
      <p>${escapeHtml(item.reason || item.status || "已记录处置。")}</p>
    </article>
  `).join("") : emptyState("还没有治理处置记录。");
}

function canAdvanceStore(status) {
  return ["rights_review", "production_queued", "producing", "pack_review"].includes(status);
}

function storeAdvanceLabel(status) {
  return {
    rights_review: "初审通过",
    production_queued: "开始制作",
    producing: "提交复核",
    pack_review: "正式上架",
  }[status] || "推进";
}

function renderStore() {
  const listings = asArray(state.dashboard?.storeListings);
  $("storeList").innerHTML = listings.length ? listings.map((listing) => {
    const canAdvance = canAdvanceStore(listing.status);
    const canFreeze = listing.status === "listed";
    const dangerLabel = listing.status === "listed" ? "下架" : "驳回";
    const dangerDisabled = ["rejected", "delisted"].includes(listing.status);
    return `
      <article class="record-card">
        <header>
          <div>
            <span class="type-label">${escapeHtml(listing.originLabel)}${listing.ipName ? ` · ${escapeHtml(listing.ipName)}` : ""}</span>
            <h3>${escapeHtml(listing.title)}</h3>
            <p>${escapeHtml(listing.personaName)} · 更新于 ${formatDate(listing.updatedAt)}</p>
          </div>
          <span class="state ${statusClass(listing.status)}">${escapeHtml(listing.statusLabel)}</span>
        </header>
        <p class="record-note">${listing.rightsAcknowledgedAt ? "权利承诺已签署，可以按证据推进。" : "缺少权利承诺，不应进入商店流程。"}</p>
        <footer>
          <button data-action="advance-store" data-id="${escapeHtml(listing.packId)}" ${canAdvance ? "" : "disabled"} type="button">${storeAdvanceLabel(listing.status)}</button>
          <button data-action="freeze-store" data-id="${escapeHtml(listing.packId)}" ${canFreeze ? "" : "disabled"} type="button">冻结</button>
          <button class="danger" data-action="${listing.status === "listed" ? "delist-store" : "reject-store"}" data-id="${escapeHtml(listing.packId)}" ${dangerDisabled ? "disabled" : ""} type="button">${dangerLabel}</button>
        </footer>
      </article>
    `;
  }).join("") : emptyState("还没有商店上架申请。");
}

function renderHardware() {
  const items = asArray(state.dashboard?.hardwareQueue);
  $("hardwareList").innerHTML = items.length ? items.map((item) => {
    const report = item.compatibilityReport || {};
    const budget = item.resourceBudget || {};
    const actual = budget.actual || {};
    const failed = report.status === "failed";
    const progress = Math.max(0, Math.min(100, Number(item.progress) || 0));
    return `
      <article class="record-card">
        <header>
          <div>
            <span class="type-label">${escapeHtml(item.stageLabel)} · ${escapeHtml(hardwareStatusLabel(item.hardwareStatus))}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.compatibilityLevelLabel || "等待兼容报告")} · ${escapeHtml((item.targetDeviceModels || []).join(" / "))}</p>
          </div>
          <span class="state ${failed ? "bad" : "good"}">${escapeHtml(report.statusLabel || report.status || "pending")}</span>
        </header>
        <div class="progress"><span style="width:${progress}%"></span></div>
        <div class="evidence-list">
          <span>报告：${escapeHtml(item.compatibilityReportId || "待生成")}</span>
          <span>版本：${escapeHtml(item.hardwarePackVersion || "待定")}</span>
          <span>格式：${escapeHtml(item.formatVersion || "待定")}</span>
          <span>资源：${escapeHtml(item.packageSizeKb || actual.estimatedSizeKb || "-")} KB</span>
          <span>节点：${escapeHtml(actual.nodeCount || 0)} / ${escapeHtml(budget.maxNodes || "-")}</span>
          <span>校验：${escapeHtml(item.checksum || "待生成")}</span>
        </div>
        <p class="record-note">${escapeHtml((report.findings || ["无需降级，可继续制作。"]).join("；"))}</p>
        <footer>
          <button data-action="mark-candidate" data-id="${escapeHtml(item.packId)}" type="button">标为候选</button>
          <button data-action="mark-ready" data-id="${escapeHtml(item.packId)}" ${failed ? "disabled" : ""} type="button">标为可下载</button>
          <button data-action="approve-hardware" data-id="${escapeHtml(item.packId)}" ${failed ? "disabled" : ""} type="button">复核通过</button>
          <button data-action="publish-hardware" data-id="${escapeHtml(item.packId)}" ${failed ? "disabled" : ""} type="button">发布</button>
          <button data-action="export-hardware" data-id="${escapeHtml(item.packId)}" ${failed ? "disabled" : ""} type="button">导出</button>
        </footer>
      </article>
    `;
  }).join("") : emptyState("还没有进入设备包制作的作品。");
}

function renderSettlements() {
  const items = asArray(state.dashboard?.settlements);
  $("settlementList").innerHTML = items.length ? items.map((item) => `
    <article class="record-card">
      <header>
        <div>
          <span class="type-label">${escapeHtml(item.orderId || "订单待确认")}</span>
          <h3>${escapeHtml(item.hardwarePackTitle || item.hardwarePackId)}</h3>
          <p>${escapeHtml(item.storeListingId || "listing")} · ${escapeHtml(item.creatorUserId || "creator")}</p>
        </div>
        <span class="state ${statusClass(item.status)}">${escapeHtml(item.statusLabel)}</span>
      </header>
      <p class="record-note">${escapeHtml(item.freezeReason || "MVP 阶段仅预留结算记录，不开放现金分成。")}</p>
      <div class="evidence-list">
        <span>金额：${escapeHtml(item.amountLabel)}</span>
        <span>风险来源：${escapeHtml(item.riskSource || "normal")}</span>
      </div>
      <footer>
        <button data-action="release-settlement" data-id="${escapeHtml(item.id)}" ${item.status === "frozen" ? "" : "disabled"} type="button">释放冻结</button>
      </footer>
    </article>
  `).join("") : emptyState("还没有订单结算记录。");
}

function renderTrending() {
  const items = state.trending.length ? state.trending : asArray(state.dashboard?.items);
  $("trendingTable").innerHTML = items.length ? `
    <table>
      <thead>
        <tr>
          <th>作品</th>
          <th>作者</th>
          <th>信号</th>
          <th>状态</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => `
          <tr>
            <td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.contentOrigin)}${item.ipName ? ` · ${escapeHtml(item.ipName)}` : ""}</small></td>
            <td>${escapeHtml(item.author?.name || "Gugu Creator")}</td>
            <td>${formatNumber(item.metrics?.likes || 0)} 赞 · ${formatNumber(item.metrics?.saves || 0)} 藏 · ${Math.round((item.metrics?.completionRate || 0) * 100)}%</td>
            <td><span class="state ${statusClass(item.hardwareStatus)}">${escapeHtml(hardwareStatusLabel(item.hardwareStatus))}</span></td>
            <td><button data-action="mark-candidate" data-id="${escapeHtml(item.id)}" type="button">标为候选</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : emptyState("没有趋势内容。");
}

function renderSlaAndAlerts() {
  const sla = state.sla;
  $("slaSummary").textContent = sla ? `${sla.summary?.totalOpen || 0} open · ${sla.summary?.breached || 0} breached` : "未连接";
  $("slaList").innerHTML = sla?.items?.length ? sla.items.slice(0, 10).map((item) => `
    <article class="mini-card">
      <header>
        <span class="type-label">${escapeHtml(item.queueLabel)}</span>
        <span class="state ${item.breached ? "bad" : item.urgent ? "warn" : "good"}">${escapeHtml(item.severity)}</span>
      </header>
      <h3>${escapeHtml(item.title || item.id)}</h3>
      <p>${formatDuration(item.ageMs)} · owner ${escapeHtml(item.escalationOwner || "-")}</p>
    </article>
  `).join("") : emptyState("当前没有 SLA 风险项。");

  const alerts = asArray(state.metrics?.alerts);
  $("alertSummary").textContent = `${alerts.length} alert`;
  $("alertList").innerHTML = alerts.length ? alerts.map((alert) => `
    <article class="mini-card">
      <header>
        <span class="type-label">${escapeHtml(alert.severity || "alert")}</span>
        <span class="state bad">${escapeHtml(alert.owner || "Ops")}</span>
      </header>
      <h3>${escapeHtml(alert.label || alert.id)}</h3>
      <p>${escapeHtml(alert.detail || alert.message || "需要复核。")}</p>
    </article>
  `).join("") : emptyState("当前没有激活告警。");
}

function renderLogs() {
  const logs = state.logs.length ? state.logs : asArray(state.dashboard?.operationLogs);
  $("logList").innerHTML = logs.length ? logs.slice(0, 40).map((log) => `
    <article class="log-row">
      <time>${formatDate(log.createdAt)}</time>
      <div>
        <strong>${escapeHtml(log.action)}</strong>
        <span>${escapeHtml(log.targetTitle || log.targetId || "target")} · ${escapeHtml(log.actorName || log.actorUserId || "operator")}</span>
        <p>${escapeHtml(log.detail || log.status || "")}</p>
      </div>
    </article>
  `).join("") : emptyState("还没有操作记录。");
}

function renderAll() {
  renderSummary();
  renderPriority();
  renderHealth();
  renderWorksLibrary();
  renderIpPool();
  renderReview();
  renderGovernance();
  renderStore();
  renderHardware();
  renderSettlements();
  renderTrending();
  renderSlaAndAlerts();
  renderLogs();
}

async function refreshData({ quiet = false } = {}) {
  $("refreshButton").disabled = true;
  setConnectionStatus("同步中", "warn");
  try {
    const [dashboard, metrics, sla, moderation, trending, logs, feed, ipPool] = await Promise.all([
      api.getOperatorDashboard(),
      api.getOperatorOpsMetrics(),
      api.getOperatorReviewSla(),
      api.getModerationActions().catch(() => ({ items: [] })),
      api.getOperatorTrending().catch(() => ({ items: [] })),
      api.getOperationLogs().catch(() => ({ items: [] })),
      api.getFeed().catch(() => ({ items: [] })),
      api.getIpPool().catch(() => ({ items: [] })),
    ]);
    state.dashboard = dashboard;
    state.metrics = metrics;
    state.sla = sla;
    state.moderationActions = asArray(moderation.items);
    state.trending = asArray(trending.items);
    state.logs = asArray(logs.items);
    state.works = asArray(feed.items).length ? asArray(feed.items) : asArray(dashboard.items);
    state.ips = asArray(ipPool.items);
    renderAll();
    setConnectionStatus("已连接", "good");
    if (!quiet) showToast("后台数据已刷新。", "success");
  } catch (error) {
    setConnectionStatus("连接失败", "bad");
    showToast(error.message || "无法连接运营 API。", "error");
  } finally {
    $("refreshButton").disabled = false;
  }
}

function findGovernanceCase(id) {
  return asArray(state.dashboard?.governanceCases).find((item) => item.id === id);
}

async function handleGovernancePrimary(item) {
  if (item.caseType === "appeal") return api.resolveAppeal(item.id, "restore", "申诉材料通过，恢复内容和商店状态。");
  if (item.caseType === "rights_claim") {
    return api.resolveRightsClaim(item.id, item.status === "action_taken" ? "closed" : "freeze_store", "权利投诉进入运营复核。");
  }
  if (item.targetType === "Comment") return api.resolveReport(item.id, "hide", "评论举报成立，平台隐藏评论。");
  return api.resolveReport(item.id, "limit_recommend", "举报成立，先限制推荐并进入复核。");
}

async function handleGovernanceSecondary(item) {
  if (item.caseType === "appeal") return api.resolveAppeal(item.id, "keep_action", "申诉材料不足，维持原处置。");
  if (item.caseType === "rights_claim") return api.resolveRightsClaim(item.id, "restore", "权利材料不足，恢复相关状态。");
  return api.resolveReport(item.id, "reject", "举报材料不足，暂不采取处置。");
}

async function performAction(button) {
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (!action || !id) return;
  const pendingKey = actionKey(action, id);
  state.pendingActions.add(pendingKey);
  setButtonBusy(button, true, actionPendingLabel(action));
  if (["collect-candidate", "deep-characters", "collect-deep-characters", "deep-collect-characters"].includes(action)) {
    setCandidateFeedback(id, "info", actionPendingLabel(action));
  }
  try {
    if (action === "inspect-ip") {
      const item = state.ips.find((entry) => entry.id === id);
      if (item) {
        focusIpPersona(item);
      }
      showToast(`${item?.name || id}：已跳转到角色目录，${formatNumber(asArray(item?.personas).length)} 个角色。`, "info");
      return;
    }
    if (action === "collect-candidate") {
      await collectIpCandidates(button.dataset.query || id, { limit: 1 });
      setCandidateFeedback(id, "success", state.ipCollection.message);
      renderIpCollection();
      return;
    }
    if (action === "deep-characters") {
      await searchIpCharacters(id, button.dataset.query || id);
      return;
    }
    if (action === "collect-deep-characters") {
      await collectIpCharacters(id, button.dataset.query || id);
      return;
    }
    if (action === "deep-collect-characters") {
      await collectIpCharacters(id, button.dataset.query || id);
      return;
    }
    if (action === "approve-review") await api.approveReviewTask(id, "后台审核通过，证据完整。");
    if (action === "reject-review") await api.rejectReviewTask(id, "后台驳回，材料不足。");
    if (action === "governance-primary") await handleGovernancePrimary(findGovernanceCase(id));
    if (action === "governance-secondary") await handleGovernanceSecondary(findGovernanceCase(id));
    if (action === "advance-store") await api.approveStoreListing(id);
    if (action === "freeze-store") await api.freezeStoreListing(id, "运营后台冻结，等待权利争议复核。");
    if (action === "delist-store") await api.delistStoreListing(id, "运营后台下架，停止新增下载和同步。");
    if (action === "reject-store") await api.rejectStoreListing(id, "运营后台驳回，上架材料不足。");
    if (action === "mark-candidate") await api.markHardwareCandidate(id);
    if (action === "mark-ready") await api.markHardwareReady(id);
    if (action === "approve-hardware") await api.approveHardwarePack(id);
    if (action === "publish-hardware") await api.publishHardwarePack(id);
    if (action === "export-hardware") {
      const result = await api.exportHardwarePack(id);
      showToast(`导出完成：${result.item?.manifest?.id || id}`, "success");
    }
    if (action === "apply-zone") await api.applyZoneApplication(id, "运营后台确认 IP 热度、作品数和风险门槛达标，申请开通专区。");
    if (action === "release-settlement") await api.releaseSettlement(id, "后台复核通过，释放冻结。");
    if (action !== "export-hardware") showToast("操作已提交。", "success");
    await refreshData({ quiet: true });
  } catch (error) {
    showToast(error.message || "操作失败。", "error");
  } finally {
    state.pendingActions.delete(pendingKey);
    setButtonBusy(button, false);
    if (["collect-candidate", "deep-characters", "collect-deep-characters", "deep-collect-characters"].includes(action)) {
      renderIpCollection();
    }
  }
}

function renderTable(tableName) {
  if (tableName === "works") renderWorksLibrary();
  if (tableName === "ips") renderIpPool();
}

function readIpCollectionForm() {
  state.ipCollection.query = $("ipCollectorQuery").value.trim();
  const limitValue = $("ipCollectorLimit").value;
  state.ipCollection.limit = limitValue === "all" ? "all" : Number(limitValue) || 6;
  state.ipCollection.includeExisting = $("ipCollectorIncludeExisting").checked;
  return {
    query: state.ipCollection.query,
    limit: state.ipCollection.limit,
    includeExisting: state.ipCollection.includeExisting,
  };
}

async function searchIpCandidates() {
  const options = readIpCollectionForm();
  clearCandidateFeedback();
  setIpCollectionOperation("search", "正在采集候选...");
  showIpTab("candidates");
  renderIpCollection();
  try {
    const result = await api.searchAnimeIpCandidates(options);
    state.ipCollection.candidates = asArray(result.items);
    state.ipCollection.source = result.source || "全网 IP 搜索候选库";
    state.ipCollection.lastResult = result;
    const supplementableCount = state.ipCollection.candidates.filter((candidate) => candidate.supplementable).length;
    const liveMessage = result.liveDiscovery?.failed
      ? `实时搜索失败，已回退本地目录：${result.liveDiscovery.message}`
      : result.liveDiscovery
        ? `实时公开知识库返回 ${formatNumber(result.liveDiscovery.fetchedRowCount || 0)} 条关系，发现 ${formatNumber(result.liveDiscovery.discoveredIpCount || 0)} 个 IP。`
        : "";
    state.ipCollection.message = state.ipCollection.candidates.length
      ? `找到 ${state.ipCollection.candidates.length} 个全网候选，${result.importableCount || 0} 个可新增，${supplementableCount} 个可补全角色。`
      : "没有匹配候选，换一个角色名、IP 名或题材关键词再试。";
    if (liveMessage) state.ipCollection.message = `${liveMessage} ${state.ipCollection.message}`;
  } catch (error) {
    state.ipCollection.message = error.message || "候选采集失败。";
  } finally {
    clearIpCollectionOperation();
    renderIpCollection();
  }
}

async function collectIpCandidates(queryOverride = null, overrides = {}) {
  const options = {
    ...readIpCollectionForm(),
    ...overrides,
  };
  if (queryOverride === null && !overrides.limit) clearCandidateFeedback();
  if (queryOverride !== null) options.query = queryOverride;
  state.ipCollection.query = options.query || "";
  const isSweep = options.sweepAll || options.online;
  setIpCollectionOperation(isSweep ? "sweep" : "collect", isSweep ? "正在一键扫描全网 IP 并入池..." : "正在收集入池...");
  showIpTab("candidates");
  renderIpCollection();
  try {
    const result = await api.collectAnimeIpPool({
      query: options.query,
      limit: options.limit,
      includeExisting: options.includeExisting,
      sweepAll: Boolean(options.sweepAll),
      online: Boolean(options.online),
      ipOnly: Boolean(options.ipOnly),
    });
    state.ipCollection.candidates = asArray(result.items);
    state.ipCollection.lastResult = result;
    const livePrefix = result.liveDiscovery?.failed
      ? `实时搜索失败，已回退本地目录：${result.liveDiscovery.message} `
      : result.liveDiscovery
        ? `实时公开知识库返回 ${formatNumber(result.liveDiscovery.fetchedRowCount || 0)} 条关系，发现 ${formatNumber(result.liveDiscovery.discoveredIpCount || 0)} 个 IP。 `
        : "";
    state.ipCollection.message = result.addedIpCount || result.supplementedIpCount
      ? options.ipOnly
        ? `${livePrefix}一键全网 IP 入池完成：新增 ${formatNumber(result.addedIpCount)} 个 IP，跳过 ${formatNumber(asArray(result.skipped).length)} 个已存在 IP。角色目录可后续单独深挖。`
        : `${livePrefix}${options.online ? "实时全网搜索完成：" : options.sweepAll ? "全网扫库完成：" : ""}已入池 ${result.addedIpCount} 个 IP，补全 ${result.supplementedIpCount || 0} 个既有 IP，补充 ${result.addedPersonaCount} 个角色简介。`
      : `${livePrefix}${options.online ? "实时全网搜索完成：" : ""}没有新增 IP，候选可能已经在池内。`;
    showToast(state.ipCollection.message, result.addedIpCount ? "success" : "info");
    await refreshData({ quiet: true });
    if (options.ipOnly && (result.addedIpCount || result.supplementedIpCount)) {
      syncCollectedCandidates(asArray(result.imported).map((item) => item.id));
    }
  } catch (error) {
    state.ipCollection.message = error.message || "收集入池失败。";
    showToast(state.ipCollection.message, "error");
  } finally {
    clearIpCollectionOperation();
    renderIpCollection();
  }
}

async function fallbackSearchIpCharacters(ipId, fallbackQuery) {
  const result = await api.searchAnimeIpCandidates({
    query: fallbackQuery || ipId,
    limit: "all",
    includeExisting: true,
  });
  const allItems = asArray(result.items);
  const matchedItems = allItems.filter((candidate) => candidateMatchesIp(candidate, ipId));
  const items = matchedItems.length ? matchedItems : allItems;
  const characterCount = items.reduce((sum, candidate) => sum + candidatePersonaCount(candidate), 0);
  const missingPersonaCount = items.reduce((sum, candidate) => sum + Number(candidate.missingPoolPersonaCount || candidate.missingPersonaCount || 0), 0);
  return {
    ...result,
    item: items[0] || null,
    items,
    ipId,
    source: `${result.source || "候选搜索"} · 兼容模式`,
    characterCount,
    missingPersonaCount,
    fallback: true,
  };
}

function syncCollectedCandidates(ipIds = []) {
  const targetIds = new Set(asArray(ipIds).filter(Boolean));
  state.ipCollection.candidates = state.ipCollection.candidates.map((candidate) => {
    const candidateId = candidate.ipId || candidate.id;
    if (!targetIds.has(candidateId)) return candidate;
    const refreshedIp = state.ips.find((item) => item.id === candidateId);
    const personas = asArray(refreshedIp?.personas);
    const characters = personas.length
      ? personas.map((persona) => ({
        id: persona.id,
        name: persona.name,
        avatar: persona.avatar,
        tagline: persona.tagline,
      }))
      : candidate.characters;
    return {
      ...candidate,
      alreadyInPool: true,
      duplicateIpId: candidateId,
      duplicateReason: refreshedIp ? `已存在：${refreshedIp.name}` : candidate.duplicateReason,
      importable: false,
      supplementable: false,
      actionLabel: "已完整",
      missingPersonaCount: 0,
      missingPoolPersonaCount: 0,
      ipEntry: refreshedIp
        ? {
          ...(candidate.ipEntry || {}),
          ...refreshedIp,
          personaIds: personas.map((persona) => persona.id),
        }
        : candidate.ipEntry,
      personas: personas.length ? personas : candidate.personas,
      characters,
    };
  });
}

function syncCollectedCandidate(ipId) {
  syncCollectedCandidates([ipId]);
}

async function searchIpCharacters(ipId, fallbackQuery = ipId) {
  setIpCollectionOperation("deep", "正在二级深挖角色...");
  showIpTab("candidates");
  renderIpCollection();
  try {
    let result;
    try {
      result = await api.searchAnimeIpCharacters(ipId, { limit: "all" });
    } catch (error) {
      if (!isRouteNotFound(error)) throw error;
      result = await fallbackSearchIpCharacters(ipId, fallbackQuery);
    }
    state.ipCollection.candidates = asArray(result.items);
    state.ipCollection.lastResult = result;
    state.ipCollection.source = result.source || "全网 IP 搜索候选库";
    const prefix = result.fallback ? "当前 API 暂不支持二级深挖接口，已切换候选搜索兜底：" : "二级深挖完成：";
    state.ipCollection.message = result.item
      ? `${prefix}发现 ${formatNumber(result.characterCount)} 个角色，其中 ${formatNumber(result.missingPersonaCount)} 个可补入 IP 池。`
      : "没有找到这个 IP 的二级角色候选。";
    if (result.item) {
      const count = Number(result.characterCount || 0);
      const missing = Number(result.missingPersonaCount || 0);
      const feedback = missing
        ? `深挖完成：发现 ${formatNumber(count)} 个角色，${formatNumber(missing)} 个可补入。`
        : `深挖完成：已收录 ${formatNumber(count)} 个角色，暂无可补入角色。`;
      setCandidateFeedback(ipId, missing ? "success" : "info", feedback);
      showToast(feedback, missing ? "success" : "info");
    } else {
      setCandidateFeedback(ipId, "warn", "没有找到这个 IP 的二级角色候选。");
    }
  } catch (error) {
    state.ipCollection.message = error.message || "二级角色深挖失败。";
    setCandidateFeedback(ipId, "bad", state.ipCollection.message);
    showToast(state.ipCollection.message, "error");
  } finally {
    clearIpCollectionOperation();
    renderIpCollection();
  }
}

async function collectIpCharacters(ipId, fallbackQuery = ipId) {
  setIpCollectionOperation("deepCollect", "正在深挖并补全角色...");
  showIpTab("candidates");
  renderIpCollection();
  try {
    let result;
    try {
      result = await api.collectAnimeIpCharacters(ipId, { limit: "all" });
    } catch (error) {
      if (!isRouteNotFound(error)) throw error;
      result = {
        ...await api.collectAnimeIpPool({
          query: fallbackQuery || ipId,
          limit: "all",
          includeExisting: true,
        }),
        fallback: true,
      };
    }
    state.ipCollection.candidates = asArray(result.items);
    state.ipCollection.lastResult = result;
    state.ipCollection.message = result.addedIpCount || result.supplementedIpCount
      ? `${result.fallback ? "当前 API 暂不支持二级深挖补全接口，已用候选收集兜底：" : "二级角色深挖补全完成："}入池 ${result.addedIpCount} 个 IP，补全 ${result.supplementedIpCount} 个既有 IP，新增 ${result.addedPersonaCount} 个角色。`
      : `${result.fallback ? "当前 API 暂不支持二级补全接口，已用候选收集兜底；" : ""}二级深挖没有发现可补入角色。`;
    setCandidateFeedback(
      ipId,
      result.addedPersonaCount ? "success" : "info",
      result.addedPersonaCount
        ? `补全完成：新增 ${formatNumber(result.addedPersonaCount)} 个角色。`
        : "补全完成：暂无可补入角色。"
    );
    showToast(state.ipCollection.message, result.addedPersonaCount ? "success" : "info");
    await refreshData({ quiet: true });
    if (result.addedIpCount || result.supplementedIpCount || result.addedPersonaCount) {
      syncCollectedCandidate(ipId);
    }
  } catch (error) {
    state.ipCollection.message = error.message || "二级角色补全失败。";
    setCandidateFeedback(ipId, "bad", state.ipCollection.message);
    showToast(state.ipCollection.message, "error");
  } finally {
    clearIpCollectionOperation();
    renderIpCollection();
  }
}

async function sweepAllIpCandidates() {
  $("ipCollectorQuery").value = "";
  $("ipCollectorLimit").value = "all";
  $("ipCollectorIncludeExisting").checked = true;
  state.ipCollection.message = "正在一键扫描全网 IP 名录和公开知识库，缺失 IP 自动入池；角色目录可后续单独深挖。";
  await collectIpCandidates("", {
    limit: "all",
    includeExisting: true,
    sweepAll: true,
    online: true,
    ipOnly: true,
  });
}

function updateTableFilter(control) {
  const tableName = control.dataset.table;
  const field = control.dataset.field;
  const tableState = state.tables[tableName];
  if (!tableState || !field) return;
  tableState[field] = field === "pageSize" ? Number(control.value) : control.value;
  tableState.page = 1;
  renderTable(tableName);
}

function updateTablePage(button) {
  const tableName = button.dataset.pageTable;
  const tableState = state.tables[tableName];
  if (!tableState) return;
  tableState.page += button.dataset.pageAction === "next" ? 1 : -1;
  renderTable(tableName);
}

async function renderSupportDiagnostics() {
  const query = {};
  const userId = $("supportUserInput").value.trim();
  const deviceId = $("supportDeviceInput").value.trim();
  const orderId = $("supportOrderInput").value.trim();
  if (userId) query.userId = userId;
  if (deviceId) query.deviceId = deviceId;
  if (orderId) query.orderId = orderId;

  $("supportResults").innerHTML = emptyState("正在查询诊断证据...");
  try {
    const bundle = await api.getOperatorSupportDiagnostics(query);
    const summary = bundle.summary || {};
    const macros = asArray(bundle.recommendedMacros);
    $("supportResults").innerHTML = `
      <div class="diagnostic-grid">
        <div><strong>${summary.totalMatches || 0}</strong><span>匹配记录</span></div>
        <div><strong>${summary.failedSyncJobs || 0}</strong><span>失败同步</span></div>
        <div><strong>${summary.openReports || 0}</strong><span>开放举报</span></div>
        <div><strong>${summary.frozenSettlements || 0}</strong><span>冻结结算</span></div>
      </div>
      <div class="macro-list">
        ${macros.length ? macros.map((macro) => `
          <article class="mini-card ${macro.ready ? "" : "muted"}">
            <header>
              <span>${escapeHtml(macro.id)}</span>
              <span class="state ${macro.ready ? "good" : "warn"}">${macro.ready ? "可用" : "缺字段"}</span>
            </header>
            <p>${escapeHtml(macro.title || macro.label || "推荐客服宏")}</p>
            ${macro.missingFields?.length ? `<small>缺少：${macro.missingFields.map(escapeHtml).join(" / ")}</small>` : ""}
          </article>
        `).join("") : emptyState("暂无推荐客服宏。")}
      </div>
    `;
  } catch (error) {
    $("supportResults").innerHTML = emptyState(error.message || "诊断查询失败。");
  }
}

function saveConnection() {
  state.apiBase = $("apiBaseInput").value.trim() || DEFAULT_API_BASE;
  state.token = $("tokenInput").value.trim();
  localStorage.setItem(STORAGE_KEYS.apiBase, state.apiBase);
  localStorage.setItem(STORAGE_KEYS.token, state.token);
  api = createApi();
  refreshData();
}

function wireEvents() {
  $("navList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-section]");
    if (button) showSection(button.dataset.section);
  });
  document.body.addEventListener("click", (event) => {
    const ipTab = event.target.closest("[data-ip-tab]");
    if (ipTab) {
      showIpTab(ipTab.dataset.ipTab);
      return;
    }
    const pageButton = event.target.closest("[data-page-table]");
    if (pageButton) {
      updateTablePage(pageButton);
      return;
    }
    const jump = event.target.closest("[data-jump]");
    if (jump) showSection(jump.dataset.jump);
    const action = event.target.closest("[data-action]");
    if (action) performAction(action);
  });
  document.body.addEventListener("input", (event) => {
    const control = event.target.closest("[data-table][data-field]");
    if (control?.tagName === "INPUT") updateTableFilter(control);
  });
  document.body.addEventListener("change", (event) => {
    const control = event.target.closest("[data-table][data-field]");
    if (control && control.tagName !== "INPUT") updateTableFilter(control);
  });
  $("refreshButton").addEventListener("click", () => refreshData());
  $("saveConnectionButton").addEventListener("click", saveConnection);
  $("demoTokenButton").addEventListener("click", () => {
    $("tokenInput").value = "demo-operator";
    saveConnection();
  });
  $("ipCandidateSearchButton").addEventListener("click", searchIpCandidates);
  $("ipCollectButton").addEventListener("click", () => collectIpCandidates());
  $("ipSweepAllButton").addEventListener("click", sweepAllIpCandidates);
  $("ipCollectorQuery").addEventListener("input", () => {
    state.ipCollection.query = $("ipCollectorQuery").value.trim();
  });
  $("ipCollectorLimit").addEventListener("change", () => {
    const value = $("ipCollectorLimit").value;
    state.ipCollection.limit = value === "all" ? "all" : Number(value) || 6;
  });
  $("ipCollectorIncludeExisting").addEventListener("change", () => {
    state.ipCollection.includeExisting = $("ipCollectorIncludeExisting").checked;
  });
  $("supportSearchButton").addEventListener("click", renderSupportDiagnostics);
}

function init() {
  $("apiBaseInput").value = state.apiBase;
  $("tokenInput").value = state.token;
  renderNav();
  renderIpTabs();
  showSection("overview");
  wireEvents();
  refreshData({ quiet: true });
}

init();
