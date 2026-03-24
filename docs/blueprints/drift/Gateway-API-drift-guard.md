# Gateway API Drift Guard

This document defines anti-drift controls for the external Gateway API boundary.

## 1. Top Drift Patterns

- External API becomes a passthrough for internal Gateway-Engine contract payloads.
- Event names/payloads drift from canonical stream taxonomy.
- Missing reconciliation fields (`X-Conversation-ID`, `done` IDs).
- Approval behavior trapped in local UI flow rather than API contract.
- Error channel confusion (HTTP errors emitted mid-stream or SSE errors emitted pre-stream).
- Raw storage/internal error details leaked externally.

## 2. Prohibited Implementation Shortcuts

- Allowing client payload fields `messages`, `provider`, `model`, or tool config.
- Returning raw storage rows directly from conversation endpoints.
- Adding undocumented approval routes or alternate decision payloads.
- Emitting ad hoc stream event types.
- Using unsafe raw exception strings in `error.message`.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| GAPID-CHK-001 | `POST /message` request schema is canonical | Schema tests against `Gateway-API.schema.json` `message_request` | Critical |
| GAPID-CHK-002 | Internal/config fields rejected | Negative payload tests for internal shape fields | Critical |
| GAPID-CHK-003 | Stream events are canonical only | Event taxonomy contract tests | Critical |
| GAPID-CHK-004 | `done` includes required IDs | Stream payload validation tests | Critical |
| GAPID-CHK-005 | `X-Conversation-ID` header emitted | Response header contract tests | Critical |
| GAPID-CHK-006 | Conversation list/detail envelopes canonical | Response schema tests for list and detail | Critical |
| GAPID-CHK-007 | Approval decision endpoint is canonical | Route and payload contract tests | Critical |
| GAPID-CHK-008 | Approval events are contract-visible | Stream tests requiring approval path | Critical |
| GAPID-CHK-009 | Error channel split is deterministic | Tests for pre-stream HTTP vs mid-stream SSE errors | High |
| GAPID-CHK-010 | Error taxonomy and sanitization enforced | Fault injection tests on error code and safe message | Critical |
| GAPID-CHK-011 | Protected routes enforce Auth | Unauthorized route test suite | Critical |
| GAPID-CHK-012 | Unknown IDs map to safe 404 behavior | Not-found behavior tests for conversation and approval routes | High |

## 4. Contract-Break Indicators

- Clients can send internal request shape to `POST /message`.
- `done` omits required state-reconciliation identifiers.
- Approval decision route deviates from canonical path or body shape.
- Approval-required flows have no `approval-request` and `approval-result` events.
- Mid-stream failures appear as HTTP responses after stream start.
- Error messages expose stack traces, filesystem paths, tokens, or provider internals.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `GAPI-MUST-*` conformance vector fails.
- Any response/event schema validation failure occurs.
- Any auth bypass or unsafe external error exposure is detected.
- Conflict register contains unresolved High-risk API boundary conflicts.

## 6. Drift Detection Checklist

- [ ] All `GAPI-MUST-*` vectors pass (positive and negative).
- [ ] `POST /message` rejects internal/config fields.
- [ ] Stream events limited to canonical taxonomy.
- [ ] `done` and `X-Conversation-ID` reconciliation artifacts present.
- [ ] Conversation list/detail responses match canonical envelopes.
- [ ] Approval decision route and payload are canonical.
- [ ] Approval events are contract-visible in stream.
- [ ] Pre-stream and mid-stream error channels are correct.
- [ ] Error codes/messages are safe and classified.
- [ ] Protected routes reject unauthorized requests.
- [ ] Unknown IDs return safe not-found behavior.
