# Agent Loop Review Checklist

> Fast targeted review checklist for loop behavior, contract fidelity, error taxonomy, and generic Agent Loop ownership.

## Purpose

Use this when reviewing Agent Loop behavior, stream semantics, provider integration, or whether Agent Loop remains generic and bounded.

## Checklist

- [ ] Agent Loop remains generic and product-agnostic.
- [ ] Agent Loop does not own conversation persistence.
- [ ] Provider-specific logic stays in adapters rather than core loop code.
- [ ] The loop continues until the model signals completion through the defined finish behavior.
- [ ] Stream events use the canonical `_event_type` discriminator and payload fields for `text-delta`, `tool-call`, `tool-result`, `done`, and `error`.
- [ ] Mid-stream errors use the explicit taxonomy, including `model_unavailable` and `capability_unsupported` with a named `capability`, alongside `provider_error`, `tool_error`, `auth_error`, `context_limit_unknown`, and `context_overflow` (D197).
- [ ] Any automatic provider-call retry occurs at most once in the Agent Loop, stays on the owner's selected model and provider profile, and is recorded; an unresolved failure reports `provider_error` (D188).
- [ ] Error messages are safe for client display.
- [ ] Assistant text is preserved correctly across tool-continuation turns.
- [ ] The loop uses the model named in each request; a model change applies to the next message with no restart.
- [ ] The bootstrap prompt comes from Agent Loop configuration, not from a system message in the request.
- [ ] Every actual model call, including a continuation with live tool results, fits the selected model's safe limit or reports `context_overflow` without shortening results.
- [ ] Every tool call is checked with Auth before it runs; a refused call returns a "not permitted" tool result.
- [ ] Tool calls and tool results use the shared message shape so they can be saved in history.
- [ ] Where a product adds approvals, approval semantics are represented in the contract rather than trapped inside product-specific runtime flow.

## Related Conformance Tests

- `ARCH-4`
- `ARCH-5`
- `ARCH-14`
- `ARCH-20`

## Common Failure Patterns

- iteration cap stops the loop early
- provider-specific request shaping appears inside Agent Loop
- all errors collapse to `provider_error`
- raw runtime errors leak through stream events
- tool continuation loses assistant text or approval semantics
- model fixed at startup
- tool calls run without an Auth check

## Read Next

- `architecture/agent-loop-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `architecture/tools-spec.md`

## Example Files

- `contracts/examples/gateway-engine-request.json`
- `contracts/examples/invalid-gateway-engine-request.json`
