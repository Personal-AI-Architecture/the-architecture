# Gateway Component Blueprint Specification

## 1. Overview

### Purpose
The Gateway is the system's external interaction boundary. It accepts client requests, manages conversation lifecycle, and routes bounded interaction payloads to the Agent Loop through the internal Gateway-Engine contract.

### High-Level Responsibilities
- Expose the client-facing API for messaging, conversation retrieval, and approval decisions.
- Own conversation lifecycle: create, append, list, and fetch conversation detail.
- Normalize client input into internal `messages + metadata` handoff.
- Stream Engine output events back to clients as server-sent events (SSE).
- Persist conversation state in Memory through an approved conversation-store boundary.
- Ensure authentication is enforced on protected routes via the Auth boundary.

### System Context
- Upstream: external clients (CLI, web, mobile, bots, future clients).
- Lateral dependencies: Auth boundary, Memory conversation-store boundary.
- Downstream: Agent Loop through internal `POST /engine/chat` contract.
- Position in architecture: front door component, content-agnostic transport and lifecycle manager.

### Companion Artifact
- Gateway API boundary specification: `blueprints/Gateway-API.md`

---

## 2. Scope Definition

### What the Gateway **is**
- A conversation and routing component.
- The owner of client contract surfaces.
- A contract translator between external client request shapes and internal Engine handoff shapes.
- A stream proxy that forwards contract-visible event semantics.

### What the Gateway **is not**
- Not the model selector.
- Not a model/tool execution engine.
- Not an authentication policy engine (it uses Auth; it does not own Auth policy semantics).
- Not a memory storage implementation.
- Not a content interpretation/filtering layer.
- Not a rate-limiting policy engine (it may expose extension points for this).

### Boundaries and Constraints
- Conversation data source of truth must be in Memory, not in process-local ephemeral maps.
- Gateway-to-Engine payload must remain bounded (`messages + metadata`) and must not carry runtime/provider/tool configuration.
- Client payloads must stay in client contract shape; clients must not fabricate internal Engine payloads.
- Approval interactions must be contract-visible (stream events + explicit decision endpoint), not hidden in client-local UI flow.

---

## 3. Core Concepts & Terminology

### External Concepts
- **Client Contract**: API shape between clients and Gateway.
- **Conversation ID**: stable identifier linking multi-turn interaction history.
- **SSE Stream**: event stream transport for incremental interaction outputs.

### Internal Concepts
- **Internal Contract**: bounded Gateway-to-Engine request/response contract.
- **Conversation Store Boundary**: dedicated memory access path for conversation operations.
- **Correlation ID**: per-request trace identifier propagated across components/logs.
- **Approval Interaction**: explicit request/decision/result flow for sensitive tool actions.

### Key Terms
- **Pre-stream error**: request rejected before SSE stream opens (HTTP error response).
- **Mid-stream error**: failure emitted as SSE `error` event during an active stream.
- **Contract-visible**: represented in real route payloads/events, not private control flow.
- **Drift**: implementation behavior that violates documented boundary/contract rules.

---

## 4. Interfaces & Contracts

### 4.1 External Client-Facing Interface (Conceptual)

#### `POST /message`
- Purpose: submit a new user message; create or continue a conversation.
- Request body:
  - `content` (required, non-empty string)
  - `metadata` (optional object; must remain client-context data, not config side-channel)
- Optional conversation continuation identifier:
  - Via request-scoped conversation identifier (implementation commonly uses `X-Conversation-ID` request header).
- Response:
  - HTTP 200 + SSE stream
  - Response header `X-Conversation-ID` once conversation is resolved
  - Stream events: `text-delta`, `tool-call`, `tool-result`, `approval-request`, `approval-result`, `done`, `error`

#### `GET /conversations`
- Purpose: list conversations.
- Query parameters: pagination (`limit`, `offset`) optional.
- Response envelope:
  - `conversations[]` summary records
  - `total`, `limit`, `offset`

#### `GET /conversations/:id`
- Purpose: fetch full conversation detail.
- Response envelope:
  - Conversation metadata
  - `messages[]` with stable message IDs, roles, content, timestamps

#### `POST /approvals/:request_id`
- Purpose: submit an approval decision for pending sensitive action.
- Request body:
  - `decision` in `{ approved, denied }`
- Response body:
  - `{ request_id, decision }`

#### `GET /health`
- Purpose: liveness probe.
- Typical behavior: unauthenticated health status response.

### 4.2 Internal Gateway-Engine Interface (Conceptual)

#### Request: `POST /engine/chat`
- Required:
  - `messages[]`
  - `metadata.correlation_id`
