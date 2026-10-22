---
sidebar_label: Gateway
hide_table_of_contents: true
---

# Gateway

## What the Gateway is

The Gateway is the front door to your AI system. Every client you use (a web app, a terminal, a phone app, a chat bot, a voice assistant) connects through it, and it keeps track of your conversations.

In most AI products, the app you talk to is the whole system. The app holds your conversations and decides how you interact. If you want a different interface, you start over, and your history stays behind in the old app.

We think your conversations belong to you, not to whichever app you happened to use. You should be able to start a conversation on your laptop, continue it on your phone and pick it up in a terminal, and switch to a better app without losing anything.

So in PAA, clients sit outside the system and the Gateway sits inside it. Every client connects the same way, through the Gateway API, and the Gateway stores your conversations in Your Memory. Any client that speaks the Gateway API works, including ones that don't exist yet.

You can use any interface you like, switch whenever you want, and your conversations come with you.

<p align="center">
  <img src="../assets/readme-how-it-works.svg" alt="Interfaces connect through the Gateway API to the Gateway, which hands off to the Agent Loop. The Agent Loop calls models through the Model API and reaches Your Memory and other tools through tools. Auth checks every request." width="900" />
</p>

## How it works

The Gateway can stay simple because conversations are just data, and data lives in Your Memory. The Gateway only has to manage the flow in and out.

When a message arrives, the Gateway:

1. Asks Auth who sent it and whether they're allowed.
2. Loads the conversation from Your Memory, or starts a new one.
3. Reads your current choice of model and provider.
4. Prepares a model-sized working context from the saved conversation, then passes it, the new message, model and provider choice to the Agent Loop.
5. Streams the Agent Loop's response back to the client as it arrives, and saves the exchange to the conversation in Your Memory.

Like every other part, it reaches Your Memory through tools: a dedicated conversation tool for creating, loading, listing and saving conversations, and the Memory tools to read your model and provider choice. Even listing or reading a conversation goes through Auth first.

Just as important is what it doesn't do. It doesn't understand messages; the model does. It doesn't run the model's tools; the Agent Loop does. It doesn't decide who's allowed to do what; Auth does. It doesn't pick the model; you do. It preserves every original content part in the conversation record and never rewrites a selected part. It may select older history for the model-sized working context described below, regardless of content type.

---

The rest of this doc is the specification: what any implementation of the Gateway must do.

**Serves stories:** US-6, US-7, US-10 in the [PAA spec](../spec/personal-ai-architecture-spec.md).

This is an **Architecture spec** — it defines the generic Gateway that anyone could implement. Product-specific extensions (client metadata, browsing API, conversation UI conventions) are implementation opinions.

## What the Gateway does and doesn't do

### Its job alongside the Agent Loop

The Gateway sits between clients and the Agent Loop. Their relationship:

| Gateway's job | Agent Loop's job |
|--------------|-------------|
| Manage conversations (create, list, resume, store) | Process individual interactions (message → model → tools → response) |
| Package a bounded working context from conversation history, with the owner's current model and provider choice, and pass it to the Agent Loop | Accept message + working context + model + provider as input, return streamed response; check each model call fits |
| Store the Agent Loop's response in the conversation, with the model and provider that produced it (D194) | Stream the response back, then it's done |
| Handle multiple clients connecting simultaneously; serialize messages within each conversation and queue later messages in arrival order | Handle the agent loop for each interaction; different conversations may run concurrently |

The Gateway knows about conversations. The Agent Loop doesn't. The Agent Loop knows about models and tools. The Gateway doesn't. Clean separation.

### What the Gateway does not do

These are explicit boundaries. They exist to prevent the Gateway from becoming opinionated or absorbing responsibilities that belong elsewhere.

