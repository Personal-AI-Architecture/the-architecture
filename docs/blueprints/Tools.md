# Tools Capability Boundary Blueprint Specification

## 1. Overview

### Purpose
Tools define the callable capability surface of the system: operations executed by Engine against Memory and external systems under Auth and security constraints.

### High-Level Responsibilities
- Define what a tool is and is not in architecture terms.
- Define tool discovery, availability, and execution boundaries.
- Define approval, authorization, and isolation interaction points for tool use.
- Define stable contract shapes for tool definition, invocation, result, and failure.
- Prevent architectural drift where tools become a fifth component or a separate API.

### System Context
- Tools are not a standalone runtime component.
- Tools are an external capability surface consumed by Engine.
- Tool availability is controlled by Configuration (what exists) and Auth (who can use what).
- Tool execution outcomes are exposed through the Gateway-Engine stream contract.

---

## 2. Scope Definition

### What Tools **are**
- A capability boundary made of callable operations (verbs).
- A contract surface spanning discovery metadata, callable definitions, invocation shapes, and execution results.
- A cross-component integration point connecting Engine, Auth, Memory, Configuration, and Security.

### What Tools **are not**
- Not a fifth architecture component.
- Not a separate public or internal API alongside Gateway API and Model API.
- Not a replacement for Auth authorization ownership.
- Not a replacement for Memory ownership of persisted data.
- Not product-specific workflow logic.

### Boundaries and Constraints
- Tool execution belongs to Engine.
- Authorization belongs to Auth.
- Tool availability comes from environment/runtime config plus permissions.
- Tool definitions must be deterministic and machine-validated.
- Sensitive tool actions requiring approval must use coded enforcement.

---

## 3. Core Concepts & Terminology

### Key Domain Concepts
- **Tool**: callable operation with schema-defined input and result.
- **Tool source**: configured location/mechanism where tools are discovered.
- **Always-send set**: tools sent to model context each turn.
- **Discoverable set**: tools not sent by default, discoverable on demand.
- **Tool call**: model-requested invocation (`id`, `name`, `input`).
- **Tool result**: outcome returned to the model/stream.
- **Tool failure**: structured error output with classification and recoverability.
- **Trust level**: security posture tier (`system_shipped`, `owner_installed`, `untrusted`).

### Internal Concepts
- **Execution boundary**: Engine executes calls; tool runtime performs operation.
- **Authorization boundary**: Auth allow/deny decision before execution.
- **Approval boundary**: coded runtime interception before mutating operations.
- **Granularity control**: read/write/parameter-level capability scoping.

### External Concepts
- **Environment availability**: whether a tool exists in runtime deployment.
- **Actor permission**: whether current actor may invoke an available tool.
- **Contract-visible approval**: approval appears via explicit stream/API events.

### Terminology
- **Capability drift**: tool ownership or behavior leaks into wrong boundary.
- **Tool subsystem drift**: introducing registries/APIs/components that violate foundation rules.
- **Hidden config channel**: request-time payload used to override tool/runtime bootstrap truth.

---

## 4. Interfaces & Contracts

### 4.1 Canonical Contract Pack
- Schema file: `blueprints/contracts/Tools.schema.json`
- Contract interfaces:
  - `tool_source_entry`
  - `tool_definition`
  - `tool_visibility_policy`
  - `tool_availability_context`
  - `tool_call`
  - `tool_execution_result`
  - `tool_failure`
  - `approval_request_event`
  - `approval_result_event`
  - `tool_isolation_profile`
  - `tool_discovery_query`
  - `tool_discovery_match`

### 4.2 `tool_source_entry`
- Required fields:
  - `source_id` (string, non-empty)
  - `source_kind` enum: `mcp | cli | native | manifest`
  - `enabled` (boolean)
- Optional fields:
  - `trust_level` enum: `system_shipped | owner_installed | untrusted` (default `owner_installed`)
  - `endpoint_ref` (string)
- Defaults:
  - `enabled=true`
  - `trust_level=owner_installed`
