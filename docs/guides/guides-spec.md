---
hide_table_of_contents: true
---

# Developer Guides Spec

## Problem

The architecture specs (12+ files) are optimized for decision-making and alignment — they explain *what* the architecture is and *why* every choice was made. But a developer (human or AI agent) who sits down to code needs a different view: *what to build* and *what shape the pieces are*.

Right now a developer would need to read 12 spec files and synthesize the implementation contract themselves. The specs are the *constitution*. What's missing is the *developer guide*.

---

## Audiences

Three developer audiences, each needing different things:

| Audience | What they're doing | What they need |
|----------|-------------------|----------------|
| **Level 1 Implementer** | Building the foundation components themselves | Component contracts, interface shapes, validation criteria |
| **Level 2 Product Builder** | Building an opinionated product on top of the foundation (e.g., BrainDrive) | Customization points, what to extend, what not to touch |
| **System Extender** | Adding tools, skills, clients to a running instance | Tool registration, client connection, skill authoring |

### Onboarding Paths

Each audience has a "start here" flow — the minimal set of files and first action to get productive:

**Level 1 Implementer** — building the foundation:
1. Read `AGENT.md` (repo root) — architecture overview, component boundaries
2. Read [guides/implementers-reference.md](./implementers-reference.md) — what each component must do
3. Read `specs/openapi/` and `specs/schemas/` — the interface shapes to implement against
4. Run the conformance suite to validate your implementation

**Level 2 Product Builder** — building on the foundation:
1. Read `AGENT.md` (repo root) — architecture overview
2. Read [customization-spec.md](../customization-spec.md) — extension points and constraints
3. Read `specs/openapi/` and `specs/schemas/` — the API shapes your product uses
4. Start from the component stubs or reference implementation

**System Extender** — adding tools, skills, or clients:
1. Read `AGENT.md` (repo root) — architecture overview
2. Read [tools-spec.md](../tools-spec.md) — how tools work in the architecture
3. Read the tool definition schema in `specs/schemas/`
4. Register your tool and test it

---

## Deliverables

### 1. Implementer's Reference (`implementers-reference.md`)

A single document (~300 lines) containing *only* what you need to build against:

- The 4 components, what each must do (not why)
- The 2 API contracts (referencing the canonical schemas)
- The Gateway-Engine contract
- The responsibility matrix (distilled from foundation-spec)
- Conformance criteria (test IDs, pass/fail)

No decisions, no rationale, no history. Just the implementation contract. Think API docs for the architecture.

### 2. Canonical Contract Schemas (`contracts/`)

The contracts expressed as language-neutral schemas (OpenAPI for HTTP contracts, JSON Schema for data shapes, SSE event schema for streaming). These are the canonical, authoritative contract definitions.

**Canonical (language-neutral):**
- `gateway-api.yaml` — OpenAPI spec for Gateway API
- `model-api.yaml` — OpenAPI spec for Model API
- `gateway-engine.yaml` — OpenAPI spec for Gateway ↔ Engine internal contract
- `schemas/` — JSON Schema definitions for shared types (messages, tool definitions, configuration, SSE events)

**Generated outputs (language-specific, derived from canonical schemas):**
- `generated/contracts.ts` — TypeScript interfaces
- `generated/contracts.py` — Python types (future)
- Other languages as needed

The canonical schemas are the source of truth. Language-specific outputs are generated and must not be hand-edited. This keeps the architecture language-neutral (D16) while still giving developers immediately usable types in their language.

### 3. Foundation Repo AGENT.md (lives at repo root, not in guides/)

The bootstrap file AI coding agents read when they open the repo:

- What the architecture is (compressed, ~50 lines)
- Where the contracts are defined (as schemas)
- What the component boundaries are
- What the conformance criteria are
- What NOT to do (lock-in gate checks)

This is the "context window friendly" entry point. Full specs become reference material the agent reads when it needs depth on a specific component.

