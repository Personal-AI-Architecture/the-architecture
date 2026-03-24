# Deployment Boundary Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for the Deployment boundary.

## Requirement Set (MUST)

- `DEP-MUST-001`: Deployment supports operation on owner-controlled hardware.
- `DEP-MUST-002`: A fully offline functional path exists.
- `DEP-MUST-003`: Default network posture is localhost-only.
- `DEP-MUST-004`: Baseline deployment is single-unit by default.
- `DEP-MUST-005`: Owner data remains local by default unless explicitly configured otherwise.
- `DEP-MUST-006`: Baseline operation does not require hidden remote infrastructure.
- `DEP-MUST-007`: Startup order is deterministic (`runtime_config -> adapter_config -> tools -> memory -> preferences -> ready`).
- `DEP-MUST-008`: Critical startup readiness failures fail fast.
- `DEP-MUST-009`: Day-one export and persistent conversation path availability is preserved.
- `DEP-MUST-010`: Unsupported adapter selection fails clearly.
- `DEP-MUST-011`: Deployment profile changes do not alter core component/API ownership boundaries.
- `DEP-MUST-012`: Updates preserve owner data.
- `DEP-MUST-013`: Deployment updates support rollback/reversion.
- `DEP-MUST-014`: Remote/network exposure requires explicit owner action.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| DEP-T001P | DEP-MUST-001 | Positive | Run system on owner-controlled local machine profile | Runtime functional under owner-controlled hardware assumptions | Requires external managed infrastructure | Ownership drift |
| DEP-T001N | DEP-MUST-001 | Negative | Make hosted platform mandatory for startup | Conformance gate fails | Hosted-only baseline accepted | Hardware lock-in |
| DEP-T002P | DEP-MUST-002 | Positive | Configure local model endpoint and run loop with no internet | Full message->model->tool->response loop succeeds | Offline loop cannot complete | Offline path regression |
| DEP-T002N | DEP-MUST-002 | Negative | Require cloud model endpoint for baseline loop | Conformance gate fails | Internet dependency accepted | Cloud dependency lock |
| DEP-T003P | DEP-MUST-003 | Positive | Start with default bind settings | Gateway listens on loopback-only scope by default | Public bind default | Exposure drift |
| DEP-T003N | DEP-MUST-003 | Negative | Ship default bind as `0.0.0.0` without explicit profile override | Conformance gate fails | Public bind default accepted | Network posture drift |
| DEP-T004P | DEP-MUST-004 | Positive | Deploy baseline runtime with core components together | Single-unit startup path is available | Multi-service orchestration required for baseline | Deployment fragmentation |
| DEP-T004N | DEP-MUST-004 | Negative | Require separate required services for basic startup | Conformance gate fails | Multi-service baseline accepted | Baseline complexity drift |
| DEP-T005P | DEP-MUST-005 | Positive | Inspect data paths with default config | Memory/auth/preferences/conversation data remain local by default | Unconfigured outbound data sync occurs | Data locality drift |
| DEP-T005N | DEP-MUST-005 | Negative | Enable outbound owner-data egress by default | Conformance gate fails | Default egress accepted | Silent data export |
| DEP-T006P | DEP-MUST-006 | Positive | Audit baseline dependencies | No hidden mandatory remote infra for baseline operation | Hidden managed dependency detected | Hidden dependency drift |
| DEP-T006N | DEP-MUST-006 | Negative | Introduce mandatory remote broker service for startup | Conformance gate fails | Hidden remote requirement accepted | Infrastructure lock-in |
| DEP-T007P | DEP-MUST-007 | Positive | Capture startup phase events | Phase order exactly matches required sequence | Out-of-order or missing phases | Startup order drift |
| DEP-T007N | DEP-MUST-007 | Negative | Reorder startup to load memory/preferences before adapter config readiness | Conformance gate fails | Reordered startup accepted | Readiness sequencing drift |
| DEP-T008P | DEP-MUST-008 | Positive | Inject critical startup readiness failure (unsupported adapter/version-history failure) | Startup fails clearly before ready state | Warning-only continuation | Fail-fast erosion |
| DEP-T008N | DEP-MUST-008 | Negative | Downgrade critical failure to warning and continue startup | Conformance gate fails | Best-effort continuation accepted | Critical guarantee drift |
| DEP-T009P | DEP-MUST-009 | Positive | Fresh startup then validate export and persistent conversation path | Export and persistence available from day one | Missing export/persistence on first run | Day-one guarantee drift |
| DEP-T009N | DEP-MUST-009 | Negative | Defer export/persistence features post-startup milestone | Conformance gate fails | Deferred baseline guarantees accepted | MVP boundary drift |
| DEP-T010P | DEP-MUST-010 | Positive | Configure unknown adapter in runtime config | Explicit startup/load failure message is emitted | Silent fallback to default adapter | Error masking drift |
| DEP-T010N | DEP-MUST-010 | Negative | Unknown adapter auto-remapped to known adapter | Conformance gate fails | Silent remap accepted | Misconfiguration masking |
| DEP-T011P | DEP-MUST-011 | Positive | Change deployment profile (container/native/local exposed) | Component/API ownership remains unchanged | Components/APIs reshaped by profile | Boundary deformation |
| DEP-T011N | DEP-MUST-011 | Negative | Add deployment-only component/API to handle profile differences | Conformance gate fails | Profile-driven ownership drift accepted | Architecture mutation |
| DEP-T012P | DEP-MUST-012 | Positive | Perform update simulation with existing owner data | Owner data remains intact after update | Data corruption/deletion during update | Update safety drift |
| DEP-T012N | DEP-MUST-012 | Negative | Update process overwrites/deletes owner memory paths | Conformance gate fails | Data-loss update accepted | Data durability drift |
| DEP-T013P | DEP-MUST-013 | Positive | Execute update then rollback scenario | Prior working state restorable with owner data intact | No practical rollback path | Reversibility drift |
| DEP-T013N | DEP-MUST-013 | Negative | Force one-way migration with no rollback plan | Conformance gate fails | Irreversible updates accepted | Recovery lock-in |
| DEP-T014P | DEP-MUST-014 | Positive | Attempt network exposure without explicit override | Exposure remains disabled by default | Exposure enabled implicitly | Default exposure drift |
| DEP-T014N | DEP-MUST-014 | Negative | Auto-enable network exposure on startup when remote IP detected | Conformance gate fails | Implicit exposure accepted | Unsafe auto-exposure |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: ownership lock-in, offline-path regression, network-exposure drift, startup-readiness drift, hidden remote dependency, data-locality erosion, update non-reversibility, architecture mutation by deployment profile.
