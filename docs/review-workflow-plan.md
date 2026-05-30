# Review Workflow Plan

这份文档展开 `01. 内容审核链路不完整`。目标是先把 Gugu Flash 的审核链路拆清楚，再决定哪些状态进入当前原型，哪些留到真实后端。

审核人员排班、SLA 覆盖和升级矩阵另见 `docs/moderation-staffing-plan.md`；机器可检查覆盖在 `docs/moderation-staffing-readiness.json`，通过 `npm run check:moderation-staffing` 验证。

## 结论先行

建议采用三层审核：

```text
H5 发布审核
  -> 商店上架审核
  -> 硬件适配审核
```

三层不要合并。原因是它们审核的风险不同：

- H5 发布审核：社区安全、版权初筛、是否允许公开传播。
- 商店上架审核：商业分发、IP/素材权利承诺、售卖风险。
- 硬件适配审核：设备安全、性能、素材尺寸、品牌质量、官方背书。

推荐 MVP 策略：

```text
草稿和私密预览：不审
公开发布：原创和普通二创都先发后审
明显违法违规内容：发布前拦截
推荐/热门：必须通过发布审核
商店上架：必须提交审核
硬件适配：必须人工审核
```

## 当前问题

当前原型里：

- 用户发布草稿后直接进入内容流。
- 旧实现里二创只要求填写 IP 名称；已确认后续应改为从平台 IP 池选择 IP。
- 上架商店只需要勾选承诺，再由官方台批准。
- 官方台没有审核任务、审核理由、证据材料、驳回、下架、复审记录。
- `status`、`storeStatus`、`hardwareStatus` 已经存在，但还不是严谨状态机。

这足够演示产品闭环，但不适合真实 UGC。

## 审核对象

建议后端至少拆出这些对象：

```text
Work
  H5 作品本体，承载内容、作者、IP、分身、题材、原创/二创声明。

IPZone
  IP 池里的 IP/世界观/原创企划，也是社区专区的归属容器。

Persona
  IP 专区内的角色分身。

ReviewTask
  审核任务，记录审核类型、状态、审核人、理由和结果。

StoreListing
  商店上架申请和商店商品状态。

HardwareCandidate
  硬件候选记录，连接 H5 作品与后续适配流程。

HardwarePack
  官方适配后的设备内容包，不等同于 H5 作品。
```

不要把所有状态都塞在 `Work` 上。`Work` 可以有基础公开状态，但商店和硬件应该有自己的实体。

## 审核类型

### 1. H5 发布审核

目的：

- 判断作品是否可以公开展示。
- 判断是否可以进入推荐和热门。
- 初步拦截明显版权、违规、安全问题。

触发时机：

- 用户点击“发布到内容流”。
- 用户修改已发布作品的核心内容。
- 作品被多人举报。
- 作品从私密改为公开。

建议状态：

```text
draft
  -> publish_submitted
  -> public_limited
  -> public
  -> rejected
  -> taken_down
```

状态解释：

- `draft`: 仅作者可见。
- `publish_submitted`: 已提交发布审核。
- `public_limited`: 可在普通内容流、专区、作者页和分享链接中展示，但不进推荐/热门/商店/硬件链路。
- `public`: 可进公开流和推荐。
- `rejected`: 发布被拒，作者可修改后再提交。
- `taken_down`: 已发布后被下架。

已确认规则：

- 原创和普通二创都允许先发后审。
- 发布后先进入 `public_limited`，可以出现在普通内容流，但不进入推荐/热门/商店/硬件链路。
- 后台审核通过后变成 `public`，可以进入推荐和后续商业/硬件申请。
- 明显违法违规、色情低俗、仇恨骚扰、未成年人高风险、冒充真人等 `blocked` 内容仍应在发布前拦截。
- 已发布内容如果后续审核、举报或权利投诉成立，进入 `taken_down`。

### 2. 商店上架审核

目的：

- 判断作品是否允许商业分发。
- 收集并记录用户权利承诺。
- 判断是否需要更高等级 IP/素材证明。

触发时机：

- 用户在“我的作品”点击“申请上架”。
- 已上架作品修改核心内容。
- 收到版权投诉。

建议状态：

```text
not_applied
  -> listing_submitted
  -> rights_review
  -> listed
  -> rejected
  -> delisted
```

状态解释：

