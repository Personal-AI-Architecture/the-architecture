# Lock-In Analysis

Where lock-in could creep into a PAA system at each layer, what keeps it out, and what happens if that discipline slips. The audience is people building on the architecture and people judging whether its "no lock-in" claim holds.

## The core argument

The architecture avoids lock-in with one rule: **everything is either an open standard, a file you own, or behind a contract you own.** Your Memory is reached only through tools, components talk only through contracts, and the contracts themselves sit behind adapters (D139), so even a change of standard is one swap. That chain (memory via tools, components via contracts, contracts via adapters) is what makes every part replaceable.

D201 makes the outside edge of that chain a conformance requirement: active model providers, foreign client formats and external tool sources cross an adapter owned by the system. A pass-through is enough; internal boundaries owned on both sides need none. The [ARCH-23 test](../../conformance/arch-tests.md#arch-23-outside-connections-cross-owned-adapters) checks the active path.

The anti-lock-in test (D147) makes it checkable: every normal swap (a provider, a model or a tool) must succeed with configuration changes only, and the test runs on every release. See [configuration-spec.md](../configuration-spec.md).

## Layer by layer

Every layer has zero lock-in by design. What keeps it that way is a discipline in how the system is built.

| Layer | Why there's no lock-in | Discipline that keeps it that way | If the discipline slips |
|---|---|---|---|
| **Your Memory** | Depends on nothing; reached only through tools; open formats | No component reads storage directly; keep version history and restore behind the tools | Storage changes break other parts; your data needs migrating to leave |
| **Agent Loop** | Generic: no product logic (D39); everything product-specific lives in Your Memory | Keep it generic | Swapping it first means pulling the leaked product logic back out |
| **Gateway** | Stores conversations in Your Memory through a tool; doesn't care which client connects | Keep conversations in Your Memory, not in the Gateway | Conversation history is locked in the Gateway |
| **Auth** | Independent of the other components; open standards (OAuth 2.1, OpenID Connect); exportable state | Stay on open standards; keep the auth data format the architecture's, not the provider's | Moving auth providers means re-creating identities and rules |
| **Gateway API** | A contract you own; clients talk to it, not to the Agent Loop | Design it from what clients need, not around one Agent Loop | The API becomes a wrapper for one Agent Loop |
| **Model API** | Models sit behind an adapter; model and provider are owner preferences (D193) | Test against more than one model; report missing abilities with canonical codes (D197), never fake them | The system comes to depend on one model's abilities, or quietly degrades when a model lacks one |
| **Gateway–Agent Loop contract** | One written-down internal handoff (D137) | Keep it explicit; change it only by adding fields | The two components can't be swapped separately |
| **Tools** | They describe themselves; tool sources are translated by an adapter; preferences live in Your Memory (D145, D146) | Keep tool preferences out of deployment config; new protocols use open provenance labels (D198), and inert extensions do not grant permission (D199) | Tool choices are tied to one machine |
| **Clients** | Outside the system; they connect through the Gateway API | Keep conversation state in Your Memory, and talk only through the Gateway API | A client becomes hard to replace or to run alongside another |
| **Configuration** | Runtime config is four facts about this machine (D144) | Keep it to four fields; preferences stay in Your Memory | The system gets tied to one environment |
| **Deployment** | A local, offline path always exists (D148) | Never require a remote service | Hosting becomes a dependency |
| **Customization** | Products use four mechanisms and never change component code | No code-level changes to the components | Every product becomes a fork |

Security adds no separate layer: its mechanisms (scope enforcement, isolation, audit, version history) use open standards and live in the parts above, so they add no lock-in of their own (D29).

Context limits may differ after a model swap. The Gateway prepares a new working context sized for the selected model while the complete conversation stays in Your Memory, and the Agent Loop checks each actual model call. Nothing rewrites or truncates saved history to make a swap work.

Provider failure must not become an unchosen model or provider switch. The
Agent Loop may retry once on the owner's same selection and record that attempt;
failure that remains is reported (D188).

A configured adapter that is missing or invalid fails startup clearly. Quietly
switching to another adapter would move the owner's request to a provider they
did not select; see the [configuration spec](../configuration-spec.md) and
[ARCH-12](../../conformance/arch-tests.md#arch-12-unsupported-adapter-cannot-start-silently).

## Where lock-in actually comes from: drift

Apart from limits of the industry itself, like a weaker local model, the only way lock-in gets in is through how a system is built over time:

- **Product logic leaking into the Agent Loop.** Its swap cost grows with every product-specific rule it learns.
- **State building up in a client or the Gateway.** Whatever isn't in Your Memory doesn't travel.
- **A contract bending to fit one implementation.** The Gateway API shaped around one Agent Loop, or a config field naming one vendor's internals.
- **Conventions mistaken for lock-in.** Entry-point files, skill formats and folder layouts are content in Your Memory, not infrastructure. They travel with your files, and any system can read them.

The [principles](../principles.md) name what each kind of drift costs. The [lock-in gate](../../conformance/lockin-gate.md) checks every pull request for it, and the [lock-in audit](../../conformance/lockin-audit.md) checks the whole architecture at each milestone.
