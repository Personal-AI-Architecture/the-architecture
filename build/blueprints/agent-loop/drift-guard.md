# Agent Loop Drift Guard

This document defines anti-drift controls for Agent Loop implementations.

## 1. Top Drift Patterns

- Agent Loop accumulates product-specific business logic.
- Request metadata becomes a hidden runtime reconfiguration channel.
- Provider-specific payload formatting leaks into loop core.
- Event taxonomy drifts from contract set.
- Assistant text dropped when tool calls are present.
- Recoverable tool failures incorrectly treated as terminal failures.
- Error taxonomy collapses to a single generic code.
- Tool calls run without asking Auth first.
- Model fixed at startup instead of taken from each request.
- Approval semantics moved out of contract-visible events, or approval imposed when no approval rule exists.
- Agent Loop starts owning conversation persistence.

## 2. Prohibited Implementation Shortcuts

- Hardcoding provider wire formats in loop logic instead of adapters.
- Accepting request metadata keys that alter provider/tool runtime config.
- Skipping `tool-call`/`tool-result` event emission for speed.
- Converting all errors to one generic code.
- Using prompt-only approval intent instead of coded controls/events.
- Relying on the request-level Auth check instead of asking Auth per tool call.
- Requiring a Gateway-built system message instead of the configured bootstrap prompt.
- Adding conversation storage reads/writes in Agent Loop runtime paths.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| ENGD-CHK-001 | Input contract bounded to `messages` + model + `metadata` | Request schema tests against `Engine.schema.json` (model field pending contract revision) | Critical |
| ENGD-CHK-002 | `metadata.correlation_id` required | Negative schema/integration tests for missing ID | Critical |
| ENGD-CHK-003 | Metadata side-channel fields rejected | Negative tests for provider/tool/secret metadata keys | Critical |
| ENGD-CHK-004 | Loop termination behavior is deterministic | Completion-path and safety-bound tests | Critical |
| ENGD-CHK-005 | Event taxonomy remains canonical | Stream event contract tests | Critical |
| ENGD-CHK-006 | Assistant text preserved across tool turns | Multi-turn continuation tests | Critical |
| ENGD-CHK-007 | Tool-call ID continuity preserved | Tool call/result correlation tests | High |
| ENGD-CHK-008 | Recoverable failures continue loop | Recoverable tool-failure tests | Critical |
| ENGD-CHK-009 | Unrecoverable failures emit terminal error | Fault-injection termination tests | Critical |
| ENGD-CHK-010 | Error taxonomy and sanitization enforced | Error mapping tests for all taxonomy codes | Critical |
| ENGD-CHK-011 | Auth asked before each tool call; refusals reported as not permitted | Per-call Auth check tests | Critical |
| ENGD-CHK-012 | Approval interactions remain contract-visible where approval rules apply, and absent otherwise | Approval-rule and no-rule tool path event tests | Critical |
| ENGD-CHK-013 | Agent Loop has no conversation persistence ownership | Static + runtime dependency checks | Critical |
| ENGD-CHK-014 | Provider specifics isolated to adapters | Static architecture boundary checks | Critical |
| ENGD-CHK-015 | Model taken from each request | Model-change-without-restart test | Critical |
| ENGD-CHK-016 | Bootstrap prompt from Agent Loop configuration | Request-without-system-message test | High |

## 4. Contract-Break Indicators

- Requests without `correlation_id` are processed.
- Metadata containing provider/tool config keys is accepted.
- Non-canonical event types are emitted.
- Tool call/result IDs are inconsistent.
- Recoverable tool failures terminate stream.
- `error` events leak raw exception internals.
- Unauthorized actor's tool call runs.
- A model change only takes effect after a restart.
- Conversation create/list/store behavior appears in Agent Loop module.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `ENG-MUST-*` conformance vector fails.
- Agent Loop emits off-contract events or missing required completion/error events.
- Agent Loop includes provider-specific formatting logic.
- Any auth/approval drift-critical control fails.
- Conflict register contains unresolved High-risk boundary conflicts.

## 6. Drift Detection Checklist

- [ ] All `ENG-MUST-*` vectors pass (positive and negative).
- [ ] Request schema validation blocks non-bounded payloads.
- [ ] Metadata side-channel rejection tests pass.
- [ ] Loop continues until model completion or classified overflow.
- [ ] Canonical stream event taxonomy enforced.
- [ ] Assistant text preserved across tool continuation.
- [ ] Tool-call/result ID continuity verified.
- [ ] Recoverable tool failures continue loop.
- [ ] Unrecoverable failures emit terminal classified errors.
- [ ] Error messages are safe and taxonomy-correct.
- [ ] Auth asked before every tool call; refusals reported as not permitted.
- [ ] Approval request/result events emitted for actions the owner's rules mark as approval-required, and none otherwise.
- [ ] Model taken from each request; no restart needed to switch.
- [ ] Bootstrap prompt comes from Agent Loop configuration.
- [ ] No conversation persistence responsibilities in Agent Loop.
- [ ] Provider-specific formatting isolated to adapters.
