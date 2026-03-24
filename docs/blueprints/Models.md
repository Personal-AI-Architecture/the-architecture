# Models Boundary Blueprint Specification

## 1. Overview

### Purpose
Models define the external-intelligence boundary of the architecture. The system does not contain a model as a component; it calls external model intelligence through the Model API and adapters.

### High-Level Responsibilities
- Preserve the classification of models as external dependencies, not internal components.
- Define how model access is routed through Model API and adapter boundaries.
- Define model and provider swap rules that prevent lock-in drift.
- Define strict separation between runtime config, adapter config, and owner preferences.
- Define request-time guardrails that prevent hidden provider reconfiguration channels.

### System Context
- Models are one of three external dependencies in the foundation architecture.
- Engine is the caller of model intelligence through the Model API boundary.
- Adapter layer translates between internal generic contracts and provider-specific wire formats.
- Configuration and preferences determine binding to a provider and model.
- Security and deployment constraints apply to model access safety and offline-path viability.

### Companion Artifacts
- Model API boundary details: `blueprints/Model-API.md`
- Engine loop ownership: `blueprints/Engine.md`
- Configuration layering and startup order: `blueprints/Configuration.md`

---

## 2. Scope Definition

### What Models **are**
- An external dependency boundary representing model intelligence.
- A policy surface defining model access path, swap semantics, and anti-drift constraints.
- A bridge concept between architecture-level ownership and Model API contract-level payload design.
- A boundary that keeps intelligence swappable while Memory remains persistent.

### What Models **are not**
- Not a fifth runtime component.
- Not an additional external API beyond Gateway API and Model API.
- Not an implementation of provider-specific transport logic inside Engine or Gateway.
- Not a request payload channel for runtime provider/model reconfiguration.
- Not the same artifact as Model API contract details (which are defined separately).

### Boundaries and Constraints
- Model access must occur through Model API plus adapter path.
- Provider specifics must stay adapter-confined.
- Same-provider model swaps must remain preference-led.
- Provider swaps must remain adapter/runtime-config changes, not unrelated component rewrites.
- Primary model intelligence must not be implemented as a bootstrap tool call.

---

## 3. Core Concepts & Terminology

### Key Domain Concepts
- **Models Boundary**: architecture-level definition of model intelligence as external.
- **Model API**: external connector contract between Engine and external models.
- **Adapter**: translation layer between generic internal model contract and provider-native protocols.
- **Model Binding**: resolved provider adapter plus active model selection.
- **Same-Provider Swap**: model change within same provider path.
- **Provider Swap**: provider path change by adapter/runtime config update.

### Internal Concepts
- **Generic Model Contract**: stable internal request/response shape consumed by Engine.
- **Request Guard**: forbidden-field policy preventing request-time config drift.
- **Binding Resolution**: deterministic selection between adapter default and owner preference.

### External Concepts
- **Provider Endpoint**: cloud or local model service endpoint.
- **Secret Reference**: environment variable pointer used by adapter configuration.
- **Offline Path**: local model-hosted operation without mandatory internet dependency.

### Terminology Clarifications
- `Provider API` and `Model API` are treated as equivalent boundary names in source material.
- In blueprint artifacts, `Model API` is canonical naming.
- Primary intelligence is external model execution path; sub-agent model usage can exist as delegated tooling after primary intelligence is established.

---

## 4. Interfaces & Contracts

### 4.1 Canonical Contract Pack
- Schema file: `blueprints/contracts/Models.schema.json`
- Defined interfaces:
  - `model_boundary_profile`
  - `model_access_policy`
  - `model_configuration_layers`
  - `model_binding_policy`
  - `model_request_guard`
  - `model_swap_rules`
  - `provider_swap_rules`
  - `adapter_contract`
  - `model_failure_taxonomy`
  - `model_readiness_profile`

### 4.2 `model_boundary_profile`
- Required fields:
  - `boundary_type` enum: `external_dependency`
  - `component_classification` enum: `not_a_component`
  - `primary_api` enum: `Model API`
  - `external_api_set` array containing `Gateway API` and `Model API`
  - `models_are_component` boolean (must be `false`)
