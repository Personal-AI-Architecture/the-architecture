# Gateway Review Checklist

> Fast targeted review checklist for Gateway ownership, client contract, and conversation handling.

## Purpose

Use this when reviewing Gateway code paths, routes, conversation handling, or client-facing contract behavior.

## Checklist

- [ ] Gateway owns conversation lifecycle rather than delegating it to Agent Loop.
- [ ] Conversation operations use the approved Memory boundary.
- [ ] No private in-process conversation store exists as source of truth.
- [ ] Gateway does not choose models or own provider selection; it reads the owner's current model and provider choice on every message and passes both on.
- [ ] Gateway stores the model and provider profile that produced each assistant reply on the saved message (D194).
- [ ] Gateway calls Auth on every request, including conversation list and history reads.
- [ ] Conversation history keeps tool calls, tool results and every content part.
- [ ] A provider or model switch recalculates the working-context budget from the safe limit for that pair in the provider profile, without changing full saved history.
- [ ] An unknown safe limit reports `context_limit_unknown` before dispatch; no universal limit is assumed.
- [ ] Older complete turns may be left out or summarized deterministically without a model call; an optional `context_notice` reaches every client before model output. The summary is a labelled, ephemeral user-role context message, never a saved owner message or second system instruction.
- [ ] An oversized current input reports `context_overflow`; every selected tool call retains its corresponding result.
- [ ] `POST /conversations/messages` uses the canonical client request body `{ content, metadata? }`, with `content` as a non-empty list of structured content parts, rather than the internal `messages + metadata` shape.
- [ ] `/conversations` and `/conversations/:id` return canonical envelopes rather than raw storage records.
- [ ] `X-Conversation-ID` is returned when the conversation is resolved.
- [ ] Client-facing `done` includes `conversation_id` and `message_id`.
- [ ] Where a product adds approvals, approval appears in the contract rather than only in client-local control flow.
- [ ] Approval requests expose a stable request ID and expiry; decisions are terminal and replay-safe.
- [ ] The internal handoff carries canonical `auth_context`; identity does not depend on `X-Actor-ID` or another single transport.

## Related Conformance Tests

- `ARCH-3`
- `ARCH-4`
- `ARCH-15`

## Common Failure Patterns

- private `Map` or in-process store for conversations
- raw database or storage objects returned from routes
- approval handled entirely in CLI/UI code (in products that add approvals)
- only user and assistant text stored, so tool calls disappear on resume
- request metadata used as a config side channel

## Read Next

- `architecture/gateway-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `contracts/openapi/gateway-api.yaml`

## Example Files

- `contracts/examples/client-message-request.json`
- `contracts/examples/invalid-client-message-request.json`
- `contracts/examples/conversation-list-response.json`
- `contracts/examples/conversation-detail-response.json`
- `contracts/examples/invalid-conversation-list-response.json`
- `contracts/examples/invalid-conversation-detail-response.json`
- `contracts/examples/approval-request-event.json`
- `contracts/examples/approval-result-event.json`
- `contracts/examples/invalid-approval-request-event.json`
- `contracts/examples/invalid-approval-result-event.json`
