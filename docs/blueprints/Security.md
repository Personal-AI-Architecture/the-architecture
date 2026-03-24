# Security Cross-Cutting Blueprint Specification

## 1. Overview

### Purpose
Security defines the cross-cutting controls that protect secrets, enforce trust boundaries, preserve safe output behavior, and keep security properties stable across component swaps.

### High-Level Responsibilities
- Define and enforce secret-handling constraints across configuration, auth state, memory, and runtime responses.
- Require structured audit capture for sensitive operations and policy decisions.
- Define safe pre-stream and mid-stream error surfaces.
- Require coded approval enforcement for sensitive actions.
- Require scope enforcement through independent layers (Auth policy plus tool/runtime boundaries).
- Preserve owner portability guarantees (export/history) as security controls.

### System Context
- Security is not a standalone runtime component.
- Security is an architecture-level control plane enforced through Gateway, Auth, Engine, Memory, Tools, Configuration, and Deployment posture.
- Security sits across both external contracts (Gateway API and Model API) and the internal Gateway-Engine contract.

---

## 2. Scope Definition

### What Security **is**
- A cross-cutting architecture boundary expressed as rules, contracts, and enforcement points.
- The owner of threat-model framing and control requirements.
- The owner of safe exposure rules for errors/events and secret material.
- A drift-prevention boundary that must hold through implementation and swap cycles.

### What Security **is not**
- Not a new architecture component.
- Not a replacement for Auth ownership of identity and permissions.
- Not a compliance-law framework (regulatory requirements are out of scope here).
- Not product UX logic or client-only workflow behavior.
- Not provider-specific deployment policy hardcoding.

### Boundaries and Constraints
- Controls must be enforced in code and runtime boundaries, not only in prompts or docs.
- Security controls are day-one requirements for MVP operation.
- Security controls must survive model, adapter, and component swaps.
- Secret values are forbidden in normal inspectable owner data paths.

---

## 3. Core Concepts & Terminology

### Key Domain Concepts
- **Security Policy Profile**: canonical set of required security toggles and modes.
- **Attack Surface**: prompt injection, tool supply chain, gateway abuse, model-provider data flow, hosting access, model misbehavior.
- **Safe Error Surface**: classified, sanitized failure payloads safe for external/client display.
- **Approval Control**: coded runtime gate for sensitive mutations.
- **Tool Isolation Policy**: runtime boundary posture by trust level.
- **Security Violation Record**: structured evidence entry for a control failure.

### Internal Concepts
- **Pre-stream failure**: request rejected before interaction stream starts.
- **Mid-stream failure**: stream already active, failure emitted as classified event.
- **Correlation-aware auditability**: link security-relevant actions/events via request correlation.

### External Concepts
- **Protected request path**: request path requiring Auth before Gateway/Engine work.
- **Contract-visible approval**: approval appears in stream/API contract (`approval-request`, `approval-result`, decision route).
- **Product-owned state**: inspectable/exportable owner-controlled data format.

### Terms
- **Forbidden storage**: normal inspectable memory/preference/config locations where secrets must not be written.
- **Boundary erosion**: security ownership drifting into ad hoc local logic or disappearing entirely.

---

## 4. Interfaces & Contracts

### 4.1 Canonical Contract Pack
- Schema file: `blueprints/contracts/Security.schema.json`
- Contract interfaces:
  - `security_policy_profile`
  - `audit_log_event`
  - `safe_stream_error_event`
  - `pre_stream_error_response`
  - `approval_request_event`
  - `approval_result_event`
  - `approval_decision_request`
  - `secret_reference`
  - `tool_isolation_policy`
  - `security_violation_record`

### 4.2 `security_policy_profile`
- Required fields:
  - `approval_mode` enum: `ask_everything | ask_some | ask_nothing`
  - `audit_level` enum: `minimal | standard | verbose`
  - `secrets_in_memory_forbidden` const `true`
  - `require_auth_on_protected_routes` const `true`
  - `require_safe_error_surfaces` const `true`
  - `require_contract_visible_approval` const `true`
  - `require_tool_scope_enforcement` const `true`
