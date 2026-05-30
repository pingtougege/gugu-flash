import { expect, test } from "@playwright/test";

const APP_PATH = "/apps/web/";
const PROMPT_PLACEHOLDER = "例如：宝可梦中心雨夜值班，主角和皮卡丘一起找回走丢的伊布";
const FANWORK_PROMPT_EXAMPLE = "分支冒险文字游戏：主角皮卡丘在宝可梦中心雨夜值班，玩家目标是找回走丢的伊布并查清停电原因；加入值班护士和陌生训练家；设计4场、2个关键选择、2个结局；每场要有背景、对白、选项跳转和情绪标签；结尾有轻微反转。";

async function resetApp(page) {
  await page.goto(APP_PATH);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("#feedScreen")).toBeVisible();
  await expect(page.locator("#runtimeBadge")).toHaveText("Mock");
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

async function openPromptPolish(page) {
  await page.locator("[data-prompt-polish-open]").click();
  await expect(page.locator("#promptPolishModal")).toBeVisible();
}

async function openPromptPolishResult(page) {
  await openPromptPolish(page);
  await expect(page.locator('#promptPolishModal [data-step-ai-input]')).toBeVisible();
  await expect(page.locator('#promptPolishModal [data-step-ai-result]')).toContainText("AI 已重写故事提示词");
}

async function advanceCreateToSettings(page) {
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="settings"]')).toBeVisible();
}

async function expectNoBoxOverlap(page, firstSelector, secondSelector) {
  const overlap = await page.evaluate(([first, second]) => {
    const left = document.querySelector(first)?.getBoundingClientRect();
    const right = document.querySelector(second)?.getBoundingClientRect();
    if (!left || !right) return false;
    return !(left.bottom <= right.top || left.top >= right.bottom || left.right <= right.left || left.left >= right.right);
  }, [firstSelector, secondSelector]);
  expect(overlap, `${firstSelector} should not overlap ${secondSelector}`).toBe(false);
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
  await expect(page.locator("#draftTitle")).toHaveText(title);
  await publishDraft(page);
  await expect(page.locator("#feedScreen")).toBeVisible();
  await expect(page.locator("#feedTitle")).toHaveText(title);
  await expect(page.locator("#appToast")).toHaveText("已发布到内容流。");
}

async function applyStoreListing(page, title) {
  await openProfile(page);
  const workCard = page.locator(".work-card").filter({ hasText: title });
  await expect(workCard).toBeVisible();
  await workCard.getByRole("button", { name: "申请上架", exact: true }).click();

  const application = page.locator("#listingApplication");
  await expect(application).toBeVisible();
  await expect(application).toContainText(title);
  await expect(page.locator("#submitListingButton")).toBeDisabled();
  await page.locator("#listingTermsAccepted").check();
  await expect(page.locator("#submitListingButton")).toBeEnabled();
  await page.locator("#submitListingButton").click();

  await expect(workCard).toContainText("上架审核中");
  await expect(workCard).toContainText("已提交，审核通过后会继续适配吧唧。");
}

async function advanceStoreListing(page, title) {
  await page.getByRole("button", { name: "首页", exact: true }).click();
  await page.locator("#operatorButton").click({ modifiers: ["Alt"] });
  await expect(page.locator("#operatorScreen")).toBeVisible();

  const opsCard = page.locator("#opsStoreList .ops-card").filter({ hasText: title });
  await expect(opsCard).toBeVisible();
  for (const label of ["初审通过", "开始制作", "提交复核", "正式上架"]) {
    const action = opsCard.getByRole("button", { name: label, exact: true });
    await expect(action).toBeEnabled();
    await action.click();
  }
  await expect(opsCard).toContainText("已上架");
  await expect(page.locator("#opsHardwareList")).toContainText(title);
  await expect(page.locator("#opsHardwareList")).toContainText("已开放下载");
}

test.beforeEach(async ({ page }) => {
  await resetApp(page);
});

test("original work can be published without entering the store flow", async ({ page }) => {
  const title = "月亮小邮差";

  await createAndPublishOriginal(page, title);
  await openProfile(page);

  const workCard = page.locator(".work-card").filter({ hasText: title });
  await expect(workCard).toContainText("已发布");
  await expect(workCard).toContainText("喜欢这个作品的话，可以申请进商店。");
});

