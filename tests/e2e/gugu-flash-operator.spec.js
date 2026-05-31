import { expect, test } from "@playwright/test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createFlashHttpServer } from "../../apps/backend/src/flash-http-server.js";

const OPERATOR_PATH = "/apps/operator/";

let apiServer;
let apiBaseUrl;
let tempDir;
let seedPacks;

async function loadSeedPacks() {
  if (!seedPacks) {
    seedPacks = JSON.parse(await readFile(new URL("../../data/seed-packs.json", import.meta.url), "utf8"));
  }
  return structuredClone(seedPacks);
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function openOperator(page) {
  await page.goto(`${OPERATOR_PATH}?apiBase=${encodeURIComponent(apiBaseUrl)}`);
  await expect(page.locator("#pageTitle")).toHaveText("运营总览");
  await expect(page.locator("#connectionStatus")).toHaveText("已连接");
}

async function startOperator(page, testInfo, packs = null) {
  tempDir = await mkdtemp(join(tmpdir(), `gugu-flash-operator-e2e-${testInfo.workerIndex}-`));
  const dataPath = join(tempDir, "packs.json");
  const statePath = join(tempDir, "runtime-state.json");
  await writeFile(dataPath, `${JSON.stringify(packs || await loadSeedPacks(), null, 2)}\n`);
  apiServer = createFlashHttpServer({ dataPath, statePath }).server;
  apiBaseUrl = await listen(apiServer);
  await openOperator(page);
}

async function openOperatorIpTab(page, tabId = "inventory") {
  await page.locator('[data-section="ips"]').click();
  await expect(page.locator("#section-ips")).toBeVisible();
  await page.locator(`[data-ip-tab="${tabId}"]`).click();
  await expect(page.locator(`[data-ip-tab-panel="${tabId}"]`)).toBeVisible();
}

async function stopOperator() {
  if (apiServer) await close(apiServer);
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  apiServer = null;
  apiBaseUrl = null;
  tempDir = null;
}

test.afterEach(async () => {
  await stopOperator();
});

function makeLargePackSet(basePacks, count) {
  const statuses = ["not_applied", "rights_review", "production_queued", "producing", "pack_review", "listed", "frozen"];
  const hardwareStatuses = ["h5_only", "hardware_candidate", "hardware_ready"];
  const ipCycle = [
    { ipId: "rain_gugu_universe", ipName: null, contentOrigin: "original", zoneId: "healing", zoneName: "情绪陪伴区" },
    { ipId: "midnight_train_project", ipName: null, contentOrigin: "original", zoneId: "adventure", zoneName: "像素冒险区" },
    { ipId: "soda_planet_fan", ipName: "汽水星球原创企划", contentOrigin: "fanwork", zoneId: "duo", zoneName: "双人互动区" },
    { ipId: "anime_starlight_academy", ipName: "星光魔法学院", contentOrigin: "fanwork", zoneId: "healing", zoneName: "情绪陪伴区" },
    { ipId: "mainstream_pokemon", ipName: "Pokémon / 宝可梦", contentOrigin: "fanwork", zoneId: "adventure", zoneName: "像素冒险区" },
  ];
  return Array.from({ length: count }, (_, index) => {
    const base = structuredClone(basePacks[index % basePacks.length]);
    const suffix = String(index + 1).padStart(3, "0");
    const ip = ipCycle[index % ipCycle.length];
    const storeStatus = statuses[index % statuses.length];
    const updatedAt = 1760000000000 + index * 60_000;
    base.id = `ops_scale_${suffix}`;
    base.title = `${base.title} 压测 ${suffix}`;
    base.author = {
      id: `creator_${String(index % 37).padStart(2, "0")}`,
      name: `创作者${String(index % 37).padStart(2, "0")}`,
    };
    base.contentOrigin = ip.contentOrigin;
    base.ipId = ip.ipId;
    base.ipName = ip.ipName;
    base.zoneId = ip.zoneId;
    base.zoneName = ip.zoneName;
    base.hardwareStatus = hardwareStatuses[index % hardwareStatuses.length];
    base.storeStatus = storeStatus;
    base.storeListing = base.storeListing ? { ...base.storeListing, status: storeStatus, updatedAt } : null;
    base.metrics = {
      plays: 900 + index * 73,
      likes: 80 + index * 11,
      saves: 20 + index * 7,
      comments: index % 41,
      remixes: index % 19,
      reports: index % 17 === 0 ? 2 : 0,
      completionRate: 0.45 + (index % 45) / 100,
    };
    base.tags = [...new Set([...(base.tags || []), "批量试用", `运营压测${index % 5}`])];
    base.createdAt = updatedAt - 86_400_000;
    base.updatedAt = updatedAt;
    return base;
  });
}

test("standalone operator console manages content, IP, review, hardware, SLA, and support flows", async ({ page }, testInfo) => {
  await startOperator(page, testInfo);

  await expect(page.locator("#summaryGrid")).toContainText("公开内容");
  await expect(page.locator("#priorityList")).toContainText("汽水星球");

  await page.locator('[data-section="works"]').click();
  await expect(page.locator("#section-works")).toBeVisible();
  await expect(page.locator("#worksTable")).toContainText("热度分");
  await expect(page.locator("#worksTable")).toContainText("雨天咕咕");
  await page.locator("#workSearchInput").fill("汽水");
  await expect(page.locator("#worksTable")).toContainText("汽水星球");

  await openOperatorIpTab(page, "inventory");
  await expect(page.locator("#ipTable")).toContainText("雨天咕咕宇宙");
  await page.locator("#ipSearchInputOperator").fill("魔法");
  await expect(page.locator("#ipTable")).toContainText("星光魔法学院");
  await openOperatorIpTab(page, "personas");
  await expect(page.locator("#ipPersonaDirectory")).toContainText("露娜");
  await expect(page.locator("#ipPersonaDirectory")).toContainText("夜巡生");

  await page.locator('[data-section="store"]').click();
  await expect(page.locator("#section-store")).toBeVisible();
  await expect(page.locator("#storeList")).toContainText("雨天咕咕");
  await expect(page.locator("#storeList")).toContainText("汽水星球");

  await page.locator('[data-section="review"]').click();
  const reviewCard = page.locator("#reviewList .record-card").filter({ hasText: "汽水星球" });
  await expect(reviewCard).toBeVisible();
  await reviewCard.getByRole("button", { name: "✓ 通过", exact: true }).click();
  await expect(page.locator("#toast")).toContainText("操作已提交");

  await page.locator('[data-section="hardware"]').click();
  await expect(page.locator("#hardwareList")).toContainText("汽水星球");
  await expect(page.locator("#hardwareList")).toContainText("等待制作");

  await page.locator('[data-section="sla"]').click();
  await expect(page.locator("#slaList")).toBeVisible();
  await expect(page.locator("#alertList")).toBeVisible();

  await page.locator('[data-section="support"]').click();
  await page.locator("#supportSearchButton").click();
  await expect(page.locator("#supportResults")).toContainText("匹配记录");

  await page.locator('[data-section="logs"]').click();
  await expect(page.locator("#logList")).toContainText("approve_review_task");
});

test("operator work library stays usable with high-volume content", async ({ page }, testInfo) => {
  const packs = makeLargePackSet(await loadSeedPacks(), 126);
  await startOperator(page, testInfo, packs);

  await page.locator('[data-section="works"]').click();
  await expect(page.locator("#worksStats")).toContainText("126");
  await expect(page.locator("#worksTable .table-footer")).toContainText("1-20 / 126");
  await expect(page.locator("#worksTable tbody tr")).toHaveCount(20);

  await page.locator('[data-page-table="works"][data-page-action="next"]').click();
  await expect(page.locator("#worksTable .table-footer")).toContainText("21-40 / 126");

  await page.locator("#workSearchInput").fill("压测 099");
  await expect(page.locator("#worksTable")).toContainText("压测 099");
  await expect(page.locator("#worksTable .table-footer")).toContainText("1-1 / 1");

  await page.locator("#workSearchInput").fill("");
  await page.locator('[data-table="works"][data-field="pageSize"]').selectOption("50");
  await expect(page.locator("#worksTable .table-footer")).toContainText("1-50 / 126");

  await openOperatorIpTab(page, "inventory");
  await expect(page.locator("#ipTable")).toContainText("热度分");
  await page.locator('[data-table="ips"][data-field="type"]').selectOption("mainstream_external_ip");
  await expect(page.locator("#ipTable")).toContainText("Pokémon / 宝可梦");
});

test("operator IP collection imports candidates with full character descriptions", async ({ page }, testInfo) => {
  await startOperator(page, testInfo);

  await openOperatorIpTab(page, "collect");
  await page.locator("#ipCollectorQuery").fill("排球");
  await page.locator("#ipCandidateSearchButton").click();

  await expect(page.locator("#ipCandidateResults")).toContainText("Haikyu!! / 排球少年");
  await expect(page.locator("#ipCandidateResults")).toContainText("日向翔阳");
  await expect(page.locator("#ipCandidateResults")).toContainText("小个子攻手");

  await openOperatorIpTab(page, "collect");
  await page.locator("#ipCollectButton").click();
  await expect(page.locator("#ipCollectorMessage")).toContainText(/已入池|入池完成/);

  await openOperatorIpTab(page, "inventory");
  await page.locator("#ipSearchInputOperator").fill("排球");
  await expect(page.locator("#ipTable")).toContainText("Haikyu!! / 排球少年");
  await expect(page.locator("#ipTable")).toContainText("影山飞雄");
  await openOperatorIpTab(page, "personas");
  await expect(page.locator("#ipPersonaDirectory")).toContainText("团队成长");
  await expect(page.locator("#ipPersonaDirectory")).toContainText("天才二传手");
});

test("operator web-wide IP search completes existing IP character rosters", async ({ page }, testInfo) => {
  await startOperator(page, testInfo);

  await openOperatorIpTab(page, "inventory");
  await page.locator("#ipSearchInputOperator").fill("火影");
  await expect(page.locator("#ipTable")).toContainText("Naruto / 火影忍者");
  await openOperatorIpTab(page, "personas");
  await expect(page.locator("#ipPersonaDirectory")).not.toContainText("旗木卡卡西");

  await openOperatorIpTab(page, "collect");
  await page.locator("#ipCollectorQuery").fill("火影");
  await page.locator("#ipCandidateSearchButton").click();
  await expect(page.locator("#ipCandidateResults")).toContainText("可补全");
  await expect(page.locator("#ipCandidateResults")).toContainText("旗木卡卡西");
  await expect(page.locator("#ipCandidateResults")).toContainText("第七班导师");

  await openOperatorIpTab(page, "collect");
  await page.locator("#ipCollectButton").click();
  await expect(page.locator("#ipCollectorMessage")).toContainText("补全 1 个既有 IP");
  await openOperatorIpTab(page, "personas");
  await expect(page.locator("#ipPersonaDirectory")).toContainText("旗木卡卡西");
  await expect(page.locator("#ipPersonaDirectory")).toContainText("春野樱");
  await expect(page.locator("#ipPersonaDirectory")).toContainText("日向雏田");
});

test("operator can sweep the full web-wide IP catalog into the pool", async ({ page }, testInfo) => {
  await startOperator(page, testInfo);

  await openOperatorIpTab(page, "collect");
  await page.locator("#ipSweepAllButton").click();

  await expect(page.locator("#ipCollectorMessage")).toContainText(/全网搜索完成|全网扫库完成|入池完成|回退本地目录/, { timeout: 15000 });
  await expect(page.locator("#ipCollectorMessage")).toContainText(/已入池|入池完成/);
  await openOperatorIpTab(page, "inventory");
  await page.locator("#ipSearchInputOperator").fill("海贼王");
  await expect(page.locator("#ipTable")).toContainText(/路飞|索隆|罗宾/);
  await expect(page.locator("#ipPersonaDirectory")).toContainText(/草帽|剑士|考古学者/);
  await page.locator("#ipSearchInputOperator").fill("龙珠");
  await expect(page.locator("#ipPersonaDirectory")).toContainText(/孙悟空|贝吉塔|布尔玛/);
  await expect(page.locator("#ipPersonaDirectory")).toContainText(/热血战斗|骄傲的战士|科技与冒险/);
  await page.locator("#ipSearchInputOperator").fill("哈利");
  await expect(page.locator("#ipTable")).toContainText("哈利");
  await expect(page.locator("#ipPersonaDirectory")).toContainText(/赫敏|妙麗|暂无角色/);
  await page.locator("#ipSearchInputOperator").fill("初音");
  await expect(page.locator("#ipTable")).toContainText("Vocaloid / 初音未来");
  await expect(page.locator("#ipPersonaDirectory")).toContainText(/巡音流歌|虚拟歌手|暂无角色/);
});
