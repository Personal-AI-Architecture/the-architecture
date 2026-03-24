# Gateway API Blueprint Specification

## 1. Overview

### Purpose
The Gateway API is the external contract through which clients interact with the system. It defines how messages, conversations, streaming outputs, and approvals are exchanged with the Gateway component.

### High-Level Responsibilities
- Provide a stable, client-facing request and response contract.
- Support conversation creation, continuation, listing, and retrieval.
- Stream interaction outputs as server-sent events (SSE).
- Expose approval interactions as explicit, auditable API behavior.
- Keep external contract shape separate from internal Gateway-Engine handoff.

### Architectural Context
- Boundary type: external API boundary, not a standalone component.
- Component owner: Gateway component.
- Upstream callers: clients (CLI, web, mobile, bots, other agents).
- Downstream effect: Gateway normalizes this API into internal `messages + metadata` contract for the Engine.

### Companion Artifact
- Gateway component specification: `blueprints/Gateway.md`

---

## 2. Scope Definition

### What the Gateway API **is**
- A public-facing contract boundary between clients and Gateway.
- A transport and shape specification for request bodies, response envelopes, stream events, and approval decisions.
- A swappability interface for client implementations.

### What the Gateway API **is not**
- Not a component with independent runtime ownership.
- Not the internal Gateway-Engine contract.
- Not a model/provider configuration surface.
- Not an authorization policy definition layer.

### Boundaries and Constraints
- Client payloads must remain client-facing and simple.
- Clients must not send internal Engine request format directly.
- Approval semantics must be contract-visible, not client-local hidden flow.
- Error and event surfaces must be safe for external display.

---

## 3. Core Concepts & Terminology

### Contract Concepts
- **Client Contract**: external API shape between clients and Gateway.
- **Internal Contract**: bounded Gateway-to-Engine shape (`messages + metadata`).
- **Conversation Resolution**: process by which a message is tied to an existing or new conversation ID.
- **Contract-visible Interaction**: behavior represented in actual API routes/events.

### Streaming Concepts
- **SSE Stream**: ordered stream of typed events for one interaction.
- **Done Event**: terminal completion marker containing stable identifiers.
- **Error Event**: stream failure signal with classified code and safe message.

### Approval Concepts
- **Approval Request**: event announcing required user decision for sensitive action.
- **Approval Result**: event indicating outcome of approval decision.
- **Approval Decision Submission**: explicit route for client to provide final decision.

---

## 4. Interfaces & Contracts

### 4.1 Endpoint Surface

#### `POST /message`
- Purpose: submit a message for new or existing conversation processing.
- Request body:
  - `content` (required string)
  - `metadata` (optional object)
- Conversation continuation:
  - if conversation context is provided by client (for example via a request header), Gateway attempts to append to that conversation
  - if absent, Gateway creates a new conversation
- Response:
  - HTTP 200 with `text/event-stream`
  - `X-Conversation-ID` header once conversation is resolved
  - streamed events (see 4.3)

#### `GET /conversations`
- Purpose: list conversation summaries.
- Query:
  - `limit` (optional)
  - `offset` (optional)
- Response envelope:
  - `conversations[]`
  - `total`
  - `limit`
  - `offset`

#### `GET /conversations/:id`
- Purpose: retrieve conversation detail and message history.
- Response envelope:
  - `id`, `title`, `created_at`, `updated_at`
  - `messages[]` entries with stable IDs, roles, content, and timestamps

#### `POST /approvals/:request_id`
- Purpose: submit approval decision.
- Request body:
  - `decision` in `{ approved, denied }`
- Response body:
  - `{ request_id, decision }`

#### `GET /health`
- Purpose: health probe endpoint.

### 4.2 Request/Response Data Contracts (Abstract)

#### Message request
- Shape:
  - `content: string` (required)
  - `metadata?: object`
- Rule:
  - metadata is contextual payload, not configuration channel

#### Conversation list response
- Shape:
  - `conversations: ConversationSummary[]`
  - `total: number`
  - `limit: number`
  - `offset: number`

#### Conversation detail response
- Shape:
  - `id: string`
  - `title: string | null`
  - `created_at: timestamp`
  - `updated_at: timestamp`
  - `messages: ConversationMessage[]`

