# Memory Drift Guard

This document defines anti-drift controls for Memory implementations.

## 1. Top Drift Patterns

- Memory depends on Gateway/Engine/Auth internals.
- Components bypass Memory tools with direct filesystem/database reach-in.
- Conversations or structured owner data live outside Memory contract.
- Export surface is missing, partial, or non-portable.
- History degrades to metadata-only without prior-state support.
- Version-history startup readiness becomes warning-only.
- Path sandbox protections are weakened.
- Secrets appear in inspectable owner data surfaces.
- Backend swap forces contract changes in other components.

## 2. Prohibited Implementation Shortcuts

- Adding imports/dependencies from Memory to Gateway, Engine, or Auth.
- Direct external component writes into Memory internals bypassing tools/boundary interfaces.
- Using ephemeral in-process conversation stores as source of truth.
- Treating export/history as optional post-MVP features.
- Allowing path traversal outside memory root or into reserved internals.
- Storing secret-bearing values in normal owner content areas.
- Coupling storage backend specifics to consumer-facing contracts.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| MEMD-CHK-001 | Zero outward dependencies | Static dependency graph checks | Critical |
| MEMD-CHK-002 | Access only through approved boundaries | Cross-component integration and static scans | Critical |
| MEMD-CHK-003 | Core operation surface complete | Contract tests for read/write/edit/delete/search/list/history | Critical |
| MEMD-CHK-004 | Path sandbox enforcement | Negative path traversal/reserved-path tests | Critical |
| MEMD-CHK-005 | Durable write/edit/delete with audit trail | Persistence + audit integration tests | Critical |
| MEMD-CHK-006 | Conversation persistence in Memory boundary | Conversation create/append/list/detail tests | Critical |
| MEMD-CHK-007 | Canonical conversation envelope shapes | Response schema tests | High |
| MEMD-CHK-008 | Export completeness and open-format artifact | Export integrity tests | Critical |
| MEMD-CHK-009 | History includes prior-state behavior | History contract tests | Critical |
| MEMD-CHK-010 | Version-history readiness enforced at startup | Startup failure/readiness tests | Critical |
| MEMD-CHK-011 | Structured owner data exposed via Memory contract | Surface completeness tests | High |
| MEMD-CHK-012 | Secret leakage absent in inspectable surfaces | Security/content scan tests | Critical |
| MEMD-CHK-013 | Offline inspectability preserved | Runtime-off inspectability tests | High |
| MEMD-CHK-014 | Backend swap contract stability | Compatibility tests across alternate backends | High |

## 4. Contract-Break Indicators

- Memory module imports or calls Gateway/Engine/Auth.
- Non-Memory module writes directly to Memory storage internals.
- Conversations unavailable after restart or not retrievable via Memory boundary.
- Export missing conversations/history or failing to produce open archive.
- History responses lack prior-state field behavior.
- Startup continues despite version-history initialization failure.
- Path traversal and reserved path access succeed.
- Secrets appear in normal Memory content or export surfaces.
- Storage backend replacement forces Gateway/Engine contract changes.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `MEM-MUST-*` conformance vector fails.
- Export/history/startup readiness guarantees are unmet.
- Direct storage bypass paths are detected.
- Secret leakage is detected in inspectable Memory surfaces.
- Conflict register contains unresolved High-risk boundary/portability conflicts.

## 6. Drift Detection Checklist

- [ ] All `MEM-MUST-*` vectors pass (positive and negative).
- [ ] Memory has no outward dependencies.
- [ ] All access paths use approved Memory tools/boundaries.
- [ ] Core operation surface is complete and schema-valid.
- [ ] Path traversal/reserved-path protections pass.
- [ ] Write/edit/delete operations are durable and auditable.
- [ ] Conversations persist and are queryable via Memory contract.
- [ ] Export includes required owner data surface.
- [ ] History returns change records and prior-state behavior.
- [ ] Startup enforces deterministic version-history readiness.
- [ ] Structured owner data is not hidden outside Memory surface.
- [ ] Secrets are absent from normal inspectable Memory surfaces.
- [ ] Owner data is inspectable offline with standard tools.
- [ ] Backend swaps preserve consumer contract stability.
