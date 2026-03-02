# Lock-In Risk Analysis: Foundation Architecture

> **Project:** Pivot
> **Date:** 2026-02-21
> **Purpose:** Confirm that the foundation architecture delivers on its zero-lock-in design, and identify the implementation disciplines required to keep it that way.
> **Source:** foundation-spec.md component definitions, decisions D1-D28, engine-evaluation.md findings

---

## Why This Document Exists

The foundation spec (foundation-spec.md) makes a specific architectural argument: every component communicates through defined interfaces, so any component can be replaced without touching anything else. You can take everything with you, and you can swap anything out.

This document confirms that claim is correct, then identifies the implementation disciplines that keep it true. The architecture is designed for zero lock-in at every layer. The only risk is letting the implementation drift from the design — and that's what the recommendations guard against.

---

## The Core Argument

The architecture achieves zero lock-in through one principle: **everything is either a standard, a file, or behind a contract you own.** And the contracts themselves are swappable via adapters (D139) — thin translation layers between each contract and the components on either side.

| Layer | What It Is | Why There's No Lock-In |
|-------|-----------|----------------------|
| **Memory** | Files on disk | Your files. Copy the folder. Everything — data AND organization — is portable. |
| **Tools** | MCP servers | Open standard. Any MCP server works with any MCP client. Swap individually. |
| **Intelligence** | Models via provider interface | Config change swaps the model. Config change swaps the router. |
| **Interface** | Web app behind a contract | Talks to the Gateway API, not the Engine. Replace or multiply freely. |
| **Engine** | Generic agent loop (~2000 lines) | A commodity component — intentionally thin, intentionally generic. Swap the whole thing. |
| **Auth** | Edge layer in front of everything | Decoupled from every component. Can evolve independently. |

The rest of this document walks through each component to confirm this holds and to identify where implementation discipline matters.

---

## Component Analysis

### 1. Memory (Filesystem + Git)

**Spec claim:** Most portable component. Tools guarantee no lock-in. Storage format is an implementation detail.

#### Lock-In Assessment

| Dimension | Risk Level | Detail |
|-----------|-----------|--------|
| **Data format** | None | Markdown files in folders. `cp -r` moves everything. No proprietary format, no binary blobs, no database export. |
| **Organization & conventions** | None | AGENT.md, folder hierarchy, skill format, pulse tasks — these ARE files. They're human-readable markdown in plain folders. Any system that reads files can read them. |
| **Version history** | Low | V1 uses Git. Git is the most portable version control system in existence. If memory evolves beyond Git, define the abstract version history contract first. |
| **Tool semantics** | Low | If `search` means "grep" today and "semantic search" tomorrow, the tools are stable but behavior changes. Skills may need adjustment — hours, not days. |

#### Why This Is Fully Portable

The Notion analogy doesn't apply here. In Notion, your organization lives in Notion's proprietary database — when you export, you lose it. In BrainDrive, the conventions *are* the files. AGENT.md is a markdown file. Skills are markdown files. Folder structure is just folders. There's no proprietary layer between the convention and the filesystem.

If someone built a competing system that understood AGENT.md files, they could read everything BrainDrive wrote — because there's nothing to "export." It's already there.

**You own your files AND the organization, because the organization is also files.** The only thing that doesn't travel is the agent that *acts on* those conventions — and that's the Engine, not Memory.

#### Exit Cost

- **Moving everything:** Minutes. Copy the folder. Organization comes with it.
- **Migrating version history:** Minutes if staying Git-based. Hours if converting to another system.

#### Verdict

**Zero lock-in.** The spec's claim fully holds. Memory is the architecture's strongest portability story. Convention structure is portable because it's files, not metadata locked in a database.

#### Discipline Required

- **Define the abstract version history contract before evolving past Git.** As long as history lives in Git, it's perfectly portable. If memory evolves to cloud-native storage, the migration path needs to be defined before the change, not after.

---

### 2. Engine (Generic Agent Loop)

**Spec claim:** The Engine is a commodity component (D39) — intentionally thin, intentionally generic, intentionally free of BrainDrive-specific logic. Swappable because there's nothing to extract or migrate.

#### Lock-In Assessment

**The architecture has zero Engine lock-in.** The interface talks to the Gateway API contract, not the Engine. Memory doesn't know what Engine reads it. MCP tools are independent servers. Auth sits at the edge. Swapping the Engine is invisible to everything else.

The V1 Engine is Build Our Own (~2000 lines of TypeScript) using Vercel AI SDK + MCP TypeScript SDK. Because the Engine is generic — zero BrainDrive-specific logic — a swap means replacing one commodity implementation with another.

