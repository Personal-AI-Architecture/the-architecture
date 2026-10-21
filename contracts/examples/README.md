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
- `gateway-engine-request.json` - canonical internal Gateway -> Agent Loop request with the per-request model and structured message parts
- `invalid-gateway-engine-request.json` - drift example that leaks config and secrets into metadata
- `runtime-config.json` - canonical startup-ready runtime config
- `invalid-runtime-config.json` - drift example with collapsed config, embedded secret values, a model fixed in runtime config, and an approval rule in config instead of Auth
- `adapter-config.json` - canonical adapter config
- `invalid-adapter-config.json` - drift example with product/runtime concerns (and an approval rule) mixed into adapter config
- `memory-restore-tool.json` - canonical memory restore tool definition

## Authority Mapping

- Client-facing payloads -> `build/primers/client-gateway-contract.md`
- Internal Agent Loop handoff -> `build/primers/gateway-agent-loop-contract.md`
- Startup/runtime config -> `build/primers/configuration.md`
- Pass/fail enforcement -> `build/compliance-matrix.md`
- Cross-reference map -> `maintainers/traceability-map.md`
- Memory restore tool -> `architecture/memory-spec.md`

## Usage Rules

- Use valid examples as canonical defaults unless a primer explicitly defines a different allowed shape.
- Use invalid examples as drift references, not alternative implementations.
- If a contract or config rule changes, update both the valid and invalid example pair in the same change.

## Source Docs

- `build/primers/client-gateway-contract.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/primers/configuration.md`
- `build/compliance-matrix.md`
- `maintainers/traceability-map.md`
- `maintainers/primer-change-policy.md`

## Contract Alignment

The examples follow the current canonical contract files:

- `gateway-engine-request.json` includes the per-request model. Correlation and conversation metadata remain in the request metadata object.
- Message content is a list of parts. Tool calls and tool results use the same message-part shape and remain in conversation history.
- `memory-restore-tool.json` defines the canonical restore operation inputs: a path or scope and an opaque version identifier.
