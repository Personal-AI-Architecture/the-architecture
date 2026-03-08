---
hide_table_of_contents: true
---

# Lock-In Risk Analysis: Foundation Architecture

> **Purpose:** Explain how the architecture achieves zero lock-in at every layer, and identify the implementation disciplines required to keep it that way.
> **Architecture:** [Foundation Spec](../foundation-spec.md) — component definitions, 12 architecture specs, decisions D1-D159

---

## Why This Document Exists

The foundation spec ([foundation-spec.md](../foundation-spec.md)) makes a specific architectural argument: every component communicates through defined interfaces, so any component can be replaced without touching anything else. You can take everything with you, and you can swap anything out.

This document explains how the architecture achieves zero lock-in and what disciplines maintain it. The audience is implementers building on the Foundation and evaluators assessing the architecture's portability claims. The architecture is designed for zero lock-in at every layer — including no lock-in to the architecture itself. It's your AI system. Implementation drift from the design isn't inherently wrong — it may be intentional and that's your freedom. The risk is *unintentional* drift, where lock-in creeps in without you realizing it. That's what the recommendations guard against: not preventing change, but making sure you know when you're making a trade-off.

---

## The Core Argument

The architecture achieves zero lock-in through one principle: **everything is either an open standard, a file, or behind a contract you own.** And the contracts themselves are swappable via adapters (D139) — thin translation layers between each contract and the components on either side.

The D147 anti-lock-in CI test makes this concrete: three normal swaps (provider, model, tool) must succeed with config-only changes, zero code edits. CI-testable on every release.

| Layer | What It Is | Why There's No Lock-In |
|-------|-----------|----------------------|
| **Your Memory** | Unopinionated substrate accessed through tools | Zero outward dependencies. The contract is the tools, not the storage. Storage can evolve without anything else changing. Exportable in open formats. |
| **Tools** | Capabilities in the environment | Tool protocol is internal to the Engine — not an architectural boundary. Swap the protocol without changing anything else. A tool is a tool (D54) regardless of mechanism. |
| **Intelligence** | Models via provider interface | Config change swaps the model. Config change swaps the router. |
| **Interface** | Web app behind a contract | Talks to the Gateway API, not the Engine. Replace or multiply freely. |
| **Engine** | Generic agent loop | A commodity component — intentionally thin, intentionally generic. Swap the whole thing. |
| **Auth** | Cross-cutting identity layer | Open standards (OAuth 2.1, OIDC). Exportable state. Independent of every other component. |
| **Security** | Foundation mechanisms | Standard containers, open formats. No proprietary security protocols. |
| **Gateway** | Conversation manager | Interface-agnostic. Conversations stored in Your Memory via tools. Clients swappable. |

The rest of this document walks through each component to confirm this holds and to identify where implementation discipline matters.

---

## Component Analysis

### 1. Your Memory (The Platform)

**Spec claim:** Most portable component. Tools guarantee no lock-in. Storage format is an implementation detail.

#### Lock-In Assessment

| Dimension | Risk Level | Detail |
|-----------|-----------|--------|
| **Data format** | None | Open formats only (D48). Everything exportable. No proprietary formats, no binary blobs. Storage mechanisms (files, databases, indexes) are all behind the tool interface — swap storage without changing anything else. |
| **Organization & conventions** | None | Level 2 conventions (entry-point files, folder structure, skill format) live *in* Your Memory as content, not enforced *by* it. Any system that can read the storage can read them. |
| **Version history** | Low | Level 1 requires version history capability. The specific mechanism is a Level 2 choice. If the mechanism evolves, define the abstract version history contract first. |
| **Tool semantics** | Low | If `search` means "grep" today and "semantic search" tomorrow, the tools are stable but behavior changes. Skills may need adjustment — hours, not days. |

#### Why This Is Fully Portable

Your Memory has zero outward dependencies. Every other component depends on it — it depends on none of them. Remove any component, and Your Memory still works. Still readable. Still portable. Still yours.

The contract is the tools, not the storage. Everything accesses Your Memory through tools — the model through the Engine's tool loop, infrastructure through dedicated internal tools. Storage mechanisms can evolve (files → databases → vector indexes → cloud storage) without changing any other component. Each evolution is additive — new tool implementations behind the same interface.

The memory-spec reinforces this with the "robot test" (D43): bring your memory to a future robot without rebuilding. Your Memory is independently inspectable with standard tools (text editor, file browser, database viewer) even when the system is not running.

#### Exit Cost

- **Moving everything:** Minutes to hours depending on storage size. Export in open formats — all storage mechanisms support it.
- **Migrating version history:** Depends on the Level 2 mechanism. Hours if the mechanism is portable (e.g., Git). Longer if converting between systems — define the abstract contract first.

