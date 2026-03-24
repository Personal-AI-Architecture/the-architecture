# Model API Boundary Blueprint Specification

## 1. Overview

### Purpose
The Model API is the external intelligence boundary through which the Engine requests model completions and receives model output. It keeps models external and swappable.

### High-Level Responsibilities
- Define the generic internal completion contract (`messages + tools` in, normalized completion out).
- Isolate provider-specific wire protocols inside adapter implementations.
- Support same-provider model swaps through preference changes.
- Support provider swaps through adapter/runtime configuration changes.
- Preserve safe, classified error behavior at consuming boundaries.

### System Context
- Boundary type: external API boundary, not a standalone architecture component.
- Upstream caller: Engine (Agent Loop).
- Downstream targets: model providers (cloud or local endpoints) through adapters.
- Cross-cutting dependencies: runtime config, adapter config, preferences, and secret references.

### Companion Artifact
- Engine component specification: `blueprints/Engine.md`

---

## 2. Scope Definition

### What the Model API **is**
- A connector boundary between Engine and external models.
- A stable internal contract for model completion requests/responses.
- An adapter-mediated translation layer between internal and provider-native formats.
- A swappability mechanism for model/provider changes without broad code rewrites.

### What the Model API **is not**
- Not a runtime component with business ownership like Gateway/Engine/Auth/Memory.
- Not a tool subsystem or a callable tool by default.
- Not a request-time provider reconfiguration channel.
- Not a place for Gateway conversation logic or Auth policy ownership.

### Boundaries and Constraints
- Models remain external intelligence.
- Provider-specific serialization/parsing must stay in adapters.
- Request payloads must remain generic and must not contain provider/runtime config fields.
- Secret values must not be stored in tracked adapter/runtime/preference files.

---

## 3. Core Concepts & Terminology

### Key Concepts
- **Model API**: the connector contract from Engine to external models.
- **Adapter**: thin translator between internal contract and provider format.
- **Generic Completion Contract**: normalized request/response shape independent of provider.
- **Runtime Binding**: runtime-selected adapter plus preference-selected model.
- **Provider Error Surface**: safe classified failures surfaced upstream.

### Internal vs External Concepts
- **Internal**
  - `messages`, `tools`, correlation metadata.
  - normalized completion response (`assistantText`, `toolCalls`, `finishReason`).
- **External**
  - provider endpoint URLs and auth header conventions.
  - provider-native payload and response structures.

### Terminology Clarification
- Human docs may say **Provider API** in some sections and **Model API** in others.
- This blueprint treats them as the same architectural boundary, with **Model API** as canonical naming for artifacts.

---

## 4. Interfaces & Contracts

### 4.1 Public Boundary Contract Pack
Canonical schema pack: `blueprints/contracts/Model-API.schema.json`

Defined interfaces:
- `model_completion_request`
- `model_completion_response`
- `model_tool_definition`
- `model_tool_call`
- `adapter_config`
- `runtime_model_binding`
- `provider_error_surface`

### 4.2 `model_completion_request`
- Required fields:
  - `messages: CompletionMessage[]` (min 1)
  - `tools: ModelToolDefinition[]` (can be empty)
- Optional fields:
  - `metadata.correlation_id`
- Forbidden fields:
  - `provider_adapter`
  - `provider`
  - `base_url`
  - `api_key`
  - `api_key_env`
  - `model`
- Behavior:
  - Accepts only generic interaction payload, never runtime/provider selection data.

### 4.3 `model_completion_response`
- Required fields:
  - `assistantText: string`
  - `toolCalls: ModelToolCall[]`
  - `finishReason: string`
- `toolCalls[*]` required:
  - `id: string`
  - `name: string`
  - `input: object`

### 4.4 `model_tool_definition`
- Required fields:
  - `name: string`
  - `description: string`
  - `input_schema: object`

### 4.5 `adapter_config`
- Required fields:
  - `base_url: uri`
  - `model: string`
  - `api_key_env: string` (secret reference key, not the secret value)
