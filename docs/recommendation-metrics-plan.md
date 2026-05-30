# Recommendation Metrics Plan

这份文档展开 `11. 推荐、排序与数据指标还很粗`。

当前原型的 `scorePack` 可以演示热度，但真实产品需要把播放、创作、IP、专区、商店、硬件、风控都拆成可解释的指标体系。

## 1. 建议结论

建议先按这套定：

```text
1. 长期北极星：每周设备端有效体验数。
2. MVP 先导指标：有效播放数 + 合格发布作品数。
3. 推荐先规则化，不急着做复杂个性化算法。
4. Feed 分成推荐、关注、IP/专区、题材、好友、商店候选。
5. 二创可以进全局热门，但必须满足 IP、审核、安全、举报和多样性规则。
6. 专区开通热度用作品数、创作者数、有效播放、收藏、Remix、举报率综合计算。
```

一句话：

```text
先让内容分发可解释，再逐步个性化。
```

## 2. 北极星指标

Gugu Flash 最终不是纯 H5 内容社区，也不是单纯设备工具。它的完整闭环是：

```text
创作 H5
  -> 被播放和 Remix
  -> 申请上架
  -> 官方制作 HardwarePack
  -> 用户按设备购买/领取
  -> 同步到设备
  -> 设备端被使用
```

所以长期北极星建议是：

```text
Weekly Effective Device Experiences
```

定义：

```text
一周内，成功同步到设备并产生有效使用的 HardwarePack 体验次数 / 设备数。
```

如果设备端使用埋点暂时拿不到，先用替代指标：

```text
Weekly Successful Device Syncs
```

即每周成功同步到设备的 HardwarePack 次数和设备数。

## 3. MVP 先导指标

早期硬件链路还没完全打通时，不能只盯设备同步，否则内容冷启动会看不清。

MVP 建议先看两类先导指标：

### 内容消费

```text
Effective Plays
```

有效播放定义：

- 播放超过最短时长。
- 或完成至少一个场景。
- 或触发至少一个分支选择。
- 或到达结局。

不建议只看曝光或打开，因为太容易虚高。

### 内容供给

```text
Qualified Published Works
```

合格发布作品定义：

- `Work.status = public`。
- 有完整 IP / 分身 / 题材标签。
- 有至少 3 个场景。
- 没有高风险 SafetyLabel。
- 通过基础审核。

## 4. 指标分层

### 消费指标

```text
impression
play_start
effective_play
scene_view
choice_click
completion
replay
like
save
share
comment
report
block_author
```

核心派生指标：

```text
play_through_rate = completion / play_start
effective_play_rate = effective_play / impression
choice_rate = choice_click / scene_view
save_rate = save / effective_play
share_rate = share / effective_play
report_rate = report / effective_play
```

### 创作指标

```text
draft_created
draft_edited
draft_published
publish_approved
publish_rejected
publish_taken_down
remix_created
asset_uploaded
ai_suggestion_accepted
```

核心派生指标：

```text
draft_to_publish_rate
publish_approval_rate
creator_7d_retention
remix_rate
asset_block_rate
```

### IP / 分身 / 专区指标

```text
ip_selected
ip_application_submitted
persona_selected
persona_created
zone_application_started
zone_application_approved
zone_follow
zone_work_publish
```

专区开通热度建议：

```text
zoneEligibilityScore =
  publishedWorkCount * 2
  + activeCreatorCount * 8
  + effectivePlays * 0.05
  + saves * 1.5
  + remixes * 3
  - reports * 10
  - takedowns * 30
```

这个分数只用于开区资格参考，最终仍需审核。

### 商店和硬件指标

```text
store_application_started
store_application_submitted
store_rights_approved
store_rejected
hardware_pack_build_started
hardware_pack_available
order_created
payment_success
entitlement_created
download_started
download_success
sync_started
sync_success
sync_failed
install_success
```

核心派生指标：

```text
store_apply_rate = store_application_submitted / public_work_count
store_approval_rate = store_rights_approved / store_application_submitted
hardware_available_rate = hardware_pack_available / store_rights_approved
purchase_rate = payment_success / store_detail_view
sync_success_rate = sync_success / sync_started
install_success_rate = install_success / sync_started
```

### 安全指标

```text
report_count
report_rate
takedown_count
takedown_rate
appeal_count
appeal_success_rate
review_sla
minor_risk_count
blocked_asset_count
blocked_comment_count
```

推荐和热门必须读取安全指标。

## 5. Feed 类型

### 推荐 Feed

目标：

- 给用户看全站优质内容。
- 兼顾新作品冷启动和多样性。

准入：

```text
Work.status = public
IPEntry.governanceStatus = active
SafetyLabel.level in safe / limited
report_rate below threshold
```

### 关注 Feed

目标：

- 看关注作者、IP、分身、专区的更新。

准入：

```text
Work.status in public_limited / public
但 public_limited 不做强推荐，只按关注关系展示。
```

### IP / 专区 Feed

目标：

- 聚合某个 IP 下的作品。
- 如果专区已开通，则进入专区流。

准入：

```text
Work.ipId = selectedIpId
Work.status in public_limited / public
```

排序：

- 热门。
- 最新。
- 角色分身过滤。
- 题材过滤。

### 题材 Feed

目标：

- 情绪陪伴、摸鱼上班、同频搭子、像素冒险等跨 IP 聚合。

