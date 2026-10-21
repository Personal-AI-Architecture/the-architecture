---
sidebar_label: PAA spec gaps
hide_table_of_contents: true
---

# Gaps: Personal AI Architecture

> Companion to [personal-ai-architecture-spec.md](./personal-ai-architecture-spec.md). Paths are in this repository (paths outside ` ` are relative to the repository root); `template:` means [ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template). This status was refreshed after the canonical-contract, builder, primer, and conformance alignment batches.
>
> Each gap is something the spec expects that the published architecture does not deliver today. Classification is a suggestion for triage: **Defect** (published material is broken or contradicts itself), **Decision needed** (the maintainers must choose), **Technical** (contract and technical work), **Spec-only** (wording fix in the architecture docs). A gap marked **Decided, spec update in progress** has a settled answer that is still being written into the specs and contracts.

**Scoreboard:** The contract-source alignment batch, example-shape validation, documentation freshness tooling, configuration alignment, required parallel tool execution, portable policy semantics, approval lifecycle contracts, transport-neutral identity propagation, tool-definition visibility/source semantics, local-address decision, first executable language-neutral conformance baseline, and template-link cleanup are complete. All gaps tracked before 2026-10-21 are resolved. The 2026-10-21 visitor-1 read-through of the four component specs found nine new gaps, listed under "Open gaps from the component read-through": 4 Technical, 4 Decision needed, 1 Spec-only.

## Routes a developer follows

### GAP-PAA-2: The example checker does not check examples against the contracts — Resolved

- **Expected:** US-13, AC-13.4. A developer can check that the published valid and invalid examples behave as labelled.
- **Published:** `validate-manifest.py` runs from any checkout, checks the manifest, validates JSON Schema-backed examples, and applies canonical envelope checks to the OpenAPI examples. Valid examples must pass and invalid examples must fail their corresponding shape checks.
- **Evidence:** `contracts/examples/validate-manifest.py`; `examples-manifest.json`.

### GAP-PAA-8: Template links to a missing Foundation spec and a missing plan — Resolved

- **Expected:** US-15, AC-15.3.
- **Published:** The template README and agent instructions link the Architecture overview at `architecture/overview.md`. Their "Source Of Truth Order" now starts with the pinned contract source and lists only files that exist in the template; the nonexistent root `plan.md` entry is removed.
- **Evidence:** template:README.md; template:AGENT.md; template:docs/paa-compatibility.md.

### GAP-PAA-10: The documentation freshness check is not published — Resolved

- **Expected:** US-16 AC-16.3 and US-18 AC-18.4. The lock-in gate and the doc-maintenance spec both rely on `check:docs`.
- **Published:** `scripts/check-docs.py` validates the registry, detects stale documents from Git changes, supports PR `--base`/`--head` refs, and implements the documented Tier 1/2 blocking and Tier 3 warning/strict exit behavior. The registry now covers every Markdown file and only existing repository paths.
- **Evidence:** [check-docs.py](../scripts/check-docs.py); [doc-registry.json](../maintainers/doc-registry.json); [doc-maintenance-spec.md](../maintainers/doc-maintenance-spec.md); [lockin-gate.md](../conformance/lockin-gate.md).

## Contracts that disagree (Technical)

### GAP-PAA-3: Event and endpoint shapes differ between `contracts/` and the blueprints and primers — Resolved

- **Expected:** US-13 AC-13.3, US-14 AC-14.3. One authoritative shape; `contracts/` wins.
- **Published:** The canonical contract tree, primers, blueprints, prompts, and conformance references now use the canonical routes, structured message parts, and derived contract manifests.
- **Evidence:** `contracts/openapi/gateway-engine.yaml`; `contracts/openapi/gateway-api.yaml`; [build/blueprints/gateway-agent-loop-contract/blueprint.md](../build/blueprints/gateway-agent-loop-contract/blueprint.md); [build/primers/client-gateway-contract.md](../build/primers/client-gateway-contract.md); [build/blueprints/templates/implement-blueprint-template.md](../build/blueprints/templates/implement-blueprint-template.md).
- **Decided:** one message shape for all three contracts, with tool calls and tool results as normal parts of messages saved in conversation history, and message content as a list of parts. The contract tree is now the sole authority.

