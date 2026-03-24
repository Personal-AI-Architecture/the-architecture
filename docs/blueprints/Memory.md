# Memory Component Blueprint Specification

## 1. Overview

### Purpose
Memory is the owner-controlled durable substrate for system data. It preserves inspectable state across component swaps and runtime restarts.

### High-Level Responsibilities
- Persist and retrieve owner data through approved Memory interfaces.
- Provide core Memory operations (`read`, `write`, `edit`, `delete`, `search`, `list`, `history`).
- Host conversation and structured/queryable owner data inside the Memory contract.
- Provide export and history guarantees for owner portability and rollback.
- Enforce path and storage safety boundaries for Memory operations.

### System Context
- Upstream callers:
  - Gateway conversation boundary.
  - Engine tool execution path.
  - Auth state/export path.
- Cross-cutting interactions:
  - Auth controls who can access Memory operations.
  - Security controls constrain secret handling and auditability.
- Architectural position:
  - foundational substrate with zero outward dependency on Gateway, Engine, or Auth.

---

## 2. Scope Definition

### What Memory **is**
- A persistent, inspectable, owner-controlled data substrate.
- A boundary exposing storage capabilities through stable interfaces/tools.
- The system location for conversations, owner files, structured owner data, and version history.
- A portability anchor independent of runtime component swaps.

### What Memory **is not**
- Not model reasoning or content interpretation.
- Not Gateway routing/conversation policy logic.
- Not Auth identity/permission policy ownership.
- Not a transient in-process cache.
- Not a proprietary opaque storage service that blocks owner inspection/export.

### Boundaries and Constraints
- Memory must not depend outward on Gateway, Engine, or Auth modules.
- Non-Memory components must not bypass Memory boundaries with direct storage reach-in.
- Conversation and required structured owner data must not be moved to side stores outside Memory contract.
- Export and history guarantees are required from day one.
- Normal inspectable Memory surfaces must exclude secrets where forbidden.

---

## 3. Core Concepts & Terminology

### Domain Concepts
- **Memory Substrate**: durable storage plane for owner data.
- **Memory Surface**: externally consumable contract interfaces for storage operations.
- **Conversation Boundary**: dedicated Memory interface for conversation lifecycle persistence/retrieval.
- **Owner Data Surface**: files, conversations, structured/queryable owner data, history, and export artifacts.

### Ownership Concepts
- **Your Memory (architectural term)**: owner-controlled local/open-format subset protected as the platform.
- **External Memory (conceptual)**: non-owned remote data sources accessed via tools; not part of Memory component ownership.

### Reliability Concepts
- **Version-History Readiness**: startup invariant that history mechanism is operational before ready state.
- **Durability**: writes survive process lifecycle and are retrievable later.
- **Inspectability**: owner can inspect data without full runtime stack.

### Safety Concepts
- **Path Sandbox**: path resolution that enforces memory root boundaries and reserved path blocks.
- **Boundary Bypass Drift**: direct non-contract storage access from other components.
- **Secret Leakage**: credentials/tokens appearing in normal inspectable Memory content.

---

## 4. Interfaces & Contracts

### 4.1 Core Operation Interfaces (Conceptual)

#### `memory_read`
- Required fields:
  - `path: string`
- Optional fields:
  - none
- Output:
  - `{ path, content }`
- Forbidden fields:
  - configuration or credential override fields.

#### `memory_write`
- Required fields:
  - `path: string`
  - `content: string`
- Output:
  - `{ path, bytes_written }`

#### `memory_edit`
- Required fields:
  - `path: string`
  - `find: string` (non-empty)
  - `replace: string`
- Output:
  - `{ path, updated: boolean }`

#### `memory_delete`
- Required fields:
  - `path: string`
- Output:
  - `{ path, deleted: boolean }`

#### `memory_list`
- Required fields:
  - none
- Optional fields:
  - `path: string` (default `"."`)