- Optional:
  - `metadata.conversation_id`
  - `metadata.trigger`
  - `metadata.client_context`
- `messages[]` assembly sources:
  - bootstrap/system message from configuration
  - conversation history from Memory via conversation-store boundary
  - current client message

#### Response: SSE events
- Canonical event classes:
  - `text-delta`
  - `tool-call`
  - `tool-result`
  - `done`
  - `error`
- Approval interaction extensions (runtime-visible in this system):
  - `approval-request`
  - `approval-result`

#### Error taxonomy (mid-stream)
- `provider_error`
- `tool_error`
- `context_overflow`

### 4.3 Abstract Data Structures

#### Client request
- `ClientMessageRequest`:
  - `content: string`
  - `metadata?: object`

#### Conversation message
- `ConversationMessage`:
  - `id: string`
  - `role: system | user | assistant | tool`
  - `content: string`
  - `timestamp: ISO-8601 string`

#### Gateway Engine request
- `GatewayEngineRequest`:
  - `messages: GatewayMessage[]`
  - `metadata: { correlation_id, conversation_id?, trigger?, client_context? }`

#### Stream event union
- `text-delta`
- `tool-call`
- `tool-result`
- `approval-request`
- `approval-result`
- `done`
- `error`

### 4.4 Communication Patterns
- Client request/response control plane: synchronous HTTP.
- Response data plane: asynchronous SSE.
- Approval decision handshake: split-phase interaction (stream emits request, client later posts decision).
- Memory operations: synchronous boundary calls for conversation persistence/retrieval.

---

## 5. Behavior Specification

### 5.1 Startup and Readiness
Gateway readiness depends on deterministic startup sequence:
1. Load runtime config.
2. Load adapter config.
3. Discover tools.
4. Mount/prepare Memory layout.
5. Ensure version-history readiness.
6. Load preferences.
7. Load/create auth state.
8. Load bootstrap prompt.
9. Become ready and accept client traffic.

### 5.2 Message Handling Workflow
1. Authenticate request (except health route if explicitly exempted).
2. Validate request shape against client contract schema.
3. Resolve target conversation:
  - create new if no conversation identifier supplied
  - verify existence if continuation requested
4. Persist incoming user message in conversation store.
5. Reconstruct Engine message array:
  - system prompt
  - stored history replay
  - current user message
6. Create internal metadata with new correlation ID and contextual data.
7. Open SSE response and emit stream events as Engine loop progresses.
8. Persist assistant/tool outputs while streaming.
9. Emit completion (`done`) with stable conversation/message identifiers.
10. Close stream.

### 5.3 Conversation Replay/State Reconstruction
- Stored conversations are replayed into model-compatible message order.
- Tool interaction continuity rules:
  - Preserve tool result payload content for future turns.
  - Preserve or infer assistant `tool_calls` metadata when missing in older transcripts.
  - Keep `tool_call_id` linkage stable across replay.

### 5.4 Approval Workflow
1. Engine emits `approval-request`.
2. Gateway forwards event to client stream.
3. Client submits `POST /approvals/:request_id` with decision.
4. Gateway validates approval authority via Auth context.
5. Gateway resolves pending approval record and returns decision payload.
6. Engine continues with approved or denied path.

### 5.5 State Management
- Durable state:
  - conversations and messages in Memory-backed conversation store
  - conversation index/metadata for listing/pagination
- Ephemeral per-request state:
  - assistant text buffer
  - pending tool-call metadata map
  - correlation context
- Ephemeral cross-request approval state:
  - pending approval map keyed by request ID

### 5.6 Edge Cases and Error Handling
- Invalid message/approval payload: HTTP 400, safe error body.
- Unknown conversation ID on message continue/detail fetch: HTTP 404.
- Missing approval authority: HTTP 403 on approval decision route.
- Unknown approval request ID: HTTP 404.
- Pre-stream failures: HTTP error response (e.g., 400/401/503 class behavior).
- Mid-stream failures: SSE `error` event using taxonomy (`provider_error`, `tool_error`, `context_overflow`), safe human-display message.
- Recoverable tool failures: remain `tool-result` errors, do not terminate stream.
- Unrecoverable tool/provider failures: emit `error` event and terminate stream.

---

## 6. Dependencies & Interactions

### Required Dependencies
- **Auth boundary**:
  - validates protected requests
  - provides actor identity + permissions context
- **Memory conversation-store boundary**:
  - create conversation
  - append message
  - list conversations
  - fetch conversation detail/history
- **Agent Loop boundary**:
  - consumes bounded internal request
  - returns stream events
