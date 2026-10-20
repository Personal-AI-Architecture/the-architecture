---
displayed_sidebar: architectureSidebar
hide_table_of_contents: true
---

# Architecture Overview

**Own your AI.** The Personal AI Architecture is a blueprint for building personal AI systems that you own and control.

It does not ship a product. It defines the parts of a personal AI system, and the rules that keep you from being locked into a vendor, a technology, or even this architecture itself. It also provides examples and templates you can use to build your own.

<p align="center">
  <img src="../assets/readme-hero.svg" alt="Your Memory (conversations, preferences, skills, documents and more, in files you own) stays under your control, while models, interfaces and tools can be swapped freely." width="680" />
</p>

We will soon rely on personal AI systems to help us in all areas of our lives.

We should own those systems, so we can always ensure they are working with our best interests in mind, and so the immense wealth created by the AI revolution can flow far and wide, instead of being concentrated in a few Big Tech platforms.

## How it works, in six steps

### 1. Make Your Memory the platform

Your Memory is more than your conversation history. It's also your files, preferences, skills, and connections to tools and agents. In other words, Your Memory is what makes a personal AI system personal.

So if you want to own your AI system, you must own Your Memory. That means Your Memory is never locked into a company or a technology choice. You should be able to use Your Memory in any AI system, change between them, and take Your Memory with you when you do.

In traditional software, Your Memory cannot be separated from the code that powers it. With AI, this is no longer the case. We can now separate Your Memory from the intelligence and tools that power it.

We can get rid of the Big Tech platforms, and make Your Memory the platform instead.

<p align="center">
  <img src="../assets/memory-is-the-platform.svg" alt="Today's AI apps: Your Memory is locked inside the app with its models, interfaces and tools, so leaving the app means losing your memory. With PAA: Your Memory is the platform, in files you own, and models, interfaces and tools plug into it, so you can swap anything and your memory stays." width="860" />
</p>

Once Your Memory is the platform, you can own it. All other components of your AI system can plug into it, and become swappable components. Your Memory persists when everything else is swapped, upgraded, or removed, and stays readable with standard tools (a text editor, a file browser, a database viewer) even when the system isn't running.

See [memory-spec.md](./memory-spec.md) and [memory-as-platform.md](./memory-as-platform.md).

### 2. Add the AI model

In a biological brain, memory and intelligence are fused. You can't swap in better reasoning. A digital brain doesn't have that constraint. Your Memory persists, and intelligence arrives through the Model API, from any provider or your own hardware, swapped with a config change.

When you want state of the art performance, use the most powerful cloud models. When you want complete privacy, switch to local models running on your own hardware. Use different models for different tasks.

The fastest-changing part of AI, model capability, is the cheapest thing to change in this system.

See [models-spec.md](./models-spec.md).

### 3. Add the hands (the Agent Loop)

Your Memory and the models you use with it are the brain. The Agent Loop is the hands. It sends your request to the model, runs the tools the model asks for, and repeats until the job is done.

The Agent Loop is deliberately generic. Everything that makes a product unique (methodology, personality, skills, folder structure) lives in Your Memory, not in the loop. So the Agent Loop isn't part of a platform you're locked into. It's another swappable component.

See [engine-spec.md](./engine-spec.md).

### 4. Add the tools

With intelligence and hands, Your Memory becomes endlessly extensible through tools: read a file, call an API, search a library, control a browser.

New capabilities do not require adding code to a software platform. In fact, they require no software platform at all. They simply require a hand to hold them. Add a tool, and the system can do something new. The architecture doesn't change.

This works because everything the system handles is one of two things. If it's data, it's memory. If it's not data, it's a tool. Even the system's own components reach Your Memory only through tools, so storage can evolve without anything else changing.

See [tools-spec.md](./tools-spec.md) and [memory-tool-completeness.md](./memory-tool-completeness.md).

### 5. Build the open ecosystem

