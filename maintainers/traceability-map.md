# Traceability Map

> Map of every compliance-matrix row to its owning primer doc, related checklist, example location, and glossary terms.

## Purpose

Make it easy to trace any audit rule back to the primer text, targeted review surface, concrete examples, and shared terminology that support it.

## Foundation Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `F-01` | `build/primers/foundation.md` | - | - | `conformance gate`, `drift` |
| `F-02` | `build/primers/foundation.md` | - | - | `client contract`, `internal contract` |
| `F-03` | `build/primers/foundation.md` | - | - | `drift` |
| `F-04` | `build/primers/foundation.md`, `build/primers/memory.md` | `conformance/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |

## Gateway And Client Contract Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `G-01` | `build/primers/gateway.md` | `conformance/review-checklists/gateway-review.md` | - | `approved boundary`, `drift` |
| `G-02` | `build/primers/gateway.md` | `conformance/review-checklists/gateway-review.md` | - | `drift` |
| `G-03` | `build/primers/gateway.md`, `build/primers/memory.md` | `conformance/review-checklists/gateway-review.md`, `conformance/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |
| `G-04` | `build/primers/gateway.md`, `build/primers/memory.md` | `conformance/review-checklists/gateway-review.md`, `conformance/review-checklists/memory-review.md` | `build/failure-patterns.md` | `approved boundary`, `drift` |
| `G-05` | `build/primers/client-gateway-contract.md` | `conformance/review-checklists/gateway-review.md` | `contracts/examples/client-message-request.json`, `contracts/examples/invalid-client-message-request.json` | `client contract`, `internal contract` |
| `G-06` | `build/primers/client-gateway-contract.md` | `conformance/review-checklists/gateway-review.md` | `contracts/examples/conversation-list-response.json`, `contracts/examples/conversation-detail-response.json`, `contracts/examples/invalid-conversation-list-response.json`, `contracts/examples/invalid-conversation-detail-response.json` | `client contract`, `drift` |
| `G-07` | `build/primers/client-gateway-contract.md` | `conformance/review-checklists/gateway-review.md` | `contracts/examples/conversation-list-response.json`, `contracts/examples/conversation-detail-response.json` | `client contract`, `contract-visible` |
| `G-09` | `build/primers/gateway.md`, `build/primers/client-gateway-contract.md` | `conformance/review-checklists/gateway-review.md` | - | `client contract`, `drift` |

## Agent Loop Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `E-01` | `build/primers/agent-loop.md` | `conformance/review-checklists/agent-loop-review.md` | - | `drift` |
| `E-02` | `build/primers/agent-loop.md` | `conformance/review-checklists/agent-loop-review.md` | - | `approved boundary`, `drift` |
| `E-03` | `build/primers/agent-loop.md`, `build/primers/models.md` | `conformance/review-checklists/agent-loop-review.md`, `conformance/review-checklists/configuration-review.md` | - | `drift` |
| `E-04` | `build/primers/agent-loop.md`, `build/primers/gateway-agent-loop-contract.md` | `conformance/review-checklists/agent-loop-review.md` | `build/failure-patterns.md` | `conformance gate`, `drift` |
| `E-05` | `build/primers/agent-loop.md`, `build/primers/models.md` | `conformance/review-checklists/agent-loop-review.md`, `conformance/review-checklists/configuration-review.md` | - | `internal contract`, `drift` |
| `E-06` | `build/primers/agent-loop.md`, `build/primers/gateway-agent-loop-contract.md` | `conformance/review-checklists/agent-loop-review.md` | `contracts/examples/gateway-engine-request.json` | `internal contract` |

## Configuration Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `C-01` | `build/primers/configuration.md` | `conformance/review-checklists/configuration-review.md` | `contracts/examples/runtime-config.json`, `contracts/examples/adapter-config.json`, `contracts/examples/invalid-runtime-config.json`, `contracts/examples/invalid-adapter-config.json` | `startup readiness`, `drift` |
| `C-02` | `build/primers/configuration.md`, `build/primers/gateway-agent-loop-contract.md` | `conformance/review-checklists/configuration-review.md`, `conformance/review-checklists/gateway-review.md` | `contracts/examples/runtime-config.json`, `contracts/examples/gateway-engine-request.json`, `contracts/examples/invalid-runtime-config.json`, `contracts/examples/invalid-gateway-engine-request.json` | `internal contract`, `drift` |
| `C-03` | `build/primers/configuration.md`, `build/primers/security.md` | `conformance/review-checklists/configuration-review.md`, `conformance/review-checklists/security-review.md` | `contracts/examples/runtime-config.json`, `contracts/examples/adapter-config.json`, `contracts/examples/invalid-runtime-config.json`, `contracts/examples/invalid-adapter-config.json` | `product-owned state`, `startup readiness` |
| `C-04` | `build/primers/configuration.md`, `build/primers/auth.md` | `conformance/review-checklists/configuration-review.md`, `conformance/review-checklists/auth-review.md` | `contracts/examples/invalid-runtime-config.json`, `contracts/examples/invalid-adapter-config.json` | `drift` |
| `C-05` | `build/primers/configuration.md`, `build/primers/customization.md` | `conformance/review-checklists/configuration-review.md` | - | `drift` |

