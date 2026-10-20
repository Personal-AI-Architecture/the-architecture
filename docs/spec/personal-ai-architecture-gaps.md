---
sidebar_label: PAA spec gaps
hide_table_of_contents: true
---

# Gaps: Personal AI Architecture

> Companion to [personal-ai-architecture-spec.md](./personal-ai-architecture-spec.md). Paths are in this repository (paths outside `docs/` are relative to the repository root); `template:` means [ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template) at `7fe3824`. Nothing was run.
>
> Each gap is something the spec expects that the published architecture does not deliver today. Classification is a suggestion for triage: **Defect** (published material is broken or contradicts itself), **Decision needed** (the maintainers must choose), **Technical** (contract and technical work), **Spec-only** (wording fix in the architecture docs). A gap marked **Decided, spec update in progress** has a settled answer that is still being written into the specs and contracts.

**Scoreboard:** 16 gaps — 3 Defect, 10 Technical, 3 Spec-only. 7 are decided with spec updates in progress (GAP-PAA-3, 5, 7, 13, 14, 15 and 16; 5, 7 and 16 only in part). The three Defects and three Spec-only gaps are small documentation fixes anyone can make.

## Routes a developer follows

### GAP-PAA-1: Conformance index is incomplete and points at things that do not exist — Spec-only

- **Expected:** US-16, AC-16.2. The index lists every test and links only to real files.
- **Published:** The index lists ARCH-1 to ARCH-4 and DEPLOY-1 to DEPLOY-4; ARCH-5 to ARCH-9 and DEPLOY-5 exist but are missing (DEPLOY-5 sits in the architecture test file). It tells developers to use "component stubs in `../stubs/`", which does not exist, and says executable tests "will be added when a reference implementation exists" although the TypeScript template exists. A language-neutral conformance kit is now in scope (US-16); until it is published, the wording should say the suite is run by hand. The Guides spec still lists stubs as a deliverable.
- **Evidence:** [conformance/README.md](../in-depth-overview/conformance/README.md) "How to Use"; [arch-tests.md](../in-depth-overview/conformance/arch-tests.md) ARCH-5 to ARCH-9, DEPLOY-5; [guides-spec.md](../in-depth-overview/guides-spec.md) "Component Stubs / Templates".

### GAP-PAA-2: The example checker cannot run on a fresh copy — Defect

- **Expected:** US-13, AC-13.4. A developer can check that the published valid and invalid examples behave as labelled.
- **Published:** `validate-manifest.py` reads from a fixed path on one machine (`/home/hex/Project/References/docs/ai`) and expects example paths to start with `docs/ai/`, while the manifest uses `docs/ai-agent-docs/`. It also checks only the manifest, not the examples against the contracts.
- **Evidence:** `docs/ai-agent-docs/examples/validate-manifest.py` (ROOT and path-prefix checks); `examples-manifest.json`.

### GAP-PAA-8: Template links to a missing Foundation spec and a missing plan — Defect

- **Expected:** US-15, AC-15.3.
- **Published:** The template README links the Foundation spec at `docs/foundation-spec.md`; it is now the Architecture overview at `docs/in-depth-overview/foundation-spec.md`. Its "Source Of Truth Order" puts `plan.md` first, and no `plan.md` is in the repository.
- **Evidence:** template:README.md "Source Of Truth Order".

### GAP-PAA-9: Other stale links and section references — Spec-only