### GAP-PAA-4: Configuration has four fields, but examples and the blueprint add more — Resolved

- **Expected:** US-13 AC-13.3; Functional requirements (exactly four runtime fields).
- **Published:** The Configuration blueprint and primer now use the exact four-field runtime contract. Deployment bind/port, persistence, and loop-tuning concerns are no longer presented as runtime-config fields, and the valid example validates against the canonical schema.
- **Evidence:** `contracts/schemas/configuration.json`; [build/blueprints/configuration/blueprint.md](../build/blueprints/configuration/blueprint.md); [build/primers/configuration.md](../build/primers/configuration.md); `contracts/examples/runtime-config.json`.

### GAP-PAA-5: Contract definitions miss rules the prose requires — Resolved

- **Expected:** US-13 AC-13.3.
- **Published:** The internal request schema requires `metadata.correlation_id`; Model API stream events carry `_event_type` discriminators; `stream` is required and must be `true`; tool definitions consistently use canonical `parameters`; and message schemas enforce role-appropriate tool-call/tool-result parts.
- **Evidence:** `contracts/openapi/gateway-engine.yaml`; `contracts/openapi/model-api.yaml`; `contracts/schemas/tool-definition.json`; `contracts/schemas/message.json`; [model-api blueprint](../build/blueprints/model-api/blueprint.md); [tools blueprint](../build/blueprints/tools/blueprint.md).
- **Boundary:** Tool visibility/source semantics were tracked separately as S8 and are now resolved below; this gap covers the contract-shape inconsistencies.

### GAP-PAA-6: Identity allows only a fixed list of actor types — Resolved

- **Expected:** US-10 AC-10.3. New kinds of actor can be added and start with no permissions.
- **Published:** `identity.json` now uses an open string for actor types, while Auth promises new actor types without a schema change.
- **Evidence:** `contracts/schemas/identity.json`; [auth-spec.md](../architecture/auth-spec.md) "Identity types".

### GAP-PAA-7: Two conformance tests contradict agreed promises — Resolved

- **Expected:** US-5 AC-5.1 (next message, no restart) and US-9 AC-9.3 (local-only by default).
- **Published:** SWAP-1 restarts the system to swap provider, which is fine for providers, but it is often read as the model-switch rule; the model rule (no restart) needs to stay separate. DEPLOY-5 accepts only the IPv4 local address, while DEPLOY-3 also accepts the IPv6 one.
- **Evidence:** [swap-tests.md](../conformance/swap-tests.md) SWAP-1, SWAP-2; [arch-tests.md](../conformance/arch-tests.md) DEPLOY-5; [deploy-tests.md](../conformance/deploy-tests.md) DEPLOY-3.
- **Decided:** the model travels with each request; the Gateway reads the owner's current model choice on every message, so a model switch needs no restart. The default local address is the loopback interface: `127.0.0.1` and/or `::1` are valid; wildcard/network addresses require explicit configuration. The model-switch and local-address portions are resolved.

### GAP-PAA-LOCAL-CONFORMANCE: The local address and executable conformance baseline were not settled — Resolved

- **Published:** DEPLOY-3 and DEPLOY-5 now use one loopback rule, accepting IPv4 and IPv6 loopback while rejecting wildcard/network exposure by default. The repository now includes an executable language-neutral conformance runner that validates the canonical examples and core contract invariants.
- **Evidence:** [arch-tests.md](../conformance/arch-tests.md) DEPLOY-5; [deploy-tests.md](../conformance/deploy-tests.md) DEPLOY-3; [runner.py](../conformance/runner.py); [README.md](../conformance/README.md).
- **Decided:** `localhost` means loopback (`127.0.0.1` and/or `::1`), not a specific address family. The first executable kit is contract-first and implementation-neutral; target-specific runtime tests remain additive.

### GAP-PAA-11: Running tool calls at the same time is required, but some blueprints make it optional — Resolved