#### Approval decision request/response
- Request:
  - `decision: approved | denied`
- Response:
  - `request_id: string`
  - `decision: approved | denied`

### 4.3 Streaming Event Contract

#### Event types
- `text-delta`
- `tool-call`
- `tool-result`
- `approval-request`
- `approval-result`
- `done`
- `error`

#### Minimum event payload expectations
- `approval-request`: `request_id`, `tool_name`, `summary`
- `approval-result`: `request_id`, `decision`
- `done`: `conversation_id`, `message_id` (may also include completion metadata)
- `error`: `code`, `message`

### 4.4 Error Contract

#### Pre-stream errors (HTTP response)
- Typical status classes:
  - `400` invalid request shape
  - `401` unauthorized
  - `403` forbidden approval decision
  - `404` not found (conversation/approval)
  - `503` downstream processing unavailable
- Response body should use a safe error envelope.

#### Mid-stream errors (SSE `error` event)
- Classified codes:
  - `provider_error`
  - `tool_error`
  - `context_overflow`
- Message must be safe for external display.

---

## 5. Behavior Specification

### 5.1 Message Interaction Flow
1. Client sends `POST /message` with external contract payload.
2. Gateway validates request shape.
3. Gateway authenticates/authorizes protected request path.
4. Gateway resolves conversation target (new or existing).
5. Gateway streams processing output as SSE events.
6. Gateway returns completion event with reconcilable IDs.

### 5.2 Conversation Retrieval Flow
- `GET /conversations` returns paginated summaries.
- `GET /conversations/:id` returns canonical detail envelope.
- Unknown IDs return safe not-found response.

### 5.3 Approval Flow
1. Stream emits `approval-request`.
2. Stream emits `approval-result` when decision is applied.
3. Client submits explicit decision using `POST /approvals/:request_id`.
4. API returns explicit decision confirmation payload.

### 5.4 State Reconciliation Behavior
- Clients use `X-Conversation-ID` and `done` event identifiers to reconcile UI/client state.
- Clients treat stream events as ordered interaction timeline.

### 5.5 Edge Cases
- Missing required fields: reject pre-stream with safe validation error.
- Metadata attempting config leakage: reject as invalid request.
- Approval decision payload mismatch: reject with safe error.
- Mid-stream unrecoverable failure: emit classified `error` and close stream.

---

## 6. Dependencies & Interactions

### Direct Dependencies
- Gateway runtime implementation.
- Auth boundary on protected routes.
- Conversation persistence boundary in Memory.
- Internal Gateway-Engine stream contract.

### Interaction Boundaries
- External clients depend on Gateway API stability.
- Gateway API must remain decoupled from provider/adapter internals.
- Approval and security controls must be exposed via contract semantics, not implicit UI behavior.

### Assumptions
- Gateway can always normalize external request shape into internal handoff.
- Conversation identifiers remain globally unique and stable.
- Stream event taxonomy is consistently emitted.

---

## 7. Invariants & Rules

### Contract Invariants
- External client request shape remains `{ content, metadata? }`.
- Internal request shape (`messages + metadata`) is never client-authored.
- Conversation endpoints return canonical envelopes, not raw storage records.
- `done` event always provides stable identifiers needed by clients.
- Approval uses canonical explicit route and payload.

### Security Invariants
- Protected routes always pass through Auth.
- Client-visible errors/events never expose unsafe internals.
- Approval is enforced as real runtime state, not prompt-only behavior.

### Drift Indicators
- Client sends `messages`, `provider`, `model`, or tool definitions in `POST /message`.
- Response leaks raw internal storage structures.
- Approval handled only in client UI with no contract-visible events/routes.
- Error surfaces leak stack traces, filesystem paths, or secrets.

---

## 8. Non-Functional Requirements

### Stability
- Contract must remain stable across client types.
- Backward compatibility changes should be explicit and coordinated.

### Performance
- Stream-first behavior for low perceived latency.
- Efficient conversation list/detail retrieval for interactive clients.

### Reliability
- Deterministic error mode split: pre-stream HTTP vs mid-stream SSE.
- Predictable completion semantics with stable IDs.

