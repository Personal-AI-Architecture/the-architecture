# Implement Gateway (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Gateway** component in a target language.

---

You are a senior software engineer implementing a production-ready component.

## Mission

Implement the **Gateway** component in **{{TARGET_LANGUAGE}}** so it is architecture-aligned, contract-faithful, and drift-resistant.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway-API.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Gateway.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Gateway-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Gateway-drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/client-gateway-contract.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/gateway-engine-contract.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `/home/hex/Reference/the-architecture/docs/gateway-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-engine-contract.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`
- `/home/hex/Reference/the-architecture/docs/memory-spec.md`
- `/home/hex/Reference/the-architecture/docs/auth-spec.md`

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
- `POST /message`
- `GET /conversations`
- `GET /conversations/:id`
- `POST /approvals/:request_id`

Implement these behaviors:
- Gateway owns conversation lifecycle (create/append/list/detail).
- Gateway uses approved Memory conversation-store boundary (no private in-process source of truth).
- Gateway normalizes client request into internal `messages + metadata`.
- Gateway streams Engine events via SSE.
- Gateway enforces Auth on protected routes (all except explicit health checks).
- Gateway returns `X-Conversation-ID` once conversation is resolved.
- `done` payload includes `conversation_id` and `message_id`.
- Approval is contract-visible (`approval-request`, `approval-result`) and decision route is canonical.
- Request metadata must not be a hidden config channel.
- Client-visible errors must be safe (no raw stack paths/secrets).

## Canonical External Contract Rules

### `POST /message`
- Request body: `{ content, metadata? }`
- Reject client attempts to send internal contract fields (`messages`, provider config, tool config).

### Conversation endpoints
- `GET /conversations`: canonical envelope (`conversations`, `total`, `limit`, `offset`)
- `GET /conversations/:id`: canonical detail envelope (id/title/timestamps/messages)

### Approval decision endpoint
- `POST /approvals/:request_id`
- Request body: `{ decision }`
- Response body: `{ request_id, decision }`

### Stream events
- Event types expected by caller contract:
  - `text-delta`
  - `tool-call`
  - `tool-result`
  - `approval-request`
  - `approval-result`
  - `done`
  - `error`

## Tie-Break Rules for Known Discrepancies

Use these for MVP implementation consistency:

1. Prefer primer/client-contract event payload naming for external behavior:
   - `text-delta` uses `delta`
   - `tool-call` uses `input`
2. Keep approval events in stream as contract-visible interaction state.
3. Keep `done` externally reconcilable with `conversation_id` and `message_id`.
4. Keep internal handoff bounded; no provider/tool runtime config in request metadata.

## Non-Negotiable Constraints

- Do not move model/provider selection into Gateway.
- Do not execute model-driven tools in Gateway (Gateway may use only conversation-store operational boundary).
- Do not bypass Auth boundary on protected routes.
- Do not return raw storage/internal database shape directly to clients.
- Do not introduce undocumented helper routes for approvals.
- Do not leak unsafe internal exception text to clients.

## Required Tests (Minimum)

Implement automated tests that prove:

1. Protected routes require Auth.
2. Happy-path `POST /message` returns stream + `X-Conversation-ID` + `done` identifiers.
3. Conversation is persisted and retrievable via canonical conversation endpoints.
4. Invalid request bodies fail safely with 400.
5. Metadata side-channel attempts (provider/tool config in request) are rejected.
6. Unknown conversation ID returns safe 404.
7. Approval decision endpoint enforces authority and handles not-found approval IDs.
8. Stream and error surfaces remain contract-safe (no unsafe internals).
9. Gateway only sends bounded `messages + metadata` to Engine.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Gateway stores conversation truth in route-local/in-memory-only structures.
- Client can submit internal Engine payload directly.
- Approval flow works only in local client UI and is not contract-visible.
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
