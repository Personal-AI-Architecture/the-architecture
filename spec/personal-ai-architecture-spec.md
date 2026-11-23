# Spec: Personal AI Architecture

> **Purpose:** Product contract for the Personal AI Architecture: what a developer can do with it, and what every system built on it promises the person who owns that system. This is for product owners, builders, QA and maintainers. It is not an owner-facing document.
>
> **Previous release:** Dave J and Dave W accepted the original specification in [PR #7](https://github.com/Personal-AI-Architecture/the-architecture/pull/7), tagged [`paa-spec/2026-10-20`](https://github.com/Personal-AI-Architecture/the-architecture/tree/paa-spec/2026-10-20). No stories are Open in that baseline. Where the published material does not yet deliver a story, the gap is listed in [personal-ai-architecture-gaps.md](./personal-ai-architecture-gaps.md).

Evidence links point into the architecture repository. Paths outside `spec/` (such as `contracts/`, `AGENT.md`, `README.md` and `CONTRIBUTING.md`) are relative to the repository root. Paths that start with `template:` mean [Personal-AI-Architecture/ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template), read at `7fe3824`.

## Overview

### What we're building

The goal of the Personal AI Architecture is to avoid lock-in in a personal AI system, so that the system always remains under its owner's ownership and control. Nothing may lock the owner in: not a vendor, not a technology choice, and not the architecture itself.

The architecture is an open, MIT-licensed blueprint, not a product people install. It is the set of rules, contracts and checks that a product is built on. BrainDrive is the first implementation.

It does this by making the owner's memory the platform. **Your Memory** (the owner's files, conversations, preferences and their history) depends on nothing. Everything else is built on top of it and can be swapped: the AI models, the **Agent Loop** that lets a model use tools, **Auth** (who and what may act), the **Gateway** (how apps and devices connect), the apps themselves, and the tools. Four components, two public connection points (the **Gateway API** for clients and the **Model API** for models), and three things outside the system (clients, models and tools).

The architecture states what must be true, never which technology to use. Named technologies, including the architecture's own current contracts, are today's examples; any part can meet a rule its own way, and adapters connect different choices. The architecture's own contracts are the recommended default: using them makes connecting to other systems easy, and choosing otherwise means bringing your own adapters.

**Terms:** *Developer* — anyone who builds, extends or checks a system using the architecture. *Implementation* — a product or system built on the architecture (BrainDrive is the first). *Owner* — the person whose system it is. *Contracts* — the architecture's published API and data definitions, the recommended default; a system using other formats connects through adapters. *Conformance tests* — the published pass/fail checks that say whether an implementation keeps the architecture's promises.

### Outcome and V1 success

This serves developers, so that the systems they build serve their owners: every promise a developer keeps by following the architecture is a promise the owner can rely on.

V1 succeeds when a developer can build a system with no lock-in, where the owner:

1. Keeps their memory: it stays readable and theirs, and moves with them to another system.
2. Can swap everything else (models, providers, apps, tools and the core parts) without losing anything.
3. Runs the system on hardware they control, under rules they set, with updates that never take their data or choices.

And when a developer can get there by:

4. Understanding the architecture and finding one authoritative definition of everything they must build, with or without an AI coding agent.
5. Checking their implementation against published pass/fail tests, and proposing changes to the architecture through a reviewed route.

V1 does not include runnable code inside the architecture repository, a hosted or managed deployment, a certification or badge programme, or specific product behaviour (screens, wording, defaults). Products decide those.

## Product behavior

### Experience

A developer lands on the repository README. In a few minutes they learn the idea (Your Memory is the platform, everything else is swappable) and the five principles. From there they follow the architecture specs for rules, the contracts for exact shapes, the conformance checks for proof, and a runnable language template for a starting implementation. The same sources serve people and AI coding agents; the formal contracts in `contracts/` are the final word on shapes and endpoints.

When the developer has built something, they check it against the conformance tests and the lock-in gate. When they want to change the architecture itself, they open a pull request; the specs change first, and everything derived from them follows.

### Primary flow

1. **Learn:** README, principles, then the Architecture overview.
2. **Build:** the relevant architecture specs and `contracts/` definitions, by hand, with an AI agent, or starting from a language template.
3. **Check:** conformance tests and the lock-in gate.
4. **Extend or change:** add tools, clients and content without touching the core; propose architecture changes by pull request.

## User stories

US-1 is the goal. US-2 to US-11 are the promises that deliver it to the owner, in three groups. US-12 to US-18 are what a developer needs to keep those promises.

**Scope tags.** Each criterion is tagged by what it is tested against. **[implementation]** criteria are tested against a system built on the architecture. **[repo]** criteria are tested against this repository and its published templates; a product's own tests do not run them.

### The goal

#### US-1: No lock-in, so the system always stays under the owner's control — Confirmed

As a developer, I want the personal AI system I build to have no lock-in, so that it always remains under its owner's ownership and control: never locked to a vendor, a technology choice, or the architecture itself.

<details>
<summary>Acceptance criteria</summary>

