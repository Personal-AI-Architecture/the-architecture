# Gateway Component Blueprint Specification

## 1. Overview

### Purpose
The Gateway is the system's external interaction boundary. It accepts client requests, manages conversation lifecycle, and routes bounded interaction payloads to the Agent Loop through the internal Gateway ↔ Agent Loop contract.

### High-Level Responsibilities
- Expose the client-facing API for messaging, conversation retrieval, and (in products that add approvals) approval decisions.
- Own conversation lifecycle: create, append, list, and fetch conversation detail, keeping tool calls, tool results and every content part.
- Normalize client input into internal `messages` + model + `metadata` handoff, reading the owner's current model choice on every message.
- Stream Agent Loop output events back to clients as server-sent events (SSE).
- Persist conversation state in Memory through an approved conversation-store boundary.
- Call Auth on every request, including list and history reads, before anything reaches the Agent Loop or conversation data.

### System Context
- Upstream: external clients (CLI, web, mobile, bots, future clients).
- Lateral dependencies: Auth boundary, Memory conversation-store boundary.
- Downstream: Agent Loop through internal `POST /agent-loop/chat` contract.
- Position in architecture: front door component, content-agnostic transport and lifecycle manager.

### Companion Artifact
- Gateway API boundary specification: `build/blueprints/gateway-api/blueprint.md`

---

## 2. Scope Definition

### What the Gateway **is**
- A conversation and routing component.
- The owner of client contract surfaces.
- A contract translator between external client request shapes and internal Agent Loop handoff shapes.
- A stream proxy that forwards contract-visible event semantics.

### What the Gateway **is not**
- Not the model selector (the owner chooses; the Gateway reads the current choice and passes it on).
- Not a model/tool execution engine.
- Not an authentication policy engine (it calls Auth through the Auth contract and honours the answer; it does not own Auth policy semantics).
- Not a memory storage implementation.
- Not a content interpretation/filtering layer.
- Not a rate-limiting policy engine (it may expose extension points for this).

### Boundaries and Constraints
- Conversation data source of truth must be in Memory, not in process-local ephemeral maps.
- Gateway-to-Agent-Loop payload must remain bounded (`messages` + model + `metadata`) and must not carry runtime/provider/tool configuration or a system message (the bootstrap prompt is Agent Loop configuration).
- Client payloads must stay in client contract shape; clients must not fabricate internal Agent Loop payloads.
- Where a product adds approvals, approval interactions must be contract-visible (stream events + explicit decision endpoint), not hidden in client-local UI flow. The architecture default is no approval step.

---

## 3. Core Concepts & Terminology

### External Concepts
- **Client Contract**: API shape between clients and Gateway.
- **Conversation ID**: stable identifier linking multi-turn interaction history.
- **SSE Stream**: event stream transport for incremental interaction outputs.

### Internal Concepts
- **Internal Contract**: bounded Gateway-to-Agent-Loop request/response contract.
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
  - `content` (required; a list of content parts, text first with room for images and files)
  - `metadata` (optional object; must remain client-context data, not config side-channel)
- Optional conversation continuation identifier:
  - Via request-scoped conversation identifier (implementation commonly uses `X-Conversation-ID` request header).
- Response:
  - HTTP 200 + SSE stream
  - Response header `X-Conversation-ID` once conversation is resolved
  - Stream events: `text-delta`, `tool-call`, `tool-result`, `done`, `error`, plus `approval-request` and `approval-result` where approval rules apply

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
  - `messages[]` with stable message IDs, roles, content parts, timestamps, and the tool calls and tool results inside them

#### `POST /approvals/:request_id` (products that add approvals)
- Purpose: submit an approval decision for a pending action the owner's Auth rules mark as needing approval.
- Request body:
  - `decision` in `{ approved, denied }`
- Response body:
  - `{ request_id, decision }`

#### `GET /health`
- Purpose: liveness probe.
- Typical behavior: unauthenticated health status response.

### 4.2 Internal Gateway ↔ Agent Loop Interface (Conceptual)

