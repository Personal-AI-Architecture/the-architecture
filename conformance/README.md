# Conformance Suite

> Validates any implementation of the Personal AI Architecture against its architectural invariants.

Each test has an ID, description, pass/fail criteria, and maps to a specific architectural guarantee. An implementation that passes all tests is architecturally conformant.

## How to Use

1. Implement the architecture (or start from the [TypeScript](https://github.com/Personal-AI-Architecture/ts-architecture-template), [Python](https://github.com/Personal-AI-Architecture/python-architecture-template), [Go](https://github.com/Personal-AI-Architecture/go-architecture-template), [Rust](https://github.com/Personal-AI-Architecture/rust-architecture-template) or [Java](https://github.com/Personal-AI-Architecture/java-architecture-template) template)
2. Run each test category below against your implementation
3. All tests must pass for conformance — partial conformance is not conformance

## Test Categories

| Category | Tests | What it validates |
|----------|-------|-------------------|
| [Swap Tests](swap-tests.md) | SWAP-1 to SWAP-3 | Config-only swappability (D147) |
| [Architectural Invariant Tests](arch-tests.md) | ARCH-1 to ARCH-22, DEPLOY-5 | Component boundaries and independence, error handling, memory export, Auth tools, version history, revocation cancellation, audit failure handling, adapter readiness, turn continuity, durable conversations, tool isolation, approval replay, dormant imported policy, model capability reporting, tool concurrency, source identity, additive extension compatibility, and the loopback-only default bind address (DEPLOY-5 is defined in this file) |
| [Deployment Invariant Tests](deploy-tests.md) | DEPLOY-1 to DEPLOY-4 | Local-first deployment contract |
| [Foundation User Story Tests](fs-tests.md) | FS-1 to FS-8 | End-to-end architecture promises |

## Test Status

Tests are defined as language-neutral specifications (pass criteria, setup, verification steps). The first executable baseline is now available at [`runner.py`](runner.py). It validates the published contract examples and core PAA invariants without assuming a target implementation language or framework:

From the repository root, install the runner's dependencies and use Python 3:

```bash
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r requirements-ci.txt
python3 conformance/runner.py
```

The runner is intentionally contract-first. It proves the repository baseline: canonical examples, four-field runtime configuration, extensible identity, tool source/visibility semantics, source-preserving tool calls, canonical model error shapes, open tool-source kind, schema-defined extension slots, transport-neutral `auth_context`, portable policy conditions, and the loopback-only default. The runtime scenarios in `arch-tests.md`, including ARCH-12 through ARCH-22, are test specifications; `runner.py` does not execute them against a target implementation. A future target adapter can add runtime checks while retaining the same language-neutral criteria.

For provider-failure behavior, ARCH-5 checks the terminal `provider_error` and
D188 permits one recorded retry on the same selected model and provider profile.
That runtime check must be run against an implementation; the repository runner
does not make provider calls.

## Related Documents

- `../architecture/` — what each component must do
- `../contracts/openapi/` and `../contracts/schemas/` — canonical schemas that payloads must validate against
- `../architecture/overview.md` — architectural principles these tests enforce
