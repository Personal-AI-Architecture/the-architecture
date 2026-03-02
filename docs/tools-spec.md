# Tools: Capabilities in the Environment

> **Project:** Pivot
> **Generated from:** Tools interview session (Dave W + Claude) on 2026-02-23
> **Status:** Final — ready for implementation
> **Architecture:** See `foundation-spec.md` for platform architecture (components, contracts, connectors)

---

## Tools

The system reduces to two things: memory and tools. 

If it's not data (memory), it's a tool.

Tools are operations — verbs. Read, write, search, query, send, execute. The operation itself has no persistent state. It acts on memory and returns.

Memory is the nouns. Tools are the verbs. Clean binary.

## Current Architectures are inefficient

Current architectures generally assume tools need a dedicated subsystem — registries, protocols, discovery frameworks, execution engines.

But your hand doesn't need a tool management department between you and your hammer. And your AI system doesn't need one either. That's why this architecture has no dedicated tool subsystem.

Tools are data. The AI model and the memory (the brain) tell the engine (the hand) what tool calls to execute. There's nothing left over.

## Same Tools, Better Architecture

This architecture uses the same tools — MCP servers, CLI tools, APIs, whatever the ecosystem produces.

What's different is that it doesn't build dedicated infrastructure around them. Tools are just operations that act on data (memory) — and everything they need already has a home.

The architecture has four components, two connectors, and three external dependencies. Tools are one of the external dependencies — not a component, not a connector. Tool calls flow through the Provider API and are executed by the Engine. No separate tool protocol needed.

```
                              ┌───────────────────────────────────────────────┐
                              │                  YOUR MEMORY                  │
                              │                 (the platform)                │
                              └───────────────────────▲───────────────────────┘
                                                      │
                                             tools (read/write)
                                                      │
      Clients  ──→  Gateway API  ──→  Gateway  ──→  Engine  ──→  Provider API  ──→  Models
    (external)      (connector)     (component)  (component)     (connector)      (external)
                                                      │
                        ─── Auth ───                  └──→ Tools (verbs)  ──→  External Memory (nouns)
                        (cross-cutting                     ├── MCP servers      ├── Salesforce data
                         component,                        ├── CLI tools        ├── Weather services
                         applies to all                    └── Native functions └── The internet
                         requests)
```

## Your Memory is the platform. Tools are how you interact with it.

Three things follow from this:

**The architecture stays small.** Everything this system processes is either a noun (memory) or a verb (tool). No third category. That binary is what keeps it at four components. New capabilities arrive by adding tools to the environment, not by adding components to the system. 

**Your Memory stays dependency-free.** Memory never knows what's reading or writing to it — tools handle that. Swap the Engine, swap the storage, swap the tools themselves — Memory doesn't change. That's what makes it truly portable and ownable.

**The system adapts at the speed of AI.** Because the architecture expands via tools rather than via new infrastructure, a new model capability, a new protocol, a new integration — all tool additions, not system changes. The thing that doesn't need to be rebuilt is the thing that survives.

The rest of this document shows why.

This is a **Level 1 (Foundation) document** — it defines how tools work at the generic, unopinionated level. Product-specific tool choices (which tools ship, what defaults, MCP as default protocol) are Level 2 (Product) opinions.

**Related documents:** `foundation-spec.md` (architecture overview, links to all component specs)

---

## The Memory/Tool Binary

In the physical world, a hammer is a distinct object from a filing cabinet, and a screwdriver is a separate thing from the book about screwdrivers. In the digital world, that distinction dissolves. A tool *is* its definition, its code, its instructions — all just data. The tool's definition comes from the tool itself — MCP tools self-describe via protocol, others provide manifest files. The tool's executable — the software that runs when the Engine makes a call — lives in the environment. The only thing that isn't data is the act of execution itself — the moment the Engine runs the call. That's runtime, not persistent.

The AI industry typically defines "tool" as an MCP server or function call — conflating the operation (the verb) with the data it accesses (the noun). This system is more precise. What looks like "a RAG tool" is actually a pattern that decomposes:

