# IP Zone Community Plan

这份文档展开 `06. 专区还不是社区`。

已确认：

```text
IP 池 = 可被选择、创作和治理的 IP / 世界观 / 原创企划集合
专区 = 满足条件后，由用户申请开通的 IP 社区空间
分身 = IP 内的角色，专区开通后在专区内组织和展示
题材 = 内容标签 / 模板频道
```

所以第 6 个问题不是“专区怎么分类”，而是：**哪些 IP 值得开专区，以及专区如何成为真正的社区承载页**。

## 1. 核心原则

```text
有 IP 不等于有专区。
IP 入池不自动生成专区。
一个 IP 最多开通一个正式专区。
专区必须由用户申请，满足作品和热度门槛后开通。
申请者邀请若干用户共同成立专区，申请通过后自动成为专区管理员。
```

IP 池解决的是创作归属和版权治理；专区解决的是社区沉淀和运营组织。

## 2. IP 与专区的关系

### IP 池条目

IP 池条目可以被用于：

- 原创 / 二创发布。
- 角色分身归属。
- 推荐、商店、硬件审核。
- IP 风险治理。
- 作品聚合。

但它不自动拥有：

- 专区首页。
- 专区管理员。
- 专区公告和规则。
- 专区活动。
- 专区成员体系。

### IP 专区

IP 专区是开通后的社区空间，承载：

- IP 介绍和治理状态。
- 角色分身列表。
- 热门作品和最新作品。
- 创作 / Remix 入口。
- 商店和硬件内容展示。
- 专区规则、公告、活动。
- 成员、管理员、协管。

## 3. 专区开通条件

专区开通需要同时满足基础条件和社区条件。

### 基础条件

```text
IP 已进入 IP 池。
IP 状态为 active。
IP 不处于 disputed / restricted / blocked。
IP 没有严重重复或合并争议。
```

### 社区条件

MVP 可以先做成后台可配置阈值，不需要在前台写死：

```text
publishedWorkCount >= N
activeCreatorCount >= M
heatScore >= H
recentViolationRate <= R
foundingInviteAcceptedCount >= K
```

建议默认理解：

- 有一定数量的已发布作品。
- 有多个不同创作者参与。
- 有收藏、播放、互动、Remix 等热度。
- 最近没有明显违规或版权投诉。
- 申请者能邀请到几位用户一起成立专区。

## 4. 专区申请流程

```text
IP 已入池
  -> 系统统计作品数、创作者数、热度和风险
  -> 达到开区门槛
  -> 用户发起专区申请
  -> 邀请若干用户作为创始成员
  -> 被邀请用户接受
  -> 平台审核专区申请
  -> 通过后开通专区
  -> 申请者自动成为 zone_admin
  -> 接受邀请的用户成为 founding_member / zone_moderator
```

审核失败时，IP 仍留在 IP 池，不影响正常创作；只是暂不开专区。

## 5. 专区类型

专区类型跟 IP 类型一致：

```text
platform_original
user_original
authorized_ip
fan_ip
```

专区能否推荐、上架、硬件化，不由类型直接决定，而由 IP 治理状态、专区状态和审核结果决定。

```text
active
  正常展示、创作、推荐、上架、硬件候选。

disputed
  权利争议中，暂停商店和硬件，推荐可降权。

restricted
  限制新增、推荐、上架、硬件。

blocked
  禁止新增和传播，存量内容下架或不可见。
```

## 6. 专区首页结构

MVP 专区首页建议包含：

```text
顶部信息
  IP 名称
  简介
  封面
  IP 类型
  治理状态
  关注/收藏入口

角色分身
  官方/热门分身
  用户创建分身
  创建分身入口，按权限展示

作品流
  热门作品
  最新作品
  我参与/我发布的作品

创作入口
  使用该 IP 创作
  Remix 热门作品
  创建角色分身

商店/硬件
  已上架 HardwarePack
  可下载内容
  硬件精选

规则
  IP 规则
  二创说明
  商业化说明
  举报/投诉入口
```

## 7. 专区角色和权限

### platform_admin

平台管理员。

权限：

- 审核 IP 申请和专区开通申请。
- 修改任意专区信息。
- 限制/封禁专区。
- 合并重复 IP。
- 管理角色分身。
- 管理推荐、商店、硬件状态。

### zone_admin

专区管理员。专区申请通过后，申请者自动成为 `zone_admin`。

权限：

