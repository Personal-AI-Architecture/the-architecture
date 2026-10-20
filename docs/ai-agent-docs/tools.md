# Tools

> The callable capability surface defined by the environment, executed by Agent Loop, and governed by Auth.

## Purpose

Define what tools are, where they live, how they are executed, and how they avoid becoming a fifth architectural component.

## Owns

- The architectural definition of tools.
- Tool discovery and availability model.
- Execution and authorization boundaries around tools.

## Does Not Own

- Standalone component status.
- Memory substrate ownership.
- Auth ownership.
- Product logic outside individual capabilities.

## Required Behaviors

- Tools are capabilities in the environment, not a component.
- Tool definitions come from the tools themselves or their execution environment.
- Tool use stays within the component responsibility model.
- Memory access through tools respects Memory boundaries.
- Tool scope expands or contracts through availability and permissions, not architecture changes.
- The Agent Loop asks Auth before each tool call. A refused call doesn't run, and the model is told it is not permitted (distinct from "does not exist").
- No approval step by default: the owner can do everything. Approval rules, where an owner or product adds them, live in Auth and are enforced in code at that check.
- A tool the owner doesn't trust runs isolated; the owner decides what they trust. How isolation is built is up to the implementation.

## Availability Layers

- Environment: what tools exist.
- Auth: who can use what (asked before each tool call).
- Granularity: how each actor may use them.

## Forbidden Behaviors

- Treating tools as an independent subsystem component.
- Letting components bypass proper tool-mediated access rules.
- Embedding authorization or model logic into tool definitions themselves.
- Introducing a separate tool API when the Model API and Agent Loop already cover the pattern.

## Lifecycle Rules

- Tool availability follows configuration and discovery rules.
- Tool scope changes do not require architecture rewrites.
- The always-send and discoverable split can evolve without changing the architecture.

## Audit Questions

- Are tools being treated as a fifth component?
- Is execution happening in the right place?
- Is authorization handled by Auth, asked before each tool call, rather than ad hoc logic?
- Is Memory access tool-mediated where required?
- Is tool discovery/configuration living in the correct layers?

## Common Drift Patterns

- Tool discovery or selection logic in the wrong component.
- Direct Memory access bypassing tool-mediated boundaries.
- Product-specific orchestration embedded into tool runtime assumptions.
- Approval modeled as prompt guidance instead of a coded check (where approval rules exist).
- "Confirm every write" built in as an architecture default.
- Permissions held in tool configuration instead of Auth.

## Source Docs

- `docs/in-depth-overview/tools-spec.md`
- `docs/in-depth-overview/memory-spec.md`
- `docs/in-depth-overview/auth-spec.md`
- `docs/in-depth-overview/configuration-spec.md`
- `docs/in-depth-overview/foundation-spec.md`
