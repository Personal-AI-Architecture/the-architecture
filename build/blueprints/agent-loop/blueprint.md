# Agent Loop Component Blueprint Specification

## 1. Overview

### Purpose
The Agent Loop is the generic execution loop that processes one interaction request at a time by coordinating model inference and tool execution, then emitting structured stream events back to the caller.

### High-Level Responsibilities
- Accept bounded internal request payloads from Gateway (`messages` + the model to use + `metadata`).
- Invoke the model named in each request through a model adapter boundary, with its own configured bootstrap prompt first.
- Ask Auth before each tool call, and execute only the model-requested tools Auth permits.
- Feed tool outcomes back into model context until completion.
- Emit contract-visible stream events (`text-delta`, `tool-call`, `tool-result`, `done`, `error`, plus approval interaction events in products that add approvals).

### System Context
- Upstream: Gateway via the internal Gateway ↔ Agent Loop contract.
- Downstream:
  - Model API via adapters.
  - Tool runtime surface via tool executor.
- Auth: the Gateway has already called Auth for the request and attached the identity; the Agent Loop asks Auth again before each tool call.
- Storage relationship: does not own conversation persistence; conversation lifecycle remains a Gateway concern.

### Companion Artifact
- Gateway component specification: `build/blueprints/gateway/blueprint.md`
- Internal handoff contract context: `build/blueprints/gateway-api/blueprint.md` (external API context), plus Gateway ↔ Agent Loop contract docs in source layer.

---

## 2. Scope Definition

### What the Agent Loop **is**
- A generic loop executor for model-tool interactions.
- A stream event producer for interaction progress and completion.
- A consumer of bounded request context and pre-authenticated actor context.
- A dispatcher that asks Auth before each tool call, executes permitted tools, and captures outcomes for continuation turns.

### What the Agent Loop **is not**
- Not a conversation store or lifecycle manager.
- Not an authentication boundary owner, and not a permission decider (it asks Auth and honours the answer).
- Not the owner of the model choice (the model arrives with each request).
- Not a provider-specific API formatter (adapters own provider-specific translation).
- Not a product workflow or prompt-assembly layer.
- Not a direct Memory storage accessor.

### Boundaries and Constraints
- Receives only contract-bounded request fields; no hidden runtime/provider/tool reconfiguration through request metadata.
- Must preserve generic ownership (no product-specific logic hardcoded in loop behavior).
- Must preserve event taxonomy and safe error surfaces.
- Must allow Gateway and Agent Loop to evolve independently while honoring contract shape.

---

## 3. Core Concepts & Terminology

### Domain Concepts
- **Interaction Loop**: repeated cycle of model completion -> optional tool execution -> continuation.
- **Completion Signal**: model indicates terminal finish condition (no further tool calls required).
- **Tool Turn**: step where model requests one or more tools and Agent Loop executes them.
- **Recoverable Tool Failure**: tool failure that can be returned to model as `tool-result` without terminating stream.
- **Unrecoverable Failure**: failure requiring terminal `error` event and loop termination.

### Contract Concepts
- **Gateway ↔ Agent Loop Request**: `messages[]` (conversation history, including tool calls and tool results, plus the current message), the model to use, and bounded `metadata`.
- **Message Shape**: one shape shared with the Gateway API and the Model API; content is a list of parts and tool calls and tool results are ordinary message parts.
- **Stream Event**: typed output event consumed by Gateway/client stream proxy.
- **Error Taxonomy**: `provider_error`, `tool_error`, `context_overflow`.
- **Approval Interaction**: explicit request/result decision flow for tool calls the owner's Auth rules mark as needing approval. None do by default: the architecture default is that the owner can do everything.

### Internal vs External Concepts
- **Internal**: loop state, approval wait state, duplicate-call guards, mutation-scope guard, tool filtering.
- **External**: stream events, error codes, completion payload, adapter/model outcomes.

---

## 4. Interfaces & Contracts

