# Gugu Flash Closed Beta Legal Terms Draft

Status: draft for legal review. This is not legal advice and must be reviewed by qualified counsel before external beta, paid distribution, or public launch.

The machine-readable legal approval packet lives at `data/legal-approval-packet.json` and is validated with `npm run check:legal-approval`.

Primary official references:

- [中华人民共和国著作权法](https://www.npc.gov.cn/c2/c30834/202011/t20201119_308796.html)
- [中华人民共和国电子商务法](https://www.npc.gov.cn/npc/c1773/c1848/c21114/c31834/c31841/201905/t20190521_266893.html)
- [中华人民共和国个人信息保护法](https://www.cac.gov.cn/2021-08/20/c_1631050028355286.htm)
- [中华人民共和国消费者权益保护法](https://www.samr.gov.cn/zfjcj/tzgg/art/2023/art_615af9ed6bcd4974bf853dd2e02bc663.html)
- [中华人民共和国消费者权益保护法实施条例](https://www.gov.cn/gongbao/2024/issue_11266/202404/content_6944108.html)
- [网络购买商品七日无理由退货暂行办法](https://www.moj.gov.cn/pub/sfbgw/flfggz/flfggzbmgz/202101/t20210104_146551.html)

## 1. Product Boundary

Gugu Flash is a UGC H5 creation, IP-pool fanwork, store listing, and device-content sync product. A user-created H5 work is not the same as a device-ready HardwarePack. Store distribution and device sync require extra review, rights checks, and compatibility checks.

Closed beta scope:

- User-generated H5 works.
- Platform IP pool selection for fanwork.
- Store listing applications.
- Official or reviewed HardwarePack creation.
- Device-scoped purchase or free claim.
- Device sync, refund, takedown, rights claim, and appeal flows.

Closed beta exclusions:

- No creator cash payout.
- No account-wide purchase entitlement.
- No stranger direct messages.
- No CP, romantic binding, paid relationship, or co-creation cash split.
- No public launch until legal, privacy, payment, and device-release approval.

## 2. User Agreement Draft

### Account And Eligibility

- Users must provide accurate account information where required.
- Minors or users with unknown age are handled under conservative safety rules.
- Users may not evade restrictions, impersonate others, abuse refunds, or interfere with device sync and platform operations.

### User Content

- Users retain ownership of their legally owned content.
- By publishing content, users grant Gugu Flash a non-exclusive, worldwide, royalty-free license during the service period to host, store, reproduce as needed for technical operation, display, recommend, moderate, review, and share the content inside Gugu Flash.
- For content selected for store or hardware adaptation, the creator grants the platform permission to review, adapt, package, test, display, and distribute the resulting HardwarePack under the selected listing terms.
- Users must not upload content that infringes copyright, portrait/name rights, privacy, trade secrets, trademarks, or other rights.
- Users must not publish illegal, sexual, harassing, hateful, scam, self-harm, minor-risk, privacy-leaking, or unsafe device content.

### Fanwork And IP Pool

- Fanwork must select an IP from the platform IP pool.
- IP pool availability only means the IP can be selected for creation inside the product. It does not mean the platform confirms full commercial authorization.
- Fanwork may be published and reviewed, but store listing and hardware adaptation require separate review.
- Disputed, restricted, or blocked IP may be limited, frozen, delisted, or removed.

### Store, Purchase, And Device Entitlement

- Store items are HardwarePacks or official device-ready content, not the raw H5 work.
- Purchase or free claim creates an Order and a DeviceEntitlement scoped to a specific device.
- A user may need to claim or purchase again for another device unless otherwise stated.
- New purchase, download, and sync require online checks for entitlement, listing status, compatibility, storage, battery, and firmware.
- Provider payment callbacks must pass signature validation and use `providerEventId` as the idempotent event id before device entitlement is granted.

### Refunds

- Refunds revoke new download and new sync rights for the related device entitlement.
- Installed content may be kept or removed according to the refund policy shown or agreed for the case.
- Provider refund callbacks must use `providerEventId` as the idempotent event id so repeated provider notifications do not duplicate refunds.
- Digital content, downloaded content, device-specific entitlement, and customized/device-synced content need legal review for how seven-day no-reason return rules are presented and confirmed.

### Takedown, Freeze, And Legacy Use

- The platform may limit recommendation, hide comments, take down works, freeze store listings, pause hardware distribution, or freeze settlement records when content, rights, safety, payment, or device risk appears.
- Ordinary delisting or store freeze stops new purchase, new download, and new device sync.
- Already installed device content may remain usable unless law, safety, or severe rights risk requires stronger action.
- Users may appeal eligible actions according to the appeal policy.

### Privacy And Device Data

- Gugu Flash processes account, content, interaction, device, order, entitlement, sync diagnostic, report, rights claim, appeal, and operation log data for service operation, security, compliance, support, and product improvement.
- Device sync diagnostics may include device id, model, firmware version, battery, storage, transport protocol, sync steps, failure reason, rollback status, and diagnostic code.
- Sensitive personal information, minors' information, and cross-border data handling require separate privacy and security review before public launch.

### Service Changes And Termination

- The platform may change beta features, pause unsafe features, remove illegal content, restrict abusive accounts, and end closed beta features with notice where appropriate.
- Users remain responsible for preserving their own source materials and rights evidence.

### Dispute Handling

- Complaints, rights notices, refund disputes, and appeals should be submitted through platform support or operator channels.
- Governing law, jurisdiction, arbitration, and consumer complaint language must be approved by legal counsel before public release.

## 3. Creator Terms Draft

### Creator Declarations

Creators must declare:

- Content origin: original or fanwork.
- Selected IP pool item for fanwork.
- Material source and external assets.
- Whether the work uses real persons, public figures, names, portraits, voices, schools, contact information, or sensitive personal data.
- Whether the creator owns or has permission for submitted material.

### Creator License To Platform

For submitted works, the creator grants Gugu Flash permission to:

- Store and render the work.
- Show it in feeds, IP zones, profile pages, sharing pages, and review tools.
- Create thumbnails, previews, compatibility reports, and safety labels.
- Review, limit, reject, delist, or remove it according to governance policy.
- If selected, adapt the work into an official HardwarePack for beta testing and store distribution according to listing terms.

### No Cash Revenue In Closed Beta

- Closed beta creator rewards are attribution, badges, points, featured placement, and operational promotion.
- Creator cash revenue share is not enabled.
- Cash revenue share requires later creator verification, tax/payment setup, payout terms, refund rules, settlement rules, and legal approval.

### Creator Responsibilities

Creators are responsible for:

- Rights accuracy of their declarations.
- Keeping authorization evidence.
- Removing or correcting infringing or unsafe material.
- Responding to rights claims and appeal requests.

### Platform Actions

The platform may:

- Reject store listing or hardware adaptation.
- Freeze store listing and settlement during rights disputes.
- Remove or limit works after reports, claims, or safety review.
- Keep evidence, operation logs, and snapshots for dispute handling.

## 4. Store Listing Terms Draft

### Listing Application

A store listing application requires:

- Published work id and immutable work version.
- Creator identity and applicant user id.
- Content origin and selected IP pool item.
- Rights acknowledgement timestamp.
- Material source statement.
- External asset and real-person disclosure.
- Price or reward mode.
- Hardware compatibility report before device availability.

### Review And Approval

- Store listing is not automatic.
- Rights/content review must pass before listing.
- HardwarePack production and device availability are separate from H5 publication.
- The platform may reject, delist, freeze, or pause distribution with reason and audit log.

### Buyer Terms

- Buyers or claimants receive a device-scoped entitlement.
- Download and sync require compatible device state.
- Delisted or frozen content may remain on already installed devices but cannot be newly purchased, downloaded, or synced unless restored.
- Refund handling follows the refund policy and provider callback state.

### Digital Content And Return Notices

Before paid external beta, purchase UI must clearly state:

- Item type: digital HardwarePack / device content.
- Device entitlement scope.
- Whether content is downloadable or already synced.
- Refund conditions and installed-content policy.
- Any seven-day no-reason return exclusion or limitation that legal counsel approves.

### Rights Disputes

- Rights claim may freeze listing, pause hardware distribution, and freeze settlement.
- Creator may submit counter-evidence or appeal.
- Restoration requires review result, evidence, and operation log.

## 5. Rights Claim And Appeal Policy Draft

### Notice Intake

Rights claim should collect:

- Claimant identity and contact or platform account.
- Target type and target id.
- Claim type and summary.
- Evidence file ids or evidence statement.
- Requested action.

### Platform Response

- Plausible claims may trigger freeze, limit recommendation, take down, or escalation.
- The platform records target snapshot, operator reason, revenue/settlement snapshot, and operation log.
- The platform may reject unsupported claims or request more evidence.

### Appeal

Appeal should collect:

- Source case id.
- Appellant statement.
- Supplemental evidence.
- Requested result.

Appeal outcomes:

- restore
- keep_action
- modify_required
- escalate

## 6. Privacy Notice Draft Checklist

Closed beta privacy notice must cover:

- Account and session data.
- UGC content, comments, reports, claims, appeals, and moderation logs.
- IP pool, creator declarations, rights evidence, and store listing materials.
- Device id, model, firmware, battery, storage, active content, sync jobs, and diagnostic code.
- Orders, entitlements, payment/refund callbacks, settlements, and support cases.
- Purpose, retention, sharing, user rights, minors, sensitive data, and contact channel.

The full privacy notice is a separate legal deliverable before public launch.

## 7. Legal Approval Checklist

Required before closed beta with external users:

- Legal counsel approves user agreement.
- Legal counsel approves creator terms.
- Legal counsel approves store listing and refund terms.
- Privacy owner approves closed-beta privacy notice.
- Product owner confirms UI has affirmative acceptance for store listing and purchase-risk notices.
- Trust lead confirms rights notice, appeal, and takedown workflow.
- Commerce lead confirms payment/refund callback signature, idempotency, and payment provider wording.
- Hardware lead confirms device sync risk notice and diagnostic handling.
- Legal approval packet records counsel-facing documents, privacy categories, risk disclosures, in-app acceptance UX evidence, and pending external signoffs.

Required before public MVP:

- Production privacy notice.
- Production user agreement.
- Production store/purchase/refund terms.
- Creator payout agreement if cash revenue share opens.
- Payment provider merchant terms.
- App distribution terms.
- Security and data retention review.