## Memory Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `M-01` | `build/primers/memory.md` | `conformance/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |
| `M-02` | `build/primers/memory.md` | `conformance/review-checklists/memory-review.md` | - | `approved boundary`, `drift` |
| `M-03` | `build/primers/memory.md` | `conformance/review-checklists/memory-review.md` | `build/failure-patterns.md` | `product-owned state`, `startup readiness` |
| `M-04` | `build/primers/memory.md` | `conformance/review-checklists/memory-review.md` | `build/failure-patterns.md` | `startup readiness`, `drift` |
| `M-05` | `build/primers/memory.md`, `build/primers/gateway.md` | `conformance/review-checklists/memory-review.md`, `conformance/review-checklists/gateway-review.md` | `build/failure-patterns.md` | `approved boundary`, `drift` |
| `M-06` | `build/primers/memory.md` | `conformance/review-checklists/memory-review.md` | `build/failure-patterns.md` | `approved boundary`, `product-owned state` |
| `M-07` | `build/primers/memory.md` | `conformance/review-checklists/memory-review.md` | - | `drift` |

## Auth Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `A-01` | `build/primers/auth.md` | `conformance/review-checklists/auth-review.md`, `conformance/review-checklists/gateway-review.md` | `build/failure-patterns.md` | `approved boundary`, `drift` |
| `A-02` | `build/primers/auth.md` | `conformance/review-checklists/auth-review.md` | - | `approved boundary`, `drift` |
| `A-03` | `build/primers/auth.md` | `conformance/review-checklists/auth-review.md` | - | `product-owned state` |
| `A-04` | `build/primers/auth.md`, `build/primers/security.md` | `conformance/review-checklists/auth-review.md`, `conformance/review-checklists/security-review.md` | - | `product-owned state`, `drift` |
| `A-05` | `build/primers/auth.md` | `conformance/review-checklists/auth-review.md`, `conformance/review-checklists/security-review.md` | - | `product-owned state`, `startup readiness` |
| `A-06` | `build/primers/auth.md`, `build/primers/tools.md`, `build/primers/agent-loop.md` | `conformance/review-checklists/auth-review.md`, `conformance/review-checklists/agent-loop-review.md` | `build/failure-patterns.md` | `approved boundary`, `drift` |
| `A-07` | `build/primers/auth.md`, `build/primers/tools.md` | `conformance/review-checklists/auth-review.md`, `conformance/review-checklists/security-review.md` | `build/failure-patterns.md` | `drift` |
| `A-08` | `build/primers/auth.md` | `conformance/review-checklists/auth-review.md` | - | `product-owned state` |

## Security Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `S-01` | `build/primers/security.md`, `build/primers/gateway-agent-loop-contract.md` | `conformance/review-checklists/security-review.md`, `conformance/review-checklists/agent-loop-review.md` | `contracts/examples/invalid-gateway-engine-request.json`, `build/failure-patterns.md` | `contract-visible`, `drift` |
| `S-02` | `build/primers/security.md` | `conformance/review-checklists/security-review.md` | - | `startup readiness`, `drift` |
| `S-03` | `build/primers/security.md` | `conformance/review-checklists/security-review.md`, `conformance/review-checklists/auth-review.md` | `build/failure-patterns.md` | `contract-visible`, `approved boundary` |
| `S-04` | `build/primers/security.md`, `build/primers/tools.md` | `conformance/review-checklists/security-review.md` | - | `approved boundary`, `startup readiness` |
| `S-05` | `build/primers/client-gateway-contract.md`, `build/primers/gateway-agent-loop-contract.md` | `conformance/review-checklists/security-review.md`, `conformance/review-checklists/gateway-review.md` | `contracts/examples/approval-request-event.json`, `contracts/examples/approval-result-event.json`, `contracts/examples/invalid-approval-request-event.json`, `contracts/examples/invalid-approval-result-event.json`, `build/failure-patterns.md` | `contract-visible`, `client contract` |
| `S-06` | `build/primers/security.md`, `build/primers/memory.md` | `conformance/review-checklists/security-review.md`, `conformance/review-checklists/memory-review.md` | - | `drift` |

## Models Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `MO-01` | `build/primers/models.md` | `conformance/review-checklists/agent-loop-review.md`, `conformance/review-checklists/configuration-review.md` | - | `drift` |
| `MO-02` | `build/primers/models.md`, `build/primers/configuration.md` | `conformance/review-checklists/configuration-review.md` | `contracts/examples/runtime-config.json`, `contracts/examples/adapter-config.json` | `product-owned state`, `startup readiness` |
| `MO-03` | `build/primers/models.md`, `build/primers/configuration.md` | `conformance/review-checklists/configuration-review.md`, `conformance/review-checklists/agent-loop-review.md` | - | `drift` |
| `MO-04` | `build/primers/models.md` | `conformance/review-checklists/agent-loop-review.md` | - | `drift` |

