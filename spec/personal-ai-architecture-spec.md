---
sidebar_label: PAA product spec
hide_table_of_contents: true
---

# Spec: Personal AI Architecture

> **Purpose:** Product contract for the Personal AI Architecture: what a developer can do with it, and what every system built on it promises the person who owns that system. This is for product owners, builders, QA and maintainers. It is not an owner-facing document.
>
> **Status:** Accepted in this repository by Dave J and Dave W ([PR #7](https://github.com/Personal-AI-Architecture/the-architecture/pull/7)). Tag: [`paa-spec/2026-10-20`](https://github.com/Personal-AI-Architecture/the-architecture/tree/paa-spec/2026-10-20). No stories are Open. Where the published material does not yet deliver a story, the gap is listed in [personal-ai-architecture-gaps.md](./personal-ai-architecture-gaps.md).

Evidence links point into this repository. Paths outside ` ` (such as `contracts/`, `AGENT.md`, `README.md` and `CONTRIBUTING.md`) are relative to the repository root. Paths that start with `template:` mean [Personal-AI-Architecture/ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template), read at `7fe3824`.

## Overview

### What we're building

The goal of the Personal AI Architecture is to avoid lock-in in a personal AI system, so that the system always remains under its owner's ownership and control. Nothing may lock the owner in: not a vendor, not a technology choice, and not the architecture itself.

The architecture is an open, MIT-licensed blueprint, not a product people install. It is the set of rules, contracts and checks that a product is built on. BrainDrive is the first implementation.

It does this by making the owner's memory the platform. **Your Memory** (the owner's files, conversations, preferences and their history) depends on nothing. Everything else is built on top of it and can be swapped: the AI models, the **Agent Loop** that lets a model use tools, **Auth** (who and what may act), the **Gateway** (how apps and devices connect), the apps themselves, and the tools. Four components, two public connection points (the **Gateway API** for clients and the **Model API** for models), and three things outside the system (clients, models and tools).

**Terms:** *Developer* — anyone who builds, extends or checks a system using the architecture. *Implementation* — a product or system built on the architecture (BrainDrive is the first). *Owner* — the person whose system it is. *Contracts* — the published API and data definitions in `contracts/`. *Conformance tests* — the published pass/fail checks that say whether an implementation keeps the architecture's promises.

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

A developer lands on the repository README. In a few minutes they learn the idea (Your Memory is the platform, everything else is swappable) and the five principles. From there they follow one of three routes: the in-depth specs for people, the condensed primers to hand to an AI coding agent, or the per-component blueprints with contracts, tests, drift guards and build prompts. The formal contracts in `contracts/` are the final word on shapes and endpoints.

When the developer has built something, they check it against the conformance tests and the lock-in gate. When they want to change the architecture itself, they open a pull request; the specs change first, and everything derived from them follows.

### Primary flow

1. **Learn:** README, principles, then the Architecture overview.
2. **Build:** implementer's reference and `contracts/` contracts, by hand, with an AI agent, or starting from the TypeScript template.
3. **Check:** conformance tests and the lock-in gate.
4. **Extend or change:** add tools, clients and content without touching the core; propose architecture changes by pull request.

## User stories

US-1 is the goal. US-2 to US-11 are the promises that deliver it to the owner, in three groups. US-12 to US-18 are what a developer needs to keep those promises.

### The goal

#### US-1: No lock-in, so the system always stays under the owner's control — Confirmed

As a developer, I want the personal AI system I build to have no lock-in, so that it always remains under its owner's ownership and control: never locked to a vendor, a technology choice, or the architecture itself.

<details>
<summary>Acceptance criteria</summary>

- **AC-1.1** — Given a conforming system, then the owner's memory depends on nothing else and the owner can always read it, keep it and move it (US-2 to US-4). _(evidence: [overview.md "Make Your Memory the platform"](../architecture/overview.md#1-make-your-memory-the-platform); [principles.md](../architecture/principles.md) 1)_
- **AC-1.2** — Given any other part (a model, a provider, an app, the Agent Loop, the Gateway, Auth or a tool), then it can be replaced without losing the owner's memory and without changing the other parts (US-5 to US-8). _(evidence: [principles.md](../architecture/principles.md) 2; [overview.md "What keeps it swappable"](../architecture/overview.md#what-keeps-it-swappable))_
- **AC-1.3** — Given the system is running, then it runs on hardware the owner controls, under rules the owner sets, and updates never take away the owner's data or choices (US-9 to US-11). _(evidence: [deployment-spec.md](../architecture/deployment-spec.md); [auth-spec.md](../architecture/auth-spec.md))_
- **AC-1.4** — Given any part of a conforming system, then none requires a particular vendor, cloud service or product, and the owner could leave the architecture itself and keep their memory. _(evidence: [overview.md](../architecture/overview.md) opening: "the rules that keep you from being locked into a vendor, a technology, or even this architecture itself")_

</details>

### The owner keeps their memory

#### US-2: The owner's memory stays theirs and readable — Confirmed

As a developer, I want the architecture to keep the owner's memory independent of every other part, so that the owner can always read, search and recover their data, even with the AI switched off.

<details>
<summary>Acceptance criteria</summary>

- **AC-2.1** — Given a conforming system, then Your Memory depends on no other component, and every component reaches it only through tools. _(evidence: [overview.md "Make Your Memory the platform"](../architecture/overview.md#1-make-your-memory-the-platform); [principles.md](../architecture/principles.md) 1; ARCH-1)_ How preferences are read at start-up, before tools are ready, is not settled: GAP-PAA-15.
- **AC-2.2** — Given every AI and tool service is stopped, then the owner can still read their files, preferences, conversations, structured data and history with ordinary tools (text editor, file browser, database viewer), using their own keys if the data is encrypted. _(evidence: [memory-spec.md](../architecture/memory-spec.md); [deployment-spec.md "Storage Contract"](../architecture/deployment-spec.md#storage-contract); ARCH-1)_
- **AC-2.3** — Given stored content, then the owner can keep it, get it back, search for it without knowing where it is, see what changed, and make an earlier state current again. History that records only that something changed, not what it was, does not meet this. _(evidence: [memory-spec.md "What Memory Guarantees"](../architecture/memory-spec.md#what-memory-guarantees); ARCH-9)_
- **AC-2.4** — Given a failed or conflicting write, then it is reported, and simultaneous changes do not corrupt data. _(evidence: [memory-spec.md "Core Operations and Contract"](../architecture/memory-spec.md#core-operations-and-contract))_

</details>

#### US-3: The owner can move their memory to another system — Confirmed

As a developer, I want export and import to carry everything that matters, so that the owner can move to another implementation without starting over.

<details>
<summary>Acceptance criteria</summary>

- **AC-3.1** — Given a conforming system, then the owner can export everything in open formats: all files, conversations, version history and structured data. Indexes and other derived data are optional because they can be rebuilt. _(evidence: [memory-spec.md "Portability"](../architecture/memory-spec.md#portability); ARCH-7)_
- **AC-3.2** — Given the export is imported into a different conforming implementation, then nothing is lost: conversations can be resumed, personal context is used, supported preferences and skills work, and anything the new system cannot support is reported to the owner, never dropped silently. _(evidence: [overview.md FS-1](../architecture/overview.md#what-the-architecture-must-prove); [configuration-spec.md](../architecture/configuration-spec.md); [fs-tests.md FS-1](../conformance/fs-tests.md))_
- **AC-3.3** — Given permission rules move with the owner, then rules the new system supports are kept and enforced the same way once the owner turns the identities they apply to back on; rules it does not support are reported and never grant access silently. _(evidence: [auth-spec.md "Data portability"](../architecture/auth-spec.md#data-portability))_ The shared rule definitions do not exist yet: GAP-PAA-12.
- **AC-3.4** — Given supported content (text and the content types a system declares), then it moves without loss. The architecture does not promise that every media type works everywhere. _(basis: maintainers' decision)_
- **AC-3.5** — Given passwords, sessions and API keys, then they are not part of the portable memory; credentials are set up again on the new system. Identities re-created by an import have no access until the owner turns it back on; nothing is re-granted automatically. How the owner turns access back on is the product's choice. _(evidence: [auth-spec.md "Stale permissions after export/import"](../architecture/auth-spec.md#stale-permissions-after-exportimport); [configuration-spec.md "Secrets"](../architecture/configuration-spec.md#secrets))_

</details>

#### US-4: Improve memory storage and search without breaking anything — Confirmed

As a developer, I want to change how memory is stored or searched behind the memory tools, so that memory can get smarter without anything else changing.

<details>
<summary>Acceptance criteria</summary>

- **AC-4.1** — Given semantic search is added beside file search, then both work, the original content survives deleting the search index, and only tool or storage code changes. _(evidence: [overview.md FS-6](../architecture/overview.md#what-the-architecture-must-prove); [memory-spec.md](../architecture/memory-spec.md))_
- **AC-4.2** — Given a storage change, then existing memory operations keep working and the owner can still inspect their data with ordinary tools (US-2). _(evidence: [deployment-spec.md "Storage Contract"](../architecture/deployment-spec.md#storage-contract))_

</details>

### Everything else is swappable

#### US-5: Change models and providers without changing code — Confirmed

As a developer, I want the owner to switch AI model or provider by configuration alone, so that they can ride model improvements without being stuck with one company.

<details>
<summary>Acceptance criteria</summary>

- **AC-5.1** — Given a model preference changes, then the next message uses the new model with no restart and no code change. _(evidence: [overview.md FS-4](../architecture/overview.md#what-the-architecture-must-prove); [configuration-spec.md "How the System Boots"](../architecture/configuration-spec.md#how-the-system-boots); [swap-tests.md SWAP-2](../conformance/swap-tests.md))_ The provider swap test still requires a restart: GAP-PAA-7.
- **AC-5.2** — Given an adapter for another provider is available, then switching provider changes only configuration, the adapter file and environment settings. No component code changes. _(evidence: [adapter-spec.md](../architecture/adapter-spec.md); [swap-tests.md SWAP-1](../conformance/swap-tests.md))_
- **AC-5.3** — Given local and cloud models, then both go through the same Model API, and capabilities a model lacks are reported, not faked. Switching models does not promise identical abilities. _(evidence: [models-spec.md](../architecture/models-spec.md))_

</details>

#### US-6: Use any client — Confirmed

As a developer, I want any app or device that speaks the Gateway API to work, so that the owner is never locked into one interface.

<details>
<summary>Acceptance criteria</summary>

- **AC-6.1** — Given a second conforming client, then it lists and resumes the owner's existing conversations with full history and gets the same service as the first. _(evidence: [overview.md FS-5](../architecture/overview.md#what-the-architecture-must-prove); ARCH-3)_
- **AC-6.2** — Given a client sends content and metadata, then the Gateway passes them through without interpreting them and streams the reply back with the conversation's identity. _(evidence: [gateway-spec.md](../architecture/gateway-spec.md))_
- **AC-6.3** — Given a missing conversation, a storage failure or an unreachable Agent Loop, then the client is told; the system never reports a message as saved when it was not. _(evidence: [gateway-spec.md "Success Criteria"](../architecture/gateway-spec.md#success-criteria))_

</details>

#### US-7: Replace a component without touching the others — Confirmed

As a developer, I want to replace the Agent Loop, the Gateway or Auth on its own, so that no single part becomes a dependency the owner is stuck with.

<details>
<summary>Acceptance criteria</summary>

- **AC-7.1** — Given a replacement Agent Loop that meets the internal contract, then Gateway, Memory, Auth, tools, clients and existing data keep working unchanged. _(evidence: [overview.md FS-7](../architecture/overview.md#what-the-architecture-must-prove); ARCH-2)_
- **AC-7.2** — Given a replacement Gateway or Agent Loop, then the other does not change, and the authenticated identity and trace information pass through intact. _(evidence: [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md))_
- **AC-7.3** — Given Auth and Gateway, then each can be swapped on its own, because the Gateway calls Auth only through the Auth contract and neither depends on the other's internals. _(evidence: [decisions.md](../architecture/decisions.md) D60; `AGENT.md` lock-in check 8)_
- **AC-7.4** — Given the Agent Loop, then it contains no product-specific logic; product behaviour comes from what is in memory, tools and configuration. _(evidence: [agent-loop-spec.md](../architecture/agent-loop-spec.md); [decisions.md](../architecture/decisions.md) D39, D40)_

</details>

#### US-8: Add capabilities by adding tools — Confirmed

As a developer, I want new capabilities to arrive as tools, so that the system grows without rebuilding its core.

<details>
<summary>Acceptance criteria</summary>

- **AC-8.1** — Given a tool is added or removed, then the core components do not change; removing it reduces what the system can do and nothing else. _(evidence: [overview.md FS-2, FS-8](../architecture/overview.md#what-the-architecture-must-prove); [swap-tests.md SWAP-3](../conformance/swap-tests.md))_
- **AC-8.2** — Given a tool, then it describes itself, and the Agent Loop discovers it through the shared tool interface. _(evidence: [tools-spec.md](../architecture/tools-spec.md))_
- **AC-8.3** — Given a tool the model may not use, then the model can tell "this tool does not exist" apart from "this tool exists but is not permitted". _(evidence: [tools-spec.md](../architecture/tools-spec.md))_
- **AC-8.4** — Given the model asks for several independent tool calls at once, then they run at the same time, and text the model wrote alongside them is kept. _(evidence: [agent-loop-spec.md "What the Agent Loop Guarantees"](../architecture/agent-loop-spec.md#what-the-agent-loop-guarantees))_ Some blueprints make this optional: GAP-PAA-11.
- **AC-8.5** — Given a tool the owner does not trust, then it runs isolated from the owner's data and other tools. _(evidence: [security-spec.md](../architecture/security-spec.md); [tools-spec.md](../architecture/tools-spec.md))_

</details>

### The owner runs and controls it

#### US-9: Run on hardware the owner controls — Confirmed

As a developer, I want the system to run on the owner's own computer, offline if they choose, and private by default, so that ownership is real and not theoretical.

<details>
<summary>Acceptance criteria</summary>

- **AC-9.1** — Given a laptop, desktop or home server running Linux, macOS or Windows (x86_64 or ARM64, 8 GB RAM, 1 GB plus memory storage), then the system installs and runs with no outside account or licence activation. Local model hardware is the owner's separate choice. _(evidence: [deployment-spec.md "The Deployment Contract"](../architecture/deployment-spec.md#the-deployment-contract); FS-3)_
- **AC-9.2** — Given no internet connection and a local model and tools, then the system starts and a full exchange (message, model, tool calls, reply) completes. _(evidence: [deployment-spec.md](../architecture/deployment-spec.md); DEPLOY-1)_
- **AC-9.3** — Given a default install, then it accepts connections only from the same machine; reaching it from elsewhere needs the owner to turn that on. _(evidence: [deployment-spec.md "Network Posture"](../architecture/deployment-spec.md#network-posture); DEPLOY-3, DEPLOY-5)_ The two tests disagree on which local address counts: GAP-PAA-7.
- **AC-9.4** — Given normal operation, then nothing leaves the machine unless the owner configured it (a cloud model, an outside tool, a remote backup). _(evidence: [deployment-spec.md](../architecture/deployment-spec.md); DEPLOY-2, DEPLOY-4)_
- **AC-9.5** — Given a default install, then all four components and both APIs run as one unit with one start command. _(evidence: [deployment-spec.md "Single deployable unit by default"](../architecture/deployment-spec.md#5-single-deployable-unit-by-default))_

</details>

#### US-10: The owner controls who and what can act — Confirmed

As a developer, I want every request and every AI action checked against the owner's rules, so that the owner decides who and what can touch their data.

<details>
<summary>Acceptance criteria</summary>

- **AC-10.1** — Given a request with no valid identity, then it is refused. Given an identity, then it can act only within the permissions it was given. _(evidence: [auth-spec.md "Permissions"](../architecture/auth-spec.md#permissions))_
- **AC-10.2** — Given the owner's permission and approval rules, then the system enforces them. How strict the defaults are and how approvals look are the product's choice. _(evidence: [auth-spec.md](../architecture/auth-spec.md); [security-spec.md](../architecture/security-spec.md))_ The contracts do not yet define an approval step: GAP-PAA-16.
- **AC-10.3** — Given a new kind of actor (another person, an AI agent acting for the owner), then it can be added, and it gets no permissions until the owner grants them. The same holds for an identity re-created by an import: it has no access until the owner turns it back on (AC-3.5). _(evidence: [auth-spec.md](../architecture/auth-spec.md))_ The published identity definition only allows a fixed list: GAP-PAA-6.
- **AC-10.4** — Given an action, then it is recorded in an audit log; if the log cannot be written, work continues and the owner is alerted. _(evidence: [auth-spec.md "Failure modes"](../architecture/auth-spec.md#failure-modes); [security-spec.md](../architecture/security-spec.md))_
- **AC-10.5** — Given secrets (API keys, passwords), then they live outside Your Memory, somewhere git never tracks: environment variables, an untracked configuration file or a secret store. They are never in memory or tracked configuration files. _(evidence: [configuration-spec.md "Secrets"](../architecture/configuration-spec.md#secrets); [security-spec.md "Secrets Management"](../architecture/security-spec.md#secrets-management); `AGENT.md` lock-in check 5)_

</details>

#### US-11: Owner changes survive updates, and updates can be undone — Confirmed

As a developer, I want product updates to keep the owner's data and choices, so that updating never costs the owner anything.

<details>
<summary>Acceptance criteria</summary>

- **AC-11.1** — Given an update, then memory, preferences, conversations and access settings survive it. _(evidence: [deployment-spec.md "Update Principles"](../architecture/deployment-spec.md#update-principles))_
- **AC-11.2** — Given an update breaks the system, then the owner can go back to the previous working version, and their data still works with it. _(evidence: [deployment-spec.md "Update Principles"](../architecture/deployment-spec.md#update-principles))_
- **AC-11.3** — Given the owner changed something the product ships (instructions, preferences), then an update keeps the owner's change, and where the update conflicts with it, the owner is told instead of having it overwritten silently. _(evidence: [configuration-spec.md "Layered Overrides"](../architecture/configuration-spec.md#layered-overrides); [customization-spec.md](../architecture/customization-spec.md))_ How products keep shipped defaults and owner changes apart is not yet defined: GAP-PAA-14.
- **AC-11.4** — Given the owner's preferences and the product's defaults, then the owner's choice wins. On the owner's own hardware, no product rule overrides the owner. _(evidence: [configuration-spec.md "Layered Overrides"](../architecture/configuration-spec.md#layered-overrides))_

</details>

### How developers deliver the goal

#### US-12: Understand the architecture quickly — Confirmed

As a developer, I want to understand what the architecture is and why it exists in minutes, so that I can decide whether to build on it.

<details>
<summary>Acceptance criteria</summary>

- **AC-12.1** — Given the repository README, when a developer reads it, then they find what the architecture is, its licence (MIT), and links to the Architecture overview, the contracts, the blueprints, the AI primers, the conformance tests and the TypeScript template. _(evidence: `README.md`)_
- **AC-12.2** — Given the docs guide, then it offers a short "just browsing" route (README, principles, about) and a "ready to build" route (Architecture overview, implementer's reference, internal contract). _(evidence: [maintainers/documentation-guide.md](../README.md))_
- **AC-12.3** — Given the Architecture overview, then it names the four components, the two APIs and the three outside parties, says that Your Memory depends on nothing, and gives a responsibility table saying who does what and who does not. _(evidence: [overview.md](../architecture/overview.md), including "Responsibility Matrix")_
- **AC-12.4** — Every link on these routes opens the document it names. Broken links are gaps.

</details>

#### US-13: Know exactly what to build — Confirmed

As a developer, I want one authoritative definition of every component, endpoint and data shape, so that two people building from the architecture build things that work together.

<details>
<summary>Acceptance criteria</summary>

- **AC-13.1** — Given the implementer's reference, then it states what each of the four components and both APIs must do, the internal Gateway-to-Agent-Loop contract, and the IDs of the tests that check them. _(evidence: [implementers-reference.md](../build/implementers-reference.md))_
- **AC-13.2** — Given the `contracts/` folder, then it holds machine-readable definitions of the Gateway API, the internal contract, the Model API and the shared data types (configuration, identity, message, policy, tool definition). _(evidence: `contracts/openapi/`, `contracts/schemas/`)_
- **AC-13.3** — Given any other document (blueprint, primer, example, prose spec) that shows a shape, then it matches `contracts/`. Where they differ, `contracts/` wins and the difference is a gap to fix. _(evidence: `AGENT.md` "Key Contracts"; [arch-tests.md ARCH-4](../conformance/arch-tests.md))_ Today several differ: GAP-PAA-3, GAP-PAA-4, GAP-PAA-5, GAP-PAA-6.
- **AC-13.4** — Given a published example marked valid, then it passes the contract it illustrates; given one marked invalid, then it fails it. _(evidence: [contracts/examples/](../contracts/examples/README.md))_ The checker cannot run as published: GAP-PAA-2.

</details>

#### US-14: Build with an AI coding agent — Confirmed

As a developer, I want material I can hand straight to an AI coding agent, so that one person with AI help can build and maintain a whole system.

<details>
<summary>Acceptance criteria</summary>

- **AC-14.1** — Given the AI primers, then there is a condensed overview, one primer per component, a build order, a pass/fail compliance matrix, review checklists and common drift patterns. _(evidence: [build/primers/README.md](../build/primers/README.md), [foundation.md](../build/primers/foundation.md), [build-sequence.md](../build/build-sequence.md), [compliance-matrix.md](../build/compliance-matrix.md), `conformance/review-checklists/`, [failure-patterns.md](../build/failure-patterns.md))_
- **AC-14.2** — Given the blueprints, then each component has a blueprint, a contract pack, a test definition, a drift guard and a build prompt. _(evidence: [build/blueprints/README.md](../build/blueprints/README.md) and its per-component packages)_
- **AC-14.3** — Given a primer or blueprint, then it says where the authoritative source is and does not override `contracts/`. _(evidence: [build/primers/README.md](../build/primers/README.md))_ Today the internal-contract blueprint calls its own different shapes canonical: GAP-PAA-3.

</details>

#### US-15: Start from runnable code — Confirmed

As a developer, I want a runnable starting point that already follows the architecture, so that I can build my product instead of the plumbing.

<details>
<summary>Acceptance criteria</summary>

- **AC-15.1** — Given the TypeScript template, when a developer creates a repository from it and runs the documented setup, then it installs, starts on localhost only, works offline with a stand-in model, streams a reply to a message and stores the conversation. _(evidence: template:README.md "5-Minute Developer Onboarding")_
- **AC-15.2** — Given the template, then it ships its own contract, boundary and lock-in checks, and a config-only provider swap demo. _(evidence: template:package.json scripts check:conformance, acceptance:check, demo:provider-swap)_
- **AC-15.3** — Given the template's README and agent guide, then every document they name exists and every link opens. _(evidence: template:README.md)_ Today the Foundation spec link is broken and the first "source of truth" file, `plan.md`, is not in the repository: GAP-PAA-8.

</details>

#### US-16: Check that my implementation conforms — Confirmed

As a developer, I want published pass/fail tests, so that I can show my implementation keeps the architecture's promises.

<details>
<summary>Acceptance criteria</summary>

- **AC-16.1** — Given the conformance suite, then every test has an ID, set-up steps and pass/fail criteria, grouped as swap tests (SWAP-1 to SWAP-3), architecture tests (ARCH-1 to ARCH-9), deployment tests (DEPLOY-1 to DEPLOY-5) and Foundation story tests (FS-1 to FS-8). _(evidence: [conformance/](../conformance/README.md))_
- **AC-16.2** — Given the suite index, then it lists every test that exists and links only to things that exist. _(evidence: [conformance/README.md](../conformance/README.md))_
- **AC-16.3** — Given the lock-in gate and lock-in audit, then a developer can work through each check for a pull request or a release. _(evidence: [lockin-gate.md](../conformance/lockin-gate.md), [lockin-audit.md](../conformance/lockin-audit.md))_ The gate's `check:docs` command has no published tool: GAP-PAA-10.
- **AC-16.4** — An implementation that passes every test is conformant; passing some is not conformance. _(evidence: [conformance/README.md "How to Use"](../conformance/README.md#how-to-use))_

**In scope:** a conformance kit of language-neutral tests that every implementation and template must pass, whatever language it is written in. It grows from the suite above. Until it is published, the suite is worked through by hand. The contract gaps GAP-PAA-3 to GAP-PAA-7 limit what it can check until they are settled.

</details>

#### US-17: Build a product on the architecture — Confirmed

As a product builder, I want to make my own product (its methods, personality, tools and branded app) on the architecture, so that I get a working personal AI system without building the infrastructure or changing the architecture.

<details>
<summary>Acceptance criteria</summary>

- **AC-17.1** — Given a builder's own memory content (instructions, skills, folder structure, starter content), tools and configuration, then the system boots and behaves as their product, and no architecture contract changes. _(evidence: [customization-spec.md](../architecture/customization-spec.md))_
- **AC-17.2** — Given two products with different content on the same architecture, then each behaves according to its own content with no custom infrastructure code. _(evidence: [customization-spec.md](../architecture/customization-spec.md))_
- **AC-17.3** — Given a builder's custom tools, then they are discovered and usable with the Agent Loop unchanged. _(evidence: [customization-spec.md](../architecture/customization-spec.md); [tools-spec.md](../architecture/tools-spec.md))_
- **AC-17.4** — Given a branded client, then it connects through the Gateway API like any other client and can continue the same conversations; branding stays in the client. _(evidence: [customization-spec.md](../architecture/customization-spec.md))_
- **AC-17.5** — Given a builder starts a product, then they start from the published contracts and the TypeScript template, or from the stories and specs alone in any language; the architecture is not installed as a package. _(evidence: `CONTRIBUTING.md` "Scope"; `README.md` "What this is")_

</details>

#### US-18: Propose a change to the architecture — Confirmed

As a contributor, I want a clear way to change the architecture, so that the specs, contracts and guides stay in step and nobody quietly rewrites the rules to match code.

<details>
<summary>Acceptance criteria</summary>

- **AC-18.1** — Given a contributor, then CONTRIBUTING.md explains how to propose documentation, contract and specification changes by pull request. _(evidence: `CONTRIBUTING.md`)_
- **AC-18.2** — Given an architecture change, then it starts in the specs; contracts follow shape changes, derived guides and primers are updated, and new rules get conformance test IDs. _(evidence: [guides-spec.md "Update Rules"](../maintainers/guides-spec.md#update-rules))_
- **AC-18.3** — Given code that has drifted from the specs, then the code is fixed or a spec change is proposed and reviewed. Specs are never rewritten just to match code. _(basis: maintainers' decision)_
- **AC-18.4** — Given every governed document, then it is in the document registry with its dependencies, and a stale document is flagged. _(evidence: [doc-maintenance-spec.md](../maintainers/doc-maintenance-spec.md); [doc-registry.json](../maintainers/doc-registry.json))_ The freshness check named by the gate is not published: GAP-PAA-10.

</details>

## Requirements

### Functional requirements

- [ ] Your Memory has no outward dependencies; every component reaches it only through tools.
- [ ] Changing a model, a provider or a tool needs configuration changes only (the three swap tests).
- [ ] Runtime configuration has exactly four fields: `memory_root`, `provider_adapter`, `auth_mode`, `tool_sources`. Preferences live in Your Memory; secrets live outside Your Memory, somewhere git never tracks.
- [ ] `contracts/` is the single authoritative definition of every API and shared data shape.
- [ ] Anything a system cannot support after a move (a preference, a tool, a permission rule, a model ability) is reported, never dropped silently and never turned into extra access.

### Data, memory and artifact contract

| Data / artifact | Owner | Read / write rule | Retention |
|---|---|---|---|
| Your Memory (files, preferences, skills, conversations, history) | Owner | Through tools only; readable with ordinary tools when the system is stopped | Until the owner deletes it; history kept |
| Permission and identity records | Owner | Managed through Auth tools; exported without credentials; re-created identities have no access until the owner turns it back on | Moves with memory |
| Credentials and secrets | Owner | Outside Your Memory, never tracked by git (environment variables, an untracked config file or a secret store) | Re-created on a new system |
| Runtime configuration | Implementation | Four fields; set by whoever runs the system | Per install |
| Derived data (indexes, embeddings) | Implementation | Optional to export | Rebuilt from source |

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
| An update breaks the system | The previous version is available and works with the owner's data (AC-11.2). |
| The audit log cannot be written | Work continues and the owner is alerted (AC-10.4). |
| An unknown or re-created actor appears | It has no permissions until the owner grants them (AC-3.5, AC-10.3). |

### Non-negotiable trust boundaries

- [ ] The owner can always get all of their memory out, in open formats.
- [ ] Nothing leaves the owner's machine unless the owner configured it.
- [ ] Remote access is off until the owner turns it on.
- [ ] Secrets never enter memory or tracked configuration.
- [ ] Owner changes are never silently overwritten by an update.
- [ ] The architecture never requires a particular vendor, cloud service or product.

## Companion documents

- **Inherits:** none. The architecture is product-independent by design and sits beneath every implementation. Basis: the "Architecture" and "Implementation" entries in the [Architecture overview glossary](../architecture/overview.md#glossary) and `AGENT.md` "Vocabulary".
- **Technical authority:** the specifications, contracts and conformance tests in this repository. Detailed mechanics stay there; this spec adds no technical rules.
- **Implementations:** every implementation, BrainDrive included, inherits these promises.
- **Gaps:** [personal-ai-architecture-gaps.md](./personal-ai-architecture-gaps.md).
- **Evaluation plan:** the conformance kit (US-16).

## Approval

Accepted by pull request in this repository, then tagged. Tag: `paa-spec/2026-10-20`.

## Contract alignment

The canonical contract tree under `contracts/` is authoritative for exact payloads,
routes, shared message parts, and stream events. Identity status and extensible actor
types, the per-request model, and structured message content are now represented in
the published contracts. Remaining open contract questions are tracked in the gaps
file, including approval lifecycle, transport-neutral identity propagation (S5),
tool-definition semantics (S8), and the still-to-be-finalized correlation/streaming
details.
