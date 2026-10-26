# Build guidance relocation audit

> Scope: the 91 files formerly tracked under `build/`. This records the
> relocation and D195 retirement decision. The deleted folder was never an
> authority over `architecture/` or `contracts/`.

## Inventory and authority

The folder contained 14 primers, 73 blueprint files, and four top-level guides.
The 14 `contract-pack.json` files are source manifests, not independent contract
schemas. The blueprints contain 268 labelled MUST/SHOULD statements and their
`tests.md` files contain 458 positive/negative vectors. Much of this repeats
the architecture and conformance material; some of it predates later decisions.

Use `architecture/` for product-independent rules, `contracts/` for exact wire
shapes, and `conformance/` for implementation test criteria. A template owns
language-specific instructions and executable checks. The former build folder
was derived material and could not settle a disagreement with those sources.

The current conformance suite includes ARCH-23 for D201's owned-adapter boundary. The retired build guidance remains historical evidence and does not supersede that test.

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
| Gateway/Agent Loop blueprints that omit or forbid `provider` in the internal request | D193 and `contracts/openapi/gateway-agent-loop.yaml` require the active provider profile on every request. |
| Configuration/deployment blueprint sequence that loads preferences before ready | The accepted configuration spec starts the Memory tools before ready and reads the current model and provider preference on every message. It does not require one cached preference load as a readiness phase. |
| Memory-tools blueprint's fixed `memory_*` names, private failure schema, `include_conversations=false` search default, and token-pattern redaction | `memory-spec.md` explicitly leaves operation names and signatures to implementations; the blueprint's shapes are not published canonical contracts. A product or template may choose these details. |
| Blueprint recommendations for index rebuilds, pagination under concurrent writes, logging verbosity, and implementation-specific modules | These are implementation choices or need separate design review. The current Gateway API uses offset pagination and has no snapshot guarantee; a build guide cannot silently add one. |
| `build/build-sequence.md` and blueprint prompts treating primers or the compliance matrix as build authority | Exact shapes belong to `contracts/`, rules to `architecture/`, and proof to `conformance/`. This precedence must not be carried forward. |

## Language templates

The build folder contained no substantive TypeScript, Python, Go, Rust, or Java
implementation guidance. The five template repositories already own their
language-specific setup, code and checks. No template edit is warranted by this
relocation audit. If a later implementation review finds a language-specific
example worth keeping, put it in that template rather than in PAA `build/`.

## Retirement

US-14 and the related visitor requirements now name the architecture,
contracts, conformance suite and language templates. The folder and its
obsolete maintainer guides have been deleted; the documentation guide,
conformance checklists, example manifest and registry now point to current
sources.

The later D196 tool-discovery decision keeps separate services behind
owner-configured sources and the Agent Loop's source adapters; it adds no
Gateway API registration route or replacement build guidance.
The later D197–D199 model-error, tool-kind and extension clarifications live
in those same specs, contracts and conformance checks. They do not recreate
derived build guidance.

## Fresh-agent verification

A fresh agent, without the parent conversation, received a clean clone of PAA
at `5eef06cabd5f90a677cf308e2d63512b6f6ef192`, a clean Python template,
and the shared validator. The PAA clone had no `build/` directory. The agent
used the current architecture, contracts, conformance documentation and
template to implement a bounded native `text_uppercase` tool. It pinned the
template to the current contracts, checked LocalAuth grants, preserved
source-qualified tool-call and result IDs in the conversation, and added
offline integration tests. The resulting template commits were
`4b6f5fef6b0964e3cd41696405fdde60f1ab66be` and
`16f1ceb5baf9e73cf3bf80b79f27d56f3ca867ac`.

Independent review found that two new exception paths could expose an error
string to the client. The agent changed both to fixed messages and added a test
that injects a fake token and private path, then checks streamed and saved
details for disclosure. With that correction:

| Verification | Result |
|---|---|
| `python scripts/validate.py --source-checkout /tmp/paa-fresh-agent-proof/source` | PASS: pin, contracts, imports, lock-in, type checks, syntax, 8 unit, 6 integration, 3 conformance and acceptance checks. |
| `node /tmp/paa-fresh-agent-proof/validator/bin/paa-validate.js --target /tmp/paa-fresh-agent-proof/template/paa.target.json --source-checkout /tmp/paa-fresh-agent-proof/source --source-ref HEAD` | PASS: target manifest, source contract alignment, type checks, syntax, unit, integration, conformance and acceptance. |
| `git diff --check` in the template | PASS; candidate working tree clean. |

The proof candidate used an offline scripted model adapter. The template's
request-header actor adapter and in-process conversation store remain
development examples. This verifies that a fresh agent could build and check a
bounded capability from the current sources without primers or blueprints; it
does not establish production authentication, restart persistence, or complete
conformance of every runtime behavior. The detailed command log is retained
locally at `/tmp/paa-fresh-agent-proof/proof.md`.
