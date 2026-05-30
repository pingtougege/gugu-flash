# Device Sync Plan

这份文档展开 `13. 设备同步链路仍是原型`。

Gugu Flash 是替代 guguclub 的新主系统，所以设备绑定、BLE / 同步、下载、安装状态、失败恢复都应该由 Gugu Flash 自建。旧项目的设备协议和 BLE 经验只作为参考。

## 1. 建议结论

建议先按这套定：

```text
1. Gugu Flash 自建设备绑定、BLE/同步、下载、安装状态和设备能力检测。
2. 已安装到设备内的 HardwarePack 允许离线使用。
3. 新购买、新下载、新同步必须在线校验设备权益、包状态和设备兼容性。
4. 购买权益继续按设备，不按账号。
5. 旧设备绑定记录不静默迁移；如需迁移，必须用户重新验证设备。
6. 同步失败必须给出明确原因、重试入口、回滚策略和客服诊断码。
7. HardwarePack 下架后，已安装设备内内容继续使用；停止新购买、新下载和新设备同步。
```

一句话：

```text
离线使用保护体验，在线同步保护权益和安全。
```

## 2. 核心链路

```text
绑定设备
  -> 读取设备能力
  -> 选择 HardwarePack
  -> 检查设备权益 DeviceEntitlement
  -> 检查 HardwarePack 状态
  -> 检查设备兼容性
  -> 下载 HardwarePack 到客户端
  -> 校验 checksum
  -> 通过 BLE / 设备通道同步
  -> 设备写入和激活
  -> 回读当前运行内容
  -> 记录 DeviceInstall
```

## 3. 设备绑定

### Device.status

```text
unbound
binding
bound
offline
disabled
lost
unbound_by_user
```

### 绑定流程

```text
用户发起绑定
  -> 扫描附近设备
  -> 读取 deviceIdHex / model / firmwareVersion
  -> 设备确认，按硬件能力可用按键/屏幕/近场确认
  -> 后端创建 Device
  -> 客户端记录 activeDeviceId
```

绑定必须记录：

- `deviceIdHex`
- 设备型号
- 固件版本
- 屏幕尺寸 / 能力
- 存储能力
- 当前电量，如果可读
- 绑定用户
- 绑定时间

### 旧设备迁移

旧 guguclub 已废弃，不做静默迁移。

可选迁移规则：

```text
如果有可靠旧记录
  -> 展示“发现旧设备，可重新验证绑定”
  -> 用户必须让设备进入绑定模式
  -> 验证 deviceIdHex
  -> 绑定到新的 Gugu Flash 账号
```

不迁移：

- 无法验证归属的设备。
- 旧登录态。
- 旧设备权益。
- 权利来源不清的旧内容。

## 4. 设备能力检测

每次同步前都要检查：

```text
deviceModel
firmwareVersion
batteryLevel
availableStorageKb
screenWidth
screenHeight
supportedPackFormatVersion
supportedAssetTypes
bleProtocolVersion
currentInstalledPackId
```

如果设备能力不足，不进入同步，直接给明确提示。

## 5. HardwarePack 必要字段

```json
{
  "id": "hardware_pack_123",
  "version": "1.0.0",
  "formatVersion": "hw_pack_v1",
  "status": "available",
  "targetDeviceModels": ["Circle 185"],
  "minFirmwareVersion": "1.2.0",
  "packageSizeKb": 380,
  "checksum": "sha256:...",
  "downloadUrl": "/flash/hardware-packs/hardware_pack_123/download",
  "resourceBudget": {
    "maxSizeKb": 512,
    "actualSizeKb": 380,
    "imageCount": 6,
    "nodeCount": 12
  },
  "rollbackSupported": true,
  "createdAt": 1760000000000
}
```

## 6. 同步前置条件

必须全部满足：

```text
Device.status = bound
HardwarePack.status = available
DeviceEntitlement.status = active
Device.model in HardwarePack.targetDeviceModels
Device.firmwareVersion >= HardwarePack.minFirmwareVersion
Device.availableStorageKb >= HardwarePack.packageSizeKb
Device.batteryLevel >= minBatteryLevel
checksum 可校验
```

建议 `minBatteryLevel` 初始设为 `20%`。

## 7. 下载和同步状态

### DeviceInstall.status

```text
not_installed
download_pending
downloading
downloaded
sync_pending
syncing
installed
failed
rollback_required
removed_from_device
```

### DeviceSyncJob.status

```text
created
compatibility_checking
blocked
downloading
downloaded
checksum_failed
syncing
verifying
installed
failed
rollback_required
cancelled
```

DeviceInstall 表示结果，DeviceSyncJob 表示一次同步任务过程。

## 8. 失败分类