test("mobile guide defaults to idea role generation playtest and publish checks", async ({ page }) => {
  await openCreate(page);
  await expect(page.locator("#createWizardNav")).toContainText("创意");
  await expect(page.locator("#createWizardNav")).toContainText("角色/IP");
  await expect(page.locator("#createWizardNav")).toContainText("生成");
  await expect(page.locator("#createWizardNav")).toContainText("试玩");
  await expect(page.locator("#createWizardNav")).toContainText("发布检查");

  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("月台上的星星收信员");
  await generateDraft(page);

  await expect(page.locator('[data-create-step="script"]')).toBeHidden();
  await expect(page.locator('[data-create-step="views"]')).toBeHidden();
  await expect(page.locator('[data-create-step="assets"]')).toBeHidden();
  await expect(page.locator("[data-create-advanced-toggle]")).toHaveText("高级编辑");

  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="playtest"]')).toHaveClass(/active/);
  await expect(page.locator('[data-mobile-guide-step="playtest"]')).toHaveClass(/active/);
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="publish"]')).toHaveClass(/active/);
  await expect(page.locator('[data-mobile-guide-step="publish"]')).toHaveClass(/active/);
  await expect(page.locator('[data-testid="create-publish"]')).toBeVisible();
});

test("generated creation deck keeps ownership as an editable card", async ({ page }) => {
  await openCreate(page);
  await expect(page.locator("#createWizardNav")).toBeVisible();
  await expect(page.locator("#createWizardNav")).toContainText("创意");
  await expect(page.locator("#createWizardNav")).toContainText("角色/IP");
  await expect(page.locator("#createWizardNav")).toContainText("生成");
  await expect(page.locator("#createWizardNav")).toContainText("试玩");
  await expect(page.locator("#createWizardNav")).toContainText("发布检查");
  await expect(page.locator('[data-mobile-guide-step="prompt"]')).toHaveClass(/active/);
  await expect(page.locator('[data-create-step="prompt"] .create-step-title')).toHaveCount(0);
  await expect(page.locator("#promptPolishLauncher")).toBeVisible();
  await expect(page.locator("#promptPolishModal")).toBeHidden();
  await openPromptPolish(page);
  await expect(page.locator('#promptPolishModal [data-step-ai-result]')).toContainText("先写一句故事创意");
  await page.locator("#promptPolishModal button[data-prompt-polish-close]").click();
  await expect(page.locator("#promptPolishModal")).toBeHidden();
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("雨夜便利店预言猫");
  await generateDraft(page);

  await expect(page.locator('[data-mobile-guide-step="making"]')).toHaveClass(/active/);
  await expect(page.locator("#createWizardNav")).not.toContainText("立绘");
  await expect(page.locator("#createWizardNav")).not.toContainText("剧本");
  await expect(page.locator('[data-create-step="preview"]')).toHaveClass(/active/);
  await expect(page.locator('[data-create-step="script"]')).toBeHidden();
  await expect(page.locator('[data-create-step="views"]')).toBeHidden();
  await expect(page.locator('[data-create-step="assets"]')).toBeHidden();
  await expect(page.locator("#createWizardNextButton")).toHaveText("去试玩");
  await expect(page.locator("[data-create-advanced-toggle]")).toHaveText("高级编辑");
  await page.locator("[data-create-advanced-toggle]").click();
  await expect(page.locator(".create-professional-rail")).toContainText("剧本");
  await expect(page.locator(".create-professional-rail")).toContainText("立绘");
  await expect(page.locator(".create-professional-rail")).toContainText("场景");
  await expect(page.locator("#draftOverviewGrid")).toContainText("标签");
  await expect(page.locator("#draftOverviewGrid")).toContainText("归属");
  await expect(page.locator("#draftTagsInput")).not.toHaveValue(/AI草稿|可二创|原创|完整文字游戏|玩家目标/);
  await expect(page.locator("#draftOverviewGrid")).not.toContainText("AI草稿");
  await page.locator("#draftTitleInput").fill("");
  await expect(page.locator("#draftTitleInput")).toHaveValue("");
  await expect(page.locator("#draftTitle")).toHaveText("未命名作品");
  await page.locator("#draftTitleInput").fill("雨夜便利店预言猫");
  await expect(page.locator("#characterCardGrid")).toBeHidden();
  await page.locator('[data-create-step-target="settings"]').click();

  await expect(page.locator('[data-create-step="settings"]')).toHaveClass(/active/);
  await expect(page.locator('[data-create-step="settings"] .create-step-title')).toContainText("角色");
  await expect(page.locator('[data-step-ai-panel="settings"]')).toHaveCount(0);
  await expect(page.locator('[data-create-step="settings"] .create-step-title')).toContainText("只管理会进入故事的出场角色");
  await expect(page.locator("#originSelector")).toBeHidden();
  await expect(page.locator("#ipHeadingTitle")).toBeHidden();
  await expect(page.locator("#createRightsNotice")).toBeHidden();
  await expect(page.locator("#personaSelector")).toContainText("创建原创角色");
  await expect(page.locator("#personaSelector")).toContainText("选择原著角色");
  await expect(page.locator("#characterCardGrid")).toBeVisible();
  await page.locator("[data-persona-mode='custom']").click();
  await page.locator("#customPersonaNameInput").fill("夜班店员");
  await page.locator("#customPersonaTaglineInput").fill("原创配角，负责提供便利店异常线索。");
  await page.locator("#addCustomCharacterButton").click();
  await expect(page.locator("#characterCardGrid")).toContainText("夜班店员");
  await page.locator("[data-persona-mode='custom']").click();
  await page.locator("#customPersonaNameInput").fill("临时目击者");
  await page.locator("#customPersonaTaglineInput").fill("只用于确认删除不会残留。");
  await page.locator("#addCustomCharacterButton").click();
  await expect(page.locator("#characterCardGrid")).toContainText("临时目击者");
  await page.locator(".story-character-card").filter({ hasText: "临时目击者" }).getByRole("button", { name: "删除" }).click();
  await expect(page.locator("#characterCardGrid")).not.toContainText("临时目击者");
  await expect(page.locator("#characterCardGrid")).toContainText("夜班店员");
  await expect(page.locator('[data-create-step="settings"]')).not.toContainText("角色多视图");
  await expect(page.locator("#characterViewGrid")).toBeHidden();
  await expect(page.locator('[data-step-ai-panel="views"]')).toBeHidden();
  await expect(page.locator("#createWizardNextButton")).toHaveText("去剧本");
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="script"]')).toHaveClass(/active/);
  await expect(page.locator("#draftScriptText")).toBeHidden();
  await expect(page.locator("#scriptSceneTabs button")).toHaveCount(5);
  await expect(page.locator("#scriptSceneTabs button").filter({ hasText: "入口" })).toBeVisible();
  await expect(page.locator("#scriptScenePreview")).toContainText("雨夜便利店");
  await page.locator("#scriptSceneTabs button").filter({ hasText: "1" }).click();
  await expect(page.locator("#scriptSceneModal")).toBeVisible();
  await expect(page.locator("#scriptSceneReadable")).toContainText("这场要解决什么");
  await expect(page.locator("#scriptSceneReadable")).toContainText("阻碍和转折");
  await expect(page.locator("#scriptSceneReadable")).toContainText("选择压力");
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/## 第1场/);
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/戏剧问题：/);
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/地点：雨夜便利店/);
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/时间：雨夜/);
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/出场角色：.*夜班店员/);
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/夜班店员：/);
  await expect(page.locator("#scriptSceneEditor")).not.toHaveValue(/临时目击者/);
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/【场面】/);
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/【正文】/);
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/【选择】/);
  await expect(page.locator("#scriptSceneEditor")).not.toHaveValue(/让玩家知道/);
  await expect(page.locator("#scriptSceneEditor")).not.toHaveValue(/时间：未定/);
  await page.locator("#scriptSceneEditor").fill("## 第1场：手动改过的场景\n\n地点：雨夜便利店入口\n时间：雨夜 22:40\n\n【正文】\n夜班店员：我先把门口的铃声记下来。");
  await page.locator("#saveScriptSceneButton").click();
  await expect(page.locator("#scriptSceneModal")).toBeHidden();
  await page.locator("#scriptSceneTabs button").filter({ hasText: "1" }).click();
  await expect(page.locator("#scriptSceneEditor")).toHaveValue(/手动改过的场景/);
  await page.locator("#scriptSceneModal").getByRole("button", { name: "关闭", exact: true }).click();
  await page.locator('[data-create-step-target="playtest"]').click();
  await expect(page.locator('[data-create-step="playtest"]')).toHaveClass(/active/);
  await expect(page.locator("#draftPlaytestPanel")).toContainText("我先把门口的铃声记下来");
  await page.locator('[data-create-step-target="script"]').click();
  await expect(page.locator('[data-create-step="script"]')).toHaveClass(/active/);
  await expect(page.locator("#createWizardNextButton")).toHaveText("去立绘");
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="views"]')).toHaveClass(/active/);
  await expect(page.locator('[data-create-step="views"] .create-step-title')).toContainText("角色多视图");
  await expect(page.locator("#characterViewGrid")).toContainText("正面");
  await expect(page.locator('[data-step-ai-panel="views"]')).toBeVisible();
  await expect(page.locator('[data-testid="create-generate"]')).toBeHidden();

  await expect(page.locator("#createWizardNextButton")).toHaveText("去场景");
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="assets"]')).toHaveClass(/active/);
  await expect(page.locator('[data-create-step="assets"] .create-step-title')).toContainText("场景和背景");
  const sceneEditorCount = await page.locator(".scene-editor-item").count();
  await expect(page.locator(".scene-background-row")).toHaveCount(sceneEditorCount);
});

