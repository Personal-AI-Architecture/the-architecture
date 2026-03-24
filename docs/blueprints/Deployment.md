# Deployment Boundary Blueprint Specification

## 1. Overview

### Purpose
Deployment defines where and how the system runs, with owner control as the default posture. It establishes local-first operation, offline viability, network exposure defaults, and deployability guarantees without changing component ownership.

### High-Level Responsibilities
- Define owner-controlled local deployment guarantees.
- Define offline-capable runtime posture.
- Define default network exposure behavior.
- Define single-unit deployment expectations.
- Define data-locality and update-safety constraints.

### System Context
- Deployment is a cross-cutting operational boundary, not a runtime component.
- Deployment constrains how Gateway, Engine, Memory, Auth, and model adapters are hosted.
- Deployment interacts with Configuration, Security, Models, and startup-readiness guarantees.
- Deployment does not alter component responsibility matrix or API contract ownership.

### Companion Artifacts
- Configuration boundary: `blueprints/Configuration.md`
- Models boundary: `blueprints/Models.md`
- Model API boundary: `blueprints/Model-API.md`
- Security boundary: `blueprints/Security.md`

---

## 2. Scope Definition

### What Deployment **is**
- The boundary for runtime posture and operational environment assumptions.
- A contract for local ownership, offline path, and exposure defaults.
- A policy surface for deployment safety and anti-lock-in behavior.
- A specification of deployment invariants that implementation choices must preserve.

### What Deployment **is not**
- Not a fifth component.
- Not an API boundary.
- Not an identity/permission model owner.
- Not product-specific operations tooling or hosting product policy.
- Not a substitute for configuration, security, or component contracts.

### Boundaries and Constraints
- System must be able to run on hardware the owner physically controls.
- Fully offline functional path must exist.
- Default network posture must be localhost-only.
- Single-unit deployment must remain default path.
- Remote hosting and exposure are optional implementation choices, never mandatory architecture prerequisites.

---

## 3. Core Concepts & Terminology

### Key Domain Concepts
- **Owner-Controlled Hardware**: machine where owner has root/admin control and can inspect/shutdown/disconnect.
- **Offline Functional Path**: full message -> model -> tool -> response loop without internet dependency.
- **Local-First Data Posture**: owner data remains local by default unless explicitly configured otherwise.
- **Single Deployable Unit**: all core components deploy together as one baseline runtime unit.
- **Default Localhost Bind**: network bind defaults to loopback-only exposure.

### Internal Concepts
- **Startup Readiness**: deterministic startup order and readiness gates before system is considered usable.
- **Deployment Profile**: concrete runtime choices (containerized, native) implementing same deployment contract.
- **Escape Path**: architecture-defined migration path away from a given external dependency.

### External Concepts
- **Container Runtime**: packaging/runtime toolchain for deployment (for example OCI runtimes).
- **Model Provider Endpoint**: local or cloud model runtime endpoint consumed through adapters.
- **Remote Exposure Mechanism**: explicit owner-configured network publication mechanism (reverse proxy, tunnel, bind override).

### Terminology Clarifications
- “Local deployment” is the architecture baseline.
- “Managed hosting”, “VPS”, and “remote access” are implementation-level extensions, not level-1 boundary requirements.

---

## 4. Interfaces & Contracts

### 4.1 Canonical Contract Pack
- Schema file: `blueprints/contracts/Deployment.schema.json`
- Defined interfaces:
  - `deployment_boundary_profile`
  - `owner_control_posture`
  - `offline_function_profile`
  - `network_exposure_policy`
  - `single_unit_deployment_profile`
  - `hardware_support_profile`
  - `storage_locality_policy`
  - `dependency_escape_profile`
  - `update_safety_policy`
  - `startup_readiness_profile`

### 4.2 `deployment_boundary_profile`
- Required fields:
  - `boundary_type` enum: `operational_boundary`
  - `is_component` boolean (must be `false`)
  - `is_api` boolean (must be `false`)
  - `default_deployment_mode` enum: `local_owner_controlled`
  - `optional_extensions` array containing any of:
    - `managed_hosting`
    - `vps_hosting`
    - `remote_access`
