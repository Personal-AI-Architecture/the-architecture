---
sidebar_position: 4
title: "Principle 4: Complexity Is Lock-In"
hide_table_of_contents: true
---

# Complexity Is Lock-In

> If the system requires a team of developers, you're locked in to that team. That's a dependency as real as any vendor.

The entire system must be understandable and maintainable by one developer + AI coding agents. Four components and two connectors isn't minimalism — every additional component is a potential expertise dependency.

## What This Means in Practice

- **Four components** — Your Memory, Engine, Auth, Gateway. Not five. Not six. Every proposed addition must justify itself against this principle.
- **Two connectors** — Gateway API, Provider API. Not three. Tool execution is internal to the Engine, not a separate connector.
- **Three external dependencies** — Clients, Models, Tools. External means outside the system boundary.

The architecture was resolved through six component interviews. Models, Tools, and Clients were each evaluated as potential components and deliberately excluded — they're external dependencies, not system components.

## The Lock-In It Prevents

Complexity lock-in is the most insidious kind because it doesn't look like lock-in. It looks like good engineering. More components, more abstractions, more separation of concerns — all reasonable on paper.

But each addition creates expertise dependencies. If only one person understands the message queue, you're locked in to that person. If the plugin system requires a PhD to extend, you're locked in to the framework author. If the config system has 47 options, you're locked in to the documentation.

A system that one person + AI can fully understand is a system that one person + AI can fully own. That's the whole point.

## Related

- [Foundation Spec — Architecture Principles](/docs/foundation-spec#architecture-principles)
- [Foundation Spec — Foundation Decisions](/docs/foundation-spec#foundation-decisions)