test("prompt AI rewrite proposes a real story prompt before applying", async ({ page }) => {
  await openCreate(page);
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("雨夜便利店遇到会预言的猫");
  await openPromptPolishResult(page);

  const result = page.locator('#promptPolishModal [data-step-ai-result]');
  await expect(result).toContainText("AI 已重写故事提示词");
  await expect(result.locator(".prompt-audit-panel")).toBeVisible();
  await expect(result).toContainText("玩家目标");
  await expect(result).toContainText("结构");
  await expect(result).toContainText("修改前");
  await expect(result).toContainText("修改后");
  await expect(page.locator("#promptInput")).toHaveValue("雨夜便利店遇到会预言的猫");

  await result.locator("[data-step-ai-accept]").click();
  await expect(page.locator("#promptPolishModal")).toBeHidden();
  await expect(page.locator('[data-create-step="settings"]')).toHaveClass(/active/);
  await expect(page.locator("#promptInput")).toHaveValue(/完整文字游戏向/);
  await expect(page.locator("#promptInput")).toHaveValue(/玩家目标/);
  await expect(page.locator("#promptInput")).toHaveValue(/4场/);
  await expect(page.locator("#promptInput")).toHaveValue(/2个关键选择/);
  await expect(page.locator("#promptInput")).toHaveValue(/背景、对白、选项跳转和情绪标签/);
  await expect(page.locator("#promptInput")).not.toHaveValue("雨夜便利店遇到会预言的猫；");
});