- Output:
  - `{ path, entries[] }`

#### `memory_search`
- Required fields:
  - `query: string` (non-empty)
- Optional fields:
  - `path: string` (default `"."`)
  - `include_conversations: boolean` (default `false`)
- Output:
  - `{ query, include_conversations, matches[] }`

#### `memory_history`
- Required fields:
  - `path: string`
- Optional fields:
  - `commit: string`
- Output:
  - `{ entries[] }` where each entry includes `commit`, `message`, `timestamp`, `path`, optional `previous_state`

#### `memory_export`
- Required fields:
  - none
- Output:
  - `{ archive_path, format? }`

### 4.2 Conversation Boundary Interfaces

#### Conversation create
- Required fields:
  - `id: string`
  - `initial_message: ConversationMessage`

#### Conversation append
- Required fields:
  - `conversation_id: string`
  - `message: ConversationMessage`

#### Conversation list response
- Required fields:
  - `conversations[]`
  - `total`
  - `limit`
  - `offset`

#### Conversation detail response
- Required fields:
  - `id`
  - `title`
  - `created_at`
  - `updated_at`
  - `messages[]`

### 4.3 Abstract Data Structures

#### `ConversationMessage`
- `id: string`
- `role: system | user | assistant | tool`
- `content: string`
- `timestamp: ISO-8601 string`

#### `MemoryError`
- `code` enum:
  - `path_invalid`
  - `reserved_path`
  - `not_found`
  - `invalid_input`
  - `write_failed`
  - `history_unavailable`
  - `export_failed`
  - `concurrency_conflict`
  - `storage_unavailable`
- `message: safe string`

### 4.4 Defaults and Forbidden Fields

Defaults:
- `memory_list.path` defaults to `"."`.
- `memory_search.path` defaults to `"."`.
- `memory_search.include_conversations` defaults to `false`.
- `memory_export.format` defaults to open archive format indicator (for example `tar.gz`).

Forbidden fields in exported/authored normal Memory surfaces:
- `api_key`
- `token`
- `password_hash`
- `private_key`
- other secret-bearing credential fields.

### 4.5 Error Shapes and Failure Modes

Pre-operation failures (synchronous boundary rejection):
- invalid path, reserved path, malformed input, missing required fields.
- return safe classified `MemoryError`.

In-operation failures (execution-time):
- storage unavailable, write failures, history/export backend failures.
- return safe classified `MemoryError`.

When Memory operations are invoked via streaming tool paths:
- failures surface as safe tool-result errors or classified stream errors at caller boundary.
- raw internal exceptions/paths must not leak to client-visible surfaces.

### 4.6 Valid and Invalid Payload Examples

Valid `memory_write` request:
```json
{
  "path": "documents/plan.md",
  "content": "# Plan\nShip MVP."
}
```

Invalid `memory_read` request:
```json
{
  "path": "../etc/passwd"
}
```

Why invalid:
- path escapes Memory root boundary.

Invalid export payload:
```json
{
  "archive_path": "exports/memory-export-1.tar.gz",
  "api_key": "sk-secret"
}
```

Why invalid:
- contains forbidden secret field.

### 4.7 Communication Patterns
- Memory operations are request/response interactions through tool/boundary interfaces.
- Conversation boundary operations are synchronous persistence/retrieval calls.
- Export/history operations may be longer-running but retain deterministic response contract.

---

## 5. Behavior Specification

### 5.1 Startup and Readiness
1. Ensure required Memory layout exists (directories/surfaces).
2. Ensure version-history backend is ready.
3. Ensure startup-required owner state surfaces are available.
4. Fail clearly if version-history readiness cannot be established.
5. Mark Memory-ready state only after required guarantees are satisfied.

### 5.2 Core Operation Behavior
- `read`:
  - resolve path within root, reject escapes/reserved paths, return content.
- `write`:
  - resolve path, create parent as needed, persist content, record audit/version change.
