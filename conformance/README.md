---
hide_table_of_contents: true
---

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
| [Architectural Invariant Tests](arch-tests.md) | ARCH-1 to ARCH-11, DEPLOY-5 | Component boundaries and independence, error handling, memory export, Auth tools, version history, revocation cancellation, portable audit records, and the loopback-only default bind address (DEPLOY-5 is defined in this file) |
| [Deployment Invariant Tests](deploy-tests.md) | DEPLOY-1 to DEPLOY-4 | Local-first deployment contract |
| [Foundation User Story Tests](fs-tests.md) | FS-1 to FS-8 | End-to-end architecture promises |

## Test Status

Tests are defined as language-neutral specifications (pass criteria, setup, verification steps). The first executable baseline is now available at [`runner.py`](runner.py). It validates the published contract examples and core PAA invariants without assuming a target implementation language or framework:

```bash
python conformance/runner.py
```

The runner is intentionally contract-first. It proves the repository baseline: canonical examples, four-field runtime configuration, extensible identity, tool source/visibility semantics, source-preserving tool calls, transport-neutral `auth_context`, portable policy conditions, and the loopback-only default. A future target adapter can add runtime checks for an implementation while retaining these same language-neutral checks.

## Related Documents

- `../build/implementers-reference.md` — what each component must do
- `../contracts/openapi/` and `../contracts/schemas/` — canonical schemas that payloads must validate against
- `../architecture/overview.md` — architectural principles these tests enforce
