---
hide_table_of_contents: true
---

# Deployment Spec: Where the System Lives

Every AI system runs somewhere — a cloud server, a laptop, a container, a managed platform. Most AI systems choose for you. Your data lives on their servers, your AI runs on their infrastructure, your options are limited to what they offer. Want to run it yourself? Too bad — the architecture assumes their cloud, their database, their network. Moving means rebuilding.

Here, the system **can always run on hardware you physically control.** Your laptop, your desktop, your home server. The architecture assumes nothing about what's beyond your machine — no cloud services required, no third-party accounts needed, no internet connection assumed. Everything the system needs to function can exist on a single computer you own. You might choose managed hosting, cloud models, or remote access — but those are choices, not requirements. The local path always exists, and that's what makes every other choice a real choice. You can leave anytime because the system runs without them.

Why this matters: in a biological system, your brain lives in your skull — you control the hardware by definition. For a digital brain, that's not automatic. Most AI systems put your brain on their servers — your memory, your conversations, your intelligence, all on hardware you'll never touch. This architecture says: your digital brain lives on your hardware. The promises elsewhere — own your Memory, swap your components, no lock-in — are theoretical if the system can only run on someone else's infrastructure. Deployment is where ownership becomes concrete. You can verify it by unplugging the ethernet cable.

This spec defines the **deployment contract** — the guarantees the architecture makes about where and how the system can run. Not how to deploy (implementation) or managed hosting options (Level 2).

> **Level 1 (Foundation):** Local deployment on hardware the owner controls. Managed hosting, VPS/cloud deployment, and remote access are Level 2 concerns — opinions layered on top of this contract.

**Related documents:** [foundation-spec.md](./foundation-spec.md) (architecture overview, links to all component specs)

---

## The Deployment Contract

Five guarantees that any valid deployment of the Personal AI Architecture must honor.

### 1. Runs on hardware you control

The system must run on a computer the owner physically controls. No remote service is required to start, operate, or shut down the system. "Physically controls" means the owner has root/admin access to the machine and can inspect, modify, or disconnect it at any time. The local deployment path must always exist — additional deployment options are Level 2 conveniences layered on top.

### 2. Functions fully offline

The system must be capable of operating with zero internet connectivity. This means:

- The system starts without network access
- The Engine connects to a model through the Provider API — that model can be local
- Tools execute without requiring external services (tools that call external APIs are optional additions, not requirements)
- Your Memory is fully accessible
- Auth works locally

The contract requires that **a fully offline path exists** — not that every deployment is offline. An owner who uses cloud models is making a valid choice, but the architecture must never require it.

What "functional" means: the full agent loop completes (message → model → tool calls → response) without any network traffic. The model may be less capable. The tool set may be smaller. But the system works.

### 3. Data stays local by default

Your Memory, conversations, auth data, and configuration are stored on the local machine. Nothing leaves the machine — no outbound network calls on startup or during operation — unless the owner has explicitly configured it: a cloud model provider, an external tool, a remote backup.

### 4. Runs on modern consumer hardware

The system must run on hardware that a typical person already owns:

| Requirement | Minimum |
|-------------|---------|
| **CPU** | x86_64 or ARM64 |
| **RAM** | 8 GB (system only — local models may need more) |
| **Storage** | 1 GB for the system + space for Your Memory |
| **OS** | Linux, macOS, or Windows |

Local models have their own hardware requirements (RAM, GPU) that are outside this contract — they depend on which model the owner chooses. The system itself must not impose hardware requirements beyond what's listed above.

### 5. Single deployable unit by default

All four components (Your Memory, Engine, Auth, Gateway) and both connectors (Gateway API, Provider API) deploy together on one machine as a single unit. One install, one start command, one thing to manage.

Splitting components across machines is allowed but not required — the single-unit deployment is the default. Split patterns are a Level 2 concern.

---

## External Dependencies

The system has external dependencies. Zero-lock-in doesn't mean zero dependencies — it means no dependency is inescapable. For each critical external dependency, the contract defines an escape path.

### Critical Dependencies

These are dependencies that could prevent the system from functioning if they disappeared.

#### Model Provider

**What it is:** The system needs an AI model to function. Models are accessed through the Provider API via adapters (see [adapter-spec.md](./adapter-spec.md)).

**The dependency:** Whether local (Ollama, llama.cpp) or cloud (OpenRouter, Anthropic), the owner depends on a model provider.

