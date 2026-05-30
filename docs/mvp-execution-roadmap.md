# MVP Execution Roadmap

这份文档把 01-16 的问题讨论收束成可执行路线图。

目标是先把 Gugu Flash 从“能演示的原型”推进到“产品逻辑不乱、关键规则可测试、后续能接真实后端”的 MVP。

## 1. MVP 范围

### MVP 要做

```text
H5 内容浏览
H5 互动播放
原创 / 二创创作
IP 池选择与申请
IP 内角色分身
发布到内容流
发布后审核与下架机制
商店上架申请
权利 / IP 风险承诺
后台制作 HardwarePack 的流程占位
按设备购买 / 领取
下载 / 同步状态
设备权益按设备隔离
P0 自动化测试
```

### MVP 暂不做

```text
真实多人共创
现金分成和提现
完整原生 App
完整小程序
真实 BLE 自动化全链路
复杂个性化推荐模型
完整 Hardware Studio
官方授权 IP 商务流程
```

共创当前暂停，只保留 Remix 和后续入口占位。

## 2. 当前原则

```text
1. Gugu Flash 是新主系统，不依赖废弃的 guguclub。
2. H5 发布、商店上架、硬件下载是三条独立生命周期。
3. 二创必须从 IP 池选 IP。
4. 分身属于 IP 内角色。
5. 有 IP 不等于有专区，专区达标后申请开通。
6. 商店卖 HardwarePack，不卖原始 H5。
7. 购买 / 领取按设备，不按账号全局生效。
8. 下架后已安装在设备内的内容继续可用，但停止新下载和新设备同步。
9. 用户前台不使用“硬件候选”等运营语言。
10. 测试优先保护版权、上架、设备权益和状态机。
```

## 3. 执行顺序

建议按这个顺序开工：

```text
P0-01 规则和测试底座
P0-02 IP 池、角色分身、创作入口纠偏
P0-03 发布 / 上架 / 硬件包状态拆分
P0-04 设备权益按设备隔离
P0-05 前台 UX 状态语言收敛
P0-06 浏览器关键路径测试
P1-01 后端实体和 API 骨架
P1-02 审核后台和商店后台
P1-03 IP 页和专区申请
P1-04 硬件包兼容报告和制作队列
P1-05 设备下架保留使用权
P1-06 设备同步失败处理和回滚
P1-07 订单支付和设备权益拆分
P1-08 退款和权益撤销
P1-09 收益冻结和结算预留
P1-10 举报投诉和申诉治理
P1-11 评论和拉黑基础治理
```

## 4. P0-01 规则和测试底座

状态：已完成第一版。

目的：

先把规则写成共享代码和测试，避免 UI 越改越漂。

主要文件：

```text
package.json
packages/core/src/gugu-h5-pack.js
packages/core/src/index.js
packages/api-client/src/mock-flash-api.js
data/seed-packs.json
scripts/check-content.mjs
```

要做：

- 增加 `schemaVersion`、`capabilities` 校验。
- 增加 H5 场景上限校验，MVP 按 30。
- 增加 store / hardware / device 状态常量。
- 增加派生展示状态 helper。
- 增加 Node `node:test` 单元测试。
- 增加 API facade 测试。
- `npm run test` 同时跑内容校验和单元测试。

验收：

```text
npm run check:content
npm run test
```

必须通过。

## 5. P0-02 IP 池、角色分身、创作入口纠偏

状态：已完成第一版。

目的：

把当前“二创填 IP 名称、全局选分身、创作时选专区”的原型改成新的产品规则。

主要文件：

```text
packages/core/src/gugu-h5-pack.js
packages/api-client/src/mock-flash-api.js
apps/web/src/app.js
apps/web/index.html
apps/web/src/styles.css
data/seed-packs.json
```

要做：

- 增加 mock IP 池数据。
- 原创默认进入“我的原创企划 / 平台原创 IP”。
- 二创必须从 IP 池选择，不再自由输入。
- 找不到 IP 时显示“申请添加 IP”入口。
- 角色分身列表跟随 IP。
- 创作页移除必选专区，改成题材标签或模板。
- 作品发布后如果 IP 有专区，再自动归入专区展示。

验收：

```text
原创可以直接生成草稿。
二创不选 IP 不能生成。
二创选 IP 后只展示该 IP 下角色。
创作页不再要求选择专区。
```