- `edit`:
  - resolve path, validate target substring exists, apply replacement, persist+audit/version.
- `delete`:
  - resolve path, delete target, record audit/version.
- `list`:
  - resolve path, return filtered entries (exclude reserved internals).
- `search`:
  - traverse allowed scope, return line-level matches with safe output treatment.
- `history`:
  - query version backend for change records; include prior state where required.
- `export`:
  - produce owner-data archive path containing required surfaces.

### 5.3 Conversation Boundary Behavior
1. Create conversation with initial message and metadata envelope.
2. Append subsequent messages with stable IDs/timestamps.
3. Maintain list/detail retrieval and canonical envelope contract.
4. Rebuild/resynchronize listing index if index artifacts become partially invalid.

### 5.4 State Management
- Durable:
  - owner files/content.
  - conversation records.
  - structured/queryable owner data.
  - version/history artifacts.
  - export artifacts.
- Ephemeral:
  - operation-local buffers and query iterators.

### 5.5 Edge Cases and Error Handling
- path escape attempt -> `path_invalid`.
- reserved internal target -> `reserved_path`.
- missing file -> `not_found`.
- edit target not found -> `invalid_input`.
- storage backend failure -> `storage_unavailable`/`write_failed`.
- version backend unavailable at startup -> startup failure (no ready).
- malformed conversation file -> skip/repair behavior for listing resilience without data corruption.

---

## 6. Dependencies & Interactions

### Required Dependencies
- Local storage substrate(s):
  - file storage.
  - optional structured/queryable store.
- Version-history backend for history/export guarantees.
- Audit logging sink for sensitive operations.

### Interaction Boundaries
- Gateway:
  - uses dedicated conversation boundary for persistence/list/detail.
- Engine:
  - uses Memory tools for model-driven operations.
- Auth:
  - governs access to Memory operations but does not alter Memory ownership.

### Dependency Assumptions
- Memory is usable independently from Gateway/Engine/Auth.
- Tool/boundary contracts remain stable across backend changes.
- Startup sequence ensures Memory readiness before request processing.

---

## 7. Invariants & Rules

### Component Ownership Invariants
- Memory owns data substrate guarantees; it does not own interpretation/routing/auth policy.
- Memory has zero outward dependencies on Gateway, Engine, and Auth.

### Contract Invariants
- Access occurs through approved Memory boundaries/tools.
- Conversation data remains inside Memory contract.
- Export/history guarantees remain available from day one.
- Structured owner data is not hidden outside Memory surface.
- Secret-bearing fields remain excluded from normal inspectable Memory surfaces.

### Validation Rules (Conceptual)
- Validate path constraints for every operation.
- Validate operation request shapes and required fields.
- Validate canonical conversation envelope shapes.
- Validate export/history completeness and safe output.

---

## 8. Non-Functional Requirements

### Performance
- Low-latency read/list/search for interactive use.
- Efficient incremental history queries.
- Scalable conversation listing with pagination.

### Scalability
- Support growth in owner data volume.
- Support multiple storage mechanisms behind stable contracts.
- Support concurrent access without data corruption.

### Reliability and Fault Tolerance
- Durable writes for owner-critical content.
- Deterministic startup readiness for version/history guarantees.
- Resilient index/list behavior under partial artifact corruption.

### Security
- Enforce path sandbox boundaries.
- Keep secrets out of normal inspectable Memory surfaces.
- Ensure auditable mutation paths.
- Preserve safe error surfaces for caller-visible outputs.

---

## 9. Implementation Notes (Language-Agnostic)

### Suggested Architectural Patterns
- **Repository pattern** for conversation and structured data surfaces.
- **Tool-first contract layer** for Memory operation exposure.
- **Atomic write strategy** for file-backed artifacts.
- **Adapter strategy** for swappable backend implementations.
- **Deterministic startup gate** for version/history readiness.