- `not_applied`: 已发布，但没有申请商店。
- `listing_submitted`: 已提交上架材料。
- `rights_review`: 权利/内容审核中。
- `listed`: 已上架商店。
- `rejected`: 上架被拒，可修改材料后再申请。
- `delisted`: 上架后被下架。

当前原型已经有 `not_applied`、`rights_review`、`listed`、`rejected`、`delisted`，可以继续沿用。

商店上架申请需要材料：

```text
作品类型：原创 / 二创
IP 池选择的 IP
素材来源说明
是否使用外部图片/音频/字体
是否使用真人姓名/肖像/声音
是否授权平台展示、售卖、下架、冻结收益
用户权利承诺勾选时间
```

已确认规则：

- 原创作品可以提交商店审核。
- 二创作品必须从 IP 池选择 IP，可以提交商店审核。
- 所有进入 IP 池且未被限制/封禁的 IP，都可以申请商店上架。
- 商店上架必须通过权利/内容审核。

### 3. 硬件适配审核

目的：

- 判断作品是否值得官方适配成设备内容。
- 判断内容能否在电子吧唧上稳定运行。
- 判断是否符合品牌质量和硬件安全。

触发时机：

- 官方从热门作品中标记硬件候选。
- 用户已上架作品达到数据阈值。
- 官方运营活动选择作品。

建议状态：

```text
not_candidate
  -> hardware_candidate
  -> adaptation_review
  -> adapting
  -> hardware_ready
  -> device_available
  -> hardware_rejected
```

状态解释：

- `not_candidate`: 普通 H5 作品。
- `hardware_candidate`: 被选入候选池。
- `adaptation_review`: 审核硬件可行性和权利风险。
- `adapting`: 官方正在适配。
- `hardware_ready`: 已生成硬件内容包。
- `device_available`: 已可下载到设备。
- `hardware_rejected`: 不适合硬件化。

硬件审核检查：

```text
权利状态：原创/授权是否清楚
内容安全：是否适合设备展示
设备兼容：屏幕尺寸、资源预算、动画/交互复杂度
素材质量：低分辨率、外部素材、字体授权
品牌质量：是否适合作为官方精选
```

已确认规则：

- 硬件候选必须人工审核。
- 所有进入 IP 池且未被限制/封禁的 IP，都可以进入硬件候选。
- `HardwarePack` 必须是官方生成的新实体，不能直接把用户 H5 当硬件包。

## 风险分级

发布/上架/硬件审核可以共用一套风险标签。

```text
low
  原创文本 + 平台分身 + 平台模板 + 无外部素材

medium
  用户上传素材、用户自建分身、轻度二创、引用站内 IP 池作品

high
  热门商业 IP、真人明星、公众人物、外部图片/音频、疑似侵权素材

blocked
  明显违法违规、色情低俗、仇恨骚扰、未成年人风险、冒充真人、权利投诉成立
```

风险标签不等于最终结果，但决定进入哪个审核队列。

## 推荐状态机

### Work.status

只表示 H5 社区状态：

```text
draft
publish_submitted
public_limited
public
rejected
taken_down
```

### StoreListing.status

只表示商店状态：

```text
not_applied
listing_submitted
rights_review
listed
rejected
delisted
```

### HardwareCandidate.status

只表示硬件候选和适配状态：

```text
not_candidate
hardware_candidate
adaptation_review
adapting
hardware_ready
device_available
hardware_rejected
```

## 用户可见规则

发布时：

- 草稿生成后，用户可以预览。
- 点击发布后，如果低风险，显示“已发布，审核通过前不会进入推荐”。
- 如果高风险，显示“已提交审核，审核通过后公开”。

上架时：

- 只有 `public` 的作品能申请。
- `public_limited` 作品需要等发布审核通过后再进入商店申请。
- 用户必须勾选权利承诺。
- 二创作品需要从 IP 池选择 IP，后续可扩展素材来源说明。
- 提交后显示“上架审核中”。

下架时：

- 作者看到下架原因。
- 已购买用户是否还能使用，要单独决策。
- 如果是版权投诉，应冻结收益并保留证据。

## 运营台需要的能力

MVP 运营台：

```text
审核队列列表
按审核类型过滤：发布 / 商店 / 硬件
按风险等级过滤：low / medium / high / blocked
作品预览
原创/二创/IP 池信息
IP 专区、角色分身和题材信息
互动数据
审核动作：通过 / 驳回 / 下架 / 标记硬件候选
审核理由
审核记录
```

暂时可以不做：

