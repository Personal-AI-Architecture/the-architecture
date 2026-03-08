---
hide_table_of_contents: true
---

# Implementer's Reference

> Implementation contract for the Personal AI Architecture.
> No rationale, no history -- only what you need to build against.

---

## Architecture Overview

**4 components**, **2 APIs**, **3 externals**.

```
                              +-----------------------------------------------+
                              |                  YOUR MEMORY                  |
                              |                 (the platform)                |
                              +-----------------------^-----------------------+
                                                      |
                                             tools (read/write)
                                                      |
      Clients  -->  Gateway API  -->  Gateway  -->  Engine  -->  Provider API  -->  Models
    (external)        (API)        (component)  (component)       (API)          (external)
                                                      |
                        --- Auth ---                  +--> Tools (verbs)  -->  External Memory (nouns)
                        (cross-cutting                     |-- MCP servers      |-- Salesforce data
                         component,                        |-- CLI tools        |-- Weather services
                         applies to all                    +-- Native functions +-- The internet
                         requests)
```

| Layer | Elements |
|-------|----------|
| Components | Your Memory, Engine, Auth, Gateway |
| APIs | Gateway API (clients <-> Gateway), Provider API (Engine <-> Models) |
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
| Export | Must support full export in open formats |

**Core operations:** read, write, edit, delete, search, list, history

**Storage mechanisms:**

| Mechanism | Implementation |
|-----------|---------------|
| Files | Markdown, plain text |
| Database | SQLite |
| Version control | Git |
| Index | Vector (future) |

**Substrate test:** If it stores/retrieves/searches/versions data, it belongs to Your Memory. If it interprets or produces content, it belongs to the model.

**Skills** are prompts stored in Your Memory. The model reads and follows them.

### Engine (generic agent loop)

Generic, commodity, no product-specific logic.

**Loop:** accept message -> send to model -> execute tool calls -> stream response -> repeat until done.

| Property | Requirement |
|----------|-------------|
| Configuration | Pre-configured at boot with tool definitions and provider config (not per-request) |
| Concurrency | Must handle multiple concurrent loops independently |
| Scope | Connects models to tools -- nothing else |

**Engine does NOT:**

- Construct prompts
- Manage skills
- Handle approval state
- Enforce scope
- Decide context
- Persist conversations
- Authenticate
- Have personality

### Auth (cross-cutting layer)

Independent of Gateway -- both are swappable independently.

**Three operations:**

| Operation | Signature |
|-----------|-----------|
| Authenticate | request -> identity |
| Authorize | (identity, resource, action) -> allow/deny |
| Manage | modify permissions |

**Middleware position:** Sits between Gateway and Engine. Validates via headers, rejects unauthorized with 401.

**Headers:** `X-Actor-ID`, `X-Actor-Permissions`

**Actor types:** owner, collaborator, system agent, background agent, external agent, service, economic actor, federated

**Policy model:** `(subject, resource, action) -> effect`

Data format is product-owned, not provider-specific.

### Gateway (conversations and routing)

Manages conversations and routes to Engine. Content-agnostic, interface-agnostic.

**Operations:** create conversation (implicit on first message), list, resume, history

**Guarantees:** route, persist conversations, resume, stream, content-agnostic, interface-agnostic

Stores conversations in Your Memory.

**Gateway does NOT:**

- Interpret messages
- Execute tools
- Authenticate
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
| In | Message content + conversation ID (optional) + metadata |
| Out | Streamed response + conversation ID + message record |

Built on prevailing industry standard. Swappable via adapter.

### Provider API (Engine <-> Models)

How the system thinks.

| Direction | Payload |
|-----------|---------|
| In | Prompt (system instructions + conversation + tool definitions + context) |
| Out | Streamed completion (text + tool calls) |

Model-native tool calling is the current approach. Swappable via adapter.

---

## Internal Contract: Gateway <-> Engine

One HTTP endpoint. Not a third API.

### `POST /engine/chat`

**Request:**

