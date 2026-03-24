# Foundation

> The non-negotiable architecture shape of the system.

## Purpose

Define the fixed structure, ownership boundaries, dependency model, and anti-lock-in rules for the architecture.

## Owns

- The four components.
- The two external APIs.
- The classification of external dependencies.
- The core principles and swappability rules.

## Does Not Own

- Component-specific implementation details.
- Provider-specific or protocol-specific translation details.
- Product-specific workflow behavior.

## Components

- Memory
- Agent Loop
- Auth
- Gateway

## Not Components

- Tools
- Models
- Clients

## External APIs

- Gateway API
- Model API

## Required Behaviors

- The system must consist of exactly four components.
- The system must expose exactly two external APIs.
- Memory is the substrate and has zero outward dependencies.
- Everything except Memory must remain swappable through contracts and adapters.
- Responsibilities must stay with their architectural owner.
- The system must remain understandable and operable by one developer plus AI agents.

## Forbidden Behaviors

- Adding a fifth architectural component without changing the architecture itself.
- Treating tools, models, or clients as components.
- Letting communication layers absorb responsibilities owned elsewhere.
- Requiring hidden infrastructure as a normal architecture dependency.

## Audit Questions

- Does the implementation still have exactly four components?
- Is any responsibility assigned to the wrong component?
- Is there any third public API?
- Is Memory still the substrate rather than an implementation detail?
- Can components be swapped without cascading rewrites?

## Common Drift Patterns

- Gateway absorbs model/provider responsibilities.
- Engine absorbs prompt or product logic.
- Auth disappears from the real runtime path.
- Memory is treated as storage detail rather than platform.
- Tools are promoted into a pseudo-component.

## Source Docs

- `docs/foundation-spec.md`
- `docs/principles.md`
- `docs/foundation-verification.md`
- `docs/lockin-gate.md`
- `docs/lockin-audit.md`
- `docs/zero-lockin-checklist.md`