## 6. P0-03 发布 / 上架 / 硬件包状态拆分

状态：已完成第一版。

目的：

让用户和代码都不再把 H5、商店、硬件状态混在一个字段里。

主要文件：

```text
packages/core/src/gugu-h5-pack.js
packages/api-client/src/mock-flash-api.js
apps/web/src/app.js
data/seed-packs.json
```

要做：

- 原型里先保留兼容字段，但新增清晰的 mock 实体：
  - `work`
  - `workVersion`
  - `storeListing`
  - `hardwarePack`
- 申请上架进入 `StoreListing.rights_review`。
- 上架通过后进入 `production_queued / producing / pack_review / listed` 的模拟流程。
- `HardwarePack` 增加 `formatVersion`、`sourceWorkVersionId`、`compatibilityReportId`。
- 前台展示“已发布 / 上架审核中 / 制作设备包中 / 可下载到设备”。

验收：

```text
发布 H5 后商店状态仍是未申请。
申请上架必须勾选承诺。
上架中能看到进度。
商店只展示 listed + available 的 HardwarePack。
```

## 7. P0-04 设备权益按设备隔离

状态：已完成第一版。

目的：

修正当前 mock store 里“拥有状态像账号全局”的问题，改成设备维度。同时按最新规则：**一个设备就是一个分身**，用户选择哪个设备，就自动选择哪个分身；商店和设备页看到的是这个分身下的内容。

主要文件：

```text
packages/api-client/src/mock-flash-api.js
apps/web/src/app.js
apps/web/src/styles.css
```

要做：

- 增加 mock `DeviceEntitlement`。
- 增加 mock `DeviceInstall`。
- 给每台设备绑定 `personaId`。
- 切换设备时自动切换当前分身。
- 商店内容按当前设备分身过滤。
- 购买 / 领取写入 `deviceId + hardwarePackId`。
- 切换设备后重新计算拥有、下载、同步状态。
- 下架但已安装时显示“已装本设备，可继续使用”。
- 下架且未安装时禁止新下载。

验收：

```text
设备 A 领取后，设备 B 不自动拥有。
切换到设备 B 后，当前分身自动变成设备 B 的分身。
商店只展示当前设备分身下的内容包。
设备 A 已安装内容下架后仍可见可用。
设备 B 不能新下载已下架内容。
```

## 8. P0-05 前台 UX 状态语言收敛

状态：已完成第一版。

目的：

把原型里的运营语言换成用户能理解的语言。

主要文件：

```text
apps/web/index.html
apps/web/src/app.js
apps/web/src/styles.css
packages/core/src/gugu-h5-pack.js
```

要做：

- 前台隐藏“硬件候选”。
- 我的作品页增加状态进度：
  - H5 发布状态
  - 商店申请状态
  - 设备包制作状态
- 商店按钮改成：
  - 给这台设备领取
  - 给这台设备购买
  - 下载到手机
  - 同步到这台设备
  - 已装到这台设备
- 增加轻引导和空状态。
- Feed、我的作品、商店和吧唧页已改成用户侧状态文案；“硬件候选”等词只保留在内部状态机和运营台。

验收：

```text
新用户能区分发布、上架、设备可下载。
商店首屏明确当前目标设备。
我的作品页能解释每个作品下一步能做什么。
```

## 9. P0-06 浏览器关键路径测试

状态：已完成第一版。

目的：

把最容易回归的主流程固定下来。

主要文件：

```text
tests/e2e/*.spec.js
playwright.config.*
package.json
```

要做：

- 原创发布流程。
- 二创 IP 拦截流程。
- 申请上架条款流程。
- 运营批准上架流程。
- 商店领取 / 下载 / 同步流程。
- 已新增 Playwright e2e，覆盖原创发布、二创 IP 拦截、上架推进、当前设备分身下的商店购买 / 下载 / 同步。
- e2e 发现并修复了“同步新内容后设备仍显示旧内容”的问题；同步新包后会成为当前运行内容。

验收：

```text
npm run test:e2e
```

本地和 release 前通过。稳定后再加入 PR 必跑。

## 10. P1-01 后端实体和 API 骨架

状态：已完成第一版。

目的：

把 mock facade 后面的实体结构落到真实 Gugu Flash 后端设计。

要做：

