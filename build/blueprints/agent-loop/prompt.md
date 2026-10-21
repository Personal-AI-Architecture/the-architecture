# Implement Agent Loop (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Agent Loop** component in a target language.

---

You are a senior software engineer implementing a production-ready component.

## Mission

Implement the **Agent Loop** component in **{{TARGET_LANGUAGE}}** so it is architecture-aligned, contract-faithful, and drift-resistant.

## Primary Inputs

- `build/blueprints/agent-loop/blueprint.md`
- `build/blueprints/gateway/blueprint.md`
- `build/blueprints/gateway-api/blueprint.md`
- `build/blueprints/agent-loop/contract-pack.json` (derived source manifest; canonical shapes remain under `contracts/`)
- `build/blueprints/agent-loop/tests.md`
- `build/blueprints/agent-loop/drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `build/primers/agent-loop.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/compliance-matrix.md`
- `maintainers/traceability-map.md`
- `conformance/review-checklists/agent-loop-review.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `architecture/agent-loop-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `architecture/overview.md`
- `architecture/models-spec.md`
- `architecture/tools-spec.md`
- `architecture/security-spec.md`
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

## Required Agent Loop Capabilities

Implement these behaviors:
- Accept internal bounded Gateway -> Agent Loop requests (`messages` + the model + `metadata`).
- Run model-tool loop until model signals completion.
- Invoke the model named in each request through the adapter boundary only, so a changed model choice applies to the next request with no restart.
- Put the bootstrap prompt from Agent Loop configuration first when calling the model; the request carries no system message.
- Ask Auth before each tool call; do not run a refused call, and return a "not permitted" `tool-result` error.
- Execute permitted model-requested tools via tool executor/runtime.
- Re-inject tool outputs into model context for continuation turns.
- Emit stream events with contract-visible semantics.
- Emit classified mid-stream errors: `provider_error`, `tool_error`, `context_overflow`.
- Preserve assistant text across tool-continuation turns.
- Mark tools Auth does not permit when advertising tool definitions to the model.
- Where the owner's Auth rules require approval, support approval interaction semantics as contract-visible events. Require no approval by default.

## Canonical Internal Contract Rules

### Input request (`POST /agent-loop/chat` contract shape)
- Required:
  - `messages` (conversation history including tool calls and tool results, plus the current message; content as a list of parts)
  - `model` (the owner's current model choice)
  - `metadata.correlation_id`
- Optional:
  - `metadata.conversation_id`
  - `metadata.trigger`
  - `metadata.client_context`
- Forbidden in request:
  - provider config
  - tool definitions
  - a system message built by the Gateway (the bootstrap prompt is Agent Loop configuration)
  - secret/config side channels

### Output stream events
- Core event types:
  - `text-delta`
  - `tool-call`
  - `tool-result`
  - `done`
  - `error`
- Contract-visible approval extensions (only in products that add approval prompts):
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
   - Where approval rules apply, keep approval request/result contract-visible in stream. The architecture default is no approval step.
3. Loop completion:
   - Agent Loop must continue until model completion signal unless an explicit configured safety bound triggers classified termination.
4. Parallelism:
   - If parallel tool execution is not implemented initially, preserve deterministic sequential correctness and document deviation in `conflict_register.md` with a planned compatibility path.

## Non-Negotiable Constraints

- Do not implement conversation persistence inside Agent Loop.
- Do not embed product-specific prompt/workflow logic into Agent Loop.
- Do not place provider-specific wire formatting in core loop logic (adapters own this).
- Do not bypass Auth boundary ownership for permission decisions; ask Auth before every tool call.
- Do not fix the model at startup.
- Do not collapse all failures into `provider_error`.
- Do not expose raw internal exceptions, stack traces, paths, or secrets in stream errors.
- Do not treat request metadata as runtime reconfiguration input.

## Required Tests (Minimum)

Implement automated tests that prove:

1. Loop remains generic (no product-owned behavior dependencies).
2. Agent Loop handles request with bounded contract fields only.
3. Assistant text is preserved during tool-continuation turns.
4. `done` is emitted when model signals completion.
5. Recoverable tool errors produce `tool-result` and allow continuation.
6. Unrecoverable tool failures emit `tool_error` and terminate.
7. Provider/runtime failures map to safe classified error events.
8. Every tool call is checked with Auth first; a refused call does not run and returns a "not permitted" tool result, and the loop continues.
9. Where the owner's Auth rules require approval, the tool call produces `approval-request` and `approval-result`; with no rules, no approval is requested.
10. Denied approvals produce denied tool result and loop continues correctly.
11. Duplicate repeated tool-call guard behavior (if present) is deterministic and non-fatal.
12. Mutation-scope/destructive overlap guard behavior (if present) is deterministic and non-fatal.
13. Changing the model between two requests changes the model used, with no restart.
14. The bootstrap prompt comes from Agent Loop configuration, not from the request.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Agent Loop stores/manages conversation truth.
- Provider-specific request shaping appears in core loop.
- Stream emits off-contract event names or payload classes.
- Mid-stream errors are unclassified or taxonomy-collapsed.
- Unsafe raw error text reaches client-visible stream.
- Approval semantics are trapped in client-only UI flow.
- A tool call runs without an Auth check.
- A model change needs a restart.
- Request payload can smuggle provider/tool/runtime config through metadata.

## Deliverables

1. Agent Loop implementation code in `{{TARGET_LANGUAGE}}`.
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
