# State Machine Plan

这份文档展开 `10. 状态机容易漂移`。

当前原型里 `status`、`storeStatus`、`hardwareStatus` 放在同一个 H5 Pack 上，可以快速演示，但真实系统不能这样长期跑。真实后端必须拆成多个实体，各自拥有自己的状态机。

## 1. 核心结论

建议先按这套定：

```text
1. Work.status 只表示 H5 社区可见性。
2. WorkVersion.status 只表示某个发布版本的审核/有效状态。
3. StoreListing.status 只表示商店上架申请和商品状态。
4. HardwarePack.status 只表示后台制作出的设备内容包状态。
5. Order.status 只表示支付订单状态。
6. DeviceEntitlement.status 只表示某台设备对某个 HardwarePack 的购买/领取权益。
7. DeviceInstall.status 只表示某台设备是否已安装某个 HardwarePack。
8. 下架不主动删除已安装设备内内容，但停止新购买、新下载和新设备同步。
9. 前端展示用的“综合状态”从这些实体派生，不回写到 Work。
```

一句话：

```text
不要让 Work 变成所有状态的垃圾桶。
```

## 2. 实体边界

### Work

作品主实体。

负责：

- 作者归属。
- IP / 分身 / 题材归属。
- 当前线上版本。
- H5 社区可见性。

不负责：

- 商店是否上架。
- 硬件包是否可下载。
- 某台设备是否已购买。
- 某台设备是否已安装。

### WorkVersion

作品版本快照。

负责：

- 发布时的内容快照。
- 更新时的新版本。
- 被 StoreListing / HardwarePack 固定引用。

### StoreListing

商店上架申请和商品状态。

负责：

- 上架申请。
- 权利承诺。
- 价格 / 免费策略。
- 商店展示状态。
- 与 HardwarePack 的连接。

### HardwarePack

官方制作出来的设备内容包。

负责：

- 设备兼容。
- 包文件。
- 固件要求。
- 下载状态。
- 下架、暂停、替代和移除。

### DeviceEntitlement

购买 / 领取权益。

负责：

- 某台设备是否拥有某个 HardwarePack。

### DeviceInstall

安装状态。

负责：

- 某台设备是否已安装。
- 安装的是哪个包版本。
- 同步失败、回滚、卸载状态。

## 3. Work.status

只表示 H5 社区状态。

```text
draft
publish_submitted
public_limited
public
rejected
taken_down
deleted
```

说明：

- `draft`: 草稿，只有作者可见。
- `publish_submitted`: 已提交发布审核，等待处理。
- `public_limited`: 已发布，可出现在普通流、作者页、专区页和分享链接；不进推荐、商店、硬件。
- `public`: 审核通过，可进入推荐、商店申请和硬件候选。
- `rejected`: 发布被拒，作者可修改后再提交。
- `taken_down`: 发布后被下架。
- `deleted`: 作者删除或平台永久删除，通常保留审计记录。

允许迁移：

```text
draft -> publish_submitted
publish_submitted -> public_limited
publish_submitted -> public
publish_submitted -> rejected
public_limited -> public
public_limited -> taken_down
public -> taken_down
rejected -> draft
taken_down -> public_limited
taken_down -> public
draft -> deleted
rejected -> deleted
```

禁止迁移：

```text
draft -> public
draft -> StoreListing.listed
public_limited -> StoreListing.listed
taken_down -> StoreListing.listed
taken_down -> HardwarePack.available
```

注意：禁止迁移里出现的 StoreListing / HardwarePack 不是 Work 的状态，而是业务规则：这些动作不能在 Work 未满足条件时发生。

## 4. WorkVersion.status

```text
draft_snapshot
reviewing
active
superseded
locked
invalidated
```

说明：

- `draft_snapshot`: 草稿快照。
- `reviewing`: 发布更新审核中。
- `active`: 当前线上 H5 版本。
- `superseded`: 已被新版本替代。
- `locked`: 已被 StoreListing 或 HardwarePack 引用，不能直接覆盖。
- `invalidated`: 因审核、投诉或严重问题失效。

规则：

- 发布创建新的 `WorkVersion`。
- 发布更新创建新的 `WorkVersion`。
- 已被商店或硬件引用的版本只能 `locked`，不能被覆盖。
- StoreListing 和 HardwarePack 必须指向固定 `WorkVersion.id`。

