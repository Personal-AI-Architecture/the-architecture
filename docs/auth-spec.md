# Auth Spec: Identity, Access, and Permissions

> **Project:** Pivot
> **Generated from:** Auth interview session (Dave W + Claude) on 2026-02-23
> **Status:** Final — ready for implementation
> **Architecture:** See `foundation-spec.md` for platform architecture (components, contracts, connectors)

---

## How we define auth

Every AI system has some form of access control — ChatGPT has user accounts and sessions, Copilot inherits your organization's credentials, agent frameworks usually punt auth to the developer. In those systems, auth is a **feature of the application** — a login screen, a session cookie, maybe an API key. The app decides what you can do.

Here, auth is a **first-class component** of the architecture. A personal AI system that stores your memory, manages your tools, and acts on your behalf needs access control from the start — not as a login screen, but as an architectural boundary. Auth controls who can access your memory, what tools they can use, what actions they can take, and what happens when things go wrong — across humans, AI agents, services, and eventually federated systems.

Why a separate component? Because if auth lived in the Model, you couldn't swap models. Auth policies, permissions, identity verification — these must persist across model swaps. Switch models, and your collaborators' access shouldn't disappear. Your approval policies shouldn't reset. Your audit trail shouldn't break. This is the same argument that keeps the Model outside Your Memory. Memory is inert so it stays portable. Auth is independent so the Model stays swappable. Each component's independence is what makes the other components swappable.

Auth is a **cross-cutting layer** — it touches every other component, it's security-critical from day one, and bad auth decisions are expensive to reverse. Auth is independent of the Gateway — both can be swapped without affecting the other. Auth is a **memory concern** — it controls who can read, write, and act on the owner's memory. Not a hosting concern, not an infrastructure concern.

This is a **requirements and design spec**, not a technology choice document. The auth contract defined here is implementation-agnostic — any technology that satisfies the contract is valid. Technology recommendations are in `research/auth-research.md`.

This is a **Level 1 (Foundation) spec** — it defines what the auth system does at the generic, unopinionated level. Product-specific auth choices (technology stack, managed hosting policies, MFA requirements, product evolution timeline) are Level 2 concerns documented in `research/auth-research.md` §Product Auth Design.

**Related documents:** `foundation-spec.md` (architecture overview, links to all component specs)

---

## Guiding Principles

These constrain every auth design choice.

### Auth Is Separate So the Model Stays Swappable

In a human brain, intelligence handles access control — you decide who to trust, what to share, what to keep private. No separate auth system. But in a personal AI architecture, intelligence is swappable. If auth lived in the Model, swapping models means losing security. Auth policies, permissions, identity verification — these must persist regardless of which model is plugged in.

This is the same root as why the Model is external to Memory. Memory is inert so it stays portable. Auth is independent so the Model stays swappable. The independence of each component is what makes the others swappable.

### Auth Is a Memory Concern

Auth controls who can read, write, and act on the owner's memory. Infrastructure isolation (managed hosting separating instances) and memory permissions (who can access what within an instance) are separate problems with separate solutions. Auth is a memory concern, not a hosting concern, not an infrastructure concern.

### Start Constrained, Owner Drives Expansion

The permission model starts maximally constrained. The owner loosens it as they gain confidence. The system never grants itself more permission — the owner always drives expansion. This applies to:

- Approval flow (ask everything → ask nothing)
- Collaborator access (owner only → invited collaborators)
- Agent autonomy (human approves all → standing permissions)
- External connections (none → authorized services)

### Auth Through Conversation

The primary way to manage auth is through the same interface as everything else — conversation. "Give my business partner read access to finances" should just work. "Stop asking me to approve file edits" should just work. Settings pages exist as a fallback.

This means the auth system must be accessible through tools — the agent reads and modifies permissions the same way it reads and modifies memory.

### Owner Inspectability

The owner can inspect, modify, and export their complete auth state — identities, policies, configuration. No opaque auth databases they can't access. The auth data is theirs just like their memory is theirs.

### Each Instance Is Its Own Authority

Each system instance is its own identity authority. There is no central auth server that everyone connects to. Every instance is self-contained and could operate independently. This is the foundation for federation — instance-to-instance trust relationships without a central authority.

