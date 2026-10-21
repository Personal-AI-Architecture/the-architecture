# Auth Component Blueprint Specification

## 1. Overview

### Purpose
Auth is the independent component that establishes identity, decides permissions, and guards protected system interactions. Other components call it through the Auth contract: the Gateway on every request, the Agent Loop before each tool call.

### High-Level Responsibilities
- Authenticate and authorize every request when the Gateway calls it, before anything reaches the Agent Loop or conversation data.
- Authorize each tool call when the Agent Loop asks, before the tool runs.
- Build and propagate normalized actor context (identity, actor type, mode, permissions).
- Authorize actions (tool usage, approval decisions where a product adds approvals, administrative actions) using policy data. Default policy: the owner can do everything; every other identity starts with nothing.
- Maintain product-owned, inspectable, exportable auth state.
- Emit structured audit records for allow/deny outcomes.

### System Context
- Callers: the Gateway (every request) and the Agent Loop (each tool call), both through the Auth contract. Approval decision paths, where a product adds them, also ask Auth.
- Storage relationship: Auth keeps its records in its own owner-inspectable, exportable store. It is not configuration and not the preferences surface; permissions live only in Auth.
- Architecture position: independent component, swappable behind its contract, independent from Gateway, Agent Loop, and model/provider boundaries.

---

## 2. Scope Definition

### What Auth **is**
- A real, enforceable check on every protected request and every tool call.
- The owner of identity parsing/normalization and authorization decisions.
- The only place permissions (including any approval rules) live.
- A provider-swappable capability behind a stable contract.

### What Auth **is not**
- Not Gateway routing logic.
- Not Agent Loop logic.
- Not conversation lifecycle management.
- Not a model/provider adapter.
- Not a general-purpose settings or workflow engine.
- Not middleware owned by the Gateway or the Agent Loop.

### Boundaries and Constraints
- Auth must fail closed on invalid or missing credentials/context, and when it can't be reached.
- Local-owner mode remains a real boundary; it is not a bypass mode.
- Auth state must be product-owned and exportable in non-secret form.
- Secrets/credentials must not be written into normal inspectable owner data files.
- Authorization ownership must remain in Auth, not scattered across components.

---

## 3. Core Concepts & Terminology

### Domain Concepts
- **Authentication**: establish who the actor is for a protected request.
- **Authorization**: decide whether actor can perform `action` on `resource`.
- **Actor Context**: runtime identity payload passed downstream (`actor`, `mode`, `permissions`).
- **Permission Set**: explicit allow/deny capability flags for the actor.
- **Auth State**: persisted product-owned auth record(s) needed for runtime and export.

### Internal Concepts
- **Header/credential parsing**: implementation-specific extraction of identity evidence.
- **Boundary check**: invariant that every protected request and every tool call is checked with Auth.
- **Fail-closed path**: deny on parse/validation mismatch or uncertainty.

### External Concepts
- **Protected route**: request path requiring authentication/authorization.
- **Auth tools**: `auth_whoami`, `auth_check`, `auth_export`.
- **Audit surface**: structured records of auth allow/deny outcomes.

### Key Terms
- **Product-owned state**: owner-readable/exportable auth data not locked to provider format.
- **Boundary drift**: Auth responsibilities disappearing or leaking into unrelated components.
- **Secret leakage**: credentials/tokens/hashes surfacing in inspectable owner data or exports.

---

## 4. Interfaces & Contracts

### 4.1 Public/Boundary Operations (Conceptual)

#### Operation: `Authenticate(request_context) -> AuthContext`
- Required input:
  - credential evidence (for example headers, token, session, key)
- Output:
  - normalized actor context (`actor`, `mode`, `permissions`)
- Failure:
  - deny (pre-stream) with safe unauthorized response

#### Operation: `Authorize(auth_context, resource, action) -> AuthorizeDecision`
- Required input:
  - normalized auth context
  - resource identifier
  - action identifier
- Output:
  - allow/deny decision, optional reason
- Failure:
  - deny by default

#### Operation: `ExportAuthState() -> AuthExportResponse`
- Output:
  - product-owned, non-secret auth state surface
- Forbidden output fields:
  - secret-bearing fields (`password_hash`, raw tokens, API keys, private keys, session secrets)

### 4.2 Runtime Integration Contracts

#### Gateway integration (every request)
- The Gateway calls Auth before protected route handlers run, including list and history reads.
- On failure:
  - return HTTP 401 (or 403 for denied authority checks) with safe error body.
