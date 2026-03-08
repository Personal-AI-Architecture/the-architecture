---
sidebar_label: Agent Loop
hide_table_of_contents: true
---

# Agent Loop Spec

Every AI system has an agent loop — ChatGPT runs a loop that calls tools and streams responses, Copilot runs a loop that reads code and suggests completions, every agent framework implements the same message → model → tool → response cycle. So what's different here?

Nothing. That's the point. **The Agent Loop is intentionally generic — a commodity component with no product-specific logic.** Its job is to connect a model to tools and stream results back. Think of it as a hand. A hand can grip any tool — hammer, pen, scalpel, phone. It doesn't need to be rebuilt for each one. It doesn't know what it's holding or why. The brain decides what to pick up and what to do with it. The hand executes.

A skilled surgeon and an untrained person have the same hands. The difference is the brain directing them — the knowledge, the training, the judgment. Same here. What's different about any product built on this architecture isn't the Agent Loop — it's what's in Memory. Everything that makes a product unique — the methodology, the personality, the skills, the approval flow, the scope constraints — lives in **Your Memory**, not in the Agent Loop. The Agent Loop reads Your Memory through tools. The model finds instructions, context, and knowledge in the files. Product behavior emerges from what's in memory, not from custom agent loop code.

Why this matters: a generic agent loop can pick up any tool the ecosystem produces — MCP servers, CLI tools, new integrations — without modification. A product-specific one could only pick up product-shaped things. The moment you bake domain logic into the agent loop, you tie what the system does to how it works, and that's how you get locked in. The analogy: a Toyota engine and a Honda engine work the same way. What makes the car different is everything else — the body, the interior, the features, the driving experience. The Agent Loop is the boring, interchangeable part. That's a feature, not a limitation.

AI tool use collapsed the engineering cost of capabilities from "build across four layers" to "add a tool." The model is now good enough at deciding which tools to use and how to compose them without being told. This means the agent loop itself doesn't need to be smart — it just needs to reliably connect a model to tools and get out of the way.

The Agent Loop sits in the middle of the foundation's flow: clients connect through the Gateway, the Gateway routes to the Agent Loop, the Agent Loop calls models through the Model API and executes tools from the environment. Your Memory is the platform — the Agent Loop reads and writes to it through tools. The Gateway ↔ Agent Loop interface is defined in [gateway-engine-contract.md](./gateway-engine-contract.md) (D137). The Agent Loop receives a messages array (system prompt + conversation history + current message) and metadata via `POST /engine/chat`, then returns an SSE stream of events (text-delta, tool-call, tool-result, done, error). Auth middleware authenticates requests before they reach the Agent Loop.

**Related documents:** [foundation-spec.md](./foundation-spec.md) (architecture overview, links to all component specs)

---

## What the Agent Loop Does NOT Do

These are explicit boundaries. They exist to prevent product-specific logic from creeping into the Agent Loop over time.

| Responsibility | Where It Lives | NOT in the Agent Loop |
|---------------|---------------|-------------------|
| Prompt assembly | Your Memory (context files read by the model through tools) | Agent Loop does not construct product-specific prompts |
| Skill execution | Your Memory (skill files read and followed by the model) | Agent Loop does not have a skill framework |
| Approval flow | Tools (write tools require confirmation) + model instructions | Agent Loop does not manage approval state |
| Scope constraints | Tool configuration (which tools are available) | Agent Loop does not enforce boundaries |
| Context loading | Model reads files through tools based on its instructions | Agent Loop does not decide what context to load |
| Conversation persistence | External storage (SQLite, files) accessed through tools or configuration | Agent Loop does not own conversation storage |
| Context window management | Model/provider handles compaction, or instructions tell the model how to summarize | Agent Loop does not decide what to cut |
| Error recovery | Agent Loop reports failures; the model or caller decides what to do | Agent Loop does not retry or recover |
| Authentication | Auth layer sits in front of the Agent Loop | Agent Loop does not authenticate requests |
| Product personality | System prompt and memory files | Agent Loop has no personality |

---

## What the Agent Loop Does

The Agent Loop runs a loop:

