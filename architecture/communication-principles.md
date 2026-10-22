---
sidebar_label: Communication
hide_table_of_contents: true
---

# Communication Principles

## What these principles are

Communication is how the parts of your AI system talk to each other: how the Gateway hands a request to the Agent Loop, how the Agent Loop asks Auth for permission, and how it runs tools. These principles are the rules for those connections.

Most systems don't treat these connections as something to design. Each one is built however seemed right at the time, and over time they pick up extra jobs: remembering sessions, deciding where a request should go, checking who's allowed. That works until you try to change something. Then swapping one part means untangling all the work that crept into the wiring.

We think that's lock-in hiding in plain sight. It isn't lock-in to a vendor, but to an approach you can no longer walk away from. And when the wiring makes decisions, those decisions stay as good as the day they were written, while the model gets better every few months.

So in PAA, the connections between parts only carry messages. They don't remember anything, make judgment calls or check permissions. Your Memory holds state, the model makes decisions, and Auth controls access. Like your nervous system, the wiring carries signals; the brain does the thinking.

That means the wiring is swappable, like every other part. You can change how the parts talk to each other without rewriting them or moving any data, and every judgment call stays with the model, where it gets better for free.

<p align="center">
  <img src="../assets/readme-how-it-works.svg" alt="Interfaces connect through the Gateway API to the Gateway, which hands off to the Agent Loop. The Agent Loop calls models through the Model API and reaches Your Memory and other tools through tools. Auth checks every request." width="900" />
</p>

## How it works

This works because every job in the system already has an owner. If the connections between parts take on any of those jobs, they become one more thing you can't swap. So each of the six principles is the same rule applied a different way: the wiring doesn't do another part's job.

1. **Parts don't build in the wiring.** Each part talks to a simple interface. How messages actually travel can change without changing the part.
2. **One message shape everywhere.** A message keeps the same shape from the client app through the Gateway and Agent Loop to the model, and every connection uses the same field names and error conventions. A conversation saved by the Gateway can be replayed to any Agent Loop or model without loss.
3. **No memory in the wiring.** Messages pass through, and nothing is stored along the way. You could replace the wiring without moving any data.
4. **No decisions in the wiring.** Working out what a request needs is the model's job. A connection only routes by structure ("this goes to the Agent Loop"), never by meaning.
5. **Tracing travels with the message.** Every request carries an ID through every step and every log entry, so you can still see what happened after you swap the wiring.
6. **Parts change on their own schedule.** New fields are added alongside old ones, and parts that don't know them ignore them. So one part can update without the others.

The rest of this doc is the specification: what any implementation of internal communication must do.

---

## What this covers

These principles govern communication **between internal components**: the Gateway, the Agent Loop, Auth, and the tools and services they call. The Gateway API (the client boundary, see [gateway-spec.md](./gateway-spec.md)) and the Model API (the model boundary, see [models-spec.md](./models-spec.md)) have their own specs, though they share the message shape in P2.

Decision D16 (use prevailing standards, never a custom protocol) applies wherever the system chooses a protocol, internal connections included: they use standard HTTP, streaming and the common `role` + `content` message format. What the architecture defines itself is the shared message shape built on those standards (D178), kept swappable by these principles and by adapters (D139).

**The rule behind all six principles: responsibilities stay where they belong.** The model provides intelligence, Your Memory holds state, Auth controls access, and the Agent Loop executes tools. The communication layer carries messages between them. When it takes on any of those jobs, swapping it means dealing with work that doesn't belong to it. Each principle below is one case of that rule (Principle 3 in [principles.md](./principles.md), applied to communication).

## The six principles

### P1. Components Don't Embed Communication

Communication is a layer between components, not inside them. If the Gateway has serialization logic baked into its code, or the Agent Loop hard-codes a message envelope format, swapping the communication approach means rewriting the components. That's coupling, not swappability.

Components speak to an interface. The communication layer implements that interface. Swap the implementation, components don't know the difference. This is Principle 3 (Keep Responsibilities Where They Belong) applied to communication. Communication's job is to carry signals, not interpret them. The moment it starts doing another component's job, you can't swap it cleanly.

Can you change how components communicate without changing the component code? If no, you've embedded communication and created lock-in.

### P2. Consistent Structure Across Interfaces

If every internal interface has its own message shape, field names, and type conventions, you're not swapping one communication layer — you're swapping N different ones. A developer reading a Gateway-to-Agent-Loop message shouldn't have to learn a different vocabulary than an Agent-Loop-to-tool message. Same base fields. Same field names — don't call it `correlation_id` in one place and `trace_id` in another. Same type conventions — if timestamps are ISO 8601 in one message, they're ISO 8601 everywhere.

The clearest case is the message itself. The Gateway API, the Gateway ↔ Agent Loop contract and the Model API share one message shape (D178): content is a list of parts, text first with room for images and files (D179), and tool calls and tool results are ordinary parts of messages. Nothing is converted between interfaces, and a conversation saved by the Gateway can be replayed to any Agent Loop or model without loss.

This applies to errors too. When every interface invents its own error shape, error handling becomes per-interface custom code. Errors are part of the contract, not an afterthought — machine-readable codes, correlation context, no leaked internals. Same structural conventions as normal messages.

