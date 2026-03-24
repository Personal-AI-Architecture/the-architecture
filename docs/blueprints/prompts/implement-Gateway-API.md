# Implement Gateway API (AI Coding Prompt)

Use this prompt with a coding AI to implement and validate the **Gateway API boundary** in a target language.

---

You are a senior software engineer implementing a production-ready API boundary.

## Mission

Implement the **Gateway API contract** in **{{TARGET_LANGUAGE}}** so it is architecture-aligned, contract-faithful, and drift-resistant.

Important: Gateway API is an external contract boundary, not a standalone architecture component. Runtime ownership remains with the Gateway component.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway-API.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Engine.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Gateway-API.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Gateway-API-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Gateway-API-drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/client-gateway-contract.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/gateway-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/security-review.md`

## Human Architecture Inputs (Authoritative for boundary ownership)

- `/home/hex/Reference/the-architecture/docs/gateway-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-engine-contract.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`
- `/home/hex/Reference/the-architecture/docs/auth-spec.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership/boundary authority.
2. AI primer docs: concrete external API payload/event shapes and matrix conformance.
3. Existing implementation: evidence only.

If conflicts exist, do not guess silently. Create `conflict_register.md` and document:
- conflict ID
- sources in conflict
- chosen resolution
- rationale
- residual risk

## Required API Surface

Implement these endpoints:
- `GET /health`
- `POST /message`
- `GET /conversations`
- `GET /conversations/:id`
- `POST /approvals/:request_id`

## Canonical Gateway API Contract Rules

### `POST /message`
- Request body: `{ content, metadata? }`
- Reject any attempt to submit internal handoff fields directly (`messages`, provider config, tool config, runtime config-like fields).
- Response:
  - `text/event-stream`
  - include `X-Conversation-ID` once conversation is resolved

### Streaming events
- Contract-visible event set:
  - `text-delta`
  - `tool-call`
  - `tool-result`
  - `approval-request`
  - `approval-result`
  - `done`
  - `error`
- `done` must include `conversation_id` and `message_id`.
- Error events must include safe `code` and `message`.

### `GET /conversations`
- Response envelope must be canonical:
  - `conversations[]`
  - `total`
  - `limit`
  - `offset`

### `GET /conversations/:id`
- Response envelope must be canonical:
  - `id`, `title`, `created_at`, `updated_at`
  - `messages[]` (id, role, content, timestamp)

### `POST /approvals/:request_id`
- Request body: `{ decision }`
- Response body: `{ request_id, decision }`
- Must be auth-protected.

## Tie-Break Rules for Known Discrepancies

Use these for MVP implementation consistency:

1. External event payload naming:
   - `text-delta` uses `delta`
   - `tool-call` uses `input`
2. Approval interaction remains contract-visible in stream and decision route.
3. Completion reconciliation favors client-facing IDs in `done`.
4. No provider/tool runtime config fields are accepted in client request metadata.

## Non-Negotiable Constraints

- Do not treat Gateway API as a separate component with new ownership.
- Do not expose internal Gateway-Engine request format to clients.
- Do not create undocumented helper routes/payloads for approvals.
- Do not bypass Auth on protected routes.
- Do not leak raw storage records to client responses.
- Do not leak raw stack traces, file paths, credentials, or provider internals in client-visible errors/events.

## Required Tests (Minimum)

Implement automated contract tests that prove:

1. Auth is required on protected routes.
2. `POST /message` accepts canonical request shape and rejects internal-shape drift.
3. `POST /message` returns SSE with `X-Conversation-ID`.
4. Stream emits canonical event types.
5. `done` includes `conversation_id` and `message_id`.
6. `GET /conversations` returns canonical envelope.
7. `GET /conversations/:id` returns canonical envelope.
8. Unknown conversation ID returns safe 404.
9. Approval decision route enforces canonical request/response shape.
10. Unknown approval request ID returns safe 404.
11. Unsafe internal error text is never exposed in client-visible surfaces.
12. Metadata side-channel attempts for provider/tool config are rejected.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Client can submit internal Engine contract directly.
- Conversation endpoints leak raw storage/database shape.
- Approval semantics exist only in UI flow, not contract-visible API behavior.
- Event names/payloads drift from canonical contract.
- `done` omits stable reconciliation identifiers.
- Protected routes are reachable without Auth.
- Unsafe internal error details are exposed externally.

## Deliverables

1. Gateway API implementation code in `{{TARGET_LANGUAGE}}`.
2. Automated API contract test suite.
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
- all MUST-level API contract and boundary requirements pass
- all required tests pass
- all drift-critical checks pass
- no unresolved conflicts remain
- reports are complete
