# Primer Change Log

> Historical record of major changes to the AI primer layer.

## Purpose

Track how the primer layer evolves so examples, matrix rows, glossary terms, limits, and review guidance can be understood in historical context.

## 2026-03-17

### Initial Primer Layer

- Added core primers for foundation, gateway, engine, configuration, memory, auth, security, models, tools, deployment, customization, and the Gateway-Engine contract.
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

- `docs/ai/primer-change-policy.md`
- `docs/ai/compliance-matrix.md`
- `docs/ai/traceability-map.md`