- **Expected:** US-12, AC-12.4.
- **Published:** ARCH-7 says it validates "security-spec.md §Owner Data Rights", a section that does not exist. (The Foundation story tests' link to the overview now resolves.)
- **Evidence:** [arch-tests.md](../in-depth-overview/conformance/arch-tests.md) ARCH-7 "Validates".

### GAP-PAA-10: The documentation freshness check is not published — Defect

- **Expected:** US-16 AC-16.3 and US-18 AC-18.4. The lock-in gate and the doc-maintenance spec both rely on `check:docs`.
- **Published:** The doc-maintenance spec defines `"check:docs": "tsx scripts/check-docs.ts"`, but this repository has no package or script, so the check cannot be run. Where it should live, and how manual triggers work, is open technical work.
- **Evidence:** [doc-maintenance-spec.md](../in-depth-overview/doc-maintenance-spec.md) "Script: `check:docs`"; [lockin-gate.md](../in-depth-overview/lockin-gate.md).

### GAP-PAA-13: Customization promises an architecture package that does not exist — Spec-only — Decided, spec update in progress

- **Expected:** US-17, AC-17.5.
- **Published:** The Customization spec says a builder "adds the Architecture as a dependency (package, not fork)" and adopts architecture updates that way. The repository is documents only; runnable code lives in the template, which a builder copies.
- **Evidence:** [customization-spec.md](../in-depth-overview/customization-spec.md); `CONTRIBUTING.md` "Scope".
- **Decided:** builders start from the contracts and the template, or from the stories and specs alone in any language. The customization stories CS-1 to CS-6 are retired in favour of US-17, which removes the package promise.

## Contracts that disagree (Technical)

### GAP-PAA-3: Event and endpoint shapes differ between `specs/` and the blueprints and primers — Technical — Decided, spec update in progress

- **Expected:** US-13 AC-13.3, US-14 AC-14.3. One authoritative shape; `specs/` wins.
- **Published:** The internal contract in `specs/` has five stream event kinds; the internal-contract blueprint has seven, including approval events, and calls its own pack canonical. The client primer uses `/message` where `specs/` uses `/messages`, and `done` fields differ. The build-prompt template favours the primer's shapes.
- **Evidence:** `specs/openapi/gateway-engine.yaml`; `specs/openapi/gateway-api.yaml`; [blueprints/Gateway-Agent-Loop-Contract.md](../blueprints/Gateway-Agent-Loop-Contract.md); [ai-agent-docs/client-gateway-contract.md](../ai-agent-docs/client-gateway-contract.md); [blueprints/prompts/implement-blueprint-template.md](../blueprints/prompts/implement-blueprint-template.md).
- **Decided:** one message shape for all three contracts, with tool calls and tool results as normal parts of messages saved in conversation history, and message content as a list of parts. The contract files still need the change.

### GAP-PAA-4: Configuration has four fields, but examples and the blueprint add more — Technical

- **Expected:** US-13 AC-13.3; Functional requirements (exactly four runtime fields).
- **Published:** The configuration schema allows exactly four fields. The Configuration blueprint adds `conversation_store`, `bind_address`, `port` and `safety_iteration_limit`, and the example marked valid includes `bind_address`, so it fails the schema it illustrates.
- **Evidence:** `specs/schemas/configuration.json`; [blueprints/Configuration.md](../blueprints/Configuration.md); `docs/ai-agent-docs/examples/runtime-config.json`.

### GAP-PAA-5: Contract definitions miss rules the prose requires — Technical — Partly decided, spec update in progress

- **Expected:** US-13 AC-13.3.
- **Published:** The internal contract requires `metadata.correlation_id` in prose, security and blueprint, but its schema does not. Stream events have no field saying which kind they are, and tool-call and tool-result shapes overlap. The Model API schema accepts `stream=false` although the prose says it always streams. Tool definitions use `parameters` in `specs/` and `input_schema` in the blueprint pack. The message schema describes role-dependent fields but does not enforce them.
- **Evidence:** `specs/openapi/gateway-engine.yaml`; `specs/openapi/model-api.yaml`; `specs/schemas/tool-definition.json`; `specs/schemas/message.json`.
- **Decided:** the tool-call, tool-result and message-shape parts follow the single message shape (see GAP-PAA-3). The correlation ID, `stream=false` and `parameters`/`input_schema` points are still open.

### GAP-PAA-6: Identity allows only a fixed list of actor types — Technical

- **Expected:** US-10 AC-10.3. New kinds of actor can be added and start with no permissions.
- **Published:** The identity schema has a closed list of eight types, while Auth promises new actor types without a schema change.
- **Evidence:** `specs/schemas/identity.json`; [auth-spec.md](../in-depth-overview/auth-spec.md) "Identity types".

### GAP-PAA-7: Two conformance tests contradict agreed promises — Technical — Partly decided, spec update in progress

- **Expected:** US-5 AC-5.1 (next message, no restart) and US-9 AC-9.3 (local-only by default).
- **Published:** SWAP-1 restarts the system to swap provider, which is fine for providers, but it is often read as the model-switch rule; the model rule (no restart) needs to stay separate. DEPLOY-5 accepts only the IPv4 local address, while DEPLOY-3 also accepts the IPv6 one.
- **Evidence:** [swap-tests.md](../in-depth-overview/conformance/swap-tests.md) SWAP-1, SWAP-2; [arch-tests.md](../in-depth-overview/conformance/arch-tests.md) DEPLOY-5; [deploy-tests.md](../in-depth-overview/conformance/deploy-tests.md) DEPLOY-3.
- **Decided:** the model travels with each request; the Gateway reads the owner's current model choice on every message, so a model switch needs no restart. The local-address mismatch is still open.

### GAP-PAA-11: Running tool calls at the same time is required, but some blueprints make it optional — Technical

- **Expected:** US-8 AC-8.4.
- **Published:** The Agent Loop spec guarantees independent tool calls run together; the Agent Loop and Tools blueprints treat it as optional or as a later scale feature.
- **Evidence:** [agent-loop-spec.md](../in-depth-overview/agent-loop-spec.md) "What the Agent Loop Guarantees"; [blueprints/Agent-Loop.md](../blueprints/Agent-Loop.md) ENG-CF-001, ENG-SHOULD-001; [blueprints/Tools.md](../blueprints/Tools.md).

### GAP-PAA-12: Permission rules have no shared definition for moving between systems — Technical

- **Expected:** US-3 AC-3.3.
- **Published:** The policy schema checks structure only. Wildcards, conditions, which rule wins when rules disagree, and how references are resolved are not defined, so two systems can read the same rules differently.
- **Evidence:** `specs/schemas/policy.json`; [auth-spec.md](../in-depth-overview/auth-spec.md) "Data portability".

### GAP-PAA-14: How shipped defaults and owner changes are kept apart is not defined — Technical — Decided, spec update in progress

- **Expected:** US-11 AC-11.3.
- **Published:** The Customization spec said owner changes survive product updates, but no storage, update or conflict rule says how.
- **Evidence:** [customization-spec.md](../in-depth-overview/customization-spec.md); [configuration-spec.md](../in-depth-overview/configuration-spec.md) "Layered Overrides".
- **Decided:** the owner has the last word on their own hardware. Product defaults and owner changes are kept apart, conflicts are reported, and how a product keeps them apart is the implementation's choice.

### GAP-PAA-15: Start-up reading of preferences contradicts "only through tools" — Technical — Decided, spec update in progress

- **Expected:** US-2 AC-2.1.
- **Published:** Memory says every component reads it only through tools; the Configuration boot sequence read preferences before tools were available.
- **Evidence:** [memory-spec.md](../in-depth-overview/memory-spec.md); [configuration-spec.md](../in-depth-overview/configuration-spec.md) "How the System Boots".
- **Decided:** tools load before Your Memory is used, and preferences (including the model choice, read on every message) are read through the Memory tools.

### GAP-PAA-16: Approval steps have no defined lifecycle in the contracts — Technical — Partly decided, spec update in progress

- **Expected:** US-10 AC-10.2 (configured approval rules are enforced; products own defaults and how approvals look).
- **Published:** The security and Auth specs describe approval authority, and some primers show approval events, but the internal contract defines no approval request, answer, cancel or replay. Some wording also reads as a universal "confirm before every write" default.
- **Evidence:** [security-spec.md](../in-depth-overview/security-spec.md) "Approval Gates"; [auth-spec.md](../in-depth-overview/auth-spec.md); [gateway-agent-loop-contract.md](../in-depth-overview/gateway-agent-loop-contract.md).
- **Decided:** the architecture's default is that the owner can do everything; approval prompts are a product choice, so there is no universal confirm-before-write default. Whether the contracts define an approval lifecycle is still open.
