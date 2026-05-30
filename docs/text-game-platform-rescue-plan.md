# Text Game Platform Rescue Plan

Updated: 2026-05-30

Owner: Codex, Project Owner / AI Creation Director

## 1. Executive Decision

The previous platform direction is not sufficient because it treats "AI generated story text" as if it were already a playable text game.

That is the core mistake.

A usable text-game platform needs four things at the same time:

```text
structured authoring
  -> proven narrative runtime
  -> deterministic validation
  -> platform publishing and review
```

The recommendation is to integrate mature open-source narrative technology, but not by replacing Gugu Flash with someone else's full product. The correct strategy is:

```text
Use mature open-source projects for narrative logic and import/export.
Keep GuguStoryProject and GuguH5Pack as the platform source of truth.
```

## 2. Diagnosis

The current platform can generate story-like drafts, but it is not yet a reliable production tool for playable text games.

### 2.1 What Is Missing

| Missing Capability | Why It Breaks Usability |
| --- | --- |
| Real narrative runtime | Choices, variables, conditions, state, endings, and replay must behave deterministically. |
| Mature script grammar | AI needs a constrained target, not free-form JSON guessing. |
| Compiler and validation layer | The system must catch broken jumps, unreachable scenes, dead ends, and invalid state before publish. |
| Playtest automation | The platform must simulate paths, not rely on a human clicking once. |
| Branch graph editing | Serious creators need to see and fix the structure. |
| Save/resume model | Real text games need persistent story state. |
| Import/export path | Creators may already know Twine, ink, or visual novel workflows. |
| Rights-safe runtime boundary | User content cannot run arbitrary JS/CSS inside our platform. |

### 2.2 Wrong Product Assumption To Remove

```text
"AI generated scenes + buttons = text game"
```

That is only a demo. A platform-grade text game requires a real story state machine.

## 3. Market Reference Summary

### 3.1 ink / inkjs

Recommendation: **Primary integration target**

ink is an open-source scripting language for interactive narrative. It is designed for text-centric games and graphical games with highly branching stories. Its runtime can load compiled JSON, and inkjs provides a JavaScript runtime suitable for web use.

Relevant source references:

- ink describes itself as a scripting language for interactive narrative and branching stories.
- ink supports compiled JSON runtime usage.
- inkjs can be installed with npm and can be used in browser or Node contexts.
- ink is MIT licensed.

Official sources:

- https://github.com/inkle/ink
- https://github.com/y-lohse/inkjs

Why it fits Gugu Flash:

- Web-friendly through inkjs.
- Strong branching narrative model.
- Works as an embedded runtime instead of a full game engine.
- Good target for AI-generated structured scripts.
- Lets Gugu Flash own UI, review, publishing, and mobile player design.

Primary use:

```text
AI/GuguStoryProject
  -> ink-like script or compiled ink JSON
  -> inkjs runtime preview
  -> compile/snapshot into GuguH5Pack for platform publishing
```

### 3.2 Twine

Recommendation: **Import/export and creator ecosystem target**

Twine is an open-source tool for nonlinear interactive stories. It publishes to HTML and supports story formats such as Harlowe, Chapbook, Snowman, and SugarCube.

Official source:

- https://twinery.org/

Why it helps:

- It is familiar to many interactive fiction creators.
- It is excellent as an external authoring/import format.
- It provides useful mental models for passage graphs and story formats.

Why not use it as the platform runtime:

- Twine HTML can include custom JavaScript and CSS.
- Directly running arbitrary Twine HTML would create safety, review, and compatibility problems.
- Twine story formats vary, so platform behavior becomes harder to guarantee.

Primary use:

```text
Twine/Twee import
  -> parse passages and links
  -> convert to GuguStoryProject
  -> validate
  -> publish as GuguH5Pack
```

### 3.3 Yarn Spinner

Recommendation: **Reference and future dialogue adapter**

Yarn Spinner is a dialogue system used in games. It sends dialogue lines, options, and commands to the host game.

Official source:

- https://github.com/YarnSpinnerTool/YarnSpinner

Why it helps:

- Strong dialogue authoring model.
- Good reference for writer-friendly scripting.
- Proven in narrative-heavy games.

