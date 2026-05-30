# IP Rights Governance Plan

这份文档展开 `02. IP 与版权治理不足`。它不是法律意见，而是 Gugu Flash 的产品治理方案；正式上线前需要法务复核用户协议、权利承诺、投诉流程和商店协议。

## 1. 已确认规则

```text
1. 二创必须从平台 IP 池选择 IP，不能自由手填。
2. 用户可以申请添加 IP。
3. IP 审核通过后进入 IP 池，不自动生成 IP 专区。
4. IP 池内未受限 IP 都可以进入推荐、商店、硬件链路。
5. 推荐、商店、硬件的门槛是对应审核，不按 IP 类型一刀切。
6. 用户权利承诺不能替代平台审核、投诉、下架、申诉和证据留存。
7. IP 入池只做轻审核，重点看重复、明显违规和治理风险。
8. 商店上架必须要求素材来源说明。
9. 权利投诉初步成立时，平台可以先下架/限流/冻结，再进入用户申诉。
10. disputed IP 暂停商店和硬件链路。
```

关键边界：

```text
IP 入池 = 允许在平台内选择和创作
IP 入池 != 平台确认拥有完整商业授权
商店上架 = 需要单独权利/内容审核
硬件适配 = 需要人工审核和官方适配
```

## 2. 法律锚点

产品设计至少要覆盖这些原则：