### Open Standards

Auth uses open standards wherever possible — OAuth 2.1, OpenID Connect, standard token formats. Not proprietary auth protocols. This makes the system interoperable, reduces lock-in, and means the community can integrate with existing identity infrastructure.

### Swappable Implementation

The auth contract is what the rest of the system depends on. The auth provider behind that contract is an implementation detail. If the auth technology needs to change, only the auth component changes — nothing else is affected.

---

## What Auth Does NOT Do

These are explicit boundaries. They exist to prevent other concerns from creeping into auth.

| Responsibility | Where It Lives | NOT in Auth |
|---------------|---------------|-------------|
| Persist data | Your Memory (via tools) | Auth does not own data storage |
| Decide what to do | Model (via Engine) | Auth does not make content decisions |
| Route requests | Gateway | Auth does not route |
| Execute tools | Engine | Auth does not execute |
| Manage conversations | Gateway | Auth does not track conversations |
| Define product behavior | Your Memory (instructions, skills) | Auth has no product logic |

Auth's job is one thing: **gate access**. Every request passes through auth. Auth says yes or no. Everything else belongs to other components.

---

## Actors

The auth system must support these actor types. The identity model should accommodate all types from the start — even if only the owner exists initially — so that adding new actor types is a data change, not a schema change.

**Level 1 implementation:** Build the schema and headers for all actor types, but only the owner flow needs to work at runtime. Multi-actor paths exist in the data model — they don't need to be exercised until a future capability phase activates them.

### Humans

| Actor | Description |
|-------|-------------|
| **Owner** | The person whose system this is. Full control over everything — memory, permissions, configuration, who gets access. Exactly one owner per instance. |
| **Collaborator** | A human invited by the owner with scoped access. A business partner who sees finances, an assistant who sees projects, a family member with access to shared content. Each collaborator has individually configured permissions. |

### Internal Agents

These actors run inside the deployment. They are trusted infrastructure — code the owner deployed, operating under the system's rules.

| Actor | Description |
|-------|-------------|
| **System agent** | The interactive AI agent. Acts on the owner's behalf during conversations. Constrained by configured tool and memory scope. |
| **Background agent** | Scheduled or autonomous tasks that run without a human in the loop. Needs its own identity so the owner can distinguish "the background task changed this" from "I changed this." |

### External Actors

These actors connect from outside the deployment. They are someone else's code asking for access — fundamentally different trust model from internal actors. Must prove identity, receive explicitly scoped permissions, and access is revocable at any time.

| Actor | Description |
|-------|-------------|
| **External agent** | Another AI acting on behalf of someone else (or on behalf of the owner via an external service). |
| **Service** | An integration — calendar sync, email connector, webhook receiver. Connects via API with scoped access. |
| **Economic actor** | Something that can spend money — purchases, payments, marketplace transactions. Needs spending limits and audit trails. |

### Federated

| Actor | Description |
|-------|-------------|
| **Another instance** | A whole other system instance interacting with yours through open protocols. Bidirectional trust relationship. Neither side needs an account on the other — trust is established at the instance level. |

---

## Permission Model

The auth system enforces permissions across these categories. The permission model must be extensible — new categories can be added without re-architecting.

### 1. Memory Access

Who can read, write, and delete which parts of memory.

| Scope | Example |
|-------|---------|
| Full access | Owner has unrestricted access |
| Per-path | Collaborator can read/write a specific folder |
| Per-resource | Agent can only modify a specific file |
| Read-only | Collaborator can read but not modify |

### 2. Tool Access

Which tools and capabilities each actor can use.

| Scope | Example |
|-------|---------|
| All tools | Owner has unrestricted tool access |
| Read tools only | A collaborator can search and read but not write |
| Specific tools | Background agent can use `edit` but not `delete` |
| No tools | A viewer can see content through the client but can't trigger agent actions |

### 3. System Actions

What system-level operations each actor can perform beyond memory and tool operations.

| Action | Example |
|--------|---------|
| Change settings | Can this actor modify model selection, API keys? |
| Manage permissions | Can this actor change auth policies? |
| Create/manage identities | Can this actor invite collaborators, register agents? |

### 4. Delegation