- Optional fields:
  - `notes` string
- Defaults:
  - none
- Forbidden fields:
  - `component_owner`
  - `internal_service_name`
- Error shape:
  - pre-stream/startup: `model_policy_error` with `code=invalid_boundary_profile`
  - mid-stream: not applicable
- Valid example:
```json
{
  "boundary_type": "external_dependency",
  "component_classification": "not_a_component",
  "primary_api": "Model API",
  "external_api_set": ["Gateway API", "Model API"],
  "models_are_component": false
}
```
- Invalid example:
```json
{
  "boundary_type": "component",
  "component_classification": "component",
  "primary_api": "Model API",
  "external_api_set": ["Gateway API", "Model API"],
  "models_are_component": true
}
```
- Why invalid: reclassifies models as a component.

### 4.3 `model_access_policy`
- Required fields:
  - `primary_access_path` enum: `engine_to_model_api_to_adapter_to_external_model`
  - `provider_logic_outside_adapters` boolean (must be `false`)
  - `primary_model_as_tool` boolean (must be `false`)
  - `gateway_owns_model_selection` boolean (must be `false`)
- Optional fields:
  - `subagent_model_tool_allowed` boolean (default `true`)
- Defaults:
  - `subagent_model_tool_allowed=true`
- Forbidden fields:
  - `direct_provider_sdk_in_engine`
- Error shape:
  - pre-stream: `model_policy_error` with `code=invalid_access_policy`
  - mid-stream: provider violations map to Model API error taxonomy
- Valid example:
```json
{
  "primary_access_path": "engine_to_model_api_to_adapter_to_external_model",
  "provider_logic_outside_adapters": false,
  "primary_model_as_tool": false,
  "gateway_owns_model_selection": false,
  "subagent_model_tool_allowed": true
}
```
- Invalid example:
```json
{
  "primary_access_path": "engine_direct_to_provider",
  "provider_logic_outside_adapters": true,
  "primary_model_as_tool": true,
  "gateway_owns_model_selection": true
}
```
- Why invalid: bypasses adapter path and misassigns ownership.

### 4.4 `model_configuration_layers`
- Required fields:
  - `runtime_config_layer` enum: `runtime_config`
  - `adapter_config_layer` enum: `adapter_config`
  - `preference_layer` enum: `preferences`
  - `collapsed_layers` boolean (must be `false`)
- Optional fields:
  - `startup_order` array of enums:
    - `runtime_config`
    - `adapter_config`
    - `tools`
    - `memory`
    - `preferences`
    - `ready`
- Defaults:
  - none
- Forbidden fields:
  - `request_payload_config_layer`
- Error shape:
  - pre-stream/startup: `model_policy_error` with `code=invalid_configuration_layers`
  - mid-stream: not applicable
- Valid example:
```json
{
  "runtime_config_layer": "runtime_config",
  "adapter_config_layer": "adapter_config",
  "preference_layer": "preferences",
  "collapsed_layers": false,
  "startup_order": ["runtime_config", "adapter_config", "tools", "memory", "preferences", "ready"]
}
```
- Invalid example:
```json
{
  "runtime_config_layer": "runtime_config",
  "adapter_config_layer": "runtime_config",
  "preference_layer": "runtime_config",
  "collapsed_layers": true
}
```
- Why invalid: collapses distinct configuration layers.

### 4.5 `model_binding_policy`
- Required fields:
  - `runtime_provider_adapter` string
  - `adapter_default_model` string
  - `preference_default_model` string
  - `resolution_mode` enum: `preference_first_with_adapter_fallback`
- Optional fields:
  - `legacy_bootstrap_default` string
- Defaults:
  - none
- Forbidden fields:
  - `request_time_model_override`
- Error shape:
  - pre-stream/startup: `model_policy_error` with `code=invalid_binding_policy`
  - mid-stream: unresolved binding maps to `adapter_misconfigured`
