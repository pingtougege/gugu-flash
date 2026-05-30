# Creator Editor Plan

这份文档展开 `07. 创作器能力太浅`。

当前问题不是“AI 生成不够聪明”，而是：**用户拿到草稿后，没有真正编辑作品结构的能力**。

## 1. 目标

创作器要从一句话生成器升级成结构化作品编辑器。

它要支持四件事：

1. 让普通用户能快速生成一个可玩的 H5。
2. 让认真创作者能编辑场景、台词、分支、角色、封面和发布信息。
3. 让作品天然带上 IP、分身、原创/二创、素材来源等治理字段。
4. 让后续商店上架和硬件适配有稳定结构，不依赖自由代码。

## 2. 核心原则

```text
MVP 不做自由代码编辑器。
MVP 先做结构化场景编辑器。
开放图片/音频上传，但必须走素材来源、内容安全和版权风险记录。
AI 是辅助编辑，不是替用户绕过审核。
发布 H5 和上架商店仍然分开。
硬件内容包仍由后台/官方工具制作。
```

原因：

- 自由代码会让安全审核、版权审核和硬件适配失控。
- 上传素材可以增强表达，但必须进入平台素材治理链路，不能裸传裸发布。
- 结构化编辑足够支撑大多数互动短剧、角色陪伴、分支故事和电子吧唧内容。

## 3. 创作流程

建议主流程：

```text
进入创作
  -> 选择原创 / 二创
  -> 选择 IP
  -> 选择角色分身
  -> 选择题材 / 模板
  -> 输入一句话
  -> AI 生成结构化草稿
  -> 进入作品编辑器
  -> 预览
  -> 发布 H5
  -> 后续单独申请商店 / 硬件
```

Remix 流程：

```text
点击 Remix
  -> 复制源作品结构
  -> 继承 remixOf / sourceWorkId
  -> 选择或确认 IP
  -> 进入作品编辑器
  -> 发布为新作品
```

## 4. 编辑器能力

### 基础信息

可编辑：

- 标题。
- 简介。
- 封面。
- 题材标签。
- 原创 / 二创声明。
- IP。
- 角色分身。
- 可见范围。
- 素材来源说明。

规则：

- 二创作品必须选择 IP 池里的 IP。
- 发布后不建议普通用户随意修改 IP；改错时走申诉或重新发布。
- Remix 必须保留源作品记录。

### 场景列表

可编辑：

- 新增场景。
- 删除场景。
- 复制场景。
- 调整场景顺序。
- 设置入口场景。
- 设置结局场景。

MVP 建议限制：

```text
场景数：3 - 30
单场景文字：20 - 120 字
单场景选项：0 - 3 个
标题：2 - 24 字
标签：最多 6 个
```

场景数不建议一开始卡太死。建议用复杂度分层：

```text
1 - 12 个场景
  普通短作品，适合推荐、预览和硬件候选。

13 - 30 个场景
  长作品，可以发布 H5，但编辑器提示复杂度较高。

30 个以上
  暂不建议 MVP 开放，后续可做高级创作者能力。
```

场景太多会带来这些问题：

- 用户编辑和回看成本变高。
- 分支跳转更容易断裂。
- 审核和投诉复核成本变高。
- 手机 H5 首次加载和预览会变重。
- 硬件适配时可能需要删减、拆包或重新制作。

所以 H5 发布可以放宽，商店和硬件审核要单独看复杂度。

### 场景内容

每个场景可编辑：

- 场景标题，内部管理用。
- 说话人。
- 角色表情 / 姿态。
- 背景。
- 台词。
- 音效，MVP 用素材库。
- 选项按钮。
- 选项跳转目标。

### 分支

每个选项包含：

```text
label
gotoSceneId
trackingKey
```

编辑器必须校验：

- 没有空跳转。
- 没有不存在的场景 ID。
- 至少有一个可到达结局。
- 入口场景存在。
- 关键路径可完整播放。

循环可以允许，例如“重新播放”，但不能让用户卡在不可退出的死循环里。

### 封面和资产

MVP 先提供：

- 平台封面模板。
- 角色头像 / 姿态。
- 背景色和背景模板。
- 轻量音效库。
- AI 生成封面提示词。
- 用户上传图片。
- 用户上传音频。

上传限制：

