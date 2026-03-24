# AI Primer Index

> Fast routing layer for architecture questions and code-vs-spec audits.

## What This Set Is

This folder is the AI-facing compression layer for the architecture docs. It is derived from the authoritative docs and is meant to answer most architecture review questions without reading the full human-oriented prose first.

## Core Shape

- Four components: Memory, Agent Loop, Auth, Gateway.
- Two external APIs: Gateway API and Model API.
- One important internal contract: Gateway -> Agent Loop.
- Models, tools, and clients are not components.

## Read First

1. `foundation.md`
2. `configuration.md`
3. `gateway-engine-contract.md`
4. The component primer for the area you are reviewing

## Operational Layer

- `build-sequence.md` - architecture-first implementation order
- `primer-audit-playbook.md` - repeatable primer-only audit workflow
- `failure-patterns.md` - recurring drift symptoms, causes, and where to read next
- `traceability-map.md` - map from matrix rows to primers, checklists, examples, and glossary terms
- `primer-completeness-test.md` - standing test for whether the primer can audit a real codebase without fallback
- `review-checklists/` - fast targeted review checklists by area
- `primer-change-policy.md` - rules for keeping the primer layer internally consistent
- `change-log.md` - historical record of primer-layer changes
- `examples/` - standalone canonical payload and config examples
- `examples/README.md` - overview of valid and invalid example files
- `examples-validation.md` - rules for keeping the examples layer aligned with the primer

## Go Here For

- `foundation.md` - system shape, invariants, what counts as a component
- `gateway.md` - conversation ownership, routing, client boundary
- `engine.md` - loop ownership, tool execution, forbidden responsibilities
- `configuration.md` - boot-time vs request-time rules, config taxonomy
- `client-gateway-contract.md` - exact external client request, conversation, and approval contract
- `gateway-engine-contract.md` - exact internal request/stream contract
- `compliance-matrix.md` - pass/fail rules for audits

## Review And Audit Routing

- targeted review by area -> `review-checklists/`
- repeatable audit process -> `primer-audit-playbook.md`
- determine if a symptom matches known drift -> `failure-patterns.md`
- trace a matrix row to supporting docs -> `traceability-map.md`
- test whether the primer is complete enough -> `primer-completeness-test.md`
- distinguish MVP scope cut from true drift -> `accepted-mvp-limits.md`

## Canonical Examples

- `examples/README.md`
- `examples/client-message-request.json`
- `examples/conversation-list-response.json`
- `examples/conversation-detail-response.json`
- `examples/approval-request-event.json`
- `examples/approval-result-event.json`
- `examples/gateway-engine-request.json`
- `examples/runtime-config.json`
- `examples/adapter-config.json`
- `examples-validation.md`

## How To Run Primer Validation

- Validate the examples manifest: `python /home/hex/Project/References/docs/ai/examples/validate-manifest.py`
- Use the audit workflow: `primer-audit-playbook.md`
- Use the standing proof procedure: `primer-completeness-test.md`

## Source Of Truth

These files summarize the authoritative docs. When a question needs exact wording or deeper context, go back to the source docs listed at the end of each primer.

## Source Docs

- `docs/foundation-spec.md`
- `docs/guides/implementers-reference.md`
- `docs/doc-registry.json`
