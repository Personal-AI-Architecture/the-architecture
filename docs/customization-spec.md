# Customization: How Products Build on the Foundation

> **Project:** Pivot
> **Generated from:** Customization interview session (Dave W + Claude) on 2026-02-26
> **Status:** Final — ready for implementation
> **Architecture:** See `foundation-spec.md` for platform architecture (components, contracts, connectors)

---

## How we define customization

Every AI system has an extension model — plugins, hooks, middleware, SDKs, custom code. So what's different here?

Here, customization is **content, not code.** The Foundation is a runtime — you don't extend it with code, you write programs that run on it. Your "program" is Your Memory content + tools + configuration + client. The runtime executes it. Components (Your Memory, Engine, Auth, Gateway) stay generic and unmodified. Prompts are the code now — the behavior of the system emerges from what's in Your Memory and what tools are available, not from custom code in the Engine, Gateway, or Auth.

A Level 2 product is a dependency relationship, not a fork (D112). Your product repo imports Level 1 as a dependency. Level 1 improvements flow to every Level 2 product automatically. BrainDrive is the reference Level 2 product.

The audience is builders — product developers, AI agents, or product team members who want to know what ships by default, what's customizable, and how. Without this doc, every builder has to reverse-engineer the customization model from six component specs.

> **Level 1 (Foundation):** This spec defines customization mechanisms that apply to any system built on the Foundation — the same mechanisms Level 2 builders and Level 3 owners both use.

**Related documents:** `foundation-spec.md` (architecture overview, links to all component specs)

---

## The Customization Model

### Defaults, Not Fixed Contracts

The Foundation ships sensible defaults for everything a working system needs — runtime config shape, tool discovery mechanism, basic configuration behavior. **These are defaults, not fixed contracts.** Override any of them.

The only fixed contracts are the two connectors:

| Contract | Fixed? | Why |
|----------|--------|-----|
| **Gateway API** | Yes | This is how clients talk to the system. Without a stable contract, clients break when internals change. |
| **Provider API** | Yes | This is how the Engine talks to models. Without a stable contract, model swapping breaks. |
| **Everything else** | Defaults | Bootstrap mechanism, tool discovery, configuration — all overridable. |

This is the same "drop-down menu" principle from the foundation spec (Principle 3) applied to the Foundation's own internals. Bootstrap via minimal Engine config? That's the default. Tool discovery via configured sources + self-description? That's the default. Change either if your product needs something different.

### What the Levels Mean (Working Model)

| Level | What it is | Functional? | Who provides it |
|-------|-----------|-------------|-----------------|
| **Level 1 — Foundation** | Components + connectors + sensible defaults. The working generic system. | Yes — minimal but working | Foundation repo |
| **Level 2 — Product** | Level 1 + product opinions (methodology, skills, starter content, branded client, default tools). | Yes — opinionated product | Product repo (e.g., BrainDrive) |
| **Level 3 — Personalization** | Level 2 + owner customization (life pages, custom skills, preferences, industry packages). | Yes — personalized | The owner |

Level 2 and Level 3 use **the same customization mechanisms**. The difference is who does it and when — a product builder ships Level 2 opinions as a product, an owner adds Level 3 opinions after the fact. The technical operations are identical.

**Every recipient is an owner, not a user.** When a coach ships a coaching product, each coaching client gets their own personal AI system with the coach's defaults. The client owns their data, their Memory, their system. They're not registering for the coach's platform — they're receiving their own system that happens to start with the coach's methodology. This is the fundamental difference from traditional SaaS.

A Level 2 product can be as thin as "Foundation + specialized Your Memory for coaching" or as thick as BrainDrive (which adds opinions across Your Memory, tools, config, and client). There's no minimum requirement — if you add one opinion to the Foundation and ship it, that's a Level 2 product.

---

## The Four Customization Mechanisms

There are four ways to customize the Foundation. All Level 2 and Level 3 customization works through these mechanisms.

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

**Level 1 default:** The Foundation provides the bootstrap mechanism (minimal Engine bootstrap prompt/config). **Level 2 provides the bootstrap target content** in Your Memory (for example, AGENT.md) and can override path/format conventions.

**What stays generic:** Your Memory itself has no opinions. It stores and retrieves. It doesn't know what AGENT.md means or why your folder structure exists. The model reads the content and acts on it.

### 2. Tools

**What it is:** Capabilities in the environment that the Engine can execute.