- Optional fields:
  - `notes` string
- Defaults:
  - none
- Forbidden fields:
  - `component_owner`
  - `api_surface_name`
- Error shape:
  - pre-stream/startup: `deployment_policy_error` with `code=invalid_boundary_profile`
  - mid-stream: not applicable
- Valid example:
```json
{
  "boundary_type": "operational_boundary",
  "is_component": false,
  "is_api": false,
  "default_deployment_mode": "local_owner_controlled",
  "optional_extensions": ["managed_hosting", "remote_access"]
}
```
- Invalid example:
```json
{
  "boundary_type": "component",
  "is_component": true,
  "is_api": true,
  "default_deployment_mode": "managed_only",
  "optional_extensions": []
}
```
- Why invalid: reclassifies deployment as component/API and removes local-default posture.

### 4.3 `owner_control_posture`
- Required fields:
  - `owner_hardware_required` boolean (must be `true`)
  - `root_or_admin_control_required` boolean (must be `true`)
  - `local_run_path_required` boolean (must be `true`)
  - `remote_infra_required_by_default` boolean (must be `false`)
- Optional fields:
  - `owner_inspection_capabilities` array including:
    - `inspect`
    - `modify`
    - `disconnect`
    - `shutdown`
- Defaults:
  - none
- Forbidden fields:
  - `mandatory_cloud_account`
- Error shape:
  - pre-stream/startup: `deployment_policy_error` with `code=invalid_owner_control_posture`
  - mid-stream: not applicable
- Valid example:
```json
{
  "owner_hardware_required": true,
  "root_or_admin_control_required": true,
  "local_run_path_required": true,
  "remote_infra_required_by_default": false,
  "owner_inspection_capabilities": ["inspect", "modify", "disconnect", "shutdown"]
}
```
- Invalid example:
```json
{
  "owner_hardware_required": false,
  "root_or_admin_control_required": false,
  "local_run_path_required": false,
  "remote_infra_required_by_default": true
}
```
- Why invalid: violates owner-control baseline.

### 4.4 `offline_function_profile`
- Required fields:
  - `offline_path_required` boolean (must be `true`)
  - `internet_required_for_basic_loop` boolean (must be `false`)
  - `local_model_path_supported` boolean (must be `true`)
  - `offline_loop_scope` enum: `message_model_tools_response`
- Optional fields:
  - `documented_docker_local_option` boolean (default `true`)
- Defaults:
  - `documented_docker_local_option=true`
- Forbidden fields:
  - `cloud_model_mandatory`
- Error shape:
  - pre-stream/startup: `deployment_policy_error` with `code=invalid_offline_profile`
  - mid-stream: offline-mode errors map to safe deployment/runtime errors
- Valid example:
```json
{
  "offline_path_required": true,
  "internet_required_for_basic_loop": false,
  "local_model_path_supported": true,
  "offline_loop_scope": "message_model_tools_response",
  "documented_docker_local_option": true
}
```
- Invalid example:
```json
{
  "offline_path_required": false,
  "internet_required_for_basic_loop": true,
  "local_model_path_supported": false,
  "offline_loop_scope": "message_only"
}
```
- Why invalid: forbids required offline functional path.

### 4.5 `network_exposure_policy`
- Required fields:
  - `default_bind_scope` enum: `localhost_only`
  - `network_exposed_by_default` boolean (must be `false`)
  - `explicit_owner_action_required_for_exposure` boolean (must be `true`)
  - `auto_port_forwarding_enabled` boolean (must be `false`)
- Optional fields:
  - `allow_bind_override` boolean (default `true`)
  - `override_requires_explicit_config` boolean (default `true`)
- Defaults:
  - `allow_bind_override=true`
  - `override_requires_explicit_config=true`
- Forbidden fields:
  - `public_bind_default`
- Error shape:
  - pre-stream/startup: `deployment_policy_error` with `code=invalid_network_policy`
  - mid-stream: not applicable
