---
sidebar_label: Customization
hide_table_of_contents: true
---

# Customization

**Serves stories:** US-11, US-17 in the [PAA spec](../spec/personal-ai-architecture-spec.md).

## What customization is

Customization is how someone turns PAA into a product, such as a coaching assistant, a writing partner or BrainDrive. It's also how you, the owner, make that product your own.

Most AI systems are customized by changing their code: plugins, hooks, forks and custom builds. Each product ends up as its own branch of the software, and each one drifts further from the others. Your data and settings get tied to that one product's version of things, and an update can quietly undo what you changed.

We think that's lock-in built in from the start. If making a product means changing the system's insides, every product becomes a fork, and you're stuck with whoever maintains it.

So in PAA, a product is mostly content, not code. The four components stay generic. A product is made from the same four things anyone can change:

- what's in Your Memory (instructions, skills, starter files)
- which tools ship
- the settings
- the client app you talk to it through, such as a web page, a phone app or a chat window

The product's personality and know-how live in files the model reads, not inside the system.

That means a product built on PAA is still your system. You get the product's defaults, you can change any of them, and your changes survive updates. Tools built for one product can work in any other, and you can leave a product without leaving your data.

## How it works

This works because everything that makes a product different can be written down as content or chosen as a setting. So nothing about a product has to live inside the components.

1. **Four things to change.** Every customization goes through one of four mechanisms: Your Memory content, tools, settings or the client app. Nobody changes the components' code.
2. **The contracts stay fixed; everything else is a default.** The two APIs, the internal handoff and the shared shapes don't change. Everything else the system ships with is a default a product can replace, such as the startup instruction or how tools are found.
3. **Three layers, one set of mechanisms.** The architecture provides a working generic system, a product adds its opinions, and you add yours. Product builders and owners use exactly the same mechanisms, so there's nothing a product sets that you can't change.
4. **Every recipient is an owner.** When a coach ships a coaching product, each client gets their own system with the coach's starting setup, not an account on the coach's platform. The client owns their data.
5. **Products follow the contracts; they don't fork them.** A product is built from the published specs and contracts, in any language, or starting from a template. Remove everything a product added, and what's left is still a working PAA system.

The rest of this doc is the specification: what any implementation of customization must do.

---

## What this covers

### Fixed contracts, overridable defaults

The architecture ships sensible defaults for everything a working system needs — runtime config values, tool discovery mechanism, basic configuration behavior. **These are defaults, not fixed contracts.** Override any of them, as long as the result still meets the published specs and contracts.

The fixed contracts are the two APIs, plus the internal Gateway ↔ Agent Loop contract and the shared shapes in `contracts/` (such as the four-field runtime config):

| Contract | Fixed? | Why |
|----------|--------|-----|
| **Gateway API** | Yes | This is how clients talk to the system. Without a stable contract, clients break when internals change. |
| **Model API** | Yes | This is how the Agent Loop talks to models. Without a stable contract, model swapping breaks. |
| **Internal contract and shared schemas** | Yes | A replacement Agent Loop or Gateway must keep working with the other side; `contracts/` is authoritative for every shape. |
| **Everything else** | Defaults | Bootstrap content, tool discovery, configuration values — all overridable. |

This is principle 2, *Keep Everything Else Swappable* ([principles.md](./principles.md)), applied to the architecture's own internals. Bootstrap via minimal Agent Loop config? That's the default. Tool discovery via configured sources + self-description? That's the default. Change either if your product needs something different.

### Who Customizes What

| Layer | What it is | Functional? | Who provides it |
|-------|-----------|-------------|-----------------|
| **Architecture** | Components + APIs + sensible defaults. The working generic system. | Yes — minimal but working | Architecture repo |
| **Implementation** | Architecture + product opinions (methodology, skills, starter content, branded client, default tools). | Yes — opinionated product | Product repo (e.g., BrainDrive) |
| **Owner personalization** | Implementation + owner customization (life pages, custom skills, preferences, industry packages). | Yes — personalized | The owner |

