# Personal AI Architecture

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An open architecture for personal AI systems. This repository is now the documentation and standards source of truth.

<p align="center">
  <a href="https://personalaiarchitecture.org">Website</a> · <a href="https://github.com/Personal-AI-Architecture/ts-architecture-template">TypeScript Template</a> · <a href="https://github.com/BrainDriveAI/braindrive">BrainDrive (built on this)</a> · <a href="docs/foundation-spec.md">Foundation Spec</a>
</p>

## Repository Focus

This repository is documentation-first.

- Architecture principles and specifications
- API and schema contracts
- Blueprint and conformance guidance
- Documentation site content

Implementation/runtime code lives in the architecture template repository.

## If You Need the Implementation

Use the implementation template repository for runnable code and execution tooling.

- TypeScript architecture template: [Personal-AI-Architecture/ts-architecture-template](https://github.com/Personal-AI-Architecture/ts-architecture-template)

## What You Get Here

| Resource | What it is |
|----------|------------|
| [Foundation spec](docs/foundation-spec.md) | Complete architecture: components, contracts, principles, responsibility matrix |
| [Component specs](docs/) | Detailed specs for Memory, Engine, Gateway, Auth, Tools, Models |
| [OpenAPI + JSON Schema](specs/) | Machine-verifiable boundary contracts |
| [Blueprints](docs/blueprints/) | Spec, schema, conformance guidance, drift guard, implementation prompts |
| [Architecture primer](docs/ai/) | Token-optimized references for AI-assisted development |
| [Lock-in gate](docs/lockin-gate.md) | Zero lock-in checks and enforcement criteria |

## Documentation

| I want to... | Start here |
|--------------|------------|
| Understand the architecture | [Foundation spec](docs/foundation-spec.md) |
| Build with AI assistance | [Architecture primer](docs/ai/) |
| Build a component | [Blueprints](docs/blueprints/) |
| Verify conformance | [Conformance guide](docs/guides/conformance/) |
| Check lock-in risks | [Lock-in gate](docs/lockin-gate.md) and [Lock-in audit](docs/lockin-audit.md) |

For AI agents: start with [AGENT.md](AGENT.md).

## Contributing

We welcome pull requests for documentation, contracts, and specification improvements.

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.

## License

MIT — see [LICENSE](LICENSE).