- Valid example:
```json
{
  "default_bind_scope": "localhost_only",
  "network_exposed_by_default": false,
  "explicit_owner_action_required_for_exposure": true,
  "auto_port_forwarding_enabled": false,
  "allow_bind_override": true,
  "override_requires_explicit_config": true
}
```
- Invalid example:
```json
{
  "default_bind_scope": "public",
  "network_exposed_by_default": true,
  "explicit_owner_action_required_for_exposure": false,
  "auto_port_forwarding_enabled": true
}
```
- Why invalid: violates localhost-first default posture.

### 4.6 `single_unit_deployment_profile`
- Required fields:
  - `single_unit_default` boolean (must be `true`)
  - `includes_core_components` array containing:
    - `gateway`
    - `engine`
    - `auth`
    - `memory`
  - `separate_services_required_for_baseline` boolean (must be `false`)
- Optional fields:
  - `split_deployment_allowed` boolean (default `true`)
- Defaults:
  - `split_deployment_allowed=true`
- Forbidden fields:
  - `orchestration_mandatory`
- Error shape:
  - pre-stream/startup: `deployment_policy_error` with `code=invalid_single_unit_profile`
  - mid-stream: not applicable
- Valid example:
```json
{
  "single_unit_default": true,
  "includes_core_components": ["gateway", "engine", "auth", "memory"],
  "separate_services_required_for_baseline": false,
  "split_deployment_allowed": true
}
```
- Invalid example:
```json
{
  "single_unit_default": false,
  "includes_core_components": ["gateway"],
  "separate_services_required_for_baseline": true
}
```
- Why invalid: baseline deployment no longer single-unit.

### 4.7 `hardware_support_profile`
- Required fields:
  - `supported_cpu_arch` array containing:
    - `x86_64`
    - `arm64`
  - `min_ram_gb` integer (minimum `8`)
  - `min_storage_gb` integer (minimum `1`)
  - `supported_os` array containing:
    - `linux`
    - `macos`
    - `windows`
- Optional fields:
  - `notes` string
- Defaults:
  - none
- Forbidden fields:
  - `gpu_required_for_baseline`
- Error shape:
  - pre-stream/startup: `deployment_policy_error` with `code=invalid_hardware_profile`
  - mid-stream: not applicable
- Valid example:
```json
{
  "supported_cpu_arch": ["x86_64", "arm64"],
  "min_ram_gb": 8,
  "min_storage_gb": 1,
  "supported_os": ["linux", "macos", "windows"]
}
```
- Invalid example:
```json
{
  "supported_cpu_arch": ["x86_64"],
  "min_ram_gb": 16,
  "min_storage_gb": 10,
  "supported_os": ["linux"]
}
```
- Why invalid: drops required baseline portability profile.

### 4.8 `storage_locality_policy`
- Required fields:
  - `owner_data_local_by_default` boolean (must be `true`)
  - `outbound_network_for_owner_data_default` boolean (must be `false`)
  - `explicit_owner_configuration_required_for_data_egress` boolean (must be `true`)
  - `memory_inspectable_without_runtime` boolean (must be `true`)
  - `required_storage_capabilities` array containing:
    - `read`
    - `write`
    - `search`
    - `version`
- Optional fields:
  - `open_format_preferred` boolean (default `true`)
- Defaults:
  - `open_format_preferred=true`
- Forbidden fields:
  - `opaque_owner_data_store_required`
- Error shape:
  - pre-stream/startup: `deployment_policy_error` with `code=invalid_storage_locality_policy`
  - mid-stream: data egress violations map to security/deployment failures
- Valid example:
```json
{
  "owner_data_local_by_default": true,
  "outbound_network_for_owner_data_default": false,
  "explicit_owner_configuration_required_for_data_egress": true,
  "memory_inspectable_without_runtime": true,
  "required_storage_capabilities": ["read", "write", "search", "version"],
  "open_format_preferred": true
}
```
- Invalid example:
```json
{
  "owner_data_local_by_default": false,
  "outbound_network_for_owner_data_default": true,
  "explicit_owner_configuration_required_for_data_egress": false,
  "memory_inspectable_without_runtime": false,
  "required_storage_capabilities": ["read", "write"]
}
```
- Why invalid: breaks local-data and inspectability guarantees.