#### Verdict

**Zero lock-in.** The spec's claim fully holds. Memory is the architecture's strongest portability story — zero outward dependencies, accessed through tools, exportable in open formats.

#### Discipline Required

- **Define the abstract version history contract before evolving the mechanism.** The Level 2 version history choice is portable today. If storage evolves, the migration path needs to be defined before the change, not after.

---

### 2. Engine (Generic Agent Loop)

**Spec claim:** The Engine is a commodity component (D39) — intentionally thin, intentionally generic, intentionally free of product-specific logic. Swappable because there's nothing to extract or migrate.

#### Lock-In Assessment

**The architecture has zero Engine lock-in.** The interface talks to the Gateway API contract, not the Engine. Memory doesn't know what Engine reads it. Tools are external to the Engine — the tool protocol is an Engine implementation detail, not an architectural boundary. Auth sits at the edge. Swapping the Engine is invisible to everything else.

Because the Engine is generic — zero product-specific logic — a swap means replacing one commodity implementation with another.

#### What an Engine Swap Actually Involves

| Integration Point | With Generic Engine (D39) | If Engine Accumulates Product Logic |
|---|---|---|
| **Gateway routing** | Gateway routes to new Engine the same way | Gateway coupled to Engine-specific internals |
| **System prompts** | Live in Memory — Engine reads them through tools | Embedded in Engine code — must be extracted |
| **Skill execution** | Skills are markdown in Memory — model reads and follows them (D40) | Coupled to engine-specific multi-turn behavior |
| **Tool execution** | Tool protocol is internal to Engine — swappable implementation detail | Custom tool-calling quirks built into Engine code |
| **Provider interface** | Adapter pattern — any Engine using it gets multiple providers | Coupled to specific provider handling |

**With discipline (generic Engine):** Days — drop in a new Engine behind the Gateway.
**Without discipline (Engine accumulates product logic):** 2-4 weeks — because logic that should live in Memory has leaked into the Engine and must be extracted.

#### What the Gateway API Contract Protects

The contract provides real, structural protection:

- **The interface doesn't rebuild.** It speaks the Gateway API, not the Engine.
- **Memory is untouched.** Files don't move, don't change, don't care which Engine reads them.
- **Tools keep working.** They're external to the Engine — the tool protocol is an implementation detail, not an architectural boundary.
- **Auth stays put.** It's a cross-cutting layer, independent of the Engine.

An Engine swap is replacing one commodity agent loop with another while everything it connects stays in place.

#### Exit Cost

- **With generic Engine discipline (D39):** Days — commodity swap
- **Without discipline (Engine accumulates logic):** 2-4 weeks
- **Adopting an off-the-shelf Engine:** Days to ~1 week

#### Verdict

**Zero architectural lock-in.** The Gateway API contract ensures the swap is contained — nothing outside the Engine is affected. The Engine being generic (D39) and having zero product-specific logic means the swap cost is inherently low. This is reinforced by implementation discipline, not dependent on it.

#### Disciplines Required

1. **Keep the Engine generic (D39).** Zero product-specific logic in the Engine. All behavior emerges from Memory (D40).
2. **Skills and prompt assembly live in Memory, not the Engine (D40).** The model reads instructions from files — the Engine just runs the agent loop.
3. **Document the Engine's interface surface.** Maintain a list of every point where the Gateway and tools connect to the Engine. This is the swap checklist.

---

### 3. Interface (Web App)

**Spec claim:** "Just an API client" (D57). Any client that speaks the Gateway API works. Interface can be redesigned, rewritten, or replaced independently.

#### Lock-In Assessment

| Dimension | Risk Level | Detail |
|-----------|-----------|--------|
| **External dependency** | None | The product owns the interface entirely. |
| **Framework choice** | None (architectural) | React vs. Svelte vs. Vue is a developer preference, not lock-in. The architecture doesn't care. |
| **API contract** | None | Interface speaks the Gateway API. Any client that implements the contract works. Multiple clients can coexist (web + mobile + Discord). |

#### Exit Cost

- **Rewrite in different framework:** Standard web dev effort — weeks for a full UI, but zero architectural risk.
- **Add a second interface (mobile, Discord bot):** Only requires implementing the Gateway API contract. Clean.

#### Verdict

**Zero lock-in.** The spec's claim fully holds. The interface is genuinely "just an API client."

#### Discipline Required

- **Maintain "thin client" discipline.** The interface MUST NOT cache state, manage sessions, or embed business logic. If logic moves into the interface, it weakens portability. Keep it as an API client — nothing more.
- **Version the metadata schema from day one.** Even V1 should send a schema version in page metadata, so future clients can negotiate capabilities.

