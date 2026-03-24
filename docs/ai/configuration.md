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

- Preferences: what the owner wants; live in Memory.
- Runtime config: what exists in this environment; thin bootstrap.
- Tool self-description: what tools can do; lives with the tools.
- Adapter config: provider-specific settings; lives with adapters.

## Required Behaviors

- Keep runtime config, adapter config, and preferences distinct.
- Keep request payloads free of hidden reconfiguration data.
- Preserve provider/model/tool swaps through config and preference changes where defined.
- Follow the boot sequence in a deterministic order.
- Keep secrets out of Memory and tracked config.

## Forbidden Behaviors

- Collapsing all config types into one loader.
- Treating request-time logic as the main configuration mechanism.
- Storing preference-owned choices in the wrong layer.
- Leaking provider/tool configuration through Gateway -> Engine requests.

## Boot Sequence

1. Load runtime config.
2. Load adapter config.
3. Discover tools.
4. Mount Memory.
5. Read preferences.
6. Become ready.

## Valid Example

Standalone files:

- `docs/ai/examples/runtime-config.json`
- `docs/ai/examples/adapter-config.json`

```json
{
  "memory_root": "/library",
  "provider_adapter": "openai-compatible",
  "auth_mode": "local-owner",
  "tool_sources": ["/app/tools"],
  "bind_address": "127.0.0.1"
}
```

Adapter config example:

```json
{
  "base_url": "http://127.0.0.1:11434/v1",
  "model": "llama3.1",
  "api_key_env": "BRAINDRIVE_API_KEY"
}
```

Preference example:

```json
{
  "default_model": "llama3.1",
  "approval_mode": "ask-on-write"
}
```

## Invalid Drift Example

Standalone files:

- `docs/ai/examples/invalid-runtime-config.json`
- `docs/ai/examples/invalid-adapter-config.json`

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
- provider/model choice is not clearly separated from owner preference
- this shape encourages request-time and product-specific config leakage later

## Audit Questions

- Where does each kind of configuration live?
- Is anything being re-derived per request that should be ready at boot or refresh time?
- Are preferences stored in Memory rather than code/runtime config?
- Is request payload data being abused as configuration?
- Are secrets referenced rather than stored by value?

## Common Drift Patterns

- Provider/model selection logic recomputed in the request path.
- Tool discovery rebuilt per request without clear refresh semantics.
- Missing adapter-config layer.
- Gateway endpoints mutating architecture-owned configuration responsibilities.

## Review Links

- Checklist: `docs/ai/review-checklists/configuration-review.md`
- Traceability: `docs/ai/traceability-map.md`
- Examples: `docs/ai/examples/README.md`

## Source Docs

- `docs/configuration-spec.md`
- `docs/adapter-spec.md`
- `docs/models-spec.md`
- `docs/gateway-engine-contract.md`
- `docs/foundation-spec.md`