### 4.9 `dependency_escape_profile`
- Required fields:
  - `critical_dependencies` array containing:
    - `model_provider`
    - `container_runtime`
  - `escape_paths_defined` boolean (must be `true`)
  - `dependency_lockin_classification` enum: `dependency_present_but_escapable`
- Optional fields:
  - `non_critical_dependencies` array
- Defaults:
  - none
- Forbidden fields:
  - `single_provider_hard_dependency`
- Error shape:
  - pre-stream/startup: `deployment_policy_error` with `code=invalid_dependency_escape_profile`
  - mid-stream: dependency failures map to classified runtime errors
- Valid example:
```json
{
  "critical_dependencies": ["model_provider", "container_runtime"],
  "escape_paths_defined": true,
  "dependency_lockin_classification": "dependency_present_but_escapable",
  "non_critical_dependencies": ["internet_connectivity", "tool_protocol", "implementation_runtime"]
}
```
- Invalid example:
```json
{
  "critical_dependencies": ["single_cloud_provider"],
  "escape_paths_defined": false,
  "dependency_lockin_classification": "hard_lockin"
}
```
- Why invalid: no defined escape paths for critical dependencies.

### 4.10 `update_safety_policy`
- Required fields:
  - `owner_data_must_survive_updates` boolean (must be `true`)
  - `rollback_path_required` boolean (must be `true`)
  - `update_can_delete_owner_data` boolean (must be `false`)
- Optional fields:
  - `artifact_integrity_verification_supported` boolean (default `true`)
  - `verification_methods` array containing any of:
    - `signature`
    - `checksum`
    - `reproducible_build`
- Defaults:
  - `artifact_integrity_verification_supported=true`
- Forbidden fields:
  - `non_reversible_update_only`
- Error shape:
  - pre-stream/deploy-time: `deployment_policy_error` with `code=invalid_update_safety_policy`
  - mid-stream: not applicable
- Valid example:
```json
{
  "owner_data_must_survive_updates": true,
  "rollback_path_required": true,
  "update_can_delete_owner_data": false,
  "artifact_integrity_verification_supported": true,
  "verification_methods": ["signature", "checksum"]
}
```
- Invalid example:
```json
{
  "owner_data_must_survive_updates": false,
  "rollback_path_required": false,
  "update_can_delete_owner_data": true
}
```
- Why invalid: violates update safety guarantees.

### 4.11 `startup_readiness_profile`
- Required fields:
  - `deterministic_startup_order_required` boolean (must be `true`)
  - `required_startup_phases` array exactly:
    - `runtime_config`
    - `adapter_config`
    - `tools`
    - `memory`
    - `preferences`
    - `ready`
  - `critical_startup_fail_fast` boolean (must be `true`)
  - `day_one_export_and_persistence_required` boolean (must be `true`)
- Optional fields:
  - `localhost_default_bind_expected` boolean (default `true`)
- Defaults:
  - `localhost_default_bind_expected=true`
- Forbidden fields:
  - `best_effort_startup_for_critical_guarantees`
- Error shape:
  - pre-stream/startup: readiness failure blocks ready state
  - mid-stream: not applicable
- Valid example:
```json
{
  "deterministic_startup_order_required": true,
  "required_startup_phases": ["runtime_config", "adapter_config", "tools", "memory", "preferences", "ready"],
  "critical_startup_fail_fast": true,
  "day_one_export_and_persistence_required": true,
  "localhost_default_bind_expected": true
}
```
- Invalid example:
```json
{
  "deterministic_startup_order_required": false,
  "required_startup_phases": ["memory", "ready"],
  "critical_startup_fail_fast": false,
  "day_one_export_and_persistence_required": false
}
```
- Why invalid: violates startup-readiness contract.

### 4.12 Communication Patterns
- Startup pattern:
  - deployment readiness is validated through deterministic startup phase sequence and fail-fast checks.
- Runtime pattern:
  - network exposure remains local by default; remote exposure is explicit override.