- Valid example:
```json
{
  "runtime_provider_adapter": "openai-compatible",
  "adapter_default_model": "openai/gpt-4o-mini",
  "preference_default_model": "meta-llama/llama-3.1-8b-instruct",
  "resolution_mode": "preference_first_with_adapter_fallback",
  "legacy_bootstrap_default": "llama3.1"
}
```
- Invalid example:
```json
{
  "runtime_provider_adapter": "openai-compatible",
  "adapter_default_model": "openai/gpt-4o-mini",
  "preference_default_model": "",
  "resolution_mode": "request_time_override"
}
```
- Why invalid: unsupported resolution mode and empty preference model.

### 4.6 `model_request_guard`
- Required fields:
  - `forbidden_request_fields` array including:
    - `provider_adapter`
    - `provider`
    - `base_url`
    - `api_key`
    - `api_key_env`
    - `model`
  - `allow_hidden_config_channel` boolean (must be `false`)
- Optional fields:
  - `max_metadata_bytes` integer
- Defaults:
  - none
- Forbidden fields:
  - none beyond listed forbidden request fields
- Error shape:
  - pre-stream: invalid request with `code=invalid_request`
  - mid-stream: not applicable
- Valid example:
```json
{
  "forbidden_request_fields": [
    "provider_adapter",
    "provider",
    "base_url",
    "api_key",
    "api_key_env",
    "model"
  ],
  "allow_hidden_config_channel": false,
  "max_metadata_bytes": 16384
}
```
- Invalid example:
```json
{
  "forbidden_request_fields": ["provider_adapter"],
  "allow_hidden_config_channel": true
}
```
- Why invalid: allows hidden request-time reconfiguration.

### 4.7 `model_swap_rules`
- Required fields:
  - `same_provider_swap_unit` enum: `preference_change_only`
  - `requires_component_code_changes` boolean (must be `false`)
  - `forbidden_change_units` array including:
    - `gateway_code`
    - `engine_core_code`
    - `auth_code`
    - `memory_code`
- Optional fields:
  - `allowed_change_units` array (default includes `preferences`)
- Defaults:
  - `allowed_change_units=["preferences"]`
- Forbidden fields:
  - `runtime_provider_swap_required`
- Error shape:
  - pre-stream: `model_policy_error` with `code=invalid_model_swap_rule`
  - mid-stream: not applicable
- Valid example:
```json
{
  "same_provider_swap_unit": "preference_change_only",
  "requires_component_code_changes": false,
  "allowed_change_units": ["preferences"],
  "forbidden_change_units": ["gateway_code", "engine_core_code", "auth_code", "memory_code"]
}
```
- Invalid example:
```json
{
  "same_provider_swap_unit": "engine_recompile",
  "requires_component_code_changes": true,
  "forbidden_change_units": []
}
```
- Why invalid: violates same-provider swap invariants.

### 4.8 `provider_swap_rules`
- Required fields:
  - `required_change_units` array including:
    - `runtime_config_provider_adapter`
    - `adapter_config`
  - `requires_unrelated_component_code_changes` boolean (must be `false`)
  - `forbidden_change_units` array including:
    - `gateway_code`
    - `auth_code`
    - `memory_code`
- Optional fields:
  - `recommended_change_units` array containing `secret_env_reference`
- Defaults:
  - none
- Forbidden fields:
  - `provider_hardcoded_in_engine`
- Error shape:
  - pre-stream: `model_policy_error` with `code=invalid_provider_swap_rule`
  - mid-stream: provider unavailability uses failure taxonomy
- Valid example:
```json
{
  "required_change_units": ["runtime_config_provider_adapter", "adapter_config"],
  "recommended_change_units": ["secret_env_reference"],
  "requires_unrelated_component_code_changes": false,
  "forbidden_change_units": ["gateway_code", "auth_code", "memory_code"]
}
```
- Invalid example:
```json
{
  "required_change_units": ["engine_core_code"],
  "requires_unrelated_component_code_changes": true,
  "forbidden_change_units": []
}
```
- Why invalid: provider swap incorrectly requires core component rewrites.

### 4.9 `adapter_contract`
- Required fields:
  - `provider_specific_logic_isolated` boolean (must be `true`)
  - `generic_contract_exposed` boolean (must be `true`)
  - `secret_reference_field` enum: `api_key_env`
  - `forbidden_secret_fields` array including:
    - `api_key`
    - `token`
    - `password`
  - `supports_cloud_endpoints` boolean
  - `supports_local_endpoints` boolean
