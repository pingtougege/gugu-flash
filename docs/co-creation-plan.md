# Co-Creation Plan

这份文档展开 `04. 共创还没有真正成立`。目标是让 Gugu Flash 从“个人创作 + Remix”升级到真正的多人协作，但先不做实时协同编辑。

## 当前决策

共创暂缓，不进入当前 MVP。

当前阶段保留：

```text
个人创作
Remix
好友动态里的共创概念占位
```

当前阶段不做：

```text
CollabDraft
共创邀请接受/拒绝
多人贡献记录
发布前多人确认
共创收益分配
共创上架签署
```

后续如果重新启动共创，可以回到本文档继续讨论。

## 1. 结论先行

MVP 先做异步共创：

```text
一个主创创建 CollabDraft
  -> 绑定一个 IP 和一个或多个分身
  -> 邀请好友参与
  -> 成员补台词/选项/结局/场景建议
  -> 主创整理成可发布版本
  -> 发布前所有关键贡献者确认署名和权利
  -> 发布到内容流
  -> 如需上架，再进入商店/硬件链路
```

暂时不做：

```text
多人实时编辑
复杂分成自动结算
跨 IP 大乱斗
公开共创房
陌生人无限加入
```

## 2. 共创和 Remix 的区别

### Remix

Remix 是基于一个已发布作品派生新作品。

```text
source Work
  -> cloneAsRemix
  -> new Work
```

特点：

- 单人也能完成。
- 默认是二创。
- 来源作品记录在 `remixOf / fanworkOf`。

### Co-Creation

共创是在作品发布前，多人共同完成一个草稿。

```text
CollabDraft
  -> contributions
  -> publish as Work
```

特点：

- 有成员、邀请、权限和贡献记录。
- 发布前需要确认署名和权利。
- 上架时需要处理多个贡献者的承诺和收益。

## 3. 共创绑定范围

MVP 规则：

```text
一个 CollabDraft 绑定一个 IP。
分身必须来自该 IP。
题材标签可以多个。
```

不建议 MVP 做跨 IP 共创。原因：

- 权利和审核更复杂。
- 角色关系更难约束。
- 推荐和专区归属不清。

后续可以做跨 IP 特殊玩法，但要独立审核。

## 4. 共创角色

### owner

主创。

权限：

- 创建共创草稿。
- 邀请成员。
- 接受/拒绝贡献。
- 整理最终版本。
- 发起发布。
- 发起商店上架申请。

### collaborator

协作者。

权限：

- 查看草稿。
- 提交贡献。
- 评论/建议。
- 确认发布署名。
- 对商店上架进行权利确认。

### reviewer

可选。只看不写。

权限：

- 查看草稿。
- 留建议。

## 5. 共创流程

### 创建

```text
选择原创/二创
选择 IP
选择分身
选择题材/模板
创建 CollabDraft
邀请好友
```

### 邀请

```text
owner 发送邀请
被邀请人接受/拒绝
接受后成为 collaborator
```

邀请字段：

```text
draftId
inviterId
inviteeId
role
message
status
expiresAt
```

### 贡献

协作者提交贡献，不直接覆盖主稿。

贡献类型：

```text
dialogue
choice
scene
ending
persona_line
asset_suggestion
comment
```

贡献状态：

```text
submitted
accepted
rejected
merged
withdrawn
```

### 整理

主创把 accepted contribution 合并为作品版本。

合并后要保留：

```text
谁贡献了什么
合并到哪个场景
合并时间
是否作为署名贡献
```

### 发布确认

发布前进入确认步骤：

```text
确认标题
确认 IP
确认分身
确认题材
确认贡献者署名
确认是否允许 Remix
确认是否允许后续申请上架
```

MVP 推荐：

- 只要进入署名贡献列表的成员，都要确认发布。
- 未确认成员的贡献可以移除后发布。

## 6. 上架和硬件规则

共创作品上架比普通作品更复杂。

### 商店上架

已确认商店链路：

```text
Work
  -> StoreListing
  -> 后台制作 HardwarePack
  -> 审核通过
  -> 设备可下载
```

共创作品申请上架时：

```text
owner 发起上架申请
所有署名贡献者确认权利承诺
StoreListing 进入 rights_review
```

如果有人不确认：

```text
移除其贡献后重新提交
或放弃上架
```

### 硬件适配

后台制作 HardwarePack 时，要保留：

```text
sourceWorkId
collabDraftId
contributorIds
rightsAcknowledgementIds
```

## 7. 收益归属

当前已确认商店购买按设备区分，每台设备单独购买/领取。

共创收益建议先用简单规则：

```text
MVP:
  收益归 owner，collaborator 只署名。

后续:
  支持 owner 设置分成比例。
  每个 contributor 上架前确认比例。
```

原因：

- 早期自动分账成本高。
- 贡献质量很难自动量化。
- 共创上架量还需要验证。

可选后续分成模型：

```text
owner_fixed
  owner 获得全部收益。

equal_split
  署名贡献者均分。

custom_split
  owner 设置比例，成员确认。

no_revenue
  仅荣誉/积分，不开放现金收益。
```

## 8. 成员退出和撤回

### 发布前退出

成员可以退出。