#### What an Engine Swap Actually Involves

| Integration Point | With Generic Engine (D39) | If Engine Accumulates BrainDrive Logic |
|---|---|---|
| **Gateway routing** | Gateway routes to new Engine the same way | Gateway coupled to Engine-specific internals |
| **System prompts** | Live in Memory — Engine reads them through tools | Embedded in Engine code — must be extracted |
| **Skill execution** | Skills are markdown in Memory — model reads and follows them (D40) | Coupled to engine-specific multi-turn behavior |
| **Tool execution** | MCP standard — any Engine that's an MCP client works | Custom tool-calling quirks built into Engine code |
| **Provider interface** | Vercel AI SDK abstraction — any Engine using it gets 20+ providers | Coupled to specific provider handling |

**With discipline (generic Engine):** Days — drop in a new Engine behind the Gateway.
**Without discipline (Engine accumulates BrainDrive logic):** 2-4 weeks — because logic that should live in Memory has leaked into the Engine and must be extracted.

#### What the Gateway API Contract Protects

The contract provides real, structural protection:

- **The interface doesn't rebuild.** It speaks the Gateway API, not the Engine.
- **Memory is untouched.** Files don't move, don't change, don't care which Engine reads them.
- **MCP tools keep working.** They're independent servers — the new Engine just needs to be an MCP client.
- **Auth stays put.** It's a cross-cutting layer, independent of the Engine.

An Engine swap is replacing one commodity agent loop with another while everything it connects stays in place.

#### V1 Engine: Build Our Own

| Consideration | Detail | Discipline Required |
|------|--------|----------|
| **~2000 lines TypeScript** | Small enough for AI agents to understand and maintain entirely | Keep it small — resist adding BrainDrive-specific logic (D39) |
| **Vercel AI SDK** | Provider abstraction — 20+ providers including OpenRouter | Accept as implementation detail. The Gateway API insulates BrainDrive. |
| **MCP TypeScript SDK** | Tool execution — connects to any MCP server | Standard protocol, no lock-in |
| **VoltAgent fallback** | If unexpected complexity arises, VoltAgent provides a similar architecture | Evaluate periodically as the ecosystem evolves |

#### Exit Cost

- **With generic Engine discipline (D39):** Days — commodity swap
- **Without discipline (Engine accumulates logic):** 2-4 weeks
- **Adopting an off-the-shelf Engine (e.g., VoltAgent, future options):** Days to ~1 week

#### Verdict

**Zero architectural lock-in.** The Gateway API contract ensures the swap is contained — nothing outside the Engine is affected. The Engine being generic (D39) and having zero BrainDrive-specific logic means the swap cost is inherently low. This is reinforced by implementation discipline, not dependent on it.

#### Disciplines Required

1. **Keep the Engine generic (D39).** Zero BrainDrive-specific logic in the Engine. All behavior emerges from Memory (D40).
2. **Skills and prompt assembly live in Memory, not the Engine (D40).** The model reads instructions from files — the Engine just runs the agent loop.
3. **Document the Engine's interface surface.** Maintain a list of every point where the Gateway and tools connect to the Engine. This is the swap checklist.

---

### 3. Interface (Web App)

**Spec claim:** "Just an API client" (D57). Any client that speaks the Gateway API works. Interface can be redesigned, rewritten, or replaced independently.

#### Lock-In Assessment

| Dimension | Risk Level | Detail |
|-----------|-----------|--------|
| **External dependency** | None | BrainDrive owns the interface entirely. |
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

### 4. Intelligence (Models via OpenRouter)

**Spec claim:** "Provider choice is configuration, not code. The thing that changes fastest in AI — which model to use — is the cheapest thing to change in this architecture."

#### Lock-In Assessment

**Model lock-in — zero:**

The provider interface abstraction works. Changing from Claude to GPT to Gemini is a config change. This is the spec's strongest swappability claim after memory.

**Provider routing — zero architectural lock-in, but has a reliability consideration:**

| Concern | Detail | Reality |
|---------|--------|---------|
| **OpenRouter availability** | If OpenRouter goes down, model access stops until fallback is activated | Operational concern, not lock-in. Add a fallback path. |
| **OpenRouter pricing** | Adds margin on top of provider prices | Business concern, not lock-in. Can route direct at any time. |
| **Switching to direct provider** | Handle provider-specific auth, streaming, errors | Days of work — but this is expanding capability, not escaping lock-in |

#### The Dependency Chain

