# Model API Drift Guard

This document defines anti-drift controls for Model API boundary implementations.

## 1. Top Drift Patterns

- Models treated as an internal component rather than external intelligence.
- Engine bypasses adapter abstraction and calls provider-specific APIs directly.
- Provider payload mapping leaks into core Engine flow.
- Internal completion contract drifts from generic shape.
- Runtime config, adapter config, and preferences collapse into one layer.
- Request payloads become hidden provider/runtime reconfiguration channels.
- Adapter config stores secret values instead of secret references.
- Provider errors leak raw unsafe content to client-visible surfaces.
- Unsupported adapters silently fall back instead of failing clearly.
- Provider and model swaps require unrelated component rewrites.
- Tool-call IDs/names/input drift during roundtrip normalization.

## 2. Prohibited Implementation Shortcuts

- Hardcoding provider SDK calls in Engine loop.
- Embedding provider/model/base URL/api key fields in request payload contract.
- Merging runtime, adapter, and preference loading into one ad hoc request-time path.
- Storing `api_key`, tokens, or credentials by value in tracked config.
- Silently defaulting to an adapter when configured adapter is invalid.
- Returning raw provider-native payloads directly to Engine/Gateway.
- Treating Model API as an internal callable tool surface.

## 3. Auto-Check Assertions

| Check ID | Assertion | Validation Mechanism | Severity |
|---|---|---|---|
| MAPID-CHK-001 | Models remain external boundary | Architecture/static checks against component classification | Critical |
| MAPID-CHK-002 | Engine uses adapter abstraction only | Static call-path checks from loop to adapter interface | Critical |
| MAPID-CHK-003 | Provider translation isolated to adapters | Static module-boundary scans | Critical |
| MAPID-CHK-004 | Generic completion contract preserved | Schema validation for request/response pack | Critical |
| MAPID-CHK-005 | Same-provider model swap is preference/model-binding only | Swap-path integration test | High |
| MAPID-CHK-006 | Provider swap is adapter/runtime-config only | Swap-path integration test | High |
| MAPID-CHK-007 | Config layers remain distinct | Startup/config loading tests | Critical |
| MAPID-CHK-008 | Request-time reconfiguration fields rejected | Negative request schema tests | Critical |
| MAPID-CHK-009 | Adapter config references secrets, no raw secret values | Config security scans and schema checks | Critical |
| MAPID-CHK-010 | Provider failures are classified and sanitized | Error mapping tests with fault injection | Critical |
| MAPID-CHK-011 | Unsupported/misconfigured adapter fails clearly | Startup/load negative tests | Critical |
| MAPID-CHK-012 | Local/offline endpoint remains valid via adapter config | Offline-path integration test | High |
| MAPID-CHK-013 | Boundary remains connector, not component/tool collapse | Architecture classification tests | Critical |
| MAPID-CHK-014 | Tool-call roundtrip preserves id/name/input continuity | Tool-call normalization tests | High |

## 4. Contract-Break Indicators

- Provider-specific request fields appear in `model_completion_request`.
- Engine imports provider-specific transport logic.
- Adapter config contains raw credentials.
- Unknown adapter key silently routes to default adapter.
- Provider errors expose stack traces/raw payload or credentials.
- Tool-call IDs or names are missing/unstable across normalization.
- Provider/model swaps require Gateway/Auth/Memory code modifications.

## 5. Fail Build If

- Any Critical auto-check fails.
- Any `MAPI-MUST-*` conformance vector fails.
- Request-time hidden reconfiguration is accepted.
- Secret values are present in tracked adapter/runtime/preference config.
- Unsupported adapter paths do not fail clearly.
- Safe error mapping guarantees are violated.
- Conflict register contains unresolved High-risk boundary conflicts.

## 6. Drift Detection Checklist

- [ ] All `MAPI-MUST-*` vectors pass (positive and negative).
- [ ] Models are still external intelligence through Model API boundary.
- [ ] Engine calls models only through adapter abstraction.
- [ ] Provider translation logic is confined to adapters.
- [ ] Generic completion request/response schemas validate.
- [ ] Same-provider model swap is preference/model-binding only.
- [ ] Provider swap uses adapter/runtime config only.
- [ ] Runtime config, adapter config, and preferences remain separate.
- [ ] Request payloads reject provider/runtime reconfiguration fields.
- [ ] Adapter config references secrets indirectly (`api_key_env`), never by value.
- [ ] Provider failures are safe, classified, and sanitized.
- [ ] Unsupported/misconfigured adapters fail clearly.
- [ ] Local/offline provider endpoint path still works.
- [ ] Tool-call IDs/names/input continuity is preserved.
