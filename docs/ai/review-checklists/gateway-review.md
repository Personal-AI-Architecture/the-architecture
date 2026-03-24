# Gateway Review Checklist

> Fast targeted review checklist for Gateway ownership, client contract, and conversation handling.

## Purpose

Use this when reviewing Gateway code paths, routes, conversation handling, or client-facing contract behavior.

## Checklist

- [ ] Gateway owns conversation lifecycle rather than delegating it to Engine.
- [ ] Conversation operations use the approved Memory boundary.
- [ ] No private in-process conversation store exists as source of truth.
- [ ] Gateway does not choose models or own provider selection.
- [ ] Auth is on the real request path.
- [ ] Client request body uses `{ content, metadata? }` rather than the internal `messages + metadata` shape.
- [ ] `/conversations` and `/conversations/:id` return canonical envelopes rather than raw storage records.
- [ ] `X-Conversation-ID` is returned when the conversation is resolved.
- [ ] Client-facing `done` includes `conversation_id` and `message_id`.
- [ ] Approval appears in the contract rather than only in client-local control flow.

## Matrix IDs

- `G-01`
- `G-03`
- `G-04`
- `G-05`
- `G-06`
- `G-07`
- `A-01`
- `S-05`

## Common Failure Patterns

- private `Map` or in-process store for conversations
- raw database or storage objects returned from routes
- approval handled entirely in CLI/UI code
- request metadata used as a config side channel

## Read Next

- `docs/ai/gateway.md`
- `docs/ai/client-gateway-contract.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/compliance-matrix.md`

## Example Files

- `docs/ai/examples/client-message-request.json`
- `docs/ai/examples/invalid-client-message-request.json`
- `docs/ai/examples/conversation-list-response.json`
- `docs/ai/examples/conversation-detail-response.json`
- `docs/ai/examples/invalid-conversation-list-response.json`
- `docs/ai/examples/invalid-conversation-detail-response.json`
- `docs/ai/examples/approval-request-event.json`
- `docs/ai/examples/approval-result-event.json`
- `docs/ai/examples/invalid-approval-request-event.json`
- `docs/ai/examples/invalid-approval-result-event.json`

## Source Docs

- `docs/ai/primer-audit-playbook.md`
- `docs/ai/gateway.md`
- `docs/ai/client-gateway-contract.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/compliance-matrix.md`
