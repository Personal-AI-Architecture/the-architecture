# Memory Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for Memory component conformance.

## Requirement Set (MUST)

- `MEM-MUST-001`: Memory has zero outward dependencies on Gateway, Engine, and Auth.
- `MEM-MUST-002`: Components access Memory only through approved tools/boundary interfaces (no direct storage reach-in).
- `MEM-MUST-003`: Memory exposes core operations (`read`, `write`, `edit`, `delete`, `search`, `list`, `history`).
- `MEM-MUST-004`: Path resolution enforces memory-root boundaries and blocks reserved/internal paths.
- `MEM-MUST-005`: Write/edit/delete operations persist durable state and are auditable.
- `MEM-MUST-006`: Conversations persist inside Memory contract through dedicated conversation boundary.
- `MEM-MUST-007`: Conversation list/detail contract shapes remain canonical and stable.
- `MEM-MUST-008`: Export preserves required owner data surface in open format path.
- `MEM-MUST-009`: History includes change records and prior state retrieval behavior.
- `MEM-MUST-010`: Version-history readiness is deterministic at startup (clear fail if unavailable).
- `MEM-MUST-011`: Structured/queryable owner data remains inside Memory contract (not hidden in side stores).
- `MEM-MUST-012`: Secrets are excluded from normal inspectable Memory surfaces where forbidden.
- `MEM-MUST-013`: Owner data remains inspectable without full system runtime.
- `MEM-MUST-014`: Storage backend changes remain behind stable Memory tool contract.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| MEM-T001P | MEM-MUST-001 | Positive | Static dependency scan for Memory module | No imports/runtime dependencies on Gateway/Engine/Auth modules | Dependency edge found | Boundary dependency drift |
| MEM-T001N | MEM-MUST-001 | Negative | Introduce Memory import from Gateway code path | Conformance/static gate fails | Violation accepted | Outward dependency drift |
| MEM-T002P | MEM-MUST-002 | Positive | Exercise Gateway/Engine memory operations via approved tools/repositories | Operations succeed only via declared interfaces | Direct reach-in path used | Boundary bypass |
| MEM-T002N | MEM-MUST-002 | Negative | Add direct file/database access from non-Memory component | Conformance/static gate fails | Direct access accepted | Storage reach-in drift |
| MEM-T003P | MEM-MUST-003 | Positive | Invoke all core operations with valid inputs | Each operation returns contract-valid response | Missing operation or invalid response shape | Surface incompleteness |
| MEM-T003N | MEM-MUST-003 | Negative | Remove `memory_history` or `memory_search` from tool surface | Conformance test fails | Missing operation accepted | Tool contract erosion |
| MEM-T004P | MEM-MUST-004 | Positive | Access valid in-root path | Request succeeds | In-root access denied unexpectedly | Over-restrictive path handling |
| MEM-T004N | MEM-MUST-004 | Negative | Attempt `../` path escape and reserved path access (for example `.git`) | Safe reject with path/reserved error | Escape/reserved access succeeds | Sandbox escape drift |
| MEM-T005P | MEM-MUST-005 | Positive | Perform write/edit/delete then read/list/history | Durable change present and audit event emitted | Change not persisted or no audit signal | Durability/audit drift |
| MEM-T005N | MEM-MUST-005 | Negative | Simulate write path that skips persistence/audit | Conformance test fails | Non-durable/no-audit behavior accepted | Silent write drift |
| MEM-T006P | MEM-MUST-006 | Positive | Create conversation, append messages, fetch detail | Data stored and retrievable via conversation boundary | Conversation not persisted in Memory | Conversation side-store drift |
| MEM-T006N | MEM-MUST-006 | Negative | Store conversations only in process-local map | Conformance test fails | Ephemeral conversation store accepted | Memory contract bypass |
| MEM-T007P | MEM-MUST-007 | Positive | Call conversation list/detail for persisted data | Canonical envelopes returned (`conversations,total,limit,offset`, detail shape) | Envelope mismatch | Contract shape drift |
| MEM-T007N | MEM-MUST-007 | Negative | Return raw storage row/document shape | Conformance schema validation fails | Raw shape accepted | Internal shape leakage |
| MEM-T008P | MEM-MUST-008 | Positive | Invoke memory export | Archive path returned and export artifact exists in open archive format | Missing export artifact/path | Export surface drift |
| MEM-T008N | MEM-MUST-008 | Negative | Export omits required owner data class (for example conversations/history) | Conformance test fails | Incomplete export accepted | Partial export drift |
| MEM-T009P | MEM-MUST-009 | Positive | Request history for changed file | History includes commit/message/timestamp/path and previous state where applicable | No previous-state support | History fidelity drift |
| MEM-T009N | MEM-MUST-009 | Negative | History returns metadata only, never prior state | Conformance test fails | Metadata-only history accepted | Prior-state loss |
| MEM-T010P | MEM-MUST-010 | Positive | Startup with functional version backend | Startup reaches ready state with version-history readiness | Startup marks ready without version initialization | Startup readiness drift |
| MEM-T010N | MEM-MUST-010 | Negative | Startup with broken version backend | Startup fails clearly (or blocks readiness) | Warning-only continuation | Best-effort startup drift |
| MEM-T011P | MEM-MUST-011 | Positive | Query structured owner data through Memory surface | Data is visible via Memory contract tools/boundaries | Structured data hidden outside Memory surface | Hidden data plane drift |
| MEM-T011N | MEM-MUST-011 | Negative | Keep structured/queryable owner data in side database unreachable from Memory tools | Conformance test fails | Side-store accepted | Side storage drift |
| MEM-T012P | MEM-MUST-012 | Positive | Search/list/read inspectable Memory surfaces | No secret values exposed in normal content paths | Secret-like value found in inspectable surfaces | Secret leakage |
| MEM-T012N | MEM-MUST-012 | Negative | Inject API key/token into normal Memory content and export | Conformance/security test fails | Secret exposure accepted | Secrets-in-memory drift |
| MEM-T013P | MEM-MUST-013 | Positive | Stop runtime and inspect data directly on disk with standard tools | Owner data remains readable/inspectable | Data unreadable without runtime | Inspectability drift |
| MEM-T013N | MEM-MUST-013 | Negative | Require proprietary runtime-only format to inspect content | Conformance test fails | Opaque storage accepted | Ownership erosion |
| MEM-T014P | MEM-MUST-014 | Positive | Swap storage backend implementation behind Memory interfaces | Existing Memory tool/boundary contracts still pass | Consumer contracts break on backend swap | Backend lock-in drift |
| MEM-T014N | MEM-MUST-014 | Negative | Backend swap requires API changes in Gateway/Engine | Conformance gate fails | Breaking change accepted | Contract instability |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: outward dependencies, direct storage reach-in, surface incompleteness, path escape, non-durable writes, conversation side-store, partial export, metadata-only history, startup readiness degradation, hidden structured data, secret leakage, inspectability loss, backend lock-in.
