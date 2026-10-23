# Personal AI Architecture

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Own your AI.** An open blueprint for building personal AI systems you own. Keep your memory, swap everything else.

We will soon rely on personal AI systems in every area of our lives. We should own them, so they always work in our interest, and the wealth AI creates flows far and wide instead of to a few Big Tech platforms.

<p align="center">
  <img src="assets/readme-hero.svg" alt="Your Memory (conversations, settings, skills, agent instructions and tool preferences, in files you own) stays under your control, while models, interfaces and tools can be swapped freely." width="680">
</p>

<p align="center">
  <a href="https://personalaiarchitecture.org">Website</a> · <a href="https://github.com/Personal-AI-Architecture/ts-architecture-template">TypeScript template</a> · <a href="https://community.braindrive.ai/c/personal-ai-architecture/39">Forum</a>
</p>

## What this is

Not an app, and not a framework you install. A blueprint, plus a starter kit to build from.

- **The specification** ([`personal-ai-architecture-spec.md`](spec/personal-ai-architecture-spec.md)): what every PAA system must promise, including product stories, with [known gaps](spec/personal-ai-architecture-gaps.md) tracked separately.
- **The architecture** ([`overview.md`](architecture/overview.md)): how the system works, its principles, decisions, component specifications, and explanatory background.
- **Contracts** ([`contracts/`](contracts/)): the exact OpenAPI and JSON Schema shapes code must match, plus canonical examples.
- **Conformance** ([`conformance/`](conformance/)): language-neutral checks and review guidance that prove a system conforms.
- **The starter kit** ([ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template)): a TypeScript starting point with all four components built in. It is pinned to an earlier PAA revision; see the [template readiness audit](maintainers/template-readiness-2026-10-23.md) before using it with current contracts.

The Python, Go, Rust and Java templates are not yet listed here as current-PAA starters. All five published templates need a contract update and runtime proof before that claim is accurate.

## How it works

<p align="center">
  <img src="assets/readme-how-it-works.svg" alt="Interfaces connect through the Gateway API to the Gateway, which hands off to the Agent Loop. The Agent Loop calls models through the Model API and reaches Your Memory and other tools through tools. Auth checks every request." width="900">
</p>

Four components and two APIs:

| Part | What it does |
|------|--------------|
| [Your Memory](architecture/memory-spec.md) | All your data, in files you own. Everything else depends on it; it depends on nothing. |
| [Agent Loop](architecture/agent-loop-spec.md) | Calls the model, runs the tools it asks for, and repeats until the job is done. |
| [Gateway](architecture/gateway-spec.md) | One front door for every interface. Start on the web, pick up on your phone. |
| [Auth](architecture/auth-spec.md) | Controls who and what gets in. It checks every request and every tool call. |
| [Gateway API](contracts/openapi/gateway-api.yaml) | How interfaces connect. Anything that speaks it plugs in. |
| [Model API](contracts/openapi/model-api.yaml) | How models connect. Which model and provider to use is your preference; a failure never quietly switches either choice. |

## Start here

| I want to... | Start here |
|--------------|------------|
| Understand the architecture | [Architecture overview](architecture/overview.md) |
| Build from an earlier pinned starter | [TypeScript template](https://github.com/Personal-AI-Architecture/ts-architecture-template) ([current-main status](maintainers/template-readiness-2026-10-23.md)) |
| Build with an AI coding agent | [AGENT.md](AGENT.md), the [architecture](architecture/) and a [language template](https://github.com/Personal-AI-Architecture) |
| Build one component | Its [architecture spec](architecture/), [contracts](contracts/) and [conformance checks](conformance/) |
| See what every system must promise | [Product spec](spec/personal-ai-architecture-spec.md) |
| Check my system conforms | [Conformance guide](conformance/) |
| Check for lock-in | [Lock-in gate](conformance/lockin-gate.md) |

## Built on PAA

[BrainDrive](https://braindrive.ai) is a personal AI assistant you own and control, built on all four PAA components by the team that wrote this architecture. Built something on PAA? [Share it on the forum](https://community.braindrive.ai/c/personal-ai-architecture/39).

## Contributing

We welcome pull requests for documentation, contracts and specification improvements. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
