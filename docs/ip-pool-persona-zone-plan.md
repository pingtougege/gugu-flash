# IP Pool, Zones, And Personas Plan

这份文档确认 Gugu Flash 的社区组织方式：

```text
IP 池
  -> 达到条件后申请开通 IP 专区
  -> 角色分身
  -> 作品
```

之前原型里的“情绪陪伴区、摸鱼上班区、同频搭子区、像素冒险区”不再作为核心专区。它们改为题材频道或内容标签。

## 核心定义

### IP 池

IP 池是平台允许用户选择和创作的 IP/世界观/原创企划集合。

二创作品必须从 IP 池选择 IP，不能自由手填。这样可以控制版权风险、专区治理、角色分身归属和后续商业化。

IP 池包括：

```text
platform_original
  平台原创 IP，例如雨天咕咕宇宙、站内摸鱼宇宙。

user_original
  用户原创企划，例如某个用户创建的原创世界观。

authorized_ip
  平台获得授权的外部 IP。

fan_ip
  平台允许社区讨论/二创的未授权或用户声明 IP。
```

### IP 专区

专区按 IP 划分，不按题材划分，但有 IP 不等于有专区。

例子：

```text
雨天咕咕宇宙
站内摸鱼宇宙
汽水星球原创企划
某授权动漫 IP
某游戏同人 IP
```

一个 IP 最多开通一个正式专区。IP 进入 IP 池后，先用于创作归属、角色归属和版权治理；只有作品、创作者和热度达到一定程度后，用户才可以申请开通专区。

专区承载：

- 该 IP 的作品流。
- 该 IP 的角色分身。
- 该 IP 的创作 / Remix 入口。
- 该 IP 的规则和版权状态。
- 该 IP 的上架/硬件限制。
- 该 IP 的管理员、协管和社区活动。

### 角色分身

分身是 IP 内的角色，不是全局孤立模板。专区开通后，分身会在专区内组织和展示。

例子：

```text
雨天咕咕宇宙
  - 雨天咕咕
  - 晴天咕咕
  - 雷暴咕咕

站内摸鱼宇宙
  - 工位小闪
  - 下班雷达
  - 会议幽灵
```

分身必须属于一个 IP：

```text
Persona.ipId = IPEntry.id
```

### 题材频道

题材频道只是内容类型，不承担社区边界。

例子：

```text
情绪陪伴
摸鱼上班
同频搭子
像素冒险
睡前故事
双人互动
```

题材可以作为标签、推荐频道、模板分类，但不是 IP 专区。

## 创作流程

### 原创作品

原创作品流程：

```text
选择原创
  -> 选择已有原创 IP，或创建原创 IP
  -> 选择该 IP 下的角色分身，或创建新分身
  -> 选择题材/模板
  -> 生成/编辑作品
  -> 发布
```

原创不是“没有 IP”。原创也应该沉淀为 IP，只是 IP 类型是 `platform_original` 或 `user_original`。

### 二创作品

二创作品流程：

```text
选择二创
  -> 从 IP 池选择 IP
  -> 选择该 IP 下的角色分身
  -> 选择题材/模板
  -> 生成/编辑作品
  -> 发布
```

二创不能手填 IP。如果 IP 池没有目标 IP，用户可以：

```text
申请添加 IP
  -> 平台审核
  -> 进入 IP 池
  -> 用户再创建二创
```

## IP 池状态

建议 IP 池有两个状态维度。

### IP 来源类型

```text
platform_original
user_original
authorized_ip
fan_ip
```

### 授权/治理状态

```text
official
  平台原创或平台正式授权，可推荐、可上架、可硬件化。

user_declared
  用户声明原创或用户声明拥有授权，需要审核后才能商业化。

community_allowed
  可社区发布、推荐、上架和硬件化，但需要通过对应审核。

restricted
  允许浏览存量内容，但限制新增或限制传播。

blocked
  禁止新增和传播。
```

## 二创规则

已确认：

- 二创也可以先发后审。
- 二创必须从 IP 池选择 IP。
- 用户可以申请添加 IP，经审核进入 IP 池。
- 二创靠巡检、举报、投诉和下架机制治理。
- 所有进入 IP 池且未被限制/封禁的 IP，都可以进入推荐、商店和硬件链路。
- 是否拥有专区，要看后续作品、热度和开区申请。
- 推荐、商店和硬件的门槛是对应审核，而不是 IP 来源类型。

治理补充：

- `fan_ip + community_allowed`：可以发布，可以进入普通流、全站推荐、商店和硬件审核；如果已开通专区，也可以进入 IP 专区。
- `authorized_ip + official`：可以参与活动、推荐、商店、硬件，但受授权条款限制。
- `user_original + user_declared`：可以进入推荐、商店和硬件审核，但上架/硬件可能需要作者权利承诺或材料。
- `restricted`：不允许新建作品，存量作品可限流或仅自己可见。
- `blocked`：禁止发布，存量下架或不可见。

## 数据模型草案

### IPEntry

