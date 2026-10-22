---
sidebar_label: PAA spec gaps
hide_table_of_contents: true
---

# Gaps: Personal AI Architecture

> Companion to [personal-ai-architecture-spec.md](./personal-ai-architecture-spec.md). Paths are in this repository (paths outside ` ` are relative to the repository root); `template:` means [ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template). This status was refreshed after the canonical-contract, builder, primer, and conformance alignment batches.
>
> Each gap is something the spec expects that the published architecture does not deliver today. Classification is a suggestion for triage: **Defect** (published material is broken or contradicts itself), **Decision needed** (the maintainers must choose), **Technical** (contract and technical work), **Spec-only** (wording fix in the architecture docs). A gap marked **Decided, spec update in progress** has a settled answer that is still being written into the specs and contracts.

**Scoreboard:** The contract-source alignment batch, example-shape validation, documentation freshness tooling, configuration alignment, required parallel tool execution, portable policy semantics, approval lifecycle contracts, transport-neutral identity propagation, tool-definition visibility/source semantics, local-address decision, first executable language-neutral conformance baseline, template-link cleanup, the visitor-1 decisions on GAP-PAA-18, 19 and 23, the v1 identity rule for GAP-PAA-24 (agent identities deferred to the agents step), the Auth-down fail-closed correction, multi-actor wording, revocation cancellation, and portable audit records are complete. GAP-PAA-20 stays open with Dave J.

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

### GAP-PAA-17: The Agent Loop spec says other actors are not its concern — Resolved

- **Expected:** US-10 AC-10.1 and AC-10.3. Other people and AI agents acting for the owner act only within the permissions the owner grants.
- **Published:** The Agent Loop spec's "Concurrency" section says multi-actor concurrency is not an Agent Loop concern, because a collaborator or external agent always brings their own system and agent loop. The overview and the Auth spec say other people and AI agents can act through the owner's own system with the permissions the owner grants, so they get loops in this Agent Loop. The identity rules already cover this (identity travels with each request and is checked on every tool call); the Concurrency prose and its scenario table need rewording to match.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "Concurrency"; [overview.md](../architecture/overview.md) "The parts" (Auth); [auth-spec.md](../architecture/auth-spec.md).
- **Published:** The concurrency section now distinguishes shared loop state from multi-actor access: collaborators and external agents may use the same generic Agent Loop under their own authenticated `auth_context` and owner-granted permissions. Their identity is never replaced by the owner identity.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "Concurrency"; [auth-spec.md](../architecture/auth-spec.md) "Identity travels with the request".

### GAP-PAA-18: Two messages to the same conversation at once are not defined — Resolved

- **Expected:** US-2 AC-2.4. Simultaneous changes do not corrupt data, and conflicts are reported. US-6 AC-6.1: any client can resume a conversation.
- **Published:** The Gateway now permits different conversations to run concurrently but serializes messages within one conversation, queueing later messages in arrival order until the active turn reaches `done` or `error`.
- **Evidence:** [gateway-spec.md](../architecture/gateway-spec.md) "Concurrent messages in one conversation"; [decisions.md](../architecture/decisions.md) D187.
- **Decided:** One active Agent Loop turn per conversation; later messages queue in arrival order, and implementations report queue failures rather than accepting work silently.

### GAP-PAA-19: Who handles a model provider being down is contradictory — Resolved

- **Expected:** One rule for what the Agent Loop does when a provider fails: fall back to another provider, or report and stop. (US-5 itself only promises that switching providers is a configuration change.)
- **Published:** The Agent Loop reports the provider error and stops the current turn. PAA does not require automatic provider fallback; an explicit product retry or provider change is outside the failed turn.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "What the Agent Loop does not do"; [models-spec.md](../architecture/models-spec.md) "Why Models Are Not a Component"; [decisions.md](../architecture/decisions.md) D188.
- **Decided:** No silent or automatic provider fallback in the architecture.

### GAP-PAA-20: Nobody owns preventing a conversation from outgrowing the model's context window — Decision needed

