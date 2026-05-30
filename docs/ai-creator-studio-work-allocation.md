# AI Creator Studio Work Allocation

Updated: 2026-05-31

Owner: Codex, Project Owner / AI Creation Director

## 1. Operating Decision

The team will not build mobile and web as two unrelated products.

The delivery strategy is:

```text
Shared foundation first
  -> mobile guided creation MVP first
  -> web Creator Studio skeleton in parallel
  -> professional web editing after mobile MVP proves the loop
```

This gives the project a working creation pipeline quickly while preventing the professional web editor from blocking the simpler mobile launch path.

## 2. Delivery Principles

1. The platform cannot claim a generated work is a text game until runtime validation passes.
2. Mobile must guide users step by step and hide professional complexity.
3. Web must become the professional studio, but only after the shared story foundation is stable.
4. `GuguStoryProject` is the editable source format.
5. `GuguH5Pack` is the published playable runtime snapshot.
6. AI outputs proposals and repair plans; it does not bypass validation.
7. Fanwork, IP, rights, asset source, and AI provenance are required platform data.
8. Every phase must produce executable evidence, not just designs.

## 3. Phase Plan

| Phase | Timebox | Main Goal | Release Evidence |
| --- | --- | --- | --- |
| Phase 0 | Week 1-2 | Shared story foundation | Schema, compiler, runtime spike, validation tests |
| Phase 1 | Week 3-6 | Mobile guided creation MVP | Phone creation wizard, AI draft, playable preview, publish checklist |
| Phase 2 | Week 4-6 | Web Creator Studio skeleton | Project list, scene list, preview, checks, simple edits |
| Phase 3 | Week 7-10 | Professional web editing | Branch graph, AI diff, versioning, traversal report |
| Phase 4 | Week 11-14 | Comic-drama and operations | Storyboard, review case flow, starter templates |

Phase 1 and Phase 2 overlap intentionally. Mobile validates the casual creator loop; web skeleton validates the future professional surface without overbuilding.

## 4. Phase 0 Assignments: Shared Foundation

### 4.1 Product Strategy Squad

DRI: Lin Qiao

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| Lin Qiao | Lock MVP scope and non-goals | Phase 0 scope note | Week 1 Day 2 |
| Chen Yu | Define mobile guided creation steps | Mobile funnel spec | Week 1 Day 3 |
| Maya Shen | Define phase gates and acceptance criteria | Gate checklist | Week 1 Day 4 |

Acceptance:

- Mobile flow has no exposed branch graph or script editor.
- Web skeleton scope is limited to project management, preview, and simple edits.
- Release gates include runtime validation and rights metadata.

### 4.2 Backend Platform Squad

DRI: Deng Kai

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| Deng Kai | Draft `GuguStoryProject` schema | `packages/core` schema proposal | Week 1 Day 4 |
| Yuki Sun | Define story project API contract | API endpoint spec and contract tests outline | Week 1 Day 5 |
| Tao Ren | Draft persistence model | StoryProject, StoryProjectVersion, AiGenerationJob tables | Week 2 Day 2 |

Acceptance:

- Schema can represent text-game scenes, choices, endings, and comic panels.
- API contract separates draft project from published `WorkVersion`.
- Persistence model supports version snapshots.

### 4.3 Game Systems Squad

DRI: Wu Tong

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| Wu Tong | Define playable text-game rules | Runtime validation rules | Week 1 Day 3 |
| Iris Zhao | Define graph model | Node/edge/ending model | Week 1 Day 4 |
| Gao Ming | Define hardware-safe complexity hints | Compatibility notes | Week 2 Day 2 |

Acceptance:

- Validation covers entry node, invalid targets, unreachable nodes, dead ends, and ending coverage.
- Complexity hints do not block H5 publish; they only inform future hardware review.

### 4.4 AI Prompt And Model Ops Squad

DRI: An Li

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| An Li | Rewrite AI contract around story graph output | Structured generation prompt contract | Week 1 Day 5 |
| Rui Han | Design AI job state model | `AiGenerationJob` lifecycle | Week 2 Day 1 |
| Sofia Tang | Define evaluation fixtures | 10 prompt fixtures and expected checks | Week 2 Day 3 |

