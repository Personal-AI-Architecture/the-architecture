# Agent Loop Review Checklist

> Fast targeted review checklist for loop behavior, contract fidelity, error taxonomy, and generic Agent Loop ownership.

## Purpose

Use this when reviewing Agent Loop behavior, stream semantics, provider integration, or whether Agent Loop remains generic and bounded.

## Checklist

- [ ] Agent Loop remains generic and product-agnostic.
- [ ] Agent Loop does not own conversation persistence.
- [ ] Provider-specific logic stays in adapters rather than core loop code.
- [ ] The loop continues until the model signals completion through the defined finish behavior.
- [ ] Stream events follow the internal contract event types.
- [ ] Mid-stream errors use the explicit taxonomy: `provider_error`, `tool_error`, `context_overflow`.
- [ ] Error messages are safe for client display.
- [ ] Assistant text is preserved correctly across tool-continuation turns.
- [ ] The loop uses the model named in each request; a model change applies to the next message with no restart.
- [ ] The bootstrap prompt comes from Agent Loop configuration, not from a system message in the request.
- [ ] Every tool call is checked with Auth before it runs; a refused call returns a "not permitted" tool result.
- [ ] Tool calls and tool results use the shared message shape so they can be saved in history.
- [ ] Where a product adds approvals, approval semantics are represented in the contract rather than trapped inside product-specific runtime flow.

## Matrix IDs

- `E-01`
- `E-02`
- `E-03`
- `E-04`
- `E-05`
- `E-06`
- `A-06`
- `GC-02`
- `GC-03`
- `GC-05`
- `GC-06`
- `GC-07`
- `GC-08`
- `S-01`

## Common Failure Patterns

- iteration cap stops the loop early
- provider-specific request shaping appears inside Agent Loop
- all errors collapse to `provider_error`
- raw runtime errors leak through stream events
- tool continuation loses assistant text or approval semantics
- model fixed at startup
- tool calls run without an Auth check

## Read Next

- `docs/ai-agent-docs/agent-loop.md`
- `docs/ai-agent-docs/gateway-agent-loop-contract.md`
- `docs/ai-agent-docs/security.md`
- `docs/ai-agent-docs/compliance-matrix.md`

## Example Files

- `docs/ai-agent-docs/examples/gateway-engine-request.json`
- `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json`

## Source Docs

- `docs/ai-agent-docs/primer-audit-playbook.md`
- `docs/ai-agent-docs/agent-loop.md`
- `docs/ai-agent-docs/gateway-agent-loop-contract.md`
- `docs/ai-agent-docs/security.md`
- `docs/ai-agent-docs/compliance-matrix.md`
