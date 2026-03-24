# Failure Patterns

> Recurring real-world drift patterns grouped by symptom, likely cause, and where to read next in the primer layer.

## Purpose

Make common architecture failures easier to recognize quickly during implementation and audit work.

## Pattern: Private Conversation Store

- Symptom: conversations live in an in-process `Map`, private store object, or route-local persistence layer.
- Likely cause: Gateway was built before the Memory boundary and conversation-store boundary were made real.
- Read next: `docs/ai/gateway.md`, `docs/ai/memory.md`, `docs/ai/client-gateway-contract.md`
- Matrix IDs: `G-03`, `G-04`, `M-05`, `D-07`

## Pattern: Auth Omitted On The Real Path

- Symptom: requests work with no auth middleware, no identity headers, or a “local mode” that bypasses the boundary.
- Likely cause: implementer treated permissive policy as equivalent to no Auth component.
- Read next: `docs/ai/auth.md`, `docs/ai/gateway-engine-contract.md`
- Matrix IDs: `A-01`, `A-02`, `A-05`, `GC-04`

## Pattern: Config Layer Collapse

- Symptom: runtime config, adapter config, preferences, and secrets appear in one merged loader.
- Likely cause: implementer optimized for fast bootstrapping before the config taxonomy was made explicit.
- Read next: `docs/ai/configuration.md`, `docs/ai/build-sequence.md`
- Matrix IDs: `C-01`, `C-02`, `C-03`, `D-06`

## Pattern: Approval Trapped In The Client

- Symptom: approval works only through local readline/UI branches and does not appear in the contract.
- Likely cause: approval was treated as UX behavior instead of contract-visible interaction plus coded enforcement.
- Read next: `docs/ai/client-gateway-contract.md`, `docs/ai/gateway-engine-contract.md`, `docs/ai/security.md`
- Matrix IDs: `S-03`, `S-05`, `GC-06`

## Pattern: Version History Is Best-Effort

- Symptom: git or version initialization fails with warnings and the system continues.
- Likely cause: version guarantees were treated as operational niceties instead of Memory and startup-readiness requirements.
- Read next: `docs/ai/memory.md`, `docs/ai/build-sequence.md`
- Matrix IDs: `M-04`, `D-05`

## Pattern: Export Surface Missing Or Partial

- Symptom: no export exists, or export excludes conversations, structured data, or required owner state.
- Likely cause: export was treated as a future feature instead of a foundational Memory guarantee.
- Read next: `docs/ai/memory.md`, `docs/ai/accepted-mvp-limits.md`
- Matrix IDs: `M-03`, `D-07`

## Pattern: Error Taxonomy Collapse

- Symptom: every mid-stream failure becomes `provider_error`, or raw exception text leaks into client-visible events.
- Likely cause: Engine error behavior was implemented without the contract taxonomy and sanitization rules.
- Read next: `docs/ai/gateway-engine-contract.md`, `docs/ai/security.md`
- Matrix IDs: `GC-03`, `GC-05`, `S-01`

## Pattern: Engine Stops Early

- Symptom: the loop exits because of an internal iteration cap before the model signals completion.
- Likely cause: safety bounds were embedded in Engine rather than made explicit and externalized.
- Read next: `docs/ai/engine.md`, `docs/ai/gateway-engine-contract.md`
- Matrix IDs: `E-04`

## Pattern: Raw Storage Shape Leaks Through Client API

- Symptom: conversation routes return internal database rows, storage metadata, or unstable payload shapes.
- Likely cause: client contract was not separated from internal storage and internal contract concerns.
- Read next: `docs/ai/client-gateway-contract.md`, `docs/ai/gateway.md`
- Matrix IDs: `G-05`, `G-06`, `G-07`

## Pattern: Primer Failure During Audit

- Symptom: auditor cannot answer a necessary architecture question without reopening deeper human-readable docs.
- Likely cause: the primer layer is missing a rule, shape, example, or glossary term.
- Read next: `docs/ai/primer-audit-playbook.md`, `docs/ai/decision-glossary.md`, `docs/ai/primer-change-policy.md`
- Matrix IDs: no direct matrix row; this is a primer-layer maintenance failure

## Audit Questions

- Which pattern best matches the observed symptom?
- Is the likely cause in implementation order, missing boundary enforcement, or primer incompleteness?
- Which primer files should be read before proposing a fix?
- Which matrix IDs convert the symptom into a pass/fail check?

## Source Docs

- `docs/ai/gateway.md`
- `docs/ai/memory.md`
- `docs/ai/auth.md`
- `docs/ai/security.md`
- `docs/ai/client-gateway-contract.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/configuration.md`
- `docs/ai/primer-audit-playbook.md`
- `docs/ai/build-sequence.md`
- `docs/ai/compliance-matrix.md`
- `docs/ai/decision-glossary.md`
