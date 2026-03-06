---
sidebar_position: 4
title: "Principle 4: Start Constrained, Expand Deliberately"
---

# Start Constrained, Expand Deliberately

> Products built on this don't have to use all capabilities at once. Each expansion is a deliberate step.

The architecture supports everything from a personal library assistant to a full autonomous agent with external integrations. But no product should start at full scope. Each expansion — broader scope, more tools, external integrations — is a deliberate step.

## What This Means in Practice

The product roadmap follows an expanding sphere of agent capability. Each step is additive — only tools change:

| Phase | Scope | What's Added |
|-------|-------|-------------|
| **V1** | Library folder | Library-scoped file tools |
| **V2** | Your computer | System tools (filesystem, apps) |
| **V3** | Anything on a computer | External tools (APIs, services) |
| **V4** | Beyond your computer | Inbound integrations |

**Add tools, don't change architecture.** Scope is a tool configuration decision, not an architecture decision.

## The Lock-In It Prevents

Systems that launch with maximum scope are impossible to secure, impossible to understand, and impossible to roll back. Every capability you grant is a capability you have to maintain, secure, and support.

Starting constrained means every expansion is a conscious choice with understood tradeoffs. You never wake up wondering why your AI agent has access to your email, your bank, and your social media.

## Related

- [Foundation Spec — How the Architecture Evolves](/docs/foundation-spec#how-the-architecture-evolves)
- [Tools Spec](/docs/tools-spec) — How capabilities are added via tools
