# Auth Drift Guard

This document defines anti-drift controls for Auth implementations.

## 1. Top Drift Patterns

- Gateway skips the Auth call on a protected request, or the Agent Loop runs a tool without asking Auth first.
- Local-owner mode implemented as no-auth mode.
- Authorization logic scattered across Gateway/Agent Loop/tool modules.
- Permission checks degraded to implicit allow behavior.
- Auth-state export omitted, opaque, or provider-owned.
- Secret material written into inspectable owner data.
- Missing auth tools (`auth_whoami`, `auth_check`, `auth_export`).
- Actor context not propagated to Agent Loop/tool execution.
- Audit records missing for denied or approved auth decisions.

## 2. Prohibited Implementation Shortcuts

- Defaulting to allow on header parsing or context reconstruction failure.
- Treating local-owner mode as a bypass instead of a boundary.
- Storing password hashes, raw tokens, API keys, or session secrets in Memory or in any file git tracks.
- Putting permissions or approval rules in configuration or preferences instead of Auth.
- Shipping a default policy that requires approval for the owner or limits what the owner can do.
- Hardcoding permission grants in non-Auth modules.
- Returning unmanaged provider-specific auth blobs from `auth_export`.
- Removing required auth tools from runtime startup sources.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| AUTHD-CHK-001 | Gateway calls Auth on every protected request, including list and history reads | Unauthorized integration tests on protected endpoints | Critical |
| AUTHD-CHK-002 | Auth context parsing and normalization enforced | Header/credential validation tests | Critical |
| AUTHD-CHK-003 | Fail-closed behavior on invalid auth input | Negative tests for missing/malformed credentials | Critical |
| AUTHD-CHK-004 | Permission denial enforced when flags are absent | Authorization unit + integration tests | Critical |
| AUTHD-CHK-005 | Approval authority gate enforced where a product adds approvals | Approval-decision permission tests | Critical |
| AUTHD-CHK-006 | Agent Loop asks Auth before each tool call; refusals reported as "not permitted" | Tool availability/execution tests | Critical |
| AUTHD-CHK-007 | Product-owned auth-state file created/loaded at startup | Startup readiness tests | Critical |
| AUTHD-CHK-008 | `auth_export` returns non-secret product-owned state | Export schema and secret-field rejection tests | Critical |
| AUTHD-CHK-009 | Required auth tools are available | Tool discovery tests | High |
| AUTHD-CHK-010 | Actor context reaches Agent Loop/tool runtime | End-to-end context propagation tests | High |
| AUTHD-CHK-011 | Structured auth audit events exist | Audit sink assertions for authorized + denied paths | High |
| AUTHD-CHK-012 | Auth remains boundary-scoped in ownership | Static architecture-boundary checks | Critical |
| AUTHD-CHK-013 | Default policy lets the owner do everything; other identities start with nothing | Fresh-state policy tests | Critical |
| AUTHD-CHK-014 | Permissions and approval rules live only in Auth | Static scan of configuration and preferences | Critical |
| AUTHD-CHK-015 | Imported policies for unknown identities stay dormant | Export/import round-trip tests | High |

## 4. Contract-Break Indicators

- Protected request succeeds without authenticated context.
- Missing/malformed headers result in allow behavior.
- Approval route accepts actor lacking `approval_authority`.
- A tool runs without a per-call Auth decision, or a refused call runs anyway.
- A refused tool call is reported as "does not exist" instead of "not permitted".
- A re-created identity regains access after import without the owner turning it back on.
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
- [ ] The Gateway calls Auth on every protected request.
- [ ] Invalid credentials fail closed.
- [ ] Permission enforcement denies unauthorized actions.
- [ ] Where a product adds approvals, approval decisions require `approval_authority`.
- [ ] The Agent Loop asks Auth before each tool call.
- [ ] The owner can do everything by default; other identities start with nothing.
- [ ] Permissions live only in Auth.
- [ ] Imported policies for unknown identities stay dormant.
- [ ] Startup creates/loads product-owned auth state.
- [ ] `auth_export` excludes secret material.
- [ ] `auth_whoami`, `auth_check`, and `auth_export` are present.
- [ ] Actor context propagates to Agent Loop/tool execution.
- [ ] Structured auth audit records exist for allow + deny paths.
- [ ] Auth module remains ownership-clean (identity/access only).
