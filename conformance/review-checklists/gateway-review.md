# Gateway Review Checklist

> Fast targeted review checklist for Gateway ownership, client contract, and conversation handling.

## Purpose

Use this when reviewing Gateway code paths, routes, conversation handling, or client-facing contract behavior.

## Checklist

- [ ] Gateway owns conversation lifecycle rather than delegating it to Agent Loop.
- [ ] Conversation operations use the approved Memory boundary.
- [ ] No private in-process conversation store exists as source of truth.
- [ ] Gateway does not choose models or own provider selection; it reads the owner's current model choice on every message and passes it on.
- [ ] Gateway calls Auth on every request, including conversation list and history reads.
- [ ] Conversation history keeps tool calls, tool results and every content part.
- [ ] `POST /conversations/messages` uses the canonical client request body `{ content, metadata? }`, with `content` as a non-empty list of structured content parts, rather than the internal `messages + metadata` shape.
- [ ] `/conversations` and `/conversations/:id` return canonical envelopes rather than raw storage records.
- [ ] `X-Conversation-ID` is returned when the conversation is resolved.
- [ ] Client-facing `done` includes `conversation_id` and `message_id`.
- [ ] Where a product adds approvals, approval appears in the contract rather than only in client-local control flow.

## Matrix IDs

- `G-01`
- `G-03`
- `G-04`
- `G-05`
- `G-06`
- `G-07`
- `G-09`
- `G-02`
- `A-01`
- `GC-07`
- `S-05`

## Common Failure Patterns

- private `Map` or in-process store for conversations
- raw database or storage objects returned from routes
- approval handled entirely in CLI/UI code (in products that add approvals)
- only user and assistant text stored, so tool calls disappear on resume
- request metadata used as a config side channel

## Read Next

- `build/primers/gateway.md`
- `build/primers/client-gateway-contract.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/compliance-matrix.md`

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

## Source Docs

- `maintainers/primer-audit-playbook.md`
- `build/primers/gateway.md`
- `build/primers/client-gateway-contract.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/compliance-matrix.md`