- Update pattern:
  - deployment updates are executed under data-preservation and rollback constraints.

---

## 5. Behavior Specification

### 5.1 Startup and Readiness Behavior
1. Load runtime and adapter configuration.
2. Discover tools and initialize Memory surfaces.
3. Load preferences and resolve runtime bindings.
4. Validate deployment readiness guarantees (phase order, critical dependencies).
5. Enter ready state only when required guarantees are satisfied.
6. Fail clearly on unsupported adapter and critical startup-readiness violations.

### 5.2 Offline Operation Behavior
- Local model endpoint path is supported and deployable.
- Basic interaction loop remains functional without internet.
- External API-dependent tools are optional and do not invalidate offline contract.

### 5.3 Network Exposure Behavior
- Default bind is loopback-only.
- Public/network exposure requires explicit owner configuration.
- Automatic network publication is disabled by default.

### 5.4 Data Locality Behavior
- Memory, conversations, auth state, and preferences remain local by default.
- Data egress requires explicit owner configuration.
- Owner can inspect Memory data without runtime stack.

### 5.5 Update Safety Behavior
- Updates must not delete or corrupt owner data.
- Revert path to prior working deployment must be available.
- Artifact authenticity/integrity verification should be available.

### 5.6 Edge Cases
- Runtime bind explicitly configured to `0.0.0.0` for container profile.
- Local model server unavailable in offline mode.
- Unsupported adapter configured at startup.
- Deployment attempts to run with missing export/history guarantees.

---

## 6. Dependencies & Interactions

### External Dependencies
- Model provider runtime (local or cloud endpoint).
- Container runtime/tooling (implementation choice, non-exclusive).
- Operating system environment with local storage and networking stack.

### Internal Interactions
- Configuration determines bind address, adapter selection, and tool sources.
- Gateway runtime host/port binding enforces or overrides exposure posture.
- Models/Model API boundaries enforce local/cloud model endpoint behavior.
- Security boundary enforces safe exposure and failure handling.
- Memory boundary enforces local inspectable owner data guarantees.

### Data Flow
1. Deployment profile selects local baseline runtime.
2. Startup sequence resolves config/adapters/tools/memory/preferences.
3. Gateway binds to configured host/port with local-default expectations.
4. Model adapter calls configured endpoint (local or cloud by owner choice).
5. Owner data remains local unless explicitly configured external egress exists.

### Dependency Assumptions
- Local runtime path is always possible.
- Dependency escape paths are documented and testable.
- Deployment posture changes do not alter architecture ownership boundaries.

---

## 7. Invariants & Rules

### Deployment Invariants
- System runs on owner-controlled hardware (`D-01`).
- Fully offline functional path exists (`D-02`).
- Default network posture is localhost-only (`D-03`).
- Single-unit deployment remains default (`D-04`).

### Startup Invariants
- Startup order is deterministic (`D-06`).
- Critical startup guarantees fail fast (`D-05`, `D-07` alignment).
- Export and persistent conversation support exist from day one (`D-07`).

### Lock-In Invariants
- No hidden remote-infrastructure requirement for baseline operation.
- Provider/model path remains swappable with config/adapters.
- Deployment choice does not introduce extra APIs or components.

### Validation Rules
- Reject deployment profiles that require cloud dependency for baseline loop.
- Reject default public bind posture.
- Reject deployments that cannot preserve owner data across updates.
- Reject silent degradation for critical startup-readiness failures.

---

## 8. Non-Functional Requirements

### Performance
- Local baseline should not impose unnecessary network hops.
- Startup readiness checks should be deterministic and bounded.

### Scalability
- Baseline must support single-unit operation; split deployments remain optional.
- Additional deployment profiles should not require boundary rewrites.

### Reliability
- Clear failure on unsupported adapters or critical readiness violations.
- Stable startup sequencing under repeated restarts.
- Offline local model path remains operationally testable.

### Security
- Localhost-only default exposure.
- No default outbound owner-data egress.
- Verifiable software provenance/integrity mechanisms should be supported.

### Operability
- One-command baseline startup pattern should be possible.
- Deployment health should be auditable through startup phase logs and readiness events.

