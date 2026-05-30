# IP Pool And Persona Solution

这份文档是 IP 池、IP 专区、角色分身和二创治理的完整解决方案。它承接已经确认的方向：

```text
IP 池 = 可被选择、创作和治理的 IP / 世界观 / 原创企划集合
专区 = 满足条件后，由用户申请开通的 IP 社区空间
分身 = IP 内的角色，专区开通后在专区内组织和展示
题材 = 内容标签/模板频道
二创 = 必须从平台 IP 池选择 IP
IP 池内未受限 IP = 可进入推荐、商店、硬件链路
```

## 1. 产品目标

IP 池要解决四件事：

1. 让二创不再自由手填 IP，降低版权和治理失控风险。
2. 让社区按 IP/世界观沉淀，而不是只按题材标签消费内容。
3. 让角色分身有清晰归属，避免变成全局散乱模板。
4. 让推荐、商店、硬件适配拥有统一的 IP 风险依据。

## 2. 核心结构

```text
IPPool
  -> IPEntry
    -> Persona
    -> Work
    -> ZoneApplication
      -> IPZone
```

解释：

- `IPPool`: 平台维护的 IP 集合。
- `IPEntry`: 单个 IP / 世界观 / 原创企划。
- `IPZone`: 满足门槛并申请通过后开通的 IP 社区专区。
- `Persona`: 某个 IP 内的角色分身。
- `Work`: 用户创作的 H5 作品。
- `ZoneApplication`: 用户发起的专区开通申请。
- `GenreTag`: 题材标签，例如情绪陪伴、摸鱼上班、同频搭子、像素冒险。

## 3. IP 类型

### platform_original

平台原创 IP。

例子：

```text
雨天咕咕宇宙
站内摸鱼宇宙
汽水星球原创企划
```

规则：

- 官方管理。
- 默认可推荐、可上架、可硬件化。
- 官方角色分身优先从这里产生。

### user_original

用户原创 IP。

例子：

```text
阿眠的月亮便利店
小夏的赛博猫窝
```

规则：

- 用户可以申请创建。
- 审核通过后进入 IP 池。
- 可推荐、可上架、可硬件化，但商店和硬件需要对应审核。
- 后续可以设计 IP 创建者收益或署名机制。

### authorized_ip

平台获得授权的外部 IP。

规则：

- 官方配置。
- 按授权范围决定是否允许二创、商店、硬件、活动。
- 授权到期后可以进入 `restricted`。

### fan_ip

社区允许创作的非授权或用户声明外部 IP。

规则：

- 用户可以申请添加。
- 审核通过后进入 IP 池。
- 可发布、可推荐、可申请商店、可进入硬件候选。
- 每一步都必须经过对应审核和下架机制。

## 4. IP 治理状态

IP 类型决定来源，治理状态决定能做什么。

```text
pending
  用户提交 IP 申请，等待审核。

active
  已进入 IP 池，可创作、推荐、上架、硬件候选。

restricted
  限制新增、推荐、上架或硬件。存量内容可保留或降权。

blocked
  禁止新增和传播，存量内容下架或不可见。
```

补充字段：

```text
allowCreate
allowRecommend
allowStoreListing
allowHardwareCandidate
```

默认规则：

```text
active:
  allowCreate = true
  allowRecommend = true
  allowStoreListing = true
  allowHardwareCandidate = true

restricted:
  allowCreate = false
  allowRecommend = false
  allowStoreListing = false
  allowHardwareCandidate = false

blocked:
  全部 false
```

这样可以做到“不按 IP 类型一刀切”，而是按治理状态控制。

## 5. IP 申请流程

用户找不到 IP 时，可以申请添加 IP。

流程：

```text
用户提交 IP 申请
  -> IP 审核队列
  -> 通过：进入 IP 池
  -> 驳回：给出原因
  -> 限制：仅保留记录，不允许创作
```

申请字段：

```text
IP 名称
IP 别名
IP 类型：用户原创 / 外部 IP / 不确定
简介
来源说明
是否有授权
授权材料，可选
是否允许他人二创
申请理由
默认题材标签
建议角色分身
```