- Forbidden fields:
  - `api_key`, `token`, `password`, `secret_value`
- Error shape:
  - pre-stream/startup: `tool_failure` with `code=invalid_source`
  - mid-stream: not applicable (source discovery is startup/refresh behavior)
- Valid example:
```json
{
  "source_id": "builtin/memory-tools",
  "source_kind": "native",
  "enabled": true,
  "trust_level": "system_shipped"
}
```
- Invalid example:
```json
{
  "source_kind": "native",
  "enabled": true
}
```
- Why invalid: missing required `source_id`.

### 4.3 `tool_definition`
- Required fields:
  - `name` (string, non-empty)
  - `description` (string, non-empty)
  - `input_schema` (object)
  - `read_only` (boolean)
  - `requires_approval` (boolean)
- Optional fields:
  - `source_id` (string)
  - `availability` enum: `always_send | discoverable`
  - `tags` (string[])
  - `timeout_ms` (positive integer)
- Defaults:
  - `availability=discoverable`
- Forbidden fields:
  - `provider`, `model`, `auth_policy`, `execute_code`, `api_key`, `secret_value`
- Error shape:
  - pre-stream: `tool_failure` with `code=invalid_definition`
  - mid-stream: if unknown tool name is requested, emit stream `error` (`tool_error`) with safe message
- Valid example:
```json
{
  "name": "memory_search",
  "description": "Search file contents inside memory root",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "path": { "type": "string" }
    },
    "required": ["query"]
  },
  "read_only": true,
  "requires_approval": false,
  "source_id": "memory-tools/file-ops/server.ts",
  "availability": "always_send"
}
```
- Invalid example:
```json
{
  "name": "memory_write",
  "description": "Write file",
  "read_only": false,
  "requires_approval": true,
  "provider": "openrouter"
}
```
- Why invalid: missing `input_schema`; forbidden field `provider`.

### 4.4 `tool_visibility_policy`
- Required fields:
  - `always_send_tools` (string[])
  - `discoverable_tools` (string[])
- Optional fields:
  - `expose_unavailable_tools_to_model` (boolean, default `true`)
- Defaults:
  - `expose_unavailable_tools_to_model=true`
- Forbidden behavior:
  - same tool appearing in both arrays
- Error shape:
  - pre-stream/startup: `tool_failure` with `code=invalid_policy`
  - mid-stream: not applicable
- Valid example:
```json
{
  "always_send_tools": ["memory_read", "memory_search"],
  "discoverable_tools": ["project_list", "memory_export"],
  "expose_unavailable_tools_to_model": true
}
```
- Invalid example:
```json
{
  "always_send_tools": ["memory_read"],
  "discoverable_tools": ["memory_read"]
}
```
- Why invalid: overlap violates set separation invariant.

### 4.5 `tool_availability_context`
- Required fields:
  - `environment_tools` (string[])
  - `auth_permitted_tools` (string[])
  - `granularity_mode` enum: `coarse | granular`
- Optional fields:
  - `denied_tools` (string[])
  - `reason_by_tool` (object map of string->string)
- Defaults:
  - `granularity_mode=coarse`
- Forbidden fields:
  - runtime provider/model settings (`provider`, `model`, `base_url`)
- Error shape:
  - pre-stream: `tool_failure` with `code=invalid_availability_context`
  - mid-stream: not applicable
- Valid example:
```json
{
  "environment_tools": ["memory_read", "memory_write", "auth_whoami"],
  "auth_permitted_tools": ["memory_read", "auth_whoami"],
  "granularity_mode": "coarse",
  "denied_tools": ["memory_write"],
  "reason_by_tool": {
    "memory_write": "permission_denied"
  }
}
```
- Invalid example:
```json
{
  "environment_tools": ["memory_read"],
  "auth_permitted_tools": ["memory_read"],
  "provider": "openrouter"
}
```
- Why invalid: forbidden config channel field.

### 4.6 `tool_call`
- Required fields:
  - `id` (identifier)
  - `name` (string)
  - `input` (object)
- Optional fields:
  - `correlation_id` (identifier)
