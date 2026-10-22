# Gateway ↔ Agent Loop Contract

> The bounded internal handoff between Gateway and Agent Loop.

## Purpose

Define the exact internal request and stream contract so Gateway and Agent Loop remain decoupled and auditably compliant.

## Contract Shape

- Two internal operations: `POST /agent-loop/chat` and `POST /agent-loop/cancel`
- Request body: `messages`, the model and provider to use, and `metadata`
- Response: SSE stream
- The Gateway calls Auth on every request before it POSTs; the Agent Loop asks Auth before each tool call

## Request

### Required

- `messages`
- the model to use for this request (the owner's current choice, read by the Gateway on every message)
- the owner's active provider profile as `provider` (read by the Gateway on every message with the model)
- `metadata.correlation_id`

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
- Provider adapter or endpoint configuration as per-request config (the active provider profile name is carried, not its connection details).
- A system message assembled by the Gateway from configuration.
- Hidden reconfiguration state that belongs to startup config or preferences. (The model and provider profile are the per-request choices the request carries.)

## Response Events

- `text-delta`
- `tool-call`
- `tool-result`
- `done`
- `error`

## Cancellation

The Gateway cancels an active turn by sending its `correlation_id` to
`POST /agent-loop/cancel` with `reason=auth_revoked` after Auth revokes the
actor. The Agent Loop cancels supported in-flight work, starts no further model
or tool calls, emits `auth_error`, and does not permit retry under the revoked
context. Cancellation is cooperative and idempotent.

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

- `contracts/examples/gateway-engine-request.json`

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Write a project spec." }
      ]
    }
  ],
  "model": "local/llama-3.1-8b",
  "provider": "local",
  "auth_context": {
    "actor": { "id": "owner_abc123", "type": "owner", "display_name": "Owner", "status": "active", "created": "2026-01-15T10:30:00Z" },
    "authentication_id": "authn_123",
    "authenticated_at": "2026-10-21T15:00:00Z",
    "correlation_id": "req_123"
  },
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

The request carries the model to use as `model` and the active provider profile as `provider`. The canonical request metadata requires
`correlation_id`; it does not require a separate request timestamp.

## Invalid Drift Example

Standalone file:

- `contracts/examples/invalid-gateway-engine-request.json`

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
- The Gateway attaches the canonical `auth_context` Auth returns or rejects the request with 401. The transport adapter may use headers, message metadata, or direct-call arguments, but the payload and integrity rules are identical.
- Agent Loop consumes already-authenticated context; it does not authenticate requests itself.
- Before each tool call, the Agent Loop asks Auth whether this actor may make it, and honours the answer. It does not decide permissions itself.
- If Auth can't be reached, fail closed.

## Required Behaviors

- Keep the internal handoff bounded.
- Pass the owner's current model and provider choice on every request, so a change applies to the next message with no restart.
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
- Does every request carry the model and provider, and does a change to either apply without a restart?
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

- `architecture/gateway-agent-loop-contract.md`
- `architecture/gateway-spec.md`
- `architecture/agent-loop-spec.md`
- `architecture/communication-principles.md`
- `architecture/overview.md`

## Contract Alignment

The canonical contract files under `contracts/` are authoritative for this primer. The
request includes `model`, messages use structured content parts, the internal endpoint
is `/agent-loop/chat`, and shared Auth/error contracts define the boundary behavior.
