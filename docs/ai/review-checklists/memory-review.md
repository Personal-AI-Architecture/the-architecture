# Memory Review Checklist

> Fast targeted review checklist for Memory guarantees, export, history, and substrate boundaries.

## Purpose

Use this when reviewing Memory tools, export/history behavior, persistent conversation storage, or startup guarantees tied to Memory.

## Checklist

- [ ] Memory has zero outward dependencies on Gateway, Engine, or Auth.
- [ ] Components access Memory through approved tools or boundaries rather than direct storage reach-in.
- [ ] Conversations are inside the Memory contract rather than side storage.
- [ ] Structured or queryable owner data is not hidden outside the model-facing Memory surface.
- [ ] Export exists and covers the required owner data surface.
- [ ] History returns previous states, not only metadata.
- [ ] Version-history readiness is deterministic at startup.
- [ ] Memory data remains inspectable without the system running.
- [ ] Secrets are excluded from normal inspectable Memory content.

## Matrix IDs

- `F-04`
- `M-01`
- `M-02`
- `M-03`
- `M-04`
- `M-05`
- `M-06`
- `D-05`
- `D-07`

## Common Failure Patterns

- conversations live in a Gateway-only store
- export is missing or incomplete
- history only returns commit metadata
- git/version guarantees degrade to warnings
- database-backed Memory is invisible to the public Memory surface

## Read Next

- `docs/ai/memory.md`
- `docs/ai/accepted-mvp-limits.md`
- `docs/ai/compliance-matrix.md`

## Source Docs

- `docs/ai/primer-audit-playbook.md`
- `docs/ai/memory.md`
- `docs/ai/compliance-matrix.md`
