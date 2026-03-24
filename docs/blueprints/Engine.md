# Engine Component Blueprint Specification

## 1. Overview

### Purpose
The Engine (Agent Loop) is the generic execution loop that processes one interaction request at a time by coordinating model inference and tool execution, then emitting structured stream events back to the caller.

### High-Level Responsibilities
- Accept bounded internal request payloads from Gateway (`messages + metadata`).
- Invoke external models through a model adapter boundary.
- Execute model-requested tools under Auth-governed permissions.
- Feed tool outcomes back into model context until completion.
- Emit contract-visible stream events (`text-delta`, `tool-call`, `tool-result`, `done`, `error`, plus approval interaction events where implemented).

### System Context
- Upstream: Gateway via the internal Gateway-Engine contract.
- Downstream:
  - Model API via adapters.
  - Tool runtime surface via tool executor.
- Cross-cutting dependency: Auth context is already established on path.
- Storage relationship: does not own conversation persistence; conversation lifecycle remains a Gateway concern.

### Companion Artifact
- Gateway component specification: `blueprints/Gateway.md`
- Internal handoff contract context: `blueprints/Gateway-API.md` (external API context), plus Gateway-Engine contract docs in source layer.

---

## 2. Scope Definition

### What the Engine **is**
- A generic loop executor for model-tool interactions.
- A stream event producer for interaction progress and completion.
- A consumer of bounded request context and pre-authenticated actor context.
- A dispatcher that executes available tools and captures outcomes for continuation turns.

### What the Engine **is not**
- Not a conversation store or lifecycle manager.
- Not an authentication boundary owner.
- Not a provider-specific API formatter (adapters own provider-specific translation).
- Not a product workflow or prompt-assembly layer.
- Not a direct Memory storage accessor.

### Boundaries and Constraints
- Receives only contract-bounded request fields; no hidden runtime/provider/tool reconfiguration through request metadata.
- Must preserve generic ownership (no product-specific logic hardcoded in loop behavior).
- Must preserve event taxonomy and safe error surfaces.
- Must allow Gateway and Engine to evolve independently while honoring contract shape.

---

## 3. Core Concepts & Terminology

### Domain Concepts
- **Interaction Loop**: repeated cycle of model completion -> optional tool execution -> continuation.
- **Completion Signal**: model indicates terminal finish condition (no further tool calls required).
- **Tool Turn**: step where model requests one or more tools and Engine executes them.
- **Recoverable Tool Failure**: tool failure that can be returned to model as `tool-result` without terminating stream.
- **Unrecoverable Failure**: failure requiring terminal `error` event and loop termination.

### Contract Concepts
- **Gateway-Engine Request**: `messages[]` plus bounded `metadata`.
- **Stream Event**: typed output event consumed by Gateway/client stream proxy.
- **Error Taxonomy**: `provider_error`, `tool_error`, `context_overflow`.
- **Approval Interaction**: explicit request/result decision flow for sensitive tool calls.

### Internal vs External Concepts
- **Internal**: loop state, approval wait state, duplicate-call guards, mutation-scope guard, tool filtering.
- **External**: stream events, error codes, completion payload, adapter/model outcomes.

---

## 4. Interfaces & Contracts

### 4.1 Input Contract (Conceptual)

#### Request Shape
- `messages` (required): ordered role/content history supplied by Gateway.
- `metadata.correlation_id` (required): trace identifier.
- Optional metadata:
  - `conversation_id`
  - `trigger`
  - `client_context`

#### Auth Context
- Engine consumes already-authenticated actor context (identity + permission set).
- Engine does not authenticate requests itself.

#### Loop Configuration Inputs
- Tool registry/executor prepared at startup.
- Model adapter selected/configured at startup.
- Optional deployment safety bounds (for example iteration limits) may be provided by runtime config.

### 4.2 Output Contract (Conceptual Stream Events)
- `text-delta`
- `tool-call`
- `tool-result`
- `approval-request` (implementation/contract-visible extension)
- `approval-result` (implementation/contract-visible extension)
- `done`
- `error`