规则：

- 退出后不再访问草稿。
- 已提交但未合并的贡献自动撤回。
- 已合并贡献需要处理。

已合并贡献处理：

```text
成员允许保留:
  继续保留贡献和署名。

成员要求撤回:
  owner 移除相关贡献后才能发布。
```

### 发布后退出

发布后不建议允许单方面撤回已确认贡献。

规则：

- 署名保留。
- 如果涉及投诉或权利争议，进入 ReviewTask/RightsClaim。
- 商店上架前仍需单独确认权利承诺。

## 9. 权限和隐私

CollabDraft.visibility:

```text
private
invite_only
link_access
public_recruiting
```

MVP 建议只做：

```text
private
invite_only
```

原因：

- 降低陌生人骚扰和治理风险。
- 好友关系还没有完整 IM/社交图谱。
- 公开招募容易变成社区治理问题。

## 10. 数据模型草案

### CollabDraft

```json
{
  "id": "collab_123",
  "ownerId": "user_1",
  "title": "下班回血提醒",
  "contentOrigin": "fanwork",
  "ipId": "ip_workday_gugu",
  "personaIds": ["persona_office_sprite"],
  "genreTags": ["摸鱼上班"],
  "status": "editing",
  "visibility": "invite_only",
  "allowRemix": true,
  "allowStoreApplication": true,
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### CollabMember

```json
{
  "draftId": "collab_123",
  "userId": "user_2",
  "role": "collaborator",
  "status": "accepted",
  "displayName": "Noa",
  "joinedAt": 1760000000000
}
```

### CollabContribution

```json
{
  "id": "contrib_123",
  "draftId": "collab_123",
  "authorId": "user_2",
  "type": "ending",
  "targetSceneId": "scene_3",
  "content": {
    "text": "下班铃响起，工位小闪把最后一点光塞进口袋。",
    "character": "💡"
  },
  "status": "submitted",
  "mergedIntoSceneId": null,
  "createdAt": 1760000000000
}
```

### CollabAcknowledgement

```json
{
  "id": "ack_123",
  "draftId": "collab_123",
  "userId": "user_2",
  "ackType": "publish",
  "status": "accepted",
  "acceptedAt": 1760000000000
}
```

## 11. 状态机

### CollabDraft.status

```text
editing
publish_confirming
published
archived
cancelled
```

### CollabInvitation.status

```text
pending
accepted
declined
expired
revoked
```

### CollabContribution.status

```text
submitted
accepted
rejected
merged
withdrawn
```

### CollabAcknowledgement.status

```text
pending
accepted
declined
expired
```

## 12. API 草案

```text
POST /collab-drafts
GET  /collab-drafts/:id
PATCH /collab-drafts/:id
POST /collab-drafts/:id/invitations
POST /collab-invitations/:id/accept
POST /collab-invitations/:id/decline

POST /collab-drafts/:id/contributions
POST /collab-contributions/:id/accept
POST /collab-contributions/:id/reject
POST /collab-contributions/:id/withdraw

POST /collab-drafts/:id/publish-confirmation
POST /collab-acknowledgements/:id/accept
POST /collab-acknowledgements/:id/decline
POST /collab-drafts/:id/publish
```

## 13. 原型落地建议

### Phase 1

- 好友页的“共创邀请”改成真实 mock 数据。
- 增加 `CollabDraft` mock API。
- 用户可以接受/拒绝邀请。
- 共创草稿显示成员和贡献列表。

### Phase 2

- 支持提交台词/选项/结局贡献。
- owner 可以接受/拒绝贡献。
- 合并 accepted contribution 到草稿。

### Phase 3

- 发布前确认署名。
- 生成 `Work` 时保留 `collabDraftId` 和贡献者。
- 个人页展示“我参与的作品”。

### Phase 4

- 上架申请时要求署名贡献者确认权利承诺。
- StoreListing 记录贡献者确认。
- 后台制作 HardwarePack 时保留共创来源。

## 14. 当前需要拍板

### A. MVP 是否只做邀请制异步共创？

建议：

- 是。
- 先不做实时编辑和公开招募。

### B. 发布前是否需要所有署名贡献者确认？

建议：

- 是。
- 未确认贡献者的贡献可以移除后发布。

### C. 商店上架是否需要所有署名贡献者签署权利承诺？

建议：

- 是。
- 否则无法安全进入后台制作 HardwarePack。

### D. 共创收益 MVP 怎么处理？

建议：

- MVP 收益归 owner。
- collaborator 先获得署名和作品参与记录。
- 后续再做自定义分成。

### E. 成员发布前退出怎么办？

建议：

- 未合并贡献自动撤回。
- 已合并贡献如果成员要求撤回，owner 需要移除后再发布。

## 15. 建议确认的最小规则

```text
1. MVP 只做邀请制异步共创。
2. 一个共创草稿绑定一个 IP。
3. 分身必须来自该 IP。
4. 协作者提交贡献，owner 决定是否合并。
5. 发布前需要所有署名贡献者确认。
6. 商店上架前需要所有署名贡献者签署权利承诺。
7. MVP 收益归 owner，协作者获得署名。
8. 成员发布前可退出，未确认贡献可移除后发布。
```
