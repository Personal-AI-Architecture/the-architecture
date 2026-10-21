# Configuration Boundary Blueprint Specification

## 1. Overview

### Purpose
Configuration defines how runtime truth is split across environment bootstrap, adapter wiring, owner preferences, and request metadata so the system stays portable, secure, and swappable.

### High-Level Responsibilities
- Keep runtime config, adapter config, and preferences separate by ownership and lifecycle.
- Define deterministic startup order before runtime is considered ready.
- Prevent request payloads from becoming hidden configuration channels.
- Keep secrets reference-only in config surfaces.
- Preserve config-only swap paths (model, provider, tool availability) without code edits.
- Read environment facts once at startup and the owner's model choice on every message.
- Keep the merge order Architecture -> Implementation -> Owner, with the owner's choice final.

### System Context
- Configuration is a cross-cutting boundary, not a standalone component.
- Configuration influences Gateway, Agent Loop, Auth, Memory, Tools, and model adapters.
- Configuration participates directly in startup-readiness and anti-lock-in guarantees.

---

## 2. Scope Definition

### What Configuration **is**
- The architecture boundary for where each config category lives and how it is loaded.
- The owner of startup sequencing for runtime readiness.
- The owner of rules for what can change via config vs code.
- The owner of configuration anti-drift controls (`C-01`, `C-02`, `C-03`, `D-06`).

### What Configuration **is not**
- Not component business logic.
- Not request-time workflow logic.
- Not client API behavior.
- Not tool policy enforcement itself (it carries configuration that other boundaries enforce).
- Not permissions. Who may do what, including any approval rules, lives only in Auth.
- Not secrets. Secrets live outside Memory and outside anything git tracks; config holds only references to them.
- Not the bootstrap prompt. That seed is Agent Loop configuration, not runtime config and not a preference.
- Not provider protocol translation (adapters own translation behavior).

### Boundaries and Constraints
- Runtime config remains thin and environment-owned.
- Preferences remain owner-owned and memory-resident.
- Adapter config remains provider-specific and secret-reference-only.
- Request payloads cannot override runtime/provider/tool bootstrap decisions.
- No layer sits above the owner: a product default or an architecture default never overrides the owner's choice on the owner's own hardware.

---

## 3. Core Concepts & Terminology

### Key Concepts
- **Runtime config**: what exists in this deployment environment.
- **Adapter config**: provider-specific connection and model defaults.
- **Preferences**: owner choices stored in Memory.
- **Tool source**: discovery entry identifying where capabilities are loaded.
- **Startup readiness**: deterministic sequence completion before accepting full runtime work.
- **Config-only swap**: provider/model/tool changes requiring configuration changes only.

### Internal vs External Concepts
- **Internal**
  - startup phase events
  - model-binding resolution
  - strict schema validation
- **External**
  - secret locations outside Memory and outside git (environment variables, an untracked config file, or a secret store)
  - provider endpoints
  - deployment bind posture

### Terminology
- **Config layer collapse**: runtime + adapter + preferences + secrets merged into one shape.
- **Hidden config channel**: request metadata carrying provider/runtime/tool overrides.
- **Thin bootstrap**: minimal runtime file containing deployment facts, not owner preferences.
- **Merge order**: Architecture defaults, then Implementation (product) defaults, then Owner choices. The owner wins.

---

## 4. Interfaces & Contracts

### 4.1 Canonical Contract Pack
- Schema file: `build/blueprints/configuration/contract-pack.json`
- Contract interfaces:
  - `runtime_config`
  - `adapter_config`
  - `preferences`
  - `tool_source_entry`
  - `startup_phase_event`
  - `gateway_message_metadata`
  - `model_binding_resolution`
  - `configuration_error`

### 4.2 `runtime_config`
- Required fields:
  - `memory_root: string`
  - `provider_adapter: string`
  - `auth_mode: enum(local-owner|local|managed)`
  - `tool_sources: string[]`