- Optional fields:
  - `stream_mode` enum: `streaming | non_streaming | both`
- Defaults:
  - `stream_mode=non_streaming`
- Forbidden fields:
  - `provider_logic_in_engine`
- Error shape:
  - pre-stream/startup: `model_policy_error` with `code=invalid_adapter_contract`
  - mid-stream: adapter execution errors map to failure taxonomy
- Valid example:
```json
{
  "provider_specific_logic_isolated": true,
  "generic_contract_exposed": true,
  "secret_reference_field": "api_key_env",
  "forbidden_secret_fields": ["api_key", "token", "password"],
  "supports_cloud_endpoints": true,
  "supports_local_endpoints": true,
  "stream_mode": "non_streaming"
}
```
- Invalid example:
```json
{
  "provider_specific_logic_isolated": false,
  "generic_contract_exposed": false,
  "secret_reference_field": "api_key",
  "forbidden_secret_fields": [],
  "supports_cloud_endpoints": true,
  "supports_local_endpoints": false
}
```
- Why invalid: provider logic not isolated and secret handling violates policy.

### 4.10 `model_failure_taxonomy`
- Required fields:
  - `allowed_codes` array containing:
    - `provider_error`
    - `context_overflow`
    - `invalid_provider_response`
    - `adapter_misconfigured`
    - `provider_unavailable`
  - `safe_message_required` boolean (must be `true`)
  - `raw_provider_error_passthrough` boolean (must be `false`)
- Optional fields:
  - `max_message_length` integer (default `240`)
- Defaults:
  - `max_message_length=240`
- Forbidden fields:
  - `stack_trace`
  - `credential_value`
- Error shape:
  - pre-stream: invalid taxonomy config uses `model_policy_error`
  - mid-stream: use allowed `allowed_codes` only
- Valid example:
```json
{
  "allowed_codes": [
    "provider_error",
    "context_overflow",
    "invalid_provider_response",
    "adapter_misconfigured",
    "provider_unavailable"
  ],
  "safe_message_required": true,
  "raw_provider_error_passthrough": false,
  "max_message_length": 240
}
```
- Invalid example:
```json
{
  "allowed_codes": ["provider_error", "unknown"],
  "safe_message_required": false,
  "raw_provider_error_passthrough": true
}
```
- Why invalid: undefined code and unsafe error policy.

### 4.11 `model_readiness_profile`
- Required fields:
  - `startup_order_enforced` boolean (must be `true`)
  - `required_startup_phases` array exactly:
    - `runtime_config`
    - `adapter_config`
    - `tools`
    - `memory`
    - `preferences`
    - `ready`
  - `unsupported_adapter_fails_startup` boolean (must be `true`)
  - `offline_path_supported` boolean (must be `true`)
- Optional fields:
  - `notes` string
- Defaults:
  - none
- Forbidden fields:
  - `silent_adapter_fallback`
- Error shape:
  - pre-stream/startup: readiness failure blocks ready state
  - mid-stream: not applicable
- Valid example:
```json
{
  "startup_order_enforced": true,
  "required_startup_phases": ["runtime_config", "adapter_config", "tools", "memory", "preferences", "ready"],
  "unsupported_adapter_fails_startup": true,
  "offline_path_supported": true
}
```
- Invalid example:
```json
{
  "startup_order_enforced": false,
  "required_startup_phases": ["memory", "ready"],
  "unsupported_adapter_fails_startup": false,
  "offline_path_supported": false
}
```
- Why invalid: violates deterministic startup and offline-path requirements.

### 4.12 Communication Patterns
- Configuration-time pattern:
  - runtime config + adapter config + preferences resolve model binding before ready state.
- Request-time pattern:
  - Engine submits generic model request through Model API contract to adapter.
- Failure pattern:
  - Model/provider failures are classified and sanitized before stream exposure.

---

## 5. Behavior Specification

