# Gugu Flash Monitoring And Alerts Plan

This plan defines the first monitoring baseline for moving from Alpha to public MVP. It is intentionally smaller than a production observability stack, but it creates concrete signals, alert inputs, and release gates that can be wired into real hosting later.

The production monitoring and alerting packet lives at `data/production-monitoring-alerting-packet.json` and is validated with `npm run check:production-monitoring`.

## Scope

Monitoring must cover:

- API health and uptime.
- Request volume, status classes, and request correlation id.
- Auth/session failures and operator permission denials.
- Payment and refund callback failures.
- Device sync failures and retry loops.
- Review, report, rights claim, appeal, and moderation queues.
- Frozen settlements and commerce risk states.
- Web smoke flow and backend HTTP-mode smoke flow.

## Alpha Signals

Backend Alpha exposes:

- `GET /flash/health` for public health checks.
- `X-Gugu-Request-Id` for request correlation.
- `X-Gugu-Service` for service identity.
- `GET /flash/operator/ops-metrics` for operator-only Alpha metrics.
- Request counters by status class.
- Request counters by exact status code.
- Request counters by path.
- Last request id, last request timestamp, last 5xx timestamp/path, and max duration.
- Alert inputs for 5xx, 401/403 auth denials, payment callback failures, refund mismatches, device sync failures, review queue age, frozen settlement age, and Web smoke status.
- `gugu_flash_monitoring_alert_rules_v1` alert evaluation rules in `apps/backend/src/monitoring-alerts.js`.

## Alert Drafts

Production alert rules must include:

| Alert | Condition | Severity | Owner |
| --- | --- | --- | --- |
| API down | `/flash/health` fails for 3 consecutive checks | S0 | DevOps Lead |
| API 5xx spike | 5xx rate exceeds threshold for 5 minutes | S1 | Backend Lead |
| Auth denied spike | 401/403 spike on user/operator routes | S1 | Security / Backend Lead |
| Payment callback failure | invalid signature, amount mismatch, or unpaid successful provider event | S1 | Commerce Lead |
| Refund mismatch | provider refund state and platform state disagree | S1 | Commerce Lead |
| Sync failure spike | failed sync jobs exceed threshold by device model/firmware | S1 | Hardware Lead |
| Review queue aging | open review/report/appeal items exceed SLA | S1 | Trust Lead |
| Frozen settlement aging | frozen settlement exceeds review SLA | S1 | Commerce Lead |
| Web smoke failure | publish/list/purchase/download/sync flow fails | S1 | QA Lead |

## Dashboard Draft

Minimum dashboard panels:

- API status and uptime.
- Request count by status class.
- Request count by exact status code.
- Top paths by request count.
- Last 5xx path and timestamp.
- Active alerts from `evaluateMonitoringAlerts`.
- Payment/refund callback outcomes.
- Device sync failures by `failureReason`.
- Review queue counts and oldest item age.
- Frozen settlements count.
- Web HTTP-mode smoke status.

## External Work

Before public MVP, the team must connect these Alpha signals to production infrastructure:

- Hosted metrics backend.
- Centralized logs with request id search.
- Alert delivery channel and on-call routing.
- Synthetic checks for Web and API.
- Dashboard snapshots for launch readiness.
- Production monitoring packet with service targets, signal sources, alert routes, synthetic checks, dashboard panels, incident drills, and external blockers.

## Exit Criteria

Public MVP monitoring cannot be marked ready until:

- Production health checks run from outside the hosting region.
- Alerts are routed to named owners.
- Dashboards are visible to Product, Ops, Backend, Hardware, Commerce, and Trust leads.
- At least one incident drill validates the escalation path.
- The monitoring packet has real production URLs, named on-call delivery routes, synthetic check results, dashboard evidence, and incident drill records.