```json
{
  "id": "ip_rain_gugu",
  "name": "雨天咕咕宇宙",
  "originType": "platform_original",
  "governanceStatus": "official",
  "description": "围绕雨天、陪伴和低电量情绪的咕咕世界观。",
  "cover": {
    "background": "linear-gradient(...)",
    "character": "☔"
  },
  "riskLevel": "low",
  "hasZone": false,
  "zoneId": null,
  "allowFanwork": true,
  "allowStoreListing": true,
  "allowHardware": true
}
```

### IPZone

```json
{
  "id": "zone_rain_gugu",
  "ipId": "ip_rain_gugu",
  "name": "雨天咕咕宇宙专区",
  "status": "active",
  "adminId": "user_123",
  "moderatorIds": ["user_456"],
  "foundingMemberIds": ["user_123", "user_456"],
  "rolePermission": "open"
}
```

### Persona

```json
{
  "id": "persona_rain_gugu",
  "ipId": "ip_rain_gugu",
  "name": "雨天咕咕",
  "avatar": "☔",
  "roleType": "official_role",
  "tagline": "轻声陪你把今天过完。",
  "description": "雨天陪伴型电子吧唧角色。",
  "tone": "温柔、短句、轻微吐槽",
  "rightsStatus": "official"
}
```

### Work

```json
{
  "id": "h5_abc",
  "contentOrigin": "fanwork",
  "ipId": "ip_workday_gugu",
  "ipName": "站内摸鱼宇宙",
  "personaId": "persona_office_sprite",
  "persona": {
    "id": "persona_office_sprite",
    "name": "工位小闪",
    "avatar": "💡"
  },
  "genreTags": ["摸鱼上班", "情绪陪伴"]
}
```

## 创建页改造建议

当前创建页：

```text
原创/二创
二创 IP 输入框
角色分身
专区
模板节奏
```

建议改成：

```text
原创/二创

如果原创：
  选择原创 IP / 创建原创 IP

如果二创：
  从 IP 池选择 IP
  找不到 IP -> 申请添加 IP

选择角色分身：
  只展示所选 IP 下的角色
  可创建该 IP 下的新角色

选择题材/模板：
  情绪陪伴 / 摸鱼上班 / 同频搭子 / 像素冒险
```

## Feed 和社区改造建议

Feed 展示：

```text
作品标题
IP
已开专区入口，如果有
角色分身
题材标签
原创/二创
硬件/商店状态
```

频道结构：

```text
推荐
关注
IP 专区
题材频道
好友
```

IP 专区页：

```text
IP 介绍
版权/治理状态
角色分身列表
热门作品
最新作品
创作 / Remix 入口
专区规则
```

## 审核与商业化影响

审核时必须看 IP 池状态：

```text
Work.contentOrigin
IPEntry.originType
IPEntry.governanceStatus
IPZone.status，如果已开专区
Persona.rightsStatus
StoreListing.status
HardwareCandidate.status
```

推荐规则：

- 所有进入 IP 池且未被限制/封禁的 IP，都可以进入推荐。
- 推荐排序仍受内容审核、互动数据、举报、IP 治理状态和运营配置影响。
- `restricted` 和 `blocked` 不进入推荐。

商店规则：

- 所有进入 IP 池且未被限制/封禁的 IP，都可以申请商店上架。
- 商店上架必须通过权利/内容审核。
- `restricted` 和 `blocked` 不允许上架。

硬件规则：

- 所有进入 IP 池且未被限制/封禁的 IP，都可以进入硬件候选。
- 硬件适配必须人工审核，并最终生成独立 `HardwarePack`。
- 审核重点是权利风险、设备兼容、内容安全和品牌质量，不按 IP 类型一刀切。

## 需要后续讨论

1. 专区开通的作品、创作者和热度阈值分别是多少？
2. 用户创建的角色分身是先发后审，还是先审后公开？
3. 平台是否提供官方角色分身库，用户只能基于库内角色创作？
4. 接受邀请的创始成员默认成为协管，还是只成为 founding_member？

## 已确认规则

```text
1. 专区按 IP / 世界观 / 原创企划划分。
2. 有 IP 不等于有专区，IP 入池不自动开区。
3. 专区需要满足作品、创作者和热度门槛后由用户申请开通。
4. 申请者邀请若干用户共同成立专区，申请通过后自动成为 zone_admin。
5. 分身是 IP 内的角色，专区开通后在专区内组织和展示。
6. 情绪陪伴、摸鱼上班、同频搭子、像素冒险改为题材频道/模板标签。
7. 二创必须从平台 IP 池选择 IP，不能自由手填。
8. 用户可以申请添加 IP，经审核后进入 IP 池。
9. IP 池内所有未受限 IP 都可以进入推荐、商店和硬件链路。
10. IP 池是二创发布、上架、硬件审核的基础治理对象。
11. 用户可以创建原创 IP，轻审核后入池。
12. 用户可以在 IP 下创建角色分身。
13. 真人明星/公众人物分身禁止。
14. 动漫/游戏等角色分身必须归属对应 IP。
15. 官方分身可以商业化。
16. 分身是 IP 内角色资产，不是账号孤立资产。
17. 专区可设置角色开放权限：open / approval / private。
```