- Optional fields: none. The canonical schema rejects unknown fields (`additionalProperties: false`).
- Forbidden fields:
  - `model`, `default_model`, `api_key`, `api_key_env`, `approval_mode`, `base_url`
  - any permission or approval rule (these live only in Auth)
- Error shape:
  - pre-stream/startup: `configuration_error` (`invalid_runtime_config`)
  - mid-stream: runtime config mutation attempts rejected as invalid request; no rebind in active request
- Valid example:
```json
{
  "memory_root": "./your-memory",
  "provider_adapter": "openai-compatible",
  "auth_mode": "local-owner",
  "tool_sources": [
    "memory-tools/file-ops/server.ts",
    "builtin/auth-tools",
    "builtin/memory-tools"
  ]
}
```
- Invalid example:
```json
{
  "memory_root": "./your-memory",
  "provider_adapter": "openai-compatible",
  "auth_mode": "local-owner",
  "tool_sources": ["memory-tools/file-ops/server.ts"],
  "default_model": "gpt-4.1",
  "api_key": "sk-raw"
}
```
- Why invalid: forbidden preference and secret fields in runtime config.

### 4.3 `adapter_config`
- Required fields:
  - `base_url: uri`
  - `model: string`
  - `api_key_env: UPPERCASE_ENV_NAME` (a reference by name; the value can come from an environment variable, an untracked config file, or a secret store)
- Optional fields:
  - `request_timeout_ms`
- Forbidden fields:
  - `api_key`, `token`, `password`, `secret_value`
- Error shape:
  - pre-stream/startup: `configuration_error` (`invalid_adapter_config` or `unsupported_provider_adapter`)
  - mid-stream: no adapter switch via request payload
- Valid example:
```json
{
  "base_url": "https://openrouter.ai/api/v1",
  "model": "openai/gpt-4o-mini",
  "api_key_env": "OPENROUTER_API_KEY"
}
```
- Invalid example:
```json
{
  "base_url": "https://openrouter.ai/api/v1",
  "model": "openai/gpt-4o-mini",
  "api_key": "sk-live"
}
```
- Why invalid: raw secret value is forbidden.

