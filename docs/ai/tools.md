# Tools

> The callable capability surface defined by the environment, executed by Engine, and governed by Auth.

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

## Availability Layers

- Environment: what tools exist.
- Auth: who can use what.
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
- Is authorization handled by Auth rather than ad hoc logic?
- Is Memory access tool-mediated where required?
- Is tool discovery/configuration living in the correct layers?

## Common Drift Patterns

- Tool discovery or selection logic in the wrong component.
- Direct Memory access bypassing tool-mediated boundaries.
- Product-specific orchestration embedded into tool runtime assumptions.
- Approval modeled as prompt guidance instead of a coded enforcement tool.

## Source Docs

- `docs/tools-spec.md`
- `docs/memory-spec.md`
- `docs/auth-spec.md`
- `docs/configuration-spec.md`
- `docs/foundation-spec.md`