- Pre-stream vs mid-stream behavior:
  - Auth failures are pre-stream for request-entry checks.
  - If an auth-related violation occurs during active stream execution, downstream emits classified safe error and terminates.

#### Agent Loop/tool integration (each tool call)
- Agent Loop consumes already-authenticated context.
- Before each tool call, the Agent Loop asks Auth (`Authorize`). A refused call does not run; the model is told it is not permitted, distinct from "does not exist".
- Tool definitions shown to the model mark tools Auth does not permit for the actor.
- Where a product adds approvals, approval decision submission is additionally gated by approval authority permission.

### 4.3 Abstract Data Structures

#### `PermissionSet`
- Required fields:
  - `memory_access: boolean`
  - `tool_access: boolean`
  - `system_actions: boolean`
  - `delegation: boolean`
  - `approval_authority: boolean`
  - `administration: boolean`
- Defaults:
  - owner: every permission granted (`true`); the architecture requires no approval step for the owner.
  - every other identity: deny-by-default (`false`) unless the owner grants it.
- Forbidden fields:
  - arbitrary hidden grants not represented by explicit contract fields.

#### Portable policy evaluation
- Match `subject` by exact identity ID, `*`, or `type:<actor_type>`.
- Match `resource` by exact value, `*`, or a trailing `/*` path prefix; reject arbitrary mid-string wildcards.
- Match `action` by exact value or `*`.
- Require every supplied condition to hold. The portable condition set is `time_window`, `max_per_day`, and `requires_approval`; unknown conditions are unsupported and never grant access.
- Resolve any applicable deny before allow. Any matching deny wins; otherwise a matching allow wins; no match denies.
- Preserve unknown identities, resources, actions, and unsupported rules during export/import, but keep them dormant or denied until the implementation can evaluate them safely.

#### `AuthState`
- Required fields:
  - `actor_id: string`
  - `actor_type: enum`
  - `mode: enum`
  - `permissions: PermissionSet`
  - `created_at: timestamp`
  - `updated_at: timestamp`
- Optional extensibility:
  - identity and policy collections for multi-actor evolution.
- Forbidden fields:
  - secrets and provider-locked opaque blobs.

#### `AuthContext`
- Required fields:
  - `actorId: string`
  - `actorType: enum`
  - `mode: enum`
  - `permissions: PermissionSet`

#### `AuthIdentityTransport` (implementation example, not mandatory mechanism)
- The authenticated identity must survive a transport swap without caller-controlled
  permission data. The current internal contract uses `X-Actor-ID`; permissions remain
  in Auth. Transport-neutral propagation remains open under S5.

### 4.4 Required Tool Contracts

#### `auth_whoami`
- Input:
  - empty object
- Output:
  - `actor_id`, `actor_type`, `mode`
- Error behavior:
  - safe deny if no valid auth context exists

#### `auth_check`
- Input:
  - empty object or action/resource query payload (implementation-defined extension)
- Output:
  - `allowed: boolean`
  - `permissions: PermissionSet`
- Error behavior:
  - safe deny on invalid context

#### `auth_export`
- Input:
  - empty object
- Output:
  - non-secret exportable auth state
- Forbidden output:
  - secret-bearing fields

### 4.5 Valid and Invalid Payload Examples

#### Valid `AuthState` example
```json
{
  "actor_id": "owner",
  "actor_type": "owner",
  "mode": "local-owner",
  "permissions": {
    "memory_access": true,
    "tool_access": true,
    "system_actions": true,
    "delegation": true,
    "approval_authority": true,
    "administration": true
  },
  "created_at": "2026-03-19T12:00:00Z",
  "updated_at": "2026-03-19T12:00:00Z"
}
```

#### Invalid `AuthExportResponse` example
```json
{
  "actor_id": "owner",
  "mode": "local-owner",
  "password_hash": "..."
}
```

Why invalid:
- missing required fields (`actor_type`, `permissions`, timestamps)
- includes forbidden secret field (`password_hash`)

### 4.6 Communication Patterns
- Request entry: the Gateway calls Auth synchronously before protected handler execution.
- Tool calls: the Agent Loop calls Auth synchronously before each tool call.
- Downstream propagation: identity carried with request execution context to Agent Loop/tools; it must survive a transport change.
- Auth tool access: model-driven tool calls with auth-aware execution context.

---

## 5. Behavior Specification

