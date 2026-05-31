# InkOS Research And Gugu Adaptation

Updated: 2026-05-31

Source reviewed: <https://github.com/Narcooo/inkos>

License note: Narcooo/inkos is `AGPL-3.0-only`. Gugu Flash must not copy source code, prompts, templates, or generated implementation details from that project unless the product accepts AGPL obligations or obtains separate permission. This document records clean-room product and architecture lessons only. The implementation in `packages/core/src/gugu-story-agent-pipeline.js` is Gugu-native code written against our own `GuguStoryProject` and `GuguH5Pack` contracts.

## 1. What InkOS Is

InkOS is an autonomous fiction-writing system. Its main value is not a single model prompt; it is a production pipeline:

```text
control docs
  -> planning intent
  -> runtime context package
  -> draft
  -> state settlement
  -> audit
  -> repair
  -> persisted truth state
```

The project is organized around separate CLI, core, and Studio packages. Its core package contains agent roles, runtime-state models, pipeline runners, interaction routing, truth-file management, LLM provider routing, and tests for each slice.

## 2. Useful Ideas For Gugu

The most relevant ideas are:

- **Truth files as product primitives**: long-term author intent, current focus, world state, character matrix, unresolved hooks, chapter summaries, and asset/source state are treated as authoritative context.
- **Plan before writing**: the planner creates an explicit per-chapter intent, and the composer turns it into a smaller runtime context package.
- **Separate generation from settlement**: generated text is not accepted as truth until a structured delta is validated and applied.
- **Audit and repair loop**: audit issues are categorized, scored, and passed into a reviser. The system does not silently pretend a broken draft is successful.
- **Human-readable and machine-readable state**: structured JSON is the authority, while Markdown/projections are for human review.
- **Shared interaction kernel**: CLI, TUI, Studio, and external agents use the same underlying operations.

## 3. What We Should Not Copy

Do not copy:

- TypeScript source code.
- Prompt text or genre rule wording.
- Exact audit dimension definitions.
- Studio UI code.
- CLI command implementations.
- Runtime state schemas as-is.

Those parts are AGPL-covered implementation. Gugu should use the concept, but keep a narrower interactive-story model.

## 4. Gugu Mapping

InkOS is optimized for long-form novels. Gugu is optimized for short, playable, reviewable H5/storyboard content.

| InkOS concept | Gugu adaptation |
| --- | --- |
| Book | `GuguStoryProject` |
| Chapter | scene graph slice / playable draft |
| Truth files | `StoryTruthBundle` |
| Planner | `brief_from_prompt`, `cast_design`, `scene_graph` stages |
| Composer | `StoryAgentRuntimePlan.selectedContext` and `ruleStack` |
| Writer | existing AI draft generator plus future staged jobs |
| Observer/Reflector | future structured patch jobs for scenes/assets/rights |
| Auditor | `auditStoryProjectWithTruth` |
| Reviser | `createStoryRepairProposal` |
| Final runtime | `GuguH5Pack` and `ComicEpisode` |

## 5. Implemented Slice

Added:

```text
packages/core/src/gugu-story-agent-pipeline.js
packages/core/src/gugu-story-agent-pipeline.test.js
```

Exported from:

```text
packages/core/src/index.js
```

Integrated into:

```text
apps/backend/src/ai-draft-generator.js
apps/backend/src/flash-http-server.js
packages/api-client/src/mock-flash-api.js
```

The implemented module creates:

- `StoryTruthBundle`: author intent, current focus, world state, character matrix, branch hook ledger, choice ledger, scene summaries, and asset/right state.
- `StoryAgentRuntimePlan`: staged job plan, selected context, rule stack, and trace.
- `auditStoryProjectWithTruth`: deterministic audit over schema, playability, endings, branches, choices, mobile text, persona voice, assets/rights, provenance, and hardware pressure.
- `createStoryRepairProposal`: ordered repair actions grouped by stage.
- `enrichStoryProjectWithAgentWorkup`: attaches the workup and a compact `story_agent_audit` quality report to saved/generated projects.

## 6. Next Steps

Recommended next implementation slices:

1. Add backend endpoints for `POST /flash/story-projects/:id/audit` and `POST /flash/story-projects/:id/repair-proposals`.
2. Make AI generation jobs write stage outputs into `agentWorkup.runtimePlan.stages`.
3. Add a Creator Studio panel for truth bundle, audit dimensions, and repair queue.
4. Add structured patch application for safe scene/choice/asset repairs.
5. Persist story-project versions before applying AI repair proposals.
