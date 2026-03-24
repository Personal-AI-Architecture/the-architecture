# Deployment Boundary Drift Guard

This document defines anti-drift controls for Deployment boundary implementations.

## 1. Top Drift Patterns

- Local-owner-controlled baseline replaced by hosted-only requirement.
- Offline path removed or made non-functional.
- Default bind broadened from localhost to public/network exposure.
- Baseline deployment split into mandatory multi-service topology.
- Owner data egress enabled by default without explicit configuration.
- Hidden remote infrastructure dependency introduced for startup.
- Startup readiness order altered or critical failures downgraded to warnings.
- Day-one export/persistence guarantees deferred.
- Unsupported adapter silently remapped/fallback behavior introduced.
- Deployment profile changes mutate architecture boundaries.
- Updates risk owner-data loss or remove rollback capability.
- Remote exposure enabled implicitly instead of explicit owner action.

## 2. Prohibited Implementation Shortcuts

- Shipping runtime defaults as `0.0.0.0` without explicit profile opt-in.
- Requiring internet/cloud model for baseline loop.
- Skipping deterministic startup ordering checks.
- Treating export/persistence guarantees as post-MVP hardening.
- Auto-fallback on unsupported adapter.
- One-way migrations with no rollback path.
- Embedding deployment-specific component/API ownership changes.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| DEPD-CHK-001 | Owner-controlled hardware path exists | Deployment profile verification | Critical |
| DEPD-CHK-002 | Offline functional loop path exists | Offline integration test | Critical |
| DEPD-CHK-003 | Default bind posture is localhost-only | Runtime bind default test | Critical |
| DEPD-CHK-004 | Single-unit baseline deployment exists | Packaging/start command checks | High |
| DEPD-CHK-005 | Owner data local by default | Data-flow and egress configuration audit | Critical |
| DEPD-CHK-006 | No hidden mandatory remote infra | Dependency graph/startup dependency checks | Critical |
| DEPD-CHK-007 | Startup order deterministic | Startup phase event sequence test | Critical |
| DEPD-CHK-008 | Critical readiness failures fail fast | Negative startup tests | Critical |
| DEPD-CHK-009 | Day-one export and persistence guarantees present | First-run readiness tests | Critical |
| DEPD-CHK-010 | Unsupported adapter fails clearly | Startup negative tests | Critical |
| DEPD-CHK-011 | Deployment profile changes preserve architecture boundaries | Ownership/API classification tests | Critical |
| DEPD-CHK-012 | Update path preserves owner data | Update simulation tests | Critical |
| DEPD-CHK-013 | Rollback path exists and is usable | Update/rollback integration tests | High |
| DEPD-CHK-014 | Network exposure requires explicit owner action | Exposure-policy tests | Critical |

## 4. Contract-Break Indicators

- Runtime defaults expose network interfaces beyond localhost without explicit config.
- Baseline loop fails without internet connectivity.
- Startup sequence omits required phases or marks ready before guarantees are met.
- Export/conversation persistence unavailable on fresh startup.
- Unknown adapter values succeed via implicit remap.
- Update process modifies or deletes existing owner data unexpectedly.
- Deployment profile adds component/API ownership responsibilities.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `DEP-MUST-*` conformance vector fails.
- Localhost-only default posture is violated without explicit override profile.
- Offline baseline loop cannot complete.
- Critical startup failures continue as warning-only behavior.
- Owner-data safety or rollback checks fail.
- Conflict register includes unresolved High-risk deployment conflicts.

## 6. Drift Detection Checklist

- [ ] All `DEP-MUST-*` vectors pass (positive and negative).
- [ ] Local owner-controlled deployment path exists.
- [ ] Offline functional loop path is verified.
- [ ] Default bind posture is localhost-only.
- [ ] Single-unit baseline deployment works.
- [ ] Owner data remains local by default.
- [ ] Hidden remote infrastructure is not required for baseline operation.
- [ ] Startup phases occur in deterministic order.
- [ ] Critical startup failures fail fast.
- [ ] Day-one export and persistent conversation path are available.
- [ ] Unsupported adapter fails clearly with no silent fallback.
- [ ] Deployment profile changes do not alter component/API ownership.
- [ ] Updates preserve owner data.
- [ ] Rollback path is documented and testable.
- [ ] Remote exposure requires explicit owner action.