```text
图片：封面、背景、角色贴图。
音频：短音效、短 BGM。
外链素材：不开放。
自定义 JS / CSS：不开放。
```

上传必须加：

- 素材来源声明。
- 内容安全审核。
- 版权投诉链路。
- 素材复用权限。
- 硬件兼容检查。

建议素材状态：

```text
local_preview
  本地预览中，还不能公开发布。

pending_scan
  已上传，等待安全扫描和基础审核。

usable_h5
  可以用于 H5 发布。

blocked
  不可使用。

hardware_needs_review
  H5 可用，但硬件适配前需要人工复核。
```

## 5. AI 辅助

AI 不应该只出第一稿，而应该嵌入编辑器。

MVP AI 能力：

```text
生成大纲
续写下一场景
改写当前台词
补 2-3 个选项
生成另一个结局
压缩成适合小屏的文案
生成标题
生成标签
生成封面提示词
检查分支是否断裂
```

交互原则：

- AI 结果先作为建议，不直接覆盖用户内容。
- 用户点击接受后才写入草稿。
- 记录 AI 辅助痕迹，供审核和风控使用。

## 6. AI 生成标记

AI 标记的意思是：记录作品里哪些部分由 AI 参与生成或改写。

它不是默认展示给所有用户看的水印，也不是说这个作品“不是用户创作”。它更像后台留痕，用来处理审核、投诉、商店上架、硬件适配和模型问题追踪。

建议保留两层：

### 内部审核标记

```text
aiAssisted: true
aiGeneratedFields: ["outline", "scene_text", "title"]
aiProvider
promptHash
generatedAt
```

内部必须记录，方便审核、投诉和模型问题追踪。

“内部记录”指的是：这些字段保存在数据库或审核后台里，普通用户在作品页默认看不到。运营、审核、投诉处理、商店/硬件审核可以看到。

### 前台展示标记

MVP 不一定每个作品都强展示“AI 生成”。建议前台只在这些情况展示：

- 平台政策要求。
- 作品几乎全量由 AI 生成。
- 商店 / 硬件上架时需要披露。
- 用户主动选择展示。

这样不会打击普通创作体验，但治理链路有记录。

## 7. 草稿、版本和发布

实体关系：

```text
WorkDraft
  -> DraftVersion
  -> PublishedWork
    -> WorkVersion
      -> StoreListing
      -> HardwarePack
```

规则：

- 草稿自动保存。
- 发布时生成不可变的 `WorkVersion`。
- 已发布作品再编辑时，先生成一个编辑草稿。
- 用户可以选择“暂存修改”，只保存编辑草稿，不影响线上版本。
- 用户可以选择“发布更新”，审核通过后生成新的 `WorkVersion` 并替换当前线上 H5 版本。
- 已上架商店或已生成硬件包的版本不能被直接覆盖；商店和硬件仍指向原版本，更新要重新审核或重新适配。
- 硬件包永远指向一个固定的 `WorkVersion` 或适配源。

这样可以避免：用户修改已上架作品后，设备里的内容、商店展示和审核记录对不上。

## 8. 数据模型草案

### WorkDraft

```json
{
  "id": "draft_123",
  "authorId": "user_123",
  "sourceWorkId": null,
  "remixOf": null,
  "contentOrigin": "fanwork",
  "ipId": "ip_workday_gugu",
  "personaIds": ["persona_work_flash"],
  "genreTags": ["摸鱼上班", "情绪陪伴"],
  "title": "下班雷达响了",
  "summary": "一个关于会议结束前五分钟的互动小剧场。",
  "coverAssetId": "cover_123",
  "entrySceneId": "scene_start",
  "scenes": [],
  "assetRefs": [],
  "aiAssisted": true,
  "status": "draft",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### Asset

```json
{
  "id": "asset_123",
  "uploaderId": "user_123",
  "type": "image",
  "usage": "cover",
  "sourceStatement": "本人绘制 / 已获得授权 / 平台 AI 生成",
  "licenseType": "user_declared",
  "reviewStatus": "usable_h5",
  "hardwareStatus": "hardware_needs_review",
  "createdAt": 1760000000000
}
```

### Scene

```json
{
  "id": "scene_start",
  "title": "开场",
  "speakerPersonaId": "persona_work_flash",
  "backgroundAssetId": "bg_office_night",
  "characterAssetId": "pose_alert",
  "text": "会议还剩五分钟，工位小闪突然亮了一下。",
  "soundAssetId": "sfx_ping",
  "actions": [
    {
      "id": "action_1",
      "label": "假装记笔记",
      "gotoSceneId": "scene_note"
    }
  ]
}
```

### DraftVersion

```json
{
  "id": "draft_version_123",
  "draftId": "draft_123",
  "snapshot": {},
  "changeSummary": "AI 补了两个分支，用户修改了结局。",
  "createdBy": "user_123",
  "createdAt": 1760000000000
}
```

## 9. API 草案

```text
POST /drafts
GET  /drafts/:id
PATCH /drafts/:id
POST /drafts/:id/scenes
PATCH /drafts/:id/scenes/:sceneId
DELETE /drafts/:id/scenes/:sceneId
POST /drafts/:id/duplicate-scene
POST /drafts/:id/validate
POST /drafts/:id/preview
POST /drafts/:id/publish
POST /drafts/:id/save-edit
POST /drafts/:id/publish-update