### 5.1 Startup and Readiness Behavior
1. Load runtime config and resolve `provider_adapter`.
2. Load adapter config for selected adapter.
3. Discover tools and mount Memory surfaces.
4. Load preferences and resolve active model binding.
5. Instantiate adapter through adapter factory.
6. Reject unsupported adapter names with explicit startup failure.
7. Declare ready only after all required phases succeed.

### 5.2 Model Invocation Behavior
1. Engine builds generic completion request (`messages`, `tools`, metadata).
2. Request guard enforces forbidden request-field policy.
3. Adapter translates request to provider-native shape.
4. Provider response is parsed and normalized.
5. Normalized result is returned to Engine for loop continuation.

### 5.3 Swap Behavior
- Same-provider model swap:
  - owner preference update changes selected model.
  - no unrelated component code changes are required.
- Provider swap:
  - change `provider_adapter` and adapter config.
  - provide corresponding secret reference if needed.
  - no unrelated component rewrite should be required.

### 5.4 Error and Recovery Behavior
- Adapter misconfiguration:
  - fail startup or first bind with explicit classification.
- Provider unavailable/timeouts/rate limits:
  - map to safe classified failures.
- Invalid provider payload:
  - classify as `invalid_provider_response`.
- Context limit overflow:
  - classify as `context_overflow`.

### 5.5 State Management
- Durable state:
  - owner preferences in Memory (`default_model` and policy settings).
  - adapter/runtime config files in deployment context.
- Ephemeral state:
  - per-request completion payloads and parsed provider responses.
  - transient model binding resolution during startup/request handling.

### 5.6 Edge Cases
- Preference file missing or default legacy model value present.
- Adapter config exists but contains invalid URL/schema.
- Provider returns empty body on success or error.
- Provider returns malformed JSON response body.
- Local endpoint reachable without auth header.

---

## 6. Dependencies & Interactions

### External Dependencies
- Model providers (cloud or local endpoints).
- Environment variable secret stores for adapter auth references.

### Internal Interactions
- Engine calls adapters using generic model contract.
- Model API artifact defines request/response payload details.
- Configuration loaders provide runtime + adapter + preference layers.
- Security boundary constrains exposed error surfaces.

### Data Flow
1. Runtime config selects adapter.
2. Adapter config supplies endpoint/auth reference/default model.
3. Preferences supply owner model preference.
4. Binding resolver selects active model.
5. Engine requests completion through adapter.
6. Adapter returns normalized model result or classified failure.

### Dependency Assumptions
- Adapter boundary is stable even if provider wire formats evolve.
- Offline local model path remains operationally supported.
- Model API contract continues as one of only two external APIs.

---

## 7. Invariants & Rules

### Architecture Invariants
- Models remain external, never reclassified as a component (`MO-01`, `F-01`).
- External API set remains exactly Gateway API and Model API (`F-02`, `CU-02`).
- Provider-specific logic stays in adapters, not Engine/Gateway (`E-03`).

### Configuration Invariants
- Runtime config, adapter config, and preferences remain distinct (`C-01`).
- Request payload does not reconfigure provider/runtime binding (`C-02`).
- Secrets are referenced, not stored by value (`C-03`).

### Swap Invariants
- Same-provider model swaps are preference-level (`MO-02`).
- Provider swaps are adapter/runtime-config-level (`MO-03`).
- Normal swaps do not require unrelated component code rewrites (`D147` alignment).

### Validation Rules
- Reject unsupported adapter names deterministically.
- Reject forbidden request fields at boundary validation.
- Enforce safe classified provider/model failures.
- Enforce model-access path classification in architecture checks.

---

## 8. Non-Functional Requirements

### Performance
- Binding resolution overhead should be negligible versus model latency.
- Adapter translation should avoid redundant payload transformations.

### Scalability
- Multiple adapters/providers should be supportable without Engine core rewrites.
- Model swap behavior should remain config/preference driven at larger deployment scale.

### Reliability
- Startup should fail clearly on unsupported/misconfigured adapters.
- Failure classification should be deterministic for common provider fault modes.
- Local/offline model path should remain viable.

### Security
- Secret values must not be stored in tracked config or Memory preferences.
- Error surfaces must not expose stack traces or credentials.
- Adapter boundary must prevent provider details leaking into generic contracts.