---

### 4. Intelligence (Models via Provider API)

**Spec claim:** "Provider choice is configuration, not code. The thing that changes fastest in AI — which model to use — is the cheapest thing to change in this architecture."

#### Lock-In Assessment

**Model lock-in — zero:**

The provider interface abstraction works. Changing from Claude to GPT to Gemini is a config change. This is the spec's strongest swappability claim after memory.

D135 elevated models to an external dependency with a clean swappable boundary: weights are memory, inference is a tool. This creates the same clean separation that Auth has — both exist as separate concerns because swappable intelligence can't break security (Auth) and the model's reasoning capability can't be locked into the system (Models). Both share the same architectural exception: they sit outside the core component model specifically to remain independently swappable.

**Provider routing — zero architectural lock-in, but has a reliability consideration:**

| Concern | Detail | Reality |
|---------|--------|---------|
| **Provider availability** | If the configured provider goes down, model access stops until fallback is activated | Operational concern, not lock-in. Add a fallback path. |
| **Provider pricing** | Routing layers may add margin on top of provider prices | Business concern, not lock-in. Can route direct at any time. |
| **Switching providers** | Handle provider-specific auth, streaming, errors | Config change via adapter pattern — not code changes |

#### The Dependency Chain

```
Client
  → Gateway API
    → Engine
      → Provider API Adapter
        → Model Provider (Anthropic / OpenAI / Google / Ollama)
```

Each link is independently swappable, and the Gateway API contract means the provider chain is invisible to the interface. Cloud and local models (Ollama) are interchangeable from the Engine's perspective.

#### Prompt Tuning Reality

In practice, system prompts and skills will be tuned for specific models. Switching models is a config change, but prompt re-tuning may be needed:

- **Config change:** Minutes
- **Prompt validation/re-tuning:** Hours to days

This is ongoing maintenance, not lock-in. Every AI system has this characteristic — it's inherent to working with language models.

#### Exit Cost

- **Switching models (same provider):** Change one preference in Your Memory. Zero code changes.
- **Switching providers:** Change `provider_adapter` in runtime config + new adapter config file. Still zero code changes.
- **Switching provider abstraction entirely:** Only happens via an Engine swap.

#### Verdict

**Zero lock-in.** Model swapping is genuinely a config change. Provider routing is swappable via the adapter pattern. The dependency chain is manageable and each link is independently replaceable.

#### Disciplines Required

1. **Add a provider fallback path.** Config-level ability to route to at least one alternate provider. Test before production.  This is reliability, not lock-in mitigation.
2. **Test skills against two models before launch.** Validates the "config change" claim for your specific prompts.
3. **Pin dependency versions in a manifest.** AI SDK, provider APIs. Monitor for breaking changes.

---

### 5. Tools (Capabilities in the Environment)

**Spec claim:** "We're not even locked into MCP itself. MCP is an open protocol with a permissive license — but more importantly, it describes a pattern (tool discovery + tool execution) that's more fundamental than any specific implementation."

#### Lock-In Assessment

**Individual tool lock-in — zero:**

Each tool is independent. Replace one without touching others. Add without modifying anything. This is the architecture's best feature. The tool protocol is internal to the Engine (D53) — not an architectural boundary — so the protocol itself is swappable without affecting anything else.

**Caught and corrected lock-in risk:** The original D141 would have made tool preferences part of deployment configuration — coupling personal tool choices to the environment. D141-refined corrected this with a three-way split: definitions are self-describing (D146), plumbing lives in environment config, preferences stay in Your Memory (D145). This keeps tool preferences portable with the owner, not locked to a deployment.

**Owner-controlled tool availability (D109):** The owner controls which tools are sent with every prompt via an always-send set, with a discovery tool for the rest. This is a fine-grained portability mechanism — the owner's tool preferences travel with their memory, not with the deployment.

**Level 2 default protocol (MCP) lock-in — effectively zero:**

The Level 1 protection is structural: tool protocol is internal to the Engine, swappable without affecting other components. But the Level 2 default choice also matters practically:

| Mitigating Factor | Why It Matters |
|-------------------|---------------|
| Linux Foundation governance (AAIF) | Won't be abandoned or relicensed on a whim |
| Founding members: Anthropic, OpenAI, Block | The three biggest players in AI agents are invested |
| Ecosystem scale | Thousands of MCP servers, dozens of clients. Network effects protect it. |
| Open specification | Even if the Foundation falters, the spec is open and forkable |
| Industry convergence | No competing protocol has meaningful traction |

The probability of needing to replace MCP is near zero. MCP is the default but not mandated at Level 1 — CLI tools and native functions are equally valid (tools-spec). The realistic maintenance concern is MCP version updates as the spec evolves — and that's standard dependency management, not lock-in.

