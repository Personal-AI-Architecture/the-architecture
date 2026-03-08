---
sidebar_position: 3
title: "Principle 3: Interfaces Over Implementations"
hide_table_of_contents: true
---

# Interfaces Over Implementations

> Every component is defined by what it does, not how it works.

The Agent Loop calls tools — it doesn't know if Memory is files or a database. The Gateway accepts requests — it doesn't know if the Agent Loop uses Claude, GPT, or a local model. Auth enforces permissions — it doesn't know how the Gateway routes requests.

This is what makes one-component swaps possible. When every component only knows the interface of what it talks to, replacing one component doesn't cascade into changes everywhere else.

## What This Means in Practice

- **Memory** is accessed exclusively through tools. The Agent Loop doesn't know (or care) whether Memory is a folder of markdown files, a SQLite database, or a vector store. Change the storage — the Agent Loop never knows.
- **Models** are accessed through the Model API. Swap from Claude to GPT to a local model with a config change. The Agent Loop sends the same prompt format through the adapter.
- **Clients** connect through the Gateway API. Web app, CLI, mobile app, Slack bot — the Gateway doesn't care. Each client speaks the same protocol.

## The Lock-In It Prevents

Without this principle, components become coupled to each other's internals. If the Agent Loop knows Memory uses files, changing Memory to a database means rewriting the Agent Loop. If the Gateway knows which model the Agent Loop uses, swapping models means changing the Gateway. Each internal dependency is a lock-in you've accepted.

## Related

- [Foundation Spec — Architecture Principles](/docs/foundation-spec#architecture-principles)
- [Adapter Spec](/docs/adapter-spec) — How contracts stay swappable
