# Auth Component Blueprint Specification

## 1. Overview

### Purpose
Auth is the independent boundary that establishes identity, enforces permissions, and guards protected system interactions.

### High-Level Responsibilities
- Authenticate protected requests before system interaction proceeds.
- Build and propagate normalized actor context (identity, actor type, mode, permissions).
- Authorize actions (tool usage, approval decisions, administrative actions) using policy data.
- Maintain product-owned, inspectable, exportable auth state.
- Emit structured audit records for allow/deny outcomes.

### System Context
- Upstream: client requests entering through Gateway.
- Downstream consumers: Gateway route handling, Engine tool filtering/execution path, approval decision path.
- Storage relationship: auth state is persisted in product-owned owner data (Memory preferences surface), but Auth does not own Memory internals.
- Architecture position: cross-cutting boundary independent from Gateway, Engine, and model/provider boundaries.

---

## 2. Scope Definition

### What Auth **is**
- A real, enforceable boundary on protected request paths.
- The owner of identity parsing/normalization and authorization decisions.
- The source of truth for actor permission context used at runtime.
- A provider-swappable capability behind a stable contract.

### What Auth **is not**
- Not Gateway routing logic.
- Not Engine loop logic.
- Not conversation lifecycle management.
- Not a model/provider adapter.
- Not a general-purpose settings or workflow engine.

### Boundaries and Constraints
- Auth must fail closed on invalid or missing credentials/context.
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
- **Boundary check**: invariant that protected paths must traverse Auth.
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

#### Gateway pre-handler integration
- Auth executes before protected route handlers.
- On failure:
  - return HTTP 401 (or 403 for denied authority checks) with safe error body.
- Pre-stream vs mid-stream behavior:
  - Auth failures are pre-stream for request-entry checks.
  - If an auth-related violation occurs during active stream execution, downstream emits classified safe error and terminates.

#### Engine/tool integration
- Engine consumes already-authenticated context.
- Tool visibility/execution is filtered by auth permissions.
- Approval decision submission is additionally gated by approval authority permission.

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
  - deny-by-default (`false`) unless explicitly granted by policy/state.
- Forbidden fields:
  - arbitrary hidden grants not represented by explicit contract fields.

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

#### `AuthHeaders` (implementation example, not mandatory mechanism)
- Required keys:
  - `x-actor-id`
  - `x-actor-type`
  - `x-auth-mode`
  - `x-actor-permissions`

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
- Request entry: synchronous auth check before protected handler execution.
- Downstream propagation: context carried with request execution context to Engine/tools.
- Auth tool access: model-driven tool calls with auth-aware execution context.

---

## 5. Behavior Specification

### 5.1 Startup and Readiness
1. Ensure product-owned auth-state location exists.
2. Load existing auth state or create initial owner-mode state.
3. Validate shape and readiness for `auth_export`.
4. Mark Auth boundary ready for protected request processing.

### 5.2 Protected Request Flow
1. Receive protected request from Gateway path.
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
1. Engine/tool layer obtains auth context.
2. Tool list is filtered to authorized set.
3. Tool execution path re-checks authorization before execution.
4. Approval decision path requires `approval_authority=true`.
5. Denied authority returns safe forbidden response.

### 5.5 State Management
- Durable:
  - auth-state persisted in product-owned owner data path.
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

---

## 6. Dependencies & Interactions

### Required Dependencies
- **Gateway boundary**:
  - invokes Auth pre-handler on protected routes.
- **Engine/tool execution path**:
  - consumes auth context for tool filtering and permission checks.
- **Memory owner-data path**:
  - stores product-owned auth-state records.
- **Audit logging subsystem**:
  - records allow/deny events.

### Interaction Data Flow
1. Client request enters Gateway.
2. Gateway invokes Auth boundary.
3. Auth validates and attaches context or denies.
4. Engine/tools consume context for downstream authorization.
5. Auth tools expose actor/permission/export surfaces.

