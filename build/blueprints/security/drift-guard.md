# Security Drift Guard

## Canonical contract sources

This package is derived from the canonical contract tree. The adjacent `contract-pack.json` is a source manifest, not an independent schema. Validate payloads against the listed files under `contracts/`; do not add competing shapes here.

This document defines anti-drift controls for Security cross-cutting implementations.

## 1. Top Drift Patterns

- Secret-bearing values appear in Memory or in any file git tracks.
- Raw provider/runtime exception text leaks into client-visible or stream-visible error surfaces.
- Mid-stream taxonomy collapses to one generic error code.
- Sensitive actions execute without structured audit records.
- An approval rule remains a prompt suggestion instead of coded interception.
- Approval on every write shipped as an architecture default instead of a product or owner choice.
- "Environment safety" or product rules override the owner on the owner's own hardware.
- Untrusted tools run unisolated by default.
- Where a product adds approvals, they exist only in local UI flow and not in contract-visible events/routes.
- Protected paths are reachable without the Gateway calling Auth, or tool calls run without the Agent Loop asking Auth.
- Request payloads become hidden runtime/provider/tool configuration channels.
- Tool boundaries rely only on Auth policy and lack independent runtime isolation scope.
- Auth export includes credentials, hashes, or opaque secret blobs.
- Security controls are deferred as post-MVP hardening.
- Correlation IDs fail to propagate to tool/audit layers.
- Memory export, version history or restore safety net is disabled or warning-only.
- Component or adapter swaps regress previously enforced security behavior.

## 2. Prohibited Implementation Shortcuts

- Persisting `api_key`, `token`, `password`, or equivalent in tracked files.
- Forwarding `Error.message`, stack traces, filesystem paths, or provider internals in exposed errors.
- Mapping all mid-stream failures to one catch-all error code.
- Running a tool call an approval rule covers without coded interception.
- Resolving approvals only in local client logic with no contract event trail.
- Implementing permissive local mode as auth bypass.
- Accepting hidden metadata fields that modify runtime/provider/tool settings.
- Treating tool permissions as sufficient without runtime scope boundary checks.
- Logging only best-effort events for sensitive actions.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| SECD-CHK-001 | Secrets absent from forbidden storage surfaces | Static scans + integration tests over Memory/config/auth export | Critical |
| SECD-CHK-002 | Exposed errors are sanitized and safe | Stream/API error payload tests | Critical |
| SECD-CHK-003 | Mid-stream error codes remain taxonomy-valid | Stream conformance tests (`provider_error`, `tool_error`, `context_overflow`) | Critical |
| SECD-CHK-004 | Sensitive actions emit structured audit events | Audit sink assertions for auth/tool/approval/memory actions | Critical |
| SECD-CHK-005 | Approval rules, where set, are enforced by coded interception | Tool execution tests with an approval rule and pending decision state | Critical |
| SECD-CHK-006 | Approval is contract-visible where a product adds approvals | Stream + decision-route tests for `approval-request`/`approval-result` | Critical |
| SECD-CHK-007 | Gateway calls Auth per request and Agent Loop asks Auth per tool call; both fail closed | Unauthorized request and refused tool-call tests | Critical |
| SECD-CHK-008 | Request payloads cannot reconfigure runtime/provider/tools | Negative metadata payload tests | Critical |
| SECD-CHK-009 | Tool boundaries enforce scope independent of Auth-only checks | Runtime boundary and isolation tests | Critical |
| SECD-CHK-010 | Auth export excludes secret-bearing fields | Export schema + forbidden-field checks | Critical |
| SECD-CHK-011 | Security controls active at startup readiness | Startup gate tests (auth/audit/safe-errors/approval) | Critical |
| SECD-CHK-012 | Correlation IDs propagate across boundaries | End-to-end trace tests Gateway->Auth->Agent Loop->tools->audit | High |
| SECD-CHK-013 | Export, history and restore safety net remains active | Memory export/history/restore readiness tests | Critical |
| SECD-CHK-014 | Security properties survive swap scenarios | Adapter/provider/component swap regression suite | High |
| SECD-CHK-015 | Owner can do everything by default with no approval step | Fresh-install write tests | Critical |
| SECD-CHK-016 | No rule overrides the owner on the owner's hardware | Merge-order and override tests | Critical |
| SECD-CHK-017 | Untrusted tools isolated by default | Isolation tests for tools not marked trusted | Critical |

## 4. Contract-Break Indicators

- Any response contains raw credentials, tokens, stack traces, or internal file paths.
- Any mid-stream error code is outside approved taxonomy.
- A call an approval rule covers executes before decision.
- Approval decision can be made without approval authority.
- An approval prompt appears for the owner with no approval rule set.
- A tool call runs without an Auth decision.
- Unauthorized request reaches Agent Loop execution.
- Hidden request fields alter adapter/provider/tool/runtime behavior.
- Tool runtime accesses out-of-scope resources despite auth policy.
- Auth export response contains secret-like fields.
- Startup proceeds while core security controls are inactive.

## 5. Fail Build If

- Any Critical check in section 3 fails.
- Any `SEC-MUST-*` conformance vector fails.
- Secret leakage is detected in inspectable/contract-visible surfaces.
- Approval enforcement or approval visibility is broken where approval rules exist.
- A rule overrides the owner on the owner's own hardware.
- Auth bypass exists on any protected path.
- Mid-stream taxonomy or safe-error requirements are violated.
- Unresolved High-risk conflict remains in the Security conflict register.

## 6. Drift Detection Checklist

- [ ] All `SEC-MUST-*` positive and negative vectors pass.
- [ ] No secret values exist in forbidden storage locations.
- [ ] Pre-stream and mid-stream errors are sanitized and safe.
- [ ] Mid-stream errors use only approved taxonomy.
- [ ] Sensitive actions emit structured audit records.
- [ ] Approval rules, where set, are enforced in code.
- [ ] Where a product adds approvals, interactions are contract-visible.
- [ ] The Gateway calls Auth on every request and the Agent Loop asks Auth before each tool call; both fail closed.
- [ ] The owner can do everything by default, with no approval step.
- [ ] No rule overrides the owner on the owner's own hardware.
- [ ] Untrusted tools run isolated by default.
- [ ] Request payloads do not reconfigure runtime/provider/tools.
- [ ] Tool scope/isolation boundaries are independent of Auth-only enforcement.
- [ ] Auth export excludes credentials/secrets.
- [ ] Day-one startup enables required security controls.
- [ ] Correlation-aware traceability is end-to-end.
- [ ] Export, history and restore safety net remains available.
- [ ] Security controls survive swap/regression scenarios.