Acceptance:

- AI must output graph-ready project data, not loose scenes.
- AI failure creates repair suggestions instead of fake playable success.
- Fixtures include original, fanwork, healing, adventure, and comic-drama prompts.

### 4.5 Frontend Experience Squad

DRI: Zhou Ke

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| Zhou Ke | Decide web skeleton app boundary | Frontend architecture note | Week 1 Day 4 |
| Ava Liu | Prototype mobile wizard flow | Mobile screen flow spec | Week 2 Day 1 |
| Bao Ning | Define shared editor/player UI tokens | UI state and component inventory | Week 2 Day 2 |

Acceptance:

- Mobile wizard can be implemented without exposing advanced editor surfaces.
- Web skeleton is scoped separately from mobile flow.
- Preview UI consumes compiled `GuguH5Pack`.

### 4.6 Narrative Design Squad

DRI: He Ran

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| He Ran | Define first story templates | 6 template briefs | Week 1 Day 5 |
| Nora Xu | Define branch and ending quality rules | Branch quality rubric | Week 2 Day 2 |
| Jin Wei | Define persona voice rules | Persona voice checklist | Week 2 Day 2 |

Acceptance:

- Templates include at least healing, adventure, mystery, comedy, romance, and companion.
- Each template declares minimum scenes, choices, and ending expectations.

### 4.7 Safety Rights And Moderation Squad

DRI: Mei Lan

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| Mei Lan | Define publish block rules | Safety publish checklist | Week 1 Day 5 |
| Oscar Chen | Define fanwork/IP metadata requirements | Rights metadata policy | Week 2 Day 1 |
| Priya Gu | Define review case trigger rules | Review case trigger map | Week 2 Day 3 |

Acceptance:

- Fanwork cannot generate or publish without `ipId`.
- Asset source and AI provenance are required before public publish.
- Review triggers are machine-checkable.

### 4.8 QA And Release Squad

DRI: Mina Fu

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| Mina Fu | Define test matrix | Phase 0 test matrix | Week 1 Day 4 |
| Noah Peng | Create traversal test plan | Playability automation plan | Week 2 Day 1 |
| Luo Bei | Define release packet requirements | Phase evidence checklist | Week 2 Day 2 |

Acceptance:

- Unit tests cover project validation and compiler behavior.
- E2E plan covers mobile creation and web preview.
- Every phase has explicit pass/fail gates.

### 4.9 Content Operations Squad

DRI: Song Yi

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| Song Yi | Define starter content strategy | Launch content brief | Week 1 Day 5 |
| Kira Meng | Draft showcase pack list | 6 showcase concepts | Week 2 Day 2 |
| Zed Luo | Draft creator education outline | First-time creator guide outline | Week 2 Day 3 |

Acceptance:

- Starter content maps to mobile templates.
- Showcase works include at least 3 works with 6 or more scenes.

### 4.10 Native And Hardware Squad

DRI: Huang Yao

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| Huang Yao | Define native handoff constraints | Native preview notes | Week 2 Day 2 |
| Sam Qi | Review device sync impact | Device sync risk note | Week 2 Day 3 |
| Leah Wang | Define hardware adaptation constraints | Hardware compatibility checklist | Week 2 Day 3 |

Acceptance:

- H5 creativity is not blocked by hardware constraints.
- Hardware notes inform compatibility reporting only.

### 4.11 Commerce Support And Ops Squad

DRI: Fang Mo

Assignments:

| Owner | Task | Output | Due |
| --- | --- | --- | --- |
| Fang Mo | Define store application dependencies | Store readiness notes | Week 2 Day 2 |
| Ethan Yu | Define creator support scenarios | Support macro outline | Week 2 Day 3 |
| Qin Yue | Define future settlement boundaries | Commerce non-goals note | Week 2 Day 3 |

Acceptance:

- Store application remains separate from H5 publish.
- Support language explains blocked publish states clearly.

## 5. Phase 1 Assignments: Mobile Guided Creation MVP

Timebox: Week 3-6

### Main User Flow

