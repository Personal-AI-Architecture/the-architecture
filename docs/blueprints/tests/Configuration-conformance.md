# Configuration Conformance Test Vectors

This file defines language-agnostic pass/fail vectors for Configuration boundary conformance.

## Requirement Set (MUST)

- `CFG-MUST-001`: Runtime config, adapter config, and preferences must remain distinct layers.
- `CFG-MUST-002`: Request payload metadata must not become a hidden configuration channel.
- `CFG-MUST-003`: Secrets must be referenced and must not be stored by value in Memory or tracked config.
- `CFG-MUST-004`: Runtime config must remain thin and environment-owned.
- `CFG-MUST-005`: Adapter config must contain provider-specific connection settings and secret references only.
- `CFG-MUST-006`: Preferences must remain owner-owned data in Memory.
- `CFG-MUST-007`: Startup must follow deterministic sequence `runtime-config -> adapter-config -> tools -> memory -> preferences -> ready`.
- `CFG-MUST-008`: Startup must fail clearly on invalid or unsupported configuration.
- `CFG-MUST-009`: Tool discovery must be driven by runtime `tool_sources` and reject unknown sources clearly.
- `CFG-MUST-010`: Same-provider model swap must require preference change only.
- `CFG-MUST-011`: Provider swap must require adapter/runtime config changes only, not component code changes.
- `CFG-MUST-012`: Bind posture must be localhost-first by default unless explicitly overridden by deployment config.
- `CFG-MUST-013`: Startup readiness must include auth state bootstrap, conversation persistence path, and export-capable memory surface availability.
- `CFG-MUST-014`: Anti-lock-in provider/model/tool swap checks must pass with config-only changes.

## Test Vectors

| Test ID | Requirement ID | Test Type | Input / Setup | Expected Output / Event / Error | Failure Signal | Drift Category |
|---|---|---|---|---|---|---|
| CFG-T001P | CFG-MUST-001 | Positive | Load runtime, adapter, and preferences from separate files/paths | All loaders succeed with distinct ownership boundaries | Loader collapse detected | Layer separation drift |
| CFG-T001N | CFG-MUST-001 | Negative | Merge runtime/adapter/preferences into one file/loader | Conformance gate fails | Merged loader accepted | Config layer collapse |
| CFG-T002P | CFG-MUST-002 | Positive | Send client metadata with allowed non-config context only | Request accepted | Allowed metadata rejected | Over-restrictive metadata gate |
| CFG-T002N | CFG-MUST-002 | Negative | Send metadata with `provider`, `model`, or `tool_sources` | Request rejected safely (400) | Hidden config accepted | Request-side channel drift |
| CFG-T003P | CFG-MUST-003 | Positive | Use `api_key_env` secret reference in adapter config | Config valid; runtime resolves secret from environment | Secret reference path fails | Secret reference regression |
| CFG-T003N | CFG-MUST-003 | Negative | Put raw `api_key` in runtime/adapter/preferences config | Conformance/security gate fails | Raw secret accepted | Secret-in-config drift |
| CFG-T004P | CFG-MUST-004 | Positive | Runtime config uses core fields plus optional operational extensions only | Runtime config validates | Thin-bootstrap fields rejected incorrectly | Runtime rigidity drift |
| CFG-T004N | CFG-MUST-004 | Negative | Add preference-owned fields (e.g., `default_model`) into runtime config | Validation fails | Preference field accepted in runtime config | Ownership boundary drift |
| CFG-T005P | CFG-MUST-005 | Positive | Adapter config contains `base_url`, `model`, `api_key_env` | Adapter config validates and adapter is created | Adapter config ignored or malformed | Adapter boundary drift |
| CFG-T005N | CFG-MUST-005 | Negative | Adapter config includes `memory_root` or raw secret fields | Validation fails | Cross-layer/secret fields accepted | Adapter pollution drift |
| CFG-T006P | CFG-MUST-006 | Positive | Preferences file in Memory includes `default_model`, `approval_mode` | Preferences load successfully at startup phase | Preferences unavailable | Preference ownership drift |
| CFG-T006N | CFG-MUST-006 | Negative | Move preferences to runtime config and remove Memory preference file | Conformance gate fails | Preferences-outside-memory accepted | Memory ownership erosion |
| CFG-T007P | CFG-MUST-007 | Positive | Capture startup phase events during successful boot | Phase order matches canonical sequence | Out-of-order phase trace | Startup order drift |
| CFG-T007N | CFG-MUST-007 | Negative | Mark system ready before tools or preferences load | Conformance/startup gate fails | Premature ready accepted | Readiness sequencing drift |
| CFG-T008P | CFG-MUST-008 | Positive | Use supported adapter key and valid config schemas | Startup completes with ready state | Valid config rejected | False-fail startup |
| CFG-T008N | CFG-MUST-008 | Negative | Configure unsupported adapter key or invalid schema | Startup fails clearly with explicit error | Startup continues partially | Silent misconfig drift |
| CFG-T009P | CFG-MUST-009 | Positive | Configure known tool sources and discover tools at startup | Tools discovered successfully | Known source rejected | Discovery regression |
| CFG-T009N | CFG-MUST-009 | Negative | Include unsupported tool source in runtime config | Startup/tool discovery fails clearly | Unknown source silently ignored | Hidden capability drift |
| CFG-T010P | CFG-MUST-010 | Positive | Change `default_model` preference within same adapter/provider | Resolved model changes without component code edits | Model unchanged or code edit required | Preference bypass drift |
| CFG-T010N | CFG-MUST-010 | Negative | Require adapter code edit for same-provider model change | Conformance gate fails | Code edit path accepted | Same-provider lock-in |
| CFG-T011P | CFG-MUST-011 | Positive | Switch `provider_adapter` and adapter config file only | Runtime works with new provider adapter | Unrelated component edits required | Provider swap coupling |
| CFG-T011N | CFG-MUST-011 | Negative | Provider swap requires Engine/Gateway logic rewrite | Conformance gate fails | Code rewrite accepted | Provider lock-in drift |
| CFG-T012P | CFG-MUST-012 | Positive | Omit bind address and inspect effective bind default | Effective bind resolves to localhost posture | Non-localhost default used | Exposure default drift |
| CFG-T012N | CFG-MUST-012 | Negative | System defaults to `0.0.0.0` without explicit override | Conformance gate fails | Unsafe default accepted | Network posture drift |
| CFG-T013P | CFG-MUST-013 | Positive | Complete startup and verify auth state, conversation store path, export-capable memory surface | Required readiness surfaces exist from day one | Missing readiness surface | Day-one readiness drift |
| CFG-T013N | CFG-MUST-013 | Negative | Startup claims ready without auth bootstrap or persistence/export paths | Conformance gate fails | Partial readiness accepted | Deferred-hardening drift |
| CFG-T014P | CFG-MUST-014 | Positive | Run provider/model/tool swap scenarios with config-only edits | All swaps pass without code edits | Config-only swap fails | Anti-lock-in regression |
| CFG-T014N | CFG-MUST-014 | Negative | Introduce swap path requiring code changes | Conformance gate fails | Code-change swap accepted | Lock-in drift |

## Coverage Summary

- MUST requirements: 14
- Positive tests: 14
- Negative tests: 14
- Total vectors: 28
- Critical drift categories covered: layer collapse, hidden config channel, secret leakage, runtime bloat, adapter pollution, preference ownership erosion, startup sequencing failures, unsupported-source acceptance, swap lock-in, unsafe bind defaults, day-one readiness regressions.
