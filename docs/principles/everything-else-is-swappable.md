---
sidebar_position: 3
title: "Principle 3: Everything Else Is Swappable"
hide_table_of_contents: true
---

# Everything Else Is Swappable

> Engine, Auth, Gateway, clients, models, tools, contracts, hosting — all replaceable.

Memory via tools, components via contracts, contracts via adapters. Every piece is a drop-down menu, not a permanent choice.

The swappability chain is structurally complete:
- **Memory** is accessed through tools — change the storage, the tools still work
- **Components** communicate through contracts — swap a component, the contract holds
- **Contracts** are translated through adapters — change the standard, swap the adapter

## What This Means in Practice

- **New model?** Config change. Next message uses the new model. Nothing else changes.
- **Better engine?** Swap it. Your Memory, your clients, your tools — all unaffected.
- **New client?** Point it at the Gateway API. The system serves it identically.
- **New standard emerges?** Swap the adapter. Your components never knew the difference.

The cost of adopting anything new is one swap, not a rebuild.

## The Lock-In It Prevents

Most systems make early choices permanent. Choose a model provider, and your prompt engineering is locked to their API. Choose a framework, and your plugins only work there. Choose a client, and your UX is frozen.

This principle ensures that the fastest-changing part of AI — model capability — is the cheapest thing to change in this system. You ride the breakneck pace of AI model improvement instead of being left behind.

## Related

- [Foundation Spec — Architecture Principles](/docs/foundation-spec#architecture-principles)
- [Adapter Spec](/docs/adapter-spec) — How contracts stay swappable via adapters
- [Models Spec](/docs/models-spec) — External intelligence, pluggable