- **Expected:** US-8 AC-8.4.
- **Published:** The Agent Loop and Tools builder materials now make concurrent execution of independent tool calls a MUST, require stable result association, and preserve ordering for dependent calls. Conformance vectors cover both overlap and ordering failures.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "What the Agent Loop guarantees"; [build/blueprints/agent-loop/blueprint.md](../build/blueprints/agent-loop/blueprint.md) ENG-MUST-017; [build/blueprints/agent-loop/tests.md](../build/blueprints/agent-loop/tests.md); [build/blueprints/tools/blueprint.md](../build/blueprints/tools/blueprint.md).

### GAP-PAA-12: Permission rules have no shared definition for moving between systems — Resolved

- **Expected:** US-3 AC-3.3.
- **Published:** The policy schema and Auth materials now define portable matching (exact, whole wildcard, and trailing path prefix), supported conditions, deny-over-allow precedence, and fail-closed handling for unknown references and unsupported conditions. Canonical Auth vectors cover the semantics.
- **Evidence:** `contracts/schemas/policy.json`; [auth-spec.md](../architecture/auth-spec.md) "Portable policy evaluation"; [build/blueprints/auth/tests.md](../build/blueprints/auth/tests.md); [auth-review.md](../conformance/review-checklists/auth-review.md).

### GAP-PAA-14: How shipped defaults and owner changes are kept apart is not defined — Resolved

- **Expected:** US-11 AC-11.3.
- **Published:** The Customization spec said owner changes survive product updates, but no storage, update or conflict rule says how.
- **Evidence:** [customization-spec.md](../architecture/customization-spec.md); [configuration-spec.md](../architecture/configuration-spec.md) "Layered Overrides".
- **Decided:** the owner has the last word on their own hardware. Product defaults and owner changes are kept apart, conflicts are reported, and how a product keeps them apart is the implementation's choice.

### GAP-PAA-15: Start-up reading of preferences contradicts "only through tools" — Resolved

- **Expected:** US-2 AC-2.1.
- **Published:** Memory says every component reads it only through tools; the Configuration boot sequence read preferences before tools were available.
- **Evidence:** [memory-spec.md](../architecture/memory-spec.md); [configuration-spec.md](../architecture/configuration-spec.md) "How the System Boots".
- **Decided:** tools load before Your Memory is used, and preferences (including the model choice, read on every message) are read through the Memory tools. The configuration and Memory guidance now reflects that order.

### GAP-PAA-16: Approval steps have no defined lifecycle in the contracts — Resolved

- **Expected:** US-10 AC-10.2 (configured approval rules are enforced; products own defaults and how approvals look).
- **Published:** Optional approval interactions now have canonical request and decision schemas, Gateway/Agent Loop stream events, and explicit pending-to-terminal lifecycle semantics. Requests include a stable ID and expiry; decisions are `approved`, `denied`, `cancelled`, or `expired`, require Auth approval authority, and are idempotent on replay without re-executing the tool.
- **Evidence:** [approval-request.json](../contracts/schemas/approval-request.json); [approval-decision.json](../contracts/schemas/approval-decision.json); [gateway-engine.yaml](../contracts/openapi/gateway-engine.yaml); [security-spec.md](../architecture/security-spec.md); [auth tests](../build/blueprints/auth/tests.md).
- **Decided:** the architecture's default remains that the owner can do everything; approval prompts are a product choice, but products that enable them must use this lifecycle and cannot treat presentation as enforcement.

### GAP-PAA-S5: Authenticated identity can be lost when the internal transport changes — Resolved

- **Expected:** An authenticated actor remains the same when Gateway and Agent Loop communicate over HTTP, a message bus, or a direct function call; permissions remain owned by Auth.
- **Published:** `auth_context.json` is the canonical transport-neutral envelope. It carries the Auth-produced actor, authentication ID, timestamps, and correlation ID, but no credentials or permissions. The internal OpenAPI request requires it, and transport adapters must verify integrity and fail closed for missing, malformed, expired, or caller-supplied context.
- **Evidence:** [auth-context.json](../contracts/schemas/auth-context.json); [gateway-engine.yaml](../contracts/openapi/gateway-engine.yaml); [auth-spec.md](../architecture/auth-spec.md); [Gateway ↔ Agent Loop tests](../build/blueprints/gateway-agent-loop-contract/tests.md).
- **Decided:** `X-Actor-ID` is no longer a canonical contract. Headers, message metadata, and direct-call arguments are implementation adapters for the same `auth_context` shape.

