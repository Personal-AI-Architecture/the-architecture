---
sidebar_label: Tools
hide_table_of_contents: true
---

# Tools: Capabilities in the Environment

**Serves stories:** US-8, US-10, US-17 in the [PAA spec](../spec/personal-ai-architecture-spec.md).

The system reduces to two things: memory and tools.

Memory is the nouns: data, wherever it lives. Tools are the verbs: read, write, search, query, send, execute. A tool's definition, code and instructions are data, but the act of running it is not. The operation has no persistent state. It acts on memory and returns.

## Current architectures are inefficient

Current architectures generally assume tools need a dedicated subsystem: registries, protocols, discovery frameworks, execution engines.

But your hand doesn't need a tool management department between you and your hammer. Your AI system doesn't need one either. That's why this architecture has no dedicated tool subsystem. The model and Your Memory (the brain) tell the Agent Loop (the hand) which tool calls to execute. Nothing is left over.

## Same tools, better architecture

This architecture uses the same tools as everyone else: MCP servers, CLI tools, APIs, whatever the ecosystem produces. What's different is that it builds no dedicated infrastructure around them. Everything a tool needs already has a home.

The architecture has four components, two APIs and three external dependencies. Tools are one of the external dependencies, not a component and not an API. Tool calls flow through the Model API and are executed by the Agent Loop. No separate tool protocol is needed.

```
                              ┌───────────────────────────────────────────────┐
                              │                  YOUR MEMORY                  │
                              │                 (the platform)                │
                              └───────────────────────▲───────────────────────┘
                                                      │
                                             tools (read/write)
                                                      │
      Clients  ──→  Gateway API  ──→  Gateway  ──→  Agent Loop  ──→  Model API  ──→  Models
    (external)        (API)       (component)   (component)        (API)          (external)
                                                      │
                        ─── Auth ───                  └──→ Tools (verbs)  ──→  External Memory (nouns)
                        (checks every request             ├── MCP servers      ├── Salesforce data
                         and every tool call)             ├── CLI tools        ├── Weather services
                                                          └── Native functions └── The internet
```

Three things follow from this:

**The architecture stays small.** Everything the system processes is either a noun (memory) or a verb (tool). There is no third category. New capabilities arrive by adding tools to the environment, not by adding components to the system.

**Your Memory stays dependency-free.** Memory never knows what is reading or writing it. Swap the Agent Loop, the storage or the tools, and Memory doesn't change. That is what makes it portable and ownable.

**The system adapts at the speed of AI.** A new model capability, a new protocol or a new integration is a tool addition, not a system change.

This is an architecture document. It defines how tools work at the generic level. Which tools ship, their defaults and the choice of MCP as the default protocol are implementation choices.

**Related documents:** [overview.md](../architecture/overview.md) (architecture overview), [agent-loop-spec.md](./agent-loop-spec.md), [auth-spec.md](./auth-spec.md), [configuration-spec.md](./configuration-spec.md), [security-spec.md](./security-spec.md)

---

## The memory/tool binary

In the physical world, a hammer is a separate object from a filing cabinet. In the digital world, that distinction dissolves. A tool's definition comes from the tool itself: MCP tools describe themselves through the protocol, others provide manifest files. The tool's executable lives in the environment. The only thing that isn't data is the moment the Agent Loop runs the call.

The industry often calls an MCP server or function call "a tool", mixing the operation (the verb) with the data it reaches (the noun). This architecture separates them:

| What people call it | Memory (data/noun) | Tool (operation/verb) |
|---|---|---|
| RAG system | Vector store (indexed content) | `semantic_search(query)` |
| Database | Stored records | `sql_query(statement)` |
| Salesforce integration | CRM data (externally hosted) | `salesforce_query(filter)` |
| Knowledge graph | Nodes and edges | `graph_traverse(start, relation)` |
| Search index | Indexed content | `full_text_search(terms)` |
| Email via Gmail | Email history (Google-hosted) | `send_email` tool calling the Gmail API (tool calling tool) |

Pure tools with no memory component exist too: sending a message, running a calculation, controlling a browser. These are verbs with side effects.

