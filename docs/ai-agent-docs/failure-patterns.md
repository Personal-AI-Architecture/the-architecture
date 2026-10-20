# Failure Patterns

> Recurring real-world drift patterns grouped by symptom, likely cause, and where to read next in the primer layer.

## Purpose

Make common architecture failures easier to recognize quickly during implementation and audit work.

## Pattern: Private Conversation Store

- Symptom: conversations live in an in-process `Map`, private store object, or route-local persistence layer.
- Likely cause: Gateway was built before the Memory boundary and conversation-store boundary were made real.
- Read next: `docs/ai-agent-docs/gateway.md`, `docs/ai-agent-docs/memory.md`, `docs/ai-agent-docs/client-gateway-contract.md`
- Matrix IDs: `G-03`, `G-04`, `M-05`, `D-07`

## Pattern: Auth Omitted On The Real Path

- Symptom: requests work with no Auth call from the Gateway, no identity attached, or a “local mode” that bypasses the boundary; or tool calls run with no Auth check before them.
- Likely cause: implementer treated permissive policy (the owner can do everything) as equivalent to no Auth component, or treated the request-level check as covering tool calls.
- Read next: `docs/ai-agent-docs/auth.md`, `docs/ai-agent-docs/gateway-agent-loop-contract.md`
- Matrix IDs: `A-01`, `A-02`, `A-05`, `A-06`, `GC-04`

## Pattern: Permissions In Configuration

- Symptom: allow/deny lists, tool permissions or approval modes sit in runtime config, adapter config or preferences.
- Likely cause: permissions were treated as settings rather than as Auth's data.
- Read next: `docs/ai-agent-docs/configuration.md`, `docs/ai-agent-docs/auth.md`
- Matrix IDs: `C-04`, `A-02`

## Pattern: Model Fixed At Startup

- Symptom: changing the model preference has no effect until the system restarts.
- Likely cause: the model was loaded into Agent Loop or adapter configuration at boot instead of being read by the Gateway on every message and passed with the request.
- Read next: `docs/ai-agent-docs/models.md`, `docs/ai-agent-docs/gateway.md`, `docs/ai-agent-docs/gateway-agent-loop-contract.md`
- Matrix IDs: `E-05`, `MO-02`, `GC-01`

## Pattern: Tool Calls Missing From History

- Symptom: a resumed conversation has only user and assistant text; the tool calls and results the model saw are gone.
- Likely cause: the conversation store saved text only, or each contract used its own message shape.
- Read next: `docs/ai-agent-docs/gateway.md`, `docs/ai-agent-docs/gateway-agent-loop-contract.md`
- Matrix IDs: `G-09`, `GC-07`

## Pattern: Config Layer Collapse

- Symptom: runtime config, adapter config, preferences, and secrets appear in one merged loader.
- Likely cause: implementer optimized for fast bootstrapping before the config taxonomy was made explicit.
- Read next: `docs/ai-agent-docs/configuration.md`, `docs/ai-agent-docs/build-sequence.md`
- Matrix IDs: `C-01`, `C-02`, `C-03`, `D-06`

## Pattern: Approval As An Architecture Default

- Symptom: every write asks the owner to confirm, and the owner can't turn it off, because the implementation treats approval as an architecture rule.
- Likely cause: approval prompts were read as required; the architecture default is that the owner can do everything, with version history and restore as the safety net.
- Read next: `docs/ai-agent-docs/auth.md`, `docs/ai-agent-docs/tools.md`, `docs/ai-agent-docs/security.md`
- Matrix IDs: `A-07`, `S-03`, `S-06`, `C-05`

## Pattern: Approval Trapped In The Client

- Symptom: in a product that adds approvals, approval works only through local readline/UI branches and does not appear in the contract.
- Likely cause: approval was treated as UX behavior instead of contract-visible interaction plus coded enforcement.
- Read next: `docs/ai-agent-docs/client-gateway-contract.md`, `docs/ai-agent-docs/gateway-agent-loop-contract.md`, `docs/ai-agent-docs/security.md`
- Matrix IDs: `S-03`, `S-05`, `GC-06`

## Pattern: Version History Is Best-Effort

- Symptom: version history initialization fails with warnings and the system continues, or history exists but there is no way to restore an earlier state.
- Likely cause: version guarantees were treated as operational niceties or as optional, instead of Memory and startup-readiness requirements.
- Read next: `docs/ai-agent-docs/memory.md`, `docs/ai-agent-docs/build-sequence.md`
- Matrix IDs: `M-04`, `D-05`, `S-06`

## Pattern: Export Surface Missing Or Partial

- Symptom: no export exists, or export excludes conversations, structured data, or required owner state.
- Likely cause: export was treated as a future feature instead of a foundational Memory guarantee.
- Read next: `docs/ai-agent-docs/memory.md`, `docs/ai-agent-docs/accepted-mvp-limits.md`
- Matrix IDs: `M-03`, `D-07`

## Pattern: Error Taxonomy Collapse

- Symptom: every mid-stream failure becomes `provider_error`, or raw exception text leaks into client-visible events.
- Likely cause: Agent Loop error behavior was implemented without the contract taxonomy and sanitization rules.
- Read next: `docs/ai-agent-docs/gateway-agent-loop-contract.md`, `docs/ai-agent-docs/security.md`
- Matrix IDs: `GC-03`, `GC-05`, `S-01`

## Pattern: Agent Loop Stops Early

- Symptom: the loop exits because of an internal iteration cap before the model signals completion.
- Likely cause: safety bounds were embedded in Agent Loop rather than made explicit and externalized.
- Read next: `docs/ai-agent-docs/agent-loop.md`, `docs/ai-agent-docs/gateway-agent-loop-contract.md`
- Matrix IDs: `E-04`

## Pattern: Raw Storage Shape Leaks Through Client API

- Symptom: conversation routes return internal database rows, storage metadata, or unstable payload shapes.
- Likely cause: client contract was not separated from internal storage and internal contract concerns.
- Read next: `docs/ai-agent-docs/client-gateway-contract.md`, `docs/ai-agent-docs/gateway.md`
- Matrix IDs: `G-05`, `G-06`, `G-07`

## Pattern: Primer Failure During Audit

- Symptom: auditor cannot answer a necessary architecture question without reopening deeper human-readable docs.
- Likely cause: the primer layer is missing a rule, shape, example, or glossary term.
- Read next: `docs/ai-agent-docs/primer-audit-playbook.md`, `docs/ai-agent-docs/decision-glossary.md`, `docs/ai-agent-docs/primer-change-policy.md`
- Matrix IDs: no direct matrix row; this is a primer-layer maintenance failure

## Audit Questions

- Which pattern best matches the observed symptom?
- Is the likely cause in implementation order, missing boundary enforcement, or primer incompleteness?
- Which primer files should be read before proposing a fix?
- Which matrix IDs convert the symptom into a pass/fail check?

## Source Docs

- `docs/ai-agent-docs/gateway.md`
- `docs/ai-agent-docs/memory.md`
- `docs/ai-agent-docs/auth.md`
- `docs/ai-agent-docs/security.md`
- `docs/ai-agent-docs/client-gateway-contract.md`
- `docs/ai-agent-docs/gateway-agent-loop-contract.md`
- `docs/ai-agent-docs/configuration.md`
- `docs/ai-agent-docs/primer-audit-playbook.md`
- `docs/ai-agent-docs/build-sequence.md`
- `docs/ai-agent-docs/compliance-matrix.md`
- `docs/ai-agent-docs/decision-glossary.md`
