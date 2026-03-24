# Adapter Boundary Blueprint Specification

## 1. Overview

### Purpose
Adapters are translation boundaries that keep internal contracts stable while external protocol standards change. They make contracts swappable without forcing component rewrites.

### High-Level Responsibilities
- Define adapter ownership as an implementation pattern within existing APIs, not a component/API addition.
- Define translation responsibilities for Gateway API and Model API boundaries.
- Define swap semantics for standards/providers without unrelated code changes.
- Define strict separation between adapter config and runtime/request/preference layers.
- Define anti-drift constraints that keep adapters thin and bounded.

### System Context
- Adapter boundary sits between internal contracts and external standards.
- It touches both external APIs:
  - Gateway API adapter (client standard <-> Gateway internal request/response shape).
  - Model API adapter (Engine internal completion shape <-> provider-native model format).
- Adapter behavior depends on Configuration for adapter selection and adapter config loading.
- Adapter behavior must preserve Security and Gateway-Engine contract safety surfaces.

### Companion Artifacts
- Gateway API contract: `blueprints/Gateway-API.md`
- Model API contract: `blueprints/Model-API.md`
- Models boundary: `blueprints/Models.md`
- Configuration boundary: `blueprints/Configuration.md`

---

## 2. Scope Definition

### What Adapters **are**
- A translation pattern for external-standard-to-internal-contract mapping.
- A swappability mechanism for standards and provider protocols.
- A strict separation layer that protects components from external protocol churn.
- A boundary for adapter-specific configuration and translation-time error mapping.

### What Adapters **are not**
- Not a runtime component.
- Not a third API boundary.
- Not a place for component business logic.
- Not a hidden request-time configuration channel.
- Not a replacement for component contracts or ownership boundaries.

### Boundaries and Constraints
- Adapters must remain thin: translation and bounded protocol normalization only.
- Adapters must not absorb component responsibilities (conversation lifecycle, auth policy, tool execution).
- Adapters must preserve internal contract stability while external standards evolve.
- Adapter selection and swap paths must be config-driven.
- Adapter configs must reference secrets, never store secret values.

---

## 3. Core Concepts & Terminology

### Key Domain Concepts
- **Adapter Boundary**: architecture layer that translates internal contracts to external standards and back.
- **Gateway API Adapter**: translation between client protocol standard and Gateway internal external contract usage.
- **Model API Adapter**: translation between Engine internal completion contract and provider-native model protocol.
- **Internal Contract**: system-owned stable interface consumed by components.
- **External Standard**: third-party/public protocol format not controlled by system architecture.
- **Adapter Swap**: replacing one adapter implementation/config with another while keeping component code stable.

### Internal Concepts
- **Adapter Registry**: runtime map from adapter key to adapter implementation.
- **Adapter Config**: provider/standard-specific connection and metadata settings.
- **Translation Envelope**: normalized in-memory structure adapters consume/emit.

### External Concepts
- **Client Standard**: protocol shape used by external clients (for example chat-completions style).
- **Provider Standard**: protocol shape used by model providers.
- **Standard Churn**: external protocol changes introduced outside system control.

### Terminology Clarifications
- In human docs, model boundary may be called “Provider API”; blueprints use “Model API”.
- “Adapter” in this artifact covers both Gateway-side and Model-side adapter concerns.

---

## 4. Interfaces & Contracts

### 4.1 Canonical Contract Pack
- Schema file: `blueprints/contracts/Adapter.schema.json`
- Defined interfaces:
  - `adapter_boundary_profile`
  - `adapter_registry_entry`
  - `adapter_selection_policy`
  - `gateway_api_adapter_profile`
  - `model_api_adapter_profile`
  - `adapter_translation_policy`
  - `adapter_config_profile`
  - `adapter_swap_policy`
  - `adapter_error_policy`
  - `adapter_runtime_constraints`

### 4.2 `adapter_boundary_profile`
- Required fields:
  - `is_component` boolean (must be `false`)
  - `is_api` boolean (must be `false`)
  - `pattern_scope` enum: `within_existing_apis`
  - `supported_adapter_domains` array containing:
    - `gateway_api`
    - `model_api`
