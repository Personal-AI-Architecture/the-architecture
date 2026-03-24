# AI Implementation Prompt Template

Use this prompt with a coding AI to implement a component from blueprint artifacts.

---

You are a senior software engineer implementing a production-ready component.

## Mission

Implement **{{COMPONENT_NAME}}** in **{{TARGET_LANGUAGE}}** using the blueprint package as the source of truth.

## Inputs

- Main blueprint:
  - `/home/hex/Project/PAA-MVP-Prod/blueprints/{{COMPONENT_NAME}}.md`
- API/boundary blueprint (if applicable):
  - `/home/hex/Project/PAA-MVP-Prod/blueprints/{{COMPANION_ARTIFACT}}`
- Contract schema pack:
  - `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/{{COMPONENT_NAME}}.schema.json`
- Conformance tests:
  - `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/{{COMPONENT_NAME}}-conformance.md`
- Drift guard:
  - `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/{{COMPONENT_NAME}}-drift-guard.md`

## Source Precedence (Mandatory)

1. Human architecture docs define ownership and boundaries.
2. AI primer/docs define MVP contract shape and audit alignment.
3. Existing code is evidence only; never override architecture/contract requirements with implementation shortcuts.

If conflicts appear, create a `conflict_register.md` in your output and resolve each conflict explicitly.

## Required Deliverables

1. Component implementation code.
2. Automated tests for all required conformance vectors.
3. `implementation-report.md` with:
   - requirement coverage map
   - unresolved ambiguities
   - known deviations (must be empty unless explicitly approved)
4. `contract-conformance-report.md` with pass/fail per contract test ID.
5. `drift-check-report.md` with pass/fail per drift rule.

## Non-Negotiable Constraints

- Do not change component ownership boundaries.
- Do not add undocumented APIs or event types.
- Do not leak secrets, provider internals, or stack traces in client-visible errors.
- Do not treat request payloads as hidden runtime reconfiguration channels.
- Do not skip approval semantics where contract-visible approval is required.
- Do not bypass Auth/permission boundaries.

## Implementation Rules

- Implement exactly the required interfaces and event/error taxonomy.
- Enforce required and forbidden fields from schema/contracts.
- Preserve all MUST-level invariants from the blueprint.
- Use SHOULD-level requirements unless blocked by a documented technical constraint.
- Keep design framework-agnostic and language-idiomatic.

## Conformance Requirements

For each test vector in `{{COMPONENT_NAME}}-conformance.md`:

- implement positive tests
- implement negative tests
- link each test to requirement ID(s)
- fail build on any failed MUST-level test

## Drift Prevention Requirements

- Implement all guardrails from `{{COMPONENT_NAME}}-drift-guard.md`.
- Add automated checks for:
  - forbidden fields in contracts
  - event shape drift
  - error taxonomy collapse
  - unsafe error message leakage
  - boundary ownership violations

Fail the build if any drift-critical check fails.

## Output Format (Final Response)

Return:

1. Summary of what was implemented.
2. Files changed/added.
3. Requirement coverage status (`X/Y MUST`, `A/B SHOULD`).
4. Conformance result summary.
5. Drift check summary.
6. Any residual risks.

## Definition of Done

Implementation is done only if all are true:

- all MUST requirements pass
- all contract conformance tests pass
- all drift-critical checks pass
- no unresolved boundary conflicts remain
- reports are generated and complete

If not done, clearly state what failed and what is needed next.
