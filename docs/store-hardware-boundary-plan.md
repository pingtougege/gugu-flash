# Store And Hardware Pack Boundary Plan

这份文档展开 `03. 商店内容与硬件适配边界不清`。

## 已确认结论

Gugu Flash 的商店不直接售卖用户原始 H5。

用户申请上架后，后台会把作品专门制作成硬件内容包；制作和审核通过后，用户才能在商店下载到设备。

核心链路：

```text
H5 Work
  -> 用户申请上架
  -> StoreListing
  -> 后台制作硬件内容包
  -> HardwarePack
  -> 审核通过
  -> 商店可下载
  -> 用户下载/同步到设备
```

一句话：

```text
商店卖的是后台制作并审核通过的 HardwarePack，不是用户原始 H5。
```

## 对象边界

### Work

用户创作的 H5 作品。

作用：

- 在内容流展示。
- 作为商店申请的来源。
- 作为后台制作硬件包的参考源。

不负责：

- 直接作为硬件包下载。
- 直接保证设备兼容。

### StoreListing

用户对某个作品提交的上架申请。

作用：

- 记录申请状态。
- 记录权利承诺、素材来源和价格信息。
- 连接 `Work` 和后续 `HardwarePack`。

不负责：

- 直接代表可下载内容。

### HardwarePack

后台制作出来的硬件内容包。

作用：

- 才是真正可下载、可同步到设备的内容。
- 有设备兼容、固件版本、校验和、资源预算等字段。
- 可以独立下架、更新、回滚。

## 推荐状态机

### StoreListing.status

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

解释：

- `submitted`: 用户已提交上架申请。
- `rights_review`: 权利和内容审核中。
- `production_queued`: 已通过初审，等待后台制作。
- `producing`: 后台正在制作硬件包。
- `pack_review`: 硬件包制作完成，等待最终审核。
- `listed`: 硬件包通过审核，商店可下载。
- `rejected`: 上架申请被拒。
- `delisted`: 已上架后下架。
- `frozen`: 权利争议或投诉处理中，暂停收益/下载。

### HardwarePack.status

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

解释：

- `draft`: 后台创建硬件包记录。
- `building`: 正在制作/转换。
- `reviewing`: 等待硬件审核。
- `ready`: 通过审核，准备发布。
- `available`: 可下载到设备。
- `paused`: 临时暂停下载。
- `deprecated`: 有新版本替代。
- `removed`: 已移除。

## 上架流程

```text
1. 用户在作品页/我的作品点击申请上架。
2. 用户填写素材来源、价格、权利承诺。
3. StoreListing 进入 rights_review。
4. 运营审核权利和内容安全。
5. 通过后进入 production_queued。
6. 后台制作 HardwarePack。
7. 制作完成后进入 pack_review。
8. 运营/硬件审核通过。
9. StoreListing 变 listed，HardwarePack 变 available。
10. 用户可以下载/同步到设备。
```

## 后台制作内容

后台制作不是简单转换，应该是官方/运营参与的适配过程。

制作内容包括：

```text
压缩素材
重绘/裁剪图形
调整文案长度
减少分支复杂度
适配屏幕尺寸
生成设备可读格式
添加包版本和校验和
测试设备预览
```

## HardwarePack 必要字段

```json
{
  "id": "hw_pack_123",
  "sourceWorkId": "h5_abc",
  "sourceWorkVersionId": "work_version_123",
  "sourceSchemaVersion": "gugu_h5_pack_v1",
  "storeListingId": "listing_123",
  "version": "1.0.0",
  "formatVersion": "hw_pack_v1",
  "status": "available",
  "compatibilityReportId": "compat_report_123",
  "targetDeviceModels": ["Circle 185"],
  "minFirmwareVersion": "1.2.0",
  "checksum": "sha256:...",
  "resourceBudget": {
    "maxSizeKb": 512,
    "actualSizeKb": 380,
    "imageCount": 6,
    "nodeCount": 12
  },
  "reviewStatus": "approved",
  "downloadUrl": "/packs/hw_pack_123.bin",
  "createdBy": "operator_1",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

## 商店用户可见状态

用户不需要看到所有后台细节，但要知道进度。

```text
已提交申请
权利审核中
制作排队中
硬件包制作中
最终审核中
可下载
被拒绝
已下架
暂停下载
```

## 下载权益

用户实际下载的是 `HardwarePack`。

建议权益：

```text
购买权益按设备区分，不按账号区分。
每台设备需要单独购买/领取对应 HardwarePack。
购买/领取后，可下载并同步到该设备。
HardwarePack 下架后，已安装到设备内的内容可以继续使用。
下架后不允许新购买、新下载或同步到新设备。
如果因版权投诉下架，暂停新购买、新下载和新设备同步，但不主动移除已安装设备内内容。
```

## 与 IP 权利治理的关系

商店和硬件必须读取 IP 状态。

```text
IP active:
  可申请上架，可制作硬件包。

IP disputed:
  暂停商店发布和硬件下载。

IP restricted:
  禁止新申请，存量 listing 暂停或降权。

IP blocked:
  下架商店内容，暂停硬件下载。
```

## 对当前原型的改造

现在原型里，商店直接从 `listed` 作品生成可下载项。要改成：

```text
Work
  -> applyStoreListing()
  -> StoreListing.status = rights_review
  -> approveRights()
  -> StoreListing.status = production_queued
  -> startProduction()
  -> HardwarePack.status = building
  -> finishProduction()
  -> HardwarePack.status = reviewing
  -> approveHardwarePack()
  -> StoreListing.status = listed
  -> HardwarePack.status = available
  -> 商店展示
```

## 当前确认规则

```text
1. 用户申请上架后，不直接生成商店可下载项。
2. 后台必须专门制作 HardwarePack。
3. HardwarePack 制作和审核通过后，才可下载。
4. 商店展示的是可下载 HardwarePack。
5. Work、StoreListing、HardwarePack 必须拆成独立对象。
6. IP disputed/restricted/blocked 会影响商店和硬件下载。
7. 购买权益按设备区分，每台设备需要单独购买/领取。
8. HardwarePack 下架后，已安装设备内内容可以继续使用。
9. HardwarePack 下架后，禁止新购买、新下载和同步到新设备。
```