### 4.3 Event Payload Classes (Abstract)
- `text-delta`: incremental assistant text fragment.
- `tool-call`: tool invocation intent (`id`, `name`, input payload).
- `tool-result`: execution outcome (`status`, output payload).
- `approval-request`: pending sensitive action decision (`request_id`, `tool_name`, summary).
- `approval-result`: decision outcome (`request_id`, `decision`).
- `done`: terminal completion metadata, including stable identifiers where required by caller contract.
- `error`: classified failure code + safe display message.

### 4.4 Error Contract
- Pre-stream errors: handled at caller boundary (typically Gateway HTTP response path).
- Mid-stream errors: Engine emits `error` event with taxonomy:
  - `provider_error`
  - `tool_error`
  - `context_overflow`
- Message safety requirement: no raw stack traces, secret material, or unsafe internals.

### 4.5 Communication Pattern
- Request-reply at boundary entry (Gateway -> Engine).
- Event streaming from Engine back to Gateway.
- Multi-call internal continuation between Engine and model within a single interaction stream.

---

## 5. Behavior Specification

### 5.1 Core Loop Sequence
1. Initialize loop state from incoming request messages.
2. Optionally enforce configured safety bound before each iteration.
3. Call model adapter with:
  - current message state
  - currently permitted tool set for actor
4. Append assistant turn into loop state, preserving both text and tool-call metadata.
5. Emit assistant text increment as `text-delta` when present.
6. If no tool calls are requested:
  - emit `done`
  - terminate loop
7. For each requested tool call:
  - emit `tool-call`
  - run guards (duplicate-call guard, mutation-scope guard as implemented)
  - if approval required:
    - emit `approval-request`
    - await decision
    - emit `approval-result`
    - on deny, emit `tool-result` with denied status and continue
  - execute tool
  - emit `tool-result`
  - append tool result into message state for continuation
  - if unrecoverable tool error, emit `error` and terminate
8. Continue next iteration with updated message state until completion.

### 5.2 State Management
- **Per-interaction ephemeral state**:
  - evolving message transcript for model continuation
  - seen tool-call signatures for duplicate guard
  - recent mutation paths for destructive overlap guard
  - iteration counter
- **Approval wait state**:
  - pending approval map keyed by approval request ID
- **No durable conversation state ownership**:
  - Engine does not create/list/store conversations.

### 5.3 Guard and Safety Behaviors (As Implemented)
- Optional iteration safety bound: emits `context_overflow` and terminates when exceeded.
- Duplicate-call loop guard: blocks repeated identical tool calls after threshold; returns recoverable `tool-result` error payload.
- Mutation-scope guard: blocks destructive calls overlapping recently mutated paths in same turn; returns recoverable `tool-result` error payload.
- Tool availability/permission filtering before model invocation.

### 5.4 Failure Handling
- Model/provider call failures:
  - classify to taxonomy
  - sanitize message
  - emit terminal `error`
- Recoverable tool failures:
  - emit `tool-result` with status `error`
  - continue loop for model-directed recovery
- Unrecoverable tool failures:
  - emit terminal `error` with `tool_error`
  - close loop

### 5.5 Edge Cases
- Unknown tool request:
  - treated as terminal `tool_error`.
- Tool permission denied at execution boundary:
  - should be prevented by advertised tool filtering; if encountered, failure path must remain safe and classified.
- Approval request resolution not found:
  - handled by approval decision boundary (Gateway route), leaving Engine pending until resolved or interaction lifecycle ends.

---

## 6. Dependencies & Interactions

### Required Dependencies
- **Model Adapter Boundary**:
  - translates generic internal model request shape to provider-specific protocol
  - normalizes provider response into generic completion shape
- **Tool Executor**:
  - advertises actor-allowed tools
  - executes tool calls with auth-aware checks
- **Approval Store**:
  - tracks pending approval requests and resolves decisions
- **Auth Context**:
  - actor identity and permissions supplied by upstream middleware
- **Runtime Configuration**:
  - adapter selection and settings
  - tool sources
  - optional loop safety bounds

### Interaction Data Flow
1. Gateway sends bounded request.
2. Engine asks adapter for completion.
3. Adapter calls provider through Model API.
4. Engine executes requested tools.
5. Tool outputs are injected into model context.
6. Engine emits stream events back to Gateway.