**Escape path:** The Provider API adapter pattern makes switching providers a config change, not a code change (D147). Cloud to cloud, cloud to local, local to local — the swap cost is one adapter file. No single provider can hold the system hostage because the architecture is designed to swap between them. The offline contract (guarantee #2) ensures a local path always exists.

**Lock-in risk:** Low — architectural. The adapter pattern eliminates protocol lock-in. The remaining risk is capability lock-in (a weaker local model can't do what a cloud model can), which is an industry constraint, not an architecture constraint.

#### Container Runtime

**What it is:** Docker (OCI-compatible containers) is the default deployment vehicle (D14).

**The dependency:** The system ships as container images. Running it requires a container runtime.

**Escape path:** The system is software that runs in containers — it is not a container-native application. The components are standard programs (TypeScript/Node.js processes, HTTP servers, file I/O) that run natively without containers. Docker is the packaging, not the architecture.

**Lock-in risk:** Low — packaging. OCI is an open standard with multiple runtimes (Docker, Podman, containerd). No container-specific features (orchestration, service mesh) are used.

### Non-Critical Dependencies

These affect capability but not function.

| Dependency | What it provides | Without it |
|-----------|-----------------|------------|
| **Internet connectivity** | Access to cloud model providers, external tool APIs, package updates | System runs fully offline with local models and local tools |
| **MCP protocol** | Default tool communication standard | Tools can use manifest files or native function interfaces. MCP is default, not required (D32). |
| **Specific programming runtime** (Node.js) | Current implementation language | The architecture is language-agnostic. A Rust or Python implementation would honor the same contracts. Implementation language is not a contract concern. |

---

## What the Deployment Contract Does NOT Cover

These are explicitly out of scope for Level 1. Products built on the foundation (Level 2) address these.

| Topic | Why it's not Level 1 |
|-------|---------------------|
| **Managed hosting** | A product decision — "we run it for you" is an opinion on deployment, not a deployment contract (D111) |
| **VPS / cloud self-hosting** | Deployment on hardware you don't physically control is a Level 2 concern |
| **Remote access** | Accessing the system from outside your local network requires network exposure, which is a product/security decision |
| **Update mechanics** | How updates are delivered and applied is implementation-specific |
| **Backup and restore** | A product feature, not a deployment contract |
| **Multi-instance** | Running multiple instances on one machine is a product pattern |
| **System lifecycle** | Startup sequences, crash recovery, auto-restart are operational details |
| **Data boundaries** | What data is allowed to leave the machine is a security concern (see [security-spec.md](./security-spec.md)) |

---

## Network Posture

The system listens on **localhost only** by default. No port is exposed to the network unless the owner explicitly configures it.

This means:

- The Gateway API listens on `localhost:PORT` — accessible only from the same machine
- No UPnP, no automatic port forwarding, no discovery broadcasts
- External access (LAN, internet) requires the owner to explicitly configure port binding, reverse proxy, or tunnel

This is a security default, not a limitation.

---

## Software Trust

You control the hardware — but you also need to trust what's running on it. The deployment contract requires that the owner can verify the software is authentic and untampered. It does not prescribe the mechanism.

Possible mechanisms (implementation decisions, not contract requirements):
- Signed container images with verifiable signatures
- Published checksums for release artifacts
- Reproducible builds from open source code

If you can't verify what you're running, you can't trust what you're running. Open source (the code is readable) is necessary but not sufficient — you also need to know that what you're running matches what you read.

---

## Update Principles

Updates must never compromise the owner's data or control. Two principles — mechanics are Level 2.

1. **Never risk data loss.** Your Memory, preferences, conversations, and auth data must survive any update. An update that could destroy or corrupt owner data is a broken update.

2. **Always reversible.** If an update breaks the system, the owner must be able to return to the previous working state. The previous version must remain available and the owner's data must be compatible with it.

---

## Storage Contract

The system requires persistent storage for Your Memory, conversations, auth data, and configuration. The deployment contract defines what storage must support — not how it's implemented.

| Capability | What it means |
|-----------|--------------|
| **Read** | Retrieve stored data by path or identifier |
| **Write** | Create or update stored data |
| **Search** | Find data by content or metadata |
| **Version** | Track changes over time (at minimum: know when something last changed) |

The current implementation uses the local filesystem for Your Memory and SQLite for conversations. These are implementation choices that satisfy the abstract contract. The contract does not require a specific storage technology — it requires the four capabilities above.

One additional constraint: **Your Memory must be inspectable without the system running.** The owner must be able to read their own data using standard tools (text editor, file browser, database viewer) — not just through the system's APIs. This prevents storage implementations from making data opaque or proprietary. A future implementation could use a different storage backend (encrypted filesystem, structured database) as long as the owner retains the ability to inspect and extract their data independently of the system.

---

## Acceptance Criteria

These verify that an implementation honors the deployment contract.

- [ ] The system starts and completes a full agent loop (message → model → tool → response) on a machine with no internet connectivity, using a local model
- [ ] The system runs on Linux, macOS, and Windows on modern consumer hardware (8GB RAM, x86_64 or ARM64)
- [ ] No outbound network calls (beyond localhost/loopback) occur during startup unless the owner has configured a network-dependent component (e.g., cloud model provider)
- [ ] The Gateway API is not reachable from other machines on the network in the default configuration
- [ ] Your Memory is stored on the local machine and is inspectable without the system running using standard tools (text editor, file browser, database viewer)
- [ ] Swapping from a cloud model provider to a local model provider requires only configuration changes — no code changes (per D147)
- [ ] The system runs as a single deployable unit with a single start command
- [ ] An update to the system does not modify, delete, or corrupt any existing Memory, preference, or conversation data

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D14 | Docker-first deployment for V1 | Containers provide isolation, reproducibility, and cross-platform support. Docker is the default packaging, not an architectural requirement. |
| D22 | Auth on both local and managed hosting | Auth is a memory concern (who can access your system), not a hosting concern. Even local deployments need auth for remote access scenarios and future multi-actor support. Under D148, managed hosting specifics are defined at Level 2. |
| D23 | Managed hosting is stricter, not just easier | Same code, different configuration. Managed hosting restricts tool access and enforces policies through configuration, not code forks. |
| D29 | Zero lock-in by design | Risks are implementation discipline, not architectural. The deployment contract enforces this at the infrastructure level. |
| D111 | Managed hosting is a deployment option, not a level | The same stack runs locally or hosted. Managed hosting is a Level 2 product decision — a convenience offered on top of the Level 1 foundation. |
| D148 | Level 1 defines local deployment only — managed hosting is Level 2 | The foundation defines how the system runs on hardware the owner controls. Managed hosting, VPS, and cloud hosting are Level 2 product offerings. |

---

## Open Questions

### ~~OQ-1: Docker Desktop licensing on macOS/Windows~~ — RESOLVED

**Resolution:** Owner's concern. The spec already establishes OCI as an open standard with multiple runtimes (Docker, Podman, containerd). The foundation doesn't prescribe Docker Desktop — it prescribes OCI containers. Licensing for a specific runtime is the owner's responsibility, same as any other software on their machine.

### ~~OQ-2: Local model minimum viability~~ — RESOLVED

**Resolution:** The loop must complete. Quality is the owner's concern — they choose the model. The deployment contract guarantees capability (the system functions offline with a local model), not quality. Defining a quality bar would be an opinion on model selection, which contradicts the architecture's model-agnostic stance.

### ~~OQ-3: Port assignment convention~~ — RESOLVED

**Resolution:** Level 2 product choice. The foundation defines that the Gateway listens on localhost (Network Posture section) but does not prescribe a port number. Each product built on the foundation chooses its own default. Port assignment is configuration, not architecture.

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-01 | "No users, only owners" language pass: multi-user → multi-actor (per D151) | Ownership model alignment (Dave W + Claude) |
| 2026-03-01 | Brain analogy added to intro (skull vs servers). Conciseness pass: merged duplicate paragraphs in guarantees, trimmed L2 asides, tightened Container Runtime/Software Trust/Update Principles/Network Posture. | Dave W + Claude |
| 2026-02-27 | Initial deployment spec created from interview | Deployment interview session (Dave W + Claude) |

---

*The deployment contract is where ownership becomes concrete. The architecture promises zero lock-in, swappable components, and portable Memory — but those promises only matter if you can run the system on your own machine, fully offline, without asking anyone's permission. This spec makes that guarantee explicit: the system runs on hardware you control, functions without internet, and never reaches beyond your machine unless you tell it to.*
