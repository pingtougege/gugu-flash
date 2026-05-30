# Gugu Flash Full-Platform Execution Plan

This plan is the working checklist for turning the current static prototype into a full-platform Gugu Flash product. The implementation should proceed automatically in small slices without pausing for product confirmation.

## Product North Star

Gugu Flash is a full-platform social content app for electronic badge fans:

```text
browse interactive H5 badge works
  -> play and react
  -> create or remix in seconds
  -> form light social relationships around works
  -> official operators curate popular works
  -> selected works are adapted into hardware-downloadable content
```

Ordinary users create H5 content. Official tooling adapts only selected, reviewed works into hardware content.

## Platform Shape

```text
packages/core
  shared GuguH5Pack protocol, validation, ranking, draft/remix factories

packages/api-client
  replaceable API facade used by every client

packages/design-tokens
  shared visual and interaction tokens

apps/web
  Web/H5 prototype, share pages, creator preview, public player, badge management and store prototype

apps/native
  future iOS/Android primary daily app

apps/miniprogram
  future WeChat acquisition and device/account bridge

apps/operator
  future review, curation, hardware candidate, and Hardware Studio console
```

## Legacy References

`guguclub` is deprecated. Gugu Flash is the replacement system, not a frontend shell on top of the old project.

### Legacy Backend Reference

Old backend conventions can be studied for migration only:

- Spring/Maven multi-service backend.
- Controllers use `@RestController` and route prefixes such as `/user`, `/device`, `/content`.
- Responses are wrapped in `CommonHttpResponse<T>`.
- Business payload is under `body.data`; result state is under `body.code` and `body.message`.
- Success uses `ResCode.CODE_OK` with code `200`.
- Client identity commonly arrives through `Customer-Uuid` request header.
- Existing device content routes:
  - `GET /content/check?deviceId=...&current=pack:version`
  - `GET /content/pull?pack=...&v=...`
  - `POST /content/import`
  - `POST /content/asset/upload`

Gugu Flash should define its own API and response shape. Do not keep old backend response wrappers as a product dependency.

### Legacy Hardware Reference

Old hardware constraints can be used as reference:

- Hardware story engine loads JSON and prefers `START_HOOK` as entry.
- Stable root fields include `pack_id`, `version`, `min_ver`, `force`, `checksum`, `assets`, and `nodes`.
- Stable node fields include `id`, `type`, `text`, `media`, `sfx`, `cond`, `eff`, `roles`, `goto`, `options`, and `childNodes`.
- Stable node types include `NARR`, `CHOI`, `SITE`, and `DUO`.
- `SITE.id` must be ASCII and at most 31 characters for the current hardware path.
- H5 content must remain a richer consumer format; hardware conversion happens only after official review.

## Page And Interaction Plan

### 1. Flash Feed

Purpose: primary Duoshan-like full-screen consumption loop.

Content:

- one full-screen `GuguH5Pack` at a time
- author avatar/name
- IP label from the platform IP pool, plus zone label when opened
- role persona clone inside that IP: avatar, persona name, persona tagline later
- genre/channel labels: emotional companion, workday, duo-sync, pixel adventure
- rights label: original or derivative work, with selected IP for derivative works
- title, one-line story hook, tags
- hardware state: H5 only, hardware candidate, hardware ready
- right-side actions: like, save, comment, remix, share
- top feed modes: recommended, following, nearby/same-interest

Interactions:

- vertical next/previous switching in the prototype
- tap primary CTA to enter H5 player
- right actions update interaction metrics
- remix creates a new derived work
- author/profile surface should be reachable from the work metadata later

### 2. H5 Player

Purpose: play one interactive work.

Content:

- full-screen scene background
- character or visual center
- speaker and dialogue text
- choice buttons
- completion CTA at the end

Interactions:

- choose actions to move scenes
- replay from start
- future: long-press quote, comment from a scene, branch completion tracking

### 3. Create Page From Mine

Purpose: keep creation reachable from the "Mine" page without occupying a bottom tab.

Content:

- prompt input
- original/derivative selector
- IP pool selector when derivative is selected
- original IP selector/creator when original is selected
- role persona selector scoped to the selected IP
- genre/template selector
- template presets
- AI draft preview
- recent drafts later
- remix source when applicable

Interactions:

- open from Mine profile entry or Mine top action
- prompt to structured H5 draft
- publish to feed without store listing
- derivative drafts cannot be generated/published until an IP is selected from the platform IP pool
- future: edit title, cover, scenes, branches, tags, visibility, review status

### 4. Friends

Purpose: first main tab for friend activity and light social loops around content.

Content:

- friend activity
- co-creation invites
- remix notifications
- comments and likes from friends
- private messages later

Interactions:

- open conversation later
- quick reply later
- accept co-creation later

### 4a. IP Zones, Personas, And Genres

Purpose: borrow the useful part of role-play social products without depending on real celebrities or unlicensed IP.

Content:

- platform IP pool: platform original, user original, authorized IP, community fan IP
- IP zones as the later community container after threshold and user application
- official and user-facing personas scoped to an IP
- genre labels: emotional companion, workday, duo-sync, pixel adventure
- derivative metadata: `contentOrigin=fanwork`, `ipId`, `ipName`

Interactions:

- creation starts by picking original/derivative, IP, persona, and genre/template
- remix becomes a derivative work and preserves source ancestry
- derivative works must select an IP from the platform IP pool
- feed and friend activity expose IP and persona, plus IP zone when one has been opened
- later: IP zone home pages, persona profile pages, co-creation rooms per IP/persona

### 5. Badge

Purpose: fourth main tab for electronic badge device management.

Content:

- active bound device summary
- battery, online state, current content
- owned/downloaded/synced content counters
- installed content for the active device
- bound device list
- device model, status, battery, bound time later
- entry button to the standalone store page

