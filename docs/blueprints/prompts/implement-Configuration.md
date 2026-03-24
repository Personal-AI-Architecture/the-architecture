# Implement Configuration (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Configuration** boundary in a target language/runtime.

---

You are a senior software engineer implementing production-ready configuration boundaries and startup-readiness behavior.

## Mission

Implement **Configuration** in **{{TARGET_LANGUAGE}}** so runtime bootstrap, adapter wiring, preferences, and request metadata boundaries are architecture-aligned and drift-resistant.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Configuration.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Configuration.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Configuration-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Configuration-drift-guard.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Engine.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Model-API.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Memory.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/configuration.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/configuration-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/failure-patterns.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/build-sequence.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `/home/hex/Reference/the-architecture/docs/configuration-spec.md`
- `/home/hex/Reference/the-architecture/docs/adapter-spec.md`
- `/home/hex/Reference/the-architecture/docs/models-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-engine-contract.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`
- `/home/hex/Reference/the-architecture/docs/deployment-spec.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership/boundary authority.
2. AI primer docs: MVP contract shape and audit matrix alignment.
3. Existing implementation: evidence only.

If conflicts appear, do not guess silently. Create `conflict_register.md` and document:
- conflict ID
- sources in conflict
- chosen resolution
- rationale
- residual risk

## Required Configuration Capabilities

Implement these behaviors:
- Keep runtime config, adapter config, and preferences as distinct ownership layers.
- Keep request metadata free of hidden runtime/provider/tool configuration fields.
- Keep secrets reference-only in configuration surfaces.
- Keep runtime config thin and environment-owned.
- Keep adapter config provider-specific.
- Keep preferences owner-owned in Memory.
- Enforce deterministic startup sequence and readiness gating.
- Fail clearly on invalid/unsupported configuration.
- Drive tool discovery from configured tool sources.
- Support same-provider model swaps via preferences only.
- Support provider swaps via adapter/runtime config changes only.
- Preserve localhost-first default bind posture unless explicitly overridden.
- Ensure day-one startup readiness surfaces exist (auth bootstrap, persistence path, export-capable memory surface).
- Pass anti-lock-in swap checks with config-only changes.

## Canonical Contract Rules

Use `Configuration.schema.json` as machine-checkable authority for:
- `runtime_config`
- `adapter_config`
- `preferences`
- `tool_source_entry`
- `startup_phase_event`
- `gateway_message_metadata`
- `model_binding_resolution`
- `configuration_error`

Enforce required fields, optional fields, defaults, forbidden fields, and error codes exactly.

## Tie-Break Rules for Known Discrepancies

Use these for MVP consistency:

1. Keep four-field runtime core canonical, but allow optional operational extensions without collapsing ownership boundaries.
2. Treat `api_key_ref` and `api_key_env` as naming variants of secret-reference intent; never allow raw secret values.
3. Keep localhost-first bind as default; explicit deployment overrides are allowed.
4. Keep preference-first model binding normative; if compatibility fallback exists, it must be explicit and test-covered.

## Non-Negotiable Constraints

- Do not merge runtime, adapter, and preferences into one configuration layer.
- Do not allow request metadata to override runtime/provider/tool bootstrap.
- Do not store raw secrets in tracked config or Memory preference files.
- Do not move owner preferences into runtime/adapter config.
- Do not hardcode provider/model selection in Gateway or Engine code.
- Do not mark startup ready before canonical startup phases complete.
- Do not allow provider/model/tool swaps to require code edits.

## Required Tests (Minimum)

Implement automated tests proving all `CFG-MUST-*` requirements in `Configuration-conformance.md`:

1. Layer separation.
2. Hidden request config channel rejection.
3. Secret reference-only handling.
4. Thin runtime ownership.
5. Adapter config ownership.
6. Memory-owned preferences.
7. Deterministic startup sequence.
8. Clear startup failure behavior.
9. Tool source-driven discovery.
10. Same-provider model swap by preference.
11. Provider swap by adapter/runtime config.
12. Localhost-first bind default.
13. Day-one readiness surfaces.
14. Config-only anti-lock-in swap suite.

Include positive and negative vectors linked to requirement IDs.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Any Critical check in `Configuration-drift-guard.md` fails.
- Any `CFG-MUST-*` conformance test fails.
- Secret-by-value fields appear in tracked config or Memory preferences.
- Startup readiness/sequence constraints are violated.
- Provider/model/tool swaps require code edits.
- Unresolved High-risk configuration conflicts remain.

## Deliverables

1. Configuration boundary implementation code in `{{TARGET_LANGUAGE}}`.
2. Automated tests covering required conformance vectors.
3. `implementation-report.md`:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md`:
   - pass/fail by configuration contract interface and requirement ID
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
- all `CFG-MUST-*` requirements pass
- all configuration contract conformance checks pass
- all drift-critical checks pass
- no unresolved High-risk conflicts remain
- reports are complete
