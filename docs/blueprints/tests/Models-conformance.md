# Models Boundary Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for the Models boundary.

## Requirement Set (MUST)

- `MOD-MUST-001`: Models remain classified as an external dependency, not a runtime component.
- `MOD-MUST-002`: Primary model access occurs through the Model API plus adapter path.
- `MOD-MUST-003`: Provider-specific request/response logic stays adapter-confined.
- `MOD-MUST-004`: Primary model invocation is not implemented as a bootstrap tool call.
- `MOD-MUST-005`: Runtime config, adapter config, and preferences remain distinct layers.
- `MOD-MUST-006`: Same-provider model swap requires preference-level change only.
- `MOD-MUST-007`: Provider swap requires adapter/runtime-config changes, not unrelated component rewrites.
- `MOD-MUST-008`: Request payloads do not carry provider/runtime reconfiguration fields.
- `MOD-MUST-009`: Adapter config references secrets indirectly and does not store secret values.
- `MOD-MUST-010`: Unsupported or invalid adapter selection fails clearly without silent fallback.
- `MOD-MUST-011`: Local/offline model endpoint path remains supported.
- `MOD-MUST-012`: Model failures use safe classified taxonomy.
- `MOD-MUST-013`: Gateway does not own model/provider selection as architectural responsibility.
- `MOD-MUST-014`: External API set remains exactly Gateway API and Model API.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| MOD-T001P | MOD-MUST-001 | Positive | Run architecture classification check over components/dependencies | Models classified as external dependency only | Models listed as runtime component | Component creep |
| MOD-T001N | MOD-MUST-001 | Negative | Introduce `Models` runtime service in component inventory | Conformance gate fails | Runtime models component accepted | Boundary collapse |
| MOD-T002P | MOD-MUST-002 | Positive | Execute completion call path from Engine | Call path resolves `Engine -> Model API -> Adapter -> Provider` | Direct Engine-provider call detected | Adapter bypass |
| MOD-T002N | MOD-MUST-002 | Negative | Add direct provider SDK call in Engine loop | Conformance/static gate fails | Direct path allowed | Path ownership drift |
| MOD-T003P | MOD-MUST-003 | Positive | Inspect payload mapping locations | Provider-native serialization/parsing exists only in adapter modules | Provider mapping outside adapters | Provider logic leak |
| MOD-T003N | MOD-MUST-003 | Negative | Move provider formatting utility into shared Engine module | Conformance gate fails | Shared provider logic accepted | Adapter boundary drift |
| MOD-T004P | MOD-MUST-004 | Positive | Review bootstrap flow for primary intelligence invocation | Primary model invocation is connector call, not tool | Primary model represented as tool call | Connector/tool conflation |
| MOD-T004N | MOD-MUST-004 | Negative | Implement `call_primary_model` as required first tool | Conformance gate fails | Tool-bootstrap accepted | Circular bootstrap drift |
| MOD-T005P | MOD-MUST-005 | Positive | Verify startup loaders and config schemas | Runtime, adapter, preferences loaded as distinct layers | Layer merge detected | Config-layer collapse |
| MOD-T005N | MOD-MUST-005 | Negative | Merge all config sources into one request-time object | Conformance gate fails | Layer merge accepted | Config taxonomy drift |
| MOD-T006P | MOD-MUST-006 | Positive | Change model preference within same adapter/provider | Active model changes without component code edits | Code edits required | Model-swap lock-in |
| MOD-T006N | MOD-MUST-006 | Negative | Require Engine/Gateway edits for same-provider model swap | Conformance gate fails | Code-coupled swap accepted | Preference bypass |
| MOD-T007P | MOD-MUST-007 | Positive | Switch provider by updating adapter key + adapter config | Provider path changes without unrelated component edits | Gateway/Auth/Memory changes required | Provider-lock drift |
| MOD-T007N | MOD-MUST-007 | Negative | Hardcode provider in Engine; swap requires code rewrite | Conformance gate fails | Rewrite accepted | Adapter indirection failure |
| MOD-T008P | MOD-MUST-008 | Positive | Submit valid generic request payload (`messages`, `tools`, metadata only) | Request accepted | Provider/runtime config required in request | Hidden config channel |
| MOD-T008N | MOD-MUST-008 | Negative | Inject `provider_adapter`, `provider`, `base_url`, `api_key`, `api_key_env`, `model` in request payload | Safe reject/schema failure | Forbidden fields accepted | Request-time reconfiguration |
| MOD-T009P | MOD-MUST-009 | Positive | Validate adapter config file | Contains secret reference field only (for example `api_key_env`) | Raw secret values found | Secret handling drift |
| MOD-T009N | MOD-MUST-009 | Negative | Place `api_key` value in tracked adapter config | Conformance/security gate fails | Secret-in-config accepted | Secret leakage |
| MOD-T010P | MOD-MUST-010 | Positive | Configure unknown adapter in runtime config | Startup fails with explicit unsupported-adapter message | Silent fallback behavior | Failure masking |
| MOD-T010N | MOD-MUST-010 | Negative | Unknown adapter silently remaps to default adapter | Conformance gate fails | Silent fallback accepted | Adapter masking drift |
| MOD-T011P | MOD-MUST-011 | Positive | Set adapter `base_url` to reachable local endpoint | Completion path works without mandatory internet dependency | Local endpoint unsupported | Offline-path drift |
| MOD-T011N | MOD-MUST-011 | Negative | Enforce cloud-only endpoint assumptions in adapter contract | Conformance gate fails | Cloud-only model path accepted | Deployment lock-in |
| MOD-T012P | MOD-MUST-012 | Positive | Inject timeout/unavailable/malformed payload failures | Error codes map to allowed taxonomy and safe messages | Raw provider error surfaced | Unsafe error surface |
| MOD-T012N | MOD-MUST-012 | Negative | Forward raw provider stack/error payload to client | Conformance gate fails | Raw passthrough accepted | Error sanitization drift |
| MOD-T013P | MOD-MUST-013 | Positive | Inspect Gateway ownership boundaries | Gateway does not choose model/provider as responsibility | Gateway model selection logic present | Ownership bleed |
| MOD-T013N | MOD-MUST-013 | Negative | Add model-selection policy in Gateway route path | Conformance gate fails | Gateway ownership accepted | Gateway-model drift |
| MOD-T014P | MOD-MUST-014 | Positive | Enumerate external APIs and connectors | Exactly two external APIs: Gateway API and Model API | Additional external API introduced | Contract sprawl |
| MOD-T014N | MOD-MUST-014 | Negative | Add third external API for provider management | Conformance gate fails | Third API accepted | API proliferation |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: component creep, adapter bypass, connector/tool conflation, config-layer collapse, hidden request-time config, secret leakage, adapter fallback masking, offline-path loss, error sanitization drift, ownership bleed, external API proliferation.