- Optional fields:
  - `notes` string
- Defaults:
  - none
- Forbidden fields:
  - `new_external_api_name`
  - `component_owner`
- Error shape:
  - pre-stream/startup: `adapter_policy_error` with `code=invalid_boundary_profile`
  - mid-stream: not applicable
- Valid example:
```json
{
  "is_component": false,
  "is_api": false,
  "pattern_scope": "within_existing_apis",
  "supported_adapter_domains": ["gateway_api", "model_api"]
}
```
- Invalid example:
```json
{
  "is_component": true,
  "is_api": true,
  "pattern_scope": "new_subsystem",
  "supported_adapter_domains": ["model_api"]
}
```
- Why invalid: adapter boundary is incorrectly promoted to component/API subsystem.

### 4.3 `adapter_registry_entry`
- Required fields:
  - `adapter_key` string
  - `adapter_domain` enum: `gateway_api | model_api`
  - `enabled` boolean
- Optional fields:
  - `implementation_ref` string
  - `trust_level` enum: `system_shipped | owner_installed`
- Defaults:
  - `enabled=true`
  - `trust_level=system_shipped`
- Forbidden fields:
  - `secret_value`
  - `request_override_allowed`
- Error shape:
  - pre-stream/startup: `adapter_policy_error` with `code=invalid_registry_entry`
  - mid-stream: not applicable
- Valid example:
```json
{
  "adapter_key": "openai-compatible",
  "adapter_domain": "model_api",
  "enabled": true,
  "implementation_ref": "build/adapters/openai-compatible.ts",
  "trust_level": "system_shipped"
}
```
- Invalid example:
```json
{
  "adapter_domain": "model_api",
  "enabled": true
}
```
- Why invalid: missing required adapter key.

### 4.4 `adapter_selection_policy`
- Required fields:
  - `selection_source` enum: `runtime_config`
  - `silent_fallback_allowed` boolean (must be `false`)
  - `unsupported_adapter_behavior` enum: `fail_clearly`
- Optional fields:
  - `startup_selection_only` boolean (default `true`)
- Defaults:
  - `startup_selection_only=true`
- Forbidden fields:
  - `request_time_adapter_override`
- Error shape:
  - pre-stream/startup: `adapter_policy_error` with `code=invalid_selection_policy`
  - mid-stream: adapter resolution errors mapped to safe classified errors
- Valid example:
```json
{
  "selection_source": "runtime_config",
  "silent_fallback_allowed": false,
  "unsupported_adapter_behavior": "fail_clearly",
  "startup_selection_only": true
}
```
- Invalid example:
```json
{
  "selection_source": "request_payload",
  "silent_fallback_allowed": true,
  "unsupported_adapter_behavior": "auto_default"
}
```
- Why invalid: request-time override and silent fallback are prohibited.

### 4.5 `gateway_api_adapter_profile`
- Required fields:
  - `inbound_translation` enum: `external_client_shape_to_gateway_contract`
  - `outbound_translation` enum: `gateway_stream_to_external_client_shape`
  - `component_logic_embedded` boolean (must be `false`)
- Optional fields:
  - `standard_family` string
- Defaults:
  - none
- Forbidden fields:
  - `conversation_lifecycle_owner`
  - `auth_policy_owner`
- Error shape:
  - pre-stream: `adapter_policy_error` with `code=invalid_gateway_adapter_profile`
  - mid-stream: response-shape violations map to contract failures
- Valid example:
```json
{
  "inbound_translation": "external_client_shape_to_gateway_contract",
  "outbound_translation": "gateway_stream_to_external_client_shape",
  "component_logic_embedded": false,
  "standard_family": "chat-completions-compatible"
}
```
- Invalid example:
```json
{
  "inbound_translation": "none",
  "outbound_translation": "none",
  "component_logic_embedded": true
}
```
- Why invalid: adapter omits translation and embeds component logic.