### 4.4 `preferences`
- Required fields:
  - `default_model: string` (the owner's model choice, read on every message)
- Optional fields:
  - `always_send_tools: string[]`
  - `verbose_logging: boolean`
- Forbidden fields:
  - runtime/adapter ownership fields (`provider_adapter`, `base_url`, `api_key_env`, `memory_root`, `tool_sources`, `auth_mode`)
  - permissions and approval rules, including `approval_mode` (these live only in Auth)
  - secrets by value
- Error shape:
  - pre-stream/startup: `configuration_error` (`invalid_preferences`)
  - mid-stream: request payload cannot redefine preferences
- Valid example:
```json
{
  "default_model": "llama3.1",
  "always_send_tools": ["memory_read", "memory_search"]
}
```
- Invalid example:
```json
{
  "default_model": "llama3.1",
  "approval_mode": "ask-on-write",
  "provider_adapter": "openai-compatible"
}
```
- Why invalid: preferences cannot carry runtime ownership fields or approval rules.

### 4.5 `tool_source_entry`
- Required shape:
  - non-empty string discovery key
- Optional/Defaults: none
- Forbidden behavior:
  - unknown tool source accepted silently
- Error shape:
  - pre-stream/startup: `configuration_error` (`invalid_runtime_config`)
- Valid example:
```json
"builtin/auth-tools"
```
- Invalid example:
```json
""
```
- Why invalid: empty source identifier.

### 4.6 `startup_phase_event`
- Required fields:
  - `event` const `startup.phase`
  - `phase` enum: `runtime-config`, `adapter-config`, `tools`, `memory`, `preferences`, `ready`
  - `timestamp` date-time
- Optional fields:
  - `correlation_id`
- Forbidden behavior:
  - out-of-order ready-state declaration
- Error shape:
  - startup gate fails with `startup_sequence_error` when order is violated
- Valid example:
```json
{
  "event": "startup.phase",
  "phase": "adapter-config",
  "timestamp": "2026-03-20T13:00:00Z"
}
```
- Invalid example:
```json
{
  "event": "startup.phase",
  "phase": "ready"
}
```
- Why invalid: missing timestamp and incomplete readiness chain.

### 4.7 `gateway_message_metadata`
- Required fields: none
- Optional fields:
  - `client: string`
- Forbidden fields:
  - `provider`, `provider_adapter`, `model`, `base_url`, `api_key`, `api_key_env`, `tool_sources`, `tool_definitions`, `auth_mode`, `memory_root`, `approval_mode`, `conversation_store`, `bind_address`, `port`, `safety_iteration_limit`
- Error shape:
  - pre-stream: `configuration_error` (`forbidden_request_metadata`) returned as invalid request
  - mid-stream: not applicable; request should be rejected before stream start
- Valid example:
```json
{
  "client": "paa-cli"
}
```
- Invalid example:
```json
{
  "client": "paa-cli",
  "provider": "openrouter",
  "tool_sources": ["/tmp/tools"]
}
```
- Why invalid: request payload attempts hidden runtime reconfiguration.
- The model choice is not client metadata. The Gateway reads it from preferences on every message and passes it to the Agent Loop as its own request value.

### 4.8 `model_binding_resolution`
- Required fields:
  - `adapter_name`, `adapter_model`, `preference_model`, `resolved_model`
  - `resolution_reason` enum `use_preference | use_adapter_default | legacy_bootstrap_fallback`
- Optional fields: none
- Forbidden behavior:
  - undocumented silent fallback behavior
- Error shape:
  - binding failure reported through `configuration_error`; if the chosen model is not available through the loaded adapter, the owner is told rather than silently switched
- Valid example:
```json
{
  "adapter_name": "openai-compatible",
  "adapter_model": "openai/gpt-4o-mini",
  "preference_model": "openai/gpt-4o-mini",
  "resolved_model": "openai/gpt-4o-mini",
  "resolution_reason": "use_preference"
}
```
- Invalid example:
```json
{
  "adapter_name": "openai-compatible",
  "resolved_model": "openai/gpt-4o-mini"
}
```
- Why invalid: missing required binding provenance fields.

### 4.9 `configuration_error`
- Required fields:
  - `code` enum: `invalid_runtime_config`, `invalid_adapter_config`, `invalid_preferences`, `unsupported_provider_adapter`, `startup_sequence_error`, `forbidden_request_metadata`, `secret_in_config`
  - `message`
- Optional fields:
  - `field`, `status`
- Forbidden behavior:
  - leaking secrets in error text
- Pre-stream vs mid-stream:
  - primarily pre-stream/startup, or request validation before stream
  - mid-stream config mutation is rejected by boundary rules and should not become dynamic rebind behavior
- Valid example:
```json
{
  "code": "unsupported_provider_adapter",
  "message": "Unsupported provider adapter: unsupported-adapter",
  "status": 503
}
```
- Invalid example:
```json
{
  "code": "unsupported_adapter",
  "message": "OPENROUTER_API_KEY=sk-live-..."
}
```
- Why invalid: unsupported code and secret leakage.

### 4.10 Communication Patterns
- Startup-time synchronous config loads and validation.
- Request-time synchronous metadata validation at Gateway boundary.
- Runtime consumption of resolved config by adapters and tool discovery, not request-level overrides.
- Per-message read of the owner's model choice from preferences by the Gateway.

---

## 5. Behavior Specification

### 5.1 Deterministic Boot Sequence
1. Load runtime config.
2. Load adapter config using runtime `provider_adapter`.
3. Discover tools from `tool_sources`.
4. Ensure memory layout and mount memory root.
5. Read preferences from memory.
6. Mark startup ready.

### 5.2 Model Binding Resolution
1. Adapter config supplies provider endpoint and default model; it is loaded at startup.
2. On every message, the Gateway reads the owner's current model choice from preferences in Memory.
3. Resolver selects the effective model deterministically: owner choice, then product default, then adapter default.
4. The resolved model travels with the request to the Agent Loop, which calls the model through the loaded adapter.
5. A changed model choice applies to the next message, with no restart and no code change.
6. If the chosen model is not available through the loaded adapter, the owner is told rather than silently switched.

### 5.3 Request-Path Configuration Behavior
- Client request metadata is validated strictly.
- Metadata cannot change provider, model, tool sources, auth mode, or memory root. The model choice comes from preferences, not from metadata.
- Invalid metadata fails pre-stream with safe invalid request response.

### 5.4 Secret Handling Behavior
- Adapter config carries only secret reference key (`api_key_env`).
- Secret value is read at runtime from wherever the deployment keeps secrets: an environment variable, an untracked config file (such as a gitignored `.env`), or a secret store.
- Raw secret values are rejected from runtime, adapter, and preference surfaces, from Memory, and from any file git tracks.

### 5.4a Merge Order
- Defaults merge in a fixed order: Architecture -> Implementation (product) -> Owner.
- An owner choice always wins. No product rule or environment rule overrides the owner on the owner's own hardware.
- Permissions are not merged here; they live only in Auth.

### 5.5 Startup Failure Behavior
- Invalid runtime/adapter/preferences shapes fail clearly.
- Unsupported adapter key fails clearly.
- Out-of-order startup phases fail readiness.
- Runtime does not claim ready before required phases complete.

### 5.6 State Management
- Durable:
  - runtime config file
  - adapter config file
  - memory preferences file
- Ephemeral:
  - resolved startup context
  - model binding resolution per message

### 5.7 Edge Cases
- Missing required fields fail validation; there is no optional runtime-config extension point.
- Unknown tool source is hard failure, not silent skip.
- Bind address and port are deployment concerns, not runtime configuration fields.
- Legacy bootstrap model behavior must be explicitly documented in binding resolution.
- Changing runtime config, adapter config or installed tools may need a restart (or hot-reload); a model change never does.

---

## 6. Dependencies & Interactions

### External Dependencies
- Secret access for adapter credentials (environment variable, untracked config file, or secret store).
- Provider endpoints referenced via adapter config.

### Internal Dependencies
- Gateway startup path and request validation.
- Adapter factory for provider binding.
- Tool discovery loader.
- Memory preferences/auth-state bootstrap.

### Data Flow
1. Runtime config selects adapter and tool sources.
2. Adapter config provides provider connection details.
3. Preferences provide owner choices (not permissions).
4. Gateway and Agent Loop consume resolved startup state.
5. On every message, the Gateway reads the owner's model choice and passes it to the Agent Loop.

### Dependency Assumptions
- Config files are readable and schema-valid.
- Memory root is writable for bootstrap files.
- Secret references resolve at runtime when needed.

---

## 7. Invariants & Rules

### Invariants
- Configuration layers remain separate by ownership (`runtime`, `adapter`, `preferences`).
- Request payload is never treated as authoritative runtime config.
- Secret values are reference-only in configuration artifacts.
- Startup order is deterministic and auditable.
- Swap operations remain config-driven.
- The owner's model choice is read on every message.
- No permission or approval rule appears in any configuration layer.
- Owner choices win over product and architecture defaults.

### Validation Logic
- Validate all config file shapes before runtime readiness.
- Validate forbidden fields in request metadata.
- Validate startup phase ordering.
- Validate swap paths through conformance tests.

---

## 8. Non-Functional Requirements

### Performance
- Environment facts load once at startup with low overhead; the per-message model-choice read must stay cheap.
- Request validation must remain lightweight.

### Scalability
- Config taxonomy must support additional adapters/tools without structural collapse.
- Startup sequence should remain deterministic as sources grow.

### Reliability
- Startup failures must be explicit and actionable.
- Runtime must not run partially initialized.

### Security
- Secrets are never persisted by value in Memory or in any file git tracks.
- Metadata-based reconfiguration attacks are rejected early.
- Localhost-first posture is preserved unless explicit deployment override is present.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **Schema-first loaders** for each configuration class.
- **Explicit startup phase state machine** for readiness gating.
- **Layered resolver** for effective model binding.
- **Strict metadata gate** to block config side channels.

### Design Considerations
- Keep runtime config minimal and environment-factual.
- Keep preference storage owner-editable and memory-resident.
- Keep adapter config provider-specific and secret-reference-only.
- Keep swap behavior testable with no code edits.

### Anti-Patterns to Avoid
- One merged config loader for all concerns.
- Provider/model override through request metadata.
- Secret-by-value fields in tracked files.
- Ready-state before memory/preferences bootstrap.
- Hardcoded provider selection in runtime code.
- Model fixed at startup, or a model change that needs a restart.
- Permissions or approval modes stored in preferences or config.
- "Environment safety" or product rules that override the owner.

---

## 10. Validation Against AI Primer (`build/primers`)

### Confirmed Alignments
- `C-01`: runtime/adapter/preferences separation.
- `C-02`: request payload not a hidden config channel.
- `C-03`: secrets reference-only, not by value in tracked files or memory.
- `MO-02`: same-provider model swap through preference change, applied on the next message.
- `E-05`: the model travels with each request.
- `E-06`: the bootstrap prompt is Agent Loop configuration.
- `C-04`: no permissions in configuration or preferences.
- `C-05`: merge order ends with the owner, and the owner wins.
- `MO-03`: provider swap through adapter/runtime config changes.
- `D-06`: deterministic startup order.
- `D-07`: day-one startup readiness surfaces.

### Primer/Implementation Tensions
- Deployment guidance owns bind posture; runtime configuration remains limited to the four canonical fields.
- Primer describes pure preference ownership for model choice; current runtime keeps a documented legacy bootstrap fallback for compatibility.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Three-category configuration model (preferences, runtime bootstrap, tool self-description).
- Thin runtime bootstrap principle.
- Adapter config as provider-specific layer.
- Anti-lock-in swap philosophy and config-only swaps.

### Documented Discrepancies To Reconcile
1. **Secret reference naming**
   - Human examples use `api_key_ref`.
   - Current implementation uses `api_key_env`.
2. **Bind posture examples**
   - Human/primer posture favors localhost-first defaults.
   - Deployment guidance may specify explicit non-localhost bind outside runtime configuration.
3. **Model binding transition behavior**
   - Human docs expect preference-driven selection.
   - Runtime includes documented legacy fallback behavior to preserve migration compatibility.

### Rebuild Guidance When Sources Diverge
- Keep ownership boundaries and anti-lock-in criteria authoritative.
- Treat operational extensions as optional, not ownership-breaking.
- Preserve secret-reference and startup-order invariants regardless of naming differences.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| CFG-CF-001 | Human docs and the canonical schema define exactly four runtime fields | Keep the runtime contract exactly four fields; place deployment, persistence, and loop tuning elsewhere | Keeps the bootstrap portable and makes schema validation authoritative | Implementers may reintroduce operational fields and create non-portable config |
| CFG-CF-002 | Human adapter examples use `api_key_ref`; runtime uses `api_key_env` | Normalize on reference-by-name semantics; treat field-name differences as alias-level implementation detail | Maintains security invariant without forcing naming lock-in | Teams may fragment adapter config contracts by naming drift |
| CFG-CF-003 | Localhost-first posture in architecture vs explicit bind overrides in deployment samples | Keep localhost default mandatory when unspecified; allow explicit deployment override | Aligns deployment flexibility with secure default posture | Accidental exposure from permissive defaults |
| CFG-CF-004 | Preference-driven model selection vs runtime legacy bootstrap fallback | Keep preference-first as normative, document fallback as temporary compatibility path | Enables migration without immediate breaking behavior | Hidden fallback can mask misconfiguration and delay cleanup |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `CFG-MUST-001`: Runtime config, adapter config, and preferences MUST remain distinct layers.
- `CFG-MUST-002`: Request payload metadata MUST NOT become a hidden configuration channel.
- `CFG-MUST-003`: Secrets MUST be referenced and MUST NOT be stored by value in Memory or tracked config.
- `CFG-MUST-004`: Runtime config MUST remain thin and environment-owned; owner preference fields MUST NOT appear there.
- `CFG-MUST-005`: Adapter config MUST contain provider-specific connection data and secret references only.
- `CFG-MUST-006`: Preferences MUST remain owner-owned data in Memory.
- `CFG-MUST-007`: Startup MUST follow deterministic sequence: runtime-config -> adapter-config -> tools -> memory -> preferences -> ready.
- `CFG-MUST-008`: Startup MUST fail clearly on invalid or unsupported configuration.
- `CFG-MUST-009`: Tool discovery MUST be driven by runtime `tool_sources` and reject unknown sources clearly.
- `CFG-MUST-010`: Same-provider model swaps MUST require preference change only.
- `CFG-MUST-011`: Provider swaps MUST require adapter/runtime config changes only (no unrelated component code edits).
- `CFG-MUST-012`: Bind posture MUST be localhost-first by default unless explicitly overridden by deployment config.
- `CFG-MUST-013`: Startup readiness MUST include day-one availability of auth state bootstrap, conversation persistence path, and export-capable memory surface.
- `CFG-MUST-014`: Anti-lock-in provider/model/tool swap checks MUST pass with config-only changes.
- `CFG-MUST-015`: The owner's model choice MUST be read on every message, so a change applies to the next message with no restart.
- `CFG-MUST-016`: Permissions and approval rules MUST NOT appear in runtime config, adapter config, or preferences; they live only in Auth.
- `CFG-MUST-017`: Defaults MUST merge Architecture -> Implementation -> Owner, and no layer MAY override the owner's choice.
- `CFG-MUST-018`: The bootstrap prompt MUST be Agent Loop configuration, not runtime config, not a preference, and not part of the Gateway request.

### SHOULD

- `CFG-SHOULD-001`: Configuration loaders SHOULD emit structured startup phase events for auditability.
- `CFG-SHOULD-002`: Model-binding resolution SHOULD be observable and deterministic.
- `CFG-SHOULD-003`: Optional operational runtime fields SHOULD stay additive and must not absorb preference ownership.

### MAY

- `CFG-MAY-001`: Implementations MAY support additional auth modes when ownership boundaries remain unchanged.
- `CFG-MAY-002`: Implementations MAY add adapter-specific optional fields as long as provider translation and secret-reference invariants hold.

## 14. Acceptance Gates (Pass/Fail)

- `CFG-GATE-01 Contract Gate`: Pass if interfaces validate against `build/blueprints/configuration/contract-pack.json`; fail otherwise.
- `CFG-GATE-02 Conformance Gate`: Pass if all vectors in `build/blueprints/configuration/tests.md` pass (18 positive + 18 negative); fail on any `CFG-MUST-*` failure.
- `CFG-GATE-03 Drift Gate`: Pass if all Critical checks in `build/blueprints/configuration/drift-guard.md` pass; fail on any Critical check failure.
- `CFG-GATE-04 Startup Gate`: Pass if deterministic startup order and readiness surfaces are present before runtime acceptance.
- `CFG-GATE-05 Conflict Gate`: Pass if no unresolved High-risk conflicts remain in Configuration conflict register.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| CFG-MUST-001 | Human `configuration-spec.md`; AI matrix `C-01` | `CFG-T001P`, `CFG-T001N` |
| CFG-MUST-002 | Human `configuration-spec.md`, `gateway-agent-loop-contract.md`; AI matrix `C-02`, `GC-01` | `CFG-T002P`, `CFG-T002N` |
| CFG-MUST-003 | Human `configuration-spec.md`; AI matrix `C-03` | `CFG-T003P`, `CFG-T003N` |
| CFG-MUST-004 | Human `configuration-spec.md` (thin bootstrap); AI `configuration.md` | `CFG-T004P`, `CFG-T004N` |
| CFG-MUST-005 | Human `adapter-spec.md`, `configuration-spec.md`; AI `configuration.md` | `CFG-T005P`, `CFG-T005N` |
| CFG-MUST-006 | Human `configuration-spec.md` (preferences in memory); AI `configuration.md` | `CFG-T006P`, `CFG-T006N` |
| CFG-MUST-007 | Human `configuration-spec.md` boot sequence; AI matrix `D-06` | `CFG-T007P`, `CFG-T007N` |
| CFG-MUST-008 | Human `configuration-spec.md`; runtime readiness guidance in AI `build-sequence.md` | `CFG-T008P`, `CFG-T008N` |
| CFG-MUST-009 | Human `configuration-spec.md`, `tools-spec.md`; AI `configuration.md`, matrix `T-03` | `CFG-T009P`, `CFG-T009N` |
| CFG-MUST-010 | Human `models-spec.md`, `adapter-spec.md`; AI matrix `MO-02` | `CFG-T010P`, `CFG-T010N` |
| CFG-MUST-011 | Human `models-spec.md`, `adapter-spec.md`; AI matrix `MO-03` | `CFG-T011P`, `CFG-T011N` |
| CFG-MUST-012 | Human `deployment-spec.md`, `configuration-spec.md`; AI matrix `D-03`, checklist guidance | `CFG-T012P`, `CFG-T012N` |
| CFG-MUST-013 | Human `configuration-spec.md`; AI matrix `D-07`, `A-05` | `CFG-T013P`, `CFG-T013N` |
| CFG-MUST-014 | Human decision `D147` in configuration/foundation docs; AI configuration and review checklist | `CFG-T014P`, `CFG-T014N` |
| CFG-MUST-015 | Human `configuration-spec.md` (model read on every message), decision `D175`; AI matrix `E-05`, `MO-02` | `CFG-T015P`, `CFG-T015N` |
| CFG-MUST-016 | Human `configuration-spec.md`, `auth-spec.md`; AI matrix `C-04` | `CFG-T016P`, `CFG-T016N` |
| CFG-MUST-017 | Human `configuration-spec.md` merge order, decision `D171`; AI matrix `C-05` | `CFG-T017P`, `CFG-T017N` |
| CFG-MUST-018 | Human `configuration-spec.md`, `agent-loop-spec.md`; AI matrix `E-06` | `CFG-T018P`, `CFG-T018N` |

## 16. Residual Risks & Open Decisions

- `CFG-RISK-001 (Medium)`: Runtime config can drift beyond thin-bootstrap intent if optional operational fields expand without guardrails.
- `CFG-RISK-002 (Medium)`: Legacy model-binding fallback may mask preference/config mismatches if not surfaced clearly.
- `CFG-RISK-003 (Low)`: Mixed secret-reference field naming across docs (`api_key_ref` vs `api_key_env`) can fragment contracts.
- `CFG-DECISION-OPEN-001`: Define sunset criteria for legacy bootstrap model fallback behavior.
- `CFG-DECISION-OPEN-002`: Standardize deployment-profile policy for safe bind overrides across local/container/hosted modes.

## Source Basis

- Human-readable architecture reference: `architecture`
- AI primer layer: ` ai`
- Implementation behavior used for blueprint fidelity:
  - `build/config.ts`
  - `build/config.json`
  - `build/adapters/index.ts`
  - `build/adapters/openai-compatible.json`
  - `build/gateway/server.ts`
  - `build/test/runtime.test.ts`
  - `build/test/provider-config.test.ts`
  - `build/test/gateway.test.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 23 total (`18 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 8 (`runtime_config`, `adapter_config`, `preferences`, `tool_source_entry`, `startup_phase_event`, `gateway_message_metadata`, `model_binding_resolution`, `configuration_error`)
- Test vectors count: 36 total (`18 positive`, `18 negative`)
- Conflicts detected/resolved: 4/4 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: timeline for removing legacy bootstrap model fallback is not yet standardized.
- Final readiness rating: Conditionally Ready

## Contract alignment

The configuration package manifest points to `contracts/schemas/configuration.json`; model selection and permission ownership are defined by the canonical contracts.