test("prompt AI rewrite preserves requested scene count", async ({ page }) => {
  await openCreate(page);
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("雨夜便利店遇到会预言的猫，场景到10个");
  await openPromptPolishResult(page);

  const result = page.locator('#promptPolishModal [data-step-ai-result]');
  await expect(result).toContainText("AI 已重写故事提示词");
  await result.locator("[data-step-ai-accept]").click();
  await expect(page.locator("#promptInput")).toHaveValue(/设计10场/);
  await expect(page.locator("#promptInput")).not.toHaveValue(/设计4场/);
});

test("prompt AI rewrite preserves concrete requirements and suggests IP/template", async ({ page }) => {
  await openCreate(page);
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("宝可梦中心夜班，玩家目标是和皮卡丘找回伊布；设计6场、3个关键选择、2个结局；不要恐怖");
  await openPromptPolishResult(page);

  const result = page.locator('#promptPolishModal [data-step-ai-result]');
  await expect(result.locator(".prompt-audit-panel")).toBeVisible();
  await expect(result.locator('[title*="6场 · 3个关键选择 · 2个结局"]')).toHaveCount(1);
  await expect(result.locator('[title*="下一步建议选择 Pokémon / 宝可梦"]')).toHaveCount(1);
  await result.locator("[data-step-ai-accept]").click();

  await expect(page.locator("#promptInput")).toHaveValue(/设计6场/);
  await expect(page.locator("#promptInput")).toHaveValue(/3个关键选择/);
  await expect(page.locator("#promptInput")).toHaveValue(/2个结局/);
  await expect(page.locator("#promptInput")).toHaveValue(/不走恐怖路线/);
  await expect(page.locator("#promptInput")).not.toHaveValue(/设计4场/);
  await expect(page.locator(".template.active")).toHaveText("分支冒险");
  await expect(page.locator("#createSettingsSummary")).toContainText("二创");
  await expect(page.locator("#createSettingsSummary")).toContainText("Pokémon / 宝可梦");
});