- Optional fields: none.
- Defaults: none.
- Forbidden behavior:
  - setting any required const flag to `false`.
- Error shape:
  - pre-stream: `pre_stream_error_response` with `code=invalid_request`
  - mid-stream: `safe_stream_error_event` with `code=security_error`
- Valid example:
```json
{
  "approval_mode": "ask_some",
  "audit_level": "standard",
  "secrets_in_memory_forbidden": true,
  "require_auth_on_protected_routes": true,
  "require_safe_error_surfaces": true,
  "require_contract_visible_approval": true,
  "require_tool_scope_enforcement": true
}
```
- Invalid example:
```json
{
  "approval_mode": "ask_nothing",
  "audit_level": "minimal",
  "require_auth_on_protected_routes": false
}
```
- Why invalid: missing required fields and violates required const rule.

### 4.3 `audit_log_event`
- Required fields:
  - `timestamp` (date-time)
  - `event` (string)
  - `details` (object)
- Optional fields:
  - `severity` enum `info | warn | error`
  - `correlation_id`, `actor_id`, `component`
- Defaults: none.
- Forbidden behavior:
  - non-object `details`
  - missing required fields
- Error shape:
  - pre-stream: logging sink failure must not break protected request authorization semantics
  - mid-stream: emit safe error only if failure affects contract-visible behavior
- Valid example:
```json
{
  "timestamp": "2026-03-19T19:00:00Z",
  "event": "approval.request",
  "details": { "request_id": "apr-1", "tool": "memory_write" },
  "severity": "info",
  "correlation_id": "corr-1",
  "actor_id": "owner",
  "component": "engine"
}
```
- Invalid example:
```json
{
  "event": "tool.call"
}
```
- Why invalid: missing `timestamp` and `details`.

### 4.4 `safe_stream_error_event`
- Required fields:
  - `type` const `error`
  - `code` enum `provider_error | tool_error | context_overflow | security_error`
  - `message` (1-240 chars)
- Optional fields:
  - `correlation_id`
- Defaults: none.
- Forbidden behavior:
  - raw internal stack traces or secret-bearing messages.
- Error behavior:
  - pre-stream uses HTTP error response; this event is mid-stream only.
- Valid example:
```json
{
  "type": "error",
  "code": "provider_error",
  "message": "The model provider could not be reached",
  "correlation_id": "corr-1"
}
```
- Invalid example:
```json
{
  "type": "error",
  "code": "internal_exception",
  "message": "Error: stack trace ..."
}
```
- Why invalid: unsupported code and unsafe message content.

### 4.5 `pre_stream_error_response`
- Required fields:
  - `code` enum `invalid_request | unauthorized | forbidden | service_unavailable | not_found`
  - `message` (1-240 chars)
- Optional fields:
  - `status` integer 400-599
- Defaults: none.
- Forbidden behavior:
  - exposing raw provider/runtime internals.
- Pre-stream behavior:
  - returned when stream has not started.
- Mid-stream behavior:
  - never used after stream opens.
- Valid example:
```json
{
  "code": "unauthorized",
  "message": "Unauthorized",
  "status": 401
}
```
- Invalid example:
```json
{
  "code": "auth_failed_internal",
  "message": "Token parse failed at /srv/auth.ts:88"
}
```
- Why invalid: off-taxonomy code and unsafe detail leakage.

### 4.6 `approval_request_event`
- Required fields:
  - `type` const `approval-request`
  - `request_id` (identifier)
  - `tool_name` (string)
  - `summary` (string)
- Optional fields: none.
- Defaults: none.
- Forbidden behavior:
  - approval interactions existing only in local UI flow with no contract event.
- Behavior:
  - emitted mid-stream before executing approval-required action.
- Valid example:
```json
{
  "type": "approval-request",
  "request_id": "apr-1",
  "tool_name": "memory_delete",
  "summary": "memory_delete on documents/plan.md"
}
```
- Invalid example:
```json
{
  "type": "approval-request",
  "tool_name": "memory_delete"
}
```
- Why invalid: missing `request_id` and `summary`.

