# Primer Change Log (historical)

> Historical record of the retired AI primer layer. Current rules and tests live
> in `architecture/`, `contracts/`, and `conformance/`.

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

### Parallel Tool Execution Alignment

- Promoted independent-call concurrency from an optional blueprint enhancement to a mandatory Agent Loop and Tools requirement.
- Added conformance vectors for overlap, stable result IDs, and dependent-call ordering.

### Portable Policy Semantics

- Defined canonical policy matching, conditions, precedence, and fail-closed reference handling.
- Added Auth conformance vectors and compliance coverage for provider-independent policy evaluation.

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

This historical log is closed. Record new architecture decisions in
`architecture/decisions.md` and update the affected specs, contracts,
conformance checks, examples and templates.

## Source Docs

- `architecture/decisions.md`
- `maintainers/documentation-guide.md`
- `contracts/examples/examples-manifest.json`
