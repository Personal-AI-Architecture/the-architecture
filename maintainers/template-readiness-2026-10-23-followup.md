# Template readiness follow-up — 2026-10-23

**Current status after D197–D199:** This table records validation against PAA `28e9a27`. The later model-error, tool-kind and extension contract changes require each template to be repinned and retested; the PASS cells below are historical evidence, not a current-main claim. See the [v1 acceptance proof audit](v1-acceptance-proof-audit-2026-10-23.md).

The [initial audit](template-readiness-2026-10-23.md) found that all five published language templates had older contract pins and lacked required runtime behavior. The following updates close that specific starter readiness gap. The templates are now suitable to list in the README as **implementation starters for the tested paths**, not as fully qualified PAA products.

| Template | Runtime update | Merged revision | Shared validator against PAA main |
| --- | --- | --- | --- |
| [TypeScript](https://github.com/Personal-AI-Architecture/ts-architecture-template) | [PR #4](https://github.com/Personal-AI-Architecture/ts-architecture-template/pull/4) | `76c1d84874037aadba0b27ead83e972e8c6019ea` | PASS |
| [Python](https://github.com/Personal-AI-Architecture/python-architecture-template) | [PR #2](https://github.com/Personal-AI-Architecture/python-architecture-template/pull/2) | `03673e66ad5d6e1dc3d813b9a5b597bb34042472` | PASS |
| [Go](https://github.com/Personal-AI-Architecture/go-architecture-template) | [PR #2](https://github.com/Personal-AI-Architecture/go-architecture-template/pull/2) | `4bfa7736fa4551d2acc82ce34e679eb4d11b1b8c` | PASS |
| [Rust](https://github.com/Personal-AI-Architecture/rust-architecture-template) | [PR #2](https://github.com/Personal-AI-Architecture/rust-architecture-template/pull/2) | `37e1ff2e5e6769322f38b41141a020fb6e815041` | PASS |
| [Java](https://github.com/Personal-AI-Architecture/java-architecture-template) | [PR #2](https://github.com/Personal-AI-Architecture/java-architecture-template/pull/2) | `7a8e423b08e3b6b8ddd9efcc8c9df702591dd3cb` | PASS |

Each update pins contracts to PAA main `28e9a275a0f5e062aa4452892e9ec70644f88c69`, adds per-request provider and model selection, persists model/provider reply provenance, and implements conservative context selection, limits, overflow, and omission notices. Its tests exercise those behaviors. The shared validator was rerun against `origin/main` at that PAA revision and passed every command declared in each template's `paa.target.json`. Go ran in `golang:1.22-alpine`, Java in `maven:3.9-eclipse-temurin-17-alpine`, and the other three used installed host toolchains. Native template checks passed as well.

The shared validator runs a template's declared commands and verifies its contract source. It does not prove an entire deployed PAA system. The TypeScript starter has a live tool continuation test; the Python, Go, Rust and Java starters exercise bounded text journeys. Production storage, authorization, tool execution, and deployment controls remain the responsibility of a product implementation and its conformance test suite. A future PAA contract change requires each template to be repinned and retested before this status is renewed.
