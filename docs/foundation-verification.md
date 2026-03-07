---
hide_table_of_contents: true
---

# Foundation Verification Spec

## How to Use This Document

**This is not a code checklist.** It's an architecture compliance spec. The criteria are deliberately implementation-agnostic — they verify structural properties, not specific technologies.

Each criterion has:
- **Claim** — what the foundation-spec asserts
- **Verification** — how to check it (observation, test, inspection)
- **Fail condition** — the specific violation that would constitute a failure

A system can use any language, any framework, any storage backend, and any deployment tool. What it cannot do is violate these criteria and still claim compliance with the Personal AI Architecture.

**Scoring:** Pass/fail per criterion. No partial credit. If a criterion fails, the violation must be documented with an accepted rationale or fixed before the system is considered compliant.

---

## 1. Structural Verification

These criteria verify that the implementation matches the architectural topology: what exists, what connects to what, and what is absent.

### S-1. Four components, no more, no fewer (D64)

**Claim:** The system consists of exactly four components: Your Memory, Engine, Auth, and Gateway.

**Verification:** Enumerate every deployed unit that contains business logic or state management. Map each to one of the four components. Identify any that don't map.

**Fail condition:** A fifth component exists that is not classifiable as Your Memory, Engine, Auth, or Gateway — and is not an external dependency, a connector, or an adapter.

### S-2. Two connectors (D64)

**Claim:** Components communicate through exactly two connectors: the Gateway API (clients ↔ Gateway) and the Provider API (Engine ↔ models).

**Verification:** Trace every external integration point. Each must route through one of the two connectors, be internal (Gateway ↔ Engine contract), or be internal to the Engine (Engine ↔ Tools execution, which is not an architectural boundary — see `tools-spec.md`).

**Fail condition:** A third connector exists — an external-facing protocol boundary that is neither the Gateway API nor the Provider API. (The Gateway ↔ Engine internal contract is explicitly not a connector per D137. Engine ↔ Tool communication is internal to the Engine, not a connector.)

### S-3. Three external dependencies (D64)

**Claim:** The system has three categories of external dependencies: Clients, Models, and Tools (D64). External memory and services are accessed via tools — they are not a separate category.

**Verification:** List everything the system interacts with that is not one of the four components. Classify each as Client, Model, or Tool. Note: local tools (file operations, CLI) and remote tools (APIs, services, external data sources) are both Tools — the distinction is scope, not category.

**Fail condition:** An external dependency exists that cannot be classified into one of the three categories, or an external dependency has been internalized as a component.

### S-4. Gateway ↔ Engine is internal, not a connector (D137)

**Claim:** The interface between Gateway and Engine is a plain HTTP API contract between two co-deployed components — not a third public connector.

**Verification:** Inspect the Gateway ↔ Engine interface. Confirm it is not documented or exposed as a public integration point. Confirm no external system connects through it.

**Fail condition:** Third-party systems or clients connect directly to the Engine, bypassing the Gateway. Or the interface has been promoted to a public, versioned connector with external consumers.

### S-5. Tools are not a component (D51)

**Claim:** Tools are capabilities in the environment, not a component. Tool definitions live in Memory, tool execution lives in Engine, tool permissions live in Auth.

**Verification:** Confirm there is no standalone "tools service" or "tools component" that must be independently deployed or managed. Confirm tool concerns map to existing components.

**Fail condition:** A separate tools component exists with its own lifecycle, configuration, and deployment independent of Engine/Memory/Auth.

### S-6. Models are not a component (D63)

**Claim:** Models are external intelligence accessed through the Provider API. The system does not contain a model.

**Verification:** Confirm the system does not bundle, embed, or require a specific model to function. Confirm model access is exclusively through the Provider API connector.

**Fail condition:** A model is embedded in the system as a required internal component, or model access bypasses the Provider API.

### S-7. Clients are not a component (D57)

**Claim:** Clients are external. The system is the four components. Clients connect through the Gateway API.

