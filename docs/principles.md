---
displayed_sidebar: null
hide_table_of_contents: true
---

# Architecture Principles

## 1. Your Memory Should Have No Outbound Dependencies

Your Memory depends on nothing. Everything else depends on it. That's what makes it the platform.

Every component accesses Your Memory exclusively through tools. That's what keeps it the platform. Storage can change without anything else knowing. If a component bypasses tools and talks to storage directly, or if Your Memory starts depending on another component, it stops being the platform.


## 2. Keep Everything Else Swappable

Agent Loop, Auth, Gateway, clients, models, tools, contracts, hosting — all replaceable.

Memory is accessed via tools — change the storage, the tools still work. Components communicate through contracts — swap a component, the contract holds. Contracts are translated through adapters — standard changes, swap the adapter. If changing any of these requires more than a config change or a single-component swap, swappability has been compromised.


## 3. Keep Responsibilities Where They Belong

Leaks create lock-in.

The [Responsibility Matrix](/docs/foundation-spec#responsibility-matrix) defines which component is responsible for what. Follow it. If swapping a component requires changes to a different component — not because the contract changed, but because work leaked across the boundary — this principle is broken.

Reality sometimes requires exceptions. When a component must temporarily do work that belongs to another, contain it inside a swappable component so it is removable when no longer needed. Compensating for weaker models is the primary example.

An exception other components depend on isn't an exception — it's architecture you didn't mean to build.


## 4. Keep It Simple

If the system requires a team of developers, you're locked in to that team. That's a dependency as real as any vendor.

The entire system must be understandable and maintainable by one developer + AI coding agents. Four components, two APIs. Before adding a component, an abstraction, or a layer — ask whether it creates an expertise dependency. If only one person understands it, you're locked in to that person.


## 5. Start Constrained, Expand Deliberately

Each expansion — broader scope, more tools, external integrations — is a deliberate step.

Add tools, don't change architecture. Scope is a tool configuration decision, not an architecture decision. Every capability you grant is a capability you have to maintain, secure, and support. If you can't explain why a capability is active, it shouldn't be.

Nothing enforces these principles. You can violate any of them and the system still works. But every violation is lock-in you've chosen to accept.
