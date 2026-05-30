# Backend Entity And API Plan

这份文档展开 `08. 真实账号与后端缺失`。

最新前提：

```text
guguclub 已废弃。
Gugu Flash 是替代 guguclub 的全新项目。
```

所以 08 的结论要改成：**Gugu Flash 必须自建完整账号、设备、支付、下载、内容和社区后端；旧 guguclub 只能作为迁移参考，不能作为线上依赖。**

## 1. 已确认方向

```text
1. Gugu Flash 不复用 guguclub 账号体系。
2. Gugu Flash 自建账号、用户、权限、设备、BLE/同步、支付、订单、下载和内容后端。
3. Native / Web / 小程序共用同一套 Gugu Flash API。
4. 旧 guguclub 只作为参考资产：设备协议、BLE 经验、内容包格式、历史用户/设备迁移线索。
5. 商店购买权益按设备落库：DeviceEntitlement = deviceId + hardwarePackId。
6. 每台设备需要单独购买/领取，不做账号全局通用权益。
```

一句话：

```text
Gugu Flash 是新主系统，不是 guguclub 的前端壳。
```

## 2. 系统边界

### Gugu Flash 自己负责

Gugu Flash 后端负责：

- 注册、登录、会话、权限。
- 用户资料。
- 设备绑定、解绑、设备身份。
- BLE / 同步调度。
- 硬件内容下载。
- 支付订单和退款记录。
- 按设备购买权益。
- H5 作品。
- 草稿和版本。
- IP 池。
- 角色分身。
- 题材标签。
- 素材上传和素材来源。
- 内容审核任务。
- 权利投诉。
- 商店上架申请。
- HardwarePack 业务记录。
- Feed、互动、收藏、Remix。
- IP 专区申请和专区管理。
- 运营后台。

### 旧 guguclub 的定位

旧 guguclub 不作为线上依赖。

可以迁移或参考：

- 设备身份字段，例如 `deviceIdHex`。
- BLE 绑定和同步流程经验。
- 历史设备型号和固件约束。
- 历史内容下载链路。
- 旧内容包 / StoryPack / `story.json` 的格式经验。
- 可复用的硬件预览、打包、校验脚本。

不能依赖：

- 旧登录态。
- 旧用户体系。
- 旧设备绑定 API。
- 旧支付接口。
- 旧内容下载接口。
- 旧小程序作为产品中心。

## 3. 客户端原则

不要让小程序成为产品中心。

建议所有客户端共用同一套 Gugu Flash API：

```text
apps/native
apps/web
apps/miniprogram
apps/operator
```

客户端差异只放在适配层：

```text
登录适配
上传适配
分享适配
推送适配
BLE/设备适配
支付适配
```

业务规则必须在 Gugu Flash 后端和 shared domain 层，不要散落在不同客户端里。

## 4. 登录和账号

### 登录策略

```text
游客
  可以浏览公开 H5、播放、分享。

登录用户
  可以创作、发布、Remix、评论、收藏、申请上架、购买、同步设备。

运营用户
  可以进入审核台、商店台、硬件制作台、IP 管理台。
```

### User

Gugu Flash 自己拥有用户主身份。

