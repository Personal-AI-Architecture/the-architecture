# Documentation Guide

The Personal AI Architecture uses one set of sources for people and AI coding
agents. Start with the [README](../README.md), then follow the route for your job.

## Just browsing

Read the [principles](../architecture/principles.md), the
[overview](../architecture/overview.md), and the
[background](../architecture/background/about.md). They explain why Your Memory
is the platform and why components, models, clients and tools remain swappable.

## Ready to build

1. Read the [architecture overview](../architecture/overview.md) and the
   relevant component spec in [`architecture/`](../architecture/).
2. Read the exact API and data shapes in [`contracts/`](../contracts/).
   `contracts/` wins if a prose example or template disagrees with it.
3. Start from a language template: [TypeScript](https://github.com/Personal-AI-Architecture/ts-architecture-template), [Python](https://github.com/Personal-AI-Architecture/python-architecture-template), [Go](https://github.com/Personal-AI-Architecture/go-architecture-template), [Rust](https://github.com/Personal-AI-Architecture/rust-architecture-template), or [Java](https://github.com/Personal-AI-Architecture/java-architecture-template). Each template owns its language-specific implementation guidance and checks.
4. Run the template's checks and the applicable [conformance](../conformance/README.md)
   scenarios. Compare its pinned contract source with the current architecture
   before claiming current conformance.

The [Gateway–Agent Loop contract](../architecture/gateway-agent-loop-contract.md)
describes the internal handoff. The [Gateway API](../contracts/openapi/gateway-api.yaml)
and [Model API](../contracts/openapi/model-api.yaml) are the two external API
boundaries. The [responsibility verification](../conformance/foundation-verification.md#6-responsibility-matrix-verification)
helps locate work that has crossed a component boundary.

## Hand the work to an AI coding agent

Point the agent to [AGENT.md](../AGENT.md), the relevant architecture spec,
contract and conformance test, and the chosen template. Give it the specific
product task and ask it to record what it changed and which checks passed. A
missing route or unrun check is a gap to report, not a pass. A separate primer
or blueprint package is not required.

## Check and contribute

- [Conformance suite](../conformance/README.md): language-neutral test criteria
  and the current executable contract baseline.
- [Canonical examples](../contracts/examples/README.md): valid and invalid
  payloads checked against published contracts.
- [Lock-in gate](../conformance/lockin-gate.md): focused review before merging.
- [Lock-in audit](../conformance/lockin-audit.md): broader milestone review.
- [Contribution guide](../CONTRIBUTING.md): how to propose architecture changes.

An architecture change starts in the relevant spec. Update `contracts/` when
the exact shape changes, then update conformance criteria, examples and affected
templates. The [document registry](doc-registry.json) tracks the repository's
documentation dependencies.