Property rights are the foundation of a free market, and they have been largely missing in the digital world. When individuals own their AI systems, anyone can compete to serve them: infrastructure providers, agent builders, tool creators and more. Value flows to the people who create it, instead of to a few platforms.

That is why this blueprint is open and MIT licensed. See [customization-spec.md](./customization-spec.md) for how implementations build on it.

### 6. Keep Your Memory yours

Two things must stay true for Your Memory to remain under your control:

1. **Your Memory has no outward dependencies.** Everything else depends on it, and it depends on nothing.
2. **Everything else stays decoupled.** Swapping one component has no effect on Your Memory or on any other component.

That lets you use any model, interface or tool without losing control of Your Memory. The [architecture principles](./principles.md) turn these two rules into five, and the rest of this document shows how the parts follow them.

---

## The parts

Four components, two APIs, and three things outside the system.

<p align="center">
  <img src="../assets/readme-how-it-works.svg" alt="Interfaces connect through the Gateway API to the Gateway, which hands off to the Agent Loop. The Agent Loop calls models through the Model API and reaches Your Memory and other tools through tools. Auth checks every request." width="900" />
</p>

| Part | Kind | What it does | Spec |
|------|------|--------------|------|
| **Your Memory** | Component | All your data, in files you own. Everything else depends on it; it depends on nothing. | [memory-spec.md](./memory-spec.md) |
| **Agent Loop** | Component | Calls the model, runs the tools it asks for, and repeats until the job is done. | [engine-spec.md](./engine-spec.md) |
| **Gateway** | Component | One front door for every interface. Manages conversations and hands each message to the Agent Loop. | [gateway-spec.md](./gateway-spec.md) |
| **Auth** | Component | Controls who and what gets in. Every request passes through it. | [auth-spec.md](./auth-spec.md) |
| **Gateway API** | API | How interfaces connect. Anything that speaks it plugs in. | [gateway-api.yaml](../../specs/openapi/gateway-api.yaml) |
| **Model API** | API | How the Agent Loop reaches models. Switch providers with a config change. | [model-api.yaml](../../specs/openapi/model-api.yaml) |
| **Clients** | Outside | Any interface: web app, CLI, mobile, bot, voice. | [gateway-spec.md](./gateway-spec.md) |
| **Models** | Outside | The intelligence. The system calls a model; it doesn't contain one. | [models-spec.md](./models-spec.md) |
| **Tools** | Outside | Capabilities in the environment, described in Your Memory, run by the Agent Loop, permitted by Auth. | [tools-spec.md](./tools-spec.md) |

**Gateway.** Conversations live in the system, not in any client, so you can start on the web, continue on your phone, and pick up in a terminal. The Gateway stores and loads them through a dedicated internal tool, like any other component that needs Your Memory.

**Auth.** Auth protects Your Memory. It sits on every request, independent of the Gateway and the Agent Loop, so either can be swapped without touching it. Today the actor is usually you, but it is built for more: other people and AI agents acting on your behalf, each with exactly the permissions you grant.

### What crosses the APIs

Both APIs are deliberately thin. They pass information forward with as little opinion as possible, because the less they do, the longer they last.

| API | In | Out |
|-----|----|-----|
| **Gateway API** (clients to Gateway) | Message, optional conversation ID, metadata | Streamed response, conversation ID, message record |
| **Model API** (Agent Loop to models) | System instructions, conversation, tool definitions, context | Streamed completion: text and tool calls |

Tool calls travel through the Model API and are run by the Agent Loop. How the Agent Loop talks to tools (MCP today, something better tomorrow) is internal to the Agent Loop, so there is no third API for tools.

Between the Gateway and the Agent Loop there is one internal contract, not a third API: the Gateway posts the messages and metadata, and the Agent Loop streams back text, tool calls, results and completion. See [gateway-engine-contract.md](./gateway-engine-contract.md) and [gateway-engine.yaml](../../specs/openapi/gateway-engine.yaml).

---

## What keeps it swappable

