# Gateway ↔ Agent Loop Contract

> The bounded internal handoff between Gateway and Agent Loop.

## Purpose

Define the exact internal request and stream contract so Gateway and Agent Loop remain decoupled and auditably compliant.

## Contract Shape

- One internal endpoint: `POST /engine/chat` (the path keeps the component's older name until the next contract revision)
- Request body: `messages`, the model to use, and `metadata`
- Response: SSE stream
- The Gateway calls Auth on every request before it POSTs; the Agent Loop asks Auth before each tool call

## Request

### Required

- `messages`
- the model to use for this request (the owner's current choice, read by the Gateway on every message)
- `metadata.correlation_id`
- a request timestamp (ISO 8601)

### Optional

- `metadata.conversation_id`
- `metadata.trigger`
- `metadata.client_context`

### Messages Are Built From

1. Conversation history from Memory via Gateway conversation-store access, including the tool calls and tool results it contains.
2. Current message from the client or trigger.

The bootstrap prompt is not in the request. It is Agent Loop configuration, and the Agent Loop puts it first when it calls the model.

### Message Shape

- One message shape across the Gateway API, this contract, and the Model API.
- Content is a list of parts: text first, with room for images and files.
- Tool calls and tool results are ordinary parts of messages and are saved in conversation history, so a resumed conversation sends them back unchanged.

## What Must Not Be In The Request

- Tool definitions as per-request config.
- Provider configuration as per-request config.
- A system message assembled by the Gateway from configuration.
- Hidden reconfiguration state that belongs to startup config or preferences. (The model is the one per-request choice the request carries.)

## Response Events

- `text-delta`
- `tool-call`
- `tool-result`
- `done`
- `error`

## Error Taxonomy

- `provider_error` for provider or runtime failures.
- `tool_error` for unrecoverable tool-execution failures at the stream-contract level.
- `context_overflow` when the model/provider context window is exceeded.

## Error Rules

- Pre-stream failures use HTTP status codes.
- Mid-stream failures use `error` SSE events.
- Errors must use the contract error taxonomy rather than collapsing to one generic code.
- Every error, HTTP or SSE, carries the request's correlation ID.
- Error messages must be safe for client display.
- A tool call Auth refuses is not run; it returns a `tool-result` error saying the call was not permitted, so the model can tell "not permitted" from "failed".

## Approval Interaction

- The architecture default is that the owner can do everything: no approval step is required.
- Approval prompts are a product choice. Where the owner's rules require approval, the rule lives in Auth and is enforced in code at the Agent Loop's check before the tool call, not by a prompt.
- When a product adds approvals, approval requests and outcomes must be represented through the Gateway ↔ Agent Loop interaction model rather than only a local client-specific prompt path.
- Approval semantics must not be trapped in a single CLI or UI implementation.

## Valid Example

Standalone file:

- `docs/ai-agent-docs/examples/gateway-engine-request.json`

```json
{
  "messages": [
    {"role":"user","content":"Write a project spec."}
  ],
  "metadata": {
    "correlation_id": "req_123",
    "conversation_id": "conv_123",
    "client_context": {
      "client": "braindrive-cli"
    }
  }
}
```

```text
event: text-delta
data: {"delta":"I will draft the spec."}

event: tool-call
data: {"id":"tool_1","name":"memory_write"}

event: tool-result
data: {"id":"tool_1","status":"ok"}

event: done
data: {"finish_reason":"completed"}
```

The request also carries the model to use and a timestamp. Their field names are pending the next revision of `specs/openapi/gateway-engine.yaml`, so the example does not show them.

## Invalid Drift Example

Standalone file:

- `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json`

```json
{
  "messages": [
    {"role":"user","content":"Write a spec."}
  ],
  "metadata": {
    "correlation_id": "req_123",
    "provider": "openrouter",
    "api_key": "secret",
    "tool_sources": ["/tmp/tools"]
  }
}
```

```text
event: error
data: {"code":"provider_error","message":"ENOENT: /home/hex/..."}
```

Why this is drift:

- provider config and tool sources leak through request metadata
- secret material crosses the contract
- raw internal error text is exposed in the stream
- the contract becomes a hidden configuration channel instead of a bounded handoff

## Auth Checks

- The Gateway calls Auth on every request, before anything reaches the Agent Loop. Auth is a separate component called through its contract, not middleware owned by either side.
- The Gateway attaches the identity Auth returns (today via headers) or rejects the request with 401.
- Agent Loop consumes already-authenticated context; it does not authenticate requests itself.
- Before each tool call, the Agent Loop asks Auth whether this actor may make it, and honours the answer. It does not decide permissions itself.
- If Auth can't be reached, fail closed.

## Required Behaviors

- Keep the internal handoff bounded.
- Pass the owner's current model choice on every request, so a change applies to the next message with no restart.
- Preserve explicit stream event semantics.
- Keep the contract internal rather than treating it as a third public API.
- Allow Gateway and Agent Loop to evolve independently as long as the contract holds.

## Forbidden Behaviors

- Smuggling configuration through metadata.
- Off-contract stream/event shapes.
- Unsafe raw error text in stream events.
- Hidden side channels for responsibilities that belong in contracts or configuration.

## Audit Questions

- What exactly may Gateway send to Agent Loop?
- What exactly may Agent Loop emit back?
- Is forbidden configuration leaking through the contract?
- Does every request carry the model, and does a model change apply without a restart?
- Are tool calls and tool results saved in history and replayed on resume?
- Are error and tool events contract-compliant?
- Does the Gateway call Auth on every request, and does the Agent Loop ask Auth before each tool call?

## Common Drift Patterns

- Provider/tool config leaking into request-time payloads.
- Model fixed at Agent Loop startup instead of passed per request.
- Gateway building a system message from config.
- Tool calls dropped from conversation history.
- Missing or collapsed error taxonomy.
- Approval or tool interactions implemented outside the stream contract.
- Unsafe raw error text forwarded through events.

## Source Docs

- `docs/in-depth-overview/gateway-agent-loop-contract.md`
- `docs/in-depth-overview/gateway-spec.md`
- `docs/in-depth-overview/agent-loop-spec.md`
- `docs/in-depth-overview/communication-principles.md`
- `docs/in-depth-overview/foundation-spec.md`

## Contract Alignment

This primer follows `docs/in-depth-overview/gateway-agent-loop-contract.md`, which is ahead of `specs/openapi/gateway-engine.yaml` and `specs/schemas/message.json`:

- No request field yet for the model, and no request timestamp.
- Message content is a string, and tool calls and tool results are not yet message parts.
- Auth is described as middleware between the Gateway and the Agent Loop.
- The system message is described as assembled by the Gateway from configuration.
- Errors carry only `code` and `message`, not the correlation ID.
- The `/engine/chat` path and `engine` schema names still use the component's old name.