### Design Considerations
- Keep stable IDs and timestamps for conversation entries.
- Use canonical envelope contracts independent of storage format.
- Treat index artifacts as rebuildable derivatives, not single point of truth.
- Keep export format open and owner-portable.

### Anti-Patterns to Avoid
- Direct non-contract storage access by non-Memory components.
- Ephemeral-only conversation storage.
- Best-effort startup for required version/history guarantees.
- Backend-specific contract leakage to consumers.
- Storing secret data in normal owner-visible Memory content.

---

## 10. Validation Against AI Primer (`/docs/ai`)

### Confirmed Alignments
- `F-04`: Memory remains substrate with zero outward dependencies.
- `M-01`: zero outward dependency invariant preserved.
- `M-02`: access through approved tools/boundaries only.
- `M-03`: export preserves required owner data surface.
- `M-04`: history supports change records and prior states.
- `M-05`: conversations and structured owner data remain inside Memory contract.
- `M-06`: model-facing Memory surface exposes required storage classes through tools.
- `D-05`: startup fails clearly when version-history readiness cannot be established.
- `D-07`: day-one availability of export and conversation persistence surfaces.

### Primer-Implementation Tightening
- Search output should preserve safety treatment for potentially sensitive inline content.
- Startup readiness must remain strict even when backend/storage upgrades are introduced.

---

## 11. Validation Against Human Documentation (`/the-architecture/docs`)

### Confirmed Alignments
- Memory is the platform substrate and persists independently (`memory-spec.md`, `memory-as-platform.md`).
- Memory remains unopinionated about content meaning; interpretation belongs outside Memory.
- Core storage evolution is additive and backend-agnostic behind interfaces.
- Exportability and inspectability are architectural requirements.

### Documented Discrepancies To Reconcile
1. **Concept scope wording**
   - Human docs discuss broad memory concept ("all data is memory").
   - Component implementation scope focuses on owner-controlled Memory substrate.
2. **Structured/queryable breadth**
   - Human docs describe broad extensibility.
   - MVP may expose only minimum structured/queryable surfaces needed for required owner data guarantees.
3. **Storage mechanism examples**
   - Human docs remain technology-neutral.
   - Current implementation evidence emphasizes file + version backend with specific conversation artifacts.
4. **Conversation resumption product limits**
   - MVP limits may defer some UX-level resume behaviors.
   - Architectural requirement still mandates persistent conversation data in Memory.

### Rebuild Guidance When Sources Diverge
- Preserve human-doc ownership and substrate invariants as authoritative.
- Use primer matrix rows as MVP pass/fail baseline.
- Keep implementation details adaptable as long as contract guarantees remain intact.

---

## 12. Conflict Register

| Conflict ID | Conflicting Statements | Chosen Resolution | Rationale | Risk if Unresolved |
|---|---|---|---|---|
| MEM-CF-001 | Human docs describe "all data is memory"; component boundary focuses on owner-controlled substrate | Treat Memory component scope as owner-controlled substrate while acknowledging broader conceptual framing | Keeps implementation boundary precise without rejecting architecture concept | Scope confusion causes boundary creep or under-scoped implementation |
| MEM-CF-002 | Human docs are backend-neutral; current implementation evidence is file/version oriented | Keep contracts backend-agnostic and treat current mechanisms as evidence profile | Preserves portability and swappability goals | Backend lock-in disguised as architecture |
| MEM-CF-003 | Human docs emphasize extensible structured/queryable surfaces; MVP limits may narrow breadth | Require minimum owner-data structured surface now; keep extensibility path explicit | Aligns with MVP practicality and architecture direction | Required owner data may be hidden outside Memory contract |
| MEM-CF-004 | MVP product limits may defer some resume UX; architecture mandates persistent conversations in Memory | Persist conversation truth in Memory regardless of UX-level resume scope | Protects substrate invariants while allowing product-stage UX limits | Misread limits could justify ephemeral conversations |

