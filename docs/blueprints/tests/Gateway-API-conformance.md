# Gateway API Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for the Gateway API boundary.

## Requirement Set (MUST)

- `GAPI-MUST-001`: `POST /message` uses canonical request shape `{ content, metadata? }`.
- `GAPI-MUST-002`: Gateway API rejects internal handoff/config fields in client payloads (`messages`, provider/tool/runtime config fields).
- `GAPI-MUST-003`: Streaming response emits only canonical event classes (`text-delta`, `tool-call`, `tool-result`, `approval-request`, `approval-result`, `done`, `error`).
- `GAPI-MUST-004`: `done` event includes `conversation_id` and `message_id`.
- `GAPI-MUST-005`: `POST /message` response includes `X-Conversation-ID` once conversation resolves.
- `GAPI-MUST-006`: `GET /conversations` returns canonical envelope.
- `GAPI-MUST-007`: `GET /conversations/:id` returns canonical envelope.
- `GAPI-MUST-008`: Approval decision endpoint remains canonical (`POST /approvals/:request_id`, `{ decision }` -> `{ request_id, decision }`).
- `GAPI-MUST-009`: Approval interaction remains contract-visible (`approval-request`, `approval-result`).
- `GAPI-MUST-010`: Error mode split is deterministic: pre-stream errors are HTTP responses, mid-stream errors are SSE `error` events.
- `GAPI-MUST-011`: Mid-stream `error` events use taxonomy and safe messages.
- `GAPI-MUST-012`: Protected routes enforce Auth.
- `GAPI-MUST-013`: Unknown conversation/approval IDs return safe not-found behavior.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| GAPI-T001P | GAPI-MUST-001 | Positive | `POST /message` with `{ content: "hello", metadata: { client: "cli" } }` | 200 stream response opens | Valid request rejected | Request-shape drift |
| GAPI-T001N | GAPI-MUST-001 | Negative | `POST /message` with missing `content` | 400 safe validation error | Request accepted | Validation drift |
| GAPI-T002P | GAPI-MUST-002 | Positive | Client sends only external fields | Request accepted and normalized internally | Client forced to send internal fields | Boundary drift |
| GAPI-T002N | GAPI-MUST-002 | Negative | `POST /message` with `messages`, `provider`, `tool_definitions` | 400 safe reject | Payload accepted | Internal contract fabrication |
| GAPI-T003P | GAPI-MUST-003 | Positive | Observe complete successful stream with tool and approval activity | All events are from canonical event set | Unknown/off-contract event type emitted | Event taxonomy drift |
| GAPI-T003N | GAPI-MUST-003 | Negative | Emit event `tool_result_v2` or `partial-done` | Conformance test fails | Off-contract event accepted | Event name drift |
| GAPI-T004P | GAPI-MUST-004 | Positive | Successful terminal stream | `done` has `conversation_id` and `message_id` | Missing required ID field | Completion payload drift |
| GAPI-T004N | GAPI-MUST-004 | Negative | Emit `done` payload with only `finish_reason` | Conformance test fails | Missing IDs accepted | State-reconciliation drift |
| GAPI-T005P | GAPI-MUST-005 | Positive | Successful `POST /message` | Header `X-Conversation-ID` present after resolution | Header absent | Header contract drift |
| GAPI-T005N | GAPI-MUST-005 | Negative | Simulate header omission | Conformance test fails | Omission accepted | Reconciliation drift |
| GAPI-T006P | GAPI-MUST-006 | Positive | `GET /conversations` with stored items | Envelope includes `conversations,total,limit,offset` | Envelope field mismatch | Response envelope drift |
| GAPI-T006N | GAPI-MUST-006 | Negative | Return raw row array without envelope | Conformance schema validation fails | Non-canonical payload accepted | Raw storage leak |
| GAPI-T007P | GAPI-MUST-007 | Positive | `GET /conversations/:id` existing ID | Envelope includes metadata + canonical `messages[]` entries | Missing canonical keys | Detail envelope drift |
| GAPI-T007N | GAPI-MUST-007 | Negative | Return internal storage object shape | Conformance test fails | Internal shape accepted | Storage leakage |
| GAPI-T008P | GAPI-MUST-008 | Positive | `POST /approvals/{id}` with `{ decision: "denied" }` | 2xx response `{ request_id, decision }` | Non-canonical response | Approval route drift |
| GAPI-T008N | GAPI-MUST-008 | Negative | Payload `{ approved: false }` or route `/approval/{id}` | 400/404 safe reject | Invalid route/payload accepted | Approval contract drift |
| GAPI-T009P | GAPI-MUST-009 | Positive | Run turn requiring approval | `approval-request` and `approval-result` appear in stream timeline | Approval events absent | Approval visibility drift |
| GAPI-T009N | GAPI-MUST-009 | Negative | Approval handled only in local UI, no stream events | Conformance test fails | Approval invisibility accepted | Client-only control drift |
| GAPI-T010P | GAPI-MUST-010 | Positive | Trigger validation error before stream, and separate provider failure after stream start | Pre-stream is HTTP error; mid-stream is SSE `error` event | Failure mode mismatched | Failure-mode drift |
| GAPI-T010N | GAPI-MUST-010 | Negative | Emit HTTP 500 after stream already started | Conformance test fails | Mode violation accepted | Error-channel drift |
| GAPI-T011P | GAPI-MUST-011 | Positive | Inject provider timeout and tool infra failure mid-stream | Codes map to taxonomy and messages are safe | Generic code or unsafe message | Error taxonomy/safety drift |
| GAPI-T011N | GAPI-MUST-011 | Negative | Collapse all errors to one code or forward raw exception text | Conformance test fails | Collapse/leak accepted | Taxonomy collapse |
| GAPI-T012P | GAPI-MUST-012 | Positive | Protected route with valid auth | Route succeeds | 401 for valid auth | Auth regression |
| GAPI-T012N | GAPI-MUST-012 | Negative | Protected route without auth | 401 safe unauthorized | Route accessible | Auth bypass |
| GAPI-T013P | GAPI-MUST-013 | Positive | Unknown conversation and unknown approval IDs | Safe 404 not-found semantics | 500/raw storage error | Not-found handling drift |
| GAPI-T013N | GAPI-MUST-013 | Negative | Force unknown ID to emit DB/internal path text | Conformance test fails | Internal detail leak accepted | Error leakage |

## Coverage Summary

- MUST requirements: 13
- Positive tests: 13
- Negative tests: 13
- Total vectors: 26
- Critical drift categories covered: internal contract fabrication, event taxonomy drift, state reconciliation drift, approval invisibility, error-channel drift, taxonomy collapse, auth bypass, raw storage leakage.