## 5. StoreListing.status

只表示商店上架生命周期。

```text
not_applied
submitted
rights_review
production_queued
producing
pack_review
listed
rejected
delisted
frozen
```

说明：

- `not_applied`: 未申请上架。
- `submitted`: 用户已提交申请材料。
- `rights_review`: 权利和内容审核中。
- `production_queued`: 初审通过，等待后台制作 HardwarePack。
- `producing`: 正在制作硬件内容包。
- `pack_review`: HardwarePack 制作完成，等待最终审核。
- `listed`: 商店可见，可购买 / 领取。
- `rejected`: 上架申请被拒。
- `delisted`: 上架后下架。
- `frozen`: 权利争议、投诉或收益冻结中。

允许迁移：

```text
not_applied -> submitted
submitted -> rights_review
rights_review -> production_queued
rights_review -> rejected
production_queued -> producing
producing -> pack_review
pack_review -> listed
pack_review -> rejected
listed -> delisted
listed -> frozen
frozen -> listed
frozen -> delisted
rejected -> submitted
delisted -> submitted
```

前置条件：

```text
Work.status = public
WorkVersion.status in active / locked
IPEntry.governanceStatus = active
Asset.reviewStatus allows store
RightsEvidence complete
```

## 6. HardwarePack.status

只表示设备内容包生命周期。

```text
draft
building
reviewing
ready
available
paused
deprecated
removed
```

说明：

- `draft`: 后台创建硬件包记录。
- `building`: 正在制作 / 转换。
- `reviewing`: 等待硬件审核。
- `ready`: 通过审核，准备发布。
- `available`: 可下载到设备。
- `paused`: 临时暂停下载。
- `deprecated`: 有新版本替代。
- `removed`: 已移除，不允许新下载。

允许迁移：

```text
draft -> building
building -> reviewing
reviewing -> ready
reviewing -> removed
ready -> available
available -> paused
paused -> available
available -> deprecated
available -> removed
deprecated -> removed
```

前置条件：

```text
StoreListing.status in pack_review / listed
sourceWorkVersion.status = locked
deviceCompatibility passed
hardwareReview passed
```

## 7. Order.status

只表示支付订单状态。

```text
created
pending_payment
paid
cancelled
refunding
refunded
failed
closed
```

允许迁移：

```text
created -> pending_payment
pending_payment -> paid
pending_payment -> cancelled
pending_payment -> failed
paid -> refunding
refunding -> refunded
paid -> closed
cancelled -> closed
failed -> closed
refunded -> closed
```

规则：

- `paid` 后才可以生成 `DeviceEntitlement`。
- 免费领取也要生成 Order，金额为 0，方便审计。

## 8. DeviceEntitlement.status

只表示某台设备是否拥有某个 HardwarePack。

```text
active
paused
revoked
expired
```

说明：

- `active`: 该设备拥有权益，可下载 / 同步。
- `paused`: 临时暂停，比如投诉或风控中。
- `revoked`: 权益被撤销，通常用于退款、作弊或严重投诉。
- `expired`: 有期限权益过期，MVP 可不用。

规则：

```text
DeviceEntitlement = deviceId + hardwarePackId
```

同一账号下多台设备要分别购买 / 领取。

## 9. DeviceInstall.status

只表示某台设备的安装状态。

```text
not_installed
download_pending
downloaded
syncing
installed
failed
rollback_required
removed_from_device
```

允许迁移：

```text
not_installed -> download_pending
download_pending -> downloaded
download_pending -> failed
downloaded -> syncing
syncing -> installed
syncing -> failed
failed -> download_pending
installed -> rollback_required
rollback_required -> installed
installed -> removed_from_device
```

规则：

- `HardwarePack.available` 且 `DeviceEntitlement.active` 才能新下载。
- `HardwarePack.delisted/removed` 后，已安装设备内内容可以继续使用。
- 下架后不允许新购买、新下载或同步到新设备。

## 10. Asset.reviewStatus

上传素材状态。

```text
local_preview
pending_scan
usable_h5
store_review_required
hardware_review_required
blocked
removed
```

规则：

- `usable_h5` 可用于 H5 发布。
- 商店和硬件可以要求更高等级审核。
- `blocked` 的素材不能被发布版本引用。

## 11. IP / Persona / Zone 状态

### IPEntry.governanceStatus

