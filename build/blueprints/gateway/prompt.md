# Implement Gateway (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Gateway** component in a target language.

---

You are a senior software engineer implementing a production-ready component.

## Mission

Implement the **Gateway** component in **{{TARGET_LANGUAGE}}** so it is architecture-aligned, contract-faithful, and drift-resistant.

## Primary Inputs

- `build/blueprints/gateway/blueprint.md`
- `build/blueprints/gateway-api/blueprint.md`
- `build/blueprints/gateway/contract-pack.json` (derived source manifest; canonical shapes remain under `contracts/`)
- `build/blueprints/gateway/tests.md`
- `build/blueprints/gateway/drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `build/primers/client-gateway-contract.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/compliance-matrix.md`
- `maintainers/traceability-map.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `architecture/gateway-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `architecture/overview.md`
- `architecture/security-spec.md`
- `architecture/memory-spec.md`
- `architecture/auth-spec.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership/boundary authority.
2. AI primer docs: concrete MVP contract/event shapes and matrix conformance.
3. Existing implementation: evidence only.

If conflicts exist, do not guess silently. Create `conflict_register.md` and document:
- conflict ID
- sources in conflict
- chosen resolution
- rationale
- residual risk

## Required Gateway Capabilities

Implement these routes:
- `GET /health`
- `POST /conversations/messages`
- `GET /conversations`
- `GET /conversations/:id`
- `POST /approvals/:request_id` (only if the product adds approval prompts)

Implement these behaviors:
- Gateway owns conversation lifecycle (create/append/list/detail).
- Gateway uses approved Memory conversation-store boundary (no private in-process source of truth).
- Gateway normalizes client request into internal `messages` + model + `metadata`, reading the owner's current model choice on every message (no restart to switch). No system message: the bootstrap prompt is Agent Loop configuration.
- Gateway saves tool calls and tool results as ordinary parts of messages in conversation history and sends them back on resume.
- Gateway streams Agent Loop events via SSE.
- Gateway calls Auth on every request to protected routes (all except explicit health checks), including list and history reads.
- Gateway returns `X-Conversation-ID` once conversation is resolved.
- `done` payload includes `conversation_id` and `message_id`.
- Where the product adds approvals, approval is contract-visible (`approval-request`, `approval-result`) and decision route is canonical. The architecture default is no approval step.
- Request metadata must not be a hidden config channel.
- Client-visible errors must be safe (no raw stack paths/secrets).

## Canonical External Contract Rules

### `POST /conversations/messages`
- Request body: `{ content, metadata? }`
- Reject client attempts to send internal contract fields (`messages`, provider config, tool config).

### Conversation endpoints
- `GET /conversations`: canonical envelope (`conversations`, `total`, `limit`, `offset`)
- `GET /conversations/:id`: canonical detail envelope (id/title/timestamps/messages)

### Approval decision endpoint (products that add approvals)
- `POST /approvals/:request_id`
- Request body: `{ decision }`
- Response body: `{ request_id, decision }`

### Stream events
- Event types expected by caller contract:
  - `text-delta`
  - `tool-call`
  - `tool-result`
  - `approval-request` (where approval rules apply)
  - `approval-result` (where approval rules apply)
  - `done`
  - `error`

## Tie-Break Rules for Known Discrepancies

Use these for MVP implementation consistency:

1. Prefer primer/client-contract event payload naming for external behavior:
   - `text-delta` uses `delta`
   - `tool-call` uses `input`
2. Where approval rules apply, keep approval events in stream as contract-visible interaction state.
3. Keep `done` externally reconcilable with `conversation_id` and `message_id`.
4. Keep internal handoff bounded; no provider/tool runtime config in request metadata.

## Non-Negotiable Constraints

- Do not move model/provider selection into Gateway: read the owner's current model choice and pass it on, never pick one.
- Do not fix the model at startup.
- Do not execute model-driven tools in Gateway (Gateway may use only conversation-store operational boundary).
- Do not bypass the Auth call on protected routes.
- Do not return raw storage/internal database shape directly to clients.
- Do not introduce undocumented helper routes for approvals.
- Do not leak unsafe internal exception text to clients.

## Required Tests (Minimum)

Implement automated tests that prove:

1. Every protected-route request is checked with Auth, including list and history reads.
2. Happy-path `POST /conversations/messages` returns stream + `X-Conversation-ID` + `done` identifiers.
3. Conversation is persisted and retrievable via canonical conversation endpoints.
4. Invalid request bodies fail safely with 400.
5. Metadata side-channel attempts (provider/tool config in request) are rejected.
6. Unknown conversation ID returns safe 404.
7. Approval decision endpoint enforces authority and handles not-found approval IDs.
8. Stream and error surfaces remain contract-safe (no unsafe internals).
9. Gateway only sends bounded `messages` + model + `metadata` to Agent Loop, with no system message.
10. Changing the model preference changes the model passed on the next message, with no restart.
11. Tool calls and tool results are in stored history and are replayed on resume.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Gateway stores conversation truth in route-local/in-memory-only structures.
- Client can submit internal Agent Loop payload directly.
- Approval flow (where the product adds it) works only in local client UI and is not contract-visible.
- Tool calls or tool results are dropped from stored history.
- Error taxonomy/event shapes drift from canonical contract.
- Unsafe raw error text reaches client-visible responses/events.
- Gateway owns provider/model selection or runtime provider config mutation.

## Deliverables

1. Gateway implementation code in `{{TARGET_LANGUAGE}}`.
2. Test suite covering all required tests above.
3. `implementation-report.md`:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md`:
   - pass/fail by contract rule
5. `drift-check-report.md`:
   - pass/fail by drift-critical condition
6. `conflict_register.md` (only if conflicts encountered)

## Final Response Format

Return:
1. Summary of implementation.
2. Files added/changed.
3. Requirement coverage (`MUST passed / total`).
4. Conformance summary.
5. Drift-check summary.
6. Residual risks and follow-up actions (if any).

## Definition of Done

Done only when:
- all MUST-level contract and boundary requirements pass
- all required tests pass
- all drift-critical checks pass
- no unresolved conflicts remain
- reports are complete
