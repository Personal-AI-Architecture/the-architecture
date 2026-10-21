# Implement Tools (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Tools** capability boundary in a target language/runtime.

---

You are a senior software engineer implementing production-ready tool discovery, authorization, approval, and execution behavior.

## Mission

Implement **Tools** in **{{TARGET_LANGUAGE}}** so capability discovery and execution remain architecture-aligned, contract-faithful, and drift-resistant.

## Primary Inputs

- `build/blueprints/tools/blueprint.md`
- `build/blueprints/tools/contract-pack.json` (derived source manifest; canonical shapes remain under `contracts/`)
- `build/blueprints/tools/tests.md`
- `build/blueprints/tools/drift-guard.md`
- `build/blueprints/agent-loop/blueprint.md`
- `build/blueprints/auth/blueprint.md`
- `build/blueprints/memory/blueprint.md`
- `build/blueprints/configuration/blueprint.md`
- `build/blueprints/gateway-agent-loop-contract/blueprint.md`
- `build/blueprints/security/blueprint.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `build/primers/tools.md`
- `build/compliance-matrix.md`
- `maintainers/traceability-map.md`
- `conformance/review-checklists/security-review.md`
- `conformance/review-checklists/auth-review.md`
- `conformance/review-checklists/configuration-review.md`
- `build/failure-patterns.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `architecture/tools-spec.md`
- `architecture/agent-loop-spec.md`
- `architecture/auth-spec.md`
- `architecture/security-spec.md`
- `architecture/configuration-spec.md`
- `architecture/memory-spec.md`
- `architecture/overview.md`
- `architecture/gateway-agent-loop-contract.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership and boundary authority.
2. AI primer docs: MVP contract shape and audit matrix alignment.
3. Existing implementation: evidence only.

If conflicts appear, do not guess silently. Create `conflict_register.md` and document:
- conflict ID
- sources in conflict
- chosen resolution
- rationale
- residual risk

## Required Tools Capabilities

Implement these behaviors:
- Keep tools as a capability surface, not a standalone component.
- Do not introduce a separate Tool API boundary.
- Discover tools from configured sources at startup/refresh.
- Enforce canonical tool definition schema.
- Resolve availability via environment/config + Auth permissions.
- Keep request payloads from reconfiguring runtime tool state.
- Preserve stable tool-call/tool-result IDs in stream contract.
- Ask Auth before each tool call; a refused call does not run and returns "not permitted".
- Mark tools the actor may not use as not permitted instead of hiding them.
- Ship no approval step by default; where an approval rule in Auth covers a call, enforce it in code before execution.
- Emit structured safe tool failures with classification and recoverability.
- Keep component/model memory access tool-mediated.
- Enforce trust-level tool isolation and scope boundaries.
- Surface tool unavailability/timeouts/crashes explicitly.
- Preserve config/preference-only tool swap path without architecture rewrite.

## Canonical Contract Rules

Use `Tools.schema.json` as machine-checkable authority for:
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

Enforce required fields, optional fields, defaults, forbidden fields, and conditional constraints exactly.

## Tie-Break Rules for Known Discrepancies

Use these for MVP consistency:

1. Self-describing tools are normative; static source maps are acceptable only as transitional implementation evidence.
2. Model visibility of not-permitted tools is required (TOL-MUST-015): mark them, do not hide them. The contract has no field for this yet; report the shape you chose.
3. Keep always-send/discoverable split architecture-ready even if initial deployment runs with a small fixed set.
4. Isolate tools the owner has not said they trust, by default. Containers are one option; separate processes or sandboxes are others.

## Non-Negotiable Constraints

- Do not create a fifth component called Tools.
- Do not add a new public/internal Tool API boundary.
- Do not execute tools outside Agent Loop path.
- Do not bypass Auth authorization for tool calls.
- Do not accept request-side tool source or definition overrides.
- Do not execute a call an approval rule covers before decision.
- Do not ship approval on every write as a built-in default.
- Do not run a tool call without a per-call Auth check.
- Do not return raw stack traces or secret-bearing error text.
- Do not let components bypass tool-mediated Memory access.
- Do not run untrusted tools without required isolation controls.
- Do not require architecture rewrites for normal tool add/remove changes.

## Required Tests (Minimum)

Implement automated tests proving all `TOL-MUST-*` requirements in `Tools-conformance.md`:

1. No fifth-component drift.
2. No separate Tool API boundary.
3. Agent Loop execution + Auth authorization ownership.
4. Availability from config + permissions.
5. Rejection of request-side tool reconfiguration.
6. Canonical definition schema enforcement.
7. Clear startup failure on invalid sources/definitions.
8. Stable tool-call/tool-result stream shape.
9. Approval-rule enforcement where rules exist.
10. Structured/safe tool failure taxonomy.
11. Tool-mediated memory-boundary enforcement.
12. Trust-level isolation boundary enforcement.
13. Explicit failure surfacing for timeout/unavailability/crash.
14. Config/preference-only tool swap path.
15. Per-call Auth check with "not permitted" results and marked, not hidden, tools.
16. Owner can use every tool by default; approval rules live only in Auth.

Include positive and negative vectors linked to requirement IDs.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Any Critical check in `Tools-drift-guard.md` fails.
- Any `TOL-MUST-*` conformance test fails.
- A call an approval rule covers executes before approval decision.
- A tool call runs without a per-call Auth check.
- Unsafe tool failure leakage is detected.
- Direct component storage access bypasses tool boundaries.
- Untrusted-tool isolation requirements are violated.
- Tool swap requires architecture/component rewrites.

## Deliverables

1. Tools capability implementation code in `{{TARGET_LANGUAGE}}`.
2. Automated tests covering required conformance vectors.
3. `implementation-report.md`:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md`:
   - pass/fail by tools contract interface and requirement ID
5. `drift-check-report.md`:
   - pass/fail by drift-critical checks
6. `conflict_register.md` (only if conflicts encountered)

## Final Response Format

Return:
1. Summary of implementation.
2. Files added/changed.
3. Requirement coverage (`MUST passed / total`).
4. Conformance summary.
5. Drift-check summary.
6. Residual risks and follow-up actions (if any).

## Definition of Done

Done only when:
- all `TOL-MUST-*` requirements pass
- all tools contract conformance checks pass
- all drift-critical checks pass
- no unresolved High-risk conflicts remain
- reports are complete
