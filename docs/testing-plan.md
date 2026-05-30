# Testing Plan

这份文档展开 `16. 测试与质量保障缺失`。

当前项目已经有 `npm run check:content`，能检查 seed 内容的基础结构。接下来测试目标不是追求大而全，而是保护会造成产品逻辑错乱的关键规则。

## 1. 核心结论

```text
1. MVP 先用 Node.js 自带 node:test 做单元测试和契约测试。
2. 浏览器关键流程用 Playwright 做少量端到端测试。
3. CI 必跑内容校验、核心单元测试、状态机测试和 API facade 测试。
4. 浏览器测试先跑 P0 smoke，稳定后再作为 PR 必跑。
5. 原型阶段不做大面积视觉快照，不追求 100% 覆盖率。
6. 版权、IP、上架、硬件包、按设备购买、下架保留使用权必须有回归测试。
```

一句话：

```text
不为每个按钮写测试，但所有会让用户权益、版权风险和设备状态出错的规则都要被测试钉住。
```

## 2. 推荐测试工具

### Node.js `node:test`

用于：

- `packages/core`
- `packages/api-client`
- 状态机纯函数
- schema 校验
- seed data 校验

原因：

- 当前项目没有测试依赖。
- 项目是 ESM，Node 自带测试可以直接使用。
- 原型阶段维护成本最低。

建议脚本：

```json
{
  "scripts": {
    "test": "npm run check:content && npm run test:unit",
    "test:unit": "node --test",
    "test:content": "node scripts/check-content.mjs"
  }
}
```

### Playwright

用于真实浏览器流程：

- 原创发布。
- 二创未选 IP 拦截。
- 申请上架时条款未勾选不能提交。
- 后台批准上架。
- 商店领取 / 购买、下载、同步到当前设备。
- 切换设备后权益不自动复用。

建议脚本：

```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

MVP 早期可以先本地和 release 前跑，等流程稳定后再纳入 CI 必跑。

## 3. 测试分层

```text
内容校验
  数据结构、scene graph、schemaVersion、capabilities。

单元测试
  纯函数、标签、分数、草稿生成、二创复制、状态转换。

API facade 测试
  mock API 的发布、上架、审核、购买、下载、同步链路。

状态机测试
  Work、WorkVersion、StoreListing、HardwarePack、Order、DeviceEntitlement、DeviceInstall。

浏览器流程测试
  用户真实点击路径和关键按钮状态。

人工验收
  视觉质量、文案理解、设备真机同步、审核后台操作体验。
```

## 4. P0 必测规则

### 内容 schema

- `GuguH5Pack` 必须有 `id`、`title`、`entrySceneId`、`scenes`。
- `entrySceneId` 必须存在于 scenes。
- action 的 `goto` 必须指向存在的 scene。
- `contentOrigin` 只能是 `original` 或 `fanwork`。
- `fanwork` 必须有 IP。
- `schemaVersion` 必须存在。
- `capabilities` 必须是数组。
- H5 场景数量 MVP 不超过 30，超过时要有明确校验或降级提示。

### 创作与发布

- 默认创作为原创。
- 二创未选 IP 不能生成 / 发布。
- 发布 H5 不会自动进入商店。
- 发布后修改生成新 `WorkVersion`，不能覆盖已被商店或硬件引用的版本。

### IP、分身、专区

- 二创只能选择 IP 池里的 IP。
- 用户可以申请添加 IP。
- 分身必须属于某个 IP。
- 创作时不直接选择专区。
- 有 IP 不等于有专区。
- 专区开通必须满足门槛并由用户申请。
- 申请者通过后成为 `zone_admin`。

### 商店和硬件

- 申请上架必须勾选权利 / 授权风险承诺。
- 原创和二创都可以申请上架。
- 二创商业化审核更严格。
- 上架通过后进入后台制作 `HardwarePack`。
- `HardwarePack` 必须引用固定 `sourceWorkVersionId`。
- `HardwarePack` 必须有 `formatVersion` 和 `compatibilityReportId`。
- H5 发布成功不等于设备可下载。

### 设备权益

- 购买 / 领取权益按设备，不按账号。
- 同一账号多台设备需要分别购买 / 领取。
- `HardwarePack.available` 且 `DeviceEntitlement.active` 才能新下载。
- 已下载未同步时按钮显示“同步到这台设备”。
- 已安装到设备内的内容下架后可以继续使用。
- 下架后停止新购买、新下载、新设备同步。

### 安全与治理

- 普通二创可以先发后审。
- 被投诉或高风险 IP 可以暂停推荐、商店和硬件。
- 评论必须能举报、删除、隐藏、拉黑或限流。
- 未成年人默认更严格保护。
- 共创已暂停，不应作为 MVP 必经流程。

## 5. API facade 测试用例

`packages/api-client` 当前是原型 facade，但它承载了很多产品规则，应该先测。

建议用例：

```text
createDraft(original)
  返回原创 H5，storeStatus = not_applied，hardwareStatus = h5_only。

createDraft(fanwork without ip)
  前端应拦截；API 层也应保留校验。

publishDraft
  新作品进入 feed 顶部，不自动 listed。

applyStoreListing without terms
  返回 accepted=false，不改变 storeStatus。

applyStoreListing with terms
  storeStatus -> rights_review，记录 rightsAcknowledgedAt。

approveStoreListing
  storeStatus -> listed，商店库刷新后可见。

