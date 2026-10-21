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
| [Architectural Invariant Tests](arch-tests.md) | ARCH-1 to ARCH-9, DEPLOY-5 | Component boundaries and independence, error handling, memory export, Auth tools, version history, and the default bind address (DEPLOY-5 is defined in this file) |
| [Deployment Invariant Tests](deploy-tests.md) | DEPLOY-1 to DEPLOY-4 | Local-first deployment contract |
| [Foundation User Story Tests](fs-tests.md) | FS-1 to FS-8 | End-to-end architecture promises |

## Test Status

Tests are currently defined as specifications (pass criteria, setup, verification steps). The language-neutral [PAA conformance validator](https://github.com/Personal-AI-Architecture/paa-conformance-validator) (US-16) runs them against a built system.

## Related Documents

- `../build/implementers-reference.md` — what each component must do
- `../contracts/openapi/` and `../contracts/schemas/` — canonical schemas that payloads must validate against
- `../architecture/overview.md` — architectural principles these tests enforce