## Tools Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `T-01` | `build/primers/tools.md` | `conformance/review-checklists/security-review.md` | - | `drift` |
| `T-02` | `build/primers/tools.md`, `build/primers/auth.md` | `conformance/review-checklists/auth-review.md`, `conformance/review-checklists/security-review.md` | - | `approved boundary` |
| `T-03` | `build/primers/tools.md`, `build/primers/configuration.md` | `conformance/review-checklists/configuration-review.md`, `conformance/review-checklists/security-review.md` | - | `startup readiness`, `approved boundary` |

## Deployment And Startup Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `D-01` | `build/primers/deployment.md` | `conformance/review-checklists/configuration-review.md` | - | `startup readiness` |
| `D-02` | `build/primers/deployment.md` | `conformance/review-checklists/configuration-review.md` | `build/failure-patterns.md` | `startup readiness` |
| `D-03` | `build/primers/deployment.md` | `conformance/review-checklists/configuration-review.md` | - | `startup readiness` |
| `D-04` | `build/primers/deployment.md` | `conformance/review-checklists/configuration-review.md` | - | `startup readiness` |
| `D-05` | `build/primers/memory.md`, `build/build-sequence.md` | `conformance/review-checklists/memory-review.md`, `conformance/review-checklists/configuration-review.md` | `build/failure-patterns.md` | `startup readiness`, `conformance gate` |
| `D-06` | `build/primers/configuration.md`, `build/build-sequence.md` | `conformance/review-checklists/configuration-review.md` | `build/primers/configuration.md`, `build/failure-patterns.md` | `startup readiness`, `conformance gate` |
| `D-07` | `build/primers/memory.md`, `maintainers/accepted-mvp-limits.md` | `conformance/review-checklists/memory-review.md`, `conformance/review-checklists/configuration-review.md` | `build/failure-patterns.md` | `accepted limitation`, `startup readiness` |

## Customization Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `CU-01` | `build/primers/customization.md` | - | - | `accepted limitation`, `drift` |
| `CU-02` | `build/primers/customization.md` | - | - | `client contract`, `internal contract` |
| `CU-03` | `build/primers/customization.md` | - | - | `one-shot build`, `drift` |

## Gateway ↔ Agent Loop Contract Rows

| Matrix ID | Owning Primer | Related Checklist | Example Location | Glossary Terms |
|---|---|---|---|---|
| `GC-01` | `build/primers/gateway-agent-loop-contract.md` | `conformance/review-checklists/agent-loop-review.md` | `contracts/examples/gateway-engine-request.json`, `contracts/examples/invalid-gateway-engine-request.json` | `internal contract` |
| `GC-02` | `build/primers/gateway-agent-loop-contract.md` | `conformance/review-checklists/agent-loop-review.md` | `contracts/examples/gateway-engine-request.json` | `contract-visible`, `internal contract` |
| `GC-03` | `build/primers/gateway-agent-loop-contract.md`, `build/primers/security.md` | `conformance/review-checklists/agent-loop-review.md`, `conformance/review-checklists/security-review.md` | `contracts/examples/invalid-gateway-engine-request.json`, `build/failure-patterns.md` | `contract-visible`, `drift` |
| `GC-04` | `build/primers/gateway-agent-loop-contract.md`, `build/primers/auth.md` | `conformance/review-checklists/auth-review.md`, `conformance/review-checklists/gateway-review.md` | - | `approved boundary`, `internal contract` |
| `GC-05` | `build/primers/gateway-agent-loop-contract.md` | `conformance/review-checklists/agent-loop-review.md`, `conformance/review-checklists/security-review.md` | `contracts/examples/invalid-gateway-engine-request.json`, `build/failure-patterns.md` | `contract-visible`, `drift` |
| `GC-06` | `build/primers/gateway-agent-loop-contract.md`, `build/primers/client-gateway-contract.md` | `conformance/review-checklists/agent-loop-review.md`, `conformance/review-checklists/security-review.md`, `conformance/review-checklists/gateway-review.md` | `contracts/examples/approval-request-event.json`, `contracts/examples/approval-result-event.json`, `contracts/examples/invalid-approval-request-event.json`, `contracts/examples/invalid-approval-result-event.json`, `build/failure-patterns.md` | `contract-visible`, `client contract` |
| `GC-07` | `build/primers/gateway-agent-loop-contract.md`, `build/primers/client-gateway-contract.md` | `conformance/review-checklists/agent-loop-review.md`, `conformance/review-checklists/gateway-review.md` | - | `internal contract`, `client contract` |
| `GC-08` | `build/primers/gateway-agent-loop-contract.md` | `conformance/review-checklists/agent-loop-review.md`, `conformance/review-checklists/security-review.md` | - | `internal contract` |

## Source Docs

- `build/compliance-matrix.md`
- `maintainers/decision-glossary.md`
- `maintainers/primer-audit-playbook.md`
- `build/failure-patterns.md`
- `build/primers/client-gateway-contract.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/primers/configuration.md`
- `contracts/examples/README.md`
- `conformance/review-checklists/gateway-review.md`
- `conformance/review-checklists/memory-review.md`
- `conformance/review-checklists/auth-review.md`
