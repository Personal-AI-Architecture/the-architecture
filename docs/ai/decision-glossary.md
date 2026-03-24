# Decision Glossary

> Shared definitions for architecture-review and implementation terms used across the primer layer.

## Purpose

Keep planning, implementation, and audit language consistent so the same term does not drift in meaning across files or reviewers.

## Terms

### accepted limitation

A product boundary explicitly allowed in MVP that does not break component ownership, contract rules, or required startup guarantees.

### approved boundary

The architecture-sanctioned access path between components or between a component and Memory. If an implementation reaches around it, that is drift.

### contract-visible

Represented in a real request, response, stream event, or documented interaction state rather than being hidden in private client control flow.

### drift

A mismatch between the implementation and a primer or matrix rule that is not covered by `accepted-mvp-limits.md`.

### internal contract

The bounded interface between Gateway and Engine described in `gateway-engine-contract.md`. Clients must not fabricate or bypass it.

### primer failure

A documentation failure where an auditor cannot answer a necessary architecture question using only the primer layer.

### product-owned state

State that belongs to the product and the owner, remains inspectable/exportable in product-controlled formats, and does not live only in provider-owned or opaque external systems.

### startup readiness

The condition where required runtime config, adapter config, tools, Memory, preferences, export surfaces, and startup guarantees are all correctly loaded before the system is considered ready.

### accepted mvp limit

See `accepted limitation`. This term should not be used to excuse missing required boundaries.

### client contract

The external API between client and Gateway described in `client-gateway-contract.md`, distinct from the internal Gateway-Engine contract.

### conformance gate

A required pass/fail checkpoint that must be satisfied before moving to the next implementation stage.

### one-shot build

An implementation pass designed to avoid structural rework by fixing architecture-critical boundaries and contracts before building product behavior on top.

## Interpretation Rules

- If a term affects audit outcome, its meaning should be taken from this glossary and the linked primer docs.
- If a reviewer uses a term in a way that conflicts with the glossary, update the review or tighten the glossary.
- If a needed term is missing, add it rather than letting reviewers infer inconsistent meanings.

## Audit Questions

- Are reviewers using `accepted limitation` and `drift` consistently?
- Is `contract-visible` being applied to actual payloads and events rather than UI behavior alone?
- Is `product-owned state` really inspectable and exportable?
- Are `approved boundary` and `startup readiness` being enforced as pass/fail ideas rather than soft guidance?

## Source Docs

- `docs/ai/index.md`
- `docs/ai/compliance-matrix.md`
- `docs/ai/accepted-mvp-limits.md`
- `docs/ai/client-gateway-contract.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/build-sequence.md`
