---
sidebar_label: Agent Loop
hide_table_of_contents: true
---

# Agent Loop Spec

**Serves stories:** US-5, US-7, US-8 in the [PAA spec](../spec/personal-ai-architecture-spec.md).

Every AI system has an agent loop — ChatGPT runs a loop that calls tools and streams responses, Copilot runs a loop that reads code and suggests completions, every agent framework implements the same message → model → tool → response cycle. So what's different here?

Nothing. That's the point. **The Agent Loop is intentionally generic — a commodity component with no product-specific logic.** Its job is to connect a model to tools and stream results back. Think of it as a hand. A hand can grip any tool — hammer, pen, scalpel, phone. It doesn't need to be rebuilt for each one. It doesn't know what it's holding or why. The brain decides what to pick up and what to do with it. The hand executes.

A skilled surgeon and an untrained person have the same hands. The difference is the brain directing them — the knowledge, the training, the judgment. Same here. What's different about any product built on this architecture isn't the Agent Loop — it's what's in Memory. Everything that makes a product unique — the methodology, the personality, the skills, the approval flow, the scope constraints — lives in **Your Memory**, not in the Agent Loop. The Agent Loop reads Your Memory through tools. The model finds instructions, context, and knowledge in the files. Product behavior emerges from what's in memory, not from custom agent loop code.

Why this matters: a generic agent loop can pick up any tool the ecosystem produces — MCP servers, CLI tools, new integrations — without modification. A product-specific one could only pick up product-shaped things. The moment you bake domain logic into the agent loop, you tie what the system does to how it works, and that's how you get locked in. The analogy: a Toyota engine and a Honda engine work the same way. What makes the car different is everything else — the body, the interior, the features, the driving experience. The Agent Loop is the boring, interchangeable part. That's a feature, not a limitation.

AI tool use collapsed the engineering cost of capabilities from "build across four layers" to "add a tool." The model is now good enough at deciding which tools to use and how to compose them without being told. This means the agent loop itself doesn't need to be smart — it just needs to reliably connect a model to tools and get out of the way.

The Agent Loop sits in the middle of the foundation's flow: clients connect through the Gateway, the Gateway routes to the Agent Loop, the Agent Loop calls models through the Model API and executes tools from the environment. Your Memory is the platform — the Agent Loop reads and writes to it through tools. The Gateway ↔ Agent Loop interface is defined in [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md) (D137). The Agent Loop receives a messages array (conversation history + current message), the model to use for this request, and metadata via `POST /agent-loop/chat`, then returns an SSE stream of events (text-delta, tool-call, tool-result, optional approval-request/approval-result, done, error). The Agent Loop adds its own bootstrap prompt from its configuration. Messages use one shape across all three contracts: tool calls and tool results are ordinary parts of messages, so they travel in conversation history like everything else. The Gateway calls Auth on every request before anything reaches the Agent Loop, and the Agent Loop asks Auth before each tool call.

**Related documents:** [overview.md](../architecture/overview.md) (architecture overview, links to all component specs)

---

## What the Agent Loop Does NOT Do

These are explicit boundaries. They exist to prevent product-specific logic from creeping into the Agent Loop over time.

