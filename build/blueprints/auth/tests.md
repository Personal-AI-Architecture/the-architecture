# Auth Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for Auth component conformance.

## Requirement Set (MUST)

- `AUTH-MUST-001`: The Gateway calls Auth on every protected request, including list and history reads, before anything reaches the Agent Loop or conversation data.
- `AUTH-MUST-002`: Auth builds actor context from request credentials/headers and attaches normalized identity + permissions.
- `AUTH-MUST-003`: Auth fails closed on missing, malformed, or mismatched identity credentials.
- `AUTH-MUST-004`: Authorization decisions enforce permission flags (deny when permission is absent).
- `AUTH-MUST-005`: Where a product adds approvals, approval decisions require explicit `approval_authority`.
- `AUTH-MUST-006`: The Agent Loop asks Auth before each tool call; a refused call doesn't run and is reported as "not permitted".
- `AUTH-MUST-007`: Product-owned auth state is created/loaded at startup in an inspectable, exportable store (not configuration).
- `AUTH-MUST-008`: `auth_export` returns non-secret, product-owned auth state.
- `AUTH-MUST-009`: Required day-one auth tools exist: `auth_whoami`, `auth_check`, `auth_export`.
- `AUTH-MUST-010`: Auth context propagates across Gateway -> Agent Loop -> Tool execution path.
- `AUTH-MUST-011`: Structured audit records are emitted for authorized and denied auth outcomes.
- `AUTH-MUST-012`: Local-owner mode remains a real boundary, not an auth bypass mode.
- `AUTH-MUST-013`: Auth responsibilities remain boundary-scoped (no routing, conversation lifecycle, or model-loop ownership).
- `AUTH-MUST-014`: Default policy lets the owner do everything with no approval step; every other identity starts with nothing.
- `AUTH-MUST-015`: Permissions, including approval rules, live only in Auth.
- `AUTH-MUST-016`: After import, a re-created identity has no access until the owner turns it back on.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| AUTH-T001P | AUTH-MUST-001 | Positive | Call protected route (including a history read) with valid credentials | Gateway calls Auth; request proceeds | 401 on valid auth, or no Auth call | Boundary path regression |
| AUTH-T001N | AUTH-MUST-001 | Negative | Call protected route without valid credentials | 401 unauthorized | Route executes without an Auth check | Auth omitted on real path |
| AUTH-T002P | AUTH-MUST-002 | Positive | Submit request with valid actor headers/credentials | Normalized auth context attached to request | Missing auth context downstream | Identity propagation drift |
| AUTH-T002N | AUTH-MUST-002 | Negative | Supply malformed `x-actor-permissions` or invalid actor type | Safe reject and no context attachment | Request continues with malformed context | Context validation drift |
| AUTH-T003P | AUTH-MUST-003 | Positive | Provide mismatched actor identity vs persisted auth state | Denied (fail closed) | Request allowed despite mismatch | Fail-open auth drift |
| AUTH-T003N | AUTH-MUST-003 | Negative | Remove required auth headers | Denied with safe unauthorized response | Default/anonymous context granted | Missing-credential bypass |
| AUTH-T004P | AUTH-MUST-004 | Positive | Actor lacks `administration`, call admin-gated operation | Operation denied | Admin operation allowed | Permission enforcement drift |
| AUTH-T004N | AUTH-MUST-004 | Negative | Force authorization helper to always allow | Conformance test fails | Always-allow policy accepted | Authorization collapse |
| AUTH-T005P | AUTH-MUST-005 | Positive | In a product with approvals, submit approval decision with `approval_authority=true` | Approval route accepted | 403 despite proper authority | Approval authority regression |
| AUTH-T005N | AUTH-MUST-005 | Negative | In a product with approvals, submit approval decision with `approval_authority=false` | 403 forbidden | Decision accepted | Approval bypass |
| AUTH-T006P | AUTH-MUST-006 | Positive | Actor with restricted permissions; model requests a restricted tool | Agent Loop asks Auth; call refused, not run, reported as "not permitted"; tool marked not permitted in definitions | Restricted tool runs, or refusal looks like "does not exist" | Tool scope drift |
| AUTH-T006N | AUTH-MUST-006 | Negative | Tool call executed without an Auth check | Conformance fails | Tool executes unchecked | Tool permission bypass |
| AUTH-T007P | AUTH-MUST-007 | Positive | Fresh startup with no auth state file | Auth state file created with product-owned shape, owner holding every permission | Startup completes without auth state | Startup readiness drift |
| AUTH-T007N | AUTH-MUST-007 | Negative | Corrupt or unreadable auth-state file | Startup/auth load fails clearly (or safe deny path) | Silent fallback to insecure defaults | Insecure fallback drift |
| AUTH-T008P | AUTH-MUST-008 | Positive | Call `auth_export` tool | Returns non-secret auth state shape | Missing required auth state fields | Export surface drift |
| AUTH-T008N | AUTH-MUST-008 | Negative | Inject secret-like fields into export payload | Conformance check fails | Secrets accepted in export | Secret leakage |
| AUTH-T009P | AUTH-MUST-009 | Positive | Discover tools at runtime | `auth_whoami`, `auth_check`, `auth_export` available | One required tool missing | Day-one capability drift |
| AUTH-T009N | AUTH-MUST-009 | Negative | Build without auth tool source enabled | Conformance gate fails | Missing tools accepted as compliant | Contract incompleteness |
| AUTH-T010P | AUTH-MUST-010 | Positive | Authenticated request triggers Agent Loop tool execution | Tool context carries actor identity/permissions | Tool context has no auth details | Context propagation drift |
| AUTH-T010N | AUTH-MUST-010 | Negative | Strip auth context before tool execution | Execution denied or conformance failure | Tool executes with empty auth context | Broken trust-boundary propagation |
| AUTH-T011P | AUTH-MUST-011 | Positive | Execute one authorized and one denied request | Structured audit records for both outcomes | Missing audit event for either path | Audit coverage drift |
| AUTH-T011N | AUTH-MUST-011 | Negative | Disable auth audit emission | Conformance test fails | Missing audit logs accepted | Audit omission |
| AUTH-T012P | AUTH-MUST-012 | Positive | Run in local-owner mode with required headers/state checks | Requests still pass through real Auth checks | Requests auto-allow without auth checks | Local-mode bypass drift |
| AUTH-T012N | AUTH-MUST-012 | Negative | Implement local-owner mode as auth no-op | Conformance test fails | No-op auth accepted | Boundary disappearance |
| AUTH-T013P | AUTH-MUST-013 | Positive | Static/runtime boundary audit of Auth module | Auth only handles identity, permissions, and auth-state concerns | Auth includes non-auth responsibilities | Responsibility creep |
| AUTH-T013N | AUTH-MUST-013 | Negative | Add conversation/model routing logic to Auth module | Conformance/static gate fails | Responsibility violation accepted | Component ownership drift |
| AUTH-T014P | AUTH-MUST-014 | Positive | Fresh system; owner writes a file and calls a tool | Both run with no approval prompt; a new collaborator identity can do nothing until granted | Owner blocked by an architecture-default approval, or new identity has access | Default-policy drift |
| AUTH-T014N | AUTH-MUST-014 | Negative | Implementation requires owner confirmation for every write by default with no way to turn it off | Conformance fails | Confirm-every-write default accepted | Approval-default drift |
| AUTH-T015P | AUTH-MUST-015 | Positive | Inspect configuration and preferences; change a permission through Auth | No permission or approval rules in config; change takes effect through Auth | Rules found in config | Permission-store drift |
| AUTH-T015N | AUTH-MUST-015 | Negative | Implementation reads tool allow/deny lists from config | Conformance fails | Config-held permissions accepted | Permission-store drift |
| AUTH-T016P | AUTH-MUST-016 | Positive | Export with a collaborator, import to a fresh system, re-create the collaborator | Collaborator has no access; policy is dormant until the owner turns it back on | Access restored silently | Silent re-grant drift |
| AUTH-T016N | AUTH-MUST-016 | Negative | Implementation re-activates imported policies when an identity with the same name appears | Conformance fails | Silent re-grant accepted | Silent re-grant drift |

## Coverage Summary

- MUST requirements: 16
- Positive tests: 16
- Negative tests: 16
- Total vectors: 32
- Critical drift categories covered: auth bypass, fail-open authorization, approval bypass, tool permission bypass, startup readiness drift, secret leakage, audit omission, local-mode boundary disappearance, ownership creep, approval imposed by default, permissions in config, silent re-grant after import.