### GAP-PAA-S8: Tool-definition visibility and source semantics are inconsistent — Resolved

- **Expected:** A tool definition identifies its source without coupling the architecture to an adapter, and it distinguishes owner-selected model visibility from the current actor's Auth permission.
- **Published:** `tool-definition.json` now requires `source.id` plus `source.kind` (`mcp`, `cli`, `native`, `manifest`, or `builtin`) and a `visibility` object with `mode` (`always_send` or `discoverable`) and `authorization` (`permitted` or `not_permitted`). Tool calls carry `source_id`, so same-named tools from different sources remain distinct. Endpoints, credentials, and adapter configuration are forbidden from definitions.
- **Evidence:** [tool-definition.json](../contracts/schemas/tool-definition.json); [message.json](../contracts/schemas/message.json); [model-api.yaml](../contracts/openapi/model-api.yaml); [tools tests](../build/blueprints/tools/tests.md).
- **Decided:** The owner controls visibility mode; Auth controls only the per-actor authorization marker. Installed but unauthorized tools remain visible/marked rather than being reported as unknown.

## Open gaps from the component read-through

### GAP-PAA-17: The Agent Loop spec says other actors are not its concern — Spec-only

- **Expected:** US-10 AC-10.1 and AC-10.3. Other people and AI agents acting for the owner act only within the permissions the owner grants.
- **Published:** The Agent Loop spec's "Concurrency" section says multi-actor concurrency is not an Agent Loop concern, because a collaborator or external agent always brings their own system and agent loop. The overview and the Auth spec say other people and AI agents can act through the owner's own system with the permissions the owner grants, so they get loops in this Agent Loop. The identity rules already cover this (identity travels with each request and is checked on every tool call); the Concurrency prose and its scenario table need rewording to match.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "Concurrency"; [overview.md](../architecture/overview.md) "The parts" (Auth); [auth-spec.md](../architecture/auth-spec.md).

### GAP-PAA-18: Two messages to the same conversation at once are not defined — Technical

- **Expected:** US-2 AC-2.4. Simultaneous changes do not corrupt data, and conflicts are reported. US-6 AC-6.1: any client can resume a conversation.
- **Published:** The Gateway handles multiple clients connecting at the same time, but no spec says what happens when a second message arrives for a conversation while a loop for that conversation is still running (queue it, reject it, or run both). Two loops could append to one conversation in an unpredictable order.
- **Evidence:** [gateway-spec.md](../architecture/gateway-spec.md) (responsibilities table: "Handle multiple clients connecting simultaneously"); [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md); [agent-loop-spec.md](../architecture/agent-loop-spec.md) "Concurrency".

### GAP-PAA-19: Who handles a model provider being down is contradictory — Decision needed

- **Expected:** One rule for what the Agent Loop does when a provider fails: fall back to another provider, or report and stop. (US-5 itself only promises that switching providers is a configuration change.)
- **Published:** The Agent Loop spec says the Agent Loop does not retry or recover; it reports the failure to the caller. The Models spec says fallback when a provider is down is the Agent Loop's job, and the memory/tool completeness doc says the same.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "What the Agent Loop does not do" (Error recovery) and "Error output"; [models-spec.md](../architecture/models-spec.md) (concerns table: "Fallback if a provider is down"); [memory-tool-completeness.md](../architecture/background/memory-tool-completeness.md).

### GAP-PAA-20: Nobody owns preventing a conversation from outgrowing the model's context window — Decision needed