- **Configuration subsystem**:
  - runtime config
  - adapter config
  - preferences
  - bootstrap prompt source

### Interaction Data Flow
1. Client -> Gateway: message + metadata.
2. Gateway -> Memory boundary: load/persist conversation.
3. Gateway -> Engine: bounded `messages + metadata`.
4. Engine -> Gateway: stream events.
5. Gateway -> Client: proxied SSE events.
6. Client -> Gateway: approval decisions.
7. Gateway -> Engine approval state: resolve pending approval.

### Dependency Assumptions
- Auth context is available before protected route handlers execute.
- Conversation store operations are durable and queryable.
- Internal Engine stream events follow contract event taxonomy.
- Tool/provider runtime configuration is loaded at startup, not request time.

---

## 7. Invariants & Rules

### Component Ownership Invariants
- Gateway always owns conversation lifecycle.
- Engine never owns conversation persistence.
- Memory remains the storage substrate; Gateway accesses it only through approved boundary.
- Auth remains an independent boundary on request path.

### Contract Invariants
- Client request shape remains external (`content`, optional `metadata`), never internal `messages`.
- Gateway-to-Engine request remains bounded; no provider secrets/config in metadata.
- Completion semantics remain contract-visible:
  - stream includes `done`
  - completion identifiers are externally reconcilable
- Approval semantics remain contract-visible (`approval-request`, `approval-result`, decision route).

### Validation Rules (Conceptual)
- Request schema validation for all mutable/public routes.
- Conversation ID existence checks for continuation/detail routes.
- Decision enum validation for approval submission.
- Auth permission check for approval authority.
- Metadata boundary checks to prevent hidden configuration channels.
- Safe error mapping for exposed responses/events.

---

## 8. Non-Functional Requirements

### Performance
- Stream-first response model to minimize perceived latency.
- Low-overhead message persistence and retrieval.
- Efficient paginated conversation listing.

### Scalability
- Must support multiple concurrent client conversations.
- Must remain client-agnostic (same behavior across UI channels).
- Internal contract must allow Gateway and Engine evolution independently.

### Reliability and Fault Tolerance
- Conversation writes must be durable.
- Startup must be deterministic; required readiness phases must complete before traffic.
- Conversation index/listing should be resilient to partial index corruption (rebuild path).
- Error behavior must distinguish pre-stream rejection vs mid-stream failure.

### Security
- Auth-protected routes must not be bypassable.
- Client-visible errors must be sanitized (no stack traces/paths/credentials).
- Gateway must support TLS at external boundary.
- Request size limits and abuse/rate-limit hooks must exist as extension points.
- Default deployment posture should be localhost-only unless explicitly changed.
- Structured audit logging should include correlation context for traceability.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **Boundary-oriented design**: separate route handling, conversation service, and boundary adapters.
- **Contract-first schemas**: define and enforce request/response/event schemas centrally.
- **Repository abstraction**: conversation persistence behind interface contract.
- **Event translation layer**: normalize/augment downstream stream events for client contract.
- **Deterministic startup pipeline**: explicit boot phases with fail-fast on required invariants.

### Design Considerations
- Use immutable IDs for conversations/messages/tool calls.
- Generate correlation IDs per request and propagate to logs/tool context.
- Preserve replay fidelity for tool-turn conversations (`tool_call_id`, call metadata, outputs).
- Keep approval state explicit and auditable.
- Keep metadata extensible but bounded by validation and allowlist rules.

### Anti-Patterns to Avoid
- Private in-process conversation state as source of truth.
- Letting clients submit internal Engine payload format directly.
- Recomputing provider/tool configuration from request payloads.
- Embedding Auth policy logic into Gateway handlers.
- Returning raw storage records or internal exception text directly to clients.
- Hiding approval logic purely in client UX without contract-visible events/routes.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `G-01/G-03/G-04`: Gateway owns conversation lifecycle and uses approved Memory boundary.
- `G-05`: Client request shape is external (`{ content, metadata? }`), not internal `messages`.
- `G-06`: Conversation list/detail use canonical response envelopes.
- `G-07`: Resolved conversation identifier is contract-visible; completion includes reconcilable IDs.
- `G-08`: Approval decisions use canonical explicit route and payload.
- `C-02/GC-01`: Internal handoff is bounded and must not carry hidden configuration.
- `A-01/GC-04`: Auth is on real request path.
- `GC-03/GC-05/S-01`: Mid-stream errors use classified taxonomy with safe messages.
- `GC-06/S-05`: Approval semantics remain contract-visible through stream + follow-up decision route.
- `D-03/D-06/D-07`: Localhost-first posture, deterministic startup readiness, persistent conversation surface from day one.

