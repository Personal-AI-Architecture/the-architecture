# Implement Security (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Security** cross-cutting boundary in a target language/runtime.

---

You are a senior software engineer implementing production-ready cross-cutting security controls.

## Mission

Implement **Security** in **{{TARGET_LANGUAGE}}** so security behavior is architecture-aligned, contract-faithful, and drift-resistant across Gateway, Engine, Auth, Memory, Tools, and Configuration.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Security.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Security.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Security-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Security-drift-guard.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Auth.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Engine.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Memory.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway-API.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway-Engine-Contract.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/security.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/security-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/failure-patterns.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `/home/hex/Reference/the-architecture/docs/security-spec.md`
- `/home/hex/Reference/the-architecture/docs/auth-spec.md`
- `/home/hex/Reference/the-architecture/docs/tools-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-engine-contract.md`
- `/home/hex/Reference/the-architecture/docs/configuration-spec.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership and boundary authority.
2. AI primer docs: MVP contract shape and audit matrix alignment.
3. Existing implementation: evidence only.

If conflicts appear, do not guess silently. Create `conflict_register.md` and document:
- conflict ID
- sources in conflict
- chosen resolution
- rationale
- residual risk

## Required Security Capabilities

Implement these behaviors:
- Keep security as a cross-cutting boundary, not a standalone component.
- Prevent secret persistence in forbidden inspectable/tracked storage locations.
- Enforce safe sanitized pre-stream and mid-stream error surfaces.
- Preserve mid-stream taxonomy (`provider_error`, `tool_error`, `context_overflow`).
- Emit structured audit events for sensitive actions.
- Enforce approval as coded runtime control.
- Keep approval interactions contract-visible (`approval-request`, `approval-result`, decision route).
- Enforce auth-on-path and fail-closed behavior for protected routes.
- Block request payloads from acting as hidden runtime/provider/tool configuration channels.
- Enforce tool scope/isolation boundaries independent of Auth policy alone.
- Ensure auth export remains product-owned and non-secret.
- Keep day-one security controls active at startup.
- Preserve correlation-aware traceability.
- Preserve memory export/version-history safety-net behavior.
- Preserve security behavior across component/provider/adapter swaps.

## Canonical Contract Rules

Use `Security.schema.json` as machine-checkable authority for:
- `security_policy_profile`
- `audit_log_event`
- `safe_stream_error_event`
- `pre_stream_error_response`
- `approval_request_event`
- `approval_result_event`
- `approval_decision_request`
- `secret_reference`
- `tool_isolation_policy`
- `security_violation_record`

Enforce required fields, enums, defaults, forbidden fields, and conditional constraints exactly.

## Tie-Break Rules for Known Discrepancies

Use these for MVP consistency:

1. Security artifact is cross-cutting specification; do not implement it as a fifth component.
2. Treat trust-level isolation policy as normative even if current MVP has a smaller curated tool set.
3. Keep error surfaces safe even when upstream providers emit verbose/raw failures.
4. Keep secret handling reference-only (`source/ref`) in contracts and configs.

## Non-Negotiable Constraints

- Do not persist credentials/tokens/passwords in normal inspectable Memory or tracked config.
- Do not expose raw stack traces, provider raw payloads, or internal paths in client-visible errors.
- Do not collapse error taxonomy to a generic catch-all.
- Do not implement approval as prompt-only behavior.
- Do not hide approval state transitions outside contract-visible interfaces.
- Do not bypass Auth on protected routes.
- Do not allow hidden request fields to reconfigure runtime/provider/tool behavior.
- Do not rely on Auth-only checks where runtime tool scope/isolation controls are required.
- Do not disable export/history safety net guarantees.

## Required Tests (Minimum)

Implement automated tests proving all `SEC-MUST-*` requirements in `Security-conformance.md`:

1. Secret storage prohibition.
2. Safe sanitized error surfaces.
3. Mid-stream taxonomy preservation.
4. Structured audit capture for sensitive actions.
5. Coded approval enforcement.
6. Contract-visible approval interactions.
7. Auth-on-path fail-closed behavior.
8. No hidden configuration channels in request payload.
9. Independent tool scope/isolation enforcement.
10. Non-secret auth export behavior.
11. Day-one security startup controls.
12. Correlation-aware traceability.
13. Export/history safety-net guarantees.
14. Swap resilience of security controls.

Include positive and negative vectors, linked to requirement IDs.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Any Critical check in `Security-drift-guard.md` fails.
- Any `SEC-MUST-*` conformance test fails.
- Secret leakage is detected in forbidden surfaces.
- Approval enforcement or visibility is missing.
- Auth bypass is possible on protected routes.
- Error taxonomy or safe-message constraints are broken.
- Swap introduces boundary/security regressions.

## Deliverables

1. Security control implementation code in `{{TARGET_LANGUAGE}}`.
2. Automated tests covering required conformance vectors.
3. `implementation-report.md`:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md`:
   - pass/fail by security contract interface and requirement ID
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
- all `SEC-MUST-*` requirements pass
- all contract conformance checks pass
- all drift-critical checks pass
- no unresolved High-risk conflicts remain
- reports are complete
