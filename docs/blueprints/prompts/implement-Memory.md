# Implement Memory (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Memory** component in a target language.

---

You are a senior software engineer implementing a production-ready component.

## Mission

Implement the **Memory** component in **{{TARGET_LANGUAGE}}** so it is architecture-aligned, contract-faithful, and drift-resistant.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Memory.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Memory.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Memory-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Memory-drift-guard.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Auth.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/memory.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/memory-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/accepted-mvp-limits.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `/home/hex/Reference/the-architecture/docs/memory-spec.md`
- `/home/hex/Reference/the-architecture/docs/memory-as-platform.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-spec.md`

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

## Required Memory Capabilities

Implement these behaviors:
- Maintain Memory as the durable owner-controlled substrate with zero outward dependencies.
- Expose core memory operations (`read`, `write`, `edit`, `delete`, `search`, `list`, `history`) through approved interfaces.
- Enforce path sandbox constraints (memory-root boundary and reserved path protections).
- Persist conversations inside Memory contract via dedicated conversation boundary.
- Provide canonical conversation list/detail envelope shapes.
- Support export of required owner data surfaces in open formats.
- Provide history with change records and prior-state retrieval behavior.
- Enforce deterministic startup readiness for version-history guarantees.
- Keep structured/queryable owner data inside Memory contract surfaces.
- Keep secret material out of normal inspectable Memory surfaces.

## Canonical Contract Rules

### Core memory operations
- Must conform to `Memory.schema.json` request/response shapes.
- Must return safe classified errors for invalid paths, reserved paths, and missing resources.

### Conversation boundary
- Must support create/append/list/detail via Memory boundary interface.
- Must not move conversation source of truth to non-Memory side stores.

### Export and history
- `memory_export` must return archive path and include required owner data surfaces.
- `memory_history` must expose change records and prior state behavior where applicable.

### Security and portability
- No direct bypass access from non-Memory components.
- Owner data remains inspectable without full runtime.
- Backend storage evolution remains behind stable contract.

## Tie-Break Rules for Known Discrepancies

Use these for MVP implementation consistency:

1. Treat "Your Memory" (human docs) and "Memory component" (implementation artifact naming) as the same architectural component.
2. Preserve owner-controlled local/open-format guarantees even when internal representation mixes files and structured stores.
3. Keep broad structured/queryable expansion optional in MVP, but do not hide required owner data surfaces outside Memory contract.
4. Keep version-history readiness as startup requirement, not warning-only best effort.

## Non-Negotiable Constraints

- Do not add outward dependency from Memory to Gateway, Engine, or Auth.
- Do not allow direct storage reach-in from non-Memory components.
- Do not store conversations as ephemeral-only in-process state.
- Do not omit export/history guarantees.
- Do not allow path escape outside memory root or reserved internals access.
- Do not write secrets into normal inspectable Memory content.
- Do not break Memory tool contracts when changing storage backends.

## Required Tests (Minimum)

Implement automated tests that prove:

1. Memory has zero outward dependencies.
2. Access is only through approved Memory boundaries.
3. Core operation surface is complete and schema-valid.
4. Path traversal and reserved-path protections hold.
5. Write/edit/delete operations are durable and auditable.
6. Conversations persist inside Memory boundary and survive restart.
7. Conversation list/detail envelopes are canonical.
8. Export includes required owner data surface.
9. History includes prior-state behavior.
10. Startup fails clearly when version-history readiness cannot be established.
11. Structured/queryable owner data remains in Memory surface.
12. Secrets are absent from normal inspectable Memory surfaces.
13. Owner data remains inspectable without full runtime.
14. Storage backend swaps preserve external Memory contracts.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Memory depends outward on Gateway/Engine/Auth.
- Non-Memory components bypass Memory boundaries for storage access.
- Export or history guarantees are missing/partial.
- Startup readiness degrades version-history guarantee to warning-only behavior.
- Path sandbox constraints are bypassable.
- Secrets appear in inspectable Memory surfaces.
- Backend swap breaks Memory contracts used by other components.

## Deliverables

1. Memory implementation code in `{{TARGET_LANGUAGE}}`.
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
- all MUST-level memory and boundary requirements pass
- all required tests pass
- all drift-critical checks pass
- no unresolved conflicts remain
- reports are complete
