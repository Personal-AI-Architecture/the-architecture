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
- The model and provider profile travel with each request: the Gateway reads the owner's current choices on every message and passes them to the Agent Loop, so the next message uses the new model or provider with no restart.
- Capabilities a model lacks (images, tool calls, context size) are reported, not faked: no silently dropped image, no pretended tool call, no quiet substitution of another model.
- The internal model-facing contract stays stable and generic, and uses the same message shape as the other two contracts.

## Forbidden Behaviors

- Provider-specific logic leaking into Gateway or core Agent Loop logic.
- Treating a provider API as an internal component.
- Collapsing adapter config, runtime config, and preferences into one layer.
- Treating the primary model as a tool in the execution architecture.
- Fixing the model at startup so a change needs a restart.

## Lifecycle Rules

- Provider readiness follows the architecture's configuration model (adapter read at startup; a provider in a new format may need a restart).
- Model swaps and switches between provider profiles the adapter lists should remain preference changes that apply to the next message.
- A provider in a new format should remain an adapter and config change, not a code rewrite.

## Audit Questions

- Is the model still external?
- Is provider-specific logic isolated to adapters?
- Does swap behavior match the architecture?
- Does a model change apply to the next message without a restart?
- Is the internal model contract stable and bounded?

## Common Drift Patterns

- Request-time provider reconfiguration in Agent Loop.
- Model held as boot-time Agent Loop configuration instead of arriving with each request.
- Missing adapter-config layer.
- Provider defaults or fallback behavior hidden in the wrong layer.
- Silent provider fallback after failure.
- Internal contract carrying too much implementation-specific state.

## Source Docs

- `architecture/models-spec.md`
- `architecture/adapter-spec.md`
- `architecture/configuration-spec.md`
- `architecture/overview.md`