### 4.7 `approval_result_event`
- Required fields:
  - `type` const `approval-result`
  - `request_id` (identifier)
  - `decision` enum `approved | denied`
- Optional fields: none.
- Defaults: none.
- Forbidden behavior:
  - execution of approved/denied path without emitting result event.
- Behavior:
  - emitted after decision resolution.
- Valid example:
```json
{
  "type": "approval-result",
  "request_id": "apr-1",
  "decision": "denied"
}
```
- Invalid example:
```json
{
  "type": "approval-result",
  "request_id": "apr-1",
  "decision": "allow"
}
```
- Why invalid: decision not in allowed enum.

### 4.8 `approval_decision_request`
- Required fields:
  - `decision` enum `approved | denied`
- Optional fields: none.
- Defaults: none.
- Forbidden fields:
  - hidden override fields such as `force` or `skip_auth`.
- Pre-stream behavior:
  - invalid shape rejected with `invalid_request`.
- Mid-stream behavior:
  - this payload resolves pending request and drives `approval-result` event.
- Valid example:
```json
{ "decision": "approved" }
```
- Invalid example:
```json
{ "decision": "approved", "skip_auth": true }
```
- Why invalid: forbidden hidden control channel (`skip_auth`).

### 4.9 `secret_reference`
- Required fields:
  - `source` enum `env_var | secret_manager`
  - `ref` pattern `^[A-Z][A-Z0-9_]*$`
- Optional fields: none.
- Defaults: none.
- Forbidden fields:
  - `api_key`, `token`, `password`, `secret_value`
- Behavior:
  - references secret by name/location; never carries secret value.
- Valid example:
```json
{
  "source": "env_var",
  "ref": "OPENROUTER_API_KEY"
}
```
- Invalid example:
```json
{
  "source": "env_var",
  "ref": "OPENROUTER_API_KEY",
  "api_key": "sk-live-raw"
}
```
- Why invalid: includes forbidden raw secret value.

### 4.10 `tool_isolation_policy`
- Required fields:
  - `trust_level` enum `system_shipped | owner_installed | untrusted`
  - `isolation_mode` enum `in_process | shared_container | dedicated_container`
  - `filesystem_scope` enum `restricted | full`
  - `network_scope` enum `none | restricted | open`
  - `auth_independent_boundary` boolean
- Optional fields:
  - `warning_on_unverified` (default `true`)
  - `resource_limits.cpu_cores`, `resource_limits.memory_mb`, `resource_limits.timeout_ms`
- Conditional constraint:
  - if `trust_level=untrusted`, then `isolation_mode` must be `dedicated_container`, `auth_independent_boundary=true`, `warning_on_unverified=true`.
- Forbidden behavior:
  - auth-only enforcement without runtime isolation boundary.
- Valid example:
```json
{
  "trust_level": "untrusted",
  "isolation_mode": "dedicated_container",
  "filesystem_scope": "restricted",
  "network_scope": "restricted",
  "auth_independent_boundary": true,
  "warning_on_unverified": true,
  "resource_limits": { "memory_mb": 256, "timeout_ms": 5000 }
}
```
- Invalid example:
```json
{
  "trust_level": "untrusted",
  "isolation_mode": "in_process",
  "filesystem_scope": "full",
  "network_scope": "open",
  "auth_independent_boundary": false
}
```
- Why invalid: violates mandatory untrusted-tool isolation constraints.

### 4.11 `security_violation_record`
- Required fields:
  - `control_id`, `severity`, `description`, `detected_by`, `timestamp`
- Optional fields:
  - `evidence_ref`, `status` enum `open | mitigated | accepted`
- Defaults: none.
- Forbidden behavior:
  - untracked high-severity violations.
- Valid example:
```json
{
  "control_id": "SEC-MUST-002",
  "severity": "high",
  "description": "Raw provider error leaked to stream message",
  "detected_by": "conformance-suite",
  "timestamp": "2026-03-19T19:00:00Z",
  "status": "open"
}
```
- Invalid example:
```json
{
  "control_id": "SEC-MUST-002",
  "severity": "urgent"
}
```
- Why invalid: unsupported severity and missing required fields.