---

## Why tools are not a component

The Agent Loop, Your Memory, the Gateway and Auth each have a distinct job, a contract and an implementation. Tools have no job that an existing part doesn't already cover:

| Concern | Where it lives | Why not a Tools component |
|---------|---------------|--------------------------|
| Tool definitions (name, description, parameters) | **The tools themselves**, through MCP or a manifest | Tools know what they can do. Nobody writes definitions by hand |
| Tool code and executables | **The environment** | Available software isn't a component of this system |
| Instructions for when and how to use tools | **Your Memory** (skills, AGENT.md) | Personal data the model reads |
| Tool preferences (which tools are always sent) | **Your Memory** | "Always load git tools" is about you, not about this machine |
| Tool plumbing (server addresses, ports, secret references) | **Environment config** | Plumbing describes the machine, not the person using it |
| Tool discovery (what's available) | **Configuration** says where to look; tools describe themselves once found | Discovery is knowing where to look |
| Tool execution and results | **Agent Loop** | Already part of the agent loop |
| Tool permissions (who can use what) | **Auth**, and only Auth | Access control is Auth's job |
| Tool installation | **The environment** | Installing a tool changes the deployment environment |

Nothing is left over.

**Tools are also not an API.** How tool calls are expressed is the Model API: the model's format already defines tool-call syntax. How they are executed is an Agent Loop implementation detail (MCP server, CLI command, native function). How results come back is the Model API again, in the next message to the model. MCP, CLI and native functions aren't "the tool protocol". They are options for how the Agent Loop runs a given tool.

---

## How scope works

What the system can reach (the library folder, the full filesystem, external services, inbound connections) is set entirely by which tools exist in the environment and what Auth allows. Add system-level file tools and the Agent Loop can reach the filesystem. Add external API tools and it can reach those services. The Agent Loop doesn't change and Your Memory doesn't change. No scope enforcer is needed: if a tool doesn't exist, the call can't happen.

### Three layers of tool availability

| Layer | What it controls | Who decides |
|-------|-----------------|-------------|
| **Environment**: what tools exist | Which tools are present and executable | The owner, starting from whatever the implementation ships |
| **Auth**: who can use what | Which available tools each actor may use | Permissions in Auth. By default the owner can use every tool. Any other actor starts with no permissions until the owner grants them |
| **Granularity**: how they can be used | Read-only vs read-write, restricted parameters, conditions | Finer-grained Auth permissions |

**The environment decides what exists. Auth decides who can use what. The model is told both.**

### Before each tool call, the Agent Loop asks Auth

The Agent Loop holds no permissions of its own. Before it runs any tool call, it asks Auth whether the current actor may make that call. If Auth says no, the call doesn't run and the model gets a "not permitted" result, so it can tell the owner what happened.

The model also needs to know about tools that exist but aren't permitted for the current actor. Then it can say "that capability exists but this account can't use it" instead of acting as if it doesn't exist. When the Agent Loop prepares tool definitions for the model, it asks Auth which ones the current actor may use and marks the rest as not permitted.

### No approval step by default

The architecture default is that the owner can do everything. There is no built-in "confirm before every write" step.

An owner or a product may want approval before some actions, such as writing files or sending email. Those are approval rules, and they live in Auth with the other permissions. The Agent Loop's check before each tool call is where they are enforced. Whether a product adds approvals, how strict its defaults are and what the prompt looks like are product choices.

An approval rule can't be enforced by a prompt alone. A system prompt that says "always ask before writing" is a suggestion the model might ignore. A check in software before the call runs is a guarantee.

When enabled, the check emits the canonical pending `approval-request` with a stable request ID and expiry. An approval-authorized identity resolves it with one terminal `approved`, `denied`, `cancelled`, or `expired` decision. Replaying a decision is idempotent and cannot execute the tool twice; conflicting decisions are rejected. The exact payloads are defined in `contracts/schemas/approval-request.json` and `contracts/schemas/approval-decision.json`.

The actor used for that check arrives in the canonical transport-neutral `auth_context`; tool execution must not depend on a particular header, message bus, or direct-call transport.

---

## Tools and skills

A **skill** is a recipe: instructions in Your Memory that tell the model what to do, step by step, with judgment. "Interview the owner about this topic. Ask 10 rounds of questions. Produce a spec at the end."

A **tool** is kitchen equipment: a capability in the environment. Read a file. Write a file. Search. Call an API.

The skill refers to tools ("use the read tool to check AGENT.md first"), but it is not a tool. It is data the model reads and follows. Skills can include scripts and templates. These are still data: the model reads them and runs them through whatever tools exist.

### The skill tool pattern

Every skill is a prompt, a Markdown file in Your Memory. So skills don't each need their own tool. **One generic skill tool loads any skill** into the model's context, and the model follows it with the tools available.

This has three consequences:

1. **The owner can edit skills without a developer.** Edit the Markdown file. No code change, no redeploy.
2. **New skills are free.** Adding a skill is adding a file. The skill tool doesn't need to know about it in advance.
3. **Coded tools are the escalation path, not the starting point.** Build a specific coded tool only when prompting hits a ceiling. As models improve, what needs code today may need only a prompt tomorrow.

### Example: a minimal tool set

A working deployment needs very few tools. Filesystem operations (read, write, edit, delete, search, list) give the Agent Loop access to Your Memory. On top of those:

| Tool | What it illustrates |
|------|-------------|
| **Skill tool** | One generic loader handles every skill |
| **Version history tool** | A standard external capability (Git is one option) wrapped for the Agent Loop to record and restore versions of Your Memory |

This set is illustrative. An implementation decides which tools ship.

---

## What the model sees

Tool definitions are sent through the Model API with the system instructions and conversation history. Every definition costs context space and tokens on every call, and models choose worse when shown dozens of irrelevant tools.

### Two sets: always-send and discoverable

| Set | What it is | How it works |
|----------|-----------|--------------|
| **Always-send** | Tools the owner uses regularly | Definitions go with every prompt |
| **Discoverable** | Every other tool in the environment | Found on demand through a discovery tool |

**The owner chooses which set each tool is in, not the tool and not the product.** A developer might always send filesystem, git and deployment tools. A writer might always send filesystem and research tools. This choice is a preference in Your Memory, so it travels with the owner. An implementation may suggest a starting set, but a tool can't place itself in the always-send set.

The **discovery tool** is always in the always-send set. When the model needs something not in context, it searches, finds the tool and loads its definition. The model decides when to search. The Agent Loop stays a pass-through.

On many AI platforms, the platform decides which tools every user gets. You can't drop tools you never use, or add ones that matter to you. Here the owner makes that trade-off.

This scales in both directions. With few tools, everything is always sent and discovery rarely fires. With thousands, discovery becomes essential and the always-send set stays lean. The architecture doesn't change.

### Discovery at scale

**The tool catalog is just data.** The Agent Loop collects self-descriptions from every tool in the environment into a searchable index. Tools appear and disappear, and the catalog follows.

**Discovery has two steps: search, then load.** The model describes what it needs. The discovery tool returns a short list of names and descriptions. The model picks one and loads its full definition. The model never sees every definition at once.

**Tools are identified by source and name.** MCP servers expose a namespace, CLI tools have command names, native functions have function names. The source is part of the identity, so two tools named `search` from different sources stay distinct without a central naming authority.

---

## How the Agent Loop uses tools

### The execution loop

1. **The model produces one or more tool calls** in the assistant message, through the Model API. It may write text alongside them.
2. **The Agent Loop asks Auth** whether each call is permitted for the current actor.
3. **The Agent Loop runs the permitted calls.** Independent calls requested together run at the same time, not one after another. Each call uses whatever mechanism its tool needs (MCP, CLI, native function).
4. **The results go back to the model** as the next message, one result per call. Text the model wrote alongside the calls is kept, not dropped.
5. **The model continues.** It may call more tools or answer.

Tool calls and tool results are normal parts of messages, in the same message shape every contract uses. They are saved in conversation history with the rest of the conversation, so they survive export and are there when the conversation resumes.

The Agent Loop doesn't interpret, filter or change tool calls or results. The model decides *what* to call. The Agent Loop handles *how*. Auth decides *whether*.

### Tool registration

There is no special registration system. The Agent Loop already takes tool definitions as an input alongside the system prompt and conversation history (see [agent-loop-spec.md](./agent-loop-spec.md)). Registration is just how those definitions arrive.

Environment config tells the Agent Loop where to find tools. The tools then describe themselves:

| Mechanism | How definitions arrive | Example |
|-----------|----------------------|---------|
| **MCP server** | The Agent Loop connects and asks the server what tools it offers | Filesystem tools |
| **Native function** | The definition is part of the tool's own code | Audit logging |
| **CLI tool** | A manifest describes the command and its parameters | Git operations |

Either way, the definitions end up in the prompt (if always-send) or the catalog (if discoverable). The Agent Loop doesn't understand what the tools do.

### Where tool executables live

| Location | What it means | Example |
|----------|--------------|---------|
| **In-process** | Runs inside the Agent Loop's process. Calls are function calls | A filesystem tool library, native functions |
| **Separate process or container** | Runs alongside the Agent Loop. Calls go over a local channel or the network | A third-party tool suite |
| **Remote service** | Runs on an external server | A hosted code-execution service, a weather API |

**The Agent Loop treats all three the same.** Where a tool runs is a deployment decision. It doesn't change how the Agent Loop works, how the model sees the tool or how Auth governs it.

| Mechanism | How it works | When it's used |
|-----------|-------------|----------------|
| **MCP over stdio** | Standard input and output with a local process | Locally spawned MCP servers |
| **MCP over network** | Same protocol over HTTP or WebSocket | Separate or remote MCP servers |
| **CLI execution** | Spawn a process, pass arguments, read output | Git, system utilities |
| **Native function call** | Direct call inside the Agent Loop process | Built-in functions such as audit logging |

MCP is a common default, but the architecture doesn't require it. Any mechanism that takes input and returns output works.

### Tool isolation

A tool the owner doesn't trust runs isolated from the owner's data and from other tools. The owner decides which tools they trust. An implementation may treat third-party tools as untrusted until the owner says otherwise.

Isolation protects against four risks:

- **Filesystem access:** the tool sees only what it is given.
- **Network access:** limited to specific hosts, or none.
- **Cross-tool interference:** no shared state or process space.
- **Resource exhaustion:** a runaway tool is throttled or stopped without affecting the Agent Loop.

How isolation is built is up to the implementation. Containers are one option, separate processes or sandboxes are others.

Tools from the same trusted source may share an isolation boundary when they are meant to work together. Trusted, well-tested tools may run in-process.

### Tool lifecycle and health

**Starting and stopping.** In-process tools start and stop with the Agent Loop. Separate tools can start with it or on first use, and can stop independently. Remote tools are managed independently.

**Health.** The Agent Loop enforces timeouts on tool calls. A tool that fails, hangs or is unavailable produces a tool result that says so ("tool X is unavailable"), not a system error. The model decides what to do next: retry, try another way or tell the owner. A separate tool crashing doesn't take down the Agent Loop. An in-process crash can, which is why in-process is for trusted, well-tested code.

**Upgrades.** Separate and remote tools can be upgraded without restarting the Agent Loop: it reconnects and rediscovers their definitions. In-process tools need an Agent Loop restart.

### Tools and the Gateway API: the parity principle

**Any external caller, human client or program, uses the same API to talk to the system.**

| Kind | Relationship to the Agent Loop | Example |
|----------|----------------------|---------|
| **Tools the Agent Loop calls** | Agent Loop → tool. The model chooses and the Agent Loop runs it | Filesystem read and write, Git, skill loader |
| **Agents and programs that call the system** | Program → Gateway API → Agent Loop, the same way a client does | Another AI agent, a scheduled job, a webhook handler |

Software that talks *to* the system goes through the Gateway API. It gets the same Auth checks and the same conversation handling as the owner's own client. No client gets a private path to the Agent Loop that another caller couldn't use.

---

## Decisions made

| # | Decision | Rationale |
|---|----------|-----------|
| D51 | Tools are not a component. They are capabilities in the environment, executed by the Agent Loop and governed by Auth | Every tool concern maps to an existing part: tools describe themselves, the Agent Loop executes, Auth decides access, preferences live in Your Memory, plumbing lives in environment config. No gap needs a dedicated component |
| D53 | No separate tool API. Tool calls flow through the Model API, and tool execution is an Agent Loop implementation detail | The Model API already expresses tool calls and returns results. The architecture has two APIs, not three |
| D135 | Memory/tool binary: if it's data, it's memory; if it's not data, it's a tool | Everything the system processes is a noun or a verb. No third category |

The configuration split behind this spec (definitions from the tools, plumbing in environment config, preferences in Your Memory) is set out in [configuration-spec.md](./configuration-spec.md).

---

## Open questions

### OQ-1: How tools that run as separate services are discovered

Today the Agent Loop connects to configured tool servers and asks what they offer. An alternative is for tool services to announce themselves through the Gateway API, as any client does. The first is simpler and matches how MCP works. The second applies the parity principle to tool registration but adds work to the Gateway. Either way, the model, Auth and Your Memory are unaffected.

---

## Success criteria

- [ ] Adding or removing a tool means adding or removing data (configuration, files). No code changes to the Agent Loop, Your Memory, the Gateway, Auth or clients. Removing a tool reduces what the system can do and nothing else
- [ ] Each tool describes itself, and the Agent Loop discovers it through the shared tool interface
- [ ] The Agent Loop runs tool calls without knowing what the tools do
- [ ] The Agent Loop asks Auth before every tool call. Permissions live only in Auth
- [ ] By default the owner can use every tool, with no approval step. Any other actor starts with no permissions until the owner grants them
- [ ] If the owner sets approval rules, they are enforced in software before the call runs, not by prompt
- [ ] The model can tell "this tool does not exist" apart from "this tool exists but is not permitted"
- [ ] When the model asks for several independent tool calls at once, they run at the same time, and text the model wrote alongside them is kept
- [ ] Tool calls and tool results are parts of messages and are saved in conversation history
- [ ] The owner, not the tool or the product, chooses which tools are always sent and which are discoverable, without code changes
- [ ] A discovery tool can find and load tools from the discoverable set at runtime
- [ ] Skills and tools change independently: changing a skill doesn't require changing a tool, and adding a tool doesn't require changing a skill
- [ ] Scope grows by adding tools, with no architectural change

---

## Security requirements

Per-component requirements from [security-spec.md](./security-spec.md). The security spec owns the "why". This section owns the "what" for tools.

- [ ] A tool the owner doesn't trust must run isolated from the owner's data and other tools, with restricted filesystem access, restricted network access and resource limits
- [ ] Isolation must not depend on Auth: even if Auth fails, an isolated tool can't escape its boundary
- [ ] The owner must be able to see whether a tool is verified before choosing to trust it
- [ ] A tool failure must not take down the Agent Loop. Failures reach the model as tool results

---

## Contract alignment

The canonical contract tree under `contracts/` is authoritative for tool-definition
and message shapes. Tool definitions use `parameters` for their JSON Schema input;
the shared message contract enforces role-appropriate tool-call and tool-result parts,
and the Model API stream uses explicit event discriminators. The generic tool-definition contract now includes a canonical
`memory_restore` example with an opaque `version` identifier. S8 remains open for
the owner-controlled visibility/source semantics and adapter configuration details;
approval lifecycle remains open for products that add approval prompts. Parallel
execution and “exists but not permitted” behavior remain architectural requirements
that implementations must enforce even where the generic tool schema is intentionally
extensible.

---

*Tools is the spec that explains why it doesn't need to be a spec. Tools describe themselves. Plumbing is environment config. Preferences and skills are personal data in Your Memory. The Agent Loop runs tool calls after asking Auth. There's nothing left over.*