- **Expected:** One owner for keeping a request inside the model's context window. (US-5 says models differ; no user story promises long conversations work with every model.)
- **Published:** When a request is too large, a `context_overflow` error is reported. Who prevents it is unsettled: the Agent Loop spec says the Agent Loop does not decide what to cut, leaving it to the model, the provider or instructions; the Models spec says the Agent Loop knows the limits of what it is calling; and tool results must reach the model unmodified.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "What the Agent Loop does not do" (Context window management), "Error output" and "Checking an implementation"; [models-spec.md](../architecture/models-spec.md) (concerns table: "Context window awareness"); [build/blueprints/agent-loop](../build/blueprints/agent-loop/) (`context_overflow`).
- **Status (2026-10-22 call):** With Dave J to investigate. BrainDrive's reference build handles this in the Gateway (`gateway/context-window.ts`): it keeps the newest turns within a token budget, replaces older turns with a short summary, saves the dropped text to memory, and warns the owner. Open points: BrainDrive caps tool results at 4,000 characters, against the rule that tool results reach the model unmodified, and its budget is one fixed setting rather than the selected model's limit.

### GAP-PAA-21: Revoking access cannot stop a running loop — Resolved

- **Expected:** US-10. The Auth spec requires that when the owner revokes an agent's access mid-task, the operation stops immediately and uncommitted writes are discarded.
- **Published:** The Agent Loop checks Auth before each tool call, but no spec or contract defines stopping a loop that is already running: there is no cancel signal between the Gateway and the Agent Loop. With no default iteration cap, a loop for a revoked actor keeps calling the model until its next tool check.
- **Evidence:** [auth-spec.md](../architecture/auth-spec.md) "Access revoked during an operation"; [agent-loop-spec.md](../architecture/agent-loop-spec.md) "What the Agent Loop guarantees"; [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md); `contracts/openapi/gateway-engine.yaml`.
- **Published:** The internal contract now defines `POST /agent-loop/cancel`, targeted by correlation ID. Revocation sends `reason=auth_revoked`; the Agent Loop cooperatively cancels supported in-flight work, runs no further tool calls, emits `auth_error`, and records the cancellation. Tool implementations do not commit writes after cancellation; already committed writes remain auditable.
- **Evidence:** [gateway-engine.yaml](../contracts/openapi/gateway-engine.yaml); [auth-spec.md](../architecture/auth-spec.md) "Access revoked during an operation"; [agent-loop-spec.md](../architecture/agent-loop-spec.md) checking list.
- **Decided:** Cancellation is cooperative at the internal boundary; implementations must cancel supported in-flight operations and must not start further model or tool work after cancellation is observed.

### GAP-PAA-22: The security spec contradicts the decided fail-closed rule when Auth is down — Resolved

- **Expected:** US-10 AC-10.1. One rule for requests and tool calls when Auth cannot be reached.
- **Published:** The security failure table now says that requests and tool calls whose current Auth checks cannot complete are denied, including requests from sessions that previously had valid tokens.
- **Evidence:** [security-spec.md](../architecture/security-spec.md) (failure table: "Auth provider crashes"); [auth-spec.md](../architecture/auth-spec.md); [agent-loop-spec.md](../architecture/agent-loop-spec.md) "Error output"; [authorization-result.json](../contracts/schemas/authorization-result.json).

### GAP-PAA-23: What the Gateway saves when a reply fails partway is not defined — Resolved

- **Expected:** US-6 AC-6.3. The system never reports a message as saved when it was not.
- **Published:** The Gateway persists the incoming message before dispatch when possible. If the stream fails, it retains observed assistant text, tool calls, tool results and an explicit error outcome as an incomplete turn; it never reports the turn as complete. If initial persistence fails, it does not dispatch the request.
- **Evidence:** [gateway-spec.md](../architecture/gateway-spec.md) "Concurrent messages in one conversation" and "Error output"; [decisions.md](../architecture/decisions.md) D189.
- **Decided:** Preserve partial history with a terminal error outcome; completion is reported only after successful persistence.

### GAP-PAA-24: Whose identity the AI acts under in conversation is not defined — Resolved

- **Expected:** US-10 AC-10.1, AC-10.3 and AC-10.4. Each identity acts only within its permissions, and actions are attributed in the audit log.
- **Published:** In v1 the AI in a conversation acts under the owner's identity. Every v1 tool call is internal, on the owner's own memory.
- **Evidence:** [auth-spec.md](../architecture/auth-spec.md) "Identity travels with the request"; [decisions.md](../architecture/decisions.md) D190.
- **Decided (2026-10-22 call):** Owner identity for v1. Distinct identities for AI agents acting for the owner are deferred to the agents step, when PAA adds external tool calls or external agents.

### GAP-PAA-25: The audit record format is not defined — Resolved

