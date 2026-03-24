# Traceability Map

> Map of every compliance-matrix row to its owning primer doc, related checklist, example location, and glossary terms.

## Purpose

Make it easy to trace any audit rule back to the primer text, targeted review surface, concrete examples, and shared terminology that support it.

## Foundation Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `F-01` | `docs/ai/foundation.md` | - | - | `conformance gate`, `drift` |
| `F-02` | `docs/ai/foundation.md` | - | - | `client contract`, `internal contract` |
| `F-03` | `docs/ai/foundation.md` | - | - | `drift` |
| `F-04` | `docs/ai/foundation.md`, `docs/ai/memory.md` | `docs/ai/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |

## Gateway And Client Contract Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `G-01` | `docs/ai/gateway.md` | `docs/ai/review-checklists/gateway-review.md` | - | `approved boundary`, `drift` |
| `G-02` | `docs/ai/gateway.md` | `docs/ai/review-checklists/gateway-review.md` | - | `drift` |
| `G-03` | `docs/ai/gateway.md`, `docs/ai/memory.md` | `docs/ai/review-checklists/gateway-review.md`, `docs/ai/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |
| `G-04` | `docs/ai/gateway.md`, `docs/ai/memory.md` | `docs/ai/review-checklists/gateway-review.md`, `docs/ai/review-checklists/memory-review.md` | `docs/ai/failure-patterns.md` | `approved boundary`, `drift` |
| `G-05` | `docs/ai/client-gateway-contract.md` | `docs/ai/review-checklists/gateway-review.md` | `docs/ai/examples/client-message-request.json`, `docs/ai/examples/invalid-client-message-request.json` | `client contract`, `internal contract` |
| `G-06` | `docs/ai/client-gateway-contract.md` | `docs/ai/review-checklists/gateway-review.md` | `docs/ai/examples/conversation-list-response.json`, `docs/ai/examples/conversation-detail-response.json`, `docs/ai/examples/invalid-conversation-list-response.json`, `docs/ai/examples/invalid-conversation-detail-response.json` | `client contract`, `drift` |
| `G-07` | `docs/ai/client-gateway-contract.md` | `docs/ai/review-checklists/gateway-review.md` | `docs/ai/examples/conversation-list-response.json`, `docs/ai/examples/conversation-detail-response.json` | `client contract`, `contract-visible` |

## Engine Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `E-01` | `docs/ai/engine.md` | `docs/ai/review-checklists/engine-review.md` | - | `drift` |
| `E-02` | `docs/ai/engine.md` | `docs/ai/review-checklists/engine-review.md` | - | `approved boundary`, `drift` |
| `E-03` | `docs/ai/engine.md`, `docs/ai/models.md` | `docs/ai/review-checklists/engine-review.md`, `docs/ai/review-checklists/configuration-review.md` | - | `drift` |
| `E-04` | `docs/ai/engine.md`, `docs/ai/gateway-engine-contract.md` | `docs/ai/review-checklists/engine-review.md` | `docs/ai/failure-patterns.md` | `conformance gate`, `drift` |

## Configuration Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `C-01` | `docs/ai/configuration.md` | `docs/ai/review-checklists/configuration-review.md` | `docs/ai/examples/runtime-config.json`, `docs/ai/examples/adapter-config.json`, `docs/ai/examples/invalid-runtime-config.json`, `docs/ai/examples/invalid-adapter-config.json` | `startup readiness`, `drift` |
| `C-02` | `docs/ai/configuration.md`, `docs/ai/gateway-engine-contract.md` | `docs/ai/review-checklists/configuration-review.md`, `docs/ai/review-checklists/gateway-review.md` | `docs/ai/examples/runtime-config.json`, `docs/ai/examples/gateway-engine-request.json`, `docs/ai/examples/invalid-runtime-config.json`, `docs/ai/examples/invalid-gateway-engine-request.json` | `internal contract`, `drift` |
| `C-03` | `docs/ai/configuration.md`, `docs/ai/security.md` | `docs/ai/review-checklists/configuration-review.md`, `docs/ai/review-checklists/security-review.md` | `docs/ai/examples/runtime-config.json`, `docs/ai/examples/adapter-config.json`, `docs/ai/examples/invalid-runtime-config.json`, `docs/ai/examples/invalid-adapter-config.json` | `product-owned state`, `startup readiness` |

