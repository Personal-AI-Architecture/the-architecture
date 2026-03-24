# Engine Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for the Engine (Agent Loop) component.

## Requirement Set (MUST)

- `ENG-MUST-001`: Engine accepts bounded internal request shape (`messages` + `metadata`) only.
- `ENG-MUST-002`: `metadata.correlation_id` is required on every request.
- `ENG-MUST-003`: Request metadata cannot be used as a hidden runtime/provider/tool configuration channel.
- `ENG-MUST-004`: Loop continues until model completion signal, unless an explicit configured safety bound terminates with classified overflow behavior.
- `ENG-MUST-005`: Stream events stay within canonical event taxonomy (`text-delta`, `tool-call`, `tool-result`, `approval-request`, `approval-result`, `done`, `error`).
- `ENG-MUST-006`: Assistant text is preserved across tool-continuation turns.
- `ENG-MUST-007`: Tool execution path emits `tool-call` and `tool-result` with stable call ID continuity.
- `ENG-MUST-008`: Recoverable tool failures emit `tool-result` with error/denied status and allow continuation.
- `ENG-MUST-009`: Unrecoverable provider/tool failures emit terminal `error` and terminate stream.
- `ENG-MUST-010`: Mid-stream errors are classified to taxonomy (`provider_error`, `tool_error`, `context_overflow`) with safe messages.
- `ENG-MUST-011`: Tool availability is filtered by Auth-derived actor permissions before model tool advertisement/execution.
- `ENG-MUST-012`: Approval interactions are contract-visible (`approval-request`, `approval-result`) and denied decisions produce denied tool-result semantics.
- `ENG-MUST-013`: Engine does not own conversation persistence or lifecycle operations.
- `ENG-MUST-014`: Provider-specific wire formatting remains in adapters, not in core loop logic.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| ENG-T001P | ENG-MUST-001 | Positive | Submit valid request with `messages` and bounded `metadata` | Request accepted and loop starts | Valid request rejected | Input contract drift |
| ENG-T001N | ENG-MUST-001 | Negative | Submit request with unexpected top-level fields | Safe validation reject | Request accepted | Input shape drift |
| ENG-T002P | ENG-MUST-002 | Positive | Request includes `metadata.correlation_id` | Loop executes and logs correlate | Correlation missing in runtime traces | Traceability drift |
| ENG-T002N | ENG-MUST-002 | Negative | Omit `metadata.correlation_id` | Pre-loop validation failure | Request processed | Required field drift |
| ENG-T003P | ENG-MUST-003 | Positive | Metadata contains only client context data | Request allowed | Context-only metadata rejected | Over-restrictive metadata handling |
| ENG-T003N | ENG-MUST-003 | Negative | Metadata includes `provider`, `api_key`, `tool_sources` | Safe reject before execution | Request accepted with config side channel | Hidden reconfiguration drift |
| ENG-T004P | ENG-MUST-004 | Positive | Model issues tool calls then completion | Loop continues until completion and emits `done` | Premature termination before completion | Loop termination drift |
| ENG-T004N | ENG-MUST-004 | Negative | Configure safety bound and exceed it | Classified terminal `error` with `context_overflow` | Unclassified termination or silent stop | Safety-bound drift |
| ENG-T005P | ENG-MUST-005 | Positive | Full interaction including tools and approval | All emitted events belong to canonical set | Off-contract event emitted | Event taxonomy drift |
| ENG-T005N | ENG-MUST-005 | Negative | Emit non-canonical event type (`tool_result_v2`) | Conformance test fails | Non-canonical event accepted | Event name drift |
| ENG-T006P | ENG-MUST-006 | Positive | Model response includes text and tool calls in same turn | Text is emitted and preserved in continuation transcript | Text dropped when tool calls present | Assistant-text loss drift |
| ENG-T006N | ENG-MUST-006 | Negative | Force implementation that discards assistant text when tools appear | Conformance test fails | Lossy behavior accepted | Continuation state drift |
| ENG-T007P | ENG-MUST-007 | Positive | Model requests tool call `id=tc_1` | `tool-call` and matching `tool-result` with same ID | ID mismatch or missing result event | Tool continuity drift |
| ENG-T007N | ENG-MUST-007 | Negative | Emit `tool-result` with unrelated ID | Conformance test fails | Mismatched IDs accepted | Tool-call correlation drift |
| ENG-T008P | ENG-MUST-008 | Positive | Tool returns recoverable failure | `tool-result` status indicates failure; loop continues | Stream terminates on recoverable failure | Recoverability drift |
| ENG-T008N | ENG-MUST-008 | Negative | Recoverable failure forced to terminal `error` | Conformance test fails | Fatal handling accepted | Error-mode drift |
| ENG-T009P | ENG-MUST-009 | Positive | Inject unrecoverable provider/tool infra failure | Terminal `error` emitted and stream closes | Stream continues after unrecoverable failure | Terminal-failure drift |
| ENG-T009N | ENG-MUST-009 | Negative | Swallow unrecoverable failure and emit no terminal error | Conformance test fails | Silent failure accepted | Failure suppression drift |
| ENG-T010P | ENG-MUST-010 | Positive | Trigger provider timeout, unrecoverable tool failure, and overflow case | Codes map to `provider_error`, `tool_error`, `context_overflow`; messages safe | Wrong code or unsafe message | Taxonomy/safety drift |
| ENG-T010N | ENG-MUST-010 | Negative | Collapse all errors into one code or pass raw stack text | Conformance test fails | Collapse/leak accepted | Taxonomy collapse |
| ENG-T011P | ENG-MUST-011 | Positive | Auth actor lacks write permission | Restricted tools not advertised/executed | Restricted tool callable | Permission boundary drift |
| ENG-T011N | ENG-MUST-011 | Negative | Ignore Auth context and advertise all tools | Conformance test fails | Permission bypass accepted | Auth-context bypass |
| ENG-T012P | ENG-MUST-012 | Positive | Sensitive tool call requires approval; decision denied | `approval-request`, then `approval-result`, then denied `tool-result` semantics | Missing approval events or denied handling | Approval contract drift |
| ENG-T012N | ENG-MUST-012 | Negative | Approval handled outside stream with no approval events | Conformance test fails | Client-only approval accepted | Approval invisibility |
| ENG-T013P | ENG-MUST-013 | Positive | Run interaction and inspect dependencies/storage usage | No conversation create/list/store operations in Engine | Conversation API/storage calls present | Ownership drift |
| ENG-T013N | ENG-MUST-013 | Negative | Add conversation persistence in loop path | Conformance test fails | Persistence ownership violation accepted | Conversation ownership drift |
| ENG-T014P | ENG-MUST-014 | Positive | Core loop calls adapter abstraction only | Provider wire details isolated in adapter module | Provider payload formatting in loop | Adapter boundary drift |
| ENG-T014N | ENG-MUST-014 | Negative | Hardcode provider-specific fields in loop | Conformance test fails | Provider leakage accepted | Provider lock-in drift |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: hidden reconfiguration channels, premature loop termination, event taxonomy drift, assistant-text loss, correlation mismatch, taxonomy collapse, permission bypass, approval invisibility, ownership drift, provider lock-in.
