# Conformance Suite

> Validates any implementation of the Personal AI Architecture against its architectural invariants.

Each test has an ID, description, pass/fail criteria, and maps to a specific architectural guarantee. Results are shown test by test, so anyone can see where an implementation conforms and where lock-in remains. Conformance is a spectrum; an implementation that passes every test is fully conformant.

## How to Use

1. Implement the architecture (or start from the [TypeScript](https://github.com/Personal-AI-Architecture/ts-architecture-template), [Python](https://github.com/Personal-AI-Architecture/python-architecture-template), [Go](https://github.com/Personal-AI-Architecture/go-architecture-template), [Rust](https://github.com/Personal-AI-Architecture/rust-architecture-template) or [Java](https://github.com/Personal-AI-Architecture/java-architecture-template) template)
2. Run each test category below against your implementation
3. Record each criterion as passed, failed or without proof (AC-16.4). Use the [acceptance trace](acceptance-criteria.md) for the proof routes and apply implementation-scoped criteria to the product.

## Test Categories

| Category | Tests | What it validates |
|----------|-------|-------------------|
| [Swap Tests](swap-tests.md) | SWAP-1 to SWAP-3 | Config-only swappability (D147) |
| [Architectural Invariant Tests](arch-tests.md) | ARCH-1 to ARCH-35 | Component boundaries and independence, error handling, memory export, Auth tools, version history, revocation cancellation, audit failure handling, adapter readiness, turn continuity, durable conversations, tool isolation, approval replay, verified grant portability, model capabilities, tool result association, source identity, extension compatibility and owned adapter boundaries |
| [Deployment Invariant Tests](deploy-tests.md) | DEPLOY-1 to DEPLOY-11 | Local-first deployment contract |
| [Foundation User Story Tests](fs-tests.md) | FS-1 to FS-11 | End-to-end architecture promises |

## Test Status

Tests are defined as language-neutral specifications (pass criteria, setup, verification steps). The first executable baseline is now available at [`runner.py`](runner.py). It validates the published contract examples and core PAA invariants without assuming a target implementation language or framework:

From the repository root, install the runner's dependencies and use Python 3:

```bash
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install -r requirements-ci.txt
python3 conformance/runner.py
```

If a configured package index does not offer `jsonschema==4.26.0`, use the
tested compatible dependency set in a fresh virtual environment:

```bash
python3 -m venv .venv-compat
. .venv-compat/bin/activate
python3 -m pip install -r requirements-compat.txt
python3 -m pip check
python3 scripts/check-contracts.py
python3 conformance/runner.py
```

The fallback uses `jsonschema==4.25.1` with a compatible OpenAPI validator.
Both dependency sets run the same repository checks in CI.

The runner is intentionally contract-first. It proves the repository baseline: canonical examples, four-field runtime configuration, extensible identity, tool source/visibility semantics, source-preserving tool calls, canonical model error shapes, open tool-source kind, schema-defined extension slots, transport-neutral `auth_context`, portable policy conditions, and the loopback-only default. The runtime scenarios in `arch-tests.md`, including ARCH-12 through ARCH-32, are test specifications; `runner.py` does not execute them against a target implementation. A future target adapter can add runtime checks while retaining the same language-neutral criteria.

For provider-failure behavior, ARCH-5 checks the terminal `provider_error` and
D205 allows one recorded retry on the same selection and optional owner-approved fallbacks.
That runtime check must be run against an implementation; the repository runner
does not make provider calls.

## Related Documents

- `../architecture/` — what each component must do
- `../contracts/openapi/` and `../contracts/schemas/` — canonical schemas that payloads must validate against
- `../architecture/overview.md` — architectural principles these tests enforce
