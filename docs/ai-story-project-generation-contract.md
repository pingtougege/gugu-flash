# AI Story Project Generation Contract

Updated: 2026-05-30

Owner: AI Prompt And Model Ops Squad

## 1. Purpose

AI generation must produce a playable story project, not a pile of story text.

The required output target is:

```text
GuguStoryProject
  -> validateStoryProject
  -> compileStoryProjectToH5Pack
  -> createStoryProjectPlayabilityReport
```

If the generated project cannot pass validation, it is a draft proposal, not a playable text game.

## 2. Required AI Output Shape

The AI generation job must output JSON compatible with `gugu_story_project_v1`.

Required top-level sections:

```text
id
schemaVersion
title
status
origin
brief
world
persona
characters
storyGraph
script
assets
aiProvenance
```

Required graph fields:

```text
storyGraph.entryNodeId
storyGraph.nodes[]
storyGraph.edges[]
```

Required node fields:

```text
id
type
sceneId
title
```

Required edge fields:

```text
id
fromNodeId
toNodeId
label
```

Required scene fields:

```text
id
title
speaker
text
background
character
```

## 3. Hard Rules

The model must obey these rules:

1. `schemaVersion` must be `gugu_story_project_v1`.
2. `storyGraph.entryNodeId` must reference an existing node.
3. Every edge target must reference an existing node.
4. Every node must map to a script scene through `sceneId`.
5. At least one reachable node must have `type: "ending"`.
6. Branching templates must target at least two reachable endings.
7. Non-ending reachable nodes must have at least one outgoing edge.
8. Fanwork must include `origin.ipId`.
9. Scene text should be mobile-readable and short.
10. AI provenance must record provider/model/prompt/stage where available.

## 4. Job Stages

| Stage | Input | Output | Blocking Validation |
| --- | --- | --- | --- |
| `brief_from_prompt` | user prompt, origin, template | title, logline, tone, genre | title/logline required |
| `cast_design` | brief, persona, IP | characters and persona usage | persona must be present |
| `scene_graph` | brief, cast, template | nodes, edges, endings | graph validation |
| `script_draft` | graph, brief, cast | script scenes | every node maps to scene |
| `asset_prompt_plan` | script, style | cover/background/character prompts | source/prompt required |
| `quality_repair` | invalid project + errors | patch proposal | errors reduced or explained |

## 5. Failure Behavior

AI must not return fake success.

When validation fails:

```text
status: failed_or_needs_repair
proposal: invalid_project_or_patch
validationErrors: [...]
repairPlan: [...]
```

The frontend should show:

```text
AI 已生成草稿，但还不能试玩。
需要修复：入口、跳转、结局、或版权信息。
```

## 6. Minimum Prompt Contract

Generation prompt must include:

```text
user idea
contentOrigin
ipId/ipName when fanwork
persona
template
target scene count
target ending count
target schema
validation rules
mobile text limits
rights rules
```

## 7. Acceptance Criteria

An AI generation job is considered successful only when:

```text
validateStoryProject(project).length === 0
validatePack(compileStoryProjectToH5Pack(project)).length === 0
createStoryProjectPlayabilityReport(project).status !== "blocked"
```

Anything else is a repairable draft, not a playable work.
