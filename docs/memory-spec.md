# Your Memory Spec: The Persistent Substrate

> **Project:** Pivot
> **Generated from:** Memory interview session (Dave W + Claude) on 2026-02-23
> **Status:** Final — ready for implementation
> **Architecture:** See `foundation-spec.md` for platform architecture (components, contracts, connectors)

---

## How we define memory

Everything this system processes is either a noun or a verb. **Memory is the nouns — tools are the verbs.** If it's data, it's memory. If it's not data, it's a tool. There is no third category. This is the foundational concept that shapes the entire architecture.

All data, everywhere, is memory — the only question is whose. Your local files are your memory. Your Salesforce data is memory hosted by Salesforce. Weather data is the weather service's memory. The internet is public memory. The storage mechanism, the location, the format — all implementation details. Memory is the concept; the component called "Your Memory" is specifically the subset you own: your local, persistent storage in open formats. Your Memory is the platform. Everything else exists to support it. External data — Salesforce records, weather feeds, the internet — lives outside the platform, and is accessed via tools.

Your Memory is an **unopinionated substrate** — it persists and retrieves your data with zero opinions about what that data means. Opinions can live *in* Your Memory — skills, personality, methodology, context, instructions — but Your Memory doesn't enforce or interpret them. The model reads the content and gives it meaning. This is what keeps memory maximally portable — if the substrate had opinions, it would only work with systems that understand them.

This is a **Level 1 (Foundation) spec** — it defines the generic Your Memory component that anyone could implement. It does not force a single storage technology, but it does require owner inspectability and exportability. Product-specific conventions (entry-point files, skills, folder structure, methodology) are Level 2 opinions that live *inside* Your Memory but are not defined *by* Your Memory.

## Why we define it this way

Every AI system has memory — ChatGPT remembers your preferences, Copilot retains conversation history, RAG systems store your documents in vector databases. In those systems, memory is a **feature of the application**. The app owns it, the app controls the format, and if you leave the app, your memory stays behind. Memory serves the application.

Here, it's inverted. **Your Memory is the platform — the application serves it.** Your Memory has zero outward dependencies. Every other component (Engine, Auth, Gateway, clients, models, tools) depends on Your Memory. Your Memory depends on none of them. Remove any component, and Your Memory still works. Still readable. Still portable. Still yours. You can open it in a text editor with no system running and it still makes sense.

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

Why memory specifically — not the model, client, or infrastructure?

Because your memory is what makes the AI system your AI system.

In a human brain, neither memory nor intelligence is swappable. You're stuck with both. In this architecture, Your Memory isn't swappable either — it's the platform, the thing that persists. But the intelligence half of the brain *is* swappable. That's the superpower a digital brain has over a biological one.

Model capability is the fastest-changing part of AI. A biological brain can't upgrade its neurons. A digital brain with persistent memory can upgrade its intelligence every time a better model ships — different models for different tasks, from any provider, swapped with a config change. The fastest-changing part of AI is the cheapest thing to change in this system.

That superpower only works if memory is the persistent, independent platform that intelligence plugs into — not the other way around.

And memory is the one asset that's irreplaceable — you can download a new model in minutes, swap a client in seconds, but your structured memory took your actual life to build. Everything else is commodity.

In an app-centric model, that compounding value belongs to the vendor. Here, it belongs to you — and it stays with you regardless of which engine, model, or client you use tomorrow.

This is also why the architecture only needs four components, and can evolve at the speed of AI.

New capabilities are either new data (add it to memory) or new actions (add a tool). Neither requires new architecture.

Other systems keep adding infrastructure for each new data source — a RAG pipeline, a search integration, an API connector. Here, a new data source is just a new tool pointing at someone else's memory.

The noun/verb binary is provably complete — fifteen proposed subsystems (RAG, skills, scheduling, knowledge graphs, workflows, and more) all decompose into memory (nouns) + tools (verbs) with no remainder.

No new components needed.

### What's NOT Memory

| Thing | Why it's not Memory |
|-------|-------------------|
| The Engine process | Runtime, not persistent — starts fresh each time |
| The model weights | Intelligence, not memory — the model is the intelligence half of the brain, Your Memory is the persistent half |
| Active session tokens | Ephemeral auth state, not persistent |
| Cached/derived data (regenerable) | Derived from Memory content — if lost, rebuild from source |

The test: if you deleted it and restarted, would the system lose something irreplaceable? If yes, it's Memory. If it can be regenerated from Memory, it's derived data.

Ownership is a spectrum:

| Memory source | Used? | Owned? |
|---|---|---|
| Your markdown files in your library | Yes | **Yes** — your control, open format |
| Your SQLite database | Yes | **Yes** — your control, open format |
| A closed-source database you chose | Yes | Partially — your control, but format dependency |
| Someone else's shared files | Yes | No — their control |
| The internet | Yes | No — not under your control |