### Dependency Assumptions
- Protected route wiring exists and calls Auth consistently.
- Auth-state storage path is writable/readable at startup.
- Audit sink is available for structured event capture.

---

## 7. Invariants & Rules

### Component Ownership Invariants
- Auth owns authentication and authorization decisions.
- Gateway/Engine must not own Auth policy semantics.
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
- Approval authority must be coded enforcement, not prompt intent.
- Structured audit records must capture allow/deny outcomes.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **Boundary middleware pattern**:
  - one enforced auth interception point for protected paths.
- **Policy engine abstraction**:
  - centralized authorize decision function.
- **Contract-first state model**:
  - explicit schemas for auth state/context/export.
- **Deny-by-default strategy**:
  - no implicit permissions.

### Design Considerations
- Keep auth context immutable once attached to request.
- Keep policy representation data-driven and evolvable.
- Maintain backward-compatible export shape for migration/portability.
- Separate secret stores from inspectable owner data.

### Anti-Patterns to Avoid
- Local-owner no-op auth mode.
- Permission checks spread ad hoc through business logic.
- Exporting provider-opaque auth records as canonical product state.
- Coupling Auth to Gateway/Engine internals beyond contract surfaces.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `A-01`: protected requests pass through Auth.
- `A-02`: authorization ownership remains in Auth boundary.
- `A-03`: auth state is inspectable/exportable in product-owned form.
- `A-04`: secrets excluded from normal inspectable owner data.
- `A-05`: startup guarantees day-one auth state and export capability.
- `GC-04`: Auth is on Gateway->Engine path.
- `S-03`: approval enforcement is coded, not prompt-only.

### Noted Primer-Implementation Tightening
- Current runtime is owner-first (`local-owner`) while preserving schema/contract shape for multi-actor expansion.
- `auth_check` may be implemented as simple permission surface in MVP; deeper resource/action evaluation should remain contract-compatible.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Auth is an independent cross-cutting component (`auth-spec.md`).
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

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `AUTH-MUST-001`: Every protected request MUST pass through Auth boundary before system interaction.
- `AUTH-MUST-002`: Auth MUST construct and attach normalized actor context for authenticated requests.
- `AUTH-MUST-003`: Auth MUST fail closed on missing/malformed/mismatched credentials or context.
- `AUTH-MUST-004`: Authorization decisions MUST enforce permission denials.
- `AUTH-MUST-005`: Approval decision operations MUST require `approval_authority`.
- `AUTH-MUST-006`: Tool availability/execution MUST honor Auth permission filtering.
- `AUTH-MUST-007`: Startup MUST create/load product-owned auth state required for runtime and export.
- `AUTH-MUST-008`: `auth_export` MUST return non-secret product-owned auth state.
- `AUTH-MUST-009`: `auth_whoami`, `auth_check`, and `auth_export` MUST be available from day one.
- `AUTH-MUST-010`: Auth context MUST propagate to Engine/tool execution path.
- `AUTH-MUST-011`: Auth allow/deny outcomes MUST emit structured audit records.
- `AUTH-MUST-012`: Local-owner mode MUST remain an enforced Auth boundary.
- `AUTH-MUST-013`: Auth MUST remain ownership-scoped to identity/access concerns and MUST NOT absorb routing/engine responsibilities.

### SHOULD

- `AUTH-SHOULD-001`: Auth policy representation SHOULD remain data-driven and extensible beyond fixed boolean grants.
- `AUTH-SHOULD-002`: Auth export SHOULD be migration-stable across provider/backend swaps.
- `AUTH-SHOULD-003`: Auth decision APIs SHOULD return deterministic denial reasons suitable for audit diagnostics.

### MAY

- `AUTH-MAY-001`: Implementations MAY support additional actor types at runtime beyond owner-first MVP.
- `AUTH-MAY-002`: Implementations MAY support richer management operations (`grant`, `revoke`, identity lifecycle) when they remain contract-compatible.

## 14. Acceptance Gates (Pass/Fail)

