# AI Creator Studio Architecture And Delivery Kickoff

Updated: 2026-05-30

Owner: Codex, Project Owner / AI Creation Director

## 1. Meeting Purpose

This document records the first full cross-functional architecture and delivery kickoff for the next Gugu Flash branch:

```text
AI writes the story
  -> user edits the story project
  -> platform compiles it into a playable text game or comic-drama storyboard
  -> user previews and publishes
  -> operators review, distribute, and later adapt selected works
```

The immediate goal is not to build every advanced creator feature at once. The goal is to align the team around one source of truth, one delivery plan, and one technical path that can grow from the current GuguH5Pack prototype into a professional creator platform.

## 2. Attendees And Working Groups

The kickoff uses the existing `ai_creation_team_roster_v1` organization. Every squad has at least 3 members, so each decision has product, engineering, safety, release, and content coverage.

| Squad | Required Role In This Phase | Representatives |
| --- | --- | --- |
| Product Strategy | Scope, MVP tradeoffs, release gates | Lin Qiao, Chen Yu, Maya Shen |
| Narrative Design | Story grammar, endings, persona voice | He Ran, Nora Xu, Jin Wei |
| Game Systems | Scene graph rules, branch logic, playability | Wu Tong, Iris Zhao, Gao Ming |
| AI Prompt And Model Ops | Generation pipeline, model fallback, provenance | An Li, Rui Han, Sofia Tang |
| Frontend Experience | Creator Studio, player, responsive UX | Zhou Ke, Ava Liu, Bao Ning |
| Backend Platform | API contracts, persistence, jobs, auth boundary | Deng Kai, Yuki Sun, Tao Ren |
| Safety Rights And Moderation | IP, review, asset source, takedown path | Mei Lan, Oscar Chen, Priya Gu |
| Native And Hardware | Device constraints, hardware compatibility, export path | Huang Yao, Sam Qi, Leah Wang |
| Commerce Support And Ops | Store application, support, future payments | Fang Mo, Ethan Yu, Qin Yue |
| QA And Release | CI, test gates, regression plan | Mina Fu, Noah Peng, Luo Bei |
| Content Operations | Starter packs, templates, creator education | Song Yi, Kira Meng, Zed Luo |

## 3. Product Agreement

The team agreed to define the next product surface as **Gugu Creator Studio**.

Positioning:

```text
A professional AI-assisted creation platform that turns a user idea into a structured story project, then publishes it as a text game, interactive H5, or comic-drama storyboard.
```

The platform must support two user levels:

| User Type | Need | Product Promise |
| --- | --- | --- |
| Casual creator | One idea becomes a playable work quickly | Generate, preview, publish in minutes |
| Serious creator | Control structure, scenes, branches, roles, assets | Professional editor with graph, script, AI edits, and checks |
| Operator | Review, rank, govern, and adapt content | Clear metadata, provenance, safety and release evidence |

The product must not become a free-code engine. All public user output stays structured and reviewable.

## 3a. Dual-Surface Product Strategy

The team agreed that mobile and web must not expose the same creation surface.

Mobile creation should be **guided, opinionated, and hard to misuse**. Web creation should be **professional, inspectable, and powerful enough for serious creators**.

### Mobile: Guided Creation Funnel

Mobile is for casual users who want the platform to lead them step by step.

The mobile creation flow must feel like a route, not a blank editor:

```text
choose original/fanwork
  -> choose IP or original project
  -> choose persona
  -> choose template
  -> enter one idea
  -> AI creates draft
  -> user picks style/ending options
  -> guided preview
  -> fix required issues
  -> publish H5
```

Mobile rules:

- No branch graph by default.
- No free-code editing.
- No raw ink/Twine/Ren'Py scripts.
- No direct arbitrary HTML/JS import.
- Scene editing is simplified into cards.
- Choices are edited through guided forms.
- AI repair suggestions are primary; manual advanced editing is secondary.
- Publish blocks are explained as simple tasks, not technical errors.

Mobile success metric:

```text
A first-time user can finish a playable, reviewable text game in under 10 minutes.
```

### Web: Professional Creator Studio

Web is for serious creators, operators, and power users who need full control.

The web studio should expose:

- branch graph
- scene timeline
- script editor
- character and persona management
- AI proposal history
- project versions
- playtest traversal results
- comic storyboard panels
- asset source management
- publish and review diagnostics

Web success metric:

