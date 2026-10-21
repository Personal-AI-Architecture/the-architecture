---
sidebar_label: Your Memory
hide_table_of_contents: true
---

# Your Memory

## What Your Memory is

Your Memory is everything that makes your AI system yours: your conversations, files, skills and preferences, including how you want your tools and agents to work.

In most AI apps, memory is a feature of (and locked inside) the app. The app controls the format, and if you leave, your memory stays behind.

We believe that this is backwards. The things that make your AI system yours should be owned and controlled by you, not someone else.

And that's why PAA makes you the owner of Your Memory instead. Your Memory is kept in your own files, in open formats that make it usable with any AI, and that you can open with ordinary tools, like a text editor or a database viewer, even when the system isn't running. It is also separate from the rest of your AI system. The Agent Loop, Gateway and Auth, and the models, clients and tools around them, all depend on Your Memory, and it depends on none of them.

With PAA you can replace any component of your AI system, or use a completely different system, and Your Memory is still there, still readable, still yours.

<p align="center">
  <img src="../assets/memory-is-the-platform.svg" alt="Today's AI apps: Your Memory is locked inside the app with its models, interfaces and tools, so leaving the app means losing your memory. With PAA: Your Memory is the platform, in files you own, and models, interfaces and tools plug into it, so you can swap anything and your memory stays." width="860" />
</p>

## How it works

In traditional software, your data can't be separated from the code that runs it. The app's code is what understands your data and decides what to do with it, so your data only makes sense inside that app.

AI changes this. A model can read plain language, so the things that make your AI behave the way it does (its skills, instructions, personality and way of working) no longer need to be written as code. They can be plain files in Your Memory, alongside your conversations and documents. The model reads them and acts on them. That's why the other parts of the system can stay generic and swappable: everything that makes your AI yours is in Your Memory, not in them.

Because the model does the understanding, Your Memory can be stored in plain, open formats that any AI can use. Your Memory doesn't need to know what any of it means; it just keeps it. The model understands it, the Agent Loop runs the tools, and Auth decides who can do what.

Any part of the system that needs Your Memory reaches it through tools such as read, write and search, never by going straight to the files or database underneath. This keeps Your Memory decoupled from the rest of the system and means how Your Memory is stored can change (plain files today, a database tomorrow, smarter search added later) without any other part noticing.

---

The rest of this doc is the specification: what any implementation of Your Memory must do.

**Serves stories:** US-2, US-3, US-4, US-11 in the [PAA spec](../spec/personal-ai-architecture-spec.md).

This is an **Architecture spec**: it defines the generic Your Memory component that anyone could implement. It does not force a single storage technology, but it does require owner inspectability and exportability. Product-specific conventions (entry-point files, skills, folder structure, methodology) are implementation opinions that live *inside* Your Memory but are not defined *by* Your Memory.

## What counts as Your Memory

All data is memory; the only question is whose. The component called Your Memory is specifically the subset you own: your local, persistent storage in open formats (D138). External data (Salesforce records, weather feeds, the internet) lives outside it and is reached through tools.

### What's not Your Memory

| Thing | Why it's not Memory |
|-------|-------------------|
| The Agent Loop process | Runtime, not persistent — starts fresh each time |
| The model weights | Intelligence, not memory — the model is the intelligence half of the brain, Your Memory is the persistent half |
| Active session tokens | Ephemeral auth state, not persistent |
| Cached/derived data (regenerable) | Derived from Memory content — if lost, rebuild from source |

The test: if you deleted it and restarted, would the system lose something irreplaceable? If yes, it's Memory. If it can be regenerated from Memory, it's derived data.

### What you use and what you own

Ownership is a spectrum:

| Memory source | Used? | Owned? |
|---|---|---|
| Your markdown files in your library | Yes | **Yes** — your control, open format |
| Your SQLite database | Yes | **Yes** — your control, open format |
| A closed-source database you chose | Yes | Partially — your control, but format dependency |
| Someone else's shared files | Yes | No — their control |
| The internet | Yes | No — not under your control |

### Storage mechanisms

Memory is not a single storage technology. It's everything that persists behind the tools. Different data shapes use different storage mechanisms — all are Memory. The specific technologies are implementation choices.

| Storage mechanism | What it holds | Why this mechanism |
|-------------------|--------------|-------------------|
| **Files** (markdown, text, any format) | Documents, specs, plans, skills, configuration, context files | Human-readable, portable, AI-native |
| **Database** (for example SQLite) | Conversations, structured/queryable data, tasks | Relational queries, transaction support |
| **Version history** (for example Git) | Change history, previous states | Diff, restore |
| **Index** (vector, optional) | Vectors for semantic search (derived from source content) | Different retrieval mechanism |

---

