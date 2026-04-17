# Documentation Guide

> **New here?** Start with the [project README](https://github.com/Personal-AI-Architecture/the-architecture#readme) for a quick overview, then come back here to go deeper.

The Personal AI Architecture is thoroughly documented — specs, primers, blueprints, conformance tests, and more. This guide helps you find what you need without getting lost.

---

## Just Browsing (5 minutes)

Understand what this is and why it exists.

| Document | What you'll learn |
|----------|-------------------|
| [README](https://github.com/Personal-AI-Architecture/the-architecture#readme) | What PAA is, quick start, architecture diagram |
| [Principles](principles.md) | The 5 rules everything follows — memory independence, swappability, zero lock-in |
| [About](about.md) | Origin story — why we built this and what problem it solves |

---

## Ready to Build (30 minutes)

Understand the architecture well enough to implement it.

| Document | What you'll learn |
|----------|-------------------|
| [Foundation Spec](foundation-spec.md) | **Start here.** The complete architecture — four components, two APIs, memory as platform, invariants |
| [Implementer's Reference](guides/implementers-reference.md) | Condensed version — just the contracts, no rationale. "Tell me what to build." |
| [Gateway-Engine Contract](gateway-engine-contract.md) | The internal handoff between Gateway and Agent Loop — the key boundary |

**Formal specs** (OpenAPI + JSON Schema) are in [`specs/`](https://github.com/Personal-AI-Architecture/the-architecture/tree/main/specs):
- `openapi/gateway-api.yaml` — client-facing API
- `openapi/gateway-engine.yaml` — internal contract
- `openapi/model-api.yaml` — model provider API
- `schemas/` — configuration, identity, message, policy, tool definition

---

## Going Deep on a Component

Each component has a dedicated spec. Read the foundation spec first, then the component you're working on.

| Component | Spec | What it covers |
|-----------|------|----------------|
| **Your Memory** | [memory-spec.md](memory-spec.md) | Owner-controlled storage, zero outbound dependencies, portability, inspectability |
| **Gateway** | [gateway-spec.md](gateway-spec.md) | Conversation management, routing, client boundary, content-agnostic |
| **Agent Loop** | [engine-spec.md](engine-spec.md) | AI reasoning cycle — model calls, tool execution, no product logic |
| **Auth** | [auth-spec.md](auth-spec.md) | Identity, authorization, permissions, cross-cutting boundary |
| **Tools** | [tools-spec.md](tools-spec.md) | Callable capabilities (verbs), tool definitions, execution model |
| **Models** | [models-spec.md](models-spec.md) | External intelligence via Model API — not an architectural component |
| **Adapters** | [adapter-spec.md](adapter-spec.md) | Thin translation layers between internal interfaces and external protocols |
| **Configuration** | [configuration-spec.md](configuration-spec.md) | Preferences vs runtime config vs tool self-description |
| **Deployment** | [deployment-spec.md](deployment-spec.md) | Local-first, runs on owned hardware, no cloud required |
| **Security** | [security-spec.md](security-spec.md) | Threat mitigation, data protection, audit trails |
| **Customization** | [customization-spec.md](customization-spec.md) | How implementations extend via content/config, not code modification |

---

## Hand It to Your AI

The **AI Primer** ([`docs/ai/`](ai/)) is a set of token-optimized files designed to be handed directly to an AI agent — for building on the architecture, reviewing implementations, or running compliance audits.

**How to use it:** Copy the files your AI needs into its context. Start with `foundation.md`, add the component primer for whatever you're working on, and include `compliance-matrix.md` if you want it to check its own work.

| Start with | What it gives your AI |
|------------|----------------------|
| [ai/foundation.md](ai/foundation.md) | Compressed architecture overview — system shape, invariants, component boundaries |
| [ai/compliance-matrix.md](ai/compliance-matrix.md) | Pass/fail rules for auditing implementations |
| [ai/build-sequence.md](ai/build-sequence.md) | Recommended implementation order |
| Component primers (e.g. [ai/gateway.md](ai/gateway.md)) | Focused context for the component being built or reviewed |

**Also in the primer:**
- `ai/examples/` — canonical JSON payloads (valid + invalid pairs) for client requests, configs, approvals
- `ai/review-checklists/` — targeted review checklists per component
- `ai/failure-patterns.md` — common drift symptoms your AI can watch for
- `ai/decision-glossary.md` — shared terminology for consistent review language

Full primer index: [ai/index.md](ai/index.md)

---

## Blueprints (Execution Packages)

The [`blueprints/`](blueprints/) directory contains everything needed to implement each component:

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
| [Foundation Verification](foundation-verification.md) | Implementation-agnostic checklist — does it meet the claims? |
| [Zero Lock-In Checklist](zero-lockin-checklist.md) | Three levels of enforcement: PR gate, milestone audit, verification |
| [Lock-In Gate](lockin-gate.md) | Mandatory PR checklist — run before every merge |
| [Lock-In Audit](lockin-audit.md) | Comprehensive milestone/release audit |
| [Conformance Suite](guides/conformance/) | Test categories: architecture, deployment, filesystem, swappability |

---

## Research & Background

Deeper thinking behind the design decisions.

| Document | What it covers |
|----------|---------------|
| [Memory as Platform](memory-as-platform.md) | Why memory-as-platform is the foundation of personal ownership |
| [Ecosystem Concept](research/ecosystem-concept.md) | Three-level model: architecture → implementation → personalization |
| [Lock-In Analysis](research/lock-in-analysis.md) | How each component avoids lock-in |
| [Human Equivalents](research/human-equivalents.md) | Human metaphors for architecture concepts |
| [Memory-Tool Completeness](research/memory-tool-completeness.md) | Proof that memory + tools covers all system needs |
| [Communication Principles](communication-principles.md) | Communication as a replaceable component |

---

## See It In Action

[BrainDrive](https://github.com/BrainDriveAI/BrainDrive) is the first full implementation of this architecture — a personal AI system for goal-setting and self-improvement. MIT licensed, self-hosted, model-agnostic.
