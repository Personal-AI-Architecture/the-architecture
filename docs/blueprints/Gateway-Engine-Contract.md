# Gateway-Engine Contract Blueprint Specification

## 1. Overview

### Purpose
The Gateway-Engine Contract defines the bounded internal handoff between Gateway and Engine so both components can evolve independently while preserving behavior, safety, and auditability.

### High-Level Responsibilities
- Define one internal request contract (`messages + metadata`) for `POST /engine/chat`.
- Define one internal streaming event contract for interaction output.
- Define pre-stream vs mid-stream failure behavior.
- Enforce that Auth sits on the request path.
- Prevent hidden reconfiguration and boundary ownership drift.

### System Context
- Upstream: Gateway component.
- On-path control: Auth boundary.
- Downstream: Engine (Agent Loop) execution loop.
- Relationship to external contracts:
  - Not a third external API.
  - Distinct from Gateway API and Model API.

### Companion Artifacts
- Gateway component: `blueprints/Gateway.md`
- Engine component: `blueprints/Engine.md`
- Gateway API boundary: `blueprints/Gateway-API.md`

---

## 2. Scope Definition

### What this contract **is**
- An internal contract between two components in the same deployment.
- A strict request and stream-event shape agreement.
- A decoupling boundary that enables Gateway and Engine replacement.
- A control point for error taxonomy and contract-visible approval semantics.

### What this contract **is not**
- Not a public client-facing API.
- Not component business logic for Gateway or Engine.
- Not a configuration surface for provider, model, tools, or runtime behavior.
- Not an Auth implementation; only an Auth-on-path requirement.

### Boundaries and Constraints
- Gateway owns conversation lifecycle and request normalization.
- Engine owns loop execution and stream generation.
- Auth validates before Engine execution.
- Request payload must remain bounded and non-configurational.
- Stream payloads must remain typed, classified, and safe.

---

## 3. Core Concepts & Terminology

### Key Concepts
- **Internal Contract**: strict handoff shape between Gateway and Engine.
- **Bounded Request**: `messages[]` and `metadata` only.
- **Stream Event Taxonomy**: canonical set of event classes produced by Engine.
- **Pre-stream Error**: request rejected before SSE stream starts.
- **Mid-stream Error**: error event emitted after stream starts.
- **Contract-visible Approval**: approval request/outcome represented in interaction model.

### Internal vs External Concepts
- **Internal**
  - `POST /engine/chat` payload and SSE event semantics.
  - auth context attached on path.
- **External**
  - client request/response contract (`/message`, `/conversations`, `/approvals`).
  - model-provider contract via adapter boundary.

---

## 4. Interfaces & Contracts

Canonical schema pack: `blueprints/contracts/Gateway-Engine-Contract.schema.json`

### 4.1 `gateway_engine_request`

Required:
- `messages: GatewayMessage[]`
- `metadata.correlation_id: string`

Optional metadata:
- `conversation_id: string`
- `trigger: "message" | "webhook" | "schedule"`
- `client_context: object`

Forbidden request-time fields:
- `provider`
- `provider_adapter`
- `model`
- `base_url`
- `api_key`
- `api_key_env`
- `tools`
- `tool_sources`

Defaults:
- `trigger` defaults logically to `"message"` when absent (implementation behavior).

### 4.2 `gateway_message`

Required:
- `role: system | user | assistant | tool`
- `content: string`

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
- `actorId`
- `actorType`
- `mode`
- `permissions`

Current implementation profile:
- `actorType = "owner"`
- `mode = "local-owner"`

### 4.5 `stream_event`

Allowed event types:
- `text-delta`
- `tool-call`
- `tool-result`
- `approval-request`
- `approval-result`
- `done`
- `error`

#### Event payload requirements
- `text-delta`: `{ type, delta }`
- `tool-call`: `{ type, id, name, input }`
- `tool-result`: `{ type, id, status, output }`
- `approval-request`: `{ type, request_id, tool_name, summary }`
- `approval-result`: `{ type, request_id, decision }`
- `done`: `{ type, conversation_id, message_id, finish_reason }`
- `error`: `{ type, code, message }`

### 4.6 `pre_stream_error_response`

Required:
- `code`
- `message`

Optional:
- `status` (4xx/5xx)

Allowed `code` values:
- `invalid_request`
- `unauthorized`
- `forbidden`
- `service_unavailable`
- `not_found`

### 4.7 Communication Pattern

- Request/response handoff begins with `POST /engine/chat`.
- Response is SSE stream, not batched polling.
- Pre-stream failures are returned as HTTP error responses.
- Mid-stream failures are emitted as SSE `error` events, then stream closes.

### 4.8 Example Valid Payload