**Verification:** Confirm the system functions identically regardless of which client connects. Confirm no client-specific logic exists in Gateway, Engine, Auth, or Memory.

**Fail condition:** The system requires a specific client to function, or a component contains logic that only works with one particular client.

---

## 2. Pillar Verification

The four pillars are values, not code — but they produce observable properties. A system either exhibits these properties or it doesn't.

### P-1. Empowerment — AI that works for you

**Claim:** The system serves the owner's goals. The owner controls what the AI does, what it accesses, and how it behaves.

**Verification:**
- (a) The owner can define, modify, and remove skills/behaviors through Memory content without code changes.
- (b) The owner can restrict tool access through Auth configuration.
- (c) The system does not take actions the owner has not enabled.

**Fail condition:** System behavior requires code changes to modify. Or the system performs actions (network calls, data access, tool execution) that the owner cannot observe, configure, or disable.

### P-2. Ownership — You own it

**Claim:** The owner owns their data, their configuration, and their deployment. Nothing external is required to access what's yours.

**Verification:**
- (a) All owner data is stored locally on owner-controlled hardware (Level 1).
- (b) Owner data is readable without the system running (standard tools: text editor, file browser, database viewer).
- (c) Owner data can be copied, moved, or backed up with standard OS tools.
- (d) No owner data is stored exclusively in a third-party service at Level 1.

**Fail condition:** Owner data requires the system to be running to access. Or owner data is stored in a format/location that requires proprietary tools to read. Or owner data is held by a third party with no local copy.

### P-3. Freedom — No lock-in

**Claim:** The owner is free to swap any component, any provider, any client, any model, any tool, any hosting arrangement.

**Verification:**
- (a) The three D147 swap tests pass (provider, model, tool) with config-only changes.
- (b) Memory can be exported and imported to a fresh deployment (FS-1).
- (c) Any client that speaks the Gateway API can connect.
- (d) The system runs on owner-controlled hardware without external dependencies.

**Fail condition:** Any swap requires cross-component code changes. Or Memory export/import loses data. Or the system requires a specific client, provider, or hosting arrangement.

### P-4. Sustainability — Succeeds with you, not off you

**Claim:** The system's value compounds for the owner over time. The business model doesn't depend on trapping people.

**Verification:**
- (a) Continued use makes Memory richer, which makes the system more valuable — this value persists across component swaps.
- (b) No component degrades, expires, or loses functionality if the owner stops paying for a specific service (at Level 1).
- (c) No Level 1 feature is disabled in code with a Level 2 paywall gate. Limitations reflect genuine architectural boundaries (e.g., local-only at Level 1), not artificial restrictions to drive upgrades.

**Fail condition:** Owner value is lost when a component is swapped. Or system functionality degrades when a specific commercial relationship ends (beyond the obvious: if you stop paying for a model API, you lose that model — but local models still work). Or a Level 1 capability is present in code but gated behind a Level 2 payment check.

---

## 3. Principle Verification

### PR-1. Memory Is the Platform (Principle 1)

**Claim:** Your Memory has zero outward dependencies. Every other component depends on it. It depends on none of them.

**Verification:**
- (a) **Zero outward dependencies:** Remove Engine, Auth, Gateway, all clients, all models. Your Memory is still intact, readable, and complete. No data is lost or orphaned.
- (b) **Inward dependency direction:** Engine, Auth, and Gateway all depend on Memory (via tools or configuration). Memory does not import, call, or reference any of them.
- (c) **Persistence across swaps:** Swap the Engine, swap the Gateway, swap Auth. Memory is unchanged.
- (d) **Independent inspectability:** Memory can be browsed, searched, and read with standard tools (text editor, file browser, database viewer) while the system is not running.

**Fail condition:** Memory contains references to specific component implementations. Or Memory requires a running component to be readable. Or removing a component makes Memory data inaccessible or corrupt. Or Memory has an import/dependency on Engine, Auth, or Gateway code.

