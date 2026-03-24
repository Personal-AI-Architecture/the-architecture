# Implement Models (AI Coding Prompt)

Use this prompt with a coding AI to implement and validate the **Models boundary** in a target language/runtime.

---

You are a senior software engineer implementing a production-ready architecture boundary.

## Mission

Implement **Models** in **{{TARGET_LANGUAGE}}** so model intelligence remains external, swappable, and aligned with architecture ownership and anti-drift rules.

Important: `Models` is an external dependency boundary, not a runtime component and not an additional API.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Models.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Model-API.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Engine.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Configuration.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Models.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Models-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Models-drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/models.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/configuration-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/engine-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/configuration.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/engine.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `/home/hex/Reference/the-architecture/docs/models-spec.md`
- `/home/hex/Reference/the-architecture/docs/adapter-spec.md`
- `/home/hex/Reference/the-architecture/docs/configuration-spec.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`
- `/home/hex/Reference/the-architecture/docs/deployment-spec.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership and boundary authority.
2. AI primer docs: MVP contract shape and audit alignment.
3. Existing implementation: evidence only.

If conflicts appear, do not guess silently. Create `conflict_register.md` and include:
- conflict ID
- sources in conflict
- chosen resolution
- rationale
- residual risk

## Required Models Capabilities

Implement these behaviors:
- Keep models external and never classify them as a runtime component.
- Route primary model access through Model API and adapter path.
- Keep provider-specific logic inside adapters.
- Keep primary model invocation out of tool-bootstrap flow.
- Keep runtime config, adapter config, and preferences as distinct layers.
- Keep same-provider model swaps preference-driven.
- Keep provider swaps adapter/runtime-config-driven.
- Reject request-time provider/runtime reconfiguration fields.
- Use secret references (`api_key_env`) instead of secret values in tracked config.
- Fail clearly for unsupported adapters with no silent fallback.
- Preserve local/offline model endpoint path support.
- Emit safe classified model failure taxonomy.
- Keep Gateway from owning model/provider selection responsibility.
- Preserve exactly two external APIs: Gateway API and Model API.

## Canonical Contract Rules

Use `Models.schema.json` as authority for:
- `model_boundary_profile`
- `model_access_policy`
- `model_configuration_layers`
- `model_binding_policy`
- `model_request_guard`
- `model_swap_rules`
- `provider_swap_rules`
- `adapter_contract`
- `model_failure_taxonomy`
- `model_readiness_profile`

Enforce required fields, defaults, enums/const values, and forbidden behaviors exactly.

## Tie-Break Rules for Known Discrepancies

Use these for implementation consistency:

1. Treat `Provider API` and `Model API` as synonymous names for the same boundary; use `Model API` in implementation artifacts.
2. Keep `Models` boundary policy-level and `Model-API` payload-level; do not duplicate ownership.
3. If legacy bootstrap model fallback exists, preserve `MO-02` preference-led outcome semantics and document any temporary deviation.
4. If only one adapter ships initially, still preserve multi-adapter swappability architecture in interfaces/tests.

## Non-Negotiable Constraints

- Do not implement Models as a fifth runtime component.
- Do not introduce a third external API.
- Do not bypass adapters from Engine core model path.
- Do not place provider-specific logic in Gateway or Engine core loop.
- Do not accept request payload fields that reconfigure provider/model/runtime binding.
- Do not store raw credentials in tracked runtime/adapter/preference files.
- Do not silently fallback on unsupported adapter selection.
- Do not make same-provider swap require unrelated component code changes.
- Do not make provider swap require Gateway/Auth/Memory/Engine-core rewrites.

## Required Tests (Minimum)

Implement automated tests proving all `MOD-MUST-*` rules:

1. External dependency classification for models.
2. Primary model access path through Model API plus adapter.
3. Adapter confinement of provider-specific logic.
4. Primary model not bootstrapped as a tool.
5. Separation of runtime/adapter/preferences layers.
6. Same-provider model swap is preference-level only.
7. Provider swap is adapter/runtime-config-level only.
8. Request-time forbidden fields are rejected.
9. Secret-reference-only adapter config handling.
10. Explicit unsupported-adapter failure behavior.
11. Local/offline endpoint path support.
12. Safe classified model failure taxonomy.
13. Gateway non-ownership of model/provider selection.
14. External API set remains exactly Gateway API and Model API.

Include positive and negative coverage linked to requirement IDs.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Any Critical check in `Models-drift-guard.md` fails.
- Any `MOD-MUST-*` conformance test fails.
- Models appear as runtime component inventory.
- Request payload accepts provider/runtime reconfiguration fields.
- Secret values appear in tracked config or preferences.
- Unsupported adapter falls back silently.
- Offline local endpoint path is unsupported by design.
- Additional external API is introduced.

## Deliverables

1. Models boundary implementation in `{{TARGET_LANGUAGE}}`.
2. Automated tests for required conformance vectors.
3. `implementation-report.md`:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md`:
   - pass/fail by models interface and requirement ID
5. `drift-check-report.md`:
   - pass/fail by drift-critical checks
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
- all `MOD-MUST-*` requirements pass
- all models contract conformance checks pass
- all drift-critical checks pass
- no unresolved High-risk conflicts remain
- reports are complete
