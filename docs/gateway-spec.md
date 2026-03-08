---
sidebar_label: Gateway
hide_table_of_contents: true
---

# Gateway Spec: Conversations and Routing

Every AI system has a way for users to interact — ChatGPT has its web app, Copilot integrates into your editor, agent frameworks expose REST APIs. So what's different here?

In those systems, the interaction point **is** the application. The app manages conversations, the app defines how you interact, and if you want a different interface, you either start over or lose your history.

Here, the interaction point is separated from the client. **The Gateway manages conversations and routes interactions to the Agent Loop — clients are external (D57).** Web, CLI, mobile, Discord, voice, whatever comes next — they all connect through the Gateway identically. The Gateway doesn't care what client is connecting. It doesn't care what content is flowing through — text, images, audio, video, files — it's all just data. It manages the conversation lifecycle and routes interactions to the Agent Loop.

Why this matters: because conversations live in the system (managed by the Gateway, stored in Your Memory), switching clients is seamless. Start a conversation on web, continue on mobile, pick it up on the CLI. The conversation persists regardless of which client connects. New interaction paradigms connect without system changes. No lock-in to any interface.

The Gateway is to the system what the front door is to a building. It doesn't care who you are (Auth handles identity) or what you're carrying (the Agent Loop handles processing). It manages the flow in and out. Auth is a **cross-cutting layer** independent of the Gateway — requests must be authenticated before interacting with the system, but how (middleware, proxy, sidecar) is an implementation decision. Both can be swapped independently, and neither has opinions about the other's implementation.

Conversations are data. Data lives in Your Memory. Both the Gateway and the Agent Loop are components that speak to Your Memory via tools — the difference is the Gateway always speaks to Your Memory via the same tool. The Agent Loop uses whatever tools the model decides to — read this file, search for that, write something new — exploratory and different every time. The Gateway uses one tool for one purpose: a dedicated **conversation store tool** for storing messages, loading conversations, listing, and creating (D152). Mechanical, predictable, same every time.