- Defaults: none.
- Forbidden behavior:
  - non-object `input`
  - missing stable `id`
- Error shape:
  - pre-stream: invalid request if malformed tool call enters internal contract
  - mid-stream: unknown tool emits stream `error` with `code=tool_error`
- Valid example:
```json
{
  "id": "tool_123",
  "name": "memory_read",
  "input": {
    "path": "documents/spec.md"
  },
  "correlation_id": "corr_abc"
}
```
- Invalid example:
```json
{
  "name": "memory_read",
  "input": "documents/spec.md"
}
```
- Why invalid: missing `id`; `input` must be object.

### 4.7 `tool_execution_result`
- Required fields:
  - `status` enum: `ok | denied | error`
  - `output` (any JSON value)
- Optional fields:
  - `recoverable` (boolean; required when `status=error`)
- Defaults: none.
- Forbidden behavior:
  - `status=error` without structured failure output.
- Error shape:
  - pre-stream: not applicable
  - mid-stream: emitted as `tool-result` event; unrecoverable error may be followed by stream `error` (`tool_error`)
- Valid example:
```json
{
  "status": "error",
  "output": {
    "code": "not_found",
    "message": "Requested path not found",
    "recoverable": true
  },
  "recoverable": true
}
```
- Invalid example:
```json
{
  "status": "error",
  "output": "failed"
}
```
- Why invalid: error output lacks structured failure fields.

### 4.8 `tool_failure`
- Required fields:
  - `code` enum: `not_found | path_invalid | reserved_path | invalid_input | permission_denied | execution_failed | invalid_source | invalid_definition | invalid_policy | invalid_availability_context | unavailable | timeout`
  - `message` (1-240 chars)
  - `recoverable` (boolean)
- Optional fields:
  - `details` (object)
- Defaults: none.
- Forbidden behavior:
  - stack traces, credentials, raw provider payloads in `message`
- Error shape:
  - pre-stream: invalid source/definition/policy errors
  - mid-stream: tool execution failure payload inside `tool-result`
- Valid example:
```json
{
  "code": "permission_denied",
  "message": "Permission denied for requested path",
  "recoverable": false
}
```
- Invalid example:
```json
{
  "code": "execution_failed",
  "message": "Error: stack at /srv/tool.ts:88",
  "recoverable": false
}
```
- Why invalid: unsafe internal detail leakage.

### 4.9 `approval_request_event`
- Required fields:
  - `type` const `approval-request`
  - `request_id` (identifier)
  - `tool_name` (string)
  - `summary` (string)
- Optional fields: none.
- Defaults: none.
- Forbidden behavior:
  - mutating tool execution before approval-request emission
- Error shape:
  - mid-stream only; pre-stream not applicable
- Valid example:
```json
{
  "type": "approval-request",
  "request_id": "apr_1",
  "tool_name": "memory_write",
  "summary": "memory_write on documents/spec.md"
}
```
- Invalid example:
```json
{
  "type": "approval-request",
  "tool_name": "memory_write"
}
```
- Why invalid: missing `request_id` and `summary`.

### 4.10 `approval_result_event`
- Required fields:
  - `type` const `approval-result`
  - `request_id` (identifier)
  - `decision` enum: `approved | denied`
- Optional fields: none.
- Defaults: none.
- Forbidden behavior:
  - omitted result after approval request
- Error shape:
  - mid-stream only; pre-stream not applicable
- Valid example:
```json
{
  "type": "approval-result",
  "request_id": "apr_1",
  "decision": "denied"
}
```
- Invalid example:
```json
{
  "type": "approval-result",
  "request_id": "apr_1",
  "decision": "allow"
}
```
- Why invalid: unsupported `decision` enum.

### 4.11 `tool_isolation_profile`
- Required fields:
  - `trust_level` enum: `system_shipped | owner_installed | untrusted`
  - `isolation_mode` enum: `in_process | shared_container | dedicated_container`
  - `filesystem_scope` enum: `restricted | full`
  - `network_scope` enum: `none | restricted | open`
  - `resource_limits` object with `cpu_cores`, `memory_mb`, `timeout_ms`
