# Deployment

> The runtime posture and exposure model for where and how the system lives.

## Purpose

Define default network posture, exposure expectations, hardware assumptions, and deployment guarantees without changing component ownership.

## Owns

- Local-first deployment guarantees.
- Offline-capable deployment path.
- Network exposure defaults.
- Single-unit default deployment posture.

## Does Not Own

- Component logic.
- Identity and permission semantics.
- Product-specific ops tooling.
- Managed hosting policy details.

## Required Behaviors

- The system can run on hardware the owner physically controls.
- A fully offline functional path exists.
- Data stays local by default unless the owner configures otherwise.
- The system runs on modern consumer hardware.
- All components deploy together as a single unit by default.
- The default network posture is localhost-only.

## Forbidden Behaviors

- Requiring hidden remote infrastructure as a normal dependency.
- Making remote exposure the hidden default.
- Making local operation impossible.
- Treating deployment choices as component-boundary changes.

## Lifecycle Rules

- Deployment changes should not rewrite component ownership.
- Updates must not risk owner data.
- The owner must be able to return to a prior working state if an update breaks the system.

## Audit Questions

- Can the system run fully offline with a local model?
- Is localhost-only the default network posture?
- Has deployment introduced hidden architecture complexity?
- Does the system still run on owner-controlled hardware as intended?
- Do updates preserve owner data?

## Common Drift Patterns

- Hidden reliance on remote infrastructure.
- Gateway exposure rules not matching local-first posture.
- Deployment requiring more operational infrastructure than the architecture implies.
- Data no longer staying local by default.

## Source Docs

- `docs/deployment-spec.md`
- `docs/gateway-spec.md`
- `docs/security-spec.md`
- `docs/foundation-spec.md`