test("prompt examples set creation mode and fanwork ownership before generation", async ({ page }) => {
  await openCreate(page);

  await page.locator("#promptExampleButton").click();
  await expect(page.locator("#promptInput")).toHaveValue("一个雨夜便利店里，主角遇到会预言明天的猫");
  await expect(page.locator(".template.active")).toHaveText("分支冒险");
  await expect(page.locator("#createSettingsSummary")).toContainText("原创");
  await expect(page.locator("#templateHint")).toHaveText("多分支 · 多结局 · 探索推进");

  await page.locator("#promptFanworkExampleButton").click();
  await expect(page.locator("#promptInput")).toHaveValue(FANWORK_PROMPT_EXAMPLE);
  await expect(page.locator("#promptInput")).toHaveValue(/玩家目标/);
  await expect(page.locator("#promptInput")).toHaveValue(/4场/);
  await expect(page.locator("#promptInput")).toHaveValue(/选项跳转和情绪标签/);
  await expect(page.locator(".template.active")).toHaveText("分支冒险");
  await expect(page.locator("#createSettingsSummary")).toContainText("二创");
  await expect(page.locator("#createSettingsSummary")).toContainText("Pokémon / 宝可梦");
  await expect(page.locator("#createSettingsSummary")).toContainText("皮卡丘");

  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="settings"]')).toHaveClass(/active/);
  await expect(page.locator("#ipHeadingTitle")).toHaveText("二创 IP");
  await expect(page.locator('[data-ip="mainstream_pokemon"]')).toHaveClass(/active/);
  await expect(page.locator("#personaSelector")).toContainText("皮卡丘");
  await expect(page.locator("#createRightsNotice")).toContainText("不代表官方授权");
});

test("my work can be edited and deleted", async ({ page }) => {
  const title = "可编辑小剧场";
  const updatedTitle = "已经改好的小剧场";

  await createAndPublishOriginal(page, title);
  await openProfile(page);

  const workCard = page.locator(".work-card").filter({ hasText: title });
  await expect(workCard).toBeVisible();
  await workCard.getByRole("button", { name: "编辑", exact: true }).click();

  await expect(page.locator("#createScreen")).toBeVisible();
  await expect(page.locator('[data-create-step="preview"]')).toBeVisible();
  await page.locator("#draftTitleInput").fill(updatedTitle);
  await page.locator('[data-create-step-target="publish"]').click();
  await expect(page.locator('[data-create-step="publish"]')).toBeVisible();
  await page.locator('[data-testid="create-publish"]').click();

  await expect(page.locator("#profileScreen")).toBeVisible();
  await expect(page.locator(".work-card").filter({ hasText: updatedTitle })).toBeVisible();
  await expect(page.locator(".work-card").filter({ hasText: title })).toBeHidden();

  const updatedCard = page.locator(".work-card").filter({ hasText: updatedTitle });
  page.once("dialog", (dialog) => dialog.accept());
  await updatedCard.getByRole("button", { name: "删除", exact: true }).click();
  await expect(page.locator(".work-card").filter({ hasText: updatedTitle })).toBeHidden();
});

test("fanwork creation is blocked until an IP from the pool is selected", async ({ page }) => {
  await openCreate(page);
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("汽水星球黄昏冒泡");
  await advanceCreateToSettings(page);

  await page.locator("#originSelector").getByRole("button", { name: "二创", exact: true }).click();
  await expect(page.locator("#ipHeadingTitle")).toHaveText("二创 IP");

  await expect(page.locator("#draftPreview")).toBeHidden();
  await expect(page.locator("#createWizardNextButton")).toHaveText("启动 AI 制作");
  await expect(page.locator("#createWizardNextButton")).toBeDisabled();
  await page.locator("#createWizardPrevButton").click();
  await expect(page.locator('[data-create-step="prompt"]')).toHaveClass(/active/);
  await expect(page.locator("#createWizardNextButton")).toHaveText("下一步：归属和主角");
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="settings"]')).toHaveClass(/active/);

  await page.locator("#createIpSearchInput").fill("汽水");
  await page.locator('[data-ip="soda_planet_fan"]').click();
  await expect(page.locator("#personaSelector")).toContainText("选择原著角色");
  await expect(page.locator("#createWizardNextButton")).toBeDisabled();
  await page.locator("[data-persona-picker-open]").click();
  await expect(page.locator("#personaPickerModal")).toBeVisible();
  await expect(page.locator("#personaPickerList")).toContainText("汽水咕咕");
  await page.locator('#personaPickerList [data-persona="soda_gugu"]').click();
  await expect(page.locator("#personaSelector")).toContainText("汽水咕咕");
  await expect(page.locator("#createWizardNextButton")).toBeEnabled();
  await page.locator("#createWizardPrevButton").click();
  await expect(page.locator('[data-create-step="prompt"]')).toBeVisible();
  await generateDraft(page);
  await expect(page.locator("#draftMeta")).toContainText("汽水星球原创企划");
});