---

## 9. Implementation Notes (Language-Agnostic)

### Recommended Patterns
- Separate deployment profile from component logic.
- Keep bind defaults loopback-only; require explicit override for broader exposure.
- Include offline-path runbooks and tests in CI.
- Keep deployment packaging open-standard compatible.

### Design Considerations
- Distinguish architecture defaults from implementation profile overrides.
- Keep local mode as baseline, managed/cloud as optional.
- Keep data storage inspectable and exportable regardless of packaging strategy.

### Anti-Patterns to Avoid
- Shipping with network-exposed default bind as hidden standard.
- Requiring cloud model/internet to complete baseline loop.
- Treating deployment config as a request-time control channel.
- Coupling deployment profile to component ownership changes.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `docs/ai/deployment.md`:
  - local-owner deployment posture.
  - offline functional path.
  - localhost-only default network posture.
  - single-unit default deployment.
- `docs/ai/compliance-matrix.md`:
  - `D-01`, `D-02`, `D-03`, `D-04` captured as MUST-level deployment constraints.
  - startup-readiness alignment via `D-05`, `D-06`, `D-07`.
- `docs/ai/build-sequence.md`:
  - startup-readiness and localhost/offline guarantees required before feature claims.
- `docs/ai/accepted-mvp-limits.md`:
  - local docker deployment accepted in MVP.
  - internet-required runtime explicitly disallowed.

### Documented Discrepancies To Reconcile
1. **Localhost default vs runtime sample binds**
   - Primer and architecture require localhost-first default.
   - Implementation evidence contains deployment config example with `bind_address: 0.0.0.0`.
2. **Local Docker-only MVP phrasing vs architecture generality**
   - MVP notes local docker as accepted scope.
   - Architecture remains packaging/runtime-agnostic for local owner-controlled deployment.
3. **Startup-readiness ownership overlap**
   - Deployment references startup guarantees that are also cross-cutting with Configuration/Memory.

### Rebuild Guidance When Sources Diverge
- Treat deployment boundary defaults as normative.
- Treat non-localhost bind examples as explicit profile overrides, not defaults.
- Keep startup-readiness responsibilities linked but ownership-specific across Deployment, Configuration, and Memory.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- `deployment-spec.md`:
  - owner-controlled hardware baseline.
  - full offline path availability.
  - localhost-only default network posture.
  - single-unit default deployment.
  - local data by default and inspectability guarantees.
- `foundation-spec.md`:
  - deployment does not alter four components/two APIs structure.
- `configuration-spec.md`:
  - deployment relies on explicit runtime config rather than hidden channels.
- `security-spec.md`:
  - exposure defaults and trust considerations align with secure baseline posture.

### Documented Discrepancies To Reconcile
1. **Default bind in implementation evidence**
   - Human spec requires localhost default.
   - Sample runtime config currently includes `0.0.0.0`, which broadens exposure.
2. **Storage mechanism examples**
   - Human spec mentions filesystem + SQLite as implementation examples.
   - Current evidence emphasizes memory-root filesystem with markdown conversation artifacts.
3. **Software trust mechanisms**
   - Human spec requires verifiable authenticity but does not prescribe one mechanism.
   - Current implementation evidence may vary in explicit verification tooling.