### 4.6 `model_api_adapter_profile`
- Required fields:
  - `inbound_translation` enum: `engine_contract_to_provider_payload`
  - `outbound_translation` enum: `provider_payload_to_engine_contract`
  - `provider_logic_outside_adapter` boolean (must be `false`)
  - `supports_tool_call_normalization` boolean (must be `true`)
- Optional fields:
  - `transport_modes` array containing any of:
    - `streaming`
    - `non_streaming`
- Defaults:
  - none
- Forbidden fields:
  - `engine_core_provider_binding`
- Error shape:
  - pre-stream/startup: `adapter_policy_error` with `code=invalid_model_adapter_profile`
  - mid-stream: translation failures map to safe model/provider error taxonomy
- Valid example:
```json
{
  "inbound_translation": "engine_contract_to_provider_payload",
  "outbound_translation": "provider_payload_to_engine_contract",
  "provider_logic_outside_adapter": false,
  "supports_tool_call_normalization": true,
  "transport_modes": ["non_streaming"]
}
```
- Invalid example:
```json
{
  "inbound_translation": "engine_direct_provider_sdk",
  "outbound_translation": "raw_passthrough",
  "provider_logic_outside_adapter": true,
  "supports_tool_call_normalization": false
}
```
- Why invalid: provider logic leaked beyond adapter and no normalization.

### 4.7 `adapter_translation_policy`
- Required fields:
  - `internal_contract_stable` boolean (must be `true`)
  - `external_standard_change_absorbed_by_adapter` boolean (must be `true`)
  - `translation_scope_only` boolean (must be `true`)
- Optional fields:
  - `stateless_preferred` boolean (default `true`)
- Defaults:
  - `stateless_preferred=true`
- Forbidden fields:
  - `business_logic_in_translation`
  - `policy_engine_in_adapter`
- Error shape:
  - pre-stream/startup: `adapter_policy_error` with `code=invalid_translation_policy`
  - mid-stream: contract drift errors on mismatched translation shape
- Valid example:
```json
{
  "internal_contract_stable": true,
  "external_standard_change_absorbed_by_adapter": true,
  "translation_scope_only": true,
  "stateless_preferred": true
}
```
- Invalid example:
```json
{
  "internal_contract_stable": false,
  "external_standard_change_absorbed_by_adapter": false,
  "translation_scope_only": false
}
```
- Why invalid: violates core adapter swappability purpose.

### 4.8 `adapter_config_profile`
- Required fields:
  - `adapter_config_separate_from_runtime` boolean (must be `true`)
  - `adapter_config_separate_from_preferences` boolean (must be `true`)
  - `secret_reference_key` enum: `api_key_env`
  - `raw_secret_values_allowed` boolean (must be `false`)
- Optional fields:
  - `config_fields` array containing any of:
    - `base_url`
    - `model`
    - `api_key_env`
- Defaults:
  - none
- Forbidden fields:
  - `api_key`
  - `token`
  - `password`
- Error shape:
  - pre-stream/startup: `adapter_policy_error` with `code=invalid_adapter_config_profile`
  - mid-stream: not applicable
- Valid example:
```json
{
  "adapter_config_separate_from_runtime": true,
  "adapter_config_separate_from_preferences": true,
  "secret_reference_key": "api_key_env",
  "raw_secret_values_allowed": false,
  "config_fields": ["base_url", "model", "api_key_env"]
}
```
- Invalid example:
```json
{
  "adapter_config_separate_from_runtime": false,
  "adapter_config_separate_from_preferences": false,
  "secret_reference_key": "api_key",
  "raw_secret_values_allowed": true
}
```
- Why invalid: config-layer collapse and secret leakage risk.

### 4.9 `adapter_swap_policy`
- Required fields:
  - `same_provider_model_swap` enum: `preference_change_only`
  - `provider_swap` enum: `runtime_adapter_plus_adapter_config_change`
  - `unrelated_component_code_change_required` boolean (must be `false`)
- Optional fields:
  - `gateway_standard_swap_supported` boolean (default `true`)
- Defaults:
  - `gateway_standard_swap_supported=true`
- Forbidden fields:
  - `engine_rewrite_required`
  - `gateway_rewrite_required`