### PR-2. Everything Else Is Swappable (Principle 2)

**Claim:** Engine, Auth, Gateway, clients, models, tools, contracts, hosting — all replaceable. The swappability chain is complete: Memory via tools, components via contracts, contracts via adapters.

**Verification:**
- (a) **Component swap:** Replace the Engine with a different implementation. Gateway, Auth, Memory, clients, models — nothing else changes. (Repeat for Auth, Gateway.)
- (b) **Contract swap:** Change the Gateway API protocol (e.g., REST to GraphQL). Only the adapter changes. Components stay the same.
- (c) **Memory swap:** Change the storage backend (e.g., files to database). Only the tool implementations change. Engine, Auth, Gateway — nothing else changes.
- (d) **Swappability chain completeness:** For every element in the system, identify the intermediary that absorbs change (tools, contracts, or adapters). If none exists, the element is a lock-in point.

**Fail condition:** Swapping any element requires changes to more than one component. Or an element exists with no identifiable intermediary protecting it from change propagation.

### PR-3. Interfaces Over Implementations (Principle 3)

**Claim:** Every component is defined by what it does, not how it works. Components interact only through defined interfaces.

**Verification:**
- (a) Engine does not know Memory's storage format — it calls tools.
- (b) Gateway does not know Engine's internal implementation — it uses the Gateway-Engine contract.
- (c) Clients do not know what Engine is behind the Gateway API.
- (d) Auth does not depend on Gateway or Engine internals.
- (e) Swapping any component's implementation (while preserving its interface) requires zero changes to other components.

**Fail condition:** Any component directly accesses another component's internals (imports, shared state, format assumptions). Or swapping an implementation requires changes in a component that shouldn't know about it.

### PR-4. Complexity Is Lock-In (Principle 4)

**Claim:** The entire system must be understandable and maintainable by one developer + AI coding agents. Every additional component is a potential expertise dependency.

**Verification:**
- (a) **Component count:** The system has exactly four components and two connectors. No hidden infrastructure (message queues, service meshes, orchestrators) that must be understood to operate the system.
- (b) **Comprehensibility test:** The architecture consists of exactly four components and two connectors with no hidden infrastructure. No component requires specialized domain expertise beyond general software engineering. The spec set (foundation + component specs) is the complete description — no tribal knowledge required.
- (c) **Maintenance test:** Routine operations (update a model, add a tool, change a preference, deploy an update) can be performed by one person without coordinating with others.
- (d) **No operational overhead:** The system does not require monitoring dashboards, log aggregation, container orchestration, or other operational infrastructure to function at Level 1.

**Fail condition:** The system requires infrastructure not described in the four-component architecture. Or a competent developer cannot understand the architecture from the specs. Or routine operations require a team.

### PR-5. Start Constrained, Expand Deliberately (Principle 5)

**Claim:** Products don't use all capabilities at once. Each expansion is a deliberate step. Scope is a tool configuration decision, not an architecture decision.

**Verification:**
- (a) The system can run with minimal tool scope (e.g., library folder only) and function correctly.
- (b) Adding broader tool scope (filesystem, APIs, services) does not require architecture changes — only tool configuration.
- (c) Each scope expansion is independently reversible — removing tools reduces capability without breaking the system.
- (d) The evolution table holds: V1 → V2 → V3 → V4 each changes only tool configuration, not architecture.

**Fail condition:** Expanding scope requires architectural changes (new components, new connectors, new contracts). Or reducing scope breaks the system. Or a capability expansion is irreversible.

---

## 4. Contract Verification

### C-1. Gateway API carries only what it claims

**Claim:** In: message content + conversation ID (optional) + metadata. Out: streamed response + conversation ID + message record.

**Verification:** Inspect the Gateway API. Confirm the payload matches the spec. Confirm no component-internal state leaks through the API (engine configuration, auth tokens in responses, memory paths).