### Operability
- Swap paths should be testable in CI as pass/fail anti-lock-in checks.
- Readiness phases should be auditable by structured startup events.

---

## 9. Implementation Notes (Language-Agnostic)

### Recommended Patterns
- Adapter factory pattern with explicit adapter registry.
- Policy-first validation for request guards and configuration layers.
- Boundary tests that verify swap paths and classification invariants.

### Design Considerations
- Keep model binding logic small, explicit, and deterministic.
- Keep naming stable (`Model API`) across artifacts even if legacy docs say `Provider API`.
- Keep sub-agent model-tool behavior explicitly separate from primary model boundary.

### Anti-Patterns to Avoid
- Hardcoding provider selection in Engine or Gateway code paths.
- Accepting per-request provider/model/base URL overrides.
- Merging runtime, adapter, and preference configuration into a single mutable object.
- Silent fallback to default adapter on unsupported adapter key.
- Treating primary model invocation as an internal tool.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `docs/ai/models.md`:
  - models are external boundary; provider details remain in adapters.
  - model and provider swap rules are boundary-defining behavior.
- `docs/ai/compliance-matrix.md`:
  - `MO-01`, `MO-02`, `MO-03` captured as MUST-level invariants.
  - `C-01`, `C-02`, `C-03` captured for configuration/secret integrity.
  - `E-03` captured for adapter-isolation ownership.
- `docs/ai/review-checklists/configuration-review.md`:
  - deterministic startup order and offline model path retained.

### Documented Discrepancies To Reconcile
1. **Naming drift (`Provider API` vs `Model API`)**
   - AI primer uses `Model API`; some human docs use `Provider API` wording.
2. **Swap semantics vs transitional implementation fallback**
   - Primer expects preference-led same-provider swap.
   - Current evidence includes a legacy bootstrap fallback path for default model resolution.
3. **Boundary vs contract overlap**
   - Primer models boundary is concise and policy-level.
   - Existing `Model-API` blueprint already defines detailed payload contracts.

### Rebuild Guidance When Sources Diverge
- Keep Models artifact focused on classification/swap/layer invariants.
- Keep payload-level request/response detail normative in `Model-API` artifact.
- Preserve primer matrix IDs as conformance gate identifiers.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- `models-spec.md`:
  - models are external intelligence, not a component.
  - primary model is not a bootstrap tool.
- `adapter-spec.md`:
  - adapter isolates external protocol details from internal interfaces.
  - provider swap path should be adapter/config-driven.
- `configuration-spec.md`:
  - runtime config, adapter config, and preferences are distinct.
  - anti-lock-in swap expectations are explicit.
- `foundation-spec.md`:
  - exactly two external APIs; models are external dependency.

### Documented Discrepancies To Reconcile
1. **Provider/API naming**
   - Human docs often use `Provider API` while blueprints use `Model API`.
2. **Provider swap ideal vs current adapter inventory**
   - Human docs describe easy provider swaps.
   - Current runtime evidence ships one explicit adapter implementation.
3. **Thin adapter ideal vs practical fallback logic**
   - Human docs emphasize minimal adapter logic.
   - Evidence includes bootstrap-compatibility model-resolution logic in adapter factory.