### 4.12 Communication Patterns
- Sync:
  - pre-stream auth/validation responses (`pre_stream_error_response`).
  - approval decision API request.
- Async/Evented:
  - stream events (`approval-request`, `approval-result`, `error`).
  - audit event emission to structured sink.
- Cross-component propagation:
  - correlation IDs across Gateway, Auth, Engine, tools, and audit logs.

---

## 5. Behavior Specification

### 5.1 Startup Security Readiness
1. Load runtime and adapter configuration.
2. Validate secret references (`api_key_env`-style reference semantics).
3. Ensure memory layout, version-history readiness, and auth-state availability.
4. Initialize tool registry and approval store.
5. Mark service ready only when required security controls are active.

### 5.2 Protected Request Entry
1. Gateway receives request.
2. Auth middleware validates actor context against product-owned auth state.
3. On failure: reject pre-stream (`401 unauthorized`) with safe message.
4. On success: attach normalized auth context and continue.

### 5.3 Mid-Stream Security Behavior
1. Engine runs model/tool loop under actor permissions.
2. Errors are classified to contract taxonomy and sanitized.
3. Unrecoverable failures emit terminal `error` event and close stream.
4. Recoverable tool failures remain `tool-result` errors and continue loop.

### 5.4 Approval Enforcement Flow
1. Approval-required tool requested.
2. Engine emits `approval-request` event.
3. Approval decision endpoint accepts only `{ decision }` with auth/permission check.
4. Engine emits `approval-result`.
5. Denied decision returns non-mutating `tool-result` status `denied` and continues safely.

### 5.5 Tool Boundary Behavior
- Tool availability filtered by auth permissions.
- Tool execution re-checks authorization at execution boundary.
- Path and reserved-area sandbox checks enforce filesystem scope for memory tools.
- Tool errors are normalized to safe codes/messages.

### 5.6 Audit Behavior
- Structured audit events capture:
  - startup phases
  - auth allow/deny
  - tool call/result
  - approval request/result
  - memory write/history/export actions
- Correlation-aware fields must allow forensic trace reconstruction.

### 5.7 State Management
- Durable state:
  - auth state (product-owned, exportable)
  - memory and version history
  - conversation records
- Ephemeral state:
  - pending approvals
  - per-request auth context
  - in-loop safety guards (duplicate/mutation guard)

### 5.8 Edge Cases and Error Handling
- Missing auth headers: deny pre-stream.
- Unknown approval request ID: safe `404` response.
- Malformed approval decision payload: safe `400` response.
- Provider unavailable: mid-stream `provider_error` with sanitized message.
- Context safety bound exceeded: mid-stream `context_overflow`.
- Tool unavailable/unauthorized: `tool_error` or denied tool-result path.

---

## 6. Dependencies & Interactions

### External Systems or Components
- Auth boundary for identity and permission decisions.
- Gateway for pre-stream validation and contract responses.
- Engine for loop execution, approval events, and error taxonomy.
- Tools runtime for capability execution and scope enforcement.
- Memory boundary for durable owner state, history, and export.
- Configuration/adapter layer for secret references and startup profile.
- Model provider boundary for upstream error and data-flow risk.

### Data Flow
1. Client request enters Gateway.
2. Auth validates and annotates request context.
3. Engine executes loop with filtered tool set.
4. Tool/runtime boundaries enforce scope and approval.
5. Stream events and audit logs provide contract-visible and forensic surfaces.
6. Memory/export/history remain available as owner safety controls.

### Dependency Assumptions
- Auth is always on protected request path.
- Tool runtime can enforce scope independent of Auth policy alone.
- Audit sink remains available and structured.
- Version-history and export guarantees remain enabled from startup.

---

## 7. Invariants & Rules

### Business and Architectural Rules
- Security remains cross-cutting, not a separate component boundary.
- Security controls are implementation-enforced mechanisms, not prompt-only conventions.
- Secret values never persist in forbidden inspectable locations.
- Approval visibility and approval enforcement both remain true simultaneously.
- Safe error taxonomy remains stable under provider/tool failures.