| What people call it | Memory (data/noun) | Tool (operation/verb) |
|---|---|---|
| RAG system | Vector store (indexed content) | `semantic_search(query)` |
| Database | Stored records | `sql_query(statement)` |
| Salesforce integration | CRM data (externally hosted) | `salesforce_query(filter)` |
| Knowledge graph | Nodes and edges | `graph_traverse(start, relation)` |
| Search index | Indexed content | `full_text_search(terms)` |
| Email via Gmail | Email history (Google-hosted) | `send_email` tool calling Gmail API (tool calling tool) |

Pure tools with no memory component do exist: sending a message, running a calculation, controlling a browser. These are verbs with side effects, not data.

---

## Why Tools Are Not a Component

The Engine is a component — it has a distinct job (run the agent loop), a contract, and an implementation. Your Memory is a component — it has a distinct job (persist and retrieve data), a contract, and an implementation. Auth is a component — it has a distinct job (control access), a contract, and an implementation.

Tools don't have a distinct job that isn't already covered by existing components. Every concern that seems like it belongs to a "Tools component" actually belongs somewhere else:

| Concern | Where it lives | Why not a Tools component |
|---------|---------------|--------------------------|
| Tool definitions (name, description, parameters) | **The tools themselves** — self-describing via MCP protocol or manifest files | Tools know what they can do. Nobody writes definitions manually |
| Tool code / executables | **The environment** — software the Engine can call | Available software isn't a component of this system |
| Instructions for when/how to use tools | **Your Memory** — skills, AGENT.md | The model reads instructions from Your Memory — these are personal data |
| Tool preferences (always-send set, policies) | **Your Memory** — personal data about how you work | "Always load git tools" is about you, not about this desk |
| Tool plumbing (server addresses, ports, API keys) | **Environment config** — deployment-specific | Plumbing describes the desk, not the person sitting at it |
| Tool discovery (what's available) | **Configuration** — which tool sources to search; tools self-describe once found | Discovery is just knowing where to look, not a separate system |
| Tool execution | **Engine** — it executes calls | Part of the agent loop — the Engine already does this |
| Tool results | **Engine** — returned to the model | Part of the agent loop — the Engine already does this |
| Tool permissions (who can use what) | **Auth** | Access control is Auth's job |
| Tool installation | **The environment** — environment-specific | Installing a tool changes the deployment environment |

Nothing is left over. There is no gap that requires a dedicated component.

**Tools are also not a connector.** The foundation spec originally proposed a Tool Protocol connector alongside the Gateway API and Provider API. But trace where each part actually lives.

How tool calls are expressed — that's the Provider API. The model's API format already defines tool call syntax. How tool calls are executed — that's the Engine's implementation detail (MCP server, CLI command, native function). How results come back — that's the Provider API again, in the next message to the model.

The Provider API covers one side. The Engine's implementation covers the other. There's no gap between them that needs a dedicated connector. MCP, CLI tools, native functions — these aren't "the tool protocol." They're implementation options for how the Engine executes specific tools.

---

## How Scope Works

The expanding sphere — library folder → full filesystem → external services → inbound connections — is entirely driven by which tools exist in the environment and what Auth allows.

- **V1:** The environment has library-scoped file tools. The Engine can only operate within the library folder. Not because a scope enforcer limits it — but because those are the only tools that exist.
- **V2:** System-level file tools are added to the environment. The Engine can now access the full filesystem. The Engine didn't change. Your Memory didn't change. More data (tool definitions) entered the environment.
- **V3:** External API tools are added. Same pattern.
- **V4:** Inbound integration tools are added. Same pattern.

Each expansion is more data entering the environment. Each contraction is data being removed. The Engine doesn't know what scope it's operating in. It uses whatever tools exist. Scope equals what tools are available plus what Auth permits.

### Three layers of tool availability

| Layer | What it controls | Who decides |
|-------|-----------------|-------------|
| **Environment** — what tools exist | Which tools are physically present and executable | Configuration. On local: defaults + owner adds anything. On managed hosting: the provider curates + allow list. |
| **Auth** — who can use what | Which of the available tools each actor can access | Permissions. Owner has full access. Collaborators, agents, and other actors have scoped access. |
| **Granularity** — how you can use them | Read-only vs read-write, restricted parameters, conditional access | Permissions refined. Future concern — Auth getting more specific over time. |

**Configuration decides what exists. Auth decides who can use what. The model sees both. The Engine only sees what it can execute.**

The model benefits from knowing about tools that exist but aren't permissioned for the current actor. This lets the model say "that capability is available but your account doesn't have access" rather than pretending the capability doesn't exist. The Engine doesn't need this distinction — if a tool isn't executable (for any reason), it can't run it.

---

## Tools and Skills

Skills and tools are related but different things.

A **skill** is a recipe — instructions in Your Memory that tell the model what to do, step by step, with judgment. "Interview the user about this topic. Ask 10 rounds of questions. Challenge vague answers. Produce a spec at the end."

A **tool** is kitchen equipment — a capability in the environment that lets the model do something specific. Read a file. Write a file. Search for content. Call an API.

The skill references the tools. "Use the read tool to check AGENT.md first. Use the write tool to save the spec." But the skill is not a tool. The skill is data in Your Memory that the model reads and follows. The tool is a capability in the environment that the Engine executes.

Skills can include code or scripts alongside natural language instructions — bash commands, configuration snippets, templates. These are still data. A script on disk is just bytes in Your Memory. The model reads it, understands what it does, and executes it through available tools (bash, shell, etc.).

### The skill tool pattern

Every skill is a prompt — a markdown file in Your Memory. Every prompt is the same from the system's standpoint. There's no structural difference between an interview skill, a spec-generation skill, or any future skill. This means skills don't each need their own tool.

**One generic skill tool handles all skills.** The skill tool's job: load a skill prompt from Your Memory and inject it into the model's context. The model then follows the skill's instructions using whatever tools are available. The interview skill, the spec-generation skill, and the plan-generation skill all work through the same skill tool — the only difference is which markdown file gets loaded.

This has three consequences:

1. **Skills are owner-editable without developer involvement.** Want to change 8 things about the interview prompt? Edit the markdown file. No code changes, no redeployment, no developer required.

2. **New skills are free.** Adding a new skill is creating a new markdown file. The skill tool doesn't need to know about it in advance — it just loads whatever skill the model (or owner) selects.

3. **Coded tools are the escalation path, not the starting point.** If a skill-as-prompt isn't sufficient — if prompt engineering hits a ceiling and the model can't handle a particular workflow through instructions alone — *then* a specific coded tool can be built. But not preemptively. Start with the simplest thing (prompt), see how it works, code only when necessary. As models improve, what requires coded tools today may be handled by prompts tomorrow.

### Approval gates — why they can't be a prompt

One tool that *must* be a coded tool from the start: approval gates.

When the system is about to write to the user's files, it must pause and ask for confirmation. This cannot be handled by the system prompt alone — you can't guarantee the model will comply. A system prompt that says "always ask before writing" is a suggestion the model might follow. An approval gate tool that intercepts write operations is a guarantee enforced by software. The approval gate is still a tool — a capability in the environment that the Engine executes — but when the consequence of non-compliance is writing to the user's files without permission, you don't rely on compliance.

### Example: a minimal tool set

A deployment needs very few tools to be functional. Filesystem operations (read, write, edit, delete, search, list) are the foundation — they give the Engine access to Your Memory. On top of those, three tools cover the core patterns:

| Tool | Type | What it illustrates |
|------|------|-------------|
| **Skill tool** | Generic loader | One tool handles all skills — loads a prompt from Your Memory and injects it into context. No per-skill tools needed. |
| **Git tool** | Version control | A standard external tool wrapped for the Engine — initializes repos, commits changes, provides diff. |
| **Approval gate** | Write guard | A coded tool that *must* exist (see above) — intercepts write operations, pauses for owner confirmation. |

This set is illustrative, not prescriptive. A Level 2 product decides which tools ship. The point is that a small number of tools — filesystem access, a skill loader, version control, and a write guard — is enough to run a fully functional system.

---

## Tool Context Management — What the Model Sees

Tool definitions are sent through the Provider API alongside system instructions and conversation history. Every tool definition consumes context window space and costs tokens on every API call. With a handful of MVP tools, this is negligible. As the system expands — more filesystem tools, external API tools, marketplace tools — sending every registered tool definition with every prompt becomes wasteful and degrades model performance. Models make worse tool selections when presented with dozens of irrelevant options.

### Two sets: always-send and discoverable

| Category | What it is | How it works |
|----------|-----------|--------------|
| **Always-send set** | Tools the owner uses regularly — their daily drivers | Definitions are sent with every prompt through the Provider API. Zero overhead to use. |
| **Discoverable set** | Everything else that's registered in the environment | Available on demand through a discovery tool. Not sent with every prompt. |

The **always-send set** is owner-configured. The owner decides which tools belong in their daily set based on how they work. A developer might always-send filesystem, git, and deployment tools. A writer might always-send filesystem and research tools. A business owner might always-send calendar, email, and CRM tools. The set reflects the individual, not a product decision.

The **discovery tool** is a meta-tool that's always in the always-send set. When the model needs a capability that isn't in the current context, it searches available tools, finds what it needs, and loads it. The model decides when to search — the Engine stays a pass-through.

### Why the owner controls this

On big-tech AI platforms, the platform decides which tools every user gets. You can't remove tools you don't use (they still consume your context). You can't add specialized tools that matter to your workflow. You can't tune the tradeoff between tool availability and context efficiency.

In this architecture, the owner makes that call.

### Scaling properties

This approach degrades gracefully in both directions:

- **Small tool count (MVP, V1):** Put everything in the always-send set. No discovery needed. The discovery tool exists but rarely fires.
- **Medium tool count (V2):** Owner's daily drivers in always-send, the rest discoverable. One extra round trip when the model needs something unusual.
- **Large tool count (marketplace, V3+):** Discovery becomes essential. The always-send set stays lean. The long tail lives in discovery. Same architecture, no changes.

### Discovery at scale — hundreds or thousands of tools

The two-set split handles *context window* scaling — don't send everything in every prompt. But when the discoverable set grows to hundreds or thousands of tools, the discovery tool itself needs to work at that scale. Three things make this work.

**The tool catalog is just data.** The Engine collects self-descriptions from every tool in the environment into a searchable index. The catalog doesn't own the tools — it just reflects what's available. Tools appear and disappear; the catalog tracks that.

**Discovery is two-step: search, then load.** The model calls the discovery tool with a natural-language description of what it needs. The discovery tool searches the catalog and returns a short list of matches — names and descriptions only, not full definitions. The model picks the right one and loads its full definition into context. The model never sees every definition at once, so this stays lightweight at any scale.

**Tools identify themselves by source and name.** MCP servers expose a namespace, CLI tools have command names, native functions have function names. When tools come from different sources, the source is part of the identity — two tools named `search` from different sources are distinguishable without a central naming authority.

None of this changes the architecture. The discovery tool is still a tool. The catalog is data. The Engine still executes whatever it's told.

---

## How the Engine Uses Tools

The previous sections explain *what* tools are and *what they enable*. This section explains *how* they work at runtime — how the Engine finds them, calls them, and gets results back.

### The execution loop

When the model decides to use a tool, the sequence is:

1. **Model produces a tool call** — "call `read` with `{path: '/library/finances/spec.md'}`" — expressed in the model's completion format through the Provider API
2. **Engine receives the tool call** — the Engine sees a tool call in the model's response and executes it
3. **Engine calls the tool** — using whatever execution mechanism the tool requires (MCP protocol, CLI command, native function call)
4. **Tool returns a result** — data flows back to the Engine
5. **Engine passes the result to the model** — as the next message in the conversation
6. **Model continues** — may call more tools or produce a text response

The Engine doesn't interpret, filter, or modify tool calls or results. It's a pass-through executor. The model decides *what* to call. The Engine handles *how* to call it. Auth controls *whether* the call is permitted.

### Tool registration — how the Engine knows what's available

There's no special registration system. The Engine's normal loop (see `engine-spec.md`) already includes tool definitions as an input alongside the system prompt and conversation history. "Registration" is just how those definitions get there.

Tool plumbing — where tools live, what addresses to connect to — is environment configuration that travels with the deployment. Tool preferences — which tools to always-send, what policies to apply — are personal data in Your Memory. At startup, the Engine reads environment config to know where to find tools, then discovers what they offer. How it gets the actual definitions depends on the tool:

| Mechanism | How definitions arrive | Example |
|-----------|----------------------|---------|
| **MCP server** | Engine connects to the configured server and discovers what tools it offers via the MCP protocol. | Filesystem tools (read, write, search, list) |
| **Native function** | Definition is part of the configuration data directly. | Approval gate, audit |
| **CLI tool** | Wrapped in a tool definition that describes the command and its parameters. | Git operations |

Either way, the result is the same: tool definitions end up in the prompt, the model sees them, and the model decides when to use them. The Engine doesn't understand what the tools do — it just includes their definitions and executes calls.

### Where tool executables live

Tool *definitions* come from the tools themselves — they self-describe what they can do. But a definition alone doesn't do anything — somewhere, there's actual software that *runs* when the Engine executes a tool call. That software — the tool executable — lives in the environment, not in Your Memory.

| Location | What it means | When it applies | Example |
|----------|--------------|-----------------|---------|
| **In-process** | Tool code runs inside the Engine's process. Calls are function calls — fast, simple, no network overhead. | MVP. The simplest thing that works. | MCP tool server as a library, native functions (approval gate, audit) |
| **Sibling container** | Tool code runs in a separate Docker container alongside the Engine. Calls go over the network. | V1+. When isolation, independent deployment, or language diversity matters. | Per-tool or per-group containers |
| **Remote service** | Tool code runs on an external server. | V2+. Third-party tools, marketplace tools, partner integrations. | A hosted code execution service, a weather API |

**The Engine treats all three identically.** It calls the configured protocol, passes the input, gets a result. The difference between in-process, sibling container, and remote service is a deployment decision — it doesn't change how the Engine works, how the model sees the tool, or how Auth permissions it.

### Communication mechanisms

| Mechanism | How it works | When it's used |
|-----------|-------------|----------------|
| **MCP over stdio** | Engine and tool communicate through standard input/output streams within the same process or a child process. | In-process tools, locally spawned MCP servers |
| **MCP over network** | Engine sends requests to a tool's network endpoint (HTTP, WebSocket). Same MCP protocol, different transport. | Sibling containers, remote MCP servers |
| **CLI execution** | Engine spawns a child process, passes arguments, reads stdout/stderr. | Host binaries (Git, system utilities) |
| **Native function call** | Direct function invocation within the Engine process. No serialization, no protocol overhead. | Built-in Engine functions (approval gate, audit logging) |

**MCP is the default protocol** — this is a Level 2 opinion. MCP provides structured tool definitions, typed parameters, and a standard discovery mechanism. But the Level 1 architecture doesn't mandate it. Any mechanism that takes input and returns output works.

### Tool isolation

Tools that run outside the Engine process can be isolated in their own Docker containers. This is a V1+ concern, but the architecture supports it from the start.

| Trust level | Isolation | Who | Example |
|-------------|-----------|-----|---------|
| **Full trust** (in-process) | None — runs in Engine's process with same access | Platform-provided tools — code reviewed and maintained by the platform team | Filesystem tools, skill loader, approval gate |
| **Shared container** | Grouped tools share a container, separated from Engine | Related tools from the same source where inter-tool access is expected | A tool suite from one third-party vendor |
| **Dedicated container** | Own filesystem, own network policy, own resource limits | Untrusted third-party or marketplace tools | Community-contributed tools, marketplace installs |

Container isolation protects against four risks: **filesystem access** (tool sees only its own filesystem, specific directories mounted as needed), **network access** (restricted to specific hosts/ports or none), **cross-tool interference** (no shared state or process space), and **resource exhaustion** (CPU/memory/disk limits per container — a runaway tool is throttled or killed without affecting anything else).

**Owner-installed tools** — tools the owner writes or installs themselves — are isolated by default (separate container), but the owner can override. On local, the owner has full control over the isolation level. On managed hosting, the provider applies minimum isolation requirements.

### Tool lifecycle, health, and upgrades

**Starting:** In-process tools start with the Engine — no separate step. Containerized tools start at Engine startup (via Docker Compose or equivalent) or on demand when first needed. Remote tools are independently managed — already running when the Engine connects.

**Stopping:** In-process tools stop with the Engine. Containerized tools can stop independently — the Engine treats a stopped tool the same as a crashed tool and reports unavailability to the model. Remote tools may go down at any time — same handling.

**Health:** The Engine detects unresponsive tools through configurable timeouts. Failures are reported to the model as tool results ("tool X is unavailable"), not as system errors. The model decides the next step — retry, alternative approach, or inform the owner. Container crashes don't take down the Engine. In-process crashes are more serious (they can crash the Engine), which is why in-process is reserved for trusted, well-tested code.

**Upgrades:** Containerized and remote tools can be upgraded without restarting the Engine — stop the old container, start the new one, the Engine reconnects and re-discovers capabilities. In-process tools require an Engine restart (acceptable for platform-provided tools, which change alongside the Engine).

### Tools and the Gateway API — the parity principle

**Any external caller — whether a human client or a programmatic tool/agent — should be able to use the same API to interact with the system.**

The Gateway API is the single entry point for all external clients. This creates a clean separation between two kinds of tool:

| Category | Relationship to Engine | Example |
|----------|----------------------|---------|
| **Tools the Engine calls** | Engine → Tool. The model decides to use a capability and the Engine executes the call. | Filesystem read/write, Git, skill loader |
| **Agents/tools that call the system** | Tool → Gateway API → Engine. An external program sends a message the same way a human interface does. | Another AI agent, a scheduled job, a webhook handler |

When software talks *to* the system (not *for* the system), it should go through the Gateway API — the same contract any client uses. This ensures that a programmatic caller has the same capabilities, the same auth checks, and the same conversation management as a human owner.

**For the MVP**, this distinction doesn't matter — there's one owner at a terminal, and tools are in-process. **For V1+**, maintaining this parity is a discipline checkpoint: the CLI must not have any special path to the Engine that a programmatic caller couldn't also use.

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D51 | Tools are not a component — they are capabilities in the environment (data executed by the Engine, permissioned by Auth) | Every tool-related concern maps to an existing component: definitions are self-describing (from the tools themselves, D146), execution is the Engine's job, permissions are Auth's job, configuration is data, installation is data entering the system. There is no gap that requires a dedicated component. Same pattern as D41 (the original "Harness" dissolved into the other components working together). |
| D52 | Tools are data — in the digital world, a tool IS its definition, code, and instructions | In the physical world, a screwdriver is a separate object from the book about screwdrivers. In the digital world, that distinction dissolves. Tool definitions, executable code, and usage instructions are all data. There's no special category of "tool stuff" separate from data. **Refined by D141-refined:** three-way split — tool definitions come from the tools themselves (self-describing, D146), tool plumbing (addresses, ports) is environment config, tool preferences (always-send, policies) are personal data in Your Memory (D145). Skills and instructions remain in Your Memory. |
| D53 | The Tool Protocol connector is not needed — tool calls flow through the Provider API, tool execution is an Engine implementation detail | The Provider API already defines how tool calls are expressed (model completions) and how results are returned (next message). The Engine already handles execution (MCP, CLI, native functions are implementation options). There's no gap between them that needs a separate connector. The architecture has two connectors, not three. |
| D54 | A tool is a tool — no categories, no taxonomies, no special handling for different kinds of tools | Whether a tool reads Your Memory, calls an external API, or does computation, the Engine treats it identically. Auth handles permissions. The tool system doesn't need to distinguish between "memory tools" and "capability tools" and "integration tools." A tool is a tool. |
| D55 | Scope is determined by what tools exist in the environment plus what Auth allows — the expanding sphere is just adding data | Each expansion (library → filesystem → external → inbound) is more tool data entering the environment. Each contraction is data being removed. The Engine doesn't know what scope it's in. No scope enforcer, no boundary manager, no special mechanism. Scope = available tools + permissions. |
| D56 | The model should know about tools that exist but aren't permissioned — the Engine doesn't need to | The model benefits from knowing "this tool exists but you can't use it" so it can give the owner a useful response. The Engine doesn't care why a tool is unavailable — it just knows it can't execute it. Richer information flows to the intelligence (model), simpler information flows to the executor (Engine). |
| D109 | Owner controls which tools are sent with every prompt (always-send set) vs. available on demand (discoverable set) — a discovery meta-tool bridges the gap | Sending every registered tool definition with every prompt wastes context, costs tokens, and degrades model quality as tool count grows. Splitting into owner-configured always-send + discoverable sets keeps the prompt lean while preserving access to everything. The owner — not the platform — decides the tradeoff. This is a concrete expression of user-owned AI: you control what your AI has at its fingertips. |
| D135 | Memory/tool binary — if it's data, it's memory; if it's not data, it's a tool | All data, anywhere, is memory — the only question is whose. Tools are the verbs, memory is the nouns. Clean binary that decomposes everything the system processes. |
| D141 | Tool configs are environment configuration, not personal data — they travel with the deployment, not with Your Memory | Dave J identified that storing tool configs in Your Memory creates a false dependency: move your memory to another system and it references tools that don't exist. Tool plumbing (server addresses, ports) and installation describe the deployment environment, not the user's personal data. Same principle as `.env` files or `settings.json`. **Refined by D141-refined:** original scope was too broad. Tool definitions → provided by tools themselves (D146). Tool preferences (always-send, policies) → Your Memory (D145). Only plumbing stays in environment config. See `configuration-spec.md` §Impact on D141. |
| D141-refined | Three-way split: tool definitions → self-describing (D146), plumbing → environment config, preferences → Your Memory (D145) | Original D141 scope was too broad — moving everything to environment config pulled personal preferences away from the owner. The refinement keeps only plumbing in environment config, returns preferences to Your Memory, and lets tools self-describe their own definitions. |
| D145 | Tool preferences are personal data in Your Memory — they travel with you | "Always load git tools" is about you, not about this desk. Preferences (always-send set, policies, interaction style) belong in Your Memory because they describe the owner, not the deployment. |
| D146 | Tools self-describe — definitions come from the tools themselves, not from manual configuration | MCP tools describe themselves via protocol. Other tools provide manifest files. Nobody writes tool definitions manually. This is the first leg of the D141-refined three-way split. |

---

## Open Questions

### OQ-1: Tool discovery/registration path in V1+

In the MVP, tools are in-process — the Engine calls them directly. In V1+, when tools run as separate services or containers, how does discovery work? Two options:

1. **Engine-direct** — The Engine connects to configured tool servers at startup and discovers their capabilities via MCP. Tools register with the Engine, not the Gateway.
2. **Gateway-mediated** — Tools register through the Gateway API, the same way any external client connects. The Gateway tells the Engine what tools are available.

Option 1 is simpler and matches how MCP works today. Option 2 enforces the parity principle (tools use the same API as clients) but adds complexity to the Gateway. This doesn't need to be resolved for the MVP — tools are in-process either way. Revisit for V1 Gateway design.

**Source:** 2026-02-25 foundation architecture discussion (Dave W + Dave J). Dave J described tools "talking to the engine through the API gateway." Current spec has Engine executing tools directly. Both are valid — the question is which path V1 takes.

---

## Success Criteria

- [ ] Adding a tool to the environment requires only adding data (configuration, files) — no code changes to Engine, Your Memory, Client, or Auth
- [ ] Removing a tool from the environment requires only removing data — no code changes
- [ ] The Engine executes tool calls without knowing or caring what the tools do
- [ ] Auth controls tool access without the Engine or Your Memory knowing about permissions
- [ ] Scope expansion (library → filesystem → external → inbound) works by adding tools — no architectural changes
- [ ] The model can distinguish between "tool doesn't exist" and "tool exists but not permissioned" — the Engine doesn't need to
- [ ] Skills (recipes in Your Memory) reference tools (equipment in the environment) and both work independently — changing a skill doesn't require changing tools, adding a tool doesn't require changing skills
- [ ] The owner can configure which tools are in the always-send set — no code changes, just configuration
- [ ] A discovery tool can find and load tools from the discoverable set at runtime — the model decides when to search, the Engine stays a pass-through

---

## Security Requirements

Per-component requirements from `security-spec.md`. Security-spec owns the "why"; this section owns the "what" for Tools.

- [ ] Untrusted tools must run in isolated containers — mandatory, not configurable. Restricted filesystem, restricted network, resource limits
- [ ] Tool isolation must be independent of Auth — even if Auth fails, the tool can't escape its container
- [ ] The system must warn the owner when installing unverified tools on local deployment
- [ ] Managed hosting must enforce a curated tool allow list — no unvetted tools
- [ ] Tool crashes must not take down the Engine — containerized tools fail independently

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-01 | Codex cross-reference audit fixes: (1) Untrusted tool isolation — "by default" → "mandatory, not configurable" in Security Requirements, aligns with security-spec "mandatory isolation." (2) Owner-installed tools — "fall wherever the owner decides" → "isolated by default, owner can override," aligns with security-spec language. | Codex audit (Dave W + Claude) |
| 2026-03-01 | "No users, only owners" language pass: user → owner throughout | Ownership model alignment (Dave W + Claude) |
| 2026-02-28 | Added "Discovery at scale" subsection — how discovery works at hundreds/thousands of tools: catalog as data, two-step search-then-load, source-based tool identity. No new components or architectural changes. | Working session (Dave W + Claude) |
| 2026-02-27 | D141-refined: Three-way walkback of D141. Tool definitions → self-describing (D146). Tool preferences (always-send, policies) → back to Your Memory (D145). Only plumbing (addresses, ports) stays in environment config. Table, registration section, D52/D141 rationales, and closing summary updated. | Configuration spec interview (Dave W + Claude + Codex) |
| 2026-02-27 | D141: Tool definitions, configuration, and installation moved from "Memory" to "Engine/environment config." Skills and instructions remain in Your Memory. D52 rationale refined. Closing summary updated. | Foundation architecture lock-in debate (Dave W + Dave J + Claude) |
| 2026-02-27 | Reorder + trim: why→what→how flow, merged "What Tools Actually Are" into binary section, folded "Not a Connector" into "Not a Component", moved Scope/Skills/Context Management before implementation detail, condensed isolation (table replaces ASCII art), condensed lifecycle/health/upgrades, removed Level 1/2/3 section (covered in intro + context management). ~450 lines from 570. | Spec maintenance (Dave W + Claude) |
| 2026-02-27 | Added Security Requirements section — cross-referenced from security-spec.md per T-219 | T-219 (Dave W + Claude) |
| 2026-02-23 | Initial Tools spec created from interview — established that Tools is not a component or connector | Tools interview session (Dave W + Claude) |
| 2026-02-23 | Consistency pass — updated "Impact on Architecture" to reflect final architecture (D64): 4 components, 2 connectors, 3 external dependencies. Replaced stale component/connector tables (had wrong counts, "Engine API" → "Gateway API", Interface/Models listed as components). Replaced "updates deferred" note with reconciliation confirmation. | Cross-doc consistency audit (Dave W + Claude) |
| 2026-02-25 | Added "How the Engine Discovers and Executes Tools" section — execution loop, registration model, MVP vs V1+ path, Gateway API parity principle, tool isolation. Expanded "Tools and Skills" with skill-tool pattern, approval gates rationale, MVP tool inventory. Added OQ-1 (tool discovery path for V1+). | Foundation architecture deep dive (Dave W + Dave J) |
| 2026-02-25 | Added "Tool Context Management" section — always-send set vs discoverable set, owner controls which tools are sent with every prompt, discovery meta-tool for the long tail. Added D109. | Working session (Dave W + Claude) |
| 2026-02-25 | Expanded "Where tools live & isolation model" — replaced thin MVP/V1+ and isolation subsections with comprehensive treatment: where tool executables live (in-process, sibling container, remote service), how the Engine communicates with tools (MCP stdio/network, CLI, native), expanded isolation model (trust levels, isolation spectrum, crash recovery), and tool lifecycle (start, stop, health, upgrades). | Working session (Dave W + Claude) |

---

*Tools is the spec that explains why it doesn't need to be a spec. Every architecture assumes tools need a dedicated subsystem — registries, protocols, discovery frameworks, execution engines. This one doesn't. Tools are data — definitions come from the tools themselves (self-describing), plumbing (addresses, ports) is environment config, preferences (always-send, policies) and skills are personal data in Your Memory. The Engine executes tool calls. Auth permissions them. There's nothing left over.*









