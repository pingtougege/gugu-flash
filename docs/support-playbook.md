# Gugu Flash Closed Beta Support Playbook

This playbook is the first closed-beta support runbook for device sync, refunds, takedowns, rights claims, and appeals. It is written for Support, Ops, Trust, Commerce, and Hardware leads.

Ticket macros live in `docs/support-ticket-macros.md`; machine-readable readiness coverage lives in `docs/support-readiness.json` and is checked by `npm run check:support`.
The closed-beta support on-call packet lives at `data/support-oncall-packet.json` and is validated with `npm run check:support-oncall`.

## Operating Rules

- Never ask users to delete local app data before collecting diagnostics.
- Never promise restoration, refund approval, or rights ownership before operator review.
- Always keep user-visible wording separate from internal notes.
- Always record the support case id in the related operation note when a manual action is taken.
- Escalate anything involving minors, real-person impersonation, legal threats, payment provider disputes, or device safety.

## Severity

| Severity | Response Target | Examples | Owner |
| --- | --- | --- | --- |
| S0 | Same day | Legal demand, minor safety, mass payment failure, device safety risk | Product Owner / Trust Lead |
| S1 | 24h | Paid content unavailable, rights claim with store freeze, repeated sync failure after retry | Support Lead / On-call Operator |
| S2 | 48h | Single refund question, comment moderation appeal, listing review delay | Support |
| S3 | 5 business days | General how-to, creator policy explanation, feature request | Support |

## Support Diagnostics

Before replying to an S0/S1/S2 case, retrieve `GET /flash/operator/support-diagnostics` with the strongest available identifier: `orderId`, `providerEventId`, `syncJobId`, `deviceId`, `targetId`, or source case id. Copy the returned `requestId` into the ticket note if the support case triggers any manual operation.

The diagnostic bundle recommends a ticket macro and marks missing fields such as `diagnosticCode`, `providerEventId`, `entitlementId`, `settlementId`, or operation log reason. If a recommended macro is not ready, collect the missing fields or escalate to the listed owner before sending a final user-visible decision.

## Device Sync

### User-facing reply

```text
我们先帮你确认同步状态。请打开设备页，提供失败原因和诊断码；如果设备电量低于 20%，请先充电后再点重试。已安装在设备里的内容不会因为普通下架自动消失。
```

### Triage steps

1. Ask for `diagnosticCode`, device model, firmware version, and whether the device is currently connected.
2. Check `DeviceSyncEvidence` fields: `status`, `failureReason`, `rollbackStatus`, `retryOf`, `transport.firmwareVersion`.
3. If `failureReason = low_battery`, ask user to charge above 20% and retry.
4. If `failureReason = write_failed` and `rollbackStatus = restored_previous`, confirm previous content still runs.
5. If `rollbackStatus = rollback_required` or `rollback_failed`, escalate to Hardware Lead.
6. If content is delisted but already installed, explain legacy use; if new sync is blocked, explain listing status.

### Escalate when

- Same device has 3 failed jobs in 24h.
- `diagnosticCode` is missing or malformed.
- `failureReason` is `unknown`, `verify_failed`, `ble_disconnected`, or `write_failed` after retry.
- User reports device overheating, screen damage, battery abnormality, or data loss.

## Refunds

### User-facing reply

```text
我们会先核对订单、设备权益和是否已经安装到设备。退款成功后，新下载和新同步权益会撤销；已经同步到设备里的内容是否保留，按退款处理策略执行。
```

### Triage steps

1. Find the order id and confirm `Order.status`.
2. Confirm the active device id and `DeviceEntitlement.status`.
3. For provider callbacks, verify `providerEventId`; duplicate callback must be idempotent.
4. If `installedPolicy = keep_installed`, tell the user installed content can continue running but cannot be newly downloaded or synced.
5. If `installedPolicy = remove_from_device`, confirm `DeviceInstall.status = removed` and the device no longer runs the pack.
6. Check settlement state; refunded orders must move related settlement to `refunded`.

### Escalate when

- Payment provider status and platform order status disagree.
- The same `providerEventId` created more than one refund operation log.
- User claims payment was deducted but no paid order exists.
- Refund affects a rights claim, frozen settlement, or legal complaint.

## Takedowns And Store Freezes

### User-facing reply

```text
该内容当前被平台暂停新增分发。若你已经同步到设备，普通下架不会自动删除设备内已安装内容；如涉及安全或法律风险，平台会另行通知处理方式。
```

### Triage steps

1. Identify whether the action is `delist`, `freeze_store`, `take_down`, or `limit_recommend`.
2. Check source case: report, rights claim, operator review, or manual safety action.
3. Confirm whether user is creator, buyer, claimant, or reporter.
4. For creator questions, provide action reason and appeal route.
5. For buyer questions, explain legacy use, new download block, and refund eligibility.
6. For frozen store listings, confirm settlement is frozen and not released until review completes.

### Escalate when

- User disputes a copyright or IP claim with new evidence.
- The target involves minors, real-person impersonation, privacy leakage, or illegal content.
- A listed paid HardwarePack is frozen after multiple purchases.
- An operator action lacks reason, evidence, or audit log.

## Rights Claims

### User-facing reply

```text
我们已经收到权利投诉。平台会先保留证据，并可能暂停商店和硬件分发。创作者可以补充授权材料或提交申诉；处理结果会在复核后通知。
```

### Triage steps

1. Verify claimant name, target id, claim type, and summary.
2. Confirm the target snapshot exists before action.
3. If claim is plausible, keep `freeze_store` and settlement freeze until review.
4. If claim lacks evidence, ask claimant to supplement before escalation.
5. If creator appeals, attach the appeal to the source claim and route to second review.
6. When restoring, confirm work/listing/hardware status and settlement release reason.

### Escalate when

- Claimant is a verified rights owner or legal representative.
- Claim involves external commercial IP, celebrity, public figure, or underage person.
- Counter-notice or legal language appears.
- Store revenue or purchased device content is affected.

## Appeals

### User-facing reply

```text
我们会把你的申诉和补充材料交给复核人员处理。复核可能维持原处置、要求修改、恢复内容，或升级到进一步审查。
```

### Triage steps

1. Confirm the original action and source case id.
2. Collect appellant statement and supplemental evidence.
3. Ensure the reviewer is not the same operator who made the original action for high-risk cases.
4. Record result as `restore`, `keep_action`, `modify_required`, or `escalate`.
5. If restored, verify target status, settlement status, and user notification.

## Closed-Beta Staffing Acceptance Criteria

- At least two trained reviewers can operate report, rights claim, store review, and refund cases.
- One escalation owner is available for S0/S1 cases during each beta day.
- Support on-call packet records role slots, severity coverage, macro owners, daily review, diagnostic requirements, handoff drills, and pending staffing blockers.
- Support can retrieve `diagnosticCode`, `providerEventId`, `orderId`, `targetId`, and source case id from user reports.
- Every manual action has reason, evidence, and operation log.
- Daily beta review checks open reports, rights claims, appeals, payment/refund callbacks, failed sync jobs, and frozen settlements.