### Security
- Safe external error messaging.
- Auth-protected write/sensitive flows.
- TLS support for external-facing deployments.
- Request validation and input-size abuse controls.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Design Approach
- Define API schema contracts first, then route handlers.
- Keep external DTOs separate from internal Engine DTOs.
- Use event adapter layer to map internal stream events to client contract.
- Keep approval decision handling explicit and idempotent where possible.

### Operational Considerations
- Attach correlation IDs for traceability.
- Log structured audit events for auth decisions, contract errors, memory writes, and stream failures.
- Enforce strict validation on request shape and known metadata allowlist.

### Anti-Patterns to Avoid
- Treating Gateway API as a thin passthrough to internal Engine payload format.
- Exposing provider or runtime configuration fields in client requests.
- Allowing non-canonical approval helper routes.
- Returning non-deterministic event names or payload shapes.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignment
- Matches `client-gateway-contract.md` endpoint and payload guidance.
- Preserves matrix rules `G-05`, `G-06`, `G-07`, `G-08`, and `S-05`.
- Enforces hidden-configuration prevention (`C-02`) on request metadata.
- Reflects classified safe error expectations (`GC-03`, `GC-05`, `S-01`).
- Keeps approval contract-visible via events and explicit decision route.

### Primer Emphasis Captured
- Clear separation between client contract and internal contract.
- Canonical conversation response envelopes.
- `X-Conversation-ID` and `done` identifiers for client reconciliation.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignment
- Gateway API is an external boundary and swappability surface.
- Clients are external; Gateway API is the ingress path for all clients.
- Gateway component retains ownership of conversation lifecycle behind this API.
- External API remains content-agnostic and interface-agnostic.

### Clarification on Documentation Granularity
- Human architecture docs define Gateway API at principle and boundary level.
- AI primer docs define concrete endpoint and payload shapes for implementation/audit.
- This specification uses human docs for boundary ownership and primer docs for canonical endpoint-level detail.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| GAPI-CF-001 | Internal human examples use `text-delta.content` / `tool-call.arguments`; primer/runtime examples use `text-delta.delta` / `tool-call.input` | Use primer/runtime field naming for MVP contract conformance | Matches active client contract artifacts and tests | Client integrations diverge and break compatibility |
| GAPI-CF-002 | Some internal docs emphasize `done.finish_reason`; client contract requires reconciliation IDs | Require `done.conversation_id` + `done.message_id` for external API | External clients need deterministic state reconciliation | Clients cannot bind terminal stream result to persisted state |
| GAPI-CF-003 | Approval interaction sometimes described as implementation flow; matrix requires contract visibility | Preserve approval as explicit stream + decision endpoint contract behavior | Aligns with `G-08`, `S-05`, `GC-06` compliance targets | Approval behavior becomes non-portable and non-auditable |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `GAPI-MUST-001`: `POST /message` MUST accept only `{ content, metadata? }`.
- `GAPI-MUST-002`: API MUST reject client payloads that include internal handoff/configuration fields.
- `GAPI-MUST-003`: Stream MUST emit only canonical event classes (`text-delta`, `tool-call`, `tool-result`, `approval-request`, `approval-result`, `done`, `error`).
- `GAPI-MUST-004`: `done` event MUST include `conversation_id` and `message_id`.
- `GAPI-MUST-005`: `POST /message` response MUST include `X-Conversation-ID` once conversation resolves.
- `GAPI-MUST-006`: `GET /conversations` MUST return canonical envelope (`conversations`, `total`, `limit`, `offset`).
- `GAPI-MUST-007`: `GET /conversations/:id` MUST return canonical detail envelope.
- `GAPI-MUST-008`: Approval decision MUST use canonical endpoint/payload (`POST /approvals/:request_id`, `{ decision }` -> `{ request_id, decision }`).
- `GAPI-MUST-009`: Approval interaction MUST be contract-visible via stream events.
- `GAPI-MUST-010`: Pre-stream failures MUST be HTTP responses; mid-stream failures MUST be SSE `error` events.
- `GAPI-MUST-011`: Mid-stream errors MUST use taxonomy codes with safe display messages.
- `GAPI-MUST-012`: Protected routes MUST enforce Auth.
- `GAPI-MUST-013`: Unknown conversation/approval identifiers MUST return safe not-found behavior.

