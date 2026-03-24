# Gateway-Engine Contract

> The bounded internal handoff between Gateway and Agent Loop.

## Purpose

Define the exact internal request and stream contract so Gateway and Engine remain decoupled and auditably compliant.

## Contract Shape

- One internal endpoint: `POST /engine/chat`
- Request body: `messages` plus `metadata`
- Response: SSE stream
- Auth sits on the path

## Request

### Required

- `messages`
- `metadata.correlation_id`

### Optional

- `metadata.conversation_id`
- `metadata.trigger`
- `metadata.client_context`

### Messages Are Built From

1. System message from configuration.
2. Conversation history from Memory via Gateway conversation-store access.
3. Current message from the client or trigger.

## What Must Not Be In The Request

- Tool definitions as per-request config.
- Provider configuration as per-request config.
- Hidden reconfiguration state that belongs to startup config or preferences.

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
- Error messages must be safe for client display.

## Approval Interaction

- Approval enforcement remains a coded control.
- Approval requests and outcomes must be represented through the Gateway-Engine interaction model rather than only a local client-specific prompt path.
- Approval semantics must not be trapped in a single CLI or UI implementation.

## Valid Example

Standalone file:

- `docs/ai/examples/gateway-engine-request.json`

```json
{
  "messages": [
    {"role":"system","content":"You are BrainDrive."},
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

## Invalid Drift Example

Standalone file:

- `docs/ai/examples/invalid-gateway-engine-request.json`

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

## Auth On Path

- Auth validates the request before the Agent Loop handles it.
- Auth attaches identity context via headers.
- Engine consumes already-authenticated context; it does not authenticate requests itself.

## Required Behaviors

- Keep the internal handoff bounded.
- Preserve explicit stream event semantics.
- Keep the contract internal rather than treating it as a third public API.
- Allow Gateway and Engine to evolve independently as long as the contract holds.

## Forbidden Behaviors

- Smuggling configuration through metadata.
- Off-contract stream/event shapes.
- Unsafe raw error text in stream events.
- Hidden side channels for responsibilities that belong in contracts or configuration.

## Audit Questions

- What exactly may Gateway send to Engine?
- What exactly may Engine emit back?
- Is forbidden configuration leaking through the contract?
- Are error and tool events contract-compliant?
- Is Auth actually on the path?

## Common Drift Patterns

- Provider/tool config leaking into request-time payloads.
- Missing or collapsed error taxonomy.
- Approval or tool interactions implemented outside the stream contract.
- Unsafe raw error text forwarded through events.

## Source Docs

- `docs/gateway-engine-contract.md`
- `docs/gateway-spec.md`
- `docs/engine-spec.md`
- `docs/communication-principles.md`
- `docs/foundation-spec.md`