- Forbidden fields:
  - `api_key`
  - `token`
  - `password`

### 4.6 `runtime_model_binding`
- Required fields:
  - `provider_adapter: string`
  - `default_model: string`

### 4.7 `provider_error_surface`
- Required fields:
  - `code` enum:
    - `provider_error`
    - `context_overflow`
    - `invalid_provider_response`
    - `adapter_misconfigured`
    - `provider_unavailable`
  - `message: string` (safe)
- Optional:
  - `status: integer (400-599)`
  - `provider: string`

### 4.8 Communication Patterns
- Engine -> adapter -> provider call pattern.
- Internal contract is request/response at adapter boundary.
- Engine may still stream externally to Gateway while adapter call is non-streaming internally.

### 4.9 Pre-Stream vs Mid-Stream Failure Behavior
- Pre-stream/binding failures:
  - unsupported adapter key, missing adapter config, invalid config shape.
  - fail clearly during startup/load or first call with classified configuration/provider error.
- Mid-stream/interaction failures:
  - provider timeout, invalid provider payload, rate limits, unavailable provider.
  - surfaced as classified safe errors through Engine stream error taxonomy.

### 4.10 Example Valid Payload
```json
{
  "messages": [
    { "role": "user", "content": "Summarize this plan." }
  ],
  "tools": [
    {
      "name": "memory_search",
      "description": "Search owner memory",
      "input_schema": {
        "type": "object",
        "properties": { "query": { "type": "string" } },
        "required": ["query"]
      }
    }
  ],
  "metadata": {
    "correlation_id": "corr-123"
  }
}
```

### 4.11 Example Invalid Payload
```json
{
  "messages": [
    { "role": "user", "content": "hello" }
  ],
  "tools": [],
  "provider_adapter": "openai-compatible",
  "api_key": "sk-raw-secret"
}
```

Why invalid:
- includes forbidden request-time reconfiguration fields.
- includes raw secret material.

---

## 5. Behavior Specification

### 5.1 Startup and Binding Sequence
1. Load runtime config (includes `provider_adapter`).
2. Load adapter config for selected adapter (`base_url`, `model`, `api_key_env`).
3. Ensure Memory and preferences are loaded.
4. Resolve model binding from adapter config + preferences (`default_model` behavior).
5. Instantiate adapter implementation.
6. Fail clearly if adapter key/config is unsupported or invalid.

### 5.2 Completion Workflow
1. Engine builds generic completion request from conversation messages and tool definitions.
2. Adapter converts generic request into provider-native payload.
3. Adapter sends provider request.
4. Adapter parses provider response.
5. Adapter normalizes response to generic `assistantText/toolCalls/finishReason`.
6. Engine continues loop using normalized output.

### 5.3 Tool-Call Roundtrip Behavior
- Tool call IDs from provider are preserved where present.
- Missing provider tool-call IDs are replaced with generated stable IDs.
- Tool-call names and argument objects are normalized to internal schema.

### 5.4 Model Swap Behavior
- Same provider:
  - update model preference or adapter model binding only.
  - no Engine/Gateway/Auth/Memory code rewrite.
- Different provider:
  - change runtime adapter key + adapter config file.
  - no unrelated component rewrite.

### 5.5 Error Behavior
- Provider/network/timeout/availability failures are classified and sanitized.
- Context/token-limit failures map to `context_overflow`.
- Misconfiguration/unsupported adapter fails clearly.
- Raw provider payloads and secrets must not leak to client-visible surfaces.

### 5.6 Edge Cases
- Empty provider body: treat as minimal response and classify if contract cannot be satisfied.
- Non-JSON provider body: classify as invalid provider response.
- Partial tool-call payloads: normalize to safe defaults or classify failure.
- Missing `api_key_env` resolution: adapter runs without auth header only when provider allows; otherwise provider failure is classified.

---

## 6. Dependencies & Interactions

### External Dependencies
- Configured model provider endpoint (cloud or local).
- Secret material referenced by environment variable names.

