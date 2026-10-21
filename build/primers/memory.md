# Memory

> The owner-controlled substrate where durable, inspectable system value lives.

## Purpose

Provide local, inspectable, portable storage and access primitives without depending on the rest of the system.

## Owns

- Durable owner-controlled data substrate.
- Inspectability and portability guarantees.
- Export and version guarantees.
- Tool-mediated access model for owned data.

## Does Not Own

- Model reasoning.
- Gateway routing or conversation policy.
- Auth enforcement logic.
- Product-specific behavior outside the storage substrate.

## Core Model

- If it is data, it is memory.
- If it is not data, it is a tool.
- Your Memory is the owned, local, open-format subset the architecture protects as the platform.

## Required Behaviors

- Have zero outward dependencies on Gateway, Agent Loop, or Auth.
- Stay inspectable with standard tools when the system is not running.
- Support the core storage contract through approved access paths.
- Treat conversations and structured/queryable owner data as part of Memory rather than side storage outside the Memory contract.
- Expose the required Memory surface through tools even when multiple storage mechanisms sit behind it.
- Preserve owner data across component swaps.
- Support export in open formats, including the required Memory-owned data surface such as conversations (with tool calls, tool results and every content part) and version history.
- Keep version history and restore: record what changed, not only that something changed, and let the owner make an earlier state current again. How it is built is up to the implementation (Git is one option).
- Report a failed or conflicting write to the caller; never report it as saved and never resolve it silently.
- Keep secrets out of Memory entirely.

## Core Operations

- `read`
- `write`
- `edit`
- `delete`
- `search`
- `list`
- `history`
- `restore`

Operation names are implementation choices; the capabilities are required.

## Storage Scope

- Files are part of Memory.
- Database-backed structured/queryable data is part of Memory.
- Version history is part of Memory and is required.
- Storage mechanisms (for example files, SQLite, Git) may vary behind tools without changing the Memory contract. None of them is required by name.

## Forbidden Behaviors

- Depending outward on Gateway, Agent Loop, or Auth.
- Requiring proprietary runtime access to inspect owner data.
- Hiding required owner data in third-party-only systems.
- Letting components bypass the Memory boundary through direct storage reach-in.
- Turning content understanding into a Memory responsibility.

## Lifecycle Rules

- Memory must outlive the rest of the components.
- Export must preserve the architecture-required owner data surface.
- Storage evolution must not force architecture changes elsewhere.
- Version/history behavior must satisfy the Memory contract rather than best-effort only.

## Required From Day One

- Persistent conversation storage in Memory.
- Export surface for owner data.
- Version history and restore, ready as a real startup guarantee.
- Inspectable on-disk owner data without the full system running.

These are MVP requirements, not V1 enhancements.

## Audit Questions

- Can Memory stand on its own as the substrate?
- Is owner data inspectable without the full system running?
- Are components accessing Memory only through approved boundaries?
- Does export include everything the architecture says it must?
- Are secrets excluded from normal Memory storage?

## Common Drift Patterns

- Incomplete export/import.
- Database-backed Memory hidden behind non-Memory surfaces.
- Partial history/version support, or history without restore.
- Silent last-write-wins on concurrent writes.
- Component-specific bootstrap artifacts making Memory too opinionated.
- Conversation or structured data living outside the intended Memory contract.
- Direct filesystem or database access from other components.

## Source Docs

- `architecture/memory-spec.md`
- `architecture/background/memory-as-platform.md`
- `architecture/overview.md`
- `conformance/foundation-verification.md`
- `architecture/security-spec.md`
- `architecture/background/memory-tool-completeness.md`