- **Expected:** One owner for keeping a request inside the model's context window. (US-5 says models differ; no user story promises long conversations work with every model.)
- **Published:** When a request is too large, a `context_overflow` error is reported. Who prevents it is unsettled: the Agent Loop spec says the Agent Loop does not decide what to cut, leaving it to the model, the provider or instructions; the Models spec says the Agent Loop knows the limits of what it is calling; and tool results must reach the model unmodified.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "What the Agent Loop does not do" (Context window management), "Error output" and "Checking an implementation"; [models-spec.md](../architecture/models-spec.md) (concerns table: "Context window awareness"); [build/blueprints/agent-loop](../build/blueprints/) (`context_overflow`).

### GAP-PAA-21: Revoking access cannot stop a running loop — Technical

- **Expected:** US-10. The Auth spec requires that when the owner revokes an agent's access mid-task, the operation stops immediately and uncommitted writes are discarded.
- **Published:** The Agent Loop checks Auth before each tool call, but no spec or contract defines stopping a loop that is already running: there is no cancel signal between the Gateway and the Agent Loop. With no default iteration cap, a loop for a revoked actor keeps calling the model until its next tool check.
- **Evidence:** [auth-spec.md](../architecture/auth-spec.md) "Access revoked during an operation"; [agent-loop-spec.md](../architecture/agent-loop-spec.md) "What the Agent Loop guarantees"; [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md); `contracts/openapi/gateway-engine.yaml`.

### GAP-PAA-22: The Auth and security specs disagree on what happens when Auth is down — Decision needed

- **Expected:** US-10 AC-10.1. One rule for requests and tool calls when Auth cannot be reached.
- **Published:** The Auth spec says the system fails closed: requests that can't be checked are refused and tool calls that can't be checked don't run. The security spec says active sessions with valid tokens may continue. Since every tool call is checked with Auth, an active session cannot do any tool work either way.
- **Evidence:** [auth-spec.md](../architecture/auth-spec.md) "Auth unavailable"; [security-spec.md](../architecture/security-spec.md) (failure table: "Auth provider crashes"); [agent-loop-spec.md](../architecture/agent-loop-spec.md) "Error output".

### GAP-PAA-23: What the Gateway saves when a reply fails partway is not defined — Technical

- **Expected:** US-6 AC-6.3. The system never reports a message as saved when it was not.
- **Published:** No spec or contract says when the Gateway saves the incoming message relative to routing it, or what it keeps when the Agent Loop stream fails partway: the message, a partial reply and its tool events, or nothing. The internal stream's `done` arrives before the Gateway stores anything, while the client-facing `done` means storage has completed.
- **Evidence:** [gateway-spec.md](../architecture/gateway-spec.md) "The Gateway contract"; [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md) "Mid-Stream Errors"; `contracts/openapi/gateway-engine.yaml`; `contracts/openapi/gateway-api.yaml`.

### GAP-PAA-24: Whose identity the AI acts under in conversation is not defined — Decision needed

- **Expected:** US-10 AC-10.1, AC-10.3 and AC-10.4. Each identity acts only within its permissions, and actions are attributed in the audit log.
- **Published:** The Auth spec gives the owner unrestricted access and lists an "interactive agent" with its own identity, limited to the tools and memory it is given. But each request carries one identity, and the Agent Loop uses that same identity for every tool check. If it is the owner, model-driven tool calls get the owner's unrestricted access; if it is the interactive agent, the person it is acting for is lost from authorization and the audit trail.
- **Evidence:** [auth-spec.md](../architecture/auth-spec.md) "Identity types" and "Identity travels with the request"; [agent-loop-spec.md](../architecture/agent-loop-spec.md) "The Agent Loop contract".

### GAP-PAA-25: The audit record format is not defined — Technical

- **Expected:** US-10 AC-10.4. Every action is recorded in an audit log, which the owner can query and export.
- **Published:** Every Auth decision now returns an `audit_id`, and requests and tool calls are authorized, so those decisions are audited. But there is no audit record schema in `contracts/schemas`, so what a record holds, and how other actions (for example a conversation being saved) are recorded, is not defined for export or for moving between Auth implementations.
- **Evidence:** [auth-spec.md](../architecture/auth-spec.md) "Audit log"; [authorization-result.json](../contracts/schemas/authorization-result.json); [security-spec.md](../architecture/security-spec.md).