### 4.1 Input Contract (Conceptual)

#### Request Shape
- `messages` (required): ordered conversation history (including tool calls and tool results) plus the current message, supplied by Gateway. No system message: the bootstrap prompt is Agent Loop configuration.
- Model (required): the model to use for this request, from the owner's current choice. A changed choice applies to the next request with no restart.
- `metadata.correlation_id` (required): trace identifier.
- Request timestamp (required): ISO 8601.
- Optional metadata:
  - `conversation_id`
  - `trigger`
  - `client_context`

#### Auth Context
- Agent Loop consumes already-authenticated actor context (identity) attached by the Gateway after its Auth check.
- Agent Loop does not authenticate requests itself.
- Before each tool call, Agent Loop asks Auth whether this actor may make it. A refused call is not run; the model receives a `tool-result` error saying it was not permitted (distinct from "does not exist"). If Auth can't be reached, the call fails closed.

#### Loop Configuration Inputs
- Tool registry/executor prepared at startup.
- Model adapter (provider) selected/configured at startup. The model itself is not startup configuration.
- Bootstrap prompt from Agent Loop configuration.
- Optional deployment safety bounds (for example iteration limits) may be provided by runtime config.

### 4.2 Output Contract (Conceptual Stream Events)
- `text-delta`
- `tool-call`
- `tool-result`
- `approval-request` (contract-visible extension, only where approval rules apply)
- `approval-result` (contract-visible extension, only where approval rules apply)
- `done`
- `error`

### 4.3 Event Payload Classes (Abstract)
- `text-delta`: incremental assistant text fragment.
- `tool-call`: tool invocation intent (`id`, `name`, input payload).
- `tool-result`: execution outcome (`status`, output payload), including "not permitted" when Auth refuses the call.
- `approval-request`: pending sensitive action decision (`request_id`, `tool_name`, summary).
- `approval-result`: decision outcome (`request_id`, `decision`).
- `done`: terminal completion metadata, including stable identifiers where required by caller contract.
- `error`: classified failure code + safe display message + the request's correlation ID.

### 4.4 Error Contract
- Pre-stream errors: handled at caller boundary (typically Gateway HTTP response path).
- Mid-stream errors: Agent Loop emits `error` event with taxonomy:
  - `provider_error`
  - `tool_error`
  - `context_overflow`
- Message safety requirement: no raw stack traces, secret material, or unsafe internals.

### 4.5 Communication Pattern
- Request-reply at boundary entry (Gateway -> Agent Loop).
- Event streaming from Agent Loop back to Gateway.
- Multi-call internal continuation between Agent Loop and model within a single interaction stream.

---

## 5. Behavior Specification

### 5.1 Core Loop Sequence
1. Initialize loop state from incoming request messages.
2. Optionally enforce configured safety bound before each iteration.
3. Call model adapter with:
  - the model named in the request
  - the configured bootstrap prompt, then the current message state
  - tool definitions, with tools Auth does not permit for this actor marked as not permitted
4. Append assistant turn into loop state, preserving both text and tool-call metadata.
5. Emit assistant text increment as `text-delta` when present.
6. If no tool calls are requested:
  - emit `done`
  - terminate loop
7. For each requested tool call:
  - emit `tool-call`
  - ask Auth whether this actor may make this call; if refused, emit `tool-result` with a not-permitted error and continue
  - run guards (duplicate-call guard, mutation-scope guard as implemented)
  - if the owner's Auth rules require approval for this call:
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
- **Approval wait state** (only where approval rules apply):
  - pending approval map keyed by approval request ID
- **No durable conversation state ownership**:
  - Agent Loop does not create/list/store conversations.

