# Safety Governance Plan

这份文档展开 `09. 内容安全与社区治理缺失`。

Gugu Flash 是 UGC、角色分身、二创、上传素材、评论和 IP 社区混在一起的产品，安全治理不能等上线后再补。MVP 就要先定边界。

工程安全准入另见 `docs/security-review-plan.md`；机器可检查覆盖在 `docs/security-readiness.json`，通过 `npm run check:security` 验证。

## 1. 建议结论

建议先按这套做：

```text
1. MVP 不开放陌生人私信。
2. MVP 不做 CP / 情侣 / 绑定关系玩法。
3. MVP 不做付费关系道具。
4. 评论可以开放，但必须有举报、删除、拉黑、限流和审核记录。
5. 未成年人默认强保护：不允许陌生人私信，不做恋爱/CP/付费关系，不展示高风险内容。
6. 真人明星、公众人物、未成年人、恋爱擦边、仿冒身份保持保守。
7. 平台需要 Report、BlockRelation、ModerationAction、Appeal、SafetyLabel 等基础治理对象。
```

一句话：

```text
先做可控社区，不做强陌生人社交。
```

## 2. 治理目标

内容安全要保护五类对象：

- 用户，尤其是未成年人。
- 创作者权益和作品秩序。
- IP、角色分身和专区生态。
- 商店和硬件分发质量。
- 平台合规和品牌安全。

## 3. MVP 社交边界

### 私信

建议 MVP：

```text
陌生人私信：不开放。
互关 / 好友私信：可后置。
运营通知 / 系统通知：开放。
评论回复：开放，但可举报和拉黑。
```

后续如果开放私信，建议规则：

- 只允许互关或好友。
- 不允许陌生人直接发送图片、音频、链接。
- 未成年人不接收陌生人消息。
- 高频消息、诱导转账、外部联系方式自动风控。
- 被拉黑后不能继续私信、评论提醒或关注骚扰。

### CP / 情侣 / 绑定关系

MVP 不做：

- CP 绑定。
- 情侣关系。
- 恋爱陪伴付费关系。
- 专属关系道具。
- 亲密度付费加速。

可以保留更安全的轻关系：

- 关注。
- 收藏。
- 点赞。
- 评论。
- 同频搭子，非恋爱、非绑定、非付费。
- 好友，后续做。

原因：

- 角色扮演 + 未成年人 + 付费关系很容易变成高风险社交。
- 真人 / IP 角色的恋爱 CP 容易引发饭圈冲突、侵权和骚扰。

### 共创

共创当前已暂停，不进入 MVP。

如果好友页保留“共创邀请”概念占位，也不能形成真实私聊、关系绑定或多人编辑入口。

## 4. 年龄和未成年人保护

### 年龄策略

建议注册或首次进入社交功能时收集年龄段：

```text
under_14
14_to_17
adult
unknown
```

如果用户未填写或无法确认，社交能力按更保守策略处理。

### 未成年人限制

未成年人默认限制：

- 不允许陌生人私信。
- 不允许 CP / 情侣 / 绑定关系玩法。
- 不允许付费关系道具。
- 不展示高风险恋爱、擦边、成人暗示内容。
- 不允许公开展示真实位置、学校、手机号、微信号等隐私。
- 评论和发布触发更严格敏感词和人工复核。
- 商店收益和提现能力后置，需单独合规设计。

### 高风险未成年人内容

直接禁止：

- 性暗示、恋爱诱导、擦边内容与未成年人同时出现。
- 诱导未成年人转账、打赏、私聊、加外部联系方式。
- 未成年人真实身份、学校、住址、联系方式暴露。
- 成人与未成年人关系扮演。

## 5. 内容分类

建议所有内容都有 `SafetyLabel`。

对象包括：

```text
Work
WorkVersion
Asset
Comment
Message
Persona
IPEntry
IPZone
StoreListing
HardwarePack
```

### SafetyLabel.level

```text
safe
  正常展示。

limited
  可展示，但不推荐、不进热门、不进商店/硬件。

review_required
  需要人工审核后再公开或再推荐。

blocked
  拦截、下架或不可见。
```

### 风险类型

```text
sexual_or_adult
harassment_or_bullying
hate_or_discrimination
self_harm
minor_risk
privacy_leak
real_person_impersonation
illegal_or_dangerous
spam_or_scam
ip_or_copyright
unsafe_hardware_content
external_contact_or_transaction
```

风险标签可以叠加。

## 6. 发布和审核链路

### 发布前

触发对象：

- 发布作品。
- 上传图片 / 音频。
- 创建角色分身。
- 申请添加 IP。
- 申请开通专区。
- 发布评论。

检查：

```text
敏感词
外部联系方式
未成年人风险
真人/公众人物冒充
色情低俗
仇恨骚扰
版权/IP 高风险
图片/音频安全扫描
重复垃圾内容
设备展示安全
```

处理：

```text
明显违规 -> 直接拦截
中风险 -> public_limited / review_required
低风险 -> 先发后审
```

### 发布后

触发：

- 用户举报。
- 高频拉黑 / 删除 / 差评信号。
- 评论区冲突升温。
- 作品突然爆量。
- 商店 / 硬件申请。
- 权利投诉。

处理：

```text
自动限流
隐藏评论
暂停推荐
进入 ReviewTask
下架或恢复
允许申诉
记录处理动作
```

