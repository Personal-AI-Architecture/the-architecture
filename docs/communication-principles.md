# Communication Principles: Avoiding Lockin

This architecture says everything except Your Memory is swappable (Foundation Principle 3). Communication is no different.

The communication layer is just another replaceable piece — like the Engine, like the Gateway, like the contracts and their adapters.

Here's why:

Most systems don't think about the internal communication layer as a separate concern. Each interface does its own thing. Each one uses whatever conventions seemed right at the time.

That works until you try to change something.

Swap the transport layer and you're rewriting components. Replace the message format and half the system breaks. Add a new internal interface and you're inventing conventions from scratch — different field names, different error shapes, different tracing approaches.

The communication layer becomes invisible lock-in. Not lock-in to a vendor — lock-in to an approach you can no longer walk away from.

## What does it take to make communication actually swappable?

That's what this document answers. Six principles, each one a property that keeps the communication layer thin, stateless, and dumb — and therefore swappable. Violate one and you've recoupled the system.

The unifying idea behind all six: **responsibilities stay where they belong.** The architecture defines who does what:

* **The model** provides intelligence
* **Memory** holds state
* **Auth** controls access
* **The Engine** executes tools

When a responsibility leaks from its owner into another part of the system, it recouples the system — swapping that part now means dealing with work that doesn't belong to it.

If the communication layer starts holding state, you can't swap it without migrating data — that's Memory's job, not communication's. If it starts making semantic decisions, you can't swap it without replicating that intelligence — that's the model's job, not communication's.

Every principle in this document is a specific case of the same rule: don't do another component's job, because the moment you do, swapping you means dealing with work that doesn't belong to you.

Pain from your hand and pain from your foot travel the same pathways using the same signal structure — your brain doesn't need a different protocol for each organ. The nervous system is consistent, observable, and dumb — it carries signals, it doesn't interpret them. The brain does the thinking.

This document covers communication **between internal components** — Gateway, Engine, Auth, and the tools/services they interact with. It does not cover the Gateway API connector (external client boundary — see `gateway-spec.md`), the Provider API connector (external model boundary — see `models-spec.md`), or client-side communication. Those have their own specs.

**Related documents:** `foundation-spec.md` (architecture overview, links to all component specs)

---

## Principles

### P1. Components Don't Embed Communication

Communication is a layer between components, not inside them. If the Gateway has serialization logic baked into its code, or the Engine hard-codes a message envelope format, swapping the communication approach means rewriting the components. That's coupling, not swappability.

Components speak to an interface. The communication layer implements that interface. Swap the implementation, components don't know the difference. This is Foundation Principle 1 (Interfaces Over Implementations) applied to communication. Same principle that makes the Engine swappable — it's defined by what it does, not how it talks.

Can you change how components communicate without changing the component code? If no, you've embedded communication and created lock-in.

### P2. Consistent Structure Across Interfaces

If every internal interface has its own message shape, field names, and type conventions, you're not swapping one communication layer — you're swapping N different ones. A developer reading a Gateway-to-Engine message shouldn't have to learn a different vocabulary than an Engine-to-tool message. Same base fields. Same field names — don't call it `correlation_id` in one place and `trace_id` in another. Same type conventions — if timestamps are ISO 8601 in one message, they're ISO 8601 everywhere.

This applies to errors too. When every interface invents its own error shape, error handling becomes per-interface custom code. Errors are part of the contract, not an afterthought — machine-readable codes, correlation context, no leaked internals. Same structural conventions as normal messages.

At minimum, every internal request carries: a correlation ID (P5), a timestamp, and enough context for the receiver to process it without ambient state. Events within a stream (like SSE events) inherit the request's correlation context — they don't each carry their own. The `gateway-engine-contract.md` is one application of this — its `metadata` object and field conventions should be the starting point for other internal interfaces, not an island.

Consistency means one swap, not N. Can a developer reading any internal message recognize the structure without checking which interface produced it? If not, each interface is its own lock-in surface.

### P3. No State in the Communication Layer

If the communication layer accumulates state — sessions, message history, routing tables — swapping it means migrating that state. That migration is complex, error-prone, and creates a dependency on the old approach that outlives the swap.

The communication layer is a pipe, not a database. It carries messages; it doesn't store them. State lives where the architecture says it lives: Your Memory (the platform) and component-owned stores (like the Gateway's conversation store). Same principle as the nervous system — it transmits signals, it doesn't remember them. Memory does that.

If the communication conventions were stripped out entirely and replaced with direct calls between components, no data would be lost. The system would lose consistency and observability, but not state. That's the test: can you replace the communication layer without migrating any data? If swapping requires moving state, you're locked in.

### P4. No Intelligence in the Communication Layer

The smarter the communication layer, the harder it is to swap. If it routes by intent, dispatches by content, or decides which component handles a request, swapping it means replicating that intelligence in whatever replaces it.

Intelligence improves. Deterministic code doesn't. Every time a better model ships, every semantic decision the model makes gets better for free. Every semantic decision hardcoded in the communication layer stays exactly as good as the day it was written. Put decisions where improvement happens.

Infrastructure handles structural concerns — "this HTTP request goes to the Engine," "this request is authenticated," "this SSE stream connects to this client." Deterministic, no judgment. The model handles semantic concerns — "this user needs information from their docs, not the web," "this request is ambiguous, I should ask for clarification." Judgment, context, nuance.

