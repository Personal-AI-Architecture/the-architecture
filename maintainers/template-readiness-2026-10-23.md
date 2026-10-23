# Template readiness against merged PAA main — 2026-10-23

## Decision

Keep the TypeScript template linked in the README as a starter for its **pinned earlier revision**, with an explicit compatibility note. Do not add Python, Go, Rust or Java as **current-PAA-ready** starters yet. None of the five published template revisions passes the shared validator against the merged PAA main, and the runtime request types inspected in all five omit a field required by the current contracts.

This is a template readiness decision, not a finding that the older template baselines or their existing tests are broken.

## Reproduction basis

- PAA source: `Personal-AI-Architecture/the-architecture` main at `a80dc75ce0dcd08790c3c70c6c1c7249a441cf44` (after PR #22).
- Shared validator: `Personal-AI-Architecture/paa-conformance-validator`, using `bin/paa-validate.js` with `--source-ref origin/main`. This flag is necessary to compare a template with the accepted source, rather than merely with its own historical lock.
- Published template main revisions examined:

| Template | Published revision | Published PAA lock | Current-main contract check | Full validator after temporary repin |
| --- | --- | --- | --- | --- |
| [TypeScript](https://github.com/Personal-AI-Architecture/ts-architecture-template) | `951d9f3dba52c8e0a1bf7e50d7e30fea49d86ebc` | `55707c2627e308eb3458e67db2644c458f95b236` | FAIL | PASS |
| [Python](https://github.com/Personal-AI-Architecture/python-architecture-template) | `229da0bbc4f7a94357605080dbcb57791e14da8b` | `55707c2627e308eb3458e67db2644c458f95b236` | FAIL | PASS |
| [Go](https://github.com/Personal-AI-Architecture/go-architecture-template) | `8b63e8ffa8a26a243b450996d328a8084a37058a` | `55707c2627e308eb3458e67db2644c458f95b236` | FAIL | PASS |
| [Rust](https://github.com/Personal-AI-Architecture/rust-architecture-template) | `c1c04b3bf75148422ae387549a7e2507a85b5815` | `55707c2627e308eb3458e67db2644c458f95b236` | FAIL | PASS |
| [Java](https://github.com/Personal-AI-Architecture/java-architecture-template) | `ac621d314d0ec33b2385f4d016fd822de6207dcf` | `55707c2627e308eb3458e67db2644c458f95b236` | FAIL | PASS |

For every published template, `--contracts-only --source-ref origin/main` identified the same four differing files: `contracts/openapi/gateway-api.yaml`, `gateway-engine.yaml`, `model-api.yaml`, and `contracts/schemas/configuration.json`.

For the second pass, clean disposable clones were given the current 15 PAA contract files, matching vendor and mirror copies, and an updated `paa.lock.json` pinned to the source commit above. The shared validator then passed contract alignment and **every command declared by each template**: type/syntax checks, unit, integration, conformance, and acceptance as applicable. Go used `golang:1.22-alpine` and Java used `maven:3.9-eclipse-temurin-17-alpine`; the other three used installed host toolchains. These temporary changes were not published to any template repository.

One example invocation, run from a checkout with the shared validator available:

```sh
node /path/to/paa-conformance-validator/bin/paa-validate.js \
  --target /path/to/template/paa.target.json \
  --source-checkout /path/to/the-architecture \
  --source-ref origin/main
```

## Why the temporary green result is insufficient

The validator checks copied contract bytes and runs the target's declared commands. It does not automatically prove that those commands exercise newly added contract behavior. The current Gateway-to-Agent-Loop contract requires `provider` in every `EngineRequest`; the Model API requires it in every `CompletionRequest` (D193). The published TypeScript, Python, Go, Rust and Java runtime request types each define these requests without `provider`. A contract-file-only repin would make the validator green while leaving these required fields unimplemented. Current PAA also specifies assistant reply model/provider provenance (D194) and context selection/notice behavior; those need behavioral checks before current-main readiness can be claimed.

## Promotion gate

For each template independently:

1. Update runtime types and request/response paths for current contracts, including per-request provider and assistant reply provenance. Implement applicable context selection, error and notice behavior.
2. Add executable checks that fail when those required fields or behaviors are absent; add shared-validator coverage or target conformance commands that execute them.
3. Repin the template to the accepted PAA source and rerun the full shared validator with `--source-ref origin/main`, plus its documented native aggregate check, in a clean checkout.
4. Only then list that language as a current-PAA starter in the PAA README. Re-run the gate if PAA main changes before publication.