审核动作：

```text
approve
reject
mark_restricted
merge_to_existing_ip
request_more_info
```

## 6. IP 去重与别名

必须支持别名，否则 IP 池会很快变脏。

例子：

```text
站内摸鱼宇宙
摸鱼宇宙
工位小闪世界观
```

都可以指向：

```text
ip_workday_gugu
```

规则：

- IP 名称唯一。
- IP 可以有多个 alias。
- 用户申请 IP 时，先搜索名称和 alias。
- 运营可以合并重复 IP。
- 合并后，作品和角色迁移到主 IP。

## 7. IP 专区

有 IP 不等于有专区。IP 审核通过后只进入 IP 池，用于创作选择、角色归属、推荐、商店、硬件审核和风险治理；专区是后续满足社区条件后，由用户申请开通的 IP 社区空间。

开通专区需要满足：

```text
IP 状态为 active
作品数量达到门槛
活跃创作者数量达到门槛
热度达到门槛
近期违规率低于门槛
申请者邀请若干用户共同成立专区
```

专区开通流程：

```text
IP 入池
  -> 作品和热度积累
  -> 达到开区资格
  -> 用户申请开通专区
  -> 邀请若干用户作为创始成员
  -> 平台审核
  -> 通过后创建 IPZone
  -> 申请者自动成为 zone_admin
```

专区页面包含：

```text
IP 名称
IP 简介
治理状态
角色分身列表
热门作品
最新作品
创作 / Remix 入口
商店内容
硬件内容
题材标签
规则/公告
```

专区不是题材页。

题材页是：

```text
情绪陪伴
摸鱼上班
同频搭子
像素冒险
```

IP 专区是：

```text
雨天咕咕宇宙
站内摸鱼宇宙
某用户原创 IP
某外部 fan_ip
```

## 8. 角色分身规则

分身必须归属某个 IP：

```text
Persona.ipId = IPEntry.id
```

分身类型：

```text
official_role
  平台创建或 IP 官方角色。

user_role
  用户在原创 IP 中创建的角色。

fan_role
  用户在 fan_ip 中创建的角色分身。

oc_role
  用户原创角色，可归属到用户原创 IP 或允许 OC 的 IP。
```

分身字段：

```text
name
avatar
tagline
description
tone
roleType
ipId
creatorId
visibility
reviewStatus
rightsStatus
```

创建规则：

- 选择 IP 后，只展示该 IP 下的分身。
- 用户可以申请创建该 IP 下的新分身。
- 新分身默认先进入审核或 `public_limited`。
- 明显冒充真人、明星、真实个人身份的分身应拦截或进入高风险审核。

已确认规则：

```text
1. 用户可以创建原创 IP，轻审核后进入 IP 池。
2. 用户可以在 IP 下创建角色分身。
3. 真人明星/公众人物分身禁止。
4. 动漫/游戏等角色分身必须归属对应 IP。
5. 官方分身可以商业化。
6. 分身是 IP 内角色资产，不是账号孤立资产。
7. 用户原创 IP 可设置角色开放权限：open / approval / private。
```

分身资产归属：

```text
分身归属 IP。
创建者拥有署名和管理权。
平台拥有治理权。
作品保留使用记录。
```

用户原创 IP 的角色开放权限：

```text
open
  任何人可使用该 IP 下的角色分身创作。

approval
  他人使用前需要 IP 创建者或管理员批准。

private
  仅创建者/团队可用。
```

## 9. 创作流程

### 原创

```text
选择原创
  -> 选择平台原创 IP / 用户原创 IP
  -> 如果没有合适 IP，创建原创 IP
  -> 选择该 IP 下的分身
  -> 选择题材/模板
  -> 创作 H5
  -> 发布
```

### 二创

```text
选择二创
  -> 从 IP 池选择 IP
  -> 如果没有，申请添加 IP
  -> 选择该 IP 下的分身
  -> 选择题材/模板
  -> 创作 H5
  -> 发布
```

发布规则：

- 原创和普通二创都先发后审。
- 作品先进入 `public_limited`。
- 审核通过后进入 `public`。
- `public` 后才可进入推荐、商店申请和硬件候选。

