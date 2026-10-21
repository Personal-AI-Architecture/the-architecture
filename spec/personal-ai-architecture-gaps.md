---
sidebar_label: PAA spec gaps
hide_table_of_contents: true
---

# Gaps: Personal AI Architecture

> Companion to [personal-ai-architecture-spec.md](./personal-ai-architecture-spec.md). Paths are in this repository (paths outside ` ` are relative to the repository root); `template:` means [ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template) at `7fe3824`. Nothing was run.
>
> Each gap is something the spec expects that the published architecture does not deliver today. Classification is a suggestion for triage: **Defect** (published material is broken or contradicts itself), **Decision needed** (the maintainers must choose), **Technical** (contract and technical work), **Spec-only** (wording fix in the architecture docs). A gap marked **Decided, spec update in progress** has a settled answer that is still being written into the specs and contracts.

**Scoreboard:** 13 gaps — 2 Defect, 11 Technical, 0 Spec-only. 6 are decided with spec updates in progress (GAP-PAA-3, 5, 7, 14, 15 and 16; 5, 7 and 16 only in part). The two Defects are small fixes anyone can make.

## Routes a developer follows

### GAP-PAA-2: The example checker does not check examples against the contracts — Technical

- **Expected:** US-13, AC-13.4. A developer can check that the published valid and invalid examples behave as labelled.
- **Published:** `validate-manifest.py` now runs from any checkout and checks the manifest: file paths, kinds and links. It does not check the examples against the contracts, so nothing proves a valid example validates or an invalid one fails.
- **Evidence:** `contracts/examples/validate-manifest.py`; `examples-manifest.json`.

### GAP-PAA-8: Template links to a missing Foundation spec and a missing plan — Defect

- **Expected:** US-15, AC-15.3.
- **Published:** The template README links the Foundation spec at `architecture/overview.md`; it is now the Architecture overview at `architecture/overview.md`. Its "Source Of Truth Order" puts `plan.md` first, and no `plan.md` is in the repository.
- **Evidence:** template:README.md "Source Of Truth Order".

### GAP-PAA-10: The documentation freshness check is not published — Defect

- **Expected:** US-16 AC-16.3 and US-18 AC-18.4. The lock-in gate and the doc-maintenance spec both rely on `check:docs`.
- **Published:** The doc-maintenance spec defines `"check:docs": "tsx scripts/check-docs.ts"`, but this repository has no package or script, so the check cannot be run. Where it should live, and how manual triggers work, is open technical work.
- **Evidence:** [doc-maintenance-spec.md](../maintainers/doc-maintenance-spec.md) "Script: `check:docs`"; [lockin-gate.md](../conformance/lockin-gate.md).

## Contracts that disagree (Technical)

### GAP-PAA-3: Event and endpoint shapes differ between `contracts/` and the blueprints and primers — Technical — Decided, spec update in progress

- **Expected:** US-13 AC-13.3, US-14 AC-14.3. One authoritative shape; `contracts/` wins.
- **Published:** The internal contract in `contracts/` has five stream event kinds; the internal-contract blueprint has seven, including approval events, and calls its own pack canonical. The client primer uses `/message` where `contracts/` uses `/messages`, and `done` fields differ. The build-prompt template favours the primer's shapes.
- **Evidence:** `contracts/openapi/gateway-engine.yaml`; `contracts/openapi/gateway-api.yaml`; [build/blueprints/gateway-agent-loop-contract/blueprint.md](../build/blueprints/gateway-agent-loop-contract/blueprint.md); [build/primers/client-gateway-contract.md](../build/primers/client-gateway-contract.md); [build/blueprints/templates/implement-blueprint-template.md](../build/blueprints/templates/implement-blueprint-template.md).
- **Decided:** one message shape for all three contracts, with tool calls and tool results as normal parts of messages saved in conversation history, and message content as a list of parts. The contract files still need the change.

### GAP-PAA-4: Configuration has four fields, but examples and the blueprint add more — Technical

- **Expected:** US-13 AC-13.3; Functional requirements (exactly four runtime fields).
- **Published:** The configuration schema allows exactly four fields. The Configuration blueprint adds `conversation_store`, `bind_address`, `port` and `safety_iteration_limit`, and the example marked valid includes `bind_address`, so it fails the schema it illustrates.
- **Evidence:** `contracts/schemas/configuration.json`; [build/blueprints/configuration/blueprint.md](../build/blueprints/configuration/blueprint.md); `contracts/examples/runtime-config.json`.

### GAP-PAA-5: Contract definitions miss rules the prose requires — Technical — Partly decided, spec update in progress