- **AC-1.1** [implementation] — Given a conforming system, then the owner's memory depends on nothing else and the owner can always read it, keep it and move it (US-2 to US-4). _(evidence: [overview.md "Make Your Memory the platform"](../architecture/overview.md#1-make-your-memory-the-platform); [principles.md](../architecture/principles.md) 1)_
- **AC-1.2** [implementation] — Given any other part (a model, a provider, an app, the Agent Loop, the Gateway, Auth or a tool), then it can be replaced without losing the owner's memory and without changing the other parts (US-5 to US-8). _(evidence: [principles.md](../architecture/principles.md) 2; [adapter-spec.md](../architecture/adapter-spec.md))_
- **AC-1.3** [implementation] — Given the system is running, then it runs on hardware the owner controls, under rules the owner sets, and updates never take away the owner's data or choices (US-9 to US-11). _(evidence: [deployment-spec.md](../architecture/deployment-spec.md); [auth-spec.md](../architecture/auth-spec.md))_
- **AC-1.4** [implementation] — Given any part of a conforming system, then none requires a particular vendor, cloud service or product, and the owner could leave the architecture itself and keep their memory. _(evidence: [overview.md](../architecture/overview.md) opening: "the rules that keep you from being locked into a vendor, a technology, or even this architecture itself")_

</details>

### The owner keeps their memory

#### US-2: The owner's memory stays theirs and readable — Confirmed

As a developer, I want the architecture to keep the owner's memory independent of every other part, so that the owner can always read, search and recover their data, even with the AI switched off.

<details>
<summary>Acceptance criteria</summary>

