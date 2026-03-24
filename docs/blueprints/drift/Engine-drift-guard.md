# Engine Drift Guard

This document defines anti-drift controls for Engine (Agent Loop) implementations.

## 1. Top Drift Patterns

- Engine accumulates product-specific business logic.
- Request metadata becomes a hidden runtime reconfiguration channel.
- Provider-specific payload formatting leaks into loop core.
- Event taxonomy drifts from contract set.
- Assistant text dropped when tool calls are present.
- Recoverable tool failures incorrectly treated as terminal failures.
- Error taxonomy collapses to a single generic code.
- Auth context ignored for tool availability.
- Approval semantics moved out of contract-visible events.
- Engine starts owning conversation persistence.

## 2. Prohibited Implementation Shortcuts

- Hardcoding provider wire formats in loop logic instead of adapters.
- Accepting request metadata keys that alter provider/tool runtime config.
- Skipping `tool-call`/`tool-result` event emission for speed.
- Converting all errors to one generic code.
- Using prompt-only approval intent instead of coded controls/events.
- Adding conversation storage reads/writes in Engine runtime paths.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| ENGD-CHK-001 | Input contract bounded to `messages + metadata` | Request schema tests against `Engine.schema.json` | Critical |
| ENGD-CHK-002 | `metadata.correlation_id` required | Negative schema/integration tests for missing ID | Critical |
| ENGD-CHK-003 | Metadata side-channel fields rejected | Negative tests for provider/tool/secret metadata keys | Critical |
| ENGD-CHK-004 | Loop termination behavior is deterministic | Completion-path and safety-bound tests | Critical |
| ENGD-CHK-005 | Event taxonomy remains canonical | Stream event contract tests | Critical |
| ENGD-CHK-006 | Assistant text preserved across tool turns | Multi-turn continuation tests | Critical |
| ENGD-CHK-007 | Tool-call ID continuity preserved | Tool call/result correlation tests | High |
| ENGD-CHK-008 | Recoverable failures continue loop | Recoverable tool-failure tests | Critical |
| ENGD-CHK-009 | Unrecoverable failures emit terminal error | Fault-injection termination tests | Critical |
| ENGD-CHK-010 | Error taxonomy and sanitization enforced | Error mapping tests for all taxonomy codes | Critical |
| ENGD-CHK-011 | Auth context filters tool availability | Permission-scoped tool advertisement tests | Critical |
| ENGD-CHK-012 | Approval interactions remain contract-visible | Approval-required tool path event tests | Critical |
| ENGD-CHK-013 | Engine has no conversation persistence ownership | Static + runtime dependency checks | Critical |
| ENGD-CHK-014 | Provider specifics isolated to adapters | Static architecture boundary checks | Critical |

## 4. Contract-Break Indicators

- Requests without `correlation_id` are processed.
- Metadata containing provider/tool config keys is accepted.
- Non-canonical event types are emitted.
- Tool call/result IDs are inconsistent.
- Recoverable tool failures terminate stream.
- `error` events leak raw exception internals.
- Unauthorized actor receives privileged tools.
- Conversation create/list/store behavior appears in Engine module.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `ENG-MUST-*` conformance vector fails.
- Engine emits off-contract events or missing required completion/error events.
- Engine loop includes provider-specific formatting logic.
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
- [ ] Auth-scoped tool filtering enforced.
- [ ] Approval request/result events emitted for approval-required actions.
- [ ] No conversation persistence responsibilities in Engine.
- [ ] Provider-specific formatting isolated to adapters.
