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
- Hosting provider access.
- Model misbehavior.

## Required Behaviors

- Secrets must not leak into forbidden storage locations.
- Audit records must exist where the architecture requires them.
- Error and output surfaces must be safe for display or exposure.
- Trust boundaries must remain explicit rather than accidental.
- Scope enforcement and approval controls must exist as real mechanisms, not just prompt instructions.

## Enforcement Mechanisms

- Auth policy
- Tool scope and isolation
- Approval gates
- Audit logging
- Content separation
- Version history as a safety net

## Forbidden Behaviors

- Storing credentials or tokens in normal Memory files where prohibited.
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
- Coded approval enforcement for sensitive actions.
- Tool isolation and scope boundaries.

These are MVP requirements, not post-MVP hardening.

## Audit Questions

- Where do secrets live, and is that allowed?
- Are auth, tool, and memory-sensitive actions audited where required?
- Are client-visible or internal stream errors normalized and safe?
- Are trust boundaries explicit in runtime behavior?
- Does any implementation rely on convention instead of enforced security constraints?

## Common Drift Patterns

- Secret-like fields written into normal Memory or preferences.
- Missing or partial structured audit logging.
- Raw provider or runtime exception text forwarded through contracts.
- Security rules documented but not enforced at the component boundary.

## Review Links

- Checklist: `docs/ai/review-checklists/security-review.md`
- Traceability: `docs/ai/traceability-map.md`
- Examples: `docs/ai/examples/README.md`

## Source Docs

- `docs/security-spec.md`
- `docs/auth-spec.md`
- `docs/memory-spec.md`
- `docs/gateway-engine-contract.md`
- `docs/foundation-verification.md`
- `docs/configuration-spec.md`
