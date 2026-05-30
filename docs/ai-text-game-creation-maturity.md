# AI Text-Game Creation Maturity Plan

Updated: 2026-05-29

This document records the rebuilt AI creation team's first takeover review for Gugu Flash.

## 1. Takeover Charter

The previous creation team is replaced by the roster in `data/ai-creation-team-roster.json`.

Operating rules:

- Every squad must have at least 3 named members.
- Product maturity claims must be backed by executable checks or explicit external signoff.
- H5 publishing, store listing, hardware production, and device install remain separate lifecycles.
- User creation stays structured; users do not generate unrestricted device code.
- AI may draft, rewrite, and suggest, but publish/review gates stay accountable to product, safety, and release owners.

## 2. Full Squad Coverage

Required squads:

- `product_strategy`
- `narrative_design`
- `game_systems`
- `ai_prompt_model_ops`
- `frontend_experience`
- `backend_platform`
- `safety_rights_moderation`
- `native_hardware`
- `commerce_support_ops`
- `qa_release`
- `content_ops`

Each squad owns a review signal that can be checked in code, release evidence, or external launch packets.

## 3. Takeover Review Findings

What is strong:

- The repo already has a coherent Gugu Flash product shape: feed, H5 player, creator, remix, IP pool, store, devices, operator console, Backend Alpha API, and release evidence.
- Shared domain logic lives in `packages/core`.
- Browser and Backend Alpha clients are separated by `packages/api-client`.
- AI provider keys stay server-side, with local-rule fallback.
- Release gates are explicit and already block Closed Beta and Public MVP when external evidence is missing.

What was not mature enough:

- `npm test` was red because `ai.generateImage` was implemented but missing from Backend Alpha route coverage.
- Seed content had only 3 short packs, all 4 scenes, which was too thin to prove a repeatable AI text-game creation medium.
- Draft quality checks validated structure but not enough narrative maturity: branch density, ending payoff, prompt specificity, persona voice, repetition, and provenance.
- The project team structure existed as lead roles, but not as fully staffed squads with at least 3 members each.
- Public MVP blockers still require real external evidence: identity provider, production database, payment sandbox, real device captures, legal approval, staffed moderation/support, hosted monitoring, upload scanning, and signed native builds.

## 4. Mature Internal-Creation Definition

Gugu Flash can call the AI text-game creation loop internally mature when all of the following pass:

- Every creation squad in `data/ai-creation-team-roster.json` has at least 3 members.
- Backend Alpha route coverage matches the shared API contract.
- `createDraftQualityChecks` includes structural, narrative, provenance, and review-readiness checks.
- Seed content has at least 6 showcase packs, with at least 3 packs containing 6 or more scenes.
- Generated drafts pass schema validation and have no blocked quality checks.
- Internal prototype release gate remains ready while Closed Beta and Public MVP stay blocked unless external evidence exists.
- `npm run check:ai-creation-maturity`, `npm test`, and `npm run test:e2e` pass.

## 5. Decisions From The First Review Meeting

Decision 1: fix automated evidence before adding more feature surface.

Decision 2: make narrative quality a core-domain concern, not only UI copy.

Decision 3: expand launch/showcase content without pretending external IP, payments, devices, or legal approvals are done.

Decision 4: preserve existing user changes and work inside the current prototype architecture.

Decision 5: report the product as internally stronger, but not public-MVP mature until external release blockers are genuinely cleared.

## 6. Next External Gates

The following cannot be completed by repo-only edits:

- Production identity provider and real credential verification.
- Production database provisioning, migration execution, backup, restore, and rollback replay.
- Payment sandbox credentials, webhook setup, and real settlement reconciliation.
- Physical Circle 185 device matrix, BLE captures, and hardware lead signoff.
- Qualified legal approval, privacy approval, commerce refund terms approval.
- Named human moderation and support rotas with training evidence.
- Hosted monitoring, alert delivery, TLS/secrets review, and upload scanning/storage isolation.
