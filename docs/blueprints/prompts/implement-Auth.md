# Implement Auth (AI Coding Prompt)

Use this prompt with a coding AI to implement the **Auth** component in a target language.

---

You are a senior software engineer implementing a production-ready component.

## Mission

Implement the **Auth** component in **{{TARGET_LANGUAGE}}** so it is architecture-aligned, contract-faithful, and drift-resistant.

## Primary Inputs

- `/home/hex/Project/PAA-MVP-Prod/blueprints/Auth.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/Auth.schema.json`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/Auth-conformance.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/Auth-drift-guard.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Gateway.md`
- `/home/hex/Project/PAA-MVP-Prod/blueprints/Engine.md`

## Supporting Inputs (Authoritative for contracts/audit)

- `/home/hex/Project/PAA-MVP-Prod/docs/ai/auth.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/compliance-matrix.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/traceability-map.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/review-checklists/auth-review.md`
- `/home/hex/Project/PAA-MVP-Prod/docs/ai/security.md`

## Human Architecture Inputs (Authoritative for ownership boundaries)

- `/home/hex/Reference/the-architecture/docs/auth-spec.md`
- `/home/hex/Reference/the-architecture/docs/security-spec.md`
- `/home/hex/Reference/the-architecture/docs/foundation-spec.md`
- `/home/hex/Reference/the-architecture/docs/gateway-engine-contract.md`

## Source Precedence (Mandatory)

1. Human architecture docs: ownership/boundary authority.
2. AI primer docs: concrete MVP contract shape and audit alignment.
3. Existing implementation: evidence only.

If conflicts exist, do not guess silently. Create `conflict_register.md` and document:
- conflict ID
- sources in conflict
- chosen resolution
- rationale
- residual risk

## Required Auth Capabilities

Implement these behaviors:
- Authenticate protected requests before system interaction.
- Build and attach normalized auth context (identity, actor type, mode, permissions).
- Enforce authorization decisions for tools and approval actions.
- Fail closed on invalid/missing credentials or mismatched auth context.
- Keep auth state product-owned, inspectable, and exportable.
- Provide required day-one tools: `auth_whoami`, `auth_check`, `auth_export`.
- Propagate actor context across Gateway -> Engine -> tool execution path.
- Emit structured audit records for allow/deny auth outcomes.
- Preserve Auth as an independent boundary (no routing, conversation, or model-loop ownership).

## Canonical Contract Rules

### Auth state
- Product-owned state includes actor identity, mode, permissions, and timestamps.
- Export surface must remain non-secret.

### Auth context propagation
- Protected path must carry actor identity and permission context.
- Engine consumes authenticated context; it does not authenticate independently.

### Authorization
- Permission denial must be explicit and enforced in code.
- Approval decision submission requires `approval_authority`.

### Required tools
- `auth_whoami`: returns current actor identity details.
- `auth_check`: returns permission data and allow/deny status.
- `auth_export`: returns non-secret product-owned auth state.

## Tie-Break Rules for Known Discrepancies

Use these for MVP implementation consistency:

1. Schema supports multi-actor extensibility; MVP runtime may execute owner-first flow.
2. Keep local-owner mode as a real boundary with validation, never as a bypass.
3. Keep authorization ownership in Auth; Gateway/Engine may consume decisions but must not own policy logic.
4. Keep export product-owned and non-secret even if provider implementation offers richer internal state.

## Non-Negotiable Constraints

- Do not bypass Auth on any protected route.
- Do not implement fail-open auth behavior.
- Do not store secrets in inspectable Memory/preferences files.
- Do not move authorization ownership into Gateway, Engine, or tools.
- Do not remove required auth tools from runtime.
- Do not return opaque provider-only auth blobs as the canonical export surface.

## Required Tests (Minimum)

Implement automated tests that prove:

1. Protected routes fail without valid auth context.
2. Auth context parsing/validation rejects malformed or mismatched identity data.
3. Permission-denied actions are blocked (including tool access and approval decisions).
4. Startup creates/loads product-owned auth state for day-one runtime.
5. `auth_export` returns non-secret product-owned state.
6. `auth_whoami`, `auth_check`, and `auth_export` are available.
7. Actor context reaches tool execution path.
8. Structured auth audit records exist for allowed and denied outcomes.
9. Local-owner mode still validates and enforces the boundary.
10. Auth module does not own non-auth responsibilities.

## Drift-Critical Fail Conditions (Fail Build If Any True)

- Any protected route is reachable without Auth.
- Missing credentials are treated as implicit allow.
- Approval decisions can be submitted without `approval_authority`.
- Restricted tools execute for unauthorized actors.
- Secret-like fields appear in exportable auth state.
- Required auth tools are missing.
- Auth logic is scattered outside Auth boundary ownership.

## Deliverables

1. Auth implementation code in `{{TARGET_LANGUAGE}}`.
2. Automated tests covering all required tests above.
3. `implementation-report.md`:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md`:
   - pass/fail by contract rule
5. `drift-check-report.md`:
   - pass/fail by drift-critical condition
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
- all MUST-level auth and boundary requirements pass
- all required tests pass
- all drift-critical checks pass
- no unresolved conflicts remain
- reports are complete