### 5.1 Startup and Readiness
1. Ensure product-owned auth-state location exists.
2. Load existing auth state or create initial owner-mode state (owner can do everything).
3. Validate shape and readiness for `auth_export`.
4. Mark Auth boundary ready for protected request processing.

### 5.2 Protected Request Flow
1. Gateway calls Auth for the protected request.
2. Extract and validate auth evidence.
3. Reconstruct normalized auth context.
4. Compare/validate against active auth state as required by mode.
5. On success:
  - attach context to request
  - emit `auth.authorized` audit record
6. On failure:
  - deny request (401/403)
  - emit `auth.denied` audit record

### 5.3 Authorization Workflow
1. Consumer requests authorization decision for action/resource.
2. Auth evaluates permission set/policy data.
3. Return allow/deny decision.
4. Denied actions stop execution on boundary.

### 5.4 Tool and Approval Workflow
1. Agent Loop/tool layer obtains auth context.
2. Tool definitions mark tools Auth does not permit for the actor.
3. Before each tool call, the Agent Loop asks Auth; a refused call does not run and returns a "not permitted" result.
4. Where the owner's rules require approval for a call, the approval decision path requires `approval_authority=true`.
5. Denied authority returns safe forbidden response.

### 5.4a Export and Import
1. `auth_export` returns identities, policies, configuration and the audit log, without credentials.
2. On import, policies for unknown identities are kept but dormant; they grant nothing.
3. A re-created identity gets no access until the owner turns it back on. How the owner does that is the product's choice.
4. Rules the new system doesn't support are reported to the owner and grant nothing.

### 5.5 State Management
- Durable:
  - auth state persisted in Auth's own owner-inspectable store (not configuration or preferences).
- Ephemeral:
  - per-request normalized auth context.
- Export:
  - non-secret auth state returned through `auth_export`.

### 5.6 Edge Cases and Error Handling
- Missing headers/credentials: 401 unauthorized (safe body).
- Malformed permission payload: deny (fail closed).
- Actor mismatch with active state: deny.
- Missing approval authority: 403 forbidden.
- Auth state unreadable/corrupt at startup: fail clearly or deny safely; never silently fall back to insecure defaults.
- Auth unreachable at request or tool-call time: fail closed.
- Owner locked out on their own hardware: recovery through filesystem access (command-line reset or editing auth data); other recovery paths are product choices.

---

## 6. Dependencies & Interactions

### Required Dependencies
- **Gateway**:
  - calls Auth on every protected request.
- **Agent Loop/tool execution path**:
  - calls Auth before each tool call.
- **Auth store**:
  - holds product-owned auth-state records (owner-inspectable and exportable).
- **Audit logging subsystem**:
  - records allow/deny events.

### Interaction Data Flow
1. Client request enters Gateway.
2. Gateway calls Auth.
3. Auth validates; the Gateway attaches the identity or denies.
4. Agent Loop asks Auth before each tool call.
5. Auth tools expose actor/permission/export surfaces.

### Dependency Assumptions
- Gateway route wiring and the Agent Loop tool path call Auth consistently.
- Auth-state storage path is writable/readable at startup.
- Audit sink is available for structured event capture.

---

## 7. Invariants & Rules

### Component Ownership Invariants
- Auth owns authentication and authorization decisions.
- Gateway/Agent Loop must not own Auth policy semantics.
- Auth does not own conversation routing, model operations, or memory internals.

### Contract Invariants
- Protected requests always traverse Auth.
- Invalid/missing auth context never results in implicit allow.
- Required auth tools are runtime-available from day one.
- Exported auth state remains non-secret and product-owned.
- Local-owner mode preserves boundary enforcement.

### Validation Rules (Conceptual)
- Validate required auth context fields and enum values.
- Validate permission payload shape before use.
- Validate deny-on-mismatch/fail-closed behavior.
- Validate absence of forbidden secret fields in export/state surfaces.

---

## 8. Non-Functional Requirements

### Performance
- Auth checks should add minimal overhead on protected request path.
- Permission checks should be constant/low-cost for common operations.

### Scalability
- Actor and policy model must support future multi-actor expansion without architecture rewrite.
- Policy categories should be data-extensible.

### Reliability and Fault Tolerance
- Deny safely on parsing/validation uncertainty.
- Startup must deterministically establish usable auth state.
- Auth failures should be explicit and observable.