```json
{
  "id": "user_123",
  "phone": null,
  "wechatOpenId": null,
  "appleUserId": null,
  "displayName": "小闪",
  "avatarUrl": "https://...",
  "role": "creator",
  "status": "active",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

登录方式可以逐步支持：

```text
手机号
微信
Apple
游客升级
运营后台账号
```

### UserRole

运营权限建议独立：

```text
creator
zone_admin
operator
reviewer
hardware_operator
admin
super_admin
```

## 5. 核心实体

### WorkDraft

草稿，允许频繁修改。

包含：

- 作者。
- IP。
- 角色分身。
- 场景结构。
- 上传素材。
- AI 生成记录。
- 编辑状态。

### Work

作品主实体。

作用：

- 代表一个用户作品。
- 聚合多个版本。
- 用于 Feed、作者页、专区、互动。

### WorkVersion

发布版本快照。

规则：

- 发布时生成。
- 发布更新时生成新版本。
- 历史版本不能直接覆盖。
- StoreListing 和 HardwarePack 必须绑定固定版本。

### Asset

上传素材。

字段：

- 上传者。
- 类型：图片 / 音频。
- 用途：封面 / 背景 / 角色贴图 / 音效 / BGM。
- 来源声明。
- 审核状态。
- 硬件兼容状态。

### IPEntry

IP 池条目。

注意：

```text
IP 入池不等于开专区。
```

### Persona

角色分身。

规则：

```text
Persona 必须属于某个 IPEntry。
```

### ZoneApplication / IPZone

专区申请和开通后的专区。

规则：

- 达到作品、创作者、热度和风险门槛后才能申请。
- 申请者邀请若干用户共同成立专区。
- 申请通过后，申请者成为 `zone_admin`。

### ReviewTask

审核任务。

覆盖：

- 内容发布审核。
- 素材审核。
- IP 申请审核。
- 分身审核。
- 商店权利审核。
- 硬件包审核。
- 投诉处理。

### StoreListing

用户提交的上架申请。

绑定：

```text
workId
workVersionId
applicantUserId
```

记录：

- 权利承诺。
- 素材来源。
- 价格 / 免费策略。
- 审核状态。
- 生产状态。

### HardwarePack

后台制作出来的硬件内容包。

绑定：

```text
sourceWorkVersionId
storeListingId
targetDeviceModels
```

不是用户原始 H5。

### Device

Gugu Flash 自己拥有设备绑定和设备身份。

```json
{
  "id": "device_123",
  "ownerUserId": "user_123",
  "deviceIdHex": "A1B2C3",
  "model": "Circle 185",
  "firmwareVersion": "1.0.0",
  "status": "bound",
  "boundAt": 1760000000000,
  "lastSyncedAt": 1760000000000
}
```

### Order

订单是 Gugu Flash 的业务购买记录。

```json
{
  "id": "order_123",
  "buyerUserId": "user_123",
  "deviceId": "device_123",
  "hardwarePackId": "hardware_pack_123",
  "amount": 0,
  "currency": "CNY",
  "status": "paid",
  "paymentProvider": "wechat_pay",
  "paymentTradeId": "trade_123",
  "createdAt": 1760000000000
}
```

### DeviceEntitlement

真正的购买 / 领取权益。

```json
{
  "id": "entitlement_123",
  "deviceId": "device_123",
  "hardwarePackId": "hardware_pack_123",
  "orderId": "order_123",
  "status": "active",
  "createdAt": 1760000000000
}
```

规则：

```text
同一个账号有两台设备，也要分别购买/领取。
HardwarePack 下架后，已有设备内内容可以继续使用。
下架后不允许新购买、新下载或同步到新设备。
```

### DeviceInstall

记录某个硬件包在某台设备上的安装状态。

```json
{
  "id": "install_123",
  "deviceId": "device_123",
  "hardwarePackId": "hardware_pack_123",
  "status": "installed",
  "installedVersion": "1.0.0",
  "installedAt": 1760000000000
}
```

## 6. 状态分层

后端必须避免一个字段表示所有状态。

建议拆成：

```text
User.status
Device.status
Work.status
WorkVersion.status
Asset.reviewStatus
IPEntry.governanceStatus
Persona.status
ZoneApplication.status
IPZone.status
ReviewTask.status
StoreListing.status
HardwarePack.status
Order.status
DeviceEntitlement.status
DeviceInstall.status
```

每个对象只负责自己的生命周期。

## 7. API 分层

建议统一挂在：

```text
/flash/**
```

返回结构由 Gugu Flash 自己定义，建议保持简洁一致：

```json
{
  "code": 200,
  "message": "ok",
  "data": {}
}
```

## 8. API 草案

### Auth / Session

```text
POST /flash/auth/login
POST /flash/auth/logout
POST /flash/auth/refresh
GET  /flash/session
GET  /flash/me
PATCH /flash/me/profile
```

### Feed / Work

```text
GET  /flash/feed
GET  /flash/works/:id
GET  /flash/works/:id/versions
POST /flash/works/:id/interactions
POST /flash/works/:id/remix
GET  /flash/me/works
```

### Draft / Editor

```text
POST /flash/drafts
GET  /flash/drafts/:id
PATCH /flash/drafts/:id
POST /flash/drafts/:id/save-edit
POST /flash/drafts/:id/publish
POST /flash/drafts/:id/publish-update
POST /flash/drafts/:id/validate
POST /flash/drafts/:id/preview
```

### Asset

```text
POST /flash/assets
GET  /flash/assets/:id
PATCH /flash/assets/:id/source-statement
POST /flash/assets/:id/submit-review
```

### IP / Persona / Zone

```text
GET  /flash/ips
POST /flash/ip-applications
GET  /flash/ips/:id/personas
POST /flash/ips/:id/personas
GET  /flash/ips/:id/zone-eligibility
POST /flash/zone-applications
GET  /flash/zones/:id
PATCH /flash/zones/:id
```

### Store / Hardware

```text
POST /flash/store-listings
GET  /flash/store-listings/:id
GET  /flash/store
GET  /flash/hardware-packs/:id
POST /flash/hardware-packs/:id/purchase
POST /flash/hardware-packs/:id/download
POST /flash/hardware-packs/:id/sync
```

### Device

```text
GET  /flash/device/dashboard
GET  /flash/devices
POST /flash/devices/bind
POST /flash/devices/:id/select
POST /flash/devices/:id/unbind
GET  /flash/devices/:id/entitlements
GET  /flash/devices/:id/installs
POST /flash/devices/:id/sync
```

### Payment

```text
POST /flash/orders
GET  /flash/orders/:id
POST /flash/orders/:id/pay
POST /flash/orders/:id/refund
```

### Operator

```text
GET  /flash/operator/review-tasks
POST /flash/operator/review-tasks/:id/approve
POST /flash/operator/review-tasks/:id/reject
GET  /flash/operator/store-listings
POST /flash/operator/store-listings/:id/approve-rights
POST /flash/operator/store-listings/:id/reject
POST /flash/operator/hardware-packs
POST /flash/operator/hardware-packs/:id/approve
POST /flash/operator/hardware-packs/:id/publish
POST /flash/operator/hardware-packs/:id/export-to-hardware-studio
```

## 9. 权限规则

游客：

- 看公开作品。
- 播放公开 H5。
- 分享。

登录用户：

- 创建草稿。
- 发布作品。
- 上传素材。
- Remix。
- 评论 / 收藏 / 点赞。
- 申请 IP。
- 创建分身。
- 申请专区。
- 申请上架。
- 购买 / 领取 HardwarePack。
- 绑定设备。
- 同步到自己绑定的设备。

专区管理员：

- 管理专区信息。
- 管理角色申请。
- 邀请协管。
- 发起专区活动。

运营 / 审核：

- 审核内容、素材、IP、分身、上架、硬件包。
- 限流、下架、封禁、冻结。
- 导出到硬件制作工具。

## 10. 数据库建议

优先关系型数据库。

建议：

```text
MySQL / PostgreSQL
  核心实体、状态机、订单、权益、审核记录。

对象存储
  图片、音频、硬件包文件、审核截图。

Redis
  Feed 缓存、排行榜、限流、会话缓存。

搜索索引
  IP、作品、角色分身、专区搜索。
```

## 11. 与当前原型的迁移

当前 `packages/api-client` 已经是 facade，后面可以这样替换：

```text
mock-flash-api
  -> http-flash-api
  -> real Gugu Flash backend
```

迁移顺序建议：

1. 保留 mock 数据，定义 HTTP API response shape。
2. 接 Auth / Session / User。
3. 接 Feed / Work 读取。
4. 接 Draft / Publish。
5. 接 Asset 上传。
6. 接 ReviewTask。
7. 接 StoreListing / HardwarePack。
8. 接 Device、DeviceEntitlement、DeviceInstall。
9. 接 Order / Payment。
10. 接硬件制作工具导出。

## 12. 最小 MVP 后端

第一版真实后端不需要一次做完所有社交。

必须有：

- Auth / Session。
- User / UserRole。
- Device。
- WorkDraft。
- Work / WorkVersion。
- Asset。
- IPEntry。
- Persona。
- ReviewTask。
- StoreListing。
- HardwarePack。
- Order。
- DeviceEntitlement。
- DeviceInstall。

可以后置：

- 私信。
- 好友完整社交流。
- 收益分成。
- 高级专区运营。
- 复杂推荐系统。
- 自动硬件编译。

## 13. 风险点

### 旧系统依赖

不能把 Gugu Flash 建成旧 guguclub 的外挂模块。旧系统已废弃，只能迁移可用经验和数据。

### 账号迁移

如果旧用户需要迁移，必须做一次性 migration，而不是长期依赖旧登录态。

### 设备权益混乱

购买按设备，不按账号。一定要把 `Order` 和 `DeviceEntitlement` 拆开。

### H5 和硬件混淆

Work 不是 HardwarePack。Store 里展示和下载的是 HardwarePack。

### 状态机漂移

不能只在前端判断状态。关键状态必须以后端为准。

### 客户端分裂

Native、Web、小程序不能各自实现业务规则。都调用同一套 Gugu Flash API。

## 14. 建议当前先确认

```text
1. guguclub 已废弃，Gugu Flash 是替代它的新主系统。
2. Gugu Flash 自建账号体系，不复用 guguclub 登录。
3. Gugu Flash 自建设备、BLE/同步、支付、订单和下载能力。
4. Native / Web / 小程序共用同一套 Gugu Flash API。
5. 购买权益落到 DeviceEntitlement，不落到账号全局。
6. 后端第一版优先做 Auth、User、Device、WorkDraft、WorkVersion、Asset、ReviewTask、StoreListing、HardwarePack、Order、DeviceEntitlement。
```