### Internal Dependencies
- Engine completion caller.
- Adapter factory and adapter implementations.
- Runtime config loader, adapter config loader, preferences loader.
- Error classification module for provider failure mapping.

### Data Flow
1. Runtime config chooses adapter.
2. Adapter config and preferences resolve target model.
3. Engine sends generic request.
4. Adapter translates and calls provider.
5. Adapter returns normalized output.
6. Engine emits stream events to Gateway.

### Dependency Assumptions
- Adapter contract remains stable as provider integrations evolve.
- Provider-specific standards can change without forcing cross-component rewrites.
- Offline/local provider endpoint remains a valid deployment path.

---

## 7. Invariants & Rules

### Boundary Invariants
- Models remain external intelligence (`MO-01`).
- Model API remains an external connector boundary, not a component/tool.
- Provider-specific logic is adapter-contained (`E-03`).

### Configuration Invariants
- Runtime config, adapter config, and preferences remain distinct (`C-01`).
- Request payload must not carry hidden configuration (`C-02`).
- Secrets remain referenced, not embedded (`C-03`).

### Swap Invariants
- Same-provider model swap requires preference/model-binding change only (`MO-02`).
- Provider swap requires adapter/config changes only (`MO-03`).

### Validation Rules
- Reject forbidden request fields.
- Validate adapter configuration and binding before use.
- Validate normalized response shape before returning to Engine.
- Validate safe error mapping before exposing failures upstream.

---

## 8. Non-Functional Requirements

### Performance
- Adapter translation overhead must remain minimal relative to provider latency.
- Completion path should not add avoidable serialization cycles.

### Scalability
- Support multiple provider adapters over time without core-loop rewrites.
- Support high interaction volume through stateless adapter behavior.

### Reliability
- Deterministic startup failure for unsupported/misconfigured adapters.
- Deterministic response normalization for tool-calling and non-tool-calling completions.
- Explicit behavior for malformed provider responses.

### Security
- Never persist or expose raw secrets in tracked files or safe error surfaces.
- Sanitize provider failures for client-visible channels.
- Preserve boundary so provider internals do not leak into component contracts.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **Adapter pattern** for provider-specific translation.
- **Factory pattern** for runtime adapter selection.
- **Contract-first validation** around request/response schemas.
- **Error-mapping layer** to sanitize and classify provider failures.

### Design Considerations
- Keep adapter stateless; use explicit config input.
- Keep internal contract compact and provider-neutral.
- Preserve tool-call identity continuity.
- Keep swap paths testable as configuration-only changes.

### Anti-Patterns to Avoid
- Provider SDK or wire formatting code in Engine core loop.
- Request-time model/provider overrides hidden in metadata.
- Collapsing runtime+adapter+preference config into one payload.
- Secret value storage in adapter config or preferences.
- Treating Model API as an internal tool invocation path.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `F-02`: Model API is one of exactly two external APIs.
- `E-03`: provider-specific logic belongs in adapters.
- `C-01`: runtime config, adapter config, and preferences remain distinct.
- `C-02`: request payloads are not hidden config channels.
- `C-03`: secrets are referenced, not stored by value.
- `MO-01`: models remain external intelligence.
- `MO-02`: same-provider model swaps are preference/model-binding changes.
- `MO-03`: provider swaps are adapter/runtime-config changes, not broad rewrites.
- `CU-02`: fixed external contracts remain Gateway API and Model API.

### Primer/Implementation Tightening Notes
- Current adapter call path is non-streaming provider request while Engine still emits stream events; this is acceptable for MVP but should remain implementation-detail, not contract-lock.
- Error taxonomy should keep `invalid_provider_response` and `adapter_misconfigured` distinguishable in diagnostics even if user-facing stream taxonomy is coarser.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Model boundary is external intelligence, not a component (`models-spec.md`, `foundation-spec.md`).
- Adapter is a translation boundary and swappability mechanism (`adapter-spec.md`).
- Model/provider swaps are intended to be configuration-driven.
- Model API remains connector boundary, not tool/component collapse.