**Fail condition:** The Gateway API carries data not specified in the contract. Or internal implementation details are exposed to clients.

### C-2. Provider API carries only what it claims

**Claim:** In: prompt (system instructions + conversation + tool definitions + context). Out: streamed completion (text + tool calls).

**Verification:** Inspect the Provider API boundary. Confirm the Engine sends only what the spec defines. Confirm provider-specific details are in the adapter, not in the Engine.

**Fail condition:** The Engine contains provider-specific logic outside the adapter. Or the Provider API payload includes implementation-specific fields not in the contract.

### C-3. Connectors are hollow

**Claim:** Both connectors exist to pass information forward with minimal opinion. The less they do, the more they survive.

**Verification:** Examine connector implementations. They should contain no business logic, no data transformation beyond format mapping, no conditional behavior based on content.

**Fail condition:** A connector contains business logic (routing decisions based on message content, data enrichment, content-aware transformation). Connectors that "do things" are components in disguise. Note: security boundary enforcement (input well-formedness validation, request size limits) is not business logic — it's required by the security spec and does not violate hollowness.

### C-4. Adapters are thin translation layers (D139)

**Claim:** Adapters translate between the contract and the specific protocol/provider. They contain no policy or business logic.

**Verification:** Inspect adapter code. It should contain only format translation (field mapping, serialization, protocol differences). No retry logic, no caching, no routing decisions, no business rules.

**Fail condition:** An adapter contains business logic, caching, routing, or policy decisions. Adapters that grow fat are becoming components.

### C-5. Gateway ↔ Engine contract is bounded (D137)

**Claim:** Gateway POSTs a request (messages array + metadata) to Engine. Engine returns an SSE stream (text, tool calls, results, completion). Auth middleware sits on the path. Engine is pre-configured — tools and provider don't change per-request.

**Verification:** Inspect the internal contract. Confirm the request/response format matches the spec. Confirm the Engine does not receive per-request configuration (tools, provider, model) from the Gateway.

**Fail condition:** The Gateway sends per-request configuration that changes Engine behavior. Or the internal contract carries data not specified in `gateway-engine-contract.md`.

---

## 5. Memory Verification

Memory is the platform. It gets its own section because so much of the architecture depends on its properties being real.

### M-1. Zero outward dependencies

**Claim:** Your Memory depends on no other component. Removing everything else leaves Memory intact.

**Verification:** Shut down Engine, Gateway, Auth. Remove all client applications. Disconnect all model providers. Verify Memory is still present, complete, and readable.

**Fail condition:** Any data in Memory is inaccessible, corrupt, or incomplete when no other component is running.

### M-2. Inspectable with standard tools

**Claim:** Memory stays independently inspectable with standard tools (text editor, file browser, database viewer) even when the system is not running.

**Verification:** With the system stopped, open Memory contents using only OS-provided or standard tools. Read preferences, conversations, skills, and any other owner data.

**Fail condition:** Owner data requires proprietary tools, running services, or decryption keys held by the system to read. (Note: user-chosen encryption with user-held keys is acceptable — the system encrypting data with system-held keys is not.)

### M-3. Accessed exclusively through tools

**Claim:** Every component accesses Memory exclusively through tools — the model through the Engine's tool loop, infrastructure components through dedicated internal tools (D152).

**Verification:** Trace every read/write path to Memory from each component. Confirm each goes through a defined tool interface. Confirm no component directly accesses Memory's storage implementation.

**Fail condition:** A component reads or writes Memory by directly accessing the storage layer (file system paths, database queries) instead of through the tool interface. This couples that component to the storage format.

### M-4. Storage evolution doesn't propagate

**Claim:** The contract is the tools, not the storage. Storage can evolve without anything else changing.

**Verification:** Change the storage backend (e.g., files to SQLite, or flat files to a different directory structure). Confirm only tool implementations change. Confirm Engine, Auth, Gateway, and all clients are unaffected.