markHardwareReady fanwork before listed
  blocked=true，reason=fanwork_requires_store_review。

purchaseBadgePack
  只影响当前设备权益，不能自动给所有设备。

downloadBadgePack without ownership
  不允许下载。

syncBadgePack before download
  不允许同步。
```

## 6. 状态机测试用例

状态机测试应该独立于 UI。

### Work

- `draft -> publish_submitted -> public_limited`
- `public_limited -> public`
- `public -> taken_down`
- 禁止 `draft -> StoreListing.listed`
- 禁止 `taken_down -> HardwarePack.available`

### WorkVersion

- 发布创建新版本。
- 发布更新创建新版本。
- 被 StoreListing 或 HardwarePack 引用后进入 `locked`。
- `locked` 版本不能被覆盖。

### StoreListing

- `not_applied -> submitted -> rights_review`
- `rights_review -> production_queued`
- `production_queued -> producing -> pack_review -> listed`
- `listed -> delisted / frozen`
- 被拒后可以重新提交，但必须保留历史审核记录。

### HardwarePack

- `draft -> building -> reviewing -> ready -> available`
- `available -> paused / removed`
- `removed` 后不允许新下载。
- `available` 必须有 checksum、formatVersion、sourceWorkVersionId。

### DeviceEntitlement / DeviceInstall

- 设备 A 购买不代表设备 B 拥有。
- 设备权益 active 后才能下载。
- 下载后才能同步。
- 同步成功后 DeviceInstall = installed。
- 下架后已 installed 继续可用。

## 7. 浏览器流程测试

P0 浏览器测试只保留少量关键路径。

```text
流程 1：原创发布
  打开创作
  默认原创
  输入主题
  生成草稿
  发布到内容流
  我的作品出现该作品
  商店状态仍为未申请上架

流程 2：二创 IP 拦截
  切到二创
  不填写 / 不选择 IP
  点击生成或发布
  页面展示错误，不能发布

流程 3：申请上架
  我的作品
  点击申请上架
  不勾选条款时提交按钮 disabled
  勾选后可提交
  状态变为上架审核中

流程 4：运营批准
  进入运营台
  批准上架
  商店中出现内容包

流程 5：设备商店
  打开商店
  确认当前设备
  领取 / 购买
  下载
  同步
  吧唧页显示当前运行内容
```

P1 再增加：

- 切换设备后同一个内容需要重新领取 / 购买。
- 下架后已安装设备仍显示可用，但商店不能新下载。
- 发布更新不影响已上架的旧硬件包。
- IP 页达标后显示申请开通专区。

## 8. CI 策略

### MVP 立即必跑

```text
npm run check:content
npm run test:unit
```

覆盖：

- 内容 schema。
- 核心纯函数。
- API facade。
- 状态机。

### Release 前必跑

```text
npm run test:e2e
```

覆盖：

- 原创发布。
- 二创 IP 拦截。
- 申请上架。
- 批准上架。
- 商店下载同步。

### 后续 PR 必跑

当浏览器测试稳定后，再把 P0 Playwright 流程纳入 PR 必跑。

不建议一开始让所有浏览器测试必跑，原型 UI 变化太快，会让测试维护成本过高。

## 9. 测试数据策略

需要三类固定 fixture。

```text
seed-public.json
  已发布 H5，包含原创和二创。

seed-store.json
  已上架、审核中、下架的 StoreListing / HardwarePack。

seed-device.json
  多设备、不同权益、不同安装状态。
```

每个 fixture 都要覆盖：

- 原创。
- 二创。
- 有 IP 无专区。
- 有 IP 且有专区。
- 已上架。
- 下架但已安装。
- 设备 A 有权益、设备 B 无权益。

## 10. 测试命名建议

```text
packages/core/src/*.test.js
packages/api-client/src/*.test.js
packages/state-machine/src/*.test.js
tests/e2e/*.spec.js
tests/fixtures/*.json
```

如果暂时没有独立 `state-machine` 包，可以先放在 `packages/core/src/state-machine.test.js`，后续再拆。

## 11. 不建议 MVP 测的内容

- 大面积 CSS 视觉快照。
- 所有动画细节。
- 每个空状态文案逐字断言。
- 后台复杂报表。
- 尚未进入 MVP 的共创完整流程。
- 真机 BLE 自动化全覆盖。

这些可以人工验收或后续专项测试。

## 12. 质量门槛

进入内测前建议满足：

```text
内容 seed 100% 通过校验。
核心规则单元测试通过。
P0 浏览器流程通过。
发布 / 上架 / 下载 / 同步链路有失败提示。
已知不能自动化的真机同步流程有人工验收表。
```

进入公开测试前建议满足：

```text
状态机测试覆盖所有允许和禁止迁移。
设备权益按设备隔离有自动化测试。
下架后已安装继续可用有自动化测试。
二创 IP 和权利承诺有自动化测试。
P0 Playwright 纳入 CI。
```

## 13. 已确认决策

1. 先用 Node.js 自带 `node:test` 做单元测试和契约测试。
2. Playwright 用于浏览器关键路径，不一开始覆盖所有 UI。
3. CI 初期必跑内容校验、核心单元、状态机、API facade。
4. 浏览器测试先作为 release 前必跑，稳定后进入 PR 必跑。
5. 原型阶段接受低到中等测试成本，但版权、上架、设备权益和下架规则必须自动化。
