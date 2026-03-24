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
- Implementations build on the architecture as a dependency relationship rather than a fork where possible.
- The fixed contracts remain the Gateway API and Model API.

## Forbidden Behaviors

- Using customization as a justification for responsibility leakage.
- Changing core contracts without treating it as an architecture change.
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

- Product logic pushed into Engine or Gateway under the label of customization.
- Config or customization used to smuggle architectural changes.
- Tool or prompt customization that changes ownership boundaries.
- Forking the architecture for changes that should be content or config.

## Source Docs

- `docs/customization-spec.md`
- `docs/configuration-spec.md`
- `docs/tools-spec.md`
- `docs/models-spec.md`
- `docs/foundation-spec.md`