1. **Accept a message** — from the Gateway (which routes requests from clients, API calls, scheduled triggers, or other agents)
2. **Send it to a model** — along with a system prompt, tool definitions, and conversation history, through the Model API
3. **Execute tool calls** — whatever the model decides to do, through the tool protocol
4. **Stream the response back** — to the Gateway
5. **Repeat** — until the model signals it's done

That's the complete behavior. Five steps.

---

## What the Agent Loop Guarantees

- Messages sent to the Agent Loop reach the model
- Tool calls the model makes get executed
- Responses stream back to the caller
- The loop continues until the model signals completion
- The model can dispatch multiple tool calls in parallel within a single loop — the Agent Loop executes them concurrently and returns all results

---

## Concurrency

The Agent Loop is one brain with two hands — one model that can dispatch multiple tool executions in parallel. The model coordinates because it initiated all of them. It knows the left hand is reorganizing the filing cabinet, so it tells the right hand to wait before pulling from the same drawer.

This is the only concurrency the Agent Loop needs to handle: **parallel tool execution within a single loop.** The model calls several tools at once (read a file while a background task runs), the Agent Loop executes them concurrently, results come back, the model decides what's next.

**Multi-actor concurrency is not an Agent Loop concern.** When a collaborator or external agent accesses the same Memory, they bring their own system — their own agent loop, their own model calls. Two people don't share a brain. They each have their own brain and access the same filing cabinet through Auth. Memory is inert — it doesn't care who's reading it. Auth gates every request. Tools handle write conflicts. No shared agent loop state needed.

| Scenario | What's happening | Agent Loop's role |
|----------|-----------------|---------------|
| Owner dispatches parallel tool calls | One model, multiple tool executions | Execute them concurrently, return results |
| Background task runs while owner chats | One model orchestrating both via tools | Same — parallel tool execution within one loop |
| Owner runs multiple conversations simultaneously | Separate requests, separate loops, shared Memory via tools | Each request gets its own loop — Agent Loop is stateless between loops |
| Collaborator accesses Memory simultaneously | Separate system, separate agent loop, same Memory | Not this agent loop's concern — Auth + tools handle it |
| External agent connects | Separate system, separate agent loop, same Memory | Not this agent loop's concern — Auth + tools handle it |

---

## The Agent Loop Contract

### Per-Request Input (via Gateway)

| Field | Description | Required |
|-------|-------------|----------|
| Message | The owner's message (or system trigger) | Yes |
| System prompt | Instructions for the model | Yes |
| Conversation history | Prior messages in this conversation | No (first message has none) |

### Boot-Time Configuration (via runtime config)

| Field | Description | Source |
|-------|-------------|--------|
| Tool definitions | What tools are available | Pre-configured from tool sources (D143 — does not change per-request) |
| Provider configuration | Which model, which provider, API key | Runtime config + adapter (D143 — does not change per-request) |

See [configuration-spec.md](./configuration-spec.md) for the full boot sequence (D143).

### Output

| Field | Description |
|-------|-------------|
| Streamed response | Text generated by the model, delivered as it's produced |
| Tool call results | Results of any tools the model called during the loop |
| Completion signal | Indication that the model is done |

### Error output

| Condition | Agent Loop behavior |
|-----------|----------------|
| Model unreachable | Report failure to caller |
| Tool execution fails | Report failure to model (model decides next step) |
| Provider timeout | Report failure to caller |
| Invalid input | Reject with error |

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D39 | The Engine is a generic agent loop with no product-specific logic | Composability. A generic engine can pick up any tool the ecosystem produces. A domain-specific engine can only pick up domain-shaped things. Lock-in comes from tying what you do to how the engine works. |
| D40 | Prompt assembly and skill execution live in Your Memory, not the Engine | The model reads skills and context through tools. Product behavior emerges from what's in the files, not from custom engine code. Same principle as D39 — don't tie intelligence to the loop. |
| D41 | The "harness" concept is replaced by Engine + the other components working together | The harness was an abstraction for something that's actually just Your Memory + Engine + Tools + Models. The agent isn't a component — it's what emerges when you connect the pieces. |
| D42 | Engine renamed from "Harness" — "Engine" reflects that it's a commodity component | Every engine does the same thing. What makes the car different is everything around it. The Engine is the boring, interchangeable part. |
| D50 | Bootstrap prompt is Engine configuration — minimal seed that lets the model self-bootstrap from Your Memory | One line: "Read the entry point in the current folder." Everything else the model discovers from Your Memory by following that instruction. |
| D108 | Provider API must remain a connector, not a tool | The model decides what tools to call — you can't use a tool to call the thing that decides which tools to use. Circular dependency. The Provider API is structurally different from tools. |
| D137 | Gateway ↔ Engine is a plain HTTP API contract | POST /engine/chat with messages array + metadata. Engine returns SSE stream. Auth middleware on path. See [gateway-engine-contract.md](./gateway-engine-contract.md). |