```
BrainDrive Interface
  → Gateway API
    → Engine (Build Our Own, ~2000 lines TypeScript)
      → Vercel AI SDK (provider abstraction)
        → OpenRouter (routing layer)
          → Model Provider (Anthropic / OpenAI / Google)
```

Five layers — but each is independently swappable, and BrainDrive's Gateway API contract means layers 3-6 are invisible to the interface. The compound chain is an implementation reality, not a lock-in concern. Version-pin and monitor.

#### Prompt Tuning Reality

In practice, system prompts and skills will be tuned for specific models. Switching models is a config change, but prompt re-tuning may be needed:

- **Config change:** Minutes
- **Prompt validation/re-tuning:** Hours to days

This is ongoing maintenance, not lock-in. Every AI system has this characteristic — it's inherent to working with language models.

#### Exit Cost

- **Switching models:** Minutes (config) + hours-to-days (prompt tuning)
- **Switching from OpenRouter to direct provider:** Days (handle provider-specific quirks)
- **Switching provider abstraction entirely:** Only happens via an Engine swap

#### Verdict

**Zero lock-in.** Model swapping is genuinely a config change. Provider routing is swappable. The dependency chain is deep but each link is independently replaceable.

#### Disciplines Required

1. **Add an OpenRouter fallback path.** Config-level ability to route to at least one direct provider. Test before production. This is reliability, not lock-in mitigation.
2. **Test skills against two models before launch.** Validates the "config change" claim for BrainDrive's specific prompts.
3. **Pin dependency versions in a manifest.** OpenCode, AI SDK, OpenRouter API. Monitor for breaking changes.

---

### 5. Tools (MCP Protocol)

**Spec claim:** "We're not even locked into MCP itself. MCP is an open protocol with a permissive license — but more importantly, it describes a pattern (tool discovery + tool execution) that's more fundamental than any specific implementation."

#### Lock-In Assessment

**Individual tool lock-in — zero:**

Each MCP server is independent. Replace one without touching others. Add without modifying anything. This is the architecture's best feature.

**MCP protocol lock-in — effectively zero:**

| Mitigating Factor | Why It Matters |
|-------------------|---------------|
| Linux Foundation governance (AAIF) | Won't be abandoned or relicensed on a whim |
| Founding members: Anthropic, OpenAI, Block | The three biggest players in AI agents are invested |
| Ecosystem scale | Thousands of MCP servers, dozens of clients. Network effects protect it. |
| Open specification | Even if the Foundation falters, the spec is open and forkable |
| Industry convergence | No competing protocol has meaningful traction |

The probability of needing to replace MCP is near zero. The realistic maintenance concern is MCP version updates as the pre-2.0 spec evolves — and that's standard dependency management, not lock-in.

#### Exit Cost

- **Replacing a single MCP tool:** Hours. Write a new server, swap the config.
- **Upgrading MCP version (minor):** Hours to days of testing.
- **Upgrading MCP version (major, breaking):** Days to weeks of tool updates.
- **Replacing MCP entirely:** Months — but this scenario is essentially impossible given governance and adoption.

#### Verdict

**Zero practical lock-in.** MCP is the right bet. The spec's claim holds — both for individual tool swappability and for the protocol itself.

#### Discipline Required

- **Track MCP spec version and changelogs.** Subscribe to AAIF announcements.
- **Budget for periodic version updates.** Standard dependency maintenance.
- **Don't overbuild protocol abstraction layers.** The complexity of an abstraction costs more than the near-zero risk it mitigates.

---

### 6. Auth (TBD — Implementation Undefined)

**Spec claim:** Decoupled from every other component. Sits at the edge. Can evolve from simple password to OAuth to SSO to granular permissions without touching anything else.

#### Lock-In Assessment

**The architecture is sound. Zero lock-in by design.**

| Dimension | Risk Level | Detail |
|-----------|-----------|--------|
| **Architecture position** | None | Auth is a cross-cutting layer (D60), independent of Engine and Gateway. No other component knows about callers. |
| **Token/session format** | TBD | JWT vs. sessions — implementation choice, not lock-in. Either can be swapped. |
| **Identity provider** | TBD | Password vs. OAuth vs. SSO — each is additive, not exclusive. |
| **Permission model** | TBD | Getting the schema right early avoids rework. But it's internal design quality, not vendor lock-in. |

**The biggest auth risk isn't lock-in — it's underinvestment.** If auth is bolted on after the Engine and Gateway are built, it will accommodate their quirks rather than being clean. This is a sequencing risk, not an architectural one. (Auth implementation has since been researched — see `auth-research.md`: Better Auth + Casbin recommendation.)