Implementation and owner preferences use **the same customization mechanisms**. The difference is who does it and when — a product builder ships implementation opinions as a product, an owner adds their own preferences after the fact. The technical operations are identical.

**Every recipient is an owner, not a user.** When a coach ships a coaching product, each coaching client gets their own personal AI system with the coach's defaults. The client owns their data, their Memory, their system. They're not registering for the coach's platform — they're receiving their own system that happens to start with the coach's methodology. This is the fundamental difference from traditional SaaS.

An implementation can be as thin as "Architecture + specialized Your Memory for coaching" or as thick as BrainDrive (which adds opinions across Your Memory, tools, config, and client). There's no minimum requirement — if you add one opinion to the Architecture and ship it, that's an implementation.

## What the system guarantees

These properties must always hold.

- Architecture contracts are never changed by an implementation — all customization is through Your Memory, tools, config, and client
- Any Agent Loop that implements the architecture contract can boot any implementation — the product's behavior comes from Your Memory, not from Agent Loop customization
- Removing all implementation customization leaves a conforming system — the generic components stand alone
- Implementation and owner customization use identical mechanisms — there is no technical difference between product builder customization and owner customization
- Owner changes survive product updates — where an update conflicts with an owner change, the owner is told instead of having it overwritten silently
- Multiple implementations can run on the same Architecture without interfering with each other
- All customization must work through the four mechanisms — no backdoor code-level modification of architecture components
- Secrets never appear in Your Memory or tracked config files — API key references only (see [security-spec.md](./security-spec.md))

## The Four Customization Mechanisms

There are four ways to customize the Architecture. All implementation and owner customization works through these mechanisms.

### 1. Your Memory Content

**What it is:** Files, folders, and structured data that ship with your product.

**How it works:** Your Memory is an unopinionated substrate (D43). It stores anything. Your product provides the *content* that gives the system personality, methodology, and purpose. The model reads Your Memory through tools and gives it meaning.

**What you provide:**

| Content | What it does | Example (BrainDrive) |
|---------|-------------|---------------------|
| Bootstrap target file | First instruction target the model reads at startup | AGENT.md with BrainDrive methodology and instructions |
| Folder structure | Organizes the owner's workspace | `library/`, `projects/`, `system/` with starter content |
| Skills | Prompts that teach the model workflows | Interview skill, spec generation skill, build plan skill |
| Starter content | Pre-populated files the owner starts with | Starter library pages, templates, example projects |
| Preference data | Product defaults stored as data in Your Memory | Default model preference, default tool policies, interaction style |

**Architecture default:** The Architecture provides the bootstrap mechanism (minimal Agent Loop bootstrap prompt/config). **The implementation provides the bootstrap target content** in Your Memory (for example, AGENT.md) and can override path/format conventions.

**What stays generic:** Your Memory itself has no opinions. It stores and retrieves. It doesn't know what AGENT.md means or why your folder structure exists. The model reads the content and acts on it.

### 2. Tools

**What it is:** Capabilities in the environment that the Agent Loop can execute.

**How it works:** Tools are capabilities in the environment; their definitions, code and instructions ship with them (D51). Your product ships the tools needed for its use case. The Agent Loop executes tool calls without knowing what the tools do. Auth controls who can use which tools.

**What you provide:**

| Tool concern | What you decide | Example (BrainDrive) |
|-------------|----------------|---------------------|
| Which tools ship | The default tool set for your use case | Filesystem tools, skill loader, Git tool, approval gate |
| Always-send set | The default set of tools in every prompt (D109); the owner decides and can change it | Filesystem read/write/search, skill tool, approval gate |
| Tool protocol | What protocol your tools use | MCP as default (D32), CLI for Git, native for approval gate |
| Discoverable set | What's available on demand but not in every prompt | Future: marketplace tools, third-party integrations |

