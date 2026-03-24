# Implement Memory-Tools (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Memory Tool Surface** in a target language/runtime.

---

You are a senior software engineer implementing production-ready memory operation tools with strict boundary and safety controls.

## Mission

Implement **Memory-Tools** in **{{TARGET_LANGUAGE}}** so memory operations are architecture-aligned, contract-faithful, and drift-resistant.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Memory-Tools.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Memory-Tools.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Memory-Tools-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Memory-Tools-drift-guard.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Memory.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Tools.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Engine.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Auth.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Configuration.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Security.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway-Engine-Contract.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/memory.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/tools.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/memory-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/security-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/failure-patterns.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `/home/hex/Reference/the-architecture/docs/memory-spec.md`
- `/home/hex/Reference/the-architecture/docs/tools-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`
- `/home/hex/Reference/the-architecture/docs/configuration-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-engine-contract.md`
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

## Required Memory-Tools Capabilities

Implement these behaviors:
- Expose canonical memory tools:
  - `memory_read`
  - `memory_write`
  - `memory_edit`
  - `memory_delete`
  - `memory_list`
  - `memory_search`
  - `memory_history`
  - `memory_export`
- Enforce path confinement to memory root for all path-bearing operations.
- Block reserved internal roots (at minimum `.git`).
- Require coded approval for mutating operations.
- Emit structured audit + version commit records for successful mutations.
- Keep read/list/search/history/export read-only by default.
- Enforce non-empty search query and default conversation exclusion.
- Apply secret-like token redaction to search match content.
- Provide history records with prior-state support.
- Return owner-memory archive path for export output.
- Emit classified/safe tool failures.
- Ensure startup readiness includes memory-tool, history, and export guarantees before ready.
- Preserve memory-boundary access (no direct component reach-in).

## Canonical Contract Rules

Use `Memory-Tools.schema.json` as machine-checkable authority for:
- `memory_tool_definition`
- `memory_path_policy`
- `memory_tool_failure`
- input/output interfaces for read/write/edit/delete/list/search/history/export

Enforce required fields, optional fields, defaults, forbidden fields, and failure classification exactly.

## Tie-Break Rules for Known Discrepancies

Use these for MVP consistency:

1. Keep canonical `memory_*` operation names in external tool contracts; adapter aliases are optional compatibility behavior.
2. Preserve backend-agnostic contracts; do not hardwire file-only assumptions into public contract semantics.
3. Keep version/history/export as day-one guarantees, not post-MVP hardening.
4. Preserve default `include_conversations=false` search behavior with explicit opt-in.

## Non-Negotiable Constraints

- Do not remove any canonical memory tool from required surface.
- Do not allow escaped paths or reserved internals access.
- Do not execute mutating operations without approval.
- Do not bypass audit/version trail on successful mutations.
- Do not accept empty search queries.
- Do not leak secret-like tokens unredacted in search output.
- Do not collapse failure taxonomy into generic/untyped errors.
- Do not continue startup in warning-only mode if version/history readiness fails.
- Do not access memory storage directly from Gateway/Engine/Auth outside approved boundary paths.

## Required Tests (Minimum)

Implement automated tests proving all `MTL-MUST-*` requirements in `Memory-Tools-conformance.md`:

1. Canonical surface presence.
2. Path confinement.
3. Reserved-path blocking.
4. Approval gating for mutations.
5. Mutation audit + version commit.
6. Read-only operation semantics.
7. Search query validation and default scope.
8. Search output redaction.
9. History record + prior-state behavior.
10. History path-policy consistency.
11. Export archive output behavior.
12. Classified/safe failure mapping.
13. Startup readiness guarantees.
14. Boundary enforcement against direct storage reach-in.

Include positive and negative vectors linked to requirement IDs.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Any Critical check in `Memory-Tools-drift-guard.md` fails.
- Any `MTL-MUST-*` conformance test fails.
- Path escape or reserved-path access is possible.
- Mutation approval bypass is possible.
- Search redaction fails.
- Startup readiness degrades required memory guarantees.
- Direct component storage reach-in bypasses approved boundary.

## Deliverables

1. Memory-Tools implementation code in `{{TARGET_LANGUAGE}}`.
2. Automated tests covering required conformance vectors.
3. `implementation-report.md`:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md`:
   - pass/fail by memory-tool contract interface and requirement ID
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
- all `MTL-MUST-*` requirements pass
- all memory-tool contract conformance checks pass
- all drift-critical checks pass
- no unresolved High-risk conflicts remain
- reports are complete