- User / Session。
- Work / WorkVersion。
- IPEntry / Persona / IPZone。
- Asset / Upload。
- ReviewTask。
- StoreListing。
- CompatibilityReport。
- HardwarePack。
- Order。
- Device / DeviceEntitlement / DeviceInstall。
- Interaction / Comment / Report。
- 已在 `packages/core` 增加共享实体 schema、状态常量和校验 helper。
- 已在 `packages/api-client` 增加 `/flash/**` API route contract，并把现有 mock facade 方法映射到未来真实后端路由。
- 已补测试保护：实体覆盖、设备权益按设备、HardwarePack 绑定固定 WorkVersion、mock 方法路由覆盖。

验收：

```text
Native / Web / 小程序未来可以共用同一套 API。
旧 guguclub 不作为运行依赖。
mock API 方法能一一映射到真实后端路由。
```

## 11. P1-02 审核后台和商店后台

状态：已完成第一版。

目的：

把“官方台”从演示按钮变成真实运营视角。

要做：

- 审核队列。
- 审核理由。
- 驳回 / 下架 / 复审。
- 权利投诉。
- 商店申请处理。
- 硬件包制作进度。
- 操作日志。
- 已新增运营台 dashboard：审核队列、商店上架队列、硬件制作队列和操作日志分栏。
- 已新增 mock `ReviewTask` 和 `OperationLog`：审核通过 / 驳回会记录理由、目标实体、操作人和时间。
- 已保持原则：`ReviewTask` 记录审核过程，真正状态仍迁移 `StoreListing` / `HardwarePack`。

验收：

```text
每个审核动作都有操作人、理由、证据和时间。
ReviewTask 不替代目标实体状态。
审核通过或拒绝后，由服务迁移对应实体状态。
```

## 12. P1-03 IP 页和专区申请

状态：已完成第一版。

目的：

让 IP 池、分身和专区变成用户可理解的社区结构。

要做：

- IP 池列表和搜索。
- IP 详情页。
- IP 内角色分身。
- 申请添加 IP。
- 达标后申请开通专区。
- 邀请创始成员。
- 申请者通过后成为 `zone_admin`。
- 已新增专区主屏：IP 池列表、搜索、IP 详情、角色分身、开区资格、专区硬件内容。
- 已新增 mock API：`getIpPool`、`getIpDetail`、`getIpZoneEligibility`、`applyZoneApplication`、`applyIpEntry`。
- 已把“IP 入池不等于开专区”写入可测试规则；只有达标且未开区 IP 才显示申请开通专区。

验收：

```text
IP 可以存在但没有专区。
只有达标 IP 才显示申请开通专区。
专区商店 / 硬件展示 HardwarePack，不展示原始 H5 当商品。
```

## 13. P1-04 硬件包兼容报告和制作队列

状态：已完成第一版。

目的：

把“后台制作 HardwarePack”从口头规则变成可追踪流程。

要做：

- `CompatibilityReport`。
- H5 capability 检查。
- 硬件可转换能力集。
- 制作队列。
- 降级记录。
- HardwarePack 版本。
- 下载 checksum。

验收：

```text
H5 可以发布但不一定可硬件化。
硬件适配前必须有兼容报告。
降级动作必须记录。
HardwarePack 独立版本，不改写 WorkVersion。
```

本轮落地：

- 新增 `gugu-hardware-compat` 核心规则：设备能力集、资源预算、兼容级别、降级动作、checksum。
- mock API 在进入 `production_queued` 后生成 `CompatibilityReport`，再派生独立 `HardwarePack`。
- `network_asset` / `external_link` 等不兼容能力不影响 H5 发布，但会阻断硬件制作推进。
- 运营台硬件制作队列展示报告、资源、节点、版本、checksum 和降级记录。
- 单元测试覆盖：可直接制作、需降级制作、不兼容阻断、HardwarePack 固定 WorkVersion。

## 14. P1-05 设备下架保留使用权

状态：已完成第一版。

目的：

把“下架后已安装设备继续使用，但停止新购买 / 新下载 / 新同步”落到设备权益和商店列表。

要做：

- 商店 catalog 保留已下架硬件包的历史对象，但默认只对有购买或安装历史的设备可见。
- `purchaseBadgePack`、`downloadBadgePack`、`syncBadgePack` 都校验 `HardwarePack.available + StoreListing.listed`。
- 已安装设备继续显示当前运行内容。
- 未安装设备无法新购买、下载或同步已下架内容。
- 运营台支持对已上架内容执行下架。

