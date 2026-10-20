---
hide_table_of_contents: true
---

# Foundation Decisions

The decisions that define the architecture, and why they were made. For how the architecture works today, start with the [Architecture Overview](./foundation-spec.md).

Some decisions use older names: **Engine** is now the Agent Loop, **Provider API** is now the Model API, and **connectors** are now the two APIs. **Level 1** is the architecture itself; **Level 2** is a product built on it. Numbers have gaps because product-level decisions are tracked by each implementation, not here.

| # | Decision | Rationale |
|---|----------|-----------|
| D15 | Product clients are product-owned, not coupled to the Engine | The client is the product's brand. Decoupling from the Engine means the product controls the experience AND the client is swappable. |
| D16 | Zero custom protocols — use the prevailing industry standard, not a proprietary one | Never invent a protocol when an existing one will do. Swappable via adapter when the standard shifts. |
| D20 | Client metadata flows through the Gateway API contract | Client sends context, Gateway passes it through, Engine uses it. |
| D22 | Auth on both local and managed hosting | Auth is a memory concern (who can access your system), not a hosting concern. |
| D23 | Managed hosting is stricter, not just easier | Same code, different configuration. Managed hosting restricts tool access and enforces policies through configuration, not code forks. |
| D24 | Engine ceiling must match the leading agent tools | The architecture must never be the bottleneck. If the Engine caps out, we swap it — because the contracts make that possible. |
| D26 | Skill execution = multi-turn, adaptive, judgment-based | Skills are NOT scripts. The model must support real agentic behavior. This is the minimum bar. |
| D39 | The Engine is a generic agent loop with no product-specific logic | Composability. A generic engine picks up any tool. A domain-specific engine only picks up domain-shaped things. |
| D40 | Prompt assembly and skill execution live in Memory, not the Engine | Product behavior emerges from what's in the files, not from custom engine code. |
| D51 | Tools are not a component — they are capabilities in the environment | Every concern maps to existing components: definitions in Memory, execution in Engine, permissions in Auth. |
| D53 | Tool Protocol connector is not needed — tool calls flow through the Provider API | No gap between the Provider API and the Engine's execution. Two connectors, not three. |
| D57 | The client is not a component — it's any external client | The system is Your Memory + Engine + Auth + Gateway. Clients connect to it through the Gateway API. |
| D58 | Gateway is a new component — manages conversations and routes to the Engine | Without the Gateway, conversation management would violate Engine genericity (D39) or Memory unopinionatedness (D43). |
| D60 | Auth is a cross-cutting layer — independent of the Gateway | Auth and Gateway don't know about each other. Both can be swapped independently. |
| D63 | Models are not a component — they are external intelligence | The system calls a model through the Provider API. It doesn't contain one. |
| D64 | Four components, two connectors, three external dependencies | The final architecture resolved through six component interviews. |
| D65 | Level 2 is composable lego blocks — each piece independently usable | A Level 2 product is a box of legos, not a monolith. No piece requires another piece. |
| D135 | Memory/tool binary — if it's data, it's memory; if it's not data, it's a tool | Everything is either a noun (memory) or a verb (tool). New capabilities compose from existing primitives. "Your Memory" (D138) distinguishes the component from the concept. |
| D137 | Gateway ↔ Engine is a plain HTTP API contract — not a third connector | One internal endpoint between two components we control. See [gateway-agent-loop-contract.md](./gateway-agent-loop-contract.md). |
| D138 | Memory component renamed to "Your Memory" | Distinguishes the component (your owned local storage) from the concept (all data is memory per D135). |
| D139 | Contracts are swappable via adapters — completing zero-lock-in | Components via contracts, contracts via adapters, Memory via tools. The swappability chain is structurally complete. See [adapter-spec.md](./adapter-spec.md). |
| D143 | Configuration is a cross-cutting concern with its own spec | Not owned by any single component. Three categories: preferences (Your Memory), runtime config (thin bootstrap), tool self-description. See [configuration-spec.md](./configuration-spec.md). |
| D148 | Level 1 defines local deployment only — managed hosting is Level 2 | The foundation defines how the system runs on hardware the owner controls. Managed hosting is a product offering layered on top. See [deployment-spec.md](./deployment-spec.md). |
| D147 | Anti-lock-in CI test — three swaps must succeed with config-only changes | Provider swap, model swap, tool swap. If any requires code changes, lock-in has been introduced. CI-testable on every release. |