```text
Start creation
  -> choose original/fanwork
  -> choose IP/persona/template
  -> enter one idea
  -> AI generates validated project
  -> user reviews guided cards
  -> phone preview
  -> fix required checklist
  -> publish H5
```

### Squad Assignments

| Squad | DRI | Work Package | Output |
| --- | --- | --- | --- |
| Product Strategy | Chen Yu | Mobile funnel PRD | Final mobile steps, copy, edge cases |
| Frontend Experience | Ava Liu | Guided creation UI | Wizard, draft cards, phone preview |
| Backend Platform | Yuki Sun | Project and publish API | Create/update/compile/publish endpoints |
| AI Prompt And Model Ops | Rui Han | AI job execution | Staged draft jobs and fallback |
| Game Systems | Iris Zhao | Runtime validation | Playability checks exposed to UI |
| Narrative Design | He Ran | Template prompts | Template-specific generation rules |
| Safety Rights | Mei Lan | Publish checklist | Rights, IP, asset, provenance blocks |
| QA Release | Noah Peng | E2E mobile tests | First-time creation Playwright flow |
| Content Ops | Kira Meng | Starter prompts | First 10 mobile templates |

Phase 1 acceptance:

- First-time user can create and preview a playable text game on mobile.
- Broken AI output is repaired or blocked before preview.
- Publish cannot happen without runtime and rights gates passing.

## 6. Phase 2 Assignments: Web Creator Studio Skeleton

Timebox: Week 4-6

The web skeleton must stay intentionally small.

### Included

- Project list.
- Project detail page.
- Scene list.
- Basic scene inspector.
- Compiled phone preview.
- Quality check panel.
- Publish diagnostics.

### Excluded Until Phase 3

- Full branch graph editing.
- Raw script editor.
- Twine/ink import UI.
- Full version diff UI.
- Advanced variables.
- Advanced asset management.

### Squad Assignments

| Squad | DRI | Work Package | Output |
| --- | --- | --- | --- |
| Product Strategy | Lin Qiao | Web skeleton scope guard | Must-have and cut list |
| Frontend Experience | Zhou Ke | Creator Studio shell | App shell and core screens |
| Backend Platform | Deng Kai | Studio API support | Project list/detail/version endpoints |
| QA Release | Mina Fu | Web smoke tests | Create/open/preview/check test |
| Safety Rights | Oscar Chen | Diagnostics copy | Review and rights issue explanations |
| Content Ops | Zed Luo | Creator help content | First workspace guidance |

Phase 2 acceptance:

- A serious creator can open a generated project, inspect scenes, preview, and understand issues.
- The web surface does not attempt full pro editing before Phase 3.

## 7. Phase 3 Assignments: Professional Web Editing

Timebox: Week 7-10

### Main Capabilities

- Visual branch graph.
- Choice edge editing.
- Ending markers.
- Full traversal report.
- AI proposal diff.
- Project version snapshots.
- Scene duplication and repair.

### Squad Assignments

| Squad | DRI | Work Package | Output |
| --- | --- | --- | --- |
| Frontend Experience | Zhou Ke | Branch graph editor | Node/edge view and editing |
| Game Systems | Wu Tong | Graph rules | Graph behavior and repair rules |
| Backend Platform | Tao Ren | Version snapshots | Project version persistence |
| AI Prompt Ops | An Li | Scoped rewrite prompts | Scene/branch/ending proposal prompts |
| QA Release | Noah Peng | Traversal regression | Automated path coverage tests |
| Narrative Design | Nora Xu | Branch quality review | Ending payoff and choice quality checks |

Phase 3 acceptance:

- A creator can repair a broken branching story without code.
- AI suggestions are visible as proposals and do not overwrite work without acceptance.

## 8. Phase 4 Assignments: Comic-Drama And Operations

Timebox: Week 11-14

### Main Capabilities

- Compile story project into comic storyboard.
- Panel inspector.
- Dialogue bubble text.
- Visual prompt plan.
- Review case creation.
- Operator diagnostics.

### Squad Assignments