Why it is not first choice:

- Its strongest official integration path is game-engine oriented, especially Unity.
- Gugu Flash needs web-first, mobile H5, UGC, review, and platform publishing.

Primary use:

```text
Study command/dialogue model
Add future Yarn import only if creator demand appears
```

### 3.4 Ren'Py

Recommendation: **Not a core runtime; possible export/reference for advanced visual novels**

Ren'Py is a mature visual novel engine, open source and free for commercial use. It supports multiple platforms, and its web packaging is HTML5/WebAssembly beta.

Official sources:

- https://www.renpy.org/
- https://www.renpy.org/doc/html/web.html

Why it is valuable:

- Extremely mature visual novel ecosystem.
- Good model for long-form VN production.
- Useful reference for comic-drama and VN-style workflows.

Why it should not be embedded as our main web platform runtime:

- It is a full engine, not a lightweight UGC story runtime.
- Web output is packaged as a whole game, not naturally as feed-native H5 cards.
- It makes platform review, remix, and hardware adaptation harder.

Primary use:

```text
Long-term export target for professional creators
Reference for VN workflow and script conventions
```

## 4. Recommended Integration Strategy

### 4.1 Do Not Replace The Platform Core

Gugu Flash should not become an ink clone, Twine clone, or Ren'Py hosting site.

The platform must keep its own product layer:

```text
GuguStoryProject
  editable creation source

GuguH5Pack
  published playable H5 runtime snapshot

ReviewCase
  rights, safety, publish, and store review

ComicEpisode
  comic-drama storyboard output
```

Open-source engines should sit under or beside these formats.

### 4.2 Primary Technical Path

```text
GuguStoryProject
  -> story-compiler
  -> ink-compatible runtime model
  -> inkjs preview/playtest
  -> GuguH5Pack publish snapshot
  -> Gugu web player/feed
```

This gives the team a real narrative engine while preserving platform control.

### 4.3 Where inkjs Fits

Add a new package:

```text
packages/narrative-runtime
```

Responsibilities:

- Load compiled ink JSON or generated runtime model.
- Run story state.
- Expose current text, choices, tags, variables, and save state.
- Convert runtime output into the current player UI model.
- Support automated traversal and playtest checks.

Do not expose raw ink scripting to casual users in MVP. Use it internally first.

### 4.4 Where Twine Fits

Add later:

```text
packages/story-importers
  twine-importer.js
  twee-importer.js
```

Responsibilities:

- Parse passage titles.
- Parse links.
- Convert simple passage graphs into `GuguStoryProject`.
- Reject or sandbox unsupported JavaScript/CSS.
- Produce warnings for variables or macros that cannot be mapped.

### 4.5 Where Ren'Py Fits

Do not use Ren'Py in the H5 feed runtime.

Possible future export:

```text
GuguStoryProject
  -> renpy-export
  -> .rpy script package
```

This is useful only for professional creator export, not for core platform playback.

## 5. Minimum Definition Of "Usable Text Game"

A work should not be called a usable text game unless it passes these gates:

### 5.1 Runtime Gates

- Has a valid entry scene.
- Every choice target exists.
- Every non-ending scene has at least one valid next step.
- At least one complete path reaches an ending.
- Branches are deterministic.
- Save and resume can restore story state.
- Replay resets state correctly.

### 5.2 Design Gates

- At least 5 scenes for generated works.
- At least 2 meaningful choices.
- At least 2 distinguishable endings for branching templates.
- No scene text exceeds mobile reading limits.
- Choices are action-like, not vague labels.
- Persona voice remains consistent.

### 5.3 Platform Gates

- Original/fanwork metadata is complete.
- Fanwork has selected `ipId`.
- AI provenance is recorded.
- Asset source declarations are complete.
- Review status is explicit.
- Published snapshot is immutable as a `WorkVersion`.

## 6. 30-Day Rescue Plan

### Week 1: Runtime Spike

Goal:

```text
Prove that the platform can run a real branching narrative runtime.
```

Tasks:

- Add `inkjs` to a controlled prototype package.
- Build a tiny adapter that loads one compiled ink JSON story.
- Display `Continue()` output and `currentChoices` in a Gugu-style player shell.
- Save and restore runtime state.
- Add a traversal script that checks all reachable choices.

