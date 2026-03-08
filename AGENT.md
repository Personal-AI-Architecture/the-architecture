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
                        (cross-cutting                     ├── MCP servers      ├── Salesforce data
                         component,                        ├── CLI tools        ├── Weather services
                         applies to all                    └── Native functions └── The internet
                         requests)
```

### Components (4)

| Component | What it does |
|-----------|-------------|
| **Your Memory** | Persist, retrieve, search, version data. The platform -- zero outward dependencies. Accessed through tools. |
| **Agent Loop** | Generic agent loop: message -> model -> tool calls -> stream response -> repeat. No product-specific logic. |
| **Auth** | Cross-cutting identity and access control. Independent of Gateway. Middleware on every request path. |
| **Gateway** | Manage conversations and route to Agent Loop. Content-agnostic, interface-agnostic. |

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

- **Gateway <-> Agent Loop:** `POST /engine/chat` with messages array -> SSE stream. See `specs/openapi/gateway-engine.yaml`.
- **Gateway API:** See `specs/openapi/gateway-api.yaml`.
- **Model API:** See `specs/openapi/model-api.yaml`.
- **Shared types:** See `specs/schemas/`.

## What NOT to Do (Lock-in Checks)

Before merging any non-trivial change, verify:

1. **No component reaches into another's internals** -- components talk through contracts only
2. **Memory has zero outward dependencies** -- removing any component leaves Memory readable
3. **Adding a tool requires zero code changes** -- only configuration/environment changes
4. **Swapping a provider requires zero code changes** -- only config + adapter file
5. **No secrets in Memory or config files** -- secrets live in environment variables only
6. **Agent Loop has zero product-specific logic** -- product behavior emerges from what's in Memory
7. **Gateway doesn't interpret content** -- it passes through, it doesn't understand
8. **Auth is independent of Gateway** -- swapping either doesn't affect the other

Full gate: `docs/lockin-gate.md` (PR checks). Full audit: `docs/lockin-audit.md` (milestone/release).

## Configuration

Runtime config is 4 fields: `memory_root`, `provider_adapter`, `auth_mode`, `tool_sources`.

Preferences (model choice, tool policies) live in Your Memory.
Tool definitions are self-describing (from tools themselves).
Secrets live in environment variables only.

## Conformance

An implementation is valid if it passes these tests:

- **SWAP-1/2/3:** Provider, model, and tool swaps succeed with config-only changes
- **ARCH-1:** Memory readable with standard tools when all components are stopped
- **ARCH-2:** Agent Loop replacement doesn't affect other components
- **ARCH-3:** New client connects through Gateway API identically
- **ARCH-4:** All payloads validate against canonical schemas in `specs/`

See `docs/guides/conformance/` for full test suite. See `docs/guides/implementers-reference.md` for the complete implementation contract.

## File Map

```
├── AGENT.md                              <- you are here
├── docs/
│   ├── foundation-spec.md                <- architecture: components, contracts, principles
│   ├── engine-spec.md                    <- Agent Loop component
│   ├── memory-spec.md                    <- Your Memory component
│   ├── gateway-spec.md                   <- Gateway component
│   ├── auth-spec.md                      <- Auth component
│   ├── tools-spec.md                     <- why tools are not a component
│   ├── models-spec.md                    <- why models are external
│   ├── adapter-spec.md                   <- swappable contracts via adapters
│   ├── gateway-engine-contract.md        <- the one internal interface
│   ├── configuration-spec.md             <- runtime config, preferences, tool self-description
│   ├── deployment-spec.md                <- runs locally, functions offline
│   ├── security-spec.md                  <- threat model, enforcement
│   ├── customization-spec.md             <- how implementations build on this
│   ├── lockin-gate.md                    <- PR gate: 13 no-lock-in checks
│   ├── lockin-audit.md                   <- milestone audit: deep verification
│   ├── guides/
│   │   ├── implementers-reference.md     <- what each component must do (no rationale)
│   │   └── conformance/                  <- architectural invariant tests
│   └── research/                         <- evaluations and analysis
├── specs/
│   ├── schemas/                          <- JSON Schema shared types
│   └── openapi/                          <- canonical OpenAPI specs
├── src/                                  <- implementation
└── test/                                 <- tests
```

## Vocabulary

Use these terms consistently. The "Don't Use" column lists old terms that should be replaced when encountered.

| Use | Don't Use | Notes |
|-----|-----------|-------|
| **Agent Loop** | Engine | Describes what it does: send to model, get tool calls, execute, loop |
| **APIs** | Connectors | Gateway API, Model API — just call them what they are |
| **Model API** | Provider API | "Model API" is immediately clear |
| **Clients** or **Apps** | External clients | Web app, CLI, mobile app, Discord bot — concrete terms |
| **Architecture** | Level 1 | The specs, contracts, and reference implementation |
| **Implementation** | Level 2 | What you build on the architecture (e.g., BrainDrive) |

Terms that are correct as-is: **Gateway**, **Auth**, **Your Memory**, **Tools**, **Adapters**, **Contracts**.

## Principles

1. **Your Memory Should Have No Outbound Dependencies** -- depends on nothing, everything depends on it
2. **Keep Everything Else Swappable** -- via tools, contracts, and adapters
3. **Keep Responsibilities Where They Belong** -- leaks create lock-in, follow the Responsibility Matrix
4. **Keep It Simple** -- one developer + AI agents can maintain it
5. **Start Constrained, Expand Deliberately** -- each expansion is additive