- Error shape:
  - pre-stream/startup: `adapter_policy_error` with `code=invalid_swap_policy`
  - mid-stream: not applicable
- Valid example:
```json
{
  "same_provider_model_swap": "preference_change_only",
  "provider_swap": "runtime_adapter_plus_adapter_config_change",
  "unrelated_component_code_change_required": false,
  "gateway_standard_swap_supported": true
}
```
- Invalid example:
```json
{
  "same_provider_model_swap": "engine_code_change",
  "provider_swap": "full_component_rewrite",
  "unrelated_component_code_change_required": true
}
```
- Why invalid: swap behavior violates anti-lock-in rules.

### 4.10 `adapter_error_policy`
- Required fields:
  - `safe_error_messages_required` boolean (must be `true`)
  - `raw_external_error_passthrough` boolean (must be `false`)
  - `classified_error_mapping_required` boolean (must be `true`)
- Optional fields:
  - `allowed_error_codes` array containing any of:
    - `provider_error`
    - `context_overflow`
    - `invalid_provider_response`
    - `adapter_misconfigured`
    - `provider_unavailable`
- Defaults:
  - none
- Forbidden fields:
  - `stack_trace`
  - `credential_echo`
- Error shape:
  - pre-stream/startup: `adapter_policy_error` with `code=invalid_error_policy`
  - mid-stream: adapter failures must be safe-classified
- Valid example:
```json
{
  "safe_error_messages_required": true,
  "raw_external_error_passthrough": false,
  "classified_error_mapping_required": true,
  "allowed_error_codes": ["provider_error", "context_overflow", "invalid_provider_response", "adapter_misconfigured", "provider_unavailable"]
}
```
- Invalid example:
```json
{
  "safe_error_messages_required": false,
  "raw_external_error_passthrough": true,
  "classified_error_mapping_required": false
}
```
- Why invalid: unsafe passthrough and no classified mapping.

### 4.11 `adapter_runtime_constraints`
- Required fields:
  - `request_time_reconfiguration_allowed` boolean (must be `false`)
  - `startup_selection_required` boolean (must be `true`)
  - `unsupported_adapter_fails_startup` boolean (must be `true`)
  - `deterministic_boot_phase_includes_adapter_config` boolean (must be `true`)
- Optional fields:
  - `gateway_adapter_runtime_form` enum: `explicit_module | integrated_normalizer`
- Defaults:
  - `gateway_adapter_runtime_form=integrated_normalizer`
- Forbidden fields:
  - `silent_dynamic_adapter_switch`
- Error shape:
  - pre-stream/startup: `adapter_policy_error` with `code=invalid_runtime_constraints`
  - mid-stream: request violations rejected as invalid request
- Valid example:
```json
{
  "request_time_reconfiguration_allowed": false,
  "startup_selection_required": true,
  "unsupported_adapter_fails_startup": true,
  "deterministic_boot_phase_includes_adapter_config": true,
  "gateway_adapter_runtime_form": "integrated_normalizer"
}
```
- Invalid example:
```json
{
  "request_time_reconfiguration_allowed": true,
  "startup_selection_required": false,
  "unsupported_adapter_fails_startup": false,
  "deterministic_boot_phase_includes_adapter_config": false
}
```
- Why invalid: enables hidden runtime drift.

### 4.12 Communication Patterns
- Startup pattern:
  - runtime config selects adapter key, adapter config loads before ready state.
- Request pattern:
  - component emits internal envelope, adapter translates to external standard, response translated back.
- Swap pattern:
  - standards/providers change through adapter/config selection, not component rewrites.

---

## 5. Behavior Specification

### 5.1 Startup and Registration Behavior
1. Load runtime config and read adapter key(s).
2. Load adapter config for selected adapter(s).
3. Resolve active adapter from registry/factory.
4. Fail clearly when adapter key is unsupported.
5. Expose ready state only after adapter selection/validation is complete.

### 5.2 Gateway-Side Translation Behavior
1. Accept client-facing request shape.
2. Normalize inbound payload to Gateway-owned internal contract.
3. Map outbound stream/events and response envelopes back to client-facing shape.
4. Preserve contract-visible approval semantics and stable identifiers.