## 10. 推荐、商店、硬件规则

核心原则：

```text
不按 IP 类型一刀切。
只要 IP 在池内且未受限，就可以进入推荐、商店、硬件。
每条链路用对应审核控制风险。
```

### 推荐

可进入推荐的条件：

```text
IP.governanceStatus = active
Work.status = public
作品未被高频举报
作品通过内容审核
```

排序依据：

```text
播放
完播
点赞
收藏
评论
Remix
举报
IP 热度
角色分身热度
题材匹配
```

### 商店

可申请商店的条件：

```text
IP.governanceStatus = active
Work.status = public
用户签署权利承诺
提交上架材料
```

上架审核看：

```text
IP 类型
IP 治理状态
是否外部 IP
是否有授权材料
是否上传外部素材
是否涉及真人/公众人物
内容安全
历史投诉
```

通过后生成：

```text
StoreListing
```

### 硬件

可进入硬件候选的条件：

```text
IP.governanceStatus = active
Work.status = public
作品通过内容审核
官方人工选择或达到候选阈值
```

硬件审核看：

```text
权利风险
设备兼容
素材大小
交互复杂度
内容安全
品牌质量
```

通过后生成：

```text
HardwarePack
```

`HardwarePack` 是官方适配结果，不是用户 H5 本体。

## 11. 风控策略

### IP 级风控

当某个 IP 发生风险：

```text
限制新增作品
限制推荐
暂停商店申请
暂停硬件候选
下架相关作品
冻结收益
合并重复 IP
封禁 IP
```

### 作品级风控

```text
public_limited
public
taken_down
rejected
```

### 分身级风控

```text
pending
public
restricted
blocked
```

分身被限制后：

- 已发布作品可继续存在或降权。
- 新作品不能再选择该分身。
- 高风险分身可以批量触发作品复审。

## 12. 数据模型

### IPEntry