### Rebuild Guidance When Sources Diverge
- Preserve human architecture ownership as authoritative.
- Treat implementation evidence as current-state behavior, not architecture limits.
- Maintain adapter swappability target even if initial provider set is small.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| MOD-CF-001 | Human docs use `Provider API`; AI/blueprints use `Model API` | Treat names as synonyms; keep `Model API` canonical in blueprints | Prevent naming drift across artifacts while preserving source fidelity | Boundary duplication or contract mismatch across teams |
| MOD-CF-002 | `MO-02` expects preference-led same-provider swap; implementation has legacy bootstrap fallback behavior | Keep preference-led swap as normative target and record bootstrap fallback as transitional evidence | Preserves architecture intent while acknowledging current behavior | Silent preference override can create owner surprise |
| MOD-CF-003 | Human docs describe broad adapter/provider swappability; implementation evidence contains a single explicit adapter in registry | Keep multi-adapter swappability as normative boundary requirement | Prevent MVP implementation details from becoming architecture lock-in | Provider swap becomes code-change dependent |
| MOD-CF-004 | Models boundary policy is concise while Model-API artifact already defines rich payload contracts | Treat Models artifact as policy/ownership boundary and Model-API as payload-contract authority | Reduces duplication and conflicting contract ownership | Split-brain requirements across adjacent artifacts |
| MOD-CF-005 | Human spec says primary model is not a tool; sub-agent use can call models as tools | Keep primary model non-tool invariant; allow secondary delegated model use as explicit conditional policy | Preserves no-circular-bootstrap rule while allowing advanced delegation patterns | Primary intelligence path could be misimplemented as tool bootstrap |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST
- `MOD-MUST-001`: Models MUST remain classified as an external dependency, not a runtime component.
- `MOD-MUST-002`: Primary model access MUST occur through the Model API plus adapter path.
- `MOD-MUST-003`: Provider-specific request/response logic MUST stay adapter-confined.
- `MOD-MUST-004`: Primary model invocation MUST NOT be implemented as a bootstrap tool call.
- `MOD-MUST-005`: Runtime config, adapter config, and preferences MUST remain distinct layers.
- `MOD-MUST-006`: Same-provider model swaps MUST require preference-level change only.
- `MOD-MUST-007`: Provider swaps MUST require adapter/runtime-config changes, not unrelated component rewrites.
- `MOD-MUST-008`: Request payloads MUST NOT carry provider/runtime reconfiguration fields.
- `MOD-MUST-009`: Adapter config MUST reference secrets indirectly (for example `api_key_env`) and MUST NOT store secret values.
- `MOD-MUST-010`: Unsupported or invalid adapter selection MUST fail clearly; silent adapter fallback is forbidden.
- `MOD-MUST-011`: Local/offline model endpoint path MUST remain a supported deployment option.
- `MOD-MUST-012`: Model failure outputs MUST use safe classified taxonomy.
- `MOD-MUST-013`: Gateway MUST NOT own model/provider selection as an architectural responsibility.
- `MOD-MUST-014`: The architecture MUST continue to expose only two external APIs: Gateway API and Model API.

### SHOULD
- `MOD-SHOULD-001`: Implementations SHOULD run swap-path CI checks proving no unrelated component edits are needed.
- `MOD-SHOULD-002`: Adapter contracts SHOULD remain thin and deterministic.
- `MOD-SHOULD-003`: Model binding resolution behavior SHOULD be explicit and auditable in startup telemetry.

### MAY
- `MOD-MAY-001`: Implementations MAY support multiple adapters in one deployment.
- `MOD-MAY-002`: Implementations MAY allow delegated secondary-model tool usage after primary model boundary is established.

## 14. Acceptance Gates (Pass/Fail)

