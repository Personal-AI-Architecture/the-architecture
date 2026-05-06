# Engine Review Checklist

> Fast targeted review checklist for loop behavior, contract fidelity, error taxonomy, and generic Engine ownership.

## Purpose

Use this when reviewing Agent Loop behavior, stream semantics, provider integration, or whether Engine remains generic and bounded.

## Checklist

- [ ] Engine remains generic and product-agnostic.
- [ ] Engine does not own conversation persistence.
- [ ] Provider-specific logic stays in adapters rather than core loop code.
- [ ] The loop continues until the model signals completion through the defined finish behavior.
- [ ] Stream events follow the internal contract event types.
- [ ] Mid-stream errors use the explicit taxonomy: `provider_error`, `tool_error`, `context_overflow`.
- [ ] Error messages are safe for client display.
- [ ] Assistant text is preserved correctly across tool-continuation turns.
- [ ] Approval semantics are represented in the contract rather than trapped inside product-specific runtime flow.

## Matrix IDs

- `E-01`
- `E-02`
- `E-03`
- `E-04`
- `GC-02`
- `GC-03`
- `GC-05`
- `GC-06`
- `S-01`

## Common Failure Patterns

- iteration cap stops the loop early
- provider-specific request shaping appears inside Engine
- all errors collapse to `provider_error`
- raw runtime errors leak through stream events
- tool continuation loses assistant text or approval semantics

## Read Next

- `docs/ai-agent-docs/engine.md`
- `docs/ai-agent-docs/gateway-engine-contract.md`
- `docs/ai-agent-docs/security.md`
- `docs/ai-agent-docs/compliance-matrix.md`

## Example Files

- `docs/ai-agent-docs/examples/gateway-engine-request.json`
- `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json`

## Source Docs

- `docs/ai-agent-docs/primer-audit-playbook.md`
- `docs/ai-agent-docs/engine.md`
- `docs/ai-agent-docs/gateway-engine-contract.md`
- `docs/ai-agent-docs/security.md`
- `docs/ai-agent-docs/compliance-matrix.md`
