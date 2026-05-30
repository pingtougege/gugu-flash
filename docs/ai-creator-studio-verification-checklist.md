# AI Creator Studio Verification Checklist

Updated: 2026-05-30

Owner: QA And Release Squad

## 1. Standard Verification Commands

Run these after StoryProject, backend API, or guided creation changes:

```bash
rtk npm run test:unit
rtk npm run check:content
rtk npm run check:ai-creation-maturity
```

Run focused e2e checks when UI/API behavior changes:

```bash
rtk npm run test:e2e -- tests/e2e/gugu-flash-flows.spec.js --grep "generated creation deck|fanwork creation is blocked|create workspace uses full screen|original work can be published"
rtk npm run test:e2e -- tests/e2e/gugu-flash-http-api.spec.js --grep "web can publish"
```

## 2. Phase 0 Backend/API Acceptance

StoryProject backend/API is not complete until these are true:

- `POST /flash/story-projects` creates a project.
- `GET /flash/story-projects` lists projects.
- `GET /flash/story-projects/:id` reads one project.
- `PATCH /flash/story-projects/:id` updates one project.
- `POST /flash/story-projects/:id/versions` creates a version snapshot.
- `POST /flash/story-projects/:id/compile/h5` returns a compiled H5 preview draft.
- Invalid story graphs return validation errors and do not pretend success.
- Fanwork without IP metadata is blocked.

Current status:

```text
API routes are reserved and covered as Backend Alpha stubs.
Real backend behavior is still in progress.
```

## 3. Phase 1 Mobile Guided Creation Acceptance

Mobile guided creation is not complete until these are true:

- User can start from one idea.
- User can choose original/fanwork.
- Fanwork requires IP/persona selection.
- AI generates a validated draft.
- User can preview from start to at least one ending.
- User can resolve required checklist items.
- User can publish H5 after checks pass.
- 375x667 viewport has no overlapping primary actions.
- Casual user flow does not expose branch graph, raw scripts, variables, or import/export complexity.

Closest existing tests:

- `tests/e2e/gugu-flash-flows.spec.js`
- Existing flows around generated creation deck, fanwork blocking, full-screen create workspace, and original publishing.

## 4. Phase 2 Web Skeleton Acceptance

Web Creator Studio skeleton is not complete until these are true:

- Project list opens.
- Project detail opens.
- Scene list is visible.
- Basic scene inspector is visible.
- Quality checks are visible.
- H5 phone preview can compile from the project.
- One scene can be edited and saved.
- Publish diagnostics are shown.

Explicitly out of scope for Phase 2:

- Full branch graph editing.
- Raw script editor.
- Twine/ink import UI.
- Advanced variables.
- Full version diff UI.

Current status:

```text
No dedicated apps/creator-studio or e2e coverage yet.
```

## 5. Existing Test Map

| Area | Existing Evidence |
| --- | --- |
| StoryProject core | `packages/core/src/gugu-story-project.test.js` |
| API contract | `packages/api-client/src/flash-api-contract.test.js` |
| Backend Alpha coverage | `apps/backend/src/alpha-route-coverage.test.js` |
| Mobile creation flow | `tests/e2e/gugu-flash-flows.spec.js` |
| HTTP integration | `tests/e2e/gugu-flash-http-api.spec.js` |

## 6. Progress Report Fields

Every progress report should use:

```text
module
DRI
status
completed_this_update
next_action
verification_evidence
blocker
risk_level
can_enter_next_phase
```

Recommended statuses:

```text
not_started
in_progress
ready_for_qa
qa_passed
blocked
done
```
