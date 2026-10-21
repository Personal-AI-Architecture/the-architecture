---
sidebar_label: Model API
hide_table_of_contents: true
---

# Models: External Intelligence

**Serves stories:** US-5 in the [PAA spec](../spec/personal-ai-architecture-spec.md).

Every AI system uses a model — ChatGPT runs GPT, Copilot runs its own models, agent frameworks wire up whatever LLM the developer chooses. So what's different here?

Nothing about how the model is used. What's different is where it sits in the architecture. **Models are not a component of the system — they are external intelligence accessed through the Model API.** The system doesn't contain a model. It calls one. The system has four components (Your Memory, Agent Loop, Auth, Gateway). Models aren't one of them.

In the human analogy that runs through this architecture: Memory is the persistent half of the brain. The model is the other half — the intelligence, the reasoning, the processing. Memory + Model = the brain (D44). Neither is complete alone. Memory without the model is a filing cabinet nobody's reading. The model without memory is a genius with amnesia.

But unlike a human brain, a digital brain can separate memory from intelligence — and that changes everything. In a biological brain, your memory and your intelligence are fused to the same hardware. You can't upgrade your neurons. You can't swap in better reasoning. You're stuck with both. A digital brain doesn't have that constraint. Your Memory persists as the platform. Intelligence arrives fresh through the Model API — a clean boundary that makes the model pluggable. Different models for different tasks, from any provider, swapped with a config change. The brain reconstitutes from the same Memory with upgraded intelligence every time a better model ships.

This is the superpower a digital brain has over a biological one, and it's why the architecture treats models as external intelligence rather than a component. The Model API is the mechanism that makes it real. Models are the most volatile part of AI — new capabilities, new providers, new paradigms arrive constantly. The fastest-changing part of AI is the cheapest thing to change in this system.

Models are external regardless of where they run:

| Model location | How the system calls it | External? |
|---------------|------------------------|-----------|
| Cloud API (OpenRouter, Anthropic, OpenAI) | HTTPS request through Model API | Yes — someone else's servers |
| Local (Ollama on your machine) | HTTP request through Model API | Yes — same interface, different endpoint. The model is third-party weights running locally. |
| Future (on-device, embedded) | Through Model API | Yes — the calling pattern is the same |

This is an **Architecture spec** — it defines what models are at the generic, unopinionated level. Product-specific model choices (OpenRouter default, single-model V1, pricing/allowances) are implementation opinions.

**Related documents:** [overview.md](../architecture/overview.md) (architecture overview, links to all component specs), [memory-tool-completeness.md](./background/memory-tool-completeness.md) (completeness proof — why the architecture needs no new components)

---

## The Model API

The Model API is one of the system's two APIs. It defines how the Agent Loop calls models:

| Direction | What flows |
|-----------|-----------|
| **Agent Loop → Model** | Prompt (system instructions + conversation history + tool definitions + context) |
| **Model → Agent Loop** | Streamed completion (text + tool calls) |

Prompts in, completions out. The pattern is the same regardless of which model, which provider, or what capabilities the model has. Provider-specific API formats are abstracted behind the adapter — a thin translation layer between the Agent Loop's internal interface and whatever format the provider expects. Switching models is a preference change that applies to the next message; switching providers is a config change plus an adapter swap. See [adapter-spec.md](../architecture/adapter-spec.md) §How Model Configuration Works in Practice for the concrete walkthrough.

The Model API is a pass-through — it doesn't decide what goes into the prompt (Your Memory provides instructions and context), which tools to use (the model decides), or where responses are stored (Gateway manages conversations). It connects the Agent Loop to whatever model is configured.

### Switching models

The model travels with each request. The Gateway reads the owner's current model preference on every message and passes it to the Agent Loop, which names it in the Model API call. So when the owner's model preference changes, the next message uses the new model, with no restart and no code change.

### Capabilities a model lacks

Models are not identical. One can read images and another cannot; one supports tool calls and another does not; context windows differ. Local and cloud models go through the same Model API, but switching models does not promise identical abilities. When a request needs something the chosen model cannot do, that is reported to the Agent Loop (and through it to the owner), not faked: the system must not silently drop an image, pretend a tool was called, or quietly substitute a different model.

---

## Why Models Are Not a Component

Every model-related concern maps to an existing component or configuration:

| Concern | Where it lives | Why not a Models component |
|---------|---------------|---------------------------|
| Which model to call (including per-task selection) | The owner's model preference, passed with each request | A preference, not a component |
| Provider routing (OpenRouter vs Anthropic vs Ollama) | Agent Loop implementation or SDK | How the Agent Loop calls models is an implementation detail |
| Fallback if a provider is down | Agent Loop implementation | Error handling is the Agent Loop's job |
| Context window awareness | Agent Loop or Model API | The Agent Loop knows the limits of what it's calling |

Nothing is left over. There is no gap that requires a dedicated component.

This follows the same pattern as Tools (D51) and Client (D57). Tools dissolved into Memory + Agent Loop + Auth. Client dissolved into Gateway + external clients. Models dissolves into the Model API + Agent Loop implementation + configuration. No operational concern requires a dedicated component.

But there's a harder question the architecture needs to answer.

---

## Why Models Don't Dissolve Into Memory + Tools