### 4. Reference Implementation (Minimal) (`reference/`)

A minimal working example that boots all 4 components, connects them, and passes the conformance suite. Answers the question every developer asks: "show me what it looks like running."

For AI agents specifically, a working reference is the single best piece of context — they can pattern-match against it.

### 5. Component Stubs / Templates (`stubs/`)

Skeleton implementations for each component with the right interfaces but minimal logic:

- `engine-stub.ts` — generic agent loop skeleton
- `gateway-stub.ts` — conversation management + routing skeleton
- `auth-stub.ts` — middleware skeleton
- `memory-tools-stub.ts` — memory tool interface skeleton

A developer (or agent) picks up a stub, fills in the implementation, and the system works because the contracts are already wired.

### 6. Conformance Suite (`conformance/`)

A runnable test suite that validates *any* implementation against the architecture. Each test has an ID, description, pass/fail criteria, and maps to an architectural invariant.

**Swap tests (from D147):**

| Test ID | Test | Pass Criteria | Validates |
|---------|------|---------------|-----------|
| SWAP-1 | Provider swap | Change provider config → next message uses new provider → no code changes | Model API contract, Principle 2 |
| SWAP-2 | Model swap | Change model config → next message uses new model → no code changes | Model API contract |
| SWAP-3 | Tool swap | Add/remove a tool → system functions → no code changes to Engine/Gateway/Auth | D51, Principle 3 |

**Architectural invariant tests:**

| Test ID | Test | Pass Criteria | Validates |
|---------|------|---------------|-----------|
| ARCH-1 | Memory zero dependencies | Stop all components except Memory storage → Memory is still readable with standard tools (text editor, file browser, DB viewer) | Principle 1, foundation-spec §Your Memory |
| ARCH-2 | Engine swap | Replace Engine implementation → Gateway/Memory/Auth/tools unaffected → system functions | D39, FS-7 |
| ARCH-3 | Client swap | New client speaks Gateway API → system serves it identically | D57, FS-5 |
| ARCH-4 | Schema conformance | All API payloads validate against canonical schemas in `specs/` | D16, Principle 3 |

**Deployment invariant tests (from deployment-spec + security-spec):**

| Test ID | Test | Pass Criteria | Validates |
|---------|------|---------------|-----------|
| DEPLOY-1 | Offline operation | Disconnect network → system functions for all memory operations | deployment-spec guarantee 3 |
| DEPLOY-2 | Local data storage | All user data resides on owner-controlled storage → no silent external writes | deployment-spec guarantee 2 |
| DEPLOY-3 | Default localhost | Fresh install binds to localhost only → no external network exposure | security-spec, deployment-spec guarantee 5 |
| DEPLOY-4 | No silent outbound | System makes no network calls except explicit provider/tool requests initiated by user action | security-spec |

**Foundation user story tests (from FS-1 through FS-8):**

| Test ID | Story | Pass Criteria | Validates |
|---------|-------|---------------|-----------|
| FS-1 | Move Your Memory | Export memory → import on fresh deployment → preferences honored, gaps reported, nothing lost | Principle 1, memory portability |
| FS-2 | Add capability | Add a tool/skill/client/provider → Memory gains no outward dependencies → four-component structure holds | Principle 3, Principle 1, D64 |
| FS-3 | Run on own hardware | Install on laptop/desktop/server → no external service required → full offline capability | D148, Pillars 2+3 |
| FS-4 | Swap provider | = SWAP-1 | Model API |
| FS-5 | Swap client | = ARCH-3 | Gateway API |
| FS-6 | Evolve Memory | Add search capability → no other component changes | Principle 1 |
| FS-7 | Swap Engine | = ARCH-2 | D39, Principle 2 |
| FS-8 | Expand scope via tools | Add tools → broader capability → no architectural changes | D55, Principle 5 |

Some FS tests overlap with SWAP/ARCH/DEPLOY tests — noted with `=` references above. Fixtures and evidence format (CI output, artifacts) to be defined when the reference implementation exists.