- `MOD-GATE-01 Contract Gate`: Pass if all policy interfaces validate against `contracts/Models.schema.json`; fail otherwise.
- `MOD-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Models-conformance.md` pass (14 positive + 14 negative); fail on any `MOD-MUST-*` failure.
- `MOD-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Models-drift-guard.md` pass; fail on any Critical check failure.
- `MOD-GATE-04 Swap Gate`: Pass if same-provider and provider swap tests meet allowed-change-unit constraints.
- `MOD-GATE-05 Boundary Gate`: Pass if models remain external and no new API/component boundary is introduced.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| MOD-MUST-001 | Human `models-spec.md`, `foundation-spec.md`; AI matrix `MO-01`, `F-01` | `MOD-T001P`, `MOD-T001N` |
| MOD-MUST-002 | Human `models-spec.md`, `adapter-spec.md`; AI matrix `MO-01` | `MOD-T002P`, `MOD-T002N` |
| MOD-MUST-003 | Human `adapter-spec.md`, `engine-spec.md`; AI matrix `E-03` | `MOD-T003P`, `MOD-T003N` |
| MOD-MUST-004 | Human `models-spec.md` connector-not-tool rule | `MOD-T004P`, `MOD-T004N` |
| MOD-MUST-005 | Human `configuration-spec.md`; AI matrix `C-01` | `MOD-T005P`, `MOD-T005N` |
| MOD-MUST-006 | Human `models-spec.md`, `adapter-spec.md`, `configuration-spec.md`; AI matrix `MO-02` | `MOD-T006P`, `MOD-T006N` |
| MOD-MUST-007 | Human `models-spec.md`, `adapter-spec.md`; AI matrix `MO-03` | `MOD-T007P`, `MOD-T007N` |
| MOD-MUST-008 | Human `configuration-spec.md`; AI matrix `C-02` | `MOD-T008P`, `MOD-T008N` |
| MOD-MUST-009 | Human `configuration-spec.md`, `security-spec.md`; AI matrix `C-03` | `MOD-T009P`, `MOD-T009N` |
| MOD-MUST-010 | Human `configuration-spec.md`; AI checklist `configuration-review.md` | `MOD-T010P`, `MOD-T010N` |
| MOD-MUST-011 | Human `deployment-spec.md`; AI matrix `D-02` | `MOD-T011P`, `MOD-T011N` |
| MOD-MUST-012 | Human `security-spec.md`, `gateway-engine-contract.md`; AI matrix `S-01`, `GC-05` | `MOD-T012P`, `MOD-T012N` |
| MOD-MUST-013 | Human `gateway-spec.md`, `configuration-spec.md`; AI matrix `G-02` | `MOD-T013P`, `MOD-T013N` |
| MOD-MUST-014 | Human `foundation-spec.md`; AI matrix `F-02`, `CU-02` | `MOD-T014P`, `MOD-T014N` |

## 16. Residual Risks & Open Decisions

- `MOD-RISK-001 (Medium)`: Legacy bootstrap model fallback behavior can mask owner preference intent.
- `MOD-RISK-002 (Medium)`: Single-adapter deployments can create false confidence about provider-swap readiness.
- `MOD-RISK-003 (Low)`: Mixed `Provider API` vs `Model API` naming may reappear in downstream artifacts.
- `MOD-RISK-004 (Low)`: Offline-path assumptions may drift if local endpoint support is not continuously tested.
- `MOD-DECISION-OPEN-001`: Standardize adapter capability manifest format for multi-adapter inventory.
- `MOD-DECISION-OPEN-002`: Define strict policy for when bootstrap fallback model behavior is allowed in production.

## Related Blueprint Artifacts

- `Model-API` owns payload-level request/response contracts for model invocation:
  - `blueprints/Model-API.md`
  - `blueprints/contracts/Model-API.schema.json`
  - `blueprints/tests/Model-API-conformance.md`
  - `blueprints/drift/Model-API-drift-guard.md`
  - `blueprints/prompts/implement-Model-API.md`
- `Configuration` owns runtime/adapter/preference layering and startup order constraints:
  - `blueprints/Configuration.md`
  - `blueprints/contracts/Configuration.schema.json`
  - `blueprints/tests/Configuration-conformance.md`
  - `blueprints/drift/Configuration-drift-guard.md`
  - `blueprints/prompts/implement-Configuration.md`
- `Engine` owns generic loop execution and consumes this boundary through adapters:
  - `blueprints/Engine.md`
  - `blueprints/contracts/Engine.schema.json`
  - `blueprints/tests/Engine-conformance.md`
  - `blueprints/drift/Engine-drift-guard.md`
  - `blueprints/prompts/implement-Engine.md`
- Overlap precedence:
  - payload-shape conflicts resolve to `Model-API`; boundary-classification and swap-policy conflicts resolve to `Models`.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/base.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/index.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/openai-compatible.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/config.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/config.json`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/openai-compatible.json`
  - `/home/hex/Project/PAA-MVP-Prod/build/test/provider-config.test.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/test/runtime.test.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 10 (`model_boundary_profile`, `model_access_policy`, `model_configuration_layers`, `model_binding_policy`, `model_request_guard`, `model_swap_rules`, `provider_swap_rules`, `adapter_contract`, `model_failure_taxonomy`, `model_readiness_profile`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 5/5 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: standard cross-adapter capability manifest requirements are not yet unified across source docs.
- Final readiness rating: Conditionally Ready