- **Expected:** US-10 AC-10.4. Every action is recorded in an audit log, which the owner can query and export.
- **Published:** Every Auth decision now returns an `audit_id`, and requests and tool calls are authorized, so those decisions are audited. But there is no audit record schema in `contracts/schemas`, so what a record holds, and how other actions (for example a conversation being saved) are recorded, is not defined for export or for moving between Auth implementations.
- **Evidence:** [auth-spec.md](../architecture/auth-spec.md) "Audit log"; [authorization-result.json](../contracts/schemas/authorization-result.json); [security-spec.md](../architecture/security-spec.md).
- **Published:** `contracts/schemas/audit-record.json` defines the portable record required for audit export and provider swaps: stable ID, timestamp, event, authenticated actor, action, optional resource, result, safe reason, correlation ID, and optional non-sensitive details. A canonical example is validated by the manifest checker.
- **Evidence:** [audit-record.json](../contracts/schemas/audit-record.json); [audit example](../contracts/examples/audit-record.json); [auth-spec.md](../architecture/auth-spec.md) "Audit log"; [security-spec.md](../architecture/security-spec.md) "Audit Logging".
- **Decided:** The architecture fixes the portable envelope and privacy boundary; retention, redaction policy beyond the no-secrets rule, indexing, and presentation remain implementation choices.

### GAP-PAA-26: Switching provider needs a restart, but the reference build switches per message — Decision needed

- **Expected:** US-5. The owner can use different models for different tasks, across cloud and local providers, without being stuck with one company.
- **Published:** Runtime config names one `provider_adapter`, and a provider swap changes runtime config, the adapter config and a secret, with a restart allowed. Only a model change within the loaded adapter takes effect on the next message. BrainDrive goes further: one adapter config lists several provider profiles (for example BrainDrive Models, OpenRouter and Ollama), the active profile is an owner preference in Your Memory next to the model, and both are re-read on every message, so switching provider needs no restart. Keys stay out of Your Memory: a profile names a secret reference.
- **Proposed:** Adopt that pattern. The adapter config may list provider profiles; the active provider is an owner preference read on every message, like the model; a restart stays allowed only when a new kind of adapter (a new format) is installed. Choosing a model per task within one conversation stays out of scope.
- **Evidence:** [configuration-spec.md](../architecture/configuration-spec.md) "Provider swap" and "Model swap"; [adapter-spec.md](../architecture/adapter-spec.md); [configuration.json](../contracts/schemas/configuration.json) `provider_adapter`; [adapter-config.json](../contracts/examples/adapter-config.json); BrainDrive `builds/typescript/adapters/openai-compatible.json` (`provider_profiles`) and `gateway/server.ts` (per-message `active_provider_profile`).

### GAP-PAA-27: The promises to report a missing model or capability have no error codes — Technical

- **Expected:** US-5 AC-5.3. Capabilities a model lacks are reported, not faked; and if the chosen model isn't available through the loaded adapter, the owner is told rather than silently switched. Swapping adapters must not change whether the owner is told.
- **Published:** The Model API's `CompletionError.code` is free text, so no implementation has to report either case in a way another part, or the validator, can recognize. BrainDrive reports both by matching words in each provider's error text (`builds/typescript/engine/errors.ts`).
- **Proposed:** Define only the codes a promise depends on: `model_unavailable` and `capability_unsupported` (naming the missing capability), on both the Model API error and the Agent Loop error stream, whose `code` list (`provider_error`, `tool_error`, `auth_error`, `context_overflow`) is in `gateway-engine.yaml`. Other provider errors (rate limits, quota, rejected keys) stay free text, and how an adapter detects any of them stays its own business. Advance capability discovery is out of scope.
- **Evidence:** [models-spec.md](../architecture/models-spec.md) "What the system guarantees about models"; [configuration-spec.md](../architecture/configuration-spec.md) "If the chosen model isn't available through the loaded adapter"; `contracts/openapi/model-api.yaml` `CompletionError`.

### GAP-PAA-28: Saved conversations don't record which model and provider produced each reply — Decision needed

- **Expected:** The owner knows which provider processes their data (security-spec, Model Provider Data Flow), including afterwards: which company saw which conversation.
- **Published:** The current provider is set in startup and adapter config, which the owner can read, so the owner can find out the current one. But the Gateway API has no way to read the current model or provider, and saved conversation messages carry no model or provider, so after a switch there is no record of where earlier replies were processed. BrainDrive shows the provider on its own settings routes, outside the architecture's APIs.
- **Proposed:** Each saved assistant reply records the model and provider that produced it. Whether to record it is a values call, so it is a decision before it is a contract change.
- **Evidence:** [security-spec.md](../architecture/security-spec.md) "Model Provider Data Flow"; `contracts/openapi/gateway-api.yaml`; [conversation-detail-response.json](../contracts/examples/conversation-detail-response.json).
