# Examples

> Standalone canonical payload and config examples for the AI primer layer.

## Purpose

Provide copyable valid and invalid example files so implementers, reviewers, and tooling can reference exact shapes without extracting JSON from prose docs.

## Files

- `client-message-request.json` - canonical external client request body
- `invalid-client-message-request.json` - drift example where the client fabricates the internal contract
- `conversation-list-response.json` - canonical `GET /conversations` response
- `invalid-conversation-list-response.json` - drift example with raw storage-oriented shape
- `conversation-detail-response.json` - canonical `GET /conversations/:id` response
- `invalid-conversation-detail-response.json` - drift example with unstable/raw message shape
- `approval-request-event.json` - canonical client-facing approval request event payload
- `invalid-approval-request-event.json` - drift example missing required approval context
- `approval-result-event.json` - canonical client-facing approval result event payload
- `invalid-approval-result-event.json` - drift example missing required decision linkage
- `gateway-engine-request.json` - canonical internal Gateway -> Engine request
- `invalid-gateway-engine-request.json` - drift example that leaks config and secrets into metadata
- `runtime-config.json` - canonical startup-ready runtime config
- `invalid-runtime-config.json` - drift example with collapsed config and embedded secret values
- `adapter-config.json` - canonical adapter config
- `invalid-adapter-config.json` - drift example with product/runtime concerns mixed into adapter config

## Authority Mapping

- Client-facing payloads -> `docs/ai/client-gateway-contract.md`
- Internal Engine handoff -> `docs/ai/gateway-engine-contract.md`
- Startup/runtime config -> `docs/ai/configuration.md`
- Pass/fail enforcement -> `docs/ai/compliance-matrix.md`
- Cross-reference map -> `docs/ai/traceability-map.md`

## Usage Rules

- Use valid examples as canonical defaults unless a primer explicitly defines a different allowed shape.
- Use invalid examples as drift references, not alternative implementations.
- If a contract or config rule changes, update both the valid and invalid example pair in the same change.

## Source Docs

- `docs/ai/client-gateway-contract.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/configuration.md`
- `docs/ai/compliance-matrix.md`
- `docs/ai/traceability-map.md`
- `docs/ai/primer-change-policy.md`
