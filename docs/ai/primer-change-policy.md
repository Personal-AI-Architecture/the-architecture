# Primer Change Policy

> Rules for keeping the primer layer internally consistent when it is updated.

## Purpose

Prevent the primer set from drifting out of sync with itself when rules, examples, limits, or terminology change.

## Core Rule

If a change affects how a builder implements, how an auditor judges, or how a reviewer interprets a term, update every affected primer artifact in the same change.

## Update Rules

### When To Update Examples

Update examples when:

- a contract payload shape changes
- a valid example would now fail the compliance matrix
- an invalid drift example no longer shows a real failure mode

Affected files usually include:

- `client-gateway-contract.md`
- `gateway-engine-contract.md`
- `configuration.md`
- `examples/README.md`
- `examples-validation.md`

### When To Update Matrix Rows

Update `compliance-matrix.md` when:

- a primer adds a new required or forbidden behavior
- an audit relies on prose because no matrix row exists
- startup-readiness or contract checks become more explicit

### When To Update The Glossary

Update `decision-glossary.md` when:

- a new repeated term appears across multiple docs
- reviewers use an existing term inconsistently
- a term begins to affect audit outcomes directly

### When To Update Accepted MVP Limits

Update `accepted-mvp-limits.md` when:

- a scope cut is explicitly allowed or disallowed for MVP
- a previously accepted limit is found to break a matrix rule
- a build plan keeps misclassifying a limitation as non-drift

### When To Update Review Checklists

Update `review-checklists/*` when:

- a new matrix row matters for targeted area review
- a recurring drift pattern keeps being missed in focused audits
- an area primer gains a new day-one requirement

## Required Companion Updates

- Contract change -> update contract doc, examples, matrix rows, and any checklist that audits that contract.
- Contract change -> update `examples-validation.md` if the example-governance rules also change.
- New MVP allowance or prohibition -> update `accepted-mvp-limits.md`, matrix rows if needed, and any relevant build/audit guidance.
- New recurring failure mode -> update `failure-patterns.md` and the affected checklist or examples.
- New repeated audit term -> update `decision-glossary.md` and any primer using the term ambiguously.

## Change Review Questions

- Does this change alter implementation behavior?
- Does this change alter pass/fail audit judgment?
- Does this change introduce or redefine a repeated term?
- Does this change affect examples, checklists, or accepted MVP limits?
- Did all impacted primer files change together?

## Invalid Change Example

```text
Update gateway-engine-contract.md with a new required event,
but leave compliance-matrix.md, client-gateway-contract.md,
and checklists unchanged.
```

Why this is invalid:

- builders see one rule
- auditors enforce another
- examples and checklists become stale
- the primer layer stops behaving like one coherent authority

## Valid Change Example

```text
Add a new client-facing approval field,
update client-gateway-contract.md,
update compliance-matrix.md,
update gateway review checklist,
and update any example payloads that use approval events.
```

Why this is valid:

- implementation, audit, and review all move together
- no stale example contradicts the new rule
- targeted reviews continue to catch the right failures

## Source Docs

- `docs/ai/compliance-matrix.md`
- `docs/ai/decision-glossary.md`
- `docs/ai/accepted-mvp-limits.md`
- `docs/ai/failure-patterns.md`
- `docs/ai/primer-audit-playbook.md`
- `docs/ai/review-checklists/gateway-review.md`
- `docs/ai/review-checklists/memory-review.md`
- `docs/ai/review-checklists/auth-review.md`