---

## Open Questions

None. The Agent Loop spec is intentionally complete as-is. If a question arises about behavior, the answer is almost certainly "that's not the Agent Loop's job — it belongs in Memory, Tools, or configuration."

---

## Success Criteria

- [ ] Agent Loop accepts messages from any source and streams responses
- [ ] Agent Loop executes tool calls the model makes without knowing what the tools do
- [ ] Agent Loop works with any model through the Model API
- [ ] Agent Loop has zero product-specific code
- [ ] Agent Loop can be replaced with a different agent loop without changing any other component
- [ ] Swapping agent loops requires only changing the Agent Loop — Memory, Tools, Client, Auth, and Models are unaffected

---

## Security Requirements

Per-component requirements from [security-spec.md](./security-spec.md). Security-spec owns the "why" (D131); this section owns the "what" for the Agent Loop.

- [ ] The Agent Loop must never store credentials, API keys, or tokens in its own state
- [ ] The Agent Loop must not persist data between loops — each loop starts clean (the model reconstitutes from Memory)
- [ ] Tool call results must be passed to the model without modification — the Agent Loop must not inject, filter, or alter tool results
- [ ] The Agent Loop must report tool execution failures to the model, not silently retry or recover
- [ ] The Agent Loop must enforce configured timeouts on tool calls — a slow or hung tool cannot block the loop indefinitely

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-01 | "No users, only owners" language pass: user → owner | Ownership model alignment (Dave W + Claude) |
| 2026-03-01 | Codex cross-reference audit fix: Boot-time configuration table cited D137 (Gateway↔Engine contract) for tool/provider config — corrected to D143 (configuration spec). | Codex audit (Dave W + Claude) |
| 2026-03-01 | Removed V1 Implementation section (Level 2 product detail — Vercel AI SDK, MCP SDK, build estimates, VoltAgent fallback). "Background gardener" → "Background task" in concurrency table. Added concurrency row for multiple simultaneous conversations (same owner, separate requests, Engine stateless between loops). | L1 cleanup (Dave W + Claude) |
| 2026-02-27 | Reordered sections (why → what → how → reference). Merged "What the Engine Is", "How the Engine Fits", and "Why the Engine Is Thin" into single "How we define the Engine" opener. Collapsed related docs table to single line. Moved "Does NOT Do" up as key conceptual boundary. | Spec reorder + trim (Dave W + Claude) |
| 2026-02-27 | Added Security Requirements section — cross-referenced from security-spec.md per T-219 | T-219 (Dave W + Claude) |
| 2026-02-23 | Initial Engine spec created from interview | Engine interview session (Dave W + Claude) |
| 2026-02-23 | Consistency pass — added V1 Implementation section (Build Our Own with Vercel AI SDK + MCP TypeScript SDK), aligned selection criteria with foundation-spec.md (added Must-Have Architecture #8/#11, Nice-to-Have #12/#13, Does NOT Need #6), updated stale D30 reference to D39-D42, replaced stale "updates deferred" note with reconciliation confirmation | Cross-doc consistency audit (Dave W + Claude) |
| 2026-02-25 | Restructured section order — what it is → how it fits → what it does → why it's thin. Removed Selection Criteria (decision made — Build Our Own, documented in V1 Implementation). Removed Harness rename history (rename complete, all docs updated). | Spec cleanup (Dave W + Claude) |

---

*The Agent Loop is intentionally the thinnest spec in the project. The value is in Your Memory, not in the loop that reads it. The Agent Loop's job is to bring the system alive and get out of the way.*