Whether an actor can grant access to others.

| Scope | Example |
|-------|---------|
| No delegation | Collaborator can use their access but can't share it |
| Limited delegation | Collaborator can invite others to resources within their own scope |
| Full delegation | Trusted collaborator can invite others with up to their own permission level |

### 5. Resource and Spending Limits

Quantitative constraints — not just "can you do this" but "how much."

| Limit | Example |
|-------|---------|
| AI usage budget | Collaborator's interactions consume at most N tokens per month |
| Spending cap | Agent can spend up to $X per transaction |
| Rate limiting | External agent limited to N requests per minute |
| Storage limits | Collaborator's writes can't exceed N MB |

### 6. Approval Authority

What each actor can approve, and what requires escalation.

| Level | Example |
|-------|---------|
| No approval authority | Collaborator's changes always need owner approval |
| Scoped auto-approve | Background agent can auto-approve routine operations but escalates structural changes |
| Full auto-approve | Owner has turned off approval for their own agent |
| Standing permissions | Agent has pre-approved rules for common operations |

The approval model is a spectrum, not a binary:
- **Ask for everything** — default for new configurations
- **Ask for some things** — owner defines what needs approval per actor
- **Ask for nothing** — owner trusts the system fully, version history is the safety net

### 7. External Action Scope

What actors can do outside the system boundary.

| Scope | Example |
|-------|---------|
| No external actions | Agent stays inside the memory boundary |
| Specific services | Agent can read your calendar but not send emails |
| Spending authority | Agent can make purchases up to a limit |
| Communication | Agent can send messages on your behalf to approved contacts |

### 8. Administration

Who can change the rules themselves.

| Scope | Example |
|-------|---------|
| Full admin | Owner can change any permission, invite/revoke anyone, modify auth config |
| Limited admin | Trusted collaborator can invite others to their own scope |
| No admin | Most actors cannot change permissions |

### Extensibility

The permission model must support adding new categories without re-architecture. The contract is `(identity, resource, action) → decision` where resource and action are not hardcoded enums but extensible types. New permission categories are new resource types and action types — not changes to the model itself.

---

## The Auth Contract

The rest of the system never talks to an auth provider directly. It talks to a contract. This is what makes the auth implementation swappable.

### Interface

Three operations:

| Operation | Input | Output | Used By |
|-----------|-------|--------|---------|
| **Authenticate** | Request (cookie, token, or API key) | Identity (who is this, what type, active/inactive) | Auth middleware — every request passes through this |
| **Authorize** | Identity + resource + action | Allow or deny | Engine (before tool calls), client (before rendering), tools (before execution) |
| **Manage** | Identity + permission change | Success or failure | Agent (through tools, when owner asks), settings UI (as fallback) |

### Data Format

The product owns the data format for identities and policies. The auth provider stores data in this format, not its own. This ensures:

- **Migration between providers.** Switch auth technology without losing identities.
- **Export with memory.** Permission policies and identity records are extractable in a known format.
- **Owner inspection.** The owner can see exactly what's in their auth state — no opaque databases.

**Identities:**
- ID, type (owner | collaborator | agent | service | economic | federated), display name, created timestamp, status (active | suspended | revoked)
- Type field is extensible — new actor types are new values, not schema changes

**Policies:**
- `(subject, resource, action) → effect` where subject is an identity, resource is extensible (memory path, tool name, system action, external service), action is extensible (read, write, delete, execute, delegate, approve, configure), and effect is allow or deny
- Policies are data, not code — adding a new permission is adding a row, not writing a conditional

**Audit log:**
- Who did what, when, to which resource, with what result
- Required when external actors are introduced, but the schema should exist from the start

### Tool Access

The auth system is accessible through tools so the agent can read and modify permissions through conversation:

| Tool | What It Does |
|------|-------------|
| `auth_whoami` | Returns the current identity and active permissions |
| `auth_check` | Checks if a specific action on a specific resource is allowed |
| `auth_list_policies` | Lists current permission policies |
| `auth_grant` | Grants a permission (owner or delegator only) |
| `auth_revoke` | Revokes a permission or identity |
| `auth_list_identities` | Lists all identities with access |
| `auth_create_identity` | Creates a new identity (invite collaborator, register agent) |
| `auth_audit` | Queries the audit log |
| `auth_export` | Exports complete auth state (identities + policies) |

