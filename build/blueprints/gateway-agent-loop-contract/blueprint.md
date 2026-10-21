# Gateway ↔ Agent Loop Contract Blueprint Specification

## 1. Overview

### Purpose
The Gateway ↔ Agent Loop Contract defines the bounded internal handoff between Gateway and Agent Loop so both components can evolve independently while preserving behavior, safety, and auditability.

### High-Level Responsibilities
- Define one internal request contract (`messages` + model + `metadata`) for `POST /agent-loop/chat`.
- Define one internal streaming event contract for interaction output.
- Define pre-stream vs mid-stream failure behavior.
- Require that the Gateway calls Auth on every request before the handoff, and that the Agent Loop asks Auth before each tool call.
- Prevent hidden reconfiguration and boundary ownership drift.

### System Context
- Upstream: Gateway component.
- Access control: Auth, called by the Gateway for every request and by the Agent Loop before each tool call.
- Downstream: Agent Loop execution loop.
- Relationship to external contracts:
  - Not a third external API.
  - Distinct from Gateway API and Model API.

### Companion Artifacts
- Gateway component: `build/blueprints/gateway/blueprint.md`
- Agent Loop component: `build/blueprints/agent-loop/blueprint.md`
- Gateway API boundary: `build/blueprints/gateway-api/blueprint.md`

---

## 2. Scope Definition

### What this contract **is**
- An internal contract between two components in the same deployment.
- A strict request and stream-event shape agreement.
- A decoupling boundary that enables Gateway and Agent Loop replacement.
- A control point for error taxonomy and (where a product adds approvals) contract-visible approval semantics.