**How it works:** Tools are data — definitions, code, instructions — that live in the environment (D51, D52). Your product ships the tools needed for its use case. The Engine executes tool calls without knowing what the tools do. Auth controls who can use which tools.

**What you provide:**

| Tool concern | What you decide | Example (BrainDrive) |
|-------------|----------------|---------------------|
| Which tools ship | The default tool set for your use case | Filesystem tools, skill loader, Git tool, approval gate |
| Always-send set | Which tools are in every prompt by default (D109) | Filesystem read/write/search, skill tool, approval gate |
| Tool protocol | What protocol your tools use | MCP as default (D32), CLI for Git, native for approval gate |
| Discoverable set | What's available on demand but not in every prompt | Future: marketplace tools, third-party integrations |

**Level 1 default:** The Foundation ships a tool discovery mechanism — runtime config declares `tool_sources`, the Engine scans those sources, and tools self-describe (MCP/manifest/code). Tool preferences (always-send, policies) live in Your Memory. Override the mechanism if your product needs different discovery.

**What stays generic:** The Engine is a pass-through executor. It doesn't care what tools exist or what they do. It calls whatever the model asks for and returns the result.

### 3. Config

**What it is:** Settings that control system behavior without modifying code.

**How it works:** Configuration tells the Foundation's components how to behave. Your product provides sensible defaults; the owner can override them. See `configuration-spec.md` for the three-category model (preferences, runtime config, tool self-description) and layered overrides.

**What you provide:**

| Config area | What you decide | Example (BrainDrive) |
|------------|----------------|---------------------|
| Model provider | Default provider and model | OpenRouter with configurable model selection |
| Provider settings | API key references (env var names), temperature, token limits | `$OPENROUTER_API_KEY`, sensible defaults |
| Auth settings | Authentication and authorization config | V1: owner-only (see `auth-spec.md`) |
| Deployment settings | How the system runs | Docker configuration, port assignments, resource limits |
| Tool plumbing | Which tool sources to scan and how to connect | MCP server endpoints, CLI tool paths, manifest directories |

**Level 1 default:** The Foundation ships defaults for all configuration. A Level 2 product overrides whatever it needs — model provider, auth mode, deployment config — and leaves the rest. Provider and model swaps are config-only, zero code changes (see `adapter-spec.md` for how adapters make this work).

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

**Level 1 default:** The Foundation doesn't ship a client. A client is a Level 2 product decision. Any client that speaks the Gateway API is valid.

**What stays generic:** The Gateway API is client-agnostic (D59). It doesn't know or care what the client looks like. Multiple clients can coexist — web, mobile, CLI, voice, Discord, all connecting to the same system through the same API.

**Branding is a client concern, not an architecture concern.** A coaching product built on the Foundation can have its own branding, its own name, its own look — the Foundation has no branding baked into its components or connectors.

---

## User Stories

### CS-1: Build a Level 2 Product from Scratch — **Open**

As a product builder, I want to build a new product on the Level 1 Foundation so that I get a working AI system without building the infrastructure myself.

<details>
<summary>Details — source, steps, acceptance criteria</summary>

**Source:** Customization interview (Dave W + Claude, 2026-02-26)

**Steps:**
1. Builder adds Level 1 Foundation as a dependency (package, not fork)
2. Builder creates Your Memory content for their use case (bootstrap target file, folder structure, skills, starter content)
3. Builder configures tools for their use case (which tools ship, always-send set, tool protocols)
4. Builder sets runtime/adapter configuration (provider adapter, auth mode, deployment config, `tool_sources`)
5. Builder optionally creates a branded client that speaks the Gateway API
6. Builder packages the product (repo for developers, Docker image for owners)
7. System boots with minimal Engine bootstrap config, reads product entrypoint from Your Memory, discovers tools from configured sources, and is ready for use

**Acceptance Criteria (Given-When-Then):**

```gherkin
Given a Level 1 Foundation installed as a dependency
When a builder provides Your Memory content, tool preferences, and runtime/adapter config
Then the system boots and functions as the builder's product
And no Level 1 code has been modified
```

```gherkin
Given a Level 2 product built on the Foundation
When the Foundation repo ships an update (bug fix, new capability)
Then the Level 2 product can adopt the update without conflict
Because it depends on Level 1 as a package, not a fork
```

**Status:** Open

</details>

### CS-2: Customize Your Memory Content — **Open**

As a product builder, I want to ship custom Your Memory content (bootstrap file, folder structure, skills) so that my product has a specific methodology and personality.