### Security
- Fail closed by default.
- No secret leakage in inspectable owner data or exports.
- Approval rules the owner sets, and approval authority where a product adds approvals, must be coded enforcement, not prompt intent.
- Structured audit records must capture allow/deny outcomes.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **Single Auth contract, two call points**:
  - the Gateway calls it on every request; the Agent Loop calls it before each tool call. Neither owns it.
- **Policy engine abstraction**:
  - centralized authorize decision function.
- **Contract-first state model**:
  - explicit schemas for auth state/context/export.
- **Owner-full, others-deny default**:
  - the owner can do everything; every other identity has no implicit permissions.

### Design Considerations
- Keep auth context immutable once attached to request.
- Keep policy representation data-driven and evolvable.
- Maintain backward-compatible export shape for migration/portability.
- Separate secret stores from inspectable owner data.

### Anti-Patterns to Avoid
- Local-owner no-op auth mode.
- Permission checks spread ad hoc through business logic.
- Permissions or approval rules stored in configuration or preferences.
- Restoring a re-created identity's old access silently after import.
- Exporting provider-opaque auth records as canonical product state.
- Coupling Auth to Gateway/Agent Loop internals beyond contract surfaces.

---

## 10. Validation Against AI Primer (`build/primers`)

### Confirmed Alignments
- `A-01`: the Gateway calls Auth on every request.
- `A-06`: the Agent Loop asks Auth before each tool call.
- `A-07`: the owner can do everything by default.
- `A-08`: re-created identities get no access after import until the owner turns it back on.
- `C-04`: permissions live only in Auth.
- `A-02`: authorization ownership remains in Auth boundary.
- `A-03`: auth state is inspectable/exportable in product-owned form.
- `A-04`: secrets excluded from normal inspectable owner data.
- `A-05`: startup guarantees day-one auth state and export capability.
- `GC-04`: Auth is checked before every handoff and every tool call.
- `S-03`: approval rules, where set, are enforced in code, not prompt-only.

### Noted Primer-Implementation Tightening
- Current runtime is owner-first (`local-owner`) while preserving schema/contract shape for multi-actor expansion.
- `auth_check` may be implemented as simple permission surface in MVP; deeper resource/action evaluation should remain contract-compatible.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Auth is an independent component the Gateway calls on every request and the Agent Loop asks before each tool call (`auth-spec.md`).
- Auth is a memory concern and must remain provider-swappable.
- Auth boundary is required from day one, including local-owner deployments.
- Auth exportability and owner inspectability are required.

### Documented Discrepancies To Reconcile
1. **Actor model breadth vs MVP runtime**
   - Human docs define broad actor taxonomy.
   - Current runtime executes owner-first behavior.
2. **Permission model richness vs MVP booleans**
   - Human docs describe extensible resource/action policy model.
   - Current runtime uses fixed boolean permission set.
3. **Management operations surface**
   - Human docs describe broader management operations (`grant/revoke/list`).
   - MVP requires and currently implements minimal day-one set (`auth_whoami`, `auth_check`, `auth_export`).
4. **Credential transport neutrality**
   - Human docs stay implementation-agnostic.
   - Current runtime uses explicit auth headers for internal context carriage.