**Adapters.** Between each API and the outside world sits an adapter, a thin translation layer you own. Your components speak a stable interface, and the adapter translates to whatever standard is current. When the standard changes, swap the adapter. New model? Config change. Better agent loop? Swap it. New client? Point it at the same API. The cost of adopting anything new is one swap, not a rebuild. See [adapter-spec.md](./adapter-spec.md).

**Communication carries, it doesn't interpret.** Inside the system, the connections between components only carry messages. Your Memory holds state, the model makes decisions, Auth controls access. When one of those jobs leaks into the communication layer, swapping it means dealing with work that doesn't belong to it. See [communication-principles.md](./communication-principles.md).

**Five principles.** Your Memory has no outbound dependencies. Keep everything else swappable. Keep responsibilities where they belong. Keep it simple enough for one developer and AI coding agents to understand and maintain. Start constrained and expand deliberately: add tools, don't change the architecture. Nothing enforces these principles, and the system still runs if you break one, but every violation is lock-in you've chosen to accept. See [principles.md](./principles.md).

**Configuration.** Preferences live in Your Memory. The system starts from a thin runtime config, and tools describe themselves. See [configuration-spec.md](./configuration-spec.md).

---

## Runs on your own hardware

If you can't run the system on your own hardware, you don't fully own it. The architecture defines how the system runs on hardware you physically control: a laptop, a desktop, a home server. It works fully offline, stores data locally, and needs no cloud service. Its dependencies (a model provider, a runtime) each have a defined way out.

Managed hosting, a VPS, and remote access are extensions: same code, different deployment. Because Your Memory is portable, you can move between them without losing anything. See [deployment-spec.md](./deployment-spec.md) and [security-spec.md](./security-spec.md).

---

## Responsibility Matrix

Who does what, and who doesn't. Use it to check that no component takes on a job that belongs to another.

| Responsibility | Owner | Not |
|---|---|---|
| Persist, retrieve, search, version data | **Your Memory** (through tools) | |
| Provide structure (paths, hierarchy) | **Your Memory** provides it | The model or owner decides what goes where |
| Understand content, make meaning | **Model** | Your Memory, Agent Loop |
| Assemble prompts | **Model**, reading from Your Memory | Agent Loop, Your Memory |
| Select context (decide what to read) | **Model** | Your Memory, Agent Loop |
| Summarize, associate, consolidate | **Model**, using Your Memory operations | Your Memory |
| Run tools | **Agent Loop** | Your Memory |
| Decide which tools to use | **Model** (through the Agent Loop) | Your Memory, Gateway |
| Run skills | **Model + Agent Loop** (the model reads skill files, the Agent Loop runs the tool calls) | Your Memory |
| Protect access, control permissions | **Auth** | Your Memory, Gateway |
| Manage conversations | **Gateway** | Agent Loop, Your Memory |
| Route requests to the Agent Loop | **Gateway** | Auth |
| Connect to AI models | **Model API** | Agent Loop internals |
| Accept client connections | **Gateway API** | Agent Loop |
| Provide intelligence | **Models** (outside) | Agent Loop, Your Memory |
| Display content to owners | **Clients** (outside) | Gateway |
| Start the system | **Runtime config** (thin bootstrap, see [configuration-spec.md](./configuration-spec.md)) | Your Memory |
| Resolve concurrent writes | **Tool implementations** | Your Memory |

---

## A request, end to end

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Memory as Your Memory
    participant Loop as Agent Loop
    participant Model as Model (via Model API)
    participant Tools

    Client->>Gateway: Message + conversation ID + metadata (Gateway API)
    Gateway->>Auth: Who is this, and are they allowed?
    Auth-->>Gateway: Allowed, with actor context
    Gateway->>Memory: Load the conversation (conversation tool)
    Memory-->>Gateway: Conversation history
    Gateway->>Loop: Messages + metadata

    loop Until the job is done
        Loop->>Model: Messages + tool definitions
        Model-->>Loop: Text and/or tool calls
        opt Model asked for tools
            Loop->>Tools: Run tool calls (permitted by Auth)
            Tools->>Memory: Memory tools (read, write, search...)
            Tools-->>Loop: Results
        end
    end

    Loop-->>Gateway: Streamed text, tool calls, results, done
    Gateway->>Memory: Save the reply (conversation tool)
    Gateway-->>Client: Streamed response + conversation ID