```json
{
  "messages": [
    { "role": "system", "content": "Read /AGENT.md." },
    { "role": "user", "content": "Draft a project plan." }
  ],
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

---

## 5. Behavior Specification

### 5.1 Handoff Sequence
1. Gateway validates and normalizes client request into internal `messages + metadata`.
2. Auth validates request and attaches auth context.
3. Gateway calls Engine handoff path with bounded request.
4. Engine starts stream and emits typed events through interaction lifecycle.
5. Gateway forwards events and reconciles completion identifiers as needed.

### 5.2 Request Composition Rules
- `messages` assembled from:
  - system bootstrap prompt
  - conversation history
  - current interaction message
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
- Approval-required actions must be visible through contract interaction flow.
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
- Auth middleware/boundary on request path.
- Engine stream-emission path.
- Shared request/event contracts.

### Cross-Component Interactions
- Gateway -> Engine:
  - bounded request handoff.
- Engine -> Gateway:
  - typed SSE stream events.
- Auth -> Gateway/Engine path:
  - authenticate, then allow handoff.

### Dependency Assumptions
- Gateway and Engine may be in same process or separate internal services.
- Contract shape, not transport topology, is the source of interoperability.
- Contract remains internal even if network transport is used.

---

## 7. Invariants & Rules

### Boundary Invariants
- Internal handoff is not an external API (`F-02` alignment).
- Gateway remains owner of conversation lifecycle (`G-01`).
- Engine remains owner of loop execution (`E-01`).
- Auth must sit on path (`GC-04`, `A-01`).

### Contract Invariants
- Request remains bounded (`GC-01`).
- No hidden request-time reconfiguration (`C-02`).
- Stream event taxonomy remains canonical (`GC-02`).
- Mid-stream errors remain classified (`GC-03`, `GC-05`).
- Error surfaces remain safe (`S-01`).
- Approval remains contract-visible (`GC-06`, `S-05`).

### Validation Rules (Conceptual)
- Validate request schema strictly before Engine execution.
- Validate stream events against schema taxonomy.
- Validate error code/message safety.
- Validate auth context presence for protected paths.

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
- No bypass around Auth.
- No unsafe internal leakage in stream errors.
- Correlation ID traceability across contract path.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Patterns
- **Contract-first request validator** at Gateway -> Engine boundary.
- **Typed stream-event emitter** with schema-backed validation.
- **Error mapper** that converts raw failures into safe taxonomy.
- **Boundary adapter** for same-process and cross-process deployments.

### Design Considerations
- Keep Gateway normalization separate from Engine loop logic.
- Keep event names stable and avoid alias/event-version proliferation.
- Preserve tool-call roundtrip IDs across buffering and forwarding.
- Preserve approval interaction semantics through contract path.

### Anti-Patterns to Avoid
- Passing client payload directly to Engine without normalization.
- Adding per-request model/provider/tool config fields.
- Replacing structured `error` events with raw exception dumps.
- Treating contract as undocumented internal implementation detail (drift risk).

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `GC-01`: bounded `messages + metadata` handoff.
- `GC-02`: canonical stream event types.
- `GC-03`: mid-stream classified error events.
- `GC-04`: Auth on path.
- `GC-05`: error taxonomy preserved.
- `GC-06`: approval semantics represented in contract interaction model.
- `C-02`: no request-time configuration channel drift.
- `S-01`: safe client-visible error surfaces.

### Primer/Implementation Tightening
- Primer examples show `done.finish_reason` alone in some snippets; current runtime includes reconciliation IDs as well. This spec preserves reconciliation IDs as required for client contract alignment.
- Primer core event list is concise; runtime and matrix require contract-visible approval events for full conformance.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- One internal endpoint and one stream response model (`gateway-engine-contract.md`).
- Internal contract is not a third external API (`foundation-spec.md`).
- Auth sits on the path as independent boundary (`auth-spec.md`).
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
| GEC-CF-003 | Human core event list excludes approval-specific events; matrix requires contract-visible approval semantics | Include `approval-request` and `approval-result` in contract taxonomy | Aligns with `GC-06` and `S-05` compliance targets | Approval behavior becomes UI-specific and non-portable |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST
- `GEC-MUST-001`: Gateway MUST send only bounded `messages + metadata` request shape.
- `GEC-MUST-002`: `metadata.correlation_id` MUST be present on every request.
- `GEC-MUST-003`: Metadata MUST be limited to contract-approved keys.
- `GEC-MUST-004`: Request MUST reject hidden provider/tool/runtime configuration fields.
- `GEC-MUST-005`: Auth MUST be enforced on the Gateway -> Engine path.
- `GEC-MUST-006`: Engine MUST emit only canonical contract event types.
- `GEC-MUST-007`: Mid-stream `error.code` MUST be `provider_error`, `tool_error`, or `context_overflow`.
- `GEC-MUST-008`: Mid-stream error messages MUST be safe for client display.
- `GEC-MUST-009`: Pre-stream errors MUST use HTTP responses; mid-stream failures MUST use SSE `error` events.
- `GEC-MUST-010`: Tool-call and tool-result IDs MUST preserve continuity.
- `GEC-MUST-011`: Completion event MUST include `conversation_id`, `message_id`, and finish semantics.
- `GEC-MUST-012`: This contract MUST remain internal and MUST NOT be treated as a third external API.
- `GEC-MUST-013`: Approval requests/outcomes MUST be represented through contract interaction flow where required.
- `GEC-MUST-014`: Gateway and Engine MUST remain independently swappable if contract compatibility is preserved.

### SHOULD
- `GEC-SHOULD-001`: Correlation IDs SHOULD propagate to logs and tool context for traceability.
- `GEC-SHOULD-002`: Stream event ordering SHOULD remain causally deterministic per interaction.
- `GEC-SHOULD-003`: Contract validation SHOULD run in automated CI for every boundary-changing release.

### MAY
- `GEC-MAY-001`: Gateway and Engine MAY run in same process or separate internal services.
- `GEC-MAY-002`: Metadata MAY carry additional client context only via explicitly approved schema evolution.

## 14. Acceptance Gates (Pass/Fail)

- `GEC-GATE-01 Contract Gate`: Pass if request/event/error shapes validate against `contracts/Gateway-Engine-Contract.schema.json`; fail otherwise.
- `GEC-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Gateway-Engine-Contract-conformance.md` pass (14 positive + 14 negative); fail on any `GEC-MUST-*` violation.
- `GEC-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Gateway-Engine-Contract-drift-guard.md` pass; fail on any Critical check failure.
- `GEC-GATE-04 Security Gate`: Pass if auth path and safe error-surface requirements pass; fail on auth bypass or unsafe leakage.
- `GEC-GATE-05 Boundary Gate`: Pass if contract remains internal and swapability checks pass; fail if treated as external third API or if contract-compatible swaps fail.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| GEC-MUST-001 | Human `gateway-engine-contract.md`; AI matrix `GC-01` | `GEC-T001P`, `GEC-T001N` |
| GEC-MUST-002 | Human `gateway-engine-contract.md`; AI `gateway-engine-contract.md` | `GEC-T002P`, `GEC-T002N` |
| GEC-MUST-003 | Human `gateway-engine-contract.md`; AI `gateway-engine-contract.md` | `GEC-T003P`, `GEC-T003N` |
| GEC-MUST-004 | Human `configuration-spec.md`; AI matrix `C-02`, `GC-01` | `GEC-T004P`, `GEC-T004N` |
| GEC-MUST-005 | Human `auth-spec.md`; AI matrix `GC-04`, `A-01` | `GEC-T005P`, `GEC-T005N` |
| GEC-MUST-006 | Human `gateway-engine-contract.md`; AI matrix `GC-02` | `GEC-T006P`, `GEC-T006N` |
| GEC-MUST-007 | Human `gateway-engine-contract.md`; AI matrix `GC-05` | `GEC-T007P`, `GEC-T007N` |
| GEC-MUST-008 | Human `security-spec.md`; AI matrix `GC-03`, `S-01` | `GEC-T008P`, `GEC-T008N` |
| GEC-MUST-009 | Human `gateway-engine-contract.md`; AI matrix `GC-03` | `GEC-T009P`, `GEC-T009N` |
| GEC-MUST-010 | Human contract tool event continuity intent; runtime contract in `build/contracts.ts` | `GEC-T010P`, `GEC-T010N` |
| GEC-MUST-011 | AI `client-gateway-contract.md`; runtime completion reconciliation behavior | `GEC-T011P`, `GEC-T011N` |
| GEC-MUST-012 | Human `foundation-spec.md`; AI matrix `F-02` | `GEC-T012P`, `GEC-T012N` |
| GEC-MUST-013 | Human contract approval section; AI matrix `GC-06`, `S-05` | `GEC-T013P`, `GEC-T013N` |
| GEC-MUST-014 | Human swappability goals (`FS-5`, `FS-7` references); AI drift checks | `GEC-T014P`, `GEC-T014N` |

## 16. Residual Risks & Open Decisions

- `GEC-RISK-001 (Medium)`: Legacy docs still contain mixed event-field naming examples.
- `GEC-RISK-002 (Medium)`: Approval event scope can drift if teams interpret "core events" too narrowly.
- `GEC-RISK-003 (Low)`: Internal-vs-external boundary confusion may reappear in client/runtime docs unless explicitly maintained.
- `GEC-DECISION-OPEN-001`: Publish a canonical event-field glossary and examples synchronized across human docs, primer docs, and schema pack.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/contracts.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/gateway/server.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/loop.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/errors.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/stream.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/auth/middleware.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/auth/headers.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 6 (`gateway_engine_request`, `gateway_message`, `gateway_tool_call`, `auth_context`, `stream_event`, `pre_stream_error_response`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 3/3 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: some human examples still use legacy event payload field names.
- Final readiness rating: Conditionally Ready