test("fanwork IP search keeps available protagonists visible after choosing an IP", async ({ page }) => {
  await openCreate(page);
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("鬼灭雨夜任务");
  await advanceCreateToSettings(page);

  await page.locator("#originSelector").getByRole("button", { name: "二创", exact: true }).click();
  await page.locator("#createIpSearchInput").fill("鬼灭");
  await page.locator('[data-ip="mainstream_demon_slayer"]').click();

  await expect(page.locator("#createSettingsSummary")).toContainText("Demon Slayer / 鬼灭之刃");
  await expect(page.locator("#createRightsNotice")).toContainText("不代表官方授权");
  await expect(page.locator("#personaSelector")).toContainText("创建原创角色");
  await expect(page.locator("#personaSelector")).toContainText("选择原著角色");
  await expect(page.locator("#personaSelector")).not.toContainText("灶门炭治郎");
  await expect(page.locator("#personaSelector .persona-option")).toHaveCount(2);
  await expect(page.locator("[data-persona-picker-open]")).not.toHaveClass(/active/);
  await expect(page.locator("#createWizardNextButton")).toBeDisabled();
  await page.locator("[data-persona-picker-open]").click();
  await expect(page.locator("#personaPickerModal")).toBeVisible();
  await expect(page.locator("#personaPickerList")).toContainText("灶门祢豆子");
  await expect(page.locator("#personaPickerList")).toContainText("我妻善逸");
  await expect(page.locator("#personaPickerList")).toContainText("胡蝶忍");
  await expect(page.locator("#personaPickerList")).toContainText("鬼舞辻无惨");
  await expect(page.locator("#personaPickerList")).toContainText("累");
  await expect(page.locator("#personaPickerList .persona-option")).toHaveCount(22);
  await page.locator('#personaPickerList [data-persona="demon_slayer_nezuko"]').click();
  await expect(page.locator("#personaPickerModal")).toBeHidden();
  await expect(page.locator("#personaSelector")).toContainText("灶门祢豆子");
  await expect(page.locator("#createWizardNextButton")).toBeEnabled();
});

test("fanwork IP search stays responsive and accepts pinyin aliases", async ({ page }) => {
  await openCreate(page);
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("宝可梦中心夜班");
  await advanceCreateToSettings(page);

  await page.locator("#originSelector").getByRole("button", { name: "二创", exact: true }).click();
  for (const query of ["gui mie", "bao ke meng", "nao ke meng"]) {
    await page.locator("#createIpSearchInput").fill(query);
    await expect(page.locator("#createIpSearchInput")).toHaveValue(query);
  }

  await expect(page.locator('[data-ip="mainstream_pokemon"]')).toBeVisible();
  await expect(page.locator('[data-ip="mainstream_pokemon"]')).toContainText("Pokémon / 宝可梦");
  await page.locator('[data-ip="mainstream_pokemon"]').click();
  await expect(page.locator("#personaSelector")).toContainText("选择原著角色");
  await page.locator("[data-persona-picker-open]").click();
  await expect(page.locator("#personaPickerList")).toContainText("皮卡丘");
});

test("fanwork creation can use an original protagonist", async ({ page }) => {
  await openCreate(page);
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("鬼灭雨夜任务，一个原创巡夜人误入藤花林");
  await advanceCreateToSettings(page);

  await page.locator("#originSelector").getByRole("button", { name: "二创", exact: true }).click();
  await page.locator("#createIpSearchInput").fill("鬼灭");
  await page.locator('[data-ip="mainstream_demon_slayer"]').click();
  await page.locator("[data-persona-mode='custom']").click();
  await page.locator("#customPersonaNameInput").fill("藤灯巡夜人");
  await page.locator("#customPersonaTaglineInput").fill("原创主角，谨慎、温柔，负责引路");
  await page.locator("#aiPolishPersonaButton").click();
  await expect(page.locator("#customPersonaTaglineInput")).toHaveValue(/藤灯巡夜人/);
  const firstPersonaPolish = await page.locator("#customPersonaTaglineInput").inputValue();
  await expect(page.locator("#customPersonaAiHint")).toContainText("第 1 版");
  await page.locator("#aiPolishPersonaButton").click();
  await expect(page.locator("#customPersonaAiHint")).toContainText("第 2 版");
  await expect(page.locator("#customPersonaTaglineInput")).not.toHaveValue(firstPersonaPolish);

  await expect(page.locator("#createSettingsSummary")).toContainText("藤灯巡夜人");
  await expect(page.locator("#createWizardNextButton")).toBeEnabled();
  await page.locator("#createRightsAccepted").check();
  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="preview"]')).toHaveClass(/active/);
  await expect(page.locator("#draftMeta")).toContainText("Demon Slayer / 鬼灭之刃");
  await expect(page.locator("#draftMeta")).toContainText("藤灯巡夜人");
});