### 5.3 Guard and Safety Behaviors (As Implemented)
- Optional iteration safety bound: emits `context_overflow` and terminates when exceeded.
- Duplicate-call loop guard: blocks repeated identical tool calls after threshold; returns recoverable `tool-result` error payload.
- Mutation-scope guard: blocks destructive calls overlapping recently mutated paths in same turn; returns recoverable `tool-result` error payload.
- Tool availability marking before model invocation (not-permitted tools are marked, so the model can say a capability exists but isn't allowed).
- Auth check before each tool call.

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
  - the tool does not run; emit a recoverable `tool-result` error saying the call was not permitted, and continue so the model can tell the owner.
- Auth unavailable:
  - fail closed: the tool call does not run.
- Approval request resolution not found:
  - handled by approval decision boundary (Gateway route), leaving Agent Loop pending until resolved or interaction lifecycle ends.

---

## 6. Dependencies & Interactions

### Required Dependencies
- **Model Adapter Boundary**:
  - translates generic internal model request shape to provider-specific protocol
  - normalizes provider response into generic completion shape
- **Tool Executor**:
  - advertises tools, marking those Auth does not permit
  - executes only tool calls Auth has permitted
- **Auth (through the Auth contract)**:
  - asked before each tool call; holds all permissions and any approval rules
- **Approval Store** (only where approval rules apply):
  - tracks pending approval requests and resolves decisions
- **Auth Context**:
  - actor identity attached by the Gateway after its per-request Auth check
- **Runtime and Agent Loop Configuration**:
  - adapter selection and settings
  - tool sources
  - bootstrap prompt
  - optional loop safety bounds

### Interaction Data Flow
1. Gateway sends bounded request (messages, model, metadata).
2. Agent Loop asks adapter for completion from the requested model.
3. Adapter calls provider through Model API.
4. Agent Loop asks Auth about each requested tool call and executes the permitted ones.
5. Tool outputs are injected into model context.
6. Agent Loop emits stream events back to Gateway.

### Dependency Assumptions
- Adapter encapsulates provider-specific request/response details.
- Tool registry is startup-prepared and stable during interaction.
- Auth context is valid and trustworthy when Agent Loop receives request.
- Correlation ID flows through logs/tools for traceability.

---

## 7. Invariants & Rules

### Ownership Invariants
- Agent Loop remains generic and product-agnostic.
- Agent Loop never owns conversation persistence.
- Provider-specific formatting logic remains in adapters.
- Authorization policy ownership remains in Auth boundary; the Agent Loop asks, it does not decide.
- The model is taken from each request, never fixed at startup.

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
- Approval rules the owner sets must be enforced as coded control, not prompt-only intent. The architecture requires none by default.
- Auth context must be consumed as read-only execution context.
- Every tool call is checked with Auth before it runs; fail closed if Auth is unavailable.
- Structured audit logging should capture tool calls/results, provider failures, and approval events.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **State-machine loop model**:
  - states: awaiting model completion, checking Auth, executing tools, awaiting approval (where approval rules apply), terminal done/error
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
- Where approval rules apply, keep approval interactions asynchronous and explicit.
- Keep request-time metadata bounded and non-configurational.

### Anti-Patterns to Avoid
- Injecting product-specific prompt/business behavior into loop.
- Formatting provider payloads directly in loop implementation.
- Treating loop safety guard failures as unclassified generic errors.
- Letting approval semantics live only in client code paths.
- Direct storage access from loop code that bypasses Memory tool/boundary surfaces.

---

## 10. Validation Against AI Primer (`build/primers`)

### Confirmed Alignments
- `E-01`: Agent Loop remains generic in responsibility.
- `E-02`: Conversation persistence remains outside Agent Loop ownership.
- `E-03`: Provider-specific logic is adapter-bound.
- `E-04`: Loop continues until model signals completion; safety bound is optional deployment control.
- `GC-02`: Stream event semantics are explicit and typed.
- `GC-03/GC-05/S-01`: Mid-stream error taxonomy and safe messaging are enforced.
- `GC-06/S-05`: Where a product adds approvals, approval semantics are contract-visible through `approval-request` and `approval-result`.
- `T-02/A-06`: Tool execution occurs in Agent Loop, and Auth is asked before each tool call.
- `A-07`: No approval step is an architecture default.
- `E-05`: The model is taken from each request, so a change applies to the next message with no restart.
- `E-06`: The bootstrap prompt is Agent Loop configuration.
- `MO-01/MO-02/MO-03`: Model boundary stays external and swappable through adapters/config.

### Noted Primer/Implementation Tensions
- Primer states support for concurrent tool execution where allowed; current loop processes tool calls sequentially within a turn.
- Primer warns against approval ownership drift; current implementation includes in-loop pending approval state (bounded and contract-visible, but should remain carefully constrained to avoid policy ownership creep).

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Agent Loop remains a commodity/generic Agent Loop with no conversation ownership (`agent-loop-spec.md`).
- Internal request/stream contract boundary is honored (`gateway-agent-loop-contract.md`).
- Error taxonomy alignment (`provider_error`, `tool_error`, `context_overflow`) is implemented.
- Optional safety iteration bound exists as deployment choice rather than architectural default.
- Provider interactions remain adapter-mediated (`models-spec.md`, `adapter-spec.md`).

### Documented Discrepancies To Reconcile
1. **Parallel tool execution expectation**
   - Human Agent Loop spec states tool calls in a turn should be executable concurrently.
   - Current implementation executes tool calls sequentially per turn.
2. **Approval state ownership strictness**
   - Human Agent Loop spec says Agent Loop does not manage approval state, and that approval prompts are a product choice (default: none).
   - Current implementation maintains pending approval map inside Agent Loop runtime to support coded enforcement flow.
3. **Event payload naming conventions**
   - Human Gateway ↔ Agent Loop examples show `text-delta.content` and `tool-call.arguments`.
   - Current implementation/primer contract use `text-delta.delta` and `tool-call.input`.
4. **Internal event set scope**
   - Human internal contract table lists core events (`text-delta`, `tool-call`, `tool-result`, `done`, `error`).
   - Current runtime emits approval events in-stream as contract-visible extension.

### Rebuild Guidance When Sources Diverge
- Preserve human-doc ownership boundaries as architectural authority.
- Preserve primer/matrix event and payload conformance for MVP interoperability.
- Resolve known divergences by publishing a single canonical internal event schema and concurrency expectation for Agent Loop implementation targets.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| ENG-CF-001 | Human Agent Loop spec expects concurrent tool execution in a turn; current implementation executes sequentially | Preserve correctness-first behavior as conformant baseline; mark concurrency as SHOULD-level enhancement | Maintains deterministic behavior while enabling phased concurrency support | Inconsistent performance/latency expectations across implementations |
| ENG-CF-002 | Human spec says loop should not manage approval state; runtime implementation maintains pending approval map | Allow bounded in-loop approval wait state only for coded enforcement and event visibility; keep policy ownership in Auth/tools | Satisfies contract-visible approval semantics without transferring policy ownership | Approval ownership can creep into Agent Loop policy logic |
| ENG-CF-003 | Human examples use `text-delta.content` / `tool-call.arguments`; primer/runtime use `text-delta.delta` / `tool-call.input` | Use primer/runtime naming for MVP compatibility | Aligns with active contract and blueprints schemas | Event payload mismatch between Gateway and Agent Loop implementations |
| ENG-CF-004 | Human internal contract table lists core events only; primer/runtime include approval events | Treat approval events as a contract extension, required only in products that add approval prompts | Matches compliance matrix and client contract requirements; approval is a product choice | Approval control path becomes non-portable and non-auditable |
| ENG-CF-005 | Older layers fix the model at Agent Loop startup and filter not-permitted tools out of advertisement; human specs pass the model per request and have the Agent Loop ask Auth before each tool call, marking not-permitted tools | Follow the human specs | Model changes apply with no restart; the model can tell "not permitted" from "does not exist" | Restart-to-switch-model drift and silent permission gaps |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `ENG-MUST-001`: Agent Loop MUST accept only bounded request shape (`messages` + the model + `metadata`).
- `ENG-MUST-002`: Agent Loop MUST require `metadata.correlation_id`.
- `ENG-MUST-003`: Agent Loop MUST reject request metadata that acts as runtime/provider/tool configuration side channel.
- `ENG-MUST-004`: Agent Loop MUST continue loop until model completion signal unless explicit configured safety bound triggers classified overflow termination.
- `ENG-MUST-005`: Agent Loop MUST emit only canonical stream event taxonomy.
- `ENG-MUST-006`: Agent Loop MUST preserve assistant text across tool-continuation turns.
- `ENG-MUST-007`: Agent Loop MUST emit `tool-call` and `tool-result` with stable call ID continuity.
- `ENG-MUST-008`: Agent Loop MUST treat recoverable tool failures as non-terminal (`tool-result` error/denied semantics with continuation).
- `ENG-MUST-009`: Agent Loop MUST emit terminal `error` and terminate for unrecoverable provider/tool failures.
- `ENG-MUST-010`: Agent Loop MUST classify mid-stream errors as `provider_error`, `tool_error`, or `context_overflow`, with safe messages.
- `ENG-MUST-011`: Agent Loop MUST ask Auth before each tool call, MUST NOT run a call Auth refuses, and MUST report the refusal to the model as "not permitted" (distinct from "does not exist").
- `ENG-MUST-012`: Where the owner's Auth rules require approval, Agent Loop MUST keep approval interactions contract-visible (`approval-request`, `approval-result`) with explicit denied-result semantics. With no approval rules (the default), it MUST NOT require approval.
- `ENG-MUST-013`: Agent Loop MUST NOT own conversation persistence/lifecycle behavior.
- `ENG-MUST-014`: Agent Loop core loop MUST NOT contain provider-specific wire formatting logic (adapter boundary ownership).
- `ENG-MUST-015`: Agent Loop MUST use the model named in each request, so a changed model choice applies to the next request with no restart.
- `ENG-MUST-016`: Agent Loop MUST take the bootstrap prompt from its own configuration and put it first when calling the model; it MUST NOT depend on a Gateway-supplied system message.

### SHOULD

- `ENG-SHOULD-001`: Agent Loop SHOULD support concurrent tool execution when safe and deterministic for the implementation.
- `ENG-SHOULD-002`: Agent Loop SHOULD expose deterministic guard behavior for duplicate or conflicting tool-call patterns.
- `ENG-SHOULD-003`: Agent Loop SHOULD emit structured correlation-aware audit logs for loop transitions and failures.

### MAY

- `ENG-MAY-001`: Agent Loop MAY enforce implementation-defined loop safety bounds, if classified overflow semantics are preserved.
- `ENG-MAY-002`: Agent Loop MAY include additional completion metadata in `done` events, without breaking required fields.

## 14. Acceptance Gates (Pass/Fail)

- `ENG-GATE-01 Contract Gate`: Pass if request/event/result schemas validate against `contracts/Engine.schema.json`; fail otherwise.
- `ENG-GATE-02 Conformance Gate`: Pass if all vectors in `build/blueprints/agent-loop/tests.md` pass (16 positive + 16 negative); fail on any `ENG-MUST-*` failure.
- `ENG-GATE-03 Drift Gate`: Pass if all Critical checks in `build/blueprints/agent-loop/drift-guard.md` pass; fail on any Critical check failure.
- `ENG-GATE-04 Boundary Gate`: Pass if static/runtime checks confirm no conversation persistence ownership and no provider-wire logic in core loop; fail on any ownership breach.
- `ENG-GATE-05 Conflict Gate`: Pass if no unresolved High-risk conflict remains in Conflict Register.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| ENG-MUST-001 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-01` | `ENG-T001P`, `ENG-T001N` |
| ENG-MUST-002 | AI `gateway-agent-loop-contract.md`; contract required field | `ENG-T002P`, `ENG-T002N` |
| ENG-MUST-003 | Human `configuration-spec.md`; AI matrix `C-02` | `ENG-T003P`, `ENG-T003N` |
| ENG-MUST-004 | Human `agent-loop-spec.md`; AI matrix `E-04` | `ENG-T004P`, `ENG-T004N` |
| ENG-MUST-005 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-02` | `ENG-T005P`, `ENG-T005N` |
| ENG-MUST-006 | AI `agent-loop.md` guarantees and drift notes | `ENG-T006P`, `ENG-T006N` |
| ENG-MUST-007 | AI `gateway-agent-loop-contract.md`; runtime continuity expectations | `ENG-T007P`, `ENG-T007N` |
| ENG-MUST-008 | Human `gateway-agent-loop-contract.md` error rules; AI matrix `GC-03` | `ENG-T008P`, `ENG-T008N` |
| ENG-MUST-009 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-03` | `ENG-T009P`, `ENG-T009N` |
| ENG-MUST-010 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-05`, `S-01` | `ENG-T010P`, `ENG-T010N` |
| ENG-MUST-011 | Human `auth-spec.md`, `tools-spec.md`; AI matrix `T-02`, `A-06` | `ENG-T011P`, `ENG-T011N` |
| ENG-MUST-012 | Human `tools-spec.md`, `security-spec.md`; AI matrix `S-05`, `GC-06`, `A-07` | `ENG-T012P`, `ENG-T012N` |
| ENG-MUST-013 | Human `agent-loop-spec.md`, `overview.md`; AI matrix `E-02` | `ENG-T013P`, `ENG-T013N` |
| ENG-MUST-014 | Human `models-spec.md`, `adapter-spec.md`; AI matrix `E-03` | `ENG-T014P`, `ENG-T014N` |
| ENG-MUST-015 | Human `agent-loop-spec.md`, `models-spec.md`; AI matrix `E-05`, `MO-02` | `ENG-T015P`, `ENG-T015N` |
| ENG-MUST-016 | Human `agent-loop-spec.md`, `configuration-spec.md`; AI matrix `E-06` | `ENG-T016P`, `ENG-T016N` |

## 16. Residual Risks & Open Decisions

- `ENG-RISK-001 (Medium)`: Concurrency expectation differs between source layers; implementations may vary unless a single canonical concurrency target is published.
- `ENG-RISK-002 (Medium)`: Approval state handling remains sensitive where a product adds approvals; bounded wait-state is allowed, but policy creep risk must be actively tested.
- `ENG-RISK-003 (Low)`: Event field naming examples are mixed in legacy docs; schema pack is authoritative but docs should converge.
- `ENG-DECISION-OPEN-001`: Publish canonical stance on required vs optional parallel tool execution for MVP conformance profiles.

## Source Basis

- Human-readable architecture reference: `architecture`
- AI primer layer: ` ai`
- Implementation behavior used for blueprint fidelity:
  - `build/engine`
  - `build/adapters`
  - `build/auth`
  - `build/test`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 21 total (`16 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 4 (`gateway_engine_request`, `stream_event`, `model_completion_response`, `tool_execution_result`)
- Test vectors count: 32 total (`16 positive`, `16 negative`)
- Conflicts detected/resolved: 5/5 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: concurrency requirement strictness is not fully unified across source docs.
- Final readiness rating: Conditionally Ready

## Contract Alignment

This blueprint follows the human specs, which are ahead of the contract files in these places:

- `contracts/Engine.schema.json` and `contracts/openapi/gateway-engine.yaml` have no request field for the model and no request timestamp (ENG-MUST-001, ENG-MUST-015).
- `contracts/openapi/gateway-engine.yaml` describes the system message as assembled by the Gateway from configuration (ENG-MUST-016).
- `contracts/schemas/message.json` defines content as a string and does not carry tool calls and tool results as message parts.
- No contract has a "not permitted" tool-result shape distinct from a tool failure (ENG-MUST-011).
- Error events carry only `code` and `message`, not the correlation ID.
