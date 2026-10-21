# Security Review Checklist

> Fast targeted review checklist for secrets, audit logging, approval enforcement, tool isolation, and safe output behavior.

## Purpose

Use this when reviewing audit logging, error handling, approval enforcement, secret storage, or tool isolation boundaries.

## Checklist

- [ ] Sensitive actions are captured in a structured audit log.
- [ ] Client-visible and stream-visible errors are safe and sanitized.
- [ ] Approval rules the owner sets are enforced in code at the Agent Loop's pre-tool-call Auth check, not only in policy prose or prompts. None are required by default.
- [ ] Where a product adds approvals, they also appear as contract-visible interaction.
- [ ] Version history with restore is available as the safety net.
- [ ] No product rule overrides the owner on the owner's own hardware.
- [ ] Tool scope and isolation boundaries are enforced at runtime.
- [ ] Secrets are not stored in Memory or tracked config; they live in environment variables, an untracked config file, or a secret store.
- [ ] Product-owned auth state is exportable without leaking credentials.
- [ ] Security controls are present from day one rather than treated as post-MVP hardening.

## Matrix IDs

- `A-04`
- `A-05`
- `S-01`
- `S-02`
- `S-03`
- `S-04`
- `S-05`
- `S-06`
- `A-07`
- `GC-03`
- `GC-06`

## Common Failure Patterns

- no structured audit sink
- raw exception text appears in client-visible payloads
- approval trapped in local CLI flow (in products that add approvals)
- confirm-every-write imposed as if the architecture required it
- tools can exceed intended scope because enforcement is soft
- credentials leak into inspectable state

## Read Next

- `build/primers/security.md`
- `build/primers/auth.md`
- `build/primers/client-gateway-contract.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/compliance-matrix.md`

## Example Files

- `contracts/examples/approval-request-event.json`
- `contracts/examples/approval-result-event.json`
- `contracts/examples/invalid-approval-request-event.json`
- `contracts/examples/invalid-approval-result-event.json`
- `contracts/examples/invalid-gateway-engine-request.json`

## Source Docs

- `maintainers/primer-audit-playbook.md`
- `build/primers/security.md`
- `build/primers/auth.md`
- `build/primers/client-gateway-contract.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/compliance-matrix.md`