### Dependency Assumptions
- Adapter encapsulates provider-specific request/response details.
- Tool registry is startup-prepared and stable during interaction.
- Auth context is valid and trustworthy when Engine receives request.
- Correlation ID flows through logs/tools for traceability.

---

## 7. Invariants & Rules

### Ownership Invariants
- Engine remains generic and product-agnostic.
- Engine never owns conversation persistence.
- Provider-specific formatting logic remains in adapters.
- Authorization policy ownership remains in Auth boundary.

### Contract Invariants
- Input remains bounded to internal contract shape.
- Output events remain contract-visible and typed.
- Mid-stream errors remain classified by taxonomy.
- Error messages remain safe for client display surfaces.
- Assistant text must be preserved across tool-continuation turns.

### Validation Logic (Conceptual)
- Validate presence of required request fields before loop execution.
- Validate tool call execution against available registry and actor permissions.
- Validate error mapping to explicit taxonomy.
- Validate that recoverable tool failures do not terminate stream.
- Validate completion semantics are emitted exactly once per successful terminal path.

---

## 8. Non-Functional Requirements

### Performance
- Low-overhead per-iteration loop execution.
- Efficient tool filtering and dispatch.
- Stream output should provide near-real-time progress visibility.

### Scalability
- Must support independent concurrent interactions (separate loop instances per request).
- Should support multiple tool calls per interaction turn.
- Must remain swappable as a component behind fixed internal contract.

### Reliability and Fault Tolerance
- Provider failures must be classified and surfaced safely.
- Recoverable tool failures should allow model-driven continuation.
- Loop termination behavior must be deterministic.
- Safety bounds should be deployment-configurable rather than hardwired architectural limits.

### Security
- No secret leakage in stream error surfaces.
- Approval enforcement must be coded control, not prompt-only intent.
- Auth context must be consumed as read-only execution context.
- Structured audit logging should capture tool calls/results, provider failures, and approval events.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **State-machine loop model**:
  - states: awaiting model completion, executing tools, awaiting approval, terminal done/error
- **Adapter pattern**:
  - isolate provider-specific wire formats from core loop
- **Executor abstraction**:
  - tool listing and execution behind single interface
- **Event-sourcing style emission**:
  - emit explicit typed events for each meaningful transition
- **Guard pipeline**:
  - deterministic pre-execution checks before tool execution

### Design Considerations
- Preserve assistant text even when completion includes tool calls.
- Use stable tool-call IDs for round-trip continuity.
- Distinguish recoverable vs unrecoverable tool outcomes explicitly.
- Keep approval interactions asynchronous and explicit.
- Keep request-time metadata bounded and non-configurational.

### Anti-Patterns to Avoid
- Injecting product-specific prompt/business behavior into loop.
- Formatting provider payloads directly in loop implementation.
- Treating loop safety guard failures as unclassified generic errors.
- Letting approval semantics live only in client code paths.
- Direct storage access from loop code that bypasses Memory tool/boundary surfaces.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `E-01`: Engine loop remains generic in responsibility.
- `E-02`: Conversation persistence remains outside Engine ownership.
- `E-03`: Provider-specific logic is adapter-bound.
- `E-04`: Loop continues until model signals completion; safety bound is optional deployment control.
- `GC-02`: Stream event semantics are explicit and typed.
- `GC-03/GC-05/S-01`: Mid-stream error taxonomy and safe messaging are enforced.
- `GC-06/S-05`: Approval semantics are contract-visible through `approval-request` and `approval-result`.
- `T-02`: Tool execution occurs in Engine while auth checks remain Auth-governed.
- `MO-01/MO-02/MO-03`: Model boundary stays external and swappable through adapters/config.

### Noted Primer/Implementation Tensions
- Primer states support for concurrent tool execution where allowed; current loop processes tool calls sequentially within a turn.
- Primer warns against approval ownership drift; current implementation includes in-loop pending approval state (bounded and contract-visible, but should remain carefully constrained to avoid policy ownership creep).

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Engine remains a commodity/generic Agent Loop with no conversation ownership (`engine-spec.md`).
- Internal request/stream contract boundary is honored (`gateway-engine-contract.md`).
- Error taxonomy alignment (`provider_error`, `tool_error`, `context_overflow`) is implemented.
- Optional safety iteration bound exists as deployment choice rather than architectural default.
- Provider interactions remain adapter-mediated (`models-spec.md`, `adapter-spec.md`).