#### Exit Cost

- **Replacing a single MCP tool:** Hours. Write a new server, swap the config.
- **Upgrading MCP version (minor):** Hours to days of testing.
- **Upgrading MCP version (major, breaking):** Days to weeks of tool updates.
- **Replacing MCP entirely:** Months — but this scenario is essentially impossible given governance and adoption.

#### Verdict

**Zero practical lock-in.** MCP is the right bet. The spec's claim holds — both for individual tool swappability and for the protocol itself. The D141-refined correction demonstrates the architecture's self-correcting discipline: when a lock-in risk was identified in tool configuration, it was caught and fixed before shipping.

#### Discipline Required

- **Track MCP spec version and changelogs.** Subscribe to AAIF announcements.
- **Budget for periodic version updates.** Standard dependency maintenance.
- **Don't overbuild protocol abstraction layers.** The complexity of an abstraction costs more than the near-zero risk it mitigates.
- **Keep tool preferences in Your Memory (D145), plumbing in config (D141-refined).** Don't let the boundary blur.

---

### 6. Auth (Identity, Access, and Permissions)

**Spec claim:** Auth is a first-class component of the architecture — a cross-cutting layer (D60) independent of the Gateway, the Engine, and the Model. Open standards. Exportable state. Swappable implementation.

#### Lock-In Assessment

| Dimension | Risk Level | Detail |
|-----------|-----------|--------|
| **Architecture position** | None | Auth is a cross-cutting layer (D60), independent of Engine and Gateway. No other component knows about callers. |
| **Auth contract** | None | Three operations: Authenticate, Authorize, Manage. Implementation-agnostic — any technology satisfying the contract is valid. |
| **Standards** | None | OAuth 2.1, OpenID Connect, standard token formats. Not proprietary auth protocols. |
| **Data format** | None | Product-owned, not provider-specific. Enables migration between auth providers without losing identities. |
| **State portability** | None | Auth state is fully exportable: identities, policies, configuration. The owner's auth data belongs to them. |

**Why Auth is its own component (D149):** If auth lived in the Model, swapping models means losing security. Auth policies, permissions, identity verification — these must persist across model swaps. This is the same argument that keeps the Model outside Memory. Memory is inert so it stays portable. Auth is independent so the Model stays swappable. Each component's independence is what makes the other components swappable.

**Multi-actor schema built upfront:** The identity schema supports all actor types (owner, collaborator, agent, service, economic, federated) even though only the owner flow works at runtime. Adding a new actor type is a data change, not a schema change. This prevents the most common auth lock-in: a schema that assumes single-user and requires a rewrite to support multi-actor.

#### Exit Cost

- **Switching auth provider:** Change only the auth component — no other component is affected. Days, not weeks.
- **Switching identity provider (password → OAuth → SSO):** Each is additive, not exclusive.
- **Exporting auth state to a new deployment:** Policies import cleanly. References to unknown identities are preserved but inactive.

#### Verdict

**Zero lock-in.** The architecture's claim fully holds. The auth contract is implementation-agnostic, the data format is product-owned, and the state is exportable. Open standards (OAuth 2.1, OIDC) prevent protocol lock-in.

#### Disciplines Required

1. **Maintain open-standard adherence.** Auth decisions are made — the discipline now is keeping the implementation aligned with OAuth 2.1/OIDC rather than drifting to proprietary protocols.
2. **Keep auth stateless if possible.** JWT with short expiry avoids session storage infrastructure.
3. **Test auth export/import across deployments.** The portability claim must be validated, not assumed.

---

### 7. Security (Foundation Mechanisms)

**Spec claim:** "Security controls must not create lock-in" (D29). The Foundation provides mechanisms — scope enforcement, audit logging, content separation, tool isolation, approval gates, version history. Level 2 provides sensible defaults.

#### Lock-In Assessment

| Dimension | Risk Level | Detail |
|-----------|-----------|--------|
| **Tool isolation** | None | OCI standard containers — Docker, Podman, containerd. No proprietary sandboxing. |
| **Encryption** | None | No mandatory app-level encryption at Level 1. OS encryption for local deployment. Export always works regardless of security level. |
| **Audit logging** | None | Logging levels control detail, not whether events are logged. Schema exists from the start. |
| **Scope enforcement** | None | Scope = available tools + Auth permissions (D55). No proprietary scope enforcer. |
| **Content separation** | None | Primary prompt injection defense. Standard architectural pattern, not proprietary. |

**Memory export always works** — the owner can always get their data out regardless of system state, security level, or deployment mode. This is a non-negotiable invariant.