| Responsibility | Where It Lives | NOT in the Agent Loop |
|---------------|---------------|-------------------|
| Prompt assembly | **The model** reads context files from Your Memory through tools | Agent Loop does not construct product-specific prompts |
| Skill execution | Your Memory (skill files read and followed by the model) | Agent Loop does not have a skill framework |
| Approval flow | Auth (the owner's rules) + tools + model instructions. Whether anything asks the owner first is the product's choice; the architecture default is that the owner can do everything | Where enabled, the Agent Loop emits the canonical pending request and terminal outcome events but does not own approval authority |
| Scope constraints | Tool configuration (which tools are available) + Auth (which tools this actor may call) | Agent Loop asks Auth before each tool call and honours the answer; it does not decide permissions itself |
| Context loading | Model reads files through tools based on its instructions | Agent Loop does not decide what context to load |
| Conversation persistence | External storage (SQLite, files) accessed through tools or configuration | Agent Loop does not own conversation storage |
| Context window management | Model/provider handles compaction, or instructions tell the model how to summarize | Agent Loop does not decide what to cut |
| Error recovery | Agent Loop reports failures; the model or caller decides what to do | Agent Loop does not retry or recover |
| Authentication | The Gateway calls Auth on every request before it reaches the Agent Loop | Agent Loop does not authenticate requests |
| Product personality | System prompt and memory files | Agent Loop has no personality |

---

## What the Agent Loop Does

The Agent Loop runs a loop:

1. **Accept a message** — from the Gateway (which routes requests from clients, API calls, scheduled triggers, or other agents)
2. **Send it to a model** — the model named in the request, along with a system prompt, tool definitions, and conversation history, through the Model API
3. **Execute tool calls** — whatever the model decides to do, through the tool protocol. Before each call, the Agent Loop asks Auth whether this actor may make it; a call Auth refuses is not run, and the model is told it was not permitted
4. **Stream the response back** — to the Gateway
5. **Repeat** — until the model signals it's done

That's the complete behavior. Five steps.

---

## What the Agent Loop Guarantees

- Messages sent to the Agent Loop reach the model
- Tool calls the model makes get executed
- Responses stream back to the caller
- The loop continues until the model signals completion. The Agent Loop MUST NOT impose a default iteration cap. Implementations MAY configure a safety bound as a deployment choice, but the Agent Loop itself never terminates the loop before the model signals done.
- When the model emits text and tool calls in the same turn, the Agent Loop preserves the text in the assistant message for the next loop iteration. Streamed text is never silently discarded on tool continuation.
- The model can dispatch multiple tool calls in parallel within a single loop — the Agent Loop executes independent calls concurrently, preserves stable call/result association, and keeps dependent calls ordered before returning all results

---

## Concurrency

The Agent Loop is one brain with two hands — one model that can dispatch multiple tool executions in parallel. The model coordinates because it initiated all of them. It knows the left hand is reorganizing the filing cabinet, so it tells the right hand to wait before pulling from the same drawer.

This is the only concurrency the Agent Loop needs to handle: **parallel tool execution within a single loop.** The model calls several tools at once (read a file while a background task runs), the Agent Loop executes independent calls concurrently, keeps dependent calls ordered, results come back, and the model decides what's next.

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
| Conversation history | Prior messages in this conversation, including the tool calls and tool results they contain | No (first message has none) |
| Model | The model to use for this request. The Gateway reads the owner's current model choice on every message and passes it here, so a changed choice applies to the next message with no restart | Yes |

### Boot-Time Configuration

| Field | Description | Source |
|-------|-------------|--------|
| Bootstrap prompt | Minimal startup instructions for the model (e.g., "Read AGENT.md for your instructions"). The model constructs its working context by reading Memory through tools. | Agent Loop configuration (D50) |
| Tool definitions | What tools are available | Pre-configured from tool sources (D143 — does not change per-request) |
| Provider configuration | Which provider adapter, and a reference to the API key | Runtime config + adapter. The model is not boot-time configuration: it arrives with each request |

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
| Tool call not permitted by Auth | Report to the model that the call was not permitted (model decides next step) |
| Provider timeout | Report failure to caller |
| Invalid input | Reject with error |

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D39 | The Agent Loop is a generic agent loop with no product-specific logic | Composability. A generic agent loop can pick up any tool the ecosystem produces. A domain-specific agent loop can only pick up domain-shaped things. Lock-in comes from tying what you do to how the agent loop works. |
| D40 | Prompt assembly and skill execution live in Your Memory, not the Agent Loop | The model reads skills and context through tools. Product behavior emerges from what's in the files, not from custom agent loop code. Same principle as D39 — don't tie intelligence to the loop. |
| D41 | The "harness" concept is replaced by Agent Loop + the other components working together | The harness was an abstraction for something that's actually just Your Memory + Agent Loop + Tools + Models. The agent isn't a component — it's what emerges when you connect the pieces. |
| D42 | Engine renamed from "Harness" — "Engine" reflects that it's a commodity component | Every engine does the same thing. What makes the car different is everything around it. The Engine is the boring, interchangeable part. |
| D50 | Bootstrap prompt is Agent Loop configuration — minimal seed that lets the model self-bootstrap from Your Memory | One line: "Read the entry point in the current folder." Everything else the model discovers from Your Memory by following that instruction. |
| D108 | Model API must remain an API, not a tool | The model decides what tools to call — you can't use a tool to call the thing that decides which tools to use. Circular dependency. The Model API is structurally different from tools. |
| D137 | Gateway ↔ Agent Loop is a plain HTTP API contract | `POST /agent-loop/chat` with messages array, model and metadata. Agent Loop returns SSE stream. See [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md). |

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

## Contract alignment

The canonical `contracts/openapi/gateway-engine.yaml` and shared message schema are
authoritative for the internal route, request fields, structured message parts, and
stream event shapes. The Model API handoff is streaming-only (`stream: true`), and
its events are discriminated by `_event_type`. This spec describes the ownership and
behavioral requirements behind those canonical definitions.

---

*The Agent Loop is intentionally the thinnest spec in the project. The value is in Your Memory, not in the loop that reads it. The Agent Loop's job is to bring the system alive and get out of the way.*
