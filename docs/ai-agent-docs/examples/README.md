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
- `approval-request-event.json` - client-facing approval request event payload, for products that add approval prompts (the architecture requires none by default)
- `invalid-approval-request-event.json` - drift example missing required approval context
- `approval-result-event.json` - client-facing approval result event payload, for products that add approval prompts
- `invalid-approval-result-event.json` - drift example missing required decision linkage
- `gateway-engine-request.json` - canonical internal Gateway -> Agent Loop request (no system message: the bootstrap prompt is Agent Loop configuration)
- `invalid-gateway-engine-request.json` - drift example that leaks config and secrets into metadata
- `runtime-config.json` - canonical startup-ready runtime config
- `invalid-runtime-config.json` - drift example with collapsed config, embedded secret values, a model fixed in runtime config, and an approval rule in config instead of Auth
- `adapter-config.json` - canonical adapter config
- `invalid-adapter-config.json` - drift example with product/runtime concerns (and an approval rule) mixed into adapter config

## Authority Mapping

- Client-facing payloads -> `docs/ai-agent-docs/client-gateway-contract.md`
- Internal Agent Loop handoff -> `docs/ai-agent-docs/gateway-agent-loop-contract.md`
- Startup/runtime config -> `docs/ai-agent-docs/configuration.md`
- Pass/fail enforcement -> `docs/ai-agent-docs/compliance-matrix.md`
- Cross-reference map -> `docs/ai-agent-docs/traceability-map.md`

## Usage Rules

- Use valid examples as canonical defaults unless a primer explicitly defines a different allowed shape.
- Use invalid examples as drift references, not alternative implementations.
- If a contract or config rule changes, update both the valid and invalid example pair in the same change.

## Source Docs

- `docs/ai-agent-docs/client-gateway-contract.md`
- `docs/ai-agent-docs/gateway-agent-loop-contract.md`
- `docs/ai-agent-docs/configuration.md`
- `docs/ai-agent-docs/compliance-matrix.md`
- `docs/ai-agent-docs/traceability-map.md`
- `docs/ai-agent-docs/primer-change-policy.md`

## Contract Alignment

The examples follow the current contract files, which are behind the specs in `docs/in-depth-overview/` in these places:

- `gateway-engine-request.json` does not show the model or the request timestamp; their field names are pending the next revision of `specs/openapi/gateway-engine.yaml`.
- Message content is shown as a plain string and conversation detail shows only user and assistant text. The specs require content as a list of parts and tool calls and tool results in history; `specs/schemas/message.json` and `specs/openapi/gateway-api.yaml` have not caught up.