| Responsibility | Where it lives | NOT in the Gateway |
|---------------|---------------|-------------------|
| Understanding content | The model | Gateway doesn't interpret messages |
| Executing model-driven tools | The Agent Loop | Gateway doesn't execute tool calls from the model (it uses the conversation store tool for its own operational needs — D152) |
| Authenticating requests and deciding permissions | Auth | Gateway calls Auth on every request and honours the answer, but doesn't verify identity or hold permissions itself |
| Deciding what the model should do | Skills/instructions in Your Memory | Gateway doesn't supply product instructions; its history selection only enforces the model's size bound |
| Choosing which model and provider to use | The owner (a preference) | Gateway reads the owner's current model and provider choice on every message and passes them to the Agent Loop; it doesn't pick a model or provider or route to models |
| Content processing (speech-to-text, image analysis) | Model capabilities or tools | Gateway doesn't transform content |
| Context injection (client metadata, folder scoping) | The interface sends it, the model reads it | Gateway passes metadata through — it doesn't add or interpret it |
| Owning the storage mechanism | Your Memory | Gateway stores conversations in Your Memory but doesn't define how Your Memory works |
| Rate limiting | Operational / hosting concern | The architecture sets no rate-limit policy; the Gateway provides extension points that implementations configure |
| Content filtering | Model or operational policy | Gateway doesn't filter |

The context injection boundary is worth emphasizing. D20 says the client sends client metadata (folder path, context files) alongside messages. The Gateway passes that metadata through. Its separate context-window job selects saved history by size and turn boundary; it does not decide which client files matter or interpret message meaning.

### Preparing the model working context (GAP-PAA-20 proposal)

The full conversation in Your Memory and the messages sent to the Agent Loop are different things. The Gateway preserves the original current message, assistant replies, tool calls and tool results in the conversation record. For each request it reads the owner's selected provider and model (D193) and prepares only the history that can fit the safe limit for that pair. Each provider profile holds limits for its models; a deployment may record a verified conservative limit when the provider does not publish one. If no safe limit exists for the selected pair, the Gateway reports `context_limit_unknown` instead of assuming one universal window.

Gateway and Agent Loop use the same provider-profile model-limit source. An adapter does not decide which conversation content to keep.

The budget includes the current message and an allowance for the Agent Loop's bootstrap instructions, tool definitions, protocol overhead and model response. Older complete turns may be omitted from the working context. As one narrow exception to D59's no-context-injection rule, the Gateway may mechanically extract a bounded summary from omitted turns, without a model call or semantic rewriting. It sends that derived text in the separate `context_summary` field, never as a stored owner or assistant message. The Agent Loop marks the summary as derived data for content separation and presents it to the model as an explicitly labelled, ephemeral `user`-role context message before the selected history; the label says it was generated by the Gateway and is not a new owner request. It is never a second system instruction. The original conversation remains in Your Memory. When history is omitted or summarized, the Gateway sends `context_notice` before model output; clients show it to the owner and can offer access to the full history. This event is absent when no history was left out.

The Gateway does not truncate or rewrite the current message, a selected message part, or a selected tool result to make the budget fit. It keeps tool-call/result relationships intact when selecting history. If the current message plus required overhead cannot fit, it reports `context_overflow` before dispatch. The Agent Loop separately checks every actual model call, including calls after live tool results arrive.

---

## What the Gateway guarantees

| # | Guarantee | What it means |
|---|-----------|--------------|
| 1 | **Route** | Permitted messages from any interface reach the Agent Loop with the right conversation context |
| 2 | **Persist conversations** | Messages and responses, including the tool calls and tool results inside them, are stored in Your Memory — nothing is lost between interactions |
| 3 | **Resume** | Any client can pick up any conversation where it left off |
| 4 | **Stream** | Responses from the Agent Loop stream back to the calling client in real time |
| 5 | **Content-agnostic** | Message content is a list of parts — text first, with room for images, audio, video and files — and the Gateway saves every part and passes selected parts through without interpretation |
| 6 | **Interface-agnostic** | Web, CLI, mobile, bot, voice, future paradigms — the Gateway serves them all identically |

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

## The Gateway contract