**Architecture default:** The Architecture ships a tool discovery mechanism — runtime config declares `tool_sources`, the Agent Loop scans those sources, and tools self-describe (MCP/manifest/code). Tool preferences (always-send, policies) live in Your Memory. Override the mechanism if your product needs different discovery.

**What stays generic:** The Agent Loop is a pass-through executor. It doesn't care what tools exist or what they do. It calls whatever the model asks for and returns the result.

### 3. Config

**What it is:** Settings that control system behavior without modifying code.

**How it works:** Configuration tells the architecture's components how to behave. Your product provides sensible defaults; the owner can override them. See [configuration-spec.md](./configuration-spec.md) for the three-category model (preferences, runtime config, tool self-description) and layered overrides.

**What you provide:**

| Config area | What you decide | Example (BrainDrive) |
|------------|----------------|---------------------|
| Model provider | Default provider and model | Provider profiles in the adapter config (D193); a default model and provider, which the owner can change |
| Provider settings | API key references (env var names), optional generation settings | Secret references by name (`api_key_env`); optional generation settings |
| Auth settings | Authentication and authorization config | Owner-only to start (see [auth-spec.md](./auth-spec.md)) |
| Deployment settings | How the system runs | How it's packaged and run (native or containers), port assignments, resource limits |
| Tool plumbing | Which tool sources to scan and how to connect | MCP server endpoints, CLI tool paths, manifest directories |

**Architecture default:** The Architecture ships defaults for all configuration. An implementation overrides whatever it needs — model provider, auth mode, deployment config — and leaves the rest. Provider and model swaps are config-only, zero code changes (see [adapter-spec.md](../architecture/adapter-spec.md) for how adapters make this work).

**What stays generic:** Configuration is data. The architecture reads it. Components behave accordingly. No code changes needed.

### 4. Client

**What it is:** The interface that connects to the system through the Gateway API.

**How it works:** Clients are external (D57). They connect to the system through the Gateway API — the same way any client connects. Your product ships its own branded client. Third-party clients work the same way.

**What you provide:**

| Client concern | What you decide | Example (BrainDrive) |
|---------------|----------------|---------------------|
| Client type | What kind of interface | Web app, command line |
| Branding | Look, feel, identity | BrainDrive branding, theme, design language |
| UX patterns | How the owner interacts | Chat-based interaction, approval cards, action cards |
| Feature surface | What the client exposes | Conversation view, library browser, settings |

**Architecture default:** The Architecture doesn't ship a client. A client is an implementation decision. Any client that speaks the Gateway API is valid.

**What stays generic:** The Gateway API is client-agnostic (D59). It doesn't know or care what the client looks like. Multiple clients can coexist — web, mobile, CLI, voice, Discord, all connecting to the same system through the same API.

**Branding is a client concern, not an architecture concern.** A coaching product built on the architecture can have its own branding, its own name, its own look — the architecture has no branding baked into its components or APIs.

## User stories