## 13. Normative Requirements (MUST/SHOULD/MAY)

### MUST
- `MEM-MUST-001`: Memory MUST have zero outward dependencies on Gateway, Engine, and Auth.
- `MEM-MUST-002`: Memory access MUST occur through approved tools/boundary interfaces only.
- `MEM-MUST-003`: Memory MUST expose core operation surface (`read`, `write`, `edit`, `delete`, `search`, `list`, `history`).
- `MEM-MUST-004`: Memory MUST enforce memory-root and reserved-path protections.
- `MEM-MUST-005`: Mutation operations MUST be durable and auditable.
- `MEM-MUST-006`: Conversations MUST persist inside Memory contract via dedicated boundary.
- `MEM-MUST-007`: Conversation list/detail responses MUST remain canonical.
- `MEM-MUST-008`: Export MUST preserve required owner data surface in open format.
- `MEM-MUST-009`: History MUST provide change records and prior-state behavior.
- `MEM-MUST-010`: Startup MUST enforce deterministic version-history readiness (fail clearly if unavailable).
- `MEM-MUST-011`: Structured/queryable owner data MUST remain inside Memory contract.
- `MEM-MUST-012`: Secrets MUST NOT be stored in normal inspectable Memory surfaces where forbidden.
- `MEM-MUST-013`: Owner data MUST remain inspectable without full runtime.
- `MEM-MUST-014`: Storage backend changes MUST remain behind stable Memory contracts.

### SHOULD
- `MEM-SHOULD-001`: Memory SHOULD support resilient index rebuild/recovery for conversation listing artifacts.
- `MEM-SHOULD-002`: Memory SHOULD provide stable pagination ordering for conversation summaries.
- `MEM-SHOULD-003`: Memory SHOULD keep export/history operations observable through structured logs.

### MAY
- `MEM-MAY-001`: Memory MAY support additional storage backends (for example structured stores or indexes) behind the same contracts.
- `MEM-MAY-002`: Memory MAY add richer query capabilities if core substrate boundaries remain unchanged.

## 14. Acceptance Gates (Pass/Fail)

- `MEM-GATE-01 Contract Gate`: Pass if all defined payload structures validate against `contracts/Memory.schema.json`; fail otherwise.
- `MEM-GATE-02 Conformance Gate`: Pass if all vectors in `tests/Memory-conformance.md` pass (14 positive + 14 negative); fail on any `MEM-MUST-*` failure.
- `MEM-GATE-03 Drift Gate`: Pass if all Critical checks in `drift/Memory-drift-guard.md` pass; fail on any Critical check failure.
- `MEM-GATE-04 Security Gate`: Pass if path sandbox and secret-leakage checks pass; fail on escape/leak detection.
- `MEM-GATE-05 Conflict Gate`: Pass if no unresolved High-risk conflict remains in Conflict Register.

## 15. Traceability Matrix (Requirement -> Source -> Test ID)

