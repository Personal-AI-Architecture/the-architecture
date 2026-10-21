# Documentation Guide

> **New here?** Start with the [project README](https://github.com/Personal-AI-Architecture/the-architecture#readme) for a quick overview, then come back here to go deeper.

The Personal AI Architecture is documented across three folders. Pick the one that matches how you want to read.

---

## Three Folders

| Folder | For | What's in it |
|--------|-----|-------------|
| [`architecture/`](../architecture/) | Humans who want the full explanation | All architecture specs, principles, lockin gates, conformance tests, the implementer's reference, and supporting research |
| [`build/primers/`](../build/primers/) | AI agents | Token-optimized primers — same content, condensed for context windows. Hand these to your AI when building, reviewing, or auditing |
| [`build/blueprints/`](../build/blueprints/) | Implementers building a component | Per-component execution packages — blueprint + contract schema + conformance tests + drift guard + implementation prompt |

---

## Just Browsing (5 minutes)

Understand what this is and why it exists.

| Document | What you'll learn |
|----------|-------------------|
| [README](https://github.com/Personal-AI-Architecture/the-architecture#readme) | What PAA is, quick start, architecture diagram |
| [Principles](../architecture/principles.md) | The 5 rules everything follows — memory independence, swappability, zero lock-in |
| [About](../architecture/background/about.md) | Origin story — why we built this and what problem it solves |

---

## Ready to Build (30 minutes)

Understand the architecture well enough to implement it.

| Document | What you'll learn |
|----------|-------------------|
| [Architecture Overview](../architecture/overview.md) | **Start here.** How it works in six steps, the four components and two APIs, and who does what |
| [Implementer's Reference](../build/implementers-reference.md) | Condensed contracts — "tell me what to build," no rationale |
| [Gateway ↔ Agent Loop Contract](../architecture/gateway-agent-loop-contract.md) | The internal handoff between Gateway and Agent Loop — the key boundary |

**Formal specs** (OpenAPI + JSON Schema) live in [`contracts/`](https://github.com/Personal-AI-Architecture/the-architecture/tree/main/contracts):
- `openapi/gateway-api.yaml` — client-facing API
- `openapi/gateway-engine.yaml` — internal contract
- `openapi/model-api.yaml` — Model API
- `schemas/` — configuration, identity, message, policy, tool definition

---

## Going Deep on a Component

Each component has a dedicated spec. Read the foundation spec first, then the component you're working on.

| Component | Spec | What it covers |
|-----------|------|----------------|
| **Your Memory** | [memory-spec.md](../architecture/memory-spec.md) | Owner-controlled storage, zero outbound dependencies, portability, inspectability |
| **Gateway** | [gateway-spec.md](../architecture/gateway-spec.md) | Conversation management, routing, client boundary, content-agnostic |
| **Agent Loop** | [agent-loop-spec.md](../architecture/agent-loop-spec.md) | AI reasoning cycle — model calls, tool execution, no product logic |
| **Auth** | [auth-spec.md](../architecture/auth-spec.md) | Identity, authorization, permissions, cross-cutting boundary |
| **Tools** | [tools-spec.md](../architecture/tools-spec.md) | Callable capabilities (verbs), tool definitions, execution model |
| **Models** | [models-spec.md](../architecture/models-spec.md) | External intelligence via Model API — not an architectural component |
| **Adapters** | [adapter-spec.md](../architecture/adapter-spec.md) | Thin translation layers between internal interfaces and external protocols |
| **Configuration** | [configuration-spec.md](../architecture/configuration-spec.md) | Preferences vs runtime config vs tool self-description |
| **Deployment** | [deployment-spec.md](../architecture/deployment-spec.md) | Local-first, runs on owned hardware, no cloud required |
| **Security** | [security-spec.md](../architecture/security-spec.md) | Threat mitigation, data protection, audit trails |
| **Customization** | [customization-spec.md](../architecture/customization-spec.md) | How implementations extend via content/config, not code modification |

---

## Hand It to Your AI

The **AI Agent Docs** ([`build/primers/`](../build/primers/)) are a set of token-optimized files designed to be handed directly to an AI agent — for building on the architecture, reviewing implementations, or running compliance audits.

**How to use:** Copy the files your AI needs into its context. Start with `foundation.md`, add the component primer for whatever you're working on, and include `compliance-matrix.md` if you want it to check its own work.

| Start with | What it gives your AI |
|------------|----------------------|
| [build/primers/foundation.md](../build/primers/foundation.md) | Compressed architecture overview — system shape, invariants, component boundaries |
| [build/primers/compliance-matrix.md](../build/compliance-matrix.md) | Pass/fail rules for auditing implementations |
| [build/primers/build-sequence.md](../build/build-sequence.md) | Recommended implementation order |
| Component primers (e.g. [build/primers/gateway.md](../build/primers/gateway.md)) | Focused context for the component being built or reviewed |

**Also in this folder:**
- `examples/` — canonical JSON payloads (valid + invalid pairs) for client requests, configs, approvals
- `review-checklists/` — targeted review checklists per component
- `failure-patterns.md` — common drift symptoms your AI can watch for
- `decision-glossary.md` — shared terminology for consistent review language

Full primer index: [build/primers/README.md](../build/primers/README.md)

---

## Blueprints (Execution Packages)

The [`build/blueprints/`](../build/blueprints/) folder contains everything needed to implement each component:

| Subdirectory | What's in it |
|--------------|-------------|
| Root (`*.md`) | 15 component blueprints — spec summary, schema, test requirements |
| `contracts/` | 14 JSON schemas — one per component/boundary |
| `tests/` | 15 conformance test definitions — pass/fail criteria |
| `drift/` | 15 drift guards — detect architecture deviation per component |
| `prompts/` | 14 implementation prompts — hand to an AI to build each component |

---

## Verification & Governance

How to verify an implementation meets the architecture.

| Document | What it's for |
|----------|--------------|
| [PAA Product Spec](../spec/personal-ai-architecture-spec.md) | User stories and acceptance criteria: what every implementation must deliver |
| [Foundation Verification](../conformance/foundation-verification.md) | Implementation-agnostic checklist — does it meet the claims? |
| [Zero Lock-In Checklist](../conformance/zero-lockin-checklist.md) | Three levels of enforcement: PR gate, milestone audit, verification |
| [Lock-In Gate](../conformance/lockin-gate.md) | Mandatory PR checklist — run before every merge |
| [Lock-In Audit](../conformance/lockin-audit.md) | Comprehensive milestone/release audit |
| [Conformance Suite](../conformance/) | Test categories: architecture, deployment, filesystem, swappability |

---

## Research & Background

Deeper thinking behind the design decisions.

| Document | What it covers |
|----------|---------------|
| [Memory as Platform](../architecture/background/memory-as-platform.md) | Why memory-as-platform is the foundation of personal ownership |
| [Lock-In Analysis](../architecture/background/lock-in-analysis.md) | How each component avoids lock-in |
| [Memory-Tool Completeness](../architecture/background/memory-tool-completeness.md) | Proof that memory + tools covers all system needs |
| [Communication Principles](../architecture/communication-principles.md) | Communication as a replaceable component |
| [Foundation Decisions](../architecture/decisions.md) | The decisions that define the architecture, and why |

---

## See It In Action

[BrainDrive](https://github.com/BrainDriveAI/BrainDrive) is the first full implementation of this architecture — a personal AI system for goal-setting and self-improvement. MIT licensed, self-hosted, model-agnostic.