```text
A serious creator can repair, extend, test, and publish a complex branching work without leaving the platform.
```

### Shared Core, Different Interaction Depth

Both mobile and web use the same platform core:

```text
GuguStoryProject
  -> validation
  -> compiler
  -> preview runtime
  -> GuguH5Pack publish snapshot
```

The difference is not the data model. The difference is how much control the user sees.

| Capability | Mobile Guided Flow | Web Creator Studio |
| --- | --- | --- |
| Prompt to draft | Yes | Yes |
| Template selection | Yes, simplified | Yes, configurable |
| Scene editing | Card-based | Full inspector |
| Choice editing | Guided labels and targets | Full graph and inspector |
| Branch graph | Hidden by default | Primary tool |
| AI rewrite | One-tap suggestions | Scoped proposals and diff |
| Playtest | Guided path preview | Full traversal report |
| Comic storyboard | Preset preview | Full panel editor |
| Import/export | No raw import in MVP | Twine/ink import later |
| Publish checks | Task checklist | Detailed diagnostics |

## 4. Core Decisions

### Decision 1: Keep GuguH5Pack As The Published Runtime Format

`GuguH5Pack` remains the consumer-facing playable H5 format. It already supports scenes, choices, schema validation, review metadata, remix ancestry, and future hardware adaptation.

Why:

- Existing web player and feed already consume it.
- Existing validation and quality checks are already tied to it.
- It keeps mobile H5, review, store, and hardware paths stable.

### Decision 2: Add A Higher-Level Story Project Format

The team will add a new creation-time format named `GuguStoryProject`.

`GuguStoryProject` is the editable studio project. It can compile down into:

```text
GuguStoryProject
  -> GuguH5Pack
  -> ComicEpisode
  -> StoryboardExport
  -> HardwareCandidateDraft
```

This avoids forcing every advanced creation concept directly into `GuguH5Pack`.

### Decision 3: Split Creator Studio From The Current Web Prototype

The current `apps/web` stays useful as the lightweight prototype/player/feed surface. The professional creator surface should be introduced as a separate app when implementation begins.

Recommended shape:

```text
apps/web
  Current mobile-first H5 player/feed/store prototype

apps/creator-studio
  Professional web editor for story projects

apps/operator
  Review, governance, store, support, and hardware operations
```

### Decision 4: AI Generation Must Be Step-Based

The AI pipeline must not be a single opaque "generate everything" call. It should be decomposed into stages:

```text
idea understanding
  -> story brief
  -> world and cast
  -> scene graph
  -> script dialogue
  -> branch and endings
  -> comic panels
  -> asset prompts
  -> quality checks
  -> publish proposal
```

Every stage must be editable, re-runnable, auditable, and recoverable.

### Decision 5: Comic Drama Starts As Storyboard, Not Full Animation

The first comic-drama mode outputs vertical storyboard panels with scene description, character placement, dialogue bubbles, narration, and visual prompts.

It does not attempt full animation, voice synthesis, timeline editing, or automated video export in the first phase.

### Decision 6: Rights And Safety Are Product Primitives

Original/fanwork state, IP selection, source work ancestry, asset source, AI provenance, and review status must be captured inside the project and compiled outputs.

Publishing is blocked when required rights metadata is missing.

## 5. Target Architecture

### 5.1 System Layers

```text
apps/creator-studio
  Professional editor UI
  Scene editor
  Branch graph
  Comic storyboard
  AI workbench
  Preview and publish flow

apps/web
  H5 player
  Feed
  Share page
  Lightweight creation and remix entry

apps/operator
  Review queue
  Rights review
  Safety moderation
  Store application review
  Hardware candidate queue

apps/backend
  Story project API
  AI generation jobs
  Asset records
  Work publishing
  Review and operator APIs

packages/core
  GuguH5Pack schema
  GuguStoryProject schema
  validation
  quality checks
  content lifecycle helpers

packages/story-compiler
  GuguStoryProject -> GuguH5Pack
  GuguStoryProject -> ComicEpisode
  import adapters for ink/Twine later

packages/player-runtime
  H5 playback state machine
  scene navigation
  completion tracking

packages/ai-pipeline
  prompt templates
  staged generation contracts
  provider fallback
  provenance and evaluation

packages/asset-pipeline
  asset prompts
  upload metadata
  source declarations
  safety scan states
```

### 5.2 Proposed GuguStoryProject Shape