### 5.3 Model-Side Translation Behavior
1. Accept Engine generic completion request envelope.
2. Translate to provider-native request payload.
3. Parse provider response.
4. Normalize response to internal `assistantText/toolCalls/finishReason`.
5. Map provider failures to safe classified errors.

### 5.4 Swap Behavior
- Same provider, different model:
  - preference update only.
- Different provider:
  - runtime adapter key and adapter config changes.
- Different external client standard:
  - gateway adapter translation replacement while preserving Gateway internal contract.

### 5.5 Error and Safety Behavior
- Adapter errors must be safe, classified, and contract-aligned.
- Raw external/provider stack traces and credentials are never exposed.
- Unknown adapter keys fail startup/load clearly without fallback.

### 5.6 Edge Cases
- Missing/invalid adapter config files.
- Provider returns empty or malformed payload.
- Missing tool-call IDs in provider response.
- External request shape includes config-like fields.
- Gateway adapter module receives malformed or out-of-contract client payloads and must fail safely without ownership leakage.

---

## 6. Dependencies & Interactions

### External Dependencies
- External client protocol standards.
- External model provider protocol standards.
- Secret reference sources (environment variables or equivalent secure source).

### Internal Interactions
- Gateway API contract and Gateway component for client-side translation.
- Model API contract and Engine component for provider-side translation.
- Configuration loaders for runtime and adapter config.
- Security and Gateway-Engine contract for safe error/event behavior.

### Data Flow
1. Runtime config selects adapter keys.
2. Adapter config provides endpoint/credential references.
3. Adapters translate internal contract to external standard.
4. External responses are normalized back to internal contract.
5. Components continue generic flow independent of external format specifics.

### Dependency Assumptions
- External standards will change over time.
- Internal contract ownership remains stable.
- Adapter replacement is cheaper than component rewrites.

---

## 7. Invariants & Rules

### Boundary Invariants
- Adapter boundary is not a component and not an API boundary.
- External contract count remains Gateway API and Model API only.
- Provider-specific logic remains outside Engine core and inside adapters.

### Configuration Invariants
- Runtime config, adapter config, and preferences are distinct layers.
- Request payloads are not hidden adapter/runtime config channels.
- Secrets are referenced, not stored by value in tracked config.

### Swap Invariants
- Same-provider model swap remains preference-level.
- Provider swap remains runtime-adapter-key plus adapter-config change.
- Adapter swaps do not require unrelated Gateway/Engine/Auth/Memory rewrites.

### Translation Invariants
- Internal contract remains stable and bounded.
- Adapter responsibilities stay translation-focused.
- Error mapping remains safe and classified.

---

## 8. Non-Functional Requirements

### Performance
- Translation overhead should be small relative to network/provider latency.
- Adapters should avoid redundant parse/serialize passes where possible.

### Scalability
- Multiple adapters should be supportable without core component rewrites.
- Adapter registry/factory should support adding adapters with bounded change surface.

### Reliability
- Unsupported adapters fail clearly.
- Translation behavior is deterministic for valid inputs.
- Malformed external payloads are handled safely.

### Security
- Adapter configs avoid secret-value storage.
- Error surfaces avoid credential and stack-trace leakage.
- Request-time reconfiguration attacks are rejected.

### Maintainability
- Adapters stay thin and single-purpose.
- External standard changes are isolated to adapter layer updates.

---

## 9. Implementation Notes (Language-Agnostic)

### Recommended Patterns
- Use explicit adapter interfaces with registry/factory binding.
- Keep adapter-specific config schema separate from runtime config schema.
- Include contract conformance tests for both gateway-side and model-side translations.
- Keep adapter modules stateless where feasible.

### Design Considerations
- Support both explicit adapter modules and integrated boundary normalizers only if boundaries remain clear.
- Keep adapter naming and runtime selection deterministic and auditable.
- Preserve backward compatibility policy via adapter replacement rather than component branching.