At minimum, every internal request carries a correlation ID (P5) and enough context for the receiver to process it without ambient state. A request timestamp is not required: each component's log entries record timing alongside the correlation ID. Events within a stream (like SSE events) inherit the request's correlation context — they don't each carry their own. The [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md) is one application of this — its `metadata` object and field conventions should be the starting point for other internal interfaces, not an island.

Consistency means one swap, not N. Can a developer reading any internal message recognize the structure without checking which interface produced it? If not, each interface is its own lock-in surface.

### P3. No State in the Communication Layer

If the communication layer accumulates state — sessions, message history, routing tables — swapping it means migrating that state. That migration is complex, error-prone, and creates a dependency on the old approach that outlives the swap.

The communication layer is a pipe, not a database. It carries messages; it doesn't store them. State lives where the architecture says it lives: Your Memory (including conversations, which the Gateway reads and writes there through the conversation store tool) and Auth's own state (identities, permissions and the audit log). Same principle as the nervous system — it transmits signals, it doesn't remember them. Memory does that.

If the communication conventions were stripped out entirely and replaced with direct calls between components, no data would be lost. The system would lose consistency and observability, but not state. That's the test: can you replace the communication layer without migrating any data? If swapping requires moving state, you're locked in.

### P4. No Intelligence in the Communication Layer

The smarter the communication layer, the harder it is to swap. If it routes by intent, dispatches by content, or decides which component handles a request, swapping it means replicating that intelligence in whatever replaces it.

Intelligence improves. Deterministic code doesn't. Every time a better model ships, every semantic decision the model makes gets better for free. Every semantic decision hardcoded in the communication layer stays exactly as good as the day it was written. Put decisions where improvement happens.

Infrastructure handles structural concerns — "this HTTP request goes to the Agent Loop," "this request is authenticated," "this SSE stream connects to this client." Deterministic, no judgment. The model handles semantic concerns — "this user needs information from their docs, not the web," "this request is ambiguous, I should ask for clarification." Judgment, context, nuance.

A router that matches intents to handlers is infrastructure pretending to be intelligence — it caps the system below what the model can do. That's D24: the architecture must never be the bottleneck. Does the communication layer make decisions that get better when the model gets better? If yes, that intelligence is in the wrong place.

### P5. Observability Is a Property of Messages, Not Transport

If your ability to trace a request depends on how the current communication layer is built — its internal logging, its proprietary trace format, its debugging tools — swapping it kills your ability to debug. Observability that lives in the transport dies with the transport.

Observability lives in the messages. A **correlation ID** flows through every component, every tool call, every log entry — the thread that connects a request to every internal action it triggered. That ID is in the message payload, not in transport headers that vanish on swap. **Structured logging** is a component concern — components log in a consistent, machine-parseable format with the correlation ID, regardless of how they communicate. **Error traceability** means errors include enough context to identify where in the chain something failed, without exposing secrets.

Further depth — parent message IDs, timing metadata, cost metadata — follows the same rule: properties of the message, not the transport.

After swapping the communication layer, can you still reconstruct exactly what happened for any request? If observability broke, it was a property of the old transport, not of the messages.

### P6. Evolution Without Coordination

Components evolve at different speeds. The Gateway might update while the Agent Loop stays unchanged. A new tool might attach metadata that older components have never seen. If any of these changes break communication, every update becomes a coordinated deployment — and coordination is lock-in to a release schedule.

New fields are additive — alongside existing fields, never replacing them. Unknown fields are ignored by receivers, not rejected. Optional metadata lives in a designated area of the message (a `metadata` or `extensions` object) separate from core operational fields. Removing or renaming a required field is a breaking change that requires coordinated updates — the exception, not the norm. The one deliberate exception is the authenticated identity context (`auth_context`), which is strict for security: unexpected fields are rejected, not ignored. Some contracts are stricter than this principle today (GAP-PAA-31).

Can one component add new fields to its messages without breaking any other component? If not, component release schedules are coupled.

---

## What these principles do not define

| Thing | Why not | Where it lives |
|-------|---------|---------------|
| Specific message format (JSON-RPC, custom envelope, etc.) | Implementation choice | Product spec / implementation |
| Specific transport (HTTP, gRPC, queues) | Deployment choice | [deployment-spec.md](./deployment-spec.md), component specs |
| Semantic routing / task dispatch | The model decides (P4) | [agent-loop-spec.md](./agent-loop-spec.md) |
| Specific error codes | Interface-specific | Each contract (e.g., [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md)) |
| Authentication mechanism | Auth's responsibility | [auth-spec.md](./auth-spec.md) |
| The Gateway ↔ Agent Loop contract details | Already defined | [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md) |

## Checking an implementation

- [ ] Communication conventions can be swapped without changing component code (P1)
- [ ] All internal interfaces follow a consistent message structure — one swap, not N (P2)
- [ ] No state lives in the communication layer — swap without migration (P3)
- [ ] No semantic decisions live in the communication layer — swap without replicating intelligence (P4)
- [ ] Request tracing works after a communication layer swap — observability in messages, not transport (P5)
- [ ] Components evolve independently — no coordinated deployments for additive changes (P6)


---

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D169 | Internal communication principles defined as a foundation document | The architecture defines components and contracts but not the principles governing how internal communication stays swappable. This gap left each new interface as a one-off design. Six principles close the gap without prescribing implementation. |