### Noted Primer-Implementation Tightening
- Current implementation narrows accepted client metadata to validated client-context shape (strict anti-side-channel posture). This is compatible with primer intent (`C-02`) and can be generalized with explicit allowlist governance if broader metadata is required.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Gateway is content-agnostic and interface-agnostic (`gateway-spec.md`).
- Gateway manages conversations and routes to Agent Loop; Engine remains loop owner (`gateway-spec.md`, `foundation-spec.md`).
- Auth is cross-cutting and independent (`gateway-spec.md`, `auth-spec.md`).
- Memory dependency direction is preserved; Gateway uses conversation-store boundary (`gateway-spec.md`, `memory-spec.md`).
- Internal contract remains single bounded interface (`gateway-engine-contract.md`).

### Documented Discrepancies To Reconcile
1. **Stream event payload naming**
   - Human contract examples use `text-delta.content` and `tool-call.arguments`.
   - Current primer/examples/implementation use `text-delta.delta` and `tool-call.input`.
2. **`done` payload shape**
   - Human internal contract emphasizes `finish_reason` + token usage.
   - Client contract and implementation require/emit `conversation_id` + `message_id` for state reconciliation.
3. **Approval event presence in internal stream**
   - Human internal contract event table does not list `approval-request`/`approval-result`.
   - AI primer and implementation treat approval events as contract-visible stream behavior.
4. **Resume identifier transport**
   - Human docs describe conversation ID as input conceptually.
   - Implementation operationalizes continuation via request-scoped conversation identifier header (commonly `X-Conversation-ID`).

### Rebuild Guidance When Sources Diverge
- Treat architectural ownership boundaries from human docs as authoritative.
- Treat client-facing concrete payload/event shapes from AI primer + examples as authoritative for MVP contract conformance.
- Preserve explicit discrepancy notes in engineering docs until unified canonical schema is published.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| GW-CF-001 | Human internal examples use `text-delta.content` / `tool-call.arguments`; primer/runtime use `text-delta.delta` / `tool-call.input` | Use primer/runtime naming for MVP external behavior | Matches active contract examples and client expectations | Event payload mismatch across clients and conformance tests |
| GW-CF-002 | Human internal contract emphasizes `done.finish_reason`; client contract requires `conversation_id` + `message_id` | Require `done.conversation_id` + `done.message_id` on client-facing stream; allow extra completion metadata | Reconciliation IDs are required for client state consistency | Clients cannot reliably reconcile terminal message state |
| GW-CF-003 | Human internal event table omits approval events; primer matrix requires contract-visible approval semantics | Keep `approval-request` and `approval-result` in stream contract | Aligns with `S-05` / `GC-06` contract visibility requirements | Approval behavior becomes UI-local and non-auditable |
| GW-CF-004 | Human docs describe continuation conceptually; implementation uses request-scoped header (`X-Conversation-ID`) | Preserve conceptual rule, standardize on request-scoped conversation identifier transport | Keeps contract client-agnostic while preserving practical interoperability | Resume behavior diverges across clients and implementations |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `GW-MUST-001`: Gateway MUST own conversation lifecycle operations (create, append, list, detail).
- `GW-MUST-002`: `POST /message` MUST accept only canonical external request shape `{ content, metadata? }`.
- `GW-MUST-003`: Clients MUST NOT submit internal Engine request fields (`messages`, provider/tool config fields).
- `GW-MUST-004`: Gateway->Engine payload MUST remain bounded to `messages + metadata`; metadata MUST NOT carry runtime/provider/tool configuration.
- `GW-MUST-005`: Gateway MUST enforce Auth on all protected routes.
- `GW-MUST-006`: Conversation endpoints MUST return canonical envelopes, not raw storage rows.
- `GW-MUST-007`: Stream response MUST include `X-Conversation-ID` once conversation is resolved.
- `GW-MUST-008`: Terminal `done` event MUST include `conversation_id` and `message_id`.
- `GW-MUST-009`: Approval decision endpoint MUST be canonical (`POST /approvals/:request_id` with `{ decision }` -> `{ request_id, decision }`).
- `GW-MUST-010`: Approval interactions MUST be contract-visible (`approval-request`, `approval-result`).
- `GW-MUST-011`: Mid-stream failures MUST emit classified error taxonomy (`provider_error`, `tool_error`, `context_overflow`).
- `GW-MUST-012`: Client-visible errors/events MUST be sanitized and safe.
- `GW-MUST-013`: Unknown conversation/approval identifiers MUST return safe not-found behavior.
- `GW-MUST-014`: Conversation state MUST be durable through Memory boundary access and MUST NOT rely on private in-process state.

