# Configuration Review Checklist

> Fast targeted review checklist for runtime config, adapter config, preferences, and startup-readiness sequencing.

## Purpose

Use this when reviewing bootstrap code, config loaders, adapter wiring, secret handling, or startup sequence behavior.

## Checklist

- [ ] Runtime config, adapter config, and preferences are separate layers.
- [ ] Request payloads are not used as a hidden configuration channel (the model choice is the one per-request value).
- [ ] The model is an owner preference read on every message, not fixed at startup; a change applies to the next message with no restart.
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

- `docs/ai-agent-docs/configuration.md`
- `docs/ai-agent-docs/models.md`
- `docs/ai-agent-docs/build-sequence.md`
- `docs/ai-agent-docs/compliance-matrix.md`

## Example Files

- `docs/ai-agent-docs/examples/runtime-config.json`
- `docs/ai-agent-docs/examples/adapter-config.json`
- `docs/ai-agent-docs/examples/invalid-runtime-config.json`
- `docs/ai-agent-docs/examples/invalid-adapter-config.json`
- `docs/ai-agent-docs/examples/gateway-engine-request.json`
- `docs/ai-agent-docs/examples/invalid-gateway-engine-request.json`

## Source Docs

- `docs/ai-agent-docs/primer-audit-playbook.md`
- `docs/ai-agent-docs/configuration.md`
- `docs/ai-agent-docs/models.md`
- `docs/ai-agent-docs/build-sequence.md`
- `docs/ai-agent-docs/compliance-matrix.md`