<details>
<summary>Details — source, steps, acceptance criteria</summary>

**Source:** Customization interview, Your Memory spec (D40, D43, D50)

**Steps:**
1. Builder creates a bootstrap target file (e.g., AGENT.md) with product-specific instructions
2. Builder creates a folder structure for the use case
3. Builder creates skills as markdown files
4. Builder creates starter content (templates, examples)
5. System boots with minimal Engine bootstrap config that points to the target file, then model discovers the rest from Your Memory

**Acceptance Criteria (Given-When-Then):**

```gherkin
Given a Level 2 product with custom Your Memory content
When the Engine starts and applies bootstrap configuration
Then the model follows the product's methodology
And the model discovers skills, folder structure, and starter content from Your Memory
And Your Memory itself has zero knowledge of the product's conventions
```

```gherkin
Given two different Level 2 products with different Your Memory content
When both run on the same Foundation
Then each behaves according to its own Your Memory content
And the Foundation code is identical in both cases
```

**Status:** Open

</details>

### CS-3: Ship Custom Tools — **Open**

As a product builder, I want to ship tools specific to my use case so that the system has the capabilities owners need.

<details>
<summary>Details — source, steps, acceptance criteria</summary>

**Source:** Customization interview, Tools spec (D51, D104, D109)

**Steps:**
1. Builder creates or selects tools for the use case (MCP servers, CLI tools, native functions)
2. Builder configures which tools are in the always-send set (sent with every prompt)
3. Builder configures which tools are in the discoverable set (available on demand)
4. Builder configures tool plumbing in runtime config (`tool_sources`) and sets tool preferences in Your Memory
5. Engine discovers tools from configured sources at startup, connects to available tools, and includes self-described definitions in prompts

**Acceptance Criteria (Given-When-Then):**

```gherkin
Given a Level 2 product with custom tools configured
When the Engine starts
Then it discovers and connects to the configured tools
And tool definitions appear in prompts sent to the model
And the Engine has zero knowledge of what the tools do
```

```gherkin
Given a Level 2 product that ships different tools than BrainDrive
When the system runs
Then the model uses the product's tools, not BrainDrive's
And the Engine, Your Memory, Auth, and Gateway code is identical
```

**Status:** Open

</details>

### CS-4: Create a Branded Client — **Open**

As a product builder, I want to create my own branded client so that my product has its own identity and experience.

<details>
<summary>Details — source, steps, acceptance criteria</summary>

**Source:** Customization interview, Gateway spec (D57, D59)

**Steps:**
1. Builder creates a client application (web, mobile, CLI, etc.)
2. Client connects to the system through the Gateway API
3. Client uses its own branding, design, and UX patterns
4. System serves the client identically to any other client

**Acceptance Criteria (Given-When-Then):**

```gherkin
Given a Level 2 product with a custom branded client
When the client sends a message through the Gateway API
Then the system processes it identically to any other client
And the Gateway has zero knowledge of the client's branding or identity
```

```gherkin
Given multiple clients connecting to the same Foundation instance
When each client sends messages
Then each receives the same quality of service
And conversations are portable across clients (start on one, continue on another)
```

**Status:** Open

</details>

### CS-5: Industry-Specific Level 2 Product (Coaching Example) — **Open**

As an industry professional (e.g., a coach), I want to build a domain-specific product on the Foundation so that I can ship personal AI systems to my clients without building the infrastructure myself.

<details>
<summary>Details — source, steps, acceptance criteria</summary>

**Source:** Customization interview — coaching platform example (Dave W + Claude, 2026-02-26)

**Steps:**
1. Coach starts with Level 1 Foundation as a dependency
2. Coach creates coaching-specific Your Memory content (client intake templates, session notes structure, goal tracking, coaching frameworks)
3. Coach creates coaching skills (intake interview, session summary, progress review)
4. Coach optionally adds coaching tools (scheduling API integration, CRM connector)
5. Coach creates a branded client ("CoachDrive" or similar)
6. Coach ships as repo + Docker image

**Acceptance Criteria (Given-When-Then):**

```gherkin
Given a coaching product built on Level 1 Foundation
When a coaching client receives their own system
Then it behaves as a personal coaching AI with the coach's methodology
And the client owns their data and Memory
And no Foundation code has been modified
And the coaching product can take Foundation updates without conflict
```

