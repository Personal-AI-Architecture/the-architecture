# Template readiness follow-up — 2026-10-23

## Memory-backed live selection — 2026-10-25

The [shared validator PR #3](https://github.com/Personal-AI-Architecture/paa-conformance-validator/pull/3) and the [TypeScript](https://github.com/Personal-AI-Architecture/ts-architecture-template/pull/9), [Python](https://github.com/Personal-AI-Architecture/python-architecture-template/pull/7), [Go](https://github.com/Personal-AI-Architecture/go-architecture-template/pull/7), [Rust](https://github.com/Personal-AI-Architecture/rust-architecture-template/pull/7), and [Java](https://github.com/Personal-AI-Architecture/java-architecture-template/pull/7) template PRs are merged. Each live starter now stores the owner's selected model and provider profile in Memory, reads them on each message, and supports an authenticated preference update. The live fixture selects two models and two provider profiles in one running process, verifies reply provenance, and checks that unknown selections fail without falling back. It also checks owner-readable conversation files, separation of the Gateway token from Memory, and persistence after restart. The shared validator, native checks, live fixture, and hosted CI passed for all five templates.

This closes the live selection gap identified in Dave W's attached verification report for the tested starter path. It does not establish SWAP-3 separate-service tool execution, an independently replaceable Auth service, storage portability, deployment behavior, or the remaining product runtime criteria in the [v1 acceptance proof audit](v1-acceptance-proof-audit-2026-10-23.md). Dave W's final independent build is still pending.

## Live Gateway follow-up — 2026-10-25

Merged updates add a runnable HTTP Gateway and a `live.start` command to all five language templates. The [shared validator PR #2](https://github.com/Personal-AI-Architecture/paa-conformance-validator/pull/2) starts each template, sends authenticated requests, verifies canonical SSE and saved replies, checks conversation search and pagination, and confirms conversation data survives a server restart. Its provider fixture verifies the streamed reply with each of two configured model IDs. The runner also checks that unauthenticated and spoofed-actor requests are denied before body parsing, and that oversized requests are rejected.

The [TypeScript](https://github.com/Personal-AI-Architecture/ts-architecture-template/pull/8), [Python](https://github.com/Personal-AI-Architecture/python-architecture-template/pull/6), [Go](https://github.com/Personal-AI-Architecture/go-architecture-template/pull/6), [Rust](https://github.com/Personal-AI-Architecture/rust-architecture-template/pull/6), and [Java](https://github.com/Personal-AI-Architecture/java-architecture-template/pull/6) revisions passed the shared validator against PAA `origin/main` at the D196 contract pin and passed their live mock and two-model provider fixture checks in hosted CI. Go and Java used their declared Docker toolchains for local verification. Python's first hosted run exposed a reset during oversized uploads; the corrected response passed local and hosted retests. The Java provider run initially collided with a concurrent local Maven build writing the same `target` directory; its isolated rerun and hosted CI passed. These checks covered the named Gateway starter journey at that revision. At that point, the fixture restarted between model selections and did not prove a no-restart swap. The later Memory-backed live selection work above addresses that specific limit. Independent Auth, separate-service tool execution, the other PAA runtime criteria, and full v1 conformance remain unproved. These limits are especially relevant to the [attached independent verification report](https://community.braindrive.ai/uploads/short-url/45plVm9iLSeBtnxVkVrfDSDL0C4.md). See the [v1 acceptance proof audit](v1-acceptance-proof-audit-2026-10-23.md) for the remaining architecture-wide proof.

**Current status after D196:** All five templates are pinned to PAA main `cfeb96df743feee91afc80ac81f0c4fd9a62c123`, which merged the source-driven discovery decision in [PR #21](https://github.com/Personal-AI-Architecture/the-architecture/pull/21). Only the configuration schema description changed in the contract set. The shared validator passed with `--source-ref origin/main` for each template, including its declared type, unit, integration, conformance and acceptance commands. Native repository checks and pull-request CI passed. The D197–D199 focused runtime fixtures still pass. This establishes the tested starter paths; it does not establish full v1 runtime conformance. See the [v1 acceptance proof audit](v1-acceptance-proof-audit-2026-10-23.md).

| Template | D196 repin | Merged revision | Shared validator, native checks, CI |
| --- | --- | --- | --- |
| TypeScript | [PR #7](https://github.com/Personal-AI-Architecture/ts-architecture-template/pull/7) | `63b06a5a649e99d57a20279a52bda0cd3ddec87f` | PASS |
| Python | [PR #5](https://github.com/Personal-AI-Architecture/python-architecture-template/pull/5) | `601a7cced4b129e404853858406f1e15915f3d85` | PASS |
| Go | [PR #5](https://github.com/Personal-AI-Architecture/go-architecture-template/pull/5) | `9de1d76a84a57610e22847c0dd07f428f5816e97` | PASS |
| Rust | [PR #5](https://github.com/Personal-AI-Architecture/rust-architecture-template/pull/5) | `2a45e7724f1d36e874d9459b71fc3b382c2ca6c1` | PASS |
| Java | [PR #5](https://github.com/Personal-AI-Architecture/java-architecture-template/pull/5) | `a0f18a3cd4a305325587a10482b27e208b8f2360` | PASS |

The first TypeScript validation attempt ran before dependencies were installed in the fresh worktree and could not start its compiler or tests. After `npm ci`, the same shared validator and native checks passed; hosted CI passed too. The other four languages passed on the first validation attempt.

The following tables retain the earlier D197–D199 evidence.

| Template | D197–D199 runtime proof | Merged revision | Shared validator and CI |
| --- | --- | --- | --- |
| TypeScript | [PR #6](https://github.com/Personal-AI-Architecture/ts-architecture-template/pull/6) | `be71dd40503d801aa5fee82bd71e4a0b0f7b9924` | PASS |
| Python | [PR #4](https://github.com/Personal-AI-Architecture/python-architecture-template/pull/4) | `63395732ddcc55f1cf669c4820d4a549470c44af` | PASS |
| Go | [PR #4](https://github.com/Personal-AI-Architecture/go-architecture-template/pull/4) | `b563ac287cffd1abf20c9cc60449a33894f74e99` | PASS |
| Rust | [PR #4](https://github.com/Personal-AI-Architecture/rust-architecture-template/pull/4) | `25ac0cd2b6e91711cbdfe9f852a06b8da42f4f00` | PASS |
| Java | [PR #4](https://github.com/Personal-AI-Architecture/java-architecture-template/pull/4) | `560d8127ec590ed1ac43ec62ccec3ddf4dc33804` | PASS |

The focused fixtures verify D197 model-error categories and safe text through each starter's adapter, Agent Loop and Gateway without selecting another model or provider. They verify D198 acceptance of a new non-empty source kind while retaining source identity; they do not execute a separate-service tool. They verify D199 acceptance of inert message-part extensions, rejection of unknown core part fields, and rejection of unexpected top-level auth-context fields. These are bounded starter checks, not a claim that every deployed Auth, tool discovery, policy, approval, or security path conforms. The TypeScript pin check now compares remote contract hashes when PAA main advances through documentation-only commits, while still failing on contract drift.

| Template | Previous D197–D199 contract repin | Merged revision | Shared validator and native checks |
| --- | --- | --- | --- |
| TypeScript | [PR #5](https://github.com/Personal-AI-Architecture/ts-architecture-template/pull/5) | `3c56fa39df84667700a262abf19463f19fceaed2` | PASS |
| Python | [PR #3](https://github.com/Personal-AI-Architecture/python-architecture-template/pull/3) | `d1d40546828abe0c20e707136ead60741d772fb9` | PASS |
| Go | [PR #3](https://github.com/Personal-AI-Architecture/go-architecture-template/pull/3) | `820b26bead417eb8ded6cc1caf678c8755d965f0` | PASS |
| Rust | [PR #3](https://github.com/Personal-AI-Architecture/rust-architecture-template/pull/3) | `1ead2c64fc3510d2ddd90ac9aaac681826da871d` | PASS |
| Java | [PR #3](https://github.com/Personal-AI-Architecture/java-architecture-template/pull/3) | `2da2434defe7448988e0e57367ab85762f5f02f1` | PASS |

**Remaining broader proof:** A product implementation still needs complete SWAP-3 separate-service tool execution and independent Auth enforcement, plus its full runtime conformance suite. The PAA executable baseline verifies published contract shapes; the template fixtures above prove the named starter boundaries only.

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
