# Security Review Checklist

> Fast targeted review checklist for secrets, audit logging, approval enforcement, tool isolation, and safe output behavior.

## Purpose

Use this when reviewing audit logging, error handling, approval enforcement, secret storage, or tool isolation boundaries.

## Checklist

- [ ] Sensitive actions are captured in a structured audit log.
- [ ] Client-visible and stream-visible errors are safe and sanitized.
- [ ] Approval enforcement is implemented in code, not only in policy prose or prompts.
- [ ] Approval also appears as contract-visible interaction where required.
- [ ] Tool scope and isolation boundaries are enforced at runtime.
- [ ] Secrets are not stored in normal inspectable Memory or tracked config.
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
- `GC-03`
- `GC-06`

## Common Failure Patterns

- no structured audit sink
- raw exception text appears in client-visible payloads
- approval trapped in local CLI flow
- tools can exceed intended scope because enforcement is soft
- credentials leak into inspectable state

## Read Next

- `docs/ai-agent-docs/security.md`
- `docs/ai-agent-docs/auth.md`
- `docs/ai-agent-docs/client-gateway-contract.md`
- `docs/ai-agent-docs/gateway-engine-contract.md`
- `docs/ai-agent-docs/compliance-matrix.md`

## Example Files

- `docs/ai-agent-docs/examples/approval-request-event.json`
- `docs/ai-agent-docs/examples/approval-result-event.json`
- `docs/ai-agent-docs/examples/invalid-approval-request-event.json`
- `docs/ai-agent-docs/examples/invalid-approval-result-event.json`
- `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json`

## Source Docs

- `docs/ai-agent-docs/primer-audit-playbook.md`
- `docs/ai-agent-docs/security.md`
- `docs/ai-agent-docs/auth.md`
- `docs/ai-agent-docs/client-gateway-contract.md`
- `docs/ai-agent-docs/gateway-engine-contract.md`
- `docs/ai-agent-docs/compliance-matrix.md`