**No deployment choice creates permanent lock-in.** Security enforcement mechanisms work at every capability phase without changing. Local deployment and managed hosting use the same mechanisms with different defaults (D128).

#### Exit Cost

- **Switching deployment modes (local ↔ managed):** Same code, different configuration (D23). No security-related migration.
- **Changing tool isolation approach:** Standard container formats. Any OCI-compatible runtime works.
- **Removing all security beyond auth:** The system still works. Security is additive, not load-bearing.

#### Verdict

**Zero lock-in.** Open standards throughout. Standard containers for isolation, open formats for export, no proprietary security mechanisms. The Foundation provides mechanisms — not opinions about how to use them.

#### Discipline Required

- **Don't introduce proprietary security mechanisms.** Every security control should use open standards or common patterns. If you need custom security, it belongs in Level 2 product code, not the Foundation.
- **Keep memory export functional regardless of security level.** This invariant must be tested, not assumed.

---

### 8. Gateway (Conversation Management)

**Spec claim:** The Gateway manages conversations and routes to the Engine (D58). It's generic, content-agnostic, and interface-agnostic at Level 1 (D59).

#### Lock-In Assessment

| Dimension | Risk Level | Detail |
|-----------|-----------|--------|
| **Conversation storage** | None | Conversations stored via dedicated conversation store tool (D152) — not direct Memory access. Conversations are data in Your Memory, not locked in the Gateway. |
| **Client binding** | None | Interface-agnostic: serves web, CLI, mobile, Discord identically (D59). Any client that can send a message and receive a streamed response works. |
| **Auth coupling** | None | Auth and Gateway are fully independent (D60) — swapping either doesn't affect the other. |
| **Engine coupling** | None | Gateway-Engine contract (D137) is a plain HTTP API. Swapping the Engine doesn't require Gateway changes. |

**Conversations are portable.** Remove the Gateway, and conversations are still intact and readable in Your Memory. The Gateway depends on Your Memory, but Your Memory doesn't depend on the Gateway.

**New interaction paradigms connect without system changes.** A voice interface, an AR overlay, a command-line tool — anything that speaks the Gateway API is a valid client.

#### Exit Cost

- **Replacing the Gateway:** Implement the Gateway API contract and the Gateway-Engine contract. Conversations are in Memory, not in the Gateway.
- **Adding a new client:** Only requires implementing the Gateway API contract. Clean.
- **Switching from web to mobile to Discord:** Conversations persist regardless of which client connects (D61). Start on one, continue on another.

#### Verdict

**Zero lock-in.** Conversations are portable (data in Your Memory, not locked in the Gateway), clients are swappable (any client that speaks the Gateway API works), and auth is independent (D60). The Gateway is a routing and conversation management layer — replace it and nothing else changes.

#### Discipline Required

- **Keep conversations in Your Memory via tools (D152).** If conversation data leaks into Gateway-owned storage, portability breaks.
- **Maintain content-agnostic behavior (D59).** The Gateway passes data through without interpretation. Product-specific conversation behavior belongs in Level 2.

---

## API Analysis

### Gateway API (Product-Defined)

| Dimension | Assessment |
|-----------|-----------|
| **Lock-in** | Zero. The product owns this entirely. Built on the prevailing industry standard (D16), currently OpenAI Chat Completions format, swappable via adapter (D139). |
| **Contract lock-in** | Zero. If the industry standard shifts away from Chat Completions, a Gateway API adapter absorbs the change — components on either side stay untouched (D139). |
| **Adapter detail** | The Gateway API adapter is a thin, stateless translation layer between the external client protocol and the internal message interface. Swap the standard → swap the adapter → nothing else changes. This is a rare swap — only when industry standards shift. |
| **Discipline** | Design it from product needs, not shaped by the current Engine's patterns. This ensures the contract survives any Engine swap. |

### Tool Protocol (Engine Implementation Detail)

| Dimension | Assessment |
|-----------|-----------|
| **Lock-in** | Zero. Tool protocol is internal to the Engine (D53) — not an API, not an architectural boundary. How the Engine communicates with tools is an implementation detail, swappable without affecting any other component. The Level 2 default (currently MCP) has open governance and massive adoption, but the Level 1 protection is structural: the protocol is contained within the Engine. |
| **Discipline** | Track the chosen protocol's versions. Budget for periodic updates. Don't build abstraction layers on top. |

### Provider API (Adapter → Provider)

| Dimension | Assessment |
|-----------|-----------|
| **Lock-in** | Zero. Each link independently swappable. Provider API adapter translates between the Engine's internal interface and whichever provider format is current — this is the most frequently swapped adapter (D139). |
| **Concrete swap costs** | Same provider, different model: change one preference in Your Memory — zero code changes. Different provider: change `provider_adapter` in runtime config (1 field) + provide new adapter config file (1 file) + update env variable if needed — still zero code changes. |
| **Discipline** | Have a config-level fallback to at least one alternate provider. Test it before production. |

