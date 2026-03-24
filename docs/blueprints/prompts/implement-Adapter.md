# Implement Adapter (AI Coding Prompt)

Use this prompt with a coding AI to implement and validate the **Adapter boundary** in a target language/runtime.

---

You are a senior software engineer implementing a production-ready boundary.

## Mission

Implement **Adapter** in **{{TARGET_LANGUAGE}}** so external-standard translation remains swappable, bounded, and architecture-aligned.

Important: Adapter is a pattern within existing APIs, not a standalone component and not a third API.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Adapter.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway-API.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Model-API.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Models.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Configuration.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Adapter.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Adapter-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Adapter-drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/models.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/configuration.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/gateway.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/client-gateway-contract.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/failure-patterns.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `/home/hex/Reference/the-architecture/docs/adapter-spec.md`
- `/home/hex/Reference/the-architecture/docs/models-spec.md`
- `/home/hex/Reference/the-architecture/docs/configuration-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-spec.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`

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

## Required Adapter Capabilities

Implement these behaviors:
- Keep Adapter as a pattern within existing APIs, not component/API inflation.
- Select adapters from runtime config only.
- Fail clearly on unsupported adapter keys.
- Keep provider-specific protocol logic inside adapters.
- Keep gateway-side translation bounded to protocol normalization.
- Keep runtime config, adapter config, and preferences distinct.
- Keep adapter config secret-reference-based, not secret-value-based.
- Preserve preference-level same-provider model swaps.
- Preserve adapter/runtime-config-level provider swaps.
- Keep internal contracts stable while swapping external standards.
- Emit safe classified errors from adapter failures.
- Reject request-time adapter/runtime reconfiguration attempts.
- Ensure deterministic startup includes adapter-config phase before ready.
- Preserve four-component/two-API architecture invariants.

## Canonical Contract Rules

Use `Adapter.schema.json` as machine-checkable authority for:
- `adapter_boundary_profile`
- `adapter_registry_entry`
- `adapter_selection_policy`
- `gateway_api_adapter_profile`
- `model_api_adapter_profile`
- `adapter_translation_policy`
- `adapter_config_profile`
- `adapter_swap_policy`
- `adapter_error_policy`
- `adapter_runtime_constraints`

Enforce required fields, const/enums, defaults, and forbidden behavior exactly.

## Tie-Break Rules for Known Discrepancies

Use these for implementation consistency:

1. Use explicit Gateway adapter modules as the canonical runtime form; avoid re-collapsing translation logic into Gateway route handlers.
2. Prefer `api_key_env` as canonical secret-reference key in implementation artifacts; document alias handling if legacy `api_key_ref` appears.
3. Keep any compatibility fallback logic bounded and documented; do not let it expand into policy/business logic.
4. Keep payload-shape ownership in Gateway-API/Model-API artifacts; keep Adapter artifact focused on translation and swap governance.

## Non-Negotiable Constraints

- Do not create an `Adapter` component or API.
- Do not allow request-time adapter selection or provider override.
- Do not silently fallback from unsupported adapters.
- Do not leak provider/client protocol specifics into core component logic.
- Do not put conversation lifecycle/auth policy inside adapters.
- Do not store secret values in tracked adapter config.
- Do not require unrelated component rewrites for normal swap paths.
- Do not expose raw external/provider errors to client-visible surfaces.

## Required Tests (Minimum)

Implement automated tests proving all `ADP-MUST-*` rules:

1. Pattern-only classification.
2. Runtime-config adapter selection.
3. Explicit unsupported-adapter failure.
4. Provider logic confined to adapter modules.
5. Gateway translation ownership boundaries preserved.
6. Config-layer separation.
7. Secret-reference-only adapter config.
8. Same-provider model swap behavior.
9. Provider swap behavior.
10. Internal contract stability under external-standard changes.
11. Safe classified adapter error mapping.
12. Rejection of request-time adapter/runtime reconfiguration.
13. Deterministic adapter-config startup phase.
14. Preservation of component/API architecture invariants.

Include positive and negative coverage linked to requirement IDs.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Any Critical check in `Adapter-drift-guard.md` fails.
- Any `ADP-MUST-*` conformance test fails.
- Adapter boundary is promoted into component/API shape.
- Request-time adapter/runtime mutation is accepted.
- Unknown adapter fallback is silent.
- Provider logic leaks outside adapters.
- Secret values appear in tracked adapter config.
- Adapter changes alter four-component/two-API architecture.

## Deliverables

1. Adapter-boundary implementation in `{{TARGET_LANGUAGE}}`.
2. Automated tests covering required conformance vectors.
3. `implementation-report.md`:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md`:
   - pass/fail by adapter interface and requirement ID
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
- all `ADP-MUST-*` requirements pass
- all adapter contract conformance checks pass
- all drift-critical checks pass
- no unresolved High-risk conflicts remain
- reports are complete
