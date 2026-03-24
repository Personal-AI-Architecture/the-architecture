# Auth Drift Guard

This document defines anti-drift controls for Auth implementations.

## 1. Top Drift Patterns

- Auth middleware missing or bypassed on protected paths.
- Local-owner mode implemented as no-auth mode.
- Authorization logic scattered across Gateway/Engine/tool modules.
- Permission checks degraded to implicit allow behavior.
- Auth-state export omitted, opaque, or provider-owned.
- Secret material written into inspectable owner data.
- Missing auth tools (`auth_whoami`, `auth_check`, `auth_export`).
- Actor context not propagated to Engine/tool execution.
- Audit records missing for denied or approved auth decisions.

## 2. Prohibited Implementation Shortcuts

- Defaulting to allow on header parsing or context reconstruction failure.
- Treating local-owner mode as a bypass instead of a boundary.
- Storing password hashes, raw tokens, API keys, or session secrets in normal Memory files.
- Hardcoding permission grants in non-Auth modules.
- Returning unmanaged provider-specific auth blobs from `auth_export`.
- Removing required auth tools from runtime startup sources.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| AUTHD-CHK-001 | Protected routes require Auth | Unauthorized integration tests on protected endpoints | Critical |
| AUTHD-CHK-002 | Auth context parsing and normalization enforced | Header/credential validation tests | Critical |
| AUTHD-CHK-003 | Fail-closed behavior on invalid auth input | Negative tests for missing/malformed credentials | Critical |
| AUTHD-CHK-004 | Permission denial enforced when flags are absent | Authorization unit + integration tests | Critical |
| AUTHD-CHK-005 | Approval authority gate enforced | Approval-decision permission tests | Critical |
| AUTHD-CHK-006 | Tool list/execution filtered by Auth permissions | Tool availability/execution tests | Critical |
| AUTHD-CHK-007 | Product-owned auth-state file created/loaded at startup | Startup readiness tests | Critical |
| AUTHD-CHK-008 | `auth_export` returns non-secret product-owned state | Export schema and secret-field rejection tests | Critical |
| AUTHD-CHK-009 | Required auth tools are available | Tool discovery tests | High |
| AUTHD-CHK-010 | Actor context reaches Engine/tool runtime | End-to-end context propagation tests | High |
| AUTHD-CHK-011 | Structured auth audit events exist | Audit sink assertions for authorized + denied paths | High |
| AUTHD-CHK-012 | Auth remains boundary-scoped in ownership | Static architecture-boundary checks | Critical |

## 4. Contract-Break Indicators

- Protected request succeeds without authenticated context.
- Missing/malformed headers result in allow behavior.
- Approval route accepts actor lacking `approval_authority`.
- Restricted tools execute for unauthorized actor.
- `auth_export` includes secret-like fields or opaque provider payload.
- Required auth tools are missing at runtime.
- Local-owner mode has no effective auth validation.
- Auth module gains conversation routing or model-loop responsibilities.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `AUTH-MUST-*` conformance vector fails.
- Secret-field leakage is detected in auth export/state surfaces.
- Auth bypass is possible on any protected route.
- Conflict register contains unresolved High-risk ownership/security conflicts.

## 6. Drift Detection Checklist

- [ ] All `AUTH-MUST-*` vectors pass (positive and negative).
- [ ] Protected routes enforce Auth.
- [ ] Invalid credentials fail closed.
- [ ] Permission enforcement denies unauthorized actions.
- [ ] Approval decisions require `approval_authority`.
- [ ] Tool access is permission-filtered.
- [ ] Startup creates/loads product-owned auth state.
- [ ] `auth_export` excludes secret material.
- [ ] `auth_whoami`, `auth_check`, and `auth_export` are present.
- [ ] Actor context propagates to Engine/tool execution.
- [ ] Structured auth audit records exist for allow + deny paths.
- [ ] Auth module remains ownership-clean (identity/access only).