#### Exit Cost

- **Switching auth provider (e.g., password → OAuth):** Days, if properly separated
- **Changing permission model:** Weeks, if not designed with future roles in mind
- **None of these are lock-in.** They're internal design decisions.

#### Verdict

**Zero lock-in by design.** Risk is purely about implementation quality and sequencing.

#### Disciplines Required

1. **Make auth implementation decisions early in the build plan.** Design the permission schema with future roles in mind, even if V1 only implements owner-only.
2. **Keep auth stateless if possible.** JWT with short expiry avoids session storage infrastructure.

---

## Connector Analysis

### Gateway API (BrainDrive-Defined)

| Dimension | Assessment |
|-----------|-----------|
| **Lock-in** | Zero. BrainDrive owns this entirely. Built on the prevailing industry standard (D16), currently OpenAI Chat Completions format, swappable via adapter (D139). |
| **Contract lock-in** | Zero. If the industry standard shifts away from Chat Completions, a Gateway API adapter absorbs the change — components on either side stay untouched (D139). |
| **Discipline** | Design it from BrainDrive's needs, not shaped by the current Engine's patterns. This ensures the contract survives any Engine swap. |

### MCP Protocol (Linux Foundation / AAIF)

| Dimension | Assessment |
|-----------|-----------|
| **Lock-in** | Zero practical lock-in. Open governance, massive adoption, permissive license. |
| **Discipline** | Track versions. Budget for periodic updates. Don't build abstraction layers on top. |

### Provider API (Vercel AI SDK → OpenRouter → Provider)

| Dimension | Assessment |
|-----------|-----------|
| **Lock-in** | Zero. Each link independently swappable. |
| **Contract lock-in** | Zero. Provider API adapter translates between the Engine's internal interface and whichever provider format is current — this is the most frequently swapped adapter (D139). Vercel AI SDK already implements this pattern. |
| **Discipline** | Have a config-level fallback to at least one direct provider. Test it before production. |

### Contract Swappability (D139)

The contracts themselves could be a lock-in vector — if the Gateway API binds tightly to OpenAI Chat Completions and that standard shifts, both sides must change. Adapters solve this: components speak an internal interface, and a thin adapter translates to/from the current external standard. Swap the standard → swap the adapter → nothing else changes. This completes the swappability chain: Memory via tools, components via contracts, contracts via adapters. See `adapter-spec.md`.

---

## Cross-Cutting Observations

### 1. Dependency Chain Management

The full path from user to capability:

```
User → Interface → Gateway API → Engine → Vercel AI SDK → OpenRouter → Model
                                    ↓
                               MCP Client → MCP Server → Tool → Memory
```

Each link is swappable. With 8+ components in the chain, version management matters — not because of lock-in, but because of standard dependency hygiene. This requires:

- A dependency manifest (version-pinned)
- A change monitoring process (watch for upstream breaking changes)
- A testing strategy that validates the full chain, not just individual components

This is normal open-source dependency management, not an architectural concern.

### 2. Convention Portability

BrainDrive's AGENT.md pattern, skill format, folder structure, and methodology create a structured ecosystem. This is sometimes confused with lock-in, but it's the opposite:

- **The conventions are files.** AGENT.md is markdown. Skills are markdown. Folder structure is folders. Everything is human-readable and machine-readable.
- **A competitor could read everything.** If another system understood AGENT.md files, it could use everything BrainDrive wrote — because there's nothing to "export." It's already there.
- **What doesn't travel is the agent.** The Engine that *acts on* the conventions is a generic commodity component — and that's swappable behind the Gateway API contract.

The honest framing: **you own your files AND the organization, because the organization is also files.**

### 3. Expertise Considerations

The Engine's language becomes a team working language. The V1 Engine is TypeScript (~2000 lines), which is the best match for AI agent effectiveness and developer availability. If the Engine is ever swapped for an off-the-shelf alternative, the language may change — but this is a team capability consideration, not lock-in.

---

## Summary Matrix

| Component | Architectural Lock-In | Discipline Required | If Discipline Lapses |
|-----------|----------------------|--------------------|--------------------|
| **Memory** | Zero | Define version history contract before evolving past Git | Version history migration gets messy |
| **Engine** | Zero | Keep generic (D39) — zero BrainDrive-specific logic | Swap cost grows from days to weeks |
| **Interface** | Zero | Maintain thin client — no cached state or business logic | Interface becomes harder to replace or multiply |
| **Intelligence** | Zero | Fallback path, test against 2+ models, pin versions | Single point of failure if OpenRouter goes down |
| **Tools** | Zero | Track MCP versions, budget for updates | MCP version migration surprises |
| **Auth** | Zero | Design early, permission schema with future roles | Rework cost if bolted on last |
| **Gateway API** | Zero (we own it) | Design independently of current Engine | API becomes Engine-specific wrapper |