验收：

```text
设备 A 已安装内容下架后仍可见可用。
设备 B 无安装历史时看不到下架内容，且不能通过接口新购买。
设备 B 已下载但未安装时，下架后不能再同步。
下架会把 StoreListing 置为 delisted，HardwarePack 置为 removed。
```

本轮落地：

- mock API 增加 `delistStoreListing()`。
- store catalog 拆出 `availableForNewUse` 和 `availabilityReason`。
- 设备库只展示“可新增使用”或“当前设备有历史”的内容。
- 设备页和商店页显示“已下架仍可用 / 已下架，无法下载 / 无法同步”。
- 单元测试覆盖已安装保留、未安装阻断、下载未安装后下架阻断同步。

## 15. P1-06 设备同步失败处理和回滚

状态：已完成第一版。

目的：

把设备同步从“点按钮即成功”升级为可诊断、可重试、可回滚的链路。

要做：

- 增加 `DeviceSyncJob`。
- 同步前校验设备电量、型号、固件、空间、权益、内容包状态和 checksum。
- 同步失败要记录 `failureReason`、`diagnosticCode`、最后步骤和设备上下文。
- 写入失败时保留或恢复原运行内容。
- 前端展示失败原因、诊断码和重试入口。

验收：

```text
同步失败后不会误把新包标记为运行中。
有原运行内容时，失败后仍运行原内容。
失败记录有明确原因和诊断码。
下载前同步、低电量、下架包同步都会被阻断。
失败后可重试，重试成功后才切换当前运行内容。
```

本轮落地：

- mock API 增加 `DeviceSyncJob` 记录和 `getDeviceSyncJobs()`。
- `syncBadgePack()` 支持预检阻断、失败诊断、写入失败回滚、重试成功。
- 设备数据补充 `firmwareVersion`、`availableStorageKb`、电量门槛。
- 商店页失败状态显示“同步失败，原内容已保留”、失败原因和诊断码，按钮切换为“重试同步”。
- 设备页展示最近同步失败摘要。
- 单元测试覆盖同步前置步骤、低电量阻断、写入失败回滚、重试成功。

## 16. P1-07 订单支付和设备权益拆分

状态：已完成第一版。

目的：

把“购买 / 领取按钮直接给权益”拆成 `Order -> paid -> DeviceEntitlement`，免费内容也生成 0 元订单，方便后续接支付、退款和审计。

要做：

- 增加 mock `Order` 缓存。
- 付费包先创建 `pending_payment` 订单，再模拟支付成 `paid`。
- 免费领取创建金额为 0 的 `paid` 订单。
- 只有 `Order.paid` 才生成 `DeviceEntitlement.active`。
- `DeviceEntitlement` 记录 `orderId`，仍然按 `deviceId + hardwarePackId` 生效。
- 商店页展示订单号，用户仍保持一键购买 / 领取体验。

验收：

```text
免费领取也有 Order，amount = 0。
付费购买有 Order，amount > 0。
Order paid 后才有 DeviceEntitlement。
同一内容在另一台设备需要重新生成 Order 和 DeviceEntitlement。
重复购买已有设备权益时不重复生成新订单。
```

本轮落地：

- mock API 增加 `createOrder()`、`payOrder()`、`getOrders()`。
- `purchaseBadgePack()` 保持兼容，但内部改为订单和支付流程。
- 初始已拥有内容也生成 bootstrap 订单，便于审计。
- API contract 增加 `orders.list`，并映射订单方法。
- 商店内容展示 `orderId`，已拥有文案区分“本设备已购买 / 已领取”。
- 单元测试覆盖付费订单、免费 0 元订单、权益关联 `orderId`、重复购买幂等。

## 17. P1-08 退款和权益撤销

状态：已完成第一版。

目的：

把用户主动退款和版权下架分开处理：退款走 `Order.refunded` 和 `DeviceEntitlement.revoked`，不改变商店上架状态；已安装内容按退款策略决定保留或移除。

要做：

- 增加 mock `refundOrder()`。
- `Order.paid -> refunded`。
- 关联的 `DeviceEntitlement.active -> revoked`。
- 新下载 / 新同步必须被撤销权益阻断。
- 已安装内容支持两种策略：
  - `keep_installed`：设备内继续可用，但权益已撤销。
  - `remove_from_device`：设备安装记录移除，当前运行内容清空。