```json
{
  "id": "story_project_123",
  "schemaVersion": "gugu_story_project_v1",
  "title": "雨夜便利店",
  "status": "draft",
  "origin": {
    "contentOrigin": "original",
    "ipId": "rain_gugu_universe",
    "fanworkOf": null,
    "remixOf": null
  },
  "brief": {
    "logline": "一个雨夜便利店里，主角遇到会预言明天的猫。",
    "genre": "adventure",
    "audience": "mobile_short_play",
    "tone": "warm_mystery"
  },
  "world": {
    "setting": "雨夜便利店",
    "rules": ["猫能预言明天", "停电后货架会改变顺序"],
    "stakes": "主角必须在天亮前确认预言真假"
  },
  "characters": [],
  "storyGraph": {
    "entryNodeId": "start",
    "nodes": [],
    "edges": []
  },
  "script": {
    "scenes": []
  },
  "comicPanels": [],
  "assets": [],
  "aiProvenance": [],
  "qualityReports": [],
  "outputs": []
}
```

### 5.3 Runtime Compile Boundary

Creator Studio edits `GuguStoryProject`. The player consumes `GuguH5Pack`.

```text
User editing
  -> save project draft
  -> run validation
  -> compile preview pack
  -> play preview
  -> publish locked WorkVersion
```

This boundary matters because the editable project can contain work-in-progress notes, alternate endings, unapproved asset prompts, and comic-only panels that should not leak into a public runtime pack.

## 6. Data And API Plan

### 6.1 Core Entities

| Entity | Purpose |
| --- | --- |
| `StoryProject` | Editable source project |
| `StoryProjectVersion` | Versioned draft snapshots |
| `Work` | Public-facing content identity |
| `WorkVersion` | Locked published H5 snapshot |
| `ComicEpisode` | Comic-drama storyboard output |
| `AssetRecord` | Uploaded or AI-planned asset metadata |
| `AiGenerationJob` | Staged generation and edit jobs |
| `ReviewCase` | Safety, rights, publish, or store review |
| `HardwareCandidate` | Curated adaptation candidate |

### 6.2 API Groups

```text
GET    /flash/story-projects
POST   /flash/story-projects
GET    /flash/story-projects/:id
PATCH  /flash/story-projects/:id
POST   /flash/story-projects/:id/versions
POST   /flash/story-projects/:id/compile/h5
POST   /flash/story-projects/:id/compile/comic
POST   /flash/story-projects/:id/publish

POST   /flash/ai/story-projects/:id/jobs
GET    /flash/ai/jobs/:id
POST   /flash/ai/jobs/:id/apply
POST   /flash/ai/jobs/:id/discard

POST   /flash/assets
PATCH  /flash/assets/:id/source
POST   /flash/assets/:id/scan

GET    /flash/operator/review-cases
POST   /flash/operator/review-cases/:id/actions
```

### 6.3 API Rules

- Backend owns final validation before publish.
- Frontend may compile previews, but published output must be server-validated.
- AI jobs return proposals first; they do not overwrite user work automatically.
- Asset uploads require source declarations before public publish.
- Fanwork requires `ipId` before draft generation and before publish.

## 7. Frontend Architecture Discussion

### 7.1 Creator Studio Screens

```text
Dashboard
  recent projects, templates, drafts, review states

Create Wizard
  origin/IP/persona/template/prompt

Studio Workspace
  left: project sections and scene list
  center: phone preview or comic canvas
  right: inspector, AI assistant, quality checks
  bottom: playtest path and errors

Branch Graph
  nodes for scenes
  edges for choices
  unreachable/dead-end warnings

Comic Storyboard
  vertical panels
  dialogue bubbles
  narration
  visual prompts

Publish Center
  quality checks
  rights checklist
  asset source checklist
  preview pack
```

### 7.2 Recommended Web Stack

For the professional web app:

```text
React + TypeScript + Vite
React Flow for branch graph
TanStack Query for API data
Zustand or Jotai for local editor state
CodeMirror or Monaco for advanced script mode later
Playwright for critical path e2e
```

The current zero-dependency prototype should not be forced to carry advanced editor complexity.

## 8. AI Architecture Discussion

### 8.1 Generation Job Contract

Every AI job should include:

```text
jobId
projectId
stage
inputSnapshotId
prompt
modelProvider
modelName
status
proposal
qualityDelta
provenance
createdAt
completedAt
```

### 8.2 AI Stages For MVP