**Every component: zero architectural lock-in.** The architecture delivers on its promise.

**The only risk is implementation drift** — letting the Engine accumulate BrainDrive-specific logic (violating D39), letting the interface accumulate state, letting the Gateway API shape itself around one Engine. The disciplines below prevent that drift.

---

## Implementation Disciplines for Build Plan

### Must-Maintain (During V1 Build)

| # | Discipline | What It Protects | Component |
|---|-----------|-----------------|-----------|
| 1 | **Design the Gateway API independently of the Engine** | Ensures the contract survives any Engine swap | Gateway API |
| 2 | **Keep the Engine generic (D39)** | Zero BrainDrive-specific logic — keeps swap cost at days | Engine |
| 3 | **Add an OpenRouter fallback path** | Reliability — config-level routing to at least one direct provider | Intelligence |
| 4 | **Make auth implementation decisions early** | Clean design, not bolted-on accommodation of other components | Auth |
| 5 | **Test skills against two models before launch** | Validates that model swapping actually works for BrainDrive's prompts | Intelligence |
| 6 | **Pin all external dependency versions** | Dependency manifest — Vercel AI SDK, MCP spec, OpenRouter API | Cross-cutting |
| 7 | **Enforce "thin client" as an architectural rule** | Interface stays portable and multipliable | Interface |

### Should-Maintain (V1.1 or Ongoing)

| # | Discipline | What It Protects | Component |
|---|-----------|-----------------|-----------|
| 8 | **Version the Gateway API metadata schema** | Multiple clients can negotiate capabilities | Gateway |
| 9 | **Define abstract version history contract** | Clean migration path if memory evolves past Git | Memory |
| 10 | **Monitor MCP spec changes** | Smooth version updates, no surprises | Tools |
| 11 | **Document the Engine integration surface** | Swap checklist — every point where Gateway and tools connect to Engine | Engine |

---

## Conclusion

The foundation architecture is designed for zero lock-in at every layer. This analysis confirms that claim holds:

- **Memory** is fully portable — files AND organization, because the organization is also files.
- **Tools** use an open standard (MCP) with Linux Foundation governance and massive adoption.
- **Intelligence** is a config change — models, routers, and providers are all swappable.
- **Interface** talks to a contract, not an implementation. Replace or multiply freely.
- **Engine** is a generic commodity component (~2000 lines). Swap the whole thing.
- **Auth** is at the edge, decoupled from everything.

There is no vendor lock-in, no data lock-in, no protocol lock-in, no convention lock-in, and no contract lock-in. Even the contracts themselves are swappable — adapters (D139) sit between each contract and the components on either side, absorbing standard changes. The full swappability chain: Memory via tools, components via contracts, contracts via adapters. The only risk is letting the implementation drift from the design — Engine accumulating BrainDrive-specific logic, interface accumulating state, Gateway API shaped around one Engine. The seven disciplines above prevent that drift.

**Bottom line:** The architecture delivers what it promises. Build with confidence, maintain the disciplines, and every component stays swappable at every point in the future.

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| `foundation-spec.md` | The architecture being analyzed |
| `engine-evaluation.md` | Engine candidates and their specific characteristics (BrainDrive Library) |
| Pivot spec (BrainDrive Library) | Pivot rationale — why this architecture was chosen |
| `adapter-spec.md` | How contracts are made swappable via adapters (D139) |
| Decisions log (BrainDrive Library) | D1-D139 — decisions that shaped the architecture |

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-02-21 | Reframed: zero lock-in by design, risks are implementation discipline not architectural | Dave W review — conventions are files, not metadata |
| 2026-02-21 | Initial lock-in analysis created | Foundation spec review + harness evaluation findings |
| 2026-02-23 | Terminology alignment — Harness→Engine, Harness API→Gateway API, OpenCode→Build Our Own, updated disciplines to reference D39/D40 | Cross-doc alignment audit (Dave W + Claude) |
| 2026-02-27 | D139 propagated — adapter pattern closes contract lock-in gap. Added contract swappability subsection to Connector Analysis, updated core argument, conclusion, related documents | D139 propagation (Dave W + Claude) |
