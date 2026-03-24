# Configuration Review Checklist

> Fast targeted review checklist for runtime config, adapter config, preferences, and startup-readiness sequencing.

## Purpose

Use this when reviewing bootstrap code, config loaders, adapter wiring, secret handling, or startup sequence behavior.

## Checklist

- [ ] Runtime config, adapter config, and preferences are separate layers.
- [ ] Request payloads are not used as a hidden configuration channel.
- [ ] Secrets are referenced rather than stored by value in tracked config or Memory.
- [ ] Adapter selection is config-driven rather than hardcoded in product code.
- [ ] Startup order is deterministic: runtime config -> adapter config -> tools -> Memory -> preferences -> ready.
- [ ] Startup readiness exists before feature code assumes the system is usable.
- [ ] Export and persistent conversation support are available from day one of MVP operation.
- [ ] Local-model offline path is still possible within the configured runtime.

## Matrix IDs

- `C-01`
- `C-02`
- `C-03`
- `MO-02`
- `MO-03`
- `D-02`
- `D-06`
- `D-07`

## Common Failure Patterns

- merged config loader for runtime, adapter, and preferences
- secrets written directly into config files
- provider or model choice hardcoded in product code
- startup sequence partially initialized before readiness is declared
- export or persistence treated as later hardening

## Read Next

- `docs/ai/configuration.md`
- `docs/ai/models.md`
- `docs/ai/build-sequence.md`
- `docs/ai/compliance-matrix.md`

## Example Files

- `docs/ai/examples/runtime-config.json`
- `docs/ai/examples/adapter-config.json`
- `docs/ai/examples/invalid-runtime-config.json`
- `docs/ai/examples/invalid-adapter-config.json`
- `docs/ai/examples/gateway-engine-request.json`
- `docs/ai/examples/invalid-gateway-engine-request.json`

## Source Docs

- `docs/ai/primer-audit-playbook.md`
- `docs/ai/configuration.md`
- `docs/ai/models.md`
- `docs/ai/build-sequence.md`
- `docs/ai/compliance-matrix.md`