test("create workspace uses full screen and keeps flow actions from covering cards", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await resetApp(page);
  await openCreate(page);

  await expect(page.locator(".tabbar")).toBeHidden();
  await expect(page.locator("#createWizardActions")).toHaveCSS("position", "static");
  await expect(page.locator("#promptPolishLauncher")).toBeVisible();
  await expectNoBoxOverlap(page, "#promptPolishLauncher", "#createWizardActions");
  await openPromptPolish(page);
  await expect(page.locator('#promptPolishModal [data-step-ai-result]')).toContainText("先写一句故事创意");
  await page.locator("#promptPolishModal button[data-prompt-polish-close]").click();

  await page.locator("#promptInput").fill("鬼灭雨夜任务");
  await advanceCreateToSettings(page);
  await expect(page.locator("#requestIpButton")).toBeVisible();
  await expectNoBoxOverlap(page, "#requestIpButton", "#createWizardActions");

  await page.locator("#originSelector").getByRole("button", { name: "二创", exact: true }).click();
  await page.locator("#createIpSearchInput").fill("鬼灭");
  await page.locator('[data-ip="mainstream_demon_slayer"]').click();
  await expect(page.locator("#personaSelector")).toContainText("选择原著角色");
  await page.locator("[data-persona-picker-open]").click();
  await page.locator('#personaPickerList [data-persona="demon_slayer_nezuko"]').click();
  await expect(page.locator("#personaSelector")).toContainText("灶门祢豆子");
  await expect(page.locator("#createRightsNotice")).toContainText("不代表官方授权");
  await expectNoBoxOverlap(page, "#personaSelector", "#createWizardActions");

  await page.locator("#createWizardNextButton").click();
  await expect(page.locator('[data-create-step="preview"]')).toHaveClass(/active/);
  await page.locator("[data-create-advanced-toggle]").click();
  await page.locator('[data-create-step-target="settings"]').click();
  await page.locator("[data-persona-picker-open]").click();
  await expect(page.locator("#personaPickerActions")).toBeVisible();
  await page.locator('#personaPickerList [data-persona="demon_slayer_tanjiro"]').click();
  await page.locator('#personaPickerList [data-persona="demon_slayer_zenitsu"]').click();
  await expect(page.locator("#addSelectedPersonasButton")).toHaveText("添加 2 个角色");
  await page.locator("#addSelectedPersonasButton").click();
  await expect(page.locator("#personaPickerModal")).toBeHidden();
  await expect(page.locator("#characterCardGrid")).toContainText("灶门炭治郎");
  await expect(page.locator("#characterCardGrid")).toContainText("我妻善逸");
  await page.locator('[data-create-step-target="publish"]').click();
  await expect(page.locator('[data-create-step="publish"]')).toHaveClass(/active/);
  await expect(page.locator('[data-testid="create-publish"]')).toBeVisible();
  await expect(page.locator('[data-testid="create-publish"]')).toBeDisabled();
  await expect(page.locator("#publishBlockerList")).toContainText("二创权利声明");
  await expect(page.locator("#createWizardNextButton")).toBeHidden();
});

test("IP page separates IP pool entries from zone applications", async ({ page }) => {
  await page.getByRole("button", { name: "创作", exact: true }).click();
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("工位小闪专区");
  await advanceCreateToSettings(page);
  await page.locator("#requestIpButton").click();
  await expect(page.locator("#ipScreen")).toBeVisible();
  await expect(page.locator("#ipScreen")).toContainText("IP 入池不等于自动开专区");

  await page.locator(".ip-pool-card").filter({ hasText: "工位小闪原创企划" }).click();
  await expect(page.locator("#ipDetailPanel")).toContainText("可申请专区");
  await expect(page.locator("#ipDetailPanel")).toContainText("角色分身");
  await expect(page.locator("#ipDetailPanel")).toContainText("工位小闪");
  await expect(page.locator("#ipDetailPanel")).toContainText("已适配设备的内容包");

  await page.getByRole("button", { name: "申请开通专区", exact: true }).click();
  await expect(page.locator("#ipRequestMessage")).toContainText("你已成为专区管理员");
  await expect(page.locator("#ipDetailPanel")).toContainText("专区已开通");
  await expect(page.locator("#ipDetailPanel")).toContainText("管理员：你");
});