题材不是专区，不拥有作品。

### 好友 Feed

目标：

- 展示好友 / 关注用户的创作、收藏、Remix、评论互动。

MVP 可先只做动态流，不做私信。

### 商店候选 Feed

目标：

- 给运营看哪些作品适合上架或硬件化。

准入：

```text
Work.status = public
high save_rate
high completion
low report_rate
IPEntry.governanceStatus = active
asset risk acceptable
```

## 6. 早期排序规则

不急着做个性化算法，先做可解释的规则排序。

### 基础热度分

```text
qualityScore =
  effectivePlays * 0.2
  + completions * 1.0
  + saves * 2.0
  + shares * 2.5
  + comments * 0.6
  + remixes * 4.0
  + syncSuccesses * 6.0
  - reports * 20.0
  - takedowns * 80.0
```

### 时间衰减

```text
freshnessScore = qualityScore / pow(hoursSincePublish + 2, 0.35)
```

### 风险降权

```text
safe: 1.0
limited: 0.6
review_required: 0
blocked: 0
```

### 最终推荐分

```text
recommendScore =
  freshnessScore
  * safetyMultiplier
  * ipHealthMultiplier
  * diversityMultiplier
```

## 7. 新作品冷启动

新作品需要曝光，但不能无限放大风险。

冷启动池规则：

```text
Work.status = public
createdAt within 72h
SafetyLabel not blocked
author not restricted
IP not restricted/blocked
```

冷启动给少量探索曝光，看：

- 有效播放率。
- 完播率。
- 收藏率。
- 举报率。
- 分享 / Remix。

达到阈值后进入普通推荐池。

## 8. 二创能否进全局热门

建议：可以。

但必须满足：

```text
Work.contentOrigin = fanwork
Work.status = public
IPEntry.governanceStatus = active
IP 不在 disputed / restricted / blocked
素材审核通过
没有高风险 SafetyLabel
report_rate below threshold
明确显示“二创”和所属 IP
```

排序上做轻度约束：

- 二创可以进推荐和全局热门。
- 高风险 IP 降权。
- 同一 IP 不要刷屏。
- 同一作者不要刷屏。
- 同一模板不要刷屏。
- 权利投诉中的 IP 立即暂停热门和商店/硬件候选。

## 9. 数据事件模型

建议所有客户端统一事件格式。

```json
{
  "eventId": "evt_123",
  "eventName": "work_effective_play",
  "userId": "user_123",
  "anonymousId": "anon_123",
  "sessionId": "session_123",
  "targetType": "work",
  "targetId": "work_123",
  "ipId": "ip_workday_gugu",
  "personaId": "persona_work_flash",
  "zoneId": "zone_workday_gugu",
  "deviceId": "device_123",
  "properties": {
    "sceneId": "scene_start",
    "durationMs": 12000,
    "source": "recommend_feed"
  },
  "createdAt": 1760000000000
}
```

必须字段：

```text
eventName
createdAt
sessionId
targetType / targetId
source
```

登录后补充：

```text
userId
deviceId
```

## 10. 数据表建议

### EventLog

原始事件流水，保留可追溯。

### WorkMetricDaily

按作品聚合。

```text
date
workId
impressions
playStarts
effectivePlays
completions
likes
saves
shares
comments
remixes
reports
```

### IPMetricDaily

按 IP 聚合，用于 IP 池治理和专区申请。

### PersonaMetricDaily

按角色分身聚合。

### ZoneMetricDaily

按已开专区聚合。

### StoreMetricDaily

商店漏斗。

### DeviceMetricDaily

下载、同步、安装、失败。

## 11. 运营看板

MVP 运营看板：

- 今日有效播放。
- 今日发布作品。
- 今日新增创作者。
- 推荐池作品数。
- 高举报作品。
- 待审核作品。
- 商店申请漏斗。
- HardwarePack 可用数量。
- 同步成功率。
- 热门 IP。
- 开区候选 IP。

## 12. 隐私和合规

数据采集原则：

- 只采业务需要的数据。
- 未登录用户使用匿名 ID。
- 登录后才关联用户 ID。
- 敏感事件只给审核和运营看。
- 不采通讯录、精确定位等无关数据。
- 未成年人数据单独标记和限制使用。

## 13. MVP 落地

Phase 1:

- 统一事件模型。
- 记录播放、完播、选择分支、点赞、收藏、分享、评论、举报、Remix。
- `scorePack` 改为基于有效播放和安全指标。

Phase 2:

- 增加 Feed 来源：推荐、关注、IP/专区、题材、好友。
- 增加冷启动池。
- 增加商店候选池。

Phase 3:

- 增加商店和硬件漏斗：申请、审核、制作、购买、下载、同步、安装。
- 增加设备同步成功率看板。

Phase 4:

- 个性化推荐。
- 用户兴趣画像。
- A/B 测试。

## 14. 已确认规则

```text
1. 长期北极星是每周设备端有效体验数。
2. MVP 先看有效播放数和合格发布作品数。
3. 推荐先规则化，不急着个性化。
4. Feed 拆成推荐、关注、IP/专区、题材、好友、商店候选。
5. 二创内容可以参与全局热门，但必须通过 IP、审核、安全和举报阈值。
6. 专区开通热度由作品数、创作者数、有效播放、收藏、Remix、举报率综合计算。
7. 商店和硬件指标必须独立记录，不混在 H5 播放指标里。
```
