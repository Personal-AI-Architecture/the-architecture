---
sidebar_label: Customization
hide_table_of_contents: true
---

# Customization: How Implementations Build on the Architecture

Every AI system has an extension model — plugins, hooks, middleware, SDKs, custom code. So what's different here?

Here, customization is primarily **content, not changes to the architecture.** An implementation combines Your Memory content, tools, configuration, and a client while keeping the four architecture components generic. The behavior of the system emerges from what is in Your Memory and which tools are available, rather than from product-specific logic in the Agent Loop, Gateway, or Auth.

An implementation follows the Architecture's specifications and contracts. Runnable code and implementation tooling live in separate repositories, including the TypeScript architecture template. BrainDrive is one implementation of the Architecture.

The audience is builders — product developers, AI agents, or product team members who want to know what ships by default, what's customizable, and how. Without this doc, every builder has to reverse-engineer the customization model from the component specs.

> **Architecture:** This spec defines customization mechanisms that apply to any system built on the Architecture — the same mechanisms implementers and owners both use.

**Related documents:** [foundation-spec.md](./foundation-spec.md) (architecture overview, links to all component specs)

---

## The Customization Model

### Defaults, Not Fixed Contracts

The Foundation ships sensible defaults for everything a working system needs — runtime config shape, tool discovery mechanism, basic configuration behavior. **These are defaults, not fixed contracts.** Override any of them, as long as the result still meets the published contracts.

The fixed contracts are the two APIs, plus the internal Gateway ↔ Agent Loop contract and the shared shapes in `specs/` (such as the four-field runtime config):

| Contract | Fixed? | Why |
|----------|--------|-----|
| **Gateway API** | Yes | This is how clients talk to the system. Without a stable contract, clients break when internals change. |
| **Model API** | Yes | This is how the Agent Loop talks to models. Without a stable contract, model swapping breaks. |
| **Internal contract and shared schemas** | Yes | A replacement Agent Loop or Gateway must keep working with the other side; `specs/` is authoritative for every shape. |
| **Everything else** | Defaults | Bootstrap content, tool discovery, configuration values — all overridable. |

This is the same "drop-down menu" principle from the foundation spec (Principle 2) applied to the Foundation's own internals. Bootstrap via minimal Agent Loop config? That's the default. Tool discovery via configured sources + self-description? That's the default. Change either if your product needs something different.

### Who Customizes What

| Layer | What it is | Functional? | Who provides it |
|-------|-----------|-------------|-----------------|
| **Architecture** | Components + APIs + sensible defaults. The working generic system. | Yes — minimal but working | Architecture repo |
| **Implementation** | Architecture + product opinions (methodology, skills, starter content, branded client, default tools). | Yes — opinionated product | Product repo (e.g., BrainDrive) |
| **Owner personalization** | Implementation + owner customization (life pages, custom skills, preferences, industry packages). | Yes — personalized | The owner |

Implementation and owner preferences use **the same customization mechanisms**. The difference is who does it and when — a product builder ships implementation opinions as a product, an owner adds their own preferences after the fact. The technical operations are identical.

**Every recipient is an owner, not a user.** When a coach ships a coaching product, each coaching client gets their own personal AI system with the coach's defaults. The client owns their data, their Memory, their system. They're not registering for the coach's platform — they're receiving their own system that happens to start with the coach's methodology. This is the fundamental difference from traditional SaaS.

An implementation can be as thin as "Architecture + specialized Your Memory for coaching" or as thick as BrainDrive (which adds opinions across Your Memory, tools, config, and client). There's no minimum requirement — if you add one opinion to the Architecture and ship it, that's an implementation.

---

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

**How it works:** Tools are data — definitions, code, instructions — that live in the environment (D51, D52). Your product ships the tools needed for its use case. The Agent Loop executes tool calls without knowing what the tools do. Auth controls who can use which tools.

**What you provide:**

| Tool concern | What you decide | Example (BrainDrive) |
|-------------|----------------|---------------------|
| Which tools ship | The default tool set for your use case | Filesystem tools, skill loader, Git tool, approval gate |
| Always-send set | Which tools are in every prompt by default (D109) | Filesystem read/write/search, skill tool, approval gate |
| Tool protocol | What protocol your tools use | MCP as default (D32), CLI for Git, native for approval gate |
| Discoverable set | What's available on demand but not in every prompt | Future: marketplace tools, third-party integrations |

**Architecture default:** The Architecture ships a tool discovery mechanism — runtime config declares `tool_sources`, the Agent Loop scans those sources, and tools self-describe (MCP/manifest/code). Tool preferences (always-send, policies) live in Your Memory. Override the mechanism if your product needs different discovery.

