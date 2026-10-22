# Configuration

> The rules for where runtime truth lives and how the system becomes ready.

## Purpose

Define the boundary between runtime config, adapter config, preferences, and request data so configuration does not leak into the wrong layers.

## Owns

- Startup configuration model.
- Boot sequence rules.
- Separation of config types.
- Rules for what may change without code changes.

## Does Not Own

- Component business logic.
- Interaction-time request semantics.
- Product-specific settings unrelated to architecture boundaries.

## Config Categories

- Preferences: what the owner wants, including the model choice and the active provider profile; live in Memory.
- Runtime config: what exists in this environment; thin bootstrap (four fields).
- Tool self-description: what tools can do; lives with the tools.
- Adapter config: provider-specific settings; lives with adapters.
- Agent Loop config: the bootstrap prompt; lives with the Agent Loop, not in runtime config or the request.

Not configuration:

- Permissions (including any approval rules) live only in Auth.
- Secrets live outside Memory, somewhere git never tracks: environment variables, an untracked config file, or a secret store. Config refers to them by name.

## Required Behaviors

- Keep runtime config, adapter config, and preferences distinct.
- Keep request payloads free of hidden reconfiguration data. The per-request choices are the model and the active provider profile: the Gateway reads the owner's current model and provider choice on every message and passes both with the request.
- A model change or a switch to another provider profile applies to the next message with no restart. A provider in a new adapter format, and tool changes, may need a restart or hot-reload; they are still config-only.
- Preserve provider/model/tool swaps through config and preference changes where defined.
- Follow the boot sequence in a deterministic order.
- Keep secrets out of Memory and tracked config.
- Apply merge order Architecture -> Implementation -> Owner; the owner's choice always wins on their own hardware.

## Forbidden Behaviors

- Collapsing all config types into one loader.
- Treating request-time logic as the main configuration mechanism.
- Storing preference-owned choices in the wrong layer.
- Fixing the model at startup so a change needs a restart.
- Storing permissions or approval rules in configuration or preferences.
- A product rule that overrides the owner's choice on the owner's own hardware.
- Leaking provider/tool configuration or the bootstrap prompt through Gateway -> Agent Loop requests.

## Boot Sequence

1. Load runtime config.
2. Load adapter config.
3. Discover tools.
4. Mount Memory.
5. Read preferences.
6. Become ready.

On every message, the Gateway reads the owner's current model and active provider profile through the Memory tools and passes both to the Agent Loop.

## Valid Example

Standalone files:

- `contracts/examples/runtime-config.json`
- `contracts/examples/adapter-config.json`

```json
{
  "memory_root": "/library",
  "provider_adapter": "openai-compatible",
  "auth_mode": "local-owner",
  "tool_sources": ["/app/tools"]
}
```

Adapter config example:

```json
{
  "provider_profiles": {
    "openrouter": {
      "base_url": "https://openrouter.ai/api/v1",
      "api_key_env": "OPENROUTER_API_KEY"
    },
    "local": { "base_url": "http://127.0.0.1:11434/v1" }
  },
  "default_provider_profile": "openrouter"
}
```

Preference example:

```json
{
  "default_model": "llama3.1",
  "active_provider_profile": "local"
}
```

Approval rules are not preferences. If a product adds approval prompts, the rules live in Auth.

## Invalid Drift Example

Standalone files:

- `contracts/examples/invalid-runtime-config.json`
- `contracts/examples/invalid-adapter-config.json`

```json
{
  "memory_root": "/library",
  "provider": "openrouter",
  "model": "gpt-4.1",
  "api_key": "secret",
  "approval_mode": "ask-on-write",
  "tool_sources": ["/app/tools"]
}
```

Why this is drift:

- runtime config, adapter config, and preferences are collapsed into one loader
- secret value is stored directly instead of referenced
- the model is fixed in runtime config instead of being an owner preference read on every message
- an approval rule sits in configuration instead of in Auth
- this shape encourages request-time and product-specific config leakage later

## Audit Questions

- Where does each kind of configuration live?
- Is anything being re-derived per request that should be ready at boot or refresh time? (The model and provider choices are the exception: they are read on every message.)
- Does a model or provider-profile change apply to the next message without a restart?
- Are preferences stored in Memory rather than code/runtime config?
- Are permissions kept out of configuration?
- Is request payload data being abused as configuration?
- Are secrets referenced rather than stored by value?

## Common Drift Patterns

- Provider selection logic recomputed in the request path.
- Model fixed at startup, so changing it needs a restart.
- Tool discovery rebuilt per request without clear refresh semantics.
- Missing adapter-config layer.
- Gateway endpoints mutating architecture-owned configuration responsibilities.

## Review Links

- Checklist: `conformance/review-checklists/configuration-review.md`
- Traceability: `maintainers/traceability-map.md`
- Examples: `contracts/examples/README.md`

## Source Docs

- `architecture/configuration-spec.md`
- `architecture/adapter-spec.md`
- `architecture/models-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `architecture/overview.md`
