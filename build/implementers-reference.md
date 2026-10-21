---
hide_table_of_contents: true
---

# Implementer's Reference

> Implementation contract for the Personal AI Architecture.
> No rationale, no history -- only what you need to build against.

---

## Architecture Overview

**4 components**, **2 APIs**, **3 externals**.

```mermaid
flowchart LR
    C[Clients external] -->|Gateway API| G[Gateway component]
    G -->|Auth check on every request| A[Auth component]
    G -->|POST /agent-loop/chat and SSE stream internal contract D137| E[Agent Loop component]
    E -->|Model API| M[Models external]

    G -->|Conversation store tool D152| CST[Conversation Store Tool internal]
    CST -->|Read and write conversations| YM[Your Memory platform]

    E -->|Model-driven tool calls| TR[Tool Runtime MCP CLI Native]
    TR -->|Memory tools read write edit delete search list history| YM
    TR -->|External tools| EX[External services and external memory]

    E -.->|Asks before each tool call| A
```

| Layer | Elements |
|-------|----------|
| Components | Your Memory, Agent Loop, Auth, Gateway |
| APIs | Gateway API (clients <-> Gateway), Model API (Agent Loop <-> Models) |
| Externals | Clients, Models, Tools |

---

## Components

### Your Memory (the platform)

**Zero outward dependencies.** Every other component depends on it; it depends on none.

