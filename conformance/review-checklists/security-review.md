# Security Review Checklist

> Fast targeted review checklist for secrets, audit logging, approval enforcement, tool isolation, and safe output behavior.

## Purpose

Use this when reviewing audit logging, error handling, approval enforcement, secret storage, or tool isolation boundaries.

## Checklist

- [ ] Sensitive actions are captured in a structured audit log.
- [ ] A security-relevant action is not started until its audit record is durably accepted; when audit storage is unavailable, the action is blocked, the owner is alerted, and a no-action conversation can continue.
- [ ] Client-visible and stream-visible errors are safe and sanitized.
- [ ] Approval rules the owner sets are enforced in code at the Agent Loop's pre-tool-call Auth check, not only in policy prose or prompts. None are required by default.
- [ ] Where a product adds approvals, they also appear as contract-visible interaction.
- [ ] Version history with restore is available as the safety net.
- [ ] No product rule overrides the owner on the owner's own hardware.
- [ ] Tool scope and isolation boundaries are enforced at runtime.
- [ ] Secrets are not stored in Memory or tracked config; they live in environment variables, an untracked config file, or a secret store.
- [ ] Product-owned auth state is exportable without leaking credentials.
- [ ] Security controls are present from day one rather than treated as post-MVP hardening.

## Related Conformance Tests

- `ARCH-6`
- `ARCH-11`
- `ARCH-13`
- `ARCH-16`

## Common Failure Patterns

- no structured audit sink
- raw exception text appears in client-visible payloads
- approval trapped in local CLI flow (in products that add approvals)
- confirm-every-write imposed as if the architecture required it
- tools can exceed intended scope because enforcement is soft
- credentials leak into inspectable state

## Read Next

- `architecture/security-spec.md`
- `architecture/tools-spec.md`

## Example Files

- `contracts/examples/approval-request-event.json`
- `contracts/examples/approval-result-event.json`
- `contracts/examples/invalid-approval-request-event.json`
- `contracts/examples/invalid-approval-result-event.json`
- `contracts/examples/invalid-gateway-agent-loop-request.json`