```gherkin
Given a coaching product and BrainDrive both built on the same Foundation
When tools are developed for one product
Then compatible tools work on the other product without modification
Because both share the same connectors and contracts
```

**Status:** Open

</details>

### CS-6: Owner Personalization (Level 3) — **Open**

As an owner, I want to customize my system beyond the Level 2 defaults so that it fits my specific needs.

<details>
<summary>Details — source, steps, acceptance criteria</summary>

**Source:** Customization interview, Ecosystem concept (D110, D113)

**Steps:**
1. Owner starts with a working Level 2 product
2. Owner adds personal Your Memory content (life pages, projects, personal context)
3. Owner adds custom skills for their workflows
4. Owner adjusts tool configuration (adds tools, changes always-send set)
5. Owner adjusts config (model preferences, provider settings)

**Acceptance Criteria (Given-When-Then):**

```gherkin
Given a Level 2 product with Level 3 personalization
When the system runs
Then it reflects both the product opinions (Level 2) and owner preferences (Level 3)
And the customization mechanisms are identical to what the product builder used
```

```gherkin
Given an owner who personalizes their BrainDrive
When BrainDrive ships a product update (Level 2)
Then the owner's personalizations (Level 3) are preserved
And the update applies cleanly because Level 3 content doesn't conflict with Level 2 defaults
```

**Status:** Open

</details>

---

## Invariants & Edge Cases

### Properties That Must Always Hold

- [ ] Level 1 Foundation code is never modified by a Level 2 product — all customization is through Your Memory, tools, config, and client
- [ ] Any Engine that implements the Foundation contract can boot any Level 2 product — the product's behavior comes from Your Memory, not from Engine customization
- [ ] Removing all Level 2 customization leaves a working Level 1 system — the Foundation stands alone
- [ ] Level 2 and Level 3 customization use identical mechanisms — there is no technical difference between product builder customization and owner customization
- [ ] Foundation updates can be adopted by Level 2 products without merge conflicts — because Level 2 is a dependency layer, not a fork
- [ ] Multiple Level 2 products can run on the same Foundation without interfering with each other
- [ ] All customization must work through the four mechanisms — no backdoor code-level modification of Foundation components
- [ ] Secrets never appear in Your Memory or tracked config files — API key references only (see `security-spec.md`)

### Edge Cases to Test

- [ ] Level 2 product ships no custom tools — uses only Foundation defaults. System should still work.
- [ ] Level 2 product ships no bootstrap file — overrides the default with a different bootstrap mechanism. System should still work.
- [ ] Level 2 product overrides a Foundation default (e.g., different bootstrap path) — the override takes precedence cleanly.
- [ ] Two Level 2 products ship conflicting configuration for the same Foundation instance — should be impossible (each Level 2 is its own deployment).
- [ ] Owner (Level 3) overrides a Level 2 default — owner preference takes precedence.
- [ ] Foundation ships a new default that conflicts with an existing Level 2 override — Level 2 override should continue to work.

### Failure Modes

| Scenario | Expected Behavior |
|----------|-------------------|
| Level 2 product ships malformed bootstrap file | Engine reports error at startup — model can't load instructions. Clear error message pointing to the bootstrap file. |
| Level 2 product ships tools that aren't available | Engine reports tool connection failure. Model informed of unavailable tools. System continues with available tools. |
| Foundation update changes a default that Level 2 was relying on | Level 2's explicit override takes precedence. If Level 2 relied on the old default implicitly, the change surfaces as different behavior — caught by Level 2's test suite. |
| Owner tries to customize something the managed hosting deployment restricts | System rejects the customization with a clear message explaining the managed hosting constraint. |

---

## Open Questions

- [x] **OQ-1: What exactly are the Level 1 defaults?** **Partially resolved (D153, D158).** Runtime config: `memory_root: ./your-memory`, `provider_adapter: openai-compatible`, `auth_mode: local`, `tool_sources: [built-in memory tools]`. Bootstrap: minimal generic system prompt, Level 2 overrides via `bootstrapTarget`. Memory tools: native read/write/edit/delete/search/list/history. Default `your-memory/` is empty on first boot. Remaining defaults will emerge during implementation.
- [x] **OQ-2: How does Level 2 depend on Level 1 technically?** **Resolved (D155).** npm package. Level 1 publishes as a package, Level 2 `npm install`s it, imports components, configures, adds opinions, runs. Standard semver versioning.
- ~~**OQ-3: How do Level 2 and Level 3 content coexist without conflicts?**~~ Partially answered: `configuration-spec.md` defines layered overrides (Level 1 → Level 2 → Level 3, owner wins). Remaining conventions (file-level coexistence) deferred to implementation.
- [x] **OQ-4: Does the Foundation repo ship runnable code or specs + contracts?** **Resolved (D153):** Runnable code. The Foundation is a working runtime — `npm install`, provide Your Memory content + tools + config + client, and it runs. Ships sensible defaults (generic OpenAI-compatible provider adapter, local auth, `./your-memory` filesystem, built-in memory tools). All defaults overridable. Specs, schemas, conformance tests ship alongside as documentation and validation.
- ~~**OQ-5: How do we handle versioning across two repos?**~~ Deferred to implementation. Depends on delivery mechanism (see OQ-2).

