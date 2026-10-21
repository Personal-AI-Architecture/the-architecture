---
sidebar_label: PAA spec gaps
hide_table_of_contents: true
---

# Gaps: Personal AI Architecture

> Companion to [personal-ai-architecture-spec.md](./personal-ai-architecture-spec.md). Paths are in this repository (paths outside ` ` are relative to the repository root); `template:` means [ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template). This status was refreshed after the canonical-contract, builder, primer, and conformance alignment batches.
>
> Each gap is something the spec expects that the published architecture does not deliver today. Classification is a suggestion for triage: **Defect** (published material is broken or contradicts itself), **Decision needed** (the maintainers must choose), **Technical** (contract and technical work), **Spec-only** (wording fix in the architecture docs). A gap marked **Decided, spec update in progress** has a settled answer that is still being written into the specs and contracts.

**Scoreboard:** The contract-source alignment batch, example-shape validation, documentation freshness tooling, configuration alignment, required parallel tool execution, portable policy semantics, approval lifecycle contracts, and transport-neutral identity propagation are complete. Remaining work is concentrated in tool-definition semantics (S8), the local-address decision, and the first executable language-neutral conformance implementation.

## Routes a developer follows

### GAP-PAA-2: The example checker does not check examples against the contracts — Resolved

- **Expected:** US-13, AC-13.4. A developer can check that the published valid and invalid examples behave as labelled.
- **Published:** `validate-manifest.py` runs from any checkout, checks the manifest, validates JSON Schema-backed examples, and applies canonical envelope checks to the OpenAPI examples. Valid examples must pass and invalid examples must fail their corresponding shape checks.
- **Evidence:** `contracts/examples/validate-manifest.py`; `examples-manifest.json`.

### GAP-PAA-8: Template links to a missing Foundation spec and a missing plan — Defect

- **Expected:** US-15, AC-15.3.
- **Published:** The template README links the Foundation spec at `architecture/overview.md`; it is now the Architecture overview at `architecture/overview.md`. Its "Source Of Truth Order" puts `plan.md` first, and no `plan.md` is in the repository.
- **Evidence:** template:README.md "Source Of Truth Order".

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
- **Boundary:** Tool visibility/source semantics remain tracked separately as S8 work; this gap covered the contract-shape inconsistencies.

### GAP-PAA-6: Identity allows only a fixed list of actor types — Resolved

- **Expected:** US-10 AC-10.3. New kinds of actor can be added and start with no permissions.
- **Published:** `identity.json` now uses an open string for actor types, while Auth promises new actor types without a schema change.
- **Evidence:** `contracts/schemas/identity.json`; [auth-spec.md](../architecture/auth-spec.md) "Identity types".

### GAP-PAA-7: Two conformance tests contradict agreed promises — Technical — Partly decided, spec update in progress

- **Expected:** US-5 AC-5.1 (next message, no restart) and US-9 AC-9.3 (local-only by default).
- **Published:** SWAP-1 restarts the system to swap provider, which is fine for providers, but it is often read as the model-switch rule; the model rule (no restart) needs to stay separate. DEPLOY-5 accepts only the IPv4 local address, while DEPLOY-3 also accepts the IPv6 one.
- **Evidence:** [swap-tests.md](../conformance/swap-tests.md) SWAP-1, SWAP-2; [arch-tests.md](../conformance/arch-tests.md) DEPLOY-5; [deploy-tests.md](../conformance/deploy-tests.md) DEPLOY-3.
- **Decided:** the model travels with each request; the Gateway reads the owner's current model choice on every message, so a model switch needs no restart. The model-switch portion is resolved; the local-address mismatch remains open.

### GAP-PAA-11: Running tool calls at the same time is required, but some blueprints make it optional — Resolved

- **Expected:** US-8 AC-8.4.
- **Published:** The Agent Loop and Tools builder materials now make concurrent execution of independent tool calls a MUST, require stable result association, and preserve ordering for dependent calls. Conformance vectors cover both overlap and ordering failures.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "What the Agent Loop Guarantees"; [build/blueprints/agent-loop/blueprint.md](../build/blueprints/agent-loop/blueprint.md) ENG-MUST-017; [build/blueprints/agent-loop/tests.md](../build/blueprints/agent-loop/tests.md); [build/blueprints/tools/blueprint.md](../build/blueprints/tools/blueprint.md).

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
