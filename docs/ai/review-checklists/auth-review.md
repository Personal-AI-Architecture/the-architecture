# Auth Review Checklist

> Fast targeted review checklist for Auth boundary wiring, exportable auth state, and authorization ownership.

## Purpose

Use this when reviewing runtime auth wiring, identity propagation, permission enforcement, or auth-related export/state behavior.

## Checklist

- [ ] Every protected request passes through Auth before system interaction.
- [ ] Auth remains a real boundary even in local-owner-mode.
- [ ] Identity context is attached consistently on the path between Gateway and Engine.
- [ ] Authorization decisions are made in Auth rather than scattered through Gateway, Engine, or tools.
- [ ] Product-owned auth state exists and is inspectable/exportable.
- [ ] `auth_whoami`, `auth_check`, and `auth_export` exist in the runtime.
- [ ] Secrets are not written into normal inspectable Memory.
- [ ] Approval authority is enforced through code, not only policy prose or prompt text.

## Matrix IDs

- `A-01`
- `A-02`
- `A-03`
- `A-04`
- `A-05`
- `GC-04`
- `S-03`

## Common Failure Patterns

- auth middleware missing from real runtime path
- local-owner-mode treated as no-auth mode
- permission checks hardcoded in unrelated components
- auth state lives only in opaque provider systems
- auth export missing or not owner-readable

## Read Next

- `docs/ai/auth.md`
- `docs/ai/security.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/compliance-matrix.md`

## Source Docs

- `docs/ai/primer-audit-playbook.md`
- `docs/ai/auth.md`
- `docs/ai/security.md`
- `docs/ai/gateway-engine-contract.md`
- `docs/ai/compliance-matrix.md`