The memory/tool binary says everything the system processes is either data (memory) or an operation (tool). Three proposed components were tested against this during the architecture interviews. Tools dissolved into Memory + Agent Loop + Auth. Client dissolved into Gateway + external clients. Why don't models dissolve the same way?

Conceptually, they do. Weights are the provider's memory — trained knowledge stored as parameters. Inference is a verb — the operation of generating a response. Noun and verb. The model decomposes.

But the architecture elevates it to an external dependency with its own API anyway. Three reasons.

### Swappable intelligence needs its own boundary

If models dissolved into memory + tools, model access would flow through whatever internal mechanism the Agent Loop uses for tool execution — coupling it to Agent Loop implementation details. The Model API exists as a clean, swappable boundary separate from tool execution. That's what makes "swap your intelligence" a config change instead of a rebuild.

### Storage is not computation

Weights are data — store them wherever you want. But running inference isn't a storage operation. Memory's interface is read, write, search, version — data operations. Inference is fundamentally different: take a prompt, apply learned patterns across billions of parameters, generate a response token by token. Putting inference inside Memory would add an execution capability to a data substrate. Memory would need to know how to *run* a model, not just *store* one.

Memory is inert. It sits there and waits to be read. The model is the opposite — it tells the Agent Loop what to do, decides which tools to call, what to read, what to write. It's an active participant in the execution loop, not a passive data store being accessed.

### The sibling exception

Auth is the other thing the binary doesn't fully dissolve. Auth's data (policies, tokens) is memory. Auth's operations (enforcement, validation) are tools. It decomposes cleanly — but exists as a component anyway, because security can't depend on swappable intelligence. Swap to a weaker model, and your security breaks.

Both exceptions trace to the same root: making intelligence swappable. The Model needs its own API so you *can* swap it. Auth needs independence so swapping it doesn't *break* security. One cause, two consequences. See [memory-tool-completeness.md](./background/memory-tool-completeness.md) §2 for the full argument.

---

## Why the Model API Is a Contract, Not a Tool

The primary model can't be a tool — it *is* the intelligence making tool decisions. Tools are things the model decides to use. If "call the model" were itself a tool, you'd have a bootstrap problem: who decides to call it? You need intelligence to make tool decisions. You can't use a tool to call the thing that decides which tools to use.

**The exception: sub-agents.** Once a primary model is running, it can call a secondary model as a tool — cheap classification, summarization, a specialized task. The primary intelligence delegates, the way your brain can delegate a task to someone else. But the primary intelligence itself is not a tool. It's the thing doing the delegating.

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D44 | Your Memory + Model = the brain — neither is complete alone | Your Memory is the persistent half (stored patterns, knowledge, skills). The model is the intelligence half. The brain reconstitutes every time — the model arrives fresh and reads Your Memory to become capable. |
| D63 | Models are not a component — they are external intelligence accessed through the Model API | Every model-related concern maps to existing components or configuration: provider routing (Agent Loop implementation), API keys (configuration/Auth), model selection (configuration), fallback (Agent Loop), context window awareness (Agent Loop/Model API). There is no gap. The system calls a model. It doesn't contain one. |
| D64 | The system has four components, two APIs, and three external dependencies | The six component interviews resolved the architecture. Four components (Your Memory, Agent Loop, Auth, Gateway), two APIs (Gateway API, Model API), three external dependencies (Clients, Models, Tools). What started as six components and three APIs simplified as each interview revealed concerns mapping to existing components. |
| D108 | Model API must remain an API, not a tool | Intelligence is a requirement — the model decides which tools to use, so "call the model" can't itself be a tool (circular dependency). Sub-agents are the exception: the primary model can delegate to a secondary model as a tool. |
| D135 | Memory/tool binary — if it's data, it's memory; if it's not data, it's a tool | Models conceptually decompose (weights = memory, inference = tool) but are elevated to an external dependency because swappable intelligence needs a clean boundary, and storage is not computation. |

---

## Open Questions

None. Models is the thinnest spec because models are the most external thing in the system. The Model API handles the connection. Configuration handles the choices. The Agent Loop handles the calling. There's nothing else to define.

---

## Success Criteria

- [ ] Models are accessed exclusively through the Model API — no component depends on a specific model
- [ ] Switching models requires only a preference change — no code changes to Agent Loop, Your Memory, Auth, Gateway, or any client
- [ ] When the model preference changes, the next message uses the new model with no restart
- [ ] The system works with any model that accepts prompts and returns completions — cloud, local, future
- [ ] Capabilities a model lacks are reported, not faked — switching models does not promise identical abilities
- [ ] Local models (Ollama) and cloud models (OpenRouter) go through the same Model API

---

## Contract alignment

The canonical contract tree under `contracts/` is authoritative for the model-facing
payloads and the internal request handoff. The Agent Loop receives the selected model
through `AgentLoopRequest.model`; Model API requests require `stream: true`, and every
completion event carries an `_event_type` discriminator. Capability reporting remains
an implementation and future contract-extension concern. Tool definitions supplied to
the Model API use canonical source provenance and visibility/authorization markers;
the model must preserve source_id on emitted tool calls.

---

*Models are the most volatile part of AI and the most swappable part of this system. That's not a coincidence — it's the architecture working as designed. The thing that changes fastest in AI is the cheapest thing to change here. Your Memory persists. Models come and go. The brain reconstitutes every time.*