---

## Success Criteria

- [ ] Builders can understand the customization model — Foundation is a runtime, defaults not contracts, four mechanisms
- [ ] Builders know what to provide to build a Level 2 product — Your Memory content, tools, config, client
- [ ] BrainDrive serves as a reference Level 2 implementation
- [ ] A Level 2 product boots correctly on Level 1 Foundation with custom Your Memory content, tools, and config — no Foundation code modified
- [ ] Level 2 products ship as their own repo (dependency on Level 1) and as Docker images for owners
- [ ] An AI agent can read this spec and build a working Level 2 product without additional guidance

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D43 | Your Memory is an unopinionated substrate — it stores anything, has no opinions about structure | Customization content (bootstrap, skills, folders) lives in Your Memory, but Your Memory doesn't know what any of it means. The model gives it meaning. |
| D51 | Tools are data — definitions, code, instructions that live in the environment | Products ship tools for their use case. The Engine executes tool calls without knowing what the tools do. |
| D50 | Bootstrap prompt is Engine configuration; product entrypoint content lives in Your Memory | Foundation provides minimal bootstrap mechanism. Level 2 products provide/override entrypoint content and conventions. |
| D57 | Clients are external — not a system component | Products ship branded clients that connect through the Gateway API. The system doesn't know or care what the client looks like. |
| D109 | Always-send tool set vs. discoverable set | Products configure which tools appear in every prompt (always-send) and which are available on demand (discoverable). |
| D110 | Three-level ecosystem: Foundation → Product → Personalization | Level 1 provides mechanisms. Level 2 provides product opinions. Level 3 provides owner preferences. All use the same four customization mechanisms. |
| D112 | Level 2 is a dependency relationship, not a fork | Product repos import Level 1 as a package. Foundation updates flow to every Level 2 product automatically. |
| D141-refined | Tool definitions/plumbing/preferences are split across source/mechanism/owner | Definitions self-describe from tools (D146), plumbing is runtime environment config, preferences are personal data in Your Memory (D145). |
| D153 | Foundation repo ships runnable code — working runtime with sensible defaults | Level 2 builders `npm install`, configure, run. Specs/schemas/conformance ship alongside. |
| D155 | Level 2 depends on Level 1 via npm package | Standard dependency management, semver, `npm update` for Foundation improvements. |
| D158 | Level 1 default bootstrap is a minimal generic system prompt | Level 2 overrides via `bootstrapTarget` pointing to product content in Your Memory (e.g., AGENT.md). |

---

## Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-01 | "No users, only owners" pass: added ownership framing paragraph (every recipient is an owner), reframed CS-5 (ship systems to clients, not offer platform), CS-3/CS-4/CS-6 language fixes, "end users" → "owners" throughout, "coaching platform" → "coaching product" | Ownership model alignment (Dave W + Claude) |
| 2026-03-01 | Cross-doc alignment: fixed §Config (API key references not values, removed technology names from auth, added cross-references to configuration-spec and adapter-spec), added security invariant, consolidated invariants, deferred OQs 1-3/5, consolidated success criteria, removed feature-spec boilerplate sections | Cross-spec review (Dave W + Claude) |
| 2026-02-27 | Opener reframe + trim | Consistency with other specs: "How we define customization" opener, folded "Runtime, Not a Framework" into opener, added Level 1 note + related docs line, removed Security Considerations + Conversation References |
| 2026-02-26 | Initial spec created | `/interview` + `/feature-spec` |

---

*The Foundation is a runtime. You don't extend it — you write programs that run on it. Your Memory is your content. Tools are your capabilities. Config is your settings. The client is your interface. Everything else stays generic, stays swappable, stays out of your way.*
