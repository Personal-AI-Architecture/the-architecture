# Implement Model API (AI Coding Prompt)

Use this prompt with a coding AI to implement and validate the **Model API boundary** in a target language.

---

You are a senior software engineer implementing a production-ready API boundary.

## Mission

Implement the **Model API boundary** in **{{TARGET_LANGUAGE}}** so it is architecture-aligned, contract-faithful, and drift-resistant.

Important: Model API is an external API boundary, not a standalone architecture component.

## Primary Inputs

- `build/blueprints/model-api/blueprint.md`
- `build/blueprints/agent-loop/blueprint.md`
- `build/blueprints/model-api/contract-pack.json` (derived source manifest; canonical shapes remain under `contracts/`)
- `build/blueprints/model-api/tests.md`
- `build/blueprints/model-api/drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `build/primers/models.md`
- `build/primers/configuration.md`
- `build/compliance-matrix.md`
- `maintainers/traceability-map.md`
- `conformance/review-checklists/configuration-review.md`
- `conformance/review-checklists/agent-loop-review.md`

## Human Architecture Inputs (Authoritative for boundary ownership)

- `architecture/models-spec.md`
- `architecture/adapter-spec.md`
- `architecture/overview.md`
- `architecture/configuration-spec.md`
- `architecture/security-spec.md`
- `architecture/deployment-spec.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership/boundary authority.
2. AI primer docs: concrete MVP contract shape and audit alignment.
3. Existing implementation: evidence only.

If conflicts exist, do not guess silently. Create `conflict_register.md` and document:
- conflict ID
- sources in conflict
- chosen resolution
- rationale
- residual risk

## Required Model API Capabilities

Implement these behaviors:
- Keep models external and reachable only through Model API adapter boundary.
- Accept generic completion requests (`messages + tools` plus the model for this call) and return normalized completion responses.
- Name the model that came with the request in each call, so a changed choice applies to the next message with no restart.
- Use the shared message shape: content as a list of parts, tool calls and tool results as message parts.
- Isolate provider-specific wire translation inside adapters.
- Keep runtime config, adapter config, and preferences as distinct layers.
- Support same-provider model swaps via preference/model-binding change only.
- Support provider swaps via adapter/runtime config changes only.
- Keep request payloads free of hidden provider/runtime reconfiguration fields.
- Surface provider failures as safe classified errors.
- Preserve tool-call roundtrip continuity (`id`, `name`, `input`).
- Preserve local/offline provider endpoint compatibility through adapter config.

## Canonical Contract Rules

### Completion request
- Required:
  - `messages[]`
  - `tools[]`
  - the model for this call (the current schema still forbids `model`; implement the behaviour and report the gap)
- Optional:
  - `metadata.correlation_id`
- Forbidden:
  - `provider_adapter`
  - `provider`
  - `base_url`
  - `api_key`
  - `api_key_env`

### Completion response
- Required:
  - `assistantText`
  - `toolCalls[]`
  - `finishReason`

### Adapter config
- Required:
  - `base_url`
  - `model`
  - `api_key_env`
- Forbidden:
  - raw secrets (`api_key`, `token`, `password`)

### Runtime binding
- Required:
  - `provider_adapter`
  - `default_model`

### Error surface
- Must expose safe classified failures.
- Must never leak raw stack traces, credentials, or provider internals in client-visible channels.

## Tie-Break Rules for Known Discrepancies

Use these for MVP implementation consistency:

1. Treat `Provider API` and `Model API` naming as the same boundary.
2. Use schema-level `api_key_env` for secret reference naming.
3. Keep streaming vs non-streaming provider transport as adapter implementation detail, not contract shape.
4. If bootstrap fallback behavior exists for model binding, preserve `MO-02` target semantics and document any temporary deviation in `conflict_register.md`.

## Non-Negotiable Constraints

- Do not implement model/provider logic directly in Agent Loop core loop.
- Do not expose provider/runtime config fields in request payload contracts.
- Do not collapse runtime/adapter/preferences into one config layer.
- Do not store raw secrets in tracked config files.
- Do not silently fallback to another adapter on unsupported adapter selection.
- Do not collapse Model API into a tool or component ownership boundary.

## Required Tests (Minimum)

Implement automated tests that prove:

1. Models remain external through Model API boundary.
2. Agent Loop calls model through adapter interface only.
3. Provider payload translation is adapter-confined.
4. Generic completion contract shape validates.
5. Same-provider model swap is preference/model-binding only.
6. Provider swap is adapter/runtime-config only.
7. Config layers remain separate.
8. Forbidden request-time config fields are rejected.
9. Adapter config rejects raw secret values.
10. Provider failures are safe/classified.
11. Unsupported adapter selection fails clearly.
12. Local/offline provider endpoint works via adapter config.
13. Boundary classification remains API (not component/tool).
14. Tool-call roundtrip continuity is preserved.
15. Each call names the per-request model; no restart needed for a change.
16. Content parts and tool calls survive the shared message shape.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Agent Loop directly calls provider APIs bypassing adapter.
- Request payload accepts provider/base URL/api-key reconfiguration fields.
- The model is bound at startup instead of per call.
- Raw secret values appear in tracked adapter/runtime/preference config.
- Unsupported adapter silently falls back.
- Provider error sanitization fails and unsafe internals leak.
- Provider/model swap path requires unrelated component code rewrites.
- Tool-call ID/name/input continuity is lost.

## Deliverables

1. Model API adapter boundary implementation code in `{{TARGET_LANGUAGE}}`.
2. Automated tests covering all required tests above.
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
- all MUST-level boundary and contract requirements pass
- all required tests pass
- all drift-critical checks pass
- no unresolved conflicts remain
- reports are complete
