# Examples

> Standalone canonical payload and config examples for the published contracts.

## Purpose

Provide copyable valid and invalid example files so implementers, reviewers, and tooling can reference exact shapes without extracting JSON from prose docs.

## Files

- `client-message-request.json` - canonical external client request body
- `invalid-client-message-request.json` - drift example where the client fabricates the internal contract
- `conversation-list-response.json` - canonical `GET /conversations` response
- `invalid-conversation-list-response.json` - drift example with raw storage-oriented shape
- `conversation-detail-response.json` - canonical `GET /conversations/:id` response
- `invalid-conversation-detail-response.json` - drift example with unstable/raw message shape
- `approval-request-event.json` - client-facing approval request event payload, for products that add approval prompts (the architecture requires none by default); its lifecycle is defined by `contracts/schemas/approval-request.json`
- `invalid-approval-request-event.json` - drift example missing required approval context
- `approval-result-event.json` - client-facing approval result event payload, for products that add approval prompts; its terminal decision shape is defined by `contracts/schemas/approval-decision.json`
- `invalid-approval-result-event.json` - drift example missing required decision linkage
- `context-notice-event.json` - optional Gateway notice when older turns are omitted or summarized
- `invalid-context-notice-event.json` - drift example missing the omitted-turn count
- `gateway-engine-request.json` - canonical internal Gateway -> Agent Loop request with per-request model and provider, structured message parts, and an optional separate deterministic context summary
- `invalid-gateway-engine-request.json` - drift example that leaks config and secrets into metadata
- `invalid-gateway-engine-request-missing-provider.json` - otherwise-valid request missing only the required `provider`
- `runtime-config.json` - canonical startup-ready runtime config
- `invalid-runtime-config.json` - drift example with collapsed config, embedded secret values, a model fixed in runtime config, and an approval rule in config instead of Auth
- `adapter-config.json` - canonical adapter config: provider profiles (an endpoint each, plus a secret reference when the provider needs a key) and a default profile, no pinned model
- `invalid-adapter-config.json` - drift example with product/runtime concerns (and an approval rule) mixed into adapter config
- `memory-restore-tool.json` - canonical memory restore tool definition
- `audit-record.json` - canonical portable audit record

## Authority Mapping

- Client-facing payloads -> `contracts/openapi/gateway-api.yaml`
- Internal Agent Loop handoff -> `contracts/openapi/gateway-engine.yaml`
- Startup/runtime config -> `contracts/schemas/configuration.json`
- Pass/fail enforcement -> `conformance/arch-tests.md`
- Example-to-source and test mapping -> `contracts/examples/examples-manifest.json`
- Memory restore tool -> `architecture/memory-spec.md`

## Usage Rules

- Use valid examples only when they validate against the canonical contract; the contract is authoritative.
- Use invalid examples as drift references, not alternative implementations.
- If a contract or config rule changes, update both the valid and invalid example pair in the same change.

## Source Docs

- `contracts/openapi/gateway-api.yaml`
- `contracts/openapi/gateway-engine.yaml`
- `contracts/schemas/configuration.json`
- `conformance/arch-tests.md`
- `contracts/examples/examples-manifest.json`

## Contract Alignment

The examples follow the current canonical contract files:

- `gateway-engine-request.json` includes the per-request model and active provider profile. Correlation and conversation metadata remain in the request metadata object.
- Message content is a list of parts. Tool calls and tool results use the same message-part shape and remain in conversation history.
- `memory-restore-tool.json` defines the canonical restore operation inputs: a path or scope and an opaque version identifier.
