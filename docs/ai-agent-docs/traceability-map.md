# Traceability Map

> Map of every compliance-matrix row to its owning primer doc, related checklist, example location, and glossary terms.

## Purpose

Make it easy to trace any audit rule back to the primer text, targeted review surface, concrete examples, and shared terminology that support it.

## Foundation Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `F-01` | `docs/ai-agent-docs/foundation.md` | - | - | `conformance gate`, `drift` |
| `F-02` | `docs/ai-agent-docs/foundation.md` | - | - | `client contract`, `internal contract` |
| `F-03` | `docs/ai-agent-docs/foundation.md` | - | - | `drift` |
| `F-04` | `docs/ai-agent-docs/foundation.md`, `docs/ai-agent-docs/memory.md` | `docs/ai-agent-docs/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |

## Gateway And Client Contract Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `G-01` | `docs/ai-agent-docs/gateway.md` | `docs/ai-agent-docs/review-checklists/gateway-review.md` | - | `approved boundary`, `drift` |
| `G-02` | `docs/ai-agent-docs/gateway.md` | `docs/ai-agent-docs/review-checklists/gateway-review.md` | - | `drift` |
| `G-03` | `docs/ai-agent-docs/gateway.md`, `docs/ai-agent-docs/memory.md` | `docs/ai-agent-docs/review-checklists/gateway-review.md`, `docs/ai-agent-docs/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |
| `G-04` | `docs/ai-agent-docs/gateway.md`, `docs/ai-agent-docs/memory.md` | `docs/ai-agent-docs/review-checklists/gateway-review.md`, `docs/ai-agent-docs/review-checklists/memory-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `approved boundary`, `drift` |
| `G-05` | `docs/ai-agent-docs/client-gateway-contract.md` | `docs/ai-agent-docs/review-checklists/gateway-review.md` | `docs/ai-agent-docs/examples/client-message-request.json`, `docs/ai-agent-docs/examples/invalid-client-message-request.json` | `client contract`, `internal contract` |
| `G-06` | `docs/ai-agent-docs/client-gateway-contract.md` | `docs/ai-agent-docs/review-checklists/gateway-review.md` | `docs/ai-agent-docs/examples/conversation-list-response.json`, `docs/ai-agent-docs/examples/conversation-detail-response.json`, `docs/ai-agent-docs/examples/invalid-conversation-list-response.json`, `docs/ai-agent-docs/examples/invalid-conversation-detail-response.json` | `client contract`, `drift` |
| `G-07` | `docs/ai-agent-docs/client-gateway-contract.md` | `docs/ai-agent-docs/review-checklists/gateway-review.md` | `docs/ai-agent-docs/examples/conversation-list-response.json`, `docs/ai-agent-docs/examples/conversation-detail-response.json` | `client contract`, `contract-visible` |

## Engine Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `E-01` | `docs/ai-agent-docs/engine.md` | `docs/ai-agent-docs/review-checklists/engine-review.md` | - | `drift` |
| `E-02` | `docs/ai-agent-docs/engine.md` | `docs/ai-agent-docs/review-checklists/engine-review.md` | - | `approved boundary`, `drift` |
| `E-03` | `docs/ai-agent-docs/engine.md`, `docs/ai-agent-docs/models.md` | `docs/ai-agent-docs/review-checklists/engine-review.md`, `docs/ai-agent-docs/review-checklists/configuration-review.md` | - | `drift` |
| `E-04` | `docs/ai-agent-docs/engine.md`, `docs/ai-agent-docs/gateway-engine-contract.md` | `docs/ai-agent-docs/review-checklists/engine-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `conformance gate`, `drift` |

## Configuration Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `C-01` | `docs/ai-agent-docs/configuration.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md` | `docs/ai-agent-docs/examples/runtime-config.json`, `docs/ai-agent-docs/examples/adapter-config.json`, `docs/ai-agent-docs/examples/invalid-runtime-config.json`, `docs/ai-agent-docs/examples/invalid-adapter-config.json` | `startup readiness`, `drift` |
| `C-02` | `docs/ai-agent-docs/configuration.md`, `docs/ai-agent-docs/gateway-engine-contract.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md`, `docs/ai-agent-docs/review-checklists/gateway-review.md` | `docs/ai-agent-docs/examples/runtime-config.json`, `docs/ai-agent-docs/examples/gateway-engine-request.json`, `docs/ai-agent-docs/examples/invalid-runtime-config.json`, `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json` | `internal contract`, `drift` |
| `C-03` | `docs/ai-agent-docs/configuration.md`, `docs/ai-agent-docs/security.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md`, `docs/ai-agent-docs/review-checklists/security-review.md` | `docs/ai-agent-docs/examples/runtime-config.json`, `docs/ai-agent-docs/examples/adapter-config.json`, `docs/ai-agent-docs/examples/invalid-runtime-config.json`, `docs/ai-agent-docs/examples/invalid-adapter-config.json` | `product-owned state`, `startup readiness` |