- 编辑专区简介、封面、公告。
- 设置角色开放权限：`open / approval / private`。
- 管理该 IP 下用户创建的角色申请。
- 设置推荐题材标签。
- 邀请或移除协管。
- 发起专区活动。

不拥有：

- IP 版权或授权。
- 绕过平台审核的权利。
- 强制上架商店或硬件的权利。
- 删除其他用户合法作品的绝对权利。

### zone_moderator

专区协管。MVP 可由接受邀请的创始成员默认担任。

权限：

- 处理角色申请。
- 管理公告。
- 标记违规内容。
- 协助整理作品和角色。

### founding_member

创始成员。由申请者邀请并接受后加入，用于证明这个专区不是单人空壳。

权限：

- 参与专区创建。
- 参与专区早期内容整理。
- 可被设置为 `zone_moderator`。

### member

普通用户。

权限：

- 浏览专区。
- 创作作品。
- 使用开放角色分身。
- 申请创建角色分身。
- 举报内容。

## 8. 角色分身开放权限

专区开通后，可以配置该 IP 下角色分身的使用方式：

```text
open
  任何人可以使用该 IP 下公开角色创作。

approval
  使用角色或创建新角色需要专区 admin/moderator 批准。

private
  只有 admin 和指定成员可创作。
```

注意：角色分身属于 IP，不属于专区管理员个人。专区管理员拥有运营管理权，不拥有角色或 IP 的版权。

## 9. 专区内容流

专区内至少需要三个内容流：

```text
热门
  按热度、完播、收藏、Remix、举报综合排序。

最新
  按发布时间排序。

商店/硬件
  只展示已经完成后台制作并可下载的 HardwarePack。
```

可后续增加：

```text
关注的人
我参与的
角色分身作品流
题材过滤
```

## 10. 专区与题材频道

专区和题材是交叉关系：

```text
一个作品属于一个 IP
一个开通专区对应一个 IP
一个作品可以有多个题材标签
```

例子：

```text
IP：站内摸鱼宇宙
专区：站内摸鱼宇宙专区，达到门槛后申请开通
角色分身：工位小闪
题材标签：摸鱼上班、情绪陪伴
```

题材频道不拥有作品，只聚合不同 IP 下的同类作品。

## 11. 不同 IP 的开区方式

### 平台原创 IP

平台可以直接开通专区，也可以先进入 IP 池观察数据后再开通。

```text
平台创建 IP
  -> 进入 IP 池
  -> 平台决定是否开通专区
  -> 添加官方角色分身
  -> 配置题材标签
  -> 开放创作
```

### 用户原创 IP

```text
用户申请创建原创 IP
  -> 轻审核
  -> 通过后进入 IP 池
  -> 作品和热度达到开区门槛
  -> 用户申请开通专区
  -> 邀请若干用户共同成立专区
  -> 审核通过后，申请者成为 zone_admin
```

### 外部 fan_ip

```text
用户申请添加 IP
  -> 轻审核
  -> 通过后进入 IP 池
  -> 作品和热度达到开区门槛
  -> 用户申请开通专区
  -> 邀请若干用户共同成立专区
  -> 平台审核版权和社区风险
  -> 通过后，申请者成为 zone_admin
```

已确认：

```text
IP 审核通过只代表进入 IP 池，不自动生成专区。
专区需要满足作品和热度门槛后，由用户申请开通。
申请者邀请若干用户共同成立专区。
专区申请通过后，申请者自动成为 zone_admin。
```

## 12. 专区治理动作

专区级动作：

```text
edit_profile
  编辑专区信息。

set_visibility
  设置公开、隐藏、限制访问。

set_permissions
  设置角色开放权限。

appoint_moderator
  任命专区协管。

remove_moderator
  移除专区协管。

restrict_zone
  限制新增、推荐、商店、硬件。

block_zone
  禁止新增和传播。

merge_zone
  合并重复 IP 专区。

transfer_admin
  转移专区管理员。
```

## 13. IP 合并与专区迁移

重复 IP 很常见，必须支持合并。

合并规则：

```text
保留主 IP
别名合并到主 IP
作品迁移到主 IP
角色分身迁移到主 IP
StoreListing 和 HardwarePack 保持来源记录
如果两个 IP 都已开区，则保留主专区并迁移成员和内容
被合并 IP 标记为 merged
```

用户访问旧 IP 或旧专区时跳转主 IP / 主专区。

## 14. 专区与商店/硬件

专区里可以展示商店和硬件内容，但展示对象不是 H5 原稿。