### Documented Discrepancies To Reconcile
1. **Parallel tool execution expectation**
   - Human Engine spec states tool calls in a turn should be executable concurrently.
   - Current implementation executes tool calls sequentially per turn.
2. **Approval state ownership strictness**
   - Human Engine spec says Agent Loop does not manage approval state.
   - Current implementation maintains pending approval map inside Engine runtime to support coded enforcement flow.
3. **Event payload naming conventions**
   - Human Gateway-Engine examples show `text-delta.content` and `tool-call.arguments`.
   - Current implementation/primer contract use `text-delta.delta` and `tool-call.input`.
4. **Internal event set scope**
   - Human internal contract table lists core events (`text-delta`, `tool-call`, `tool-result`, `done`, `error`).
   - Current runtime emits approval events in-stream as contract-visible extension.

### Rebuild Guidance When Sources Diverge
- Preserve human-doc ownership boundaries as architectural authority.
- Preserve primer/matrix event and payload conformance for MVP interoperability.
- Resolve known divergences by publishing a single canonical internal event schema and concurrency expectation for Engine implementation targets.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| ENG-CF-001 | Human Engine spec expects concurrent tool execution in a turn; current implementation executes sequentially | Preserve correctness-first behavior as conformant baseline; mark concurrency as SHOULD-level enhancement | Maintains deterministic behavior while enabling phased concurrency support | Inconsistent performance/latency expectations across implementations |
| ENG-CF-002 | Human spec says loop should not manage approval state; runtime implementation maintains pending approval map | Allow bounded in-loop approval wait state only for coded enforcement and event visibility; keep policy ownership in Auth/tools | Satisfies contract-visible approval semantics without transferring policy ownership | Approval ownership can creep into Engine policy logic |
| ENG-CF-003 | Human examples use `text-delta.content` / `tool-call.arguments`; primer/runtime use `text-delta.delta` / `tool-call.input` | Use primer/runtime naming for MVP compatibility | Aligns with active contract and blueprints schemas | Event payload mismatch between Gateway and Engine implementations |
| ENG-CF-004 | Human internal contract table lists core events only; primer/runtime include approval events | Treat approval events as contract extension required for current MVP conformance | Matches compliance matrix and client contract requirements | Approval control path becomes non-portable and non-auditable |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `ENG-MUST-001`: Engine MUST accept only bounded request shape (`messages` + `metadata`).
- `ENG-MUST-002`: Engine MUST require `metadata.correlation_id`.
- `ENG-MUST-003`: Engine MUST reject request metadata that acts as runtime/provider/tool configuration side channel.
- `ENG-MUST-004`: Engine MUST continue loop until model completion signal unless explicit configured safety bound triggers classified overflow termination.
- `ENG-MUST-005`: Engine MUST emit only canonical stream event taxonomy.
- `ENG-MUST-006`: Engine MUST preserve assistant text across tool-continuation turns.
- `ENG-MUST-007`: Engine MUST emit `tool-call` and `tool-result` with stable call ID continuity.
- `ENG-MUST-008`: Engine MUST treat recoverable tool failures as non-terminal (`tool-result` error/denied semantics with continuation).
- `ENG-MUST-009`: Engine MUST emit terminal `error` and terminate for unrecoverable provider/tool failures.
- `ENG-MUST-010`: Engine MUST classify mid-stream errors as `provider_error`, `tool_error`, or `context_overflow`, with safe messages.
- `ENG-MUST-011`: Engine MUST apply Auth-derived permission filtering to advertised/executable tools.
- `ENG-MUST-012`: Engine MUST keep approval interactions contract-visible (`approval-request`, `approval-result`) with explicit denied-result semantics.
- `ENG-MUST-013`: Engine MUST NOT own conversation persistence/lifecycle behavior.
- `ENG-MUST-014`: Engine core loop MUST NOT contain provider-specific wire formatting logic (adapter boundary ownership).

### SHOULD

- `ENG-SHOULD-001`: Engine SHOULD support concurrent tool execution when safe and deterministic for the implementation.
- `ENG-SHOULD-002`: Engine SHOULD expose deterministic guard behavior for duplicate or conflicting tool-call patterns.
- `ENG-SHOULD-003`: Engine SHOULD emit structured correlation-aware audit logs for loop transitions and failures.

