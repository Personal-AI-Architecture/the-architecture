---
sidebar_label: Your Memory
hide_table_of_contents: true
---

# Your Memory Spec: The Persistent Substrate

**Serves stories:** US-2, US-3, US-4, US-11 in the [PAA spec](../spec/personal-ai-architecture-spec.md).

Everything this system processes is either a noun or a verb. **Memory is the nouns — tools are the verbs.** If it's data, it's memory. If it's not data, it's a tool. There is no third category. This is the foundational concept that shapes the entire architecture.

All data, everywhere, is memory — the only question is whose. Your local files are your memory. Your Salesforce data is memory hosted by Salesforce. Weather data is the weather service's memory. The internet is public memory. The storage mechanism, the location, the format — all implementation details. Memory is the concept; the component called "Your Memory" is specifically the subset you own: your local, persistent storage in open formats. Your Memory is the platform. Everything else exists to support it. External data — Salesforce records, weather feeds, the internet — lives outside the platform, and is accessed via tools.

Your Memory is an **unopinionated substrate** — it persists and retrieves your data with zero opinions about what that data means. Opinions can live *in* Your Memory — skills, personality, methodology, context, instructions — but Your Memory doesn't enforce or interpret them. The model reads the content and gives it meaning. This is what keeps memory maximally portable — if the substrate had opinions, it would only work with systems that understand them.

This is an **Architecture spec** — it defines the generic Your Memory component that anyone could implement. It does not force a single storage technology, but it does require owner inspectability and exportability. Product-specific conventions (entry-point files, skills, folder structure, methodology) are implementation opinions that live *inside* Your Memory but are not defined *by* Your Memory.

## Why we define it this way

Every AI system has memory — ChatGPT remembers your preferences, Copilot retains conversation history, RAG systems store your documents in vector databases. In those systems, memory is a **feature of the application**. The app owns it, the app controls the format, and if you leave the app, your memory stays behind. Memory serves the application.

Here, it's inverted. **Your Memory is the platform — the application serves it.** Your Memory has zero outward dependencies. Every other component (Agent Loop, Auth, Gateway, clients, models, tools) depends on Your Memory. Your Memory depends on none of them. Remove any component, and Your Memory still works. Still readable. Still portable. Still yours. You can open it in a text editor with no system running and it still makes sense.

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

In an app-centric model, that compounding value belongs to the vendor. Here, it belongs to you — and it stays with you regardless of which agent loop, model, or client you use tomorrow.

This is also why the architecture only needs four components, and can evolve at the speed of AI.

New capabilities are either new data (add it to memory) or new actions (add a tool). Neither requires new architecture.

Other systems keep adding infrastructure for each new data source — a RAG pipeline, a search integration, an API connector. Here, a new data source is just a new tool pointing at someone else's memory.

The noun/verb binary is provably complete — fifteen proposed subsystems (RAG, skills, scheduling, knowledge graphs, workflows, and more) all decompose into memory (nouns) + tools (verbs) with no remainder.

No new components needed.

### What's NOT Memory

| Thing | Why it's not Memory |
|-------|-------------------|
| The Agent Loop process | Runtime, not persistent — starts fresh each time |
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

See [memory-as-platform.md](./background/memory-as-platform.md) for the full argument on why memory is the platform, and [memory-tool-completeness.md](./background/memory-tool-completeness.md) for the proof that this binary makes the architecture complete.

---

## What Memory Guarantees

The system provides six guarantees around your data. Four are Memory's job. Two are provided by other components on Memory's behalf.

| # | Guarantee | What it means | Whose job | Human analogy |
|---|-----------|--------------|-----------|---------------|
| 1 | **Persist** | What you store stays stored | Memory | Long-term memory |
| 2 | **Retrieve** | You can get back what you stored | Memory | Recall |
| 3 | **Search** | You can find content without knowing exactly where it is | Memory | Associative recall (starts as keyword, evolves toward biological) |
| 4 | **Version** | You can see what changed and make an earlier state current again (restore) | Memory | Changing your mind, then changing it back |
| 5 | **Structure** | Content has hierarchy, naming, relationships | Memory provides the structure; the model and owner decide what goes where | Filing system (the extension humans invented) |
| 6 | **Protect** | Access is controlled — not everyone sees everything | Auth (gates requests before they reach Memory) | Privacy, selective sharing |

Version history and restore are required, not optional. History must record what changed, not only that something changed, and the owner must be able to make an earlier state current again. How history is built is up to the implementation: Git is one option, a database with snapshots is another.

The split matters — if Memory absorbs protection or content organization, it becomes opinionated. Each absorbed responsibility is an outward dependency, and an opinionated substrate breaks portability. Memory has zero outward dependencies. That's the architectural property that makes it the platform.

---

## Portability

Because Memory has zero outward dependencies, it's portable by design — not as a feature bolted on after the fact, but as a structural property of the architecture.

### The robot test

If people interact with AI via robots in the future, the owner should bring their memory to that robot without rebuilding. Memory works with any future device, any future client, any future AI — because it's independent of all of them. Every architectural decision is measured against this test.

### Export is non-negotiable