同步失败必须分类，不要只说“失败”。

```text
device_offline
ble_disconnected
firmware_too_low
unsupported_device_model
insufficient_storage
low_battery
download_failed
checksum_failed
package_expired
entitlement_missing
hardware_pack_unavailable
write_failed
verify_failed
timeout
unknown
```

每种失败给用户不同动作：

```text
firmware_too_low
  提示升级固件。

insufficient_storage
  提示清理设备内容或选择更小内容包。

low_battery
  提示充电后重试。

ble_disconnected
  提示靠近设备并重试。

checksum_failed
  自动重新下载。

entitlement_missing
  提示重新购买/领取到当前设备。

hardware_pack_unavailable
  提示内容已下架或暂停下载。
```

## 9. 回滚和恢复

同步前记录设备当前运行内容：

```text
previousPackId
previousPackVersion
```

如果同步失败：

```text
未开始写入
  保持原内容。

写入中失败
  尝试回滚到 previousPack。

回滚失败
  标记 rollback_required，提示重新连接设备修复。
```

后端和客户端都要保留同步诊断：

- syncJobId
- deviceId
- hardwarePackId
- failureReason
- clientVersion
- firmwareVersion
- BLE 协议版本
- 最后一步状态

### DeviceSyncEvidence v1

每一次同步任务都必须生成一份可给 QA、客服、硬件和后端共同使用的证据对象。当前原型已在 `packages/core/src/gugu-device-sync-evidence.js` 定义校验器，并由 mock 同步任务生成 `syncJob.evidence`。

```json
{
  "schemaVersion": "gugu_device_sync_evidence_v1",
  "jobId": "sync_123",
  "deviceId": "device_123",
  "deviceName": "雨天咕咕吧唧",
  "storeId": "store_h5_pack",
  "packId": "h5_pack",
  "hardwarePackId": "hw_h5_pack",
  "status": "failed",
  "failureReason": "write_failed",
  "message": "写入设备失败，已尝试恢复原内容。",
  "diagnosticCode": "GFS-WRITE-FAILED-ABCD",
  "previousStoreId": "store_previous",
  "retryOf": null,
  "rollbackStatus": "restored_previous",
  "steps": ["created", "downloading", "downloaded", "syncing", "failed"],
  "checkpoints": [
    { "status": "created", "order": 1, "at": 1760000000000 },
    { "status": "failed", "order": 5, "at": 1760000001000 }
  ],
  "transport": {
    "kind": "fake_ble",
    "contractVersion": "fake_ble_transport_v1",
    "protocolVersion": "mock_ble_v1",
    "clientVersion": "web-prototype",
    "firmwareVersion": "1.2.3"
  },
  "createdAt": 1760000000000,
  "updatedAt": 1760000001000
}
```

证据规则：

- `failed`、`blocked`、`rollback_required` 必须有 `failureReason`。
- `diagnosticCode` 必须使用 `GFS-*` 格式。
- `steps` 必须包含最终 `status`。
- `rollbackStatus` 必须说明是否保留原内容、恢复原内容或需要修复。
- `transport` 必须记录协议、客户端和固件版本。

### Fake BLE transport contract

真实 BLE 接入前，fake transport 必须覆盖这些事件：

```text
connect
read_capability
download_package
verify_checksum
write_package
activate_package
readback_current_package
rollback_previous_package
disconnect
```

fake transport 必须支持故障注入：

```text
low_battery
checksum_failed
write_failed
ble_disconnected
```

并且必须保证：

- 写入失败时保留或恢复 previous content。
- 支持 `retryOf`，能把重试任务关联到失败任务。
- 支持回读当前运行内容，确认设备最终运行的是新包还是旧包。

### Real device matrix handoff

Public MVP 的真实设备矩阵在 `docs/real-device-matrix-plan.md` 和 `docs/device-matrix-readiness.json` 中维护。矩阵 case ID 以 `DEVICE_SYNC_REAL_DEVICE_MATRIX_CASE_IDS` 为准，并覆盖：

```text
circle185_current_firmware_nominal
circle185_low_battery_block
circle185_low_storage_block
circle185_ble_disconnect_retry
circle185_write_failed_rollback
circle185_verify_success
circle185_legacy_delisted_use
```

这些 case 必须在至少两台 Circle 185 物理设备上采集真实 BLE session。AI 团队当前只能维护 fake BLE contract、证据 schema、脚本门禁和验收模板；真实设备、固件覆盖、BLE 采集和硬件负责人签字属于外部验收工作。

## 10. 离线使用

已安装到设备内的内容允许离线使用。

规则：