## Memory Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `M-01` | `docs/ai-agent-docs/memory.md` | `docs/ai-agent-docs/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |
| `M-02` | `docs/ai-agent-docs/memory.md` | `docs/ai-agent-docs/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |
| `M-03` | `docs/ai-agent-docs/memory.md` | `docs/ai-agent-docs/review-checklists/memory-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `product-owned state`, `startup readiness` |
| `M-04` | `docs/ai-agent-docs/memory.md` | `docs/ai-agent-docs/review-checklists/memory-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `startup readiness`, `drift` |
| `M-05` | `docs/ai-agent-docs/memory.md`, `docs/ai-agent-docs/gateway.md` | `docs/ai-agent-docs/review-checklists/memory-review.md`, `docs/ai-agent-docs/review-checklists/gateway-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `approved boundary`, `drift` |
| `M-06` | `docs/ai-agent-docs/memory.md` | `docs/ai-agent-docs/review-checklists/memory-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `approved boundary`, `product-owned state` |

## Auth Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `A-01` | `docs/ai-agent-docs/auth.md` | `docs/ai-agent-docs/review-checklists/auth-review.md`, `docs/ai-agent-docs/review-checklists/gateway-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `approved boundary`, `drift` |
| `A-02` | `docs/ai-agent-docs/auth.md` | `docs/ai-agent-docs/review-checklists/auth-review.md` | - | `approved boundary`, `drift` |
| `A-03` | `docs/ai-agent-docs/auth.md` | `docs/ai-agent-docs/review-checklists/auth-review.md` | - | `product-owned state` |
| `A-04` | `docs/ai-agent-docs/auth.md`, `docs/ai-agent-docs/security.md` | `docs/ai-agent-docs/review-checklists/auth-review.md`, `docs/ai-agent-docs/review-checklists/security-review.md` | - | `product-owned state`, `drift` |
| `A-05` | `docs/ai-agent-docs/auth.md` | `docs/ai-agent-docs/review-checklists/auth-review.md`, `docs/ai-agent-docs/review-checklists/security-review.md` | - | `product-owned state`, `startup readiness` |

