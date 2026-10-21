# Client-Gateway Contract

> The client-facing API contract between the BrainDrive client and Gateway.

## Purpose

Define the external request, response, conversation, and approval interaction shapes so client implementations do not invent incompatible behavior.

## Contract Shape

- Client sends HTTP requests to the Gateway API.
- Gateway owns conversation lifecycle.
- Gateway calls Auth on every request, including conversation list and history reads.
- Gateway normalizes client input into the internal `messages + model + metadata` handoff, adding the owner's current model choice.
- Streaming responses use SSE.
- One message shape across all three contracts: content is a list of parts, and tool calls and tool results are ordinary message parts.

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
- The Gateway calls Auth on every request before anything reaches the Agent Loop or conversation data.
- Message content is a list of parts (text first, room for images and files). A plain string is the shorter form of a single text part.

## Streaming Response

### Transport

- SSE stream

### Required Header

- `X-Conversation-ID` once the conversation is resolved

### Event Types

- `text-delta`
- `tool-call`
- `tool-result`
- `approval-request` (only in products that add approval prompts)
- `approval-result` (only in products that add approval prompts)
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

Approval prompts are a product choice; the architecture default is that the owner can do everything. These events apply only where a product adds approvals, and the approval rules themselves live in Auth.

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

- `contracts/examples/client-message-request.json`
- `contracts/examples/conversation-list-response.json`
- `contracts/examples/conversation-detail-response.json`
- `contracts/examples/approval-request-event.json` (product with approvals)
- `contracts/examples/approval-result-event.json` (product with approvals)

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

- `contracts/examples/invalid-client-message-request.json`
- `contracts/examples/invalid-conversation-list-response.json`
- `contracts/examples/invalid-conversation-detail-response.json`
- `contracts/examples/invalid-approval-request-event.json`
- `contracts/examples/invalid-approval-result-event.json`

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

Conversation history includes the tool calls and tool results inside messages, not only user and assistant text, so a resumed conversation replays faithfully.

## Required Behaviors

- Gateway exposes a stable client contract distinct from the internal Gateway ↔ Agent Loop contract.
- Conversation responses use canonical envelopes rather than raw storage shape.
- Client-facing payloads remain safe and presentation-ready.
- Conversation history keeps tool calls, tool results and every content part.
- Completion semantics, and approval semantics where a product adds approvals, remain visible in the contract.

## Forbidden Behaviors

- Letting the client construct the internal `messages + metadata` contract directly.
- Returning raw storage records as the external conversation API.
- Hiding approval flow in terminal-only control logic (where a product adds approvals).
- Dropping tool calls or tool results from stored history.
- Using client metadata as runtime/provider configuration.

## Audit Questions

- Does the client send the canonical request shape?
- Does Gateway normalize into the internal contract itself?
- Are conversation endpoints using canonical envelopes?
- Are `done` and `error` payloads (and `approval-request` / `approval-result`, where used) consistent and safe?
- Does conversation detail return tool calls and tool results?
- Is `X-Conversation-ID` present once the conversation is resolved?

## Common Drift Patterns

- Client fabricates the internal request contract.
- Raw storage shape leaks through conversation endpoints.
- Approval exists only in local UI flow (in products that add approvals).
- Approval treated as an architecture requirement instead of a product choice.
- `done` payload omits identifiers needed for state reconciliation.
- Request metadata becomes a side channel for config.

## Source Docs

- `architecture/gateway-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `architecture/communication-principles.md`
- `spec/mvp-build-primer.md`

## Contract Alignment

This primer follows the specs in `architecture/`, which are ahead of the contract files here:

- `contracts/openapi/gateway-api.yaml` says requests are authenticated before they reach the Gateway; the specs have the Gateway call Auth on every request.
- `contracts/openapi/gateway-api.yaml` stores only user and assistant messages, so tool calls and tool results are not yet part of resumable history.
- `contracts/openapi/gateway-api.yaml` and `contracts/schemas/message.json` define message content as a string, not a list of parts.