- 多角色权限。
- 复杂工单流转。
- 自动化模型审核后台。
- 权利人门户。

## 数据字段建议

### ReviewTask

```json
{
  "id": "review_123",
  "targetType": "work",
  "targetId": "h5_abc",
  "reviewType": "publish",
  "status": "pending",
  "riskLevel": "medium",
  "riskReasons": ["fanwork", "external_asset"],
  "submittedBy": "user_local",
  "assignedTo": null,
  "decision": null,
  "decisionReason": null,
  "createdAt": 1760000000000,
  "decidedAt": null
}
```

### StoreListing

```json
{
  "id": "listing_123",
  "workId": "h5_abc",
  "status": "rights_review",
  "contentOrigin": "fanwork",
  "ipId": "ip_workday_gugu",
  "ipName": "站内摸鱼宇宙",
  "rightsAcknowledgedAt": 1760000000000,
  "materialSourceNote": "用户自写文本，未上传图片音频",
  "price": 6,
  "listedAt": null,
  "delistedAt": null
}
```

### HardwareCandidate

```json
{
  "id": "hardware_candidate_123",
  "workId": "h5_abc",
  "status": "adaptation_review",
  "reviewNotes": "分支少，适合小屏；二创 IP 池状态需要复核",
  "targetDeviceModels": ["Circle 185"],
  "hardwarePackId": null
}
```

## API 草案

```text
POST /works/:id/publish
GET  /reviews?type=publish&status=pending
POST /reviews/:id/approve
POST /reviews/:id/reject
POST /works/:id/take-down

POST /works/:id/store-listing
GET  /reviews?type=store&status=pending
POST /store-listings/:id/approve
POST /store-listings/:id/reject
POST /store-listings/:id/delist

POST /works/:id/hardware-candidate
GET  /reviews?type=hardware&status=pending
POST /hardware-candidates/:id/approve
POST /hardware-candidates/:id/reject
```

## 原型改造建议

第一步：

- 把当前 `publishDraft()` 改成默认进入 `public_limited`。
- 对明显 `blocked` 内容做发布前拦截。
- 官方台增加“发布审核”队列。
- Feed 默认只展示 `public` 和 `public_limited`。
- 推荐/热门只展示 `public`。

第二步：

- 把商店申请从 Work 字段拆成模拟 `StoreListing`。
- 上架审核队列显示申请材料。
- 支持驳回和驳回理由。

第三步：

- 把硬件候选拆成模拟 `HardwareCandidate`。
- IP 池内未受限 IP 都可以进入硬件候选，但必须通过人工审核。
- 标记硬件可下载时生成模拟 `HardwarePack`。

## 本轮已确认与待细化问题

### A. H5 发布审核策略

已确认：

- 原创和普通二创都先发后审，状态为 `public_limited`。
- 明显 `blocked` 内容发布前拦截。
- `public_limited` 可以被分享链接访问，也可以出现在普通内容流和专区流。
- `public_limited` 不进入推荐/热门/商店/硬件链路。

### B. 二创内容能不能进公开推荐？

已确认：

- 可以发布。
- 审核通过后可以进入普通推荐、专区、关注流和全站热门。
- 推荐资格不按 IP 来源类型一刀切，由内容审核、互动数据、举报和运营配置决定。

### C. 商店上架是否允许二创？

已确认：

- 所有进入 IP 池且未被限制/封禁的 IP，都可以申请商店上架。
- 二创可以提交申请。
- 商店上架必须通过权利/内容审核。

后续还需要细化：

- 二创上架是否需要上传授权材料。

### D. 硬件适配是否必须人工审核？

已确认：

- 必须人工审核。
- 自动分数只能用于排序，不能直接进入硬件。
- 所有进入 IP 池且未被限制/封禁的 IP，都可以进入硬件候选。

后续还需要细化：

- 是否允许官方运营绕过商店上架，直接选择作品进入硬件适配。

## 建议本轮确认的最小规则

为了继续开发，我建议先确认这 5 条：

```text
1. H5 发布中，原创和普通二创都先发后审。
2. 所有二创必须从 IP 池选择 IP，并依靠审核巡检、举报投诉和下架机制治理。
3. 商店上架必须单独申请并签署权利承诺。
4. IP 池内未受限 IP 都可以进入推荐、商店和硬件链路。
5. 硬件适配必须人工审核，最终生成独立 HardwarePack。
```

当前已确认这 5 条。后续可以继续拆状态机和后端实体。