Memory MUST support export. You can always get everything out. This is the baseline guarantee that makes ownership real.

The specific export format is an implementation choice. The architecture requirement: everything exportable, in open formats.

| Data | Included | Notes |
|------|----------|-------|
| All files (documents, pages, skills, config) | Yes | As-is, human-readable |
| Conversation history | Yes | Open format, including tool calls, tool results and every content part (text, images, files) |
| Version history | Yes | Open format (a Git repository is one option) |
| Structured data (tasks, etc.) | Yes | Open format |
| Derived data (indexes, embeddings) | Optional | Regenerable from source |

---

## Core Operations and Contract

### Operations

Memory's contract is a small set of operations exposed as tools. These are internal tools — the system's own interface to its platform. Unlike external tools (Salesforce queries, weather feeds, API calls), which are additive capabilities, Memory tools must always exist in some form — the system can't function without a way to read and write its own memory. If a better interface emerges, swap the Agent Loop — Memory itself doesn't change.

Not all callers use tools the same way. The model accesses Your Memory through the agent loop's tool loop — flexible, exploratory, judgment-based. Infrastructure components access Your Memory through dedicated internal tools scoped to their operational needs — fixed, mechanical, no judgment. The Gateway, for example, uses a conversation store tool for conversation management (D152). Both callers use the tool interface. Neither bypasses it.

The specific operation names and signatures are implementation choices — the architecture requirement is that they map to the guarantees above.

| Operation | What it does | Input | Output | Guarantee |
|-----------|-------------|-------|--------|-----------|
| `read` | Retrieve content by path | Path (or identifier) | Content at that path | Retrieve |
| `write` | Create or overwrite content | Path + content | Confirmation of persistence | Persist |
| `edit` | Modify existing content | Path + modification | Confirmation of change | Persist |
| `delete` | Remove content | Path | Confirmation of removal | Persist |
| `search` | Find content by pattern | Query (pattern, keyword) | Matching content and locations | Search |
| `list` | Enumerate content by location | Location (path, scope) | Content listing at that location | Structure |
| `history` | View changes and previous states | Path + optional time range | Change records and previous states | Version |
| `restore` | Make an earlier state current again | Path (or scope) + the earlier state to restore | Confirmation of the restore | Version |

### Error behavior

| Condition | Memory behavior |
|-----------|----------------|
| Content not found | Report to caller (model decides next step) |
| Write failure (disk full, permissions) | Report to caller — never report a failed write as saved |
| Invalid path or identifier | Report to caller |
| Concurrent write conflict | Report to caller — never resolved silently (for example, no silent last-write-wins). Simultaneous changes must not corrupt data |

### The substrate test — what belongs in Memory and what doesn't

The core operation set is intentionally small. Adding a new operation requires passing the **substrate test**:

**Does this operation work on the storage, or on the content?**