test("anime IP collector supplements the IP pool with characters", async ({ page }) => {
  await page.getByRole("button", { name: "创作", exact: true }).click();
  await page.getByPlaceholder(PROMPT_PLACEHOLDER).fill("芙莉莲森林散步");
  await advanceCreateToSettings(page);
  await page.locator("#requestIpButton").click();
  await expect(page.locator("#ipScreen")).toBeVisible();

  await page.locator("#ipSearchInput").fill("芙莉莲");
  await page.getByRole("button", { name: "自动搜集", exact: true }).click();

  await expect(page.locator("#ipRequestMessage")).toContainText("已补充 1 个动漫 IP");
  const importedCard = page.locator(".ip-pool-card").filter({ hasText: "葬送的芙莉莲" });
  await expect(importedCard).toBeVisible();
  await importedCard.click();
  await expect(page.locator("#ipDetailPanel")).toContainText("芙莉莲");
  await expect(page.locator("#ipDetailPanel")).toContainText("费伦");
  await expect(page.locator("#animeCollectorResult")).toContainText("已入池 1 个 IP");

  await page.locator("#operatorButton").click();
  await expect(page.locator("#createScreen")).toBeVisible();
  await page.locator("#originSelector").getByRole("button", { name: "二创", exact: true }).click();
  await expect(page.locator('[data-ip="mainstream_frieren"]')).toBeVisible();
});

test("store listing can be approved and synced to the current device persona", async ({ page }) => {
  const title = "萤火晚安信";

  await createAndPublishOriginal(page, title);
  await applyStoreListing(page, title);
  await advanceStoreListing(page, title);

  await page.getByRole("button", { name: "商店", exact: true }).click();

  await expect(page.locator("#storeTarget")).toContainText("适用于");
  const storeItem = page.locator(".store-item").filter({ hasText: title });
  await expect(storeItem).toBeVisible();
  await expect(storeItem).toContainText("雨天咕咕");

  await expect(storeItem.getByRole("button")).toHaveText("获取");
  await storeItem.getByRole("button").click();
  await expect(storeItem.getByRole("button")).toHaveText("装到设备");
  await storeItem.getByRole("button").click();
  await expect(storeItem.getByRole("button")).toHaveText("装到设备");
  await storeItem.getByRole("button").click();
  await expect(storeItem.getByRole("button")).toHaveText("使用中");

  await page.locator("#profileButton").click();
  await expect(page.locator("#installedPackName")).toHaveText(title);
});

test("first-time user can follow the core loop hints through interaction", async ({ page }) => {
  await page.locator('[data-testid="feed-play"]').click();
  await expect(page.locator("#playerScreen")).toBeVisible();

  await page.getByRole("button", { name: "摸摸头", exact: true }).click();
  await page.getByRole("button", { name: "结束", exact: true }).click();
  await expect(page.locator("#completionSummary")).toContainText("已完成互动");

  await page.locator("#continueFeedButton").click();
  await expect(page.locator("#feedScreen")).toBeVisible();
});

test("feed navigation feels directional and stays bounded", async ({ page }) => {
  const firstTitle = await page.locator('[data-testid="feed-title"]').innerText();

  await page.locator('[data-testid="feed-card"]').hover();
  await page.mouse.wheel(0, 700);
  await expect(page.locator('[data-testid="feed-card"]')).toHaveClass(/is-leaving-next/);
  await expect(page.locator('[data-testid="feed-title"]')).not.toHaveText(firstTitle);
  await expect(page.locator('[data-testid="feed-card"]')).not.toHaveClass(/is-entering|is-leaving/);

  await page.keyboard.press("ArrowUp");
  await expect(page.locator('[data-testid="feed-title"]')).toHaveText(firstTitle);
  await expect(page.locator('[data-testid="feed-card"]')).not.toHaveClass(/is-entering|is-leaving/);

  await page.keyboard.press("ArrowDown");
  await expect(page.locator('[data-testid="feed-card"]')).toHaveClass(/is-leaving-next/);
  await expect(page.locator('[data-testid="feed-title"]')).not.toHaveText(firstTitle);
  await expect(page.locator('[data-testid="feed-card"]')).not.toHaveClass(/is-entering|is-leaving/);

  await page.keyboard.press("ArrowUp");
  await expect(page.locator('[data-testid="feed-title"]')).toHaveText(firstTitle);
  await expect(page.locator('[data-testid="feed-card"]')).not.toHaveClass(/is-entering|is-leaving/);

  await page.keyboard.press("ArrowUp");
  await expect(page.locator('[data-testid="feed-title"]')).not.toHaveText(firstTitle);
});

test("published work offers immediate next steps", async ({ page }) => {
  const title = "星星醒来铃";

  await createAndPublishOriginal(page, title);
  await expect(page.locator("#postPublishPanel")).toContainText(title);
  await page.locator("#viewPublishedWorkButton").click();

  await expect(page.locator("#profileScreen")).toBeVisible();
  await expect(page.locator(".work-card").filter({ hasText: title })).toBeVisible();
});