See `memory-as-platform.md` for the full argument on why memory is the platform, and `research/memory-tool-completeness.md` for the proof that this binary makes the architecture complete.

---

## What Memory Guarantees

The system provides six guarantees around your data. Four are Memory's job. Two are provided by other components on Memory's behalf.

| # | Guarantee | What it means | Whose job | Human analogy |
|---|-----------|--------------|-----------|---------------|
| 1 | **Persist** | What you store stays stored | Memory | Long-term memory |
| 2 | **Retrieve** | You can get back what you stored | Memory | Recall |
| 3 | **Search** | You can find content without knowing exactly where it is | Memory | Associative recall (starts as keyword, evolves toward biological) |
| 4 | **Version** | You can see what changed and go back to what was | Memory | Changing your mind, then changing it back |
| 5 | **Structure** | Content has hierarchy, naming, relationships | Memory provides the structure; the model and owner decide what goes where | Filing system (the extension humans invented) |
| 6 | **Protect** | Access is controlled — not everyone sees everything | Auth (gates requests before they reach Memory) | Privacy, selective sharing |

The split matters — if Memory absorbs protection or content organization, it becomes opinionated. Each absorbed responsibility is an outward dependency, and an opinionated substrate breaks portability. Memory has zero outward dependencies. That's the architectural property that makes it the platform.

---

## Portability

Because Memory has zero outward dependencies, it's portable by design — not as a feature bolted on after the fact, but as a structural property of the architecture.

### The robot test

If people interact with AI via robots in the future, the owner should bring their memory to that robot without rebuilding. Memory works with any future device, any future client, any future AI — because it's independent of all of them. Every architectural decision is measured against this test.

### Export is non-negotiable

Memory MUST support export. You can always get everything out. This is the baseline guarantee that makes ownership real.

The specific export format is a Level 2 choice. The Level 1 requirement: everything exportable, in open formats.

| Data | Included | Notes |
|------|----------|-------|
| All files (documents, pages, skills, config) | Yes | As-is, human-readable |
| Conversation history | Yes | Open format (SQLite is open) |
| Version history | Yes | Git repository or equivalent |
| Structured data (tasks, etc.) | Yes | Open format |
| Derived data (indexes, embeddings) | Optional | Regenerable from source |

---

## Core Operations and Contract

### Operations

Memory's contract is a small set of operations exposed as tools. These are internal tools — the system's own interface to its platform. Unlike external tools (Salesforce queries, weather feeds, API calls), which are additive capabilities, Memory tools must always exist in some form — the system can't function without a way to read and write its own memory. If a better interface emerges, swap the Engine — Memory itself doesn't change.

Not all callers use tools the same way. The model accesses Your Memory through the Engine's tool loop — flexible, exploratory, judgment-based. Infrastructure components access Your Memory through dedicated internal tools scoped to their operational needs — fixed, mechanical, no judgment. The Gateway, for example, uses a conversation store tool for conversation management (D152). Both callers use the tool interface. Neither bypasses it.

The specific operation names and signatures are Level 2 — the Level 1 requirement is that they map to the guarantees above.

| Operation | What it does | Input | Output | Guarantee |
|-----------|-------------|-------|--------|-----------|
| `read` | Retrieve content by path | Path (or identifier) | Content at that path | Retrieve |
| `write` | Create or overwrite content | Path + content | Confirmation of persistence | Persist |
| `edit` | Modify existing content | Path + modification | Confirmation of change | Persist |
| `delete` | Remove content | Path | Confirmation of removal | Persist |
| `search` | Find content by pattern | Query (pattern, keyword) | Matching content and locations | Search |
| `list` | Enumerate content by location | Location (path, scope) | Content listing at that location | Structure |
| `history` | View changes and previous states | Path + optional time range | Change records and previous states | Version |

### Error behavior

| Condition | Memory behavior |
|-----------|----------------|
| Content not found | Report to caller (model decides next step) |
| Write failure (disk full, permissions) | Report to caller |
| Invalid path or identifier | Report to caller |
| Concurrent write conflict | Tool implementation resolves or reports |

### The substrate test — what belongs in Memory and what doesn't

The core operation set is intentionally small. Adding a new operation requires passing the **substrate test**:

**Does this operation work on the storage, or on the content?**