- **Expected:** US-13 AC-13.3.
- **Published:** The internal contract requires `metadata.correlation_id` in prose, security and blueprint, but its schema does not. Stream events have no field saying which kind they are, and tool-call and tool-result shapes overlap. The Model API schema accepts `stream=false` although the prose says it always streams. Tool definitions use `parameters` in `contracts/` and `input_schema` in the blueprint pack. The message schema describes role-dependent fields but does not enforce them.
- **Evidence:** `contracts/openapi/gateway-engine.yaml`; `contracts/openapi/model-api.yaml`; `contracts/schemas/tool-definition.json`; `contracts/schemas/message.json`.
- **Decided:** the tool-call, tool-result and message-shape parts follow the single message shape (see GAP-PAA-3). The correlation ID, `stream=false` and `parameters`/`input_schema` points are still open.

### GAP-PAA-6: Identity allows only a fixed list of actor types — Technical

- **Expected:** US-10 AC-10.3. New kinds of actor can be added and start with no permissions.
- **Published:** The identity schema has a closed list of eight types, while Auth promises new actor types without a schema change.
- **Evidence:** `contracts/schemas/identity.json`; [auth-spec.md](../architecture/auth-spec.md) "Identity types".

### GAP-PAA-7: Two conformance tests contradict agreed promises — Technical — Partly decided, spec update in progress

- **Expected:** US-5 AC-5.1 (next message, no restart) and US-9 AC-9.3 (local-only by default).
- **Published:** SWAP-1 restarts the system to swap provider, which is fine for providers, but it is often read as the model-switch rule; the model rule (no restart) needs to stay separate. DEPLOY-5 accepts only the IPv4 local address, while DEPLOY-3 also accepts the IPv6 one.
- **Evidence:** [swap-tests.md](../conformance/swap-tests.md) SWAP-1, SWAP-2; [arch-tests.md](../conformance/arch-tests.md) DEPLOY-5; [deploy-tests.md](../conformance/deploy-tests.md) DEPLOY-3.
- **Decided:** the model travels with each request; the Gateway reads the owner's current model choice on every message, so a model switch needs no restart. The local-address mismatch is still open.

### GAP-PAA-11: Running tool calls at the same time is required, but some blueprints make it optional — Technical

- **Expected:** US-8 AC-8.4.
- **Published:** The Agent Loop spec guarantees independent tool calls run together; the Agent Loop and Tools blueprints treat it as optional or as a later scale feature.
- **Evidence:** [agent-loop-spec.md](../architecture/agent-loop-spec.md) "What the Agent Loop Guarantees"; [build/blueprints/agent-loop/blueprint.md](../build/blueprints/agent-loop/blueprint.md) ENG-CF-001, ENG-SHOULD-001; [build/blueprints/tools/blueprint.md](../build/blueprints/tools/blueprint.md).

### GAP-PAA-12: Permission rules have no shared definition for moving between systems — Technical

- **Expected:** US-3 AC-3.3.
- **Published:** The policy schema checks structure only. Wildcards, conditions, which rule wins when rules disagree, and how references are resolved are not defined, so two systems can read the same rules differently.
- **Evidence:** `contracts/schemas/policy.json`; [auth-spec.md](../architecture/auth-spec.md) "Data portability".

### GAP-PAA-14: How shipped defaults and owner changes are kept apart is not defined — Technical — Decided, spec update in progress

- **Expected:** US-11 AC-11.3.
- **Published:** The Customization spec said owner changes survive product updates, but no storage, update or conflict rule says how.
- **Evidence:** [customization-spec.md](../architecture/customization-spec.md); [configuration-spec.md](../architecture/configuration-spec.md) "Layered Overrides".
- **Decided:** the owner has the last word on their own hardware. Product defaults and owner changes are kept apart, conflicts are reported, and how a product keeps them apart is the implementation's choice.

### GAP-PAA-15: Start-up reading of preferences contradicts "only through tools" — Technical — Decided, spec update in progress

- **Expected:** US-2 AC-2.1.
- **Published:** Memory says every component reads it only through tools; the Configuration boot sequence read preferences before tools were available.
- **Evidence:** [memory-spec.md](../architecture/memory-spec.md); [configuration-spec.md](../architecture/configuration-spec.md) "How the System Boots".
- **Decided:** tools load before Your Memory is used, and preferences (including the model choice, read on every message) are read through the Memory tools.

### GAP-PAA-16: Approval steps have no defined lifecycle in the contracts — Technical — Partly decided, spec update in progress

- **Expected:** US-10 AC-10.2 (configured approval rules are enforced; products own defaults and how approvals look).
- **Published:** The security and Auth specs describe approval authority, and some primers show approval events, but the internal contract defines no approval request, answer, cancel or replay. Some wording also reads as a universal "confirm before every write" default.
- **Evidence:** [security-spec.md](../architecture/security-spec.md) "Approval Gates"; [auth-spec.md](../architecture/auth-spec.md); [gateway-agent-loop-contract.md](../architecture/gateway-agent-loop-contract.md).
- **Decided:** the architecture's default is that the owner can do everything; approval prompts are a product choice, so there is no universal confirm-before-write default. Whether the contracts define an approval lifecycle is still open.
