# Security

> The cross-cutting rules that protect secrets, boundaries, auditability, and safe system behavior.

## Purpose

Define the non-negotiable security properties that apply across components, especially around secret handling, audit records, safe outputs, and trust boundaries.

## Owns

- Secret-handling rules.
- Audit expectations.
- Safe error and output requirements.
- Cross-component trust and exposure constraints.

## Does Not Own

- General component behavior that belongs in component primers.
- Deployment topology details beyond security posture.
- Identity and permission semantics that belong in Auth.

## Attack Surfaces

- Memory content prompt injection.
- Tool supply chain.
- Gateway API abuse.
- Model provider data flow.
- Model misbehavior.

Hosting provider access is a hosting concern, outside the architecture.

## Required Behaviors

- Secrets live outside Memory, somewhere git never tracks: environment variables, an untracked config file, or a secret store.
- Audit records must exist where the architecture requires them.
- Error and output surfaces must be safe for display or exposure.
- Trust boundaries must remain explicit rather than accidental.
- The Gateway calls Auth on every request and the Agent Loop asks Auth before each tool call.
- Scope enforcement, and any approval rules the owner sets, must exist as real mechanisms, not just prompt instructions.
- The default policy is that the owner can do everything; approval prompts are a product choice. Version history with restore is the safety net that makes this default safe.
- On the owner's own hardware, the owner has the last word: product defaults, including safety-minded ones, are changeable by the owner.

## Enforcement Mechanisms

- Auth policy (per request and per tool call)
- Tool scope and isolation (untrusted tools isolated by default; the owner decides what they trust)
- Approval gates (optional; where the owner or product turns them on)
- Audit logging
- Content separation
- Version history and restore as the safety net (required)

## Forbidden Behaviors

- Storing credentials or tokens in Memory or any git-tracked file.
- A product rule that overrides the owner on the owner's own hardware.
- Returning raw unsafe internal error text through exposed contracts.
- Omitting required audit capture for critical actions.
- Relying on accidental safety instead of explicit enforcement.

## Lifecycle Rules

- Security properties must survive component swaps and implementation changes.
- Audit and export behavior must remain compatible with Memory and ownership guarantees.
- Security posture must be enforced at the right boundary rather than as a downstream patch.

## Required From Day One

- Structured audit logging.
- Safe client-visible error handling.
- Coded enforcement of any approval rules the owner sets (none are required by default).
- Version history with restore for Memory.
- Tool isolation and scope boundaries.

These are MVP requirements, not post-MVP hardening.

## Audit Questions

- Where do secrets live, and is that allowed?
- Are auth, tool, and memory-sensitive actions audited where required?
- Are client-visible or internal stream errors normalized and safe?
- Are trust boundaries explicit in runtime behavior?
- Does any implementation rely on convention instead of enforced security constraints?
- Is every tool call checked with Auth before it runs?
- Can the owner see what changed and restore an earlier state?

## Common Drift Patterns

- Secret-like fields written into normal Memory or preferences.
- Missing or partial structured audit logging.
- Raw provider or runtime exception text forwarded through contracts.
- Security rules documented but not enforced at the component boundary.
- Confirm-every-write approval treated as an architecture requirement.
- "Safety constraints" that the owner can't change on their own hardware.

## Review Links

- Checklist: `conformance/review-checklists/security-review.md`
- Traceability: `maintainers/traceability-map.md`
- Examples: `contracts/examples/README.md`

## Source Docs

- `architecture/security-spec.md`
- `architecture/auth-spec.md`
- `architecture/memory-spec.md`
- `architecture/gateway-agent-loop-contract.md`
- `conformance/foundation-verification.md`
- `architecture/configuration-spec.md`
