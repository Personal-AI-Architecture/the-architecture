# Memory Tool Surface Blueprint Specification

## 1. Overview

### Purpose
Memory Tools define the always-present operational surface used to read, write, search, version, and export owner memory through bounded, auditable, approval-aware operations.

### High-Level Responsibilities
- Define the mandatory memory operation surface (`read`, `write`, `edit`, `delete`, `list`, `search`, `history`, `export`) as language-agnostic contracts.
- Enforce path-safety, reserved-path protection, and memory-root confinement.
- Define approval and audit behaviors for mutating memory operations.
- Define failure taxonomy and safe error behavior for memory tool execution.
- Preserve the Memory boundary so components and model paths access memory through tools/boundaries, not direct storage reach-in.

### System Context
- Memory Tools are a capability boundary, not a standalone architecture component.
- Memory Tools are executed by Engine and permissioned by Auth.
- Memory Tools sit in front of the Memory substrate and are required for day-one MVP guarantees (export/history/persistence readiness).
- Memory Tools align with Tools capability rules while specializing the mandatory memory-facing surface.

---

## 2. Scope Definition

### What Memory Tools **are**
- The canonical operation interface for owner memory access.
- A contract pack for mandatory memory verbs and their inputs/outputs/failures.
- The enforcement point for memory-path validation and mutation approvals.
- A portability-preserving boundary between callers and underlying storage mechanisms.

### What Memory Tools **are not**
- Not the Memory component itself (they operate on Memory; they do not own Memory as a component).
- Not a third API surface.
- Not a replacement for Auth authorization.
- Not a replacement for Gateway conversation lifecycle ownership.
- Not product workflow logic or prompt-layer policy text.

### Boundaries and Constraints
- Must remain callable as tools/boundaries, regardless of backend storage technology.
- Must preserve open-format export/version guarantees.
- Must reject path escapes and reserved internals access.
- Must keep mutating actions approval-aware and auditable.
- Must avoid introducing direct storage access paths in Gateway/Engine/Auth.

---

## 3. Core Concepts & Terminology

### Key Domain Concepts
- **Memory Root**: canonical owner-controlled storage root for runtime memory.
- **Reserved Memory Internals**: protected internal paths (for example version-control internals) that tools must not expose.
- **Mutating Memory Operation**: operation that changes persisted state (`write`, `edit`, `delete`).
- **Read-Only Memory Operation**: operation that inspects state (`read`, `list`, `search`, `history`, `export` request).
- **Versioned Change Record**: history entry with commit metadata and optional prior state.
- **Export Archive**: owner-portable archive of memory surface.

### Internal Concepts
- **Path Resolution Guard**: normalization + confinement check to keep access inside memory root.
- **Reserved-Path Guard**: explicit block for protected internals.
- **Secret Redaction Pass**: output sanitization for search lines.
- **Approval Gate Event Flow**: contract-visible approval request/result around mutation operations.

### External Concepts
- **Tool Source Registration**: runtime discovery path that makes memory tools available.
- **Actor Permission Context**: Auth-derived permission set used before execution.
- **Contract-Visible Stream Events**: `tool-call`, `tool-result`, `approval-request`, `approval-result`, `error`, `done`.

### Terminology
- **Memory Tool Surface**: mandatory memory-facing tool contract set.
- **Path Escape**: requested path that resolves outside memory root.
- **History Prior State**: optional reconstructed file content at a historical point.
- **Day-One Readiness**: startup condition where memory tools and required support paths are available before service-ready state.

---

## 4. Interfaces & Contracts

### 4.1 Canonical Contract Pack
- Schema file: `blueprints/contracts/Memory-Tools.schema.json`
- Contract interfaces:
  - `memory_tool_definition`
  - `memory_path_policy`
  - `memory_tool_failure`
  - `memory_read_input` / `memory_read_output`
  - `memory_write_input` / `memory_write_output`
  - `memory_edit_input` / `memory_edit_output`
  - `memory_delete_input` / `memory_delete_output`
  - `memory_list_input` / `memory_list_output`
  - `memory_search_input` / `memory_search_output`
  - `memory_history_input` / `memory_history_output`
  - `memory_export_input` / `memory_export_output`

### 4.2 `memory_tool_definition`
- Required fields:
  - `name` enum: `memory_read | memory_write | memory_edit | memory_delete | memory_list | memory_search | memory_history | memory_export`
  - `description` (string, non-empty)
  - `read_only` (boolean)
  - `requires_approval` (boolean)
  - `input_schema` (object)