The Gateway ↔ Agent Loop interface is defined in [gateway-agent-loop-contract.md](./gateway-agent-loop-contract.md) (D137). The Gateway calls Auth, then packages the messages array (selected conversation history + unchanged current message), the model and provider choice it has just read, and metadata, and POSTs to the Agent Loop. The bootstrap prompt is not part of the request: it is the Agent Loop's own configuration. The Agent Loop returns an SSE stream. All three contracts use one message shape, with tool calls and tool results as ordinary parts of messages, so what the Agent Loop streams back can be stored and replayed as history without conversion.

Where a product enables approvals, the Gateway forwards the canonical `approval-request` and `approval-result` events and accepts decisions through the product's Gateway route. It does not approve locally: Auth verifies authority, and `request_id` makes terminal decisions replay-safe.

### What the Gateway adds to each request

Before it POSTs to the Agent Loop, the Gateway:

- Generates the correlation ID that traces the request end to end, before it calls Auth
- Attaches the canonical `auth_context` for the actor Auth identified: the actor, an authentication ID, timestamps and the same correlation ID, never credentials or permissions

These must survive a replacement of either the Gateway or the Agent Loop (AC-7.2). The full field list is in [gateway-agent-loop-contract.md](./gateway-agent-loop-contract.md).

### How the Gateway reaches Your Memory

The Gateway uses its conversation store tool for conversations (D152), and reads the owner's model and provider choice through the Memory tools on every message (see [configuration-spec.md](./configuration-spec.md) "How the System Boots").