```text
active
disputed
restricted
blocked
merged
```

影响：

- `active`: 可创作、推荐、商店、硬件。
- `disputed`: 暂停商店和硬件，推荐降权。
- `restricted`: 禁止新增，暂停推荐、商店、硬件。
- `blocked`: 禁止新增和传播，存量内容下架或不可见。
- `merged`: 跳转主 IP。

### Persona.status

```text
draft
public
restricted
blocked
removed
```

### ZoneApplication.status

```text
draft
submitted
inviting
reviewing
approved
rejected
cancelled
```

### IPZone.status

```text
active
restricted
hidden
blocked
merged
```

## 12. ReviewTask.status

审核任务状态。

```text
pending
in_review
approved
rejected
action_taken
escalated
closed
```

规则：

- ReviewTask 不替代目标对象状态。
- 审核通过或驳回后，后端服务根据审核结果迁移目标对象状态。
- 审核动作必须记录操作人、理由、证据和时间。

## 13. 跨实体联动规则

### 发布通过

```text
ReviewTask.approved
  -> Work.status = public
  -> WorkVersion.status = active
```

### 申请商店

```text
Work.status = public
  -> StoreListing.submitted
  -> StoreListing.rights_review
```

### 商店初审通过

```text
StoreListing.rights_review approved
  -> StoreListing.production_queued
  -> WorkVersion.locked
```

### 硬件包制作完成

```text
HardwarePack.reviewing approved
  -> HardwarePack.ready
  -> StoreListing.pack_review
```

### 商店正式上架

```text
StoreListing.pack_review approved
  -> StoreListing.listed
  -> HardwarePack.available
```

### 用户购买 / 领取

```text
Order.paid
  -> DeviceEntitlement.active
```

### 同步到设备

```text
HardwarePack.available
DeviceEntitlement.active
Device.status bound/online
  -> DeviceInstall.downloaded
  -> DeviceInstall.syncing
  -> DeviceInstall.installed
```

### H5 下架

```text
Work.taken_down
  -> 推荐停止
  -> 新商店申请停止
  -> 已有关联 StoreListing 进入 frozen/delisted，视原因决定
  -> HardwarePack 是否暂停按投诉严重程度决定
```

### HardwarePack 下架

```text
HardwarePack.available -> paused / removed
StoreListing.listed -> frozen / delisted
新购买停止
新下载停止
新设备同步停止
已安装设备内内容继续使用
```

## 14. 派生展示状态

前端可以展示综合状态，但这些不能回写到数据库主状态。

例子：

```text
可浏览 H5
  Work.status in public_limited / public

可申请商店
  Work.status = public
  IPEntry.governanceStatus = active

商店可购买
  StoreListing.status = listed
  HardwarePack.status = available

设备可同步
  HardwarePack.status = available
  DeviceEntitlement.status = active
  Device.status = bound/online

已安装可继续使用
  DeviceInstall.status = installed
```

## 15. 原型迁移建议

当前原型：

```text
GuguH5Pack.status
GuguH5Pack.storeStatus
GuguH5Pack.hardwareStatus
```

真实后端要迁移成：

```text
Work.status
WorkVersion.status
StoreListing.status
HardwarePack.status
DeviceEntitlement.status
DeviceInstall.status
```

前端 `pack.status / storeStatus / hardwareStatus` 可以暂时作为 view model 字段，但不能作为真实数据库设计。

## 16. 测试要求

每个状态机都要有测试：

- 允许迁移。
- 禁止迁移。
- 前置条件不满足时失败。
- 跨实体联动。
- 下架后已安装内容继续使用。
- 下架后新购买 / 新下载 / 新设备同步失败。
- 发布更新不覆盖已锁定版本。

## 17. 已确认规则

```text
1. Work.status 只表示 H5 社区状态。
2. StoreListing.status 和 HardwarePack.status 独立。
3. StoreListing 代表商店申请/商品，HardwarePack 代表后台制作出的设备包。
4. Order、DeviceEntitlement、DeviceInstall 独立。
5. 购买权益按设备，不按账号。
6. HardwarePack 下架后，已安装设备内内容可以继续使用。
7. 下架后停止新购买、新下载和同步到新设备。
8. 前端综合状态只能派生，不能反向写回主实体状态。
9. 已上架或硬件化的 WorkVersion 不能直接覆盖。
```
