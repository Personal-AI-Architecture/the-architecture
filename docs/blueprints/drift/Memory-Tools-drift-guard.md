# Memory Tool Surface Drift Guard

This document defines anti-drift controls for Memory Tool Surface implementations.

## 1. Top Drift Patterns

- Missing one or more mandatory memory tools from runtime surface.
- Path-confinement checks bypassed or inconsistently applied.
- Reserved internals (`.git` and equivalents) exposed through memory tools.
- Mutating operations executing without approval.
- Mutations happening without audit and version commit trail.
- Search behavior drifting to empty-query acceptance.
- Search output leaking secret-like token patterns.
- History responses collapsing to metadata-only output.
- Export behavior becoming optional, partial, or non-owner-scoped.
- Error taxonomy collapsing to generic/untyped failures.
- Startup degrading memory/history/export readiness to warning-only.
- Components directly reading/writing memory storage outside approved boundaries.

## 2. Prohibited Implementation Shortcuts

- Treating memory tools as optional convenience features.
- Implementing path checks in some operations but not all.
- Allowing hidden flags to disable reserved-path blocks in request payloads.
- Replacing coded approval with prompt instruction text.
- Skipping audit/commit on mutating operations for performance shortcuts.
- Removing prior-state support from history output to simplify implementation.
- Returning raw exceptions directly from runtime/tool layer.
- Allowing startup to continue when version/history guarantees fail.
- Accessing memory storage directly from Gateway/Engine/Auth paths.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| MTLD-CHK-001 | Canonical memory tool surface exists | Tool registration + contract tests | Critical |
| MTLD-CHK-002 | Path confinement enforced on all path-bearing operations | Escape-path negative tests | Critical |
| MTLD-CHK-003 | Reserved internals are blocked | Reserved-path negative tests | Critical |
| MTLD-CHK-004 | Mutations are approval-gated | Approval interaction tests | Critical |
| MTLD-CHK-005 | Mutations emit structured audit + version commit | Mutation integration tests | Critical |
| MTLD-CHK-006 | Read-only operations run without approval | Read-only behavior tests | High |
| MTLD-CHK-007 | Search enforces non-empty query and default conversation exclusion | Search behavior tests | Critical |
| MTLD-CHK-008 | Search output redacts secret-like token patterns | Sanitization tests | Critical |
| MTLD-CHK-009 | History includes prior-state capability | History contract tests | Critical |
| MTLD-CHK-010 | History path policy aligns with file-op policy | Cross-operation path-policy tests | High |
| MTLD-CHK-011 | Export returns memory-owned archive path | Export integration tests | Critical |
| MTLD-CHK-012 | Failure taxonomy remains classified and safe | Error mapping/sanitization tests | Critical |
| MTLD-CHK-013 | Startup readiness requires memory/history/export guarantees | Startup phase + failure tests | Critical |
| MTLD-CHK-014 | Components do not bypass memory tool/boundary path | Static + integration boundary tests | Critical |

## 4. Contract-Break Indicators

- `memory_*` tool names missing from available surface.
- Escaped paths (`../...`) accepted by any memory operation.
- `.git` entries visible in list/search outputs.
- `memory_write/edit/delete` execution observed without `approval-request`/decision flow.
- Mutation succeeds without audit log and version commit evidence.
- `memory_search` accepts empty query or emits unredacted secret pattern.
- `memory_history` output contains no prior-state capability.
- `memory_export` returns empty path or non-owner-scoped destination.
- Failure messages contain stack traces or internal file paths.
- Startup reaches ready-state after history/version readiness failure.
- Gateway/Engine/Auth paths show direct filesystem/database memory access.

## 5. Fail Build If

- Any Critical check in section 3 fails.
- Any `MTL-MUST-*` conformance vector fails.
- Approval bypass exists for mutating operations.
- Path escape or reserved-path access is possible.
- Secret-like token redaction in search output fails.
- Export/history day-one readiness requirements are not met.
- Direct component storage reach-in bypasses approved memory boundary.
- Unresolved High-risk conflict remains in Memory-Tools conflict register.

## 6. Drift Detection Checklist

- [ ] Canonical memory tools are all present.
- [ ] Every path-bearing operation enforces memory-root confinement.
- [ ] Reserved internals are inaccessible through memory tools.
- [ ] Mutating operations are approval-gated.
- [ ] Mutating operations emit structured audit and version commits.
- [ ] Read/list/search/history/export remain read-only no-approval paths.
- [ ] Search rejects empty query and defaults to conversation exclusion.
- [ ] Search output applies secret-like token redaction.
- [ ] History returns change records with prior-state capability.
- [ ] History uses same path policy as other memory operations.
- [ ] Export returns memory-owned archive path.
- [ ] Failure messages are classified and sanitized.
- [ ] Startup readiness enforces memory/history/export guarantees before ready.
- [ ] No component bypasses memory tool/boundary access rules.
