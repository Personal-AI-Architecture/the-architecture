---
sidebar_label: Model API
hide_table_of_contents: true
---

# Models

**Serves stories:** US-5 in the [PAA spec](../spec/personal-ai-architecture-spec.md).

## What models are

The AI model is the intelligence in your AI system. It reads what you ask, works out what needs to be done, and delivers the result.

In most AI products, the model and the product come as a package. ChatGPT runs OpenAI's models and Gemini runs Google's. If a better model comes out somewhere else, your conversations and preferences don't come with you.

We think that's the wrong approach. Models are the fastest-changing part of AI. New ones arrive every few months from many companies, and some now run on your own computer. Tie your memory to one product's models, and you're stuck with that product's pace, prices and rules.

So in PAA, the model isn't part of the system. The system doesn't contain a model; it calls one. Your Memory stays where it is, and the intelligence comes from whichever model you choose.

That gives you a choice for every situation. Use the most powerful cloud model when you want the best results. Use a model on your own hardware when you want what you ask to stay on your own machine. Use different models for different tasks. When you switch, Your Memory, your conversations and your tools come with you. The fastest-changing part of AI becomes the cheapest thing to change.

<p align="center">
  <img src="../assets/readme-hero.svg" alt="Your Memory (conversations, preferences, skills, agent instructions and tool connections, in files you own) stays under your control, while models, interfaces and tools can be swapped freely." width="680" />
</p>

## How it works

This works because every model the system uses follows the same basic exchange: a request goes in, a reply comes back. Models differ in what they can do, but the rest of the system reaches them all the same way.

- **The request** contains your instructions, the conversation so far, and the tools the model can use. The model can use those tools to read anything else it needs from Your Memory.
- **The reply** streams back as text, requests to use tools, or both. The Agent Loop runs the tools and sends the results back to the model.

The Model API defines that exchange. A small adapter translates it into each provider's own format, so a cloud model and a local model look the same to the rest of the system. A model running on your own computer is still outside the system in this sense: the system reaches it through the Model API, the same way it reaches a cloud model.

**Choosing a model:** your choice of model is a preference saved in Your Memory. On every message, the Gateway reads that preference and passes it along, and the Agent Loop sends the request to that model. If you change the preference, your next message goes to the new model, with no restart.

**Changing providers:** if the adapter's config already lists the provider as a profile, switching to it is a preference in Your Memory beside the model: the Gateway reads it on every message, so your next message uses it, with no restart. A provider in a new format, such as a model running locally on your computer, means installing that provider's adapter and giving it the provider's connection details. Any API key is kept separately as a secret, never in Your Memory. That change may need a restart.

**What the Model API doesn't do:** it only carries the exchange between the Agent Loop and the model. It doesn't decide:

- what goes into the request (the Gateway brings the conversation, the Agent Loop adds its instructions and tools, and the model reads anything else it needs)
- which tools to use (the model decides)
- where the reply is saved (the Gateway)

**Models differ:** some can read images and some can't, and some can hold more of a conversation at once than others. When the chosen model can't do something a request needs, the system says so. It doesn't fake the result or quietly switch to a different model.

**Why the model isn't a tool:** the model is what decides which tools to use, so it can't be one of them itself. Once it's running, though, it can hand a smaller job, such as a quick summary, to a second model, and that second model is used like a tool.

The rest of this doc is the specification: what any implementation of model access must do.

---

## What counts as a model

A model is external intelligence. The system calls it through the Model API; it doesn't contain one. Models are not one of the four components (Your Memory, Agent Loop, Gateway, Auth), and no component may depend on a particular model or provider. The case for keeping models outside, rather than making them a component or a tool, is in [memory-tool-completeness.md](./background/memory-tool-completeness.md) §2.

A model is external wherever it runs:

| Where the model runs | How the system reaches it |
|---|---|
| A cloud provider | Through the Model API, over the network |
| Your own hardware (for example Ollama) | Through the Model API, at a local endpoint. The weights are a third party's, running locally. |
| Future forms (on-device, embedded) | Through the Model API |

**The primary model is not a tool.** The model chosen for a request is what decides which tools to use, so calling it cannot itself be a tool (D108). Once running, it may call a second model as a tool for a smaller job; that second model is reached like any other tool.

## What the system guarantees about models

| Guarantee | What it means |
|---|---|
| **One way in** | Every model is reached through the Model API, through an adapter. Provider-specific formats stay in the adapter, never in the Agent Loop or Gateway. |
| **Switching models is a preference** | The model is an owner preference in Your Memory (a product default until the owner changes it). The Gateway reads it on every message and passes it with the request, so a change takes effect on the next message, with no restart and no code change. If no model has been chosen, by a product default or the owner, the system reports it rather than picking one. |
| **Switching providers is a preference too** | An adapter config can list several provider profiles. Which one is active is an owner preference beside the model, read on every message, so switching provider takes effect on the next message with no restart (D193). Adding a provider in a new format means installing a new adapter: a configuration change that never touches component code, and a restart is allowed. |
| **Missing abilities are reported, not faked** | Models differ: one reads images and another doesn't, one supports tool calls and another doesn't, context windows differ. Switching models does not promise identical abilities. When the chosen model can't do something a request needs, or isn't available through the loaded adapter, that is reported to the Agent Loop and through it to the owner. The system must not silently drop content, pretend a tool was called, or quietly substitute another model. |
| **The provider is the owner's choice** | The provider is only ever a product default or the owner's choice, kept where the owner can read it, and it is never changed without the owner. |

