# Primer Change Log

> Historical record of major changes to the AI primer layer.

## Purpose

Track how the primer layer evolves so examples, matrix rows, glossary terms, limits, and review guidance can be understood in historical context.

## 2026-10-21

### Documentation Freshness Tooling

- Published `scripts/check-docs.py`.
- Registered all repository Markdown files and corrected registry covers to current contract paths.

### Configuration Contract Alignment

- Aligned the Configuration blueprint and primer with the exact four-field runtime schema.
- Removed deployment, persistence, and loop-tuning fields from runtime configuration examples and guidance.

### Contract Rule Alignment

- Made Model API streaming explicit and added discriminated event shapes.
- Enforced role-appropriate message parts and aligned builder materials on `parameters` for tool definitions.

### Canonical Contract Alignment

- Replaced duplicated blueprint contract packs with derived source manifests.
- Synchronized primers, builder references, conformance checklists, architecture specs, and examples with the canonical `contracts/` tree.
- Extended `contracts/examples/validate-manifest.py` to validate valid and invalid example shapes, including JSON Schema-backed examples and canonical contract envelopes.

## 2026-03-17

### Initial Primer Layer

- Added core primers for foundation, gateway, agent loop, configuration, memory, auth, security, models, tools, deployment, customization, and the Gateway ↔ Agent Loop contract.
- Added `compliance-matrix.md` as the machine-friendly audit spine.

### Audit-Grade Strengthening

- Added client-facing contract guidance in `client-gateway-contract.md`.
- Added `accepted-mvp-limits.md` to separate scope cuts from drift.
- Expanded the matrix with client-contract and startup-readiness rows.

### Execution And Audit Support

- Added `build-sequence.md`, `primer-audit-playbook.md`, and `decision-glossary.md`.
- Added targeted review checklists under `review-checklists/`.
- Added `failure-patterns.md` and `primer-change-policy.md`.
- Added `traceability-map.md` and `primer-completeness-test.md`.

### Operational Examples And Navigation

- Updated `index.md` to surface the operational layer directly.
- Added canonical standalone payload and config examples under `examples/`.
- Added this `change-log.md` so primer evolution is historically traceable.

### Examples Governance And Tooling

- Added `examples/README.md` to document the standalone example set.
- Added valid and invalid example pairs for client payloads, conversation payloads, approval events, internal requests, and config shapes.
- Added `examples-validation.md` for keeping examples aligned with the primer layer.
- Added `examples/examples-manifest.json` as a machine-readable map from example files to owning docs, matrix IDs, related checklists, and glossary terms.
- Added `examples/validate-manifest.py` for automatic manifest validation.

## Update Rule

When the primer layer changes in a way that affects implementation, audit judgment, or recurring terminology, add a new dated entry here and update related files according to `primer-change-policy.md`.

## Source Docs

- `maintainers/primer-change-policy.md`
- `build/compliance-matrix.md`
- `maintainers/traceability-map.md`