POST /assets
GET  /assets/:id
PATCH /assets/:id/source-statement

POST /drafts/:id/ai/outline
POST /drafts/:id/ai/rewrite-scene
POST /drafts/:id/ai/add-branches
POST /drafts/:id/ai/generate-ending
POST /drafts/:id/ai/title-tags
POST /drafts/:id/ai/cover-prompt
```

## 10. 发布前校验

发布前必须检查：

```text
标题存在
入口场景存在
至少 3 个场景
不超过 H5 场景上限
每个场景文本不为空
所有跳转有效
至少一个结局可达
二创作品已选择 IP
角色分身属于所选 IP
上传素材已完成基础扫描
上传素材来源字段完整
没有明显违规词和高风险素材
```

可以发布 H5，但不代表可以进商店或硬件。

商店 / 硬件额外检查：

```text
权利承诺
素材来源说明
IP 状态
投诉状态
设备兼容
屏幕可读性
分支复杂度
音频/动效限制
```

## 11. 编辑器页面结构

建议页面：

```text
左侧 / 上方
  场景列表

中间
  当前场景编辑区

右侧 / 下方
  手机 H5 预览
  硬件小屏预览，后续

顶部
  草稿状态
  保存状态
  预览
  发布
```

移动端可以拆成四个 Tab：

```text
结构
场景
角色/封面
发布
```

## 12. MVP 范围

### Phase 1: 可编辑草稿

- 标题、简介、标签、IP、角色分身。
- 场景列表。
- 场景台词。
- 选项和跳转。
- 图片/音频上传。
- 素材来源声明。
- 预览。
- 发布前校验。

### Phase 2: AI 辅助编辑

- 续写。
- 改写。
- 补分支。
- 生成结局。
- 标题和标签建议。

### Phase 3: 封面和素材库

- 平台背景模板。
- 角色姿态。
- 音效库。
- 用户上传素材管理。
- AI 封面提示词。

### Phase 4: 版本和硬件兼容

- 草稿版本。
- 发布版本。
- 硬件小屏预览。
- 硬件适配评分。

## 13. 建议当前先定的规则

```text
1. MVP 做结构化场景编辑器，不做自由代码编辑器。
2. MVP 开放图片/音频上传，但必须有素材来源、内容安全和版权风险记录。
3. 创作发布仍然是 H5 发布，不等于商店上架。
4. 商店和硬件继续走单独申请、审核和后台适配。
5. 草稿可编辑，发布后生成版本快照。
6. 已发布作品再编辑，可以暂存修改，也可以发布更新。
7. 发布更新生成新的 WorkVersion，不直接覆盖历史版本。
8. 已上架或已硬件化版本不可被用户直接覆盖。
9. AI 生成内容必须保留后台标记，商店/硬件或政策需要时再前台披露。
10. 二创草稿必须绑定 IP。
11. 角色分身必须属于所选 IP。
12. 编辑器必须校验场景跳转和结局可达。
13. H5 场景上限先按 30 处理，硬件候选单独看复杂度。
```

## 14. 已确认规则

已确认：

```text
1. 开放图片/音频上传。
2. 发布后修改可以选择暂存修改或发布更新。
3. H5 场景上限 MVP 先按 30 处理；硬件候选单独看复杂度。
4. AI 标记按后台记录为主，商店/硬件或政策需要时再前台披露。
```
