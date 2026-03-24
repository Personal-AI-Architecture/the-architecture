# Primer Completeness Test

> Standing procedure for proving that a new implementation can be audited using only the primer layer and the compliance matrix.

## Purpose

Test whether the primer set is actually complete enough to support real architecture review without falling back to deeper human-readable docs.

## Success Standard

The primer layer passes this test only if an auditor can review the target codebase using:

- `docs/ai/*.md`
- `docs/ai/compliance-matrix.md`
- code and code-adjacent project artifacts

and can classify findings as `conforms`, `drift`, or `accepted limitation` without reopening the deeper reference docs.

If any necessary judgment requires fallback, that is a `primer failure`.

## Test Procedure

### 1. Choose The Audit Slice

- Pick a real implementation or a meaningful subsystem.
- Prefer areas with known drift risk: Gateway, Memory, Auth, Configuration, Engine, or startup readiness.

### 2. Read Only Primer Authority

- Start with `docs/ai/index.md`.
- Read the relevant component primer, contract docs, and `accepted-mvp-limits.md`.
- Select applicable matrix rows from `docs/ai/compliance-matrix.md`.

### 3. Run A Primer-Only Audit

- Follow `docs/ai/primer-audit-playbook.md`.
- Use the targeted review checklist for the area.
- Record all findings with code evidence and primer citations.

### 4. Record All Blockers

For every blocked judgment, record:

- the question that could not be answered
- the primer file that should have answered it
- whether the missing piece was a rule, payload shape, example, checklist item, glossary term, or accepted-limit distinction

### 5. Score The Result

- `pass` if all required judgments were possible from the primer layer alone
- `fail` if any required judgment forced fallback
- `partial` only if the test scope itself was incomplete, not because the primer was weak

## Evidence Template

```text
Area: Memory
Finding: primer failure
Blocked Question: Does export need to include conversations?
Expected Primer File: docs/ai/memory.md
Missing Piece: explicit export scope statement
```

## Valid Example

```text
Area: Gateway
Finding: drift
Code Evidence: src/in-memory-conversation-store.ts
Primer Citation: docs/ai/gateway.md
Matrix ID: G-04
Reason: private in-process conversation store bypasses the dedicated conversation-store boundary
```

Why this is valid:

- the rule came from the primer layer
- the judgment did not require fallback
- the evidence and matrix ID are explicit

## Invalid Example

```text
Area: Engine
Finding: maybe drift
Reason: I remember the deeper docs said something stronger
```

Why this is invalid:

- judgment depends on memory of deeper docs
- no primer citation
- no explicit blocked question was recorded as primer failure

## Required Test Questions

- Could the area be audited from the primer layer alone?
- Did the matrix provide pass/fail rows for the actual observed behavior?
- Did examples and glossary terms reduce ambiguity enough to avoid guessing?
- Did accepted MVP limits clearly distinguish allowable scope cuts from drift?
- If the test failed, exactly which primer artifact needs strengthening?

## Common Failure Modes

- missing client or internal payload shape
- missing startup-readiness rule
- missing accepted MVP limit classification
- missing glossary term for a repeated judgment concept
- missing targeted checklist item that slows focused reviews and hides obvious drift

## Follow-Up Rule

If the test fails:

- update the relevant primer doc
- update the matrix if the missing piece should be pass/fail
- update examples, checklists, glossary terms, or accepted limits as needed
- rerun the completeness test on the same audit slice

## Source Docs

- `docs/ai/index.md`
- `docs/ai/compliance-matrix.md`
- `docs/ai/primer-audit-playbook.md`
- `docs/ai/decision-glossary.md`
- `docs/ai/accepted-mvp-limits.md`
- `docs/ai/failure-patterns.md`
- `docs/ai/review-checklists/gateway-review.md`
- `docs/ai/review-checklists/memory-review.md`
- `docs/ai/review-checklists/auth-review.md`
- `docs/ai/review-checklists/configuration-review.md`
- `docs/ai/review-checklists/engine-review.md`
- `docs/ai/review-checklists/security-review.md`