### Documented Discrepancies To Reconcile
1. **Naming variation**
   - Human docs use both "Provider API" and "Model API".
   - This package uses "Model API" consistently.
2. **Streaming emphasis vs implementation**
   - Human docs emphasize streamed completion pattern.
   - Current adapter implementation calls provider with non-streaming mode and normalizes result.
3. **Secret reference field naming**
   - Human adapter examples show `api_key_ref`.
   - current implementation/schema use `api_key_env`.

### Rebuild Guidance When Sources Diverge
- Keep boundary ownership and adapter discipline from human docs as authoritative.
- Keep MVP contract shapes from primer/schema as canonical for implementation.
- Treat naming differences as alias-level documentation drift, not architectural divergence.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| MAPI-CF-001 | Human docs alternate between "Provider API" and "Model API" | Use "Model API" as canonical artifact name and map "Provider API" as equivalent alias | Keeps file set consistent with compliance matrix and current repository language | Teams may generate duplicate artifacts for same boundary |
| MAPI-CF-002 | Human docs describe streamed completion pattern; current adapter request uses non-streaming provider call | Treat streaming as boundary behavior and keep adapter transport mode implementation-flexible | Preserves architecture while allowing MVP simplification | Implementers may hardcode non-streaming behavior as permanent |
| MAPI-CF-003 | Human example uses `api_key_ref`; implementation/schema use `api_key_env` | Normalize on `api_key_env` in contract schema, document `api_key_ref` as equivalent intent | Aligns with existing config/contracts code | Secret reference semantics may fragment across adapters |
| MAPI-CF-004 | High-level docs discuss generic model swap by preference; implementation has bootstrap fallback logic | Keep requirement as preference-driven swap target and treat bootstrap fallback as temporary compatibility behavior | Maintains desired architecture outcome | Model swap path becomes ambiguous and code-coupled |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST
- `MAPI-MUST-001`: Models MUST remain external intelligence accessed only through the Model API boundary.
- `MAPI-MUST-002`: Engine MUST interact with models through adapter abstraction only.
- `MAPI-MUST-003`: Provider-specific payload translation MUST be isolated to adapter implementations.
- `MAPI-MUST-004`: Internal completion contract MUST remain generic (`messages + tools` in, normalized completion out).
- `MAPI-MUST-005`: Same-provider model swap MUST require preference/model-binding change only.
- `MAPI-MUST-006`: Provider swap MUST require adapter/runtime-config change only, not unrelated component rewrites.
- `MAPI-MUST-007`: Runtime config, adapter config, and preferences MUST remain distinct layers.
- `MAPI-MUST-008`: Request payloads MUST NOT include hidden provider/runtime reconfiguration fields.
- `MAPI-MUST-009`: Adapter config MUST reference secrets indirectly (`api_key_env` style), not store raw secret values.
- `MAPI-MUST-010`: Provider failures MUST be surfaced as safe classified errors at consuming boundaries.
- `MAPI-MUST-011`: Unsupported or misconfigured adapters MUST fail clearly.
- `MAPI-MUST-012`: Local/offline provider endpoints MUST remain supportable through adapter config.
- `MAPI-MUST-013`: Model API MUST remain a connector boundary and MUST NOT collapse into component/tool ownership.
- `MAPI-MUST-014`: Tool-call roundtrip continuity MUST preserve stable `id`, `name`, and structured input shape.

### SHOULD
- `MAPI-SHOULD-001`: Adapter implementations SHOULD remain stateless and deterministic.
- `MAPI-SHOULD-002`: Error mapping SHOULD preserve granular internal diagnostics while exposing safe external messages.
- `MAPI-SHOULD-003`: Swap-path tests SHOULD be automated as part of anti-lock-in CI gates.

### MAY
- `MAPI-MAY-001`: Providers MAY be cloud-hosted or local, as long as contract behavior is preserved.
- `MAPI-MAY-002`: Adapter implementations MAY support either streaming or non-streaming provider transport while preserving boundary contract semantics.

## 14. Acceptance Gates (Pass/Fail)