### Anti-Patterns to Avoid
- Embedding provider/client protocol details directly in core components.
- Silent fallback adapter resolution.
- Per-request adapter or provider switching via payload metadata.
- Adapter modules owning business/domain logic.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `docs/ai/models.md`:
  - provider-specific details stay in adapters.
  - provider/model swaps are config and preference driven.
- `docs/ai/configuration.md`:
  - runtime config, adapter config, preferences remain distinct.
  - startup includes adapter-config phase.
- `docs/ai/compliance-matrix.md`:
  - `E-03`, `MO-02`, `MO-03`, `C-01`, `C-02`, `C-03`, `D-06` are captured.
- `docs/ai/failure-patterns.md`:
  - config-layer collapse and provider logic leakage are represented as drift categories.

### Documented Discrepancies To Reconcile
1. **Gateway adapter explicitness**
   - Human adapter spec describes two adapters.
   - Implementation evidence now includes explicit gateway adapter modules under `build/adapters/` and explicit model adapter modules.
2. **Secret reference naming**
   - Human adapter examples use `api_key_ref`.
   - Current implementation and blueprint artifacts use `api_key_env`.
3. **Thin-adapter ideal vs transitional logic**
   - Adapter spec emphasizes one-job translation.
   - Current adapter factory includes legacy model-binding fallback behavior.

### Rebuild Guidance When Sources Diverge
- Preserve adapter boundary invariants with explicit gateway and model adapter module paths as the canonical implementation shape.
- Keep secret reference semantics consistent while allowing key-name alias mapping where required.
- Keep transitional fallback logic documented and bounded, not silently expanded.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- `adapter-spec.md`:
  - adapters are translation pattern within existing APIs.
  - adapter swaps absorb external-standard change.
- `models-spec.md`:
  - provider-specific model interactions remain adapter-contained.
- `configuration-spec.md`:
  - adapter config is separate layer from runtime config and preferences.
- `foundation-spec.md`:
  - adapter pattern does not alter component/API counts.

### Documented Discrepancies To Reconcile
1. **Two-adapter architecture vs current module layout**
   - Architecture defines Gateway API adapter and Model API adapter.
   - Current codebase now includes explicit modules for both Gateway and Model adapter domains.
2. **`api_key_ref` vs `api_key_env` nomenclature**
   - Human docs use reference-oriented generic naming.
   - Runtime evidence standardizes env-key naming.
3. **Adapter statelessness ideal**
   - Human docs emphasize stateless translator.
   - Runtime adapter binding currently includes legacy preference fallback branching.

### Rebuild Guidance When Sources Diverge
- Treat human boundary ownership as normative.
- Treat current module shape as implementation evidence, not architecture limit.
- Preserve adapter thinness target and isolate any non-translation fallback logic behind explicit policy documentation.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| ADP-CF-001 | Human docs define two adapters (Gateway + Model); prior implementation evidence had explicit model adapters only | Resolved by implementing explicit gateway adapter modules and wiring them as primary runtime path | Aligns implementation with two-adapter architecture intent and reduces ownership-drift risk | N/A (resolved) |
| ADP-CF-002 | Human examples use `api_key_ref`; implementation uses `api_key_env` | Canonicalize secret-reference behavior with `api_key_env` in blueprints, allow alias mapping documentation if needed | Keeps machine-checkable consistency with current runtime | Config drift and onboarding confusion |
| ADP-CF-003 | Human docs emphasize stateless thin translators; implementation includes legacy model fallback logic in adapter selection | Keep thin-translation principle as MUST and treat fallback logic as transitional bounded behavior | Maintains architecture target without denying current evidence | Adapter layer grows into policy/business logic |
| ADP-CF-004 | Adapter concept spans two APIs, but Model-API and Gateway-API artifacts already define contract details | Keep Adapter artifact focused on translation/swap governance; keep payload-level details in API artifacts | Avoids duplicate contract ownership | Conflicting requirements across artifacts |
| ADP-CF-005 | Configuration forbids request-time reconfiguration; some client metadata paths can carry extra fields | Keep strict request-time adapter/runtime config prohibition as invariant | Prevents hidden control channels | Security and behavior drift via metadata abuse |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST
- `ADP-MUST-001`: Adapter boundary MUST remain a pattern within existing APIs, not a component or additional API.
- `ADP-MUST-002`: Adapter selection MUST come from runtime configuration, not request payloads.
- `ADP-MUST-003`: Unsupported adapter selection MUST fail clearly with no silent fallback.
- `ADP-MUST-004`: Provider-specific model protocol logic MUST remain adapter-confined.
- `ADP-MUST-005`: Gateway-side external-standard translation MUST preserve Gateway contract boundaries and MUST NOT absorb conversation/auth ownership.
- `ADP-MUST-006`: Runtime config, adapter config, and preferences MUST remain distinct layers.
- `ADP-MUST-007`: Adapter config MUST reference secrets indirectly and MUST NOT store raw secret values.
- `ADP-MUST-008`: Same-provider model swap MUST remain preference-level.
- `ADP-MUST-009`: Provider swap MUST remain adapter/runtime-config-level without unrelated component rewrites.
- `ADP-MUST-010`: Internal contracts MUST remain stable while adapters absorb external standard changes.
- `ADP-MUST-011`: Adapter error handling MUST map failures to safe classified surfaces.
- `ADP-MUST-012`: Request payloads MUST NOT act as hidden adapter/runtime reconfiguration channels.
- `ADP-MUST-013`: Startup readiness MUST include deterministic adapter-config loading before ready state.
- `ADP-MUST-014`: Adapter changes MUST NOT alter four-component/two-API architecture invariants.