### Gateway ↔ Engine Internal Contract (D137)

| Dimension | Assessment |
|-----------|-----------|
| **Lock-in** | Zero. Plain HTTP API contract — one endpoint, SSE streaming, auth on path. Not a third API — two components in the same deployment don't need the ceremony of an external API. |
| **Standards** | HTTP, Server-Sent Events, industry-standard `role` + `content` message format (D16). |
| **Success criteria** | Swapping the Engine does not require Gateway changes. Swapping the Gateway does not require Engine changes. Contract works as both HTTP endpoint and direct function call without shape changes. |
| **Discipline** | Keep the contract explicit and versioned. Auth middleware sits between them independently — authenticates without either component knowing how. |

### Contract Swappability (D139)

The contracts themselves could be a lock-in vector — if the Gateway API binds tightly to OpenAI Chat Completions and that standard shifts, both sides must change. Adapters solve this: components speak an internal interface, and a thin adapter translates to/from the current external standard. Swap the standard → swap the adapter → nothing else changes. This completes the swappability chain: Memory via tools, components via contracts, contracts via adapters. See [adapter-spec.md](../adapter-spec.md).

---

## Foundation-Level Protections

These cross-cutting specs protect the zero-lock-in claim at the infrastructure level. They're not components — they're the structural guarantees that every component depends on.

### Configuration (D143, D144, D147)

Configuration is a cross-cutting concern with its own spec (D143). The architecture separates configuration into three strict categories:

| Category | Where It Lives | What It Contains | Portable? |
|----------|---------------|-----------------|-----------|
| **Preferences** | Your Memory | Personal choices — model, tools, behavior | Yes — travels with you |
| **Runtime config** | Environment | Deployment details — 4 fields only (D144) | No — describes this machine |
| **Tool definitions** | With the tools | Self-describing (D146) — config points to sources | Yes — tools carry their own identity |

**Runtime config is exactly 4 fields (D144).** Anything more creates environment coupling. This constraint is the testability backbone: if a swap requires more than one config change, you've introduced lock-in.

**The D147 anti-lock-in CI test** makes every lock-in claim in this document testable:

1. Start system with provider A, run test suite.
2. Change to provider B via config only.
3. Run same test suite. If any code change was required, the test fails.
4. Repeat for model swap and tool swap.

This is the most concrete enforcement mechanism in the architecture. Every other claim in this document can be validated by this test.

**Precedence chain:** Environment safety > Owner preferences > Product defaults > Foundation defaults. Higher levels override lower levels, but cannot remove Foundation guarantees.

### Deployment (D148, Five Guarantees)

Level 1 defines local deployment only (D148). Managed hosting is Level 2 — same code, stricter configuration via D23.

**Five deployment guarantees:**

1. **Runs on hardware you control.** Owner-controlled hardware — your laptop, your server.
2. **Functions fully offline.** No internet required for core functionality (model access is the obvious exception).
3. **Data stays local by default.** No silent outbound traffic. Localhost-only network default.
4. **Runs on modern consumer hardware.** No specialized infrastructure required.
5. **Single deployable unit by default.** One package, one start command.

**Memory inspectable without the system running.** Text editor, file browser, database viewer — Your Memory is readable without booting the system. This is a portability guarantee that no proprietary system matches.

**Managed hosting = Level 2:** Same code with stricter configuration. No deployment choice creates permanent lock-in. The local path always exists.

#### Verdict

**Zero lock-in.** The local path always exists. Managed hosting is a convenience layer, not a dependency.

### Customization (D153, D155)

Level 2 depends on Level 1 via npm package (D155) — clean semver separation, not a fork. Foundation updates flow automatically without merge conflicts.

**Foundation ships runnable code with sensible defaults, all overridable (D153).** It's a working runtime, not just specs. Two boot modes: standalone (Foundation runs alone) and as-a-dependency (Level 2 imports and customizes).

**Four customization mechanisms only:**

| Mechanism | What It Customizes | Example |
|-----------|-------------------|---------|
| **Your Memory content** | Behavior, personality, knowledge | System prompt, skills, AGENT.md |
| **Tools** | Capabilities | Add MCP servers, CLI tools |
| **Configuration** | Environment and preferences | Model selection, provider, tool availability |
| **Client** | Interface | Web app, mobile app, CLI, Discord bot |

**Invariant: No code modification for Level 2/3.** All customization is runtime, not framework. Removing all Level 2 customization leaves a working Level 1 system. Level 2 and Level 3 use identical mechanisms — no technical difference between builder customization and owner personalization.

