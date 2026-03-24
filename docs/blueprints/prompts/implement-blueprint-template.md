# Implementation-Ready Blueprint Prompt Template

Use this prompt to generate a full implementation-ready blueprint package for a component.

---

You are an expert software architect and systems analyst.

## Mission

Produce an **implementation-ready blueprint package** for a target component so an AI engineer can rebuild it in any language with minimal ambiguity and minimal architectural drift.

---

## Source References

Use the following sources to guide and validate your output:

- Human-Readable Reference Docs:
  `/home/hex/Reference/the-architecture/docs`

- AI Primer Docs:
  `/home/hex/Project/PAA-MVP-Prod/docs/ai`

- Optional implementation evidence (for behavioral confirmation only, never as primary authority):
  `/home/hex/Project/PAA-MVP-Prod/build`

---

## Source-of-Truth Precedence (Mandatory)

Apply this precedence order:

1. Human architecture docs are authoritative for component ownership and architectural boundaries.
2. AI primer docs are authoritative for MVP-facing contract shapes and audit matrix alignment.
3. Existing implementation is evidence, not authority.

If sources conflict, do not guess silently.
Create a **Conflict Register** with:
- conflict ID
- conflicting statements
- chosen resolution
- rationale
- risk if unresolved

---

## Target Component

- Component Name: **{{COMPONENT_NAME}}**

---

## Output Files (Required)

Generate all files below:

1. Main blueprint:
   `/home/hex/Project/PAA-MVP-Prod/blueprints/{{COMPONENT_NAME}}.md`

2. Canonical contract schema pack (machine-checkable):
   `/home/hex/Project/PAA-MVP-Prod/blueprints/contracts/{{COMPONENT_NAME}}.schema.json`

3. Conformance test vectors (language-agnostic):
   `/home/hex/Project/PAA-MVP-Prod/blueprints/tests/{{COMPONENT_NAME}}-conformance.md`

4. Drift prevention rules:
   `/home/hex/Project/PAA-MVP-Prod/blueprints/drift/{{COMPONENT_NAME}}-drift-guard.md`

5. AI implementation handoff prompt:
   `/home/hex/Project/PAA-MVP-Prod/blueprints/prompts/implement-{{COMPONENT_NAME}}.md`

If constrained to one file only, include all 2-5 as appendices inside the main Markdown.

---

## Main Blueprint Content (Required Sections)

Include sections 1-11 exactly:

1. Overview
2. Scope Definition
3. Core Concepts & Terminology
4. Interfaces & Contracts
5. Behavior Specification
6. Dependencies & Interactions
7. Invariants & Rules
8. Non-Functional Requirements
9. Implementation Notes (Language-Agnostic)
10. Validation Against AI Primer
11. Validation Against Human Documentation

Also add sections 12-16:

12. Conflict Register
13. Normative Requirements (use MUST/SHOULD/MAY)
14. Acceptance Gates (pass/fail)
15. Traceability Matrix (requirement -> source -> test ID)
16. Residual Risks & Open Decisions

---

## Contract Precision Requirements

For every public/internal interface, define explicitly:

- required fields
- optional fields
- types
- allowed enums
- defaults
- forbidden fields
- error shapes
- pre-stream vs mid-stream failure behavior
- example valid payload
- example invalid payload and why invalid

Do not leave interface behavior implicit.

---

## Conformance Test Vector Requirements

For each invariant/contract rule provide:

- test ID
- requirement ID
- test type: positive or negative
- input/setup
- expected output/event/error
- failure signal
- drift category

Every critical rule must have at least:
- 1 positive test
- 1 negative test

---

## Drift Prevention Requirements

Create explicit anti-drift guardrails:

- top drift patterns
- prohibited implementation shortcuts
- auto-check assertions (what should be linted/tested)
- contract-break indicators
- "fail build if" conditions

Include a **Drift Detection Checklist** that an AI implementer can run before finalizing code.

---

## AI Implementation Handoff Prompt Requirements

Generate a separate implementation prompt that includes:

- concise component goal
- required interfaces and schemas
- non-negotiable invariants
- conformance tests to pass
- drift guard rules
- explicit "do not implement" list
- completion criteria

This prompt must be directly usable by a coding AI to implement in any target language.

---

## Output Constraints

- Language-agnostic
- Clear, precise English
- No framework-specific prescriptions
- Avoid pseudocode unless needed for ambiguity reduction
- Structured and exhaustive, but non-redundant
- Prefer deterministic statements over descriptive prose

---

## Final Quality Gate (Mandatory Self-Validation)

At the end, include a **Self-Validation Report** with:

- coverage % of required sections
- # of normative requirements
- # of interfaces with schemas
- # of test vectors (positive/negative counts)
- # of conflicts detected and resolved
- unresolved ambiguity list (must be empty or explicitly risk-ranked)
- final readiness rating: Not Ready / Conditionally Ready / Ready