- Storage operations (how things are stored, retrieved, organized) → can be a Memory operation
- Content operations (understanding what's stored, making meaning) → that's the model's job using existing Memory operations

| Proposed operation | Substrate or content? | Memory operation? |
|---|---|---|
| `read`, `write`, `search` | Substrate — operating on storage | Yes |
| `semantic_search` | Substrate — Memory stores and retrieves vectors | Optional. Memory receives vectors, not text. How text becomes vectors is an implementation choice (for example, an embedding tool or a local embedding model); the Model API defines no embeddings route |
| `summarize` | Content — requires understanding meaning | No — model reads and summarizes |
| `associate` | Content — requires understanding relationships | No — model reads and creates links by writing |
| `consolidate` | Content — requires judgment about what matters | No — model reads, decides, writes |
| Skill execution | Content — the model reads skill files and follows them | No — model + Agent Loop |
| Prompt assembly | Content — the model reads instructions from Memory | No — model + Agent Loop |
| Context selection | Content — the model decides what to read | No — model decides |
| Access control | Cross-cutting — gates requests before they reach Memory | No — Auth |
| Conflict handling | Implementation — concurrent access coordination | No — tool implementations detect conflicts and report them; they never resolve them silently |

This is analogous to POSIX file operations — `open`, `read`, `write`, `close`, `stat`, `readdir`, `unlink`. That set has been stable for 50 years because the bar for a genuinely new storage operation is high.

---

## Storage Mechanisms

Memory is not a single storage technology. It's everything that persists behind the tools. Different data shapes use different storage mechanisms — all are Memory. The specific technologies are implementation choices.

| Storage mechanism | What it holds | Why this mechanism |
|-------------------|--------------|-------------------|
| **Files** (markdown, text, any format) | Documents, specs, plans, skills, configuration, context files | Human-readable, portable, AI-native |
| **Database** (for example SQLite) | Conversations, structured/queryable data, tasks | Relational queries, transaction support |
| **Version history** (for example Git) | Change history, previous states | Diff, restore |
| **Index** (vector, optional) | Vectors for semantic search (derived from source content) | Different retrieval mechanism |

Adding a new storage mechanism is adding tool implementations, not changing the contract.

---

## The Bootstrap

Prompt assembly lives in Memory — skills, context, personality, instructions are all files. But the model needs instructions before it can read Memory. This creates a chicken-and-egg.

The solution: a **minimal bootstrap prompt** in Agent Loop configuration — the BIOS. Tiny, generic, just enough to tell the model where to look. The specific bootstrap content is an implementation choice. Example:

> "You are the owner's assistant. Read the AGENT.md in the current folder for your instructions."

Everything else — personality, skills, methodology, context — the model discovers by following that instruction.

The bootstrap is Agent Loop configuration, not Memory. One line. Generic. Implementation-specific. Prompt assembly still lives in Memory. The bootstrap is just "look here."

---

## Concurrency

Concurrency is the tool implementation's problem, not Memory's. How concurrent writes are coordinated depends on the storage mechanism. Memory does not impose a concurrency model — doing so would constrain which storage backends can implement it. Two rules hold for every backend: simultaneous changes must not corrupt data, and a failed or conflicting write is reported, never resolved silently.

| Scenario | Resolution |
|----------|------------|
| One owner, one agent | Rare conflicts; the tools still detect and report them |
| Owner + background agents | Usually different files; tool implementations coordinate when overlapping and report conflicts |
| Multiple actors | Storage backends with proper transaction support |

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

Memory's scope expands with the expanding sphere (see [principles.md](./principles.md#5-start-constrained-expand-deliberately) §5 Start Constrained, Expand Deliberately) — from one folder, to the full filesystem, to external services, to federated data. At every stage: you USE everything the system can access, you OWN the subset under your control in an open format.

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D43 | Memory is an unopinionated substrate | Opinions live in it, not enforced by it. Keeps Memory maximally independent and portable. |
| D44 | Memory + Model = the brain | Memory is the persistent half (stored patterns, knowledge, skills). Model is the intelligence half. Neither is complete alone. |
| D45 | Filing system is the correct starting substrate | Evolution adds smarter tools on top, not replaces the filing system. Filing system gives perfect recall + intelligent navigation — potentially permanently superior to biological memory. |
| D46 | Core operations with substrate test for expansion | Storage operations → Memory. Content operations → the model. Healthy pressure to keep the set small. Analogous to POSIX — stable for 50 years. |
| D47 | Memory includes all persistent storage accessed through tools | Not just files — files, databases, indexes are all Memory. Tools abstract the storage mechanism. |
| D48 | USE any memory source, OWN the subset under your control | Ownership requires control + open format. Export must be in open formats (architecture requirement). Which specific open format is an implementation choice — the Foundation requires openness, not a particular format. |
| D49 | Memory belongs to the architecture, product conventions belong to an implementation | The spec defines generic infrastructure. Product-specific conventions (entry-point files, skills, methodology) are the opinionated implementation built on it. |
| D50 | Bootstrap prompt is Agent Loop configuration, not Memory | One-line seed ("read AGENT.md") lets the model self-bootstrap from Memory. Like a BIOS. An implementation choice, not Foundation. |
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
- [ ] Memory supports multiple storage mechanisms behind the tools
- [ ] The owner can see what changed and restore an earlier state
- [ ] A failed or conflicting write is reported to the caller, never resolved silently
- [ ] Memory has zero product-specific structure — it's a generic substrate
- [ ] Memory can be exported completely in open formats
- [ ] Memory passes the independence test — remove any other component, Memory still works, still readable, still portable
- [ ] Memory passes the robot test — take it to a completely different system and it works without rebuilding
- [ ] Swapping Memory's storage backend requires changing only tool implementations — Agent Loop, Client, Auth, and Models are unaffected
- [ ] Adding a new storage mechanism (vector index, cloud storage) is additive — existing tools keep working

---

## Security Requirements

Per-component requirements from [security-spec.md](./security-spec.md). Security-spec owns the "why"; this section owns the "what" for Your Memory.

- [ ] Memory must support full export in open formats — the owner can always get everything out
- [ ] Memory must be independent of all other components — removing any component leaves Memory intact and readable
- [ ] API keys, credentials, and tokens must never be stored in Memory. Secrets live outside Your Memory, somewhere git never tracks: environment variables, an untracked config file, or a secret store.
- [ ] Memory access must be mediated by tools — no component accesses storage directly
- [ ] Concurrent access must not corrupt data — tool implementations must handle concurrent writes safely and report conflicts

---

## Contract alignment

The canonical message schema under `contracts/` defines structured content parts and
preserves tool calls and tool results in conversation history, with role-specific
validation preventing tool results from appearing in non-tool messages. The generic
tool-definition contract now includes the canonical `memory_restore` operation shape
(`path` plus an opaque `version` identifier); concrete history storage and result
transport remain implementation-defined. Semantic search remains optional because
the Model API does not define an embeddings route.

---

## Related Documents

[overview.md](../architecture/overview.md) (architecture overview, links to all component specs)

---

*Your Memory is the platform — the only component that can exist completely on its own. The Agent Loop brings it alive. The model gives it intelligence. The tools give it access. Auth protects it. The client reveals it. But Your Memory is what persists when everything else is swapped, upgraded, or replaced. It's what makes the system yours.*
