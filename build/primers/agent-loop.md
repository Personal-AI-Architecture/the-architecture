# Agent Loop

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
- Permission decisions (it asks Auth and honours the answer).
- The choice of model (it uses the model named in each request).
- Product-specific prompts or business logic.
- Memory storage implementation details.
- Provider-specific logic outside adapters.

## Dependencies

- Model boundary and adapters.
- Tool runtime surface.
- Auth context already established by the Gateway's Auth check.
- Auth, asked before each tool call.
- Its own configuration, including the bootstrap prompt.
- Memory only through approved tool/config/preference surfaces.

## Interfaces

- Accepts the internal Gateway -> Agent Loop request contract.
- Emits streamed Agent Loop -> Gateway events.
- Invokes models through adapters.
- Invokes tools during the loop.

## Required Behaviors

- Remain generic rather than product-specific.
- Continue the loop until the model signals completion through the contract-defined finish behavior.
- Use the model named in the request, so a changed model choice applies to the next message with no restart.
- Put its configured bootstrap prompt first when it calls the model.
- Ask Auth before each tool call; do not run a call Auth refuses, and tell the model it was not permitted.
- Execute permitted model-requested tools.
- Execute independent tool calls in the same loop turn concurrently; keep dependent calls ordered.
- Pass tool results back into model context.
- Emit tool calls and tool results in the shared message shape so the Gateway can save them in history.
- Stay separate from conversation ownership.
- Consume Auth context without becoming Auth.

## Forbidden Behaviors

- Storing or managing conversations.
- Embedding product workflows directly in the loop.
- Reaching into Memory storage directly.
- Putting provider-specific request logic in the loop body.
- Owning approval policy in a way that bypasses contract/tool semantics.
- Deciding permissions itself instead of asking Auth.
- Running a tool call without an Auth check.
- Requiring a restart to pick up a new model.

## Lifecycle Rules

- Tool/provider readiness should follow the architecture's configuration model (boot time).
- The model is not boot-time configuration: it arrives with each request.
- Per-request payloads must not become a hidden configuration channel.
- Runtime behavior must preserve the internal contract shape.

## Audit Questions

- Does Agent Loop own anything besides loop execution?
- Does it receive only contract-bounded request data?
- Is provider-specific logic isolated to adapters?
- Are tool calls executed and returned correctly?
- Is every tool call checked with Auth first?
- Does the loop use the model from the request?
- Has conversation or prompt ownership leaked into Agent Loop?

## Common Drift Patterns

- Request-time re-derivation of provider/tool config.
- Model fixed at startup instead of taken from the request.
- Approval logic hardcoded in the loop, or a confirm-every-write step treated as an architecture default.
- Tool calls run on the strength of the request-level Auth check alone.
- Product-specific prompt assembly in Agent Loop.
- Provider-specific logic outside adapters.
- Premature loop termination before model-side completion.
- Lossy or off-contract stream behavior.

## Review Links

- Checklist: `conformance/review-checklists/agent-loop-review.md`
- Traceability: `maintainers/traceability-map.md`
- Examples: `contracts/examples/README.md`

## Source Docs

- `architecture/agent-loop-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `architecture/tools-spec.md`
- `architecture/configuration-spec.md`
- `architecture/overview.md`
- `architecture/communication-principles.md`