**What stays generic:** The Agent Loop is a pass-through executor. It doesn't care what tools exist or what they do. It calls whatever the model asks for and returns the result.

### 3. Config

**What it is:** Settings that control system behavior without modifying code.

**How it works:** Configuration tells the Foundation's components how to behave. Your product provides sensible defaults; the owner can override them. See [configuration-spec.md](./configuration-spec.md) for the three-category model (preferences, runtime config, tool self-description) and layered overrides.

**What you provide:**

| Config area | What you decide | Example (BrainDrive) |
|------------|----------------|---------------------|
| Model provider | Default provider and model | OpenRouter with configurable model selection |
| Provider settings | API key references (env var names), temperature, token limits | `$OPENROUTER_API_KEY`, sensible defaults |
| Auth settings | Authentication and authorization config | V1: owner-only (see [auth-spec.md](./auth-spec.md)) |
| Deployment settings | How the system runs | Docker configuration, port assignments, resource limits |
| Tool plumbing | Which tool sources to scan and how to connect | MCP server endpoints, CLI tool paths, manifest directories |

**Architecture default:** The Architecture ships defaults for all configuration. An implementation overrides whatever it needs — model provider, auth mode, deployment config — and leaves the rest. Provider and model swaps are config-only, zero code changes (see [adapter-spec.md](./adapter-spec.md) for how adapters make this work).

**What stays generic:** Configuration is data. The Foundation reads it. Components behave accordingly. No code changes needed.

### 4. Client

**What it is:** The interface that connects to the system through the Gateway API.

**How it works:** Clients are external (D57). They connect to the system through the Gateway API — the same way any client connects. Your product ships its own branded client. Third-party clients work the same way.

**What you provide:**

| Client concern | What you decide | Example (BrainDrive) |
|---------------|----------------|---------------------|
| Client type | What kind of interface | Web app (V1), CLI (MVP) |
| Branding | Look, feel, identity | BrainDrive branding, theme, design language |
| UX patterns | How the owner interacts | Chat-based interaction, approval cards, action cards |
| Feature surface | What the client exposes | Conversation view, library browser, settings |

**Architecture default:** The Architecture doesn't ship a client. A client is an implementation decision. Any client that speaks the Gateway API is valid.

**What stays generic:** The Gateway API is client-agnostic (D59). It doesn't know or care what the client looks like. Multiple clients can coexist — web, mobile, CLI, voice, Discord, all connecting to the same system through the same API.

**Branding is a client concern, not an architecture concern.** A coaching product built on the Foundation can have its own branding, its own name, its own look — the Foundation has no branding baked into its components or APIs.

---

## User stories

