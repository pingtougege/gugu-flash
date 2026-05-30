# Monetization Plan

这份文档展开 `12. 商业化与收益分配未定义`。

Gugu Flash 的商业化不能只看“能不能收费”。因为这里同时有 UGC、二创、IP 池、上传素材、商店、硬件包、按设备购买和权利投诉。MVP 应该先把交易闭环跑通，再开放现金分成。

## 1. 建议结论

建议先按这套定：

```text
1. MVP 可以做商店购买/领取，但优先官方免费/低价 HardwarePack。
2. 用户作品可以申请上架，但 MVP 不开放创作者现金收益。
3. 用户作品上架后的回报先做荣誉、积分、徽章、流量曝光、官方精选署名。
4. 原创和二创都可以申请上架，但二创商业化必须更严格审核。
5. 二创默认不开放现金分成，除非有明确授权或平台活动规则。
6. 共创当前暂停，不进入 MVP 收益分配。
7. 购买权益继续按设备，不按账号。
8. 收益、退款、冻结、结算和税务在第二阶段再完整开放。
```

一句话：

```text
MVP 先卖/领官方制作的 HardwarePack，不急着给 UGC 做现金分账。
```

## 2. 商业对象边界

### Work

用户创作的 H5。

不直接售卖。

### StoreListing

用户或平台提交的上架申请和商店商品状态。

记录：

- 申请人。
- 来源 WorkVersion。
- 权利承诺。
- 素材来源。
- 价格策略。
- 是否允许收益。
- 审核状态。

### HardwarePack

后台制作出的设备内容包。

商店真正售卖 / 领取的是它，不是 H5 原稿。

### Order

购买 / 领取记录。

免费内容也要生成金额为 0 的 Order，方便审计。

### DeviceEntitlement

真正的购买权益。

```text
DeviceEntitlement = deviceId + hardwarePackId
```

每台设备需要单独购买 / 领取。

## 3. MVP 商品类型

### official_free

官方免费包。

用途：

- 跑通下载 / 同步链路。
- 做新手内容。
- 做活动内容。

### official_paid_low

官方低价包。

用途：

- 验证支付、退款、设备权益。
- 控制用户预期。

### ugc_featured_no_cash

用户作品被官方精选并制作成 HardwarePack，但不产生现金分成。

用户获得：

- 作者署名。
- 官方精选标识。
- 荣誉徽章。
- 积分。
- 主页展示。
- 流量曝光。

### ugc_paid_revenue_share

用户现金分成商品。

不进 MVP，后续开放。

开放前必须具备：

- 实名 / 收款账户。
- 税务和发票处理。
- 退款和售后规则。
- 收益冻结。
- 权利投诉和申诉。
- 结算周期。
- 分成协议。

## 4. 原创和二创收益规则

### 原创

MVP：

```text
可以申请上架。
可以被官方制作 HardwarePack。
可以获得荣誉/积分/曝光。
不开放现金收益。
```

后续：

```text
通过创作者认证
签署创作者收益协议
完成收款和税务信息
通过权利/素材审核
才可开放现金分成
```

### 二创

MVP：

```text
可以发布。
可以申请上架。
必须选择 IP 池 IP。
必须提交素材来源和权利承诺。
可以获得荣誉/积分/曝光。
默认不开放现金收益。
```

后续只有这些情况可开放现金收益：

- 平台已获得该 IP 商业授权。
- 用户提供明确授权材料并通过审核。
- 平台官方活动明确允许。
- IP 权利方参与结算规则。

### 平台原创 / 官方授权 IP

可以做官方收费内容。

如果用户参与创作，是否分成要由活动规则单独定义。

### 用户原创 IP

用户原创 IP 可以后续设计收益，但不要默认“IP 创建者自动分成”。

原因：

- IP 创建者和作品作者可能不同。
- 角色分身创建者可能不同。
- 专区管理员不是 IP 权利人。
- 权利归属需要协议支撑。

MVP 先只做署名和荣誉。

## 5. 共创收益

共创已暂停，不进入当前 MVP。

如果后续恢复共创，建议先按：

```text
主创收款
协作者署名
不做自动现金分账
```

再后续才考虑：

- 固定比例。
- 自定义比例。
- 按贡献比例。
- 仅积分 / 荣誉。

## 6. 价格策略

MVP 建议价格简单：

```text
free
low_price
event_reward
```

不建议一开始做：

- 创作者自定义价格。
- 动态定价。
- 打赏。
- 会员订阅。
- 盲盒。
- 付费关系道具。

原因：

- 容易扩大售后和合规复杂度。
- 和未成年人保护、内容安全、版权风险耦合太重。

## 7. 支付和退款

### 支付

Gugu Flash 自建订单系统，接入支付通道。

```text
Order.created
  -> pending_payment
  -> provider payment callback verified
  -> paid
  -> DeviceEntitlement.active
```

免费领取：

```text
Order.amount = 0
Order.status = paid
DeviceEntitlement.active
```

### Payment callback

支付服务商回调必须先通过签名校验，再进入订单状态机。

```json
{
  "id": "payment_callback_evt_123",
  "providerEventId": "evt_123",
  "provider": "mock_pay",
  "providerPaymentId": "pay_123",
  "orderId": "order_123",
  "status": "succeeded",
  "result": "paid",
  "amount": 100,
  "currency": "CNY",
  "reason": "provider_payment_callback",
  "receivedAt": 1760000000000,
  "processedAt": 1760000000100
}
```

规则：