## Security Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `S-01` | `docs/ai-agent-docs/security.md`, `docs/ai-agent-docs/gateway-engine-contract.md` | `docs/ai-agent-docs/review-checklists/security-review.md`, `docs/ai-agent-docs/review-checklists/engine-review.md` | `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json`, `docs/ai-agent-docs/failure-patterns.md` | `contract-visible`, `drift` |
| `S-02` | `docs/ai-agent-docs/security.md` | `docs/ai-agent-docs/review-checklists/security-review.md` | - | `startup readiness`, `drift` |
| `S-03` | `docs/ai-agent-docs/security.md` | `docs/ai-agent-docs/review-checklists/security-review.md`, `docs/ai-agent-docs/review-checklists/auth-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `contract-visible`, `approved boundary` |
| `S-04` | `docs/ai-agent-docs/security.md`, `docs/ai-agent-docs/tools.md` | `docs/ai-agent-docs/review-checklists/security-review.md` | - | `approved boundary`, `startup readiness` |
| `S-05` | `docs/ai-agent-docs/client-gateway-contract.md`, `docs/ai-agent-docs/gateway-engine-contract.md` | `docs/ai-agent-docs/review-checklists/security-review.md`, `docs/ai-agent-docs/review-checklists/gateway-review.md` | `docs/ai-agent-docs/examples/approval-request-event.json`, `docs/ai-agent-docs/examples/approval-result-event.json`, `docs/ai-agent-docs/examples/invalid-approval-request-event.json`, `docs/ai-agent-docs/examples/invalid-approval-result-event.json`, `docs/ai-agent-docs/failure-patterns.md` | `contract-visible`, `client contract` |

## Models Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `MO-01` | `docs/ai-agent-docs/models.md` | `docs/ai-agent-docs/review-checklists/engine-review.md`, `docs/ai-agent-docs/review-checklists/configuration-review.md` | - | `drift` |
| `MO-02` | `docs/ai-agent-docs/models.md`, `docs/ai-agent-docs/configuration.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md` | `docs/ai-agent-docs/examples/runtime-config.json`, `docs/ai-agent-docs/examples/adapter-config.json` | `product-owned state`, `startup readiness` |
| `MO-03` | `docs/ai-agent-docs/models.md`, `docs/ai-agent-docs/configuration.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md`, `docs/ai-agent-docs/review-checklists/engine-review.md` | - | `drift` |

## Tools Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `T-01` | `docs/ai-agent-docs/tools.md` | `docs/ai-agent-docs/review-checklists/security-review.md` | - | `drift` |
| `T-02` | `docs/ai-agent-docs/tools.md`, `docs/ai-agent-docs/auth.md` | `docs/ai-agent-docs/review-checklists/auth-review.md`, `docs/ai-agent-docs/review-checklists/security-review.md` | - | `approved boundary` |
| `T-03` | `docs/ai-agent-docs/tools.md`, `docs/ai-agent-docs/configuration.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md`, `docs/ai-agent-docs/review-checklists/security-review.md` | - | `startup readiness`, `approved boundary` |

## Deployment And Startup Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `D-01` | `docs/ai-agent-docs/deployment.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md` | - | `startup readiness` |
| `D-02` | `docs/ai-agent-docs/deployment.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `startup readiness` |
| `D-03` | `docs/ai-agent-docs/deployment.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md` | - | `startup readiness` |
| `D-04` | `docs/ai-agent-docs/deployment.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md` | - | `startup readiness` |
| `D-05` | `docs/ai-agent-docs/memory.md`, `docs/ai-agent-docs/build-sequence.md` | `docs/ai-agent-docs/review-checklists/memory-review.md`, `docs/ai-agent-docs/review-checklists/configuration-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `startup readiness`, `conformance gate` |
| `D-06` | `docs/ai-agent-docs/configuration.md`, `docs/ai-agent-docs/build-sequence.md` | `docs/ai-agent-docs/review-checklists/configuration-review.md` | `docs/ai-agent-docs/configuration.md`, `docs/ai-agent-docs/failure-patterns.md` | `startup readiness`, `conformance gate` |
| `D-07` | `docs/ai-agent-docs/memory.md`, `docs/ai-agent-docs/accepted-mvp-limits.md` | `docs/ai-agent-docs/review-checklists/memory-review.md`, `docs/ai-agent-docs/review-checklists/configuration-review.md` | `docs/ai-agent-docs/failure-patterns.md` | `accepted limitation`, `startup readiness` |

## Customization Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `CU-01` | `docs/ai-agent-docs/customization.md` | - | - | `accepted limitation`, `drift` |
| `CU-02` | `docs/ai-agent-docs/customization.md` | - | - | `client contract`, `internal contract` |
| `CU-03` | `docs/ai-agent-docs/customization.md` | - | - | `one-shot build`, `drift` |

## Gateway-Engine Contract Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `GC-01` | `docs/ai-agent-docs/gateway-engine-contract.md` | `docs/ai-agent-docs/review-checklists/engine-review.md` | `docs/ai-agent-docs/examples/gateway-engine-request.json`, `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json` | `internal contract` |
| `GC-02` | `docs/ai-agent-docs/gateway-engine-contract.md` | `docs/ai-agent-docs/review-checklists/engine-review.md` | `docs/ai-agent-docs/examples/gateway-engine-request.json` | `contract-visible`, `internal contract` |
| `GC-03` | `docs/ai-agent-docs/gateway-engine-contract.md`, `docs/ai-agent-docs/security.md` | `docs/ai-agent-docs/review-checklists/engine-review.md`, `docs/ai-agent-docs/review-checklists/security-review.md` | `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json`, `docs/ai-agent-docs/failure-patterns.md` | `contract-visible`, `drift` |
| `GC-04` | `docs/ai-agent-docs/gateway-engine-contract.md`, `docs/ai-agent-docs/auth.md` | `docs/ai-agent-docs/review-checklists/auth-review.md`, `docs/ai-agent-docs/review-checklists/gateway-review.md` | - | `approved boundary`, `internal contract` |
| `GC-05` | `docs/ai-agent-docs/gateway-engine-contract.md` | `docs/ai-agent-docs/review-checklists/engine-review.md`, `docs/ai-agent-docs/review-checklists/security-review.md` | `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json`, `docs/ai-agent-docs/failure-patterns.md` | `contract-visible`, `drift` |
| `GC-06` | `docs/ai-agent-docs/gateway-engine-contract.md`, `docs/ai-agent-docs/client-gateway-contract.md` | `docs/ai-agent-docs/review-checklists/engine-review.md`, `docs/ai-agent-docs/review-checklists/security-review.md`, `docs/ai-agent-docs/review-checklists/gateway-review.md` | `docs/ai-agent-docs/examples/approval-request-event.json`, `docs/ai-agent-docs/examples/approval-result-event.json`, `docs/ai-agent-docs/examples/invalid-approval-request-event.json`, `docs/ai-agent-docs/examples/invalid-approval-result-event.json`, `docs/ai-agent-docs/failure-patterns.md` | `contract-visible`, `client contract` |

## Source Docs

- `docs/ai-agent-docs/compliance-matrix.md`
- `docs/ai-agent-docs/decision-glossary.md`
- `docs/ai-agent-docs/primer-audit-playbook.md`
- `docs/ai-agent-docs/failure-patterns.md`
- `docs/ai-agent-docs/client-gateway-contract.md`
- `docs/ai-agent-docs/gateway-engine-contract.md`
- `docs/ai-agent-docs/configuration.md`
- `docs/ai-agent-docs/examples/README.md`
- `docs/ai-agent-docs/review-checklists/gateway-review.md`
- `docs/ai-agent-docs/review-checklists/memory-review.md`
- `docs/ai-agent-docs/review-checklists/auth-review.md`
