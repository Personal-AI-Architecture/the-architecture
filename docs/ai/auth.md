# Auth

> The independent boundary that establishes identity, authorization, and access control across the system.

## Purpose

Authenticate requests, carry actor identity, and enforce permissions without collapsing into Gateway, Engine, or product logic.

## Owns

- Authentication boundary behavior.
- Actor identity model.
- Authorization and permission enforcement.
- Auth-related export and audit expectations defined by the architecture.

## Does Not Own

- Gateway routing.
- Engine loop behavior.
- Conversation management.
- Memory storage internals.
- Product-specific workflow logic outside authorization.

## Actors

- Owner
- Collaborator
- System agent
- Background agent
- External agent
- Service
- Economic actor
- Federated instance

## Required Behaviors

- Exist as a real architectural boundary.
- Authenticate before protected interaction proceeds.
- Carry or reconstruct actor context consistently.
- Enforce authorization at the correct boundary.
- Support extensible permissions as data rather than brittle hardcoded categories.
- Keep auth state inspectable and exportable by the owner.

## Permission Areas

- Memory access
- Tool access
- System actions
- Delegation
- Resource and spending limits
- Approval authority
- External action scope
- Administration

## Forbidden Behaviors

- Disappearing from the runtime path.
- Hardwiring routing or non-auth responsibilities into Auth.
- Storing secrets in normal inspectable Memory files.
- Making permission extensibility require architecture changes.

## Lifecycle Rules

- Auth must remain independently swappable as a component boundary.
- Identity and permission semantics must survive implementation changes.
- Audit and export expectations must remain satisfiable as Auth evolves.

## Required From Day One

- Auth on the real request path.
- Product-owned inspectable auth state.
- `auth_whoami`, `auth_check`, and `auth_export` available in the runtime.
- Local-owner-mode still implemented as a real boundary, not a disabled auth layer.

These are MVP requirements, not later hardening work.

## Audit Questions

- Is Auth actually present on the request path?
- Is identity carried through the system in a contract-consistent way?
- Are permissions enforced by Auth rather than scattered elsewhere?
- Are secrets handled outside normal inspectable Memory?
- Is the implementation only a minimal subset, or does it satisfy the required contract?

## Common Drift Patterns

- Auth omitted or bypassed in runtime wiring.
- Permission logic hardcoded in brittle branches instead of data-driven policy.
- Incomplete export or audit behavior.
- Owner/local implementation narrower than the spec while presenting itself as complete.
- Multiple responsibilities leaking into Auth because it sits on the path.

## Source Docs

- `docs/auth-spec.md`
- `docs/security-spec.md`
- `docs/foundation-spec.md`
- `docs/gateway-engine-contract.md`
- `docs/foundation-verification.md`