```

---

## What the architecture must prove

These stories test the architecture itself. Each has a test procedure in [conformance/fs-tests.md](./conformance/fs-tests.md).

| # | Story |
|---|-------|
| FS-1 | **Move Your Memory to a new system.** Export, import on a fresh deployment, preferences honored, nothing lost. |
| FS-2 | **Add a capability without breaking the architecture.** Add a tool, skill, client, or provider. Your Memory gains no dependencies, and the four components stay four. |
| FS-3 | **Run on your own hardware.** Install on a laptop, desktop, or home server. No outside service required. Fully offline. |
| FS-4 | **Swap the model provider.** Config change; the next message uses the new provider and nothing else changes. |
| FS-5 | **Swap the client.** A new client speaks the Gateway API and is served identically. |
| FS-6 | **Evolve Your Memory.** Add semantic search alongside file search; no other component changes. |
| FS-7 | **Swap the Agent Loop.** Replace it; everything else is unaffected. |
| FS-8 | **Expand scope with tools.** Grow from one folder, to your computer, to outside services, by adding tools only. |

---

## Glossary

| Term | Meaning |
|------|---------|
| **Your Memory** | The platform. Your data, preferences, skills and conversations. No outward dependencies. |
| **Agent Loop** | Sends messages to models, runs tool calls, and repeats until done. Older documents call it the Engine. |
| **Gateway** | The front door. Manages conversations and routes messages. Any client that speaks the Gateway API works. |
| **Auth** | Controls access. Independent of every other component. |
| **Gateway API** | How clients connect to the system. |
| **Model API** | How the Agent Loop connects to AI models. Older documents call it the Provider API. |
| **Adapter** | A thin translation layer that keeps an API swappable. One side stays stable; the other adapts. |
| **Tools** | Capabilities in the environment. They describe themselves; the Agent Loop runs them; Auth governs them. |
| **Contract** | A defined boundary between components, independent of both sides. |
| **Clients** | Interfaces that connect through the Gateway API: web, CLI, mobile, bot, voice. |
| **Apps** | Combinations of instructions, tools, context, configuration and optional client resources for a specific outcome. An App is not a fifth component. |
| **Architecture** | The product-independent specs, contracts and guidance in this project. |
| **Implementation** | A product or system that follows the Architecture, such as BrainDrive. |

---

## Related documents

| Document | What it covers |
|----------|----------------|
| [principles.md](./principles.md) | The five architecture principles in full |
| [memory-as-platform.md](./memory-as-platform.md) | Why memory is the center of the architecture |
| [memory-spec.md](./memory-spec.md), [engine-spec.md](./engine-spec.md), [gateway-spec.md](./gateway-spec.md), [auth-spec.md](./auth-spec.md) | The four components |
| [models-spec.md](./models-spec.md), [tools-spec.md](./tools-spec.md) | Models and tools |
| [adapter-spec.md](./adapter-spec.md), [communication-principles.md](./communication-principles.md), [gateway-engine-contract.md](./gateway-engine-contract.md) | How the parts connect |
| [configuration-spec.md](./configuration-spec.md), [deployment-spec.md](./deployment-spec.md), [security-spec.md](./security-spec.md) | Running the system |
| [customization-spec.md](./customization-spec.md) | How implementations build on the Architecture |
| [implementers-reference.md](./implementers-reference.md) | Condensed contracts: what each component must do |
| [conformance/](./conformance/) | Tests that the architecture's promises hold |
| [lock-in-analysis.md](./lock-in-analysis.md), [lockin-gate.md](./lockin-gate.md) | Finding and preventing lock-in |
| [decisions.md](./decisions.md) | The foundation decisions and why they were made |