- Optional fields:
  - `source_id` (string)
  - `timeout_ms` (positive integer)
- Defaults: none.
- Forbidden fields:
  - `provider`, `model`, `api_key`, `token`, `secret_value`, `auth_policy_override`
- Error shape:
  - pre-stream/startup: invalid definition -> `memory_tool_failure` (`code=invalid_definition`)
  - mid-stream: unknown/malformed call -> stream `error` (`code=tool_error`)
- Valid example:
```json
{
  "name": "memory_write",
  "description": "Write a file inside memory root",
  "read_only": false,
  "requires_approval": true,
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "content": { "type": "string" }
    },
    "required": ["path", "content"]
  }
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
- Why invalid: missing `input_schema`; forbidden provider field.

### 4.3 `memory_path_policy`
- Required fields:
  - `memory_root` (string, non-empty)
  - `reserved_roots` (string array, non-empty; includes `.git`)
  - `block_escape` (boolean, must be `true`)
- Optional fields:
  - `allow_absolute_in_root` (boolean, default `true`)
- Defaults:
  - `allow_absolute_in_root=true`
- Forbidden behavior:
  - allowing resolved relative paths that escape memory root
- Error shape:
  - pre-stream/startup: invalid policy -> `memory_tool_failure` (`code=invalid_policy`)
  - mid-stream: invalid path request -> `memory_tool_failure` (`code=path_invalid | reserved_path`)
- Valid example:
```json
{
  "memory_root": "/owner/memory",
  "reserved_roots": [".git"],
  "block_escape": true,
  "allow_absolute_in_root": true
}
```
- Invalid example:
```json
{
  "memory_root": "/owner/memory",
  "reserved_roots": [],
  "block_escape": false
}
```
- Why invalid: required safety invariants are broken.

### 4.4 `memory_tool_failure`
- Required fields:
  - `code` enum: `not_found | path_invalid | reserved_path | invalid_input | permission_denied | execution_failed | invalid_definition | invalid_policy`
  - `message` (string 1-240)
  - `recoverable` (boolean)
- Optional fields:
  - `details` (object)
- Defaults: none.
- Forbidden behavior:
  - stack traces, secret-bearing substrings, raw provider payloads in `message`
- Error shape:
  - pre-stream: startup/config/definition/policy errors
  - mid-stream: tool-result error payload and possibly stream `error` for unrecoverable failures
- Valid example:
```json
{
  "code": "path_invalid",
  "message": "Path escapes memory root",
  "recoverable": true
}
```
- Invalid example:
```json
{
  "code": "execution_failed",
  "message": "Error: EACCES at /srv/memory-tools/server.ts:91",
  "recoverable": false
}
```
- Why invalid: unsafe internal detail leakage.

### 4.5 `memory_read_input` and `memory_read_output`
- Input required fields:
  - `path` (string)
- Input optional fields: none.
- Input defaults: none.
- Output required fields:
  - `path` (resolved path string)
  - `content` (string)
- Output optional fields: none.
- Forbidden fields:
  - input: runtime override fields (`memory_root`, `provider`, `tool_sources`)
- Error behavior:
  - pre-stream: malformed call rejected as invalid request
  - mid-stream: failure as `memory_tool_failure`
- Valid example:
```json
{
  "path": "documents/spec.md"
}
```
- Invalid example:
```json
{
  "path": "../outside.md"
}
```
- Why invalid: path escapes memory root.

### 4.6 `memory_write_input` and `memory_write_output`
- Input required fields:
  - `path` (string)
  - `content` (string)
- Input optional fields: none.
- Output required fields:
  - `path` (resolved path string)
  - `bytes_written` (integer >= 0)
- Output optional fields: none.
- Forbidden fields:
  - input: `overwrite_policy`, `approval_bypass`
- Approval behavior:
  - requires approval before execution.
- Error behavior:
  - pre-stream: malformed call rejected
  - mid-stream: `memory_tool_failure` for execution/path/permission failures
- Valid example:
```json
{
  "path": "documents/spec.md",
  "content": "# Spec"
}
```
- Invalid example:
```json
{
  "path": ".git/config",
  "content": "unsafe"
}
```
- Why invalid: reserved memory internals are blocked.

### 4.7 `memory_edit_input` and `memory_edit_output`
- Input required fields:
  - `path` (string)
  - `find` (string)
  - `replace` (string)
- Input optional fields: none.
- Output required fields:
  - `path` (resolved path string)
  - `updated` (boolean)
- Output optional fields: none.
- Forbidden behavior:
  - empty or absent `find` must not silently no-op when match is required
- Approval behavior:
  - requires approval before execution.
- Error behavior:
  - pre-stream: malformed call rejected
  - mid-stream: unmatched edit target -> `invalid_input`
- Valid example:
```json
{
  "path": "documents/spec.md",
  "find": "v1",
  "replace": "v2"
}
```
- Invalid example:
```json
{
  "path": "documents/spec.md",
  "find": "missing token",
  "replace": "v2"
}
```
- Why invalid: edit target not found.

### 4.8 `memory_delete_input` and `memory_delete_output`
- Input required fields:
  - `path` (string)
- Input optional fields: none.
- Output required fields:
  - `path` (resolved path string)
  - `deleted` (boolean)
- Output optional fields: none.
- Forbidden behavior:
  - deleting reserved internals or escaped paths
- Approval behavior:
  - requires approval before execution.
- Error behavior:
  - pre-stream: malformed call rejected
  - mid-stream: path/policy/permission failures as classified errors
- Valid example:
```json
{
  "path": "documents/tmp.txt"
}
```
- Invalid example:
```json
{
  "path": "../outside.txt"
}
```
- Why invalid: path escapes memory root.

### 4.9 `memory_list_input` and `memory_list_output`
- Input required fields: none.
- Input optional fields:
  - `path` (string, default `"."`)
- Output required fields:
  - `path` (resolved path string)
  - `entries` (string array)
- Output optional fields: none.
- Defaults:
  - input path default `"."`
- Forbidden behavior:
  - listing reserved internals as visible entries
- Error behavior:
  - pre-stream: malformed call rejected
  - mid-stream: path/policy failures classified
- Valid example:
```json
{
  "path": "."
}
```
- Invalid example:
```json
{
  "path": ".git"
}
```
- Why invalid: reserved root must be blocked.

### 4.10 `memory_search_input` and `memory_search_output`
- Input required fields:
  - `query` (string, non-empty)
- Input optional fields:
  - `path` (string, default `"."`)
  - `include_conversations` (boolean, default `false`)
- Output required fields:
  - `query` (string)
  - `include_conversations` (boolean)
  - `matches` (array of `{ path, line, content }`)
- Output optional fields: none.
- Defaults:
  - `path="."`
  - `include_conversations=false`
- Forbidden behavior:
  - empty query accepted
  - secret-like token output without redaction in search content
- Error behavior:
  - pre-stream: malformed call rejected
  - mid-stream: empty query -> `invalid_input`; path/policy failures classified
- Valid example:
```json
{
  "query": "project",
  "path": "documents"
}
```
- Invalid example:
```json
{
  "query": ""
}
```
- Why invalid: query must not be empty.

### 4.11 `memory_history_input` and `memory_history_output`
- Input required fields:
  - `path` (string)
- Input optional fields:
  - `commit` (string)
- Output required fields:
  - array of entries, each containing:
    - `commit` (string)
    - `message` (string)
    - `timestamp` (date-time string)
    - `path` (string)
- Output optional fields:
  - `previous_state` (string)
- Defaults:
  - when `commit` omitted, all history entries may include `previous_state`.
- Forbidden behavior:
  - metadata-only history responses with no ability to include prior states
- Error behavior:
  - pre-stream: malformed call rejected
  - mid-stream: path/policy/history backend errors classified
- Valid example:
```json
{
  "path": "documents/spec.md"
}
```
- Invalid example:
```json
{
  "path": "../outside.md"
}
```
- Why invalid: path escapes memory root.

### 4.12 `memory_export_input` and `memory_export_output`
- Input required fields: none.
- Input optional fields: none.
- Output required fields:
  - `archive_path` (string)
- Output optional fields: none.
- Defaults: none.
- Forbidden behavior:
  - returning external/unowned archive location by default
- Error behavior:
  - pre-stream: malformed call rejected
  - mid-stream: archive generation errors classified
- Valid example:
```json
{}
```
- Invalid example:
```json
{
  "destination": "/tmp/external.tar.gz"
}
```
- Why invalid: destination override is off-contract.

---

## 5. Behavior Specification

### 5.1 Startup and Availability
1. Runtime discovers tool sources.
2. Memory tool definitions are registered as part of available tool surface.
3. Startup ensures memory root layout and required directories (`conversations`, `documents`, `preferences`, `exports`) exist.
4. Startup ensures version-history readiness before ready-state.
5. System becomes ready only after tools + memory initialization succeed in deterministic order.

### 5.2 Path Resolution and Safety
- All memory operation paths are resolved relative to memory root unless valid absolute paths are already inside memory root.
- Any resolved path outside memory root is rejected as `path_invalid`.
- Reserved internals (for example `.git`) are blocked and rejected as `reserved_path`.
- List/search traversal excludes reserved internals.

### 5.3 Operation Behavior
- `memory_read`: returns file content at resolved path.
- `memory_write`: creates/overwrites file content; returns bytes written.
- `memory_edit`: replace-first-match behavior with explicit not-found failure when target text missing.
- `memory_delete`: removes file/folder path recursively where permitted.
- `memory_list`: lists directory entries with directory suffix formatting.
- `memory_search`: traverses files, returns line-level matches, redacts secret-like tokens.
- `memory_history`: returns git-backed change records and optional `previous_state`.
- `memory_export`: produces export archive path under memory-owned export location.

### 5.4 Approval and Authorization Flow
1. Model issues tool call.
2. Auth permission check gates execution.
3. If operation is mutating (`write/edit/delete`), approval-request is emitted.
4. Operation executes only on explicit `approved` decision.
5. Denied decisions produce `tool-result` with denied status.

### 5.5 Audit and Versioning Behavior
- Mutating operations emit structured `memory.write` audit events.
- History operations emit `memory.history` audit events.
- Export operations emit `memory.export` audit events.
- Mutating operations create version commits with path-scoped commit message semantics.

### 5.6 Edge Cases and Error Handling
- Empty search query returns classified `invalid_input`.
- Edit target not found returns classified `invalid_input`.
- Permission-denied filesystem errors are mapped to `permission_denied`.
- Not-found filesystem errors are mapped to `not_found`.
- Unexpected runtime failures are mapped to `execution_failed`.
- Unrecoverable failures may escalate to stream `error` classification via Engine contract.

---

## 6. Dependencies & Interactions

### External/Runtime Dependencies
- Filesystem APIs for file and directory operations.
- Version history backend for commit/history/restore state.
- Archive tooling for export generation.

### Component Interactions
- **Engine -> Memory Tools**: executes tool calls and returns results to model.
- **Auth -> Memory Tools**: permissions checked before execution.
- **Memory Tools -> Memory Substrate**: reads/writes/search/history/export across storage classes.
- **Gateway -> Conversation Store Boundary**: conversation persistence through approved memory boundary/tool path.
- **Security -> Memory Tools**: approval enforcement, safe errors, audit requirements.

### Data Flow
1. Runtime config enables memory-tool sources.
2. Engine includes available memory tool definitions in model context.
3. Model emits memory tool call.
4. Auth checks permission.
5. Approval gate (if mutating) resolves decision.
6. Tool executes against memory root.
7. Classified result/failure returns through stream and model loop.

### Dependency Assumptions
- Memory root exists and is writable according to deployment policy.
- Auth context is attached on protected request path.
- Version backend is initialized per startup-readiness requirements.
- Tool execution environment has required file/archive capabilities.

---

## 7. Invariants & Rules

- Memory Tool Surface must always include: `memory_read`, `memory_write`, `memory_edit`, `memory_delete`, `memory_list`, `memory_search`, `memory_history`, `memory_export`.
- Mutating operations (`write/edit/delete`) must require approval.
- Read/list/search/history/export operations are read-only by default and must not require approval.
- All path-bearing operations must enforce memory-root confinement.
- Reserved internal roots (at minimum `.git`) must never be reachable via memory tools.
- Search must reject empty queries.
- Search output must redact secret-like token patterns.
- History must support prior-state availability through `previous_state`.
- Export must return owner-readable archive path within memory-owned export surface.
- Components must not bypass memory tools/boundaries for direct storage access.

---

## 8. Non-Functional Requirements

### Performance Expectations
- File operations should execute within bounded latency on local storage.
- Search traversal should be bounded by requested path scope and safe traversal guards.
- History/export should avoid unbounded memory spikes and surface failures explicitly.

### Scalability Considerations
- Surface must stay stable while storage backends evolve (files + structured/queryable stores).
- Operation contracts must remain backend-agnostic and language-agnostic.
- Search/history/export behavior must remain deterministic under growing memory size.

### Reliability and Fault Tolerance
- Startup must fail clearly when version-history guarantees cannot be established.
- Tool failures must be classified and recoverability-signaled where possible.
- Export should use snapshot-safe behavior to avoid race-induced corruption.

### Security Considerations
- Path escape and reserved-path access must be blocked.
- Mutating operations must remain approval-gated.
- Secret-like content in search results must be sanitized.
- Audit records for memory mutations/history/export must be structured.
- Secrets must not be persisted in normal memory content unless explicitly and safely directed by owner policy.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **Path-policy wrapper** for all path-bearing operations.
- **Operation-specific validation layer** before filesystem/backend calls.
- **Failure-normalization mapper** from runtime errors to contract error taxonomy.
- **Mutation pipeline**: approval -> execute -> audit -> version commit.
- **Traversal guard** for search/list to exclude reserved internals by default.

### Design Considerations
- Keep contracts stable even if backend storage engine changes.
- Keep operation names canonical and discoverable.
- Keep audit correlation IDs propagated through every memory operation.
- Keep export/history available from day one (not deferred hardening).

### Anti-Patterns to Avoid
- Direct component filesystem/database reach-in outside tool boundary.
- Hidden request flags that mutate memory-root or reserved-root policy at runtime.
- Prompt-only approval enforcement for writes.
- Returning raw runtime exception details in tool outputs.
- Best-effort version/export behavior without hard startup/readiness gates.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `M-02`: approved boundary access required (no direct reach-in).
- `M-03`: export surface required.
- `M-04`: history with prior states required.
- `M-05`, `M-06`: memory surface includes required storage classes and conversation/structured data boundaries.
- `D-05`: startup must fail clearly if version-history readiness fails.
- `D-07`: day-one export and persistent conversation path availability.
- `S-03`: approval is coded control for mutations.
- `S-02`: structured audit coverage expected for sensitive operations.

### Primer/Implementation Tensions
- Primer-level memory requirements are broad across storage classes; current runtime evidence emphasizes file operations plus markdown conversation store.
- Primer requires full memory-surface guarantees independent of specific backend choices; current evidence is MVP-focused and should not narrow future surface contracts.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Memory operations are tool-mediated and substrate-oriented (`memory-spec.md`).
- Tools are verbs; memory is data substrate (`tools-spec.md`, `memory-spec.md`).
- Approval for writes must be coded, not prompt-only (`tools-spec.md`, `security-spec.md`).
- Path-safe, exportable, versioned owner data is required (`memory-spec.md`, `security-spec.md`).
- Gateway memory access must follow dedicated memory boundary/tool path (`memory-spec.md`, `gateway-engine-contract.md`).

### Documented Discrepancies To Reconcile
1. **Operation naming flexibility vs canonical `memory_*` names**
   - Human memory spec allows implementation choice for operation names.
   - MVP evidence uses specific canonical names (`memory_read`, etc.).
2. **Self-description vs static registration**
   - Human/tools docs prefer self-describing source behavior.
   - MVP evidence uses static source registry for built-in memory tools.
3. **Storage breadth**
   - Human memory spec includes multiple storage mechanisms/classes.
   - MVP evidence primarily shows file operations and markdown conversations.
4. **Export security profile depth**
   - Human/security docs describe stronger profile options (for example encrypted export support in some deployments).
   - MVP evidence focuses on archive export path and ownership guarantees.

### Rebuild Guidance When Sources Diverge
- Treat human architecture memory ownership and substrate rules as authoritative.
- Treat AI primer matrix rows as conformance gate criteria.
- Treat current implementation shapes as evidence of MVP behavior, not permanent limits.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| MTL-CF-001 | Human memory spec allows operation names as implementation choice; MVP evidence uses fixed `memory_*` names | Keep canonical `memory_*` names as normative for this package while allowing alias mapping as implementation detail | Enables deterministic conformance and adapter portability | Name drift causes incompatible tool catalogs |
| MTL-CF-002 | Human/tools docs emphasize self-describing tool definitions; MVP evidence uses static source map | Keep self-description as architecture target; permit static registration as transitional evidence | Avoids overfitting architecture to MVP internals | Tool onboarding remains code-change dependent |
| MTL-CF-003 | Human memory scope includes multi-backend classes; MVP evidence mostly file-ops + markdown conversations | Keep backend-agnostic contracts and require capability behavior independent of backend | Preserves future storage evolution without contract rewrite | Memory surface narrows to file-only behavior |
| MTL-CF-004 | Security/docs discuss richer export posture options; MVP evidence returns local archive path only | Keep export portability guarantee as MUST; advanced export hardening stays SHOULD/MAY policy layer | Maintains day-one ownership guarantee while allowing profile-specific hardening | Export behavior may diverge across deployments without shared baseline |
| MTL-CF-005 | Search can include conversations by opt-in; some product flows may expect broader default scope | Keep default `include_conversations=false` with explicit opt-in | Reduces accidental overexposure while preserving capability | Unintended conversation leakage in broad searches |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST

- `MTL-MUST-001`: Memory Tool Surface MUST expose `memory_read`, `memory_write`, `memory_edit`, `memory_delete`, `memory_list`, `memory_search`, `memory_history`, and `memory_export`.
- `MTL-MUST-002`: Every path-bearing memory operation MUST enforce memory-root confinement.
- `MTL-MUST-003`: Reserved memory internals MUST be blocked from read/write/edit/delete/list/search/history access.
- `MTL-MUST-004`: Mutating operations (`memory_write`, `memory_edit`, `memory_delete`) MUST require coded approval before execution.
- `MTL-MUST-005`: Mutating operations MUST emit structured memory-write audit records and version commits.
- `MTL-MUST-006`: Read/list/search/history/export operations MUST remain read-only and MUST NOT require approval.
- `MTL-MUST-007`: `memory_search` MUST reject empty queries and default to `include_conversations=false`.
- `MTL-MUST-008`: `memory_search` match content MUST apply secret-like token redaction.
- `MTL-MUST-009`: `memory_history` MUST return change records and support `previous_state` availability.
- `MTL-MUST-010`: `memory_history` path validation MUST use the same confinement/reserved-path policy as file operations.
- `MTL-MUST-011`: `memory_export` MUST return a memory-owned export archive path in open-format-compatible output.
- `MTL-MUST-012`: Memory tool failures MUST be classified (`not_found`, `path_invalid`, `reserved_path`, `invalid_input`, `permission_denied`, `execution_failed`) and safe for exposure.
- `MTL-MUST-013`: Startup readiness MUST include memory-tool availability plus export/history-capable memory surface before ready-state.
- `MTL-MUST-014`: Components MUST access memory through approved memory tool/boundary paths and MUST NOT use direct storage reach-in.

### SHOULD

- `MTL-SHOULD-001`: Implementations SHOULD provide alias compatibility mapping when integrating non-canonical operation names.
- `MTL-SHOULD-002`: Implementations SHOULD expose deterministic audit correlation IDs across all memory tool operations.
- `MTL-SHOULD-003`: Implementations SHOULD support backend evolution (files + structured/queryable stores) without changing external tool contracts.

### MAY

- `MTL-MAY-001`: Implementations MAY add additional memory tools (for example semantic retrieval) if core mandatory surface remains unchanged.
- `MTL-MAY-002`: Implementations MAY add stronger export controls (for example encrypted archives) as deployment profile policy.

## 14. Acceptance Gates (Pass/Fail)

- `MTL-GATE-01 Contract Gate`: Pass if interfaces validate against `contracts/Memory-Tools.schema.json`; fail otherwise.
- `MTL-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Memory-Tools-conformance.md` pass (14 positive + 14 negative); fail on any `MTL-MUST-*` failure.
- `MTL-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Memory-Tools-drift-guard.md` pass; fail on any Critical failure.
- `MTL-GATE-04 Boundary Gate`: Pass if no direct component storage reach-in path bypasses memory tool/boundary controls.
- `MTL-GATE-05 Conflict Gate`: Pass if no unresolved High-risk conflict remains in memory-tool conflict register.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| MTL-MUST-001 | Human `memory-spec.md` core operations; AI `memory.md` | `MTL-T001P`, `MTL-T001N` |
| MTL-MUST-002 | Human `memory-spec.md`, `security-spec.md`; AI matrix `M-02` | `MTL-T002P`, `MTL-T002N` |
| MTL-MUST-003 | Human `memory-spec.md` + runtime reserved internals policy; AI checklist `memory-review.md` | `MTL-T003P`, `MTL-T003N` |
| MTL-MUST-004 | Human `tools-spec.md`, `security-spec.md`; AI matrix `S-03`, `S-05` | `MTL-T004P`, `MTL-T004N` |
| MTL-MUST-005 | Human `memory-spec.md`, `security-spec.md`; AI matrix `S-02`, `M-04` | `MTL-T005P`, `MTL-T005N` |
| MTL-MUST-006 | Human `memory-spec.md`; AI matrix `T-02` ownership alignment | `MTL-T006P`, `MTL-T006N` |
| MTL-MUST-007 | Human operation semantics + MVP evidence; AI security/config guidance | `MTL-T007P`, `MTL-T007N` |
| MTL-MUST-008 | Human `security-spec.md`; AI matrix `S-01` safe output surface | `MTL-T008P`, `MTL-T008N` |
| MTL-MUST-009 | Human `memory-spec.md`; AI matrix `M-04` | `MTL-T009P`, `MTL-T009N` |
| MTL-MUST-010 | Human `memory-spec.md` boundary rules; AI matrix `M-02` | `MTL-T010P`, `MTL-T010N` |
| MTL-MUST-011 | Human `memory-spec.md` export guarantee; AI matrix `M-03`, `D-07` | `MTL-T011P`, `MTL-T011N` |
| MTL-MUST-012 | Human `security-spec.md`; AI matrix `S-01`, `GC-03` | `MTL-T012P`, `MTL-T012N` |
| MTL-MUST-013 | Human `configuration-spec.md` startup order + memory readiness; AI matrix `D-05`, `D-07` | `MTL-T013P`, `MTL-T013N` |
| MTL-MUST-014 | Human `memory-spec.md`, `gateway-spec.md`; AI matrix `M-02`, `G-03` | `MTL-T014P`, `MTL-T014N` |

## 16. Residual Risks & Open Decisions

- `MTL-RISK-001 (Medium)`: Static source registration may constrain pluggable memory-tool ecosystem growth.
- `MTL-RISK-002 (Medium)`: Search redaction patterns may miss novel secret formats unless continuously maintained.
- `MTL-RISK-003 (Medium)`: Backend evolution (structured/queryable layers) may introduce subtle contract parity drift if not continuously tested.
- `MTL-RISK-004 (Low)`: Export path policy can vary by deployment profile and requires explicit profile-level documentation.
- `MTL-DECISION-OPEN-001`: Decide whether canonical operation names are strict-only or alias-friendly in all adapters.
- `MTL-DECISION-OPEN-002`: Define mandatory minimum test corpus for secret redaction patterns in search output.

## Related Blueprint Artifacts

- `Memory` defines substrate ownership, persistence guarantees, and boundary invariants that this tool surface enforces:
  - `blueprints/Memory.md`
  - `blueprints/contracts/Memory.schema.json`
  - `blueprints/tests/Memory-conformance.md`
  - `blueprints/drift/Memory-drift-guard.md`
  - `blueprints/prompts/implement-Memory.md`
- `Tools` defines broader capability boundary rules (discovery, visibility, approval/event taxonomy) that Memory-Tools specializes:
  - `blueprints/Tools.md`
  - `blueprints/contracts/Tools.schema.json`
  - `blueprints/tests/Tools-conformance.md`
  - `blueprints/drift/Tools-drift-guard.md`
  - `blueprints/prompts/implement-Tools.md`
- Overlap precedence:
  - when memory operation contract detail conflicts with broader tool wording, `Memory-Tools` contract precision governs.

## Source Basis

- Human-readable architecture reference: `/home/hex/Reference/the-architecture/docs`
- AI primer layer: `/home/hex/Project/PAA-MVP-Prod/docs/ai`
- Implementation behavior used for blueprint fidelity:
  - `/home/hex/Project/PAA-MVP-Prod/build/memory-tools/file-ops/server.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/memory/paths.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/memory/history.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/memory/export.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/tools.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/tool-error.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/test/runtime.test.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/gateway/server.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 19 (`memory_tool_definition`, `memory_path_policy`, `memory_tool_failure`, plus input/output interfaces for read/write/edit/delete/list/search/history/export)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 5/5 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: strictness policy for operation-name aliases across adapters is not yet standardized.
- Final readiness rating: Conditionally Ready