- 操作日志记录退款原因和已安装处理策略。

验收：

```text
未下载退款后不能下载或同步。
已安装退款保留时，设备仍显示当前运行内容，但权益状态为 revoked。
已安装退款移除时，设备当前运行内容清空。
退款不等于版权下架，StoreListing 和 HardwarePack 不被改成 delisted/removed。
退款后重新购买会生成新的 Order 和新的 active entitlement。
```

本轮落地：

- mock API 增加 `refundOrder()`。
- `DeviceEntitlement` 增加撤销原因、撤销时间和退款处理策略。
- 商店状态文案增加“已退款，设备内仍可使用 / 已退款，权益已撤销”。
- 单元测试覆盖未安装退款撤权、已安装退款保留、已安装退款移除、退款后重新购买。

## 18. P1-09 收益冻结和结算预留

状态：已完成第一版。

目的：

MVP 不开放创作者现金分成，但先把订单结算占位、退款扣回和权利争议冻结记录建起来，避免后续支付、风控、版权投诉没有财务状态承接。

要做：

- 新增 `Settlement` 实体。
- 订单支付后生成结算占位：
  - 付费订单为 `pending`。
  - 免费领取为 `no_cash`。
- 退款后 `Settlement.status = refunded`。
- 权利争议 / 下架触发 `Settlement.status = frozen`。
- 运营台展示结算冻结记录，并支持释放冻结。
- 冻结商店内容时，`StoreListing.status = frozen`，`HardwarePack.status = paused`。

验收：

```text
付费购买后有 pending settlement。
免费领取后有 no_cash settlement。
退款后 settlement 变 refunded。
权利争议冻结后 StoreListing frozen、HardwarePack paused、相关 settlement frozen。
释放冻结后 settlement 回到 pending / no_cash。
```

本轮落地：

- core domain 增加 `Settlement` 类型和状态。
- mock API 增加 `getSettlements()`、`releaseSettlement()`、`freezeStoreListing()`。
- `createOrder/payOrder/refundOrder/delistStoreListing` 接入结算记录。
- 运营台新增“结算冻结”区和冻结计数。
- 商店上架队列新增“冻结”操作。
- 单元测试覆盖订单结算、退款结算、权利冻结和释放冻结。

## 19. P1-10 举报投诉和申诉治理

状态：已完成第一版。

目的：

把普通用户举报、权利人投诉、创作者申诉串成一个平台治理闭环。二创内容可以先发后审，但被举报或被权利投诉后，需要有先行处置、下架/冻结、申诉恢复和内部记录。

要做：

- 新增 `RightsClaim`、`Appeal`、`ModerationAction` 实体。
- 普通举报先进入 `Report.submitted`，运营可限流或驳回。
- 权利投诉可先冻结商店和硬件下载，同时冻结关联结算记录。
- 创作者可以提交申诉，申诉通过后恢复内容、商店、硬件包和结算状态。
- 运营台新增举报 / 权利投诉 / 申诉工单。
- H5 互动完成页提供举报入口。
- 操作日志和治理动作保留内部记录，后续可接通知中心。

验收：

```text
用户举报后，运营台出现治理工单。
运营处理举报后，生成 ModerationAction，并可把内容改为 public_limited。
权利投诉默认先冻结 StoreListing、HardwarePack 和相关 Settlement。
申诉通过后，StoreListing 恢复 listed，HardwarePack 恢复 available，Settlement 回到 pending / no_cash。
驳回举报、维持处置、恢复处置都有操作日志可追踪。
```

本轮落地：

- core domain 增加 `RightsClaim`、`Appeal`、`ModerationAction` 类型和状态。
- API contract 增加用户端举报、投诉、申诉接口，以及运营端列表和处理接口。
- mock API 增加 `submitReport()`、`resolveReport()`、`submitRightsClaim()`、`resolveRightsClaim()`、`submitAppeal()`、`resolveAppeal()`、`getModerationActions()`。
- 运营台新增“举报投诉”区和治理工单计数。
- 互动完成页新增“举报”按钮。
- 单元测试覆盖举报限流、权利投诉冻结、申诉恢复。

## 20. P1-11 评论和拉黑基础治理

状态：已完成第一版。

目的：

把“评论计数”推进到真实评论能力，但不扩大到私信、关系绑定或复杂社区玩法。MVP 评论开放的前提是必须带举报、隐藏、删除、拉黑和审核记录。

