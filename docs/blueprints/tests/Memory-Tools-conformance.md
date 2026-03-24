# Memory Tool Surface Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for Memory Tool Surface conformance.

## Requirement Set (MUST)

- `MTL-MUST-001`: Expose canonical memory tool surface (`memory_read`, `memory_write`, `memory_edit`, `memory_delete`, `memory_list`, `memory_search`, `memory_history`, `memory_export`).
- `MTL-MUST-002`: Enforce memory-root confinement for path-bearing operations.
- `MTL-MUST-003`: Block reserved internals access (`.git` and equivalent reserved roots).
- `MTL-MUST-004`: Require coded approval for mutating operations.
- `MTL-MUST-005`: Record structured audit + version commit for successful mutations.
- `MTL-MUST-006`: Keep read/list/search/history/export as read-only no-approval operations.
- `MTL-MUST-007`: `memory_search` rejects empty query and defaults to conversation exclusion.
- `MTL-MUST-008`: `memory_search` output redacts secret-like token patterns.
- `MTL-MUST-009`: `memory_history` provides change records and prior-state support.
- `MTL-MUST-010`: `memory_history` uses same path policy as file operations.
- `MTL-MUST-011`: `memory_export` returns owner-memory archive path in open-format-compatible output.
- `MTL-MUST-012`: Tool failure taxonomy is classified and safe.
- `MTL-MUST-013`: Startup readiness includes memory-tool, version, and export-capable surface before ready.
- `MTL-MUST-014`: No direct component storage reach-in bypassing memory tool/boundary paths.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| MTL-T001P | MTL-MUST-001 | Positive | Discover registered memory tools from configured sources | All canonical tool names available | Missing required operation | Surface incompleteness drift |
| MTL-T001N | MTL-MUST-001 | Negative | Remove one mandatory memory tool from registration | Conformance gate fails | Missing tool accepted | Contract erosion drift |
| MTL-T002P | MTL-MUST-002 | Positive | Call path-bearing operation with in-root relative/absolute path | Operation executes successfully | Valid in-root path rejected | Path-policy regression |
| MTL-T002N | MTL-MUST-002 | Negative | Call with escaping path (`../outside`) | Classified `path_invalid` failure | Escaped path accepted | Boundary escape drift |
| MTL-T003P | MTL-MUST-003 | Positive | List/search root containing reserved internals | Reserved internals are excluded | Reserved entry exposed | Reserved-scope drift |
| MTL-T003N | MTL-MUST-003 | Negative | Read/write against reserved path (for example `.git/config`) | Classified `reserved_path` failure | Reserved path accepted | Internal leakage drift |
| MTL-T004P | MTL-MUST-004 | Positive | Invoke `memory_write/edit/delete` with pending approval workflow | Approval-request emitted and execution waits for decision | Mutation executes before approval | Approval-control drift |
| MTL-T004N | MTL-MUST-004 | Negative | Force mutation execution without approval decision | Conformance gate fails | Ungated mutation accepted | Control bypass drift |
| MTL-T005P | MTL-MUST-005 | Positive | Execute successful mutation | Structured `memory.write` audit + version commit recorded | Mutation has no audit/commit | Audit/version drift |
| MTL-T005N | MTL-MUST-005 | Negative | Disable audit or commit side effects for mutations | Conformance gate fails | Missing audit/commit accepted | Accountability drift |
| MTL-T006P | MTL-MUST-006 | Positive | Invoke read/list/search/history/export operations | Operations run without approval requirement | Read-only operation requires approval | Read-only regression |
| MTL-T006N | MTL-MUST-006 | Negative | Mark read-only operation as approval-required | Conformance gate fails | Read-only approval inflation accepted | Semantics drift |
| MTL-T007P | MTL-MUST-007 | Positive | Search with non-empty query and no `include_conversations` flag | Success with `include_conversations=false` default | Wrong default inclusion | Search-scope drift |
| MTL-T007N | MTL-MUST-007 | Negative | Search with empty query | Classified `invalid_input` failure | Empty query accepted | Input-validation drift |
| MTL-T008P | MTL-MUST-008 | Positive | Search content containing secret-like token pattern | Result content is redacted | Token appears in clear text | Secret-leak drift |
| MTL-T008N | MTL-MUST-008 | Negative | Disable redaction pass in search output | Conformance gate fails | Cleartext secret pattern accepted | Output-sanitization drift |
| MTL-T009P | MTL-MUST-009 | Positive | Request history for changed file | Entries include commit/message/timestamp/path and prior-state support | Prior-state missing entirely | History-depth drift |
| MTL-T009N | MTL-MUST-009 | Negative | Return metadata-only history with no prior-state path | Conformance gate fails | Metadata-only history accepted | Version contract drift |
| MTL-T010P | MTL-MUST-010 | Positive | Request history with valid in-root path | Path validation aligns with file-op rules | Valid in-root path rejected by history only | Policy inconsistency drift |
| MTL-T010N | MTL-MUST-010 | Negative | Request history with escaped or reserved path | Classified path/reserved failure | Escaped/reserved history accepted | History boundary bypass |
| MTL-T011P | MTL-MUST-011 | Positive | Execute export on initialized memory root | Returns non-empty `archive_path` in owner export surface | Empty/missing archive path | Export regression |
| MTL-T011N | MTL-MUST-011 | Negative | Return external or non-memory-owned archive location by default | Conformance gate fails | External default accepted | Ownership drift |
| MTL-T012P | MTL-MUST-012 | Positive | Trigger known not-found/path-invalid/permission errors | Classified safe failure codes/messages produced | Unclassified failure emitted | Error taxonomy drift |
| MTL-T012N | MTL-MUST-012 | Negative | Emit raw exception/stack trace in failure message | Conformance gate fails | Unsafe failure text accepted | Error safety drift |
| MTL-T013P | MTL-MUST-013 | Positive | Startup with valid config, tools, memory layout, git readiness | Ready state reached after required phases | Ready before memory/version/export readiness | Startup readiness drift |
| MTL-T013N | MTL-MUST-013 | Negative | Startup without version/history readiness | Startup fails clearly before ready | Warning-only continuation | Best-effort drift |
| MTL-T014P | MTL-MUST-014 | Positive | Inspect component paths for memory access | Access goes through approved memory tool/boundary paths | Unauthorized direct access detected | Boundary integrity drift |
| MTL-T014N | MTL-MUST-014 | Negative | Introduce direct filesystem/database reach-in from component path | Conformance gate fails | Direct reach-in accepted | Direct-access drift |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: surface incompleteness, path escape, reserved-path exposure, approval bypass, missing audit/versioning, search safety drift, history contract erosion, export ownership drift, unsafe error leakage, startup readiness degradation, direct storage reach-in.
