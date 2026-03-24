# Models

> The external intelligence boundary accessed through the Model API and adapter layer.

## Purpose

Define how the system talks to external models without turning models or providers into internal components.

## Owns

- The model boundary definition.
- The distinction between internal model contract and provider-specific translation.
- Rules for provider and model swaps.

## Does Not Own

- Gateway routing.
- Conversation management.
- Auth policy.
- Product-specific loop behavior.

## Required Behaviors

- Models remain external, not a component.
- Model access happens through the Model API.
- Provider-specific details stay in adapters.
- Provider and model swaps happen through config and preference changes where defined.
- The internal model-facing contract stays stable and generic.

## Forbidden Behaviors

- Provider-specific logic leaking into Gateway or core Engine logic.
- Treating a provider API as an internal component.
- Collapsing adapter config, runtime config, and preferences into one layer.
- Treating the primary model as a tool in the execution architecture.

## Lifecycle Rules

- Provider readiness follows the architecture's configuration model.
- Same-provider model swaps should remain a preference change.
- Provider swaps should remain adapter and config changes, not code rewrites.

## Audit Questions

- Is the model still external?
- Is provider-specific logic isolated to adapters?
- Does swap behavior match the architecture?
- Is the internal model contract stable and bounded?

## Common Drift Patterns

- Request-time provider reconfiguration in Engine.
- Missing adapter-config layer.
- Provider defaults or fallback behavior hidden in the wrong layer.
- Internal contract carrying too much implementation-specific state.

## Source Docs

- `docs/models-spec.md`
- `docs/adapter-spec.md`
- `docs/configuration-spec.md`
- `docs/foundation-spec.md`
