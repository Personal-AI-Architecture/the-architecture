# Build Sequence

> Architecture-first implementation order for building against the primer layer.

## Purpose

Compress the recommended implementation order into a reusable sequence so builders do not start with product-facing code before the architectural boundaries are correct.

## Core Rule

Build the architecture-dependent runtime path first, then build product behavior on top of it. Do not treat drift cleanup as a final hardening phase.

## Sequence

### 1. Primer Lock

- Treat `docs/ai/*.md` and `docs/ai/compliance-matrix.md` as the build authority.
- Classify accepted MVP limits before coding begins.
- Reject any task that violates required component ownership or contract rules.

### 2. Foundation Conformance

- Fix Engine completion, error taxonomy, and stream behavior first.
- Fix Gateway, Auth, Memory, and config path issues before product code depends on them.
- Validate startup readiness before calling the runtime usable.

### 3. Startup Readiness

- Ensure deterministic startup order.
- Ensure export, conversation persistence, auth state, and version-history readiness exist from day one.
- Ensure localhost-first and offline-capable behavior are real, not planned.

### 4. Product Runtime Skeleton

- Add product bootstrap and config mapping.
- Add persistent conversation storage through the approved Memory boundary.
- Wire Auth on the real path.
- Enforce tool scope and coded approval.

### 5. Product Interaction Layer

- Build the client on the real Gateway contract.
- Render approval from contract-visible interaction state.
- Add structured logging.
- Keep the client on the canonical route and stream shapes.

### 6. Primer-Only Verification

- Audit the codebase using only `docs/ai/*.md` and `docs/ai/compliance-matrix.md`.
- Treat any fallback question as a documentation or implementation failure.
- Mark any remaining limitation explicitly as accepted or fix it.

## Required Ordering Rules

- Do not build the CLI first.
- Do not treat Auth, Memory, or Security as post-MVP hardening.
- Do not defer export, history, or conversation persistence to later milestones.
- Do not invent client or internal contract payloads after implementation starts.

## Valid Example

```text
Primer Lock
-> Foundation Conformance
-> Startup Readiness
-> Runtime Skeleton
-> Product Interaction Layer
-> Primer-Only Verification
```

Why this is valid:

- it fixes architectural drift sources before product code depends on them
- it makes startup guarantees explicit before feature work
- it leaves verification as proof of conformance, not as discovery of basic missing boundaries

## Invalid Drift Example

```text
CLI Prototype
-> Product Features
-> Memory/Auth/Security Later
-> Drift Audit At End
```

Why this is drift-prone:

- product code normalizes missing boundaries
- conversations, auth, and approval semantics get trapped in client logic
- verification becomes a list of surprises instead of a conformance check

## Audit Questions

- Was Primer Lock done before coding?
- Were foundation/runtime drift sources fixed before product code depended on them?
- Are startup guarantees implemented before feature work claims readiness?
- Is the client built on the canonical contract rather than on helper paths?
- Was the final audit performed using only the primer layer?

## Source Docs

- `docs/ai/index.md`
- `docs/ai/compliance-matrix.md`
- `docs/ai/accepted-mvp-limits.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/client-gateway-contract.md`
- `docs/ai/configuration.md`
- `docs/ai/memory.md`
- `docs/ai/auth.md`
- `docs/ai/security.md`
- `spec/mvp-build-primer.md`