---

## Source of Truth & Update Workflow

Guides are *derived* from specs. Specs are always authoritative. This section defines how changes flow and how drift is prevented.

### Hierarchy

```
Specs (authoritative)
  └── Canonical schemas (contracts/) — derived from specs
        └── Generated outputs (contracts/generated/) — derived from schemas
  └── Implementer's reference — distilled from specs
  └── AGENT.md — compressed from specs
  └── Stubs / reference impl — must conform to schemas
```

### Update Rules

1. **Specs change first.** Any architectural change starts in the relevant spec file. Changes never originate in guides.
2. **Schemas track specs.** When a spec changes a contract shape, the canonical schema in `contracts/` is updated in the same session.
3. **Generated outputs are regenerated, not hand-edited.** `contracts/generated/` files are produced from canonical schemas. Manual edits are overwritten.
4. **Implementer's reference is re-synced after spec changes.** The reference distills from specs — when specs change, check if the reference needs updating. Flag drift in AGENT.md document health table.
5. **Conformance suite tracks invariants.** When a new architectural invariant is added (new decision, new guarantee), a corresponding test ID is added to the conformance suite.

### Drift Detection

- The project AGENT.md document health table tracks sync status for all guides (same as specs today).
- The conformance suite itself serves as a drift detector: if a spec changes and the suite still passes, either the suite is incomplete or the change was non-breaking.
- Future: CI can validate generated outputs match canonical schemas (linting step).

---

## Folder Structure

```
personal-ai-architecture/
├── AGENT.md                              ← repo bootstrap (Deliverable 3)
├── docs/
│   ├── foundation-spec.md                ← architecture specs
│   ├── engine-spec.md
│   ├── ...
│   ├── guides/
│   │   ├── guides-spec.md                ← this file
│   │   ├── implementers-reference.md     ← Deliverable 1
│   │   └── conformance/                  ← Deliverable 6
│   │       └── (swap tests + invariant checks)
│   └── research/                         ← evaluations and analysis
├── specs/
│   ├── openapi/                          ← Deliverable 2 (canonical OpenAPI)
│   │   ├── gateway-api.yaml
│   │   ├── model-api.yaml
│   │   └── gateway-engine.yaml
│   └── schemas/                          ← JSON Schema shared types
├── src/                                  ← implementation
└── test/                                 ← tests
```

---

## Priority

Highest leverage first:

1. **Implementer's Reference** — the single document a developer reads before coding
2. **Canonical Contract Schemas** — language-neutral interface definitions
3. **AGENT.md** — the AI agent entry point
4. **Conformance Suite** — proves an implementation is correct
5. **Component Stubs** — accelerates getting started
6. **Reference Implementation** — the "show me it working" artifact

Items 1-3 should exist before the foundation repo goes public. Items 4-6 can follow.

---

## Deferred

These items are important but premature to define now. Flagged for resolution before 1.0:

- **Contract versioning policy** — semver, deprecation windows, backward-compatibility guarantees for APIs. Define when there are deployed contracts to version.
- **Folder reorganization** — if `guides/` grows large enough that mixing docs and executable artifacts causes friction, split into `guides/` (docs), `examples/` (runnable code), `conformance/` (test suite). Reorganize when the content warrants it, not before.

---

## Design Principles

- **Compress, don't duplicate.** Guides reference specs; they don't restate them. The spec is authoritative.
- **Language-neutral first.** Canonical contracts are OpenAPI/JSON Schema. Language-specific types are generated outputs.
- **Context-window friendly.** Each document should be useful to an AI agent without needing to read 12 other files.
- **Validate, don't document.** A runnable test with pass/fail criteria is better than a written rule.
- **Specs flow down.** Changes originate in specs and flow to guides, never the reverse.

---

## Related Documents

[foundation-spec.md](../foundation-spec.md) (architecture overview, links to all component specs)
