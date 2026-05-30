# Gugu Flash Moderation Staffing Plan

This plan turns the review and governance SOP into a staffing model for closed beta and public MVP. It does not claim real people have been assigned; it defines the roles, rota coverage, escalation path, and acceptance checks that must be satisfied before launch.

The machine-readable rota packet lives at `data/moderation-staffing-rota.json` and is validated with `npm run check:moderation-rota`.

## Scope

Moderation staffing covers:

- H5 publish review.
- Store listing review.
- Hardware adaptation review.
- Comment and content reports.
- Rights claims.
- Appeals.
- Operator action audit.
- Daily queue health review.

## Roles

| Role | Responsibility |
| --- | --- |
| Trust Lead | Owns content safety, reports, rights claims, appeals, and escalations |
| Operator Lead | Owns reviewer scheduling, queue hygiene, and audit completeness |
| Commerce Lead | Owns store listing, payment/refund risk, settlement freeze cases |
| Hardware Lead | Owns hardware adaptation and device-safety review |
| Support Lead | Owns support handoff and user-facing ticket continuity |
| Product Owner | Owns S0/S1 final decision and residual risk acceptance |
| Reviewer L1 | Handles low/medium content reports and routine H5 review |
| Reviewer L2 | Handles high-risk, rights, appeal, and second-review cases |

## Minimum Coverage

Closed beta minimum:

- 2 trained reviewers per beta day.
- 1 Trust Lead escalation owner per beta day.
- 1 Operator Lead queue owner per beta day.
- 1 Commerce Lead reachable for store/payment/refund cases.
- 1 Hardware Lead reachable for hardware/device-safety cases.
- Product Owner reachable for S0 cases.

Public MVP minimum:

- 2 active reviewers per coverage window.
- 1 backup reviewer per coverage window.
- 7-day escalation coverage for S0/S1 cases.
- Separation of duties for appeals: original action owner cannot be final appeal reviewer.
- Daily queue health review with oldest-case age and SLA breaches recorded.

## Queue Coverage

Every review layer and governance queue in `docs/review-governance-policy.json` must have:

- Primary owner role.
- Backup owner role.
- Minimum reviewers.
- SLA target.
- Escalation owner.
- Evidence handoff requirements.

## Escalation Matrix

| Severity | Response Target | Owner | Backup | Examples |
| --- | --- | --- | --- | --- |
| S0 | Same day | Product Owner | Trust Lead | Legal demand, minor safety, platform-wide payment failure |
| S1 | 24h | Trust Lead | Operator Lead | Paid content frozen, rights claim affecting store, repeated sync failure |
| S2 | 48h | Operator Lead | Support Lead | Routine reports, review delay, single appeal |
| S3 | 5 business days | Support Lead | Product Owner | General policy question or feature request |

## Operating Rules

- High-risk content, rights claims, and appeals require L2 or lead review.
- Appeals require second review by someone other than the original action owner.
- Every action must have reason, evidence, and operation log.
- S0/S1 cases must link support case id, source case id, target id, and request id if available.
- Daily queue review must check open reports, rights claims, appeals, review tasks, frozen settlements, failed sync jobs, payment/refund callbacks, and operator actions without reasons.

## Launch Exit Criteria

Moderation staffing cannot be marked ready until:

- Named human owners are assigned for all lead roles.
- Reviewer training completion is recorded.
- A beta rota covers the launch window.
- The rota packet records role slots, coverage windows, queue assignments, daily checks, training modules, and drills.
- An escalation drill is run and recorded.
- Queue dashboards or exports prove SLA tracking.
- Legal and Product Owner confirm S0/S1 handoff.