```text
设备离线
  已安装内容继续运行。

App 离线
  可以查看本地已安装记录，但不能新购买/新下载/新同步。

HardwarePack 下架
  已安装设备内内容继续使用。
  新购买、新下载、新设备同步停止。

严重安全/法律风险
  平台可在下次联网时提示替换或强制更新，但这应作为高风险例外。
```

## 11. 下架和版权投诉影响

普通下架：

```text
HardwarePack.status = paused / removed
StoreListing.status = delisted
新购买停止
新下载停止
新设备同步停止
已安装内容继续使用
```

版权投诉初步成立：

```text
暂停新购买
暂停新下载
暂停新设备同步
冻结相关收益，后续如有
保留已安装内容，除非法律/安全要求强制替换
```

强制替换只用于：

- 明显违法违规。
- 严重未成年人风险。
- 法律要求。
- 设备安全风险。

## 12. 客户端能力分工

### Native App

主同步客户端。

负责：

- BLE 扫描。
- 绑定设备。
- 下载包。
- 校验 checksum。
- 同步到设备。
- 回读安装状态。
- 失败恢复。

### Mini Program

可做轻量同步，取决于微信 BLE 能力和稳定性。

建议：

- 可绑定和轻量同步。
- 复杂失败恢复引导到 App。

### Web/H5

不作为主同步客户端。

负责：

- 展示商店和作品。
- 提示内容可同步。
- 引导打开 App 或小程序。

## 13. 数据模型草案

### Device

```json
{
  "id": "device_123",
  "ownerUserId": "user_123",
  "deviceIdHex": "A1B2C3",
  "model": "Circle 185",
  "firmwareVersion": "1.2.3",
  "status": "bound",
  "batteryLevel": 76,
  "availableStorageKb": 420,
  "currentHardwarePackId": "hardware_pack_123",
  "lastSeenAt": 1760000000000
}
```

### DeviceCapability

```json
{
  "deviceId": "device_123",
  "screenWidth": 185,
  "screenHeight": 185,
  "maxPackageSizeKb": 512,
  "supportedPackFormatVersions": ["hw_pack_v1"],
  "supportedAssetTypes": ["png", "jpg", "wav"],
  "bleProtocolVersion": "1.0"
}
```

### DeviceSyncJob

```json
{
  "id": "sync_job_123",
  "deviceId": "device_123",
  "hardwarePackId": "hardware_pack_123",
  "status": "syncing",
  "failureReason": null,
  "previousPackId": "hardware_pack_old",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### DeviceInstall

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

## 14. API 草案

```text
GET  /flash/devices
POST /flash/devices/bind
POST /flash/devices/:id/unbind
POST /flash/devices/:id/select
GET  /flash/devices/:id/capability
POST /flash/devices/:id/heartbeat

GET  /flash/devices/:id/entitlements
GET  /flash/devices/:id/installs

POST /flash/devices/:id/sync-jobs
GET  /flash/device-sync-jobs/:id
POST /flash/device-sync-jobs/:id/cancel
POST /flash/device-sync-jobs/:id/retry
POST /flash/device-sync-jobs/:id/rollback

GET  /flash/hardware-packs/:id/download
POST /flash/hardware-packs/:id/verify-download
```

## 15. 售后提示

同步失败页必须展示：

- 失败原因。
- 用户可操作建议。
- 重试按钮。
- 回滚 / 修复按钮，如果需要。
- 诊断码。
- 联系客服入口。

例子：

```text
同步失败：设备电量过低
请将设备电量充至 20% 以上后重试。
诊断码：SYNC_LOW_BATTERY_20260520_123
```

## 16. MVP 落地

Phase 1:

- 设备绑定。
- 读取设备型号和固件。
- HardwarePack 兼容性检查。
- 按设备权益检查。
- 下载和 checksum 校验。

Phase 2:

- BLE 同步。
- DeviceSyncJob。
- DeviceInstall。
- 同步失败分类。
- 重试。

Phase 3:

- 回滚。
- 当前运行内容确认。
- 设备能力看板。
- 售后诊断码。

Phase 4:

- 离线已安装内容管理。
- 多设备批量状态。
- 固件升级引导。

## 17. 已确认规则

```text
1. Gugu Flash 自建设备绑定、BLE/同步、下载、安装状态和设备能力检测。
2. 已安装到设备内的 HardwarePack 允许离线使用。
3. 新购买、新下载、新同步必须在线校验权益、包状态和设备兼容性。
4. 旧设备绑定不静默迁移；如需迁移，必须用户重新验证设备。
5. 同步失败必须提供原因、重试、回滚策略和诊断码。
6. HardwarePack 下架后，已安装设备内内容继续使用。
7. 下架后停止新购买、新下载和新设备同步。
8. Native App 是主同步客户端；Web/H5 只做展示和跳转。
```
