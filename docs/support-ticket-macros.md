# Gugu Flash Closed Beta Support Ticket Macros

These macros turn the support playbook into repeatable ticket handling for the closed beta. Support agents may adapt wording for tone, but must keep the required internal fields and escalation rules.

## Macro Format

Each macro must include:

- Trigger
- Severity
- Owner
- User reply
- Internal note
- Required fields
- Escalation rule

## `sync_low_battery`

Alias: `device_storage_or_battery_block`.

Trigger: Device sync failed with `failureReason = low_battery`.

Severity: S2 unless the user has repeated failures after charging.

Owner: Support.

User reply:

```text
我们看到这次同步失败与设备电量有关。请先把设备充到 20% 以上，再回到设备页点击重试。已经安装在设备里的内容不会因为这次失败被自动删除。
```

Internal note:

```text
Sync low-battery triage. Capture diagnosticCode, deviceId, firmwareVersion, batteryLevel, storeId, and retryOf if present.
```

Required fields: `diagnosticCode`, `deviceId`, `batteryLevel`, `firmwareVersion`, `storeId`.

Escalation rule: Escalate to Hardware Lead if the same device fails 3 times in 24h after battery is above 20%.

## `sync_write_failed`

Alias: `device_sync_failed`.

Trigger: Device sync failed with `failureReason = write_failed`, `verify_failed`, or rollback status is not clean.

Severity: S1.

Owner: Support Lead / Hardware Lead.

User reply:

```text
这次同步写入没有完成。请先不要清除本地数据，我们会核对诊断码和设备恢复状态。如果系统显示已恢复原内容，你可以先继续使用原内容；我们会进一步确认是否需要设备侧处理。
```

Internal note:

```text
Hardware-risk sync failure. Attach DeviceSyncEvidence, diagnosticCode, rollbackStatus, transport events, firmwareVersion, and previousStoreId.
```

Required fields: `diagnosticCode`, `failureReason`, `rollbackStatus`, `transport.events`, `firmwareVersion`, `previousStoreId`.

Escalation rule: Escalate immediately if `rollbackStatus = rollback_required` or `rollback_failed`.

## `payment_no_entitlement`

Trigger: User says payment succeeded but no device entitlement appears.

Severity: S1.

Owner: Commerce Lead / Backend Lead.

User reply:

```text
我们会核对支付状态、订单和设备权益。请提供订单号或支付时间，以及当前绑定设备。若支付服务商已确认成功但平台未发放权益，我们会优先处理并保留支付记录。
```

Internal note:

```text
Payment success without entitlement. Check orderId, providerPaymentId, providerEventId, payment callback signature result, order status, and DeviceEntitlement for the target device.
```

Required fields: `orderId`, `providerPaymentId`, `providerEventId`, `deviceId`, `storeId`.

Escalation rule: Escalate to Commerce Lead if provider status and platform order status disagree.

## `refund_provider_mismatch`

Trigger: Payment provider refund status and platform order/refund state disagree.

Severity: S1.

Owner: Commerce Lead.

User reply:

```text
我们正在核对退款服务商状态和平台订单状态。退款成功后，新下载和新同步权益会撤销；已经同步到设备里的内容是否保留，会按退款处理策略执行。
```

Internal note:

```text
Provider refund mismatch. Verify providerEventId idempotency, providerRefundId, order status, entitlement status, settlement status, and operation log count.
```

Required fields: `orderId`, `providerEventId`, `providerRefundId`, `entitlementId`, `settlementId`.

Escalation rule: Escalate if the same `providerEventId` created more than one refund operation log or if settlement state is inconsistent.

## `takedown_legacy_use`

Alias: `delisted_pack_legacy_use`.

Trigger: User asks why a delisted/frozen/taken-down item can or cannot still run on a device.

Severity: S2 unless safety, legal, or minor-risk content is involved.

Owner: Support / Trust Lead.

User reply:

```text
该内容当前已暂停新增分发。普通下架会停止新购买、新下载和新同步；如果你已经同步到设备，通常不会自动删除设备内已安装内容。若涉及安全或法律风险，平台会另行通知处理方式。
```

Internal note:

```text
Legacy-use explanation. Confirm storeStatus, hardwarePack.status, DeviceInstall.status, DeviceEntitlement.status, and source action.
```

Required fields: `targetId`, `storeStatus`, `hardwarePack.status`, `deviceInstall.status`, `sourceCaseId`.

Escalation rule: Escalate to Trust Lead if the source action involves safety, legal, privacy, or minor-risk content.

## `rights_claim_received`

Trigger: Rights claimant or creator asks about a rights claim.

Severity: S1 for listed paid hardware content, otherwise S2.

Owner: Trust Lead / Operator Lead.

User reply:

```text
我们已经收到权利相关材料。平台会先保留证据，并可能暂停商店和硬件分发。创作者可以补充授权材料或提交申诉；处理结果会在复核后通知。
```

Internal note:

```text
Rights claim support case. Link claim id, target snapshot, claimant summary, source material, freeze status, settlement status, and appeal path.
```

Required fields: `claimId`, `targetType`, `targetId`, `claimType`, `sourceEvidence`, `settlementStatus`.

Escalation rule: Escalate to Trust Lead if claimant is verified, legal language appears, or paid content is affected.

## `appeal_received`

Trigger: User appeals a moderation, rights, comment, or store action.

Severity: S2 unless the original action is S0/S1.

Owner: Support Lead / Trust Lead.

User reply:

```text
我们会把你的申诉和补充材料交给复核人员处理。复核可能维持原处置、要求修改、恢复内容，或升级到进一步审查。
```

Internal note:

```text
Appeal support case. Link source action, source case id, appellant statement, supplemental evidence, assigned reviewer, and final result.
```

Required fields: `appealId`, `sourceActionId`, `targetId`, `appellantUserId`, `supplementalEvidence`.

Escalation rule: Escalate if the same operator would otherwise review their own original action.

## `operator_reason_missing`

Trigger: Operator action, settlement release, takedown, claim, or appeal lacks a human-readable reason.

Severity: S1 for paid/listed content, otherwise S2.

Owner: Operator Lead.

User reply:

```text
我们需要补齐这次处理的原因说明后再给你正式结果。平台要求人工处置必须保留原因、证据和操作记录。
```

Internal note:

```text
Operator reason missing. Pause user-facing final decision until reason and evidence are attached to the operation log.
```

Required fields: `operationLogId`, `operatorId`, `targetType`, `targetId`, `missingReason`.

Escalation rule: Escalate to Product Owner if an S0/S1 case was acted on without reason.
