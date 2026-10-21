# Customization

> The allowed variation surface for implementations and owners building on the architecture.

## Purpose

Define what can change safely across products and owner setups without turning customization into architecture drift.

## Owns

- Allowed areas of variation.
- The boundary between customization and architecture change.
- The mechanisms implementations and owners both use to shape behavior.

## Does Not Own

- Core component responsibilities.
- Non-negotiable contracts.
- Security and foundation invariants.

## Customization Mechanisms

- Memory content.
- Tools.
- Configuration.
- Client.

## Required Behaviors

- Customization happens through approved mechanisms rather than core component modification.
- Product variation preserves component boundaries.
- Implementations start from the published contracts and, optionally, a template — not from a package or a fork.
- The fixed contracts are the Gateway API, the Model API, the internal Gateway ↔ Agent Loop contract and the shared schemas in `contracts/`.
- Merge order is Architecture -> Implementation -> Owner. The owner's choice always wins on their own hardware; no product rule sits above the owner.
- Owner changes survive product updates; a conflicting update tells the owner instead of overwriting silently.
- The user stories are US-17 (build a product on the architecture) and US-11 (owner changes survive updates) in `spec/personal-ai-architecture-spec.md`.

## Forbidden Behaviors

- Using customization as a justification for responsibility leakage.
- Changing core contracts without treating it as an architecture change.
- Product rules the owner can't override on their own hardware.
- Moving architecture-owned decisions into arbitrary product code.
- Turning customization into hidden modifications of generic components.

## Lifecycle Rules

- Product evolution happens through approved customization surfaces.
- Owner personalization uses the same mechanisms as implementation customization.
- Customization remains reversible and understandable.

## Audit Questions

- Is this change a customization or an architecture change?
- Does the variation preserve contracts and ownership?
- Is the change happening in an approved variation surface?
- Has a generic component been modified when content, config, tools, or client would have sufficed?

## Common Drift Patterns

- Product logic pushed into Agent Loop or Gateway under the label of customization.
- Config or customization used to smuggle architectural changes.
- Tool or prompt customization that changes ownership boundaries.
- Forking the architecture for changes that should be content or config.

## Source Docs

- `architecture/customization-spec.md`
- `spec/personal-ai-architecture-spec.md` (US-17, US-11)
- `architecture/configuration-spec.md`
- `architecture/tools-spec.md`
- `architecture/models-spec.md`
- `architecture/overview.md`
