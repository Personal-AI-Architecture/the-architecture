# Tools Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for Tools capability-boundary conformance.

## Requirement Set (MUST)

- `TOL-MUST-001`: Tools must not be implemented as a standalone architecture component.
- `TOL-MUST-002`: Tools must not introduce a separate Tool API boundary.
- `TOL-MUST-003`: Tool execution must occur in Engine and authorization must occur in Auth.
- `TOL-MUST-004`: Tool availability must be environment/configuration plus Auth permission driven.
- `TOL-MUST-005`: Request payloads must not override runtime tool source/availability truth.
- `TOL-MUST-006`: Tool definitions must expose canonical fields (`name`, `description`, `input_schema`, `read_only`, `requires_approval`).
- `TOL-MUST-007`: Invalid/unsupported tool sources or definitions must fail clearly before readiness.
- `TOL-MUST-008`: Tool-call/tool-result exchanges must preserve stable call IDs and contract-visible shape.
- `TOL-MUST-009`: Approval-required mutations must be blocked until coded approval decision.
- `TOL-MUST-010`: Tool failures must be structured, classified, and safe.
- `TOL-MUST-011`: Memory access must remain tool-mediated; no direct storage reach-in by components.
- `TOL-MUST-012`: Tool scope/isolation controls must enforce boundaries independent of Auth policy alone.
- `TOL-MUST-013`: Tool unavailability/timeout/crash must be surfaced explicitly (no silent failure).
- `TOL-MUST-014`: Tool add/remove swap path must remain config/preference-driven without architecture rewrites.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| TOL-T001P | TOL-MUST-001 | Positive | Inspect architecture/runtime boundaries for tool ownership | Tools appear as capability surface only | Tool runtime registered as component | Fifth-component drift |
| TOL-T001N | TOL-MUST-001 | Negative | Add dedicated `Tools` component ownership in architecture/runtime | Conformance gate fails | Dedicated component accepted | Foundation boundary drift |
| TOL-T002P | TOL-MUST-002 | Positive | Route tool-call flow via Model API -> Engine execution path | No extra Tool API contract introduced | Unexpected additional API surfaced | API-surface drift |
| TOL-T002N | TOL-MUST-002 | Negative | Introduce standalone `/tools/*` execution API | Conformance gate fails | Tool API accepted | API proliferation drift |
| TOL-T003P | TOL-MUST-003 | Positive | Trigger tool call with valid auth context | Execution runs in Engine after Auth check | Auth skipped or execution outside Engine | Ownership split drift |
| TOL-T003N | TOL-MUST-003 | Negative | Execute tool without Auth decision or from Gateway path | Request denied or conformance fails | Tool executes without Auth/Engine path | Authorization bypass drift |
| TOL-T004P | TOL-MUST-004 | Positive | Configure runtime tool sources and actor permissions | Callable tools equal env-available intersection with permitted set | Availability ignores config/permissions | Availability drift |
| TOL-T004N | TOL-MUST-004 | Negative | Hardcode tool availability in request path/business logic | Conformance gate fails | Hardcoded availability accepted | Ad hoc availability drift |
| TOL-T005P | TOL-MUST-005 | Positive | Send normal metadata free of runtime tool overrides | Request accepted | Safe metadata rejected | Over-restrictive metadata gate |
| TOL-T005N | TOL-MUST-005 | Negative | Include `tool_sources` or tool-def fields in request metadata | Request rejected safely pre-stream | Hidden override accepted | Hidden config-channel drift |
| TOL-T006P | TOL-MUST-006 | Positive | Validate discovered tool definitions against canonical schema | Definitions pass with required fields present | Valid definitions rejected | Contract rigidity drift |
| TOL-T006N | TOL-MUST-006 | Negative | Provide tool definition missing `input_schema` or with forbidden fields | Validation fails clearly | Invalid definition accepted | Definition-shape drift |
| TOL-T007P | TOL-MUST-007 | Positive | Startup with supported tool sources and valid definitions | System reaches ready phase | Supported source fails unexpectedly | Discovery regression |
| TOL-T007N | TOL-MUST-007 | Negative | Configure unknown source or malformed definition | Startup fails clearly before ready | Unknown source ignored silently | Silent-discovery drift |
| TOL-T008P | TOL-MUST-008 | Positive | Execute tool call and emit result with same call ID | `tool-call.id` == `tool-result.id` and shape is contract-valid | Call/result ID mismatch | Event-contract drift |
| TOL-T008N | TOL-MUST-008 | Negative | Emit tool result without ID or with renamed fields | Conformance gate fails | Off-contract event accepted | Stream-shape drift |
| TOL-T009P | TOL-MUST-009 | Positive | Invoke approval-required mutating tool with pending approval | `approval-request` emitted; execution waits for decision | Mutation executes before approval | Approval-bypass drift |
| TOL-T009N | TOL-MUST-009 | Negative | Force mutation execution without approval decision | Conformance gate fails | Unapproved mutation accepted | Control-plane drift |
| TOL-T010P | TOL-MUST-010 | Positive | Trigger tool failure (e.g., not found/path invalid) | Structured safe failure output with code/message/recoverable | Failure lacks classification | Error-taxonomy drift |
| TOL-T010N | TOL-MUST-010 | Negative | Emit raw stack trace/internal path in tool failure message | Conformance gate fails | Unsafe message exposed | Error-sanitization drift |
| TOL-T011P | TOL-MUST-011 | Positive | Verify component memory operations occur through tools/boundaries | No direct storage reach-in from Gateway/Engine/Auth | Direct access detected | Memory-boundary drift |
| TOL-T011N | TOL-MUST-011 | Negative | Add direct filesystem/database access in component path | Conformance gate fails | Direct access accepted | Boundary-bypass drift |
| TOL-T012P | TOL-MUST-012 | Positive | Apply restrictive tool isolation profile with Auth allow | Tool remains confined to configured scope | Auth allow grants out-of-scope access | Isolation drift |
| TOL-T012N | TOL-MUST-012 | Negative | Configure untrusted tool as in-process/full network | Policy validation fails | Unsafe isolation accepted | Trust-boundary drift |
| TOL-T013P | TOL-MUST-013 | Positive | Simulate timeout/unavailable/crash in tool runtime | Explicit structured unavailability/failure surfaced | Failure is swallowed silently | Reliability drift |
| TOL-T013N | TOL-MUST-013 | Negative | Drop failed tool calls without emitting tool failure | Conformance gate fails | Silent failure accepted | Observability drift |
| TOL-T014P | TOL-MUST-014 | Positive | Add/remove tool by config/source + preference updates only | Capability change succeeds without architecture rewrite | Code rewrite required | Swap lock-in drift |
| TOL-T014N | TOL-MUST-014 | Negative | Require Gateway/Engine redesign for normal tool swap | Conformance gate fails | Rewrite accepted as normal | Architecture lock-in drift |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: fifth-component drift, API proliferation, auth bypass, hidden config channels, definition-shape drift, stream-shape drift, approval bypass, error sanitization, memory-boundary bypass, trust-boundary violations, silent-failure behavior, swap lock-in.