The minimal set (`auth_whoami`, `auth_check`, `auth_export`) should exist from the start. Others are added as the actor model expands.

---

## Failure Modes

### Session Expiry Mid-Conversation

**Scenario:** Owner is in the middle of a conversation. Session expires.

**Required behavior:** Silent refresh. The client handles token refresh transparently. The owner never sees a login screen mid-conversation. No work is lost. If silent refresh fails (e.g., credentials were revoked), redirect to login with conversation state preserved for after re-authentication.

### Access Revoked During Active Operation

**Scenario:** An external agent is mid-task and the owner revokes its access.

**Required behavior:** Current operation terminates immediately. The owner said stop, so stop. Any in-progress writes that haven't been committed are discarded. The agent receives an auth error and cannot retry. Audit log records the revocation and the terminated operation.

### Owner Locked Out

**Scenario:** Owner lost credentials, no recovery method configured.

**Required behavior:** On a local deployment, the owner has filesystem access. Recovery path is through the filesystem — reset credentials via CLI tool or direct database modification. This is the owner's responsibility. Product-specific recovery paths (managed hosting support, account recovery flows) are Level 2 concerns.

### Auth Provider Failure

**Scenario:** The auth provider crashes or becomes unavailable.

**Required behavior:** The system fails closed — unauthenticated requests are denied. Active sessions with valid tokens may continue operating (depending on token validation approach). The client shows a clear error. No data is exposed. Auth recovery is an operational concern.

### Stale Permissions After Export/Import

**Scenario:** Owner exports from one deployment, imports to another. Permission policies reference identities that don't exist on the new deployment.

**Required behavior:** Policies import cleanly. References to unknown identities are preserved but inactive — no access is granted for identities that can't authenticate. When the owner re-establishes those identities, existing policies apply automatically.

---

## Data Portability

### What Exports

When an owner exports their system, the export includes:

| Data | Included | Format |
|------|----------|--------|
| Memory (files, content) | Yes | As-is, open formats |
| Permission policies | Yes | Product-owned format (JSON/YAML) |
| Identity records | Yes (metadata only) | Display names, types, creation dates, policy associations |
| Credentials | No | Passwords, tokens, keys are not exportable |
| Audit log | Yes | Queryable records of who did what |
| Auth configuration | Yes | Approval settings, default policies |

### What Doesn't Export

- Password hashes and authentication credentials (security — re-created on import)
- Active session tokens (invalid on a different instance)

---

## Evolution

Auth expands in capability phases. Each phase is additive — the core contract doesn't change.

| Phase | What's Added | What Stays the Same |
|-------|-------------|-------------------|
| **Owner only** | One human owner, full access, configurable approval flow, API keys for programmatic access | Auth contract, identity schema, policy model |
| **Internal agents** | Background agents with own identities, scoped permissions, configurable approval per agent | Everything above |
| **Collaborators** | Invited humans with per-path memory access, tool restrictions, delegation rules, resource limits | Everything above |
| **External actors** | External agents and services with time-bound scoped tokens, spending limits, audit trails, OAuth 2.1 token issuance | Everything above |
| **Federation** | Instance-to-instance trust via open protocols, bidirectional permissions, each instance is its own authority | Everything above |

The pattern: **add actor types and permission rules, don't change the contract.** Each expansion is a data change (new identity types, new policy rows), not an architecture change.

---

## Decisions Made

| # | Decision | Rationale |
|---|----------|-----------|
| D22 | Login required on every access — even on local | Local deployment still needs authentication. Filesystem access is not the same as authenticated system access. Prevents accidental exposure if the system is network-accessible. |
| D27 | Auth is a memory concern — not hosting, not infrastructure | Auth controls who can read, write, and act on the owner's memory. Infrastructure isolation (separating instances) and memory permissions (who can access what within an instance) are separate problems. |
| D60 | Auth is a cross-cutting concern — independent of the Gateway | Auth and the Gateway don't know about each other. Requests must be authenticated before interacting with the system, but how (middleware, proxy, sidecar) is an implementation decision. Both can be swapped independently. |
| D149 | Auth is a separate component — so the Model stays swappable | If auth lived in the Model, swapping models means losing security. Same pattern as Model outside Memory. Each component's independence is what makes the others swappable. |