- HTTP Alpha 使用 `X-Gugu-Payment-Signature` 或 body `signature` 做 HMAC 校验。
- `providerEventId` 是幂等键。
- 相同 `providerEventId` 重复投递只能返回同一条 callback 事件。
- 重复投递不能重复发放 `DeviceEntitlement`，也不能重复写 `Settlement` 或 operation log。
- `succeeded` / `success` / `paid` 才触发 `Order.paid` 和设备权益发放。
- `failed` / `cancelled` / `expired` 会把待支付订单标记为 `failed`，不发放权益。
- 金额或币种不匹配时必须阻断，不能发放权益。

### 退款

退款要区分：

```text
未下载 / 未同步
  可以更宽松退款。

已下载但未同步
  可按平台规则退款。

已同步到设备
  原则上更谨慎，按商品说明和平台政策处理。
```

退款后：

```text
Order.status = refunded
DeviceEntitlement.status = revoked
禁止新下载 / 新同步
已安装设备内是否保留，按退款和投诉类型决定
```

注意：版权投诉下架和用户主动退款是两类事情，不要混用规则。

## 8. 收益冻结

即使 MVP 不开放创作者现金收益，也要设计冻结字段。

触发：

```text
权利投诉初步成立
IP 进入 disputed / restricted
商店材料被发现不实
素材来源不完整
异常购买 / 刷量
退款率异常
平台人工复核认为高风险
```

冻结对象：

```text
StoreListing
Order settlement
CreatorRevenue，后续
IPRevenue，后续
```

MVP 可以只记录：

```text
StoreListing.status = frozen
Settlement.status = frozen，预留
```

## 9. 结算和税务

MVP 不开放现金收益，所以不需要立即做完整结算。

但后端模型要预留：

### CreatorRevenueAccount

```json
{
  "id": "revenue_account_123",
  "userId": "user_123",
  "status": "pending_verification",
  "payoutEnabled": false,
  "taxProfileStatus": "not_submitted"
}
```

### RevenueLedger

```json
{
  "id": "ledger_123",
  "userId": "user_123",
  "storeListingId": "listing_123",
  "orderId": "order_123",
  "amount": 100,
  "currency": "CNY",
  "status": "frozen",
  "createdAt": 1760000000000
}
```

### SettlementBatch

```json
{
  "id": "settlement_2026_06",
  "period": "2026-06",
  "status": "draft",
  "totalAmount": 0
}
```

后续开放收益前必须补：

- 实名认证。
- 收款账户。
- 税务信息。
- 结算周期。
- 平台服务费。
- 退款扣回。
- 投诉冻结。

## 10. 数据模型补充

### StoreListing.monetization

```json
{
  "pricingType": "free",
  "price": 0,
  "currency": "CNY",
  "revenueMode": "no_cash",
  "rewardMode": ["badge", "points", "featured_credit"],
  "creatorPayoutEnabled": false
}
```

### Order

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
  "createdAt": 1760000000000
}
```

### Refund

```json
{
  "id": "refund_123",
  "orderId": "order_123",
  "reason": "user_request",
  "amount": 100,
  "status": "submitted",
  "createdAt": 1760000000000
}
```

### Refund callback

支付或退款服务商回调必须有幂等键：

```json
{
  "id": "refund_callback_evt_123",
  "providerEventId": "evt_123",
  "provider": "mock_pay",
  "providerRefundId": "refund_123",
  "orderId": "order_123",
  "status": "succeeded",
  "result": "refunded",
  "amount": 100,
  "currency": "CNY",
  "reason": "provider_refund_callback",
  "receivedAt": 1760000000000,
  "processedAt": 1760000000100
}
```

规则：

- `providerEventId` 是幂等键。
- 相同 `providerEventId` 重复投递只能返回同一条 callback 事件。
- 重复投递不能重复撤销 `DeviceEntitlement`，也不能重复写 `Settlement` 或 operation log。
- `succeeded` / `success` / `refunded` 才触发 `Order.refunded` 和权益撤销。
- 失败或处理中状态只记录 callback，不改变订单权益。

## 11. API 草案

```text
POST /flash/orders
GET  /flash/orders/:id
POST /flash/orders/:id/pay
POST /flash/orders/:id/refund
POST /flash/operator/payment-callbacks
POST /flash/operator/refund-callbacks

GET  /flash/me/entitlements
GET  /flash/devices/:id/entitlements

GET  /flash/me/rewards
GET  /flash/me/revenue-account
POST /flash/me/revenue-account

GET  /flash/operator/orders
GET  /flash/operator/refunds
POST /flash/operator/refunds/:id/approve
POST /flash/operator/refunds/:id/reject
GET  /flash/operator/revenue-ledgers
POST /flash/operator/store-listings/:id/freeze
POST /flash/operator/store-listings/:id/unfreeze
```

## 12. MVP 落地

Phase 1:

- 官方免费包。
- 免费领取也生成 Order。
- DeviceEntitlement 按设备生成。
- 同步链路跑通。

Phase 2:

- 官方低价包。
- 支付和退款闭环。
- 订单、退款、权益、安装状态后台。

Phase 3:

- 用户作品精选上架。
- 无现金收益。
- 荣誉、积分、徽章、署名。

Phase 4:

- 创作者认证。
- 原创现金分成。
- 收益冻结和结算。

Phase 5:

- 授权二创分成。
- IP 权利方结算。
- 更复杂收益模型。

## 13. 已确认规则

```text
1. MVP 不给用户作品立刻开放现金收费和现金分成。
2. MVP 可以做官方免费/低价 HardwarePack。
3. 用户作品上架先做荣誉、积分、徽章、署名和曝光。
4. 原创和二创都可以申请上架，但二创商业化审核更严格。
5. 二创默认不开放现金收益，除非有明确授权或平台活动规则。
6. 共创当前暂停，不进入 MVP 收益分配。
7. 购买权益继续按设备，不按账号。
8. 免费领取也要生成 Order 和 DeviceEntitlement。
9. 收益冻结、退款、结算、税务模型先预留，现金分成后置。
```
