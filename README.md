# Personal AI Architecture

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Own your AI.** An open blueprint for building personal AI systems you own. Keep your memory, swap everything else.

<p align="center">
  <img src="assets/readme-hero.svg" alt="Your Memory (conversations, settings, skills, agent instructions and tool preferences, in files you own) stays under your control, while models, interfaces and tools can be swapped freely." width="680">
</p>

<p align="center">
  <a href="https://personalaiarchitecture.org">Website</a> · <a href="https://github.com/Personal-AI-Architecture/ts-architecture-template">TypeScript template</a> · <a href="https://community.braindrive.ai/c/personal-ai-architecture/39">Forum</a>
</p>

## What this is

Not an app, and not a framework you install. A blueprint, plus a starter kit to build from.

- **The specification** ([`spec/`](spec/)): what every PAA system must promise, including product stories and known gaps.
- **The architecture** ([`architecture/`](architecture/)): how the system works, its principles, decisions, component specifications, and explanatory background.
- **Contracts** ([`contracts/`](contracts/)): the exact OpenAPI and JSON Schema shapes code must match, plus canonical examples.
- **Conformance** ([`conformance/`](conformance/)): language-neutral checks and review guidance that prove a system conforms.
- **Build guidance** ([`build/`](build/)): primers, blueprints, implementation prompts, and derived implementation references.
- **The starter kit** ([ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template)): a working TypeScript starting point with all four components built in.

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
| [Auth](architecture/auth-spec.md) | Controls who and what gets in. Swapping other parts never changes it. |
| [Gateway API](contracts/openapi/gateway-api.yaml) | How interfaces connect. Anything that speaks it plugs in. |
| [Model API](contracts/openapi/model-api.yaml) | How models connect. Switch providers with a config change. |

## Start here

| I want to... | Start here |
|--------------|------------|
| Understand the architecture | [Architecture overview](architecture/overview.md) |
| Build a system | [TypeScript template](https://github.com/Personal-AI-Architecture/ts-architecture-template) |
| Build with an AI coding agent | [AGENT.md](AGENT.md) and the [architecture primers](build/primers/) |
| Build one component | [Blueprints](build/blueprints/) |
| See what every system must promise | [Product spec](spec/personal-ai-architecture-spec.md) |
| Check my system conforms | [Conformance guide](conformance/) |
| Check for lock-in | [Lock-in gate](conformance/lockin-gate.md) |

## Built on PAA

[BrainDrive](https://braindrive.ai) is a personal AI assistant you own and control, built on all four PAA components by the team that wrote this architecture. Built something on PAA? [Share it on the forum](https://community.braindrive.ai/c/personal-ai-architecture/39).

## Contributing

We welcome pull requests for documentation, contracts and specification improvements. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