### SHOULD

- `GW-SHOULD-001`: Gateway SHOULD propagate correlation ID across logs, Memory operations, and Engine handoff.
- `GW-SHOULD-002`: Conversation listing SHOULD support stable pagination semantics under concurrent writes.
- `GW-SHOULD-003`: Approval decision processing SHOULD be idempotent for retried client submissions.

### MAY

- `GW-MAY-001`: Gateway MAY provide extension points for rate limiting and abuse controls.
- `GW-MAY-002`: Gateway MAY support metadata allowlist expansion through governed schema/version updates.

## 14. Acceptance Gates (Pass/Fail)

- `GW-GATE-01 Contract Gate`: Pass if schema validation passes for request/response/event classes in `contracts/Gateway.schema.json`; fail otherwise.
- `GW-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Gateway-conformance.md` pass (14 positive + 14 negative); fail on any `GW-MUST-*` failure.
- `GW-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Gateway-drift-guard.md` pass; fail on any Critical check failure.
- `GW-GATE-04 Security Gate`: Pass if auth-bypass and unsafe-error tests are negative (no bypass/leak); fail if any bypass/leak path exists.
- `GW-GATE-05 Conflict Gate`: Pass if Conflict Register has no unresolved High-risk items; fail if unresolved High-risk conflict remains.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| GW-MUST-001 | Human `gateway-spec.md`; AI matrix `G-01` | `GW-T001P`, `GW-T001N` |
| GW-MUST-002 | AI `client-gateway-contract.md`; AI matrix `G-05` | `GW-T002P`, `GW-T002N` |
| GW-MUST-003 | AI `client-gateway-contract.md`; AI matrix `G-05` | `GW-T003P`, `GW-T003N` |
| GW-MUST-004 | Human `gateway-engine-contract.md`; AI matrix `GC-01`, `C-02` | `GW-T004P`, `GW-T004N` |
| GW-MUST-005 | Human `auth-spec.md`; AI matrix `A-01`, `GC-04` | `GW-T005P`, `GW-T005N` |
| GW-MUST-006 | AI `client-gateway-contract.md`; AI matrix `G-06` | `GW-T006P`, `GW-T006N` |
| GW-MUST-007 | AI `client-gateway-contract.md`; AI matrix `G-07` | `GW-T007P`, `GW-T007N` |
| GW-MUST-008 | AI `client-gateway-contract.md`; AI matrix `G-07` | `GW-T008P`, `GW-T008N` |
| GW-MUST-009 | AI `client-gateway-contract.md`; AI matrix `G-08` | `GW-T009P`, `GW-T009N` |
| GW-MUST-010 | AI `client-gateway-contract.md`; AI matrix `S-05`, `GC-06` | `GW-T010P`, `GW-T010N` |
| GW-MUST-011 | Human `gateway-engine-contract.md`; AI matrix `GC-03`, `GC-05` | `GW-T011P`, `GW-T011N` |
| GW-MUST-012 | Human `security-spec.md`; AI matrix `S-01` | `GW-T012P`, `GW-T012N` |
| GW-MUST-013 | AI `client-gateway-contract.md`; Human `gateway-spec.md` error output rules | `GW-T013P`, `GW-T013N` |
| GW-MUST-014 | Human `gateway-spec.md`, `memory-spec.md`; AI matrix `G-03`, `G-04` | `GW-T014P`, `GW-T014N` |

## 16. Residual Risks & Open Decisions

- `GW-RISK-001 (Medium)`: Human and primer documents still differ on some event payload field names; canonical schema publication is still needed to remove ambiguity.
- `GW-RISK-002 (Medium)`: Approval visibility requirements are aligned, but final cross-doc wording should be unified to avoid future regression.
- `GW-RISK-003 (Low)`: Resume identifier transport is conceptually defined but not fully standardized across all client SDKs.
- `GW-DECISION-OPEN-001`: Publish a single canonical event payload glossary for `Gateway API` and internal stream examples.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/gateway`
  - `/home/hex/Project/PAA-MVP-Prod/build/memory`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine`
  - `/home/hex/Project/PAA-MVP-Prod/build/test`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 7 (`client_message_request`, `conversation_list_response`, `conversation_detail_response`, `approval_decision_request`, `approval_decision_response`, `gateway_engine_request`, `stream_event`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 4/4 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: cross-doc event payload naming terminology is still not fully unified in source docs.
- Final readiness rating: Conditionally Ready