| Requirement ID | Primary Source(s) | Conformance Test IDs |
|---|---|---|
| MEM-MUST-001 | Human `foundation-spec.md`, `memory-spec.md`; AI matrix `F-04`, `M-01` | `MEM-T001P`, `MEM-T001N` |
| MEM-MUST-002 | Human `memory-spec.md`; AI matrix `M-02` | `MEM-T002P`, `MEM-T002N` |
| MEM-MUST-003 | Human `memory-spec.md` core operations; AI `memory.md` operation set | `MEM-T003P`, `MEM-T003N` |
| MEM-MUST-004 | Security/path boundary requirements in `memory.md` and implementation guidance | `MEM-T004P`, `MEM-T004N` |
| MEM-MUST-005 | Human `memory-spec.md` persistence/version guarantees; AI security + audit guidance | `MEM-T005P`, `MEM-T005N` |
| MEM-MUST-006 | Human `gateway-spec.md`, `memory-spec.md`; AI matrix `M-05`, `D-07` | `MEM-T006P`, `MEM-T006N` |
| MEM-MUST-007 | AI `client-gateway-contract.md` canonical envelope expectations | `MEM-T007P`, `MEM-T007N` |
| MEM-MUST-008 | Human `memory-spec.md`; AI matrix `M-03` | `MEM-T008P`, `MEM-T008N` |
| MEM-MUST-009 | Human `memory-spec.md`; AI matrix `M-04` | `MEM-T009P`, `MEM-T009N` |
| MEM-MUST-010 | AI matrix `D-05`; `memory.md` startup-readiness requirements | `MEM-T010P`, `MEM-T010N` |
| MEM-MUST-011 | Human `memory-spec.md`; AI matrix `M-05`, `M-06` | `MEM-T011P`, `MEM-T011N` |
| MEM-MUST-012 | Human `security-spec.md`; AI matrix `C-03`, `A-04` | `MEM-T012P`, `MEM-T012N` |
| MEM-MUST-013 | Human `memory-spec.md` inspectability guarantee; AI `memory.md` audit question set | `MEM-T013P`, `MEM-T013N` |
| MEM-MUST-014 | Human `memory-spec.md` evolution model; AI matrix `M-06` | `MEM-T014P`, `MEM-T014N` |

## 16. Residual Risks & Open Decisions

- `MEM-RISK-001 (Medium)`: Scope terminology ("all data is memory" vs owner-controlled component boundary) can still be misread by implementers.
- `MEM-RISK-002 (Medium)`: Structured/queryable surface breadth may vary across implementations unless canonical minimum dataset is explicitly enumerated.
- `MEM-RISK-003 (Low)`: Backend evolution tests may be skipped if only one backend is maintained short-term, increasing hidden lock-in risk.
- `MEM-DECISION-OPEN-001`: Publish canonical minimum structured/queryable owner-data set for MVP and post-MVP expansions.

## Related Blueprint Artifacts

- `Memory-Tools` defines the canonical always-present memory operation contracts and guards:
  - `blueprints/Memory-Tools.md`
  - `blueprints/contracts/Memory-Tools.schema.json`
  - `blueprints/tests/Memory-Tools-conformance.md`
  - `blueprints/drift/Memory-Tools-drift-guard.md`
  - `blueprints/prompts/implement-Memory-Tools.md`
- `Tools` defines the broader cross-capability tool boundary (of which Memory-Tools is a mandatory specialization):
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
  - `/home/hex/Project/PAA-MVP-Prod/build/memory`
  - `/home/hex/Project/PAA-MVP-Prod/build/memory-tools`
  - `/home/hex/Project/PAA-MVP-Prod/build/git.ts`
  - `/home/hex/Project/PAA-MVP-Prod/build/gateway/conversations.ts`

## Self-Validation Report

- Coverage of required sections: 16/16 (100%)
- Normative requirements count: 19 total (`14 MUST`, `3 SHOULD`, `2 MAY`)
- Interfaces with schemas: 20 (`memory_read_request`, `memory_read_response`, `memory_write_request`, `memory_write_response`, `memory_edit_request`, `memory_edit_response`, `memory_delete_request`, `memory_delete_response`, `memory_list_request`, `memory_list_response`, `memory_search_request`, `memory_search_response`, `memory_history_request`, `memory_history_response`, `memory_export_response`, `conversation_create_request`, `conversation_append_request`, `conversation_list_response`, `conversation_detail_response`, `memory_error`)
- Test vectors count: 28 total (`14 positive`, `14 negative`)
- Conflicts detected/resolved: 4/4 resolved
- Unresolved ambiguity list:
  - `A-01 (Medium)`: canonical minimum breadth of structured/queryable owner-data surface is not fully unified across all source docs.
- Final readiness rating: Conditionally Ready
