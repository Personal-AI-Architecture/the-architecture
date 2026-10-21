# Auth

> The independent boundary that establishes identity, authorization, and access control across the system.

## Purpose

Authenticate requests, carry actor identity, and enforce permissions without collapsing into Gateway, Agent Loop, or product logic.

## Owns

- Authentication boundary behavior.
- Actor identity model.
- Authorization and permission enforcement.
- Auth-related export and audit expectations defined by the architecture.

## Does Not Own

- Gateway routing.
- Agent Loop behavior.
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

## Where Auth Is Called

- By the Gateway, on every request (including conversation list and history reads), before anything reaches the Agent Loop or conversation data.
- By the Agent Loop, before each tool call. A refused call does not run; the model is told it is not permitted, which is different from "does not exist".
- Auth is a separate component called through the Auth contract (authenticate, authorize, manage), not middleware owned by the Gateway or the Agent Loop.

## Required Behaviors

- Exist as a real architectural boundary.
- Authenticate before protected interaction proceeds.
- Carry or reconstruct actor context consistently; the identity survives a transport change or a replacement of the Gateway or the Agent Loop.
- Preserve the authenticated actor when the AI acts for the owner; owner authority is expressed through policy and must not silently replace the actor in context or audit records.
- Be the only place permissions live. Configuration and preferences hold none.
- Default policy: the owner can do everything, with no approval prompt required by the architecture. Every other identity starts with nothing until the owner grants it.
- Evaluate portable policy rules with exact/whole-wildcard/trailing-path-prefix matching, all-condition evaluation, deny-over-allow precedence, and fail-closed handling for unknown references or unsupported conditions.
- Enforce approval rules the owner sets; requiring approval by default is a product choice, not an architecture rule.
- Fail closed: requests and tool calls that can't be checked are refused.
- After export and import, keep policies for unknown identities dormant; a re-created identity gets no access until the owner turns it back on.
- Support extensible permissions as data rather than brittle hardcoded categories.
- Keep auth state inspectable and exportable by the owner.
- When an actor is revoked, trigger cancellation of its active Agent Loop turn and record the revocation and stopped operation in the portable audit format.
- Emit portable audit records for auth, tool, Memory, identity, permission, and cancellation events without credentials or raw private content.

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
- Letting tool calls run without an Auth check.
- Storing permissions in configuration or preferences.
- Silently restoring old access to a re-created identity after import.
- Hardwiring routing or non-auth responsibilities into Auth.
- Storing secrets in Memory or any git-tracked file.
- Making permission extensibility require architecture changes.

## Lifecycle Rules

- Auth must remain independently swappable as a component boundary.
- Identity and permission semantics must survive implementation changes.
- Audit and export expectations must remain satisfiable as Auth evolves.

## Required From Day One

- Auth called by the Gateway on every request, and by the Agent Loop before each tool call.
- Product-owned inspectable auth state.
- Audit log of every action, including the owner's.
- `auth_whoami`, `auth_check`, and `auth_export` available in the runtime.
- Local-owner-mode still implemented as a real boundary, not a disabled auth layer.

These are MVP requirements, not later hardening work.

## Audit Questions

- Does the Gateway call Auth on every request?
- Does the Agent Loop ask Auth before each tool call, and report refusals as "not permitted"?
- Is identity carried through the system in a contract-consistent way?
- Are permissions enforced by Auth rather than scattered elsewhere (including configuration)?
- Can the owner do everything by default, without architecture-imposed approval prompts?
- Are secrets handled outside normal inspectable Memory?
- Is the implementation only a minimal subset, or does it satisfy the required contract?

## Common Drift Patterns

- Auth omitted or bypassed in runtime wiring.
- Auth checked per request but not per tool call.
- Permission or approval rules kept in configuration files.
- Permission logic hardcoded in brittle branches instead of data-driven policy.
- Incomplete export or audit behavior.
- Owner/local implementation narrower than the spec while presenting itself as complete.
- Multiple responsibilities leaking into Auth because it sits on the path.

## Source Docs

- `architecture/auth-spec.md`
- `architecture/security-spec.md`
- `architecture/overview.md`
- `architecture/gateway-agent-loop-contract.md`
- `conformance/foundation-verification.md`