### Rebuild Guidance When Sources Diverge
- Preserve human-doc ownership and boundary rules as authoritative.
- Preserve primer matrix day-one MVP requirements as conformance baseline.
- Keep runtime extensions additive and schema-compatible with future multi-actor evolution.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| AUTH-CF-001 | Human docs define broad actor taxonomy; MVP runtime is owner-first | Keep schema actor-extensible, allow owner-first runtime behavior | Meets day-one practicality without blocking future actor expansion | Implementations hardcode owner-only assumptions irreversibly |
| AUTH-CF-002 | Human docs describe extensible resource/action policy model; runtime uses fixed permission booleans | Treat boolean permission set as MVP profile of extensible policy contract | Preserves compatibility with current runtime while keeping policy evolution path | Authorization model ossifies and causes future migration pain |
| AUTH-CF-003 | Human docs enumerate broader auth management operations; MVP primer requires minimal tool set day one | Require minimal tools now; keep broader management operations as planned extensions | Aligns with MVP readiness while retaining architectural direction | Over-scoping MVP or under-delivering required day-one contract |
| AUTH-CF-004 | Human docs are mechanism-neutral; runtime currently uses explicit auth headers | Preserve neutral contract with header transport as one valid implementation | Maintains portability across runtimes/transports | Auth context portability and interop become implementation-locked |
| AUTH-CF-005 | Older layers place Auth as middleware between Gateway and Agent Loop, filter tools out of the model's view, and keep auth state on the preferences surface; human `auth-spec.md` has the Gateway and Agent Loop call Auth, marks not-permitted tools, and keeps permissions only in Auth | Follow `auth-spec.md` | One place for every access decision, swappable behind its contract | Tool calls bypass Auth; permissions drift into config |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `AUTH-MUST-001`: The Gateway MUST call Auth on every protected request, including list and history reads, before anything reaches the Agent Loop or conversation data.
- `AUTH-MUST-002`: Auth MUST construct and attach normalized actor context for authenticated requests.
- `AUTH-MUST-003`: Auth MUST fail closed on missing/malformed/mismatched credentials or context.
- `AUTH-MUST-004`: Authorization decisions MUST enforce permission denials.
- `AUTH-MUST-005`: Where a product adds approvals, approval decision operations MUST require `approval_authority`.
- `AUTH-MUST-006`: The Agent Loop MUST ask Auth before each tool call; a refused call MUST NOT run and MUST be reported as "not permitted".
- `AUTH-MUST-007`: Startup MUST create/load product-owned auth state required for runtime and export.
- `AUTH-MUST-008`: `auth_export` MUST return non-secret product-owned auth state.
- `AUTH-MUST-009`: `auth_whoami`, `auth_check`, and `auth_export` MUST be available from day one.
- `AUTH-MUST-010`: Auth context MUST propagate to Agent Loop/tool execution path.
- `AUTH-MUST-011`: Auth allow/deny outcomes MUST emit structured audit records.
- `AUTH-MUST-012`: Local-owner mode MUST remain an enforced Auth boundary.
- `AUTH-MUST-013`: Auth MUST remain ownership-scoped to identity/access concerns and MUST NOT absorb routing/agent loop responsibilities.
- `AUTH-MUST-014`: The default policy MUST let the owner do everything with no approval step required by the architecture; every other identity MUST start with no permissions.
- `AUTH-MUST-015`: Permissions, including approval rules, MUST live only in Auth, not in configuration or preferences.
- `AUTH-MUST-016`: After import, policies for unknown identities MUST stay dormant, and a re-created identity MUST get no access until the owner turns it back on.
- `AUTH-MUST-017`: Auth MUST evaluate portable policy rules with the canonical matching, condition, precedence, and fail-closed reference semantics.
- `AUTH-MUST-018`: Where approvals are enabled, Auth MUST authorize terminal approval decisions, enforce the pending-to-terminal lifecycle, and make decisions idempotent by `request_id`; replay MUST NOT execute a tool again.

### SHOULD

- `AUTH-SHOULD-001`: Auth policy representation SHOULD remain data-driven and extensible beyond fixed boolean grants.
- `AUTH-SHOULD-002`: Auth export SHOULD be migration-stable across provider/backend swaps.
- `AUTH-SHOULD-003`: Auth decision APIs SHOULD return deterministic denial reasons suitable for audit diagnostics.

### MAY

- `AUTH-MAY-001`: Implementations MAY support additional actor types at runtime beyond owner-first MVP.
- `AUTH-MAY-002`: Implementations MAY support richer management operations (`grant`, `revoke`, identity lifecycle) when they remain contract-compatible.

## 14. Acceptance Gates (Pass/Fail)

