---
hide_table_of_contents: true
---

# Models: External Intelligence

Every AI system uses a model — ChatGPT runs GPT, Copilot runs its own models, agent frameworks wire up whatever LLM the developer chooses. So what's different here?

Nothing about how the model is used. What's different is where it sits in the architecture. **Models are not a component of the system — they are external intelligence accessed through the Provider API.** The system doesn't contain a model. It calls one. The system has four components (Your Memory, Engine, Auth, Gateway). Models aren't one of them.

In the human analogy that runs through this architecture: Memory is the persistent half of the brain. The model is the other half — the intelligence, the reasoning, the processing. Memory + Model = the brain (D44). Neither is complete alone. Memory without the model is a filing cabinet nobody's reading. The model without memory is a genius with amnesia.

But unlike a human brain, a digital brain can separate memory from intelligence — and that changes everything. In a biological brain, your memory and your intelligence are fused to the same hardware. You can't upgrade your neurons. You can't swap in better reasoning. You're stuck with both. A digital brain doesn't have that constraint. Your Memory persists as the platform. Intelligence arrives fresh through the Provider API — a clean boundary that makes the model pluggable. Different models for different tasks, from any provider, swapped with a config change. The brain reconstitutes from the same Memory with upgraded intelligence every time a better model ships.

This is the superpower a digital brain has over a biological one, and it's why the architecture treats models as external intelligence rather than a component. The Provider API is the mechanism that makes it real. Models are the most volatile part of AI — new capabilities, new providers, new paradigms arrive constantly. The fastest-changing part of AI is the cheapest thing to change in this system.

Models are external regardless of where they run:

| Model location | How the system calls it | External? |
|---------------|------------------------|-----------|
| Cloud API (OpenRouter, Anthropic, OpenAI) | HTTPS request through Provider API | Yes — someone else's servers |
| Local (Ollama on your machine) | HTTP request through Provider API | Yes — same interface, different endpoint. The model is third-party weights running locally. |
| Future (on-device, embedded) | Through Provider API | Yes — the calling pattern is the same |

This is a **Level 1 (Foundation) spec** — it defines what models are at the generic, unopinionated level. Product-specific model choices (OpenRouter default, single-model V1, pricing/allowances) are Level 2 (Product) opinions.

**Related documents:** `foundation-spec.md` (architecture overview, links to all component specs), `research/memory-tool-completeness.md` (completeness proof — why the architecture needs no new components)

---

## The Provider API

The Provider API is one of the system's two connectors. It defines how the Engine calls models:

| Direction | What flows |
|-----------|-----------|
| **Engine → Model** | Prompt (system instructions + conversation history + tool definitions + context) |
| **Model → Engine** | Streamed completion (text + tool calls) |

Prompts in, completions out. The pattern is the same regardless of which model, which provider, or what capabilities the model has. Provider-specific API formats are abstracted behind the adapter — a thin translation layer between the Engine's internal interface and whatever format the provider expects. Switching models is a config change; switching providers is a config change plus an adapter swap. See `adapter-spec.md` §How Model Configuration Works in Practice for the concrete walkthrough.

The Provider API is a pass-through — it doesn't decide what goes into the prompt (Your Memory provides instructions and context), which tools to use (the model decides), or where responses are stored (Gateway manages conversations). It connects the Engine to whatever model is configured.

---

## Why Models Are Not a Component

Every model-related concern maps to an existing component or configuration:

| Concern | Where it lives | Why not a Models component |
|---------|---------------|---------------------------|
| Which model to call (including per-task selection) | Configuration | A config value, not a component |
| Provider routing (OpenRouter vs Anthropic vs Ollama) | Engine implementation or SDK | How the Engine calls models is an implementation detail |
| Fallback if a provider is down | Engine implementation | Error handling is the Engine's job |
| Context window awareness | Engine or Provider API | The Engine knows the limits of what it's calling |

Nothing is left over. There is no gap that requires a dedicated component.

This follows the same pattern as Tools (D51) and Client (D57). Tools dissolved into Memory + Engine + Auth. Client dissolved into Gateway + external clients. Models dissolves into the Provider API + Engine implementation + configuration. No operational concern requires a dedicated component.

But there's a harder question the architecture needs to answer.

---

## Why Models Don't Dissolve Into Memory + Tools

The memory/tool binary says everything the system processes is either data (memory) or an operation (tool). Three proposed components were tested against this during the architecture interviews. Tools dissolved into Memory + Engine + Auth. Client dissolved into Gateway + external clients. Why don't models dissolve the same way?

Conceptually, they do. Weights are the provider's memory — trained knowledge stored as parameters. Inference is a verb — the operation of generating a response. Noun and verb. The model decomposes.

But the architecture elevates it to an external dependency with its own connector anyway. Three reasons.

### Swappable intelligence needs its own boundary

If models dissolved into memory + tools, model access would flow through whatever internal mechanism the Engine uses for tool execution — coupling it to Engine implementation details. The Provider API exists as a clean, swappable boundary separate from tool execution. That's what makes "swap your intelligence" a config change instead of a rebuild.

### Storage is not computation

Weights are data — store them wherever you want. But running inference isn't a storage operation. Memory's interface is read, write, search, version — data operations. Inference is fundamentally different: take a prompt, apply learned patterns across billions of parameters, generate a response token by token. Putting inference inside Memory would add an execution capability to a data substrate. Memory would need to know how to *run* a model, not just *store* one.

Memory is inert. It sits there and waits to be read. The model is the opposite — it tells the Engine what to do, decides which tools to call, what to read, what to write. It's an active participant in the execution loop, not a passive data store being accessed.

### The sibling exception