- `AUTH-GATE-01 Contract Gate`: Pass if payloads/context/export shapes validate against `contracts/Auth.schema.json`; fail otherwise.
- `AUTH-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Auth-conformance.md` pass (13 positive + 13 negative); fail on any `AUTH-MUST-*` failure.
- `AUTH-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Auth-drift-guard.md` pass; fail on any Critical check failure.
- `AUTH-GATE-04 Security Gate`: Pass if no auth bypass or secret leakage is detected; fail if either exists.
- `AUTH-GATE-05 Conflict Gate`: Pass if Conflict Register has no unresolved High-risk items.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| AUTH-MUST-001 | Human `auth-spec.md`; AI matrix `A-01`, `GC-04` | `AUTH-T001P`, `AUTH-T001N` |
| AUTH-MUST-002 | AI `auth.md`; Human `auth-spec.md` contract section | `AUTH-T002P`, `AUTH-T002N` |
| AUTH-MUST-003 | Human `auth-spec.md` failure modes; AI failure pattern `Auth Omitted On The Real Path` | `AUTH-T003P`, `AUTH-T003N` |
| AUTH-MUST-004 | AI matrix `A-02`; Human `auth-spec.md` permission model | `AUTH-T004P`, `AUTH-T004N` |
| AUTH-MUST-005 | AI matrix `S-03`; Human `security-spec.md` auth requirements | `AUTH-T005P`, `AUTH-T005N` |
| AUTH-MUST-006 | AI matrix `T-02`, `A-02`; Human `auth-spec.md` tool access scope | `AUTH-T006P`, `AUTH-T006N` |
| AUTH-MUST-007 | AI matrix `A-05`; Human `auth-spec.md` success/security requirements | `AUTH-T007P`, `AUTH-T007N` |
| AUTH-MUST-008 | AI matrix `A-03`, `A-04`; Human `auth-spec.md` portability rules | `AUTH-T008P`, `AUTH-T008N` |
| AUTH-MUST-009 | AI `auth.md` required day-one tools; auth checklist | `AUTH-T009P`, `AUTH-T009N` |
| AUTH-MUST-010 | AI `gateway-engine-contract.md` auth-on-path semantics | `AUTH-T010P`, `AUTH-T010N` |
| AUTH-MUST-011 | Human `security-spec.md`; AI matrix `S-02` | `AUTH-T011P`, `AUTH-T011N` |
| AUTH-MUST-012 | AI failure pattern `Auth Omitted On The Real Path`; human local-owner requirement | `AUTH-T012P`, `AUTH-T012N` |
| AUTH-MUST-013 | Human `foundation-spec.md` responsibility boundaries; AI matrix `A-02` | `AUTH-T013P`, `AUTH-T013N` |

## 16. Residual Risks & Open Decisions

- `AUTH-RISK-001 (Medium)`: Multi-actor runtime semantics are schema-ready but not fully exercised in MVP owner-first deployments.
- `AUTH-RISK-002 (Medium)`: Boolean permission sets may under-express future resource/action granularity unless policy migration plan is explicit.
- `AUTH-RISK-003 (Low)`: Credential/context transport mechanism can vary by deployment; interoperability guidance should be published centrally.
- `AUTH-DECISION-OPEN-001`: Publish canonical migration path from owner-first permission booleans to richer policy-rule model without contract break.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/auth`
  - `/home/hex/Project/PAA-MVP-Prod/build/memory/auth-state.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/tools.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/gateway/server.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 18 total (`13 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 11 (`permission_set`, `auth_state`, `auth_context`, `authenticate_request`, `authenticate_response`, `authorize_request`, `authorize_decision`, `auth_whoami_response`, `auth_check_response`, `auth_export_response`, `auth_headers`)
- Test vectors count: 26 total (`13 positive`, `13 negative`)
- Conflicts detected/resolved: 4/4 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: exact migration timing from owner-first permission booleans to richer resource/action policy model is not yet standardized.
- Final readiness rating: Conditionally Ready