```json
{
  "id": "ip_workday_gugu",
  "name": "站内摸鱼宇宙",
  "aliases": ["摸鱼宇宙", "工位小闪世界观"],
  "originType": "platform_original",
  "governanceStatus": "active",
  "description": "围绕上班、摸鱼、下班倒计时的电子吧唧世界观。",
  "cover": {
    "background": "linear-gradient(160deg, #0f172a, #118ab2)",
    "character": "💡"
  },
  "defaultGenreTags": ["摸鱼上班", "情绪陪伴"],
  "hasZone": true,
  "zoneId": "zone_workday_gugu",
  "allowCreate": true,
  "allowRecommend": true,
  "allowStoreListing": true,
  "allowHardwareCandidate": true,
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### ZoneApplication

```json
{
  "id": "zone_app_123",
  "ipId": "ip_workday_gugu",
  "applicantId": "user_123",
  "status": "pending",
  "metricsSnapshot": {
    "works": 128,
    "creators": 18,
    "heatScore": 48200,
    "violationRate": 0.01
  },
  "invites": [
    {
      "userId": "user_456",
      "status": "accepted"
    }
  ],
  "createdAt": 1760000000000
}
```

### IPZone

```json
{
  "id": "zone_workday_gugu",
  "ipId": "ip_workday_gugu",
  "name": "站内摸鱼宇宙专区",
  "status": "active",
  "adminId": "user_123",
  "moderatorIds": ["user_456"],
  "foundingMemberIds": ["user_123", "user_456"],
  "rolePermission": "open",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### Persona

```json
{
  "id": "persona_office_sprite",
  "ipId": "ip_workday_gugu",
  "name": "工位小闪",
  "avatar": "💡",
  "roleType": "official_role",
  "tagline": "上班时低调发光，下班时大胆逃跑。",
  "description": "工位边上的小型电子陪伴角色。",
  "tone": "短句、吐槽、鼓励",
  "creatorId": "platform",
  "reviewStatus": "public",
  "rightsStatus": "official"
}
```

### Work

```json
{
  "id": "h5_abc",
  "title": "下班回血提醒",
  "contentOrigin": "fanwork",
  "ipId": "ip_workday_gugu",
  "personaId": "persona_office_sprite",
  "genreTags": ["摸鱼上班"],
  "status": "public_limited",
  "storeListingId": null,
  "hardwareCandidateId": null
}
```

### IPApplication

```json
{
  "id": "ip_app_123",
  "name": "某某世界观",
  "aliases": ["某某宇宙"],
  "originType": "fan_ip",
  "sourceNote": "用户希望围绕该 IP 做同人二创。",
  "hasAuthorization": false,
  "authorizationFiles": [],
  "requestedBy": "user_local",
  "status": "pending",
  "reviewReason": null,
  "createdAt": 1760000000000
}
```

## 13. API 草案

```text
GET  /ip-zones
GET  /ip-zones/:id
POST /ip-zones/applications
GET  /ip-zones/applications?status=pending
POST /ip-zones/applications/:id/approve
POST /ip-zones/applications/:id/reject
POST /ip-zones/:id/restrict
POST /ip-zones/:id/block
POST /ip-zones/:id/merge

GET  /ip-zones/:id/personas
POST /ip-zones/:id/personas
POST /personas/:id/review
POST /personas/:id/restrict

GET  /ip-zones/:id/works
GET  /genres/:id/works
```

## 14. 原型落地阶段

### Phase 1: 数据模型替换

- 把 `GUGU_ZONES` 改成 `IP_ZONES`。
- 把情绪陪伴/摸鱼/冒险从专区改为 `GENRE_TAGS`。
- 给 `ROLE_PERSONAS` 增加 `ipId`。
- `Work` 增加 `ipId`、`personaId`、`genreTags`。
- 二创时从 IP 池选择，不再输入自由文本。

### Phase 2: 创建页改造

- 原创/二创。
- IP 选择器。
- 找不到 IP -> 申请添加 IP。
- 分身选择器按 IP 过滤。
- 题材/模板选择器。

### Phase 3: IP 专区申请

- 新增 IP 开区资格统计。
- 后台配置作品数、创作者数、热度和风险阈值。
- 用户达标后申请开通专区。
- 申请者邀请若干用户共同成立专区。
- 申请通过后，申请者自动成为 `zone_admin`。

### Phase 3.5: IP 专区页

- 新增已开通 IP 专区页面。
- 展示 IP 简介、角色、作品、商店、硬件、规则。
- Feed 在已有专区时支持从作品跳到 IP 专区。

### Phase 4: 审核台

- IP 申请审核。
- 分身审核。
- IP 限制/封禁。
- IP 合并。

### Phase 5: 商店和硬件联动

- 商店申请读取 IP 状态。
- 硬件候选读取 IP 状态。
- `restricted / blocked` IP 阻断后续链路。

## 15. 需要继续拍板

1. 跨 IP 角色同台是否允许？
2. IP 创建者是否拥有收益分成？
3. 专区开通的作品数、创作者数和热度阈值分别是多少？
4. 是否允许用户申请合并重复 IP？

## 16. 最小可执行规则

建议当前先按这套做：

```text
1. 所有作品必须选择一个 IP。
2. 二创必须从 IP 池选择 IP。
3. 找不到 IP，可以申请添加。
4. IP 审核通过只进入 IP 池，不自动生成专区。
5. 专区需要满足作品、创作者、热度和风险门槛后由用户申请开通。
6. 申请者邀请若干用户共同成立专区，申请通过后自动成为 `zone_admin`。
7. 分身必须属于某个 IP。
8. 创作时只能选择该 IP 下的分身。
9. 题材只是标签，不是专区。
10. IP 池内 active IP 都可以走推荐、商店和硬件审核。
11. restricted/blocked IP 阻断推荐、商店和硬件。
12. 硬件适配必须生成独立 HardwarePack。
13. 用户可以创建原创 IP，轻审核后入池。
14. 用户可以在 IP 下创建角色分身。
15. 真人明星/公众人物分身禁止。
16. 动漫/游戏等角色分身必须归属对应 IP。
17. 官方分身可以商业化。
18. 分身是 IP 内角色资产。
19. 专区可设置角色开放权限：open / approval / private。
```