### SHOULD
- `ADP-SHOULD-001`: Implementations SHOULD keep adapters stateless and single-purpose.
- `ADP-SHOULD-002`: Implementations SHOULD provide explicit gateway-adapter modules or equivalent clearly isolated normalization boundaries.
- `ADP-SHOULD-003`: Implementations SHOULD run adapter swap-path tests in CI.

### MAY
- `ADP-MAY-001`: Implementations MAY support multiple adapters per API domain.
- `ADP-MAY-002`: Implementations MAY allow temporary compatibility branches in adapter selection if explicitly bounded and documented.

## 14. Acceptance Gates (Pass/Fail)

- `ADP-GATE-01 Contract Gate`: Pass if adapter interfaces validate against `contracts/Adapter.schema.json`; fail otherwise.
- `ADP-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Adapter-conformance.md` pass (14 positive + 14 negative); fail on any `ADP-MUST-*` failure.
- `ADP-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Adapter-drift-guard.md` pass; fail on any Critical check failure.
- `ADP-GATE-04 Swap Gate`: Pass if adapter-driven swap paths satisfy `ADP-MUST-008` and `ADP-MUST-009`.
- `ADP-GATE-05 Boundary Gate`: Pass if adapter changes do not add components/APIs or move ownership into adapter layer.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| ADP-MUST-001 | Human `adapter-spec.md`, `foundation-spec.md`; AI matrix `F-02` | `ADP-T001P`, `ADP-T001N` |
| ADP-MUST-002 | Human `configuration-spec.md`; AI matrix `C-02` | `ADP-T002P`, `ADP-T002N` |
| ADP-MUST-003 | Human `configuration-spec.md`; AI checklist `configuration-review.md` | `ADP-T003P`, `ADP-T003N` |
| ADP-MUST-004 | Human `models-spec.md`, `adapter-spec.md`; AI matrix `E-03`, `MO-01` | `ADP-T004P`, `ADP-T004N` |
| ADP-MUST-005 | Human `adapter-spec.md`, `gateway-spec.md`; AI `gateway.md` and client contract docs | `ADP-T005P`, `ADP-T005N` |
| ADP-MUST-006 | Human `configuration-spec.md`; AI matrix `C-01` | `ADP-T006P`, `ADP-T006N` |
| ADP-MUST-007 | Human `configuration-spec.md`, `security-spec.md`; AI matrix `C-03` | `ADP-T007P`, `ADP-T007N` |
| ADP-MUST-008 | Human `adapter-spec.md`, `models-spec.md`; AI matrix `MO-02` | `ADP-T008P`, `ADP-T008N` |
| ADP-MUST-009 | Human `adapter-spec.md`; AI matrix `MO-03` | `ADP-T009P`, `ADP-T009N` |
| ADP-MUST-010 | Human `adapter-spec.md` D139; AI `models.md` | `ADP-T010P`, `ADP-T010N` |
| ADP-MUST-011 | Human `security-spec.md`, `gateway-engine-contract.md`; AI matrix `GC-03`, `S-01` | `ADP-T011P`, `ADP-T011N` |
| ADP-MUST-012 | Human `configuration-spec.md`; AI matrix `C-02`, `GC-01` | `ADP-T012P`, `ADP-T012N` |
| ADP-MUST-013 | Human `configuration-spec.md`; AI matrix `D-06` | `ADP-T013P`, `ADP-T013N` |
| ADP-MUST-014 | Human `foundation-spec.md`; AI matrix `F-01`, `F-02`, `CU-02` | `ADP-T014P`, `ADP-T014N` |