- 著作权包含复制、发行、改编、汇编、信息网络传播等权利。二创、传播、商店售卖和硬件包都可能触及不同权利类型。参考：[中华人民共和国著作权法 - 中国人大网](https://www.npc.gov.cn/c2/c30834/202011/t20201119_308796.html)。
- 网络服务提供者收到权利通知后，需要采取删除、屏蔽、断开链接等必要措施，并转送通知。参考：[中华人民共和国民法典 - 中国政府网](https://www.gov.cn/xinwen/2020-06/01/content_5516649.htm)。
- 如果平台涉及商品/服务交易，知识产权保护规则、通知处理和必要措施更重要。参考：[中华人民共和国电子商务法 - 商务部](https://m.mofcom.gov.cn/article/zt_dzswf/)。

落地原则：

```text
先允许创作
保留审核和下架能力
保留证据
接收权利投诉
允许用户申诉
高风险商业化必须加强审核
```

## 3. 权利治理对象

需要治理的不是单个字段，而是一组对象。

```text
IPZone
  IP 池里的 IP/世界观/原创企划。

Persona
  IP 内角色分身。

Work
  用户发布的 H5 作品。

StoreListing
  商店上架申请和商品。

HardwarePack
  官方适配后的硬件内容包。

RightsClaim
  权利人投诉、平台处理、用户申诉的记录。

RightsEvidence
  用户或平台提交的授权材料、来源说明、承诺记录。
```

## 4. IP 入池规则

用户可以申请添加 IP。

申请后不直接进入可用池，先进入 `IPApplication`。

### IPApplication.status

```text
draft
submitted
approved
rejected
merged
restricted
blocked
```

### 申请字段

```text
IP 名称
别名
IP 类型：用户原创 / 外部 IP / 不确定
简介
来源说明
是否有授权
授权材料，可选
是否允许他人二创
建议角色分身
申请理由
申请人
```

### 审核结果

```text
approved
  进入 IP 池，可创作；不自动生成专区。

rejected
  不进入 IP 池，用户可修改后重新提交。

merged
  与已有 IP 重复，合并到主 IP。

restricted
  保留记录，但限制创作/推荐/商店/硬件。

blocked
  禁止添加和传播。
```

## 5. IP 权利状态

IP 类型和权利状态要分开。

### originType

```text
platform_original
user_original
authorized_ip
fan_ip
```

### rightsStatus

```text
platform_owned
  平台原创或平台完全可控。

licensed
  平台拥有明确授权，按授权范围使用。

user_declared
  用户声明原创或声明拥有授权。

community_reference
  社区可讨论/二创，但没有完整商业授权证明。

disputed
  存在权利争议或投诉处理中。

restricted
  权利或治理风险较高，限制传播/上架/硬件。

blocked
  禁止传播和新增。
```

### eligibility

最终能不能走某条链路由 eligibility 决定：

```text
allowCreate
allowRecommend
allowStoreListing
allowHardwareCandidate
```

默认：

```text
active + 未受限:
  四项都可以

disputed:
  暂停商店和硬件，视情况限流

restricted / blocked:
  阻断推荐、商店、硬件
```

## 6. 发布治理

已确认：

- 原创和普通二创都先发后审。
- 发布后进入 `public_limited`。
- 审核通过后进入 `public`。

发布时要记录：

```text
contentOrigin
ipId
personaId
genreTags
素材来源声明
是否上传图片/音频/字体
是否涉及真人/公众人物
AI 生成标记，后续可加
```

普通发布不要求完整授权材料，但必须保留：

```text
用户选择的 IP
用户声明
发布时间
内容快照
素材清单
```

## 7. 商店上架治理

所有未受限 IP 都可以申请商店上架，但必须经过权利/内容审核。

### 上架申请材料

```text
作品 ID
IP ID
IP 权利状态
作品类型：原创 / 二创
素材来源说明
是否上传第三方图片/音频/字体
是否涉及真人姓名/肖像/声音
是否有授权材料
授权材料附件
用户权利承诺
定价
收益接收方
```

### 权利承诺

用户至少确认：

```text
我确认该作品为原创，或我已取得/自行承担相关 IP 与素材授权风险。
我确认作品不侵犯第三方著作权、商标权、肖像权、名誉权等权益。
如发生权利投诉，我同意配合提供证明材料。
平台可根据投诉、审核或法律要求下架、限制传播、冻结收益或终止上架。
```

### StoreListing.reviewStatus

```text
submitted
rights_review
approved
listed
rejected
delisted
frozen
```

### 商店审核动作

```text
approve
reject
request_more_info
delist
freeze_revenue
restore
```

## 8. 硬件适配治理

所有未受限 IP 都可以进入硬件候选，但硬件适配必须人工审核。

硬件审核比商店更严格，因为它代表官方适配和设备分发。

### 硬件审核材料

```text
作品 ID
IP ID
StoreListing ID，可选
权利材料
素材清单
设备兼容报告
内容安全审核结果
品牌质量审核结果
```

### 硬件风险处理

```text
权利不清楚:
  暂停适配，要求补充材料。

收到投诉:
  暂停硬件下载，必要时下架 HardwarePack。

已安装到设备:
  视投诉严重程度决定是否保留本地使用、禁用再次下载或强制替换。
```

## 9. 投诉与下架机制

必须建立 `RightsClaim`。

### RightsClaim.status

```text
submitted
triage
action_taken
counter_notice_waiting
restored
closed
rejected
escalated
```

### 投诉材料

```text
投诉人身份
权利证明
被投诉对象：IP / 分身 / 作品 / 商店商品 / 硬件包
投诉理由
侵权说明
联系方式
声明真实性
```

### 平台处理动作

```text
删除/下架作品
屏蔽链接
限制推荐
暂停商店上架
冻结收益
暂停硬件下载
限制 IP
限制分身
转送通知给用户
要求用户补充材料
```

### 用户申诉

用户可以提交：

```text
原创证明
授权证明
合理使用说明
素材来源说明
误投诉说明
修改后的作品版本
```

申诉结果：

```text
restore
keep_taken_down
modify_required
escalate_to_legal
```

## 10. 收益冻结

只要作品进入商店，就要考虑收益冻结。

触发：

```text
权利投诉提交且初步成立
IP 进入 disputed/restricted
商店上架材料被发现不实
平台人工复核认为高风险
```

冻结对象：

```text
StoreListing 收益
创作者分成
IP 创建者分成，后续如果设计
共创成员分成，后续如果设计
```

解冻：

```text
投诉撤回
申诉成功
补充材料通过
法务/运营确认可恢复
```

## 11. IP 级处置

IP 不是只增不减。必须有 IP 级处置。

```text
active
  正常创作、推荐、上架、硬件。

disputed
  权利争议中，暂停商店和硬件，推荐降权。

restricted
  禁止新增作品，暂停推荐、商店、硬件。

blocked
  禁止新增和传播，存量内容批量下架或不可见。
```

批量影响：

```text
限制 IP
  -> 该 IP 下新作品禁止发布
  -> 分身禁止新增
  -> StoreListing 暂停申请
  -> HardwareCandidate 暂停

封禁 IP
  -> 作品下架或不可见
  -> 商店下架
  -> 硬件包暂停下载
```

## 12. 角色分身权利治理

分身也可能侵权或冒充。

风险点：

```text
明星真人
公众人物
用户真人
高度相似商业角色
使用外部头像
使用真实姓名/艺名
仿冒官方角色
```

治理规则：

```text
分身必须归属 IP
分身创建需要记录创建者和来源说明
高风险分身进入审核
被投诉分身可限制新增作品
分身被封禁后，触发关联作品复审
```

## 13. 数据模型草案

### RightsEvidence

```json
{
  "id": "rights_ev_123",
  "targetType": "ip_zone",
  "targetId": "ip_abc",
  "evidenceType": "authorization_file",
  "sourceNote": "用户上传授权说明",
  "fileIds": ["file_1"],
  "submittedBy": "user_123",
  "reviewStatus": "pending",
  "createdAt": 1760000000000
}
```

### RightsClaim

```json
{
  "id": "claim_123",
  "claimantName": "权利人名称",
  "targetType": "work",
  "targetId": "h5_abc",
  "claimType": "copyright",
  "status": "triage",
  "summary": "投诉该作品未经授权使用角色与剧情设定",
  "evidenceFileIds": ["file_2"],
  "actions": ["limit_recommend", "notify_creator"],
  "createdAt": 1760000000000,
  "updatedAt": 1760000000000
}
```

### IPZone rights fields

```json
{
  "id": "ip_abc",
  "originType": "fan_ip",
  "rightsStatus": "community_reference",
  "governanceStatus": "active",
  "allowCreate": true,
  "allowRecommend": true,
  "allowStoreListing": true,
  "allowHardwareCandidate": true,
  "rightsEvidenceIds": [],
  "activeClaimCount": 0
}
```

## 14. API 草案

```text
POST /ip-applications
GET  /ip-applications?status=submitted
POST /ip-applications/:id/approve
POST /ip-applications/:id/reject
POST /ip-zones/:id/restrict
POST /ip-zones/:id/block

POST /rights-evidence
GET  /rights-evidence?targetType=ip_zone&targetId=:id
POST /rights-evidence/:id/review

POST /rights-claims
GET  /rights-claims?status=triage
POST /rights-claims/:id/take-action
POST /rights-claims/:id/counter-notice
POST /rights-claims/:id/restore
POST /rights-claims/:id/close

POST /store-listings/:id/freeze-revenue
POST /store-listings/:id/unfreeze-revenue
```

## 15. 原型落地建议

### Phase 1

- 二创从 IP 池选择。
- 增加“申请添加 IP”入口。
- IP 申请通过后进入 IP 池。
- IP 有 `active / restricted / blocked`。

### Phase 2

- 商店上架材料增加素材来源、授权材料、真人/公众人物声明。
- 上架审核支持驳回、要求补充材料。
- 上架后支持下架和冻结收益状态。

### Phase 3

- 增加权利投诉入口。
- 官方台增加 RightsClaim 队列。
- 投诉成立后可下架作品、限制 IP、暂停商店/硬件。

### Phase 4

- 增加用户申诉。
- 增加 IP 合并、别名和重复治理。
- 增加批量影响：IP 限制后联动作品、分身、商店和硬件。

## 16. 已确认治理规则

本轮已确认这些规则：

```text
1. IP 入池不等于授权确认，只代表可选择和可创作。
2. active IP 都可以申请推荐、商店、硬件，但必须过对应审核。
3. 商店上架必须记录权利承诺、素材来源和授权材料字段。
4. 权利投诉初步成立时，可以下架/限流/冻结收益/暂停硬件下载。
5. 用户可以申诉，平台保留证据和处理记录。
6. IP 进入 restricted/blocked 后，联动限制作品、分身、商店和硬件。
7. IP 入池只做轻审核。
8. 商店上架必须要求素材来源说明。
9. 权利投诉初步成立时，可以先处置再申诉。
10. disputed IP 暂停商店和硬件。
```