```text
专区作品流:
  Work

专区商店/硬件:
  HardwarePack
```

当 IP 进入 `disputed / restricted / blocked`：

```text
disputed:
  暂停新商店发布和硬件下载，推荐可降权。

restricted:
  禁止新增作品，暂停商店和硬件。

blocked:
  下架作品或不可见，商店和硬件停止新下载。
```

已安装到设备的内容继续使用，按第三个问题已确认规则处理。

## 15. 数据模型补充

### IPEntry

```json
{
  "id": "ip_workday_gugu",
  "name": "站内摸鱼宇宙",
  "aliases": ["摸鱼宇宙"],
  "originType": "platform_original",
  "governanceStatus": "active",
  "description": "围绕上班、摸鱼和下班倒计时的电子吧唧世界观。",
  "defaultGenreTags": ["摸鱼上班", "情绪陪伴"],
  "hasZone": true,
  "zoneId": "zone_workday_gugu",
  "stats": {
    "works": 128,
    "creators": 18,
    "personas": 12,
    "heatScore": 48200,
    "hardwarePacks": 6
  }
}
```

### ZoneApplication

```json
{
  "id": "zone_app_123",
  "ipId": "ip_workday_gugu",
  "applicantId": "user_123",
  "status": "pending",
  "reason": "这个 IP 已经有稳定创作者和作品，希望开区沉淀角色和活动。",
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
  "description": "围绕上班、摸鱼和下班倒计时的电子吧唧世界观。",
  "rolePermission": "open",
  "visibility": "public",
  "openedAt": 1760000000000
}
```

### ZoneMembership

```json
{
  "zoneId": "zone_workday_gugu",
  "userId": "user_123",
  "role": "zone_admin",
  "status": "active",
  "joinedAt": 1760000000000
}
```

### ZoneActionLog

```json
{
  "id": "zone_log_123",
  "zoneId": "zone_workday_gugu",
  "actorId": "operator_1",
  "action": "restrict_zone",
  "reason": "版权投诉处理中",
  "createdAt": 1760000000000
}
```

## 16. API 草案

```text
GET  /ips/:id/zone-eligibility
GET  /zone-applications
POST /zone-applications
POST /zone-applications/:id/invites
POST /zone-applications/:id/approve
POST /zone-applications/:id/reject

GET  /ip-zones
GET  /ip-zones/:id
PATCH /ip-zones/:id
GET  /ip-zones/:id/works
GET  /ip-zones/:id/personas
GET  /ip-zones/:id/hardware-packs

POST /ip-zones/:id/follow
POST /ip-zones/:id/unfollow
POST /ip-zones/:id/personas
POST /ip-zones/:id/restrict
POST /ip-zones/:id/block
POST /ip-zones/:id/merge
POST /ip-zones/:id/transfer-admin
```

## 17. MVP 落地

Phase 1:

- 把当前题材“专区”改名为题材频道。
- 新增 IP 池对象，作品和分身归属到 IP。
- Feed 显示 IP + 角色分身 + 题材标签。

Phase 2:

- 新增 IP 开区资格统计。
- 后台配置开区门槛。
- 前台在达标 IP 上展示“申请开通专区”入口。

Phase 3:

- 用户发起专区申请。
- 申请者邀请若干用户成为创始成员。
- 审核通过后创建 IPZone。
- 申请者自动成为 `zone_admin`。

Phase 4:

- 创建 IP 专区页。
- 展示 IP 信息、角色分身、作品流、商店/硬件内容。
- 支持角色开放权限：`open / approval / private`。

Phase 5:

- 增加专区治理：限制、封禁、合并、管理员转移、协管。

## 18. 已确认规则

```text
1. 有 IP 不等于有专区。
2. IP 审核通过只进入 IP 池，不自动生成专区。
3. 专区是 IP 社区空间，不是题材专区。
4. 专区需要满足作品数、创作者数、热度和风险门槛后才能申请。
5. 专区由用户申请开通。
6. 申请者需要邀请若干用户共同成立专区。
7. 专区申请通过后，申请者自动成为 zone_admin。
8. zone_admin 是运营管理员，不等于 IP 权利人。
9. 分身属于 IP，专区开通后在专区内组织和展示。
10. 专区作品流展示 Work。
11. 专区商店/硬件展示 HardwarePack。
12. disputed/restricted/blocked IP 会联动影响专区展示、商店和硬件。
13. 题材频道只做跨 IP 聚合，不拥有作品。
14. 支持 IP 合并和旧专区跳转。
```