#### Verdict

**Zero lock-in.** Products can take Foundation updates without merge conflicts. The four-mechanism constraint prevents the customization surface from growing into a coupling surface.

---

## Cross-Cutting Observations

### 1. Dependency Chain Management

The full path from user to capability:

```
User → Interface → Gateway API → Engine → Provider API Adapter → Model Provider
                                    ↓
                               Tool Protocol → Tool → Your Memory
```

Each link is swappable. With 8+ components in the chain, version management matters — not because of lock-in, but because of standard dependency hygiene. This requires:

- A dependency manifest (version-pinned)
- A change monitoring process (watch for upstream breaking changes)
- A testing strategy that validates the full chain, not just individual components

This is normal open-source dependency management, not an architectural concern.

### 2. Convention Portability (Level 2)

Level 2 products build conventions on top of the Foundation — entry-point files, skill formats, folder structures, methodology. This is sometimes confused with lock-in, but the Level 1 architecture prevents it:

- **Conventions live *in* Your Memory, not enforced *by* it.** They're content, not infrastructure. Your Memory is an unopinionated substrate (D43) — it stores them without depending on them.
- **Open formats make them readable by anything.** A competing system could read everything a Level 2 product wrote — because conventions are stored in open formats behind the tool interface. There's nothing to "export." It's already accessible.
- **What doesn't travel is the agent.** The Engine that *acts on* the conventions is a generic commodity component — and that's swappable behind the Gateway API contract.

The honest framing: **conventions are portable because Memory is portable — and Memory is portable because it has zero outward dependencies.**

### 3. Expertise Considerations

The Engine's language becomes a team working language. The Engine is TypeScript/Node.js (D154), which is the best match for AI agent effectiveness and developer availability. If the Engine is ever swapped for an off-the-shelf alternative, the language may change — but this is a team capability consideration, not lock-in.

---

## Summary Matrix

| Component | Architectural Lock-In | Discipline Required | If Discipline Lapses |
|-----------|----------------------|--------------------|--------------------|
| **Your Memory** | Zero | Define abstract version history contract before evolving the mechanism | Version history migration gets messy |
| **Engine** | Zero | Keep generic (D39) — zero product-specific logic | Swap cost grows from days to weeks |
| **Interface** | Zero | Maintain thin client — no cached state or business logic | Interface becomes harder to replace or multiply |
| **Intelligence** | Zero | Fallback path, test against 2+ models, pin versions | Single point of failure if provider goes down |
| **Tools** | Zero | Track tool protocol versions, keep preferences in Memory (D145) | Tool config couples to deployment |
| **Auth** | Zero | Maintain open-standard adherence (OAuth 2.1, OIDC) | Auth drifts to proprietary protocols |
| **Security** | Zero | No proprietary security mechanisms | Security becomes a lock-in vector |
| **Gateway** | Zero | Keep conversations in Memory via tools (D152) | Conversation data locked in Gateway |
| **Gateway API** | Zero (we own it) | Design independently of current Engine | API becomes Engine-specific wrapper |
| **Provider API** | Zero (adapter) | Concrete swap costs: same-provider = 1 change, cross-provider = 2 changes | Provider coupling |
| **Gateway ↔ Engine** | Zero (internal) | Keep contract explicit and versioned | Components couple internally |
| **Configuration** | Zero | Keep runtime config to 4 fields (D144) | Environment coupling |
| **Deployment** | Zero | Local path always exists | Managed hosting becomes a dependency |
| **Customization** | Zero | Four mechanisms only, no code modification | Customization surface becomes coupling surface |

**Every element: zero architectural lock-in.** The architecture delivers on its promise.

**The only risk is implementation drift** — letting the Engine accumulate product-specific logic (violating D39), letting the interface accumulate state, letting the Gateway API shape itself around one Engine. The disciplines below prevent that drift, and D147's CI test enforces it automatically.

---

## Implementation Disciplines

### Must-Maintain (During V1 Build)

| # | Discipline | What It Protects | Component |
|---|-----------|-----------------|-----------|
| 1 | **Design the Gateway API independently of the Engine** | Ensures the contract survives any Engine swap | Gateway API |
| 2 | **Keep the Engine generic (D39)** | Zero product-specific logic — keeps swap cost at days | Engine |
| 3 | **Add a provider fallback path** | Reliability — config-level routing to at least one alternate provider | Intelligence |
| 4 | **Maintain open-standard adherence in Auth** | OAuth 2.1/OIDC compliance — prevents proprietary protocol drift | Auth |
| 5 | **Test skills against two models before launch** | Validates that model swapping actually works for your specific prompts | Intelligence |
| 6 | **Pin all external dependency versions** | Dependency manifest — AI SDK, MCP spec, provider APIs | Cross-cutting |
| 7 | **Enforce "thin client" as an architectural rule** | Interface stays portable and multipliable | Interface |
| 8 | **Run D147 anti-lock-in CI test on every release** | Three swaps (provider, model, tool) succeed with config-only changes | Cross-cutting |
| 9 | **Keep runtime config to 4 fields (D144)** | Prevents environment coupling | Configuration |

