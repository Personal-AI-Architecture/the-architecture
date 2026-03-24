# Gateway Drift Guard

This document defines anti-drift controls for Gateway implementations.

## 1. Top Drift Patterns

- Conversation lifecycle logic moved out of Gateway or split across ad hoc modules.
- External client payloads allowed to submit internal Engine contract shape.
- Gateway-to-Engine payload expanded into request-time configuration channel.
- Auth omitted on protected routes.
- Approval semantics implemented only in UI/client flow, not API/stream contract.
- Conversation endpoints leaking raw storage rows.
- Unsafe internal error detail leaking to client-visible responses/events.

## 2. Prohibited Implementation Shortcuts

- Using in-process maps as authoritative conversation state.
- Passing `provider`, `model`, `tool_sources`, `tool_definitions`, or secrets through request metadata.
- Accepting `messages[]` from clients on `POST /message`.
- Creating undocumented approval helper routes or payload aliases.
- Forwarding raw exception text or stack traces to clients.
- Returning storage records without canonical response envelope transformation.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| GWD-CHK-001 | Protected routes require Auth | Integration tests for unauthorized calls on `POST /message`, `GET /conversations`, `GET /conversations/:id`, `POST /approvals/:request_id` | Critical |
| GWD-CHK-002 | Client request schema is canonical | Schema test against `Gateway.schema.json` `client_message_request` | Critical |
| GWD-CHK-003 | Internal fields rejected from external payload | Negative tests with `messages`, provider/tool fields | Critical |
| GWD-CHK-004 | Gateway->Engine handoff remains bounded | Adapter boundary inspection test and payload snapshot check | Critical |
| GWD-CHK-005 | Conversation responses are canonical envelopes | Contract tests for list/detail response schemas | Critical |
| GWD-CHK-006 | Stream includes `X-Conversation-ID` and terminal IDs | Stream/header assertions for `X-Conversation-ID`, `done.conversation_id`, `done.message_id` | Critical |
| GWD-CHK-007 | Approval contract is visible and canonical | Stream + route tests for approval event pair and route payload shape | Critical |
| GWD-CHK-008 | Mid-stream error taxonomy and safe messaging | Injected failure tests for taxonomy codes and sanitizer checks | Critical |
| GWD-CHK-009 | Unknown IDs map to safe not-found behavior | 404 behavior tests for conversation and approval lookup | High |
| GWD-CHK-010 | Durable state survives process replacement | Persistence test through Memory boundary across runtime restart | Critical |

## 4. Contract-Break Indicators

- Any client can successfully send `messages[]` to `POST /message`.
- Any accepted request contains configuration-like metadata keys.
- `done` payload missing `conversation_id` or `message_id`.
- `approval-request`/`approval-result` not present when approval was required.
- Error messages include stack trace text, filesystem paths, or secret material.
- Conversation data disappears after process recycle.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `GW-MUST-*` conformance vector fails.
- Contract schema validation for required payload/event types fails.
- Drift check detects unsafe error leakage or auth bypass.
- Conflict register contains unresolved High-risk conflicts.

## 6. Drift Detection Checklist

- [ ] All `GW-MUST-*` vectors pass (positive and negative).
- [ ] Gateway contract schema checks pass for request, response, and stream events.
- [ ] Protected route auth checks pass.
- [ ] Client payload cannot include internal/hidden config fields.
- [ ] Gateway->Engine payload snapshot contains only bounded fields.
- [ ] `X-Conversation-ID` and `done` reconciliation IDs are present.
- [ ] Approval route and event semantics are canonical.
- [ ] Error taxonomy and sanitization checks pass.
- [ ] Unknown ID paths return safe 404 behavior.
- [ ] Conversation durability verified across runtime restart.