- Optional fields:
  - `warning_on_unverified` (boolean, default `true`)
- Defaults:
  - `warning_on_unverified=true`
- Forbidden behavior:
  - `trust_level=untrusted` with non-dedicated isolation mode
- Error shape:
  - pre-stream/startup: `tool_failure` with `code=invalid_policy`
  - mid-stream: unavailable/timeout failures surfaced as tool failures
- Valid example:
```json
{
  "trust_level": "untrusted",
  "isolation_mode": "dedicated_container",
  "filesystem_scope": "restricted",
  "network_scope": "restricted",
  "warning_on_unverified": true,
  "resource_limits": {
    "cpu_cores": 1,
    "memory_mb": 512,
    "timeout_ms": 30000
  }
}
```
- Invalid example:
```json
{
  "trust_level": "untrusted",
  "isolation_mode": "in_process",
  "filesystem_scope": "full",
  "network_scope": "open",
  "resource_limits": {
    "cpu_cores": 1,
    "memory_mb": 512,
    "timeout_ms": 30000
  }
}
```
- Why invalid: untrusted tools cannot run in-process.

### 4.12 `tool_discovery_query`
- Required fields:
  - `capability` (string, non-empty)
- Optional fields:
  - `limit` (integer 1-50, default 10)
  - `source_filter` (string)
- Defaults:
  - `limit=10`
- Forbidden fields:
  - execution payload fields (`id`, `input`)
- Error shape:
  - pre-stream: `tool_failure` with `code=invalid_input`
  - mid-stream: returned as tool error output when malformed
- Valid example:
```json
{
  "capability": "list projects",
  "limit": 5
}
```
- Invalid example:
```json
{
  "limit": 5
}
```
- Why invalid: missing required `capability`.

### 4.13 `tool_discovery_match`
- Required fields:
  - `source_id` (string)
  - `tool_name` (string)
  - `description` (string)
- Optional fields:
  - `score` (number 0-1)
- Defaults: none.
- Forbidden behavior:
  - returning full executable internals or secret-bearing config data
- Error shape:
  - pre-stream: not applicable
  - mid-stream: malformed match output treated as tool error
- Valid example:
```json
{
  "source_id": "builtin/project-tools",
  "tool_name": "project_list",
  "description": "List projects under documents with project completeness status",
  "score": 0.93
}
```
- Invalid example:
```json
{
  "tool_name": "project_list"
}
```
- Why invalid: missing `source_id` and `description`.

---

## 5. Behavior Specification

### 5.1 Startup Discovery and Registration
1. Runtime config declares `tool_sources`.
2. System discovers tool definitions from configured sources.
3. Unknown sources fail startup clearly.
4. Tool definitions are validated before becoming available.
5. Tool catalog is handed to Engine for request-time listing/execution.

### 5.2 Availability Resolution
- Environment layer decides physically available tools.
- Auth layer filters callable tools per actor.
- Granularity layer refines allowed mode (read/write/parameter constraints).
- No request payload may override startup tool availability.

### 5.3 Context Management
- Tools are partitioned into always-send and discoverable sets.
- Always-send tools are included by default in model context.
- Discoverable tools are loaded through discovery interactions when needed.
- Visibility policy belongs to owner preferences, not runtime hardcode.

### 5.4 Execution Workflow
1. Model emits `tool-call` with stable call ID.
2. Engine verifies tool exists.
3. Auth authorizes invocation.
4. If tool requires approval, Engine emits `approval-request` and waits for `approved|denied`.
5. Engine executes tool and emits `tool-result`.
6. Engine re-injects tool result into model context and continues loop.

### 5.5 Failure and Recovery Behavior
- Recoverable tool failures return structured `tool-result` (`status=error`, `recoverable=true`).
- Unrecoverable tool failures may terminate stream via `error` (`code=tool_error`) after emitting failure result.
- Unknown tool names produce safe `tool_error` event.
- Timeouts/unavailability are normalized as structured `tool_failure` outputs.

