# Configuration Review Checklist

> Fast targeted review checklist for runtime config, adapter config, preferences, and startup-readiness sequencing.

## Purpose

Use this when reviewing bootstrap code, config loaders, adapter wiring, secret handling, or startup sequence behavior.

## Checklist

- [ ] Runtime config, adapter config, and preferences are separate layers.
- [ ] Request payloads are not used as a hidden configuration channel (the model and the active provider profile are the two per-request values).
- [ ] The model and the active provider profile are owner preferences read on every message, not fixed at startup; a change to either applies to the next message with no restart. Only a provider in a new adapter format may need a restart.
- [ ] Permissions and approval rules are not in configuration or preferences; they live only in Auth.
- [ ] No layer sits above the owner: product defaults are changeable by the owner on their own hardware.
- [ ] Secrets are referenced rather than stored by value; their values live outside Memory and outside anything git tracks.
- [ ] Adapter selection is config-driven rather than hardcoded in product code.
- [ ] Startup order is deterministic: runtime config -> adapter config -> tools -> Memory -> preferences -> ready.
- [ ] Startup readiness exists before feature code assumes the system is usable.
- [ ] Export and persistent conversation support are available from day one of MVP operation.
- [ ] Local-model offline path is still possible within the configured runtime.

## Matrix IDs

- `C-01`
- `C-02`
- `C-03`
- `C-04`
- `C-05`
- `MO-02`
- `MO-03`
- `D-02`
- `D-06`
- `D-07`

## Common Failure Patterns

- merged config loader for runtime, adapter, and preferences
- secrets written directly into config files
- provider or model choice hardcoded in product code
- model loaded once at startup, so changing it needs a restart
- approval mode or tool permissions stored in config
- startup sequence partially initialized before readiness is declared
- export or persistence treated as later hardening

## Read Next

- `build/primers/configuration.md`
- `build/primers/models.md`
- `build/build-sequence.md`
- `build/compliance-matrix.md`

## Example Files

- `contracts/examples/runtime-config.json`
- `contracts/examples/adapter-config.json`
- `contracts/examples/invalid-runtime-config.json`
- `contracts/examples/invalid-adapter-config.json`
- `contracts/examples/gateway-engine-request.json`
- `contracts/examples/invalid-gateway-engine-request.json`

## Source Docs

- `maintainers/primer-audit-playbook.md`
- `build/primers/configuration.md`
- `build/primers/models.md`
- `build/build-sequence.md`
- `build/compliance-matrix.md`
