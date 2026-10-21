# Build Sequence

> Architecture-first implementation order for building against the primer layer.

## Purpose

Compress the recommended implementation order into a reusable sequence so builders do not start with product-facing code before the architectural boundaries are correct.

## Core Rule

Build the architecture-dependent runtime path first, then build product behavior on top of it. Do not treat drift cleanup as a final hardening phase.

## Sequence

### 1. Primer Lock

- Treat `build/primers/*.md` and `build/compliance-matrix.md` as the build authority.
- Treat the files under `contracts/` as the sole authority for exact routes, payloads,
  schemas, and event shapes. Blueprint `contract-pack.json` files are derived source
  manifests only.
- Classify accepted MVP limits before coding begins.
- Reject any task that violates required component ownership or contract rules.

### 2. Foundation Conformance

- Fix Agent Loop completion, error taxonomy, and stream behavior first.
- Fix Gateway, Auth, Memory, and config path issues before product code depends on them.
- Validate startup readiness before calling the runtime usable.

### 3. Startup Readiness

- Ensure deterministic startup order.
- Ensure export, conversation persistence (including tool calls and tool results), auth state, and version history with restore exist from day one.
- Ensure localhost-first and offline-capable behavior are real, not planned.

### 4. Product Runtime Skeleton

- Add product bootstrap and config mapping.
- Add persistent conversation storage through the approved Memory boundary.
- Wire Auth: the Gateway calls it on every request, and the Agent Loop asks it before each tool call.
- Pass the owner's current model choice with every request.
- Enforce tool scope, and any approval rules the owner or product sets, in code. The default is that the owner can do everything.

### 5. Product Interaction Layer

- Build the client on the real Gateway contract.
- If the product adds approvals, render them from contract-visible interaction state.
- Add structured logging.
- Keep the client on the canonical route and stream shapes.

### 6. Primer-Only Verification

- Audit the codebase using only `build/primers/*.md` and `build/compliance-matrix.md`.
- Treat any fallback question as a documentation or implementation failure.
- Mark any remaining limitation explicitly as accepted or fix it.

## Required Ordering Rules

- Do not build the CLI first.
- Do not treat Auth, Memory, or Security as post-MVP hardening.
- Do not defer export, history, or conversation persistence to later milestones.
- Do not invent client or internal contract payloads after implementation starts.
- Validate implementation payloads against the canonical OpenAPI and JSON Schema files,
  not against copied blueprint shapes.

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
- conversations, auth, and (where used) approval semantics get trapped in client logic
- verification becomes a list of surprises instead of a conformance check

## Audit Questions

- Was Primer Lock done before coding?
- Were foundation/runtime drift sources fixed before product code depended on them?
- Are startup guarantees implemented before feature work claims readiness?
- Is the client built on the canonical contract rather than on helper paths?
- Was the final audit performed using only the primer layer?

## Source Docs

- `build/primers/README.md`
- `build/compliance-matrix.md`
- `maintainers/accepted-mvp-limits.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/primers/client-gateway-contract.md`
- `build/primers/configuration.md`
- `build/primers/memory.md`
- `build/primers/auth.md`
- `build/primers/security.md`
- `spec/mvp-build-primer.md`