Auth is the other thing the binary doesn't fully dissolve. Auth's data (policies, tokens) is memory. Auth's operations (enforcement, validation) are tools. It decomposes cleanly — but exists as a component anyway, because security can't depend on swappable intelligence. Swap to a weaker model, and your security breaks.

Both exceptions trace to the same root: making intelligence swappable. The Model needs its own connector so you *can* swap it. Auth needs independence so swapping it doesn't *break* security. One cause, two consequences. See `research/memory-tool-completeness.md` §2 for the full argument.

---

## Why the Provider API Is a Connector, Not a Tool

The primary model can't be a tool — it *is* the intelligence making tool decisions. Tools are things the model decides to use. If "call the model" were itself a tool, you'd have a bootstrap problem: who decides to call it? You need intelligence to make tool decisions. You can't use a tool to call the thing that decides which tools to use.

**The exception: sub-agents.** Once a primary model is running, it can call a secondary model as a tool — cheap classification, summarization, a specialized task. The primary intelligence delegates, the way your brain can delegate a task to someone else. But the primary intelligence itself is not a tool. It's the thing doing the delegating.

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D44 | Your Memory + Model = the brain — neither is complete alone | Your Memory is the persistent half (stored patterns, knowledge, skills). The model is the intelligence half. The brain reconstitutes every time — the model arrives fresh and reads Your Memory to become capable. |
| D63 | Models are not a component — they are external intelligence accessed through the Provider API | Every model-related concern maps to existing components or configuration: provider routing (Engine implementation), API keys (configuration/Auth), model selection (configuration), fallback (Engine), context window awareness (Engine/Provider API). There is no gap. The system calls a model. It doesn't contain one. |
| D64 | The system has four components, two connectors, and three external dependencies | The six component interviews resolved the architecture. Four components (Your Memory, Engine, Auth, Gateway), two connectors (Gateway API, Provider API), three external dependencies (Clients, Models, Tools). What started as six components and three connectors simplified as each interview revealed concerns mapping to existing components. |
| D108 | Provider API must remain a connector, not a tool | Intelligence is a requirement — the model decides which tools to use, so "call the model" can't itself be a tool (circular dependency). Sub-agents are the exception: the primary model can delegate to a secondary model as a tool. |
| D135 | Memory/tool binary — if it's data, it's memory; if it's not data, it's a tool | Models conceptually decompose (weights = memory, inference = tool) but are elevated to an external dependency because swappable intelligence needs a clean boundary, and storage is not computation. |

---

## Open Questions

None. Models is the thinnest spec because models are the most external thing in the system. The Provider API handles the connection. Configuration handles the choices. The Engine handles the calling. There's nothing else to define.

---

## Success Criteria

- [ ] Models are accessed exclusively through the Provider API — no component depends on a specific model
- [ ] Switching models requires only a configuration change — no code changes to Engine, Your Memory, Auth, Gateway, or any client
- [ ] The system works with any model that accepts prompts and returns completions — cloud, local, future
- [ ] The Provider API absorbs model evolution — new capabilities, new providers, new paradigms are configuration changes
- [ ] Local models (Ollama) and cloud models (OpenRouter) are interchangeable from the Engine's perspective

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-01 | Conciseness pass: 193→147 lines (~24%). Removed "Brain Reconstitutes" section (absorbed by intro). Collapsed Provider API subsections to two paragraphs. Not-a-Component table 8→4 rows. "Swappable intelligence" collapsed to coupling argument. "Connector Not Tool" leads with circular dependency. Source provenance removed. | Dave W + Claude |
| 2026-03-01 | Intro reshaped: biological vs digital brain argument integrated into "How we define models." Split brain analogy paragraph, added digital brain separation insight (biological brain fuses memory+intelligence, digital brain separates them via Provider API). Same length, stronger argument chain. | Dave W + Claude |
| 2026-03-01 | Reordered: Provider API definition moved before "Why" sections. "Why the Provider API Is a Connector, Not a Tool" promoted to standalone section. Reader now understands what the Provider API is before reading why it needs to exist. | Dave W + Claude |
| 2026-03-01 | Added "Why Models Don't Dissolve Into Memory + Tools" — binary decomposition (weights = memory, inference = tool), swappable intelligence boundary, storage vs computation, ownership case, Auth as sibling exception. D135 added to Decisions Made. Completeness doc added to Related Documents. | Dave W + Claude |
| 2026-02-27 | Reordered sections (why → what → how → reference). Merged "What This Document Is", "What Is a Model?", and "Models Are External" into single "How we define models" opener. Collapsed related docs table to single line. Removed "Impact on the Architecture" section (redundant with foundation-spec.md). Removed "Level 1/2/3 Distinction" section (Level 1 note in opener). | Spec reorder + trim (Dave W + Claude) |
| 2026-02-23 | Initial Models spec created from interview — established that Models is external intelligence, not a component. Final architecture resolved: 4 components, 2 connectors, 3 external dependencies. | Models interview session (Dave W + Claude) |
| 2026-02-25 | Added "Why the Provider API is a connector, not a tool" — circular dependency argument, model-calls-model exception. | Foundation architecture deep dive (Dave W + Dave J) |
| 2026-02-26 | Rewrote Provider API section — lead with brain analogy (intelligence is a requirement, swappable is the difference), sub-agents as when intelligence becomes a tool, circular dependency as technical confirmation. | Dave W reframing session |

---

*Models are the most volatile part of AI and the most swappable part of this system. That's not a coincidence — it's the architecture working as designed. The thing that changes fastest in AI is the cheapest thing to change here. Your Memory persists. Models come and go. The brain reconstitutes every time.*