| Stage | Output | Owner |
| --- | --- | --- |
| `brief_from_prompt` | title, logline, genre, tone | Product + Narrative |
| `cast_design` | characters, voice, role in story | Narrative + AI Ops |
| `scene_graph` | nodes and choice edges | Game Systems |
| `script_draft` | scene text, speaker, dialogue | Narrative |
| `comic_storyboard` | panels, camera, bubble text | Content Ops |
| `asset_prompt_plan` | background, portrait, prop prompts | AI Ops + Safety |
| `quality_review` | checks and fix suggestions | QA + Safety |

### 8.3 AI Safety And Provenance

AI output must record:

- prompt text or prompt hash
- provider and model
- generated fields
- user accepted fields
- source project snapshot
- rights-sensitive terms detected
- model fallback reason, if fallback happened

## 9. Delivery Plan

### Phase 0: Architecture Alignment And Project Format

Duration: 1 week

Deliverables:

- `GuguStoryProject` schema proposal
- compiler boundary design
- Creator Studio information architecture
- API contract draft
- AI job contract draft
- release gate checklist

Exit criteria:

- Product, frontend, backend, AI, safety, and QA agree on the project/source/runtime split.
- Schema can represent both text-game scenes and comic storyboard panels.

### Phase 1: Text Game Studio MVP

Duration: 3-4 weeks

Deliverables:

- create project from prompt
- staged AI draft generation
- scene list editor
- scene detail editor
- choice and goto editor
- phone preview using compiled `GuguH5Pack`
- quality checks for reachability, endings, mobile copy, rights metadata

Exit criteria:

- User can create, edit, preview, and publish a text game without touching code.
- Existing feed/player can play the published pack.
- Unit tests cover schema, compiler, and quality checks.

### Phase 2: Branch Graph And Professional Editing

Duration: 3-4 weeks

Deliverables:

- visual branch graph
- unreachable scene warnings
- dead-end warnings
- duplicate scene and clone flow
- AI rewrite suggestions
- project version snapshots
- publish comparison view

Exit criteria:

- Serious creators can control story structure visually.
- QA can reproduce and test branch failures from project snapshots.

### Phase 3: Comic Drama Storyboard MVP

Duration: 3-4 weeks

Deliverables:

- compile story project into comic panels
- panel inspector
- dialogue bubble text
- narration and camera direction
- character placement notes
- visual prompt generation
- vertical preview

Exit criteria:

- Same story project can output a playable text game and a comic storyboard.
- Comic storyboard can be reviewed and exported as structured JSON.

### Phase 4: Review, Operations, And Community Loop

Duration: 4 weeks

Deliverables:

- review case creation from publish
- rights checklist in operator console
- asset source review state
- remix ancestry review
- launch templates and starter packs
- creator education content
- recommendation and content ops dashboard hooks

Exit criteria:

- Public publish, moderation, remix, and operator workflows are linked.
- Platform can explain why a work passed or failed review.

### Phase 5: Store And Hardware Candidate Path

Duration: 4-6 weeks

Deliverables:

- store application from public work
- hardware compatibility report from compiled H5
- hardware candidate queue
- manual adaptation handoff
- support diagnostics and release evidence

Exit criteria:

- Store and hardware remain separate from H5 publish.
- Selected content has a traceable path from story project to hardware candidate.

## 10. Staffing Plan

### Required MVP Pod

| Function | Minimum Staffing | Responsibility |
| --- | --- | --- |
| Product | 2 | scope, user flow, release criteria |
| Frontend | 3 | Creator Studio, graph editor, preview |
| Backend | 2 | APIs, persistence, job state |
| AI Engineering | 2 | staged generation, proposals, eval |
| Narrative Design | 2 | templates, voice, story quality |
| Safety/Rights | 2 | IP, asset source, review rules |
| QA/Release | 2 | tests, e2e, release evidence |
| Content Ops | 1 | starter templates and creator docs |

Minimum recommended pod size: 16 people.

### Decision Ownership

| Decision Area | DRI | Required Reviewers |
| --- | --- | --- |
| Product scope | Product Strategy | Frontend, Backend, Safety, QA |
| Project schema | Backend Platform | Frontend, Game Systems, AI Ops |
| Story quality | Narrative Design | Content Ops, QA |
| Branch graph behavior | Game Systems | Frontend, QA |
| AI job contract | AI Prompt And Model Ops | Backend, Safety |
| Publish gate | Safety Rights And Moderation | Product, QA, Backend |
| Release gate | QA And Release | Product, Engineering leads |