**Fail condition:** Changing storage requires changes in any component other than the tool implementations.

### M-5. Export/import with zero loss (FS-1)

**Claim:** Export Memory, import on a fresh deployment, preferences honored, gaps reported, nothing lost.

**Verification:** Export all Memory content from a running system. Deploy a fresh instance. Import. Verify all data is present, preferences are applied, and any gaps (missing tools, unavailable providers) are reported rather than silently dropped.

**Fail condition:** Data loss during export/import. Or preferences silently ignored. Or gaps not reported.

### M-6. Compounding value

**Claim:** Every conversation, decision, and plan makes the system more powerful because it makes Memory richer. This value persists across component swaps.

**Verification:** Use the system over time. Accumulate conversations, decisions, preferences. Swap the Engine. Confirm the new Engine benefits from the same Memory content — previous context is available, preferences are honored, skills work.

**Fail condition:** Swapping a component causes loss of accumulated value. Or accumulated Memory content is only useful with a specific component implementation.

---

## 6. Responsibility Matrix Verification

Each row in the responsibility matrix is a verifiable claim about who does what — and who doesn't.

### R-1. Responsibility ownership

For each row in the matrix, verify:

| Responsibility | Owner | Verification | Fail condition |
|---|---|---|---|
| Persist, retrieve, search, version data | Your Memory (via tools) | Confirm no other component persists durable owner data | Engine, Auth, or Gateway stores owner data outside Memory |
| Provide structure (paths, hierarchy) | Your Memory | Confirm Memory provides organizational structure | Engine or Gateway imposes structure on Memory |
| Understand content, make meaning | Model | Confirm no component contains hardcoded content interpretation | Engine or Memory contains semantic logic |
| Assemble prompts | Model reads from Memory | Confirm prompts are assembled from Memory content, not hardcoded in Engine | Engine contains hardcoded prompt templates |
| Select context | Model | Confirm the model decides what to read, not the Engine | Engine pre-filters or selects context for the model |
| Summarize, associate, consolidate | Model using Memory operations | Confirm the model performs synthesis, not Memory or Engine | Memory or Engine contains summarization/association logic |
| Execute tools | Engine | Confirm only the Engine executes tools | Gateway or Auth executes tools (Auth may enforce permissions, but doesn't execute) |
| Decide which tools to use | Model (via Engine loop) | Confirm the model selects tools, Engine executes them | Engine contains tool selection logic independent of the model |
| Execute skills | Model + Engine | Confirm model reads skill files from Memory, Engine executes resulting tool calls | Skills are compiled code or hardcoded sequences in Engine |
| Protect access / control permissions | Auth | Confirm Auth is the sole permission enforcer | Gateway or Engine contains access control logic independent of Auth |
| Manage conversations | Gateway | Confirm conversation lifecycle (create, list, retrieve, store) lives in Gateway | Engine or Memory manages conversation state |
| Route requests to Engine | Gateway | Confirm Gateway routes, Auth doesn't route | Auth contains routing logic |
| Connect to AI models | Provider API (connector) | Confirm model access goes through Provider API | Engine calls models directly, bypassing the connector |
| Accept client connections | Gateway API (connector) | Confirm clients connect through Gateway API | Clients connect directly to Engine or other components |
| Display content to owners | Clients (external) | Confirm no component contains display/rendering logic | Gateway or Engine contains client-specific UI logic |
| Bootstrap the system | Runtime config | Confirm bootstrap is thin (4 fields per configuration-spec) | Bootstrap requires Memory content or complex configuration |
| Resolve concurrent writes | Tool implementations | Confirm concurrency handling lives in tool implementations, not in Memory component | Memory component contains locking or conflict resolution logic |

### R-2. Negative constraints ("NOT" column)

For each NOT entry in the matrix, verify the named component does NOT perform that responsibility. These are as important as the positive claims — they prevent responsibility creep.

**Verification method:** Search the named component's codebase for any logic, code, or behavior that performs the forbidden responsibility.

**Fail condition:** A component performs a responsibility assigned to NOT in the matrix.

---

## 7. Decision Verification

Foundation decisions are architectural commitments. Each is verifiable.

### Key Decision Checks

| Decision | Claim | Verification | Fail condition |
|---|---|---|---|
| D15 | Clients are product-owned, not coupled to Engine | No client imports Engine code or depends on Engine internals | Client contains Engine-specific logic |
| D16 | Zero custom protocols | Gateway API uses an industry standard protocol | A proprietary protocol was invented |
| D20 | Client metadata flows through Gateway API | Client sends context, Gateway passes it, Engine uses it — no coupling | Gateway interprets or acts on client metadata |
| D22 | Auth on both local and managed | Auth works identically in both deployment modes (config differs, code doesn't) | Separate auth code paths for local vs managed |
| D23 | Managed hosting = same code, stricter config | No code forks between local and managed | Managed hosting requires different code |
| D24 | Engine ceiling matches best-in-class agents | Engine supports multi-turn tool use, parallel execution, context management at parity with leading agent frameworks | Engine caps below Claude Code / Open Claw capability level |
| D26 | Skills are multi-turn, adaptive, judgment-based | Skill execution supports real agentic behavior, not scripted sequences | Skills are hardcoded sequences that don't use model judgment |
| D39 | Engine is generic — no product-specific logic | Engine contains no product-specific conditionals, feature flags, or domain logic | Engine contains product-specific behavior |
| D40 | Prompts and skills live in Memory | Prompt assembly reads from files in Memory; skills are Memory content | Prompts are hardcoded in Engine source; skills are compiled code |
| D51 | Tools = definitions in Memory + execution in Engine + permissions in Auth | No standalone tools component | A tools service exists outside these three |
| D53 | No tool protocol connector | Tool calls flow Engine → Provider API → Model, execution is internal to Engine | A third connector exists for tool communication |
| D60 | Auth is independent of Gateway | Auth and Gateway have no mutual dependencies; either can be swapped independently | Auth imports Gateway code or vice versa |
| D135 | Memory/tool binary holds | Every new capability maps to memory (data) or tools (actions), not new infrastructure | A capability requires a new component or connector |
| D139 | Swappability chain is complete | For every element: Memory → tools, components → contracts, contracts → adapters | An element exists with no intermediary absorbing change |
| D143 | Configuration is cross-cutting, three categories | Preferences in Memory, runtime config is thin bootstrap, tool self-description — no single component owns all config | Configuration is owned by one component or requires a config service |
| D147 | Three swaps pass config-only | Provider swap, model swap, tool swap — each with config/adapter changes only | Any swap requires cross-component code changes |
| D148 | Level 1 = local only | System runs on owner-controlled hardware without external services | Level 1 requires cloud services, managed hosting, or external APIs to function |

---

## 8. Foundation User Story Verification

Each story is an acceptance test for the architecture itself.

### FS-1. Move Your Memory to a new system

**Test procedure:**
1. Export all Memory content from System A.
2. Deploy a fresh System B (different machine, clean install).
3. Import Memory into System B.
4. Verify: all data present, preferences honored, skills functional, gaps reported.

**Pass criteria:** Zero data loss. Preferences applied. Missing capabilities (tools, providers) reported, not silently dropped.

**Fail criteria:** Data lost. Preferences ignored. Silent degradation.

### FS-2. Add a capability without violating the architecture

**Test procedure:**
1. Add a new tool (or skill, client, or model provider).
2. Verify Memory gained no outward dependencies.
3. Verify no component bypasses connectors.
4. Verify the four-component structure holds (no new component was introduced).

**Pass criteria:** Capability added. Architecture unchanged. Memory still has zero outward dependencies.

**Fail criteria:** Adding a capability required a new component, a new connector, or created a Memory dependency on external infrastructure.

### FS-3. Run on your own hardware

**Test procedure:**
1. Install on a laptop/desktop/home server.
2. Disconnect from the internet.
3. Configure a local model.
4. Send a message, execute a tool, manage a conversation.

**Pass criteria:** Full functionality with local model and local tools. No external service required.

**Fail criteria:** Any feature requires an internet connection or external service at Level 1.

### FS-4. Swap a model provider

**Test procedure:**
1. Run a baseline conversation with Provider A.
2. Change provider configuration (and adapter if protocol differs).
3. Continue the conversation with Provider B.

**Pass criteria:** Only config/adapter changed. No component code changed. Conversation history preserved.

**Fail criteria:** Provider swap required Engine, Gateway, Auth, or Memory code changes.

### FS-5. Swap the client

**Test procedure:**
1. Build a new client that speaks the Gateway API.
2. Connect it to the system.
3. Send messages, receive responses, manage conversations.

**Pass criteria:** System serves the new client identically. No server-side changes required.

**Fail criteria:** System required modification to support the new client.

### FS-6. Evolve Memory storage

**Test procedure:**
1. Add a new storage capability (e.g., semantic search alongside file search).
2. Implement as new tools.
3. Verify no other component changed.

**Pass criteria:** New capability available. Engine, Auth, Gateway unchanged.

**Fail criteria:** Storage evolution required changes outside tool implementations.

### FS-7. Swap the Engine

**Test procedure:**
1. Replace the Engine with a different implementation that honors the same contracts.
2. Verify Gateway still routes to it.
3. Verify tools still execute.
4. Verify model communication still works.
5. Verify Memory is unchanged.

**Pass criteria:** All other components and externals unaffected.

**Fail criteria:** Gateway, Auth, Memory, clients, or tools required changes.

### FS-8. Expand agent scope via tools

**Test procedure:**
1. Start with library-scoped tools only (V1).
2. Add filesystem tools (V2 scope). Verify architecture unchanged.
3. Add external API tools (V3 scope). Verify architecture unchanged.
4. Remove external tools. Verify graceful capability reduction, no breakage.

**Pass criteria:** Each expansion/contraction is tool configuration only. Architecture unchanged throughout.

**Fail criteria:** Scope expansion required new components, connectors, or architectural changes.

---

## 9. Deployment Verification

### DEP-1. Local-first deployment

**Claim:** The system runs on hardware the owner physically controls.

**Verification:** Deploy on a laptop, desktop, or home server. Confirm full functionality without external infrastructure (no cloud databases, no SaaS dependencies, no required external APIs).

**Fail condition:** Level 1 deployment requires external infrastructure.

### DEP-2. Full offline capability

**Claim:** The system functions without internet access when configured with local model and local tools.

**Verification:** Disconnect from the network. Use a local model. Confirm the full loop works: send message → Engine processes → tools execute → response returned.

**Fail condition:** Any part of the core loop fails without internet at Level 1 (with local model configured).

### DEP-3. Localhost-only by default

**Claim:** Default network posture is localhost-only. No automatic external exposure.

**Verification:** Deploy with default configuration. Confirm the system listens only on localhost. Confirm no automatic port forwarding, discovery, or external network binding.

**Fail condition:** Default deployment exposes services to the network or makes outbound connections not explicitly configured.

### DEP-4. No silent outbound traffic

**Claim:** Outbound calls occur only from explicitly configured network-dependent components.

**Verification:** Monitor network traffic during operation. Confirm all outbound connections correspond to explicitly configured services (model providers, external tools). Confirm no telemetry, analytics, or phone-home behavior.

**Fail condition:** The system makes outbound network calls not attributable to explicitly configured services.

### DEP-5. Level boundary respected

**Claim:** Level 1 is local deployment. Managed hosting is Level 2.

**Verification:** Confirm no Level 1 code path requires managed hosting, cloud services, or remote infrastructure. Confirm managed hosting features are isolated as Level 2 extensions.

**Fail condition:** Level 1 foundation code contains managed hosting dependencies or assumptions.

---

## 10. Cross-Cutting Verification

### X-1. Configuration follows the three-category model (D143)

**Claim:** Preferences in Memory, runtime config is thin bootstrap (4 fields), tool self-description.

**Verification:** Enumerate all configuration in the system. Classify each into one of the three categories. Confirm runtime bootstrap is thin (connection info only). Confirm preferences are stored in Memory.

**Fail condition:** Configuration exists that doesn't fit the three categories. Or runtime bootstrap grows beyond thin connection setup. Or preferences are stored outside Memory.

### X-2. No secrets in source or Memory files

**Claim:** Secrets remain in env/secret infrastructure, not in source control or owner memory content.

**Verification:** Scan source code and Memory content for API keys, passwords, tokens, private keys.

**Fail condition:** Secrets found in source-controlled files or Memory content.

### X-3. Auth is cross-cutting and independent (D60)

**Claim:** Auth applies to all requests, independent of Gateway and Engine. Auth and Gateway don't know about each other.

**Verification:** Confirm Auth middleware sits on the request path without being called by or calling Gateway/Engine directly. Confirm swapping Auth doesn't require Gateway or Engine changes. Confirm swapping Gateway doesn't require Auth changes.

**Fail condition:** Auth is embedded in Gateway or Engine. Or Auth and Gateway have mutual dependencies.

### X-4. Memory/tool binary completeness (D135)

**Claim:** Everything the system processes is either memory (data/nouns) or tools (actions/verbs). New capabilities compose from these two primitives.

**Verification:** For every capability in the system, classify it as memory or tool. Confirm no capability requires a third primitive type.

**Fail condition:** A capability exists that is neither memory nor tool and cannot be decomposed into memory + tool operations.

---

## Verification Schedule

| When | What to run | Document |
|------|-------------|----------|
| **Every PR** | Lock-in gate (subset of this doc optimized for speed) | `lockin-gate.md` |
| **Every milestone** | Lock-in audit + swap tests | `lockin-audit.md` |
| **Every release** | Full foundation verification (this doc) | `foundation-verification.md` |
| **Architecture change** | Full foundation verification + affected component specs | `foundation-verification.md` + component specs |

---

## Relationship to Other Documents

| Document | Relationship |
|----------|-------------|
| `foundation-spec.md` | Parent — this doc verifies claims made there |
| `lockin-gate.md` | Subset — PR-level checks extracted from sections 3, 4, 5, 9 |
| `lockin-audit.md` | Subset — milestone-level checks extracted from sections 3, 4, 5, 6, 7, 9 |
| `zero-lockin-checklist.md` | Index — points to gate, audit, and this doc |
| `deployment-spec.md` | Source for section 9 (Deployment Verification) |
| `configuration-spec.md` | Source for X-1 (Configuration Verification) |
| `adapter-spec.md` | Source for C-4 (Adapter Verification) |
| `gateway-engine-contract.md` | Source for C-5 (Internal Contract Verification) |
| `security-spec.md` | Source for X-2 (Secrets Verification) and deployment network posture |

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-01 | Codex audit: 5 fixes — S-2 (Engine↔Tools not a connector violation), S-3 (externals = Clients/Models/Tools per D64), C-3 (security boundary validation is not business logic), R-1 (full matrix coverage: 11→17 rows), P-4c + PR-5b (measurable proxies replace subjective checks). Finding #6 (evidence format) deferred to run package. | Codex review (Dave W + Claude) |
| 2026-03-01 | "No users, only owners" language pass | Ownership model alignment (Dave W + Claude) |

---

*This document makes the foundation-spec testable. The architecture doesn't enforce itself — this verification spec is how you check. Every criterion traces to a specific claim in the foundation spec. A system that passes all criteria is architecturally compliant. A system that fails any criterion has a documented violation to address or accept.*
