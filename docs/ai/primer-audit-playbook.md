# Primer Audit Playbook

> Repeatable method for auditing a codebase using only the primer layer and the compliance matrix.

## Purpose

Turn primer-based review into a consistent process so audit outcomes depend on evidence and rules rather than reviewer style.

## Audit Scope

Use only:

- `docs/ai/*.md`
- `docs/ai/compliance-matrix.md`
- code and code-adjacent project artifacts under review

Do not consult deeper human-readable architecture docs unless the audit is explicitly about primer completeness.

## Audit Workflow

### 1. Read The Routing Layer

- Start with `index.md`.
- Read the relevant component and contract docs for the area being audited.
- Read `accepted-mvp-limits.md` before labeling something an MVP shortcut or drift.

### 2. Select Matrix Rules

- Pick the relevant rule families from `compliance-matrix.md`.
- Turn them into pass/fail checks for the code under review.
- Prefer concrete rows over broad prose claims.

### 3. Inspect Evidence

- Inspect code paths, config loaders, routes, startup flow, and exported surfaces.
- Inspect runtime-facing contracts and payload shapes.
- Inspect whether observed behavior matches the matrix row and primer text.

### 4. Separate Findings

- Mark `conforms` when code and evidence clearly match the rule.
- Mark `drift` when code contradicts a primer or matrix rule.
- Mark `accepted limitation` only if `accepted-mvp-limits.md` allows it without breaking a matrix rule.
- Mark `primer failure` if the audit question cannot be answered from the primer layer.

### 5. Write Findings

Each finding should include:

- area
- code evidence
- primer citation
- matrix ID where available
- judgment: `conforms`, `drift`, `accepted limitation`, or `primer failure`

## Evidence Template

```text
Area: Gateway
Finding: drift
Code Evidence: src/in-memory-conversation-store.ts
Primer Citation: docs/ai/gateway.md
Matrix ID: G-04
Reason: private in-process conversation store bypasses the approved Memory boundary
```

## Valid Example

```text
Area: Configuration
Finding: drift
Code Evidence: src/config.ts
Primer Citation: docs/ai/configuration.md
Matrix ID: C-01
Reason: runtime config, adapter config, and preferences are collapsed into one loader
```

Why this is valid:

- it names the area clearly
- it ties the judgment to actual code evidence
- it cites the primer and matrix directly

## Invalid Drift Example

```text
Area: Gateway
Finding: probably wrong
Reason: feels too coupled
```

Why this is invalid:

- no code evidence
- no primer or matrix citation
- judgment is style-based instead of rule-based

## Required Audit Questions

- Which primer files define the area under review?
- Which matrix IDs turn that area into pass/fail checks?
- Does the code conform, drift, or fall within accepted MVP limits?
- Did any question require fallback outside the primer layer?
- If yes, is that an implementation issue or a primer failure?

## Common Audit Failure Modes

- Using broad architectural intuition instead of matrix rows.
- Calling something an MVP shortcut without checking `accepted-mvp-limits.md`.
- Reviewing the client contract and internal contract as if they were the same thing.
- Ignoring startup-readiness rules because the feature appears to work at runtime.
- Failing to mark unanswered questions as primer failures.

## Source Docs

- `docs/ai/index.md`
- `docs/ai/compliance-matrix.md`
- `docs/ai/accepted-mvp-limits.md`
- `docs/ai/client-gateway-contract.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/build-sequence.md`
