# Engine

> The generic loop that processes one interaction at a time, calls models, and executes tools.

## Purpose

Run the model-tool loop for an interaction without owning product behavior, conversation storage, or authentication.

## Owns

- The generic request -> model -> tool -> model loop.
- Tool execution during a turn.
- Streaming loop results through the internal contract.
- Model/provider invocation through the model boundary.

## Does Not Own

- Conversation persistence.
- Authentication itself.
- Product-specific prompts or business logic.
- Memory storage implementation details.
- Provider-specific logic outside adapters.

## Dependencies

- Model boundary and adapters.
- Tool runtime surface.
- Auth context already established on the path.
- Memory only through approved tool/config/preference surfaces.

## Interfaces

- Accepts the internal Gateway -> Engine request contract.
- Emits streamed Engine -> Gateway events.
- Invokes models through adapters.
- Invokes tools during the loop.

## Required Behaviors

- Remain generic rather than product-specific.
- Continue the loop until the model signals completion through the contract-defined finish behavior.
- Execute model-requested tools.
- Support concurrent tool execution where allowed.
- Pass tool results back into model context.
- Stay separate from conversation ownership.
- Consume Auth context without becoming Auth.

## Forbidden Behaviors

- Storing or managing conversations.
- Embedding product workflows directly in the loop.
- Reaching into Memory storage directly.
- Putting provider-specific request logic in the loop body.
- Owning approval policy in a way that bypasses contract/tool semantics.

## Lifecycle Rules

- Tool/provider readiness should follow the architecture's configuration model.
- Per-request payloads must not become a hidden configuration channel.
- Runtime behavior must preserve the internal contract shape.

## Audit Questions

- Does Engine own anything besides loop execution?
- Does it receive only contract-bounded request data?
- Is provider-specific logic isolated to adapters?
- Are tool calls executed and returned correctly?
- Has conversation or prompt ownership leaked into Engine?

## Common Drift Patterns

- Request-time re-derivation of provider/tool config.
- Approval logic hardcoded in the loop.
- Product-specific prompt assembly in Engine.
- Provider-specific logic outside adapters.
- Premature loop termination before model-side completion.
- Lossy or off-contract stream behavior.

## Review Links

- Checklist: `docs/ai/review-checklists/engine-review.md`
- Traceability: `docs/ai/traceability-map.md`
- Examples: `docs/ai/examples/README.md`

## Source Docs

- `docs/engine-spec.md`
- `docs/gateway-engine-contract.md`
- `docs/tools-spec.md`
- `docs/configuration-spec.md`
- `docs/foundation-spec.md`
- `docs/communication-principles.md`