### Constraints That Must Always Hold
- Protected routes fail closed when auth context is missing/invalid.
- Approval-required mutations cannot execute without explicit decision.
- Security controls are active at MVP day one.
- Security properties remain after model/provider/component swaps.

### Conceptual Validation Logic
- Schema validation for security contract payloads/events.
- Static and dynamic checks for forbidden fields and hidden config channels.
- Conformance checks for positive and negative vectors per requirement.
- Drift checks that fail build on critical boundary violations.

---

## 8. Non-Functional Requirements

### Performance Expectations
- Security checks must add bounded overhead to request and tool execution paths.
- Audit logging should be structured and lightweight enough for high-frequency events.

### Scalability Considerations
- Security controls must work for owner-only MVP and multi-actor evolution.
- Tool isolation policy must scale from built-in tools to untrusted marketplace-style tools.

### Reliability and Fault Tolerance
- Security-critical startup failures must fail clearly, not downgrade silently.
- Mid-stream failures must produce deterministic classified events.
- Audit sink degradation must not cause silent security behavior changes.

### Security Considerations
- Secret material reference-only handling (`source/ref`) in contract surfaces.
- Safe client-visible error surfaces with no stack traces/credential leakage.
- Contract-visible approval and authorization boundaries.
- Defense-in-depth via auth policy plus runtime/tool isolation controls.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **Boundary interceptor pattern** for auth and request validation.
- **Centralized error normalization** for pre-stream and mid-stream surfaces.
- **Structured event pipeline** for audit and stream event emission.
- **Policy-profile + conformance gate** model for drift prevention.

### Design Considerations
- Keep security policy data explicit and schema-validated.
- Keep correlation ID propagation mandatory through critical actions.
- Keep approval decision endpoint minimal and strictly shaped.
- Keep secret references outside inspectable owner data and tracked config files.

### Anti-Patterns to Avoid
- Prompt-only approval behavior with no coded gate.
- Catch-all error code behavior that collapses taxonomy.
- Direct storage of secrets in preferences/memory/config tracked files.
- Security rules spread ad hoc without contract or audit visibility.
- Tool trust enforcement relying only on Auth policy (no runtime boundary).

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `S-01`: safe exposed error/event surfaces are required.
- `S-02`: structured audit capture for sensitive actions is required.
- `S-03`: approval must be coded enforcement, not prompt-only.
- `S-04`: tool isolation/scope boundaries remain independent of Auth alone.
- `S-05`: approval interactions must be contract-visible.
- `A-04`, `C-03`: secrets forbidden in normal inspectable memory/tracked config.
- `A-05`: product-owned auth state/export readiness from startup.
- `GC-03`, `GC-05`, `GC-06`: classified stream errors and contract-visible approval path.

### Primer/Implementation Tensions
- Primer and matrix require explicit isolation posture for untrusted tools; current runtime primarily uses curated in-process sources and does not yet expose full trust-level profile controls.
- Primer describes audit detail levels (`minimal/standard/verbose`), while current runtime emits a single structured event shape without full level-mode behavior.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Security is explicitly cross-cutting and not a new component (`security-spec.md`).
- Approval gates are coded controls and not prompt instructions (`security-spec.md`, `tools-spec.md`).
- Auth is first-line protected-route boundary (`auth-spec.md`, `gateway-engine-contract.md`).
- Secrets live in configuration references, not memory content (`security-spec.md`, `configuration-spec.md`).
- Version history and export are part of the security safety net (`security-spec.md`).

### Documented Discrepancies To Reconcile
1. **Tool trust spectrum implementation depth**
   - Human docs define trust-level isolation spectrum including mandatory untrusted isolation.
   - Current runtime does not yet expose full runtime trust-level policy configuration in tool source loading.
2. **Audit detail levels**
   - Human docs define minimal/standard/verbose detail levels.
   - Current implementation logs structured events but does not yet show explicit level-mode control semantics.
3. **Content separation formalization**
   - Human docs require instructions vs data separation at model prompt boundary.
   - Current implementation includes prompt guidance but does not yet expose a formalized content-tagging contract surface.