```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
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
| `metadata.correlation_id` | Yes |
| `metadata.conversation_id` | No |
| `metadata.trigger` | No |
| `metadata.client_context` | No |

**Response:** SSE stream

| Event | Data Shape |
|-------|------------|
| `text-delta` | `{ content: string }` |
| `tool-call` | `{ id: string, name: string, arguments: object }` |
| `tool-result` | `{ id: string, output: string }` or `{ id: string, error: string }` |
| `done` | `{ finish_reason: string, usage: { prompt_tokens, completion_tokens } }` |
| `error` | `{ code: string, message: string }` |

**Pre-stream errors (HTTP status codes):**

| Code | Meaning |
|------|---------|
| 400 | Invalid request |
| 401 | Auth rejected |
| 503 | Engine unavailable |

**Mid-stream error codes:** `provider_error`, `tool_error`, `context_overflow`

**Auth middleware path:** validate request -> attach `X-Actor-ID` + `X-Actor-Permissions` headers -> reject with 401 on failure.

---

## Responsibility Matrix

| Responsibility | Owner | NOT |
|---|---|---|
| Persist, retrieve, search, version data | Your Memory (via tools) | |
| Provide structure (paths, hierarchy) | Your Memory provides it | Model/owner decides what |
| Understand content, make meaning | Model | Your Memory, Engine |
| Assemble prompts | Model reads from Your Memory | Engine, Your Memory |
| Select context | Model | Your Memory, Engine |
| Execute tools | Engine | Your Memory |
| Decide which tools to use | Model (via Engine loop) | Your Memory, Gateway |
| Execute skills | Model + Engine | Your Memory |
| Protect access / permissions | Auth | Your Memory, Gateway |
| Manage conversations | Gateway | Engine, Your Memory |
| Route requests to Engine | Gateway | Auth |
| Connect to AI models | Provider API | Engine internals |
| Accept client connections | Gateway API | Engine |
| Provide intelligence | Models (external) | Engine, Your Memory |
| Display content to owners | Clients (external) | Gateway |
| Bootstrap the system | Runtime config (4 fields) | Your Memory |
| Resolve concurrent writes | Tool implementations | Your Memory component |

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
| Preferences | Your Memory (personal data, travels with you) |
| Tool definitions | Self-describing (from the tools themselves) |
| Secrets | Environment variables only (never in files) |
| Skills | Prompts in Your Memory |
| Bootstrap prompt | One line in Engine config: "Read AGENT.md for your instructions" |

### Boot Sequence

1. Load runtime config
2. Load adapter config
3. Discover tools
4. Mount Your Memory
5. Read preferences
6. Ready

---

## Conformance Criteria

### Swap Tests

| ID | Test | Pass Condition |
|----|------|----------------|
| SWAP-1 | Provider swap | Change `provider_adapter` + adapter config -> next message uses new provider -> no code changes |
| SWAP-2 | Model swap | Change model preference in Your Memory -> next message uses new model -> no code changes |
| SWAP-3 | Tool swap | Add/remove a tool -> system functions -> no code changes |

### Architectural Invariant Tests

| ID | Test | Pass Condition |
|----|------|----------------|
| ARCH-1 | Memory zero dependencies | Stop all components except Memory storage -> still readable with standard tools |
| ARCH-2 | Engine swap | Replace Engine -> Gateway/Memory/Auth/tools unaffected |
| ARCH-3 | Client swap | New client speaks Gateway API -> system serves identically |
| ARCH-4 | Schema conformance | All API payloads validate against canonical schemas |

### Deployment Invariant Tests

| ID | Test | Pass Condition |
|----|------|----------------|
| DEPLOY-1 | Offline operation | Disconnect network -> system functions for all memory operations |
| DEPLOY-2 | Local data storage | All owner data on owner-controlled storage -> no silent external writes |
| DEPLOY-3 | Default localhost | Fresh install binds to localhost only |
| DEPLOY-4 | No silent outbound | No network calls except explicit provider/tool requests |

### Foundation User Story Tests

| ID | Test | Pass Condition |
|----|------|----------------|
| FS-1 | Move Your Memory | Export -> import -> preferences honored, gaps reported, nothing lost |
| FS-2 | Add capability | Add tool/skill/client/provider -> Memory gains no dependencies -> structure holds |
| FS-3 | Run on own hardware | Install locally -> no external service required -> full offline capability |
| FS-4 | Swap provider | = SWAP-1 |
| FS-5 | Swap client | = ARCH-3 |
| FS-6 | Evolve Memory | Add search capability -> no other component changes |
| FS-7 | Swap Engine | = ARCH-2 |
| FS-8 | Expand scope via tools | Add tools -> broader capability -> no architectural changes |

---

## Swappability

| What | How |
|------|-----|
| Your Memory | Swappable via tools |
| Components | Swappable via contracts |
| Contracts | Swappable via adapters |
| Auth | Swappable via cross-cutting independence |

**Adapters** are thin, stateless translation layers. Each describable in one sentence. See [adapter-spec.md](../adapter-spec.md) §How Model Configuration Works in Practice for the concrete model/provider swap walkthrough.

**Tools** are data in the environment, not a component. Definitions self-describe, execution is Engine's job, permissions are Auth's job.

**Everything** is either memory (nouns/data) or tools (verbs/operations). No third category.