The user stories for building a product on the Architecture are [US-17 in the PAA spec](../spec/personal-ai-architecture-spec.md#us-17-build-a-product-on-the-architecture--confirmed): a builder's own content, tools and configuration make the system behave as their product with no architecture contract changes (AC-17.1); two products with different content run on the same architecture (AC-17.2); custom tools work with the Agent Loop unchanged (AC-17.3); a branded client connects through the Gateway API like any other (AC-17.4); and builders start from the published contracts and the TypeScript template, or from the stories and specs alone in any language, not from a package (AC-17.5). Owner changes surviving product updates are [US-11](../spec/personal-ai-architecture-spec.md#us-11-owner-changes-survive-updates-and-updates-can-be-undone--confirmed). This spec explains the mechanisms those stories rely on; it does not define its own stories.

### Example: a coaching product

This example illustrates the four mechanisms; it is not a requirement.

A coach wants to ship personal AI systems to their clients without building the infrastructure.

1. The coach starts from the published contracts and an architecture template (or builds from the specs in any language).
2. The coach creates coaching-specific Your Memory content: client intake templates, a session notes structure, goal tracking, coaching frameworks.
3. The coach writes coaching skills: intake interview, session summary, progress review.
4. The coach optionally adds coaching tools, such as a scheduling integration.
5. The coach builds a branded client that speaks the Gateway API.
6. The coach packages the product however they choose.

Each coaching client receives their own system. It behaves as a personal coaching AI with the coach's methodology, the client owns their data and Your Memory, and no architecture contract has changed. Tools built for the coaching product work on any other product built on the same contracts, because both share the same APIs.

## Failure Modes

| Scenario | Expected Behavior |
|----------|-------------------|
| Bootstrap file missing or unreadable | The model can't load its instructions, and the failure is reported to the owner in the reply, naming the bootstrap file. |
| Implementation ships tools that aren't available | Agent Loop reports tool connection failure. Model informed of unavailable tools. System continues with available tools. |
| Architecture update changes a default that an implementation was relying on | Implementation's explicit override takes precedence. If the implementation relied on the old default implicitly, the change surfaces as different behavior — caught by the implementation's test suite. |

## Checking an implementation

- [ ] Every guarantee in [What the system guarantees](#what-the-system-guarantees) holds
- [ ] A conforming implementation boots with custom Your Memory content, tools, and config without changing the Architecture's contracts
- [ ] Implementations ship from their own repositories and declare which Architecture contracts they follow

### Edge cases to test

- [ ] Implementation ships no custom tools — uses only architecture defaults. System should still work.
- [ ] Implementation ships no bootstrap file — overrides the default with a different bootstrap mechanism. System should still work.
- [ ] Implementation overrides an architecture default (e.g., different bootstrap path) — the override takes precedence cleanly.
- [ ] Two implementations ship conflicting configuration for the same Architecture instance — should be impossible (each implementation is its own deployment).
- [ ] Owner overrides an implementation default — owner preference takes precedence.
- [ ] Architecture ships a new default that conflicts with an existing implementation override — implementation override should continue to work.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D43 | Your Memory is an unopinionated substrate — it stores anything, has no opinions about structure | Customization content (bootstrap, skills, folders) lives in Your Memory, but Your Memory doesn't know what any of it means. The model gives it meaning. |
| D51 | Tools are not a component — they are capabilities in the environment | Products ship tools for their use case. The Agent Loop executes tool calls without knowing what the tools do. |
| D50 | Bootstrap prompt is Agent Loop configuration; product entrypoint content lives in Your Memory | The architecture provides minimal bootstrap mechanism. Products provide/override entrypoint content and conventions. |
| D57 | Clients are external — not a system component | Products ship branded clients that connect through the Gateway API. The system doesn't know or care what the client looks like. |
| D109 | Always-send tool set vs. discoverable set | A product ships the default always-send set; the owner decides which tools are always sent and which are found on demand, and can change the product's choice. |
| D110 | Three layers: architecture → product → owner personalization | The architecture provides mechanisms. An implementation provides product opinions. The owner provides owner preferences. All use the same four customization mechanisms. |
| D112 | A product depends on the architecture; it does not fork it | A product follows the published specs and contracts, in any language or from a template; it never forks them. |
| D141-refined | Tool definitions/plumbing/preferences are split across source/mechanism/owner | Definitions self-describe from tools (D146), plumbing is runtime environment config, preferences are personal data in Your Memory (D145). |
| D158 | The architecture's default bootstrap is a minimal generic system prompt | Products override it with their own entry point content in Your Memory (e.g., AGENT.md). |

---

*The Architecture is a set of contracts. You don't fork it — you build a product that follows them. Your Memory is your content. Tools are your capabilities. Config is your settings. The client is your interface. Everything else stays generic, stays swappable, stays out of your way.*

