# Legacy GuguClub Reference Plan

这份文档原本是 `Integration With Existing GuguClub Projects`。现在前提已经改变：

```text
guguclub 已废弃。
Gugu Flash 是替代 guguclub 的全新项目。
```

所以本文件不再定义“集成 guguclub”，而是定义：**旧 guguclub 哪些经验、数据或工具可以迁移到 Gugu Flash，哪些不能继续依赖。**

## 1. 新边界

Gugu Flash 是新的主系统，自己负责：

- 账号。
- 用户资料。
- 设备绑定。
- BLE / 同步。
- 支付订单。
- 硬件内容下载。
- 社区和内容。
- 审核和商店。

旧 guguclub 不作为线上依赖。

## 2. 可参考资产

### 旧 guguclub

可以参考：

- 设备绑定流程。
- 设备身份字段，例如 `deviceIdHex`。
- BLE 同步经验。
- 设备型号和固件约束。
- 历史内容下载流程。
- 社交关系和 IM 的旧设计经验。
- 可迁移的用户 / 设备历史数据，若业务需要。

不能继续依赖：

- 旧登录和 token。
- 旧用户中心。
- 旧设备 API。
- 旧支付 API。
- 旧内容下载 API。
- 旧小程序作为产品中心。

### 旧 guguclub-ui

可以参考或迁移：

- `StoryPack` 模型经验。
- LVGL / 设备预览经验。
- 设备 bundle / codegen 脚本。
- 图片 AI 和硬件素材处理经验。

建议迁移为新的：

```text
Gugu Flash Hardware Studio
```

它是 Gugu Flash 的官方硬件制作工具，不再作为旧项目的外部依赖。

## 3. 内容边界

不要让 `GuguH5Pack` 等于设备 `story.json`。

```text
GuguH5Pack
  面向社交消费、H5 播放、UGC 快速迭代。

HardwarePack
  面向设备下载、官方制作、设备兼容、固件约束。
```

普通用户不能直接生成设备代码。

## 4. 新推荐链路

```text
用户在 Gugu Flash 创作
  -> 保存 WorkDraft
  -> 发布 WorkVersion
  -> Feed 分发和互动
  -> 用户申请上架
  -> StoreListing 审核
  -> 官方进入 Hardware Studio 制作
  -> 生成 HardwarePack
  -> 设备兼容审核
  -> Gugu Flash 商店可下载
  -> 按设备购买/领取
  -> Gugu Flash 设备同步
```

## 5. 客户端策略

不要让小程序成为产品中心。

共用产品路由：

```text
feed
player
create
work-detail
my-works
official-picks
notifications
profile
device-install
```

客户端外壳：

```text
apps/native
  iOS / Android 主客户端，负责日常使用、推送、上传、设备能力、深链。

apps/web
  公开 H5 播放、分享页、活动页、轻量创作预览。

apps/miniprogram
  微信分发、轻量浏览、登录桥、设备桥。

apps/operator
  审核、商店、硬件候选、Hardware Studio 工作台。
```

所有客户端都调用 Gugu Flash API。

## 6. 迁移建议

如果需要从旧 guguclub 迁移数据，建议做一次性脚本，不做长期运行依赖。

可迁移：

- 用户基础资料，需重新确认登录绑定。
- 设备绑定记录，需用户重新验证。
- 历史设备型号。
- 可用内容包，需重新生成 HardwarePack 记录。
- 硬件制作脚本，迁移进新 Hardware Studio。

不迁移：

- 废弃登录态。
- 无法确认归属的设备。
- 无权利来源的旧内容。
- 无法适配新格式的旧包。

## 7. 第一批新后端接口

Gugu Flash 第一批真实接口应从新系统开始：

```text
POST /flash/auth/login
GET  /flash/me
GET  /flash/feed
POST /flash/drafts
POST /flash/drafts/:id/publish
POST /flash/assets
POST /flash/store-listings
GET  /flash/devices
POST /flash/devices/bind
POST /flash/orders
POST /flash/hardware-packs/:id/sync
```

硬件制作工具接口：

```text
POST /flash/operator/hardware-packs
POST /flash/operator/hardware-packs/:id/export-to-hardware-studio
POST /flash/operator/hardware-packs/:id/publish
```

## 8. 已确认

```text
1. guguclub 已废弃。
2. Gugu Flash 是替代它的全新项目。
3. 旧 guguclub 只作为参考和迁移来源。
4. Gugu Flash 自建账号、设备、支付、下载和后端能力。
5. 旧 guguclub-ui 的有用能力应迁移为 Gugu Flash Hardware Studio。
```