### Should-Maintain (V1.1 or Ongoing)

| # | Discipline | What It Protects | Component |
|---|-----------|-----------------|-----------|
| 10 | **Version the Gateway API metadata schema** | Multiple clients can negotiate capabilities | Gateway |
| 11 | **Define abstract version history contract** | Clean migration path if version history mechanism evolves | Memory |
| 12 | **Monitor tool protocol spec changes** | Smooth version updates, no surprises | Tools |
| 13 | **Document the Engine integration surface** | Swap checklist — every point where Gateway and tools connect to Engine | Engine |
| 14 | **Test auth export/import across deployments** | Validates auth portability claim | Auth |
| 15 | **Keep memory export functional regardless of security level** | Non-negotiable portability invariant | Security |

---

## Conclusion

The foundation architecture is designed for zero lock-in at every layer. This analysis confirms that claim holds:

- **Your Memory** is fully portable — zero outward dependencies, accessed through tools, exportable in open formats. The contract is the tools, not the storage. Storage evolves without anything else changing.
- **Tools** are capabilities in the environment — the tool protocol is internal to the Engine, not an architectural boundary. Swap the protocol without changing anything else. Tool preferences stay in Memory (D145), not the deployment.
- **Intelligence** is a config change — models, routers, and providers are all swappable via adapters. Same-provider swap = 1 change. Cross-provider swap = 2 changes.
- **Interface** talks to a contract, not an implementation. Replace or multiply freely.
- **Engine** is a generic commodity component. Swap the whole thing.
- **Auth** is a cross-cutting layer with open standards (OAuth 2.1, OIDC), exportable state, and an implementation-agnostic contract.
- **Security** uses standard containers and open formats. No proprietary security mechanisms.
- **Gateway** stores conversations in Your Memory via tools. Clients are swappable. Auth is independent.
- **Configuration** enforces swappability: 4-field runtime config, preferences in Memory, D147 CI test.
- **Deployment** guarantees a local path always exists. Managed hosting is convenience, not dependency.
- **Customization** uses four mechanisms only — no code modification required.

There is no vendor lock-in, no data lock-in, no protocol lock-in, no convention lock-in, and no contract lock-in. Even the contracts themselves are swappable — adapters (D139) sit between each contract and the components on either side, absorbing standard changes. The full swappability chain: Memory via tools, components via contracts, contracts via adapters.

The D147 anti-lock-in CI test is the concrete enforcement mechanism: three swaps (provider, model, tool) must succeed with config-only changes, zero code edits. The only risk is implementation drift — and D147 catches it automatically.

**Bottom line:** The architecture delivers what it promises. Maintain the disciplines, run the CI test, and every component stays swappable at every point in the future. Decisions D1 through D159 got us here. The enforcement mechanisms keep us here.

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| [foundation-spec.md](../foundation-spec.md) | The architecture being analyzed |
| [engine-spec.md](../engine-spec.md) | Engine component spec — generic agent loop |
| [memory-spec.md](../memory-spec.md) | Your Memory component spec — portable substrate |
| [gateway-spec.md](../gateway-spec.md) | Gateway component spec — conversation management |
| [auth-spec.md](../auth-spec.md) | Auth component spec — identity, access, permissions |
| [security-spec.md](../security-spec.md) | Security spec — Foundation mechanisms |
| [tools-spec.md](../tools-spec.md) | Tools spec — capabilities in the environment |
| [models-spec.md](../models-spec.md) | Models spec — external intelligence |
| [configuration-spec.md](../configuration-spec.md) | Configuration spec — runtime config and preferences |
| [deployment-spec.md](../deployment-spec.md) | Deployment spec — local-first guarantees |
| [customization-spec.md](../customization-spec.md) | Customization spec — Level 1/2/3 ecosystem |
| [adapter-spec.md](../adapter-spec.md) | How contracts are made swappable via adapters (D139) |
| [gateway-engine-contract.md](../gateway-engine-contract.md) | Gateway ↔ Engine internal contract (D137) |
| [lockin-gate.md](../lockin-gate.md) | PR-level lock-in checklist — fast gate for every non-trivial PR |
| [lockin-audit.md](../lockin-audit.md) | Deep architecture audit — milestone/release gate |