## How the Agent Loop reaches a model

The Model API is one of the system's two APIs. It carries one exchange:

| Direction | What flows |
|---|---|
| **Agent Loop → model** | The model to use, the provider profile to call, system instructions, the conversation, and the tool definitions available for this turn |
| **Model → Agent Loop** | A streamed completion: text, tool calls, or both |

The exchange is the same whichever model or provider is behind it. An adapter translates it to and from the provider's own format. See [adapter-spec.md](./adapter-spec.md) §How Model Configuration Works in Practice for the walkthrough of model and provider changes.

The Model API only carries the exchange. It doesn't decide what goes into the request (the Gateway brings the conversation, the Agent Loop adds its instructions and tool definitions, and the model reads anything else it needs through tools), which tools to use (the model), or where the reply is saved (the Gateway).

## What reaches the model provider

Each request sends the instructions, the conversation and the Memory content the model read to the model's provider. That is why the provider must be the owner's choice (above), and why a model on the owner's own hardware is the option for keeping that content on their machine. Every saved reply records the model and provider that produced it, so the owner can see afterwards which model and provider profile produced each saved reply (D194). See [security-spec.md](./security-spec.md) §Model Provider Data Flow.

## Errors

| Situation | What happens |
|---|---|
| The chosen model lacks an ability the request needs | Reported, not faked (above). GAP-PAA-27 proposes the `capability_unsupported` code. |
| The chosen model isn't available through the loaded adapter, or none is chosen | Reported; no other model is substituted. GAP-PAA-27 proposes the `model_unavailable` code. |
| The request is too large for the model's context window | Reported as `context_overflow`. The proposed GAP-PAA-20 rule has the Gateway select bounded saved history and the Agent Loop check each actual call, including live tool results. An unknown safe limit reports `context_limit_unknown`. |
| The provider is down or times out | Reported as `provider_error`, and the current turn stops. No other provider or model is substituted; PAA defines no fallback model (D188). The owner can switch provider and try again. |

## How model access grows

- **A model the loaded adapter already supports** needs nothing new: the owner picks it.
- **A new provider in a format an existing adapter speaks** is adapter configuration.
- **A new provider format** is a new adapter. Nothing else in the system changes.
- **New model abilities** reach the system through the same exchange; abilities that act on the world arrive as tools.

## Checking an implementation

- [ ] Models are reached only through the Model API; no component depends on a specific model or provider
- [ ] Provider-specific request formatting lives in the adapter, not the Agent Loop or Gateway
- [ ] Changing the model preference takes effect on the next message, with no restart and no code change
- [ ] With no model chosen, the system reports it rather than picking one
- [ ] Switching to another provider profile in the loaded adapter takes effect on the next message, with no restart and no code change
- [ ] Adding a provider in a new format changes only the adapter, its config, the startup config and the API key secret
- [ ] A provider failure is reported and stops the turn; no other provider or model is substituted
- [ ] *(security)* Every saved assistant reply records the model and provider that produced it
- [ ] Local and cloud models go through the same Model API
- [ ] A request needing an ability the chosen model lacks is reported: no content silently dropped, no tool call pretended, no model quietly substituted
- [ ] *(security)* The provider is only a product default or the owner's choice, readable by the owner, and never changed without the owner
- [ ] *(security)* API keys are supplied as secrets, never stored in Your Memory
- [ ] The Gateway and Agent Loop use the same safe limit for the active provider profile and model; unknown limits and overflows are reported without silent truncation

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| D44 | Your Memory + Model = the brain — neither is complete alone | Your Memory is the persistent half (stored patterns, knowledge, skills). The model is the intelligence half. The brain reconstitutes every time — the model arrives fresh and reads Your Memory to become capable. |
| D63 | Models are not a component — they are external intelligence accessed through the Model API | Every model-related concern maps to existing components or configuration: provider routing (Agent Loop implementation), API keys (configuration/Auth), model selection (configuration), provider failure reporting (Agent Loop), and context window awareness (Gateway working-context selection plus Agent Loop call checks, with optional Model API limit metadata). No dedicated Models component is needed. The system calls a model. It doesn't contain one. |
| D64 | The system has four components, two APIs, and three external dependencies | The six component interviews resolved the architecture. Four components (Your Memory, Agent Loop, Auth, Gateway), two APIs (Gateway API, Model API), three external dependencies (Clients, Models, Tools). What started as six components and three APIs simplified as each interview revealed concerns mapping to existing components. |
| D108 | Model API must remain an API, not a tool | Intelligence is a requirement — the model decides which tools to use, so "call the model" can't itself be a tool (circular dependency). Sub-agents are the exception: the primary model can delegate to a secondary model as a tool. |
| D135 | Memory/tool binary — if it's data, it's memory; if it's not data, it's a tool | Models conceptually decompose (weights = memory, inference = tool) but are elevated to an external dependency because swappable intelligence needs a clean boundary, and storage is not computation. |

## Contract alignment

The canonical contract tree under `contracts/` is authoritative for the model-facing
payloads and the internal request handoff. The Agent Loop receives the selected model
through `AgentLoopRequest.model`; Model API requests require `stream: true`, and every
completion event carries an `_event_type` discriminator. Capability reporting has no
defined error codes yet (GAP-PAA-27). Tool definitions supplied to
the Model API use canonical source provenance and visibility/authorization markers;
the model must preserve source_id on emitted tool calls. Optional generation settings such as `max_tokens` and
`temperature` use the provider's defaults unless a caller sets them; who sets them is an
implementation choice.