## 7. 评论治理

MVP 可以开放评论，但要限制能力。

规则：

- 评论必须登录。
- 评论支持举报。
- 作者可以隐藏自己作品下的评论，但隐藏行为要留记录。
- 用户可以删除自己的评论。
- 平台可以删除、折叠、限流评论。
- 不开放评论图片、音频、外链。
- 外部联系方式、辱骂、骚扰、引战、刷屏自动风控。

评论状态：

```text
visible
hidden_by_author
hidden_by_platform
pending_review
deleted_by_user
removed
```

## 8. 举报和拉黑

### Report

可举报对象：

```text
Work
Comment
User
Persona
IPEntry
IPZone
StoreListing
HardwarePack
```

举报理由：

```text
色情低俗
骚扰辱骂
未成年人风险
冒充真人
隐私泄露
诈骗/引流
版权/IP 侵权
垃圾广告
不适合硬件展示
其他
```

举报状态：

```text
submitted
triage
action_taken
rejected
closed
escalated
```

### BlockRelation

拉黑效果：

- 对方不能关注我。
- 对方不能评论我的作品。
- 对方不能给我发消息，未来开放私信时。
- 我看不到对方评论和作品推荐。
- 不影响平台审核和证据保留。

## 9. 专区治理

专区管理员可以：

- 置顶作品。
- 整理角色分身。
- 隐藏明显不合适的专区评论。
- 标记违规内容给平台。
- 管理专区公告。

专区管理员不能：

- 绕过平台审核。
- 删除其他用户合法作品的绝对权利。
- 私自封禁用户全站账号。
- 强制上架商店或硬件。

平台保留最终治理权。

## 10. 处罚和申诉

### ModerationAction

动作：

```text
warn
hide
limit_recommend
disable_comment
take_down
freeze_store
pause_hardware_download
restrict_account
ban_account
restrict_ip
restrict_persona
restrict_zone
```

每个动作必须记录：

- 操作人。
- 操作对象。
- 原因。
- 证据。
- 时间。
- 是否通知用户。
- 是否允许申诉。

### Appeal

用户可以对这些结果申诉：

- 作品下架。
- 评论删除。
- 账号限制。
- 分身限制。
- IP 限制。
- 专区限制。
- 商店下架。
- 硬件下载暂停。

申诉结果：

```text
restore
modify_required
keep_action
escalate
```

## 11. 数据模型草案

### SafetyLabel

```json
{
  "id": "safety_123",
  "targetType": "work",
  "targetId": "work_123",
  "level": "limited",
  "riskTypes": ["minor_risk", "external_contact_or_transaction"],
  "source": "auto_scan",
  "createdAt": 1760000000000
}
```

### Report

```json
{
  "id": "report_123",
  "reporterId": "user_123",
  "targetType": "comment",
  "targetId": "comment_123",
  "reason": "harassment_or_bullying",
  "description": "持续辱骂和引战",
  "status": "submitted",
  "createdAt": 1760000000000
}
```

### BlockRelation

```json
{
  "id": "block_123",
  "blockerId": "user_123",
  "blockedUserId": "user_456",
  "reason": "harassment",
  "createdAt": 1760000000000
}
```

### ModerationAction

```json
{
  "id": "mod_action_123",
  "targetType": "work",
  "targetId": "work_123",
  "action": "take_down",
  "reason": "未成年人高风险内容",
  "operatorId": "reviewer_1",
  "appealable": true,
  "createdAt": 1760000000000
}
```

### UserSafetyProfile

```json
{
  "userId": "user_123",
  "ageBand": "unknown",
  "minorMode": true,
  "dmPolicy": "friends_only",
  "commentPolicy": "public_filtered",
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

## 12. API 草案

```text
POST /flash/reports
GET  /flash/me/reports

POST /flash/blocks
DELETE /flash/blocks/:id
GET  /flash/me/blocks

POST /flash/comments
DELETE /flash/comments/:id
POST /flash/comments/:id/report
POST /flash/comments/:id/hide

GET  /flash/safety-labels/:targetType/:targetId

GET  /flash/operator/reports
POST /flash/operator/reports/:id/resolve
GET  /flash/operator/moderation-actions
POST /flash/operator/moderation-actions

POST /flash/appeals
GET  /flash/me/appeals
POST /flash/operator/appeals/:id/resolve
```

## 13. MVP 落地

Phase 1:

- 举报入口。
- 拉黑入口。
- 评论文本安全扫描。
- 作品/评论/用户举报队列。
- 基础 ModerationAction。

Phase 2:

- 年龄段和未成年人保护模式。
- 评论折叠、作者隐藏、平台删除。
- 用户申诉。

Phase 3:

- 素材安全扫描接入。
- 图片/音频风险标签。
- IP、分身、专区治理入口。

Phase 4:

- 好友私信，仍不开放陌生人私信。
- 更细的社区信用和限流策略。

## 14. 建议当前先确认

```text
1. MVP 不开放陌生人私信。
2. MVP 不做 CP / 情侣 / 绑定关系玩法。
3. MVP 不做付费关系道具。
4. 评论可以开放，但必须有举报、拉黑、隐藏、删除、限流和审核记录。
5. 未成年人默认强保护，未知年龄按保守策略处理。
6. 平台保留最终治理权，专区管理员只有协助治理权。
7. 违规处置必须可记录、可通知、可申诉。
```