### What this contract **is not**
- Not a public client-facing API.
- Not component business logic for Gateway or Agent Loop.
- Not a configuration surface for provider, tools, or runtime behavior. (The model is the one per-request choice it carries: the owner's current choice, read by the Gateway on every message.)
- Not an Auth implementation; only a requirement that Auth is called through its contract.

### Boundaries and Constraints
- Gateway owns conversation lifecycle and request normalization.
- Agent Loop owns loop execution and stream generation.
- The Gateway calls Auth before the handoff; the Agent Loop asks Auth before each tool call.
- Request payload must remain bounded and non-configurational.
- Stream payloads must remain typed, classified, and safe.

---

## 3. Core Concepts & Terminology

### Key Concepts
- **Internal Contract**: strict handoff shape between Gateway and Agent Loop.
- **Bounded Request**: `messages[]`, the model, and `metadata` only.
- **Shared Message Shape**: one shape across the Gateway API, this contract and the Model API. Content is a list of parts; tool calls and tool results are ordinary message parts and are saved in history.
- **Stream Event Taxonomy**: canonical set of event classes produced by Agent Loop.
- **Pre-stream Error**: request rejected before SSE stream starts.
- **Mid-stream Error**: error event emitted after stream starts.
- **Contract-visible Approval**: where approval rules apply, approval request/outcome represented in interaction model.

### Internal vs External Concepts
- **Internal**
  - `POST /agent-loop/chat` payload and SSE event semantics.
- canonical `auth_context` attached by the Gateway after its Auth call; the transport adapter verifies and preserves it.
- **External**
  - client request/response contract (`/message`, `/conversations`, and `/approvals` where used).
  - model-provider contract via adapter boundary.

---

## 4. Interfaces & Contracts

Canonical schema pack: `build/blueprints/gateway-agent-loop-contract/contract-pack.json`

### 4.1 `gateway_engine_request`

Required:
- `messages: GatewayMessage[]`
  - `model` (the owner's current choice)
- `metadata.correlation_id: string`

Optional metadata:
- `conversation_id: string`
- `trigger: "message" | "webhook" | "schedule"`
- `client_context: object`

Forbidden request-time fields:
- `provider`
- `provider_adapter`
- `base_url`
- `api_key`
- `api_key_env`
- `tools`
- `tool_sources`

Defaults:
- `trigger` defaults logically to `"message"` when absent (implementation behavior).

### 4.2 `gateway_message`

Required:
- `role: user | assistant | tool` (no `system` message: the bootstrap prompt is Agent Loop configuration)
- `content`: a list of content parts (text first, room for images and files)

Optional:
- `tool_call_id: string` (tool-role continuity)
- `tool_calls: GatewayToolCall[]` (assistant-role tool intent)

### 4.3 `gateway_tool_call`

Required:
- `id: string`
- `name: string`
- `input: object`

### 4.4 `auth_context`

Required:
- `actor` (`identity.json`)
- `authentication_id`
- `authenticated_at`
- `correlation_id`
- Optional: `expires_at`

Forbidden:
- credentials
- permissions
- provider-specific opaque fields

The receiving transport adapter verifies the Gateway boundary and rejects missing,
malformed, expired, or caller-supplied context. Headers, message metadata, and
direct-call arguments are adapters for this canonical shape.

### 4.5 `stream_event`

Allowed event types:
- `text-delta`
- `tool-call`
- `tool-result`
- `approval-request` (where approval rules apply)
- `approval-result` (where approval rules apply)
- `done`
- `error`

#### Event payload requirements
- `text-delta`: `{ type, delta }`
- `tool-call`: `{ type, id, name, input }`
- `tool-result`: `{ type, id, status, output }`, with a "not permitted" error status when Auth refuses the call
- `approval-request`: `{ type, request_id, tool_name, summary, status=pending, created_at, expires_at }`
- `approval-result`: `{ type, request_id, decision, decided_at }`, where decision is `approved | denied | cancelled | expired`; replay is idempotent by request ID
- `done`: `{ type, conversation_id, message_id, finish_reason }`
- `error`: `{ type, code, message }` plus the request's correlation ID

### 4.6 `pre_stream_error_response`

Required:
- `code`
- `message`
- the request's correlation ID

Optional:
- `status` (4xx/5xx)

Allowed `code` values:
- `invalid_request`
- `unauthorized`
- `forbidden`
- `service_unavailable`
- `not_found`

### 4.7 Communication Pattern

- Request/response handoff begins with `POST /agent-loop/chat`.
- Response is SSE stream, not batched polling.
- Pre-stream failures are returned as HTTP error responses.
- Mid-stream failures are emitted as SSE `error` events, then stream closes.

### 4.8 Example Valid Payload

```json
{
  "messages": [
    {
      "role": "user",
      "content": [{ "type": "text", "text": "Draft a project plan." }]
    }
  ],
  "model": "local/llama-3.1-8b",
  "auth_context": {
    "actor": { "id": "owner_abc123", "type": "owner", "display_name": "Owner", "status": "active", "created": "2026-01-15T10:30:00Z" },
    "authentication_id": "authn_123",
    "authenticated_at": "2026-10-21T15:00:00Z",
    "correlation_id": "req_123"
  },
  "metadata": {
    "correlation_id": "req_123",
    "conversation_id": "conv_123",
    "client_context": { "client": "cli" }
  }
}
```

### 4.9 Example Invalid Payload

```json
{
  "messages": [
    { "role": "user", "content": "Draft a plan." }
  ],
  "metadata": {
    "correlation_id": "req_123",
    "provider": "openrouter",
    "api_key": "secret"
  }
}
```

Why invalid:
- request includes forbidden runtime/provider configuration fields.

The valid example includes the canonical `model` field. The internal contract does not
require a separate request timestamp.

---

## 5. Behavior Specification

### 5.1 Handoff Sequence
1. Gateway calls Auth for the request; Auth authenticates and authorizes it, or the Gateway rejects it with 401.
2. Gateway validates and normalizes client request into internal `messages` + model + `auth_context` + `metadata`, reading the owner's current model choice and attaching the identity Auth returned.
3. Gateway calls Agent Loop handoff path with bounded request.
4. Agent Loop starts stream and emits typed events through interaction lifecycle.
5. Gateway forwards events and reconciles completion identifiers as needed.

### 5.2 Request Composition Rules
- `messages` assembled from:
  - conversation history, including tool calls and tool results
  - current interaction message
- The bootstrap prompt is not in the request; the Agent Loop adds it from its own configuration.
- The model is the owner's current choice, read on every message.
- `metadata` carries trace and context only, not runtime reconfiguration.

### 5.3 Stream Event Rules
- Events emitted in causal order.
- Tool lifecycle continuity:
  - `tool-call.id` must match corresponding `tool-result.id`.
- Completion:
  - `done` is terminal success event.
- Failure:
  - `error` is terminal failure event.

### 5.4 Error Behavior
- Pre-stream:
  - validation/auth/unavailable failures -> HTTP error response path.
- Mid-stream:
  - provider/tool/context failures -> SSE `error` with classified code and safe message.
- After terminal `error` or `done`, stream closes.

### 5.5 Approval Interaction Behavior
- The architecture default is that the owner can do everything; no approval is required unless the owner's Auth rules say so.
- Where approval rules apply, approval-required actions must be visible through contract interaction flow.
- Approval request and result must not exist only in local client control logic.
- Denied approvals produce contract-visible denied outcomes.

### 5.6 Edge Cases
- Missing `correlation_id` -> pre-stream invalid request.
- Unknown metadata keys -> pre-stream invalid request.
- Off-contract event type emitted -> contract violation.
- Mid-stream unexpected failure -> classified `error` and stream close.

---

## 6. Dependencies & Interactions

### Direct Dependencies
- Gateway request normalization path.
- Auth contract, called by the Gateway on every request and by the Agent Loop before each tool call.
- Agent Loop stream-emission path.
- Shared request/event contracts.

### Cross-Component Interactions
- Gateway -> Agent Loop:
  - bounded request handoff.
- Agent Loop -> Gateway:
  - typed SSE stream events.
- Gateway -> Auth:
  - authenticate and authorize the request, then allow handoff.
- Agent Loop -> Auth:
  - authorize each tool call before it runs.

### Dependency Assumptions
- Gateway and Agent Loop may be in same process or separate internal services.
- Contract shape, not transport topology, is the source of interoperability.
- Contract remains internal even if network transport is used.

---

## 7. Invariants & Rules

### Boundary Invariants
- Internal handoff is not an external API (`F-02` alignment).
- Gateway remains owner of conversation lifecycle (`G-01`).
- Agent Loop remains owner of loop execution (`E-01`).
- The Gateway calls Auth on every request and the Agent Loop asks Auth before each tool call (`GC-04`, `A-01`, `A-06`).

### Contract Invariants
- Request remains bounded (`GC-01`).
- No hidden request-time reconfiguration (`C-02`).
- Stream event taxonomy remains canonical (`GC-02`).
- Mid-stream errors remain classified (`GC-03`, `GC-05`).
- Error surfaces remain safe (`S-01`).
- Approval, where used, remains contract-visible (`GC-06`, `S-05`).
- One message shape across all three contracts; tool calls and tool results kept in history (`GC-07`).
- Every request carries a timestamp; every error carries the correlation ID (`GC-08`).

### Validation Rules (Conceptual)
- Validate request schema strictly before Agent Loop execution.
- Validate stream events against schema taxonomy.
- Validate error code/message safety.
- Validate that the Gateway's Auth call happened before the handoff.

---

## 8. Non-Functional Requirements

### Performance
- Low overhead request normalization and stream forwarding.
- Event forwarding latency suitable for interactive use.

### Scalability
- Support concurrent interactions with independent stream sessions.
- Maintain deterministic contract behavior under load.

### Reliability
- Deterministic channel split for pre-stream vs mid-stream failures.
- Stable completion and error terminal semantics.
- Recoverable tool failures remain non-terminal unless explicitly unrecoverable.

### Security
- No bypass around Auth, for requests or tool calls.
- No unsafe internal leakage in stream errors.
- Correlation ID traceability across contract path.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Patterns
- **Contract-first request validator** at Gateway -> Agent Loop boundary.
- **Typed stream-event emitter** with schema-backed validation.
- **Error mapper** that converts raw failures into safe taxonomy.
- **Boundary adapter** for same-process and cross-process deployments.

### Design Considerations
- Keep Gateway normalization separate from Agent Loop logic.
- Keep event names stable and avoid alias/event-version proliferation.
- Preserve tool-call roundtrip IDs across buffering and forwarding.
- Where approval rules apply, preserve approval interaction semantics through contract path.

### Anti-Patterns to Avoid
- Passing client payload directly to Agent Loop without normalization.
- Adding per-request provider/tool config fields (the model is the one per-request choice).
- Replacing structured `error` events with raw exception dumps.
- Treating contract as undocumented internal implementation detail (drift risk).

---

## 10. Validation Against AI Primer (`build/primers`)

### Confirmed Alignments
- `GC-01`: bounded `messages` + model + `metadata` handoff.
- `GC-02`: canonical stream event types.
- `GC-03`: mid-stream classified error events.
- `GC-04`: Gateway calls Auth on every request; Agent Loop asks Auth before each tool call.
- `GC-05`: error taxonomy preserved.
- `GC-06`: approval semantics, where used, represented in contract interaction model.
- `GC-07`: one message shape; tool calls and tool results are message parts.
- `GC-08`: correlation ID on every error.
- `C-02`: no request-time configuration channel drift.
- `S-01`: safe client-visible error surfaces.

### Primer/Implementation Tightening
- Primer examples show `done.finish_reason` alone in some snippets; current runtime includes reconciliation IDs as well. This spec preserves reconciliation IDs as required for client contract alignment.
- Primer core event list is concise; runtime and matrix require contract-visible approval events in products that add approvals.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- One internal endpoint and one stream response model (`gateway-agent-loop-contract.md`).
- Internal contract is not a third external API (`overview.md`).
- Auth is an independent component the Gateway calls on every request and the Agent Loop asks before each tool call (`auth-spec.md`).
- Error channel split (pre-stream HTTP vs mid-stream stream errors) is preserved.

### Documented Discrepancies To Reconcile
1. **Event field naming**
   - Human examples show `text-delta.content` and `tool-call.arguments`.
   - Current runtime and AI primer artifacts use `text-delta.delta` and `tool-call.input`.
2. **Completion payload emphasis**
   - Human examples emphasize `finish_reason` and usage.
   - Runtime/client alignment requires `conversation_id` and `message_id` in completion for reconciliation.
3. **Approval stream coverage**
   - Human contract table lists core events.
   - AI matrix and runtime require contract-visible approval request/outcome events.

### Rebuild Guidance When Sources Diverge
- Preserve human ownership/boundary rules as architectural authority.
- Preserve AI primer/matrix contract shapes for MVP interoperability and audits.
- Use schema pack as canonical implementation surface for this repository.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| GEC-CF-001 | Human examples use `text-delta.content` / `tool-call.arguments`; runtime/primer use `delta` / `input` | Standardize on `delta` and `input` in schema and conformance | Matches active implementation and client contract artifacts | Event consumers break across implementations |
| GEC-CF-002 | Human example `done` payload emphasizes `finish_reason`; client/runtime alignment requires reconciliation IDs | Require `done.conversation_id` and `done.message_id` plus `finish_reason` | Enables deterministic state reconciliation across clients | Completion cannot be reliably persisted/reconciled |
| GEC-CF-003 | Human core event list excludes approval-specific events; matrix requires contract-visible approval semantics | Include `approval-request` and `approval-result` in contract taxonomy, used only where approval rules apply | Aligns with `GC-06` and `S-05` compliance targets | Approval behavior becomes UI-specific and non-portable |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST
- `GEC-MUST-001`: Gateway MUST send only bounded `messages` + model + `auth_context` + `metadata` request shape.
- `GEC-MUST-002`: `metadata.correlation_id` MUST be present on every request.
- `GEC-MUST-003`: Metadata MUST be limited to contract-approved keys.
- `GEC-MUST-004`: Request MUST reject hidden provider/tool/runtime configuration fields and MUST NOT carry a system message.
- `GEC-MUST-005`: The Gateway MUST call Auth on every request before the handoff, and the Agent Loop MUST ask Auth before each tool call.
- `GEC-MUST-006`: Agent Loop MUST emit only canonical contract event types.
- `GEC-MUST-007`: Mid-stream `error.code` MUST be `provider_error`, `tool_error`, or `context_overflow`.
- `GEC-MUST-008`: Mid-stream error messages MUST be safe for client display.
- `GEC-MUST-009`: Pre-stream errors MUST use HTTP responses; mid-stream failures MUST use SSE `error` events.
- `GEC-MUST-010`: Tool-call and tool-result IDs MUST preserve continuity.
- `GEC-MUST-011`: Completion event MUST include `conversation_id`, `message_id`, and finish semantics.
- `GEC-MUST-012`: This contract MUST remain internal and MUST NOT be treated as a third external API.
- `GEC-MUST-013`: Where the owner's Auth rules require approval, approval requests/outcomes MUST be represented through contract interaction flow. With no approval rules (the default), none is required.
- `GEC-MUST-014`: Gateway and Agent Loop MUST remain independently swappable if contract compatibility is preserved.
- `GEC-MUST-015`: Messages MUST use the single shared shape: content is a list of parts, and tool calls and tool results are ordinary message parts that the Gateway saves in history and sends back on resume.
- `GEC-MUST-016`: Every request MUST carry a timestamp, and every error (HTTP or SSE) MUST carry the request's correlation ID.
- `GEC-MUST-017`: The canonical `auth_context` MUST survive transport adapters without credentials or permissions; missing, malformed, expired, or caller-supplied context MUST fail closed.

### SHOULD
- `GEC-SHOULD-001`: Correlation IDs SHOULD propagate to logs and tool context for traceability.
- `GEC-SHOULD-002`: Stream event ordering SHOULD remain causally deterministic per interaction.
- `GEC-SHOULD-003`: Contract validation SHOULD run in automated CI for every boundary-changing release.

### MAY
- `GEC-MAY-001`: Gateway and Agent Loop MAY run in same process or separate internal services.
- `GEC-MAY-002`: Metadata MAY carry additional client context only via explicitly approved schema evolution.

## 14. Acceptance Gates (Pass/Fail)

- `GEC-GATE-01 Contract Gate`: Pass if request/event/error shapes validate against `contracts/openapi/gateway-engine.yaml`; fail otherwise.
- `GEC-GATE-02 Conformance Gate`: Pass if all vectors in `build/blueprints/gateway-agent-loop-contract/tests.md` pass (16 positive + 16 negative); fail on any `GEC-MUST-*` violation.
- `GEC-GATE-03 Drift Gate`: Pass if all Critical checks in `build/blueprints/gateway-agent-loop-contract/drift-guard.md` pass; fail on any Critical check failure.
- `GEC-GATE-04 Security Gate`: Pass if auth path and safe error-surface requirements pass; fail on auth bypass or unsafe leakage.
- `GEC-GATE-05 Boundary Gate`: Pass if contract remains internal and swapability checks pass; fail if treated as external third API or if contract-compatible swaps fail.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| GEC-MUST-001 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-01` | `GEC-T001P`, `GEC-T001N` |
| GEC-MUST-002 | Human `gateway-agent-loop-contract.md`; AI `gateway-agent-loop-contract.md` | `GEC-T002P`, `GEC-T002N` |
| GEC-MUST-003 | Human `gateway-agent-loop-contract.md`; AI `gateway-agent-loop-contract.md` | `GEC-T003P`, `GEC-T003N` |
| GEC-MUST-004 | Human `configuration-spec.md`; AI matrix `C-02`, `GC-01` | `GEC-T004P`, `GEC-T004N` |
| GEC-MUST-005 | Human `auth-spec.md`; AI matrix `GC-04`, `A-01`, `A-06` | `GEC-T005P`, `GEC-T005N` |
| GEC-MUST-006 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-02` | `GEC-T006P`, `GEC-T006N` |
| GEC-MUST-007 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-05` | `GEC-T007P`, `GEC-T007N` |
| GEC-MUST-008 | Human `security-spec.md`; AI matrix `GC-03`, `S-01` | `GEC-T008P`, `GEC-T008N` |
| GEC-MUST-009 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-03` | `GEC-T009P`, `GEC-T009N` |
| GEC-MUST-010 | Human contract tool event continuity intent; runtime contract in `build/contracts.ts` | `GEC-T010P`, `GEC-T010N` |
| GEC-MUST-011 | AI `client-gateway-contract.md`; runtime completion reconciliation behavior | `GEC-T011P`, `GEC-T011N` |
| GEC-MUST-012 | Human `overview.md`; AI matrix `F-02` | `GEC-T012P`, `GEC-T012N` |
| GEC-MUST-013 | Human contract approval section; AI matrix `GC-06`, `S-05` | `GEC-T013P`, `GEC-T013N` |
| GEC-MUST-014 | Human swappability goals (`FS-5`, `FS-7` references); AI drift checks | `GEC-T014P`, `GEC-T014N` |
| GEC-MUST-015 | Human `gateway-agent-loop-contract.md`, `communication-principles.md`; AI matrix `GC-07`, `G-09` | `GEC-T015P`, `GEC-T015N` |
| GEC-MUST-016 | Human `gateway-agent-loop-contract.md`, `communication-principles.md`; AI matrix `GC-08` | `GEC-T016P`, `GEC-T016N` |
| GEC-MUST-017 | Human `auth-spec.md`; canonical `contracts/schemas/auth-context.json` | `GEC-T017P`, `GEC-T017N` |

## 16. Residual Risks & Open Decisions

- `GEC-RISK-001 (Medium)`: Legacy docs still contain mixed event-field naming examples.
- `GEC-RISK-002 (Medium)`: Approval event scope can drift if teams interpret "core events" too narrowly.
- `GEC-RISK-003 (Low)`: Internal-vs-external boundary confusion may reappear in client/runtime docs unless explicitly maintained.
- `GEC-DECISION-OPEN-001`: Publish a canonical event-field glossary and examples synchronized across human docs, primer docs, and schema pack.

## Source Basis

- Human-readable architecture reference: `architecture`
- AI primer layer: ` ai`
- Implementation behavior used for blueprint fidelity:
  - `build/contracts.ts`
  - `build/gateway/server.ts`
  - `build/engine/loop.ts`
  - `build/engine/errors.ts`
  - `build/engine/stream.ts`
  - `build/auth/middleware.ts`
  - `build/auth/headers.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 22 total (`17 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 6 (`gateway_engine_request`, `gateway_message`, `gateway_tool_call`, `auth_context`, `stream_event`, `pre_stream_error_response`)
- Test vectors count: 32 total (`16 positive`, `16 negative`)
- Conflicts detected/resolved: 3/3 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: tool-definition semantics (S8) remains open outside this bounded contract.
- Final readiness rating: Conditionally Ready

## Contract Alignment

The canonical contracts are authoritative for this blueprint. The internal boundary is
`POST /agent-loop/chat`; requests include the selected `model`, messages use structured
content parts, and shared Auth/error schemas define the cross-component result shapes.
The adjacent `contract-pack.json` records these canonical sources and is not a second
contract authority.
