# Conformance Suite

> Validates any implementation of the Personal AI Architecture against its architectural invariants.

Each test has an ID, description, pass/fail criteria, and maps to a specific architectural guarantee. An implementation that passes all tests is architecturally conformant.

## How to Use

1. Implement the architecture (or use the component stubs in `../stubs/`)
2. Run each test category below against your implementation
3. All tests must pass for conformance — partial conformance is not conformance

## Test Categories

| Category | Tests | What it validates |
|----------|-------|-------------------|
| [Swap Tests](swap-tests.md) | SWAP-1 to SWAP-3 | Config-only swappability (D147) |
| [Architectural Invariant Tests](arch-tests.md) | ARCH-1 to ARCH-4 | Component boundaries and independence |
| [Deployment Invariant Tests](deploy-tests.md) | DEPLOY-1 to DEPLOY-4 | Local-first deployment contract |
| [Foundation User Story Tests](fs-tests.md) | FS-1 to FS-8 | End-to-end architecture promises |

## Test Status

Tests are currently defined as specifications (pass criteria, setup, verification steps). Executable test scripts will be added when a reference implementation exists.

## Related Documents

- `../implementers-reference.md` — what each component must do
- `../../../specs/openapi/` and `../../../specs/schemas/` — canonical schemas that payloads must validate against
- `../../foundation-spec.md` — architectural principles these tests enforce