#### Request: `POST /agent-loop/chat`
- Required:
  - `messages[]`
  - the model to use (the owner's current choice, read on every message)
  - `metadata.correlation_id`
- Optional:
  - `metadata.conversation_id`
  - `metadata.trigger`
  - `metadata.client_context`
- `messages[]` assembly sources:
  - conversation history from Memory via conversation-store boundary, including tool calls and tool results
  - current client message
- No system message: the bootstrap prompt is Agent Loop configuration.

#### Response: SSE events
- Canonical event classes:
  - `text-delta`
  - `tool-call`
  - `tool-result`
  - `done`
  - `error`
- Approval interaction extensions (only where approval rules apply):
  - `approval-request`
  - `approval-result`

#### Error taxonomy (mid-stream)
- `provider_error`
- `tool_error`
- `context_overflow`

### 4.3 Abstract Data Structures

#### Client request
- `ClientMessageRequest`:
  - `content: ContentPart[]` (a string is the shorthand for one text part)
  - `metadata?: object`

#### Conversation message
- `ConversationMessage`:
  - `id: string`
  - `role: user | assistant | tool`
  - `content: ContentPart[]`, with tool calls and tool results as ordinary parts
  - `timestamp: ISO-8601 string`

#### Gateway Agent Loop request
- `GatewayEngineRequest`:
  - `messages: GatewayMessage[]`
  - model (the owner's current choice)
  - `metadata: { correlation_id, conversation_id?, trigger?, client_context? }` plus a request timestamp

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
- Approval decision handshake (where approval rules apply): split-phase interaction (stream emits request, client later posts decision).
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
7. Load/create auth state (Auth).
8. Agent Loop loads its bootstrap prompt from its own configuration.
9. Become ready and accept client traffic.

The model choice is not part of startup: the Gateway reads it on every message.

### 5.2 Message Handling Workflow
1. Call Auth for the request (except health route if explicitly exempted); reject with 401 if Auth refuses or can't be reached.
2. Validate request shape against client contract schema.
3. Resolve target conversation:
  - create new if no conversation identifier supplied
  - verify existence if continuation requested
4. Persist incoming user message in conversation store.
5. Reconstruct Agent Loop message array:
  - stored history replay, including tool calls and tool results
  - current user message
6. Read the owner's current model choice from preferences (through the Memory tools) and create internal metadata with new correlation ID, timestamp, and contextual data.
7. Open SSE response and emit stream events as Agent Loop progresses.
8. Persist assistant text, tool calls and tool results while streaming, as ordinary parts of messages.
9. Emit completion (`done`) with stable conversation/message identifiers.
10. Close stream.

### 5.3 Conversation Replay/State Reconstruction
- Stored conversations are replayed into model-compatible message order.
- Tool interaction continuity rules:
  - Preserve tool result payload content for future turns.
  - Preserve or infer assistant tool-call parts when missing in older transcripts.
  - Keep tool-result part linkage stable across replay.

### 5.4 Approval Workflow (products that add approvals)
Applies only where the owner's Auth rules require approval for a tool call. The architecture default is that the owner can do everything.
1. Agent Loop emits `approval-request`.
2. Gateway forwards event to client stream.
3. Client submits `POST /approvals/:request_id` with decision.
4. Gateway validates approval authority via Auth context.
5. Gateway resolves pending approval record and returns decision payload.
6. Agent Loop continues with approved or denied path.

### 5.5 State Management
- Durable state:
  - conversations and messages in Memory-backed conversation store
  - conversation index/metadata for listing/pagination
- Ephemeral per-request state:
  - assistant text buffer
  - pending tool-call metadata map
  - correlation context
- Ephemeral cross-request approval state (where approval rules apply):
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
- **Auth (through the Auth contract)**:
  - called on every request; authenticates and authorizes it
  - provides actor identity, which the Gateway attaches to the Agent Loop request
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
  - preferences (including the owner's model choice, read on every message)

### Interaction Data Flow
1. Client -> Gateway: message + metadata.
2. Gateway -> Memory boundary: load/persist conversation.
3. Gateway -> Auth: check the request. Gateway -> Agent Loop: bounded `messages` + model + `metadata`.
4. Agent Loop -> Gateway: stream events.
5. Gateway -> Client: proxied SSE events.
6. Client -> Gateway: approval decisions (where approval rules apply).
7. Gateway -> Agent Loop approval state: resolve pending approval.

### Dependency Assumptions
- The Gateway's Auth call completes before route handlers touch conversation data or the Agent Loop.
- Conversation store operations are durable and queryable.
- Internal Agent Loop stream events follow contract event taxonomy.
- Tool/provider runtime configuration is loaded at startup, not request time. The model choice is read per message.

---

## 7. Invariants & Rules

### Component Ownership Invariants
- Gateway always owns conversation lifecycle.
- Agent Loop never owns conversation persistence.
- Memory remains the storage substrate; Gateway accesses it only through approved boundary.
- Auth remains an independent component, called by the Gateway on every request.

### Contract Invariants
- Client request shape remains external (`content`, optional `metadata`), never internal `messages`.
- Gateway-to-Agent-Loop request remains bounded; no provider secrets/config in metadata; the model is passed on every request.
- One message shape across the Gateway API, internal contract and Model API; tool calls and tool results are kept in history.
- Completion semantics remain contract-visible:
  - stream includes `done`
  - completion identifiers are externally reconcilable
- Where approval rules apply, approval semantics remain contract-visible (`approval-request`, `approval-result`, decision route).

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
- Internal contract must allow Gateway and Agent Loop evolution independently.

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
- Letting clients submit internal Agent Loop payload format directly.
- Recomputing provider/tool configuration from request payloads.
- Embedding Auth policy logic into Gateway handlers.
- Returning raw storage records or internal exception text directly to clients.
- Hiding approval logic purely in client UX without contract-visible events/routes.

---

## 10. Validation Against AI Primer (`build/primers`)

### Confirmed Alignments
- `G-01/G-03/G-04`: Gateway owns conversation lifecycle and uses approved Memory boundary.
- `G-05`: Client request shape is external (`{ content, metadata? }`), not internal `messages`.
- `G-06`: Conversation list/detail use canonical response envelopes.
- `G-07`: Resolved conversation identifier is contract-visible; completion includes reconcilable IDs.
- `G-08`: Approval decisions, where a product adds them, use canonical explicit route and payload.
- `G-02`: The Gateway passes the owner's current model choice on every request and never picks one itself.
- `G-09/GC-07`: Tool calls and tool results are kept in conversation history in the shared message shape.
- `C-02/GC-01`: Internal handoff is bounded and must not carry hidden configuration.
- `A-01/GC-04`: The Gateway calls Auth on every request.
- `GC-03/GC-05/S-01`: Mid-stream errors use classified taxonomy with safe messages.
- `GC-06/S-05`: Where a product adds approvals, approval semantics remain contract-visible through stream + follow-up decision route.
- `D-03/D-06/D-07`: Localhost-first posture, deterministic startup readiness, persistent conversation surface from day one.

### Noted Primer-Implementation Tightening
- Current implementation narrows accepted client metadata to validated client-context shape (strict anti-side-channel posture). This is compatible with primer intent (`C-02`) and can be generalized with explicit allowlist governance if broader metadata is required.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Gateway is content-agnostic and interface-agnostic (`gateway-spec.md`).
- Gateway manages conversations and routes to Agent Loop; Agent Loop remains loop owner (`gateway-spec.md`, `overview.md`).
- Auth is independent and called by the Gateway on every request (`gateway-spec.md`, `auth-spec.md`).
- Memory dependency direction is preserved; Gateway uses conversation-store boundary (`gateway-spec.md`, `memory-spec.md`).
- Internal contract remains single bounded interface (`gateway-agent-loop-contract.md`).

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
| GW-CF-003 | Human internal event table omits approval events; primer matrix requires contract-visible approval semantics | Keep `approval-request` and `approval-result` in stream contract for products that add approvals | Aligns with `S-05` / `GC-06` contract visibility requirements; approval is a product choice | Approval behavior becomes UI-local and non-auditable |
| GW-CF-005 | Older layers have the Gateway build the system message from config, store only user/assistant text, and treat the model as startup config; human specs make the bootstrap prompt Agent Loop config, keep tool calls in history, and pass the model per request | Follow the human specs | Faithful replay and no-restart model switching | Lossy history and restart-to-switch drift |
| GW-CF-004 | Human docs describe continuation conceptually; implementation uses request-scoped header (`X-Conversation-ID`) | Preserve conceptual rule, standardize on request-scoped conversation identifier transport | Keeps contract client-agnostic while preserving practical interoperability | Resume behavior diverges across clients and implementations |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `GW-MUST-001`: Gateway MUST own conversation lifecycle operations (create, append, list, detail).
- `GW-MUST-002`: `POST /message` MUST accept only canonical external request shape `{ content, metadata? }`.
- `GW-MUST-003`: Clients MUST NOT submit internal Agent Loop request fields (`messages`, provider/tool config fields).
- `GW-MUST-004`: Gateway->Agent Loop payload MUST remain bounded to `messages` + model + `metadata`; metadata MUST NOT carry runtime/provider/tool configuration, and the request MUST NOT carry a system message.
- `GW-MUST-005`: Gateway MUST call Auth on every request to a protected route (every route except an explicitly exempted health check), including list and history reads, before anything reaches the Agent Loop or conversation data.
- `GW-MUST-006`: Conversation endpoints MUST return canonical envelopes, not raw storage rows.
- `GW-MUST-007`: Stream response MUST include `X-Conversation-ID` once conversation is resolved.
- `GW-MUST-008`: Terminal `done` event MUST include `conversation_id` and `message_id`.
- `GW-MUST-009`: Where a product adds approvals, the approval decision endpoint MUST be canonical (`POST /approvals/:request_id` with `{ decision }` -> `{ request_id, decision }`).
- `GW-MUST-010`: Where approval rules apply, approval interactions MUST be contract-visible (`approval-request`, `approval-result`).
- `GW-MUST-011`: Mid-stream failures MUST emit classified error taxonomy (`provider_error`, `tool_error`, `context_overflow`).
- `GW-MUST-012`: Client-visible errors/events MUST be sanitized and safe.
- `GW-MUST-013`: Unknown conversation/approval identifiers MUST return safe not-found behavior.
- `GW-MUST-014`: Conversation state MUST be durable through Memory boundary access and MUST NOT rely on private in-process state.
- `GW-MUST-015`: Gateway MUST read the owner's current model choice on every message and pass it to the Agent Loop, so a changed choice applies to the next message with no restart.
- `GW-MUST-016`: Gateway MUST save tool calls and tool results as ordinary parts of messages in conversation history, and send them back to the Agent Loop on resume.

### SHOULD

- `GW-SHOULD-001`: Gateway SHOULD propagate correlation ID across logs, Memory operations, and Agent Loop handoff.
- `GW-SHOULD-002`: Conversation listing SHOULD support stable pagination semantics under concurrent writes.
- `GW-SHOULD-003`: Approval decision processing SHOULD be idempotent for retried client submissions.

### MAY

- `GW-MAY-001`: Gateway MAY provide extension points for rate limiting and abuse controls.
- `GW-MAY-002`: Gateway MAY support metadata allowlist expansion through governed schema/version updates.

## 14. Acceptance Gates (Pass/Fail)

- `GW-GATE-01 Contract Gate`: Pass if schema validation passes for request/response/event classes in `build/blueprints/gateway/contract-pack.json`; fail otherwise.
- `GW-GATE-02 Conformance Gate`: Pass if all vectors in `build/blueprints/gateway/tests.md` pass (16 positive + 16 negative); fail on any `GW-MUST-*` failure.
- `GW-GATE-03 Drift Gate`: Pass if all Critical checks in `build/blueprints/gateway/drift-guard.md` pass; fail on any Critical check failure.
- `GW-GATE-04 Security Gate`: Pass if auth-bypass and unsafe-error tests are negative (no bypass/leak); fail if any bypass/leak path exists.
- `GW-GATE-05 Conflict Gate`: Pass if Conflict Register has no unresolved High-risk items; fail if unresolved High-risk conflict remains.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| GW-MUST-001 | Human `gateway-spec.md`; AI matrix `G-01` | `GW-T001P`, `GW-T001N` |
| GW-MUST-002 | AI `client-gateway-contract.md`; AI matrix `G-05` | `GW-T002P`, `GW-T002N` |
| GW-MUST-003 | AI `client-gateway-contract.md`; AI matrix `G-05` | `GW-T003P`, `GW-T003N` |
| GW-MUST-004 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-01`, `C-02` | `GW-T004P`, `GW-T004N` |
| GW-MUST-005 | Human `auth-spec.md`; AI matrix `A-01`, `GC-04` | `GW-T005P`, `GW-T005N` |
| GW-MUST-006 | AI `client-gateway-contract.md`; AI matrix `G-06` | `GW-T006P`, `GW-T006N` |
| GW-MUST-007 | AI `client-gateway-contract.md`; AI matrix `G-07` | `GW-T007P`, `GW-T007N` |
| GW-MUST-008 | AI `client-gateway-contract.md`; AI matrix `G-07` | `GW-T008P`, `GW-T008N` |
| GW-MUST-009 | AI `client-gateway-contract.md`; AI matrix `G-08` | `GW-T009P`, `GW-T009N` |
| GW-MUST-010 | AI `client-gateway-contract.md`; AI matrix `S-05`, `GC-06` | `GW-T010P`, `GW-T010N` |
| GW-MUST-011 | Human `gateway-agent-loop-contract.md`; AI matrix `GC-03`, `GC-05` | `GW-T011P`, `GW-T011N` |
| GW-MUST-012 | Human `security-spec.md`; AI matrix `S-01` | `GW-T012P`, `GW-T012N` |
| GW-MUST-013 | AI `client-gateway-contract.md`; Human `gateway-spec.md` error output rules | `GW-T013P`, `GW-T013N` |
| GW-MUST-014 | Human `gateway-spec.md`, `memory-spec.md`; AI matrix `G-03`, `G-04` | `GW-T014P`, `GW-T014N` |
| GW-MUST-015 | Human `gateway-spec.md`, `configuration-spec.md`; AI matrix `G-02`, `MO-02` | `GW-T015P`, `GW-T015N` |
| GW-MUST-016 | Human `gateway-spec.md`, `gateway-agent-loop-contract.md`; AI matrix `G-09`, `GC-07` | `GW-T016P`, `GW-T016N` |

## 16. Residual Risks & Open Decisions

- `GW-RISK-001 (Medium)`: Products that add approvals still need an explicit lifecycle decision; the canonical base stream remains the published event set under `contracts/`.
- `GW-RISK-002 (Medium)`: Approval visibility requirements (for products that add approvals) are aligned, but final cross-doc wording should be unified to avoid future regression.
- `GW-RISK-003 (Low)`: Resume identifier transport is conceptually defined but not fully standardized across all client SDKs.
- `GW-DECISION-OPEN-001`: Publish a single canonical event payload glossary for `Gateway API` and internal stream examples.

## Source Basis

- Human-readable architecture reference: `architecture`
- AI primer layer: ` ai`
- Implementation behavior used for blueprint fidelity:
  - `build/gateway`
  - `build/memory`
  - `build/engine`
  - `build/test`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 21 total (`16 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 7 (`client_message_request`, `conversation_list_response`, `conversation_detail_response`, `approval_decision_request`, `approval_decision_response`, `gateway_engine_request`, `stream_event`)
- Test vectors count: 32 total (`16 positive`, `16 negative`)
- Conflicts detected/resolved: 5/5 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: cross-doc event payload naming terminology is still not fully unified in source docs.
- Final readiness rating: Conditionally Ready

## Contract Alignment

The canonical contracts define structured message content parts, preserve tool-call and
tool-result continuity, and require the Gateway/Auth boundary described by the API and
Agent Loop contracts. The adjacent `contract-pack.json` is a derived source manifest;
it does not override files under `contracts/`.