- **AC-2.1** [implementation] — Given a conforming system, then Your Memory depends on no other component, and every component reaches it only through tools. _(evidence: [overview.md "Make Your Memory the platform"](../architecture/overview.md#1-make-your-memory-the-platform); [principles.md](../architecture/principles.md) 1; ARCH-1)_
- **AC-2.2** [implementation] — Given every AI and tool service is stopped, then the owner can still read their files, preferences, conversations, structured data and history with ordinary tools (text editor, file browser, database viewer), using their own keys if the data is encrypted. _(evidence: [memory-spec.md](../architecture/memory-spec.md); [deployment-spec.md "Storage Contract"](../architecture/deployment-spec.md#storage-contract); ARCH-1)_
- **AC-2.3** [implementation] — Given stored content, then the owner can keep it, get it back, search for it without knowing where it is, see what changed, and make an earlier state current again. History that records only that something changed, not what it was, does not meet this. _(evidence: [memory-spec.md "What Your Memory guarantees"](../architecture/memory-spec.md#what-your-memory-guarantees); ARCH-9)_
- **AC-2.4** [implementation] — Given a failed or conflicting write, then it is reported, and simultaneous changes do not corrupt data. _(evidence: [memory-spec.md "Errors and concurrency"](../architecture/memory-spec.md#errors-and-concurrency))_
- **AC-2.5** [implementation] — The owner can explicitly purge selected content. Ordinary deletion remains reversible. A purge removes the content from live Memory, recoverable history and derived stores under the implementation's control. If a retained backup delays complete removal, the owner can see which backup still holds the content and when it expires. A managed restore honors the purge before making restored content available. Conformance checks that the purged content cannot be read, searched, exported or recovered through history or a managed restore. Copies outside the implementation's control are outside the purge guarantee.

</details>

#### US-3: The owner can move their memory to another system — Confirmed

As a developer, I want export and import to carry everything that matters, so that the owner can move to another implementation without starting over.

Moving can mean pointing another system at the same memory where it is; export and import are one way, not the only way.

<details>
<summary>Acceptance criteria</summary>

- **AC-3.1** [implementation] — Given a conforming system, then the owner can export everything in open formats: all files, conversations, version history and structured data. Indexes and other derived data are optional because they can be rebuilt. Export completes while a conversation is running. If any part other than Your Memory is down, the owner can still get everything out, by ordinary file copy if nothing else works (AC-2.2). _(evidence: [memory-spec.md "Export"](../architecture/memory-spec.md#export); ARCH-7)_
- **AC-3.2** [implementation] — Given the export is imported into a different conforming implementation, then nothing is lost: conversations can be resumed, personal context is used, supported preferences and skills work, and anything the new system cannot support is reported to the owner, never dropped silently. Exported conversations use a documented, open format another system can read, directly or through an adapter; today that is the architecture's message contract (`message.json`), the recommended default. _(evidence: [overview.md FS-1](../architecture/overview.md#what-the-architecture-must-prove); [configuration-spec.md](../architecture/configuration-spec.md); [fs-tests.md FS-1](../conformance/fs-tests.md))_
- **AC-3.3** [implementation] — Given the owner imports their Memory, then identities and permission rules move together as part of it. The owner's import confirms activation for grants whose original identity and authorized resource scope the destination can verify. Matching names or IDs alone are insufficient. An unsupported or unverified identity or rule is kept as the owner left it, reported and grants nothing. Once the destination supports the grant and verifies both bindings, the original approval still applies. Removing an identity removes its rules. Anything on the new system that no verified imported rule covers starts with no access. Conformance checks that a different identity with the same name or ID receives no grant and that a grant cannot expand to additional resources. _(evidence: [auth-spec.md "Data portability"])_
- **AC-3.4** [implementation] — Given supported content (text and the content types a system declares), then it moves without loss. The architecture does not promise that every media type works everywhere. _(decision: accepted v1 portability scope in the `paa-spec/2026-10-20` tag; proof route: [FS-1](../conformance/fs-tests.md) checks supported-content transfer and reports unsupported types)_
- **AC-3.5** [implementation] — Given passwords, API keys and other credentials, then they travel with the owner's memory, protected so that only the owner can unlock them, and work on the new system once the owner unlocks them. The original service, destination and purpose binding travels with the credential (AC-10.12). How a credential is protected and stored is the implementation's choice; systems with different formats connect through an adapter. Active sessions do not travel; the owner signs in again. _(evidence: [Auth data portability](../architecture/auth-spec.md#data-portability) and [protected credentials](../architecture/memory-spec.md#protected-credentials); D204)_
- **AC-3.6** [implementation] — Given the system's Auth state (identities, permission rules, approval rules and the audit log), then the owner can read it and export it in the architecture's format, directly or through an adapter. Credentials are not in this export; they travel with Your Memory (AC-3.5). Replacing the Auth provider keeps all of it.

</details>

#### US-4: Improve memory storage and search without breaking anything — Confirmed

As a developer, I want to change how memory is stored or searched behind the memory tools, so that memory can get smarter without anything else changing.

<details>
<summary>Acceptance criteria</summary>

- **AC-4.1** [implementation] — Given semantic search is added beside file search, then both work, the original content survives deleting the search index, and only tool or storage code changes. _(evidence: [overview.md FS-6](../architecture/overview.md#what-the-architecture-must-prove); [memory-spec.md](../architecture/memory-spec.md))_
- **AC-4.2** [implementation] — Given a storage change, then existing memory operations keep working and the owner can still inspect their data with ordinary tools (US-2). _(evidence: [deployment-spec.md "Storage Contract"](../architecture/deployment-spec.md#storage-contract))_

</details>

### Everything else is swappable

#### US-5: Change models and providers without changing code — Confirmed

As a developer, I want the owner to switch AI model or provider by configuration alone, so that they can ride model improvements without being stuck with one company.

<details>
<summary>Acceptance criteria</summary>

- **AC-5.1** [implementation] — Given a model preference changes, then the next message uses the new model with no restart and no code change. _(evidence: [overview.md FS-4](../architecture/overview.md#what-the-architecture-must-prove); [configuration-spec.md "How the System Boots"](../architecture/configuration-spec.md#how-the-system-boots); [swap-tests.md SWAP-2](../conformance/swap-tests.md))_
- **AC-5.2** [implementation] — Given an adapter for another provider is available, then switching provider changes only configuration, the adapter file and environment settings. No component code changes. _(evidence: [adapter-spec.md](../architecture/adapter-spec.md); [swap-tests.md SWAP-1](../conformance/swap-tests.md))_
- **AC-5.3** [implementation] — Given local and cloud models, then both go through the same Model API, and capabilities a model lacks are reported, not faked. Switching models does not promise identical abilities. _(evidence: [models-spec.md](../architecture/models-spec.md); [ARCH-19](../conformance/arch-tests.md#arch-19-unsupported-model-ability-is-reported); D197)_
- **AC-5.4** [implementation] — Given the selected model or provider fails, then the system may make one recorded retry on the same selection. It never switches the owner's model without the owner's approval; a fallback the owner set up (models, providers or routers) is that approval. The architecture does not require a fallback; which failures use one is the implementation's choice. The fallback list is an owner preference in Your Memory and moves with it. Each reply records which model and provider produced it (AC-9.7). Otherwise the failure is reported and the turn stops. Given no model has been chosen, by a product default or the owner, then the system reports it rather than picking one. Given the configured adapter is not installed or its configuration is invalid, then startup reports the error and never selects another adapter. The initial provider may be a visible product default; after initialization, the active provider changes only through the owner's choice. This applies to the model answering in the owner's conversation; a tool or service the owner connected may use its own models behind its connection. See [D205](../architecture/decisions.md) for the owner-approved fallback rule.

</details>

#### US-6: Use any client — Confirmed

As a developer, I want any app or device that speaks the Gateway API to work, so that the owner is never locked into one interface.

<details>
<summary>Acceptance criteria</summary>

- **AC-6.1** [implementation] — Given a second conforming client, then it lists and resumes the owner's existing conversations with full history and gets the same service as the first. _(evidence: [overview.md FS-5](../architecture/overview.md#what-the-architecture-must-prove); ARCH-3)_
- **AC-6.2** [implementation] — Given a client message and metadata, then the Gateway validates their structure without interpreting their meaning, preserves the current message and metadata unchanged, selects only complete saved-history turns permitted by the context limit, and streams the reply with the conversation identity. _(evidence: [gateway-spec.md](../architecture/gateway-spec.md))_
- **AC-6.3** [implementation] — Given a missing conversation, a storage failure or an unreachable Agent Loop, then the client is told; the system never reports a message as saved when it was not. _(evidence: [gateway-spec.md "Checking an implementation"](../architecture/gateway-spec.md#checking-an-implementation))_
- **AC-6.4** [implementation] — Given any conforming client or program authenticated under an allowed identity, then every operation available to the product's own client, including approval decisions, is available through the public Gateway API under the same Auth checks; no caller has a private Agent Loop path.
- **AC-6.5** [implementation] — Given any client, then it keeps no owner data (conversations, history, preferences) that is not also in Your Memory; anything needed to resume comes from memory through the Gateway. A client may cache, but the cache is never the only copy.

</details>

#### US-7: Replace a component without touching the others — Confirmed

As a developer, I want to replace the Agent Loop, the Gateway or Auth on its own, so that no single part becomes a dependency the owner is stuck with.

Replacing a component takes building or adapting the new one to its contract; it never requires changing the others.

<details>
<summary>Acceptance criteria</summary>

- **AC-7.1** [implementation] — Given a replacement Agent Loop that meets the internal contract, then Gateway, Memory, Auth, tools, clients and existing data keep working unchanged. _(evidence: [overview.md FS-7](../architecture/overview.md#what-the-architecture-must-prove); ARCH-2)_
- **AC-7.2** [implementation] — Given a replacement Gateway or Agent Loop, then the other does not change, and the authenticated identity and trace information pass through intact. Given a request whose identity is missing, malformed, expired or supplied by the caller, then it is refused, and no part of the system can change or forge the identity it passes on. _(evidence: [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md))_
- **AC-7.3** [implementation] — Given Auth and Gateway, then each can be swapped on its own, because the Gateway calls Auth only through the Auth contract and neither depends on the other's internals. _(evidence: [decisions.md](../architecture/decisions.md) D60; `AGENT.md` lock-in check 8)_
- **AC-7.4** [implementation] — Given the Agent Loop, then it contains no product-specific logic; product behaviour comes from what is in memory, tools and configuration. _(evidence: [agent-loop-spec.md](../architecture/agent-loop-spec.md); [decisions.md](../architecture/decisions.md) D39, D40)_
- **AC-7.5** [implementation] — Given anything outside the owner's control that the system connects to (a model provider, a client format other than the Gateway API, a tool source such as an MCP server), then it connects through an adapter the owner controls, and no core component (Agent Loop, Gateway, Auth) contains its protocol details. A simple pass-through adapter is enough.
- **AC-7.6** [implementation] — Given a contract or outside standard changes, or a part uses a different format, then an adapter translates at the boundary, so the change means changing an adapter, never the components on either side. Boundaries the owner controls on both sides do not need one.

</details>

#### US-8: Add capabilities by adding tools — Confirmed

As a developer, I want new capabilities to arrive as tools, so that the system grows without rebuilding its core.

<details>
<summary>Acceptance criteria</summary>

- **AC-8.1** [implementation] — Given a tool is added or removed, then the core components do not change; removing it reduces what the system can do and nothing else. _(evidence: [overview.md FS-2, FS-8](../architecture/overview.md#what-the-architecture-must-prove); [swap-tests.md SWAP-3](../conformance/swap-tests.md))_
- **AC-8.2** [implementation] — Given a tool, then it describes itself, and the Agent Loop discovers it through the shared tool interface. _(evidence: [tools-spec.md](../architecture/tools-spec.md))_
- **AC-8.3** [implementation] — Given a tool the model may not use, then the model can tell "this tool does not exist" apart from "this tool exists but is not permitted". _(evidence: [tools-spec.md](../architecture/tools-spec.md))_
- **AC-8.4** [implementation] — Given the model asks for several tool calls in one turn, then each one is run or reported, the results go back to the model, and text the model wrote alongside them is kept. Whether they run at the same time is the implementation's choice. _(evidence: [agent-loop-spec.md "What the Agent Loop guarantees"](../architecture/agent-loop-spec.md#what-the-agent-loop-guarantees))_
- **AC-8.5** [implementation] — Given any tool, then the owner can see its trust level: shipped with the system, installed by the owner, or untrusted. Given a tool not shipped with the system, then by default it runs isolated from the owner's data and other tools, seeing only what it is given, unless the owner says otherwise. _(evidence: [security-spec.md](../architecture/security-spec.md); [tools-spec.md](../architecture/tools-spec.md))_
- **AC-8.6** [implementation] — Given a tool with a configured scope (for a file tool, a root folder), then it cannot reach outside that scope, whoever calls it and even if Auth is misconfigured. The scope is enforced by the tool's own process, container or configuration, not by the Agent Loop. The test attempts access inside and outside the configured scope with Auth allowing both; access inside succeeds and access outside is refused. For an in-process shipped tool, the tool implementation itself must enforce that result.
- **AC-8.7** [implementation] — Given a tool source the owner did not install or configure, then none of its tools enter the tool catalog. A source cannot claim another source's identity, a service cannot add itself through the Gateway API, and a tool cannot put itself in the set sent with every prompt; the owner chooses that set. The rule applies to whole sources: a source the owner configured, including another system or AI that does its own tool calling, may offer its tools, add tools later, and work however it likes behind its connection; what it returns is data (AC-10.6).

</details>

### The owner runs and controls it

#### US-9: Run on hardware the owner controls — Confirmed

As a developer, I want the system to run on the owner's own computer, offline if they choose, and private by default, so that ownership is real and not theoretical.

<details>
<summary>Acceptance criteria</summary>

- **AC-9.1** [implementation] — Given a laptop, desktop or home server running Linux, macOS or Windows (x86_64 or ARM64, 8 GB RAM, 1 GB plus memory storage), then the system installs and runs with no outside account or licence activation. Local model hardware is the owner's separate choice. _(evidence: [deployment-spec.md "The Deployment Contract"](../architecture/deployment-spec.md#the-deployment-contract); FS-3)_
- **AC-9.2** [implementation] — Given no internet connection and a local model and tools, then the system starts and a full exchange (message, model, tool calls, reply) completes. _(evidence: [deployment-spec.md](../architecture/deployment-spec.md); DEPLOY-1)_
- **AC-9.3** [implementation] — Given a default install, then it accepts connections only from the same machine; reaching it from elsewhere needs the owner to turn that on. _(evidence: [deployment-spec.md "Network Posture"](../architecture/deployment-spec.md#network-posture); DEPLOY-3)_
- **AC-9.4** [implementation] — Given normal operation, then nothing leaves the machine unless the owner configured it (a model on another computer, an outside tool, a remote backup). A model on this computer keeps what is sent to it on this computer; a model on any other computer, even on the owner's own network, is another place the owner's data goes. _(evidence: [deployment-spec.md](../architecture/deployment-spec.md); DEPLOY-2, DEPLOY-4)_
- **AC-9.5** [implementation] — Given a default install, then all four components and both APIs run as one unit with one start command. _(evidence: [deployment-spec.md "Single deployable unit by default"](../architecture/deployment-spec.md#5-single-deployable-unit-by-default))_
- **AC-9.6** [implementation] — Given software running in the system, updates included, then the owner can verify that it is authentic and has not been tampered with. How they verify it is the product's choice.
- **AC-9.7** [implementation] — Given any model the system will use, whether selected by the owner or supplied as a product default, then before anything is sent to it the owner is told that the model sees what the system sends it and where that model runs. How the owner is told is the product's choice. Given a saved reply, then it records the model and provider that produced it.
- **AC-9.8** [implementation] — Given a connection that crosses a network (a client reaching the Gateway from another machine, a model provider, a tool or service on another machine), then it is kept secure: no one on the network can read it, change it, or pose as either end. How is the implementation's choice; today that is usually TLS. Connections within the same machine may stay plain.

</details>

#### US-10: The owner controls who and what can act — Confirmed

As a developer, I want every request and every AI action checked against the owner's rules, so that the owner decides who and what can touch their data.

<details>
<summary>Acceptance criteria</summary>

- **AC-10.1** [implementation] — Given a request with no valid identity, then it is refused. Given an identity, then it can act only within the permissions it was given. _(evidence: [auth-spec.md "Permissions"](../architecture/auth-spec.md#permissions))_
- **AC-10.2** [implementation] — Given the owner's permission and approval rules, then the system enforces them. How strict the defaults are and how approvals look are the product's choice. Where a product enables approvals, the canonical request/decision lifecycle is pending → approved, denied, cancelled, or expired; decisions require Auth authority and are replay-safe by request ID. _(evidence: [auth-spec.md](../architecture/auth-spec.md); [security-spec.md](../architecture/security-spec.md); `contracts/schemas/approval-request.json`; `contracts/schemas/approval-decision.json`)_
- **AC-10.3** [implementation] — A conforming instance has exactly one human identity that may authenticate: its owner. A person who is not that owner interacts only through a separately owned AI system, each under its own owner, sharing only what each owner allows. Given a new kind of actor that is not a person (an AI agent, a service, another instance), then it can be added, and it gets no permissions until the owner grants them. In v1 the AI in a conversation acts under the owner's identity, not as a separate actor (D190); separate identities for AI agents acting for the owner come later and also start with no permissions. Permission rules that move with the owner's memory take effect on import (AC-3.3). _(evidence: [auth-spec.md](../architecture/auth-spec.md))_
- **AC-10.4** [implementation] — Given the system acts through tools, then the owner can see what acted, when and on what, in a record the owner owns, can read and can take with them (AC-3.6). If the record cannot be written, the owner is told; the outage is never hidden. Whether work stops while the record cannot be written is the implementation's choice.
- **AC-10.5** [implementation] — Given secrets (API keys, passwords), then they are kept protected so that only the owner can unlock them, and never readable as ordinary memory content by a model or a tool; they are never stored unprotected in memory or in tracked configuration files. They may travel with the owner's memory in that protected form (AC-3.5). _(evidence: [configuration secrets](../architecture/configuration-spec.md#secrets) and [secrets management](../architecture/security-spec.md#secrets-management); D204)_
- **AC-10.6** [implementation] — Given content the model reads as data (Memory content other than the instructions and skills the owner has set up, conversation history, tool results), then the system marks it as data, apart from instructions, in what it sends through the Model API. Given metadata or extension fields on a request, message or tool definition, then they cannot change an identity, a role or a permission. The test checks these mechanisms, not whether a model obeys them.
- **AC-10.7** [implementation] — The owner has the architecture's default authority. Given any non-owner identity, then it gains access only through a grant traceable to the owner and never more access than its grantor may delegate. No configuration, preference, tool discovery or extension widens access. Approval rules are enforced by the software, not by what a model writes.
- **AC-10.8** [implementation] — Given an audit record, then it follows the architecture's audit contract, directly or through an adapter (today: a stable ID, timestamp, event, authenticated actor, action, result and correlation ID, plus a resource when applicable); optional reason and details contain no secrets or raw private content. In v1 the AI in a conversation acts under the owner's identity (D190), so its actions are recorded as the owner's; the record does not separate the two.
- **AC-10.9** [implementation] — Given the owner revokes an identity while it is working, then its active turn is cancelled; after cancellation is observed it starts no further model or tool work and commits no further writes; it cannot retry under the revoked identity. Writes already committed remain and are recorded, and the revocation is recorded in the audit log.
- **AC-10.10** [implementation] — Given the owner has lost their local sign-in credentials, then they can reset the local owner login through the filesystem on their own hardware, without an outside service. The reset preserves the vault's existing access controls. An independently protected key under the owner's control, including a local key file, or a recovery method the owner set up can still unlock the vault. If both are unavailable, the owner must replace or reissue the affected credentials. Conformance checks that local sign-in works after a reset and that the reset alone cannot grant access to protected secrets.
- **AC-10.11** [implementation] — Given Auth cannot be reached, then every request it cannot check is refused, including requests from sessions that were valid before, no tool call runs, no data is exposed, and the owner sees a clear error.
- **AC-10.12** [implementation] — Before sending a credential, the system verifies that its recipient and use match the credential's authorized service, destination and purpose. The binding survives export and import, and the same check applies after a redirect, provider switch or endpoint change. If the binding cannot be verified, the system withholds the credential and reports the mismatch. The owner may explicitly approve updating the binding to a new destination within the credential issuer's restrictions. If the credential is invalid for the new destination, the owner reconnects with a valid credential. Conformance checks that the approved destination receives the valid credential and that an unapproved or issuer-restricted destination receives none.

</details>

#### US-11: Owner changes survive updates, and updates can be undone — Confirmed

As a developer, I want product updates to keep the owner's data and choices, so that updating never costs the owner anything.

<details>
<summary>Acceptance criteria</summary>

- **AC-11.1** [implementation] — Given an update, then memory, preferences, conversations and access settings survive it. _(evidence: [deployment-spec.md "Update Principles"](../architecture/deployment-spec.md#update-principles))_
- **AC-11.2** [implementation] — Given an update breaks the system, then the owner can go back to the previous working version, and their data still works with it. _(evidence: [deployment-spec.md "Update Principles"](../architecture/deployment-spec.md#update-principles))_
- **AC-11.3** [implementation] — Given the owner changed something the product ships (instructions, preferences), then an update keeps the owner's change, and where the update conflicts with it, the owner is told instead of having it overwritten silently. _(evidence: [configuration-spec.md "Layered Overrides"](../architecture/configuration-spec.md#layered-overrides); [customization-spec.md](../architecture/customization-spec.md))_
- **AC-11.4** [implementation] — Given the owner's preferences and the product's defaults, then the owner's choice wins. On the owner's own hardware, no product rule overrides the owner. _(evidence: [configuration-spec.md "Layered Overrides"](../architecture/configuration-spec.md#layered-overrides))_
- **AC-11.5** [implementation] — Given the system runs on the owner's own hardware, then no update is applied without the owner's action or a policy the owner set, and the owner can stay on a version. Given a hosted service, then the owner may not control its updates, but can always leave with everything (US-3).
- **AC-11.6** [implementation] — Given an uninstall, then the default preserves Your Memory, including history, portable Auth records and the owner's ability to unlock protected data afterward. Removing owner data requires a separate, explicit choice that identifies what will be deleted. Conformance runs the supported uninstall path and verifies the owner can still read or import their data and unlock protected data using their own key or configured recovery method.

</details>

### How developers deliver the goal

#### US-12: Understand the architecture and build with an AI agent — Confirmed

As a developer, I want to understand the architecture quickly and build a system from it with only my AI coding agent's help, so that one person can build, maintain and leave a system with no one else's help.

The no-lock-in point: a single developer with their AI can build their own system from the architecture without outside help. What the README, reading routes and overview contain is maintainer guidance for meeting this, not criteria.

<details>
<summary>Acceptance criteria</summary>

- **AC-12.1** [repo] — Given a developer, or an AI agent, new to the architecture who starts at the repository's front page, then within about ten minutes they can correctly say what it is for and what its parts are, and decide whether to build on it. The test is a fixed set of questions with expected answers.
- **AC-12.2** [repo] — Given a developer ready to build, then from the front page they can reach the authoritative definition of any part in a few steps, and every route they follow leads to something that exists.
- **AC-12.3** [repo] — Given only the architecture's published material and one language template, then an AI coding agent can build a bounded capability, using the relevant spec and contract, and run its checks; missing proof is reported, never treated as a pass.
- **AC-12.4** [repo] — Given any guide written for developers or agents, then it points to the authoritative sources and never overrides a contract or adds rules of its own.
- **AC-12.5** [repo] — Given a published language template, then a developer can create a project from it and, following its setup, have a system running on their own machine that works offline with a stand-in model, streams a reply and stores the conversation. Today's template is TypeScript.
- **AC-12.6** [repo] — Given the template, then it ships its own contract, boundary and lock-in checks, and shows a provider swap by configuration only.

</details>

#### US-13: Know exactly what to build — Confirmed

As a developer, I want one authoritative definition of every component, endpoint and data shape, so that two people building from the architecture build things that work together.

<details>
<summary>Acceptance criteria</summary>

- **AC-13.1** [repo] — Given any component or API, then a developer can find what it must do, its exact machine-readable contract, and the check that proves it.
- **AC-13.2** [repo] — Given anything else that shows a shape (an example, prose, a template) and disagrees with the published contract, then the contract wins and the difference is logged as a gap.
- **AC-13.3** [repo] — Given a published example marked valid, then it passes its contract; marked invalid, then it fails.

</details>

#### US-14: Build with an AI coding agent — Merged into US-12

Merged into US-12 on the 2026-11-20 call. Its criteria are now AC-12.3 and AC-12.4.

#### US-15: Start from runnable code — Merged into US-12

Merged into US-12 on the 2026-11-20 call. Its criteria are now AC-12.5 and AC-12.6 (no longer naming TypeScript as a requirement; the template's document checks move to maintainer guidance).

#### US-16: Check that my implementation conforms — Confirmed

As a developer, I want published pass/fail tests, so that I can show my implementation keeps the architecture's promises.

<details>
<summary>Acceptance criteria</summary>

- **AC-16.1** [repo] — Given the conformance suite, then every test has set-up steps and pass/fail criteria, and every test has a unique stable ID consisting of its group prefix (SWAP, ARCH, DEPLOY or FS) and a positive integer. _(evidence: [conformance/](../conformance/README.md))_
- **AC-16.3** [repo] — Given the lock-in gate and lock-in audit, then a developer can work through each check for a pull request or a release. _(evidence: [lockin-gate.md](../conformance/lockin-gate.md), [lockin-audit.md](../conformance/lockin-audit.md))_
- **AC-16.4** [repo] — Given a system checked against the suite, then the result shows, criterion by criterion, where it conforms and where it does not, so anyone can see where lock-in remains. Conformance is a spectrum; the further along it, the less lock-in. The report also shows where proof is still missing. Only evidence against the PAA criterion earns a PAA pass.

**In scope:** the PAA conformance validator: language-neutral tests that every implementation and template must pass, whatever language it is written in. It grows from the suite above and is published as an executable validator alongside the repository's contract and architecture checks.

</details>

#### US-17: Build a product on the architecture — Confirmed

As a product builder, I want to make my own product (its methods, personality, tools and branded app) on the architecture, so that I get a working personal AI system without building the infrastructure or changing the architecture.

<details>
<summary>Acceptance criteria</summary>

- **AC-17.1** [implementation] — Given a builder's own memory content (instructions, skills, folder structure, starter content), tools and configuration, then the system boots and behaves as their product, and no architecture contract changes. _(evidence: [customization-spec.md](../architecture/customization-spec.md))_
- **AC-17.2** [implementation] — Given two products with different content on the same architecture, then each behaves according to its own content with no custom infrastructure code. _(evidence: [customization-spec.md](../architecture/customization-spec.md))_
- **AC-17.3** [implementation] — Given a builder's custom tools, then they are discovered and usable with the Agent Loop unchanged. _(evidence: [customization-spec.md](../architecture/customization-spec.md); [tools-spec.md](../architecture/tools-spec.md))_
- **AC-17.4** [implementation] — Given a branded client, then it connects through the Gateway API like any other client and can continue the same conversations; branding stays in the client. _(evidence: [customization-spec.md](../architecture/customization-spec.md))_
- **AC-17.5** [repo] — Given the repository and a published language template, then a builder can create a product using the published specs and contracts without installing PAA as a runtime package; the same contracts permit an implementation in any language without a template. _(evidence: `CONTRIBUTING.md` "Scope"; `README.md` "What this is")_
- **AC-17.6** [implementation] — Given a test fixture listing every implementation-supplied Memory artifact, tool, configuration override and client, then removing those listed additions leaves the generic system passing all implementation conformance tests, and all Memory created or modified by the owner after installation remains byte-for-byte present.

</details>

#### US-18: Propose a change to the architecture — Confirmed

As a contributor, I want a clear way to change the architecture, so that the specs, contracts and guides stay in step and nobody quietly rewrites the rules to match code.

<details>
<summary>Acceptance criteria</summary>

- **AC-18.1** [repo] — Given a contributor, then they can find how to propose a change, and every change goes through review.
- **AC-18.2** [repo] — Given an architecture change, then it starts in the specs; contracts follow shape changes, conformance checks and affected templates are updated, and new rules get conformance test IDs. Before acceptance, each added or materially changed criterion maps to a check that proves the revised outcome. New checks receive unique, stable IDs. _(evidence: [documentation-guide.md](../maintainers/documentation-guide.md), [doc-maintenance-spec.md](../maintainers/doc-maintenance-spec.md))_
- **AC-18.3** [repo] — Given code that differs from the specs, then the code is fixed, a spec change is proposed and reviewed, or the difference is recorded with its reason as an implementation choice or a temporary crutch. Specs are never quietly rewritten to match code.
- **AC-18.5** [implementation] — Given a crutch or implementation choice, then it is contained inside one component, behind that component's adapter; the component's boundary still matches the architecture's contract, and no crutch crosses components. Each is recorded with its reason.

</details>

## Requirements

### Functional requirements

- [ ] Your Memory has no outward dependencies; every component reaches it only through tools.
- [ ] Changing a model, a provider or a tool needs configuration changes only (the three swap tests).
- [ ] Runtime configuration has exactly four fields: `memory_root`, `provider_adapter`, `auth_mode`, `tool_sources`. Preferences, including any owner-set fallbacks, live in Your Memory; secrets are protected so only the owner can unlock them, and may travel with Your Memory in that form.
- [ ] The architecture's published contracts are the single authoritative definition of its APIs and shared shapes. What crosses the Gateway API and the Model API matches them, directly or through an adapter; inside a product, behind its adapters, is the implementation's choice.
- [ ] Anything a system cannot support after a move (a preference, a tool, a permission rule, a model ability) is reported, never dropped silently and never turned into extra access.

### Data, memory and artifact contract

| Data / artifact | Owner | Read / write rule | Retention |
|---|---|---|---|
| Your Memory (files, preferences, skills, conversations, history) | Owner | Through tools only; readable with ordinary tools when the system is stopped | Kept until the owner deletes it and preserved on uninstall by default. Ordinary deletion retains history. An explicit purge follows AC-2.5. |
| Permission and identity records | Owner | Managed through Auth tools. Move together on import. Only supported rules with verified identity and resource bindings take effect. An unsupported or unverified identity or rule is kept, reported and grants nothing. Anything no verified rule covers starts with no access. Removing an identity removes its rules. | Moves with memory, as part of it, and is preserved on uninstall by default. |
| Credentials and secrets | Owner | Protected so only the owner can unlock them; never readable as ordinary memory content by a model or tool; never unprotected in memory or tracked config; protected format is the implementation's choice. Use is limited to the verified service, destination and purpose (AC-10.12). | Moves with memory, protected. The owner can still unlock retained data after uninstall. |
| Runtime configuration | Implementation | Four fields; set by whoever runs the system | Per install |
| Derived data (indexes, embeddings) | Implementation | Optional to export | Rebuilt from source. Purged content is removed under AC-2.5. |

## Acceptance and trust

### Risk areas

| Risk area | Applicability and scope basis |
|---|---|
| Touches credentials, billing, or external services | Applicable — defines where secrets live and how credentials move between systems. No billing. |
| Touches owner memory | Applicable — defines what every implementation must guarantee about the owner's memory. |
| Ships a new owned UI surface | Not applicable — the architecture ships no screens; clients are the products' own. |
| Changes install/update/uninstall | Applicable — defines the install, offline, network and update promises every implementation inherits. |

### Critical failure behavior

| Scenario | Expected behavior |
|---|---|
| A component or the AI is down | Memory stays readable with ordinary tools (US-2). |
| A write fails or conflicts | Reported; no corruption (AC-2.4). |
| A move hits something the new system cannot support | Reported to the owner; never dropped silently; never grants access (AC-3.2, AC-3.3). |
| An imported grant cannot be bound to its original identity and resource scope | The grant stays inactive and the owner is told (AC-3.3). |
| A credential's destination or purpose does not match its binding | The credential is withheld and the mismatch is reported (AC-10.12). |
| The owner resets a lost local login | The owner regains local sign-in. The vault's existing access controls stay in effect (AC-10.10). |
| A retained backup delays a purge | The owner sees what remains and when it expires. Managed restore honors the purge (AC-2.5). |
| An update breaks the system | The previous version is available and works with the owner's data (AC-11.2). |
| The audit log cannot be written | The owner is told; the outage is never hidden. Whether work stops meanwhile is the implementation's choice (AC-10.4). |
| An unknown actor appears | It has no permissions until the owner grants them (AC-3.3, AC-10.3). |

### Non-negotiable trust boundaries

- [ ] The owner can always get all of their memory out, in open formats.
- [ ] Nothing leaves the owner's machine unless the owner configured it.
- [ ] Remote access is off until the owner turns it on.
- [ ] Secrets are never readable by a model or tool, and never stored unprotected in memory or tracked configuration.
- [ ] Credentials are sent only within their verified service, destination and purpose binding (AC-10.12).
- [ ] Owners can purge their data and retain it by default on uninstall (AC-2.5, AC-11.6).
- [ ] Owner changes are never silently overwritten by an update.
- [ ] The architecture never requires a particular vendor, cloud service or product.

## Companion documents

- **Inherits:** none. The architecture is product-independent by design and sits beneath every implementation. Basis: the "Architecture" and "Implementation" entries in the [Architecture overview glossary](../architecture/overview.md#glossary) and `AGENT.md` "Vocabulary".
- **Technical authority:** the specifications, contracts and conformance tests in this repository. Detailed mechanics stay there; this spec adds no technical rules.
- **Implementations:** every implementation, BrainDrive included, inherits these promises.
- **Gaps:** [personal-ai-architecture-gaps.md](./personal-ai-architecture-gaps.md).
- **Evaluation plan:** the PAA conformance validator (US-16).
- **Proof routes:** [Acceptance criteria and proof routes](../conformance/acceptance-criteria.md).
- **Historical V1 proof status:** [acceptance proof audit](../maintainers/v1-acceptance-proof-audit-2026-10-23.md), which distinguishes published methods from observed runtime results.

## Approval

Specification changes are accepted by reviewed pull request together with affected contracts and conformance checks. Implementations pin the accepted revision they use to report conformance.

## Contract alignment

The canonical contract tree under `contracts/` is authoritative for exact payloads,
routes, shared message parts, and stream events. Identity status and extensible actor
types, public approval decisions, the per-request model and provider, structured message content and data context, portable
model errors (D197), open tool-source kinds (D198), and additive extension slots
(D199) are represented in the published contracts. GAP-PAA-29's separate-service
discovery decision is resolved (D196, [PR #21](https://github.com/Personal-AI-Architecture/the-architecture/pull/21)):
the Agent Loop finds tools from owner-configured tool sources, and services do not
register through the Gateway API.
