# Memory Review Checklist

> Fast targeted review checklist for Memory guarantees, export, history, and substrate boundaries.

## Purpose

Use this when reviewing Memory tools, export/history behavior, persistent conversation storage, or startup guarantees tied to Memory.

## Checklist

- [ ] Memory has zero outward dependencies on Gateway, Agent Loop, or Auth.
- [ ] Components access Memory through approved tools or boundaries rather than direct storage reach-in.
- [ ] Conversations are inside the Memory contract rather than side storage.
- [ ] Structured or queryable owner data is not hidden outside the model-facing Memory surface.
- [ ] Export exists and covers the required owner data surface.
- [ ] History returns previous states, not only metadata.
- [ ] The owner can restore an earlier state, whatever mechanism backs history (Git is one option).
- [ ] Failed or conflicting writes are reported, never resolved silently.
- [ ] Version-history readiness is deterministic at startup.
- [ ] Memory data remains inspectable without the system running.
- [ ] Secrets are excluded from Memory entirely.

## Matrix IDs

- `F-04`
- `M-01`
- `M-02`
- `M-03`
- `M-04`
- `M-05`
- `M-06`
- `M-07`
- `S-06`
- `D-05`
- `D-07`

## Common Failure Patterns

- conversations live in a Gateway-only store
- export is missing or incomplete
- history only returns change metadata
- history exists but there is no restore
- version-history guarantees degrade to warnings
- concurrent writes resolved by silent last-write-wins
- database-backed Memory is invisible to the public Memory surface

## Example Files

- `contracts/examples/memory-restore-tool.json`

## Read Next

- `build/primers/memory.md`
- `maintainers/accepted-mvp-limits.md`
- `build/compliance-matrix.md`

## Source Docs

- `maintainers/primer-audit-playbook.md`
- `build/primers/memory.md`
- `build/compliance-matrix.md`
