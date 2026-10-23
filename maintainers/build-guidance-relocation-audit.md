# Build guidance relocation audit

> Scope: the 91 files formerly tracked under `build/`. This records the
> relocation and D195 retirement decision. The deleted folder was never an
> authority over `architecture/` or `contracts/`.

## Inventory and authority

The folder contains 14 primers, 73 blueprint files, and four top-level guides.
The 14 `contract-pack.json` files are source manifests, not independent contract
schemas. The blueprints contain 268 labelled MUST/SHOULD statements and their
`tests.md` files contain 458 positive/negative vectors. Much of this repeats
the architecture and conformance material; some of it predates later decisions.

Use `architecture/` for product-independent rules, `contracts/` for exact wire
shapes, and `conformance/` for implementation test criteria. A template owns
language-specific instructions and executable checks. The build folder is
derived material and cannot settle a disagreement with those sources.

## Relocations made

| Build source | Disposition | Current home |
|---|---|---|
| `blueprints/adapter/blueprint.md` ADP-MUST-003; `blueprints/configuration/blueprint.md` CFG-MUST-008; `blueprints/deployment/blueprint.md` DEP-MUST-010 | Clarified the startup rule for an unsupported or locally invalid selected adapter. Distinguished it from a configured remote provider being offline. | [`configuration-spec.md`](../architecture/configuration-spec.md) §At startup; [`ARCH-12`](../conformance/arch-tests.md#arch-12-unsupported-adapter-cannot-start-silently) |
| `blueprints/security/tests.md` SEC-T004P/N | Moved the audit-sink-full runtime scenario. The underlying fail-closed rule was already in `security-spec.md`. | [`ARCH-13`](../conformance/arch-tests.md#arch-13-audit-sink-failure-stops-audited-actions) |
| `blueprints/agent-loop/tests.md` ENG-T006P/N | Moved the same-turn text-plus-tool continuation scenario. The rule was already in `agent-loop-spec.md`. | [`ARCH-14`](../conformance/arch-tests.md#arch-14-assistant-text-survives-tool-continuation) |
| `blueprints/gateway/tests.md` GW-T001N/GW-T014P | Moved the Gateway restart and durable conversation scenario. The rule was already in `gateway-spec.md` and `memory-spec.md`. | [`ARCH-15`](../conformance/arch-tests.md#arch-15-conversations-survive-gateway-restart) |
| `blueprints/security/tests.md` SEC-T017P/N | Moved the untrusted-tool isolation scenario. The rule was already in `security-spec.md` and `tools-spec.md`. | [`ARCH-16`](../conformance/arch-tests.md#arch-16-tool-isolation-follows-owner-trust) |
| `blueprints/auth/tests.md` AUTH-T018P/N | Moved approval authority and decision-replay checks. The rule was already in `auth-spec.md`, `security-spec.md`, and the approval schemas. | [`ARCH-17`](../conformance/arch-tests.md#arch-17-approval-decision-is-authorized-and-replay-safe) |
| `blueprints/auth/tests.md` AUTH-T016P/N | Moved the dormant-imported-policy scenario. The rule was already in `auth-spec.md`. | [`ARCH-18`](../conformance/arch-tests.md#arch-18-imported-policy-does-not-revive-unknown-identity) |
| `blueprints/models/tests.md` MOD-T016P/N | Moved the unsupported-model-ability scenario. The rule was already in `models-spec.md`. | [`ARCH-19`](../conformance/arch-tests.md#arch-19-unsupported-model-ability-is-reported) |
| `blueprints/agent-loop/tests.md` ENG-T017P/N; `blueprints/tools/tests.md` TOL-T017P/N | Moved the independent/dependent tool-call scheduling scenario. The rule was already in `agent-loop-spec.md` and `tools-spec.md`. | [`ARCH-20`](../conformance/arch-tests.md#arch-20-independent-tool-calls-overlap-without-losing-identity) |
| `blueprints/tools/tests.md` TOL-T018P/N | Moved the same-named tools from distinct sources runtime scenario. The schemas and baseline runner already check source identity structurally. | [`ARCH-21`](../conformance/arch-tests.md#arch-21-same-named-tools-retain-source-identity) |

The remaining blueprint vectors are largely repetitions of canonical schema
checks, existing conformance tests or review checklists. Several assert obsolete
request shapes. Copying their IDs into conformance wholesale would create a
second, conflicting contract. The new ARCH scenarios capture distinct runtime
proof that was either missing or only mentioned as a checklist item. They are
language-neutral test specifications; `conformance/runner.py` does not execute
them against a target implementation.

## Material that should not be promoted

| Build claim | Reason |
|---|---|
| Gateway/Gateway API blueprint `POST /message` | The canonical Gateway API uses `POST /conversations/messages`. |
| Gateway/Agent Loop blueprints that omit or forbid `provider` in the internal request | D193 and `contracts/openapi/gateway-engine.yaml` require the active provider profile on every request. |
| Configuration/deployment blueprint sequence that loads preferences before ready | The accepted configuration spec starts the Memory tools before ready and reads the current model and provider preference on every message. It does not require one cached preference load as a readiness phase. |
| Memory-tools blueprint's fixed `memory_*` names, private failure schema, `include_conversations=false` search default, and token-pattern redaction | `memory-spec.md` explicitly leaves operation names and signatures to implementations; the blueprint's shapes are not published canonical contracts. A product or template may choose these details. |
| Blueprint recommendations for index rebuilds, pagination under concurrent writes, logging verbosity, and implementation-specific modules | These are implementation choices or need separate design review. The current Gateway API uses offset pagination and has no snapshot guarantee; a build guide cannot silently add one. |
| `build/build-sequence.md` and blueprint prompts treating primers or the compliance matrix as build authority | Exact shapes belong to `contracts/`, rules to `architecture/`, and proof to `conformance/`. This precedence must not be carried forward. |

## Language templates

The build folder contains no substantive TypeScript, Python, Go, Rust, or Java
implementation guidance. The five template repositories already own their
language-specific setup, code and checks. No template edit is warranted by this
relocation audit. If a later implementation review finds a language-specific
example worth keeping, put it in that template rather than in PAA `build/`.

## Retirement

US-14 and the related visitor requirements now name the architecture,
contracts, conformance suite and language templates. The folder and its
obsolete maintainer guides have been deleted; the documentation guide,
conformance checklists, example manifest and registry now point to current
sources. A fresh-agent build and validator result will be recorded below.

## Fresh-agent verification

Pending isolated build proof.