| Squad | DRI | Work Package | Output |
| --- | --- | --- | --- |
| Narrative Design | Jin Wei | Comic panel grammar | Panel and dialogue rules |
| Content Ops | Song Yi | Comic templates | First comic-drama templates |
| Frontend Experience | Bao Ning | Storyboard UI | Panel preview and inspector |
| Backend Platform | Yuki Sun | Comic compiler API | Compile and export endpoint |
| Safety Rights | Priya Gu | Review case flow | Publish/review/operator linkage |
| QA Release | Luo Bei | Phase 4 release packet | Evidence checklist and ship gate |

Phase 4 acceptance:

- Same story project can output text-game H5 and comic storyboard.
- Operator review can see rights, AI provenance, and asset source state.

## 9. Daily Execution Cadence

### Daily Standup

Timebox: 15 minutes.

Each squad reports:

```text
Yesterday completed
Today target
Blocker
Artifact link or evidence
```

### Twice-Weekly Architecture Review

Required attendees:

- Codex
- Deng Kai
- Zhou Ke
- Wu Tong
- An Li
- Mei Lan
- Mina Fu

Agenda:

```text
schema changes
compiler boundary
runtime validation
API contract
publish gate
test evidence
```

### Weekly Demo Review

Rule:

```text
Only working software, executable tests, or reviewed documents count as progress.
```

## 10. Immediate Orders

Effective now:

1. Lin Qiao starts Phase 0 scope lock.
2. Deng Kai starts `GuguStoryProject` schema drafting.
3. Wu Tong and Iris Zhao define graph validation rules.
4. An Li starts the AI graph-output contract.
5. Zhou Ke and Ava Liu split mobile wizard vs web skeleton architecture.
6. Mei Lan and Oscar Chen define rights and publish blockers.
7. Mina Fu and Noah Peng prepare validation and traversal tests.
8. Song Yi and Kira Meng prepare template and showcase content.

No team should begin building a full professional web editor until Phase 0 validation and Phase 1 mobile flow are technically viable.

## 11. First Review Gate

Gate date: End of Week 2.

The project may enter Phase 1 only if:

- `GuguStoryProject` draft exists.
- Compiler contract exists.
- Runtime/playability validation rules exist.
- Mobile wizard PRD exists.
- Web skeleton scope guard exists.
- AI generation contract uses graph/project output.
- Rights and publish checklist exists.
- QA test matrix exists.

If any of these are missing, the phase does not pass.

## 12. Execution Log

### 2026-05-30 Phase 0 Engineering Start

Completed by Codex:

- Added `GuguStoryProject` core schema constants.
- Added story project validation for entry node, duplicate IDs, invalid edges, unreachable nodes, dead ends, reachable endings, fanwork IP requirements, and scene mapping.
- Added `GuguStoryProject -> GuguH5Pack` compiler.
- Added `GuguH5Pack -> GuguStoryProject` conversion helper for migration and future web editing.
- Added story project playability report that combines project validation, compiled pack validation, playtest, and publish checklist.
- Added StoryProject, StoryProjectVersion, and AiGenerationJob to domain entity schemas.
- Reserved StoryProject and AiGenerationJob API routes in the shared API contract.
- Added Backend Alpha route coverage entries for the new Creator Studio routes as explicit stubs.
- Fixed prompt-title handling for English-leading prompts so HTTP/API tests keep stable draft titles.

Verification:

```text
npm run test:unit
npm run check:content
```

Status:

```text
Phase 0 shared story foundation is started and test-covered.
Next implementation slice should add persistence/API behavior for story projects or start the mobile guided creation flow on top of the compiler.
```

### 2026-05-31 Phase 1 Production Loop Start

Completed by Codex and assigned agents:

- Added project-backed prompt generation via `createStoryProjectFromPrompt`.
- Updated mock and HTTP AI draft creation so generated drafts carry `storyProjectId` and a persisted `StoryProject`.
- Implemented StoryProject H5 publish with server-side validation, playability report, publish blockers, H5 compile, project status update, and published version snapshot.
- Implemented AI job apply so output projects are validated, saved, snapshotted, and linked back to the applied job.
- Added the first professional Creator Studio panel inside the web app with project list, overview metrics, branch/ending health, scene list, publish diagnostics, and mobile preview action.
- Kept the mobile creation default as a five-step guided flow; professional workspace is behind advanced editing.

