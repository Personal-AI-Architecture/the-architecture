# Client-Gateway Contract

> The client-facing API contract between the BrainDrive client and Gateway.

## Purpose

Define the external request, response, conversation, and approval interaction shapes so client implementations do not invent incompatible behavior.

## Contract Shape

- Client sends HTTP requests to the Gateway API.
- Gateway owns conversation lifecycle.
- Gateway normalizes client input into the internal `messages + metadata` handoff.
- Streaming responses use SSE.

## Message Request

### Endpoint

- `POST /message`

### Request Body

```json
{
  "content": "user message text",
  "metadata": {}
}
```

### Required Fields

- `content`

### Optional Fields

- `metadata`

### Rules

- Client request shape stays simple and client-facing.
- Gateway, not the client, builds the internal `messages` array.
- Request metadata must not become a hidden configuration channel.
- Auth must already be on the path for protected requests.

## Streaming Response

### Transport

- SSE stream

### Required Header

- `X-Conversation-ID` once the conversation is resolved

### Event Types

- `text-delta`
- `tool-call`
- `tool-result`
- `approval-request`
- `approval-result`
- `done`
- `error`

## Done Event

### Minimum Payload

```json
{
  "conversation_id": "conv_123",
  "message_id": "msg_456"
}
```

## Approval Events

### approval-request

Must include enough information for safe user presentation and decision capture.

Minimum fields:

- `request_id`
- `tool_name`
- `summary`

### approval-result

Must include:

- `request_id`
- `decision`

Rules:

- Approval must be contract-visible, not hidden in local client control flow.
- Client rendering is presentation only; Gateway and runtime behavior must treat approval as real interaction state.

## Valid Example

Standalone files:

- `docs/ai/examples/client-message-request.json`
- `docs/ai/examples/conversation-list-response.json`
- `docs/ai/examples/conversation-detail-response.json`
- `docs/ai/examples/approval-request-event.json`
- `docs/ai/examples/approval-result-event.json`

```http
POST /message
Content-Type: application/json

{
  "content": "Create a spec for a fitness tracker app.",
  "metadata": {
    "client": "braindrive-cli"
  }
}
```

```text
HTTP/1.1 200 OK
Content-Type: text/event-stream
X-Conversation-ID: conv_123

event: text-delta
data: {"delta":"I can help with that."}

event: approval-request
data: {"request_id":"apr_1","tool_name":"memory_write","summary":"Write spec.md in /library/fitness"}

event: approval-result
data: {"request_id":"apr_1","decision":"approved"}

event: done
data: {"conversation_id":"conv_123","message_id":"msg_456"}
```

## Invalid Drift Example

Standalone files:

- `docs/ai/examples/invalid-client-message-request.json`
- `docs/ai/examples/invalid-conversation-list-response.json`
- `docs/ai/examples/invalid-conversation-detail-response.json`
- `docs/ai/examples/invalid-approval-request-event.json`
- `docs/ai/examples/invalid-approval-result-event.json`

```http
POST /message
Content-Type: application/json

{
  "messages": [
    {"role":"user","content":"Create a spec"}
  ],
  "provider": "openrouter",
  "model": "gpt-4.1",
  "tool_definitions": []
}
```

Why this is drift:

- client fabricates the internal contract instead of using the external client shape
- request body leaks provider configuration into the client-facing API
- tool definitions are treated as per-request config
- this bypasses the Gateway's responsibility to normalize and bound the handoff

## Conversation List

### Endpoint

- `GET /conversations`

### Response Shape

```json
{
  "conversations": [
    {
      "id": "conv_123",
      "title": null,
      "created_at": "2026-03-17T12:00:00Z",
      "updated_at": "2026-03-17T12:05:00Z",
      "message_count": 4
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

## Conversation Detail

### Endpoint

- `GET /conversations/:id`

### Response Shape

```json
{
  "id": "conv_123",
  "title": null,
  "created_at": "2026-03-17T12:00:00Z",
  "updated_at": "2026-03-17T12:05:00Z",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "hello",
      "timestamp": "2026-03-17T12:00:00Z"
    }
  ]
}
```

## Required Behaviors

- Gateway exposes a stable client contract distinct from the internal Gateway-Engine contract.
- Conversation responses use canonical envelopes rather than raw storage shape.
- Client-facing payloads remain safe and presentation-ready.
- Approval and completion semantics remain visible in the contract.

## Forbidden Behaviors

- Letting the client construct the internal `messages + metadata` contract directly.
- Returning raw storage records as the external conversation API.
- Hiding approval flow in terminal-only control logic.
- Using client metadata as runtime/provider configuration.

## Audit Questions

- Does the client send the canonical request shape?
- Does Gateway normalize into the internal contract itself?
- Are conversation endpoints using canonical envelopes?
- Are `approval-request`, `approval-result`, `done`, and `error` payloads consistent and safe?
- Is `X-Conversation-ID` present once the conversation is resolved?

## Common Drift Patterns

- Client fabricates the internal request contract.
- Raw storage shape leaks through conversation endpoints.
- Approval exists only in local UI flow.
- `done` payload omits identifiers needed for state reconciliation.
- Request metadata becomes a side channel for config.

## Source Docs

- `docs/gateway-spec.md`
- `docs/gateway-engine-contract.md`
- `docs/communication-principles.md`
- `spec/mvp-build-primer.md`