- Storage operations (how things are stored, retrieved, organized) → can be a Memory operation
- Content operations (understanding what's stored, making meaning) → that's the model's job using existing Memory operations

| Proposed operation | Substrate or content? | Memory operation? |
|---|---|---|
| `read`, `write`, `search` | Substrate — operating on storage | Yes |
| `semantic_search` | Substrate — Memory stores and retrieves vectors. Text-to-vector is the Model's job. | Yes — Memory receives vectors, not text |
| `summarize` | Content — requires understanding meaning | No — model reads and summarizes |
| `associate` | Content — requires understanding relationships | No — model reads and creates links by writing |
| `consolidate` | Content — requires judgment about what matters | No — model reads, decides, writes |
| Skill execution | Content — the model reads skill files and follows them | No — model + Engine |
| Prompt assembly | Content — the model reads instructions from Memory | No — model + Engine |
| Context selection | Content — the model decides what to read | No — model decides |
| Access control | Cross-cutting — gates requests before they reach Memory | No — Auth |
| Conflict resolution | Implementation — concurrent access coordination | No — tool implementations |

This is analogous to POSIX file operations — `open`, `read`, `write`, `close`, `stat`, `readdir`, `unlink`. That set has been stable for 50 years because the bar for a genuinely new storage operation is high.

---

## Storage Mechanisms

Memory is not a single storage technology. It's everything that persists behind the tools. Different data shapes use different storage mechanisms — all are Memory. The specific technologies are Level 2 choices.

| Storage mechanism | What it holds | Why this mechanism |
|-------------------|--------------|-------------------|
| **Files** (markdown, text, any format) | Documents, specs, plans, skills, configuration, context files | Human-readable, portable, AI-native |
| **Database** (SQLite) | Conversations, structured/queryable data, tasks | Relational queries, transaction support |
| **Version control** (git) | Change history, previous states | Diff, blame, restore |
| **Index** (vector, future) | Vectors for semantic search (derived from source content) | Different retrieval mechanism |

Adding a new storage mechanism is adding tool implementations, not changing the contract.

---

## The Bootstrap

Prompt assembly lives in Memory — skills, context, personality, instructions are all files. But the model needs instructions before it can read Memory. This creates a chicken-and-egg.

The solution: a **minimal bootstrap prompt** in Engine configuration — the BIOS. Tiny, generic, just enough to tell the model where to look. The specific bootstrap content is a Level 2 choice. Example:

> "You are the owner's assistant. Read the AGENT.md in the current folder for your instructions."

Everything else — personality, skills, methodology, context — the model discovers by following that instruction.

The bootstrap is Engine configuration, not Memory. One line. Generic. Level 2. Prompt assembly still lives in Memory. The bootstrap is just "look here."

---

## Concurrency

Concurrency is the tool implementation's problem, not Memory's. How concurrent writes are resolved depends on the storage mechanism. Memory does not impose a concurrency model — doing so would constrain which storage backends can implement it.

| Phase | Scenario | Resolution |
|-------|----------|------------|
| V1 | One owner, one agent | Minimal concern — filesystem handles it |
| V1.1 | Owner + background agents | Usually different files; tool implementations coordinate when overlapping |
| V2+ | Multiple actors | Storage backends with proper transaction support |

---

## Evolution

Memory starts as a filing system and adds smarter tools on top. It does NOT evolve away from the filing system — it augments it.

| Stage | What changes | What stays the same |
|-------|-------------|-------------------|
| **Files only** | — | Everything |
| **+ database** | Add structured query tools | Everything above + existing file tools |
| **+ vectors** | Add semantic search tools | Everything above + existing tools |
| **+ multi-modal** | Add tools for non-text content | Everything above + existing tools |
| **+ cloud storage** | New tool implementations behind same interface | Everything above |

Each stage is additive. The substrate test ensures new operations are genuinely new storage capabilities, not content operations disguised as tools.

Memory's scope expands with the expanding sphere (see `foundation-spec.md` §How the Architecture Evolves) — from library folder (V1) to full filesystem (V2) to external services (V3) to federated data (V4). At every phase: you USE everything the system can access, you OWN the subset under your control in an open format.

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D43 | Memory is an unopinionated substrate | Opinions live in it, not enforced by it. Keeps Memory maximally independent and portable. |
| D44 | Memory + Model = the brain | Memory is the persistent half (stored patterns, knowledge, skills). Model is the intelligence half. Neither is complete alone. |
| D45 | Filing system is the correct starting substrate | Evolution adds smarter tools on top, not replaces the filing system. Filing system gives perfect recall + intelligent navigation — potentially permanently superior to biological memory. |
| D46 | Core operations with substrate test for expansion | Storage operations → Memory. Content operations → the model. Healthy pressure to keep the set small. Analogous to POSIX — stable for 50 years. |
| D47 | Memory includes all persistent storage accessed through tools | Not just files — files, databases, indexes are all Memory. Tools abstract the storage mechanism. |
| D48 | USE any memory source, OWN the subset under your control | Ownership requires control + open format. Export must be in open formats (Level 1 requirement). Which specific open format is a Level 2 choice — the Foundation requires openness, not a particular format. |
| D49 | Memory is Level 1, product conventions are Level 2 | The spec defines generic infrastructure. Product-specific conventions (entry-point files, skills, methodology) are the opinionated implementation built on it. |
| D50 | Bootstrap prompt is Engine configuration, not Memory | One-line seed ("read AGENT.md") lets the model self-bootstrap from Memory. Like a BIOS. Level 2, not Foundation. |
| D135 | Memory/tool binary — if it's data, it's memory; if it's not data, it's a tool | All data, anywhere, is memory — the only question is whose. Extends D43 and D47 to their logical conclusion. |
| D138 | Memory component renamed to "Your Memory" | Distinguishes the component (your owned local storage) from the concept (all data is memory per D135). |
| D141-refined | Tool preferences are personal data in Your Memory; plumbing is environment config | Three-way split: tool definitions → self-describing (D146), plumbing (addresses, ports) → environment config, preferences (always-send, policies) → Your Memory. |
| D145 | Preferences live in Your Memory — personal data, not environment config | "Is this about you, or about this desk?" If about you → Your Memory. Model choices, tool policies, interaction style all travel with you. |
| D152 | Gateway accesses Your Memory through a dedicated conversation store tool | Infrastructure components use the tool interface for operational needs — same pattern as model access, different caller. The Gateway's conversation store tool is internal (must always exist), purpose-built, and scoped to conversation management. |

---

## Open Questions

None. Memory is a substrate — it stores and retrieves. If a question arises about behavior, the answer is the same: that's not Memory's job. Questions about what lives *in* Memory (folder structure, skill format, entry-point conventions) belong in the product spec.

---

## Success Criteria

- [ ] Memory persists content reliably — what you store stays stored
- [ ] Memory retrieves content through tools — read, search, list work correctly
- [ ] Memory supports multiple storage mechanisms behind the tools (files + database minimum for V1)
- [ ] Memory has zero product-specific structure — it's a generic substrate
- [ ] Memory can be exported completely in open formats
- [ ] Memory passes the independence test — remove any other component, Memory still works, still readable, still portable
- [ ] Memory passes the robot test — take it to a completely different system and it works without rebuilding (for the human-readable portions)
- [ ] Swapping Memory's storage backend requires changing only tool implementations — Engine, Client, Auth, and Models are unaffected
- [ ] Adding a new storage mechanism (vector index, cloud storage) is additive — existing tools keep working

---

## Security Requirements

Per-component requirements from `security-spec.md`. Security-spec owns the "why"; this section owns the "what" for Your Memory.

- [ ] Memory must support full export in open formats — the owner can always get everything out
- [ ] Memory must be independent of all other components — removing any component leaves Memory intact and readable
- [ ] API keys, credentials, and tokens must never be stored in Memory (library files). Secrets live in configuration.
- [ ] Memory access must be mediated by tools — no component accesses storage directly
- [ ] Concurrent access must not corrupt data — tool implementations must handle concurrent writes safely

---

## Related Documents

`foundation-spec.md` (architecture overview, links to all component specs)

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-01 | Codex cross-reference audit fix: Reworded D48 rationale — clarified that Level 1 requires export in open formats, Level 2 picks which format. Previous wording ("Spec doesn't force open formats") appeared to contradict export requirement. | Codex audit (Dave W + Claude) |
| 2026-03-01 | "No users, only owners" language pass: user → owner | Ownership model alignment (Dave W + Claude) |
| 2026-03-01 | Added human vs digital brain analogy to "Why we define it this way" — biological brain has memory+intelligence fused; digital brain separates them for swappable intelligence, riding the exponential pace of model improvement. | Dave W + Claude |
| 2026-03-01 | D152: Added infrastructure caller paragraph to Core Operations — Gateway uses conversation store tool, not direct access. D152 added to decisions. | Architecture review (Dave W + Claude) |
| 2026-02-27 | Added Security Requirements section — cross-referenced from security-spec.md per T-219 | T-219 (Dave W + Claude) |
| 2026-02-23 | Initial Memory spec created from interview | Memory interview session (Dave W + Claude) |
| 2026-02-23 | Consistency pass — split tables into Components and External Dependencies per D64, added Gateway relationship | Cross-doc consistency audit (Dave W + Claude) |
| 2026-02-27 | Added D135 (memory/tool binary) — "whose memory" framing in Scope and ownership | D135 propagation (Dave W + Claude) |
| 2026-02-27 | Component renamed from "Memory" to "Your Memory" (D138) | Architecture discussion (Dave W + Claude) |
| 2026-02-27 | Conciseness pass + reorder — merged redundant sections, reordered to What → Why → Where → How → Reference | Review session (Dave W + Claude) |

---

*Your Memory is the platform — the only component that can exist completely on its own. The Engine brings it alive. The model gives it intelligence. The tools give it access. Auth protects it. The client reveals it. But Your Memory is what persists when everything else is swapped, upgraded, or replaced. It's what makes the system yours.*
