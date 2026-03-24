# Models Boundary Drift Guard

This document defines anti-drift controls for Models boundary implementations.

## 1. Top Drift Patterns

- Models reclassified as an internal component.
- Primary model path bypasses Model API and adapter boundaries.
- Provider-specific request shaping leaks into Engine or Gateway code.
- Primary model invocation is implemented as a tool bootstrap path.
- Runtime config, adapter config, and preferences collapse into one layer.
- Request payloads become hidden provider/model/runtime reconfiguration channels.
- Secret values are stored in tracked adapter/runtime/preference files.
- Unsupported adapters silently fall back to default behavior.
- Provider swap requires unrelated component rewrites.
- Offline local-model path is removed or unsupported by policy.
- Model failures leak raw provider details.
- New external APIs are added beyond Gateway API and Model API.

## 2. Prohibited Implementation Shortcuts

- Hardcoding provider selection in Engine core flow.
- Accepting `provider_adapter`, `provider`, `base_url`, `api_key`, `api_key_env`, or `model` in request payload contracts.
- Treating primary model invocation as a required tool call.
- Merging runtime, adapter, and preferences into a mutable request-time config object.
- Storing raw credentials in tracked config files.
- Auto-remapping unsupported adapters without explicit failure.
- Introducing a third external API for model management.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| MODD-CHK-001 | Models remain external dependency, not component | Architecture classification tests | Critical |
| MODD-CHK-002 | Primary model path uses Model API plus adapter | Static/integration call-path checks | Critical |
| MODD-CHK-003 | Provider-specific logic stays adapter-confined | Module boundary scans | Critical |
| MODD-CHK-004 | Primary model is not a bootstrap tool | Control-flow and contract tests | Critical |
| MODD-CHK-005 | Runtime/adapter/preferences remain distinct layers | Startup/config loader tests | Critical |
| MODD-CHK-006 | Same-provider swap is preference-level only | Swap-path integration tests | High |
| MODD-CHK-007 | Provider swap uses adapter/runtime-config only | Swap-path integration tests | High |
| MODD-CHK-008 | Request-time forbidden fields are rejected | Negative contract/schema tests | Critical |
| MODD-CHK-009 | Secret references used; raw secret values forbidden | Config security scans | Critical |
| MODD-CHK-010 | Unsupported adapter fails clearly with no silent fallback | Startup negative tests | Critical |
| MODD-CHK-011 | Local/offline model endpoint remains supported | Offline-path integration tests | High |
| MODD-CHK-012 | Model errors use safe classified taxonomy | Error mapping tests with fault injection | Critical |
| MODD-CHK-013 | Gateway does not own model selection responsibility | Gateway boundary ownership tests | Critical |
| MODD-CHK-014 | External API count remains exactly two | Architecture contract checks | Critical |

## 4. Contract-Break Indicators

- Any runtime artifact classifies models as a component.
- Engine imports provider-native SDK/request logic directly.
- Gateway introduces provider/model selection controls as boundary ownership.
- Request contracts include forbidden reconfiguration fields.
- Adapter config contains `api_key`, `token`, or `password` values.
- Unknown adapter key proceeds without explicit failure.
- Local endpoint path is blocked by hardcoded cloud-only assumptions.
- Error messages include stack traces, raw provider payloads, or credentials.
- Additional external API endpoints are introduced for model control.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `MOD-MUST-*` conformance vector fails.
- Hidden request-time config channel is accepted.
- Raw secret values appear in tracked config/preferences files.
- Unsupported adapter selection silently falls back.
- Offline local-model path is not testable or fails by policy.
- More than two external APIs are exposed.
- Conflict register has unresolved High-risk boundary conflicts.

## 6. Drift Detection Checklist

- [ ] All `MOD-MUST-*` vectors pass (positive and negative).
- [ ] Models are still external and not runtime components.
- [ ] Primary model path uses `Engine -> Model API -> Adapter -> Provider`.
- [ ] Provider-specific logic remains adapter-confined.
- [ ] Primary model is not bootstrapped as a tool.
- [ ] Runtime config, adapter config, and preferences remain separate.
- [ ] Same-provider model swap remains preference-level.
- [ ] Provider swap remains adapter/runtime-config-level.
- [ ] Request payload forbidden fields are rejected.
- [ ] Adapter/runtime/preference files contain secret references only, not secret values.
- [ ] Unsupported adapter fails clearly with no silent fallback.
- [ ] Local/offline endpoint path is still supported and tested.
- [ ] Model failure taxonomy remains safe and classified.
- [ ] External API set is still exactly Gateway API and Model API.