### 5.6 State Management
- Tools are operation-scoped and stateless by default.
- Persistent state belongs to Memory or external systems, never to tool definitions.
- Approval pending state is explicit and externally resolvable by request ID.

### 5.7 Lifecycle and Health
- Tool startup: in-process at runtime boot or by environment-managed startup.
- Tool health: unresponsive tools are bounded by timeout and surfaced as unavailable.
- Tool stop/crash: failure must not silently disappear; caller receives structured failure.
- Tool upgrades: should preserve contracts and avoid redefining component boundaries.

### 5.8 Edge Cases and Error Handling
- Unsupported source IDs: startup failure, clear message.
- Duplicate tool names from multiple sources: deterministic conflict handling required.
- Repeated destructive tool calls on same path: loop/mutation guards may block and return recoverable failure.
- Approval request not found: reject decision route safely without leaking internals.
- Path escape and reserved-path access: explicit classified failure codes.

---

## 6. Dependencies & Interactions

### External Dependencies
- Tool runtime mechanisms (MCP, CLI, native hooks).
- External services called by tools.
- Host/container runtime used for tool isolation.

### Component Interactions
- **Engine -> Tools**: execution ownership.
- **Auth -> Tools**: authorization policy enforcement before execution.
- **Tools -> Memory**: read/write/query via approved boundaries.
- **Configuration -> Tools**: source registration and startup discovery.
- **Security -> Tools**: isolation, approval, safe error, and audit constraints.

### Data Flow
1. Config supplies tool sources.
2. Discovery builds tool definitions.
3. Engine provides callable subset to model.
4. Model emits tool call.
5. Engine/Auth gate execution.
6. Tool output returns as stream/tool message.

### Dependency Assumptions
- Auth context exists on protected runtime paths.
- Runtime config is validated before discovery.
- Tool definitions are schema-compatible.
- Audit sink is available for tool call/result records.

---

## 7. Invariants & Rules

- Tools must not be implemented as a standalone architecture component.
- Tools must not be exposed as a third API.
- Tool execution must remain in Engine.
- Authorization must remain in Auth.
- Tool availability must be environment/config + Auth driven.
- Request metadata must not reconfigure runtime tool sources.
- Memory access by components/models must use tool-mediated boundaries.
- Mutating tools requiring approval must not execute before coded approval decision.
- Tool result and error outputs must remain structured and safe.
- Tool calls and results must preserve stable call IDs.
- Untrusted tools must have dedicated isolation (policy-level invariant).
- Tool crashes/unavailability must be surfaced explicitly.
- Always-send/discoverable policy must remain owner-governed preference data.
- Tool swaps must remain config/preference driven and must not require architecture rewrites.

---

## 8. Non-Functional Requirements

### Performance Expectations
- Tool listing and permission filtering should be bounded and low-latency per request.
- Tool execution timeout controls must prevent indefinite loop blocking.
- Discovery and catalog lookup should scale without sending all definitions every turn.

### Scalability Considerations
- Support small MVP tool sets and large discoverable catalogs with same architecture.
- Support mixed trust levels and heterogeneous execution mechanisms.
- Preserve stable contracts as tool count and source diversity grow.

### Reliability and Fault Tolerance
- Startup must fail clearly on invalid sources/definitions.
- Tool unavailability must degrade gracefully via structured failures.
- Tool runtime failures must not produce silent data corruption.

### Security Considerations
- Safe error surfaces: no stack traces/secrets in tool failure messages.
- Approval gates: coded enforcement for sensitive mutations.
- Isolation controls: trust-level-appropriate filesystem/network/resource boundaries.
- Auditability: structured tool call/result and approval events with correlation IDs.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **Capability registry abstraction** for source->definition discovery.
- **Policy gate chain**: availability, authorization, approval, execution.
- **Structured failure normalization** with explicit code/recoverable flags.
- **Catalog split pattern**: always-send and discoverable sets.