- `AUTH-GATE-01 Contract Gate`: Pass if payloads/context/export shapes validate against `build/blueprints/auth/contract-pack.json`; fail otherwise.
- `AUTH-GATE-02 Conformance Gate`: Pass if all vectors in `build/blueprints/auth/tests.md` pass (16 positive + 16 negative); fail on any `AUTH-MUST-*` failure.
- `AUTH-GATE-03 Drift Gate`: Pass if all Critical checks in `build/blueprints/auth/drift-guard.md` pass; fail on any Critical check failure.
- `AUTH-GATE-04 Security Gate`: Pass if no auth bypass or secret leakage is detected; fail if either exists.
- `AUTH-GATE-05 Conflict Gate`: Pass if Conflict Register has no unresolved High-risk items.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| AUTH-MUST-001 | Human `auth-spec.md`, `gateway-spec.md`; AI matrix `A-01`, `GC-04` | `AUTH-T001P`, `AUTH-T001N` |
| AUTH-MUST-002 | AI `auth.md`; Human `auth-spec.md` contract section | `AUTH-T002P`, `AUTH-T002N` |
| AUTH-MUST-003 | Human `auth-spec.md` failure modes; AI failure pattern `Auth Omitted On The Real Path` | `AUTH-T003P`, `AUTH-T003N` |
| AUTH-MUST-004 | AI matrix `A-02`; Human `auth-spec.md` permission model | `AUTH-T004P`, `AUTH-T004N` |
| AUTH-MUST-005 | AI matrix `S-03`; Human `security-spec.md` auth requirements | `AUTH-T005P`, `AUTH-T005N` |
| AUTH-MUST-006 | AI matrix `T-02`, `A-06`; Human `auth-spec.md`, `tools-spec.md` | `AUTH-T006P`, `AUTH-T006N` |
| AUTH-MUST-007 | AI matrix `A-05`; Human `auth-spec.md` success/security requirements | `AUTH-T007P`, `AUTH-T007N` |
| AUTH-MUST-008 | AI matrix `A-03`, `A-04`; Human `auth-spec.md` portability rules | `AUTH-T008P`, `AUTH-T008N` |
| AUTH-MUST-009 | AI `auth.md` required day-one tools; auth checklist | `AUTH-T009P`, `AUTH-T009N` |
| AUTH-MUST-010 | AI `gateway-agent-loop-contract.md` auth-on-path semantics | `AUTH-T010P`, `AUTH-T010N` |
| AUTH-MUST-011 | Human `security-spec.md`; AI matrix `S-02` | `AUTH-T011P`, `AUTH-T011N` |
| AUTH-MUST-012 | AI failure pattern `Auth Omitted On The Real Path`; human local-owner requirement | `AUTH-T012P`, `AUTH-T012N` |
| AUTH-MUST-013 | Human `overview.md` responsibility boundaries; AI matrix `A-02` | `AUTH-T013P`, `AUTH-T013N` |
| AUTH-MUST-014 | Human `auth-spec.md`, `tools-spec.md`; AI matrix `A-07` | `AUTH-T014P`, `AUTH-T014N` |
| AUTH-MUST-015 | Human `auth-spec.md`, `configuration-spec.md`; AI matrix `C-04` | `AUTH-T015P`, `AUTH-T015N` |
| AUTH-MUST-016 | Human `auth-spec.md` stale permissions after export/import; AI matrix `A-08` | `AUTH-T016P`, `AUTH-T016N` |
| AUTH-MUST-017 | Human `auth-spec.md` portable policy evaluation; canonical `policy.json` | `AUTH-T017P`, `AUTH-T017N` |
| AUTH-MUST-018 | Human `security-spec.md` approval lifecycle; canonical approval schemas | `AUTH-T018P`, `AUTH-T018N` |

## 16. Residual Risks & Open Decisions

- `AUTH-RISK-001 (Medium)`: Multi-actor runtime semantics are schema-ready but not fully exercised in MVP owner-first deployments.
- `AUTH-RISK-002 (Medium)`: Boolean permission sets may under-express future resource/action granularity unless policy migration plan is explicit.
- `AUTH-RISK-003 (Low)`: Credential/context transport mechanism can vary by deployment; interoperability guidance should be published centrally.
- `AUTH-DECISION-OPEN-001`: Publish canonical migration path from owner-first permission booleans to richer policy-rule model without contract break.

## Source Basis

- Human-readable architecture reference: `architecture`
- AI primer layer: ` ai`
- Implementation behavior used for blueprint fidelity:
  - `build/auth`
  - `build/memory/auth-state.ts`
  - `build/tools.ts`
  - `build/gateway/server.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 23 total (`18 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 11 (`permission_set`, `auth_state`, `auth_context`, `authenticate_request`, `authenticate_response`, `authorize_request`, `authorize_decision`, `auth_whoami_response`, `auth_check_response`, `auth_export_response`, `auth_headers`)
- Test vectors count: 32 total (`16 positive`, `16 negative`)
- Conflicts detected/resolved: 5/5 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: exact migration timing from owner-first permission booleans to richer resource/action policy model is not yet standardized.
- Final readiness rating: Conditionally Ready

## Contract Alignment

The canonical contract tree under `contracts/` is authoritative for identity, policy,
request, and error shapes. Identity status and extensible actor types are published;
re-created identities remain inactive until the owner reactivates them. Auth remains
the sole owner of permissions, and transport-neutral identity propagation (S5) and
tool-definition semantics (S8) remain open follow-up questions.