## 16. Residual Risks & Open Decisions

- `ADP-RISK-001 (Low)`: Gateway adapter modules can still accumulate non-translation logic unless boundary tests remain enforced.
- `ADP-RISK-002 (Medium)`: Transitional model fallback logic in adapter selection can blur thin-adapter boundaries.
- `ADP-RISK-003 (Low)`: Secret-reference key naming inconsistencies (`api_key_ref` vs `api_key_env`) can cause config confusion.
- `ADP-RISK-004 (Low)`: Adapter swap tests may be skipped in small deployments, masking future lock-in.
- `ADP-DECISION-OPEN-001`: Closed for current runtime profile: gateway adapter is explicit module path.
- `ADP-DECISION-OPEN-002`: Define deprecation schedule for transitional fallback branches in adapter selection.

## Related Blueprint Artifacts

- `Gateway-API` defines client-facing payload/event contracts that gateway-side adapters translate:
  - `blueprints/Gateway-API.md`
  - `blueprints/contracts/Gateway-API.schema.json`
  - `blueprints/tests/Gateway-API-conformance.md`
  - `blueprints/drift/Gateway-API-drift-guard.md`
  - `blueprints/prompts/implement-Gateway-API.md`
- `Model-API` defines model-facing payload contracts that model-side adapters translate:
  - `blueprints/Model-API.md`
  - `blueprints/contracts/Model-API.schema.json`
  - `blueprints/tests/Model-API-conformance.md`
  - `blueprints/drift/Model-API-drift-guard.md`
  - `blueprints/prompts/implement-Model-API.md`
- `Configuration` defines runtime and adapter config layering and startup order:
  - `blueprints/Configuration.md`
  - `blueprints/contracts/Configuration.schema.json`
  - `blueprints/tests/Configuration-conformance.md`
  - `blueprints/drift/Configuration-drift-guard.md`
  - `blueprints/prompts/implement-Configuration.md`
- `Models` defines model-boundary ownership and swap policy context:
  - `blueprints/Models.md`
  - `blueprints/contracts/Models.schema.json`
  - `blueprints/tests/Models-conformance.md`
  - `blueprints/drift/Models-drift-guard.md`
  - `blueprints/prompts/implement-Models.md`
- Overlap precedence:
  - payload-shape conflicts resolve to specific API artifacts; translation/swap-governance conflicts resolve to `Adapter`.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/base.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/gateway-base.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/gateway.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/gateway-openai-compatible.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/index.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/openai-compatible.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/openai-compatible.json`
  - `/home/hex/Project/PAA-MVP-Prod/build/gateway/server.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/config.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/test/provider-config.test.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/test/gateway.test.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/test/runtime.test.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 10 (`adapter_boundary_profile`, `adapter_registry_entry`, `adapter_selection_policy`, `gateway_api_adapter_profile`, `model_api_adapter_profile`, `adapter_translation_policy`, `adapter_config_profile`, `adapter_swap_policy`, `adapter_error_policy`, `adapter_runtime_constraints`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 5/5 resolved
- Unresolved ambiguity list:
  - none.
- Final readiness rating: Conditionally Ready