The Gateway doesn't go through the agent loop's tool loop (that would be circular — the Gateway needs conversation history to assemble the request it's about to send to the Agent Loop). It calls the conversation store tool directly. Same tool interface, different caller — one key to the mailbox, not a copy of every key to every room.

This follows the zero-outward-dependencies principle. The dependency points the right way: the Gateway depends on Your Memory (it reads and writes conversation data there through the tool), but Your Memory doesn't depend on the Gateway. Remove the Gateway, and Your Memory still sits there — conversations intact, readable with a text editor. Replace the Gateway with a different one, and it uses the same conversation store tool to pick up the same conversations. Your Memory never knew the Gateway existed.

This is an **Architecture spec** — it defines the generic Gateway that anyone could implement. Product-specific extensions (client metadata, browsing API, conversation UI conventions) are implementation opinions.

**Related documents:** [foundation-spec.md](./foundation-spec.md) (architecture overview, links to all component specs)

---

## What the Gateway Does NOT Do

These are explicit boundaries. They exist to prevent the Gateway from becoming opinionated or absorbing responsibilities that belong elsewhere.

| Responsibility | Where it lives | NOT in the Gateway |
|---------------|---------------|-------------------|
| Understanding content | The model | Gateway doesn't interpret messages |
| Executing model-driven tools | The Agent Loop | Gateway doesn't execute tool calls from the model (it uses the conversation store tool for its own operational needs — D152) |
| Authenticating requests | Auth (cross-cutting layer) | Gateway doesn't verify identity |
| Deciding what the model should do | Skills/instructions in Your Memory | Gateway doesn't influence model behavior |
| Choosing which model to use | Provider configuration / Agent Loop | Gateway doesn't route to models |
| Content processing (speech-to-text, image analysis) | Model capabilities or tools | Gateway doesn't transform content |
| Context injection (client metadata, folder scoping) | The interface sends it, the model reads it | Gateway passes metadata through — it doesn't add or interpret it |
| Owning the storage mechanism | Your Memory | Gateway stores conversations in Your Memory but doesn't define how Your Memory works |
| Rate limiting | Operational / hosting concern | Gateway doesn't throttle |
| Content filtering | Model or operational policy | Gateway doesn't filter |

The context injection boundary is worth emphasizing. D20 says the client sends client metadata (folder path, context files) alongside messages. It would be tempting to have the Gateway handle this — "when the owner is in a certain context, automatically attach the right files." But that's an implementation opinion. In the architecture, the Gateway passes through whatever the client sends. It doesn't add, modify, or interpret content. Making the Gateway context-aware would make it product-specific.

---

## What the Gateway Guarantees

| # | Guarantee | What it means |
|---|-----------|--------------|
| 1 | **Route** | Messages from any interface reach the Agent Loop with the right conversation context |
| 2 | **Persist conversations** | Messages and responses are stored in Your Memory — nothing is lost between interactions |
| 3 | **Resume** | Any client can pick up any conversation where it left off |
| 4 | **Stream** | Responses from the Agent Loop stream back to the calling client in real time |
| 5 | **Content-agnostic** | Text, images, audio, video, files — the Gateway passes any data type through without interpretation |
| 6 | **Interface-agnostic** | Web, CLI, mobile, bot, voice, future paradigms — the Gateway serves them all identically |

---

## Gateway and the Agent Loop

The Gateway sits between clients and the Agent Loop. Their relationship:

| Gateway's job | Agent Loop's job |
|--------------|-------------|
| Manage conversations (create, list, resume, store) | Process individual interactions (message → model → tools → response) |
| Package conversation history and pass it to the Agent Loop | Accept message + history as input, return streamed response |
| Store the Agent Loop's response in the conversation | Stream the response back, then it's done |
| Handle multiple clients connecting simultaneously | Handle the agent loop for each interaction |

The Gateway knows about conversations. The Agent Loop doesn't. The Agent Loop knows about models and tools. The Gateway doesn't. Clean separation.

The Gateway ↔ Agent Loop interface is defined in [gateway-engine-contract.md](./gateway-engine-contract.md) (D137). The Gateway assembles the messages array (system prompt from config + conversation history + current message + metadata) and POSTs to the Agent Loop. The Agent Loop returns an SSE stream. Auth middleware sits on the path.

---

## Clients

Clients are not components of the system. They connect through the Gateway (D57). Any client that can:

1. Send a message (any content type) to the Gateway
2. Receive a streamed response
3. Optionally manage conversations (create, list, resume)

...is a valid client. The system doesn't know or care what the client looks like, what platform it runs on, or how it presents information to the owner.

### Examples of clients (all external, all valid)

| Client | How it connects |
|-----------|----------------|
| Web app | HTTPS to the Gateway |
| CLI / terminal | Direct call to the Gateway |
| Mobile app | HTTPS to the Gateway |
| Discord / Slack bot | Bot receives messages, forwards to Gateway, returns response |
| Voice assistant | Speech-to-text → Gateway → text-to-speech (processing external to Gateway) |
| Another AI agent | API call to the Gateway |
| Future paradigm | Whatever it is, it talks to the Gateway |

---

## The Gateway Contract

### Input

| Field | Description | Required |
|-------|-------------|----------|
| Conversation ID | Which conversation this message belongs to (omit to create new) | No |
| Message content | The owner's message — any content type | Yes |
| Metadata | Anything the client wants to pass through (client metadata) | No |

### Output

| Field | Description |
|-------|-------------|
| Streamed response | The Agent Loop's response, delivered as it's produced |
| Conversation ID | The conversation this response belongs to |
| Message record | Confirmation that the message and response were stored |

### Conversation management

| Operation | Input | Output |
|-----------|-------|--------|
| Create | (implicit — send a message without conversation ID) | New conversation ID + response |
| List | Query parameters (optional — time range, search) | Conversation summaries |
| Resume | Conversation ID + new message | Response with full history context |
| History | Conversation ID | All messages in the conversation |

### Error output

| Condition | Gateway behavior |
|-----------|-----------------|
| Agent Loop unreachable | Report failure to caller |
| Conversation not found | Report to caller |
| Storage failure | Report to caller — message may not have been persisted |
| Invalid input | Reject with error |

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D57 | The client is not a component — it's any external client that connects through the Gateway | The system is Your Memory + Engine + Auth + Gateway. Web apps, CLIs, mobile apps, bots, voice assistants — these are all external clients. None are part of the system. Same pattern as Claude: the web app is not Claude. It connects to Claude. Clients connect to the system through the Gateway. |
| D58 | The Gateway is a new component — manages conversations and routes interactions to the Engine | Without the Gateway, the Engine would need to manage conversations (violates D39 — Engine is generic) or Memory would need conversation awareness (violates D43 — Memory is unopinionated) or every client would independently manage conversations (duplicated, inconsistent). The Gateway fills this gap. |
| D59 | The Gateway is generic, content-agnostic, and interface-agnostic at Level 1 | Same principle as Engine (generic loop) and Your Memory (unopinionated substrate). The Gateway passes any content type through without interpretation. It serves any client identically. It doesn't inject context, filter content, or have product-specific logic. |
| D60 | Auth is a cross-cutting concern — independent of the Gateway | Auth and the Gateway don't know about each other. Requests must be authenticated before interacting with the system, but how (middleware, proxy, sidecar) is a Level 2 decision. Both can be swapped independently. |
| D61 | Conversations live in the system, not in any client — enabling seamless client switching | Conversations are data in Your Memory, managed by the Gateway. Start on web, continue on mobile, pick up on CLI. The conversation persists regardless of which client connects. This is what makes clients truly external and interchangeable. |
| D62 | Models are external intelligence, not a system component — addressed in Models interview | The interview raised the question of whether Models is a component. Models are called through the Provider API but aren't part of the system the way Your Memory, Engine, Auth, and Gateway are. Full treatment deferred to the Models interview. |
| D137 | Gateway ↔ Engine is a plain HTTP API contract | POST /engine/chat with messages array + metadata. Engine returns SSE stream. Auth middleware on path. Tool definitions and provider config are boot-time, not per-request. See [gateway-engine-contract.md](./gateway-engine-contract.md). |
| D152 | Gateway accesses Your Memory through a dedicated conversation store tool, not directly | Purpose-built internal tool for conversation management (store, load, list, create). Same tool interface as memory tools, called directly by Gateway — not through Engine's tool loop (circular dependency). One key to the mailbox, not a copy of every key. |

---

## Open Questions

- [x] **OQ-1: Is Models a system component or external intelligence?** **Resolved.** D63 established that Models are external intelligence, not a component. The system calls a model through the Provider API — it doesn't contain one. Final architecture (D64): 4 components, 2 APIs, 3 external dependencies.

---

## Success Criteria

- [ ] The Gateway manages conversations — create, list, resume, store messages — without any interface-specific logic
- [ ] Any client can connect to the Gateway and have a conversation
- [ ] Conversations survive interface switches — start on one client, continue on another, no data lost
- [ ] The Gateway passes any content type through without interpretation — text, images, audio, video, files
- [ ] The Gateway routes to the Agent Loop without knowing what the Agent Loop does with the message
- [ ] Auth and the Gateway are fully independent — swapping either doesn't affect the other
- [ ] The Agent Loop remains generic — adding the Gateway didn't push conversation management into the Agent Loop
- [ ] Your Memory remains unopinionated — conversations are stored as data, Your Memory doesn't know they're conversations

---

## Security Requirements

Per-component requirements from [security-spec.md](./security-spec.md). Security-spec owns the "why" (D131); this section owns the "what" for the Gateway.

- [ ] The Gateway must validate input structure before routing to the Agent Loop — reject malformed requests
- [ ] The Gateway must enforce request size limits — configurable, with sensible defaults
- [ ] The Gateway must not interpret, filter, or modify message content — content-agnostic (D59)
- [ ] The Gateway must provide extension points for rate limiting and abuse detection — implementations configure policies
- [ ] The Gateway must support TLS for all external-facing connections

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-01 | "No users, only owners" language pass: user → owner | Ownership model alignment (Dave W + Claude) |
| 2026-03-01 | D152: Gateway uses conversation store tool, not direct storage access. "Direct access" language replaced. "Does NOT Do" row clarified (model-driven tools vs operational tool). Dependency direction paragraph retained. | Architecture review (Dave W + Claude) |
| 2026-02-27 | Reordered sections (why → what → how → reference). Merged "What the Gateway Is", "Gateway and Auth", "Gateway and Memory", and "Level 1/2/3 Distinction" into single "How we define the Gateway" opener. Collapsed related docs table to single line. Moved "Does NOT Do" up as key conceptual boundary. Folded "Switching clients" into opener. | Spec reorder + trim (Dave W + Claude) |
| 2026-02-27 | Added Security Requirements section — cross-referenced from security-spec.md per T-219 | T-219 (Dave W + Claude) |
| 2026-02-23 | Initial Interface & Gateway spec created from interview — Interface is not a component, Gateway is a new component | Interface interview session (Dave W + Claude) |
| 2026-02-23 | Consistency pass — added V1 Implementation section (Build Our Own with Hono + SQLite), marked OQ-1 resolved (D63: Models are external intelligence) | Cross-doc consistency audit (Dave W + Claude) |
| 2026-02-25 | Trimmed intro — removed Interface justification, Gateway rationale, and architecture impact sections (all settled). Renamed to Gateway spec. | Spec refinement (Dave W + Claude) |

---

*The Gateway is the door. Auth checks who's coming in. The Agent Loop processes what arrives. Your Memory persists what matters. Four components, two APIs, infinite clients.*