### Design Considerations
- Validate tool definitions before exposure to model.
- Keep source identity explicit to prevent name/source ambiguity.
- Keep approval lifecycle externally addressable by request ID.
- Prefer deterministic ordering for tool lists and discovery outputs.

### Anti-Patterns to Avoid
- Building a dedicated Tool API layer between Model API and Engine.
- Embedding auth decisions inside tool definition payloads.
- Letting request payload metadata mutate runtime tool configuration.
- Collapsing all tool failures to generic untyped errors.
- Using prompt-only approval behavior for mutating tools.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `T-01`: tools are not a component and not a separate API.
- `T-02`: execution in Engine, authorization in Auth.
- `T-03`: availability via config/environment + Auth permissions.
- `S-03`: approval must be coded enforcement.
- `S-04`: tool scope/isolation must enforce runtime boundaries.
- `C-01`, `C-02`: config ownership and no request-side hidden config channels.
- `M-02`: memory access through approved boundaries.

### Primer/Implementation Tensions
- Primer and architecture describe always-send/discoverable behavior; current runtime evidence largely loads configured tools directly without explicit discovery meta-tool.
- Primer traceability implies security posture for tool isolation; MVP runtime evidence emphasizes curated in-process sources.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Tools are capability surface, not component (`tools-spec.md`, `foundation-spec.md`).
- Model API + Engine execution path removes need for separate tool API (`tools-spec.md`).
- Scope is driven by available tools plus Auth permissions (`tools-spec.md`, `auth-spec.md`).
- Approval for sensitive writes must be coded, not prompt-only (`tools-spec.md`, `security-spec.md`).
- Memory access is mediated by tools (`memory-spec.md`, `security-spec.md`).

### Documented Discrepancies To Reconcile
1. **Self-describing tool definitions vs static source registry**
   - Human docs emphasize self-description from tools.
   - Current implementation evidence uses a static map of supported sources.
2. **Model visibility of unavailable tools**
   - Human docs (D56) recommend model awareness of exists-but-not-permissioned tools.
   - Current runtime filters unavailable tools out before model invocation.
3. **Always-send/discoverable split depth**
   - Human docs include explicit split and discovery flow.
   - Current runtime evidence does not expose a full catalog discovery tool path.
4. **Trust-level isolation formalization**
   - Human/security docs define trust-level policies and mandatory untrusted isolation.
   - MVP evidence is mostly curated/local with limited explicit trust policy surface.