A router that matches intents to handlers is infrastructure pretending to be intelligence — it caps the system below what the model can do. That's D24: the architecture must never be the bottleneck. Does the communication layer make decisions that get better when the model gets better? If yes, that intelligence is in the wrong place.

### P5. Observability Is a Property of Messages, Not Transport

If your ability to trace a request depends on how the current communication layer is built — its internal logging, its proprietary trace format, its debugging tools — swapping it kills your ability to debug. Observability that lives in the transport dies with the transport.

Observability lives in the messages. A **correlation ID** flows through every component, every tool call, every log entry — the thread that connects a request to every internal action it triggered. That ID is in the message payload, not in transport headers that vanish on swap. **Structured logging** is a component concern — components log in a consistent, machine-parseable format with the correlation ID, regardless of how they communicate. **Error traceability** means errors include enough context to identify where in the chain something failed, without exposing secrets.

Further depth — parent message IDs, timing metadata, cost metadata — follows the same rule: properties of the message, not the transport.

After swapping the communication layer, can you still reconstruct exactly what happened for any request? If observability broke, it was a property of the old transport, not of the messages.

### P6. Evolution Without Coordination

Components evolve at different speeds. The Gateway might update while the Engine stays unchanged. A new tool might attach metadata that older components have never seen. If any of these changes break communication, every update becomes a coordinated deployment — and coordination is lock-in to a release schedule.

New fields are additive — alongside existing fields, never replacing them. Unknown fields are ignored by receivers, not rejected. Optional metadata lives in a designated area of the message (a `metadata` or `extensions` object) separate from core operational fields. Removing or renaming a required field is a breaking change that requires coordinated updates — the exception, not the norm.

Can one component add new fields to its messages without breaking any other component? If not, component release schedules are coupled.

---

## What This Document Does Not Define

| Thing | Why not | Where it lives |
|-------|---------|---------------|
| Specific message format (JSON-RPC, custom envelope, etc.) | Implementation choice — Level 2 | Product spec / implementation |
| Specific transport (HTTP, gRPC, queues) | Deployment choice | `deployment-spec.md`, component specs |
| Semantic routing / task dispatch | The model decides (P4) | `engine-spec.md` |
| Specific error codes | Interface-specific | Each contract (e.g., `gateway-engine-contract.md`) |
| Authentication mechanism | Auth's responsibility | `auth-spec.md` |
| The Gateway-Engine contract details | Already defined | `gateway-engine-contract.md` |

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D169 | Internal communication principles defined as a foundation document | The architecture defines components and contracts but not the principles governing how internal communication stays swappable. This gap left each new interface as a one-off design. Six principles close the gap without prescribing implementation. |

---

## Open Questions

- **OQ-1: ~~Does this spec warrant a new foundation decision number?~~** Resolved → D169.
- **OQ-2: Should gateway-engine-contract.md be updated to explicitly reference these principles?** The contract already follows them — the question is whether to make the relationship explicit.
- **OQ-3: Should D16 be annotated to distinguish transport-level protocols (always use standards) from internal communication conventions (principles-based, implementation flexible)?** This would clarify the tension Dave J's work surfaced.

---

## Success Criteria

- [ ] Communication conventions can be swapped without changing component code (P1)
- [ ] All internal interfaces follow a consistent message structure — one swap, not N (P2)
- [ ] No state lives in the communication layer — swap without migration (P3)
- [ ] No semantic decisions live in the communication layer — swap without replicating intelligence (P4)
- [ ] Request tracing works after a communication layer swap — observability in messages, not transport (P5)
- [ ] Components evolve independently — no coordinated deployments for additive changes (P6)

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-05 | Voice alignment: rewrote to match finalized spec style — "How we define" opener, conversational tone, analogies woven through, scope folded into opener, Decisions Made restored, test language woven into prose instead of bold-formatted subsections. | Style alignment (Dave W + Claude) |
| 2026-03-05 | Complete rewrite: reframed from "debate position" to "properties for lock-in-free communication." 8 principles reduced to 6, each derived from "what makes communication swappable." Old P1 (Standards First) removed — covered by Foundation Principle 5. Old P5 (Structured Errors) folded into P2 (Consistency). Old P7 (Memory Stays Central) reframed as P3 (No State) + P1 (Not Embedded). Old P8 (Transport Independence) removed — scope statement, not principle. | Architecture review (Dave W + Claude) |
| 2026-03-05 | Initial draft — 8 principles, success criteria, open questions | Architecture review of BDP (Dave W + Claude) |

---

## Summary

The architecture requires a separation of responsibilities because swappability depends on it. Communication is the connective tissue between components — that makes it the most likely place for responsibilities to bleed across boundaries, because every component touches it. If the communication layer starts holding state, it's doing Memory's job. If it starts making semantic decisions, it's doing the model's job. If it starts enforcing access control, it's doing Auth's job. Each leak makes swapping harder.

The six principles are Principle #6 (Responsibilities Stay Where They Belong) applied to the communication layer: keep it thin, keep it dumb, keep it stateless — because those jobs already have owners. A communication layer that carries signals without interpreting them is one you can swap without consequences. A communication layer that's accumulated other components' responsibilities is one you're stuck with.

The communication layer's job is to communicate. The architecture works because nothing else is doing that job, and communication isn't doing anything else.

---

*The architecture says everything except Your Memory is swappable. These principles are what make internal communication swappable too — the properties any communication approach must exhibit, not a prescription for which approach to use.*