## 11. Project Cadence

| Cadence | Meeting | Purpose |
| --- | --- | --- |
| Daily | 15-minute delivery standup | blockers, handoffs, build health |
| Twice weekly | Architecture review | schema, API, compiler, state decisions |
| Weekly | Creator quality review | story quality, AI outputs, templates |
| Weekly | Safety and rights review | IP, asset, moderation rules |
| Weekly | Demo review | working software only |
| End of phase | Gate review | decide ship, extend, or cut scope |

Meeting rule:

```text
No phase is considered complete without executable evidence, a demo path, and updated release notes.
```

## 12. Quality Gates

### Engineering Gates

- schema validation tests pass
- compiler tests pass
- API contract tests pass
- AI fallback tests pass
- Playwright critical flows pass
- no public publish path bypasses backend validation

### Product Gates

- casual creator can finish first playable draft
- serious creator can edit scenes and branches
- rights metadata is visible before publish
- preview matches published runtime behavior
- operators can review a publish case

### Content Gates

- at least 10 starter templates
- at least 6 high-quality showcase works
- at least 3 works with 6 or more scenes
- at least 2 comic storyboard examples
- narrative checks cover ending payoff and persona voice

### Safety Gates

- fanwork cannot publish without IP
- asset source declaration required
- AI provenance recorded
- review cases are created for public publish and store application
- takedown and frozen states are represented

## 13. Risk Register

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| Scope expands into full animation/video too early | Delivery delay | Comic mode starts as storyboard only | Product Strategy |
| Free-code editing breaks review and hardware path | Safety and compatibility risk | MVP forbids arbitrary JS/CSS | Safety + Frontend |
| AI output looks plausible but is not playable | Poor creator trust | Stage-based generation plus playtest checks | AI Ops + QA |
| StoryProject becomes too complex for MVP | Engineering drag | Compile only needed fields into H5 first | Backend Platform |
| Twine/ink integration distracts core build | Schedule risk | Keep as future import adapters | Product Strategy |
| Asset generation creates rights ambiguity | Legal and trust risk | Store prompts, sources, review states | Safety Rights |
| Branch graph UX overwhelms casual creators | Activation drop | Progressive disclosure: wizard first, graph second | Frontend Experience |
| Hardware path constrains H5 creativity too early | Product quality loss | H5 publish remains richer; hardware gets compatibility reports | Native Hardware |

## 14. Open Questions

1. Should `GuguStoryProject` live in `packages/core` immediately, or begin in `packages/story-compiler` until stable?
2. Should Creator Studio be scaffolded now as React/TypeScript, or should the first text-game studio slice remain inside `apps/web`?
3. What is the minimum first comic output: JSON only, visual preview, or downloadable panel sheet?
4. Should AI generation jobs be synchronous for prototype mode and asynchronous for backend mode?
5. Which two showcase genres should be used for the first demo: healing/adventure, adventure/comic-drama, or fanwork/original?

## 15. Immediate Action Items

| Priority | Item | Owner | Target |
| --- | --- | --- | --- |
| P0 | Draft `GuguStoryProject` schema | Backend Platform | Phase 0 |
| P0 | Define story-to-H5 compiler contract | Game Systems + Backend | Phase 0 |
| P0 | Define Creator Studio IA and first screens | Product + Frontend | Phase 0 |
| P0 | Define AI job proposal contract | AI Ops + Backend | Phase 0 |
| P0 | Define publish quality gates | Safety + QA | Phase 0 |
| P1 | Choose React/TypeScript app boundary | Frontend Experience | Phase 0 |
| P1 | Create first 10 creator templates | Content Ops + Narrative | Phase 1 |
| P1 | Add comic storyboard schema draft | Narrative + Content Ops | Phase 1 |

## 16. Working Conclusion

The project should proceed as a professional content creation platform, not a pile of independent AI tools.

The technical center is:

```text
GuguStoryProject for creation
GuguH5Pack for playable runtime
ComicEpisode for storyboard output
ReviewCase for governance
AiGenerationJob for auditable AI work
```

The delivery center is:

```text
Text game creation first
Professional editing second
Comic storyboard third
Community and operations fourth
Store and hardware fifth
```

This keeps the product ambitious without letting the first implementation lose its shape.