---

## Open Questions

### ~~OQ-1: Tool-Level Identity Propagation~~ — RESOLVED

**Resolution:** Not needed at Level 1. Each system has one owner — the Engine always runs as that owner (D151). Multi-actor collaboration is system-to-system: collaborators bring their own systems and access shared Memory through Auth, not as users within your system. There are no users, only owners. If a future capability phase introduces delegated agents acting within the system, identity propagation becomes relevant — design it then, not now.

### ~~OQ-2: Outbound Data Flow to External Tools~~ — RESOLVED

**Resolution:** At Level 1, tool availability is the outbound data control. The owner chooses which tools are enabled (D109) — if you enable an external tool, you've accepted that the model may send data to it. The model decides what to include in each tool call, but can only call tools the owner made available. Fine-grained outbound policies (per-tool data restrictions, content filtering, "never send financial data to this tool") are Level 2 product features, not a foundation concern.

---

## Success Criteria

- [ ] Every request is authenticated before interacting with the system — unauthenticated requests rejected
- [ ] Owner can set up credentials on first run
- [ ] API keys can be generated for programmatic access
- [ ] Approval flow is configurable (ask everything → ask some things → ask nothing)
- [ ] Auth state is exportable — identities, policies, configuration
- [ ] Swapping the auth provider requires changing only the auth component — no other component is affected
- [ ] Auth data format is product-owned, not provider-specific
- [ ] Identity schema supports all actor types (even if only owner exists initially)
- [ ] Policy model supports all permission categories (even if only "owner can do everything" is initially active)
- [ ] Adding a new actor type is a data change, not a code change

---

## Security Requirements

Per-component requirements from `security-spec.md`. Security-spec owns the "why"; this section owns the "what" for Auth.

- [ ] Every request must be authenticated before interacting with the system (D22)
- [ ] Unauthenticated requests must be rejected — fail closed
- [ ] Auth state must be exportable — the owner's identity and policy data belongs to them
- [ ] Auth must be independent of the Gateway — swapping either doesn't affect the other (D60)
- [ ] Auth data format must be product-owned, not provider-specific — enabling migration between auth providers

---

## Related Documents

`foundation-spec.md` (architecture overview, links to all component specs)

---

## Changelog

| Date | Change | Source |
|------|--------|--------|
| 2026-03-01 | Codex cross-reference audit fix: Added Level 1 implementation note to Actors section — build schema/headers for all actor types, only owner flow needs to work at runtime. Closes ambiguity between schema-readiness and runtime scope. | Codex audit (Dave W + Claude) |
| 2026-03-01 | "No users, only owners" language pass: user → owner | Ownership model alignment (Dave W + Claude) |
| 2026-03-01 | Rewritten as Level 1 foundation spec. All BrainDrive-specific content (managed hosting, product evolution timeline, technology-specific OQs, payment lapse flows, BrainDrive-the-company actor, product decisions required) moved to `research/auth-research.md` §Product Auth Design. Structure aligned with engine-spec and memory-spec: opener compares to industry then states architectural principle, guiding principles derived from architecture not product philosophy, generic actor taxonomy, evolution as capability phases not product versions. 9 OQs reduced to 2 (Level 1 only). | Foundation alignment (Dave W + Claude) |
| 2026-02-27 | Reframed opener as "How we define auth". Merged sections. Added Level 1 note. | Spec reorder + trim (Dave W + Claude) |
| 2026-02-27 | Added Security Requirements section — cross-referenced from security-spec.md per T-219 | T-219 (Dave W + Claude) |
| 2026-02-23 | Initial auth spec created from interview | Auth interview session (Dave W + Claude) |
| 2026-02-23 | Terminology update — Harness→Engine, component count corrected, aligned with D39-D65 | Reconciliation pass |

---

*Auth is the gatekeeper — the component that makes all other components safely swappable. Its independence is what lets the Model, Engine, Gateway, and even Auth itself be replaced without compromising security. A personal AI system needs access control that persists regardless of what intelligence is plugged in.*