## What Your Memory guarantees

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

### Independence

Memory has zero outward dependencies. Removing any other component leaves Memory intact and readable. If Memory absorbs protection or content organization, it becomes opinionated, and each absorbed responsibility is an outward dependency that breaks portability.

### Export

Memory MUST support export. You can always get everything out. This is the baseline guarantee that makes ownership real.

The specific export format is an implementation choice. The architecture requirement: everything exportable, in open formats.

| Data | Included | Notes |
|------|----------|-------|
| All files (documents, pages, skills, config) | Yes | As-is, human-readable |
| Conversation history | Yes | Open format, including tool calls, tool results and every content part (text, images, files) |
| Version history | Yes | Open format (a Git repository is one option) |
| Structured data (tasks, etc.) | Yes | Open format |
| Derived data (indexes, embeddings) | Optional | Regenerable from source |

### No secrets

API keys, credentials, and tokens must never be stored in Memory. Secrets live outside Your Memory, somewhere git never tracks: environment variables, an untracked config file, or a secret store.

---

## How other parts reach Your Memory

### Operations

Memory's contract is a small set of operations exposed as tools. These are internal tools — the system's own interface to its platform. Unlike external tools (Salesforce queries, weather feeds, API calls), which are additive capabilities, Memory tools must always exist in some form — the system can't function without a way to read and write its own memory. If a better interface emerges, swap the Agent Loop — Memory itself doesn't change.

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

### Two kinds of caller

Not all callers use tools the same way. The model accesses Your Memory through the agent loop's tool loop — flexible, exploratory, judgment-based. Infrastructure components access Your Memory through dedicated internal tools scoped to their operational needs — fixed, mechanical, no judgment. The Gateway, for example, uses a conversation store tool for conversation management (D152). Both callers use the tool interface. Neither bypasses it.

---

## Errors and concurrency

| Condition | Memory behavior |
|-----------|----------------|
| Content not found | Report to caller (model decides next step) |
| Write failure (disk full, permissions) | Report to caller — never report a failed write as saved |
| Invalid path or identifier | Report to caller |
| Concurrent write conflict | Report to caller — never resolved silently (for example, no silent last-write-wins). Simultaneous changes must not corrupt data |

Concurrency is the tool implementation's problem, not Memory's. How concurrent writes are coordinated depends on the storage mechanism. Memory does not impose a concurrency model — doing so would constrain which storage backends can implement it. The two rules in the table above hold for every backend.

| Scenario | Resolution |
|----------|------------|
| One owner, one agent | Rare conflicts; the tools still detect and report them |
| Owner + background agents | Usually different files; tool implementations coordinate when overlapping and report conflicts |
| Multiple actors | Storage backends with proper transaction support |

---

## How Your Memory grows

### Adding an operation: the substrate test

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

### Adding storage

Memory starts as a filing system and adds smarter tools on top. It does NOT evolve away from the filing system — it augments it. Adding a new storage mechanism is adding tool implementations, not changing the contract.

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

## Checking an implementation

Items marked *(security)* are the per-component requirements from [security-spec.md](./security-spec.md), which owns the "why".

- [ ] Memory persists content reliably — what you store stays stored
- [ ] Memory retrieves content through tools — read, search, list work correctly
- [ ] The owner can see what changed and restore an earlier state
- [ ] A failed or conflicting write is reported to the caller, never resolved silently, and simultaneous changes do not corrupt data *(security)*
- [ ] Memory can be exported completely in open formats — the owner can always get everything out *(security)*
- [ ] Memory passes the independence test — remove any other component, Memory still works, still readable, still portable *(security)*
- [ ] Memory works with any future device, client or AI without rebuilding
- [ ] Memory access is mediated by tools — no component accesses storage directly *(security)*
- [ ] API keys, credentials, and tokens are never stored in Memory *(security)*
- [ ] Memory has zero product-specific structure — it's a generic substrate
- [ ] Memory supports multiple storage mechanisms behind the tools
- [ ] Swapping Memory's storage backend requires changing only tool implementations — Agent Loop, Client, Auth, and Models are unaffected
- [ ] Adding a new storage mechanism (vector index, cloud storage) is additive — existing tools keep working

---

## Decisions

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

## Contract alignment

The canonical message schema under `contracts/` defines structured content parts and
preserves tool calls and tool results in conversation history, with role-specific
validation preventing tool results from appearing in non-tool messages. The generic
tool-definition contract now includes the canonical `memory_restore` operation shape
(`path` plus an opaque `version` identifier); concrete history storage and result
transport remain implementation-defined. Semantic search remains optional because
the Model API does not define an embeddings route.

Tool-call message parts retain `source_id` alongside the tool name, so conversation
history remains unambiguous when two sources expose the same tool name.
