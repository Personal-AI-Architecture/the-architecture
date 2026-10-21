# Personal AI Architecture

> **What this is:** A generic foundation for building personal AI systems. 4 components, 2 APIs, 3 externals. Zero lock-in by design.

## Architecture

```
                              ┌───────────────────────────────────────────────┐
                              │                  YOUR MEMORY                  │
                              │                 (the platform)                │
                              └───────────────────────▲───────────────────────┘
                                                      │
                                             tools (read/write)
                                                      │
      Clients  ──→  Gateway API  ──→  Gateway  ──→  Agent Loop  ──→  Model API  ──→  Models
    (external)                     (component)   (component)                       (external)
                                                      │
                        ─── Auth ───                  └──→ Tools (verbs)  ──→  External Memory (nouns)
                        (separate component:               ├── MCP servers      ├── Salesforce data
                         Gateway calls it on               ├── CLI tools        ├── Weather services
                         every request; Agent              └── Native functions └── The internet
                         Loop before each tool call)
```

### Components (4)

| Component | What it does |
|-----------|-------------|
| **Your Memory** | Persist, retrieve, search, version data. The platform -- zero outward dependencies. Accessed through tools. |
| **Agent Loop** | Generic agent loop: message -> model -> tool calls -> stream response -> repeat. No product-specific logic. |
| **Auth** | Identity and access control. The Gateway calls it on every request; the Agent Loop asks it before each tool call. Permissions live only in Auth. Independently swappable. |
| **Gateway** | Manage conversations (including tool calls and results) and route to Agent Loop with the owner's current model choice. Content-agnostic, interface-agnostic. |

### APIs (2)

| API | What crosses it |
|-----|----------------|
| **Gateway API** | Clients <-> Gateway. Message + conversation ID + metadata -> streamed response. |
| **Model API** | Agent Loop <-> Models. Prompt + tool definitions -> streamed completion + tool calls. |

### Externals (3)

| External | What it is |
|----------|-----------|
| **Clients** | Any interface -- web, CLI, mobile, bot, voice. Connects through Gateway API. |
| **Models** | External intelligence -- cloud or local. Accessed through Model API. |
| **Tools** | Capabilities in the environment. Self-describing. Agent Loop executes, Auth permissions. |

## Key Contracts

- **Gateway <-> Agent Loop:** `POST /agent-loop/chat` with messages array + model + metadata -> SSE stream. See `contracts/openapi/gateway-engine.yaml`.
- **One message shape** across all three contracts: content is a list of parts, and tool calls and tool results are ordinary message parts saved in conversation history.
- **Gateway API:** See `contracts/openapi/gateway-api.yaml`.
- **Model API:** See `contracts/openapi/model-api.yaml`.
- **Shared types:** See `contracts/schemas/`.

## What NOT to Do (Lock-in Checks)

Before merging any non-trivial change, verify:

1. **No component reaches into another's internals** -- components talk through contracts only
2. **Memory has zero outward dependencies** -- removing any component leaves Memory readable
3. **Adding a tool requires zero code changes** -- only configuration/environment changes
4. **Swapping a provider requires zero code changes** -- only config + adapter file
5. **No secrets in Memory or tracked config files** -- secrets live outside Your Memory and are never tracked by git (environment variables, an untracked config file, or a secret store)
6. **Agent Loop has zero product-specific logic** -- product behavior emerges from what's in Memory
7. **Gateway doesn't interpret content** -- it passes through, it doesn't understand
8. **Auth is independent of Gateway** -- the Gateway calls Auth through its contract; swapping either doesn't require changing the other

Full gate: `conformance/lockin-gate.md` (PR checks). Full audit: `conformance/lockin-audit.md` (milestone/release).

## Configuration

Runtime config is 4 fields: `memory_root`, `provider_adapter`, `auth_mode`, `tool_sources`.

Preferences (such as model choice and the always-send tool set) live in Your Memory. The Gateway reads the model choice on every message, so a change applies to the next message with no restart.
Permissions live only in Auth, not in configuration or preferences. The default policy is that the owner can do everything.
Tool definitions are self-describing (from tools themselves).
Secrets live outside Your Memory and are never tracked by git: environment variables, an untracked config file, or a secret store.

## Conformance

An implementation is valid if it passes these tests:

- **SWAP-1/2/3:** Provider, model, and tool swaps succeed with config-only changes
- **ARCH-1:** Memory readable with standard tools when all components are stopped
- **ARCH-2:** Agent Loop replacement doesn't affect other components
- **ARCH-3:** New client connects through Gateway API identically
- **ARCH-4:** All payloads validate against canonical schemas in `contracts/`

See `conformance/` for the full test suite. See `build/implementers-reference.md` for the complete implementation contract.

## File Map

```
├── AGENT.md                              <- you are here
├── spec/                                 <- what every PAA system must promise
├── architecture/                         <- how it works; binding human-readable architecture
├── contracts/                            <- exact OpenAPI, JSON Schema, and canonical examples
│   ├── schemas/                          <- JSON Schema shared types
│   └── openapi/                          <- canonical OpenAPI specs
├── conformance/                          <- language-neutral proof and review checks
├── build/                                <- derived primers, blueprints, prompts, and build help
├── maintainers/                          <- repository health, registries, and maintenance guidance
├── assets/                               <- README and documentation images
└── README.md                             <- repository orientation and implementation-template route
```

## Vocabulary

Use these terms consistently. The "Don't Use" column lists old terms that should be replaced when encountered.

| Use | Don't Use | Notes |
|-----|-----------|-------|
| **Agent Loop** | Engine | Describes what it does: send to model, get tool calls, execute, loop. `gateway-engine.yaml` remains the canonical filename for compatibility; route and schema names use Agent Loop terminology. |
| **APIs** | Connectors | Gateway API, Model API — just call them what they are |
| **Model API** | Provider API | "Model API" is immediately clear |
| **Clients** | External clients | Interfaces that communicate with a system through the Gateway API |
| **Apps** | — | Compositions of instructions, tools, context, configuration, and optional client resources for a bounded outcome |
| **Architecture** | Level 1, Foundation | The product-independent specifications, contracts, guidance, and requirements |
| **Implementation** | Level 2, product | A product or system that follows the Architecture (e.g., BrainDrive) |

Terms that are correct as-is: **Gateway**, **Auth**, **Your Memory**, **Tools**, **Adapters**, **Contracts**.

## Principles

1. **Your Memory Should Have No Outbound Dependencies** -- depends on nothing, everything depends on it
2. **Keep Everything Else Swappable** -- via tools, contracts, and adapters
3. **Keep Responsibilities Where They Belong** -- leaks create lock-in, follow the Responsibility Matrix
4. **Keep It Simple** -- one developer + AI agents can maintain it
5. **Start Constrained, Expand Deliberately** -- each expansion is additive
