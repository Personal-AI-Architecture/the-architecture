# Documentation Guide

> **New here?** Start with the [project README](https://github.com/Personal-AI-Architecture/the-architecture#readme) for a quick overview, then come back here to go deeper.

The Personal AI Architecture is documented across three folders. Pick the one that matches how you want to read.

---

## Three Folders

| Folder | For | What's in it |
|--------|-----|-------------|
| [`in-depth-overview/`](in-depth-overview/) | Humans who want the full explanation | All architecture specs, principles, lockin gates, conformance tests, the implementer's reference, and supporting research |
| [`ai-agent-docs/`](ai-agent-docs/) | AI agents | Token-optimized primers — same content, condensed for context windows. Hand these to your AI when building, reviewing, or auditing |
| [`blueprints/`](blueprints/) | Implementers building a component | Per-component execution packages — blueprint + contract schema + conformance tests + drift guard + implementation prompt |

---

## Just Browsing (5 minutes)

Understand what this is and why it exists.

| Document | What you'll learn |
|----------|-------------------|
| [README](https://github.com/Personal-AI-Architecture/the-architecture#readme) | What PAA is, quick start, architecture diagram |
| [Principles](in-depth-overview/principles.md) | The 5 rules everything follows — memory independence, swappability, zero lock-in |
| [About](in-depth-overview/about.md) | Origin story — why we built this and what problem it solves |

---

## Ready to Build (30 minutes)

Understand the architecture well enough to implement it.

| Document | What you'll learn |
|----------|-------------------|
| [Foundation Spec](in-depth-overview/foundation-spec.md) | **Start here.** The complete architecture — four components, two APIs, memory as platform, invariants |
| [Implementer's Reference](in-depth-overview/implementers-reference.md) | Condensed contracts — "tell me what to build," no rationale |
| [Gateway-Engine Contract](in-depth-overview/gateway-engine-contract.md) | The internal handoff between Gateway and Agent Loop — the key boundary |

**Formal specs** (OpenAPI + JSON Schema) live in [`specs/`](https://github.com/Personal-AI-Architecture/the-architecture/tree/main/specs):
- `openapi/gateway-api.yaml` — client-facing API
- `openapi/gateway-engine.yaml` — internal contract
- `openapi/model-api.yaml` — model provider API
- `schemas/` — configuration, identity, message, policy, tool definition

---

## Going Deep on a Component

Each component has a dedicated spec. Read the foundation spec first, then the component you're working on.

| Component | Spec | What it covers |
|-----------|------|----------------|
| **Your Memory** | [memory-spec.md](in-depth-overview/memory-spec.md) | Owner-controlled storage, zero outbound dependencies, portability, inspectability |
| **Gateway** | [gateway-spec.md](in-depth-overview/gateway-spec.md) | Conversation management, routing, client boundary, content-agnostic |
| **Agent Loop** | [engine-spec.md](in-depth-overview/engine-spec.md) | AI reasoning cycle — model calls, tool execution, no product logic |
| **Auth** | [auth-spec.md](in-depth-overview/auth-spec.md) | Identity, authorization, permissions, cross-cutting boundary |
| **Tools** | [tools-spec.md](in-depth-overview/tools-spec.md) | Callable capabilities (verbs), tool definitions, execution model |
| **Models** | [models-spec.md](in-depth-overview/models-spec.md) | External intelligence via Model API — not an architectural component |
| **Adapters** | [adapter-spec.md](in-depth-overview/adapter-spec.md) | Thin translation layers between internal interfaces and external protocols |
| **Configuration** | [configuration-spec.md](in-depth-overview/configuration-spec.md) | Preferences vs runtime config vs tool self-description |
| **Deployment** | [deployment-spec.md](in-depth-overview/deployment-spec.md) | Local-first, runs on owned hardware, no cloud required |
| **Security** | [security-spec.md](in-depth-overview/security-spec.md) | Threat mitigation, data protection, audit trails |
| **Customization** | [customization-spec.md](in-depth-overview/customization-spec.md) | How implementations extend via content/config, not code modification |

---

## Hand It to Your AI

The **AI Agent Docs** ([`ai-agent-docs/`](ai-agent-docs/)) are a set of token-optimized files designed to be handed directly to an AI agent — for building on the architecture, reviewing implementations, or running compliance audits.

**How to use:** Copy the files your AI needs into its context. Start with `foundation.md`, add the component primer for whatever you're working on, and include `compliance-matrix.md` if you want it to check its own work.

| Start with | What it gives your AI |
|------------|----------------------|
| [ai-agent-docs/foundation.md](ai-agent-docs/foundation.md) | Compressed architecture overview — system shape, invariants, component boundaries |
| [ai-agent-docs/compliance-matrix.md](ai-agent-docs/compliance-matrix.md) | Pass/fail rules for auditing implementations |
| [ai-agent-docs/build-sequence.md](ai-agent-docs/build-sequence.md) | Recommended implementation order |
| Component primers (e.g. [ai-agent-docs/gateway.md](ai-agent-docs/gateway.md)) | Focused context for the component being built or reviewed |

**Also in this folder:**
- `examples/` — canonical JSON payloads (valid + invalid pairs) for client requests, configs, approvals
- `review-checklists/` — targeted review checklists per component
- `failure-patterns.md` — common drift symptoms your AI can watch for
- `decision-glossary.md` — shared terminology for consistent review language

Full primer index: [ai-agent-docs/index.md](ai-agent-docs/index.md)

---

## Blueprints (Execution Packages)

The [`blueprints/`](blueprints/) folder contains everything needed to implement each component:

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
| [Foundation Verification](in-depth-overview/foundation-verification.md) | Implementation-agnostic checklist — does it meet the claims? |
| [Zero Lock-In Checklist](in-depth-overview/zero-lockin-checklist.md) | Three levels of enforcement: PR gate, milestone audit, verification |
| [Lock-In Gate](in-depth-overview/lockin-gate.md) | Mandatory PR checklist — run before every merge |
| [Lock-In Audit](in-depth-overview/lockin-audit.md) | Comprehensive milestone/release audit |
| [Conformance Suite](in-depth-overview/conformance/) | Test categories: architecture, deployment, filesystem, swappability |

---

## Research & Background

Deeper thinking behind the design decisions.

| Document | What it covers |
|----------|---------------|
| [Memory as Platform](in-depth-overview/memory-as-platform.md) | Why memory-as-platform is the foundation of personal ownership |
| [Lock-In Analysis](in-depth-overview/lock-in-analysis.md) | How each component avoids lock-in |
| [Memory-Tool Completeness](in-depth-overview/memory-tool-completeness.md) | Proof that memory + tools covers all system needs |
| [Communication Principles](in-depth-overview/communication-principles.md) | Communication as a replaceable component |

---

## See It In Action

[BrainDrive](https://github.com/BrainDriveAI/BrainDrive) is the first full implementation of this architecture — a personal AI system for goal-setting and self-improvement. MIT licensed, self-hosted, model-agnostic.