### Rebuild Guidance When Sources Diverge
- Treat human architecture ownership as authoritative.
- Treat AI primer matrix rows (`T-*`, `S-*`, `C-*`, `M-*`) as conformance gates.
- Treat implementation evidence as current behavior snapshot, not normative authority.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| TOL-CF-001 | Human docs: tools self-describe from sources; MVP evidence: static source registry map | Keep self-description as normative target; allow static registry as MVP evidence under strict schema validation | Preserves architecture direction while recognizing current implementation stage | Tool onboarding may require code edits and create lock-in drift |
| TOL-CF-002 | Human docs D56: model should know tools that exist but are not permissioned; MVP evidence filters tool list by permission before model call | Keep this as SHOULD-level in MVP, not MUST-level | Avoids overclaiming current behavior while retaining future architecture intent | Model may produce less informative permission feedback |
| TOL-CF-003 | Human docs define always-send/discoverable + discovery meta-tool; MVP evidence sends configured tools directly | Treat split as SHOULD-level readiness pattern and MUST-level when tool count/scale requires | Maintains MVP simplicity while preventing scale-time drift | Context bloat and degraded tool selection at higher tool counts |
| TOL-CF-004 | Security/tools docs require mandatory isolation for untrusted tools; MVP evidence uses curated in-process tools and no full trust policy surface | Keep mandatory untrusted isolation as MUST policy in contract; document current gap as implementation backlog | Ensures future marketplace/third-party integration stays safe | Untrusted tool compromise could breach host/data boundaries |
| TOL-CF-005 | Engine spec guarantees concurrent execution for parallel tool calls; current loop evidence processes calls sequentially | Keep concurrent capability as SHOULD for MVP and MUST for scale/performance profiles | Avoids contradicting current implementation while preserving spec intent | Latency and throughput degradation for multi-tool turns |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `TOL-MUST-001`: Tools MUST NOT be implemented as a standalone architecture component.
- `TOL-MUST-002`: Tools MUST NOT introduce a separate Tool API boundary.
- `TOL-MUST-003`: Tool execution MUST occur in Engine and authorization MUST occur in Auth.
- `TOL-MUST-004`: Tool availability MUST be determined by environment/configuration plus Auth permissions.
- `TOL-MUST-005`: Request payloads MUST NOT override runtime tool sources, tool definitions, or availability policy.
- `TOL-MUST-006`: Tool definitions MUST include canonical fields (`name`, `description`, `input_schema`, `read_only`, `requires_approval`).
- `TOL-MUST-007`: Unsupported or invalid tool sources/definitions MUST fail clearly before runtime readiness.
- `TOL-MUST-008`: Tool calls and tool results MUST preserve stable call IDs and contract-visible event shape.
- `TOL-MUST-009`: Mutating tools requiring approval MUST be gated by coded approval enforcement before execution.
- `TOL-MUST-010`: Tool failures MUST be emitted as structured safe outputs with code/message/recoverable semantics.
- `TOL-MUST-011`: Memory access by model/components MUST remain tool-mediated rather than direct storage reach-in.
- `TOL-MUST-012`: Tool scope/isolation controls MUST enforce trust boundaries independent of Auth policy alone.
- `TOL-MUST-013`: Tool unavailability/timeout/crash MUST be surfaced explicitly and MUST NOT fail silently.
- `TOL-MUST-014`: Tool add/remove swap paths MUST remain configuration/preference driven without architecture rewrites.

### SHOULD

- `TOL-SHOULD-001`: Systems SHOULD implement explicit always-send/discoverable split with discovery query path.
- `TOL-SHOULD-002`: Systems SHOULD expose exists-but-not-permissioned capability hints to improve model/user guidance.
- `TOL-SHOULD-003`: Systems SHOULD support concurrent execution for independent tool calls in a single loop turn.

### MAY

- `TOL-MAY-001`: Implementations MAY add tool-specific optional metadata (`tags`, `timeouts`) when canonical fields remain intact.
- `TOL-MAY-002`: Implementations MAY support multiple discovery mechanisms (`mcp`, `cli`, `native`, `manifest`) in one deployment.

## 14. Acceptance Gates (Pass/Fail)