Acceptance:

- A test story with two endings can be played in the browser.
- Automated traversal finds both endings.
- Broken choice targets fail tests.

### Week 2: Compiler Bridge

Goal:

```text
Connect GuguStoryProject to the runtime.
```

Tasks:

- Draft `GuguStoryProject` schema.
- Build `GuguStoryProject -> GuguH5Pack` compiler.
- Build `GuguStoryProject -> ink-like runtime source` experiment.
- Add validation for entry, nodes, edges, endings, and mobile text.

Acceptance:

- One project can produce both a Gugu preview pack and a runtime-playable story.
- Validation blocks unreachable required scenes.

### Week 3: AI Output Constraint

Goal:

```text
Stop AI from generating unplayable free-form drafts.
```

Tasks:

- Change AI generation contract to produce project graph, not loose scenes.
- Require nodes, edges, endings, and metadata.
- Add repair step for invalid graph output.
- Add quality report before showing the draft as "playable".

Acceptance:

- AI draft cannot enter preview unless it passes graph validation.
- Failed drafts show repair suggestions, not fake success.

### Week 4: Professional Creator MVP

Goal:

```text
Make creators able to fix the game.
```

Tasks:

- Add visual branch overview.
- Add scene editor.
- Add choice target editor.
- Add ending marker.
- Add playtest panel with path results.

Acceptance:

- A creator can fix a broken AI-generated story without touching code.
- Publish is blocked until runtime and platform gates pass.

## 7. Engineering Backlog

### P0

- `packages/core`: add `GuguStoryProject` schema and validators.
- `packages/story-compiler`: compile project to `GuguH5Pack`.
- `packages/narrative-runtime`: inkjs adapter spike.
- `apps/web` or `apps/creator-studio`: runtime preview shell.
- `apps/backend`: server-side publish validation.
- `tests`: traversal and playability tests.

### P1

- Twine/Twee importer for simple passage graphs.
- Branch graph editor.
- Save/resume story state.
- AI repair proposal flow.
- Comic storyboard compiler.

### P2

- Yarn import experiment.
- Ren'Py export experiment.
- Advanced variables, conditions, counters, inventory.
- Creator template marketplace.

## 8. Product Management Recommendation

Yes, we should integrate mature open-source projects.

But the integration order must be disciplined:

```text
1. inkjs as the real narrative runtime foundation
2. Twine/Twee as creator import/export ecosystem
3. Yarn Spinner as dialogue model reference
4. Ren'Py as future professional export/reference, not core runtime
```

The platform should not promise "AI makes a playable game" until the output passes runtime traversal and validation.

## 9. Mobile And Web Usability Position

The rescue plan must support two different creation experiences.

### Mobile Must Be Simple Enough For Non-Creators

Mobile should not expose the full professional editor. It should behave like a guided production assistant.

Required mobile experience:

```text
1. Pick creation type
2. Pick IP/persona/template
3. Enter one idea
4. Let AI produce a validated draft
5. Choose from guided improvement options
6. Preview the playable result
7. Resolve required checklist items
8. Publish
```

Mobile must hide or simplify:

- branch graph
- raw scripts
- runtime internals
- variable editing
- import/export tools
- detailed validation logs

Mobile must still enforce:

- playable runtime validation
- IP and rights metadata
- AI provenance
- asset source declarations
- publish review rules

### Web Must Be Professional Enough For Serious Creators

Web should expose the full production surface:

- branch graph
- scene and dialogue inspector
- advanced choice target editing
- story state and variable tools later
- playtest traversal report
- AI proposal diff
- project version history
- comic storyboard editor
- import/export adapters later
- operator-grade publish diagnostics

### Product Rule

```text
Mobile is the guided creation funnel.
Web is the professional production studio.
Both compile into the same validated platform formats.
```

From this point forward, every AI generation feature should be measured by:

```text
Can the generated work be played from start to ending?
Can every choice be resolved?
Can the user repair the structure?
Can the platform review and publish it safely?
```

If the answer is no, it is a story draft, not a text game.