- `MAPI-GATE-01 Contract Gate`: Pass if all boundary shapes validate against `contracts/Model-API.schema.json`; fail otherwise.
- `MAPI-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Model-API-conformance.md` pass (14 positive + 14 negative); fail on any `MAPI-MUST-*` failure.
- `MAPI-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Model-API-drift-guard.md` pass; fail on any Critical check failure.
- `MAPI-GATE-04 Swap Gate`: Pass if same-provider model swap and provider swap scenarios remain config-driven; fail if code rewrites are required.
- `MAPI-GATE-05 Conflict Gate`: Pass if no unresolved High-risk conflict remains in Conflict Register.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| MAPI-MUST-001 | Human `models-spec.md`, `foundation-spec.md`; AI matrix `MO-01` | `MAPI-T001P`, `MAPI-T001N` |
| MAPI-MUST-002 | Human `adapter-spec.md`; AI matrix `E-03` | `MAPI-T002P`, `MAPI-T002N` |
| MAPI-MUST-003 | Human `adapter-spec.md`; AI matrix `E-03`, `MO-03` | `MAPI-T003P`, `MAPI-T003N` |
| MAPI-MUST-004 | Human `models-spec.md`; AI `models.md` contract guidance | `MAPI-T004P`, `MAPI-T004N` |
| MAPI-MUST-005 | Human `models-spec.md`, `adapter-spec.md`; AI matrix `MO-02` | `MAPI-T005P`, `MAPI-T005N` |
| MAPI-MUST-006 | Human `models-spec.md`, `adapter-spec.md`; AI matrix `MO-03` | `MAPI-T006P`, `MAPI-T006N` |
| MAPI-MUST-007 | Human `configuration-spec.md`; AI matrix `C-01` | `MAPI-T007P`, `MAPI-T007N` |
| MAPI-MUST-008 | Human `configuration-spec.md`; AI matrix `C-02` | `MAPI-T008P`, `MAPI-T008N` |
| MAPI-MUST-009 | Human `configuration-spec.md`; AI matrix `C-03` | `MAPI-T009P`, `MAPI-T009N` |
| MAPI-MUST-010 | Human `security-spec.md`; AI matrix `S-01`, `GC-05` | `MAPI-T010P`, `MAPI-T010N` |
| MAPI-MUST-011 | Human `adapter-spec.md`; AI checklist `configuration-review.md` | `MAPI-T011P`, `MAPI-T011N` |
| MAPI-MUST-012 | Human `models-spec.md`, `deployment-spec.md`; AI checklist `configuration-review.md` | `MAPI-T012P`, `MAPI-T012N` |
| MAPI-MUST-013 | Human `foundation-spec.md`, `models-spec.md`; AI matrix `F-02`, `MO-01` | `MAPI-T013P`, `MAPI-T013N` |
| MAPI-MUST-014 | Human `models-spec.md`, `adapter-spec.md`; AI `models.md` + engine/tool contract behavior | `MAPI-T014P`, `MAPI-T014N` |

## 16. Residual Risks & Open Decisions

- `MAPI-RISK-001 (Medium)`: Mixed terminology (`Provider API` vs `Model API`) across source docs can cause duplicate or mis-scoped artifacts.
- `MAPI-RISK-002 (Medium)`: Transport-mode expectations (streaming vs non-streaming adapter call) may drift unless explicitly profiled.
- `MAPI-RISK-003 (Low)`: Secret-reference field naming (`api_key_ref` vs `api_key_env`) may diverge across integrations.
- `MAPI-DECISION-OPEN-001`: Publish canonical alias/terminology note in architecture docs to eliminate Provider-vs-Model naming ambiguity.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/base.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/index.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/adapters/openai-compatible.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/config.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/loop.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/errors.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 7 (`model_completion_request`, `model_completion_response`, `model_tool_definition`, `model_tool_call`, `adapter_config`, `runtime_model_binding`, `provider_error_surface`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 4/4 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: Provider-vs-Model API naming is not fully unified across all source documents.
- Final readiness rating: Conditionally Ready