- `TOL-GATE-01 Contract Gate`: Pass if interfaces validate against `contracts/Tools.schema.json`; fail otherwise.
- `TOL-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Tools-conformance.md` pass (14 positive + 14 negative); fail on any `TOL-MUST-*` failure.
- `TOL-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Tools-drift-guard.md` pass; fail on any Critical check failure.
- `TOL-GATE-04 Boundary Gate`: Pass if execution/auth/approval/memory-boundary ownership is preserved end-to-end.
- `TOL-GATE-05 Conflict Gate`: Pass if no unresolved High-risk conflict remains in Tools conflict register.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| TOL-MUST-001 | Human `tools-spec.md`, `foundation-spec.md`; AI matrix `T-01`, `F-03` | `TOL-T001P`, `TOL-T001N` |
| TOL-MUST-002 | Human `tools-spec.md`, `foundation-spec.md`; AI matrix `T-01`, `F-02` | `TOL-T002P`, `TOL-T002N` |
| TOL-MUST-003 | Human `tools-spec.md`, `auth-spec.md`, `engine-spec.md`; AI matrix `T-02`, `A-02` | `TOL-T003P`, `TOL-T003N` |
| TOL-MUST-004 | Human `tools-spec.md`, `configuration-spec.md`; AI matrix `T-03`, `C-01` | `TOL-T004P`, `TOL-T004N` |
| TOL-MUST-005 | Human `configuration-spec.md`, `gateway-engine-contract.md`; AI matrix `C-02`, `GC-01` | `TOL-T005P`, `TOL-T005N` |
| TOL-MUST-006 | Human `tools-spec.md`; AI `tools.md` | `TOL-T006P`, `TOL-T006N` |
| TOL-MUST-007 | Human `configuration-spec.md`, `tools-spec.md`; AI checklist `configuration-review.md` | `TOL-T007P`, `TOL-T007N` |
| TOL-MUST-008 | Human `engine-spec.md`, `gateway-engine-contract.md`; AI matrix `GC-02` | `TOL-T008P`, `TOL-T008N` |
| TOL-MUST-009 | Human `tools-spec.md`, `security-spec.md`; AI matrix `S-03`, `S-05` | `TOL-T009P`, `TOL-T009N` |
| TOL-MUST-010 | Human `security-spec.md`, `gateway-engine-contract.md`; AI matrix `S-01`, `GC-05` | `TOL-T010P`, `TOL-T010N` |
| TOL-MUST-011 | Human `memory-spec.md`, `gateway-spec.md`; AI matrix `M-02` | `TOL-T011P`, `TOL-T011N` |
| TOL-MUST-012 | Human `security-spec.md`, `tools-spec.md`; AI matrix `S-04` | `TOL-T012P`, `TOL-T012N` |
| TOL-MUST-013 | Human `tools-spec.md`, `engine-spec.md`; AI matrix `GC-03` | `TOL-T013P`, `TOL-T013N` |
| TOL-MUST-014 | Human `configuration-spec.md` (D147), `tools-spec.md`; AI matrix `T-03`, `MO-03` | `TOL-T014P`, `TOL-T014N` |

## 16. Residual Risks & Open Decisions

- `TOL-RISK-001 (Medium)`: Static source registration can become a lock-in vector if self-description paths are not expanded.
- `TOL-RISK-002 (Medium)`: Missing explicit always-send/discoverable machinery can increase context/token overhead as tool count grows.
- `TOL-RISK-003 (Medium)`: Incomplete trust-level isolation controls create security exposure when third-party tools are introduced.
- `TOL-RISK-004 (Low)`: Filtering unavailable tools from model context may reduce quality of permission-aware responses.
- `TOL-DECISION-OPEN-001`: Standardize duplicate tool-name conflict policy across sources (source precedence vs explicit disambiguation).
- `TOL-DECISION-OPEN-002`: Define required observability metrics for discovery quality (hit rate, false positives, load latency).

## Related Blueprint Artifacts

- `Memory-Tools` defines the specialized mandatory memory-facing subset of the broader Tools boundary:
  - `blueprints/Memory-Tools.md`
  - `blueprints/contracts/Memory-Tools.schema.json`
  - `blueprints/tests/Memory-Tools-conformance.md`
  - `blueprints/drift/Memory-Tools-drift-guard.md`
  - `blueprints/prompts/implement-Memory-Tools.md`
- `Memory` defines substrate ownership, persistence guarantees, and memory data boundaries that tool execution must respect:
  - `blueprints/Memory.md`
  - `blueprints/contracts/Memory.schema.json`
  - `blueprints/tests/Memory-conformance.md`
  - `blueprints/drift/Memory-drift-guard.md`
  - `blueprints/prompts/implement-Memory.md`
- Overlap precedence:
  - when memory operation contract detail conflicts with broader tool wording, `Memory-Tools` contract precision governs.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/tools.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/tool-executor.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/engine/loop.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/memory-tools/file-ops/server.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/tools/project-tools.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/auth/authorize.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/gateway/server.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/test/runtime.test.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 12 (`tool_source_entry`, `tool_definition`, `tool_visibility_policy`, `tool_availability_context`, `tool_call`, `tool_execution_result`, `tool_failure`, `approval_request_event`, `approval_result_event`, `tool_isolation_profile`, `tool_discovery_query`, `tool_discovery_match`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 5/5 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: timing and threshold for making discovery split mandatory in MVP-to-V1 transition is not yet standardized.
- Final readiness rating: Conditionally Ready
