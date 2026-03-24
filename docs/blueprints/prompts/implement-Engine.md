# Implement Engine (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Engine** component in a target language.

---

You are a senior software engineer implementing a production-ready component.

## Mission

Implement the **Engine (Agent Loop)** component in **{{TARGET_LANGUAGE}}** so it is architecture-aligned, contract-faithful, and drift-resistant.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Engine.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway-API.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Engine.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Engine-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Engine-drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/engine.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/gateway-engine-contract.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/engine-review.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `/home/hex/Reference/the-architecture/docs/engine-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-engine-contract.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`
- `/home/hex/Reference/the-architecture/docs/models-spec.md`
- `/home/hex/Reference/the-architecture/docs/tools-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`
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

## Required Engine Capabilities

Implement these behaviors:
- Accept internal bounded Gateway -> Engine requests (`messages + metadata`).
- Run model-tool loop until model signals completion.
- Invoke models through adapter boundary only.
- Execute model-requested tools via tool executor/runtime.
- Re-inject tool outputs into model context for continuation turns.
- Emit stream events with contract-visible semantics.
- Emit classified mid-stream errors: `provider_error`, `tool_error`, `context_overflow`.
- Preserve assistant text across tool-continuation turns.
- Respect Auth-derived tool permission filtering.
- Support approval interaction semantics as contract-visible events where required.

## Canonical Internal Contract Rules

### Input request (`POST /engine/chat` contract shape)
- Required:
  - `messages`
  - `metadata.correlation_id`
- Optional:
  - `metadata.conversation_id`
  - `metadata.trigger`
  - `metadata.client_context`
- Forbidden in request:
  - provider config
  - tool definitions
  - secret/config side channels

### Output stream events
- Core event types:
  - `text-delta`
  - `tool-call`
  - `tool-result`
  - `done`
  - `error`
- Contract-visible approval extensions (MVP implementation surface):
  - `approval-request`
  - `approval-result`

### Error rules
- Pre-stream failures handled as HTTP errors by caller boundary.
- Mid-stream failures emitted as `error` events with taxonomy:
  - `provider_error`
  - `tool_error`
  - `context_overflow`
- Client-visible error messages must be safe and sanitized.

## Tie-Break Rules for Known Discrepancies

Use these for MVP implementation consistency:

1. Event payload naming:
   - Use primer/runtime naming (`text-delta.delta`, `tool-call.input`) for MVP compatibility.
2. Approval visibility:
   - Keep approval request/result contract-visible in stream where required by matrix/compliance artifacts.
3. Loop completion:
   - Engine must continue until model completion signal unless an explicit configured safety bound triggers classified termination.
4. Parallelism:
   - If parallel tool execution is not implemented initially, preserve deterministic sequential correctness and document deviation in `conflict_register.md` with a planned compatibility path.

## Non-Negotiable Constraints

- Do not implement conversation persistence inside Engine.
- Do not embed product-specific prompt/workflow logic into Engine loop.
- Do not place provider-specific wire formatting in core loop logic (adapters own this).
- Do not bypass Auth boundary ownership for permission decisions.
- Do not collapse all failures into `provider_error`.
- Do not expose raw internal exceptions, stack traces, paths, or secrets in stream errors.
- Do not treat request metadata as runtime reconfiguration input.

## Required Tests (Minimum)

Implement automated tests that prove:

1. Loop remains generic (no product-owned behavior dependencies).
2. Engine handles request with bounded contract fields only.
3. Assistant text is preserved during tool-continuation turns.
4. `done` is emitted when model signals completion.
5. Recoverable tool errors produce `tool-result` and allow continuation.
6. Unrecoverable tool failures emit `tool_error` and terminate.
7. Provider/runtime failures map to safe classified error events.
8. Tool permissions are filtered by Auth context before model tool advertisement.
9. Approval-required tool calls produce `approval-request` and `approval-result`.
10. Denied approvals produce denied tool result and loop continues correctly.
11. Duplicate repeated tool-call guard behavior (if present) is deterministic and non-fatal.
12. Mutation-scope/destructive overlap guard behavior (if present) is deterministic and non-fatal.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Engine stores/manages conversation truth.
- Provider-specific request shaping appears in core loop.
- Stream emits off-contract event names or payload classes.
- Mid-stream errors are unclassified or taxonomy-collapsed.
- Unsafe raw error text reaches client-visible stream.
- Approval semantics are trapped in client-only UI flow.
- Request payload can smuggle provider/tool/runtime config through metadata.

## Deliverables

1. Engine implementation code in `{{TARGET_LANGUAGE}}`.
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
