# Auth Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for Auth component conformance.

## Requirement Set (MUST)

- `AUTH-MUST-001`: Every protected request passes through Auth boundary before system interaction.
- `AUTH-MUST-002`: Auth builds actor context from request credentials/headers and attaches normalized identity + permissions.
- `AUTH-MUST-003`: Auth fails closed on missing, malformed, or mismatched identity credentials.
- `AUTH-MUST-004`: Authorization decisions enforce permission flags (deny when permission is absent).
- `AUTH-MUST-005`: Approval decisions require explicit `approval_authority`.
- `AUTH-MUST-006`: Tool availability/execution honors Auth permission filtering.
- `AUTH-MUST-007`: Product-owned auth state is created/loaded at startup in inspectable owner data.
- `AUTH-MUST-008`: `auth_export` returns non-secret, product-owned auth state.
- `AUTH-MUST-009`: Required day-one auth tools exist: `auth_whoami`, `auth_check`, `auth_export`.
- `AUTH-MUST-010`: Auth context propagates across Gateway -> Engine -> Tool execution path.
- `AUTH-MUST-011`: Structured audit records are emitted for authorized and denied auth outcomes.
- `AUTH-MUST-012`: Local-owner mode remains a real boundary, not an auth bypass mode.
- `AUTH-MUST-013`: Auth responsibilities remain boundary-scoped (no routing, conversation lifecycle, or model-loop ownership).

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| AUTH-T001P | AUTH-MUST-001 | Positive | Call protected route with valid auth context | Request proceeds | 401 on valid auth | Boundary path regression |
| AUTH-T001N | AUTH-MUST-001 | Negative | Call protected route without auth | 401 unauthorized | Route executes without auth | Auth omitted on real path |
| AUTH-T002P | AUTH-MUST-002 | Positive | Submit request with valid actor headers/credentials | Normalized auth context attached to request | Missing auth context downstream | Identity propagation drift |
| AUTH-T002N | AUTH-MUST-002 | Negative | Supply malformed `x-actor-permissions` or invalid actor type | Safe reject and no context attachment | Request continues with malformed context | Context validation drift |
| AUTH-T003P | AUTH-MUST-003 | Positive | Provide mismatched actor identity vs persisted auth state | Denied (fail closed) | Request allowed despite mismatch | Fail-open auth drift |
| AUTH-T003N | AUTH-MUST-003 | Negative | Remove required auth headers | Denied with safe unauthorized response | Default/anonymous context granted | Missing-credential bypass |
| AUTH-T004P | AUTH-MUST-004 | Positive | Actor lacks `administration`, call admin-gated operation | Operation denied | Admin operation allowed | Permission enforcement drift |
| AUTH-T004N | AUTH-MUST-004 | Negative | Force authorization helper to always allow | Conformance test fails | Always-allow policy accepted | Authorization collapse |
| AUTH-T005P | AUTH-MUST-005 | Positive | Submit approval decision with `approval_authority=true` | Approval route accepted | 403 despite proper authority | Approval authority regression |
| AUTH-T005N | AUTH-MUST-005 | Negative | Submit approval decision with `approval_authority=false` | 403 forbidden | Decision accepted | Approval bypass |
| AUTH-T006P | AUTH-MUST-006 | Positive | Request tool list for actor with restricted permissions | Only allowed tools are advertised/executable | Restricted tools appear/executable | Tool scope drift |
| AUTH-T006N | AUTH-MUST-006 | Negative | Execute restricted tool with insufficient permissions | Denied with safe auth error | Tool executes | Tool permission bypass |
| AUTH-T007P | AUTH-MUST-007 | Positive | Fresh startup with no auth state file | Auth state file created with product-owned shape | Startup completes without auth state | Startup readiness drift |
| AUTH-T007N | AUTH-MUST-007 | Negative | Corrupt or unreadable auth-state file | Startup/auth load fails clearly (or safe deny path) | Silent fallback to insecure defaults | Insecure fallback drift |
| AUTH-T008P | AUTH-MUST-008 | Positive | Call `auth_export` tool | Returns non-secret auth state shape | Missing required auth state fields | Export surface drift |
| AUTH-T008N | AUTH-MUST-008 | Negative | Inject secret-like fields into export payload | Conformance check fails | Secrets accepted in export | Secret leakage |
| AUTH-T009P | AUTH-MUST-009 | Positive | Discover tools at runtime | `auth_whoami`, `auth_check`, `auth_export` available | One required tool missing | Day-one capability drift |
| AUTH-T009N | AUTH-MUST-009 | Negative | Build without auth tool source enabled | Conformance gate fails | Missing tools accepted as compliant | Contract incompleteness |
| AUTH-T010P | AUTH-MUST-010 | Positive | Authenticated request triggers Engine tool execution | Tool context carries actor identity/permissions | Tool context has no auth details | Context propagation drift |
| AUTH-T010N | AUTH-MUST-010 | Negative | Strip auth context before tool execution | Execution denied or conformance failure | Tool executes with empty auth context | Broken trust-boundary propagation |
| AUTH-T011P | AUTH-MUST-011 | Positive | Execute one authorized and one denied request | Structured audit records for both outcomes | Missing audit event for either path | Audit coverage drift |
| AUTH-T011N | AUTH-MUST-011 | Negative | Disable auth audit emission | Conformance test fails | Missing audit logs accepted | Audit omission |
| AUTH-T012P | AUTH-MUST-012 | Positive | Run in local-owner mode with required headers/state checks | Requests still pass through real Auth checks | Requests auto-allow without auth checks | Local-mode bypass drift |
| AUTH-T012N | AUTH-MUST-012 | Negative | Implement local-owner mode as auth no-op | Conformance test fails | No-op auth accepted | Boundary disappearance |
| AUTH-T013P | AUTH-MUST-013 | Positive | Static/runtime boundary audit of Auth module | Auth only handles identity, permissions, and auth-state concerns | Auth includes non-auth responsibilities | Responsibility creep |
| AUTH-T013N | AUTH-MUST-013 | Negative | Add conversation/model routing logic to Auth module | Conformance/static gate fails | Responsibility violation accepted | Component ownership drift |

## Coverage Summary

- MUST requirements: 13
- Positive tests: 13
- Negative tests: 13
- Total vectors: 26
- Critical drift categories covered: auth bypass, fail-open authorization, approval bypass, tool permission bypass, startup readiness drift, secret leakage, audit omission, local-mode boundary disappearance, ownership creep.
