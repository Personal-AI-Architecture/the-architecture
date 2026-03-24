# Gateway-Engine Contract Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for the internal Gateway-Engine contract boundary.

## Requirement Set (MUST)

- `GEC-MUST-001`: Gateway sends only bounded internal request shape (`messages + metadata`) to Engine.
- `GEC-MUST-002`: `metadata.correlation_id` is required for every handoff.
- `GEC-MUST-003`: Metadata keys are limited to contract-approved fields (`conversation_id`, `trigger`, `client_context`).
- `GEC-MUST-004`: Request payload rejects hidden provider/tool/runtime reconfiguration fields.
- `GEC-MUST-005`: Auth is on the path before Engine processing.
- `GEC-MUST-006`: Engine emits only canonical contract event types.
- `GEC-MUST-007`: Mid-stream errors use taxonomy `provider_error`, `tool_error`, `context_overflow`.
- `GEC-MUST-008`: Stream error messages are safe for client display.
- `GEC-MUST-009`: Pre-stream errors use HTTP response path; mid-stream errors use SSE `error` events.
- `GEC-MUST-010`: Tool-call/tool-result continuity preserves stable IDs through one interaction.
- `GEC-MUST-011`: Completion event provides stable reconciliation identifiers (`conversation_id`, `message_id`) and finish semantics.
- `GEC-MUST-012`: Contract remains internal handoff and is not exposed as a third external API.
- `GEC-MUST-013`: Approval request/outcome semantics are represented in contract-visible interaction flow.
- `GEC-MUST-014`: Gateway and Engine remain independently swappable as long as contract is preserved.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| GEC-T001P | GEC-MUST-001 | Positive | Gateway sends valid `messages + metadata` request to Engine | Engine accepts request and begins stream | Request rejected despite valid bounded shape | Bounded-handoff drift |
| GEC-T001N | GEC-MUST-001 | Negative | Gateway sends extra top-level field (`provider`) | Request validation fails pre-stream | Extra field accepted | Hidden contract expansion |
| GEC-T002P | GEC-MUST-002 | Positive | Request includes `metadata.correlation_id` | Stream/request path continues with traceability intact | Correlation ID ignored or dropped | Traceability drift |
| GEC-T002N | GEC-MUST-002 | Negative | Request omits `metadata.correlation_id` | 400 invalid request pre-stream | Missing ID accepted | Correlation bypass |
| GEC-T003P | GEC-MUST-003 | Positive | Metadata contains only allowed optional keys | Request accepted | Allowed keys rejected | Metadata-shape drift |
| GEC-T003N | GEC-MUST-003 | Negative | Metadata includes unknown key (`metadata.runtime_config`) | Request rejected | Unknown metadata accepted | Metadata side-channel |
| GEC-T004P | GEC-MUST-004 | Positive | Request includes no provider/tool/runtime config | Request accepted and processed | Config fields unexpectedly required | Config ownership drift |
| GEC-T004N | GEC-MUST-004 | Negative | Inject `provider`, `model`, `api_key`, `tool_sources` into request/metadata | Safe rejection and no Engine execution | Request accepted | Request-time reconfiguration |
| GEC-T005P | GEC-MUST-005 | Positive | Auth middleware attaches valid auth context | Engine processes request with authorized context | Auth context absent despite valid request | Auth path drift |
| GEC-T005N | GEC-MUST-005 | Negative | Call protected handoff path without valid auth | 401/403 pre-stream | Unauthorized request reaches Engine | Auth bypass |
| GEC-T006P | GEC-MUST-006 | Positive | Run interaction with text, tool call, and completion | Events are canonical types only | Off-contract event emitted | Event taxonomy drift |
| GEC-T006N | GEC-MUST-006 | Negative | Emit non-contract event (`partial-done`, `tool_result_v2`) | Conformance fails | Off-contract event accepted | Event-shape drift |
| GEC-T007P | GEC-MUST-007 | Positive | Trigger provider timeout and unrecoverable tool infra failure | Error events use `provider_error`/`tool_error`; context cap uses `context_overflow` | Generic or wrong code used | Error taxonomy collapse |
| GEC-T007N | GEC-MUST-007 | Negative | Collapse all errors to `provider_error` | Conformance fails | Collapsed taxonomy accepted | Classification drift |
| GEC-T008P | GEC-MUST-008 | Positive | Inject provider/internal failure text with paths/tokens | Emitted `error.message` is sanitized safe string | Raw internal details leak | Unsafe error surface |
| GEC-T008N | GEC-MUST-008 | Negative | Forward raw exception/stack trace in `error.message` | Conformance fails | Raw message accepted | Sensitive leakage |
| GEC-T009P | GEC-MUST-009 | Positive | Validate both malformed pre-stream request and injected mid-stream failure | Pre-stream uses HTTP error; mid-stream uses SSE `error` | Wrong channel used | Error-channel drift |
| GEC-T009N | GEC-MUST-009 | Negative | Attempt HTTP 500 response after SSE start | Conformance fails | Post-stream HTTP error accepted | Channel contract violation |
| GEC-T010P | GEC-MUST-010 | Positive | Tool-call followed by tool-result in same interaction | Result `id` matches call `id` | Missing or mismatched ID | Tool continuity drift |
| GEC-T010N | GEC-MUST-010 | Negative | Tool-result emits new unrelated ID | Conformance fails | ID mismatch accepted | Roundtrip identity drift |
| GEC-T011P | GEC-MUST-011 | Positive | Successful completion path | `done` event includes `conversation_id`, `message_id`, `finish_reason` | Missing required completion fields | Reconciliation drift |
| GEC-T011N | GEC-MUST-011 | Negative | Emit done with only `finish_reason` | Conformance fails | Minimal done accepted | Completion contract erosion |
| GEC-T012P | GEC-MUST-012 | Positive | Architecture/deployment scan | Internal handoff not exposed as external contract endpoint set | Contract appears as external API | API boundary drift |
| GEC-T012N | GEC-MUST-012 | Negative | Publish Gateway-Engine contract as public client API | Conformance/architecture check fails | Third API accepted | Boundary role drift |
| GEC-T013P | GEC-MUST-013 | Positive | Trigger approval-required tool call | Approval request/outcome appears through contract interaction model | Approval hidden off-contract | Approval visibility drift |
| GEC-T013N | GEC-MUST-013 | Negative | Approval handled only in local UI flow | Conformance fails | UI-only approval accepted | Contract invisibility drift |
| GEC-T014P | GEC-MUST-014 | Positive | Replace Engine implementation with contract-compatible equivalent | Gateway interop preserved without Gateway rewrite | Integration breaks despite contract adherence | Swapability regression |
| GEC-T014N | GEC-MUST-014 | Negative | Engine change requires Gateway request/stream shape changes | Conformance fails | Breaking change accepted | Coupling drift |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: bounded payload erosion, metadata/config side-channel, auth bypass, event taxonomy drift, error taxonomy collapse, unsafe error leakage, pre/mid-stream channel confusion, tool-call identity drift, completion reconciliation drift, boundary role drift, approval invisibility, swapability regression.