## Memory Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `M-01` | `docs/ai/memory.md` | `docs/ai/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |
| `M-02` | `docs/ai/memory.md` | `docs/ai/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |
| `M-03` | `docs/ai/memory.md` | `docs/ai/review-checklists/memory-review.md` | `docs/ai/failure-patterns.md` | `product-owned state`, `startup readiness` |
| `M-04` | `docs/ai/memory.md` | `docs/ai/review-checklists/memory-review.md` | `docs/ai/failure-patterns.md` | `startup readiness`, `drift` |
| `M-05` | `docs/ai/memory.md`, `docs/ai/gateway.md` | `docs/ai/review-checklists/memory-review.md`, `docs/ai/review-checklists/gateway-review.md` | `docs/ai/failure-patterns.md` | `approved boundary`, `drift` |
| `M-06` | `docs/ai/memory.md` | `docs/ai/review-checklists/memory-review.md` | `docs/ai/failure-patterns.md` | `approved boundary`, `product-owned state` |

## Auth Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `A-01` | `docs/ai/auth.md` | `docs/ai/review-checklists/auth-review.md`, `docs/ai/review-checklists/gateway-review.md` | `docs/ai/failure-patterns.md` | `approved boundary`, `drift` |
| `A-02` | `docs/ai/auth.md` | `docs/ai/review-checklists/auth-review.md` | - | `approved boundary`, `drift` |
| `A-03` | `docs/ai/auth.md` | `docs/ai/review-checklists/auth-review.md` | - | `product-owned state` |
| `A-04` | `docs/ai/auth.md`, `docs/ai/security.md` | `docs/ai/review-checklists/auth-review.md`, `docs/ai/review-checklists/security-review.md` | - | `product-owned state`, `drift` |
| `A-05` | `docs/ai/auth.md` | `docs/ai/review-checklists/auth-review.md`, `docs/ai/review-checklists/security-review.md` | - | `product-owned state`, `startup readiness` |

## Security Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `S-01` | `docs/ai/security.md`, `docs/ai/gateway-engine-contract.md` | `docs/ai/review-checklists/security-review.md`, `docs/ai/review-checklists/engine-review.md` | `docs/ai/examples/invalid-gateway-engine-request.json`, `docs/ai/failure-patterns.md` | `contract-visible`, `drift` |
| `S-02` | `docs/ai/security.md` | `docs/ai/review-checklists/security-review.md` | - | `startup readiness`, `drift` |
| `S-03` | `docs/ai/security.md` | `docs/ai/review-checklists/security-review.md`, `docs/ai/review-checklists/auth-review.md` | `docs/ai/failure-patterns.md` | `contract-visible`, `approved boundary` |
| `S-04` | `docs/ai/security.md`, `docs/ai/tools.md` | `docs/ai/review-checklists/security-review.md` | - | `approved boundary`, `startup readiness` |
| `S-05` | `docs/ai/client-gateway-contract.md`, `docs/ai/gateway-engine-contract.md` | `docs/ai/review-checklists/security-review.md`, `docs/ai/review-checklists/gateway-review.md` | `docs/ai/examples/approval-request-event.json`, `docs/ai/examples/approval-result-event.json`, `docs/ai/examples/invalid-approval-request-event.json`, `docs/ai/examples/invalid-approval-result-event.json`, `docs/ai/failure-patterns.md` | `contract-visible`, `client contract` |

## Models Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `MO-01` | `docs/ai/models.md` | `docs/ai/review-checklists/engine-review.md`, `docs/ai/review-checklists/configuration-review.md` | - | `drift` |
| `MO-02` | `docs/ai/models.md`, `docs/ai/configuration.md` | `docs/ai/review-checklists/configuration-review.md` | `docs/ai/examples/runtime-config.json`, `docs/ai/examples/adapter-config.json` | `product-owned state`, `startup readiness` |
| `MO-03` | `docs/ai/models.md`, `docs/ai/configuration.md` | `docs/ai/review-checklists/configuration-review.md`, `docs/ai/review-checklists/engine-review.md` | - | `drift` |

## Tools Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `T-01` | `docs/ai/tools.md` | `docs/ai/review-checklists/security-review.md` | - | `drift` |
| `T-02` | `docs/ai/tools.md`, `docs/ai/auth.md` | `docs/ai/review-checklists/auth-review.md`, `docs/ai/review-checklists/security-review.md` | - | `approved boundary` |
| `T-03` | `docs/ai/tools.md`, `docs/ai/configuration.md` | `docs/ai/review-checklists/configuration-review.md`, `docs/ai/review-checklists/security-review.md` | - | `startup readiness`, `approved boundary` |

## Deployment And Startup Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `D-01` | `docs/ai/deployment.md` | `docs/ai/review-checklists/configuration-review.md` | - | `startup readiness` |
| `D-02` | `docs/ai/deployment.md` | `docs/ai/review-checklists/configuration-review.md` | `docs/ai/failure-patterns.md` | `startup readiness` |
| `D-03` | `docs/ai/deployment.md` | `docs/ai/review-checklists/configuration-review.md` | - | `startup readiness` |
| `D-04` | `docs/ai/deployment.md` | `docs/ai/review-checklists/configuration-review.md` | - | `startup readiness` |
| `D-05` | `docs/ai/memory.md`, `docs/ai/build-sequence.md` | `docs/ai/review-checklists/memory-review.md`, `docs/ai/review-checklists/configuration-review.md` | `docs/ai/failure-patterns.md` | `startup readiness`, `conformance gate` |
| `D-06` | `docs/ai/configuration.md`, `docs/ai/build-sequence.md` | `docs/ai/review-checklists/configuration-review.md` | `docs/ai/configuration.md`, `docs/ai/failure-patterns.md` | `startup readiness`, `conformance gate` |
| `D-07` | `docs/ai/memory.md`, `docs/ai/accepted-mvp-limits.md` | `docs/ai/review-checklists/memory-review.md`, `docs/ai/review-checklists/configuration-review.md` | `docs/ai/failure-patterns.md` | `accepted limitation`, `startup readiness` |

## Customization Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `CU-01` | `docs/ai/customization.md` | - | - | `accepted limitation`, `drift` |
| `CU-02` | `docs/ai/customization.md` | - | - | `client contract`, `internal contract` |
| `CU-03` | `docs/ai/customization.md` | - | - | `one-shot build`, `drift` |

## Gateway-Engine Contract Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `GC-01` | `docs/ai/gateway-engine-contract.md` | `docs/ai/review-checklists/engine-review.md` | `docs/ai/examples/gateway-engine-request.json`, `docs/ai/examples/invalid-gateway-engine-request.json` | `internal contract` |
| `GC-02` | `docs/ai/gateway-engine-contract.md` | `docs/ai/review-checklists/engine-review.md` | `docs/ai/examples/gateway-engine-request.json` | `contract-visible`, `internal contract` |
| `GC-03` | `docs/ai/gateway-engine-contract.md`, `docs/ai/security.md` | `docs/ai/review-checklists/engine-review.md`, `docs/ai/review-checklists/security-review.md` | `docs/ai/examples/invalid-gateway-engine-request.json`, `docs/ai/failure-patterns.md` | `contract-visible`, `drift` |
| `GC-04` | `docs/ai/gateway-engine-contract.md`, `docs/ai/auth.md` | `docs/ai/review-checklists/auth-review.md`, `docs/ai/review-checklists/gateway-review.md` | - | `approved boundary`, `internal contract` |
| `GC-05` | `docs/ai/gateway-engine-contract.md` | `docs/ai/review-checklists/engine-review.md`, `docs/ai/review-checklists/security-review.md` | `docs/ai/examples/invalid-gateway-engine-request.json`, `docs/ai/failure-patterns.md` | `contract-visible`, `drift` |
| `GC-06` | `docs/ai/gateway-engine-contract.md`, `docs/ai/client-gateway-contract.md` | `docs/ai/review-checklists/engine-review.md`, `docs/ai/review-checklists/security-review.md`, `docs/ai/review-checklists/gateway-review.md` | `docs/ai/examples/approval-request-event.json`, `docs/ai/examples/approval-result-event.json`, `docs/ai/examples/invalid-approval-request-event.json`, `docs/ai/examples/invalid-approval-result-event.json`, `docs/ai/failure-patterns.md` | `contract-visible`, `client contract` |

## Source Docs

- `docs/ai/compliance-matrix.md`
- `docs/ai/decision-glossary.md`
- `docs/ai/primer-audit-playbook.md`
- `docs/ai/failure-patterns.md`
- `docs/ai/client-gateway-contract.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/configuration.md`
- `docs/ai/examples/README.md`
- `docs/ai/review-checklists/gateway-review.md`
- `docs/ai/review-checklists/memory-review.md`
- `docs/ai/review-checklists/auth-review.md`
