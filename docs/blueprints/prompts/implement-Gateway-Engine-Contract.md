# Implement Gateway-Engine Contract (AI Coding Prompt)

Use this prompt with a coding AI to implement and validate the **Gateway-Engine internal contract boundary** in a target language.

---

You are a senior software engineer implementing a production-ready internal contract.

## Mission

Implement the **Gateway-Engine internal handoff contract** in **{{TARGET_LANGUAGE}}** so it is architecture-aligned, contract-faithful, and drift-resistant.

Important: This is an internal contract between Gateway and Engine. It is not a third external API.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway-Engine-Contract.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Engine.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Gateway-Engine-Contract.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Gateway-Engine-Contract-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Gateway-Engine-Contract-drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/gateway-engine-contract.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/client-gateway-contract.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/engine-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/security-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/gateway-review.md`

## Human Architecture Inputs (Authoritative for ownership/boundaries)

- `/home/hex/Reference/the-architecture/docs/gateway-engine-contract.md`
- `/home/hex/Reference/the-architecture/docs/gateway-spec.md`
- `/home/hex/Reference/the-architecture/docs/engine-spec.md`
- `/home/hex/Reference/the-architecture/docs/auth-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership and boundary authority.
2. AI primer/docs: concrete MVP contract shape and audit alignment.
3. Existing code: evidence only.

If conflicts appear, do not guess silently. Create `conflict_register.md` and resolve each conflict explicitly.

## Required Contract Capabilities

Implement these behaviors:
- Keep one bounded internal handoff request shape (`messages + metadata`).
- Require `metadata.correlation_id` for every request.
- Reject request-time provider/tool/runtime configuration leakage.
- Ensure Auth is on the path before Engine execution.
- Emit canonical stream events for in-progress and terminal interaction states.
- Enforce error taxonomy (`provider_error`, `tool_error`, `context_overflow`).
- Keep stream error messages safe and sanitized.
- Preserve tool-call/tool-result ID continuity.
- Emit completion with stable reconciliation IDs (`conversation_id`, `message_id`).
- Keep approval semantics contract-visible where required.
- Preserve Gateway/Engine independent replaceability as long as contract holds.

## Canonical Contract Rules

### Request (`POST /engine/chat`)
- Required:
  - `messages[]`
  - `metadata.correlation_id`
- Optional:
  - `metadata.conversation_id`
  - `metadata.trigger`
  - `metadata.client_context`
- Forbidden:
  - `provider`
  - `provider_adapter`
  - `model`
  - `base_url`
  - `api_key` / `api_key_env`
  - per-request `tools` / `tool_sources`

### Stream events
- Canonical event set:
  - `text-delta`
  - `tool-call`
  - `tool-result`
  - `approval-request`
  - `approval-result`
  - `done`
  - `error`

### Error rules
- Pre-stream failures: HTTP error response path.
- Mid-stream failures: SSE `error` event path.
- Mid-stream `error.code` must be one of:
  - `provider_error`
  - `tool_error`
  - `context_overflow`
- Error messages must be safe for client display.

## Tie-Break Rules for Known Discrepancies

Use these for MVP implementation consistency:

1. Event payload naming in this repo uses `text-delta.delta` and `tool-call.input`.
2. Completion reconciliation requires `done.conversation_id` and `done.message_id`.
3. Approval semantics must be represented through contract interaction flow (not CLI-only flow).
4. If historical docs show narrower core event lists, preserve current contract-visible approval events for matrix alignment.

## Non-Negotiable Constraints

- Do not expose this internal contract as a third external API.
- Do not allow request payloads to become hidden config channels.
- Do not bypass Auth on protected Gateway -> Engine paths.
- Do not emit off-contract event names or malformed event payloads.
- Do not collapse all mid-stream errors to one code.
- Do not leak stack traces, filesystem paths, provider internals, or secrets in stream-visible errors.

## Required Tests (Minimum)

Implement automated tests proving:

1. Request shape remains bounded to `messages + metadata`.
2. Missing `metadata.correlation_id` is rejected.
3. Hidden provider/tool/runtime config fields are rejected.
4. Auth is required before Engine execution.
5. Stream emits canonical event types only.
6. Error taxonomy is enforced.
7. Error messages are sanitized.
8. Pre-stream vs mid-stream error channels are correct.
9. Tool-call/result ID continuity holds.
10. `done` includes stable reconciliation IDs.
11. Approval semantics are contract-visible where required.
12. Internal contract is not exposed as external API.
13. Gateway and Engine remain independently swappable with contract compatibility.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Request accepts provider/tool/runtime configuration fields.
- Auth bypass path exists.
- Off-contract event taxonomy is emitted.
- Error taxonomy collapses or unsafe error text leaks.
- `done` event omits reconciliation IDs.
- Approval semantics are trapped in local UI flow.
- Gateway/Engine changes require cross-component rewrites despite contract compatibility.
- Internal handoff is published as public/external API.

## Deliverables

1. Gateway-Engine contract implementation/wiring in `{{TARGET_LANGUAGE}}`.
2. Automated conformance test suite.
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
- all MUST-level internal contract requirements pass
- all required tests pass
- all drift-critical checks pass
- no unresolved conflicts remain
- reports are complete
