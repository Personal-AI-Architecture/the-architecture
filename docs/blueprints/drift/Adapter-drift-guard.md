# Adapter Boundary Drift Guard

This document defines anti-drift controls for Adapter boundary implementations.

## 1. Top Drift Patterns

- Adapters promoted into a component or separate API.
- Runtime adapter selection overridden by request payloads.
- Silent fallback for unknown adapters.
- Provider protocol logic leaked into Engine or Gateway internals.
- Gateway-side translation accumulates conversation/auth ownership logic.
- Runtime config, adapter config, and preferences collapsed.
- Raw secrets stored in adapter config.
- Swap paths requiring unrelated component rewrites.
- External standard changes forcing internal contract rewrites.
- Raw external/provider errors leaking to client-visible surfaces.
- Ready state reached before adapter-config phase completion.
- Adapter changes mutating four-component/two-API architecture.

## 2. Prohibited Implementation Shortcuts

- Adding a dedicated Adapter component/service/API by default.
- Allowing `provider_adapter` or equivalent request-time override fields.
- Auto-fallback from unsupported adapter keys.
- Embedding provider SDK request shaping in Engine loop.
- Using adapter layer for conversation lifecycle or auth policy decisions.
- Writing `api_key`, `token`, or `password` values in tracked config.
- Hardcoding provider choice in component code paths.
- Passing raw external exceptions directly to streams/clients.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| ADPD-CHK-001 | Adapter boundary is pattern-only (not component/API) | Architecture classification checks | Critical |
| ADPD-CHK-002 | Adapter selection is runtime-config driven | Selection-path tests | Critical |
| ADPD-CHK-003 | Unknown adapters fail clearly without fallback | Startup negative tests | Critical |
| ADPD-CHK-004 | Provider logic stays adapter-confined | Static module-boundary scans | Critical |
| ADPD-CHK-005 | Gateway translation does not absorb conversation/auth ownership | Boundary ownership tests | Critical |
| ADPD-CHK-006 | Runtime/adapter/preferences layers remain distinct | Config loader tests | Critical |
| ADPD-CHK-007 | Adapter config stores secret references only | Config security scans | Critical |
| ADPD-CHK-008 | Same-provider swap remains preference-level | Swap-path integration tests | High |
| ADPD-CHK-009 | Provider swap remains adapter/runtime-config-level | Swap-path integration tests | High |
| ADPD-CHK-010 | Internal contracts stay stable across external protocol changes | Contract regression tests | Critical |
| ADPD-CHK-011 | Adapter failures map to safe classified errors | Fault-injection error mapping tests | Critical |
| ADPD-CHK-012 | Request payload cannot mutate adapter/runtime config | Negative request-contract tests | Critical |
| ADPD-CHK-013 | Startup includes deterministic adapter-config phase before ready | Startup phase sequence tests | Critical |
| ADPD-CHK-014 | Adapter changes preserve four-component/two-API invariants | Foundation conformance checks | Critical |

## 4. Contract-Break Indicators

- New `Adapter API` or `Adapter component` appears in architecture inventory.
- Request payload fields alter adapter selection or provider routing.
- Unsupported adapter key resolves silently.
- Engine/Gateway imports provider-native payload logic directly.
- Adapter modules contain conversation persistence or auth policy branching.
- Tracked adapter config contains literal secrets.
- Same-provider or provider swap requires unrelated component code changes.
- External protocol update forces internal contract shape changes.
- Raw provider/external stack traces reach client-visible outputs.
- Startup marks ready without adapter-config completion.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `ADP-MUST-*` conformance vector fails.
- Request-time adapter/runtime reconfiguration is accepted.
- Unknown adapters do not fail clearly.
- Provider logic leaks outside adapters.
- Secret-value-in-config violations are detected.
- Adapter changes alter architecture component/API counts.
- Conflict register has unresolved High-risk adapter conflicts.

## 6. Drift Detection Checklist

- [ ] All `ADP-MUST-*` vectors pass (positive and negative).
- [ ] Adapter boundary remains pattern-only (no component/API promotion).
- [ ] Adapter selection remains runtime-config driven.
- [ ] Unsupported adapter keys fail clearly.
- [ ] Provider logic remains adapter-confined.
- [ ] Gateway translation remains bounded and ownership-safe.
- [ ] Runtime config, adapter config, and preferences remain distinct.
- [ ] Adapter config uses secret references and no raw secret values.
- [ ] Same-provider and provider swap paths remain lock-in resistant.
- [ ] Internal contracts remain stable across protocol changes.
- [ ] Adapter error mapping is safe and classified.
- [ ] Request payloads cannot mutate adapter/runtime selection.
- [ ] Startup phase order includes adapter-config before ready.
- [ ] Four components and two external APIs remain unchanged.
