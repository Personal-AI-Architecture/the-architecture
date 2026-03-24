# Model API Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for the Model API boundary.

## Requirement Set (MUST)

- `MAPI-MUST-001`: Models remain external intelligence and are accessed only via Model API boundary.
- `MAPI-MUST-002`: Engine interacts with models through adapter abstraction, not provider-specific calls in core loop.
- `MAPI-MUST-003`: Provider-specific wire formatting/parsing is isolated to adapter layer.
- `MAPI-MUST-004`: Internal completion contract remains generic (`messages + tools` -> `assistantText + toolCalls + finishReason`).
- `MAPI-MUST-005`: Same-provider model swap requires preference change only.
- `MAPI-MUST-006`: Provider swap requires adapter/runtime-config change, not unrelated component code changes.
- `MAPI-MUST-007`: Runtime config, adapter config, and preferences remain distinct configuration layers.
- `MAPI-MUST-008`: Request-time payloads cannot become hidden provider reconfiguration channels.
- `MAPI-MUST-009`: Adapter config uses secret references (for example env var names), not secret values.
- `MAPI-MUST-010`: Provider failures are surfaced as safe classified errors at consuming boundary.
- `MAPI-MUST-011`: Unsupported or misconfigured adapters fail clearly.
- `MAPI-MUST-012`: Local/offline provider endpoint usage remains possible through adapter config.
- `MAPI-MUST-013`: Model API remains connector boundary, not a tool/component collapse.
- `MAPI-MUST-014`: Tool-call roundtrip continuity preserves stable IDs/names/input shape in generic response.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| MAPI-T001P | MAPI-MUST-001 | Positive | Execute completion through configured adapter | Model call occurs via external provider boundary | Model logic embedded as internal component | Boundary collapse |
| MAPI-T001N | MAPI-MUST-001 | Negative | Add direct internal model implementation path bypassing adapter | Conformance/static gate fails | Bypass accepted | External-boundary drift |
| MAPI-T002P | MAPI-MUST-002 | Positive | Run Engine loop completion call path | Engine calls adapter interface only | Engine calls provider SDK/API directly | Adapter bypass |
| MAPI-T002N | MAPI-MUST-002 | Negative | Inject provider-specific call into Engine loop | Conformance/static gate fails | Direct provider call accepted | Core-loop coupling |
| MAPI-T003P | MAPI-MUST-003 | Positive | Inspect adapter module for provider payload mapping | Provider request/response mapping confined to adapter | Mapping logic found outside adapter | Provider logic leak |
| MAPI-T003N | MAPI-MUST-003 | Negative | Move provider payload serialization to shared non-adapter module used by core loop | Conformance boundary test fails | Leak accepted | Adapter boundary drift |
| MAPI-T004P | MAPI-MUST-004 | Positive | Submit valid generic completion request with tools | Adapter returns generic completion response schema | Response deviates from generic shape | Contract drift |
| MAPI-T004N | MAPI-MUST-004 | Negative | Adapter returns provider-native raw payload | Conformance schema validation fails | Raw payload accepted | Normalization drift |
| MAPI-T005P | MAPI-MUST-005 | Positive | Change only preference default model within same provider adapter | Runtime uses new model without code change | Code edits required for same-provider model swap | Swap-path drift |
| MAPI-T005N | MAPI-MUST-005 | Negative | Same-provider swap requires modifying Engine/Gateway code | Conformance test fails | Code-coupled swap accepted | Model-lock drift |
| MAPI-T006P | MAPI-MUST-006 | Positive | Switch provider by runtime adapter key + adapter config file | System works without unrelated component edits | Requires Gateway/Memory/Auth code edits | Provider-lock drift |
| MAPI-T006N | MAPI-MUST-006 | Negative | Provider change requires core-loop logic rewrite | Conformance test fails | Rewrite requirement accepted | Adapter indirection failure |
| MAPI-T007P | MAPI-MUST-007 | Positive | Validate config loading layers | Runtime config, adapter config, preferences loaded distinctly | Layers collapsed | Config-layer collapse |
| MAPI-T007N | MAPI-MUST-007 | Negative | Single loader merges runtime+adapter+preference fields | Conformance check fails | Merged layer accepted | Config taxonomy drift |
| MAPI-T008P | MAPI-MUST-008 | Positive | Submit generic completion request with messages/tools only | Request accepted and processed | Requires provider/base_url/api keys in request | Hidden reconfig drift |
| MAPI-T008N | MAPI-MUST-008 | Negative | Inject `provider`, `model`, `base_url`, `api_key` into request payload | Safe reject or schema failure | Request accepted | Request-time reconfiguration |
| MAPI-T009P | MAPI-MUST-009 | Positive | Validate adapter config | Contains `api_key_env` reference field only | Secret values present | Secret config drift |
| MAPI-T009N | MAPI-MUST-009 | Negative | Use literal `api_key` in tracked adapter config | Conformance/security test fails | Secret-in-config accepted | Secret leakage |
| MAPI-T010P | MAPI-MUST-010 | Positive | Simulate provider timeout/invalid response | Safe classified provider error emitted | Raw stack/provider payload leaked | Unsafe error surface |
| MAPI-T010N | MAPI-MUST-010 | Negative | Forward raw provider exception text and internals directly | Conformance test fails | Unsafe passthrough accepted | Error sanitization drift |
| MAPI-T011P | MAPI-MUST-011 | Positive | Configure unknown adapter key at startup | Clear startup/load failure with explicit reason | Silent fallback to default adapter | Ambiguous failure drift |
| MAPI-T011N | MAPI-MUST-011 | Negative | Misconfigured adapter still starts with implicit defaults | Conformance gate fails | Silent fallback accepted | Misconfiguration masking |
| MAPI-T012P | MAPI-MUST-012 | Positive | Adapter config points to local/offline endpoint | Completion path remains functional when provider local | Local endpoint path unsupported by design | Offline-path drift |
| MAPI-T012N | MAPI-MUST-012 | Negative | Hardcode cloud-only assumptions in Model API boundary | Conformance/deployment check fails | Cloud-only lock accepted | Deployment lock-in |
| MAPI-T013P | MAPI-MUST-013 | Positive | Architecture scan of components/APIs | Model API listed as external API boundary, not component/tool | Model API treated as component/tool | Architecture classification drift |
| MAPI-T013N | MAPI-MUST-013 | Negative | Expose Model API as internal tool callable by loop bootstrap | Conformance fails | Connector/tool conflation accepted | Boundary role drift |
| MAPI-T014P | MAPI-MUST-014 | Positive | Provider returns tool call(s) with id/name/arguments | Adapter yields generic toolCalls with stable id/name/input | Lost IDs/names or malformed input | Tool-call roundtrip drift |
| MAPI-T014N | MAPI-MUST-014 | Negative | Adapter drops tool-call IDs or emits unstable names | Conformance test fails | Inconsistent tool-calls accepted | Tool continuity drift |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: adapter bypass, provider logic leakage, contract drift, config-layer collapse, hidden request-time reconfiguration, secret config leakage, unsafe provider errors, misconfiguration masking, cloud-only lock-in, connector/tool conflation.