Interactions:

- bind a new electronic badge
- switch the active sync target
- unbind a device
- open the store page
- future BLE/native handoff for app, mini program bridge where possible

### 6. Store

Purpose: commercial content distribution, separate from ordinary H5 publishing, for hardware-downloadable packs.

Content:

- current sync target device
- only `listed` works appear in the store
- store item shows IP, zone if opened, persona, original/derivative label, and derivative IP when present
- official content packs adapted from selected H5 works later
- price/free label
- ownership state
- download state
- sync state for the selected device

Interactions:

- user applies from a published work in Mine/Profile
- application requires a rights acknowledgement: original ownership or user responsibility for IP/material authorization
- submitted works enter `rights_review`
- operator approves listing before it appears in the store
- derivative works should not become hardware candidates until listing/rights review has passed
- purchase or claim content pack
- download purchased content
- sync downloaded content to the active device
- switch target by returning to Badge and choosing another bound device
- view adaptation source H5 work later

### 7. Mine

Purpose: personal identity, creator inventory, quick creation, and hardware achievement display.

Content:

- profile header
- stats: works, likes, remixes, hardware picks
- entry to the standalone Create page
- works, favorites, drafts
- device badge achievement

Interactions:

- open Create page
- open my work
- continue draft later
- edit profile later

### 8. Operator

Purpose: internal curation and hardware candidate workflow.

Content:

- trending works
- public/candidate/ready counts
- risk and hardware-readiness status later

Interactions:

- mark H5 work as hardware candidate
- mark adapted work as hardware ready
- later export to Gugu Flash Hardware Studio

## API Plan

The frontend should call a local API facade first, then switch the facade to real backend routes later.

Initial facade methods:

```text
getFeed()
getWork(id)
createDraft(prompt, template)
publishDraft(pack)
remixWork(id)
recordInteraction(id, type)
getFriends()
getDeviceDashboard()
selectDevice(id)
bindDevice()
unbindDevice(id)
purchaseBadgePack(id)
downloadBadgePack(id)
syncBadgePack(id)
getProfile()
getOperatorTrending()
markHardwareCandidate(id)
markHardwareReady(id)
```

Future backend route candidates:

```text
GET    /flash/feed
GET    /flash/h5-packs/{id}
POST   /flash/h5-packs
POST   /flash/h5-packs/{id}/remix
POST   /flash/h5-packs/{id}/interactions
GET    /flash/friends
GET    /flash/device/dashboard
POST   /flash/device/bind
POST   /flash/device/{id}/select
POST   /flash/device/{id}/unbind
GET    /flash/badge/store
POST   /flash/badge/store/{id}/purchase
POST   /flash/badge/store/{id}/download
POST   /flash/badge/store/{id}/sync
GET    /flash/me/profile
GET    /flash/operator/trending
POST   /flash/operator/hardware-candidates
POST   /flash/operator/hardware-ready
```

Gugu Flash backend should use a simple shared response shape:

```json
{
  "code": 200,
  "message": "ok",
  "data": {}
}
```

## Execution Slices

### Slice 1: App Shell And Page Skeleton

Status: completed.

- use a Duoshan-like shell extended to four tabs: Friends / Flash Feed / Badge / Mine
- keep the full-screen feed as the centered default page
- keep creation reachable from Mine instead of a bottom tab
- keep Badge as the fourth bottom tab
- keep Store as a standalone page opened from Badge
- keep Operator accessible for now as an internal button

### Slice 2: API Facade

Status: completed for the mock facade foundation.

- add `packages/api-client/src/mock-flash-api.js`
- move feed mutations out of raw UI handlers
- keep local storage as the persistence adapter for the mock API
- make UI code call the facade rather than manipulating packs directly where practical

### Slice 3: Creator Upgrade

Status: completed for the first standalone Create page pass.

- move creator out of Mine content into a standalone page
- keep Mine as the entry point and personal inventory surface
- add draft metadata editor
- add scene list preview
- apply edited title and tags before publish
- add H5 review status fields later

### Slice 4: H5 Player Upgrade

Status: completed for the first ending-action pass.

- detect ending/replay state
- add completion actions for save and Remix
- track scene progress later
- add completion actions for comment, follow, and save quote later

### Slice 5: Device And Store

Status: completed for the first mock pass.

- show multiple bound devices
- bind a new mock device
- switch active device
- unbind a device
- keep store as an independent page
- show official store packs using selected H5 works as source
- support purchase, download, and sync states
- sync content to the active selected device
- define backend handoff contract for app/mini program

### Slice 6: Official Picks

Status: planned.

- separate public H5 popularity from official hardware eligibility
- show official picks using `hardware_ready` and `hardware_candidate`
- add source H5 and hardware adaptation detail screens
- define review and compliance states before any hardware export

### Slice 7: Backend Implementation

Status: planned after frontend API facade stabilizes.

- implement Gugu Flash backend routes as the new source of truth
- include first-party auth/session, user, device, order, entitlement, and content APIs
- keep H5 publishing and hardware candidate review separate
- only export selected works to hardware adaptation

### Slice 8: Hardware Adaptation Bridge

Status: planned after backend persistence.

- export selected `GuguH5Pack` to Gugu Flash Hardware Studio as an adaptation draft
- validate against hardware constraints before publishing HardwarePack
- never let ordinary users publish directly to device JSON

## Verification Policy

After each slice:

- run `npm run check`
- run JS syntax checks for changed modules
- keep `http://127.0.0.1:4177/` working
- verify key flows in the in-app browser

## Working Rule

Proceed slice by slice without asking for mid-course confirmation. If a risky product or architecture choice appears, choose the conservative path that keeps current functionality working and leaves a clear adapter point for later replacement.
