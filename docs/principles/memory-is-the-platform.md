---
sidebar_position: 1
title: "Principle 1: Memory Is the Platform"
hide_table_of_contents: true
---

# Memory Is the Platform

> Everything else exists to serve Memory. The most portable, most independent, most durable part of the system.

Your Memory has zero outward dependencies. Every other component depends on it. It depends on none of them.

This is what makes personal AI personal. Most AI systems are app-centric — your data lives inside the application, locked to its formats, its APIs, its business model. Remove the app, and your data is gone or useless.

Here, Your Memory is the platform. Agent Loop, Auth, Gateway, clients, models, tools — all built on top, all replaceable. Your Memory persists when everything else is swapped, upgraded, or removed.

## What This Means in Practice

- **Memory stays independently inspectable** with standard tools (text editor, file browser, database viewer) even when the system is not running.
- **No other component should create dependencies** that make Memory hard to move. If swapping the Agent Loop means reformatting your Memory, that's a violation.
- **Memory compounds** — every conversation, every decision, every plan makes the system more powerful because it makes your memory richer. As AI capabilities grow, the value of what it draws from grows with it.

## The Lock-In It Prevents

App-centric AI (ChatGPT, Claude) locks your data inside the product. Your conversation history, your preferences, your context — all owned by the vendor. Cancel your subscription and you lose everything that made the AI useful to you.

Memory-as-platform inverts this. The AI is useful because of YOUR memory, not theirs.

## Related

- [Foundation Spec — Your Memory](/docs/foundation-spec#your-memory--the-platform)
- [Memory Spec](/docs/memory-spec) — Full specification
- [Memory as Platform](/docs/memory-as-platform) — Deep dive
