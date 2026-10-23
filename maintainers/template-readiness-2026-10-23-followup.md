# Template readiness follow-up — 2026-10-23

**Current status after D197–D199:** All five templates are repinned to PAA main `aa0ff01757306b2b3aa1015bb4366a5a578d5102`. The shared validator passed with `--source-ref origin/main` for each, including its declared type, unit, integration, conformance and acceptance commands. Native repository checks and pull-request CI also passed. This establishes current contract snapshots and the existing starter test paths; it does not establish full v1 runtime conformance. See the [v1 acceptance proof audit](v1-acceptance-proof-audit-2026-10-23.md).

| Template | Current contract repin | Merged revision | Shared validator and native checks |
| --- | --- | --- | --- |
| TypeScript | [PR #5](https://github.com/Personal-AI-Architecture/ts-architecture-template/pull/5) | `3c56fa39df84667700a262abf19463f19fceaed2` | PASS |
| Python | [PR #3](https://github.com/Personal-AI-Architecture/python-architecture-template/pull/3) | `d1d40546828abe0c20e707136ead60741d772fb9` | PASS |
| Go | [PR #3](https://github.com/Personal-AI-Architecture/go-architecture-template/pull/3) | `820b26bead417eb8ded6cc1caf678c8755d965f0` | PASS |
| Rust | [PR #3](https://github.com/Personal-AI-Architecture/rust-architecture-template/pull/3) | `1ead2c64fc3510d2ddd90ac9aaac681826da871d` | PASS |
| Java | [PR #3](https://github.com/Personal-AI-Architecture/java-architecture-template/pull/3) | `2da2434defe7448988e0e57367ab85762f5f02f1` | PASS |

**Runtime proof still needed:** The existing template tests do not exercise D197's `model_unavailable` and `capability_unsupported` error propagation through an adapter, Agent Loop and Gateway. Source inspection found generic `provider_error` handling on the failure path in each starter. D198's new tool-protocol labels and D199's extension handling also have repository-level schema checks but no cross-template runtime acceptance result. Add focused runtime checks and implement any failing paths before claiming those behaviors or full v1 readiness. The PAA executable baseline verifies the published contract shapes, not these template journeys.

The [initial audit](template-readiness-2026-10-23.md) found that all five published language templates had older contract pins and lacked required runtime behavior. The following table preserves the prior `28e9a27` validation history. The templates are suitable to list in the README as **implementation starters for the tested paths**, not as fully qualified PAA products.

| Template | Runtime update | Merged revision | Shared validator against PAA main |
| --- | --- | --- | --- |
| [TypeScript](https://github.com/Personal-AI-Architecture/ts-architecture-template) | [PR #4](https://github.com/Personal-AI-Architecture/ts-architecture-template/pull/4) | `76c1d84874037aadba0b27ead83e972e8c6019ea` | PASS |
| [Python](https://github.com/Personal-AI-Architecture/python-architecture-template) | [PR #2](https://github.com/Personal-AI-Architecture/python-architecture-template/pull/2) | `03673e66ad5d6e1dc3d813b9a5b597bb34042472` | PASS |
| [Go](https://github.com/Personal-AI-Architecture/go-architecture-template) | [PR #2](https://github.com/Personal-AI-Architecture/go-architecture-template/pull/2) | `4bfa7736fa4551d2acc82ce34e679eb4d11b1b8c` | PASS |
| [Rust](https://github.com/Personal-AI-Architecture/rust-architecture-template) | [PR #2](https://github.com/Personal-AI-Architecture/rust-architecture-template/pull/2) | `37e1ff2e5e6769322f38b41141a020fb6e815041` | PASS |
| [Java](https://github.com/Personal-AI-Architecture/java-architecture-template) | [PR #2](https://github.com/Personal-AI-Architecture/java-architecture-template/pull/2) | `7a8e423b08e3b6b8ddd9efcc8c9df702591dd3cb` | PASS |

Each update pins contracts to PAA main `28e9a275a0f5e062aa4452892e9ec70644f88c69`, adds per-request provider and model selection, persists model/provider reply provenance, and implements conservative context selection, limits, overflow, and omission notices. Its tests exercise those behaviors. The shared validator was rerun against `origin/main` at that PAA revision and passed every command declared in each template's `paa.target.json`. Go ran in `golang:1.22-alpine`, Java in `maven:3.9-eclipse-temurin-17-alpine`, and the other three used installed host toolchains. Native template checks passed as well.

The shared validator runs a template's declared commands and verifies its contract source. It does not prove an entire deployed PAA system. The TypeScript starter has a live tool continuation test; the Python, Go, Rust and Java starters exercise bounded text journeys. Production storage, authorization, tool execution, and deployment controls remain the responsibility of a product implementation and its conformance test suite. A future PAA contract change requires each template to be repinned and retested before this status is renewed.