要做：

- 扩展 `Comment` 状态：
  - `visible`
  - `hidden_by_author`
  - `hidden_by_platform`
  - `pending_review`
  - `deleted_by_user`
  - `removed`
- 新增 `BlockRelation`。
- 评论只支持文本，不开放图片、音频和外链。
- 外链、联系方式、辱骂等风险评论进入复核。
- 用户可举报评论，评论举报进入运营治理工单。
- 作者可以隐藏自己作品下的评论，并留下 `ModerationAction`。
- 用户可以删除自己的评论。
- 用户可以拉黑评论作者；被拉黑用户评论从我的视角隐藏。
- 被我拉黑的用户不能继续评论我的作品。

验收：

```text
点击评论进入评论页，而不是只增加评论计数。
发布正常评论后可见评论数增加。
风险评论进入 pending_review。
举报评论后，评论进入复核，运营台出现 Comment 治理工单。
运营处理评论举报后，评论被平台隐藏并生成 ModerationAction。
作者隐藏评论后，评论不可见并生成治理记录。
拉黑评论作者后，TA 的评论从我的视角消失。
被拉黑用户不能继续评论我的作品。
```

本轮落地：

- core domain 扩展 `Comment` 状态，增加 `BlockRelation`。
- API contract 增加评论列表、发评论、删评论、隐藏评论、评论举报、拉黑/解除拉黑接口。
- mock API 增加评论、拉黑、评论举报、评论隐藏和风险评论复核逻辑。
- 前端新增评论页，替换原先“点评论只加计数”的行为。
- 运营台可处理评论举报，处理后生成 `ModerationAction`。
- 单元测试覆盖评论举报、平台隐藏、拉黑隐藏和阻断继续评论。

## 21. 建议立即开始的第一刀

第一刀建议做 **P0-01 规则和测试底座**。

原因：

- 风险最低，不会大改 UI。
- 能马上把已确认规则写进代码。
- 后面改创作页、商店、设备权益时有测试保护。
- 当前项目已经有 `check-content`，可以自然扩展。

第一刀任务清单：

```text
1. package.json 增加 test / test:unit / test:content。已完成。
2. validatePack 增加 schemaVersion、capabilities、场景上限。已完成。
3. seed-packs 增加 schemaVersion 和 capabilities。已完成。
4. 增加 core 单元测试：原创、二创、remix、validatePack。已完成。
5. 增加 mock API 测试：申请上架条款、二创上架限制、下载同步前置条件。已完成。
6. 保持 npm run check:content 通过。已完成。
7. 确认 npm run test 通过。已完成。
```

## 15. 对应文档

- [Product Issues Plan](/Users/xulei/projects/gugu-flash/docs/product-issues-plan.md)
- [Review Workflow Plan](/Users/xulei/projects/gugu-flash/docs/review-workflow-plan.md)
- [IP Rights Policy Plan](/Users/xulei/projects/gugu-flash/docs/ip-rights-policy-plan.md)
- [Store And Hardware Pack Boundary Plan](/Users/xulei/projects/gugu-flash/docs/store-hardware-boundary-plan.md)
- [IP Pool Persona Solution](/Users/xulei/projects/gugu-flash/docs/ip-pool-persona-solution.md)
- [IP Zone Community Plan](/Users/xulei/projects/gugu-flash/docs/ip-zone-community-plan.md)
- [Creator Editor Plan](/Users/xulei/projects/gugu-flash/docs/creator-editor-plan.md)
- [Backend Entity And API Plan](/Users/xulei/projects/gugu-flash/docs/backend-entity-api-plan.md)
- [State Machine Plan](/Users/xulei/projects/gugu-flash/docs/state-machine-plan.md)
- [Recommendation Metrics Plan](/Users/xulei/projects/gugu-flash/docs/recommendation-metrics-plan.md)
- [Monetization Plan](/Users/xulei/projects/gugu-flash/docs/monetization-plan.md)
- [Device Sync Plan](/Users/xulei/projects/gugu-flash/docs/device-sync-plan.md)
- [Content Schema Versioning Plan](/Users/xulei/projects/gugu-flash/docs/content-schema-versioning-plan.md)
- [UX Flow Plan](/Users/xulei/projects/gugu-flash/docs/ux-flow-plan.md)
- [Testing Plan](/Users/xulei/projects/gugu-flash/docs/testing-plan.md)