4. **Hosted posture specifics**
   - Human docs separate local and hosted security responsibilities.
   - Current MVP evidence is owner-local oriented with hosted posture controls not fully represented in runtime config.

### Rebuild Guidance When Sources Diverge
- Treat human architecture ownership/boundary rules as authoritative.
- Treat primer matrix rows as conformance-ready MVP checks.
- Treat current runtime gaps as implementation backlog, not contract relaxation.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| SEC-CF-001 | Human docs state security is not a component; blueprint package needs a Security artifact | Treat Security artifact as cross-cutting boundary specification, not runtime component | Preserves architectural ownership while enabling implementation-ready package | Teams might incorrectly build a fifth component called Security |
| SEC-CF-002 | Human docs require explicit trust-level isolation (including mandatory untrusted isolation); current runtime exposes curated in-process tools without full trust-level policy controls | Keep mandatory trust-level isolation as MUST-level contract; treat current runtime posture as MVP evidence with extension gap | Prevents security regression when tool ecosystem expands | Untrusted tools may run with insufficient isolation controls |
| SEC-CF-003 | Human docs define audit detail levels; runtime currently emits single structured event mode | Preserve audit level taxonomy in contract profile and require configurable levels in future implementations | Aligns architecture and primer while avoiding fake compliance | Audits may be incomplete or too coarse for incident forensics |
| SEC-CF-004 | Human docs discuss content separation mechanism depth; runtime mostly expresses this via prompt guidance | Require content separation as security invariant and track mechanism formalization as open decision | Keeps attack-surface mitigation explicit | Prompt injection defenses may remain inconsistent across implementations |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `SEC-MUST-001`: Secrets MUST NOT be stored in normal inspectable Memory files or tracked configuration.
- `SEC-MUST-002`: Exposed error/event surfaces MUST use safe sanitized messages.
- `SEC-MUST-003`: Mid-stream error taxonomy MUST remain classified (`provider_error`, `tool_error`, `context_overflow`).
- `SEC-MUST-004`: Sensitive actions MUST be captured in structured audit logs.
- `SEC-MUST-005`: Approval enforcement MUST be coded control, not prompt-only guidance.
- `SEC-MUST-006`: Approval interaction MUST remain contract-visible where required.
- `SEC-MUST-007`: Protected request paths MUST enforce Auth and fail closed.
- `SEC-MUST-008`: Request payloads MUST NOT become hidden runtime/provider/tool reconfiguration channels.
- `SEC-MUST-009`: Tool scope/isolation boundaries MUST enforce limits independent of Auth policy alone.
- `SEC-MUST-010`: Product-owned auth-state export MUST exclude credentials/secrets.
- `SEC-MUST-011`: Security controls MUST be present from day one of MVP operation.
- `SEC-MUST-012`: Correlation-aware traceability MUST exist for security-relevant operations.
- `SEC-MUST-013`: Memory export and version-history safety-net guarantees MUST remain available.
- `SEC-MUST-014`: Security properties MUST survive component/adapter/provider swaps without boundary erosion.

### SHOULD

- `SEC-SHOULD-001`: Security policy profile SHOULD be centrally validated at startup and runtime gate boundaries.
- `SEC-SHOULD-002`: Audit verbosity SHOULD be configurable without losing mandatory baseline metadata.
- `SEC-SHOULD-003`: Tool trust-level posture SHOULD be explicit and machine-checkable for every installed tool source.

### MAY

- `SEC-MAY-001`: Implementations MAY introduce additional classified security error codes internally if external contract taxonomy remains stable.
- `SEC-MAY-002`: Implementations MAY require stronger approval defaults for non-owner actors while preserving contract behavior.

## 14. Acceptance Gates (Pass/Fail)