### MAY

- `ENG-MAY-001`: Engine MAY enforce implementation-defined loop safety bounds, if classified overflow semantics are preserved.
- `ENG-MAY-002`: Engine MAY include additional completion metadata in `done` events, without breaking required fields.

## 14. Acceptance Gates (Pass/Fail)

- `ENG-GATE-01 Contract Gate`: Pass if request/event/result schemas validate against `contracts/Engine.schema.json`; fail otherwise.
- `ENG-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Engine-conformance.md` pass (14 positive + 14 negative); fail on any `ENG-MUST-*` failure.
- `ENG-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Engine-drift-guard.md` pass; fail on any Critical check failure.
- `ENG-GATE-04 Boundary Gate`: Pass if static/runtime checks confirm no conversation persistence ownership and no provider-wire logic in core loop; fail on any ownership breach.
- `ENG-GATE-05 Conflict Gate`: Pass if no unresolved High-risk conflict remains in Conflict Register.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| ENG-MUST-001 | Human `gateway-engine-contract.md`; AI matrix `GC-01` | `ENG-T001P`, `ENG-T001N` |
| ENG-MUST-002 | AI `gateway-engine-contract.md`; contract required field | `ENG-T002P`, `ENG-T002N` |
| ENG-MUST-003 | Human `configuration-spec.md`; AI matrix `C-02` | `ENG-T003P`, `ENG-T003N` |
| ENG-MUST-004 | Human `engine-spec.md`; AI matrix `E-04` | `ENG-T004P`, `ENG-T004N` |
| ENG-MUST-005 | Human `gateway-engine-contract.md`; AI matrix `GC-02` | `ENG-T005P`, `ENG-T005N` |
| ENG-MUST-006 | AI `engine.md` guarantees and drift notes | `ENG-T006P`, `ENG-T006N` |
| ENG-MUST-007 | AI `gateway-engine-contract.md`; runtime continuity expectations | `ENG-T007P`, `ENG-T007N` |
| ENG-MUST-008 | Human `gateway-engine-contract.md` error rules; AI matrix `GC-03` | `ENG-T008P`, `ENG-T008N` |
| ENG-MUST-009 | Human `gateway-engine-contract.md`; AI matrix `GC-03` | `ENG-T009P`, `ENG-T009N` |
| ENG-MUST-010 | Human `gateway-engine-contract.md`; AI matrix `GC-05`, `S-01` | `ENG-T010P`, `ENG-T010N` |
| ENG-MUST-011 | Human `auth-spec.md`, `tools-spec.md`; AI matrix `T-02`, `A-01` | `ENG-T011P`, `ENG-T011N` |
| ENG-MUST-012 | AI `client-gateway-contract.md`; AI matrix `S-05`, `GC-06` | `ENG-T012P`, `ENG-T012N` |
| ENG-MUST-013 | Human `engine-spec.md`, `foundation-spec.md`; AI matrix `E-02` | `ENG-T013P`, `ENG-T013N` |
| ENG-MUST-014 | Human `models-spec.md`, `adapter-spec.md`; AI matrix `E-03` | `ENG-T014P`, `ENG-T014N` |

## 16. Residual Risks & Open Decisions

- `ENG-RISK-001 (Medium)`: Concurrency expectation differs between source layers; implementations may vary unless a single canonical concurrency target is published.
- `ENG-RISK-002 (Medium)`: Approval state handling remains sensitive; bounded wait-state is allowed, but policy creep risk must be actively tested.
- `ENG-RISK-003 (Low)`: Event field naming examples are mixed in legacy docs; schema pack is authoritative but docs should converge.
- `ENG-DECISION-OPEN-001`: Publish canonical stance on required vs optional parallel tool execution for MVP conformance profiles.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/engine`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters`
  - `/home/hex/Project/PAA-MVP-Prod/build/auth`
  - `/home/hex/Project/PAA-MVP-Prod/build/test`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 4 (`gateway_engine_request`, `stream_event`, `model_completion_response`, `tool_execution_result`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 4/4 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: concurrency requirement strictness is not fully unified across source docs.
- Final readiness rating: Conditionally Ready