The user stories for building a product on the Architecture are [US-17 in the PAA spec](../spec/personal-ai-architecture-spec.md#us-17-build-a-product-on-the-architecture--confirmed): a builder's own content, tools and configuration make the system behave as their product with no architecture contract changes (AC-17.1); two products with different content run on the same architecture (AC-17.2); custom tools work with the Agent Loop unchanged (AC-17.3); a branded client connects through the Gateway API like any other (AC-17.4); and builders start from the published contracts and a template, not from a package (AC-17.5). Owner changes surviving product updates are [US-11](../spec/personal-ai-architecture-spec.md#us-11-owner-changes-survive-updates-and-updates-can-be-undone--confirmed). This spec explains the mechanisms those stories rely on; it does not define its own stories.

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

---

## Invariants & Edge Cases

### Properties That Must Always Hold

- [ ] Architecture contracts are never changed by an implementation — all customization is through Your Memory, tools, config, and client
- [ ] Any Agent Loop that implements the architecture contract can boot any implementation — the product's behavior comes from Your Memory, not from Agent Loop customization
- [ ] Removing all implementation customization leaves a conforming system — the generic components stand alone
- [ ] Implementation and owner customization use identical mechanisms — there is no technical difference between product builder customization and owner customization
- [ ] Owner changes survive product updates — where an update conflicts with an owner change, the owner is told instead of having it overwritten silently
- [ ] Multiple implementations can run on the same Architecture without interfering with each other
- [ ] All customization must work through the four mechanisms — no backdoor code-level modification of architecture components
- [ ] Secrets never appear in Your Memory or tracked config files — API key references only (see [security-spec.md](./security-spec.md))

### Edge Cases to Test

- [ ] Implementation ships no custom tools — uses only architecture defaults. System should still work.
- [ ] Implementation ships no bootstrap file — overrides the default with a different bootstrap mechanism. System should still work.
- [ ] Implementation overrides an architecture default (e.g., different bootstrap path) — the override takes precedence cleanly.
- [ ] Two implementations ship conflicting configuration for the same Architecture instance — should be impossible (each implementation is its own deployment).
- [ ] Owner overrides an implementation default — owner preference takes precedence.
- [ ] Architecture ships a new default that conflicts with an existing implementation override — implementation override should continue to work.

### Failure Modes

| Scenario | Expected Behavior |
|----------|-------------------|
| Implementation ships malformed bootstrap file | Agent Loop reports error at startup — model can't load instructions. Clear error message pointing to the bootstrap file. |
| Implementation ships tools that aren't available | Agent Loop reports tool connection failure. Model informed of unavailable tools. System continues with available tools. |
| Architecture update changes a default that an implementation was relying on | Implementation's explicit override takes precedence. If the implementation relied on the old default implicitly, the change surfaces as different behavior — caught by the implementation's test suite. |

---

## Open Questions

- [x] **OQ-1: What exactly are the architecture defaults?** **Partially resolved (D153, D158).** Runtime config: `memory_root: ./your-memory`, `provider_adapter: openai-compatible`, `auth_mode: local`, `tool_sources: [built-in memory tools]`. Bootstrap: minimal generic system prompt, implementations override via `bootstrapTarget`. Memory tools: native read/write/edit/delete/search/list/history. Default `your-memory/` is empty on first boot. Remaining defaults will emerge during implementation.
- [x] **OQ-2: How does an implementation depend on the Architecture technically?** **Superseded by the documentation-first repository split.** Implementations follow the published specifications and contracts; the separate TypeScript template supplies runnable starting code.
- ~~**OQ-3: How do implementation and owner content coexist without conflicts?**~~ Partially answered: [configuration-spec.md](./configuration-spec.md) defines layered overrides (Architecture → Implementation → Owner preferences, owner wins). Remaining conventions (file-level coexistence) deferred to implementation.
- [x] **OQ-4: Does the Architecture repo ship runnable code or specs + contracts?** **Superseded by the documentation-first repository split.** This repository ships specifications, contracts, blueprints, and conformance guidance. Runnable code lives in implementation repositories such as the TypeScript architecture template.
- ~~**OQ-5: How do we handle versioning across two repos?**~~ Deferred to implementation. Depends on delivery mechanism (see OQ-2).

---

## Success Criteria

- [ ] Builders can understand the customization model — fixed contracts, overridable defaults, four mechanisms
- [ ] Builders know what to provide to build an implementation — Your Memory content, tools, config, client
- [ ] BrainDrive serves as an example implementation
- [ ] A conforming implementation boots with custom Your Memory content, tools, and config without changing the Architecture's contracts
- [ ] Implementations ship from their own repositories and declare which Architecture contracts they follow
- [ ] An AI agent can read this spec and build a working implementation without additional guidance

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D43 | Your Memory is an unopinionated substrate — it stores anything, has no opinions about structure | Customization content (bootstrap, skills, folders) lives in Your Memory, but Your Memory doesn't know what any of it means. The model gives it meaning. |
| D51 | Tools are data — definitions, code, instructions that live in the environment | Products ship tools for their use case. The Agent Loop executes tool calls without knowing what the tools do. |
| D50 | Bootstrap prompt is Agent Loop configuration; product entrypoint content lives in Your Memory | Foundation provides minimal bootstrap mechanism. Products provide/override entrypoint content and conventions. |
| D57 | Clients are external — not a system component | Products ship branded clients that connect through the Gateway API. The system doesn't know or care what the client looks like. |
| D109 | Always-send tool set vs. discoverable set | Products configure which tools appear in every prompt (always-send) and which are available on demand (discoverable). |
| D110 | Three layers: architecture → product → owner personalization | The architecture provides mechanisms. An implementation provides product opinions. The owner provides owner preferences. All use the same four customization mechanisms. |
| D112 | A product depends on the architecture; it does not fork it | Superseded in mechanism by the repository split (OQ-2): products follow the published specs and contracts rather than importing a package. |
| D141-refined | Tool definitions/plumbing/preferences are split across source/mechanism/owner | Definitions self-describe from tools (D146), plumbing is runtime environment config, preferences are personal data in Your Memory (D145). |
| D153 | Foundation repo ships runnable code — working runtime with sensible defaults | Superseded by the repository split (OQ-4): this repo ships specs and contracts; runnable code lives in the separate TypeScript template. |
| D155 | Products depend on the architecture via an npm package | Superseded by the repository split (OQ-2). |
| D158 | The architecture's default bootstrap is a minimal generic system prompt | Products override it with their own entry point content in Your Memory (e.g., AGENT.md). |

---

*The Architecture is a set of contracts. You don't fork it — you build a product that follows them. Your Memory is your content. Tools are your capabilities. Config is your settings. The client is your interface. Everything else stays generic, stays swappable, stays out of your way.*