### Rebuild Guidance When Sources Diverge
- Preserve human deployment guarantees as authoritative.
- Treat implementation runtime config values as profile-specific evidence.
- Keep verification mechanism flexible while enforcing integrity-verification availability.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| DEP-CF-001 | Deployment docs require localhost-only default; implementation sample `build/config.json` shows `bind_address: 0.0.0.0` | Treat localhost-only as normative default; treat `0.0.0.0` as explicit deployment override/profile example | Preserves architecture safety default while acknowledging current profile evidence | Runtime may ship unintentionally network-exposed by default |
| DEP-CF-002 | AI accepted limits say local Docker deployment only for MVP; human deployment contract is runtime-agnostic local owner-controlled | Keep runtime-agnostic local contract as architecture authority; local Docker-only remains MVP implementation scope | Avoids narrowing architecture to one packaging choice | Future non-docker local deployments may be wrongly considered invalid |
| DEP-CF-003 | Human storage examples include filesystem + SQLite; current evidence emphasizes filesystem/markdown surfaces | Keep storage capability contract (read/write/search/version + inspectability) as normative; mechanisms are implementation choices | Maintains flexibility without losing guarantees | Implementation lock-in to one storage format |
| DEP-CF-004 | Software trust is required but mechanism unspecified in architecture | Require integrity-verification capability, allow signatures/checksums/reproducible-build approaches | Enforces trust goal without overprescribing tooling | Supply-chain integrity may be inconsistently implemented |
| DEP-CF-005 | Startup-readiness rules appear in multiple boundaries (Deployment, Configuration, Memory) | Keep shared invariants with explicit ownership mapping in traceability | Prevents duplication conflicts and missing checks | Readiness checks can become fragmented or incomplete |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST
- `DEP-MUST-001`: Deployment MUST support operation on owner-controlled hardware.
- `DEP-MUST-002`: A fully offline functional path MUST exist.
- `DEP-MUST-003`: Default network posture MUST be localhost-only.
- `DEP-MUST-004`: Baseline deployment MUST be single-unit by default.
- `DEP-MUST-005`: Owner data MUST remain local by default unless explicitly configured otherwise.
- `DEP-MUST-006`: Baseline operation MUST NOT require hidden remote infrastructure.
- `DEP-MUST-007`: Startup order MUST be deterministic (`runtime_config -> adapter_config -> tools -> memory -> preferences -> ready`).
- `DEP-MUST-008`: Critical startup readiness failures MUST fail fast (no best-effort continuation).
- `DEP-MUST-009`: Day-one export and persistent conversation path availability MUST be preserved.
- `DEP-MUST-010`: Unsupported adapter selection MUST fail clearly.
- `DEP-MUST-011`: Deployment profile changes MUST NOT alter core component/API ownership boundaries.
- `DEP-MUST-012`: Update process MUST preserve owner data.
- `DEP-MUST-013`: Deployment update path MUST support rollback/reversion.
- `DEP-MUST-014`: Remote/network exposure MUST require explicit owner action.

### SHOULD
- `DEP-SHOULD-001`: Implementations SHOULD provide at least one documented Docker-local offline model option.
- `DEP-SHOULD-002`: Implementations SHOULD support artifact integrity verification mechanisms.
- `DEP-SHOULD-003`: Implementations SHOULD include automated deployment posture checks in CI.

### MAY
- `DEP-MAY-001`: Implementations MAY support managed hosting as an optional profile.
- `DEP-MAY-002`: Implementations MAY support split-component deployment profiles when single-unit default remains intact.

## 14. Acceptance Gates (Pass/Fail)

