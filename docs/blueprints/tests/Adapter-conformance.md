# Adapter Boundary Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for the Adapter boundary.

## Requirement Set (MUST)

- `ADP-MUST-001`: Adapter boundary remains a pattern within existing APIs, not a component or additional API.
- `ADP-MUST-002`: Adapter selection comes from runtime configuration, not request payloads.
- `ADP-MUST-003`: Unsupported adapter selection fails clearly with no silent fallback.
- `ADP-MUST-004`: Provider-specific model protocol logic remains adapter-confined.
- `ADP-MUST-005`: Gateway-side external-standard translation preserves Gateway contract boundaries and does not absorb conversation/auth ownership.
- `ADP-MUST-006`: Runtime config, adapter config, and preferences remain distinct layers.
- `ADP-MUST-007`: Adapter config references secrets indirectly and does not store raw secret values.
- `ADP-MUST-008`: Same-provider model swap remains preference-level.
- `ADP-MUST-009`: Provider swap remains adapter/runtime-config-level without unrelated component rewrites.
- `ADP-MUST-010`: Internal contracts remain stable while adapters absorb external standard changes.
- `ADP-MUST-011`: Adapter error handling maps failures to safe classified surfaces.
- `ADP-MUST-012`: Request payloads do not act as hidden adapter/runtime reconfiguration channels.
- `ADP-MUST-013`: Startup readiness includes deterministic adapter-config loading before ready state.
- `ADP-MUST-014`: Adapter changes do not alter four-component/two-API architecture invariants.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| ADP-T001P | ADP-MUST-001 | Positive | Run architecture classification for adapter boundary | Adapter treated as pattern within APIs only | Adapter classified as component/API | Boundary promotion drift |
| ADP-T001N | ADP-MUST-001 | Negative | Add standalone Adapter service/API in architecture inventory | Conformance gate fails | Standalone adapter subsystem accepted | Architecture inflation |
| ADP-T002P | ADP-MUST-002 | Positive | Configure adapter through runtime config key | Selected adapter resolved from runtime config | Request payload affects adapter selection | Hidden control-channel drift |
| ADP-T002N | ADP-MUST-002 | Negative | Inject `provider_adapter` override in request metadata | Request rejected/ignored for selection | Request-time selection accepted | Request-time reconfiguration |
| ADP-T003P | ADP-MUST-003 | Positive | Set unsupported adapter key | Startup/load fails with explicit message | Silent fallback behavior | Failure-masking drift |
| ADP-T003N | ADP-MUST-003 | Negative | Unknown adapter auto-mapped to default adapter | Conformance gate fails | Silent fallback accepted | Adapter masking drift |
| ADP-T004P | ADP-MUST-004 | Positive | Inspect model call path and module boundaries | Provider protocol logic found only in adapter modules | Provider logic found in Engine core | Provider-logic leak |
| ADP-T004N | ADP-MUST-004 | Negative | Move provider payload shaping into Engine loop | Conformance gate fails | Leak accepted | Core-loop coupling |
| ADP-T005P | ADP-MUST-005 | Positive | Validate gateway-side normalization path | Translation preserves client contract and keeps conversation/auth ownership in Gateway/Auth boundaries | Gateway translation owns conversation/auth policy | Ownership bleed |
| ADP-T005N | ADP-MUST-005 | Negative | Add conversation state or auth decisions inside adapter layer | Conformance gate fails | Adapter ownership creep accepted | Boundary misassignment |
| ADP-T006P | ADP-MUST-006 | Positive | Inspect loaders and schema boundaries | Runtime/adapter/preferences layers are distinct | Layer collapse observed | Config taxonomy drift |
| ADP-T006N | ADP-MUST-006 | Negative | Merge runtime+adapter+preferences into one loader object | Conformance gate fails | Merged layers accepted | Layer collapse |
| ADP-T007P | ADP-MUST-007 | Positive | Validate adapter config content | Uses secret reference key only (for example `api_key_env`) | Raw secret value present | Secret handling drift |
| ADP-T007N | ADP-MUST-007 | Negative | Store `api_key` literal in tracked adapter config | Conformance/security gate fails | Secret-in-config accepted | Secret leakage |
| ADP-T008P | ADP-MUST-008 | Positive | Change model preference with same provider adapter | Active model changes without component code edits | Component code edits required | Model-swap lock-in |
| ADP-T008N | ADP-MUST-008 | Negative | Require Engine/Gateway changes for same-provider model swap | Conformance gate fails | Code-coupled swap accepted | Preference bypass |
| ADP-T009P | ADP-MUST-009 | Positive | Switch runtime adapter key and adapter config | Provider swap succeeds without unrelated component rewrites | Unrelated rewrites required | Provider lock-in |
| ADP-T009N | ADP-MUST-009 | Negative | Hardcode provider in Engine/Gateway for swap path | Conformance gate fails | Hardcoding accepted | Swap-path drift |
| ADP-T010P | ADP-MUST-010 | Positive | Change external protocol mapping in adapter only | Internal contract remains unchanged | Internal contracts changed for external protocol update | Contract instability |
| ADP-T010N | ADP-MUST-010 | Negative | External standard change requires component contract rewrite | Conformance gate fails | Rewrite accepted | Adapter ineffectiveness |
| ADP-T011P | ADP-MUST-011 | Positive | Inject adapter/protocol failures | Safe classified errors emitted | Raw external errors surfaced | Error-safety drift |
| ADP-T011N | ADP-MUST-011 | Negative | Pass through raw provider stack/error payloads | Conformance gate fails | Raw passthrough accepted | Unsafe error surface |
| ADP-T012P | ADP-MUST-012 | Positive | Send valid client request with bounded metadata | Request processed with no adapter/runtime mutation | Hidden reconfiguration accepted | Metadata abuse |
| ADP-T012N | ADP-MUST-012 | Negative | Add config-like fields in request to mutate adapter/runtime | Reject or ignore with validation failure | Mutation accepted | Request-channel drift |
| ADP-T013P | ADP-MUST-013 | Positive | Capture startup phases | `adapter-config` phase appears in deterministic order before `ready` | Missing/late adapter-config phase | Startup readiness drift |
| ADP-T013N | ADP-MUST-013 | Negative | Declare ready before adapter config is loaded | Conformance gate fails | Premature ready accepted | Boot ordering drift |
| ADP-T014P | ADP-MUST-014 | Positive | Audit architecture after adapter modifications | Four components/two APIs unchanged | New component/API introduced by adapter changes | Foundation drift |
| ADP-T014N | ADP-MUST-014 | Negative | Add new external adapter-management API by default | Conformance gate fails | API proliferation accepted | Contract sprawl |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: adapter subsystem inflation, request-time reconfiguration, provider-logic leakage, ownership bleed, config-layer collapse, secret leakage, swap lock-in, contract instability, unsafe error surfaces, startup-order drift, and API proliferation.
