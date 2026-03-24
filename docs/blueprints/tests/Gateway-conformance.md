# Gateway Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for Gateway conformance.

## Requirement Set (MUST)

- `GW-MUST-001`: Gateway owns conversation lifecycle operations (create, append, list, detail).
- `GW-MUST-002`: `POST /message` accepts only canonical client request shape `{ content, metadata? }`.
- `GW-MUST-003`: External clients cannot submit internal Engine contract fields.
- `GW-MUST-004`: Gateway sends only bounded internal handoff fields (`messages + metadata`) and blocks configuration side channels.
- `GW-MUST-005`: Protected routes enforce Auth.
- `GW-MUST-006`: Conversation list/detail endpoints return canonical envelopes.
- `GW-MUST-007`: Streaming response includes `X-Conversation-ID` once conversation is resolved.
- `GW-MUST-008`: Terminal `done` event includes `conversation_id` and `message_id`.
- `GW-MUST-009`: Approval decision endpoint remains canonical (`POST /approvals/:request_id`, `{ decision }` -> `{ request_id, decision }`).
- `GW-MUST-010`: Approval interactions are contract-visible in stream (`approval-request`, `approval-result`).
- `GW-MUST-011`: Mid-stream failures use classified error taxonomy (`provider_error`, `tool_error`, `context_overflow`).
- `GW-MUST-012`: Client-visible errors/events are safe and sanitized.
- `GW-MUST-013`: Unknown conversation and approval IDs return safe not-found behavior.
- `GW-MUST-014`: Conversation state is durable through Memory boundary, not private in-process state.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| GW-T001P | GW-MUST-001 | Positive | Send `POST /message`, then call list/detail endpoints for returned conversation ID | Message appears in persisted conversation history and listing | Conversation not found or missing persisted message | Ownership drift |
| GW-T001N | GW-MUST-001 | Negative | Simulate Gateway restart/new process after message write | Conversation still retrievable from Memory boundary | Conversation disappears after process recycle | In-process state drift |
| GW-T002P | GW-MUST-002 | Positive | `POST /message` body `{ content: "hello", metadata: { client: "cli" } }` | 200 stream starts | 400/shape rejection for valid payload | External request contract drift |
| GW-T002N | GW-MUST-002 | Negative | `POST /message` body `{ metadata: {} }` | 400 safe invalid-request response | Request accepted or unsafe parser error exposed | Validation drift |
| GW-T003P | GW-MUST-003 | Positive | Client sends only external contract fields | Gateway normalizes to internal shape itself | Client required/allowed to send internal fields | Boundary ownership drift |
| GW-T003N | GW-MUST-003 | Negative | `POST /message` includes `messages`, `provider`, or `tool_definitions` | 400 safe reject | Payload accepted | Internal contract fabrication |
| GW-T004P | GW-MUST-004 | Positive | Instrument Engine boundary adapter during valid request | Outbound payload contains only `messages` and bounded `metadata` | Extra config fields appear in Gateway->Engine payload | Hidden configuration channel |
| GW-T004N | GW-MUST-004 | Negative | `metadata` includes `api_key`, `provider`, `tool_sources` | Request rejected pre-stream with safe 400 | Request forwarded to Engine | Request-time reconfiguration drift |
| GW-T005P | GW-MUST-005 | Positive | Valid auth context on protected route (`GET /conversations`) | 2xx with expected response | 401 despite valid auth | Auth regression |
| GW-T005N | GW-MUST-005 | Negative | Missing/invalid auth on protected route | 401 safe unauthorized | Route returns data without auth | Auth bypass |
| GW-T006P | GW-MUST-006 | Positive | Call `GET /conversations` and `GET /conversations/:id` for existing records | Responses match canonical envelopes | Envelope fields missing/renamed | Response contract drift |
| GW-T006N | GW-MUST-006 | Negative | Force endpoint to return raw storage row shape | Conformance schema validation fails | Test passes with non-canonical response | Storage leakage |
| GW-T007P | GW-MUST-007 | Positive | Successful `POST /message` stream | Response header includes `X-Conversation-ID` | Header absent | Reconciliation drift |
| GW-T007N | GW-MUST-007 | Negative | Simulate implementation omitting header after resolution | Conformance test fails | Missing header accepted | Header contract drift |
| GW-T008P | GW-MUST-008 | Positive | Complete normal stream | `done` includes both `conversation_id` and `message_id` | Missing identifier fields | Completion contract drift |
| GW-T008N | GW-MUST-008 | Negative | Emit `done` with only `finish_reason` | Conformance test fails | Missing IDs accepted | Completion reconciliation drift |
| GW-T009P | GW-MUST-009 | Positive | `POST /approvals/{id}` with `{ decision: "approved" }` | 2xx response `{ request_id, decision }` | Non-canonical body/route semantics | Approval endpoint drift |
| GW-T009N | GW-MUST-009 | Negative | Send `{ approved: true }` or wrong route path | 400 safe invalid request | Non-canonical payload accepted | Approval payload drift |
| GW-T010P | GW-MUST-010 | Positive | Tool call requiring approval during stream | `approval-request` then `approval-result` events emitted | One or both approval events missing | Approval invisibility |
| GW-T010N | GW-MUST-010 | Negative | Implement approval only in local client flow, no stream events | Conformance test fails | Test passes with no approval events | Client-only approval drift |
| GW-T011P | GW-MUST-011 | Positive | Inject provider timeout mid-stream | `error` event with code `provider_error` | Wrong or generic error code | Error taxonomy drift |
| GW-T011N | GW-MUST-011 | Negative | Collapse all failures to `provider_error` | Conformance test fails on tool/context cases | Taxonomy collapse accepted | Error taxonomy collapse |
| GW-T012P | GW-MUST-012 | Positive | Trigger internal exception with sensitive details | Exposed `error.message` is sanitized and safe | Raw stack/path/secret exposed | Unsafe error surface |
| GW-T012N | GW-MUST-012 | Negative | Force raw runtime message passthrough | Conformance test fails | Raw message accepted | Sanitization drift |
| GW-T013P | GW-MUST-013 | Positive | Unknown `conversation_id` and unknown `approval_request_id` | Safe 404 not-found responses/events | 500 internal failure or unsafe detail leak | Not-found handling drift |
| GW-T013N | GW-MUST-013 | Negative | Map unknown IDs to internal storage error text | Conformance test fails | Internal text reaches client | Error leakage |
| GW-T014P | GW-MUST-014 | Positive | Create conversation, instantiate new Gateway runtime, retrieve conversation | Data available through Memory boundary | Data only in process-local store | Durability drift |
| GW-T014N | GW-MUST-014 | Negative | Stub implementation with private map storage only | Conformance test fails on restart/persistence check | Non-durable store accepted | Memory boundary bypass |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: auth bypass, internal contract fabrication, hidden configuration channel, response envelope drift, approval invisibility, taxonomy collapse, unsafe error leakage, non-durable conversation storage.
