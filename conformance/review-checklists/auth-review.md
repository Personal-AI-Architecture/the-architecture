# Auth Review Checklist

> Fast targeted review checklist for Auth boundary wiring, exportable auth state, and authorization ownership.

## Purpose

Use this when reviewing runtime auth wiring, identity propagation, permission enforcement, or auth-related export/state behavior.

## Checklist

- [ ] The Gateway calls Auth on every request (including list and history reads) before anything reaches the Agent Loop.
- [ ] The Agent Loop asks Auth before each tool call; a refused call doesn't run and is reported as not permitted.
- [ ] Auth remains a real boundary even in local-owner-mode.
- [ ] Identity context is attached consistently and survives a transport change.
- [ ] Authorization decisions are made in Auth rather than scattered through Gateway, Agent Loop, tools, or configuration.
- [ ] Default policy: the owner can do everything; every other identity starts with nothing.
- [ ] After import, a re-created identity has no access until the owner turns it back on.
- [ ] Policy evaluation uses the canonical matching, condition, deny-precedence, and fail-closed reference semantics across Auth implementations.
- [ ] If Auth is unavailable, requests and tool calls fail closed.
- [ ] Product-owned auth state exists and is inspectable/exportable.
- [ ] `auth_whoami`, `auth_check`, and `auth_export` exist in the runtime.
- [ ] Secrets are not written into Memory or any git-tracked file.
- [ ] Approval rules the owner sets are enforced through code, not only policy prose or prompt text; none are required by default.
- [ ] Where approvals are enabled, requests are pending before execution, only approval-authorized identities decide, terminal decisions include cancellation/expiry, and replay is idempotent by request ID.
- [ ] The canonical `auth_context` survives transport changes without credentials or permissions; receiving adapters reject missing, malformed, expired, or caller-supplied context.

## Matrix IDs

- `A-01`
- `A-02`
- `A-03`
- `A-04`
- `A-05`
- `A-06`
- `A-07`
- `A-08`
- `A-09`
- `A-10`
- `A-11`
- `C-04`
- `GC-04`
- `S-03`

## Common Failure Patterns

- Gateway never calls Auth on the real runtime path
- tool calls not checked with Auth
- permissions kept in configuration
- local-owner-mode treated as no-auth mode
- permission checks hardcoded in unrelated components
- auth state lives only in opaque provider systems
- auth export missing or not owner-readable

## Read Next

- `build/primers/auth.md`
- `build/primers/security.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/compliance-matrix.md`

## Source Docs

- `maintainers/primer-audit-playbook.md`
- `build/primers/auth.md`
- `build/primers/security.md`
- `build/primers/gateway-agent-loop-contract.md`
- `build/compliance-matrix.md`
