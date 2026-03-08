---
hide_table_of_contents: true
---

# Ecosystem Concept

## The Three Levels

Every instance of a product built on this architecture has up to three levels:

| Level | What it is | Always present? |
|-------|-----------|-----------------|
| **Architecture** | The generic architecture: 4 components (Your Memory, Agent Loop, Auth, Gateway), 2 APIs (Gateway API, Model API), 3 externals (Clients, Models, Tools). No opinions. | Yes |
| **Implementation** | The Architecture + a product's shipped opinions and defaults. For BrainDrive: AGENT.md bootstrap, starter library, skills as markdown, OpenRouter default, MCP as default tool protocol, methodology, folder structure, web interface. | Yes |
| **Personalization** | What the owner adds to make it theirs: life pages, custom skills, projects, profile, model preferences, tool choices. | Optional |

Architecture and Implementation are always present. Personalization only exists if the owner chooses to personalize. Some owners may be perfectly happy with the implementation defaults and never customize.

### Managed Hosting

Managed hosting is a deployment option, not a level. It runs the same stack (Architecture + Implementation + optionally Personalization) with permission constraints on certain configurations for security reasons, since we're responsible for the infrastructure. Self-hosted users can configure anything. The levels answer "what's in the stack?" — managed hosting answers "who runs it?"

---

## Two Repos

The Foundation (Architecture) and BrainDrive (Implementation) should be separate GitHub repos.

### Why separation matters

The Foundation isn't an implementation detail of BrainDrive. It's the thing we want other developers to adopt, fork, and build on. If it lives inside the BrainDrive repo, the message is "here's our product, and buried inside is a generic architecture you could theoretically extract." If it's its own repo, the message is "here's a foundation for building user-owned AI systems — and BrainDrive is one product built on it."

### BrainDrive as the reference implementation

The two-repo structure makes BrainDrive the best possible example. A developer looking at the Foundation repo asks "what does a real product built on this look like?" — the answer is the BrainDrive repo. They can see exactly what an Implementation adds on top of the Architecture. The separation is the teaching tool.

### The ecosystem vision

BrainDrive is both a product and an example of how to build user-owned AI systems on a foundation that prevents lock-in and lets developers ride the AI wave instead of getting washed away by it.

Because everyone builds on the same Foundation (or foundational way of thinking), any product built on it is composable by default. Products in the ecosystem progress together and benefit each other — even if they compete in the marketplace. The API contracts (Gateway API, Model API) are what make this composability real.

**Example:** Someone builds "TherapyBrain" or "LegalBrain" on the Foundation. Their tools, skills, and clients work with BrainDrive because they share the same APIs and contracts. A tool built for one product works with any other product on the Foundation.

### Repo structure

| Repo | What it contains | Who it's for |
|------|-----------------|-------------|
| **Foundation** (name TBD) | The Architecture — the generic architecture, components, APIs, contracts | Developers building user-owned AI systems |
| **BrainDrive** | Implementation — BrainDrive's opinions, defaults, starter library, methodology, client | Users who want the BrainDrive product; developers who want to see a reference implementation |

The Foundation repo is the movement. The BrainDrive repo is the product. Both open source. BrainDrive depends on the Foundation. Other products can too.

---

## What This Enables

- **For BrainDrive users:** Nothing changes. They install BrainDrive, they get everything (Architecture + Implementation). They personalize if they want. They self-host or use managed hosting.
- **For developers building on the Foundation:** A clean starting point with no BrainDrive opinions to strip out. Build their own Implementation. The Foundation stands on its own.
- **For the ecosystem:** Any product built on the Foundation can share tools, skills, and clients with any other product. Competition in the marketplace, composability in the architecture.
- **For the user-owned AI movement:** The Foundation is bigger than BrainDrive. It's a shared way of thinking about user-owned AI that anyone can adopt.

---

## Open Questions

- What is the Foundation repo named? (Naming discussion in progress)
- ~~How does the BrainDrive repo depend on the Foundation repo?~~ **Resolved (D155):** npm package. Standard dependency management, semver versioning.
- ~~Does the Foundation repo ship runnable code, or is it specs + contracts + reference implementations of each component?~~ **Resolved (D153):** Runnable code. The Foundation is a working runtime with sensible defaults. Implementations depend on it as a package.
- How do we handle versioning across the two repos?