- `DEP-GATE-01 Contract Gate`: Pass if all deployment interfaces validate against `contracts/Deployment.schema.json`; fail otherwise.
- `DEP-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Deployment-conformance.md` pass (14 positive + 14 negative); fail on any `DEP-MUST-*` failure.
- `DEP-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Deployment-drift-guard.md` pass; fail on any Critical check failure.
- `DEP-GATE-04 Exposure Gate`: Pass if default bind posture is localhost-only unless explicit override profile is selected.
- `DEP-GATE-05 Readiness Gate`: Pass if deterministic startup phases and day-one persistence/export guarantees hold.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| DEP-MUST-001 | Human `deployment-spec.md`; AI matrix `D-01` | `DEP-T001P`, `DEP-T001N` |
| DEP-MUST-002 | Human `deployment-spec.md`; AI matrix `D-02` | `DEP-T002P`, `DEP-T002N` |
| DEP-MUST-003 | Human `deployment-spec.md`; AI matrix `D-03` | `DEP-T003P`, `DEP-T003N` |
| DEP-MUST-004 | Human `deployment-spec.md`; AI matrix `D-04` | `DEP-T004P`, `DEP-T004N` |
| DEP-MUST-005 | Human `deployment-spec.md`; AI `deployment.md` | `DEP-T005P`, `DEP-T005N` |
| DEP-MUST-006 | Human `deployment-spec.md` dependency contract | `DEP-T006P`, `DEP-T006N` |
| DEP-MUST-007 | AI matrix `D-06`; `build-sequence.md`; human `configuration-spec.md` | `DEP-T007P`, `DEP-T007N` |
| DEP-MUST-008 | AI matrix `D-05`; human startup/readiness guarantees | `DEP-T008P`, `DEP-T008N` |
| DEP-MUST-009 | AI matrix `D-07`; human deployment + memory guarantees | `DEP-T009P`, `DEP-T009N` |
| DEP-MUST-010 | AI checklist `configuration-review.md`; implementation readiness evidence | `DEP-T010P`, `DEP-T010N` |
| DEP-MUST-011 | Human `foundation-spec.md`; AI matrix `F-01`, `F-02` | `DEP-T011P`, `DEP-T011N` |
| DEP-MUST-012 | Human `deployment-spec.md` update principles | `DEP-T012P`, `DEP-T012N` |
| DEP-MUST-013 | Human `deployment-spec.md` update reversibility | `DEP-T013P`, `DEP-T013N` |
| DEP-MUST-014 | Human `deployment-spec.md` network posture; AI `deployment.md` | `DEP-T014P`, `DEP-T014N` |

## 16. Residual Risks & Open Decisions

- `DEP-RISK-001 (Medium)`: Sample runtime profiles may drift toward non-localhost binds if defaults are not enforced in CI.
- `DEP-RISK-002 (Medium)`: Offline path can silently regress if local-model path testing is not continuous.
- `DEP-RISK-003 (Low)`: Integrity verification remains under-specified if implementation docs do not standardize one baseline method.
- `DEP-RISK-004 (Low)`: Multi-profile deployment expansions can introduce hidden infrastructure assumptions.
- `DEP-DECISION-OPEN-001`: Standardize explicit profile naming for localhost-default vs exposed-container modes.
- `DEP-DECISION-OPEN-002`: Define minimum required artifact verification method for release gates.

## Related Blueprint Artifacts

- `Configuration` defines startup order, runtime config boundaries, and config layering:
  - `blueprints/Configuration.md`
  - `blueprints/contracts/Configuration.schema.json`
  - `blueprints/tests/Configuration-conformance.md`
  - `blueprints/drift/Configuration-drift-guard.md`
  - `blueprints/prompts/implement-Configuration.md`
- `Models` and `Model-API` define model endpoint and adapter swappability behavior used by deployment profiles:
  - `blueprints/Models.md`
  - `blueprints/Model-API.md`
  - `blueprints/contracts/Models.schema.json`
  - `blueprints/contracts/Model-API.schema.json`
- `Security` defines exposure and safe-failure constraints deployment must preserve:
  - `blueprints/Security.md`
  - `blueprints/contracts/Security.schema.json`
  - `blueprints/tests/Security-conformance.md`
  - `blueprints/drift/Security-drift-guard.md`
  - `blueprints/prompts/implement-Security.md`
- Overlap precedence:
  - deployment posture and hosting defaults resolve to `Deployment`; payload and event contracts resolve to their respective component/API artifacts.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/config.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/config.json`
  - `/home/hex/Project/PAA-MVP-Prod/build/gateway/server.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/test/runtime.test.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/README.md`
  - `/home/hex/Project/PAA-MVP-Prod/build/How-to-Use.md`
  - `/home/hex/Project/PAA-MVP-Prod/build/Getting-Started.md`
  - `/home/hex/Project/PAA-MVP-Prod/build/FINAL-REPORT.md`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 10 (`deployment_boundary_profile`, `owner_control_posture`, `offline_function_profile`, `network_exposure_policy`, `single_unit_deployment_profile`, `hardware_support_profile`, `storage_locality_policy`, `dependency_escape_profile`, `update_safety_policy`, `startup_readiness_profile`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 5/5 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: canonical profile policy for default bind values across local-dev/containerized distributions is not yet standardized.
- Final readiness rating: Conditionally Ready
