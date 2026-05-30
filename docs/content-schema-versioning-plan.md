# 内容格式与版本治理方案

本文件解决第 14 项问题：H5 内容越来越丰富后，如何避免硬件无法承接、旧作品无法播放、适配过程不可追踪。

## 结论

- H5 创作可以比硬件能力更丰富，H5 发布不被硬件能力限制。
- 硬件上架是独立流程，必须先生成兼容性报告，再由后台制作 `HardwarePack`。
- 转换失败不影响 H5 已发布状态，只影响硬件适配和商店上架。
- 官方适配后一定生成新的独立 `HardwarePack.id` 和 `HardwarePack.version`。
- H5 原始 `WorkVersion` 不被硬件适配过程修改，硬件包只引用它作为来源。

## 三种内容形态

```text
WorkDraft
用户编辑中的草稿，可反复修改，不保证稳定。

WorkVersion
发布后的 H5 快照，不可变，用于播放、审核、统计、推荐、硬件适配来源。

HardwarePack
后台制作出来的设备内容包，独立版本、独立审核、独立下载、独立设备授权。
```

`WorkVersion` 和 `HardwarePack` 不应该共用一个生命周期。前者回答“社区里能不能玩”，后者回答“某个设备能不能下载运行”。

## GuguH5Pack 版本

每个 H5 快照都必须声明格式版本。

```json
{
  "schemaVersion": "gugu_h5_pack_v1",
  "capabilities": [
    "scene_graph",
    "branching",
    "uploaded_assets",
    "basic_audio"
  ]
}
```

字段规则：

- `schemaVersion`：H5 内容结构版本，发布为 `WorkVersion` 后不可变。
- `capabilities`：该作品实际使用的能力，不是平台支持能力全集。
- `createdWithEditorVersion`：可选，记录创作器版本，方便定位兼容问题。
- `migrationFrom`：可选，记录从旧 schema 迁移而来。

## 能力集

H5 能力集用于描述作品用了什么能力。

```text
scene_graph
多场景和跳转。

branching
用户选择分支。

uploaded_assets
用户上传图片、音频或其他素材。

basic_audio
基础音频播放。

timed_events
定时事件。

variables
变量、计数、条件判断。

animation
动画效果。

network_asset
运行时依赖远程素材。

external_link
跳转外部链接。
```

MVP 中硬件可转换能力建议先收窄：

```text
scene_graph
branching
uploaded_assets
basic_audio
```

`timed_events`、`variables`、`animation` 可以先进入人工适配或降级适配，不直接自动转换。`network_asset`、`external_link` 默认不可进入硬件包。

## 硬件包版本

硬件包必须有独立格式版本。

```json
{
  "id": "hw_pack_123",
  "version": "1.0.0",
  "formatVersion": "hw_pack_v1",
  "sourceWorkVersionId": "work_version_123",
  "sourceSchemaVersion": "gugu_h5_pack_v1",
  "compatibilityReportId": "compat_report_123"
}
```

字段规则：

- `version`：同一个硬件包的业务版本。
- `formatVersion`：设备可读内容格式版本。
- `sourceWorkVersionId`：来源 H5 快照，必须固定到版本，不引用可变草稿。
- `sourceSchemaVersion`：来源 H5 的 schema 版本。
- `compatibilityReportId`：生成硬件包前的兼容性报告。

## 兼容性报告

硬件适配前必须输出 `CompatibilityReport`。

```json
{
  "id": "compat_report_123",
  "workVersionId": "work_version_123",
  "sourceSchemaVersion": "gugu_h5_pack_v1",
  "targetFormatVersion": "hw_pack_v1",
  "targetDeviceModels": ["Circle 185"],
  "level": "degrade_required",
  "unsupportedCapabilities": ["animation"],
  "degradeActions": ["remove_animation"],
  "blockingIssues": [],
  "estimatedResourceBudget": {
    "maxSizeKb": 512,
    "actualSizeKb": 430,
    "nodeCount": 26,
    "assetCount": 9
  }
}
```

兼容级别：

- `compatible`：可直接进入后台制作。
- `degrade_required`：可制作，但需要明确降级动作。
- `manual_adaptation_required`：需要运营或硬件编辑器人工处理。
- `incompatible`：当前设备格式不能承接，不能生成硬件包。

## 降级规则

允许降级，但必须记录并可追溯。

可接受降级：

- 压缩图片或音频。
- 裁剪超出设备屏幕的画面。
- 缩短超长文案。
- 降低场景数量或分支复杂度。
- 移除硬件不支持的动画。
- 将变量和条件逻辑改成固定路径。

不可静默降级：

- 删除关键剧情节点。
- 改变角色身份或 IP 归属。
- 改变用户签署过的权利声明范围。
- 把二创作品改成原创。
- 把原本需要审核的上传素材替换成未审核素材。

所有降级都应写入 `CompatibilityReport.degradeActions` 和后台制作记录。

## 迁移规则

旧 schema 内容不应该被原地改写。

```text
旧 WorkVersion
保留原始内容，用旧播放器或迁移播放器播放。

迁移后 WorkVersion
生成新的内容快照，记录 migrationFrom。

HardwarePack
只引用被实际适配的 WorkVersion。
```

迁移触发时机：

- 用户主动编辑旧作品并重新发布。
- 作品申请硬件上架，需要进入新适配链路。
- 旧播放器即将下线，需要批量生成迁移报告。

## API 草案

```text
POST /api/works/:workVersionId/compatibility-reports
生成指定设备型号下的兼容性报告。

GET /api/compatibility-reports/:id
查看兼容性报告。

POST /api/store-listings/:listingId/hardware-packs
基于兼容性报告创建后台制作任务。

GET /api/hardware-packs/:id
查看硬件包版本、下载状态和设备兼容信息。
```

## MVP 实施顺序

1. 在 `GuguH5Pack` 中增加 `schemaVersion` 和 `capabilities`。
2. 在 `HardwarePack` 中增加 `formatVersion`、`sourceWorkVersionId`、`sourceSchemaVersion`、`compatibilityReportId`。
3. 先做静态兼容检查：场景数、节点数、素材大小、能力集。
4. 后台制作前必须生成兼容性报告。
5. 上架审核页显示“可直接制作 / 需降级 / 需人工适配 / 不兼容”。
6. 后续再做自动迁移器和自动降级器。

## 需要避免的问题

- 不要用一个 `status` 同时表达 H5 发布、商店审核和硬件可下载。
- 不要让硬件适配修改原始 H5 作品。
- 不要让用户误以为 H5 发布成功就等于设备可用。
- 不要在没有兼容报告的情况下进入商店下载。
- 不要把 `schemaVersion` 和 `HardwarePack.version` 混在一起。