Verification:

```text
node --test apps/backend/src/flash-http-server.story-project.test.js
node --test packages/core/src/gugu-story-project.test.js packages/api-client/src/mock-flash-api.test.js packages/api-client/src/flash-api-contract.test.js packages/api-client/src/http-flash-api.test.js
npm run test:e2e -- -g "mobile guide defaults|creator studio opens|generated creation deck|create workspace|original work can be published|web can publish"
npm run test:unit
npm run check:content
npm run check:ai-creation-maturity
browser smoke at 1280x900 and 375x667
```

Status:

```text
StoryProject can now move from AI generation to persisted project, AI apply, validated H5 publish, and professional web inspection.
Next slice should add editable scene inspector saving, real StoryProject project list loading, and comic/manju storyboard compile contract.
```

### 2026-05-31 Phase 1 Save-Capable Studio Start

Started by Codex and assigned agents:

- Locke: mock/API StoryProject list and update support.
- Harvey: Creator Studio project loading and single-scene inspector save.
- Euclid: save-flow QA risk review.
- Codex: comic/manju storyboard compiler contract.

Completed locally by Codex:

- Added `GUGU_COMIC_EPISODE_SCHEMA_VERSION`.
- Added `compileStoryProjectToComicEpisode(project)` so the same editable project can output a structured comic/manju storyboard contract.
- Added core test coverage for storyboard panels, source scene IDs, ending panels, and validation metadata.

Verification:

```text
node --test packages/core/src/gugu-story-project.test.js
```

### 2026-05-31 Phase 1 Save-Capable Studio Complete

Completed by Codex and assigned agents:

- Mock mode now persists generated StoryProjects and supports list/get/update/version/compile/publish/job/apply methods with HTTP-compatible names.
- HTTP StoryProject update is covered for single-scene body edits while preserving graph edges.
- Creator Studio now loads StoryProject records and binds the generated project into the current workspace.
- Creator Studio has a scene Inspector for editing title/body and saving to the current StoryProject.
- The same edit updates local draft preview/playtest state so mobile preview reflects saved scene text.
- API contract now identifies comic compilation output as `ComicEpisode`.
- Domain schemas now include `ComicEpisode`.

Verification:

```text
node --test packages/api-client/src/flash-api-contract.test.js packages/core/src/gugu-domain.test.js apps/backend/src/alpha-route-coverage.test.js
node --test apps/backend/src/flash-http-server.story-project.test.js packages/api-client/src/mock-flash-api.test.js packages/core/src/gugu-story-project.test.js
npm run test:e2e -- tests/e2e/gugu-flash-flows.spec.js -g "creator studio scene inspector|creator studio opens|mobile guide defaults"
```

### 2026-05-31 Phase 1 Versioned Studio And Comic API Start

Started by Codex and assigned agents:

- Leibniz: expose `compileStoryProjectToComicEpisode` through HTTP and mock API.
- Hume: make StoryProject cards open/switch projects and create version snapshots on save.
- Dalton: review comic compile and version snapshot risks.
- Codex: integrate, verify, and report.

Acceptance target:

```text
Creator Studio can open existing StoryProjects, save a scene, create a version snapshot, and backend/mock can compile the same project into a ComicEpisode storyboard.
```

### 2026-05-31 Phase 1 Versioned Studio And Comic API Complete

Completed by Codex and assigned agents:

- Leibniz delivered backend, HTTP client, mock API, route-map, and tests for StoryProject-to-`ComicEpisode` compilation.
- Hume delivered clickable StoryProject switching, draft/preview synchronization, save-time version snapshot creation, and focused e2e coverage.
- Dalton identified the contract-map gap, state contamination risk, duplicate snapshot risk, and partial-failure status requirement before final integration.
- Codex integrated the work, added a saving guard plus partial snapshot-failure state, and updated the project board.

Verification target:

```text
node --test apps/backend/src/flash-http-server.story-project.test.js packages/api-client/src/mock-flash-api.test.js packages/api-client/src/flash-api-contract.test.js packages/core/src/gugu-story-project.test.js
npm run test:e2e -- tests/e2e/gugu-flash-flows.spec.js -g "creator studio switches back|creator studio scene inspector|creator studio opens|mobile guide defaults"
```

### 2026-05-31 Phase 1 Storyboard Preview And Version Restore Start

Started by Codex and assigned agents:

- Heisenberg: add StoryProjectVersion restore route, HTTP client method, mock method, and contract coverage.
- Volta: add Creator Studio comic/manju storyboard preview plus version history and restore controls.
- Ohm: review restore, storyboard preview, state sync, and mobile default-flow risks.
- Codex: integrate, verify, and report.

Acceptance target:

```text
Professional Creator Studio can preview the current StoryProject as a ComicEpisode storyboard, list version snapshots, restore a chosen version, and keep mobile creation simple by default.
```

### 2026-05-31 Phase 1 Storyboard Preview And Version Restore Complete

Completed by Codex and assigned agents:

- Heisenberg added StoryProjectVersion restore route, HTTP client method, mock method, contract mapping, route coverage, and tests.
- Volta added Creator Studio Comic storyboard preview, version history, restore controls, save-time refresh behavior, and focused e2e coverage.
- Ohm identified restore audit, published snapshot, state sync, and mobile-flow risks before final integration.
- Codex changed restore semantics so every restore creates a new `restored` snapshot and published snapshots return to editable preview state.

Verification target:

```text
node --test apps/backend/src/flash-http-server.story-project.test.js packages/api-client/src/mock-flash-api.test.js packages/api-client/src/flash-api-contract.test.js apps/backend/src/alpha-route-coverage.test.js
npm run test:e2e -- tests/e2e/gugu-flash-flows.spec.js -g "creator studio|mobile guide defaults"
```

### 2026-05-31 Phase 1 Panel Editing And Visual Binding Start

Started by Codex and assigned agents:

- Bernoulli: extend ComicEpisode panel contract so edited shot/caption/visual/image fields survive compilation.
- Darwin: add Creator Studio panel Inspector, save flow, and visual generation/binding workflow.
- Feynman: review panel-scene mapping, save state isolation, asset safety, versioning, and mobile default-flow risks.
- Codex: integrate, verify, and report.

Acceptance target:

```text
Professional Creator Studio can select a Comic storyboard panel, edit its production fields, generate/bind a visual asset, save a versioned StoryProject update, and keep mobile creation simple by default.
```

### 2026-05-31 Phase 1 Panel Editing And Visual Binding Complete

Completed by Codex and assigned agents:

- Bernoulli completed the ComicEpisode contract update for editable panel fields and image bindings.
- Darwin completed the Creator Studio panel Inspector, save flow, visual generation/binding flow, and focused e2e coverage.
- Feynman completed read-only QA review across panel ID mapping, StoryProject save semantics, asset provenance, and mobile default hiding.
- Codex integrated the round by aligning panel IDs with comic `nextBeats`, normalizing AI images to PNG assets with source statements, and keeping version snapshots tied to panel saves.
- The mobile path remains a guided no-code route; the professional web path now supports panel-level production edits for comic/manju preparation.

Verification:

```text
node --check apps/web/src/app.js
node --test packages/core/src/gugu-story-project.test.js apps/backend/src/flash-http-server.story-project.test.js packages/api-client/src/mock-flash-api.test.js apps/backend/src/asset-security.test.js
npm run test:e2e -- tests/e2e/gugu-flash-flows.spec.js -g "creator studio|mobile guide defaults"
npm run test:unit
npm run check:content
npm run check:ai-creation-maturity
git diff --check
browser smoke: example prompt -> draft -> Creator Studio -> select panel -> save snapshot -> bind PNG visual
```

Status:

```text
Round 6 closes the minimum usable professional comic storyboard loop: a generated StoryProject can now become an editable panel storyboard with saved production fields and bound visual assets.
Next implementation slice should move from mock visual binding to a production asset library/render queue, then add version diff UI and stricter production auth/storage.
```