| Property | Requirement |
|----------|-------------|
| Dependencies | None -- readable with standard tools when all components are stopped |
| Exposure | Through tools only (internal tools = the system's own interface to its platform) |
| Inspectability | Must be inspectable without the system running (text editor, file browser, database viewer) |
| Export | Must support full export in open formats from day one. Even if the implementation is a simple archive of the memory root, export is non-negotiable. |
| Version history | Required, with restore. Must record what changed (not only that something changed) and let the owner make an earlier state current again. Must be reliably established at startup: if it cannot be initialized, fail startup -- do not degrade to a warning. How it is built is up to the implementation (Git is one option). |

**Core operations:** read, write, edit, delete, search, list, history, restore (names are implementation choices)

`history` must return change records **and** previous states, not just metadata. Accept an optional version identifier to retrieve file content at that point in time. `restore` makes an earlier state current again.

A failed or conflicting write is reported to the caller, never reported as saved and never resolved silently.

**Storage mechanisms (examples):**

| Mechanism | Example implementation |
|-----------|---------------|
| Files | Markdown, plain text |
| Version history | Git, or a database with snapshots |

Implementations choose their storage mechanisms and can add more as needed (a database such as SQLite for structured queries, vector indexes for semantic search, etc.). Adding a mechanism means adding tool implementations — it doesn't change the contract. See `memory-spec.md` §How Your Memory grows.

**Substrate test:** If it stores/retrieves/searches/versions data, it belongs to Your Memory. If it interprets or produces content, it belongs to the model.

**Skills** are prompts stored in Your Memory. The model reads and follows them.

### Agent Loop (generic agent loop)

Generic, commodity, no product-specific logic.

**Loop:** accept message -> send to model -> execute tool calls -> stream response -> repeat until the model signals completion.

| Property | Requirement |
|----------|-------------|
| Configuration | Pre-configured at boot with the bootstrap prompt, tool definitions and provider adapter config. The model is not boot-time config: it arrives with each request |
| Concurrency | Must handle multiple concurrent loops independently |
| Scope | Connects models to tools -- nothing else |
| Iteration cap | The Agent Loop MUST NOT impose a default iteration cap. Implementations MAY configure a safety bound as a deployment choice. |
| Text preservation | When the model emits text and tool calls in the same turn, the Agent Loop must preserve the text in the assistant message for the next loop iteration. Do not discard streamed text on tool continuation. |

**The Agent Loop does NOT:**

- Construct prompts
- Manage skills
- Handle approval state
- Decide permissions (it asks Auth before each tool call and honours the answer)
- Decide context
- Persist conversations
- Authenticate
- Have personality

### Auth (separate component)

Independent of Gateway -- both are swappable independently. Permissions live only in Auth. Default policy: the owner can do everything; every other identity starts with nothing.

**Three operations:**

| Operation | Signature |
|-----------|-----------|
| Authenticate | request -> identity |
| Authorize | (identity, resource, action) -> allow/deny |
| Manage | modify permissions |

**Where it is called:** The Gateway calls Auth on every request, before anything reaches the Agent Loop or conversation data; unauthorized requests are rejected with 401. The Agent Loop asks Auth before each tool call; a refused call is not run and the model is told it was not permitted. If Auth is unavailable, fail closed.

**Identity transport:** the Gateway passes the canonical `auth_context` from Auth to the Agent Loop. `auth_context` contains the actor, authentication ID, timestamps, and correlation ID, but no credentials or permissions. HTTP headers, message metadata, and direct-call arguments are transport adapters for this shape; the receiving boundary verifies integrity and fails closed on missing, malformed, expired, or caller-supplied context.

**Actor types:** owner, collaborator, system agent, background agent, external agent, service, economic actor, federated

**Policy model:** `(subject, resource, action) -> effect`

**Minimal tool surface (required from day one):**

| Tool | Returns |
|------|---------|
| `auth_whoami` | Current actor identity |
| `auth_check` | Permission decision for a given resource/action |
| `auth_export` | Auth configuration minus credentials |

Data format is product-owned, not provider-specific.

### Gateway (conversations and routing)

Manages conversations and routes to the Agent Loop. Content-agnostic, interface-agnostic.

**Operations:** create conversation (implicit on first message), list, resume, history

**Guarantees:** route, persist conversations, resume, stream, content-agnostic, interface-agnostic

Stores conversations in Your Memory, including the tool calls and tool results inside them. Reads the owner's current model choice on every message and passes it to the Agent Loop.

**Gateway does NOT:**

- Interpret messages
- Execute tools
- Authenticate or decide permissions (it calls Auth and honours the answer)
- Influence model behavior
- Route to models
- Transform content
- Inject context
- Rate limit
- Filter content

---

## API Contracts

### Gateway API (Clients <-> Gateway)

How the world interacts with the system.

| Direction | Payload |
|-----------|---------|
| In | Message content (a list of parts: text first, room for images and files) + conversation ID (optional) + metadata |
| Out | Streamed response + conversation ID + message record |

Built on prevailing industry standard. Swappable via adapter.

### Model API (Agent Loop <-> Models)

How the system thinks.

| Direction | Payload |
|-----------|---------|
| In | Prompt (system instructions + conversation + tool definitions + context) |
| Out | Streamed completion (text + tool calls) |

Model-native tool calling is the current approach. Swappable via adapter.

---

## Internal Contract: Gateway <-> Agent Loop

One HTTP endpoint. Not a third API.

### `POST /agent-loop/chat`

**Request:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "..." }
      ]
    }
  ],
  "model": "...",
  "metadata": {
    "conversation_id": "conv_abc123",
    "correlation_id": "req_xyz789",
    "trigger": "message",
    "client_context": { "path": "/finances" }
  }
}
```

**Required fields:**

| Field | Required |
|-------|----------|
| `messages` | Yes |
| Model | Yes |
| `metadata.correlation_id` | Yes |
| `metadata.conversation_id` | No |
| `metadata.trigger` | No |
| `metadata.client_context` | No |

**Response:** SSE stream

| Event | Data Shape |
|-------|------------|
| `text-delta` | `{ _event_type: "text-delta", content: string }` |
| `tool-call` | `{ _event_type: "tool-call", id: string, name: string, arguments?: object }` |
| `tool-result` | `{ _event_type: "tool-result", id: string, output?: string, error?: string, error_code?: string }` |
| `done` | `{ _event_type: "done", finish_reason: string, usage?: object }` |
| `error` | `{ _event_type: "error", code: string, message: string }` |

**Pre-stream errors (HTTP status codes):**

| Code | Meaning |
|------|---------|
| 400 | Invalid request |
| 401 | Auth rejected |
| 503 | Agent Loop unavailable |

**Mid-stream error codes:** `provider_error`, `tool_error`, `auth_error`, `context_overflow`

**Error message safety:** SSE error event messages must be safe for client display. Never forward raw `Error.message`, stack traces, or file paths into the stream. Map each error code to a fixed safe message; log raw diagnostic detail to structured stdout only.

**Auth path:** Gateway calls Auth -> attach canonical `auth_context` -> reject with 401 on failure. Agent Loop verifies the internal handoff and asks Auth before each tool call -> a refused call returns a `tool-result` with `error_code: not_permitted`.

**Messages:** one shape across all three contracts. Content is a list of parts; tool calls and tool results are ordinary message parts and are saved in conversation history. The bootstrap prompt is Agent Loop configuration, so the request carries no system message.

**Errors:** every error, HTTP or SSE, carries the request's correlation ID.

---

## Responsibility Matrix

| Responsibility | Owner | NOT |
|---|---|---|
| Persist, retrieve, search, version data | Your Memory (via tools) | |
| Provide structure (paths, hierarchy) | Your Memory provides it | Model/owner decides what |
| Understand content, make meaning | Model | Your Memory, Agent Loop |
| Assemble prompts | Model reads from Your Memory | Agent Loop, Your Memory |
| Select context | Model | Your Memory, Agent Loop |
| Execute tools | Agent Loop | Your Memory |
| Decide which tools to use | Model (via agent loop) | Your Memory, Gateway |
| Execute skills | Model + Agent Loop | Your Memory |
| Protect access / permissions | Auth (called by the Gateway on every request and by the Agent Loop before each tool call) | Your Memory, Gateway, Configuration |
| Manage conversations | Gateway | Agent Loop, Your Memory |
| Route requests to Agent Loop | Gateway | Auth |
| Connect to AI models | Model API | Agent Loop internals |
| Accept client connections | Gateway API | Agent Loop |
| Provide intelligence | Models (external) | Agent Loop, Your Memory |
| Display content to owners | Clients (external) | Gateway |
| Bootstrap the system | Runtime config (4 fields) + Agent Loop config (bootstrap prompt) | Your Memory |
| Choose the model | The owner (a preference, passed with each request) | Runtime config |
| Coordinate concurrent writes and report conflicts | Tool implementations | Your Memory component |

---

## Configuration

### Runtime Config (thin bootstrap -- 4 fields)

| Field | Purpose |
|-------|---------|
| `memory_root` | Where Your Memory lives |
| `provider_adapter` | Which adapter connects to models |
| `auth_mode` | How auth works |
| `tool_sources` | Where to find installed tools |

### Where things live

| What | Where |
|------|-------|
| Preferences | Your Memory (personal data, travels with you), including the model choice |
| Permissions | Auth only (not configuration or preferences) |
| Tool definitions | Self-describing (from the tools themselves) |
| Secrets | Outside Your Memory, never in a git-tracked file: environment variables, an untracked config file, or a secret store |
| Skills | Prompts in Your Memory |
| Bootstrap prompt | One line in Agent Loop config: "Read AGENT.md for your instructions" |
| Bind address | Default loopback only (`127.0.0.1` and/or `::1`). Network binding (`0.0.0.0`, `::`, or a LAN address) requires explicit configuration. See DEPLOY-3, DEPLOY-5. |

### Boot Sequence

1. Load runtime config
2. Load adapter config
3. Discover tools
4. Mount Your Memory
5. Verify version history (for example, git init). Fail if version history cannot be established.
6. Read preferences
7. Ready

On every message, the Gateway reads the owner's current model choice and passes it with the request, so a changed choice applies to the next message with no restart.

---

## Conformance Criteria

### Swap Tests

| ID | Test | Pass Condition |
|----|------|----------------|
| SWAP-1 | Provider swap | Change `provider_adapter` + adapter config -> after a restart (allowed for a provider swap), messages use the new provider -> no code changes |
| SWAP-2 | Model swap | Change model preference in Your Memory -> next message uses new model with no restart -> no code changes |
| SWAP-3 | Tool swap | Add/remove a tool -> system functions -> no code changes |

### Architectural Invariant Tests

| ID | Test | Pass Condition |
|----|------|----------------|
| ARCH-1 | Memory zero dependencies | Stop all components except Memory storage -> still readable with standard tools |
| ARCH-2 | Agent Loop swap | Replace Agent Loop -> Gateway/Memory/Auth/tools unaffected |
| ARCH-3 | Client swap | New client speaks Gateway API -> system serves identically |
| ARCH-4 | Schema conformance | All API payloads validate against canonical schemas |
| ARCH-5 | Error taxonomy compliance | Agent Loop emits correct error codes per failure type -> no catch-all code |
| ARCH-6 | Error message sanitization | No SSE error event contains paths, stack traces, or credentials |
| ARCH-7 | Memory export | `memory_export` produces complete archive in open formats -> readable without system |
| ARCH-8 | Auth tool surface | `auth_whoami`, `auth_check`, `auth_export` exist and return correct results |
| ARCH-9 | Version history reliability | System fails to start if version history cannot be initialized -> the history operation returns previous states -> restore makes an earlier state current |

### Deployment Invariant Tests

| ID | Test | Pass Condition |
|----|------|----------------|
| DEPLOY-1 | Offline operation | Disconnect network -> system functions for all memory operations |
| DEPLOY-2 | Local data storage | All owner data on owner-controlled storage -> no silent external writes |
| DEPLOY-3 | Default localhost | Fresh install binds to localhost only |
| DEPLOY-4 | No silent outbound | No network calls except explicit provider/tool requests |
| DEPLOY-5 | Default bind address | Gateway binds only to loopback (`127.0.0.1` and/or `::1`) -> network binding requires explicit config change |

### Foundation User Story Tests

| ID | Test | Pass Condition |
|----|------|----------------|
| FS-1 | Move Your Memory | Export -> import -> preferences honored, gaps reported, nothing lost |
| FS-2 | Add capability | Add tool/skill/client/provider -> Memory gains no dependencies -> structure holds |
| FS-3 | Run on own hardware | Install locally -> no external service required -> full offline capability |
| FS-4 | Swap provider | = SWAP-1 |
| FS-5 | Swap client | = ARCH-3 |
| FS-6 | Evolve Memory | Add search capability -> no other component changes |
| FS-7 | Swap Agent Loop | = ARCH-2 |
| FS-8 | Expand scope via tools | Add tools -> broader capability -> no architectural changes |

---

## Swappability

| What | How |
|------|-----|
| Your Memory | Swappable via tools |
| Components | Swappable via contracts |
| Contracts | Swappable via adapters |
| Auth | Swappable via the Auth contract |

**Adapters** are thin, stateless translation layers. Each describable in one sentence. See [adapter-spec.md](../architecture/adapter-spec.md) §How Model Configuration Works in Practice for the concrete model/provider swap walkthrough.

**Tools** are data in the environment, not a component. Definitions self-describe, execution is the Agent Loop's job, permissions are Auth's job (asked before each call).

**Everything** is either memory (nouns/data) or tools (verbs/operations). No third category.

---

## Contract alignment

The canonical contract tree under `contracts/` is authoritative for this reference.
The internal handoff is `POST /agent-loop/chat`; it requires `model` and
`metadata.correlation_id`, uses structured message content parts, and defines the
shared stream event and error shapes. Validate implementations against the OpenAPI
files and shared JSON Schemas rather than treating this summary as a second schema.
