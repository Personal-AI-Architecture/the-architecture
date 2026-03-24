# Implement Deployment (AI Coding Prompt)

Use this prompt with a coding AI to implement and validate the **Deployment boundary** in a target language/runtime.

---

You are a senior software engineer implementing a production-ready deployment posture.

## Mission

Implement **Deployment** in **{{TARGET_LANGUAGE}}** so runtime posture stays local-first, offline-capable, and architecture-aligned.

Important: Deployment is an operational boundary, not a runtime component or API.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Deployment.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Configuration.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Models.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Model-API.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Security.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Deployment.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Deployment-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Deployment-drift-guard.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/deployment.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/build-sequence.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/accepted-mvp-limits.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/configuration-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/failure-patterns.md`

## Human Architecture Inputs (Authoritative for boundary ownership)

- `/home/hex/Reference/the-architecture/docs/deployment-spec.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`
- `/home/hex/Reference/the-architecture/docs/configuration-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-spec.md`
- `/home/hex/Reference/the-architecture/docs/models-spec.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership and deployment contract authority.
2. AI primer docs: MVP contract shape and audit alignment.
3. Existing implementation: evidence only.

If conflicts appear, do not guess silently. Create `conflict_register.md` with:
- conflict ID
- sources in conflict
- chosen resolution
- rationale
- residual risk

## Required Deployment Capabilities

Implement these behaviors:
- Preserve owner-controlled local deployment path.
- Preserve fully offline functional path for baseline loop.
- Default bind posture to localhost-only.
- Keep baseline deployment single-unit by default.
- Keep owner data local by default unless explicitly configured otherwise.
- Avoid hidden mandatory remote infrastructure for baseline operation.
- Enforce deterministic startup order and fail-fast critical readiness behavior.
- Preserve day-one export and persistent conversation guarantees.
- Fail clearly for unsupported adapter selection.
- Preserve architecture boundaries when deployment profile changes.
- Preserve owner data across updates and provide rollback path.
- Require explicit owner action for remote/network exposure.

## Canonical Contract Rules

Use `Deployment.schema.json` as authority for:
- `deployment_boundary_profile`
- `owner_control_posture`
- `offline_function_profile`
- `network_exposure_policy`
- `single_unit_deployment_profile`
- `hardware_support_profile`
- `storage_locality_policy`
- `dependency_escape_profile`
- `update_safety_policy`
- `startup_readiness_profile`

Enforce required fields, const/enums, defaults, and forbidden behaviors exactly.

## Tie-Break Rules for Known Discrepancies

Use these for implementation consistency:

1. Treat localhost-only as the normative default, even if example deployment profiles include explicit public bind overrides.
2. Treat “local Docker deployment only” as an MVP implementation scope, not an architecture restriction against other local owner-controlled packaging.
3. Keep startup-readiness checks shared across boundaries but do not weaken deployment guarantees.
4. Keep storage technology choices flexible while preserving local inspectability and required capabilities.

## Non-Negotiable Constraints

- Do not make managed/remote infrastructure mandatory for baseline runtime.
- Do not require internet connectivity for baseline loop.
- Do not default-bind publicly without explicit owner override.
- Do not split baseline into mandatory multiple services.
- Do not silently fallback for unsupported adapters.
- Do not degrade critical startup failures to warnings.
- Do not allow updates to delete/corrupt owner data.
- Do not remove rollback/reversion path.
- Do not change component/API ownership because of deployment profile changes.

## Required Tests (Minimum)

Implement automated tests proving all `DEP-MUST-*` rules:

1. Owner-controlled hardware path exists.
2. Offline functional loop path exists.
3. Localhost-only default bind posture.
4. Single-unit baseline deployment.
5. Local data by default.
6. No hidden mandatory remote infra for baseline.
7. Deterministic startup order.
8. Fail-fast critical startup readiness.
9. Day-one export and persistent conversation path.
10. Clear unsupported-adapter failure.
11. Boundary preservation under deployment profile changes.
12. Update data-safety guarantee.
13. Rollback/reversion availability.
14. Explicit owner action required for remote exposure.

Include positive and negative coverage linked to requirement IDs.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Any Critical check in `Deployment-drift-guard.md` fails.
- Any `DEP-MUST-*` conformance test fails.
- Baseline loop requires internet/cloud.
- Default bind is not localhost-only.
- Critical startup failures continue as warnings.
- Owner-data preservation or rollback checks fail.
- Deployment profile mutates component/API ownership.

## Deliverables

1. Deployment-boundary implementation in `{{TARGET_LANGUAGE}}`.
2. Automated tests for required deployment conformance vectors.
3. `implementation-report.md`:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md`:
   - pass/fail by deployment interface and requirement ID
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
- all `DEP-MUST-*` requirements pass
- all deployment contract conformance checks pass
- all drift-critical checks pass
- no unresolved High-risk conflicts remain
- reports are complete