The Gateway doesn't go through the agent loop's tool loop (that would be circular — the Gateway needs conversation history to assemble the request it's about to send to the Agent Loop). It calls the conversation store tool directly. Same tool interface, different caller — one key to the mailbox, not a copy of every key to every room.

### Concurrent messages in one conversation

The Gateway permits different conversations to run concurrently, but it allows only one active Agent Loop turn per conversation. If another message arrives while that turn is active, the Gateway queues it in arrival order and starts it after the current turn reaches `done` or `error`. It never starts two loops that can append to the same conversation at once. Queueing state is implementation-defined; a request that cannot be queued is reported as an error rather than accepted silently.

This ordering rule protects the conversation history while preserving the ability for any client to resume the conversation.

This follows the zero-outward-dependencies principle. The dependency points the right way: the Gateway depends on Your Memory (it reads and writes conversation data there through the tool), but Your Memory doesn't depend on the Gateway. Remove the Gateway, and Your Memory still sits there — conversations intact, readable with a text editor. Replace the Gateway with a different one, and it uses the same conversation store tool to pick up the same conversations. Your Memory never knew the Gateway existed.

### Input

| Field | Description | Required |
|-------|-------------|----------|
| Conversation ID | Which conversation this message belongs to (omit to create new) | No |
| Message content | The actor's message, as a list of content parts (text first; images, files and other types as further parts) | Yes |
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
| Resume | Conversation ID + new message | Response with model-sized working context; full history remains available through History |
| History | Conversation ID | All messages in the conversation, including tool calls and tool results |

### Error output

| Condition | Gateway behavior |
|-----------|-----------------|
| Agent Loop unreachable | Report failure to caller |
| Conversation not found | Report to caller |
| Storage failure | Report to caller; if the initial message cannot be persisted, do not dispatch it |
| Agent Loop fails after the stream starts | Preserve the incoming message, observed partial response and tool events with an explicit error outcome; never report the turn as complete |
| Invalid input | Reject with error |

---

## Checking an implementation

Items marked *(security)* are the per-component requirements from [security-spec.md](./security-spec.md), which owns the "why" (D131).

- [ ] The Gateway manages conversations — create, list, resume, store messages — without any interface-specific logic
- [ ] Any client can connect to the Gateway and have a conversation
- [ ] Conversations survive interface switches — start on one client, continue on another, no data lost
- [ ] The Gateway passes any content type through without interpretation — text, images, audio, video, files
- [ ] The Gateway routes to the Agent Loop without knowing what the Agent Loop does with the message
- [ ] Every request passes an Auth check before it reaches the Agent Loop or conversation data
- [ ] Auth and the Gateway are independent — swapping either doesn't require changing the other
- [ ] A changed model or provider choice applies to the next message with no restart
- [ ] Tool calls and tool results are saved in conversation history and come back when a conversation is resumed
- [ ] Full conversation history stays available across model changes; a resumed model call receives a bounded working context for the selected model
- [ ] The budget accounts for bootstrap instructions, tool definitions, protocol overhead and response headroom; a selected message is never silently truncated
- [ ] The Gateway sends `context_notice` when older history was omitted or summarized so clients can show it to the owner; an oversized current message produces `context_overflow`
- [ ] The Agent Loop remains generic — adding the Gateway didn't push conversation management into the Agent Loop
- [ ] Your Memory remains unopinionated — conversations are stored as data, Your Memory doesn't know they're conversations
- [ ] The Gateway must validate input structure before routing to the Agent Loop — reject malformed requests *(security)*
- [ ] The Gateway must enforce request size limits — configurable, with sensible defaults *(security)*
- [ ] The Gateway must not interpret, filter, or modify stored message content; selecting complete older turns for a model-sized working context is permitted (D59) *(security)*
- [ ] The Gateway must provide extension points for rate limiting and abuse detection — implementations configure policies *(security)*
- [ ] The Gateway must support TLS for all external-facing connections *(security)*

---

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D57 | The client is not a component — it's any external client that connects through the Gateway | The system is Your Memory + Agent Loop + Auth + Gateway. Web apps, CLIs, mobile apps, bots, voice assistants — these are all external clients. None are part of the system. Same pattern as Claude: the web app is not Claude. It connects to Claude. Clients connect to the system through the Gateway. |
| D58 | The Gateway is a new component — manages conversations and routes interactions to the Agent Loop | Without the Gateway, the Agent Loop would need to manage conversations (violates D39 — Agent Loop is generic) or Memory would need conversation awareness (violates D43 — Memory is unopinionated) or every client would independently manage conversations (duplicated, inconsistent). The Gateway fills this gap. |
| D59 | The Gateway is generic, content-agnostic, and interface-agnostic in the architecture | Same principle as Agent Loop (generic loop) and Your Memory (unopinionated substrate). The Gateway passes any content type through without interpretation and serves any client identically. The sole bounded exception is mechanical extraction of omitted older turns into a separate, derived-data `context_summary`; it never rewrites saved content or adds product-specific logic. |
| D60 | Auth is independent of the Gateway | Neither depends on how the other is built, and both can be swapped independently. The Gateway calls Auth on every request before anything reaches the Agent Loop (D176). |
| D61 | Conversations live in the system, not in any client — enabling seamless client switching | Conversations are data in Your Memory, managed by the Gateway. Start on web, continue on mobile, pick up on CLI. The conversation persists regardless of which client connects. This is what makes clients truly external and interchangeable. |
| D62 | Models are external intelligence, not a system component — addressed in Models interview | The interview raised the question of whether Models is a component. Models are called through the Model API but aren't part of the system the way Your Memory, Agent Loop, Auth, and Gateway are. Full treatment deferred to the Models interview. |
| D137 | Gateway ↔ Agent Loop is a plain HTTP API contract | `POST /agent-loop/chat` with messages array, model, provider and metadata. Agent Loop returns SSE stream. Tool definitions are boot-time; the model and provider travel with each request. See [gateway-agent-loop-contract.md](./gateway-agent-loop-contract.md). |
| D152 | Gateway accesses Your Memory through a dedicated conversation store tool, not directly | Purpose-built internal tool for conversation management (store, load, list, create). Same tool interface as memory tools, called directly by Gateway — not through Agent Loop's tool loop (circular dependency). One key to the mailbox, not a copy of every key. |

---

## Contract alignment

The canonical contract tree under `contracts/` is authoritative for the Gateway API,
the internal `/agent-loop/chat` handoff, and the shared structured message shape.
This spec defines the Gateway responsibilities those contracts expose: Auth before
protected work, conversation persistence through Memory, model propagation, and
lossless tool-call/tool-result history.