### SHOULD

- `GAPI-SHOULD-001`: API SHOULD preserve stable ordering semantics in conversation list responses.
- `GAPI-SHOULD-002`: API SHOULD keep approval decision behavior idempotent for client retries.

### MAY

- `GAPI-MAY-001`: API MAY expose optional pagination defaults and limits as documented configuration.

## 14. Acceptance Gates (Pass/Fail)

- `GAPI-GATE-01 Contract Gate`: Pass if endpoint payloads/events validate against `contracts/Gateway-API.schema.json`; fail otherwise.
- `GAPI-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Gateway-API-conformance.md` pass (13 positive + 13 negative); fail on any `GAPI-MUST-*` failure.
- `GAPI-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Gateway-API-drift-guard.md` pass; fail on any Critical check failure.
- `GAPI-GATE-04 Security Gate`: Pass if auth bypass and unsafe error exposure are absent; fail if either is detected.
- `GAPI-GATE-05 Conflict Gate`: Pass if no unresolved High-risk conflict remains in Conflict Register.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| GAPI-MUST-001 | AI `client-gateway-contract.md`; matrix `G-05` | `GAPI-T001P`, `GAPI-T001N` |
| GAPI-MUST-002 | AI `client-gateway-contract.md`; matrix `G-05`, `C-02` | `GAPI-T002P`, `GAPI-T002N` |
| GAPI-MUST-003 | AI `client-gateway-contract.md`; matrix `GC-02`, `S-05` | `GAPI-T003P`, `GAPI-T003N` |
| GAPI-MUST-004 | AI `client-gateway-contract.md`; matrix `G-07` | `GAPI-T004P`, `GAPI-T004N` |
| GAPI-MUST-005 | AI `client-gateway-contract.md`; matrix `G-07` | `GAPI-T005P`, `GAPI-T005N` |
| GAPI-MUST-006 | AI `client-gateway-contract.md`; matrix `G-06` | `GAPI-T006P`, `GAPI-T006N` |
| GAPI-MUST-007 | AI `client-gateway-contract.md`; matrix `G-06` | `GAPI-T007P`, `GAPI-T007N` |
| GAPI-MUST-008 | AI `client-gateway-contract.md`; matrix `G-08` | `GAPI-T008P`, `GAPI-T008N` |
| GAPI-MUST-009 | AI `client-gateway-contract.md`; matrix `S-05`, `GC-06` | `GAPI-T009P`, `GAPI-T009N` |
| GAPI-MUST-010 | Human `gateway-engine-contract.md` error handling; AI matrix `GC-03` | `GAPI-T010P`, `GAPI-T010N` |
| GAPI-MUST-011 | Human `security-spec.md`; AI matrix `GC-05`, `S-01` | `GAPI-T011P`, `GAPI-T011N` |
| GAPI-MUST-012 | Human `auth-spec.md`; AI matrix `A-01` | `GAPI-T012P`, `GAPI-T012N` |
| GAPI-MUST-013 | Human `gateway-spec.md`; AI contract guidance for not-found behavior | `GAPI-T013P`, `GAPI-T013N` |

## 16. Residual Risks & Open Decisions

- `GAPI-RISK-001 (Medium)`: Source documents still include mixed event field naming examples; canonical glossary publication is pending.
- `GAPI-RISK-002 (Low)`: Error envelope format for some pre-stream paths may vary in edge deployments unless a shared error schema is adopted.
- `GAPI-DECISION-OPEN-001`: Publish unified external event payload examples aligned to schema pack to remove naming ambiguity entirely.

## Source Basis

- Human-readable architecture docs: `/home/hex/Reference/the-architecture/docs`
- AI primer docs: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Existing blueprints context: `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway.md`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 16 total (`13 MUST`, `2 SHOULD`, `1 MAY`)
- Interfaces with schemas: 6 (`message_request`, `conversation_list_response`, `conversation_detail_response`, `approval_decision_request`, `approval_decision_response`, `stream_event`)
- Test vectors count: 26 total (`13 positive`, `13 negative`)
- Conflicts detected/resolved: 3/3 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: event-field naming examples still differ between some human and primer documents.
- Final readiness rating: Conditionally Ready