- `SEC-GATE-01 Contract Gate`: Pass if security interfaces validate against `contracts/Security.schema.json`; fail otherwise.
- `SEC-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Security-conformance.md` pass (14 positive + 14 negative); fail on any `SEC-MUST-*` failure.
- `SEC-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Security-drift-guard.md` pass; fail on any Critical check failure.
- `SEC-GATE-04 Boundary Gate`: Pass if auth-on-path, approval visibility, safe error surfaces, and secret restrictions are all enforced in runtime behavior.
- `SEC-GATE-05 Conflict Gate`: Pass if no unresolved High-risk conflict remains in Conflict Register.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| SEC-MUST-001 | Human `security-spec.md`, `configuration-spec.md`; AI matrix `C-03`, `A-04` | `SEC-T001P`, `SEC-T001N` |
| SEC-MUST-002 | Human `security-spec.md`, `gateway-engine-contract.md`; AI matrix `S-01`, `GC-03` | `SEC-T002P`, `SEC-T002N` |
| SEC-MUST-003 | Human `gateway-engine-contract.md`; AI matrix `GC-05` | `SEC-T003P`, `SEC-T003N` |
| SEC-MUST-004 | Human `security-spec.md`; AI matrix `S-02` | `SEC-T004P`, `SEC-T004N` |
| SEC-MUST-005 | Human `security-spec.md`, `tools-spec.md`; AI matrix `S-03` | `SEC-T005P`, `SEC-T005N` |
| SEC-MUST-006 | Human `gateway-engine-contract.md`; AI matrix `S-05`, `GC-06`, `G-08` | `SEC-T006P`, `SEC-T006N` |
| SEC-MUST-007 | Human `auth-spec.md`, `gateway-engine-contract.md`; AI matrix `A-01`, `GC-04` | `SEC-T007P`, `SEC-T007N` |
| SEC-MUST-008 | Human `configuration-spec.md`; AI matrix `C-02`, `GC-01` | `SEC-T008P`, `SEC-T008N` |
| SEC-MUST-009 | Human `security-spec.md`, `tools-spec.md`; AI matrix `S-04`, `T-02`, `T-03` | `SEC-T009P`, `SEC-T009N` |
| SEC-MUST-010 | Human `auth-spec.md`, `security-spec.md`; AI matrix `A-03`, `A-04` | `SEC-T010P`, `SEC-T010N` |
| SEC-MUST-011 | Human `security-spec.md`; AI matrix `S-02`, `S-03`, `A-05` | `SEC-T011P`, `SEC-T011N` |
| SEC-MUST-012 | Human `gateway-engine-contract.md`; AI matrix `GC-01` plus security checklist traceability requirements | `SEC-T012P`, `SEC-T012N` |
| SEC-MUST-013 | Human `security-spec.md`, `memory-spec.md`; AI matrix `M-03`, `M-04`, `D-05`, `D-07` | `SEC-T013P`, `SEC-T013N` |
| SEC-MUST-014 | Human `foundation-spec.md`, `security-spec.md`; AI matrix `MO-03`, `CU-02` | `SEC-T014P`, `SEC-T014N` |

## 16. Residual Risks & Open Decisions

- `SEC-RISK-001 (Medium)`: Tool trust-level isolation policy is not yet fully surfaced in current runtime configuration for broader third-party tool ecosystems.
- `SEC-RISK-002 (Medium)`: Content separation mechanism is partially behavioral/prompt-driven and needs stronger contract-level instrumentation for adversarial testing.
- `SEC-RISK-003 (Low)`: Audit level semantics are defined architecturally but not uniformly implemented across all sinks.
- `SEC-DECISION-OPEN-001`: Standardize measurable content-separation effectiveness tests and reporting format.
- `SEC-DECISION-OPEN-002`: Define canonical retention/redaction policy for verbose audit logs across local and hosted profiles.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/logger.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/auth/middleware.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/loop.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/errors.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/tool-executor.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/memory-tools/file-ops/server.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/config.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/openai-compatible.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 10 (`security_policy_profile`, `audit_log_event`, `safe_stream_error_event`, `pre_stream_error_response`, `approval_request_event`, `approval_result_event`, `approval_decision_request`, `secret_reference`, `tool_isolation_policy`, `security_violation_record`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 4/4 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: content-separation effectiveness measurement is not yet standardized across implementations.
- Final readiness rating: Conditionally Ready
