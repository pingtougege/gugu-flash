import { expect, test } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createFlashHttpServer } from "../../apps/backend/src/flash-http-server.js";

const APP_PATH = "/apps/web/";
const PROMPT_PLACEHOLDER = "例如：宝可梦中心雨夜值班，主角和皮卡丘一起找回走丢的伊布";

let apiServer;
let apiBaseUrl;
let tempDir;
let previousAiDisabled;
let previousImageAiDisabled;

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

async function resetHttpApp(page) {
  await page.addInitScript((baseUrl) => {
    localStorage.clear();
    localStorage.setItem("gugu-flash:api-mode", "http");
    localStorage.setItem("gugu-flash:api-base-url", baseUrl);
  }, apiBaseUrl);
  await page.goto(`${APP_PATH}?api=http&apiBase=${encodeURIComponent(apiBaseUrl)}`);
  await expect(page.locator("#feedScreen")).toBeVisible();
  await expect(page.locator("#runtimeBadge")).toHaveText("API");
}

async function openProfile(page) {
  await page.locator("#profileButton").click();
  await expect(page.locator("#profileScreen")).toBeVisible();
}

async function openCreate(page) {
  await openProfile(page);
  await page.locator("#openCreateButton").click();
  await expect(page.locator("#createScreen")).toBeVisible();
}

async function advanceCreateToSettings(page) {
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="settings"]')).toBeVisible();
}

async function generateDraft(page) {
  await expect(page.locator('[data-create-step="prompt"]')).toBeVisible();
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="settings"]')).toHaveClass(/active/);
  await expect(page.locator("#createWizardNextButton")).toHaveText("启动 AI 制作");
  await expect(page.locator("#createWizardNextButton")).toBeEnabled();
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="preview"]')).toBeVisible();
}

async function publishDraft(page) {
  await page.locator('[data-create-step-target="publish"]').click();
  await expect(page.locator('[data-create-step="publish"]')).toBeVisible();
  const publishButton = page.locator('[data-testid="create-publish"]');
  await expect(publishButton).toBeVisible();
  await publishButton.click();
}

async function createAndPublishOriginal(page, title) {
  await openCreate(page);
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill(title);
  await generateDraft(page);
  await publishDraft(page);
  await expect(page.locator("#feedScreen")).toBeVisible();
  await expect(page.locator("#feedTitle")).toContainText(title.slice(0, 2));
}

test.beforeEach(async ({ page }, testInfo) => {
  previousAiDisabled = process.env.GUGU_FLASH_AI_DISABLED;
  previousImageAiDisabled = process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
  process.env.GUGU_FLASH_AI_DISABLED = "1";
  process.env.GUGU_FLASH_IMAGE_AI_DISABLED = "1";
  tempDir = await mkdtemp(join(tmpdir(), `gugu-flash-http-e2e-${testInfo.workerIndex}-`));
  const dataPath = join(tempDir, "packs.json");
  apiServer = createFlashHttpServer({ dataPath }).server;
  apiBaseUrl = await listen(apiServer);
  await resetHttpApp(page);
});

test.afterEach(async () => {
  if (apiServer) await close(apiServer);
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
  if (previousAiDisabled === undefined) {
    delete process.env.GUGU_FLASH_AI_DISABLED;
  } else {
    process.env.GUGU_FLASH_AI_DISABLED = previousAiDisabled;
  }
  if (previousImageAiDisabled === undefined) {
    delete process.env.GUGU_FLASH_IMAGE_AI_DISABLED;
  } else {
    process.env.GUGU_FLASH_IMAGE_AI_DISABLED = previousImageAiDisabled;
  }
  apiServer = null;
  apiBaseUrl = null;
  tempDir = null;
  previousAiDisabled = null;
  previousImageAiDisabled = null;
});

test("web can publish, list, purchase, download, and sync through Backend Alpha HTTP mode", async ({ page }) => {
  const title = "后端联调小剧场";

  await createAndPublishOriginal(page, title);
  await openProfile(page);

  const workCard = page.locator(".work-card").filter({ hasText: title.slice(0, 2) });
  await expect(workCard).toBeVisible();
  await workCard.getByRole("button", { name: "申请上架", exact: true }).click();
  await page.locator("#listingTermsAccepted").check();
  await page.locator("#submitListingButton").click();
  await expect(workCard).toContainText("上架审核中");

  await page.getByRole("button", { name: "首页", exact: true }).click();
  await page.locator("#operatorButton").click({ modifiers: ["Alt"] });
  const opsCard = page.locator("#opsStoreList .ops-card").filter({ hasText: title.slice(0, 2) });
  await expect(opsCard).toBeVisible();

  for (const label of ["初审通过", "开始制作", "提交复核", "正式上架"]) {
    await opsCard.getByRole("button", { name: label, exact: true }).click();
  }
  await expect(opsCard).toContainText("已上架");

  await page.getByRole("button", { name: "商店", exact: true }).click();
  const storeItem = page.locator(".store-item").filter({ hasText: title.slice(0, 2) });
  await expect(storeItem).toBeVisible();

  await expect(storeItem.getByRole("button")).toHaveText("获取");
  await storeItem.getByRole("button").click();
  await expect(storeItem.getByRole("button")).toHaveText("装到设备");
  await storeItem.getByRole("button").click();
  await expect(storeItem.getByRole("button")).toHaveText("装到设备");
  await storeItem.getByRole("button").click();
  await expect(storeItem.getByRole("button")).toHaveText("使用中");

  await page.locator("#profileButton").click();
  await expect(page.locator("#installedPackName")).toContainText(title.slice(0, 2));
});
